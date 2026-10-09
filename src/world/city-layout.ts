export type BuildingDesign='civic'|'warehouse'|'apartments'|'terrace'|'factory'|'arcade';
export interface CityLot {name:string;x:number;z:number;w:number;d:number;floors:number;design:BuildingDesign;facing?:number}
export interface Street {x:number;z:number;w:number;d:number}
// Authored arterial loop, branching freight lanes and offset pedestrian blocks.
// Road dimensions are world units; building dimensions are studs.
export const STREETS:Street[]=[
  {x:-58.88,z:20.48,w:8.96,d:153.6},{x:38.4,z:20.48,w:8.96,d:153.6},
  {x:0,z:-51.2,w:235.52,d:8.96},{x:0,z:52.48,w:235.52,d:8.96},
  {x:0,z:16.64,w:235.52,d:8.96},{x:69.12,z:-13.44,w:62.72,d:7.68},
  {x:99.84,z:3.84,w:7.68,d:176.64},{x:-105.6,z:3.84,w:6.4,d:176.64},
  {x:0,z:92.16,w:235.52,d:7.68},
];
export const GATE={x:0,z:-74.24,entry:[0,-59.52] as [number,number],w:99.84,d:16.64};
export const TRANSIT={y:15.36,width:5.12,points:[
  [38.4,-51.2],[38.4,16.64],[99.84,16.64],
  [99.84,92.16],[-105.6,92.16],[-105.6,16.64],[-58.88,16.64],[-58.88,-51.2],
] as [number,number][]};
export const CITY_LOTS:CityLot[]=[
  {name:'NAV / 01',x:-81.92,z:-72.96,w:30,d:28,floors:15,design:'factory'},
  {name:'FREIGHT CONTROL',x:77.44,z:-72.96,w:32,d:28,floors:18,design:'civic'},
  {name:'AUX DOCK',x:55.68,z:-63.36,w:12,d:14,floors:4,design:'warehouse'},
  {name:'ION WORKS',x:-81.92,z:-30.72,w:34,d:30,floors:5,design:'warehouse'},
  {name:'CREW QUARTERS',x:-82.56,z:0,w:34,d:30,floors:10,design:'apartments'},
  {name:'CARGO EXCHANGE',x:-81.92,z:35.84,w:34,d:28,floors:3,design:'warehouse'},
  {name:'RADIO / 90.4',x:-81.92,z:72.32,w:34,d:34,floors:11,design:'terrace'},
  {name:'RELAY / 07',x:-13.44,z:-32.64,w:16,d:26,floors:9,design:'factory'},
  {name:'HABITAT / A',x:-36.48,z:-.64,w:32,d:24,floors:12,design:'apartments'},
  {name:'TRAFFIC / COMMS',x:23.04,z:-1.28,w:24,d:26,floors:15,design:'factory'},
  {name:'FUSION / REPAIR',x:-49.28,z:35.84,w:12,d:24,floors:4,design:'factory'},
  {name:'SIGNAL ARCADE',x:15.36,z:35.84,w:32,d:26,floors:7,design:'arcade'},
  {name:'DATA STORAGE',x:-35.84,z:72.96,w:34,d:32,floors:9,design:'civic'},
  {name:'BATTERY EXCHANGE',x:-12.8,z:71.68,w:18,d:30,floors:3,design:'factory'},
  {name:'FLIGHT / SYSTEMS',x:80.64,z:-32.64,w:32,d:30,floors:16,design:'terrace'},
  {name:'SLEEP / CAPSULES',x:86.4,z:1.28,w:22,d:20,floors:5,design:'apartments'},
  {name:'NOODLE / 24H',x:60.16,z:35.84,w:28,d:26,floors:3,design:'arcade',facing:Math.PI},
  {name:'OXYGEN / DEPOT',x:82.56,z:35.84,w:28,d:28,floors:10,design:'factory'},
  {name:'DEEP / SPACE',x:61.44,z:72.96,w:30,d:34,floors:14,design:'civic'},
  {name:'DOCK / 09',x:84.48,z:73.6,w:24,d:30,floors:4,design:'warehouse'},
  ...[-69.12,-30.72,1.28,35.84,73.6].map((z,i)=>({name:`WEST SERVICE / ${i+1}`,x:-116.48,z,w:10,d:28,floors:3+i%3,design:('factory') as BuildingDesign})),
  ...[-70.4,-32.64,1.28,35.84,73.6].map((z,i)=>({name:`DOCKSIDE / ${i+1}`,x:113.28,z,w:14,d:28,floors:4+i%4,design:('warehouse') as BuildingDesign})),
];
export function lotEntrance(l:CityLot):[number,number]{return[l.x,l.z+(l.facing?-1:1)*(l.d*.32+2.56)];}
