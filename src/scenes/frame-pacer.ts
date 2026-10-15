// Keep full-rate gameplay without spending 120/144/240 Hz on a portfolio world.
// Dialogs already pause controls; their background can render less frequently
// while native DOM interactions and CSS animation remain at display refresh.
export function worldFrameRate(lowGraphics:boolean,paused:boolean) {
  return paused?20:lowGraphics?30:60;
}

export class FramePacer {
  private previous:number|null=null;
  reset(){this.previous=null;}
  ready(time:number,fps:number) {
    if(this.previous===null||time<this.previous){this.previous=time;return true;}
    const interval=1000/fps,elapsed=time-this.previous;
    if(elapsed+.5<interval)return false;
    this.previous+=Math.max(1,Math.floor((elapsed+.5)/interval))*interval;return true;
  }
}
