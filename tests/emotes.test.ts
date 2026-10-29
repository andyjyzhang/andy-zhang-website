import {describe,expect,it} from 'vitest';
import * as T from 'three';
import {EMOTES,Emotes,emotePose} from '../src/player/emotes';
import {Player} from '../src/player/controller';
import type {Input} from '../src/player/input';

const input=(...keys:string[])=>({down:(...codes:string[])=>codes.some(c=>keys.includes(c)),pressed:(code:string)=>keys.includes(code)}) as unknown as Input;
describe('minifigure emotes',()=>{
  it('provides five distinct bounded rigid-joint poses and ends each animation',()=>{
    const poses=new Set<string>();
    for(const emote of EMOTES){
      const state=new Emotes();state.play(emote.id);const pose=state.update(.7,false)!;
      poses.add(JSON.stringify([pose.arms,pose.legs,pose.headYaw]));
      for(let t=0;t<emote.duration;t+=.03){const sample=emotePose(emote.id,t,false);expect([...sample.arms,...sample.legs,sample.bob,sample.lean,sample.twist,sample.headYaw,sample.weight].every(Number.isFinite)).toBe(true);expect(Math.max(...sample.arms.map(Math.abs))).toBeLessThan(3);}
      state.update(emote.duration,false);expect(state.active).toBeNull();expect(state.update(.1,false)).toBeNull();
    }
    expect(poses.size).toBe(5);
  });
  it('holds reduced-motion poses without bob, twist or repeated joint movement',()=>{
    for(const {id}of EMOTES){const a=emotePose(id,.5,true),b=emotePose(id,1.2,true);expect(a.bob+a.twist+a.lean).toBe(0);expect(a).toEqual(b);}
  });
  it('keeps the player in place, cancels for movement/jump and resets on teleport',()=>{
    const player=new Player(new T.Group()),start=player.position.clone();player.motion.vx=8;
    expect(player.playEmote('wave')).toBe(true);player.update(.5,input(),0,[],true,false);
    expect(player.position.equals(start)).toBe(true);expect(player.emotes.active).toBe('wave');expect(player.model.arms[1].rotation.x).toBeLessThan(-1.5);
    player.update(.05,input('KeyW'),0,[],true,false);expect(player.emotes.active).toBeNull();
    player.playEmote('cheer');player.update(.05,input('Space'),0,[],true,false);expect(player.emotes.active).toBeNull();expect(player.playEmote('salute')).toBe(false);
    player.teleport(0,10);player.playEmote('robot');player.update(.5,input(),0,[],true,false);player.teleport(1,2);
    expect(player.emotes.active).toBeNull();expect(player.model.body.rotation.y).toBe(0);expect(player.model.head.rotation.y).toBe(0);
  });
  it('cancels a pose when pausing and never leaves raised arms after a hard transition',()=>{
    const player=new Player(new T.Group());player.playEmote('cheer');player.update(.4,input(),0,[],true,false);
    player.update(.1,input(),0,[],false,false);expect(player.emotes.active).toBeNull();
    player.playEmote('salute');player.update(.4,input(),0,[],true,false);player.stopEmote();
    expect(player.model.arms.map(a=>a.rotation.x)).toEqual([-.1,-.1]);expect(player.emotes.active).toBeNull();
  });
});
