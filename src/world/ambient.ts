import * as T from 'three';
import {createMinifigure} from '../player/minifigure';
import {residentAppearances,type Appearance} from '../config/characters';
import {gaitPose} from '../player/gait';
import {BrickBatch,sign} from './brick-kit';
import {PLATE as H,STUD as S} from './part-catalog';
import {sampleTransit} from './transit';
import {standingPart} from './part-placement';
import type {Obstacle,Point} from './collision';

export const stationCrew=[
  {id:'crew-dispatch',name:'Dispatch / Mira',x:8.96,z:6.4,task:'The dispatcher watches departures from the concourse. Say hello for a little wave.',appearance:{...residentAppearances[0],torso:'flight',torsoColor:'#008f9b',legColor:'#0a3463'}},
  {id:'crew-courier',name:'Courier / Jax',x:-66.56,z:25.6,task:'This courier carries supply parcels from the freight exchange to the scanning checkpoint, then returns for another delivery.',appearance:residentAppearances[1]},
  {id:'crew-mechanic',name:'Mechanic / Rook',x:27.52,z:-28.8,task:'The mechanic runs diagnostics beside the survey drone. Try the drone-test console to see it fly.',appearance:{...residentAppearances[2],torso:'flight',face:'confident',hair:'helmet',hairColor:'#f4f4f4'}},
  {id:'crew-loader',name:'Cargo / Sol',x:-64,z:29.44,task:'The cargo operator checks the delivery pad and signals the gantry. The freight console dispatches a supply crate.',appearance:{...residentAppearances[2],hair:'cap',hairColor:'#f2cd37',torso:'jacket',torsoColor:'#9ba19d',face:'glasses',accessory:'headphones'}},
  {id:'crew-scan',name:'Security / Vega',x:49.92,z:-5.12,task:'A patient checkpoint scan keeps the docking lane clear. The scanner sweeps cargo rather than pacing the street.',appearance:{...residentAppearances[2],hair:'helmet',hairColor:'#0a3463',torso:'flight',torsoColor:'#0a3463',face:'visor',legColor:'#9ba19d'}},
] as const;

