// Chapter 4: big structures. A tower with a tuned mass damper, and the footbridge that wobbled.
// "tower" (1 unit = 25 m): a generic 200 m, 50-storey tower treated as one mass on a spring in its
//   first sway mode: period 5 s (a common rule of thumb is about 0.1 s per storey), damping 1 % of
//   critical (typical for a tall steel frame). A steady gusting force of amplitude F₀ pushes it; the
//   static deflection F₀ ÷ k is set to 1 cm at the roof. A tuned mass damper is a second, small
//   oscillator hung near the top:
//     M x₁'' + c₁ x₁' + k₁ x₁ = F₀ cos ωt + c₂ (x₂' − x₁') + k₂ (x₂ − x₁)
//     m x₂'' = −c₂ (x₂' − x₁') − k₂ (x₂ − x₁)
//   tuned by Den Hartog's classic rules: f₂ ÷ f₁ = 1 ÷ (1 + μ), ζ₂ = √(3μ ÷ (8 (1 + μ)³)), μ = m ÷ M.
//   Both equations are stepped with RK4 (time-lapse ×10). The chart's lines are the exact steady-state
//   algebra; its dots are the same equations stepped from rest until they settle.
//   Taipei 101 hangs a 660-tonne, 5.5 m steel ball between its 88th and 92nd floors; it swung a record
//   1 m in Typhoon Soudelor in 2015 (Wikipedia "Taipei 101", "Tuned mass damper").
// "bridge" (1 unit = 10 m): London's Millennium Bridge. Walkers on a deck that sways sideways adjust
//   their steps to it, and so push it further: a force in step with the deck's velocity, which acts as
//   negative damping (Dallard et al., The Structural Engineer 79, 2001; Strogatz et al., Nature 438,
//   2005). One sideways mode:  x'' + 2 ζ_net ω₀ x' + ω₀² x = (random footfalls),
//   ζ_net = ζ − ζ (N ÷ N_c) ÷ (1 + (A ÷ A_s)²). N_c is the critical crowd: about 160 people in Arup's
//   December 2000 test on the north span. Mode frequency taken as 1.0 Hz and ζ = 0.7 % (reported values
//   for the bridge's lateral modes were roughly 0.5–1.0 Hz and under 1 %). The saturation A_s = 5 cm is a
//   modelling choice that makes a big crowd settle near the 7 cm reported on opening day (people stop
//   or grab the rail). After the retrofit (37 viscous dampers and 52 tuned mass dampers, 2001–02) the
//   damping is taken as 15 % of critical, so N_c is far more than the deck can hold.
//   Stepped with RK4, time-lapse ×4.
import { THREE, M, box, sphere, swarm } from '../kit.js';
import {
  TAU, COL, gain, advance, meter, strut, forceArrow, board, panelBg, axes, title, line, curve, dot, ring, text, clip, fitNarrow, reelPlace,
  focusView, inReel, fmtLen, fmt0, link, clamp, sheet,
} from '../reso.js';

