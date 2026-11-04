'use strict';
// ALMA: capa propia sobre la agenda compartida de extra.js.
// Añade días rápidos, especialista, tipo de visita, resumen en vivo y completa la confirmación
// con la duración y el valor reales de cada servicio. Todo ocurre en esta página.
(() => {
  const byId = id => document.getElementById(id);
  const form = byId('clinic-form');
  if (!form) return;

  const services = {
    'Primera visita de valoración': { minutes: 45, price: 90000, team: ['Mariana Ortiz', 'Daniel Vélez', 'Julián Restrepo', 'Laura Cifuentes', 'Andrés Mejía'] },
    'Fisioterapia': { minutes: 50, price: 120000, team: ['Mariana Ortiz', 'Daniel Vélez'] },
    'Psicología': { minutes: 50, price: 150000, team: ['Julián Restrepo'] },
    'Nutrición': { minutes: 40, price: 110000, team: ['Laura Cifuentes'] },
    'Masaje terapéutico': { minutes: 60, price: 140000, team: ['Andrés Mejía'] },
    'Sesión de seguimiento': { minutes: 30, price: 80000, team: ['Mariana Ortiz', 'Daniel Vélez', 'Julián Restrepo', 'Laura Cifuentes', 'Andrés Mejía'] }
  };
  const anyone = 'Primer espacio disponible';
  const money = amount => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount).replace(/\s/g, '');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const serviceInput = byId('clinic-service');
  const specialistInput = byId('clinic-specialist');
  const dateInput = byId('clinic-date');
  const times = byId('clinic-times');
  const daysBox = byId('clinic-days');
  const status = byId('clinic-status');
  const details = byId('clinic-details');
  const confirmation = byId('clinic-confirmation');

  // Fechas en hora de Colombia, igual que extra.js.
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const pick = type => Number(parts.find(part => part.type === type).value);
  const todayUTC = Date.UTC(pick('year'), pick('month') - 1, pick('day'));
  const iso = time => new Date(time).toISOString().slice(0, 10);
  const fromIso = value => { const [y, m, d] = value.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = (options, value) => new Intl.DateTimeFormat('es-CO', { timeZone: 'UTC', ...options }).format(fromIso(value));
  const longDay = value => fmt({ weekday: 'long', day: 'numeric', month: 'long' }, value);

  const openDays = [];
  for (let offset = 0; openDays.length < 6 && offset < 10; offset += 1) {
    const time = todayUTC + offset * 86400000;
    if (new Date(time).getUTCDay() !== 0) openDays.push({ value: iso(time), offset });
  }

  function renderChips() {
    daysBox.replaceChildren(...openDays.map(day => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'day-chip';
      button.dataset.day = day.value;
      const label = day.offset === 0 ? 'Hoy' : day.offset === 1 ? 'Mañana' : fmt({ weekday: 'short' }, day.value).replace('.', '');
      const small = document.createElement('small');
      small.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = fmt({ day: 'numeric' }, day.value);
      button.append(small, strong);
      button.setAttribute('aria-label', `${label === 'Hoy' || label === 'Mañana' ? `${label}, ` : ''}${longDay(day.value)}`);
      return button;
    }));
    syncChips();
  }
  function syncChips() {
    daysBox.querySelectorAll('.day-chip').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.day === dateInput.value)));
  }
  daysBox.addEventListener('click', event => {
    const chip = event.target.closest('.day-chip');
    if (!chip) return;
    dateInput.value = chip.dataset.day;
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  function renderSpecialists(preferred) {
    const team = services[serviceInput.value]?.team || [];
    const current = preferred || specialistInput.value;
    const options = (team.length > 1 ? [anyone] : []).concat(team);
    specialistInput.replaceChildren(...options.map(name => new Option(name, name)));
    specialistInput.value = options.includes(current) ? current : options[0];
  }

  const assigned = () => specialistInput.value === anyone ? services[serviceInput.value].team[0] : specialistInput.value;
  const visitType = () => form.querySelector('input[name="visit-type"]:checked')?.value || 'Primera vez';
  const selectedTime = () => times.querySelector('[aria-pressed="true"]')?.dataset.time || '';

  function setText(id, text) {
    const node = byId(id);
    if (node.textContent === text) return;
    node.textContent = text;
    if (!reduced.matches) { node.classList.remove('is-flash'); void node.offsetWidth; node.classList.add('is-flash'); }
  }
  function renderSummary() {
    const service = services[serviceInput.value];
    setText('sum-service', serviceInput.value);
    setText('sum-specialist', specialistInput.value === anyone ? 'Quien tenga el primer espacio' : specialistInput.value);
    setText('sum-day', dateInput.value ? longDay(dateInput.value) : 'Elige un día');
    setText('sum-time', selectedTime() || 'Elige un horario');
    setText('sum-duration', `${service.minutes} minutos`);
    setText('sum-price', money(service.price));
    syncChips();
  }

  // Completa la confirmación que dibuja extra.js con los datos propios de ALMA.
  const meta = new Map();
  function patchConfirmation() {
    const rows = [...details.querySelectorAll(':scope > div')];
    if (!rows.length) return;
    const value = label => rows.find(row => row.querySelector('dt')?.textContent === label)?.querySelector('dd');
    const ref = value('Referencia local')?.textContent;
    if (!ref) return;
    if (!meta.has(ref)) meta.set(ref, { specialist: assigned(), type: visitType() });
    const info = meta.get(ref);
    const serviceName = value('Servicio')?.textContent || '';
    const service = services[serviceName];
    const duration = value('Duración');
    if (duration && service) duration.textContent = `${service.minutes} minutos`;
    const serviceRow = value('Servicio')?.parentElement;
    const add = (label, text, after) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = text;
      row.append(dt, dd);
      after.after(row);
      return row;
    };
    if (serviceRow && !value('Con')) {
      const withRow = add('Con', info.specialist, serviceRow);
      add('Tipo de visita', info.type, withRow);
    }
    if (service && !value('Valor')) add('Valor', money(service.price), details.lastElementChild);
    const day = value('Día')?.textContent;
    const hour = value('Hora de Colombia')?.textContent;
    const name = byId('clinic-name').value.trim() || 'Hola';
    if (day && hour) confirmation.textContent = `${name}, te esperamos el ${day.replace(',', '')} a las ${hour} con ${info.specialist}. Este es un ejemplo: no representa una cita real.`;
  }
  const observer = new MutationObserver(() => {
    observer.disconnect();
    patchConfirmation();
    observer.observe(details, { childList: true });
  });
  observer.observe(details, { childList: true });

  // Eventos
  serviceInput.addEventListener('change', () => { renderSpecialists(); renderSummary(); });
  specialistInput.addEventListener('change', renderSummary);
  dateInput.addEventListener('change', renderSummary);
  form.addEventListener('change', event => { if (event.target.name === 'visit-type') renderSummary(); });
  new MutationObserver(renderSummary).observe(times, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  document.querySelectorAll('[data-clinic-service]').forEach(button => button.addEventListener('click', () => {
    renderSpecialists(button.dataset.almaSpecialist);
    renderSummary();
  }));

  // Arranque: el primer día con atención a partir de mañana.
  renderChips();
  renderSpecialists();
  const firstDay = openDays.find(day => day.offset >= 1) || openDays[0];
  if (firstDay) {
    dateInput.value = firstDay.value;
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    status.textContent = '';
  }
  renderSummary();

  // Próximo espacio libre (ejemplo) en la portada.
  const nextSlot = byId('alma-next-slot');
  if (nextSlot && firstDay) {
    const label = firstDay.offset === 1 ? 'Mañana' : fmt({ weekday: 'long' }, firstDay.value).replace(/^./, char => char.toUpperCase());
    nextSlot.textContent = `${label}, 10:00 · Fisioterapia`;
  }

  // Horario: resalta el día de hoy.
  const weekday = new Date(todayUTC).getUTCDay();
  document.querySelectorAll('.hours tr[data-days]').forEach(row => {
    row.classList.toggle('is-today', row.dataset.days.split(',').map(Number).includes(weekday));
  });
})();
