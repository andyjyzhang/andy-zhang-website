import * as T from 'three';
import {BrickBatch,palette as P,sign} from './brick-kit';
import {STUD as S,PLATE as H} from './part-catalog';
import {standingPart,frontPart} from './part-placement';
import type {BuildingDesign} from './city-layout';

const schemes:Record<BuildingDesign,string[]>={
  factory:['#6c6e68','#0a3463','#9ba19d'],warehouse:['#fe8a18','#008f9b','#6c6e68'],
  apartments:['#e4cd9e','#f4f4f4','#008f9b'],terrace:['#f4f4f4','#0a3463','#9ba19d'],
  civic:['#f4f4f4','#e4cd9e','#0a3463'],arcade:['#0a3463','#720e0f','#008f9b'],
};
export const buildingColor=(design:BuildingDesign,variant:number)=>schemes[design][variant%3];

function floorDeck(b:BrickBatch,w:number,d:number,deckW:number,deckD:number,y:number,color:string) {
  b.stack(color,0,y,0,w,1,d);
  const ew=(deckW-w)/2,ed=(deckD-d)/2;
  for(const side of [-1,1]){
    if(ed)b.stack(color,0,y,side*(d+ed)*S/2,deckW,1,ed,'stud');
    if(ew)b.stack(color,side*(w+ew)*S/2,y,0,ew,1,d,'stud');
  }
}

// Wide recessed bays, supported sills, piers and cornices. Each wall is packed
// independently with non-intersecting catalog pieces rather than 1x1 color cells.
function facade(b:BrickBatch,w:number,d:number,y:number,body:string,trim:string,accent:string,variant:number) {
  for(const side of [-1,1])for(const axis of [0,1]) {
    const length=axis?d-2:w,edge=(axis?w-1:d-1)*S/2*side;
    const wall=(color:string,u:number,bottom:number,span:number,height:number,recess=0)=>{
      b.stack(color,axis?edge-side*recess*S:u,bottom,axis?u:edge-side*recess*S,axis?1:span,height,axis?span:1);
    };
    wall(trim,0,y+H,length,3);wall(body,0,y+13*H,length,3);
    const corner=axis?1:2,inner=length-corner*2;
    for(const end of [-1,1])wall(body,end*(length-corner)*S/2,y+4*H,corner,9);
    let offset=0;
    while(offset<inner) {
      const span=Math.min(variant%2?4:3,inner-offset),center=(offset+span/2-inner/2)*S;
      wall('#0a3463',center,y+4*H,span,2,1);
      wall(accent,center,y+6*H,span,1,1);
      wall('#0a3463',center,y+7*H,span,6,1);
      offset+=span;
      if(offset<inner){wall(body,(offset+.5-inner/2)*S,y+4*H,1,9);offset++;}
    }
  }
}

function rooftop(b:BrickBatch,w:number,d:number,y:number,design:BuildingDesign,accent:string,variant:number) {
  if(design==='warehouse') {
    // Twin pressure vessels, sawtooth vents and a raised service gantry.
    for(const side of [-1,1]) {
      const x=side*Math.max(2,w/4)*S;
      b.stack('#05131d',x,y,0,4,1,4);
      for(let a=0;a<5;a++)standingPart(b,'roundBrick','#9ba19d',x,y+(1+a*3)*H,0);
      standingPart(b,'dish',accent,x,y+16*H,0);
    }
    for(let i=-1;i<=1;i++)standingPart(b,'slope',accent,i*3*S,y,-(d/2-2)*S);
    b.stack('#f2cd37',0,y,(d/2-2)*S,Math.max(2,w-4),3,2,'stud');
  } else if(design==='factory') {
    // A staggered communications mast and a faceted cooling chimney.
    b.stack('#f2cd37',-w*S/4,y,0,2,18,2,'stud');
    b.stack('#f2cd37',0,y+18*H,0,Math.max(4,w/2),2,2,'stud');
    b.stack('#05131d',w*S/4,y,0,4,12,4,'stud');
    standingPart(b,'dish','@cyan',w*S/4,y+12*H,0);
    standingPart(b,'antenna',P.ink,-w*S/4,y+18*H,0);
  } else if(design==='apartments') {
    // A habitat canopy with native slopes and a small receiver.
    b.stack(accent,0,y,0,Math.max(4,w-4),3,Math.max(4,d-4),'stud');
    for(const side of [-1,1])for(let i=-1;i<=1;i++)standingPart(b,'slope','#f4f4f4',i*2*S,y+3*H,side*S,side<0?Math.PI:0);
    b.stack('#05131d',0,y+3*H,-Math.max(2,d/4)*S,2,9,2,'stud');
    standingPart(b,'antenna',accent,0,y+12*H,-Math.max(2,d/4)*S);
  } else if(design==='terrace') {
    // A real landing pad and connected radiator comb.
    b.stack('#05131d',0,y,0,Math.max(6,w-2),1,Math.max(6,d-2),'stud');
    if(w>=10&&d>=10){
      for(const side of [-1,1])b.stack('#f2cd37',side*1.5*S,y+H,0,1,1,6,'tile');
      b.stack('#f2cd37',0,y+H,0,2,1,1,'tile');
    }
    for(let i=0;i<4;i++)b.stack('#9ba19d',(i-1.5)*S,y,-(d-1)*S/2,1,8,1,'stud');
    b.stack(accent,(w/2-2)*S,y+H,(d/2-2)*S,2,10,2,'stud');
    standingPart(b,'dish','@cyan',(w/2-2)*S,y+11*H,(d/2-2)*S);
  } else if(design==='civic') {
    // Stepped data crown, large dish and offset receiver spikes.
    for(let i=0;i<3;i++)b.stack(i===1?'#f2cd37':accent,0,y+i*6*H,0,Math.max(4,w-i*4),6,Math.max(4,d-i*4),'stud');
    standingPart(b,'dish','@cyan',0,y+18*H,0);
    for(const side of [-1,1]){
      b.stack('#05131d',side*(w/2+.5)*S,y,0,1,12+variant%3*3,2,'stud');
      standingPart(b,'antenna','#f2cd37',side*(w/2+.5)*S,y+(12+variant%3*3)*H,0);
    }
  } else {
    // A brick-built signal jewel, two fins and a visible console face.
    for(let i=0;i<4;i++)b.stack(i%2?accent:'#f2cd37',0,y+i*3*H,0,Math.max(2,w-4-i*2),3,Math.max(2,d-4-i*2),'stud');
    for(const side of [-1,1])b.stack('#fe8a18',side*(w/2-1)*S,y,0,2,15,2,'stud');
    frontPart(b,'roundTile','@amber',0,y+6*H,d*S/2);
  }
}

