import * as T from 'three';
import { BrickBatch } from './brick-kit';
import { STUD,PLATE,legoColor } from './part-catalog';
// Streets, intersections and markings share one layer of tiles. Painting replaces
// a cell's color instead of putting a second intersecting piece over the first.
export class SurfaceGrid {
  private cells:string[];
  constructor(readonly width:number,readonly depth:number,color:string){this.cells=Array(width*depth).fill(legoColor(color));}
  stack(color:string,x:number,_bottom:number,z:number,w:number,_height:number,d:number,_top?:string) {
    const left=Math.round(x/STUD+this.width/2-w/2),back=Math.round(z/STUD+this.depth/2-d/2);color=legoColor(color);
    for(let a=Math.max(0,left);a<Math.min(this.width,left+w);a++)for(let b=Math.max(0,back);b<Math.min(this.depth,back+d);b++)this.cells[b*this.width+a]=color;
  }
  box(color:string,x:number,_y:number,z:number,w:number,_h:number,d:number){this.stack(color,x,PLATE,z,Math.max(1,Math.round(w/STUD)),1,Math.max(1,Math.round(d/STUD)));}
  build(parent:T.Object3D) {
    const used=new Uint8Array(this.cells.length),b=new BrickBatch();
    for(let z=0;z<this.depth;z++)for(let x=0;x<this.width;x++) {
      const index=z*this.width+x;if(used[index])continue;const color=this.cells[index];
      let w=1;while(x+w<this.width&&!used[index+w]&&this.cells[index+w]===color)w++;
      let d=1;
      rows:while(z+d<this.depth) {
        for(let a=0;a<w;a++)if(used[(z+d)*this.width+x+a]||this.cells[(z+d)*this.width+x+a]!==color)break rows;
        d++;
      }
      for(let a=x;a<x+w;a++)for(let c=z;c<z+d;c++)used[c*this.width+a]=1;
      b.stack(color,(x+w/2-this.width/2)*STUD,PLATE,(z+d/2-this.depth/2)*STUD,w,1,d,'tile');
    }
    return b.build(parent,'continuous-tile-surface');
  }
}
