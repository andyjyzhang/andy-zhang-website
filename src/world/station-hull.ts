import {BrickBatch} from './brick-kit';
import {STUD as S,PLATE as H} from './part-catalog';

export const ENGINE_PODS=[-123.52,123.52].flatMap(x=>[-72.96,0,72.96].map(z=>({x,z})));

// Octagonal courses are packed from real rectangular parts. The engine bell
// and its central transparent display core have no stretched cylinder meshes.
export function octagonalCourse(b:BrickBatch,color:string,x:number,y:number,z:number,r:number,hole:number,height=3) {
  for(let row=-r;row<r;row++) {
    const half=r-Math.max(0,Math.abs(row+.5)-r/2);
    const outer=Math.floor(half),inner=Math.abs(row+.5)<hole?Math.max(0,Math.floor(hole-Math.max(0,Math.abs(row+.5)-hole/2))):0;
    for(const [a,c] of inner?[[-outer,-inner],[inner,outer]]:[[-outer,outer]])if(c>a)b.stack(color,x+(a+c)*S/2,y,z+(row+.5)*S,c-a,height,1);
  }
}

export function stationHull(b:BrickBatch,w:number,d:number) {
  // Armored rim, a closed underside and two longitudinal load-bearing spines.
  b.stack('#0a3463',0,-6*H,0,w-8,6,d-8);
  for(const side of [-1,1]) {
    b.stack('#0a3463',side*(w/2-2)*S,-24*H,0,4,24,d);
    b.stack('#0a3463',0,-24*H,side*(d/2-2)*S,w-8,24,4);
    b.stack('#05131d',side*87.04,-18*H,0,12,12,d-24);
    for(const z of [-72.96,0,72.96])b.stack('#6c6e68',side*105.6,-18*H,z,46,12,12);
  }
  for(const z of [-72.96,0,72.96])b.stack('#6c6e68',0,-18*H,z,260,12,12);
  // Service hatches, vents and identification stripes on the outside of the rim.
  for(const side of [-1,1])for(let i=-5;i<=5;i++) {
    const x=i*19.2,z=side*(d/2+.5)*S;
    b.stack(i%2?'#9ba19d':'#05131d',x,-20*H,z,12,12,1);
    b.stack('#f2cd37',x,-8*H,z,12,2,1);
    for(let a=-2;a<=2;a++)b.stack('#008f9b',x+a*2*S,-18*H,z+side*S,1,8,1);
  }
  for(const {x,z} of ENGINE_PODS) {
    for(let row=0;row<30;row++) {
      const radius=row<10?16-Math.floor(row*.6):row>=27?12:10;
      const color=row<2?'#f2cd37':row<10?'#9ba19d':row%6===0?'#008f9b':'#6c6e68';
      octagonalCourse(b,color,x,(-114+row*3)*H,z,radius,row===29?0:radius-3);
    }
    // A transparent rod connects the display exhaust to the upper engine cap.
    b.stack('@cyan',x,-114*H,z,4,87,4);
    // Exterior radiator fins bridge to the collar; visible studs provide scale.
    for(const side of [-1,1]) {
      b.stack('#0a3463',x+side*7.04,-72*H,z,2,39,8,'stud');
      for(let a=-2;a<=2;a++)b.stack('#9ba19d',x+side*8,-66*H,z+a*2*S,1,24,1,'stud');
    }
  }
}
