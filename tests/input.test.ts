import {describe,it,expect,vi,afterEach} from 'vitest';
import {Input} from '../src/player/input';
import * as T from 'three';
import {FollowCamera} from '../src/camera/follow-camera';
afterEach(()=>vi.unstubAllGlobals());
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
    handlers.get('pointermove')!({clientX:220,clientY:25} as never);
    handlers.get('wheel')!({deltaY:-400,preventDefault:vi.fn()} as never);
    follow.update(1/60,input,subject,false,true,true);
    expect(camera.position.distanceTo(start)).toBeGreaterThan(100);
    expect({yaw:follow.yaw,pitch:follow.pitch,distance:follow.distance}).toEqual(street);
    handlers.get('pointercancel')!({} as never);
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
    input.setFirstPerson(true);documentStub.pointerLockElement=null;documentEvents.get('pointerlockchange')!();
    expect(input.onCaptureExit).toHaveBeenCalledOnce();
  });
});
