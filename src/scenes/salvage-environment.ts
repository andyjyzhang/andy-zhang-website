import * as T from 'three';
import {BrickBatch,sign} from '../world/brick-kit';
import {FLIGHT_DOCK} from '../interactions/flight-game';
import type {FlightResource} from './salvage-models';
import {consolidateStatic,freezeStaticTransforms} from '../world/consolidate';
import {FLIGHT_LEVELS,type FlightLevel} from '../config/flight-levels';
import {PLATE as H} from '../world/part-catalog';

export const SALVAGE_CAMERA_OBSTACLES=[
  {x:0,z:53,w:48,d:45,height:1.2,bottom:-3},
  {x:-24,z:60,w:3,d:32,height:26,bottom:-1},
  {x:24,z:60,w:3,d:32,height:26,bottom:-1},
  {x:0,z:76,w:48,d:3,height:26,bottom:-1},
  {x:0,z:70,w:48,d:15,height:27,bottom:25},
];

export function salvageEnvironment(scene:T.Scene,resources:FlightResource[],level:FlightLevel=FLIGHT_LEVELS[0]){
  const root=new T.Group();root.name=`flight-environment-${level.id}`;scene.add(root);
  scene.background=new T.Color(level.palette.sky);scene.fog=new T.Fog(level.palette.sky,210,460);
  root.add(new T.HemisphereLight('#c7d8e3','#313144',2));
  const sun=new T.DirectionalLight(level.palette.key,3.5);sun.position.set(-70,100,40);root.add(sun);
  const fill=new T.DirectionalLight(level.palette.fill,1.4);fill.position.set(60,20,-70);root.add(fill);
  // Big hull pieces are inexpensive primitives; the detailed surfaces use bricks.
  const cube=new T.BoxGeometry(1,1,1),materials=new Map<string,T.MeshStandardMaterial>();resources.push(cube);
  const hull=(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number)=>{
    if(!materials.has(color)){const material=new T.MeshStandardMaterial({color,roughness:.9});materials.set(color,material);resources.push(material);}
    const mesh=new T.Mesh(cube,materials.get(color));mesh.position.set(x,y,z);mesh.scale.set(w,h,d);parent.add(mesh);return mesh;
  };
  const hangar=new T.Group();hangar.name='salvage-hangar';root.add(hangar);
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
  const dock=new T.Mesh(ringGeo,ringMat);dock.name='salvage-dock';dock.rotation.x=-Math.PI/2;dock.position.set(FLIGHT_DOCK.x,2,FLIGHT_DOCK.z);root.add(dock);

  if(level.kind==='salvage'){
  const wreck=new T.Group();wreck.name='capital-ship-wreck';wreck.position.set(-13,-12,-94);wreck.rotation.z=-.09;root.add(wreck);
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
    hull(root,i%2?'#28343c':'#515d66',x,y,z,6+i%4,1.3,5+i%3).rotation.set(i*.14,i*1.2,i*.09);
    debris.box('#9ba19d',x,y+1,z,2,.8,3,true);
  }
  for(const side of [-1,1])for(let i=0;i<7;i++){
    const x=side*67,z=-52+i*15;
    debris.box('#28343c',x,-3,z,4,3,4,true);debris.box('#9ba19d',x,1,z,1.2,6,1.2);
    debris.box('@cyan',x,5,z,1.5,.6,1.5);
  }
  debris.build(root,'floating-wreckage-and-beacons');
  const arcGeo=new T.TorusGeometry(23,1.8,7,40,Math.PI*1.55),arcMat=new T.MeshStandardMaterial({color:'#57646d',roughness:.9});resources.push(arcGeo,arcMat);
  const arc=new T.Mesh(arcGeo,arcMat);arc.position.set(-91,22,-16);arc.rotation.set(0,.65,.4);root.add(arc);
  }else addLevelScenery(root,level);
  const moonGeo=new T.SphereGeometry(48,32,20),moonMat=new T.MeshStandardMaterial({color:level.palette.stone,roughness:1});resources.push(moonGeo,moonMat);
  const moon=new T.Mesh(moonGeo,moonMat);moon.name='salvage-moon';moon.position.set(level.kind==='assault'?140:-176,100,-240);root.add(moon);
  const stars=new Float32Array(600*3);for(let i=0;i<600;i++){
    const azimuth=i*2.399963,y=1-2*(i+.5)/600,radius=380;
    stars[i*3]=Math.cos(azimuth)*Math.sqrt(1-y*y)*radius;stars[i*3+1]=y*radius;stars[i*3+2]=Math.sin(azimuth)*Math.sqrt(1-y*y)*radius;
  }
  const starGeo=new T.BufferGeometry();starGeo.setAttribute('position',new T.BufferAttribute(stars,3));
  const starMat=new T.PointsMaterial({color:'#cfdae9',size:.65,fog:false});resources.push(starGeo,starMat);root.add(new T.Points(starGeo,starMat));
  consolidateStatic(root);freezeStaticTransforms(root);return root;
}

