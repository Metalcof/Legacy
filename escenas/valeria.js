'use strict';
// Escena Valeria Ríos: retícula → símbolo → paleta → tipografía → piezas → propuesta lista.
(() => {
  window.NexoEscenas = window.NexoEscenas || {};

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  const INK = '#211c33', MUTED = '#5c5672', VIO = '#6747c7', CORAL = '#ff8a6b', SUN = '#ffd36b', MINT = '#8fd6c2';
  const UI = "font-family:'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif";
  const SERIF = "font-family:Georgia,'Times New Roman',serif";
  const MONO = "font-family:Consolas,'SFMono-Regular',Menlo,monospace";

  const N_PATH = 'M-55 70V-70L55 70V-70';
  const LEAF = 'M0 0C-4-22 10-40 34-46C36-22 22-4 0 0Z';
  const CHIPS = [[VIO, 'Violeta', '#6747C7'], [CORAL, 'Coral', '#FF8A6B'], [SUN, 'Sol', '#FFD36B'], [MINT, 'Menta', '#8FD6C2']];
  const CHIP_AT = [[650, 176], [790, 176], [650, 322], [790, 322]];
  const CHIP_TILT = [-14, 10, -8, 13];
  const HEADLINE = 'Raíces que florecen';
  const SPARKS = [[-215, -60, CORAL], [-205, 50, MINT], [210, -66, SUN], [222, 40, VIO], [-120, -95, SUN], [130, 92, CORAL], [-150, 88, VIO], [160, -96, MINT]];
  // Cursor de Valeria: [p, x, y]
  const CURSOR = [[0, 668, 292], [.004, 668, 292], [.05, 190, 318], [.065, 344, 104], [.14, 846, 452], [.165, 545, 356], [.185, 545, 216], [.215, 655, 352], [.245, 655, 214], [.27, 690, 176],
    [.31, 830, 440], [.37, 700, 70], [.47, 836, 368], [.5, 830, 380], [.53, 600, 330], [.63, 870, 330], [.66, 880, 300], [.7, 470, 380], [.75, 820, 250], [.8, 850, 330],
    [.86, 900, 300], [.9, 476, 146], [.95, 476, 146], [.99, 812, 214], [1, 812, 214]];

  const lineD = (x1, y1, x2, y2) => `M${x1} ${y1}L${x2} ${y2}`;
  const GUIDES = [lineD(340, 70, 340, 490), lineD(860, 70, 860, 490), lineD(600, 70, 600, 490), lineD(310, 100, 890, 100), lineD(310, 460, 890, 460), lineD(310, 280, 890, 280),
    lineD(545, 70, 545, 490), lineD(655, 70, 655, 490), lineD(310, 210, 890, 210), lineD(310, 350, 890, 350), lineD(440, 120, 760, 440), lineD(760, 120, 440, 440)];
  const CIRCLES = [[600, 280, 150], [600, 280, 93], [545, 210, 35], [655, 210, 35], [545, 350, 35], [655, 350, 35]];

  function svgMarkup() {
    const guides = GUIDES.map((d, i) => `<path class="sc-valeria-gl" d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke="${VIO}" stroke-opacity="${i > 9 ? .28 : .35}" stroke-width="1.4" fill="none"/>`).join('');
    const circles = CIRCLES.map(([x, y, r], i) => `<circle class="sc-valeria-gc" cx="${x}" cy="${y}" r="${r}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 ${x} ${y})" stroke="${i < 2 ? CORAL : VIO}" stroke-opacity="${i < 2 ? .7 : .55}" stroke-width="1.6" fill="none"/>`).join('');
    const chips = CHIPS.map(([c, name, hex], i) => `<g class="sc-valeria-chip">
      <rect x="-60" y="-56" width="124" height="128" rx="14" fill="${INK}" opacity=".07"/>
      <rect x="-62" y="-64" width="124" height="128" rx="14" fill="#fff"/>
      <path d="M-62 18V-50a14 14 0 0 1 14-14h96a14 14 0 0 1 14 14V18Z" fill="${c}"/>
      <text x="-48" y="40" font-size="16" font-weight="700" fill="${INK}" style="${UI}">${name}</text>
      <text x="-48" y="58" font-size="13.5" fill="${MUTED}" style="${MONO}">${hex}</text>
      ${i === 0 ? '' : ''}</g>`).join('');
    const headline = [...HEADLINE].map(ch => `<tspan>${ch === ' ' ? '&#160;' : ch}</tspan>`).join('');
    const sparks = SPARKS.map(([x, y, c], i) => `<g class="sc-valeria-spark" data-x="${x}" data-y="${y}"><g class="sc-valeria-tw" style="animation-delay:${-i * .37}s">${i % 2 ? `<circle r="6" fill="${c}"/>` : `<path d="M0-9L2.4-2.4 9 0 2.4 2.4 0 9-2.4 2.4-9 0-2.4-2.4Z" fill="${c}"/>`}</g></g>`).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" focusable="false">
<style>
  .sc-valeria-drift{animation:sc-valeria-drift 14s ease-in-out infinite}
  .sc-valeria-drift2{animation:sc-valeria-drift 18s ease-in-out -6s infinite reverse}
  .sc-valeria-tw{transform-box:fill-box;transform-origin:50% 50%;animation:sc-valeria-tw 2.6s ease-in-out infinite}
  @keyframes sc-valeria-drift{0%,100%{transform:translate(0,0)}50%{transform:translate(18px,-12px)}}
  @keyframes sc-valeria-tw{0%,100%{transform:scale(1)}50%{transform:scale(.6)}}
  body.motion-paused .sc-valeria-drift,body.motion-paused .sc-valeria-drift2,body.motion-paused .sc-valeria-tw{animation:none}
  @media (prefers-reduced-motion:reduce){.sc-valeria-drift,.sc-valeria-drift2,.sc-valeria-tw{animation:none}}
</style>
<defs>
  <linearGradient id="sc-valeria-g-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f2fa"/><stop offset="1" stop-color="#e6e1f1"/></linearGradient>
  <radialGradient id="sc-valeria-g-coral" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${CORAL}" stop-opacity=".28"/><stop offset="1" stop-color="${CORAL}" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-valeria-g-mint" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${MINT}" stop-opacity=".35"/><stop offset="1" stop-color="${MINT}" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-valeria-g-vio" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${VIO}" stop-opacity=".16"/><stop offset="1" stop-color="${VIO}" stop-opacity="0"/></radialGradient>
  <radialGradient id="sc-valeria-g-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${INK}" stop-opacity=".28"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>
  <pattern id="sc-valeria-g-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="${INK}" fill-opacity=".09"/></pattern>
  <linearGradient id="sc-valeria-g-badge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d5ee0"/><stop offset="1" stop-color="#5236ad"/></linearGradient>
  <linearGradient id="sc-valeria-g-phone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3352"/><stop offset=".5" stop-color="#17131f"/><stop offset="1" stop-color="#2b2540"/></linearGradient>
  <linearGradient id="sc-valeria-g-tote" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3e9d6"/><stop offset="1" stop-color="#e6d8bd"/></linearGradient>
  <linearGradient id="sc-valeria-g-screen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7d5ee0"/><stop offset="1" stop-color="${VIO}"/></linearGradient>
  <clipPath id="sc-valeria-g-scr"><rect x="-76" y="-160" width="152" height="320" rx="22"/></clipPath>
</defs>

<rect width="1200" height="560" fill="url(#sc-valeria-g-bg)"/>
<rect width="1200" height="560" fill="url(#sc-valeria-g-dots)"/>
<g class="sc-valeria-drift"><circle cx="190" cy="120" r="240" fill="url(#sc-valeria-g-coral)"/></g>
<g class="sc-valeria-drift2"><circle cx="1030" cy="450" r="280" fill="url(#sc-valeria-g-mint)"/></g>
<circle cx="600" cy="280" r="420" fill="url(#sc-valeria-g-vio)"/>

<!-- Mesa de trabajo -->
<g id="sc-valeria-board">
  <rect x="300" y="74" width="600" height="440" rx="20" fill="${INK}" opacity=".06"/>
  <rect x="302" y="66" width="596" height="440" rx="20" fill="${INK}" opacity=".05"/>
  <rect x="300" y="60" width="600" height="440" rx="20" fill="#fff"/>
  <text x="302" y="46" font-size="13" font-weight="600" fill="${MUTED}" style="${UI}">Nativa — identidad · v1</text>
  <circle cx="886" cy="42" r="5" fill="${MINT}"/>
  <path d="M318 88v-12h12M882 88v-12h-12M318 472v12h12M882 472v12h-12" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5" fill="none"/>
  <g id="sc-valeria-constr">${guides}${circles}
    <g id="sc-valeria-phi"><text x="768" y="132" font-size="22" font-style="italic" fill="${CORAL}" style="${SERIF}">φ = 1,618</text>
    <path d="M600 448H693" stroke="${CORAL}" stroke-width="1.5"/><path d="M600 442v12M693 442v12" stroke="${CORAL}" stroke-width="1.5"/>
    <text x="646" y="438" text-anchor="middle" font-size="13" fill="${CORAL}" style="${MONO}">93</text></g>
  </g>
  <!-- símbolo -->
  <g id="sc-valeria-logo">
    <circle id="sc-valeria-badge" r="120" fill="url(#sc-valeria-g-badge)"/>
    <path id="sc-valeria-nink" d="${N_PATH}" pathLength="1" stroke-dasharray="1" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <path id="sc-valeria-nwhite" d="${N_PATH}" pathLength="1" stroke-dasharray="1" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(62 -84)"><path id="sc-valeria-leaf" d="${LEAF}" fill="${MINT}"/></g>
    <text id="sc-valeria-word" y="182" text-anchor="middle" font-size="48" font-style="italic" fill="${INK}" style="${SERIF}">Nativa</text>
  </g>
  <!-- paleta -->
  <g id="sc-valeria-chips">${chips}</g>
  <!-- tipografía -->
  <g id="sc-valeria-type">
    <text id="sc-valeria-aa" x="582" y="238" font-size="118" font-style="italic" fill="${VIO}" style="${SERIF}">Aa</text>
    <g id="sc-valeria-fonts">
      <text x="752" y="184" font-size="17" font-weight="700" fill="${INK}" style="${SERIF}" font-style="italic">Georgia</text>
      <text x="752" y="204" font-size="13" fill="${MUTED}" style="${UI}">títulos</text>
      <text x="752" y="234" font-size="16" font-weight="700" fill="${INK}" style="${UI}">Sans</text>
      <text x="752" y="254" font-size="13" fill="${MUTED}" style="${UI}">textos</text>
    </g>
    <text id="sc-valeria-head" x="584" y="312" font-size="30" font-style="italic" fill="${INK}" style="${SERIF}">${headline}</text>
    <rect id="sc-valeria-caret" x="584" y="286" width="2.5" height="34" fill="${VIO}"/>
    <text id="sc-valeria-sub" x="585" y="342" font-size="15" fill="${MUTED}" style="${UI}">Cosmética natural, hecha aquí.</text>
  </g>
  <rect id="sc-valeria-veil" x="290" y="40" width="620" height="480" fill="#efecf6" opacity="0"/>
</g>

<!-- Brief inicial -->
<g id="sc-valeria-note">
  <rect x="-80" y="-62" width="168" height="132" rx="6" fill="${INK}" opacity=".08"/>
  <rect x="-84" y="-70" width="168" height="132" rx="6" fill="#fff1c4"/>
  <rect x="-24" y="-80" width="48" height="18" rx="3" fill="#ffffff" opacity=".6"/>
  <text x="-66" y="-36" font-size="12" font-weight="700" letter-spacing="2" fill="#9a7a1c" style="${UI}">BRIEF</text>
  <text x="-66" y="-8" font-size="24" font-style="italic" fill="${INK}" style="${SERIF}">Nativa</text>
  <text x="-66" y="16" font-size="13.5" fill="${MUTED}" style="${UI}">cosmética natural</text>
  <text x="-66" y="38" font-size="13.5" fill="${MUTED}" style="${UI}">cálida · honesta</text>
</g>

<!-- Piezas -->
<g id="sc-valeria-card">
  <ellipse cx="0" cy="78" rx="110" ry="10" fill="url(#sc-valeria-g-shadow)"/>
  <g id="sc-valeria-cardflip">
    <g id="sc-valeria-cardback">
      <rect x="-104" y="-62" width="208" height="124" rx="12" fill="url(#sc-valeria-g-badge)"/>
      <path d="M-16 20V-20L16 20V-20" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
      <g transform="translate(18 -24) scale(.3)"><path d="${LEAF}" fill="${MINT}"/></g>
    </g>
    <g id="sc-valeria-cardfront">
      <rect x="-104" y="-62" width="208" height="124" rx="12" fill="#fff"/>
      <rect x="-104" y="44" width="208" height="18" fill="${MINT}"/><rect x="-104" y="44" width="70" height="18" fill="${CORAL}"/>
      <circle cx="-74" cy="-30" r="16" fill="${VIO}"/><path d="M-80 -24v-12l12 12v-12" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="-50" y="-24" font-size="18" font-style="italic" fill="${INK}" style="${SERIF}">Nativa</text>
      <text x="-84" y="10" font-size="13" font-weight="700" fill="${INK}" style="${UI}">Camila Torres</text>
      <text x="-84" y="28" font-size="11.5" fill="${MUTED}" style="${UI}">hola@nativa.co</text>
    </g>
  </g>
</g>

<g id="sc-valeria-phone">
  <ellipse cx="0" cy="178" rx="96" ry="12" fill="url(#sc-valeria-g-shadow)"/>
  <rect x="-86" y="-172" width="172" height="344" rx="32" fill="url(#sc-valeria-g-phone)"/>
  <g clip-path="url(#sc-valeria-g-scr)">
    <rect x="-76" y="-160" width="152" height="320" fill="#fbf9ff"/>
    <rect x="-76" y="-160" width="152" height="150" fill="url(#sc-valeria-g-screen)"/>
    <circle cx="44" cy="-40" r="56" fill="${CORAL}" opacity=".9"/>
    <circle cx="70" cy="-104" r="22" fill="${SUN}"/>
    <text x="-60" y="-112" font-size="13" font-style="italic" fill="#fff" style="${SERIF}">Nativa</text>
    <text x="-60" y="-66" font-size="21" font-style="italic" fill="#fff" style="${SERIF}">Raíces que</text>
    <text x="-60" y="-42" font-size="21" font-style="italic" fill="#fff" style="${SERIF}">florecen</text>
    <rect x="-60" y="4" width="120" height="30" rx="15" fill="${INK}"/>
    <text x="0" y="24" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff" style="${UI}">Comprar</text>
    <rect x="-60" y="48" width="56" height="64" rx="10" fill="${MINT}"/><rect x="4" y="48" width="56" height="64" rx="10" fill="${SUN}"/>
    <rect x="-48" y="64" width="18" height="34" rx="6" fill="#fff" opacity=".85"/><rect x="18" y="60" width="26" height="40" rx="12" fill="#fff" opacity=".85"/>
  </g>
  <rect x="-24" y="-154" width="48" height="12" rx="6" fill="#120f19"/>
</g>

<g id="sc-valeria-tote">
  <g id="sc-valeria-toteswing">
    <ellipse cx="0" cy="178" rx="100" ry="10" fill="url(#sc-valeria-g-shadow)"/>
    <path d="M-44 20C-44-60 44-60 44 20" fill="none" stroke="#cdb995" stroke-width="9" stroke-linecap="round"/>
    <path d="M-80 4H80L90 172H-90Z" fill="url(#sc-valeria-g-tote)"/>
    <path d="M-80 4H80l1 14H-81Z" fill="#d9c8a6"/>
    <circle cx="0" cy="78" r="36" fill="${VIO}"/>
    <path d="M-15 92V64L15 92V64" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(18 58) scale(.32)"><path d="${LEAF}" fill="${MINT}"/></g>
    <text x="0" y="146" text-anchor="middle" font-size="21" font-style="italic" fill="${INK}" style="${SERIF}">Nativa</text>
  </g>
</g>

<!-- Propuesta -->
<g id="sc-valeria-prop">
  <g id="sc-valeria-sparks">${sparks}</g>
  <rect x="-190" y="-62" width="380" height="140" rx="26" fill="${INK}" opacity=".07"/>
  <rect x="-190" y="-72" width="380" height="144" rx="26" fill="#fff"/>
  <circle cx="-128" cy="0" r="34" fill="${VIO}"/>
  <path id="sc-valeria-pchk" d="M-142 0l10 10 18-20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1"/>
  <text x="-76" y="-30" font-size="12.5" font-weight="700" letter-spacing="2.4" fill="${VIO}" style="${UI}">PROPUESTA</text>
  <text x="-77" y="8" font-size="32" font-style="italic" fill="${INK}" style="${SERIF}">Marca Nativa</text>
  <rect x="-76" y="22" width="172" height="30" rx="15" fill="#dff5ef"/>
  <circle cx="-60" cy="37" r="5" fill="#2f9c7f"/>
  <text x="-48" y="42" font-size="14" font-weight="700" fill="#1f6f5a" style="${UI}">lista para revisión</text>
</g>

<!-- Cursor de Valeria -->
<g id="sc-valeria-cursor">
  <g id="sc-valeria-cursorin">
    <path d="M0 0L0 26L7 19.5L12 31L17 29L12 17.5L21 17.5Z" fill="${INK}" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>
    <rect x="18" y="30" width="72" height="26" rx="13" fill="${VIO}"/>
    <text x="54" y="48" text-anchor="middle" font-size="13.5" font-weight="700" fill="#fff" style="${UI}">Valeria</text>
  </g>
</g>
</svg>`;
  }

  window.NexoEscenas.valeria = {
    title: 'Así nace una marca con Valeria',
    duration: 19000,
    steps: [
      { label: 'La retícula', at: 0 },
      { label: 'El símbolo', at: 0.16 },
      { label: 'La paleta', at: 0.34 },
      { label: 'La tipografía', at: 0.5 },
      { label: 'Las piezas', at: 0.66 },
      { label: 'Propuesta lista', at: 0.84 }
    ],
    mount(stage) {
      stage.innerHTML = svgMarkup();
      const svg = stage.querySelector('svg');
      const $ = id => svg.getElementById('sc-valeria-' + id);
      const el = {};
      ['board', 'constr', 'phi', 'logo', 'badge', 'nink', 'nwhite', 'leaf', 'word', 'chips', 'type', 'aa', 'fonts', 'head', 'caret', 'sub', 'veil',
        'note', 'card', 'cardflip', 'cardback', 'cardfront', 'phone', 'tote', 'toteswing', 'prop', 'pchk', 'cursor', 'cursorin'].forEach(k => { el[k] = $(k); });
      const gl = [...svg.querySelectorAll('.sc-valeria-gl')];
      const gc = [...svg.querySelectorAll('.sc-valeria-gc')];
      const chips = [...svg.querySelectorAll('.sc-valeria-chip')];
      const sparks = [...svg.querySelectorAll('.sc-valeria-spark')];
      const letters = [...el.head.querySelectorAll('tspan')];
      const set = (node, attr, v) => node.setAttribute(attr, v);
      const op = (node, v) => node.setAttribute('opacity', clamp(v).toFixed(3));
      const tf = (node, v) => node.setAttribute('transform', v);

      return {
        render(p) {
          // ---------- 0. Brief ----------
          const nt = eInOut(seg(p, .004, .05));
          tf(el.note, `translate(${lerp(600, 118, nt).toFixed(1)} ${lerp(278, 300, nt).toFixed(1)}) rotate(${lerp(-3, -9, nt).toFixed(2)}) scale(${lerp(1.25, 1, nt).toFixed(3)})`);
          // ---------- 1. Retícula ----------
          gl.forEach((g, i) => set(g, 'stroke-dashoffset', (1 - eInOut(seg(p, .015 + i * .007, .06 + i * .007))).toFixed(3)));
          gc.forEach((c, i) => set(c, 'stroke-dashoffset', (1 - eInOut(seg(p, .07 + i * .011, .12 + i * .011))).toFixed(3)));
          op(el.phi, seg(p, .12, .15));
          const constrFade = lerp(1, .32, seg(p, .26, .31)) * (1 - seg(p, .34, .38));
          op(el.constr, constrFade);

          // ---------- 2. Símbolo ----------
          set(el.nink, 'stroke-dashoffset', (1 - seg(p, .165, .245)).toFixed(3));
          const lf = eBack(seg(p, .245, .275));
          tf(el.leaf, `scale(${Math.max(.001, lf).toFixed(3)}) rotate(${lerp(-30, 0, lf).toFixed(1)})`);
          const bd = seg(p, .28, .32);
          tf(el.badge, `scale(${Math.max(.001, eBack(bd)).toFixed(3)})`);
          op(el.badge, bd * 3);
          set(el.nwhite, 'stroke-dashoffset', (1 - eInOut(seg(p, .286, .318))).toFixed(3));
          op(el.nink, p < .318 ? 1 : 0);
          const wd = seg(p, .3, .335);
          tf(el.word, `translate(0 ${lerp(16, 0, eOut(wd)).toFixed(1)})`);
          op(el.word, wd);
          // símbolo se reubica para la paleta
          const mv = eInOut(seg(p, .34, .385));
          tf(el.logo, `translate(${lerp(600, 430, mv).toFixed(1)} ${lerp(280, 250, mv).toFixed(1)}) scale(${lerp(1, .72, mv).toFixed(3)})`);

          // ---------- 3. Paleta ----------
          const toRow = eInOut(seg(p, .5, .545));
          chips.forEach((c, i) => {
            const d = seg(p, .372 + i * .02, .422 + i * .02);
            const y0 = CHIP_AT[i][1] + (i < 2 ? -330 : 330);
            const x = lerp(CHIP_AT[i][0], 574 + i * 50, toRow);
            const y = lerp(lerp(y0, CHIP_AT[i][1], eBack(d)), 436, toRow);
            const rot = lerp(CHIP_TILT[i] * (1 - eOut(d)) + (i % 2 ? 2 : -2), 0, toRow);
            const sc = lerp(1, .34, toRow);
            tf(c, `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${sc.toFixed(3)})`);
            op(c, d * 4 * (1 - eInOut(seg(p, .66, .7))));
          });

          // ---------- 4. Tipografía ----------
          const aa = seg(p, .53, .57);
          tf(el.aa, `translate(0 ${lerp(24, 0, eOut(aa)).toFixed(1)})`);
          op(el.aa, aa);
          op(el.fonts, seg(p, .555, .58));
          const typed = Math.round(seg(p, .565, .635) * letters.length);
          letters.forEach((t, i) => op(t, i < typed ? 1 : 0));
          let cx = 584;
          try { cx = typed > 0 ? el.head.getEndPositionOfChar(typed - 1).x : 584; } catch (e) { cx = 584; }
          set(el.caret, 'x', (cx + 2).toFixed(1));
          const caretOn = p > .56 && p < .65;
          op(el.caret, caretOn ? (Math.floor(p * 400) % 2 ? .25 : 1) : 0);
          op(el.sub, seg(p, .635, .66));
          op(el.type, 1 - eInOut(seg(p, .66, .7)));

          // ---------- 5. Piezas ----------
          const pieces = eInOut(seg(p, .66, .7));
          tf(el.board, `translate(600 ${lerp(280, 250, pieces).toFixed(1)}) scale(${lerp(1, .92, pieces).toFixed(3)}) translate(-600 -280)`);
          op(el.veil, .8 * pieces);
          const ci = seg(p, .665, .71);
          const flip = eInOut(seg(p, .7, .76));
          const cardRot = lerp(-24, -9, eOut(ci));
          tf(el.card, `translate(${lerp(150, 372, eOut(ci)).toFixed(1)} ${lerp(470, 418, eOut(ci)).toFixed(1)}) rotate(${cardRot.toFixed(2)})`);
          op(el.card, ci * 3);
          const fc = Math.cos(flip * Math.PI);
          tf(el.cardflip, `scale(${Math.max(.02, Math.abs(fc)).toFixed(3)} 1)`);
          op(el.cardback, fc > 0 ? 1 : 0);
          op(el.cardfront, fc > 0 ? 0 : 1);
          const ph = eOut(seg(p, .69, .75));
          tf(el.phone, `translate(600 ${lerp(820, 392, ph).toFixed(1)}) rotate(${lerp(6, 0, ph).toFixed(2)})`);
          const td = seg(p, .72, .765);
          tf(el.tote, `translate(842 ${lerp(-120, 318, eBack(td)).toFixed(1)})`);
          op(el.tote, td * 4);
          const sw = seg(p, .74, .84);
          tf(el.toteswing, `rotate(${(Math.sin(sw * Math.PI * 3) * 9 * (1 - sw)).toFixed(2)} 0 -40)`);

          // ---------- 6. Propuesta lista ----------
          const pr = seg(p, .85, .9);
          tf(el.prop, `translate(600 ${lerp(30, 142, eBack(pr)).toFixed(1)}) scale(${lerp(.9, 1, eOut(pr)).toFixed(3)})`);
          op(el.prop, pr * 3);
          set(el.pchk, 'stroke-dashoffset', (1 - eOut(seg(p, .9, .93))).toFixed(3));
          const burst = seg(p, .91, .98);
          sparks.forEach((s, i) => {
            const k = eOut(burst);
            tf(s, `translate(${(Number(s.dataset.x) * lerp(.3, 1, k)).toFixed(1)} ${(Number(s.dataset.y) * lerp(.3, 1, k)).toFixed(1)}) scale(${Math.max(.001, eBack(burst)).toFixed(3)})`);
            op(s, burst * 3);
          });

          // ---------- Cursor ----------
          let k = 0;
          while (k < CURSOR.length - 2 && p > CURSOR[k + 1][0]) k++;
          const [p0, x0, y0] = CURSOR[k], [p1, x1, y1] = CURSOR[k + 1];
          const t = eInOut(seg(p, p0, p1));
          const click = (seg(p, .925, .935) - seg(p, .935, .95)) + (seg(p, .3, .31) - seg(p, .31, .32));
          tf(el.cursor, `translate(${lerp(x0, x1, t).toFixed(1)} ${lerp(y0, y1, t).toFixed(1)})`);
          tf(el.cursorin, `scale(${(1 - .15 * click).toFixed(3)})`);
        }
      };
    }
  };
})();
