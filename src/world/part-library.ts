import * as T from 'three';
import data from '../assets/ldraw-parts.json';
import { material } from './plastic';
import sourceNames from '../assets/ldraw-catalog.json';

export type LibraryPart = keyof typeof data;
interface PackedMesh { positionScale?:number;positions: string; normals: string; indices: string;color?:string }
const cache = new Map<string, T.BufferGeometry>();
function bytes(base64: string) { return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer; }
export function partGeometry(name: LibraryPart, layer:string = 'plastic') {
  const key = `${name}/${layer}`;
  if (!cache.has(key)) {
    const packed = (data[name] as Record<string, PackedMesh>)[layer];
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position', new T.BufferAttribute(Float32Array.from(new Int16Array(bytes(packed.positions)), v => v / (packed.positionScale||256)), 3));
    geometry.setAttribute('normal', new T.BufferAttribute(Float32Array.from(new Int16Array(bytes(packed.normals)), v => v / 32767), 3));
    geometry.setIndex(new T.BufferAttribute(new Uint16Array(bytes(packed.indices)), 1));
    geometry.computeBoundingSphere(); cache.set(key, geometry);
  }
  return cache.get(key)!;
}
export function libraryPart(name: LibraryPart, color: string, printed = true) {
  const group = new T.Group(); group.name = `LDraw ${name}`;group.userData.ldrawPart={file:sourceNames[name],color};
  for (const layer of Object.keys(data[name])) {
    if (layer !== 'plastic' && !printed) continue;
    const mesh = new T.Mesh(partGeometry(name, layer), material(partLayerColor(name,layer,color)));
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  }
  return group;
}
export function partLayers(name:LibraryPart){return Object.keys(data[name]);}
export function partLayerColor(name:LibraryPart,layer:string,plastic:string) {
  return (data[name] as Record<string,PackedMesh>)[layer].color??(layer==='print'?'#141414':plastic);
}
