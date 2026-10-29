import * as T from 'three';
import type {Input} from '../player/input';
import {DestinationCamera} from '../camera/destination-camera';
import {SalvageRun} from '../interactions/flight-game';
import {ShipAim} from '../interactions/flight-aim';
import type {SoundCue} from '../audio/sound-design';
import {FlightHUD} from '../ui/flight-hud';
import {courierModel,patrolModel,cargoModel,type FlightResource} from './salvage-models';
import {FlightEnvironment,SALVAGE_CAMERA_OBSTACLES} from './salvage-environment';
import {consolidateStatic} from '../world/consolidate';
import {FLIGHT_CAPACITY} from '../config/flight-levels';
import {brickDebrisGeometry,flightGate,signalTarget,freightShuttle} from './flight-objectives';

export class SpaceGame {
  readonly scene=new T.Scene();
  readonly camera=new T.PerspectiveCamera(58,innerWidth/innerHeight,.1,500);
  readonly view=new DestinationCamera(this.camera,{distance:24,yaw:0,pitch:0,aimView:true},SALVAGE_CAMERA_OBSTACLES);
  readonly game=new SalvageRun();readonly aim=new ShipAim();readonly hud:FlightHUD;
  readonly aimTarget=new T.Vector3();
  private readonly centreRay=new T.Raycaster();private readonly screenCentre=new T.Vector2();
  private readonly resources:FlightResource[]=[];
  private readonly environment:FlightEnvironment;
  private loadedMission=0;private obstacleBoxes:T.Box3[]=[];private readonly obstructionPoint=new T.Vector3();
  private readonly ship:ReturnType<typeof courierModel>;
  private readonly cargo:ReturnType<typeof cargoModel>[]=[];
  private readonly enemies:T.Group[]=[];
  private readonly gates:ReturnType<typeof flightGate>[]=[];
  private readonly relays:ReturnType<typeof signalTarget>[]=[];
  private readonly core:ReturnType<typeof signalTarget>;
  private readonly coreShield:T.Mesh;private readonly convoy:T.Group;
  private readonly rocks:T.InstancedMesh;private readonly lasers:T.InstancedMesh;private readonly sparks:T.InstancedMesh;
  private readonly shield:T.Mesh;private readonly dummy=new T.Object3D();
  private readonly anchor=new T.Vector3();private readonly projected=new T.Vector3();private readonly boltDirection=new T.Vector3();
  private readonly forward=new T.Vector3(0,0,1);private readonly red=new T.Color('#ff7069');private readonly green=new T.Color('#a3edcb');
  private uiClock=0;private time=0;private shownPhase='';
  get overlay(){return this.hud.root;}
  get position(){return this.ship.root.position;}
  constructor(parent:HTMLElement,private cue:(cue:SoundCue)=>void=()=>{}){
    this.environment=new FlightEnvironment(this.scene);
    this.ship=courierModel(this.resources);consolidateStatic(this.ship.root);this.ship.root.rotation.order='YXZ';this.ship.root.rotation.y=Math.PI;this.scene.add(this.ship.root);
    for(let i=0;i<FLIGHT_CAPACITY.cargo;i++){
      const cargo=cargoModel(this.resources);consolidateStatic(cargo.root);this.cargo.push(cargo);this.scene.add(cargo.root);
    }
    for(let i=0;i<FLIGHT_CAPACITY.enemies;i++){
      const patrol=patrolModel(this.resources);consolidateStatic(patrol);this.enemies.push(patrol);this.scene.add(patrol);
    }
    for(let i=0;i<FLIGHT_CAPACITY.gates;i++){const gate=flightGate(this.resources,i+1);this.gates.push(gate);this.scene.add(gate.root);}
    for(let i=0;i<FLIGHT_CAPACITY.relays;i++){const relay=signalTarget(this.resources);this.relays.push(relay);this.scene.add(relay.root);}
    this.core=signalTarget(this.resources,true);this.scene.add(this.core.root);this.convoy=freightShuttle();this.scene.add(this.convoy);
    const coreShieldGeo=new T.SphereGeometry(7,16,12),coreShieldMat=new T.MeshBasicMaterial({color:'#9bdde7',wireframe:true,transparent:true,opacity:.22});
    this.resources.push(coreShieldGeo,coreShieldMat);this.coreShield=new T.Mesh(coreShieldGeo,coreShieldMat);this.core.root.add(this.coreShield);
    this.rocks=this.pool(brickDebrisGeometry(),new T.MeshStandardMaterial({color:'#73757a',roughness:1}),FLIGHT_CAPACITY.debris,'salvage-debris');
    this.lasers=this.pool(new T.BoxGeometry(.16,.16,2.6),new T.MeshBasicMaterial({color:'white'}),96,'salvage-blasters');
    this.sparks=this.pool(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#efbd76',wireframe:true}),20,'salvage-impacts');
    const shieldGeo=new T.SphereGeometry(5.8,12,8),shieldMat=new T.MeshBasicMaterial({color:'#9cdfff',wireframe:true,transparent:true,opacity:.18});
    this.resources.push(shieldGeo,shieldMat);this.shield=new T.Mesh(shieldGeo,shieldMat);this.ship.root.add(this.shield);
    this.hud=new FlightHUD(parent,this.game,new URLSearchParams(window.location.search).get('dev')==='ui');
    this.hud.onReset=()=>{this.syncLevel();this.resetAim();this.syncObjects(true,false);this.refresh();};
    this.centreRay.far=120;this.syncLevel();this.syncObjects(true,false);
    this.camera.position.set(0,20,59);this.camera.lookAt(this.position);this.refresh();
  }
  private pool(geometry:T.BufferGeometry,material:T.Material,count:number,name:string){
    const mesh=new T.InstancedMesh(geometry,material,count);mesh.name=name;mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(mesh);this.resources.push(geometry,material);return mesh;
  }
  update(dt:number,input:Input,reduced:boolean,enabled=true){
    this.syncLevel();
    if(!enabled||this.game.phase!=='playing')this.hud.release();
    if(enabled&&input.pressed('KeyR')){this.game.retry();this.hud.release();this.resetAim();this.refresh();}
    const x=Number(input.down('KeyD'))-Number(input.down('KeyA')),z=Number(input.down('KeyS'))-Number(input.down('KeyW'));
    const y=Number(input.down('KeyE')||this.hud.held('up'))-Number(input.down('KeyQ')||this.hud.held('down'));
    this.anchor.copy(this.position);this.anchor.y+=1.4;this.view.update(dt,input,this.anchor,reduced,enabled);
    this.camera.updateMatrixWorld(true);this.scene.updateMatrixWorld(true);
    this.centreRay.setFromCamera(this.screenCentre,this.camera);this.centreRay.ray.at(120,this.aimTarget);
    // Only exact centre-ray intersections correct parallax. No target cone or snapping.
    const hit=this.centreRay.intersectObjects([this.rocks,...this.enemies.filter((_,i)=>this.game.enemies[i]?.hp>0&&this.game.enemies[i].active),...this.relays.filter((_,i)=>this.game.relays[i]?.hp>0).map(relay=>relay.root),...(this.game.core&&this.game.core.hp>0?[this.core.root]:[])],true)[0];
    if(hit)this.aimTarget.copy(hit.point);
    for(const box of this.obstacleBoxes)if(this.centreRay.ray.intersectBox(box,this.obstructionPoint)&&this.camera.position.distanceToSquared(this.obstructionPoint)<this.camera.position.distanceToSquared(this.aimTarget))this.aimTarget.copy(this.obstructionPoint);
    this.aim.pointAt(this.game.position,this.aimTarget);
    const shields=this.game.shields,collected=this.game.collected,phase=this.game.phase,shots=this.game.shotsFired,kills=this.game.kills,relays=this.game.relaysCleared,gates=this.game.gateIndex,convoyHull=this.game.convoy?.hp;
    const boosting=enabled&&(this.hud.held('boost')||input.down('ShiftLeft','ShiftRight'));
    this.game.update(dt,this.aim.movement({x,y,z}),{
      boost:boosting,fire:this.hud.held('fire')||input.down('Space'),enabled,
      aimTarget:this.aimTarget,
    });
    if(this.game.shotsFired>shots)this.cue('blaster');
    if(this.game.kills>kills||this.game.relaysCleared>relays)this.cue('detonate');
    if(this.game.shields<shields||convoyHull!==undefined&&this.game.convoy!.hp<convoyHull)this.cue('impact');else if(this.game.collected>collected||this.game.gateIndex>gates)this.cue('signal-step');
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
    const target=this.game.target;
    this.uiClock+=dt;if(this.uiClock>.1||this.shownPhase!==`${this.game.phase}:${this.game.mission}`){
      this.projected.set(target.x,target.y+4,target.z).project(this.camera);this.hud.targetLabel((this.projected.x+1)*50,(1-this.projected.y)*50,this.projected.z<1&&this.projected.z>-1);
      this.refresh();this.uiClock=0;
    }
  }
  private syncObjects(reduced:boolean,boosting:boolean){
    const g=this.game;this.position.set(g.position.x,g.position.y,g.position.z);
    this.shield.visible=g.invulnerable>0&&g.phase==='playing';
    this.ship.flames.forEach(flame=>{flame.scale.y=boosting&&g.boost>.03?2.6:1;flame.position.z=-4.05-flame.scale.y*1.5;flame.visible=g.phase==='playing';});
    const hazards=g.hazards;this.rocks.count=hazards.length;
    hazards.forEach((rock,i)=>{this.dummy.position.set(rock.x,rock.y,rock.z);this.dummy.rotation.set(reduced?0:this.time*.1,rock.id,reduced?0:this.time*.15);this.dummy.scale.setScalar(1);this.dummy.updateMatrix();this.rocks.setMatrixAt(i,this.dummy.matrix);});this.rocks.instanceMatrix.needsUpdate=true;
    this.cargo.forEach((pod,i)=>{
      const state=g.cargo[i];pod.root.visible=!!state&&!state.collected;if(!state)return;pod.root.position.set(state.x,state.y,state.z);pod.root.rotation.y=reduced?0:this.time*.2;
      pod.material.color.set(g.locked(state)?'#fa817b':'#efbd76');
    });
    this.enemies.forEach((model,i)=>{const enemy=g.enemies[i];model.visible=!!enemy&&enemy.hp>0&&enemy.active;if(!enemy)return;model.position.set(enemy.x,enemy.y,enemy.z);model.rotation.y=Math.atan2(g.position.x-enemy.x,g.position.z-enemy.z);model.rotation.z=reduced||enemy.role==='turret'?0:Math.sin(this.time*.7+i)*.08;});
    this.gates.forEach((gate,i)=>{const point=g.level.gates[i];gate.root.visible=!!point&&i>=g.gateIndex;if(point)gate.root.position.set(point.x,point.y,point.z);gate.active.visible=i===g.gateIndex;});
    this.relays.forEach((relay,i)=>{const state=g.relays[i];relay.root.visible=!!state&&state.hp>0;if(state)relay.root.position.set(state.x,state.y,state.z);relay.material.color.set(g.level.kind==='assault'||i===g.relaysCleared?'#9bdde7':'#7a858d');});
    this.core.root.visible=!!g.core&&g.core.hp>0;
    if(g.core){this.core.root.position.set(g.core.x,g.core.y,g.core.z);this.coreShield.visible=g.relaysCleared<g.relays.length;this.core.material.color.set(this.coreShield.visible?'#9bdde7':'#fe8a18');}
    this.convoy.visible=!!g.convoy&&g.convoy.hp>0;
    if(g.convoy){this.convoy.position.set(g.convoy.x,g.convoy.y,g.convoy.z);const next=g.level.convoyPath[Math.min(g.convoy.waypoint,g.level.convoyPath.length-1)];this.convoy.rotation.y=Math.atan2(next.x-g.convoy.x,next.z-g.convoy.z);}
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
  private syncLevel(){
    if(this.loadedMission===this.game.mission)return;this.loadedMission=this.game.mission;
    this.environment.setLevel(this.game.level);this.view.distance=24;this.resetAim();this.time=0;
    const obstacles=this.game.level.obstacles.map(box=>({x:box.x,z:box.z,w:box.w,d:box.d,height:box.y+box.h/2,bottom:box.y-box.h/2}));
    this.view.setObstacles([...SALVAGE_CAMERA_OBSTACLES,...obstacles]);
    this.obstacleBoxes=this.game.level.obstacles.map(box=>new T.Box3(new T.Vector3(box.x-box.w/2,box.y-box.h/2,box.z-box.d/2),new T.Vector3(box.x+box.w/2,box.y+box.h/2,box.z+box.d/2)));
  }
  private refresh(){this.hud.refresh();Object.assign(this.overlay.dataset,{yaw:this.view.yaw.toFixed(3),pitch:this.view.pitch.toFixed(4),aimYaw:this.aim.yaw.toFixed(4),aimPitch:this.aim.pitch.toFixed(4)});this.shownPhase=`${this.game.phase}:${this.game.mission}`;}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  dispose(){this.hud.dispose();this.environment.dispose();this.scene.traverse(object=>{if(object instanceof T.InstancedMesh)object.dispose();});this.resources.forEach(resource=>resource.dispose());this.scene.clear();}
}
