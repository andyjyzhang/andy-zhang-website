// One stud = 8 mm. One plate = 3.2 mm. Match the existing minifigure rig.
export const LDRAW_SCALE = .032;
export const STUD = 20 * LDRAW_SCALE;
export const PLATE = 8 * LDRAW_SCALE;
export const BRICK = 3 * PLATE;
export const snapStud = (v: number) => Math.round(v / (STUD / 2)) * (STUD / 2);
export const snapPlate = (v: number) => Math.round(v / PLATE) * PLATE;
export interface RectPart { id: string; w: number; d: number; h: number; kind: 'brick' | 'plate' | 'tile' }
const entries = (kind: RectPart['kind'], h: number, parts: [string, number, number][]): RectPart[] => parts.map(([id,w,d])=>({id,w,d,h,kind}));
export const RECT_PARTS = [
  ...entries('brick',3,[['3007',8,2],['2456',6,2],['3001',4,2],['3002',3,2],['3003',2,2],['3008',8,1],['3009',6,1],['3010',4,1],['3622',3,1],['3004',2,1],['3005',1,1]]),
  ...entries('plate',1,[['91405',16,16],['3035',8,4],['3032',6,4],['3031',4,4],['3034',8,2],['3795',6,2],['3020',4,2],['3021',3,2],['3022',2,2],['3460',8,1],['3666',6,1],['3710',4,1],['3623',3,1],['3023',2,1],['3024',1,1]]),
  ...entries('tile',1,[['90498',16,8],['87079',4,2],['3068b',2,2],['4162',8,1],['6636',6,1],['2431',4,1],['63864',3,1],['3069b',2,1],['3070b',1,1]]),
];
export interface Placement { part: RectPart; x: number; z: number; rotated: boolean }
export function coverRectangle(w: number,d: number,kind: RectPart['kind']): Placement[] {
  const occupied=new Uint8Array(w*d),result:Placement[]=[];
  const candidates=RECT_PARTS.filter(p=>p.kind===kind).flatMap(part=>[{part,w:part.w,d:part.d,rotated:false},...(part.w!==part.d?[{part,w:part.d,d:part.w,rotated:true}]:[])]).sort((a,b)=>b.w*b.d-a.w*a.d);
  for(let z=0;z<d;z++)for(let x=0;x<w;x++) {
    if(occupied[z*w+x])continue;
    const p=candidates.find(p=>{
      if(x+p.w>w||z+p.d>d)return false;
      for(let a=x;a<x+p.w;a++)for(let b=z;b<z+p.d;b++)if(occupied[b*w+a])return false;
      return true;
    })!;
    for(let a=x;a<x+p.w;a++)for(let b=z;b<z+p.d;b++)occupied[b*w+a]=1;
    result.push({part:p.part,x:x+p.w/2-w/2,z:z+p.d/2-d/2,rotated:p.rotated});
  }
  return result;
}
export const LEGO_COLORS = ['#05131d','#f4f4f4','#9ba19d','#6c6e68','#e4cd9e','#958a73','#a0bcac','#9b9a5a','#6074a1','#0a3463','#5a93db','#078bc9','#008f9b','#582a12','#a95500','#fe8a18','#f2cd37','#720e0f','#c91a09','#237841','#4b9f4a','#bbe90b','#d67572'];
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const colorCache=new Map<string,string>();
export function legoColor(color:string) {
  if(color.startsWith('@'))return color;
  if(!colorCache.has(color)) {
    const target=rgb(color);
    colorCache.set(color,LEGO_COLORS.reduce((best,c)=>rgb(c).reduce((sum,v,i)=>sum+(v-target[i])**2,0)<rgb(best).reduce((sum,v,i)=>sum+(v-target[i])**2,0)?c:best,LEGO_COLORS[0]));
  }
  return colorCache.get(color)!;
}
