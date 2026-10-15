import {Euler,Matrix4,Quaternion,Vector3} from 'three';
import {LDRAW_SCALE} from './part-catalog';

export interface Placement {file:string;color:string;matrix:Matrix4}

// CAD export is on demand. Retain six full-precision numbers per placement,
// not a Matrix4, its JS array and another object for every brick in the city.
// Rendering/intro use their independent instance buffers and never decode this.
export class PlacementStore implements Iterable<Placement> {
  private values:number[]|Float64Array=[];
  private finishes:{file:string;color:string}[]=[];
  private finishIds=new Map<string,number>();
  get length(){return this.values.length/6;}
  get byteLength(){return this.values.length*8;}

  add(file:string,color:string,x:number,y:number,z:number,rotationX:number,rotationY:number) {
    const key=`${file}/${color}`;
    let id=this.finishIds.get(key);
    if(id===undefined){id=this.finishes.length;this.finishIds.set(key,id);this.finishes.push({file,color});}
    if(this.values instanceof Float64Array)this.values=Array.from(this.values);
    this.values.push(id,x,y,z,rotationX,rotationY);
  }

  compact(){if(Array.isArray(this.values))this.values=new Float64Array(this.values);}

  *[Symbol.iterator]():Generator<Placement> {
    const rotation=new Euler(),quaternion=new Quaternion(),position=new Vector3(),scale=new Vector3().setScalar(LDRAW_SCALE),matrix=new Matrix4();
    for(let i=0;i<this.values.length;i+=6) {
      const data=this.values,finish=this.finishes[data[i]];
      position.set(data[i+1],data[i+2],data[i+3]);rotation.set(data[i+4],data[i+5],0);quaternion.setFromEuler(rotation);
      matrix.compose(position,quaternion,scale);
      yield {...finish,matrix:matrix.clone()};
    }
  }

  forEach(visit:(placement:Placement,index:number)=>void){let index=0;for(const placement of this)visit(placement,index++);}
}
