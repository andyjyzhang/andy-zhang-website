import * as T from 'three';
import { Input } from '../player/input';
import type { Obstacle } from '../world/collision';
import { WORLD_STYLE } from '../config/station';

export class FollowCamera {
  yaw = .12;
  pitch = .42;
  distance = 19;
  get firstPerson() { return this.distance <= 1 && !this.focus && !this.overview; }
  togglePOV() { this.distance = this.distance <= 1 ? 19 : 0;if(this.distance===0)this.pitch=0; this.focus=null; this.overview=false; }
  overview = false;
  private overviewTarget = new T.Vector3(...WORLD_STYLE.overviewTarget);
  private overviewOffset = new T.Vector3(...WORLD_STYLE.overview).sub(this.overviewTarget);
  overviewYaw = Math.atan2(this.overviewOffset.x,this.overviewOffset.z);
  overviewPitch = Math.asin(this.overviewOffset.y/this.overviewOffset.length());
  overviewDistance = this.overviewOffset.length();
  focus: { position: T.Vector3; target: T.Vector3 } | null = null;
  private target = new T.Vector3();
  private lookPoint = new T.Vector3(0, 2, 10);
  private desired = new T.Vector3();
  private direction = new T.Vector3();
  private ray = new T.Ray();
  private hit = new T.Vector3();
  private boxes: T.Box3[] = [];
  constructor(readonly camera: T.PerspectiveCamera, obstacles: Obstacle[]) { this.setObstacles(obstacles); }
  resetForPlayer(subject:T.Vector3) {
    this.yaw=.12;this.pitch=.42;this.distance=19;this.focus=null;this.overview=false;
    this.target.copy(subject);this.target.y+=1.8;this.lookPoint.copy(this.target);
    this.direction.set(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));
    this.camera.position.copy(this.target).addScaledVector(this.direction,this.distance);this.camera.lookAt(this.lookPoint);
  }
  setObstacles(obstacles: Obstacle[]) {
    this.boxes = obstacles.map(o => new T.Box3(new T.Vector3(o.x - o.w / 2 - .35, o.bottom??0, o.z - o.d / 2 - .35), new T.Vector3(o.x + o.w / 2 + .35, o.height + .3, o.z + o.d / 2 + .35)));
  }
  frameLandmark(x: number, z: number, facing = 0) {
    this.focus = { position: new T.Vector3(x + 7 * Math.cos(facing), 13, z + 16 * Math.cos(facing)), target: new T.Vector3(x, 3, z) };
  }
  update(dt: number, input: Input, subject: T.Vector3, driving: boolean, enabled: boolean, reducedMotion: boolean) {
    const wasFirstPerson=this.firstPerson;
    const mouse = input.consumeCamera();
    if (enabled && this.overview) {
      this.overviewYaw-=mouse.x;
      this.overviewPitch=T.MathUtils.clamp(this.overviewPitch+mouse.y,-.32,1.18);
      this.overviewDistance=T.MathUtils.clamp(this.overviewDistance+mouse.zoom*5,240,540);
      if(input.down('ArrowLeft'))this.overviewYaw+=dt*1.1;
      if(input.down('ArrowRight'))this.overviewYaw-=dt*1.1;
      if(input.down('ArrowUp'))this.overviewPitch=Math.max(-.32,this.overviewPitch-dt*.8);
      if(input.down('ArrowDown'))this.overviewPitch=Math.min(1.18,this.overviewPitch+dt*.8);
    } else if (enabled) {
      this.yaw -= mouse.x;
      this.pitch = T.MathUtils.clamp(this.pitch + mouse.y, -.7, 1.1);
      this.distance = T.MathUtils.clamp(this.distance + mouse.zoom, 0, 46);
      if (input.down('ArrowLeft')) this.yaw += dt * 1.5;
      if (input.down('ArrowRight')) this.yaw -= dt * 1.5;
      if(this.firstPerson&&!wasFirstPerson)this.pitch=0;
      if (input.down('ArrowUp')) this.pitch = Math.max(-.7, this.pitch - dt);
      if (input.down('ArrowDown')) this.pitch = Math.min(1.1, this.pitch + dt);
    }
    if (this.focus) {
      this.desired.copy(this.focus.position); this.target.copy(this.focus.target);
      this.direction.subVectors(this.desired,this.target);let distance=this.direction.length();this.direction.normalize();this.ray.set(this.target,this.direction);
      // Furniture is deliberately inside the composition. Only tall structural
      // obstacles may shorten a landmark shot; a chair must not pull it into
      // the room and fill the screen while the visitor reads the portfolio.
      for(const box of this.boxes)if(box.max.y>8&&!box.containsPoint(this.target)&&this.ray.intersectBox(box,this.hit))distance=Math.min(distance,Math.max(2.8,this.target.distanceTo(this.hit)-.55));
      this.desired.copy(this.target).addScaledVector(this.direction,distance);
    }
    else if (this.overview) {
      this.target.copy(this.overviewTarget);
      this.direction.set(Math.sin(this.overviewYaw)*Math.cos(this.overviewPitch),Math.sin(this.overviewPitch),Math.cos(this.overviewYaw)*Math.cos(this.overviewPitch));
      this.desired.copy(this.target).addScaledVector(this.direction,this.overviewDistance);
    }
    else if (this.firstPerson) {
      this.desired.copy(subject);this.desired.y+=driving?3.328:2.72;
      this.direction.set(-Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));
      this.target.copy(this.desired).addScaledVector(this.direction,12);
    }
    else {
      this.target.copy(subject); this.target.y += driving ? 1.7 : 1.8;
      const distance = Math.max(2.8,this.distance) + (driving ? 5 : 0);
      // Looking up tilts the view above the figure while keeping the camera
      // at shoulder height. Orbiting below that height would enter the floor.
      const orbitPitch=Math.max(0,this.pitch);
      this.direction.set(Math.sin(this.yaw) * Math.cos(orbitPitch), Math.sin(orbitPitch), Math.cos(this.yaw) * Math.cos(orbitPitch));
      let safeDistance = distance;
      this.ray.set(this.target, this.direction);
      for (const box of this.boxes) {
        if (box.containsPoint(this.target)) continue;
        if (this.ray.intersectBox(box, this.hit)) safeDistance = Math.min(safeDistance, Math.max(2.8, this.target.distanceTo(this.hit) - .55));
      }
      this.desired.copy(this.target).addScaledVector(this.direction, safeDistance);
      if(this.pitch<0)this.target.y+=Math.tan(-this.pitch)*safeDistance;
    }
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-(this.firstPerson ? 30 : this.focus || this.overview ? 5 : 12) * dt);
    this.camera.position.lerp(this.desired, alpha);
    if(this.firstPerson)this.lookPoint.copy(this.camera.position).addScaledVector(this.direction,12);
    else this.lookPoint.lerp(this.target, alpha);
    this.camera.lookAt(this.lookPoint);
  }
}
