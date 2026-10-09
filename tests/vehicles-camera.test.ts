import { describe, it, expect } from 'vitest';
import * as T from 'three';
import { Vehicle, vehicleSpecs } from '../src/vehicles/vehicle';
import { FollowCamera } from '../src/camera/follow-camera';
import type { Input } from '../src/player/input';
import {WORLD_STYLE} from '../src/config/station';
import {safeExit,blocked} from '../src/world/collision';
import {Locomotion} from '../src/player/locomotion';
import {ENGINE_PODS} from '../src/world/station-hull';
import {TRANSIT_OBSTACLES} from '../src/world/transit';

function controls(...keys: string[]) { return { down: (...codes: string[]) => codes.some(c => keys.includes(c)), consumeCamera: () => ({ x: 0, y: 0, zoom: 0 }) } as Input; }
describe('arcade vehicle behavior', () => {
  it('drives and exits underneath the elevated express without colliding with the overhead rail',()=>{
    const car=new Vehicle({...vehicleSpecs[0],x:99.84,z:30,heading:0},new T.Group());
    for(let i=0;i<60;i++)car.update(1/60,controls('KeyW'),TRANSIT_OBSTACLES,true);
    expect(car.position.z).toBeGreaterThan(37);
    const exit=safeExit(car.position,car.heading,[...TRANSIT_OBSTACLES,car.obstacle()]);
    expect(exit).not.toBeNull();expect(blocked(exit!.x,exit!.z,.65,[car.obstacle()])).toBe(false);
    const player=new Locomotion();player.teleport(99.84,30);
    for(let i=0;i<60;i++)player.update(1/60,{x:0,z:1,running:false,jump:false,jumpHeld:false},0,TRANSIT_OBSTACLES,true);
    expect(player.z).toBeGreaterThan(38);
    const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,TRANSIT_OBSTACLES);follow.yaw=0;follow.pitch=1.1;follow.distance=46;
    follow.update(1/60,controls(),new T.Vector3(99.84,.512,30),false,true,true);
    expect(camera.position.y).toBeLessThan(15.36);
  });
  it('exits outside its own body and can immediately walk at diagonal headings and in tight parking',()=>{
    for(const heading of [0,Math.PI/4,Math.PI/2,2.2,Math.PI]) {
      const car=new Vehicle({...vehicleSpecs[0],x:0,z:20,heading},new T.Group());
      const obstacles=[car.obstacle(),{x:3,z:20,w:1,d:8,height:6}];
      const exit=safeExit({x:0,z:20},heading,obstacles)!;
      expect(exit).not.toBeNull();expect(blocked(exit.x,exit.z,.62,obstacles)).toBe(false);
      const player=new Locomotion();player.teleport(exit.x,exit.z);
      for(let i=0;i<30;i++)player.update(1/60,{x:Math.sign(exit.x)||1,z:Math.sign(exit.z-20),running:false,jump:false,jumpHeld:false},0,obstacles,true);
      expect(Math.hypot(player.x-exit.x,player.z-exit.z)).toBeGreaterThan(1);
    }
  });
  it('D turns right and A turns left from behind the forward-facing driver, including reverse',()=>{
    for(const [key,sign]of [['KeyD',-1],['KeyA',1]] as const) {
      const car=new Vehicle({...vehicleSpecs[0],x:0,z:20,heading:0},new T.Group());
      for(let i=0;i<30;i++)car.update(1/60,controls('KeyW',key),[],true);
      expect(car.heading*sign).toBeGreaterThan(.2);expect((car.position.x)*sign).toBeGreaterThan(.2);
      car.heading=0;car.speed=-8;car.update(.1,controls('KeyS',key),[],true);
      expect(car.heading*sign).toBeLessThan(0);
    }
  });
  it('accelerates forward and stops before a building', () => {
    const vehicle = new Vehicle({ ...vehicleSpecs[0], x: 0, z: 0, heading: 0 }, new T.Group());
    for (let i = 0; i < 180; i++) vehicle.update(1 / 60, controls('KeyW'), [{ x: 0, z: 15, w: 10, d: 3, height: 5 }], true);
    expect(vehicle.position.z).toBeGreaterThan(6); expect(vehicle.position.z).toBeLessThan(13.5); expect(vehicle.speed).toBeLessThan(20);
  });
  it('can reverse and steer in open space', () => {
    const vehicle = new Vehicle({ ...vehicleSpecs[0], x: 0, z: 0, heading: 0 }, new T.Group());
    for (let i = 0; i < 60; i++) vehicle.update(1 / 60, controls('KeyS'), [], true);
    expect(vehicle.position.z).toBeLessThan(-2); expect(vehicle.speed).toBe(-8);
    for (let i = 0; i < 30; i++) vehicle.update(1 / 60, controls('KeyS', 'KeyD'), [], true);
    expect(Math.abs(vehicle.heading)).toBeGreaterThan(.3);
  });
});
describe('camera wall mitigation', () => {
  it('orbits and zooms the station overview without changing the street camera',()=>{
    const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,[]),subject=new T.Vector3(0,.512,10);
    const street={yaw:follow.yaw,pitch:follow.pitch,distance:follow.distance};
    follow.overview=true;follow.update(1/60,controls(),subject,false,true,true);
    const start=camera.position.clone();
    const drag={...controls(),consumeCamera:()=>({x:.6,y:-.5,zoom:-8})} as Input;
    follow.update(1/60,drag,subject,false,true,true);
    expect(camera.position.distanceTo(start)).toBeGreaterThan(100);
    expect(follow.overviewPitch).toBeLessThan(0);
    expect(follow.overviewDistance).toBeLessThan(start.distanceTo(new T.Vector3(...WORLD_STYLE.overviewTarget)));
    expect({yaw:follow.yaw,pitch:follow.pitch,distance:follow.distance}).toEqual(street);
    const limit={...controls(),consumeCamera:()=>({x:0,y:10,zoom:100})} as Input;
    follow.update(1/60,limit,subject,false,true,true);expect(follow.overviewPitch).toBe(1.18);expect(follow.overviewDistance).toBe(540);
    follow.overview=false;follow.update(1/60,controls(),subject,false,true,true);
    expect(follow.firstPerson).toBe(false);expect(camera.position.distanceTo(new T.Vector3(0,2.312,10))).toBeCloseTo(19);
  });
  it('keeps landmark focus cameras out of intervening buildings',()=>{
    const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,[{x:3,z:7,w:10,d:2,height:30}]);
    follow.frameLandmark(0,0);follow.update(1/60,controls(),new T.Vector3(),false,false,true);
    expect(camera.position.z).toBeLessThan(6);
    follow.setObstacles([{x:0,z:1,w:3,d:2,height:4}]);follow.update(1/60,controls(),new T.Vector3(),false,false,true);
    expect(camera.position.z).toBe(16);expect(camera.position.y).toBe(13);
  });
  it('scrolls into eye-level POV and back out without entering the ground',()=>{
    const camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,[]),subject=new T.Vector3(0,.512,20);
    const zoom=(amount:number)=>({...controls(),consumeCamera:()=>({x:0,y:0,zoom:amount})}) as Input;
    follow.yaw=0;follow.pitch=0;follow.update(1/60,zoom(-40),subject,false,true,true);
    expect(follow.firstPerson).toBe(true);expect(camera.position.y).toBeCloseTo(3.232);
    expect(camera.position.z).toBe(20);expect(camera.getWorldDirection(new T.Vector3()).z).toBeCloseTo(-1);
    follow.pitch=-.7;follow.update(1/60,controls(),subject,false,true,true);
    expect(camera.getWorldDirection(new T.Vector3()).y).toBeGreaterThan(.5);
    follow.update(1/60,zoom(16),subject,false,true,true);expect(follow.firstPerson).toBe(false);expect(camera.position.y).toBeGreaterThan(.512);
    follow.update(1/60,zoom(100),subject,false,true,true);expect(follow.distance).toBe(46);
  });
  it('frames all four baseplate corners in the desktop world overview',()=>{
    const camera=new T.PerspectiveCamera(52,1920/919,.1,900),follow=new FollowCamera(camera,[]);
    follow.overview=true;follow.update(1/60,controls(),new T.Vector3(),false,true,true);camera.updateMatrixWorld(true);
    for(const x of [-WORLD_STYLE.size[0]/2,WORLD_STYLE.size[0]/2])for(const z of [-WORLD_STYLE.size[1]/2,WORLD_STYLE.size[1]/2]) {
      const projected=new T.Vector3(x,.512,z).project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(1);expect(Math.abs(projected.y)).toBeLessThan(1);
    }
    for(const pod of ENGINE_PODS) {
      const projected=new T.Vector3(pod.x,-46.08,pod.z).project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(1);expect(Math.abs(projected.y)).toBeLessThan(1);
    }
  });
  it('can look up at a skyline while keeping the camera above the ground',()=>{
    const camera=new T.PerspectiveCamera(),subject=new T.Vector3(0,.512,0);
    const follow=new FollowCamera(camera,[]);follow.pitch=-.7;
    follow.update(1/60,controls(),subject,false,true,true);
    expect(camera.position.y).toBeGreaterThan(subject.y+1);
    expect(camera.getWorldDirection(new T.Vector3()).y).toBeGreaterThan(.5);
    follow.setObstacles([{x:0,z:7,w:10,d:2,height:20}]);follow.yaw=0;
    follow.update(1/60,controls(),subject,false,true,true);
    expect(camera.position.z).toBeLessThan(6);expect(camera.position.y).toBeGreaterThan(subject.y+1);
  });
  it('shortens the camera boom when a wall is behind the player', () => {
    const camera = new T.PerspectiveCamera(), subject = new T.Vector3(0, 0, 0);
    const follow = new FollowCamera(camera, [{ x: 0, z: 7, w: 7, d: 2, height: 12 }]); follow.yaw = 0;
    follow.update(1 / 60, controls(), subject, false, true, true);
    expect(camera.position.distanceTo(new T.Vector3(0, 1.8, 0))).toBeLessThan(8);
    follow.setObstacles([]); follow.update(1 / 60, controls(), subject, false, true, true);
    expect(camera.position.distanceTo(new T.Vector3(0, 1.8, 0))).toBeCloseTo(19);
  });
});
