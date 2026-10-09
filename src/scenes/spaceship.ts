import * as T from 'three';
import { BrickBatch, palette as P, part, sign } from '../world/brick-kit';
import { SHIP } from '../config/world';
import { libraryPart } from '../world/part-library';
import { STUD as S,PLATE as H,LDRAW_SCALE } from '../world/part-catalog';

export class Spaceship {
  readonly bay = new T.Group();
  readonly ship = new T.Group();
  readonly engines: T.Group[] = [];
  readonly lights = new T.MeshStandardMaterial({ color: '#8bdbdc', emissive: '#57b9c2', emissiveIntensity: .12, roughness: .28 });
  private engineMaterial = new T.MeshStandardMaterial({ color: '#edb06b', emissive: '#ff9939', emissiveIntensity: .1, roughness: .2 });
  constructor(parent: T.Object3D) {
    this.bay.position.set(SHIP.x, .512, SHIP.z);
    const hangar = new BrickBatch();
    hangar.stack('#9ba19d',0,0,0,20,1,24,'tile');
    for(const side of [-1,1]){hangar.stack('#008f9b',side*9.5*S,H,-4*S,1,24,16);hangar.stack('#f2cd37',side*9.5*S,H,4*S,1,3,1,'stud');}
    hangar.stack('#008f9b',0,H,-11.5*S,18,24,1);hangar.stack('#0a3463',0,25*H,-4*S,20,1,16,'stud');
    hangar.stack(P.ink,0,22*H,3.5*S,20,3,1);
    for(const x of [-4*S,4*S])hangar.stack('#f2cd37',x,H,7*S,1,1,8,'tile');
    hangar.build(this.bay,'launch-bay');sign(this.bay,'A LITTLE FURTHER',0,23.5*H,4*S,16*S,S);
    const body = new BrickBatch();
    body.box('#e8e8d8', 0, 1.1, 0, 2.1, .7, 6.2, true);
    const nose = libraryPart('slope', '#f2f0e0'); nose.scale.setScalar(LDRAW_SCALE); nose.rotation.x = Math.PI; nose.position.set(0, 1.536, 2.56); this.ship.add(nose);
    body.box('#d9e1d5', 0, 1.35, 3.9, .8, .3, 1.2, true);
    body.box('#558d9e', 0, 1.9, .8, 1.35, .9, 2.4);
    body.box('#a5d0d0', 0, 2.1, 1.25, 1.2, .4, 1.2);
    body.box('#ddad53', 0, 1.53, 3.2, .3, .15, 2.8);
    for (const side of [-1, 1]) {
      body.box('#dce3db', side * 2.6, 1.05, -.6, 3.2, .28, 3.5, true);
      body.box('#547f8d', side * 3.8, 1.05, -.6, .7, .3, 3.5, true);
      body.box('#d4dacc', side * 2.8, 1.45, -2, 1.4, .7, 2.5, true);
      body.box('#e0b35a', side * 2.8, 1.84, -1.7, .4, .15, 1.6);
      body.box(P.ink, side * 3.8, 1.15, 1.5, .35, .3, 2.4);
      body.add('cylinder', '#afc1bb', side * 2.8, .55, -1.6, .5, 1, .5);
      body.box(P.ink, side * 2.8, .18, -1.6, .8, .17, 1.7);
      const glow=libraryPart('conePart','#fe8a18');glow.scale.setScalar(LDRAW_SCALE);glow.rotation.x=-Math.PI/2;glow.position.set(side*2.56,1.536,-2.56);glow.traverse(o=>{if(o instanceof T.Mesh)o.material=this.engineMaterial;});this.ship.add(glow);this.engines.push(glow);
      const lamp = part(this.bay, 'box', '@cyan', side * 4.4, 5.9, .1, .8, .25, .4); lamp.traverse(o=>{if(o instanceof T.Mesh)o.material=this.lights;});
    }
    body.build(this.ship, 'ship-bricks'); this.bay.add(this.ship); parent.add(this.bay);
  }
  reset() { this.ship.position.set(0, 0, 0); this.ship.rotation.set(0, 0, 0); this.lights.emissiveIntensity = .12; this.engineMaterial.emissiveIntensity = .1; }
  setPower(amount: number) { this.lights.emissiveIntensity = .12 + amount * .7; this.engineMaterial.emissiveIntensity = .1 + amount * 2.2; }
}

export class LaunchSequence {
  elapsed = 0;
  readonly overlay = document.createElement('div');
  private playerStart: T.Vector3;
  constructor(private spaceship: Spaceship, private camera: T.PerspectiveCamera, private player: T.Object3D, parent: HTMLElement, private reducedMotion: boolean) {
    this.playerStart = player.position.clone();
    this.overlay.className = 'launch-overlay'; this.overlay.setAttribute('role', 'status'); this.overlay.innerHTML = `<div class="cinema-bar"></div><div class="launch-caption"><small>A LITTLE FURTHER / FLIGHT 01</small><p data-launch-caption>Preflight. Curiosity: checked.</p></div><div class="cinema-bar bottom"></div>`; parent.append(this.overlay);
    spaceship.reset();
  }
  update(dt: number) {
    this.elapsed += dt; const t = this.elapsed;
    if (this.reducedMotion) { this.spaceship.setPower(1); this.player.visible = false; return t > .4; }
    const power = T.MathUtils.smoothstep(t, .5, 2.2); this.spaceship.setPower(power);
    if (t < 1.3) this.player.position.lerpVectors(this.playerStart, new T.Vector3(SHIP.x, 1.8, SHIP.z + .8), Math.min(1, t / 1.3));
    else this.player.visible = false;
    const forward = T.MathUtils.smoothstep(t, 1.4, 3) * 7;
    const lift = Math.max(0, t - 2.7) ** 2 * 8;
    this.spaceship.ship.position.set(0, Math.min(60, lift) + power * 1.2, forward);
    this.spaceship.ship.rotation.x = -T.MathUtils.smoothstep(t, 3, 4.5) * .65;
    const target = new T.Vector3(SHIP.x, 2 + this.spaceship.ship.position.y, SHIP.z + forward);
    const desired = new T.Vector3(SHIP.x + 15, 9 + lift * .5, SHIP.z + 20);
    this.camera.position.lerp(desired, 1 - Math.exp(-4 * dt)); this.camera.lookAt(target);
    this.overlay.querySelector('[data-launch-caption]')!.textContent = t < 1.4 ? 'Preflight. Curiosity: checked.' : t < 3.2 ? 'Engines online. Next stop: somewhere new.' : 'A little further from home.';
    return t > 5.5;
  }
  dispose() { this.overlay.remove(); }
}
