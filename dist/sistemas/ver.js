// Reproductor de presentaciones: arma las diapositivas desde datos.js y las anima por tiempo.
(function () {
  const I = window.NexoIcono;
  const LISTA = window.NEXO_SISTEMAS || [];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const params = new URLSearchParams(location.search);
  const idx = Math.max(0, LISTA.findIndex(s => s.key === params.get('p')));
  const S = LISTA[idx];
  const deck = document.getElementById('deck');
  if (!S) { deck.innerHTML = '<div class="no-encontrado"><div><p class="h2">No encontramos esa presentación.</p><p class="lead" style="margin:14px auto 0"><a href="./">Ver todos los sistemas</a></p></div></div>'; return; }
  const sig = LISTA[(idx + 1) % LISTA.length];
  document.title = S.nombre + ' · Sistemas que construimos';
  document.documentElement.style.setProperty('--c', S.color || '#3b2bf5');

  // Clasifica un estado para darle color
  const tono = t => {
    const s = String(t).toLowerCase();
    if (/(rechaz|vencid|inactiv|bajo|agotad|anulad|cancel|cr[ií]tic|baja\b|falla|abiert|urgente|no conforme|perdid)/.test(s)) return 'mal';
    if (/(cotiz|producci|pendient|revisi|proceso|sin inici|espera|program|borrador|asignad|abierta|nuev|curso|parcial|por )/.test(s)) return 'esp';
    if (/(finaliz|respond|valid|despach|activ|autoriz|aprob|entreg|cumpl|pagad|cerrad|liber|ok|listo|normal|complet|resuelt|firmad|vigente|disponible|enviad|ganad|conforme|al d[ií]a)/.test(s)) return 'ok';
    return '';
  };
  const pill = t => `<span class="pill ${tono(t)}">${esc(t)}</span>`;

  // Cada pieza animada lleva data-at (segundos desde que entra la diapositiva) y, opcional, data-until.
  const b = (at, extra = '', until) => `class="b ${extra}" data-at="${at}"${until != null ? ` data-until="${until}"` : ''}`;

  // ---------- Diapositivas ----------
  const slides = [];

  // 1. Portada
  const f3 = (S.funciones || []).slice(0, 3);
  slides.push({ dur: 7.5, html: `
    <div class="in cover">
      <div>
        <span ${b(.2, 'kick')}>${esc(S.familia)} · ${esc(S.area)}</span>
        <h1 ${b(.6, 'h1')}>${esc(S.portada.titulo)}</h1>
        <p ${b(1.6, 'lead')}>${esc(S.portada.bajada)}</p>
        <p ${b(2.2, 'cover-place')}>Estufas Ecoeficientes Metalcof · Neiva, Huila</p>
      </div>
      <div ${b(.4, 'orb z')}>
        <span class="glow"></span>
        <span class="tile">${I(S.icono)}</span>
        ${f3.map((f, i) => `<span ${b(2.8 + i * .6, 'sat s' + (i + 1))}>${I('check')}${esc(f.t)}</span>`).join('')}
      </div>
    </div>` });

  // 2. Qué es y qué hace
  const fx = (S.funciones || []).slice(0, 9);
  slides.push({ dur: 4 + fx.length * .55, html: `
    <div class="in">
      <div class="fx-head">
        <div>
          <span ${b(.1, 'kick')}>Qué es</span>
          <h2 ${b(.3, 'h2')} style="margin-top:14px">${esc(S.nombre)}</h2>
          <p ${b(.8, 'lead')}>${esc(S.resumen)}</p>
        </div>
      </div>
      <ul class="fx-grid">${fx.map((f, i) => `<li ${b(1.4 + i * .45, 'fx')}><span class="num">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(f.t)}</strong><span>${esc(f.d)}</span></div></li>`).join('')}</ul>
    </div>` });

  // 3. Pantalla de ejemplo
  const P = S.pantalla || {};
  let cuerpo = '';
  if (P.tipo === 'tarjetas') {
    cuerpo = `<ul class="tarj">${(P.items || []).slice(0, 9).map((it, i) => `<li ${b(1.6 + i * .22)}><span class="th">${I(S.icono)}</span><strong>${esc(it.t)}</strong><small>${esc(it.s)}</small>${pill(it.estado)}</li>`).join('')}</ul>`;
  } else if (P.tipo === 'kanban') {
    let n = 0;
    cuerpo = `<ul class="kan">${(P.carriles || []).slice(0, 4).map(c => `<li><h5>${esc(c.t)}<span>${(c.items || []).length}</span></h5>${(c.items || []).slice(0, 3).map(it => `<div ${b(1.6 + (n++) * .25, 'k')}><i></i><strong>${esc(it.t)}</strong><small>${esc(it.s)}</small></div>`).join('')}</li>`).join('')}</ul>`;
  } else if (P.tipo === 'panel') {
    cuerpo = `<ul class="kpis">${(P.kpis || []).slice(0, 4).map((k, i) => `<li ${b(1.5 + i * .25)}><b data-count="${esc(k.v)}" data-at="${1.5 + i * .25}">${esc(k.v)}</b><small>${esc(k.t)}</small></li>`).join('')}</ul>
      <ul class="barras">${(P.barras || []).slice(0, 6).map((r, i) => `<li ${b(2.6 + i * .3)} style="--v:${Math.max(0, Math.min(100, +r.v || 0))}"><span>${esc(r.t)}</span><i><b></b></i><em>${esc(r.v)}%</em></li>`).join('')}</ul>`;
  } else {
    // Máximo 6 columnas: las primeras y las últimas (la última es el estado)
    const n = (P.columnas || []).length;
    const keep = n <= 6 ? [...Array(n).keys()] : [0, 1, 2, n - 3, n - 2, n - 1];
    const cols = keep.map(i => P.columnas[i]);
    const filas = (P.filas || []).slice(0, 8).map(f => keep.map(i => f[i] == null ? '' : f[i]));
    cuerpo = `<table class="tbl"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${filas.map((f, i) => `<tr ${b(1.6 + i * .2, i === 1 ? 'pk' : '')}>${f.map((c, j) => `<td>${j === f.length - 1 ? pill(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  slides.push({ dur: 10, html: `
    <div class="in mock-wrap">
      <div>
        <span ${b(.1, 'kick')}>Así se ve</span>
        <h2 ${b(.3, 'h2')} style="margin-top:14px">${esc(P.ruta ? P.ruta.split('/').pop().trim() : S.nombre)}, todo en una pantalla</h2>
        <p ${b(.8, 'lead')}>Cada área entra con su usuario y ve solo lo que le corresponde. Los datos se guardan solos y quedan sincronizados.</p>
        <p ${b(1.2, 'foot-note')}>Pantalla de ejemplo, con datos ficticios.</p>
      </div>
      <div ${b(.5, 'win z')}>
        <div class="win-bar"><i></i><i></i><i></i><span>${esc(S.familia)} · ${esc(P.app || S.nombre)}</span></div>
        <div class="win-body">
          <aside class="side"><div class="side-app">${I(S.icono)}${esc(P.app || S.nombre)}</div>
            ${(P.menu || []).slice(0, 4).map(g => `<small>${esc(g.g)}</small><ul>${(g.i || []).slice(0, 4).map(it => `<li class="${it === P.activo ? 'act' : ''}">${esc(it)}</li>`).join('')}</ul>`).join('')}
          </aside>
          <div class="main">
            <div class="main-top"><div class="ruta">${esc(P.ruta || '')}<b>${esc(P.activo || P.app || '')}</b></div>
              <div class="acc">${(P.acciones || []).slice(0, 3).map(a => `<span>${esc(a)}</span>`).join('')}</div></div>
            ${cuerpo}
            <p ${b(1.4, 'sync')} style="margin-top:10px">Sincronizado</p>
          </div>
        </div>
        <span class="ficticio">Datos ficticios</span>
      </div>
    </div>` });

  // 4. Flujo paso a paso
  const F = S.flujo || { pasos: [], actores: [], estados: [] };
  const pasos = (F.pasos || []).slice(0, 4);
  slides.push({ dur: 10, html: `
    <div class="in flujo">
      <span ${b(.1, 'kick')}>Paso a paso</span>
      <h2 ${b(.3, 'h2')} style="margin-top:14px">${esc(F.titulo)}</h2>
      <ol class="pasos"><span class="linea" data-at="1.4"></span>
        ${pasos.map((p, i) => `<li ${b(1 + i * 1.4, 'paso')}><span class="dot">${I(I.pasos[i] || 'check')}</span><strong>${esc(p.t)}</strong><span>${esc(p.d)}</span></li>`).join('')}
      </ol>
    </div>` });

  // 5. Quién interviene y el aviso automático
  const A = S.aviso;
  const act = (F.actores || []).slice(0, 4);
  const est = (F.estados || []).slice(0, 3);
  const tEst = [1.2, 3.4, 5.6];
  slides.push({ dur: 10, html: `
    <div class="in aviso">
      <div>
        <span ${b(.1, 'kick')}>Cada paso queda avisado</span>
        <h2 ${b(.3, 'h2')} style="margin-top:14px">Nadie tiene que preguntar en qué va</h2>
        <div class="actores">${act.map((a, i) => `<div ${b(.8 + i * 1.6, 'actor')}><span class="ck">${I('check')}</span><div><strong>${esc(a.t)}</strong><span>${esc(a.d)}</span></div></div>`).join('')}</div>
        <p class="estado" ${est.length ? '' : 'hidden'}>Estado <span class="slot">${est.map((e, i) => `<span class="pill ${tono(e)}" data-at="${tEst[i]}"${i < est.length - 1 ? ` data-until="${tEst[i + 1]}"` : ''}>${esc(e)}</span>`).join('')}</span></p>
      </div>
      ${A ? `<div>
        <div ${b(2, 'mail r')}>
          <div class="mail-h"><span class="av">${I(S.icono)}</span><div>De <b>${esc(A.de)}</b><br>Para <b>${esc(A.para)}</b></div><span class="nuevo">Nuevo</span></div>
          <div class="mail-b"><span class="tag">${esc(A.etiqueta)}</span><h4>${esc(A.asunto)}</h4><p>${esc(A.cuerpo)}</p>
            <dl>${(A.campos || []).slice(0, 4).map(c => `<div><dt>${esc(c[0])}</dt><dd>${esc(c[1])}</dd></div>`).join('')}</dl>
            ${A.boton ? `<span class="btn">${esc(A.boton)}</span>` : ''}</div>
        </div>
        <p ${b(4, 'toast')}>${I('check')}Aviso enviado automáticamente</p>
      </div>` : `<div ${b(1.5, 'mail r')}><div class="mail-h"><span class="av">${I('reloj')}</span><div><b>Historial</b><br>${esc(S.nombre)}</div><span class="nuevo">En vivo</span></div>
        <div class="mail-b"><span class="tag">QUEDA REGISTRADO</span><h4>Cada cambio con fecha y responsable</h4>
        <dl>${est.map((e, i) => `<div ${b(tEst[i] + .2)}><dt>${['08:15', '10:40', '15:05'][i]}</dt><dd>${pill(e)}</dd></div>`).join('')}<div ${b(6.4)}><dt>Responsable</dt><dd>${esc((act[act.length - 2] || act[0] || {}).t || 'Equipo')}</dd></div></dl></div></div>`}
    </div>` });

  // 6. Antes y ahora
  const ahora = (S.ahora || []).slice(0, 6);
  const icAhora = ['check', 'firma', 'reloj', 'personas', 'mensaje', 'documento'];
  slides.push({ dur: 4 + ahora.length * .6, html: `
    <div class="in">
      <span ${b(.1, 'kick')}>Antes y ahora</span>
      <h2 ${b(.3, 'h2')} style="margin-top:14px">Lo que cambió en el día a día</h2>
      <div class="aa">
        <div ${b(.8, 'antes')}><small>Antes</small><span class="papel">${I('papel')}</span><strong>${esc(S.antes.titulo)}</strong><p>${esc(S.antes.d)}</p><span class="sello" data-at="2">Quedó atrás</span></div>
        <ul class="ahora"><li class="ahora-t b" data-at="2.4" style="background:none;padding:0">Ahora</li>
          ${ahora.map((a, i) => `<li ${b(2.8 + i * .4)}>${I(icAhora[i] || 'check')}<div><strong>${esc(a.t)}</strong><span>${esc(a.d)}</span></div></li>`).join('')}
        </ul>
      </div>
    </div>` });

  // 7. Hecho a la medida
  const tech = String(S.tech || '').split('·').map(t => t.trim()).filter(Boolean);
  slides.push({ dur: 7, html: `
    <div class="in merc">
      <span ${b(.1, 'kick')}>Hecho a la medida</span>
      <h2 ${b(.3, 'h2')} style="margin-top:14px">Un sistema propio, pensado para esta operación</h2>
      <div class="merc-box">
        <div ${b(1.2)}><small>En el mercado se parece a</small><strong>${esc(S.mercado || 'Software genérico por suscripción')}</strong><p>Herramientas genéricas que se pagan cada mes, por usuario, y que hay que adaptar al negocio.</p></div>
        <div ${b(2)}><small>Lo que se construyó</small><strong>${esc(S.nombre)}</strong><p>Con los formatos, pasos y nombres de la empresa. Crece con cada necesidad nueva.</p></div>
      </div>
      <div class="tech">${tech.map((t, i) => `<span ${b(3 + i * .2)}>${esc(t)}</span>`).join('')}</div>
    </div>` });

  // 8. Cierre
  slides.push({ dur: 9, fin: true, html: `
    <div class="in fin">
      <span ${b(.2, 'tile z')}>${I(S.icono)}</span>
      <h2 ${b(.6, 'h1')}>${esc(S.cierre || S.portada.titulo)}</h2>
      <p ${b(1.4, 'lead')}>${esc(S.nombre)} · ${esc(S.familia)} · Estufas Ecoeficientes Metalcof</p>
      <div ${b(2.2, 'fin-acc')}>
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
          const v = Math.round(+m[2] * (1 - Math.pow(1 - k, 3)));
          p.el.textContent = m[1] + v + m[3];
        }
      }
    });
    barras.forEach((bt, i) => {
      const bb = bt.querySelector('b');
      bb.style.transform = i < cur ? 'scaleX(1)' : i > cur ? 'scaleX(0)' : `scaleX(${Math.min(1, t / dur)})`;
    });
  };

  const ir = (n, alFinal) => {
    cur = Math.max(0, Math.min(slides.length - 1, n));
    secs.forEach((s, i) => { s.classList.toggle('act', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); if (i !== cur) s.inert = true; else s.inert = false; });
    secs[cur].scrollTop = 0;
    // Si está en pausa (o sin movimiento) la diapositiva se muestra completa
    t = alFinal || !playing ? slides[cur].dur : 0;
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
        if (cur < slides.length - 1) { ir(cur + 1); }
        else { t = slides[cur].dur; setPlay(false); }
      }
      pintar();
    }
    requestAnimationFrame(loop);
  };

  deck.addEventListener('click', e => {
    const a = e.target.closest('[data-a]');
    const bar = e.target.closest('.bars button');
    if (bar) return ir(barras.indexOf(bar));
    if (!a) return;
    const acc = a.dataset.a;
    if (acc === 'prev') ir(cur - 1);
    if (acc === 'next') ir(cur + 1);
    if (acc === 'play') { if (!playing && cur === slides.length - 1 && t >= slides[cur].dur) { setPlay(true); ir(0); } else setPlay(!playing); }
    if (acc === 'rep') { setPlay(true); ir(0); }
    if (acc === 'full') pantallaCompleta();
  });

  const pantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
    else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {});
  };

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
  window.NexoDeck = { ir: (n, seg) => { setPlay(false); cur = n; ir(n); t = seg == null ? slides[n].dur : seg; pintar(); }, total: slides.length };
})();
