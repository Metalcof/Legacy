'use strict';
// WAV · Wave One — historia con escenario fijo, simulador de cancelación de ruido y barra de compra.
// Se carga después de demos.js: la selección de color y la bolsa siguen siendo de demos.js.
(() => {
  if (!document.body.classList.contains('store')) return;
  document.documentElement.classList.add('wv-js');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  // Las otras dos fotos de producto se precargan para que el cambio de acabado no parpadee.
  window.addEventListener('load', () => {
    ['lavanda', 'grafito', 'lima'].forEach((color) => { const image = new Image(); image.src = `../assets/headphones-${color}.webp`; });
  }, { once: true });

  /* Historia: el capítulo activo mueve el producto del escenario fijo. */
  const story = document.querySelector('.wv-story');
  const stage = document.querySelector('.wv-stage-inner');
  const chapters = [...document.querySelectorAll('.wv-chapter')];
  let storyQueued = false;
  function updateStory() {
    storyQueued = false;
    if (!story || !stage) return;
    const viewport = window.innerHeight;
    const narrow = window.matchMedia('(max-width: 820px)').matches;
    const line = viewport * (narrow ? 0.78 : 0.56);
    let active = 1;
    chapters.forEach((chapter, index) => { if (chapter.getBoundingClientRect().top < line) active = index + 1; });
    if (stage.dataset.chapter !== String(active)) {
      stage.dataset.chapter = String(active);
      chapters.forEach((chapter, index) => chapter.classList.toggle('is-active', index + 1 === active));
    }
    if (!reduced()) {
      const bounds = story.getBoundingClientRect();
      const progress = clamp((viewport - bounds.top) / (bounds.height + viewport), 0, 1) * 2 - 1;
      stage.style.setProperty('--p', progress.toFixed(3));
    } else stage.style.setProperty('--p', '0');
  }
  const queueStory = () => { if (!storyQueued) { storyQueued = true; requestAnimationFrame(updateStory); } };
  if (story && stage && chapters.length) {
    chapters[0].classList.add('is-active');
    let storyVisible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { storyVisible = entry.isIntersecting; if (storyVisible) queueStory(); }, { rootMargin: '20% 0px' }).observe(story);
    }
    window.addEventListener('scroll', () => { if (storyVisible) queueStory(); }, { passive: true });
    window.addEventListener('resize', queueStory);
    updateStory();
  }

  /* Simulador de cancelación de ruido. Es una ilustración, no una medición. */
  const viz = document.querySelector('.wv-anc-viz');
  if (viz) {
    const noisePath = viz.querySelector('.noise');
    const heardPath = viz.querySelector('.heard');
    const valueLabel = document.getElementById('wv-anc-value');
    const bar = document.getElementById('wv-anc-bar');
    const text = document.getElementById('wv-anc-text');
    const places = {
      metro: { amp: 0.86, waves: [[2.1, 1], [5.3, 0.55], [13, 0.3]], jitter: 0.32, speed: 1.4 },
      oficina: { amp: 0.5, waves: [[3.4, 0.6], [9, 0.6], [21, 0.35]], jitter: 0.45, speed: 2.1 },
      avion: { amp: 0.7, waves: [[1.4, 1], [2.8, 0.45], [6, 0.2]], jitter: 0.12, speed: 0.9 },
    };
    const modes = { anc: 0.07, ambiente: 0.5, off: 0.78 };
    const copy = {
      anc: {
        metro: 'Cancelación activa: el traqueteo del vagón se convierte en un fondo casi imperceptible.',
        oficina: 'Cancelación activa: el teclado y las conversaciones cercanas pasan a segundo plano.',
        avion: 'Cancelación activa: el zumbido constante de los motores es lo que mejor se anula.',
      },
      ambiente: {
        metro: 'Modo ambiente: escuchas los anuncios de la estación sin quitarte los auriculares.',
        oficina: 'Modo ambiente: puedes responder a quien te hable sin pausar la música.',
        avion: 'Modo ambiente: oyes al personal de cabina y los avisos por altavoz.',
      },
      off: {
        metro: 'Apagado: las almohadillas aíslan algo, pero el ruido del vagón se sigue colando.',
        oficina: 'Apagado: el aislamiento de las almohadillas suaviza, no silencia.',
        avion: 'Apagado: el zumbido grave atraviesa las almohadillas casi completo.',
      },
    };
    const levels = [[0.12, 'Muy bajo'], [0.3, 'Bajo'], [0.5, 'Medio'], [Infinity, 'Alto']];
    let place = 'metro';
    let mode = 'anc';
    let time = 0;
    let running = false;
    let visible = false;
    let last = 0;
    let shownResidual = modes.anc;
    let shownAmp = places.metro.amp;
    const width = 600;
    const middle = 130;
    const hash = (n) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
    function noiseAt(x, t, settings) {
      let y = 0;
      settings.waves.forEach(([frequency, weight], index) => { y += Math.sin((x / width) * Math.PI * 2 * frequency + t * settings.speed * (1 + index * 0.7)) * weight; });
      const grain = hash(Math.floor(x / 6) + Math.floor(t * 18)) * 2 - 1;
      return (y / 1.8 + grain * settings.jitter) * 0.5;
    }
    function draw() {
      const settings = places[place];
      shownResidual += (modes[mode] - shownResidual) * (reduced() ? 1 : 0.08);
      shownAmp += (settings.amp - shownAmp) * (reduced() ? 1 : 0.08);
      let noise = '';
      let heard = '';
      for (let x = 0; x <= width; x += 5) {
        const n = noiseAt(x, time, settings) * shownAmp * 110;
        const music = Math.sin((x / width) * Math.PI * 6 + time * 2.2) * 26 + Math.sin((x / width) * Math.PI * 15 + time * 3.1) * 8;
        const h = music * (mode === 'off' ? 0.7 : 1) + n * shownResidual;
        noise += `${x ? 'L' : 'M'}${x} ${(middle + n).toFixed(1)} `;
        heard += `${x ? 'L' : 'M'}${x} ${(middle + h).toFixed(1)} `;
      }
      noisePath.setAttribute('d', noise);
      heardPath.setAttribute('d', heard);
    }
    function renderMeter() {
      const level = modes[mode] * places[place].amp;
      valueLabel.textContent = levels.find(([max]) => level <= max)[1];
      bar.style.transform = `scaleX(${clamp(level * 1.4, 0.06, 1).toFixed(3)})`;
      text.textContent = copy[mode][place];
      viz.dataset.mode = mode;
    }
    function frame(now) {
      if (!running) return;
      const delta = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      time += delta;
      draw();
      requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduced() || !visible) return;
      running = true;
      last = 0;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }
    function setChoice(attribute, value) {
      document.querySelectorAll(`[data-anc-${attribute}]`).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset[attribute === 'place' ? 'ancPlace' : 'ancMode'] === value)));
      if (attribute === 'place') place = value; else mode = value;
      renderMeter();
      if (!running) draw();
    }
    document.querySelectorAll('[data-anc-place]').forEach((button) => button.addEventListener('click', () => setChoice('place', button.dataset.ancPlace)));
    document.querySelectorAll('[data-anc-mode]').forEach((button) => button.addEventListener('click', () => setChoice('mode', button.dataset.ancMode)));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else stop(); }).observe(viz);
    }
    motionQuery.addEventListener?.('change', () => { if (reduced()) stop(); else start(); draw(); });
    renderMeter();
    draw();
  }

  /* Acabados: elegir desde el comparador lleva a la caja de compra (demos.js ya cambió el color). */
  const product = document.getElementById('producto');
  document.querySelectorAll('.wv-finish-pick').forEach((button) => {
    button.addEventListener('click', () => {
      product.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => document.getElementById('add-cart').focus({ preventScroll: true }), reduced() ? 0 : 600);
    });
  });

  /* Barra de compra: aparece al pasar la portada y se oculta mientras la caja de compra está a la vista. */
  const buybar = document.getElementById('wv-buybar');
  const buyColor = document.getElementById('wv-buybar-color');
  const colorName = document.getElementById('color-name');
  document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => { if (buyColor && colorName) buyColor.textContent = colorName.textContent; }));
  const hero = document.querySelector('.wv-hero');
  const footer = document.querySelector('.footer');
  if (buybar && hero && product && 'IntersectionObserver' in window) {
    const seen = new Map();
    const refresh = () => {
      const show = seen.get(hero) === false && !seen.get(product) && !seen.get(footer);
      buybar.classList.toggle('is-visible', show);
      buybar.inert = !show;
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => seen.set(entry.target, entry.isIntersecting));
      refresh();
    }, { threshold: 0 });
    [hero, product, footer].filter(Boolean).forEach((element) => observer.observe(element));
    buybar.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      product.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
      window.setTimeout(() => document.getElementById('add-cart').focus({ preventScroll: true }), reduced() ? 0 : 600);
    });
  }
})();
