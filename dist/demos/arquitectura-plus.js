'use strict';
// AURA: índice de proyectos con filtros, galería horizontal, fichas completas, comparador y proceso.
// Se carga después de demos.js; reutiliza su diálogo (#project-dialog) y sus botones [data-project].
(() => {
  const root = document.documentElement;
  root.classList.add('aura-js');
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceQuery.matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const projects = {
    umbral: { no: '01', group: 'Vivienda', title: 'Casa Umbral', image: '../assets/architecture-editorial-small.webp', large: '../assets/architecture-editorial.webp', alt: 'Casa Umbral: volúmenes de concreto y travertino abiertos a un jardín tropical con piscina', description: 'Una casa de fin de semana que se abre por completo hacia el jardín. Dos volúmenes de concreto apoyados sobre un muro de travertino protegen las habitaciones del sol de la tarde, mientras la sala y el comedor quedan bajo un gran alero, sin puertas entre el adentro y el afuera.', location: 'Anapoima, Cundinamarca', area: '420 m² construidos · lote de 2.400 m²', year: '2025', type: 'Vivienda unifamiliar de descanso', materials: 'Concreto a la vista, travertino, teca y vidrio', idea: 'Un umbral habitable entre la casa y el jardín', stage: 'Concepto' },
    patio: { no: '02', group: 'Vivienda y paisaje', title: 'Casa del patio', image: '../assets/case-architecture-patio-small.webp', large: '../assets/case-architecture-patio.webp', alt: 'Patio tropical con un árbol entre volúmenes de concreto, piedra y madera', description: 'Una vivienda de 240 m² que se organiza alrededor de un árbol existente. Las habitaciones miran al patio; los corredores abiertos y las celosías de madera permiten que la sombra y la ventilación formen parte del espacio. La propuesta integra arquitectura, vegetación y una terraza de uso cotidiano.', location: 'Santa Fe de Antioquia', area: '240 m²', year: '2024', type: 'Vivienda unifamiliar + paisaje', materials: 'Travertino, concreto, madera y vidrio', idea: 'El patio como una habitación más', stage: 'Anteproyecto' },
    refugio: { no: '03', group: 'Interiores', title: 'Loft Luz', image: '../assets/case-architecture-loft-small.webp', large: '../assets/case-architecture-loft.webp', alt: 'Loft de doble altura con grandes ventanas industriales, escalera de roble y muebles claros', description: 'Una rehabilitación de 180 m² que reúne vivienda y estudio en una estructura de doble altura. La escalera de roble conecta la zona común con el altillo, mientras las ventanas industriales conservan la amplitud y la entrada de luz del edificio. El trabajo se concentra en distribución, materialidad y mobiliario.', location: 'Chapinero, Bogotá', area: '180 m²', year: '2024', type: 'Rehabilitación de vivienda y estudio', materials: 'Roble, piedra natural y acero', idea: 'Vivir y trabajar en una doble altura', stage: 'Desarrollo de diseño' },
    biblioteca: { no: '04', group: 'Interiores', title: 'Biblioteca del jardín', image: '../assets/interior-editorial-small.webp', large: '../assets/interior-editorial.webp', alt: 'Estudio con mesa de roble, biblioteca de madera y un ventanal de piso a techo hacia el jardín', description: 'Un estudio de lectura y trabajo en una casa existente. Retiramos un muro para abrir un ventanal de piso a techo hacia el jardín y reunimos libros, archivo y almacenamiento en una sola pieza de roble que ocupa toda la pared.', location: 'Ciudad Jardín, Cali', area: '64 m²', year: '2023', type: 'Interiorismo y mobiliario a medida', materials: 'Roble macizo, travertino, yute y lino', idea: 'Una pared que guarda todo para que el jardín sea el protagonista', stage: 'Concepto' },
    pabellon: { no: '05', group: 'Vivienda', title: 'Pabellón Barichara', image: '../assets/auto-arquitectura-small.webp', large: '../assets/auto-arquitectura.webp', alt: 'Maqueta de madera de una casa con patio sobre la mesa del estudio, junto a muestras de piedra y madera', description: 'Una casa pequeña para una pareja que trabaja desde casa. Tres pabellones bajos se reparten alrededor de un patio de piedra local; los muros gruesos guardan el fresco del día y la cubierta de madera se extiende para dar sombra a los corredores.', location: 'Barichara, Santander', area: '160 m²', year: 'En diseño', type: 'Vivienda unifamiliar', materials: 'Tierra compactada, piedra de Barichara y madera', idea: 'Vivir entre pabellones y un patio de piedra', stage: 'Maqueta de estudio' },
    ceibas: { no: '06', group: 'Paisaje', title: 'Jardín Las Ceibas', image: '', large: '', alt: '', description: 'El jardín de una casa existente se rediseña alrededor de una ceiba de más de treinta años. Un sendero de piedra une la terraza con un estanque que recoge el agua lluvia, y las especies nativas reemplazan el césped que exigía riego diario.', location: 'El Poblado, Medellín', area: '1.800 m² de jardín', year: '2025', type: 'Paisajismo residencial', materials: 'Piedra de río, especies nativas y agua lluvia', idea: 'Un jardín que se riega con la lluvia', stage: 'Plan maestro' },
  };
  const order = Object.keys(projects);

  // ——— Ficha de proyecto ———
  const dialog = document.getElementById('project-dialog');
  const sheetImage = document.getElementById('project-image');
  const sheetPlan = document.getElementById('project-plan');
  const planSource = $('.aura-card-plan svg');
  let currentKey = 'patio';

  function fillSheet(key, swap = false) {
    const project = projects[key];
    if (!project) return;
    currentKey = key;
    const set = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
    const apply = () => {
      set('project-index', `Nº ${project.no} · ${project.group}`);
      set('project-title', project.title);
      set('project-description', project.description);
      set('project-location', project.location);
      set('project-area', project.area);
      set('project-year', project.year);
      set('project-type', project.type);
      set('project-materials', project.materials);
      set('project-idea', project.idea);
      set('project-stage', project.stage);
      if (project.image) {
        sheetPlan.hidden = true;
        sheetImage.hidden = false;
        sheetImage.srcset = `${project.image} 800w, ${project.large} 1600w`;
        sheetImage.sizes = '(max-width:1000px) 94vw, 540px';
        sheetImage.src = project.image;
        sheetImage.alt = project.alt;
      } else {
        sheetImage.hidden = true;
        if (!sheetPlan.firstChild && planSource) sheetPlan.append(planSource.cloneNode(true));
        sheetPlan.hidden = false;
      }
    };
    if (!swap || reduced()) { apply(); return; }
    sheetImage.classList.add('is-swapping');
    window.setTimeout(() => { apply(); requestAnimationFrame(() => sheetImage.classList.remove('is-swapping')); }, 180);
  }

  if (dialog) {
    $$('[data-project]').forEach((button) => {
      button.addEventListener('click', () => {
        fillSheet(button.dataset.project);
        if (!dialog.open) dialog.showModal();
      });
    });
    $$('[data-sheet-step]', dialog).forEach((button) => {
      button.addEventListener('click', () => {
        const index = order.indexOf(currentKey);
        const next = order[(index + Number(button.dataset.sheetStep) + order.length) % order.length];
        fillSheet(next, true);
      });
    });
    let closing = false;
    const finish = () => {
      if (!closing) return;
      closing = false;
      dialog.classList.remove('is-closing');
      if (dialog.open) dialog.close();
    };
    dialog.animatedClose = () => {
      if (!dialog.open || closing) return;
      if (reduced()) { dialog.close(); return; }
      closing = true;
      dialog.classList.add('is-closing');
      window.setTimeout(finish, 360);
    };
    dialog.addEventListener('animationend', (event) => { if (event.animationName === 'auraSheetOut') finish(); });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); dialog.animatedClose(); });
  }

  // ——— Filtros y vistas ———
  const filterButtons = $$('[data-aura-filter]');
  const cards = $$('.aura-card');
  const rows = $$('#aura-index li');
  const count = document.getElementById('aura-count');
  const rail = document.getElementById('aura-rail');
  const labels = { todos: '', vivienda: ' de vivienda', interiores: ' de interiores', paisaje: ' de paisaje' };

  function applyFilter(filter) {
    filterButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.auraFilter === filter)));
    const matches = (element) => filter === 'todos' || element.dataset.cat.split(' ').includes(filter);
    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card);
      const wasHidden = card.hidden;
      card.hidden = !show;
      if (show) {
        visible += 1;
        if (wasHidden && !reduced()) {
          card.classList.add('is-entering');
          requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-entering')));
        }
      }
    });
    rows.forEach((row) => { row.hidden = !matches(row); });
    count.textContent = `${visible} ${visible === 1 ? 'proyecto' : 'proyectos'}${labels[filter] || ''}`;
    if (rail) rail.scrollTo({ left: 0, behavior: 'auto' });
    updateRail();
  }
  filterButtons.forEach((button) => button.addEventListener('click', () => applyFilter(button.dataset.auraFilter)));

  $$('[data-aura-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.auraView;
      $$('[data-aura-view]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      $$('[data-aura-panel]').forEach((panel) => { panel.hidden = panel.dataset.auraPanel !== view; });
      updateRail();
    });
  });

  // ——— Galería horizontal ———
  const bar = document.getElementById('aura-rail-bar');
  const prev = $('[data-aura-rail="-1"]');
  const next = $('[data-aura-rail="1"]');
  function updateRail() {
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const ratio = max > 0 ? rail.scrollLeft / max : 1;
    const visibleShare = rail.scrollWidth > 0 ? rail.clientWidth / rail.scrollWidth : 1;
    if (bar) bar.style.transform = `scaleX(${Math.min(1, visibleShare + (1 - visibleShare) * ratio).toFixed(4)})`;
    if (prev) prev.disabled = rail.scrollLeft <= 4;
    if (next) next.disabled = rail.scrollLeft >= max - 4;
  }
  function step(direction) {
    const card = cards.find((element) => !element.hidden);
    if (!card || !rail) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 24;
    rail.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: reduced() ? 'auto' : 'smooth' });
  }
  if (rail) {
    let ticking = false;
    rail.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; updateRail(); });
    }, { passive: true });
    window.addEventListener('resize', updateRail);
    [prev, next].forEach((button) => button && button.addEventListener('click', () => step(Number(button.dataset.auraRail))));

    // Arrastrar con el ratón; en pantallas táctiles el desplazamiento nativo ya funciona.
    let drag = null;
    let suppressClick = false;
    rail.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      drag = { x: event.clientX, left: rail.scrollLeft, moved: false, id: event.pointerId };
    });
    rail.addEventListener('pointermove', (event) => {
      if (!drag) return;
      const delta = event.clientX - drag.x;
      if (!drag.moved && Math.abs(delta) > 6) {
        drag.moved = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture(drag.id);
      }
      if (drag.moved) rail.scrollLeft = drag.left - delta;
    });
    const endDrag = () => {
      if (!drag) return;
      if (drag.moved) {
        suppressClick = true;
        window.setTimeout(() => { suppressClick = false; }, 0);
        const snapFrom = rail.scrollLeft;
        rail.classList.remove('is-dragging');
        rail.scrollLeft = snapFrom;
      }
      drag = null;
    };
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
    rail.addEventListener('click', (event) => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); } }, true);
    rail.addEventListener('dragstart', (event) => event.preventDefault());
    updateRail();
  }

  // ——— Vista previa del índice (sin cursor propio: la imagen vive en su columna) ———
  const previewImage = document.getElementById('aura-preview-img');
  const previewCaption = document.getElementById('aura-preview-caption');
  let previewTimer = 0;
  $$('#aura-index button').forEach((button) => {
    const show = () => {
      $$('#aura-index button').forEach((other) => other.classList.toggle('is-active', other === button));
      const project = projects[button.dataset.project];
      const source = button.dataset.preview === 'plan' ? null : button.dataset.preview;
      if (!previewImage || !project) return;
      previewCaption.textContent = `${project.title} · ${project.location}`;
      const target = source || '';
      if (previewImage.dataset.current === (target || 'plan')) return;
      previewImage.dataset.current = target || 'plan';
      window.clearTimeout(previewTimer);
      previewImage.classList.add('is-swapping');
      previewTimer = window.setTimeout(() => {
        if (target) previewImage.src = target;
        else if (planSource) previewImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(planSource))}`;
        previewImage.classList.remove('is-swapping');
      }, reduced() ? 0 : 160);
    };
    button.addEventListener('pointerenter', show);
    button.addEventListener('focus', show);
  });

  // ——— Revelado de imágenes ———
  const reveals = $$('.aura-reveal');
  if ('IntersectionObserver' in window && !reduced()) {
    // Se observa el contenedor: Chrome descarta la intersección de un elemento recortado por su propio clip-path.
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const figure = entry.target.querySelector(':scope > .aura-reveal');
      if (figure) figure.classList.add('is-in');
      observer.unobserve(entry.target);
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach((element) => observer.observe(element.parentElement));
    window.addEventListener('beforeprint', () => reveals.forEach((element) => element.classList.add('is-in')));
  } else {
    reveals.forEach((element) => element.classList.add('is-in'));
  }

  // ——— Comparador boceto / imagen final ———
  const compare = document.getElementById('aura-compare');
  const range = document.getElementById('aura-compare-range');
  function setPosition(value) {
    const clamped = Math.max(0, Math.min(100, Number(value)));
    compare.style.setProperty('--pos', `${clamped}%`);
    range.setAttribute('aria-valuetext', `${Math.round(clamped)} % boceto, ${Math.round(100 - clamped)} % imagen final`);
  }
  if (compare && range) {
    let userMoved = false;
    range.addEventListener('input', () => { userMoved = true; setPosition(range.value); });
    setPosition(range.value);
    // Una pista breve la primera vez que se ve: la línea se mueve sola y vuelve al centro.
    if ('IntersectionObserver' in window && !reduced()) {
      const hint = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        hint.disconnect();
        const frames = [[0, 50], [700, 32], [1500, 64], [2200, 50]];
        const start = performance.now();
        const tick = (now) => {
          if (userMoved) return;
          const time = now - start;
          let index = frames.findIndex(([at]) => at > time);
          if (index === -1) { setPosition(50); range.value = 50; return; }
          const [t0, v0] = frames[Math.max(0, index - 1)];
          const [t1, v1] = frames[index];
          const progress = (time - t0) / Math.max(1, t1 - t0);
          const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          setPosition(v0 + (v1 - v0) * eased);
          requestAnimationFrame(tick);
        };
        window.setTimeout(() => requestAnimationFrame(tick), 400);
      }, { threshold: 0.55 });
      hint.observe(compare);
    }
  }

  // ——— Proceso: la línea avanza con la lectura ———
  const steps = document.getElementById('aura-steps');
  if (steps) {
    const items = $$('li', steps);
    let pending = false;
    const update = () => {
      pending = false;
      const box = steps.getBoundingClientRect();
      const focus = window.innerHeight * 0.62;
      const progress = Math.max(0, Math.min(1, (focus - box.top) / Math.max(1, box.height)));
      steps.style.setProperty('--aura-progress', progress.toFixed(4));
      items.forEach((item) => item.classList.toggle('is-on', item.getBoundingClientRect().top < focus));
    };
    window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
})();
