// Chapter 3: resonance as a selector. Three things that answer one frequency and ignore the rest.
// "strings": a played string over eight sympathetic strings (as on a sitar, which has 11–13 "taraf"
//   strings; a sarangi has about 37: Wikipedia "Sympathetic string"). The eight are tuned to a
//   just-intonation scale on Sa = 261.6 Hz (ratios 1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2). Each has three
//   modes (f, 2f, 3f), and every mode is one driven oscillator stepped with RK4 at audio rate:
//     x'' + (ω ÷ Q) x' + ω² x = ω² d(t),   d(t) = Σ (1 ÷ n) cos(n φ), n = 1…4 (the played string's
//   harmonics, passed through the bridge), with Q = 400 (assumed: a steel string that rings for about
//   a second). The bars are the swing measured from x and x'; the white ticks are the analytic steady
//   state, Σ over matching harmonics of (1 ÷ n) × gain. A string answers within about f ÷ Q of a match.
// "radio": a coil and a variable capacitor ring at f₀ = 1 ÷ (2π √(L C)). L = 230 µH on a ferrite rod and
//   C = 40–400 pF span the medium-wave band, 531–1602 kHz in 9 kHz steps (ITU Regions 1 and 3; the same
//   parts as RadioClear). Response to a station at f: 1 ÷ √(1 + Q² (f/f₀ − f₀/f)²), bandwidth ≈ f₀ ÷ Q.
//   A series LC circuit obeys the same equation as the mass on a spring: L is the mass, 1/C the spring,
//   R the damping. The six stations are placed on real channel frequencies but are not named.
// "quartz": Q values from Wikipedia "Q factor" and "Pendulum": door closer 0.5, watch balance wheel
//   100–300, tuning fork about 1,000, good pendulum clock about 10,000 (Shortt clock 110,000), quartz
//   crystal 10⁴–10⁶, atomic clocks about 10¹¹. Bandwidth = f₀ ÷ Q; a struck resonator's swing falls to
//   1/e in Q ÷ π cycles. The watch crystal is a 32,768 Hz (2¹⁵) tuning fork (see QuartzClear).
import { THREE, M, box, beam, torus } from '../kit.js';
import {
  TAU, COL, gain, liveLine, board, panelBg, axes, title, line, curve, dot, text, clip, fitNarrow, reelPlace, focusView, inReel, tone,
  fmtHz, fmtS, fmtQ, fmt0, link, clamp, sheet,
} from '../reso.js';

// ---------------------------------------------------------------- strings
const SA = 261.63, QS = 400;
const NOTES = [['Sa', 1], ['Re', 9 / 8], ['Ga', 5 / 4], ['Ma', 4 / 3], ['Pa', 3 / 2], ['Dha', 5 / 3], ['Ni', 15 / 8], ['Sa′', 2]];
const NH = 4, NM = 3, HW = [1, 1 / 2, 1 / 3, 1 / 4], FULL = 1 + 1 / 2 + 1 / 3;   // a string driven on all three modes at once
const cents = (f, g) => 1200 * Math.log2(f / g);
// Analytic steady response of string i (fundamental fi) to a played note f: every harmonic n of the
// played string drives every mode j; only near-matches matter.
function steadyString(fi, f) {
  let a = 0;
  for (let j = 1; j <= NM; j++) { let m = 0; for (let n = 1; n <= NH; n++) m += (HW[n - 1] * gain((n * f) / (j * fi), 1 / (2 * QS))) ** 2; a += Math.sqrt(m); }
  return a / QS / FULL;
}
// ---------------------------------------------------------------- radio
const LANT = 230e-6, BAND = [531e3, 1602e3];
const STN = [594e3, 702e3, 819e3, 1017e3, 1296e3, 1566e3];
const STR = [0.8, 1, 0.6, 0.9, 0.5, 0.7];
const fLC = (C) => 1 / (TAU * Math.sqrt(LANT * C * 1e-12));
const CofF = (f) => 1e12 / (LANT * (TAU * f) ** 2);
const resp = (f, f0, Q) => 1 / Math.sqrt(1 + Q * Q * (f / f0 - f0 / f) ** 2);
// ---------------------------------------------------------------- quartz and friends
const RES = {
  balance: { name: 'Watch balance wheel', f: 4, Q: 200, note: 'a spiral spring and a wheel, 4 swings a second' },
  fork: { name: 'Steel tuning fork', f: 440, Q: 1000, note: 'concert A' },
  pendulum: { name: 'Clock pendulum', f: 0.5, Q: 10000, note: 'a good one-metre pendulum' },
  quartz: { name: 'Quartz watch crystal', f: 32768, Q: 100000, note: 'a 3 mm tuning fork of quartz' },
};
const QLIST = [['Door closer', 0.5], ['Playground swing', 25], ['Balance wheel', 200], ['Tuning fork', 1000], ['Pendulum clock', 1e4], ['Quartz crystal', 1e5], ['Atomic clock', 1e11]];

