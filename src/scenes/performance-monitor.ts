import type { WebGLRenderer, PerspectiveCamera } from 'three';
export class PerformanceMonitor {
  private enabled = new URLSearchParams(location.search).get('debug') === '1';
  private output = document.createElement('output');
  private start = 0;
  private frames = 0;
  private samples: number[] = [];
  private previous = 0;
  private cpuStart = 0;
  private gpuMs = 0;
  private query: WebGLQuery | null = null;
  private pending: WebGLQuery[] = [];
  private timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null | undefined;
  constructor(parent: HTMLElement) { this.output.className = 'performance-monitor'; this.output.setAttribute('aria-label', 'World diagnostics'); if (this.enabled) parent.append(this.output); }
  audio(state:{status:string;voices:number;loops:number;activeLoops:string;played:number;lastCue:string}){if(this.enabled){this.output.dataset.audio=state.status;this.output.dataset.voices=String(state.voices);this.output.dataset.loops=String(state.loops);this.output.dataset.activeLoops=state.activeLoops;this.output.dataset.sounds=String(state.played);this.output.dataset.lastSound=state.lastCue;}}
  startFrame() { if (this.enabled) this.cpuStart = performance.now(); }
  beforeRender(renderer: WebGLRenderer) {
    if (!this.enabled) return;
    const gl = renderer.getContext();
    if (!(gl instanceof WebGL2RenderingContext)) return;
    if (this.timer === undefined) this.timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (!this.timer) return;
    const completed = this.pending.filter(query => gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE));
    for (const query of completed) {
      if (!gl.getParameter(this.timer.GPU_DISJOINT_EXT)) this.gpuMs = gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(query);
    }
    this.pending = this.pending.filter(query => !completed.includes(query));
    if (this.pending.length < 2) { this.query = gl.createQuery(); if (this.query) gl.beginQuery(this.timer.TIME_ELAPSED_EXT, this.query); }
  }
  afterRender(renderer: WebGLRenderer) {
    const gl = renderer.getContext();
    if (this.query && this.timer && gl instanceof WebGL2RenderingContext) { gl.endQuery(this.timer.TIME_ELAPSED_EXT); this.pending.push(this.query); this.query = null; }
  }
  update(time: number, renderer: WebGLRenderer, camera: PerspectiveCamera, state: { mode: string; x: number; y: number; z: number; speed: number }) {
    if (!this.enabled) return;
    if (this.previous && time - this.previous < 5000) this.samples.push(time - this.previous);
    this.previous = time; this.frames++;
    if (!this.start) this.start = time;
    if (time - this.start < 1000) return;
    const fps = Math.round(this.frames * 1000 / (time - this.start));
    const sorted = [...this.samples].sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * .95)] || 0;
    const info = renderer.info;
    const cpuMs = performance.now() - this.cpuStart;
    this.output.textContent = `${state.mode.toUpperCase()} · ${fps} FPS · ${info.render.calls} draws · ${Math.round(info.render.triangles / 1000)}k triangles · CPU ${cpuMs.toFixed(1)}ms${this.gpuMs ? ` / GPU ${this.gpuMs.toFixed(1)}ms` : ''} · p95 ${p95.toFixed(1)}ms`;
    Object.entries({ ...state, fps, p95, cpuMs, gpuMs: this.gpuMs, draws: info.render.calls, triangles: info.render.triangles, geometries: info.memory.geometries, textures: info.memory.textures, cameraX: camera.position.x, cameraY: camera.position.y, cameraZ: camera.position.z }).forEach(([key, value]) => this.output.dataset[key] = String(value));
    this.start = time; this.frames = 0; this.samples.length = 0;
  }
}
