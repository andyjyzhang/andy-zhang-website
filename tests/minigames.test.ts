import {afterEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import * as T from 'three';
import {DestinationCamera} from '../src/camera/destination-camera';
import {SpaceGame} from '../src/scenes/space-game';
import {CubeRecall} from '../src/interactions/minigames';
import {PokerDraw,evaluateHand,shuffledDeck,type Card,type Suit} from '../src/interactions/poker-draw';
import {SalvageRun,FLIGHT_DOCK,FLIGHT_BOUNDS,flightDistance,flightSegmentDistance,type FlightPoint} from '../src/interactions/flight-game';
import {ShipAim} from '../src/interactions/flight-aim';
import type {Input} from '../src/player/input';

let dom:JSDOM|undefined;
function controls(zoom=0,...keys:string[]){return{consumeCamera:()=>({x:0,y:0,zoom}),pressed:()=>false,down:(...codes:string[])=>codes.some(code=>keys.includes(code))} as unknown as Input;}
function sceneDOM(){
  dom=new JSDOM('<div id="app"><canvas role="application" tabindex="0"></canvas></div>');
  const context=new Proxy({},{get:()=>()=>{}});
  dom.window.HTMLCanvasElement.prototype.getContext=(()=>context) as unknown as typeof dom.window.HTMLCanvasElement.prototype.getContext;
  vi.stubGlobal('document',dom.window.document);vi.stubGlobal('window',dom.window);vi.stubGlobal('innerWidth',1440);vi.stubGlobal('innerHeight',900);
  return document.querySelector<HTMLElement>('#app')!;
}
afterEach(()=>{dom?.window.close();vi.unstubAllGlobals();});
describe('destination camera and flight scene',()=>{
  it('scrolls out of POV, back in, clamps zoom and ignores input while reading',()=>{
    const camera=new T.PerspectiveCamera(),view=new DestinationCamera(camera,{distance:0}),anchor=new T.Vector3(0,4,10);
    view.update(1/60,controls(),anchor,true,true);expect(camera.position.equals(anchor)).toBe(true);
    view.update(1/60,controls(19),anchor,true,true);expect(view.firstPerson).toBe(false);expect(camera.position.distanceTo(anchor)).toBeCloseTo(19);
    view.update(1/60,controls(-100),anchor,true,false);expect(view.distance).toBe(19);
    view.update(1/60,controls(-100),anchor,true,true);expect(view.firstPerson).toBe(true);expect(view.distance).toBe(0);
    view.update(1/60,controls(100),anchor,true,true);expect(view.distance).toBe(46);
  });
  it('keeps a zoomed-out camera in front of solid scenery',()=>{
    const camera=new T.PerspectiveCamera(),view=new DestinationCamera(camera,{distance:46,yaw:0,pitch:0},[{x:0,z:8,w:8,d:2,height:20}]);
    view.update(1/60,controls(),new T.Vector3(0,4,0),true,true);expect(camera.position.z).toBeLessThan(7);
  });
  it('starts from a briefing, supports flight/POV and cleans up on return',()=>{
    const parent=sceneDOM(),scene=new SpaceGame(parent);expect(scene.game.phase).toBe('briefing');
    scene.update(1,controls(0,'KeyW'),true,true);expect(scene.game.position.z).toBe(FLIGHT_DOCK.z);
    scene.overlay.querySelector<HTMLButtonElement>('[data-flight-action="start"]')!.click();expect(scene.game.phase).toBe('playing');
    scene.update(.1,controls(-100,'KeyW'),true,true);expect(scene.view.firstPerson).toBe(true);expect(scene.scene.getObjectByName('salvage-ship')!.visible).toBe(false);
    scene.update(.1,controls(19),true,true);expect(scene.view.firstPerson).toBe(false);expect(scene.scene.getObjectByName('salvage-ship')!.visible).toBe(true);
    const before=scene.position.clone();scene.update(.1,controls(0,'KeyW'),true,false);expect(scene.position.equals(before)).toBe(true);
    scene.dispose();expect(parent.querySelector('.flight-overlay')).toBeNull();expect(scene.scene.children).toHaveLength(0);
  });
  it('supports keyboard altitude/fire and releases button holds on pause and blur',()=>{
    const scene=new SpaceGame(sceneDOM()),cue=vi.fn();scene.game.start();scene.game.invulnerable=1000;
    scene.update(.1,controls(0,'KeyE','Space'),true,true);expect(scene.game.position.y).toBeGreaterThan(8);expect(scene.game.shotsFired).toBe(1);
    const height=scene.position.y;scene.update(.1,controls(0,'KeyQ'),true,true);expect(scene.position.y).toBeLessThan(height);
    const fire=scene.overlay.querySelector<HTMLButtonElement>('[data-flight-hold="fire"]')!;
    fire.dispatchEvent(new dom!.window.KeyboardEvent('keydown',{code:'Space',bubbles:true,cancelable:true}));expect(scene.hud.held('fire')).toBe(true);
    scene.update(.1,controls(),true,false);expect(scene.hud.held('fire')).toBe(false);
    fire.dispatchEvent(new dom!.window.KeyboardEvent('keydown',{code:'Enter',bubbles:true,cancelable:true}));expect(scene.hud.held('fire')).toBe(true);
    dom!.window.dispatchEvent(new dom!.window.Event('blur'));expect(scene.hud.held('fire')).toBe(false);
    const geometry=(scene.scene.getObjectByName('salvage-blasters') as T.InstancedMesh).geometry;geometry.addEventListener('dispose',cue);
    scene.dispose();expect(cue).toHaveBeenCalledOnce();
  });
  it('fires through the camera centre with parallax correction and a fixed reticle',()=>{
    const scene=new SpaceGame(sceneDOM());scene.game.start();scene.game.invulnerable=1000;
    scene.update(.05,controls(0,'Space'),true,true);
    const point=scene.aimTarget.clone().project(scene.camera);expect(point.x).toBeCloseTo(0);expect(point.y).toBeCloseTo(0);
    const first=scene.game.bolts.find(b=>!b.enemy)!;
    const toTarget=new T.Vector3(scene.aimTarget.x-first.x,scene.aimTarget.y-first.y,scene.aimTarget.z-first.z);
    expect(toTarget.cross(new T.Vector3(first.direction.x,first.direction.y,first.direction.z)).length()).toBeLessThan(1e-7);
    const yaw=scene.aim.yaw;scene.update(.2,controls(0,'ArrowRight','ArrowUp','KeyW','Space'),true,true);
    expect(scene.aim.yaw).not.toBe(yaw);
    const current=scene.aimTarget.clone().project(scene.camera);expect(current.x).toBeCloseTo(0);expect(current.y).toBeCloseTo(0);
    const nose=new T.Vector3(0,0,1).applyQuaternion(scene.scene.getObjectByName('salvage-ship')!.quaternion);
    expect(nose.distanceTo(new T.Vector3(scene.aim.direction.x,scene.aim.direction.y,scene.aim.direction.z))).toBeLessThan(1e-10);
    expect(scene.overlay.querySelector('[data-flight-action="look"]')).toBeNull();expect(scene.overlay.textContent).not.toMatch(/IJKL|assisted aim/);
    scene.overlay.querySelector<HTMLButtonElement>('[data-flight-action="restart"]')!.click();expect(scene.view.yaw).toBe(0);expect(scene.view.pitch).toBe(0);
    scene.dispose();
  });
});
describe('crosshair ship steering',()=>{
  it('points exactly at a supplied world point, including above and below the ship',()=>{
    const aim=new ShipAim(),origin={x:4,y:8,z:20};aim.pointAt(origin,{x:14,y:18,z:0});
    expect(Math.hypot(...Object.values(aim.direction))).toBeCloseTo(1);expect(aim.direction.x).toBeGreaterThan(0);expect(aim.direction.y).toBeGreaterThan(0);
    const before=JSON.stringify(aim);aim.pointAt(origin,origin);expect(JSON.stringify(aim)).toBe(before);
    aim.pointAt(origin,{x:4,y:-10,z:20});expect(aim.direction.y).toBeCloseTo(-1);
    aim.reset();expect(aim.direction).toEqual({x:-0,y:-0,z:-1});
  });
  it('flies along the aimed nose with independent strafe and altitude',()=>{
    const aim=new ShipAim();aim.yaw=Math.PI/2;aim.pitch=-.5;
    expect(aim.movement({x:0,y:0,z:-1})).toEqual(aim.direction);
    expect(aim.movement({x:0,y:1,z:0})).toEqual({x:0,y:1,z:0});
    const strafe=aim.movement({x:1,y:0,z:0});expect(strafe.x).toBeCloseTo(0);expect(strafe.z).toBeCloseTo(-1);expect(strafe.y).toBe(0);
  });
});
describe('Salvage Run missions and combat',()=>{
  const still={x:0,y:0,z:0};
  it('disables the first level patrols, recovers elevated cargo, advances and replays',()=>{
    const game=new SalvageRun();
    const travel=(target:FlightPoint)=>{
      for(let i=0;i<800&&game.phase==='playing'&&flightDistance(target,game.position)>1;i++){
        game.update(.05,{x:target.x-game.position.x,y:target.y-game.position.y,z:target.z-game.position.z},{boost:true});
      }
    };
    game.start();game.invulnerable=1000;
      for(const pod of game.cargo){
        travel({x:pod.x,y:pod.y,z:pod.z+16});
        for(let i=0;i<200&&game.enemies[pod.guard].hp>0;i++){
          const guard=game.enemies[pod.guard];
          game.update(.05,still,{fire:true,aim:{x:guard.x-game.position.x,y:guard.y-game.position.y,z:guard.z-game.position.z}});
        }
        expect(game.locked(pod)).toBe(false);travel(pod);
      }
      expect(game.collected).toBe(3);travel(FLIGHT_DOCK);
    expect(game.phase).toBe('delivered');expect(game.kills).toBe(3);expect(game.shotsFired).toBeGreaterThanOrEqual(9);expect(game.score).toBeGreaterThan(900);
    game.next();expect(game.mission).toBe(2);expect(game.level.kind).toBe('course');
    game.restart();expect(game).toMatchObject({phase:'briefing',mission:1,score:0,shields:3,kills:0,shotsFired:0,heat:0});expect(game.bolts).toHaveLength(0);
  });
  it('requires a disabled guard and matching altitude for collection and delivery',()=>{
    const g=new SalvageRun();g.start();g.invulnerable=1000;
    const pod=g.cargo[1];Object.assign(g.position,pod);g.update(.01,still);expect(pod.collected).toBe(false);
    g.enemies[pod.guard].hp=0;g.position.y=5;g.update(.01,still);expect(pod.collected).toBe(false);
    g.position.y=pod.y;g.update(.01,still);expect(pod.collected).toBe(true);
    g.cargo.forEach(p=>p.collected=true);Object.assign(g.position,FLIGHT_DOCK,{y:35});g.update(.01,still);expect(g.phase).toBe('playing');
    g.position.y=8;g.update(.01,still);expect(g.phase).toBe('delivered');
  });
  it('takes one hit per immunity window and fails on depleted shields or timeout',()=>{
    const game=new SalvageRun();game.start();Object.assign(game.position,game.hazards[0]);game.update(.01,still);expect(game.shields).toBe(2);
    game.update(.1,still);expect(game.shields).toBe(2);
    for(let i=0;i<2;i++){game.invulnerable=0;Object.assign(game.position,game.hazards[0]);game.update(.01,still);}
    expect(game.phase).toBe('lost');game.restart();game.start();game.timeLeft=.01;game.update(.02,still);expect(game.phase).toBe('lost');expect(game.lastEvent).toContain('window closed');
  });
  it('boosts, recharges, normalizes diagonal flight and clamps all three axes',()=>{
    const g=new SalvageRun();g.start();g.invulnerable=1000;g.update(.2,{x:1,y:0,z:0},{boost:true});expect(g.position.x).toBeCloseTo(6);expect(g.boost).toBeLessThan(1);
    g.update(.2,still);expect(g.boost).toBeCloseTo(.972);
    const before={...g.position};g.update(.1,{x:1,y:1,z:1});expect(flightDistance(before,g.position)).toBeCloseTo(1.8);
    for(let i=0;i<100;i++)g.update(.1,{x:1,y:1,z:1});
    expect(g.position).toEqual({x:FLIGHT_BOUNDS.maxX,y:FLIGHT_BOUNDS.maxY,z:FLIGHT_BOUNDS.maxZ});
    for(let i=0;i<140;i++)g.update(.1,{x:-1,y:-1,z:-1});
    expect(g.position).toEqual({x:FLIGHT_BOUNDS.minX,y:FLIGHT_BOUNDS.minY,z:FLIGHT_BOUNDS.minZ});
  });
  it('fires destructible debris, overheats, cools and bounds projectile/effect counts',()=>{
    const g=new SalvageRun();g.start();g.invulnerable=1000;g.enemies.forEach(e=>e.hp=0);
    const rock=g.hazards[0];Object.assign(g.position,{x:rock.x,y:rock.y,z:rock.z+20});
    for(let i=0;i<20&&rock.hp;i++)g.update(.1,still,{fire:true,aim:{x:rock.x-g.position.x,y:rock.y-g.position.y,z:rock.z-g.position.z}});
    expect(rock.hp).toBe(0);expect(g.score).toBeGreaterThanOrEqual(25);
    for(let i=0;i<50&&!g.overheated;i++)g.update(.1,still,{fire:true,aim:{x:0,y:1,z:0}});
    expect(g.overheated).toBe(true);const shots=g.shotsFired;g.update(.1,still,{fire:true});expect(g.shotsFired).toBe(shots);
    for(let i=0;i<35;i++)g.update(.1,still);expect(g.overheated).toBe(false);g.update(.1,still,{fire:true});expect(g.shotsFired).toBe(shots+1);
    for(let i=0;i<400;i++)g.update(.1,still,{fire:true});expect(g.bolts.length).toBeLessThanOrEqual(48);expect(g.effects.length).toBeLessThanOrEqual(20);
  });
  it('does not auto-aim behind the ship, and incoming patrol bolts hit shields',()=>{
    const g=new SalvageRun();g.start();const enemy=g.enemies[0];Object.assign(g.position,{x:enemy.x,y:enemy.y,z:enemy.z+20});g.invulnerable=1000;
    g.update(.1,still,{fire:true,aim:{x:0,y:0,z:1}});
    const bolt=g.bolts.find(b=>!b.enemy)!;expect(bolt.direction.z).toBeCloseTo(1);expect(enemy.hp).toBe(3);
    g.invulnerable=0;
    for(let i=0;i<40&&g.shields===3;i++)g.update(.1,still);
    expect(g.shields).toBe(2);expect(g.lastEvent).toContain('blaster');
  });
  it('never redirects a player bolt toward a nearby target in front',()=>{
    const g=new SalvageRun();g.start();g.invulnerable=1000;const enemy=g.enemies[0];
    Object.assign(g.position,{x:enemy.x-8,y:enemy.y,z:enemy.z+20});
    g.update(.01,still,{fire:true,aim:{x:0,y:0,z:-4}});
    const bolt=g.bolts.find(b=>!b.enemy)!;expect(bolt.direction).toEqual({x:0,y:0,z:-1});
    for(let i=0;i<8;i++)g.update(.05,still);expect(enemy.hp).toBe(3);
  });
  it('freezes combat, altitude, timer and heat while paused or reading a briefing',()=>{
    const g=new SalvageRun();g.update(.25,{x:1,y:1,z:1},{fire:true});expect(g.position).toEqual(FLIGHT_DOCK);expect(g.timeLeft).toBe(120);
    g.start();g.update(.1,still,{fire:true});const state=JSON.stringify(g);
    g.update(.25,{x:1,y:1,z:1},{fire:true,boost:true,enabled:false});expect(JSON.stringify(g)).toBe(state);
    g.restart();expect(g.bolts).toHaveLength(0);expect(g.effects).toHaveLength(0);
  });
  it('recomputes the crosshair direction after movement for every fired bolt',()=>{
    const g=new SalvageRun();g.start();g.invulnerable=1000;const target={x:0,y:8,z:-30};
    g.update(.2,{x:1,y:0,z:0},{fire:true,aimTarget:target});
    const bolts=g.bolts.filter(b=>!b.enemy);expect(bolts.length).toBeGreaterThanOrEqual(1);
    for(const bolt of bolts){
      const vector=new T.Vector3(target.x-bolt.x,target.y-bolt.y,target.z-bolt.z);
      expect(vector.cross(new T.Vector3(bolt.direction.x,bolt.direction.y,bolt.direction.z)).length()).toBeLessThan(1e-7);
    }
  });
  it('detects swept hits without considering off-height objects',()=>{
    expect(flightSegmentDistance({x:0,y:10,z:0},{x:0,y:10,z:-20},{x:0,y:10,z:-10})).toBe(0);
    expect(flightSegmentDistance({x:0,y:10,z:0},{x:0,y:10,z:-20},{x:0,y:20,z:-10})).toBe(10);
  });
});
describe('cube recall',()=>{
  it('runs through failure, retry, win and restart',()=>{
    const game=new CubeRecall();game.hide();expect(game.choose('cyan')).toBe(true);expect(game.choose('orange')).toBe(false);expect(game.phase).toBe('missed');
    game.retry();game.hide();for(const color of game.pattern)game.choose(color);expect(game.phase).toBe('won');expect(game.score).toBe(1);
    game.next();expect(game.pattern).toHaveLength(4);game.restart();expect(game).toMatchObject({round:1,score:0,phase:'preview'});
  });
});
describe('Redshift Draw',()=>{
  const hand=(ranks:number[],suits:Suit[]=['clubs','diamonds','hearts','spades','clubs']):Card[]=>ranks.map((rank,i)=>({rank,suit:suits[i]}));
  it.each([
    [[2,5,8,10,14],'high card'],[[2,2,8,10,14],'one pair'],[[2,2,8,8,14],'two pair'],[[2,2,2,8,14],'three of a kind'],
    [[2,3,4,5,14],'straight'],[[10,11,12,13,14],'straight'],[[2,2,2,8,8],'full house'],[[2,2,2,2,14],'four of a kind'],
  ])('evaluates %j as %s',(ranks,name)=>expect(evaluateHand(hand(ranks as number[])).name).toBe(name));
  it('distinguishes flushes and straight flushes',()=>{
    expect(evaluateHand(hand([2,5,8,10,14],Array(5).fill('hearts'))).name).toBe('flush');
    expect(evaluateHand(hand([10,11,12,13,14],Array(5).fill('clubs'))).name).toBe('straight flush');
  });
  it('deals unique cards and only replaces marked cards within two draws',()=>{
    expect(new Set(shuffledDeck(7).map(c=>`${c.rank}/${c.suit}`)).size).toBe(52);
    const game=new PokerDraw(7),before=[...game.cards];expect(game.draw()).toBe(false);expect(game.drawsLeft).toBe(2);
    game.toggle(1);game.draw();expect(game.cards[0]).toEqual(before[0]);expect(game.cards[1]).not.toEqual(before[1]);expect(game.drawsLeft).toBe(1);
    game.toggle(2);game.draw();game.toggle(3);expect(game.draw()).toBe(false);expect(game.drawsLeft).toBe(0);
  });
  it('banks once, claims contracts and ends a three-hand run with win or loss',()=>{
    const game=new PokerDraw(12);
    for(let round=1;round<=3;round++){game.cards=hand([2,2,8,8,14]);expect(game.bank()).toBe(true);const score=game.score;expect(game.bank()).toBe(false);expect(game.score).toBe(score);if(round<3)game.next();}
    expect(game.phase).toBe('won');expect(game.score).toBeGreaterThanOrEqual(210);game.restart();expect(game).toMatchObject({round:1,score:0,phase:'playing',drawsLeft:2});
    for(let round=1;round<=3;round++){game.cards=hand([2,5,8,10,13]);game.bank();if(round<3)game.next();}expect(game.phase).toBe('lost');
  });
});
