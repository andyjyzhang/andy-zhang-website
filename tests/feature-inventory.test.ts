import {afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import * as T from 'three';
import {createTown} from '../src/world/town';
import {createBuilding} from '../src/landmarks/buildings';
import {landmarks,SHIP} from '../src/config/world';
import {StationActivities} from '../src/interactions/activities';
import {nearestInteraction,type Interactable} from '../src/interactions/detection';
import {SpaceportProps} from '../src/world/spaceport-props';
import {AmbientLife} from '../src/world/ambient';
import {Vehicle,vehicleSpecs} from '../src/vehicles/vehicle';
import {safeApproach,safeExit,blocked,type Obstacle} from '../src/world/collision';

function labels(){vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:()=>()=>{}})})});}
afterEach(()=>vi.unstubAllGlobals());
describe('complete live station inventory',()=>{
  let activities:StationActivities,obstacles:Obstacle[],items:Interactable[],vehicles:Vehicle[];
  beforeAll(()=>{
    labels();const town=createTown(),life=new AmbientLife(town.root);
    activities=new StationActivities();const props=new SpaceportProps(town.root,activities.definitions);
    vehicles=vehicleSpecs.map(v=>new Vehicle(v,town.root));
    for(const {spec,model} of life.workers)activities.addCrew(spec.id,spec.name,model.root.position.x,model.root.position.z,spec.task);
    obstacles=town.obstacles.concat(...landmarks.map(l=>createBuilding(l).obstacles),props.staticObstacles,props.obstacles,life.obstacles,vehicles.map(v=>v.obstacle()),[
      {x:SHIP.x,z:SHIP.z-7.36,w:12.8,d:.64,height:7.2},
      {x:SHIP.x-6.08,z:SHIP.z-2.56,w:.64,d:10.24,height:7.2},
      {x:SHIP.x+6.08,z:SHIP.z-2.56,w:.64,d:10.24,height:7.2},
    ]);
    items=[...activities.items,...landmarks.flatMap(l=>[
      {id:l.id,name:l.name,action:'Explore' as const,key:'E' as const,x:l.entry[0],z:l.entry[1],radius:4.2},
      {id:l.id,name:l.name,action:'Explore' as const,key:'E' as const,x:l.x,z:l.z+Math.cos(l.facing??0)*2.56,radius:5},
    ]),{id:'ship',name:'A little further',action:'Launch',key:'E',x:SHIP.entry[0],z:SHIP.entry[1],radius:5},
    ...vehicles.filter(v=>v.spec.driveable).map(v=>({id:v.spec.id,name:v.spec.name,action:'Drive' as const,key:'F' as const,x:v.position.x,z:v.position.z,radius:4.6}))];
    vi.unstubAllGlobals();
  });
  it('accounts for every facade, activity, crew member and driveable vehicle',()=>{
    expect(activities.definitions).toHaveLength(42);
    expect(activities.definitions.filter(d=>d.kind==='facility')).toHaveLength(29);
    expect(activities.definitions.filter(d=>d.kind==='crew')).toHaveLength(5);
    expect(vehicles.filter(v=>v.spec.driveable)).toHaveLength(3);
  });
  it('arrives clear of all live obstacles with the intended contextual prompt at every station stop',()=>{
    for(const d of activities.definitions){
      const point=safeApproach(d,obstacles,['arcade','noodles'].includes(d.kind)?Math.PI:0);
      expect(point,`${d.id} / ${d.name}: no arrival`).not.toBeNull();
      expect(nearestInteraction(point!.x,point!.z,items)?.id,`${d.id} / ${d.name}: wrong prompt`).toBe(d.id);
    }
  });
  it('exits every real vehicle body into a clear, driveable interaction range',()=>{
    const walls=obstacles.filter(o=>o.height>.792&&(o.bottom??0)<4.312);
    for(const v of vehicles.filter(v=>v.spec.driveable)){
      const point=safeExit(v.position,v.heading,obstacles);
      expect(point,`${v.spec.id}: no safe exit`).not.toBeNull();
      expect(blocked(point!.x,point!.z,.65,walls)).toBe(false);
      expect(nearestInteraction(point!.x,point!.z,items)?.id,`${v.spec.id}: exit prompt`).toBe(v.spec.id);
    }
  });
  it('toggles every facade on and off, greets all crew, and rejects invalid commands',()=>{
    for(const d of activities.definitions){
      expect(activities.command(d.id,'invalid')).toBeNull();
      for(const c of d.commands)expect(activities.command(d.id,c.id)?.definition.id).toBe(d.id);
      if(d.kind==='facility')expect(activities.command(d.id,'toggle')?.on).toBe(false);
    }
  });
});

describe('activity completion and retry safety',()=>{
  it('finishes drone and cargo runs despite repeated attempts to restart them',()=>{
    labels();const props=new SpaceportProps(new T.Group(),new StationActivities().definitions);
    for(const [id,command] of [['repair','test'],['cargo','load']]){
      expect(props.activate(id,false,command,false)).toBe(true);
      for(let i=0;i<120;i++){
        expect(props.unavailable(id,false)).not.toBe('');
        expect(props.activate(id,false,command,false)).toBe(false);
        props.update(1/60,false,{x:0,y:.512,z:10});
      }
      for(let i=0;i<480;i++)props.update(1/60,false,{x:0,y:.512,z:10});
      expect(props.busy(id)).toBe(false);expect(props.unavailable(id,false)).toBe('');
      expect(props.phase(id)).toMatch(/complete|delivered/);
    }
  });
  it('rejects immediate cargo placement on an occupied receiving pad in either direction',()=>{
    labels();const props=new SpaceportProps(new T.Group(),new StationActivities().definitions);
    expect(props.unavailable('cargo',true,{x:-64.64,y:.512,z:36.48})).toContain('clear');
    expect(props.unavailable('cargo',true,{x:0,y:.512,z:10})).toBe('');
    props.activate('cargo',false,'load',true);
    expect(props.unavailable('cargo',true,{x:-67.84,y:.512,z:39.68})).toContain('clear');
  });
  it('evaluates all three stopped signals and can retry after a miss or win',()=>{
    labels();const s=new StationActivities(),props=new SpaceportProps(new T.Group(),s.definitions);
    props.activate('arcade',false,'stop',true);
    for(let signal=0;signal<3;signal++){
      expect(props.signal).toBe(signal);
      expect(s.command('arcade','stop',props.signal)?.message).toContain(signal===1?'Synchronized':'Almost');
      props.activate('arcade',false,'stop',true);props.update(1,true);expect(props.signal).toBe(signal);
      props.activate('arcade',false,'step',true);
    }
    expect(props.signal).toBe(0);props.activate('arcade',false,'restart',false);props.update(.6,false);expect(props.signal).toBe(1);
  });
  it('keeps an occupied cargo pad clear when reduced motion is enabled mid-flight',()=>{
    labels();const props=new SpaceportProps(new T.Group(),new StationActivities().definitions),crate=props.root.getObjectByName('supply-crate')!;
    props.activate('cargo',false,'load',false);for(let i=0;i<330;i++)props.update(1/60,false);
    const airborne=crate.position.clone();props.update(1/60,true,{x:-64.64,y:.512,z:36.48});
    expect(crate.position.equals(airborne)).toBe(true);expect(props.busy('cargo')).toBe(true);
    props.update(1/60,true,{x:0,y:.512,z:10});expect(props.busy('cargo')).toBe(false);expect(crate.position.x).toBeCloseTo(-64.64);
  });
});
