import {SalvageRun,FLIGHT_DOCK,flightDistance,type FlightPoint} from '../interactions/flight-game';

type HoldControl='boost'|'fire'|'up'|'down';
export class FlightHUD {
  readonly root=document.createElement('section');
  onReset:(()=>void)|null=null;
  onReturn:(()=>void)|null=null;
  private pointers=new Map<number,HoldControl>();private keys=new Set<HoldControl>();
  private shownPhase='';private lastEvent='';
  private readonly elements=new Map<string,Element>();
  private panelBounds:DOMRect[]=[];private observer:ResizeObserver|null=null;
  private readonly measurePanels=()=>{this.panelBounds=['.flight-hud','.flight-radar'].map(selector=>this.element(selector).getBoundingClientRect());};
  private element<E extends Element=HTMLElement>(selector:string):E {
    let node=this.elements.get(selector);
    if(!node){node=this.root.querySelector(selector)!;this.elements.set(selector,node);}
    return node as E;
  }
  private attribute(node:Element,name:string,value:string){if(node.getAttribute(name)!==value)node.setAttribute(name,value);}
  private display(node:SVGElement,hidden:boolean){const value=hidden?'none':'';if(node.style.display!==value)node.style.display=value;}

  private readonly onBlur=()=>this.release();
  private readonly onVisibility=()=>{if(document.hidden)this.release();};
  held(control:HoldControl){if(this.keys.has(control))return true;for(const value of this.pointers.values())if(value===control)return true;return false;}
  constructor(parent:HTMLElement,private game:SalvageRun){
    this.root.className=`flight-overlay${parent.querySelector('.has-dev-gallery')?' has-dev-rail':''}`;
    this.root.setAttribute('aria-label','Salvage Run flight game');
    this.root.innerHTML=`<aside class="flight-hud"><div class="flight-heading"><span>salvage run</span><b data-flight-mission></b></div><p class="flight-objective" data-flight-objective></p><div class="flight-stats"><span>time<b data-flight-time></b></span><span>shields<b data-flight-shields></b></span><span>score<b data-flight-score></b></span><span>altitude<b data-flight-altitude></b></span></div><div class="flight-meters"><label>boost <meter data-flight-charge min="0" max="1" value="1" aria-label="Boost charge"></meter></label><label>heat <meter data-flight-heat min="0" max="1" value="0" aria-label="Blaster heat"></meter></label></div><p class="flight-event" data-flight-event role="status"></p></aside><aside class="flight-radar" aria-label="Sector radar"><span>sector map</span><svg viewBox="0 0 120 104" role="img" aria-label="Your ship, patrols, cargo, debris and green delivery dock"><rect x="1" y="1" width="118" height="102" fill="#101f2b" stroke="#526775"/><rect x="56" y="84" width="8" height="8" fill="#a3edcb"/>${Array.from({length:10},(_,i)=>`<circle data-radar-rock="${i}" r="1.8" fill="#7a858d"/>`).join('')}${Array.from({length:3},(_,i)=>`<rect data-radar-cargo="${i}" width="4" height="4" fill="#efbd76"/><circle data-radar-enemy="${i}" r="3" fill="#fa817b"/>`).join('')}<circle data-radar-player r="3" fill="#fff6df"/></svg><small>red patrol · amber cargo</small></aside><div class="flight-reticle" aria-hidden="true"><i></i><span data-flight-weapon>blasters ready</span></div><div class="flight-target" data-flight-target aria-hidden="true"></div><div class="flight-briefing" data-flight-briefing></div><div class="flight-tools"><button data-flight-action="restart">restart <kbd>R</kbd></button><button data-flight-hold="up" aria-label="Hold to ascend">rise <kbd>E</kbd></button><button data-flight-hold="down" aria-label="Hold to descend">descend <kbd>Q</kbd></button><button data-flight-hold="boost" data-flight-boost aria-label="Hold to boost">boost <kbd>shift</kbd></button><button class="flight-fire" data-flight-hold="fire" aria-label="Hold to fire blasters">fire <kbd>space</kbd></button></div>`;
    parent.append(this.root);window.addEventListener('blur',this.onBlur);document.addEventListener('visibilitychange',this.onVisibility);
    this.root.addEventListener('click',event=>{
      if((event.target as HTMLElement).closest('[data-flight-exit]')){this.onReturn?.();return;}
      const action=(event.target as HTMLElement).closest<HTMLElement>('[data-flight-action]')?.dataset.flightAction;if(!action)return;
      if(action==='start')game.start();else if(action==='next')game.next();else game.restart();
      this.onReset?.();
      this.release();this.refresh();
      if(game.phase==='playing')document.querySelector<HTMLCanvasElement>('canvas[role="application"]')?.focus({preventScroll:true});
      else this.focusPrimaryAction();
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
    this.refresh();this.measurePanels();
    window.addEventListener('resize',this.measurePanels);
    if(typeof ResizeObserver!=='undefined'){
      this.observer=new ResizeObserver(this.measurePanels);
      this.observer.observe(this.element('.flight-hud'));this.observer.observe(this.element('.flight-radar'));
    }
  }
  release(){if(!this.pointers.size&&!this.keys.size)return;this.pointers.clear();this.keys.clear();this.root.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));}
  focusPrimaryAction(){this.element('[data-flight-briefing]').querySelector<HTMLButtonElement>('[data-flight-action]')?.focus({preventScroll:true});}
  targetLabel(x:number,y:number,visible:boolean){
    const marker=this.element('[data-flight-target]'),hidden=!visible||this.game.phase!=='playing';
    if(marker.hidden!==hidden)marker.hidden=hidden;if(hidden)return;
    const screenX=Math.max(58,Math.min(innerWidth-58,x*innerWidth/100));let screenY=Math.max(23,Math.min(78,y))*innerHeight/100;
    // Bounds are measured only when layout changes, never after HUD frame writes.
    for(const panel of this.panelBounds){
      if(screenX>panel.left-40&&screenX<panel.right+40&&screenY<panel.bottom+15&&screenY>panel.top-15)screenY=panel.bottom+20;
    }
    const left=`${Math.round(screenX)}px`,top=`${Math.round(screenY)}px`;
    if(marker.style.left!==left)marker.style.left=left;if(marker.style.top!==top)marker.style.top=top;
    const target=this.game.target,locked='guard' in target&&this.game.locked(target);
    marker.classList.toggle('is-hostile',locked);
    const label=`${locked?'patrol':this.game.carryingAll?'dock':'cargo'} / ${Math.round(target.y)}m`;
    if(marker.textContent!==label)marker.textContent=label;
  }
  refresh(){
    const g=this.game;
    for(const [key,value] of Object.entries({phase:g.phase,mission:String(g.mission),x:g.position.x.toFixed(2),y:g.position.y.toFixed(2),z:g.position.z.toFixed(2),shots:String(g.shotsFired),kills:String(g.kills)}))this.attribute(this.root,`data-${key}`,value);
    const text=(selector:string,value:string)=>{const el=this.element(selector);if(el.textContent!==value)el.textContent=value;};
    const target=g.target,locked='guard' in target&&g.locked(target),height=Math.round(target.y-g.position.y);
    text('[data-flight-mission]',`sector ${g.mission} / 3`);text('[data-flight-time]',`${Math.ceil(g.timeLeft)}s`);text('[data-flight-shields]',`${g.shields} / 3`);text('[data-flight-score]',String(g.score));text('[data-flight-altitude]',`${Math.round(g.position.y)}m`);
    text('[data-flight-objective]',`${g.carryingAll?'return to dock':locked?'disable the cargo patrol':`recover cargo · ${g.collected} / 3`} · ${Math.round(flightDistance(target,g.position))}m${Math.abs(height)>3?` · ${height>0?'rise':'descend'} ${Math.abs(height)}m`:''}`);
    for(const [selector,value] of [['charge',g.boost],['heat',g.heat]] as const){const meter=this.element<HTMLMeterElement>(`[data-flight-${selector}]`);if(meter.value!==value)meter.value=value;}
    this.attribute(this.root,'data-overheated',String(g.overheated));text('[data-flight-weapon]',g.overheated?'cooling blasters':'blasters ready');
    if(this.lastEvent!==g.lastEvent){text('[data-flight-event]',g.lastEvent);this.lastEvent=g.lastEvent;}
    const radar=(selector:string,p:FlightPoint,rect=false)=>{const el=this.element(selector);this.attribute(el,rect?'x':'cx',(p.x+60).toFixed(1));this.attribute(el,rect?'y':'cy',(p.z+56).toFixed(1));};
    radar('[data-radar-player]',g.position);
    g.cargo.forEach((pod,i)=>{
      radar(`[data-radar-cargo="${i}"]`,pod,true);const el=this.element<SVGElement>(`[data-radar-cargo="${i}"]`)!;this.display(el,pod.collected);this.attribute(el,'data-y',String(pod.y));this.attribute(el,'data-locked',String(g.locked(pod)));
      const enemy=g.enemies[i],marker=this.element<SVGElement>(`[data-radar-enemy="${i}"]`)!;radar(`[data-radar-enemy="${i}"]`,enemy);this.display(marker,!enemy.hp);this.attribute(marker,'data-y',String(enemy.y));this.attribute(marker,'data-hp',String(enemy.hp));
    });
    const hazards=g.hazards;for(let i=0;i<10;i++){const el=this.element<SVGElement>(`[data-radar-rock="${i}"]`)!;this.display(el,i>=hazards.length);if(hazards[i]){radar(`[data-radar-rock="${i}"]`,hazards[i]);this.attribute(el,'data-y',String(hazards[i].y));}}
    const stateKey=`${g.phase}:${g.mission}`;if(this.shownPhase===stateKey)return;this.shownPhase=stateKey;
    const briefing=this.element('[data-flight-briefing]');briefing.hidden=g.phase==='playing';if(g.phase==='playing')return;
    const title=g.phase==='briefing'?['Cold orbit','Broken convoy','Last light'][g.mission-1]:g.phase==='delivered'?'Cargo secured':g.phase==='won'?'All sectors cleared':'Run interrupted';
    const description=g.phase==='briefing'?'Patrol drones guard three salvage pods. Disable them, match each pod’s altitude, and bring the cargo home. Clear debris with your blasters. 120 seconds. Three shields.':g.lastEvent;
    const action=g.phase==='briefing'?'start':g.phase==='delivered'?'next':'restart',label=g.phase==='briefing'?'Launch mission':g.phase==='delivered'?'Next sector':'Fly again';
    briefing.setAttribute('role','region');briefing.setAttribute('aria-labelledby','flight-briefing-title');
    briefing.innerHTML=`<button class="flight-close" data-flight-exit aria-label="Return to the station">&times;</button><div class="mission-copy"><span class="mission-location">Salvage Run / sector ${g.mission} of 3</span><h1 id="flight-briefing-title">${title}</h1><p>${description}</p>${g.phase==='briefing'?`<div class="mission-manifest"><div><b>03</b><span>Cargo pods</span></div><div><b>120<span>s</span></b><span>Flight window</span></div><div><b>03</b><span>Shields</span></div></div><ol class="mission-route"><li>Disable patrols</li><li>Recover cargo</li><li>Return to dock</li></ol>`:`<div class="mission-result"><div><b>${g.score}</b><span>Points banked</span></div><div><b>${g.kills}</b><span>Patrols disabled</span></div></div>`}<div class="flight-instructions"><p><kbd>WASD</kbd> Fly <kbd>E</kbd> Rise <kbd>Q</kbd> Descend</p><p><kbd>Space</kbd> Fire <kbd>Shift</kbd> Boost</p><small>Drag or use arrows to aim at the centre crosshair.<br>Scroll in for cockpit view. Land at the green dock, ${FLIGHT_DOCK.y}m high.<br><kbd>R</kbd> Restart · <kbd>Esc</kbd> Return to the station</small></div></div><button data-flight-action="${action}">${label} <span aria-hidden="true">↗</span></button>`;
    this.focusPrimaryAction();
  }
  dispose(){this.observer?.disconnect();window.removeEventListener('resize',this.measurePanels);window.removeEventListener('blur',this.onBlur);document.removeEventListener('visibilitychange',this.onVisibility);this.release();this.root.remove();}
}
