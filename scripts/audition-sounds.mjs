import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
// Local listening/review artifact; no audio assets are fetched at runtime.
const result=await build({stdin:{contents:"export * from './src/audio/sound-design'; export * from './src/audio/loop-design';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
const {SOUND_CUES,renderSound,LOOP_KINDS,renderLoop}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const rate=24000,segments=[],index=[];let duration=0;
for(const cue of SOUND_CUES){const pcm=renderSound(cue,rate);index.push({cue,startSeconds:Number(duration.toFixed(3)),durationSeconds:pcm.length/rate});segments.push(pcm,new Float32Array(rate*.28));duration+=pcm.length/rate+.28;}
for(const cue of LOOP_KINDS){const pcm=renderLoop(cue,rate);index.push({cue:`loop/${cue}`,startSeconds:Number(duration.toFixed(3)),durationSeconds:pcm.length/rate});segments.push(pcm,new Float32Array(rate*.28));duration+=pcm.length/rate+.28;}
const length=segments.reduce((n,s)=>n+s.length,0),wav=Buffer.alloc(44+length*2);
wav.write('RIFF',0);wav.writeUInt32LE(36+length*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*2,40);
let offset=44;for(const segment of segments)for(const sample of segment){wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*32767),offset);offset+=2;}
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/sound-effects-audition.wav',wav);await writeFile('artifacts/sound-effects-index.json',JSON.stringify(index,null,2));
console.log(`Rendered ${SOUND_CUES.length} original cues and ${LOOP_KINDS.length} textures, ${duration.toFixed(2)}s: artifacts/sound-effects-audition.wav`);
