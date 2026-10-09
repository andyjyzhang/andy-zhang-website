import {landmarks,sectionLandmark,type Section} from '../config/world';
import {contact} from '../content/portfolio';
import {contentMarkup,sectionLabels,sectionTitles,link} from './content-markup';
import type {Interactable} from '../interactions/detection';
import type {ActivityDefinition} from '../interactions/activities';
import {ActivityUI} from './activity-ui';
import {keepDialogFocus} from './dialog-focus';
import {WORLD_STYLE} from '../config/station';
import {STREETS,CITY_LOTS,TRANSIT} from '../world/city-layout';

export interface UIActions {openSection:(s:Section)=>void;closePanel:()=>void;overview:()=>void;pov:()=>void;travel:(id:string)=>void;motion:(enabled:boolean)=>void;replay:()=>void;action:(key:'E'|'F')=>void;returnToTown:()=>void;exportBuild:()=>void;activity:(id:string,command:string)=>void;sound:(enabled:boolean)=>void;volume:(volume:number)=>void}
export class Interface {
  readonly root=document.createElement('div');readonly panel=document.createElement('dialog');readonly menu=document.createElement('dialog');readonly activity:HTMLDialogElement;readonly activityUI:ActivityUI;
  readonly prompt=document.createElement('button');readonly status=document.createElement('div');readonly toast=document.createElement('div');readonly touch=document.createElement('div');
  private extraStops:{id:string;name:string}[]=[];
  onSound:((cue:'open'|'close'|'select')=>void)|null=null;
  private soundEnabled=true;private soundVolume=.45;private soundStatus='Sound starts with your first interaction.';
  private lastPrompt='';private lastFocus:HTMLElement|null=null;private toastTimer=0;private actions:UIActions|null=null;
  constructor(parent:HTMLElement) {
    document.documentElement.dataset.world='orbital';this.root.className='interface';
    this.root.innerHTML=`<a class="skip-link" href="/portfolio.html">Read the portfolio without 3D</a>
      <header class="world-header"><a class="world-brand" href="/" aria-label="Andy's World home"><span class="brand-brick" aria-hidden="true"><i></i><i></i></span><span>ANDY’S WORLD<small>Andy's Orbital Station / Built brick by brick.</small></span></a><nav class="quick-links" aria-label="Quick access"><button data-menu class="button portfolio-button">▦ Portfolio</button>${link(contact.resume,'Résumé','button resume-button')}<button data-contact class="button icon-button" aria-label="Contact Andy">↗</button></nav></header>
      <div class="world-meta"><span class="daylight-dot"></span> ORBITAL STATION / SPACEPORT ONLINE <span class="meta-rule"></span> BUILT BRICK BY BRICK</div>
      <div class="world-tools"><button class="button" data-overview aria-label="Toggle world view">⌖ World view</button><button class="button" data-pov aria-label="Switch first-person view" aria-pressed="false">◎ POV</button><button class="button sound-toggle" data-sound-toggle aria-label="Mute sound" aria-pressed="true">♪ <span data-sound-label>Sound</span></button><button class="button" data-controls aria-label="Controls and settings">?</button></div>
      <div class="control-guide"><span><kbd>W A S D</kbd> Move</span><span><kbd>⇧</kbd> Run</span><span><kbd>SPACE</kbd> Jump</span><span data-look-guide>Drag to look · Scroll for POV</span><span><kbd>ESC</kbd> Menu</span></div>
      <div class="map-widget"><div class="map-heading"><span>ANDY'S ORBITAL STATION</span><button data-menu aria-label="Open world directory">↗</button></div><svg class="mini-map" viewBox="0 0 100 88" aria-label="Spaceport map">${this.mapMarkup()}</svg><div class="map-legend"><i></i> Blue studs lead to Andy’s portfolio.</div></div>
      <a class="fallback-link" href="/portfolio.html">Just here for the portfolio? ↗</a><button class="button space-return" hidden data-return>← Return to Andy’s World</button>`;
    this.prompt.className='interaction-prompt';this.prompt.hidden=true;this.prompt.setAttribute('aria-live','polite');
    this.status.className='location-status';this.status.innerHTML='<span class="location-dot"></span><div><small>YOU ARE HERE</small><strong>Station concourse</strong></div>';
    this.toast.className='toast';this.toast.setAttribute('role','status');this.toast.hidden=true;
    this.panel.className='content-panel';this.panel.setAttribute('aria-labelledby','panel-title');
    this.menu.className='directory';this.menu.setAttribute('aria-labelledby','directory-title');
    this.activityUI=new ActivityUI(this.root,(id,command)=>this.actions?.activity(id,command),()=>{this.actions?.closePanel();this.onSound?.('close');});this.activity=this.activityUI.arcade;
    this.touch.className='touch-controls';this.touch.innerHTML='<div class="d-pad" aria-label="Touch movement"><button data-key="KeyW" aria-label="Move forward">↑</button><button data-key="KeyA" aria-label="Move left">←</button><button data-key="KeyS" aria-label="Move backward">↓</button><button data-key="KeyD" aria-label="Move right">→</button></div><div class="touch-actions"><button data-key="Space" aria-label="Jump">↑<small>Jump</small></button><button data-key="ShiftLeft" aria-label="Run">⇧<small>Run</small></button></div>';
    this.root.append(this.prompt,this.status,this.toast,this.touch,this.panel,this.menu,this.activity);parent.append(this.root);
    for(const dialog of [this.panel,this.menu]) {
      keepDialogFocus(dialog);
      dialog.addEventListener('cancel',e=>{e.preventDefault();this.closeDialog(dialog);});
      dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.closeDialog(dialog);});
    }
    this.root.addEventListener('click',e=>{
      const t=(e.target as HTMLElement).closest<HTMLElement>('button');if(!t)return;
      if(t.hasAttribute('data-sound-toggle'))this.actions?.sound(!this.soundEnabled);
      if(t.hasAttribute('data-menu')||t.hasAttribute('data-controls'))this.openMenu();
      if(t.hasAttribute('data-contact'))this.actions?.openSection('contact');
      if(t.hasAttribute('data-overview')){this.actions?.overview();this.onSound?.('select');}
      if(t.hasAttribute('data-pov')){this.actions?.pov();this.onSound?.('select');}
      if(t.hasAttribute('data-close-panel'))this.closePanel();
      if(t.hasAttribute('data-close-menu'))this.closeMenu();
      if(t.dataset.section)this.actions?.openSection(t.dataset.section as Section);
      if(t.dataset.travel){this.closeMenu();this.actions?.travel(t.dataset.travel);}
      if(t.hasAttribute('data-replay')){this.closeMenu();this.actions?.replay();}
      if(t.hasAttribute('data-return'))this.actions?.returnToTown();
      if(t.hasAttribute('data-export-build'))this.actions?.exportBuild();
    });
    this.prompt.addEventListener('click',()=>{
      // Modal openers must remember the canvas: the contextual prompt is
      // temporarily hidden while reading and cannot receive focus on close.
      document.querySelector<HTMLCanvasElement>('canvas[role="application"]')?.focus({preventScroll:true});
      this.actions?.action(this.prompt.dataset.key as 'E'|'F');
    });
  }
  connect(actions:UIActions){this.actions=actions;}
  setSound(enabled:boolean,volume:number,status='waiting') {
    this.soundEnabled=enabled;this.soundVolume=volume;
    this.soundStatus=!enabled?'Sound muted.':status==='unavailable'?'Sound is unavailable in this browser.':volume===0?'Volume is at zero.':status==='ready'?'Sound on.':'Sound starts with your first interaction.';
    const button=this.root.querySelector<HTMLButtonElement>('[data-sound-toggle]')!;
    button.setAttribute('aria-label',enabled?'Mute sound':'Unmute sound');button.setAttribute('aria-pressed',String(enabled));button.querySelector('[data-sound-label]')!.textContent=enabled?'Sound':'Muted';
    const checkbox=this.menu.querySelector<HTMLInputElement>('[data-sound-enabled]');if(checkbox)checkbox.checked=enabled;
    const slider=this.menu.querySelector<HTMLInputElement>('[data-sound-volume]');if(slider){slider.value=String(Math.round(volume*100));slider.setAttribute('aria-valuetext',`${Math.round(volume*100)} percent`);}
    const output=this.menu.querySelector('[data-volume-label]');if(output)output.textContent=`${Math.round(volume*100)}%`;
    const state=this.menu.querySelector('[data-sound-status]');if(state&&state.textContent!==this.soundStatus)state.textContent=this.soundStatus;
  }
  get paused(){return this.panel.open||this.menu.open||this.activity.open;}
  private mapMarkup() {
    const sx=100/WORLD_STYLE.size[0],sz=88/WORLD_STYLE.size[1];
    return `<rect x="1" y="1" width="98" height="86" rx="4" fill="#25394c"/>${STREETS.map(s=>`<rect x="${50+(s.x-s.w/2)*sx}" y="${44+(s.z-s.d/2)*sz}" width="${s.w*sx}" height="${s.d*sz}" fill="#708290"/>`).join('')}${TRANSIT.points.length?`<polyline points="${[...TRANSIT.points,TRANSIT.points[0]].map(([x,z])=>`${50+x*sx},${44+z*sz}`).join(' ')}" fill="none" stroke="#e6ba55" stroke-width="1" opacity=".8"/>`:""}${CITY_LOTS.map(l=>`<rect x="${50+(l.x-l.w*.32)*sx}" y="${44+(l.z-l.d*.32)*sz}" width="${l.w*.64*sx}" height="${l.d*.64*sz}" fill="#355c74"/>`).join('')}<path d="M39 12 Q50 2 61 12" fill="none" stroke="#559ab7" stroke-width="2"/>${landmarks.map(l=>`<rect x="${50+l.x*sx-3}" y="${44+l.z*sz-2.5}" width="6" height="5" fill="${l.color}"/><text x="${50+l.x*sx}" y="${44+l.z*sz+1}" text-anchor="middle">${l.number}</text>`).join('')}<circle data-player-dot cx="50" cy="${44+10*sz}" r="1.8" fill="#fe8a18" stroke="#faf5e5" stroke-width="1"/>`;
  }
  private closeDialog(dialog:HTMLDialogElement){if(dialog===this.panel)this.closePanel();else if(dialog===this.activity)this.closeActivity();else this.closeMenu();}
  private restoreFocus(){if(this.lastFocus?.isConnected)this.lastFocus.focus({preventScroll:true});}
  openPanel(section:Section) {
    this.activityUI.hideFeedback();
    this.closeMenu();this.closeActivity();if(!this.panel.open)this.lastFocus=document.activeElement as HTMLElement;
    const l=landmarks.find(l=>l.id===sectionLandmark[section])!,tabs:Section[]=l.id==='house'?['about','contact']:l.id==='garage'?['experience','projects']:[section];
    this.panel.innerHTML=`<div class="panel-binding" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="panel-top"><span>THE WORLD GUIDE / ${l.number}</span><button class="close-button" data-close-panel aria-label="Close portfolio panel">×</button></div><div class="panel-scroll"><p class="chapter-label"><span class="blue-stud"></span> ${l.name}</p><h2 id="panel-title">${sectionTitles[section]}</h2><nav class="panel-tabs" aria-label="Landmark chapters">${tabs.map(tab=>`<button data-section="${tab}" aria-current="${section===tab?'page':'false'}">${sectionLabels[tab]}</button>`).join('')}</nav><div class="panel-copy">${contentMarkup(section)}</div><footer class="panel-footer"><span>ANDY ZHANG / ${sectionLabels[section].toUpperCase()}</span><button data-close-panel>Back to the world ↗</button></footer></div>`;
    if(!this.panel.open){this.panel.showModal();this.onSound?.('open');}else this.onSound?.('select');this.panel.querySelector<HTMLElement>('[data-close-panel]')!.focus();this.prompt.hidden=true;
  }
  closePanel(){if(!this.panel.open)return;this.panel.close();this.actions?.closePanel();this.restoreFocus();this.onSound?.('close');}
  openArcade(d:ActivityDefinition,status:string) {this.closeMenu();this.closePanel();this.activityUI.openArcade(d,status);this.prompt.hidden=true;this.onSound?.('open');}
  updateActivityStatus(message:string){this.activityUI.updateStatus(message);}
  setSignal(index:number){this.activityUI.setSignal(index);}
  closeActivity(){this.activityUI.closeArcade();}
  setStops(stops:{id:string;name:string}[]) {this.extraStops=stops.filter(s=>!['plaza','car-0','ship','gate','cargo','transit','noodles','repair','radio','arcade'].includes(s.id));}
  openMenu() {
    this.activityUI.hideFeedback();
    this.closePanel();this.closeActivity();if(this.menu.open)return;this.lastFocus=document.activeElement as HTMLElement;
    this.menu.innerHTML=`<div class="panel-top"><span>YOUR SHORTCUT THROUGH THE WORLD</span><button class="close-button" data-close-menu aria-label="Close directory">×</button></div><p class="chapter-label">ANDY’S WORLD / FIELD GUIDE</p><h2 id="directory-title">Pick a place.<br>Or a chapter.</h2><p>Explore the spaceport, or go straight to Andy’s portfolio.</p><nav class="chapter-grid" aria-label="Portfolio chapters">${(['about','experience','projects','education','hobbies','poker','contact'] as Section[]).map((s,i)=>`<button data-section="${s}"><span>0${i+1}</span>${sectionLabels[s]}<i aria-hidden="true">↗</i></button>`).join('')}${link(contact.resume,'Résumé')}</nav><details class="world-settings"><summary>Controls & settings</summary><p><kbd>WASD</kbd> move · <kbd>SHIFT</kbd> run · <kbd>SPACE</kbd> jump<br><kbd>E</kbd> explore / interact / launch · <kbd>F</kbd> drive / exit<br>Drag to look · Arrows rotate · Scroll all the way in for first person</p><label><input type="checkbox" data-motion ${document.documentElement.dataset.motion==='reduced'?'checked':''}/> Reduce motion</label><button class="text-button" data-replay>Replay the world build</button> · <button class="text-button" data-export-build>Download this build (.ldr)</button><br><a class="text-button" href="/build-notes.html">Build approach</a> · <a class="text-button" href="/model-credits.html">Part credits</a></details><div class="travel-shortcuts"><span>EXPLORE THE SPACEPORT</span>${[['plaza','Station concourse'],['car-0','Scout rover'],['ship','The launch bay'],['gate','Orbital gate'],['cargo','Cargo gantry'],['transit','Express platform'],['noodles','Noodle / 24H'],['repair','Drone test'],['radio','Orbit radio'],['arcade','Signal match']].map(([id,name])=>`<button data-travel="${id}">${name}</button>`).join('')}</div><details class="world-stops"><summary>More station stops</summary><div class="travel-shortcuts">${this.extraStops.map(s=>`<button data-travel="${s.id}">${s.name}</button>`).join('')}</div></details><a class="text-button" href="/portfolio.html">Read the accessible portfolio ↗</a>`;
    this.menu.querySelector<HTMLInputElement>('[data-motion]')!.addEventListener('change',e=>this.actions?.motion((e.target as HTMLInputElement).checked));
    this.menu.querySelector('[data-motion]')!.closest('label')!.insertAdjacentHTML('afterend',`<div class="sound-settings"><label><input type="checkbox" data-sound-enabled ${this.soundEnabled?'checked':''}> Sound effects</label><label class="volume-setting">Volume <input type="range" data-sound-volume aria-label="Sound effects volume" min="0" max="100" step="5" value="${Math.round(this.soundVolume*100)}" aria-valuetext="${Math.round(this.soundVolume*100)} percent"><output data-volume-label>${Math.round(this.soundVolume*100)}%</output></label><p data-sound-status role="status">${this.soundStatus}</p></div>`);
    this.menu.querySelector<HTMLInputElement>('[data-sound-enabled]')!.addEventListener('change',e=>this.actions?.sound((e.target as HTMLInputElement).checked));
    this.menu.querySelector<HTMLInputElement>('[data-sound-volume]')!.addEventListener('input',e=>this.actions?.volume(Number((e.target as HTMLInputElement).value)/100));
    this.menu.showModal();this.menu.querySelector<HTMLElement>('[data-close-menu]')!.focus();this.prompt.hidden=true;this.onSound?.('open');
  }
  closeMenu(){if(!this.menu.open)return;this.menu.close();this.restoreFocus();this.onSound?.('close');}
  setPOV(firstPerson:boolean,overview=false){
    this.root.querySelector('[data-pov]')!.setAttribute('aria-pressed',String(firstPerson));
    this.root.querySelector('[data-overview]')!.setAttribute('aria-pressed',String(overview));
    this.root.querySelector('[data-look-guide]')!.textContent=overview?'Drag to orbit · Scroll to zoom':firstPerson?'Mouse to look · Scroll to zoom out':'Drag to look · Scroll for POV';
  }
  setPrompt(item:Interactable|null,driving=false) {
    if(this.root.classList.contains('in-space')){this.prompt.hidden=true;this.lastPrompt='';return;}
    const signature=driving?'exit':item?.id||'';
    if(signature===this.lastPrompt&&!this.paused&&this.prompt.hidden===(!item&&!driving))return;
    this.lastPrompt=signature;this.prompt.hidden=this.paused||(!item&&!driving);if(this.prompt.hidden)return;
    this.prompt.dataset.key=driving?'F':item!.key;
    this.prompt.innerHTML=`<span class="prompt-name">${driving?'Crew transport':item!.name}</span><span class="prompt-action"><kbd>${driving?'F':item!.key}</kbd> ${driving?'Exit vehicle':item!.action}</span>`;
  }
  updateLocation(x:number,z:number,label='Station concourse') {const dot=this.root.querySelector('[data-player-dot]')!;dot.setAttribute('cx',String(50+x*100/WORLD_STYLE.size[0]));dot.setAttribute('cy',String(44+z*88/WORLD_STYLE.size[1]));this.status.querySelector('strong')!.textContent=label;}
  notify(message:string,duration=3800){clearTimeout(this.toastTimer);this.toast.textContent=message;this.toast.hidden=false;this.toastTimer=window.setTimeout(()=>this.toast.hidden=true,duration);}
  setScene(space:boolean,playable=false){if(space)this.activityUI.hideFeedback();this.root.classList.toggle('in-space',space);this.root.classList.toggle('in-destination',space&&playable);this.root.querySelector<HTMLButtonElement>('[data-return]')!.hidden=!space;this.prompt.hidden=space;}
}
