import type {GaitPose} from './gait';

export const EMOTES=[
  {id:'wave',name:'Wave',description:'Hello from the station.',duration:2.6},
  {id:'salute',name:'Salute',description:'Ready for the next mission.',duration:2.4},
  {id:'cheer',name:'Cheer',description:'A little victory celebration.',duration:3},
  {id:'robot',name:'Robot dance',description:'Strictly rigid joints.',duration:4},
  {id:'shrug',name:'Shrug',description:'Still figuring it out.',duration:2.8},
] as const;
export type EmoteId=typeof EMOTES[number]['id'];
export interface EmotePose extends GaitPose {headYaw:number;weight:number}
export function isEmote(value:string):value is EmoteId{return EMOTES.some(e=>e.id===value);}

export function emotePose(id:EmoteId,elapsed:number,reduced:boolean):EmotePose {
  const duration=EMOTES.find(e=>e.id===id)!.duration;
  const edge=Math.max(0,Math.min(1,elapsed/.18,(duration-elapsed)/.22));
  const p:EmotePose={arms:[-.1,-.1],legs:[0,0],bob:0,lean:0,twist:0,headYaw:0,weight:edge*edge*(3-2*edge)};
  if(id==='wave'){p.arms[1]=-2.35+(reduced?0:Math.sin(elapsed*11)*.25);p.headYaw=-.14;}
  if(id==='salute'){p.arms[1]=-1.7;p.arms[0]=-.16;p.headYaw=-.12;p.lean=reduced?0:-.025;}
  if(id==='cheer'){p.arms=[-2.6,-2.6];p.bob=reduced?0:Math.abs(Math.sin(elapsed*6))*.12;p.headYaw=reduced?0:Math.sin(elapsed*4)*.1;}
  if(id==='robot'){
    const beat=reduced?1:Math.sin(Math.floor(elapsed*5)*Math.PI/2);
    p.arms=[-.95+beat*.7,-.95-beat*.7];p.legs=[beat*.16,-beat*.16];p.twist=reduced?0:beat*.15;p.headYaw=beat*.25;
  }
  if(id==='shrug'){p.arms=[-1.2,-1.2];p.headYaw=reduced?.22:Math.sin(elapsed*3)*.3;p.lean=reduced?0:-.05;}
  return p;
}

// Pose timing is independent of rendering; it never changes world position.
export class Emotes {
  active:EmoteId|null=null;elapsed=0;
  play(id:EmoteId){this.active=id;this.elapsed=0;}
  cancel(){this.active=null;this.elapsed=0;}
  update(dt:number,reduced:boolean):EmotePose|null {
    if(!this.active)return null;
    this.elapsed+=Math.max(0,dt);
    if(this.elapsed>=EMOTES.find(e=>e.id===this.active)!.duration){this.cancel();return null;}
    return emotePose(this.active,this.elapsed,reduced);
  }
}
