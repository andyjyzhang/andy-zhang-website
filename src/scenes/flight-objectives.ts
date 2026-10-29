import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {BrickBatch,sign} from '../world/brick-kit';
import {STUD as S,PLATE as H} from '../world/part-catalog';
import {consolidateStatic} from '../world/consolidate';
import type {FlightResource} from './salvage-models';

export function flightGate(resources:FlightResource[],number:number){
  const root=new T.Group(),frame=new BrickBatch(),lights=new BrickBatch();root.name=`flight-gate-${number}`;
  // A stepped brick annulus, with an opening wide enough for the courier's wings.
  for(let row=-27;row<=27;row++){
    const y=row*2*H;
    for(let x=-22;x<=22;){
      const inside=(column:number)=>{const radius=Math.hypot((column+.5)*S,y);return radius>=11.52&&radius<=13.44;};
      if(!inside(x)){x++;continue;}const start=x;while(x<=22&&inside(x))x++;
      const w=x-start,center=(start+w/2)*S;
      frame.stack('#9ba19d',center,y-H,0,w,2,2);
      lights.stack('@cyan',center,y-H,1.5*S,w,2,1);
    }
  }
  frame.build(root,'gate-frame');const active=lights.build(root,'active-gate-lights');
  const label=sign(root,String(number),0,15,1.3,2.56,1.28,'#0a3463','#f5f2e9');resources.push(label.geometry,label.material,label.material.map!);
  consolidateStatic(root);return{root,active};
}

export function signalTarget(resources:FlightResource[],core=false){
  const root=new T.Group(),b=new BrickBatch();root.name=core?'cruiser-reactor-core':'power-relay';
  const w=core?12:6,h=core?24:12;
  b.stack('#05131d',0,-h*H/2,0,w,h,4,'stud');
  b.stack(core?'#fe8a18':'#5a93db',0,-(h-4)*H/2,2.5*S,w-2,h-4,1,'stud');
  b.stack('#f2cd37',0,-H,3.5*S,core?6:2,2,1,'tile');
  for(const side of [-1,1])b.mold('roundTile',core?'@amber':'@cyan',side*(core?2.56:.96),h*H/2+H,0);
  b.build(root,'target-casing');consolidateStatic(root);
  const geometry=new T.BoxGeometry(core?8.4:4.7,core?7:4.2,3.5),material=new T.MeshBasicMaterial({color:'#9bdde7',wireframe:true});
  resources.push(geometry,material);const marker=new T.Mesh(geometry,material);root.add(marker);
  return{root,material};
}

export function freightShuttle(){
  const root=new T.Group(),b=new BrickBatch();root.name='freight-shuttle';
  b.stack('#0a3463',0,-3*H,0,10,6,18,'stud');b.stack('#5a93db',0,3*H,2*S,8,6,8,'stud');
  b.stack('#05131d',0,9*H,3*S,6,1,4,'tile');b.stack('#9ba19d',0,3*H,-4*S,8,6,8,'stud');
  for(const side of [-1,1]){
    b.stack('#f2cd37',side*4.5*S,3*H,0,1,2,16,'tile');
    b.stack('#05131d',side*4*S,-H,-8*S,3,4,3,'stud');
    b.stack('@cyan',side*4*S,-H,-10*S,2,3,1,'tile');
  }
  b.build(root,'freight-shuttle-hull');consolidateStatic(root);return root;
}

// Bake a single cluster of catalog-sized bricks/studs once, then instance it.
// Every hazard uses this fixed scale rather than stretching its LEGO pieces.
export function brickDebrisGeometry(){
  const b=new BrickBatch(),root=new T.Group(),pieces:T.BufferGeometry[]=[],matrix=new T.Matrix4();
  b.stack('#6c6e68',0,-3*H,0,4,3,6);b.stack('#6c6e68',0,0,-S,4,3,4,'stud');b.stack('#6c6e68',S,0,2*S,2,2,2,'stud');
  b.build(root);
  root.traverse(object=>{
    if(!(object instanceof T.InstancedMesh))return;
    for(let i=0;i<object.count;i++){object.getMatrixAt(i,matrix);const geometry=object.geometry.clone().applyMatrix4(matrix);geometry.deleteAttribute('uv');pieces.push(geometry);}
    object.dispose();
  });
  const geometry=mergeGeometries(pieces)!;pieces.forEach(piece=>piece.dispose());root.clear();geometry.computeBoundingSphere();return geometry;
}
