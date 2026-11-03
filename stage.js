'use strict';
// Escenario de la portada: un portátil y un celular muestran cada web de ejemplo desplazándose sola.
(() => {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches || document.body.classList.contains('motion-paused');

  const projects = [
    { key: 'cafeteria', name: 'Maré', sector: 'Cafetería', url: 'mare.co', href: 'demos/cafeteria.html', accent: '#c9733d', note: ['Nuevo pedido para recoger', '2 × Flat white · 10:15 a. m.'] },
    { key: 'tienda', name: 'WAV', sector: 'Tienda online', url: 'wav.store', href: 'demos/tienda.html', accent: '#a98bff', note: ['Venta confirmada', 'Wave One lima · $ 349.900'] },
    { key: 'clinica', name: 'ALMA', sector: 'Clínica', url: 'alma.health', href: 'demos/clinica.html', accent: '#5f9a72', note: ['Cita confirmada', 'Consulta de bienestar · jueves 4:00 p. m.'] },
    { key: 'restaurante', name: 'LUMBRE', sector: 'Restaurante', url: 'lumbre.co', href: 'demos/restaurante.html', accent: '#e2894b', note: ['Reserva nueva', 'Mesa para 4 · sábado 8:30 p. m.'] },
    { key: 'arquitectura', name: 'AURA', sector: 'Arquitectura', url: 'aura.studio', href: 'demos/arquitectura.html', accent: '#8fa58a', note: ['Solicitud de proyecto', 'Casa de 180 m² · inicio en marzo'] },
    { key: 'personal', name: 'Valeria Ríos', sector: 'Marca personal', url: 'valeriarios.co', href: 'demos/portfolio.html', accent: '#8b6cf0', note: ['Nuevo brief recibido', 'Marca de cosmética natural'] }
  ];

  const tabs = stage.querySelector('[data-stage-tabs]');
  const laptopView = stage.querySelector('[data-stage-laptop]');
  const phoneView = stage.querySelector('[data-stage-phone]');
  const url = stage.querySelector('[data-stage-url]');
  const link = stage.querySelector('[data-stage-link]');
  const note = stage.querySelector('[data-stage-note]');
  const hero = stage.closest('.intro');
  const DURATION = 8000;
  let index = 0;
  let timer;
  let inView = true;
  let hovering = false;
  const animations = [];

  projects.forEach((project, i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = `stage-tab stage-tab--${project.key}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(i === 0));
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.innerHTML = `<strong></strong><span></span><i aria-hidden="true"></i>`;
    tab.querySelector('strong').textContent = project.name;
    tab.querySelector('span').textContent = project.sector;
    tab.addEventListener('click', () => { show(i, true); });
    tabs.append(tab);
  });
  tabs.addEventListener('keydown', event => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    show((index + keys[event.key] + projects.length) % projects.length, true);
    tabs.children[index].focus();
  });

  // Precarga la siguiente web para que el cambio sea limpio.
  const preload = i => {
    const p = projects[i % projects.length];
    [`assets/shots/${p.key}-full.webp`, `assets/shots/${p.key}-mfull.webp`].forEach(src => { const img = new Image(); img.decoding = 'async'; img.src = src; });
  };

  function layer(view, src, alt) {
    const img = document.createElement('img');
    img.className = 'stage-page';
    img.alt = alt;
    img.decoding = 'async';
    img.src = src;
    view.append(img);
    const old = [...view.querySelectorAll('.stage-page')].slice(0, -1);
    const reveal = () => {
      img.classList.add('is-in');
      old.forEach(el => { el.classList.add('is-out'); setTimeout(() => el.remove(), 700); });
      scroll(view, img);
    };
    if (img.complete) requestAnimationFrame(reveal); else img.addEventListener('load', reveal, { once: true });
  }

  // La página baja despacio, como si alguien la estuviera recorriendo.
  function scroll(view, img) {
    if (still()) return;
    const distance = img.getBoundingClientRect().height - view.getBoundingClientRect().height;
    if (distance <= 0) return;
    const animation = img.animate(
      [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .08 }, { transform: `translateY(${-distance}px)`, offset: .92 }, { transform: `translateY(${-distance}px)` }],
      { duration: DURATION + 800, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' }
    );
    animations.push(animation);
    if (animations.length > 6) animations.splice(0, animations.length - 6);
    if (hovering || !inView) animation.pause();
  }

  function show(i, manual) {
    index = i;
    const p = projects[i];
    [...tabs.children].forEach((tab, n) => {
      const on = n === i;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      tab.classList.remove('is-running');
      if (on && !still()) { void tab.offsetWidth; tab.classList.add('is-running'); }
    });
    hero.style.setProperty('--stage-accent', p.accent);
    url.textContent = p.url;
    link.href = p.href;
    link.setAttribute('aria-label', `Abrir la web de ejemplo de ${p.name}`);
    layer(laptopView, `assets/shots/${p.key}-full.webp`, `Web de ejemplo de ${p.name} en computador`);
    layer(phoneView, `assets/shots/${p.key}-mfull.webp`, `Web de ejemplo de ${p.name} en celular`);
    note.classList.remove('is-in'); void note.offsetWidth;
    note.querySelector(':scope > div > strong').textContent = p.note[0];
    note.querySelector(':scope > div > span').textContent = p.note[1];
    setTimeout(() => note.classList.add('is-in'), still() ? 0 : 900);
    preload(i + 1);
    schedule(manual);
  }

  function schedule() {
    clearTimeout(timer);
    if (still() || !inView || hovering) return;
    timer = setTimeout(() => show((index + 1) % projects.length), DURATION);
  }
  const pauseAll = () => { clearTimeout(timer); animations.forEach(a => a.playState === 'running' && a.pause()); stage.classList.add('is-paused'); };
  const resumeAll = () => { if (still()) return; stage.classList.remove('is-paused'); animations.forEach(a => a.playState === 'paused' && a.play()); schedule(); };

  stage.addEventListener('pointerenter', () => { hovering = true; pauseAll(); });
  stage.addEventListener('pointerleave', () => { hovering = false; if (inView) resumeAll(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) pauseAll(); else if (!hovering) resumeAll();
    }, { threshold: .2 }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); else if (inView && !hovering) resumeAll(); });
  new MutationObserver(() => { if (still()) pauseAll(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  show(0);
})();
