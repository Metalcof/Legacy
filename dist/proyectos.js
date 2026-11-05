// «Nuestros proyectos»: las tarjetas llegan apiladas y se desapilan al entrar en pantalla.
// Al salir de la pantalla se vuelven a apilar, así la animación se repite. Con movimiento reducido quedan abiertas.
(function () {
  const deck = document.querySelector('[data-pj-deck]');
  if (!deck) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) { deck.classList.add('is-open'); return; }
  deck.classList.add('is-stacked');
  new IntersectionObserver(entries => entries.forEach(entry => {
    deck.classList.toggle('is-open', entry.isIntersecting);
  }), { threshold: 0.35 }).observe(deck);
  // Tocar el mazo apilado también lo abre
  deck.addEventListener('click', event => {
    if (!deck.classList.contains('is-open')) { event.preventDefault(); deck.classList.add('is-open'); }
  });
})();
