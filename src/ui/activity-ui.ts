import type {ActivityDefinition,ActivityResult} from '../interactions/activities';
import {CUBE_COLORS,CubeRecall,type CubeColor} from '../interactions/minigames';
import {PokerDraw,HAND_SCORES,SUIT_SYMBOLS,cardRank,cardName} from '../interactions/poker-draw';
import {escape} from './content-markup';
import {keepDialogFocus} from './dialog-focus';

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
  readonly game=document.createElement('dialog');
  readonly feedback=document.createElement('aside');
  active:string|null=null;
  onCue:((cue:'select'|'signal-win'|'signal-miss')=>void)|null=null;
  onRender:(()=>void)|null=null;
  private timer=0;private lastPhase='';
  private previousFocus:HTMLElement|null=null;
  private cube=new CubeRecall();private poker=new PokerDraw();
  constructor(parent:HTMLElement,private onClose:()=>void) {
    this.game.className='game-console';this.game.setAttribute('aria-labelledby','game-title');
    keepDialogFocus(this.game);
    this.feedback.className='activity-feedback';this.feedback.hidden=true;
    parent.append(this.feedback,this.game);
    this.feedback.addEventListener('click',e=>{if((e.target as HTMLElement).closest('[data-dismiss-feedback]')){const focused=this.feedback.contains(document.activeElement);this.hideFeedback();if(focused)document.querySelector<HTMLCanvasElement>('canvas[role="application"]')?.focus();}});
    this.game.addEventListener('click',e=>{
      const button=(e.target as HTMLElement).closest<HTMLButtonElement>('button');
      if(button?.dataset.gameAction)this.gameAction(button.dataset.gameAction,button.dataset.color??button.dataset.pokerIndex);
      if(button?.hasAttribute('data-close-game'))this.closeGame();
      if(e.target===this.game){const r=this.game.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.closeGame();}
    });
    this.game.addEventListener('cancel',e=>{e.preventDefault();this.closeGame();});
    this.game.addEventListener('keydown',e=>{
      if(e.repeat)return;const kind=this.game.dataset.kind;
      if(kind==='cube') {
        const color=CUBE_COLORS[Number(e.code.replace('Digit',''))-1];
        const action=color?`cube-${color}`:e.code==='KeyH'?'cube-hide':e.code==='KeyN'?'cube-next':e.code==='KeyR'?'cube-retry':null;
        if(action){e.preventDefault();e.stopPropagation();this.gameAction(action);}
      } else if(kind==='poker-game') {
        const index=Number(e.code.replace('Digit',''))-1;
        const action=index>=0&&index<5?`poker-card-${index}`:e.code==='KeyD'?'poker-draw':e.code==='KeyB'?'poker-bank':e.code==='KeyN'?'poker-next':e.code==='KeyR'?'poker-restart':null;
        if(action){e.preventDefault();e.stopPropagation();this.gameAction(action);}
      }
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
  openGame(d:ActivityDefinition) {
    this.hideFeedback();if(!this.game.open)this.previousFocus=document.activeElement as HTMLElement;
    this.game.dataset.activity=d.id;this.game.dataset.kind=d.kind;
    if(d.kind==='cube')this.cube.restart();else if(d.kind==='poker-game')this.poker.restart();
    this.renderGame();
    if(!this.game.open)this.game.showModal();
    this.game.querySelector<HTMLButtonElement>('[data-close-game]')!.focus({preventScroll:true});
  }
  private gameHeader(label:string,title:string,description:string,closeLabel:string){return `<div class="game-top"><span>${label}</span><button class="close-button" data-close-game aria-label="${closeLabel}">×</button></div><h2 id="game-title">${title}</h2><p>${description}</p>`;}
  private renderGame() {
    const kind=this.game.dataset.kind;
    if(kind==='cube'){
      const c=this.cube,visible=c.phase==='preview';
      const sequence=c.pattern.map((color,i)=>`<span class="cube-tile ${visible?`is-${color}`:'is-hidden'}"><b>${visible?escape(color):'?'}</b><small>${i+1}</small></span>`).join('');
      const chosen=c.input.map(color=>`<span class="cube-choice is-${color}">${escape(color)}</span>`).join('')||'<span class="cube-empty">No tiles entered yet.</span>';
      const controls=c.phase==='preview'?'<button class="button" data-primary-game-action data-game-action="cube-hide">Hide &amp; play</button>':c.phase==='play'?CUBE_COLORS.map((color,i)=>`<button class="cube-color is-${color}" data-game-action="cube-color" data-color="${color}"><span>${i+1}</span>${color}</button>`).join(''):c.phase==='won'?'<button class="button" data-primary-game-action data-game-action="cube-next">Next round</button><button class="button secondary-game-action" data-game-action="cube-restart">Start over</button>':'<button class="button" data-primary-game-action data-game-action="cube-retry">Retry round</button><button class="button secondary-game-action" data-game-action="cube-restart">Start over</button>';
      this.game.innerHTML=`${this.gameHeader('OFF DUTY / CUBE SHELF','Cube recall','Memorize the color order, hide it, then rebuild the sequence.','Close cube recall')}<div class="game-score"><span>Round ${c.round} / 3</span><span>Score ${c.score}</span></div><div class="cube-sequence" aria-label="${visible?'Sequence to memorize':'Hidden sequence'}">${sequence}</div>${c.phase!=='preview'?`<div class="cube-input" aria-label="Your sequence">${chosen}</div>`:''}<p class="game-result" data-outcome="${c.phase}" role="status">${escape(c.message)}</p><div class="cube-actions">${controls}</div><p class="game-keys"><kbd>1–4</kbd> Choose tile · <kbd>H</kbd> Hide · <kbd>N</kbd> Next · <kbd>R</kbd> Retry<br><kbd>Esc</kbd> Back to the world</p>`;
      return;
    }
    this.renderPoker();
  }
  private renderPoker(){
    const p=this.poker,playing=p.phase==='playing';
    const cards=p.cards.map((card,index)=>`<button class="playing-card ${card.suit==='hearts'||card.suit==='diamonds'?'red-card':''}" data-game-action="poker-card" data-poker-index="${index}" aria-label="${cardName(card)}. ${p.discards.has(index)?'Replace':'Keep'}" aria-pressed="${p.discards.has(index)}" ${playing?'':'disabled'}><b>${cardRank(card.rank)}</b><span aria-hidden="true">${SUIT_SYMBOLS[card.suit]}</span><small>${p.discards.has(index)?'replace':'keep'}</small></button>`).join('');
    const actions=playing?`<button class="button" data-primary-game-action data-game-action="poker-draw" ${!p.drawsLeft||!p.discards.size?'disabled':''}>Draw · ${p.drawsLeft} left</button><button class="button secondary-game-action" data-game-action="poker-bank">Bank ${p.bankValue}</button>`:p.phase==='banked'?'<button class="button" data-primary-game-action data-game-action="poker-next">Next hand</button>':'<button class="button" data-primary-game-action data-game-action="poker-restart">Deal again</button>';
    this.game.innerHTML=`${this.gameHeader('REDSHIFT / CREW TABLE','Redshift Draw','Three hands. Two redraws each. Bank 150 chips to clear the crew’s cargo.','Close Redshift Draw')}<div class="game-score"><span>Hand ${p.round} / 3</span><span>Bank ${p.score} / ${p.target}</span></div><div class="draw-contract"><span>contract / ${escape(p.contract.name)}</span><strong>${escape(p.contract.description)} · +${p.contract.bonus}</strong><small>${p.contractComplete?'✓ Ready to claim':'Build the bonus before banking'}</small></div><div class="poker-hand" role="group" aria-label="Your five cards. Select cards to replace.">${cards}</div><div class="draw-hand-value"><strong>${p.hand.name}</strong><span>${p.bankValue} chips ${p.contractComplete?'including bonus':''}</span></div><p class="game-result" data-outcome="${p.phase==='won'?'won':p.phase==='lost'?'missed':'ready'}" role="status">${escape(p.message)}</p><div class="poker-actions">${actions}</div><details class="poker-guide"><summary>hand values</summary><ul>${Object.entries(HAND_SCORES).map(([name,points])=>`<li><span>${name}</span><b>${points}</b></li>`).join('')}</ul></details><p class="game-keys"><kbd>1–5</kbd> Select · <kbd>D</kbd> Draw · <kbd>B</kbd> Bank · <kbd>N</kbd> Next · <kbd>R</kbd> Replay<br><kbd>Esc</kbd> Back to the world</p>`;
  }
  private gameAction(action:string,color?:string) {
    if(action==='cube-hide')this.cube.hide();
    else if(action==='cube-color'||action.startsWith('cube-')&&CUBE_COLORS.includes(action.slice(5) as CubeColor)){
      const value=(color??action.slice(5)) as CubeColor;if(!CUBE_COLORS.includes(value))return;
      const correct=this.cube.choose(value);this.onCue?.(this.cube.phase==='won'?'signal-win':correct?'select':'signal-miss');
    } else if(action==='cube-retry')this.cube.retry();
    else if(action==='cube-next')this.cube.next();
    else if(action==='cube-restart')this.cube.restart();
    else if(action==='poker-card'||action.startsWith('poker-card-'))this.poker.toggle(Number(color??action.slice(11)));
    else if(action==='poker-draw'){if(!this.poker.draw())return;this.onCue?.('select');}
    else if(action==='poker-bank'){if(!this.poker.bank())return;this.onCue?.(this.poker.phase==='lost'?'signal-miss':'signal-win');}
    else if(action==='poker-next')this.poker.next();
    else if(action==='poker-restart')this.poker.restart();
    else return;
    this.renderGame();
    this.onRender?.();
    const focus=action.startsWith('poker-card')?`[data-poker-index="${Number(color??action.slice(11))}"]`:'[data-primary-game-action]:not(:disabled), [data-game-action]:not(:disabled)';
    this.game.querySelector<HTMLButtonElement>(focus)?.focus();
  }
  closeGame() {
    if(!this.game.open)return;this.game.close();this.onClose();
    if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});
  }
}
