import * as T from 'three';
import { createMinifigure } from './minifigure';
import type { Input } from './input';
import type { Obstacle } from '../world/collision';
import { Locomotion,groundHeight } from './locomotion';
import {gaitPose} from './gait';
import {PLAYER_TUNING} from '../config/controls';
import {Emotes,type EmoteId} from './emotes';
export { groundHeight } from './locomotion';

export class Player {
  readonly model = createMinifigure();
  readonly position = new T.Vector3(0, groundHeight(0,10), 10);
  readonly motion = new Locomotion();
  readonly emotes=new Emotes();
  moving = false;
  private clock = 0;
  private strideBlend = 0;
  get velocityY() { return this.motion.vy; }
  set velocityY(value: number) { this.motion.vy = value; }
  get airborne() { return this.motion.airborne; }
  set airborne(value: boolean) { this.motion.airborne = value; }
  constructor(parent: T.Object3D) { this.model.root.name='Andy';parent.add(this.model.root); this.model.root.position.copy(this.position); }
  teleport(x: number, z: number) { this.stopEmote();this.motion.teleport(x, z); this.position.set(x, this.motion.y, z); this.model.root.position.copy(this.position); }
  playEmote(id:EmoteId){if(this.airborne)return false;this.motion.vx=this.motion.vz=0;this.strideBlend=0;this.emotes.play(id);return true;}
  stopEmote(){this.emotes.cancel();this.model.arms.forEach(arm=>arm.rotation.x=-.1);this.model.legs.forEach(leg=>leg.rotation.x=0);this.model.body.position.y=0;this.model.body.rotation.set(0,0,0);this.model.head.rotation.y=0;}
  update(dt: number, input: Input, yaw: number, obstacles: Obstacle[], enabled: boolean, reducedMotion: boolean) {
    this.clock += dt;
    this.motion.x = this.position.x; this.motion.y = this.position.y; this.motion.z = this.position.z;
    const jumpHeld = input.down('Space');
    this.motion.update(dt, { x: Number(input.down('KeyD')) - Number(input.down('KeyA')), z: Number(input.down('KeyS')) - Number(input.down('KeyW')), running: input.down('ShiftLeft', 'ShiftRight'), jump: input.pressed('Space'), jumpHeld }, yaw, obstacles, enabled);
    this.position.set(this.motion.x, this.motion.y, this.motion.z); this.moving = this.motion.speed > .1;
    this.model.root.position.copy(this.position); this.model.root.rotation.y = this.motion.heading;
    this.strideBlend = T.MathUtils.damp(this.strideBlend, enabled && this.moving && !this.airborne ? Math.min(1, this.motion.speed / PLAYER_TUNING.walkSpeed) : 0, 20, dt);
    const pose=gaitPose(this.motion.distance,this.motion.speed,this.strideBlend,this.airborne,this.motion.vy,reducedMotion);
    if(!enabled||this.airborne||input.down('KeyW','KeyA','KeyS','KeyD','Space'))this.emotes.cancel();
    const emote=this.emotes.update(dt,reducedMotion);
    if(emote){
      pose.arms=pose.arms.map((angle,i)=>T.MathUtils.lerp(angle,emote.arms[i],emote.weight)) as [number,number];
      pose.legs=pose.legs.map((angle,i)=>T.MathUtils.lerp(angle,emote.legs[i],emote.weight)) as [number,number];
      pose.bob=T.MathUtils.lerp(pose.bob,emote.bob,emote.weight);pose.lean=T.MathUtils.lerp(pose.lean,emote.lean,emote.weight);pose.twist=T.MathUtils.lerp(pose.twist,emote.twist,emote.weight);
    }
    this.model.legs.forEach((leg,i)=>leg.rotation.x=pose.legs[i]);this.model.arms.forEach((arm,i)=>arm.rotation.x=pose.arms[i]);
    this.model.body.position.y = pose.bob - this.motion.landing * .12;
    this.model.body.rotation.set(pose.lean,pose.twist,0);
    this.model.head.rotation.y = emote?emote.headYaw*emote.weight:reducedMotion ? 0 : Math.sin(this.clock * 1.1) * .025 * (1 - this.strideBlend);
  }
}
