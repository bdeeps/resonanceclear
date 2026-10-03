// Chapter 1: the idea, live. A mass hangs on a spring from a shaker that moves the top hook up and
// down by ±5 mm. Scale: 1 scene unit = 10 cm. Nothing is scripted: every frame steps
//   m x'' = −k (x − y) − c x'      with y = Y cos(2π f t), Y = 5 mm
// i.e. x'' + 2ζω₀ x' + ω₀² x = ω₀² y, where x is the mass's distance below its rest position,
// ω₀ = √(k/m) and ζ = c ÷ (2 m ω₀). Fourth-order Runge–Kutta, steps of 2 ms or less.
// What the theory says (and the chart draws as a line): steady swing X = Y ÷ √((1 − r²)² + (2ζr)²),
// r = f ÷ f₀, peaking at about Q × Y with Q = 1 ÷ (2ζ); the mass lags the shaker by
// atan2(2ζr, 1 − r²). The dots on the chart are not that formula: each one is the same equation of
// motion stepped from rest until it settles (reso.js settle()). The two agree to better than 1 %.
// Free ringing: x = A e^(−ζω₀t) cos(ω_d t), ω_d = ω₀ √(1 − ζ²); energy ½ m v² + ½ k x² swaps
// between motion and spring (gravity only shifts the rest position for a linear spring).
// Lab values: school springs are typically 10–50 N/m and slotted masses 50–300 g.
import { THREE, M, box, rod } from '../kit.js';
import {
  TAU, G, COL, gain, phaseLag, peakGain, natural, advance, meter, settle, makeCoil, forceArrow, board, panelBg, axes, title, line, curve,
  dot, ring, text, clip, fitNarrow, reelPlace, inReel, fmtLen, fmtQ, link, clamp, sheet,
} from '../reso.js';

const U = 10, TOP = 6.8, L0 = 0.2, Y0 = 0.005, FMAX = 5, RX = 2.4;
const sag = (s) => (s.m * G) / s.k;

