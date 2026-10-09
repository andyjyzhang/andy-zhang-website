// Reproducible offline bake of the attributed LDraw molds used by the world.
// Source files are retained with their original author/license headers.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { BufferGeometry, BufferAttribute, MeshStandardMaterial } from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const directory = path.resolve('assets/ldraw/source');
const roots = { torso: '973.dat', hips: '3815b.dat', rightLeg: '3816c.dat', leftLeg: '3817c.dat', rightArm: '3818.dat', leftArm: '3819.dat', hand: '3820.dat', head: '3626bp01.dat', hair: '3901.dat', cap: '4485.dat', backpack: '2524.dat', brick: '3001.dat', stud: 'stud.dat', rim: '4624.dat', tyre: '3641.dat', windscreen: '3823.dat', slope: '3039.dat', roundBrick: '3941.dat', roundPlate: '4032.dat', roundTile: '98138.dat', dish: '3960.dat', conePart: '3942c.dat', chair: '4079.dat', mug: '3899.dat', joystick: '4592.dat', steering: '3829.dat', fence: '3633.dat', lampPost: '2039.dat', antenna: '3957.dat', sideStud: '87087.dat', plateOne: '3024.dat', roundOne: '3062b.dat', brickOne: '3005.dat', wheelBase: '6157.dat', mudguard: '3787.dat' };
Object.assign(roots,{headConfident:'3626bp05.dat',headGlasses:'3626bp0i.dat',headGrin:'3626bp84.dat',headShades:'3626bp04.dat',headPlain:'3626b.dat',helmet:'2446.dat',helmetVisor:'2447.dat'});
const files = new Map();
const pending = new Map();
async function source(name) {
  name = name.replaceAll('\\', '/').toLowerCase();
  if (pending.has(name)) return pending.get(name);
  const work = (async () => {
    const destination = path.join(directory, name);
    let text;
    try { text = await readFile(destination, 'utf8'); }
    catch {
      const locations = name.startsWith('s/') ? ['parts/'] : ['parts/', 'p/'];
      for (const folder of locations) {
        if (process.env.LDRAW_LIBRARY) {
          try { text = await readFile(path.join(process.env.LDRAW_LIBRARY, folder, name), 'utf8'); break; }
          catch { continue; }
        }
        const response = await fetch(`https://library.ldraw.org/library/official/${folder}${name}`);
        if (response.ok) { text = await response.text(); break; }
      }
      if (!text?.startsWith('0 ')) throw new Error(`Missing LDraw dependency: ${name}`);
      await mkdir(path.dirname(destination), { recursive: true }); await writeFile(destination, text);
    }
    files.set(name, text);
    const children = [...text.matchAll(/^1\s+\S+\s+(?:[-.\d]+\s+){12}(.+)$/gm)].map(match => match[1].trim());
    await Promise.all(children.map(source));
    return text;
  })();
  pending.set(name, work);
  return work;
}
await Promise.all(Object.values(roots).map(source));
const rectangularSource=await readFile('src/world/part-catalog.ts','utf8');
await Promise.all([...rectangularSource.matchAll(/\['(\d+[a-z]?)',\d+,\d+\]/g)].map(match=>source(`${match[1]}.dat`)));
const binary = array => Buffer.from(array.buffer, array.byteOffset, array.byteLength).toString('base64');
const output = {};
for (const [key, filename] of Object.entries(roots)) {
  const loader = new LDrawLoader().setConditionalLineMaterial(LDrawConditionalLineMaterial).addDefaultMaterials();
  loader.setFileMap(Object.fromEntries([...files.keys()].map(name => [name, name])));
  const black = new MeshStandardMaterial({ color: '#141414' }); black.userData.code = '0'; loader.addMaterial(black);
  for(const [code,color] of [['15','#ffffff'],['70','#582a12'],['71','#9ba19d']]) {
    const ink=new MeshStandardMaterial({color});ink.userData.code=code;loader.addMaterial(ink);
  }
  const packed = `0 FILE model.ldr\n0 Character part\n0 !LDRAW_ORG Model\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 ${filename}\n` + [...files].map(([name, text]) => `0 FILE ${name}\n${text}`).join('\n');
  const object = await new Promise((resolve, reject) => loader.parse(packed, resolve, reject));
  object.updateMatrixWorld(true);
  const colors = new Map();
  object.traverse(mesh => {
    if (!mesh.isMesh) return;
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    // A negative-scale LDraw subpart normally flips GL front-face state. Once
    // baked into vertex positions, its triangle winding must be flipped too.
    if (mesh.matrixWorld.determinant() < 0) {
      for (const attribute of Object.values(geometry.attributes)) {
        const array = attribute.array, size = attribute.itemSize;
        for (let i = 0; i < attribute.count; i += 3) for (let k = 0; k < size; k++) {
          const a = (i + 1) * size + k, b = (i + 2) * size + k, swap = array[a]; array[a] = array[b]; array[b] = swap;
        }
      }
    }
    const attributes = geometry.attributes;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = geometry.groups.length ? geometry.groups : [{ start: 0, count: attributes.position.count, materialIndex: 0 }];
    for (const group of groups) {
      const surface=list[group.materialIndex],fixed=String(surface.userData.code);
      const code=fixed==='0'?'print':key.startsWith('head')&&fixed!=='16'?`fixed-${fixed}`:'plastic';
      const slice = new BufferGeometry();
      for (const name of ['position', 'normal']) {
        const attribute = attributes[name];
        slice.setAttribute(name, new BufferAttribute(new Float32Array(attribute.array.slice(group.start * 3, (group.start + group.count) * 3)), 3));
      }
      if (!colors.has(code)) colors.set(code, {meshes:[],color:code.startsWith('fixed-')?`#${surface.color.getHexString()}`:undefined}); colors.get(code).meshes.push(slice);
    }
  });
  output[key] = {};
  for (const [color, entry] of colors) {
    const geometry = mergeVertices(mergeGeometries(entry.meshes), .001);
    // Quantize to 1/256 LDraw unit; under 0.002 mm at the physical part scale.
    const positionScale=Math.max(...geometry.attributes.position.array.map(Math.abs))>127.9?128:256;
    const positions = Int16Array.from(geometry.attributes.position.array, v => Math.round(v * positionScale));
    const normals = Int16Array.from(geometry.attributes.normal.array, v => Math.round(v * 32767));
    const indices = Uint16Array.from(geometry.index.array);
    output[key][color] = { positionScale,positions: binary(positions), normals: binary(normals), indices: binary(indices),...(entry.color?{color:entry.color}:{}) };
    geometry.computeBoundingBox();
    console.log(key, color, `${indices.length / 3} triangles`, geometry.boundingBox.min.toArray(), geometry.boundingBox.max.toArray());
  }
}
await mkdir('src/assets', { recursive: true });
await writeFile('src/assets/ldraw-parts.json', JSON.stringify(output));
await writeFile('src/assets/ldraw-catalog.json',JSON.stringify(roots));
const credits = [...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, text]) => ({ file: name, description: text.split('\n')[0].slice(2).trim(), author: text.match(/^0 Author: (.+)$/m)?.[1]?.trim(), license: text.match(/^0 !LICENSE (.+)$/m)?.[1]?.trim() }));
await mkdir('public/models', { recursive: true });
await writeFile('public/models/ldraw-attribution.json', JSON.stringify(credits, null, 2));
console.log(`Baked ${Object.keys(roots).length} parts from ${files.size} attributed source files.`);
