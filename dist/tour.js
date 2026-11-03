'use strict';
// Recorrido guiado: un puntero recorre la página, toca los botones de verdad y explica qué pasa.
// Dos recorridos: "Tu web" (laboratorio y proyectos) y "Automatizaciones" (diagrama, catálogo y video).
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = selector => document.querySelector(selector);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  const tours = {
    web: {
      name: 'Tu web, paso a paso',
      steps: [
        { target: '#laboratorio .lab-head', title: 'Un laboratorio para imaginar tu web', text: 'Aquí ves una web de ejemplo que cambia mientras eliges. Te muestro cómo se usa.' },
        { target: '#laboratorio [data-lab-group="sector"]', click: '#laboratorio [data-lab-group="sector"] [data-value="restaurante"]', title: 'Primero, tu tipo de negocio', text: 'Al elegir "Restaurante" cambian los textos, las fotos y los productos de la vista previa.' },
        { target: '#laboratorio [data-lab-group="color"]', click: '#laboratorio [data-lab-group="color"] [data-value="bosque"]', title: 'Tu color de marca', text: 'El color se aplica a botones, precios y detalles. Pruébalo con cualquiera.' },
        { target: '#laboratorio [data-lab-group="type"]', click: '#laboratorio [data-lab-group="type"] [data-value="moderna"]', title: 'La letra le da carácter', text: 'Clásica se siente cálida; Moderna, directa; Compacta, con fuerza.' },
        { target: '#laboratorio [data-lab-group="layout"]', click: '#laboratorio [data-lab-group="layout"] [data-value="portada"]', title: 'Cómo se ordena la portada', text: 'Con "Foto completa", la imagen ocupa toda la portada y el texto va encima.' },
        { target: '#laboratorio [data-lab-group="mode"]', click: '#laboratorio [data-lab-group="mode"] [data-value="oscuro"]', title: 'Claro u oscuro', text: 'El modo oscuro cambia fondos y textos sin perder tu color de marca.' },
        { target: '#laboratorio [data-lab-toggles]', click: ['#laboratorio [data-feature="cart"]', '#laboratorio .ls-card:nth-child(1) .ls-add'], ensureOff: '#laboratorio [data-feature="cart"]', title: 'Funciones que trabajan por ti', text: 'Activé el carrito y añadí un plato: mira cómo sube el contador. También hay reservas, WhatsApp y reseñas.' },
        { target: '#laboratorio .lab-device', click: '#laboratorio [data-device="mobile"]', title: 'Así se ve en el celular', text: 'Toda web que hacemos se adapta al celular, donde llega la mayoría de tus clientes.' },
        { target: '#laboratorio [data-lab-send]', title: '¿Te gustó? Envíanos tu combinación', text: 'Este botón abre el formulario con todo lo que elegiste ya escrito. Tú solo agregas tu idea.' },
        { target: '#website-catalog .business-case', title: 'Seis webs completas para recorrer', text: 'Cada proyecto de ejemplo se abre y se puede navegar como una web real.' }
      ]
    },
    auto: {
      name: 'Automatizaciones, paso a paso',
      steps: [
        { target: '.feature-reverse .hero-panel', title: 'Tu negocio, conectado', text: 'Tu plataforma une la web, el chat, los pagos, el inventario, el correo y tus clientes. Un dato se escribe una sola vez.' },
        { target: '[data-live-log]', title: 'Todo queda registrado', text: 'Cada pedido, pago o aviso aparece aquí en el momento en que pasa, para revisarlo cuando quieras.' },
        { target: '.catalog-filters', click: '.catalog-filters [data-sector-filter="cafeteria"]', title: 'Busca tu sector', text: 'Filtra por tu tipo de negocio para ver la web y la automatización que le corresponden.' },
        { target: '#automation-catalog .sector-automation-case:not([hidden])', title: 'Pruébala con datos de ejemplo', text: 'En una cafetería, el pedido llega con su ticket y entra solo a la cola de la barra. Puedes abrirla y probarla.' },
        { target: '#en-accion .reel-screen', click: '#en-accion [data-reel-src="assets/video/automatizacion"]', title: 'Mírala funcionando', text: 'Un pedido crea su ticket, entra a la cola y al marcarlo listo se actualizan las cifras.' },
        { target: '.cta-band .button', title: 'Hagamos la tuya', text: 'Cuéntanos qué te quita tiempo hoy y te proponemos qué automatizar primero.', after: () => $('.catalog-filters [data-sector-filter="all"]')?.click() }
      ]
    }
  };

  /* ---------- Interfaz ---------- */
  const ui = document.createElement('div');
  ui.className = 'tour';
  ui.hidden = true;
  ui.innerHTML = `
    <div class="tour-shield"></div>
    <div class="tour-spot" aria-hidden="true"></div>
    <div class="tour-cursor" aria-hidden="true"><svg viewBox="0 0 28 28"><path d="M5 3l17 10-7.4 1.6L11 22z"/></svg><i></i></div>
    <section class="tour-card" role="dialog" aria-modal="false" aria-labelledby="tour-title" tabindex="-1">
      <div class="tour-card-top"><span class="tour-count" data-tour-count></span><button type="button" class="tour-close" data-tour-close aria-label="Salir del recorrido">×</button></div>
      <div class="tour-bar" aria-hidden="true"><span data-tour-bar></span></div>
      <h2 id="tour-title" data-tour-title></h2>
      <p data-tour-text></p>
      <div class="tour-actions">
        <button type="button" class="tour-btn" data-tour-prev>Anterior</button>
        <button type="button" class="tour-btn tour-play" data-tour-play aria-pressed="true">Pausar</button>
        <button type="button" class="tour-btn tour-next" data-tour-next>Siguiente</button>
      </div>
    </section>
    <section class="tour-picker" role="dialog" aria-modal="true" aria-labelledby="tour-picker-title" tabindex="-1">
      <button type="button" class="tour-close" data-tour-close aria-label="Cerrar">×</button>
      <h2 id="tour-picker-title">¿Qué quieres ver?</h2>
      <p>Un puntero te guía por la página y toca los botones por ti. Puedes pausarlo cuando quieras.</p>
      <div class="tour-options">
        <button type="button" data-tour-start="web"><strong>Cómo diseñamos tu web</strong><span>Negocio, color, letra, funciones y vista en celular. 10 pasos.</span></button>
        <button type="button" data-tour-start="auto"><strong>Cómo funcionan las automatizaciones</strong><span>Conexiones, registro en vivo, filtros y una demo grabada. 6 pasos.</span></button>
      </div>
    </section>`;
  document.body.append(ui);

  const spot = ui.querySelector('.tour-spot');
  const cursor = ui.querySelector('.tour-cursor');
  const card = ui.querySelector('.tour-card');
  const picker = ui.querySelector('.tour-picker');
  const count = ui.querySelector('[data-tour-count]');
  const bar = ui.querySelector('[data-tour-bar]');
  const title = ui.querySelector('[data-tour-title]');
  const text = ui.querySelector('[data-tour-text]');
  const prevButton = ui.querySelector('[data-tour-prev]');
  const nextButton = ui.querySelector('[data-tour-next]');
  const playButton = ui.querySelector('[data-tour-play]');

  let tour = null;
  let index = 0;
  let run = 0;
  let autoplay = true;
  let autoTimer;
  let target = null;
  let cursorPos = { x: innerWidth / 2, y: innerHeight / 2 };
  let opener = null;

  function placeCursor(x, y, duration) {
    cursor.style.transitionDuration = `${duration}ms`;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    cursorPos = { x, y };
  }

  async function moveCursorTo(el, token) {
    const r = el.getBoundingClientRect();
    const x = r.left + Math.min(r.width / 2, 60 + r.width * .25);
    const y = r.top + r.height / 2;
    const distance = Math.hypot(x - cursorPos.x, y - cursorPos.y);
    const duration = reduced.matches ? 0 : Math.min(1100, 380 + distance * .7);
    placeCursor(x, y, duration);
    await wait(duration + 80);
    return token === run;
  }

  async function clickWithCursor(el, token) {
    if (!(await moveCursorTo(el, token))) return false;
    cursor.classList.remove('is-clicking'); void cursor.offsetWidth;
    cursor.classList.add('is-clicking');
    await wait(reduced.matches ? 0 : 180);
    if (token !== run) return false;
    el.click();
    await wait(reduced.matches ? 120 : 520);
    return token === run;
  }

  function layout() {
    if (!target) return;
    const r = target.getBoundingClientRect();
    const pad = 10;
    Object.assign(spot.style, {
      transform: `translate(${r.left - pad}px, ${r.top - pad}px)`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`
    });
    const cw = card.offsetWidth, ch = card.offsetHeight, gap = 18;
    let top;
    if (r.bottom + gap + ch < innerHeight - 12) top = r.bottom + gap;
    else if (r.top - gap - ch > 80) top = r.top - gap - ch;
    else top = innerHeight - ch - 16;
    let left = r.left + r.width / 2 - cw / 2;
    left = Math.max(16, Math.min(innerWidth - cw - 16, left));
    card.style.transform = `translate(${left}px, ${Math.max(12, top)}px)`;
  }

  async function scrollToTarget(el) {
    const r = el.getBoundingClientRect();
    const header = 84;
    const room = innerHeight - header;
    let topY = window.scrollY + r.top - header - Math.max(16, (room - r.height) / 2 - 90);
    if (r.height > room * .6) topY = window.scrollY + r.top - header - 24;
    topY = Math.max(0, topY);
    if (Math.abs(topY - window.scrollY) < 4) return;
    window.scrollTo({ top: topY, behavior: reduced.matches ? 'auto' : 'smooth' });
    await new Promise(resolve => {
      const done = () => { window.removeEventListener('scrollend', done); clearTimeout(timer); resolve(); };
      const timer = setTimeout(done, 1100);
      window.addEventListener('scrollend', done, { once: true });
    });
  }

  function findTarget(selector) {
    return [...document.querySelectorAll(selector)].find(el => el.offsetParent !== null || el.getClientRects().length) || null;
  }

  async function show(step) {
    const token = ++run;
    clearTimeout(autoTimer);
    const data = tour.steps[step];
    index = step;
    count.textContent = `Paso ${step + 1} de ${tour.steps.length}`;
    bar.style.transform = `scaleX(${(step + 1) / tour.steps.length})`;
    prevButton.disabled = step === 0;
    nextButton.textContent = step === tour.steps.length - 1 ? 'Terminar' : 'Siguiente';
    card.classList.add('is-changing');

    const el = findTarget(data.target);
    if (!el) { if (step < tour.steps.length - 1) show(step + 1); else stop(); return; }
    if (data.ensureOff) {
      const toggle = $(data.ensureOff);
      if (toggle?.getAttribute('aria-pressed') === 'true') toggle.click();
    }
    await scrollToTarget(el);
    if (token !== run) return;
    target = el;
    ui.classList.add('has-target');
    title.textContent = data.title;
    text.textContent = data.text;
    layout();
    card.classList.remove('is-changing');

    const clicks = data.click ? [].concat(data.click) : [];
    if (!clicks.length) await moveCursorTo(el, token);
    for (const selector of clicks) {
      const button = findTarget(selector);
      if (!button) continue;
      if (!(await clickWithCursor(button, token))) return;
      layout();
    }
    if (token !== run) return;
    data.after?.();
    if (autoplay) {
      const readTime = 2200 + data.text.length * 28;
      autoTimer = setTimeout(() => { if (token === run) next(); }, readTime);
    }
  }

  function next() { if (!tour) return; if (index < tour.steps.length - 1) show(index + 1); else stop(); }
  function prev() { if (tour && index > 0) show(index - 1); }

  function openPicker(trigger) {
    opener = trigger || document.activeElement;
    ui.hidden = false;
    ui.classList.add('is-picking');
    ui.classList.remove('is-running', 'has-target');
    requestAnimationFrame(() => picker.focus());
  }

  function start(key) {
    tour = tours[key];
    if (!tour) return;
    ui.classList.remove('is-picking');
    ui.classList.add('is-running');
    document.body.classList.add('tour-on');
    autoplay = true;
    playButton.setAttribute('aria-pressed', 'true');
    playButton.textContent = 'Pausar';
    placeCursor(innerWidth / 2, innerHeight * .6, 0);
    card.focus({ preventScroll: true });
    show(0);
  }

  function stop() {
    run++;
    clearTimeout(autoTimer);
    tour = null; target = null;
    ui.hidden = true;
    ui.classList.remove('is-running', 'is-picking', 'has-target');
    document.body.classList.remove('tour-on');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  document.addEventListener('click', event => {
    const trigger = event.target instanceof Element && event.target.closest('[data-tour-open]');
    if (trigger) { event.preventDefault(); if (trigger.dataset.tourOpen) { opener = trigger; ui.hidden = false; start(trigger.dataset.tourOpen); } else openPicker(trigger); }
  });
  ui.addEventListener('click', event => {
    const el = event.target instanceof Element ? event.target : null;
    if (!el) return;
    if (el.closest('[data-tour-close]')) stop();
    else if (el.closest('[data-tour-start]')) start(el.closest('[data-tour-start]').dataset.tourStart);
    else if (el.closest('[data-tour-next]')) next();
    else if (el.closest('[data-tour-prev]')) prev();
    else if (el.closest('[data-tour-play]')) {
      autoplay = !autoplay;
      playButton.setAttribute('aria-pressed', String(autoplay));
      playButton.textContent = autoplay ? 'Pausar' : 'Reproducir';
      if (autoplay) next(); else clearTimeout(autoTimer);
    } else if (el.closest('.tour-shield') && ui.classList.contains('is-picking')) stop();
  });
  document.addEventListener('keydown', event => {
    if (ui.hidden) return;
    if (event.key === 'Escape') stop();
    else if (tour && event.key === 'ArrowRight') next();
    else if (tour && event.key === 'ArrowLeft') prev();
  });
  window.addEventListener('resize', layout);
  window.addEventListener('scroll', () => { if (target) requestAnimationFrame(layout); }, { passive: true });
})();
