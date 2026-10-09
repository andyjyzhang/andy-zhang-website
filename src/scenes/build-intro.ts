import * as T from 'three';
import { libraryPart } from '../world/part-library';
import {BrickBatch} from '../world/brick-kit';
import {LDRAW_SCALE,PLATE as H} from '../world/part-catalog';
import {PieceAssembly} from './piece-assembly';
import {buildCamera,buildStageTiming,BUILD_DURATION,BUILD_ARRIVAL,BUILD_LANDING} from './build-timeline';

const VISITED_KEY='andys-world-visited-v3';
export function hasVisited(){try{return localStorage.getItem(VISITED_KEY)==='yes';}catch{return false;}}
export type BuildCue='start'|'snap'|'reveal'|'land'|'finish'|'skip';
interface BuildHooks {cue?:(event:BuildCue)=>void;toggleSound?:()=>void}
export class BuildIntro {
  readonly brick=new T.Group();readonly overlay=document.createElement('section');
  active=false;building=false;
  get buildTime(){return this.elapsed;}
  private elapsed=0;private second=new T.Group();private cluster=new T.Group();
  private nextSnap=0;private secondSnapped=false;private revealed=false;private landed=false;
  private lookTarget=new T.Vector3();private arrival:T.Object3D|undefined;
  private assemblies:PieceAssembly[];private extras:{object:T.Object3D;visible:boolean}[];
  private ray=new T.Raycaster();private pointer=new T.Vector2();
  constructor(world:T.Group,stages:T.Group[],parent:HTMLElement,scene:T.Scene,private camera:T.PerspectiveCamera,private complete:()=>void,private hooks:BuildHooks={}) {
    const first=libraryPart('brick','#f2cd37');first.scale.setScalar(LDRAW_SCALE);first.rotation.x=Math.PI;first.position.y=3*H;this.brick.add(first);
    const second=libraryPart('brick','#0a3463');second.scale.setScalar(LDRAW_SCALE);second.rotation.x=Math.PI;second.position.y=6*H;this.second.add(second);this.brick.add(this.second);
    const pieces=new BrickBatch();
    for(let row=0;row<3;row++)for(const side of [-1,1])pieces.stack(row%2?'#0a3463':'#f2cd37',side*2.56,row*3*H,-row*.64,4,3,2,'stud');
    pieces.build(this.cluster);scene.add(this.brick,this.cluster);this.brick.visible=this.cluster.visible=false;
    this.overlay.className='intro-overlay';this.overlay.setAttribute('aria-label','Build Andy’s World');this.overlay.hidden=true;
    this.overlay.innerHTML='<p class="intro-eyebrow">EVERY GOOD IDEA STARTS SOMEWHERE.</p><button class="build-button"><span>BUILD ANDY’S WORLD</span><small>Click the brick. Build a whole world. <i aria-hidden="true">↗</i></small></button><div class="intro-reveal-label" role="status"><strong>ANDY’S WORLD</strong><span>WASD to explore</span></div><button class="button intro-sound" aria-label="Mute sound" aria-pressed="true">♪ Sound</button><button class="skip-intro">Skip the build →</button>';
    parent.append(this.overlay);this.overlay.querySelector('.build-button')!.addEventListener('click',()=>this.start());this.overlay.querySelector('.skip-intro')!.addEventListener('click',()=>this.finish());
    this.overlay.querySelector('.intro-sound')!.addEventListener('click',()=>this.hooks.toggleSound?.());
    this.extras=world.children.filter(child=>!stages.includes(child as T.Group)).map(object=>({object,visible:object.visible}));
    this.arrival=this.extras.find(e=>e.object.name==='Andy')?.object;
    this.assemblies=stages.map((stage,i)=>{const {start,duration}=buildStageTiming(i);return new PieceAssembly(stage,start,duration);});
  }
  setSound(enabled:boolean){const b=this.overlay.querySelector<HTMLButtonElement>('.intro-sound')!;b.setAttribute('aria-label',enabled?'Mute sound':'Unmute sound');b.setAttribute('aria-pressed',String(enabled));b.textContent=enabled?'♪ Sound':'♪ Muted';}
  show(reducedMotion:boolean) {
    if(reducedMotion){this.finish();return;}
    this.active=true;this.building=false;this.elapsed=0;this.brick.visible=true;this.second.visible=this.cluster.visible=false;this.brick.rotation.set(0,0,0);
    this.overlay.hidden=false;this.overlay.classList.remove('is-building','is-ready');
    this.nextSnap=0;this.secondSnapped=this.revealed=this.landed=false;
    this.assemblies.forEach(a=>a.hide());this.extras.forEach(({object})=>object.visible=false);
    this.camera.position.set(5.5,4.8,7.5);this.camera.lookAt(0,.768,0);
    document.documentElement.dataset.intro='true';this.overlay.querySelector<HTMLButtonElement>('.build-button')!.focus({preventScroll:true});
  }
  start(){if(!this.active||this.building)return;this.building=true;this.elapsed=0;this.overlay.classList.add('is-building');this.hooks.cue?.('start');}
  click(event:PointerEvent,canvas:HTMLCanvasElement) {
    if(!this.active||this.building)return;const bounds=canvas.getBoundingClientRect();this.pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
    this.ray.setFromCamera(this.pointer,this.camera);if(this.ray.intersectObject(this.brick,true).length)this.start();
  }
  update(dt:number) {
    if(!this.active)return;if(!this.building){this.brick.rotation.y+=dt*.14;return;}
    this.elapsed+=dt;const t=this.elapsed;this.second.visible=t>.08;this.second.position.y=3*(1-Math.min(1,t/.45))**3;
    if(t>=.45&&!this.secondSnapped){this.secondSnapped=true;this.hooks.cue?.('snap');}
    this.cluster.visible=t>.58&&t<2.35;this.cluster.position.y=Math.max(0,1.2*(1-Math.min(1,(t-.58)/.22))**3);
    this.brick.visible=t<2.35;
    let snaps=0;for(const assembly of this.assemblies)snaps+=assembly.update(t);
    if(snaps&&t>=this.nextSnap&&t<7.7){this.hooks.cue?.('snap');this.nextSnap=t+.075;}
    buildCamera(t,this.camera.position,this.lookTarget,this.camera.aspect);this.camera.lookAt(this.lookTarget);
    if(t>=7.65)this.extras.forEach(({object,visible})=>{if(object!==this.arrival)object.visible=visible;});
    if(t>=7.8&&!this.revealed){this.revealed=true;this.overlay.classList.add('is-ready');this.hooks.cue?.('reveal');}
    if(t>=BUILD_ARRIVAL&&this.arrival){this.arrival.visible=true;this.arrival.position.set(0,.512+4.2*(1-T.MathUtils.smootherstep(t,BUILD_ARRIVAL,BUILD_LANDING)),10);this.arrival.rotation.y=Math.PI;}
    if(t>=BUILD_LANDING&&!this.landed){this.landed=true;this.hooks.cue?.('land');}
    if(t>=BUILD_DURATION)this.finish(true);
  }
  finish(assembled=false) {
    const wasActive=this.active;if(wasActive)this.hooks.cue?.(assembled?'finish':'skip');
    this.active=this.building=false;this.brick.visible=this.cluster.visible=false;this.overlay.hidden=true;this.assemblies.forEach(a=>a.restore());this.extras.forEach(({object,visible})=>object.visible=visible);
    document.documentElement.dataset.intro='false';try{localStorage.setItem(VISITED_KEY,'yes');}catch{/* Still usable without persistence. */}this.complete();
  }
}
