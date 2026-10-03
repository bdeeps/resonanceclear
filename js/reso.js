// Shared parts for ResonanceClear: the driven, damped oscillator (stepped with RK4), a meter that
// reads amplitude and phase off the motion, the analytic response used to check it, chart boards,
// a re-shapeable coil spring, number formats, a small tone player and the layout helpers.
import { THREE, M, canvasTexture, clamp } from './kit.js';
import { audio } from './ui.js';

export { THREE, M, clamp };
export const TAU = Math.PI * 2;
export const G = 9.81;                  // m/s², standard gravity is 9.80665
export const DEG = Math.PI / 180;

// ---------------------------------------------------------------- the oscillator
// One equation runs the whole box:  x'' + 2ζω₀ x' + ω₀² x = (drive).
// ω₀ = √(k/m) is the natural (angular) frequency, ζ the damping ratio, Q = 1/(2ζ) the quality factor.
// For a sinusoidal drive at ω = r ω₀ the steady amplitude is the static deflection times
//   gain(r, ζ) = 1 ÷ √((1 − r²)² + (2ζr)²)
// and the motion lags the drive by atan2(2ζr, 1 − r²): 0 far below, 90° at r = 1, 180° far above.
// The gain peaks at r = √(1 − 2ζ²) with the value 1 ÷ (2ζ√(1 − ζ²)), which is Q for light damping.
// (Any vibrations text, e.g. Rao, Mechanical Vibrations, ch. 3; Wikipedia "Resonance", "Q factor".)
export const gain = (r, z) => 1 / Math.sqrt((1 - r * r) ** 2 + (2 * z * r) ** 2);
export const phaseLag = (r, z) => Math.atan2(2 * z * r, 1 - r * r);
export const peakR = (z) => (z < Math.SQRT1_2 ? Math.sqrt(1 - 2 * z * z) : 0);
export const peakGain = (z) => (z < Math.SQRT1_2 ? 1 / (2 * z * Math.sqrt(1 - z * z)) : 1);
export const natural = (k, m) => Math.sqrt(k / m) / TAU;          // Hz
// A pendulum's period at a large swing θ₀ (radians): T = T₀ (1 + θ₀²/16 + 11θ₀⁴/3072 + …).
export const bigSwing = (th) => 1 + th * th / 16 + (11 * th ** 4) / 3072 + (173 * th ** 6) / 737280;

// One classical fourth-order Runge–Kutta step of x'' = acc(t, x, v). st = { x, v, t }.
export function rk4(st, h, acc) {
  const { x, v, t } = st;
  const a1 = acc(t, x, v);
  const v2 = v + 0.5 * h * a1, a2 = acc(t + 0.5 * h, x + 0.5 * h * v, v2);
  const v3 = v + 0.5 * h * a2, a3 = acc(t + 0.5 * h, x + 0.5 * h * v2, v3);
  const v4 = v + h * a3, a4 = acc(t + h, x + h * v3, v4);
  st.x = x + (h / 6) * (v + 2 * v2 + 2 * v3 + v4);
  st.v = v + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  st.t = t + h;
}
// Advance by dt in equal steps no longer than hMax. each(st) runs after every step (for meters).
export function advance(st, dt, hMax, acc, each) {
  if (!(dt > 0)) return;
  const n = Math.max(1, Math.ceil(dt / hMax)), h = dt / n;
  for (let i = 0; i < n; i++) { rk4(st, h, acc); if (each) each(st); }
}

