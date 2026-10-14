import type {FlightPoint} from './flight-game';

// The centre-camera aim point compensates for the trailing camera's parallax.
export class ShipAim {
  yaw=0;pitch=0;
  reset(){this.yaw=this.pitch=0;}
  pointAt(origin:FlightPoint,target:FlightPoint){
    const x=target.x-origin.x,y=target.y-origin.y,z=target.z-origin.z;
    if(!Math.hypot(x,y,z))return;
    this.yaw=Math.atan2(-x,-z);this.pitch=-Math.atan2(y,Math.hypot(x,z));
  }
  get direction():FlightPoint {
    return{x:-Math.sin(this.yaw)*Math.cos(this.pitch),y:-Math.sin(this.pitch),z:-Math.cos(this.yaw)*Math.cos(this.pitch)};
  }
  movement(input:FlightPoint):FlightPoint {
    const {x,y,z}=input,c=Math.cos(this.yaw),s=Math.sin(this.yaw),p=Math.cos(this.pitch);
    return{x:x*c+z*s*p,y:y+z*Math.sin(this.pitch),z:-x*s+z*c*p};
  }
}
