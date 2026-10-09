import {describe,it,expect} from 'vitest';
import {CITY_LOTS,STREETS,GATE} from '../src/world/city-layout';
import {TRANSIT_PIERS,TRANSIT_PATH,TRANSIT_LENGTH,sampleTransit} from '../src/world/transit';
import {STUD} from '../src/world/part-catalog';
import {landmarks,SHIP} from '../src/config/world';
const intersects=(a:{x:number;z:number;w:number;d:number},b:{x:number;z:number;w:number;d:number})=>Math.abs(a.x-b.x)<(a.w+b.w)/2-.001&&Math.abs(a.z-b.z)<(a.d+b.d)/2-.001;
describe('spaceport circulation',()=>{
  it('interleaves heights while preserving streets, landmarks and the gate',()=>{
    const lots=CITY_LOTS.map(l=>({...l,w:l.w*STUD,d:l.d*STUD}));
    expect(lots.length).toBeGreaterThanOrEqual(28);expect(new Set(lots.map(l=>l.design)).size).toBe(6);
    const exclusions=[...STREETS,...landmarks.map(l=>({x:l.x,z:l.z,w:l.width+1.28,d:l.depth+1.28})),{x:SHIP.x,z:SHIP.z,w:14.08,d:14.08},GATE];
    for(let i=0;i<lots.length;i++) {
      for(const o of exclusions)expect(intersects(lots[i],o),`${lots[i].name} overlaps a protected route`).toBe(false);
      for(const other of lots.slice(i+1))expect(intersects(lots[i],other),`${lots[i].name} overlaps ${other.name}`).toBe(false);
    }
    expect(lots.some(l=>Math.abs(l.x)<40&&l.floors>=12)).toBe(true);
    expect(lots.some(l=>Math.abs(l.x)>60&&l.floors<=3)).toBe(true);
  });
  it('keeps all elevated-transit piers out of the hangar and walk-in landmarks',()=>{
    expect(TRANSIT_PIERS.length).toBeGreaterThan(12);
    for(const p of TRANSIT_PIERS) {
      const pier={x:p.x,z:p.z,w:1.92,d:1.92};
      const protectedAreas=[{x:SHIP.x,z:SHIP.z,w:14.08,d:16.64},...landmarks.map(l=>({x:l.x,z:l.z,w:l.width,d:l.depth}))];
      for(const p of protectedAreas)expect(intersects(pier,p)).toBe(false);
      for(const s of STREETS)expect(intersects(pier,s),'support blocks a driving lane').toBe(false);
    }
  });
  it('extends a closed express loop through multiple districts without entering buildings',()=>{
    expect(TRANSIT_LENGTH).toBeGreaterThan(600);expect(TRANSIT_PATH.some(p=>p.z>85)).toBe(true);expect(TRANSIT_PATH.some(p=>p.x<-100)).toBe(true);
    expect(sampleTransit(0).position.distanceTo(sampleTransit(TRANSIT_LENGTH).position)).toBeLessThan(.001);
    for(let d=0;d<TRANSIT_LENGTH;d+=2){
      const p=sampleTransit(d).position;
      for(const l of CITY_LOTS)expect(intersects({x:p.x,z:p.z,w:5.12,d:5.12},{x:l.x,z:l.z,w:l.w*STUD,d:l.d*STUD}),'rail enters a parcel').toBe(false);
      expect(sampleTransit(d).direction.dot(sampleTransit(d+1).direction)).toBeGreaterThan(0);
    }
  });
});