// Reads the swing off the motion itself: half the distance between the last top and bottom turning
// points, and (given the drive's phase at each upward zero crossing) how far the motion lags the drive.
export function meter() {
  const m = { amp: 0, lag: NaN, hi: 0, lo: 0, pv: 0, px: 0, n: 0, tHi: 0, period: NaN, settled: false, prev: 0 };
  m.reset = () => { m.amp = 0; m.lag = NaN; m.hi = m.lo = m.pv = m.px = 0; m.n = 0; m.period = NaN; m.settled = false; m.prev = 0; };
  m.feed = (st, drivePhase) => {
    const { x, v, t } = st;
    if (m.pv > 0 && v <= 0) {                                   // a top turning point
      m.hi = x;
      if (m.n > 0) m.period = t - m.tHi;
      m.tHi = t; m.n++;
      const a = (m.hi - m.lo) / 2;
      m.settled = m.n > 3 && Math.abs(a - m.prev) < 0.01 * Math.max(a, 1e-9);
      m.prev = a; m.amp = a;
    } else if (m.pv < 0 && v >= 0) { m.lo = x; m.amp = (m.hi - m.lo) / 2; }
    if (drivePhase !== undefined && m.px < 0 && x >= 0) {       // x = X cos(φ − δ) crosses zero going up at φ − δ = −90°
      const fr = x - m.px > 0 ? x / (x - m.px) : 0;             // how far back inside this step the crossing was
      let d = (drivePhase - fr * (drivePhase - m.pp) + Math.PI / 2) % TAU; if (d < 0) d += TAU;
      m.lag = d > Math.PI * 1.5 ? d - TAU : d;
    }
    m.pv = v; m.px = x; m.pp = drivePhase;
  };
  return m;
}

// The steady swing found the slow way: start from rest, step the equation of motion until the
// start-up transient has died (ten time constants), then measure the swing over the last cycles.
// drive(t) is the right-hand side. Used for the "stepped" dots drawn over each analytic curve.
export function settle(w0, z, w, drive, extra = null) {
  const st = { x: 0, v: 0, t: 0 }, T = TAU / Math.max(w, 1e-9);
  const tEnd = Math.max(10 / (z * w0), 8 * T) + 3 * T, h = Math.min(T, TAU / w0) / 48;
  const acc = extra || ((t, x, v) => -w0 * w0 * x - 2 * z * w0 * v + drive(t));
  let hi = -Infinity, lo = Infinity;
  const n = Math.ceil(tEnd / h);
  for (let i = 0; i < n; i++) { rk4(st, h, acc); if (st.t > tEnd - 2.5 * T) { if (st.x > hi) hi = st.x; if (st.x < lo) lo = st.x; } }
  return (hi - lo) / 2;
}

// ---------------------------------------------------------------- number formats
export const fmt0 = (v) => Math.round(v).toLocaleString('en-US');
export function fmtHz(f) {
  const a = Math.abs(f);
  if (a >= 1e9) return (f / 1e9).toPrecision(3) + ' GHz';
  if (a >= 1e6) return (f / 1e6).toPrecision(3) + ' MHz';
  if (a >= 1e5) return (f / 1e3).toFixed(1) + ' kHz';
  if (a >= 100) return fmt0(f) + ' Hz';
  if (a >= 10) return f.toFixed(1) + ' Hz';
  return f.toFixed(2) + ' Hz';
}
export const fmtS = (t) => (t >= 3600 ? (t / 3600).toFixed(1) + ' h' : t >= 100 ? fmt0(t) + ' s' : t >= 1 ? t.toFixed(2) + ' s' : t >= 1e-3 ? (t * 1e3).toPrecision(3) + ' ms' : t >= 1e-6 ? (t * 1e6).toPrecision(3) + ' µs' : (t * 1e9).toPrecision(3) + ' ns');
export const fmtLen = (m) => (Math.abs(m) >= 1 ? m.toFixed(2) + ' m' : Math.abs(m) >= 0.01 ? (m * 100).toFixed(1) + ' cm' : (m * 1000).toFixed(Math.abs(m) < 0.001 ? 2 : 1) + ' mm');
export const fmtDeg = (r) => (r / DEG).toFixed(0) + '°';
export const fmtQ = (q) => (q >= 1000 ? fmt0(q) : q >= 10 ? q.toFixed(0) : q.toFixed(1));

// ---------------------------------------------------------------- colours
export const COL = {
  line: '#8ef0ff',     // the response, the thing that swings
  drive: '#ffb547',    // the push
  ok: '#5ce1a9',
  hot: '#ff5a5a',
  soft: '#c49bff',
  warm: '#ff7a59',
  text: '#e8eef8',
};
export const hex = (c) => new THREE.Color(c).getHex();

// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.92)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const tex = canvasTexture(pxW, pxH, draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return Object.assign(tex, { mesh: m });
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', xLog = false, yLog = false }) {
  const X = xLog ? (x) => x0 + (Math.log(x / xMin) / Math.log(xMax / xMin)) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = yLog ? (y) => y0 - (Math.log(y / yMin) / Math.log(yMax / yMin)) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.62)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 4, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function curve(g, fn, a, b, X, Y, col, wdt = 4, dash = null, n = 300, log = false) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const x = log ? a * Math.pow(b / a, i / n) : a + ((b - a) * i) / n; pts.push([x, fn(x)]); }
  line(g, pts, X, Y, col, wdt, dash);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function ring(g, x, y, col, r = 5) { g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
export function text(g, s, x, y, col = COL.text, font = '18px sans-serif') { g.fillStyle = col; g.font = font; g.fillText(s, x, y); }
export function clip(g, a, fn) { g.save(); g.beginPath(); g.rect(a.x0, a.y1, a.x1 - a.x0, a.y0 - a.y1); g.clip(); fn(); g.restore(); }

// ---------------------------------------------------------------- 3D pieces
// A helical spring hanging down the −Y axis from its origin. setLength(L) re-shapes the same mesh,
// so the wire keeps its thickness however far the coil is stretched.
export function makeCoil({ turns = 12, R = 0.16, r = 0.02, mat, seg = 20, rs = 8 } = {}) {
  const N = turns * seg + 1;
  const pos = new Float32Array(N * rs * 3), nor = new Float32Array(N * rs * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < rs; j++) {
    const a = i * rs + j, b = i * rs + ((j + 1) % rs), c = (i + 1) * rs + j, d = (i + 1) * rs + ((j + 1) % rs);
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat || M.metal(0xc9ced8, { roughness: 0.3 }));
  mesh.castShadow = true; mesh.frustumCulled = false;
  const w = turns * TAU;
  let last = -1;
  mesh.setLength = (L) => {
    L = Math.max(turns * r * 2.05, L);
    if (Math.abs(L - last) < 1e-5) return; last = L;
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), th = w * t, c = Math.cos(th), s = Math.sin(th);
      const px = R * c, py = -L * t, pz = R * s;
      let tx = -R * s * w, ty = -L, tz = R * c * w; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      const nx = -c, ny = 0, nz = -s;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      for (let j = 0; j < rs; j++) {
        const f = (j / rs) * TAU, cf = Math.cos(f), sf = Math.sin(f);
        const ox = cf * nx + sf * bx, oy = cf * ny + sf * by, oz = cf * nz + sf * bz, k = (i * rs + j) * 3;
        pos[k] = px + r * ox; pos[k + 1] = py + r * oy; pos[k + 2] = pz + r * oz;
        nor[k] = ox; nor[k + 1] = oy; nor[k + 2] = oz;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  };
  mesh.setLength(1);
  return mesh;
}
// A straight strut between two points that can be re-aimed every frame (unit cylinder, scaled).
export function strut(r, mat, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, seg), mat); m.castShadow = true; m.frustumCulled = false;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  m.set = (a, b) => { A.set(...a); B.set(...b); const L = Math.max(1e-6, A.distanceTo(B)); m.position.copy(A).add(B).multiplyScalar(0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(up, B.sub(A).normalize()); };
  return m;
}
// A line through n points, rewritten every frame. set(fn) with fn(u, i) → [x, y, z]. It is drawn as
// two thin crossed ribbons (a plain GL line is one pixel wide and vanishes in the video).
export function liveLine(n, color, opacity = 1, width = 0.022) {
  const pos = new Float32Array(n * 12), geo = new THREE.BufferGeometry(), idx = [];
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  for (let i = 0; i < n - 1; i++) for (const o of [0, 2]) { const a = i * 4 + o, b = a + 1, c = a + 4, d = a + 5; idx.push(a, c, b, b, c, d); }
  geo.setIndex(idx);
  const ln = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity, side: THREE.DoubleSide }));
  ln.frustumCulled = false;
  const P = new Float32Array(n * 3);
  ln.set = (fn) => {
    for (let i = 0; i < n; i++) { const p = fn(n > 1 ? i / (n - 1) : 0, i); P[i * 3] = p[0]; P[i * 3 + 1] = p[1]; P[i * 3 + 2] = p[2]; }
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 3, b = Math.min(n - 1, i + 1) * 3;
      let tx = P[b] - P[a], ty = P[b + 1] - P[a + 1], tz = P[b + 2] - P[a + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // n1 = t × up (or t × x when the line runs straight up), n2 = t × n1
      let ux = 0, uy = 1, uz = 0; if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
      let ax = ty * uz - tz * uy, ay = tz * ux - tx * uz, az = tx * uy - ty * ux; const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
      const bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax, x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], k = i * 12, w = width;
      pos[k] = x + ax * w; pos[k + 1] = y + ay * w; pos[k + 2] = z + az * w; pos[k + 3] = x - ax * w; pos[k + 4] = y - ay * w; pos[k + 5] = z - az * w;
      pos[k + 6] = x + bx * w; pos[k + 7] = y + by * w; pos[k + 8] = z + bz * w; pos[k + 9] = x - bx * w; pos[k + 10] = y - by * w; pos[k + 11] = z - bz * w;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return ln;
}
// A flat force arrow along +Y. set(L) sets its length (negative flips it).
export function forceArrow(color = 0xffb547, r = 0.035) {
  const g = new THREE.Group(), mat = M.glow(color);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1, 10), mat), tip = new THREE.Mesh(new THREE.ConeGeometry(r * 2.8, r * 7, 14), mat);
  g.add(shaft, tip);
  g.set = (L) => { const head = r * 7, a = Math.abs(L); g.visible = a > head * 0.6; g.scale.y = L < 0 ? -1 : 1; const sL = Math.max(0.001, a - head); shaft.scale.y = sL; shaft.position.y = sL / 2; tip.position.y = sL + head / 2; };
  g.set(1);
  return g;
}

