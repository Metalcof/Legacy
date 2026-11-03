'use strict';
// Escena AURA: la casa real (foto) recorre un flujo de visualización arquitectónica en 3D:
// plano sobre el terreno → cimientos → estructura en líneas → volumen en arcilla → materiales → luz de atardecer.
// Todo se calcula desde el progreso p (0..1): se puede adelantar, retroceder y pausar.
(() => {
  window.NexoEscenas = window.NexoEscenas || {};
  const SCRIPT = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('../', SCRIPT);
  const asset = name => new URL('assets/' + name, BASE).href;
  const HOUSE = asset('architecture-editorial.webp');
  const INSIDE = asset('interior-editorial.webp');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2));
  // Fotogramas clave [[p, valor], …] con curva suave entre cada par.
  const keys = (p, list) => {
    if (p <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (p <= list[i][0]) return lerp(list[i - 1][1], list[i][1], eInOut(seg(p, list[i - 1][0], list[i][0])));
    }
    return list[list.length - 1][1];
  };
  // Unidad del mundo 3D: 1 = 1 % del ancho de la foto (la foto cubre siempre el escenario).
  const u = n => `calc(var(--f) * ${n.toFixed(3)})`;
  // Coordenadas de la foto (1600 × 900 px) → mundo, con la foto centrada en el origen.
  const wx = x => (x / 1600 - 0.5) * 100;
  const wy = y => (y / 900 - 0.5) * 56.25;

  const STYLE = `
.sc-aura-root{position:absolute;inset:0;overflow:hidden;border-radius:inherit;container-type:size;background:#0a1620;color:#eaf4ff;font-family:var(--font,'Segoe UI',system-ui,sans-serif);font-style:normal;user-select:none;-webkit-user-select:none}
.sc-aura-root *{box-sizing:border-box;font-style:normal}
.sc-aura-sky,.sc-aura-dusk-sky,.sc-aura-vig,.sc-aura-grain{position:absolute;inset:0;pointer-events:none}
.sc-aura-sky{background:radial-gradient(120% 90% at 50% 38%,#173247 0%,#0d1d2a 52%,#060d13 100%)}
.sc-aura-sky::after{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(150,200,240,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(150,200,240,.06) 1px,transparent 1px);background-size:calc(var(--f,1px)*4) calc(var(--f,1px)*4);background-position:center;mask-image:radial-gradient(70% 70% at 50% 45%,#000,transparent)}
.sc-aura-dusk-sky{opacity:0;background:#140d10}
.sc-aura-dusk-sky img{position:absolute;inset:-8%;width:116%;height:116%;object-fit:cover;filter:blur(26px) brightness(.5) saturate(1.3) sepia(.3) hue-rotate(-10deg)}
.sc-aura-dusk-sky::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(30,20,50,.55),transparent 40%,rgba(10,6,6,.7) 85%)}
.sc-aura-cam{position:absolute;inset:0;--F:max(100cqw,177.78cqh);--f:calc(var(--F) / 100);perspective:calc(var(--F) * 1.25);perspective-origin:50% 46%}
.sc-aura-world{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}
.sc-aura-world>*{position:absolute}
/* Terreno: hoja de plano tendida en el suelo */
.sc-aura-floor{left:calc(var(--f)*-75);top:calc(var(--f)*28.125);width:calc(var(--f)*150);height:calc(var(--f)*110);transform-origin:50% 0;transform:rotateX(90deg)}
.sc-aura-floor>*{position:absolute;inset:0;width:100%;height:100%}
.sc-aura-paper{background-color:#0e2436;background-image:linear-gradient(rgba(140,200,255,.16) 1px,transparent 1px),linear-gradient(90deg,rgba(140,200,255,.16) 1px,transparent 1px),linear-gradient(rgba(140,200,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(140,200,255,.07) 1px,transparent 1px);background-size:calc(var(--f)*10) calc(var(--f)*10),calc(var(--f)*10) calc(var(--f)*10),calc(var(--f)*2) calc(var(--f)*2),calc(var(--f)*2) calc(var(--f)*2);mask-image:radial-gradient(75% 85% at 50% 18%,#000 55%,transparent 100%)}
.sc-aura-gloss{background:radial-gradient(70% 60% at 50% 0%,rgba(255,170,110,.18),transparent 70%),linear-gradient(180deg,rgba(14,10,10,.55),rgba(8,6,6,.92) 60%);opacity:0}
.sc-aura-plan{overflow:visible}
.sc-aura-ln{fill:none;stroke:#a9dcff;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
.sc-aura-ln.sc-aura-b{stroke-width:5;stroke:#e6f5ff}
.sc-aura-ln.sc-aura-t{stroke:#6fb4e6;stroke-width:2;opacity:.7}
.sc-aura-tx{text-anchor:start;fill:#cfeaff;font:600 19px/1 var(--font,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase}
.sc-aura-tx.sc-aura-s{font-size:15px;fill:#8cc4ea}
.sc-aura-ft{fill:#e6f5ff;stroke:#0e2436;stroke-width:3}
.sc-aura-shadow{left:calc(var(--f)*-52);top:calc(var(--f)*26);width:calc(var(--f)*104);height:calc(var(--f)*14);transform-origin:50% 0;transform:translateY(calc(var(--f)*2.1)) rotateX(90deg);background:radial-gradient(50% 50% at 50% 30%,rgba(0,0,0,.75),transparent 72%);opacity:0}
/* Reflejo en el piso brillante (plano espejo bajo la base) */
.sc-aura-refl{left:calc(var(--f)*-50);top:calc(var(--f)*28.125);width:calc(var(--f)*100);height:calc(var(--f)*56.25);opacity:0;mask-image:linear-gradient(180deg,rgba(0,0,0,.85),transparent 55%);-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.85),transparent 55%)}
.sc-aura-refl img{width:100%;height:100%;display:block;transform:scaleY(-1);filter:brightness(.62) contrast(1.12) saturate(1.3) sepia(.22) hue-rotate(-8deg) blur(1.5px)}
/* Fachada: la foto y sus copias procesadas, en un solo plano plano */
.sc-aura-elev{left:calc(var(--f)*-50);top:calc(var(--f)*-28.125);width:calc(var(--f)*100);height:calc(var(--f)*56.25);transform-origin:50% 100%;overflow:hidden;isolation:isolate;background:#0f2638}
.sc-aura-rim{box-shadow:inset 0 0 0 1px rgba(150,210,255,.5);pointer-events:none}
.sc-aura-elev>*{position:absolute;inset:0;width:100%;height:100%;display:block}
.sc-aura-elev img{object-fit:fill}
.sc-aura-sheet{background-color:#0f2a3e;background-image:linear-gradient(rgba(140,200,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(140,200,255,.13) 1px,transparent 1px);background-size:calc(var(--f)*2.5) calc(var(--f)*2.5)}
.sc-aura-lines{clip-path:inset(100% 0 0 0)}
.sc-aura-lines.sc-aura-fallback{background:url("${HOUSE}") center/100% 100%;filter:grayscale(1) contrast(4) invert(1) brightness(.7);mix-blend-mode:screen}
.sc-aura-dlines.sc-aura-fallback{background:url("${HOUSE}") center/100% 100%;filter:grayscale(1) contrast(3);mix-blend-mode:multiply}
.sc-aura-scan{top:0!important;height:2px!important;background:linear-gradient(90deg,transparent,#bfe8ff 15%,#fff 50%,#bfe8ff 85%,transparent);box-shadow:0 0 14px 4px rgba(120,200,255,.55);opacity:0}
.sc-aura-clay{filter:grayscale(1) contrast(.74) brightness(1.24) sepia(.06)}
.sc-aura-sweep{background:linear-gradient(100deg,transparent 40%,rgba(255,255,255,.55) 49%,rgba(255,255,255,.8) 50%,transparent 60%);mix-blend-mode:soft-light;opacity:0}
.sc-aura-c1{mask-image:radial-gradient(ellipse 30% 19% at 64% 13%,#000 55%,transparent 100%),radial-gradient(ellipse 22% 13% at 84% 27%,#000 50%,transparent 100%),radial-gradient(ellipse 7% 26% at 34% 52%,#000 55%,transparent 100%),radial-gradient(ellipse 30% 8% at 62% 44%,#000 50%,transparent 100%)}
.sc-aura-c2{mask-image:radial-gradient(ellipse 14% 11% at 60% 59%,#000 45%,transparent 100%),radial-gradient(ellipse 9% 12% at 59% 30%,#000 40%,transparent 100%),radial-gradient(ellipse 14% 6% at 52% 66%,#000 45%,transparent 100%)}
.sc-aura-c3{mask-image:radial-gradient(ellipse 15% 17% at 57% 25%,#000 55%,transparent 100%),radial-gradient(ellipse 26% 16% at 80% 50%,#000 55%,transparent 100%),radial-gradient(ellipse 10% 11% at 47% 58%,#000 45%,transparent 100%)}
.sc-aura-c1,.sc-aura-c2,.sc-aura-c3{-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}
.sc-aura-c1,.sc-aura-c2,.sc-aura-c3,.sc-aura-c4,.sc-aura-dusk,.sc-aura-tint,.sc-aura-glows,.sc-aura-axes{opacity:0}
.sc-aura-dusk{filter:brightness(.62) contrast(1.14) saturate(1.3) sepia(.22) hue-rotate(-8deg)}
.sc-aura-tint{background:linear-gradient(180deg,rgba(40,24,80,.55) 0%,rgba(120,60,90,.18) 30%,transparent 55%),radial-gradient(60% 50% at 18% 18%,rgba(255,150,80,.45),transparent 70%);mix-blend-mode:soft-light}
.sc-aura-glows{mix-blend-mode:screen}
.sc-aura-glows i{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(255,206,140,.95),rgba(255,160,80,.5) 45%,rgba(255,130,60,0));opacity:0}
.sc-aura-axes{overflow:visible}
.sc-aura-ax{stroke:#ffb36b;stroke-width:1.6;stroke-dasharray:10 7;fill:none;opacity:.85}
.sc-aura-lv{stroke:#7fd0ff;stroke-width:1.6;fill:none}
.sc-aura-axes circle{fill:#0f2a3e;stroke:#ffb36b;stroke-width:2}
.sc-aura-axes text{font:700 22px/1 var(--font,system-ui,sans-serif);fill:#ffd2a6;text-anchor:middle;letter-spacing:.04em}
.sc-aura-axes .sc-aura-lt{fill:#bfe6ff;text-anchor:start;font-size:21px;letter-spacing:.1em}
.sc-aura-lvl{opacity:0}
/* Etiquetas de realidad aumentada */
.sc-aura-tag{left:0;top:0;width:0;height:0;opacity:0}
.sc-aura-tag b{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.28),0 0 14px rgba(160,220,255,.9)}
.sc-aura-tag i{position:absolute;left:0;bottom:0;width:1px;height:clamp(16px,4.4cqh,40px);background:linear-gradient(0deg,rgba(255,255,255,.9),rgba(255,255,255,.2))}
.sc-aura-tag span{position:absolute;left:-12px;bottom:clamp(16px,4.4cqh,40px);display:block;white-space:nowrap;padding:.5em .85em .55em;border-radius:10px;background:rgba(10,18,24,.78);border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 30px rgba(0,0,0,.35);font-size:clamp(10px,1.12cqw,14px);line-height:1.25}
.sc-aura-tag.sc-aura-left span{left:auto;right:-12px}
.sc-aura-tag.sc-aura-down i{bottom:auto;top:0;background:linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,255,255,.2))}
.sc-aura-tag.sc-aura-down span{bottom:auto;top:clamp(16px,4.4cqh,40px)}
.sc-aura-tag strong{display:block;font-weight:700;letter-spacing:.14em;text-transform:uppercase;font-size:.86em;color:#fff}
.sc-aura-tag em{display:block;font-style:normal;color:rgba(225,238,248,.8);margin-top:.2em}
/* Ventana al interior */
.sc-aura-ipos{left:0;top:0;width:0;height:0;transform-style:preserve-3d;transform:translate3d(calc(var(--f)*21),calc(var(--f)*1.5),calc(var(--f)*24)) rotateY(-24deg)}
.sc-aura-inset{position:absolute;left:0;top:0;width:calc(var(--f)*30);height:calc(var(--f)*16.875);opacity:0;border-radius:calc(var(--f)*.8);box-shadow:0 30px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.35);overflow:hidden;background:#222}
.sc-aura-inset img{width:100%;height:100%;object-fit:cover;display:block}
.sc-aura-inset::after{content:'';position:absolute;inset:0;background:linear-gradient(120deg,rgba(255,255,255,.28),transparent 35%),linear-gradient(0deg,rgba(0,0,0,.55),transparent 45%)}
.sc-aura-inset span{position:absolute;left:.9em;bottom:.75em;z-index:1;font-size:clamp(10px,1.1cqw,14px);font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#fff}
/* Interfaz superior */
.sc-aura-hud{position:absolute;left:clamp(12px,2.2cqw,28px);right:clamp(12px,2.2cqw,28px);top:clamp(10px,2.6cqh,24px);display:flex;justify-content:space-between;align-items:flex-start;gap:12px;pointer-events:none;font-size:clamp(10px,1.05cqw,13px);letter-spacing:.16em;text-transform:uppercase;text-shadow:0 1px 8px rgba(0,0,0,.5)}
.sc-aura-hud small{display:block;font-size:.82em;font-weight:600;color:rgba(220,236,250,.7)}
.sc-aura-hud strong{display:block;margin-top:.3em;font-weight:700;font-size:1.12em;color:#fff}
.sc-aura-meter{text-align:right}
.sc-aura-meter strong{font-variant-numeric:tabular-nums;font-size:clamp(16px,2.4cqw,30px);letter-spacing:.02em;font-weight:300}
.sc-aura-bar{width:clamp(70px,12cqw,160px);height:2px;margin:.55em 0 0 auto;background:rgba(255,255,255,.22);overflow:hidden}
.sc-aura-bar i{display:block;height:100%;background:#fff;transform-origin:0 50%;transform:scaleX(0)}
.sc-aura-vig{background:radial-gradient(120% 95% at 50% 45%,transparent 55%,rgba(0,0,0,.55) 100%)}
.sc-aura-grain{opacity:.09;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
@container (max-aspect-ratio: 3/2){
  .sc-aura-tag em,.sc-aura-hud small{display:none}
  .sc-aura-tag span{padding:.45em .7em}
  .sc-aura-ipos{transform:translate3d(calc(var(--f)*2),calc(var(--f)*6),calc(var(--f)*32)) rotateY(-12deg)}
  .sc-aura-inset{width:calc(var(--f)*28);height:calc(var(--f)*15.75)}
}`;

  // Planta arquitectónica sobre el terreno (viewBox 1500 × 1100; la fachada ocupa x 250–1250 en el borde superior).
  const X = px => 250 + px * 0.625;
  const PLAN = (() => {
    const L = (d, cls = '') => `<path class="sc-aura-ln${cls ? ' sc-aura-' + cls : ''}" pathLength="1" d="${d}"/>`;
    const R = (x0, y0, x1, y1, cls) => L(`M${x0} ${y0}H${x1}V${y1}H${x0}Z`, cls);
    const h0 = X(470), h1 = X(1600), u0 = X(650), u1 = X(1440);
    const groups = [
      // 0 · lindero y curvas de nivel del terreno
      [R(70, 30, 1430, 1020, 't'),
        L('M70 610C320 560 560 640 820 600S1240 560 1430 640', 't'),
        L('M70 780C360 730 600 820 900 770S1260 740 1430 820', 't'),
        L('M70 930C380 900 700 960 1000 920S1300 900 1430 960', 't')],
      // 1 · huella de la casa
      [R(h0, 40, h1, 330, 'b'), R(u0, 50, u1, 250)],
      // 2 · muros interiores y puertas
      [L(`M${X(820)} 40V200M${X(820)} 250V330M${X(1120)} 40V160M${X(1120)} 220V330M${h0} 190H${X(700)}M${X(1210)} 330V250`),
        L(`M${X(820)} 200A50 50 0 0 1 ${X(820) + 50} 250M${X(1120)} 160A60 60 0 0 0 ${X(1120) - 60} 220`)],
      // 3 · terraza, escalones y piscina
      [R(X(420), 330, X(1000), 380), L(`M${X(1000)} 342H${X(1150)}M${X(1000)} 356H${X(1150)}M${X(1000)} 370H${X(1150)}M${X(1150)} 330V384`),
        R(X(160), 360, X(830), 480), R(X(180), 372, X(810), 468, 't')],
      // 4 · cotas
      [L(`M${h0} 560H${h1}M${h0} 545V575M${h1} 545V575M${h0} 330V575M${h1} 330V575`, 't'),
        L(`M${X(1600) + 40} 40V330M${X(1600) + 25} 40H${X(1600) + 55}M${X(1600) + 25} 330H${X(1600) + 55}`, 't'),
        L(`M${X(160)} 520H${X(830)}M${X(160)} 506V534M${X(830)} 506V534`, 't')]
    ];
    const foot = [470, 650, 820, 1120, 1210, 1600].flatMap(px => [[X(px), 40], [X(px), 330]]).concat([[X(1000), 190], [X(650), 190]]);
    const footings = foot.map(([x, y], i) => `<rect class="sc-aura-ft" data-i="${i}" x="${x - 13}" y="${y - 13}" width="26" height="26" opacity="0"/>`).join('');
    return `<svg class="sc-aura-plan" viewBox="0 0 1500 1100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
${groups.map((g, i) => `<g data-g="${i}">${g.join('')}</g>`).join('')}
<g class="sc-aura-ttext" opacity="0">
  <text class="sc-aura-tx" x="120" y="90">Lote 1.240 m²</text>
  <text class="sc-aura-tx sc-aura-s" x="1180" y="650">Terreno +0,50</text>
  <text class="sc-aura-tx sc-aura-s" x="1180" y="820">Terreno +0,00</text>
  <g transform="translate(160 780)"><circle r="34" fill="none" stroke="#a9dcff" stroke-width="2"/><path d="M0 -30L12 14L0 6L-12 14Z" fill="#e6f5ff"/><text class="sc-aura-tx" y="-44" text-anchor="middle">N</text></g>
</g>
<g class="sc-aura-ptext" opacity="0">
  <text class="sc-aura-tx" x="${(h0 + h1) / 2}" y="548" text-anchor="middle">22,60 m</text>
  <text class="sc-aura-tx" x="${X(1600) + 62}" y="195">9,30 m</text>
  <text class="sc-aura-tx sc-aura-s" x="${(X(160) + X(830)) / 2}" y="508" text-anchor="middle">Piscina 13,40 m</text>
  <text class="sc-aura-tx" x="${X(980)}" y="140" text-anchor="middle">Sala · comedor</text>
  <text class="sc-aura-tx sc-aura-s" x="${X(560)}" y="270" text-anchor="middle">Estudio</text>
  <text class="sc-aura-tx sc-aura-s" x="120" y="1000">AURA · Planta baja · Esc. 1:100</text>
</g>
${footings}
</svg>`;
  })();

  // Ejes estructurales y niveles sobre la fachada (viewBox = la foto, 1600 × 900).
  const AXES = (() => {
    const cols = [[470, 'A'], [650, 'B'], [1120, 'C'], [1215, 'D'], [1520, 'E']];
    const lv = [[632, 'N ±0,00'], [420, 'N +3,40'], [92, 'N +6,80']];
    return `<svg class="sc-aura-axes" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true" focusable="false">
${cols.map(([x, l]) => `<path class="sc-aura-ax" d="M${x} 70V900"/><circle cx="${x}" cy="46" r="20"/><text x="${x}" y="54">${l}</text>`).join('')}
${lv.map(([y, l], i) => `<g class="sc-aura-lvl" data-l="${i}"><path class="sc-aura-lv" d="M250 ${y}H1600"/><path d="M262 ${y}l-12 -16h24z" fill="#7fd0ff"/><text class="sc-aura-lt" x="282" y="${y - 12}">${l}</text></g>`).join('')}
</svg>`;
  })();

  // Etiquetas: [x, y (px de la foto), z, lado, aparece, se va, título, detalle]
  const TAGS = [
    [905, 652, 5, '', 0.215, 0.315, 'Cimentación', 'Losa de concreto armado'],
    [1010, 335, 6, 'sc-aura-left', 0.37, 0.47, 'Estructura', 'Pórticos y losas · luces de 8,40 m'],
    [760, 400, 7, '', 0.53, 0.615, 'Volumen', 'Voladizo de 4,20 m'],
    [1290, 120, 6, 'sc-aura-left sc-aura-down', 0.635, 0.785, 'Concreto aparente', 'Encofrado de tablilla'],
    [930, 540, 8, '', 0.675, 0.785, 'Madera de teca', 'Cielos y muebles'],
    [1360, 410, 7, 'sc-aura-left', 0.705, 0.785, 'Vidrio templado', 'Ventanales de piso a techo'],
    [330, 760, 6, '', 0.74, 0.8, 'Paisaje nativo', 'Jardín tropical']
  ];
  // Brillos de las ventanas al atardecer: [x, y, ancho, alto] en px de la foto.
  const GLOWS = [[905, 255, 380, 230], [1050, 300, 170, 150], [960, 520, 420, 170], [1065, 515, 90, 70], [1400, 470, 380, 300], [1460, 505, 90, 90], [760, 560, 200, 130]];
  const PHASES = ['Plano y terreno', 'Cimientos', 'Estructura', 'Volumen', 'Materiales', 'Luz y paisaje'];
  const AT = [0, 0.15, 0.3, 0.46, 0.62, 0.78];

  // Dibujo lineal: diferencia de desenfoques (XDoG) de la foto, calculada una sola vez al montar.
  // La arquitectura conserva el trazo completo; el follaje y el entorno quedan como un boceto tenue.
  const HOUSE_SHAPE = [[440, 300], [650, 300], [650, 200], [1110, 0], [1450, 0], [1450, 150], [1600, 130], [1600, 650], [1160, 780], [150, 790], [150, 640], [440, 640]];
  function drawLines(img, light, dark) {
    const w = 1280, h = 720, n = w * h;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const s = ctx.getImageData(0, 0, w, h).data;
    const g = new Float32Array(n), green = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) {
      g[i] = 0.299 * s[j] + 0.587 * s[j + 1] + 0.114 * s[j + 2];
      green[i] = s[j + 1] - Math.max(s[j], s[j + 2]);
    }
    const box = (src, r) => {
      const t = new Float32Array(n), o = new Float32Array(n), d = 2 * r + 1;
      const at = (x, y) => src[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
      for (let y = 0; y < h; y++) {
        let acc = 0;
        for (let x = -r; x <= r; x++) acc += at(x, y);
        for (let x = 0; x < w; x++) { t[y * w + x] = acc / d; acc += at(x + r + 1, y) - at(x - r, y); }
      }
      const tt = (x, y) => t[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let y = -r; y <= r; y++) acc += tt(x, y);
        for (let y = 0; y < h; y++) { o[y * w + x] = acc / d; acc += tt(x, y + r + 1) - tt(x, y - r); }
      }
      return o;
    };
    const b1 = box(box(g, 1), 1), b2 = box(box(g, 3), 3), foliage = box(box(green, 3), 3);
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) raw[i] = Math.max(0, (b2[i] - b1[i] - 2.2) * 28);
    const density = box(box(raw, 7), 7);
    // Máscara suave de la casa.
    const mk = document.createElement('canvas'); mk.width = w; mk.height = h;
    const mx = mk.getContext('2d', { willReadFrequently: true });
    mx.filter = 'blur(18px)'; mx.fillStyle = '#fff'; mx.scale(w / 1600, h / 900);
    mx.beginPath(); HOUSE_SHAPE.forEach(([x, y], i) => (i ? mx.lineTo(x, y) : mx.moveTo(x, y))); mx.fill();
    const M = mx.getImageData(0, 0, w, h).data;
    const outL = ctx.createImageData(w, h), outD = ctx.createImageData(w, h), L = outL.data, D = outD.data;
    for (let i = 0; i < n; i++) {
      let a = raw[i];
      if (foliage[i] > 8) a *= 0.16;
      a *= 0.16 + 0.84 * M[i * 4 + 3] / 255;
      a *= Math.min(1, 52 / Math.max(1, density[i]));
      a = a > 255 ? 255 : a;
      const j = i * 4;
      L[j] = 226; L[j + 1] = 242; L[j + 2] = 255; L[j + 3] = a;
      D[j] = 34; D[j + 1] = 44; D[j + 2] = 50; D[j + 3] = a * 0.9;
    }
    for (const [cv, data] of [[light, outL], [dark, outD]]) {
      cv.width = w; cv.height = h;
      cv.getContext('2d').putImageData(data, 0, 0);
    }
  }

  function mount(stage) {
    const tagHtml = TAGS.map(([, , , side, , , title, sub]) => `<div class="sc-aura-tag ${side}"><i></i><b></b><span><strong>${title}</strong><em>${sub}</em></span></div>`).join('');
    const glowHtml = GLOWS.map(([x, y, w, h]) => `<i style="left:${((x - w / 2) / 16).toFixed(2)}%;top:${((y - h / 2) / 9).toFixed(2)}%;width:${(w / 16).toFixed(2)}%;height:${(h / 9).toFixed(2)}%"></i>`).join('');
    const img = cls => `<img class="${cls}" src="${HOUSE}" alt="" decoding="async" draggable="false">`;
    stage.innerHTML = `<div class="sc-aura-root" aria-hidden="true"><style>${STYLE}</style>
  <div class="sc-aura-sky"></div><div class="sc-aura-dusk-sky"><img src="${HOUSE}" alt="" decoding="async" draggable="false"></div>
  <div class="sc-aura-cam"><div class="sc-aura-world">
    <div class="sc-aura-refl"><img src="${HOUSE}" alt="" decoding="async" draggable="false"></div>
    <div class="sc-aura-floor"><div class="sc-aura-paper"></div><div class="sc-aura-gloss"></div>${PLAN}</div>
    <div class="sc-aura-shadow"></div>
    <div class="sc-aura-elev">
      <div class="sc-aura-sheet"></div>
      <canvas class="sc-aura-lines"></canvas>
      ${img('sc-aura-clay')}
      <canvas class="sc-aura-dlines"></canvas>
      <div class="sc-aura-sweep"></div>
      ${img('sc-aura-c1')}${img('sc-aura-c2')}${img('sc-aura-c3')}${img('sc-aura-c4')}
      ${img('sc-aura-dusk')}<div class="sc-aura-tint"></div>
      <div class="sc-aura-glows">${glowHtml}</div>
      ${AXES}
      <div class="sc-aura-scan"></div>
      <div class="sc-aura-rim"></div>
    </div>
    ${tagHtml}
    <div class="sc-aura-ipos"><div class="sc-aura-inset"><img src="${INSIDE}" alt="" decoding="async" draggable="false"><span>Y por dentro</span></div></div>
  </div></div>
  <div class="sc-aura-vig"></div><div class="sc-aura-grain"></div>
  <div class="sc-aura-hud"><div><small>AURA · Render en vivo</small><strong class="sc-aura-phase">Plano y terreno</strong></div>
    <div class="sc-aura-meter"><small>Avance de obra</small><strong class="sc-aura-pct">0 %</strong><div class="sc-aura-bar"><i></i></div></div></div>
</div>`;
    const root = stage.querySelector('.sc-aura-root');
    const q = s => root.querySelector('.sc-aura-' + s);
    const el = {};
    ['world', 'floor', 'paper', 'gloss', 'plan', 'ptext', 'ttext', 'shadow', 'refl', 'elev', 'sheet', 'lines', 'dlines', 'clay', 'sweep', 'c1', 'c2', 'c3', 'c4',
      'dusk', 'tint', 'glows', 'axes', 'scan', 'rim', 'inset', 'phase', 'pct', 'dusk-sky'].forEach(k => { el[k] = q(k); });
    el.bar = root.querySelector('.sc-aura-bar i');
    const groups = [...root.querySelectorAll('.sc-aura-plan [data-g]')].map(g => [...g.querySelectorAll('path')]);
    const footings = [...root.querySelectorAll('.sc-aura-ft')];
    const levels = [...root.querySelectorAll('.sc-aura-lvl')];
    const axCols = [...root.querySelectorAll('.sc-aura-ax')];
    const glows = [...el.glows.children];
    const tags = [...root.querySelectorAll('.sc-aura-tag')];
    groups.flat().forEach(path => { path.style.strokeDasharray = '1 1'; });
    axCols.forEach(a => a.setAttribute('pathLength', '1'));

    // Dibujo lineal calculado una vez; si el navegador no deja leer la imagen, se usa un filtro aproximado.
    const source = new Image();
    source.decoding = 'async';
    source.src = HOUSE;
    source.decode().then(() => drawLines(source, el.lines, el.dlines)).catch(() => {
      el.lines.classList.add('sc-aura-fallback'); el.dlines.classList.add('sc-aura-fallback');
    });

    const op = (node, v) => { node.style.opacity = clamp(v).toFixed(3); };
    let lastPhase = -1, lastPct = -1;

    function render(p) {
      // ---------- Cámara: grúa desde arriba → órbita → encuadre heroico ----------
      const rx = keys(p, [[0, -64], [0.15, -52], [0.3, -26], [0.46, -9], [0.62, -5], [0.78, -4], [1, -5]]);
      const ry = keys(p, [[0, 20], [0.15, 8], [0.3, -16], [0.46, -11], [0.62, 9], [0.78, 3], [1, -9]]);
      const dist = keys(p, [[0, 62], [0.15, 50], [0.3, 40], [0.46, 20], [0.62, 12], [0.78, 9], [0.9, 16], [1, 19]]);
      const pz = keys(p, [[0, 34], [0.15, 26], [0.3, 6], [0.46, 0], [1, 0]]);
      const py = keys(p, [[0, 26], [0.15, 18], [0.3, 0], [0.46, -1], [0.78, 0], [1, 4]]);
      const px = keys(p, [[0, 0], [0.46, 0], [0.62, 3], [0.78, 0], [0.9, 4], [1, 6]]);
      el.world.style.transform = `translate3d(0,0,${u(-dist)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${u(-px)},${u(-py)},${u(-pz)})`;

      // ---------- 1 · Plano sobre el terreno ----------
      const drawAt = [[-0.09, 0.03], [0.03, 0.09], [0.06, 0.12], [0.075, 0.135], [0.09, 0.15]];
      groups.forEach((paths, gi) => paths.forEach((path, k) => {
        const t = eOut(seg(p, drawAt[gi][0] + k * 0.006, drawAt[gi][1] + k * 0.006));
        path.style.strokeDashoffset = (1 - t).toFixed(4);
      }));
      op(el.ptext, seg(p, 0.1, 0.15));
      el.ttext.setAttribute('opacity', (0.55 + 0.45 * seg(p, 0, 0.04)).toFixed(3));
      footings.forEach((f, i) => f.setAttribute('opacity', eOut(seg(p, 0.155 + i * 0.004, 0.18 + i * 0.004)).toFixed(3)));
      const planFade = 1 - 0.7 * seg(p, 0.46, 0.6) - 0.22 * seg(p, 0.78, 0.88);
      op(el.plan, planFade);
      op(el.paper, 1 - 0.55 * seg(p, 0.5, 0.66) - 0.45 * seg(p, 0.78, 0.9));
      op(el.gloss, seg(p, 0.6, 0.72) * 0.6 + seg(p, 0.78, 0.9) * 0.4);

      // ---------- 2 · La fachada se levanta del terreno y se dibuja de abajo arriba ----------
      const rise = eInOut(seg(p, 0.15, 0.3));
      el.elev.style.transform = `rotateX(${lerp(90, 0, rise).toFixed(2)}deg)`;
      op(el.elev, seg(p, 0.15, 0.19));
      op(el.shadow, seg(p, 0.46, 0.6) * 0.8);
      const reveal = lerp(0, 0.34, eOut(seg(p, 0.19, 0.3))) + lerp(0, 0.66, eInOut(seg(p, 0.31, 0.44)));
      const top = (1 - reveal) * 100;
      el.lines.style.clipPath = `inset(${top.toFixed(2)}% 0 0 0)`;
      el.scan.style.transform = `translateY(${u(top * 0.5625)})`;
      op(el.scan, (reveal > 0.002 && reveal < 0.998 ? 1 : 0) * (1 - seg(p, 0.44, 0.46)));
      op(el.axes, seg(p, 0.2, 0.25) * (1 - seg(p, 0.5, 0.57)));
      axCols.forEach((a, i) => { a.style.strokeDashoffset = (1 - eOut(seg(p, 0.2 + i * 0.008, 0.27 + i * 0.008))).toFixed(3); a.style.strokeDasharray = '1 1'; });
      levels.forEach((l, i) => l.setAttribute('opacity', eOut(seg(p, [0.23, 0.36, 0.42][i], [0.26, 0.39, 0.45][i])).toFixed(3)));
      op(el.sheet, 1);

      // ---------- 3 · Volumen: arcilla que barre sobre las líneas ----------
      const wipe = eInOut(seg(p, 0.47, 0.58));
      const a = lerp(-25, 125, wipe), b = a - 22;
      const clip = `polygon(-5% -5%, ${a.toFixed(2)}% -5%, ${b.toFixed(2)}% 105%, -5% 105%)`;
      el.clay.style.clipPath = clip;
      el.dlines.style.clipPath = clip;
      op(el.clay, wipe > 0 ? 1 : 0);
      op(el.dlines, (wipe > 0 ? 0.75 : 0) * (1 - seg(p, 0.66, 0.76)));
      el.sweep.style.transform = `translateX(${lerp(-70, 90, wipe).toFixed(2)}%)`;
      op(el.sweep, wipe > 0 && wipe < 1 ? 1 : 0);
      op(el.lines, 1 - seg(p, 0.58, 0.6));

      // ---------- 4 · Materiales por zonas ----------
      op(el.c1, eOut(seg(p, 0.625, 0.67)));
      op(el.c2, eOut(seg(p, 0.665, 0.71)));
      op(el.c3, eOut(seg(p, 0.695, 0.74)));
      op(el.c4, eInOut(seg(p, 0.73, 0.79)));

      // ---------- 5 · Luz de atardecer, paisaje y piso brillante ----------
      const dusk = eInOut(seg(p, 0.79, 0.89));
      op(el.dusk, dusk); op(el.tint, dusk); op(el['dusk-sky'], dusk);
      op(el.glows, 1);
      glows.forEach((g, i) => op(g, eOut(seg(p, 0.84 + i * 0.008, 0.9 + i * 0.008))));
      op(el.refl, eInOut(seg(p, 0.8, 0.92)) * 0.75);
      op(el.rim, 1 - seg(p, 0.6, 0.7));
      const ins = eOut(seg(p, 0.9, 0.98));
      el.inset.style.transform = `translate3d(${u(lerp(14, 0, ins))},${u(lerp(5, 0, ins))},${u(lerp(-14, 0, ins))}) rotateY(${lerp(-16, 0, ins).toFixed(2)}deg) scale(${lerp(0.85, 1, ins).toFixed(3)})`;
      op(el.inset, ins);

      // ---------- Etiquetas AR ----------
      TAGS.forEach(([x, y, z, , t0, t1], i) => {
        const inn = eBack(seg(p, t0, t0 + 0.025)), out = seg(p, t1, t1 + 0.02);
        const v = Math.min(seg(p, t0, t0 + 0.02), 1 - out);
        tags[i].style.transform = `translate3d(${u(wx(x))},${u(wy(y) - out * 2)},${u(z)}) scale(${(0.75 + 0.25 * inn).toFixed(3)})`;
        op(tags[i], v);
      });

      // ---------- Interfaz ----------
      let phase = 0;
      AT.forEach((at, i) => { if (p >= at - 0.0001) phase = i; });
      if (phase !== lastPhase) { el.phase.textContent = `0${phase + 1} · ${PHASES[phase]}`; lastPhase = phase; }
      const pct = Math.round(clamp(p / 0.97) * 100);
      if (pct !== lastPct) { el.pct.textContent = pct === 100 ? 'Habitable' : `${pct} %`; lastPct = pct; }
      el.bar.style.transform = `scaleX(${clamp(p / 0.97).toFixed(4)})`;
    }

    return { render };
  }

  window.NexoEscenas.aura = {
    title: 'Una casa AURA, de cero a habitable',
    duration: 22000,
    steps: [
      { label: 'Plano y terreno', at: 0 },
      { label: 'Cimientos', at: 0.15 },
      { label: 'Estructura', at: 0.3 },
      { label: 'Volumen', at: 0.46 },
      { label: 'Materiales', at: 0.62 },
      { label: 'Luz y paisaje', at: 0.78 }
    ],
    mount
  };
})();
