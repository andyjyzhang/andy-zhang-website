import {describe,it,expect,vi,afterEach} from 'vitest';
import {Input} from '../src/player/input';
import * as T from 'three';
import {FollowCamera} from '../src/camera/follow-camera';
afterEach(()=>vi.unstubAllGlobals());
function captureFixture(){
  type Handler=(event:Record<string,unknown>)=>void;
  const canvasEvents=new Map<string,Handler>(),documentEvents=new Map<string,Handler>(),windowEvents=new Map<string,Handler>();
  const documentStub={pointerLockElement:null as unknown,querySelector:()=>null,
    addEventListener:(name:string,fn:Handler)=>documentEvents.set(name,fn),
    exitPointerLock:vi.fn(()=>{documentStub.pointerLockElement=null;documentEvents.get('pointerlockchange')!({});}),
  };
  const canvas={style:{cursor:''},focus:vi.fn(),setPointerCapture:vi.fn(),
    requestPointerLock:vi.fn<()=>Promise<void>|void>(()=>undefined),
    addEventListener:(name:string,fn:Handler)=>canvasEvents.set(name,fn),
  };
  vi.stubGlobal('document',documentStub);vi.stubGlobal('window',{addEventListener:(name:string,fn:Handler)=>windowEvents.set(name,fn)});
  const input=new Input(canvas as unknown as HTMLCanvasElement),exit=vi.fn();input.onCaptureExit=exit;
  const down=()=>canvasEvents.get('pointerdown')!({button:2,pointerType:'mouse',pointerId:1,clientX:100,clientY:100});
  const lock=()=>{documentStub.pointerLockElement=canvas;documentEvents.get('pointerlockchange')!({});};
  return{input,canvas,documentStub,canvasEvents,documentEvents,windowEvents,down,lock,exit};
}
describe('held right-button look capture',()=>{
  it('locks the cursor and uses relative movement until mouse-up without opening a menu',()=>{
    const f=captureFixture();f.down();expect(f.canvas.requestPointerLock).toHaveBeenCalledOnce();
    expect(f.canvas.style.cursor).toBe('none');f.lock();
    // The client coordinates remain stationary while motion deltas continue.
    f.canvasEvents.get('pointermove')!({pointerId:9,clientX:100,clientY:100,movementX:180,movementY:-40});
    f.canvasEvents.get('mousemove')!({clientX:100,clientY:100,movementX:180,movementY:-40});
    expect(f.input.consumeCamera()).toEqual({x:.72,y:-.16,zoom:0});
    f.input.setFirstPerson(false);expect(f.documentStub.exitPointerLock).not.toHaveBeenCalled();
    f.windowEvents.get('mouseup')!({button:2});
    expect(f.documentStub.pointerLockElement).toBeNull();expect(f.input.dragging).toBe(false);expect(f.canvas.style.cursor).toBe('');expect(f.exit).not.toHaveBeenCalled();
    f.canvasEvents.get('mousemove')!({movementX:180,movementY:-40});expect(f.input.consumeCamera().x).toBe(0);
  });
  it('survives pointer-capture loss during acquisition and releases a late lock after a quick click',()=>{
    const f=captureFixture();f.down();f.canvasEvents.get('lostpointercapture')!({pointerId:1});expect(f.input.dragging).toBe(true);
    f.windowEvents.get('mouseup')!({button:2});expect(f.input.dragging).toBe(false);
    f.lock();expect(f.documentStub.pointerLockElement).toBeNull();expect(f.exit).not.toHaveBeenCalled();expect(f.canvas.style.cursor).toBe('');
  });
  it('distinguishes an unexpected Escape unlock from blur and modal releases',()=>{
    const f=captureFixture();f.down();f.lock();f.documentStub.pointerLockElement=null;f.documentEvents.get('pointerlockchange')!({});
    expect(f.exit).toHaveBeenCalledOnce();expect(f.input.dragging).toBe(false);
    f.down();f.lock();f.windowEvents.get('blur')!({});expect(f.documentStub.pointerLockElement).toBeNull();expect(f.exit).toHaveBeenCalledOnce();
    f.down();f.lock();f.input.setLookEnabled(false);expect(f.canvas.style.cursor).toBe('');expect(f.exit).toHaveBeenCalledOnce();
    f.down();expect(f.input.dragging).toBe(false);f.input.setLookEnabled(true);f.down();expect(f.input.dragging).toBe(true);
  });
  it('retains persistent cockpit capture on right-up and releases it when zooming out',()=>{
    const f=captureFixture();f.input.setFirstPerson(true);f.down();f.lock();f.windowEvents.get('mouseup')!({button:2});
    expect(f.documentStub.pointerLockElement).toBe(f.canvas);expect(f.canvas.style.cursor).toBe('none');
    f.input.setFirstPerson(false);expect(f.documentStub.pointerLockElement).toBeNull();expect(f.canvas.style.cursor).toBe('');expect(f.exit).not.toHaveBeenCalled();
  });
  it('retains drag fallback after a refused request and restores the cursor on release',async()=>{
    const f=captureFixture();f.canvas.requestPointerLock.mockImplementation(()=>Promise.reject(new Error('Not allowed')));f.down();await Promise.resolve();
    f.canvasEvents.get('pointermove')!({pointerId:1,clientX:125,clientY:50});expect(f.input.consumeCamera()).toEqual({x:.1,y:-.2,zoom:0});
    f.windowEvents.get('mouseup')!({button:2});expect(f.canvas.style.cursor).toBe('');expect(f.exit).not.toHaveBeenCalled();
  });
  it('ignores late relative motion after release and resumes a rapid new hold across an async unlock',()=>{
    const f=captureFixture();f.documentStub.exitPointerLock.mockImplementation(()=>{});f.down();f.lock();
    f.windowEvents.get('mouseup')!({button:2});
    f.canvasEvents.get('mousemove')!({movementX:100,movementY:100});expect(f.input.consumeCamera().x).toBe(0);
    f.down();f.documentStub.pointerLockElement=null;f.documentEvents.get('pointerlockchange')!({});
    expect(f.exit).not.toHaveBeenCalled();expect(f.canvas.requestPointerLock).toHaveBeenCalledTimes(2);expect(f.input.dragging).toBe(true);
    f.lock();f.canvasEvents.get('mousemove')!({movementX:100,movementY:0});expect(f.input.consumeCamera().x).toBe(.4);
  });
});
describe('first-person input',()=>{
  it('looks from unheld mouse movement, hides the cursor, and releases capture for UI',()=>{
    const handlers=new Map<string,(event:never)=>void>();
    const documentStub={addEventListener:vi.fn(),pointerLockElement:null as unknown,exitPointerLock:vi.fn(),querySelector:()=>null};
    const canvas={style:{cursor:''},addEventListener:(name:string,fn:(event:never)=>void)=>handlers.set(name,fn),requestPointerLock:vi.fn(()=>Promise.resolve()),focus:vi.fn()};
    vi.stubGlobal('window',{addEventListener:vi.fn()});vi.stubGlobal('document',documentStub);
    const input=new Input(canvas as unknown as HTMLCanvasElement);
    input.setFirstPerson(true);handlers.get('pointermove')!({movementX:60,movementY:-20} as never);
    expect(input.dragging).toBe(false);expect(input.consumeCamera()).toEqual({x:.09,y:-.03,zoom:0});expect(canvas.style.cursor).toBe('none');
    input.captureMouse();expect(canvas.requestPointerLock).toHaveBeenCalledOnce();documentStub.pointerLockElement=canvas;
    input.setFirstPerson(false);expect(canvas.style.cursor).toBe('');expect(documentStub.exitPointerLock).toHaveBeenCalledOnce();
    handlers.get('pointermove')!({movementX:30,movementY:30} as never);expect(input.consumeCamera().x).toBe(0);
  });
  it('routes a held drag and wheel into the overview while keeping street settings intact',()=>{
    const handlers=new Map<string,(event:never)=>void>();
    vi.stubGlobal('window',{addEventListener:vi.fn()});vi.stubGlobal('document',{addEventListener:vi.fn(),querySelector:()=>null});
    const canvas={style:{cursor:''},addEventListener:(name:string,fn:(event:never)=>void)=>handlers.set(name,fn),setPointerCapture:vi.fn(),focus:vi.fn()};
    const input=new Input(canvas as unknown as HTMLCanvasElement),camera=new T.PerspectiveCamera(),follow=new FollowCamera(camera,[]),subject=new T.Vector3(0,.512,10);
    follow.overview=true;follow.update(1/60,input,subject,false,true,true);
    const start=camera.position.clone(),street={yaw:follow.yaw,pitch:follow.pitch,distance:follow.distance};
    handlers.get('pointermove')!({clientX:100,clientY:100} as never);
    expect(input.consumeCamera().x).toBe(0);
    handlers.get('pointerdown')!({button:0,pointerId:1,clientX:100,clientY:100} as never);
    handlers.get('pointermove')!({pointerId:1,clientX:220,clientY:25} as never);
    handlers.get('wheel')!({deltaY:-400,preventDefault:vi.fn()} as never);
    follow.update(1/60,input,subject,false,true,true);
    expect(camera.position.distanceTo(start)).toBeGreaterThan(100);
    expect({yaw:follow.yaw,pitch:follow.pitch,distance:follow.distance}).toEqual(street);
    handlers.get('pointercancel')!({pointerId:1} as never);
    handlers.get('pointermove')!({clientX:400,clientY:100} as never);
    expect(input.dragging).toBe(false);expect(input.consumeCamera()).toEqual({x:0,y:0,zoom:0});
  });
  it('releases capture on zoom/UI changes without treating that release as Escape',()=>{
    const documentEvents=new Map<string,()=>void>();
    const documentStub={pointerLockElement:null as unknown,querySelector:()=>null,addEventListener:(name:string,fn:()=>void)=>documentEvents.set(name,fn),exitPointerLock:()=>{documentStub.pointerLockElement=null;documentEvents.get('pointerlockchange')!();}};
    vi.stubGlobal('window',{addEventListener:vi.fn()});vi.stubGlobal('document',documentStub);
    const canvas={style:{cursor:''},addEventListener:vi.fn()},input=new Input(canvas as unknown as HTMLCanvasElement);
    input.onCaptureExit=vi.fn();input.setFirstPerson(true);documentStub.pointerLockElement=canvas;
    input.setFirstPerson(false);expect(input.onCaptureExit).not.toHaveBeenCalled();expect(canvas.style.cursor).toBe('');
    input.setFirstPerson(true);input.captureMouse();documentStub.pointerLockElement=null;documentEvents.get('pointerlockchange')!();
    expect(input.onCaptureExit).toHaveBeenCalledOnce();
  });
  it('routes either mouse button and touch drag to view steering and clears capture',()=>{
    const handlers=new Map<string,(event:never)=>void>();
    vi.stubGlobal('window',{addEventListener:vi.fn()});vi.stubGlobal('document',{addEventListener:vi.fn(),querySelector:()=>null,pointerLockElement:null});
    const canvas={style:{cursor:''},addEventListener:(name:string,fn:(event:never)=>void)=>handlers.set(name,fn),setPointerCapture:vi.fn(),focus:vi.fn()};
    const input=new Input(canvas as unknown as HTMLCanvasElement);
    for(const [button,pointerType] of [[0,'mouse'],[2,'mouse'],[0,'touch']] as const){
      handlers.get('pointerdown')!({button,pointerType,pointerId:1,clientX:100,clientY:100} as never);
      handlers.get('pointermove')!({pointerId:1,clientX:125,clientY:50} as never);
      expect(input.consumeCamera()).toEqual({x:.1,y:-.2,zoom:0});
      handlers.get('lostpointercapture')!({pointerId:1} as never);expect(input.dragging).toBe(false);
    }
    input.clear();expect(input.consumeCamera()).toEqual({x:0,y:0,zoom:0});
  });
});
