import {contact,friction,cabinetNote,finishSignal,type Contact} from './foley';
export const SOUND_CUES=['brick','footstep','runstep','jump','land','enter','exit','select','open','close','travel','ready','switch','drone','cargo','noodles','radio','crew','signal-step','signal-win','signal-miss','launch','gate','return','ride','impact','brake','train-bell'] as const;
export type SoundCue=typeof SOUND_CUES[number];
interface Recipe {duration:number;contacts?:Contact[];scrapes?:[number,number,number,number,number?][];notes?:[number,number,number,number][]}
const hit=(at:number,body:number,gain:number,decay=.022,hard=.6):Contact=>({at,body,gain,decay,hard});
const recipes:Record<SoundCue,Recipe>={
  brick:{duration:.21,contacts:[hit(0,760,.58,.013),hit(.024,1170,.34,.011),hit(.059,460,.22,.018),hit(.084,1650,.14,.007)],scrapes:[[.006,.07,.12,2700]]},
  footstep:{duration:.16,contacts:[hit(0,165,.58,.024,.2),hit(.015,640,.3,.009,.35)],scrapes:[[.018,.095,.25,1850]]},
  runstep:{duration:.14,contacts:[hit(0,125,.67,.027,.2),hit(.013,590,.33,.008,.5)],scrapes:[[.009,.08,.23,2300]]},
  jump:{duration:.24,contacts:[hit(0,270,.25,.01,.25)],scrapes:[[0,.22,.34,2100,1.1]]},
  land:{duration:.24,contacts:[hit(0,110,.8,.038,.25),hit(.017,530,.35,.012),hit(.052,880,.18,.008)],scrapes:[[.009,.1,.23,1600]]},
  enter:{duration:.34,contacts:[hit(0,580,.25),hit(.074,150,.6,.035),hit(.15,970,.4,.01)],scrapes:[[.014,.15,.2,1300]]},
  exit:{duration:.31,contacts:[hit(0,970,.35,.01),hit(.068,450,.32),hit(.15,175,.48,.025)],scrapes:[[.033,.13,.14,1600]]},
  select:{duration:.07,contacts:[hit(0,860,.19,.007,.3)]},
  open:{duration:.19,contacts:[hit(0,370,.25,.015),hit(.044,820,.19,.008)],scrapes:[[.014,.11,.08,1700,.8]]},
  close:{duration:.17,contacts:[hit(0,790,.18,.01),hit(.045,250,.23,.02)]},
  travel:{duration:.32,scrapes:[[0,.3,.3,2400,1.2]],contacts:[hit(.17,660,.23,.012)]},
  ready:{duration:.43,contacts:[hit(0,650,.5,.018),hit(.029,320,.3,.024)],notes:[[.07,.12,880,.06],[.17,.16,1174,.06]]},
  switch:{duration:.14,contacts:[hit(0,1240,.4,.007),hit(.035,330,.35,.013)]},
  drone:{duration:.37,contacts:[hit(0,850,.23)],scrapes:[[.012,.3,.22,1600,1.4]]},
  cargo:{duration:.43,contacts:[hit(0,130,.55,.046),hit(.097,320,.4,.025),hit(.214,460,.36,.018)],scrapes:[[.03,.29,.26,950]]},
  noodles:{duration:.36,contacts:[hit(0,270,.38,.02),hit(.093,1230,.3,.009),hit(.139,760,.23,.016)],scrapes:[[.013,.09,.13,1800]]},
  radio:{duration:.33,scrapes:[[0,.19,.18,3900]],notes:[[.19,.045,1320,.055],[.249,.045,1760,.05]],contacts:[hit(.008,770,.22,.008)]},
  crew:{duration:.18,contacts:[hit(0,380,.21,.015),hit(.047,920,.16,.01)],scrapes:[[.02,.1,.07,1200]]},
  'signal-step':{duration:.085,notes:[[0,.065,1046,.12]]},
  'signal-win':{duration:.48,contacts:[hit(0,1050,.2,.01)],notes:[[0,.13,659,.13],[.105,.15,880,.13],[.24,.22,1318,.12]]},
  'signal-miss':{duration:.25,notes:[[0,.095,392,.12],[.087,.14,294,.11]]},
  launch:{duration:.9,contacts:[hit(0,170,.45,.04),hit(.12,290,.22,.03)],scrapes:[[0,.85,.65,550,1.7],[.08,.66,.19,2100]]},
  gate:{duration:.73,scrapes:[[0,.65,.38,2100,1]],notes:[[.1,.45,146.8,.07],[.25,.4,220,.05]]},
  return:{duration:.25,scrapes:[[0,.19,.22,2400,-.6]],contacts:[hit(.144,520,.22,.013)]},
  ride:{duration:.55,contacts:[hit(0,680,.32,.016),hit(.35,180,.48,.03),hit(.4,950,.25,.01)],scrapes:[[.025,.33,.24,1700]]},
  impact:{duration:.26,contacts:[hit(0,80,.86,.038,.45),hit(.019,410,.48,.015),hit(.045,1220,.25,.008)],scrapes:[[.009,.1,.2,2100]]},
  brake:{duration:.32,contacts:[hit(0,310,.16,.009,.25)],scrapes:[[.002,.29,.4,2800,-.45]]},
  'train-bell':{duration:.65,contacts:[hit(0,980,.36,.075,.08),hit(.21,980,.3,.062,.08)]},
};
export function renderSound(cue:SoundCue,sampleRate=24000,variant=0) {
  const r=recipes[cue],pcm=new Float32Array(Math.ceil(r.duration*sampleRate)),seed=7919*(variant+1)+cue.length*71;
  (r.contacts??[]).forEach((h,i)=>contact(pcm,sampleRate,{...h,body:h.body*(1+(variant%4-1.5)*.045)},seed+i*307));
  (r.scrapes??[]).forEach((s,i)=>friction(pcm,sampleRate,s[0],s[1],s[2],seed+i*953,s[3],s[4]));
  for(const n of r.notes??[])cabinetNote(pcm,sampleRate,...n);
  return finishSignal(pcm,sampleRate);
}
