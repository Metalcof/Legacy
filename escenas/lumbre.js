'use strict';
// Escena animada de LUMBRE: del fuego de leña a la mesa.
// render(p) es una función pura del progreso (0..1); solo el parpadeo de llamas/brasas usa CSS.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t * t;
  const eIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const frac = v => v - Math.floor(v);
  const bell = (p, a, b, c, d) => seg(p, a, b) * (1 - seg(p, c, d));
  const n = v => Math.round(v * 100) / 100;
  const quad = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

  const CAM = [
    { p: 0, x: 450, y: 312, s: 1.42 },
    { p: .17, x: 450, y: 322, s: 1.5 },
    { p: .24, x: 450, y: 340, s: 1.62 },
    { p: .37, x: 450, y: 340, s: 1.62 },
    { p: .42, x: 450, y: 338, s: 1.95 },
    { p: .6, x: 450, y: 338, s: 1.95 },
    { p: .67, x: 875, y: 362, s: 1.75 },
    { p: .8, x: 875, y: 362, s: 1.75 },
    { p: .9, x: 1400, y: 338, s: 1.32 },
    { p: 1, x: 1400, y: 338, s: 1.32 }
  ];
  function cam(p) {
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (p <= b.p) { const t = eIO(seg(p, a.p, b.p)); return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t) }; }
    }
    return CAM[CAM.length - 1];
  }

  const SANS = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const tag = (k, x, y, text, w) => `
    <g data-k="${k}" transform="translate(${x} ${y})" opacity="0">
      <g data-k="${k}-in">
        <rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="#1d1511" fill-opacity=".88" stroke="#e2a46b" stroke-opacity=".55"/>
        <circle cx="${-w / 2 + 15}" cy="0" r="4" fill="#ff9a45"/>
        <text data-k="${k}-t" x="${-w / 2 + 26}" y="4.6" font-family="${SANS}" font-size="13" font-weight="600" fill="#f4eadf">${text}</text>
      </g>
    </g>`;

  const FLAME = 'M0 0C-30 0-36-26-26-48C-18-64-10-72-6-100C4-84 22-72 28-52C36-26 30 0 0 0Z';
  const FL = [
    { x: 0, w: 1.25, h: 1.5, d: 0 },
    { x: -46, w: .9, h: 1.08, d: -.35 },
    { x: 48, w: .95, h: 1.15, d: -.7 },
    { x: -84, w: .6, h: .72, d: -.2 },
    { x: 84, w: .62, h: .78, d: -.55 }
  ];
  const FISH = 'M-92 2C-82-18-52-28-12-28C28-28 52-17 64-7L88-26C93-27 95-23 94-19L86 2L94 22C95 26 93 29 88 28L64 11C52 20 28 28-12 28C-52 28-82 20-92 2Z';
  const COALS = [[-104, 4, 16], [-80, -2, 19], [-54, 3, 17], [-28, -3, 21], [0, 2, 20], [28, -2, 19], [54, 3, 18], [80, -1, 17], [104, 4, 15]];
  const blob = (r, i) => {
    let d = '';
    for (let k = 0; k < 7; k++) {
      const a = k / 7 * Math.PI * 2, rr = r * (.82 + .2 * Math.sin(k * 2.7 + i));
      d += `${k ? 'L' : 'M'}${n(Math.cos(a) * rr)} ${n(Math.sin(a) * rr * .55)}`;
    }
    return d + 'Z';
  };

  function bars() {
    let d = '';
    for (let i = 0; i <= 10; i++) d += `M${n(336 + i * 22.8)} 334L${n(312 + i * 27.6)} 370`;
    return d;
  }

  const MARKUP = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
