// Chapter 5: where "resonance" is the wrong answer, or only half of it. Three famous stories.
// "tacoma" (deck drawn far wider than scale): the first Tacoma Narrows Bridge, 7 November 1940.
//   Facts (Wikipedia "Tacoma Narrows Bridge (1940)"; Billah and Scanlan, Am. J. Phys. 59, 118, 1991):
//   opened 1 July 1940, main span 853 m, deck 12 m wide on 2.4 m plate girders, fell about 11 am in a
//   steady wind of about 64 km/h (40 mph), twisting 12 times a minute (0.2 Hz). The cause was
//   aeroelastic (torsional) flutter: a self-excited motion in which the wind's torque keeps step with
//   the deck's own twisting velocity, i.e. negative damping. It was not an outside push at a matching
//   frequency. Vortices shed by a bluff 2.4 m girder come at f = St U ÷ D; with St ≈ 0.12 that is about
//   0.9 Hz at 64 km/h (Billah and Scanlan give about 1 Hz), nowhere near 0.2 Hz.
//   Model, stepped with RK4 (time-lapse ×10):  θ'' + 2 ζ_net ω₀ θ' + ω₀² θ = small random buffeting
//   (none of it at 0.2 Hz), ζ_net = ζ_s (1 − (U ÷ U_c)⁶) + a limiter at large twist. ζ_s = 1 % and the onset speed U_c = 50 km/h
//   are illustrative choices (the real aerodynamic terms come from wind-tunnel "flutter derivatives");
//   the steep power makes the growth watchable. The deck is taken to fail after holding more than 30°.
// "microwave" (1 unit = 1 cm): liquid water's dielectric response at 25 °C, single Debye relaxation:
//   ε(f) = ε∞ + (ε_s − ε∞) ÷ (1 + i f ÷ f_r), ε_s = 78.4, ε∞ = 5.2, relaxation time 8.27 ps so
//   f_r = 19.2 GHz (standard fits, e.g. Kaatze 1989; Ellison 2007). A relaxation is a lag, not a
//   resonance: no ringing, and a loss hump two decades wide. Ovens use 2.45 GHz (some industrial ones
//   915 MHz), licence-free ISM bands, well below the hump. Power penetration depth
//   D_p = c ÷ (2πf) ÷ √(2ε' (√(1 + (ε''/ε')²) − 1)): about 1.9 cm at 2.45 GHz, under 1 mm at 19 GHz.
// "glass" (1 unit = 3 cm): a wine glass taken to ring at 660 Hz with Q = 1,000 (assumed; real glasses
//   ring at a few hundred hertz to about 1 kHz). x'' + (ω₀/Q) x' + ω₀² x = ω₀² p(t), stepped at audio
//   rate; p ∝ 10^(dB/20). Whether it breaks depends on invisible flaws: each new glass gets a hidden
//   strength between 104 and 116 dB-on-pitch, so about 1 in 12 goes at 105 dB, echoing the one
//   documented unamplified break (MythBusters, 2005: singer Jaime Vendera, about 105 dB, after trying
//   12 glasses; Scientific American, "Fact or Fiction?: An Opera Singer's Piercing Voice Can Shatter
//   Glass"). The strength range is a modelling choice.
import { THREE, M, box, beam, sphere, swarm } from '../kit.js';
import {
  TAU, DEG, COL, gain, advance, liveLine, strut, board, panelBg, axes, title, line, curve, dot, text, clip, fitNarrow, reelPlace, focusView,
  inReel, tone, fmtLen, fmtHz, link, clamp, sheet,
} from '../reso.js';

// ---------------------------------------------------------------- Tacoma
const TN = { f0: 0.2, zs: 0.01, Uc: 50, St: 0.12, D: 2.44, speed: 10, fail: 30 * DEG };
TN.w0 = TAU * TN.f0;
const fVortex = (U) => (TN.St * (U / 3.6)) / TN.D;                                    // Hz, U in km/h
const zTac = (U, A) => TN.zs * (1 - (U / TN.Uc) ** 6) + 0.05 * (A / (38 * DEG)) ** 6;
// ---------------------------------------------------------------- water
const W = { es: 78.4, einf: 5.2, fr: 19.2 };                                           // GHz
function water(f) {
  const x = f / W.fr, d = W.es - W.einf, e1 = W.einf + d / (1 + x * x), e2 = (d * x) / (1 + x * x), t = e2 / e1;
  const lam = 29.9792458 / f;                                                          // cm in air
  return { e1, e2, lam, Dp: lam / TAU / Math.sqrt(2 * e1 * (Math.sqrt(1 + t * t) - 1)) };   // cm
}
// ---------------------------------------------------------------- glass
const GL = { f0: 660, Q: 1000 };
GL.w0 = TAU * GL.f0; GL.tau = GL.Q / (Math.PI * GL.f0);
const STRENGTHS = [110, 107.5, 113, 104.6, 109, 115, 106.2, 111.5, 108, 114, 105.4, 112];

const MX = 40, GX = 80;
const VIEWS = {
  tacoma: { pos: [0, 7.5, 11.0], target: [0, 2.1, 0] },
  microwave: { pos: [MX - 0.8, 4.2, 11.6], target: [MX - 0.8, 3.7, 0] },
  glass: { pos: [GX - 0.8, 4.2, 11.6], target: [GX - 0.8, 3.7, 0] },
};

