export const SUITS=['clubs','diamonds','hearts','spades'] as const;
export type Suit=typeof SUITS[number];
export interface Card {rank:number;suit:Suit}
export const SUIT_SYMBOLS:Record<Suit,string>={clubs:'♣',diamonds:'♦',hearts:'♥',spades:'♠'};
export function cardRank(rank:number){return ({11:'J',12:'Q',13:'K',14:'A'} as Record<number,string>)[rank]??String(rank);}
export function cardName(card:Card){return `${({11:'jack',12:'queen',13:'king',14:'ace'} as Record<number,string>)[card.rank]??card.rank} of ${card.suit}`;}
export const HAND_SCORES={'high card':10,'one pair':35,'two pair':70,'three of a kind':100,straight:160,flush:200,'full house':260,'four of a kind':400,'straight flush':600};
export type HandName=keyof typeof HAND_SCORES;
export function evaluateHand(cards:readonly Card[]):{name:HandName;points:number}{
  if(cards.length!==5)throw new Error('A poker hand needs five cards.');
  const ranks=[...new Set(cards.map(card=>card.rank))].sort((a,b)=>a-b);
  const counts=ranks.map(rank=>cards.filter(card=>card.rank===rank).length).sort((a,b)=>b-a);
  const flush=cards.every(card=>card.suit===cards[0].suit);
  const straight=ranks.length===5&&(ranks[4]-ranks[0]===4||ranks.join(',')==='2,3,4,5,14');
  const name:HandName=straight&&flush?'straight flush':counts[0]===4?'four of a kind':counts[0]===3&&counts[1]===2?'full house':flush?'flush':straight?'straight':counts[0]===3?'three of a kind':counts[0]===2&&counts[1]===2?'two pair':counts[0]===2?'one pair':'high card';
  return{name,points:HAND_SCORES[name]};
}
export function shuffledDeck(seed:number):Card[]{
  const deck=SUITS.flatMap(suit=>Array.from({length:13},(_,i)=>({rank:i+2,suit})));let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
  return deck;
}
export const DRAW_CONTRACTS=[
  {name:'red cargo',description:'3+ red cards',bonus:20},
  {name:'ace delivery',description:'any ace',bonus:20},
  {name:'night shift',description:'3+ black cards',bonus:20},
] as const;
export class PokerDraw {
  readonly target=150;round=1;score=0;drawsLeft=2;phase:'playing'|'banked'|'won'|'lost'='playing';
  cards:Card[]=[];readonly discards=new Set<number>();lastBank=0;lastHand:HandName='high card';
  private deck:Card[]=[];
  constructor(private seed=Date.now()){this.restart();}
  get hand(){return evaluateHand(this.cards);}
  get contract(){return DRAW_CONTRACTS[this.round-1];}
  get contractComplete(){
    const reds=this.cards.filter(card=>card.suit==='hearts'||card.suit==='diamonds').length;
    return this.round===1?reds>=3:this.round===2?this.cards.some(card=>card.rank===14):5-reds>=3;
  }
  get bankValue(){return this.hand.points+(this.contractComplete?this.contract.bonus:0);}
  get message(){
    if(this.phase==='won')return `Cargo cleared! ${this.score} chips banked. You beat the ${this.target}-chip target.`;
    if(this.phase==='lost')return `${this.score} / ${this.target} chips. The crew needs a stronger run. Deal again?`;
    if(this.phase==='banked')return `${this.lastHand} · ${this.lastBank} chips banked. Next delivery, new cards.`;
    if(!this.drawsLeft)return 'No redraws left. Bank this hand to continue.';
    return this.discards.size?`${this.discards.size} card${this.discards.size===1?'':'s'} marked for replacement.`:'Keep your best cards. Select the ones you want to replace.';
  }
  toggle(index:number){if(this.phase!=='playing'||index<0||index>=5)return;if(this.discards.has(index))this.discards.delete(index);else this.discards.add(index);}
  draw(){
    if(this.phase!=='playing'||!this.drawsLeft||!this.discards.size)return false;
    for(const index of this.discards)this.cards[index]=this.deck.pop()!;
    this.drawsLeft--;this.discards.clear();return true;
  }
  bank(){
    if(this.phase!=='playing')return false;
    this.lastBank=this.bankValue;this.lastHand=this.hand.name;this.score+=this.lastBank;this.discards.clear();
    this.phase=this.round===3?(this.score>=this.target?'won':'lost'):'banked';return true;
  }
  next(){if(this.phase!=='banked')return;this.round++;this.deal();}
  restart(){this.deck=shuffledDeck(++this.seed);this.round=1;this.score=0;this.lastBank=0;this.deal();}
  private deal(){this.cards=Array.from({length:5},()=>this.deck.pop()!);this.drawsLeft=2;this.phase='playing';this.discards.clear();}
}
