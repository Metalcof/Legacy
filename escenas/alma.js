'use strict';
// Escena ALMA: reserva en línea → confirmación → llegada sin filas → consultorio → respiración → seguimiento.
(() => {
  window.NexoEscenas = window.NexoEscenas || {};

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => { const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const arch = (x, y, w, h) => `M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}Z`;

  const INK = '#24332a', MUTED = '#56635a', ACC = '#3d6a4f', WOOD = '#c8a27c', CREAM = '#f7f2e8', TERRA = '#c7765a';
  const UI = "font-family:'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif";
  const SERIF = "font-family:Georgia,'Times New Roman',serif";

  // Hoja con nervadura: nace en (0,0) y crece hacia arriba.
  const leaf = (len, wid, fill) => `<path d="M0 0C${-wid} ${-len * .3} ${-wid * .8} ${-len * .8} 0 ${-len}C${wid * .8} ${-len * .8} ${wid} ${-len * .3} 0 0Z" fill="${fill}"/><path d="M0 -4L0 ${-len + 10}" stroke="#ffffff" stroke-opacity=".25" stroke-width="2" fill="none"/>`;
  const shadowCard = (x, y, w, h, r) => `<rect x="${x}" y="${y + 14}" width="${w}" height="${h}" rx="${r}" fill="${INK}" opacity=".05"/><rect x="${x + 2}" y="${y + 5}" width="${w - 4}" height="${h}" rx="${r}" fill="${INK}" opacity=".06"/>`;

  const PLANT_LEAVES = [[-62, 150, 30], [-36, 175, 32], [-12, 190, 30], [14, 180, 32], [38, 165, 30], [64, 140, 28], [-84, 110, 24], [86, 105, 24]];

  function svgMarkup() {
    const days = [['lun', 12], ['mar', 13], ['mié', 14], ['jue', 15], ['vie', 16]].map(([d, n], i) => {
      const x = -100 + i * 41, on = i === 3;
      return `<rect x="${x}" y="-114" width="36" height="52" rx="13" fill="${on ? ACC : '#f0ede5'}"/>
        <text x="${x + 18}" y="-95" text-anchor="middle" font-size="11" fill="${on ? '#dbe8de' : MUTED}" style="${UI}">${d}</text>
        <text x="${x + 18}" y="-73" text-anchor="middle" font-size="17" font-weight="700" fill="${on ? '#fff' : INK}" style="${UI}">${n}</text>`;
    }).join('');
    const plantLeaves = PLANT_LEAVES.map(([a, l, w], i) =>
      `<g class="sc-alma-pleaf" data-i="${i}" data-a="${a}"><g>${leaf(l, w, i % 2 ? '#5d8a69' : '#4a7a58')}</g></g>`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
<style>
  .sc-alma-sway{transform-box:fill-box;transform-origin:50% 100%;animation:sc-alma-sway 7s ease-in-out infinite}
  .sc-alma-sway2{transform-box:fill-box;transform-origin:50% 100%;animation:sc-alma-sway 9s ease-in-out -3s infinite reverse}
  .sc-alma-steam{animation:sc-alma-steam 3.2s ease-in-out infinite}
  .sc-alma-steam2{animation:sc-alma-steam 3.2s ease-in-out -1.6s infinite}
  .sc-alma-glow{transform-box:fill-box;transform-origin:50% 50%;animation:sc-alma-glow 5s ease-in-out infinite}
  @keyframes sc-alma-sway{0%,100%{transform:rotate(-1.6deg)}50%{transform:rotate(1.6deg)}}
  @keyframes sc-alma-steam{0%{transform:translateY(6px);opacity:0}40%{opacity:.55}100%{transform:translateY(-18px);opacity:0}}
  @keyframes sc-alma-glow{0%,100%{opacity:.55}50%{opacity:.9}}
  body.motion-paused .sc-alma-sway,body.motion-paused .sc-alma-sway2,body.motion-paused .sc-alma-steam,body.motion-paused .sc-alma-steam2,body.motion-paused .sc-alma-glow{animation:none}
  @media (prefers-reduced-motion:reduce){.sc-alma-sway,.sc-alma-sway2,.sc-alma-steam,.sc-alma-steam2,.sc-alma-glow{animation:none}}
</style>
<defs>
  <linearGradient id="sc-alma-g-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1ea"/><stop offset="1" stop-color="#dfe6d8"/></linearGradient>
  <radialGradient id="sc-alma-g-blob" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f6efe2"/><stop offset="1" stop-color="#f6efe2" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-alma-g-blob2" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#cfdcca"/><stop offset="1" stop-color="#cfdcca" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-alma-g-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${INK}" stop-opacity=".32"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
  <linearGradient id="sc-alma-g-phone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b4a40"/><stop offset=".5" stop-color="#1d2621"/><stop offset="1" stop-color="#2e3a33"/></linearGradient>
  <linearGradient id="sc-alma-g-archbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9e2d2"/><stop offset="1" stop-color="#cdd8c5"/></linearGradient>
  <linearGradient id="sc-alma-g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5f1e8"/><stop offset="1" stop-color="#ebe3d4"/></linearGradient>
  <linearGradient id="sc-alma-g-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4b48d"/><stop offset="1" stop-color="#bf9a73"/></linearGradient>
  <linearGradient id="sc-alma-g-warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff9ec"/><stop offset="1" stop-color="#ffdca6"/></linearGradient>
  <linearGradient id="sc-alma-g-path" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4dc" stop-opacity=".95"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></linearGradient>
  <linearGradient id="sc-alma-g-door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#46765a"/><stop offset="1" stop-color="#355d45"/></linearGradient>
  <linearGradient id="sc-alma-g-rwall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0e7"/><stop offset="1" stop-color="#e2e7db"/></linearGradient>
  <linearGradient id="sc-alma-g-rfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4cfb1"/><stop offset="1" stop-color="#d2b28c"/></linearGradient>
  <linearGradient id="sc-alma-g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3d8cc"/><stop offset=".65" stop-color="#e9ead8"/><stop offset="1" stop-color="#f7e3c4"/></linearGradient>
  <linearGradient id="sc-alma-g-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c99c" stop-opacity="0"/><stop offset="1" stop-color="#f2b98a"/></linearGradient>
  <linearGradient id="sc-alma-g-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0" stop-opacity=".0"/><stop offset=".25" stop-color="#fffaf0" stop-opacity=".55"/><stop offset="1" stop-color="#fffaf0" stop-opacity=".05"/></linearGradient>
  <linearGradient id="sc-alma-g-pot" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d48a6c"/><stop offset="1" stop-color="#b8664b"/></linearGradient>
  <radialGradient id="sc-alma-g-breath" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#7fa58a"/><stop offset="1" stop-color="${ACC}"/></radialGradient>
  <radialGradient id="sc-alma-g-halo" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-alma-g-lamp" cx=".5" cy=".2" r=".6"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b8" stop-opacity="0"/></radialGradient>
  <clipPath id="sc-alma-doorclip"><path id="sc-alma-doorclip-p" d="${arch(525, 170, 150, 270)}"/></clipPath>
  <clipPath id="sc-alma-winclip"><path d="${arch(455, 70, 290, 300)}"/></clipPath>
  <clipPath id="sc-alma-screen"><rect x="-110" y="-230" width="220" height="460" rx="32"/></clipPath>
</defs>

<!-- Fondo base -->
<rect width="1200" height="560" fill="url(#sc-alma-g-bg)"/>
<circle cx="230" cy="110" r="260" fill="url(#sc-alma-g-blob)"/>
<circle cx="1010" cy="470" r="300" fill="url(#sc-alma-g-blob2)"/>

<!-- Acto 1-2: reserva y confirmación -->
<g id="sc-alma-ui1">
  <text x="60" y="78" font-size="34" fill="${INK}" style="${SERIF}">alma.</text>
  <g opacity=".9">
    <g transform="translate(150 560)"><g class="sc-alma-sway">${leaf(260, 60, '#b9cbb3')}</g></g>
    <g transform="translate(205 560) rotate(18)"><g class="sc-alma-sway2">${leaf(200, 46, '#a9bfa3')}</g></g>
    <g transform="translate(1060 560) rotate(-14)"><g class="sc-alma-sway2">${leaf(250, 58, '#b9cbb3')}</g></g>
  </g>
  <path id="sc-alma-archbg" d="${arch(430, 52, 340, 520)}" fill="url(#sc-alma-g-archbg)"/>
  <ellipse id="sc-alma-pshadow" cx="600" cy="528" rx="150" ry="16" fill="url(#sc-alma-g-shadow)"/>

  <g id="sc-alma-phone">
    <rect x="-124" y="-244" width="248" height="488" rx="44" fill="url(#sc-alma-g-phone)"/>
    <rect x="-120" y="-240" width="240" height="480" rx="41" fill="none" stroke="#5c6d62" stroke-width="1.5" opacity=".6"/>
    <g clip-path="url(#sc-alma-screen)">
      <rect x="-110" y="-230" width="220" height="460" fill="#fbfaf6"/>
      <rect x="-110" y="-230" width="220" height="120" fill="#f1efe6"/>
      <text x="-90" y="-196" font-size="11" font-weight="600" fill="${INK}" style="${UI}">9:41</text>
      <text x="-90" y="-148" font-size="30" fill="${INK}" style="${SERIF}">alma.</text>
      <circle cx="80" cy="-158" r="15" fill="#e6d6c0"/><text x="80" y="-153" text-anchor="middle" font-size="13" font-weight="700" fill="#8a6a4b" style="${UI}">L</text>
      <text x="-90" y="-124" font-size="12.5" fill="${MUTED}" style="${UI}">Agenda tu sesión</text>
      ${days}
      <text x="-98" y="-36" font-size="14" font-weight="700" fill="${INK}" style="${UI}">Jueves 15</text>
      <text x="98" y="-36" text-anchor="end" font-size="12" fill="${MUTED}" style="${UI}">3 horarios</text>
      <g opacity=".5"><rect x="-100" y="-22" width="200" height="46" rx="14" fill="#f0ede5"/>
        <text x="-84" y="7" font-size="17" font-weight="600" fill="${MUTED}" style="${UI}" text-decoration="line-through">10:00 a. m.</text>
        <text x="86" y="6" text-anchor="end" font-size="11" fill="${MUTED}" style="${UI}">ocupado</text></g>
      <rect x="-100" y="34" width="200" height="46" rx="14" fill="#fff" stroke="#dcd8cc"/>
      <rect id="sc-alma-slot" x="-100" y="34" width="200" height="46" rx="14" fill="${ACC}"/>
      <text x="-84" y="63" font-size="18" font-weight="700" fill="${INK}" style="${UI}">4:00 p. m.</text>
      <text id="sc-alma-slott" x="-84" y="63" font-size="18" font-weight="700" fill="#fff" style="${UI}">4:00 p. m.</text>
      <g id="sc-alma-slotchk" transform="translate(76 57)"><circle r="12" fill="#fff"/><path d="M-5 0l3.5 3.5L5.5-4" fill="none" stroke="${ACC}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" id="sc-alma-slotchkp"/></g>
      <rect x="-100" y="90" width="200" height="46" rx="14" fill="#fff" stroke="#dcd8cc"/>
      <text x="-84" y="119" font-size="18" font-weight="700" fill="${INK}" style="${UI}">5:30 p. m.</text>
      <rect x="-100" y="160" width="200" height="50" rx="25" fill="${INK}"/>
      <text x="0" y="191" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" style="${UI}">Reservar</text>
      <g id="sc-alma-btnok"><rect x="-100" y="160" width="200" height="50" rx="25" fill="${ACC}"/>
        <text x="0" y="191" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" style="${UI}">Reservado ✓</text></g>
    </g>
    <rect x="-36" y="-224" width="72" height="22" rx="11" fill="#141a16"/>
    <circle id="sc-alma-ripple" cx="20" cy="57" r="10" fill="none" stroke="${ACC}" stroke-width="3"/>
    <g id="sc-alma-touch"><circle r="24" fill="#ffffff" opacity=".55"/><circle r="24" fill="none" stroke="${INK}" stroke-opacity=".18" stroke-width="2"/><circle r="9" fill="#ffffff" opacity=".9"/></g>
  </g>

  <g id="sc-alma-bubble">
    <g transform="translate(0 0)">
      ${shadowCard(0, -150, 380, 142, 24)}
      <path d="M0 -40V2l26-20Z" fill="#dcefd8"/>
      <rect x="0" y="-150" width="380" height="142" rx="24" fill="#dcefd8"/>
      <circle cx="38" cy="-114" r="20" fill="${ACC}"/><text x="38" y="-107" text-anchor="middle" font-size="19" fill="#fff" style="${SERIF}">a.</text>
      <text x="68" y="-117" font-size="16" font-weight="700" fill="${INK}" style="${UI}">ALMA</text>
      <text x="68" y="-98" font-size="13" fill="${MUTED}" style="${UI}">recepción · en línea</text>
      <text x="22" y="-62" font-size="21" fill="${INK}" style="${UI}">¡Listo, Laura! Te esperamos</text>
      <text x="22" y="-34" font-size="21" fill="${INK}" style="${UI}">el <tspan font-weight="700">jueves a las 4:00</tspan> p. m.</text>
      <text x="318" y="-16" text-anchor="end" font-size="12" fill="${MUTED}" style="${UI}">9:42</text>
      <g id="sc-alma-ticks" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M326 -22l4 4 8-9"/><path d="M334 -18l1 1 8-9"/></g>
    </g>
  </g>

  <g id="sc-alma-remind">
    ${shadowCard(0, 0, 380, 100, 22)}
    <rect width="380" height="100" rx="22" fill="#fff"/>
    <circle cx="50" cy="50" r="28" fill="#e8efe6"/>
    <g id="sc-alma-bell" transform="translate(50 34)">
      <path d="M0 0c-9 0-14 7-14 15v8l-5 6h38l-5-6v-8C14 7 9 0 0 0Z" fill="${ACC}"/>
      <circle cy="32" r="4" fill="${ACC}"/><circle cy="-2" r="2.6" fill="${ACC}"/>
    </g>
    <text x="94" y="44" font-size="19" font-weight="700" fill="${INK}" style="${UI}">Recordatorio</text>
    <text x="94" y="70" font-size="16" fill="${MUTED}" style="${UI}">Mañana, 4:00 p. m. en ALMA</text>
    <rect x="262" y="-14" width="104" height="28" rx="14" fill="#f6e1d6"/>
    <text x="314" y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#a65a40" style="${UI}">1 día antes</text>
  </g>
</g>

<!-- Acto 3: recepción -->
<g id="sc-alma-recep">
  <rect x="-20" y="-20" width="1240" height="470" fill="url(#sc-alma-g-wall)"/>
  <rect x="-20" y="440" width="1240" height="140" fill="url(#sc-alma-g-floor)"/>
  <path d="M-20 470H1220M-20 508H1220" stroke="#b08a63" stroke-opacity=".35" stroke-width="1.5"/>
  <rect x="-20" y="430" width="1240" height="12" fill="#e2d6c3"/>
  <text x="600" y="128" text-anchor="middle" font-size="40" fill="${INK}" style="${SERIF}">alma.</text>
  <path d="${arch(512, 157, 176, 283)}" fill="${WOOD}"/>
  <path d="${arch(525, 170, 150, 270)}" fill="url(#sc-alma-g-warm)"/>
  <path id="sc-alma-lightpath" d="M525 440H675L830 580H370Z" fill="url(#sc-alma-g-path)"/>
  <g id="sc-alma-doorpanel">
    <path d="${arch(525, 170, 150, 270)}" fill="url(#sc-alma-g-door)"/>
    <path d="${arch(545, 196, 110, 110)}" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
    <rect x="545" y="322" width="110" height="96" rx="8" fill="none" stroke="#ffffff" stroke-opacity=".14" stroke-width="2"/>
    <circle cx="552" cy="312" r="6" fill="#e6c48d"/>
  </g>
  <!-- lámparas y mostrador -->
  <path d="M300 -20V120M410 -20V108" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/>
  <ellipse class="sc-alma-glow" cx="300" cy="200" rx="90" ry="90" fill="url(#sc-alma-g-lamp)"/>
  <path d="M276 140a24 24 0 0 1 48 0Z" fill="${TERRA}"/><path d="M388 128a22 22 0 0 1 44 0Z" fill="${WOOD}"/>
  <ellipse cx="350" cy="446" rx="130" ry="10" fill="url(#sc-alma-g-shadow)"/>
  <rect x="240" y="368" width="220" height="74" rx="6" fill="#efe5d4"/>
  <path d="M262 380V436M290 380V436M318 380V436M346 380V436M374 380V436M402 380V436M430 380V436" stroke="#dccdb5" stroke-width="3"/>
  <rect x="232" y="356" width="236" height="16" rx="6" fill="${WOOD}"/>
  <path d="M272 356l-8-34h40l-8 34Z" fill="${TERRA}"/>
  <g transform="translate(284 324)"><g class="sc-alma-sway">${leaf(52, 14, '#4a7a58')}</g></g>
  <g transform="translate(284 324) rotate(-38)">${leaf(40, 11, '#5d8a69')}</g>
  <g transform="translate(284 324) rotate(36)">${leaf(42, 11, '#5d8a69')}</g>
  <path d="M418 356l-6-12h46l-6 12Z" fill="#b9a68a"/>
  <rect x="404" y="300" width="58" height="44" rx="6" fill="${INK}" transform="rotate(-6 433 322)"/>
  <rect x="409" y="305" width="48" height="34" rx="3" fill="#e8efe6" transform="rotate(-6 433 322)"/>
  <!-- planta alta y cuadro -->
  <circle cx="860" cy="210" r="46" fill="#e2d8c6"/><circle cx="860" cy="210" r="34" fill="#cbd7c6"/><path d="M830 222q30-34 60 0" fill="#a9bfa3"/>
  <ellipse cx="860" cy="446" rx="60" ry="9" fill="url(#sc-alma-g-shadow)"/>
  <g transform="translate(860 362)"><g class="sc-alma-sway2">
    <g transform="rotate(-24)">${leaf(150, 30, '#4a7a58')}</g><g transform="rotate(8)">${leaf(170, 32, '#5d8a69')}</g><g transform="rotate(34)">${leaf(130, 28, '#4a7a58')}</g>
  </g></g>
  <path d="M826 360h68l-8 84h-52Z" fill="#efe5d4"/><path d="M826 360h68v8h-68Z" fill="#dccdb5"/>
  <!-- llegada registrada -->
  <g id="sc-alma-badge">
    ${shadowCard(-130, -40, 260, 80, 22)}
    <rect x="-130" y="-40" width="260" height="80" rx="22" fill="#fff"/>
    <circle cx="-92" cy="0" r="22" fill="${ACC}"/>
    <path id="sc-alma-badgechk" d="M-102 0l7 7 13-14" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/>
    <text x="-60" y="-5" font-size="18" font-weight="700" fill="${INK}" style="${UI}">Llegada registrada</text>
    <text x="-60" y="20" font-size="13.5" fill="${MUTED}" style="${UI}">3:58 p. m. · 0 min de espera</text>
  </g>
</g>

<!-- Acto 4-6: consultorio -->
<g id="sc-alma-roomclip" clip-path="url(#sc-alma-doorclip)">
 <g id="sc-alma-room">
  <rect x="-300" y="-200" width="1800" height="630" fill="url(#sc-alma-g-rwall)"/>
  <rect x="-300" y="430" width="1800" height="330" fill="url(#sc-alma-g-rfloor)"/>
  <rect x="-300" y="424" width="1800" height="10" fill="#f3eee4"/>
  <!-- ventana -->
  <path d="${arch(441, 56, 318, 324)}" fill="#f8f5ee"/>
  <g clip-path="url(#sc-alma-winclip)">
    <rect x="455" y="70" width="290" height="300" fill="url(#sc-alma-g-sky)"/>
    <rect id="sc-alma-dusk" x="455" y="70" width="290" height="300" fill="url(#sc-alma-g-dusk)"/>
    <path d="M455 330q70-46 150-20t140-14V370H455Z" fill="#a9c1a6"/>
    <path d="M455 350q90-30 170-6t120-4V370H455Z" fill="#8fae8f"/>
  </g>
  <path d="M600 74V370M455 248H745" stroke="#f8f5ee" stroke-width="7"/>
  <rect x="436" y="366" width="328" height="16" rx="5" fill="${WOOD}"/>
  <!-- círculo de respiración (vive en la ventana) -->
  <g id="sc-alma-breathg" transform="translate(600 214)">
    <circle id="sc-alma-halo" r="150" fill="url(#sc-alma-g-halo)"/>
    <circle id="sc-alma-ring" r="120" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="3 7" opacity=".9"/>
    <circle id="sc-alma-orb" r="80" fill="url(#sc-alma-g-breath)"/>
    <text id="sc-alma-tin" y="11" text-anchor="middle" font-size="32" font-style="italic" fill="#fff" style="${SERIF}">inhala</text>
    <text id="sc-alma-tout" y="11" text-anchor="middle" font-size="32" font-style="italic" fill="#fff" style="${SERIF}">exhala</text>
    <text id="sc-alma-tend" y="11" text-anchor="middle" font-size="32" font-style="italic" fill="#fff" style="${SERIF}">respira</text>
  </g>
  <!-- luz que entra -->
  <path id="sc-alma-beam" d="M462 380H738L860 620H360Z" fill="url(#sc-alma-g-beam)"/>
  <!-- tapete -->
  <g id="sc-alma-rug" transform="translate(600 498)"><ellipse rx="300" ry="40" fill="#e9dcc7"/><ellipse rx="270" ry="31" fill="none" stroke="#cdb894" stroke-width="2" stroke-dasharray="2 6"/><ellipse rx="230" ry="22" fill="none" stroke="#d8c6a8" stroke-width="5"/></g>
  <!-- repisa -->
  <g id="sc-alma-shelf">
    <rect x="252" y="206" width="150" height="10" rx="4" fill="${WOOD}"/>
    <path d="M274 206c-12 0-14-30 0-34 14 4 12 34 0 34Z" fill="#e7dccb"/>
    <rect x="300" y="176" width="22" height="30" rx="4" fill="#fff9ef"/><path d="M311 176v-8" stroke="${INK}" stroke-width="1.5"/>
    <ellipse class="sc-alma-glow" cx="311" cy="162" rx="5" ry="8" fill="#ffcf7a"/>
    <path d="M352 206l-6-22h34l-6 22Z" fill="${TERRA}"/>
    <g transform="translate(363 184)">${leaf(30, 9, '#5d8a69')}</g><g transform="translate(363 184) rotate(-40)">${leaf(24, 8, '#4a7a58')}</g><g transform="translate(363 184) rotate(40)">${leaf(24, 8, '#4a7a58')}</g>
  </g>
  <!-- sillón -->
  <g id="sc-alma-chair">
    <ellipse cx="0" cy="2" rx="120" ry="12" fill="url(#sc-alma-g-shadow)"/>
    <path d="M-82 -22l-6 24h10l6-24ZM74 -22l6 24h10l-6-24Z" fill="#8a6a4b"/>
    <rect x="-84" y="-188" width="168" height="130" rx="56" fill="#efe3cf"/>
    <rect x="-70" y="-176" width="140" height="10" rx="5" fill="#ffffff" opacity=".35"/>
    <rect x="-98" y="-78" width="196" height="58" rx="20" fill="#e6d6bd"/>
    <rect x="-80" y="-94" width="160" height="32" rx="15" fill="#f6ecdc"/>
    <rect x="-108" y="-122" width="38" height="104" rx="19" fill="#e0ceb2"/>
    <rect x="70" y="-122" width="38" height="104" rx="19" fill="#e0ceb2"/>
    <g transform="translate(34 -112) rotate(14)"><rect x="-30" y="-30" width="60" height="56" rx="22" fill="#7fa58a"/><path d="M-18 -16q18 10 36 0M-18 12q18-10 36 0" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="2"/></g>
  </g>
  <!-- mesita con taza -->
  <g id="sc-alma-table">
    <ellipse cx="0" cy="2" rx="44" ry="6" fill="url(#sc-alma-g-shadow)"/>
    <path d="M-4 -78h8v78h-8ZM-26 0h52" stroke="#8a6a4b" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="0" cy="-80" rx="40" ry="9" fill="${WOOD}"/>
    <path d="M-14 -108h26v18c0 6-5 10-11 10h-4c-6 0-11-4-11-10Z" fill="${TERRA}"/>
    <path d="M12 -102c8 0 8 12 0 12" fill="none" stroke="${TERRA}" stroke-width="3"/>
    <path class="sc-alma-steam" d="M-6 -116c-6-8 6-12 0-20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <path class="sc-alma-steam2" d="M4 -116c-6-8 6-12 0-20" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- planta que crece -->
  <g id="sc-alma-plant">
    <ellipse cx="0" cy="2" rx="62" ry="9" fill="url(#sc-alma-g-shadow)"/>
    <g id="sc-alma-leaves" transform="translate(0 -78)">${plantLeaves}</g>
    <path d="M-44 -82h88l-10 82h-68Z" fill="url(#sc-alma-g-pot)"/>
    <rect x="-48" y="-90" width="96" height="14" rx="5" fill="#d9937a"/>
  </g>
  <rect id="sc-alma-dim" x="-300" y="-200" width="1800" height="960" fill="#2c4636" opacity="0" pointer-events="none"/>
 </g>
</g>

<!-- Acto 6: seguimiento -->
<g id="sc-alma-card">
  ${shadowCard(0, 0, 316, 204, 26)}
  <rect width="316" height="204" rx="26" fill="#fffdf8"/>
  <text x="26" y="38" font-size="12" font-weight="700" letter-spacing="2" fill="${ACC}" style="${UI}">SEGUIMIENTO</text>
  <circle cx="284" cy="33" r="13" fill="#e8efe6"/><path d="M278 33l4 4 8-8" fill="none" stroke="${ACC}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="26" y="72" font-size="23" fill="${INK}" style="${SERIF}">Próxima sesión sugerida</text>
  <rect x="26" y="88" width="26" height="24" rx="6" fill="none" stroke="${ACC}" stroke-width="2"/><path d="M26 96h26M33 84v8M45 84v8" stroke="${ACC}" stroke-width="2"/>
  <text x="62" y="107" font-size="17" font-weight="700" fill="${INK}" style="${UI}">jueves 22 · 4:00 p. m.</text>
  <g id="sc-alma-dots">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${32 + i * 16}" cy="134" r="5" fill="${i < 2 ? ACC : '#dfe5da'}"/>`).join('')}</g>
  <text x="130" y="139" font-size="13" fill="${MUTED}" style="${UI}">sesión 2 de 6</text>
  <g id="sc-alma-cta"><rect x="26" y="152" width="134" height="36" rx="18" fill="${ACC}"/>
  <text x="93" y="175" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" style="${UI}">Agendar</text></g>
  <text x="184" y="175" font-size="14" font-weight="600" fill="${MUTED}" style="${UI}">Más tarde</text>
</g>
</svg>`;
  }

  window.NexoEscenas.alma = {
    title: 'Tu visita a ALMA, sin filas ni esperas',
    duration: 20000,
    steps: [
      { label: 'Reservas en línea', at: 0 },
      { label: 'Confirmación', at: 0.14 },
      { label: 'Llegas sin esperar', at: 0.29 },
      { label: 'Tu espacio', at: 0.44 },
      { label: 'Respira', at: 0.60 },
      { label: 'Seguimiento', at: 0.82 }
    ],
    mount(stage) {
      stage.innerHTML = svgMarkup();
      const svg = stage.querySelector('svg');
      const $ = id => svg.getElementById('sc-alma-' + id);
      const el = {};
      ['ui1', 'archbg', 'pshadow', 'phone', 'slot', 'slott', 'slotchk', 'slotchkp', 'btnok', 'ripple', 'touch', 'bubble', 'ticks', 'remind', 'bell',
        'recep', 'lightpath', 'doorpanel', 'badge', 'badgechk', 'roomclip', 'room', 'doorclip-p', 'dusk', 'breathg', 'halo', 'ring', 'orb', 'tin', 'tout', 'tend',
        'beam', 'rug', 'shelf', 'chair', 'table', 'plant', 'dim', 'card', 'cta'].forEach(k => { el[k] = $(k); });
      const leaves = [...svg.querySelectorAll('.sc-alma-pleaf')];
      const set = (node, attr, v) => node.setAttribute(attr, v);
      const op = (node, v) => node.setAttribute('opacity', clamp(v).toFixed(3));
      const tf = (node, v) => node.setAttribute('transform', v);
      const CX = 600, CY = 318; // centro de la puerta: punto de fuga del zoom

      return {
        render(p) {
          // ---------- Acto 1: reservar ----------
          const approach = eInOut(seg(p, .012, .062));
          const press = seg(p, .062, .074) - seg(p, .074, .09);
          tf(el.touch, `translate(${lerp(150, 20, approach)} ${lerp(250, 57, approach)}) scale(${(1 - .18 * press).toFixed(3)})`);
          op(el.touch, seg(p, .006, .03) - seg(p, .1, .125));
          const rip = seg(p, .066, .118);
          set(el.ripple, 'r', lerp(12, 70, eOut(rip)).toFixed(1));
          op(el.ripple, rip > 0 ? (1 - rip) * .8 : 0);
          const pick = eOut(seg(p, .068, .098));
          op(el.slot, pick); op(el.slott, pick);
          tf(el.slotchk, `translate(76 57) scale(${eBack(seg(p, .086, .11)).toFixed(3)})`);
          set(el.slotchkp, 'stroke-dashoffset', (1 - seg(p, .095, .118)).toFixed(3));
          op(el.btnok, eOut(seg(p, .108, .13)));

          // ---------- Acto 2: confirmación y recordatorio ----------
          const shift = eInOut(seg(p, .14, .185));
          const exit = eInOut(seg(p, .29, .335));
          const phoneX = lerp(600, 432, shift) - 300 * exit;
          tf(el.phone, `translate(${phoneX.toFixed(1)} ${(280 + 40 * exit).toFixed(1)}) scale(${(1 - .15 * exit).toFixed(3)})`);
          tf(el.archbg, `translate(${(phoneX - 600).toFixed(1)} 0)`);
          tf(el.pshadow, `translate(${(phoneX - 600).toFixed(1)} 0)`);
          const pop = seg(p, .17, .215);
          const bs = eBack(pop);
          tf(el.bubble, `translate(${(588 - 300 * exit).toFixed(1)} ${268 + 30 * exit}) scale(${Math.max(.001, bs).toFixed(3)})`);
          op(el.bubble, pop * 4);
          set(el.ticks, 'stroke', seg(p, .205, .215) > .5 ? '#3b9fd6' : '#9aa79c');
          const rem = seg(p, .228, .265);
          tf(el.remind, `translate(${(588 - 300 * exit).toFixed(1)} ${(lerp(340, 296, eOut(rem)) + 30 * exit).toFixed(1)})`);
          op(el.remind, rem * 2.2);
          const ring = seg(p, .245, .292);
          tf(el.bell, `translate(50 34) rotate(${(Math.sin(ring * Math.PI * 7) * 22 * (1 - ring)).toFixed(2)})`);
          op(el.ui1, 1 - eOut(seg(p, .295, .33)));

          // ---------- Acto 3: recepción ----------
          const zoom = eInOut(seg(p, .44, .505));
          const recIn = eOut(seg(p, .305, .35));
          const s = Math.pow(9, zoom);
          tf(el.recep, `translate(${CX} ${CY + 40 * (1 - recIn)}) scale(${s.toFixed(4)}) translate(${-CX} ${-CY})`);
          op(el.recep, zoom >= 1 || p < .3 ? 0 : recIn);
          const door = eInOut(seg(p, .345, .39));
          tf(el.doorpanel, `translate(675 0) scale(${lerp(1, .1, door).toFixed(3)} 1) translate(-675 0)`);
          op(el.lightpath, eOut(seg(p, .355, .41)));
          const bdg = seg(p, .388, .425);
          tf(el.badge, `translate(392 ${lerp(270, 250, eOut(bdg))}) scale(${lerp(.85, 1, eBack(bdg)).toFixed(3)})`);
          op(el.badge, bdg * 2.5 * (1 - seg(p, .44, .46)));
          set(el.badgechk, 'stroke-dashoffset', (1 - seg(p, .405, .432)).toFixed(3));

          // ---------- Acto 4: el consultorio se arma ----------
          if (zoom >= 1) el.roomclip.removeAttribute('clip-path'); else set(el.roomclip, 'clip-path', 'url(#sc-alma-doorclip)');
          tf(el['doorclip-p'], `translate(${CX} ${CY}) scale(${s.toFixed(4)}) translate(${-CX} ${-CY})`);
          const k = lerp(.42, 1, zoom);
          const breathCam = eInOut(seg(p, .6, .64)) - eInOut(seg(p, .8, .86));
          const camS = k * (1 + .06 * breathCam);
          tf(el.room, `translate(${CX} ${CY}) scale(${camS.toFixed(4)}) translate(${-CX} ${-CY + 30 * breathCam})`);
          op(el.roomclip, p < .4 ? 0 : seg(p, .405, .45));
          tf(el.beam, `translate(600 380) skewX(${lerp(-16, 12, eInOut(seg(p, .47, 1))).toFixed(2)}) translate(-600 -380)`);
          op(el.beam, seg(p, .48, .56) * (1 - .45 * breathCam));
          op(el.dusk, lerp(.05, .75, seg(p, .5, 1)));
          tf(el.rug, `translate(600 498) scale(${Math.max(.001, eOut(seg(p, .47, .53))).toFixed(3)} 1)`);
          const ch = seg(p, .49, .545);
          tf(el.chair, `translate(${lerp(170, 352, eOut(ch)).toFixed(1)} 478)`);
          op(el.chair, ch * 3);
          const tb = seg(p, .525, .565);
          tf(el.table, `translate(498 ${lerp(430, 478, eBack(tb)).toFixed(1)})`);
          op(el.table, tb * 3);
          const sh = seg(p, .535, .575);
          tf(el.shelf, `translate(0 ${lerp(-24, 0, eBack(sh)).toFixed(1)})`);
          op(el.shelf, sh * 2);
          const pl = seg(p, .48, .515);
          tf(el.plant, `translate(${lerp(980, 862, eOut(pl)).toFixed(1)} 480)`);
          op(el.plant, pl * 3);
          leaves.forEach((lf, i) => {
            const g = eBack(seg(p, .51 + i * .009, .55 + i * .009));
            tf(lf, `rotate(${lf.dataset.a}) scale(${Math.max(.001, g).toFixed(3)})`);
          });

          // ---------- Acto 5: respira ----------
          const appear = eBack(seg(p, .6, .625));
          const u = seg(p, .625, .805);
          const breath = (1 - Math.cos(u * Math.PI * 2)) / 2;
          const settle = eInOut(seg(p, .82, .87));
          let r = lerp(64, 108, breath);
          r = lerp(r, 70, settle);
          const vis = p < .6 ? 0 : appear;
          tf(el.breathg, `translate(600 214) scale(${Math.max(.001, vis).toFixed(3)})`);
          op(el.breathg, seg(p, .6, .612));
          set(el.orb, 'r', r.toFixed(2));
          set(el.halo, 'r', (r * 1.55).toFixed(2));
          set(el.ring, 'r', lerp(116, 84, settle).toFixed(2));
          tf(el.ring, `rotate(${(p * 220).toFixed(2)})`);
          const inhale = u < .5 ? 1 - seg(u, .42, .5) : 0;
          const exhale = u >= .5 ? 1 - seg(u, .92, 1) : seg(u, .42, .5) * 0;
          op(el.tin, (u > 0 ? inhale * seg(u, 0, .08) : 0));
          op(el.tout, u >= .5 ? Math.min(seg(u, .5, .58), exhale) : 0);
          op(el.tend, seg(p, .805, .83));
          op(el.dim, .1 * breathCam);

          // ---------- Acto 6: seguimiento ----------
          const cd = seg(p, .83, .89);
          tf(el.card, `translate(${lerp(750, 640, eOut(cd)).toFixed(1)} ${lerp(340, 300, eOut(cd)).toFixed(1)}) scale(${lerp(.92, 1, eBack(cd)).toFixed(3)})`);
          op(el.card, cd * 2.5);
          const cta = seg(p, .91, .95) - seg(p, .95, .99);
          tf(el.cta, `translate(93 170) scale(${(1 + .06 * cta).toFixed(3)}) translate(-93 -170)`);
        }
      };
    }
  };
})();