export default {
  id: 'limits',
  short: 'Myths and limits',
  title: 'Three famous “resonance” stories, checked',
  subtitle: 'A bridge that fell, an oven that heats and a singer who breaks a glass.',
  view: VIEWS.tacoma,
  learn: `<p>Resonance is such a good story that it gets the credit for things it did not do. It also has limits of its own: the tidy formulas hold only for <b>small</b> swings (the pendulum in chapter 2 slows down at big ones), and no real swing grows forever, because damping or breakage always steps in.</p>
    <p><b>Myth 1: “Tacoma Narrows fell because the wind hit its resonant frequency.”</b> The bridge did tear itself apart on 7 November 1940, twisting 12 times a minute in a steady 64 km/h wind. But a steady wind has no rhythm to match. The girders did shed whirlpools of air, at about one a second: more than four times too fast. What happened is <b>aeroelastic flutter</b>. Once the deck twisted, the wind pushed on the tilted deck in a way that twisted it <b>further</b>, in step with its own motion. The bridge fed itself. Engineers call it negative damping, and it has an onset wind speed, not a matching frequency. (A 1991 paper by Billah and Scanlan set the textbooks straight.)</p>
    <p><b>Myth 2: “A microwave oven is tuned to the resonance of water.”</b> It is not. In liquid water the molecules are jostled too much to ring. They turn to follow the oven’s field, lag behind it, and the lag makes heat: <b>dielectric heating</b>, which works over a huge range of frequencies. Water absorbs most strongly near <b>20 GHz</b>, eight times higher than an oven’s <b>2.45 GHz</b>. That is deliberate. At 20 GHz the waves would be soaked up in the first millimetre and your dal would be scorched outside and cold inside. At 2.45 GHz they reach about 2 cm in (see ${link('microwaveclear', 'MicrowaveClear')}).</p>
    <p><b>Myth 3: “An opera singer can shatter a wine glass.”</b> This one is <b>true, but only just</b>. A glass does resonate, at the note it rings when tapped, and it is very choosy: the pitch must be right to within a fraction of a hertz and held for a second or so. Even then it needs about 100 decibels or more right at the rim, and a glass with a lucky flaw. With an amplifier it is a standard demonstration. With the bare voice, the first known film of it was made in 2005, and the singer needed a dozen glasses to find one that would break. Stories about Caruso doing it were denied by his own wife.</p>
    <p class="tip"><b>Try it:</b> raise the wind past the onset speed and watch the twist grow by itself. Slide the oven’s frequency up to 20 GHz and see how shallow the heating becomes. Then try to break a glass at 100 dB: tune first, then try a new glass.</p>`,
  terms: [
    { t: 'Aeroelastic flutter', d: 'A self-feeding vibration in which air forces grow with the structure’s own motion, above a critical wind speed.' },
    { t: 'Self-excitation', d: 'A system drawing energy from a steady source (wind, a violin bow) to keep itself vibrating. No rhythmic push is needed.' },
    { t: 'Vortex shedding', d: 'Whirlpools of air peeling off a blunt object at a steady rate that rises with wind speed.' },
    { t: 'Dielectric heating', d: 'Heating by an alternating electric field that makes polar molecules turn and lag. It is a relaxation, not a resonance.' },
    { t: 'Penetration depth', d: 'How far microwaves get into food before most of their power has been absorbed.' },
    { t: 'Small-angle limit', d: 'The condition under which a pendulum, or any oscillator, obeys the simple formulas.' },
  ],
  defaults: { focus: 'tacoma', U: 30, gf: 2.45, pitch: -3, db: 100 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'tacoma', label: 'Tacoma Narrows' }, { v: 'microwave', label: 'Microwave oven' }, { v: 'glass', label: 'Singer and glass' }] },
    { key: 'U', type: 'range', label: 'Bridge: steady wind speed', min: 0, max: 100, step: 1, ends: ['calm', '100 km/h'], fmt: (v) => `${v} km/h (${(v / 1.609).toFixed(0)} mph)` },
    { key: 'tb', type: 'buttons', label: 'Bridge', items: [
      { label: 'The wind that day: 64 km/h', act: (s) => { s.focus = 'tacoma'; s.U = 64; } },
      { label: 'Rebuild the bridge', act: (s, inst) => { s.focus = 'tacoma'; s.U = 30; inst.rebuild(); } },
    ] },
    { key: 'gf', type: 'log', label: 'Oven: frequency of the waves', min: 0.5, max: 60, ends: ['0.5 GHz', '60 GHz'], fmt: (v) => `${v.toPrecision(3)} GHz · reaches ${fmtLen(water(v).Dp / 100)}` },
    { key: 'mb', type: 'buttons', label: 'Oven', items: [
      { label: 'Kitchen oven: 2.45 GHz', act: (s) => { s.focus = 'microwave'; s.gf = 2.45; } },
      { label: 'Industrial: 915 MHz', act: (s) => { s.focus = 'microwave'; s.gf = 0.915; } },
      { label: 'Water’s strongest absorption', act: (s) => { s.focus = 'microwave'; s.gf = W.fr; } },
    ] },
    { key: 'pitch', type: 'range', label: 'Glass: your pitch, compared with its note', min: -6, max: 6, step: 0.05, ends: ['6 Hz flat', '6 Hz sharp'], fmt: (v) => `${(GL.f0 + v).toFixed(2)} Hz${Math.abs(v) < 0.2 ? ' · on the note' : ''}` },
    { key: 'db', type: 'range', label: 'Glass: loudness at the rim', min: 80, max: 120, step: 1, ends: ['80 dB', '120 dB, amplified'], fmt: (v) => `${v} dB${v > 106 ? ' (needs an amplifier)' : v >= 100 ? ' (a trained voice, very close)' : ''}` },
    { key: 'gb', type: 'buttons', label: 'Glass', items: [
      { label: 'Tap it (hear its note)', act: (s) => { s.focus = 'glass'; tone([[GL.f0, 0.08, 1.8], [GL.f0 * 2.3, 0.02, 0.6]]); } },
      { label: 'Tune to its note', act: (s) => { s.focus = 'glass'; s.pitch = 0; } },
      { label: 'New glass', act: (s, inst) => { s.focus = 'glass'; inst.newGlass(); } },
    ] },
  ],
  onChange(s, key) {
    if (key === 'U') s.focus = 'tacoma';
    if (key === 'gf') s.focus = 'microwave';
    if (key === 'pitch' || key === 'db') s.focus = 'glass';
  },
  quiz: [
    { q: 'What destroyed the Tacoma Narrows Bridge in 1940?', options: ['Gusts that arrived at its resonant frequency', 'Aeroelastic flutter: the steady wind fed the deck’s own twisting', 'An earthquake', 'Soldiers marching in step'], answer: 1, why: 'The wind was steady, with no rhythm to match. Above a critical speed the air forces grew with the deck’s own twist and pumped energy into it: a self-excited flutter, not forced resonance.' },
    { q: 'Why do microwave ovens use 2.45 GHz rather than the frequency water absorbs best (about 20 GHz)?', options: ['2.45 GHz is water’s resonant frequency', 'At 20 GHz the waves would be absorbed in the outer millimetre, leaving the middle cold', '20 GHz would not heat water at all', 'It makes no difference'], answer: 1, why: 'Heating in liquid water is a broad relaxation, not a resonance. A lower frequency is absorbed less strongly, so it reaches a couple of centimetres into the food.' },
    { q: 'To break a wine glass with your bare voice you would need…', options: ['any loud note', 'the glass’s exact note, held steadily, very loud, and a glass with a helpful flaw', 'a very low note', 'it is physically impossible'], answer: 1, why: 'The glass answers only within a fraction of a hertz of its own note, needs a second or so to build up, and even then only some glasses give way at about 100 to 105 dB. It has been filmed, but rarely.' },
  ],
  reel: [
    { ms: 5800, caption: 'Myth: Tacoma Narrows fell to resonance. A steady wind fed the deck’s own twist: flutter.', set: { focus: 'tacoma' }, act: (s, inst) => inst.rebuild(), anim: { U: [50, 95] }, view: { pos: [0, 9.6, 9.6], target: [0, 5.8, 0] }, spin: 0 },
    { ms: 5000, caption: 'Myth: ovens hit water’s resonance. Water absorbs best near 20 GHz. Ovens use 2.45, to reach deeper.', set: { focus: 'microwave' }, anim: { gf: [2.45, 19.2, true] }, view: { pos: [MX + 2.5, 7.2, 9.0], target: [MX + 2.5, 7.0, 0] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    let cur = { ...s0 }, lastFocus = null, drawT = 0;
    const gT = new THREE.Group(), gM = new THREE.Group(), gGo = new THREE.Group(), gG = new THREE.Group(); root.add(gT, gM, gGo); gM.position.x = MX; gGo.position.x = GX;
    gG.scale.setScalar(0.74); gG.position.x = 0.1; gGo.add(gG);

    // ================================================================ Tacoma
    const SPAN = 10.4, NS = 44, DY = 2.6, TWR = 4.3, DW = 1.3;
    const water3 = new THREE.Mesh(new THREE.PlaneGeometry(18, 5), M.clear(0x2a6fb0, 0.35, { roughness: 0.3 })); water3.rotation.x = -Math.PI / 2; water3.position.y = 0.05; gT.add(water3);
    const steelG = M.matte(0x6d8a78);
    for (const x of [-SPAN / 2, SPAN / 2]) for (const z of [-DW / 2 - 0.05, DW / 2 + 0.05]) gT.add(beam([x, 0, z], [x, TWR, z], 0.09, steelG));
    for (const x of [-SPAN / 2, SPAN / 2]) for (const y of [DY - 0.5, TWR - 0.2, 3.5]) gT.add(beam([x, y, -DW / 2 - 0.05], [x, y, DW / 2 + 0.05], 0.05, steelG));
    const deck = []; for (let i = 0; i < NS; i++) { const g = new THREE.Group(); const slab = box(SPAN / NS * 1.03, 0.05, DW, M.matte(0x9aa3b2)); const g1 = box(SPAN / NS * 1.03, 0.16, 0.04, steelG), g2 = g1.clone(); g1.position.z = -DW / 2; g2.position.z = DW / 2; g.add(slab, g1, g2); gT.add(g); deck.push({ g, vy: 0, fell: false }); }
    const cabY = (u) => DY + 0.35 + (TWR - DY - 0.35) * (2 * u - 1) ** 2;
    const cablesT = [-1, 1].map((sg) => { const l = liveLine(NS + 1, 0xdfe6ef); gT.add(l); return { l, sg }; });
    const hang = [-1, 1].map((sg) => { const pos = new Float32Array(NS * 6), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xaab4c2, transparent: true, opacity: 0.6 })); l.frustumCulled = false; gT.add(l); return { pos, geo, sg }; });
    const NW = 70, wind = swarm(NW, new THREE.BoxGeometry(0.02, 0.02, 0.5), M.glow(0xbfe6ff, { transparent: true, opacity: 0.55 })); wind.frustumCulled = false; wind.castShadow = false; gT.add(wind);
    const wp = Array.from({ length: NW }, (_, i) => ({ x: -SPAN / 2 + ((i * 0.618) % 1) * SPAN, y: 1.4 + ((i * 0.37) % 1) * 3.2, z: -4 + ((i * 0.77) % 1) * 8 }));
    const lTac = stage.label('', [3.3, TWR + 1.3, 0], gT, 'hot');
    const tst = { x: 0.002, v: 0, t: 0 }; let tA = 0.002, held = 0, broken = false, fallT = 0, tHist = [], tClock = 0;
    const rebuild = () => { tst.x = 0.002; tst.v = 0; tA = 0.002; held = 0; broken = false; fallT = 0; tHist = []; deck.forEach((d) => { d.fell = false; d.vy = 0; d.g.visible = true; }); };
    const tBoard = board(root, 6.5, 2.9, 830, 370, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur;
      title(g, 'Is it resonance?', '');
      const a = axes(g, w, h, { x0: 66, x1: 400, y1: 66, y0: h - 58, xMax: 100, yMax: 1.5, xTicks: [0, 25, 50, 75, 100], yTicks: [0, 0.5, 1, 1.5], xFmt: (v) => v + '', yFmt: (v) => v + ' Hz', xLabel: 'wind, km/h →' });
      clip(g, a, () => {
        g.fillStyle = 'rgba(255,90,90,.12)'; g.fillRect(a.X(TN.Uc), a.y1, a.x1 - a.X(TN.Uc), a.y0 - a.y1);
        line(g, [[0, 0], [100, fVortex(100)]], a.X, a.Y, COL.line, 3.5);
        line(g, [[0, TN.f0], [100, TN.f0]], a.X, a.Y, COL.drive, 3.5);
      });
      text(g, 'whirlpools shed', a.X(4), a.Y(1.32), COL.line, '16px sans-serif'); text(g, 'by the girder', a.X(4), a.Y(1.32) + 19, COL.line, '16px sans-serif');
      text(g, 'deck’s twist: 0.2 Hz', a.X(3), a.Y(TN.f0) + 22, COL.drive, '16px sans-serif');
      text(g, 'flutter', a.X(TN.Uc) + 8, a.y0 - 10, COL.hot, 'bold 17px sans-serif');
      line(g, [[s.U, 0], [s.U, 1.5]], a.X, a.Y, 'rgba(255,255,255,.5)', 2);
      dot(g, a.X(s.U), a.Y(Math.min(1.5, fVortex(s.U))), COL.line, 8); dot(g, a.X(s.U), a.Y(TN.f0), COL.drive, 8);
      // right: the twist against time
      const WIN = 120, b = axes(g, w, h, { x0: 486, x1: w - 24, y1: 66, y0: h - 58, xMin: -WIN, xMax: 0, yMax: 40, xTicks: [-120, -80, -40, 0], yTicks: [0, 10, 20, 30, 40], xFmt: (v) => (v ? v + ' s' : 'now'), yFmt: (v) => v + '°' });
      text(g, 'Twist of the deck, each way', 486, 34, COL.text, 'bold 20px sans-serif');
      clip(g, b, () => { line(g, [[-WIN, 30], [0, 30]], b.X, b.Y, 'rgba(255,90,90,.6)', 2, [6, 5]); line(g, tHist.map(([t, A]) => [t - tClock, Math.min(40, A / DEG)]), b.X, b.Y, COL.warm, 3.5); });
      text(g, 'breaks', b.x0 + 8, b.Y(30) - 8, COL.hot, '15px sans-serif');
    }, [0, 1.5, 4.4]);
    tBoard.mesh.rotation.x = -0.45;

    // ================================================================ microwave
    const SL = { w: 4.8, h: 4.2, d: 3.0, x: 2.5, y: 2.6 }, NSL = 42, YT = 2.6 + 2.1;
    const tank = new THREE.Mesh(new THREE.BoxGeometry(SL.w + 0.2, SL.h + 0.1, SL.d + 0.2), M.clear(0xcfe8ff, 0.12)); tank.position.set(SL.x, SL.y, 0); gM.add(tank);
    const tankE = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SL.w + 0.2, SL.h + 0.1, SL.d + 0.2)), new THREE.LineBasicMaterial({ color: 0x9fb4c8 })); tankE.position.copy(tank.position); gM.add(tankE);
    const slices = []; for (let i = 0; i < NSL; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(SL.w, SL.h / NSL, SL.d), new THREE.MeshBasicMaterial({ color: 0x2a6fb0, transparent: true, opacity: 0.55, depthWrite: false })); m.position.set(SL.x, YT - ((i + 0.5) * SL.h) / NSL, 0); gM.add(m); slices.push(m); }
    const tableM = box(6.2, 0.2, 4.4, M.matte(0x2b3039)); tableM.position.set(SL.x, 0.3, 0); gM.add(tableM);
    const waveIn = liveLine(160, 0xffb547, 1, 0.03); gM.add(waveIn);
    const depthBar = box(0.14, 1, 0.14, M.glow(0xffffff)); gM.add(depthBar);
    // three water molecules that try to follow the field and lag behind it
    const mols = [0, 1, 2].map((i) => { const g = new THREE.Group(); const o = sphere(0.3, M.plastic(0xff5a5a)); const h1 = sphere(0.19, M.plastic(0xf2f4f8)), h2 = h1.clone(); h1.position.set(0.3, 0.24, 0); h2.position.set(-0.3, 0.24, 0); g.add(o, h1, h2); g.position.set(1.9 + i * 1.15, 6.3, 0); gM.add(g); return g; });
    const fieldArr = strut(0.035, M.glow(0xffb547)); gM.add(fieldArr);
    const lMol = stage.label('', [2.6, 7.6, 0], gM);
    const lWater = stage.label('', [SL.x, -0.25, 1.6], gM, 'hot');
    const mBoard = board(root, 6.2, 4.3, 620, 430, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur;
      const a = axes(g, w, h, { x0: 62, y1: 76, xMin: 0.3, xMax: 300, yMax: 85, xLog: true, xTicks: [0.3, 1, 3, 10, 30, 100, 300], yTicks: [0, 20, 40, 60, 80], xFmt: (v) => v + '', yFmt: String, xLabel: 'frequency, GHz →', yLabel: 'water at 25 °C' });
      title(g, 'How water answers microwaves', '');
      const { X, Y } = a;
      clip(g, a, () => {
        curve(g, (f) => water(f).e1, 0.3, 300, X, Y, 'rgba(142,240,255,.75)', 3, null, 200, true);
        curve(g, (f) => water(f).e2, 0.3, 300, X, Y, COL.warm, 4, null, 200, true);
        // what a true resonance with the same peak would look like (Q = 20): a spike
        curve(g, (f) => (36.6 * gain(f / W.fr, 1 / 40)) / 20, 0.3, 300, X, Y, 'rgba(255,255,255,.35)', 2, [5, 5], 400, true);
      });
      text(g, 'how much it stores', X(0.36), Y(78) + 22, COL.line, '15px sans-serif');
      text(g, 'how much it absorbs', X(24), Y(40), COL.warm, 'bold 15px sans-serif');
      text(g, 'a real resonance', X(26), Y(27), 'rgba(255,255,255,.6)', '14px sans-serif'); text(g, 'would be a spike', X(26), Y(27) + 17, 'rgba(255,255,255,.6)', '14px sans-serif');
      for (const [f, name] of [[0.915, '915 MHz'], [2.45, 'oven 2.45']]) { line(g, [[f, 0], [f, 85]], X, Y, 'rgba(255,181,71,.6)', 2, [6, 5]); g.save(); g.translate(X(f) - 6, a.y1 + 6); g.rotate(-Math.PI / 2); text(g, name, -g.measureText(name).width - 44, 0, COL.drive, '14px sans-serif'); g.restore(); }
      line(g, [[s.gf, 0], [s.gf, 85]], X, Y, 'rgba(255,255,255,.5)', 2);
      dot(g, X(s.gf), Y(water(s.gf).e2), COL.warm, 9);
    }, [MX - 3.9, 2.55, 0]);

    // ================================================================ glass
    const tableG = box(9, 0.3, 4.4, M.matte(0x5a3a22)); tableG.position.set(2.2, 0.15, 0); gG.add(tableG);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0.32, roughness: 0.05, side: THREE.DoubleSide, clearcoat: 1, depthWrite: false });
    const glass = new THREE.Group(); glass.position.set(1.2, 0.3, 0); gG.add(glass);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.25, 0.1, 48), glassMat); foot.position.y = 0.05; glass.add(foot);
    const stemG = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 2.6, 16), glassMat); stemG.position.y = 1.4; glass.add(stemG);
    const bp = []; for (let i = 0; i <= 24; i++) { const t = i / 24; bp.push(new THREE.Vector2(0.14 + 1.3 * Math.sin(Math.min(1, t * 1.25) * Math.PI / 2) - 0.22 * Math.max(0, t - 0.8), 2.7 + t * 3.4)); }
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(bp, 48), glassMat); glass.add(bowl);
    const bowlBase = Float32Array.from(bowl.geometry.attributes.position.array);
    const rimL = liveLine(65, 0xcfefff); glass.add(rimL);
    const shards = [];
    for (let i = 0; i < 36; i++) { const g = new THREE.BufferGeometry(), sz = 0.2 + (((i * 37) % 10) / 10) * 0.35; g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, sz, 0.1, 0, 0.1, sz, 0.05], 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.6, side: THREE.DoubleSide })); m.visible = false; gG.add(m); shards.push({ m, p: new THREE.Vector3(), v: new THREE.Vector3() }); }
    // the singer: a head with an open mouth, and arcs of sound
    const head = sphere(0.75, M.plastic(0xf0c8a0)); head.position.set(5.0, 5.6, 0); gG.add(head);
    const mouth = sphere(0.22, M.matte(0x3a1010)); mouth.position.set(4.32, 5.4, 0); mouth.scale.set(0.5, 1, 1); gG.add(mouth);
    const torso = beam([5.2, 0.3, 0], [5.2, 4.7, 0], 0.7, M.plastic(0x3d7bd9)); gG.add(torso);
    const arcs = [0, 1, 2].map(() => { const t = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 6, 40, Math.PI * 0.5), M.ghost(0xffb547, 0.6)); t.rotation.z = Math.PI * 0.75; gG.add(t); return t; });
    const lGlass = stage.label('', [1.6, -0.5, 2.3], gG, 'hot');
    const lSing = stage.label('', [5.0, 6.9, 0], gG);
    const gst = { x: 0, v: 0, t: 0 }; let gph = 0, gA = 0, gBroken = false, gi = 0, gT2 = 0, peakRel = 0;
    const flex = (s) => (gA / GL.Q) * Math.pow(10, (s.db - 105) / 20);        // rim flex, in units of "105 dB held on the note"
    const limit = () => Math.pow(10, (STRENGTHS[gi % STRENGTHS.length] - 105) / 20);
    const newGlass = () => { gi++; gBroken = false; gst.x = 0; gst.v = 0; gA = 0; peakRel = 0; bowl.visible = rimL.visible = true; shards.forEach((s) => (s.m.visible = false)); };
    const smash = () => { gBroken = true; bowl.visible = rimL.visible = false; shards.forEach((s, i) => { const a = (i / shards.length) * TAU * 3, y = 3 + (i % 10) * 0.33; s.p.set(Math.cos(a) * 1.1, y + 0.3, Math.sin(a) * 1.1); s.v.set(Math.cos(a) * (0.8 + (i % 4) * 0.5), 2 + (i % 3), Math.sin(a) * (0.6 + (i % 5) * 0.3)); s.m.visible = true; }); tone([[2400, 0.05, 0.25], [3900, 0.04, 0.2], [5200, 0.03, 0.3]]); };
    const gBoard = board(root, 6.2, 4.3, 620, 430, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, lvl = Math.pow(10, (s.db - 105) / 20);
      const a = axes(g, w, h, { x0: 70, y1: 76, xMin: -6, xMax: 6, yMax: 4, xTicks: [-6, -4, -2, 0, 2, 4, 6], yTicks: [0, 1, 2, 3, 4], xFmt: (v) => (v > 0 ? '+' : '') + v, yFmt: (v) => v + '×', xLabel: 'Hz from its note →', yLabel: 'flex of the rim (1× = 105 dB on the note) ↑' });
      title(g, 'The glass answers one pitch', `Q ≈ 1,000 · ${s.db} dB`);
      const { X, Y } = a;
      clip(g, a, () => {
        g.fillStyle = 'rgba(255,90,90,.12)'; g.fillRect(a.x0, Y(Math.pow(10, 11 / 20)), a.x1 - a.x0, Y(Math.pow(10, -1 / 20)) - Y(Math.pow(10, 11 / 20)));
        curve(g, (d) => (lvl * gain(1 + d / GL.f0, 1 / (2 * GL.Q))) / GL.Q, -6, 6, X, Y, COL.line, 3.5, null, 600);
      });
      text(g, 'breaks somewhere in this band (hidden flaws)', a.x0 + 8, Y(Math.pow(10, 11 / 20)) + 20, COL.hot, '15px sans-serif');
      line(g, [[s.pitch, 0], [s.pitch, 4]], X, Y, 'rgba(255,181,71,.4)', 2);
      dot(g, X(s.pitch), Y(Math.min(4, flex(s))), COL.drive, 10);
      text(g, 'line: formula  ● stepped', 70, h - 12, 'rgba(255,255,255,.6)', '15px sans-serif');
    }, [GX - 3.9, 2.55, 0]);

    return {
      rebuild, newGlass,
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lMol, lSing]);
        gT.visible = tBoard.mesh.visible = s.focus === 'tacoma'; gM.visible = mBoard.mesh.visible = s.focus === 'microwave'; gG.visible = gBoard.mesh.visible = s.focus === 'glass';
        if (s.focus !== lastFocus) { if (lastFocus !== null) focusView(stage, VIEWS, s.focus); lastFocus = s.focus; }
        reelPlace([[tBoard, [0, 9.0, -2.4], 1.48], [mBoard, [MX + 2.5, 11.6, 0], 1.3], [gBoard, [GX + 2.2, 9.6, 0], 1.0]]);
        tBoard.mesh.rotation.x = inReel() ? -0.3 : -0.45;
        cur = { ...s };
        if (s.focus === 'tacoma') {
          const T = dt * TN.speed; tClock += T;
          if (!broken) {
            // tiny gust torque so there is something for the flutter to amplify
            advance(tst, T, 0.02, (t, x, v) => -TN.w0 * TN.w0 * x - 2 * zTac(s.U, tA) * TN.w0 * v + 3e-3 * (s.U / 60) ** 2 * (Math.cos(0.5 * t) + Math.cos(0.83 * t + 1) + Math.cos(2.1 * t + 2.2)), (q) => { const e = Math.hypot(q.x, q.v / TN.w0); tA += (e - tA) * 0.05; });
            if (tA > TN.fail) held += T; else held = Math.max(0, held - T);
            if (held > 10) { broken = true; fallT = 0; }
          } else { fallT += dt; tst.x *= Math.exp(-dt * 0.8); tA *= Math.exp(-dt * 0.8); }
          tHist.push([tClock, tA]); while (tHist.length && tHist[0][0] < tClock - 125) tHist.shift();
          // second torsional mode: one node at mid-span, as on the day
          deck.forEach((d, i) => {
            const u = (i + 0.5) / NS, th = tst.x * Math.sin(TAU * u);
            if (broken && u > 0.3 && u < 0.72) { d.vy -= 9 * dt * (0.6 + Math.sin(i * 1.7) * 0.3); d.g.position.y += d.vy * dt; d.g.rotation.x += dt * (1 + (i % 3)); if (d.g.position.y < 0.1) d.g.visible = false; }
            else { d.g.position.set(-SPAN / 2 + u * SPAN, DY, 0); d.g.rotation.x = th; }
          });
          cablesT.forEach(({ l, sg }) => l.set((u) => [-SPAN / 2 + u * SPAN, cabY(u), sg * DW / 2]));
          hang.forEach(({ pos, geo, sg }) => {
            for (let i = 0; i < NS; i++) { const u = (i + 0.5) / NS, d = deck[i], th = d.g.rotation.x, x = -SPAN / 2 + u * SPAN, gone = broken && u > 0.3 && u < 0.72; pos.set([x, cabY(u), sg * DW / 2, x, gone ? cabY(u) - 0.25 : DY + sg * (DW / 2) * Math.sin(th), sg * (DW / 2) * Math.cos(th)], i * 6); }
            geo.attributes.position.needsUpdate = true;
          });
          for (let i = 0; i < NW; i++) { const p = wp[i]; p.z += dt * (0.3 + s.U * 0.06); if (p.z > 4) p.z = -4; wind.place(i, [p.x, p.y, p.z], null, s.U > 1 ? 1 : 0.001); }
          wind.done();
          const zn = zTac(s.U, 0);
          lTac.element.innerHTML = (broken ? '<b>the centre span has fallen</b>' : `twist <b>±${(tA / DEG).toFixed(tA < 2 * DEG ? 1 : 0)}°</b> · ${zn < 0 ? 'growing by itself' : 'dying away'}`) + (narrow ? '' : '<br><small>steady wind across the deck · deck not to scale · time-lapse ×10</small>');
        } else if (s.focus === 'microwave') {
          const wv = water(s.gf), Dp = wv.Dp, t = (gT2 += dt);
          // each layer glows with the power absorbed there: the waves come in from above
          slices.forEach((m, i) => { const xl = ((i + 0.5) / NSL) * SL.h, p = Math.exp(-xl / Dp); m.material.color.setRGB(0.16 + 0.84 * p, 0.43 - 0.1 * p + 0.2 * p * p, 0.69 * (1 - p) + 0.1); m.material.opacity = 0.35 + 0.5 * p; });
          // the wave: wavelength λ in air, λ ÷ √ε' in water, fading with the field's depth 2 D_p
          const y0 = YT + 2.4, k0 = TAU / wv.lam, kw = k0 * Math.sqrt(wv.e1), dShow = Math.min(Dp, SL.h);
          waveIn.set((u) => { const y = y0 - u * (2.4 + SL.h), inside = y < YT; const ph = inside ? k0 * 2.4 + kw * (YT - y) : k0 * (y0 - y); const amp = inside ? 0.6 * Math.exp(-(YT - y) / (2 * Dp)) : 0.6; return [1.5 + amp * Math.sin(ph - t * 5), y, SL.d / 2 + 0.2]; });
          depthBar.scale.y = dShow; depthBar.position.set(SL.x - SL.w / 2 - 0.3, YT - dShow / 2, SL.d / 2 + 0.2);
          // molecules: the field swings, the dipoles follow with a lag δ, tan δ = f ÷ f_r, and with a
          // smaller swing, 1 ÷ √(1 + (f ÷ f_r)²): Debye's picture
          const lag = Math.atan(s.gf / W.fr), follow = 1 / Math.sqrt(1 + (s.gf / W.fr) ** 2), ph = t * 3.2;
          mols.forEach((g, i) => { g.rotation.z = 0.95 * follow * Math.sin(ph - lag) + 0.06 * Math.sin(t * 7 + i * 2); });
          const fa = 0.95 * Math.sin(ph); fieldArr.set([5.1, 5.9, 0], [5.1 - 0.9 * Math.sin(fa), 5.9 + 0.9 * Math.cos(fa), 0]);
          lMol.element.innerHTML = `molecules trail the field by <b>${(lag / DEG).toFixed(0)}°</b>`;
          lWater.element.innerHTML = `most heat in the top <b>${fmtLen(Dp / 100)}</b> (white bar)`;
        } else {
          const w = TAU * (GL.f0 + s.pitch), ph0 = gph, t0 = gst.t, T = Math.min(dt, 0.05);
          if (!gBroken) {
            advance(gst, T, 3.5e-5, (t, x, v) => GL.w0 * GL.w0 * (Math.cos(ph0 + w * (t - t0)) - x) - (GL.w0 / GL.Q) * v, null);
            gph = (ph0 + w * T) % TAU;
            // the ringing part of the motion: subtract the bit that simply follows the push
            const e = Math.hypot(gst.x - Math.cos(gph), gst.v / GL.w0 + Math.sin(gph) * (w / GL.w0)); gA += (e - gA) * Math.min(1, dt * 20);
            peakRel = Math.max(peakRel, flex(s));
            if (flex(s) > limit()) smash();
          } else shards.forEach((sh) => { sh.v.y -= 9.8 * dt * 0.6; sh.p.addScaledVector(sh.v, dt); if (sh.p.y < 0.35) { sh.p.y = 0.35; sh.v.set(0, 0, 0); } sh.m.position.set(1.2 + sh.p.x, sh.p.y, sh.p.z); });
          gT2 += dt;
          // the rim's lowest mode: it squeezes to an ellipse one way, then the other (drawn huge, and slowed)
          const a = clamp(flex(s), 0, 3.6) * 0.045 * Math.sin(gT2 * TAU * 2.4);
          const pos = bowl.geometry.attributes.position.array;
          for (let i = 0; i < pos.length; i += 3) { const hgt = clamp((bowlBase[i + 1] - 2.7) / 3.4, 0, 1), k = a * hgt * hgt; pos[i] = bowlBase[i] * (1 + k); pos[i + 2] = bowlBase[i + 2] * (1 - k); }
          bowl.geometry.attributes.position.needsUpdate = true;
          const rr = bp[24].x; rimL.set((u) => [rr * (1 + a) * Math.cos(u * TAU), 6.1, rr * (1 - a) * Math.sin(u * TAU)]);
          const loud = clamp((s.db - 78) / 42, 0.05, 1);
          arcs.forEach((r, i) => { const k = ((gT2 * 0.8 + i / 3) % 1); r.position.set(4.2 - k * 2.2, 5.4, 0); r.scale.setScalar(0.35 + k * 1.1); r.material.opacity = (1 - k) * 0.75 * loud; });
          mouth.scale.set(0.5, 0.5 + loud * 0.9, 0.6 + loud * 0.5);
          lGlass.element.innerHTML = gBroken ? `<b>smashed</b> at ${s.db} dB` : `rim flex <b>${flex(s).toFixed(2)}×</b>`;
          lSing.element.innerHTML = `${(GL.f0 + s.pitch).toFixed(2)} Hz · ${s.db} dB`;
        }
        drawT += dt; if (drawT > 1 / 20 || inReel()) { drawT = 0; (s.focus === 'tacoma' ? tBoard : s.focus === 'microwave' ? mBoard : gBoard).redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'tacoma') {
          const zn = zTac(s.U, 0), fv = fVortex(s.U);
          return sheet(broken ? 'The deck has torn itself apart' : zn < 0 ? 'Flutter: the wind feeds the twist' : 'Stable: twists die away', [
            ['Wind (steady, no rhythm)', `${s.U} km/h`],
            ['Twist now', `±${(tA / DEG).toFixed(1)}° at 0.20 Hz`],
            ['Whirlpools shed at', `${fv.toFixed(2)} Hz, ${(fv / TN.f0).toFixed(1)} × the twist rate`],
            ['Net damping (model)', zn < 0 ? `${(zn * 100).toFixed(1)} %: twist doubles every ${(Math.LN2 / (-zn * TN.w0)).toFixed(0)} s` : `+${(zn * 100).toFixed(2)} %: flutter starts at ${TN.Uc} km/h`],
          ], '');
        }
        if (s.focus === 'microwave') {
          const wv = water(s.gf), lag = Math.atan(s.gf / W.fr);
          return sheet(`${s.gf.toPrecision(3)} GHz reaches ${fmtLen(wv.Dp / 100)} into water`, [
            ['Absorbing strength, ε″', `${wv.e2.toFixed(1)} (peak ${((W.es - W.einf) / 2).toFixed(1)} at ${W.fr} GHz)`],
            ['Wavelength in air · in water', `${fmtLen(wv.lam / 100)} · ${fmtLen(wv.lam / 100 / Math.sqrt(wv.e1))}`],
            ['Storing strength, ε′', wv.e1.toFixed(1)],
            ['Molecules lag the field by', `${(lag / DEG).toFixed(0)}°`],
            ['Power left 1 cm in', `${(Math.exp(-1 / wv.Dp) * 100).toFixed(0)} %`],
          ], Math.abs(s.gf - 2.45) < 0.2 ? 'The kitchen choice: weakly absorbed on purpose, so the heat gets inside.' : s.gf > 10 ? 'Strong absorption, but only skin deep: a scorched outside and a cold middle.' : 'A broad hump, not a sharp peak: heating works over a wide range of frequencies.');
        }
        const d = s.pitch, g1 = gain(1 + d / GL.f0, 1 / (2 * GL.Q)) / GL.Q, lvl = Math.pow(10, (s.db - 105) / 20);
        return sheet(gBroken ? `Glass ${gi + 1} broke` : `Glass ${gi + 1}: rim flex ${flex(s).toFixed(2)}×`, [
          ['Your pitch', `${(GL.f0 + d).toFixed(2)} Hz, ${Math.abs(d) < 0.03 ? 'on its note' : Math.abs(d).toFixed(2) + ' Hz ' + (d > 0 ? 'sharp' : 'flat')}`],
          ['Steady flex by the formula', `${(g1 * lvl).toFixed(2)}×`],
          ['Its note · width of its peak', `660 Hz · ${(GL.f0 / GL.Q).toFixed(2)} Hz`],
          ['This glass breaks at', gBroken ? `${STRENGTHS[gi % STRENGTHS.length].toFixed(1)} dB on the note` : 'unknown until it does'],
        ], gBroken ? 'Press “New glass”. The next one may be much tougher.' : `1× is the flex from 105 dB held on the note for ${GL.tau.toFixed(1)} s or more. About one glass in twelve here breaks at that.`);
      },
    };
  },
};
