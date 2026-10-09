import {describe,it,expect} from 'vitest';
import {blocked,moveWithCollision,safeExit} from '../src/world/collision';
import {ACTIVE_BOUNDS} from '../src/config/station';
import {BrickBatch,bench,lamp} from '../src/world/brick-kit';
const wall=[{x:0,z:0,w:4,d:8,height:6}];
describe('world collision',()=>{
  it('registers visible benches and streetlight poles at their part positions',()=>{
    const b=new BrickBatch();bench(b,0,20);lamp(b,10.24,20.48);
    expect(blocked(0,20,.62,b.colliders)).toBe(true);
    expect(blocked(10.24,20.48,.62,b.colliders)).toBe(true);
    expect(blocked(12,20.48,.62,b.colliders)).toBe(false);
  });
  it('prevents a fast car tunnelling through a wall',()=>{const p={x:-10,z:0};moveWithCollision(p,30,0,1,wall);expect(p.x).toBeLessThanOrEqual(-3);});
  it('slides along a wall without stopping both axes',()=>{const p={x:-3,z:-2};moveWithCollision(p,2,3,.6,wall);expect(p.x).toBeLessThan(-2.5);expect(p.z).toBeCloseTo(1);});
  it('keeps players on the selected world baseplate',()=>{const p={x:ACTIVE_BOUNDS.maxX-2,z:ACTIVE_BOUNDS.maxZ-2};moveWithCollision(p,100,100,.6,[]);expect(p.x).toBe(ACTIVE_BOUNDS.maxX-.6);expect(p.z).toBe(ACTIVE_BOUNDS.maxZ-.6);});
  it('finds an exit on the available side of a parked car',()=>{const p=safeExit({x:-4,z:0},0,wall);expect(p).not.toBeNull();expect(blocked(p!.x,p!.z,.65,wall)).toBe(false);});
});
