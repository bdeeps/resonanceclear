// Chapter 2: the pendulum and the playground swing.
// "pendulum" (1 unit = 25 cm): a bob on a light string, released from rest. Stepped with RK4:
//   θ'' = −(g ÷ L) sin θ − 2ζω₀ θ',  ω₀ = √(g ÷ L),  ζ = 0.0003 (almost no friction).
//   For small swings sin θ ≈ θ, so the restoring force is m g θ = (m g ÷ L) × (distance along the arc):
//   gravity acts as a spring of stiffness k = m g ÷ L, and T = 2π √(m ÷ k) = 2π √(L ÷ g). The mass
//   cancels. The ghost bob follows that formula exactly; the real bob falls behind at big angles, where
//   T = T₀ (1 + θ₀²/16 + 11θ₀⁴/3072 + …) (the standard series for the simple pendulum).
//   A 0.994 m pendulum has T = 2.00 s: the "seconds pendulum" of a longcase clock (see ClockClear).
// "swing" (1 unit = 50 cm): a child on a swing is a pendulum (child and seat 30 kg, treated as a point
//   at the seat; the same nonlinear equation with ζ = 0.02, a guess for chains, bearings and air).
//   The pusher gives a short forward shove at a fixed rhythm: a force pulse 0.3 s wide (Gaussian,
//   σ = 0.12 s) of peak F newtons, i.e. an angular acceleration F ÷ (m L). Each shove adds about
//   Δθ = F σ √(2π) ÷ (m L ω₀) to the swing; in step with the swing the steady angle is roughly
//   Δθ ÷ (2πζ). The chart's dots are that equation stepped to its steady state for each push interval.
import { THREE, M, box, beam, sphere } from '../kit.js';
import {
  TAU, G, DEG, COL, bigSwing, advance, meter, rk4, strut, forceArrow, board, panelBg, axes, title, line, dot, ring, text, clip,
  fitNarrow, reelPlace, focusView, inReel, link, clamp, sheet,
} from '../reso.js';

const PU = 4, PIV = 6.6, PX = 3.2, PZETA = 0.0003;
const SU = 2, SX = 40, TOPS = 6.9, SM = 30, SZETA = 0.02, SIG = 0.12;
const T0 = (L) => TAU * Math.sqrt(L / G);
const VIEWS = {
  pendulum: { pos: [-0.4, 3.9, 11.4], target: [-0.4, 3.6, 0] },
  swing: { pos: [SX - 0.6, 4.2, 11.8], target: [SX - 0.6, 3.7, 0] },
};
// Pulse train: a forward shove centred on every multiple of Tp.
const pulse = (t, Tp) => { const u = t - Math.round(t / Tp) * Tp; return Math.exp(-0.5 * (u / SIG) ** 2); };
// Steady swing angle for pushes every Tp seconds, by stepping the swing until it settles.
function settleSwing(L, F, Tp) {
  const w0 = Math.sqrt(G / L), a0 = F / (SM * L), st = { x: 0, v: 0, t: 0 }, h = 0.03;
  const tEnd = 8 / (SZETA * w0), acc = (t, x, v) => -w0 * w0 * Math.sin(x) - 2 * SZETA * w0 * v + a0 * pulse(t, Tp);
  let hi = 0; const n = Math.ceil(tEnd / h), tail = tEnd - Math.max(2.2 * Tp, 2.2 * TAU / w0);
  for (let i = 0; i < n; i++) { rk4(st, h, acc); if (st.t > tail && Math.abs(st.x) > hi) hi = Math.abs(st.x); }
  return hi;
}

