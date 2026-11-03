'use strict';
// Escena animada de Maré: café y croissant preparados paso a paso.
// render(p) es una función pura del progreso (0..1); solo el vapor ambiental usa CSS.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t * t;
  const eIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const frac = v => v - Math.floor(v);
  const bell = (p, a, b, c, d) => seg(p, a, b) * (1 - seg(p, c, d));
  const n = v => Math.round(v * 100) / 100;
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`; };
  const quad = (a, c, b, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;

  // Cámara: claves {p, x, y, s}; entre claves se interpola con easing (las claves repetidas sostienen el plano).
  const CAM = [
    { p: 0, x: 430, y: 300, s: 1.35 },
    { p: .05, x: 300, y: 300, s: 1.9 },
    { p: .145, x: 300, y: 300, s: 1.9 },
    { p: .2, x: 600, y: 312, s: 1.9 },
    { p: .335, x: 600, y: 312, s: 1.9 },
    { p: .37, x: 715, y: 315, s: 1.9 },
    { p: .49, x: 715, y: 315, s: 1.9 },
    { p: .535, x: 610, y: 380, s: 1.6 },
    { p: .655, x: 610, y: 380, s: 1.6 },
    { p: .7, x: 1010, y: 318, s: 1.8 },
    { p: .835, x: 1010, y: 318, s: 1.8 },
    { p: .905, x: 650, y: 330, s: 1.2 },
    { p: 1, x: 650, y: 330, s: 1.2 }
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
        <rect x="${-w / 2}" y="-15" width="${w}" height="30" rx="15" fill="#fffaf2" stroke="#a4572c" stroke-opacity=".35"/>
        <circle cx="${-w / 2 + 15}" cy="0" r="4" fill="#a4572c"/>
        <text data-k="${k}-t" x="${-w / 2 + 26}" y="4.6" font-family="${SANS}" font-size="13" font-weight="600" fill="#33251c">${text}</text>
      </g>
    </g>`;

  // Granos del molino (cuadrícula con algo de azar fijo).
  function beansMarkup() {
    let out = '', crease = '';
    let k = 0;
    for (let row = 0; row < 6; row++) {
      const y = 236 - row * 9;
      for (let col = 0; col < 6; col++) {
        const x = 270 + col * 12 + (row % 2) * 5.5 + Math.sin(k * 3.1) * 1.5;
        const r = (k * 47) % 180;
        out += `<ellipse cx="${n(x)}" cy="${y}" rx="6.2" ry="4.3" transform="rotate(${r} ${n(x)} ${y})" fill="${k % 3 ? '#5e321a' : '#6f3d20'}"/>`;
        const a = r * Math.PI / 180, dx = Math.cos(a) * 4.5, dy = Math.sin(a) * 4.5;
        crease += `M${n(x - dx)} ${n(y - dy)}Q${n(x + dy * .3)} ${n(y - dx * .3)} ${n(x + dx)} ${n(y + dy)}`;
        k++;
      }
    }
    return out + `<path d="${crease}" fill="none" stroke="#2c160a" stroke-width="1" stroke-linecap="round" opacity=".7"/>`;
  }

  const CROIS = [
    'M-40 8C-46 11-50 9-49 4C-48 0-45-2-41-1C-42 2-42 5-40 8Z',
    'M40 8C46 11 50 9 49 4C48 0 45-2 41-1C42 2 42 5 40 8Z',
    'M-28 10C-37 11-43 5-42-2C-41-8-35-11-29-9C-31-3-31 4-28 10Z',
    'M28 10C37 11 43 5 42-2C41-8 35-11 29-9C31-3 31 4 28 10Z',
    'M-12 12C-22 13-30 6-30-4C-30-12-22-17-13-16C-17-6-16 4-12 12Z',
    'M12 12C22 13 30 6 30-4C30-12 22-17 13-16C17-6 16 4 12 12Z',
    'M-13 12C-17-4-10-21 0-21C10-21 17-4 13 12C6 15-6 15-13 12Z'
  ];

  // Hojas de la rosetta (vista cenital).
  const LEAVES = Array.from({ length: 7 }, (_, i) => {
    const y = 40 - i * 13, w = 50 - i * 5.4, h = 12 - i * .9, k = w * .5;
    return `M${-w} ${y}Q0 ${n(y + k + h * 1.6)} ${w} ${y}Q0 ${n(y + k - h * .6)} ${-w} ${y}Z`;
  });

  function slats() {
    let d = '';
    for (let x = -560; x < 1800; x += 46) d += `M${x} 486V900`;
    return d;
  }

  const MARKUP = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
