import {BrickBatch,bench} from './brick-kit';
import {LDRAW_SCALE,PLATE as H} from './part-catalog';
import {standingPart} from './part-placement';
import {WORLD_STYLE} from '../config/station';
import type {SurfaceGrid} from './surface-grid';

type FixtureKind='lamp'|'bench'|'cargo';
interface StreetFixture {id:string;kind:FixtureKind;x:number;z:number;warm?:boolean}

// Authored sidewalk pockets, not a repeating placement along each street.
// In particular, each pocket clears the UNION of streets at intersections.
// Coordinates and pads are in world units / whole studs respectively.
export const STREET_FIXTURES:readonly StreetFixture[]=[
  {id:'concourse-nw',kind:'lamp',x:-9.6,z:-9.6},
  {id:'concourse-ne',kind:'lamp',x:9.6,z:-9.6},
  {id:'concourse-sw',kind:'lamp',x:-9.6,z:9.6},
  {id:'concourse-se',kind:'lamp',x:9.6,z:9.6},
  {id:'north-west-dock',kind:'lamp',x:-94.72,z:-44.16},
  {id:'north-freight',kind:'lamp',x:-69.76,z:-44.16},
  {id:'north-relay',kind:'lamp',x:-20.48,z:-44.16},
  {id:'north-workshop',kind:'lamp',x:0,z:-44.16},
  {id:'north-hangar',kind:'lamp',x:48.64,z:-44.16},
  {id:'north-flight',kind:'lamp',x:92.16,z:-44.16},
  {id:'gate-west',kind:'lamp',x:-39.68,z:-58.24},
  {id:'gate-east',kind:'lamp',x:20.48,z:-58.24},
  {id:'gate-freight',kind:'lamp',x:69.12,z:-58.24},
  {id:'west-workshop',kind:'lamp',x:-65.92,z:-39.68},
  {id:'west-quarters',kind:'lamp',x:-65.92,z:-8.96},
  {id:'west-loading',kind:'lamp',x:-65.92,z:41.6},
  {id:'west-radio',kind:'lamp',x:-65.92,z:73.6},
  {id:'east-hangar',kind:'lamp',x:45.44,z:-31.36},
  {id:'east-checkpoint',kind:'lamp',x:45.44,z:5.12},
  {id:'east-market',kind:'lamp',x:45.44,z:36.48,warm:true},
  {id:'east-archive',kind:'lamp',x:45.44,z:70.4},
  {id:'south-freight',kind:'lamp',x:-90.88,z:59.52,warm:true},
  {id:'south-storage',kind:'lamp',x:-47.36,z:59.52},
  {id:'south-campus',kind:'lamp',x:0,z:59.52,warm:true},
  {id:'south-deep-space',kind:'lamp',x:67.84,z:59.52},
  {id:'south-dockside',kind:'lamp',x:111.36,z:59.52},
  {id:'dock-east-north',kind:'lamp',x:106.24,z:-32.64},
  {id:'dock-east-market',kind:'lamp',x:106.24,z:35.84,warm:true},
  {id:'dock-east-south',kind:'lamp',x:106.24,z:73.6},
  {id:'dock-west-north',kind:'lamp',x:-99.84,z:-69.12},
  {id:'dock-west-quarters',kind:'lamp',x:-99.84,z:-17.92},
  {id:'dock-west-south',kind:'lamp',x:-99.84,z:70.4},
  {id:'market-west',kind:'lamp',x:-91.52,z:23.68,warm:true},
  {id:'market-habitat',kind:'lamp',x:-44.8,z:9.6},
  {id:'market-oxygen',kind:'lamp',x:75.52,z:23.68,warm:true},
  {id:'market-dockside',kind:'lamp',x:111.36,z:23.68},
  {id:'concourse-seat',kind:'bench',x:-8.96,z:3.84},
  {id:'studio-seat',kind:'bench',x:-38.4,z:-43.52},
  {id:'market-seat',kind:'bench',x:73.6,z:46.08},
  {id:'freight-seat',kind:'bench',x:-90.88,z:46.08},
  {id:'campus-seat',kind:'bench',x:5.12,z:84.48},
  {id:'archive-seat',kind:'bench',x:26.88,z:59.52},
  {id:'freight-supplies',kind:'cargo',x:-68.48,z:44.16},
  {id:'repair-supplies',kind:'cargo',x:-71.68,z:-17.92},
  {id:'dock-supplies-a',kind:'cargo',x:108.8,z:-59.52},
  {id:'dock-supplies-b',kind:'cargo',x:112.64,z:-58.24},
];

export const FIXTURE_PADS:Record<FixtureKind,{w:number;d:number}>={
  lamp:{w:6,d:6},bench:{w:8,d:4},cargo:{w:6,d:6},
};

function stationLamp(b:BrickBatch,warm:boolean) {
  const top=.512+168*LDRAW_SCALE;
  b.mold('lampPost','#9ba19d',0,top,0);
  b.mold('roundBrick',warm?'@amber':'@cyan',0,top+3*H,0);
  // Seat the real 4x4 dish ABOVE the lantern, rather than through it.
  standingPart(b,'dish','#0a3463',0,top+3*H,0);
  b.obstacle({x:0,z:0,w:1.28,d:1.28,radius:.64,bottom:.512,height:top+3*H+.128,label:'streetlight post'});
  b.obstacle({x:0,z:0,w:2.56,d:2.56,bottom:top+3*H,height:top+5*H+.128,label:'streetlight shade'});
}

function supplyCrate(b:BrickBatch) {
  b.stack('#0a3463',0,.512,0,4,1,4);
  b.stack('#fe8a18',0,3*H,0,4,3,4);
  b.stack('#9ba19d',0,6*H,0,2,1,4,'tile');
  for(const side of [-1,1])b.stack('#05131d',side*.96,6*H,0,1,1,4,'tile');
  b.obstacle({x:0,z:0,w:2.56,d:2.56,bottom:.512,height:7*H,label:'supply crate'});
}

export function addStreetFurniture(b:BrickBatch,surface:SurfaceGrid) {
  for(const f of STREET_FIXTURES) {
    const pad=FIXTURE_PADS[f.kind];
    surface.stack(WORLD_STYLE.paving,f.x,H,f.z,pad.w,1,pad.d,'tile');
    b.withOffset(f.x,0,f.z,()=>{
      if(f.kind==='lamp')stationLamp(b,!!f.warm);
      else if(f.kind==='bench')bench(b,0,0);
      else supplyCrate(b);
    });
  }
}
