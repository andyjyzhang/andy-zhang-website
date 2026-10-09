import { describe, expect, it } from 'vitest';
import { Locomotion, type MotionInput } from '../src/player/locomotion';
const still: MotionInput = { x: 0, z: 0, running: false, jump: false, jumpHeld: false };
const tick = (p: Locomotion, input: Partial<MotionInput>, count = 60) => { for (let i = 0; i < count; i++) p.update(1 / 60, { ...still, ...input }, 0, [], true); };
describe('player movement', () => {
  it('accelerates promptly, brakes quickly, and runs farther than walking', () => {
    const walk = new Locomotion(), run = new Locomotion();
    tick(walk, { z: -1 }, 10); expect(walk.speed).toBeGreaterThan(8);
    tick(walk, {}, 10); expect(walk.speed).toBeLessThan(.06);
    walk.teleport(0, 10); tick(walk, { z: -1 }); tick(run, { z: -1, running: true });
    expect(10 - run.z).toBeGreaterThan((10 - walk.z) * 1.6);
    expect(10-walk.z).toBeGreaterThan(8);expect(10-run.z).toBeGreaterThan(13);
  });
  it('normalizes diagonals and follows camera-relative directions', () => {
    const straight = new Locomotion(), diagonal = new Locomotion();
    straight.teleport(0,20);diagonal.teleport(0,20);
    tick(straight, { z: -1 }); tick(diagonal, { x: 1, z: -1 }); expect(diagonal.distance).toBeCloseTo(straight.distance, 4);
    const rotated = new Locomotion(); rotated.update(.1, { ...still, z: -1 }, Math.PI / 2, [], true);
    expect(rotated.x).toBeLessThan(0); expect(rotated.z).toBeCloseTo(10);
  });
  it('jumps, forbids double jumping, and lands on the correct floor', () => {
    const p = new Locomotion(); tick(p, { jump: true, jumpHeld: true }, 1); const initial = p.vy;
    tick(p, { jump: true, jumpHeld: true }, 1); expect(p.vy).toBeLessThan(initial); expect(p.airborne).toBe(true);
    tick(p, {}, 60); expect(p.airborne).toBe(false); expect(p.y).toBe(.512);
  });
  it('halts at walls and pauses while reading', () => {
    const p = new Locomotion();
    for (let i = 0; i < 120; i++) p.update(1 / 60, { ...still, z: -1 }, 0, [{ x: 0, z: 7, w: 10, d: 1, height: 4 }], true);
    expect(p.z).toBeGreaterThan(8); const z = p.z; p.update(.1, { ...still, x: 1 }, 0, [], false); expect(p.z).toBe(z); expect(p.speed).toBe(0);
  });
  it('blocks a bench while walking, allows jumping over it and lands on its seat',()=>{
    const p=new Locomotion();p.teleport(0,20);
    const bench=[{x:0,z:17,w:4,d:1.28,height:1.792,bottom:.512}];
    for(let i=0;i<40;i++)p.update(1/60,{...still,z:-1},0,bench,true);
    expect(p.z).toBeGreaterThan(18.2);
    for(let i=0;i<15;i++)p.update(1/60,{...still,z:-1,jump:i===0,jumpHeld:true},0,bench,true);
    expect(p.z).toBeLessThan(18.2);
    p.x=0;p.z=17;
    for(let i=0;i<80;i++)p.update(1/60,still,0,bench,true);
    expect(p.airborne).toBe(false);expect(p.y).toBe(1.792);
  });
});
