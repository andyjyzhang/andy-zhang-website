// Shared configuration for the single orbital station.
export const WORLD_STYLE = {
  id:'orbital',name:"Andy's Orbital Station",size:[245.76,204.8] as [number,number],
  overview:[185,125,250] as [number,number,number],overviewTarget:[0,12,-8] as [number,number,number],background:'#071321',ground:'#05131d',
  road:'#05131d',paving:'#6074a1',trim:'#0a3463',accent:'@cyan',sky:'#7bdde5',sun:'#95bded',
  ambient:1.45,sunlight:1.8,exposure:1.05,
};
export const ACTIVE_BOUNDS={minX:-WORLD_STYLE.size[0]/2+1.28,maxX:WORLD_STYLE.size[0]/2-1.28,minZ:-WORLD_STYLE.size[1]/2+1.28,maxZ:WORLD_STYLE.size[1]/2-1.28};
