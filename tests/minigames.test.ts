import {afterEach,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {DestinationCamera} from '../src/camera/destination-camera';
import {OrbitalObservatory} from '../src/scenes/orbital-observatory';
import {SpacePrototype} from '../src/scenes/space-prototype';
import {SpaceportProps} from '../src/world/spaceport-props';
import {StationActivities} from '../src/interactions/activities';
import type {Input} from '../src/player/input';

function controls(zoom=0,...keys:string[]){return{consumeCamera:()=>({x:0,y:0,zoom}),down:(...codes:string[])=>codes.some(code=>keys.includes(code))} as Input;}
function sceneDOM(){
  const context=new Proxy({},{get:()=>()=>{}}),span={textContent:''};
  const element=()=>({width:0,height:0,className:'',innerHTML:'',getContext:()=>context,querySelector:()=>span,remove:()=>{}});
  vi.stubGlobal('document',{createElement:element});vi.stubGlobal('innerWidth',1920);vi.stubGlobal('innerHeight',919);
  return{append:()=>{}} as unknown as HTMLElement;
}
afterEach(()=>vi.unstubAllGlobals());
describe('destination camera controls',()=>{
  it('scrolls out of POV, back in, clamps zoom and ignores input while reading',()=>{
    const camera=new T.PerspectiveCamera(),view=new DestinationCamera(camera,{distance:0}),anchor=new T.Vector3(0,4,10);
    view.update(1/60,controls(),anchor,true,true);expect(camera.position.equals(anchor)).toBe(true);
    view.update(1/60,controls(19),anchor,true,true);expect(view.firstPerson).toBe(false);expect(camera.position.distanceTo(anchor)).toBeCloseTo(19);
    view.update(1/60,controls(-100),anchor,true,false);expect(view.distance).toBe(19);
    view.update(1/60,controls(-100),anchor,true,true);expect(view.firstPerson).toBe(true);expect(view.distance).toBe(0);
    view.update(1/60,controls(100),anchor,true,true);expect(view.distance).toBe(46);
    view.togglePOV();expect(view.firstPerson).toBe(true);view.togglePOV();expect(view.distance).toBe(19);
  });
  it('keeps a zoomed-out camera in front of solid scenery',()=>{
    const camera=new T.PerspectiveCamera(),view=new DestinationCamera(camera,{distance:46,yaw:0,pitch:0},[{x:0,z:8,w:8,d:2,height:20}]);
    view.update(1/60,controls(),new T.Vector3(0,4,0),true,true);expect(camera.position.z).toBeLessThan(7);
  });
  it('lets the actual observation scene leave POV and move without entering its pedestals',()=>{
    const scene=new OrbitalObservatory(sceneDOM(),null,null);
    scene.update(1/60,controls(19),true,true);expect(scene.view.firstPerson).toBe(false);
    const figure=scene.scene.children.find(o=>o.name==='Andy')!;expect(figure.visible).toBe(true);
    scene.camera.updateMatrixWorld(true);
    const feet=new T.Vector3(0,1.024,10).project(scene.camera);
    expect(Math.abs(feet.y)).toBeLessThan(.9);
    scene.position.set(-8.96,scene.position.y,-5);scene.view.yaw=0;
    for(let i=0;i<120;i++)scene.update(1/60,controls(0,'KeyW'),true,true);
    expect(scene.position.z).toBeGreaterThan(-8.4);
    scene.update(1/60,controls(-30),true,true);expect(scene.view.firstPerson).toBe(true);expect(figure.visible).toBe(false);
    expect(scene.camera.position.distanceTo(scene.position)).toBeCloseTo(0);scene.dispose();
  });
  it('lets the actual spaceship scene enter/leave POV and respect scenery and movement bounds',()=>{
    const scene=new SpacePrototype(sceneDOM());scene.update(1/60,controls(-100),true,true);
    expect(scene.view.firstPerson).toBe(true);expect(scene.camera.position.x).toBeCloseTo(scene.position.x);
    const ship=scene.scene.getObjectByName('outpost-ship')!;expect(ship.visible).toBe(false);
    scene.update(1/60,controls(19),true,true);expect(scene.view.firstPerson).toBe(false);expect(ship.visible).toBe(true);
    scene.position.set(-20,8,-20);scene.view.yaw=0;
    for(let i=0;i<180;i++)scene.update(1/60,controls(0,'KeyW'),true,true);
    expect(scene.position.z).toBeGreaterThan(-23.3);
    for(let i=0;i<600;i++)scene.update(1/60,controls(0,'KeyD'),true,true);
    expect(scene.position.x).toBeLessThanOrEqual(23);scene.dispose();
  });
});
describe('arcade and station activities',()=>{
  it('can reach amber, stop successfully and restart while ambient motion is reduced',()=>{
    sceneDOM();const station=new StationActivities(),props=new SpaceportProps(new T.Group(),station.definitions);
    props.update(1,true);expect(props.signal).toBe(0);
    expect(station.command('arcade','step',props.signal)).not.toBeNull();props.activate('arcade',false,'step',true);
    expect(props.signal).toBe(1);
    expect(station.command('arcade','stop',props.signal)?.message).toContain('Synchronized');props.activate('arcade',false,'stop',true);
    props.update(1,true);expect(props.signal).toBe(1);
    props.activate('arcade',false,'restart',false);props.update(.6,false);expect(props.signal).toBe(1);
    props.update(.6,false);expect(props.signal).toBe(2);
  });
  it('supports each exposed console command and immediate reduced-motion outcomes',()=>{
    sceneDOM();const station=new StationActivities(),props=new SpaceportProps(new T.Group(),station.definitions);
    for(const d of station.definitions)for(const c of d.commands)expect(station.command(d.id,c.id)).not.toBeNull();
    const receiver=props.root.getObjectByName('radio-receiver')!,before=receiver.rotation.y;
    props.activate('radio',false,'tune',true);expect(receiver.rotation.y).toBeGreaterThan(before);
    props.activate('noodles',false,'order',true);expect(props.root.getObjectByName('noodle-order')!.visible).toBe(true);
  });
});
