import {PLAYER_TUNING} from '../config/controls';

export class Input {
  readonly keys = new Set<string>();
  private presses = new Set<string>();
  cameraX = 0;
  cameraY = 0;
  private dragPointer:number|null=null;
  private rightLook=false;
  private lookEnabled=true;
  private lockIntent:'view'|'drag'|null=null;
  private capturePending=false;
  private suppressUnlock=false;
  zoom = 0;
  dragging = false;
  firstPerson = false;
  onCaptureExit: (()=>void) | null = null;
  onScroll: (()=>void) | null = null;
  private pointerX = 0;
  private pointerY = 0;
  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', e => {
      const target = e.target as HTMLElement;
      if (document.querySelector('dialog[open]')) return;
      if (target.matches('input, textarea, select') || target.isContentEditable) return;
      // Native UI controls own Space/Enter and arrow keys. Escape remains a
      // global way back to the directory when no dialog is open.
      if(target.matches('button, a, summary')&&['Space','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;
      if (!e.repeat) this.presses.add(e.code);
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && target === canvas) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.clear());
    canvas.addEventListener('pointerdown', e => {
      if(!this.lookEnabled)return;
      if (e.button !== 0 && e.button !== 2) return;
      if(this.dragPointer!==null&&this.dragPointer!==e.pointerId)return;
      this.dragging = true;
      this.dragPointer=e.pointerId;
      this.pointerX = e.clientX; this.pointerY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
      canvas.focus({ preventScroll: true });
      this.rightLook=e.button===2&&e.pointerType!=='touch';
      this.updateCursor();
      if(this.firstPerson||this.rightLook)this.captureMouse(this.firstPerson?'view':'drag');
    });
    canvas.addEventListener('pointermove', e => {
      if(!this.lookEnabled)return;
      const locked=document.pointerLockElement===canvas;
      // Pointer lock guarantees relative mousemove events. Some browsers also
      // emit pointermove; leave locked motion to one listener to avoid doubling.
      if(locked)return;
      if(!locked&&this.dragPointer!==null&&e.pointerId!==this.dragPointer)return;
      if(this.firstPerson||locked){
        const sensitivity=this.firstPerson?PLAYER_TUNING.firstPersonSensitivity:PLAYER_TUNING.orbitSensitivity;
        this.cameraX+=(e.movementX||0)*sensitivity;this.cameraY+=(e.movementY||0)*sensitivity;return;
      }
      if (!this.dragging) return;
      this.cameraX += (e.clientX - this.pointerX) * PLAYER_TUNING.orbitSensitivity;
      this.cameraY += (e.clientY - this.pointerY) * PLAYER_TUNING.orbitSensitivity;
      this.pointerX = e.clientX; this.pointerY = e.clientY;
    });
    canvas.addEventListener('mousemove',e=>{
      if(!this.lookEnabled||document.pointerLockElement!==canvas||!this.lockIntent)return;
      const sensitivity=this.firstPerson?PLAYER_TUNING.firstPersonSensitivity:PLAYER_TUNING.orbitSensitivity;
      this.cameraX+=(e.movementX||0)*sensitivity;this.cameraY+=(e.movementY||0)*sensitivity;
    });
    const release = (e:PointerEvent) => {if(this.dragPointer!==null&&e.pointerId!==this.dragPointer&&document.pointerLockElement!==canvas)return;this.releaseDrag();};
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture',e=>{
      // Pointer lock itself can release pointer capture. That is not mouse-up.
      if(this.rightLook&&(this.capturePending||document.pointerLockElement===canvas))return;
      release(e);
    });
    window.addEventListener('mouseup',e=>{if(e.button===2&&this.rightLook)this.releaseDrag();});
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.zoom += e.deltaY * .015;this.onScroll?.(); e.preventDefault(); }, { passive: false });
    document.addEventListener('pointerlockchange',()=>{
      this.capturePending=false;
      if(document.pointerLockElement===canvas){
        // A fast click can finish before the asynchronous request is granted.
        if(!this.lockIntent||!this.lookEnabled)this.releaseMouse();
      }else{
        // A fresh right-down may arrive before the prior intentional unlock.
        // Resume that new hold rather than misreading the old exit as Escape.
        if(this.suppressUnlock&&this.lockIntent&&this.lookEnabled&&(this.firstPerson||this.rightLook)){
          this.captureMouse(this.lockIntent);return;
        }
        const unexpected=this.lockIntent!==null&&!this.suppressUnlock;
        this.lockIntent=null;this.suppressUnlock=false;
        this.dragging=false;this.rightLook=false;this.dragPointer=null;this.updateCursor();
        if(unexpected)this.onCaptureExit?.();
      }
    });
    document.addEventListener('pointerlockerror',()=>{this.capturePending=false;});
    this.canvas=canvas;
  }
  private canvas:HTMLCanvasElement;
  setLookEnabled(enabled:boolean){
    if(enabled===this.lookEnabled)return;
    this.lookEnabled=enabled;
    if(!enabled){this.firstPerson=false;this.clear();}
  }
  setFirstPerson(enabled:boolean) {
    const was=this.firstPerson;this.firstPerson=enabled;
    if(was&&!enabled){if(this.rightLook)this.lockIntent='drag';else this.releaseMouse();}
    if(enabled&&this.lockIntent)this.lockIntent='view';
    this.updateCursor();
  }
  captureMouse(intent:'view'|'drag'='view') {
    if(!this.lookEnabled)return;
    this.lockIntent=intent;
    if(document.pointerLockElement===this.canvas)return;
    this.suppressUnlock=false;if(this.capturePending)return;
    if(!this.canvas.requestPointerLock)return;
    this.capturePending=true;
    try{
      // The change/error events also cover browsers with a void-returning API.
      const request=this.canvas.requestPointerLock();
      request?.catch(()=>{this.capturePending=false;});
    }catch{this.capturePending=false;}
  }
  private releaseMouse(){
    this.lockIntent=null;this.suppressUnlock=true;
    if(document.pointerLockElement===this.canvas)document.exitPointerLock();
  }
  private updateCursor(){this.canvas.style.cursor=this.firstPerson||this.rightLook?'none':'';}
  // A quick key tap must survive until at least one simulation frame.
  down(...codes: string[]) { return codes.some(code => this.keys.has(code) || this.presses.has(code)); }
  pressed(code: string) { const had = this.presses.has(code); this.presses.delete(code); return had; }
  press(code: string) { this.presses.add(code); }
  consumeCamera() {
    const delta = { x: this.cameraX, y: this.cameraY, zoom: this.zoom };
    this.cameraX = this.cameraY = this.zoom = 0;
    return delta;
  }
  private releaseDrag(){
    this.dragging=false;this.dragPointer=null;this.rightLook=false;
    if(!this.firstPerson)this.releaseMouse();
    this.updateCursor();
  }
  clear() { this.keys.clear(); this.presses.clear();this.dragging=false;this.dragPointer=null;this.rightLook=false;this.releaseMouse();this.updateCursor();this.cameraX = this.cameraY = this.zoom = 0; }
  endFrame() { this.presses.clear(); }
}
