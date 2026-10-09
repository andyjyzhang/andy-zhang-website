import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
// Local visual inspection only. Served by Vite from the ignored artifacts folder.
const result=await build({stdin:{contents:`
import * as T from 'three';
import {createMinifigure} from './src/player/minifigure';
import {playerAppearance} from './src/config/world';
import {stationCrew} from './src/world/ambient';
const variants=[playerAppearance,...stationCrew.map(c=>c.appearance)];
const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1500,920);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#c9d2d6');
scene.add(new T.HemisphereLight(0xffffff,0x778994,2));
const light=new T.DirectionalLight(0xffffff,3);light.position.set(-12,20,30);scene.add(light);
const camera=new T.OrthographicCamera(-7.5,7.5,4.6,-4.6,.1,100);camera.position.set(0,5,25);camera.lookAt(0,4.5,0);
variants.forEach((a,i)=>{
 const front=createMinifigure(a);front.root.position.set((i-2.5)*2.5,4.6,0);scene.add(front.root);
 const side=createMinifigure(a);side.root.position.set((i-2.5)*2.5,.3,0);side.root.rotation.y=Math.PI/2;scene.add(side.root);
});
renderer.render(scene,camera);
document.documentElement.dataset.ready='true';
`,resolveDir:process.cwd(),loader:'ts'},bundle:true,platform:'browser',format:'esm',write:false});
await mkdir('artifacts',{recursive:true});
const name=`character-review-${createHash('sha256').update(result.outputFiles[0].text).digest('hex').slice(0,10)}.js`;
await writeFile(`artifacts/${name}`,result.outputFiles[0].text);
await writeFile('artifacts/character-review.html',`<!doctype html><html lang="en"><meta charset="utf-8"><title>Character mold review</title><style>body{margin:0;background:#c9d2d6}canvas{display:block;width:100%;height:auto}</style><script type="module" src="./${name}"></script></html>`);
console.log('Character review: http://127.0.0.1:5173/artifacts/character-review.html');
