import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {BoosterExhaust} from '../src/world/booster-exhaust';
import {ENGINE_PODS} from '../src/world/station-hull';
import {PLATE as H,LDRAW_SCALE} from '../src/world/part-catalog';
import {PieceAssembly} from '../src/scenes/piece-assembly';
import {exportBuild} from '../src/world/export-build';

describe('station booster exhaust',()=>{
  it('connects fixed, exportable catalog plumes to all six engine bells',()=>{
    const root=new T.Group(),boosters=new BoosterExhaust(root);root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(root);expect(bounds.min.y).toBeCloseTo(-180*H+.004);expect(bounds.max.y).toBeCloseTo(-114*H-.004);
    const placements=boosters.root.userData.placements as {matrix:T.Matrix4}[];
    for(const p of placements){expect(new T.Vector3().setFromMatrixScale(p.matrix).x).toBeCloseTo(LDRAW_SCALE);expect(ENGINE_PODS.some(pod=>Math.abs(p.matrix.elements[12]-pod.x)<6.4&&Math.abs(p.matrix.elements[14]-pod.z)<6.4)).toBe(true);}
    const exported=exportBuild(root,'boosters');expect(exported.pieces).toBe(placements.length);expect(exported.ldraw).toContain('.dat');
  });
  it('animates light without moving physical pieces, freezes under reduced motion and restores after intro',()=>{
    const root=new T.Group(),boosters=new BoosterExhaust(root),meshes=boosters.root.children as T.InstancedMesh[];
    const matrices=meshes.map(m=>m.instanceMatrix.array.slice());boosters.update(.5,false);expect(boosters.flowTime.value).toBe(.5);expect(boosters.motion.value).toBe(1);
    boosters.update(10,true);expect(boosters.flowTime.value).toBe(.5);expect(boosters.motion.value).toBe(0);
    meshes.forEach((mesh,i)=>expect(mesh.instanceMatrix.array).toEqual(matrices[i]));
    const assembly=new PieceAssembly(root,1,.9);assembly.hide();assembly.update(1.4);boosters.update(.1,false);assembly.restore();
    meshes.forEach((mesh,i)=>expect(mesh.instanceMatrix.array).toEqual(matrices[i]));
    expect(new Set(meshes.map(m=>m.material)).size).toBeLessThanOrEqual(2);expect(meshes.every(m=>!m.castShadow)).toBe(true);
  });
});
