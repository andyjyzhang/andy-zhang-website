import {afterEach,describe,expect,it,vi} from 'vitest';
import {JSDOM} from 'jsdom';
import axe from 'axe-core';
import {readFileSync} from 'node:fs';
import {Interface,type UIActions} from '../src/ui/interface';
import {StationActivities} from '../src/interactions/activities';
import {feedbackMarkup} from '../src/ui/activity-ui';
import {contentMarkup,sectionLabels} from '../src/ui/content-markup';
import type {Section} from '../src/config/world';
import {Input} from '../src/player/input';
import {FlightHUD} from '../src/ui/flight-hud';
import {SalvageRun} from '../src/interactions/flight-game';

let dom:JSDOM;
function fixture() {
  dom=new JSDOM('<!doctype html><html lang="en"><head><title>Andy’s World</title></head><body><div id="app"><canvas role="application" tabindex="0" aria-label="Explore Andy’s World"></canvas></div></body></html>',{url:'http://localhost/',runScripts:'outside-only'});
  vi.stubGlobal('document',dom.window.document);vi.stubGlobal('window',dom.window);
  // jsdom does not supply native modal focus/inert behavior; those paths are
  // separately verified in the production browser.
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
  const ui=new Interface(document.querySelector('#app')!);
  const actions:UIActions={openSection:vi.fn(),closePanel:vi.fn(),overview:vi.fn(),pov:vi.fn(),travel:vi.fn(),previewActivity:vi.fn(),flight:vi.fn(),motion:vi.fn(),graphics:vi.fn(),replay:vi.fn(),action:vi.fn(),returnToTown:vi.fn(),exportBuild:vi.fn(),activity:vi.fn(),sound:vi.fn(),volume:vi.fn()};
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
  it('exposes a described low-graphics control and keeps its state in sync',()=>{
    const {ui,actions}=fixture();ui.setGraphics(true);ui.openMenu();
    const toolbar=ui.root.querySelector<HTMLButtonElement>('[data-graphics-toggle]')!;
    expect(toolbar.getAttribute('aria-pressed')).toBe('true');expect(toolbar.getAttribute('aria-label')).toBe('Disable low graphics');
    toolbar.click();expect(actions.graphics).toHaveBeenCalledWith(false);
    const checkbox=ui.menu.querySelector<HTMLInputElement>('[data-graphics]')!;
    expect(checkbox.checked).toBe(true);expect(checkbox.getAttribute('aria-describedby')).toBe('graphics-note');
    expect(ui.menu.querySelector('#graphics-note')!.textContent).toContain('30 FPS');
    checkbox.click();expect(actions.graphics).toHaveBeenCalledWith(false);
    ui.setGraphics(false);expect(checkbox.checked).toBe(false);
    expect(toolbar.getAttribute('aria-pressed')).toBe('false');expect(toolbar.getAttribute('aria-label')).toBe('Enable low graphics');
  });
  it('keeps the primary HUD minimal while retaining direct portfolio and settings access',()=>{
    const {ui}=fixture();
    expect(ui.root.querySelector('.world-meta')).toBeNull();expect(ui.root.querySelector('[data-pov]')).toBeNull();
    expect(ui.root.querySelector('.portfolio-button')).toBeNull();expect(ui.root.querySelector('.resume-button')).toBeNull();
    expect(ui.root.querySelector<HTMLAnchorElement>('.fallback-link')!.href).toBe('http://localhost/');
    expect(ui.root.querySelector('[data-controls]')).not.toBeNull();
  });
  it.each(Object.keys(sectionLabels) as Section[])('opens/closes %s with a named dialog and focus return',section=>{
    const {ui,actions}=fixture(),trigger=ui.root.querySelector<HTMLElement>('[data-menu]')!;trigger.focus();
    ui.openPanel(section);expect(ui.paused).toBe(true);expect(ui.panel.querySelector('h2')!.textContent).toBeTruthy();
    expect(ui.panel.querySelector('a[href$=".pdf"]')).toBeNull();
    if(section==='about'){expect(ui.panel.querySelector('[data-section="contact"]')).toBeNull();expect(ui.panel.querySelector('dl')).toBeNull();}
    const close=ui.panel.querySelector<HTMLElement>('[data-close-panel]')!;expect(document.activeElement).toBe(close);close.click();
    expect(ui.paused).toBe(false);expect(document.activeElement).toBe(trigger);expect(actions.closePanel).toHaveBeenCalledTimes(1);
  });
  it('routes all additional station stops and every professional chapter once',()=>{
    const {ui,actions}=fixture(),station=new StationActivities();station.addCrew('crew-test','Dock worker',0,0,'On shift.');
    ui.setStops(station.definitions);ui.openMenu();
    expect(ui.menu.querySelector('a[href$=".pdf"]')).toBeNull();
    const choices=ui.menu.querySelectorAll<HTMLButtonElement>('[data-travel]');expect(new Set([...choices].map(b=>b.dataset.travel)).size).toBe(choices.length);
    expect(ui.menu.querySelector('[data-travel="crew-test"]')).not.toBeNull();
    ui.menu.querySelector<HTMLButtonElement>('[data-travel="facility-0"]')!.click();expect(actions.travel).toHaveBeenCalledWith('facility-0');expect(ui.menu.open).toBe(false);
    for(const section of Object.keys(sectionLabels)){ui.openMenu();ui.menu.querySelector<HTMLButtonElement>(`[data-section="${section}"]`)!.click();expect(actions.openSection).toHaveBeenCalledWith(section);}
  });
  it('provides an opt-in gallery for every panel, compact game and destination',()=>{
    const {ui,actions}=fixture(),station=new StationActivities();ui.enableDevGallery(station.definitions);
    expect(ui.devGallery.querySelectorAll('[data-section]')).toHaveLength(Object.keys(sectionLabels).length);
    expect([...ui.devGallery.querySelectorAll<HTMLElement>('[data-preview-activity]')].map(button=>button.dataset.previewActivity)).toEqual(['cube','poker-game']);
    ui.devGallery.querySelector<HTMLButtonElement>('[data-section="projects"]')!.click();expect(actions.openSection).toHaveBeenCalledWith('projects');
    ui.devGallery.querySelector<HTMLButtonElement>('[data-preview-activity="cube"]')!.click();expect(actions.previewActivity).toHaveBeenCalledWith('cube');
    ui.openPanel('projects');expect(ui.panel.contains(ui.devGallery)).toBe(true);ui.closePanel();expect(ui.root.contains(ui.devGallery)).toBe(true);
  });
  it('plays cube recall and Redshift Draw with buttons and keyboard',()=>{
    const {ui}=fixture(),station=new StationActivities();
    ui.openGame(station.find('cube')!);ui.activity.querySelector<HTMLButtonElement>('[data-game-action="cube-hide"]')!.click();
    for(const code of ['Digit1','Digit2','Digit4'])ui.activity.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));
    expect(ui.activity.querySelector('[data-outcome="won"]')!.textContent).toContain('Sequence solved');ui.closeActivity();
    ui.openGame(station.find('poker-game')!);ui.activity.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'KeyB',bubbles:true,cancelable:true}));
    expect(ui.activity.textContent).toContain('chips banked');expect(ui.activity.querySelector('[data-game-action="poker-next"]')).not.toBeNull();
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
    const {ui}=fixture();ui.openPanel('about');
    ui.openMenu();const closedSettings=ui.menu.querySelector('[data-motion]')!;
    ui.openGame(new StationActivities().find('poker-game')!);
    for(const [dialog,firstSelector,lastSelector] of [[ui.panel,'[data-close-panel]','.panel-footer button'],[ui.menu,'[data-close-menu]','a[href="/"]'],[ui.activity,'[data-close-game]','.poker-guide summary']] as const) {
      if(dialog===ui.panel)ui.openPanel('about');else if(dialog===ui.menu)ui.openMenu();else ui.openGame(new StationActivities().find('poker-game')!);
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
    vi.mocked(actions.action).mockImplementation(()=>ui.openGame(new StationActivities().find('poker-game')!));
    ui.prompt.focus();ui.prompt.click();ui.closeActivity();expect(document.activeElement).toBe(canvas);
    menu.dispatchEvent(new dom.window.KeyboardEvent('keydown',{code:'Escape',bubbles:true}));expect(input.pressed('Escape')).toBe(true);
  });
});

