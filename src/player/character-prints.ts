import * as T from 'three';
import type { Appearance } from '../config/characters';
const materials=new Map<string,T.MeshStandardMaterial>();
const legMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.36,envMapIntensity:.35});
export function addLegPrint(leg:T.Object3D,center:number,a:Appearance) {
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const rectangle=(left:number,top:number,width:number,height:number,z:number,color:string)=>{
    const index=positions.length/3,c=new T.Color(color);
    positions.push(center+left,top,z,center+left+width,top,z,center+left+width,top+height,z,center+left,top+height,z);
    for(let i=0;i<4;i++)colors.push(c.r,c.g,c.b);indices.push(index,index+2,index+1,index,index+3,index+2);
  };
  // Printed shoes, soles/laces and a small cargo-pocket seam on the real molds.
  rectangle(-7,22,14,5.7,-11.28,'#05131d');rectangle(-7,27,14,.7,-11.29,'#9ba19d');
  for(const y of [22.8,24,25.2])rectangle(-3,y,6,.4,-11.3,a.accentColor??'#e4cd9e');
  rectangle(-5,10,10,.5,-5.78,'#05131d');rectangle(-5,10,.5,4,-5.78,'#05131d');rectangle(4.5,10,.5,4,-5.78,'#05131d');
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const print=new T.Mesh(geometry,legMaterial);print.userData.sticker=true;leg.add(print);
}
function printMaterial(a:Appearance,kind:'front'|'back') {
  const key=JSON.stringify([a,kind]);if(materials.has(key))return materials.get(key)!;
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const c=canvas.getContext('2d')!;
  c.fillStyle=a.torsoColor;c.fillRect(0,0,256,256);
  const ink='#17212b',light=a.accentColor??'#e4cd9e';c.lineCap='round';c.lineJoin='round';
  const line=(points:number[],color=ink,width=5)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke();};
  if(kind==='back') {
    line([48,205,208,205],ink,4);line([57,48,128,91,199,48],light,6);
    if(a.torso==='engineer'||a.torso==='flight'){c.fillStyle=light;c.fillRect(62,115,132,21);c.fillStyle=ink;c.font='bold 16px sans-serif';c.textAlign='center';c.fillText(a.torso==='flight'?'FLIGHT CREW':'WORKSHOP',128,131);}
  } else {
    line([41,207,215,207],ink,5);
    if(a.torso==='hoodie') {
      line([57,15,128,58,199,15],ink,5);line([94,47,89,92],light,4);line([162,47,167,92],light,4);
      line([128,61,128,201],ink,3);line([86,144,64,165,64,187,192,187,192,165,170,144],ink,4);
      c.fillStyle=light;c.beginPath();c.roundRect(164,105,22,14,4);c.fill();
    } else if(a.torso==='knit') {
      for(let y=60;y<198;y+=22)line([34,y,69,y+8,104,y,139,y+8,174,y,209,y+8,233,y],light,4);
      line([88,4,128,38,168,4],ink,7);
    } else if(a.torso==='jacket') {
      c.fillStyle=light;c.beginPath();c.moveTo(66,0);c.lineTo(111,66);c.lineTo(94,4);c.fill();c.beginPath();c.moveTo(190,0);c.lineTo(145,66);c.lineTo(162,4);c.fill();
      line([128,42,128,202],light,3);for(const x of [60,163]){line([x,118,x+33,118,x+33,155,x,155,x,118],ink,4);line([x,113,x+33,113],light,3);}
    } else {
      c.fillStyle=light;for(const x of [64,179])c.fillRect(x,29,13,175);c.fillRect(44,137,168,13);
      c.fillStyle=ink;c.fillRect(92,57,73,55);c.fillStyle=light;c.font='bold 18px monospace';c.fillText(a.torso==='flight'?'07':'AW',110,82);
      for(let i=0;i<3;i++){c.fillStyle=['#c91a09','#f2cd37','#008f9b'][i];c.fillRect(101+i*19,93,10,9);}
    }
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
  const mat=new T.MeshStandardMaterial({map:texture,roughness:.36,metalness:0,envMapIntensity:.35});materials.set(key,mat);return mat;
}
export function addCharacterPrints(torso:T.Object3D,a:Appearance) {
  if(typeof document==='undefined')return;
  if(a.torso!=='plain')for(const back of [false,true]) {
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute([-13,2,back?10.035:-10.035,13,2,back?10.035:-10.035,18,30,back?10.035:-10.035,-18,30,back?10.035:-10.035],3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));geometry.setIndex(back?[0,1,2,0,2,3]:[0,2,1,0,3,2]);geometry.computeVertexNormals();
    const mesh=new T.Mesh(geometry,printMaterial(a,back?'back':'front'));mesh.userData.sticker=true;torso.add(mesh);
  }
}
