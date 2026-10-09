export interface Obstacle {x:number;z:number;w:number;d:number;height:number;bottom?:number;radius?:number;label?:string}
export interface Point {x:number;z:number}
export function overlaps(x:number,z:number,radius:number,o:Obstacle) {
  if(o.radius!==undefined)return Math.hypot(x-o.x,z-o.z)<o.radius+radius;
  const dx=x-Math.max(o.x-o.w/2,Math.min(x,o.x+o.w/2)),dz=z-Math.max(o.z-o.d/2,Math.min(z,o.z+o.d/2));
  return dx*dx+dz*dz<radius*radius || (radius===0&&x>o.x-o.w/2&&x<o.x+o.w/2&&z>o.z-o.d/2&&z<o.z+o.d/2);
}
export function blocked(x:number,z:number,radius:number,obstacles:Obstacle[]){return obstacles.some(o=>overlaps(x,z,radius,o));}
export function supportHeight(x:number,z:number,ceiling:number,floor:number,obstacles:Obstacle[]) {
  for(const o of obstacles)if(o.height<=ceiling+.001&&o.height>floor&&overlaps(x,z,.12,o))floor=o.height;
  return floor;
}
export function moveWithCollision(p:Point,dx:number,dz:number,radius:number,obstacles:Obstacle[],bounds=ACTIVE_BOUNDS) {
  // Substeps prevent tunnelling at maximum speed or after a delayed frame.
    const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.35));
  for(let i=0;i<steps;i++){const nx=Math.max(bounds.minX+radius,Math.min(bounds.maxX-radius,p.x+dx/steps));if(!blocked(nx,p.z,radius,obstacles))p.x=nx;const nz=Math.max(bounds.minZ+radius,Math.min(bounds.maxZ-radius,p.z+dz/steps));if(!blocked(p.x,nz,radius,obstacles))p.z=nz;}
}
export function safeExit(p:Point,heading:number,obstacles:Obstacle[]):Point|null {
  const walls=obstacles.filter(o=>o.height>.792&&(o.bottom??0)<4.312);
  for(const distance of [3,4.5,6])for(const offset of [Math.PI/2,-Math.PI/2,Math.PI,0]){const x=p.x+Math.sin(heading+offset)*distance,z=p.z+Math.cos(heading+offset)*distance;if(x>ACTIVE_BOUNDS.minX+.65&&x<ACTIVE_BOUNDS.maxX-.65&&z>ACTIVE_BOUNDS.minZ+.65&&z<ACTIVE_BOUNDS.maxZ-.65&&!blocked(x,z,.65,walls))return{x,z};}return null;
}
export function safeApproach(p:Point,obstacles:Obstacle[],heading=0):Point|null {
  const walls=obstacles.filter(o=>o.height>.792&&(o.bottom??0)<4.312);
  for(const distance of [1.92,2.56,3.2])for(const offset of [0,Math.PI/2,-Math.PI/2,Math.PI]) {
    const angle=heading+offset;
    const x=p.x+Math.sin(angle)*distance,z=p.z+Math.cos(angle)*distance;
    if(x>ACTIVE_BOUNDS.minX+.65&&x<ACTIVE_BOUNDS.maxX-.65&&z>ACTIVE_BOUNDS.minZ+.65&&z<ACTIVE_BOUNDS.maxZ-.65&&!blocked(x,z,.65,walls))return{x,z};
  }
  return null;
}
import { ACTIVE_BOUNDS } from '../config/station';
