import {FLIGHT_LEVELS,FLIGHT_BOUNDS,FLIGHT_DOCK,type FlightPoint,type DebrisSpawn,type EnemySpawn,type RelaySpawn,type FlightObstacle} from '../config/flight-levels';
export {FLIGHT_BOUNDS,FLIGHT_DOCK};
export type {FlightPoint};
export interface FlightCargo extends FlightPoint {collected:boolean;guard:number}
export interface FlightEnemy extends EnemySpawn {id:number;cooldown:number;active:boolean;anchor:FlightPoint}
export interface FlightRock extends DebrisSpawn {id:number;hp:number;anchor:FlightPoint}
export interface FlightRelay extends RelaySpawn {id:number}
export interface FlightConvoy extends FlightPoint {hp:number;waypoint:number;docked:boolean;invulnerable:number}
export interface FlightBolt extends FlightPoint {direction:FlightPoint;enemy:boolean;life:number}
export interface FlightEffect extends FlightPoint {life:number;kind:'hit'|'blast'}
export interface FlightControls {boost?:boolean;fire?:boolean;aim?:FlightPoint;aimTarget?:FlightPoint;enabled?:boolean}
export type FlightPhase='briefing'|'playing'|'delivered'|'won'|'lost';
export type FlightTargetKind='cargo'|'patrol'|'gate'|'relay'|'convoy'|'core'|'dock';
export const flightDistance=(a:FlightPoint,b:FlightPoint)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function direction(a:FlightPoint,b:FlightPoint):FlightPoint {const length=flightDistance(a,b)||1;return{x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length};}
export function flightSegmentDistance(a:FlightPoint,b:FlightPoint,p:FlightPoint){
  const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,denominator=x*x+y*y+z*z;
  const t=denominator?clamp(((p.x-a.x)*x+(p.y-a.y)*y+(p.z-a.z)*z)/denominator,0,1):0;
  return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t,p.z-a.z-z*t);
}
export function flightObstacleHit(point:FlightPoint,radius:number,box:FlightObstacle){
  return Math.hypot(Math.max(0,Math.abs(point.x-box.x)-box.w/2),Math.max(0,Math.abs(point.y-box.y)-box.h/2),Math.max(0,Math.abs(point.z-box.z)-box.d/2))<radius;
}
export function flightObstacleEntry(a:FlightPoint,b:FlightPoint,box:FlightObstacle):number|null {
  let near=0,far=1;
  for(const [axis,size]of [['x','w'],['y','h'],['z','d']] as const){
    const delta=b[axis]-a[axis],min=box[axis]-box[size]/2,max=box[axis]+box[size]/2;
    if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max)return null;continue;}
    const entry=(min-a[axis])/delta,exit=(max-a[axis])/delta;
    near=Math.max(near,Math.min(entry,exit));far=Math.min(far,Math.max(entry,exit));if(near>far)return null;
  }
  return near;
}

