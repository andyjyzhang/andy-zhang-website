// Small offline generators for original plastic contact, friction and air layers.
// Each contact excites a noisy, inharmonic body rather than a clean pitched beep.
export function random(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};}
export interface Contact {at:number;body:number;gain:number;decay?:number;hard?:number}
export function contact(pcm:Float32Array,rate:number,c:Contact,seed:number,wrap=false) {
  const rng=random(seed),decay=c.decay??.025,hard=c.hard??.55,start=Math.round(c.at*rate),length=Math.ceil(decay*7*rate);
  const tint=1+rng()*.1,modes=[c.body*tint,c.body*2.73*tint,c.body*4.41*tint];let soft=0;
  for(let i=0;i<length;i++) {
    const t=i/rate,noise=rng();soft+=.16*(noise-soft);
    const attack=Math.min(1,t/.0006),shell=Math.exp(-t/decay);
    const transient=(noise-soft)*Math.exp(-t/(.0018+hard*.0015))*(.9+hard*.5);
    const rough=soft*Math.exp(-t/(decay*.65))*.8;
    const ring=(Math.sin(2*Math.PI*modes[0]*t)*.29+Math.sin(2*Math.PI*modes[1]*t)*.15+Math.sin(2*Math.PI*modes[2]*t)*.09)*shell;
    const index=wrap?((start+i)%pcm.length+pcm.length)%pcm.length:start+i;
    if(index>=pcm.length)break;if(index>=0)pcm[index]+=c.gain*attack*(transient+rough+ring);
  }
}
export function friction(pcm:Float32Array,rate:number,at:number,length:number,gain:number,seed:number,cutoff=1400,sweep=0) {
  const rng=random(seed);let low=0,warm=0;
  for(let i=0;i<length*rate;i++) {
    const t=i/rate,p=t/length,index=Math.round(at*rate)+i;if(index>=pcm.length)break;
    const alpha=1-Math.exp(-2*Math.PI*(cutoff*(1+sweep*p))/rate);low+=alpha*(rng()-low);warm+=.018*(low-warm);
    pcm[index]+=gain*Math.sin(Math.PI*p)**1.4*(low-warm*.45);
  }
}
export function cabinetNote(pcm:Float32Array,rate:number,at:number,length:number,frequency:number,gain:number) {
  for(let i=0;i<length*rate;i++) {
    const t=i/rate,index=Math.round(at*rate)+i;if(index>=pcm.length)break;
    const phase=2*Math.PI*frequency*t;
    pcm[index]+=gain*Math.min(1,t/.004)*(1-t/length)**2*(Math.sin(phase)+Math.sin(phase*2)*.08);
  }
}
export function finishSignal(pcm:Float32Array<ArrayBuffer>,rate:number,seamless=false) {
  const peak=pcm.reduce((m,v)=>Math.max(m,Math.abs(v)),0),scale=peak>.72?.72/peak:1;
  const edge=Math.max(1,Math.round(rate*.002));
  for(let i=0;i<pcm.length;i++)pcm[i]*=scale*(seamless?1:Math.min(1,i/edge,(pcm.length-1-i)/(rate*.006)));
  if(seamless) {
    // Ease both edges into the same contact level without creating a jump in
    // the adjacent samples. Matching just the endpoints can still click.
    const boundary=(pcm[0]+pcm[pcm.length-1])*.5;
    for(let i=0;i<edge;i++) {
      const blend=Math.sin(i/edge*Math.PI*.5)**2,tail=pcm.length-1-i;
      pcm[i]=boundary*(1-blend)+pcm[i]*blend;
      pcm[tail]=boundary*(1-blend)+pcm[tail]*blend;
    }
  }
  return pcm;
}
