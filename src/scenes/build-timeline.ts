import * as T from 'three';
import {WORLD_STYLE} from '../config/station';

export const BUILD_DURATION=10.4;
export const BUILD_ARRIVAL=9.55;
export const BUILD_LANDING=10.05;
export const STREET_VIEW={yaw:.12,pitch:.42,distance:19};
const streetTarget=new T.Vector3(0,.512+1.8,10);
const streetEye=streetTarget.clone().add(new T.Vector3(Math.sin(.12)*Math.cos(.42),Math.sin(.42),Math.cos(.12)*Math.cos(.42)).multiplyScalar(19));
const wide=new T.Vector3(...WORLD_STYLE.overview);
const hero=wide.clone().applyAxisAngle(new T.Vector3(0,1,0),-.035);
const reveal=new T.CatmullRomCurve3([new T.Vector3(5.5,4.8,7.5),new T.Vector3(40,20,65),new T.Vector3(130,44,190),wide]);
const approach=new T.CatmullRomCurve3([hero,new T.Vector3(28,70,64),new T.Vector3(6,30,35),streetEye]);
const startTarget=new T.Vector3(0,.768,0),wideTarget=new T.Vector3(...WORLD_STYLE.overviewTarget);
const smooth=(t:number,a:number,b:number)=>T.MathUtils.smootherstep(t,a,b);

// The stage list is hull, streets, concourse, five landmarks, city, vehicles,
// launch bay. Construction order is separate from scene/component ownership.
export function buildStageTiming(index:number) {
  if(index===0)return{start:.95,duration:1.65};
  if(index===1)return{start:1.9,duration:1.25};
  if(index===2)return{start:2.7,duration:.8};
  if(index===8)return{start:3.0,duration:3.35};
  if(index<8)return{start:4.25+(index-3)*.18,duration:1.65};
  return{start:6.55+(index-9)*.13,duration:.85};
}

export function buildCamera(time:number,position:T.Vector3,target:T.Vector3,aspect=16/9) {
  if(time<=6.2) {
    reveal.getPoint(smooth(time,.5,6.2),position);
    target.lerpVectors(startTarget,wideTarget,smooth(time,1.3,6.2));
  } else if(time<8.4) {
    position.copy(wide).applyAxisAngle(new T.Vector3(0,1,0),-.035*smooth(time,6.2,8.4));target.copy(wideTarget);
  } else {
    const t=smooth(time,8.4,BUILD_DURATION);approach.getPoint(t,position);target.lerpVectors(wideTarget,streetTarget,t);
  }
  // Narrow phones reveal the whole station before approaching the player.
  const fit=Math.min(2.2,Math.max(1,1.4/aspect)),weight=smooth(time,.6,4)*(1-smooth(time,8.4,BUILD_DURATION));
  position.multiplyScalar(1+(fit-1)*weight);
}
