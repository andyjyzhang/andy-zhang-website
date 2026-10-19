import * as T from 'three';
import {BrickBatch} from './brick-kit';
import {WORLD_STYLE as style} from '../config/station';
import {STUD as S,PLATE as H} from './part-catalog';
import {CITY_LOTS,STREETS} from './city-layout';
import {spaceBuilding,facilitySign,buildingColor} from './city-buildings';
import {buildOrbitalGate} from './orbital-gate';
import type {SurfaceGrid} from './surface-grid';
import type {Obstacle} from './collision';
import {buildTransit} from './transit';
import {addStreetFurniture} from './street-furniture';

export function addCity(root:T.Group,obstacles:Obstacle[],surface:SurfaceGrid) {
  const detail=new BrickBatch();
  for(const street of STREETS) {
    const vertical=street.d>street.w;
    surface.box(style.paving,street.x,.384,street.z,street.w+(vertical?3.84:0),H,street.d+(vertical?0:3.84));
    surface.box(style.road,street.x,.384,street.z,street.w,H,street.d);
    const length=vertical?street.d:street.w;
    for(let a=-length/2+3.84;a<length/2;a+=7.68)surface.stack('#f2cd37',street.x+(vertical?0:a),H,street.z+(vertical?a:0),vertical?1:4,1,vertical?4:1,'tile');
  }
  for(const x of [-58.88,38.4,99.84])for(const z of [16.64,52.48])for(let i=-3;i<=3;i++)surface.stack('#f4f4f4',x+i*1.28,H,z,1,1,12,'tile');
  CITY_LOTS.forEach((lot,i)=>{
    const color=buildingColor(lot.design,i);
    surface.stack(style.paving,lot.x,H,lot.z,lot.w+4,1,lot.d+4,'tile');
    const building=new T.Group();building.position.set(lot.x,0,lot.z);building.rotation.y=lot.facing??0;root.add(building);
    const bricks=new BrickBatch(),roof=spaceBuilding(bricks,0,0,.512,lot.w,lot.d,lot.floors,color,lot.design,i);
    bricks.build(building,'city-parcel');facilitySign(building,lot.name,0,0,lot.d,lot.w);
    obstacles.push({x:lot.x,z:lot.z,w:(lot.w+2)*S,d:(lot.d+2)*S,height:roof+10,label:lot.name});
  });
  buildTransit(root);
  addStreetFurniture(detail,surface);
  // Sidewall docking collars and radiator banks make the plinth a station hull.
  for(let i=-5;i<=5;i++) {
    const x=i*19.2;detail.stack('#0a3463',x,.512,99.84,20,12,4,'stud');
    for(let a=-3;a<=3;a++)detail.stack('#9ba19d',x+a*S,3.584,99.84,1,6,4,'stud');
    detail.obstacle({x,z:99.84,w:20*S,d:4*S,height:5.12,bottom:.512,label:'radiator bank'});
  }
  detail.build(root,'city-transit-and-details');
  buildOrbitalGate(root,obstacles);
}
