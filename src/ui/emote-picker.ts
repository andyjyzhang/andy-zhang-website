import {EMOTES,type EmoteId} from '../player/emotes';
import {keepDialogFocus} from './dialog-focus';

export class EmotePicker {
  readonly root=document.createElement('dialog');
  private previousFocus:HTMLElement|null=null;
  onSelect:((id:EmoteId)=>void)|null=null;
  constructor(parent:HTMLElement){
    this.root.className='emote-picker';this.root.setAttribute('aria-labelledby','emote-title');
    this.root.innerHTML=`<header><div><h2 id="emote-title">Strike a pose</h2><p>A little minifigure personality.</p></div><button class="close-button" data-close-emotes aria-label="Close emotes">&times;</button></header><div class="emote-options">${EMOTES.map((emote,i)=>`<button data-emote="${emote.id}"><kbd>${i+1}</kbd><span><strong>${emote.name}</strong><small>${emote.description}</small></span><span class="emote-pose emote-pose-${emote.id}" aria-hidden="true"><i></i></span></button>`).join('')}</div><footer>Move or jump to stop. <kbd>Esc</kbd> closes.</footer>`;
    parent.append(this.root);keepDialogFocus(this.root);
    this.root.addEventListener('cancel',event=>{event.preventDefault();this.close();});
    this.root.querySelector('[data-close-emotes]')!.addEventListener('click',()=>this.close());
    this.root.querySelectorAll<HTMLButtonElement>('[data-emote]').forEach(button=>button.addEventListener('click',()=>this.choose(button.dataset.emote as EmoteId)));
    this.root.addEventListener('keydown',event=>{
      if(event.repeat)return;
      if(event.code==='KeyG'){event.preventDefault();this.close();return;}
      const index=Number(event.key)-1;
      if(event.key.length===1&&Number.isInteger(index)&&index>=0&&index<EMOTES.length){event.preventDefault();this.choose(EMOTES[index].id);}
    });
  }
  get open(){return this.root.open;}
  show(){
    if(this.open)return;
    this.previousFocus=document.activeElement as HTMLElement;
    this.root.showModal();this.root.querySelector<HTMLButtonElement>('[data-emote]')!.focus();
  }
  close(){if(!this.open)return;this.root.close();if(this.previousFocus?.isConnected)this.previousFocus.focus({preventScroll:true});}
  private choose(id:EmoteId){this.close();this.onSelect?.(id);}
}