export class AmbientLife {
  readonly root=new T.Group();readonly train=new T.Group();
  private coaches:T.Group[]=[];
  readonly workers=stationCrew.map(spec=>({spec,model:createMinifigure(spec.appearance as Appearance),wave:0,clock:0}));
  private clock=0;
  get obstacles():Obstacle[]{return this.workers.map(({model})=>({x:model.root.position.x,z:model.root.position.z,w:1.1,d:1.1,radius:.55,height:model.root.position.y+3.8,bottom:model.root.position.y,label:'station crew'}));}
  constructor(parent:T.Object3D) {
    this.root.name='station-life';parent.add(this.root);
    for(const worker of this.workers) {
      const {spec,model}=worker;model.root.position.set(spec.x,.512,spec.z);model.root.rotation.y=spec.id==='crew-mechanic'?-.64:spec.id==='crew-loader'?Math.PI:Math.PI;
      this.root.add(model.root);
      if(spec.id==='crew-dispatch')model.legs.forEach(leg=>leg.rotation.x=-1.35);
      if(spec.id==='crew-courier'||spec.id==='crew-scan') {
        const tool=new BrickBatch();tool.stack(spec.id==='crew-courier'?'#fe8a18':'#9ba19d',0,0,0,2,3,2,'stud');
        tool.stack('@cyan',0,3*H,0,1,1,1,'tile');const item=tool.build(model.root);item.position.set(.64,1.92,-.96);
      }
    }
    for(let i=0;i<3;i++) {
      const train=new BrickBatch(),coach=new T.Group();
      train.stack('#05131d',0,0,0,18,2,6);train.stack('#008f9b',0,2*H,0,18,3,6);
      for(const side of [-1,1])for(let a=-4;a<=4;a++)train.stack(a===0?'#05131d':'#0a3463',a*2*S,5*H,side*2.5*S,2,7,1);
      train.stack('#f4f4f4',0,12*H,0,18,1,6,'stud');train.stack('#f2cd37',0,13*H,0,8,1,2,'tile');
      for(const side of [-1,1])standingPart(train,'slope','#008f9b',side*5.12,13*H,0,side<0?Math.PI/2:-Math.PI/2);
      train.build(coach,'express-carriage');this.train.add(coach);this.coaches.push(coach);
      if(i===0)sign(coach,'ORBITAL EXPRESS',0,1.024,1.95,8.96,.64,'#0a3463','#f2cd37');
    }
    this.train.name='orbital-express';this.root.add(this.train);this.positionTrain();
  }
  private positionTrain() {
    const distance=this.clock*12+16,lead=sampleTransit(distance);this.train.position.copy(lead.position);
    this.coaches.forEach((coach,i)=>{
      const sample=sampleTransit(distance-i*13.44);coach.position.copy(sample.position).sub(lead.position);
      coach.rotation.y=Math.atan2(-sample.direction.z,sample.direction.x);
    });
  }
  get rideView() {
    const distance=this.clock*12+16,eye=sampleTransit(distance-25).position,target=sampleTransit(distance+6).position;
    eye.y+=6.4;target.y+=1.6;return{eye,target};
  }
  greet(id:string,reduced:boolean) {const worker=this.workers.find(w=>w.spec.id===id);if(worker){worker.wave=reduced?0:2.5;worker.model.arms[1].rotation.x=-1.5;}}
  update(dt:number,reduced:boolean,player:Point,vehicles:Obstacle[]=[]) {
    if(reduced)return;
    this.clock+=dt;
    // A scheduled elevated shuttle; only one moving transit assembly.
    this.positionTrain();
    for(const worker of this.workers) {
      const {model,spec}=worker;worker.clock+=dt;worker.wave=Math.max(0,worker.wave-dt);
      if(spec.id==='crew-courier') {
        const phase=worker.clock%36,travel=phase<15?phase/15:phase<18?1:phase<33?1-(phase-18)/15:0;
        const z=25.6-travel*20.48;
        if(Math.hypot(player.x-spec.x,player.z-z)<1.65||vehicles.some(v=>Math.abs(v.x-spec.x)<v.w/2+1&&Math.abs(v.z-z)<v.d/2+1)){worker.clock-=dt;continue;}
        model.root.position.z=z;model.root.rotation.y=phase>=15&&phase<18?-1.82:phase<18?Math.PI:0;
        const walking=phase<15||(phase>=18&&phase<33),pose=gaitPose(travel*20.48,1.4,walking?1:0,false,0,false);
        model.legs.forEach((leg,i)=>leg.rotation.x=pose.legs[i]);model.arms.forEach(arm=>arm.rotation.x=-.8);
      } else if(spec.id==='crew-mechanic') {
        model.arms[0].rotation.x=-.6-Math.max(0,Math.sin(worker.clock*1.6))*.7;model.arms[1].rotation.x=-.4;
        model.head.rotation.y=Math.sin(worker.clock*.6)*.2;
      } else if(spec.id==='crew-loader') {
        model.arms[0].rotation.x=-.5;model.arms[1].rotation.x=-(.5+Math.max(0,Math.sin(worker.clock*.8))*1.1);model.head.rotation.y=Math.sin(worker.clock*.5)*.35;
      } else if(spec.id==='crew-scan') {
        model.arms[0].rotation.x=-.85;model.arms[1].rotation.x=-.65;model.body.rotation.y=Math.sin(worker.clock*.45)*.35;
      } else {model.arms[0].rotation.x=-.6;model.arms[1].rotation.x=-.7;model.head.rotation.y=Math.sin(worker.clock*.35)*.25;}
      if(worker.wave>0)model.arms[1].rotation.x=-2.3+Math.sin(worker.wave*12)*.18;
    }
  }
}
