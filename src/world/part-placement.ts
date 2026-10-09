import * as T from 'three';
import {partGeometry,type LibraryPart} from './part-library';
import {LDRAW_SCALE} from './part-catalog';
import type {BrickBatch} from './brick-kit';

const bounds=new Map<string,T.Box3>();
function moldBounds(name:LibraryPart,rotation:number,rotationX:number) {
  const key=`${name}/${rotation}/${rotationX}`;
  if(!bounds.has(key)){
    const geometry=partGeometry(name);geometry.computeBoundingBox();
    const matrix=new T.Matrix4().makeRotationFromEuler(new T.Euler(rotationX,rotation,0)).scale(new T.Vector3().setScalar(LDRAW_SCALE));
    bounds.set(key,geometry.boundingBox!.clone().applyMatrix4(matrix));
  }
  return bounds.get(key)!;
}
// Position native pieces by their actual surfaces, preserving their unit scale.
export function standingPart(b:BrickBatch,name:LibraryPart,color:string,x:number,bottom:number,z:number,rotation=0) {
  const box=moldBounds(name,rotation,Math.PI),center=box.getCenter(new T.Vector3());
  b.mold(name,color,x-center.x,bottom-box.min.y,z-center.z,rotation);
}
export function frontPart(b:BrickBatch,name:LibraryPart,color:string,x:number,centerY:number,back:number) {
  const box=moldBounds(name,0,Math.PI/2),center=box.getCenter(new T.Vector3());
  b.mold(name,color,x-center.x,centerY-center.y,back-box.min.z,0,Math.PI/2);
}
