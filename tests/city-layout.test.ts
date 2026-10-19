import {describe,it,expect} from 'vitest';
import {CITY_LOTS,STREETS,GATE} from '../src/world/city-layout';
import {TRANSIT_PIERS,TRANSIT_PATH,TRANSIT_LENGTH,sampleTransit} from '../src/world/transit';
import {STUD} from '../src/world/part-catalog';
import {landmarks,SHIP} from '../src/config/world';
import {STREET_FIXTURES,FIXTURE_PADS,addStreetFurniture} from '../src/world/street-furniture';
import {ACTIVITY_DEFINITIONS} from '../src/interactions/activities';
import {BrickBatch} from '../src/world/brick-kit';
import {SurfaceGrid} from '../src/world/surface-grid';
import {blocked,moveWithCollision} from '../src/world/collision';
const intersects=(a:{x:number;z:number;w:number;d:number},b:{x:number;z:number;w:number;d:number})=>Math.abs(a.x-b.x)<(a.w+b.w)/2-.001&&Math.abs(a.z-b.z)<(a.d+b.d)/2-.001;
describe('spaceport circulation',()=>{
  it('keeps curated furniture and its paving off every road, including crossing streets',()=>{
    expect(STREET_FIXTURES.filter(f=>f.kind==='lamp')).toHaveLength(36);
    expect(STREET_FIXTURES.filter(f=>f.kind==='bench')).toHaveLength(6);
    expect(STREET_FIXTURES.filter(f=>f.kind==='cargo')).toHaveLength(4);
    for(const f of STREET_FIXTURES) {
      const pad=FIXTURE_PADS[f.kind],pocket={...f,w:pad.w*STUD,d:pad.d*STUD};
      for(const road of STREETS)expect(intersects(pocket,road),`${f.id}: paving/fixture intrudes on a street`).toBe(false);
      expect(f.x/(STUD/2)).toBeCloseTo(Math.round(f.x/(STUD/2)));
      expect(f.z/(STUD/2)).toBeCloseTo(Math.round(f.z/(STUD/2)));
    }
  });
  it('leaves buildings, entrances, equipment approaches and transit supports clear',()=>{
    const protectedAreas=[...CITY_LOTS.map(l=>({x:l.x,z:l.z,w:(l.w+2)*STUD,d:(l.d+2)*STUD})),
      ...landmarks.flatMap(l=>[{x:l.x,z:l.z,w:l.width,d:l.depth},{x:l.entry[0],z:l.entry[1],w:5.12,d:5.12}]),
      {x:SHIP.x,z:SHIP.z,w:14.08,d:16.64},{x:SHIP.entry[0],z:SHIP.entry[1],w:5.12,d:5.12},
      ...ACTIVITY_DEFINITIONS.map(a=>({...a,w:3.84,d:3.84})),
      ...TRANSIT_PIERS.map(p=>({...p,w:1.92,d:1.92})),
      // Courier's whole delivery route, rather than only its starting position.
      {x:-66.56,z:15.36,w:3.2,d:23.04},
    ];
    for(const f of STREET_FIXTURES) {
      const footprint={...f,w:f.kind==='bench'?3.84:2.56,d:f.kind==='bench'?1.28:2.56};
      for(const area of protectedAreas)expect(intersects(footprint,area),`${f.id}: blocks ${JSON.stringify(area)}`).toBe(false);
    }
  });
  it('gives visible street props collision while keeping the sidewalk between lamps and road walkable',()=>{
    const batch=new BrickBatch();addStreetFurniture(batch,new SurfaceGrid(384,320,'#05131d'));
    const walls=batch.colliders.filter(o=>(o.bottom??0)<4.312&&o.height>.792);
    for(const f of STREET_FIXTURES) {
      expect(blocked(f.x,f.z,.62,walls),`${f.id}: can walk through furniture`).toBe(true);
      const p={x:f.x-3,z:f.z};moveWithCollision(p,6,0,.62,walls);
      expect(p.x,`${f.id}: can tunnel through furniture`).toBeLessThan(f.x);
    }
    for(const x of [-65.92,45.44])for(const f of STREET_FIXTURES.filter(f=>f.kind==='lamp'&&f.x===x)) {
      expect(blocked(f.x+(x<0?1.28:-1.28),f.z,.62,walls),`${f.id}: no walkable inside edge`).toBe(false);
    }
  });
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