<style>
  .sc-mare-wisp{animation:sc-mare-rise 2.8s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
  .sc-mare-wisp+.sc-mare-wisp{animation-delay:-1.4s}
  @keyframes sc-mare-rise{0%{transform:translateY(5px) scaleY(.8);opacity:0}35%{opacity:.9}100%{transform:translateY(-12px) scaleY(1.15);opacity:0}}
  .sc-mare-hum{animation:sc-mare-hum 2.4s ease-in-out infinite alternate}
  @keyframes sc-mare-hum{to{opacity:.72}}
  body.motion-paused .sc-mare-amb,body.motion-paused .sc-mare-amb *{animation:none!important}
  @media (prefers-reduced-motion:reduce){.sc-mare-amb,.sc-mare-amb *{animation:none!important}}
</style>
<defs>
  <linearGradient id="sc-mare-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f0e5"/><stop offset="1" stop-color="#ecdcc6"/></linearGradient>
  <radialGradient id="sc-mare-sun"><stop offset="0" stop-color="#fffbf4" stop-opacity=".95"/><stop offset="1" stop-color="#fffbf4" stop-opacity="0"/></radialGradient>
  <linearGradient id="sc-mare-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d1b9"/><stop offset=".3" stop-color="#eee2d1"/><stop offset="1" stop-color="#f5ecdf"/></linearGradient>
  <linearGradient id="sc-mare-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6644"/><stop offset="1" stop-color="#6a4129"/></linearGradient>
  <linearGradient id="sc-mare-ink" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#553d2f"/><stop offset=".5" stop-color="#3a2a20"/><stop offset="1" stop-color="#241911"/></linearGradient>
  <linearGradient id="sc-mare-terra" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cd7b50"/><stop offset=".55" stop-color="#a4572c"/><stop offset="1" stop-color="#83401f"/></linearGradient>
  <linearGradient id="sc-mare-cream" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffbf5"/><stop offset=".55" stop-color="#f4e9da"/><stop offset="1" stop-color="#ddc9ae"/></linearGradient>
  <linearGradient id="sc-mare-steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfcac3"/><stop offset=".22" stop-color="#fbfaf8"/><stop offset=".6" stop-color="#b3aca4"/><stop offset="1" stop-color="#857d74"/></linearGradient>
  <linearGradient id="sc-mare-trayg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7a678"/><stop offset="1" stop-color="#c08a5c"/></linearGradient>
  <radialGradient id="sc-mare-shadow"><stop offset="0" stop-color="#33251c" stop-opacity=".34"/><stop offset=".6" stop-color="#33251c" stop-opacity=".12"/><stop offset="1" stop-color="#33251c" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-mare-crema" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#e0ab72"/><stop offset=".55" stop-color="#b8743a"/><stop offset="1" stop-color="#7a3d19"/></radialGradient>
  <radialGradient id="sc-mare-heat" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#ffdf9a"/><stop offset=".45" stop-color="#f59a42"/><stop offset="1" stop-color="#9c4317"/></radialGradient>
  <radialGradient id="sc-mare-glow"><stop offset="0" stop-color="#ffb35c" stop-opacity=".6"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-mare-puff"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-mare-vig" cx=".5" cy=".46" r=".75"><stop offset=".6" stop-color="#5a3a24" stop-opacity="0"/><stop offset="1" stop-color="#5a3a24" stop-opacity=".18"/></radialGradient>
  <linearGradient id="sc-mare-crois" x1="0" y1="0" x2="0" y2="1"><stop data-k="cs0" offset="0" stop-color="#f6e3bb"/><stop data-k="cs1" offset="1" stop-color="#e3c48f"/></linearGradient>
  <linearGradient id="sc-mare-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe0cb"/><stop offset="1" stop-color="#e2cdb0"/></linearGradient>
  <radialGradient id="sc-mare-milk" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffdf8"/><stop offset="1" stop-color="#efe3d1"/></radialGradient>
  <clipPath id="sc-mare-hopclip"><path d="M259 153H341L318 238H282Z"/></clipPath>
  <clipPath id="sc-mare-lensclip"><circle r="172"/></clipPath>
</defs>

<rect width="1200" height="560" fill="#f4eadc"/>

<!-- Pared (con un leve paralaje) -->
<g data-k="wall">
  <rect x="-700" y="-500" width="2600" height="1500" fill="url(#sc-mare-wall)"/>
  <ellipse cx="210" cy="60" rx="560" ry="380" fill="url(#sc-mare-sun)"/>
  <path d="M40-60H230L600 400H410Z" fill="#fffaf2" opacity=".28"/>
  <path d="M260-60H330L700 400H630Z" fill="#fffaf2" opacity=".2"/>
  <rect x="30" y="148" width="1160" height="10" rx="3" fill="#94613f"/>
  <rect x="30" y="158" width="1160" height="7" fill="#33251c" opacity=".08"/>
  <path d="M110 158l10 18h6l-4-18zM640 158l10 18h6l-4-18zM1120 158l10 18h6l-4-18z" fill="#7a4e33"/>
  <!-- tarros -->
  <g transform="translate(80 104)">
    <rect x="0" y="6" width="34" height="38" rx="7" fill="#fffaf2" opacity=".7" stroke="#33251c" stroke-opacity=".15"/>
    <rect x="3" y="22" width="28" height="20" rx="5" fill="#6f3d20"/>
    <rect x="-2" y="0" width="38" height="9" rx="3" fill="#a4572c"/>
  </g>
  <g transform="translate(126 116)">
    <rect x="0" y="4" width="28" height="28" rx="6" fill="#fffaf2" opacity=".7" stroke="#33251c" stroke-opacity=".15"/>
    <rect x="3" y="14" width="22" height="16" rx="4" fill="#d9b98c"/>
    <rect x="-2" y="0" width="32" height="7" rx="3" fill="#33251c"/>
  </g>
  <!-- planta -->
  <g transform="translate(232 148)">
    <path d="M-14 0L-18-26H18L14 0Z" fill="url(#sc-mare-terra)"/>
    <path d="M0-26C-4-46-22-52-30-48C-22-40-12-34 0-26ZM0-26C2-50 16-62 26-58C20-46 10-36 0-26ZM0-26C-10-52-4-70 4-74C8-60 6-42 0-26Z" fill="#7d8b5a"/>
    <path d="M0-26C10-40 30-40 36-34C26-28 12-26 0-26Z" fill="#66744a"/>
  </g>
  <!-- tazas apiladas -->
  <g transform="translate(470 148)" fill="#fbf6ee" stroke="#33251c" stroke-opacity=".14">
    <path d="M-16 0H16L18-14H-18Z"/><path d="M-16-15H16L18-29H-18Z"/><path d="M-16-30H16L18-44H-18Z"/>
  </g>
  <g transform="translate(512 148)" fill="#a4572c"><path d="M-16 0H16L18-14H-18Z"/><path d="M-16-15H16L18-29H-18Z" fill="#c47148"/></g>
  <!-- bolsa de café -->
  <g transform="translate(790 148)">
    <path d="M-24 0L-22-56L-14-62H14L22-56L24 0Z" fill="#c9a074"/>
    <path d="M-22-56L-14-62H14L22-56Z" fill="#b48c62"/>
    <rect x="-16" y="-42" width="32" height="26" rx="3" fill="#fffaf2"/>
    <text x="0" y="-25" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#a4572c">Maré</text>
  </g>
  <!-- planta colgante -->
  <g transform="translate(1010 148)">
    <path d="M-16 0L-20-24H20L16 0Z" fill="#efe2cf" stroke="#33251c" stroke-opacity=".15"/>
    <path d="M-12 0C-20 20-14 40-22 58M6 0C14 18 8 34 16 50" stroke="#7d8b5a" stroke-width="2" fill="none"/>
    <path d="M-17 14l-8 2 7 4zM-15 30l-8 1 7 5zM-20 46l-8 2 7 4zM10 12l8 1-6 5zM12 28l8 2-7 4zM14 42l8 2-7 4z" fill="#7d8b5a"/>
    <path d="M0-24C-6-40-20-44-26-40C-18-34-8-28 0-24ZM0-24C4-42 18-48 24-44C16-36 8-30 0-24Z" fill="#66744a"/>
  </g>
  <g transform="translate(1100 106)">
    <rect x="0" y="4" width="32" height="38" rx="7" fill="#fffaf2" opacity=".7" stroke="#33251c" stroke-opacity=".15"/>
    <rect x="3" y="20" width="26" height="20" rx="5" fill="#8a4a24"/>
    <rect x="-2" y="0" width="36" height="8" rx="3" fill="#33251c"/>
  </g>
</g>

<g data-k="world">
  <!-- Encimera -->
  <rect x="-700" y="398" width="2600" height="74" fill="url(#sc-mare-top)"/>
  <rect x="-700" y="398" width="2600" height="2.5" fill="#33251c" opacity=".14"/>
  <rect x="-700" y="470" width="2600" height="10" fill="#faf3e8"/>
  <rect x="-700" y="480" width="2600" height="500" fill="url(#sc-mare-wood)"/>
  <rect x="-700" y="480" width="2600" height="6" fill="#33251c" opacity=".2"/>
  <path d="${slats()}" stroke="#2a1a10" stroke-opacity=".14" stroke-width="2"/>

  <!-- Molino -->
  <g data-k="grinder">
    <ellipse cx="304" cy="410" rx="78" ry="9" fill="url(#sc-mare-shadow)"/>
    <rect x="240" y="384" width="124" height="26" rx="9" fill="url(#sc-mare-ink)"/>
    <path d="M258 386L268 252H332L342 386Z" fill="url(#sc-mare-ink)"/>
    <path d="M268 262L270 252H282L277 386H260Z" fill="#fff" opacity=".07"/>
    <rect x="263" y="236" width="74" height="20" rx="6" fill="url(#sc-mare-terra)"/>
    <g clip-path="url(#sc-mare-hopclip)">
      <rect x="250" y="150" width="100" height="90" fill="#fffaf2" opacity=".45"/>
      <g data-k="beans">${beansMarkup()}</g>
    </g>
    <path d="M259 153H341L318 238H282Z" fill="none" stroke="#33251c" stroke-opacity=".3" stroke-width="2" stroke-linejoin="round"/>
    <path d="M268 162L287 230" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>
    <rect x="252" y="140" width="96" height="14" rx="6" fill="url(#sc-mare-ink)"/>
    <rect x="292" y="131" width="16" height="11" rx="4" fill="url(#sc-mare-terra)"/>
    <circle cx="300" cy="284" r="11" fill="url(#sc-mare-terra)"/>
    <line data-k="dial" x1="300" y1="284" x2="300" y2="276" stroke="#fffaf2" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="290" y="312" width="20" height="15" rx="4" fill="#1d140e"/>
    <rect x="262" y="364" width="8" height="5" rx="2" fill="#1d140e"/><rect x="330" y="364" width="8" height="5" rx="2" fill="#1d140e"/>
    <circle cx="352" cy="397" r="3" fill="#8fb27a"/>
    <g data-k="grounds" fill="#5b3420">
      <circle r="1.8"/><circle r="1.5"/><circle r="1.9"/><circle r="1.4"/><circle r="1.7"/><circle r="1.5"/>
    </g>
  </g>
  <g data-k="fall">
    ${[0, 1, 2, 3, 4].map(() => '<g><ellipse rx="6.4" ry="4.4" fill="#6a381c"/><path d="M-4.5 0Q0-1.6 4.5 0" stroke="#2c160a" stroke-width="1.1" fill="none"/></g>').join('')}
  </g>

  <!-- Cafetera -->
  <g data-k="machine">
    <ellipse cx="604" cy="404" rx="182" ry="12" fill="url(#sc-mare-shadow)"/>
    <rect x="468" y="196" width="264" height="202" rx="18" fill="url(#sc-mare-cream)"/>
    <rect x="468.5" y="196.5" width="263" height="201" rx="18" fill="none" stroke="#33251c" stroke-opacity=".1"/>
    <rect x="468" y="214" width="264" height="27" fill="url(#sc-mare-terra)"/>
    <text x="600" y="233" text-anchor="middle" font-family="Georgia,serif" font-size="16" fill="#fbf1e4">Maré</text>
    <rect x="474" y="184" width="252" height="12" rx="5" fill="url(#sc-mare-steel)"/>
    <g fill="#fbf6ee" stroke="#33251c" stroke-opacity=".14">
      <path d="M498 184l2-15h28l2 15z"/><path d="M538 184l2-15h28l2 15z"/>
    </g>
    <path d="M578 184l2-15h28l2 15z" fill="#a4572c"/>
    <g transform="translate(544 268)">
      <circle r="16" fill="url(#sc-mare-steel)"/><circle r="12.5" fill="#fffaf2"/>
      <path d="M-8 6A10 10 0 1 1 8 6" fill="none" stroke="#a4572c" stroke-width="1.6" stroke-dasharray="1.5 2.6" opacity=".8"/>
      <line data-k="g1" x1="0" y1="0" x2="0" y2="-9" stroke="#33251c" stroke-width="1.8" stroke-linecap="round" transform="rotate(-120)"/>
      <circle r="2.2" fill="#33251c"/>
    </g>
    <g transform="translate(656 268)">
      <circle r="16" fill="url(#sc-mare-steel)"/><circle r="12.5" fill="#fffaf2"/>
      <path d="M-8 6A10 10 0 1 1 8 6" fill="none" stroke="#a4572c" stroke-width="1.6" stroke-dasharray="1.5 2.6" opacity=".8"/>
      <line data-k="g2" x1="0" y1="0" x2="0" y2="-9" stroke="#33251c" stroke-width="1.8" stroke-linecap="round" transform="rotate(-60)"/>
      <circle r="2.2" fill="#33251c"/>
    </g>
    <rect x="518" y="296" width="164" height="94" rx="12" fill="#e5d3bb"/>
    <rect x="518" y="296" width="164" height="10" rx="5" fill="#33251c" opacity=".06"/>
    <rect x="526" y="383" width="148" height="13" rx="3" fill="#3a2a20"/>
    <path d="M538 386v7M550 386v7M562 386v7M574 386v7M586 386v7M598 386v7M610 386v7M622 386v7M634 386v7M646 386v7M658 386v7" stroke="#6b5647" stroke-width="2"/>
    <rect x="732" y="244" width="14" height="13" rx="3" fill="#c9c3bb"/>
    <rect data-k="knob" x="733" y="230" width="12" height="14" rx="4" fill="url(#sc-mare-ink)"/>
    <circle cx="492" cy="268" r="3.5" fill="#8fb27a"/>
  </g>

  <!-- Jarra de leche (parte trasera) -->
  <ellipse data-k="pshadow" cx="790" cy="410" rx="36" ry="6" fill="url(#sc-mare-shadow)"/>
  <g data-k="pitch">
    <ellipse cx="790" cy="342" rx="24" ry="6" fill="#857d74"/>
    <g data-k="milk">
      <ellipse cx="790" cy="344" rx="21" ry="4.6" fill="url(#sc-mare-milk)"/>
      <g transform="translate(790 344) scale(1 .22)"><path data-k="swirl" d="M0 0m-14 0a14 14 0 1 1 14 14a9 9 0 1 1-9-9" stroke="#e2d4c0" stroke-width="3" fill="none"/></g>
    </g>
  </g>
  <path d="M746 250H760Q772 250 775 262L790 326" stroke="#a39b92" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M746 248.5H760Q770 248.5 773 260L788 325" stroke="#f4f2ee" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>
  <g data-k="pitchF">
    <path d="M766 342Q790 350 814 342L821 404Q790 412 759 404Z" fill="url(#sc-mare-steel)"/>
    <path d="M766 342L752 335Q758 345 767 350Z" fill="#d8d3cd"/>
    <path d="M814 352Q836 352 835 372Q834 389 818 392" fill="none" stroke="#9f978e" stroke-width="5" stroke-linecap="round"/>
    <path d="M766 342Q790 350 814 342" stroke="#fff" stroke-width="1.6" fill="none" opacity=".85"/>
  </g>
  <g data-k="puffs">${[0, 1, 2, 3, 4, 5].map(() => '<circle r="10" fill="url(#sc-mare-puff)"/>').join('')}</g>

  <!-- Horno -->
  <g transform="translate(20 0)"><g data-k="oven">
    <ellipse cx="992" cy="408" rx="126" ry="10" fill="url(#sc-mare-shadow)"/>
    <ellipse data-k="spill" cx="990" cy="420" rx="150" ry="26" fill="url(#sc-mare-glow)" opacity="0"/>
    <rect x="890" y="246" width="200" height="158" rx="16" fill="url(#sc-mare-ink)"/>
    <rect x="898" y="253" width="184" height="20" rx="7" fill="#1f150f"/>
    <circle cx="914" cy="263" r="6.5" fill="url(#sc-mare-terra)"/><circle cx="936" cy="263" r="6.5" fill="url(#sc-mare-terra)"/>
    <rect x="1026" y="256" width="48" height="14" rx="3" fill="#120c08"/>
    <text data-k="ovenT" x="1050" y="267" text-anchor="middle" font-family="${SANS}" font-size="10.5" font-weight="700" fill="#ffb35c">20°</text>
    <rect x="906" y="290" width="168" height="96" rx="8" fill="#1a110c"/>
    <rect data-k="ovenGlow" x="906" y="290" width="168" height="96" rx="8" fill="url(#sc-mare-heat)" opacity="0"/>
    <path d="M916 300H1064" stroke="#4a3226" stroke-width="3" stroke-linecap="round"/>
    <path data-k="elem" d="M916 300H1064" stroke="#ffcf7a" stroke-width="3" stroke-linecap="round" opacity="0"/>
    <path d="M912 372H1068M920 372v8M1060 372v8" stroke="#6b5647" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="904" y="398" width="16" height="8" rx="2" fill="#1d140e"/><rect x="1060" y="398" width="16" height="8" rx="2" fill="#1d140e"/>
  </g></g>

  <!-- Bandeja -->
  <g data-k="tray" transform="translate(-12 0)">
    <ellipse cx="610" cy="468" rx="196" ry="13" fill="url(#sc-mare-shadow)"/>
    <path d="M470 432Q471 427 478 427H742Q749 427 750 432L762 458Q764 463 758 463H462Q456 463 458 458Z" fill="url(#sc-mare-trayg)"/>
    <path d="M484 432H736L746 456H474Z" fill="#e6bb8e" opacity=".5"/>
    <path d="M458 459H762V465Q762 471 756 471H464Q458 471 458 465Z" fill="#9a6844"/>
    <path d="M506 446L560 432H620L600 458H496Z" fill="#fffaf2" opacity=".75"/>
    <ellipse cx="686" cy="449" rx="52" ry="10.5" fill="#d9c7b0"/>
    <ellipse cx="686" cy="447" rx="52" ry="10.5" fill="#f3e9db"/>
    <ellipse cx="686" cy="446.5" rx="37" ry="7" fill="#fbf6ee"/>
    <ellipse cx="686" cy="447" rx="46" ry="9" fill="none" stroke="#a4572c" stroke-opacity=".45" stroke-width="1.2"/>
  </g>

  <!-- Taza -->
  <g data-k="cup">
    <ellipse cx="2" cy="2" rx="44" ry="7" fill="url(#sc-mare-shadow)"/>
    <ellipse cx="0" cy="0" rx="36" ry="7.5" fill="#e6d8c5"/>
    <ellipse cx="0" cy="-1.5" rx="35" ry="7" fill="#f6eee3"/>
    <ellipse cx="0" cy="-2" rx="25" ry="4.6" fill="#fbf7f1" stroke="#e2d2bd" stroke-width=".8"/>
    <path d="M22-30Q37-31 36-21Q35-12 21-11" fill="none" stroke="#e5d7c4" stroke-width="6" stroke-linecap="round"/>
    <path d="M22-30Q35-31 34-21Q33-13 21-12" fill="none" stroke="#fbf6ef" stroke-width="3" stroke-linecap="round"/>
    <path d="M-25-36Q-25-8-12-3Q0 0 12-3Q25-8 25-36Z" fill="url(#sc-mare-cream)"/>
    <path d="M-24.6-26.5Q0-21 24.6-26.5L24.2-21.5Q0-16 -24.2-21.5Z" fill="#a4572c"/>
    <ellipse cx="0" cy="-36" rx="25" ry="6.4" fill="#fffaf3" stroke="#e0cfb8" stroke-width="1"/>
    <ellipse cx="0" cy="-35.6" rx="21.6" ry="4.9" fill="#e6d5bf"/>
    <ellipse data-k="coffee" cx="0" cy="-35" rx="21.5" ry="4.9" fill="#3f1f0e" opacity="0"/>
    <ellipse data-k="crema" cx="0" cy="-35.3" rx="21.5" ry="4.9" fill="url(#sc-mare-crema)" opacity="0"/>
    <g data-k="cupArt" opacity="0" transform="translate(0 -35.2) scale(.3 .07)">
      ${LEAVES.map(d => `<path d="${d}" fill="#fbf4e8"/>`).join('')}
      <path d="M0-58V62" stroke="#fbf4e8" stroke-width="5"/>
    </g>
    <g data-k="cupSteam" opacity="0"><g class="sc-mare-amb">
      <path class="sc-mare-wisp" d="M-6-44C-12-54 0-60-6-72" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".7"/>
      <path class="sc-mare-wisp" d="M6-44C12-56 0-62 7-76" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>
    </g></g>
  </g>

  <!-- Portafiltro -->
  <g data-k="pf">
    <path data-k="mound" d="M-22-8Q-19-23 0-25Q19-23 22-8Z" fill="#5b3420"/>
    <path d="M-26-7H26L21 9Q0 13-21 9Z" fill="url(#sc-mare-steel)"/>
    <rect x="-27" y="-10" width="54" height="5" rx="2.5" fill="#e4e0da"/>
    <path d="M24-3L36-1L96 9Q102 11 100 17Q98 21 92 20L34 10L24 6Z" fill="url(#sc-mare-ink)"/>
    <rect x="-7" y="8" width="14" height="7" rx="2" fill="#a9a29a"/>
    <path d="M-5 14v5M5 14v5" stroke="#8f8880" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- Cabezal (tapa el portafiltro al encajar) -->
  <rect x="566" y="262" width="68" height="10" rx="4" fill="url(#sc-mare-steel)"/>
  <path d="M574 270H626V286Q626 300 612 302H588Q574 300 574 286Z" fill="url(#sc-mare-steel)"/>
  <rect data-k="s1" x="593.5" y="325" width="3" height="0" rx="1.5" fill="#8a4a1e"/>
  <rect data-k="s2" x="603.5" y="325" width="3" height="0" rx="1.5" fill="#8a4a1e"/>

  <!-- Croissant -->
  <g data-k="crois">
    <ellipse cx="0" cy="14" rx="46" ry="5.5" fill="url(#sc-mare-shadow)"/>
    ${CROIS.map(d => `<path d="${d}" fill="url(#sc-mare-crois)" stroke="#7a3f17" stroke-opacity=".3" stroke-width="1.1" stroke-linejoin="round"/>`).join('')}
    <path d="M-6-15Q0-18 6-15M-24-9Q-20-12-15-11M24-9Q20-12 15-11" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
    <ellipse data-k="shine" cx="-3" cy="-11" rx="6" ry="3" fill="#fff" opacity="0"/>
  </g>

  <!-- Puerta del horno -->
  <g transform="translate(20 0)"><g data-k="door">
    <rect x="904" y="288" width="172" height="100" rx="11" fill="none" stroke="#2c1f17" stroke-width="12"/>
    <rect x="910" y="294" width="160" height="88" rx="5" fill="#ffd7a8" opacity=".05"/>
    <path d="M934 294H966L926 382H910V346Z" fill="#fff" opacity=".07"/>
    <rect x="930" y="275" width="120" height="7" rx="3.5" fill="url(#sc-mare-steel)"/>
    <rect x="936" y="280" width="5" height="8" fill="#857d74"/><rect x="1039" y="280" width="5" height="8" fill="#857d74"/>
  </g></g>

  <!-- Ticket -->
  <g data-k="ticket" opacity="0">
    <ellipse cx="6" cy="12" rx="66" ry="7" fill="url(#sc-mare-shadow)"/>
    <g data-k="paper">
      <path d="M-74-150H74V-8L66.6-2L59.2-8L51.8-2L44.4-8L37-2L29.6-8L22.2-2L14.8-8L7.4-2L0-8L-7.4-2L-14.8-8L-22.2-2L-29.6-8L-37-2L-44.4-8L-51.8-2L-59.2-8L-66.6-2L-74-8Z" fill="#33251c" opacity=".08" transform="translate(4 4)"/>
      <path d="M-74-150H74V-8L66.6-2L59.2-8L51.8-2L44.4-8L37-2L29.6-8L22.2-2L14.8-8L7.4-2L0-8L-7.4-2L-14.8-8L-22.2-2L-29.6-8L-37-2L-44.4-8L-51.8-2L-59.2-8L-66.6-2L-74-8Z" fill="#fffdf8"/>
      <text x="0" y="-124" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="4" fill="#a4572c">MARÉ</text>
      <line x1="-58" y1="-112" x2="58" y2="-112" stroke="#6b5647" stroke-opacity=".45" stroke-dasharray="3 3"/>
      <text x="0" y="-83" text-anchor="middle" font-family="Georgia,serif" font-size="23" fill="#33251c">Pedido M-104</text>
      <text x="0" y="-62" text-anchor="middle" font-family="${SANS}" font-size="12.5" fill="#6b5647">flat white · croissant</text>
      <g data-k="pill" transform="translate(0 -34)">
        <rect x="-50" y="-14" width="100" height="28" rx="14" fill="#a4572c"/>
        <path d="M-30 0l5 5 9-10" stroke="#fffaf2" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="-8" y="5.5" font-family="${SANS}" font-size="15" font-weight="700" fill="#fffaf2">listo</text>
      </g>
    </g>
    <rect x="-24" y="-6" width="48" height="16" rx="4" fill="#8e5e3f"/>
    <rect x="-24" y="-6" width="48" height="4" rx="2" fill="#33251c" opacity=".25"/>
  </g>

  ${tag('t1', 404, 300, '18 g · molido fino', 150)}
  ${tag('t2', 486, 330, '0 s · 36 ml', 116)}
  ${tag('t3', 852, 262, '20 °C', 82)}
  ${tag('t4', 1010, 222, '200 °C · 18 min', 140)}
</g>

<!-- Vista cenital del arte latte -->
<rect data-k="dim" x="-20" y="-20" width="1240" height="600" fill="#f4eadc" opacity="0" visibility="hidden"/>
<g data-k="lens" opacity="0" visibility="hidden">
  <circle cx="0" cy="14" r="196" fill="url(#sc-mare-shadow)"/>
  <circle r="180" fill="#fbf6ee"/>
  <g clip-path="url(#sc-mare-lensclip)">
    <rect x="-180" y="-180" width="360" height="360" fill="url(#sc-mare-board)"/>
    <path d="M-180-120C-80-110 20-140 180-118M-180-40C-60-30 60-60 180-36M-180 60C-60 70 40 40 180 64M-180 140C-80 150 60 120 180 146" stroke="#d2b896" stroke-width="2" fill="none" opacity=".5"/>
    <g transform="scale(1.2)">
    <circle cx="10" cy="12" r="128" fill="#33251c" opacity=".1"/>
    <circle r="126" fill="#efe4d5"/>
    <circle r="108" fill="#f9f4ec" stroke="#e5d7c4"/>
    <rect x="74" y="-15" width="62" height="30" rx="15" fill="#f6eee3" stroke="#e0d0bb"/>
    <circle cx="7" cy="9" r="93" fill="#33251c" opacity=".12"/>
    <circle r="91" fill="#fffaf3"/>
    <circle r="91" fill="none" stroke="#a4572c" stroke-width="3" opacity=".85"/>
    <circle r="80" fill="url(#sc-mare-crema)"/>
    <circle r="72" fill="none" stroke="#f0c48e" stroke-width="5" stroke-dasharray="1 7" stroke-linecap="round" opacity=".55"/>
    <circle cx="-22" cy="-30" r="22" fill="#f3c995" opacity=".25"/>
    <g data-k="art" transform="translate(0 8)">
      ${LEAVES.map((d, i) => `<path data-k="leaf${i}" d="${d}" fill="url(#sc-mare-milk)" opacity="0"/>`).join('')}
      <path data-k="head" d="M0-46C-11-52-12-64-4-65C-2-65 0-63 0-61C0-63 2-65 4-65C12-64 11-52 0-46Z" fill="url(#sc-mare-milk)" opacity="0"/>
      <path data-k="stem" d="M0-56V66" pathLength="1" stroke="#c78d55" stroke-width="2.4" stroke-linecap="round" fill="none" stroke-dasharray="1" stroke-dashoffset="1"/>
    </g>
    <g data-k="lp">
      <circle data-k="drop" r="6" fill="#fffdf8" opacity="0"/>
      <path d="M58-150L104-60" stroke="#9f978e" stroke-width="14" stroke-linecap="round" transform="translate(30 -10)"/>
      <circle cx="52" cy="-62" r="48" fill="url(#sc-mare-steel)"/>
      <circle cx="52" cy="-62" r="41" fill="url(#sc-mare-milk)"/>
      <path d="M-1 1L16-36Q30-30 38-20Z" fill="#cfc9c2"/>
      <path d="M4-4L18-30Q26-27 31-21Z" fill="#fdf9f2"/>
    </g>
    </g>
  </g>
  <circle r="180" fill="none" stroke="#fffaf2" stroke-width="7"/>
  <circle r="184" fill="none" stroke="#33251c" stroke-opacity=".14"/>
  <g transform="translate(0 214)">
    <rect x="-96" y="-17" width="192" height="34" rx="17" fill="#33251c"/>
    <text x="0" y="6" text-anchor="middle" font-family="${SANS}" font-size="16" font-weight="600" fill="#fbf1e4">Vista desde arriba</text>
  </g>
</g>

<rect width="1200" height="560" fill="url(#sc-mare-vig)" pointer-events="none"/>
</svg>`;

  function mount(stage) {
    stage.innerHTML = MARKUP;
    const svg = stage.querySelector('svg');
    const $ = k => svg.querySelector(`[data-k="${k}"]`);
    const set = (el, attrs) => { for (const a in attrs) el.setAttribute(a, attrs[a]); };
    const tr = (el, s) => el.setAttribute('transform', s);
    const op = (el, v) => el.setAttribute('opacity', n(clamp(v)));
    const show = (el, v) => { op(el, v); el.setAttribute('visibility', v > .001 ? 'visible' : 'hidden'); };

    const R = {
      wall: $('wall'), world: $('world'), grinder: $('grinder'), beans: $('beans'), dial: $('dial'),
      grounds: [...$('grounds').children], fall: [...$('fall').children],
      pf: $('pf'), mound: $('mound'), s1: $('s1'), s2: $('s2'), g1: $('g1'), g2: $('g2'), knob: $('knob'),
      cup: $('cup'), coffee: $('coffee'), crema: $('crema'), cupArt: $('cupArt'), cupSteam: $('cupSteam'),
      pitch: $('pitch'), pitchF: $('pitchF'), pshadow: $('pshadow'), milk: $('milk'), swirl: $('swirl'), puffs: [...$('puffs').children],
      dim: $('dim'), lens: $('lens'), lp: $('lp'), drop: $('drop'), stem: $('stem'), head: $('head'),
      leaves: Array.from({ length: 7 }, (_, i) => $(`leaf${i}`)),
      ovenGlow: $('ovenGlow'), elem: $('elem'), ovenT: $('ovenT'), spill: $('spill'), door: $('door'),
      crois: $('crois'), cs0: $('cs0'), cs1: $('cs1'), shine: $('shine'),
      ticket: $('ticket'), pill: $('pill'),
      tags: ['t1', 't2', 't3', 't4'].map(k => ({ g: $(k), in: $(`${k}-in`), t: $(`${k}-t`) }))
    };
    const tagShow = (i, v) => { const t = R.tags[i]; op(t.g, v); tr(t.in, `translate(0 ${n((1 - eOut(v)) * 10)})`); };

    // Posición de la taza (base del platillo) en coordenadas del mundo.
    function cupPos(p) {
      const t = eIO(seg(p, .53, .6));
      return { x: lerp(600, 540, t), y: lerp(384, 449, t) - Math.sin(Math.PI * t) * 40 };
    }

    function render(p) {
      // Cámara (y pared con paralaje).
      const c = cam(p);
      tr(R.world, `translate(600 280) scale(${n(c.s)}) translate(${n(-c.x)} ${n(-c.y)})`);
      const ws = 1 + (c.s - 1) * .8;
      tr(R.wall, `translate(600 280) scale(${n(ws)}) translate(${n(-lerp(600, c.x, .82))} ${n(-lerp(280, c.y, .82))})`);
      const toScreen = (x, y) => ({ x: 600 + (x - c.x) * c.s, y: 280 + (y - c.y) * c.s });

      // 1 · Molemos el grano.
      R.fall.forEach((b, i) => {
        const t = seg(p, .004 + i * .007, .03 + i * .007);
        const x = 292 + (i % 3) * 8 - 4, y = lerp(70, 196 + (i % 2) * 6, eIn(t));
        tr(b, `translate(${n(x)} ${n(y)}) rotate(${n(i * 50 + t * 260)})`);
        op(b, t > 0 && t < 1 ? 1 : 0);
      });
      const pile = 14 * (1 - eOut(seg(p, .015, .055))) + 34 * eIO(seg(p, .06, .14));
      tr(R.beans, `translate(0 ${n(pile)})`);
      const grind = bell(p, .055, .065, .135, .145);
      tr(R.grinder, `translate(${n(grind * Math.sin(p * 2600) * .7)} 0)`);
      tr(R.dial, `rotate(${n(150 * seg(p, .05, .065) - 150 * seg(p, .14, .155))} 300 284)`);
      R.grounds.forEach((g, i) => {
        const t = frac(p * 95 + i / 6);
        set(g, { cx: n(300 + ((i % 3) - 1) * 3.5 + Math.sin(i * 7 + t * 4)), cy: n(327 + t * 24), opacity: n(grind * (t < .85 ? 1 : (1 - t) / .15)) });
      });
      const mound = eOut(seg(p, .06, .14));
      tr(R.mound, `translate(0 -8) scale(1 ${n(Math.max(.001, mound))}) translate(0 8)`);
      tagShow(0, bell(p, .1, .118, .148, .165));

      // Portafiltro: del molino al grupo, sube y gira para encajar.
      const tc = eIO(seg(p, .15, .215));
      let px = lerp(300, 600, tc), py = lerp(366, 330, tc) - Math.sin(Math.PI * tc) * 44;
      let rot = -Math.sin(Math.PI * tc) * 6 - 16 * eIO(seg(p, .19, .215));
      if (p > .215) py = lerp(330, 306, eOut(seg(p, .215, .232)));
      rot += 16 * eBack(seg(p, .23, .25));
      tr(R.pf, `translate(${n(px)} ${n(py)}) rotate(${n(rot)})`);

      // 2 · Extraemos el espresso.
      const head = eOut(seg(p, .255, .27)), tail = eIn(seg(p, .318, .334));
      const top = 325 + tail * 24, bot = 325 + head * 24;
      const wob = Math.sin(p * 900) * .25;
      [R.s1, R.s2].forEach((s, i) => set(s, { y: n(top), height: n(Math.max(0, bot - top)), x: n((i ? 603.5 : 593.5) + wob), opacity: head > 0 && tail < 1 ? 1 : 0 }));
      const lvl = eIO(seg(p, .26, .33));
      set(R.coffee, { rx: n(lerp(13, 21.5, lvl)), ry: n(lerp(3.1, 4.9, lvl)), cy: n(lerp(-31, -35, lvl)), opacity: n(seg(p, .262, .272)) });
      op(R.crema, seg(p, .29, .345));
      const press = bell(p, .25, .265, .325, .345);
      tr(R.g1, `rotate(${n(-120 + 150 * press)})`);
      tr(R.g2, `rotate(${n(-60 + 70 * eIO(seg(p, .36, .4)) - 70 * eIO(seg(p, .48, .5)))})`);
      tagShow(1, bell(p, .26, .275, .335, .352));
      R.tags[1].t.textContent = `${Math.round(25 * seg(p, .255, .33))} s · 36 ml`;

      // Taza (se traslada a la bandeja oculta bajo la lupa).
      const cp = cupPos(p);
      tr(R.cup, `translate(${n(cp.x)} ${n(cp.y)})`);
      op(R.cupArt, seg(p, .63, .655));
      op(R.cupSteam, seg(p, .31, .35));

      // 3 · Texturizamos la leche.
      const lift = eIO(seg(p, .365, .395)) - eIO(seg(p, .475, .5));
      const steam = bell(p, .392, .405, .465, .478);
      const foam = eOut(seg(p, .4, .47));
      // La jarra se usa para verter (bajo la lupa) y luego se deja junto al molino.
      const go = eIO(seg(p, .535, .556)), back = eIO(seg(p, .628, .655));
      const pdx = lerp(lerp(0, -190, go), -374, back), pdy = -30 * lift - 60 * go * (1 - back);
      tr(R.pitch, `translate(${n(pdx)} ${n(pdy)})`);
      tr(R.pitchF, `translate(${n(pdx)} ${n(pdy)})`);
      set(R.pshadow, { cx: n(790 + pdx), rx: n(36 - lift * 8), opacity: n(1 - lift * .5 - go * (1 - back)) });
      tr(R.milk, `translate(790 ${n(344 - foam * 3)}) scale(${n(1 + foam * .04)}) translate(-790 -344)`);
      tr(R.swirl, `rotate(${n(p * 9000 % 360)})`);
      tr(R.knob, `rotate(${n(80 * steam)} 739 244)`);
      R.puffs.forEach((pf, i) => {
        const t = frac(p * 42 + i / 6);
        const x = 790 + Math.sin(i * 2.3 + t * 3) * 12 + (i % 2 ? 6 : -6);
        const y = 342 - 30 * lift - 6 - t * 52;
        set(pf, { cx: n(x), cy: n(y), r: n(7 + t * 12), opacity: n(steam * (1 - t) * Math.min(1, t * 5) * .9) });
      });
      tagShow(2, bell(p, .395, .41, .49, .505));
      R.tags[2].t.textContent = `${Math.round(lerp(20, 65, eIO(seg(p, .4, .47))))} °C`;

      // 4 · Dibujamos el arte latte (lupa cenital).
      const lo = seg(p, .5, .535), lc = seg(p, .635, .668);
      show(R.dim, .62 * eOut(lo) * (1 - eIO(lc)));
      const lensVis = p > .5 && lc < 1 ? Math.min(1, lo * 5) * (1 - seg(lc, .65, 1)) : 0;
      show(R.lens, lensVis);
      if (lensVis > 0) {
        const from = toScreen(600, 350), to = toScreen(cp.x, cp.y - 36);
        let lx, ly, lk;
        if (lc <= 0) { const t = eOut(lo); lx = lerp(from.x, 600, t); ly = lerp(from.y, 270, t); lk = lerp(.12, 1, eBack(lo)); }
        else { const t = eIO(lc); lx = lerp(600, to.x, t); ly = lerp(270, to.y, t); lk = lerp(1, .1, t); }
        tr(R.lens, `translate(${n(lx)} ${n(ly)}) scale(${n(lk)})`);

        // Jarra vista desde arriba: punto de vertido.
        let ppx = 0, ppy = 46;
        if (p >= .556 && p < .61) { const t = seg(p, .556, .61); ppy = lerp(44, -42, t); ppx = Math.sin((p - .556) * 760) * 13 * (1 - .55 * t); }
        else if (p >= .61) { ppy = lerp(-56, 66, eIO(seg(p, .612, .627))); }
        const a = eOut(seg(p, .532, .556)), away = eIO(seg(p, .624, .645));
        const off = (1 - a) + away;
        tr(R.lp, `translate(${n(ppx + off * 150)} ${n(ppy - off * 170)}) rotate(${n(Math.sin((p - .556) * 760) * 3 * (p > .556 && p < .61 ? 1 : 0))})`);
        op(R.drop, bell(p, .552, .557, .625, .629));
        R.leaves.forEach((leaf, i) => {
          const t = seg(p, .557 + i * .0072, .566 + i * .0072);
          op(leaf, Math.min(1, t * 2.5));
          const y = 40 - i * 13;
          tr(leaf, `translate(0 ${y}) scale(${n(.35 + .65 * eBack(t))} ${n(.5 + .5 * eOut(t))}) translate(0 ${-y})`);
        });
        const ht = seg(p, .607, .615);
        op(R.head, ht);
        tr(R.head, `translate(0 -55) scale(${n(.4 + .6 * eBack(ht))}) translate(0 55)`);
        R.stem.setAttribute('stroke-dashoffset', n(1 - eIO(seg(p, .612, .627))));
      }

      // 5 · Horneamos el croissant.
      const heatOn = eIO(seg(p, .675, .735));
      const heat = heatOn * (1 - .55 * eIO(seg(p, .835, .875)));
      op(R.ovenGlow, heat * .92);
      op(R.elem, heat);
      op(R.spill, heat * .9);
      R.ovenT.textContent = `${Math.round(lerp(20, 200, heatOn))}°`;
      const bake = eIO(seg(p, .7, .81));
      R.cs0.setAttribute('stop-color', mix('#f6e4bf', '#eaa44c', bake));
      R.cs1.setAttribute('stop-color', mix('#e5c896', '#a65a20', bake));
      op(R.shine, bake * .35);
      tagShow(3, bell(p, .71, .725, .818, .832));
      const open = eIO(seg(p, .835, .862)) - eIO(seg(p, .935, .965));
      tr(R.door, `translate(0 392) scale(1 ${n(1 - .86 * open)}) translate(0 -392)`);

      // 6 · Listo para recoger: el croissant vuela al plato y llega el ticket.
      const rise = eOut(seg(p, .7, .79));
      const ft = eIO(seg(p, .862, .93));
      let cx = 1010, cy = 358, cs = .84 + .16 * rise, cr = 0, sq = 1;
      if (ft > 0) {
        cx = quad(1010, 840, 674, ft); cy = quad(358, 250, 436, ft);
        cs = lerp(1, .8, ft); cr = Math.sin(Math.PI * ft) * -10;
      }
      const land = seg(p, .93, .955);
      if (land > 0 && land < 1) sq = 1 - .1 * Math.sin(Math.PI * land);
      tr(R.crois, `translate(${n(cx)} ${n(cy + 12 * cs)}) rotate(${n(cr)}) scale(${n(cs * (2 - sq))} ${n(cs * sq)}) translate(0 -12)`);

      const tk = seg(p, .905, .962);
      op(R.ticket, Math.min(1, tk * 4));
      tr(R.ticket, `translate(${n(826 + (1 - eOut(tk)) * 360)} 452) rotate(${n(lerp(16, -3, eBack(tk)))})`);
      const pt = seg(p, .95, .975);
      tr(R.pill, `translate(0 -34) scale(${n(lerp(.6, 1, eBack(pt)))})`);
      op(R.pill, pt > 0 ? 1 : 0);
    }

    return { render };
  }

  window.NexoEscenas = window.NexoEscenas || {};
  window.NexoEscenas.mare = {
    title: 'Así preparamos tu pausa en Maré',
    duration: 18000,
    steps: [
      { label: 'Molemos el grano', at: 0 },
      { label: 'Extraemos el espresso', at: .16 },
      { label: 'Texturizamos la leche', at: .34 },
      { label: 'Dibujamos el arte latte', at: .5 },
      { label: 'Horneamos el croissant', at: .66 },
      { label: 'Listo para recoger', at: .83 }
    ],
    mount
  };
})();
