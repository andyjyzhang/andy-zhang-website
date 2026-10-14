import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

// Validate deployable artifacts after npm run build. Optional preview URL also
// checks actual served files; this does not automate or inspect a browser.
const root=resolve('dist'),files=(await readdir(root,{recursive:true})).map(file=>file.replaceAll('\\','/'));
const pages=files.filter(file=>file.endsWith('.html')),documents=new Map(),local=new Set();
for(const page of pages)documents.set(page,new JSDOM(await readFile(resolve(root,page),'utf8'),{url:`http://build.local/${page}`}));
const chapters=['about','experience','projects','education','hobbies','poker'];
const readingChapters=['experience','projects','education','other','hobbies'];
for(const [page,dom] of documents) {
  const d=dom.window.document;
  assert.equal(d.documentElement.lang,'en',`${page}: document language`);
  assert.ok(d.title,`${page}: page title`);
  assert.ok(d.querySelector('meta[name="viewport"]'),`${page}: mobile viewport`);
  assert.equal(d.querySelector('a[href*="Resume"],a[href*="resume"],a[href$=".pdf"]'),null,`${page}: résumé must not be exposed`);
  for(const el of d.querySelectorAll('a[href],link[href],script[src],img[src]')) {
    const value=el.getAttribute('href')||el.getAttribute('src');
    const url=new URL(value,`http://build.local/${page}`);
    if(url.origin!=='http://build.local')continue;
    const target=decodeURIComponent(url.pathname.slice(1))||'index.html',path=resolve(root,target);
    assert.ok(!relative(root,path).startsWith(`..${sep}`),`${page}: local path stays in build`);
    assert.ok((await stat(path)).isFile(),`${page}: missing ${target}`);local.add(target);
    if(url.hash) {
      const id=decodeURIComponent(url.hash.slice(1));
      if(target==='index.html')assert.ok(chapters.includes(id),`${page}: unknown world chapter ${id}`);
      else if(documents.has(target))assert.ok(documents.get(target).window.document.getElementById(id),`${page}: missing anchor ${target}#${id}`);
    }
  }
}
const reading=documents.get('portfolio.html').window.document;
assert.deepEqual([...reading.querySelectorAll('main section')].map(s=>s.id),readingChapters);
assert.equal(reading.body.dataset.layout,'minimal');assert.ok(reading.querySelector('.portfolio-stack'));
assert.ok(reading.querySelector('a[href="mailto:andy.jy.zhang@gmail.com"]'));
assert.equal(reading.querySelector('a[href="/AndyZhangResume.pdf"]'),null);
assert.equal(reading.querySelector('.site-header p').textContent,'cs @ uwaterloo');
assert.doesNotMatch(reading.querySelector('#projects').textContent,/memo lab|lawly/i);
assert.match(reading.querySelector('#projects').textContent,/catan engine/);
assert.match(reading.querySelector('#projects').textContent,/turns phone videos into explorable vr memories/);
assert.match(reading.querySelector('#projects').textContent,/poker ranging tool/);
assert.match(reading.querySelector('#projects').textContent,/photo authenticity records on solana/);
assert.match(reading.querySelector('#projects').textContent,/provenance/i);
assert.equal(reading.querySelector('#projects a[href*="provenance"]')?.href,'https://github.com/ItzNotKevin/provenance');
assert.deepEqual([...reading.querySelectorAll('#experience .meta')].map(el=>el.textContent),['2026','2024']);
assert.doesNotMatch(reading.querySelector('#education').textContent,/\b20\d{2}\b/);
for(const anchor of reading.querySelectorAll('#projects a'))assert.equal(new URL(anchor.href).hostname,'github.com');
assert.equal(reading.querySelector('#contact'),null);
assert.match(reading.querySelector('#hobbies').textContent,/cubing, board games, video games, poker/);assert.equal(reading.querySelector('#poker'),null);
assert.deepEqual([...reading.querySelectorAll('#experience .role')].map(el=>el.textContent),['swe intern','swe intern']);
for(const anchor of reading.querySelectorAll('.quick-links a[href*="github.com"],.quick-links a[href*="linkedin.com"]'))assert.doesNotMatch(anchor.textContent,/↗/);
assert.equal(reading.querySelector('#other a').href,'https://www.instagram.com/reel/Dbh2D-lhjY5/');
assert.equal(reading.querySelector('#other img').getAttribute('src'),'/high-stakes.png');
assert.equal(files.some(file=>/resume|résumé|\.pdf$/i.test(file)),false,'No résumé PDF in deployable artifacts');
assert.equal(files.some(file=>/observatory|space-prototype|gate-journey/i.test(file)),false,'No removed destination chunks in production output');
for(const file of files.filter(file=>/\.(js|css)$/.test(file)))
  assert.doesNotMatch(await readFile(resolve(root,file),'utf8'),/signal match|stop the signal|data-lamp|arcade-console/i,
    file+': removed Signal Match UI must not be deployed');
JSON.parse(await readFile(resolve(root,'models/ldraw-attribution.json'),'utf8'));
const deployment=JSON.parse(await readFile('vercel.json','utf8'));
for(const [source,chapter] of [['/work.html','experience'],['/projects.html','projects']])
  assert.ok(deployment.redirects?.some(r=>r.source===source&&r.destination===`/#${chapter}`&&r.permanent===true),`${source}: deployment redirect`);
const served=[];
if(process.argv[2]) {
  const base=new URL(process.argv[2]);
  for(const file of new Set([...pages,...local,...files.filter(f=>/\.(js|css)$/.test(f))])) {
    const response=await fetch(new URL(file.replaceAll('\\','/'),base));
    assert.equal(response.status,200,`${file}: preview HTTP status`);
    const expected=await readFile(resolve(root,file)),actual=Buffer.from(await response.arrayBuffer());
    assert.ok(actual.equals(expected),`${file}: preview served different content`);
    served.push(file);
  }
}
const result={pages,localLinks:local.size,chapters,readingChapters,served,passed:true};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/build-audit.json',JSON.stringify(result,null,2));
for(const dom of documents.values())dom.window.close();
console.log(JSON.stringify(result,null,2));
