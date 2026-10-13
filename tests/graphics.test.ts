import {describe,expect,it} from 'vitest';
import {GRAPHICS_STORAGE_KEY,graphicsPixelRatio,loadLowGraphics,saveLowGraphics} from '../src/config/graphics';

describe('low graphics preference',()=>{
  it('loads and saves a stable low/standard setting',()=>{
    const values=new Map<string,string>();
    const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}};
    expect(loadLowGraphics(storage)).toBe(false);
    saveLowGraphics(true,storage);expect(values.get(GRAPHICS_STORAGE_KEY)).toBe('low');expect(loadLowGraphics(storage)).toBe(true);
    saveLowGraphics(false,storage);expect(values.get(GRAPHICS_STORAGE_KEY)).toBe('standard');expect(loadLowGraphics(storage)).toBe(false);
  });

  it('uses a materially smaller render target while preserving existing standard caps',()=>{
    expect(graphicsPixelRatio(true,2,false)).toBe(.75);
    expect(graphicsPixelRatio(true,.6,false)).toBe(.6);
    expect(graphicsPixelRatio(false,2,false)).toBe(1.5);
    expect(graphicsPixelRatio(false,2,true)).toBe(1);
    expect(graphicsPixelRatio(false,Number.NaN,false)).toBe(1);
  });

  it('fails safely when browser storage is unavailable',()=>{
    const storage={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
    expect(loadLowGraphics(storage)).toBe(false);
    expect(()=>saveLowGraphics(true,storage)).not.toThrow();
  });
});
