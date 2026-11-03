'use strict';
// Detalles de webs premiadas: portátil que gira con el scroll, brillo que sigue al mouse,
// inclinación 3D, botones magnéticos y títulos que se revelan por máscara.
// Todo se desactiva con "reducir movimiento", en pantallas táctiles o con el botón de pausa.
(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const still = () => reduced.matches || document.body.classList.contains('motion-paused');

  /* ---------- 1. El portátil se endereza al hacer scroll (como en Apple) ---------- */
  const devices = document.querySelector('.stage-devices');
  if (devices) {
    let ticking = false;
    const update = () => {
      ticking = false;
      if (still()) { devices.style.removeProperty('--tilt'); return; }
      const r = devices.getBoundingClientRect();
      // 0 cuando la parte de arriba está abajo de la pantalla, 1 cuando el escenario llega al centro.
      const t = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .75)));
      devices.style.setProperty('--tilt', (1 - t).toFixed(3));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* ---------- 2. Brillo que sigue al mouse e inclinación 3D en tarjetas ---------- */
  const glowTargets = '.gain, .auto-card, .bento-tile, .stage-tab, .diag-item, .proposal-demo-list a, .lab-controls, .team-card, .case-screen';
  const tiltTargets = '.gain, .auto-card, .bento-tile';
  if (fine.matches) {
    document.querySelectorAll(glowTargets).forEach(el => el.classList.add('has-glow'));
    document.addEventListener('pointermove', event => {
      const card = event.target instanceof Element && event.target.closest('.has-glow');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - r.left}px`);
      card.style.setProperty('--my', `${event.clientY - r.top}px`);
      if (!still() && card.matches(tiltTargets)) {
        const rx = ((event.clientY - r.top) / r.height - .5) * -6;
        const ry = ((event.clientX - r.left) / r.width - .5) * 8;
        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      }
    }, { passive: true });
    document.addEventListener('pointerout', event => {
      const card = event.target instanceof Element && event.target.closest('.has-glow');
      if (card && !card.contains(event.relatedTarget)) { card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); }
    });
  }

  /* ---------- 3. Botones magnéticos ---------- */
  if (fine.matches) {
    const magnets = document.querySelectorAll('.button-accent, .button-ghost, .scene-play, .tour-launch-btn, .whatsapp-float');
    magnets.forEach(el => {
      el.classList.add('is-magnetic');
      el.addEventListener('pointermove', event => {
        if (still()) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--px', `${((event.clientX - r.left) / r.width - .5) * 10}px`);
        el.style.setProperty('--py', `${((event.clientY - r.top) / r.height - .5) * 8}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--px'); el.style.removeProperty('--py'); });
    });

  }

  /* ---------- Las animaciones en bucle solo corren en la sección visible ---------- */
  if ('IntersectionObserver' in window) {
    const sections = document.querySelectorAll('main > section');
    const seen = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)), { rootMargin: '120px 0px' });
    sections.forEach(section => seen.observe(section));
  } else document.querySelectorAll('main > section').forEach(section => section.classList.add('in-view'));

  /* ---------- 4. Títulos que suben desde una máscara, palabra por palabra ---------- */
  if (!still() && 'IntersectionObserver' in window) {
    const titles = document.querySelectorAll('.work-head h2, .auto-copy h2, .reel-copy h2, .lab-head h2, .faq-intro h2, .contact h2, #journey-heading');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }), { threshold: .3 });
    titles.forEach(title => {
      const text = title.textContent.trim();
      title.setAttribute('aria-label', text);
      title.textContent = '';
      text.split(/\s+/).forEach((word, i, all) => {
        const mask = document.createElement('span');
        mask.className = 'mask-word';
        mask.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.textContent = word;
        inner.style.setProperty('--w', i);
        mask.append(inner);
        title.append(mask, i < all.length - 1 ? ' ' : '');
      });
      title.classList.add('mask-title');
      observer.observe(title);
    });
  }
})();
