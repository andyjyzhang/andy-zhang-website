export type LandmarkId = 'house' | 'garage' | 'poker' | 'hobby' | 'campus';
export type Section = 'about' | 'experience' | 'projects' | 'education' | 'hobbies' | 'poker' | 'contact';
export interface Landmark { id: LandmarkId; name: string; subtitle: string; number: string; x: number; z: number; width: number; depth: number; color: string; section: Section; entry: [number, number]; facing?: number }
export const landmarks: Landmark[] = [
  { id:'house',name:"Andy's flight studio",subtitle:'A little about me',number:'01',x:-38.4,z:-28.16,width:19.2,depth:15.36,color:'#6074a1',section:'about',entry:[-38.4,-17.92] },
  { id:'garage',name:'Zero-G workshop',subtitle:'Ideas, built for real',number:'02',x:16,z:-30.72,width:25.6,depth:17.92,color:'#008f9b',section:'experience',entry:[16,-19.2] },
  { id:'poker',name:'The redshift lounge',subtitle:'Always a student of the game',number:'03',x:65.28,z:1.28,width:20.48,depth:12.8,color:'#720e0f',section:'poker',entry:[65.28,-7.68],facing:Math.PI },
  { id:'hobby',name:'Off-duty / game hub',subtitle:'Off the clock',number:'04',x:-31.36,z:35.84,width:21.76,depth:19.2,color:'#fe8a18',section:'hobbies',entry:[-31.36,23.68],facing:Math.PI },
  { id:'campus',name:'Waterloo / data archive',subtitle:'Never stop being curious',number:'05',x:16,z:71.68,width:24.32,depth:20.48,color:'#9ba19d',section:'education',entry:[16,84.48] },
];
landmarks.forEach(l=>{l.x=snapStud(l.x);l.z=snapStud(l.z);l.width=Math.round(l.width/STUD)*STUD;l.depth=Math.round(l.depth/STUD)*STUD;l.entry=[snapStud(l.entry[0]),snapStud(l.entry[1])];});
// Temporary toy appearance. Configure clothing, face and accessories here.
export const playerAppearance:Appearance = { hair:'cap',hairColor:'#0a3463',capFacing:'backward',face:'confident',skinTone:'#f2cd37',torso:'hoodie',torsoColor:'#fe8a18',legs:'standard',legColor:'#0a3463',accessory:'backpack',accentColor:'#e4cd9e' };
export { ACTIVE_BOUNDS as WORLD_BOUNDS } from './station';
export const SPAWN = { x: 0, z: 10 };
export const SHIP = { x:55.68,z:-30.72,entry:[55.68,-23.04] as [number,number] };
export const sectionLandmark: Record<Section, LandmarkId> = { about: 'house', contact: 'house', experience: 'garage', projects: 'garage', education: 'campus', hobbies: 'hobby', poker: 'poker' };
export function isSection(value:string):value is Section {return Object.hasOwn(sectionLandmark,value);}
import { snapStud,STUD } from '../world/part-catalog';
import type { Appearance } from './characters';
