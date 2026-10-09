import { describe, it, expect } from 'vitest';
import { nearestInteraction, type Interactable } from '../src/interactions/detection';
import {isSection,sectionLandmark} from '../src/config/world';
const items: Interactable[] = [{ id: 'garage', name: 'Garage', action: 'Explore', key: 'E', x: 0, z: 0, radius: 4 }, { id: 'ship', name: 'Ship', action: 'Launch', key: 'E', x: 5, z: 0, radius: 4 }];
describe('contextual interactions', () => {
  it('accepts every chapter route and rejects unknown or inherited object names',()=>{
    for(const section of Object.keys(sectionLandmark))expect(isSection(section)).toBe(true);
    for(const unknown of ['','missing','constructor','toString','__proto__'])expect(isSection(unknown)).toBe(false);
  });
  it('only offers actions within reach', () => expect(nearestInteraction(15, 0, items)).toBeNull());
  it('selects one nearest target with its specific action', () => { const target = nearestInteraction(4, 0, items); expect(target?.id).toBe('ship'); expect(target?.action).toBe('Launch'); });
});
