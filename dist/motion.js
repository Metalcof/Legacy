'use strict';
// Movimiento de la portada. Todo respeta "reducir movimiento" del sistema y el botón de pausa del diagrama
// (app.js añade body.motion-paused). Sin movimiento, el contenido se muestra completo y quieto.
(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canMove = () => !reduced.matches && !body.classList.contains('motion-paused');
  const onMotionChange = callback => {
    new MutationObserver(callback).observe(body, { attributes: true, attributeFilter: ['class'] });
    reduced.addEventListener('change', callback);
  };
  if (canMove()) root.classList.add('motion-ready');
  onMotionChange(() => { if (!canMove()) root.classList.add('motion-settled'); });

  /* ---------- Entrada de la portada ---------- */
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    const text = heroTitle.textContent.trim();
    const words = text.split(/\s+/);
    if (!canMove() || words.length < 3) {
      // Sin animación: un espacio duro evita que la última palabra quede sola.
      heroTitle.textContent = text.replace(/\s+(\S+)$/, ' $1');
    } else {
      heroTitle.setAttribute('aria-label', text);
      const makeWord = (word, index) => {
        const span = document.createElement('span');
        span.className = 'w'; span.setAttribute('aria-hidden', 'true');
        span.style.setProperty('--i', index);
        span.textContent = word;
        return span;
      };
      const nodes = words.slice(0, -2).flatMap((word, index) => [makeWord(word, index), document.createTextNode(' ')]);
      // Las dos últimas palabras viajan juntas para que ninguna quede sola en su línea.
      const tail = document.createElement('span');
      tail.className = 'nowrap';
      tail.append(makeWord(words.at(-2), words.length - 2), ' ', makeWord(words.at(-1), words.length - 1));
      heroTitle.replaceChildren(...nodes, tail);
    }
  }
  requestAnimationFrame(() => root.classList.add('hero-play'));

  /* ---------- Notificaciones del hero que cambian solas ---------- */
  const alertCard = document.querySelector('[data-hero-alert]');
  const bars = [...document.querySelectorAll('.ui-card-chart .mini-bars span')];
  const alerts = [
    ['Cita confirmada', 'Aviso enviado por WhatsApp y agenda actualizada.', '10:02'],
    ['Recordatorio enviado', 'La paciente de las 11:15 recibió su recordatorio.', '10:04'],
    ['Cupo liberado', 'Una cancelación dejó libre el jueves a las 4:00 p. m.', '10:07'],
    ['Pago recibido', 'Consulta de control pagada en línea. Factura enviada.', '10:09']
  ];
  let alertIndex = 0;
  let alertTimer;
  function cycleAlert() {
    if (!alertCard || !canMove() || document.hidden) return;
    alertCard.classList.add('is-leaving');
    setTimeout(() => {
      alertIndex = (alertIndex + 1) % alerts.length;
      const [title, text, time] = alerts[alertIndex];
      alertCard.querySelector('strong').textContent = title;
      alertCard.querySelector('p').textContent = text;
      alertCard.querySelector('time').textContent = time;
      alertCard.classList.remove('is-leaving');
      alertCard.classList.add('is-arriving');
      setTimeout(() => alertCard.classList.remove('is-arriving'), 600);
      if (bars.length) {
        const bar = bars[Math.floor(Math.random() * bars.length)];
        const current = parseFloat(bar.style.getPropertyValue('--h')) || 50;
        const next = Math.max(30, Math.min(88, current + (Math.random() > .4 ? 8 : -8)));
        bar.style.setProperty('--h', next + '%');
        const top = bars.reduce((a, b) => (parseFloat(b.style.getPropertyValue('--h')) > parseFloat(a.style.getPropertyValue('--h')) ? b : a));
        bars.forEach(item => item.classList.toggle('is-top', item === top));
      }
    }, 260);
  }
  function startAlerts() { clearInterval(alertTimer); if (alertCard && canMove()) alertTimer = setInterval(cycleAlert, 4200); }
  startAlerts();
  onMotionChange(startAlerts);

  /* ---------- Revelado al hacer scroll ---------- */
  const revealTargets = [
    ...document.querySelectorAll('[data-reveal]'),
    ...document.querySelectorAll('main .photo-frame:not(.photo-hero)'),
    ...document.querySelectorAll('main .feature-visual .ui-card, .hero-panel, .product-case, .catalog-conclusion, .cta-band-inner, .contact-inner'),
    ...document.querySelectorAll('.business-case, .sector-automation-case, .faq-list details')
  ];
  const groupIndex = new Map();
  revealTargets.forEach(el => {
    el.classList.add('reveal');
    const parent = el.parentElement;
    const index = groupIndex.get(parent) || 0;
    groupIndex.set(parent, index + 1);
    el.style.setProperty('--d', `${Math.min(index, 5) * 90}ms`);
  });
  if ('IntersectionObserver' in window) {
    // Las fotos se revelan con clip-path, que las oculta también para el observador:
    // por eso se observa su contenedor.
    const watched = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (watched.get(entry.target) || []).forEach(el => el.classList.add('is-in'));
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    revealTargets.forEach(el => {
      const target = el.classList.contains('photo-frame') ? el.parentElement : el;
      if (!watched.has(target)) watched.set(target, []);
      watched.get(target).push(el);
      observer.observe(target);
    });
  } else revealTargets.forEach(el => el.classList.add('is-in'));

  /* ---------- Cifras que cuentan ---------- */
  const counters = [...document.querySelectorAll('[data-count]')];
  const countObserver = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      countObserver.unobserve(entry.target);
      const el = entry.target;
      const target = Number(el.dataset.count);
      if (!canMove()) { el.textContent = String(target); return; }
      const start = performance.now();
      const duration = 1100;
      const tick = now => {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  if (countObserver) counters.forEach(el => countObserver.observe(el));

  /* ---------- Cabecera: sombra y barra de progreso ---------- */
  const header = document.querySelector('.header');
  const progress = document.createElement('span');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  header?.append(progress);

  /* ---------- Profundidad: las tarjetas flotan a otra velocidad que la foto ---------- */
  const depthItems = [...document.querySelectorAll('[data-depth]')];
  const wide = window.matchMedia('(min-width: 961px)');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      header?.classList.toggle('is-scrolled', y > 8);
      const max = root.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (!wide.matches || !canMove()) { depthItems.forEach(el => el.style.removeProperty('--parallax')); return; }
      const middle = window.innerHeight / 2;
      depthItems.forEach(el => {
        const box = el.parentElement.getBoundingClientRect();
        if (box.bottom < -200 || box.top > window.innerHeight + 200) return;
        const offset = (box.top + box.height / 2 - middle) * Number(el.dataset.depth);
        el.style.setProperty('--parallax', `${(-offset).toFixed(1)}px`);
      });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Registro en vivo del diagrama ---------- */
  const log = document.querySelector('[data-live-log]');
  const logLines = [
    ['chat', 'cliente pregunta por horario'], ['crm', 'contacto actualizado'], ['correo', 'comprobante enviado'],
    ['web', 'pedido 1044 recibido'], ['stock', 'disponibilidad descontada'], ['pagos', 'cobro confirmado'],
    ['chat', 'aviso de pedido listo'], ['web', 'reserva 10:30 creada'], ['crm', 'cliente frecuente: +1 visita']
  ];
  let logIndex = 0;
  let clock = new Date(2026, 0, 1, 10, 42, 8);
  let logTimer;
  function addLogLine() {
    if (!log || !canMove() || document.hidden) return;
    const [source, message] = logLines[logIndex++ % logLines.length];
    clock = new Date(clock.getTime() + 1000 + Math.random() * 4000);
    const li = document.createElement('li');
    li.className = 'is-new';
    const time = document.createElement('time');
    time.textContent = clock.toTimeString().slice(0, 8);
    const b = document.createElement('b'); b.textContent = source;
    const span = document.createElement('span'); span.textContent = message;
    li.append(time, b, span);
    log.append(li);
    const first = log.firstElementChild;
    first.classList.add('is-old');
    setTimeout(() => first.remove(), 380);
  }
  function startLog() { clearInterval(logTimer); if (log && canMove()) logTimer = setInterval(addLogLine, 2600); }
  startLog();
  onMotionChange(startLog);

  /* ---------- Filtro de proyectos: las tarjetas entran ---------- */
  const catalog = document.querySelector('.sector-catalog');
  catalog?.querySelectorAll('[data-sector-filter], [data-reset-catalog]').forEach(button => button.addEventListener('click', () => {
    if (!canMove()) return;
    let index = 0;
    catalog.querySelectorAll('[data-sector-case]:not([hidden]), [data-catalog-product]:not([hidden]) .product-case').forEach(item => {
      item.classList.add('is-in');
      item.classList.remove('filter-in'); void item.offsetWidth;
      item.style.setProperty('--fd', `${index++ * 70}ms`);
      item.classList.add('filter-in');
    });
  }));

  /* ---------- Proyectos: al pasar el mouse, la foto se convierte en la demo grabada ---------- */
  const caseVideos = { 'caso-cafe': 'cafeteria', 'caso-tienda': 'tienda', 'caso-clinica': 'clinica' };
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    Object.entries(caseVideos).forEach(([id, name]) => {
      const item = document.getElementById(id);
      const photo = item?.querySelector('.business-photo');
      if (!photo) return;
      photo.classList.add('has-preview');
      const badge = document.createElement('span');
      badge.className = 'preview-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = 'Ver en movimiento';
      photo.append(badge);
      let clip;
      item.addEventListener('pointerenter', () => {
        if (!canMove()) return;
        if (!clip) {
          clip = document.createElement('video');
          Object.assign(clip, { muted: true, loop: true, playsInline: true, preload: 'auto', src: `assets/video/${name}.webm` });
          clip.setAttribute('aria-hidden', 'true');
          clip.className = 'case-video';
          photo.append(clip);
        }
        const p = clip.play(); if (p) p.catch(() => {});
        photo.classList.add('is-playing');
      });
      item.addEventListener('pointerleave', () => {
        photo.classList.remove('is-playing');
        clip?.pause();
      });
    });
  }

  /* ---------- Producto: cambio de color con transición ---------- */
  const productImage = document.querySelector('[data-preview-product-image]');
  document.querySelectorAll('[data-preview-color]').forEach(button => button.addEventListener('click', () => {
    if (!productImage || !canMove()) return;
    productImage.classList.remove('is-swapping'); void productImage.offsetWidth;
    productImage.classList.add('is-swapping');
  }));

  /* ---------- Cómo trabajamos: cada paso entra ---------- */
  const journeyPanel = document.getElementById('journey-panel');
  if (journeyPanel) {
    new MutationObserver(() => {
      if (!canMove()) return;
      journeyPanel.classList.remove('is-entering'); void journeyPanel.offsetWidth;
      journeyPanel.classList.add('is-entering');
    }).observe(journeyPanel, { childList: true });
  }

  /* ---------- Reproductor de demos grabadas ---------- */
  const reel = document.getElementById('en-accion');
  const video = reel?.querySelector('[data-reel-video]');
  if (reel && video) {
    const chapters = [...reel.querySelectorAll('[data-reel-src]')];
    const playButton = reel.querySelector('[data-reel-play]');
    const bar = reel.querySelector('[data-reel-progress]');
    const label = reel.querySelector('[data-reel-label]');
    const screen = reel.querySelector('.reel-video');
    let current = 0;
    let inView = false;
    let userPaused = false;

    const setPlayingUI = () => {
      const paused = video.paused;
      screen.classList.toggle('is-paused', paused);
      playButton.setAttribute('aria-label', paused ? 'Reproducir video' : 'Pausar video');
    };
    const tryPlay = () => {
      if (userPaused || !inView || !canMove()) { setPlayingUI(); return; }
      const promise = video.play();
      if (promise) promise.catch(() => setPlayingUI());
    };
    function select(index, autoplay) {
      current = (index + chapters.length) % chapters.length;
      const button = chapters[current];
      const base = button.dataset.reelSrc;
      chapters.forEach((item, position) => {
        item.setAttribute('aria-pressed', String(position === current));
        item.style.setProperty('--p', '0');
      });
      const name = button.querySelector('strong').textContent;
      label.textContent = `Demo grabada: ${name}`;
      video.setAttribute('aria-label', `Video de la demo de ${name.toLowerCase()} en uso`);
      screen.classList.remove('is-missing');
      screen.classList.add('is-switching');
      video.poster = `${base}.jpg`;
      video.querySelector('source').src = `${base}.webm`;
      video.load();
      video.addEventListener('loadeddata', () => screen.classList.remove('is-switching'), { once: true });
      setTimeout(() => screen.classList.remove('is-switching'), 700);
      if (autoplay) tryPlay(); else setPlayingUI();
    }
    chapters.forEach((button, index) => button.addEventListener('click', () => {
      userPaused = false;
      select(index, true);
      if (!canMove()) { const p = video.play(); if (p) p.catch(() => {}); }
    }));
    playButton.addEventListener('click', () => {
      if (video.paused) { userPaused = false; const p = video.play(); if (p) p.catch(() => {}); }
      else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', setPlayingUI);
    video.addEventListener('pause', setPlayingUI);
    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const ratio = video.currentTime / video.duration;
      bar.style.transform = `scaleX(${ratio})`;
      chapters[current].style.setProperty('--p', ratio.toFixed(3));
    });
    video.addEventListener('ended', () => { chapters[current].style.setProperty('--p', '1'); select(current + 1, true); });
    video.addEventListener('error', () => screen.classList.add('is-missing'), true);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        if (inView) tryPlay(); else if (!video.paused) video.pause();
      }, { threshold: .35 }).observe(screen);
    }
    onMotionChange(() => { if (!canMove() && !video.paused) { userPaused = true; video.pause(); } });
    setPlayingUI();
  }
})();
