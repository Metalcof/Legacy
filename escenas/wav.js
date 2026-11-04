'use strict';
// Escena WAV: render fotorrealista del Wave One. Las piezas son capas recortadas de la foto real
// dentro de una escena 3D de CSS: vista explotada, ensamblaje, tres acabados, sonido y bolsa.
// Todo se calcula desde el progreso p (0..1): se puede adelantar, retroceder y pausar.
(() => {
  // Rutas de las fotos: se resuelven desde este archivo (funciona en /index.html y en /escenas/prueba.html).
  const HERE = (document.currentScript && document.currentScript.src) || '';
  const asset = name => {
    try { if (HERE) return new URL(`../assets/${name}`, HERE).href; } catch (e) { /* sigue abajo */ }
    return (location.pathname.includes('/escenas/') ? '../assets/' : 'assets/') + name;
  };
  const IMG = {
    lav: asset('headphones-lavanda.webp'),
    gra: asset('headphones-grafito.webp'),
    lim: asset('headphones-lima.webp')
  };

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeBack = (t, s = 1.7) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2));
  const rad = d => (d * Math.PI) / 180;
  const f2 = v => (Math.abs(v) < 0.005 ? '0' : v.toFixed(2));
  const f3 = v => v.toFixed(3);

  // ---------- Geometría de la foto (1200 × 1200) ----------
  // Cadenas de corte compartidas por piezas vecinas: así las capas forman una partición exacta de la foto.
  const BAND_CUT = [[0, 345], [205, 347], [220, 351], [240, 362], [262, 372], [292, 380], [334, 385], [345, 386], [610, 375], [880, 380], [919, 378], [960, 372], [1015, 366], [1040, 364], [1200, 364]];
  const LSL_LOW = [[345, 386], [345, 440], [300, 448], [292, 470], [285, 548], [268, 553], [214, 579], [195, 588], [0, 588]];
  const RSL_LOW = [[1200, 364], [1200, 618], [1028, 620], [990, 612], [957, 600], [950, 470], [880, 470], [880, 380]];
  const MID = [[610, 375], [600, 700], [586, 840], [578, 900], [572, 960], [568, 1000], [564, 1100], [560, 1200]];
  const TRIM = [[214, 579], [210, 625], [206, 690], [211, 750], [226, 810], [249, 870], [275, 930], [305, 980], [340, 1018], [385, 1046], [432, 1060], [472, 1058], [520, 1050], [564, 1100]];
  const rev = a => a.slice().reverse();
  const POLY = {
    band: [[0, 0], [1200, 0], ...rev(BAND_CUT)],
    lsl: [...BAND_CUT.slice(0, 8), ...LSL_LOW.slice(1)],
    rsl: [...BAND_CUT.slice(9), ...RSL_LOW.slice(1, -1)],
    shell: [[0, 588], [195, 588], ...TRIM, [560, 1200], [0, 1200]],
    cush: [[214, 579], [268, 553], [285, 548], [292, 470], [300, 448], [345, 440], [345, 386], ...MID.slice(0, 7), ...rev(TRIM).slice(1, -1)],
    rcup: [[610, 375], [880, 380], [880, 470], [950, 470], [957, 600], [990, 612], [1028, 620], [1200, 618], [1200, 1200], [560, 1200], ...rev(MID).slice(2)]
  };
  // Engrosa cada recorte 3 px: las capas se solapan sobre píxeles idénticos y no quedan rendijas.
  const dilate = (poly, d) => {
    let area = 0;
    poly.forEach((a, i) => { const b = poly[(i + 1) % poly.length]; area += a[0] * b[1] - b[0] * a[1]; });
    const s = area > 0 ? 1 : -1;
    const nrm = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [s * dy / l, -s * dx / l]; };
    return poly.map((c, i) => {
      const a = poly[(i - 1 + poly.length) % poly.length], b = poly[(i + 1) % poly.length];
      const n1 = nrm(a, c), n2 = nrm(c, b);
      let mx = n1[0] + n2[0], my = n1[1] + n2[1];
      const ml = Math.hypot(mx, my) || 1; mx /= ml; my /= ml;
      const k = d / Math.max(0.35, mx * n1[0] + my * n1[1]);
      return [c[0] + mx * k, c[1] + my * k];
    });
  };
  const clip = poly => `polygon(${poly.map(([x, y]) => `${(x / 12).toFixed(3)}% ${(y / 12).toFixed(3)}%`).join(',')})`;

  // Piezas: posición explotada (unidades de la foto), giro propio y ventana de ensamblaje.
  // Orden de atrás hacia adelante igual que en la foto: diadema, deslizador izq., copa izq., copa der., deslizador der.
  const PARTS = [
    { k: 'band', ex: [0, -235, -90], rz: -2.5, ry: -4, t: [0.305, 0.36] },
    { k: 'lsl', ex: [-165, -100, 60], rz: -7, ry: 6, t: [0.285, 0.335] },
    { k: 'shell', ex: [-345, 25, -170], rz: -3, ry: -8, t: [0.21, 0.27] },
    { k: 'cush', ex: [80, 125, 250], rz: 4, ry: 10, t: [0.245, 0.3] },
    { k: 'rcup', ex: [310, 80, -80], rz: 5, ry: -9, t: [0.26, 0.315] },
    { k: 'rsl', ex: [180, -85, 50], rz: 7, ry: -6, t: [0.29, 0.34] }
  ];
  const DRV = { c: [405, 790], d: 300, ex: [-175, 50, 45], z: -8, t: [0.225, 0.285] };
  const HAND = 0.37;  // a partir de aquí se ve la foto completa (idéntica a las piezas armadas)
  const FLASHES = [
    { at: 0.3, pt: [395, 815] },
    { at: 0.335, pt: [232, 575] },
    { at: 0.34, pt: [992, 612] },
    { at: 0.36, pt: [278, 378] },
    { at: 0.36, pt: [968, 372] }
  ];
  const LABELS = [
    { n: '01', t: 'diadema', part: 0, pt: [835, 175], side: 1, pos: [0.37, -0.41] },
    { n: '02', t: 'deslizadores', part: 1, pt: [246, 470], side: -1, pos: [-0.4, -0.19] },
    { n: '03', t: 'driver de 40 mm', part: 'drv', pt: [405, 790], side: -1, pos: [-0.43, 0.2] },
    { n: '04', t: 'almohadillas', part: 3, pt: [505, 985], side: 1, pos: [0.4, 0.29] }
  ];
  const FINISHES = [['lavanda', '#b9a3ee'], ['grafito', '#4a4a52'], ['lima', '#c9de84']];

  const CSS = `
.sc-wav{position:absolute;inset:0;overflow:hidden;background:#07080a;color:#f2f4ef;font-family:var(--font,Archivo,system-ui,sans-serif);font-style:normal;container-type:size;user-select:none;-webkit-user-select:none;pointer-events:none}
.sc-wav *{box-sizing:border-box;font-style:normal;transition:none}
.sc-wav-bg{position:absolute;inset:0;background:radial-gradient(70% 80% at 50% 26%,#16151f 0%,#0b0b10 52%,#07080a 100%)}
.sc-wav-floor{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(180deg,rgba(5,6,8,0) 0%,rgba(16,17,22,.9) 14%,#0b0c10 40%,#050608 100%)}
.sc-wav-vig{position:absolute;inset:0;background:radial-gradient(120% 95% at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%)}
.sc-wav-glow,.sc-wav-pool,.sc-wav-shadow{position:absolute;left:0;top:0;border-radius:50%;will-change:transform,opacity}
.sc-wav-glow--v{background:radial-gradient(closest-side,rgba(169,139,255,.46),rgba(122,92,240,.17) 52%,rgba(122,92,240,0))}
.sc-wav-glow--l{background:radial-gradient(closest-side,rgba(198,238,106,.08),rgba(198,238,106,.025) 50%,rgba(198,238,106,0))}
.sc-wav-pool{background:radial-gradient(closest-side,rgba(205,195,255,.13),rgba(150,130,255,.05) 55%,rgba(205,195,255,0))}
.sc-wav-shadow{background:radial-gradient(closest-side,rgba(0,0,0,.9),rgba(0,0,0,.55) 42%,rgba(0,0,0,0))}
.sc-wav-cam{position:absolute;inset:0}
.sc-wav-rig{position:absolute;transform-style:preserve-3d}
.sc-wav-part,.sc-wav-flat img{position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;display:block;-webkit-user-drag:none}
.sc-wav-cav{position:absolute;inset:0;background:radial-gradient(9% 13% at 34% 66%,#3a3b42,rgba(58,59,66,0)),repeating-radial-gradient(circle at 34% 66%,rgba(255,255,255,.035) 0 .35%,rgba(255,255,255,0) .35% 1.1%),radial-gradient(28% 38% at 36% 66%,#24252b,#0e0f12 62%,#050506);-webkit-mask-size:100% 100%;mask-size:100% 100%}
.sc-wav-drv{position:absolute;transform-style:preserve-3d;will-change:transform}
.sc-wav-drv>span{position:absolute;inset:0;border-radius:50%;backface-visibility:visible}
.sc-wav-d-mag{inset:21%!important;background:radial-gradient(circle at 42% 36%,#6b6e76,#2a2b30 46%,#0d0d10 72%);transform:translateZ(calc(var(--d) * -.17))}
.sc-wav-d-mag2{inset:23%!important;background:#1c1d21;box-shadow:inset 0 0 0 2px #3a3c42;transform:translateZ(calc(var(--d) * -.11))}
.sc-wav-d-mag3{inset:25%!important;background:#141518;transform:translateZ(calc(var(--d) * -.06))}
.sc-wav-d-frame{background:conic-gradient(from 25deg,#8d9098,#f1f2f5 10%,#6f727a 24%,#cfd2d8 38%,#5b5e65 52%,#eceef2 66%,#767980 82%,#8d9098);-webkit-mask:radial-gradient(closest-side,transparent 85%,#000 86.5%);mask:radial-gradient(closest-side,transparent 85%,#000 86.5%);transform:translateZ(calc(var(--d) * -.015))}
.sc-wav-d-cone{inset:6.5%!important;background:repeating-radial-gradient(closest-side,rgba(255,255,255,.05) 0 1.4%,rgba(255,255,255,0) 1.4% 4.5%),radial-gradient(closest-side,#33343a 0%,#1b1c20 38%,#0f1013 72%,#3a3b42 84%,#101013 90%,#2d2e33 96%,#0b0b0d 100%);transform:translateZ(calc(var(--d) * .01))}
.sc-wav-d-shine{inset:6.5%!important;background:linear-gradient(135deg,rgba(255,255,255,.26),rgba(255,255,255,0) 42%,rgba(255,255,255,0) 70%,rgba(169,139,255,.18));transform:translateZ(calc(var(--d) * .012))}
.sc-wav-d-ring{inset:29%!important;border:2px solid #c6ee6a;box-shadow:0 0 14px rgba(198,238,106,.55),inset 0 0 10px rgba(198,238,106,.35);transform:translateZ(calc(var(--d) * .04))}
.sc-wav-d-cap{inset:34%!important;background:radial-gradient(circle at 36% 30%,#fff,#d4d6db 22%,#8a8d94 55%,#3b3d42 100%);box-shadow:0 0 0 1px rgba(0,0,0,.45);transform:translateZ(calc(var(--d) * .06))}
.sc-wav-flashes{position:absolute;inset:0}
.sc-wav-flash{position:absolute;left:0;top:0;width:0;height:0;will-change:transform,opacity}
.sc-wav-flash::before{content:'';position:absolute;left:-30px;top:-30px;width:60px;height:60px;border-radius:50%;border:2px solid #c6ee6a;box-shadow:0 0 18px rgba(198,238,106,.8),inset 0 0 14px rgba(198,238,106,.5)}
.sc-wav-flash::after{content:'';position:absolute;left:-7px;top:-7px;width:14px;height:14px;border-radius:50%;background:#efffc4;box-shadow:0 0 16px 6px rgba(198,238,106,.75)}
.sc-wav-flat,.sc-wav-refl{position:absolute;will-change:transform,opacity}
.sc-wav-refl{-webkit-mask-image:linear-gradient(to top,rgba(0,0,0,0) 4%,rgba(0,0,0,.42) 7%,rgba(0,0,0,.14) 22%,rgba(0,0,0,0) 42%);mask-image:linear-gradient(to top,rgba(0,0,0,0) 4%,rgba(0,0,0,.42) 7%,rgba(0,0,0,.14) 22%,rgba(0,0,0,0) 42%)}
.sc-wav-refl>div{position:absolute;inset:0;background-size:100% 100%;background-repeat:no-repeat}
.sc-wav-sheen{position:absolute;inset:0;overflow:hidden;-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
.sc-wav-sheen>span{position:absolute;top:-15%;bottom:-15%;left:0;width:30%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.08) 30%,rgba(255,255,255,.5) 50%,rgba(255,255,255,.08) 70%,rgba(255,255,255,0));will-change:transform}
.sc-wav-waves{position:absolute;inset:0}
.sc-wav-ring{position:absolute;left:0;top:0;border-radius:50%;border:1.5px solid #c6ee6a;box-shadow:0 0 12px rgba(198,238,106,.35),inset 0 0 12px rgba(198,238,106,.18);will-change:transform,opacity}
.sc-wav-ring.is-l{-webkit-mask-image:linear-gradient(90deg,#000 22%,rgba(0,0,0,0) 46%);mask-image:linear-gradient(90deg,#000 22%,rgba(0,0,0,0) 46%)}
.sc-wav-ring.is-r{-webkit-mask-image:linear-gradient(270deg,#000 22%,rgba(0,0,0,0) 46%);mask-image:linear-gradient(270deg,#000 22%,rgba(0,0,0,0) 46%)}
.sc-wav-ring.is-v{border-color:#a98bff;box-shadow:0 0 12px rgba(169,139,255,.4),inset 0 0 12px rgba(169,139,255,.2)}
.sc-wav-bagwrap{position:absolute;inset:0;will-change:opacity}
.sc-wav-bag3d{position:absolute;transform-style:preserve-3d;transform-origin:50% 100%;will-change:transform}
.sc-wav-bf{position:absolute;left:0;top:0;width:100%;height:100%}
.sc-wav-bf--front{background:linear-gradient(162deg,#272930 0%,#17191d 36%,#0d0e11 78%,#0a0b0d 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),inset 1px 0 0 rgba(255,255,255,.05),inset 0 -24px 34px rgba(0,0,0,.4);-webkit-box-reflect:below 0 linear-gradient(to bottom,rgba(255,255,255,.16),rgba(255,255,255,0) 38%);display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.sc-wav-bf--front::before{content:'';position:absolute;left:0;right:0;top:0;height:11%;background:linear-gradient(180deg,#2c2f36,#1a1c21);border-bottom:2px solid #c6ee6a;box-shadow:0 1px 8px rgba(198,238,106,.25)}
.sc-wav-bf--front::after{content:'';position:absolute;inset:0;background:linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.06) 48%,rgba(255,255,255,0) 60%)}
.sc-wav-bf--front b{position:relative;display:block;font-weight:850;font-stretch:115%;letter-spacing:-.065em;line-height:1;color:#f2f4ef;margin-top:6%}
.sc-wav-bf--front b span{color:#c6ee6a}
.sc-wav-bf--front small{position:relative;display:block;margin-top:.7em;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:rgba(242,244,239,.5)}
.sc-wav-bf--side{background:linear-gradient(90deg,#0b0c0f,#16181d 44%,#07080a 50%,#121418 56%,#0a0b0e);box-shadow:inset 0 1px 0 rgba(255,255,255,.1);-webkit-box-reflect:below 0 linear-gradient(to bottom,rgba(255,255,255,.12),rgba(255,255,255,0) 38%)}
.sc-wav-bf--back{background:linear-gradient(180deg,#1a1c21 0%,#0b0c0e 30%,#050506 100%)}
.sc-wav-bagfloor{position:absolute;background:radial-gradient(closest-side,rgba(0,0,0,.92),rgba(0,0,0,.5) 50%,rgba(0,0,0,0))}
.sc-wav-bf--lin{background:linear-gradient(90deg,#060708,#121318)}
.sc-wav-handle{position:absolute;overflow:visible}
.sc-wav-grom{position:absolute;width:7px;height:7px;margin:-3.5px 0 0 -3.5px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f4f5f7,#80838a);box-shadow:0 0 0 1.5px #0a0a0c}
.sc-wav-lines{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.sc-wav-lab{position:absolute;left:0;top:0;width:0;height:0;will-change:transform,opacity}
.sc-wav-lab>div{position:absolute;top:0;transform:translateY(-50%);white-space:nowrap;font-size:clamp(10.5px,3.1cqh,15px);line-height:1.15;font-weight:650;letter-spacing:-.01em;color:#f2f4ef;text-shadow:0 1px 10px rgba(0,0,0,.8)}
.sc-wav-lab>div b{display:block;font-size:.78em;font-weight:800;letter-spacing:.08em;color:#c6ee6a;margin-bottom:.2em}
.sc-wav-lab.is-r>div{right:0;text-align:right}
.sc-wav-brand{position:absolute;left:clamp(12px,3.4cqw,26px);top:clamp(10px,4.5cqh,24px);line-height:1}
.sc-wav-brand b{display:block;font-size:clamp(18px,6.2cqh,30px);font-weight:850;font-stretch:115%;letter-spacing:-.065em;color:#f2f4ef}
.sc-wav-brand b span{color:#c6ee6a}
.sc-wav-brand small{display:block;margin-top:.35em;font-size:clamp(9.5px,2.5cqh,12.5px);font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:rgba(242,244,239,.5)}
.sc-wav-chips{position:absolute;left:50%;bottom:clamp(10px,4.4cqh,26px);display:flex;gap:clamp(6px,1.4cqw,14px);will-change:transform,opacity}
.sc-wav-chip{display:flex;align-items:center;gap:7px;padding:5px 11px 5px 6px;border-radius:99px;border:1px solid rgba(255,255,255,.12);background:rgba(16,17,21,.72);font-size:clamp(10.5px,2.8cqh,14px);font-weight:650;color:rgba(242,244,239,.55);white-space:nowrap}
.sc-wav-chip span{width:clamp(12px,3.4cqh,17px);height:clamp(12px,3.4cqh,17px);border-radius:50%;box-shadow:inset 0 -2px 4px rgba(0,0,0,.35),inset 0 2px 3px rgba(255,255,255,.35)}
.sc-wav-chip.is-on{border-color:#c6ee6a;color:#f2f4ef;background:rgba(198,238,106,.1)}
.sc-wav-eq{position:absolute;left:50%;display:flex;align-items:flex-end;will-change:opacity}
.sc-wav-eq span{flex:1;height:100%;margin:0 1px;border-radius:3px;background:linear-gradient(0deg,rgba(198,238,106,.15),#c6ee6a 70%,#efffc4);transform-origin:50% 100%;will-change:transform}
.sc-wav-spec{position:absolute;right:clamp(12px,3.4cqw,26px);top:clamp(14px,5.4cqh,30px);white-space:nowrap;font-size:clamp(9.5px,2.5cqh,12.5px);font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(242,244,239,.55);will-change:opacity}
.sc-wav.is-narrow .sc-wav-spec{display:none}
.sc-wav-badge{position:absolute;left:0;top:0;display:grid;place-items:center;border-radius:50%;background:#c6ee6a;color:#0a0b0d;font-weight:850;letter-spacing:-.03em;box-shadow:0 0 0 4px rgba(198,238,106,.18),0 8px 22px rgba(0,0,0,.5),0 0 28px rgba(198,238,106,.45);will-change:transform}
.sc-wav-card{position:absolute;left:0;top:0;padding:clamp(10px,3cqh,18px) clamp(12px,3.4cqh,20px);border-radius:clamp(12px,3.4cqh,18px);background:linear-gradient(160deg,rgba(32,34,40,.94),rgba(15,16,20,.94));border:1px solid rgba(255,255,255,.13);box-shadow:0 18px 40px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);will-change:transform,opacity}
.sc-wav-card p{margin:0;display:flex;align-items:center;gap:.5em;white-space:nowrap}
.sc-wav-card .c1{font-size:clamp(11px,3cqh,15px);font-weight:700;color:#f2f4ef}
.sc-wav-card .c1 span{width:.95em;height:.95em;border-radius:50%;background:#c9de84;box-shadow:inset 0 -2px 3px rgba(0,0,0,.3),0 0 0 2px rgba(255,255,255,.18)}
.sc-wav-card .c2{margin-top:.25em;font-size:clamp(17px,5.6cqh,28px);font-weight:850;font-stretch:110%;letter-spacing:-.035em;color:#f2f4ef}
.sc-wav-card .c3{margin-top:.45em;font-size:clamp(10.5px,2.9cqh,14px);font-weight:700;color:#c6ee6a}
.sc-wav-card .c3 svg{width:1.2em;height:1.2em;flex:none}
`;

  function injectCSS() {
    if (document.getElementById('sc-wav-css')) return;
    const st = document.createElement('style');
    st.id = 'sc-wav-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function mount(stage) {
    injectCSS();
    const root = document.createElement('div');
    root.className = 'sc-wav';
    root.setAttribute('aria-hidden', 'true');
    const img = (src, cls, extra = '') => `<img class="${cls}" src="${src}" alt="" decoding="async" draggable="false" ${extra}>`;
    const partHTML = k => img(IMG.lav, 'sc-wav-part', `data-part="${k}" style="clip-path:${clip(dilate(POLY[k], 3))}"`);
    const rope = `<path d="M0,100 C0,8 100,8 100,100" fill="none" stroke="#1a1b1f" vector-effect="non-scaling-stroke"/><path d="M0,100 C0,8 100,8 100,100" fill="none" stroke="#9da0a8" vector-effect="non-scaling-stroke"/><path d="M0,100 C0,8 100,8 100,100" fill="none" stroke="#e4e6ea" stroke-opacity=".85" stroke-linecap="round" vector-effect="non-scaling-stroke" transform="translate(-0.6 -0.8)"/>`;
    root.innerHTML = `
      <div class="sc-wav-bg"></div>
      <div class="sc-wav-glow sc-wav-glow--v"></div>
      <div class="sc-wav-glow sc-wav-glow--l"></div>
      <div class="sc-wav-floor"></div>
      <div class="sc-wav-pool"></div>
      <div class="sc-wav-shadow" data-sh="p"></div>
      <div class="sc-wav-refl">${['lav', 'gra', 'lim'].map(k => `<div style="background-image:url('${IMG[k]}')"></div>`).join('')}</div>
      <div class="sc-wav-waves">${Array.from({ length: 8 }, (_, i) => `<div class="sc-wav-ring ${i < 4 ? 'is-l' : 'is-r'}${i % 2 ? ' is-v' : ''}"></div>`).join('')}</div>
      <div class="sc-wav-bagwrap" data-bag="back"><div class="sc-wav-bag3d">
        <div class="sc-wav-bagfloor"></div>
        <div class="sc-wav-bf sc-wav-bf--back"></div>
        <div class="sc-wav-bf sc-wav-bf--lin"></div>
        <svg class="sc-wav-handle" data-h="back" viewBox="0 0 100 100" preserveAspectRatio="none">${rope}</svg>
      </div></div>
      <div class="sc-wav-cam"><div class="sc-wav-rig">
        ${partHTML('band')}
        ${partHTML('lsl')}
        <div class="sc-wav-cav" style="clip-path:${clip(POLY.cush)};-webkit-mask-image:url('${IMG.lav}');mask-image:url('${IMG.lav}')"></div>
        ${partHTML('shell')}
        <div class="sc-wav-drv">
          <span class="sc-wav-d-mag"></span><span class="sc-wav-d-mag2"></span><span class="sc-wav-d-mag3"></span>
          <span class="sc-wav-d-frame"></span><span class="sc-wav-d-cone"></span><span class="sc-wav-d-shine"></span>
          <span class="sc-wav-d-ring"></span><span class="sc-wav-d-cap"></span>
        </div>
        ${partHTML('cush')}
        ${partHTML('rcup')}
        ${partHTML('rsl')}
      </div></div>
      <div class="sc-wav-flat">
        ${img(IMG.lav, '')}${img(IMG.gra, '')}${img(IMG.lim, '')}
        <div class="sc-wav-sheen" style="-webkit-mask-image:url('${IMG.lim}');mask-image:url('${IMG.lim}')"><span></span></div>
      </div>
      <div class="sc-wav-flashes">${FLASHES.map(() => '<div class="sc-wav-flash"></div>').join('')}</div>
      <div class="sc-wav-bagwrap" data-bag="front"><div class="sc-wav-bag3d">
        <div class="sc-wav-bf sc-wav-bf--side"></div>
        <div class="sc-wav-bf sc-wav-bf--front"><b>wav<span>.</span></b><small>Wave One</small></div>
        <span class="sc-wav-grom"></span><span class="sc-wav-grom"></span>
        <svg class="sc-wav-handle" data-h="front" viewBox="0 0 100 100" preserveAspectRatio="none">${rope}</svg>
      </div></div>
      <svg class="sc-wav-lines">${LABELS.map(() => '<g><path fill="none" stroke="rgba(242,244,239,.55)" stroke-width="1" pathLength="1" stroke-dasharray="1 1"/><circle r="7" fill="rgba(198,238,106,.18)"/><circle r="3.2" fill="#c6ee6a"/></g>').join('')}</svg>
      ${LABELS.map(l => `<div class="sc-wav-lab${l.side < 0 ? ' is-r' : ''}"><div><b>${l.n}</b>${l.t}</div></div>`).join('')}
      <div class="sc-wav-brand"><b>wav<span>.</span></b><small>Wave One</small></div>
      <div class="sc-wav-chips">${FINISHES.map(([n, c]) => `<div class="sc-wav-chip"><span style="background:${c}"></span>${n}</div>`).join('')}</div>
      <div class="sc-wav-eq">${Array.from({ length: 38 }, () => '<span></span>').join('')}</div>
      <div class="sc-wav-spec">driver de 40 mm · audio espacial</div>
      <div class="sc-wav-badge">+1</div>
      <div class="sc-wav-card">
        <p class="c1"><span></span>Wave One lima</p>
        <p class="c2">$ 349.900</p>
        <p class="c3"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="rgba(198,238,106,.16)"/><path d="M5.8 10.4l2.7 2.7 5.7-6" fill="none" stroke="#c6ee6a" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>En tu bolsa</p>
      </div>`;
    stage.appendChild(root);

    const $ = s => root.querySelector(s);
    const $$ = s => [...root.querySelectorAll(s)];
    const el = {
      glowV: $('.sc-wav-glow--v'), glowL: $('.sc-wav-glow--l'), floor: $('.sc-wav-floor'), pool: $('.sc-wav-pool'),
      shP: $('[data-sh="p"]'),
      refl: $('.sc-wav-refl'), reflF: $$('.sc-wav-refl>div'),
      rings: $$('.sc-wav-ring'),
      bagBack: $('[data-bag="back"]'), bagFront: $('[data-bag="front"]'), bag3d: $$('.sc-wav-bag3d'),
      cam: $('.sc-wav-cam'), rig: $('.sc-wav-rig'), parts: PARTS.map(o => $(`[data-part="${o.k}"]`)),
      cav: $('.sc-wav-cav'), drv: $('.sc-wav-drv'), flashes: $$('.sc-wav-flash'),
      flat: $('.sc-wav-flat'), flashLayer: $('.sc-wav-flashes'), flatImgs: $$('.sc-wav-flat>img'), sheen: $('.sc-wav-sheen'), sheenBand: $('.sc-wav-sheen>span'),
      lines: $('.sc-wav-lines'), lineG: $$('.sc-wav-lines>g'), labs: $$('.sc-wav-lab'),
      chips: $('.sc-wav-chips'), chipEls: $$('.sc-wav-chip'), eq: $('.sc-wav-eq'), bars: $$('.sc-wav-eq>span'), spec: $('.sc-wav-spec'),
      badge: $('.sc-wav-badge'), card: $('.sc-wav-card'), brand: $('.sc-wav-brand')
    };
    const css = (node, styles) => { for (const k in styles) node.style[k] = styles[k]; };
    const px = v => `${v.toFixed(2)}px`;

    // ---------- Medidas (solo al cambiar de tamaño; render solo toca transform y opacity) ----------
    let L = null;
    let lastP = 0;
    function layout() {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return false;
      const narrow = W / H < 1.6;
      const S = Math.min(H * 0.8, W * 0.6);
      const u = S / 1200;
      const cx = W / 2;
      const Fy = H * (narrow ? 0.87 : 0.885);
      const by = Fy - S, bx = cx - S / 2, cy = by + S / 2;
      const P = S * 2.6;
      // bolsa + tarjeta del paso final
      const Wb = S * 0.5, Hb = S * 0.4, Db = S * 0.18;
      const cardW = clamp(S * 0.56, narrow ? 128 : 150, 250);
      const gap = Math.max(14, S * 0.08);
      const groupW = Wb + Db * 0.75 + gap + cardW;
      const gx = Math.max(10, (W - groupW) / 2);
      const bagCx = gx + Wb / 2 + (narrow ? 0 : S * 0.05);
      const bagTop = Fy - Hb - S * 0.05;
      root.classList.toggle('is-narrow', narrow);
      L = { W, H, S, u, cx, cy, bx, by, Fy, P, narrow, Wb, Hb, Db, bagCx, bagTop, xp: narrow ? 0.7 : 1 };

      css(el.floor, { top: px(Fy - S * 0.34) });
      css(el.glowV, { width: px(S * 1.5), height: px(S * 1.25) });
      css(el.glowL, { width: px(S * 1.0), height: px(S * 0.75) });
      css(el.pool, { width: px(S * 1.7), height: px(S * 0.34), left: px(cx - S * 0.85), top: px(Fy - S * 0.21) });
      css(el.shP, { width: px(S * 0.86), height: px(S * 0.085) });
      css($('.sc-wav-bagfloor'), { left: px(-Wb * 0.32), width: px(Wb * 1.64), top: px(Hb - Db * 1.3), height: px(Db * 2.6), transform: `rotateX(90deg) translateZ(${px(-0.5)})` });
      css(el.rig, { left: px(bx), top: px(by), width: px(S), height: px(S) });
      css(el.cam, { perspective: px(P), perspectiveOrigin: `${px(cx)} ${px(cy)}` });
      css(el.flat, { left: px(bx), top: px(by), width: px(S), height: px(S) });
      css(el.refl, { left: px(bx), top: px(by), width: px(S), height: px(S) });
      const D = DRV.d * u;
      css(el.drv, { width: px(D), height: px(D), left: px((DRV.c[0] - DRV.d / 2) * u), top: px((DRV.c[1] - DRV.d / 2) * u) });
      el.drv.style.setProperty('--d', px(D));
      const ringW = S * 0.4, ringH = S * 0.5;
      el.rings.forEach(r => css(r, { width: px(ringW), height: px(ringH) }));

      // Bolsa
      const pb = S * 2.4;
      [el.bagBack, el.bagFront].forEach(w => css(w, { perspective: px(pb), perspectiveOrigin: `${px(cx)} ${px(Fy - S * 0.95)}` }));
      el.bag3d.forEach(b => css(b, { left: px(bagCx - Wb / 2), top: px(bagTop), width: px(Wb), height: px(Hb) }));
      css($('.sc-wav-bf--front'), { transform: `translateZ(${px(Db / 2)})` });
      css($('.sc-wav-bf--back'), { transform: `translateZ(${px(-Db / 2)})` });
      css($('.sc-wav-bf--side'), { left: px((Wb - Db) / 2), width: px(Db), transform: `rotateY(90deg) translateZ(${px(Wb / 2)})` });
      css($('.sc-wav-bf--lin'), { left: px((Wb - Db) / 2), width: px(Db), transform: `rotateY(90deg) translateZ(${px(-Wb / 2)})` });
      const front = $('.sc-wav-bf--front');
      css(front.querySelector('b'), { fontSize: px(Wb * 0.27) });
      css(front.querySelector('small'), { fontSize: px(Math.max(7, Wb * 0.045)) });
      const hW = Wb * 0.46, hH = Hb * 0.46;
      const ropeW = Math.max(2.2, S * 0.011);
      $$('.sc-wav-handle').forEach(h => {
        const isFront = h.dataset.h === 'front';
        css(h, { left: px((Wb - hW) / 2), top: px(-hH + Hb * 0.13), width: px(hW), height: px(hH), transform: `translateZ(${px((isFront ? 1 : -1) * Db / 2 + (isFront ? 1 : 1))})` });
        const ps = h.querySelectorAll('path');
        ps[0].setAttribute('stroke-width', (ropeW * 1.35).toFixed(2));
        ps[1].setAttribute('stroke-width', ropeW.toFixed(2));
        ps[2].setAttribute('stroke-width', (ropeW * 0.3).toFixed(2));
      });
      $$('.sc-wav-grom').forEach((g, i) => css(g, { left: px((Wb - hW) / 2 + (i ? hW : 0)), top: px(Hb * 0.13), transform: `translateZ(${px(Db / 2 + 1.5)})` }));
      const bs = clamp(S * 0.1, 30, 52);
      css(el.badge, { width: px(bs), height: px(bs), fontSize: px(bs * 0.4), left: px(bagCx + Wb / 2 + Db * 0.45 - bs / 2), top: px(bagTop - Hb * 0.08 - bs / 2) });
      css(el.card, { left: px(gx + Wb + Db * 0.75 + gap + (narrow ? 0 : S * 0.05)), minWidth: px(cardW) });
      const cardH = el.card.offsetHeight || S * 0.3;
      css(el.card, { top: px(Math.min(Fy - cardH - S * 0.02, bagTop + Hb * 0.5 - cardH / 2 - S * 0.06)) });

      // Rótulos de la vista explotada
      el.lines.setAttribute('viewBox', `0 0 ${W} ${H}`);
      L.labs = LABELS.map((l, i) => {
        const node = el.labs[i];
        const inner = node.firstElementChild;
        const w = inner.offsetWidth;
        let x = cx + l.pos[0] * S * (narrow ? 0.92 : 1.5);
        const y = cy + l.pos[1] * S;
        if (l.side > 0) x = Math.min(x, W - w - 10); else x = Math.max(x, w + 10);
        css(node, { left: px(x), top: px(y) });
        return { x, y };
      });

      // Ecualizador y selector
      const eqW = Math.min(W * 0.8, S * 0.8), eqH = S * 0.08;
      css(el.eq, { width: px(eqW), height: px(eqH), marginLeft: px(-eqW / 2), top: px(Math.min(H - eqH - H * 0.04, Fy + S * 0.02)) });
      return true;
    }

    // Proyección de un punto de una pieza (coordenadas de la foto) a la pantalla, igual que el motor 3D de CSS.
    function project(pt, st, rigT) {
      const { u, cx, cy, P } = L;
      let x = (pt[0] - 600) * u, y = (pt[1] - 600) * u, z = (st.zLocal || 0) * u;
      // pieza: translate3d → rotateY → rotateZ (se aplican de derecha a izquierda)
      let c = Math.cos(rad(st.rz)), s = Math.sin(rad(st.rz));
      [x, y] = [x * c - y * s, x * s + y * c];
      c = Math.cos(rad(st.ry)); s = Math.sin(rad(st.ry));
      [x, z] = [x * c + z * s, -x * s + z * c];
      x += st.x * u; y += st.y * u; z += st.z * u;
      // cámara: translate → scale3d → rotateX → rotateY
      c = Math.cos(rad(rigT.ay)); s = Math.sin(rad(rigT.ay));
      [x, z] = [x * c + z * s, -x * s + z * c];
      c = Math.cos(rad(rigT.ax)); s = Math.sin(rad(rigT.ax));
      [y, z] = [y * c - z * s, y * s + z * c];
      x *= rigT.sc; y *= rigT.sc; z *= rigT.sc;
      x += rigT.tx; y += rigT.ty;
      const k = P / (P - z);
      return [cx + x * k, cy + y * k];
    }

    const show = (node, on) => { node.style.visibility = on ? '' : 'hidden'; };

    function render(p) {
      lastP = p;
      if (!L && !layout()) return;
      const { S, u, cx, cy, Fy } = L;

      // ======== 1-2. Vista explotada y ensamblaje (escena 3D) ========
      const orbit = easeInOut(seg(p, 0, 0.2));
      const asm = easeInOut(seg(p, 0.2, HAND));
      const rigOn = p < HAND;
      const rigT = {
        ay: lerp(lerp(-15, 13, orbit), 0, asm),
        ax: lerp(-7 - 3 * Math.sin(orbit * Math.PI), 0, asm),
        sc: lerp(lerp(0.75, 0.8, orbit) * (L.narrow ? 0.94 : 1), 1, asm),
        tx: 0,
        ty: lerp(-0.01 * S, 0, asm)
      };
      show(el.cam, rigOn);
      const states = [];
      if (rigOn) {
        el.rig.style.transform = `translate3d(${f2(rigT.tx)}px,${f2(rigT.ty)}px,0) scale3d(${f3(rigT.sc)},${f3(rigT.sc)},${f3(rigT.sc)}) rotateX(${f2(rigT.ax)}deg) rotateY(${f2(rigT.ay)}deg)`;
        PARTS.forEach((o, i) => {
          const e = easeBack(seg(p, o.t[0], o.t[1]), 1.35);
          const k = (1 - e) * L.xp;
          const bob = Math.sin(p * 40 + i * 1.9) * 9 * (1 - seg(p, o.t[0] - 0.03, o.t[0]));
          const st = { x: o.ex[0] * k, y: o.ex[1] * k + bob, z: o.ex[2] * k + i * 0.4 / u * 0, ry: o.ry * k, rz: o.rz * k };
          st.zPx = st.z * u + i * 0.35 * clamp(Math.abs(k) * 10);
          states.push(st);
          const tr = `translate3d(${f2(st.x * u)}px,${f2(st.y * u)}px,${f2(st.zPx)}px) rotateY(${f2(st.ry)}deg) rotateZ(${f2(st.rz)}deg)`;
          el.parts[i].style.transform = tr;
          if (o.k === 'shell') el.cav.style.transform = `translate3d(${f2(st.x * u)}px,${f2(st.y * u)}px,${f2(st.zPx - 1.2)}px) rotateY(${f2(st.ry)}deg) rotateZ(${f2(st.rz)}deg)`;
        });
        // Driver: flota entre la carcasa y la almohadilla, luego entra en la copa.
        const de = easeBack(seg(p, DRV.t[0], DRV.t[1]), 1.2);
        const dk = (1 - de) * L.xp;
        const dbob = Math.sin(p * 40 + 7) * 9 * (1 - seg(p, DRV.t[0] - 0.03, DRV.t[0]));
        const shell = states[2];
        const ds = {
          x: lerp(shell.x, DRV.ex[0] * L.xp, 1 - de), y: lerp(shell.y, DRV.ex[1] * L.xp, 1 - de) + dbob, z: lerp(shell.z, DRV.ex[2] * L.xp, 1 - de) + DRV.z * de,
          spin: 70 * dk
        };
        states.drv = ds;
        el.drv.style.transform = `translate3d(${f2(ds.x * u)}px,${f2(ds.y * u)}px,${f2(ds.z * u + 0.8)}px) rotateZ(-20deg) rotateY(38deg) rotateZ(${f2(ds.spin)}deg)`;
        show(el.drv, p < 0.31);
      }
      // Destellos de encaje (capa 2D encima; siguen a la cámara mientras dura la escena 3D)
      const still0 = { x: 0, y: 0, z: 0, ry: 0, rz: 0 };
      FLASHES.forEach((f, i) => {
        const k = seg(p, f.at - 0.004, f.at + 0.03);
        const on = k > 0 && k < 1;
        el.flashes[i].style.opacity = on ? f3(Math.pow(1 - k, 1.4)) : '0';
        if (!on) return;
        const a = rigOn ? project(f.pt, still0, rigT) : [L.bx + f.pt[0] * u, L.by + f.pt[1] * u];
        el.flashes[i].style.transform = `translate(${f2(a[0])}px,${f2(a[1])}px) scale(${f3(lerp(0.25, 1.6, easeOut(k)) * S / 600)})`;
      });

      // Rótulos con líneas que siguen a las piezas
      const lblOut = 1 - seg(p, 0.18, 0.21);
      const lblOn = rigOn && lblOut > 0.001;
      show(el.lines, lblOn);
      LABELS.forEach((l, i) => {
        const node = el.labs[i];
        const k = seg(p, 0.02 + i * 0.016, 0.07 + i * 0.016);
        node.style.opacity = lblOn ? f3(easeOut(seg(k, 0.45, 1)) * lblOut) : '0';
        if (!lblOn) return;
        const st = l.part === 'drv' ? { ...states.drv, ry: 0, rz: 0 } : states[l.part];
        const st2 = l.part === 'drv' ? { x: st.x, y: st.y, z: st.z + 12, ry: 0, rz: 0 } : { ...st, z: st.zPx / u };
        const a = project(l.pt, st2, rigT);
        const b = L.labs[i];
        const ex = b.x - l.side * 12, elx = b.x - l.side * (S * 0.07);
        const g = el.lineG[i];
        g.children[0].setAttribute('d', `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${elx.toFixed(1)},${b.y.toFixed(1)}L${ex.toFixed(1)},${b.y.toFixed(1)}`);
        g.children[0].setAttribute('stroke-dashoffset', f3(1 - easeOut(k)));
        g.style.opacity = f3(lblOut * easeOut(seg(k, 0, 0.25)));
        g.children[1].setAttribute('cx', a[0].toFixed(1)); g.children[1].setAttribute('cy', a[1].toFixed(1));
        g.children[2].setAttribute('cx', a[0].toFixed(1)); g.children[2].setAttribute('cy', a[1].toFixed(1));
        node.style.transform = `translateX(${f2(l.side * 10 * (1 - easeOut(seg(k, 0.4, 1))))}px)`;
      });

      // ======== 3. Acabados ========
      const sw = seg(p, 0.4, 0.62);
      let ry = -9 * Math.sin(sw * Math.PI * 2);
      let ty = -Math.sin(sw * Math.PI) * 0.014 * S;
      let tx = 0, sc = 1, rz = 0, sqx = 1, sqy = 1;
      const aGra = easeInOut(seg(p, 0.455, 0.505));
      const aLim = easeInOut(seg(p, 0.535, 0.585));
      el.flatImgs[1].style.opacity = f3(aGra);
      el.flatImgs[2].style.opacity = f3(aLim);
      el.flatImgs[0].style.visibility = aGra >= 1 ? 'hidden' : '';
      el.flatImgs[1].style.visibility = aLim >= 1 ? 'hidden' : '';
      el.reflF[1].style.opacity = f3(aGra);
      el.reflF[2].style.opacity = f3(aLim);
      // Brillo especular que recorre el producto
      let sweep = -1, amt = 0;
      for (const [a, b, m] of [[0.372, 0.43, 0.8], [0.445, 0.51, 1], [0.525, 0.59, 1]]) {
        const t = seg(p, a, b);
        if (t > 0 && t < 1) { sweep = t; amt = Math.sin(Math.PI * t) * m; }
      }
      el.sheen.style.opacity = f3(amt);
      el.sheenBand.style.transform = `translateX(${f2(lerp(-1.4, 4.2, easeInOut(Math.max(0, sweep))) * S * 0.3)}px) skewX(-14deg)`;
      const chipIn = seg(p, 0.42, 0.45) * (1 - seg(p, 0.6, 0.63));
      el.chips.style.opacity = f3(chipIn);
      el.chips.style.transform = `translateX(-50%) translateY(${f2((1 - easeOut(seg(p, 0.42, 0.45))) * 10)}px)`;
      const active = p < 0.48 ? 0 : p < 0.56 ? 1 : 2;
      el.chipEls.forEach((c, i) => c.classList.toggle('is-on', i === active));

      // ======== 4. Sonido ========
      const env = seg(p, 0.62, 0.66) * (1 - seg(p, 0.775, 0.8));
      const beat = env * Math.pow(Math.max(0, Math.sin(p * 207)), 8);
      sc *= 1 + 0.014 * beat;
      show(el.eq, env > 0.001);
      el.eq.style.opacity = f3(env);
      el.spec.style.opacity = f3(env * 0.95);
      el.spec.style.transform = `translateY(${f2((1 - env) * -6)}px)`;
      if (env > 0.001) el.bars.forEach((b, i) => {
        const n = el.bars.length, c = (n - 1) / 2;
        const bell = Math.exp(-Math.pow((i - c) / (n * 0.28), 2));
        const v = 0.5 + 0.5 * Math.sin(p * 230 + i * 0.85) * Math.cos(p * 140 - i * 0.43);
        b.style.transform = `scaleY(${f3(clamp((0.08 + (0.25 + 0.75 * bell) * v * (0.75 + 0.25 * beat)) * env, 0.02, 1))})`;
      });
      const ringOn = env > 0.001;
      show(el.rings[0].parentNode, ringOn);
      if (ringOn) el.rings.forEach((r, i) => {
        const side = i < 4 ? 0 : 1, j = i % 4;
        const ph = (((p - 0.62) * 13 + j / 4) % 1 + 1) % 1;
        const ctr = side ? [880, 860] : [365, 825];
        const x = L.bx + ctr[0] * u, y = L.by + ctr[1] * u;
        const s = lerp(0.62, 1.75, easeOut(ph));
        r.style.opacity = f3(Math.sin(Math.PI * ph) * env * 0.95);
        r.style.transform = `translate(${f2(x - S * 0.2)}px,${f2(y - S * 0.25)}px) rotate(${side ? 8 : -10}deg) scale(${f3(s)})`;
      });

      // ======== 5. A tu bolsa ========
      const eBag = easeOut(seg(p, 0.835, 0.885));
      const e1 = easeInOut(seg(p, 0.8, 0.865));
      const dropT = seg(p, 0.885, 0.925);
      const land = seg(p, 0.922, 0.97);
      const squash = Math.sin(Math.PI * land) * (1 - land * 0.6);
      if (e1 > 0) {
        const lift = [L.bagCx, L.bagTop - S * (L.narrow ? 0.24 : 0.3)], fin = [L.bagCx + S * 0.005, L.bagTop - S * 0.02];
        let pc, k;
        if (dropT <= 0) { pc = [lerp(cx, lift[0], e1), lerp(cy, lift[1], e1)]; k = lerp(1, 0.56, e1); rz = lerp(0, -9, e1); }
        else { const d = easeIn(dropT); pc = [lerp(lift[0], fin[0], d), lerp(lift[1], fin[1], d)]; k = lerp(0.56, 0.52, d); rz = lerp(-9, -3, dropT); }
        pc[1] -= S * 0.025 * Math.sin(Math.PI * seg(p, 0.935, 0.965));
        tx = pc[0] - cx; ty += pc[1] - cy; sc *= k;
        sqx = 1 + 0.035 * squash; sqy = 1 - 0.06 * squash;
      }
      const flatOn = p >= HAND;
      show(el.flat, flatOn);
      const flatT = `translate3d(${f2(tx)}px,${f2(ty)}px,0) perspective(${f2(L.P)}px) rotateY(${f2(ry)}deg) rotateZ(${f2(rz)}deg) scale(${f3(sc * sqx)},${f3(sc * sqy)})`;
      el.flat.style.transform = flatT;
      const reflA = seg(p, HAND, HAND + 0.04) * (1 - seg(p, 0.8, 0.83));
      el.refl.style.opacity = f3(reflA);
      show(el.refl, reflA > 0.001);
      if (reflA > 0.001) el.refl.style.transform = `translateY(${f2(1072 * u)}px) scaleY(-1) ${flatT}`;

      const bagOn = eBag > 0.001;
      show(el.bagBack, bagOn); show(el.bagFront, bagOn);
      if (bagOn) {
        const sb = Math.sin(Math.PI * seg(p, 0.925, 0.962));
        const bt = `translate3d(0,${f2((1 - eBag) * S * 0.12)}px,0) rotateX(-7deg) rotateY(${f2(lerp(-38, -24, eBag))}deg) scale3d(${f3(1 + 0.025 * sb)},${f3(1 - 0.045 * sb)},1)`;
        el.bag3d.forEach(b => { b.style.transform = bt; });
        el.bagBack.style.opacity = f3(eBag); el.bagFront.style.opacity = f3(eBag);
      }

      const eB = easeBack(seg(p, 0.945, 0.975), 2.4);
      show(el.badge, eB > 0);
      el.badge.style.transform = `scale(${f3(Math.max(0.001, eB))})`;
      const eC = easeOut(seg(p, 0.95, 0.99));
      show(el.card, eC > 0);
      el.card.style.opacity = f3(eC);
      el.card.style.transform = `translateY(${f2((1 - eC) * S * 0.06)}px)`;

      // ======== Luz y sombra ========
      // Sombra de contacto: se abre y aclara cuando las piezas flotan, se concentra al apoyarse.
      const lift5 = e1;
      const shX = cx + S * 0.03 + tx, shY = Fy - S * 0.05;
      const shScale = rigOn ? lerp(1.35, 1, asm) : lerp(1, 0.5, lift5) * (1 + 0.04 * Math.sin(sw * Math.PI));
      const shOp = rigOn ? lerp(0.42, 0.95, asm) : lerp(0.95, 0, seg(p, 0.8, 0.845)) * (1 - 0.15 * Math.sin(sw * Math.PI));
      el.shP.style.opacity = f3(shOp);
      el.shP.style.transform = `translate(${f2(shX - S * 0.43)}px,${f2(shY - S * 0.0425)}px) scale(${f3(shScale)},${f3(rigOn ? lerp(1.5, 1, asm) : 1)})`;
      const gc = [lerp(cx + S * 0.1, L.bagCx, eBag), lerp(cy - S * 0.08, L.bagTop, eBag)];
      const gs = 1 + 0.12 * env + 0.07 * beat;
      el.glowV.style.transform = `translate(${f2(gc[0] - S * 0.75)}px,${f2(gc[1] - S * 0.625)}px) scale(${f3(gs * lerp(1, 0.75, eBag))})`;
      el.glowV.style.opacity = f3(0.85 + 0.15 * env);
      el.glowL.style.transform = `translate(${f2(cx - S * 0.95 - (rigOn ? rigT.ay * S * 0.004 : 0))}px,${f2(cy - S * 0.3)}px) scale(${f3(1 + 0.1 * env)})`;
      el.pool.style.opacity = f3(1 - 0.5 * eBag);
      el.brand.style.opacity = L.narrow ? f3(1 - seg(p, 0.8, 0.83)) : '1';
    }

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (layout()) render(lastP); }).observe(stage);
    // Las fuentes cambian el ancho de los rótulos: se vuelve a medir cuando cargan.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (layout()) render(lastP); });
    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.wav = {
    title: 'Así se arma un Wave One',
    duration: 17000,
    steps: [
      { label: 'Las piezas', at: 0 },
      { label: 'Ensamblaje', at: 0.2 },
      { label: 'Tres acabados', at: 0.42 },
      { label: 'El sonido', at: 0.62 },
      { label: 'A tu bolsa', at: 0.8 }
    ],
    mount
  };
})();
