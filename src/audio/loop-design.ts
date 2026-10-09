import {contact,finishSignal,random} from './foley';
export const LOOP_KINDS=['build','motor','rail','air','core','drone','cargo','launch','tires'] as const;
export type LoopKind=typeof LOOP_KINDS[number];
export const LOOP_FILTER:Record<LoopKind,number>={build:5800,motor:1600,rail:2200,air:1400,core:650,drone:2600,cargo:1400,launch:1250,tires:3200};
export function renderLoop(kind:LoopKind,rate=24000) {
  const duration=2,pcm=new Float32Array(rate*duration),rng=random(1789+LOOP_KINDS.indexOf(kind)*7919);let low=0,brown=0;
  if(kind==='build') {
    // Rolling clusters of shuffled bricks and interlocking studs, no melody.
    for(let n=0;n<58;n++) {
      const at=n/29+rng()*.009,body=500+(rng()+1)*490;
      contact(pcm,rate,{at,body,gain:.34+(rng()+1)*.2,decay:.007+(rng()+1)*.004,hard:.7},n*953+313,true);
      if(n%3===0)contact(pcm,rate,{at:at+.013,body:body*.47,gain:.22,decay:.012},n*41+718,true);
    }
  } else {
    for(let i=0;i<pcm.length;i++) {
      const t=i/rate,n=rng();low+=.13*(n-low);brown+=.009*(low-brown);
      const pulse=(f:number)=>Math.sin(2*Math.PI*f*t),texture=low*.5+brown*2;
      if(kind==='air')pcm[i]=low*.42+brown*.7;
      if(kind==='motor')pcm[i]=texture*(.72+pulse(24)*.24)+Math.tanh(pulse(68)*2)*.095+pulse(136)*.03;
      if(kind==='rail')pcm[i]=low*.34+brown*.8+pulse(93)*.025;
      if(kind==='core')pcm[i]=brown*.75+pulse(54)*.075+pulse(108)*.018;
      if(kind==='drone')pcm[i]=low*.23+pulse(186)*(.08+pulse(8)*.018)+pulse(372)*.035+pulse(558)*.018;
      if(kind==='cargo')pcm[i]=texture*.6+Math.tanh(pulse(47)*2)*.06+pulse(141)*.02;
      if(kind==='launch')pcm[i]=brown*3.3+low*.8+pulse(31)*.05+low*pulse(57)*.25;
      if(kind==='tires')pcm[i]=(low*.7+(n-low)*.075+brown*.3)*(.84+pulse(17)*.16);
    }
    if(kind==='rail')for(let n=0;n<8;n++)contact(pcm,rate,{at:n*.25,body:200,gain:.32,decay:.018},n*7919+14,true);
    if(kind==='cargo')for(let n=0;n<12;n++)contact(pcm,rate,{at:n/6,body:420,gain:.13,decay:.007},n*541+79,true);
  }
  return finishSignal(pcm,rate,true);
}
