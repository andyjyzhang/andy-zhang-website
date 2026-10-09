import * as T from 'three';
import { BrickBatch,palette as P,sign } from '../world/brick-kit';
import { STUD as S,PLATE as H,snapStud } from '../world/part-catalog';
export function table(b:BrickBatch,x:number,z:number,w=8,d=4) {
  x=snapStud(x);z=snapStud(z);
  for(const dx of [-w/2+1,w/2-1])for(const dz of [-d/2+1,d/2-1])b.stack(P.ink,x+dx*S,H,z+dz*S,2,6,2);
  b.stack(P.wood,x,7*H,z,w,1,d,'tile');
  b.obstacle({x,z,w:w*S,d:d*S,height:8*H,bottom:H,label:'table'});
}
export function computer(b:BrickBatch,root:T.Group,x:number,z:number) {
  x=snapStud(x);z=snapStud(z);
  b.stack(P.ink,x,8*H,z,2,1,2,'tile');b.stack(P.ink,x,9*H,z,1,3,1);
  b.mold('sideStud',P.ink,x,13*H,z);
  sign(root,'> BUILD_',x,14*H,z+.34,4*S,2*S,P.ink,'#a0bcac');
  b.stack(P.white,x,8*H,z+2*S,3,1,1,'tile');
}
export function shelf(b:BrickBatch,x:number,z:number,w=4) {
  for(let row=0;row<4;row++) {
    b.stack('#9ba19d',x,(1+row*4)*H,z,w,1,3,'stud');
    for(const side of [-1,1])b.stack('#0a3463',x+side*(w-1)*S/2,(2+row*4)*H,z,1,3,3,row===3?'stud':'hidden');
    b.stack('#0a3463',x,(2+row*4)*H,z-S,w-2,3,1);
    for(let i=0;i<w-2;i++)b.stack(['#008f9b','#f2cd37','#720e0f',P.white][i%4],x+(i-(w-3)/2)*S,(2+row*4)*H,z+S/2,1,2,2,'tile');
  }
  b.obstacle({x,z,w:w*S,d:3*S,height:17*H,bottom:H,label:'bookcase'});
}
function seat(b:BrickBatch,x:number,z:number,color=P.ink,rotation=0){b.mold('chair',color,snapStud(x),4*H,snapStud(z),rotation);b.obstacle({x,z,w:1.28,d:1.92,height:2.816,bottom:H,label:'chair'});}
export function workshopProps(b:BrickBatch,animated:T.Group,root:T.Group) {
  b.stack(P.ink,-5.12,H,-3.2,4,15,3);
  b.obstacle({x:-5.12,z:-3.2,w:4*S,d:3*S,height:16*H,bottom:H,label:'server rack'});
  for(let i=0;i<5;i++){b.stack('#6c6e68',-5.12,(2+i*3)*H,-2.24,4,1,1,'tile');b.mold('roundTile','@cyan',-5.76,(3+i*3)*H,-1.92);}
  table(b,1.28,-1.28,10,4);computer(b,root,0,-1.28);
  b.stack('#f2cd37',3.84,8*H,-1.28,2,2,2,'stud');
  b.mold('mug',P.white,2.56,11*H,0);
  seat(b,0,1.92,'#6074a1');
  b.stack('#9ba19d',4.48,H,2.56,3,6,3,'stud');
  b.obstacle({x:4.48,z:2.56,w:3*S,d:3*S,height:15*H,bottom:H,label:'test machine'});
  b.mold('antenna',P.ink,4.48,7*H,2.56);
  // One connected four-rotor brick model, mounted on a test pedestal.
  const drone=new BrickBatch();drone.stack(P.ink,0,0,0,6,1,2);drone.stack(P.ink,0,H,0,2,1,6);drone.stack(P.white,0,2*H,0,2,2,2,'stud');
  for(const x of [-2,2])for(const z of [-2,2])drone.mold('roundPlate',P.ink,x*S,3*H,z*S);
  const model=drone.build(animated,'brick-drone');model.position.set(3.2,2.048,1.28);
  b.stack('#e4cd9e',3.2,H,1.28,2,7,2);
  b.obstacle({x:3.2,z:1.28,w:6*S,d:6*S,height:13*H,bottom:H,label:'drone pedestal'});
  sign(root,'BUILD / TEST / REPEAT',0,4.1,-4.15,6.4,.64,'#0a3463');
}
export function pokerProps(b:BrickBatch,animated:T.Group,root:T.Group) {
  table(b,0,.64,10,6);b.stack('#237841',0,8*H,.64,10,1,6,'tile');
  for(const x of [-2.56,2.56])seat(b,x,3.84,'#720e0f');seat(b,4.48,.64,'#720e0f',Math.PI/2);
  for(let i=0;i<5;i++)b.stack(P.white,-2.56+i*1.28,9*H,0,1,1,2,'tile');
  for(let i=0;i<4;i++)for(let j=0;j<i+2;j++)b.mold('roundTile',[P.white,'#c91a09','#f2cd37','#5a93db'][i],-2.56+i*S,(10+j)*H,1.92);
  b.stack('#720e0f',-3.84,H,-2.56,5,3,3);b.stack('#720e0f',-3.84,4*H,-3.2,5,4,1,'stud');
  b.obstacle({x:-3.84,z:-2.56,w:5*S,d:3*S,height:8*H,bottom:H,label:'lounge sofa'});
  b.stack(P.wood,3.84,H,-2.56,2,9,2);b.mold('dish','@amber',3.84,10*H,-2.56);
  const chips=new BrickBatch();for(let i=0;i<3;i++)chips.mold('roundTile','#f2cd37',0,(i+1)*H,0);const model=chips.build(animated);model.position.set(1.92,9*H,1.28);
  sign(root,'STUDY THE HAND. ENJOY THE GAME.',0,3.84,-4.15,8.32,.64,'#720e0f');
}
function cube(b:BrickBatch,x:number,bottom:number,z:number) {
  b.stack(P.ink,x,bottom,z,4,9,4);
  for(const [dx,dz,color]of [[-1,-1,'#c91a09'],[1,-1,'#f2cd37'],[-1,1,'#237841'],[1,1,'#5a93db']] as [number,number,string][])b.stack(color,x+dx*S,bottom+9*H,z+dz*S,2,1,2,'tile');
}
export function hobbyProps(b:BrickBatch,animated:T.Group,root:T.Group) {
  b.stack(P.wood,-4.48,H,-3.2,4,1,3,'tile');cube(b,-4.48,2*H,-3.2);
  b.obstacle({x:-4.48,z:-3.2,w:4*S,d:4*S,height:12*H,bottom:H,label:'cube shelf'});
  table(b,0,.64,8,6);
  b.stack('#9b9a5a',0,8*H,.64,8,1,6,'stud');
  const colors=['#237841','#e4cd9e','#9b9a5a','#5a93db','#a95500','#f2cd37'];
  for(let row=-1;row<=1;row++)for(let col=-1;col<=1;col++)b.mold('roundPlate',colors[(row+col+6)%6],col*2*S+(row%2)*S,10*H,.64+row*2*S);
  for(let i=0;i<3;i++)b.stack('#c91a09',-1.92+i*1.28,10*H,.64,1,2,1,'stud');
  seat(b,0,3.84,'#a0bcac');
  b.stack('#0a3463',4.48,H,0,3,12,3,'stud');
  b.obstacle({x:4.48,z:0,w:3*S,d:4*S,height:15*H,bottom:H,label:'arcade cabinet'});
  b.mold('sideStud',P.ink,4.48,13*H,1.28);sign(root,'READY?',4.48,9*H,1.3,2*S,2*S,P.ink,'#bbe90b');
  b.stack('#f2cd37',4.48,5*H,1.28,3,1,2,'tile');b.mold('joystick',P.ink,3.84,7*H,1.6);
  b.mold('roundTile','#c91a09',4.48,7*H,1.6);b.mold('roundTile','#5a93db',5.12,7*H,1.6);
  const cb=new BrickBatch();cube(cb,0,0,0);const rotating=cb.build(animated);rotating.position.set(-2.56,2.048,1.28);
  b.stack(P.wood,-2.56,H,1.28,4,7,4);
  b.obstacle({x:-2.56,z:1.28,w:4*S,d:4*S,height:18*H,bottom:H,label:'cube display'});
  sign(root,'ONE MORE SOLVE?',0,3.84,-4.15,5.76,.64,'#a95500');
}
export function campusProps(b:BrickBatch,animated:T.Group,root:T.Group) {
  for(const x of [-4.48,4.48]) {
    shelf(b,x,-2.56);
  }
  table(b,0,.64,6,4);b.stack(P.white,0,8*H,.64,2,1,2,'tile');seat(b,0,3.2);
  b.stack(P.cream,2.56,H,-2.56,2,6,2,'stud');b.mold('conePart','#f2cd37',2.56,13*H,-2.56);
  const light=new BrickBatch();light.stack('@amber',0,0,0,4,1,1,'tile');const model=light.build(animated);model.position.set(0,3.584,-4.16);
  sign(root,'WATERLOO / COMPUTER SCIENCE',0,3.84,-4.15,7.68,.64,'#0a3463');
}
