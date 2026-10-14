import * as T from 'three';
import type {Input} from '../player/input';
import {DestinationCamera} from '../camera/destination-camera';
import {SalvageRun} from '../interactions/flight-game';
import {ShipAim} from '../interactions/flight-aim';
import type {SoundCue} from '../audio/sound-design';
import {FlightHUD} from '../ui/flight-hud';
import {courierModel,patrolModel,cargoModel,type FlightResource} from './salvage-models';
import {salvageEnvironment,SALVAGE_CAMERA_OBSTACLES} from './salvage-environment';
import {consolidateStatic} from '../world/consolidate';

export class SpaceGame {
  readonly scene=new T.Scene();
  readonly camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,500);
  readonly view=new DestinationCamera(this.camera,{distance:24,yaw:0,pitch:0,aimView:true},SALVAGE_CAMERA_OBSTACLES);
  readonly game=new SalvageRun();readonly aim=new ShipAim();readonly hud:FlightHUD;
  readonly aimTarget=new T.Vector3();
  private readonly centreRay=new T.Raycaster();private readonly screenCentre=new T.Vector2();
  private readonly resources:FlightResource[]=[];
  private readonly ship:ReturnType<typeof courierModel>;
  private readonly cargo:ReturnType<typeof cargoModel>[]=[];
  private readonly enemies:T.Group[]=[];
  private readonly rocks:T.InstancedMesh;private readonly lasers:T.InstancedMesh;private readonly sparks:T.InstancedMesh;
  private readonly shield:T.Mesh;private readonly dummy=new T.Object3D();
  private readonly anchor=new T.Vector3();private readonly projected=new T.Vector3();private readonly boltDirection=new T.Vector3();
  private readonly forward=new T.Vector3(0,0,1);private readonly red=new T.Color('#ff7069');private readonly green=new T.Color('#a3edcb');
  private uiClock=0;private time=0;private shownPhase='';
  get overlay(){return this.hud.root;}
  get position(){return this.ship.root.position;}
  constructor(parent:HTMLElement,private cue:(cue:SoundCue)=>void=()=>{}){
    salvageEnvironment(this.scene,this.resources);
    this.ship=courierModel(this.resources);consolidateStatic(this.ship.root);this.ship.root.rotation.order='YXZ';this.ship.root.rotation.y=Math.PI;this.scene.add(this.ship.root);
    for(let i=0;i<3;i++){
      const cargo=cargoModel(this.resources);consolidateStatic(cargo.root);this.cargo.push(cargo);this.scene.add(cargo.root);
      const patrol=patrolModel(this.resources);consolidateStatic(patrol);this.enemies.push(patrol);this.scene.add(patrol);
    }
    this.rocks=this.pool(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:'#73757a',roughness:1}),10,'salvage-debris');
    this.lasers=this.pool(new T.BoxGeometry(.16,.16,2.6),new T.MeshBasicMaterial({color:'white'}),96,'salvage-blasters');
    this.sparks=this.pool(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#efbd76',wireframe:true}),20,'salvage-impacts');
    const shieldGeo=new T.SphereGeometry(5.8,12,8),shieldMat=new T.MeshBasicMaterial({color:'#9cdfff',wireframe:true,transparent:true,opacity:.18});
    this.resources.push(shieldGeo,shieldMat);this.shield=new T.Mesh(shieldGeo,shieldMat);this.ship.root.add(this.shield);
    this.hud=new FlightHUD(parent,this.game);this.hud.onReset=()=>this.resetAim();this.centreRay.far=120;this.syncObjects(true,false);
    this.camera.position.set(0,20,59);this.camera.lookAt(this.position);this.refresh();
  }
  private pool(geometry:T.BufferGeometry,material:T.Material,count:number,name:string){
    const mesh=new T.InstancedMesh(geometry,material,count);mesh.name=name;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(mesh);this.resources.push(geometry,material);return mesh;
  }
  update(dt:number,input:Input,reduced:boolean,enabled=true){
    if(!enabled||this.game.phase!=='playing')this.hud.release();
    if(enabled&&input.pressed('KeyR')){this.game.restart();this.hud.release();this.resetAim();this.refresh();}
    const x=Number(input.down('KeyD'))-Number(input.down('KeyA')),z=Number(input.down('KeyS'))-Number(input.down('KeyW'));
    const y=Number(input.down('KeyE')||this.hud.held('up'))-Number(input.down('KeyQ')||this.hud.held('down'));
    this.anchor.copy(this.position);this.anchor.y+=1.4;this.view.update(dt,input,this.anchor,reduced,enabled);
    this.camera.updateMatrixWorld(true);this.scene.updateMatrixWorld(true);
    this.centreRay.setFromCamera(this.screenCentre,this.camera);this.centreRay.ray.at(120,this.aimTarget);
    // Only exact centre-ray intersections correct parallax. No target cone or snapping.
    const hit=this.centreRay.intersectObjects([this.rocks,...this.enemies.filter((_,i)=>this.game.enemies[i].hp>0)],true)[0];
    if(hit)this.aimTarget.copy(hit.point);
    this.aim.pointAt(this.game.position,this.aimTarget);
    const shields=this.game.shields,collected=this.game.collected,phase=this.game.phase,shots=this.game.shotsFired,kills=this.game.kills;
    const boosting=enabled&&(this.hud.held('boost')||input.down('ShiftLeft','ShiftRight'));
    this.game.update(dt,this.aim.movement({x,y,z}),{
      boost:boosting,fire:this.hud.held('fire')||input.down('Space'),enabled,
      aimTarget:this.aimTarget,
    });
    if(this.game.shotsFired>shots)this.cue('blaster');
    if(this.game.kills>kills)this.cue('detonate');
    if(this.game.shields<shields)this.cue('impact');else if(this.game.collected>collected)this.cue('signal-step');
    if(phase!==this.game.phase)this.cue(this.game.phase==='lost'?'signal-miss':this.game.phase==='won'||this.game.phase==='delivered'?'signal-win':'open');
    if(enabled&&this.game.phase==='playing')this.time+=dt;
    this.syncObjects(reduced,boosting);
    this.aim.pointAt(this.game.position,this.aimTarget);
    const alpha=reduced?1:1-Math.exp(-10*dt);
    if(enabled){
      this.ship.root.rotation.y=this.aim.yaw+Math.PI;
      this.ship.root.rotation.z=T.MathUtils.lerp(this.ship.root.rotation.z,reduced?0:-x*.16,alpha);
      this.ship.root.rotation.x=this.aim.pitch;
    }
    this.ship.root.visible=!this.view.firstPerson;
    const target=this.game.target,guard='guard' in target&&this.game.locked(target)?this.game.enemies[target.guard]:target;
    this.uiClock+=dt;if(this.uiClock>.1||this.shownPhase!==`${this.game.phase}:${this.game.mission}`){
      this.projected.set(guard.x,guard.y+4,guard.z).project(this.camera);this.hud.targetLabel((this.projected.x+1)*50,(1-this.projected.y)*50,this.projected.z<1&&this.projected.z>-1);
      this.refresh();this.uiClock=0;
    }
  }
  private syncObjects(reduced:boolean,boosting:boolean){
    const g=this.game;this.position.set(g.position.x,g.position.y,g.position.z);
    this.shield.visible=g.invulnerable>0&&g.phase==='playing';
    this.ship.flames.forEach(flame=>{flame.scale.y=boosting&&g.boost>.03?2.6:1;flame.position.z=-4.05-flame.scale.y*1.5;flame.visible=g.phase==='playing';});
    const hazards=g.hazards;this.rocks.count=hazards.length;
    hazards.forEach((rock,i)=>{this.dummy.position.set(rock.x,rock.y,rock.z);this.dummy.rotation.set(reduced?0:this.time*.1,rock.id,reduced?0:this.time*.15);this.dummy.scale.set(rock.radius,rock.radius*.8,rock.radius*1.1);this.dummy.updateMatrix();this.rocks.setMatrixAt(i,this.dummy.matrix);});this.rocks.instanceMatrix.needsUpdate=true;
    this.cargo.forEach((pod,i)=>{
      const state=g.cargo[i];pod.root.visible=!state.collected;pod.root.position.set(state.x,state.y,state.z);pod.root.rotation.y=reduced?0:this.time*.2;
      pod.material.color.set(g.locked(state)?'#fa817b':'#efbd76');
      const enemy=g.enemies[i],model=this.enemies[i];model.visible=enemy.hp>0;model.position.set(enemy.x,enemy.y,enemy.z);model.rotation.y=Math.atan2(g.position.x-enemy.x,g.position.z-enemy.z);model.rotation.z=reduced?0:Math.sin(this.time*.7+i)*.08;
    });
    let index=0;this.dummy.scale.set(1,1,1);
    for(const bolt of g.bolts){
      this.boltDirection.set(bolt.direction.x,bolt.direction.y,bolt.direction.z);this.dummy.quaternion.setFromUnitVectors(this.forward,this.boltDirection);
      this.dummy.position.set(bolt.x,bolt.y,bolt.z);this.dummy.updateMatrix();this.lasers.setMatrixAt(index,this.dummy.matrix);this.lasers.setColorAt(index,bolt.enemy?this.red:this.green);index++;
    }
    this.lasers.count=index;this.lasers.instanceMatrix.needsUpdate=true;if(this.lasers.instanceColor)this.lasers.instanceColor.needsUpdate=true;
    this.sparks.count=reduced?0:g.effects.length;
    g.effects.forEach((effect,i)=>{this.dummy.position.set(effect.x,effect.y,effect.z);this.dummy.rotation.set(this.time*2,i,this.time);this.dummy.scale.setScalar(effect.kind==='blast'?2+(1-effect.life/.55)*5:1.3);this.dummy.updateMatrix();this.sparks.setMatrixAt(i,this.dummy.matrix);});this.sparks.instanceMatrix.needsUpdate=true;
  }
  private resetAim(){this.aim.reset();this.view.yaw=0;this.view.pitch=0;}
  private refresh(){this.hud.refresh();Object.assign(this.overlay.dataset,{yaw:this.view.yaw.toFixed(3),pitch:this.view.pitch.toFixed(4),aimYaw:this.aim.yaw.toFixed(4),aimPitch:this.aim.pitch.toFixed(4)});this.shownPhase=`${this.game.phase}:${this.game.mission}`;}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  dispose(){this.hud.dispose();this.scene.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});this.resources.forEach(resource=>resource.dispose());this.scene.clear();}
}
