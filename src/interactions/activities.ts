import {CITY_LOTS,lotEntrance,GATE} from '../world/city-layout';
import type {Interactable} from './detection';
export type ActivityKind='reactor'|'repair'|'cargo'|'noodles'|'radio'|'transit'|'gate'|'arcade'|'facility'|'crew';
export interface ActivityDefinition {id:string;name:string;kind:ActivityKind;x:number;z:number;description:string;commands:{id:string;label:string}[]}
export interface ActivityResult {definition:ActivityDefinition;on:boolean;count:number;message:string;command:string}
export const ACTIVITY_DEFINITIONS:ActivityDefinition[]=[
  {id:'reactor',name:'Concourse / energy core',kind:'reactor',x:5.12,z:2.56,description:'The station runs on this little brick reactor. Switch its cooling cycle and watch the core wake up.',commands:[{id:'toggle',label:'Switch cooling cycle'}]},
  {id:'repair',name:'Workshop / drone test',kind:'repair',x:25.6,z:-23.68,description:'A survey drone is waiting on its test cradle. Run a short engine test before its next assignment.',commands:[{id:'test',label:'Run drone test'}]},
  {id:'cargo',name:'Freight / loading gantry',kind:'cargo',x:-67.84,z:29.44,description:'Clear the loading lane. The gantry lifts a supply crate, slews toward the delivery pad, and lowers it into place.',commands:[{id:'load',label:'Dispatch a cargo crate'}]},
  {id:'noodles',name:'Noodle / 24H',kind:'noodles',x:64,z:24.96,description:'Even a spaceport needs a late-night noodle stop. The little service hatch delivers a brick-built bowl.',commands:[{id:'order',label:'Order a bowl'}]},
  {id:'radio',name:'Orbit / radio receiver',kind:'radio',x:-67.84,z:65.28,description:'Tune the station receiver. Its dish searches the sky and locks onto the next channel. No audio plays automatically.',commands:[{id:'tune',label:'Tune another channel'}]},
  {id:'transit',name:'Transit / express platform',kind:'transit',x:-50.56,z:-52.48,description:'Take the elevated express through the workshop, market, archive and freight districts. Enjoy a short view from the carriage, then return to this stop.',commands:[{id:'ride',label:'Board the express'}]},
  {id:'gate',name:'Orbital station / orbital gate',kind:'gate',x:GATE.entry[0],z:GATE.entry[1],description:'This ring is a working gateway. Bring the navigation grid online and step through to the orbital observation deck. You can return at any time.',commands:[{id:'activate',label:'Activate gate & cross'}]},
  {id:'arcade',name:'Off duty / signal match',kind:'arcade',x:-35.84,z:35.84,description:'Watch the three signal lamps. Stop on amber to synchronize the cabinet. Use Next signal to step through the lamps at your own pace, including with reduced motion enabled.',commands:[{id:'stop',label:'Stop the signal'},{id:'restart',label:'Start another sweep'},{id:'step',label:'Next signal'}]},
  ...CITY_LOTS.filter(l=>l.name!=='NOODLE / 24H').map((l,i)=>{const[x,z]=lotEntrance(l);return{id:`facility-${i}`,name:l.name,kind:'facility' as const,x,z,description:'Use the facade intercom to switch this block’s arrival beacon. Its street console changes colour so incoming crews can spot the entrance.',commands:[{id:'toggle',label:'Switch arrival beacon'}]};}),
];
export class StationActivities {
  readonly definitions=[...ACTIVITY_DEFINITIONS];
  private state=new Map<string,{on:boolean;count:number;message:string}>();
  constructor() {for(const d of this.definitions)this.state.set(d.id,{on:false,count:0,message:'Ready.'});}
  get items():Interactable[]{return this.definitions.map(d=>({id:d.id,name:d.name,action:d.kind==='arcade'?'Play':'Interact',key:'E',x:d.x,z:d.z,radius:d.kind==='gate'?5:3.4}));}
  find(id:string){return this.definitions.find(d=>d.id===id);}
  status(id:string){return this.state.get(id)?.message??'Ready.';}
  command(id:string,command:string,signal=0):ActivityResult|null {
    const d=this.find(id),s=this.state.get(id);
    if(!d||!s||!d.commands.some(c=>c.id===command))return null;
    s.count++;
    if(d.kind==='reactor'||d.kind==='facility')s.on=!s.on;
    const messages:Record<ActivityKind,string>={
      reactor:s.on?'Cooling cycle online. The core is running.':'Cooling cycle on standby.',
      repair:'Engine test running. Watch the drone lift off and settle onto its cradle.',
      cargo:'Cargo dispatched. The gantry is moving the crate between loading pads.',
      noodles:'Order ready. One bowl, delivered to the service hatch.',
      radio:`Locked onto channel ${['DEEP SPACE / 07','DOCK CONTROL / 12','CREW RADIO / 90.4'][s.count%3]}.`,
      transit:'Express boarding. Escape or Return ends your ride.',gate:'Navigation online. Crossing to the observation deck.',
      arcade:command==='restart'?'Signal sweep running.':command==='step'?'Signal advanced. Stop on amber to synchronize.':signal===1?'Synchronized! Amber signal locked.':'Almost. Step to another signal or restart, then stop on amber.',
      facility:s.on?'Arrival beacon active.':'Arrival beacon on standby.',crew:'The crew member acknowledges you and resumes their station work.',
    };
    s.message=messages[d.kind];return{definition:d,on:s.on,count:s.count,message:s.message,command};
  }
  addCrew(id:string,name:string,x:number,z:number,description:string) {
    this.definitions.push({id,name,kind:'crew',x,z,description,commands:[{id:'wave',label:'Say hello'}]});
    this.state.set(id,{on:false,count:0,message:'On shift.'});
  }
}
