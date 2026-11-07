'use strict';
// Motor de escenas animadas de los proyectos.
// Cada escena (escenas/<clave>.js) se registra así:
//   window.NexoEscenas.<clave> = {
//     title: 'Texto corto de lo que se ve',
//     duration: 16000,                       // milisegundos de la animación completa
//     steps: [{ label: 'Molemos el grano', at: 0 }, { label: '…', at: .2 }, …],  // at: 0..1
//     mount(stage) { …crea su SVG/DOM dentro de stage…; return { render(p) { … } } }  // p: 0..1
//   };
// render(p) debe ser una función pura del progreso: así se puede reproducir, pausar y adelantar a mano.
(() => {
  window.NexoEscenas = window.NexoEscenas || {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches || document.body.classList.contains('motion-paused');
  // Rendimiento: una sola escena se reproduce a la vez y todas esperan mientras la persona hace scroll.
  const players = new Set();
  let scrolling = false;
  let scrollTimer;
  addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrolling = false; }, 160);
  }, { passive: true });

  function build(host) {
    const key = host.dataset.scene;
    const def = window.NexoEscenas[key];
    if (!def || host.dataset.ready) return;
    host.dataset.ready = '1';
    host.classList.add(`scene--${key}`);

    const head = document.createElement('div');
    head.className = 'scene-head';
    const title = document.createElement('p');
    title.className = 'scene-title';
    title.textContent = def.title;
    const play = document.createElement('button');
    play.type = 'button';
    play.className = 'scene-play';
    play.innerHTML = '<span class="scene-ico-pause" aria-hidden="true"></span><span class="scene-ico-play" aria-hidden="true"></span><span class="scene-play-label">Pausar</span>';
    head.append(title, play);

    const stage = document.createElement('div');
    stage.className = 'scene-stage';
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', def.title);

    const controls = document.createElement('div');
    controls.className = 'scene-controls';
    const range = document.createElement('input');
    range.type = 'range'; range.min = '0'; range.max = '1000'; range.value = '0';
    range.className = 'scene-range';
    range.setAttribute('aria-label', `Avance de la animación: ${def.title}`);
    const steps = document.createElement('ol');
    steps.className = 'scene-steps';
    def.steps.forEach((step, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.innerHTML = `<b>${index + 1}</b><span></span>`;
      button.querySelector('span').textContent = step.label;
      button.addEventListener('click', () => { seek(step.at); playing = !still(); tick.last = performance.now(); loop(); updateButton(); });
      li.append(button);
      steps.append(li);
    });
    controls.append(range, steps);
    host.append(head, stage, controls);

    let api;
    try { api = def.mount(stage) || {}; } catch (error) { console.error(`Escena ${key}:`, error); host.remove(); return; }
    let progress = 0;
    let playing = false;
    let frame;
    const tick = { last: 0 };

    function paint() {
      try { api.render?.(progress); } catch (error) { console.error(`Escena ${key}:`, error); }
      range.value = String(Math.round(progress * 1000));
      // En la barra y no en el contenedor: una variable heredada en el contenedor obligaba a recalcular
      // los estilos de cientos de piezas de la escena en cada cuadro.
      range.style.setProperty('--scene-progress', progress.toFixed(4));
      let current = 0;
      def.steps.forEach((step, index) => { if (progress >= step.at - 0.0001) current = index; });
      [...steps.children].forEach((li, index) => {
        li.classList.toggle('is-done', index < current || progress >= 1);
        li.classList.toggle('is-current', index === current && progress < 1);
      });
      host.classList.toggle('is-complete', progress >= 1);
    }
    function seek(p) { progress = Math.min(1, Math.max(0, p)); paint(); }
    function updateButton() {
      play.classList.toggle('is-paused', !playing);
      play.querySelector('.scene-play-label').textContent = playing ? 'Pausar' : progress >= 1 ? 'Repetir' : 'Reproducir';
      play.setAttribute('aria-label', `${playing ? 'Pausar' : progress >= 1 ? 'Repetir' : 'Reproducir'} la animación`);
    }
    function loop() {
      cancelAnimationFrame(frame);
      if (!playing) return;
      frame = requestAnimationFrame(now => {
        const dt = Math.min(64, now - (tick.last || now));
        // Durante el scroll el tiempo de la escena se detiene; y nunca se dibuja a más de 60 cuadros por segundo.
        if (scrolling || dt < 15) { if (scrolling) tick.last = now; loop(); return; }
        tick.last = now;
        seek(progress + dt / def.duration);
        if (progress >= 1) { playing = false; updateButton(); return; }
        loop();
      });
    }
    function start() {
      if (still()) { seek(1); playing = false; updateButton(); return; }
      if (progress >= 1) seek(0);
      players.forEach(other => { if (other !== control) other.pause(); });
      playing = true; tick.last = performance.now(); updateButton(); loop();
    }
    function pause() { playing = false; cancelAnimationFrame(frame); updateButton(); }
    const control = { pause };
    players.add(control);

    play.addEventListener('click', () => { if (playing) pause(); else start(); });
    range.addEventListener('input', () => { pause(); seek(Number(range.value) / 1000); });

    paint(); updateButton();
    if (still()) { seek(1); updateButton(); }
    // Arranca sola la primera vez que se ve; se pausa al salir de la pantalla.
    let started = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !started) { started = true; start(); }
        else if (!entry.isIntersecting && playing) { pause(); started = progress < 1 ? false : started; }
      }, { threshold: .45 }).observe(stage);
    } else start();
    new MutationObserver(() => { if (still() && playing) { pause(); seek(1); updateButton(); } }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  const boot = () => document.querySelectorAll('[data-scene]').forEach(build);
  window.NexoEscenas.boot = boot;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