const RX = 40, QX = 80;
const VIEWS = {
  strings: { pos: [0, 8.4, 11.0], target: [0, 2.6, 0] },
  radio: { pos: [RX - 0.7, 4.4, 11.6], target: [RX - 0.7, 3.9, 0] },
  quartz: { pos: [QX - 0.7, 4.4, 11.6], target: [QX - 0.7, 3.9, 0] },
};

export default {
  id: 'tuned',
  short: 'Tuned in',
  title: 'Resonance picks one note out of many',
  subtitle: 'Sympathetic strings, a radio dial and a quartz crystal all answer only their own frequency.',
  view: VIEWS.strings,
  learn: `<p>A resonator is a <b>filter</b>. Push it at its own frequency and it answers loudly. Push it at any other and it hardly moves. That makes resonance the standard way to <b>pick one frequency out of many</b>.</p>
    <p><b>Sympathetic strings.</b> A sitar has one row of strings you play and, underneath, 11 to 13 thin strings nobody touches, the <b>taraf</b>. Each is tuned to a note of the raga. Play a note and the string tuned to it starts to ring by itself, shaken through the bridge. So does a string whose overtone matches one of yours: the string an octave up, or the fifth. Miss the pitch by a hair and they stay silent. That shimmer after each note is resonance you can hear (see ${link('guitarclear', 'GuitarClear')} for how strings set their pitch, and ${link('tablaclear', 'TablaClear')} for a drum tuned the same careful way).</p>
    <p><b>Tuning a radio.</b> Every station in range reaches your aerial at once. A coil and a capacitor together make an <b>electrical</b> resonator: charge sloshes between them at <b>f₀ = 1 ÷ (2π √(LC))</b>, with the coil playing the mass and the capacitor the spring. Turning the dial changes the capacitor, slides the peak along the band, and lets through the one station that sits under it (see ${link('radioclear', 'RadioClear')}).</p>
    <p><b>Quartz.</b> How sharply a resonator chooses is its <b>Q</b>. Its peak is <b>f₀ ÷ Q</b> wide, and once struck it rings for about Q swings. A playground swing has a Q of a few tens. A good pendulum clock reaches about 10,000. The tiny quartz tuning fork in a watch, ringing 32,768 times a second, reaches 100,000 or more, so it holds its frequency to a few parts in a million. That is why a cheap quartz watch beats a fine mechanical one (see ${link('quartzclear', 'QuartzClear')} and ${link('clockclear', 'ClockClear')}).</p>
    <p class="tip"><b>Try it:</b> play Sa and see which strings answer, then slide slowly upward and watch each one light up in turn. On the radio, lower the Q and watch a second station leak in.</p>`,
  terms: [
    { t: 'Sympathetic string', d: 'A string that is never plucked. It rings when another string plays its note, or a note whose overtones match.' },
    { t: 'Harmonics (overtones)', d: 'A string vibrates at its basic frequency and at 2, 3, 4… times it, all at once.' },
    { t: 'Tuned circuit', d: 'A coil and a capacitor that resonate at f₀ = 1 ÷ (2π √(LC)).' },
    { t: 'Bandwidth', d: 'The width of a resonance peak: about f₀ ÷ Q.' },
    { t: 'Selectivity', d: 'How well a resonator ignores frequencies next to its own. A higher Q is more selective.' },
    { t: 'Ring time', d: 'How long a struck resonator keeps going: its swing falls to about a third in Q ÷ π cycles.' },
  ],
  defaults: { focus: 'strings', note: 0, glide: false, C: 223.5, Q: 80, res: 'quartz' },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'strings', label: 'Sympathetic strings' }, { v: 'radio', label: 'Radio dial' }, { v: 'quartz', label: 'Quartz and Q' }] },
    { key: 'note', type: 'range', label: 'Strings: note you play', min: -50, max: 1250, step: 1, ends: ['Sa', 'upper Sa'], fmt: (v) => { const f = SA * Math.pow(2, v / 1200); const i = NOTES.findIndex((n) => Math.abs(cents(f, SA * n[1])) < 6); return `${f.toFixed(1)} Hz${i >= 0 ? ' · ' + NOTES[i][0] : ''}`; } },
    { key: 'sw', type: 'buttons', label: 'Strings: play', items: [
      ...NOTES.map(([name, r]) => ({ label: name, act: (s, inst) => { s.focus = 'strings'; s.glide = false; s.note = Math.round(cents(r, 1)); inst.hear(s); } })),
      { label: 'Slide up (meend)', act: (s) => { s.focus = 'strings'; s.note = -50; s.glide = true; } },
    ] },
    { key: 'C', type: 'range', label: 'Radio: tuning capacitor', min: 40, max: 400, step: 0.5, ends: ['40 pF', '400 pF'], fmt: (v) => `${v.toFixed(1)} pF → ${fmt0(fLC(v) / 1000)} kHz` },
    { key: 'Q', type: 'log', label: 'Radio: Q of the tuned circuit', min: 10, max: 200, ends: ['10, sloppy', '200, sharp'], fmt: (v, s) => `Q = ${v.toFixed(0)} · ${(fLC(s.C) / v / 1000).toFixed(1)} kHz wide` },
    { key: 'rs', type: 'buttons', label: 'Radio', items: [
      { label: 'Next station up', act: (s) => { s.focus = 'radio'; const f = fLC(s.C), n = STN.find((x) => x > f + 2000) || STN[0]; s.C = +CofF(n).toFixed(1); } },
    ] },
    { key: 'res', type: 'seg', label: 'Compare resonators', options: [{ v: 'balance', label: 'Balance' }, { v: 'fork', label: 'Fork' }, { v: 'pendulum', label: 'Pendulum' }, { v: 'quartz', label: 'Quartz' }] },
  ],
  onChange(s, key) {
    if (key === 'note') { s.focus = 'strings'; s.glide = false; }
    if (key === 'C' || key === 'Q') s.focus = 'radio';
    if (key === 'res') s.focus = 'quartz';
  },
  quiz: [
    { q: 'You play Sa on a sitar. Which untouched string is most likely to ring as well?', options: ['The one tuned a little sharp of Sa', 'The one tuned to upper Sa, an octave above', 'All of them equally', 'None: a string must be plucked'], answer: 1, why: 'The played string’s second harmonic is exactly the upper Sa, so that string is driven at its own frequency. A string tuned slightly off gets pushes that drift out of step.' },
    { q: 'A radio’s tuned circuit sits at 1,000 kHz with Q = 100. Roughly how wide is the band it lets through?', options: ['1 kHz', '10 kHz', '100 kHz', '1,000 kHz'], answer: 1, why: 'Bandwidth ≈ f₀ ÷ Q = 1,000 ÷ 100 = 10 kHz, about one medium-wave channel.' },
    { q: 'Why does a quartz watch keep better time than a pendulum clock?', options: ['Quartz is heavier', 'Its resonator has a far higher Q, so its frequency is far more sharply defined', 'It ticks more slowly', 'It has no resonator'], answer: 1, why: 'A watch crystal’s Q is around 100,000 against about 10,000 for a good pendulum. A sharper peak means the frequency can wander much less.' },
  ],
  reel: [
    { ms: 5400, caption: 'Play one note on a sitar and the untouched strings tuned to it ring by themselves.', set: { focus: 'strings', glide: false }, act: (s, inst) => inst.hush(), anim: { note: [-40, 720] }, view: { pos: [0, 10.2, 9.6], target: [0, 6.4, 0] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    let cur = { ...s0 }, lastFocus = null, drawT = 0, qT = 0, shown = SA;
    const gT = new THREE.Group(), gR = new THREE.Group(), gQ = new THREE.Group(); root.add(gT, gR, gQ); gR.position.x = RX; gQ.position.x = QX;
    const wood = M.matte(0x6b4226), dark = M.matte(0x2b3039), steel = M.metal(0xc9ced8), brass = M.metal(0xc9a24a, { roughness: 0.35 });

    // ================================================================ strings
    const XL = -4.6, XR = 4.6, YS = 1.05, YM = 1.75, DZ = 0.36;
    gT.position.y = 2.3;
    const neck = box(10.4, 0.5, 3.6, wood); neck.position.set(0, 0.45, 0); gT.add(neck);
    for (const x of [-3.9, 3.9]) { const leg = box(0.7, 2.5, 3.0, M.matte(0x2b3039)); leg.position.set(x, -1.05, 0); gT.add(leg); }
    const bridge = box(0.22, 0.42, 3.3, M.matte(0xe8dcc0)); bridge.position.set(XR, 0.9, 0); gT.add(bridge);
    const nut = box(0.18, 0.42, 3.3, M.matte(0xe8dcc0)); nut.position.set(XL, 0.9, 0); gT.add(nut);
    const mainPost = box(0.2, 0.75, 0.4, M.matte(0xe8dcc0)); mainPost.position.set(XR, 1.4, 0); gT.add(mainPost);
    const mainNut = box(0.18, 0.75, 0.4, M.matte(0xe8dcc0)); mainNut.position.set(XL, 1.4, 0); gT.add(mainNut);
    const zOf = (i) => (i - 3.5) * DZ;
    const lines = NOTES.map((n, i) => { const ln = liveLine(60, 0xffffff); gT.add(ln); return ln; });
    const still = NOTES.map((n, i) => { const m = beam([XL, YS, zOf(i)], [XR, YS, zOf(i)], 0.008, M.ghost(0xffffff, 0.25), 6); gT.add(m); return m; });
    const mainLn = liveLine(80, 0xffb547); gT.add(mainLn);
    const mainDead = liveLine(2, 0xffb547, 0.5); gT.add(mainDead);
    const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 6, 12), M.plastic(0xf0c8a0)); finger.rotation.x = 0.5; gT.add(finger);
    const labs = NOTES.map((n, i) => { const l = stage.label(n[0], [XL - 0.5, YS + 0.05, zOf(i)], gT); return l; });
    const lMain = stage.label('', [0, YM + 1.1, 0], gT, 'hot'); lMain.element.style.setProperty('--c', COL.drive);
    // 24 oscillators: x, v for every (string, mode)
    const NO = NOTES.length * NM, ox = new Float64Array(NO), ov = new Float64Array(NO), ow = new Float64Array(NO), amp = new Float64Array(NO), sq = new Float64Array(NO), respS = new Float64Array(NOTES.length);
    NOTES.forEach((n, i) => { for (let j = 0; j < NM; j++) ow[i * NM + j] = TAU * SA * n[1] * (j + 1); });
    let phi = 0, strobe = 0;
    const drive = (p) => { let d = 0; for (let n = 1; n <= NH; n++) d += HW[n - 1] * Math.cos(n * p); return d; };
    function stepStrings(dt, f) {
      const w = TAU * f, n = Math.max(1, Math.ceil(dt / 1.6e-5)), h = dt / n;
      sq.fill(0);
      for (let k = 0; k < n; k++) {
        const d0 = drive(phi), dm = drive(phi + 0.5 * w * h), d1 = drive(phi + w * h);
        for (let o = 0; o < NO; o++) {
          const w0 = ow[o], w2 = w0 * w0, c = w0 / QS, x = ox[o], v = ov[o];
          const a1 = w2 * (d0 - x) - c * v;
          const v2 = v + 0.5 * h * a1, a2 = w2 * (dm - (x + 0.5 * h * v)) - c * v2;
          const v3 = v + 0.5 * h * a2, a3 = w2 * (dm - (x + 0.5 * h * v2)) - c * v3;
          const v4 = v + h * a3, a4 = w2 * (d1 - (x + h * v3)) - c * v4;
          ox[o] = x + (h / 6) * (v + 2 * v2 + 2 * v3 + v4); ov[o] = v + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
          sq[o] += ox[o] * ox[o];
        }
        phi += w * h;
      }
      phi %= TAU;
      // The swing of each mode, read from the motion: √2 × its root-mean-square over this frame,
      // smoothed over about 30 ms. For a sum of sines that is √(Σ amplitude²), as in steadyString().
      for (let o = 0; o < NO; o++) { const a = Math.sqrt((2 * sq[o]) / n); amp[o] += (a - amp[o]) * Math.min(1, dt / 0.03); }
      for (let i = 0; i < NOTES.length; i++) { let a = 0; for (let j = 0; j < NM; j++) a += amp[i * NM + j]; respS[i] = a / QS / FULL; }
    }
    const sBoard = board(root, 4.8, 3.0, 620, 390, (g, w, h) => {
      panelBg(g, w, h);
      const f = SA * Math.pow(2, cur.note / 1200);
      title(g, 'How hard each untouched string rings', '');
      const x0 = 56, x1 = w - 20, y0 = h - 54, y1 = 74, bw = (x1 - x0) / NOTES.length;
      g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '16px sans-serif';
      for (const t of [0, 0.5, 1]) { const y = y0 - t * (y0 - y1); g.fillText(t * 100 + '%', 8, y + 5); g.strokeStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
      NOTES.forEach((n, i) => {
        const r = clamp(respS[i], 0, 1.05), an = clamp(steadyString(SA * n[1], f), 0, 1.05), bx = x0 + i * bw + 8;
        g.fillStyle = r > 0.35 ? COL.drive : r > 0.08 ? COL.line : 'rgba(142,240,255,.45)'; g.fillRect(bx, y0 - r * (y0 - y1), bw - 16, r * (y0 - y1));
        g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(bx - 4, y0 - an * (y0 - y1)); g.lineTo(bx + bw - 12, y0 - an * (y0 - y1)); g.stroke();
        g.fillStyle = COL.text; g.font = 'bold 19px sans-serif'; g.fillText(n[0], bx + (bw - 16) / 2 - g.measureText(n[0]).width / 2, y0 + 24);
        g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '14px sans-serif'; const t = (SA * n[1]).toFixed(0); g.fillText(t, bx + (bw - 16) / 2 - g.measureText(t).width / 2, y0 + 42);
      });
      text(g, 'bars: stepped live · white ticks: the formula', x0 + 6, 58, 'rgba(255,255,255,.6)', '15px sans-serif');
    }, [0, 1.9, 4.3]);
    sBoard.mesh.rotation.x = -0.45;

    // ================================================================ radio
    const rodF = beam([-0.2, 6.6, 0], [4.6, 6.6, 0], 0.22, dark, 20); gR.add(rodF);
    for (let i = 0; i < 26; i++) { const t = torus(0.3, 0.035, M.metal(0xc77b3a, { roughness: 0.4 }), 28); t.rotation.y = Math.PI / 2; t.position.set(1.0 + i * 0.09, 6.6, 0); gR.add(t); }
    // Variable capacitor: fixed plates and a rotor of half-discs on a shaft.
    const capG = new THREE.Group(); capG.position.set(2.2, 2.6, 0); capG.rotation.y = 0.55; gR.add(capG);
    const halfGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.04, 32, 1, false, 0, Math.PI);
    for (let i = 0; i < 7; i++) { const p = new THREE.Mesh(halfGeo, M.metal(0xb9bec8)); p.rotation.set(Math.PI / 2, 0, 0); p.rotation.y = Math.PI; p.position.z = -0.75 + i * 0.25; capG.add(p); }
    const rotor = new THREE.Group(); capG.add(rotor);
    for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(halfGeo, brass); p.rotation.x = Math.PI / 2; p.position.z = -0.625 + i * 0.25; rotor.add(p); }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12), steel); shaft.rotation.x = Math.PI / 2; shaft.position.z = 0.3; capG.add(shaft);
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.4, 28), dark); knob.rotation.x = Math.PI / 2; knob.position.z = 1.6; capG.add(knob);
    const mark = box(0.06, 0.4, 0.05, M.glow(0xffb547)); mark.position.set(0, 0.28, 1.82); const knobG = new THREE.Group(); knobG.add(mark); capG.add(knobG);
    gR.add(beam([1.0, 6.3, 0], [1.0, 4.4, 0], 0.03, M.metal(0xc77b3a)), beam([1.0, 4.4, 0], [1.2, 3.0, 0], 0.03, M.metal(0xc77b3a)), beam([3.3, 6.3, 0], [3.3, 4.4, 0], 0.03, M.metal(0xc77b3a)), beam([3.3, 4.4, 0], [3.2, 3.0, 0], 0.03, M.metal(0xc77b3a)));
    const chassis = box(5.2, 0.2, 3.6, M.matte(0x1f232b)); chassis.position.set(2.2, 1.0, 0); gR.add(chassis);
    const lCoil = stage.label('coil on a ferrite rod: L = 230 µH', [2.2, 7.4, 0], gR);
    const lCap = stage.label('', [2.2, 0.3, 1.6], gR, 'hot');
    const rBoard = board(root, 6.2, 4.3, 620, 430, (g, w, h) => {
      panelBg(g, w, h);
      const f0 = fLC(cur.C), Q = cur.Q;
      const a = axes(g, w, h, { x0: 62, y1: 76, xMin: 500, xMax: 1650, yMax: 1.1, xTicks: [600, 800, 1000, 1200, 1400, 1600], yTicks: [0, 0.5, 1], xFmt: (v) => v + '', yFmt: (v) => v * 100 + '%', xLabel: 'kHz →', yLabel: 'how much gets through ↑' });
      title(g, 'The tuned circuit', `f₀ = ${fmt0(f0 / 1000)} kHz · Q = ${Q.toFixed(0)}`);
      const { X, Y } = a;
      clip(g, a, () => {
        g.fillStyle = 'rgba(142,240,255,.1)'; g.fillRect(X((f0 - f0 / (2 * Q)) / 1000), a.y1, X((f0 + f0 / (2 * Q)) / 1000) - X((f0 - f0 / (2 * Q)) / 1000), a.y0 - a.y1);
        STN.forEach((f, i) => { const out = STR[i] * resp(f, f0, Q); g.strokeStyle = 'rgba(255,181,71,.3)'; g.lineWidth = 5; g.beginPath(); g.moveTo(X(f / 1000), Y(0)); g.lineTo(X(f / 1000), Y(STR[i])); g.stroke(); g.strokeStyle = COL.drive; g.lineWidth = 7; g.beginPath(); g.moveTo(X(f / 1000), Y(0)); g.lineTo(X(f / 1000), Y(out)); g.stroke(); });
        curve(g, (f) => resp(f * 1000, f0, Q), 500, 1650, X, Y, COL.line, 3.5, null, 500);
      });
      STN.forEach((f) => { const s = String(f / 1000); g.fillStyle = 'rgba(255,181,71,.8)'; g.font = '14px sans-serif'; g.save(); g.translate(X(f / 1000) - 6, a.y1 + 4); g.rotate(-Math.PI / 2); g.fillText(s, -g.measureText(s).width, 0); g.restore(); });
      text(g, '▮ stations: faint = arriving, bright = let through', 62, h - 12, 'rgba(255,255,255,.6)', '15px sans-serif');
    }, [RX - 3.9, 2.55, 0]);

    // ================================================================ quartz
    const can = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 7.6, 40, 1, true, -Math.PI / 2, Math.PI), M.clear(0xcfd6e2, 0.22)); can.position.set(2.3, 4.4, 0); gQ.add(can);
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 12, 0, TAU, 0, Math.PI / 2), M.clear(0xcfd6e2, 0.16)); capTop.position.set(2.3, 8.2, 0); gQ.add(capTop);
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.5, 40), M.matte(0x8a8f99)); plug.position.set(2.3, 0.6, 0); gQ.add(plug);
    for (const x of [-0.4, 0.4]) gQ.add(beam([2.3 + x, -0.4, 0], [2.3 + x, 1.6, 0], 0.05, steel));
    const qMat = new THREE.MeshPhysicalMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.75, roughness: 0.08, clearcoat: 1 });
    const stemQ = box(1.5, 1.7, 0.22, qMat); stemQ.position.set(2.3, 2.2, 0); gQ.add(stemQ);
    const tines = [-1, 1].map((sg) => {
      const segs = []; for (let i = 0; i < 12; i++) { const b = box(0.52, 0.4, 0.22, qMat); gQ.add(b); segs.push(b); }
      const el = liveLine(13, 0xffd27a); gQ.add(el);
      return { sg, segs, el };
    });
    const lQ = stage.label('', [4.6, 6.4, 0], gQ, 'hot');
    const lQ2 = stage.label('a quartz tuning fork a few mm long, slowed right down', [2.3, -0.9, 0], gQ);
    const qBoard = board(root, 6.2, 4.6, 620, 460, (g, w, h) => {
      panelBg(g, w, h);
      const R = RES[cur.res];
      title(g, 'Q: how sharp, how long', '');
      // top: the peak against detuning (in units of f₀/Q the curve is the same for all; in Hz it is not)
      const span = (R.f / R.Q) * 4;
      const a = axes(g, w, h, { x0: 62, y1: 62, y0: 212, xMin: -span, xMax: span, yMax: 1.1, xTicks: [-span, -span / 2, 0, span / 2, span], yTicks: [0, 0.5, 1], xFmt: (v) => (v === 0 ? fmtHz(R.f) : (v > 0 ? '+' : '−') + fmtHz(Math.abs(v))), yFmt: (v) => v * 100 + '%' });
      clip(g, a, () => { g.fillStyle = 'rgba(142,240,255,.1)'; g.fillRect(a.X(-R.f / R.Q / 2), a.y1, a.X(R.f / R.Q / 2) - a.X(-R.f / R.Q / 2), a.y0 - a.y1); curve(g, (d) => gain(1 + d / R.f, 1 / (2 * R.Q)) / R.Q, -span, span, a.X, a.Y, COL.line, 3.5, null, 400); });
      text(g, `${R.name}: peak ${fmtHz(R.f / R.Q)} wide`, 70, 56, COL.line, 'bold 16px sans-serif');
      // bottom: Q on a log scale
      const y0 = 262, rh = 26, x0 = 170, x1 = w - 40, LX = (q) => x0 + ((Math.log10(q) + 0.5) / 12) * (x1 - x0);
      QLIST.forEach(([name, q], i) => {
        const y = y0 + i * rh, on = Math.abs(Math.log10(q / R.Q)) < 0.35;
        g.fillStyle = on ? COL.drive : 'rgba(142,240,255,.55)'; g.fillRect(x0, y, LX(q) - x0, rh - 8);
        text(g, name, 12, y + 15, on ? COL.drive : 'rgba(255,255,255,.8)', (on ? 'bold ' : '') + '16px sans-serif');
        text(g, q >= 1e9 ? '10¹¹' : q < 1 ? '0.5' : fmt0(q), LX(q) + 6, y + 15, 'rgba(255,255,255,.8)', '16px sans-serif');
      });
      text(g, 'Q, each step ×10 →', x1 - 140, h - 8, 'rgba(255,255,255,.55)', '14px sans-serif');
    }, [QX - 3.9, 2.75, 0]);

    return {
      hear(s = cur) { const f = SA * Math.pow(2, s.note / 1200); tone([[f, 0.09, 0.9], [2 * f, 0.03, 0.7], ...NOTES.map((n) => [SA * n[1], 0.05 * clamp(steadyString(SA * n[1], f) - 0.015, 0, 1), 2.4])].filter((t) => t[1] > 0.004)); },
      hush() { ox.fill(0); ov.fill(0); amp.fill(0); },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lCoil, lQ2]);
        gT.visible = sBoard.mesh.visible = s.focus === 'strings'; gR.visible = rBoard.mesh.visible = s.focus === 'radio'; gQ.visible = qBoard.mesh.visible = s.focus === 'quartz';
        if (s.focus !== lastFocus) { if (lastFocus !== null) focusView(stage, VIEWS, s.focus); lastFocus = s.focus; }
        reelPlace([[sBoard, [0, 8.6, -1.2], 2.0], [rBoard, [RX + 2.2, 11, 0], 1.0], [qBoard, [QX + 2.3, 12.4, 0], 1.0]]);
        sBoard.mesh.rotation.x = inReel() ? -0.25 : -0.45;
        if (s.focus === 'strings') {
          if (s.glide) { s.note = Math.min(1250, s.note + dt * 55); if (s.note >= 1250) s.glide = false; }
          const f = SA * Math.pow(2, s.note / 1200); shown = f;
          stepStrings(Math.min(dt, 0.05), f);
          strobe += dt * TAU * 2.2;
          NOTES.forEach((n, i) => {
            const z = zOf(i), a = [0, 1, 2].map((j) => clamp(amp[i * NM + j] / QS, 0, 1.05) * 0.3);
            lines[i].set((u) => [XL + (XR - XL) * u, YS + a[0] * Math.sin(Math.PI * u) * Math.sin(strobe) + a[1] * Math.sin(2 * Math.PI * u) * Math.sin(2 * strobe) + a[2] * Math.sin(3 * Math.PI * u) * Math.sin(3 * strobe), z]);
            const r = respS[i]; lines[i].material.color.set(r > 0.35 ? COL.drive : r > 0.08 ? COL.line : '#9aa3b2');
            labs[i].element.style.color = r > 0.35 ? COL.drive : r > 0.08 ? COL.line : ''; labs[i].position.set((i % 2 ? 1 : -1) * (XR + 0.5 + (i % 4 > 1 ? 0.8 : 0)), YS, z);
          });
          // The played string: pressing a "fret" shortens the part that vibrates, L ∝ 1 ÷ f.
          const xf = XR - (XR - XL) * Math.min(1, SA / f);
          mainLn.set((u) => [xf + (XR - xf) * u, YM + 0.3 * Math.sin(Math.PI * u) * Math.sin(strobe * 1.7) + 0.1 * Math.sin(2 * Math.PI * u) * Math.sin(strobe * 3.4), 0]);
          mainDead.set((u) => [XL + (xf - XL) * u, YM, 0]);
          finger.position.set(xf - 0.12, YM + 0.42, 0.1); finger.visible = xf > XL + 0.05;
          const i = NOTES.findIndex((n) => Math.abs(cents(f, SA * n[1])) < 6);
          lMain.position.set((xf + XR) / 2, YM + 1.0, 0);
          lMain.element.innerHTML = `you play <b>${f.toFixed(1)} Hz</b>${i >= 0 ? ' · ' + NOTES[i][0] : ''}`;
        } else if (s.focus === 'radio') {
          const k = (s.C - 40) / 360; rotor.rotation.z = Math.PI * (1 - k); knobG.rotation.z = rotor.rotation.z;
          lCap.element.innerHTML = `tuning capacitor: <b>${s.C.toFixed(0)} pF</b>${narrow ? '' : ' (plates meshed ' + Math.round(k * 100) + ' %)'}`;
        } else {
          const R = RES[s.res]; qT += dt;
          const sw = 0.16 * Math.sin(qT * TAU * 1.3);
          tines.forEach(({ sg, segs, el }) => {
            const pts = [];
            segs.forEach((b, i) => { const u = (i + 0.5) / 12, d = sg * sw * u * u * (3 - u) / 2; b.position.set(2.3 + sg * 0.49 + d, 3.25 + i * 0.4, 0); b.rotation.z = -sg * sw * u * (2 - u) * 0.12; });
            for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([2.3 + sg * 0.49 + sg * sw * u * u * (3 - u) / 2, 3.05 + i * 0.4, 0.13]); }
            el.set((u, i) => pts[i]);
          });
          lQ.element.innerHTML = `${R.name}<br><b>${fmtHz(R.f)}</b> · Q ≈ <b>${fmtQ(R.Q)}</b>`;
        }
        cur = { ...s };
        drawT += dt; if (drawT > 1 / 20 || inReel()) { drawT = 0; (s.focus === 'strings' ? sBoard : s.focus === 'radio' ? rBoard : qBoard).redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'strings') {
          const f = SA * Math.pow(2, s.note / 1200);
          let best = 0; NOTES.forEach((n, i) => { if (Math.abs(cents(f, SA * n[1])) < Math.abs(cents(f, SA * NOTES[best][1]))) best = i; });
          const off = cents(f, SA * NOTES[best][1]), ringing = NOTES.filter((n, i) => respS[i] > 0.08).map((n) => n[0]);
          return sheet(`Playing ${f.toFixed(1)} Hz`, [[`Nearest string`, `${NOTES[best][0]}, ${(SA * NOTES[best][1]).toFixed(1)} Hz`], [`You are off by`, `${Math.abs(off) < 0.5 ? 'nothing' : Math.abs(off).toFixed(0) + ' cents ' + (off > 0 ? 'sharp' : 'flat')}`], [`Strings ringing now`, `${ringing.length ? ringing.join(', ') : 'none'}`], [`Width of each string’s peak, f ÷ Q`, `${(f / QS).toFixed(2)} Hz (${(1200 * Math.log2(1 + 1 / QS)).toFixed(0)} cents)`]], '');
        }
        if (s.focus === 'radio') {
          const f0 = fLC(s.C), outs = STN.map((f, i) => [f, STR[i] * resp(f, f0, s.Q)]).sort((a, b) => b[1] - a[1]);
          const leak = outs[1][1] / Math.max(outs[0][1], 1e-9);
          return sheet(`f₀ = 1 ÷ (2π √(LC)) = ${fmt0(f0 / 1000)} kHz`, [[`Coil · capacitor`, `230 µH · ${s.C.toFixed(1)} pF`], [`Bandwidth, f₀ ÷ Q`, `${(f0 / s.Q / 1000).toFixed(1)} kHz`], [`Loudest station`, `${outs[0][1] > 0.25 ? outs[0][0] / 1000 + ' kHz at ' + Math.round(outs[0][1] * 100) + ' %' : 'none: between stations'}`], [`Next loudest, compared`, `${(20 * Math.log10(leak)).toFixed(0)} dB (${(leak * 100).toFixed(leak < 0.1 ? 1 : 0)} %)`]], `The coil is the mass, the capacitor the spring, the wire’s resistance the damping.`);
        }
        const R = RES[s.res], tau = R.Q / (Math.PI * R.f);
        return sheet(`${R.name}: Q ≈ ${fmtQ(R.Q)}`, [[`Natural frequency`, `${fmtHz(R.f)}`], [`Peak width, f₀ ÷ Q`, `${fmtHz(R.f / R.Q)} (${(1e6 / R.Q).toPrecision(2)} parts per million)`], [`Struck once, rings for about`, `${fmt0(R.Q / Math.PI)} swings = ${fmtS(tau)}`]], `${R.note[0].toUpperCase() + R.note.slice(1)}. Typical values: real ones vary a lot.`);
      },
    };
  },
};
