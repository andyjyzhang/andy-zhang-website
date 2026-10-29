import {SalvageRun,FLIGHT_DOCK,flightDistance,type FlightPoint} from '../interactions/flight-game';
import {FLIGHT_LEVELS,FLIGHT_CAPACITY} from '../config/flight-levels';

type HoldControl='boost'|'fire'|'up'|'down';
export class FlightHUD {
  readonly root=document.createElement('section');
  onReset:(()=>void)|null=null;onReturn:(()=>void)|null=null;
  private pointers=new Map<number,HoldControl>();private keys=new Set<HoldControl>();
  private shownPhase='';private lastEvent='';
  private readonly elements=new Map<string,Element>();
  private panelBounds:DOMRect[]=[];private observer:ResizeObserver|null=null;
  private readonly measurePanels=()=>{this.panelBounds=['.flight-hud','.flight-radar'].map(selector=>this.element(selector).getBoundingClientRect());};
  private element<E extends Element=HTMLElement>(selector:string):E {
    let node=this.elements.get(selector);if(!node){node=this.root.querySelector(selector)!;this.elements.set(selector,node);}return node as E;
  }
  private attribute(node:Element,name:string,value:string){if(node.getAttribute(name)!==value)node.setAttribute(name,value);}
  private display(node:SVGElement,hidden:boolean){const value=hidden?'none':'';if(node.style.display!==value)node.style.display=value;}
  private readonly onBlur=()=>this.release();
  private readonly onVisibility=()=>{if(document.hidden)this.release();};
  held(control:HoldControl){if(this.keys.has(control))return true;for(const value of this.pointers.values())if(value===control)return true;return false;}

