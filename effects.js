'use strict';
// Filtro de proyectos por sector: muestra la fila del negocio elegido (su web y su automatización).
(() => {
  const work = document.getElementById('proyectos');
  if (!work) return;
  const filters = [...work.querySelectorAll('[data-sector-filter]')];
  const cases = [...work.querySelectorAll('[data-sector-case]')];
  const summary = work.querySelector('#catalog-summary');

  function selectSector(sector) {
    const selected = filters.find(button => button.dataset.sectorFilter === sector);
    if (!selected) return;
    const all = sector === 'all';
    work.dataset.activeSector = sector;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button === selected)));
    cases.forEach(item => { item.hidden = !all && item.dataset.sectorCase !== sector; });
    // La automatización del mismo sector queda destacada más abajo.
    // La automatización del mismo negocio queda elegida en el selector de más abajo.
    if (!all) window.nexoAutoPicker?.select(sector);
    if (summary) {
      summary.textContent = all
        ? '6 negocios, cada uno con su web y su automatización.'
        : `${selected.textContent.trim()}: su web y su automatización, listas para probar.`;
    }
  }

  filters.forEach(button => button.addEventListener('click', () => selectSector(button.dataset.sectorFilter)));
  work.querySelector('[data-reset-catalog]')?.addEventListener('click', () => {
    selectSector('all');
    work.querySelector('.catalog-filters').scrollIntoView({ behavior: 'auto', block: 'center' });
    filters[0].focus({ preventScroll: true });
  });
})();
