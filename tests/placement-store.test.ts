import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {PlacementStore} from '../src/world/placement-store';
import {LDRAW_SCALE} from '../src/world/part-catalog';
import {BrickBatch} from '../src/world/brick-kit';
import {exportBuild} from '../src/world/export-build';

describe('compact, full-precision CAD metadata',()=>{
  it('reconstructs original Object3D matrices exactly for arbitrary native-part rotations',()=>{
    const store=new PlacementStore(),expected:T.Matrix4[]=[];
    for(let i=0;i<200;i++){
      const object=new T.Object3D();object.position.set(-125.37+i/7,-31.008+i/13,88.444-i/3);object.rotation.set(i*.017,i*.34,0);object.scale.setScalar(LDRAW_SCALE);object.updateMatrix();
      store.add('3001.dat','#f2cd37',object.position.x,object.position.y,object.position.z,object.rotation.x,object.rotation.y);expected.push(object.matrix.clone());
    }
    store.compact();expect(store.length).toBe(200);expect(store.byteLength).toBe(200*6*8);
    const actual=[...store];actual.forEach((placement,i)=>expect(placement.matrix.elements).toEqual(expected[i].elements));
    expect(actual[0].matrix).not.toBe(actual[1].matrix);
  });
  it('keeps finish identity, iteration, callbacks, independent matrices and additions after compaction',()=>{
    const store=new PlacementStore();store.add('3001.dat','@cyan',1,2,3,Math.PI,0);store.compact();
    store.add('3020.dat','#f2cd37',5,6,7,Math.PI,Math.PI/2);store.compact();
    const rows:{file:string;color:string;matrix:T.Matrix4}[]=[];store.forEach(p=>rows.push(p));
    expect(rows.map(p=>p.file)).toEqual(['3001.dat','3020.dat']);expect(rows.map(p=>p.color)).toEqual(['@cyan','#f2cd37']);
    expect(rows[0].matrix.elements[12]).toBe(1);expect(rows[1].matrix.elements[12]).toBe(5);
    rows[0].matrix.identity();expect([...store][0].matrix.elements[12]).toBe(1);
  });
  it('exports identical lines/inventory for packed data and original matrix records through a transformed parent',()=>{
    const root=new T.Group(),b=new BrickBatch();root.position.set(43.2,-3.008,6.4);root.rotation.y=.47;
    b.withOffset(-4,2.048,1.92,()=>{b.stack('#f2cd37',0,0,0,13,7,5,'stud');b.mold('antenna','#9ba19d',2,7,-3,.39,Math.PI/2);});
    const group=b.build(root),packed=exportBuild(root,'same'),records=[...b.placements];group.userData.placements=records;
    expect(exportBuild(root,'same')).toEqual(packed);expect(records.length).toBe(b.placements.length);
  });
});