  constructor(parent:HTMLElement,private game:SalvageRun,private previewLevels=false){
    this.root.className=`flight-overlay${parent.querySelector('.has-dev-gallery')?' has-dev-rail':''}`;
    this.root.setAttribute('aria-label','Salvage Run flight game');
    this.root.innerHTML=`
      <aside class="flight-hud"><div class="flight-heading"><span>salvage run</span><b data-flight-mission></b></div><strong class="flight-level-name" data-flight-level-name></strong>
        <p class="flight-objective" data-flight-objective></p><p class="flight-progress" data-flight-progress></p>
        <div class="flight-stats"><span>time<b data-flight-time></b></span><span>shields<b data-flight-shields></b></span><span>score<b data-flight-score></b></span><span>altitude<b data-flight-altitude></b></span></div>
        <div class="flight-meters"><label>boost <meter data-flight-charge min="0" max="1" value="1" aria-label="Boost charge"></meter></label><label>heat <meter data-flight-heat min="0" max="1" value="0" aria-label="Blaster heat"></meter></label></div><p class="flight-event" data-flight-event role="status"></p>
      </aside>
      <aside class="flight-radar" aria-label="Level radar"><span>flight map</span><svg viewBox="0 0 120 104" role="img" aria-label="Your ship, objective targets and green extraction dock"><rect x="1" y="1" width="118" height="102" fill="#101f2b" stroke="#526775"/><rect x="56" y="84" width="8" height="8" fill="#a3edcb"/>
        ${Array.from({length:FLIGHT_CAPACITY.debris},(_,i)=>`<circle data-radar-rock="${i}" r="1.8" fill="#7a858d"/>`).join('')}
        ${Array.from({length:FLIGHT_CAPACITY.cargo},(_,i)=>`<rect data-radar-cargo="${i}" width="4" height="4" fill="#efbd76"/>`).join('')}
        ${Array.from({length:FLIGHT_CAPACITY.enemies},(_,i)=>`<circle data-radar-enemy="${i}" r="3" fill="#fa817b"/>`).join('')}
        ${Array.from({length:FLIGHT_CAPACITY.gates},(_,i)=>`<circle data-radar-gate="${i}" r="3.5" stroke="#9bdde7" fill="none"/>`).join('')}
        ${Array.from({length:FLIGHT_CAPACITY.relays},(_,i)=>`<rect data-radar-relay="${i}" width="4" height="4" fill="#9bdde7"/>`).join('')}
        <circle data-radar-convoy r="4" fill="#5a93db" stroke="#f5f2e9"/><circle data-radar-core r="4" fill="#fe8a18"/><circle data-radar-player r="3" fill="#fff6df"/>
      </svg><small data-radar-legend></small></aside>
      <div class="flight-reticle" aria-hidden="true"><i></i><span data-flight-weapon>blasters ready</span></div>
      <div class="flight-target" data-flight-target aria-hidden="true" hidden></div><div class="flight-briefing" data-flight-briefing></div>
      <div class="flight-tools"><button data-flight-action="restart">retry level <kbd>R</kbd></button><button data-flight-hold="up" aria-label="Hold to ascend">rise <kbd>E</kbd></button><button data-flight-hold="down" aria-label="Hold to descend">descend <kbd>Q</kbd></button><button data-flight-hold="boost" aria-label="Hold to boost">boost <kbd>shift</kbd></button><button class="flight-fire" data-flight-hold="fire" aria-label="Hold to fire blasters">fire <kbd>space</kbd></button></div>`;
    parent.append(this.root);window.addEventListener('blur',this.onBlur);document.addEventListener('visibilitychange',this.onVisibility);
    this.root.addEventListener('click',event=>{
      const button=(event.target as HTMLElement).closest<HTMLElement>('button');if(!button)return;
      if(button.hasAttribute('data-flight-exit')){this.onReturn?.();return;}
      const preview=button.dataset.flightLevel,action=button.dataset.flightAction;
      if(preview&&this.previewLevels)game.restart(Number(preview));
      else if(action==='start')game.start();else if(action==='next')game.next();else if(action==='campaign')game.restart();else if(action==='restart')game.retry();else return;
      this.onReset?.();this.release();this.refresh();
      if(game.phase==='playing')document.querySelector<HTMLCanvasElement>('canvas[role="application"]')?.focus({preventScroll:true});else this.focusPrimaryAction();
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-flight-hold]').forEach(button=>{
      const control=button.dataset.flightHold as HoldControl;
      button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,control);button.classList.add('is-held');});
      const release=(event:PointerEvent)=>{this.pointers.delete(event.pointerId);if(!this.held(control))button.classList.remove('is-held');};
      button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
      button.addEventListener('keydown',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();this.keys.add(control);button.classList.add('is-held');}});
      button.addEventListener('keyup',event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();this.keys.delete(control);button.classList.remove('is-held');}});
      button.addEventListener('blur',()=>{this.keys.delete(control);button.classList.remove('is-held');});
    });
    this.refresh();this.measurePanels();window.addEventListener('resize',this.measurePanels);
    if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(this.measurePanels);this.observer.observe(this.element('.flight-hud'));this.observer.observe(this.element('.flight-radar'));}
  }
  release(){if(!this.pointers.size&&!this.keys.size)return;this.pointers.clear();this.keys.clear();this.root.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));}
  focusPrimaryAction(){this.element('[data-flight-briefing]').querySelector<HTMLButtonElement>(':scope > [data-flight-action]')?.focus({preventScroll:true});}
  targetLabel(x:number,y:number,visible:boolean){
    const marker=this.element('[data-flight-target]'),hidden=!visible||this.game.phase!=='playing';if(marker.hidden!==hidden)marker.hidden=hidden;if(hidden)return;
    const screenX=Math.max(58,Math.min(innerWidth-58,x*innerWidth/100));let screenY=Math.max(23,Math.min(78,y))*innerHeight/100;
    for(const panel of this.panelBounds)if(screenX>panel.left-40&&screenX<panel.right+40&&screenY<panel.bottom+15&&screenY>panel.top-15)screenY=panel.bottom+20;
    const left=`${Math.round(screenX)}px`,top=`${Math.round(screenY)}px`;if(marker.style.left!==left)marker.style.left=left;if(marker.style.top!==top)marker.style.top=top;
    marker.classList.toggle('is-hostile',['patrol','relay','core'].includes(this.game.targetKind));
    const label=`${this.game.targetLabel} / ${Math.round(this.game.target.y)}m`;if(marker.textContent!==label)marker.textContent=label;
  }
  refresh(){
    const g=this.game;
    for(const [key,value]of Object.entries({phase:g.phase,mission:String(g.mission),kind:g.level.kind,x:g.position.x.toFixed(2),y:g.position.y.toFixed(2),z:g.position.z.toFixed(2),shots:String(g.shotsFired),kills:String(g.kills),gates:String(g.gateIndex),relays:String(g.relaysCleared),convoyHull:String(g.convoy?.hp??''),coreHull:String(g.core?.hp??'')}))this.attribute(this.root,`data-${key}`,value);
    const text=(selector:string,value:string)=>{const element=this.element(selector);if(element.textContent!==value)element.textContent=value;};
    const target=g.target,height=Math.round(target.y-g.position.y);
    text('[data-flight-mission]',`level ${g.mission} / ${g.totalLevels}`);text('[data-flight-level-name]',g.level.name);
    text('[data-flight-time]',`${Math.ceil(g.timeLeft)}s`);text('[data-flight-shields]',`${g.shields} / 3`);text('[data-flight-score]',String(g.score));text('[data-flight-altitude]',`${Math.round(g.position.y)}m`);
    text('[data-flight-objective]',`${g.instruction} · ${Math.round(flightDistance(target,g.position))}m${Math.abs(height)>3?` · ${height>0?'rise':'descend'} ${Math.abs(height)}m`:''}`);text('[data-flight-progress]',g.progress);
    for(const [selector,value]of [['charge',g.boost],['heat',g.heat]] as const){const meter=this.element<HTMLMeterElement>(`[data-flight-${selector}]`);if(meter.value!==value)meter.value=value;}
    this.attribute(this.root,'data-overheated',String(g.overheated));text('[data-flight-weapon]',g.overheated?'cooling blasters':'blasters ready');
    if(this.lastEvent!==g.lastEvent){text('[data-flight-event]',g.lastEvent);this.lastEvent=g.lastEvent;}
    const radar=(selector:string,p:FlightPoint,rect=false)=>{const element=this.element(selector);this.attribute(element,rect?'x':'cx',(p.x+60).toFixed(1));this.attribute(element,rect?'y':'cy',(p.z+56).toFixed(1));};
    radar('[data-radar-player]',g.position);
    for(let i=0;i<FLIGHT_CAPACITY.cargo;i++){
      const pod=g.cargo[i],selector=`[data-radar-cargo="${i}"]`,element=this.element<SVGElement>(selector);this.display(element,!pod||pod.collected);
      if(pod){radar(selector,pod,true);this.attribute(element,'data-y',String(pod.y));this.attribute(element,'data-locked',String(g.locked(pod)));}
    }
    for(let i=0;i<FLIGHT_CAPACITY.enemies;i++){
      const enemy=g.enemies[i],selector=`[data-radar-enemy="${i}"]`,element=this.element<SVGElement>(selector);this.display(element,!enemy||enemy.hp<=0||!enemy.active);
      if(enemy){radar(selector,enemy);this.attribute(element,'data-y',String(enemy.y));this.attribute(element,'data-hp',String(enemy.hp));}
    }
    const hazards=g.hazards;
    for(let i=0;i<FLIGHT_CAPACITY.debris;i++){const element=this.element<SVGElement>(`[data-radar-rock="${i}"]`);this.display(element,i>=hazards.length);if(hazards[i]){radar(`[data-radar-rock="${i}"]`,hazards[i]);this.attribute(element,'data-y',String(hazards[i].y));}}
    for(let i=0;i<FLIGHT_CAPACITY.gates;i++){
      const gate=g.level.gates[i],selector=`[data-radar-gate="${i}"]`,element=this.element<SVGElement>(selector);this.display(element,!gate||i<g.gateIndex);
      if(gate){radar(selector,gate);this.attribute(element,'stroke',i===g.gateIndex?'#9bdde7':'#7a858d');}
    }
    for(let i=0;i<FLIGHT_CAPACITY.relays;i++){
      const relay=g.relays[i],selector=`[data-radar-relay="${i}"]`,element=this.element<SVGElement>(selector);this.display(element,!relay||relay.hp<=0);if(relay)radar(selector,relay,true);
    }
    for(const [selector,point]of [['[data-radar-convoy]',g.convoy],['[data-radar-core]',g.core]] as const){const element=this.element<SVGElement>(selector);this.display(element,!point||point.hp<=0);if(point)radar(selector,point);}
    const legends={salvage:'Red patrols · amber cargo',course:'Blue active gate · gray pending gates',relay:'Blue relays · amber flight recorder',escort:'Blue shuttle · red interceptors',assault:'Blue generators · orange core · red guns'};
    text('[data-radar-legend]',legends[g.level.kind]);
    const stateKey=`${g.phase}:${g.mission}`;if(this.shownPhase===stateKey)return;this.shownPhase=stateKey;
    const briefing=this.element('[data-flight-briefing]');briefing.hidden=g.phase==='playing';if(g.phase==='playing')return;
    const title=g.phase==='briefing'?g.level.name:g.phase==='delivered'?`${g.level.name} complete`:g.phase==='won'?'All five levels cleared':'Run interrupted';
    const description=g.phase==='briefing'?g.level.description:g.lastEvent;
    const action=g.phase==='briefing'?'start':g.phase==='delivered'?'next':g.phase==='won'?'campaign':'restart';
    const label=g.phase==='briefing'?'Launch level':g.phase==='delivered'?`Next: ${FLIGHT_LEVELS[g.mission].name}`:g.phase==='won'?'Fly again':'Retry this level';
    const manifest={salvage:[3,'Cargo pods'],course:[6,'Flight gates'],relay:[3,'Power relays'],escort:[8,'Shuttle hull'],assault:[2,'Shield generators']}[g.level.kind];
    briefing.setAttribute('role','region');briefing.setAttribute('aria-labelledby','flight-briefing-title');
    briefing.innerHTML=`<button class="flight-close" data-flight-exit aria-label="Return to the station">&times;</button><div class="mission-copy"><span class="mission-location">Salvage Run / level ${g.mission} of ${g.totalLevels}</span><h1 id="flight-briefing-title">${title}</h1><p>${description}</p>
      ${g.phase==='briefing'?`<div class="mission-manifest"><div><b>${manifest[0]}</b><span>${manifest[1]}</span></div><div><b>${g.level.timeLimit}<span>s</span></b><span>Flight window</span></div><div><b>3</b><span>Shields</span></div></div><ol class="mission-route">${g.level.steps.map(step=>`<li>${step}</li>`).join('')}</ol>`:`<div class="mission-result"><div><b>${g.score}</b><span>Points banked</span></div><div><b>${g.kills}</b><span>Patrols disabled</span></div></div>`}
      <div class="flight-instructions"><p><kbd>WASD</kbd> Fly <kbd>E</kbd> Rise <kbd>Q</kbd> Descend</p><p><kbd>Space</kbd> Fire <kbd>Shift</kbd> Boost</p><small>Right-hold, drag or use arrows to aim at the centre crosshair.<br>Scroll in for cockpit view. Extract at the green dock, ${FLIGHT_DOCK.y}m high.<br><kbd>R</kbd> Retry this level · <kbd>Esc</kbd> Return to the station</small></div>
      ${g.mission>1&&g.phase!=='won'?'<button class="flight-campaign-reset" data-flight-action="campaign">Start the campaign over</button>':''}
      ${this.previewLevels?`<nav class="flight-level-preview" aria-label="Preview flight levels">${FLIGHT_LEVELS.map((level,i)=>`<button data-flight-level="${i+1}" aria-label="Preview level ${i+1}: ${level.name}" aria-pressed="${g.mission===i+1}">${i+1}</button>`).join('')}</nav>`:''}
      </div><button data-flight-action="${action}">${label}<span aria-hidden="true">↗</span></button>`;
    this.focusPrimaryAction();
  }
  dispose(){this.observer?.disconnect();window.removeEventListener('resize',this.measurePanels);window.removeEventListener('blur',this.onBlur);document.removeEventListener('visibilitychange',this.onVisibility);this.release();this.root.remove();}
}
