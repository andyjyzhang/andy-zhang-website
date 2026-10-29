import {describe,expect,it} from 'vitest';
import {FLIGHT_LEVELS,FLIGHT_CAPACITY,FLIGHT_BOUNDS,FLIGHT_DOCK,type FlightPoint} from '../src/config/flight-levels';
import {SalvageRun,flightDistance,flightObstacleHit,flightObstacleEntry} from '../src/interactions/flight-game';

const still={x:0,y:0,z:0};
function flyTo(game:SalvageRun,target:FlightPoint){
  for(let i=0;i<1000&&game.phase==='playing'&&flightDistance(target,game.position)>1;i++)game.update(.05,{x:target.x-game.position.x,y:target.y-game.position.y,z:target.z-game.position.z},{boost:true});
  expect(flightDistance(target,game.position),`Could not reach ${JSON.stringify(target)} in ${game.level.name}`).toBeLessThanOrEqual(1.1);
}
function shoot(game:SalvageRun,target:FlightPoint&{hp:number}){
  flyTo(game,{x:game.position.x,y:37,z:game.position.z});
  flyTo(game,{x:target.x,y:37,z:Math.min(40,target.z+18)});
  flyTo(game,{x:target.x,y:target.y,z:Math.min(40,target.z+18)});
  for(let i=0;i<600&&target.hp>0&&game.phase==='playing';i++)game.update(.05,still,{fire:true,aimTarget:target});
  expect(target.hp,`${game.level.name}: target still alive`).toBe(0);
}
function directShot(game:SalvageRun,target:FlightPoint){
  Object.assign(game.position,{x:target.x,y:target.y,z:target.z+12});
  for(let i=0;i<15;i++)game.update(.05,still,{fire:true,aimTarget:target});
}

