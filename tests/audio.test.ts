import {afterEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import {SOUND_CUES,renderSound,type SoundCue} from '../src/audio/sound-design';
import {GameAudio,loadSoundSettings} from '../src/audio/game-audio';
import {WorldAudio,distanceGain,type SoundFrame} from '../src/audio/world-audio';
import {StationActivities} from '../src/interactions/activities';
import {LOOP_KINDS,renderLoop} from '../src/audio/loop-design';

describe('original sound signals',()=>{
  it('renders every cue as finite, audible, bounded PCM with no hard cut at either end',()=>{
    for(const cue of SOUND_CUES)for(let variant=0;variant<4;variant++) {
      const pcm=renderSound(cue,24000,variant),peak=Math.max(...pcm.map(Math.abs)),rms=Math.sqrt(pcm.reduce((a,b)=>a+b*b,0)/pcm.length);
      expect(pcm.length).toBeGreaterThan(1000);expect(peak,`${cue} peak`).toBeLessThanOrEqual(.781);expect(rms,`${cue} signal`).toBeGreaterThan(.004);
      expect([...pcm].every(Number.isFinite)).toBe(true);expect(Math.abs(pcm[0])).toBe(0);expect(Math.abs(pcm.at(-1)!)).toBeLessThan(.008);
    }
    expect(renderSound('brick')).not.toEqual(renderSound('footstep'));
    expect(renderSound('footstep',24000,0)).not.toEqual(renderSound('footstep',24000,1));
  });
  it('renders distinct continuous mechanical textures with no loop seam click',()=>{
    const signals=LOOP_KINDS.map(kind=>renderLoop(kind));
    for(const pcm of signals) {
      expect(pcm.length).toBe(48000);expect([...pcm].every(Number.isFinite)).toBe(true);
      expect(Math.sqrt(pcm.reduce((n,v)=>n+v*v,0)/pcm.length)).toBeGreaterThan(.012);
      expect(pcm.reduce((n,v)=>Math.max(n,Math.abs(v)),0)).toBeLessThanOrEqual(.721);
      expect(pcm[0]).toBe(pcm.at(-1));
      expect(Math.abs(pcm[1]-pcm[0])).toBeLessThan(.001);
      expect(Math.abs(pcm.at(-1)!-pcm.at(-2)!)).toBeLessThan(.001);
    }
    for(let i=0;i<signals.length;i++)for(let j=i+1;j<signals.length;j++)expect(signals[i]).not.toEqual(signals[j]);
    const build=signals[0],levels=Array.from({length:8},(_,i)=>Math.sqrt(build.slice(i*6000,(i+1)*6000).reduce((n,v)=>n+v*v,0)/6000));
    expect(Math.min(...levels)).toBeGreaterThan(.045);expect(Math.max(...levels)-Math.min(...levels)).toBeGreaterThan(.004);
  });
});
function sink(){return{play:vi.fn<(cue:SoundCue,options?:{volume?:number;pitch?:number;pan?:number})=>boolean>(()=>true),beginFrame:vi.fn(),endFrame:vi.fn(),loop:vi.fn(),quiet:vi.fn()};}
const town:SoundFrame={mode:'town',x:0,z:10,paused:false,airborne:false};
describe('game sound follows actual actions',()=>{
  it('sounds actual walking/running, stays quiet at walls, and avoids teleport/resume bursts',()=>{
    const audio=sink(),world=new WorldAudio(audio);world.update(1/60,town);
    for(let i=1;i<=120;i++)world.update(1/60,{...town,z:10-i*.14});
    const walking=audio.play.mock.calls.filter(c=>c[0]==='footstep').length;expect(walking).toBeGreaterThan(7);expect(walking).toBeLessThan(12);
    for(let i=0;i<120;i++)world.update(1/60,{...town,z:-6.8});expect(audio.play).toHaveBeenCalledTimes(walking);
    world.update(1/60,{...town,z:80});expect(audio.play).toHaveBeenCalledTimes(walking);
    world.update(1/60,{...town,z:80,paused:true});world.update(1/60,{...town,z:80});expect(audio.play).toHaveBeenCalledTimes(walking);
    for(let i=1;i<=60;i++)world.update(1/60,{...town,z:80-i*.24,running:true});
    const running=audio.play.mock.calls.filter(c=>c[0]==='runstep').length;expect(running).toBeGreaterThan(4);expect(running).toBeLessThan(8);
    for(const [cue,options] of audio.play.mock.calls)if(cue==='footstep'||cue==='runstep')expect(options!.volume).toBeLessThanOrEqual(.085);
  });
  it('revs the engine, adds tires only in motion, brakes once per press and clears driving layers on exit',()=>{
    const audio=sink(),world=new WorldAudio(audio),car={...town,driving:true,vehicleSpeed:0,vehicleThrottle:0};
    world.update(.1,car);world.update(.1,car);expect(audio.loop).toHaveBeenCalledWith('motor',.085,.8);
    expect(audio.loop.mock.calls.some(c=>c[0]==='tires')).toBe(false);
    world.update(.1,{...car,x:1,vehicleSpeed:10,vehicleThrottle:1});
    expect(audio.loop).toHaveBeenCalledWith('motor',expect.closeTo(.145,5),1.3);expect(audio.loop).toHaveBeenCalledWith('tires',.03,1.05);
    world.update(.1,{...car,x:1.9,vehicleSpeed:8.5,vehicleThrottle:-1});world.update(.1,{...car,x:2.7,vehicleSpeed:7,vehicleThrottle:-1});
    expect(audio.play.mock.calls.filter(c=>c[0]==='brake')).toHaveLength(1);expect(audio.play.mock.calls.some(c=>c[0]==='impact')).toBe(false);
    world.update(.1,{...car,x:2.8,vehicleSpeed:-7,vehicleThrottle:-1});world.update(.1,{...car,x:2.2,vehicleSpeed:-5.5,vehicleThrottle:1});
    expect(audio.play.mock.calls.filter(c=>c[0]==='brake')).toHaveLength(2);
    world.update(.1,{...car,x:2.2,vehicleSpeed:-3,vehicleThrottle:1});expect(audio.play).toHaveBeenLastCalledWith('impact',{volume:.7});
    const calls=audio.loop.mock.calls.length;world.update(.1,{...town,x:2.2});world.update(.1,{...town,x:2.2});
    expect(audio.quiet).toHaveBeenCalled();expect(audio.loop.mock.calls).toHaveLength(calls);
  });
  it('plays nearby rolling train sound and one approach bell per pass, with a louder on-board layer',()=>{
    const audio=sink(),world=new WorldAudio(audio),frame={...town,train:{x:50,z:10}};
    world.update(.1,frame);world.update(.1,{...frame,train:{x:45,z:10}});expect(audio.loop).not.toHaveBeenCalled();
    world.update(.1,{...frame,train:{x:17,z:10}});world.update(.1,{...frame,train:{x:10,z:10}});
    expect(audio.loop).toHaveBeenCalledWith('rail',expect.any(Number),1,expect.any(Number));
    expect(audio.play.mock.calls.filter(c=>c[0]==='train-bell')).toHaveLength(1);
    world.update(.1,{...frame,train:{x:32,z:10}});world.update(.1,{...frame,train:{x:17,z:10}});
    expect(audio.play.mock.calls.filter(c=>c[0]==='train-bell')).toHaveLength(2);
    world.update(.1,{...frame,paused:true});expect(audio.quiet).toHaveBeenCalled();
    world.update(.1,{...frame,mode:'transit'});world.update(.1,{...frame,mode:'transit'});
    expect(audio.loop).toHaveBeenCalledWith('rail',.11,1.15);
  });
  it('sounds jump/land once and has no footsteps in air, cars, panels or space',()=>{
    const audio=sink(),world=new WorldAudio(audio);world.update(.016,town);
    world.update(.016,{...town,airborne:true,verticalSpeed:9});
    for(let i=0;i<15;i++)world.update(.016,{...town,z:10-i*.2,airborne:true,verticalSpeed:-4});
    world.update(.016,{...town,z:7.2});world.update(.016,{...town,z:7.2});
    expect(audio.play.mock.calls.map(c=>c[0])).toEqual(['jump','land']);
    for(const mode of ['space','observatory','transit','gate','launch','intro'] as const){world.update(.016,{...town,mode});world.update(.016,{...town,mode,x:1,paused:true});}
    expect(audio.play).toHaveBeenCalledTimes(2);
    world.update(.016,{...town,driving:true,vehicleSpeed:10});world.update(.016,{...town,driving:true,vehicleSpeed:12,x:.2});expect(audio.loop).toHaveBeenCalledWith('motor',expect.any(Number),expect.any(Number));
  });
  it('routes every activity family, all arcade outcomes, and throttled build cues',()=>{
    const audio=sink(),world=new WorldAudio(audio),activities=new StationActivities();activities.addCrew('worker','Crew',0,0,'On duty.');
    for(const d of activities.definitions)for(const cmd of d.commands){const result=activities.command(d.id,cmd.id,1)!;world.activity(result);}
    for(const expected of ['switch','drone','cargo','noodles','radio','crew','ride','gate','signal-step','signal-win','open'])expect(audio.play.mock.calls.some(c=>c[0]===expected)).toBe(true);
    world.activity(activities.command('arcade','stop',0)!);expect(audio.play).toHaveBeenLastCalledWith('signal-miss');
    for(const event of ['start','snap','reveal','land','skip'] as const)world.intro(event);
    expect(audio.play).toHaveBeenLastCalledWith('close');expect(audio.quiet).toHaveBeenCalled();
  });
  it('attenuates equipment with distance and releases loops when paused or leaving',()=>{
    expect(distanceGain({x:0,z:0},{x:0,z:0})).toBe(1);expect(distanceGain({x:0,z:0},{x:30,z:0})).toBe(0);
    const audio=sink(),world=new WorldAudio(audio);world.sources.core={x:1,z:10};world.update(.016,town);world.update(.016,{...town,cooling:true});
    expect(audio.loop).toHaveBeenCalledWith('core',expect.any(Number),1,expect.any(Number));
    world.update(.016,{...town,cooling:true,paused:true});expect(audio.quiet).toHaveBeenCalled();
    world.reset();world.update(.016,{...town,mode:'space'});expect(audio.quiet).toHaveBeenCalled();
  });
  it('advances the construction rattle only during actual assembly and stops on skip, finish or reading',()=>{
    const audio=sink(),world=new WorldAudio(audio),intro={...town,mode:'intro' as const,building:false,progress:0};
    world.update(.016,intro);expect(audio.loop).not.toHaveBeenCalled();
    world.update(.016,{...intro,building:true,progress:1});world.update(.016,{...intro,building:true,progress:5});
    const calls=audio.loop.mock.calls;expect(calls[0][0]).toBe('build');expect(calls[1][1]).toBeGreaterThan(calls[0][1]);expect(calls[1][2]).toBeGreaterThan(calls[0][2]);
    const count=calls.length;world.update(.016,{...intro,building:true,progress:8});expect(audio.loop).toHaveBeenCalledTimes(count);
    world.update(.016,{...intro,building:true,progress:3,paused:true});expect(audio.quiet).toHaveBeenCalled();
    world.intro('skip');world.intro('finish');expect(audio.quiet).toHaveBeenCalledTimes(3);
  });
});

class Parameter {value=0;setTargetAtTime=vi.fn((v:number)=>{this.value=v;});}
class Node {connect=vi.fn();disconnect=vi.fn();}
class Source extends Node {buffer:unknown=null;loop=false;playbackRate=new Parameter();onended:(()=>void)|null=null;start=vi.fn();stop=vi.fn(()=>this.onended?.());}
class Oscillator extends Node {type='triangle';frequency=new Parameter();start=vi.fn();stop=vi.fn();}
class Context {
  static instances:Context[]=[];state='suspended';currentTime=0;destination=new Node();sources:Source[]=[];
  constructor(){Context.instances.push(this);}
  resume=vi.fn(async()=>{this.state='running';});suspend=vi.fn(async()=>{this.state='suspended';});close=vi.fn(async()=>{this.state='closed';});
  createGain(){return Object.assign(new Node(),{gain:new Parameter()});}
  createStereoPanner(){return Object.assign(new Node(),{pan:new Parameter()});}
  createBiquadFilter(){return Object.assign(new Node(),{type:'lowpass',frequency:new Parameter()});}
  createDynamicsCompressor(){return Object.assign(new Node(),{threshold:new Parameter(),knee:new Parameter(),ratio:new Parameter(),attack:new Parameter(),release:new Parameter()});}
  createBuffer(_channels:number,length:number,_rate:number){return{length,copyToChannel:vi.fn()};}
  createBufferSource(){const source=new Source();this.sources.push(source);return source;}
  createOscillator(){return new Oscillator();}
}
let dom:JSDOM,audio:GameAudio|undefined;
function audioFixture(supported=true){dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',pretendToBeVisual:true});Context.instances=[];if(supported)Object.defineProperty(dom.window,'AudioContext',{value:Context});audio=new GameAudio(dom.window as unknown as Window,dom.window.localStorage);return audio;}
afterEach(()=>{audio?.dispose();audio=undefined;dom?.window.close();});
describe('audio lifecycle and saved controls',()=>{
  it('reuses physical loop buffers, adjusts playback rate, and stops/disconnects sources on mute',async()=>{
    const sound=audioFixture();await sound.unlock();sound.beginFrame();sound.loop('build',.18,.8);sound.endFrame();
    const first=Context.instances[0].sources[0];expect(first.loop).toBe(true);expect(first.playbackRate.value).toBe(.8);
    sound.beginFrame();sound.loop('build',.15,1.1);sound.endFrame();expect(first.playbackRate.value).toBe(1.1);
    expect(Context.instances[0].sources).toHaveLength(1);sound.setEnabled(false);expect(first.stop).toHaveBeenCalled();expect(first.disconnect).toHaveBeenCalled();
    sound.setEnabled(true);await sound.unlock();sound.beginFrame();sound.loop('build',.1);sound.endFrame();
    expect(Context.instances[0].sources[1].buffer).toBe(first.buffer);sound.quiet();expect(sound.stats.activeLoops).toBe('');
  });
  it('creates no context or sound before a gesture, limits voices and immediately mutes',async()=>{
    const sound=audioFixture();expect(Context.instances).toHaveLength(0);expect(sound.play('brick')).toBe(false);
    dom.window.dispatchEvent(new dom.window.Event('pointerdown'));await sound.unlock();expect(sound.status).toBe('ready');
    for(let i=0;i<50;i++)sound.play('brick');expect(sound.stats.voices).toBe(16);expect(Context.instances[0].sources).toHaveLength(16);
    sound.setEnabled(false);expect(sound.stats.voices).toBe(0);expect(sound.play('brick')).toBe(false);expect(sound.status).toBe('muted');
  });
  it('saves mute/volume, clamps invalid preferences and allows sound to resume',async()=>{
    const sound=audioFixture();sound.setVolume(.25);sound.setEnabled(false);
    expect(loadSoundSettings(dom.window.localStorage)).toEqual({enabled:false,volume:.25});
    dom.window.dispatchEvent(new dom.window.Event('pointerdown'));expect(Context.instances).toHaveLength(0);
    sound.setEnabled(true);await sound.unlock();expect(sound.play('land')).toBe(true);
    sound.setVolume(5);expect(sound.settings.volume).toBe(1);sound.setVolume(Number.NaN);expect(sound.settings.volume).toBe(1);
    expect(loadSoundSettings({getItem:()=>'{broken'})).toEqual({enabled:true,volume:.45});
    expect(loadSoundSettings({getItem:()=>'{"enabled":true,"volume":-1}'})).toEqual({enabled:true,volume:0});
  });
  it('fades machinery when reading and suspends all sounds in hidden tabs',async()=>{
    const sound=audioFixture();await sound.unlock();sound.beginFrame();sound.loop('motor',.001);sound.endFrame();expect(sound.stats.loops).toBe(1);
    sound.quiet();expect(sound.stats.loops).toBe(0);sound.play('footstep');
    Object.defineProperty(dom.window.document,'hidden',{value:true,configurable:true});dom.window.document.dispatchEvent(new dom.window.Event('visibilitychange'));
    expect(sound.stats.voices).toBe(0);expect(Context.instances[0].suspend).toHaveBeenCalled();expect(sound.play('footstep')).toBe(false);
  });
  it('keeps unsupported or rejected audio nonfatal',async()=>{
    const unsupported=audioFixture(false);await unsupported.unlock();expect(unsupported.status).toBe('unavailable');expect(unsupported.play('brick')).toBe(false);unsupported.dispose();dom.window.close();
    const denied=audioFixture();const promise=denied.unlock();await promise;
    const context=Context.instances[0];context.state='suspended';context.resume.mockImplementation(async()=>{throw new Error('Gesture required');});
    await denied.unlock();expect(denied.play('brick')).toBe(false);expect(denied.status).toBe('waiting');
  });
});
