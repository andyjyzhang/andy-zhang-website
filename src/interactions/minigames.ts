export const CUBE_COLORS=['cyan','amber','orange','blue'] as const;
export type CubeColor=typeof CUBE_COLORS[number];
export type CubePhase='preview'|'play'|'won'|'missed';

const CUBE_PATTERNS:readonly (readonly CubeColor[])[]=[
  ['cyan','amber','blue'],
  ['orange','cyan','amber','blue'],
  ['blue','orange','cyan','amber','orange'],
];

export class CubeRecall {
  round=1;score=0;phase:CubePhase='preview';input:CubeColor[]=[];
  get pattern(){return CUBE_PATTERNS[(this.round-1)%CUBE_PATTERNS.length];}
  get message(){
    if(this.phase==='preview')return 'Memorize the tiles, then hide the sequence.';
    if(this.phase==='play')return `Repeat the sequence · ${this.input.length} / ${this.pattern.length}`;
    if(this.phase==='won')return `Sequence solved · ${this.score} point${this.score===1?'':'s'}`;
    return 'That tile broke the sequence. Try this round again.';
  }
  hide(){if(this.phase==='preview'){this.phase='play';this.input=[];}}
  choose(color:CubeColor){
    if(this.phase!=='play')return false;
    const correct=this.pattern[this.input.length]===color;this.input.push(color);
    if(!correct)this.phase='missed';else if(this.input.length===this.pattern.length){this.phase='won';this.score++;}
    return correct;
  }
  retry(){this.phase='preview';this.input=[];}
  next(){this.round=this.round%CUBE_PATTERNS.length+1;this.phase='preview';this.input=[];}
  restart(){this.round=1;this.score=0;this.phase='preview';this.input=[];}
}

