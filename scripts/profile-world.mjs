// Reproducible CPU-side station inventory; GPU/frame timing needs the browser.
import {build} from 'esbuild';

const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
import * as T from 'three';
import {createTown} from './src/world/town';
import {StationActivities} from './src/interactions/activities';
import {SpaceportProps} from './src/world/spaceport-props';
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>new Proxy({},{get:()=>()=>{}})})};
const start=performance.now(),town=createTown(),activities=new StationActivities();
const props=new SpaceportProps(town.root,activities.definitions);
let meshes=0,instances=0,triangles=0,placements=0;
town.root.traverse(o=>{
  placements+=o.userData.placements?.length??0;
  if(o instanceof T.Mesh){meshes++;const count=o instanceof T.InstancedMesh?o.count:1;
    instances+=count;triangles+=count*(o.geometry.index?.count??o.geometry.attributes.position?.count??0)/3;
  }
});
console.log(JSON.stringify({scope:'town + main activity props, without landmarks/actors/vehicles',
  meshes,instances,triangles,placements,colliders:town.obstacles.length+props.staticObstacles.length,
  activities:activities.definitions.length,constructionMs:Math.round(performance.now()-start)},null,2));
`},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
