export interface FlightPoint {x:number;y:number;z:number}
export interface FlightCargo extends FlightPoint {collected:boolean;guard:number}
export interface FlightEnemy extends FlightPoint {id:number;hp:number;cooldown:number}
export interface FlightRock extends FlightPoint {id:number;hp:number;radius:number}
export interface FlightBolt extends FlightPoint {direction:FlightPoint;enemy:boolean;life:number}
export interface FlightEffect extends FlightPoint {life:number;kind:'hit'|'blast'}
export interface FlightControls {boost?:boolean;fire?:boolean;aim?:FlightPoint;aimTarget?:FlightPoint;enabled?:boolean}
export type FlightPhase='briefing'|'playing'|'delivered'|'won'|'lost';
export const FLIGHT_BOUNDS={minX:-58,maxX:58,minY:5,maxY:40,minZ:-54,maxZ:42};
export const FLIGHT_DOCK={x:0,y:8,z:32} satisfies FlightPoint;
const MISSIONS=[[[ -28,12,6],[26,23,-8],[0,34,-36]],[[-44,27,-20],[42,14,-36],[-4,36,10]],[[-38,36,-40],[45,28,5],[7,12,-48]]] as const;
export const flightDistance=(a:FlightPoint,b:FlightPoint)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
function direction(a:FlightPoint,b:FlightPoint):FlightPoint {
  const length=flightDistance(a,b)||1;return{x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length};
}
// Swept hits stop fast bolts tunneling through small targets at low frame rates.
export function flightSegmentDistance(a:FlightPoint,b:FlightPoint,p:FlightPoint){
  const x=b.x-a.x,y=b.y-a.y,z=b.z-a.z,denominator=x*x+y*y+z*z;
  const t=denominator?clamp(((p.x-a.x)*x+(p.y-a.y)*y+(p.z-a.z)*z)/denominator,0,1):0;
  return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t,p.z-a.z-z*t);
}
export class SalvageRun {
  phase:FlightPhase='briefing';mission=1;score=0;shields=3;timeLeft=120;boost=1;elapsed=0;
  heat=0;overheated=false;shotsFired=0;kills=0;invulnerable=0;
  readonly position:FlightPoint={...FLIGHT_DOCK};cargo:FlightCargo[]=[];enemies:FlightEnemy[]=[];
  bolts:FlightBolt[]=[];effects:FlightEffect[]=[];
  lastEvent='Disable the patrols, recover their cargo, return to the green dock.';
  private cooldown=0;private rocks:FlightRock[]=[];
  constructor(){this.prepare();}
  get collected(){return this.cargo.filter(pod=>pod.collected).length;}
  get carryingAll(){return this.collected===this.cargo.length;}
  get target():FlightCargo|typeof FLIGHT_DOCK {
    if(this.carryingAll)return FLIGHT_DOCK;
    return this.cargo.filter(pod=>!pod.collected).sort((a,b)=>flightDistance(a,this.position)-flightDistance(b,this.position))[0];
  }
  get hazards(){return this.rocks.filter(rock=>rock.hp>0);}
  get patrols(){return this.enemies.filter(enemy=>enemy.hp>0);}
  locked(pod:FlightCargo){return (this.enemies[pod.guard]?.hp??0)>0;}
  start(){if(this.phase==='briefing')this.phase='playing';}
  next(){if(this.phase!=='delivered')return;this.mission++;this.prepare();}
  restart(){this.mission=1;this.score=0;this.shields=3;this.shotsFired=0;this.kills=0;this.prepare();}
  private prepare(){
    this.cargo=MISSIONS[this.mission-1].map(([x,y,z],guard)=>({x,y,z,guard,collected:false}));
    this.enemies=this.cargo.map((pod,id)=>({id,x:pod.x,y:pod.y+2,z:pod.z-7,hp:3,cooldown:2+id*.7}));
    this.rocks=Array.from({length:4+this.mission*2},(_,id)=>({id,x:Math.sin(id*2.4)*36+Math.sin(id)*7,y:10+(id%3)*10,z:-12-Math.cos(id*1.7)*22+Math.cos(id*2)*5,hp:2,radius:2+(id%3)*.35}));
    Object.assign(this.position,FLIGHT_DOCK);this.timeLeft=120;this.boost=1;this.elapsed=0;this.invulnerable=0;this.heat=0;this.cooldown=0;this.overheated=false;
    this.bolts=[];this.effects=[];this.phase='briefing';
    this.lastEvent='Disable the patrols, recover their cargo, return to the green dock.';
  }
  update(dt:number,input:FlightPoint,controls:FlightControls={}){
    if(controls.enabled===false||this.phase!=='playing')return;
    const duration=clamp(dt,0,.25),steps=Math.max(1,Math.ceil(duration/.025));
    for(let step=0;step<steps&&this.phase==='playing';step++)this.step(duration/steps,input,controls);
  }
  private step(dt:number,input:FlightPoint,controls:FlightControls){
    this.elapsed+=dt;this.timeLeft=Math.max(0,this.timeLeft-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.cooldown=Math.max(0,this.cooldown-dt);
    this.heat=Math.max(0,this.heat-dt*.24);if(this.overheated&&this.heat<.3){this.overheated=false;this.lastEvent='Blasters cooled. Ready to fire.';}
    const length=Math.hypot(input.x,input.y,input.z),boosting=controls.boost&&this.boost>0&&length>0,speed=boosting?30:18;
    this.boost=clamp(this.boost+(boosting?-.34:.2)*dt,0,1);
    if(length){
      this.position.x=clamp(this.position.x+input.x/length*speed*dt,FLIGHT_BOUNDS.minX,FLIGHT_BOUNDS.maxX);
      this.position.y=clamp(this.position.y+input.y/length*speed*dt,FLIGHT_BOUNDS.minY,FLIGHT_BOUNDS.maxY);
      this.position.z=clamp(this.position.z+input.z/length*speed*dt,FLIGHT_BOUNDS.minZ,FLIGHT_BOUNDS.maxZ);
    }
    this.rocks.forEach(rock=>{const i=rock.id;rock.x=Math.sin(i*2.4)*36+Math.sin(this.elapsed*(.45+this.mission*.08)+i)*7;rock.z=-12-Math.cos(i*1.7)*22+Math.cos(this.elapsed*.5+i*2)*5;});
    for(const enemy of this.patrols){
      const pod=this.cargo[enemy.id];enemy.x=pod.x+Math.sin(this.elapsed*.65+enemy.id)*3;enemy.y=pod.y+2+Math.sin(this.elapsed*.45+enemy.id);enemy.z=pod.z-7+Math.cos(this.elapsed*.65+enemy.id)*2;
      enemy.cooldown-=dt;
      if(enemy.cooldown<=0&&flightDistance(enemy,this.position)<48){this.emit(enemy,direction(enemy,this.position),true);enemy.cooldown=2.7-this.mission*.3;}
    }
    if(controls.fire&&!this.cooldown&&!this.overheated)this.fire(controls.aimTarget?direction(this.position,controls.aimTarget):controls.aim??{x:0,y:0,z:-1});
    this.updateBolts(dt);
    this.effects=this.effects.filter(effect=>{effect.life-=dt;return effect.life>0;});
    if(this.phase!=='playing')return;
    if(!this.invulnerable&&(this.hazards.some(rock=>flightDistance(this.position,rock)<rock.radius+1.65)||this.patrols.some(enemy=>flightDistance(this.position,enemy)<3.5)))this.damage('Collision. Shield hit!');
    if(this.phase!=='playing')return;
    if(!this.timeLeft){this.phase='lost';this.lastEvent='Delivery window closed. Try a quicker route.';return;}
    for(const pod of this.cargo)if(!pod.collected&&!this.locked(pod)&&flightDistance(this.position,pod)<4){pod.collected=true;this.score+=100;this.lastEvent=this.carryingAll?'All cargo aboard. Descend to the green dock.':`Cargo recovered · ${this.collected} / 3`;}
    if(this.carryingAll&&flightDistance(this.position,FLIGHT_DOCK)<5){
      this.score+=Math.round(this.timeLeft)*5+this.shields*50;this.phase=this.mission===3?'won':'delivered';this.bolts=[];
      this.lastEvent=this.phase==='won'?'All three sectors cleared. The crew is home.':'Cargo delivered. Shields restored. Next sector unlocked.';this.shields=3;
    }
  }
  private fire(aim:FlightPoint){
    const length=Math.hypot(aim.x,aim.y,aim.z);if(!length)return;
    const heading={x:aim.x/length,y:aim.y/length,z:aim.z/length};
    this.emit(this.position,heading,false);this.shotsFired++;this.cooldown=.18;this.heat=clamp(this.heat+.14,0,1);
    if(this.heat>=1){this.overheated=true;this.lastEvent='Blasters overheated. Let them cool.';}
  }
  private emit(origin:FlightPoint,heading:FlightPoint,enemy:boolean){
    if(this.bolts.length>=48)return;
    this.bolts.push({x:origin.x+heading.x*3,y:origin.y+heading.y*3,z:origin.z+heading.z*3,direction:heading,enemy,life:1.7});
  }
  private updateBolts(dt:number){
    this.bolts=this.bolts.filter(bolt=>{
      const before={x:bolt.x,y:bolt.y,z:bolt.z},speed=bolt.enemy?32:105;
      bolt.x+=bolt.direction.x*speed*dt;bolt.y+=bolt.direction.y*speed*dt;bolt.z+=bolt.direction.z*speed*dt;bolt.life-=dt;
      if(bolt.enemy){
        if(flightSegmentDistance(before,bolt,this.position)<2){this.damage('Patrol blaster hit!');return false;}
      }else{
        const hits=[...this.patrols,...this.hazards].filter(target=>flightSegmentDistance(before,bolt,target)<('radius' in target?target.radius:3));
        hits.sort((a,b)=>flightDistance(before,a)-flightDistance(before,b));
        const target=hits[0];if(target){
          target.hp--;this.effects.push({...target,kind:target.hp?'hit':'blast',life:target.hp ? .22 : .55});
          if(!target.hp){const guard='cooldown' in target;this.score+=guard?150:25;if(guard)this.kills++;this.lastEvent=guard?'Patrol disabled. Its cargo is unlocked.':'Debris cleared. Flight lane open.';}
          return false;
        }
      }
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
