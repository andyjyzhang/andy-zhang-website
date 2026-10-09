import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {createMinifigure} from '../src/player/minifigure';
import {playerAppearance} from '../src/config/world';
import {stationCrew} from '../src/world/ambient';
import {FACE_PARTS,MINIFIGURE_RIG as R} from '../src/player/minifigure-rig';
import {libraryPart,partGeometry,partLayers,partLayerColor} from '../src/world/part-library';
import type {Appearance} from '../src/config/characters';

describe('calibrated physical minifigures',()=>{
  const cast=[{name:'Andy',appearance:playerAppearance},...stationCrew];
  it.each(cast)('$name uses physical printed heads and grounded, uniformly scaled limbs',({appearance})=>{
    const a=appearance as Appearance,model=createMinifigure(a),rig=model.root.getObjectByName('minifigure-rig')!;
    model.root.updateMatrixWorld(true);
    expect(rig.scale.toArray()).toEqual([R.scale,R.scale,R.scale]);
    const feet=model.legs.map(l=>new T.Box3().setFromObject(l));
    expect(feet[0].min.y).toBeCloseTo(0);expect(feet[1].min.y).toBeCloseTo(0);
    const head=model.head.getObjectByName(`LDraw ${FACE_PARTS[a.face]}`)!;
    expect(head).toBeDefined();const bounds=new T.Box3().setFromObject(head);
    expect(bounds.getSize(new T.Vector3()).x).toBeCloseTo(26*R.scale);
    expect(bounds.min.y).toBeCloseTo(72*R.scale);
    const plastic=rig.getObjectByName('LDraw torso')!,torsoBounds=new T.Box3().setFromObject(plastic);
    expect(torsoBounds.min.y).toBeCloseTo(40*R.scale);
    expect(torsoBounds.max.y).toBeCloseTo(84*R.scale);
    expect(head.children.some(o=>o instanceof T.Mesh&&(o.material as T.MeshStandardMaterial).map)).toBe(false);
    for(const arm of model.arms) {
      const hand=arm.getObjectByName('LDraw hand')!;expect(Math.abs(hand.position.x)).toBe(R.handX);
      expect(hand.position.y).toBe(R.handY);expect(hand.position.z).toBe(R.handZ);
      arm.rotation.x=-1.1;
    }
    for(const leg of model.legs)leg.rotation.x=.9;
    model.root.updateMatrixWorld(true);expect(model.head.position.y).toBe(R.headY);
    expect(new T.Box3().setFromObject(model.root).getSize(new T.Vector3()).toArray().every(Number.isFinite)).toBe(true);
  });
  it('keeps white eye details, teeth, brown brows and grey glasses separate from yellow plastic',()=>{
    expect(partLayers('headGlasses')).toEqual(expect.arrayContaining(['plastic','print','fixed-15','fixed-70','fixed-71']));
    expect(partLayerColor('headGlasses','fixed-15','#f2cd37')).toBe('#ffffff');
    expect(partLayerColor('headGlasses','fixed-70','#f2cd37')).toBe('#582a12');
    const head=libraryPart('headGlasses','#f2cd37');expect(head.children).toHaveLength(5);
    const print=partGeometry('headConfident','print');print.computeBoundingBox();
    expect(print.boundingBox!.max.z).toBeLessThan(-11);expect(print.boundingBox!.min.y).toBeGreaterThan(4);
    expect(partLayers('headPlain')).toEqual(['plastic']);
  });
  it('seats a cap and helmet without the old four-unit lift and shares face mold geometry',()=>{
    const cap=createMinifigure(playerAppearance).head.getObjectByName('LDraw cap')!;expect(cap.position.y).toBe(0);
    const helmet=createMinifigure({...playerAppearance,hair:'helmet'}).head;
    expect(helmet.getObjectByName('LDraw helmet')!.position.y).toBe(0);
    expect(helmet.getObjectByName('LDraw helmetVisor')).toBeDefined();
    const a=libraryPart('headConfident','#f2cd37'),b=libraryPart('headConfident','#f2cd37');
    expect((a.children[0] as T.Mesh).geometry).toBe((b.children[0] as T.Mesh).geometry);
  });
});
