'use strict';
// Movimiento ligado al scroll: mientras la persona baja, las piezas se mueven según cuánto ha avanzado.
// No es una animación que se dispara una vez: si sube, todo vuelve atrás; si baja, sigue.
// Solo usa translate, scale y rotate (propiedades sueltas, para no pisar los "transform" que ya existen).
// Se apaga con "reducir movimiento" y con el botón de pausa (body.motion-paused).
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wideQ = window.matchMedia('(min-width: 961px)');
  const still = () => reduced.matches || document.body.classList.contains('motion-paused');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const r1 = v => Math.round(v * 10) / 10;
  const r3 = v => Math.round(v * 1000) / 1000;

  // Posición de un elemento en la página sin contar transformaciones (offsetTop no las incluye).
  const pageTop = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };

  const items = [];
  // run(p, item): p va de 0 (el ancla asoma por abajo, en vh*from) a 1 (el ancla llega a vh*to).
  // devuelve { translate, scale, rotate } en texto, o null para dejar el elemento quieto.
  // noTransition: el elemento tiene una transición de CSS sobre scale/translate que haría arrastrar el movimiento.
  function track(el, run, { anchor = el, from = 1, to = .3, wideOnly = false, layer = true, noTransition = false } = {}) {
    if (!el) return;
    items.push({ el, run, anchor, from, to, wideOnly, layer, noTransition, top: 0, h: 0, last: '', live: false });
  }

  /* ---------- 1. Las secciones oscuras se abren hasta ocupar la pantalla ---------- */
  document.querySelectorAll('.auto, .reel, .sectors, .pricing, .contact').forEach(slab => {
    slab.style.transformOrigin = '50% 0';
    track(slab, (p, it) => {
      const s = lerp(it.wide ? .9 : .95, 1, ease(p));
      return { scale: `${r3(s)}` };
    }, { from: 1, to: .2 });
  });

  /* ---------- 2. Portada: el texto sube más rápido que el computador al bajar ---------- */
  const introCopy = document.querySelector('.intro-copy');
  const stage = document.querySelector('.intro .stage');
  track(introCopy, p => ({ translate: `0 ${r1(-90 * p)}px` }), { anchor: document.getElementById('inicio'), from: 0, to: -.9, wideOnly: true });
  track(stage, p => ({ translate: `0 ${r1(70 * p)}px`, scale: `${r3(1 - .07 * p)}` }), { anchor: document.getElementById('inicio'), from: 0, to: -.9, wideOnly: true });

  /* ---------- 3. Títulos de sección que se deslizan a su sitio ---------- */
  document.querySelectorAll('main > section h2[id]').forEach(h2 => {
    track(h2, p => ({ translate: `${r1(-70 * (1 - ease(p)))}px 0` }), { from: 1, to: .45, wideOnly: true });
  });

  /* ---------- 4. Proyectos: la web se endereza y crece; el celular flota a otra velocidad ---------- */
  const work = document.getElementById('proyectos');
  if (work) work.style.overflowX = 'clip';
  document.querySelectorAll('.case').forEach((item, index) => {
    const side = index % 2 ? 1 : -1; // en pares la web va a la derecha
    const visual = item.querySelector('.case-visual');
    const copy = item.querySelector('.case-copy');
    const phone = item.querySelector('.case-phone');
    const shot = item.querySelector('.case-shot img');
    track(visual, (p, it) => {
      const e = ease(p);
      return it.wide
        ? { translate: `${r1(side * 120 * (1 - e))}px ${r1(40 * (1 - e))}px`, scale: `${r3(lerp(.86, 1, e))}`, rotate: `${r1(side * -4 * (1 - e))}deg` }
        : { translate: `0 ${r1(30 * (1 - e))}px`, scale: `${r3(lerp(.93, 1, e))}` };
    }, { from: 1.05, to: .35 });
    track(copy, (p, it) => ({ translate: `0 ${r1((it.wide ? 90 : 30) * (1 - ease(p)))}px` }), { from: 1.05, to: .4 });
    // El celular se mueve durante todo el paso por la pantalla (profundidad).
    track(phone, p => ({ translate: `0 ${r1(lerp(90, -70, p))}px` }), { anchor: item, from: 1, to: -.4, wideOnly: true });
    // La captura empieza ampliada y se asienta: parece que la web "se abre".
    // Al asentarse devuelve el control al CSS (y así vuelve el zoom suave al pasar el mouse).
    track(shot, p => (p >= 1 ? null : { scale: `${r3(lerp(1.18, 1, ease(p)))}` }), { anchor: visual, from: 1.05, to: .3, noTransition: true });
  });

  /* ---------- 5. Demos en video: la pantalla se inclina hacia ti y crece ---------- */
  const reelScreen = document.querySelector('.reel-screen');
  if (reelScreen) {
    reelScreen.parentElement.style.perspective = '1600px';
    track(reelScreen, (p, it) => {
      const e = ease(p);
      return { scale: `${r3(lerp(it.wide ? .82 : .92, 1, e))}`, rotate: `1 0 0 ${r1(18 * (1 - e))}deg` };
    }, { from: 1, to: .3 });
  }

  /* ---------- 6. Tarjetas que suben en cascada, columna por columna ---------- */
  const cardGroups = ['.paths-grid > *', '.gain-grid > *', '.bento > .bento-tile', '.pricing .plan', '.step-list > li', '.auto-grid .auto-card'];
  cardGroups.forEach(selector => {
    const cards = [...document.querySelectorAll(selector)];
    cards.forEach(card => {
      track(card, (p, it) => {
        const t = clamp(p * 1.25 - (it.col || 0) * .13);
        const e = ease(t);
        const lift = it.wide ? 110 : 50;
        const tilt = it.wide ? ((it.col || 0) - (it.cols - 1) / 2) * 2.5 : 0;
        return { translate: `0 ${r1(lift * (1 - e))}px`, scale: `${r3(lerp(.92, 1, e))}`, rotate: `${r1(tilt * (1 - e))}deg` };
      }, { from: 1.05, to: .45 });
    });
  });

  /* ---------- 7. Mazo de sistemas: cada tarjeta flota a su propio ritmo ---------- */
  document.querySelectorAll('.pj-deck .pj-card').forEach((card, i) => {
    const speed = [60, 25, 45, 80][i % 4];
    track(card, p => ({ translate: `0 ${r1(lerp(speed, -speed, p))}px` }), { anchor: card.parentElement, from: 1, to: -.3, wideOnly: true });
  });

  /* ---------- Motor ---------- */
  let vh = innerHeight;
  let measured = false;
  function measure() {
    vh = innerHeight;
    const wide = wideQ.matches;
    items.forEach(it => {
      it.top = pageTop(it.anchor);
      it.h = it.anchor.offsetHeight;
      it.wide = wide;
    });
    // Columna de cada tarjeta dentro de su fila (para la cascada).
    const byParent = new Map();
    items.forEach(it => {
      if (!it.el.parentElement) return;
      const list = byParent.get(it.el.parentElement) || [];
      list.push(it); byParent.set(it.el.parentElement, list);
    });
    byParent.forEach(list => {
      const rows = new Map();
      list.forEach(it => { const k = it.el.offsetTop; rows.set(k, (rows.get(k) || []).concat(it)); });
      rows.forEach(row => {
        row.sort((a, b) => a.el.offsetLeft - b.el.offsetLeft);
        row.forEach((it, col) => { it.col = col; it.cols = row.length; });
      });
    });
    measured = true;
  }

  function clear(it) {
    if (!it.last) return;
    it.el.style.translate = ''; it.el.style.scale = ''; it.el.style.rotate = ''; it.el.style.willChange = '';
    if (it.noTransition) it.el.style.transition = '';
    it.last = ''; it.live = false;
  }

  let ticking = false;
  function frame() {
    ticking = false;
    if (still()) { items.forEach(clear); return; }
    if (!measured) measure();
    const y = scrollY;
    for (const it of items) {
      if (it.wideOnly && !it.wide) { clear(it); continue; }
      // Rango en coordenadas de scroll: empieza cuando top - y = vh*from, termina cuando top - y = vh*to.
      const start = it.top - vh * it.from, end = it.top - vh * it.to;
      const p = clamp((y - start) / (end - start));
      // Fuera de pantalla con el valor ya aplicado: no hace falta tocarlo.
      const onScreen = it.top - y < vh * 1.2 && it.top + it.h - y > -vh * .2;
      const v = it.run(p, it);
      const key = v ? `${v.translate || ''}|${v.scale || ''}|${v.rotate || ''}` : '';
      if (key !== it.last) {
        it.el.style.translate = v?.translate || '';
        it.el.style.scale = v?.scale || '';
        it.el.style.rotate = v?.rotate || '';
        if (it.noTransition) it.el.style.transition = key ? 'none' : '';
        it.last = key;
      }
      // Capa propia solo mientras se mueve, para que el texto vuelva a verse nítido al quedarse quieto.
      const moving = onScreen && p > 0 && p < 1 && it.layer;
      if (moving !== it.live) { it.el.style.willChange = moving ? 'translate, scale, rotate' : ''; it.live = moving; }
    }
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measured = false; request(); });
  wideQ.addEventListener('change', () => { measured = false; request(); });
  reduced.addEventListener('change', request);
  new MutationObserver(request).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  // Cuando cambia el alto de la página (filtros, acordeones, imágenes que cargan) se vuelve a medir.
  if ('ResizeObserver' in window) new ResizeObserver(() => { measured = false; request(); }).observe(document.body);
  addEventListener('load', () => { measured = false; request(); });
  request();

  /* ---------- La cinta de palabras corre con el scroll: más rápido al bajar, hacia atrás al subir ---------- */
  const track$ = document.querySelector('.ticker-track');
  if (track$ && track$.getAnimations) {
    let lastY = scrollY, lastT = performance.now(), rate = 1, running = false;
    const step = now => {
      const anim = track$.getAnimations()[0];
      if (!anim || still()) { running = false; return; }
      const dt = Math.max(1, now - lastT);
      const v = (scrollY - lastY) / dt; // px por ms
      lastY = scrollY; lastT = now;
      const target = clamp(1 + v * 9, -6, 8);
      rate += (target - rate) * .12;
      if (Math.abs(rate - 1) < .02 && Math.abs(v) < .001) { rate = 1; anim.playbackRate = 1; running = false; return; }
      // Hacia atrás, una animación que llega a 0 termina y se congela: se le da una vuelta de margen
      // (las dos filas son iguales, así que el salto no se nota).
      if (rate < 0) {
        const lap = Number(anim.effect?.getTiming().duration) || 42000;
        if ((anim.currentTime || 0) < lap) anim.currentTime = (anim.currentTime || 0) + lap;
      }
      anim.playbackRate = rate;
      requestAnimationFrame(step);
    };
    addEventListener('scroll', () => {
      if (running || still()) return;
      running = true; lastY = scrollY; lastT = performance.now();
      requestAnimationFrame(step);
    }, { passive: true });
  }
})();
