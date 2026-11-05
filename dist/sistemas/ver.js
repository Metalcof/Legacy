// Reproductor de presentaciones: arma las diapositivas desde datos.js y las anima por tiempo.
(function () {
  const I = window.NexoIcono;
  const M = window.NexoMock;
  const { esc, tono, pill, iconoDe } = M;
  const LISTA = window.NEXO_SISTEMAS || [];
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const params = new URLSearchParams(location.search);
  const idx = Math.max(0, LISTA.findIndex(s => s.key === params.get('p')));
  const S = LISTA[idx];
  const deck = document.getElementById('deck');
  if (!S) { deck.innerHTML = '<div class="no-encontrado"><div><p class="h2">No encontramos esa presentación.</p><p class="lead" style="margin:14px auto 0"><a href="./">Ver todos los sistemas</a></p></div></div>'; return; }
  const sig = LISTA[(idx + 1) % LISTA.length];
  document.title = S.nombre + ' · Sistemas que construimos';
  document.documentElement.style.setProperty('--c', S.color || '#3b2bf5');

  // Cada pieza animada lleva data-at (segundos desde que entra la diapositiva) y, opcional, data-until.
  const b = (at, extra = '', until) => `class="b ${extra}" data-at="${at}"${until != null ? ` data-until="${until}"` : ''}`;
  const corto = (t, n = 4) => String(t || '').split(/\s+/).slice(0, n).join(' ');
  const funciones = (S.funciones || []).slice(0, 9);
  const F = S.flujo || { pasos: [], actores: [], estados: [] };

  const slides = [];

  // 1. Portada: nombre grande y la pantalla del sistema en perspectiva
  slides.push({ dur: 7, html: `
    <div class="in cover">
      <div>
        <span ${b(.2, 'kick')}>${esc(S.familia)} · ${esc(S.area)}</span>
        <h1 ${b(.5, 'h1' + (S.nombre.length > 16 ? ' largo' : ''))}>${esc(S.nombre)}</h1>
        <p ${b(1.3, 'lead')}>${esc(S.portada.bajada)}</p>
      </div>
      <div class="cover-vis">
        <span class="halo"></span>
        <div ${b(.6, 'tilt')}>${M.mini(S)}</div>
        ${funciones.slice(0, 3).map((f, i) => `<span ${b(2.2 + i * .5, 'sat s' + (i + 1))}>${I(iconoDe(f.t, S.icono))}${esc(corto(f.t))}</span>`).join('')}
      </div>
    </div>` });

  // 2. Qué hace: mosaico de íconos, sin párrafos
  slides.push({ dur: 3 + funciones.length * .4, html: `
    <div class="in">
      <span ${b(.1, 'kick')}>Qué hace</span>
      <ul class="bento">${funciones.map((f, i) => `<li ${b(.5 + i * .3, 'z' + (i === 0 ? ' big' : ''))}><span class="bi">${I(iconoDe(f.t + ' ' + f.d, S.icono))}</span><strong>${esc(f.t)}</strong></li>`).join('')}</ul>
    </div>` });

  // 3. Pantalla de ejemplo con etiquetas encima
  const notas = funciones.slice(0, 3);
  slides.push({ dur: 9, html: `
    <div class="in pantalla">
      <span ${b(.1, 'kick')}>Así se ve · datos ficticios</span>
      <div class="pant-wrap">
        ${M.win(S, { anim: true, at: .3, t0: 1, clase: 'z' })}
        ${notas.map((f, i) => `<span ${b(3.6 + i * 1, 'nota n' + (i + 1))}><i></i>${esc(corto(f.t))}</span>`).join('')}
        <svg class="cursor" data-at="5.2" style="--x:62%;--y:44%" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>
      </div>
    </div>` });

  // 4. Paso a paso: íconos grandes y un punto que recorre el camino
  const pasos = (F.pasos || []).slice(0, 4);
  const icPaso = ['documento', 'calendario', 'mensaje', 'firma'];
  slides.push({ dur: 8.5, html: `
    <div class="in flujo">
      <span ${b(.1, 'kick')}>Paso a paso</span>
      <h2 ${b(.3, 'h2')}>${esc(F.titulo)}</h2>
      <ol class="pasos"><span class="linea" data-at="1"></span><span class="viaja" data-at="1"></span>
        ${pasos.map((p, i) => `<li ${b(.8 + i * 1.4, 'paso')}><span class="dot">${I(iconoDe(p.t + ' ' + p.d, icPaso[i]))}<b>${i + 1}</b></span><strong>${esc(p.t)}</strong></li>`).join('')}
      </ol>
    </div>` });

  // 5. El aviso llega al celular
  const A = S.aviso;
  const act = (F.actores || []).slice(0, 4);
  const est = (F.estados || []).slice(0, 3);
  const tEst = [1, 3.2, 5.4];
  const pantallaCel = A ? `
      <div ${b(1.6, 'noti')}><span class="av">${I(S.icono)}</span><div><small>${esc(A.de)} · ahora</small><strong>${esc(A.asunto)}</strong></div></div>
      <div ${b(3, 'cel-mail')}><span class="tag">${esc(A.etiqueta)}</span><h4>${esc(A.asunto)}</h4>
        <dl>${(A.campos || []).slice(0, 3).map(c => `<div><dt>${esc(c[0])}</dt><dd>${esc(c[1])}</dd></div>`).join('')}</dl>
        ${A.boton ? `<span class="btn">${esc(A.boton)}</span>` : ''}</div>`
    : `<div ${b(1.4, 'cel-mail')}><span class="tag">HISTORIAL</span><h4>${esc(S.nombre)}</h4>
        <ul class="hist">${est.map((e, i) => `<li ${b(tEst[i] + .3)}><span>${['08:15', '10:40', '15:05'][i]}</span>${pill(e)}</li>`).join('')}</ul></div>`;
  slides.push({ dur: 9, html: `
    <div class="in aviso">
      <div>
        <span ${b(.1, 'kick')}>Cada paso queda avisado</span>
        <div class="actores">${act.map((x, i) => `<div ${b(.5 + i * 1.4, 'actor')}><span class="ck">${I('check')}</span><strong>${esc(x.t)}</strong></div>`).join('')}</div>
        <p class="estado" ${est.length ? '' : 'hidden'}><span class="slot">${est.map((e, i) => `<span class="pill ${tono(e)}" data-at="${tEst[i]}"${i < est.length - 1 ? ` data-until="${tEst[i + 1]}"` : ''}>${esc(e)}</span>`).join('')}</span></p>
      </div>
      <div ${b(.8, 'cel r')}><span class="cel-isla"></span><p class="cel-hora">9:41</p>${pantallaCel}</div>
    </div>` });

  // 6. Antes y ahora, en imágenes
  const ahora = (S.ahora || []).slice(0, 6);
  slides.push({ dur: 8, html: `
    <div class="in">
      <span ${b(.1, 'kick')}>Antes y ahora</span>
      <div class="aa">
        <div ${b(.4, 'antes')}>
          <div class="hoja"><div class="hoja-bar"><i></i><i></i><i></i></div>
            ${Array.from({ length: 9 }, (_, r) => `<div class="fila">${Array.from({ length: 5 }, (_, c) => `<span style="--w:${30 + ((r * 7 + c * 13) % 60)}%"${(r * 5 + c) % 11 === 3 ? ' class="err"' : ''}></span>`).join('')}</div>`).join('')}
            <span class="post">¿Y esto quién lo tiene?</span>
          </div>
          <p class="antes-t">${esc(S.antes.titulo)}</p>
          <span class="sello" data-at="1.8">Quedó atrás</span>
        </div>
        <span ${b(2.2, 'flecha')}>${I('flecha')}</span>
        <div class="ahora">
          <div ${b(2.4, 'z')}>${M.mini(S)}</div>
          <ul>${ahora.map((x, i) => `<li ${b(3 + i * .35)}>${I(iconoDe(x.t + ' ' + x.d, 'check'))}${esc(x.t)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>` });

  // 7. Cierre
  const tech = String(S.tech || '').split('·').map(t => t.trim()).filter(Boolean);
  slides.push({ dur: 9, fin: true, html: `
    <div class="in fin">
      <span ${b(.2, 'tile z')}>${I(S.icono)}</span>
      <h2 ${b(.5, 'h1' + (S.nombre.length > 16 ? ' largo' : ''))}>${esc(S.nombre)}</h2>
      <p ${b(1.1, 'lead')}>${esc(S.cierre || S.portada.bajada)}</p>
      <div class="tech">${tech.map((t, i) => `<span ${b(1.6 + i * .15)}>${esc(t)}</span>`).join('')}</div>
      <div ${b(2.4, 'fin-acc')}>
        <a class="pri" href="?p=${encodeURIComponent(sig.key)}">Siguiente: ${esc(sig.nombre)} ${I('flecha')}</a>
        <a href="./">Ver todos los sistemas</a>
        <a href="../index.html#contacto">Quiero uno para mi negocio</a>
      </div>
    </div>` });

  // ---------- Montaje ----------
  deck.innerHTML = `
    <div class="bars">${slides.map((s, i) => `<button type="button" aria-label="Ir a la diapositiva ${i + 1}"><i><b></b></i></button>`).join('')}</div>
    ${slides.map((s, i) => `<section class="slide${i === 0 || s.fin ? ' centro' : ''}" aria-roledescription="diapositiva" aria-label="${i + 1} de ${slides.length}">${s.html}</section>`).join('')}
    <div class="ctrl">
      <a class="volver" href="./">${I('atras')}<span>Sistemas</span></a>
      <p class="tit">${esc(S.nombre)}<span>${esc(S.familia)}</span></p>
      <span class="ayuda">← → navegar · P pausa · R repetir · F pantalla completa</span>
      <div class="btns">
        <button type="button" data-a="prev" aria-label="Anterior">${I('prev')}</button>
        <button type="button" data-a="play" aria-label="Pausar">${I('pausa')}</button>
        <button type="button" data-a="next" aria-label="Siguiente">${I('next')}</button>
        <button type="button" data-a="rep" aria-label="Repetir">${I('repetir')}</button>
        <button type="button" data-a="full" aria-label="Pantalla completa">${I('pantalla')}</button>
      </div>
    </div>`;
  M.ajustar(deck);

  const secs = [...deck.querySelectorAll('.slide')];
  const barras = [...deck.querySelectorAll('.bars button')];
  const btnPlay = deck.querySelector('[data-a="play"]');
  const piezas = secs.map(sec => [...sec.querySelectorAll('[data-at]')].map(el => ({
    el, at: +el.dataset.at, until: el.dataset.until != null ? +el.dataset.until : Infinity,
    count: el.dataset.count != null ? el.dataset.count : null,
  })));

  let cur = 0, t = 0, playing = !reducido, last = 0;

  const pintar = () => {
    const dur = slides[cur].dur;
    piezas[cur].forEach(p => {
      const on = t >= p.at && t < p.until;
      if (p.el.classList.contains('on') !== on) p.el.classList.toggle('on', on);
      if (p.count) {
        const m = String(p.count).match(/^(\D*)(\d+)(.*)$/);
        if (m) {
          const k = Math.min(1, Math.max(0, (t - p.at) / 1.4));
          p.el.textContent = m[1] + Math.round(+m[2] * (1 - Math.pow(1 - k, 3))) + m[3];
        }
      }
    });
    barras.forEach((bt, i) => {
      bt.querySelector('b').style.transform = i < cur ? 'scaleX(1)' : i > cur ? 'scaleX(0)' : `scaleX(${Math.min(1, t / dur)})`;
    });
  };

  const ir = n => {
    cur = Math.max(0, Math.min(slides.length - 1, n));
    secs.forEach((s, i) => { s.classList.toggle('act', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); s.inert = i !== cur; });
    secs[cur].scrollTop = 0;
    // En pausa (o sin movimiento) la diapositiva se muestra completa
    t = playing ? 0 : slides[cur].dur;
    pintar();
  };

  const setPlay = v => {
    playing = v;
    btnPlay.innerHTML = I(v ? 'pausa' : 'play');
    btnPlay.setAttribute('aria-label', v ? 'Pausar' : 'Reproducir');
    if (!v) { t = Math.max(t, slides[cur].dur); pintar(); }
  };

  const loop = now => {
    const dt = last ? Math.min(.1, (now - last) / 1000) : 0;
    last = now;
    if (playing && !document.hidden) {
      t += dt;
      if (t >= slides[cur].dur) {
        if (cur < slides.length - 1) ir(cur + 1);
        else { t = slides[cur].dur; setPlay(false); }
      }
      pintar();
    }
    requestAnimationFrame(loop);
  };

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  };

  deck.addEventListener('click', e => {
    const bar = e.target.closest('.bars button');
    if (bar) return ir(barras.indexOf(bar));
    const a = e.target.closest('[data-a]');
    if (!a) return;
    const acc = a.dataset.a;
    if (acc === 'prev') ir(cur - 1);
    if (acc === 'next') ir(cur + 1);
    if (acc === 'play') { if (!playing && cur === slides.length - 1) { setPlay(true); ir(0); } else setPlay(!playing); }
    if (acc === 'rep') { setPlay(true); ir(0); }
    if (acc === 'full') pantallaCompleta();
  });

  addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowright' || k === 'pagedown') { e.preventDefault(); ir(cur + 1); }
    else if (k === 'arrowleft' || k === 'pageup') { e.preventDefault(); ir(cur - 1); }
    else if (k === 'p' || (k === ' ' && !e.target.closest('a,button'))) { e.preventDefault(); setPlay(!playing); }
    else if (k === 'r') { setPlay(true); ir(0); }
    else if (k === 'f') pantallaCompleta();
    else if (k === 'escape' && !document.fullscreenElement) location.href = './';
  });

  // Deslizar en el celular
  let x0 = null, y0 = null;
  deck.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) ir(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

  setPlay(playing);
  ir(params.has('s') ? (+params.get('s') || 0) : 0);
  requestAnimationFrame(loop);

  // Para pruebas: fija diapositiva y segundo
  window.NexoDeck = { ir: (n, seg) => { setPlay(false); ir(n); t = seg == null ? slides[n].dur : seg; pintar(); }, total: slides.length };
})();
