// Read-only checks for the Browser skill's tab.playwright.evaluate surface.
// Invoke through that skill, not a separate browser automation connection.
export async function contrast(tab) {
  return tab.playwright.evaluate(()=>{
    const rgb=s=>{const n=s.match(/[\d.]+/g)?.map(Number)||[];return{r:n[0]||0,g:n[1]||0,b:n[2]||0,a:n[3]===undefined?1:n[3]};};
    const blend=(a,b)=>({r:a.r*a.a+b.r*(1-a.a),g:a.g*a.a+b.g*(1-a.a),b:a.b*a.a+b.b*(1-a.a),a:1});
    const lum=c=>{const f=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);};
    const rows=[];
    for(const el of document.querySelectorAll('body *')) {
      if(el.closest('[aria-hidden="true"],svg,canvas')||!Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))continue;
      let node=el,visible=true;const layers=[];
      while(node) {
        const s=getComputedStyle(node);
        if(node.hidden||s.display==='none'||s.visibility==='hidden'||s.opacity==='0'||(node.tagName==='DIALOG'&&!node.hasAttribute('open')))visible=false;
        if(node.tagName==='DETAILS'&&!node.hasAttribute('open')&&!node.querySelector('summary')?.contains(el))visible=false;
        layers.unshift(rgb(s.backgroundColor));node=node.parentElement;
      }
      if(!visible)continue;
      const cs=getComputedStyle(el),fg=rgb(cs.color);let bg={r:255,g:255,b:255,a:1};
      for(const c of layers)bg=blend(c,bg);
      const l1=lum(blend(fg,bg)),l2=lum(bg),ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
      rows.push({text:Array.from(el.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ').slice(0,95),class:el.className,fg:cs.color,bg:[bg.r,bg.g,bg.b].map(Math.round),ratio:Math.round(ratio*100)/100,font:cs.fontSize});
    }
    return{checked:rows.length,failed:rows.filter(r=>r.ratio<4.5),min:Math.min(...rows.map(r=>r.ratio))};
  });
}
export async function interactionState(tab) {
  return tab.playwright.evaluate(()=>({
    prompt:document.querySelector('.interaction-prompt:not([hidden])')?.textContent.trim()||null,
    feedback:document.querySelector('.activity-feedback:not([hidden])')?.textContent.trim()||null,
    kind:document.querySelector('.activity-feedback:not([hidden])')?.dataset.kind||null,
    dialogs:Array.from(document.querySelectorAll('dialog[open]')).map(d=>d.getAttribute('aria-labelledby')),
    focused:document.activeElement?.getAttribute('aria-label')||document.activeElement?.tagName,
    diagnostics:{...document.querySelector('[aria-label="World diagnostics"]')?.dataset},
    signal:document.querySelector('.arcade-console[open] .current-signal')?.textContent||null,
    result:document.querySelector('.arcade-console[open] [data-activity-status]')?.textContent||null,
  }));
}