// ---------------------------------------------------------------- tower
const TW = { f1: 0.2, z1: 0.01, xst: 0.01, speed: 10, H: 8, exag: 40 };
TW.w1 = TAU * TW.f1;
const tmd = (mu) => ({ w2: TW.w1 / (1 + mu), z2: Math.sqrt((3 * mu) / (8 * (1 + mu) ** 3)) });
// Steady roof sway and ball sway (relative to the tower) per metre of static deflection, from the
// complex algebra of the two equations. on = false locks the ball to the tower (one mass, M + m).
export function towerSteady(f, mu, on) {
  const w = TAU * f, w1 = TW.w1;
  if (!on) { const wl = w1 / Math.sqrt(1 + mu); return { x1: gain(w / wl, TW.z1 / Math.sqrt(1 + mu)), rel: 0 }; }
  const { w2, z2 } = tmd(mu);
  // divide through by M: a = ω₁² − ω² + i 2ζ₁ω₁ω ;  z = μ (ω₂² + i 2ζ₂ω₂ω) ;  d = z − μ ω²
  const ar = w1 * w1 - w * w, ai = 2 * TW.z1 * w1 * w, zr = mu * w2 * w2, zi = mu * 2 * z2 * w2 * w, dr = zr - mu * w * w, di = zi;
  // t = z (−μω²) ÷ d
  const nr = -mu * w * w * zr, ni = -mu * w * w * zi, dd = dr * dr + di * di, tr = (nr * dr + ni * di) / dd, ti = (ni * dr - nr * di) / dd;
  const br = ar + tr, bi = ai + ti, x1 = (w1 * w1) / Math.hypot(br, bi);
  // x₂ − x₁ = x₁ (z ÷ d − 1) = x₁ μω² ÷ d
  return { x1, rel: (x1 * mu * w * w) / Math.sqrt(dd) };
}
// One RK4 step of the two coupled equations. q = [x1, v1, x2, v2].
const k1 = [0, 0, 0, 0], k2 = [0, 0, 0, 0], k3 = [0, 0, 0, 0], k4 = [0, 0, 0, 0], tmp = [0, 0, 0, 0];
function towerStep(q, h, t, w, mu, on) {
  const w1 = TW.w1, { w2, z2 } = tmd(mu), F = w1 * w1 * TW.xst;
  const f = (tt, a, o) => {
    if (!on) { const acc = (F * Math.cos(w * tt) - w1 * w1 * a[0] - 2 * TW.z1 * w1 * a[1]) / (1 + mu); o[0] = a[1]; o[1] = acc; o[2] = a[1]; o[3] = acc; return; }
    const cpl = mu * (2 * z2 * w2 * (a[3] - a[1]) + w2 * w2 * (a[2] - a[0]));
    o[0] = a[1]; o[1] = F * Math.cos(w * tt) - w1 * w1 * a[0] - 2 * TW.z1 * w1 * a[1] + cpl;
    o[2] = a[3]; o[3] = -cpl / mu;
  };
  f(t, q, k1); for (let i = 0; i < 4; i++) tmp[i] = q[i] + 0.5 * h * k1[i];
  f(t + 0.5 * h, tmp, k2); for (let i = 0; i < 4; i++) tmp[i] = q[i] + 0.5 * h * k2[i];
  f(t + 0.5 * h, tmp, k3); for (let i = 0; i < 4; i++) tmp[i] = q[i] + h * k3[i];
  f(t + h, tmp, k4); for (let i = 0; i < 4; i++) q[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}
export function towerSettle(f, mu, on) {
  const q = [0, 0, 0, 0], w = TAU * f, T = 1 / f, h = Math.min(T, 1 / TW.f1) / 40, tEnd = 10 / (TW.z1 * TW.w1) * (on ? 0.5 : 1) + 3 * T;
  let hi = 0, t = 0; const n = Math.ceil(tEnd / h);
  for (let i = 0; i < n; i++) { towerStep(q, h, t, w, mu, on); t += h; if (t > tEnd - 2.2 * T && Math.abs(q[0]) > hi) hi = Math.abs(q[0]); }
  return hi / TW.xst;
}
// ---------------------------------------------------------------- bridge
const BR = { f0: 1.0, zeta: 0.007, zetaFix: 0.15, Nc: 160, As: 0.05, speed: 4, exag: 30, noise: 2.07e-5 };
BR.w0 = TAU * BR.f0;
const NOISE = [[0.86, 1.3], [0.93, 4.1], [1.0, 0.4], [1.04, 2.6], [1.11, 5.2], [1.18, 3.3]];
const zNet = (N, A, fixed) => { const z = fixed ? BR.zetaFix : BR.zeta; return z - BR.zeta * (N / BR.Nc) / (1 + (A / BR.As) ** 2); };
// The steady sway the model heads for: random-footfall wobble below the critical crowd, the limit cycle above.
function bridgeSteady(N, fixed) {
  const z = fixed ? BR.zetaFix : BR.zeta, lim = N * BR.zeta > z * BR.Nc ? BR.As * Math.sqrt((N * BR.zeta) / (z * BR.Nc) - 1) : 0;
  const zn = Math.max(z - BR.zeta * N / BR.Nc, 0.0008), wob = (BR.noise * Math.sqrt(N)) / Math.sqrt(NOISE.length / 2) / (2 * zn * BR.w0 * BR.w0);
  return Math.max(lim, Math.min(wob, 0.012));
}

const BX = 40;
const VIEWS = {
  tower: { pos: [-0.9, 4.4, 12.2], target: [-0.9, 3.9, 0] },
  bridge: { pos: [BX, 7.6, 11.0], target: [BX, 1.9, 0] },
};

export default {
  id: 'shake',
  short: 'Towers and bridges',
  title: 'When the thing that resonates is a building',
  subtitle: 'A tower calmed by a swinging ball, and a footbridge shaken by its own crowd.',
  view: VIEWS.tower,
  learn: `<p>A building is a mass on a spring too: its floors are the mass and its frame is the spring. Push the top of a tower sideways, let go, and it sways at its own <b>natural period</b>, roughly <b>a tenth of a second per storey</b>. A 5-storey block takes about half a second, a 50-storey tower about 5 seconds.</p>
    <p>That is why earthquakes are so selective. In <b>Mexico City in 1985</b> the soft lakebed under the city shook with a period of about 2 seconds, and the buildings hit hardest were those of <b>6 to 15 storeys</b>, whose own periods matched. Shorter and taller ones nearby often stood (see ${link('earthquakeclear', 'EarthquakeClear')}).</p>
    <p>Engineers fight resonance with resonance. A <b>tuned mass damper</b> is a heavy mass hung near the top of a tower and tuned to the tower’s own frequency. When the tower starts to sway, the mass swings out of step and pulls back against it, and its shock absorbers turn the motion into heat. <b>Taipei 101</b> hangs a <b>660-tonne</b> steel ball for this. In the chart, one tall peak becomes two low humps.</p>
    <p><b>The wobbly bridge.</b> London’s <b>Millennium Bridge</b> opened on 10 June 2000 and began to sway sideways by up to 7 cm. Nobody marched. People on a deck that moves sideways widen their step to keep balance, and that pushes the deck <b>in time with its own motion</b>. More sway, more people in step, more push: a feedback loop. Below about 160 walkers on one span nothing happened. Above that, the sway suddenly took off. Engineers fitted 37 fluid dampers and 52 tuned mass dampers, and it has been still since 2002.</p>
    <p>Armies knew a version of this long ago. In 1831 a suspension bridge at <b>Broughton</b>, England, fell while 74 soldiers marched over it in step. Nobody died, a badly forged bolt took part of the blame, and the army ordered troops to <b>break step</b> on bridges from then on.</p>
    <p class="tip"><b>Try it:</b> set the gusts to the tower’s own frequency with the ball locked, then free it. On the bridge, let the crowd on slowly and watch what happens at about 160.</p>`,
  terms: [
    { t: 'Natural period', d: 'The time a building takes to sway there and back on its own: roughly 0.1 s per storey.' },
    { t: 'Tuned mass damper', d: 'A heavy mass on springs or cables, tuned to a structure’s frequency, that swings against the structure and soaks up its motion.' },
    { t: 'Mass ratio', d: 'The damper’s mass as a share of the structure’s moving mass, usually around 1 %.' },
    { t: 'Negative damping', d: 'A force that pushes in the direction of motion, feeding energy in instead of taking it out.' },
    { t: 'Critical crowd', d: 'The number of walkers at which their in-step pushes cancel the bridge’s own damping.' },
    { t: 'Breaking step', d: 'Marching out of rhythm on a bridge, so the footfalls do not add up at one frequency.' },
  ],
  defaults: { focus: 'tower', fg: 0.2, mu: 0.02, tmd: 'locked', N: 60, fix: 'y2000', ramp: false },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'tower', label: 'Tower and damper' }, { v: 'bridge', label: 'Wobbly bridge' }] },
    { key: 'tmd', type: 'seg', label: 'Tower: the damper ball', options: [{ v: 'locked', label: 'Locked in place' }, { v: 'free', label: 'Free to swing' }] },
    { key: 'fg', type: 'range', label: 'Tower: how often the wind gusts', min: 0.1, max: 0.3, step: 0.001, ends: ['every 10 s', 'every 3.3 s'], fmt: (v) => `${v.toFixed(3)} Hz (every ${(1 / v).toFixed(1)} s)` },
    { key: 'mu', type: 'range', label: 'Tower: damper mass', min: 0.005, max: 0.05, step: 0.001, ends: ['0.5 % of the tower', '5 %'], fmt: (v) => (v * 100).toFixed(1) + ' %' },
    { key: 'tg', type: 'buttons', label: 'Tower', items: [{ label: 'Gust at the tower’s own frequency', act: (s) => { s.focus = 'tower'; s.fg = s.tmd === 'free' ? 0.2 : +(0.2 / Math.sqrt(1 + s.mu)).toFixed(3); } }] },
    { key: 'N', type: 'range', label: 'Bridge: people walking on the span', min: 0, max: 500, step: 5, ends: ['empty', '500'], fmt: (v) => `${v} people` },
    { key: 'fix', type: 'seg', label: 'Bridge: dampers', options: [{ v: 'y2000', label: 'As opened, 2000' }, { v: 'y2002', label: 'Dampers fitted, 2002' }] },
    { key: 'bg', type: 'buttons', label: 'Bridge', items: [
      { label: 'Let the crowd on slowly', act: (s) => { s.focus = 'bridge'; s.N = 0; s.ramp = true; } },
      { label: 'Everyone off', act: (s) => { s.focus = 'bridge'; s.N = 0; s.ramp = false; } },
    ] },
  ],
  onChange(s, key) {
    if (key === 'fg' || key === 'mu' || key === 'tmd') s.focus = 'tower';
    if (key === 'N' || key === 'fix') s.focus = 'bridge';
    if (key === 'N') s.ramp = false;
  },
  quiz: [
    { q: 'An earthquake shakes soft ground with a period of 2 seconds. Which buildings are in most danger?', options: ['The shortest ones', 'The very tallest ones', 'Those whose own sway period is near 2 s', 'All equally'], answer: 2, why: 'A structure responds most when the shaking matches its natural period. At roughly 0.1 s per storey that means mid-rise buildings, as in Mexico City in 1985.' },
    { q: 'How does a tuned mass damper calm a swaying tower?', options: ['It makes the tower heavier', 'It swings out of step with the tower and pulls back against it', 'It stiffens the frame', 'It blocks the wind'], answer: 1, why: 'Tuned to the tower’s frequency, the mass moves against the sway and its dampers turn the energy into heat. The one tall resonance peak splits into two low ones.' },
    { q: 'Why did the Millennium Bridge sway on its opening day?', options: ['People marched in step on purpose', 'The wind matched its frequency', 'Walkers unconsciously fell into step with the deck’s sway, pushing it further', 'It was overloaded with weight'], answer: 2, why: 'A sideways-moving deck makes people adjust their balance in time with it, which feeds the motion. Past a critical crowd, that feedback beats the bridge’s damping.' },
  ],
  reel: [
    { ms: 5200, caption: 'A tower sways at its own frequency. A heavy ball tuned to match swings against it and calms it.', set: { focus: 'tower', fg: 0.198, mu: 0.02, tmd: 'locked' }, act: (s, inst) => inst.warm(), anim: { tmd: ['locked', 'free'] }, view: { pos: [2.4, 7.4, 9.0], target: [2.4, 7.2, 0] }, spin: 0 },
    { ms: 5400, caption: 'London’s Millennium Bridge, 2000: walkers fell into step with its sway and made it worse.', set: { focus: 'bridge', fix: 'y2000', ramp: false }, act: (s, inst) => inst.warm(), anim: { N: [200, 500] }, view: { pos: [BX, 11.3, 9.3], target: [BX, 5.8, 0] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    let cur = { ...s0 }, lastFocus = null, drawT = 0;
    const gT = new THREE.Group(), gB = new THREE.Group(); root.add(gT, gB); gB.position.x = BX;

    // ================================================================ tower
    const TXc = 2.4, NF = 25, FH = TW.H / NF;
    const twr = new THREE.Group(); twr.position.x = TXc; gT.add(twr);
    const ground = box(4.6, 0.16, 3.2, M.matte(0x2b3039)); ground.position.y = 0.08; twr.add(ground);
    const glassM = M.clear(0x9fd0ff, 0.3, { roughness: 0.2 }), slabM = M.matte(0xcfd6e2);
    const floors = [];
    for (let i = 0; i < NF; i++) {
      const g = new THREE.Group(); const hollow = i >= NF - 4;
      const slab = box(1.6, 0.05, 1.6, slabM); slab.position.y = -FH / 2 + 0.03; g.add(slab);
      if (!hollow) { const skin = new THREE.Mesh(new THREE.BoxGeometry(1.56, FH - 0.06, 1.56), glassM); g.add(skin); }
      else for (const [x, z] of [[-0.74, -0.74], [0.74, -0.74], [-0.74, 0.74], [0.74, 0.74]]) { const c = box(0.07, FH, 0.07, slabM); c.position.set(x, 0, z); g.add(c); }
      twr.add(g); floors.push(g);
    }
    const roof = box(1.7, 0.08, 1.7, slabM); twr.add(roof);
    const ball = sphere(0.34, M.metal(0xd9a93a, { roughness: 0.3 }), 32); twr.add(ball);
    const cables = [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(() => { const c = strut(0.012, M.metal(0xc9ced8)); twr.add(c); return c; });
    const ghostT = new THREE.Mesh(new THREE.BoxGeometry(1.6, TW.H, 1.6), M.ghost(0xffffff, 0.04)); ghostT.position.y = 0.16 + TW.H / 2; twr.add(ghostT);
    const winds = [0, 1, 2].map((i) => { const a = forceArrow(0xffb547, 0.05); a.rotation.z = -Math.PI / 2; a.position.set(-3.0, 3.2 + i * 1.7, 0); twr.add(a); return a; });
    const lWind = stage.label('gusts', [-2.5, 2.6, 0], twr, 'hot'); lWind.element.style.setProperty('--c', COL.drive);
    const lRoof = stage.label('', [0, TW.H + 0.9, 0], twr, 'hot');
    const lBall = stage.label('', [1.6, TW.H - 0.6, 0], twr);
    const lEx = stage.label('sway drawn 40× bigger · time-lapse ×10', [0, -0.5, 1.7], twr);
    const q = [0, 0, 0, 0], roofM = meter(), ballM = meter(); let tt = 0, tph = 0, dotsL = [], dotsF = [], tKey = '', tDirty = 0, tTrail = [];
    const calcTower = (s) => {
      const fs = []; for (let f = 0.1; f <= 0.3001; f += 0.0125) fs.push(+f.toFixed(4));
      for (const f of [0.19, 0.195, 0.198, 0.2, 0.205, 0.21]) fs.push(f);
      fs.sort((a, b) => a - b);
      dotsL = fs.map((f) => [f, towerSettle(f, s.mu, false)]); dotsF = fs.map((f) => [f, towerSettle(f, s.mu, true)]);
    };
    const tBoard = board(root, 6.2, 4.3, 620, 430, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, on = s.tmd === 'free';
      const a = axes(g, w, h, { x0: 70, y1: 76, xMin: 0.1, xMax: 0.3, yMax: 55, xTicks: [0.1, 0.15, 0.2, 0.25, 0.3], yTicks: [0, 10, 20, 30, 40, 50], xFmt: (v) => v + ' Hz', yFmt: (v) => v + ' cm', xLabel: 'gust frequency →', yLabel: 'steady roof sway ↑' });
      title(g, 'Roof sway against gust rhythm', `damper ${(s.mu * 100).toFixed(1)} %`);
      const { X, Y } = a;
      clip(g, a, () => {
        curve(g, (f) => towerSteady(f, s.mu, false).x1, 0.1, 0.3, X, Y, on ? 'rgba(255,90,90,.45)' : COL.hot, on ? 2.5 : 4, null, 400);
        curve(g, (f) => towerSteady(f, s.mu, true).x1, 0.1, 0.3, X, Y, on ? COL.ok : 'rgba(92,225,169,.45)', on ? 4 : 2.5, null, 400);
        (on ? dotsF : dotsL).forEach(([f, A]) => ring(g, X(f), Y(A), '#fff', 4.5));
        tTrail.forEach(([f, A]) => { g.fillStyle = 'rgba(255,181,71,.6)'; g.beginPath(); g.arc(X(f), Y(A), 3.5, 0, TAU); g.fill(); });
      });
      text(g, 'ball locked', X(0.207), Y(46), COL.hot, 'bold 17px sans-serif'); text(g, 'ball free', X(0.232), Y(13), COL.ok, 'bold 17px sans-serif');
      line(g, [[s.fg, 0], [s.fg, 55]], X, Y, 'rgba(255,181,71,.35)', 2);
      dot(g, X(s.fg), Y(Math.min(55, roofM.amp * 100)), COL.drive, 10);
      text(g, 'line: formula   ○ stepped   ● now', 70, h - 12, 'rgba(255,255,255,.6)', '16px sans-serif');
    }, [-3.9, 2.55, 0]);

    // ================================================================ bridge
    const DL = 10.8, NSEG = 36, DW = 0.9;
    const river = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), M.clear(0x2a6fb0, 0.35, { roughness: 0.3 })); river.rotation.x = -Math.PI / 2; river.position.y = 0.05; gB.add(river);
    for (const x of [-DL / 2 - 0.5, DL / 2 + 0.5]) { const p = box(1.2, 1.9, 2.2, M.matte(0x8a8f99)); p.position.set(x, 0.95, 0); gB.add(p); }
    const deckM = M.metal(0xcfd6e2, { roughness: 0.45 });
    const segs = []; for (let i = 0; i < NSEG; i++) { const b = box(DL / NSEG * 1.04, 0.1, DW, deckM); gB.add(b); segs.push(b); }
    const rails = [0, 1].map(() => { const pts = []; for (let i = 0; i < NSEG; i++) { const r = box(DL / NSEG * 1.04, 0.03, 0.03, M.metal(0xe6eaf0)); gB.add(r); pts.push(r); } return pts; });
    const NP = 100, people = swarm(NP, new THREE.CapsuleGeometry(0.06, 0.2, 4, 8), M.plastic(0xffb547)); people.frustumCulled = false; gB.add(people);
    const pu = Array.from({ length: NP }, (_, i) => ({ u: (i * 0.6180339887) % 1, ph: (i * 2.399963) % TAU, sp: 0.02 + ((i * 37) % 10) / 500, dir: i % 2 ? 1 : -1, lane: ((i * 13) % 7) / 7 - 0.5, f: 0.85 + ((i * 29) % 30) / 100 }));
    const centre = strut(0.012, M.ghost(0xffffff, 0.3)); centre.set([-DL / 2, 2.02, 0], [DL / 2, 2.02, 0]); gB.add(centre);
    const lBr = stage.label('', [0, 3.5, 0], gB, 'hot');
    const bst = { x: 0, v: 0, t: 0 }, bm = meter(); let bA = 0, bTrail = [], bT = 0, lock = 0;
    const bBoard = board(root, 4.8, 3.0, 620, 390, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, fixed = s.fix === 'y2002';
      const a = axes(g, w, h, { x0: 70, y1: 70, xMax: 500, yMax: 8, xTicks: [0, 100, 200, 300, 400, 500], yTicks: [0, 2, 4, 6, 8], xFmt: String, yFmt: (v) => v + ' cm', xLabel: 'people →', yLabel: 'sideways sway ↑' });
      title(g, 'Crowd against sway', fixed ? 'dampers fitted' : 'as opened');
      const { X, Y } = a;
      clip(g, a, () => {
        if (!fixed) { g.fillStyle = 'rgba(255,90,90,.1)'; g.fillRect(X(BR.Nc), a.y1, a.x1 - X(BR.Nc), a.y0 - a.y1); }
        curve(g, (N) => bridgeSteady(N, fixed) * 100, 0, 500, X, Y, fixed ? COL.ok : COL.line, 4, null, 250);
        bTrail.forEach(([N, A]) => { g.fillStyle = 'rgba(255,181,71,.55)'; g.beginPath(); g.arc(X(N), Y(A * 100), 3, 0, TAU); g.fill(); });
      });
      if (!fixed) { line(g, [[BR.Nc, 0], [BR.Nc, 8]], X, Y, COL.hot, 2, [7, 6]); text(g, 'critical crowd ≈ 160', X(BR.Nc) + 8, a.y1 + 18, COL.hot, 'bold 17px sans-serif'); }
      dot(g, X(s.N), Y(Math.min(8, bA * 100)), COL.drive, 10);
      text(g, 'line: model settles here  ● now', 70, h - 12, 'rgba(255,255,255,.6)', '16px sans-serif');
    }, [BX, 1.55, 4.2]);
    bBoard.mesh.rotation.x = -0.45;

    calcTower(s0);
    return {
      // for the video: start mid-story, with the tower already swaying 40 cm and the deck 1 cm
      warm() { this.calm(); q[0] = q[2] = 0.4; bst.x = 0.01; bA = 0.01; },
      calm() { q.fill(0); roofM.reset(); ballM.reset(); bst.x = 0; bst.v = 0; bm.reset(); bA = 0; bTrail.length = 0; tTrail.length = 0; },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lEx, lWind]);
        gT.visible = tBoard.mesh.visible = s.focus === 'tower'; gB.visible = bBoard.mesh.visible = s.focus === 'bridge';
        if (s.focus !== lastFocus) { if (lastFocus !== null) focusView(stage, VIEWS, s.focus); lastFocus = s.focus; }
        reelPlace([[tBoard, [TXc, 12.0, 0], 1.3], [bBoard, [BX, 8.0, -2.6], 2.1]]);
        bBoard.mesh.rotation.x = inReel() ? -0.3 : -0.45;
        cur = { ...s };
        if (s.focus === 'tower') {
          const on = s.tmd === 'free', k = `${s.mu}`; if (k !== tKey) { tKey = k; tDirty = 0.3; tTrail.length = 0; }
          if (tDirty > 0) { tDirty -= dt; if (tDirty <= 0) calcTower(s); }
          const w = TAU * s.fg, T = dt * TW.speed, n = Math.max(1, Math.ceil(T / 0.05)), h = T / n;
          if (!on) { q[2] = q[0]; q[3] = q[1]; }
          for (let i = 0; i < n; i++) {
            towerStep(q, h, tt, w, s.mu, on); tt += h;
            roofM.feed({ x: q[0], v: q[1], t: tt }); ballM.feed({ x: q[2] - q[0], v: q[3] - q[1], t: tt });
          }
          tph = (w * tt) % TAU;
          if (roofM.settled && (!tTrail.length || Math.abs(tTrail[tTrail.length - 1][0] - s.fg) > 0.002)) { tTrail.push([s.fg, roofM.amp * 100]); if (tTrail.length > 200) tTrail.shift(); }
          // Draw: first-mode shape, sway × 40, 1 unit = 25 m.
          const top = (q[0] * TW.exag) / 25;
          floors.forEach((g, i) => { const u = (i + 0.5) / NF, d = top * Math.pow(u, 1.5); g.position.set(d, 0.16 + (i + 0.5) * FH, 0); g.rotation.z = -top * 1.5 * Math.sqrt(u) / TW.H; });
          roof.position.set(top, 0.16 + TW.H + 0.02, 0);
          const by = 0.16 + TW.H - 2.4 * FH, bxr = top * Math.pow(1 - 2.4 / NF, 1.5) + ((q[2] - q[0]) * TW.exag) / 25 * 0.25;
          ball.position.set(clamp(bxr, top - 0.42, top + 0.42), by, 0);
          cables.forEach((c, i) => { const [cx, cz] = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]][i]; c.set([top + cx, 0.16 + TW.H - 0.05, cz], [ball.position.x + cx * 0.4, by + 0.2, cz * 0.4]); });
          const gust = Math.cos(tph); winds.forEach((a2) => a2.set(1.1 + 0.9 * gust));
          lRoof.position.set(top, TW.H + 0.95, 0); lRoof.element.innerHTML = `roof sway <b>±${fmtLen(roofM.amp)}</b>`;
          lBall.element.innerHTML = on ? `ball swings <b>±${fmtLen(ballM.amp)}</b>` : 'ball locked'; lBall.position.set(top + 1.75, by, 0);
        } else {
          const fixed = s.fix === 'y2002';
          if (s.ramp) { s.N = Math.min(500, s.N + dt * 14); if (s.N >= 500) s.ramp = false; }
          const N = s.N, T = dt * BR.speed, a0 = BR.noise * Math.sqrt(N);
          advance(bst, T, 0.01, (t, x, v) => {
            let f = 0; for (const [fr, p] of NOISE) f += Math.cos(TAU * fr * t + p);
            return -BR.w0 * BR.w0 * x - 2 * zNet(N, bA, fixed) * BR.w0 * v + (a0 * f) / Math.sqrt(NOISE.length / 2);
          }, (st) => { const e = Math.hypot(st.x, st.v / BR.w0); bA += (e - bA) * 0.02; });
          bT += dt; if (!bTrail.length || Math.abs(bTrail[bTrail.length - 1][0] - N) > 4 || bT > 0.5) { bT = 0; bTrail.push([N, bA]); if (bTrail.length > 260) bTrail.shift(); }
          lock += (clamp(bA / 0.02, 0, 1) * (zNet(N, 0, fixed) < 0 ? 1 : 0.15) - lock) * Math.min(1, dt * 2);
          const dz = (u) => ((bst.x * BR.exag) / 10) * Math.sin(Math.PI * u);
          segs.forEach((b, i) => { const u = (i + 0.5) / NSEG; b.position.set(-DL / 2 + u * DL, 1.95, dz(u)); });
          rails.forEach((pts, r) => pts.forEach((b, i) => { const u = (i + 0.5) / NSEG; b.position.set(-DL / 2 + u * DL, 2.22, dz(u) + (r ? 0.44 : -0.44)); }));
          const shown = Math.round(clamp(N / 5, 0, NP)), deckPh = Math.atan2(-bst.v / BR.w0, bst.x);
          for (let i = 0; i < NP; i++) {
            const p = pu[i]; p.u = (p.u + p.dir * p.sp * dt + 1) % 1; p.ph += TAU * p.f * dt * 1.4;
            // a locked walker sways in time with the deck (a quarter cycle ahead: pushing with its velocity)
            const own = Math.sin(p.ph), sway = (1 - lock) * own + lock * Math.cos(deckPh + Math.PI / 2);
            if (i < shown) people.place(i, [-DL / 2 + p.u * DL, 2.17, dz(p.u) + p.lane * 0.6 + 0.07 * sway], [0, 0, 0.12 * sway], 1); else people.place(i, [0, -5, 0], null, 0.001);
          }
          people.done();
          lBr.element.innerHTML = `${Math.round(N)} people · sway <b>±${fmtLen(bA)}</b>` + (narrow ? '' : '<br><small>one span · sway drawn 30× bigger · time-lapse ×4</small>');
        }
        drawT += dt; if (drawT > 1 / 20 || inReel()) { drawT = 0; (s.focus === 'tower' ? tBoard : bBoard).redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'tower') {
          const on = s.tmd === 'free', st = towerSteady(s.fg, s.mu, on), other = towerSteady(s.fg, s.mu, !on), f1 = on ? TW.f1 : TW.f1 / Math.sqrt(1 + s.mu);
          return sheet(`Tower’s own period: ${(1 / f1).toFixed(2)} s`, [
            ['Roof sway now (measured)', `±${fmtLen(roofM.amp)}`],
            ['Steady sway by the formula', `±${fmtLen(st.x1 * TW.xst)}`],
            ['Gusts every', `${(1 / s.fg).toFixed(2)} s (${s.fg.toFixed(3)} Hz)`],
            [on ? 'With the ball locked it would be' : 'With the ball free it would be', `±${fmtLen(other.x1 * TW.xst)}`],
            ['Ball swings, relative to the tower', on ? `±${fmtLen(ballM.amp)}` : 'locked'],
          ], `The same gusts held steady would bend the roof just 1 cm. ${on ? 'The ball is tuned ' + (100 - 100 / (1 + s.mu)).toFixed(1) + ' % below the tower.' : 'Resonance multiplies that by up to 50.'}`);
        }
        const fixed = s.fix === 'y2002', z0 = fixed ? BR.zetaFix : BR.zeta, zn = zNet(s.N, 0, fixed), Nc = (BR.Nc * z0) / BR.zeta, rate = -zn * BR.w0;
        return sheet(zn < 0 ? 'Unstable: the sway feeds itself' : 'Stable: wobbles die away', [
          ['People on the span', `${Math.round(s.N)} of a critical ${fmt0(Nc)}`],
          ['Sideways sway now', `±${fmtLen(bA)}`],
          ['Bridge’s own damping', `${(z0 * 100).toFixed(1)} % of critical`],
          ['Net damping', `${(zn * 100).toFixed(2)} %: sway ${zn < 0 ? 'doubles' : 'halves'} every ${(Math.LN2 / Math.abs(rate)).toFixed(0)} s`],
        ], '');
      },
    };
  },
};