export class SalvageRun {
  phase:FlightPhase='briefing';mission=1;score=0;shields=3;timeLeft=120;boost=1;elapsed=0;
  heat=0;overheated=false;shotsFired=0;kills=0;invulnerable=0;gateIndex=0;
  readonly position:FlightPoint={...FLIGHT_DOCK};cargo:FlightCargo[]=[];enemies:FlightEnemy[]=[];relays:FlightRelay[]=[];
  convoy:FlightConvoy|null=null;core:(FlightPoint&{hp:number;radius:number})|null=null;
  bolts:FlightBolt[]=[];effects:FlightEffect[]=[];lastEvent='';
  private cooldown=0;private rocks:FlightRock[]=[];
  private banked={score:0,kills:0,shots:0};
  constructor(mission=1){this.restart(mission);}
  get level(){return FLIGHT_LEVELS[this.mission-1];}
  get totalLevels(){return FLIGHT_LEVELS.length;}
  get collected(){return this.cargo.filter(pod=>pod.collected).length;}
  get carryingAll(){return this.cargo.length>0&&this.collected===this.cargo.length;}
  get relaysCleared(){return this.relays.filter(relay=>relay.hp<=0).length;}
  get hazards(){return this.rocks.filter(rock=>rock.hp>0);}
  get patrols(){return this.enemies.filter(enemy=>enemy.hp>0&&enemy.active);}
  get objectiveComplete(){
    switch(this.level.kind){
      case 'course':return this.gateIndex===this.level.gates.length;
      case 'escort':return !!this.convoy?.docked;
      case 'assault':return this.core?.hp===0;
      default:return this.carryingAll;
    }
  }
  get targetKind():FlightTargetKind {
    if(this.objectiveComplete)return 'dock';
    if(this.level.kind==='course')return 'gate';
    if(this.level.kind==='relay'&&this.relaysCleared<this.relays.length)return 'relay';
    if(this.level.kind==='assault')return this.relaysCleared<this.relays.length?'relay':'core';
    if(this.convoy)return flightDistance(this.position,this.convoy)<24&&this.patrols.length?'patrol':'convoy';
    const pod=this.nearest(this.cargo.filter(pod=>!pod.collected));
    return pod&&this.locked(pod)?'patrol':'cargo';
  }
  get target():FlightCargo|FlightPoint {
    switch(this.targetKind){
      case 'dock':return FLIGHT_DOCK;
      case 'gate':return this.level.gates[this.gateIndex];
      case 'relay':return this.level.kind==='relay'?this.relays.find(relay=>relay.hp>0)!:this.nearest(this.relays.filter(relay=>relay.hp>0))!;
      case 'core':return this.core!;
      case 'convoy':return this.convoy!;
      case 'patrol':{
        if(this.convoy)return this.nearest(this.patrols)!;
        const pod=this.nearest(this.cargo.filter(pod=>!pod.collected))!;return this.enemies[pod.guard];
      }
      default:return this.nearest(this.cargo.filter(pod=>!pod.collected))??FLIGHT_DOCK;
    }
  }
  get targetLabel(){
    switch(this.targetKind){
      case 'gate':return `Gate ${this.gateIndex+1}`;
      case 'relay':return (this.target as FlightRelay).label;
      case 'core':return 'Cruiser core';case 'convoy':return 'Freight shuttle';case 'dock':return 'Extraction dock';
      case 'patrol':return this.convoy?'Interceptor':'Cargo patrol';default:return this.level.kind==='relay'?'Flight recorder':'Cargo';
    }
  }
  get progress(){
    switch(this.level.kind){
      case 'course':return `gates ${this.gateIndex} / ${this.level.gates.length}`;
      case 'relay':return this.relaysCleared<this.relays.length?`relays ${this.relaysCleared} / ${this.relays.length}`:`recorder ${this.collected} / 1`;
      case 'escort':return `shuttle hull ${this.convoy?.hp??0} / 8 · route ${Math.min(this.convoy?.waypoint??0,this.level.convoyPath.length-1)} / ${this.level.convoyPath.length-1}`;
      case 'assault':return this.relaysCleared<this.relays.length?`generators ${this.relaysCleared} / ${this.relays.length}`:`core ${this.core?.hp??0} / ${this.level.core?.hp??0}`;
      default:return `cargo ${this.collected} / ${this.cargo.length}`;
    }
  }
  get instruction(){
    if(this.objectiveComplete)return 'Return to the green dock';
    if(this.level.kind==='course')return `Fly through gate ${this.gateIndex+1}`;
    if(this.level.kind==='relay'&&this.targetKind==='relay')return `Shoot ${this.targetLabel.toLowerCase()} next`;
    if(this.convoy)return flightDistance(this.position,this.convoy)>24?'Rejoin the shuttle to keep it moving':'Protect the shuttle from interceptors';
    if(this.level.kind==='assault')return this.targetKind==='relay'?'Destroy both shield generators':'Destroy the exposed reactor core';
    return this.targetKind==='patrol'?'Disable the cargo patrol':this.level.kind==='relay'?'Recover the flight recorder':'Match altitude and recover cargo';
  }
  locked(pod:FlightCargo){return (this.level.kind==='relay'&&this.relaysCleared<this.relays.length)||(this.enemies[pod.guard]?.hp??0)>0;}
  start(){if(this.phase==='briefing')this.phase='playing';}
  next(){if(this.phase!=='delivered'||this.mission>=this.totalLevels)return;this.banked={score:this.score,kills:this.kills,shots:this.shotsFired};this.mission++;this.prepare();}
  restart(mission=1){this.mission=Number.isInteger(mission)?clamp(mission,1,this.totalLevels):1;this.banked={score:0,kills:0,shots:0};this.score=0;this.shields=3;this.shotsFired=0;this.kills=0;this.prepare();}
  retry(){this.score=this.banked.score;this.kills=this.banked.kills;this.shotsFired=this.banked.shots;this.shields=3;this.prepare();}
  private nearest<P extends FlightPoint>(points:P[]){return points.reduce<P|undefined>((nearest,p)=>!nearest||flightDistance(p,this.position)<flightDistance(nearest,this.position)?p:nearest,undefined);}
  private prepare(){
    this.cargo=this.level.cargo.map(pod=>({...pod,collected:false}));
    this.enemies=this.level.enemies.map((enemy,id)=>({...enemy,id,anchor:{x:enemy.x,y:enemy.y,z:enemy.z},active:!enemy.wave,cooldown:2+id*.7}));
    this.rocks=this.level.debris.map((rock,id)=>({...rock,id,anchor:{x:rock.x,y:rock.y,z:rock.z},hp:2,x:rock.x+Math.sin(id)*rock.drift,z:rock.z+Math.cos(id*2)*rock.drift*.7}));
    this.relays=this.level.relays.map((relay,id)=>({...relay,id}));this.core=this.level.core?{...this.level.core}:null;
    this.convoy=this.level.convoyPath.length?{...this.level.convoyPath[0],hp:8,waypoint:1,docked:false,invulnerable:0}:null;
    Object.assign(this.position,FLIGHT_DOCK);this.timeLeft=this.level.timeLimit;this.boost=1;this.elapsed=0;this.invulnerable=0;this.heat=0;this.cooldown=0;this.overheated=false;this.gateIndex=0;
    this.bolts=[];this.effects=[];this.phase='briefing';this.lastEvent=this.level.steps[0]+'.';
  }
  update(dt:number,input:FlightPoint,controls:FlightControls={}){
    if(controls.enabled===false||this.phase!=='playing')return;
    const duration=clamp(dt,0,.25),steps=Math.max(1,Math.ceil(duration/.025));
    for(let step=0;step<steps&&this.phase==='playing';step++)this.step(duration/steps,input,controls);
  }
  private step(dt:number,input:FlightPoint,controls:FlightControls){
    this.elapsed+=dt;this.timeLeft=Math.max(0,this.timeLeft-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.cooldown=Math.max(0,this.cooldown-dt);
    this.heat=Math.max(0,this.heat-dt*.24);if(this.overheated&&this.heat<.3){this.overheated=false;this.lastEvent='Blasters cooled. Ready to fire.';}
    const before={...this.position},length=Math.hypot(input.x,input.y,input.z),boosting=controls.boost&&this.boost>0&&length>0,speed=boosting?30:18;
    this.boost=clamp(this.boost+(boosting?-.34:.2)*dt,0,1);
    if(length){
      for(const [axis,min,max]of [['x',FLIGHT_BOUNDS.minX,FLIGHT_BOUNDS.maxX],['y',FLIGHT_BOUNDS.minY,FLIGHT_BOUNDS.maxY],['z',FLIGHT_BOUNDS.minZ,FLIGHT_BOUNDS.maxZ]] as const){
        const previous=this.position[axis];this.position[axis]=clamp(previous+input[axis]/length*speed*dt,min,max);
        if(this.level.obstacles.some(box=>flightObstacleHit(this.position,1.65,box))){this.position[axis]=previous;this.damage('Structure ahead. Shield hit!');}
      }
    }
    if(this.phase!=='playing')return;
    for(const rock of this.rocks){rock.x=rock.anchor.x+Math.sin(this.elapsed*(.45+this.mission*.08)+rock.id)*rock.drift;rock.z=rock.anchor.z+Math.cos(this.elapsed*.5+rock.id*2)*rock.drift*.7;}
    this.updateConvoy(dt);
    for(const enemy of this.enemies){
      if(!enemy.active&&this.convoy&&this.convoy.waypoint>=(enemy.wave??0)){enemy.active=true;this.lastEvent='Incoming interceptors. Protect the shuttle.';}
      if(!enemy.active||enemy.hp<=0)continue;
      if(enemy.role==='interceptor'&&this.convoy){
        const angle=this.elapsed*.3+enemy.id*1.8,blend=1-Math.exp(-dt*.35);
        enemy.x+=(this.convoy.x+Math.sin(angle)*16-enemy.x)*blend;enemy.z+=(this.convoy.z+Math.cos(angle)*16-enemy.z)*blend;enemy.y+=(this.convoy.y+5-enemy.y)*blend;
      }else if(enemy.role==='guard'){
        const pod=enemy.cargo===undefined?null:this.cargo[enemy.cargo],anchor=pod?{x:pod.x,y:pod.y+2,z:pod.z-7}:enemy.anchor;
        enemy.x=anchor.x+Math.sin(this.elapsed*.65+enemy.id)*3;enemy.y=anchor.y+Math.sin(this.elapsed*.45+enemy.id);enemy.z=anchor.z+Math.cos(this.elapsed*.65+enemy.id)*2;
      }
      enemy.cooldown-=dt;const aim=this.convoy&&!this.convoy.docked?this.convoy:this.position;
      if(enemy.cooldown<=0&&flightDistance(enemy,aim)<48){this.emit(enemy,direction(enemy,aim),true);enemy.cooldown=this.convoy?4.5:Math.max(1.4,2.7-this.mission*.2);}
    }
    if(controls.fire&&!this.cooldown&&!this.overheated)this.fire(controls.aimTarget?direction(this.position,controls.aimTarget):controls.aim??{x:0,y:0,z:-1});
    this.updateBolts(dt);this.effects=this.effects.filter(effect=>{effect.life-=dt;return effect.life>0;});
    if(this.phase!=='playing')return;
    if(!this.invulnerable&&(this.hazards.some(rock=>flightDistance(this.position,rock)<rock.radius+1.65)||this.patrols.some(enemy=>flightDistance(this.position,enemy)<3.5)||this.core&&this.core.hp>0&&flightDistance(this.position,this.core)<this.core.radius+1.65))this.damage('Collision. Shield hit!');
    if(this.phase!=='playing')return;
    if(!this.timeLeft){this.phase='lost';this.lastEvent='Delivery window closed. Try a quicker route.';return;}
    const gate=this.level.gates[this.gateIndex];
    if(gate&&flightSegmentDistance(before,this.position,gate)<4.5){this.gateIndex++;this.score+=100;this.lastEvent=this.objectiveComplete?'Course complete. Return to the dock.':`Gate ${this.gateIndex} cleared. Find gate ${this.gateIndex+1}.`;}
    for(const pod of this.cargo)if(!pod.collected&&!this.locked(pod)&&flightDistance(this.position,pod)<4){pod.collected=true;this.score+=100;this.lastEvent=this.carryingAll?'Cargo aboard. Descend to the green dock.':`Cargo recovered · ${this.collected} / ${this.cargo.length}`;}
    if(this.objectiveComplete&&flightDistance(this.position,FLIGHT_DOCK)<5){
      this.score+=Math.round(this.timeLeft)*5+this.shields*50;this.phase=this.mission===this.totalLevels?'won':'delivered';this.bolts=[];
      this.lastEvent=this.phase==='won'?'All five levels cleared. The crew is home.':'Level complete. Shields restored. The next route is ready.';this.shields=3;
    }
  }
  private updateConvoy(dt:number){
    const convoy=this.convoy;if(!convoy)return;convoy.invulnerable=Math.max(0,convoy.invulnerable-dt);
    if(convoy.docked||flightDistance(this.position,convoy)>24)return;
    const destination=this.level.convoyPath[convoy.waypoint],distance=flightDistance(convoy,destination),step=Math.min(distance,dt*6.5),heading=direction(convoy,destination);
    convoy.x+=heading.x*step;convoy.y+=heading.y*step;convoy.z+=heading.z*step;
    if(distance<=step+.01){convoy.waypoint++;if(convoy.waypoint===this.level.convoyPath.length){convoy.docked=true;this.score+=500;this.lastEvent='Freight shuttle docked safely. Join it at the green dock.';}}
  }
  private fire(aim:FlightPoint){
    const length=Math.hypot(aim.x,aim.y,aim.z);if(!length)return;
    this.emit(this.position,{x:aim.x/length,y:aim.y/length,z:aim.z/length},false);this.shotsFired++;this.cooldown=.18;this.heat=clamp(this.heat+.14,0,1);
    if(this.heat>=1){this.overheated=true;this.lastEvent='Blasters overheated. Let them cool.';}
  }
  private emit(origin:FlightPoint,heading:FlightPoint,enemy:boolean){
    const muzzle={x:origin.x+heading.x*3,y:origin.y+heading.y*3,z:origin.z+heading.z*3};
    if(this.level.obstacles.some(box=>flightObstacleEntry(origin,muzzle,box)!==null))return;
    if(this.bolts.length<48)this.bolts.push({...muzzle,direction:heading,enemy,life:1.7});
  }
  private updateBolts(dt:number){
    this.bolts=this.bolts.filter(bolt=>{
      const before={x:bolt.x,y:bolt.y,z:bolt.z},speed=bolt.enemy?32:105;
      bolt.x+=bolt.direction.x*speed*dt;bolt.y+=bolt.direction.y*speed*dt;bolt.z+=bolt.direction.z*speed*dt;bolt.life-=dt;
      let wall=1;for(const box of this.level.obstacles){const entry=flightObstacleEntry(before,bolt,box);if(entry!==null)wall=Math.min(wall,entry);}
      const blocked=wall<1;
      if(blocked){bolt.x=before.x+(bolt.x-before.x)*wall;bolt.y=before.y+(bolt.y-before.y)*wall;bolt.z=before.z+(bolt.z-before.z)*wall;}
      if(bolt.enemy){
        const playerHit=flightSegmentDistance(before,bolt,this.position)<2;
        const convoyHit=this.convoy&&!this.convoy.docked&&flightSegmentDistance(before,bolt,this.convoy)<3.2;
        if(convoyHit&&(!playerHit||flightDistance(before,this.convoy!)<flightDistance(before,this.position))){
          if(!this.convoy!.invulnerable){this.convoy!.hp--;this.convoy!.invulnerable=1.4;this.lastEvent='Shuttle hit! Intercept the patrols.';if(!this.convoy!.hp){this.phase='lost';this.lastEvent='Freight shuttle lost. Defend its hull and stay close.';}}
          return false;
        }
        if(playerHit){this.damage('Patrol blaster hit!');return false;}
      }else{
        const targets=[...this.patrols,...this.hazards,...this.relays.filter(r=>r.hp>0),...(this.core&&this.core.hp>0?[this.core]:[])];
        const hits=targets.filter(target=>flightSegmentDistance(before,bolt,target)<('radius' in target?target.radius:3));
        hits.sort((a,b)=>flightDistance(before,a)-flightDistance(before,b));const target=hits[0];
        if(target){
          if(target===this.core&&this.relaysCleared<this.relays.length){this.lastEvent='Core shields active. Destroy both generators first.';return false;}
          if('label' in target&&this.level.kind==='relay'&&target!==this.relays.find(relay=>relay.hp>0)){this.lastEvent=`Wrong relay. Shoot ${this.relays.find(relay=>relay.hp>0)!.label.toLowerCase()} first.`;return false;}
          target.hp--;this.effects.push({...target,kind:target.hp?'hit':'blast',life:target.hp ? .22 : .55});
          if(!target.hp){
            const patrol='cooldown' in target,relay='label' in target;this.score+=patrol?150:relay?200:target===this.core?1000:25;
            if(patrol)this.kills++;
            this.lastEvent=patrol?'Patrol disabled.':relay?(this.relaysCleared===this.relays.length?(this.core?'Shields down. Attack the reactor core.':'Recorder unlocked. Recover it behind the tower.'):`${target.label} offline. Find the next relay.`):target===this.core?'Cruiser disabled. Return to the extraction dock.':'Debris cleared. Flight lane open.';
          }
          return false;
        }
      }
      if(blocked){this.effects.push({x:bolt.x,y:bolt.y,z:bolt.z,kind:'hit',life:.22});return false;}
      return bolt.life>0;
    });
    if(this.effects.length>20)this.effects.splice(0,this.effects.length-20);
  }
  private damage(message:string){
    if(this.invulnerable||this.phase!=='playing')return;
    this.shields--;this.invulnerable=2;this.lastEvent=message;this.effects.push({...this.position,kind:'hit',life:.3});
    if(!this.shields){this.phase='lost';this.lastEvent='Shields depleted. Your cargo run ended.';}
  }
}
