'use strict';
// Escena Valeria Ríos: un caso de identidad de marca filmado en 3D (CSS 3D + fotos reales).
// Brief en la reunión → retícula → símbolo → paleta → tipografía → piezas → propuesta lista.
(() => {
  window.NexoEscenas = window.NexoEscenas || {};

  // Las rutas de las fotos funcionan desde /index.html y desde /escenas/prueba.html.
  const SCRIPT = document.currentScript || document.querySelector('script[src*="valeria.js"]');
  const BASE = new URL('../', SCRIPT && SCRIPT.src ? SCRIPT.src : location.href);
  const IMG = name => new URL('assets/' + name, BASE).href;
  const MEET = IMG('creative-conversation.webp');
  const MEET_S = IMG('creative-conversation-small.webp');
  const DESK_S = IMG('professional-editorial-small.webp');
  const COSM = IMG('case-personal-cosmetics.webp');
  const COSM_S = IMG('case-personal-cosmetics-small.webp');

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eIn = t => t * t * t;
  const eIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => { const c = 1.35; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const r2 = n => Math.round(n * 100) / 100;
  const T3 = (x, y, z) => `translate3d(${r2(x)}px,${r2(y)}px,${r2(z)}px)`;
  const deg = (axis, a) => `rotate${axis}(${r2(a)}deg)`;

  const VIO = '#4b2fc4', IND = '#24166a', SUN = '#ffd36b', SAND = '#efe4d2', SAGE = '#9db59a', INK = '#1d1638';
  const SWATCHES = [[VIO, 'Violeta', '#4B2FC4'], [IND, 'Índigo', '#24166A'], [SUN, 'Sol', '#FFD36B'], [SAND, 'Arena', '#EFE4D2'], [SAGE, 'Salvia', '#9DB59A']];
  const C = 1800; // centro del set de piezas sobre la mesa

  // Cámara: [p, inclinación, giro, distancia, foco x, foco y, foco z]
  const CAM = [
    [0, 0, 0, 300, 0, -420, 0],
    [.07, 0, -2, -30, 0, -420, 0],
    [.12, 58, -12, 170, 0, 0, 10],
    [.165, 61, -4, 110, 0, 0, 0],
    [.27, 54, 6, 10, 0, -60, 20],
    [.34, 50, 4, 60, 0, -80, 20],
    [.48, 46, -6, 70, 0, -110, 30],
    [.565, 30, 0, 60, 0, -170, 100],
    [.64, 28, 6, 100, 0, -170, 100],
    [.7, 12, -16, 130, C, -160, 0],
    [.84, 10, -6, 90, C, -160, 0],
    [1, 9, 0, 150, C - 210, -150, 20]
  ];
  function camAt(p) {
    let k = 0;
    while (k < CAM.length - 2 && p > CAM[k + 1][0]) k++;
    const a = CAM[k], b = CAM[k + 1];
    const t = eIO(seg(p, a[0], b[0]));
    return { pitch: lerp(a[1], b[1], t), yaw: lerp(a[2], b[2], t), D: lerp(a[3], b[3], t), fx: lerp(a[4], b[4], t), fy: lerp(a[5], b[5], t), fz: lerp(a[6], b[6], t) };
  }

  // Notas del brief: flotan frente a la foto (f: x, y, z, rotZ, rotY) y luego caen sobre la mesa (d: x, z, rotZ).
  const NOTES = [
    { f: [-420, -300, 40, -4, 12], d: [-500, -120, -14] },
    { f: [430, -610, -40, 6, -14], d: [470, -190, 9] },
    { f: [450, -390, 130, -5, -18], d: [480, 70, -6] },
    { f: [-170, -190, 190, 7, 16], d: [-470, 150, 11] },
    { f: [-90, -680, -170, -3, 8], d: [-20, -330, 4] }
  ];

  const CSS = `
.sc-valeria-root{position:absolute;inset:0;overflow:hidden;background:#0d0730;color:${INK};font-family:'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif;font-style:normal;line-height:1.2;-webkit-font-smoothing:antialiased;clip-path:inset(0 round 18px);user-select:none;pointer-events:none}
.sc-valeria-root *{box-sizing:border-box;font-style:normal}
.sc-valeria-root img{display:block;width:100%;height:100%;object-fit:cover}
.sc-valeria-serif{font-family:Georgia,'Times New Roman',serif;font-weight:400}
.sc-valeria-mono{font-family:Consolas,'SFMono-Regular',Menlo,monospace}
.sc-valeria-bg{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 30%,#3a22a6 0%,#1d1062 46%,#0b0628 100%)}
.sc-valeria-ph{position:absolute;left:50%;top:50%;transform-origin:50% 50%}
.sc-valeria-ph--blur img{filter:blur(16px) saturate(1.05);transform:scale(1.08)}
.sc-valeria-ph--back img{filter:blur(12px) brightness(.62) saturate(.85);transform:scale(1.08)}
.sc-valeria-ph--back::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(58,34,166,.55),rgba(13,7,48,.9) 80%)}
.sc-valeria-ph--meet::after{content:'';position:absolute;inset:0;background:radial-gradient(110% 90% at 50% 45%,transparent 50%,rgba(13,7,48,.55)),linear-gradient(180deg,rgba(75,47,196,.08),rgba(13,7,48,.25))}
.sc-valeria-tag{position:absolute;display:flex;align-items:center;gap:.45em;white-space:nowrap;font-size:1em;font-weight:600;color:#fff;transform-origin:0 50%}
.sc-valeria-tag i{width:.7em;height:.7em;border-radius:50%;background:${SUN};box-shadow:0 0 0 .3em rgba(255,211,107,.28),0 0 1.2em rgba(255,211,107,.8)}
.sc-valeria-tag span{padding:.35em .75em;border-radius:99px;background:rgba(20,12,60,.62);border:1px solid rgba(255,255,255,.32);box-shadow:0 .4em 1.4em rgba(0,0,0,.35)}
.sc-valeria-ret{position:absolute;border:0 solid transparent}
.sc-valeria-ret b{position:absolute;width:1.4em;height:1.4em;border:2px solid ${SUN}}
.sc-valeria-ret b:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}.sc-valeria-ret b:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
.sc-valeria-ret b:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}.sc-valeria-ret b:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
.sc-valeria-ret span{position:absolute;left:0;top:-2.1em;font-size:.95em;font-weight:700;color:${INK};background:${SUN};padding:.25em .7em;border-radius:6px;white-space:nowrap}
.sc-valeria-fit{position:absolute;left:50%;top:50%;width:0;height:0}
.sc-valeria-view{position:absolute;left:0;top:0;width:0;height:0;perspective:1100px;perspective-origin:0 0}
.sc-valeria-world,.sc-valeria-o,.sc-valeria-mirror,.sc-valeria-pieces{transform-style:preserve-3d}
.sc-valeria-world,.sc-valeria-o,.sc-valeria-mirror,.sc-valeria-pieces{position:absolute;left:0;top:0;width:0;height:0}
.sc-valeria-p{position:absolute;left:0;top:0}
.sc-valeria-f{position:absolute;left:0;top:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.sc-valeria-floor{background:radial-gradient(14% 20% at 26% 54%,rgba(255,211,107,.18),rgba(255,211,107,0)),radial-gradient(34% 30% at 65% 8%,rgba(255,214,150,.22),rgba(255,214,150,0)),radial-gradient(46% 42% at 65% 8%,rgba(70,46,196,.95),rgba(70,46,196,0)),radial-gradient(24% 26% at 65% 52%,rgba(21,12,64,.6),rgba(21,12,64,.8) 60%,rgba(18,10,56,.97))}
.sc-valeria-sub{background:#07041a}
.sc-valeria-wall{background:radial-gradient(22% 50% at 65% 100%,rgba(255,214,150,.3),rgba(255,214,150,0)),radial-gradient(40% 95% at 65% 100%,#4a30c6 0%,#2c1b8c 40%,#170d52 75%,#0d0733 100%)}
.sc-valeria-fog{background:radial-gradient(closest-side,rgba(14,8,44,.5),rgba(14,8,44,.5) 70%,rgba(14,8,44,0))}
.sc-valeria-paper{background:linear-gradient(160deg,#fbf8f2 0%,#f4efe4 60%,#ebe4d6 100%);box-shadow:0 0 0 1px rgba(0,0,0,.04),0 40px 70px rgba(0,0,0,.55),0 10px 18px rgba(0,0,0,.35)}
.sc-valeria-paper svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.sc-valeria-pad{position:absolute;left:0;top:0;padding:18px 20px;border-radius:4px;box-shadow:0 18px 30px rgba(0,0,0,.35),0 3px 6px rgba(0,0,0,.25),inset 0 -14px 22px rgba(0,0,0,.06)}
.sc-valeria-pad::before{content:'';position:absolute;left:50%;top:-12px;width:64px;height:24px;margin-left:-32px;background:rgba(255,255,255,.55);box-shadow:0 1px 2px rgba(0,0,0,.12);transform:rotate(-3deg)}
.sc-valeria-pad small{display:block;font-size:15px;font-weight:700;letter-spacing:.2em;color:${VIO};margin-bottom:8px}
.sc-valeria-pad strong{display:block;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:40px;line-height:1;color:${INK}}
.sc-valeria-pad span{display:block;margin-top:10px;font-size:19px;color:#4c4466}
.sc-valeria-pad--y{background:linear-gradient(170deg,#ffe58f,#ffd36b 70%,#f2c457)}
.sc-valeria-pad--l{background:linear-gradient(170deg,#e4dcff,#d3c6ff 70%,#c3b3fa)}
.sc-valeria-pad--w{background:linear-gradient(170deg,#ffffff,#f4f1fa)}
.sc-valeria-pad--s{background:linear-gradient(170deg,#f7efe2,${SAND})}
.sc-valeria-ar{position:absolute;left:0;top:0}
.sc-valeria-ar span{position:absolute;left:0;bottom:0;transform:translateX(-50%);white-space:nowrap;padding:8px 16px;border-radius:99px;font-size:22px;font-weight:700;color:#fff;background:rgba(36,22,106,.82);border:1.5px solid rgba(255,211,107,.85);box-shadow:0 10px 26px rgba(0,0,0,.35)}
.sc-valeria-ar span b{color:${SUN};font-family:Georgia,'Times New Roman',serif;font-weight:400}
.sc-valeria-ar i{position:absolute;left:-1px;top:0;width:2px;background:linear-gradient(${SUN},rgba(255,211,107,.15))}
.sc-valeria-ar u{position:absolute;left:-7px;width:14px;height:14px;border-radius:50%;background:${SUN};box-shadow:0 0 14px ${SUN}}
.sc-valeria-sh{position:absolute;left:0;top:0;border-radius:50%;background:radial-gradient(closest-side,rgba(4,2,18,.75),rgba(4,2,18,.35) 55%,rgba(4,2,18,0))}
.sc-valeria-disc{border-radius:50%}
.sc-valeria-tok-face{background:linear-gradient(150deg,#6d50f2 0%,#5235d6 45%,${VIO} 70%,#3a22a6 100%);box-shadow:inset 0 0 0 5px #3d26ae,inset 0 0 0 7px rgba(255,211,107,.55)}
.sc-valeria-tok-face svg{position:absolute;inset:0;width:100%;height:100%}
.sc-valeria-tok-face::after{content:'';position:absolute;inset:0;border-radius:50%;background:linear-gradient(125deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 30%,rgba(255,255,255,0) 75%,rgba(255,255,255,.1) 100%)}
.sc-valeria-tok-edge{background:#25147a;box-shadow:inset 0 0 0 3px #8a6a2a}
.sc-valeria-sw{position:absolute;left:0;top:0;width:118px;height:320px;border-radius:10px;background:#fbf9f4;box-shadow:0 10px 24px rgba(0,0,0,.32),0 2px 4px rgba(0,0,0,.2);overflow:hidden;transform-origin:59px 292px}
.sc-valeria-sw i{position:absolute;left:0;right:0;top:78px;bottom:0;box-shadow:inset 0 30px 40px rgba(255,255,255,.12),inset 0 -40px 50px rgba(0,0,0,.12)}
.sc-valeria-sw b{position:absolute;left:12px;top:12px;font-size:21px;font-weight:700;color:${INK}}
.sc-valeria-sw small{position:absolute;left:12px;top:44px;font-size:16px;color:#5c5672;font-family:Consolas,'SFMono-Regular',Menlo,monospace}
.sc-valeria-sw u{position:absolute;left:50px;top:283px;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff6cf,#d9a93c 60%,#8c6619);box-shadow:0 1px 2px rgba(0,0,0,.4)}
.sc-valeria-spec{background:linear-gradient(150deg,#fffdf8,#f3eee3);border-radius:10px;padding:26px 30px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}
.sc-valeria-spec-aa{position:absolute;left:28px;top:20px;font-family:Georgia,'Times New Roman',serif;font-size:170px;line-height:1;color:${VIO}}
.sc-valeria-spec-r{position:absolute;left:262px;top:30px;right:24px}
.sc-valeria-spec-r small{display:block;font-size:14px;font-weight:700;letter-spacing:.22em;color:${VIO}}
.sc-valeria-spec-r strong{display:block;margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${INK}}
.sc-valeria-spec-r span{display:block;margin-top:4px;font-size:16px;color:#5c5672}
.sc-valeria-spec-r p{margin:0;display:block;margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-size:19px;letter-spacing:.06em;color:#3b3355}
.sc-valeria-spec-h{position:absolute;left:30px;top:212px;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1;color:${INK};white-space:nowrap}
.sc-valeria-spec-s{position:absolute;left:31px;top:262px;font-size:18px;color:#5c5672}
.sc-valeria-spec-c{position:absolute;top:208px;width:3px;height:46px;background:${VIO}}
.sc-valeria-spec-shine{position:absolute;inset:-20% -60%;background:linear-gradient(105deg,rgba(255,255,255,0) 40%,rgba(255,255,255,.55) 50%,rgba(255,255,255,0) 60%)}
.sc-valeria-spec-back{background:linear-gradient(150deg,#5a3be0,${VIO} 50%,#2f1c8f);border-radius:10px}
.sc-valeria-edge{background:linear-gradient(90deg,#e2dccd,#cfc6b2)}
.sc-valeria-ph-front{border-radius:28px;background:#0b0912;padding:8px;box-shadow:inset 0 0 0 2px #3a3350,inset 0 0 0 3px #0b0912}
.sc-valeria-scr{position:relative;width:100%;height:100%;border-radius:21px;overflow:hidden;background:#fbf8f2}
.sc-valeria-scr-top{display:flex;justify-content:space-between;align-items:center;padding:8px 14px 0;font-size:11px;font-weight:700;color:${INK}}
.sc-valeria-scr-nav{display:flex;justify-content:center;align-items:center;gap:6px;padding:6px 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${INK}}
.sc-valeria-scr-hero{position:relative;margin:0 9px;height:150px;border-radius:14px;overflow:hidden;background-size:cover;background-position:38% 62%}
.sc-valeria-scr-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(29,22,56,0) 35%,rgba(29,22,56,.75))}
.sc-valeria-scr-hero b{position:absolute;left:12px;bottom:12px;z-index:1;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:21px;line-height:1.05;color:#fff}
.sc-valeria-scr-btn{margin:10px 9px 0;height:30px;border-radius:99px;background:${VIO};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px}
.sc-valeria-scr-btn i{width:7px;height:7px;border-radius:50%;background:${SUN}}
.sc-valeria-scr-row{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 9px 0}
.sc-valeria-scr-row div{height:72px;border-radius:10px;background-size:420% auto;position:relative;overflow:hidden}
.sc-valeria-scr-row span{position:absolute;left:6px;bottom:5px;font-size:10px;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.sc-valeria-glass{position:absolute;inset:0;border-radius:21px;background:linear-gradient(118deg,rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 72%,rgba(255,255,255,.08) 100%)}
.sc-valeria-notch{position:absolute;left:50%;top:13px;width:50px;height:14px;margin-left:-25px;border-radius:9px;background:#0b0912;z-index:2}
.sc-valeria-ph-back{border-radius:28px;background:linear-gradient(140deg,#6b4ff0,${VIO} 45%,#2c1a88)}
.sc-valeria-ph-back::before{content:'';position:absolute;left:16px;top:16px;width:58px;height:58px;border-radius:16px;background:linear-gradient(140deg,#3a26a0,#1c1060);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2)}
.sc-valeria-ph-side{border-radius:6px;background:linear-gradient(90deg,#1f1640,#4a3a8c 45%,#231a4a)}
.sc-valeria-ph-cap{border-radius:6px;background:linear-gradient(180deg,#4a3a8c,#1f1640)}
.sc-valeria-bx-front{background:linear-gradient(165deg,#5b3de2,${VIO} 45%,#3a24a8);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#f6efe0;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.sc-valeria-bx-front svg{width:96px;height:96px}
.sc-valeria-bx-front strong{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;letter-spacing:.04em}
.sc-valeria-bx-front span{font-size:11px;font-weight:700;letter-spacing:.24em;color:${SUN}}
.sc-valeria-bx-side{background-size:cover;background-position:62% 55%}
.sc-valeria-bx-side::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(29,22,56,0) 55%,rgba(36,22,106,.9)),linear-gradient(90deg,rgba(0,0,0,.28),rgba(0,0,0,.1))}
.sc-valeria-bx-side b{position:absolute;left:12px;right:10px;bottom:14px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:19px;line-height:1.05;color:#fff}
.sc-valeria-bx-top{background:linear-gradient(150deg,#7457ee,#5637d8)}
.sc-valeria-bx-left{background:linear-gradient(90deg,#24156b,#2f1c8f)}
.sc-valeria-bc{border-radius:8px;overflow:hidden}
.sc-valeria-bc-front{background:linear-gradient(160deg,#fffdf8,#f1ebdf);padding:18px 20px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}
.sc-valeria-bc-front::after{content:'';position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,${VIO} 0 40%,${SUN} 40% 70%,${SAGE} 70%)}
.sc-valeria-bc-front svg{position:absolute;right:16px;top:14px;width:46px;height:46px}
.sc-valeria-bc-front strong{display:block;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:26px;color:${INK}}
.sc-valeria-bc-front span{display:block;font-size:13px;color:#5c5672;margin-top:3px}
.sc-valeria-bc-front b{display:block;margin-top:16px;font-size:15px;color:${INK}}
.sc-valeria-bc-back{background:linear-gradient(150deg,#5b3de2,${VIO} 50%,#2f1c8f)}
.sc-valeria-bc-back svg{position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px}
.sc-valeria-strip{border-radius:8px;background:#fbf9f4;padding:10px;display:flex;gap:8px;box-shadow:0 14px 26px rgba(0,0,0,.45)}
.sc-valeria-strip i{flex:1;border-radius:4px}
.sc-valeria-front{position:absolute;inset:0}
.sc-valeria-doc-w{position:absolute;left:0;top:0;transform-style:preserve-3d}
.sc-valeria-doc{position:absolute;inset:0;border-radius:1em;background:linear-gradient(160deg,#ffffff,#f6f2ea);box-shadow:0 1.6em 3.2em rgba(5,2,25,.55),0 .3em .8em rgba(5,2,25,.35),inset 0 0 0 1px rgba(0,0,0,.04);padding:1.15em 1.3em;overflow:hidden;color:${INK}}
.sc-valeria-doc::before{content:'';position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.7) 48%,rgba(255,255,255,0) 60%);transform:translateX(var(--sc-valeria-shine,120%))}
.sc-valeria-doc-k{display:flex;justify-content:space-between;align-items:center;font-size:.62em;font-weight:800;letter-spacing:.22em;color:${VIO}}
.sc-valeria-doc-k span{letter-spacing:0;font-weight:600;color:#7a7392}
.sc-valeria-doc h4{margin:.28em 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:2.05em;line-height:1;letter-spacing:-.01em;color:${INK}}
.sc-valeria-doc-row{display:flex;gap:.45em;margin-top:.7em;height:3.3em}
.sc-valeria-doc-row>div{border-radius:.4em;overflow:hidden;position:relative}
.sc-valeria-doc-m{width:3.3em;background:linear-gradient(150deg,#5b3de2,${VIO} 50%,#2f1c8f)}
.sc-valeria-doc-m svg{position:absolute;inset:12%;width:76%;height:76%}
.sc-valeria-doc-ph{flex:1.5;background-size:cover;background-position:45% 60%}
.sc-valeria-doc-t{flex:1;background:#f1ece2;display:flex;align-items:center;justify-content:center;font-family:Georgia,'Times New Roman',serif;font-size:1.7em;color:${VIO}}
.sc-valeria-doc-sw{width:1.2em;display:flex;flex-direction:column;gap:2px}
.sc-valeria-doc-sw i{flex:1;border-radius:2px}
.sc-valeria-doc-ok{display:flex;align-items:center;gap:.5em;margin-top:.75em}
.sc-valeria-doc-ok span{display:inline-flex;white-space:nowrap;align-items:center;gap:.4em;padding:.38em .8em .38em .5em;border-radius:99px;background:${SUN};font-size:.82em;font-weight:800;color:${IND}}
.sc-valeria-doc-ok svg{width:1.3em;height:1.3em}
.sc-valeria-doc-ok small{margin-left:auto;font-size:.6em;color:#7a7392;white-space:nowrap}
.sc-valeria-doc-sh{position:absolute;left:0;top:0;border-radius:50%;background:radial-gradient(closest-side,rgba(3,1,15,.6),rgba(3,1,15,0))}
.sc-valeria-spark{position:absolute;left:0;top:0;width:1.1em;height:1.1em;margin:-.55em 0 0 -.55em;background:${SUN};clip-path:polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%);filter:drop-shadow(0 0 .3em rgba(255,211,107,.9))}
.sc-valeria-vig{position:absolute;inset:0;background:radial-gradient(130% 110% at 50% 45%,rgba(0,0,0,0) 55%,rgba(5,2,25,.6) 100%)}
.sc-valeria-beam{position:absolute;inset:0;mix-blend-mode:screen;background:linear-gradient(118deg,rgba(255,214,140,.22) 0%,rgba(255,214,140,.06) 28%,rgba(255,214,140,0) 46%),radial-gradient(60% 50% at 8% 0%,rgba(255,226,170,.25),rgba(255,226,170,0))}
.sc-valeria-grain{position:absolute;inset:0;opacity:.09;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.sc-valeria-hud{position:absolute;left:3.2%;top:5%;display:flex;flex-direction:column;gap:.25em;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.45)}
.sc-valeria-hud small{font-size:.72em;font-weight:700;letter-spacing:.24em;color:${SUN}}
.sc-valeria-hud b{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:1.25em;letter-spacing:.01em}
.sc-valeria-defs{position:absolute;width:0;height:0;overflow:hidden}
`;

  const mono = (stroke, fill, extra = '') => `<svg viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">${extra}<use href="#sc-valeria-mono" x="-100" y="-100" width="200" height="200" stroke="${stroke}" fill="${fill}"/></svg>`;
  const P = (cls, w, h, inner = '', style = '') => `<div class="${cls}" style="width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px;${style}">${inner}</div>`;
  const F = (cls, w, h, tf, inner = '', style = '') => `<div class="sc-valeria-f ${cls}" style="width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px;transform:${tf};${style}">${inner}</div>`;

  function paperSvg() {
    const L = [];
    const line = (x1, y1, x2, y2, o = .4) => L.push(`<path class="sc-valeria-gl" d="M${x1} ${y1}L${x2} ${y2}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke="${VIO}" stroke-opacity="${o}" stroke-width="1.6" fill="none"/>`);
    line(40, 36, 620, 36, .55); line(620, 36, 620, 404, .55); line(620, 404, 40, 404, .55); line(40, 404, 40, 36, .55);
    for (let k = 1; k < 6; k++) line(r2(40 + k * 580 / 6), 36, r2(40 + k * 580 / 6), 404, .3);
    for (let k = 1; k < 4; k++) line(40, 36 + k * 92, 620, 36 + k * 92, .3);
    line(40, 36, 620, 404, .22); line(620, 36, 40, 404, .22);
    const circ = [[330, 220, 150, '#e0a526', .8], [330, 220, 92.7, '#e0a526', .8], [330, 220, 57.3, VIO, .5], [286, 167, 35.4, VIO, .45], [374, 277, 35.4, VIO, .45]];
    const C2 = circ.map(([x, y, r, c, o]) => `<circle class="sc-valeria-gc" cx="${x}" cy="${y}" r="${r}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 ${x} ${y})" stroke="${c}" stroke-opacity="${o}" stroke-width="1.8" fill="none"/>`).join('');
    return `<svg viewBox="0 0 660 440" aria-hidden="true" focusable="false">${L.join('')}${C2}
<g class="sc-valeria-phi"><text x="468" y="78" font-size="22" fill="#c48a14" font-family="Georgia,serif">φ = 1,618</text><path d="M330 384H480M330 377v14M480 377v14" stroke="#c48a14" stroke-width="1.6" fill="none"/><text x="405" y="372" text-anchor="middle" font-size="14" fill="#c48a14" font-family="Consolas,monospace">150 : 92,7</text></g>
<circle class="sc-valeria-seal" cx="330" cy="220" r="118" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 330 220)" stroke="${VIO}" stroke-width="4" fill="none"/>
<path class="sc-valeria-n" d="M286 277V167L374 277V167" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke="${VIO}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
<path class="sc-valeria-leaf" d="M374 167C372 140 392 120 420 117C420 146 402 165 374 167Z" fill="${SAGE}" style="transform-origin:374px 167px"/>
<text class="sc-valeria-word" x="330" y="398" text-anchor="middle" font-size="36" letter-spacing="3" fill="${INK}" font-family="Georgia,serif">Nativa</text>
</svg>`;
  }

  function markup() {
    const notes = [
      ['w', 260, 170, '<small>BRIEF</small><strong>Nativa</strong><span>cosmética natural · Bogotá</span>'],
      ['y', 190, 150, '<small>TONO</small><strong>cálida</strong>'],
      ['l', 200, 150, '<small>TONO</small><strong>honesta</strong>'],
      ['y', 190, 150, '<small>VALOR</small><strong>natural</strong>'],
      ['s', 230, 140, '<small>PROMESA</small><strong>hecha aquí</strong>']
    ].map(([k, w, h, html], i) => `<div class="sc-valeria-o sc-valeria-note" data-i="${i}">${P(`sc-valeria-pad sc-valeria-pad--${k}`, w, h, html)}</div>`).join('');

    const tokenLayers = Array.from({ length: 9 }, (_, i) => F('sc-valeria-disc sc-valeria-tok-edge', 224, 224, `translateZ(${-(i + 1) * 1.6}px)`, '', 'backface-visibility:visible')).join('');
    const token = `<div class="sc-valeria-o sc-valeria-token">${tokenLayers}
      ${F('sc-valeria-disc sc-valeria-tok-face', 224, 224, 'translateZ(0)', mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)', '<circle r="88" fill="none" stroke="url(#sc-valeria-gold)" stroke-width="2.5"/>'))}
      ${F('sc-valeria-disc sc-valeria-tok-face', 224, 224, 'rotateY(180deg) translateZ(16px)', mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)'))}</div>`;

    const fan = `<div class="sc-valeria-o sc-valeria-fan">${SWATCHES.map(([c, name, hex]) => `<div class="sc-valeria-sw" style="margin:-292px 0 0 -59px"><i style="background:${c}"></i><b>${name}</b><small>${hex}</small><u></u></div>`).join('')}</div>`;

    const spec = `<div class="sc-valeria-o sc-valeria-spec-o">
      ${F('sc-valeria-spec', 470, 310, 'translateZ(4px)', `<div class="sc-valeria-spec-aa">Aa</div>
        <div class="sc-valeria-spec-r"><small>TIPOGRAFÍA</small><strong>Nativa Serif</strong><span>Títulos · regular 400</span><span>Textos · Sans 400 / 700</span><p>AaBbCcÑñ 0123</p></div>
        <div class="sc-valeria-spec-h">Raíces que florecen</div><div class="sc-valeria-spec-c"></div>
        <div class="sc-valeria-spec-s">Cosmética natural, hecha aquí.</div><div class="sc-valeria-spec-shine"></div>`)}
      ${F('sc-valeria-spec-back', 470, 310, 'rotateY(180deg) translateZ(4px)', mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)'), 'display:flex')}
      ${F('sc-valeria-edge', 8, 310, 'rotateY(90deg) translateZ(235px)', '', 'backface-visibility:visible')}
      ${F('sc-valeria-edge', 8, 310, 'rotateY(-90deg) translateZ(235px)', '', 'backface-visibility:visible')}
      ${F('sc-valeria-edge', 470, 8, 'rotateX(90deg) translateZ(155px)', '', 'backface-visibility:visible')}
      ${F('sc-valeria-edge', 470, 8, 'rotateX(-90deg) translateZ(155px)', '', 'backface-visibility:visible')}</div>`;

    const phone = `<div class="sc-valeria-o sc-valeria-phone">
      ${F('sc-valeria-ph-front', 172, 352, 'translateZ(8px)', `<div class="sc-valeria-scr"><div class="sc-valeria-notch"></div>
        <div class="sc-valeria-scr-top"><span>9:41</span><span>●●●</span></div>
        <div class="sc-valeria-scr-nav"><span style="display:inline-block;width:18px;height:18px">${mono(VIO, SAGE)}</span>Nativa</div>
        <div class="sc-valeria-scr-hero" style="background-image:url('${COSM_S}')"><b>Raíces que<br>florecen</b></div>
        <div class="sc-valeria-scr-btn"><i></i>Comprar ahora</div>
        <div class="sc-valeria-scr-row"><div style="background-image:url('${COSM_S}');background-position:30% 62%"><span>Sérum</span></div><div style="background-image:url('${COSM_S}');background-position:48% 70%"><span>Crema</span></div></div>
        <div class="sc-valeria-glass"></div></div>`)}
      ${F('sc-valeria-ph-back', 172, 352, 'rotateY(180deg) translateZ(8px)', `<div style="position:absolute;left:50%;top:55%;width:64px;height:64px;margin:-32px 0 0 -32px">${mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)')}</div>`)}
      ${F('sc-valeria-ph-side', 16, 320, 'rotateY(90deg) translateZ(84px)')}
      ${F('sc-valeria-ph-side', 16, 320, 'rotateY(-90deg) translateZ(84px)')}
      ${F('sc-valeria-ph-cap', 140, 16, 'rotateX(90deg) translateZ(174px)')}</div>`;

    const box = `<div class="sc-valeria-o sc-valeria-box">
      ${F('sc-valeria-bx-front', 190, 250, 'translateZ(65px)', `${mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)')}<strong>Nativa</strong><span>SÉRUM FACIAL · 30 ml</span>`)}
      ${F('sc-valeria-bx-side', 130, 250, 'rotateY(90deg) translateZ(95px)', '<b>Raíces que florecen</b>', `background-image:url('${COSM_S}')`)}
      ${F('sc-valeria-bx-left', 130, 250, 'rotateY(-90deg) translateZ(95px)')}
      ${F('sc-valeria-bx-top', 190, 130, 'rotateX(90deg) translateZ(125px)', `<div style="position:absolute;left:50%;top:50%;width:56px;height:56px;margin:-28px 0 0 -28px;opacity:.55">${mono('#ffffff', 'none')}</div>`)}
      ${F('sc-valeria-bx-left', 190, 250, 'rotateY(180deg) translateZ(65px)')}</div>`;

    const card = `<div class="sc-valeria-o sc-valeria-card">
      ${F('sc-valeria-bc sc-valeria-bc-front', 250, 144, 'translateZ(.8px)', `${mono(VIO, SAGE)}<strong>Andrés Mejía</strong><span>Fundador · Nativa</span><b>hola@nativa.co</b>`)}
      ${F('sc-valeria-bc sc-valeria-bc-back', 250, 144, 'rotateY(180deg) translateZ(.8px)', mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)'))}</div>`;

    const sh = cls => `<div class="sc-valeria-o ${cls}"><div class="sc-valeria-sh" style="width:200px;height:200px;margin:-100px 0 0 -100px"></div></div>`;
    const ar = (cls, html) => `<div class="sc-valeria-o ${cls}"><div class="sc-valeria-ar"><i></i><u></u><span>${html}</span></div></div>`;

    const sparks = Array.from({ length: 7 }, () => '<div class="sc-valeria-spark"></div>').join('');

    return `<div class="sc-valeria-root" aria-hidden="true">
<svg class="sc-valeria-defs" aria-hidden="true" focusable="false"><defs>
  <linearGradient id="sc-valeria-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".42" stop-color="${SUN}"/><stop offset=".72" stop-color="#c8912a"/><stop offset="1" stop-color="#ffe39a"/></linearGradient>
  <symbol id="sc-valeria-mono" viewBox="-100 -100 200 200"><path d="M-40 52V-48L40 52V-48" fill="none" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="M40 -48C38 -72 56 -90 82 -92C82 -66 66 -50 40 -48Z" stroke="none"/></symbol>
</defs></svg>
<div class="sc-valeria-bg"></div>
<div class="sc-valeria-ph sc-valeria-ph--back"><img src="${DESK_S}" alt="" decoding="async" draggable="false"></div>
<div class="sc-valeria-ph sc-valeria-ph--meet"><img src="${MEET}" alt="" decoding="async" draggable="false">
  <div class="sc-valeria-tag" style="left:30%;top:29%"><i></i><span>Valeria · estratega</span></div>
  <div class="sc-valeria-tag" style="left:58%;top:27%"><i></i><span>Andrés · cliente</span></div>
  <div class="sc-valeria-ret" style="left:35%;top:66%;width:36%;height:24%"><b></b><b></b><b></b><b></b><span>Brief · primera reunión</span></div>
</div>
<div class="sc-valeria-ph sc-valeria-ph--blur"><img src="${MEET_S}" alt="" decoding="async" draggable="false"></div>
<div class="sc-valeria-fit"><div class="sc-valeria-view"><div class="sc-valeria-world">
  ${P('sc-valeria-p sc-valeria-wall', 4600, 1700, '', 'transform:translate3d(1100px,-850px,-1150px);opacity:0')}
  ${P('sc-valeria-p sc-valeria-sub', 2600, 2000, '', `transform:translate3d(${C}px,360px,-200px) rotateX(90deg)`)}
  <div class="sc-valeria-mirror" style="transform:scale3d(1,-1,1)"></div>
  ${P('sc-valeria-p sc-valeria-fog', 1800, 1300, '', `transform:translate3d(${C}px,110px,0) rotateX(90deg)`)}
  ${P('sc-valeria-p sc-valeria-fog', 1800, 1300, '', `transform:translate3d(${C}px,220px,0) rotateX(90deg)`)}
  ${P('sc-valeria-p sc-valeria-floor', 4600, 2500, '', 'transform:translate3d(1100px,0,-100px) rotateX(90deg)')}
  ${P('sc-valeria-p sc-valeria-paper', 660, 440, paperSvg(), 'transform:translate3d(0,-1px,0) rotateX(90deg)')}
  <div class="sc-valeria-o sc-valeria-strip-o">${P('sc-valeria-strip', 300, 80, SWATCHES.map(s => `<i style="background:${s[0]}"></i>`).join(''))}</div>
  ${sh('sc-valeria-sh-tok')}${sh('sc-valeria-sh-fan')}${sh('sc-valeria-sh-spec')}${sh('sc-valeria-sh-box')}${sh('sc-valeria-sh-phone')}${sh('sc-valeria-sh-card')}
  ${notes}
  ${ar('sc-valeria-ar1', 'Retícula · <b>6 × 4</b>')}
  ${ar('sc-valeria-ar2', 'Proporción áurea · <b>φ</b>')}
  ${ar('sc-valeria-ar3', 'Paleta · <b>5 tonos</b>')}
  ${token}${fan}${spec}
  <div class="sc-valeria-pieces">${box}${phone}${card}</div>
</div></div></div>
<div class="sc-valeria-beam"></div>
<div class="sc-valeria-front"><div class="sc-valeria-doc-sh"></div><div class="sc-valeria-doc-w">
  <div class="sc-valeria-doc">
    <div class="sc-valeria-doc-k">PROPUESTA<span class="sc-valeria-mono">v1 · nov</span></div>
    <h4>Marca Nativa</h4>
    <div class="sc-valeria-doc-row"><div class="sc-valeria-doc-m">${mono('url(#sc-valeria-gold)', 'url(#sc-valeria-gold)')}</div><div class="sc-valeria-doc-ph" style="background-image:url('${COSM_S}')"></div><div class="sc-valeria-doc-t">Aa</div><div class="sc-valeria-doc-sw">${SWATCHES.map(s => `<i style="background:${s[0]}"></i>`).join('')}</div></div>
    <div class="sc-valeria-doc-ok"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${IND}"/><path class="sc-valeria-chk" d="M6.5 12.5l3.6 3.6 7.4-8" fill="none" stroke="${SUN}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></svg>lista para revisión</span><small>por Valeria Ríos</small></div>
  </div>${sparks}
</div></div>
<div class="sc-valeria-vig"></div>
<div class="sc-valeria-grain"></div>
<div class="sc-valeria-hud"><small>NATIVA · IDENTIDAD DE MARCA</small><b class="sc-valeria-hud-t">01 — El brief</b></div>
</div>`;
  }

  const CHAPTERS = [[0, '01 — El brief'], [.1, '01 — La retícula'], [.16, '02 — El símbolo'], [.34, '03 — La paleta'], [.5, '04 — La tipografía'], [.66, '05 — Las piezas'], [.84, '06 — Propuesta lista']];

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
      if (!document.getElementById('sc-valeria-style')) {
        const st = document.createElement('style');
        st.id = 'sc-valeria-style';
        st.textContent = CSS;
        document.head.append(st);
      }
      stage.insertAdjacentHTML('beforeend', markup());
      const root = stage.querySelector('.sc-valeria-root');
      const q = s => root.querySelector('.sc-valeria-' + s);
      const qa = s => [...root.querySelectorAll('.sc-valeria-' + s)];

      // Reflejos: copias espejadas de las piezas bajo el piso translúcido.
      const mirror = q('mirror');
      const pair = {};
      ['box', 'phone', 'card', 'strip-o'].forEach(k => { const o = q(k); const c = o.cloneNode(true); mirror.append(c); pair[k] = [o, c]; });
      const both = k => pair[k];

      const el = {
        meet: q('ph--meet'), blur: q('ph--blur'), back: q('ph--back'), world: q('world'), fit: q('fit'),
        paper: q('paper'), floor: q('floor'), wall: q('wall'), tags: qa('tag'), ret: q('ret'),
        notes: qa('note'), pads: qa('pad'), gl: qa('gl'), gc: qa('gc'), phi: q('phi'), seal: q('seal'), n: q('n'), leaf: q('leaf'), word: q('word'),
        ar1: q('ar1'), ar2: q('ar2'), ar3: q('ar3'),
        token: q('token'), fan: q('fan'), sws: qa('sw'), spec: q('spec-o'), specH: q('spec-h'), specC: q('spec-c'), specS: q('spec-s'), shine: q('spec-shine'),
        box: both('box'), phone: both('phone'), card: both('card'), strip: both('strip-o'),
        shTok: q('sh-tok'), shFan: q('sh-fan'), shSpec: q('sh-spec'), shBox: q('sh-box'), shPhone: q('sh-phone'), shCard: q('sh-card'),
        docW: q('doc-w'), doc: q('doc'), docSh: q('doc-sh'), chk: q('chk'), sparks: qa('spark'), hud: q('hud'), hudT: q('hud-t'), beam: q('beam')
      };
      const shPads = [el.shTok, el.shFan, el.shSpec, el.shBox, el.shPhone, el.shCard].map(s => s.firstElementChild);

      const cache = new WeakMap();
      const put = (node, prop, v) => {
        let c = cache.get(node);
        if (!c) { c = {}; cache.set(node, c); }
        if (c[prop] !== v) { c[prop] = v; if (prop[0] === '-') node.style.setProperty(prop, v); else node.style[prop] = v; }
      };
      const tf = (node, v) => (Array.isArray(node) ? node.forEach(n => put(n, 'transform', v)) : put(node, 'transform', v));
      const op = (node, v) => put(node, 'opacity', String(r2(clamp(v))));
      const vis = (node, on) => (Array.isArray(node) ? node.forEach(n => put(n, 'visibility', on ? '' : 'hidden')) : put(node, 'visibility', on ? '' : 'hidden'));
      const dash = (node, v) => { const s = String(r2(1 - clamp(v))); let c = cache.get(node); if (!c) { c = {}; cache.set(node, c); } if (c.d !== s) { c.d = s; node.setAttribute('stroke-dashoffset', s); } };

      // Distribución según el tamaño real del escenario (no depende de p, así render sigue siendo puro).
      const L = { s: 1, W: 1, H: 1, narrow: false, sx: 1, dz: 0 };
      function layout() {
        const W = stage.clientWidth, H = stage.clientHeight;
        if (!W || !H) return false;
        L.W = W; L.H = H;
        L.s = Math.min(H / 560, W / 760);
        L.narrow = W / H < 1.7;
        L.sx = L.narrow ? .64 : 1;
        L.dz = L.narrow ? 170 : 0;
        el.fit.style.transform = `scale(${r2(L.s * 1000) / 1000})`;
        let pw = Math.max(W, H * 16 / 9) * 1.04, ph = pw * 9 / 16;
        if (ph < H * 1.04) { ph = H * 1.04; pw = ph * 16 / 9; }
        [el.meet, el.blur, el.back].forEach(n => { n.style.width = pw + 'px'; n.style.height = ph + 'px'; n.style.margin = `${-ph / 2}px 0 0 ${-pw / 2}px`; });
        el.meet.style.fontSize = clamp(W / 62, 9, 13) + 'px';
        el.hud.style.fontSize = clamp(W / 58, 10, 15) + 'px';
        // Documento de la propuesta (capa nítida al frente)
        const dw = L.narrow ? Math.min(W * .62, 330) : Math.min(W * .36, 440);
        L.dw = dw; L.dh = dw * .62;
        el.docW.style.width = dw + 'px'; el.docW.style.height = L.dh + 'px';
        el.docW.style.fontSize = (dw / 19) + 'px';
        q('front').style.perspective = Math.round(W * 1.3) + 'px';
        return true;
      }

      let last = 0;
      function render(p) {
        last = p;
        const cam = camAt(p);
        if (L.narrow) cam.fx += 110 * eIO(seg(p, .84, 1));
        const D = cam.D + L.dz;
        tf(el.world, `translateZ(${r2(-D)}px) rotateX(${r2(-cam.pitch)}deg) rotateY(${r2(cam.yaw)}deg) translate3d(${r2(-cam.fx)}px,${r2(-cam.fy)}px,${r2(-cam.fz)}px)`);
        const bb = `rotateY(${r2(-cam.yaw)}deg) rotateX(${r2(cam.pitch)}deg)`; // mira siempre a cámara
        const sx = L.sx;

        // ---------- Brief: la cámara entra en la reunión ----------
        const dolly = eIO(seg(p, 0, .075));
        const crane = eIO(seg(p, .065, .12));
        tf(el.meet, `translate3d(${r2(lerp(0, -2, dolly))}%,${r2(lerp(1.5, -1, dolly) - crane * 62)}%,0) scale(${r2(lerp(1.02, 1.2, dolly) + crane * .1)})`);
        op(el.meet, 1 - seg(p, .05, .1));
        tf(el.blur, `translate3d(${r2(lerp(0, -2, dolly))}%,${r2(lerp(1.5, -1, dolly) - crane * 62)}%,0) scale(${r2(lerp(1.02, 1.2, dolly) + crane * .1)})`);
        op(el.blur, seg(p, .035, .065) * (1 - seg(p, .085, .115)));
        el.tags.forEach((t, i) => { const a = seg(p, .008 + i * .008, .022 + i * .008) * (1 - seg(p, .05, .062)); op(t, a); tf(t, `scale(${r2(lerp(.85, 1, eOut(a)))})`); });
        const ra = seg(p, .02, .034) * (1 - seg(p, .055, .066));
        op(el.ret, ra); tf(el.ret, `scale(${r2(lerp(1.12, 1, eOut(ra)))})`);
        // fondo del estudio (desenfocado) mientras la cámara mira la mesa
        op(el.back, seg(p, .08, .12));
        tf(el.back, `translate3d(${r2(-cam.yaw * .5 - cam.fx / C * 3)}%,${r2((cam.pitch - 30) * .12)}%,0) scale(1.1)`);
        op(el.floor, seg(p, .07, .11));
        op(el.wall, seg(p, .56, .66));
        op(el.paper, seg(p, .075, .105));

        // notas: flotan frente a la foto y se posan sobre la mesa
        el.notes.forEach((n, i) => {
          const N = NOTES[i];
          const t = eIO(seg(p, .062 + i * .006, .112 + i * .006));
          const bob = Math.sin(p * 40 + i * 1.7) * 7 * (1 - t);
          const fx = N.f[0] * (L.narrow ? .64 : 1), dx = N.d[0] * sx;
          const x = lerp(fx, dx, t), z = lerp(N.f[2], N.d[1], t);
          const y = lerp(N.f[1] + bob, -2 - i * .4, t) - Math.sin(t * Math.PI) * 60;
          tf(n, `${T3(x, y, z)} scale(${r2(lerp(L.narrow ? .78 : .9, 1, t) * lerp(.85, 1, eOut(seg(p, .03 + i * .006, .05 + i * .006))))}) rotateX(${r2(lerp(0, 90, t))}deg) rotateY(${r2(N.f[4] * (1 - t))}deg) rotateZ(${r2(lerp(N.f[3], N.d[2], t))}deg)`);
          op(el.pads[i], seg(p, .03 + i * .006, .044 + i * .006));
        });

        // ---------- Retícula ----------
        el.gl.forEach((g, i) => dash(g, eIO(seg(p, .095 + i * .0034, .125 + i * .0034))));
        el.gc.forEach((c, i) => dash(c, eIO(seg(p, .12 + i * .007, .15 + i * .007))));
        op(el.phi, seg(p, .145, .165));
        const arIn = seg(p, .125, .145), arOut = 1 - seg(p, .29, .315);
        tf(el.ar1, `${T3(-200 * sx, lerp(-20, -90, eOut(arIn)), -150)} ${bb}`);
        op(el.ar1.firstElementChild, arIn * arOut);
        tf(el.ar2, `${T3(190 * sx, lerp(-20, -110, eOut(seg(p, .145, .165))), 90)} ${bb}`);
        op(el.ar2.firstElementChild, seg(p, .145, .165) * arOut);
        [el.ar1, el.ar2].forEach(a => {
          const lineH = a === el.ar1 ? lerp(20, 90, eOut(arIn)) : lerp(20, 110, eOut(seg(p, .145, .165)));
          const ln = a.querySelector('i'), dot = a.querySelector('u');
          put(ln, 'height', r2(lineH) + 'px'); tf(dot, `translateY(${r2(lineH - 7)}px)`);
        });

        // ---------- Símbolo ----------
        dash(el.n, seg(p, .17, .228));
        const lf = eBack(seg(p, .224, .244));
        tf(el.leaf, `scale(${r2(Math.max(.001, lf))})`);
        dash(el.seal, eIO(seg(p, .238, .266)));
        op(el.word, seg(p, .254, .28));
        tf(el.word, `translateY(${r2(lerp(12, 0, eOut(seg(p, .254, .28))))}px)`);
        // el símbolo se levanta del papel como una pieza física
        const rise = eIO(seg(p, .275, .33));
        const aside = eIO(seg(p, .34, .385));
        const back = eIO(seg(p, .5, .545));
        vis(el.token, p > .275);
        const tx = lerp(lerp(0, 0, rise), -240 * sx, aside) + back * -110 * sx;
        const ty = lerp(lerp(-3, -175, rise), -165, aside) + back * 8;
        const tz = lerp(lerp(0, 40, rise), -10, aside) + back * -160;
        const tsc = lerp(lerp(1.06, 1, rise), .8, aside);
        const try_ = lerp(0, 342, rise) + lerp(0, 34, aside) + back * 8 + Math.sin(p * 9) * 4 * rise;
        tf(el.token, `${T3(tx, ty, tz)} rotateY(${r2(try_)}deg) rotateX(${r2(lerp(90, 32, rise) - aside * 6)}deg) scale(${r2(tsc)})`);
        tf(el.shTok, `${T3(tx, -2.5, tz)} rotateX(90deg) scale(${r2(lerp(.9, 1.5, rise) * tsc)},${r2(lerp(.9, 1.1, rise) * tsc)})`);
        op(shPads[0], rise * .7);
        // el dibujo de la retícula se apaga detrás
        const gridDim = 1 - .6 * seg(p, .29, .34);
        el.gl.forEach(g => put(g, 'opacity', String(r2(gridDim))));

        // ---------- Paleta ----------
        const fr = eIO(seg(p, .35, .395));
        const fo = eOut(seg(p, .385, .455));
        vis(el.fan, p > .35);
        const fx = lerp(200 * sx, 185 * sx, fr) + back * 140 * sx, fy = lerp(-3, -96, fr) + back * -10, fz = lerp(60, 40, fr) + back * -150;
        tf(el.fan, `${T3(fx, fy, fz)} rotateY(${r2(lerp(0, -12, fr) - back * 16)}deg) rotateX(${r2(lerp(90, 38, fr))}deg) scale(${r2(L.narrow ? .78 : .9)})`);
        el.sws.forEach((c, i) => {
          const a = lerp(0, -54 + i * 27, fo);
          tf(c, `translateZ(${r2(i * 1.6)}px) rotateZ(${r2(a)}deg)`);
        });
        tf(el.shFan, `${T3(fx, -2.5, fz + 40)} rotateX(90deg) scale(${r2(1.5 + fo * .6)},.9)`);
        op(shPads[1], fr * .65);
        tf(el.ar3, `${T3(fx + 10, lerp(-240, -380, eOut(seg(p, .44, .47))), fz)} ${bb}`);
        const a3 = seg(p, .44, .47) * (1 - seg(p, .5, .52));
        op(el.ar3.firstElementChild, a3);
        put(el.ar3.querySelector('i'), 'height', '0px'); put(el.ar3.querySelector('u'), 'display', 'none');

        // ---------- Tipografía ----------
        const si = eOut(seg(p, .5, .57));
        vis(el.spec, p > .5);
        const spx = lerp(560 * sx, 0, si), spy = lerp(-300, -190, si), spz = lerp(-60, 170, si);
        const spRy = lerp(88, -8, si) + seg(p, .57, .66) * 6;
        tf(el.spec, `${T3(spx, spy, spz)} rotateY(${r2(spRy)}deg) rotateX(${r2(lerp(30, 20, si))}deg) rotateZ(${r2(lerp(6, -1.5, si))}deg) scale(${r2(L.narrow ? .92 : 1)})`);
        tf(el.shine, `translateX(${r2((spRy + 8) * 5 - 60 + seg(p, .57, .66) * 160)}px)`);
        const typed = seg(p, .555, .61);
        put(el.specH, 'clipPath', `inset(-10% ${r2(100 - typed * 100)}% -10% 0)`);
        tf(el.specC, `translateX(${r2(30 + typed * 352)}px)`);
        op(el.specC, p > .55 && p < .625 ? (Math.floor(p * 260) % 2 ? .25 : 1) : 0);
        op(el.specS, seg(p, .6, .625));
        tf(el.shSpec, `${T3(spx, -2.5, spz + 30)} rotateX(90deg) scale(2.6,1.1)`);
        op(shPads[2], si * .5);

        // ---------- Piezas (sobre la superficie reflectante) ----------
        const bxT = seg(p, .675, .715), phT = seg(p, .69, .735), cdT = seg(p, .705, .75);
        const bxY = lerp(-760, -125, eBack(bxT)), phY = lerp(-820, -177, eBack(phT));
        const bxX = C + 215 * sx, phX = C + 10 * sx;
        vis(el.box, p > .67); vis(el.phone, p > .685); vis(el.card, p > .7);
        tf(el.box, `${T3(bxX, bxY, -70)} rotateY(${r2(-36 + (1 - eOut(bxT)) * 18)}deg)`);
        tf(el.phone, `${T3(phX, phY, 40)} rotateY(${r2(14 - (1 - eOut(phT)) * 22)}deg) rotateX(${r2(4)}deg)`);
        tf(el.shBox, `${T3(bxX + 20, -1.5, -40)} rotateX(90deg) rotateZ(-36deg) scale(${r2(1.9 * eOut(bxT))},${r2(1.35 * eOut(bxT))})`);
        op(shPads[3], bxT);
        tf(el.shPhone, `${T3(phX + 10, -1.5, 52)} rotateX(90deg) rotateZ(14deg) scale(${r2(1.2 * eOut(phT))},.42)`);
        op(shPads[4], phT);
        const flip = eIO(seg(p, .745, .81));
        const cx = lerp(C - 760, C - 200 * sx, eOut(cdT)), cz = lerp(320, 110, eOut(cdT));
        const cy = lerp(-320, -165, eOut(cdT)) - 90 * eIO(seg(p, .835, .9)) + Math.sin(p * 26) * 5;
        tf(el.card, `${T3(cx, cy, cz)} rotateZ(${r2(lerp(-18, -5, eOut(cdT)))}deg) rotateY(${r2(180 + flip * 166 + (1 - eOut(cdT)) * 40)}deg) rotateX(${r2(14)}deg)`);
        tf(el.shCard, `${T3(cx, -1.5, cz)} rotateX(90deg) scale(1.5,.7)`);
        op(shPads[5], eOut(cdT) * .7);
        tf(el.strip, `${T3(C - 40 * sx, -1.2, 230)} rotateX(90deg) rotateZ(-8deg)`);

        // ---------- Propuesta lista ----------
        const dT = seg(p, .845, .905);
        const dE = eBack(dT);
        const W = L.W, H = L.H, dw = L.dw, dh = L.dh;
        const restX = L.narrow ? W * .04 : W * .06, restY = L.narrow ? H - dh - H * .05 : H - dh - H * .07;
        const dx = restX, dy = lerp(-dh * 1.6, restY, dE);
        put(el.docW, 'visibility', p > .845 ? '' : 'hidden');
        tf(el.docW, `translate3d(${r2(dx)}px,${r2(dy)}px,0) rotateX(${r2(lerp(58, 8, eOut(dT)))}deg) rotateY(${r2(lerp(-26, 9, eOut(dT)))}deg) rotateZ(${r2(lerp(9, -1.5, eOut(dT)))}deg)`);
        put(el.docSh, 'width', r2(dw * 1.1) + 'px'); put(el.docSh, 'height', r2(dh * .32) + 'px');
        tf(el.docSh, `translate3d(${r2(restX - dw * .05)}px,${r2(restY + dh * .9)}px,0) scale(${r2(lerp(.5, 1, eOut(dT)))})`);
        op(el.docSh, eOut(dT) * .9);
        dash(el.chk, eOut(seg(p, .9, .93)));
        put(el.doc, '--sc-valeria-shine', r2(lerp(-120, 160, eIO(seg(p, .905, .96)))) + '%');
        const burst = seg(p, .915, .975);
        el.sparks.forEach((s, i) => {
          const ang = -2.6 + i * .52, rad = lerp(.4, 1, eOut(burst)) * (2.2 + (i % 3) * .7);
          const ox = dw * .2 + Math.cos(ang) * rad * (dw / 19), oy = dh * .82 + Math.sin(ang) * rad * (dw / 19);
          tf(s, `translate3d(${r2(ox)}px,${r2(oy)}px,20px) scale(${r2(Math.max(.001, eBack(burst) * (1 - seg(p, .975, 1) * .6) * (.6 + (i % 2) * .5)))})`);
          op(s, burst * 3 * (1 - seg(p, .99, 1) * .3));
        });

        // ---------- Rótulo de capítulo ----------
        let ch = CHAPTERS[0][1];
        CHAPTERS.forEach(([at, label]) => { if (p >= at) ch = label; });
        if (el.hudT.textContent !== ch) el.hudT.textContent = ch;
      }

      layout();
      if ('ResizeObserver' in window) new ResizeObserver(() => { if (layout()) render(last); }).observe(stage);
      return { render };
    }
  };
})();
