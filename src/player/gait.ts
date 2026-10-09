import {PLAYER_TUNING} from '../config/controls';
export interface GaitPose {legs:[number,number];arms:[number,number];bob:number;lean:number;twist:number}
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
// Rigid hip/shoulder hinges, deliberate extended strides and brisk contact beats.
// Original animation; no proprietary game clips or flexible human knees.
export function gaitPose(distance:number,speed:number,blend:number,airborne=false,verticalSpeed=0,reducedMotion=false):GaitPose {
  if(airborne)return {legs:[verticalSpeed>0?-.9:.35,verticalSpeed>0?.55:-.22],arms:[-1.05,-1.05],bob:0,lean:reducedMotion?0:.05,twist:0};
  const run=clamp((speed-PLAYER_TUNING.walkSpeed)/(PLAYER_TUNING.runSpeed-PLAYER_TUNING.walkSpeed)),phase=distance*1.9;
  const beat=Math.sin(phase),held=Math.atan(beat*(1+run*.8))/Math.atan(1+run*.8);
  const legs=held*(.58+run*.5)*blend,arms=held*(.5+run*.68)*blend;
  return {legs:[-legs,legs],arms:[arms-.1,-arms-.1],bob:reducedMotion?0:Math.sin(phase*2)**2*(.025+run*.07)*blend,lean:reducedMotion?0:(.025+run*.105)*blend,twist:reducedMotion?0:beat*.045*run*blend};
}