function addLevelScenery(root:T.Group,level:FlightLevel){
  const b=new BrickBatch(),landmark=new T.Group();landmark.name=`${level.kind}-landmark`;root.add(landmark);
  if(level.kind==='course'){
    // Stepped canyon walls stay outside the flyable corridor.
    for(const side of [-1,1])for(let i=0;i<8;i++){
      const x=side*(74.24+(i%2)*3.84),z=-51.2+i*14.08,height=70+(i%3)*18;
      b.stack('#958a73',x,-12.8,z,28,height,20);
      b.stack('#a95500',x,-12.8+height*H,z,22,6,16);
      b.stack('#6c6e68',x,-12.8+(height+6)*H,z,14,9,12);
      b.stack('#6c6e68',x,-12.8+(height+15)*H,z,14,1,12,'tile');
      b.stack('#958a73',x,-12.8+(height+16)*H,z,4,3,4,'stud');
    }
    b.stack('#958a73',0,-8.192,-70.4,224,4,24);b.stack('#958a73',0,-7.168,-70.4,224,1,24,'tile');
    for(const side of [-1,1])b.stack('#a95500',side*62.72,-6.912,-70.4,16,130,16);
    b.stack('#958a73',0,26.368,-70.4,208,8,16);b.stack('#958a73',0,28.416,-70.4,208,1,16,'tile');
  }
  if(level.kind==='relay'){
    for(let floor=0;floor<7;floor++){
      const y=floor*15*H;
      for(const side of [-1,1])b.stack('@cyan',side*5.44,y+2*H,-20.24,1,9,1,'tile');
    }
  }
  if(level.kind==='escort'){
    // A port lane framed by loading cranes and freighter berths, not asteroids.
    for(const side of [-1,1])for(let i=0;i<4;i++){
      const x=side*70.4,z=-44.8+i*25.6;
      b.stack('#0a3463',x,-7.68,z,24,9,28);b.stack('#0a3463',x,-5.376,z,24,1,28,'tile');b.stack('#5a93db',x,-5.12,z,12,95,8,'stud');
      b.stack('#9ba19d',x-side*3.84,19.2,z,24,4,4,'stud');
      for(let a=0;a<4;a++)b.stack(a%2?'#f2cd37':'#05131d',x-side*8.96,8+a*H*3,z,3,3,4,'stud');
      for(let c=0;c<3;c++)b.stack(c%2?'#fe8a18':'#9ba19d',x,-5.12+c*1.536,z+5.12,10,6,8,'stud');
    }
    for(let i=0;i<8;i++)for(const side of [-1,1]){
      b.stack('#0a3463',side*51.2,-5.12,-51.2+i*12.8,4,6,4,'stud');b.stack('@cyan',side*51.2,-3.584,-51.2+i*12.8,2,2,2,'tile');
    }
    b.stack('#9ba19d',0,-6.4,-67.84,176,8,24);b.stack('#0a3463',0,-4.352,-67.84,128,18,20);
    b.stack('#0a3463',0,.256,-67.84,128,1,20,'tile');
  }
  if(level.kind==='assault'){
    // Broad cruiser silhouette entirely beyond the playable far edge.
    b.stack('#6c6e68',0,2.56,-80.64,192,42,72);
    b.stack('#9ba19d',0,13.312,-80.64,136,6,56);b.stack('#9ba19d',0,14.848,-80.64,136,1,56,'tile');
    b.stack('#05131d',0,14.848,-93.44,32,55,24);b.stack('#9ba19d',0,28.928,-93.44,64,9,32);
    b.stack('#9ba19d',0,31.232,-93.44,64,1,32,'tile');
    for(const side of [-1,1]){
      b.stack('#720e0f',side*48.64,5.12,-67.84,20,24,24,'stud');
      for(let i=0;i<8;i++)b.stack('@red',side*(7.68+i*5.12),14.08,-57.6,3,2,1,'tile');
      b.stack('#05131d',side*70.4,-7.68,-20.48,12,100,12,'stud');
    }
    for(let i=-4;i<=4;i++)b.stack('#720e0f',i*8.96,15.104,-65.28,8,3,16,'stud');
  }
  for(const box of level.obstacles)b.box(box.color??'#9ba19d',box.x,box.y,box.z,box.w,box.h,box.d,true);
  b.build(landmark,`${level.id}-brickwork`);
}

// This owns only environment allocations. Actor pools and shared catalog assets
// survive a level switch; every replaced instance buffer and owned material is freed.
export class FlightEnvironment {
  root:T.Group|null=null;private resources:FlightResource[]=[];
  constructor(private scene:T.Scene){}
  setLevel(level:FlightLevel){this.dispose();this.root=salvageEnvironment(this.scene,this.resources,level);}
  dispose(){
    this.root?.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});this.root?.removeFromParent();this.root=null;
    this.resources.forEach(resource=>resource.dispose());this.resources=[];
  }
}
