import * as T from 'three';
import {BrickBatch} from './brick-kit';
import {PLATE as H} from './part-catalog';
import {ENGINE_PODS,octagonalCourse} from './station-hull';

// Fixed catalog pieces: energy moves down the plume without stretching bricks,
// uploading instance transforms, creating particles or adding real-time lights.
export class BoosterExhaust {
  readonly root:T.Group;
  readonly flowTime={value:0};readonly motion={value:1};
  private elapsed=0;
  constructor(parent:T.Object3D) {
    const b=new BrickBatch();
    for(const {x,z} of ENGINE_PODS) {
      b.stack('@clear',x,-180*H,z,2,66,2);
      for(let row=0;row<22;row++)octagonalCourse(b,row<4?'@clear':'@cyan',x,(-180+row*3)*H,z,1+Math.floor(row*.4),1);
    }
    this.root=b.build(parent,'animated-booster-exhaust');
    const glowing=(core:boolean)=>{
      const material=new T.MeshStandardMaterial({color:core?'#dfffff':'#69dce8',emissive:core?'#dfffff':'#22c9ee',emissiveIntensity:core?1.3:1.1,roughness:.2,transparent:true,opacity:core?.9:.82,depthWrite:false});
      material.onBeforeCompile=shader=>{
        shader.uniforms.boosterTime=this.flowTime;shader.uniforms.boosterMotion=this.motion;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float exhaustHeight;');
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\nexhaustHeight = (instanceMatrix * vec4(position, 1.0)).y;\n#else\nexhaustHeight = position.y;\n#endif');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float boosterTime;\nuniform float boosterMotion;\nvarying float exhaustHeight;');
        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nfloat exhaustBand = pow(0.5 + 0.5 * sin(exhaustHeight * 0.9 + boosterTime * 4.2), 3.0);\ntotalEmissiveRadiance *= mix(0.6, 0.35 + 1.4 * exhaustBand, boosterMotion);');
      };
      material.customProgramCacheKey=()=> 'station-exhaust-v1';return material;
    };
    const core=glowing(true),shell=glowing(false);
    this.root.traverse(o=>{if(o instanceof T.InstancedMesh){o.material=(o.material as T.MeshStandardMaterial).emissiveIntensity<.1?core:shell;o.castShadow=false;o.receiveShadow=false;}});
  }
  update(dt:number,reduced:boolean) {
    if(!reduced)this.elapsed+=dt;
    this.flowTime.value=this.elapsed;this.motion.value=reduced?0:1;
  }
}
