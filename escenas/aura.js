'use strict';
// Escena AURA: una casa tropical moderna construida en isométrico, de terreno vacío a habitable.
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
  // Interpola entre fotogramas clave [[p, valor], …] con curva suave.
  const keys = (p, list) => {
    if (p <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (p <= list[i][0]) return lerp(list[i - 1][1], list[i][1], easeInOut(seg(p, list[i - 1][0], list[i][0])));
    }
    return list[list.length - 1][1];
  };

  // Proyección isométrica: (x, y, z) del terreno → pantalla.
  const S = 18, CX = Math.cos(Math.PI / 6) * S, HY = S / 2, OX = 538, OY = 132;
  const P = (x, y, z = 0) => [OX + (x - y) * CX, OY + (x + y) * HY - z * S];
  const fmt = list => list.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  const quad = (...c) => fmt(c.map(v => P(v[0], v[1], v[2])));
  const faceY = (y, x0, x1, z0, z1) => quad([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);
  const faceX = (x, y0, y1, z0, z1) => quad([x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]);
  const flat = (x0, x1, y0, y1, z) => quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]);
  const line = (a, b) => { const A = P(...a), B = P(...b); return `M${A[0].toFixed(1)},${A[1].toFixed(1)}L${B[0].toFixed(1)},${B[1].toFixed(1)}`; };

  // Luz desde la izquierda: techo claro, cara +y (izquierda) media, cara +x (derecha) en sombra.
  const shade = base => ({ top: mix(base, '#ffffff', 0.22), left: base, right: mix(base, '#26302b', 0.26) });
  const SUN = [0.34, -0.5]; // desplazamiento de la sombra por unidad de altura

  function hull(points) {
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }
  const shadowOf = (x0, x1, y0, y1, z0, z1) => {
    const out = [];
    for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) out.push(P(x + z * SUN[0], y + z * SUN[1], 0));
    return fmt(hull(out));
  };

  const STYLE = `
    .sc-aura-svg{font-family:var(--cfont,system-ui,sans-serif)}
    .sc-aura-t{font-weight:300;text-transform:uppercase;letter-spacing:.24em;fill:#1d2320}
    .sc-aura-bp{fill:none;stroke:#3c5a48;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
    .sc-aura-shimmer{animation:sc-aura-wave 3.6s linear infinite}
    @keyframes sc-aura-wave{from{transform:translate(0,0)}to{transform:translate(-31.2px,-18px)}}
    body.motion-paused .sc-aura-shimmer{animation:none}
    @media (prefers-reduced-motion:reduce){.sc-aura-shimmer{animation:none}}
  `;

  const DEFS = `
    <linearGradient id="sc-aura-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#dfe3de"/><stop offset=".62" stop-color="#e9e6df"/><stop offset="1" stop-color="#efebe3"/>
    </linearGradient>
    <radialGradient id="sc-aura-sun"><stop offset="0" stop-color="#fff6df" stop-opacity=".95"/><stop offset=".35" stop-color="#fff6df" stop-opacity=".35"/><stop offset="1" stop-color="#fff6df" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-aura-floor"><stop offset="0" stop-color="#2a302b" stop-opacity=".28"/><stop offset="1" stop-color="#2a302b" stop-opacity="0"/></radialGradient>
    <linearGradient id="sc-aura-soilL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a48d6e"/><stop offset="1" stop-color="#7a664e"/></linearGradient>
    <linearGradient id="sc-aura-soilR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#85715a"/><stop offset="1" stop-color="#5b4c3c"/></linearGradient>
    <linearGradient id="sc-aura-glassL" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5e7f7f"/><stop offset=".38" stop-color="#93b2ad"/><stop offset=".47" stop-color="#e3eee8"/><stop offset=".55" stop-color="#8eada8"/><stop offset="1" stop-color="#4f6d6e"/>
    </linearGradient>
    <linearGradient id="sc-aura-glassR" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#45615f"/><stop offset=".4" stop-color="#6f8f8b"/><stop offset=".5" stop-color="#b7cdc6"/><stop offset=".6" stop-color="#6a8985"/><stop offset="1" stop-color="#3b5453"/>
    </linearGradient>
    <linearGradient id="sc-aura-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6b3"/><stop offset="1" stop-color="#f1a85e"/></linearGradient>
    <radialGradient id="sc-aura-spill"><stop offset="0" stop-color="#ffc47a" stop-opacity=".55"/><stop offset="1" stop-color="#ffc47a" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-aura-poolglow"><stop offset="0" stop-color="#9ff2ea" stop-opacity=".75"/><stop offset="1" stop-color="#5fd0c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="sc-aura-water" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fb4b3"/><stop offset=".5" stop-color="#8fd2cb"/><stop offset="1" stop-color="#4e9ea3"/></linearGradient>
    <linearGradient id="sc-aura-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c2840" stop-opacity=".5"/><stop offset=".5" stop-color="#2c3448" stop-opacity=".26"/><stop offset="1" stop-color="#3a2c2c" stop-opacity=".2"/></linearGradient>
    <linearGradient id="sc-aura-trunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9c8064"/><stop offset="1" stop-color="#6c5541"/></linearGradient>
    <clipPath id="sc-aura-clipTop"><polygon points="${flat(0, 24, 0, 16, 0)}"/></clipPath>
    <clipPath id="sc-aura-clipPool"><polygon points="${flat(15.8, 21.6, 9.6, 12.6, 0.25)}"/></clipPath>
    <clipPath id="sc-aura-clipPit"><polygon id="sc-aura-pitRim" points="0,0"/></clipPath>
  `;

  function mount(stage) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1200 560');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('class', 'sc-aura-svg');
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

    function box(parent, base) {
      const c = typeof base === 'string' ? shade(base) : base;
      const g = mk('g', {}, parent);
      const f = ['left', 'right', 'top'].map(k => mk('polygon', { fill: c[k], stroke: c[k], 'stroke-width': 0.6, 'stroke-linejoin': 'round' }, g));
      return {
        g,
        set(x0, x1, y0, y1, z0, z1, op = 1) {
          const on = x1 - x0 > 0.01 && y1 - y0 > 0.01 && z1 - z0 > 0.004 && op > 0.002;
          show(g, on);
          if (!on) return;
          f[0].setAttribute('points', faceY(y1, x0, x1, z0, z1));
          f[1].setAttribute('points', faceX(x1, y0, y1, z0, z1));
          f[2].setAttribute('points', flat(x0, x1, y0, y1, z1));
          g.setAttribute('opacity', op.toFixed(3));
        }
      };
    }
    const grow = (el, bx, by, s) => el.setAttribute('transform', `matrix(${s.toFixed(4)},0,0,${s.toFixed(4)},${(bx * (1 - s)).toFixed(2)},${(by * (1 - s)).toFixed(2)})`);

    // ---------- Fondo ----------
    const skyStops = svg.querySelectorAll('#sc-aura-sky stop');
    const sunStops = svg.querySelectorAll('#sc-aura-sun stop');
    mk('rect', { width: 1200, height: 560, fill: 'url(#sc-aura-sky)' });
    const sunGlow = mk('circle', { r: 150, fill: 'url(#sc-aura-sun)' });
    const sunCore = mk('circle', { r: 22, fill: '#fff9ee' });
    const clouds = [
      mk('path', { d: 'M0,0c8-14 30-16 40-6c8-10 30-8 32 8c12 0 18 10 8 14h-86c-12-2-10-14 6-16z', fill: '#ffffff', opacity: 0.7 }),
      mk('path', { d: 'M0,0c6-10 22-12 30-4c6-8 24-6 24 6c9 0 14 8 6 11h-64c-9-2-8-11 4-13z', fill: '#ffffff', opacity: 0.6 })
    ];

    const world = mk('g', {});
    mk('ellipse', { cx: 600, cy: 540, rx: 360, ry: 26, fill: 'url(#sc-aura-floor)' }, world);

    // ---------- Terreno (maqueta) ----------
    const T0 = -1.5;
    mk('polygon', { points: faceY(16, 0, 24, T0, 0), fill: 'url(#sc-aura-soilL)' }, world);
    mk('polygon', { points: faceX(24, 0, 16, T0, 0), fill: 'url(#sc-aura-soilR)' }, world);
    const bandL = mk('polygon', { points: faceY(16, 0, 24, -0.32, 0) }, world);
    const bandR = mk('polygon', { points: faceX(24, 0, 16, -0.32, 0) }, world);
    mk('path', { d: line([0, 16, -0.85], [24, 16, -0.85]) + line([24, 16, -0.85], [24, 0, -0.85]), stroke: '#000', 'stroke-opacity': 0.08, 'stroke-width': 1, fill: 'none' }, world);
    const ground = mk('polygon', { points: flat(0, 24, 0, 16, 0) }, world);
    let gridD = '';
    for (let x = 2; x < 24; x += 2) gridD += line([x, 0, 0], [x, 16, 0]);
    for (let y = 2; y < 16; y += 2) gridD += line([0, y, 0], [24, y, 0]);
    const grid = mk('path', { d: gridD, stroke: '#ffffff', 'stroke-width': 1, fill: 'none' }, world);
    // estacas de replanteo
    const stakes = mk('g', {}, world);
    for (const [x, y] of [[2.5, 2], [16, 2], [2.5, 10], [16, 10]]) {
      const a = P(x, y, 0), b = P(x, y, 0.9);
      mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: '#8a6a45', 'stroke-width': 2.2, 'stroke-linecap': 'round' }, stakes);
      mk('circle', { cx: b[0], cy: b[1], r: 2.6, fill: '#c0573a' }, stakes);
    }

    // ---------- Plano dibujado en el suelo ----------
    const bp = mk('g', {}, world);
    const bpPaths = [
      flat(4.5, 13, 3, 9, 0.01),
      flat(2.5, 16, 2, 10, 0.01),
      flat(15.8, 21.6, 9.6, 12.6, 0.01),
      line([2.5, 11.2, 0], [16, 11.2, 0]) + line([2.5, 10.8, 0], [2.5, 11.6, 0]) + line([16, 10.8, 0], [16, 11.6, 0]),
      line([17.2, 2, 0], [17.2, 10, 0]) + line([16.8, 2, 0], [17.6, 2, 0]) + line([16.8, 10, 0], [17.6, 10, 0]),
      line([8.75, 3, 0], [8.75, 9, 0]) + line([4.5, 6, 0], [13, 6, 0])
    ].map((d, i) => {
      const isPoly = d[0] !== 'M';
      const el = isPoly
        ? mk('polygon', { points: d, class: 'sc-aura-bp', pathLength: 1, 'stroke-dasharray': '1 1' }, bp)
        : mk('path', { d, class: 'sc-aura-bp', pathLength: 1, 'stroke-dasharray': '1 1' }, bp);
      if (i === 1) el.setAttribute('stroke-opacity', '.55');
      if (i === 5) el.setAttribute('stroke-opacity', '.35');
      return el;
    });
    const groundText = (txt, x, y, along, size, weight = 400) => {
      const [tx, ty] = P(x, y, 0);
      const m = along === 'x' ? `matrix(.866,.5,-.866,.5,${tx},${ty})` : `matrix(.866,-.5,.866,.5,${tx},${ty})`;
      return mk('text', { transform: m, 'text-anchor': 'middle', 'font-size': size, 'font-weight': weight, 'letter-spacing': '.08em', fill: '#2f4a3a' }, bp).appendChild(document.createTextNode(txt)).parentNode;
    };
    const bpLabels = [
      groundText('180 m²', 8.75, 6.15, 'x', 30, 500),
      groundText('13,5 m', 9.25, 12.1, 'x', 19),
      groundText('8,0 m', 18.1, 6, 'y', 19)
    ];

    // ---------- Excavación y vaciado ----------
    const pitWrap = mk('g', { 'clip-path': 'url(#sc-aura-clipPit)' }, world);
    const pitRim = svg.querySelector('#sc-aura-pitRim');
    const pitFloor = mk('polygon', { fill: '#5e4e3d' }, pitWrap);
    const pitBack = mk('polygon', { fill: '#7b6650' }, pitWrap);
    const pitSide = mk('polygon', { fill: '#6c5946' }, pitWrap);
    const pour = mk('polygon', { fill: '#b9b6ae' }, pitWrap);

    // ---------- Terraza de madera y piscina ----------
    const deck = box(world, { top: '#c79a6b', left: '#a77a52', right: '#8a6343' });
    const planks = mk('path', { stroke: '#8e6845', 'stroke-opacity': 0.35, 'stroke-width': 1, fill: 'none' }, world);
    const pool = mk('g', { 'clip-path': 'url(#sc-aura-clipPool)' }, world);
    mk('polygon', { points: flat(15.8, 21.6, 9.6, 12.6, -0.9), fill: '#5f8e93' }, pool);
    mk('polygon', { points: faceY(9.6, 15.8, 21.6, -0.9, 0.25), fill: '#d9e6e1' }, pool);
    mk('polygon', { points: faceX(15.8, 9.6, 12.6, -0.9, 0.25), fill: '#b6cbc6' }, pool);
    const water = mk('polygon', { fill: 'url(#sc-aura-water)', opacity: 0.92 }, pool);
    const shimmerWrap = mk('g', {}, pool);
    let shD = '';
    for (let i = -6; i < 16; i++) {
      const a = P(14 + i * 0.9, 9.4, 0), b = P(14 + i * 0.9 + 2.2, 13, 0);
      shD += `M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${((a[0] + b[0]) / 2 + 6).toFixed(1)},${((a[1] + b[1]) / 2).toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    mk('path', { d: shD, class: 'sc-aura-shimmer', stroke: '#ffffff', 'stroke-opacity': 0.35, 'stroke-width': 1.2, fill: 'none' }, shimmerWrap);
    const coping = mk('polygon', { points: flat(15.8, 21.6, 9.6, 12.6, 0.26), fill: 'none', stroke: '#efe9df', 'stroke-width': 3 }, world);

    // Camino de piedras
    const stones = [[5.2, 10.6], [4.8, 12.2], [5.4, 13.8]].map(() => box(world, '#d9d4ca'));

    // ---------- Sombras ----------
    const shadows = mk('g', { 'clip-path': 'url(#sc-aura-clipTop)', fill: '#26302a' }, world);
    const shAO = mk('polygon', {}, shadows);
    const shF = mk('polygon', {}, shadows);
    const shG = mk('polygon', {}, shadows);
    const shU = mk('polygon', {}, shadows);
    const shCrane = mk('polygon', {}, shadows);
    const shCols = [], shUp = [];
    for (let i = 0; i < 6; i++) shCols.push(mk('polygon', {}, shadows));
    for (let i = 0; i < 6; i++) shUp.push(mk('polygon', {}, shadows));
    const treeSpots = [];

    // ---------- Vegetación (definiciones) ----------
    function palm(parent, x, y, h, lean, flip) {
      const [bx, by] = P(x, y, 0);
      const g = mk('g', {}, parent);
      const tx = bx + lean * S, ty = by - h * S;
      const midx = bx + lean * S * 0.25;
      mk('path', { d: `M${bx - 4},${by} Q${midx - 3},${by - h * S * 0.55} ${tx - 1.6},${ty} L${tx + 1.6},${ty} Q${midx + 3.4},${by - h * S * 0.55} ${bx + 4},${by} Z`, fill: 'url(#sc-aura-trunk)' }, g);
      const fr = [[-170, 1, 0.4, 0], [-138, 0.9, 0.18, 0], [-108, 0.72, 0.04, 0], [-72, 0.72, 0.04, 0], [-42, 0.92, 0.2, 0], [-10, 1, 0.42, 1], [28, 0.78, 0.5, 1], [152, 0.78, 0.5, 1]];
      const L = 2.7 * S;
      for (const [a0, l, dr, front] of fr) {
        const a = ((flip ? 180 - a0 : a0) * Math.PI) / 180;
        const len = L * l;
        const tipx = tx + Math.cos(a) * len, tipy = ty + Math.sin(a) * len + dr * L;
        const cx0 = tx + Math.cos(a) * len * 0.5, cy0 = ty + Math.sin(a) * len * 0.5 - L * 0.22;
        const nx = -Math.sin(a), ny = Math.cos(a), w = 7 * l;
        mk('path', {
          d: `M${tx.toFixed(1)},${ty.toFixed(1)}Q${(cx0 + nx * w).toFixed(1)},${(cy0 + ny * w).toFixed(1)} ${tipx.toFixed(1)},${tipy.toFixed(1)}Q${(cx0 - nx * w * 0.6).toFixed(1)},${(cy0 - ny * w * 0.6).toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}Z`,
          fill: front ? '#5f8d5a' : '#3f6a47'
        }, g);
      }
      mk('circle', { cx: tx - 2, cy: ty + 3, r: 2.6, fill: '#6b5a2e' }, g);
      mk('circle', { cx: tx + 2.4, cy: ty + 4, r: 2.4, fill: '#7d6a36' }, g);
      treeSpots.push({ x, y, r: 1.3, h, el: mk('ellipse', {}, shadows) });
      return { g, bx, by };
    }
    function tree(parent, x, y, h, r) {
      const [bx, by] = P(x, y, 0);
      const g = mk('g', {}, parent);
      mk('rect', { x: bx - 2.5, y: by - h * S * 0.55, width: 5, height: h * S * 0.55, rx: 2, fill: '#6f5743' }, g);
      mk('circle', { cx: bx, cy: by - h * S * 0.72, r: r * S, fill: '#46704a' }, g);
      mk('circle', { cx: bx + r * S * 0.35, cy: by - h * S * 0.62, r: r * S * 0.7, fill: '#3b6141' }, g);
      mk('circle', { cx: bx - r * S * 0.3, cy: by - h * S * 0.82, r: r * S * 0.55, fill: '#6c9764' }, g);
      treeSpots.push({ x, y, r: r * 0.9, h, el: mk('ellipse', {}, shadows) });
      return { g, bx, by };
    }
    function bush(parent, x, y, r) {
      const [bx, by] = P(x, y, 0);
      const g = mk('g', {}, parent);
      mk('circle', { cx: bx - r * 8, cy: by - r * 7, r: r * 9, fill: '#4c7750' }, g);
      mk('circle', { cx: bx + r * 7, cy: by - r * 6, r: r * 8, fill: '#3f6845' }, g);
      mk('circle', { cx: bx - r * 2, cy: by - r * 11, r: r * 7.5, fill: '#6a9561' }, g);
      return { g, bx, by };
    }

    const backPlants = [palm(world, 0.7, 5.6, 6.2, -0.5, false)];

    // ---------- Casa ----------
    const CONC = '#cbc7bf';
    const slabF = box(world, '#d6d2ca');
    const wallsG = box(world, { top: '#dedbd3', left: '#c9c5bc', right: '#9d9a92' });
    const gGlass = mk('g', {}, world);
    const gPanesY = [[6.4, 8.35], [9.15, 10.95], [11.15, 12.65]].map(r => ({ r, el: mk('polygon', { fill: 'url(#sc-aura-glassL)' }, gGlass) }));
    const gPanesX = [[3.35, 5.65], [6.35, 8.65]].map(r => ({ r, el: mk('polygon', { fill: 'url(#sc-aura-glassR)' }, gGlass) }));
    const door = mk('polygon', { fill: '#9b6a42' }, world);

    const colsG = [[4.5, 3], [13, 3], [4.5, 9], [8.75, 9], [13, 6], [13, 9]]
      .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
      .map(([x, y]) => ({ x, y, b: box(world, CONC) }));
    const beamsF = [
      { a: 'x', at: 3, from: 2.5, to: 16 },
      { a: 'y', at: 2.7, from: 3.2, to: 8.8 }, { a: 'y', at: 4.5, from: 3.2, to: 8.8 }, { a: 'y', at: 13, from: 3.2, to: 8.8 }, { a: 'y', at: 15.8, from: 3.2, to: 8.8 },
      { a: 'x', at: 9, from: 2.5, to: 16 }
    ].map(o => ({ ...o, b: box(world, '#bfbbb2') }));
    const colsU = [[2.7, 3], [9.4, 3], [15.8, 3], [2.7, 9], [9.4, 9], [15.8, 9]]
      .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
      .map(([x, y]) => ({ x, y, b: box(world, CONC) }));
    const beamsR = [
      { a: 'x', at: 3, from: 2.5, to: 16 },
      { a: 'y', at: 2.7, from: 3.2, to: 8.8 }, { a: 'y', at: 15.8, from: 3.2, to: 8.8 },
      { a: 'x', at: 9, from: 2.5, to: 16 }
    ].map(o => ({ ...o, b: box(world, '#bfbbb2') }));

    const slabU = box(world, { top: '#e2dfd8', left: '#d3cfc6', right: '#a9a59d' });
    const wallsU = box(world, { top: '#eeebe5', left: '#e6e2da', right: '#b9b5ac' });
    const uDeco = mk('g', {}, world);
    const backing = mk('polygon', { fill: '#6b5442' }, uDeco);
    const slats = mk('path', { stroke: '#b98353', 'stroke-width': 3.4, 'stroke-linecap': 'butt', fill: 'none' }, uDeco);
    const slatShade = mk('path', { stroke: '#7d5536', 'stroke-width': 1.2, fill: 'none', transform: 'translate(2.4 0)' }, uDeco);
    const uPanesY = [[10.65, 13.1], [13.3, 15.85]].map(r => ({ r, el: mk('polygon', { fill: 'url(#sc-aura-glassL)' }, uDeco) }));
    const uPanesX = [[2.15, 4.05], [4.25, 6.0], [6.2, 7.95], [8.15, 9.85]].map(r => ({ r, el: mk('polygon', { fill: 'url(#sc-aura-glassR)' }, uDeco) }));
    const roof = box(world, { top: '#f6f2ea', left: '#ded9cf', right: '#b3ada2' });
    const planter = box(world, { top: '#7f9a6a', left: '#d6d2c9', right: '#aca89f' });
    const roofPlants = mk('g', {}, world);
    const rp = [[3.6, 3.4], [3.9, 5.2], [3.5, 7.1], [4.0, 8.7]].map(([x, y]) => {
      const [bx, by] = P(x, y, 7.0);
      const g = mk('g', {}, roofPlants);
      mk('circle', { cx: bx, cy: by - 5, r: 7, fill: '#4f7b51' }, g);
      mk('circle', { cx: bx - 3, cy: by - 8, r: 4.5, fill: '#6f9a66' }, g);
      return { g, bx, by };
    });

    // ---------- Cotas de nivel ----------
    const levels = mk('g', {}, world);
    const levelEls = [[0.4, '±0,00'], [3.6, '+3,60'], [6.75, '+6,75']].map(([z, txt]) => {
      const g = mk('g', {}, levels);
      const a = P(2.5, 10, z);
      const lx = 286;
      mk('path', { d: `M${a[0] - 8},${a[1]}H${lx + 64}`, stroke: '#3c5a48', 'stroke-width': 1, 'stroke-dasharray': '3 4', fill: 'none' }, g);
      mk('path', { d: `M${lx + 64},${a[1]} l-6,-9 h12z`, fill: '#3c5a48' }, g);
      const t = mk('text', { x: lx, y: a[1] - 6, 'font-size': 18, class: 'sc-aura-t', fill: '#2f4a3a' }, g);
      t.textContent = txt;
      return g;
    });

    // ---------- Grúa torre ----------
    const crane = mk('g', {}, world);
    const craneBase = box(crane, '#a9a59c');
    const craneMast = mk('path', { stroke: '#c49a3c', 'stroke-width': 1.5, fill: 'none', 'stroke-linejoin': 'round' }, crane);
    const craneJib = mk('path', { stroke: '#c49a3c', 'stroke-width': 1.5, fill: 'none', 'stroke-linejoin': 'round' }, crane);
    const cranePend = mk('path', { stroke: '#8b6d2a', 'stroke-width': 1, fill: 'none' }, crane);
    const craneCab = box(crane, '#d2aa48');
    const craneWeight = box(crane, '#8f8b84');
    const craneCable = mk('path', { stroke: '#2b2b2b', 'stroke-width': 1, fill: 'none' }, crane);
    const craneLoad = box(crane, { top: '#d9b98f', left: '#b98f5e', right: '#957047' });
    const hook = mk('circle', { r: 2.4, fill: '#2b2b2b' }, crane);
    const MAST = [21.6, 1.4];

    // ---------- Vegetación frontal ----------
    const frontPlants = [
      palm(world, 22.7, 2.1, 6.2, 0.5, true),
      tree(world, 23.1, 7.2, 3.1, 1.3),
      palm(world, 1.7, 13.4, 6.6, -0.4, false),
      tree(world, 8.4, 14.4, 3.0, 1.55),
      bush(world, 12.8, 15.1, 1),
      bush(world, 0.9, 7.8, 0.9),
      bush(world, 23.2, 13.8, 1.1)
    ];
    const plants = [...backPlants, ...frontPlants];

    // ---------- Atardecer y luces ----------
    const dusk = mk('rect', { x: -200, y: -100, width: 1600, height: 760, fill: 'url(#sc-aura-dusk)' }, world);
    const glow = mk('g', {}, world);
    const spillA = mk('ellipse', { fill: 'url(#sc-aura-spill)' }, glow);
    const spillB = mk('ellipse', { fill: 'url(#sc-aura-spill)' }, glow);
    const poolGlow = mk('polygon', { fill: 'url(#sc-aura-poolglow)', 'clip-path': 'url(#sc-aura-clipPool)' }, glow);
    const glowPanes = [
      ...gPanesY.map(o => ({ el: mk('polygon', { fill: 'url(#sc-aura-warm)' }, glow), pts: faceY(9, o.r[0], o.r[1], 0.5, 2.5) })),
      ...uPanesY.map(o => ({ el: mk('polygon', { fill: 'url(#sc-aura-warm)' }, glow), pts: faceY(10, o.r[0], o.r[1], 4.15, 6.15) })),
      ...uPanesX.map(o => ({ el: mk('polygon', { fill: 'url(#sc-aura-warm)' }, glow), pts: faceX(16, o.r[0], o.r[1], 4.15, 6.15) }))
    ];
    glowPanes.forEach(o => o.el.setAttribute('points', o.pts));
    const lamps = [[6.5, 11.4], [6.6, 14.2], [14.4, 13.9], [22.2, 9]].map(([x, y]) => {
      const [bx, by] = P(x, y, 0);
      const g = mk('g', {}, glow);
      mk('ellipse', { cx: bx, cy: by, rx: 16, ry: 8, fill: 'url(#sc-aura-spill)' }, g);
      mk('rect', { x: bx - 1.5, y: by - 9, width: 3, height: 9, fill: '#3b3a36' }, g);
      mk('circle', { cx: bx, cy: by - 10, r: 2.6, fill: '#ffe2a6' }, g);
      return g;
    });

    // Cartela de plano (abajo a la derecha)
    const sheet = mk('g', { transform: 'translate(958 512)' });
    mk('text', { x: 0, y: 0, 'text-anchor': 'end', 'font-size': 18, class: 'sc-aura-t' }, sheet).textContent = 'Casa Aura';
    mk('text', { x: 0, y: 22, 'text-anchor': 'end', 'font-size': 13, class: 'sc-aura-t', fill: '#58605a', opacity: 0.85 }, sheet).textContent = '180 m² · 2 niveles';
    mk('line', { x1: -150, x2: 0, y1: -26, y2: -26, stroke: '#1d2320', 'stroke-opacity': 0.35 }, sheet);
    const sheetTexts = sheet.querySelectorAll('text');

    const SKY_DAY = ['#dfe3de', '#e9e6df', '#efebe3'], SKY_DUSK = ['#55647b', '#c99f92', '#f3cfa2'];

    function render(p) {
      // Cámara: arranca un poco más cerca y se abre con la obra.
      const cam = easeInOut(seg(p, 0, 0.7));
      const sc = lerp(1.05, 1, cam), dx = lerp(-12, 0, cam);
      world.setAttribute('transform', `translate(${(600 + dx).toFixed(2)} 320) scale(${sc.toFixed(4)}) translate(-600 -320)`);

      // Cielo y sol
      const eD = easeInOut(seg(p, 0.78, 0.98));
      skyStops.forEach((s, i) => s.setAttribute('stop-color', mix(SKY_DAY[i], SKY_DUSK[i], eD)));
      const sunT = easeInOut(p);
      const sx = lerp(372, 300, sunT), sy = lerp(84, 262, sunT);
      set(sunGlow, { cx: sx, cy: sy, r: lerp(150, 190, eD) });
      sunStops.forEach(s => s.setAttribute('stop-color', mix('#fff6df', '#ffc47e', eD)));
      set(sunCore, { cx: sx, cy: sy, fill: mix('#fffaf0', '#ffd394', eD), r: lerp(22, 26, eD) });
      clouds[0].setAttribute('transform', `translate(${lerp(760, 820, p).toFixed(1)} 84)`);
      clouds[1].setAttribute('transform', `translate(${lerp(420, 470, p).toFixed(1)} 150) scale(.9)`);
      clouds.forEach(c => c.setAttribute('fill', mix('#ffffff', '#f6c7b1', eD)));
      sheetTexts.forEach(t => t.setAttribute('fill', mix('#1d2320', '#2a2522', eD)));

      // Terreno: tierra nivelada → césped
      const eL = easeInOut(seg(p, 0.8, 0.9));
      ground.setAttribute('fill', mix('#d8cfbd', '#a7b78d', eL));
      bandL.setAttribute('fill', mix('#c0ad8f', '#8a9f70', eL));
      bandR.setAttribute('fill', mix('#a08d73', '#6c8058', eL));
      grid.setAttribute('stroke-opacity', (0.55 * (1 - seg(p, 0.8, 0.86)) * (1 - 0.45 * seg(p, 0.2, 0.3))).toFixed(3));
      stakes.setAttribute('opacity', (1 - seg(p, 0.15, 0.19)).toFixed(3));
      show(stakes, p < 0.19);

      // 1. Plano
      const bpFade = 1 - seg(p, 0.4, 0.52);
      bp.setAttribute('opacity', bpFade.toFixed(3));
      show(bp, bpFade > 0.001);
      bpPaths.forEach((el, i) => el.setAttribute('stroke-dashoffset', (1 - easeOut(seg(p, 0.015 + i * 0.013, 0.07 + i * 0.013))).toFixed(4)));
      bpLabels.forEach((el, i) => el.setAttribute('opacity', easeOut(seg(p, 0.07 + i * 0.012, 0.11 + i * 0.012)).toFixed(3)));

      // 2. Cimientos: excavación → vaciado → losa
      const eX = easeOut(seg(p, 0.15, 0.205));
      const ePour = easeInOut(seg(p, 0.205, 0.245));
      const eSlab = easeOut(seg(p, 0.245, 0.285));
      const pitOn = eX > 0 && p < 0.3;
      show(pitWrap, pitOn);
      if (pitOn) {
        const cx0 = 9, cy0 = 6, hw = lerp(0.6, 5.3, eX), hd = lerp(0.4, 3.8, eX), depth = -0.85 * eX;
        const x0 = cx0 - hw, x1 = cx0 + hw, y0 = cy0 - hd, y1 = cy0 + hd;
        pitRim.setAttribute('points', flat(x0, x1, y0, y1, 0));
        pitFloor.setAttribute('points', flat(x0, x1, y0, y1, depth));
        pitBack.setAttribute('points', faceY(y0, x0, x1, depth, 0));
        pitSide.setAttribute('points', faceX(x0, y0, y1, depth, 0));
        const zp = lerp(depth, 0, ePour);
        pour.setAttribute('points', flat(x0, x1, y0, y1, zp));
        show(pour, ePour > 0);
        pitWrap.setAttribute('opacity', (1 - seg(p, 0.27, 0.3)).toFixed(3));
      }
      slabF.set(3.9, 14.1, 2.6, 9.4, 0, 0.4 * eSlab);

      // Grúa: se arma, trabaja y se retira
      const up = easeOut(seg(p, 0.15, 0.22)), down = easeInOut(seg(p, 0.79, 0.845));
      const mz = 10 * up - 1.4 * down;
      const craneOn = mz > 0.05 && down < 1;
      show(crane, craneOn);
      if (craneOn) {
        crane.setAttribute('opacity', (1 - down).toFixed(3));
        const [mx, my] = MAST, w = 0.32;
        craneBase.set(mx - 0.7, mx + 0.7, my - 0.7, my + 0.7, 0, 0.35);
        let d = line([mx - w, my + w, 0.35], [mx - w, my + w, mz]) + line([mx + w, my + w, 0.35], [mx + w, my + w, mz]) + line([mx + w, my - w, 0.35], [mx + w, my - w, mz]);
        for (let z = 0.35, k = 0; z < mz - 0.05; z += 0.7, k++) {
          const z2 = Math.min(mz, z + 0.7);
          d += line([k % 2 ? mx + w : mx - w, my + w, z], [k % 2 ? mx - w : mx + w, my + w, z2]);
          d += line([mx + w, k % 2 ? my + w : my - w, z], [mx + w, k % 2 ? my - w : my + w, z2]);
        }
        craneMast.setAttribute('d', d);
        const jibOn = seg(p, 0.2, 0.23);
        const th = (keys(p, [[0.2, 190], [0.27, 166], [0.36, 158], [0.42, 148], [0.5, 166], [0.58, 152], [0.66, 128], [0.73, 112], [0.8, 150], [0.86, 190]]) * Math.PI) / 180;
        const ux = Math.cos(th), uy = Math.sin(th);
        const L = 12.5 * jibOn, Lc = 4 * jibOn;
        const tip = [mx + ux * L, my + uy * L], back = [mx - ux * Lc, my - uy * Lc];
        let j = line([back[0], back[1], mz], [tip[0], tip[1], mz]) + line([back[0], back[1], mz + 0.55], [tip[0], tip[1], mz + 0.55]);
        const n = Math.max(1, Math.round((L + Lc) / 0.8));
        for (let k = 0; k < n; k++) {
          const t0 = -Lc + ((L + Lc) * k) / n, t1 = -Lc + ((L + Lc) * (k + 1)) / n;
          j += line([mx + ux * t0, my + uy * t0, k % 2 ? mz + 0.55 : mz], [mx + ux * t1, my + uy * t1, k % 2 ? mz : mz + 0.55]);
        }
        craneJib.setAttribute('d', jibOn > 0 ? j : '');
        const apex = [mx, my, mz + 2.4];
        cranePend.setAttribute('d', jibOn > 0 ? line([mx, my, mz + 0.55], apex) + line(apex, [mx + ux * L * 0.62, my + uy * L * 0.62, mz + 0.55]) + line(apex, [back[0], back[1], mz + 0.55]) : '');
        craneCab.set(mx - 0.25 + 0.55, mx + 0.35 + 0.55, my - 0.3, my + 0.3, mz - 0.6, mz, up);
        craneWeight.set(back[0] - 0.4, back[0] + 0.4, back[1] - 0.4, back[1] + 0.4, mz - 0.6, mz + 0.3, jibOn);
        const td = keys(p, [[0.2, 9], [0.28, 10.5], [0.36, 11.5], [0.44, 9], [0.52, 11.8], [0.6, 10], [0.68, 8.6], [0.74, 6.2], [0.8, 9]]) * jibOn;
        const hz = Math.min(keys(p, [[0.2, mz - 1], [0.26, 9.3], [0.32, 7.7], [0.36, 9.3], [0.44, 7.8], [0.49, 9.3], [0.56, 7.8], [0.6, 9.3], [0.7, 7.6], [0.76, 9.3]]) - 1.4 * down, mz - 0.5);
        const tx = mx + ux * td, ty = my + uy * td;
        craneCable.setAttribute('d', jibOn > 0 ? line([tx, ty, mz], [tx, ty, hz]) : '');
        const hk = P(tx, ty, hz);
        set(hook, { cx: hk[0], cy: hk[1], opacity: jibOn });
        const carry = (p > 0.24 && p < 0.33) || (p > 0.39 && p < 0.455) || (p > 0.53 && p < 0.575) || (p > 0.64 && p < 0.71);
        craneLoad.set(tx - 0.6, tx + 0.6, ty - 0.35, ty + 0.35, hz - 0.65, hz - 0.15, carry && jibOn > 0 ? 1 : 0);
        shCrane.setAttribute('points', shadowOf(mx - w, mx + w, my - w, my + w, 0, mz));
      }
      show(shCrane, craneOn);

      // 3. Estructura
      colsG.forEach((c, i) => {
        const e = easeOut(seg(p, 0.3 + i * 0.011, 0.355 + i * 0.011));
        const z1 = lerp(0.4, 3.6, e);
        c.b.set(c.x - 0.26, c.x + 0.26, c.y - 0.26, c.y + 0.26, 0.4, e > 0 ? z1 : 0.4);
        show(shCols[i], e > 0);
        if (e > 0) shCols[i].setAttribute('points', shadowOf(c.x - 0.26, c.x + 0.26, c.y - 0.26, c.y + 0.26, 0, z1));
      });
      const beamSet = (list, z0, t0, gap) => list.forEach((o, i) => {
        const e = easeOut(seg(p, t0 + i * gap, t0 + 0.05 + i * gap));
        const mid = (o.from + o.to) / 2, a = lerp(mid, o.from, e), b = lerp(mid, o.to, e);
        if (o.a === 'x') o.b.set(a, b, o.at - 0.2, o.at + 0.2, z0, z0 + 0.4, e > 0 ? 1 : 0);
        else o.b.set(o.at - 0.2, o.at + 0.2, a, b, z0, z0 + 0.4, e > 0 ? 1 : 0);
      });
      beamSet(beamsF, 3.6, 0.36, 0.009);
      colsU.forEach((c, i) => {
        const e = easeOut(seg(p, 0.405 + i * 0.008, 0.44 + i * 0.008));
        c.b.set(c.x - 0.22, c.x + 0.22, c.y - 0.22, c.y + 0.22, 4, e > 0 ? lerp(4, 6.4, e) : 4);
        show(shUp[i], e > 0);
        if (e > 0) shUp[i].setAttribute('points', shadowOf(c.x - 0.22, c.x + 0.22, c.y - 0.22, c.y + 0.22, 4, lerp(4, 6.4, e)));
      });
      beamSet(beamsR, 6.4, 0.43, 0.007);
      const eLv = seg(p, 0.33, 0.37) * (1 - seg(p, 0.6, 0.64));
      levels.setAttribute('opacity', eLv.toFixed(3));
      show(levels, eLv > 0.001);
      levelEls.forEach((g, i) => g.setAttribute('opacity', seg(p, 0.33 + i * 0.05, 0.37 + i * 0.05).toFixed(3)));

      // 4. Muros y losas
      const eS = easeOut(seg(p, 0.46, 0.51));
      const ux0 = lerp(4.5, 2.5, eS), ux1 = lerp(13, 16, eS), uy0 = lerp(3, 2, eS), uy1 = lerp(9, 10, eS);
      slabU.set(ux0, ux1, uy0, uy1, 3.6, 4.0, eS > 0 ? Math.min(1, eS * 4) : 0);
      const eG = easeOut(seg(p, 0.49, 0.55));
      const gz = lerp(0.4, 3.6, eG);
      wallsG.set(4.5, 13, 3, 9, 0.4, eG > 0 ? gz : 0.4);
      const eU = easeOut(seg(p, 0.53, 0.59));
      const uz = lerp(4, 6.4, eU);
      wallsU.set(2.5, 16, 2, 10, 4, eU > 0 ? uz : 4);
      const eR = seg(p, 0.585, 0.625);
      const rz = lerp(1.6, 0, easeBack(eR, 1.2));
      roof.set(2.3, 16.2, 1.8, 10.2, 6.4 + rz, 6.75 + rz, eR > 0 ? Math.min(1, eR * 3) : 0);
      const fz0 = 0.4;
      // sombras de volúmenes
      show(shF, eSlab > 0);
      if (eSlab > 0) shF.setAttribute('points', shadowOf(3.9, 14.1, 2.6, 9.4, 0, 0.4 * eSlab));
      show(shG, eG > 0);
      if (eG > 0) shG.setAttribute('points', shadowOf(4.5, 13, 3, 9, fz0, gz));
      const uTop = eR > 0 ? 6.75 : eU > 0 ? uz : 4;
      show(shU, eS > 0);
      if (eS > 0) shU.setAttribute('points', shadowOf(ux0, ux1, uy0, uy1, 3.6, uTop));
      show(shAO, eS > 0);
      if (eS > 0) set(shAO, { points: flat(ux0, ux1, uy0, uy1, 0), opacity: (0.35 * eS).toFixed(3) });

      // 5. Ventanales y madera
      gPanesY.forEach((o, i) => {
        const e = easeOut(seg(p, 0.62 + i * 0.014, 0.665 + i * 0.014));
        const off = (1 - e) * -1.4;
        show(o.el, e > 0);
        if (e > 0) set(o.el, { points: faceY(9, o.r[0] + off, o.r[1] + off, 0.45, 3.55), opacity: e.toFixed(3) });
      });
      gPanesX.forEach((o, i) => {
        const e = easeOut(seg(p, 0.63 + i * 0.014, 0.675 + i * 0.014));
        show(o.el, e > 0);
        if (e > 0) set(o.el, { points: faceX(13, o.r[0] - (1 - e) * 1.4, o.r[1] - (1 - e) * 1.4, 0.45, 3.55), opacity: e.toFixed(3) });
      });
      const eDoor = easeOut(seg(p, 0.69, 0.73));
      show(door, eDoor > 0);
      if (eDoor > 0) door.setAttribute('points', faceY(9, 5.0, 5.95, 0.4, lerp(0.4, 2.7, eDoor)));
      const eBk = easeOut(seg(p, 0.64, 0.68));
      show(uDeco, eU >= 1);
      show(backing, eBk > 0);
      if (eBk > 0) set(backing, { points: faceY(10, 2.5, lerp(2.5, 10.4, eBk), 4.05, 6.35) });
      let sd = '', ssd = '';
      for (let k = 0, x = 2.75; x < 10.3; x += 0.36, k++) {
        const e = easeOut(seg(p, 0.66 + k * 0.0028, 0.69 + k * 0.0028));
        if (e <= 0) continue;
        const z1 = lerp(4.05, 6.35, e);
        sd += line([x, 10.02, 4.05], [x, 10.02, z1]);
        ssd += line([x, 10.02, 4.05], [x, 10.02, z1]);
      }
      slats.setAttribute('d', sd);
      slatShade.setAttribute('d', ssd);
      uPanesY.forEach((o, i) => {
        const e = easeOut(seg(p, 0.645 + i * 0.014, 0.69 + i * 0.014));
        const off = (1 - e) * 1.6;
        show(o.el, e > 0);
        if (e > 0) set(o.el, { points: faceY(10, o.r[0] + off, o.r[1] + off, 4.15, 6.25), opacity: e.toFixed(3) });
      });
      uPanesX.forEach((o, i) => {
        const e = easeOut(seg(p, 0.655 + i * 0.012, 0.7 + i * 0.012));
        const off = (1 - e) * -1.5;
        show(o.el, e > 0);
        if (e > 0) set(o.el, { points: faceX(16, o.r[0] + off, o.r[1] + off, 4.15, 6.25), opacity: e.toFixed(3) });
      });
      const eDeck = easeInOut(seg(p, 0.7, 0.77));
      const dx1 = lerp(14, 22.5, eDeck);
      deck.set(14, dx1, 3.4, 13.4, 0, 0.25, eDeck > 0 ? 1 : 0);
      let pd = '';
      if (eDeck > 0) for (let y = 3.9; y < 13.4; y += 0.5) pd += line([14, y, 0.25], [dx1, y, 0.25]);
      planks.setAttribute('d', pd);
      const ePool = seg(p, 0.75, 0.78);
      pool.setAttribute('opacity', ePool.toFixed(3));
      coping.setAttribute('opacity', ePool.toFixed(3));
      show(pool, ePool > 0);
      show(coping, ePool > 0);

      // 6. Luz y paisaje
      const eW = easeInOut(seg(p, 0.82, 0.9));
      const zw = lerp(-0.9, 0.14, eW);
      water.setAttribute('points', flat(15.8, 21.6, 9.6, 12.6, zw));
      show(water, eW > 0);
      shimmerWrap.setAttribute('transform', `translate(0 ${((0 - zw) * S).toFixed(1)})`);
      shimmerWrap.setAttribute('opacity', (eW * 0.9).toFixed(3));
      stones.forEach((b, i) => {
        const e = easeBack(seg(p, 0.82 + i * 0.012, 0.86 + i * 0.012));
        const [x, y] = [[5.2, 10.6], [4.8, 12.2], [5.4, 13.8]][i];
        b.set(x - 0.65 * e, x + 0.65 * e, y - 0.45 * e, y + 0.45 * e, 0, 0.08, e > 0 ? 1 : 0);
      });
      plants.forEach((pl, i) => {
        const order = [0, 3, 1, 4, 2, 5, 6, 7][i] ?? i;
        const e = seg(p, 0.835 + order * 0.016, 0.9 + order * 0.016);
        const s = easeBack(e, 1.9);
        show(pl.g, e > 0);
        if (e > 0) grow(pl.g, pl.bx, pl.by, Math.max(0.001, s));
      });
      treeSpots.forEach((t, i) => {
        const order = [0, 3, 1, 4, 2][i] ?? i;
        const e = easeOut(seg(p, 0.835 + order * 0.016, 0.9 + order * 0.016));
        show(t.el, e > 0);
        if (e > 0) {
          const [cx, cy] = P(t.x + t.h * SUN[0] * 0.12, t.y + t.h * SUN[1] * 0.12, 0);
          set(t.el, { cx, cy, rx: 1.22 * t.r * S * e * 0.85, ry: 0.71 * t.r * S * e * 0.6 });
        }
      });
      const ePl = easeBack(seg(p, 0.86, 0.91));
      planter.set(3.1, 4.6, 2.6, 9.4, 6.75, lerp(6.75, 7.0, ePl), ePl > 0 ? 1 : 0);
      rp.forEach((o, i) => {
        const e = easeBack(seg(p, 0.88 + i * 0.01, 0.93 + i * 0.01), 2);
        show(o.g, e > 0);
        if (e > 0) grow(o.g, o.bx, o.by, Math.max(0.001, e));
      });

      // Atardecer y luces encendidas: la luz cálida baña techos y caras al sol
      const warmFace = (bx, idx, base, amt) => { const c = mix(base, '#ffd9b0', eD * amt); const el = bx.g.children[idx]; el.setAttribute('fill', c); el.setAttribute('stroke', c); };
      warmFace(roof, 2, '#f6f2ea', 0.75);
      warmFace(roof, 0, '#ded9cf', 0.5);
      warmFace(wallsU, 0, '#e6e2da', 0.45);
      warmFace(slabU, 0, '#d3cfc6', 0.4);
      warmFace(wallsG, 0, '#c9c5bc', 0.3);
      dusk.setAttribute('opacity', (eD * 0.85).toFixed(3));
      show(dusk, eD > 0);
      shadows.setAttribute('opacity', lerp(0.2, 0.13, eD).toFixed(3));
      const eOn = seg(p, 0.88, 0.95);
      glowPanes.forEach((o, i) => {
        const e = easeOut(seg(p, 0.885 + i * 0.008, 0.92 + i * 0.008));
        o.el.setAttribute('opacity', (e * 0.94).toFixed(3));
        show(o.el, e > 0);
      });
      const [ax, ay] = P(8.8, 10.6, 0), [bx, by] = P(15, 6.5, 0);
      set(spillA, { cx: ax, cy: ay, rx: 120, ry: 34, opacity: (easeOut(eOn) * 0.9).toFixed(3) });
      set(spillB, { cx: bx, cy: by, rx: 70, ry: 30, opacity: (easeOut(eOn) * 0.75).toFixed(3) });
      const ePg = easeOut(seg(p, 0.91, 0.97));
      set(poolGlow, { points: flat(15.8, 21.6, 9.6, 12.6, zw), opacity: ePg.toFixed(3) });
      water.setAttribute('fill', 'url(#sc-aura-water)');
      lamps.forEach((g, i) => {
        const e = easeOut(seg(p, 0.92 + i * 0.012, 0.95 + i * 0.012));
        g.setAttribute('opacity', e.toFixed(3));
        show(g, e > 0);
      });
      show(glow, eOn > 0 || ePg > 0);
    }

    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.aura = {
    title: 'Una casa AURA, de cero a habitable',
    duration: 18000,
    steps: [
      { label: 'Plano y terreno', at: 0 },
      { label: 'Cimientos', at: 0.15 },
      { label: 'Estructura', at: 0.3 },
      { label: 'Muros y losas', at: 0.46 },
      { label: 'Ventanales y madera', at: 0.62 },
      { label: 'Luz y paisaje', at: 0.78 }
    ],
    mount
  };
})();
