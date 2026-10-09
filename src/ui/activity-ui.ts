import type {ActivityDefinition,ActivityResult} from '../interactions/activities';
import {escape} from './content-markup';
import {keepDialogFocus} from './dialog-focus';

// World feedback never steals focus or pauses movement. Only the signal game
// needs a dialog, with its own cabinet controls instead of a station template.
export function feedbackMarkup(result:ActivityResult) {
  const {definition:d,on,count,message}=result;
  const heading=`<div class="feedback-heading"><strong>${escape(d.name)}</strong><button aria-label="Dismiss interaction feedback" data-dismiss-feedback>×</button></div>`;
  const status=`<p class="feedback-phase" role="status">${escape(message)}</p>`;
  switch(d.kind) {
    case 'reactor':return `${heading}<div class="core-readout"><span aria-hidden="true">▥</span><div><small>COOLING CIRCUIT</small><b>${on?'ONLINE':'STANDBY'}</b></div></div>${status}`;
    case 'repair':return `${heading}<div class="drone-readout"><span aria-hidden="true">✣</span><div><small>SURVEY DRONE / TEST ${String(count).padStart(2,'0')}</small><b>Preflight → Hover → Return</b></div></div>${status}`;
    case 'cargo':return `${heading}<div class="cargo-manifest"><span>SUPPLY CRATE ${String(count).padStart(2,'0')}</span><b>Loading pad ↔ Delivery pad</b></div>${status}`;
    case 'noodles':return `${heading}<div class="order-receipt"><small>NOODLE / 24H · ORDER ${String(count).padStart(2,'0')}</small><b>One bowl. Ready at the hatch.</b><span>Enjoy the view while it’s hot.</span></div>${status}`;
    case 'radio':return `${heading}<div class="receiver-readout"><small>RECEIVER / CHANNEL ${count%3+1}</small><b>${['DEEP SPACE / 07','DOCK CONTROL / 12','CREW RADIO / 90.4'][count%3]}</b><span aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▆ ▂ ▅</span></div>${status}`;
    case 'crew':return `${heading}<blockquote>${escape(d.description)}</blockquote>${status}`;
    case 'facility':return `${heading}<div class="beacon-readout"><span aria-hidden="true">${on?'●':'○'}</span><b>${on?'Arrival beacon online':'Arrival beacon on standby'}</b></div>${status}`;
    default:return `${heading}${status}`;
  }
}

export class ActivityUI {
  readonly arcade=document.createElement('dialog');
  readonly feedback=document.createElement('aside');
  active:string|null=null;
  private timer=0;private lastPhase='';private lastSignal=-1;
  private previousFocus:HTMLElement|null=null;
  constructor(parent:HTMLElement,private command:(id:string,command:string)=>void,private onClose:()=>void) {
    this.arcade.className='arcade-console';this.arcade.setAttribute('aria-labelledby','arcade-title');
    keepDialogFocus(this.arcade);
    this.feedback.className='activity-feedback';this.feedback.hidden=true;
    parent.append(this.feedback,this.arcade);
    this.feedback.addEventListener('click',e=>{if((e.target as HTMLElement).closest('[data-dismiss-feedback]')){const focused=this.feedback.contains(document.activeElement);this.hideFeedback();if(focused)document.querySelector<HTMLCanvasElement>('canvas[role="application"]')?.focus();}});
    this.arcade.addEventListener('click',e=>{
      const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if(button?.dataset.command)this.command(this.arcade.dataset.activity!,button.dataset.command);
      if(button?.hasAttribute('data-close-arcade'))this.closeArcade();
      if(e.target===this.arcade){const r=this.arcade.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.closeArcade();}
    });
    this.arcade.addEventListener('cancel',e=>{e.preventDefault();this.closeArcade();});
    this.arcade.addEventListener('keydown',e=>{
      const command=e.code==='Space'?'stop':e.code==='KeyR'?'restart':e.code==='ArrowRight'?'step':null;
      if(command){e.preventDefault();e.stopPropagation();if(!e.repeat)this.command(this.arcade.dataset.activity!,command);}
    });
  }
  showFeedback(result:ActivityResult) {
    this.hideFeedback();this.active=result.definition.id;
    this.feedback.dataset.kind=result.definition.kind;this.feedback.setAttribute('aria-label',result.definition.name);
    this.feedback.innerHTML=feedbackMarkup(result);this.feedback.hidden=false;
    this.lastPhase=result.message;this.timer=window.setTimeout(()=>this.hideFeedback(),14000);
  }
  updatePhase(message:string) {
    if(!message||message===this.lastPhase)return;this.lastPhase=message;
    const output=this.feedback.querySelector('.feedback-phase');if(output)output.textContent=message;
  }
  hideFeedback(){clearTimeout(this.timer);this.feedback.hidden=true;this.active=null;}
  openArcade(d:ActivityDefinition,status:string) {
    this.hideFeedback();if(!this.arcade.open)this.previousFocus=document.activeElement as HTMLElement;
    this.arcade.dataset.activity=d.id;this.lastSignal=-1;
    this.arcade.innerHTML=`<div class="arcade-top"><span>OFF DUTY / SIGNAL CABINET</span><button class="close-button" data-close-arcade aria-label="Close signal game">×</button></div><h2 id="arcade-title">Signal match</h2><p>Stop on <strong>amber</strong> to synchronize the cabinet.</p><div class="signal-readout" role="group" aria-label="Signal lamps. Target amber.">${['Cyan','Amber','Orange'].map((name,i)=>`<span data-lamp="${i}"><i aria-hidden="true"></i>${name}${i===1?'<small>Target</small>':''}</span>`).join('')}</div><output class="current-signal" data-signal-text aria-live="off">Signal: Cyan</output><p class="signal-result" role="status" data-activity-status>${escape(status)}</p><div class="arcade-actions"><button class="button" data-command="stop">Stop the signal</button><button class="button" data-command="step">Next signal</button><button class="button" data-command="restart">Restart sweep</button></div><p class="arcade-keys"><kbd>Space</kbd> Stop · <kbd>→</kbd> Step · <kbd>R</kbd> Restart<br><kbd>Esc</kbd> Back to the world</p>`;
    if(!this.arcade.open)this.arcade.showModal();this.arcade.querySelector<HTMLButtonElement>('[data-command="stop"]')!.focus();
  }
  setSignal(index:number) {
    if(!this.arcade.open||index===this.lastSignal)return;this.lastSignal=index;
    this.arcade.querySelector('[data-signal-text]')!.textContent=`Signal: ${['Cyan','Amber','Orange'][index]}`;
    this.arcade.querySelectorAll<HTMLElement>('[data-lamp]').forEach((lamp,i)=>lamp.classList.toggle('lit',i===index));
  }
  updateStatus(message:string) {
    const status=this.arcade.querySelector<HTMLElement>('[data-activity-status]');
    if(status){status.textContent=message;status.dataset.outcome=message.includes('Synchronized')?'win':message.includes('Almost')?'miss':'ready';}
  }
  closeArcade() {
    if(!this.arcade.open)return;this.arcade.close();this.onClose();
    if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});
  }
}
