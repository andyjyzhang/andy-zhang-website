import {afterEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import axe from 'axe-core';
import {readFileSync} from 'node:fs';
import {Interface,type UIActions} from '../src/ui/interface';
import {StationActivities} from '../src/interactions/activities';
import {feedbackMarkup} from '../src/ui/activity-ui';
import {sectionLabels} from '../src/ui/content-markup';
import type {Section} from '../src/config/world';
import {Input} from '../src/player/input';

let dom:JSDOM;
function fixture() {
  dom=new JSDOM('<!doctype html><html lang="en"><head><title>Andy’s World</title></head><body><div id="app"><canvas role="application" tabindex="0" aria-label="Explore Andy’s World"></canvas></div></body></html>',{url:'http://localhost/',runScripts:'outside-only'});
  vi.stubGlobal('document',dom.window.document);vi.stubGlobal('window',dom.window);
  // jsdom does not supply native modal focus/inert behavior; those paths are
  // separately verified in the production browser.
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const ui=new Interface(document.querySelector('#app')!);
  const actions:UIActions={openSection:vi.fn(),closePanel:vi.fn(),overview:vi.fn(),pov:vi.fn(),travel:vi.fn(),motion:vi.fn(),replay:vi.fn(),action:vi.fn(),returnToTown:vi.fn(),exportBuild:vi.fn(),activity:vi.fn(),sound:vi.fn(),volume:vi.fn()};
  ui.connect(actions);return{ui,actions};
}
afterEach(()=>{dom?.window.close();vi.unstubAllGlobals();});

describe('real interface keyboard and routing',()=>{
  it('provides labeled mute and volume controls and retains the saved setting when reopening',()=>{
    const {ui,actions}=fixture();ui.setSound(false,.25,'muted');ui.openMenu();
    const slider=ui.menu.querySelector<HTMLInputElement>('[data-sound-volume]')!,checkbox=ui.menu.querySelector<HTMLInputElement>('[data-sound-enabled]')!;
    expect(slider.value).toBe('25');expect(slider.getAttribute('aria-label')).toBe('Sound effects volume');expect(checkbox.checked).toBe(false);
    slider.value='70';slider.dispatchEvent(new dom.window.Event('input'));expect(actions.volume).toHaveBeenCalledWith(.7);
    checkbox.click();expect(actions.sound).toHaveBeenCalledWith(true);
    ui.setSound(true,.7,'ready');expect(ui.menu.querySelector('[data-sound-status]')!.textContent).toBe('Sound on.');
    ui.closeMenu();ui.openMenu();expect(ui.menu.querySelector<HTMLInputElement>('[data-sound-volume]')!.value).toBe('70');
  });
  it.each(Object.keys(sectionLabels) as Section[])('opens/closes %s with a named dialog and focus return',section=>{
    const {ui,actions}=fixture(),trigger=ui.root.querySelector<HTMLElement>('[data-menu]')!;trigger.focus();
    ui.openPanel(section);expect(ui.paused).toBe(true);expect(ui.panel.querySelector('h2')!.textContent).toBeTruthy();
    const close=ui.panel.querySelector<HTMLElement>('[data-close-panel]')!;expect(document.activeElement).toBe(close);close.click();
    expect(ui.paused).toBe(false);expect(document.activeElement).toBe(trigger);expect(actions.closePanel).toHaveBeenCalledTimes(1);
  });
  it('routes all additional station stops and every professional chapter once',()=>{
    const {ui,actions}=fixture(),station=new StationActivities();station.addCrew('crew-test','Dock worker',0,0,'On shift.');
    ui.setStops(station.definitions);ui.openMenu();
    const choices=ui.menu.querySelectorAll<HTMLButtonElement>('[data-travel]');expect(new Set([...choices].map(b=>b.dataset.travel)).size).toBe(choices.length);
    expect(ui.menu.querySelector('[data-travel="crew-test"]')).not.toBeNull();
    ui.menu.querySelector<HTMLButtonElement>('[data-travel="facility-0"]')!.click();expect(actions.travel).toHaveBeenCalledWith('facility-0');expect(ui.menu.open).toBe(false);
    for(const section of Object.keys(sectionLabels)){ui.openMenu();ui.menu.querySelector<HTMLButtonElement>(`[data-section="${section}"]`)!.click();expect(actions.openSection).toHaveBeenCalledWith(section);}
  });
  it('handles signal keyboard stop, manual step and restart without duplicate commands',()=>{
    const {ui,actions}=fixture(),d=new StationActivities().find('arcade')!,canvas=document.querySelector('canvas')!;canvas.focus();
    ui.openArcade(d,'Ready.');ui.setSignal(1);expect(ui.activity.textContent).toContain('Signal: Amber');
    for(const code of ['Space','ArrowRight','KeyR'])ui.activity.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));
    expect(actions.activity).toHaveBeenNthCalledWith(1,'arcade','stop');expect(actions.activity).toHaveBeenNthCalledWith(2,'arcade','step');expect(actions.activity).toHaveBeenNthCalledWith(3,'arcade','restart');
    ui.activity.querySelector<HTMLButtonElement>('[data-command="stop"]')!.click();expect(actions.activity).toHaveBeenCalledTimes(4);
    ui.activity.dispatchEvent(new dom.window.Event('cancel',{cancelable:true}));expect(ui.paused).toBe(false);expect(document.activeElement).toBe(canvas);
  });
  it('shows distinct simple feedback without pausing or stealing canvas focus',()=>{
    const {ui}=fixture(),station=new StationActivities(),canvas=document.querySelector('canvas')!;canvas.focus();
    const unique=new Set<string>();
    for(const id of ['reactor','repair','cargo','noodles','radio','facility-0']) {
      const result=station.command(id,station.find(id)!.commands[0].id)!;unique.add(feedbackMarkup(result));ui.activityUI.showFeedback(result);
      expect(ui.paused).toBe(false);expect(document.activeElement).toBe(canvas);expect(ui.activityUI.feedback.querySelector('[role="status"]')).not.toBeNull();
    }
    expect(unique.size).toBe(6);ui.setScene(true,true);expect(ui.activityUI.feedback.hidden).toBe(true);
  });
  it('wraps keyboard focus in every dialog and skips controls in collapsed directory settings',()=>{
    const {ui}=fixture();ui.openPanel('contact');
    ui.openMenu();const closedSettings=ui.menu.querySelector('[data-motion]')!;
    ui.openArcade(new StationActivities().find('arcade')!,'Ready.');
    for(const [dialog,firstSelector,lastSelector] of [[ui.panel,'[data-close-panel]','.panel-footer button'],[ui.menu,'[data-close-menu]','a[href="/portfolio.html"]'],[ui.activity,'[data-close-arcade]','[data-command="restart"]']] as const) {
      if(dialog===ui.panel)ui.openPanel('contact');else if(dialog===ui.menu)ui.openMenu();else ui.openArcade(new StationActivities().find('arcade')!,'Ready.');
      const first=dialog.querySelector<HTMLElement>(firstSelector)!,last=dialog.querySelector<HTMLElement>(lastSelector)!;
      last.focus();last.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',code:'Tab',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(first);
      first.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'Tab',code:'Tab',shiftKey:true,bubbles:true,cancelable:true}));expect(document.activeElement).toBe(last);
      expect(document.activeElement).not.toBe(closedSettings);
    }
  });
  it('lets native buttons own Space and returns simple-action focus to the world',()=>{
    const {ui,actions}=fixture(),canvas=document.querySelector('canvas')!,input=new Input(canvas);
    const menu=ui.root.querySelector<HTMLButtonElement>('[data-menu]')!;
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'Space',bubbles:true}));expect(input.pressed('Space')).toBe(false);
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'ArrowRight',bubbles:true}));expect(input.down('ArrowRight')).toBe(false);
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));expect(input.down('KeyW')).toBe(true);input.clear();
    canvas.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));expect(input.down('KeyW')).toBe(true);input.clear();
    ui.setPrompt({id:'reactor',name:'Energy core',action:'Interact',key:'E',x:0,z:0,radius:3});ui.prompt.focus();ui.prompt.click();
    expect(actions.action).toHaveBeenCalledWith('E');expect(document.activeElement).toBe(canvas);
    vi.mocked(actions.action).mockImplementation(()=>ui.openArcade(new StationActivities().find('arcade')!,'Ready.'));
    ui.prompt.focus();ui.prompt.click();ui.closeActivity();expect(document.activeElement).toBe(canvas);
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'Escape',bubbles:true}));expect(input.pressed('Escape')).toBe(true);
  });
});

