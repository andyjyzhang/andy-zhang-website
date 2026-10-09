import * as T from 'three';
import { BrickBatch, part, sign } from '../world/brick-kit';
import type { Input } from '../player/input';
import {DestinationCamera} from '../camera/destination-camera';
import {moveWithCollision} from '../world/collision';

// Independent destination: no town content, vehicles, landmarks or controller imports.
export class SpacePrototype {
  readonly scene = new T.Scene();
  readonly camera = new T.PerspectiveCamera(48, innerWidth / innerHeight, .1, 500);
  readonly overlay = document.createElement('section');
  private ship = new T.Group();
  private obstacles=[{x:-20,z:-32,w:16,d:11,height:11},{x:16,z:-35,w:6,d:6,height:19}];
  readonly view=new DestinationCamera(this.camera,{distance:36,yaw:.55,pitch:.42},this.obstacles);
  private anchor=new T.Vector3();
  private docking: T.Group;
  private resources: { dispose: () => void }[] = [];
  private time = 0;
  get position() { return this.ship.position; }
  constructor(parent: HTMLElement) {
    this.scene.background = new T.Color('#172a36'); this.scene.fog = new T.Fog('#172a36', 100, 270);
    this.scene.add(new T.HemisphereLight('#b4d9e1', '#506b61', 2)); const sun = new T.DirectionalLight('#f8d69b', 3); sun.position.set(-25, 45, 25); this.scene.add(sun);
    const terrain = new BrickBatch(); terrain.box('#657a75', 0, -4, -16, 68, 7, 62); terrain.box('#8e9f8c', 0, -.4, -16, 67, .5, 61);
    for (let x = -32; x < 33; x += 2) for (let z = -46; z < 14; z += 2) terrain.add('stud', '#8e9f8c', x, -.1, z, .9, .7, .9);
    terrain.box('#415b65', 0, 0, -9, 23, .5, 25); terrain.add('cylinder', '#c4bb94', 0, .34, -9, 13, .1, 13);
    terrain.box('#a6b5aa', -20, 5, -32, 15, 10, 10, true); terrain.box('#687f80', -20, 10.4, -32, 16, .7, 11, true);
    for (let i = 0; i < 4; i++) terrain.box('#5f8c99', -24 + i * 2.7, 5.7, -26.9, 1.8, 2.3, .1);
    terrain.box('#bac5b1', 16, 8, -35, 5, 16, 5, true); terrain.add('sphere', '#c0c7b0', 16, 17, -35, 9, 3, 9);
    for (let i = 0; i < 6; i++) { terrain.box('#637774', -27 + i * 10, 1 + (i % 3), -44, 7, 3 + i % 3, 7, true); }
    this.docking = terrain.build(this.scene, 'orbital-outpost'); const label = sign(this.scene, 'CURIOSITY OUTPOST', -20, 9, -26.85, 12, 1);
    this.resources.push(label.geometry, label.material, label.material.map!);
    const starPositions = new Float32Array(240 * 3);
    for (let i = 0; i < 240; i++) { const a = i * 2.399963, y = 30 + (i % 17) * 7; starPositions[i * 3] = Math.cos(a) * 180; starPositions[i * 3 + 1] = y; starPositions[i * 3 + 2] = Math.sin(a) * 180; }
    const starGeo = new T.BufferGeometry(); starGeo.setAttribute('position', new T.BufferAttribute(starPositions, 3)); const starMaterial = new T.PointsMaterial({ color: '#e3e9d5', size: .6, sizeAttenuation: true }); this.scene.add(new T.Points(starGeo, starMaterial)); this.resources.push(starGeo, starMaterial);
    const planet = new T.Mesh(new T.SphereGeometry(18, 24, 16), new T.MeshStandardMaterial({ color: '#d7a779', roughness: .9 })); planet.position.set(70, 50, -115); this.scene.add(planet);
    const ring = new T.Mesh(new T.TorusGeometry(26, 1.5, 6, 64), new T.MeshStandardMaterial({ color: '#9baab0', roughness: .7 })); ring.position.copy(planet.position); ring.rotation.x = .8; this.scene.add(ring);
    this.resources.push(planet.geometry, planet.material, ring.geometry, ring.material);
    const body = new BrickBatch(); body.box('#f1ebd6', 0, .5, 0, 2, .7, 6, true); body.box('#609baa', 0, 1.2, .7, 1.4, .9, 2); body.box('#e9b655', 0, .96, 2.2, .4, .1, 2);
    for (const side of [-1, 1]) { body.box('#d6dfd6', side * 2.4, .4, -1, 3, .25, 3, true); body.box('#638996', side * 3.4, .5, -1, .6, .4, 3); part(this.ship, 'sphere', '#e9a464', side * 2.4, .55, -2.5, .8, .8, .8); }
    body.build(this.ship);this.ship.name='outpost-ship'; this.ship.position.set(0, 8, 9); this.ship.rotation.y = Math.PI; this.scene.add(this.ship);
    this.camera.position.set(29, 28, 47); this.camera.lookAt(0, 2, -12);
    this.overlay.className = 'space-introduction'; this.overlay.innerHTML = `<p>BEYOND THE STATION / 01</p><h1>Curiosity outpost.</h1><p>A small corner of a much bigger galaxy.</p><span>WASD to drift · Scroll to change view · Esc to return</span>`; parent.append(this.overlay);
  }
  update(dt: number, input: Input, reducedMotion: boolean, enabled = true) {
    this.time += dt;
    if (enabled) {
      const x=Number(input.down('KeyD'))-Number(input.down('KeyA')),z=Number(input.down('KeyS'))-Number(input.down('KeyW')),magnitude=Math.hypot(x,z)||1;
      const yaw=this.view.yaw,speed=input.down('ShiftLeft','ShiftRight')?12:8;
      const dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*dt*speed/magnitude,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*dt*speed/magnitude;
      moveWithCollision(this.ship.position,dx,dz,3.8,this.obstacles,{minX:-26.8,maxX:26.8,minZ:-28.8,maxZ:20.8});
      const heading=this.view.firstPerson?yaw+Math.PI:magnitude&&Math.hypot(x,z)>0?Math.atan2(dx,dz):this.ship.rotation.y;
      const difference=Math.atan2(Math.sin(heading-this.ship.rotation.y),Math.cos(heading-this.ship.rotation.y));
      this.ship.rotation.y+=difference*(reducedMotion?1:1-Math.exp(-12*dt));
    }
    this.ship.position.y = 8 + (reducedMotion ? 0 : Math.sin(this.time * .7) * .22);
    this.anchor.copy(this.ship.position);this.anchor.y+=1.6;
    this.view.update(dt,input,this.anchor,reducedMotion,enabled);this.ship.visible=!this.view.firstPerson;
    this.overlay.querySelector('span')!.textContent=this.view.firstPerson?'WASD to drift · Mouse to look · Scroll out for third person · Esc to return':'WASD to drift · Drag / arrows to look · Scroll in for POV · Esc to return';
  }
  resize() { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); }
  dispose() {
    this.overlay.remove(); this.resources.forEach(r => r.dispose());
    this.scene.traverse(o => { if (o instanceof T.InstancedMesh) o.dispose(); });
    this.scene.remove(this.docking); this.scene.clear();
  }
}
