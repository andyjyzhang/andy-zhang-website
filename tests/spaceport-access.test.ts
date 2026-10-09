import {describe,it,expect,vi,afterEach} from 'vitest';
import * as T from 'three';
import {createBuilding} from '../src/landmarks/buildings';
import {createTown} from '../src/world/town';
import {landmarks} from '../src/config/world';
import {Locomotion} from '../src/player/locomotion';
import {safeApproach,blocked} from '../src/world/collision';
import {SpaceportProps} from '../src/world/spaceport-props';
import {StationActivities} from '../src/interactions/activities';

// Texture labels need only a canvas during scene construction. These checks
// exercise the real geometry/collider builders without requiring a GPU.
function labels(){vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({fillRect:()=>{},fillText:()=>{}})})});}
afterEach(()=>vi.unstubAllGlobals());
describe('spaceport access',()=>{
  it('moves real activity assemblies, serves a bowl and respects immediate reduced-motion actions',()=>{
    labels();const props=new SpaceportProps(new T.Group(),new StationActivities().definitions);
    const drone=props.root.getObjectByName('survey-drone')!,crate=props.root.getObjectByName('supply-crate')!,bowl=props.root.getObjectByName('noodle-order')!;
    const initial=drone.position.y;props.activate('repair',false,'test',false);props.activate('cargo',false,'load',false);
    for(let i=0;i<120;i++)props.update(1/60,false);expect(drone.position.y).toBeGreaterThan(initial+1);expect(crate.position.y).toBeGreaterThan(5);
    props.activate('noodles',false,'order',false);expect(bowl.visible).toBe(true);
    props.update(1/60,true);expect(drone.position.y).toBe(initial);expect(crate.position.x).toBeCloseTo(-64.64);expect(crate.position.y).toBe(.768);
    props.activate('cargo',false,'load',true);expect(crate.position.x).toBeCloseTo(-67.84);expect(crate.position.y).toBe(.512);
  });
  it('holds a lowering crate clear of a visitor standing on the receiving pad',()=>{
    labels();const props=new SpaceportProps(new T.Group(),new StationActivities().definitions),crate=props.root.getObjectByName('supply-crate')!;
    props.activate('cargo',false,'load',false);
    for(let i=0;i<600;i++)props.update(1/60,false,{x:-64.64,y:.512,z:36.48});
    expect(crate.position.y).toBeGreaterThan(4.3);
    for(let i=0;i<300;i++)props.update(1/60,false,{x:0,y:.512,z:10});
    expect(crate.position.y).toBeCloseTo(.768);
  });
  it('walks through every portfolio doorway onto its floor, with walls still blocking movement',()=>{
    labels();
    for(const l of landmarks) {
      const building=createBuilding(l),player=new Locomotion();player.teleport(...l.entry);
      for(let i=0;i<90;i++)player.update(1/60,{x:0,z:-1,running:false,jump:false,jumpHeld:false},l.facing??0,building.obstacles,true);
      const localZ=(player.z-l.z)*Math.cos(l.facing??0);
      expect(localZ,`${l.id} doorway is blocked`).toBeLessThan(l.depth/2-2.5);expect(player.y).toBeCloseTo(.768);
      expect(building.obstacles.some(o=>o.label==='side wall')).toBe(true);
    }
  });
  it('provides a clear shortcut arrival inside the interaction radius for every stationary activity',()=>{
    labels();const town=createTown(),station=new StationActivities(),props=new SpaceportProps(new T.Group(),station.definitions);
    const obstacles=town.obstacles.concat(...landmarks.map(l=>createBuilding(l).obstacles),props.staticObstacles,props.obstacles);
    for(const activity of station.definitions) {
      const point=safeApproach(activity,obstacles);
      expect(point,`${activity.name} has no safe approach`).not.toBeNull();
      expect(Math.hypot(point!.x-activity.x,point!.z-activity.z)).toBeLessThan(3.4);
      expect(blocked(point!.x,point!.z,.62,obstacles.filter(o=>o.height>.792&&(o.bottom??0)<4.312))).toBe(false);
    }
  });
});
