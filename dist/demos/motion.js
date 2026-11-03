'use strict';
// Movimiento compartido por las demos: revelado suave al hacer scroll y respuesta al toque en botones.
// No oculta lo que ya se ve al cargar y no hace nada si el sistema pide reducir movimiento.
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const style = document.createElement('style');
  style.textContent = `
    .dm-reveal{transition:opacity .8s cubic-bezier(.2,.7,0,1) var(--dm-d,0ms),transform .8s cubic-bezier(.2,.7,0,1) var(--dm-d,0ms)}
    .dm-reveal:not(.dm-in){opacity:0;transform:translateY(26px)}
    button,a[class*="button"],a[class*="btn"]{transition-property:background-color,color,border-color,box-shadow,opacity,scale;transition-duration:.15s}
    button:active:not(:disabled),a[class*="button"]:active,a[class*="btn"]:active{scale:.97}
  `;
  document.head.append(style);

  const fold = window.innerHeight;
  const candidates = [...document.querySelectorAll('main section > *, main > section > * > *, footer > *')]
    .filter(el => !el.closest('[role="dialog"], dialog, header, nav') && el.getBoundingClientRect().top > fold && el.offsetHeight > 0 && el.offsetHeight < fold * 1.5);
  // Solo el nivel más alto de cada rama, para no animar lo mismo dos veces.
  const targets = candidates.filter(el => !candidates.some(other => other !== el && other.contains(el)));
  const counts = new Map();
  targets.forEach(el => {
    const index = counts.get(el.parentElement) || 0;
    counts.set(el.parentElement, index + 1);
    el.style.setProperty('--dm-d', `${Math.min(index, 4) * 80}ms`);
    el.classList.add('dm-reveal');
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('dm-in');
    observer.unobserve(entry.target);
  }), { rootMargin: '0px 0px -6% 0px', threshold: .08 });
  targets.forEach(el => observer.observe(el));
  // Si algo queda fuera del observador (por ejemplo, al imprimir), se muestra igual.
  window.addEventListener('beforeprint', () => targets.forEach(el => el.classList.add('dm-in')));
})();
