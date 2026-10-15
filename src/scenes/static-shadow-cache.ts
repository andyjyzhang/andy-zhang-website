import * as T from 'three';

// The sun and fixed station never move. Preserve their exact shadow pixels and
// depth on the GPU instead of redrawing ~2m static shadow triangles each frame.
// Moving people, props and vehicles still cast real-time, depth-tested shadows.
export class StaticShadowCache {
  private cache:T.WebGLRenderTarget|null=null;
  private casters:T.Mesh[]=[];
  private framebuffers=new Map<T.WebGLRenderTarget,WebGLFramebuffer>();
  private failed=false;
  constructor(private renderer:T.WebGLRenderer,private sun:T.DirectionalLight,private enabled=true){}

  invalidate(releaseMap=false) {
    for(const mesh of this.casters)mesh.castShadow=true;
    this.casters.length=0;this.cache?.dispose();this.cache=null;this.framebuffers.clear();
    if(releaseMap){this.sun.shadow.map?.dispose();this.sun.shadow.map=null;}
  }

  render(scene:T.Scene,camera:T.Camera,allowCache:boolean) {
    const renderer=this.renderer;
    if(!allowCache||!renderer.shadowMap.enabled||!this.enabled||this.failed) {
      if(this.cache)this.invalidate(!renderer.shadowMap.enabled);
      renderer.render(scene,camera);return;
    }
    try {
      if(!this.cache)this.capture(scene,camera);
      const clear=renderer.clear;
      // Three clears a shadow target immediately before drawing its casters.
      // Restore cached color + depth after that clear, then let moving casters
      // render normally. Never intercept a main-frame clear or retain the hook.
      renderer.clear=(color=true,depth=true,stencil=true)=>{
        clear.call(renderer,color,depth,stencil);
        const target=this.sun.shadow.map;
        if(target&&renderer.getRenderTarget()===target)this.copy(this.cache!,target);
      };
      try{renderer.render(scene,camera);}finally{renderer.clear=clear;}
    }catch(error) {
      this.invalidate();this.failed=true;
      console.warn('Static shadow cache unavailable; using normal shadows.',error);
      renderer.render(scene,camera);
    }
  }

  private target() {
    const {x,y}=this.sun.shadow.mapSize;
    return new T.WebGLRenderTarget(x,y,{
      minFilter:T.NearestFilter,magFilter:T.NearestFilter,
      depthTexture:new T.DepthTexture(x,y,T.UnsignedIntType),
    });
  }

  private capture(scene:T.Scene,camera:T.Camera) {
    const renderer=this.renderer,shadow=this.sun.shadow,dynamic:T.Mesh[]=[];
    // Attach a copyable depth texture before Three allocates the shadow target.
    if(!shadow.map?.depthTexture){shadow.map?.dispose();shadow.map=this.target();shadow.camera.updateProjectionMatrix();}
    scene.traverse(object=>{
      if(object instanceof T.Mesh&&object.castShadow) {
        if(!object.matrixWorldAutoUpdate)this.casters.push(object);
        else dynamic.push(object);
      }
    });
    this.cache=this.target();renderer.initRenderTarget(this.cache);
    // First frame only: render static shadows, cache them, then immediately
    // render the complete correct frame before the browser presents anything.
    for(const mesh of dynamic)mesh.castShadow=false;
    try{
      renderer.render(scene,camera);this.copy(shadow.map,this.cache);
    }finally{for(const mesh of dynamic)mesh.castShadow=true;}
    for(const mesh of this.casters)mesh.castShadow=false;
  }

  private copy(source:T.WebGLRenderTarget,target:T.WebGLRenderTarget) {
    const renderer=this.renderer,previous=renderer.getRenderTarget(),gl=renderer.getContext();
    if(!('blitFramebuffer' in gl))throw new Error('Shadow caching requires WebGL 2');
    const framebuffer=(renderTarget:T.WebGLRenderTarget)=>{
      if(!this.framebuffers.has(renderTarget)) {
        renderer.setRenderTarget(renderTarget);
        const handle=gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer|null;
        if(!handle)throw new Error('Shadow framebuffer unavailable');
        this.framebuffers.set(renderTarget,handle);
      }
      return this.framebuffers.get(renderTarget)!;
    };
    try{
      const from=framebuffer(source),to=framebuffer(target);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER,from);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,to);
      gl.blitFramebuffer(0,0,source.width,source.height,0,0,target.width,target.height,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);
    }finally{
      // Use Three's supported raw-WebGL interop reset. The two framebuffer
      // handles are queried once, not every frame: texture-copy helpers query
      // unpack state repeatedly and otherwise introduce GPU/CPU sync stalls.
      renderer.resetState();renderer.setRenderTarget(previous);
    }
  }
}
