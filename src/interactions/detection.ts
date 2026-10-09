export type Action = 'Explore' | 'Drive' | 'Launch' | 'Play' | 'Interact';
export interface Interactable { id: string; name: string; action: Action; key: 'E' | 'F'; x: number; z: number; radius: number; }
export function nearestInteraction(x: number, z: number, items: Interactable[]) {
  let nearest: Interactable | null = null, nearestDistance = Infinity;
  for (const item of items) {
    const distance = Math.hypot(item.x - x, item.z - z);
    if (distance < item.radius && distance < nearestDistance) { nearest = item; nearestDistance = distance; }
  }
  return nearest;
}
