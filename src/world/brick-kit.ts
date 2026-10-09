import * as T from 'three';
import { plastic } from './plastic';
import { partGeometry,partLayers,partLayerColor, type LibraryPart } from './part-library';
import sourceNames from '../assets/ldraw-catalog.json';
import { coverRectangle, LDRAW_SCALE, STUD, PLATE, legoColor, snapStud, snapPlate, type RectPart } from './part-catalog';
import type { Obstacle } from './collision';
export { material } from './plastic';
export const palette={curb:'#9ba19d',cream:'#e4cd9e',ink:'#05131d',wood:'#582a12',white:'#f4f4f4'};
const geometryCache=new Map<string,T.BufferGeometry>();
const studGeometry=partGeometry('stud').clone().scale(LDRAW_SCALE,-LDRAW_SCALE,-LDRAW_SCALE);
const packedCache=new Map<string,ReturnType<typeof coverRectangle>>();
const transparentMaterials=new Map<string,T.MeshStandardMaterial>();
function finish(color:string) {
  if(!color.startsWith('@'))return plastic;
  if(!transparentMaterials.has(color)) {
    const c=color==='@amber'?'#f2cd37':color==='@red'?'#c91a09':color==='@clear'?'#e8ffff':'#559ab7';
    transparentMaterials.set(color,new T.MeshStandardMaterial({color:c,roughness:.18,transparent:true,opacity:.78,emissive:c,emissiveIntensity:color==='@clear'?.02:.5,envMapIntensity:.9,metalness:0}));
  }
  return transparentMaterials.get(color)!;
}
function rectangularGeometry(p:RectPart) {
  const key=p.id;
  if(!geometryCache.has(key))geometryCache.set(key,new T.BoxGeometry(p.w*STUD-.012,p.h*PLATE-.008,p.d*STUD-.012));
  return geometryCache.get(key)!;
}
interface Piece {matrix:T.Matrix4;color:T.Color}
interface Bucket {geometry:T.BufferGeometry;pieces:Piece[];color:string;stud:boolean}
export class BrickBatch {
  readonly colliders:Obstacle[]=[];
  obstacle(o:Obstacle){this.colliders.push({...o,x:o.x+this.offset.x,z:o.z+this.offset.z,height:o.height+this.offset.y,bottom:(o.bottom??0)+this.offset.y});}
  private buckets=new Map<string,Bucket>(); private dummy=new T.Object3D();
  private offset=new T.Vector3();
  readonly counts:Record<string,number>={};
  readonly placements:{file:string;color:string;matrix:T.Matrix4}[]=[];
  private placed(file:string,color:string,x:number,y:number,z:number,rotation=0,rotationX=Math.PI) {const p=new T.Object3D();p.position.set(x,y,z).add(this.offset);p.rotation.set(rotationX,rotation,0);p.scale.setScalar(LDRAW_SCALE);p.updateMatrix();this.placements.push({file,color:legoColor(color),matrix:p.matrix.clone()});}
  private record(id:string,color:string){const key=`${id}/${color}`;this.counts[key]=(this.counts[key]||0)+1;}
  private put(key:string,geometry:T.BufferGeometry,color:string,x:number,y:number,z:number,rotation=0,rotationX=0,stud=false) {
    color=legoColor(color);const finishKey=color.startsWith('@')?color:'solid';key+=`/${finishKey}`;
    this.dummy.position.set(x,y,z).add(this.offset);this.dummy.scale.setScalar(1);this.dummy.rotation.set(rotationX,rotation,0);this.dummy.updateMatrix();
    if(!this.buckets.has(key))this.buckets.set(key,{geometry,pieces:[],color,stud});
    this.buckets.get(key)!.pieces.push({matrix:this.dummy.matrix.clone(),color:new T.Color(color.startsWith('@')?'white':color)});
  }
  withOffset(x:number,y:number,z:number,assemble:()=>void) {const previous=this.offset.clone();this.offset.add(new T.Vector3(x,y,z));try{assemble();}finally{this.offset.copy(previous);}}
  mold(name:LibraryPart,color:string,x:number,y:number,z:number,rotation=0,rotationX=Math.PI) {
    for(const layer of partLayers(name)) {
      const key=`mold/${name}/${layer}`;
      if(!geometryCache.has(key))geometryCache.set(key,partGeometry(name,layer).clone().scale(LDRAW_SCALE,LDRAW_SCALE,LDRAW_SCALE));
      this.put(key,geometryCache.get(key)!,partLayerColor(name,layer,color),x,y,z,rotation,rotationX);
    }
    this.record(name,color);this.placed(sourceNames[name],color,x,y,z,rotation,rotationX);
  }
  stack(color:string,x:number,bottom:number,z:number,w:number,h:number,d:number,top:'stud'|'tile'|'hidden'='hidden') {
    w=Math.max(1,Math.round(w));d=Math.max(1,Math.round(d));h=Math.max(1,Math.round(h));
    let layer=0;
    while(layer<h) {
      const remaining=h-layer;const kind=remaining===1&&top==='tile'?'tile':remaining>=3?'brick':'plate';const height=kind==='brick'?3:1;
      const cacheKey=`${w}/${d}/${kind}`;
      if(!packedCache.has(cacheKey))packedCache.set(cacheKey,coverRectangle(w,d,kind));
      for(const p of packedCache.get(cacheKey)!) {
        const px=x+p.x*STUD,pz=z+p.z*STUD;
        this.put(p.part.id,rectangularGeometry(p.part),color,px,bottom+(layer+height/2)*PLATE,pz,p.rotated?Math.PI/2:0);
        this.record(p.part.id,legoColor(color));
        this.placed(`${p.part.id}.dat`,color,px,bottom+(layer+height)*PLATE,pz,p.rotated?Math.PI/2:0);
        if(layer+height===h&&top==='stud') {
          const a=p.rotated?p.part.d:p.part.w,b=p.rotated?p.part.w:p.part.d;
          for(let i=0;i<a;i++)for(let j=0;j<b;j++)this.put('stud',studGeometry,color,px+(i-(a-1)/2)*STUD,bottom+h*PLATE,pz+(j-(b-1)/2)*STUD,0,0,true);
        }
      }
      layer+=height;
    }
  }
  box(color:string,x:number,y:number,z:number,w:number,h:number,d:number,studs=false) {
    this.stack(color,snapStud(x),snapPlate(y-h/2),snapStud(z),Math.max(1,Math.round(w/STUD)),Math.max(1,Math.round(h/PLATE)),Math.max(1,Math.round(d/STUD)),studs?'stud':h<.5?'tile':'hidden');
  }
  add(shape:Shape,color:string,x:number,y:number,z:number,sx=1,sy=1,sz=1,rotation=0) {
    if(shape==='box'){this.box(color,x,y,z,sx,sy,sz);return;}
    if(shape==='stud'){this.mold('roundTile',color,snapStud(x),snapPlate(y),snapStud(z),rotation);return;}
    if(shape==='cone'){this.mold('conePart',color,snapStud(x),snapPlate(y+sy/2),snapStud(z),rotation);return;}
    if(shape==='sphere'){this.mold('dish',color,snapStud(x),snapPlate(y),snapStud(z),rotation);return;}
    const name=sx<.8?'roundOne':'roundBrick',height=3*PLATE;
    const count=Math.max(1,Math.round(sy/height));const bottom=snapPlate(y-count*height/2);
    for(let i=0;i<count;i++)this.mold(name,color,snapStud(x),bottom+(i+1)*height,snapStud(z),rotation);
  }
  build(parent:T.Object3D,name='bricks') {
    const group=new T.Group();group.name=name;group.userData.parts=this.counts;group.userData.placements=this.placements;group.userData.colliders=this.colliders;
    for(const bucket of this.buckets.values()) {
      const mesh=new T.InstancedMesh(bucket.geometry,finish(bucket.color),bucket.pieces.length);
      bucket.pieces.forEach((p,i)=>{mesh.setMatrixAt(i,p.matrix);mesh.setColorAt(i,p.color);});
      mesh.castShadow=!bucket.stud;mesh.receiveShadow=true;mesh.computeBoundingSphere();group.add(mesh);
    }
    parent.add(group);return group;
  }
}
export type Shape='box'|'stud'|'cylinder'|'cone'|'sphere';
export function part(parent:T.Object3D,shape:Shape,color:string,x:number,y:number,z:number,sx=1,sy=1,sz=1) {
  const b=new BrickBatch();b.add(shape,color,0,0,0,sx,sy,sz);const group=b.build(parent);group.position.set(x,y,z);return group;
}
export function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,width:number,height=STUD,color=palette.ink,textColor=palette.cream) {
  const w=Math.max(1,Math.round(width/STUD)),h=Math.max(1,Math.round(height/STUD));width=w*STUD;height=h*STUD;
  const backing=new BrickBatch();backing.stack(color,0,0,0,w,1,h,'tile');const board=backing.build(parent,'printed-tile-sign');board.rotation.x=Math.PI/2;board.position.set(x,y,z-PLATE);
  const canvas=document.createElement('canvas');canvas.width=Math.round(1024/Math.max(1,height/width));canvas.height=Math.round(canvas.width*height/width);const c=canvas.getContext('2d')!;
  c.fillStyle=legoColor(color).startsWith('@')?'#05131d':legoColor(color);c.fillRect(0,0,canvas.width,canvas.height);c.fillStyle=textColor;const lines=text.split('\n');c.font=`bold ${Math.min(160,canvas.height/lines.length*.62,canvas.width/(Math.max(...lines.map(l=>l.length))*.6))}px Arial`;c.textAlign='center';c.textBaseline='middle';lines.forEach((line,i)=>c.fillText(line,canvas.width/2,(i+.5)*canvas.height/lines.length,canvas.width-20));
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const mesh=new T.Mesh(new T.PlaneGeometry(width-.015,height-.015),new T.MeshBasicMaterial({map:texture}));mesh.position.set(x,y,z+.012);mesh.userData.sticker=true;parent.add(mesh);return mesh;
}
export function bench(b:BrickBatch,x:number,z:number) {
  x=snapStud(x);z=snapStud(z);b.withOffset(0,0,0,()=>{for(const dx of [-2,2])b.stack(palette.ink,x+dx*STUD,.512,z,1,3,2);
  b.stack(palette.curb,x,1.28,z,6,1,2,'tile');b.stack(palette.curb,x,1.536,z-STUD/2,6,3,1,'stud');
  b.obstacle({x,z,w:6*STUD,d:2*STUD,height:1.536,bottom:.512,label:'bench seat'});
  b.obstacle({x,z:z-STUD/2,w:6*STUD,d:STUD,height:2.304,bottom:1.536,label:'bench back'});
  });
}
export function lamp(b:BrickBatch,x:number,z:number,space=false) {
  x=snapStud(x);z=snapStud(z);b.mold('lampPost',palette.ink,x,.512+168*LDRAW_SCALE,z);
  b.mold('roundBrick',space?'@cyan':'@amber',x,.512+168*LDRAW_SCALE+3*PLATE,z);
  b.mold('dish',palette.ink,x,.512+168*LDRAW_SCALE+3*PLATE,z);
  b.obstacle({x,z,w:.64,d:.64,radius:.3,height:6.656,bottom:.512,label:'streetlight'});
}
