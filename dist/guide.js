'use strict';
// Orientación: selector de automatizaciones y menú que marca en qué sección estás.
(() => {
  /* ---------- Selector de automatizaciones ---------- */
  const picker = document.getElementById('automation-catalog');
  if (picker && picker.classList.contains('auto-picker')) {
    const tabs = [...picker.querySelectorAll('[role="tab"]')];
    const panel = picker.querySelector('.ap-panel');
    const copy = picker.querySelector('[data-ap-copy]');
    const img = picker.querySelector('[data-ap-img]');
    const link = picker.querySelector('[data-ap-link]');
    const url = picker.querySelector('[data-ap-url]');
    const select = (key, focus) => {
      const tab = tabs.find(t => t.dataset.auto === key);
      const tpl = picker.querySelector(`[data-auto-data="${key}"]`);
      if (!tab || !tpl) return;
      tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panel.setAttribute('aria-labelledby', tab.id);
      panel.classList.remove('is-changing'); void panel.offsetWidth; panel.classList.add('is-changing');
      copy.replaceChildren(tpl.content.cloneNode(true));
      img.src = `assets/shots/auto-${key}.webp`;
      img.alt = `Vista de la automatización de ${tab.querySelector('strong').textContent.toLowerCase()}`;
      link.href = `demos/auto-${key}.html`;
      url.textContent = `${tab.querySelector('span').textContent.toLowerCase().replace(/\s+/g, '')} · automatización`;
      if (focus) tab.focus();
    };
    tabs.forEach(tab => tab.addEventListener('click', () => select(tab.dataset.auto)));
    picker.querySelector('.ap-tabs').addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
      select(tabs[(i + step + tabs.length) % tabs.length].dataset.auto, true);
    });
    select(tabs[0].dataset.auto);
    window.nexoAutoPicker = { select };
  }

  /* ---------- Menú y índice lateral que marcan la sección actual ---------- */
  const spies = [...document.querySelectorAll('[data-spy]')];
  const ids = [...new Set(spies.map(a => a.dataset.spy))];
  // En el orden en que aparecen en la página, no en el del menú.
  const sections = ids.map(id => document.getElementById(id)).filter(Boolean)
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  if (!sections.length) return;
  let current = '';
  const mark = id => {
    if (id === current) return;
    current = id;
    spies.forEach(a => {
      const on = a.dataset.spy === id;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  const update = () => {
    ticking = false;
    const line = innerHeight * .35;
    let found = '';
    // Secciones que no están en la lista (por ejemplo, los videos) cuentan como la anterior.
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) found = section.id;
    }
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) found = sections.at(-1).id;
    mark(found);
    document.documentElement.classList.toggle('past-hero', scrollY > innerHeight * .6);
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
})();

// Formación: los módulos de la plataforma se filtran por área.
(() => {
  const tabs = [...document.querySelectorAll('[data-fm-group]')];
  const items = [...document.querySelectorAll('[data-fm-in]')];
  if (!tabs.length) return;
  const select = (key, focus) => {
    tabs.forEach(t => { const on = t.dataset.fmGroup === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    items.forEach(li => {
      const show = key === 'all' || li.dataset.fmIn === key;
      li.hidden = !show;
      li.classList.remove('is-in');
      if (show) { void li.offsetWidth; li.classList.add('is-in'); }
    });
  };
  tabs.forEach(t => t.addEventListener('click', () => select(t.dataset.fmGroup)));
  tabs[0].parentElement.addEventListener('keydown', event => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    select(tabs[(i + step + tabs.length) % tabs.length].dataset.fmGroup, true);
  });
})();
