'use strict';
// Escena ALMA: reserva en el teléfono → confirmación y recordatorio → llegada sin filas → tu consultorio → respira → seguimiento.
// Fotos reales de la clínica como planos en un espacio 3D; la cámara viaja de una a otra. Todo depende solo del progreso p (0..1).
(() => {
  window.NexoEscenas = window.NexoEscenas || {};
  const SCRIPT = (document.currentScript && document.currentScript.src) || location.href;
  const BASE = new URL('../', SCRIPT);
  const asset = name => new URL('assets/' + name, BASE).href;
  const WELL = asset('wellness-editorial.webp');
  const DESK = asset('auto-clinica.webp');
  const TEAM = asset('case-clinic-team.webp');
  const ROOM = asset('case-clinic-consultation.webp');

  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const eOut = t => 1 - Math.pow(1 - t, 3);
  const eInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = t => (t <= 0 ? 0 : t >= 1 ? 1 : 1 + 2.6 * Math.pow(t - 1, 3) + 1.6 * Math.pow(t - 1, 2));
  const keys = (p, list) => {
    if (p <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      if (p <= list[i][0]) return lerp(list[i - 1][1], list[i][1], eInOut(seg(p, list[i - 1][0], list[i][0])));
    }
    return list[list.length - 1][1];
  };
  const u = n => `calc(var(--f) * ${n.toFixed(3)})`;
  // Planos de foto a lo largo del eje z: la cámara avanza de uno a otro.
  const GAP = 90;
  const PLANES = ['well-a', 'desk', 'team', 'room', 'well-b'];
  // Px de la foto (1600 × 900) → mundo; el plano mide 125 × 70,3 unidades.
  const px = x => (x / 1600 - 0.5) * 125;
  const py = y => (y / 900 - 0.5) * 70.3125;

  const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const TICKS = '<svg class="sc-alma-ticks" viewBox="0 0 28 16" aria-hidden="true"><path d="M1.5 8.5l4 4L13 4.5M10 12.5l1 1L20.5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const LEAF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 10 11 5 20 4c0 9-5 15-13 15" fill="#fff"/><path d="M5 19c3-5 6-8 10-10" stroke="#1f6b43" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';

  const STYLE = `
.sc-alma-root{position:absolute;inset:0;overflow:hidden;border-radius:inherit;container-type:size;background:radial-gradient(120% 100% at 50% 40%,#eef4ec 0%,#d6e4d8 55%,#b9cdbd 100%);color:#1d2b23;font-family:'Segoe UI',system-ui,-apple-system,Roboto,Arial,sans-serif;font-style:normal;user-select:none;-webkit-user-select:none}
.sc-alma-root *{box-sizing:border-box;font-style:normal}
.sc-alma-cam,.sc-alma-ui{position:absolute;inset:0;--F:max(100cqw,177.78cqh);--f:calc(var(--F) / 100);perspective:calc(var(--F) * 1.25);perspective-origin:50% 50%}
.sc-alma-ui{pointer-events:none;--mx:52;--ms:19}
.sc-alma-world{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d}
.sc-alma-world>*{position:absolute}
.sc-alma-plane{left:calc(var(--f)*-62.5);top:calc(var(--f)*-35.156);width:calc(var(--f)*125);height:calc(var(--f)*70.3125);overflow:hidden;isolation:isolate;background:#cbd9cc;box-shadow:0 calc(var(--f)*3) calc(var(--f)*8) rgba(20,45,30,.35)}
.sc-alma-plane>*{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover}
.sc-alma-blur{filter:blur(14px) saturate(1.05);transform:scale(1.06)}
.sc-alma-soft{filter:blur(18px) brightness(.9);transform:scale(1.06)}
.sc-alma-dim{background:radial-gradient(60% 70% at 50% 50%,rgba(31,107,67,.38),rgba(8,34,20,.78));opacity:0}
.sc-alma-beam{background:linear-gradient(105deg,transparent 30%,rgba(255,226,170,.0) 38%,rgba(255,226,170,.55) 46%,rgba(255,240,210,.25) 54%,transparent 64%);mix-blend-mode:screen;opacity:0;width:160%!important;left:-30%!important}
.sc-alma-gold{filter:sepia(.42) saturate(1.38) brightness(1.04) contrast(1.07);opacity:0}
.sc-alma-warm{background:radial-gradient(80% 90% at 70% 30%,rgba(255,196,120,.35),transparent 70%);mix-blend-mode:soft-light;opacity:0}
.sc-alma-cool{background:linear-gradient(180deg,rgba(214,232,222,.35),rgba(214,232,222,0) 60%);opacity:0}
/* Tarjetas de realidad aumentada sobre las fotos */
.sc-alma-ar{left:0;top:0;width:0;height:0;opacity:0}
.sc-alma-ar>b{position:absolute;left:-6px;top:-6px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.35),0 0 18px rgba(255,255,255,.9)}
.sc-alma-ar>div{position:absolute;left:14px;top:-14px;width:max-content;max-width:clamp(150px,30cqw,330px);padding:.8em 1em .85em;border-radius:14px;background:rgba(255,255,255,.93);color:#1d2b23;box-shadow:0 18px 40px rgba(20,45,30,.28),0 2px 6px rgba(20,45,30,.12);font-size:clamp(10px,1.2cqw,15px);line-height:1.3}
.sc-alma-ar.sc-alma-left>div{left:auto;right:14px}
.sc-alma-ar strong{display:flex;align-items:center;gap:.45em;font-weight:700;font-size:1.05em}
.sc-alma-ar strong i{display:grid;place-items:center;flex:none;width:1.5em;height:1.5em;border-radius:50%;background:#1f6b43;color:#fff}
.sc-alma-ar strong i svg{width:1em;height:1em}
.sc-alma-ar span{display:block;margin-top:.25em;color:#4c5d52}
.sc-alma-big{display:flex;align-items:baseline;gap:.35em;margin-top:.45em;font-size:1.9em;font-weight:300;color:#1f6b43;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.sc-alma-big small{font-size:.42em;font-weight:600;color:#4c5d52;letter-spacing:.04em;text-transform:uppercase}
/* Teléfono */
.sc-alma-phone{position:absolute;left:0;top:0;width:calc(80cqh * .49);height:80cqh;transform-style:preserve-3d}
.sc-alma-body{position:absolute;inset:0;border-radius:calc(80cqh * .085);background:linear-gradient(135deg,#3b4540,#151b18 45%,#2c3430);padding:calc(80cqh * .016);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.18),inset 0 0 0 4px #0c100e}
.sc-alma-side{position:absolute;left:0;top:calc(80cqh * .04);width:calc(80cqh * .03);height:calc(80cqh * .92);border-radius:4px;background:linear-gradient(90deg,#5b6660,#262d29);transform-origin:0 50%;transform:rotateY(90deg)}
.sc-alma-pshadow{position:absolute;left:0;top:0;width:calc(80cqh * .6);height:calc(80cqh * .14);border-radius:50%;background:radial-gradient(closest-side,rgba(20,45,30,.45),rgba(20,45,30,0));filter:blur(6px)}
.sc-alma-screen{position:absolute;inset:calc(80cqh * .016);border-radius:calc(80cqh * .07);overflow:hidden;background:#f6f8f4;font-size:calc(80cqh * .027);color:#1d2b23;line-height:1.25}
.sc-alma-island{position:absolute;left:50%;top:calc(80cqh * .03);width:calc(80cqh * .12);height:calc(80cqh * .03);margin-left:calc(80cqh * -.06);border-radius:99px;background:#0b0f0d;z-index:5}
.sc-alma-glare{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(115deg,rgba(255,255,255,.32) 0%,rgba(255,255,255,0) 32%,rgba(255,255,255,0) 70%,rgba(255,255,255,.1) 100%);z-index:6;pointer-events:none}
.sc-alma-scr{position:absolute;inset:0;padding:3.6em 1.15em 1em;display:flex;flex-direction:column}
.sc-alma-bar{z-index:4;display:flex;justify-content:space-between;font-size:.82em;font-weight:600;position:absolute;left:1.6em;right:1.6em;top:1.05em}
.sc-alma-brand{display:flex;align-items:center;gap:.5em;font-family:Georgia,'Times New Roman',serif;font-size:1.25em;color:#1f6b43}
.sc-alma-brand i{display:grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;background:#1f6b43}
.sc-alma-brand i svg{width:1em;height:1em}
.sc-alma-h{margin:.9em 0 .2em;font-size:1.45em;font-weight:700;letter-spacing:-.02em}
.sc-alma-sub{color:#5a6a60;font-size:.9em}
.sc-alma-days{display:grid;grid-template-columns:repeat(5,1fr);gap:.35em;margin:1em 0 .9em}
.sc-alma-days>span{display:grid;justify-items:center;padding:.45em 0 .5em;border-radius:.9em;background:#e9eee7;font-size:.82em;color:#5a6a60}
.sc-alma-days b{font-size:1.45em;color:#1d2b23}
.sc-alma-days .sc-alma-on{background:#1f6b43;color:#cfe6d7}
.sc-alma-days .sc-alma-on b{color:#fff}
.sc-alma-slots{display:grid;grid-template-columns:1fr 1fr;gap:.45em}
.sc-alma-slots>span{position:relative;padding:.7em 0;border-radius:.8em;border:1px solid #d5ddd3;text-align:center;font-weight:600;font-size:.95em;background:#fff}
.sc-alma-slots .sc-alma-off{color:#a7b2a9;background:#f0f3ee;text-decoration:line-through}
.sc-alma-pick{position:absolute;inset:-1px;border-radius:.8em;background:#1f6b43;color:#fff;display:grid;place-items:center;opacity:0}
.sc-alma-cta{position:relative;margin-top:auto;padding:.95em 0;border-radius:99px;background:#1d2b23;color:#fff;text-align:center;font-weight:700;opacity:.35}
.sc-alma-touch{position:absolute;left:50%;top:50%;width:3.2em;height:3.2em;margin:-1.6em 0 0 -1.6em;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95) 0 30%,rgba(255,255,255,.55) 31% 60%,rgba(255,255,255,0) 62%);box-shadow:0 0 0 1px rgba(31,107,67,.25),0 6px 16px rgba(0,0,0,.25);opacity:0;z-index:4}
.sc-alma-ripple{position:absolute;left:50%;top:50%;width:6em;height:6em;margin:-3em 0 0 -3em;border-radius:50%;border:2px solid rgba(31,107,67,.6);opacity:0;z-index:3}
.sc-alma-done{align-items:center;text-align:center;justify-content:center;gap:.4em;background:linear-gradient(180deg,#eaf3ec,#f6f8f4)}
.sc-alma-ok{display:grid;place-items:center;width:5em;height:5em;border-radius:50%;background:#1f6b43;color:#fff;box-shadow:0 0 0 .7em rgba(31,107,67,.15);margin-bottom:.8em}
.sc-alma-ok svg{width:2.6em;height:2.6em}
.sc-alma-when{margin-top:.6em;padding:.7em 1em;border-radius:1em;background:#fff;box-shadow:0 4px 14px rgba(20,45,30,.1);font-weight:700}
.sc-alma-rate{display:flex;gap:.45em;margin:.8em 0 1em}
.sc-alma-rate>span{flex:1;height:2.4em;border-radius:.8em;background:#e9eee7;display:grid;place-items:center;font-weight:700;color:#5a6a60}
.sc-alma-rate .sc-alma-on{background:#1f6b43;color:#fff}
.sc-alma-next{padding:.9em 1em;border-radius:1em;background:#fff;box-shadow:0 4px 14px rgba(20,45,30,.1)}
.sc-alma-next b{display:block;font-size:1.2em;margin:.15em 0 .5em}
.sc-alma-dots{display:flex;gap:.35em;align-items:center;font-size:.85em;color:#5a6a60}
.sc-alma-dots i{width:.75em;height:.75em;border-radius:50%;background:#dbe3d9}
.sc-alma-dots i.sc-alma-on{background:#1f6b43}
.sc-alma-follow .sc-alma-cta{opacity:1;background:#1f6b43}
.sc-alma-isok{position:absolute;inset:0;border-radius:inherit;display:flex;align-items:center;justify-content:center;gap:.4em;background:#2f8a58;opacity:0}
.sc-alma-isok svg{width:1.2em;height:1.2em}
/* Mensajes flotantes */
.sc-alma-msg{position:absolute;left:0;top:0;width:clamp(170px,30cqw,380px);opacity:0;font-size:clamp(9.5px,1.18cqw,15px);line-height:1.32}
.sc-alma-msg>div{position:relative;padding:.85em 1em .7em;border-radius:1.1em 1.1em 1.1em .3em;background:#fff;box-shadow:0 22px 44px rgba(20,45,30,.24),0 2px 6px rgba(20,45,30,.1)}
.sc-alma-msg.sc-alma-me>div{background:#d9f5cf;border-radius:1.1em 1.1em .3em 1.1em;margin-left:auto;width:max-content;min-width:6em}
.sc-alma-who{display:flex;align-items:center;gap:.5em;margin-bottom:.35em;font-weight:700;color:#1f6b43;font-size:.92em}
.sc-alma-who i{display:grid;place-items:center;width:1.7em;height:1.7em;border-radius:50%;background:#1f6b43;color:#fff}
.sc-alma-who i svg{width:1.05em;height:1.05em}
.sc-alma-msg p{margin:0}
.sc-alma-msg p b{font-weight:700}
.sc-alma-meta{display:flex;justify-content:flex-end;align-items:center;gap:.3em;margin-top:.3em;font-size:.78em;color:#7b897f}
.sc-alma-ticks{width:1.4em;height:.85em;color:#3a9bd9}
.sc-alma-cal{display:flex;gap:.8em;align-items:center}
.sc-alma-d{display:grid;place-items:center;flex:none;width:3.1em;height:3.3em;border-radius:.7em;background:#fff;box-shadow:inset 0 0 0 1px #dfe6dd;overflow:hidden;font-weight:800;font-size:1em;line-height:1}
.sc-alma-d small{display:block;width:100%;padding:.25em 0;background:#e05a4f;color:#fff;font-size:.62em;text-align:center;letter-spacing:.06em}
.sc-alma-bell{display:inline-grid;place-items:center;width:1.5em;height:1.5em;margin-right:.3em;vertical-align:-.35em;border-radius:50%;background:#f3ead0;color:#9a6b12}
.sc-alma-bell svg{width:1em;height:1em}
/* Respiración */
.sc-alma-breath{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none}
.sc-alma-orb{position:absolute;left:50%;top:50%;width:62cqh;height:62cqh;margin:-31cqh 0 0 -31cqh;border-radius:50%}
.sc-alma-halo{background:radial-gradient(closest-side,rgba(205,250,222,.6),rgba(150,225,185,.26) 50%,rgba(150,220,180,0));width:96cqh;height:96cqh;margin:-48cqh 0 0 -48cqh}
.sc-alma-ring{border:1.5px solid rgba(235,255,244,.85);box-shadow:0 0 40px rgba(180,245,210,.6),inset 0 0 40px rgba(180,245,210,.4)}
.sc-alma-core{background:radial-gradient(circle at 40% 35%,rgba(255,255,255,.55),rgba(190,235,208,.32) 45%,rgba(31,107,67,.25) 100%);box-shadow:0 0 60px rgba(160,230,190,.5)}
.sc-alma-words{position:relative;display:grid;place-items:center;text-align:center;color:#fff;text-shadow:0 2px 18px rgba(0,30,15,.45)}
.sc-alma-words>b{grid-area:1/1}
.sc-alma-words>small{grid-area:2/1}
.sc-alma-words b{font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:clamp(24px,5.6cqh,46px);letter-spacing:.02em}
.sc-alma-words small{display:block;margin-top:.9em;font-size:clamp(10px,1.9cqh,14px);letter-spacing:.2em;text-transform:uppercase;color:rgba(235,255,244,.85)}
.sc-alma-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 100% at 50% 45%,transparent 55%,rgba(10,30,18,.38) 100%)}
.sc-alma-grain{position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.sc-alma-mark{position:absolute;left:clamp(12px,2.2cqw,26px);top:clamp(10px,2.6cqh,22px);display:flex;align-items:center;gap:.5em;font-family:Georgia,'Times New Roman',serif;font-size:clamp(14px,1.7cqw,22px);color:#fff;text-shadow:0 1px 10px rgba(0,30,15,.4)}
.sc-alma-mark i{display:grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;background:#1f6b43;box-shadow:0 4px 12px rgba(0,30,15,.25)}
.sc-alma-mark i svg{width:1em;height:1em}
.sc-alma-mark small{font-family:'Segoe UI',system-ui,sans-serif;font-size:.55em;letter-spacing:.18em;text-transform:uppercase;opacity:.9;margin-left:.4em}
@container (max-aspect-ratio: 3/2){
  .sc-alma-ui{--mx:44;--ms:27}
  .sc-alma-msg{width:53cqw;font-size:clamp(9px,2.6cqw,12px)}
  .sc-alma-ar>div{max-width:52cqw;font-size:clamp(9px,2.5cqw,12px)}
  .sc-alma-mark small{display:none}
}`;

  const SCREEN_BOOK = `<div class="sc-alma-scr sc-alma-book">
  <div class="sc-alma-brand"><i>${LEAF}</i>alma</div>
  <div class="sc-alma-h">Agenda tu sesión</div>
  <div class="sc-alma-sub">Fisioterapia · 50 min · con Laura</div>
  <div class="sc-alma-days"><span>lun<b>12</b></span><span>mar<b>13</b></span><span>mié<b>14</b></span><span class="sc-alma-on">jue<b>15</b></span><span>vie<b>16</b></span></div>
  <div class="sc-alma-slots"><span>9:00 a. m.</span><span class="sc-alma-off">10:30 a. m.</span><span class="sc-alma-off">12:00 m.</span><span>2:30 p. m.</span>
    <span class="sc-alma-slot">4:00 p. m.<span class="sc-alma-pick">4:00 p. m.</span><i class="sc-alma-ripple"></i><i class="sc-alma-touch"></i></span><span>5:30 p. m.</span></div>
  <div class="sc-alma-cta">Confirmar reserva<i class="sc-alma-ripple"></i><i class="sc-alma-touch"></i></div>
</div>`;
  const SCREEN_DONE = `<div class="sc-alma-scr sc-alma-done">
  <div class="sc-alma-ok">${CHECK}</div>
  <div class="sc-alma-h" style="margin:0">¡Reserva lista!</div>
  <div class="sc-alma-sub">Te confirmamos por chat</div>
  <div class="sc-alma-when">jueves 15 · 4:00 p. m.</div>
</div>`;
  const SCREEN_FOLLOW = `<div class="sc-alma-scr sc-alma-follow">
  <div class="sc-alma-brand"><i>${LEAF}</i>alma</div>
  <div class="sc-alma-h">¿Cómo te sentiste hoy?</div>
  <div class="sc-alma-rate"><span>1</span><span>2</span><span>3</span><span>4</span><span class="sc-alma-rate5">5</span></div>
  <div class="sc-alma-next"><span class="sc-alma-sub">Tu próxima sesión</span><b>jueves 22 · 4:00 p. m.</b>
    <div class="sc-alma-dots"><i class="sc-alma-on"></i><i class="sc-alma-on"></i><i></i><i></i><i></i><i></i>&nbsp;sesión 2 de 6</div></div>
  <div class="sc-alma-cta">Agendar<span class="sc-alma-isok">${CHECK}Agendada</span><i class="sc-alma-ripple"></i><i class="sc-alma-touch"></i></div>
</div>`;

  const WHO = `<div class="sc-alma-who"><i>${LEAF}</i>ALMA bienestar</div>`;
  const MSGS = [
    `<div>${WHO}<p>¡Hola, Ana! Tu cita quedó <b>confirmada</b>: fisioterapia, jueves 15 a las 4:00 p. m.</p><div class="sc-alma-meta">10:12 a. m. ${TICKS}</div></div>`,
    `<div><div class="sc-alma-cal"><span class="sc-alma-d"><small>JUE</small>15</span><p><b>Agregada a tu calendario</b><br>4:00 – 4:50 p. m. · Consultorio 2</p></div></div>`,
    `<div>${WHO}<p><span class="sc-alma-bell">${BELL}</span><b>Recordatorio:</b> mañana a las 4:00 p. m. te esperamos. Responde 1 para confirmar.</p><div class="sc-alma-meta">9:00 a. m. ${TICKS}</div></div>`,
    `<div><p><b>1</b></p><div class="sc-alma-meta">9:02 a. m. ${TICKS}</div></div>`
  ];
  const MSG_AT = [0.15, 0.185, 0.22, 0.255];

  function mount(stage) {
    const plane = (name, inner) => `<div class="sc-alma-plane" data-p="${name}">${inner}</div>`;
    const img = (src, cls = '') => `<img class="${cls}" src="${src}" alt="" decoding="async" draggable="false">`;
    stage.innerHTML = `<div class="sc-alma-root" aria-hidden="true"><style>${STYLE}</style>
  <div class="sc-alma-cam"><div class="sc-alma-world">
    ${plane('well-b', `${img(WELL)}${img(WELL, 'sc-alma-soft')}<div class="sc-alma-dim"></div>`)}
    ${plane('room', `${img(ROOM)}${img(ROOM, 'sc-alma-gold')}<div class="sc-alma-warm"></div><div class="sc-alma-beam"></div>`)}
    ${plane('team', `${img(TEAM)}<div class="sc-alma-cool"></div>`)}
    ${plane('desk', img(DESK, 'sc-alma-blur'))}
    ${plane('well-a', img(WELL, 'sc-alma-blur'))}
    <div class="sc-alma-ar" data-a="0"><b></b><div><strong><i>${CHECK}</i>Llegada registrada</strong><span>3:58 p. m. · Laura ya sabe que llegaste</span>
      <div class="sc-alma-big">0<small>min de espera</small></div></div></div>
    <div class="sc-alma-ar sc-alma-left" data-a="1"><b></b><div><strong>Consultorio 2</strong><span>Luz natural · 22 °C · tu plan de 6 sesiones</span></div></div>
    <div class="sc-alma-ar" data-a="2"><b></b><div><strong>Laura Gómez</strong><span>Fisioterapeuta · ya leyó tu historia</span></div></div>
  </div></div>
  <div class="sc-alma-breath"><div class="sc-alma-orb sc-alma-halo"></div><div class="sc-alma-orb sc-alma-ring"></div><div class="sc-alma-orb sc-alma-core"></div>
    <div class="sc-alma-words"><b class="sc-alma-in">Inhala</b><b class="sc-alma-out">Exhala</b><small>Un minuto para ti</small></div></div>
  <div class="sc-alma-vig"></div>
  <div class="sc-alma-ui">
    <div class="sc-alma-pshadow"></div>
    <div class="sc-alma-phone"><div class="sc-alma-side"></div><div class="sc-alma-body"><div class="sc-alma-screen">
      <div class="sc-alma-bar"><span>9:41</span><span>●●● 5G</span></div>
      ${SCREEN_BOOK}${SCREEN_DONE}${SCREEN_FOLLOW}
      <div class="sc-alma-island"></div><div class="sc-alma-glare"></div></div></div></div>
    ${MSGS.map((m, i) => `<div class="sc-alma-msg${i === 3 ? ' sc-alma-me' : ''}">${m}</div>`).join('')}
    <div class="sc-alma-msg sc-alma-fmsg"><div>${WHO}<p>¿Cómo te sentiste hoy, Ana? Te dejamos tus <b>ejercicios para casa</b>. Tu próxima sesión: jueves 22, 4:00 p. m.</p><div class="sc-alma-meta">5:10 p. m. ${TICKS}</div></div></div>
  </div>
  <div class="sc-alma-mark"><i>${LEAF}</i>alma<small>bienestar</small></div>
  <div class="sc-alma-grain"></div>
</div>`;
    const root = stage.querySelector('.sc-alma-root');
    const q = s => root.querySelector('.sc-alma-' + s);
    const el = {};
    ['world', 'phone', 'pshadow', 'book', 'done', 'follow', 'slot', 'pick', 'dim', 'soft', 'beam', 'warm', 'cool', 'breath', 'halo', 'ring', 'core',
      'in', 'out', 'rate5', 'mark', 'fmsg', 'gold'].forEach(k => { el[k] = q(k); });
    const planes = {};
    root.querySelectorAll('.sc-alma-plane').forEach(n => { planes[n.dataset.p] = n; });
    PLANES.forEach((name, i) => { planes[name].style.transform = `translateZ(${u(-GAP * i)})`; });
    const ars = [...root.querySelectorAll('.sc-alma-ar')];
    const msgs = [...root.querySelectorAll('.sc-alma-msg:not(.sc-alma-fmsg)')];
    const bookTouch = [...el.book.querySelectorAll('.sc-alma-touch')], bookRip = [...el.book.querySelectorAll('.sc-alma-ripple')];
    const bookCta = el.book.querySelector('.sc-alma-cta');
    const folTouch = el.follow.querySelector('.sc-alma-touch'), folRip = el.follow.querySelector('.sc-alma-ripple');
    const folOk = el.follow.querySelector('.sc-alma-isok');
    const op = (node, v) => { node.style.opacity = clamp(v).toFixed(3); };
    const tf = (node, v) => { node.style.transform = v; };
    // Toque: el dedo llega, presiona y se va; la onda se abre al presionar.
    const tap = (touch, ripple, p, t) => {
      const come = eOut(seg(p, t - 0.03, t)), press = seg(p, t, t + 0.006) - seg(p, t + 0.006, t + 0.014), go = seg(p, t + 0.016, t + 0.03);
      tf(touch, `translate(${lerp(2.2, 0, come) + go * 1.6}em, ${lerp(3.2, 0, come) + go * 2.6}em) scale(${(1 - 0.2 * press).toFixed(3)})`);
      op(touch, Math.min(come, 1 - go));
      const r = seg(p, t, t + 0.035);
      tf(ripple, `scale(${lerp(0.3, 1.25, eOut(r)).toFixed(3)})`);
      op(ripple, r > 0 && r < 1 ? (1 - r) * 0.9 : 0);
    };
    // Planos y alturas de la ventana del teléfono: [left %, top %] del centro del teléfono.
    const phoneAt = (x, y, ry, rx, rz, s) => `translate(calc(${x}cqw - 50%), calc(${y}cqh - 50%)) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(3)})`;

    function render(p) {
      // ---------- Cámara: viaja por el eje z de foto en foto ----------
      const cz = keys(p, [[0, 0], [0.14, 7], [0.185, GAP], [0.29, GAP + 9], [0.335, GAP * 2], [0.44, GAP * 2 + 16], [0.485, GAP * 3], [0.6, GAP * 3 + 14],
        [0.645, GAP * 4], [0.82, GAP * 4 + 6], [1, GAP * 4 - 4]]);
      const ry = keys(p, [[0, -3], [0.14, 2], [0.29, -2], [0.44, 3], [0.6, -2], [0.82, 0], [1, 2]]);
      const rx = keys(p, [[0, 1], [0.29, -1], [0.44, 1], [0.6, 0], [1, 0]]);
      const cx = keys(p, [[0, 0], [0.29, 0], [0.335, -8], [0.44, -6], [0.485, 2], [0.6, 4], [0.645, 0], [1, 0]]);
      const cy = keys(p, [[0, 0], [0.29, 0], [0.335, -3], [0.44, -4], [0.485, -2], [0.6, -3], [0.645, 0], [1, 0]]);
      tf(el.world, `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(${u(-cx)},${u(-cy)},${u(cz)})`);
      PLANES.forEach((name, i) => {
        const z = cz - GAP * i; // posición del plano frente a la cámara
        op(planes[name], (1 - seg(z, 18, 34)) * (z < -GAP * 1.6 ? 0 : 1));
        planes[name].style.visibility = z > 34 || z < -GAP * 1.6 ? 'hidden' : 'visible';
      });

      // ---------- 1 · Reserva en el teléfono ----------
      tap(bookTouch[0], bookRip[0], p, 0.06);
      op(el.pick, eOut(seg(p, 0.062, 0.075)));
      bookCta.style.opacity = (0.35 + 0.65 * seg(p, 0.07, 0.085)).toFixed(3);
      tap(bookTouch[1], bookRip[1], p, 0.108);
      const toDone = eInOut(seg(p, 0.118, 0.14));
      tf(el.book, `translateX(${(-toDone * 100).toFixed(2)}%)`);
      tf(el.done, `translateX(${((1 - toDone) * 100).toFixed(2)}%)`);
      const doneOk = eBack(seg(p, 0.13, 0.155));
      tf(el.done.querySelector('.sc-alma-ok'), `scale(${(0.4 + 0.6 * doneOk).toFixed(3)})`);
      const toFollow = eInOut(seg(p, 0.835, 0.86));
      tf(el.follow, `translateX(${((1 - toFollow) * 100).toFixed(2)}%)`);
      if (toFollow > 0) tf(el.done, `translateX(${(-toFollow * 100).toFixed(2)}%)`);

      // Teléfono: entra, gira mientras salen los mensajes, sale para la llegada y vuelve para el seguimiento.
      const leave = eInOut(seg(p, 0.285, 0.33)), back = eOut(seg(p, 0.815, 0.865));
      const off = p < 0.6 ? leave : 1 - back;
      const pX = keys(p, [[0, 25], [0.14, 25], [0.27, 23], [0.8, 23], [1, 25]]) - off * 45;
      const pY = keys(p, [[0, 52], [0.14, 51], [1, 52]]) + off * 6;
      const pR = keys(p, [[0, 22], [0.12, 14], [0.2, 20], [0.29, 24], [0.8, 24], [0.9, 16], [1, 14]]);
      const pRZ = keys(p, [[0, -2], [0.14, 0], [0.29, -1], [1, 0]]);
      const phoneVis = 1 - off;
      tf(el.phone, phoneAt(pX, pY, pR, 4, pRZ, 1));
      op(el.phone, phoneVis > 0.01 ? 1 : 0);
      el.phone.style.visibility = phoneVis > 0.01 ? 'visible' : 'hidden';
      tf(el.pshadow, `translate(calc(${pX + 2}cqw - 50%), calc(${pY + 40}cqh - 50%))`);
      op(el.pshadow, phoneVis);

      // ---------- 2 · Confirmación y recordatorio: mensajes que flotan en profundidad ----------
      const arrive = MSG_AT.map(t => eOut(seg(p, t, t + 0.03)));
      const out = eInOut(seg(p, 0.29, 0.325));
      msgs.forEach((m, i) => {
        let stack = 0;
        for (let j = i + 1; j < arrive.length; j++) stack += arrive[j];
        const a = arrive[i];
        const x = 50 + (1 - a) * 6 + out * 30, y = 72 - (1 - a) * 4;
        tf(m, `translate(calc(var(--mx) * 1cqw + ${(x - 50).toFixed(2)}cqw), calc(${y.toFixed(2)}cqh - ${stack.toFixed(3)} * var(--ms) * 1cqh - 50%)) translateZ(${(-stack * 60 + (1 - a) * -120).toFixed(1)}px) rotateY(${(-14 + out * -20).toFixed(2)}deg) scale(${(0.9 + 0.1 * a).toFixed(3)})`);
        op(m, a * (1 - 0.3 * Math.min(stack, 2)) * (1 - out) * (stack > 2.6 ? 0 : 1));
      });

      // ---------- 3 · Llegada sin espera y 4 · tu consultorio ----------
      const AR = [[440, 372, GAP * 2, 0.335, 0.44], [1180, 520, GAP * 3, 0.5, 0.6], [520, 250, GAP * 3, 0.525, 0.6]];
      AR.forEach(([x, y, z, t0, t1], i) => {
        const a = eBack(seg(p, t0, t0 + 0.03)), o = seg(p, t1 - 0.015, t1 + 0.01);
        tf(ars[i], `translate3d(${u(px(x))},${u(py(y))},${u(-z + 10)}) scale(${(0.7 + 0.3 * a).toFixed(3)})`);
        op(ars[i], Math.min(seg(p, t0, t0 + 0.02), 1 - o));
      });
      op(el.cool, seg(p, 0.33, 0.4) * 0.8);
      // La luz cambia en el consultorio: un haz de sol cruza la sala.
      const light = seg(p, 0.47, 0.6);
      op(el.warm, eInOut(light));
      op(el.gold, eInOut(light));
      op(el.beam, Math.sin(Math.PI * light) * 0.9);
      tf(el.beam, `translateX(${lerp(-18, 18, light).toFixed(2)}%)`);

      // ---------- 5 · Respira ----------
      const calm = eInOut(seg(p, 0.6, 0.66)) * (1 - eInOut(seg(p, 0.8, 0.86)));
      op(el.dim, calm);
      op(el.soft, calm);
      const bt = seg(p, 0.64, 0.8);
      const wave = 0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * bt); // dos respiraciones completas
      const rising = Math.sin(2 * Math.PI * 2 * bt);
      const show = eOut(seg(p, 0.625, 0.66)) * (1 - eInOut(seg(p, 0.8, 0.84)));
      op(el.breath, show);
      const s = 0.55 + 0.45 * wave;
      tf(el.core, `scale(${(s * 0.78).toFixed(4)})`);
      tf(el.ring, `scale(${s.toFixed(4)})`);
      tf(el.halo, `scale(${(0.8 + 0.55 * wave).toFixed(4)})`);
      op(el.halo, 0.55 + 0.45 * wave);
      const inh = bt <= 0 ? 1 : bt >= 1 ? 0 : clamp(0.5 + rising * 6);
      op(el.in, inh); op(el.out, 1 - inh);
      op(el.mark, 1 - 0.6 * calm);

      // ---------- 6 · Seguimiento ----------
      tap(folTouch, folRip, p, 0.935);
      op(el.rate5, 1);
      el.rate5.classList.toggle('sc-alma-on', p >= 0.9);
      op(folOk, eOut(seg(p, 0.94, 0.955)));
      const fa = eOut(seg(p, 0.875, 0.905));
      tf(el.fmsg, `translate(calc(var(--mx) * 1cqw + ${((1 - fa) * 6).toFixed(2)}cqw), calc(${(30 - (1 - fa) * 4).toFixed(2)}cqh - 50%)) translateZ(${((1 - fa) * -120).toFixed(1)}px) rotateY(-14deg) scale(${(0.9 + 0.1 * fa).toFixed(3)})`);
      op(el.fmsg, fa);
    }

    return { render };
  }

  window.NexoEscenas.alma = {
    title: 'Tu visita a ALMA, sin filas ni esperas',
    duration: 22000,
    steps: [
      { label: 'Reservas en línea', at: 0 },
      { label: 'Confirmación', at: 0.14 },
      { label: 'Llegas sin esperar', at: 0.29 },
      { label: 'Tu espacio', at: 0.44 },
      { label: 'Respira', at: 0.6 },
      { label: 'Seguimiento', at: 0.82 }
    ],
    mount
  };
})();
