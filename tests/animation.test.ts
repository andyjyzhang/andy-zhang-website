import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {PieceAssembly} from '../src/scenes/piece-assembly';
import {gaitPose} from '../src/player/gait';
describe('rigid minifigure gait',()=>{
  it('runs with wider opposing hinges and stronger forward intent than walking',()=>{
    const distance=Math.PI/2/1.9,walk=gaitPose(distance,8.4,1),run=gaitPose(distance,14.4,1);
    expect(Math.abs(run.legs[0])).toBeGreaterThan(Math.abs(walk.legs[0])*1.7);
    expect(run.legs[0]).toBe(-run.legs[1]);expect(run.arms[0]).toBeGreaterThan(walk.arms[0]);expect(run.lean).toBeGreaterThan(walk.lean);
    const reduced=gaitPose(distance,14.4,1,false,0,true);expect(reduced.bob+reduced.lean+reduced.twist).toBe(0);expect(reduced.legs).toEqual(run.legs);
  });
  it('stops at a planted idle and uses a separate jump pose',()=>{
    const idle=gaitPose(100,0,0);expect(Math.abs(idle.legs[0])+idle.bob+idle.lean).toBe(0);
    const jump=gaitPose(0,10,1,true,8);expect(jump.bob).toBe(0);expect(jump.arms[0]).toBeLessThan(-1);expect(jump.legs[0]).not.toBe(jump.legs[1]);
  });
});
describe('instanced construction',()=>{
  it('drops individual pieces and restores exact transforms/colors on completion, skip and replay',()=>{
    const root=new T.Group(),mesh=new T.InstancedMesh(new T.BoxGeometry(),new T.MeshBasicMaterial(),30);root.add(mesh);
    for(let i=0;i<30;i++){mesh.setMatrixAt(i,new T.Matrix4().makeTranslation(i-15,i*1.2,0));mesh.setColorAt(i,new T.Color(i%2?'red':'blue'));}
    const original=mesh.instanceMatrix.array.slice(),colors=mesh.instanceColor!.array.slice();
    const build=new PieceAssembly(root,1,3);
    for(let replay=0;replay<2;replay++) {
      build.hide();expect(mesh.count).toBe(0);expect(root.visible).toBe(false);
      build.update(2);expect(mesh.count).toBeGreaterThan(0);expect(mesh.count).toBeLessThan(30);
      const positions=Array.from({length:mesh.count},(_,i)=>mesh.instanceMatrix.array[i*16+13]);expect(positions.some(y=>y%1.2>.01)).toBe(true);
      build.restore();expect(mesh.count).toBe(30);expect(mesh.instanceMatrix.array).toEqual(original);expect(mesh.instanceColor!.array).toEqual(colors);expect(mesh.frustumCulled).toBe(true);
    }
    build.hide();build.update(5);expect(mesh.count).toBe(30);build.restore();expect(mesh.instanceMatrix.array).toEqual(original);
  });
});
