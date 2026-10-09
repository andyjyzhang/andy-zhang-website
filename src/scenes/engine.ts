import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createTown } from '../world/town';
import { Player } from '../player/controller';
import { Input } from '../player/input';
import { FollowCamera } from '../camera/follow-camera';
import { Interface } from '../ui/interface';
import { createBuilding } from '../landmarks/buildings';
import { landmarks, sectionLandmark, isSection, SHIP, type Section } from '../config/world';
import { nearestInteraction, type Interactable } from '../interactions/detection';
import { Vehicle, vehicleSpecs } from '../vehicles/vehicle';
import { safeExit,safeApproach } from '../world/collision';
import { BuildIntro, hasVisited } from './build-intro';
import { AmbientLife } from '../world/ambient';
import { Spaceship, LaunchSequence } from './spaceship';
import type { SpacePrototype } from './space-prototype';
import { PerformanceMonitor } from './performance-monitor';
import { WORLD_STYLE } from '../config/station';
import { groundHeight } from '../player/locomotion';
import { downloadBuild } from '../world/export-build';
import {StationActivities} from '../interactions/activities';
import {SpaceportProps} from '../world/spaceport-props';
import {GateJourney} from './gate-journey';
import {GATE} from '../world/city-layout';
import {GameAudio} from '../audio/game-audio';
import {WorldAudio} from '../audio/world-audio';
import {ENGINE_PODS} from '../world/station-hull';

