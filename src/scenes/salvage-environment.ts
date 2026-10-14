import * as T from 'three';
import {BrickBatch,sign} from '../world/brick-kit';
import {FLIGHT_DOCK} from '../interactions/flight-game';
import type {FlightResource} from './salvage-models';
import {consolidateStatic} from '../world/consolidate';

export const SALVAGE_CAMERA_OBSTACLES=[
  {x:0,z:53,w:48,d:45,height:1.2,bottom:-3},
  {x:-24,z:60,w:3,d:32,height:26,bottom:-1},
  {x:24,z:60,w:3,d:32,height:26,bottom:-1},
  {x:0,z:76,w:48,d:3,height:26,bottom:-1},
  {x:0,z:70,w:48,d:15,height:27,bottom:25},
];

export function salvageEnvironment(scene:T.Scene,resources:FlightResource[]){
  scene.background=new T.Color('#070e18');scene.fog=new T.Fog('#070e18',210,460);
  scene.add(new T.HemisphereLight('#c7d8e3','#313144',2));
  const sun=new T.DirectionalLight('#ffe0b5',3.5);sun.position.set(-70,100,40);scene.add(sun);
  const fill=new T.DirectionalLight('#91b9ed',1.4);fill.position.set(60,20,-70);scene.add(fill);
  // Big hull pieces are inexpensive primitives; the detailed surfaces use bricks.
  const cube=new T.BoxGeometry(1,1,1),materials=new Map<string,T.MeshStandardMaterial>();resources.push(cube);
  const hull=(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    if(!materials.has(color)){const material=new T.MeshStandardMaterial({color,roughness:.9});materials.set(color,material);resources.push(material);}
    const mesh=new T.Mesh(cube,materials.get(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  };
  const hangar=new T.Group();hangar.name='salvage-hangar';scene.add(hangar);
  hull(hangar,'#37434d',0,-1,53,48,3,45);hull(hangar,'#515d66',0,.7,53,46,.5,44);
  hull(hangar,'#28343c',0,12,76,48,26,3);
  for(const side of [-1,1]){
    hull(hangar,'#37434d',side*24,12,60,3,26,32);
    hull(hangar,'#6b757a',side*24,25,46,4,3,19);
  }
  hull(hangar,'#515d66',0,26,70,48,2,15);
  const details=new BrickBatch();
  for(const side of [-1,1]){
    for(let i=0;i<5;i++){
      details.box('#9ba19d',side*22,12,39+i*8,1,23,1.7);
      details.box('@amber',side*21,16,40+i*8,.35,.5,2.7);
      details.box('#28343c',side*16,1.3,34+i*7,3,.7,2.5,true);
    }
    details.box('#720e0f',side*19,8,74,5,12,1,true);
    details.box('@cyan',side*7,1.3,40,.4,.2,19);
    details.box('#e4cd9e',side*10,1.2,32,1,.3,7);
    for(let i=0;i<4;i++)details.box('#a95500',side*18,2+i*.65,68,3,.6,3,true);
  }
  details.box('#05131d',0,8,74,13,8,1);details.box('@cyan',0,9,73.2,8,1,.2);
  details.box('#163e46',0,1.1,32,15,.4,14,true);details.build(hangar,'hangar-ribs-and-equipment');
  const label=sign(hangar,'CURIOSITY / SALVAGE BAY 07',0,20,74.2,21,1.5,'#28343c','#e4cd9e');resources.push(label.geometry,label.material,label.material.map!);consolidateStatic(hangar);
  const ringGeo=new T.TorusGeometry(6,.13,6,48),ringMat=new T.MeshBasicMaterial({color:'#a3edcb'});resources.push(ringGeo,ringMat);
  const dock=new T.Mesh(ringGeo,ringMat);dock.name='salvage-dock';dock.rotation.x=-Math.PI/2;dock.position.set(FLIGHT_DOCK.x,2,FLIGHT_DOCK.z);scene.add(dock);

  const wreck=new T.Group();wreck.name='capital-ship-wreck';wreck.position.set(-13,-12,-94);wreck.rotation.z=-.09;scene.add(wreck);
  hull(wreck,'#434f59',0,0,0,165,14,38);hull(wreck,'#5b656b',-14,8,2,125,2,32);
  hull(wreck,'#28343c',35,10,-6,20,20,14);hull(wreck,'#687278',35,22,-6,40,5,20);
  const surface=new BrickBatch();
  for(let row=0;row<4;row++)for(let i=0;i<19;i++){
    const x=-74+i*8,z=-12+row*8;
    surface.box((i+row)%4===0?'#9ba19d':'#37434d',x,9+(i%3)*.3,z,6,.5,5);
    if((i+row)%3===0){surface.box('#28343c',x,10,z,2,2,3,true);surface.box('#9ba19d',x+2,11,z,1,1,2);}
  }
  for(let i=0;i<12;i++)surface.box('@amber',18+i*3,22,4.5,1,.7,.4);
  for(const x of [-75,-51,2,70]){surface.box('#720e0f',x,10,4,4,2,11,true);surface.box('#28343c',x,13,4,1.3,5,2);}
  surface.build(wreck,'wreck-panels-and-turrets');consolidateStatic(wreck);
  const debris=new BrickBatch();
  for(let i=0;i<20;i++){
    const x=Math.sin(i*2.4)*74,z=-43+Math.cos(i*1.7)*47,y=-8-(i%5)*2;
    hull(scene,i%2?'#28343c':'#515d66',x,y,z,6+i%4,1.3,5+i%3).rotation.set(i*.14,i*1.2,i*.09);
    debris.box('#9ba19d',x,y+1,z,2,.8,3,true);
  }
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const x=side*67,z=-52+i*15;
    debris.box('#28343c',x,-3,z,4,3,4,true);debris.box('#9ba19d',x,1,z,1.2,6,1.2);
    debris.box('@cyan',x,5,z,1.5,.6,1.5);
  }
  debris.build(scene,'floating-wreckage-and-beacons');
  const arcGeo=new T.TorusGeometry(23,1.8,7,40,Math.PI*1.55),arcMat=new T.MeshStandardMaterial({color:'#57646d',roughness:.9});resources.push(arcGeo,arcMat);
  const arc=new T.Mesh(arcGeo,arcMat);arc.position.set(-91,22,-16);arc.rotation.set(0,.65,.4);scene.add(arc);
  const moonGeo=new T.SphereGeometry(48,32,20),moonMat=new T.MeshStandardMaterial({color:'#b18c73',roughness:1});resources.push(moonGeo,moonMat);
  const moon=new T.Mesh(moonGeo,moonMat);moon.name='salvage-moon';moon.position.set(-176,100,-240);scene.add(moon);
  const stars=new Float32Array(600*3);for(let i=0;i<600;i++){
    const azimuth=i*2.399963,y=1-2*(i+.5)/600,radius=380;
    stars[i*3]=Math.cos(azimuth)*Math.sqrt(1-y*y)*radius;stars[i*3+1]=y*radius;stars[i*3+2]=Math.sin(azimuth)*Math.sqrt(1-y*y)*radius;
  }
  const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.BufferAttribute(stars,3));
  const starMat=new T.PointsMaterial({color:'#cfdae9',size:.65,fog:false});resources.push(starGeo,starMat);scene.add(new T.Points(starGeo,starMat));
}
