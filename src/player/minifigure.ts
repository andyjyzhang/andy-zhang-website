import * as T from 'three';
import { material } from '../world/brick-kit';
import { libraryPart } from '../world/part-library';
import { playerAppearance } from '../config/world';
import type { Appearance } from '../config/characters';
import {addCharacterPrints,addLegPrint} from './character-prints';
import {FACE_PARTS,MINIFIGURE_RIG as R} from './minifigure-rig';

const headphoneBand=new T.TorusGeometry(14.4,1.25,8,32,Math.PI);
const headphoneCup=new T.CylinderGeometry(4,4,2.8,16);

export type { Appearance } from '../config/characters';
export function createMinifigure(appearance: Appearance = playerAppearance) {
  const root = new T.Group();
  const body = new T.Group(); root.add(body);
  // LDraw uses downward Y and forward -Z, in 0.4 mm units. Keep the precise
  // part proportions, then orient and uniformly scale the complete skeleton.
  const skeleton = new T.Group();skeleton.name='minifigure-rig'; skeleton.rotation.x = Math.PI; skeleton.scale.setScalar(R.scale); body.add(skeleton);
  const torso = libraryPart('torso', appearance.torsoColor); torso.position.y = R.torsoY; skeleton.add(torso);
  const hips = libraryPart('hips', appearance.legColor); hips.position.y = R.hipsY; skeleton.add(hips);
  const legs = [-1, 1].map((side, i) => {
    const pivot = new T.Group();pivot.name=i?'left-hip':'right-hip'; pivot.position.set(side * R.legX, R.legY, 0); skeleton.add(pivot);
    const leg = libraryPart(i ? 'leftLeg' : 'rightLeg', appearance.legColor); leg.position.x = -side * R.legX; pivot.add(leg);addLegPrint(leg,side*R.legX,appearance);
    return pivot;
  });
  const arms = [-1, 1].map((side, i) => {
    const joint = new T.Group(); joint.position.set(side * R.shoulderX, R.shoulderY, 0); joint.rotation.z = -side * T.MathUtils.degToRad(R.shoulderAngle); skeleton.add(joint);
    const pivot = new T.Group(); joint.add(pivot);
    pivot.add(libraryPart(i ? 'leftArm' : 'rightArm', appearance.torsoColor));
    const hand = libraryPart('hand', appearance.skinTone); hand.position.set(side * R.handX, R.handY, R.handZ); hand.rotation.x = T.MathUtils.degToRad(R.handAngle); pivot.add(hand);
    return pivot;
  });
  const head = new T.Group();head.name='head-pivot'; head.position.y = R.headY;
  // Patterned heads include their matching plastic facets and actual ink geometry.
  head.add(libraryPart(FACE_PARTS[appearance.face], appearance.skinTone));skeleton.add(head);
  if (appearance.hair !== 'none') {
    const hair=libraryPart(appearance.hair === 'cap' ? 'cap' : appearance.hair==='helmet'?'helmet':'hair', appearance.hairColor);
    if(appearance.hair==='cap') {
      if(appearance.capFacing==='backward')hair.rotation.y=Math.PI;
    }
    head.add(hair);
    if(appearance.hair==='helmet') {
      const visor=libraryPart('helmetVisor','#b3d8df');
      visor.traverse(o=>{if(o instanceof T.Mesh){const m=(o.material as T.MeshStandardMaterial).clone();m.transparent=true;m.opacity=.26;m.depthWrite=false;m.roughness=.12;o.material=m;}});
      head.add(visor);
    }
  }
  if (appearance.accessory === 'backpack') {
    const backpack = libraryPart('backpack', '#687b69'); backpack.position.y = R.torsoY; skeleton.add(backpack);
  }
  if(appearance.accessory==='satchel') {
    const bag=libraryPart('backpack','#a95500');bag.position.set(0,R.torsoY,0);skeleton.add(bag);
  }
  if(appearance.accessory==='headphones') {
    const band=new T.Mesh(headphoneBand,material('#05131d'));band.rotation.z=Math.PI;band.position.y=7;head.add(band);
    for(const side of [-1,1]){const cup=new T.Mesh(headphoneCup,material('#0a3463'));cup.rotation.z=Math.PI/2;cup.position.set(side*14,7,0);head.add(cup);}
  }
  addCharacterPrints(torso,appearance);
  return { root, body, head, legs, arms };
}
