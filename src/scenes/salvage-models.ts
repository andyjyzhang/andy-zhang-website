import * as T from 'three';
import {BrickBatch} from '../world/brick-kit';

export type FlightResource={dispose:()=>void};

// Original brick-built foil-wing courier; the nose points along local +Z.
export function courierModel(resources:FlightResource[]){
  const root=new T.Group();root.name='salvage-ship';
  const b=new BrickBatch(),white='#d9dddb',red='#720e0f',dark='#28343c';
  b.box(white,0,0,0,2.5,.9,7.6,true);b.box(white,0,-.5,3,1.3,.7,5);
  b.box(red,0,.55,3,.65,.3,4.5);b.box(dark,0,.6,-1.8,2.5,.6,2.5,true);
  b.box('#559ab7',0,1,0,1.8,.8,2);b.box(white,0,1.6,-.9,1.8,.35,.7);
  b.box(dark,0,1.55,.8,1.9,.18,.3);b.box(dark,0,1.6,0,.3,.18,2.2);
  b.mold('roundBrick',white,0,1.7,-2);b.mold('dish','#008f9b',0,2,-2);
  b.mold('roundTile','#c91a09',0,2.3,-2);b.box(red,0,.5,-3.4,2.8,.4,.6);
  for(const side of [-1,1]){
    b.box(dark,side*2.1,-.2,-1.8,2,.5,1.8);
    for(const level of [-1,1]){
      const wing=new T.Group(),w=new BrickBatch();wing.position.set(side*1.1,level*.15,-1.5);wing.rotation.z=side*level*.22;
      w.box(white,side*2.2,0,0,4.5,.32,3.4,true);w.box(red,side*3.3,.15,.2,.65,.26,3.1);
      w.box(dark,side*3.7,.2,-.8,.8,.75,3.2);w.mold('roundBrick',white,side*3.7,.5,-1.4);
      w.box(dark,side*4.4,0,1.8,.4,.4,5);w.box('#9ba19d',side*4.4,0,4.4,.45,.45,.7);
      w.box(red,side*4.4,.24,2.8,.5,.2,1.2);w.build(wing,'courier-foil');root.add(wing);
    }
    for(let i=0;i<3;i++)b.box('#9ba19d',side*1.3,.5,-3+i*.7,.5,.3,.4);
  }
  b.build(root,'courier-fuselage');
  const nozzleGeo=new T.CylinderGeometry(.5,.55,.8,10),nozzleMat=new T.MeshStandardMaterial({color:dark,roughness:.75});
  const glowGeo=new T.SphereGeometry(.36,8,6),glowMat=new T.MeshBasicMaterial({color:'#9cdfff'});
  const flameGeo=new T.ConeGeometry(.4,3,6),flameMat=new T.MeshBasicMaterial({color:'#aedfff',transparent:true,opacity:.8});
  resources.push(nozzleGeo,nozzleMat,glowGeo,glowMat,flameGeo,flameMat);
  const flames:T.Mesh[]=[];
  for(const side of [-1,1])for(const level of [-1,1]){
    const x=side*4.7,y=level*.9;
    const nozzle=new T.Mesh(nozzleGeo,nozzleMat);nozzle.rotation.x=Math.PI/2;nozzle.position.set(x,y,-4.1);root.add(nozzle);
    const glow=new T.Mesh(glowGeo,glowMat);glow.position.set(x,y,-4.55);glow.scale.set(1,1,.35);root.add(glow);
    const flame=new T.Mesh(flameGeo,flameMat);flame.rotation.x=Math.PI/2;flame.position.set(x,y,-5.5);root.add(flame);flames.push(flame);
  }
  return{root,flames};
}

export function patrolModel(resources:FlightResource[]){
  const root=new T.Group();root.name='salvage-patrol';
  const b=new BrickBatch();b.box('#28343c',0,0,0,2.3,2.3,2.3,true);b.box('#9ba19d',0,0,1.3,1.9,1.9,.35);
  b.box('@red',0,0,1.65,1.1,.65,.3);b.box('#720e0f',0,-.7,1.7,.4,.4,.9);
  for(const side of [-1,1]){
    b.box('#9ba19d',side*1.7,0,0,1.7,.65,.8);
    b.box('#05131d',side*3,0,0,.35,5.7,4.4);
    for(const y of [-2.8,0,2.8])b.box('#9ba19d',side*3.25,y,0,.4,.3,4.6);
    for(const z of [-2.1,2.1])b.box('#9ba19d',side*3.25,0,z,.4,5.7,.3);
    for(const y of [-1.5,1.5])b.box('#28343c',side*3.3,y,0,.4,.2,4.2);
  }
  b.build(root,'patrol-panels');
  const geo=new T.SphereGeometry(1.35,12,8),mat=new T.MeshStandardMaterial({color:'#53616a',roughness:.8});resources.push(geo,mat);
  root.add(new T.Mesh(geo,mat));return root;
}

export function cargoModel(resources:FlightResource[]){
  const root=new T.Group(),b=new BrickBatch();root.name='salvage-cargo';
  b.box('#9ba19d',0,0,0,2.6,2.1,2.6,true);b.box('#a95500',0,.2,0,2.7,.5,2.7);
  for(const side of [-1,1]){b.box('#28343c',side*.9,0,0,.4,2.3,2.8);b.box('#efbd76',0,0,side*1.4,.65,.6,.2);}
  b.box('#05131d',0,1.4,0,1.8,.4,1.8);b.box('@amber',0,1.65,0,.65,.2,.65);b.build(root);
  const geometry=new T.TorusGeometry(3.5,.08,5,32),material=new T.MeshBasicMaterial({color:'#efbd76'});resources.push(geometry,material);
  const ring=new T.Mesh(geometry,material);ring.rotation.x=-Math.PI/2;ring.position.y=-1.4;root.add(ring);
  return{root,ring,material};
}
