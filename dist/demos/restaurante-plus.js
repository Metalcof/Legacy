'use strict';
// LUMBRE · módulo de reservas de la página. Sin JavaScript el formulario sigue funcionando:
// envía fecha, turno, personas y zona a la demo de reservas (auto-restaurante.html) por GET.
(() => {
  const form = document.getElementById('lumbre-res-form');
  if (!form) return;
  const dateInput = document.getElementById('lumbre-res-date');
  const dateNote = document.getElementById('lumbre-res-date-note');
  const people = document.getElementById('lumbre-res-people');
  const menu = document.getElementById('lumbre-res-menu');
  const summary = document.getElementById('lumbre-res-summary');
  const stepButtons = [...form.querySelectorAll('[data-step]')];
  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN = 1;
  const MAX = 6;
  const zoneNames = { salon: 'salón', terraza: 'terraza', cualquiera: 'donde haya sitio' };

  const pad = n => String(n).padStart(2, '0');
  const iso = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const fromIso = value => {
    const [y, m, d] = String(value).split('-').map(Number);
    return y && m && d ? new Date(y, m - 1, d, 12) : null;
  };
  const pretty = date => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const first = new Date(today);
  if (first.getDay() === 1) first.setDate(first.getDate() + 1);
  const last = new Date(today);
  last.setDate(last.getDate() + 60);
  dateInput.min = iso(today);
  dateInput.max = iso(last);
  if (!dateInput.value) dateInput.value = iso(first);

  function clampPeople() {
    const value = Math.round(Number(people.value));
    people.value = String(Number.isFinite(value) ? Math.min(MAX, Math.max(MIN, value)) : 2);
  }
  function validateDate() {
    const date = fromIso(dateInput.value);
    let message = '';
    if (!date) message = 'Elige una fecha para tu mesa.';
    else if (dateInput.value < dateInput.min) message = 'Esa fecha ya pasó. Elige hoy o un día próximo.';
    else if (dateInput.value > dateInput.max) message = 'Abrimos reservas con dos meses de anticipación.';
    else if (date.getDay() === 1) message = 'Los lunes LUMBRE descansa. Elige otro día.';
    dateInput.setCustomValidity(message);
    dateNote.textContent = message;
    return !message;
  }
  function render() {
    const count = Number(people.value);
    stepButtons.forEach(button => {
      const step = Number(button.dataset.step);
      button.disabled = step < 0 ? count <= MIN : count >= MAX;
    });
    const date = fromIso(dateInput.value);
    const turn = form.elements.turno.value || '19:00';
    const zone = zoneNames[form.elements.zona.value] || 'salón';
    const parts = [`Mesa para ${count}`];
    if (date && validateDate()) parts.push(pretty(date));
    parts.push(turn, zone);
    if (menu.checked) parts.push('menú del fuego');
    summary.textContent = parts.join(' · ');
  }

  stepButtons.forEach(button => button.addEventListener('click', () => {
    people.value = String(Number(people.value) + Number(button.dataset.step));
    clampPeople();
    render();
  }));
  people.addEventListener('change', () => { clampPeople(); render(); });
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', event => {
    clampPeople();
    if (!validateDate()) {
      event.preventDefault();
      dateInput.focus();
    }
  });

  // Atajos desde el menú del fuego y los eventos privados: llevan al formulario ya preparado.
  document.querySelectorAll('[data-res-preset]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const preset = link.dataset.resPreset;
    if (preset === 'fuego') menu.checked = true;
    if (preset === 'evento') {
      people.value = String(MAX);
    }
    render();
    if (preset === 'evento') summary.textContent = `${summary.textContent} — para más de ${MAX} personas, te escribimos para armar el evento.`;
    form.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
    form.classList.remove('lb-flash');
    void form.offsetWidth;
    form.classList.add('lb-flash');
    window.setTimeout(() => dateInput.focus({ preventScroll: true }), calm() ? 0 : 500);
  }));

  // Marca el día de hoy en el horario.
  const rows = document.querySelectorAll('.lb-hours div');
  const day = today.getDay();
  const index = day === 1 ? 0 : day >= 2 && day <= 4 ? 1 : day === 5 || day === 6 ? 2 : 3;
  if (rows[index]) {
    rows[index].dataset.today = '';
    const label = rows[index].querySelector('dt');
    label.append(document.createTextNode(' · hoy'));
  }

  clampPeople();
  render();
})();
