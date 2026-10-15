import {describe,it,expect,vi} from 'vitest';
import * as T from 'three';
import {StaticShadowCache} from '../src/scenes/static-shadow-cache';

function fixture() {
  const scene=new T.Scene(),sun=new T.DirectionalLight(),camera=new T.PerspectiveCamera();sun.shadow.mapSize.setScalar(16);
  const fixed=new T.Mesh(),moving=new T.Mesh();fixed.matrixWorldAutoUpdate=false;fixed.castShadow=moving.castShadow=true;scene.add(fixed,moving);
  let target:T.WebGLRenderTarget|null=null;const passes:boolean[][]=[];
  const gl={FRAMEBUFFER_BINDING:1,READ_FRAMEBUFFER:2,DRAW_FRAMEBUFFER:3,COLOR_BUFFER_BIT:4,DEPTH_BUFFER_BIT:8,NEAREST:16,
    getParameter:vi.fn(()=>target),bindFramebuffer:vi.fn(),blitFramebuffer:vi.fn()};
  const renderer={
    shadowMap:{enabled:true},clear:vi.fn(),initRenderTarget:vi.fn(),getContext:()=>gl,resetState:()=>{target=null;},
    getRenderTarget:()=>target,setRenderTarget:(next:T.WebGLRenderTarget|null)=>{target=next;},
    render:vi.fn(()=>{target=sun.shadow.map;renderer.clear();passes.push([fixed.castShadow,moving.castShadow]);target=null;renderer.clear();}),
  };
  const cache=new StaticShadowCache(renderer as unknown as T.WebGLRenderer,sun);
  return {cache,renderer,scene,sun,camera,fixed,moving,passes,gl};
}
describe('exact stationary shadow caching',()=>{
  it('captures stationary casters once, copies depth as well as color, and keeps moving shadows live',()=>{
    const {cache,renderer,scene,sun,camera,fixed,moving,passes,gl}=fixture(),clear=renderer.clear;
    cache.render(scene,camera,true);
    expect(passes).toEqual([[true,false],[false,true]]);expect(renderer.clear).toBe(clear);
    expect(fixed.visible&&moving.visible).toBe(true);expect(sun.shadow.map?.depthTexture?.isDepthTexture).toBe(true);
    expect(gl.blitFramebuffer).toHaveBeenCalledTimes(2);
    expect(gl.blitFramebuffer).toHaveBeenLastCalledWith(0,0,16,16,0,0,16,16,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);
    expect(gl.getParameter).toHaveBeenCalledTimes(2);
    cache.render(scene,camera,true);expect(passes.at(-1)).toEqual([false,true]);expect(passes).toHaveLength(3);expect(gl.getParameter).toHaveBeenCalledTimes(2);
    cache.invalidate();expect(fixed.castShadow&&moving.castShadow).toBe(true);
  });
  it('restores casters for intro/replay and frees textures when low graphics disables shadows',()=>{
    const {cache,renderer,scene,sun,camera,fixed}=fixture();cache.render(scene,camera,true);
    const target=Reflect.get(cache,'cache') as T.WebGLRenderTarget,dispose=vi.spyOn(target,'dispose');
    cache.render(scene,camera,false);expect(fixed.castShadow).toBe(true);expect(dispose).toHaveBeenCalledOnce();
    expect(Reflect.get(cache,'cache')).toBeNull();cache.render(scene,camera,true);expect(fixed.castShadow).toBe(false);
    renderer.shadowMap.enabled=false;cache.render(scene,camera,true);expect(fixed.castShadow).toBe(true);expect(sun.shadow.map).toBeNull();
  });
  it('falls back to normal shadows after a copy failure and always restores temporary state',()=>{
    const {cache,renderer,scene,camera,fixed,moving,gl}=fixture(),clear=renderer.clear;
    gl.blitFramebuffer.mockImplementation(()=>{throw Error('GPU copy unavailable');});
    const warning=vi.spyOn(console,'warn').mockImplementation(()=>{});
    try{
      expect(()=>cache.render(scene,camera,true)).not.toThrow();expect(renderer.clear).toBe(clear);
      expect(fixed.castShadow&&moving.castShadow).toBe(true);expect(Reflect.get(cache,'cache')).toBeNull();
      expect(warning).toHaveBeenCalledOnce();const copies=gl.blitFramebuffer.mock.calls.length;
      cache.render(scene,camera,true);expect(gl.blitFramebuffer.mock.calls.length).toBe(copies);
    }finally{warning.mockRestore();}
  });
});
