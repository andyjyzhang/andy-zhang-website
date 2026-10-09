import type {ActivityResult} from '../interactions/activities';
import type {BuildCue} from '../scenes/build-intro';
import type {GameAudio,LoopKind} from './game-audio';
type Sink=Pick<GameAudio,'play'|'beginFrame'|'endFrame'|'loop'|'quiet'>;
interface Point {x:number;z:number}
export interface SoundFrame extends Point {
  mode:'town'|'intro'|'launch'|'space'|'gate'|'observatory'|'transit';
  paused:boolean;airborne?:boolean;verticalSpeed?:number;vehicleSpeed?:number;vehicleThrottle?:number;driving?:boolean;running?:boolean;yaw?:number;
  cooling?:boolean;drone?:boolean;cargo?:boolean;train?:Point;progress?:number;
  boosters?:readonly Point[];overview?:boolean;building?:boolean;
}
export function distanceGain(listener:Point,source:Point,radius=24){return Math.max(0,1-Math.hypot(listener.x-source.x,listener.z-source.z)/radius)**2;}
export class WorldAudio {
  sources:Partial<Record<LoopKind,Point>>={};
  private last:SoundFrame|null=null;private walked=0;private cooldown=0;private collisionCooldown=0;private trainNearby=false;
  constructor(readonly sink:Sink) {}
  reset(){this.last=null;this.walked=this.cooldown=0;this.trainNearby=false;this.sink.quiet();}
  intro(cue:BuildCue){if(cue==='start'||cue==='snap')this.sink.play('brick',{volume:cue==='start'?.9:.32});else if(cue==='reveal'){this.sink.quiet();this.sink.play('ready');}else if(cue==='land')this.sink.play('land',{volume:.75});else if(cue==='skip'||cue==='finish'){this.sink.quiet();if(cue==='skip')this.sink.play('close');}}
  activity(result:ActivityResult) {
    const kind=result.definition.kind;
    if(kind==='arcade')this.sink.play(result.command==='stop'?(result.message.includes('Synchronized')?'signal-win':'signal-miss'):result.command==='step'?'signal-step':'open');
    else this.sink.play(kind==='reactor'||kind==='facility'?'switch':kind==='repair'?'drone':kind==='transit'?'ride':kind);
  }
  update(dt:number,s:SoundFrame) {
    const previous=this.last;this.cooldown=Math.max(0,this.cooldown-dt);this.collisionCooldown=Math.max(0,this.collisionCooldown-dt);
    const changed=!previous||previous.mode!==s.mode||previous.driving!==s.driving;
    const travelled=changed?0:Math.hypot(s.x-previous.x,s.z-previous.z);
    if(s.mode==='intro'&&!s.paused) {
      this.walked=0;this.sink.beginFrame();const time=s.progress??0;
      if(s.building&&time>.48&&time<7.7) {
        const fade=Math.min(1,(time-.48)/.3,(7.7-time)/.7),phase=Math.min(1,time/6.5);
        this.sink.loop('build',(.13+phase*.06)*Math.max(0,fade),.8+phase*.35);
      }
      this.sink.endFrame();this.last={...s};return;
    }
    if(changed||s.paused||travelled>3){this.walked=0;this.last={...s};this.sink.quiet();return;}
    if(!s.driving&&(s.mode==='town'||s.mode==='observatory')) {
      if(s.airborne&&!previous?.airborne&&(s.verticalSpeed??0)>0)this.sink.play('jump',{volume:.1});
      if(!s.airborne&&previous?.airborne){this.sink.play('land',{volume:.1});this.walked=0;}
      if(!s.airborne&&travelled>.001) {
        this.walked+=travelled;const stride=s.running?2.3:1.7;
        if(this.walked>=stride&&this.cooldown===0){this.sink.play(s.running?'runstep':'footstep',{volume:s.running?.075:.085});this.walked%=stride;this.cooldown=.13;}
      } else if(s.airborne)this.walked=0;
    }
    this.sink.beginFrame();
    if(s.driving) {
      const speed=Math.abs(s.vehicleSpeed??0),previousSpeed=previous?.vehicleSpeed??0,throttle=s.vehicleThrottle??0;
      this.sink.loop('motor',Math.min(.2,.085+speed*.006),.8+speed*.05);
      if(speed>.15)this.sink.loop('tires',Math.min(.065,speed*.003),.65+speed*.04);
      if(Math.abs(previousSpeed)>4.5&&throttle*previousSpeed<0&&previous?.vehicleThrottle!==throttle)this.sink.play('brake',{volume:.28});
      if(Math.abs(previousSpeed)>3&&speed<Math.abs(previousSpeed)*.75&&travelled<speed*dt*.45&&this.collisionCooldown===0){this.sink.play('impact',{volume:.7});this.collisionCooldown=.5;}
    } else if(s.mode==='space'){this.sink.loop('motor',travelled>.001?.065:.035,travelled>.001?1.4:.85);this.sink.loop('air',.009);}
    else if(s.mode==='launch')this.sink.loop('launch',.035+Math.min(1,(s.progress??0)/4)*.07,.8+Math.min(1,(s.progress??0)/5)*.65);
    else if(s.mode==='gate')this.sink.loop('core',.045,1.4);
    else if(s.mode==='transit')this.sink.loop('rail',.11,1.15);
    else if(s.mode==='observatory')this.sink.loop('air',.008);
    if(s.mode==='town') {
      for(const [kind,active] of [['core',s.cooling],['drone',s.drone],['cargo',s.cargo]] as const)if(active&&this.sources[kind])this.near(kind,s,this.sources[kind]!,kind==='drone'?.045:.03);
      if(s.train) {
        this.near('rail',s,s.train,.12,42);
        const distance=Math.hypot(s.x-s.train.x,s.z-s.train.z);
        if(distance<18&&!this.trainNearby&&previous?.train&&Math.hypot(s.train.x-previous.train.x,s.train.z-previous.train.z)>.001) {
          this.sink.play('train-bell',{volume:.2*distanceGain(s,s.train,42)});this.trainNearby=true;
        }
        if(distance>30)this.trainNearby=false;
      } else this.trainNearby=false;
      if(s.overview)this.sink.loop('launch',.012,.8);
      else if(s.boosters?.length){const source=s.boosters.reduce((a,b)=>distanceGain(s,a)>distanceGain(s,b)?a:b);this.near('launch',s,source,.025);}
    }
    this.sink.endFrame();this.last={...s};
  }
  private near(kind:LoopKind,s:SoundFrame,p:Point,level:number,radius=24) {
    const amount=distanceGain(s,p,radius);if(amount<.005)return;
    const dx=p.x-s.x,dz=p.z-s.z,yaw=s.yaw??0,pan=(dx*Math.cos(yaw)-dz*Math.sin(yaw))/Math.max(1,Math.hypot(dx,dz));
    this.sink.loop(kind,level*amount,1,pan*.75);
  }
}
