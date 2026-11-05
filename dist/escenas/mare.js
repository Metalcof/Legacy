'use strict';
// Escena de Maré en 3D: la barra de la cafetería construida en un espacio CSS 3D real.
// Cada pieza (encimera, máquina, molino, taza, jarra, horno, bandeja) es un plano con su material
// (mármol, acero, cerámica, madera) colocado con perspectiva; la cámara hace dolly y órbita según p.
// render(p) es una función pura del progreso (0..1): solo cambia transform, opacity y atributos.
// Los únicos bucles (vapor, bokeh, brillo de la ventana) son CSS ambiental y se detienen con motion-paused.
(() => {
  // Ruta de la foto del fondo desenfocado: se resuelve desde este archivo (index.html y escenas/prueba.html).
  const HERE = (document.currentScript && document.currentScript.src) || '';
  const asset = name => {
    try { if (HERE) return new URL(`../assets/${name}`, HERE).href; } catch (e) { /* sigue abajo */ }
    return (location.pathname.includes('/escenas/') ? '../assets/' : 'assets/') + name;
  };
  const BG_PHOTO = asset('cafe-editorial-small.webp');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t * t;
  const eIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = (t, s = 1.6) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
  const frac = v => v - Math.floor(v);
  const bell = (p, a, b, c, d) => seg(p, a, b) * (1 - seg(p, c, d));
  const n = v => (Math.abs(v) < 0.005 ? 0 : Math.round(v * 100) / 100);
  const f3 = v => (Math.round(v * 1000) / 1000).toString();
  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

  // ---------- Texturas generadas una sola vez (canvas, con azar fijo) ----------
  const rng = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const makeCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let FILTER_OK = null;
  const filterOK = () => {
    if (FILTER_OK === null) { try { const x = makeCanvas(1, 1).getContext('2d'); x.filter = 'blur(2px)'; FILTER_OK = x.filter === 'blur(2px)'; } catch (e) { FILTER_OK = false; } }
    return FILTER_OK;
  };
  const addNoise = (ctx, w, h, amp, r) => {
    const img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (r() - 0.5) * amp; d[i] += v; d[i + 1] += v; d[i + 2] += v * 0.9; }
    ctx.putImageData(img, 0, 0);
  };

  // Mármol travertino cálido con vetas, poros y la luz de la ventana proyectada.
  function marble(w, h, seed, sun) {
    const c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
    let g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#d8cab7'); g.addColorStop(0.45, '#e6dac9'); g.addColorStop(1, '#efe5d7');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) {
      const cx = r() * w, cy = r() * h, rad = (0.03 + r() * 0.12) * w * 0.4;
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      const tone = r() < 0.5 ? '190,168,138' : '252,246,236';
      rg.addColorStop(0, `rgba(${tone},${0.08 + r() * 0.1})`); rg.addColorStop(1, `rgba(${tone},0)`);
      x.fillStyle = rg; x.beginPath(); x.ellipse(cx, cy, rad, rad * 0.45, 0, 0, Math.PI * 2); x.fill();
    }
    // Poros del travertino: alargados en la dirección de la veta.
    for (let i = 0; i < w * h / 900; i++) {
      x.fillStyle = `rgba(${130 + r() * 30},${108 + r() * 25},${82 + r() * 20},${0.1 + r() * 0.22})`;
      x.beginPath(); x.ellipse(r() * w, r() * h, 0.6 + r() * 4.5, 0.4 + r() * 1.1, (r() - 0.5) * 0.25, 0, Math.PI * 2); x.fill();
    }
    const vein = (lw, a, blur) => {
      if (blur && filterOK()) x.filter = `blur(${blur}px)`;
      for (let i = 0; i < 9; i++) {
        let px = -40, py = r() * h; const dy = (r() - 0.5) * 0.5;
        x.beginPath(); x.moveTo(px, py);
        while (px < w + 40) { const nx = px + 40 + r() * 90, ny = py + (r() - 0.5) * 34 + dy * 60; x.quadraticCurveTo(px + (nx - px) / 2, py + (r() - 0.5) * 40, nx, ny); px = nx; py = ny; }
        x.strokeStyle = `rgba(150,124,96,${a * (0.5 + r() * 0.8)})`; x.lineWidth = lw * (0.5 + r()); x.stroke();
      }
      x.filter = 'none';
    };
    vein(5, 0.12, 3); vein(1.1, 0.22, 0); vein(0.6, 0.3, 0);
    addNoise(x, w, h, 14, r);
    if (sun) {
      // Luz de ventana sobre la piedra: paños de sol con la sombra de los parteluces.
      x.globalCompositeOperation = 'screen';
      if (filterOK()) x.filter = `blur(${Math.round(w / 260)}px)`;
      sun.forEach(([x0, wd, sk, a]) => {
        for (let k = 0; k < 3; k++) {
          const xa = (x0 + k * wd * 1.18) * w, xb = xa + wd * w;
          x.fillStyle = `rgba(255,236,196,${a})`;
          x.beginPath(); x.moveTo(xa, 0); x.lineTo(xb, 0); x.lineTo(xb + sk * w, h); x.lineTo(xa + sk * w, h); x.closePath(); x.fill();
        }
      });
      x.filter = 'none';
      x.globalCompositeOperation = 'source-over';
    }
    return c;
  }

  // Madera (vetas largas) para la bandeja y el mueble de la barra.
  function wood(w, h, seed, base, dark, light, vertical) {
    const c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    const L = vertical ? h : w, S = vertical ? w : h;
    for (let i = 0; i < S * 1.4; i++) {
      const s0 = r() * S, amp = 1 + r() * 4, fq = 0.004 + r() * 0.012, ph = r() * 6;
      x.beginPath();
      for (let t = 0; t <= L; t += 6) { const s = s0 + Math.sin(t * fq + ph) * amp + Math.sin(t * fq * 3.1) * amp * 0.3; if (vertical) x.lineTo(s, t); else x.lineTo(t, s); }
      x.strokeStyle = r() < 0.6 ? `rgba(${dark},${0.05 + r() * 0.14})` : `rgba(${light},${0.04 + r() * 0.1})`;
      x.lineWidth = 0.5 + r() * 1.6; x.stroke();
    }
    addNoise(x, w, h, 10, r);
    return c;
  }

  // Acero cepillado: rayas finas horizontales (se usa como capa de superposición).
  function brushed(w, h, seed) {
    const c = makeCanvas(w, h), x = c.getContext('2d'), r = rng(seed);
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < h * 9; i++) {
      const y = r() * h, x0 = r() * w * 1.2 - w * 0.2, len = w * (0.2 + r() * 0.9), v = r() < 0.5 ? 255 : 0;
      x.strokeStyle = `rgba(${v},${v},${v},${0.04 + r() * 0.1})`; x.lineWidth = 0.6 + r() * 0.8;
      x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + len, y + (r() - 0.5)); x.stroke();
    }
    return c;
  }

  // Grano de película estático.
  function grain(size, seed) {
    const c = makeCanvas(size, size), x = c.getContext('2d'), r = rng(seed);
    const img = x.createImageData(size, size), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(img, 0, 0);
    return c;
  }

  let TEX = null;
  function textures() {
    if (TEX) return TEX;
    const counter = marble(2048, 410, 11, [[0.2, 0.035, -0.07, 0.2], [0.4, 0.03, -0.07, 0.17]]);
    const macro = marble(1200, 800, 23, [[0.02, 0.09, -0.25, 0.16]]);
    const oak = wood(720, 300, 5, '#a8784e', '74,44,22', '238,200,150', false);
    const walnut = wood(256, 700, 9, '#4a2f1f', '20,10,4', '160,110,70', true);
    TEX = {
      counter: counter.toDataURL('image/jpeg', 0.9),
      macro: macro.toDataURL('image/jpeg', 0.88),
      oak: oak.toDataURL('image/jpeg', 0.9),
      walnut: walnut.toDataURL('image/jpeg', 0.88),
      brushed: brushed(512, 160, 3).toDataURL('image/png'),
      grain: grain(160, 4).toDataURL('image/png')
    };
    return TEX;
  }

  // ---------- Materiales SVG (definidos una sola vez y compartidos por todas las piezas) ----------
  const stops = list => list.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('');
  const lin = (id, dir, list) => `<linearGradient id="sc-mare-${id}" ${dir === 'v' ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"'}>${stops(list)}</linearGradient>`;
  const rad = (id, attrs, list) => `<radialGradient id="sc-mare-${id}" ${attrs}>${stops(list)}</radialGradient>`;
  const DEFS = `
<svg class="sc-mare-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
  ${lin('steel', 'v', [[0, '#f7f3ed'], [0.08, '#e6e0d8'], [0.3, '#b3aba1'], [0.47, '#7a736b'], [0.56, '#6a635c'], [0.68, '#a39b91'], [0.84, '#e2dcd3'], [1, '#b9b1a7']])}
  ${lin('steelD', 'v', [[0, '#3e3833'], [0.25, '#5b544d'], [0.6, '#857d74'], [1, '#c3bbb1']])}
  ${lin('steelTop', 'v', [[0, '#8f877e'], [0.6, '#c9c2b9'], [1, '#f4efe8']])}
  ${lin('chrome', 'h', [[0, '#3c3731'], [0.07, '#8a837a'], [0.17, '#fdfaf5'], [0.26, '#d6d0c7'], [0.44, '#7a736a'], [0.6, '#3a352f'], [0.74, '#8f887f'], [0.86, '#ebe6de'], [0.95, '#9b948a'], [1, '#4d4741']])}
  ${lin('chromeV', 'v', [[0, '#fffdf8'], [0.3, '#d2ccc3'], [0.55, '#6f685f'], [0.8, '#a7a096'], [1, '#4a443e']])}
  ${rad('chromeR', 'cx=".36" cy=".3" r=".78"', [[0, '#fffdf9'], [0.3, '#ddd7cf'], [0.62, '#7d766d'], [0.85, '#3a352f'], [1, '#8e877e']])}
  ${lin('cer', 'h', [[0, '#a3937f'], [0.08, '#dcd0bf'], [0.2, '#fbf6ee'], [0.27, '#fffcf6'], [0.36, '#f4ece0'], [0.62, '#ddd0be'], [0.85, '#b5a590'], [0.94, '#a29280'], [1, '#c9baa6']])}
  ${lin('cerAO', 'v', [[0, 'rgba(70,45,25,0)'], [0.55, 'rgba(70,45,25,0)'], [1, 'rgba(70,45,25,.32)']])}
  ${rad('cerTop', 'cx=".4" cy=".36" r=".7"', [[0, '#fffefb'], [0.6, '#f5eee3'], [0.9, '#e2d6c5'], [1, '#cdbfac']])}
  ${rad('cerWell', 'cx=".56" cy=".6" r=".6"', [[0, '#f8f2e9'], [0.75, '#ece2d4'], [1, '#d9ccba']])}
  ${rad('innerWall', 'cx=".5" cy=".5" r=".5"', [[0, 'rgba(60,35,18,0)'], [0.82, 'rgba(60,35,18,0)'], [1, 'rgba(60,35,18,.5)']])}
  ${lin('black', 'h', [[0, '#0d0b09'], [0.1, '#26211c'], [0.22, '#4d453e'], [0.3, '#3d362f'], [0.52, '#1b1713'], [0.8, '#0c0a08'], [0.93, '#2b2520'], [1, '#5a4e43']])}
  ${lin('terra', 'h', [[0, '#5c2610'], [0.14, '#9b4b23'], [0.27, '#dc9465'], [0.35, '#c06c3c'], [0.6, '#9a4a22'], [0.88, '#5e2810'], [1, '#86401d']])}
  ${lin('terraSideR', 'h', [[0, '#f0b386'], [0.05, '#cf7d4b'], [0.35, '#a4572c'], [0.75, '#7d3a19'], [1, '#5a260f']])}
  ${lin('terraSideL', 'h', [[0, '#5a260f'], [0.25, '#7d3a19'], [0.65, '#a4572c'], [0.95, '#cf7d4b'], [1, '#f0b386']])}
  ${lin('lacquerV', 'v', [[0, 'rgba(255,255,255,.3)'], [0.12, 'rgba(255,255,255,0)'], [0.75, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.28)']])}
  ${lin('glass', 'h', [[0, 'rgba(255,255,255,.55)'], [0.07, 'rgba(255,255,255,.14)'], [0.2, 'rgba(255,255,255,.03)'], [0.78, 'rgba(255,255,255,.03)'], [0.9, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,.5)']])}
  ${rad('bean', 'cx=".34" cy=".3" r=".8"', [[0, '#9a5a30'], [0.45, '#5e3117'], [1, '#26120a']])}
  ${rad('ground', 'cx=".45" cy=".3" r=".8"', [[0, '#6b3d20'], [0.6, '#43240f'], [1, '#2a160a']])}
  ${rad('crema', 'cx=".46" cy=".44" r=".58"', [[0, '#ecc189'], [0.35, '#d19452'], [0.72, '#a8632b'], [0.92, '#7a3d16'], [1, '#5a2b0f']])}
  ${rad('esp', 'cx=".45" cy=".42" r=".6"', [[0, '#7a4019'], [0.7, '#3d1b09'], [1, '#241005']])}
  ${rad('milk', 'cx=".42" cy=".35" r=".72"', [[0, '#fffefb'], [0.6, '#fbf4ea'], [1, '#eadcca']])}
  ${rad('sh', '', [[0, 'rgba(32,18,8,.55)'], [0.45, 'rgba(32,18,8,.24)'], [1, 'rgba(32,18,8,0)']])}
  ${rad('heat', 'cx=".5" cy=".62" r=".7"', [[0, '#ffefc0'], [0.3, '#ffbe63'], [0.65, '#ee7a26'], [1, '#8a300c']])}
  ${rad('cavity', 'cx=".5" cy=".42" r=".72"', [[0, '#3b2a20'], [0.55, '#1d140f'], [1, '#0b0705']])}
  ${lin('graph', 'v', [[0, '#57504a'], [0.05, '#38322d'], [0.45, '#27231f'], [1, '#161311']])}
  ${lin('graphSide', 'h', [[0, '#3e3833'], [0.5, '#2a2521'], [1, '#191614']])}
  ${rad('crB', 'cx=".46" cy=".24" r=".85"', [[0, '#ffd994'], [0.28, '#efa64c'], [0.6, '#c56a20'], [0.86, '#8a3f0f'], [1, '#5c2709']])}
  ${rad('crR', 'cx=".46" cy=".24" r=".85"', [[0, '#fff6e0'], [0.4, '#f1dcae'], [0.8, '#d6b47e'], [1, '#b48f5a']])}
  ${rad('puff', '', [[0, 'rgba(255,255,255,.9)'], [0.5, 'rgba(255,255,255,.38)'], [1, 'rgba(255,255,255,0)'] ])}
  ${lin('stream', 'h', [[0, '#5a2a0e'], [0.35, '#c27a3a'], [0.55, '#e9a964'], [1, '#6a3311']])}
  <pattern id="sc-mare-speck" width="17" height="13" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r=".7" fill="#6a4a33" fill-opacity=".45"/><circle cx="11" cy="2" r=".45" fill="#6a4a33" fill-opacity=".35"/><circle cx="14" cy="9" r=".8" fill="#5a3d2a" fill-opacity=".35"/><circle cx="7" cy="11" r=".5" fill="#6a4a33" fill-opacity=".4"/></pattern>
  <pattern id="sc-mare-foam" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.8" r=".9" fill="#fff4e2" fill-opacity=".2"/><circle cx="5" cy="4.6" r=".6" fill="#3a1a08" fill-opacity=".18"/><circle cx="4.6" cy="1" r=".4" fill="#fff4e2" fill-opacity=".25"/></pattern>
  <pattern id="sc-mare-grate" width="9" height="20" patternUnits="userSpaceOnUse"><rect width="9" height="20" fill="#8a837a"/><rect x="2" y="2" width="4.5" height="16" rx="2" fill="#2a2520"/></pattern>
</defs></svg>`;

  const svg = (w, h, inner, vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb || `0 0 ${w} ${h}`}" width="${w}" height="${h}" aria-hidden="true" focusable="false">${inner}</svg>`;
  const svgSlice = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${inner}</svg>`;
  const img = (href, x, y, w, h, extra = '') => `<image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" ${extra}/>`;

  // ---------- Piezas ----------
  // Granos dentro de la tolva del molino (filas con algo de azar fijo).
  function hopperBeans() {
    const r = rng(31);
    let out = '';
    for (let row = 0; row < 12; row++) {
      const y = 150 - row * 8.2;
      const hw = 26 + (152 - y) / 106 * 44;
      for (let x = 100 - hw + 4; x < 100 + hw - 3; x += 11.5) {
        const bx = x + (row % 2) * 5 + (r() - 0.5) * 3, by = y + (r() - 0.5) * 3, a = Math.round(r() * 180);
        out += `<g transform="translate(${n(bx)} ${n(by)}) rotate(${a})"><ellipse rx="6.4" ry="4.4" fill="url(#sc-mare-bean)"/><path d="M-4.6 .2Q0-1.6 4.6 .2" stroke="#1d0d05" stroke-width="1" fill="none" stroke-linecap="round"/></g>`;
      }
    }
    return out;
  }
  const beanG = () => '<g><ellipse rx="6.6" ry="4.6" fill="url(#sc-mare-bean)"/><path d="M-4.8 .2Q0-1.7 4.8 .2" stroke="#1d0d05" stroke-width="1.1" fill="none" stroke-linecap="round"/><ellipse cx="-2" cy="-2.2" rx="2.2" ry=".9" fill="#fff" fill-opacity=".2"/></g>';

  const GRINDER = tex => svg(200, 420, `
    <clipPath id="sc-mare-hop"><path d="M30 46L72 152H128L170 46Z"/></clipPath>
    <path d="M26 370Q26 360 38 360H162Q174 360 174 370V398Q100 414 26 398Z" fill="url(#sc-mare-black)"/>
    <ellipse cx="100" cy="361" rx="70" ry="6.5" fill="#3a332c"/>
    <path d="M34 360.5Q100 354 166 360.5" stroke="#fff" stroke-opacity=".22" stroke-width="1.4" fill="none"/>
    <circle cx="150" cy="384" r="3" fill="#9fd08a"/><circle cx="150" cy="384" r="7" fill="#9fd08a" fill-opacity=".18"/>
    <path d="M48 362L57 178H143L152 362Z" fill="url(#sc-mare-black)"/>
    <path d="M64 182L58 358H74L78 182Z" fill="#fff" fill-opacity=".07"/>
    <path d="M142 180L151 360" stroke="#ffcf9e" stroke-opacity=".28" stroke-width="1.4"/>
    ${img(tex.brushed, 48, 178, 104, 184, 'opacity=".12" style="mix-blend-mode:overlay"')}
    <rect x="50" y="152" width="100" height="28" rx="4" fill="url(#sc-mare-chrome)"/>
    <path d="M50 160H150M50 171H150" stroke="#000" stroke-opacity=".2"/>
    <path d="M50 152.6H150" stroke="#fff" stroke-opacity=".7"/>
    <g clip-path="url(#sc-mare-hop)">
      <rect x="20" y="40" width="160" height="120" fill="#f3e6d2" fill-opacity=".1"/>
      <g data-k="beans">${hopperBeans()}</g>
      <rect x="20" y="140" width="160" height="14" fill="#000" fill-opacity=".18"/>
    </g>
    <path d="M30 46L72 152H128L170 46Z" fill="url(#sc-mare-glass)"/>
    <path d="M30 46L72 152M170 46L128 152" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" fill="none"/>
    <path d="M44 56L80 146" stroke="#fff" stroke-opacity=".42" stroke-width="4" stroke-linecap="round"/>
    <path d="M54 54L86 136" stroke="#fff" stroke-opacity=".2" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M156 56L126 140" stroke="#fff" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>
    <path d="M24 44Q24 30 40 28H160Q176 30 176 44Q100 56 24 44Z" fill="url(#sc-mare-black)"/>
    <ellipse cx="100" cy="30.5" rx="62" ry="7.5" fill="#3d362f"/>
    <path d="M44 28Q100 22 156 28" stroke="#fff" stroke-opacity=".25" stroke-width="1.2" fill="none"/>
    <rect x="91" y="15" width="18" height="14" rx="5" fill="url(#sc-mare-terra)"/>
    <g transform="translate(100 214)">
      <circle r="19" fill="#000" fill-opacity=".35" transform="translate(1.5 2)"/>
      <circle r="18" fill="url(#sc-mare-chromeR)"/><circle r="13.5" fill="url(#sc-mare-terra)"/>
      <circle r="13.5" fill="none" stroke="#000" stroke-opacity=".25"/>
      <line data-k="dial" x1="0" y1="0" x2="0" y2="-10" stroke="#fff7ec" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <rect x="80" y="244" width="40" height="17" rx="3.5" fill="#0b0908" stroke="#fff" stroke-opacity=".12"/>
    <text data-k="gdisp" x="100" y="257" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="700" fill="#ffb35c">18,0</text>
    <path d="M86 268H114L109 286H91Z" fill="url(#sc-mare-chrome)"/>
    <rect x="89" y="284" width="22" height="4" rx="1.5" fill="#1a1512"/>
    <path d="M62 320H84M116 320H138" stroke="url(#sc-mare-chromeV)" stroke-width="6" stroke-linecap="round"/>
    <path d="M60 322V336M140 322V336" stroke="#2a2420" stroke-width="5" stroke-linecap="round"/>
    <text x="100" y="342" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="3" fill="#fff" fill-opacity=".55">MARÉ</text>
    <g data-k="grounds" fill="#4a2a17">${'<circle r="1.6"/>'.repeat(7)}</g>
  `);

  const FALL = svg(120, 420, `<g data-k="fall">${beanG().repeat(5)}</g>`);

  const PORTAFILTER = svg(230, 80, `
    <ellipse cx="40" cy="14" rx="33" ry="6.2" fill="#2e180b"/>
    <path data-k="mound" d="M8 14Q11 1 40-1Q69 1 72 14Z" fill="url(#sc-mare-ground)"/>
    <path d="M5 15H75L71 35Q40 43 9 35Z" fill="url(#sc-mare-chrome)"/>
    <ellipse cx="40" cy="14.5" rx="35.5" ry="6.6" fill="none" stroke="url(#sc-mare-chromeV)" stroke-width="3"/>
    <path d="M0 14h6v6h-6zM74 14h6v6h-6z" fill="#8a837a"/>
    <path d="M27 37h26l-2 7h-22z" fill="url(#sc-mare-chrome)"/>
    <path d="M30 44l1.5 8h5l1.5-8zM42 44l1.5 8h5l1.5-8z" fill="url(#sc-mare-chrome)"/>
    <rect x="74" y="18" width="18" height="12" rx="3" fill="url(#sc-mare-chromeV)"/>
    <path d="M90 19L206 30Q218 32 217 41Q216 49 205 48L90 31Z" fill="url(#sc-mare-black)"/>
    <path d="M94 21L204 32" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M204 31Q213 33 213 40" stroke="#c98a5d" stroke-opacity=".5" stroke-width="1.2" fill="none"/>
  `, '0 -10 230 80');

  // Máquina de espresso: caja real (frente, techo y laterales) de acero pulido con laterales terracota.
  const MW = 340, MH = 272, MD = 190;
  const gauge = (cx, k) => `
    <g transform="translate(${cx} 96)">
      <circle r="33" fill="#000" fill-opacity=".28" transform="translate(2 3)"/>
      <circle r="31" fill="url(#sc-mare-chromeR)"/>
      <circle r="26" fill="#2a2520"/>
      <circle r="24.5" fill="#f6f0e6"/>
      <circle r="24.5" fill="url(#sc-mare-innerWall)"/>
      <path d="M-15 12A19 19 0 1 1 15 12" fill="none" stroke="#33251c" stroke-width="2.4" stroke-dasharray="1.2 4.6"/>
      <path d="M8.5 -16.5A19 19 0 0 1 15 12" fill="none" stroke="#a4572c" stroke-width="3"/>
      <text y="14" text-anchor="middle" font-family="${SANS}" font-size="5.5" font-weight="700" fill="#6b5647">BAR</text>
      <line data-k="${k}" x1="0" y1="3" x2="0" y2="-19" stroke="#b5321b" stroke-width="1.8" stroke-linecap="round"/>
      <circle r="3.2" fill="url(#sc-mare-chromeR)"/>
      <path d="M-20-6A21 21 0 0 1 4-21L2-14A14 14 0 0 0-13-4Z" fill="#fff" fill-opacity=".55"/>
    </g>`;
  const MACHINE_FRONT = tex => svg(MW, MH, `
    <clipPath id="sc-mare-mfc"><rect width="${MW}" height="262" rx="7"/></clipPath>
    <rect width="${MW}" height="262" rx="7" fill="url(#sc-mare-steel)"/>
    ${img(tex.brushed, 0, 0, MW, 262, 'opacity=".5" clip-path="url(#sc-mare-mfc)" style="mix-blend-mode:overlay"')}
    <path d="M0 0H130L40 262H0Z" fill="#fff" fill-opacity=".1" clip-path="url(#sc-mare-mfc)"/>
    <path d="M150 0H190L100 262H80Z" fill="#fff" fill-opacity=".06" clip-path="url(#sc-mare-mfc)"/>
    <rect x="0" y="0" width="${MW}" height="6" rx="3" fill="url(#sc-mare-chromeV)"/>
    <rect x="24" y="16" width="292" height="26" rx="5" fill="url(#sc-mare-steelD)"/>
    <rect x="24" y="16" width="292" height="26" rx="5" fill="none" stroke="#fff" stroke-opacity=".35"/>
    <text x="170" y="34.5" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="7" fill="#fbefe1">MARÉ</text>
    <circle cx="121" cy="29" r="2.2" fill="#c9673a"/><circle cx="219" cy="29" r="2.2" fill="#c9673a"/>
    ${[136, 156, 176, 196].map((x, i) => `<rect x="${x - 7}" y="52" width="14" height="9" rx="2.2" fill="#1b1613"/><rect x="${x - 3}" y="54.5" width="6" height="1.6" rx=".8" fill="${i === 1 ? '#ffd58a' : '#f3ece2'}" fill-opacity=".9"/>`).join('')}
    <circle cx="170" cy="96" r="36" fill="#000" fill-opacity=".22"/>
    <circle cx="170" cy="94" r="34" fill="url(#sc-mare-chromeR)"/>
    <circle cx="170" cy="94" r="24" fill="#4e4740"/>
    ${gauge(62, 'g1')}${gauge(278, 'g2')}
    <rect x="78" y="154" width="184" height="108" rx="7" fill="url(#sc-mare-steelD)"/>
    <rect x="78" y="154" width="184" height="30" rx="7" fill="#000" fill-opacity=".18"/>
    ${img(tex.brushed, 78, 154, 184, 108, 'opacity=".35" style="mix-blend-mode:overlay"')}
    <path d="M6 8V256M334 8V256" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <g transform="translate(316 134)">
      <circle r="12" fill="#000" fill-opacity=".25" transform="translate(1.5 2)"/>
      <g data-k="knob"><circle r="11" fill="url(#sc-mare-chromeR)"/><rect x="-2" y="-11" width="4" height="9" rx="2" fill="#a4572c"/></g>
    </g>
    <circle cx="26" cy="134" r="3" fill="#9fd08a"/><circle cx="26" cy="134" r="7" fill="#9fd08a" fill-opacity=".2"/>
    <rect x="0" y="257" width="${MW}" height="5" fill="#000" fill-opacity=".25"/>
    <rect x="18" y="262" width="26" height="10" rx="2" fill="#1d1916"/><rect x="296" y="262" width="26" height="10" rx="2" fill="#1d1916"/>
  `);
  const MACHINE_TOP = svg(MW, MD, `
    <rect width="${MW}" height="${MD}" rx="6" fill="url(#sc-mare-steelTop)"/>
    <rect x="18" y="16" width="304" height="158" rx="12" fill="#5c554e"/>
    <path d="${Array.from({ length: 28 }, (_, i) => `M${30 + i * 10.4} 24V166`).join('')}" stroke="#2a2521" stroke-width="3.4"/>
    <rect x="18" y="16" width="304" height="158" rx="12" fill="none" stroke="url(#sc-mare-chromeV)" stroke-width="6"/>
  `);
  const MACHINE_SIDE = left => svg(MD, 262, `
    <rect width="${MD}" height="262" rx="4" fill="url(#sc-mare-terraSide${left ? 'L' : 'R'})"/>
    <rect width="${MD}" height="262" rx="4" fill="url(#sc-mare-lacquerV)"/>
    <rect x="0" y="0" width="${MD}" height="8" fill="url(#sc-mare-chromeV)"/>
    <rect x="0" y="250" width="${MD}" height="12" fill="url(#sc-mare-chromeV)" opacity=".85"/>
    <path d="M${left ? 150 : 40} 30V230" stroke="#fff" stroke-opacity=".12" stroke-width="10"/>
  `);
  const CUPS_TOP = svg(220, 70, `
    ${[[22, '#f4ede3'], [66, '#f4ede3'], [110, '#b3612f'], [154, '#f4ede3'], [198, '#efe6da']].map(([x, c], i) => `
      <g transform="translate(${x} 0)">
        <ellipse cx="0" cy="66" rx="22" ry="4" fill="#000" fill-opacity=".25"/>
        <path d="M-21 64Q-21 56-19 40Q-16 30 0 29Q16 30 19 40Q21 56 21 64Z" fill="${i === 2 ? 'url(#sc-mare-terra)' : 'url(#sc-mare-cer)'}"/>
        ${i === 2 ? '' : `<path d="M-21 64Q-21 56-19 40Q-16 30 0 29Q16 30 19 40Q21 56 21 64Z" fill="url(#sc-mare-speck)" opacity=".7"/>`}
        <ellipse cx="0" cy="30.5" rx="11" ry="2.4" fill="#fff" fill-opacity=".35"/>
        <path d="M-21 63.5Q0 68 21 63.5" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" fill="none"/>
      </g>`).join('')}
  `);
  const GROUP = svg(110, 72, `
    <path d="M33 0H77L80 14H30Z" fill="url(#sc-mare-chrome)"/>
    <rect x="17" y="13" width="76" height="38" rx="5" fill="url(#sc-mare-chrome)"/>
    <path d="M17 22H93M17 43H93" stroke="#000" stroke-opacity=".2"/>
    <path d="M21 50H89L85 64Q55 70 25 64Z" fill="url(#sc-mare-chrome)"/>
    <ellipse cx="55" cy="65" rx="30" ry="4.4" fill="#231e1a"/>
    <rect x="86" y="24" width="18" height="7" rx="3.5" fill="url(#sc-mare-black)"/>
  `);
  const STREAMS = svg(40, 60, `
    <rect data-k="s1" x="13" y="0" width="3.2" height="0" rx="1.6" fill="url(#sc-mare-stream)"/>
    <rect data-k="s2" x="24" y="0" width="3.2" height="0" rx="1.6" fill="url(#sc-mare-stream)"/>
  `);
  const DRIP_TOP = svg(200, 80, `
    <rect width="200" height="80" rx="5" fill="url(#sc-mare-grate)"/>
    <rect width="200" height="80" rx="5" fill="none" stroke="#d9d3cb" stroke-width="3"/>
    <rect width="200" height="80" rx="5" fill="url(#sc-mare-steelTop)" opacity=".35"/>
  `);
  const DRIP_FRONT = svg(200, 24, `<rect width="200" height="24" rx="3" fill="url(#sc-mare-steel)"/><path d="M2 1.5H198" stroke="#fff" stroke-opacity=".8"/>`);
  const WAND = svg(70, 110, `
    <circle cx="9" cy="9" r="8" fill="url(#sc-mare-chromeR)"/>
    <path d="M9 9C24 9 31 14 33 27L44 98" stroke="#5d5750" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M9 9C24 9 31 14 33 27L44 98" stroke="url(#sc-mare-chromeV)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M10 6.6C24 6.6 30 12 31.6 25L42.4 96" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-opacity=".85"/>
    <rect x="18" y="12" width="12" height="24" rx="5" transform="rotate(-10 24 24)" fill="url(#sc-mare-black)"/>
  `);
  const PUFFS = svg(140, 160, `<g data-k="puffs">${'<circle r="10" fill="url(#sc-mare-puff)"/>'.repeat(7)}</g>`, '-70 -150 140 160');

  // Jarra de leche (acero) y su boca (plano horizontal con la leche).
  const PITCHER = svg(124, 116, `
    <path d="M90 22Q114 22 113 46Q112 74 96 84" stroke="#4d4741" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M90 22Q111 22 110 46Q109 72 95 82" stroke="url(#sc-mare-chromeV)" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M28 12L22 4Q30 7 36 12H86Q90 60 96 98Q96 108 58 110Q18 108 18 98Q24 60 28 12Z" fill="url(#sc-mare-chrome)"/>
    <path d="M30 14Q28 60 22 98" stroke="#fff" stroke-opacity=".6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M86 14Q90 60 95 98" stroke="#ffcf9e" stroke-opacity=".35" stroke-width="1.4" fill="none"/>
    <path d="M18 98Q58 106 96 98" stroke="#000" stroke-opacity=".28" stroke-width="2" fill="none"/>
  `);
  const PITCHER_TOP = svg(76, 76, `
    <circle cx="38" cy="38" r="31" fill="url(#sc-mare-chromeR)"/>
    <circle cx="38" cy="38" r="28" fill="#6b645c"/>
    <g data-k="milk"><circle cx="38" cy="38" r="27" fill="url(#sc-mare-milk)"/><circle cx="38" cy="38" r="27" fill="url(#sc-mare-foam)" opacity=".5"/>
      <g transform="translate(38 38)"><path data-k="swirl" d="M0 0m-16 0a16 16 0 1 1 16 16a10 10 0 1 1-10-10" stroke="#e7dccd" stroke-width="2.4" fill="none"/></g></g>
    <circle cx="38" cy="38" r="27" fill="url(#sc-mare-innerWall)"/>
  `);

  // Taza de cerámica jaspeada: cuerpo (billboard) + boca (plano horizontal con café, crema y arte).
  const CUP_BODY = svg(132, 76, `
    <path d="M100 18Q126 16 125 33Q124 49 98 50" stroke="#a89884" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M100 18Q122 17 121 33Q120 47 98 48" stroke="#f3ebdf" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <path d="M102 17.5Q118 17 119 27" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-opacity=".9"/>
    <path d="M10 10C10 40 18 58 30 63Q56 70 82 63C94 58 102 40 102 10Z" fill="url(#sc-mare-cer)"/>
    <path d="M10 10C10 40 18 58 30 63Q56 70 82 63C94 58 102 40 102 10Z" fill="url(#sc-mare-speck)" opacity=".8"/>
    <path d="M10 10C10 40 18 58 30 63Q56 70 82 63C94 58 102 40 102 10Z" fill="url(#sc-mare-cerAO)"/>
    <path d="M24 16C25 36 29 50 36 58" stroke="#fff" stroke-opacity=".75" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M30 63Q56 70 82 63" stroke="#7a6550" stroke-opacity=".35" stroke-width="1.2" fill="none"/>
  `);
  const LEAVES = Array.from({ length: 7 }, (_, i) => {
    const y = 40 - i * 13, w = 50 - i * 5.4, h = 12 - i * 0.9, k = w * 0.5;
    return `M${-w} ${y}Q0 ${n(y + k + h * 1.6)} ${w} ${y}Q0 ${n(y + k - h * 0.6)} ${-w} ${y}Z`;
  });
  const HEART = 'M0-46C-11-52-12-64-4-65C-2-65 0-63 0-61C0-63 2-65 4-65C12-64 11-52 0-46Z';
  const artStatic = () => `${LEAVES.map(d => `<path d="${d}" fill="url(#sc-mare-milk)" stroke="#fffaf2" stroke-opacity=".5" stroke-width="1.5"/>`).join('')}<path d="${HEART}" fill="url(#sc-mare-milk)"/><path d="M0-56V66" stroke="#b77a45" stroke-width="2.4" stroke-linecap="round"/>`;
  const CUP_TOP = svg(100, 100, `
    <circle cx="50" cy="50" r="46" fill="url(#sc-mare-cerTop)"/>
    <circle cx="50" cy="50" r="46" fill="none" stroke="#bcae9a" stroke-opacity=".6"/>
    <circle cx="50" cy="50" r="41.5" fill="#efe6d8"/>
    <circle cx="50" cy="50" r="41.5" fill="url(#sc-mare-innerWall)"/>
    <circle data-k="coffee" cx="50" cy="50" r="40" fill="url(#sc-mare-esp)" opacity="0"/>
    <g data-k="crema" opacity="0"><circle cx="50" cy="50" r="40" fill="url(#sc-mare-crema)"/><circle cx="50" cy="50" r="40" fill="url(#sc-mare-foam)"/></g>
    <g data-k="cupArt" opacity="0" transform="translate(50 52) scale(.36)">${artStatic()}</g>
    <circle cx="50" cy="50" r="40.5" fill="url(#sc-mare-innerWall)"/>
    <path d="M18 30A38 38 0 0 1 44 9" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-opacity=".9"/>
  `);
  const CUP_STEAM = '<div class="sc-mare-steam"><span class="sc-mare-amb"></span><span class="sc-mare-amb"></span><span class="sc-mare-amb"></span></div>';

  // Croissant: versión cruda y horneada (se cruzan con opacidad), con capas laminadas y brillo de huevo.
  // Segmentos del croissant (vista frontal 3/4): puntas, laterales y cuerpo central, de atrás hacia delante.
  const CSEG = [
    { d: 'M-70 15C-76 10-73 0-65-4C-58-7-52-4-50 1C-53 7-57 14-63 18C-66 19-69 18-70 15Z', c: [-61, 7] },
    { d: 'M70 15C76 10 73 0 65-4C58-7 52-4 50 1C53 7 57 14 63 18C66 19 69 18 70 15Z', c: [61, 7] },
    { d: 'M-57 19C-63 10-61-5-50-11C-42-15-34-13-30-8C-35 0-37 11-35 21C-43 23-52 22-57 19Z', c: [-46, 4] },
    { d: 'M57 19C63 10 61-5 50-11C42-15 34-13 30-8C35 0 37 11 35 21C43 23 52 22 57 19Z', c: [46, 4] },
    { d: 'M-39 22C-45 10-43-9-31-17C-22-22-13-22-8-18C-15-6-16 9-13 23C-22 25-32 24-39 22Z', c: [-27, 2] },
    { d: 'M39 22C45 10 43-9 31-17C22-22 13-22 8-18C15-6 16 9 13 23C22 25 32 24 39 22Z', c: [27, 2] },
    { d: 'M-17 23C-22 6-17-19-2-27C2-29 6-29 10-26C21-17 23 6 17 23C6 26-6 26-17 23Z', c: [0, -1] }
  ];
  const croisLayer = (fill, hi, lo, gloss) => `
    <path d="M-70 16Q-40 30 0 27Q40 30 70 16L66 22Q36 33 0 31Q-36 33-66 22Z" fill="${lo}" fill-opacity=".9"/>
    ${CSEG.map(({ d, c }) => `
      <path d="${d}" fill="${fill}"/>
      <path d="${d}" fill="none" stroke="${lo}" stroke-opacity=".45" stroke-width="1.1"/>
      <path d="${d}" fill="none" stroke="${hi}" stroke-opacity=".38" stroke-width=".7" transform="translate(${c[0]} ${c[1]}) scale(.78) translate(${-c[0]} ${-c[1]})"/>
      <path d="${d}" fill="none" stroke="${lo}" stroke-opacity=".22" stroke-width=".6" transform="translate(${c[0]} ${c[1]}) scale(.58) translate(${-c[0]} ${-c[1]})"/>
      <path d="${d}" fill="none" stroke="${hi}" stroke-opacity=".3" stroke-width=".6" transform="translate(${c[0]} ${c[1] - 2}) scale(.36) translate(${-c[0]} ${-c[1]})"/>`).join('')}
    <path d="M-5-22Q1-25 7-21M-28-14Q-23-17-17-16M28-14Q23-17 17-16M-49-6Q-45-9-40-8M49-6Q45-9 40-8" stroke="#fff" stroke-opacity="${gloss}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M-17 23C-6 26 6 26 17 23M-39 22Q-26 25-13 23M39 22Q26 25 13 23" stroke="${lo}" stroke-opacity=".6" stroke-width="1.6" fill="none"/>`;
  const CROISSANT = svg(150, 84, `
    <g transform="translate(75 50) scale(1)">
      <g data-k="raw">${croisLayer('url(#sc-mare-crR)', '#fffaf0', '#a98457', 0.3)}</g>
      <g data-k="baked" opacity="0">${croisLayer('url(#sc-mare-crB)', '#ffe2a8', '#4a1f06', 0.55)}</g>
    </g>
  `);

  // Horno de convección: caja grafito con puerta de vidrio abatible e interior iluminado.
  const OW = 250, OH = 180, OD = 170;
  const OVEN_FRONT = tex => svg(OW, OH, `
    <clipPath id="sc-mare-ofc"><path fill-rule="evenodd" d="M10 0H240A10 10 0 0 1 250 10V160A10 10 0 0 1 240 170H10A10 10 0 0 1 0 160V10A10 10 0 0 1 10 0ZM16 24V148H176V24Z"/></clipPath>
    <rect width="${OW}" height="170" rx="10" fill="url(#sc-mare-graph)" clip-path="url(#sc-mare-ofc)"/>
    ${img(tex.brushed, 0, 0, OW, 170, 'opacity=".55" clip-path="url(#sc-mare-ofc)" style="mix-blend-mode:overlay"')}
    <path d="M16 24H176V148H16Z" fill="none" stroke="#0a0806" stroke-width="3"/>
    <path d="M12 20H180V152H12Z" fill="none" stroke="#fff" stroke-opacity=".1" stroke-width="1.2"/>
    <rect x="4" y="1" width="242" height="3" rx="1.5" fill="#fff" fill-opacity=".3"/>
    <rect x="190" y="28" width="46" height="22" rx="4" fill="#0c0806" stroke="#fff" stroke-opacity=".1"/>
    <text data-k="digits" x="213" y="44" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="#ffb35c">20°</text>
    ${[86, 124].map(y => `<g transform="translate(213 ${y})"><circle r="15" fill="#000" fill-opacity=".35" transform="translate(1.5 2)"/><circle r="14" fill="url(#sc-mare-chromeR)"/><circle r="9.5" fill="#2b2622"/><rect x="-1.4" y="-9" width="2.8" height="7" rx="1.4" fill="#f6efe5"/></g>`).join('')}
    <text x="213" y="160" text-anchor="middle" font-family="Georgia,serif" font-size="8" letter-spacing="2.4" fill="#fff" fill-opacity=".5">MARÉ</text>
    <rect x="14" y="170" width="24" height="10" rx="2" fill="#141110"/><rect x="212" y="170" width="24" height="10" rx="2" fill="#141110"/>
  `);
  const OVEN_SIDE = svg(OD, 170, `<rect width="${OD}" height="170" rx="6" fill="url(#sc-mare-graphSide)"/><path d="${Array.from({ length: 6 }, (_, i) => `M${40 + i * 16} 30V80`).join('')}" stroke="#000" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/><rect width="${OD}" height="3" fill="#fff" fill-opacity=".14"/>`);
  const OVEN_TOP = svg(OW, OD, `<rect width="${OW}" height="${OD}" rx="8" fill="#3a342f"/><rect width="${OW}" height="${OD}" rx="8" fill="url(#sc-mare-steelTop)" opacity=".25"/><path d="${Array.from({ length: 9 }, (_, i) => `M${60 + i * 16} 40V120`).join('')}" stroke="#000" stroke-opacity=".4" stroke-width="5" stroke-linecap="round"/>`);
  const OVEN_IN = svg(188, 152, `
    <rect width="188" height="152" fill="url(#sc-mare-cavity)"/>
    <path d="M0 0L22 18H166L188 0ZM0 152L22 132H166L188 152Z" fill="#000" fill-opacity=".35"/>
    <path d="M0 0L22 18V132L0 152ZM188 0L166 18V132L188 152Z" fill="#000" fill-opacity=".22"/>
    <rect data-k="glow" width="188" height="152" fill="url(#sc-mare-heat)" opacity="0"/>
    <path d="M24 30Q44 25 64 30T104 30T144 30T170 30" stroke="#4a3226" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path data-k="elem" d="M24 30Q44 25 64 30T104 30T144 30T170 30" stroke="#ffd27f" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/>
    <path d="M24 136Q44 131 64 136T104 136T144 136T170 136" stroke="#4a3226" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path data-k="elem2" d="M24 136Q44 131 64 136T104 136T144 136T170 136" stroke="#ff9a45" stroke-width="4" fill="none" stroke-linecap="round" opacity="0"/>
  `);
  const RACK = svg(156, 44, `<rect x="2" y="2" width="152" height="40" rx="3" fill="none" stroke="#a39a90" stroke-width="2.4"/><path d="${Array.from({ length: 14 }, (_, i) => `M${10 + i * 10.4} 2V42`).join('')}" stroke="#8d857b" stroke-width="1.3"/>`);
  const DOOR = svg(176, 136, `
    <clipPath id="sc-mare-dgl"><rect x="12" y="16" width="152" height="108" rx="3"/></clipPath>
    <path fill-rule="evenodd" d="M8 0H168A8 8 0 0 1 176 8V128A8 8 0 0 1 168 136H8A8 8 0 0 1 0 128V8A8 8 0 0 1 8 0ZM12 16V124H164V16Z" fill="url(#sc-mare-graph)"/>
    <g clip-path="url(#sc-mare-dgl)">
      <rect x="12" y="16" width="152" height="108" fill="#1c120c" fill-opacity=".34"/>
      <rect data-k="doorGlow" x="12" y="16" width="152" height="108" fill="#ff9c4a" opacity="0"/>
      <path d="M40 16H78L30 124H12V76Z" fill="#fff" fill-opacity=".1"/>
      <path d="M92 16H104L56 124H44Z" fill="#fff" fill-opacity=".07"/>
      <path d="M150 16H164V40L136 124H120Z" fill="#fff" fill-opacity=".05"/>
    </g>
    <rect x="12" y="16" width="152" height="108" rx="3" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>
    <rect x="22" y="5" width="6" height="10" fill="#6e675f"/><rect x="148" y="5" width="6" height="10" fill="#6e675f"/>
    <rect x="16" y="1" width="144" height="7" rx="3.5" fill="url(#sc-mare-chromeV)"/>
  `);

  // Bandeja de roble con plato y platillo (planos horizontales: perspectiva exacta).
  const TW = 360, TD = 150;
  const TRAY_TOP = tex => svg(TW, TD, `
    <clipPath id="sc-mare-trc"><rect width="${TW}" height="${TD}" rx="16"/></clipPath>
    ${img(tex.oak, 0, 0, TW, TD, 'clip-path="url(#sc-mare-trc)"')}
    <rect width="${TW}" height="${TD}" rx="16" fill="none" stroke="#fff3df" stroke-opacity=".45" stroke-width="3"/>
    <rect x="3" y="3" width="${TW - 6}" height="${TD - 6}" rx="14" fill="none" stroke="#4a2a12" stroke-opacity=".25" stroke-width="2"/>
    <circle cx="282" cy="68" r="66" fill="url(#sc-mare-sh)"/>
    <circle cx="276" cy="75" r="60" fill="url(#sc-mare-cerTop)"/>
    <circle cx="276" cy="75" r="60" fill="none" stroke="#b3a490" stroke-opacity=".6"/>
    <circle cx="276" cy="75" r="44" fill="url(#sc-mare-cerWell)"/>
    <path d="M232 52A50 50 0 0 1 262 24" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="101" cy="69" r="60" fill="url(#sc-mare-sh)"/>
    <circle cx="96" cy="75" r="56" fill="url(#sc-mare-cerTop)"/>
    <circle cx="96" cy="75" r="56" fill="url(#sc-mare-speck)" opacity=".6"/>
    <circle cx="96" cy="75" r="56" fill="none" stroke="#b3a490" stroke-opacity=".6"/>
    <circle cx="96" cy="75" r="30" fill="url(#sc-mare-cerWell)"/>
    <path d="M58 52A46 46 0 0 1 84 30" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <g transform="translate(176 104) rotate(-24)"><rect x="-4" y="-34" width="8" height="58" rx="4" fill="url(#sc-mare-chrome)"/><ellipse cx="0" cy="-38" rx="9" ry="13" fill="url(#sc-mare-chromeR)"/></g>
  `);
  const TRAY_EDGE = (w, tex) => svg(w, 14, `<rect width="${w}" height="14" rx="3" fill="#6e4424"/>${img(tex.oak, 0, 0, w, 14, 'opacity=".55"')}<rect width="${w}" height="2" fill="#f8d7a8" fill-opacity=".6"/><rect y="10" width="${w}" height="4" fill="#000" fill-opacity=".22"/>`);

  // Lupa cenital (macro) del arte latte: composición vista desde arriba sobre el mármol.
  const MACRO = tex => svgSlice(1200, 800, `
    ${img(tex.macro, 0, 0, 1200, 800)}
    <g transform="translate(600 410)">
      <circle cx="26" cy="-20" r="232" fill="url(#sc-mare-sh)"/>
      <circle r="212" fill="url(#sc-mare-cerTop)"/>
      <circle r="212" fill="url(#sc-mare-speck)" opacity=".5"/>
      <circle r="212" fill="none" stroke="#b3a490" stroke-opacity=".6" stroke-width="1.5"/>
      <circle r="198" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
      <circle r="160" fill="url(#sc-mare-cerWell)"/>
      <g transform="translate(118 132) rotate(-38)"><rect x="-9" y="-50" width="18" height="150" rx="9" fill="url(#sc-mare-chrome)"/><ellipse cx="0" cy="-62" rx="24" ry="34" fill="url(#sc-mare-chromeR)"/><ellipse cx="-7" cy="-72" rx="7" ry="14" fill="#fff" fill-opacity=".7"/></g>
      <circle cx="22" cy="-16" r="164" fill="url(#sc-mare-sh)"/>
      <g transform="translate(150 0)"><rect x="-10" y="-22" width="82" height="44" rx="22" fill="#000" fill-opacity=".14" transform="translate(10 -6)"/><rect x="-10" y="-22" width="82" height="44" rx="22" fill="url(#sc-mare-cerTop)"/><rect x="8" y="-10" width="46" height="20" rx="10" fill="#e3d6c4"/><path d="M0-17H58" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
      <circle r="150" fill="url(#sc-mare-cerTop)"/>
      <circle r="150" fill="url(#sc-mare-speck)" opacity=".6"/>
      <circle r="138" fill="#e9dfd0"/>
      <circle r="135" fill="url(#sc-mare-crema)"/>
      <circle r="135" fill="url(#sc-mare-foam)" transform="scale(1)"/>
      <g data-k="art" transform="translate(0 14) scale(2.15)">
        ${LEAVES.map((d, i) => `<path data-k="leaf${i}" d="${d}" fill="url(#sc-mare-milk)" stroke="#fffaf2" stroke-opacity=".55" stroke-width="1.2" opacity="0"/>`).join('')}
        <path data-k="head" d="${HEART}" fill="url(#sc-mare-milk)" opacity="0"/>
        <path data-k="stem" d="M0-56V66" pathLength="1" stroke="#b77a45" stroke-width="1.6" stroke-linecap="round" fill="none" stroke-dasharray="1" stroke-dashoffset="1"/>
      </g>
      <circle r="136" fill="url(#sc-mare-innerWall)"/>
      <path d="M-120-60A134 134 0 0 1-40-128" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-opacity=".9"/>
      <g data-k="lp">
        <circle data-k="drop" r="13" fill="#fffdf8" opacity="0"/>
        <g transform="translate(118 -118)">
          <circle r="128" fill="#000" fill-opacity=".18" transform="translate(30 30)"/>
          <path d="M-122 -18Q-150 0-118 22L-60 60Q-10 30-20-20Z" fill="url(#sc-mare-chromeR)"/>
          <circle r="118" fill="url(#sc-mare-chromeR)"/>
          <circle r="104" fill="#6e675f"/>
          <circle r="100" fill="url(#sc-mare-milk)"/>
          <circle r="100" fill="url(#sc-mare-foam)" opacity=".6"/>
          <circle r="100" fill="url(#sc-mare-innerWall)"/>
          <path d="M-100-40A108 108 0 0 1-40-102" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-opacity=".85"/>
          <path d="M70 70L140 140" stroke="#3a342e" stroke-width="30" stroke-linecap="round"/>
          <path d="M70 70L140 140" stroke="url(#sc-mare-chrome)" stroke-width="22" stroke-linecap="round"/>
        </g>
      </g>
    </g>
    <g transform="translate(250 330)">${[[0, 0, 20], [40, 60, 110], [-30, 120, 60], [70, 170, 150], [10, -70, 200]].map(([x, y, a]) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(2.3)"><ellipse rx="7" ry="5" fill="#000" fill-opacity=".25" transform="translate(1.5 1.5)"/>${beanG()}</g>`).join('')}</g>
  `);

  const CSS = `
