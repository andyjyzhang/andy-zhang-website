import * as T from 'three';
import {BrickBatch,sign} from './brick-kit';
import {PLATE as H,STUD as S} from './part-catalog';
import {GATE} from './city-layout';
import type {Obstacle} from './collision';

export function buildOrbitalGate(root:T.Group,obstacles:Obstacle[]) {
  const b=new BrickBatch(),z=GATE.z,center=47.36,radius=33.28,inner=26.24;
  b.stack('#0a3463',0,.512,z,156,12,26);b.stack('#0a3463',0,3.584,z,18,41,12,'stud');
  for(const side of [-1,1]) {
    b.stack('#05131d',side*41.6,3.584,z,14,84,20);
    b.stack('#008f9b',side*41.6,3.584,z+6.08,10,78,1);
    b.stack('#f2cd37',side*41.6,3.584,z+6.72,2,78,1);
  }
  for(let row=0;row<87;row++) {
    const y=14.08+row*3*H,dy=y+1.5*H-center;
    if(Math.abs(dy)>radius)continue;
    const outer=Math.floor(Math.sqrt(radius*radius-dy*dy)/S),cut=Math.abs(dy)<inner?Math.ceil(Math.sqrt(inner*inner-dy*dy)/S):0;
    for(const [a,c] of cut?[[-outer,-cut],[cut,outer]]:[[-outer,outer]])if(c>a) {
      const px=(a+c)*S/2;b.stack('#0a3463',px,y,z,c-a,3,8);
      b.stack(row%4===0?'#f2cd37':'#008f9b',px,y,z+4.5*S,c-a,3,1);
      b.stack('@cyan',px,y,z+5.5*S,c-a,3,1);
    }
  }
  b.build(root,'orbital-gate');sign(root,'ORBITAL STATION / ORBITAL GATE',0,5.12,-64.62,30.72,1.28,'#05131d','#aee9ef');
  obstacles.push({...GATE,height:81,label:'orbital gate'});
}
