import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {consolidateStatic,freezeStaticTransforms} from '../src/world/consolidate';
import {FramePacer,worldFrameRate} from '../src/scenes/frame-pacer';
import {PieceAssembly} from '../src/scenes/piece-assembly';

function detail(shadow=false,transparent=false) {
  const root=new T.Group(),mesh=new T.InstancedMesh(new T.BoxGeometry(.5,.2,.5),new T.MeshStandardMaterial({transparent}),1200);
  mesh.castShadow=shadow;mesh.receiveShadow=true;root.add(mesh);
  for(let i=0;i<mesh.count;i++){
    mesh.setMatrixAt(i,new T.Matrix4().makeTranslation((i%40-20)*8,Math.floor(i/400)*30,(Math.floor(i/40)%10-5)*8));
    mesh.setColorAt(i,new T.Color(i%2?'#078bc9':'#f2cd37'));
  }
  return {root,mesh};
}
function pieces(root:T.Object3D) {
  root.updateWorldMatrix(true,true);const result:string[]=[],matrix=new T.Matrix4(),color=new T.Color();
  root.traverse(o=>{if(o instanceof T.InstancedMesh)for(let i=0;i<o.count;i++){
    o.getMatrixAt(i,matrix);matrix.premultiply(o.matrixWorld);o.getColorAt(i,color);
    result.push(JSON.stringify([matrix.elements.map(v=>Number(v.toFixed(4))),color.toArray()]));
  }});return result.sort();
}
describe('world work without visual reduction',()=>{
  it('spatially culls dense detail while preserving every world transform, color and geometry',()=>{
    const {root,mesh}=detail();root.position.set(12,4,-9);const before=pieces(root),geometry=mesh.geometry;
    consolidateStatic(root,48);const chunks=root.children as T.InstancedMesh[];
    expect(chunks.length).toBeGreaterThan(2);expect(pieces(root)).toEqual(before);
    expect(chunks.every(m=>m.geometry===geometry&&m.receiveShadow&&!m.castShadow)).toBe(true);
    const camera=new T.PerspectiveCamera(52,1,.1,70);camera.position.set(12,8,15);camera.lookAt(12,4,-30);camera.updateMatrixWorld();
    const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    const submitted=chunks.filter(m=>frustum.intersectsObject(m)).reduce((sum,m)=>sum+m.count,0);
    expect(submitted).toBeGreaterThan(0);expect(submitted).toBeLessThan(mesh.count/2);
  });
  it('does not change shadow batches or transparent sorting',()=>{
    for(const [shadow,transparent] of [[true,false],[false,true]]){
      const {root,mesh}=detail(shadow,transparent);consolidateStatic(root,48);expect(root.children).toEqual([mesh]);
    }
  });
  it('does not partition without an explicit world-only request',()=>{
    const {root,mesh}=detail();consolidateStatic(root);expect(root.children).toEqual([mesh]);
  });
  it('keeps construction, skip and replay exact after spatial batching and static transforms',()=>{
    const {root}=detail();consolidateStatic(root,48);freezeStaticTransforms(root);const before=pieces(root);
    for(let replay=0;replay<2;replay++){
      const assembly=new PieceAssembly(root,1,2);assembly.hide();assembly.update(1.5);
      expect(pieces(root).length).toBeLessThan(1200);assembly.restore();expect(pieces(root)).toEqual(before);
    }
  });
  it('skips fixed matrix work without freezing animated descendants',()=>{
    const root=new T.Group(),fixed=new T.Group(),animated=new T.Group(),child=new T.Object3D();
    root.position.set(9,2,4);fixed.position.set(3,1,-2);root.add(fixed,animated);animated.add(child);child.position.x=2;
    freezeStaticTransforms(root,[animated]);const original=fixed.matrixWorld.clone(),update=vi.spyOn(fixed,'updateMatrix');
    animated.position.x=5;animated.rotation.y=.4;root.updateMatrixWorld(true);
    expect(update).not.toHaveBeenCalled();expect(fixed.matrixWorld.equals(original)).toBe(true);
    expect(animated.matrixAutoUpdate&&animated.matrixWorldAutoUpdate).toBe(true);
    expect(new T.Vector3().setFromMatrixPosition(child.matrixWorld).x).toBeCloseTo(14+2*Math.cos(.4));
  });
});
describe('frame pacing',()=>{
  it.each([60,120,144,240])('keeps 60 Hz gameplay on a %i Hz display',refresh=>{
    const pacer=new FramePacer();let count=0;
    for(let frame=0;frame<refresh*3;frame++)if(pacer.ready(frame*1000/refresh,60))count++;
    expect(count).toBeGreaterThanOrEqual(179);expect(count).toBeLessThanOrEqual(181);
  });
  it('retains low graphics pacing and reduces only paused backgrounds',()=>{
    expect(worldFrameRate(false,false)).toBe(60);expect(worldFrameRate(true,false)).toBe(30);
    expect(worldFrameRate(false,true)).toBe(20);expect(worldFrameRate(true,true)).toBe(20);
    const pacer=new FramePacer();let count=0;for(let frame=0;frame<144;frame++)if(pacer.ready(frame*1000/144,30))count++;
    expect(count).toBe(30);
  });
  it('renders immediately after resume and never bursts to catch up after a stall',()=>{
    const pacer=new FramePacer();expect(pacer.ready(0,60)).toBe(true);expect(pacer.ready(3,60)).toBe(false);
    expect(pacer.ready(30000,60)).toBe(true);expect(pacer.ready(30001,60)).toBe(false);
    pacer.reset();expect(pacer.ready(30002,60)).toBe(true);
  });
});
