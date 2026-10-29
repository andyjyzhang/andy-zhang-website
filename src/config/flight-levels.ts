export interface FlightPoint {x:number;y:number;z:number}
export interface FlightObstacle extends FlightPoint {w:number;h:number;d:number;label:string;color?:string}
export interface EnemySpawn extends FlightPoint {hp:number;role:'guard'|'interceptor'|'turret';cargo?:number;wave?:number}
export interface DebrisSpawn extends FlightPoint {radius:number;drift:number}
export interface RelaySpawn extends FlightPoint {label:string;hp:number}
export type FlightLevelKind='salvage'|'course'|'relay'|'escort'|'assault';
export interface FlightLevel {
  id:string;name:string;kind:FlightLevelKind;description:string;steps:readonly string[];timeLimit:number;
  palette:{sky:string;key:string;fill:string;accent:string;stone:string};
  cargo:readonly (FlightPoint&{guard:number})[];enemies:readonly EnemySpawn[];
  debris:readonly DebrisSpawn[];gates:readonly FlightPoint[];relays:readonly RelaySpawn[];
  obstacles:readonly FlightObstacle[];convoyPath:readonly FlightPoint[];core:(FlightPoint&{hp:number;radius:number})|null;
}
export const FLIGHT_BOUNDS={minX:-58,maxX:58,minY:5,maxY:40,minZ:-54,maxZ:42};
export const FLIGHT_DOCK={x:0,y:8,z:32} satisfies FlightPoint;
export const FLIGHT_CAPACITY={cargo:3,enemies:4,debris:14,gates:6,relays:3};
const p=(x:number,y:number,z:number):FlightPoint=>({x,y,z});
const scatter=(count:number,drift:number):DebrisSpawn[]=>Array.from({length:count},(_,i)=>({x:Math.sin(i*2.4)*36,y:10+(i%3)*10,z:-12-Math.cos(i*1.7)*22,radius:2.56,drift}));
const salvagePods=[{...p(-28,12,6),guard:0},{...p(26,23,-8),guard:1},{...p(0,34,-36),guard:2}];
// These volumes also build the visible solid structures: ship, camera and
// projectile collision all use the same dimensions as the brickwork.
const spireStructures:FlightObstacle[]=[
  {...p(0,13.056,-26.24),w:10.24,h:26.112,d:10.24,label:'communications tower',color:'#0a3463'},
  ...Array.from({length:7},(_,i)=>({...p(0,i*3.84+.256,-26.24),w:14.08,h:.512,d:14.08,label:'tower deck'})),
  {...p(-10.88,10.496,-26.24),w:21.76,h:1.024,d:1.28,label:'relay support'},
  {...p(10.88,22.528,-26.24),w:21.76,h:1.024,d:1.28,label:'relay support'},
  {...p(-21.76,10.496,-25.6),w:1.28,h:1.024,d:3.84,label:'relay arm'},
  {...p(21.76,22.528,-26.88),w:1.28,h:1.024,d:3.84,label:'relay arm'},
  {...p(0,29.184,-26.24),w:1.28,h:6.144,d:1.28,label:'antenna mast'},
  {...p(0,32,-28.16),w:1.28,h:1.024,d:5.12,label:'antenna arm'},
];