export function spaceBuilding(b:BrickBatch,x:number,z:number,bottom:number,w:number,d:number,floors:number,color:string,design:BuildingDesign,variant=0) {
  const accent=design==='factory'?'#f2cd37':design==='arcade'?(variant%2?'#c91a09':'#fe8a18'):'#008f9b';
  const trim=design==='apartments'?'#f4f4f4':'#05131d';
  let lastW=w,lastD=d,lastX=0;
  b.withOffset(x,bottom,z,()=>{
    for(let f=0;f<floors;f++) {
      const stepped=design==='terrace'||design==='civic',inset=stepped?Math.floor(f/(design==='terrace'?3:4))*2:0;
      const fw=Math.max(6,w-(design==='factory'||design==='arcade'?4:design==='apartments'?2:0)-inset*2);
      const fd=Math.max(6,d-(design==='factory'||design==='apartments'?4:2)-inset*2);
      const fx=design==='civic'?Math.min(inset/2,(w-fw)/2)*S:design==='arcade'&&w>=10?(f%4<2?-1:1)*S:0;
      const y=f*16*H,deckW=Math.min(w,Math.max(fw+2,lastW)),deckD=Math.min(d,Math.max(fd+2,lastD));
      b.withOffset(fx,0,0,()=>{
        floorDeck(b,fw,fd,deckW,deckD,y,trim);
        facade(b,fw,fd,y,color,trim,accent,variant+f%2);
        if(design==='apartments'&&f%2===1) {
          for(const side of [-1,1]) {
            const bx=side*Math.max(1,fw/4)*S;
            b.stack(accent,bx,y+H,(fd/2+.5)*S,Math.min(5,fw/2),3,1);
            b.stack('#f4f4f4',bx,y+4*H,(fd/2+1)*S,Math.min(5,fw/2),1,2,'stud');
            standingPart(b,'fence',accent,bx,y+5*H,(fd/2+1.5)*S);
          }
        } else if(design==='factory'&&f%3===0) {
          for(const side of [-1,1]) {
            const px=side*(fw/2-1)*S,pz=(fd/2+1)*S;
            b.stack('#05131d',px,y+H,pz,2,1,2);
            for(let i=0;i<3;i++)standingPart(b,'roundBrick','#9ba19d',px,y+(2+i*3)*H,pz);
            standingPart(b,'conePart',accent,px,y+11*H,pz);
          }
        } else if(design==='terrace'&&f>0&&f%3===0) {
          for(const side of [-1,1])standingPart(b,'fence',accent,side*fw*S/4,y+H,(fd/2+.5)*S);
        }
        if(f===0||f%4===2) {
          for(const side of [-1,1])frontPart(b,'roundTile','@amber',side*(fw/2-1)*S,y+9*H,fd*S/2);
        }
        if(f%3===1&&['warehouse','apartments','arcade'].includes(design)) {
          for(let i=-1;i<=1;i++)if(Math.abs(i*3)<fw/2-1)frontPart(b,'slope',accent,i*3*S,y+13*H,fd*S/2);
        }
      });
      lastW=fw;lastD=fd;lastX=fx;
    }
    const roof=floors*16*H;
    b.withOffset(lastX,0,0,()=>{
      b.stack(trim,0,roof,0,Math.min(w,lastW+2),1,Math.min(d,lastD+2),'stud');
      rooftop(b,lastW,lastD,roof+H,design,accent,variant);
    });
    // Distinct street-level entrance surrounds, inside each parcel's envelope.
    b.stack(accent,0,H,(d/2-.5)*S,Math.min(8,w-2),3,1,'stud');
    for(const side of [-1,1])b.stack(accent,side*Math.min(4,w/2-1)*S,4*H,(d/2-.5)*S,1,11,1,'stud');
  });
  return bottom+floors*16*H;
}
export function facilitySign(root:T.Group,name:string,x:number,z:number,d:number,w:number) {
  sign(root,name,x,3.84,z+d*S/2+.64,Math.min(18,w-2)*S,.64,'#05131d','#aee9ef');
}