<style>
  .sc-lumbre-flick{transform-box:fill-box;transform-origin:50% 100%;animation:sc-lumbre-flick .9s ease-in-out infinite alternate}
  @keyframes sc-lumbre-flick{0%{transform:scale(1,1) skewX(0)}40%{transform:scale(.93,1.08) skewX(3deg)}100%{transform:scale(1.05,.94) skewX(-3deg)}}
  .sc-lumbre-pulse{animation:sc-lumbre-pulse 1.6s ease-in-out infinite alternate}
  @keyframes sc-lumbre-pulse{to{opacity:.55}}
  .sc-lumbre-wave{animation:sc-lumbre-wave 2.2s linear infinite}
  .sc-lumbre-wave+.sc-lumbre-wave{animation-delay:-.75s}.sc-lumbre-wave+.sc-lumbre-wave+.sc-lumbre-wave{animation-delay:-1.5s}
  @keyframes sc-lumbre-wave{0%{transform:translateY(8px);opacity:0}40%{opacity:1}100%{transform:translateY(-26px);opacity:0}}
  .sc-lumbre-wisp{animation:sc-lumbre-rise 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
  .sc-lumbre-wisp+.sc-lumbre-wisp{animation-delay:-1.5s}
  @keyframes sc-lumbre-rise{0%{transform:translateY(6px) scaleY(.8);opacity:0}35%{opacity:.75}100%{transform:translateY(-16px) scaleY(1.15);opacity:0}}
  body.motion-paused .sc-lumbre-amb,body.motion-paused .sc-lumbre-amb *{animation:none!important}
  @media (prefers-reduced-motion:reduce){.sc-lumbre-amb,.sc-lumbre-amb *{animation:none!important}}
</style>
<defs>
  <linearGradient id="sc-lumbre-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110c09"/><stop offset="1" stop-color="#1f1612"/></linearGradient>
  <pattern id="sc-lumbre-brick" width="64" height="26" patternUnits="userSpaceOnUse">
    <path d="M0 .5H64M0 13.5H64M.5 0V13M32.5 13V26" stroke="#000" stroke-opacity=".35" stroke-width="1.4" fill="none"/>
    <rect x="2" y="2" width="28" height="10" fill="#fff" opacity=".015"/><rect x="34" y="15" width="28" height="10" fill="#fff" opacity=".02"/>
  </pattern>
  <linearGradient id="sc-lumbre-face" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a1d16"/><stop offset=".5" stop-color="#3a2a20"/><stop offset="1" stop-color="#2a1d16"/></linearGradient>
  <linearGradient id="sc-lumbre-cave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#060403"/><stop offset="1" stop-color="#1c110b"/></linearGradient>
  <radialGradient id="sc-lumbre-fireglow" cx=".5" cy=".92" r=".8"><stop offset="0" stop-color="#ff9a45" stop-opacity=".95"/><stop offset=".45" stop-color="#c2461a" stop-opacity=".45"/><stop offset="1" stop-color="#5a1a08" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-lumbre-room" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".4"/><stop offset=".5" stop-color="#e2672a" stop-opacity=".12"/><stop offset="1" stop-color="#e2672a" stop-opacity="0"/></radialGradient>
  <linearGradient id="sc-lumbre-f1" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff5a1f"/><stop offset=".7" stop-color="#ff7a2f"/><stop offset="1" stop-color="#ffb347" stop-opacity=".2"/></linearGradient>
  <linearGradient id="sc-lumbre-f2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#ffd27a" stop-opacity=".6"/></linearGradient>
  <linearGradient id="sc-lumbre-bark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4e2e"/><stop offset="1" stop-color="#3b2414"/></linearGradient>
  <radialGradient id="sc-lumbre-coal" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#ffd27a"/><stop offset=".45" stop-color="#ff7a2f"/><stop offset="1" stop-color="#7a210b"/></radialGradient>
  <radialGradient id="sc-lumbre-shadow"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-lumbre-smoke"><stop offset="0" stop-color="#cfc4ba" stop-opacity=".38"/><stop offset="1" stop-color="#cfc4ba" stop-opacity="0"/></radialGradient>
  <linearGradient id="sc-lumbre-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a302a"/><stop offset="1" stop-color="#241d19"/></linearGradient>
  <linearGradient id="sc-lumbre-raw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4c585e"/><stop offset=".42" stop-color="#97a4a9"/><stop offset=".8" stop-color="#dfe4e2"/><stop offset="1" stop-color="#f0eee8"/></linearGradient>
  <linearGradient id="sc-lumbre-cook" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a10"/><stop offset=".45" stop-color="#a8622c"/><stop offset=".8" stop-color="#d9a062"/><stop offset="1" stop-color="#ecc792"/></linearGradient>
  <linearGradient id="sc-lumbre-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2f20"/><stop offset="1" stop-color="#5e3c27"/></linearGradient>
  <linearGradient id="sc-lumbre-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd59a" stop-opacity=".2"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></linearGradient>
  <linearGradient id="sc-lumbre-copper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e2a46b"/><stop offset=".5" stop-color="#b8693a"/><stop offset="1" stop-color="#7a3f1e"/></linearGradient>
  <radialGradient id="sc-lumbre-vig" cx=".5" cy=".48" r=".72"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  <clipPath id="sc-lumbre-arch"><path d="M300 430V262Q300 168 450 168Q600 168 600 262V430Z"/></clipPath>
  <clipPath id="sc-lumbre-fishclip"><path d="${FISH}"/></clipPath>
</defs>

<rect width="1200" height="560" fill="#15100d"/>
<g data-k="wall">
  <rect x="-800" y="-500" width="3400" height="1500" fill="url(#sc-lumbre-wall)"/>
  <rect x="-800" y="-500" width="3400" height="1500" fill="url(#sc-lumbre-brick)"/>
  <!-- cuadro y estante del comedor -->
  <g transform="translate(1180 228)">
    <rect x="-62" y="-46" width="124" height="92" rx="3" fill="#2b1d15" stroke="#5a3f2c" stroke-width="5"/>
    <rect x="-50" y="-34" width="100" height="68" fill="#e9dccb" opacity=".9"/>
    <path d="M-16 22C-30 4-12-8-6-26C0-10 22 0 10 22Z" fill="#e2a46b"/>
    <path d="M-4 22C-12 12-2 4 0-6C4 4 12 12 4 22Z" fill="#c8572a"/>
    <path d="M-30 24H30" stroke="#3a2a20" stroke-width="2"/>
  </g>
  <rect x="1560" y="236" width="200" height="8" rx="2" fill="#4a3324"/>
  <g fill="#2a3a2c">
    <path d="M1590 236V196Q1590 186 1596 182V166H1604V182Q1610 186 1610 196V236Z"/>
    <path d="M1626 236V200Q1626 190 1633 186V170H1641V186Q1648 190 1648 200V236Z" fill="#4a1c22"/>
    <path d="M1664 236V204Q1664 196 1670 193V180H1678V193Q1684 196 1684 204V236Z" fill="#3b2a18"/>
  </g>
  <path d="M1592 200V228M1628 204V228" stroke="#fff" stroke-opacity=".12" stroke-width="3" stroke-linecap="round"/>
</g>

<g data-k="world">
  <!-- Resplandor del fuego sobre la sala -->
  <ellipse data-k="room" cx="450" cy="360" rx="620" ry="420" fill="url(#sc-lumbre-room)" opacity=".3"/>

  <!-- Hogar -->
  <path d="M250 60H650L620-260H280Z" fill="#1a120e"/>
  <rect x="226" y="58" width="448" height="372" fill="url(#sc-lumbre-face)"/>
  <rect x="226" y="58" width="448" height="372" fill="url(#sc-lumbre-brick)"/>
  <rect x="210" y="48" width="480" height="16" rx="3" fill="#4a3324"/>
  <rect x="210" y="62" width="480" height="5" fill="#000" opacity=".3"/>
  <path d="M300 430V262Q300 168 450 168Q600 168 600 262V430Z" fill="url(#sc-lumbre-cave)"/>
  <path data-k="cave" d="M300 430V262Q300 168 450 168Q600 168 600 262V430Z" fill="url(#sc-lumbre-fireglow)" opacity=".2"/>
  <g clip-path="url(#sc-lumbre-arch)" opacity=".35"><path d="M300 200H600M300 226H600M300 252H600M300 278H600M300 304H600M300 330H600M300 356H600M300 382H600" stroke="#000" stroke-width="1.5"/></g>
  <path d="M289 430V262Q289 157 450 157Q611 157 611 262V430" fill="none" stroke="#4e372a" stroke-width="22" stroke-dasharray="25 3"/>
  <path d="M278 430V262Q278 146 450 146Q622 146 622 262V430" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="2"/>
  <rect x="437" y="134" width="26" height="32" rx="2" fill="#5e4333"/>
  <rect x="300" y="408" width="300" height="22" fill="#0e0907"/>

  <!-- Brasas -->
  <g data-k="coals" opacity="0" transform="translate(450 412)">
    ${COALS.map(([x, y, r], i) => `<path d="${blob(r + 3, i + 3)}" transform="translate(${x} ${y + 2})" fill="#231a16"/>`).join('')}
    <g class="sc-lumbre-amb"><g class="sc-lumbre-pulse">
      ${COALS.map(([x, y, r], i) => `<path d="${blob(r * .82, i)}" transform="translate(${x} ${y - 1})" fill="url(#sc-lumbre-coal)"/>`).join('')}
    </g></g>
  </g>

  <!-- Leña -->
  <g data-k="logs">
    <g transform="translate(450 408)">
      <rect x="-96" y="-20" width="182" height="20" rx="10" fill="url(#sc-lumbre-bark)"/>
      <ellipse cx="82" cy="-10" rx="7" ry="10" fill="#c9955f" stroke="#8a5a32" stroke-width="2"/>
      <g transform="translate(-12 -18) rotate(-9)"><rect x="-82" y="-18" width="150" height="18" rx="9" fill="url(#sc-lumbre-bark)"/><ellipse cx="-78" cy="-9" rx="6" ry="9" fill="#c9955f" stroke="#8a5a32" stroke-width="2"/></g>
      <g transform="translate(22 -30) rotate(12)"><rect x="-62" y="-15" width="118" height="15" rx="7.5" fill="url(#sc-lumbre-bark)"/><ellipse cx="52" cy="-7.5" rx="5.5" ry="7.5" fill="#c9955f" stroke="#8a5a32" stroke-width="2"/></g>
      <path d="M-30-40L20-14M-6-50L10-14M24-48L-8-16" stroke="#8a5a35" stroke-width="3" stroke-linecap="round"/>
      <g data-k="char" opacity="0" fill="#160c07">
        <rect x="-96" y="-20" width="182" height="20" rx="10"/>
        <g transform="translate(-12 -18) rotate(-9)"><rect x="-82" y="-18" width="150" height="18" rx="9"/></g>
        <g transform="translate(22 -30) rotate(12)"><rect x="-62" y="-15" width="118" height="15" rx="7.5"/></g>
      </g>
      <path data-k="cracks" d="M-70-12l14 4 10-6 16 5M-20-10l18 3 12-5M30-12l16 4 14-5M-60-30l14 3 12-4M10-38l14 4 12-3" stroke="#ff8a3d" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0"/>
    </g>
  </g>

  <!-- Llamas -->
  <g data-k="flames" transform="translate(450 398)">
    ${FL.map((f, i) => `<g data-k="f${i}"><g class="sc-lumbre-amb"><g class="sc-lumbre-flick" style="animation-delay:${f.d}s">
      <path d="${FLAME}" fill="url(#sc-lumbre-f1)"/>
      <path d="${FLAME}" transform="scale(.68 .74)" fill="url(#sc-lumbre-f2)"/>
      <path d="${FLAME}" transform="scale(.36 .44)" fill="#fff1c9"/>
    </g></g></g>`).join('')}
  </g>
  <g data-k="sparks" fill="#ffc070">${Array.from({ length: 12 }, () => '<circle r="2"/>').join('')}</g>
  <g data-k="shim" opacity="0"><g class="sc-lumbre-amb">
    <path class="sc-lumbre-wave" d="M380 360q10-7 20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#ffc890" stroke-opacity=".28" stroke-width="2" fill="none"/>
    <path class="sc-lumbre-wave" d="M370 340q10-7 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0" stroke="#ffc890" stroke-opacity=".22" stroke-width="2" fill="none"/>
    <path class="sc-lumbre-wave" d="M390 320q10-7 20 0t20 0t20 0t20 0t20 0t20 0" stroke="#ffc890" stroke-opacity=".18" stroke-width="2" fill="none"/>
  </g></g>

  <!-- Parrilla -->
  <g data-k="grate" opacity="0">
    <path d="M340 336V412M560 336V412M318 370V428M582 370V428" stroke="#1d1917" stroke-width="6" stroke-linecap="round"/>
    <path d="${bars()}" stroke="#46403c" stroke-width="3.4" stroke-linecap="round"/>
    <path d="${bars()}" stroke="#8a7f77" stroke-width="1" stroke-linecap="round" transform="translate(-1 -1)" opacity=".7"/>
    <path data-k="hot" d="${bars()}" stroke="#ff8a3d" stroke-width="3.4" stroke-linecap="round" opacity="0"/>
    <path d="M336 334H564L588 370H312Z" fill="none" stroke="#3b3633" stroke-width="5" stroke-linejoin="round"/>
    <path d="M338 332H562" stroke="#8a7f77" stroke-width="1.4" opacity=".7"/>
  </g>
  <g data-k="smoke">${Array.from({ length: 5 }, () => '<circle r="12" fill="url(#sc-lumbre-smoke)"/>').join('')}</g>

  <!-- Pase (encimera de piedra) -->
  <rect x="-800" y="430" width="1880" height="42" fill="url(#sc-lumbre-stone)"/>
  <rect x="-800" y="430" width="1880" height="2" fill="#6a5a4e" opacity=".55"/>
  <rect x="-800" y="472" width="1880" height="500" fill="#17110e"/>
  <rect x="-800" y="472" width="1880" height="6" fill="#000" opacity=".4"/>
  <path d="M-200 478V900M200 478V900M700 478V900" stroke="#2a201b" stroke-width="2"/>
  <!-- riel de comandas -->
  <g transform="translate(0 0)">
    <path d="M770 238H990" stroke="#8a7f77" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(906 240) rotate(3)">
      <rect x="-30" y="0" width="60" height="78" fill="#efe4d4"/>
      <text x="0" y="22" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#2a1d15">MESA 4</text>
      <path d="M-20 34H20M-20 46H12M-20 58H16" stroke="#7a6a5c" stroke-width="2"/>
    </g>
    <g transform="translate(830 240) rotate(-2)" opacity=".7"><rect x="-24" y="0" width="48" height="62" fill="#d9ccbb"/><path d="M-14 16H14M-14 28H8M-14 40H12" stroke="#7a6a5c" stroke-width="2"/></g>
  </g>
  <!-- tabla y utensilios del pase -->
  <path d="M752 432H1006L1022 464H736Z" fill="#5a3b26"/>
  <path d="M736 464H1022V470H736Z" fill="#3a2516"/>
  <g transform="translate(1040 448)">
    <ellipse cx="0" cy="6" rx="34" ry="8" fill="url(#sc-lumbre-shadow)"/>
    <path d="M-30-6Q-28 10 0 11Q28 10 30-6Z" fill="#cdbba6"/><ellipse cx="0" cy="-6" rx="30" ry="8" fill="#e9dccb"/>
    <path d="M-16-8l8-5 7 4-8 4zM2-10l9-4 6 5-9 3zM-6-4l8-3 6 4-8 2z" fill="#7aa33a"/>
  </g>
  <g transform="translate(726 432)">
    <path d="M-12 0V-44Q-12-52-6-55V-70H6V-55Q12-52 12-44V0Z" fill="#4a5a2a" opacity=".9"/>
    <rect x="-6" y="-76" width="12" height="7" rx="2" fill="#2a1d15"/>
    <path d="M-6-40V-8" stroke="#fff" stroke-opacity=".2" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Mesa del comedor -->
  <path data-k="cone" d="M1322 132L1170 470H1520L1368 132Z" fill="url(#sc-lumbre-cone)"/>
  <path d="M1110 404H1680L1714 470H1076Z" fill="url(#sc-lumbre-table)"/>
  <path d="M1140 416C1300 412 1500 420 1660 414M1120 440C1320 436 1520 446 1690 440M1100 458C1300 456 1500 462 1702 458" stroke="#2a190f" stroke-opacity=".45" stroke-width="1.5" fill="none"/>
  <path d="M1076 470H1714V488H1076Z" fill="#26170e"/>
  <rect x="1098" y="488" width="18" height="140" fill="#1d120c"/><rect x="1674" y="488" width="18" height="140" fill="#1d120c"/>
  <ellipse cx="1345" cy="442" rx="160" ry="34" fill="#f4eadf" opacity=".06"/>
  <path d="M1206 462L1224 420M1217 462L1235 420" stroke="#b9b2aa" stroke-width="3" stroke-linecap="round"/>
  <!-- copa -->
  <g transform="translate(1300 0)">
    <ellipse cx="0" cy="412" rx="20" ry="4.5" fill="#d8d0c6" opacity=".4"/>
    <rect x="-1.5" y="362" width="3" height="50" fill="#e8e0d6" opacity=".45"/>
    <path d="M-22 304Q-24 356 0 362Q24 356 22 304Z" fill="#fff" fill-opacity=".07" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/>
    <path d="M-21.5 330Q-21 356 0 360Q21 356 21.5 330Z" fill="#6e1a22"/>
    <ellipse cx="0" cy="330" rx="21.5" ry="4.5" fill="#8a2833"/>
    <path d="M-15 312Q-17 336-10 350" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
  <!-- vela -->
  <ellipse data-k="cglow" cx="1165" cy="392" rx="150" ry="110" fill="url(#sc-lumbre-room)" opacity="0"/>
  <g transform="translate(1165 0)">
    <ellipse cx="0" cy="434" rx="24" ry="5" fill="url(#sc-lumbre-shadow)"/>
    <rect x="-11" y="398" width="22" height="34" rx="3" fill="#f2e3cb"/>
    <rect x="-11" y="398" width="7" height="34" rx="3" fill="#fff" opacity=".35"/>
    <path d="M0 398V391" stroke="#2a1d15" stroke-width="1.6"/>
    <g data-k="candle" transform="translate(0 393) scale(0)"><g class="sc-lumbre-amb"><g class="sc-lumbre-flick">
      <path d="${FLAME}" transform="scale(.17 .26)" fill="#ffb347"/>
      <path d="${FLAME}" transform="scale(.09 .15)" fill="#fff1c9"/>
    </g></g></g>
    <path d="M-17 386H17L15 434Q0 438-15 434Z" fill="#fff" fill-opacity=".07" stroke="#fff" stroke-opacity=".25"/>
  </g>
  <!-- lámpara -->
  <path d="M1345-300V100" stroke="#0c0806" stroke-width="2"/>
  <path d="M1312 132Q1314 100 1345 98Q1376 100 1378 132Z" fill="url(#sc-lumbre-copper)"/>
  <ellipse cx="1345" cy="132" rx="20" ry="5" fill="#ffe2a8"/>

  <!-- Plato -->
  <g data-k="plate" opacity="0">
    <ellipse cx="4" cy="14" rx="124" ry="30" fill="url(#sc-lumbre-shadow)"/>
    <ellipse cx="0" cy="4" rx="112" ry="32" fill="#b9a893"/>
    <ellipse cx="0" cy="0" rx="112" ry="32" fill="#f1e8dc"/>
    <ellipse cx="0" cy="0" rx="101" ry="28" fill="none" stroke="#e2a46b" stroke-opacity=".55" stroke-width="1.4"/>
    <ellipse cx="0" cy="3" rx="80" ry="20" fill="#e5d9c9"/>
    <ellipse cx="0" cy="4" rx="76" ry="18" fill="#ece2d4"/>
    <path data-k="sauce" d="M-74 8C-50 22 20 26 66 10" stroke="#c4512a" stroke-width="7" stroke-linecap="round" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
  </g>

  <!-- Pescado -->
  <g data-k="fish" opacity="0">
    <ellipse data-k="fshadow" cx="0" cy="26" rx="92" ry="12" fill="url(#sc-lumbre-shadow)"/>
    <g data-k="flip">
      <path d="M-22-26Q0-44 36-21Q10-25-22-26Z" fill="#5d6a6f"/>
      <path d="M8 24Q24 36 44 16Q26 22 8 24Z" fill="#8a979b"/>
      <path d="${FISH}" fill="url(#sc-lumbre-raw)"/>
      <path data-k="cook" d="${FISH}" fill="url(#sc-lumbre-cook)" opacity="0"/>
      <g clip-path="url(#sc-lumbre-fishclip)">
        ${[0, 1, 2, 3, 4, 5].map(i => `<path data-k="m${i}" d="M${-50 + i * 21} -30L${-32 + i * 21} 30" pathLength="1" stroke="#26120a" stroke-width="4.6" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1" opacity=".85"/>`).join('')}
      </g>
      <path d="M-56-20Q-45 0-56 20" stroke="#2c2f30" stroke-opacity=".45" stroke-width="2.2" fill="none"/>
      <path d="M-48 4Q-36 16-26 8Q-36 6-48 4Z" fill="#7c878b" opacity=".8"/>
      <path d="M-44-4Q10-9 62-3" stroke="#fff" stroke-opacity=".22" stroke-width="1.6" fill="none"/>
      <circle cx="-72" cy="-6" r="5.2" fill="#f2efe8"/>
      <circle data-k="pupil" cx="-72.5" cy="-6" r="2.8" fill="#151515"/>
      <path d="M-91 3L-83 5" stroke="#2c2f30" stroke-width="1.6" stroke-linecap="round"/>
    </g>
  </g>
  <g data-k="sizzle" fill="#fff4dc">${Array.from({ length: 6 }, () => '<circle r="1.8"/>').join('')}</g>

  <!-- Guarnición -->
  <g data-k="garn">
    <g data-k="lime"><path d="M44 2A16 16 0 0 1 76 2Z" fill="#dbe9a6" stroke="#6e9a2f" stroke-width="3.5" stroke-linejoin="round"/><path d="M60 2V-12M60 2L50-8M60 2L70-8" stroke="#b9cf7a" stroke-width="1.2"/></g>
    <g data-k="h0"><path d="M0 0C-6-6-2-12 6-10C10-4 6 2 0 0Z" fill="#6f9a3a"/></g>
    <g data-k="h1"><path d="M0 0C-7-4-5-11 3-11C9-6 6 1 0 0Z" fill="#8fb54b"/></g>
    <g data-k="h2"><path d="M0 0C-6-6-2-12 6-10C10-4 6 2 0 0Z" fill="#7aa33a"/></g>
    <g data-k="h3"><path d="M0 0C-7-4-5-11 3-11C9-6 6 1 0 0Z" fill="#6f9a3a"/></g>
    <g data-k="dots" fill="#d4652f"><circle cx="-64" cy="-2" r="4.6"/><circle cx="-52" cy="-6" r="3.6"/><circle cx="-42" cy="-9" r="2.8"/></g>
    <g data-k="fsteam" opacity="0"><g class="sc-lumbre-amb">
      <path class="sc-lumbre-wisp" d="M-14-18C-22-30-6-38-14-52" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path class="sc-lumbre-wisp" d="M14-16C22-30 6-40 14-56" stroke="#fff" stroke-opacity=".45" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    </g></g>
  </g>

  <!-- Tarjeta de mesa -->
  <g data-k="card" transform="translate(1550 456)">
    <g data-k="cardIn">
      <ellipse cx="6" cy="2" rx="84" ry="8" fill="url(#sc-lumbre-shadow)"/>
      <path d="M-78-112H78L86-4H-86Z" fill="#c9b9a4"/>
      <path d="M-84-110H84V-2H-84Z" fill="#f4eadf"/>
      <rect x="-76" y="-102" width="152" height="92" fill="none" stroke="#e2a46b" stroke-opacity=".7"/>
      <text x="0" y="-80" text-anchor="middle" font-family="Georgia,serif" font-size="13" letter-spacing="4" fill="#a8632f">LUMBRE</text>
      <text x="0" y="-48" text-anchor="middle" font-family="Georgia,serif" font-size="19.5" fill="#1f1610">Mesa 4 · servido</text>
      <g data-k="tick" transform="translate(0 -26)">
        <circle cx="-44" cy="-4" r="7" fill="#a8632f"/>
        <path d="M-47.5-4l2.6 2.6 4.6-5" stroke="#f4eadf" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="-31" y="1" font-family="${SANS}" font-size="12.5" fill="#6b5240">lubina a la brasa</text>
      </g>
    </g>
  </g>

  ${tag('t1', 450, 216, 'Leña de encina', 128)}
  ${tag('t2', 450, 216, 'Brasa a 300 °C', 132)}
  ${tag('t3', 450, 252, 'Lubina · 4 min por lado', 190)}
  ${tag('t4', 875, 330, 'Lima · hierbas · romesco', 196)}
</g>
<rect width="1200" height="560" fill="url(#sc-lumbre-vig)" pointer-events="none"/>
</svg>`;

  function mount(stage) {
    stage.innerHTML = MARKUP;
    const svg = stage.querySelector('svg');
    const $ = k => svg.querySelector(`[data-k="${k}"]`);
    const set = (el, attrs) => { for (const a in attrs) el.setAttribute(a, attrs[a]); };
    const tr = (el, s) => el.setAttribute('transform', s);
    const op = (el, v) => el.setAttribute('opacity', n(clamp(v)));

    const R = {
      wall: $('wall'), world: $('world'), room: $('room'), cave: $('cave'), coals: $('coals'), logs: $('logs'),
      char: $('char'), cracks: $('cracks'), flames: FL.map((_, i) => $(`f${i}`)), sparks: [...$('sparks').children],
      shim: $('shim'), grate: $('grate'), hot: $('hot'), smoke: [...$('smoke').children], sizzle: [...$('sizzle').children],
      fish: $('fish'), flip: $('flip'), cook: $('cook'), pupil: $('pupil'), fshadow: $('fshadow'),
      marks: [0, 1, 2, 3, 4, 5].map(i => $(`m${i}`)),
      plate: $('plate'), sauce: $('sauce'), garn: $('garn'), lime: $('lime'), herbs: [0, 1, 2, 3].map(i => $(`h${i}`)), dots: $('dots'), fsteam: $('fsteam'),
      candle: $('candle'), cglow: $('cglow'), card: $('card'), cardIn: $('cardIn'), tick: $('tick'),
      tags: ['t1', 't2', 't3', 't4'].map(k => ({ g: $(k), in: $(`${k}-in`), t: $(`${k}-t`) }))
    };
    const tagShow = (i, v) => { const t = R.tags[i]; op(t.g, v); tr(t.in, `translate(0 ${n((1 - eOut(v)) * 10)})`); };
    const HERBS = [[-22, -12, -20], [-4, -16, 15], [14, -13, -35], [30, -9, 40]];
    const drop = (el, t, x, y, r = 0) => { op(el, Math.min(1, t * 3)); tr(el, `translate(${x} ${n(y - 70 * (1 - eBack(t)))}) rotate(${r})`); };

    function render(p) {
      const c = cam(p);
      tr(R.world, `translate(600 280) scale(${n(c.s)}) translate(${n(-c.x)} ${n(-c.y)})`);
      const ws = 1 + (c.s - 1) * .75;
      tr(R.wall, `translate(600 280) scale(${n(ws)}) translate(${n(-lerp(600, c.x, .85))} ${n(-lerp(280, c.y, .85))})`);

      // 1 · Encendemos la leña · 2 · Brasas listas.
      const grow = eBack(seg(p, .02, .15));
      const settle = eIO(seg(p, .19, .31));
      const I = (.14 + .86 * grow) * lerp(1, .26, settle);
      FL.forEach((f, i) => {
        let k = I * (1 + .06 * Math.sin(i * 1.9));
        if (i > 2) k *= 1 - .85 * settle;
        if (i === 0 && p < .02) k = .14;
        if (i > 0 && p < .05) k *= seg(p, .015 + i * .006, .05);
        tr(R.flames[i], `translate(${f.x} 0) scale(${n(f.w * Math.max(k, .001))} ${n(f.h * Math.max(k, .001))})`);
      });
      const burn = eIO(seg(p, .12, .32));
      const coal = eIO(seg(p, .15, .3));
      op(R.char, burn * .82);
      op(R.cracks, seg(p, .1, .24) * (.6 + .4 * coal));
      tr(R.logs, `translate(0 408) scale(1 ${n(1 - .38 * burn)}) translate(0 -408)`);
      op(R.coals, coal);
      const glow = clamp(.22 + .78 * Math.max(Math.min(I, 1), coal * .78));
      op(R.cave, glow);
      op(R.room, glow * .9);
      const sparkAmt = Math.min(1, I) * (.35 + .65 * bell(p, .03, .07, .2, .3)) + .25 * coal;
      R.sparks.forEach((s, i) => {
        const t = frac(p * (16 + (i % 4) * 3) + i / 12);
        set(s, {
          cx: n(450 + (i - 5.5) * 10 + Math.sin(t * 6 + i) * 16 * t),
          cy: n(392 - t * (150 + (i % 3) * 30)),
          r: n(2.3 * (1 - t * .6)),
          opacity: n(sparkAmt * (1 - t) * Math.min(1, t * 8))
        });
      });
      op(R.shim, bell(p, .24, .3, .6, .66) * .9);
      tagShow(0, bell(p, .05, .07, .17, .19));
      tagShow(1, bell(p, .25, .27, .355, .372));
      R.tags[1].t.textContent = `Brasa a ${Math.round(lerp(120, 300, eIO(seg(p, .24, .32))))} °C`;

      // Parrilla.
      const g = seg(p, .3, .355);
      op(R.grate, Math.min(1, g * 4));
      tr(R.grate, `translate(0 ${n(-120 * (1 - eBack(g)))})`);
      op(R.hot, eIO(seg(p, .34, .42)) * .55 * (1 - .4 * seg(p, .62, .7)));

      // 3 · Pescado a la parrilla.
      const d = seg(p, .39, .425);
      const cook = eIO(seg(p, .42, .6));
      const ft = seg(p, .495, .535), fa = Math.PI * eIO(ft);
      let sx = Math.cos(fa), lift = Math.sin(fa) * 58, rot = Math.sin(fa) * -6;
      const sq = seg(p, .425, .44);
      let fx = 450, fy = 350 - 140 * (1 - eIn(d)) - lift, fs = .82, sy = 1 - (sq > 0 && sq < 1 ? .14 * Math.sin(Math.PI * sq) : 0);
      // 4 · Emplatamos: plato al pase y el pescado vuela hasta él.
      const ps = seg(p, .6, .645);
      const tv = eIO(seg(p, .81, .885));
      const pl = seg(p, .885, .905);
      let px = lerp(1180, 875, eOut(ps)), py = 446;
      if (tv > 0) { px = quad(875, 1110, 1345, tv); py = quad(446, 370, 446, tv); }
      if (pl > 0 && pl < 1) py -= Math.sin(Math.PI * pl) * 4;
      op(R.plate, Math.min(1, ps * 3));
      tr(R.plate, `translate(${n(px)} ${n(py)})`);
      R.sauce.setAttribute('stroke-dashoffset', n(1 - eIO(seg(p, .655, .69))));
      const fl = eIO(seg(p, .635, .7));
      if (fl > 0) {
        fx = quad(450, 660, px, fl); fy = quad(350, 210, py - 8, fl);
        fs = lerp(.82, .7, fl); rot = Math.sin(Math.PI * fl) * 14;
      }
      const fland = seg(p, .7, .72);
      if (fland > 0 && fland < 1) sy = 1 - .1 * Math.sin(Math.PI * fland);
      op(R.fish, Math.min(1, d * 5));
      tr(R.fish, `translate(${n(fx)} ${n(fy)}) rotate(${n(rot)}) scale(${n(fs * (2 - sy))} ${n(fs * .7 * sy)})`);
      tr(R.flip, `scale(${n(Math.abs(sx) < .02 ? .02 * Math.sign(sx || 1) : sx)} 1)`);
      set(R.fshadow, { opacity: n(1 - Math.sin(fa) * .6 - fl * (1 - fl) * 2) });
      op(R.cook, cook * .92);
      op(R.pupil, 1 - cook * .75);
      const m = p < .515 ? seg(p, .435, .49) : seg(p, .53, .57);
      R.marks.forEach((mk, i) => mk.setAttribute('stroke-dashoffset', n(1 - eOut(clamp(m * 1.8 - i * .16)))));
      const sizz = bell(p, .425, .44, .6, .63) * (1 - (ft > 0 && ft < 1 ? 1 : 0));
      R.sizzle.forEach((s, i) => {
        const t = frac(p * 55 + i / 6);
        set(s, { cx: n(450 + (i - 2.5) * 34 + Math.sin(i * 3) * 6), cy: n(368 - Math.sin(Math.PI * t) * 16), opacity: n(sizz * Math.sin(Math.PI * t)) });
      });
      const smoke = bell(p, .41, .44, .6, .64);
      R.smoke.forEach((s, i) => {
        const t = frac(p * 13 + i / 5);
        set(s, { cx: n(450 + (i - 2) * 30 + Math.sin(t * 4 + i) * 12), cy: n(338 - t * 150), r: n(12 + t * 30), opacity: n(smoke * (1 - t) * Math.min(1, t * 5)) });
      });
      tagShow(2, bell(p, .445, .46, .585, .6));

      // Guarnición (cae con rebote sobre el plato).
      tr(R.garn, `translate(${n(px)} ${n(py - 6)})`);
      drop(R.lime, seg(p, .705, .73), 0, 0);
      R.herbs.forEach((h, i) => drop(h, seg(p, .72 + i * .011, .742 + i * .011), HERBS[i][0], HERBS[i][1], HERBS[i][2]));
      drop(R.dots, seg(p, .76, .78), 0, 6);
      op(R.fsteam, seg(p, .72, .77));
      tagShow(3, bell(p, .765, .78, .81, .83));

      // 5 · Servimos: vela encendida y tarjeta de mesa.
      const lit = eBack(seg(p, .84, .87));
      tr(R.candle, `translate(0 393) scale(${n(Math.max(0, lit))})`);
      op(R.cglow, eOut(seg(p, .84, .89)) * .9);
      const ct = seg(p, .905, .955);
      op(R.card, Math.min(1, ct * 4));
      tr(R.cardIn, `scale(1 ${n(Math.max(.001, eBack(ct)))})`);
      const tk = seg(p, .945, .97);
      op(R.tick, tk);
      tr(R.tick, `translate(${n(-8 * (1 - eOut(tk)))} -26)`);
    }

    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.lumbre = {
    title: 'Del fuego a tu mesa en LUMBRE',
    duration: 10500,
    steps: [
      { label: 'Encendemos la leña', at: 0 },
      { label: 'Brasas listas', at: .2 },
      { label: 'Pescado a la parrilla', at: .38 },
      { label: 'Emplatamos', at: .6 },
      { label: 'Servimos', at: .8 }
    ],
    mount
  };
})();