export const FLIGHT_LEVELS:readonly FlightLevel[]=[
  {
    id:'cold-orbit',name:'Cold orbit',kind:'salvage',timeLimit:120,
    description:'A broken cruiser has scattered three salvage pods across the wreckfield. Disable their patrols, match each pod’s altitude and bring the cargo home.',
    steps:['Disable cargo patrols','Recover three pods','Return to the green dock'],
    palette:{sky:'#070e18',key:'#ffe0b5',fill:'#91b9ed',accent:'#efbd76',stone:'#515d66'},
    cargo:salvagePods,enemies:salvagePods.map((pod,cargo)=>({...p(pod.x,pod.y+2,pod.z-7),hp:3,role:'guard' as const,cargo})),
    debris:scatter(6,7),gates:[],relays:[],obstacles:[],convoyPath:[],core:null,
  },
  {
    id:'dust-run',name:'Dust run',kind:'course',timeLimit:100,
    description:'Take the courier through six numbered gates in an asteroid canyon. Fly through the blue opening in order, change altitude with the course, then return to the dock. Clear a rock if it blocks your line.',
    steps:['Find the active blue gate','Fly all six gates in order','Return to the green dock'],
    palette:{sky:'#21170f',key:'#ffd0a0',fill:'#bba38c',accent:'#f2cd37',stone:'#958a73'},
    cargo:[],enemies:[],debris:scatter(12,1.5),
    gates:[p(-28,12,12),p(-38,22,-14),p(-12,32,-38),p(26,25,-32),p(40,14,-2),p(18,9,14)],
    relays:[],obstacles:[],convoyPath:[],core:null,
  },
  {
    id:'signal-spire',name:'Signal spire',kind:'relay',timeLimit:150,
    description:'An abandoned communications tower is holding a flight recorder. Shoot relays 1, 2 and 3 in that order to release it. Navigate around the solid tower, recover the recorder behind it and extract.',
    steps:['Shoot relays 1, 2, 3 in order','Recover the flight recorder','Return to the green dock'],
    palette:{sky:'#071c22',key:'#b5edf0',fill:'#8fb1d4',accent:'#9bdde7',stone:'#6074a1'},
    cargo:[{...p(0,12,-43),guard:-1}],
    enemies:[{...p(-34,18,-8),hp:3,role:'guard'},{...p(32,29,-34),hp:3,role:'guard'}],
    debris:[{...p(-44,9,-30),radius:2.56,drift:1},{...p(43,14,8),radius:2.56,drift:1}],gates:[],
    relays:[{...p(-22,14,-24),hp:2,label:'Relay 1'},{...p(22,26,-28),hp:2,label:'Relay 2'},{...p(0,35,-30),hp:2,label:'Relay 3'}],
    obstacles:spireStructures,convoyPath:[],core:null,
  },
  {
    id:'blue-corridor',name:'Blue corridor',kind:'escort',timeLimit:135,
    description:'A blue freight shuttle needs a wingmate through the docking corridor. Stay within 24m to keep it moving and defend its eight hull points. Interceptors arrive along the route; the shuttle waits if you fall behind.',
    steps:['Rendezvous with the blue shuttle','Stay close and defend its hull','Follow it home and dock'],
    palette:{sky:'#10192d',key:'#c9dcff',fill:'#8ea5df',accent:'#5a93db',stone:'#0a3463'},
    cargo:[],enemies:[
      {...p(-44,16,-4),hp:3,role:'interceptor',wave:0},{...p(-8,25,-32),hp:3,role:'interceptor',wave:0},
      {...p(44,24,-20),hp:3,role:'interceptor',wave:2},{...p(30,12,22),hp:3,role:'interceptor',wave:4},
    ],
    debris:[],gates:[],relays:[],obstacles:[],
    convoyPath:[p(-38,12,16),p(-36,12,2),p(-24,18,-18),p(2,24,-32),p(30,18,-14),p(26,12,14),p(0,8,32)],core:null,
  },
  {
    id:'last-light',name:'Last light',kind:'assault',timeLimit:180,
    description:'A shielded cruiser is blocking the extraction lane. Destroy its port and starboard generators, then attack the exposed orange reactor core. Survive the gun emplacements and return to the green dock to finish the campaign.',
    steps:['Destroy both shield generators','Destroy the exposed cruiser core','Return to the extraction dock'],
    palette:{sky:'#1d0c13',key:'#ffbfaa',fill:'#927eaa',accent:'#fa817b',stone:'#6c6e68'},
    cargo:[],enemies:[
      {...p(-43,12,-37),hp:4,role:'turret'},{...p(42,30,-39),hp:4,role:'turret'},
      {...p(-18,31,-49),hp:4,role:'turret'},{...p(17,10,-48),hp:4,role:'turret'},
    ],
    debris:[{...p(-42,30,4),radius:2.56,drift:2},{...p(38,10,-12),radius:2.56,drift:2}],gates:[],
    relays:[{...p(-35,14,-27),hp:3,label:'Port generator'},{...p(35,32,-29),hp:3,label:'Starboard generator'}],
    obstacles:[{...p(0,16.384,-54.4),w:2.56,h:2.048,d:17.92,label:'reactor support',color:'#05131d'}],convoyPath:[],core:{...p(0,22,-44),hp:12,radius:4.5},
  },
];
