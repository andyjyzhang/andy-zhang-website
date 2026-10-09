import {afterEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import * as T from 'three';
import {BuildIntro,hasVisited} from '../src/scenes/build-intro';
import {BUILD_DURATION,buildCamera,BUILD_LANDING} from '../src/scenes/build-timeline';
import {FollowCamera} from '../src/camera/follow-camera';
import {PieceAssembly} from '../src/scenes/piece-assembly';

let dom:JSDOM;
function fixture() {
  dom=new JSDOM('<!doctype html><html><body><main></main></body></html>',{url:'http://localhost/'});
  vi.stubGlobal('document',dom.window.document);vi.stubGlobal('localStorage',dom.window.localStorage);
  const scene=new T.Scene(),world=new T.Group(),stage=new T.Group(),extra=new T.Group();scene.add(world);world.add(stage,extra);
  const pieces=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),20);
  for(let i=0;i<20;i++)pieces.setMatrixAt(i,new T.Matrix4().makeTranslation(i,0,0));
  stage.add(pieces);const original=pieces.instanceMatrix.array.slice(),done=vi.fn(),camera=new T.PerspectiveCamera();
  const intro=new BuildIntro(world,[stage],document.querySelector('main')!,scene,camera,done);
  return{intro,stage,extra,pieces,original,done,camera};
}
afterEach(()=>{dom?.window.close();vi.unstubAllGlobals();});

describe('real build intro lifecycle',()=>{
  it('keeps the reveal camera above the deck and matches the follow view without a handoff jump',()=>{
    const eye=new T.Vector3(),target=new T.Vector3();
    for(const aspect of [16/9,320/568])for(let time=0;time<=BUILD_DURATION;time+=1/60){buildCamera(time,eye,target,aspect);expect(eye.y).toBeGreaterThan(4);expect([...eye,...target].every(Number.isFinite)).toBe(true);}
    const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,[]);buildCamera(BUILD_DURATION,eye,target);camera.position.copy(eye);camera.lookAt(target);const before=camera.quaternion.clone();
    follow.resetForPlayer(new T.Vector3(0,.512,10));expect(camera.position.distanceTo(eye)).toBeLessThan(.00001);expect(camera.quaternion.angleTo(before)).toBeLessThan(.00001);
  });
  it('builds negative-height foundation courses in order and preserves exact geometry on replay',()=>{
    const group=new T.Group(),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),3);group.add(mesh);
    for(let i=0;i<3;i++)mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(0,-20+i*10,0));
    const original=mesh.instanceMatrix.array.slice(),assembly=new PieceAssembly(group,1,2);assembly.hide();assembly.update(1.03);expect(mesh.count).toBe(1);
    const point=new T.Vector3().setFromMatrixPosition(new T.Matrix4().fromArray(mesh.instanceMatrix.array));expect(point.y).toBeLessThan(-18.8);
    assembly.restore();expect(mesh.instanceMatrix.array).toEqual(original);
  });
  it('bounds snap cues during throttled frames and has Andy landed before control',()=>{
    const {intro}=fixture(),cues:string[]=[];
    // Actual hook behavior is tested on a new intro using the same real stages.
    const world=new T.Group(),stage=new T.Group(),player=new T.Group();player.name='Andy';world.add(stage,player);
    const pieces=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),100);stage.add(pieces);
    for(let i=0;i<100;i++)pieces.setMatrixAt(i,new T.Matrix4().makeTranslation(i,0,0));
    intro.overlay.remove();const reveal=new BuildIntro(world,[stage],document.querySelector('main')!,new T.Scene(),new T.PerspectiveCamera(),vi.fn(),{cue:c=>cues.push(c)});
    reveal.show(false);reveal.start();reveal.update(2);expect(cues.filter(c=>c==='snap').length).toBeLessThanOrEqual(2);
    reveal.update(BUILD_LANDING-2);expect(player.visible).toBe(true);expect(player.position.y).toBe(.512);expect(cues.filter(c=>c==='land')).toHaveLength(1);
    reveal.update(1);expect(reveal.active).toBe(false);expect(cues.filter(c=>c==='finish')).toHaveLength(1);
  });
  it('starts at one brick, accepts Build, reveals pieces and restores the complete world with returning-visitor persistence',()=>{
    const {intro,stage,extra,pieces,original,done,camera}=fixture();expect(hasVisited()).toBe(false);
    intro.show(false);expect(intro.active).toBe(true);expect(stage.visible||extra.visible).toBe(false);
    expect(intro.brick.visible).toBe(true);expect(intro.brick.children.filter(c=>c.visible)).toHaveLength(1);
    expect(document.activeElement).toBe(intro.overlay.querySelector('.build-button'));
    expect(intro.overlay.querySelector('progress,[role="progressbar"]')).toBeNull();
    (intro.overlay.querySelector('.build-button') as HTMLButtonElement).click();expect(intro.building).toBe(true);
    intro.update(.15);expect(intro.brick.children.filter(c=>c.visible)).toHaveLength(2);
    intro.update(.92);expect(pieces.count).toBeGreaterThan(0);expect(pieces.count).toBeLessThan(20);
    expect(camera.position.length()).toBeGreaterThan(10);
    intro.update(BUILD_DURATION);expect(intro.active).toBe(false);expect(intro.overlay.hidden).toBe(true);
    expect(stage.visible&&extra.visible).toBe(true);expect(pieces.instanceMatrix.array).toEqual(original);
    expect(done).toHaveBeenCalledTimes(1);expect(hasVisited()).toBe(true);
  });
  it('supports skip before/during construction, replay and reduced motion without leaving missing pieces',()=>{
    const {intro,pieces,original,done}=fixture();
    for(const building of [false,true]) {
      intro.show(false);if(building){intro.start();intro.update(1.8);}
      (intro.overlay.querySelector('.skip-intro') as HTMLButtonElement).click();
      expect(intro.active).toBe(false);expect(pieces.count).toBe(20);expect(pieces.instanceMatrix.array).toEqual(original);
    }
    intro.show(true);expect(intro.active).toBe(false);expect(intro.overlay.hidden).toBe(true);
    expect(pieces.instanceMatrix.array).toEqual(original);expect(done).toHaveBeenCalledTimes(3);
  });
});
