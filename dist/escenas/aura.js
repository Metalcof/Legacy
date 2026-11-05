'use strict';
// Escena AURA: render 3D en tiempo real de una casa tropical moderna que se construye de terreno vacío a habitable.
// Motor propio en canvas 2D: cámara en perspectiva, sol coherente con la hora del día, texturas procedurales,
// sombras suaves proyectadas, oclusión ambiental, neblina y luces interiores al atardecer.
// Todo se calcula desde el progreso p (0..1): render(p) es puro, se puede adelantar, retroceder y pausar.
(() => {
  // ---------- Utilidades ----------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t, s = 1.5) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
  const rad = d => (d * Math.PI) / 180;
  // Interpola entre fotogramas clave [[p, valor], …] con curva suave.
  const keys = (p, list) => {
    if (p <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (p <= list[i][0]) return lerp(list[i - 1][1], list[i][1], easeInOut(seg(p, list[i - 1][0], list[i][0])));
    }
    return list[list.length - 1][1];
  };
  const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const keysC = (p, list) => {
    if (p <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (p <= list[i][0]) return mixC(list[i - 1][1], list[i][1], easeInOut(seg(p, list[i - 1][0], list[i][0])));
    }
    return list[list.length - 1][1];
  };
  const b255 = v => Math.round(clamp(v) * 255);
  const css = (c, a = 1) => (a >= 1 ? `rgb(${b255(c[0])},${b255(c[1])},${b255(c[2])})` : `rgba(${b255(c[0])},${b255(c[1])},${b255(c[2])},${clamp(a).toFixed(3)})`);
  // Generador pseudoaleatorio con semilla: las texturas y la vegetación salen idénticas en cada carga.
  const rng = seed => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const NRM = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], top: [0, 0, 1] };
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // Afín que lleva 3 puntos de textura (u, v) a 3 puntos de pantalla (x, y).
  function affine3(t0, t1, t2, s0, s1, s2) {
    const du1 = t1[0] - t0[0], dv1 = t1[1] - t0[1], du2 = t2[0] - t0[0], dv2 = t2[1] - t0[1];
    const det = du1 * dv2 - du2 * dv1 || 1e-6;
    const a = ((s1[0] - s0[0]) * dv2 - (s2[0] - s0[0]) * dv1) / det;
    const c = ((s2[0] - s0[0]) * du1 - (s1[0] - s0[0]) * du2) / det;
    const b = ((s1[1] - s0[1]) * dv2 - (s2[1] - s0[1]) * dv1) / det;
    const d = ((s2[1] - s0[1]) * du1 - (s1[1] - s0[1]) * du2) / det;
    return [a, b, c, d, s0[0] - a * t0[0] - c * t0[1], s0[1] - b * t0[0] - d * t0[1]];
  }
  function hull(points) {
    const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    up.pop(); lo.pop();
    return lo.concat(up);
  }

  // ---------- Texturas procedurales (se pintan una sola vez al montar) ----------
  function noise2(rand, w, h, cells) {
    const gx = cells, gy = Math.max(1, Math.round((cells * h) / w));
    const g = new Float32Array(gx * gy);
    for (let i = 0; i < g.length; i++) g[i] = rand();
    return (x, y) => {
      const fx = (x / w) * gx, fy = (y / h) * gy;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      let tx = fx - x0, ty = fy - y0;
      tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const at = (a, b) => g[(((b % gy) + gy) % gy) * gx + (((a % gx) + gx) % gx)];
      return lerp(lerp(at(x0, y0), at(x0 + 1, y0), tx), lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx), ty);
    };
  }
  function fbm(rand, w, h, base, oct) {
    const fs = [];
    for (let o = 0; o < oct; o++) fs.push(noise2(rand, w, h, base * 2 ** o));
    return (x, y) => { let s = 0, a = 0.5, t = 0; for (const f of fs) { s += f(x, y) * a; t += a; a *= 0.5; } return s / t; };
  }
  function paint(w, h, fn) {
    const c = cv(w, h), g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = fn(x, y), i = (y * w + x) * 4;
      d[i] = clamp(v[0], 0, 255); d[i + 1] = clamp(v[1], 0, 255); d[i + 2] = clamp(v[2], 0, 255); d[i + 3] = v[3] === undefined ? 255 : v[3];
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function buildTextures() {
    const T = {};
    let r = rng(11);
    // Concreto a la vista con tablas de formaleta (2,4 × 1,2 m).
    let n1 = fbm(r, 128, 64, 4, 4), n2 = noise2(r, 128, 64, 64);
    const boards = Array.from({ length: 8 }, () => (r() - 0.5) * 12);
    T.conc = paint(128, 64, (x, y) => {
      let v = 226 + (n1(x, y) - 0.5) * 46 + (n2(x, y) - 0.5) * 16 + boards[y >> 3];
      if (y % 8 === 0) v -= 13;
      if ((x % 32 === 16) && (y % 16 === 4)) v -= 46;
      return [v, v - 1, v - 4];
    });
    // Pañete blanco liso (3 × 3 m).
    r = rng(12); n1 = fbm(r, 64, 64, 3, 4);
    T.plaster = paint(64, 64, (x, y) => { const v = 238 + (n1(x, y) - 0.5) * 22; return [v, v, v - 2]; });
    // Bloque de concreto en obra negra (3,2 × 1,6 m: bloques de 40 × 20 cm).
    r = rng(13); n1 = fbm(r, 128, 64, 8, 3);
    const tones = Array.from({ length: 80 }, () => (r() - 0.5) * 26);
    T.block = paint(128, 64, (x, y) => {
      const row = y >> 3, xs = x + (row % 2 ? 8 : 0), col = (xs >> 4) % 8;
      let v = 205 + tones[row * 8 + col] + (n1(x, y) - 0.5) * 30;
      if (y % 8 === 0 || xs % 16 === 0) v = 238;
      return [v, v, v - 3];
    });
    // Piedra natural en hiladas irregulares (2,4 × 1,2 m).
    r = rng(14);
    const st = cv(128, 64), sg = st.getContext('2d');
    sg.fillStyle = '#857c70'; sg.fillRect(0, 0, 128, 64);
    let yy = 0;
    const heights = [12, 15, 10, 16, 11];
    let hi = 0;
    while (yy < 64) {
      const h = Math.min(heights[hi++ % heights.length], 64 - yy);
      let xx = 0;
      while (xx < 128) {
        let w = 18 + Math.floor(r() * 30);
        if (128 - xx - w < 14) w = 128 - xx;
        const tone = 196 + r() * 52, warm = r() * 16;
        sg.fillStyle = `rgb(${tone + warm},${tone + warm * 0.5},${tone - warm * 0.4})`;
        sg.fillRect(xx + 1, yy + 1, w - 2, h - 2);
        sg.fillStyle = 'rgba(255,255,255,.28)'; sg.fillRect(xx + 1, yy + 1, w - 2, 1);
        sg.fillStyle = 'rgba(0,0,0,.22)'; sg.fillRect(xx + 1, yy + h - 2, w - 2, 1);
        xx += w;
      }
      yy += h;
    }
    {
      const id = sg.getImageData(0, 0, 128, 64), d = id.data, nn = noise2(r, 128, 64, 64);
      for (let i = 0; i < d.length; i += 4) { const k = (nn((i / 4) % 128, Math.floor(i / 512)) - 0.5) * 34; d[i] += k; d[i + 1] += k; d[i + 2] += k; }
      sg.putImageData(id, 0, 0);
    }
    T.stone = st;
    // Madera de piso exterior: tablas a lo largo (2 × 1 m).
    r = rng(15); n1 = fbm(r, 128, 64, 4, 3); n2 = noise2(r, 128, 64, 32);
    const pl = Array.from({ length: 8 }, () => ({ t: (r() - 0.5) * 34, j: Math.floor(r() * 128) }));
    T.deck = paint(128, 64, (x, y) => {
      const k = Math.floor(y / 8), pk = pl[k];
      let v = 214 + pk.t + Math.sin(y * 2.1 + n1(x, y) * 9 + k) * 10 + (n2(x, y) - 0.5) * 14;
      if (y % 8 === 7) v = 96;
      if (Math.abs(x - pk.j) < 1) v = 120;
      return [v, v - 4, v - 10];
    });
    // Listones verticales de madera (1 × 1 m: 8 listones).
    r = rng(16); n1 = fbm(r, 64, 64, 4, 3);
    T.slats = paint(64, 64, (x, y) => {
      const k = x % 8;
      if (k >= 6) return [52, 40, 32];
      let v = 220 + Math.sin(x * 3.1 + n1(x, y) * 12) * 12 + (n1(x * 3 % 64, y) - 0.5) * 22;
      if (k === 0) v += 22;
      if (k === 5) v -= 34;
      return [v, v - 6, v - 14];
    });
    // Madera vertical para la puerta (1 × 2 m).
    r = rng(17); n1 = fbm(r, 64, 128, 4, 3);
    T.door = paint(64, 128, (x, y) => { const v = 214 + Math.sin(x * 1.3 + n1(x, y) * 10) * 14; return [v, v - 6, v - 14]; });
    // Tierra removida (8 × 8 m).
    r = rng(18); n1 = fbm(r, 128, 128, 4, 5); n2 = noise2(r, 128, 128, 128);
    T.soil = paint(128, 128, (x, y) => {
      let v = 214 + (n1(x, y) - 0.5) * 70 + (n2(x, y) - 0.5) * 34;
      if (n2(x * 2 % 128, y) > 0.86) v += 26;
      return [v, v - 4, v - 10];
    });
    // Césped con franjas de corte suaves (6 × 6 m).
    r = rng(19); n1 = fbm(r, 128, 128, 4, 5); n2 = noise2(r, 128, 128, 128);
    T.grass = paint(128, 128, (x, y) => {
      const v = 214 + (n1(x, y) - 0.5) * 56 + (n2(x, y) - 0.5) * 40 + ((x >> 5) % 2 ? 8 : -6);
      return [v - 6, v, v - 10];
    });
    // Baldosa de piscina (1 × 1 m: piezas de 25 cm).
    T.tile = paint(64, 64, (x, y) => (x % 16 === 0 || y % 16 === 0 ? [255, 255, 255] : [226, 236, 236]));
    // Triplex de formaleta (2,4 × 1,2 m).
    r = rng(20); n1 = fbm(r, 64, 32, 4, 3);
    T.ply = paint(64, 32, (x, y) => {
      let v = 222 + Math.sin(y * 1.9 + n1(x, y) * 8) * 10;
      if (x === 0 || y === 0) v = 150;
      return [v, v - 4, v - 12];
    });
    // Grava clara de cubierta (4 × 4 m).
    r = rng(21); n2 = noise2(r, 64, 64, 64);
    T.gravel = paint(64, 64, (x, y) => { const v = 222 + (n2(x, y) - 0.5) * 50; return [v, v, v - 3]; });
    // Manchas grandes de pradera (60 × 60 m).
    r = rng(24); n1 = fbm(r, 64, 64, 3, 4);
    T.field = paint(64, 64, (x, y) => { const v = 220 + (n1(x, y) - 0.5) * 90; return [v, v, v - 6]; });
    // Cáusticas del agua (para la capa animada con CSS).
    r = rng(22); n1 = fbm(r, 128, 128, 4, 2);
    T.caus = paint(128, 128, (x, y) => {
      const v = Math.abs(n1(x, y) - 0.5) * 2;
      const a = Math.pow(clamp(1 - v * 6), 3) * 255;
      return [235, 255, 252, a];
    });
    // Grano de película estático.
    r = rng(23);
    T.grain = paint(128, 128, () => { const v = 128 + (r() - 0.5) * 120; return [v, v, v]; });
    return T;
  }

  // ---------- Vegetación, nubes y montañas (sprites pintados al montar) ----------
  function duskOf(src, tint, amt) {
    const c = cv(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = css(tint, amt);
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function blobs(g, rand, list, dark, mid, lit, light, cx, cy, R0) {
    // list: [{x, y, r, n}] grupos de hojas; light: dirección de la luz en el sprite.
    // La luz combina la posición dentro del grupo y dentro de toda la copa (volumen esférico).
    for (const cl of list) {
      const gr = g.createRadialGradient(cl.x, cl.y, cl.r * 0.2, cl.x, cl.y, cl.r);
      gr.addColorStop(0, css(mixC(dark, [0, 0, 0], 0.35))); gr.addColorStop(1, css(dark));
      g.fillStyle = gr;
      g.beginPath(); g.ellipse(cl.x, cl.y + cl.r * 0.06, cl.r * 0.9, cl.r * 0.78, 0, 0, Math.PI * 2); g.fill();
    }
    const all = [];
    for (const cl of list) {
      for (let i = 0; i < cl.n; i++) {
        const a = rand() * Math.PI * 2, d = Math.pow(rand(), 0.42) * cl.r;
        const x = cl.x + Math.cos(a) * d, y = cl.y + Math.sin(a) * d * 0.82;
        const lLocal = ((x - cl.x) * light[0] + (y - cl.y) * light[1]) / cl.r;
        const lGlob = ((x - cx) * light[0] + (y - cy) * light[1]) / R0;
        const rim = d / cl.r;
        all.push({ x, y, l: lLocal * 0.55 + lGlob * 0.75 + rim * 0.25 - 0.1 + (rand() - 0.5) * 0.45, s: (cl.leaf || 2.4) + rand() * (cl.leaf || 2.4) * 1.2, a: rand() * Math.PI, h: rand() });
      }
    }
    all.sort((a, b) => a.l - b.l);
    for (const b of all) {
      const t = clamp(0.5 + 0.55 * b.l);
      let c = t < 0.5 ? mixC(dark, mid, t * 2) : mixC(mid, lit, (t - 0.5) * 2);
      c = mixC(c, b.h > 0.5 ? [c[0] * 1.08, c[1] * 1.04, c[2] * 0.82] : [c[0] * 0.9, c[1] * 0.98, c[2] * 1.08], Math.abs(b.h - 0.5));
      g.fillStyle = css(c);
      g.beginPath(); g.ellipse(b.x, b.y, b.s, b.s * 0.62, b.a, 0, Math.PI * 2); g.fill();
    }
  }
  function treeSprite(seed, pal) {
    const rand = rng(seed), W = 360, H = 420, c = cv(W, H), g = c.getContext('2d');
    const bx = W / 2;
    g.lineCap = 'round';
    const limb = (x0, y0, x1, y1, w) => {
      const gr = g.createLinearGradient(x0 - w, 0, x0 + w, 0);
      gr.addColorStop(0, '#9a8875'); gr.addColorStop(0.45, '#6e5d4e'); gr.addColorStop(1, '#2f2620');
      g.strokeStyle = gr; g.lineWidth = w;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (rand() - 0.5) * 24, (y0 + y1) / 2, x1, y1); g.stroke();
    };
    limb(bx, H, bx + 4, H * 0.48, 15);
    for (let k = 0; k < 7; k++) limb(bx + 3, H * 0.6 - k * 9, bx + (k % 2 ? 1 : -1) * (40 + rand() * 90), H * 0.2 + rand() * 70, 7 - k * 0.7);
    const list = [];
    const cy = H * 0.34, R0 = W * 0.36;
    for (let k = 0; k < 13; k++) {
      const a = (k / 13) * Math.PI * 2 + rand() * 0.5, d = k === 0 ? 0 : 0.45 + rand() * 0.5;
      list.push({ x: bx + Math.cos(a) * W * 0.28 * d, y: cy + Math.sin(a) * H * 0.15 * d - (k === 0 ? 10 : 0), r: 44 + rand() * 26, n: 230 });
    }
    list.sort((a, b) => a.y - b.y);
    blobs(g, rand, list, pal[0], pal[1], pal[2], [-0.55, -0.83], bx, cy, R0);
    // huecos de cielo entre el follaje
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) {
      const cl = list[Math.floor(rand() * list.length)], a = rand() * Math.PI * 2, d = cl.r * (0.75 + rand() * 0.3);
      g.beginPath(); g.arc(cl.x + Math.cos(a) * d, cl.y + Math.sin(a) * d * 0.8, 2 + rand() * 4, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    if (pal[3]) {
      // flores (guayacán amarillo)
      for (let i = 0; i < 900; i++) {
        const cl = list[Math.floor(rand() * list.length)];
        const a = rand() * Math.PI * 2, d = Math.pow(rand(), 0.5) * cl.r * 0.95;
        const x = cl.x + Math.cos(a) * d, y = cl.y + Math.sin(a) * d * 0.82;
        const l = clamp(0.45 - ((x - bx) * 0.55 + (y - cy) * 0.83) / R0 * 0.7 + (rand() - 0.5) * 0.35);
        g.fillStyle = css(mixC(pal[3][0], pal[3][1], l));
        g.beginPath(); g.arc(x, y, 1.6 + rand() * 2.6, 0, Math.PI * 2); g.fill();
      }
    }
    return { day: c, ax: bx / W };
  }
  function palmSprite(seed) {
    const rand = rng(seed), W = 260, H = 320, c = cv(W * 1.4, H * 1.4), g = c.getContext('2d');
    g.scale(1.4, 1.4);
    const cx = W / 2 - 6, cy = 74;
    // tronco con anillos
    const pts = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([W / 2 + 12 * Math.sin(t * 2.2) * (1 - t) + (cx - W / 2) * t, H - t * (H - cy)]); }
    for (let i = 0; i < pts.length - 1; i++) {
      const w = lerp(10, 6.5, i / 24);
      const gr = g.createLinearGradient(pts[i][0] - w, 0, pts[i][0] + w, 0);
      gr.addColorStop(0, '#a99a86'); gr.addColorStop(0.5, '#857565'); gr.addColorStop(1, '#4b4137');
      g.strokeStyle = gr; g.lineWidth = w * 2; g.lineCap = 'butt';
      g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1] - 0.5); g.stroke();
      g.strokeStyle = 'rgba(40,32,26,.35)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(pts[i][0] - w, pts[i][1]); g.lineTo(pts[i][0] + w, pts[i][1] - 1); g.stroke();
    }
    // hojas
    const fronds = [];
    for (let k = 0; k < 15; k++) {
      const a = -Math.PI + (k / 14) * Math.PI + (rand() - 0.5) * 0.25;
      fronds.push({ a, len: 92 + rand() * 30, droop: 0.45 + rand() * 0.5, back: k % 3 === 1 });
    }
    fronds.push({ a: -Math.PI * 1.1, len: 90, droop: 1.1, back: false }, { a: 0.1, len: 88, droop: 1.1, back: false });
    fronds.sort((a, b) => (a.back ? -1 : 1) - (b.back ? -1 : 1));
    for (const f of fronds) {
      const ex = cx + Math.cos(f.a) * f.len, ey = cy + Math.sin(f.a) * f.len * 0.55 + f.droop * 52;
      const mx = cx + Math.cos(f.a) * f.len * 0.55, my = cy + Math.sin(f.a) * f.len * 0.5 - 18;
      const litSide = Math.cos(f.a) < 0.2;
      for (let i = 2; i <= 30; i++) {
        const t = i / 30, it = 1 - t;
        const px = it * it * cx + 2 * it * t * mx + t * t * ex, py = it * it * cy + 2 * it * t * my + t * t * ey;
        const tx = 2 * it * (mx - cx) + 2 * t * (ex - mx), ty = 2 * it * (my - cy) + 2 * t * (ey - my);
        const tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
        const L = 26 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 4;
        for (const s of [-1, 1]) {
          const lx = px + (nx * s * 0.75 + tx / tl * 0.45) * L, ly = py + (ny * s * 0.75 + tx / tl * 0.1) * L + L * 0.55;
          const shade = (s > 0) === litSide ? 0.85 : 0.35;
          g.strokeStyle = css(mixC([0.13, 0.25, 0.14], [0.52, 0.66, 0.32], f.back ? shade * 0.55 : shade + (rand() - 0.5) * 0.2));
          g.lineWidth = 2.2;
          g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + (lx - px) * 0.5, py + (ly - py) * 0.3, lx, ly); g.stroke();
        }
      }
      g.strokeStyle = '#6d7b3e'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    }
    g.fillStyle = '#6e5a2c';
    for (const [dx, dy] of [[-6, 8], [3, 10], [-1, 4]]) { g.beginPath(); g.arc(cx + dx, cy + dy, 4.5, 0, Math.PI * 2); g.fill(); }
    return { day: c, ax: (W / 2) / W };
  }
  function shrubSprite(seed, flower) {
    const rand = rng(seed), W = 160, H = 96, c = cv(W, H), g = c.getContext('2d');
    const list = [];
    for (let k = 0; k < 6; k++) list.push({ x: 30 + k * 20 + (rand() - 0.5) * 10, y: H - 30 - rand() * 18 - Math.sin((k / 5) * Math.PI) * 16, r: 20 + rand() * 10, n: 110, leaf: 2.2 });
    blobs(g, rand, list, [0.11, 0.2, 0.12], [0.24, 0.4, 0.2], [0.55, 0.68, 0.32], [-0.55, -0.83], W / 2, H - 40, 60);
    if (flower) {
      for (let i = 0; i < 70; i++) {
        const cl = list[Math.floor(rand() * list.length)];
        const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * cl.r * 0.9;
        g.fillStyle = css(mixC(flower[0], flower[1], rand()));
        g.beginPath(); g.arc(cl.x + Math.cos(a) * d, cl.y + Math.sin(a) * d * 0.8, 2 + rand() * 2.5, 0, Math.PI * 2); g.fill();
      }
    }
    return { day: c, ax: 0.5 };
  }
  function cloudSprite(seed) {
    const rand = rng(seed), W = 420, H = 150;
    const puffs = [];
    for (let i = 0; i < 26; i++) {
      const t = rand();
      puffs.push({ x: 60 + t * 300, y: 96 - Math.sin(t * Math.PI) * (30 + rand() * 30) + rand() * 14, r: 22 + rand() * 30 * Math.sin(t * Math.PI + 0.3) });
    }
    const make = (top, bot) => {
      const c = cv(W, H), g = c.getContext('2d');
      for (const p of puffs) {
        const gr = g.createRadialGradient(p.x - p.r * 0.25, p.y - p.r * 0.35, p.r * 0.1, p.x, p.y, p.r);
        gr.addColorStop(0, css(top, 0.95)); gr.addColorStop(0.65, css(mixC(top, bot, 0.6), 0.75)); gr.addColorStop(1, css(bot, 0));
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
      }
      g.globalCompositeOperation = 'destination-out';
      const fade = g.createLinearGradient(0, 104, 0, 132);
      fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = fade; g.fillRect(0, 104, W, 46);
      return c;
    };
    return { day: make([1, 1, 1], [0.78, 0.82, 0.88]), dusk: make([1, 0.78, 0.6], [0.52, 0.42, 0.56]) };
  }
  function ridgeSprite(seed, W, H, amp, base, col, hazeTop, rough) {
    const rand = rng(seed), f = fbm(rand, W, 8, 6, 6);
    const prof = new Float32Array(W);
    for (let x = 0; x < W; x++) prof[x] = H * (base + amp * (f(x, 0) - 0.5) * 2 + rough * (f(x * 3 % W, 4) - 0.5));
    return paint(W, H, (x, y) => {
      const top = H - prof[x];
      if (y < top) return [0, 0, 0, 0];
      const slope = (prof[(x + 1) % W] - prof[(x + W - 1) % W]) * 0.5;
      const lit = clamp(0.5 + slope * 0.35, 0, 1);
      const k = (y - top) / Math.max(1, H - top);
      const c = mixC(mixC(col[0], col[1], lit), hazeTop, clamp(k * 0.8));
      return [c[0] * 255, c[1] * 255, c[2] * 255, 255];
    });
  }
  function treelineSprite(seed) {
    const rand = rng(seed), W = 1024, H = 64, c = cv(W, H), g = c.getContext('2d');
    for (let pass = 0; pass < 2; pass++) {
      for (let x = -10; x < W + 10; x += 5 + rand() * 7) {
        const r = 6 + rand() * 10 - pass * 2, y = H - 8 - rand() * 18 - r * 0.6 + pass * 6;
        const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.4, 1, x, y, r);
        gr.addColorStop(0, pass ? '#55704a' : '#46603f'); gr.addColorStop(1, pass ? '#2b3d2a' : '#22321f');
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
    }
    g.fillStyle = '#26352a'; g.fillRect(0, H - 10, W, 10);
    return c;
  }
  function frondSprite(seed) {
    // hojas de primer plano, desenfocadas una sola vez (profundidad de campo)
    const rand = rng(seed), W = 360, H = 300, c = cv(W, H), g = c.getContext('2d');
    for (let k = 0; k < 4; k++) {
      const x0 = 20 + k * 30, y0 = H + 10, a = -0.9 - k * 0.22, len = 240 - k * 25;
      const ex = x0 + Math.cos(a) * len, ey = y0 + Math.sin(a) * len;
      for (let i = 1; i <= 26; i++) {
        const t = i / 26, px = lerp(x0, ex, t), py = lerp(y0, ey, t) + Math.sin(t * Math.PI) * 30;
        const L = 50 * Math.sin(Math.PI * t) + 6;
        for (const s of [-1, 1]) {
          g.strokeStyle = css(mixC([0.05, 0.1, 0.06], [0.16, 0.26, 0.13], rand()), 0.95);
          g.lineWidth = 7;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a + s * 1.2) * L, py + Math.sin(a + s * 1.2) * L + 12); g.stroke();
        }
      }
    }
    const out = cv(W, H), og = out.getContext('2d');
    if ('filter' in og) { og.filter = 'blur(7px)'; og.drawImage(c, 0, 0); og.filter = 'none'; }
    else { og.imageSmoothingEnabled = true; const s = cv(W / 8, H / 8); s.getContext('2d').drawImage(c, 0, 0, W / 8, H / 8); og.drawImage(s, 0, 0, W, H); }
    return out;
  }

  // ---------- Materiales ----------
  const M = {
    conc: { c: [0.74, 0.73, 0.7], tex: 'conc', ts: [2.4, 1.2], ta: 0.85 },
    concFresh: { c: [0.56, 0.56, 0.55], tex: 'conc', ts: [2.4, 1.2], ta: 0.5 },
    slab: { c: [0.78, 0.77, 0.74], tex: 'conc', ts: [2.4, 1.2], ta: 0.55 },
    white: { c: [0.93, 0.92, 0.89], tex: 'plaster', ts: [3, 3], ta: 0.7 },
    block: { c: [0.64, 0.63, 0.6], tex: 'block', ts: [3.2, 1.6], ta: 1 },
    stone: { c: [0.86, 0.8, 0.72], tex: 'stone', ts: [2.4, 1.2], ta: 1 },
    deck: { c: [0.68, 0.46, 0.3], tex: 'deck', ts: [2, 1], ta: 1 },
    slats: { c: [0.72, 0.5, 0.32], tex: 'slats', ts: [1, 1], ta: 1 },
    door: { c: [0.62, 0.4, 0.25], tex: 'door', ts: [1, 2], ta: 1 },
    ply: { c: [0.84, 0.62, 0.38], tex: 'ply', ts: [2.4, 1.2], ta: 0.9 },
    steel: { c: [0.2, 0.21, 0.22] },
    rust: { c: [0.55, 0.3, 0.18] },
    rubber: { c: [0.1, 0.1, 0.11] },
    cab: { c: [0.9, 0.9, 0.88] },
    drum: { c: [0.92, 0.55, 0.18] },
    trailer: { c: [0.9, 0.9, 0.87] },
    crane: { c: [0.93, 0.7, 0.16] },
    coping: { c: [0.9, 0.87, 0.8], tex: 'conc', ts: [3, 1.5], ta: 0.35 },
    gravel: { c: [0.8, 0.79, 0.76], tex: 'gravel', ts: [4, 4], ta: 0.8 },
    green: { c: [0.42, 0.55, 0.27], tex: 'grass', ts: [4, 4], ta: 1 },
    pallet: { c: [0.66, 0.65, 0.62], tex: 'block', ts: [3.2, 1.6], ta: 1 },
    lumber: { c: [0.8, 0.62, 0.42], tex: 'deck', ts: [2, 1], ta: 0.8 },
    glass: { kind: 'glass' },
    void: { kind: 'void' },
    rail: { kind: 'rail' },
    bollard: { c: [0.16, 0.16, 0.17] }
  };

  // ---------- Cámara y luz a lo largo de la historia ----------
  const CAM = {
    yaw: [[0, 72], [0.13, 64], [0.32, 60], [0.62, 56], [0.82, 53], [1, 49]],
    pitch: [[0, 36], [0.13, 34], [0.32, 25], [0.62, 18], [0.82, 11], [1, 6.5]],
    dist: [[0, 62], [0.13, 50], [0.32, 52], [0.62, 52], [0.82, 48], [1, 45]],
    tx: [[0, 2], [0.32, 1.5], [1, 2.6]],
    ty: [[0, 0], [0.32, 0.5], [1, 1.6]],
    tz: [[0, 0], [0.32, 2], [1, 2.4]],
    fov: [[0, 44], [1, 44]],
    oy: [[0, 0.5], [0.32, 0.54], [1, 0.6]],
    oyM: [[0, 0.52], [0.32, 0.56], [1, 0.62]]
  };
  const SUN = {
    az: [[0, 106], [0.5, 118], [0.8, 136], [0.9, 160], [1, 214]],
    el: [[0, 58], [0.5, 48], [0.78, 26], [0.9, 9], [1, -3]]
  };

  function env(p) {
    const eD = easeInOut(seg(p, 0.8, 0.99));
    const azd = keys(p, SUN.az), eld = keys(p, SUN.el);
    const az = rad(azd), el = rad(eld);
    const L = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
    const sunI = clamp((eld + 1) / 9) * 0.82;
    const sunCol = keysC(p, [[0, [1, 0.97, 0.92]], [0.7, [1, 0.94, 0.84]], [0.86, [1, 0.8, 0.56]], [0.95, [1, 0.62, 0.38]]]);
    const skyA = keysC(p, [[0, [0.5, 0.55, 0.62]], [0.8, [0.5, 0.52, 0.58]], [0.92, [0.42, 0.4, 0.48]], [1, [0.26, 0.27, 0.4]]]);
    const gndA = keysC(p, [[0, [0.3, 0.28, 0.25]], [0.8, [0.3, 0.27, 0.23]], [1, [0.16, 0.13, 0.14]]]);
    const zen = keysC(p, [[0, [0.34, 0.54, 0.78]], [0.78, [0.36, 0.52, 0.74]], [0.9, [0.3, 0.38, 0.6]], [1, [0.11, 0.14, 0.3]]]);
    const mid = keysC(p, [[0, [0.6, 0.74, 0.88]], [0.78, [0.64, 0.73, 0.84]], [0.9, [0.74, 0.64, 0.68]], [1, [0.4, 0.32, 0.47]]]);
    const hor = keysC(p, [[0, [0.86, 0.9, 0.92]], [0.78, [0.93, 0.89, 0.82]], [0.9, [1, 0.78, 0.6]], [1, [0.96, 0.6, 0.42]]]);
    const fogC = mixC(hor, mid, 0.3);
    const lights = easeOut(seg(p, 0.875, 0.95));
    return { eD, L, sunI, sunCol, skyA, gndA, zen, mid, hor, fogC, lights, azd, eld };
  }

  function makeCam(p, W, H) {
    const narrow = W / H < 1.75;
    const yaw = rad(keys(p, CAM.yaw)), pit = rad(keys(p, CAM.pitch)), dist = keys(p, CAM.dist);
    const T = [keys(p, CAM.tx), keys(p, CAM.ty), keys(p, CAM.tz)];
    const cp = Math.cos(pit), sp = Math.sin(pit);
    const C = [T[0] + dist * cp * Math.cos(yaw), T[1] + dist * cp * Math.sin(yaw), T[2] + dist * sp];
    const f = [-cp * Math.cos(yaw), -cp * Math.sin(yaw), -sp];
    // Derecha de la cámara: +x del mundo queda a la derecha de la pantalla.
    const r = nrm([-f[1], f[0], 0]);
    const u = nrm([-f[2] * f[0], -f[2] * f[1], 1 - f[2] * f[2]]);
    const F = W / 2 / Math.tan(rad(keys(p, CAM.fov)) / 2);
    const cx = W / 2, cy = H * keys(p, narrow ? CAM.oyM : CAM.oy);
    const proj = (x, y, z) => {
      const dx = x - C[0], dy = y - C[1], dz = z - C[2];
      const zc = dx * f[0] + dy * f[1] + dz * f[2];
      const k = F / Math.max(0.05, zc);
      return [cx + (dx * r[0] + dy * r[1]) * k, cy - (dx * u[0] + dy * u[1] + dz * u[2]) * k, zc];
    };
    const dir = d => { const zc = dot(d, f); if (zc <= 0.01) return null; return [cx + (dot(d, r) * F) / zc, cy - (dot(d, u) * F) / zc]; };
    const fh = nrm([f[0], f[1], 0]);
    const horizon = cy - (F * dot(fh, u)) / dot(fh, f);
    return { C, f, r, u, F, cx, cy, proj, dir, horizon, W, H };
  }

  // ---------- Geometría de la casa (metros; la fachada principal mira a +y) ----------
  const LOT = [-17, 21, -12, 13];
  const SLAB = [-10, 5.2, -5.3, 3.9, 0, 0.45];
  const GFA = [-9.5, -5, -4.5, 3.0, 0.45, 3.6];
  const GFB = [-5, 4.5, -4.5, 3.0, 0.45, 3.6];
  const UFS = [-6, 11.5, -5.2, 3.8, 3.6, 3.95];
  const UFW = [-5.8, 11.3, -5.0, 3.6, 3.95, 6.75];
  const ROOF = [-6.2, 11.7, -5.4, 4.0, 6.75, 7.1];
  const POOL = [6.5, 16.5, 4.6, 8.2];
  const COLS_G = [[-9.3, 3.25], [-4.9, 3.25], [-0.4, 3.25], [4.25, 3.25], [-9.3, -4.75], [-4.9, -4.75], [-0.4, -4.75], [4.25, -4.75]];
  const COLS_U = [[-5.55, 3.35], [-0.6, 3.35], [4.3, 3.35], [11.05, 3.35], [-5.55, -4.75], [-0.6, -4.75], [4.3, -4.75], [11.05, -4.75]];
  const CRANE = [-3, -11.6];

  const STYLE = `
.sc-aura-root{position:absolute;inset:0;overflow:hidden;background:#1d2a24;pointer-events:none;user-select:none;-webkit-user-select:none;font-style:normal}
.sc-aura-root *{font-style:normal}
.sc-aura-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.sc-aura-water{position:absolute;inset:0;opacity:0;mix-blend-mode:screen;overflow:hidden}
.sc-aura-caus{position:absolute;left:-50%;top:-50%;width:200%;height:200%;background-size:96px 40px;will-change:transform}
.sc-aura-caus.sc-aura-c1{animation:sc-aura-drift1 9s linear infinite}
.sc-aura-caus.sc-aura-c2{background-size:70px 30px;opacity:.6;animation:sc-aura-drift2 7s linear infinite}
@keyframes sc-aura-drift1{from{transform:translate(0,0)}to{transform:translate(96px,40px)}}
@keyframes sc-aura-drift2{from{transform:translate(0,0)}to{transform:translate(-70px,30px)}}
.sc-aura-grain{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-size:128px 128px}
.sc-aura-vig{position:absolute;inset:0;background:radial-gradient(125% 100% at 50% 42%,rgba(0,0,0,0) 58%,rgba(6,9,12,.34) 100%)}
body.motion-paused .sc-aura-caus{animation:none}
@media (prefers-reduced-motion:reduce){.sc-aura-caus{animation:none}}
`;

  function mount(stage) {
    if (!document.getElementById('sc-aura-style')) {
      const st = document.createElement('style');
      st.id = 'sc-aura-style';
      st.textContent = STYLE;
      document.head.appendChild(st);
    }
    const root = document.createElement('div');
    root.className = 'sc-aura-root';
    root.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'sc-aura-cv';
    const water = document.createElement('div');
    water.className = 'sc-aura-water';
    const c1 = document.createElement('div'), c2 = document.createElement('div');
    c1.className = 'sc-aura-caus sc-aura-c1'; c2.className = 'sc-aura-caus sc-aura-c2';
    water.append(c1, c2);
    const grain = document.createElement('div');
    grain.className = 'sc-aura-grain';
    const vig = document.createElement('div');
    vig.className = 'sc-aura-vig';
    root.append(canvas, water, vig, grain);
    stage.appendChild(root);

    const TEX = buildTextures();
    const caus = TEX.caus.toDataURL();
    c1.style.backgroundImage = `url(${caus})`; c2.style.backgroundImage = `url(${caus})`;
    grain.style.backgroundImage = `url(${TEX.grain.toDataURL()})`;

    const ctx = canvas.getContext('2d');
    const PAT = {};
    for (const k of ['conc', 'plaster', 'block', 'stone', 'deck', 'slats', 'door', 'soil', 'grass', 'tile', 'ply', 'gravel', 'field']) PAT[k] = { p: ctx.createPattern(TEX[k], 'repeat'), w: TEX[k].width, h: TEX[k].height };
    const hasMatrix = typeof DOMMatrix === 'function' && PAT.conc.p && typeof PAT.conc.p.setTransform === 'function';

    const NIGHT = [0.1, 0.12, 0.26];
    const withDusk = (s, amt = 0.62) => { s.dusk = duskOf(s.day, NIGHT, amt); s.haze = duskOf(s.day, [0.74, 0.8, 0.84], 1); return s; };
    const SPR = {
      treeA: withDusk(treeSprite(31, [[0.12, 0.2, 0.11], [0.27, 0.42, 0.2], [0.62, 0.72, 0.34]])),
      treeB: withDusk(treeSprite(37, [[0.1, 0.18, 0.12], [0.22, 0.36, 0.2], [0.5, 0.64, 0.3]])),
      gold: withDusk(treeSprite(41, [[0.16, 0.2, 0.08], [0.36, 0.42, 0.16], [0.62, 0.66, 0.3], [[0.62, 0.42, 0.06], [1, 0.84, 0.24]]])),
      palm: withDusk(palmSprite(43)),
      palm2: withDusk(palmSprite(47)),
      shrub: withDusk(shrubSprite(53)),
      shrubF: withDusk(shrubSprite(59, [[0.86, 0.18, 0.42], [1, 0.45, 0.62]])),
      shrubO: withDusk(shrubSprite(61, [[0.95, 0.45, 0.12], [1, 0.72, 0.3]]))
    };
    const CLOUDS = [cloudSprite(71), cloudSprite(73), cloudSprite(79)];
    const RIDGE_FAR = ridgeSprite(83, 1024, 160, 0.32, 0.5, [[0.55, 0.64, 0.74], [0.68, 0.76, 0.84]], [0.82, 0.86, 0.9], 0.12);
    const RIDGE_MID = ridgeSprite(89, 1024, 120, 0.3, 0.42, [[0.29, 0.4, 0.38], [0.42, 0.52, 0.46]], [0.6, 0.68, 0.7], 0.2);
    const RIDGE_FAR_D = duskOf(RIDGE_FAR, [0.36, 0.3, 0.46], 0.7);
    const RIDGE_MID_D = duskOf(RIDGE_MID, [0.14, 0.13, 0.24], 0.75);
    const TREELINE = treelineSprite(97);
    const TREELINE_D = duskOf(TREELINE, NIGHT, 0.6);
    const FROND = frondSprite(101);

    // Borde irregular del lote: tierra removida con orilla natural.
    const LOTPOLY = [];
    {
      const rl = rng(7), [a0, a1, b0, b1] = LOT;
      const sides = [[[a0, b0], [a1, b0]], [[a1, b0], [a1, b1]], [[a1, b1], [a0, b1]], [[a0, b1], [a0, b0]]];
      for (const [A, Bp] of sides) {
        const n = 22;
        for (let i = 0; i < n; i++) {
          const t = i / n, x = lerp(A[0], Bp[0], t), y = lerp(A[1], Bp[1], t);
          const nx = -(Bp[1] - A[1]), ny = Bp[0] - A[0], l = Math.hypot(nx, ny);
          const o = (Math.sin(t * 9 + A[0]) * 0.7 + (rl() - 0.5) * 1.4) * (i === 0 ? 0.3 : 1);
          LOTPOLY.push([x - (nx / l) * o, y - (ny / l) * o]);
        }
      }
    }
    // Vegetación que ya existe alrededor del terreno (no crece: da contexto y escala).
    const ENV = [];
    {
      const re = rng(5), kinds = ['treeA', 'treeB', 'palm', 'treeA', 'treeB', 'palm2', 'gold'];
      const add = (x, y, h, k) => ENV.push({ x, y, h, k });
      for (let i = 0; i < 9; i++) { const x = -60 + i * 13 + (re() - 0.5) * 5; if (x > -18 && x < 22) continue; add(x, -22 - re() * 8, 8 + re() * 5, kinds[i % kinds.length]); }
      for (let i = 0; i < 11; i++) add(-80 + i * 16 + (re() - 0.5) * 6, -48 - re() * 16, 9 + re() * 5, kinds[(i + 3) % kinds.length]);
      for (const [x, y] of [[-25, -8], [-28, 1], [-24, 8], [-33, 13], [29, -12], [33, -4]]) add(x + (re() - 0.5) * 2, y, 8 + re() * 4, kinds[Math.floor(re() * 6)]);
    }
    const FONT = (getComputedStyle(stage).getPropertyValue('--cfont') || '').trim() || getComputedStyle(stage).fontFamily || 'system-ui, sans-serif';
    const shadowCv = cv(8, 8), sctx = shadowCv.getContext('2d');
    const aoCv = cv(8, 8), actx = aoCv.getContext('2d');
    const blurCv = cv(8, 8), bctx = blurCv.getContext('2d');
    const canBlur = 'filter' in bctx;
    const SS = 4; // la sombra se calcula a 1/4 de resolución: así sale suave y barata

    let W = 0, H = 0, dpr = 1, last = 0;
    function resize() {
      const rect = stage.getBoundingClientRect();
      const cw = Math.round(rect.width), ch = Math.round(rect.height);
      if (!cw || !ch) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cw * ch * dpr * dpr > 2.6e6) dpr = Math.sqrt(2.6e6 / (cw * ch));
      const w = Math.round(cw * dpr), h = Math.round(ch * dpr);
      if (w !== W || h !== H) {
        W = canvas.width = w; H = canvas.height = h;
        for (const c of [shadowCv, aoCv, blurCv]) { c.width = Math.ceil(W / SS); c.height = Math.ceil(H / SS); }
      }
      return true;
    }
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (resize()) render(last); }).observe(stage);

    // ---------- Pintura de caras ----------
    let R = null; // estado del fotograma actual
    const path = P => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); };
    const tone = v => (v < 0.86 ? v : 0.86 + 0.14 * (1 - Math.exp(-(v - 0.86) / 0.14)));
    function lit(c, n, zc, k = 1) {
      const E = R.E;
      const ndl = Math.max(0, dot(n, E.L)) * E.sunI;
      const h = 0.5 + 0.5 * n[2];
      const out = [0, 0, 0];
      for (let i = 0; i < 3; i++) out[i] = tone(c[i] * k * (E.sunCol[i] * ndl * 1.05 + E.skyA[i] * h + E.gndA[i] * (1 - h)));
      const fg = clamp((zc - 34) / 260) * 0.5 + E.eD * 0.06;
      return css(mixC(out, E.fogC, fg));
    }
    const bil = (c, u, v) => {
      const a = [lerp(c[0][0], c[1][0], u), lerp(c[0][1], c[1][1], u), lerp(c[0][2], c[1][2], u)];
      const b = [lerp(c[3][0], c[2][0], u), lerp(c[3][1], c[2][1], u), lerp(c[3][2], c[2][2], u)];
      return [lerp(a[0], b[0], v), lerp(a[1], b[1], v), lerp(a[2], b[2], v)];
    };
    const sub = (c, u0, u1, v0, v1) => [bil(c, u0, v0), bil(c, u1, v0), bil(c, u1, v1), bil(c, u0, v1)];
    const PJ = c => c.map(q => R.cam.proj(q[0], q[1], q[2]));
    const texUV = (key, q, mat) => {
      const ts = mat.ts;
      if (key === 'top') return [(q[0] / ts[0]), (q[1] / ts[1])];
      if (key === 'px') return [(-q[1] / ts[0]), (-q[2] / ts[1])];
      if (key === 'nx') return [(q[1] / ts[0]), (-q[2] / ts[1])];
      if (key === 'ny') return [(-q[0] / ts[0]), (-q[2] / ts[1])];
      return [(q[0] / ts[0]), (-q[2] / ts[1])];
    };
    // Textura con perspectiva aproximada: la cara se parte en celdas y cada celda usa su propia afín.
    function texture(c, key, mat, alpha, lu, lv) {
      if (!hasMatrix) return;
      const pt = PAT[mat.tex];
      const nu = clamp(Math.ceil(lu / 3.2), 1, 8), nv = key === 'top' ? clamp(Math.ceil(lv / 3.2), 1, 6) : 1;
      ctx.globalCompositeOperation = 'multiply';
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * alpha;
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const q = sub(c, i / nu, (i + 1) / nu, j / nv, (j + 1) / nv);
        const P = PJ(q);
        const t0 = texUV(key, q[3], mat), t1 = texUV(key, q[2], mat), t2 = texUV(key, q[0], mat);
        const m = affine3([t0[0] * pt.w, t0[1] * pt.h], [t1[0] * pt.w, t1[1] * pt.h], [t2[0] * pt.w, t2[1] * pt.h], P[3], P[2], P[0]);
        pt.p.setTransform(new DOMMatrix(m));
        ctx.fillStyle = pt.p;
        path(P); ctx.fill();
      }
      ctx.globalAlpha = ga;
      ctx.globalCompositeOperation = 'source-over';
    }
    const area = P => Math.abs((P[2][0] - P[0][0]) * (P[3][1] - P[1][1]) - (P[3][0] - P[1][0]) * (P[2][1] - P[0][1])) / 2;
    function surface(c, P, n, mat, key, lu, lv, zc, o) {
      if (mat.kind === 'glass') return glass(c, P, lu, lv, o);
      if (mat.kind === 'void') return voidFace(c, P);
      if (mat.kind === 'rail') return rail(P);
      const col = lit(mat.c, n, zc, o && o.k);
      path(P); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = R.seam; ctx.stroke();
      if (mat.tex && area(P) > 60 * R.dd) texture(c, key, mat, mat.ta, lu, lv);
    }
    const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    function glass(c, P, lu, lv, o) {
      const E = R.E;
      const t = mid2(P[3], P[2]), b = mid2(P[0], P[1]);
      const g = ctx.createLinearGradient(t[0], t[1], b[0], b[1]);
      g.addColorStop(0, css(mixC(mixC(E.mid, E.hor, 0.45), [0.1, 0.12, 0.14], 0.28)));
      g.addColorStop(0.42, css(mixC(E.mid, [0.12, 0.15, 0.17], 0.66)));
      g.addColorStop(1, css([0.08, 0.1, 0.11]));
      path(P); ctx.fillStyle = g; ctx.fill();
      // reflejo diagonal del cielo
      const s = (o && o.sheen) ?? 0.3;
      const sh = PJ([bil(c, s - 0.12, 0), bil(c, s + 0.02, 0), bil(c, s + 0.3, 1), bil(c, s + 0.14, 1)]);
      ctx.save(); path(P); ctx.clip();
      path(sh); ctx.fillStyle = `rgba(255,255,255,${(0.13 * (1 - E.eD * 0.7)).toFixed(3)})`; ctx.fill();
      // luz interior cálida
      if (E.lights > 0.001 && !(o && o.dark)) {
        const gl = ctx.createLinearGradient(t[0], t[1], b[0], b[1]);
        gl.addColorStop(0, 'rgba(255,214,150,.95)'); gl.addColorStop(0.55, 'rgba(255,186,108,.9)'); gl.addColorStop(1, 'rgba(176,96,44,.95)');
        ctx.globalAlpha = E.lights * 0.92;
        path(P); ctx.fillStyle = gl; ctx.fill();
        // muebles en contraluz
        const furn = [[0.12, 0.34, 0.16], [0.52, 0.66, 0.24], [0.78, 0.9, 0.12]];
        ctx.fillStyle = 'rgba(70,40,24,.55)';
        for (const [u0, u1, h] of furn) { path(PJ(sub(c, u0, u1, 0, h * (3 / Math.max(1.5, lv))))); ctx.fill(); }
        ctx.globalAlpha = 1;
        const cc = mid2(t, b);
        R.glows.push([cc[0], cc[1], Math.max(Math.abs(P[1][0] - P[0][0]), Math.abs(P[3][1] - P[0][1])) * 0.9, E.lights]);
      }
      ctx.restore();
      // perfilería
      const z = (P[0][2] + P[2][2]) / 2;
      const lw = Math.max(1, (0.07 * R.cam.F) / z);
      const n = Math.max(1, Math.round(lu / ((o && o.mull) || 1.6)));
      ctx.strokeStyle = css(mixC([0.13, 0.13, 0.13], R.E.fogC, clamp((z - 34) / 260) * 0.4));
      ctx.lineWidth = lw;
      ctx.beginPath();
      for (let i = 1; i < n; i++) { const a = R.cam.proj(...bil(c, i / n, 0)), d = R.cam.proj(...bil(c, i / n, 1)); ctx.moveTo(a[0], a[1]); ctx.lineTo(d[0], d[1]); }
      ctx.stroke();
      ctx.lineWidth = lw * 1.6;
      path(P); ctx.stroke();
    }
    function voidFace(c, P) {
      const t = mid2(P[3], P[2]), b = mid2(P[0], P[1]);
      const g = ctx.createLinearGradient(t[0], t[1], b[0], b[1]);
      g.addColorStop(0, css(mixC([0.1, 0.1, 0.1], R.E.fogC, 0.05)));
      g.addColorStop(1, css(mixC([0.27, 0.26, 0.24], R.E.fogC, 0.05)));
      path(P); ctx.fillStyle = g; ctx.fill();
    }
    function rail(P) {
      path(P);
      ctx.fillStyle = css(mixC(R.E.mid, [0.7, 0.8, 0.82], 0.5), 0.22); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = R.dd; ctx.stroke();
    }
    function aoGrad(P, amt, top) {
      // oclusión ambiental: oscurece el pie (o la cabeza) de una cara vertical
      const a = top ? mid2(P[3], P[2]) : mid2(P[0], P[1]);
      const b0 = top ? mid2(P[0], P[1]) : mid2(P[3], P[2]);
      const k = top ? top : 0.38;
      const b = [lerp(a[0], b0[0], k), lerp(a[1], b0[1], k)];
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, `rgba(12,14,18,${amt.toFixed(3)})`); g.addColorStop(1, 'rgba(12,14,18,0)');
      path(P); ctx.fillStyle = g; ctx.fill();
    }
    function face(it, key, c, lu, lv) {
      const P = PJ(c);
      const n = NRM[key], zc = (P[0][2] + P[2][2]) / 2;
      const m = it.m.c || it.m.kind ? it.m : it.m[key] || (key === 'top' ? it.m.top : it.m.side) || it.m.side;
      surface(c, P, n, m, key, lu, lv, zc, it.o && it.o[key]);
      if (it.mix && it.mix.t > 0.001) {
        const mm = it.mix.m.c || it.mix.m.kind ? it.mix.m : it.mix.m[key] || it.mix.m.side;
        if (mm) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * it.mix.t; surface(c, P, n, mm, key, lu, lv, zc); ctx.globalAlpha = ga; }
      }
      const regs = it.reg && it.reg[key];
      if (regs) for (const r of regs) region(c, key, n, lu, lv, zc, r);
      if (key !== 'top') {
        if (it.ao !== false && (it.b[4] < 0.5 || it.ao)) aoGrad(P, it.aoA || 0.42);
        if (it.ts) aoGrad(P, it.ts, 0.3);
      }
      return P;
    }
    function region(c, key, n, lu, lv, zc, r) {
      const rv = r.rev === undefined ? 1 : r.rev;
      if (rv <= 0.001 && !r.under) return;
      const q = sub(c, r.u[0], r.u[1], r.v[0], r.v[1]);
      const ru = (r.u[1] - r.u[0]) * lu, rvv = (r.v[1] - r.v[0]) * lv;
      if (r.under && rv < 1) {
        const qu = r.dir === 'v' ? sub(c, r.u[0], r.u[1], lerp(r.v[0], r.v[1], rv), r.v[1]) : sub(c, lerp(r.u[0], r.u[1], rv), r.u[1], r.v[0], r.v[1]);
        surface(qu, PJ(qu), n, r.under, key, ru, rvv, zc);
      }
      if (rv <= 0.001) return;
      const qq = r.dir === 'v' ? sub(c, r.u[0], r.u[1], r.v[0], lerp(r.v[0], r.v[1], rv)) : sub(c, r.u[0], lerp(r.u[0], r.u[1], rv), r.v[0], r.v[1]);
      const P = PJ(qq);
      const ga = ctx.globalAlpha;
      if (r.a !== undefined) ctx.globalAlpha = ga * r.a;
      surface(qq, P, n, r.m, key, ru * (r.dir === 'v' ? 1 : rv), rvv * (r.dir === 'v' ? rv : 1), zc, r.o);
      // marco hundido: sombra interior arriba
      if (r.m.kind === 'glass' || r.m.kind === 'void') aoGrad(PJ(q), 0.35, 0.12);
      ctx.globalAlpha = ga;
    }
    function drawBox(it) {
      const [x0, x1, y0, y1, z0, z1] = it.b, C = R.cam.C;
      if (x1 - x0 < 0.001 || y1 - y0 < 0.001 || z1 - z0 < 0.001) return;
      const ga = ctx.globalAlpha;
      if (it.a !== undefined) ctx.globalAlpha = ga * it.a;
      let Pt = null, Py = null, Px = null;
      if (C[1] > y1) Py = face(it, 'py', [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], x1 - x0, z1 - z0);
      else if (C[1] < y0) face(it, 'ny', [[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]], x1 - x0, z1 - z0);
      if (C[0] > x1) Px = face(it, 'px', [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], y1 - y0, z1 - z0);
      else if (C[0] < x0) face(it, 'nx', [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], y1 - y0, z1 - z0);
      if (C[2] > z1) Pt = face(it, 'top', [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], x1 - x0, y1 - y0);
      // arista iluminada (bisel) entre la tapa y las caras visibles
      if (Pt && it.edge !== false) {
        ctx.strokeStyle = `rgba(255,250,240,${(0.3 * (1 - R.E.eD * 0.6)).toFixed(3)})`;
        ctx.lineWidth = R.dd;
        ctx.beginPath();
        if (Py) { ctx.moveTo(Pt[0][0], Pt[0][1]); ctx.lineTo(Pt[1][0], Pt[1][1]); }
        if (Px) { ctx.moveTo(Pt[1][0], Pt[1][1]); ctx.lineTo(Pt[2][0], Pt[2][1]); }
        ctx.stroke();
      }
      ctx.globalAlpha = ga;
    }

    // ---------- Orden de pintura (algoritmo del pintor con separación por ejes) ----------
    function sortItems(items) {
      const C = R.cam.C, n = items.length;
      for (const it of items) {
        const b = it.b;
        let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
        for (let i = 0; i < 8; i++) {
          const q = R.cam.proj(b[i & 1], b[2 + ((i >> 1) & 1)], b[4 + (i >> 2)]);
          if (q[0] < mnx) mnx = q[0]; if (q[0] > mxx) mxx = q[0]; if (q[1] < mny) mny = q[1]; if (q[1] > mxy) mxy = q[1];
        }
        it.sb = [mnx - 2, mxx + 2, mny - 2, mxy + 2];
        const cx = (b[0] + b[1]) / 2, cy = (b[2] + b[3]) / 2, cz = (b[4] + b[5]) / 2;
        it.dist = Math.hypot(cx - C[0], cy - C[1], cz - C[2]);
      }
      const adj = items.map(() => []), deg = new Int32Array(n);
      const behind = (A, B) => {
        // -1: A va detrás (se pinta primero); 1: B va detrás; 0: sin veredicto
        for (let k = 0; k < 3; k++) {
          const lo = k * 2, hi = lo + 1;
          if (A[hi] <= B[lo] + 1e-4) { if (C[k] >= B[lo]) return -1; if (C[k] <= A[hi]) return 1; }
          else if (B[hi] <= A[lo] + 1e-4) { if (C[k] >= A[lo]) return 1; if (C[k] <= B[hi]) return -1; }
        }
        return 0;
      };
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const a = items[i].sb, b = items[j].sb;
        if (a[1] < b[0] || b[1] < a[0] || a[3] < b[2] || b[3] < a[2]) continue;
        let r = behind(items[i].b, items[j].b);
        if (!r) r = items[i].dist > items[j].dist ? -1 : 1;
        if (r < 0) { adj[i].push(j); deg[j]++; } else { adj[j].push(i); deg[i]++; }
      }
      const out = [], done = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        let pick = -1, best = -1, pickC = -1, bestC = -1;
        for (let i = 0; i < n; i++) {
          if (done[i]) continue;
          if (deg[i] === 0 && items[i].dist > best) { best = items[i].dist; pick = i; }
          if (items[i].dist > bestC) { bestC = items[i].dist; pickC = i; }
        }
        if (pick < 0) pick = pickC; // ciclo: se rompe por distancia
        done[pick] = 1;
        out.push(items[pick]);
        for (const j of adj[pick]) deg[j]--;
      }
      return out;
    }

    // ---------- Sombras proyectadas y oclusión en el suelo ----------
    function shadowPoly(pts3, g) {
      const L = R.E.L, lz = Math.max(0.3, L[2]);
      const flat = pts3.map(q => [q[0] - (q[2] * L[0]) / lz, q[1] - (q[2] * L[1]) / lz]);
      const h = hull(flat);
      if (h.length < 3) return;
      g.beginPath();
      h.forEach((q, i) => { const s = R.cam.proj(q[0], q[1], 0); if (i) g.lineTo(s[0] / SS, s[1] / SS); else g.moveTo(s[0] / SS, s[1] / SS); });
      g.closePath(); g.fill();
    }
    function boxCorners(b) {
      const o = [];
      for (let i = 0; i < 8; i++) o.push([b[i & 1], b[2 + ((i >> 1) & 1)], b[4 + (i >> 2)]]);
      return o;
    }
    function groundPoly(pts, g, z = 0) {
      g.beginPath();
      pts.forEach((q, i) => { const s = R.cam.proj(q[0], q[1], z); if (i) g.lineTo(s[0] / SS, s[1] / SS); else g.moveTo(s[0] / SS, s[1] / SS); });
      g.closePath(); g.fill();
    }
    function blurInto(src, g, px) {
      if (canBlur) {
        bctx.setTransform(1, 0, 0, 1, 0, 0);
        bctx.clearRect(0, 0, blurCv.width, blurCv.height);
        bctx.filter = `blur(${px}px)`;
        bctx.drawImage(src, 0, 0);
        bctx.filter = 'none';
        return blurCv;
      }
      return src;
    }

    // ---------- Escena para un progreso p ----------
    function build(p) {
      const flat = [], raised = [], top = [];
      const B = (list, b, m, o) => { const it = Object.assign({ b, m, draw: drawBox }, o); list.push(it); return it; };
      const E = R.E;

      // Caseta de obra y materiales (se van al terminar la obra)
      const site = 1 - seg(p, 0.76, 0.8);
      const siteIn = easeOut(seg(p, 0.01, 0.06));
      if (site > 0 && siteIn > 0) {
        const a = site * siteIn;
        B(raised, [13.6, 19, -11.2, -8.8, 0, 2.7], { side: M.trailer, top: { c: [0.82, 0.82, 0.8] } }, { a, reg: { py: [{ u: [0.1, 0.32], v: [0.35, 0.8], m: M.glass, o: { dark: true } }, { u: [0.6, 0.76], v: [0, 0.78], m: { c: [0.24, 0.36, 0.55] } }] } });
        const blk = 1 - seg(p, 0.5, 0.58);
        if (blk > 0) {
          B(raised, [-16.6, -15.2, -2.8, -1.6, 0, 1.1 * blk], M.pallet, { a });
          B(raised, [-16.6, -15.2, -1.2, 0, 0, 0.9 * blk], M.pallet, { a });
        }
        const lum = 1 - seg(p, 0.64, 0.7);
        if (lum > 0) B(raised, [-16.6, -13.4, 1.4, 2.4, 0, 0.6 * lum], M.lumber, { a });
      }

      // Montículo de tierra de la excavación
      const mound = easeOut(seg(p, 0.15, 0.2)) * (1 - easeInOut(seg(p, 0.42, 0.5)));
      if (mound > 0.01) raised.push({ b: [-16, -12, -11, -7, 0, 1.8 * mound], draw: () => drawMound(-14, -9, 2.2, 1.8 * mound), shadow: false });

      // Losa de cimentación
      const eSlab = easeOut(seg(p, 0.265, 0.29));
      if (eSlab > 0) B(flat, [SLAB[0], SLAB[1], SLAB[2], SLAB[3], 0, 0.45 * eSlab], { top: M.slab, side: M.conc }, { aoA: 0.3 });

      // Columnas: varillas → formaleta → concreto
      const slabUp = easeOut(seg(p, 0.37, 0.4));
      const wallG = easeOut(seg(p, 0.46, 0.52));
      COLS_G.forEach(([x, y], i) => column(raised, x, y, 0.32, 0.45, 3.6, 0.3 + i * 0.006, slabUp));
      // Puntales bajo la losa del segundo nivel
      const props = seg(p, 0.355, 0.37) * (1 - seg(p, 0.455, 0.47));
      if (props > 0) {
        raised.push({ b: [-9.2, 4.2, -4.3, 2.8, 0.45, 3.6], draw: () => drawProps(-9.2, 4.2, -4.3, 2.8, 0.45, 3.6, props), shadow: false });
        raised.push({ b: [5.4, 10.6, -4.6, 3.2, 0, 3.6], draw: () => drawProps(5.4, 10.6, -4.6, 3.2, 0, 3.6, props), shadow: false });
      }
      // Losa del segundo nivel: se funde de izquierda a derecha y cura de oscuro a claro
      if (slabUp > 0) {
        const x1 = lerp(UFS[0] + 0.5, UFS[1], slabUp);
        const cure = seg(p, 0.4, 0.47);
        B(raised, [UFS[0], x1, UFS[2], UFS[3], UFS[4], UFS[5]], { top: M.concFresh, side: M.concFresh }, { mix: { m: { top: M.slab, side: M.conc }, t: cure }, ao: false });
      }
      // Columnas metálicas del voladizo
      const pil = easeOut(seg(p, 0.38, 0.42));
      if (pil > 0) for (const y of [-4.7, 3.3]) B(raised, [10.95, 11.12, y - 0.08, y + 0.08, 0.3, lerp(0.3, 3.6, pil)], M.steel, { edge: false, aoA: 0.2 });
      const deckE = easeInOut(seg(p, 0.66, 0.74));
      const deckX1 = lerp(5.2, 17.5, deckE);
      if (pil > 0 && deckX1 < 11.4) for (const y of [-4.7, 3.3]) B(raised, [10.75, 11.32, y - 0.28, y + 0.28, 0, 0.3], M.conc, {});
      // Columnas del segundo nivel (quedan dentro de los muros cuando estos suben)
      const wallU = easeOut(seg(p, 0.5, 0.56));
      const roofE = easeOut(seg(p, 0.54, 0.58));
      const uTop = lerp(UFW[4], UFW[5], wallU);
      COLS_U.forEach(([x, y], i) => column(raised, x, y, 0.28, 3.95, 6.75, 0.405 + i * 0.005, roofE, wallU > 0 ? uTop : 0));

      // Muros del primer nivel: bloque → acabado
      const finish = easeInOut(seg(p, 0.58, 0.63));
      if (wallG > 0) {
        const z1 = lerp(0.45, 3.6, wallG);
        B(raised, [GFA[0], GFA[1], GFA[2], GFA[3], 0.45, z1], M.block, {
          mix: { m: M.conc, t: finish }, ts: slabUp > 0 ? 0.3 : 0,
          reg: {
            py: [
              { u: [0.1, 0.26], v: [0.08, 0.92], m: M.glass, rev: easeOut(seg(p, 0.62, 0.66)), under: finish > 0.5 ? M.void : null, o: { mull: 9, sheen: 0.4 } },
              { u: [0.56, 0.8], v: [0, 0.82], m: M.door, rev: easeOut(seg(p, 0.68, 0.71)), dir: 'v', under: finish > 0.5 ? M.void : null }
            ].filter(() => wallG >= 1)
          }
        });
        // Volumen acristalado: estructura abierta y luego ventanales que se deslizan
        const gb = seg(p, 0.46, 0.5);
        const panes = [0, 1, 2, 3].map(k => ({ u: [k / 4, (k + 1) / 4], v: [0, 1], m: M.glass, rev: easeOut(seg(p, 0.62 + k * 0.012, 0.655 + k * 0.012)), under: M.void, o: { mull: 1.2, sheen: 0.25 + k * 0.07 } }));
        const side = [0, 1].map(k => ({ u: [k / 2, (k + 1) / 2], v: [0, 1], m: M.glass, rev: easeOut(seg(p, 0.64 + k * 0.012, 0.675 + k * 0.012)), under: M.void, o: { mull: 1.25, sheen: 0.5 } }));
        B(raised, [GFB[0], GFB[1], GFB[2], GFB[3], GFB[4], GFB[5]], { side: M.void, top: M.slab }, { a: gb, reg: { py: panes, px: side }, ts: 0.42, ao: true, aoA: 0.3 });
      }
      // Muros del segundo nivel, ventanales y celosía de madera
      if (wallU > 0) {
        const uf = [
          { u: [0.03, 0.5], v: [0.04, 0.97], m: M.slats, rev: easeOut(seg(p, 0.645, 0.7)), dir: 'v', under: finish > 0.5 ? M.void : null },
          { u: [0.54, 0.97], v: [0.12, 0.9], m: M.glass, rev: easeOut(seg(p, 0.63, 0.675)), under: finish > 0.5 ? M.void : null, o: { mull: 1.9, sheen: 0.35 } }
        ];
        const ux = [{ u: [0.07, 0.93], v: [0.1, 0.9], m: M.glass, rev: easeOut(seg(p, 0.65, 0.69)), under: finish > 0.5 ? M.void : null, o: { mull: 1.45, sheen: 0.45 } }];
        B(raised, [UFW[0], UFW[1], UFW[2], UFW[3], UFW[4], uTop], M.block, {
          mix: { m: M.white, t: finish }, ts: roofE > 0 ? 0.36 : 0, ao: true, aoA: 0.25,
          reg: wallU >= 1 ? { py: uf, px: ux } : null
        });
      }
      // Cubierta: se funde y luego recibe la cubierta verde
      if (roofE > 0) {
        const x1 = lerp(ROOF[0] + 0.5, ROOF[1], roofE);
        B(raised, [ROOF[0], x1, ROOF[2], ROOF[3], ROOF[4], ROOF[5]], { top: M.gravel, side: M.white }, { mix: { m: { top: M.gravel, side: M.white }, t: 0 }, ao: false });
        const gr = easeOut(seg(p, 0.86, 0.9));
        if (gr > 0) B(raised, [-4.5, lerp(-4.4, 6.5, gr), -4.4, 3.0, 7.1, 7.22], { top: M.green, side: { c: [0.3, 0.28, 0.24] } }, { ao: false, edge: false });
      }

      // Muro de piedra (sube por hiladas) y escalera flotante
      const wallS = easeOut(seg(p, 0.48, 0.57));
      if (wallS > 0) B(raised, [-12.4, -11.8, -6.5, 5.5, 0, 4.4 * wallS], M.stone, { aoA: 0.45 });
      for (let k = 0; k < 20; k++) {
        const e = easeOut(seg(p, 0.62 + k * 0.0028, 0.645 + k * 0.0028));
        if (e <= 0) continue;
        const z = 0.18 * (k + 1), y1 = 3.4 - 0.3 * k;
        B(raised, [-11.8, lerp(-11.75, -10.6, e), y1 - 0.3, y1, z - 0.07, z], { top: M.deck, side: { c: [0.5, 0.33, 0.21] } }, { ao: false, edge: true });
      }
      const land = easeOut(seg(p, 0.675, 0.69));
      if (land > 0) B(raised, [-11.8, lerp(-11.7, -9.5, land), -4.0, -2.6, 3.45, 3.6], { top: M.deck, side: M.conc }, { ao: false });
      // Terraza sobre el primer nivel
      const terr = easeOut(seg(p, 0.69, 0.72));
      if (terr > 0 && wallG >= 1) {
        B(raised, [-9.5, -6.05, -4.5, 3.0, 3.6, 3.6 + 0.08 * terr], { top: M.deck, side: M.deck }, { ao: false, edge: false });
        const rl = easeOut(seg(p, 0.71, 0.74));
        if (rl > 0) B(raised, [-9.5, -6.05, 2.9, 3.0, 3.68, 3.68 + 1.0 * rl], M.rail, { ao: false, edge: false, shadow: false });
      }

      // Andamio frontal y lateral
      const sc = easeOut(seg(p, 0.47, 0.51)) * (1 - easeInOut(seg(p, 0.655, 0.69)));
      if (sc > 0.01) {
        raised.push({ b: [-6.2, 11.6, 4.0, 4.8, 0, 7.6 * sc], draw: () => drawScaffold('x', -6.2, 11.6, 4.4, 7.6 * sc), shadow: 'thin' });
        raised.push({ b: [11.75, 12.55, -5.4, 3.9, 0, 7.6 * sc], draw: () => drawScaffold('y', -5.4, 3.9, 12.15, 7.6 * sc), shadow: 'thin' });
      }

      // Deck de madera, pérgola y piscina
      if (deckE > 0) B(flat, [5.2, deckX1, -3.5, 3.8, 0, 0.3], { top: M.deck, side: { c: [0.42, 0.28, 0.18] } }, { aoA: 0.25 });
      const posts = easeOut(seg(p, 0.7, 0.72));
      if (posts > 0) {
        for (const [x, y] of [[12.6, -3.3], [12.6, 3.5], [17.3, -3.3], [17.3, 3.5]]) B(raised, [x - 0.09, x + 0.09, y - 0.09, y + 0.09, 0.3, lerp(0.3, 3.0, posts)], { top: M.deck, side: M.slats }, { edge: false });
        const bm = easeOut(seg(p, 0.715, 0.735));
        if (bm > 0) for (const y of [-3.3, 3.5]) B(raised, [12.4, lerp(12.5, 17.6, bm), y - 0.09, y + 0.09, 3.0, 3.25], { top: M.deck, side: { c: [0.6, 0.4, 0.26] } }, {});
        for (let k = 0; k < 12; k++) {
          const e = easeOut(seg(p, 0.73 + k * 0.003, 0.745 + k * 0.003));
          if (e > 0) B(raised, [12.7 + k * 0.41, 12.78 + k * 0.41, 3.8 - 7.4 * e, 3.8, 3.25, 3.38], { top: M.deck, side: { c: [0.62, 0.42, 0.27] } }, { edge: false, ao: false });
        }
      }
      const cop = easeOut(seg(p, 0.745, 0.77));
      if (cop > 0) {
        const zc = 0.32;
        B(flat, [6, 17, 3.8, 4.6, 0, zc], M.coping, { a: cop, aoA: 0.2 });
        B(flat, [6, 17, 8.2, 8.7, 0, zc], M.coping, { a: cop, aoA: 0.2 });
        B(flat, [6, 6.5, 4.6, 8.2, 0, zc], M.coping, { a: cop, aoA: 0.2 });
        B(flat, [16.5, 17, 4.6, 8.2, 0, zc], M.coping, { a: cop, aoA: 0.2 });
      }

      // Camino de piedras y luminarias de jardín
      for (let k = 0; k < 7; k++) {
        const e = easeBack(seg(p, 0.83 + k * 0.006, 0.86 + k * 0.006));
        if (e > 0) B(flat, [-6.6 - 0.55 * e, -6.6 + 0.55 * e, 4.6 + k * 1.15, 4.6 + k * 1.15 + 0.7 * e, 0, 0.07], M.coping, { ao: false, edge: false });
      }
      const bol = easeOut(seg(p, 0.86, 0.89));
      if (bol > 0) for (const [x, y] of [[-7.7, 6.2], [-5.5, 8.6], [-7.7, 10.9], [5, 9.2], [17.6, 9.2]]) {
        B(raised, [x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, 0.65 * bol], M.bollard, { edge: false, ao: false, shadow: false });
        if (E.lights > 0) R.lamps.push([x, y, 0.6]);
      }

      // Vegetación
      const plants = [
        { k: 'treeA', x: -8.5, y: -10.6, h: 8.5, t: 0.84 },
        { k: 'gold', x: 6.5, y: -10.4, h: 8, t: 0.86 },
        { k: 'palm', x: -14.6, y: 6.2, h: 10.5, t: 0.87 },
        { k: 'palm2', x: -15.8, y: 1.2, h: 8.6, t: 0.88 },
        { k: 'palm', x: 21.6, y: -2.2, h: 10.5, t: 0.875 },
        { k: 'palm2', x: 22.4, y: 3.6, h: 7.4, t: 0.89 },
        { k: 'treeB', x: -16, y: -6.5, h: 8, t: 0.885 },
        { k: 'gold', x: -14.2, y: 11.2, h: 6.5, t: 0.9 }
      ];
      for (const pl of ENV) raised.push({ b: [pl.x - 0.3, pl.x + 0.3, pl.y - 0.3, pl.y + 0.3, 0, pl.h], draw: () => drawSprite(SPR[pl.k], pl.x, pl.y, pl.h), sprite: pl, g: 1 });
      for (const pl of plants) {
        const g = easeBack(seg(p, pl.t, pl.t + 0.06), 1.3);
        if (g > 0.01) raised.push({ b: [pl.x - 0.3, pl.x + 0.3, pl.y - 0.3, pl.y + 0.3, 0, pl.h * g], draw: () => drawSprite(SPR[pl.k], pl.x, pl.y, pl.h * g), sprite: pl, g });
      }
      const shrubs = [
        ['shrubF', -9.3, 4.7, 1.3], ['shrub', -8.3, 4.9, 1.1], ['shrub', -4.6, 4.6, 1.2], ['shrubO', -3.0, 4.75, 1.1], ['shrub', -1.2, 4.6, 1.25],
        ['shrubF', 0.7, 4.8, 1.0], ['shrub', 2.6, 4.6, 1.2], ['shrubO', 4.2, 4.8, 1.0], ['shrub', 18.4, 7.6, 1.3], ['shrubF', 18.6, 1.4, 1.2],
        ['shrub', -13.2, 8.6, 1.4], ['shrubO', -13.6, 3.6, 1.2], ['shrub', -8.6, 2.0, 0.9], ['shrubF', -6.8, 0.2, 0.8]
      ];
      shrubs.forEach(([k, x, y, h], i) => {
        const g = easeBack(seg(p, 0.87 + (i % 7) * 0.008, 0.91 + (i % 7) * 0.008), 1.6);
        if (g <= 0.01) return;
        const zb = i >= 12 ? 3.68 : 0; // las dos últimas van en materas de la terraza
        if (i >= 12 && terr <= 0) return;
        raised.push({ b: [x - 0.25, x + 0.25, y - 0.25, y + 0.25, zb, zb + h * g], draw: () => drawSprite(SPR[k], x, y, h * g, zb, 2.2), shadow: 'shrub', g, sh: h });
      });

      // Grúa torre: torre en el orden normal; pluma y carga siempre arriba
      const up = easeOut(seg(p, 0.15, 0.23)), down = easeInOut(seg(p, 0.79, 0.85));
      const mz = 21 * up * (1 - down);
      if (mz > 0.3) {
        raised.push({ b: [CRANE[0] - 1.2, CRANE[0] + 1.2, CRANE[1] - 1.2, CRANE[1] + 1.2, 0, mz], draw: () => drawMast(mz), shadow: 'mast', mz });
        top.push(() => drawJib(p, mz, up, down));
      }

      // Camión mezclador
      const tin = easeOut(seg(p, 0.185, 0.215)), tout = easeInOut(seg(p, 0.275, 0.305));
      if (tin > 0 && tout < 1) {
        const ty = lerp(26, 6.2, tin) + tout * 22;
        truck(raised, 8.4, ty, p);
      }
      return { flat, raised, top };
    }

    function column(list, x, y, w, zb, zt, t0, slabNext, wallTop = 0) {
      const p = R.p;
      const e1 = easeOut(seg(p, t0, t0 + 0.022));
      if (e1 <= 0) return;
      const e2 = easeOut(seg(p, t0 + 0.016, t0 + 0.034));
      const e3 = seg(p, t0 + 0.05, t0 + 0.058);
      const h = w / 2;
      const zr = zb + (zt - zb + 0.7) * e1;
      if (e3 < 0.5) {
        const zf = zb + (zt - zb) * e2;
        if (e2 > 0) list.push({ b: [x - h - 0.05, x + h + 0.05, y - h - 0.05, y + h + 0.05, zb, zf], m: M.ply, draw: drawBox, edge: false });
        if (zr > zf + 0.02) list.push({ b: [x - h, x + h, y - h, y + h, Math.max(zb, zf), zr], draw: it => drawRebar(it.b), shadow: 'thin' });
      } else {
        const z0 = Math.max(zb, wallTop);
        if (zt > z0 + 0.01) list.push({ b: [x - h, x + h, y - h, y + h, z0, zt], m: M.conc, draw: drawBox, edge: true, ao: z0 <= zb + 0.01 });
        const stub = 0.7 * (1 - slabNext);
        if (stub > 0.02) list.push({ b: [x - h, x + h, y - h, y + h, zt, zt + stub], draw: it => drawRebar(it.b), shadow: 'thin' });
      }
    }
    function truck(list, x, y, p) {
      const B = (b, m, o) => list.push(Object.assign({ b, m, draw: drawBox }, o));
      B([x - 1.25, x + 1.25, y - 3.4, y - 2.5, 0, 1.0], M.rubber, { edge: false });
      B([x - 1.25, x + 1.25, y + 1.4, y + 3.4, 0, 1.0], M.rubber, { edge: false });
      B([x - 1.2, x + 1.2, y - 4.3, y + 3.9, 1.0, 1.35], M.steel, { ao: false });
      B([x - 1.2, x + 1.2, y - 4.3, y - 2.3, 1.35, 3.3], M.cab, { ao: false, reg: { px: [{ u: [0.55, 0.95], v: [0.45, 0.9], m: M.glass, o: { dark: true, mull: 9 } }], py: [] } });
      list.push({ b: [x - 1.15, x + 1.15, y - 1.9, y + 3.7, 1.35, 3.65], draw: it => drawDrum(x, y - 1.9, y + 3.7, 2.5, 1.12, p), shadow: 'box' });
    }

    // ---------- Piezas dibujadas a mano (líneas en perspectiva) ----------
    const lw = (m, z) => Math.max(0.8 * R.dd, (m * R.cam.F) / z);
    function lines(segs, color, m) {
      // segs: [[x,y,z,x,y,z], …]
      if (!segs.length) return;
      const P = R.cam.proj;
      let zs = 0;
      ctx.beginPath();
      for (const s of segs) { const a = P(s[0], s[1], s[2]), b = P(s[3], s[4], s[5]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); zs += a[2]; }
      ctx.strokeStyle = color; ctx.lineWidth = lw(m, zs / segs.length); ctx.lineCap = 'round';
      ctx.stroke();
    }
    function drawRebar(b) {
      const [x0, x1, y0, y1, z0, z1] = b, s = [];
      const i = 0.04;
      for (const [x, y] of [[x0 + i, y0 + i], [x1 - i, y0 + i], [x1 - i, y1 - i], [x0 + i, y1 - i]]) s.push([x, y, z0, x, y, z1]);
      for (let z = z0 + 0.2; z < z1 - 0.1; z += 0.3) {
        s.push([x0 + i, y1 - i, z, x1 - i, y1 - i, z], [x1 - i, y1 - i, z, x1 - i, y0 + i, z]);
      }
      lines(s, css(mixC([0.5, 0.27, 0.16], R.E.fogC, 0.1)), 0.035);
    }
    function drawProps(x0, x1, y0, y1, z0, z1, a) {
      const s = [];
      for (let x = x0; x <= x1 + 0.01; x += 1.5) for (let y = y0; y <= y1 + 0.01; y += 1.4) s.push([x, y, z0, x, y, z1 - 0.05]);
      ctx.globalAlpha = a;
      lines(s, css([0.55, 0.56, 0.58]), 0.05);
      ctx.globalAlpha = 1;
    }
    function drawScaffold(axis, a0, a1, at, h) {
      const s = [], planks = [];
      const P = (u, z, d = 0) => (axis === 'x' ? [u, at + d, z] : [at + d, u, z]);
      for (let u = a0; u <= a1 + 0.01; u += 1.95) for (const d of [-0.38, 0.38]) { const a = P(u, 0.3, d), b = P(u, h, d); s.push([...a, ...b]); }
      for (let z = 2; z <= h + 0.01; z += 2) {
        for (const d of [-0.38, 0.38]) { const a = P(a0, z, d), b = P(a1, z, d); s.push([...a, ...b]); }
        planks.push(z);
      }
      for (let u = a0, k = 0; u < a1 - 0.5; u += 1.95, k++) { const z0 = Math.floor(k % 3) * 2 + 0.3; if (z0 + 2 > h) continue; const a = P(u, z0, 0.38), b = P(u + 1.95, z0 + 2, 0.38); s.push([...a, ...b]); }
      // tablones
      for (const z of planks) {
        const q = [P(a0, z, -0.38), P(a1, z, -0.38), P(a1, z, 0.38), P(a0, z, 0.38)];
        const Pq = PJ(q);
        path(Pq); ctx.fillStyle = lit([0.58, 0.5, 0.4], [0, 0, 1], Pq[0][2]); ctx.fill();
        const f = [P(a0, z - 0.06, 0.38), P(a1, z - 0.06, 0.38), P(a1, z, 0.38), P(a0, z, 0.38)];
        const Pf = PJ(f);
        path(Pf); ctx.fillStyle = lit([0.42, 0.36, 0.3], axis === 'x' ? [0, 1, 0] : [1, 0, 0], Pf[0][2]); ctx.fill();
      }
      lines(s, css(mixC([0.62, 0.64, 0.66], R.E.fogC, 0.1)), 0.05);
    }
    function drawMound(x, y, r, h) {
      const pts = [];
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; pts.push(R.cam.proj(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, 0)); pts.push(R.cam.proj(x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.3, h)); }
      const hl = hull(pts.map(q => [q[0], q[1]]));
      const L = R.E.L;
      const a = R.cam.proj(x - L[0] * r, y - L[1] * r, h * 0.3), b = R.cam.proj(x + L[0] * r, y + L[1] * r, h * 0.3);
      const g = ctx.createLinearGradient(b[0], b[1], a[0], a[1]);
      g.addColorStop(0, lit([0.62, 0.5, 0.38], [0, 0, 1], a[2])); g.addColorStop(1, lit([0.62, 0.5, 0.38], [0, 0, 0.2], a[2], 0.7));
      path(hl); ctx.fillStyle = g; ctx.fill();
    }
    function drawDrum(x, y0, y1, zc, r, p) {
      const n = 12, C = R.cam.C;
      const pt = (a, y) => [x + Math.cos(a) * r, y, zc + Math.sin(a) * r];
      const faces = [];
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
        const nn = [Math.cos(am), 0, Math.sin(am)];
        const c = pt(am, (y0 + y1) / 2);
        if ((C[0] - c[0]) * nn[0] + (C[2] - c[2]) * nn[2] <= 0) continue;
        faces.push({ q: [pt(a0, y0), pt(a1, y0), pt(a1, y1), pt(a0, y1)], nn, stripe: (i + Math.floor(p * 200)) % 4 === 0 });
      }
      for (const f of faces) {
        const P = PJ(f.q);
        path(P); const col = lit(f.stripe ? [0.92, 0.92, 0.9] : M.drum.c, f.nn, P[0][2]);
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = R.seam; ctx.stroke();
      }
      if (C[1] > y1) {
        const cap = [];
        for (let i = 0; i < n; i++) cap.push(R.cam.proj(...pt((i / n) * Math.PI * 2, y1)));
        path(cap); ctx.fillStyle = lit([0.8, 0.5, 0.2], [0, 1, 0], cap[0][2]); ctx.fill();
      }
    }
    function drawMast(mz) {
      const [mx, my] = CRANE, w = 0.75, s = [];
      const corners = [[mx - w, my - w], [mx + w, my - w], [mx + w, my + w], [mx - w, my + w]];
      for (const [x, y] of corners) s.push([x, y, 0.8, x, y, mz]);
      for (let z = 0.8, k = 0; z < mz - 0.1; z += 1.5, k++) {
        const z2 = Math.min(mz, z + 1.5);
        s.push([mx - w, my + w, z, mx + w, my + w, z], [mx + w, my + w, z, mx + w, my - w, z]);
        s.push(k % 2 ? [mx - w, my + w, z, mx + w, my + w, z2] : [mx + w, my + w, z, mx - w, my + w, z2]);
        s.push(k % 2 ? [mx + w, my + w, z, mx + w, my - w, z2] : [mx + w, my - w, z, mx + w, my + w, z2]);
      }
      const base = { b: [mx - 1.4, mx + 1.4, my - 1.4, my + 1.4, 0, 0.8], m: M.conc };
      drawBox(base);
      lines(s, lit(M.crane.c, [0.6, 0.6, 0.5], 60), 0.07);
    }
    function drawJib(p, mz, up, down) {
      const [mx, my] = CRANE;
      const jibOn = easeOut(seg(p, 0.21, 0.25)) * (1 - easeInOut(seg(p, 0.79, 0.82)));
      if (jibOn <= 0.01) return;
      const th = rad(keys(p, [[0.22, 30], [0.3, 80], [0.34, 80], [0.38, 62], [0.43, 62], [0.47, 44], [0.51, 44], [0.55, 108], [0.59, 108], [0.63, 64], [0.67, 64], [0.71, 46], [0.75, 46], [0.79, 30]]));
      const ux = Math.cos(th), uy = Math.sin(th), px = -uy, py = ux;
      const L = 25 * jibOn, Lc = 7 * jibOn, zt = mz + 1.4;
      const s = [];
      for (const d of [-0.5, 0.5]) s.push([mx - ux * Lc + px * d, my - uy * Lc + py * d, mz, mx + ux * L + px * d, my + uy * L + py * d, mz]);
      s.push([mx - ux * Lc, my - uy * Lc, zt, mx + ux * L, my + uy * L, zt]);
      const n = Math.max(2, Math.round((L + Lc) / 1.3));
      for (let k = 0; k < n; k++) {
        const t0 = -Lc + ((L + Lc) * k) / n, t1 = -Lc + ((L + Lc) * (k + 1)) / n, d = k % 2 ? -0.5 : 0.5;
        s.push([mx + ux * t0 + px * d, my + uy * t0 + py * d, mz, mx + ux * t1, my + uy * t1, zt]);
        s.push([mx + ux * t1 + px * -d, my + uy * t1 + py * -d, mz, mx + ux * t1, my + uy * t1, zt]);
      }
      const apex = [mx, my, mz + 5.5];
      s.push([mx, my, mz, ...apex], [...apex, mx + ux * L * 0.6, my + uy * L * 0.6, zt], [...apex, mx - ux * Lc, my - uy * Lc, zt]);
      lines(s, lit(M.crane.c, [0.5, 0.5, 0.7], 60), 0.07);
      // contrapeso y cabina
      const bx = mx - ux * Lc * 0.85, by = my - uy * Lc * 0.85;
      drawBox({ b: [bx - 0.9, bx + 0.9, by - 0.9, by + 0.9, mz - 1.4, mz], m: M.conc, ao: false });
      drawBox({ b: [mx + 0.8, mx + 2.2, my - 0.7, my + 0.7, mz - 2, mz], m: M.crane, ao: false, reg: { py: [{ u: [0.15, 0.85], v: [0.35, 0.85], m: M.glass, o: { dark: true, mull: 9 } }] } });
      // carro, cable y carga
      const centers = [[0.32, 4.6, 'rust'], [0.405, 5.2, 'ply'], [0.49, 8.6, 'pallet'], [0.57, 4.8, 'ply'], [0.65, 8.6, 'pallet'], [0.73, 5.4, 'glassbox']];
      let hz = mz - 2.5, load = null;
      for (const [c, low, kind] of centers) {
        const b = Math.sin(Math.PI * seg(p, c - 0.022, c + 0.022));
        hz = Math.min(hz, lerp(mz - 2.5, low, b));
        if (p > c - 0.06 && p < c + 0.004) load = kind;
      }
      hz = Math.min(hz, mz - 1);
      const td = keys(p, [[0.22, 8], [0.3, 11.6], [0.38, 15], [0.47, 16.5], [0.55, 12.6], [0.63, 15.2], [0.71, 16.5], [0.79, 8]]) * jibOn;
      const tx = mx + ux * td, ty = my + uy * td;
      lines([[tx, ty, mz, tx, ty, hz]], 'rgba(30,30,30,.9)', 0.025);
      drawBox({ b: [tx - 0.3, tx + 0.3, ty - 0.3, ty + 0.3, mz - 0.35, mz], m: M.steel, ao: false, edge: false });
      if (load) {
        const m = load === 'rust' ? M.rust : load === 'ply' ? M.ply : load === 'pallet' ? M.pallet : M.lumber;
        lines([[tx, ty, hz, tx - 0.7, ty - 0.5, hz - 0.6], [tx, ty, hz, tx + 0.7, ty + 0.5, hz - 0.6]], 'rgba(30,30,30,.8)', 0.02);
        drawBox({ b: [tx - 0.8, tx + 0.8, ty - 0.55, ty + 0.55, hz - 1.2, hz - 0.6], m, ao: false });
      }
    }
    function drawSprite(s, x, y, h, zb = 0, wmul = 1) {
      const base = R.cam.proj(x, y, zb), top = R.cam.proj(x, y, zb + h);
      const hp = base[1] - top[1];
      if (hp < 1) return;
      const w = (hp * s.day.width) / s.day.height * wmul / (wmul > 1 ? 1.8 : 1);
      const x0 = base[0] - w * s.ax;
      const fogA = clamp((base[2] - 40) / 220) * 0.75 * (1 - R.E.eD * 0.8);
      const ga = ctx.globalAlpha;
      ctx.drawImage(s.day, x0, top[1], w, hp);
      if (R.E.eD > 0.01) { ctx.globalAlpha = ga * R.E.eD; ctx.drawImage(s.dusk, x0, top[1], w, hp); }
      // neblina: los árboles lejanos se aclaran hacia el color del aire
      if (fogA > 0.02) { ctx.globalAlpha = ga * fogA; ctx.drawImage(s.haze, x0, top[1], w, hp); }
      ctx.globalAlpha = ga;
    }

    // ---------- Suelo, plano, excavaciones ----------
    function groundQuad(x0, x1, y0, y1, z, color, tex, ta, ts) {
      const c = [[x0, y1, z], [x1, y1, z], [x1, y0, z], [x0, y0, z]];
      const P = PJ(c);
      path(P); ctx.fillStyle = color; ctx.fill();
      if (tex) {
        const mat = { tex, ts: [ts, ts] };
        texture(c, 'top', mat, ta, x1 - x0, y1 - y0);
      }
    }
    function drawPit(x0, x1, y0, y1, d, wallMat, floorMat, inside) {
      const top = PJ([[x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x0, y0, 0]]);
      ctx.save();
      path(top); ctx.clip();
      const C = R.cam.C;
      const fl = [[x0, y1, -d], [x1, y1, -d], [x1, y0, -d], [x0, y0, -d]];
      surface(fl, PJ(fl), [0, 0, 1], floorMat, 'top', x1 - x0, y1 - y0, top[0][2], { k: 0.62 });
      if (C[1] > y0) { const c = [[x0, y0, -d], [x1, y0, -d], [x1, y0, 0], [x0, y0, 0]]; const P = PJ(c); surface(c, P, [0, 1, 0], wallMat, 'py', x1 - x0, d, P[0][2], { k: 0.85 }); aoGrad(P, 0.45); }
      if (C[0] > x0) { const c = [[x0, y1, -d], [x0, y0, -d], [x0, y0, 0], [x0, y1, 0]]; const P = PJ(c); surface(c, P, [1, 0, 0], wallMat, 'px', y1 - y0, d, P[0][2], { k: 0.85 }); aoGrad(P, 0.45); }
      if (inside) inside();
      ctx.restore();
    }
    function chalk(pts, t, closed, z = 0.02) {
      // traza una línea de tiza progresiva en el suelo
      const all = closed ? pts.concat([pts[0]]) : pts;
      let total = 0;
      for (let i = 1; i < all.length; i++) total += Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]);
      let left = total * t;
      ctx.beginPath();
      let a = R.cam.proj(all[0][0], all[0][1], z);
      ctx.moveTo(a[0], a[1]);
      for (let i = 1; i < all.length && left > 0; i++) {
        const l = Math.hypot(all[i][0] - all[i - 1][0], all[i][1] - all[i - 1][1]);
        const k = Math.min(1, left / l);
        const q = R.cam.proj(lerp(all[i - 1][0], all[i][0], k), lerp(all[i - 1][1], all[i][1], k), z);
        ctx.lineTo(q[0], q[1]);
        left -= l;
      }
      ctx.stroke();
    }
    const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    function groundText(txt, x, y, size, alpha) {
      // texto pintado sobre el suelo con la perspectiva del terreno
      const o = R.cam.proj(x, y, 0.02), ax = R.cam.proj(x + 1, y, 0.02), ay = R.cam.proj(x, y + 1, 0.02);
      const k = 1 / 40;
      ctx.save();
      ctx.setTransform((ax[0] - o[0]) * k, (ax[1] - o[1]) * k, (ay[0] - o[0]) * k, (ay[1] - o[1]) * k, o[0], o[1]);
      ctx.font = `600 ${size * 40}px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
    function drawGround(p) {
      const E = R.E, cam = R.cam;
      // Lote: tierra que se vuelve césped
      const eL = seg(p, 0.8, 0.92);
      const soilC = lit([0.6, 0.47, 0.35], [0, 0, 1], 50);
      const [lx0, lx1, ly0, ly1] = LOT;
      const nx = 6, ny = 4;
      const lotP = LOTPOLY.map(q => cam.proj(q[0], q[1], 0));
      ctx.save();
      path(lotP); ctx.clip();
      ctx.fillStyle = soilC; ctx.fill();
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x0 = lerp(lx0, lx1, i / nx), x1 = lerp(lx0, lx1, (i + 1) / nx), y0 = lerp(ly0, ly1, j / ny), y1 = lerp(ly0, ly1, (j + 1) / ny);
        texture([[x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x0, y0, 0]], 'top', { tex: 'soil', ts: [8, 8] }, 1, 3, 3);
      }
      // borde del lote más oscuro (tierra húmeda donde empieza el pasto)
      ctx.lineWidth = lw(1.4, 50); ctx.strokeStyle = css([0.25, 0.22, 0.14], 0.35 * (1 - eL)); path(lotP); ctx.stroke();
      // huellas de llantas de la obra
      const tr = seg(p, 0.12, 0.2) * (1 - seg(p, 0.78, 0.82));
      if (tr > 0) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = css([0.7, 0.62, 0.55], 0.55 * tr); ctx.lineCap = 'round';
        for (const off of [-1.1, 1.1]) {
          ctx.lineWidth = lw(0.5, 50);
          ctx.beginPath();
          for (let i = 0; i <= 20; i++) {
            const t = i / 20, x = 8.4 + off + Math.sin(t * 2.2) * 2.2 * (1 - t), y = lerp(14, 4.5, t);
            const q = cam.proj(x, y, 0); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
          }
          ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      if (eL > 0) {
        // el césped se extiende desde la casa con un borde orgánico
        const Rr = easeInOut(eL) * 36, pts = [];
        for (let i = 0; i < 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const rr = Rr * (1 + 0.08 * Math.sin(a * 5 + 1) + 0.05 * Math.sin(a * 11));
          pts.push([clamp(2 + Math.cos(a) * rr, lx0, lx1), clamp(0.5 + Math.sin(a) * rr, ly0, ly1)]);
        }
        ctx.save();
        path(pts.map(q => cam.proj(q[0], q[1], 0))); ctx.clip();
        path(lotP); ctx.fillStyle = lit([0.42, 0.55, 0.26], [0, 0, 1], 50); ctx.fill();
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x0 = lerp(lx0, lx1, i / nx), x1 = lerp(lx0, lx1, (i + 1) / nx), y0 = lerp(ly0, ly1, j / ny), y1 = lerp(ly0, ly1, (j + 1) / ny);
          texture([[x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x0, y0, 0]], 'top', { tex: 'grass', ts: [6, 6] }, 1, 3, 3);
        }
        // jardineras con mantillo
        const mul = easeOut(seg(p, 0.83, 0.87));
        if (mul > 0) {
          ctx.globalAlpha = mul;
          for (const r of [[-9.9, -7.4, 4.1, 5.4], [-5.4, 4.8, 4.1, 5.3], [17.4, 19.2, 1.6, 9.2], [-14.4, -12.6, 2.6, 9.6]]) {
            const P = PJ([[r[0], r[3], 0.01], [r[1], r[3], 0.01], [r[1], r[2], 0.01], [r[0], r[2], 0.01]]);
            path(P); ctx.fillStyle = lit([0.3, 0.22, 0.17], [0, 0, 1], 50); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }

      // 1. Replanteo: estacas, hilos y plano trazado con tiza
      const bpA = 1 - seg(p, 0.15, 0.2);
      if (bpA > 0) {
        ctx.save();
        ctx.globalAlpha = bpA;
        ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const lwG = lw(0.09, 45);
        ctx.lineWidth = lwG;
        chalk(rect(SLAB[0], SLAB[1], SLAB[2], SLAB[3]), easeOut(seg(p, 0.02, 0.07)), true);
        chalk(rect(GFA[0], GFB[1], GFA[2], GFA[3]), easeOut(seg(p, 0.035, 0.08)), true);
        chalk([[GFB[0], GFB[2]], [GFB[0], GFB[3]]], easeOut(seg(p, 0.05, 0.075)), false);
        chalk(rect(5.2, 17.5, -3.5, 3.8), easeOut(seg(p, 0.05, 0.095)), true);
        chalk(rect(POOL[0], POOL[1], POOL[2], POOL[3]), easeOut(seg(p, 0.06, 0.1)), true);
        chalk(rect(-12.4, -10.6, -6.5, 5.5), easeOut(seg(p, 0.07, 0.1)), true);
        ctx.setLineDash([lwG * 3, lwG * 3]);
        ctx.globalAlpha = bpA * 0.75;
        chalk(rect(UFW[0], UFW[1], UFW[2], UFW[3]), easeOut(seg(p, 0.06, 0.11)), true);
        ctx.setLineDash([]);
        ctx.globalAlpha = bpA;
        // cotas
        chalk([[-12.4, 11], [17.5, 11]], easeOut(seg(p, 0.08, 0.12)), false);
        chalk([[-12.4, 10.5], [-12.4, 11.5]], easeOut(seg(p, 0.08, 0.09)), false);
        chalk([[17.5, 10.5], [17.5, 11.5]], easeOut(seg(p, 0.11, 0.12)), false);
        chalk([[19.5, -5.3], [19.5, 8.7]], easeOut(seg(p, 0.09, 0.13)), false);
        ctx.restore();
        const lab = easeOut(seg(p, 0.09, 0.13)) * bpA;
        if (lab > 0) {
          groundText('320 m²', 0, -0.9, 2.2, lab * 0.95);
          groundText('30,0 m', 2.5, 12.3, 1.1, lab * 0.85);
          groundText('piscina', 11.5, 6.4, 0.9, lab * 0.7);
        }
        // estacas con hilo de replanteo
        const sk = easeOut(seg(p, 0.0, 0.04));
        if (sk > 0) {
          const st = [[SLAB[0] - 0.8, SLAB[2] - 0.8], [SLAB[1] + 0.8, SLAB[2] - 0.8], [SLAB[1] + 0.8, SLAB[3] + 0.8], [SLAB[0] - 0.8, SLAB[3] + 0.8]];
          ctx.globalAlpha = bpA;
          const s = st.map(([x, y]) => [x, y, 0, x, y, 0.9 * sk]);
          lines(s, css([0.55, 0.4, 0.26]), 0.06);
          const str = [];
          for (let i = 0; i < 4; i++) { const a = st[i], b = st[(i + 1) % 4]; str.push([a[0], a[1], 0.7 * sk, b[0], b[1], 0.7 * sk]); }
          lines(str, 'rgba(255,120,60,.85)', 0.018);
          ctx.globalAlpha = 1;
        }
      }

      // 2. Excavación, varillas y vaciado del cimiento
      const eX = easeOut(seg(p, 0.15, 0.2));
      const slabE = seg(p, 0.265, 0.29);
      if (eX > 0 && slabE <= 0) {
        const cx = (SLAB[0] + SLAB[1]) / 2, cy = (SLAB[2] + SLAB[3]) / 2;
        const hw = lerp(0.8, (SLAB[1] - SLAB[0]) / 2, eX), hd = lerp(0.6, (SLAB[3] - SLAB[2]) / 2, eX);
        const x0 = cx - hw, x1 = cx + hw, y0 = cy - hd, y1 = cy + hd, d = 1.1 * eX;
        const reb = easeOut(seg(p, 0.2, 0.235)), pour = easeInOut(seg(p, 0.235, 0.265));
        drawPit(x0, x1, y0, y1, d, { c: [0.6, 0.46, 0.34], tex: 'soil', ts: [4, 4], ta: 1 }, { c: [0.5, 0.39, 0.29], tex: 'soil', ts: [4, 4], ta: 1 }, () => {
          if (reb > 0) {
            const s = [], zr = -d + 0.25;
            const xm = lerp(x0, x1, reb);
            for (let x = x0 + 0.3; x < xm; x += 0.5) s.push([x, y0 + 0.2, zr, x, y1 - 0.2, zr]);
            for (let y = y0 + 0.3; y < y1; y += 0.5) s.push([x0 + 0.2, y, zr + 0.04, xm, y, zr + 0.04]);
            lines(s, css([0.5, 0.28, 0.17]), 0.03);
          }
          if (pour > 0) {
            const zp = lerp(-d, -0.02, pour);
            const c = [[x0, y1, zp], [x1, y1, zp], [x1, y0, zp], [x0, y0, zp]];
            const P = PJ(c);
            const g = ctx.createLinearGradient(P[0][0], P[0][1], P[2][0], P[2][1]);
            g.addColorStop(0, lit([0.52, 0.52, 0.5], [0, 0, 1], 50)); g.addColorStop(1, lit([0.66, 0.66, 0.64], [0, 0, 1], 50));
            path(P); ctx.fillStyle = g; ctx.fill();
          }
        });
      }

      // Piscina: excavación, enchape y agua
      const pX = easeOut(seg(p, 0.705, 0.735));
      if (pX > 0) {
        const [x0, x1, y0, y1] = POOL;
        const tile = seg(p, 0.735, 0.765);
        const d = 1.5 * pX;
        const wallM = tile > 0.5 ? { c: [0.66, 0.84, 0.86], tex: 'tile', ts: [1, 1], ta: 1 } : { c: [0.6, 0.46, 0.34], tex: 'soil', ts: [4, 4], ta: 1 };
        const xm = lerp((x0 + x1) / 2, x1, pX), xn = lerp((x0 + x1) / 2, x0, pX);
        const eW = easeInOut(seg(p, 0.82, 0.9));
        R.water = null;
        drawPit(xn, xm, y0, y1, d, wallM, wallM, () => {
          if (eW > 0) {
            const zw = lerp(-d, 0.16, eW);
            const c = [[xn, y1, zw], [xm, y1, zw], [xm, y0, zw], [xn, y0, zw]];
            const P = PJ(c);
            const g = ctx.createLinearGradient(P[0][0], P[0][1], P[3][0], P[3][1]);
            g.addColorStop(0, css(mixC([0.16, 0.5, 0.56], E.zen, 0.15), 0.9));
            g.addColorStop(1, css(mixC(mixC([0.5, 0.78, 0.8], E.hor, 0.35), [0.2, 0.3, 0.4], E.eD * 0.5), 0.92));
            path(P); ctx.fillStyle = g; ctx.fill();
            if (E.lights > 0) {
              const cc = PJ([[(xn + xm) / 2, (y0 + y1) / 2, zw]])[0];
              const rg = ctx.createRadialGradient(cc[0], cc[1], 1, cc[0], cc[1], Math.abs(P[1][0] - P[0][0]) * 0.6);
              rg.addColorStop(0, `rgba(120,240,235,${(0.75 * E.lights).toFixed(3)})`); rg.addColorStop(1, 'rgba(60,200,210,0)');
              ctx.globalCompositeOperation = 'lighter';
              path(P); ctx.fillStyle = rg; ctx.fill();
              ctx.globalCompositeOperation = 'source-over';
            }
            R.water = { P: PJ([[x0, y1, 0.3], [x1, y1, 0.3], [x1, y0, 0.3], [x0, y0, 0.3]]), a: eW };
          }
        });
      }
    }

    // ---------- Cielo, montañas y nubes ----------
    function drawSky(p) {
      const E = R.E, cam = R.cam, hz = cam.horizon;
      const g = ctx.createLinearGradient(0, Math.min(hz - H * 1.1, -10), 0, hz + 2);
      g.addColorStop(0, css(E.zen)); g.addColorStop(0.62, css(E.mid)); g.addColorStop(1, css(E.hor));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Math.max(0, hz + 4));
      // sol y halo
      const sd = cam.dir([E.L[0], E.L[1], Math.max(E.L[2], -0.04)]);
      if (sd) {
        const rr = W * lerp(0.35, 0.6, E.eD);
        const rg = ctx.createRadialGradient(sd[0], sd[1], 1, sd[0], sd[1], rr);
        const sc = mixC([1, 0.97, 0.9], [1, 0.62, 0.34], E.eD);
        rg.addColorStop(0, css(sc, 0.9)); rg.addColorStop(0.12, css(sc, 0.45)); rg.addColorStop(1, css(sc, 0));
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, Math.max(0, hz + 4));
        if (E.L[2] > -0.02) { ctx.fillStyle = css(mixC([1, 1, 0.97], [1, 0.82, 0.6], E.eD)); ctx.beginPath(); ctx.arc(sd[0], sd[1], W * 0.012, 0, Math.PI * 2); ctx.fill(); }
      }
      // nubes (se desplazan con el progreso, no con el reloj)
      const cl = [[218, 13, 9, 0], [244, 18, 12, 1], [262, 10, 8, 2], [232, 26, 15, 1], [200, 21, 10, 2], [275, 22, 11, 0]];
      for (const [az0, el, size, k] of cl) {
        const az = rad(az0 + p * 6), e = rad(el);
        const d = [Math.cos(e) * Math.cos(az), Math.cos(e) * Math.sin(az), Math.sin(e)];
        const s = cam.dir(d);
        if (!s) continue;
        const w = cam.F * Math.tan(rad(size)), h = (w * 150) / 420;
        if (s[1] - h > hz) continue;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(CLOUDS[k].day, s[0] - w / 2, s[1] - h * 0.7, w, h);
        if (E.eD > 0) { ctx.globalAlpha = E.eD * 0.95; ctx.drawImage(CLOUDS[k].dusk, s[0] - w / 2, s[1] - h * 0.7, w, h); }
        ctx.globalAlpha = 1;
      }
      // montañas como carteleras lejanas (paralaje real con la cámara)
      const bill = (img, imgD, azc, D, width, hgt, z0) => {
        const a = rad(azc), cxw = Math.cos(a) * D, cyw = Math.sin(a) * D, px = -Math.sin(a), py = Math.cos(a);
        const tl = cam.proj(cxw + px * width / 2, cyw + py * width / 2, z0 + hgt), tr = cam.proj(cxw - px * width / 2, cyw - py * width / 2, z0 + hgt), bl = cam.proj(cxw + px * width / 2, cyw + py * width / 2, z0);
        if (tl[2] <= 1 || tr[2] <= 1) return;
        ctx.save();
        ctx.setTransform((tr[0] - tl[0]) / img.width, (tr[1] - tl[1]) / img.width, (bl[0] - tl[0]) / img.height, (bl[1] - tl[1]) / img.height, tl[0], tl[1]);
        ctx.drawImage(img, 0, 0);
        if (E.eD > 0) { ctx.globalAlpha = E.eD; ctx.drawImage(imgD, 0, 0); }
        ctx.restore();
      };
      bill(RIDGE_FAR, RIDGE_FAR_D, 238, 9000, 26000, 900, -60);
      bill(RIDGE_MID, RIDGE_MID_D, 236, 3800, 11000, 330, -40);
      // pradera hasta el horizonte
      const gg = ctx.createLinearGradient(0, hz, 0, H);
      const far = mixC(mixC([0.5, 0.58, 0.46], E.hor, 0.35), [0.16, 0.18, 0.22], E.eD * 0.6);
      const near = mixC([0.32, 0.43, 0.22], [0.1, 0.13, 0.1], E.eD * 0.7);
      gg.addColorStop(0, css(far)); gg.addColorStop(0.35, css(mixC(far, near, 0.6))); gg.addColorStop(1, css(near));
      ctx.fillStyle = gg; ctx.fillRect(0, Math.max(0, hz), W, H);
      // textura de la pradera en perspectiva (manchas grandes y pasto), se desvanece con la distancia
      for (let i = 0; i < 12; i++) for (let j = 0; j < 9; j++) {
        const x0 = -90 + i * 16, x1 = x0 + 16, y0 = -110 + j * 15, y1 = y0 + 15;
        const c = [[x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x0, y0, 0]];
        const P = PJ(c);
        if (Math.min(P[0][2], P[1][2], P[2][2], P[3][2]) < 6) continue;
        const d = (P[0][2] + P[2][2]) / 2, fa = clamp(1 - (d - 80) / 120);
        if (fa <= 0.02) continue;
        texture(c, 'top', { tex: 'field', ts: [48, 48] }, fa * 0.9, 3, 3);
        texture(c, 'top', { tex: 'grass', ts: [10, 10] }, fa * 0.75, 3, 3);
      }
      bill(TREELINE, TREELINE_D, 236, 700, 2600, 30, -3);
      bill(TREELINE, TREELINE_D, 228, 480, 1400, 22, -2);
      // bruma en el horizonte
      const hg = ctx.createLinearGradient(0, hz - H * 0.12, 0, hz + H * 0.08);
      hg.addColorStop(0, css(E.hor, 0)); hg.addColorStop(0.6, css(E.hor, 0.5)); hg.addColorStop(1, css(E.hor, 0));
      ctx.fillStyle = hg; ctx.fillRect(0, hz - H * 0.12, W, H * 0.2);
    }

    // ---------- Fotograma ----------
    function render(p) {
      last = p;
      if (!W && !resize()) return;
      if (!W) return;
      const E = env(p);
      const cam = makeCam(p, W, H);
      R = { p, E, cam, dd: dpr, seam: 0.7 * dpr, glows: [], lamps: [], water: null };
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      drawSky(p);
      drawGround(p);
      const S = build(p);
      // capa baja (losas, deck, bordes)
      for (const it of sortItems(S.flat)) it.draw(it);
      // sombras y oclusión en el suelo
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, shadowCv.width, shadowCv.height);
      actx.setTransform(1, 0, 0, 1, 0, 0); actx.clearRect(0, 0, aoCv.width, aoCv.height);
      sctx.fillStyle = '#000'; actx.fillStyle = 'rgba(0,0,0,.55)';
      for (const it of S.raised) {
        if (it.shadow === false) continue;
        const b = it.b;
        if (it.sprite) {
          const pl = it.sprite, h = b[5];
          const isPalm = pl.k.startsWith('palm');
          const cz = h * (isPalm ? 0.86 : 0.62), cr = h * (isPalm ? 0.3 : 0.32);
          const pts = [];
          for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; pts.push([pl.x + Math.cos(a) * cr, pl.y + Math.sin(a) * cr, cz + Math.sin(a) * cr * 0.25]); }
          shadowPoly(pts, sctx);
          shadowPoly([[pl.x - 0.15, pl.y, 0], [pl.x + 0.15, pl.y, 0], [pl.x - 0.1, pl.y, cz], [pl.x + 0.1, pl.y, cz]], sctx);
          continue;
        }
        if (it.shadow === 'shrub') {
          const pts = [], h = b[5] - b[4];
          for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; pts.push([(b[0] + b[1]) / 2 + Math.cos(a) * h * 0.9, (b[2] + b[3]) / 2 + Math.sin(a) * h * 0.6, b[4] + h * 0.5]); }
          if (b[4] < 0.1) shadowPoly(pts, sctx);
          continue;
        }
        if (it.shadow === 'mast') {
          const [mx, my] = CRANE;
          shadowPoly([[mx - 0.75, my - 0.75, 0], [mx + 0.75, my + 0.75, 0], [mx - 0.75, my - 0.75, it.mz], [mx + 0.75, my + 0.75, it.mz]], sctx);
          continue;
        }
        if (it.shadow === 'thin') { sctx.globalAlpha = 0.35; shadowPoly(boxCorners(it.b), sctx); sctx.globalAlpha = 1; continue; }
        if (it.a !== undefined && it.a < 0.5) continue;
        shadowPoly(boxCorners(b), sctx);
        if (b[4] < 0.6 && !it.sprite) {
          const e = 0.45;
          groundPoly([[b[0] - e, b[2] - e], [b[1] + e, b[2] - e], [b[1] + e, b[3] + e], [b[0] - e, b[3] + e]], actx, b[4]);
        }
      }
      ctx.save();
      const aoImg = blurInto(aoCv, null, 1.5);
      ctx.globalAlpha = 0.5 * (1 - E.eD * 0.3);
      ctx.drawImage(aoImg, 0, 0, W, H);
      const shImg = blurInto(shadowCv, null, 1.2);
      ctx.globalAlpha = 0.85 * clamp(E.sunI / 0.6);
      if (ctx.globalAlpha > 0.005) {
        // sombra multiplicada con un tono frío (luz del cielo dentro de la sombra)
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(tint(shImg, E), 0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.restore();
      // luz cálida que sale de los ventanales sobre el suelo
      if (E.lights > 0) spill(E.lights);
      // capa alta
      for (const it of sortItems(S.raised)) it.draw(it);
      for (const fn of S.top) fn();
      // luces y resplandor
      if (E.lights > 0) {
        ctx.globalCompositeOperation = 'lighter';
        for (const [x, y, z] of R.lamps) {
          const q = cam.proj(x, y, z), r = (1.6 * cam.F) / q[2];
          const g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
          g.addColorStop(0, `rgba(255,226,170,${(0.9 * E.lights).toFixed(3)})`); g.addColorStop(0.2, `rgba(255,190,120,${(0.35 * E.lights).toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,90,0)');
          ctx.fillStyle = g; ctx.fillRect(q[0] - r, q[1] - r, r * 2, r * 2);
        }
        for (const [x, y, r, a] of R.glows) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(255,184,110,${(0.22 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(255,160,90,0)');
          ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      // hojas desenfocadas en primer plano (profundidad de campo)
      const fd = easeOut(seg(p, 0.86, 0.96));
      if (fd > 0) {
        const s = Math.min(H * 0.55, W * 0.3);
        ctx.globalAlpha = fd * 0.92;
        ctx.drawImage(FROND, -s * 0.28 - (1 - fd) * s * 0.4, H - s * 0.78 + (1 - fd) * s * 0.3, s * 0.95, s * 0.8);
        ctx.globalAlpha = 1;
      }
      labels(p);
      // capa de agua animada con CSS, recortada a la piscina
      if (R.water && R.water.a > 0) {
        const P = R.water.P;
        water.style.opacity = (R.water.a * lerp(0.3, 0.42, E.lights)).toFixed(3);
        water.style.clipPath = `polygon(${P.map(q => `${(q[0] / dpr).toFixed(1)}px ${(q[1] / dpr).toFixed(1)}px`).join(',')})`;
      } else water.style.opacity = '0';
    }
    const tintCv = cv(8, 8), tctx = tintCv.getContext('2d');
    function tint(src, E) {
      if (tintCv.width !== src.width || tintCv.height !== src.height) { tintCv.width = src.width; tintCv.height = src.height; }
      tctx.globalCompositeOperation = 'source-over';
      tctx.clearRect(0, 0, tintCv.width, tintCv.height);
      tctx.drawImage(src, 0, 0);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = css(mixC([0.38, 0.44, 0.56], E.zen, 0.12));
      tctx.fillRect(0, 0, tintCv.width, tintCv.height);
      return tintCv;
    }
    function spill(a) {
      const cam = R.cam;
      ctx.globalCompositeOperation = 'lighter';
      const quads = [[[GFB[0], 3.0], [GFB[1], 3.0], 4.5, 0.46], [[UFW[1], -5.0], [UFW[1], 3.6], 4.5, 0.31]];
      for (const [a0, a1, d, z] of quads) {
        const isX = a0[0] === a1[0];
        const o = isX ? [d, 0] : [0, d];
        const c = [[a0[0], a0[1], z], [a1[0], a1[1], z], [a1[0] + o[0], a1[1] + o[1], 0], [a0[0] + o[0], a0[1] + o[1], 0]];
        const P = PJ(c);
        const m0 = mid2(P[0], P[1]), m1 = mid2(P[2], P[3]);
        const g = ctx.createLinearGradient(m0[0], m0[1], m1[0], m1[1]);
        g.addColorStop(0, `rgba(255,170,90,${(0.32 * a).toFixed(3)})`); g.addColorStop(1, 'rgba(255,150,80,0)');
        path(P); ctx.fillStyle = g; ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      void cam;
    }
    function labels(p) {
      const cam = R.cam, k = W / 1200;
      // cotas de nivel en la obra
      const lv = seg(p, 0.33, 0.37) * (1 - seg(p, 0.6, 0.64));
      if (lv > 0) {
        const L = [[0.45, '±0,00', 0.33], [3.95, '+3,95', 0.38], [7.1, '+7,10', 0.55]];
        for (const [z, txt, t] of L) {
          const a = lv * seg(p, t, t + 0.03);
          if (a <= 0) continue;
          const q = cam.proj(-12.6, 3.4, z);
          const x0 = q[0] - 14 * k, x1 = Math.max(16 * k, q[0] - 120 * k);
          ctx.globalAlpha = a;
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.2 * k; ctx.setLineDash([4 * k, 4 * k]);
          ctx.beginPath(); ctx.moveTo(x0, q[1]); ctx.lineTo(x1, q[1]); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.moveTo(x1 + 6 * k, q[1]); ctx.lineTo(x1, q[1] - 8 * k); ctx.lineTo(x1 + 12 * k, q[1] - 8 * k); ctx.closePath(); ctx.fill();
          ctx.font = `600 ${Math.round(15 * k)}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 6 * k;
          ctx.fillText(txt, x1 + 16 * k, q[1] - 4 * k);
          ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }
      }
      // ficha final
      const fin = easeOut(seg(p, 0.93, 1));
      if (fin > 0) {
        ctx.globalAlpha = fin;
        ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 10 * k;
        ctx.fillStyle = '#fff';
        const kk = Math.max(k, 0.55 * W / 700);
        ctx.font = `600 ${Math.round(20 * kk)}px ${FONT}`;
        ctx.fillText('CASA AURA', W - 26 * kk, H - 42 * kk);
        ctx.font = `400 ${Math.round(13 * kk)}px ${FONT}`;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.fillText('320 m²  ·  2 niveles  ·  piscina y terraza', W - 26 * kk, H - 20 * kk);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
    }

    resize();
    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.aura = {
    title: 'Una casa AURA, de cero a habitable',
    duration: 22000,
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