// ---------------------------------------------------------------- sound
// A short tone (or several) through Web Audio. Honours the box's sound switch.
let ac = null;
export function tone(freqs, sec = 1.2, vol = 0.1) {
  if (audio.muted || document.body.classList.contains('gb-reel')) return false;
  try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return false; }
  if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime;
  [].concat(freqs).forEach((f) => {
    const [hz, v, len] = Array.isArray(f) ? f : [f, vol, sec];
    const g = ac.createGain(), o = ac.createOscillator();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.type = 'sine'; o.frequency.value = clamp(hz, 20, 20000); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + len + 0.05);
  });
  return true;
}

// ---------------------------------------------------------------- layout
export const inReel = () => document.body.classList.contains('gb-reel');
// On a phone-width stage: hide minor labels and nudge the picture down, clear of the readout.
export function fitNarrow(stage, minor = [], drop = 0.2) {
  const narrow = stage.host.clientWidth < 560;
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = narrow && !inReel() ? -drop : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// Boards sit beside the model on a wide screen. In the tall reel video they move to `pos` instead.
export function reelPlace(boards) {
  const r = inReel();
  boards.forEach(([b, pos, scale = 1.25]) => {
    if (!b.home || b.home.stale) b.home = { p: b.mesh.position.clone(), r: b.mesh.rotation.y };
    if (r) { b.mesh.position.set(...pos); b.mesh.scale.setScalar(scale); b.mesh.rotation.y = 0; }
    else { b.mesh.position.copy(b.home.p); b.mesh.scale.setScalar(1); b.mesh.rotation.y = b.home.r; }
  });
}
// Switch the camera when a chapter's "focus" changes (not in the reel, which sets its own views).
export function focusView(stage, views, focus) {
  if (inReel()) return;
  const v = views[focus]; if (v) stage.setView(v.pos, v.target, 1.0);
}
// A link to another Glassbox box, for learn text.
export const link = (slug, name) => `<a href="https://glassbox.how/${slug}/" target="_blank" rel="noopener">${name}</a>`;
// Readouts: a headline, rows of [label, value] and a note. A phone shows the headline and two rows.
export const compact = () => (document.getElementById('stage')?.clientWidth || 999) < 560;
export function sheet(big, rows, note = '') {
  const c = compact();
  return `<div class="big">${big}</div>` + (c ? rows.slice(0, 2) : rows).map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('') + (note && !c ? `<small>${note}</small>` : '');
}
