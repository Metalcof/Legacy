'use strict';
// Maré: horario en vivo, selector de orígenes y temporizador de extracción.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Horario: una sola fuente para el indicador y la tabla ---------- */
  // Índice por día de la semana (0 = domingo). Horas en minutos desde medianoche.
  const weekday = { open: 8 * 60, close: 19 * 60 };
  const weekend = { open: 9 * 60, close: 18 * 60 };
  const hoursFor = (day) => (day === 0 || day === 6 ? weekend : weekday);
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const clock = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  function openStatus(now = new Date()) {
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = hoursFor(day);
    if (minutes < today.open) return { state: 'closed', text: `Cerrado ahora · abrimos hoy a las ${clock(today.open)}` };
    if (minutes >= today.close) {
      const next = (day + 1) % 7;
      return { state: 'closed', text: `Cerrado ahora · abrimos mañana, ${dayNames[next]}, a las ${clock(hoursFor(next).open)}` };
    }
    const left = today.close - minutes;
    if (left <= 45) return { state: 'soon', text: `Cerramos pronto · a las ${clock(today.close)}` };
    return { state: 'open', text: `Abierto ahora · cierra a las ${clock(today.close)}` };
  }
  function renderStatus() {
    const now = new Date();
    const status = openStatus(now);
    document.querySelectorAll('[data-open-status]').forEach((element) => {
      element.dataset.state = status.state;
      const text = element.querySelector('[data-open-text]');
      if (text) text.textContent = status.text;
    });
    document.querySelectorAll('[data-hours-days]').forEach((row) => {
      row.classList.toggle('is-today', row.dataset.hoursDays.split(',').map(Number).includes(now.getDay()));
    });
  }
  renderStatus();
  window.setInterval(renderStatus, 30000);

  /* ---------- Orígenes ---------- */
  const origins = {
    huila: { farm: 'Finca La Esperanza', place: 'Pitalito, Huila', producer: 'Familia Cerquera', altitude: 1750, story: 'Cuatro hectáreas entre guamos y plátano. La cosecha se recoge a mano, pasada tras pasada, solo cuando la cereza está bien roja.', variety: 'Caturra y Castillo', process: 'Lavado', use: 'Espresso de la casa', notes: ['Panela', 'Mandarina', 'Cacao'], acidity: 3, sweetness: 4, body: 4 },
    narino: { farm: 'Finca El Mirador', place: 'La Unión, Nariño', producer: 'Familia Rosero', altitude: 2050, story: 'Una de las fincas más altas con las que trabajamos. Las noches frías hacen que el grano madure lento y gane una acidez brillante.', variety: 'Castillo', process: 'Honey', use: 'Filtro del día (V60)', notes: ['Frambuesa', 'Miel', 'Té negro'], acidity: 5, sweetness: 4, body: 2 },
    sierra: { farm: 'Finca Las Nubes', place: 'Minca, Magdalena', producer: 'Familia Ospino', altitude: 1400, story: 'Café de sombra cerca del mar. Lo secan entero, con la fruta, durante tres semanas: de ahí su dulzor de fruta madura.', variety: 'Típica', process: 'Natural', use: 'Cold brew y bebidas frías', notes: ['Ciruela', 'Chocolate oscuro', 'Nuez'], acidity: 2, sweetness: 4, body: 5 },
  };
  const panel = document.getElementById('origin-panel');
  const originTabs = [...document.querySelectorAll('[data-origin]')];
  const formatAltitude = (meters) => `${new Intl.NumberFormat('es-CO').format(meters)} m s. n. m.`;
  // La línea de altura se mueve dentro del dibujo: 1.400 m abajo, 2.050 m arriba.
  const altitudeOffset = (meters) => Math.round(((1750 - meters) / 650) * 120);

  function showOrigin(key, focus = false) {
    const origin = origins[key];
    if (!origin || !panel) return;
    originTabs.forEach((tab) => {
      const selected = tab.dataset.origin === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) { panel.setAttribute('aria-labelledby', tab.id); if (focus) tab.focus(); }
    });
    const fields = { ...origin, altitude: formatAltitude(origin.altitude) };
    panel.querySelectorAll('[data-origin-field]').forEach((element) => { element.textContent = fields[element.dataset.originField]; });
    const notes = panel.querySelector('[data-origin-notes]');
    notes.replaceChildren(...origin.notes.map((note) => Object.assign(document.createElement('li'), { textContent: note })));
    ['acidity', 'sweetness', 'body'].forEach((meter) => {
      panel.querySelector(`[data-meter="${meter}"]`).style.setProperty('--v', String(origin[meter] / 5));
      panel.querySelector(`[data-meter-value="${meter}"]`).textContent = `${origin[meter]}/5`;
    });
    panel.querySelector('[data-origin-marker]').style.setProperty('--alt-y', `${altitudeOffset(origin.altitude)}px`);
    panel.classList.remove('is-swapping');
    void panel.offsetWidth;
    panel.classList.add('is-swapping');
  }
  originTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showOrigin(tab.dataset.origin));
    tab.addEventListener('keydown', (event) => {
      const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -index, End: originTabs.length - 1 - index };
      if (!(event.key in moves)) return;
      event.preventDefault();
      const next = originTabs[(index + moves[event.key] + originTabs.length) % originTabs.length];
      showOrigin(next.dataset.origin, true);
    });
  });

  /* ---------- Temporizador de extracción ---------- */
  const timer = document.querySelector('[data-shot-timer]');
  const ring = document.querySelector('.mar-timer-ring');
  if (timer && ring && !reduceMotion.matches && 'IntersectionObserver' in window) {
    const runShot = () => {
      const duration = 2800; // 28 s comprimidos en 2,8 s
      const start = performance.now();
      const step = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        timer.textContent = String(Math.round(progress * 28));
        ring.style.strokeDashoffset = String(100 - progress * 100);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    timer.textContent = '0';
    ring.style.strokeDashoffset = '100';
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      runShot();
    }, { threshold: 0.5 });
    observer.observe(timer.closest('figure'));
  }
})();
