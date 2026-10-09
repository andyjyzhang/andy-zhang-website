import type {Appearance} from '../config/characters';
import type {LibraryPart} from '../world/part-library';
import {LDRAW_SCALE} from '../world/part-catalog';

// LDraw mold assembly measurements, in 0.4mm units. Root is at the soles.
// 3816c: legs sit 12 units below hips; 3818/3819: shoulders +/-15.552,9.
export const MINIFIGURE_RIG={scale:LDRAW_SCALE,hipsY:-40,legY:-28,legX:10,torsoY:-72,headY:-96,shoulderY:-63,shoulderX:15.552,shoulderAngle:9.782,handX:5,handY:20,handZ:-11,handAngle:45};
export const FACE_PARTS:Record<Appearance['face'],LibraryPart>={smile:'head',confident:'headConfident',glasses:'headGlasses',grin:'headGrin',visor:'headShades',plain:'headPlain'};
