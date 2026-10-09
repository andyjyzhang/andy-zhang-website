import {describe,it,expect} from 'vitest';
import {coverRectangle,RECT_PARTS,STUD,PLATE} from '../src/world/part-catalog';
import {WORLD_STYLE} from '../src/config/station';
import {BrickBatch} from '../src/world/brick-kit';
import {exportBuild} from '../src/world/export-build';
import {SurfaceGrid} from '../src/world/surface-grid';
import {partGeometry} from '../src/world/part-library';
import * as T from 'three';
describe('physical part assemblies',()=>{
  it('preserves the heights of the tall streetlight and antenna molds after packing',()=>{
    const light=partGeometry('lampPost'),antenna=partGeometry('antenna');light.computeBoundingBox();antenna.computeBoundingBox();
    expect(light.boundingBox!.max.y).toBe(168);expect(antenna.boundingBox!.min.y).toBe(-88);
  });
  it('covers odd footprints exactly without gaps or overlapping pieces',()=>{
    for(const kind of ['brick','plate','tile'] as const)for(const [w,d]of [[1,17],[13,11],[32,25]]) {
      const cells=new Uint8Array(w*d);
      for(const p of coverRectangle(w,d,kind)) {
        const pw=p.rotated?p.part.d:p.part.w,pd=p.rotated?p.part.w:p.part.d;
        const x=p.x-pw/2+w/2,z=p.z-pd/2+d/2;
        expect(Number.isInteger(x)&&Number.isInteger(z)).toBe(true);expect(RECT_PARTS).toContain(p.part);
        for(let a=x;a<x+pw;a++)for(let b=z;b<z+pd;b++)cells[b*w+a]++;
      }
      expect([...cells].every(c=>c===1)).toBe(true);
    }
  });
  it('assembles a stack at one consistent physical scale and records parts',()=>{
    const b=new BrickBatch();b.stack('#f2cd37',0,0,0,4,4,2,'stud');const root=new T.Group();b.build(root);root.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(root);
    expect(bounds.max.y).toBeCloseTo(4*PLATE+.128,3);expect(bounds.max.x-bounds.min.x).toBeCloseTo(4*STUD-.012,3);
    expect(b.counts['3001/#f2cd37']).toBe(1);expect(b.counts['3020/#f2cd37']).toBe(1);
  });
  it('exports real part origins and unit-size transforms through rotated assemblies',()=>{
    const root=new T.Group(),b=new BrickBatch();b.stack('#f2cd37',0,0,0,4,3,2,'stud');b.build(root);
    const plain=exportBuild(root,'test');expect(plain.ldraw).toContain('1 14 0 -24 0 1 0 0 0 1 0 0 0 1 3001.dat');expect(plain.pieces).toBe(1);
    root.position.set(6.4,0,0);root.rotation.y=Math.PI/2;root.updateMatrixWorld(true);const lines=exportBuild(root,'rotated').ldraw.split('\n').filter(l=>l.startsWith('1 '));
    const values=lines[0].split(' ').slice(2,14).map(Number);expect(values[0]).toBe(200);
    const axes=[[values[3],values[6],values[9]],[values[4],values[7],values[10]],[values[5],values[8],values[11]]];axes.forEach(axis=>expect(Math.hypot(...axis)).toBeCloseTo(1));
  });
});
describe('orbital world configuration',()=>{
  it('uses one complete plate-sized station footprint',()=>{
    expect(WORLD_STYLE.id).toBe('orbital');
    for(const size of WORLD_STYLE.size)expect(size/STUD/16).toBeCloseTo(Math.round(size/STUD/16));
  });
});
describe('ground assembly',()=>{
  it('replaces intersection markings without overlapping ground tiles',()=>{
    const grid=new SurfaceGrid(16,16,'#6c6e68');grid.stack('#f4f4f4',0,.256,0,2,1,16);grid.stack('#f4f4f4',0,.256,0,16,1,2);
    const root=new T.Group();grid.build(root);root.updateMatrixWorld(true);const occupied=new Uint8Array(256);
    for(const placement of root.children[0].userData.placements) {
      const spec=RECT_PARTS.find(p=>`${p.id}.dat`===placement.file)!,m=placement.matrix.elements;
      const rotated=Math.abs(m[0])<.01,w=rotated?spec.d:spec.w,d=rotated?spec.w:spec.d;
      const x=Math.round(m[12]/STUD-w/2+8),z=Math.round(m[14]/STUD-d/2+8);
      for(let a=x;a<x+w;a++)for(let b=z;b<z+d;b++)occupied[b*16+a]++;
    }
    expect([...occupied].every(c=>c===1)).toBe(true);
  });
});
