import * as T from 'three';
import { BrickBatch,palette as P } from '../world/brick-kit';
import { libraryPart } from '../world/part-library';
import { STUD as S,PLATE as H,LDRAW_SCALE } from '../world/part-catalog';
import { createMinifigure } from '../player/minifigure';
import { moveWithCollision,type Obstacle } from '../world/collision';
import type { Input } from '../player/input';
export interface VehicleSpec {id:string;name:string;x:number;z:number;heading:number;color:string;driveable:boolean}
export const vehicleSpecs:VehicleSpec[]=[
  {id:'car-0',name:'Ion / scout rover',x:-12.8,z:16.64,heading:Math.PI/2,color:'#fe8a18',driveable:true},
  {id:'car-1',name:'Cargo / utility crawler',x:-58.88,z:32,heading:0,color:'#9ba19d',driveable:true},
  {id:'car-2',name:'Dock service rover',x:49.92,z:-16.64,heading:Math.PI/2,color:'#0a3463',driveable:false},
  {id:'car-3',name:'Orbital station / crew shuttle',x:38.4,z:27.52,heading:0,color:'#008f9b',driveable:true},
];
export class Vehicle {
  readonly root=new T.Group();readonly wheels:T.Group[]=[];readonly position=new T.Vector3();readonly driver=createMinifigure();speed=0;heading:number;
  constructor(readonly spec:VehicleSpec,parent:T.Object3D) {
    this.heading=spec.heading;this.position.set(spec.x,.512,spec.z);const b=new BrickBatch();
    // The native wheel pins are 5 LDU below their origin; the tire radius is
    // 18 LDU. The upper body rests on the holders instead of cutting through
    // four decorative wheels. Mudguards leave real wheel wells.
    const bodyOffset=15*LDRAW_SCALE;
    for(const z of [-3*S,3*S])b.mold('wheelBase',P.ink,0,23*LDRAW_SCALE,z);
    b.withOffset(0,bodyOffset,0,()=>{
    b.stack(P.ink,0,H,0,2,1,8);b.stack(spec.color,0,2*H,0,4,1,4,'stud');
    for(const z of [-3*S,3*S]){b.mold('mudguard',spec.color,0,4*H,z);b.stack('#9ba19d',0,3*H,z,2,1,2);}
    b.stack(spec.color,0,4*H,3*S,4,4,2,'stud');b.stack(spec.color,0,4*H,-3*S,4,2,2,'stud');
    for(const side of [-1,1]) {
      b.stack(spec.color,side*1.5*S,3*H,0,1,3,4,'stud');
      b.mold('roundTile','@amber',side*1.5*S,9*H,3.5*S);
      b.mold('roundTile','@cyan',side*1.5*S,7*H,-3.5*S);
      b.stack('#05131d',side*1.5*S,6*H,-2*S,1,3,2,'stud');
      b.mold('slope','#9ba19d',side*S,8*H,3*S);
    }
    b.mold('chair',P.ink,0,4*H,-S);b.mold('steering',P.ink,0,4*H,S);
    const windshield=libraryPart('windscreen','#559ab7');windshield.scale.setScalar(LDRAW_SCALE);windshield.rotation.x=Math.PI;windshield.position.set(0,14*H+bodyOffset,1.5*S);
    const glass=new T.MeshStandardMaterial({color:'#559ab7',roughness:.15,transparent:true,opacity:.62,depthWrite:false,envMapIntensity:1});windshield.traverse(o=>{if(o instanceof T.Mesh){o.material=glass;o.castShadow=false;}});this.root.add(windshield);
    if(spec.id!=='car-0') {
      for(const side of [-1,1])b.stack(spec.color,side*1.5*S,6*H,-2.5*S,1,8,1);
      b.stack('#0a3463',0,14*H,-S,4,1,4,'stud');
      b.stack('@cyan',0,15*H,-S,2,1,4,'tile');
    }
    if(spec.id==='car-1') {
      b.stack('#05131d',0,15*H,-2*S,4,1,2,'stud');
      b.stack('#fe8a18',0,16*H,-2*S,2,3,2,'stud');
      b.mold('antenna',P.ink,-1.5*S,16*H,-S);
    } else if(spec.id==='car-3') {
      b.mold('dish','@cyan',0,17*H,-S);
      for(const side of [-1,1])b.stack('#f2cd37',side*1.5*S,7*H,0,1,1,3,'tile');
    } else b.mold('antenna','#9ba19d',-1.5*S,8*H,-2.5*S);
    });
    b.build(this.root,'vehicle-body');
    this.driver.root.position.set(0,bodyOffset+.128,-S);this.driver.legs.forEach(leg=>leg.rotation.x=1.3);this.driver.arms.forEach(arm=>arm.rotation.x=-.7);this.driver.root.visible=false;this.root.add(this.driver.root);
    const rubber=new T.MeshStandardMaterial({color:'#05131d',roughness:.72,envMapIntensity:.2});
    for(const x of [-2*S,2*S])for(const z of [-3*S,3*S]) {
      const wheel=new T.Group();wheel.position.set(x,.576,z);wheel.rotation.y=x<0?-Math.PI/2:Math.PI/2;wheel.scale.setScalar(LDRAW_SCALE);
      const tyre=libraryPart('tyre','#05131d');tyre.traverse(o=>{if(o instanceof T.Mesh)o.material=rubber;});wheel.add(tyre,libraryPart('rim','#9ba19d'));this.wheels.push(wheel);this.root.add(wheel);
    }
    this.root.position.copy(this.position);this.root.rotation.y=this.heading;parent.add(this.root);
  }
  obstacle():Obstacle{return{x:this.position.x,z:this.position.z,w:Math.abs(Math.cos(this.heading))*3.2+Math.abs(Math.sin(this.heading))*5.8,d:Math.abs(Math.sin(this.heading))*3.2+Math.abs(Math.cos(this.heading))*5.8,height:4.6};}
  update(dt:number,input:Input,obstacles:Obstacle[],enabled:boolean) {
    if(!enabled){this.speed=0;return;}
    const throttle=Number(input.down('KeyW'))-Number(input.down('KeyS')),steer=Number(input.down('KeyD'))-Number(input.down('KeyA'));
    if(throttle)this.speed=T.MathUtils.clamp(this.speed+throttle*15*dt,-8,20);else this.speed*=Math.exp(-3.4*dt);
    if(Math.abs(this.speed)<.08)this.speed=0;
    // Forward is +Z: increasing yaw turns toward the driver's left.
    this.heading-=steer*dt*1.65*Math.min(1,Math.abs(this.speed)/4)*(this.speed<0?-1:1);
    const oldX=this.position.x,oldZ=this.position.z,p={x:oldX,z:oldZ};
    const walls=obstacles.filter(o=>o.height>this.position.y+.28&&(o.bottom??0)<this.position.y+5.2);
    moveWithCollision(p,Math.sin(this.heading)*this.speed*dt,Math.cos(this.heading)*this.speed*dt,1.6,walls);
    if(this.speed&&Math.hypot(p.x-oldX,p.z-oldZ)<Math.abs(this.speed*dt)*.2)this.speed*=.65;
    this.position.x=p.x;this.position.z=p.z;this.root.position.copy(this.position);this.root.rotation.y=this.heading;this.wheels.forEach(w=>w.rotation.z-=this.speed*dt*1.8);
  }
}