export default {
  id: 'idea',
  short: 'The idea, live',
  title: 'Everything that wobbles has its own beat',
  subtitle: 'Shake a mass on a spring at its natural frequency and a tiny push becomes a big swing.',
  view: { pos: [-0.9, 5.7, 11.6], target: [-0.9, 5.3, 0] },
  learn: `<p>Hang a mass on a spring, pull it down and let go. It bobs up and down at one steady rate. That rate is its <b>natural frequency</b>, and the time for one bob is its <b>period</b>: <b>T = 2π √(m ÷ k)</b>. A heavier mass (m) is slower. A stiffer spring (k) is faster. The size of the bob does not come into it at all.</p>
    <p>Why so regular? The spring pulls the mass back towards its rest position with a force that grows in step with the distance (that is ${link('hookeclear', 'Hooke’s law')}). Any system with a <b>restoring force proportional to displacement</b> moves this way. It is called <b>simple harmonic motion</b>. As it goes, energy swaps back and forth between the stretched spring and the moving mass (see ${link('energyclear', 'EnergyClear')}), and <b>damping</b>, here air drag on a card, slowly bleeds it away.</p>
    <p>Now switch on the <b>shaker</b>. It moves the top of the spring by only <b>5 mm</b>. Shake slowly and the mass just rides along. Shake fast and the mass barely moves. But shake at the natural frequency and every small push arrives <b>in time</b> with the motion, so the pushes add up. The swing grows until the energy lost to drag each cycle equals the energy the shaker puts in. That is <b>resonance</b>.</p>
    <p>The chart is the <b>response curve</b>: how big the steady swing is at each shaking frequency. Its peak sits at the natural frequency. The <b>quality factor Q</b> says how tall and sharp it is: at resonance the swing is about <b>Q times</b> the shake. Less damping means a higher Q, a taller and narrower peak, and a longer wait for the swing to build.</p>
    <p>Watch the timing too. Far below resonance the mass moves <b>with</b> the shaker. Far above, it moves <b>opposite</b>. Exactly at resonance it lags a <b>quarter of a cycle</b> (90°), which is the timing that feeds in the most energy.</p>
    <p class="tip"><b>Try it:</b> press “Tune to the natural frequency” and watch the swing build. Then lower the damping and see the peak grow and sharpen. Press “Pluck” to see nothing but the system’s own beat.</p>`,
  terms: [
    { t: 'Simple harmonic motion', d: 'The smooth to-and-fro of anything whose restoring force is proportional to its displacement.' },
    { t: 'Natural frequency (f₀)', d: 'How many times a second a system swings when left alone: (1 ÷ 2π) √(k ÷ m) for a mass on a spring.' },
    { t: 'Period (T)', d: 'The time for one full swing: 1 ÷ f₀ = 2π √(m ÷ k).' },
    { t: 'Damping', d: 'Anything that takes energy out of a swing: air drag, friction, a shock absorber.' },
    { t: 'Resonance', d: 'The big response when something is pushed at, or very near, its natural frequency.' },
    { t: 'Quality factor (Q)', d: 'How lightly damped a system is. At resonance the swing is about Q times the push, and it rings for about Q swings.' },
    { t: 'Phase lag', d: 'How far the swing trails the push: 0° well below resonance, 90° at resonance, 180° well above.' },
  ],
  defaults: { m: 0.2, k: 20, zeta: 0.05, drive: 'on', f: 1.0, sweep: false },
  controls: [
    { key: 'f', type: 'range', label: 'Shaker frequency', min: 0.2, max: FMAX, step: 0.01, ends: ['0.2 Hz', '5 Hz'], fmt: (v, s) => `${v.toFixed(2)} Hz · ${(v / natural(s.k, s.m)).toFixed(2)} × natural` },
    { key: 'go', type: 'buttons', label: 'Shaker', items: [
      { label: 'Tune to the natural frequency', act: (s) => { s.drive = 'on'; s.sweep = false; s.f = clamp(+natural(s.k, s.m).toFixed(2), 0.2, FMAX); } },
      { label: 'Sweep slowly', act: (s) => { s.drive = 'on'; s.f = 0.4; s.sweep = true; } },
    ] },
    { key: 'drive', type: 'seg', label: 'Shaker', options: [{ v: 'on', label: 'Shaking ±5 mm' }, { v: 'off', label: 'Off (ring freely)' }] },
    { key: 'pl', type: 'buttons', label: 'Free ringing', items: [{ label: 'Pluck: pull 5 cm and let go', act: (s, inst) => { s.drive = 'off'; s.sweep = false; inst.pluck(); } }] },
    { key: 'm', type: 'range', label: 'Mass (m)', min: 0.1, max: 0.3, step: 0.01, ends: ['100 g', '300 g'], fmt: (v) => Math.round(v * 1000) + ' g' },
    { key: 'k', type: 'log', label: 'Spring stiffness (k)', min: 15, max: 60, ends: ['15 N/m, soft', '60 N/m, stiff'], fmt: (v) => Math.round(v) + ' N/m' },
    { key: 'zeta', type: 'log', label: 'Damping (size of the drag card)', min: 0.025, max: 0.5, ends: ['light, Q = 20', 'heavy, Q = 1'], fmt: (v) => `ζ = ${v.toFixed(3)} · Q = ${fmtQ(1 / (2 * v))}` },
  ],
  onChange(s, key) { if (key === 'f' || key === 'drive') s.sweep = false; },
  quiz: [
    { q: 'A mass on a spring bobs once every 0.6 s. You pull it twice as far before letting go. One bob now takes…', options: ['0.3 s', '0.6 s', '1.2 s', '2.4 s'], answer: 1, why: 'T = 2π √(m ÷ k) has no amplitude in it. A bigger swing travels further but also faster, so the time stays the same.' },
    { q: 'The shaker moves 5 mm and the system has Q = 10. Shaken exactly at its natural frequency, the mass settles to a swing of about…', options: ['5 mm', '1 cm', '5 cm', '50 cm'], answer: 2, why: 'At resonance the steady swing is about Q times the push: 10 × 5 mm = 5 cm.' },
    { q: 'At resonance, the mass’s motion compared with the shaker’s is…', options: ['exactly in step', 'a quarter of a cycle behind', 'exactly opposite', 'random'], answer: 1, why: 'At the natural frequency the response lags the push by 90°. Then the push is always in the direction the mass is moving, so it feeds in the most energy.' },
  ],
  reel: [
    { ms: 4800, caption: 'Pull a mass on a spring and let go. It rings at its own natural frequency, every time.', set: { m: 0.2, k: 20, zeta: 0.04, drive: 'off', sweep: false }, act: (s, inst) => inst.pluck(), view: { pos: [0, 7.6, 9.2], target: [0, 7.4, 0] }, spin: 0 },
    { ms: 5800, caption: 'Shake it by 5 mm at that frequency and each push adds to the last: resonance.', set: { m: 0.2, k: 20, zeta: 0.05, drive: 'on', sweep: false }, act: (s, inst) => inst.rest(), anim: { f: [0.9, 2.3] }, view: { pos: [0, 7.6, 9.2], target: [0, 7.4, 0] }, spin: 0 },
  ],

  build({ stage, s: s0 }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rig = new THREE.Group(); rig.position.x = RX; root.add(rig);
    const iron = M.matte(0x3a3f4b, { roughness: 0.6 }), steel = M.metal(0xb9bec8), brass = M.metal(0xc9a24a, { roughness: 0.35 });
    // Stand: base, post, arm, and a shaker (motor, crank disc and a sliding rod with the top hook).
    const base = box(3.6, 0.2, 2.2, iron); base.position.set(0.4, 0.1, 0); rig.add(base);
    const post = rod(0, TOP + 1.4, 0.09, 0.09, steel); post.rotation.z = Math.PI / 2; post.position.set(1.7, (TOP + 1.4) / 2, -0.5); rig.add(post);
    const arm = box(2.4, 0.16, 0.3, iron); arm.position.set(0.65, TOP + 1.1, -0.5); rig.add(arm);
    const motor = box(0.9, 0.7, 0.7, M.plastic(0x2e6bd6)); motor.position.set(0, TOP + 1.05, -0.35); rig.add(motor);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 32), steel); disc.rotation.x = Math.PI / 2; disc.position.set(0, TOP + 1.05, 0.05); rig.add(disc);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.12, 12), M.glow(0xffb547)); pin.rotation.x = Math.PI / 2; rig.add(pin);
    const guide = box(0.34, 0.3, 0.3, iron); guide.position.set(0, TOP + 0.35, 0.12); rig.add(guide);
    const slider = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 12), steel); rig.add(slider);
    const hookTop = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 20), steel); rig.add(hookTop);
    const coil = makeCoil({ turns: 14, R: 0.2, r: 0.026, mat: M.metal(0xd0d5de, { roughness: 0.25 }) }); rig.add(coil);
    const bob = new THREE.Group(); rig.add(bob);
    const hookB = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 20), steel); hookB.position.y = -0.09; bob.add(hookB);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), steel); stem.position.y = -0.3; bob.add(stem);
    const weight = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1, 36), brass); weight.castShadow = true; bob.add(weight);
    const card = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.03, 40), M.plastic(0xe9edf3, { transparent: true, opacity: 0.85 })); card.castShadow = true; bob.add(card);
    const pointer = box(0.62, 0.03, 0.03, M.glow(0xff7a59)); bob.add(pointer);
    // A rule behind the mass, the rest mark, and two ghost lines at ± the swing theory predicts.
    const rule = box(0.36, TOP - 0.3, 0.04, M.matte(0xe9dcb4)); rule.position.set(-1.05, (TOP + 0.3) / 2, -0.1); rig.add(rule);
    const ticks = new THREE.Group(); rig.add(ticks);
    for (let i = 0; i <= 64; i += 2) { const L = i % 10 ? 0.14 : 0.26, t = box(L, 0.014, 0.012, M.matte(0x222222)); t.position.set(-0.87 - L / 2, TOP - i / 10, -0.07); ticks.add(t); }
    const restMark = box(1.3, 0.02, 0.02, M.glow(0x8ef0ff, { transparent: true, opacity: 0.55 })); rig.add(restMark);
    const hiMark = box(1.1, 0.025, 0.02, M.glow(0x5ce1a9, { transparent: true, opacity: 0.8 })), loMark = hiMark.clone(); rig.add(hiMark, loMark);
    const push = forceArrow(0xffb547, 0.04); rig.add(push);

    const lShake = stage.label('shaker: ±5 mm', [1.0, TOP + 1.9, 0], rig, 'hot'); lShake.element.style.setProperty('--c', COL.drive);
    const lSpring = stage.label('', [1.3, TOP - 1.0, 0], rig);
    const lMass = stage.label('', [1.4, 5, 0], rig, 'hot');
    const lGhost = stage.label('formula', [-2.6, 4, 0], rig); lGhost.element.style.color = COL.ok;
    const lCard = stage.label('drag card', [1.5, 4, 0], rig);

    // ------------------------------------------------ the simulation
    const st = { x: 0, v: 0, t: 0 }, mt = meter();
    let ph = 0, cur = { ...s0 }, dots = [], trail = [], trace = [], dirty = 0, key = '', stretch = sag(s0), A0 = 0, t0 = 0, simT = 0, drawT = 0;
    const calcDots = (s) => {
      const f0 = natural(s.k, s.m), w0 = TAU * f0, set = new Set();
      for (let f = 0.3; f <= FMAX; f += 0.35) set.add(+f.toFixed(3));
      for (const r of [0.8, 0.88, 0.94, 0.97, 1, 1.03, 1.06, 1.12, 1.2]) { const f = f0 * r; if (f > 0.2 && f < FMAX) set.add(+f.toFixed(3)); }
      dots = [...set].sort((a, b) => a - b).map((f) => [f, settle(w0, s.zeta, TAU * f, (t) => w0 * w0 * Y0 * Math.cos(TAU * f * t))]);
    };
    calcDots(s0);

    const resp = board(root, 6.2, 3.9, 620, 390, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, f0 = natural(s.k, s.m), Q = 1 / (2 * s.zeta), top = Math.max(3, Math.ceil(peakGain(s.zeta) * Y0 * 100 * 1.15));
      const step = top > 8 ? 2 : 1, yT = []; for (let y = 0; y <= top; y += step) yT.push(y);
      const a = axes(g, w, h, { x0: 70, y1: 70, y0: h - 60, xMax: FMAX, yMax: top, xTicks: [0, 1, 2, 3, 4, 5], yTicks: yT, xFmt: (v) => v + ' Hz', yFmt: (v) => v + ' cm', xLabel: 'shaker frequency →', yLabel: 'steady swing ↑' });
      title(g, 'Response curve', `Q = ${fmtQ(Q)}`);
      const { X, Y } = a;
      // natural frequency, and the half-power band f₀ ÷ Q
      g.fillStyle = 'rgba(142,240,255,.08)'; g.fillRect(X(f0 * (1 - s.zeta)), a.y1, X(f0 * (1 + s.zeta)) - X(f0 * (1 - s.zeta)), a.y0 - a.y1);
      line(g, [[f0, 0], [f0, top]], X, Y, 'rgba(142,240,255,.55)', 2, [7, 6]);
      text(g, `f₀ = ${f0.toFixed(2)} Hz`, Math.min(X(f0) + 8, a.x1 - 120), a.y1 + 18, COL.line, 'bold 18px sans-serif');
      line(g, [[0, Y0 * 100], [FMAX, Y0 * 100]], X, Y, 'rgba(255,181,71,.6)', 2, [4, 6]);
      text(g, 'the shake: 0.5 cm', a.x1 - 150, Y(Y0 * 100) - 8, COL.drive, '16px sans-serif');
      clip(g, a, () => {
        curve(g, (f) => Y0 * 100 * gain(f / f0, s.zeta), 0.01, FMAX, X, Y, COL.line, 4);
        dots.forEach(([f, A]) => ring(g, X(f), Y(A * 100), '#fff', 5));
        trail.forEach(([f, A]) => { g.fillStyle = 'rgba(255,181,71,.55)'; g.beginPath(); g.arc(X(f), Y(A * 100), 3.5, 0, TAU); g.fill(); });
      });
      if (s.drive === 'on') { dot(g, X(s.f), Y(Math.min(top, mt.amp * 100)), COL.drive, 10); line(g, [[s.f, 0], [s.f, top]], X, Y, 'rgba(255,181,71,.35)', 2); }
      text(g, 'line: formula  ○ stepped  ● now', 70, h - 12, 'rgba(255,255,255,.6)', '16px sans-serif');
    }, [-3.5, 5.0, 0]);

    const trc = board(root, 6.2, 2.8, 620, 280, (g, w, h) => {
      panelBg(g, w, h);
      const s = cur, WIN = 5, tEnd = simT, tA = tEnd - WIN;
      let span = 0.012; trace.forEach((p) => { if (Math.abs(p[1]) > span) span = Math.abs(p[1]); });
      span *= 1.15;
      const a = axes(g, w, h, { x0: 74, x1: w - 96, y1: 56, y0: h - 40, xMin: -WIN, xMax: 0, yMin: -span, yMax: span, xTicks: [-5, -4, -3, -2, -1, 0], yTicks: [-span, 0, span], xFmt: (v) => (v ? v + ' s' : ''), yFmt: (v) => (v * 100).toFixed(1) });
      title(g, s.drive === 'on' ? 'Mass and shaker' : 'Ringing down', s.drive === 'on' ? 'cm · shaker drawn ×' + (span > 0.02 ? 4 : 1) : 'cm above rest');
      const { X, Y } = a, mag = span > 0.02 ? 4 : 1;
      clip(g, a, () => {
        if (s.drive === 'on') line(g, trace.filter((p) => p[0] >= tA).map((p) => [p[0] - tEnd, clamp(p[2] * mag, -span, span)]), X, Y, COL.drive, 2.5, [6, 5]);
        else if (A0 > 0) { const w0 = TAU * natural(s.k, s.m); for (const sg of [1, -1]) curve(g, (t) => sg * A0 * Math.exp(-s.zeta * w0 * Math.max(0, tEnd + t - t0)), Math.max(-WIN, t0 - tEnd), 0, X, Y, 'rgba(255,255,255,.45)', 2, [5, 5], 80); }
        line(g, trace.filter((p) => p[0] >= tA).map((p) => [p[0] - tEnd, p[1]]), X, Y, COL.line, 3.5);
      });
      // energy: motion (kinetic) over spring (potential), as shares of the largest seen lately
      const KE = 0.5 * s.m * st.v * st.v, PE = 0.5 * s.k * (st.x - (s.drive === 'on' ? Y0 * Math.cos(ph) : 0)) ** 2;
      let eMax = 1e-9; trace.forEach((p) => { if (p[3] > eMax) eMax = p[3]; });
      const bx = w - 78, bw = 26, bh = a.y0 - a.y1, kh = (KE / eMax) * bh, phh = (PE / eMax) * bh;
      g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(bx, a.y1, bw, bh); g.fillRect(bx + 34, a.y1, bw, bh);
      g.fillStyle = COL.warm; g.fillRect(bx, a.y0 - Math.min(bh, kh), bw, Math.min(bh, kh));
      g.fillStyle = COL.soft; g.fillRect(bx + 34, a.y0 - Math.min(bh, phh), bw, Math.min(bh, phh));
      text(g, 'KE', bx, a.y0 + 22, COL.warm, 'bold 16px sans-serif'); text(g, 'PE', bx + 34, a.y0 + 22, COL.soft, 'bold 16px sans-serif');
      text(g, 'energy', bx - 2, a.y1 - 10, 'rgba(255,255,255,.6)', '15px sans-serif');
    }, [-3.5, 1.5, 0]);

    const reset = () => { st.x = 0; st.v = 0; mt.reset(); trace.length = 0; trail.length = 0; A0 = 0; };
    return {
      pluck() { st.x = -0.05; st.v = 0; mt.reset(); trace.length = 0; A0 = 0.05; t0 = simT; },
      rest() { reset(); ph = 0; },
      update(dt, s) {
        dt = Math.max(0, dt);
        const narrow = fitNarrow(stage, [lGhost, lCard, lSpring]);
        reelPlace([[resp, [0, 12.1, 0], 1.4], [trc, [0, 9.0, 0], 1.0]]);
        rig.position.x = inReel() ? 0 : RX;
        trc.mesh.visible = !inReel() && !narrow;
        if (narrow && !inReel()) { resp.mesh.position.set(-3.1, 3.0, 0); resp.mesh.scale.setScalar(1.3); }
        const f0 = natural(s.k, s.m), w0 = TAU * f0, on = s.drive === 'on';
        // A change of mass or spring moves the rest position: the mass really does bounce to its new one.
        const kk = `${s.m}|${s.k.toFixed(3)}|${s.zeta.toFixed(4)}`;
        if (kk !== key) { if (key) st.x = clamp(st.x + sag(s) - stretch, -0.12, 0.12); key = kk; dirty = 0.25; trail.length = 0; mt.reset(); A0 = 0; }
        stretch = sag(s);
        if (dirty > 0) { dirty -= dt; if (dirty <= 0) calcDots(s); }
        if (s.sweep) { const r = s.f / f0; s.f = Math.min(FMAX, s.f * Math.exp(dt * 0.11 * (0.3 + Math.min(1, Math.abs(r - 1) * 3)))); if (s.f >= FMAX) s.sweep = false; }
        // x here is measured upward from rest so the picture and the trace agree: x'' = −ω₀²(x − y) − 2ζω₀x'
        const w = TAU * s.f, ph0 = ph, st0 = st.t;
        advance(st, dt, Math.min(0.002, 1 / (60 * Math.max(f0, s.f))), (t, x, v) => -w0 * w0 * (x - (on ? Y0 * Math.cos(ph0 + w * (t - st0)) : 0)) - 2 * s.zeta * w0 * v, (q) => mt.feed(q, on ? ph0 + w * (q.t - st0) : undefined));
        ph = (ph0 + w * dt) % TAU; simT += dt;
        const y = on ? Y0 * Math.cos(ph) : 0;
        const E = 0.5 * s.m * st.v * st.v + 0.5 * s.k * (st.x - y) ** 2;
        trace.push([simT, st.x, y, E]); while (trace.length && trace[0][0] < simT - 5.2) trace.shift();
        if (on && mt.settled && !s.sweep && (!trail.length || Math.abs(trail[trail.length - 1][0] - s.f) > 0.015)) { trail.push([s.f, mt.amp]); if (trail.length > 240) trail.shift(); }
        if (on && s.sweep && mt.n > 2 && (!trail.length || Math.abs(trail[trail.length - 1][0] - s.f) > 0.02)) trail.push([s.f, mt.amp]);

        // ------------------------------------------------ draw the rig (y up; x up from rest)
        const hy = TOP + y * U, restY = TOP - (L0 + stretch) * U, my = restY + st.x * U;
        slider.position.set(0, hy + 0.6, 0.12); hookTop.position.set(0, hy, 0.12);
        const a = ph; pin.position.set(0.22 * Math.sin(a), TOP + 1.05 + 0.22 * Math.cos(a), 0.12); disc.rotation.y = -a;
        coil.position.set(0, hy - 0.08, 0.12); coil.setLength(Math.max(0.3, hy - 0.08 - my));
        bob.position.set(0, my, 0.12);
        const hgt = 0.35 + s.m * 3.2; weight.scale.y = hgt; weight.position.y = -0.45 - hgt / 2;
        const cr = 0.5 + Math.sqrt(s.zeta) * 1.5; card.scale.set(cr, 1, cr); card.position.y = -0.47 - hgt;
        pointer.position.set(-0.6, -0.45 - hgt / 2, 0);
        const cy = restY - 0.45 - hgt / 2, Xs = on ? Y0 * gain(s.f / f0, s.zeta) : 0;
        restMark.position.set(-0.6, cy, -0.02);
        hiMark.visible = loMark.visible = lGhost.visible = on && Xs * U > 0.12 && !narrow;
        hiMark.position.set(-0.6, cy + Xs * U, -0.02); loMark.position.set(-0.6, cy - Xs * U, -0.02);
        lGhost.position.set(-1.95, cy + Xs * U, 0);
        const F = on ? s.k * (st.x - y) * -1 : 0;                         // spring's extra pull on the mass, N
        push.position.set(0.75, cy + st.x * U, 0.12); push.set(clamp(F * 1.1, -1.3, 1.3)); push.visible = push.visible && on;
        lShake.visible = on; lShake.position.set(0.2, TOP + 1.85, 0);
        lSpring.element.innerHTML = `k = <b>${s.k.toFixed(s.k < 20 ? 1 : 0)} N/m</b>`;
        lMass.position.set(1.75, my - 0.45 - hgt / 2, 0.12);
        lMass.element.innerHTML = narrow ? `<b>±${fmtLen(mt.amp)}</b>` : `${Math.round(s.m * 1000)} g · swing <b>±${fmtLen(mt.amp)}</b>`;
        lCard.position.set(1.1, my - 1.05 - hgt, 0.12);
        cur = { ...s };
        drawT += dt; if (drawT > 1 / 30 || inReel()) { drawT = 0; resp.redraw(); if (trc.mesh.visible) trc.redraw(); }
      },
      readout: (s) => {
        const f0 = natural(s.k, s.m), T = 1 / f0, Q = 1 / (2 * s.zeta), r = s.f / f0;
        if (s.drive !== 'on') {
          const Td = T / Math.sqrt(1 - s.zeta * s.zeta);
          return sheet(`T = 2π √(m ÷ k) = ${T.toFixed(2)} s`, [[`Natural frequency, 1 ÷ T`, `${f0.toFixed(2)} Hz`], [`Measured from the motion`, `${isFinite(mt.period) ? mt.period.toFixed(2) + ' s' : 'pluck it'}`], [`Q = 1 ÷ 2ζ`, `${fmtQ(Q)}`], [`Swing left after ${fmtQ(Math.max(1, Math.round(Q)))} bobs`, `${(Math.exp(-Math.PI * Math.max(1, Math.round(Q)) / Q / Math.sqrt(1 - s.zeta ** 2)) * 100).toFixed(0)} %`]], `Damping stretches the period only a little: ${Td.toFixed(3)} s here. The swing size never changes it.`);
        }
        const Xs = Y0 * gain(r, s.zeta), lag = phaseLag(r, s.zeta) * 180 / Math.PI;
        return sheet(`f₀ = (1 ÷ 2π) √(k ÷ m) = ${f0.toFixed(2)} Hz`, [[`Shaking at`, `${s.f.toFixed(2)} Hz = ${r.toFixed(2)} × f₀`], [`Swing now (measured)`, `±${fmtLen(mt.amp)}`], [`Steady swing by the formula`, `±${fmtLen(Xs)} = ${(Xs / Y0).toFixed(1)} × the shake`], [`Lag behind the shaker`, `${isFinite(mt.lag) ? Math.round(mt.lag * 180 / Math.PI) + '°' : '…'} (formula ${lag.toFixed(0)}°)`]], `Q = 1 ÷ 2ζ = ${fmtQ(Q)}, build-up time ${(Q / (Math.PI * f0)).toFixed(1)} s. ${Math.abs(r - 1) < 0.04 ? 'On resonance: the swing is about Q times the 5 mm shake.' : r < 1 ? 'Below resonance the mass follows the shaker.' : 'Above resonance the mass moves opposite to the shaker, and less.'}`);
      },
    };
  },
};
