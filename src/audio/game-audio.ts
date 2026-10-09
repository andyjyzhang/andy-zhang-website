import {renderSound,type SoundCue} from './sound-design';
import {renderLoop,LOOP_FILTER,type LoopKind} from './loop-design';
export type {LoopKind} from './loop-design';

export interface SoundSettings {enabled:boolean;volume:number}
export type AudioStatus='waiting'|'ready'|'muted'|'unavailable';
interface Loop {gain:GainNode;pan:StereoPannerNode;filter:BiquadFilterNode;source:AudioBufferSourceNode;level:number;pitch:number;balance:number;lastUsed:number}
const KEY='andys-world-sound-v1';
export function loadSoundSettings(storage?:Pick<Storage,'getItem'>):SoundSettings {
  try{const s=JSON.parse(storage?.getItem(KEY)??'null');if(s&&typeof s.enabled==='boolean'&&typeof s.volume==='number'&&Number.isFinite(s.volume))return{enabled:s.enabled,volume:Math.max(0,Math.min(1,s.volume))};}catch{/* Private browsing remains usable. */}
  return{enabled:true,volume:.45};
}
export class GameAudio {
  settings:SoundSettings;
  onChange:(()=>void)|null=null;
  private context:AudioContext|null=null;private master:GainNode|null=null;
  private limiter:DynamicsCompressorNode|null=null;
  private buffers=new Map<string,AudioBuffer>();private voices=new Set<AudioBufferSourceNode>();private loops=new Map<LoopKind,Loop>();
  private unlocked=false;private unavailable=false;private frame=0;private variant=0;private played=0;private lastCue='';
  constructor(private environment:Window=window,private storage:Storage|undefined=safeStorage()) {
    this.settings=loadSoundSettings(storage);
    this.environment.addEventListener('pointerdown',this.gesture,true);this.environment.addEventListener('keydown',this.gesture,true);
    this.environment.document.addEventListener('visibilitychange',this.visibility);
  }
  get status():AudioStatus{return !this.settings.enabled?'muted':this.unavailable?'unavailable':this.unlocked?'ready':'waiting';}
  get stats(){const activeLoops=[...this.loops].filter(([,l])=>l.level>0).map(([kind])=>kind);return{status:this.status,voices:this.voices.size,loops:activeLoops.length,activeLoops:activeLoops.join(','),played:this.played,lastCue:this.lastCue};}
  private gesture=()=>{void this.unlock();};
  private visibility=()=>{
    if(this.environment.document.hidden){this.stopAll();void this.context?.suspend().catch(()=>{});}
    else if(this.unlocked&&this.settings.enabled)void this.unlock();
  };
  async unlock() {
    if(!this.settings.enabled||this.unavailable||this.environment.document.hidden)return;
    if(this.unlocked&&this.context?.state==='running')return;
    try {
      if(!this.context) {
        const Context=(this.environment as Window&{AudioContext?:typeof AudioContext}).AudioContext;
        if(!Context){this.unavailable=true;this.onChange?.();return;}
        this.context=new Context();this.master=this.context.createGain();this.limiter=this.context.createDynamicsCompressor();
        this.limiter.threshold.value=-18;this.limiter.knee.value=16;this.limiter.ratio.value=3;this.limiter.attack.value=.004;this.limiter.release.value=.12;
        this.master.gain.value=this.settings.volume;this.master.connect(this.limiter);this.limiter.connect(this.context.destination);
      }
      if(this.context.state==='suspended')await this.context.resume();
      this.unlocked=this.context.state==='running';this.onChange?.();
    } catch {this.unlocked=false;this.onChange?.();}
  }
  private save(){try{this.storage?.setItem(KEY,JSON.stringify(this.settings));}catch{/* Sound still works without persistence. */}this.onChange?.();}
  setEnabled(enabled:boolean){this.settings.enabled=enabled;if(!enabled)this.stopAll();this.applyVolume();this.save();if(enabled)void this.unlock();}
  setVolume(volume:number){if(!Number.isFinite(volume))return;this.settings.volume=Math.max(0,Math.min(1,volume));if(this.settings.volume===0)this.stopAll();this.applyVolume();this.save();}
  private applyVolume(){if(this.master&&this.context)this.master.gain.setTargetAtTime(this.settings.enabled?this.settings.volume:0,this.context.currentTime,.015);}
  play(cue:SoundCue,options:{volume?:number;pan?:number;pitch?:number}={}) {
    if(!this.unlocked||!this.settings.enabled||!this.settings.volume||this.environment.document.hidden||!this.context||!this.master||this.context.state!=='running')return false;
    if(this.voices.size>=16)return false;
    const variant=this.variant++%4,key=`${cue}/${variant}`;let buffer=this.buffers.get(key);
    if(!buffer){const pcm=renderSound(cue,24000,variant);buffer=this.context.createBuffer(1,pcm.length,24000);buffer.copyToChannel(pcm,0);this.buffers.set(key,buffer);}
    const source=this.context.createBufferSource(),gain=this.context.createGain(),pan=this.context.createStereoPanner();
    source.buffer=buffer;source.playbackRate.value=options.pitch??1;gain.gain.value=options.volume??1;pan.pan.value=Math.max(-1,Math.min(1,options.pan??0));
    source.connect(gain);gain.connect(pan);pan.connect(this.master);this.voices.add(source);
    source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();pan.disconnect();};source.start();this.played++;this.lastCue=cue;return true;
  }
  beginFrame(){this.frame++;}
  loop(kind:LoopKind,level:number,pitch=1,balance=0) {
    level=Math.max(0,Math.min(.2,level));if(!this.unlocked||!this.settings.enabled||!this.settings.volume||!this.context||!this.master)return;
    let loop=this.loops.get(kind);if(!loop&&level<=0)return;
    const ctx=this.context;
    if(!loop) {
      const gain=ctx.createGain(),pan=ctx.createStereoPanner(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=LOOP_FILTER[kind];
      gain.gain.value=0;gain.connect(filter);filter.connect(pan);pan.connect(this.master);
      const key=`loop/${kind}`;let buffer=this.buffers.get(key);
      if(!buffer){const pcm=renderLoop(kind,24000);buffer=ctx.createBuffer(1,pcm.length,24000);buffer.copyToChannel(pcm,0);this.buffers.set(key,buffer);}
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;source.playbackRate.value=pitch;source.connect(gain);source.start();
      loop={gain,pan,filter,source,level:0,pitch,balance:0,lastUsed:this.frame};this.loops.set(kind,loop);
    }
    loop.lastUsed=this.frame;
    if(Math.abs(loop.level-level)>.002||(level===0&&loop.level>0)||(level>0&&loop.level===0)){loop.gain.gain.setTargetAtTime(level,ctx.currentTime,.07);loop.level=level;}
    if(Math.abs(loop.pitch-pitch)>.008){loop.source.playbackRate.setTargetAtTime(Math.max(.35,Math.min(2.5,pitch)),ctx.currentTime,.09);loop.pitch=pitch;}
    if(Math.abs(loop.balance-balance)>.015){loop.pan.pan.setTargetAtTime(Math.max(-1,Math.min(1,balance)),ctx.currentTime,.08);loop.balance=balance;}
  }
  endFrame(){for(const [kind,l] of this.loops)if(l.lastUsed!==this.frame)this.loop(kind,0);}
  quiet(){this.beginFrame();this.endFrame();}
  stopAll(){for(const voice of this.voices){try{voice.stop();}catch{/* Already finished. */}}this.voices.clear();for(const l of this.loops.values()){l.gain.gain.value=0;l.source.stop();l.source.disconnect();l.gain.disconnect();l.filter.disconnect();l.pan.disconnect();}this.loops.clear();}
  dispose(){this.stopAll();this.environment.removeEventListener('pointerdown',this.gesture,true);this.environment.removeEventListener('keydown',this.gesture,true);this.environment.document.removeEventListener('visibilitychange',this.visibility);void this.context?.close().catch(()=>{});this.context=null;this.unlocked=false;}
}
function safeStorage(){try{return window.localStorage;}catch{return undefined;}}
