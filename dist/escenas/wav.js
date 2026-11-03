'use strict';
// Escena WAV: vista explotada de unos audífonos Wave One que se arman, cambian de acabado, suenan y van a la bolsa.
// Todo se calcula desde el progreso p (0..1): se puede adelantar, retroceder y pausar.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t, s = 1.7) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => {
    const A = rgb(a), B = rgb(b);
    return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))).toString(16).padStart(2, '0')).join('');
  };

  const LAV = '#b9a3ee', GRA = '#45454c', LIM = '#c9de84';
  const CX = 600, CY = 297;          // centro del audífono armado
  const BAND = { cx: 600, cy: 282, a: 158, b: 190, t: 18 };
  const CUP = { l: 451, r: 749, y: 410, rx: 66, ry: 92 };

  const STYLE = `
    .sc-wav-svg{font-family:var(--cfont,system-ui,sans-serif)}
    .sc-wav-lbl{font-size:18px;font-weight:600;fill:#f2f4ef;letter-spacing:-.01em}
    .sc-wav-num{font-size:13px;font-weight:700;fill:#c6ee6a;letter-spacing:.04em}
    .sc-wav-glow{transform-box:fill-box;transform-origin:center;animation:sc-wav-breathe 5s ease-in-out infinite}
    @keyframes sc-wav-breathe{50%{opacity:.75;transform:scale(1.06)}}
    body.motion-paused .sc-wav-glow{animation:none}
    @media (prefers-reduced-motion:reduce){.sc-wav-glow{animation:none}}
  `;

  const DEFS = `
    <radialGradient id="sc-wav-violet"><stop offset="0" stop-color="#a98bff" stop-opacity=".42"/><stop offset=".45" stop-color="#7a5cf0" stop-opacity=".16"/><stop offset="1" stop-color="#7a5cf0" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-wav-lime"><stop offset="0" stop-color="#c6ee6a" stop-opacity=".22"/><stop offset="1" stop-color="#c6ee6a" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-wav-floor"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <pattern id="sc-wav-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="12" cy="12" r="1" fill="#ffffff" fill-opacity=".07"/></pattern>
    <linearGradient id="sc-wav-fin" gradientUnits="userSpaceOnUse" x1="380" y1="90" x2="820" y2="520">
      <stop/><stop/><stop/><stop/><stop/><stop/><stop/>
    </linearGradient>
    <linearGradient id="sc-wav-finDeep" gradientUnits="userSpaceOnUse" x1="380" y1="300" x2="820" y2="520"><stop/><stop offset="1"/></linearGradient>
    <linearGradient id="sc-wav-metal" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#6c6f76"/><stop offset=".35" stop-color="#e9ebef"/><stop offset=".55" stop-color="#b9bcc2"/><stop offset="1" stop-color="#55585e"/>
    </linearGradient>
    <linearGradient id="sc-wav-metalV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e5ea"/><stop offset="1" stop-color="#6d7077"/></linearGradient>
    <radialGradient id="sc-wav-pad" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#3b3b44"/><stop offset=".7" stop-color="#202026"/><stop offset="1" stop-color="#121216"/></radialGradient>
    <radialGradient id="sc-wav-fabric" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#26262c"/><stop offset="1" stop-color="#0d0d10"/></radialGradient>
    <pattern id="sc-wav-mesh" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".9" fill="#ffffff" fill-opacity=".12"/></pattern>
    <radialGradient id="sc-wav-cone" cx=".45" cy=".4" r=".65"><stop offset="0" stop-color="#4a4b52"/><stop offset=".6" stop-color="#1d1e23"/><stop offset="1" stop-color="#0b0b0e"/></radialGradient>
    <radialGradient id="sc-wav-cap" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f4f5f7"/><stop offset="1" stop-color="#7c7f86"/></radialGradient>
    <linearGradient id="sc-wav-bag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2026"/><stop offset="1" stop-color="#121418"/></linearGradient>
    <linearGradient id="sc-wav-bagSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d0f12"/><stop offset="1" stop-color="#16181d"/></linearGradient>
    <linearGradient id="sc-wav-eq" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#c6ee6a" stop-opacity=".35"/><stop offset="1" stop-color="#c6ee6a"/></linearGradient>
  `;

  // Arco de elipse (centro, radios, ángulos en grados con 0 = derecha, sentido antihorario visual).
  const ept = (cx, cy, a, b, deg) => [cx + a * Math.cos((deg * Math.PI) / 180), cy - b * Math.sin((deg * Math.PI) / 180)];
  const f1 = v => v.toFixed(1);

  function mount(stage) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1200 560');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'sc-wav-svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<style>${STYLE}</style><defs>${DEFS}</defs>`;
    stage.appendChild(svg);

    const mk = (tag, attrs, parent) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(el);
      return el;
    };
    const set = (el, attrs) => { for (const k in attrs) el.setAttribute(k, attrs[k]); };
    const show = (el, on) => (on ? el.removeAttribute('display') : el.setAttribute('display', 'none'));
    const txt = (parent, attrs, text) => { const t = mk('text', attrs, parent); t.textContent = text; return t; };

    const finStops = svg.querySelectorAll('#sc-wav-fin stop');
    const deepStops = svg.querySelectorAll('#sc-wav-finDeep stop');

    // ---------- Fondo ----------
    mk('rect', { width: 1200, height: 560, fill: '#07080a' });
    mk('rect', { width: 1200, height: 560, fill: 'url(#sc-wav-dots)' });
    const glowWrap = mk('g', {});
    const violet = mk('ellipse', { cx: 600, cy: 300, rx: 380, ry: 300, fill: 'url(#sc-wav-violet)', class: 'sc-wav-glow' }, glowWrap);
    const lime = mk('ellipse', { cx: 330, cy: 470, rx: 260, ry: 170, fill: 'url(#sc-wav-lime)' });
    const floor = mk('ellipse', { cx: 600, cy: 536, rx: 250, ry: 22, fill: 'url(#sc-wav-floor)' });

    // Marca
    const brand = mk('g', {});
    const wm = txt(brand, { x: 250, y: 66, 'font-size': 34, 'font-weight': 850, 'letter-spacing': '-.06em', fill: '#f2f4ef', style: 'font-stretch:115%' }, 'wav');
    const dot = mk('tspan', { fill: '#c6ee6a' }, wm); dot.textContent = '.';
    txt(brand, { x: 252, y: 92, 'font-size': 15, 'font-weight': 600, fill: '#f2f4ef', 'fill-opacity': 0.5, 'letter-spacing': '.02em' }, 'Wave One');

    // ---------- Ondas de sonido (detrás del producto) ----------
    const waves = mk('g', { fill: 'none', 'stroke-linecap': 'round' });
    const waveEls = [];
    for (let side = 0; side < 2; side++) for (let i = 0; i < 4; i++) waveEls.push({ side, i, el: mk('path', { 'stroke-width': 3, stroke: i % 2 ? '#a98bff' : '#c6ee6a' }, waves) });

    // ---------- Bolsa (parte trasera) ----------
    const BAG = { x0: 387, x1: 623, top: 318, bot: 520, side: 37, lift: 12 };
    const bagBack = mk('g', {});
    mk('path', { d: `M${BAG.x0 + 50},${BAG.top - 4} C${BAG.x0 + 56},${BAG.top - 62} ${BAG.x1 - 6},${BAG.top - 62} ${BAG.x1 - 2},${BAG.top - 4}`, fill: 'none', stroke: '#6f8a3a', 'stroke-width': 4.5, 'stroke-linecap': 'round', transform: `translate(${BAG.side * 0.6} ${-BAG.lift * 0.6})` }, bagBack);
    mk('polygon', { points: `${BAG.x0},${BAG.top} ${BAG.x0 + BAG.side},${BAG.top - BAG.lift} ${BAG.x1 + BAG.side},${BAG.top - BAG.lift} ${BAG.x1},${BAG.top}`, fill: '#050607' }, bagBack);

    // ---------- Audífono ----------
    const hp = mk('g', {});
    const part = () => mk('g', {}, hp);
    // diadema
    const gBand = part();
    const bo0 = ept(BAND.cx, BAND.cy, BAND.a, BAND.b, 180), bo1 = ept(BAND.cx, BAND.cy, BAND.a, BAND.b, 0);
    const bi0 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t, BAND.b - BAND.t, 180), bi1 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t, BAND.b - BAND.t, 0);
    mk('path', {
      d: `M${f1(bo0[0])},${f1(bo0[1])} A${BAND.a},${BAND.b} 0 0 1 ${f1(bo1[0])},${f1(bo1[1])} L${f1(bi1[0])},${f1(bi1[1])} A${BAND.a - BAND.t},${BAND.b - BAND.t} 0 0 0 ${f1(bi0[0])},${f1(bi0[1])} Z`,
      fill: 'url(#sc-wav-fin)'
    }, gBand);
    const c0 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t, BAND.b - BAND.t, 150), c1 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t, BAND.b - BAND.t, 30);
    const c2 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t - 11, BAND.b - BAND.t - 11, 30), c3 = ept(BAND.cx, BAND.cy, BAND.a - BAND.t - 11, BAND.b - BAND.t - 11, 150);
    mk('path', {
      d: `M${f1(c0[0])},${f1(c0[1])} A${BAND.a - BAND.t},${BAND.b - BAND.t} 0 0 1 ${f1(c1[0])},${f1(c1[1])} L${f1(c2[0])},${f1(c2[1])} A${BAND.a - BAND.t - 11},${BAND.b - BAND.t - 11} 0 0 0 ${f1(c3[0])},${f1(c3[1])} Z`,
      fill: '#24242a', stroke: '#2f2f36', 'stroke-width': 1
    }, gBand);
    const h0 = ept(BAND.cx, BAND.cy, BAND.a - 4, BAND.b - 4, 150), h1 = ept(BAND.cx, BAND.cy, BAND.a - 4, BAND.b - 4, 72);
    mk('path', { d: `M${f1(h0[0])},${f1(h0[1])} A${BAND.a - 4},${BAND.b - 4} 0 0 1 ${f1(h1[0])},${f1(h1[1])}`, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.4, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, gBand);

    // deslizadores + horquillas
    const slider = side => {
      const x = side ? CUP.r : CUP.l;
      const g = part();
      mk('path', { d: `M${x - 58},${CUP.y - 8} C${x - 62},${CUP.y - 96} ${x + 62},${CUP.y - 96} ${x + 58},${CUP.y - 8}`, fill: 'none', stroke: '#2d2e33', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      mk('path', { d: `M${x - 58},${CUP.y - 8} C${x - 62},${CUP.y - 96} ${x + 62},${CUP.y - 96} ${x + 58},${CUP.y - 8}`, fill: 'none', stroke: 'url(#sc-wav-metalV)', 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
      mk('rect', { x: x - 7, y: 262, width: 14, height: 70, rx: 5, fill: 'url(#sc-wav-metal)' }, g);
      for (let k = 0; k < 4; k++) mk('rect', { x: x - 4, y: 276 + k * 9, width: 8, height: 2, rx: 1, fill: '#000', 'fill-opacity': 0.25 }, g);
      mk('circle', { cx: x, cy: 337, r: 6, fill: '#26272c', stroke: 'url(#sc-wav-metal)', 'stroke-width': 2 }, g);
      return g;
    };
    const gSlL = slider(0), gSlR = slider(1);

    // copa izquierda (vista exterior): almohadilla detrás, carcasa delante
    const gPadL = part();
    mk('ellipse', { cx: CUP.l + 13, cy: CUP.y, rx: CUP.rx - 4, ry: CUP.ry - 3, fill: 'url(#sc-wav-pad)' }, gPadL);
    mk('ellipse', { cx: CUP.l + 13, cy: CUP.y, rx: CUP.rx - 18, ry: CUP.ry - 18, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.08, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, gPadL);
    const gShL = part();
    mk('ellipse', { cx: CUP.l, cy: CUP.y, rx: CUP.rx, ry: CUP.ry, fill: 'url(#sc-wav-fin)' }, gShL);
    mk('ellipse', { cx: CUP.l, cy: CUP.y, rx: CUP.rx - 7, ry: CUP.ry - 7, fill: 'none', stroke: '#000', 'stroke-opacity': 0.18, 'stroke-width': 1.5 }, gShL);
    mk('ellipse', { cx: CUP.l - 2, cy: CUP.y + 2, rx: 42, ry: 62, fill: 'url(#sc-wav-finDeep)' }, gShL);
    mk('path', { d: `M${CUP.l - 50},${CUP.y - 30} A${CUP.rx - 12},${CUP.ry - 12} 0 0 1 ${CUP.l + 6},${CUP.y - 80}`, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.45, 'stroke-width': 3, 'stroke-linecap': 'round' }, gShL);
    txt(gShL, { x: CUP.l - 2, y: CUP.y + 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 850, 'letter-spacing': '-.05em', fill: '#000', 'fill-opacity': 0.28 }, 'wav');

    // copa derecha (vista interior): carcasa detrás, driver, almohadilla delante
    const gShR = part();
    mk('ellipse', { cx: CUP.r + 13, cy: CUP.y, rx: CUP.rx, ry: CUP.ry, fill: 'url(#sc-wav-fin)' }, gShR);
    mk('path', { d: `M${CUP.r + 40},${CUP.y - 70} A${CUP.rx - 8},${CUP.ry - 8} 0 0 1 ${CUP.r + 72},${CUP.y + 6}`, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.3, 'stroke-width': 2.4, 'stroke-linecap': 'round' }, gShR);
    const gDrv = part();
    mk('ellipse', { cx: CUP.r, cy: CUP.y, rx: 44, ry: 62, fill: 'url(#sc-wav-metal)' }, gDrv);
    mk('ellipse', { cx: CUP.r, cy: CUP.y, rx: 36, ry: 52, fill: 'url(#sc-wav-cone)' }, gDrv);
    for (const k of [0.78, 0.56]) mk('ellipse', { cx: CUP.r, cy: CUP.y, rx: 36 * k, ry: 52 * k, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.1, 'stroke-width': 1 }, gDrv);
    mk('ellipse', { cx: CUP.r - 1, cy: CUP.y - 1, rx: 11, ry: 15, fill: 'url(#sc-wav-cap)' }, gDrv);
    const gPadR = part();
    mk('ellipse', { cx: CUP.r, cy: CUP.y, rx: CUP.rx - 2, ry: CUP.ry - 2, fill: 'url(#sc-wav-pad)' }, gPadR);
    mk('ellipse', { cx: CUP.r + 2, cy: CUP.y + 2, rx: 38, ry: 58, fill: 'url(#sc-wav-fabric)' }, gPadR);
    mk('ellipse', { cx: CUP.r + 2, cy: CUP.y + 2, rx: 38, ry: 58, fill: 'url(#sc-wav-mesh)' }, gPadR);
    mk('ellipse', { cx: CUP.r + 1, cy: CUP.y + 1, rx: 51, ry: 75, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.09, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }, gPadR);
    txt(gPadR, { x: CUP.r + 2, y: CUP.y + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: '#ffffff', 'fill-opacity': 0.22 }, 'R');
    mk('path', { d: `M${CUP.r - 46},${CUP.y - 44} A${CUP.rx - 10},${CUP.ry - 10} 0 0 1 ${CUP.r + 4},${CUP.y - 84}`, fill: 'none', stroke: '#ffffff', 'stroke-opacity': 0.14, 'stroke-width': 3, 'stroke-linecap': 'round' }, gPadR);

    // Orden de pintura: diadema, horquillas, copas
    hp.append(gBand, gSlL, gSlR, gPadL, gShL, gShR, gDrv, gPadR);

    // Piezas: posición explotada, ventana de ensamblaje y punto de "clic"
    const parts = [
      { g: gSlL, ex: [-26, -32], t: [0.2, 0.27], click: [CUP.l, 262] },
      { g: gSlR, ex: [26, -32], t: [0.205, 0.275], click: [CUP.r, 262] },
      { g: gPadL, ex: [20, 4], t: [0.24, 0.3], click: null },
      { g: gPadR, ex: [-16, 4], t: [0.245, 0.305], click: null },
      { g: gDrv, ex: [66, 0], t: [0.27, 0.33], click: [CUP.r, CUP.y] },
      { g: gShL, ex: [-88, 0], t: [0.29, 0.355], click: [CUP.l, CUP.y] },
      { g: gShR, ex: [128, 0], t: [0.3, 0.365], click: [CUP.r + 13, CUP.y] },
      { g: gBand, ex: [0, -54], t: [0.33, 0.4], click: [CX, 92] }
    ];

    // ---------- Etiquetas de la vista explotada ----------
    const labels = mk('g', {});
    const mkLabel = (n, text, tx, ty, anchor) => {
      const g = mk('g', {}, labels);
      const ln = mk('path', { fill: 'none', stroke: '#f2f4ef', 'stroke-opacity': 0.4, 'stroke-width': 1, pathLength: 1, 'stroke-dasharray': '1 1' }, g);
      const dt = mk('circle', { r: 3.4, fill: '#c6ee6a' }, g);
      const t = mk('text', { x: tx, y: ty, 'text-anchor': anchor }, g);
      const a = mk('tspan', { class: 'sc-wav-num' }, t); a.textContent = n + '  ';
      const b = mk('tspan', { class: 'sc-wav-lbl' }, t); b.textContent = text;
      return { g, ln, dt, t };
    };
    const lblBand = mkLabel('01', 'diadema', 772, 66, 'start');
    const lblSlide = mkLabel('02', 'deslizadores', 366, 216, 'end');
    const lblDrv = mkLabel('03', 'driver de 40 mm', 800, 548, 'middle');
    const lblPad = mkLabel('04', 'almohadillas', 404, 548, 'middle');

    // ---------- Destellos de encaje ----------
    const flashes = parts.filter(o => o.click).map(o => ({ o, el: mk('circle', { fill: 'none', stroke: '#c6ee6a', 'stroke-width': 2 }) }));

    // ---------- Acabados ----------
    const chips = mk('g', {});
    const chipData = [['lavanda', LAV], ['grafito', GRA], ['lima', LIM]].map(([name, col], i) => {
      const x = 470 + i * 120;
      const g = mk('g', {}, chips);
      const ring = mk('circle', { cx: x, cy: 532, r: 13, fill: 'none', stroke: '#c6ee6a', 'stroke-width': 1.6 }, g);
      mk('circle', { cx: x, cy: 532, r: 8.5, fill: col, stroke: '#ffffff', 'stroke-opacity': 0.25 }, g);
      const t = txt(g, { x: x + 20, y: 538, 'font-size': 17, 'font-weight': 600, fill: '#f2f4ef' }, name);
      return { g, ring, t };
    });

    // ---------- Ecualizador ----------
    const eq = mk('g', {});
    const bars = [];
    for (let i = 0; i < 25; i++) bars.push(mk('rect', { x: 476 + i * 10, width: 6, rx: 3, fill: 'url(#sc-wav-eq)' }, eq));

    // ---------- Bolsa (frente) ----------
    const bagFront = mk('g', {});
    mk('polygon', { points: `${BAG.x1},${BAG.top} ${BAG.x1 + BAG.side},${BAG.top - BAG.lift} ${BAG.x1 + BAG.side},${BAG.bot - BAG.lift} ${BAG.x1},${BAG.bot}`, fill: 'url(#sc-wav-bagSide)' }, bagFront);
    mk('rect', { x: BAG.x0, y: BAG.top, width: BAG.x1 - BAG.x0, height: BAG.bot - BAG.top, fill: 'url(#sc-wav-bag)' }, bagFront);
    mk('rect', { x: BAG.x0, y: BAG.top, width: BAG.x1 - BAG.x0, height: 3, fill: '#c6ee6a', 'fill-opacity': 0.9 }, bagFront);
    mk('path', { d: `M${BAG.x0 + 0.5},${BAG.top} V${BAG.bot}`, stroke: '#ffffff', 'stroke-opacity': 0.08 }, bagFront);
    const bw = txt(bagFront, { x: (BAG.x0 + BAG.x1) / 2, y: 438, 'text-anchor': 'middle', 'font-size': 64, 'font-weight': 850, 'letter-spacing': '-.06em', fill: '#f2f4ef', style: 'font-stretch:115%' }, 'wav');
    const bd = mk('tspan', { fill: '#c6ee6a' }, bw); bd.textContent = '.';
    mk('path', { d: `M${BAG.x0 + 50},${BAG.top + 2} C${BAG.x0 + 56},${BAG.top - 60} ${BAG.x1 - 56},${BAG.top - 60} ${BAG.x1 - 50},${BAG.top + 2}`, fill: 'none', stroke: '#a9cc56', 'stroke-width': 4.5, 'stroke-linecap': 'round' }, bagFront);

    // Insignia +1 y tarjeta
    const badge = mk('g', {});
    mk('circle', { cx: 0, cy: 0, r: 22, fill: '#c6ee6a' }, badge);
    txt(badge, { x: 0, y: 7, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 850, fill: '#0a0b0d', 'letter-spacing': '-.02em' }, '+1');
    const card = mk('g', {});
    mk('rect', { x: 700, y: 318, width: 244, height: 132, rx: 18, fill: '#121419', stroke: '#ffffff', 'stroke-opacity': 0.12 }, card);
    mk('circle', { cx: 728, cy: 352, r: 10, fill: LIM, stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 1.5 }, card);
    txt(card, { x: 748, y: 359, 'font-size': 19, 'font-weight': 700, fill: '#f2f4ef', 'letter-spacing': '-.01em' }, 'Wave One lima');
    txt(card, { x: 720, y: 402, 'font-size': 28, 'font-weight': 850, fill: '#f2f4ef', 'letter-spacing': '-.03em' }, '$ 349.900');
    mk('path', { d: 'M721,425 l5,5 l9,-10', fill: 'none', stroke: '#c6ee6a', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, card);
    txt(card, { x: 742, y: 431, 'font-size': 15, 'font-weight': 600, fill: '#c6ee6a' }, 'En tu bolsa');

    // Orden final de capas
    svg.append(waves, bagBack, hp, ...flashes.map(f => f.el), labels, chips, eq, bagFront, badge, card);

    const finishAt = p => {
      if (p < 0.44) return LAV;
      if (p < 0.5) return mix(LAV, GRA, easeInOut(seg(p, 0.44, 0.5)));
      if (p < 0.53) return GRA;
      return mix(GRA, LIM, easeInOut(seg(p, 0.53, 0.59)));
    };

    function render(p) {
      // ---- Acabado y brillo que recorre la pieza ----
      const base = finishAt(p);
      const light = mix(base, '#ffffff', 0.38), dark = mix(base, '#0b0b0e', 0.5), deep = mix(base, '#0b0b0e', 0.28);
      const gradAt = t => (t < 0.25 ? mix(light, base, t / 0.25) : t < 0.68 ? base : mix(base, dark, (t - 0.68) / 0.32));
      let sweep = -1, amt = 0;
      const w1 = seg(p, 0.37, 0.43), w2 = seg(p, 0.44, 0.51), w3 = seg(p, 0.53, 0.6);
      if (w1 > 0 && w1 < 1) { sweep = w1; amt = Math.sin(Math.PI * w1) * 0.6; }
      else if (w2 > 0 && w2 < 1) { sweep = w2; amt = Math.sin(Math.PI * w2); }
      else if (w3 > 0 && w3 < 1) { sweep = w3; amt = Math.sin(Math.PI * w3); }
      const s = lerp(-0.1, 1.1, sweep < 0 ? 0 : sweep);
      const list = [[0, light], [0.25, base], [0.68, base], [1, dark]];
      const sl = [s - 0.09, s, s + 0.09].map((o, i) => [clamp(o), i === 1 && amt > 0 ? mix(gradAt(clamp(o)), '#ffffff', 0.62 * amt) : gradAt(clamp(o))]);
      const all = list.concat(sl).sort((a, b) => a[0] - b[0]);
      finStops.forEach((st, i) => { st.setAttribute('offset', all[i][0].toFixed(4)); st.setAttribute('stop-color', all[i][1]); });
      deepStops[0].setAttribute('stop-color', mix(base, '#ffffff', 0.12));
      deepStops[1].setAttribute('stop-color', deep);

      // ---- Piezas: vista explotada → ensamblaje con rebote ----
      parts.forEach((o, i) => {
        const e = easeBack(seg(p, o.t[0], o.t[1]), 1.4);
        const bob = Math.sin(p * 46 + i * 1.7) * 4 * (1 - seg(p, o.t[0], o.t[0] + 0.02));
        const dx = o.ex[0] * (1 - e), dy = o.ex[1] * (1 - e) + bob;
        o.g.setAttribute('transform', `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
        o.dx = dx; o.dy = dy;
      });
      flashes.forEach(f => {
        const k = seg(p, f.o.t[1] - 0.012, f.o.t[1] + 0.022);
        const on = k > 0 && k < 1;
        show(f.el, on);
        if (on) set(f.el, { cx: f.o.click[0], cy: f.o.click[1], r: (6 + 34 * easeOut(k)).toFixed(1), 'stroke-opacity': ((1 - k) * 0.9).toFixed(3) });
      });

      // ---- Etiquetas ----
      const lblOut = 1 - seg(p, 0.19, 0.225);
      show(labels, lblOut > 0.001);
      labels.setAttribute('opacity', lblOut.toFixed(3));
      const placeLabel = (L, k, ax, ay, ex, ey) => {
        L.dt.setAttribute('cx', ax.toFixed(1)); L.dt.setAttribute('cy', ay.toFixed(1));
        L.ln.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)}L${ex},${ey}`);
        L.ln.setAttribute('stroke-dashoffset', (1 - easeOut(k)).toFixed(4));
        L.dt.setAttribute('opacity', easeOut(seg(k, 0, 0.3)).toFixed(3));
        L.t.setAttribute('opacity', easeOut(seg(k, 0.5, 1)).toFixed(3));
      };
      const P = i => parts[i];
      const bandA = ept(BAND.cx, BAND.cy, BAND.a, BAND.b, 48);
      placeLabel(lblBand, seg(p, 0.02, 0.07), bandA[0] + P(7).dx, bandA[1] + P(7).dy, 764, 60);
      placeLabel(lblSlide, seg(p, 0.04, 0.09), CUP.l - 8 + P(0).dx, 290 + P(0).dy, 374, 210);
      placeLabel(lblDrv, seg(p, 0.06, 0.11), CUP.r + P(4).dx, CUP.y + 62 + P(4).dy, 800, 526);
      placeLabel(lblPad, seg(p, 0.08, 0.13), CUP.l + 13 + P(2).dx, CUP.y + 89 + P(2).dy, 412, 526);

      // ---- Selector de acabados ----
      const chipIn = seg(p, 0.42, 0.45) * (1 - seg(p, 0.615, 0.64));
      show(chips, chipIn > 0.001);
      chips.setAttribute('opacity', chipIn.toFixed(3));
      const active = p < 0.47 ? 0 : p < 0.56 ? 1 : 2;
      chipData.forEach((c, i) => {
        c.ring.setAttribute('opacity', i === active ? 1 : 0);
        c.t.setAttribute('fill-opacity', i === active ? 1 : 0.45);
      });

      // ---- Sonido: ondas + ecualizador + pulso ----
      const env = seg(p, 0.62, 0.66) * (1 - seg(p, 0.77, 0.8));
      show(waves, env > 0.001);
      waveEls.forEach(w => {
        const ph = ((p - 0.62) * 16 + w.i / 4) % 1;
        const r = lerp(84, 220, ph);
        const op = Math.sin(Math.PI * ph) * env;
        const cx = w.side ? CUP.r + 13 : CUP.l, sgn = w.side ? 1 : -1;
        const a0 = ept(cx, CUP.y, r * 0.62, r, 40), a1 = ept(cx, CUP.y, r * 0.62, r, -40);
        const pA = [cx + sgn * (a0[0] - cx), a0[1]], pB = [cx + sgn * (a1[0] - cx), a1[1]];
        set(w.el, { d: `M${f1(pA[0])},${f1(pA[1])}A${f1(r * 0.62)},${f1(r)} 0 0 ${w.side ? 1 : 0} ${f1(pB[0])},${f1(pB[1])}`, 'stroke-opacity': op.toFixed(3), 'stroke-width': lerp(3.4, 1.2, ph).toFixed(2) });
      });
      show(eq, env > 0.001);
      eq.setAttribute('opacity', env.toFixed(3));
      if (env > 0.001) bars.forEach((b, i) => {
        const bell = Math.exp(-Math.pow((i - 12) / 7, 2));
        const v = 0.5 + 0.5 * Math.sin(p * 210 + i * 0.9) * Math.cos(p * 130 - i * 0.45);
        const h = 4 + (8 + 30 * bell) * v * env;
        set(b, { y: (548 - h).toFixed(1), height: h.toFixed(1) });
      });
      const beat = env * Math.pow(Math.max(0, Math.sin(p * 160)), 6);
      set(violet, { rx: (380 + 60 * env + 24 * beat).toFixed(1), ry: (300 + 40 * env + 18 * beat).toFixed(1) });

      // ---- A tu bolsa ----
      const eBag = easeBack(seg(p, 0.8, 0.86), 1.3);
      const eLift = easeInOut(seg(p, 0.82, 0.9));
      const eDrop = easeBack(seg(p, 0.9, 0.945), 1.6);
      const sc = lerp(1, 0.52, eLift) * (1 + 0.014 * beat);
      const tx = lerp(CX, 505, eLift) + 6 * eDrop, ty = lerp(CY, 168, eLift) + 104 * eDrop;
      const rot = lerp(0, -5, eLift) - 4 * eDrop;
      hp.setAttribute('transform', `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${sc.toFixed(4)}) translate(${-CX} ${-CY})`);
      const bagOn = eBag > 0;
      show(bagBack, bagOn); show(bagFront, bagOn);
      if (bagOn) {
        const squash = 1 - 0.035 * Math.sin(Math.PI * seg(p, 0.935, 0.965));
        const by = (1 - eBag) * 300;
        const tr = `translate(0 ${by.toFixed(1)}) translate(505 520) scale(${(2 - squash).toFixed(4)} ${squash.toFixed(4)}) translate(-505 -520)`;
        bagBack.setAttribute('transform', tr);
        bagFront.setAttribute('transform', tr);
      }
      floor.setAttribute('rx', lerp(250, 200, eLift).toFixed(1));
      floor.setAttribute('cx', lerp(600, 520, eLift).toFixed(1));
      lime.setAttribute('opacity', (0.6 + 0.4 * eLift).toFixed(3));

      const eBadge = easeBack(seg(p, 0.945, 0.975), 2.2);
      show(badge, eBadge > 0);
      if (eBadge > 0) badge.setAttribute('transform', `translate(654 300) scale(${Math.max(0.001, eBadge).toFixed(4)})`);
      const eCard = easeOut(seg(p, 0.95, 0.995));
      show(card, eCard > 0);
      if (eCard > 0) set(card, { opacity: eCard.toFixed(3), transform: `translate(0 ${(18 * (1 - eCard)).toFixed(1)})` });
    }

    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.wav = {
    title: 'Así se arma un Wave One',
    duration: 17000,
    steps: [
      { label: 'Las piezas', at: 0 },
      { label: 'Ensamblaje', at: 0.19 },
      { label: 'Tres acabados', at: 0.42 },
      { label: 'El sonido', at: 0.62 },
      { label: 'A tu bolsa', at: 0.8 }
    ],
    mount
  };
})();
