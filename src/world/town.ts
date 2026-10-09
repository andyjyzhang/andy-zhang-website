import * as T from 'three';
import {BrickBatch,lamp,sign,bench} from './brick-kit';
import {landmarks} from '../config/world';
import {WORLD_STYLE as style} from '../config/station';
import {STUD as S,PLATE as H} from './part-catalog';
import {addCity} from './city';
import {consolidateStatic} from './consolidate';
import {SurfaceGrid} from './surface-grid';
import type {Obstacle} from './collision';
import {stationHull} from './station-hull';
import {BoosterExhaust} from './booster-exhaust';

export function createTown() {
  const root=new T.Group(),stages:T.Group[]=[],obstacles:Obstacle[]=[],base=new BrickBatch();
  const w=Math.round(style.size[0]/S),d=Math.round(style.size[1]/S),surface=new SurfaceGrid(w,d,style.ground);
  base.stack(style.ground,0,0,0,w,1,d);
  stationHull(base,w,d);
  stages.push(base.build(root,'station-hull'));
  const street=new T.Group();root.add(street);stages.push(street);
  surface.stack(style.paving,0,H,0,34,1,34,'tile');
  for(const l of landmarks) {
    surface.box(style.paving,l.x,.384,l.z,l.width+2.56,H,l.depth+2.56);
    surface.box(style.paving,l.entry[0],.384,l.entry[1],5.12,H,5.12);
  }
  const hardware=new BrickBatch();
  // Concourse energy core: standard brick columns, connected fins and native dishes.
  hardware.stack('#0a3463',0,.512,-3.84,10,3,10,'stud');
  hardware.stack('#9ba19d',0,1.28,-3.84,4,15,4,'stud');
  for(const side of [-1,1]) {
    hardware.stack('#008f9b',side*2.56,1.28,-3.84,2,15,6,'stud');
    hardware.stack('@cyan',side*1.6,1.28,-1.6,1,12,1);
  }
  hardware.mold('dish','@cyan',0,6.144,-3.84);
  hardware.obstacle({x:0,z:-3.84,w:6.4,d:6.4,height:6.272,bottom:.512,label:'concourse reactor'});
  for(const [x,z] of [[-10.88,-10.88],[10.88,-10.88],[-10.88,10.88],[10.88,10.88]])lamp(hardware,x,z,true);
  bench(hardware,8.96,6.4);
  sign(root,"ANDY'S ORBITAL STATION",0,2.56,0,7.68,.64,'#0a3463','#aee9ef');
  stages.push(hardware.build(root,'concourse-equipment'));
  const city=new T.Group();root.add(city);stages.push(city);addCity(city,obstacles,surface);surface.build(street);
  root.traverse(o=>{if(o.userData.colliders)obstacles.push(...o.userData.colliders as Obstacle[]);});
  stages.forEach(consolidateStatic);
  const boosters=new BoosterExhaust(stages[0]);
  return{root,stages,obstacles,boosters};
}
