import * as T from 'three';
interface Buffer {mesh:T.InstancedMesh;original:Float32Array;ordered:Float32Array;originalColors:Float32Array|null;orderedColors:Float32Array|null;births:Float32Array;up:T.Vector3;count:number;next:number;settled:number;culled:boolean}
// Animate buffers, not thousands of scene objects. Only pieces currently falling
// are updated; the complete original matrices are restored for skip/replay.
export class PieceAssembly {
  private buffers:Buffer[]=[];
  private regular:{mesh:T.Mesh;visible:boolean}[]=[];
  constructor(private root:T.Group,readonly start:number,readonly duration:number) {
    root.updateWorldMatrix(true,true);const meshes:T.InstancedMesh[]=[];
    root.traverse(o=>{if(o instanceof T.InstancedMesh)meshes.push(o);else if(o instanceof T.Mesh)this.regular.push({mesh:o,visible:o.visible});});
    const point=new T.Vector3(),matrix=new T.Matrix4();let lowest=Infinity,tallest=-Infinity,furthest=1;
    for(const mesh of meshes)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);lowest=Math.min(lowest,point.y);tallest=Math.max(tallest,point.y);furthest=Math.max(furthest,Math.hypot(point.x,point.z));}
    for(const mesh of meshes) {
      const original=mesh.instanceMatrix.array.slice() as Float32Array;
      const entries=Array.from({length:mesh.count},(_,i)=>{
        point.fromArray(original,i*16+12).applyMatrix4(mesh.matrixWorld);
        const key=.84*(point.y-lowest)/Math.max(1,tallest-lowest)+.16*Math.hypot(point.x,point.z)/furthest;
        return {index:i,key};
      }).sort((a,b)=>a.key-b.key);
      const ordered=new Float32Array(original.length),births=new Float32Array(mesh.count);
      const colors=(mesh.instanceColor?.array.slice()??null) as Float32Array|null,orderedColors=colors?new Float32Array(colors.length):null;
      entries.forEach((entry,i)=>{ordered.set(original.subarray(entry.index*16,entry.index*16+16),i*16);births[i]=start+entry.key*duration;if(colors)orderedColors!.set(colors.subarray(entry.index*3,entry.index*3+3),i*3);});
      // Signs can be rotated: transform world up into each buffer's local space.
      const up=new T.Vector3(0,1,0).transformDirection(mesh.matrixWorld.clone().invert());
      this.buffers.push({mesh,original,ordered,originalColors:colors,orderedColors,births,up,count:mesh.count,next:0,settled:0,culled:mesh.frustumCulled});
    }
  }
  hide() {
    this.root.visible=false;this.regular.forEach(o=>o.mesh.visible=false);
    for(const b of this.buffers){b.mesh.count=0;b.next=b.settled=0;b.mesh.frustumCulled=false;b.mesh.instanceMatrix.array.set(b.ordered);b.mesh.instanceMatrix.needsUpdate=true;if(b.orderedColors){b.mesh.instanceColor!.array.set(b.orderedColors);b.mesh.instanceColor!.needsUpdate=true;}}
  }
  update(time:number) {
    if(time<this.start)return 0;this.root.visible=true;let snapped=0;
    for(const b of this.buffers) {
      const previous=b.next,settled=b.settled;while(b.next<b.count&&b.births[b.next]<=time)b.next++;
      const array=b.mesh.instanceMatrix.array;
      for(let i=b.settled;i<b.next;i++) {
        const local=Math.min(1,(time-b.births[i])/.2),fall=(1-local)**3*(.9+(i%3)*.12),offset=i*16;
        array[offset+12]=b.ordered[offset+12]+b.up.x*fall;array[offset+13]=b.ordered[offset+13]+b.up.y*fall;array[offset+14]=b.ordered[offset+14]+b.up.z*fall;
      }
      if(b.settled<b.next||previous!==b.next)b.mesh.instanceMatrix.needsUpdate=true;
      while(b.settled<b.next&&time-b.births[b.settled]>=.2)b.settled++;
      snapped+=b.settled-settled;
      b.mesh.count=b.next;
    }
    if(time>this.start+this.duration+.2)this.regular.forEach(o=>o.mesh.visible=o.visible);
    return snapped;
  }
  restore() {
    this.root.visible=true;this.regular.forEach(o=>o.mesh.visible=o.visible);
    for(const b of this.buffers){b.mesh.count=b.count;b.mesh.frustumCulled=b.culled;b.mesh.instanceMatrix.array.set(b.original);b.mesh.instanceMatrix.needsUpdate=true;
      if(b.originalColors){b.mesh.instanceColor!.array.set(b.originalColors);b.mesh.instanceColor!.needsUpdate=true;}
    }
  }
}
