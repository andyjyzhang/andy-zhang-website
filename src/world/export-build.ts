import * as T from 'three';
import { LDRAW_SCALE,legoColor } from './part-catalog';
interface Placement {file:string;color:string;matrix:T.Matrix4}
// LDraw color codes; printed signs are custom stickers and exported as plain tiles.
const colors:Record<string,number>={'#05131d':0,'#f4f4f4':15,'#9ba19d':71,'#6c6e68':72,'#e4cd9e':19,'#958a73':28,'#a0bcac':378,'#9b9a5a':330,'#6074a1':379,'#0a3463':272,'#5a93db':73,'#078bc9':321,'#008f9b':3,'#582a12':70,'#a95500':484,'#fe8a18':25,'#f2cd37':14,'#720e0f':320,'#c91a09':4,'#237841':2,'#4b9f4a':10,'#bbe90b':27,'#d67572':12,'@cyan':43,'@clear':47,'@amber':46,'@red':36};
const coordinate=new T.Matrix4().makeScale(1/LDRAW_SCALE,-1/LDRAW_SCALE,-1/LDRAW_SCALE);
const format=(v:number)=>String(Number(v.toFixed(4)));
export function exportBuild(root:T.Object3D,name:string) {
  root.updateWorldMatrix(true,true);const lines=[`0 ${name}`,`0 Name: ${name.replaceAll(' ','-')}.ldr`,'0 Author: Andy Zhang / Andy’s World','0 Unofficial model; standard parts and attributed LDraw molds.','0 Printed sign graphics are custom stickers on the listed tiles.','0 Digital assembly; stability and part/color availability require physical validation.'];
  const inventory=new Map<string,number>();
  const emit=(p:Placement,world:T.Matrix4)=>{
    const m=coordinate.clone().multiply(world).multiply(p.matrix),e=m.elements,color=colors[legoColor(p.color)]??15;
    lines.push(`1 ${color} ${[e[12],e[13],e[14],e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]].map(format).join(' ')} ${p.file}`);
    const key=`${p.file}/${color}`;inventory.set(key,(inventory.get(key)||0)+1);
  };
  root.traverse(o=>{
    for(let ancestor:T.Object3D|null=o;ancestor;ancestor=ancestor.parent)if(!ancestor.visible)return;
    const pieces=o.userData.placements as Placement[]|undefined;if(pieces)pieces.forEach(p=>emit(p,o.matrixWorld));
    const part=o.userData.ldrawPart as {file:string;color:string}|undefined;
    if(part)emit({...part,matrix:new T.Matrix4()},o.matrixWorld);
  });
  return{ldraw:lines.join('\n'),inventory:[...inventory].map(([key,quantity])=>({part:key.split('/')[0],color:Number(key.split('/')[1]),quantity})),pieces:[...inventory.values()].reduce((a,b)=>a+b,0)};
}
export function downloadBuild(root:T.Object3D,name:string) {
  const build=exportBuild(root,name),url=URL.createObjectURL(new Blob([build.ldraw],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=`andys-world-${name.toLowerCase().replaceAll(' ','-')}.ldr`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return build.pieces;
}
