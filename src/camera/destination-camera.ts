import * as T from 'three';
import type {Input} from '../player/input';
import type {Obstacle} from '../world/collision';

// Shared by independently loaded game scenes; no portfolio or town state.
export class DestinationCamera {
  yaw:number;pitch:number;distance:number;
  private boxes:T.Box3[];
  private desired=new T.Vector3();private target=new T.Vector3();private look=new T.Vector3();
  private direction=new T.Vector3();private ray=new T.Ray();private hit=new T.Vector3();
  get firstPerson(){return this.distance<=1;}
  constructor(readonly camera:T.PerspectiveCamera,options:{distance:number;yaw?:number;pitch?:number},obstacles:Obstacle[]=[]) {
    this.distance=options.distance;this.yaw=options.yaw??0;this.pitch=options.pitch??.42;
    this.boxes=obstacles.map(o=>new T.Box3(new T.Vector3(o.x-o.w/2-.35,o.bottom??0,o.z-o.d/2-.35),new T.Vector3(o.x+o.w/2+.35,o.height+.3,o.z+o.d/2+.35)));
  }
  togglePOV(){this.distance=this.firstPerson?19:0;this.pitch=this.firstPerson?0:Math.max(.3,this.pitch);}
  update(dt:number,input:Input,anchor:T.Vector3,reduced:boolean,enabled:boolean) {
    const wasFirstPerson=this.firstPerson,mouse=input.consumeCamera();
    if(enabled) {
      this.yaw-=mouse.x;this.pitch=T.MathUtils.clamp(this.pitch+mouse.y,-.7,1.1);
      this.distance=T.MathUtils.clamp(this.distance+mouse.zoom,0,46);
      if(this.firstPerson&&!wasFirstPerson)this.pitch=0;
      // Restore an elevated follow view when leaving eye level, even if the
      // player was looking up. Otherwise the figure sits below the viewport.
      if(wasFirstPerson&&!this.firstPerson)this.pitch=Math.max(.3,this.pitch);
      if(input.down('ArrowLeft'))this.yaw+=dt*1.5;
      if(input.down('ArrowRight'))this.yaw-=dt*1.5;
      if(input.down('ArrowUp'))this.pitch=Math.max(-.7,this.pitch-dt);
      if(input.down('ArrowDown'))this.pitch=Math.min(1.1,this.pitch+dt);
    }
    if(this.firstPerson) {
      this.desired.copy(anchor);
      this.direction.set(-Math.sin(this.yaw)*Math.cos(this.pitch),-Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));
      this.target.copy(anchor).addScaledVector(this.direction,12);
    } else {
      this.target.copy(anchor);const pitch=Math.max(0,this.pitch);
      this.direction.set(Math.sin(this.yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(this.yaw)*Math.cos(pitch));
      let distance=Math.max(2.8,this.distance);this.ray.set(anchor,this.direction);
      for(const box of this.boxes)if(!box.containsPoint(anchor)&&this.ray.intersectBox(box,this.hit))distance=Math.min(distance,Math.max(.8,anchor.distanceTo(this.hit)-.55));
      this.desired.copy(anchor).addScaledVector(this.direction,distance);
      if(this.pitch<0)this.target.y+=Math.tan(-this.pitch)*distance;
    }
    const alpha=reduced?1:1-Math.exp(-(this.firstPerson?30:12)*dt);
    this.camera.position.lerp(this.desired,alpha);
    if(this.firstPerson)this.look.copy(this.camera.position).addScaledVector(this.direction,12);
    else this.look.lerp(this.target,alpha);
    this.camera.lookAt(this.look);
  }
}