describe('structural accessibility',()=>{
  it('has no axe WCAG A/AA violations in portfolio, directory, feedback and arcade markup',async()=>{
    const {ui}=fixture();dom.window.eval(axe.source);
    const run=async()=>{
      const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}});
      expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    };
    for(const section of Object.keys(sectionLabels) as Section[]){ui.openPanel(section);await run();ui.closePanel();}
    ui.openMenu();ui.menu.querySelector('details')!.open=true;await run();ui.closeMenu();
    const station=new StationActivities();ui.activityUI.showFeedback(station.command('noodles','order')!);await run();ui.activityUI.hideFeedback();
    ui.openArcade(station.find('arcade')!,'Ready.');ui.setSignal(1);await run();
  },30000);
  it('keeps static portfolio navigation and résumé available without JavaScript',async()=>{
    dom=new JSDOM(readFileSync('public/portfolio.html','utf8'),{runScripts:'outside-only'});dom.window.eval(axe.source);
    expect(dom.window.document.querySelectorAll('main section')).toHaveLength(7);expect(dom.window.document.querySelector('a[href="/AndyZhangResume.pdf"]')).not.toBeNull();
    const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(dom.window.document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},rules:{'color-contrast':{enabled:false}}});
    expect(result.violations.map(v=>v.id)).toEqual([]);
  },30000);
  it.each(['public/build-notes.html','public/model-credits.html'])('keeps %s structurally accessible',async file=>{
    dom=new JSDOM(readFileSync(file,'utf8'),{runScripts:'outside-only'});dom.window.eval(axe.source);
    const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(dom.window.document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}});
    expect(result.violations.map(v=>v.id)).toEqual([]);
  },30000);
});
