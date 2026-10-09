import {readFile,readdir,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,sep} from 'node:path';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

// Validate deployable artifacts after npm run build. Optional preview URL also
// checks actual served files; this does not automate or inspect a browser.
const root=resolve('dist'),files=(await readdir(root,{recursive:true})).map(file=>file.replaceAll('\\','/'));
const pages=files.filter(file=>file.endsWith('.html')),documents=new Map(),local=new Set();
for(const page of pages)documents.set(page,new JSDOM(await readFile(resolve(root,page),'utf8'),{url:`http://build.local/${page}`}));
const chapters=['about','experience','projects','education','hobbies','poker','contact'];
for(const [page,dom] of documents) {
  const d=dom.window.document;
  assert.equal(d.documentElement.lang,'en',`${page}: document language`);
  assert.ok(d.title,`${page}: page title`);
  assert.ok(d.querySelector('meta[name="viewport"]'),`${page}: mobile viewport`);
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
assert.deepEqual([...reading.querySelectorAll('main section')].map(s=>s.id),chapters);
assert.ok(reading.querySelector('a[href="mailto:andy.jy.zhang@gmail.com"]'));
const pdf=await readFile(resolve(root,'AndyZhangResume.pdf'));
assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.length>1000);
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
const result={pages,localLinks:local.size,resumeBytes:pdf.length,chapters,served,passed:true};
await mkdir('artifacts',{recursive:true});await writeFile('artifacts/build-audit.json',JSON.stringify(result,null,2));
for(const dom of documents.values())dom.window.close();
console.log(JSON.stringify(result,null,2));
