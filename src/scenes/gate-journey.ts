import * as T from 'three';
import type {Input} from '../player/input';
import type {OrbitalObservatory} from './orbital-observatory';
export class GateJourney {
  private elapsed=0;private entering=false;private cancelled=false;
  private start:T.Vector3;private overlay=document.createElement('section');
  private destination:OrbitalObservatory|null=null;
  private pending=import('./orbital-observatory');
  private lights:{mesh:T.InstancedMesh;index:number;color:T.Color}[]=[];
  get scene(){return this.destination?.scene??this.town;}
  get camera(){return this.destination?.camera??this.townCamera;}
  get position(){return this.destination?.position??new T.Vector3(0,47.36,-59.52);}
  get arrived(){return this.destination!==null;}
  get view(){return this.destination?.view??null;}
  constructor(private parent:HTMLElement,private town:T.Scene,private townCamera:T.PerspectiveCamera,root:T.Group,private reduced:boolean) {
    this.start=townCamera.position.clone();const matrix=new T.Matrix4(),point=new T.Vector3();root.updateWorldMatrix(true,true);
    root.traverse(o=>{if(!(o instanceof T.InstancedMesh)||!o.instanceColor)return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix.premultiply(o.matrixWorld));if(Math.abs(point.z+70.72)<.05&&point.y>14&&point.y<82&&Math.abs(point.x)<34){const color=new T.Color();o.getColorAt(i,color);this.lights.push({mesh:o,index:i,color});}}});
    this.overlay.className='launch-overlay';this.overlay.innerHTML='<div class="cinema-bar"></div><div class="cinema-bar bottom"></div><div class="launch-caption"><small>ORBITAL STATION / GATE CONTROL</small><p>Navigation grid online. Opening a little more universe.</p></div>';parent.append(this.overlay);
  }
  update(dt:number,input:Input,enabled:boolean) {
    if(this.destination){this.destination.update(Math.min(dt,.05),input,this.reduced,enabled);return;}
    if(!enabled)return;this.elapsed+=dt;
    const t=this.reduced?1:T.MathUtils.smoothstep(this.elapsed/3.5,0,1);
    this.townCamera.position.lerpVectors(this.start,new T.Vector3(0,47.36,-58.88),t);this.townCamera.lookAt(0,10+37.36*t,-74.24);
    const color=new T.Color().setScalar(.35+.65*Math.min(1,this.elapsed/2));
    for(const l of this.lights){l.mesh.setColorAt(l.index,color);l.mesh.instanceColor!.needsUpdate=true;}
    if(t===1&&!this.entering)void this.arrive();
  }
  private async arrive() {
    this.entering=true;
    try {const {OrbitalObservatory}=await this.pending;if(this.cancelled)return;this.destination=new OrbitalObservatory(this.parent,this.town.background,this.town.environment);this.overlay.remove();}
    catch(error){console.error('Gate destination unavailable',error);this.overlay.querySelector('p')!.textContent='The gate is unavailable. Press Escape or Return to go back.';}
  }
  resize(){this.destination?.resize();}
  dispose(){this.cancelled=true;this.destination?.dispose();this.overlay.remove();for(const l of this.lights){l.mesh.setColorAt(l.index,l.color);l.mesh.instanceColor!.needsUpdate=true;}}
}
