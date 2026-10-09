// Native modal inertness prevents pointer focus outside the panel. Explicitly
// wrap Tab at its boundaries so keyboard users never land on an empty page.
export function keepDialogFocus(dialog:HTMLDialogElement) {
  dialog.addEventListener('keydown',e=>{
    if((e.key!=='Tab'&&e.code!=='Tab')||!dialog.open)return;
    const controls=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled):not([type="hidden"]),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]')].filter(el=>{
      if(el.getAttribute('tabindex')==='-1')return false;
      for(let node:HTMLElement|null=el;node&&node!==dialog;node=node.parentElement) {
        const style=node.ownerDocument.defaultView!.getComputedStyle(node);
        if(node.hidden||style.display==='none'||style.visibility==='hidden')return false;
        if(node.tagName==='DETAILS'&&!node.hasAttribute('open')&&!node.querySelector('summary')?.contains(el))return false;
      }
      return true;
    });
    const first=controls[0],last=controls.at(-1),active=dialog.ownerDocument.activeElement;
    if(!first)return;
    if(!dialog.contains(active)||active===dialog||(e.shiftKey?active===first:active===last)) {
      e.preventDefault();(e.shiftKey?last!:first).focus();
    }
  });
}