export default {
  id: 'swing',
  short: 'Pendulum and swing',
  title: 'A swing is a spring made of gravity',
  subtitle: 'The pendulum keeps the same beat as a mass on a spring, and a swing shows how to feed it.',
  view: VIEWS.pendulum,
  learn: `<p>A <b>pendulum</b> looks nothing like a mass on a spring, but it is the same idea. Pull the bob aside and gravity pulls it back, harder the further you pull. For small swings that pull is <b>proportional to the distance</b>, exactly like a spring of stiffness <b>m g ÷ L</b>. Put that into T = 2π √(m ÷ k) and the mass cancels: <b>T = 2π √(L ÷ g)</b>.</p>
    <p>So a pendulum’s beat depends only on its <b>length</b> and on <b>gravity</b>. A heavy bob and a light bob keep the same time. A pendulum 99.4 cm long takes exactly 2 seconds per swing, which is why tall clocks have metre-long pendulums (see ${link('clockclear', 'ClockClear')}).</p>
    <p>The “same time for any swing size” rule is only true for <b>small</b> swings. The pale bob follows the formula. Release the real bob from 20° and they stay together. Release it from 80° and the real one falls behind: big swings are <b>slower</b>, by about 14 % at 80°. That is where simple harmonic motion stops being simple.</p>
    <p>A <b>playground swing</b> is a pendulum with a child on it. To get it high you do not push hard, you push <b>in time</b>: one small shove each time the swing comes back. Each shove adds a few degrees, and friction takes a little away, until the two balance.</p>
    <p>Look at the chart of swing height against push rhythm. There is a tall peak when you push <b>once per swing</b>, a smaller one at <b>every second swing</b> and another at every third. But push <b>twice per swing</b> and one shove helps while the next one fights it: the swing goes nowhere.</p>
    <p class="tip"><b>Try it:</b> release the pendulum from 10°, then from 80°, and watch the pale bob pull ahead. Then go to the swing, press “Once per swing”, and try nudging the rhythm a little off.</p>`,
  terms: [
    { t: 'Simple pendulum', d: 'A small heavy bob on a light string. For small swings its period is T = 2π √(L ÷ g).' },
    { t: 'Restoring force', d: 'The force that pulls a system back to rest. For small swings of a pendulum it is m g ÷ L times the distance.' },
    { t: 'Isochronism', d: 'Keeping the same period whatever the size of the swing. True for a spring, nearly true for small pendulum swings.' },
    { t: 'Seconds pendulum', d: 'A pendulum about 99.4 cm long, whose swing one way takes one second.' },
    { t: 'In phase', d: 'Pushing in step with the motion, so every push adds energy instead of taking it away.' },
    { t: 'Subharmonic', d: 'Pushing once every two or three swings. It still works, because each push still arrives in step.' },
  ],
  defaults: { focus: 'pendulum', L: 1.0, pm: 0.2, th0: 20, sL: 2.0, F: 30, Tp: 2.2 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'pendulum', label: 'Pendulum' }, { v: 'swing', label: 'Playground swing' }] },
    { key: 'L', type: 'range', label: 'Pendulum: length', min: 0.25, max: 1.25, step: 0.005, ends: ['25 cm', '1.25 m'], fmt: (v) => `${(v * 100).toFixed(1)} cm · T = ${T0(v).toFixed(2)} s` },
    { key: 'th0', type: 'range', label: 'Pendulum: release angle', min: 5, max: 80, step: 1, ends: ['5°', '80°'], fmt: (v) => `${v}° · ${((bigSwing(v * DEG) - 1) * 100).toFixed(1)} % slower than the formula` },
    { key: 'pm', type: 'range', label: 'Pendulum: bob mass', min: 0.05, max: 1, step: 0.05, ends: ['50 g', '1 kg'], fmt: (v) => `${Math.round(v * 1000)} g (no effect on the period)` },
    { key: 'rel', type: 'buttons', label: 'Pendulum', items: [
      { label: 'Release again', act: (s, inst) => { s.focus = 'pendulum'; inst.release(); } },
      { label: 'Seconds pendulum (99.4 cm)', act: (s, inst) => { s.focus = 'pendulum'; s.L = 0.994; s.th0 = 5; inst.release(); } },
    ] },
    { key: 'Tp', type: 'range', label: 'Swing: push once every…', min: 1, max: 9, step: 0.01, ends: ['1 s', '9 s'], fmt: (v, s) => `${v.toFixed(2)} s = ${(v / T0(s.sL)).toFixed(2)} swings` },
    { key: 'rh', type: 'buttons', label: 'Swing: push rhythm', items: [
      { label: 'Once per swing', act: (s) => { s.focus = 'swing'; s.Tp = +T0(s.sL).toFixed(2); } },
      { label: 'Every second swing', act: (s) => { s.focus = 'swing'; s.Tp = +Math.min(9, 2 * T0(s.sL)).toFixed(2); } },
      { label: 'Twice per swing', act: (s) => { s.focus = 'swing'; s.Tp = +(T0(s.sL) / 2).toFixed(2); } },
      { label: 'Stop the swing', act: (s, inst) => { s.focus = 'swing'; inst.stop(); } },
    ] },
    { key: 'sL', type: 'range', label: 'Swing: chain length', min: 1.5, max: 3, step: 0.05, ends: ['1.5 m', '3 m'], fmt: (v) => `${v.toFixed(2)} m · T = ${T0(v).toFixed(2)} s` },
    { key: 'F', type: 'range', label: 'Swing: strength of each shove', min: 10, max: 50, step: 1, ends: ['10 N', '50 N'], fmt: (v) => `${v} N (about ${(v / G).toFixed(1)} kg of push)` },
  ],
  onChange(s, key) {
    if (key === 'L' || key === 'th0' || key === 'pm') s.focus = 'pendulum';
    if (key === 'Tp' || key === 'sL' || key === 'F') s.focus = 'swing';
  },
  quiz: [
    { q: 'You swap a pendulum’s light bob for one ten times heavier, keeping the length. The period…', options: ['gets ten times longer', 'gets about three times longer', 'stays the same', 'gets shorter'], answer: 2, why: 'T = 2π √(L ÷ g). The mass cancels: a heavier bob is pulled harder by gravity but is also harder to move, in exact proportion.' },
    { q: 'A pendulum is released from 80° instead of 10°. Compared with the formula, each swing takes…', options: ['exactly the same time', 'noticeably longer', 'noticeably shorter', 'half the time'], answer: 1, why: 'The formula assumes small swings. At big angles gravity’s pull along the arc grows more slowly than the distance, so the swing takes longer: about 14 % longer at 80°.' },
    { q: 'A swing takes 3 s per swing. Which push rhythm does NOT build it up?', options: ['One push every 3 s', 'One push every 6 s', 'One push every 9 s', 'One push every 1.5 s'], answer: 3, why: 'Every 3, 6 or 9 s the push always meets the swing going the same way. Every 1.5 s, one push helps and the next opposes, so they cancel.' },
  ],
  reel: [
    { ms: 5000, caption: 'A pendulum is the same idea: gravity is its spring, and only its length sets the beat.', set: { focus: 'pendulum', L: 1.0, th0: 25, pm: 0.2 }, act: (s, inst) => inst.release(), view: { pos: [PX + 0.4, 6.4, 8.6], target: [PX + 0.4, 6.2, 0] }, spin: 0 },
    { ms: 5600, caption: 'Push a swing once per swing and small shoves add up. Push at the wrong rhythm and they cancel.', set: { focus: 'swing', sL: 2.0, F: 40, Tp: 2.84 }, act: (s, inst) => inst.warm(), view: { pos: [SX + 0.6, 6.6, 9.2], target: [SX + 0.6, 6.5, 0] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    let cur = { ...s0 }, lastFocus = null, drawT = 0, pushGlow = 0;
    const gP = new THREE.Group(), gS = new THREE.Group(); root.add(gP, gS); gS.position.x = SX + 1.6; gS.rotation.y = -0.6;
    const iron = M.matte(0x3a3f4b, { roughness: 0.6 }), steel = M.metal(0xb9bec8);

    // ------------------------------------------------ pendulum
    const stand = new THREE.Group(); stand.position.x = PX; gP.add(stand);
    const pbase = box(3.4, 0.2, 2.0, iron); pbase.position.set(0.8, 0.1, -0.6); stand.add(pbase);
    stand.add(beam([1.9, 0, -0.9], [1.9, PIV + 0.5, -0.9], 0.09, steel), beam([1.9, PIV + 0.2, -0.9], [0, PIV + 0.2, -0.9], 0.07, steel), beam([0, PIV + 0.2, -0.9], [0, PIV + 0.2, 0], 0.05, steel));
    const pivot = sphere(0.09, steel); pivot.position.set(0, PIV + 0.1, 0); stand.add(pivot);
    const str = strut(0.018, M.matte(0xe8e8e8)); stand.add(str);
    const bob = sphere(1, M.metal(0xc9a24a, { roughness: 0.3 }), 32); stand.add(bob);
    const gStr = strut(0.012, M.ghost(0x8ef0ff, 0.35)); stand.add(gStr);
    const gBob = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), M.ghost(0x8ef0ff, 0.28)); stand.add(gBob);
    const plumb = strut(0.008, M.ghost(0xffffff, 0.25)); plumb.set([0, PIV, 0], [0, 0.6, 0]); stand.add(plumb);
    const pull = forceArrow(0xffb547, 0.045); stand.add(pull);
    const lBob = stage.label('', [0, 0, 0], stand, 'hot');
    const lGhostP = stage.label('pale bob: the formula', [-2.3, PIV + 0.75, 0], stand); lGhostP.element.style.color = COL.line;
    const lPull = stage.label('arrow: gravity’s pull back to the middle', [0, -0.45, 1.2], stand); lPull.element.style.color = COL.drive;
    const pst = { x: 0, v: 0, t: 0 }, pm = meter(); let pT = 0, pKey = '', pTrace = [];
    const release = (s) => { pst.x = s.th0 * DEG; pst.v = 0; pst.t = 0; pT = 0; pm.reset(); pm.n = 1; pm.tHi = 0; pm.hi = pst.x; pTrace = []; };   // the release is the first turning point

    const pBoard = board(root, 6.2, 3.9, 620, 390, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, WIN = 8, th = s.th0, w0 = Math.sqrt(G / s.L);
      const a = axes(g, w, h, { x0: 70, x1: w - 96, y1: 62, y0: h - 54, xMax: WIN, yMin: -th, yMax: th, xTicks: [0, 2, 4, 6, 8], yTicks: [-th, 0, th], xFmt: (v) => v + ' s', yFmt: (v) => v + '°' });
      title(g, 'Angle against time', 'since release');
      const { X, Y } = a, tA = Math.max(0, pT - WIN);
      clip(g, a, () => {
        const pts = []; for (let i = 0; i <= 200; i++) { const t = tA + (WIN * i) / 200; if (t > pT) break; pts.push([t - tA, th * Math.cos(w0 * t)]); }
        line(g, pts, X, Y, 'rgba(142,240,255,.55)', 2.5, [6, 5]);
        line(g, pTrace.filter((p) => p[0] >= tA).map((p) => [p[0] - tA, p[1] / DEG]), X, Y, COL.drive, 3.5);
      });
      text(g, 'solid: real bob', 70, h - 12, COL.drive, '16px sans-serif'); text(g, 'dashed: formula (pale bob)', 200, h - 12, COL.line, '16px sans-serif');
      const KE = 0.5 * s.pm * (s.L * pst.v) ** 2, PE = s.pm * G * s.L * (1 - Math.cos(pst.x)), E0 = s.pm * G * s.L * (1 - Math.cos(th * DEG)) || 1e-9;
      const bx = w - 78, bw = 26, bh = a.y0 - a.y1;
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(bx, a.y1, bw, bh); g.fillRect(bx + 34, a.y1, bw, bh);
      g.fillStyle = COL.warm; g.fillRect(bx, a.y0 - Math.min(1, KE / E0) * bh, bw, Math.min(1, KE / E0) * bh);
      g.fillStyle = COL.soft; g.fillRect(bx + 34, a.y0 - Math.min(1, PE / E0) * bh, bw, Math.min(1, PE / E0) * bh);
      text(g, 'KE', bx, a.y0 + 22, COL.warm, 'bold 16px sans-serif'); text(g, 'PE', bx + 34, a.y0 + 22, COL.soft, 'bold 16px sans-serif');
      text(g, 'energy', bx - 2, a.y1 - 10, 'rgba(255,255,255,.6)', '15px sans-serif');
    }, [-3.7, 2.6, 0]);

    // ------------------------------------------------ swing
    const legM = M.metal(0x6d7380), chainM = M.metal(0xc0c6d2);
    for (const z of [-1.5, 1.5]) { gS.add(beam([-1.9, 0, z], [0, TOPS, z * 0.85], 0.06, legM), beam([1.9, 0, z], [0, TOPS, z * 0.85], 0.06, legM)); }
    gS.add(beam([0, TOPS, -1.3], [0, TOPS, 1.3], 0.1, legM));
    const sw = new THREE.Group(); sw.position.set(0, TOPS, 0); gS.add(sw);
    const ch1 = strut(0.025, chainM), ch2 = strut(0.025, chainM); sw.add(ch1, ch2);
    const seat = new THREE.Group(); seat.scale.setScalar(1.35); sw.add(seat);
    const plank = box(0.7, 0.07, 1.0, M.plastic(0xff7a59)); seat.add(plank);
    const body = beam([0, 0.05, 0], [0, 0.85, 0], 0.2, M.plastic(0x5ce1a9)); seat.add(body);
    const head = sphere(0.2, M.plastic(0xf0c8a0)); head.position.y = 1.12; seat.add(head);
    const legs = beam([0, 0.06, 0], [0.55, -0.4, 0], 0.09, M.plastic(0x3d7bd9)); seat.add(legs);
    const shove = forceArrow(0xffb547, 0.07); shove.rotation.z = -Math.PI / 2; gS.add(shove);
    const lShove = stage.label('push', [0, 0, 0], gS, 'hot'); lShove.element.style.setProperty('--c', COL.drive);
    const lSw = stage.label('', [0, TOPS + 0.7, 0], gS, 'hot');
    const sst = { x: 0, v: 0, t: 0 }, sm = meter(); let sDots = [], sKey = '', sDirty = 0, sPeak = 0, sTrail = [];
    const calcSwing = (s) => {
      const T = T0(s.sL), set = new Set();
      for (let tp = 1; tp <= 9.001; tp += 0.25) set.add(+tp.toFixed(3));
      for (const n of [1, 2, 3]) for (const d of [-0.12, -0.06, -0.03, 0, 0.03, 0.06, 0.12]) { const tp = T * (n + d); if (tp >= 1 && tp <= 9) set.add(+tp.toFixed(3)); }
      sDots = [...set].sort((a, b) => a - b).map((tp) => [tp, settleSwing(s.sL, s.F, tp) / DEG]);
    };

    const sBoard = board(root, 6.2, 4.3, 620, 430, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, T = T0(s.sL);
      let top = 10; sDots.forEach((d) => { if (d[1] > top) top = d[1]; }); top = Math.ceil(top * 1.15 / 10) * 10;
      const yT = []; for (let y = 0; y <= top; y += top > 60 ? 20 : 10) yT.push(y);
      const a = axes(g, w, h, { x0: 70, y1: 76, xMin: 1, xMax: 9, yMax: top, xTicks: [1, 2, 3, 4, 5, 6, 7, 8, 9], yTicks: yT, xFmt: (v) => v + ' s', yFmt: (v) => v + '°', xLabel: 'time between pushes →', yLabel: 'steady swing angle ↑' });
      title(g, 'Push rhythm against swing', `${s.F} N shoves`);
      const { X, Y } = a;
      for (const n of [1, 2, 3]) if (n * T < 9) { line(g, [[n * T, 0], [n * T, top]], X, Y, 'rgba(142,240,255,.45)', 2, [7, 6]); text(g, n === 1 ? 'T' : n + 'T', X(n * T) + 6, a.y1 + 16, COL.line, 'bold 17px sans-serif'); }
      if (T / 2 >= 1) { line(g, [[T / 2, 0], [T / 2, top]], X, Y, 'rgba(255,90,90,.45)', 2, [7, 6]); text(g, 'T÷2', X(T / 2) + 6, a.y1 + 16, COL.hot, 'bold 17px sans-serif'); }
      clip(g, a, () => {
        line(g, sDots, X, Y, COL.line, 3.5);
        sDots.forEach(([tp, A]) => ring(g, X(tp), Y(A), '#fff', 3.5));
        sTrail.forEach(([tp, A]) => { g.fillStyle = 'rgba(255,181,71,.6)'; g.beginPath(); g.arc(X(tp), Y(A), 3.5, 0, TAU); g.fill(); });
      });
      line(g, [[s.Tp, 0], [s.Tp, top]], X, Y, 'rgba(255,181,71,.35)', 2);
      dot(g, X(s.Tp), Y(Math.min(top, sPeak / DEG)), COL.drive, 10);
      text(g, '○ stepped to steady   ● now', 70, h - 12, 'rgba(255,255,255,.6)', '16px sans-serif');
    }, [SX - 3.9, 2.55, 0]);

    const lP = [lGhostP, lPull];
    release(s0); calcSwing(s0);
    return {
      release() { release(cur); },
      stop() { sst.x = 0; sst.v = 0; sst.t = 0; sm.reset(); sPeak = 0; },
      // for the video: start mid-story, already swinging 20° and in step with the pushes
      warm() { sst.x = 0; sst.v = 20 * DEG * Math.sqrt(G / cur.sL); sst.t = 0; sm.reset(); },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, lP);
        gP.visible = pBoard.mesh.visible = s.focus === 'pendulum'; gS.visible = sBoard.mesh.visible = s.focus === 'swing';
        if (s.focus !== lastFocus) { if (lastFocus !== null) focusView(stage, VIEWS, s.focus); lastFocus = s.focus; }
        gS.position.x = inReel() ? SX + 0.6 : SX + 1.6;
        reelPlace([[pBoard, [PX + 0.4, 9.9, 0], 1.25], [sBoard, [SX, 10.6, 0], 1.3]]);
        cur = { ...s };
        if (s.focus === 'pendulum') {
          const k = `${s.L}|${s.th0}|${s.pm}`; if (k !== pKey) { pKey = k; release(s); }
          const w0 = Math.sqrt(G / s.L);
          advance(pst, dt, 0.002, (t, x, v) => -w0 * w0 * Math.sin(x) - 2 * PZETA * w0 * v, (q) => pm.feed(q));
          pT += dt; pTrace.push([pT, pst.x]); if (pTrace.length > 620) pTrace.shift();
          const Lu = s.L * PU, th = pst.x, gth = s.th0 * DEG * Math.cos(w0 * pT);
          const r = 0.14 + 0.3 * Math.cbrt(s.pm), bp = [Lu * Math.sin(th), PIV - Lu * Math.cos(th), 0], gp = [Lu * Math.sin(gth), PIV - Lu * Math.cos(gth), -0.25];
          str.set([0, PIV + 0.1, 0], bp); bob.position.set(...bp); bob.scale.setScalar(r);
          gStr.set([0, PIV + 0.1, -0.25], gp); gBob.position.set(...gp); gBob.scale.setScalar(r);
          // Gravity's pull along the arc: m g sin θ, towards the middle.
          const Ft = s.pm * G * Math.sin(th);
          pull.position.set(bp[0], bp[1], 0.3); pull.rotation.z = th + (Ft > 0 ? Math.PI / 2 : -Math.PI / 2); pull.set(clamp(Math.abs(Ft) * 1.1, 0, 2.4));
          lBob.position.set(bp[0], bp[1] - r - 0.45, 0);
          lBob.element.innerHTML = `${Math.round(s.pm * 1000)} g · ${(s.L * 100).toFixed(1)} cm`;
        } else {
          const k = `${s.sL}|${s.F}`; if (k !== sKey) { sKey = k; sDirty = 0.3; sTrail.length = 0; }
          if (sDirty > 0) { sDirty -= dt; if (sDirty <= 0) calcSwing(s); }
          const w0 = Math.sqrt(G / s.sL), a0 = s.F / (SM * s.sL);
          advance(sst, dt, 0.004, (t, x, v) => -w0 * w0 * Math.sin(x) - 2 * SZETA * w0 * v + a0 * pulse(t, s.Tp), (q) => { sm.feed(q); });
          sPeak = sm.amp;
          if (sm.settled && (!sTrail.length || Math.abs(sTrail[sTrail.length - 1][0] - s.Tp) > 0.03)) { sTrail.push([s.Tp, sm.amp / DEG]); if (sTrail.length > 200) sTrail.shift(); }
          const Lu = s.sL * SU, th = sst.x, p = pulse(sst.t, s.Tp);
          sw.rotation.z = th;                                            // +θ swings towards +x
          ch1.set([0, 0, -0.55], [0, -Lu, -0.55]); ch2.set([0, 0, 0.55], [0, -Lu, 0.55]); seat.position.set(0, -Lu, 0);
          const sx = Lu * Math.sin(th), sy = TOPS - Lu * Math.cos(th);
          pushGlow = Math.max(p, pushGlow - dt * 2.5);
          shove.position.set(sx - 0.6 - 1.7 * p, sy + 0.5, 0); shove.set(1.7 * p); shove.visible = p > 0.05;
          lShove.position.set(sx - 1.6, sy + 1.2, 0); lShove.visible = pushGlow > 0.25;
          lSw.element.innerHTML = `swing <b>±${(sm.amp / DEG).toFixed(0)}°</b>`;
        }
        drawT += dt; if (drawT > 1 / 30 || inReel()) { drawT = 0; (s.focus === 'pendulum' ? pBoard : sBoard).redraw(); }
      },
      readout: (s) => {
        if (s.focus === 'pendulum') {
          const T = T0(s.L), k = (s.pm * G) / s.L, Tb = T * bigSwing(s.th0 * DEG);
          return sheet(`T = 2π √(L ÷ g) = ${T.toFixed(2)} s`, [[`Measured from the swing`, `${isFinite(pm.period) ? pm.period.toFixed(3) + ' s' : '…'}`], [`Expected at ${s.th0}° (series)`, `${Tb.toFixed(3)} s, ${((Tb / T - 1) * 100).toFixed(1)} % slower`], [`Gravity’s “spring”, k = m g ÷ L`, `${k.toFixed(2)} N/m`], [`2π √(m ÷ k)`, `${(TAU * Math.sqrt(s.pm / k)).toFixed(2)} s, the same`]], `${s.th0 <= 20 ? 'Small swing: the real bob and the pale one keep almost together.' : 'Big swing: the real bob falls behind the pale one.'}`);
        }
        const T = T0(s.sL), w0 = TAU / T, dth = (s.F * SIG * Math.sqrt(TAU)) / (SM * s.sL * w0), n = s.Tp / T;
        const near = [1, 2, 3].find((m) => Math.abs(n - m) < 0.035);
        return sheet(`T = 2π √(L ÷ g) = ${T.toFixed(2)} s`, [[`Pushing every`, `${s.Tp.toFixed(2)} s = ${n.toFixed(2)} swings`], [`Each shove adds about`, `${(dth / DEG).toFixed(1)}°`], [`Swing now (measured)`, `±${(sm.amp / DEG).toFixed(0)}°`], [`Friction takes per swing`, `${(TAU * SZETA * 100).toFixed(0)} % of the angle`]], `${near ? `In step: every ${near === 1 ? '' : near === 2 ? 'second ' : 'third '}swing meets a push going its way.` : Math.abs(n - 0.5) < 0.03 ? 'Twice per swing: one push helps, the next one fights it.' : 'Out of step: some pushes help and some fight.'}`);
      },
    };
  },
};