.sc-mare{position:absolute;inset:0;overflow:hidden;background:#2b1d14;color:#2b1a10;font-family:${SANS};font-style:normal;container-type:size;user-select:none;-webkit-user-select:none;pointer-events:none}
.sc-mare *{box-sizing:border-box;font-style:normal}
.sc-mare-defs{position:absolute;width:0;height:0;overflow:hidden}
.sc-mare-view{position:absolute;inset:0;overflow:hidden;perspective-origin:50% 50%}
.sc-mare-p{position:absolute;left:0;top:0;transform-origin:0 0}
.sc-mare-p>svg{display:block;width:100%;height:100%;overflow:visible}
.sc-mare-bf{backface-visibility:hidden;-webkit-backface-visibility:hidden}
.sc-mare-refl{-webkit-box-reflect:below var(--ro,0px) linear-gradient(to bottom,rgba(0,0,0,0) 62%,rgba(0,0,0,.2))}
.sc-mare-bg{background:radial-gradient(60% 50% at 30% 40%,#c9a273,#6d4a30 60%,#2b1d14);overflow:hidden}
.sc-mare-bg>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sc-mare-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(40,24,14,.12),rgba(40,24,14,.1) 40%,rgba(30,18,10,.5))}
.sc-mare-bk{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,232,190,.5) 0,rgba(255,232,190,.42) 52%,rgba(255,244,222,.75) 64%,rgba(255,232,190,0) 70%);mix-blend-mode:screen}
.sc-mare-bk.is-g{background:radial-gradient(circle,rgba(220,240,190,.32) 0,rgba(220,240,190,.26) 52%,rgba(236,250,214,.5) 64%,rgba(220,240,190,0) 70%)}
.sc-mare-amb.sc-mare-bk{animation:sc-mare-twinkle 7s ease-in-out infinite alternate}
@keyframes sc-mare-twinkle{0%{opacity:.35;transform:scale(.94)}100%{opacity:1;transform:scale(1.04)}}
.sc-mare-top{background-size:100% 100%}
.sc-mare-top::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(60,36,18,.45),rgba(60,36,18,0) 30%,rgba(255,240,214,0) 78%,rgba(255,240,214,.18)),linear-gradient(90deg,rgba(40,24,12,.5),rgba(40,24,12,0) 22%,rgba(40,24,12,0) 70%,rgba(40,24,12,.45))}
.sc-mare-edge{background-size:100% 600%;background-position:0 100%}
.sc-mare-edge::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,250,240,.75) 0,rgba(255,250,240,.2) 8%,rgba(60,36,18,0) 30%,rgba(50,30,15,.38))}
.sc-mare-cab{background-size:256px 700px}
.sc-mare-cab::after{content:'';position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(0,0,0,.45) 0 3px,rgba(0,0,0,0) 3px 64px),linear-gradient(180deg,rgba(10,5,2,.85),rgba(10,5,2,.35) 30%,rgba(10,5,2,.55))}
.sc-mare-shd{border-radius:50%;background:radial-gradient(closest-side,rgba(30,16,6,.6),rgba(30,16,6,.28) 50%,rgba(30,16,6,0))}
.sc-mare-shb{border-radius:24px;background:rgba(30,16,6,.42);box-shadow:0 0 34px 22px rgba(30,16,6,.3)}
.sc-mare-spill{border-radius:50%;background:radial-gradient(closest-side,rgba(255,160,70,.55),rgba(255,140,60,.22) 50%,rgba(255,140,60,0));mix-blend-mode:screen}
.sc-mare-steam{position:absolute;inset:0}
.sc-mare-steam span{position:absolute;left:28%;bottom:4%;width:40%;height:62%;border-radius:50%;background:radial-gradient(50% 50% at 50% 50%,rgba(255,252,246,.7),rgba(255,252,246,.25) 55%,rgba(255,252,246,0));opacity:.45;transform:translate(4%,-14%) scale(.9,.95);transform-origin:50% 100%;animation:sc-mare-rise 3.4s ease-in-out infinite}
.sc-mare-steam span:nth-child(2){left:42%;width:30%;animation-delay:-1.1s;animation-duration:3.9s}
.sc-mare-steam span:nth-child(3){left:20%;width:34%;animation-delay:-2.3s;animation-duration:4.3s}
@keyframes sc-mare-rise{0%{opacity:0;transform:translate(0,20%) scale(.6,.5)}30%{opacity:.85}70%{opacity:.4}100%{opacity:0;transform:translate(10%,-55%) scale(1.15,1.2)}}
.sc-mare-fx{position:absolute;inset:0;pointer-events:none}
.sc-mare-beams{background:linear-gradient(112deg,rgba(255,232,190,0) 8%,rgba(255,232,190,.2) 16%,rgba(255,232,190,0) 26%,rgba(255,232,190,0) 30%,rgba(255,232,190,.14) 37%,rgba(255,232,190,0) 46%);mix-blend-mode:screen}
.sc-mare-amb.sc-mare-beams{animation:sc-mare-breathe 9s ease-in-out infinite alternate}
@keyframes sc-mare-breathe{0%{opacity:.65}100%{opacity:1}}
.sc-mare-vig{background:radial-gradient(120% 100% at 50% 45%,rgba(20,10,4,0) 52%,rgba(20,10,4,.5) 100%)}
.sc-mare-grain{opacity:.07;mix-blend-mode:overlay;background-size:160px 160px}
.sc-mare-macro{position:absolute;inset:0;visibility:hidden;opacity:0;overflow:hidden;z-index:6}
.sc-mare-macro>svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.sc-mare-macro::after{content:'';position:absolute;inset:0;background:radial-gradient(90% 90% at 50% 50%,rgba(30,16,6,0) 55%,rgba(30,16,6,.5))}
.sc-mare-ui{position:absolute;inset:0;z-index:8}
.sc-mare-tag{position:absolute;left:0;top:0;display:flex;align-items:center;gap:.5em;padding:.42em .85em .42em .5em;border-radius:99px;background:rgba(255,250,242,.92);box-shadow:0 10px 26px rgba(30,15,5,.32),0 0 0 1px rgba(164,87,44,.22);font-size:clamp(10.5px,3.1cqh,14.5px);line-height:1;white-space:nowrap;color:#33251c;opacity:0;visibility:hidden}
.sc-mare-tag .sc-mare-dot{width:.62em;height:.62em;border-radius:50%;background:#a4572c;box-shadow:0 0 0 .22em rgba(164,87,44,.2)}
.sc-mare-tag b{font-weight:750;font-variant-numeric:tabular-nums}
.sc-mare-tag span:last-child{color:#6b5647;font-weight:550}
.sc-mare-label{position:absolute;left:50%;bottom:clamp(10px,5cqh,26px);padding:.5em 1.1em;border-radius:99px;background:rgba(33,22,15,.82);color:#fbf1e4;font-size:clamp(10.5px,3cqh,14px);font-weight:650;letter-spacing:.02em;white-space:nowrap;opacity:0;visibility:hidden;z-index:7}
.sc-mare-ticket{position:absolute;left:0;top:0;width:clamp(128px,31cqh,196px);padding:clamp(9px,2.6cqh,15px) clamp(10px,2.8cqh,16px) clamp(11px,3cqh,17px);background:linear-gradient(180deg,#fffdf8,#f6efe4);border-radius:4px 4px 2px 2px;box-shadow:0 18px 34px rgba(30,15,5,.45),0 2px 0 rgba(255,255,255,.8) inset;text-align:center;color:#33251c;opacity:0;visibility:hidden;transform-origin:50% 100%}
.sc-mare-ticket::after{content:'';position:absolute;left:0;right:0;bottom:-6px;height:6px;background:linear-gradient(-45deg,transparent 4px,#f6efe4 0) 0 0/8px 6px repeat-x,linear-gradient(45deg,transparent 4px,#f6efe4 0) 0 0/8px 6px repeat-x}
.sc-mare-ticket .k1{display:block;font-family:Georgia,serif;font-size:clamp(9px,2.5cqh,12px);letter-spacing:.32em;color:#a4572c}
.sc-mare-ticket .k2{display:block;margin:.55em 0 .5em;border-top:1px dashed rgba(107,86,71,.45)}
.sc-mare-ticket .k3{display:block;font-family:Georgia,serif;font-size:clamp(13px,4.2cqh,20px);line-height:1.1;white-space:nowrap}
.sc-mare-ticket .k4{display:block;margin-top:.35em;font-size:clamp(9px,2.4cqh,11.5px);color:#6b5647}
.sc-mare-ticket .k5{display:inline-flex;align-items:center;gap:.4em;margin-top:.7em;padding:.38em .9em;border-radius:99px;background:#a4572c;color:#fffaf2;font-weight:750;font-size:clamp(10px,2.9cqh,13.5px)}
.sc-mare-ticket .k5 svg{width:1em;height:1em}
body.motion-paused .sc-mare .sc-mare-amb,body.motion-paused .sc-mare .sc-mare-amb *{animation:none!important}
@media (prefers-reduced-motion:reduce){.sc-mare .sc-mare-amb,.sc-mare .sc-mare-amb *{animation:none!important}}
`;

  function injectCSS() {
    if (document.getElementById('sc-mare-css')) return;
    const st = document.createElement('style');
    st.id = 'sc-mare-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  // Fondo: la foto de la cafetería, desenfocada una vez en un canvas (profundidad de campo precalculada).
  function paintBackdrop(host) {
    const pic = new Image();
    pic.decoding = 'async';
    pic.onload = () => {
      const w = 480, h = 270, c = makeCanvas(w, h), x = c.getContext('2d');
      if (filterOK()) {
        x.filter = 'blur(4px) saturate(1.12) brightness(.92) contrast(.95)';
        x.drawImage(pic, -24, -16, w + 48, h + 32);
      } else {
        const s = makeCanvas(48, 27); s.getContext('2d').drawImage(pic, 0, 0, 48, 27);
        x.imageSmoothingQuality = 'high'; x.drawImage(s, 0, 0, w, h);
      }
      host.prepend(c);
    };
    pic.src = BG_PHOTO;
  }

  // Cámara: claves {p, t:[x,y,z], z: dolly, yaw, pitch}. Entre claves se interpola con suavizado.
  const CAM = [
    { p: 0, t: [-150, -150, 0], z: 0.95, yaw: 15, pitch: 11 },
    { p: 0.05, t: [-420, -180, -10], z: 1.42, yaw: 9, pitch: 9 },
    { p: 0.145, t: [-420, -180, -10], z: 1.48, yaw: 5, pitch: 9 },
    { p: 0.2, t: [-90, -140, 40], z: 1.55, yaw: 3, pitch: 9 },
    { p: 0.335, t: [-90, -140, 40], z: 1.6, yaw: -2, pitch: 9 },
    { p: 0.37, t: [60, -140, 40], z: 1.55, yaw: -6, pitch: 9 },
    { p: 0.49, t: [60, -140, 40], z: 1.6, yaw: -9, pitch: 9 },
    { p: 0.535, t: [-80, -70, 180], z: 1.5, yaw: -2, pitch: 20 },
    { p: 0.655, t: [-80, -70, 180], z: 1.55, yaw: 2, pitch: 20 },
    { p: 0.7, t: [395, -110, 0], z: 1.6, yaw: -8, pitch: 8 },
    { p: 0.835, t: [395, -110, 0], z: 1.66, yaw: -12, pitch: 8 },
    { p: 0.905, t: [-30, -100, 130], z: 1.3, yaw: -5, pitch: 15 },
    { p: 1, t: [-30, -100, 130], z: 1.34, yaw: -7, pitch: 15 }
  ];
  function camAt(p) {
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (p <= b.p) {
        const t = eIO(seg(p, a.p, b.p));
        return { t: a.t.map((v, j) => lerp(v, b.t[j], t)), z: lerp(a.z, b.z, t), yaw: lerp(a.yaw, b.yaw, t), pitch: lerp(a.pitch, b.pitch, t) };
      }
    }
    const l = CAM[CAM.length - 1];
    return { t: l.t.slice(), z: l.z, yaw: l.yaw, pitch: l.pitch };
  }

  // Posiciones fijas del mundo (unidades de escena; y negativa hacia arriba, z positiva hacia la cámara).
  const POS = {
    grinder: [-440, 0, -30], machine: [-90, 0, -60], oven: [410, 0, -50], tray: [-60, 0, 180],
    cupUnder: [-90, -24, 62], cupTray: [-144, -20, 180], plate: [36, -16, 180],
    pfGrinder: [-440, -96, 14], pfGroup: [-90, -140, 56],
    pitcherRest: [170, 0, 70], pitcherWand: [106, 0, 50],
    croisOven: [381, -60, 10]
  };
  const TAGS = [
    { k: 't1', v: '18 g', d: 'molido fino', at: [-405, -175, 20] },
    { k: 't2', v: '0 s', d: '36 ml', at: [-40, -100, 62] },
    { k: 't3', v: '20 °C', d: 'microespuma', at: [150, -150, 50] },
    { k: 't4', v: '200 °C', d: '18 min', at: [455, -200, 35] }
  ];

  function mount(stage) {
    injectCSS();
    const tex = textures();
    const root = document.createElement('div');
    root.className = 'sc-mare';
    root.setAttribute('aria-hidden', 'true');
    root.innerHTML = `${DEFS}<div class="sc-mare-view"></div>
      <div class="sc-mare-fx sc-mare-beams sc-mare-amb"></div>
      <div class="sc-mare-macro">${MACRO(tex)}</div>
      <div class="sc-mare-label">Vista desde arriba · rosetta</div>
      <div class="sc-mare-ui">
        ${TAGS.map(t => `<div class="sc-mare-tag" data-tag="${t.k}"><span class="sc-mare-dot"></span><b>${t.v}</b><span>· ${t.d}</span></div>`).join('')}
        <div class="sc-mare-ticket"><span class="k1">MARÉ</span><span class="k2"></span><span class="k3">Pedido M-104</span><span class="k4">flat white · croissant</span><span class="k5"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.4l3 3 6-6.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>listo</span></div>
      </div>
      <div class="sc-mare-fx sc-mare-vig"></div>
      <div class="sc-mare-fx sc-mare-grain" style="background-image:url('${tex.grain}')"></div>`;
    stage.appendChild(root);
    const view = root.querySelector('.sc-mare-view');

    // Objetos del mundo: posición + si miran a la cámara (cilindros) + transformación extra.
    const O = {};
    const obj = (k, pos, bill = false) => (O[k] = { x: pos[0], y: pos[1], z: pos[2], bill, extra: '', op: 1, vis: true });
    const parts = [];
    function part(o, local, w, h, html = '', cls = '', style = '') {
      const el = document.createElement('div');
      el.className = `sc-mare-p ${cls}`;
      el.style.cssText = `width:${w}px;height:${h}px;${style}`;
      el.innerHTML = html;
      view.appendChild(el);
      const rec = { el, o, local, op: -1, vis: true };
      parts.push(rec);
      return rec;
    }
    const flat = (w, d, y, cx = 0, cz = 0) => `translate3d(${cx - w / 2}px,${y}px,${cz - d / 2}px) rotateX(90deg)`;
    const stand = (w, baseY, ax = w / 2, dz = 0) => `translate3d(${-ax}px,${-baseY}px,${dz}px)`;

    // Fondo lejano con bokeh (un plano a gran distancia: el paralaje lo da la propia perspectiva).
    obj('bg', [-100, -120, -1050]);
    const bgRec = part('bg', 'translate3d(-1350px,-760px,0px)', 2700, 1520, '', 'sc-mare-bg');
    paintBackdrop(bgRec.el);
    const bk = rng(77);
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('div');
      const s = 40 + bk() * 120;
      d.className = `sc-mare-bk sc-mare-amb${i % 4 === 3 ? ' is-g' : ''}`;
      d.style.cssText = `left:${n(bk() * 2600)}px;top:${n(60 + bk() * 760)}px;width:${n(s)}px;height:${n(s)}px;animation-delay:${n(-bk() * 7)}s;animation-duration:${n(5 + bk() * 5)}s`;
      bgRec.el.appendChild(d);
    }

    // Barra: mármol, canto y mueble de madera.
    obj('counter', [0, 0, 0]);
    part('counter', 'translate3d(-1700px,0px,-340px) rotateX(90deg)', 3400, 615, '', 'sc-mare-top', `background-image:url('${tex.counter}')`);
    part('counter', 'translate3d(-1700px,0px,275px)', 3400, 34, '', 'sc-mare-edge', `background-image:url('${tex.counter}')`);
    part('counter', 'translate3d(-1700px,34px,262px)', 3400, 760, '', 'sc-mare-cab', `background-image:url('${tex.walnut}')`);

    // Sombras de contacto fijas (en el plano de la barra).
    obj('grinder', POS.grinder, true);
    obj('machine', POS.machine);
    obj('oven', POS.oven);
    obj('tray', POS.tray);
    part('grinder', flat(230, 130, -0.4, 22, -12), 230, 130, '', 'sc-mare-shd');
    part('machine', flat(340, 200, -0.4, 14, -8), 340, 200, '', 'sc-mare-shb');
    part('oven', flat(250, 170, -0.4, 12, -8), 250, 170, '', 'sc-mare-shb');
    part('tray', flat(372, 150, -0.4, 10, -6), 372, 150, '', 'sc-mare-shb');
    obj('spill', [OW * 0 + POS.oven[0] - 30, -0.5, POS.oven[2] + 150]);
    const spill = part('spill', flat(360, 190, 0), 360, 190, '', 'sc-mare-spill');

    // Horno: interior (fondo, rejilla y croissant) antes del frente; la puerta va delante.
    part('oven', `translate3d(${-125 + 2}px,-170px,40px)`, 188, 152, OVEN_IN);
    part('oven', `translate3d(-107px,-62px,40px) rotateX(90deg)`, 156, 44, RACK);
    obj('crSh', POS.croisOven);
    obj('crois', POS.croisOven, true);
    const crSh = part('crSh', flat(130, 56, -0.3), 130, 56, '', 'sc-mare-shd');
    const crois = part('crois', stand(150, 78), 150, 84, CROISSANT);
    part('oven', `translate3d(-125px,-180px,-85px) rotateX(90deg)`, OW, OD, OVEN_TOP, 'sc-mare-bf');
    part('oven', `translate3d(125px,-180px,85px) rotateY(90deg)`, OD, 170, OVEN_SIDE, 'sc-mare-bf');
    part('oven', `translate3d(-125px,-180px,-85px) rotateY(-90deg)`, OD, 170, OVEN_SIDE, 'sc-mare-bf');
    part('oven', `translate3d(-125px,-180px,85px)`, OW, OH, OVEN_FRONT(tex), 'sc-mare-bf sc-mare-refl', '--ro:-12px');
    obj('door', [POS.oven[0] - 125 + 8, -28, POS.oven[2] + 87]);
    const door = part('door', 'translate3d(0px,-136px,0px)', 176, 136, DOOR);

    // Máquina de espresso.
    part('machine', `translate3d(${-MW / 2}px,${-MH}px,${-MD / 2}px) rotateX(90deg)`, MW, MD, MACHINE_TOP, 'sc-mare-bf');
    part('machine', `translate3d(${MW / 2}px,${-MH}px,${MD / 2}px) rotateY(90deg)`, MD, 262, MACHINE_SIDE(false), 'sc-mare-bf');
    part('machine', `translate3d(${-MW / 2}px,${-MH}px,${-MD / 2}px) rotateY(-90deg)`, MD, 262, MACHINE_SIDE(true), 'sc-mare-bf');
    obj('cupsTop', [POS.machine[0], -MH, POS.machine[2] - 30], true);
    part('cupsTop', stand(220, 66), 220, 70, CUPS_TOP);
    part('machine', `translate3d(${-MW / 2}px,${-MH}px,${MD / 2}px)`, MW, MH, MACHINE_FRONT(tex), 'sc-mare-bf sc-mare-refl', '--ro:-10px');

    // Molino y granos que caen a la tolva.
    part('grinder', stand(200, 400), 200, 420, GRINDER(tex), 'sc-mare-refl', '--ro:-40px');
    obj('fall', [POS.grinder[0], -760, POS.grinder[2]], true);
    const fallRec = part('fall', 'translate3d(-60px,0px,0px)', 120, 420, FALL);

    // Bandeja de goteo de la máquina.
    obj('drip', [POS.machine[0], 0, 60]);
    part('drip', flat(200, 80, -24), 200, 80, DRIP_TOP);
    part('drip', 'translate3d(-100px,-24px,40px)', 200, 24, DRIP_FRONT, 'sc-mare-refl', '--ro:0px');

    // Jarra de leche.
    obj('pitcher', POS.pitcherRest, true);
    obj('pSh', POS.pitcherRest);
    const pSh = part('pSh', flat(130, 80, -0.3, 6, -4), 130, 80, '', 'sc-mare-shd');
    const pBody = part('pitcher', stand(124, 110, 58), 124, 116, PITCHER, 'sc-mare-refl', '--ro:-12px');
    const pTop = part('pitcher', flat(76, 76, -98, -2, 0), 76, 76, PITCHER_TOP);

    // Bandeja de servir (planos reales: tapa y cantos).
    part('tray', flat(TW, TD, -14), TW, TD, TRAY_TOP(tex));
    part('tray', `translate3d(${TW / 2}px,-14px,${TD / 2}px) rotateY(90deg)`, TD, 14, TRAY_EDGE(TD, tex), 'sc-mare-bf');
    part('tray', `translate3d(${-TW / 2}px,-14px,${-TD / 2}px) rotateY(-90deg)`, TD, 14, TRAY_EDGE(TD, tex), 'sc-mare-bf');
    part('tray', `translate3d(${-TW / 2}px,-14px,${TD / 2}px)`, TW, 14, TRAY_EDGE(TW, tex), 'sc-mare-bf');

    // Taza: sombra, cuerpo, boca, chorros y vapor.
    obj('cup', POS.cupUnder, true);
    obj('cupSh', POS.cupUnder);
    const cupSh = part('cupSh', flat(120, 84, -0.3, 8, -4), 120, 84, '', 'sc-mare-shd');
    part('cup', stand(132, 64, 56), 132, 76, CUP_BODY);
    part('cup', flat(100, 100, -54, 0, 0), 100, 100, CUP_TOP);
    obj('streams', [POS.pfGroup[0], -102, POS.cupUnder[2] - 2], true);
    const streams = part('streams', 'translate3d(-20px,0px,0px)', 40, 60, STREAMS);
    obj('steam', [0, 0, 0], true);
    const steam = part('steam', 'translate3d(-50px,-150px,0px)', 100, 96, CUP_STEAM);

    // Portafiltro y cabezal (el cabezal tapa la canasta al encajar).
    obj('pf', POS.pfGrinder, true);
    part('pf', 'translate3d(-40px,-24px,0px)', 230, 80, PORTAFILTER);
    obj('group', [POS.machine[0], -140, 56], true);
    part('group', stand(110, 66), 110, 72, GROUP);

    // Lanceta de vapor y nubes de vapor.
    obj('wand', [74, -200, 48], true);
    part('wand', 'translate3d(-9px,-9px,0px)', 70, 110, WAND);
    obj('puffs', [112, -112, 52], true);
    const puffsRec = part('puffs', 'translate3d(-70px,-150px,0px)', 140, 160, PUFFS);

    // Referencias a las partes animadas.
    const $ = k => root.querySelector(`[data-k="${k}"]`);
    const R = {
      beans: $('beans'), dial: $('dial'), gdisp: $('gdisp'), grounds: [...$('grounds').children], fall: [...$('fall').children],
      mound: $('mound'), s1: $('s1'), s2: $('s2'), g1: $('g1'), g2: $('g2'), knob: $('knob'),
      coffee: $('coffee'), crema: $('crema'), cupArt: $('cupArt'),
      milk: $('milk'), swirl: $('swirl'), puffs: [...$('puffs').children],
      glow: $('glow'), elem: $('elem'), elem2: $('elem2'), digits: $('digits'), doorGlow: $('doorGlow'),
      raw: $('raw'), baked: $('baked'),
      art: $('art'), lp: $('lp'), drop: $('drop'), stem: $('stem'), head: $('head'),
      leaves: Array.from({ length: 7 }, (_, i) => $(`leaf${i}`)),
      macro: root.querySelector('.sc-mare-macro'), label: root.querySelector('.sc-mare-label'),
      tags: TAGS.map(t => root.querySelector(`[data-tag="${t.k}"]`)), ticket: root.querySelector('.sc-mare-ticket'), pill: root.querySelector('.sc-mare-ticket .k5')
    };
    R.tagV = R.tags.map(t => t.querySelector('b'));

    const set = (el, a) => { for (const k in a) el.setAttribute(k, a[k]); };
    const tr = (el, s) => el.setAttribute('transform', s);
    const op = (el, v) => el.setAttribute('opacity', f3(clamp(v)));
    const cssOp = (el, v) => { el.style.opacity = f3(clamp(v)); el.style.visibility = v > 0.002 ? 'visible' : 'hidden'; };

    // ---------- Medidas (al montar y al cambiar de tamaño) ----------
    let L = null, lastP = 0;
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return false;
      const narrow = W / H < 1.6;
      const k = W / 1200 * (narrow ? 1.12 : 1);
      const P = W * 1.55;
      view.style.perspective = `${n(P)}px`;
      L = { W, H, k, P, narrow };
      return true;
    }

    function render(p) {
      lastP = p;
      if (!L && !layout()) return;
      const { W, H, k, P, narrow } = L;
      const c = camAt(p);
            const D = P / c.z;
      const CAMS = `translate3d(${n(W / 2)}px,${n(H / 2)}px,${n(P - D)}px) rotateX(${n(-c.pitch)}deg) rotateY(${n(c.yaw)}deg) scale3d(${f3(k)},${f3(k)},${f3(k)}) translate3d(${n(-c.t[0])}px,${n(-c.t[1])}px,${n(-c.t[2])}px)`;
      // Proyección de un punto del mundo a la pantalla (misma matemática que la perspectiva de CSS).
      const cy = Math.cos(c.yaw * Math.PI / 180), sy = Math.sin(c.yaw * Math.PI / 180);
      const cp = Math.cos(-c.pitch * Math.PI / 180), sp = Math.sin(-c.pitch * Math.PI / 180);
      const project = (x, y, z) => {
        const vx = (x - c.t[0]) * k, vy = (y - c.t[1]) * k, vz = (z - c.t[2]) * k;
        const x1 = vx * cy + vz * sy, z1 = -vx * sy + vz * cy;
        const y2 = vy * cp - z1 * sp, z2 = vy * sp + z1 * cp + P - D;
        const s = P / (P - z2);
        return [W / 2 + x1 * s, H / 2 + y2 * s, s];
      };

      // 1 · Molemos el grano.
      R.fall.forEach((b, i) => {
        const t = seg(p, 0.004 + i * 0.007, 0.032 + i * 0.007);
        const x = 60 + ((i % 3) - 1) * 12, y = lerp(40, 380 + (i % 2) * 10, eIn(t));
        tr(b, `translate(${n(x)} ${n(y)}) rotate(${n(i * 50 + t * 280)})`);
        op(b, t > 0 && t < 1 ? 1 : 0);
      });
      O.fall.vis = p < 0.075;
      const pile = 18 * (1 - eOut(seg(p, 0.015, 0.06))) + 40 * eIO(seg(p, 0.06, 0.14));
      tr(R.beans, `translate(0 ${n(pile)})`);
      const grind = bell(p, 0.055, 0.065, 0.135, 0.145);
      O.grinder.extra = ` translate3d(${n(grind * Math.sin(p * 2600) * 0.6)}px,0px,0px)`;
      tr(R.dial, `rotate(${n(150 * seg(p, 0.05, 0.065) - 150 * seg(p, 0.14, 0.155))})`);
      R.gdisp.textContent = `${(18 * eIO(seg(p, 0.06, 0.14))).toFixed(1).replace('.', ',')}`;
      R.grounds.forEach((g, i) => {
        const t = frac(p * 95 + i / 7);
        set(g, { cx: n(100 + ((i % 3) - 1) * 3.4 + Math.sin(i * 7 + t * 4) * 1.2), cy: n(288 + t * 18), opacity: f3(grind * (t < 0.85 ? 1 : (1 - t) / 0.15)) });
      });
      const mound = eOut(seg(p, 0.06, 0.14));
      tr(R.mound, `translate(0 14) scale(1 ${f3(Math.max(0.001, mound))}) translate(0 -14)`);

      // Portafiltro: del molino al cabezal, sube y gira en 3D para encajar.
      const tc = eIO(seg(p, 0.15, 0.215));
      let pfx = lerp(POS.pfGrinder[0], POS.pfGroup[0], tc), pfz = lerp(POS.pfGrinder[2], POS.pfGroup[2], tc);
      let pfy = lerp(POS.pfGrinder[1], POS.pfGroup[1] + 16, tc) - Math.sin(Math.PI * tc) * 46;
      if (p > 0.215) pfy = lerp(POS.pfGroup[1] + 16, POS.pfGroup[1], eOut(seg(p, 0.215, 0.232)));
      const twist = lerp(-18, 32, eIO(seg(p, 0.17, 0.215))) - 46 * eBack(seg(p, 0.23, 0.25), 2.2);
      const tilt = -Math.sin(Math.PI * tc) * 6;
      Object.assign(O.pf, { x: pfx, y: pfy, z: pfz, extra: ` rotateY(${n(twist)}deg) rotateZ(${n(tilt)}deg)` });

      // 2 · Extraemos el espresso.
      const head = eOut(seg(p, 0.255, 0.27)), tail = eIn(seg(p, 0.318, 0.334));
      const sTop = tail * 26, sBot = head * 26;
      const wob = Math.sin(p * 900) * 0.25;
      [R.s1, R.s2].forEach((s, i) => set(s, { y: n(sTop), height: n(Math.max(0, sBot - sTop)), x: n((i ? 23.4 : 13.4) + wob), opacity: head > 0 && tail < 1 ? 1 : 0 }));
      O.streams.vis = p > 0.25 && p < 0.34;
      const lvl = eIO(seg(p, 0.26, 0.33));
      set(R.coffee, { r: n(lerp(14, 40, lvl)), opacity: f3(seg(p, 0.262, 0.272)) });
      op(R.crema, seg(p, 0.29, 0.345));
      const press = bell(p, 0.25, 0.265, 0.325, 0.345);
      tr(R.g1, `rotate(${n(-120 + 150 * press)})`);
      tr(R.g2, `rotate(${n(-60 + 70 * eIO(seg(p, 0.36, 0.4)) - 70 * eIO(seg(p, 0.48, 0.5)))})`);
      R.tagV[1].textContent = `${Math.round(25 * seg(p, 0.255, 0.33))} s`;

      // La taza pasa de la bandeja de goteo a su platillo (bajo la vista cenital).
      const ct = eIO(seg(p, 0.53, 0.6));
      const cupX = lerp(POS.cupUnder[0], POS.cupTray[0], ct), cupZ = lerp(POS.cupUnder[2], POS.cupTray[2], ct);
      const cupY = lerp(POS.cupUnder[1], POS.cupTray[1], ct) - Math.sin(Math.PI * ct) * 50;
      Object.assign(O.cup, { x: cupX, y: cupY, z: cupZ });
      Object.assign(O.cupSh, { x: cupX, y: ct < 0.5 ? POS.cupUnder[1] : POS.cupTray[1], z: cupZ, op: 1 - Math.sin(Math.PI * ct) * 0.8 });
      Object.assign(O.steam, { x: cupX, y: cupY - 52, z: cupZ, op: seg(p, 0.31, 0.35) * (1 - 0.6 * bell(p, 0.5, 0.53, 0.6, 0.64)) });
      op(R.cupArt, seg(p, 0.63, 0.655));

      // 3 · Texturizamos la leche.
      const lift = eIO(seg(p, 0.365, 0.395)) - eIO(seg(p, 0.475, 0.5));
      const go = eIO(seg(p, 0.355, 0.38)) - eIO(seg(p, 0.48, 0.51));
      const steamOn = bell(p, 0.392, 0.405, 0.465, 0.478);
      const foam = eOut(seg(p, 0.4, 0.47));
      const pX = lerp(POS.pitcherRest[0], POS.pitcherWand[0], go), pZ = lerp(POS.pitcherRest[2], POS.pitcherWand[2], go);
      Object.assign(O.pitcher, { x: pX, y: -34 * lift, z: pZ, extra: ` rotateZ(${n(-4 * lift)}deg)` });
      Object.assign(O.pSh, { x: pX, z: pZ, op: 1 - lift * 0.55 });
      O.pSh.extra = ` scale3d(${f3(1 + lift * 0.25)},1,${f3(1 + lift * 0.25)})`;
      tr(R.milk, `translate(38 38) scale(${f3(1 + foam * 0.04)}) translate(-38 -38)`);
      tr(R.swirl, `rotate(${n((p * 9000) % 360)})`);
      tr(R.knob, `rotate(${n(80 * steamOn)})`);
      R.puffs.forEach((pf, i) => {
        const t = frac(p * 42 + i / 7);
        const x = Math.sin(i * 2.3 + t * 3) * 14 + (i % 2 ? 8 : -8);
        const y = -34 * lift - 8 - t * 70;
        set(pf, { cx: n(x), cy: n(y), r: n(8 + t * 16), opacity: f3(steamOn * (1 - t) * Math.min(1, t * 5) * 0.95) });
      });
      O.puffs.vis = steamOn > 0.001;
      R.tagV[2].textContent = `${Math.round(lerp(20, 65, eIO(seg(p, 0.4, 0.47))))} °C`;

      // 4 · Dibujamos el arte latte (vista cenital a pantalla completa).
      const lo = seg(p, 0.5, 0.535), lc = seg(p, 0.635, 0.668);
      const mv = eOut(lo) * (1 - eIO(lc));
      cssOp(R.macro, mv);
      cssOp(R.label, mv * seg(p, 0.52, 0.545));
      R.label.style.transform = `translate(-50%,${n((1 - mv) * 8)}px)`;
      if (mv > 0.002) {
        R.macro.style.transform = `scale(${f3(lerp(1.18, 1, eOut(lo)) * lerp(1, 0.92, eIO(lc)))}) rotate(${n(lerp(-4, 0, eOut(lo)) + lerp(0, 3, eIO(lc)))}deg)`;
        let ppx = 0, ppy = 92;
        const pourW = Math.sin((p - 0.556) * 760);
        if (p >= 0.556 && p < 0.61) { const t = seg(p, 0.556, 0.61); ppy = lerp(88, -84, t); ppx = pourW * 26 * (1 - 0.55 * t); }
        else if (p >= 0.61) ppy = lerp(-112, 132, eIO(seg(p, 0.612, 0.627)));
        const a = eOut(seg(p, 0.532, 0.556)), away = eIO(seg(p, 0.624, 0.645));
        const off = (1 - a) + away;
        tr(R.lp, `translate(${n(ppx + off * 260)} ${n(ppy - off * 300)}) rotate(${n(pourW * 3 * (p > 0.556 && p < 0.61 ? 1 : 0))})`);
        op(R.drop, bell(p, 0.552, 0.557, 0.625, 0.629));
        R.leaves.forEach((leaf, i) => {
          const t = seg(p, 0.557 + i * 0.0072, 0.566 + i * 0.0072);
          op(leaf, Math.min(1, t * 2.5));
          const y = 40 - i * 13;
          tr(leaf, `translate(0 ${y}) scale(${f3(0.35 + 0.65 * eBack(t))} ${f3(0.5 + 0.5 * eOut(t))}) translate(0 ${-y})`);
        });
        const ht = seg(p, 0.607, 0.615);
        op(R.head, ht);
        tr(R.head, `translate(0 -55) scale(${f3(0.4 + 0.6 * eBack(ht))}) translate(0 55)`);
        R.stem.setAttribute('stroke-dashoffset', f3(1 - eIO(seg(p, 0.612, 0.627))));
      }

      // 5 · Horneamos el croissant.
      const heatOn = eIO(seg(p, 0.675, 0.735));
      const heat = heatOn * (1 - 0.55 * eIO(seg(p, 0.835, 0.875)));
      op(R.glow, heat * 0.95);
      op(R.elem, heat); op(R.elem2, heat * 0.8);
      op(R.doorGlow, heat * 0.2);
      O.spill.op = heat; O.spill.vis = heat > 0.002;
      R.digits.textContent = `${Math.round(lerp(20, 200, heatOn))}°`;
      const bake = eIO(seg(p, 0.7, 0.81));
      op(R.baked, bake);
      op(R.raw, 1 - seg(p, 0.76, 0.81));
      const open = eIO(seg(p, 0.835, 0.862)) - eIO(seg(p, 0.935, 0.965));
      O.door.extra = ` rotateX(${n(-84 * open)}deg)`;

      // 6 · Listo para recoger: el croissant vuela al plato y aparece el ticket.
      const rise = eOut(seg(p, 0.7, 0.79));
      const ft = eIO(seg(p, 0.862, 0.93));
      const land = seg(p, 0.93, 0.955);
      let cs = 0.84 + 0.16 * rise, crx = POS.croisOven[0], cry = POS.croisOven[1], crz = POS.croisOven[2], crr = 0;
      if (ft > 0) {
        const q = (a, m, b) => (1 - ft) * (1 - ft) * a + 2 * (1 - ft) * ft * m + ft * ft * b;
        crx = q(POS.croisOven[0], 230, POS.plate[0]);
        crz = q(POS.croisOven[2], 160, POS.plate[2]);
        cry = q(POS.croisOven[1], -220, POS.plate[1]);
        cs = lerp(1, 0.86, ft); crr = Math.sin(Math.PI * ft) * -12;
      }
      const sq = land > 0 && land < 1 ? 1 - 0.1 * Math.sin(Math.PI * land) : 1;
      Object.assign(O.crois, { x: crx, y: cry, z: crz, extra: ` rotateZ(${n(crr)}deg) scale3d(${f3(cs * (2 - sq))},${f3(cs * sq)},1)` });
      const outOv = p > 0.85;
      crois.el.style.zIndex = outOv ? '3' : '';
      crSh.el.style.zIndex = outOv ? '3' : '';
      const onPlate = ft >= 1;
      Object.assign(O.crSh, { x: crx, y: onPlate ? POS.plate[1] : ft > 0 ? -16 : POS.croisOven[1], z: crz, op: ft > 0 && !onPlate ? 0.25 * (1 - Math.sin(Math.PI * ft)) : 1 });

      // ---------- Aplicar transformaciones del mundo ----------
      const objT = {};
      for (const key in O) {
        const o = O[key];
        objT[key] = ` translate3d(${n(o.x)}px,${n(o.y)}px,${n(o.z)}px)${o.bill ? ` rotateY(${n(-c.yaw)}deg)` : ''}${o.extra}`;
      }
      for (const q of parts) {
        const o = O[q.o];
        const vis = o.vis && o.op > 0.002;
        if (vis !== q.vis) { q.el.style.visibility = vis ? '' : 'hidden'; q.vis = vis; }
        if (!vis) continue;
        q.el.style.transform = CAMS + objT[q.o] + ' ' + q.local;
        const ov = Math.round(o.op * 1000) / 1000;
        if (ov !== q.op) { q.el.style.opacity = ov >= 1 ? '' : String(ov); q.op = ov; }
      }

      // ---------- Rótulos (HTML nítido anclado a puntos del mundo) ----------
      const tagVis = [bell(p, 0.1, 0.118, 0.148, 0.165), bell(p, 0.26, 0.275, 0.335, 0.352), bell(p, 0.395, 0.41, 0.49, 0.505), bell(p, 0.71, 0.725, 0.818, 0.832)];
      TAGS.forEach((t, i) => {
        const v = tagVis[i], el = R.tags[i];
        cssOp(el, v);
        if (v <= 0.002) return;
        const [sx, sy] = project(t.at[0], t.at[1], t.at[2]);
        el.style.transform = `translate(${n(sx)}px,${n(sy)}px) translate(0,-50%) translateY(${n((1 - eOut(v)) * 10)}px)`;
      });
      const tk = seg(p, 0.905, 0.962);
      cssOp(R.ticket, Math.min(1, tk * 4));
      if (tk > 0) {
        const [sx, sy, s] = project(POS.tray[0] + 230, -6, POS.tray[2] + 30);
        const w = R.ticket.offsetWidth || 140;
        const x = Math.min(W - w - 8, sx - w * 0.2);
        R.ticket.style.transform = `translate(${n(x + (1 - eOut(tk)) * W * 0.3)}px,${n(sy - (R.ticket.offsetHeight || 150))}px) rotate(${n(lerp(14, -2.5, eBack(tk)))}deg)`;
        const pt = seg(p, 0.95, 0.975);
        R.pill.style.transform = `scale(${f3(lerp(0.6, 1, eBack(pt)))})`;
        R.pill.style.opacity = pt > 0 ? '1' : '0';
      }
    }

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (layout()) render(lastP); }).observe(stage);
    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.mare = {
    title: 'Así preparamos tu pausa en Maré',
    duration: 18000,
    steps: [
      { label: 'Molemos el grano', at: 0 },
      { label: 'Extraemos el espresso', at: 0.16 },
      { label: 'Texturizamos la leche', at: 0.34 },
      { label: 'Dibujamos el arte latte', at: 0.5 },
      { label: 'Horneamos el croissant', at: 0.66 },
      { label: 'Listo para recoger', at: 0.83 }
    ],
    mount
  };
})();
