import * as T from 'three';
import {BrickBatch} from './brick-kit';
import {STUD as S,PLATE as H,snapStud} from './part-catalog';
import {TRANSIT,CITY_LOTS,GATE,STREETS} from './city-layout';
import {landmarks,SHIP} from '../config/world';
import {ACTIVITY_DEFINITIONS} from '../interactions/activities';

// Round each authored street corner inside the intersection. The real build is
// a stepped band of standard bricks/tiles; every carriage follows its centerline.
const vertices=TRANSIT.points.map(([x,z])=>new T.Vector3(x,TRANSIT.y+9*H,z));
export const TRANSIT_PATH:T.Vector3[]=[];
for(let i=0;i<vertices.length;i++) {
  const point=vertices[i],before=vertices[(i+vertices.length-1)%vertices.length],after=vertices[(i+1)%vertices.length];
  const incoming=point.clone().sub(before).normalize(),outgoing=after.clone().sub(point).normalize();
  const start=point.clone().addScaledVector(incoming,-6.4),end=point.clone().addScaledVector(outgoing,6.4);
  for(let a=0;a<=6;a++) {
    const t=a/6;
    TRANSIT_PATH.push(start.clone().multiplyScalar((1-t)**2).addScaledVector(point,2*t*(1-t)).addScaledVector(end,t*t));
  }
}
const segments=TRANSIT_PATH.map((p,i)=>{
  const next=TRANSIT_PATH[(i+1)%TRANSIT_PATH.length],direction=next.clone().sub(p),length=direction.length();
  return{p,next,direction:direction.divideScalar(length),length};
});
export const TRANSIT_OBSTACLES=segments.map(s=>({
  x:(s.p.x+s.next.x)/2,z:(s.p.z+s.next.z)/2,
  w:Math.abs(s.next.x-s.p.x)+TRANSIT.width,d:Math.abs(s.next.z-s.p.z)+TRANSIT.width,
  bottom:TRANSIT.y,height:TRANSIT.y+9*H,label:'elevated express track',
}));
export const TRANSIT_LENGTH=segments.reduce((sum,s)=>sum+s.length,0);
export function sampleTransit(distance:number) {
  let remaining=((distance%TRANSIT_LENGTH)+TRANSIT_LENGTH)%TRANSIT_LENGTH;
  for(const s of segments) {
    if(remaining<=s.length)return{position:s.p.clone().addScaledVector(s.direction,remaining),direction:s.direction.clone()};
    remaining-=s.length;
  }
  return{position:segments[0].p.clone(),direction:segments[0].direction.clone()};
}

const exclusions=[...CITY_LOTS.map(l=>({x:l.x,z:l.z,w:(l.w+2)*S,d:(l.d+2)*S})),
  ...landmarks.map(l=>({x:l.x,z:l.z,w:l.width+S,d:l.depth+S})),
  {x:SHIP.x,z:SHIP.z,w:15.36,d:18},GATE,...STREETS,
  ...ACTIVITY_DEFINITIONS.map(a=>({x:a.x,z:a.z,w:5.12,d:5.12})),
  {x:-66.56,z:15.36,w:3.2,d:26.24},
];
const clear=(x:number,z:number)=>exclusions.every(o=>Math.abs(x-o.x)>=(o.w+1.92)/2||Math.abs(z-o.z)>=(o.d+1.92)/2);
export const TRANSIT_PIERS:{x:number;z:number;trackX:number;trackZ:number}[]=[];
for(let distance=12;distance<TRANSIT_LENGTH;distance+=25.6) {
  const {position:p,direction:d}=sampleTransit(distance);
  if(Math.abs(d.x)>.01&&Math.abs(d.z)>.01)continue;
  for(const side of [-1,1]) {
    const x=snapStud(p.x-d.z*side*6.4),z=snapStud(p.z+d.x*side*6.4);
    if(clear(x,z)){TRANSIT_PIERS.push({x,z,trackX:snapStud(p.x),trackZ:snapStud(p.z)});break;}
  }
}

export function buildTransit(root:T.Group) {
  const b=new BrickBatch(),cells=new Map<string,{x:number;z:number;edge:boolean}>();
  TRANSIT_OBSTACLES.forEach(o=>b.obstacle(o));
  for(const s of segments) {
    const left=Math.floor((Math.min(s.p.x,s.next.x)-TRANSIT.width/2)/S),right=Math.ceil((Math.max(s.p.x,s.next.x)+TRANSIT.width/2)/S);
    const back=Math.floor((Math.min(s.p.z,s.next.z)-TRANSIT.width/2)/S),front=Math.ceil((Math.max(s.p.z,s.next.z)+TRANSIT.width/2)/S);
    for(let x=left;x<right;x++)for(let z=back;z<front;z++){
      const point=new T.Vector3((x+.5)*S,s.p.y,(z+.5)*S),along=T.MathUtils.clamp(point.clone().sub(s.p).dot(s.direction),0,s.length);
      const distance=point.distanceTo(s.p.clone().addScaledVector(s.direction,along));
      if(distance>TRANSIT.width/2)continue;
      const key=`${x}/${z}`,old=cells.get(key),edge=distance>TRANSIT.width/2-S;
      cells.set(key,{x,z,edge:old?old.edge&&edge:edge});
    }
  }
  const rows=new Map<number,{x:number;edge:boolean}[]>();
  for(const c of cells.values()){if(!rows.has(c.z))rows.set(c.z,[]);rows.get(c.z)!.push(c);}
  for(const [z,row]of rows) {
    row.sort((a,c)=>a.x-c.x);
    for(let i=0;i<row.length;){const first=row[i];let end=i+1;while(end<row.length&&row[end].x===row[end-1].x+1&&row[end].edge===first.edge)end++;
      const w=end-i,x=(first.x+w/2)*S;
      b.stack('#0a3463',x,TRANSIT.y,(z+.5)*S,w,8,1);
      b.stack(first.edge?'#008f9b':'#9ba19d',x,TRANSIT.y+8*H,(z+.5)*S,w,1,1,'tile');i=end;
    }
  }
  for(const p of TRANSIT_PIERS) {
    b.stack('#05131d',p.x,.512,p.z,3,2,3,'stud');
    b.stack('#9ba19d',p.x,4*H,p.z,2,53,2,'stud');
    const vertical=Math.abs(p.trackZ-p.z)>1;
    b.stack('#0a3463',(p.trackX+p.x)/2,57*H,(p.trackZ+p.z)/2,vertical?2:12,3,vertical?12:2);
    b.obstacle({x:(p.trackX+p.x)/2,z:(p.trackZ+p.z)/2,w:(vertical?2:12)*S,d:(vertical?12:2)*S,bottom:57*H,height:TRANSIT.y,label:'express support cap'});
    b.obstacle({x:p.x,z:p.z,w:1.92,d:1.92,bottom:.512,height:57*H,label:'express support'});
  }
  return b.build(root,'orbital-transit-loop');
}
