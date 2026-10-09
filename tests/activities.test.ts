import {describe,it,expect} from 'vitest';
import {StationActivities} from '../src/interactions/activities';
import {CITY_LOTS,GATE} from '../src/world/city-layout';
describe('station activity routing',()=>{
  it('exposes the gate and city facilities through the same contextual action system',()=>{
    const station=new StationActivities();expect(new Set(station.definitions.map(d=>d.id)).size).toBe(station.definitions.length);
    expect(station.definitions.filter(d=>d.kind==='facility')).toHaveLength(CITY_LOTS.length-1);
    expect(station.items.find(i=>i.id==='gate')).toMatchObject({action:'Interact',key:'E',x:GATE.entry[0],z:GATE.entry[1]});
    expect(station.items.find(i=>i.id==='arcade')?.action).toBe('Play');
  });
  it('toggles actual activity state and rejects commands that are not exposed',()=>{
    const s=new StationActivities();expect(s.command('reactor','delete')).toBeNull();expect(s.status('reactor')).toBe('Ready.');
    expect(s.command('reactor','toggle')?.on).toBe(true);expect(s.command('reactor','toggle')?.on).toBe(false);
    expect(s.command('gate','activate')?.message).toContain('observation deck');expect(s.command('missing','toggle')).toBeNull();
  });
  it('evaluates the signal that was stopped and keeps crew dialogue separate from portfolio facts',()=>{
    const s=new StationActivities();expect(s.command('arcade','stop',1)?.message).toContain('Synchronized');expect(s.command('arcade','stop',0)?.message).toContain('Almost');
    s.addCrew('crew-test','Dock worker',10,20,'A station worker.');expect(s.items.find(i=>i.id==='crew-test')?.action).toBe('Interact');expect(s.command('crew-test','wave')?.message).toContain('acknowledges');
  });
});