export class Engine {
  readonly audio=new GameAudio();readonly sound=new WorldAudio(this.audio);
  readonly renderer: T.WebGLRenderer;
  readonly scene = new T.Scene();
  readonly camera = new T.PerspectiveCamera(52, innerWidth / innerHeight, .1, 900);
  readonly town = createTown();
  readonly player = new Player(this.town.root);
  readonly follow = new FollowCamera(this.camera, this.town.obstacles);
  readonly ui: Interface;
  readonly input: Input;
  readonly buildings = landmarks.map(createBuilding);
  readonly vehicles = vehicleSpecs.map(spec => new Vehicle(spec, this.town.root));
  readonly life = new AmbientLife(this.town.root);
  readonly activities = new StationActivities();
  readonly props = new SpaceportProps(this.town.root,this.activities.definitions);
  readonly spaceship = new Spaceship(this.town.root);
  readonly intro: BuildIntro;
  readonly diagnostics: PerformanceMonitor;
  readonly items: Interactable[] = landmarks.map(l => ({ id: l.id, name: l.name, action: 'Explore', key: 'E', x: l.entry[0], z: l.entry[1], radius: 4.2 }));
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private driving: Vehicle | null = null;
  private mode: 'town' | 'launch' | 'space' | 'gate' | 'transit' = 'town';
  private gate:GateJourney|null=null;
  private rideTime=0;
  private launch: LaunchSequence | null = null;
  private space: SpacePrototype | null = null;
  private destinationPromise: Promise<typeof import('./space-prototype')> | null = null;
  private enteringSpace = false;
  private lastTime = 0;
  private uiTime = 0;
  private soundDt=.016;
  private active: Interactable | null = null;
  constructor(parent: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1 : 1.5));
    this.renderer.setSize(innerWidth, innerHeight); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping; this.renderer.toneMappingExposure = WORLD_STYLE.exposure;
    const environment = new RoomEnvironment(), pmrem = new T.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(environment, .04).texture;
    environment.dispose(); pmrem.dispose(); this.scene.environmentIntensity = .45;
    this.renderer.domElement.tabIndex = 0; this.renderer.domElement.setAttribute('role', 'application'); this.renderer.domElement.setAttribute('aria-label', "Andy's World. WASD move, Shift run, Space jump, drag or arrows to look, E explore, F drive, Escape menu."); parent.append(this.renderer.domElement);
    this.input = new Input(this.renderer.domElement); this.ui = new Interface(parent);
    this.ui.onSound=cue=>this.audio.play(cue);
    this.audio.onChange=()=>this.syncSound();
    this.sound.sources={core:this.props.root.getObjectByName('cooling-rotor')!.position,drone:this.props.root.getObjectByName('survey-drone')!.position,cargo:this.props.root.getObjectByName('cargo-gantry-arm')!.position};
    this.input.onCaptureExit=()=>{if(this.ui.paused)return;if(this.mode==='town')this.ui.openMenu();else if(this.mode==='space'||this.mode==='gate')this.returnToTown();};
    this.input.onScroll=()=>{const view=this.activeView;if(view&&!this.ui.paused&&!this.intro?.active&&!(view===this.follow&&(this.follow.overview||this.follow.focus))&&view.distance+this.input.zoom<=1)this.input.captureMouse();};
    this.diagnostics = new PerformanceMonitor(parent);
    this.scene.background = new T.Color(WORLD_STYLE.background);
    this.scene.add(new T.HemisphereLight(WORLD_STYLE.sky, '#1c2948', WORLD_STYLE.ambient));
    const sun = new T.DirectionalLight(WORLD_STYLE.sun, WORLD_STYLE.sunlight); sun.position.set(-65, 145, 75); sun.castShadow = true; sun.shadow.mapSize.setScalar(matchMedia('(pointer: coarse)').matches ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -145, right: 145, top: 125, bottom: -125, far:350 }); sun.shadow.normalBias = .18; sun.shadow.bias = -.0002; this.scene.add(sun);
    if(WORLD_STYLE.id==='orbital') {
      const fill=new T.DirectionalLight('#ffa35a',1.3);fill.position.set(50,35,35);this.scene.add(fill);
      const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d')!;c.fillStyle=WORLD_STYLE.background;c.fillRect(0,0,2048,1024);
      for(let i=0;i<340;i++){const x=(i*1597)%2048,y=(i*i*53)%900;c.fillStyle=i%7?'#93b5d3':'#f4ddb0';c.fillRect(x,y,i%3?1:2,i%3?1:2);}
      const sky=new T.CanvasTexture(canvas);sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;this.scene.background=sky;
    }
    for (const b of this.buildings) {
      this.town.root.add(b.root); const l = b.landmark;
      this.town.obstacles.push(...b.obstacles);
      this.items.push({id:l.id,name:l.name,action:'Explore',key:'E',x:l.x,z:l.z+Math.cos(l.facing??0)*2.56,radius:5});
    }
    this.town.obstacles.push({x:SHIP.x,z:SHIP.z-7.36,w:12.8,d:.64,height:7.2},{x:SHIP.x-6.08,z:SHIP.z-2.56,w:.64,d:10.24,height:7.2},{x:SHIP.x+6.08,z:SHIP.z-2.56,w:.64,d:10.24,height:7.2});
    this.town.obstacles.push(...this.props.staticObstacles);
    this.follow.setObstacles(this.town.obstacles);
    this.items.push({ id: 'ship', name: 'A little further', action: 'Launch', key: 'E', x: SHIP.entry[0], z: SHIP.entry[1], radius: 5 });
    this.vehicles.filter(v => v.spec.driveable).forEach(v => this.items.push({ id: v.spec.id, name: v.spec.name, action: 'Drive', key: 'F', x: v.position.x, z: v.position.z, radius: 4.6 }));
    this.scene.add(this.town.root); this.camera.position.set(0, 15, 31);
    this.intro = new BuildIntro(this.town.root, [...this.town.stages.slice(0, 3), ...this.buildings.map(b => b.root), this.town.stages[3],...this.vehicles.map(v=>v.root),this.spaceship.bay], parent, this.scene, this.camera, () => {
      this.player.teleport(0, 10); this.player.position.y = groundHeight(0,10); this.player.airborne = false; this.player.velocityY = 0;
      this.player.model.root.visible = true; this.follow.resetForPlayer(this.player.position);this.sound.reset(); this.input.clear(); this.renderer.domElement.focus();
      this.ui.notify('ANDY’S WORLD · WASD to explore. Blue studs lead to the good stuff.', 4500);
    },{cue:cue=>this.sound.intro(cue),toggleSound:()=>this.audio.setEnabled(!this.audio.settings.enabled)});
    this.renderer.domElement.addEventListener('pointerup', e => this.intro.click(e, this.renderer.domElement));
    this.ui.connect({
      openSection:s=>this.openSection(s),
      closePanel:()=>{this.follow.focus=null;this.input.clear();this.sound.reset();history.replaceState(null,'',location.pathname+location.search);},
      overview:()=>this.follow.overview=!this.follow.overview,
      pov:()=>{const view=this.activeView;if(!view)return;view.togglePOV();this.syncView();if(view.firstPerson)this.input.captureMouse();},
      travel:id=>this.travel(id),motion:enabled=>this.setMotion(enabled),
      replay:()=>{this.returnToTown();this.exitVehicle(true);this.sound.reset();this.intro.show(this.reducedMotion);},
      action:key=>this.interact(key),returnToTown:()=>this.returnToTown(),activity:(id,command)=>this.commandActivity(id,command),
      exportBuild:()=>{const count=downloadBuild(this.town.root,WORLD_STYLE.name);this.audio.play('select');this.ui.notify(`Exported ${count.toLocaleString()} catalog pieces as an LDraw model.`);},
      sound:enabled=>this.audio.setEnabled(enabled),volume:volume=>this.audio.setVolume(volume),
    });
    this.syncSound();
    for(const {spec,model} of this.life.workers)this.activities.addCrew(spec.id,spec.name,model.root.position.x,model.root.position.z,spec.task);
    this.items.push(...this.activities.items);
    this.ui.setStops([...this.activities.definitions,...this.vehicles.filter(v=>v.spec.driveable).map(v=>v.spec)]);
    this.setMotion(this.reducedMotion);
    window.addEventListener('resize', () => { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); this.space?.resize();this.gate?.resize(); });
    document.addEventListener('visibilitychange', () => { this.input.clear(); this.lastTime = 0; });
    window.addEventListener('hashchange',()=>{
      const section=location.hash.slice(1);
      if(isSection(section))this.openSection(section);
      else if(!section)this.ui.closePanel();
    });
    this.bindTouch(); this.renderer.setAnimationLoop(t => this.update(t));
    const hash = location.hash.slice(1);
    if (isSection(hash)) this.openSection(hash);
    else if (!hasVisited() || new URLSearchParams(location.search).get('intro') === '1') this.intro.show(this.reducedMotion);
    else {this.follow.overview=new URLSearchParams(location.search).get('view')==='world';this.ui.notify(`Welcome to ${WORLD_STYLE.name}. WASD to explore; scroll in for first person.`);}
  }
  private setMotion(enabled: boolean) { this.reducedMotion = enabled; document.documentElement.dataset.motion = enabled ? 'reduced' : 'full'; if (enabled && this.intro?.active) this.intro.finish(); }
  private syncSound(){this.ui.setSound(this.audio.settings.enabled,this.audio.settings.volume,this.audio.status);this.intro?.setSound(this.audio.settings.enabled);this.diagnostics?.audio(this.audio.stats);}
  private bindTouch() {
    this.ui.touch.querySelectorAll<HTMLButtonElement>('[data-key]').forEach(button => {
      const code = button.dataset.key!;
      button.addEventListener('pointerdown', e => { e.preventDefault(); if (this.ui.paused || this.intro.active) return; button.setPointerCapture(e.pointerId); this.input.keys.add(code); this.input.press(code); });
      const release = () => this.input.keys.delete(code); button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
      button.addEventListener('click',e=>{if(e.detail===0&&!this.ui.paused&&!this.intro.active)this.input.press(code);});
    });
  }
  private openSection(section: Section) {
    this.sound.reset();
    if (this.mode !== 'town') this.returnToTown();
    if (this.intro.active) this.intro.finish();
    this.exitVehicle(true);
    const l = landmarks.find(l => l.id === sectionLandmark[section])!;
    this.player.teleport(l.entry[0], l.entry[1]); this.follow.frameLandmark(l.x, l.z, l.facing); this.follow.overview = false;
    this.input.clear(); this.ui.openPanel(section); history.replaceState(null, '', `${location.pathname}${location.search}#${section}`);
  }
  private travel(id: string) {
    this.sound.reset();this.audio.play('travel');
    if (this.mode !== 'town') this.returnToTown();
    if (this.intro.active) this.intro.finish();
    this.exitVehicle(true);
    if (id === 'plaza') this.player.teleport(0, 10);
    else if (id === 'ship') this.player.teleport(...SHIP.entry);
    else if(this.activities.find(id)){const a=this.activities.find(id)!,point=safeApproach(a,this.town.obstacles.concat(this.props.obstacles,this.life.obstacles,this.vehicles.map(v=>v.obstacle())),['arcade','noodles'].includes(a.kind)?Math.PI:0);if(point){this.player.teleport(point.x,point.z);this.follow.yaw=Math.atan2(point.x-a.x,point.z-a.z);}}
    else { const v = this.vehicles.find(v => v.spec.id === id)!;const exit=safeExit(v.position,v.heading,this.town.obstacles.concat(this.vehicles.map(v=>v.obstacle())));if(exit)this.player.teleport(exit.x,exit.z); }
    this.follow.focus = null; this.follow.overview = false;if(!this.activities.find(id))this.follow.yaw=.12; this.input.clear(); this.renderer.domElement.focus();
    this.player.motion.heading=this.follow.yaw+Math.PI;this.player.model.root.rotation.y=this.player.motion.heading;
  }
  private interact(key: 'E' | 'F') {
    if (this.intro.active) return;
    if (!this.driving) this.active = nearestInteraction(this.player.position.x, this.player.position.z, this.items);
    if (this.driving && key === 'F' && !this.ui.paused) { this.exitVehicle(); return; }
    if (this.ui.paused || !this.active || this.active.key !== key) return;
    if (this.active.action === 'Explore') this.openSection(landmarks.find(l => l.id === this.active!.id)!.section);
    if (this.active.action === 'Drive') {
      this.audio.play('enter');this.sound.reset();
      this.driving = this.vehicles.find(v => v.spec.id === this.active!.id)!;
      this.driving.driver.root.visible = true;
      this.player.model.root.visible = false; this.follow.overview = false; this.follow.focus = null; this.input.clear();
      if(this.follow.firstPerson)this.follow.yaw=this.driving.heading+Math.PI;
      this.ui.notify('W / S accelerate and reverse · A / D steer · F to hop out');
    }
    if (this.active.action === 'Launch') this.startLaunch();
    if(this.active.action==='Interact'||this.active.action==='Play') {
      const a=this.activities.find(this.active.id);
      if(a?.kind==='arcade'){this.input.clear();this.ui.openArcade(a,this.activities.status(a.id));this.ui.setSignal(this.props.signal);}
      else if(a)this.commandActivity(a.id,a.commands[0].id);
    }
  }
  private commandActivity(id:string,command:string) {
    const unavailable=this.props.unavailable(id,this.reducedMotion,this.player.position);if(unavailable){this.ui.notify(unavailable,3000);this.audio.play('signal-miss',{volume:.3});return;}
    const result=this.activities.command(id,command,this.props.signal);if(!result)return;
    this.sound.activity(result);
    this.props.activate(id,result.on,command,this.reducedMotion);
    if(result.definition.kind==='crew')this.life.greet(id,this.reducedMotion);
    this.ui.updateActivityStatus(result.message);
    if(id==='gate') {
      this.ui.closeActivity();this.input.setFirstPerson(false);this.input.clear();this.player.model.root.visible=false;
      this.mode='gate';this.gate=new GateJourney(this.ui.root.parentElement!,this.scene,this.camera,this.town.root,this.reducedMotion);this.ui.setScene(true);
    } else if(id==='transit') {
      this.ui.closeActivity();this.input.setFirstPerson(false);this.input.clear();this.player.model.root.visible=false;this.mode='transit';this.rideTime=0;this.ui.setScene(true);
    } else if(result.definition.kind!=='arcade')this.ui.activityUI.showFeedback(result);
  }
  private startLaunch() {
    if (this.mode !== 'town') return;
    this.audio.play('launch');this.sound.reset();
    this.mode = 'launch'; this.input.clear(); this.follow.focus = null; this.follow.overview = false;
    this.launch = new LaunchSequence(this.spaceship, this.camera, this.player.model.root, this.ui.root.parentElement!, this.reducedMotion);
    this.destinationPromise = import('./space-prototype'); this.enteringSpace = false;
    this.ui.setScene(true); this.ui.setPrompt(null); this.ui.toast.hidden = true;
  }
  private async enterSpace() {
    if (this.enteringSpace || !this.launch) return;
    this.enteringSpace = true; const sequence = this.launch;
    try {
      const destination = await this.destinationPromise!;
      if (this.mode !== 'launch' || this.launch !== sequence) return;
      this.space = new destination.SpacePrototype(this.ui.root.parentElement!); this.mode = 'space';this.ui.setScene(true,true);
      this.launch.dispose(); this.launch = null; this.input.clear(); this.renderer.domElement.focus();
    } catch (error) { console.error('Destination unavailable:', error); this.returnToTown(); this.ui.notify('The outpost is unavailable. Your world is still here.'); }
  }
  private returnToTown() {
    if (this.mode === 'town') return;
    this.sound.reset();this.audio.play('return');
    this.input.setFirstPerson(false);
    const previous=this.mode;this.gate?.dispose();this.gate=null;
    this.launch?.dispose(); this.launch = null; this.space?.dispose(); this.space = null;
    this.spaceship.reset(); this.mode = 'town'; this.enteringSpace = false; this.input.clear();
    this.player.model.root.visible = true;
    if(previous==='gate')this.player.teleport(GATE.entry[0],GATE.entry[1]+1.92);
    else if(previous==='transit')this.player.teleport(-50.56,-50.56);
    else this.player.teleport(SHIP.entry[0], SHIP.entry[1]);
    this.follow.focus = null; this.follow.overview = false; this.camera.position.set(this.player.position.x + 12, 12, this.player.position.z + 22);
    this.ui.setScene(false); this.renderer.domElement.focus(); this.ui.notify('Back on familiar ground. Welcome home.');
  }
  private get activeView(){return this.mode==='town'?this.follow:this.mode==='space'?this.space?.view:this.mode==='gate'?this.gate?.view:null;}
  private syncView(){
    const firstPerson=!this.ui.paused&&Boolean(this.activeView?.firstPerson);
    this.input.setFirstPerson(firstPerson);this.ui.setPOV(firstPerson,this.mode==='town'&&this.follow.overview);
  }
  private exitVehicle(force = false) {
    if (!this.driving) return;
    // Clearance must include the occupied vehicle: diagonal body bounds are
    // wider than the old three-unit side exit and can otherwise trap Andy.
    const obstacles = this.town.obstacles.concat(this.life.obstacles,this.props.obstacles,this.vehicles.map(v => v.obstacle()));
    const exit = safeExit({ x: this.driving.position.x, z: this.driving.position.z }, this.driving.heading, obstacles);
    if (!exit && !force) { this.ui.notify('A little tight here. Move into an open space to hop out.'); return; }
    this.driving.speed = 0; this.driving.driver.root.visible = false; this.driving = null; this.player.model.root.visible = true;
    this.audio.play('exit');this.sound.reset();
    if (exit) this.player.teleport(exit.x, exit.z);
    this.follow.focus = null; this.input.clear(); this.renderer.domElement.focus({preventScroll:true});
  }
  private update(time: number) {
    this.diagnostics.startFrame();
    const elapsed = Math.min(this.lastTime ? (time - this.lastTime) / 1000 : .016, 2);
    const dt = Math.min(elapsed, .05); this.lastTime = time;this.soundDt=dt;
    if (document.hidden) return;
    this.town.boosters.update(dt,this.reducedMotion);
    if (this.intro.active) {
      this.input.setFirstPerson(false);
      this.intro.update(elapsed); this.ui.setPrompt(null);
      if (this.input.pressed('Escape')) this.intro.finish();
      this.render(this.scene, this.camera); this.input.endFrame(); return;
    }
    this.syncView();
    if(this.mode==='town'||this.mode==='transit') {
      this.life.update(dt,this.reducedMotion,this.player.position,this.vehicles.map(v=>v.obstacle()));this.props.update(dt,this.reducedMotion,this.player.position);
      if(this.ui.activityUI.active)this.ui.activityUI.updatePhase(this.props.phase(this.ui.activityUI.active));
      for(const worker of this.life.workers){const d=this.activities.find(worker.spec.id),i=this.items.find(i=>i.id===worker.spec.id);if(d&&i){d.x=i.x=worker.model.root.position.x;d.z=i.z=worker.model.root.position.z;}}
      this.ui.setSignal(this.props.signal);
    }
    if(this.mode==='gate'&&this.gate) {
      if(this.input.pressed('Escape'))this.returnToTown();else{this.gate.update(elapsed,this.input,!this.ui.paused);this.ui.setScene(true,this.gate.arrived);this.syncView();this.render(this.gate.scene,this.gate.camera);this.diagnostics.update(time,this.renderer,this.gate.camera,{mode:this.gate.arrived?'observatory':'gate',x:this.gate.position.x,y:this.gate.position.y,z:this.gate.position.z,speed:0});}
      this.input.endFrame();return;
    }
    if(this.mode==='transit') {
      this.rideTime+=elapsed;
      if(this.input.pressed('Escape')||this.rideTime>10)this.returnToTown();
      else {const p=this.life.train.position,view=this.life.rideView;this.camera.position.lerp(view.eye,this.reducedMotion?1:1-Math.exp(-5*dt));this.camera.lookAt(view.target);this.render(this.scene,this.camera);this.diagnostics.update(time,this.renderer,this.camera,{mode:'transit',x:p.x,y:p.y,z:p.z,speed:0});}
      this.input.endFrame();return;
    }
    if (this.mode === 'launch' && this.launch) {
      if (this.input.pressed('Escape')) this.returnToTown();
      else if (!this.ui.paused && this.launch.update(elapsed)) void this.enterSpace();
      this.render(this.scene, this.camera); this.diagnostics.update(time, this.renderer, this.camera, { mode: this.mode, x: this.player.position.x, y: this.player.position.y, z: this.player.position.z, speed: 0 }); this.input.endFrame(); return;
    }
    if (this.mode === 'space' && this.space) {
      if (this.input.pressed('Escape')) this.returnToTown();
      else { this.space.update(dt, this.input, this.reducedMotion, !this.ui.paused);this.syncView(); this.render(this.space.scene, this.space.camera); this.diagnostics.update(time, this.renderer, this.space.camera, { mode: 'space', x: this.space.position.x, y: this.space.position.y, z: this.space.position.z, speed: 0 }); }
      this.input.endFrame(); return;
    }
    const enabled = !this.ui.paused;
    if(enabled&&this.follow.overview&&this.input.down('KeyW','KeyA','KeyS','KeyD','Space'))this.follow.overview=false;
    if (this.input.pressed('Escape')) { if (this.ui.paused) this.ui.closeMenu(); else this.ui.openMenu(); }
    if (this.input.pressed('KeyE')) this.interact('E'); if (this.input.pressed('KeyF')) this.interact('F');
    if (this.mode !== 'town') { this.render(this.scene, this.camera); this.input.endFrame(); return; }
    const dynamicObstacles = this.town.obstacles.concat(this.life.obstacles,this.props.obstacles,this.vehicles.filter(v => v !== this.driving).map(v => v.obstacle()));
    if (this.driving) {
      this.driving.update(dt, this.input, dynamicObstacles, enabled);
      this.player.position.copy(this.driving.position);
      if (!this.input.dragging && !this.follow.overview && !this.follow.firstPerson) {
        const targetYaw = this.driving.heading + Math.PI;
        const diff = Math.atan2(Math.sin(targetYaw - this.follow.yaw), Math.cos(targetYaw - this.follow.yaw));
        this.follow.yaw += diff * (1 - Math.exp(-2.5 * dt));
      }
    } else this.player.update(dt, this.input, this.follow.yaw, dynamicObstacles, enabled, this.reducedMotion);
    for (const v of this.vehicles) { const item = this.items.find(i => i.id === v.spec.id); if (item) { item.x = v.position.x; item.z = v.position.z; } }
    this.active = enabled && !this.driving && !this.follow.overview ? nearestInteraction(this.player.position.x, this.player.position.z, this.items) : null;
    this.follow.update(dt, this.input, this.player.position, Boolean(this.driving), enabled, this.reducedMotion);
    this.player.model.root.visible = !this.driving && !this.follow.firstPerson;
    if(this.driving)this.driving.driver.root.visible=!this.follow.firstPerson;
    this.syncView();
    for (const b of this.buildings) {
      const near = this.active?.id === b.landmark.id;
      b.markers.traverse(o=>{if(o instanceof T.Mesh&&(o.material as T.MeshStandardMaterial).isMeshStandardMaterial)(o.material as T.MeshStandardMaterial).emissiveIntensity=near&&!this.reducedMotion?.2+Math.sin(time*.004)*.08:.12;});
      b.animated.visible = true;
      if (!this.reducedMotion && near && ['garage', 'hobby', 'poker'].includes(b.landmark.id)) b.animated.rotation.y = Math.sin(time * .0015) * (b.landmark.id === 'garage' ? .12 : .05);
    }
    if (time - this.uiTime > 120) {
      this.uiTime = time; this.ui.setPrompt(this.active, Boolean(this.driving));
      const near = landmarks.find(l => Math.hypot(l.x - this.player.position.x, l.z - this.player.position.z) < 15);
      const byShip = Math.hypot(SHIP.x - this.player.position.x, SHIP.z - this.player.position.z) < 13;
      const inPlaza = Math.abs(this.player.position.x) < 21 && Math.abs(this.player.position.z) < 14;
      this.ui.updateLocation(this.player.position.x, this.player.position.z, this.driving ? 'Crew transport / on route' : byShip ? 'The launch bay' : near?.name || (inPlaza ? 'Station concourse' : 'Orbital station / street level'));
    }
    this.render(this.scene, this.camera);
    this.diagnostics.update(time, this.renderer, this.camera, { mode: this.driving ? 'driving' : this.mode, x: this.player.position.x, y: this.player.position.y, z: this.player.position.z, speed: this.driving?.speed || 0 });
    this.input.endFrame();
  }
  private render(scene: T.Scene, camera: T.PerspectiveCamera) {
    const mode=this.intro.active?'intro':this.mode==='gate'&&this.gate?.arrived?'observatory':this.mode;
    const position=mode==='space'&&this.space?this.space.position:mode==='observatory'&&this.gate?this.gate.position:this.player.position;
    this.sound.update(this.soundDt,{mode,x:position.x,z:position.z,paused:this.ui.paused,airborne:mode==='town'&&this.player.airborne,verticalSpeed:this.player.velocityY,driving:!!this.driving,vehicleSpeed:this.driving?.speed,vehicleThrottle:Number(this.input.down('KeyW'))-Number(this.input.down('KeyS')),running:this.input.down('ShiftLeft','ShiftRight'),yaw:this.activeView?.yaw,cooling:this.props.coolingActive,drone:this.props.busy('repair'),cargo:this.props.busy('cargo'),train:this.life.train.position,progress:mode==='intro'?this.intro.buildTime:this.launch?.elapsed,building:this.intro.building,boosters:ENGINE_PODS,overview:this.follow.overview});
    this.diagnostics.audio(this.audio.stats);
    this.diagnostics.beforeRender(this.renderer); this.renderer.render(scene, camera); this.diagnostics.afterRender(this.renderer);
  }
}
