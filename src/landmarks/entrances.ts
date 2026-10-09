import {BrickBatch} from '../world/brick-kit';
import {STUD as S,PLATE as H} from '../world/part-catalog';
import {standingPart,frontPart} from '../world/part-placement';
import type {LandmarkId} from '../config/world';

// Signature assemblies sit on the doorway posts, leaving the walk-in bays open.
export function landmarkEntrance(b:BrickBatch,id:LandmarkId,w:number,d:number) {
  const z=(d-1)*S/2,edge=(w-1)*S/2;
  const stack=(color:string,x:number,y:number,z:number,w:number,h:number,d:number,top:'stud'|'hidden'='hidden')=>{
    b.stack(color,x,y,z,w,h,d,top);
    b.obstacle({x,z,w:w*S,d:d*S,bottom:y,height:y+h*H+(top==='stud'?.128:0),label:'landmark entrance assembly'});
  };
  const color=id==='garage'?'#f2cd37':id==='poker'?'#720e0f':id==='hobby'?'#fe8a18':'#0a3463';
  for(const side of [-1,1])stack(color,side*edge,23*H,z,1,4,1);
  stack(color,0,27*H,z,w+2,1,3,'stud');
  if(id==='house') {
    for(let i=-2;i<=2;i++)standingPart(b,'slope','#f4f4f4',i*4*S,28*H,z);
    // Paired navigation lights on the studio's ridged canopy.
    for(const side of [-1,1])standingPart(b,'roundPlate','@cyan',side*edge,28*H,z);
  } else if(id==='garage') {
    for(const side of [-1,1])stack('#05131d',side*(w/2-3)*S,28*H,z,2,9,2,'stud');
    stack('#f2cd37',0,37*H,z,w-4,3,2,'stud');
    for(let i=-3;i<=3;i++)frontPart(b,'roundTile',i%2?'@amber':'#05131d',i*3*S,38*H,z+S);
  } else if(id==='poker') {
    stack('#f2cd37',0,28*H,z,w-6,1,2,'stud');
    for(const side of [-1,1]) {
      const x=side*(w/2-3)*S;
      stack('#f4f4f4',x,29*H,z,3,6,2,'stud');
      frontPart(b,'roundTile',side<0?'#c91a09':'#05131d',x,32*H,z+S);
    }
    stack('#720e0f',0,29*H,z,6,6,2,'stud');
    frontPart(b,'dish','#f2cd37',0,32*H,z+S);
  } else if(id==='hobby') {
    // A connected brick controller silhouette with four separate button tiles.
    stack('#05131d',0,28*H,z,16,3,3,'stud');
    stack('#05131d',0,31*H,z,12,3,3,'stud');
    for(const side of [-1,1])stack('#05131d',side*7*S,31*H,z,2,1,3,'stud');
    for(const [x,y,color] of [[-4,32,'#f4f4f4'],[4,32,'#c91a09'],[2,30,'#008f9b'],[6,30,'#f2cd37']] as const)
      frontPart(b,'roundTile',color,x*S,y*H,z+1.5*S);
  } else {
    // Book spines and connected shelf read as an archive from the street.
    for(let i=-4;i<=4;i++) {
      const height=6+(i+4)%3*3,x=i*2*S;
      stack(['#e4cd9e','#008f9b','#0a3463'][((i+4)%3)],x,28*H,z,2,height,2,'stud');
      frontPart(b,'roundTile','#f2cd37',x,(30+height/2)*H,z+S);
    }
  }
}
