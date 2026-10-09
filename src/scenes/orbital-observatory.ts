import * as T from 'three';
import {BrickBatch,sign} from '../world/brick-kit';
import {PLATE as H,STUD as S} from '../world/part-catalog';
import {consolidateStatic} from '../world/consolidate';
import type {Input} from '../player/input';
import {DestinationCamera} from '../camera/destination-camera';
import {createMinifigure} from '../player/minifigure';
import {gaitPose} from '../player/gait';
import {moveWithCollision} from '../world/collision';

// Independent gateway destination using shared camera, input and figure helpers.
export class OrbitalObservatory {
  readonly scene=new T.Scene();readonly camera=new T.PerspectiveCamera(55,innerWidth/innerHeight,.1,500);
  readonly position=new T.Vector3(0,4*H+2.72,10);readonly overlay=document.createElement('section');
  private obstacles=[-8.96,8.96].map(x=>({x,z:-10.24,w:2.56,d:2.56,bottom:4*H,height:4.5}));
  readonly view=new DestinationCamera(this.camera,{distance:0,yaw:.08,pitch:-.1},this.obstacles);
  private avatar=createMinifigure();private distance=0;
  constructor(parent:HTMLElement,background:T.Scene['background'],environment:T.Texture|null) {
    this.scene.background=background;this.scene.environment=environment;this.scene.environmentIntensity=.4;
    this.scene.add(new T.HemisphereLight('#aee9ef','#1c2948',2));const sun=new T.DirectionalLight('#ffb980',2);sun.position.set(-20,60,20);this.scene.add(sun);
    const b=new BrickBatch();b.stack('#0a3463',0,0,0,68,3,54,'stud');b.stack('#6074a1',0,3*H,0,66,1,52,'tile');
    for(const side of [-1,1]) {b.stack('#9ba19d',side*21.12,4*H,0,2,6,52,'stud');b.stack('@cyan',side*21.12,10*H,0,2,1,52,'tile');}
    b.stack('#9ba19d',0,4*H,-16.64,64,6,2,'stud');b.stack('@cyan',0,10*H,-16.64,64,1,2,'tile');
    for(const x of [-8.96,8.96]) {b.stack('#05131d',x,4*H,-10.24,4,9,4,'stud');b.mold('dish','@cyan',x,16*H,-10.24);}
    // A stepped brick moon model above the far-side display plinth.
    const r=16,center=16.768;
    b.stack('#0a3463',0,0,-62.72,60,3,60,'stud');
    for(let layer=0;layer<42;layer++) {
      const y=.768+layer*3*H,dy=y+1.5*H-center,rr=r*r-dy*dy;if(rr<=0)continue;
      for(let iz=-Math.floor(Math.sqrt(rr)/S);iz<=Math.floor(Math.sqrt(rr)/S);iz+=2) {
        const zz=iz*S,width=Math.floor(Math.sqrt(Math.max(0,rr-zz*zz))/S)*2;if(width<2)continue;
        b.stack(layer%7<2?'#fe8a18':'#a95500',0,y,-62.72+zz,width,3,2,'stud');
      }
    }
    const fixed=b.build(this.scene,'far-side-deck-and-moon');consolidateStatic(fixed);
    sign(this.scene,'FAR SIDE / OBSERVATION DECK',0,2.048,-16,17.92,1.28,'#0a3463','#aee9ef');
    this.avatar.root.name='Andy';this.scene.add(this.avatar.root);this.camera.position.copy(this.position);
    this.overlay.className='space-introduction';this.overlay.innerHTML='<p>ORBITAL STATION / BEYOND THE GATE</p><h1>The far side.</h1><p>A quiet observation deck, above the shipping lanes.</p><span>WASD to move · Scroll to change view · Esc to return</span>';parent.append(this.overlay);
  }
  update(dt:number,input:Input,reduced:boolean,enabled:boolean) {
    const before=this.position.clone();if(enabled){
      const x=Number(input.down('KeyD'))-Number(input.down('KeyA')),z=Number(input.down('KeyS'))-Number(input.down('KeyW'));
      const magnitude=Math.hypot(x,z)||1,yaw=this.view.yaw,speed=input.down('ShiftLeft','ShiftRight')?10:6;
      moveWithCollision(this.position,(x*Math.cos(yaw)+z*Math.sin(yaw))*dt*speed/magnitude,(-x*Math.sin(yaw)+z*Math.cos(yaw))*dt*speed/magnitude,.62,this.obstacles,{minX:-18.62,maxX:18.62,minZ:-12.62,maxZ:14.62});
    }
    const travelled=this.position.distanceTo(before);this.distance+=travelled;
    if(travelled>.001)this.avatar.root.rotation.y=Math.atan2(this.position.x-before.x,this.position.z-before.z);
    const pose=gaitPose(this.distance,travelled/Math.max(dt,.001),travelled>.001?1:0,false,0,reduced);
    this.avatar.legs.forEach((leg,i)=>leg.rotation.x=pose.legs[i]);this.avatar.arms.forEach((arm,i)=>arm.rotation.x=pose.arms[i]);
    this.avatar.root.position.copy(this.position);this.avatar.root.position.y=4*H;
    this.view.update(dt,input,this.position,reduced,enabled);this.avatar.root.visible=!this.view.firstPerson;
    this.overlay.querySelector('span')!.textContent=this.view.firstPerson?'WASD to move · Mouse to look · Scroll out for third person · Esc to return':'WASD to move · Drag / arrows to look · Scroll in for POV · Esc to return';
  }
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  dispose(){this.overlay.remove();this.avatar.root.traverse(o=>{if(o instanceof T.Mesh&&o.userData.sticker)o.geometry.dispose();});this.avatar.root.removeFromParent();this.scene.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.Mesh&&o.userData.sticker){o.geometry.dispose();const m=o.material as T.MeshBasicMaterial;m.map?.dispose();m.dispose();}});this.scene.clear();}
}
