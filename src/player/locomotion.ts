import { moveWithCollision, supportHeight, type Obstacle } from '../world/collision';
import {PLAYER_TUNING} from '../config/controls';

export interface MotionInput { x: number; z: number; running: boolean; jump: boolean; jumpHeld: boolean }
export function groundHeight(_x: number, _z: number) {
  return .512;
}
// Separate simulation from the rig so movement can be tested without WebGL.
export class Locomotion {
  x = 0; y = groundHeight(0,10); z = 10;
  vx = 0; vz = 0; vy = 0;
  airborne = false;
  heading = Math.PI;
  distance = 0;
  landing = 0;
  private jumpBuffer = 0;
  private groundedGrace = .1;
  teleport(x: number, z: number) {
    this.x = x; this.z = z; this.y = groundHeight(x, z);
    this.vx = this.vz = this.vy = this.jumpBuffer = this.landing = 0; this.airborne = false;
    this.groundedGrace = .1;
  }
  get speed() { return Math.hypot(this.vx, this.vz); }
  update(dt: number, input: MotionInput, yaw: number, obstacles: Obstacle[], enabled: boolean) {
    this.landing = Math.max(0, this.landing - dt * 5);
    if (!enabled) { this.vx = this.vz = 0; return; }
    const magnitude = Math.hypot(input.x, input.z), speed = input.running ? PLAYER_TUNING.runSpeed : PLAYER_TUNING.walkSpeed;
    const x = magnitude ? input.x / magnitude : 0, z = magnitude ? input.z / magnitude : 0;
    const targetX = (x * Math.cos(yaw) + z * Math.sin(yaw)) * speed;
    const targetZ = (-x * Math.sin(yaw) + z * Math.cos(yaw)) * speed;
    const response = 1 - Math.exp(-(magnitude ? (this.airborne ? 12 : 24) : 36) * dt);
    this.vx += (targetX - this.vx) * response; this.vz += (targetZ - this.vz) * response;
    if (this.speed < .03) this.vx = this.vz = 0;
    const previousX = this.x, previousZ = this.z;
    // Only visible geometry overlapping the figure's vertical span blocks it.
    // A one-plate curb can be stepped onto; benches/rims require a jump.
    const step=this.airborne?.02:.28;
    const walls=obstacles.filter(o=>o.height>this.y+step&&(o.bottom??0)<this.y+3.8);
    moveWithCollision(this, this.vx * dt, this.vz * dt, .62, walls);
    const travelled = Math.hypot(this.x - previousX, this.z - previousZ);
    if (!this.airborne) this.distance += travelled;
    if (magnitude) {
      const desired = Math.atan2(targetX, targetZ);
      const difference = Math.atan2(Math.sin(desired - this.heading), Math.cos(desired - this.heading));
      this.heading += difference * (1 - Math.exp(-22 * dt));
    }
    const floor = supportHeight(this.x,this.z,this.y+step,groundHeight(this.x,this.z),obstacles);
    if (input.jump) this.jumpBuffer = .12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.groundedGrace = this.airborne ? Math.max(0, this.groundedGrace - dt) : .1;
    if (this.jumpBuffer > 0 && this.groundedGrace > 0) {
      this.vy = 9.4; this.airborne = true; this.jumpBuffer = this.groundedGrace = 0;
    }
    if (!this.airborne && this.y > floor + .12) this.airborne = true;
    if (this.airborne) {
      this.vy -= (this.vy > 0 && input.jumpHeld ? 27 : 39) * dt;
      this.y += this.vy * dt;
      if (this.y <= floor) {
        this.landing = Math.min(1, Math.abs(this.vy) / 12); this.y = floor; this.vy = 0; this.airborne = false;
      }
    } else this.y = floor;
    if (Math.abs(this.x - previousX) < .0001) this.vx = 0;
    if (Math.abs(this.z - previousZ) < .0001) this.vz = 0;
  }
}
