import { MeshStandardMaterial } from 'three';
import { legoColor } from './part-catalog';
export const plastic = new MeshStandardMaterial({ roughness: .24, metalness: 0, color: 'white', envMapIntensity: .65 });
const materials = new Map<string, MeshStandardMaterial>();
export function material(color: string) {
  color=legoColor(color);
  if (!materials.has(color)) materials.set(color, new MeshStandardMaterial({ color, roughness: .24, metalness: 0, envMapIntensity: .65 }));
  return materials.get(color)!;
}