describe('structural accessibility',()=>{
  it('has no axe WCAG A/AA violations in portfolio, directory, feedback and game markup',async()=>{
    const {ui}=fixture();dom.window.eval(axe.source);
    const run=async()=>{
      const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}});
      expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    };
    for(const section of Object.keys(sectionLabels) as Section[]){ui.openPanel(section);await run();ui.closePanel();}
    ui.openMenu();ui.menu.querySelector('details')!.open=true;await run();ui.closeMenu();
    const station=new StationActivities();ui.activityUI.showFeedback(station.command('noodles','order')!);await run();ui.activityUI.hideFeedback();
    for(const id of ['cube','poker-game']){ui.openGame(station.find(id)!);await run();ui.closeActivity();}
    const game=new SalvageRun(),hud=new FlightHUD(document.querySelector('#app')!,game);ui.setScene(true,true);
    for(const phase of ['briefing','playing','won'] as const){game.phase=phase;hud.refresh();await run();}
    hud.dispose();ui.setScene(false);
  },30000);
  it('keeps the concise static portfolio navigation and contact available without JavaScript',async()=>{
    dom=new JSDOM(readFileSync('public/portfolio.html','utf8'),{runScripts:'outside-only'});dom.window.eval(axe.source);
    expect(dom.window.document.querySelectorAll('main section')).toHaveLength(5);expect(dom.window.document.querySelector('#about')).toBeNull();
    expect([...dom.window.document.querySelectorAll('main section')].map(section=>section.id)).toEqual(['experience','projects','education','other','hobbies']);
    expect(dom.window.document.querySelector('a[href="/AndyZhangResume.pdf"]')).toBeNull();
    expect(dom.window.document.querySelector('.site-header p')!.textContent).toBe('cs @ uwaterloo');
    expect(dom.window.document.querySelector('#projects')!.textContent).not.toMatch(/memo lab|lawly/i);
    expect(dom.window.document.querySelector('#projects')!.textContent).toMatch(/catan engine/);
    expect(dom.window.document.querySelector('#projects')!.textContent).toMatch(/turns phone videos into explorable vr memories/);
    expect(dom.window.document.querySelector('#projects')!.textContent).toMatch(/poker ranging tool/);
    expect(dom.window.document.querySelector('#projects')!.textContent).toMatch(/photo authenticity records on solana/);
    expect(dom.window.document.querySelector('#projects')!.textContent).toMatch(/provenance/i);
    expect(dom.window.document.querySelector<HTMLAnchorElement>('#projects a[href*="provenance"]')!.href).toBe('https://github.com/ItzNotKevin/provenance');
    expect([...dom.window.document.querySelectorAll<HTMLAnchorElement>('#projects a')].every(anchor=>new URL(anchor.href).hostname==='github.com')).toBe(true);
    const worldProjects=new JSDOM(contentMarkup('projects'));
    expect([...worldProjects.window.document.querySelectorAll('.project-summary')].map(item=>item.textContent)).toEqual([...dom.window.document.querySelectorAll('#projects .category')].map(item=>item.textContent));
    expect([...worldProjects.window.document.querySelectorAll('h3 a')].map(anchor=>anchor.getAttribute('href'))).toEqual([...dom.window.document.querySelectorAll('#projects a')].map(anchor=>anchor.getAttribute('href')));worldProjects.window.close();
    expect(dom.window.document.querySelector('#education')!.textContent).not.toMatch(/\b20\d{2}\b/);
    expect(dom.window.document.querySelector('#contact')).toBeNull();
    expect(dom.window.document.querySelector('#hobbies')!.textContent).toMatch(/cubing, board games, video games, poker/);expect(dom.window.document.querySelector('#poker')).toBeNull();
    expect([...dom.window.document.querySelectorAll('.role')].map(role=>role.textContent)).toEqual(['swe intern','swe intern']);
    expect(dom.window.document.querySelector<HTMLAnchorElement>('#other a')!.href).toBe('https://www.instagram.com/reel/Dbh2D-lhjY5/');
    expect(dom.window.document.body.dataset.layout).toBe('minimal');expect(dom.window.document.querySelector('.portfolio-stack')).not.toBeNull();
    const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(dom.window.document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']},rules:{'color-contrast':{enabled:false}}});
    expect(result.violations.map(v=>v.id)).toEqual([]);
  },30000);
  it.each(['public/build-notes.html','public/model-credits.html'])('keeps %s structurally accessible',async file=>{
    dom=new JSDOM(readFileSync(file,'utf8'),{runScripts:'outside-only'});dom.window.eval(axe.source);
    const result=await (dom.window as unknown as {axe:typeof axe}).axe.run(dom.window.document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']},rules:{'color-contrast':{enabled:false}}});
    expect(result.violations.map(v=>v.id)).toEqual([]);
  },30000);
});
