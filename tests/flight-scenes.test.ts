import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import * as T from 'three';
import {FLIGHT_LEVELS} from '../src/config/flight-levels';
import {FlightEnvironment} from '../src/scenes/salvage-environment';
import {brickDebrisGeometry,flightGate} from '../src/scenes/flight-objectives';
import {SpaceGame} from '../src/scenes/space-game';
import {Input} from '../src/player/input';

let dom:JSDOM;
beforeEach(()=>{
  dom=new JSDOM('<!doctype html><html><body><canvas role="application" tabindex="0"></canvas><div id="app"></div></body></html>',{url:'http://localhost/world.html?dev=ui'});
  vi.stubGlobal('window',dom.window);vi.stubGlobal('document',dom.window.document);vi.stubGlobal('innerWidth',1440);vi.stubGlobal('innerHeight',900);
  vi.spyOn(dom.window.HTMLCanvasElement.prototype,'getContext').mockImplementation(()=>({fillRect:()=>{},fillText:()=>{}}) as unknown as CanvasRenderingContext2D);
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();dom.window.close();});

function inventory(root:T.Object3D){
  let draws=0,triangles=0,instances=0;
  root.traverseVisible(object=>{
    if(!(object instanceof T.Mesh))return;draws++;
    const count=object instanceof T.InstancedMesh?object.count:1;instances+=count;
    triangles+=(object.geometry.index?.count??object.geometry.getAttribute('position').count)/3*count;
  });return{draws,triangles,instances};
}

describe('five flight scenes without a GPU',()=>{
  it('builds distinct bounded environments and releases replaced resources without touching shared parts',()=>{
    const scene=new T.Scene(),environment=new FlightEnvironment(scene),profiles:Record<string,ReturnType<typeof inventory>>={};
    for(const level of FLIGHT_LEVELS){
      const old=environment.root,moon=old?.getObjectByName('salvage-moon') as T.Mesh|undefined;
      const dispose=moon?vi.spyOn(moon.geometry,'dispose'):null;
      let shared:T.BufferGeometry|undefined;old?.traverse(object=>{if(object instanceof T.InstancedMesh)shared=object.geometry;});
      const sharedDispose=shared?vi.spyOn(shared,'dispose'):null;
      environment.setLevel(level);const root=environment.root!;
      expect(scene.children).toEqual([root]);expect(root.name).toBe(`flight-environment-${level.id}`);expect(root.matrixAutoUpdate).toBe(false);
      expect(root.getObjectByName(level.kind==='salvage'?'capital-ship-wreck':`${level.kind}-landmark`)).toBeDefined();
      if(level.kind!=='salvage')expect(root.getObjectByName('capital-ship-wreck')).toBeUndefined();
      if(old){expect(old.parent).toBeNull();expect(dispose).toHaveBeenCalledOnce();expect(sharedDispose).not.toHaveBeenCalled();}
      profiles[level.id]=inventory(root);expect(profiles[level.id].draws).toBeLessThan(200);expect(profiles[level.id].triangles).toBeLessThan(1_000_000);
      dispose?.mockRestore();sharedDispose?.mockRestore();
    }
    console.info('Flight environment inventory (un-culled):',JSON.stringify(profiles));
    environment.dispose();expect(scene.children).toHaveLength(0);expect(environment.root).toBeNull();environment.dispose();
  });
  it('keeps the gate aperture clear and active light group independently switchable',()=>{
    const resources:{dispose:()=>void}[]=[],gate=flightGate(resources,1);gate.root.updateMatrixWorld(true);
    expect(gate.active.children.length).toBeGreaterThan(0);expect(gate.root.matrixAutoUpdate).toBe(true);
    const ray=new T.Raycaster(new T.Vector3(0,0,20),new T.Vector3(0,0,-1));expect(ray.intersectObject(gate.root,true)).toHaveLength(0);
    ray.ray.origin.y=12;expect(ray.intersectObject(gate.root,true).length).toBeGreaterThan(0);
    gate.active.visible=false;expect(gate.root.visible).toBe(true);
    gate.root.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});resources.forEach(resource=>resource.dispose());
    const debris=brickDebrisGeometry();expect(debris.getAttribute('position').count).toBeGreaterThan(100);expect(Number.isFinite(debris.boundingSphere!.radius)).toBe(true);
    expect(debris.boundingSphere!.radius).toBeLessThan(3);debris.dispose();
  });
  it('previews all five levels through the real HUD and updates actor pools, camera, briefing and radar safely',()=>{
    const game=new SpaceGame(document.querySelector('#app')!),input=new Input(document.querySelector('canvas')!);
    for(let level=1;level<=5;level++){
      game.overlay.querySelector<HTMLButtonElement>(`[data-flight-level="${level}"]`)!.click();
      expect(game.game.mission).toBe(level);expect(game.scene.getObjectByName(`flight-environment-${game.game.level.id}`)).toBeDefined();
      expect(game.overlay.querySelector('[data-flight-mission]')!.textContent).toBe(`level ${level} / 5`);
      expect(game.overlay.querySelector('#flight-briefing-title')!.textContent).toBe(game.game.level.name);
      expect(document.activeElement?.getAttribute('data-flight-action')).toBe('start');
      game.overlay.querySelector<HTMLButtonElement>('[data-flight-action="start"]')!.click();
      game.update(.016,input,false);game.update(.016,input,true);
      expect(game.game.phase).toBe('playing');expect(game.overlay.dataset.kind).toBe(game.game.level.kind);
      expect(game.overlay.querySelector('[data-flight-progress]')!.textContent).toBe(game.game.progress);
      expect(game.scene.getObjectByName('freight-shuttle')!.visible).toBe(level===4);
      expect(game.scene.getObjectByName('cruiser-reactor-core')!.visible).toBe(level===5);
      expect((game.scene.getObjectByName('salvage-debris') as T.InstancedMesh).count).toBe(game.game.hazards.length);
      expect(game.scene.getObjectByName('salvage-ship')!.matrixAutoUpdate).toBe(true);
      const gates=Array.from({length:6},(_,i)=>game.scene.getObjectByName(`flight-gate-${i+1}`)!.visible);
      expect(gates.filter(Boolean)).toHaveLength(level===2?6:0);
      expect(Number.isFinite(game.camera.position.length())).toBe(true);
      game.overlay.querySelector<HTMLButtonElement>('[data-flight-action="restart"]')!.click();
      expect(game.game.phase).toBe('briefing');expect(game.game.mission).toBe(level);
    }
    game.dispose();expect(game.scene.children).toHaveLength(0);expect(document.querySelector('.flight-overlay')).toBeNull();
  });
});
