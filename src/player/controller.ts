import * as T from 'three';
import { createMinifigure } from './minifigure';
import type { Input } from './input';
import type { Obstacle } from '../world/collision';
import { Locomotion,groundHeight } from './locomotion';
import {gaitPose} from './gait';
import {PLAYER_TUNING} from '../config/controls';
export { groundHeight } from './locomotion';

export class Player {
  readonly model = createMinifigure();
  readonly position = new T.Vector3(0, groundHeight(0,10), 10);
  readonly motion = new Locomotion();
  moving = false;
  private clock = 0;
  private strideBlend = 0;
  get velocityY() { return this.motion.vy; }
  set velocityY(value: number) { this.motion.vy = value; }
  get airborne() { return this.motion.airborne; }
  set airborne(value: boolean) { this.motion.airborne = value; }
  constructor(parent: T.Object3D) { this.model.root.name='Andy';parent.add(this.model.root); this.model.root.position.copy(this.position); }
  teleport(x: number, z: number) { this.motion.teleport(x, z); this.position.set(x, this.motion.y, z); this.model.root.position.copy(this.position); }
  update(dt: number, input: Input, yaw: number, obstacles: Obstacle[], enabled: boolean, reducedMotion: boolean) {
    this.clock += dt;
    this.motion.x = this.position.x; this.motion.y = this.position.y; this.motion.z = this.position.z;
    const jumpHeld = input.down('Space');
    this.motion.update(dt, { x: Number(input.down('KeyD')) - Number(input.down('KeyA')), z: Number(input.down('KeyS')) - Number(input.down('KeyW')), running: input.down('ShiftLeft', 'ShiftRight'), jump: input.pressed('Space'), jumpHeld }, yaw, obstacles, enabled);
    this.position.set(this.motion.x, this.motion.y, this.motion.z); this.moving = this.motion.speed > .1;
    this.model.root.position.copy(this.position); this.model.root.rotation.y = this.motion.heading;
    this.strideBlend = T.MathUtils.damp(this.strideBlend, enabled && this.moving && !this.airborne ? Math.min(1, this.motion.speed / PLAYER_TUNING.walkSpeed) : 0, 20, dt);
    const pose=gaitPose(this.motion.distance,this.motion.speed,this.strideBlend,this.airborne,this.motion.vy,reducedMotion);
    this.model.legs.forEach((leg,i)=>leg.rotation.x=pose.legs[i]);this.model.arms.forEach((arm,i)=>arm.rotation.x=pose.arms[i]);
    this.model.body.position.y = pose.bob - this.motion.landing * .12;
    this.model.body.rotation.set(pose.lean,pose.twist,0);
    this.model.head.rotation.y = reducedMotion ? 0 : Math.sin(this.clock * 1.1) * .025 * (1 - this.strideBlend);
  }
}
