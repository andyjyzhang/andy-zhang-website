import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {BrickBatch} from '../src/world/brick-kit';
import {spaceBuilding} from '../src/world/city-buildings';
import type {BuildingDesign} from '../src/world/city-layout';
import {stationHull,ENGINE_PODS} from '../src/world/station-hull';
import {landmarkEntrance} from '../src/landmarks/entrances';
import {WORLD_STYLE} from '../src/config/station';
import {landmarks} from '../src/config/world';
import {STUD as S,PLATE as H,LDRAW_SCALE} from '../src/world/part-catalog';
import {standingPart,frontPart} from '../src/world/part-placement';
import {shelf} from '../src/landmarks/props';
import {PieceAssembly} from '../src/scenes/piece-assembly';

function rectangularBounds(root:T.Group) {
  const bounds:T.Box3[]=[],matrix=new T.Matrix4();
  root.updateMatrixWorld(true);
  root.traverse(o=>{
    if(!(o instanceof T.InstancedMesh)||!(o.geometry instanceof T.BoxGeometry))return;
    o.geometry.computeBoundingBox();
    for(let i=0;i<o.count;i++){
      o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);
      bounds.push(o.geometry.boundingBox!.clone().applyMatrix4(matrix));
    }
  });
  return bounds;
}

function overlaps(boxes:T.Box3[]) {
  let count=0;
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++) {
    const a=boxes[i],c=boxes[j];
    if(['x','y','z'].every(axis=>Math.min(a.max[axis as 'x'],c.max[axis as 'x'])-Math.max(a.min[axis as 'x'],c.min[axis as 'x'])>.001))count++;
  }
  return count;
}

describe('physical building surfaces',()=>{
  it.each(['factory','warehouse','apartments','terrace','civic','arcade'] as BuildingDesign[])('keeps the %s facade free of intersecting rectangular pieces',design=>{
    const b=new BrickBatch(),root=new T.Group();
    spaceBuilding(b,0,0,.512,30,28,15,'#6c6e68',design);b.build(root);
    const boxes=rectangularBounds(root);
    let overlaps=0;
    for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],c=boxes[j];
      if(Math.min(a.max.y,c.max.y)-Math.max(a.min.y,c.min.y)<.001)continue;
      if(Math.min(a.max.x,c.max.x)-Math.max(a.min.x,c.min.x)<.001)continue;
      if(Math.min(a.max.z,c.max.z)-Math.max(a.min.z,c.min.z)<.001)continue;
      overlaps++;
    }
    expect(overlaps).toBe(0);
  });
});

describe('supported station assemblies',()=>{
  it('builds six outboard engines at catalog scale with clear piece courses',()=>{
    const b=new BrickBatch(),root=new T.Group();stationHull(b,WORLD_STYLE.size[0]/S,WORLD_STYLE.size[1]/S);b.build(root);
    const bounds=new T.Box3().setFromObject(root),pieces=rectangularBounds(root);
    expect(ENGINE_PODS).toHaveLength(6);expect(bounds.min.y).toBeCloseTo(-114*H+.004);
    expect(bounds.max.x).toBeGreaterThan(WORLD_STYLE.size[0]/2+9);
    for(const p of b.placements) {
      const scale=new T.Vector3().setFromMatrixScale(p.matrix);
      expect(scale.x).toBeCloseTo(LDRAW_SCALE);expect(scale.y).toBeCloseTo(LDRAW_SCALE);expect(scale.z).toBeCloseTo(LDRAW_SCALE);
    }
    const pod=pieces.filter(box=>box.max.y<=-24*H+.001&&box.min.x<-110&&box.min.z>-11&&box.max.z<11);
    expect(pod.length).toBeGreaterThan(200);expect(overlaps(pod)).toBe(0);
  });
  it.each(landmarks)('keeps the $id signature doorway clear and its pieces separate',l=>{
    const b=new BrickBatch(),root=new T.Group();landmarkEntrance(b,l.id,l.width/S,l.depth/S);b.build(root);
    const boxes=rectangularBounds(root);
    expect(overlaps(boxes)).toBe(0);
    expect(boxes.every(box=>box.min.y>=23*H)).toBe(true);
    expect(b.colliders[0].bottom).toBe(23*H);
    expect(b.colliders.filter(o=>Math.abs(o.x)<o.w/2).every(o=>o.bottom!>=27*H)).toBe(true);
  });
  it('rests native roof pieces on their supports and mounts facade pieces against the wall',()=>{
    const b=new BrickBatch(),root=new T.Group();standingPart(b,'slope','#f4f4f4',0,4,0);frontPart(b,'roundTile','@amber',10,8,2);b.build(root);root.updateMatrixWorld(true);
    for(const mesh of root.children[0].children as T.InstancedMesh[]) {
      const matrix=new T.Matrix4();mesh.getMatrixAt(0,matrix);mesh.geometry.computeBoundingBox();const bounds=mesh.geometry.boundingBox!.clone().applyMatrix4(matrix);
      if(bounds.min.x<5)expect(bounds.min.y).toBeCloseTo(4);
      else expect(bounds.min.z).toBeCloseTo(2);
    }
  });
  it('keeps the bookcase shelves separate from their supports',()=>{
    const b=new BrickBatch(),root=new T.Group();shelf(b,0,0,6);b.build(root);
    expect(overlaps(rectangularBounds(root))).toBe(0);
  });
  it('restores the real hull exactly after construction or skip',()=>{
    const b=new BrickBatch(),root=new T.Group();stationHull(b,WORLD_STYLE.size[0]/S,WORLD_STYLE.size[1]/S);const hull=b.build(root);
    const meshes=hull.children as T.InstancedMesh[],original=meshes.map(m=>m.instanceMatrix.array.slice());
    const assembly=new PieceAssembly(hull,1.35,.95);
    assembly.hide();expect(meshes.every(m=>m.count===0)).toBe(true);
    assembly.update(1.8);expect(meshes.some(m=>m.count>0)).toBe(true);
    assembly.restore();meshes.forEach((mesh,i)=>expect(mesh.instanceMatrix.array).toEqual(original[i]));
  });
});
