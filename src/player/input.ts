import {PLAYER_TUNING} from '../config/controls';

export class Input {
  readonly keys = new Set<string>();
  private presses = new Set<string>();
  cameraX = 0;
  cameraY = 0;
  private dragPointer:number|null=null;
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
      if (e.button !== 0 && e.button !== 2) return;
      if(this.dragPointer!==null&&this.dragPointer!==e.pointerId)return;
      this.dragging = true;
      this.dragPointer=e.pointerId;
      this.pointerX = e.clientX; this.pointerY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.focus({ preventScroll: true });
      if(this.firstPerson)this.captureMouse();
    });
    canvas.addEventListener('pointermove', e => {
      if(this.dragPointer!==null&&e.pointerId!==this.dragPointer)return;
      if(this.firstPerson){this.cameraX+=e.movementX*PLAYER_TUNING.firstPersonSensitivity;this.cameraY+=e.movementY*PLAYER_TUNING.firstPersonSensitivity;return;}
      if (!this.dragging) return;
      this.cameraX += (e.clientX - this.pointerX) * PLAYER_TUNING.orbitSensitivity;
      this.cameraY += (e.clientY - this.pointerY) * PLAYER_TUNING.orbitSensitivity;
      this.pointerX = e.clientX; this.pointerY = e.clientY;
    });
    const release = (e:PointerEvent) => {if(this.dragPointer!==null&&e.pointerId!==this.dragPointer)return;this.releaseDrag();};
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.zoom += e.deltaY * .015;this.onScroll?.(); e.preventDefault(); }, { passive: false });
    document.addEventListener('pointerlockchange',()=>{if(this.firstPerson&&document.pointerLockElement!==canvas)this.onCaptureExit?.();});
    this.canvas=canvas;
  }
  private canvas:HTMLCanvasElement;
  setFirstPerson(enabled:boolean) {
    this.firstPerson=enabled;this.canvas.style.cursor=enabled?'none':'';
    if(!enabled&&document.pointerLockElement===this.canvas)document.exitPointerLock();
  }
  captureMouse() {
    if(document.pointerLockElement===this.canvas)return;
    // Some browsers require a click for capture. Free look also works without
    // a button held when capture is unavailable (for example on touch devices).
    const request=this.canvas.requestPointerLock?.();request?.catch(()=>{});
  }
  // A quick key tap must survive until at least one simulation frame.
  down(...codes: string[]) { return codes.some(code => this.keys.has(code) || this.presses.has(code)); }
  pressed(code: string) { const had = this.presses.has(code); this.presses.delete(code); return had; }
  press(code: string) { this.presses.add(code); }
  consumeCamera() {
    const delta = { x: this.cameraX, y: this.cameraY, zoom: this.zoom };
    this.cameraX = this.cameraY = this.zoom = 0;
    return delta;
  }
  private releaseDrag(){this.dragging=false;this.dragPointer=null;}
  clear() { this.keys.clear(); this.presses.clear(); this.releaseDrag();this.cameraX = this.cameraY = this.zoom = 0; }
  endFrame() { this.presses.clear(); }
}
