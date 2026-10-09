import * as T from 'three';
import {BrickBatch,palette as P,sign} from '../world/brick-kit';
import {partGeometry} from '../world/part-library';
import {STUD as S,PLATE as H,LDRAW_SCALE} from '../world/part-catalog';
import {spaceBuilding} from '../world/city-buildings';
import {landmarkEntrance} from './entrances';
import type {Obstacle} from '../world/collision';
import type {Landmark} from '../config/world';
import {table,computer,shelf,workshopProps,pokerProps,hobbyProps,campusProps} from './props';
export interface Building {root:T.Group;markers:T.Group;animated:T.Object3D;landmark:Landmark;obstacles:Obstacle[]}

export function createBuilding(l:Landmark):Building {
  const root=new T.Group();root.position.set(l.x,.512,l.z);root.rotation.y=l.facing??0;
  const b=new BrickBatch(),w=Math.round(l.width/S),d=Math.round(l.depth/S),color=l.color;
  b.stack('#9ba19d',0,0,0,w,1,d,'tile');
  b.obstacle({x:0,z:0,w:l.width,d:l.depth,height:H,label:'landmark floor'});
  for(let row=0;row<7;row++) {
    const y=H+row*3*H;
    b.stack(row===5?'#05131d':color,0,y,-(d-1)*S/2,w,3,1,row===6?'stud':'hidden');
    for(const side of [-1,1])b.stack(row===5?'#05131d':color,side*(w-1)*S/2,y,0,1,3,d-2,row===6?'stud':'hidden');
  }
  // True walk-in shells: individual walls, doorway posts and elevated lintel.
  b.obstacle({x:0,z:-(d-1)*S/2,w:w*S,d:S,height:22*H,label:'rear wall'});
  for(const side of [-1,1]) {
    const x=side*(w-1)*S/2;
    b.obstacle({x,z:0,w:S,d:(d-2)*S,height:22*H,label:'side wall'});
    b.stack('#0a3463',x,H,(d-1)*S/2,1,21,1,'stud');
    b.obstacle({x,z:(d-1)*S/2,w:S,d:S,height:22*H,label:'doorway post'});
  }
  b.stack('#05131d',0,21*H,(d-1)*S/2,w,2,1);
  b.obstacle({x:0,z:(d-1)*S/2,w:w*S,d:S,bottom:21*H,height:23*H,label:'entrance lintel'});
  const rd=Math.floor(d/2),rz=-(d-rd)*S/2;
  b.stack('#0a3463',0,22*H,rz,w+2,1,rd+2,'stud');
  b.obstacle({x:0,z:rz,w:(w+2)*S,d:(rd+2)*S,bottom:22*H,height:120,label:'upper structure'});
  const animated=new T.Group();root.add(animated);
  if(l.id==='house') {
    spaceBuilding(b,0,rz,23*H,w-8,rd,3,'#6074a1','apartments');
    b.mold('dish','@cyan',-3.2,75*H,rz);b.stack('#fe8a18',4.48,23*H,rz,2,31,2,'stud');
    table(b,-1.92,-2.56,10,4);computer(b,root,-2.56,-2.56);computer(b,root,0,-2.56);
    b.mold('mug',P.white,1.28,11*H,-1.92);b.mold('chair','#008f9b',-1.28,4*H,0);
    shelf(b,6.4,-4.48);
    b.obstacle({x:-1.28,z:0,w:1.28,d:1.92,height:11*H,bottom:H,label:'studio chair'});
    const screen=new BrickBatch();screen.stack('@cyan',0,0,0,3,2,1,'tile');screen.build(animated).position.set(-2.56,3.072,-2.24);
    sign(root,'ANDY / HOME BASE',0,4.864,d*S/2+.02,12.8,1.28);
  }
  if(l.id==='garage') {
    // Low industrial hangar, roof ventilators, tall gantry and offset service tower.
    for(let i=0;i<5;i++)for(const side of [-1,1])b.mold('slope','#008f9b',(-8+i*4)*S,27*H,rz+side*S,side<0?Math.PI:0);
    for(const side of [-1,1])b.stack('#f2cd37',side*(w/2-3)*S,23*H,rz,2,17,2,'stud');
    b.stack('#f2cd37',0,40*H,rz,w-4,3,2,'stud');
    spaceBuilding(b,-8.32,rz,23*H,8,rd,3,'#6c6e68','factory');
    workshopProps(b,animated,root);
    sign(root,'ZERO-G / ENGINEERING',0,4.864,d*S/2+.02,17.92,1.28);
  }
  if(l.id==='poker') {
    spaceBuilding(b,0,rz,23*H,20,rd,4,'#720e0f','arcade');
    for(const side of [-1,1])b.stack('#f2cd37',side*6.4,23*H,rz,2,63,2,'stud');
    const badge=new T.Group();badge.position.set(0,28*H,rz+rd*S/2+.34);root.add(badge);
    sign(badge,'♠  ♥\nREDSHIFT',0,0,0,9*S,4*S,'#720e0f','#f2cd37');
    pokerProps(b,animated,root);sign(root,'REDSHIFT / POKER LOUNGE',0,4.864,d*S/2+.02,15.36,1.28,'#720e0f');
  }
  if(l.id==='hobby') {
    // Brick-built cube beacon and two electronics pods, rather than another tower.
    for(let y=0;y<3;y++)for(let x=0;x<3;x++)for(let z=0;z<3;z++)b.stack(['#f2cd37','#008f9b','#c91a09','#f4f4f4','#fe8a18'][(x+y*2+z)%5],(x-1)*3*S,(23+y*9)*H,rz+(z-1)*3*S,3,9,3,y===2?'stud':'hidden');
    for(const side of [-1,1])spaceBuilding(b,side*7.68,rz,23*H,6,rd,2,'#0a3463','arcade');
    hobbyProps(b,animated,root);sign(root,'OFF DUTY / GAME HUB',0,4.864,d*S/2+.02,15.36,1.28,'#a95500');
  }
  if(l.id==='campus') {
    spaceBuilding(b,0,rz,23*H,22,rd,6,'#9ba19d','civic');
    for(const side of [-1,1]) {
      b.stack('#0a3463',side*8.32,23*H,rz,3,35,5,'stud');
      b.mold('dish','@cyan',side*8.32,61*H,rz);
    }
    campusProps(b,animated,root);sign(root,'WATERLOO / DATA ARCHIVE',0,4.864,d*S/2+.02,17.92,1.28);
  }
  landmarkEntrance(b,l.id,w,d);
  b.build(root,`${l.id}-bricks`);
  root.updateWorldMatrix(true,true);
  b.colliders.find(o=>o.label==='upper structure')!.height=new T.Box3().setFromObject(root).max.y-.512;
  const markers=new T.Group();markers.position.set(0,H,d*S/2+2*S);root.add(markers);
  const blue=new T.MeshStandardMaterial({color:'#559ab7',transparent:true,opacity:.7,roughness:.18,emissive:'#559ab7',emissiveIntensity:.12});
  for(const x of [-3,-1,1,3]) {
    const mesh=new T.Mesh(partGeometry('roundPlate'),blue);mesh.scale.setScalar(LDRAW_SCALE);mesh.rotation.x=Math.PI;mesh.position.set(x*S,H,0);mesh.userData.ldrawPart={file:'4032.dat',color:'@cyan'};markers.add(mesh);
  }
  markers.userData.parts={'4032a/trans-light-blue':4};
  const angle=l.facing??0,c=Math.cos(angle),s=Math.sin(angle);
  const obstacles=b.colliders.map(o=>({...o,x:l.x+o.x*c+o.z*s,z:l.z-o.x*s+o.z*c,w:Math.abs(c)*o.w+Math.abs(s)*o.d,d:Math.abs(s)*o.w+Math.abs(c)*o.d,height:o.height+.512,bottom:(o.bottom??0)+.512}));
  return{root,markers,animated,landmark:l,obstacles};
}