describe('five authored flight levels',()=>{
  it('has five different objectives, bounded pools, distinct palettes and reachable goals',()=>{
    expect(FLIGHT_LEVELS).toHaveLength(5);expect(new Set(FLIGHT_LEVELS.map(level=>level.kind)).size).toBe(5);
    expect(new Set(FLIGHT_LEVELS.map(level=>level.palette.sky)).size).toBe(5);
    for(const level of FLIGHT_LEVELS){
      expect(level.cargo.length).toBeLessThanOrEqual(FLIGHT_CAPACITY.cargo);expect(level.enemies.length).toBeLessThanOrEqual(FLIGHT_CAPACITY.enemies);
      expect(level.debris.length).toBeLessThanOrEqual(FLIGHT_CAPACITY.debris);expect(level.gates.length).toBeLessThanOrEqual(FLIGHT_CAPACITY.gates);expect(level.relays.length).toBeLessThanOrEqual(FLIGHT_CAPACITY.relays);
      for(const point of [FLIGHT_DOCK,...level.cargo,...level.gates,...level.relays,...level.convoyPath,...(level.core?[level.core]:[])]){
        expect(point.x).toBeGreaterThanOrEqual(FLIGHT_BOUNDS.minX);expect(point.x).toBeLessThanOrEqual(FLIGHT_BOUNDS.maxX);
        expect(point.y).toBeGreaterThanOrEqual(FLIGHT_BOUNDS.minY);expect(point.y).toBeLessThanOrEqual(FLIGHT_BOUNDS.maxY);
        expect(point.z).toBeGreaterThanOrEqual(FLIGHT_BOUNDS.minZ);expect(point.z).toBeLessThanOrEqual(FLIGHT_BOUNDS.maxZ);
        expect(level.obstacles.some(box=>flightObstacleHit(point,2,box))).toBe(false);
      }
    }
  });
  it('only counts course gates in sequence and requires the final extraction',()=>{
    const game=new SalvageRun(2);game.start();game.invulnerable=1000;
    expect(game.carryingAll).toBe(false);Object.assign(game.position,game.level.gates[3]);game.update(.01,still);expect(game.gateIndex).toBe(0);
    for(const gate of game.level.gates){Object.assign(game.position,gate);game.update(.01,still);}
    expect(game.gateIndex).toBe(6);expect(game.targetKind).toBe('dock');expect(game.phase).toBe('playing');
    Object.assign(game.position,FLIGHT_DOCK);game.update(.01,still);expect(game.phase).toBe('delivered');game.next();expect(game.level.kind).toBe('relay');
  });
  it('ignores out-of-order relay hits and keeps the recorder locked until all three are disabled',()=>{
    const game=new SalvageRun(3);game.start();game.invulnerable=1000;
    directShot(game,game.relays[1]);expect(game.relays[1].hp).toBe(2);expect(game.lastEvent).toMatch(/wrong relay/i);expect(game.locked(game.cargo[0])).toBe(true);
    for(const relay of game.relays)shoot(game,relay);
    expect(game.relaysCleared).toBe(3);expect(game.locked(game.cargo[0])).toBe(false);expect(game.targetKind).toBe('cargo');
    Object.assign(game.position,game.cargo[0]);game.update(.01,still);expect(game.collected).toBe(1);expect(game.targetKind).toBe('dock');
  });
  it('blocks the solid relay tower while allowing flight above it',()=>{
    const game=new SalvageRun(3);game.start();game.invulnerable=1000;Object.assign(game.position,{x:0,y:12,z:-16});
    for(let i=0;i<30;i++)game.update(.05,{x:0,y:0,z:-1},{boost:true});
    expect(game.position.z).toBeGreaterThan(-20);game.position.y=37;
    for(let i=0;i<30;i++)game.update(.05,{x:0,y:0,z:-1});expect(game.position.z).toBeLessThan(-35);
  });
  it('blocks both sides of the tower with swept bolts, including a muzzle beside a thin deck',()=>{
    const game=new SalvageRun(3);game.start();game.invulnerable=1000;
    const enemy=game.enemies[0];Object.assign(enemy,{role:'turret',x:0,y:12,z:-40,cooldown:100});Object.assign(game.position,{x:0,y:12,z:-10});
    for(let i=0;i<30;i++)game.update(.05,still,{fire:true,aimTarget:enemy});
    expect(enemy.hp).toBe(3);expect(game.effects.some(effect=>effect.kind==='hit')).toBe(true);
    game.invulnerable=0;game.bolts=[{x:0,y:12,z:-38,direction:{x:0,y:0,z:1},enemy:true,life:1.7}];
    for(let i=0;i<30;i++)game.update(.05,still);expect(game.shields).toBe(3);
    Object.assign(game.position,{x:0,y:6,z:-18.5});game.bolts=[];game.heat=0;game.overheated=false;
    for(let i=0;i<20;i++)game.update(.05,still,{fire:true,aim:{x:0,y:0,z:-1}});expect(game.bolts).toHaveLength(0);
    const box=game.level.obstacles[0];expect(flightObstacleEntry({x:0,y:12,z:-10},{x:0,y:12,z:-40},box)).toBeCloseTo((26.24-5.12-10)/30);
    expect(flightObstacleEntry({x:30,y:12,z:-10},{x:30,y:12,z:-40},box)).toBeNull();
  });
  it('waits for the escort, spawns later interceptors and fails if the shuttle is destroyed',()=>{
    const game=new SalvageRun(4);game.start();game.invulnerable=1000;const start={...game.convoy!};game.update(.2,still);
    expect(game.convoy!.x).toBe(start.x);expect(game.convoy!.z).toBe(start.z);expect(game.enemies[2].active).toBe(false);
    Object.assign(game.position,game.convoy!);game.update(.2,still);expect(game.convoy!.z).toBeLessThan(start.z);
    const next=game.level.convoyPath[1];Object.assign(game.convoy!,next);Object.assign(game.position,next);game.update(.01,still);expect(game.enemies[2].active).toBe(true);
    game.convoy!.hp=1;game.convoy!.invulnerable=0;Object.assign(game.position,FLIGHT_DOCK);
    game.bolts.push({x:game.convoy!.x,y:game.convoy!.y,z:game.convoy!.z+1,direction:{x:0,y:0,z:-1},enemy:true,life:1});game.update(.05,still);
    expect(game.phase).toBe('lost');expect(game.lastEvent).toMatch(/shuttle lost/i);game.retry();expect(game.mission).toBe(4);expect(game.convoy!.hp).toBe(8);
  });
  it('shields the cruiser core until both generators are destroyed and wins only after docking',()=>{
    const game=new SalvageRun(5);game.start();game.invulnerable=1000;directShot(game,game.core!);
    expect(game.core!.hp).toBe(12);expect(game.lastEvent).toMatch(/shields active/i);
    for(const relay of game.relays)shoot(game,relay);expect(game.targetKind).toBe('core');shoot(game,game.core!);
    expect(game.phase).toBe('playing');expect(game.objectiveComplete).toBe(true);Object.assign(game.position,FLIGHT_DOCK);game.update(.01,still);
    expect(game.phase).toBe('won');expect(game.lastEvent).toMatch(/five levels/);game.next();expect(game.mission).toBe(5);
  });
  it('clears all five objectives with flight inputs and actual blaster damage',()=>{
    const game=new SalvageRun();
    for(let level=1;level<=5;level++){
      expect(game.mission).toBe(level);game.start();game.invulnerable=1000;
      switch(game.level.kind){
        case 'salvage':for(const pod of game.cargo){shoot(game,game.enemies[pod.guard]);flyTo(game,pod);}break;
        case 'course':for(const gate of game.level.gates)flyTo(game,gate);break;
        case 'relay':
          for(const relay of game.relays)shoot(game,relay);
          flyTo(game,{x:0,y:37,z:game.cargo[0].z});flyTo(game,game.cargo[0]);break;
        case 'escort':
          for(let i=0;i<2500&&!game.convoy!.docked&&game.phase==='playing';i++){
            const convoy=game.convoy!,target={x:convoy.x+9,y:convoy.y+3,z:convoy.z+9},enemy=game.patrols[0];
            const distance=flightDistance(target,game.position);
            game.update(.05,distance>2?{x:target.x-game.position.x,y:target.y-game.position.y,z:target.z-game.position.z}:still,{fire:!!enemy,aimTarget:enemy});
          }
          expect(game.convoy!.hp).toBeGreaterThan(0);expect(game.convoy!.docked).toBe(true);break;
        case 'assault':for(const relay of game.relays)shoot(game,relay);shoot(game,game.core!);break;
      }
      expect(game.objectiveComplete,game.level.name).toBe(true);
      flyTo(game,{x:game.position.x,y:37,z:game.position.z});flyTo(game,{x:0,y:37,z:32});
      // The goal triggers a few meters before the exact dock center.
      for(let i=0;i<200&&game.phase==='playing';i++)game.update(.05,{x:-game.position.x,y:8-game.position.y,z:32-game.position.z},{boost:true});
      expect(game.phase,game.level.name).toBe(level===5?'won':'delivered');if(level<5)game.next();
    }
    expect(game.score).toBeGreaterThan(5000);game.restart();expect(game.mission).toBe(1);expect(game.score).toBe(0);
  });
  it('retries a level without farming points and fully resets all objective state',()=>{
    const game=new SalvageRun();game.start();game.cargo.forEach(pod=>pod.collected=true);game.update(.01,still);game.next();const banked=game.score;
    game.start();game.score+=999;game.gateIndex=4;game.phase='lost';game.retry();
    expect(game).toMatchObject({mission:2,score:banked,gateIndex:0,phase:'briefing',shields:3});
    expect(new SalvageRun(99).mission).toBe(5);expect(new SalvageRun(NaN).mission).toBe(1);
  });
  it.each([1,2,3,4,5])('freezes every objective and actor while paused in level %i',level=>{
    const game=new SalvageRun(level);game.start();game.update(.1,still);const before=JSON.stringify(game);
    game.update(.2,{x:1,y:1,z:1},{enabled:false,fire:true,boost:true});expect(JSON.stringify(game)).toBe(before);
  });
});
