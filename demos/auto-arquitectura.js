'use strict';
// AURA · solicitudes de proyecto: solicitud guiada → brief → pipeline → visita → confirmación.
// Todo es de ejemplo: los mensajes solo se dibujan en pantalla y el estado vive en este navegador.
(() => {
  const STORAGE_KEY = 'nexo-auto-arquitectura-v1';
  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => reduceQuery.matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  // Marca del estudio que firma el concepto.
  const studioName = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Nexo Studio';
  $$('[data-brand]').forEach((element) => { element.textContent = studioName; });
  document.title = document.title.replace('Nexo Studio', studioName);

  // ——— Datos del dominio ———
  const STAGES = [
    { name: 'Solicitud', hint: 'Nueva, por leer' },
    { name: 'Brief', hint: 'Pidiendo lo que falta' },
    { name: 'Visita', hint: 'Visita agendada' },
    { name: 'Propuesta', hint: 'Honorarios enviados' },
    { name: 'Diseño', hint: 'Proyecto en marcha' },
  ];
  const TYPES = {
    casa: { label: 'Casa nueva', owner: 'Mariana Restrepo', role: 'vivienda', area: 180, ref: [3.2, 6.5] },
    reforma: { label: 'Reforma', owner: 'Tomás Londoño', role: 'rehabilitación', area: 120, ref: [1.8, 4] },
    interior: { label: 'Interiores', owner: 'Tomás Londoño', role: 'interiores', area: 80, ref: [1.2, 3.5] },
    paisaje: { label: 'Paisaje', owner: 'Inés Cárdenas', role: 'paisaje', area: 600, ref: [0.15, 0.8] },
  };
  const BUDGETS = {
    b1: { label: 'Hasta $150 M', mid: 100 },
    b2: { label: '$150 a 400 M', mid: 275 },
    b3: { label: '$400 a 900 M', mid: 650 },
    b4: { label: 'Más de $900 M', mid: 1200 },
    b5: { label: 'Aún no lo sé', mid: 0 },
  };
  const TIMES = { t1: 'Lo antes posible', t2: 'En 3 a 6 meses', t3: 'En 6 a 12 meses', t4: 'Sin fecha todavía' };
  const STYLES = {
    tropical: { label: 'Tropical abierto', img: '../assets/case-architecture-patio-small.webp' },
    calido: { label: 'Cálido y natural', img: '../assets/interior-editorial-small.webp' },
    concreto: { label: 'Concreto y vidrio', img: '../assets/architecture-editorial-small.webp' },
    industrial: { label: 'Industrial luminoso', img: '../assets/case-architecture-loft-small.webp' },
  };
  const DOCS = { fotos: 'Fotos del lugar', planos: 'Planos actuales', topo: 'Levantamiento topográfico', tradicion: 'Certificado de tradición' };
  const LOTS = { si: 'Lote o inmueble propio', proceso: 'En proceso de compra', no: 'Aún buscando el lote' };
  const HOURS = ['08:30', '11:00', '15:00'];

  // ——— Fechas ———
  const pad = (number) => String(number).padStart(2, '0');
  const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const parseDate = (value) => { const [y, m, d] = value.split('-').map(Number); return new Date(y, m - 1, d); };
  const shortDay = (value) => new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).format(parseDate(value)).replace(/\./g, '');
  const longDay = (value) => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDate(value));
  const clock = (ms) => new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms));
  const todayIso = () => isoDate(new Date());
  const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);
  function businessDays(count) {
    const days = [];
    const cursor = new Date();
    while (days.length < count) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0) days.push(isoDate(cursor));
    }
    return days;
  }
  function dayBefore(value) { const date = parseDate(value); date.setDate(date.getDate() - 1); return isoDate(date); }
  const money = (millions) => `$${new Intl.NumberFormat('es-CO').format(Math.round(millions))} M`;
  const firstName = (name) => String(name).trim().split(/\s+/)[0] || name;
  const initials = (name) => name.split(' ').map((part) => part[0]).join('').slice(0, 2);

  // ——— Brief ———
  function buildChecklist(request) {
    const items = [
      { k: 'basico', label: 'Tipo, área y ubicación', done: true },
      { k: 'presupuesto', label: 'Rango de presupuesto', done: request.budget !== 'b5' },
      { k: 'estilo', label: 'Referencias de estilo', done: request.styles.length > 0 },
      { k: 'fotos', label: 'Fotos del lugar', done: request.docs.includes('fotos') },
    ];
    if (request.type === 'casa' || request.type === 'paisaje') {
      if (request.lot === 'si') {
        items.push({ k: 'topo', label: 'Levantamiento topográfico', done: request.docs.includes('topo') });
        items.push({ k: 'tradicion', label: 'Certificado de tradición y libertad', done: request.docs.includes('tradicion') });
      } else {
        items.push({ k: 'lote', label: 'Confirmar el lote', done: false });
      }
      if (request.type === 'casa') items.push({ k: 'norma', label: 'Norma urbanística del lote', done: false });
    } else {
      items.push({ k: 'planos', label: 'Planos actuales del inmueble', done: request.docs.includes('planos') });
      items.push({ k: 'copropiedad', label: 'Reglamento de copropiedad, si aplica', done: false });
    }
    return items;
  }
  const missing = (request) => request.checks.filter((item) => !item.done);
  function ratio(request) {
    const budget = BUDGETS[request.budget].mid;
    if (!budget) return null;
    const perM2 = budget / request.area;
    const [low, high] = TYPES[request.type].ref;
    const verdict = perM2 < low ? { text: 'Ajustado', tone: 'low', note: 'Conviene hablar de alcance en la visita.' } : perM2 > high ? { text: 'Holgado', tone: 'high', note: 'Hay margen para acabados o paisaje.' } : { text: 'Coherente', tone: 'ok', note: 'Va en línea con el área pedida.' };
    return { perM2, verdict };
  }
  const formatPerM2 = (value) => (value >= 1 ? `$${value.toLocaleString('es-CO', { maximumFractionDigits: 1 })} M` : `$${Math.round(value * 1000).toLocaleString('es-CO')} mil`);

  // ——— Estado ———
  function seed() {
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const ago = (hours) => {
      const date = new Date(Math.max(monthStart + 9 * 3600e3, now - hours * 3600e3));
      if (date.getTime() < now - 3600e3 && (date.getHours() < 8 || date.getHours() > 18)) date.setHours(8 + (Math.round(hours * 7) % 10), Math.round(hours * 37) % 60);
      return Math.min(date.getTime(), now);
    };
    const past = new Date(); past.setDate(past.getDate() - 9);
    const firstSlot = businessDays(1)[0];
    const make = (data) => {
      const request = { email: '', note: '', visit: null, ...data };
      request.checks = buildChecklist(request);
      (data.extraDone || []).forEach((key) => { const item = request.checks.find((check) => check.k === key); if (item) item.done = true; });
      delete request.extraDone;
      return request;
    };
    const requests = [
      make({ id: 'A-0209', name: 'Camila y Jorge Uribe', phone: '310 555 0187', type: 'casa', area: 260, city: 'La Calera, Cundinamarca', lot: 'si', budget: 'b3', timeline: 't2', styles: ['concreto', 'tropical'], docs: ['fotos', 'topo', 'tradicion'], note: 'Lote en pendiente con vista a la sabana.', stage: 4, visit: { date: isoDate(past), time: '11:00' }, created: ago(70), extraDone: ['norma'] }),
      make({ id: 'A-0210', name: 'Familia Ospina', phone: '315 555 0122', type: 'reforma', area: 140, city: 'Laureles, Medellín', lot: 'si', budget: 'b2', timeline: 't1', styles: ['calido'], docs: ['fotos', 'planos'], note: 'Queremos abrir la cocina al patio.', stage: 3, visit: { date: isoDate(past), time: '15:00' }, created: ago(52) }),
      make({ id: 'A-0211', name: 'Daniela Herrera', phone: '301 555 0164', type: 'interior', area: 85, city: 'Chapinero, Bogotá', lot: 'si', budget: 'b1', timeline: 't1', styles: ['industrial'], docs: ['fotos'], note: 'Apartamento de los años setenta, mucha luz.', stage: 2, visit: { date: firstSlot, time: '11:00' }, created: ago(30) }),
      make({ id: 'A-0212', name: 'Andrés Quintero', phone: '312 555 0109', type: 'paisaje', area: 900, city: 'Rionegro, Antioquia', lot: 'si', budget: 'b2', timeline: 't3', styles: ['tropical'], docs: [], note: '', stage: 1, created: ago(9) }),
      make({ id: 'A-0213', name: 'Sofía Martínez', phone: '318 555 0150', type: 'casa', area: 180, city: 'Barichara, Santander', lot: 'no', budget: 'b5', timeline: 't4', styles: [], docs: [], note: 'Todavía estamos mirando lotes.', stage: 0, created: ago(2) }),
    ];
    const log = [
      { t: ago(52), kind: 'auto', text: 'Propuesta de honorarios enviada a Familia Ospina' },
      { t: ago(30), kind: 'auto', text: 'Visita de Daniela Herrera confirmada por WhatsApp' },
      { t: ago(9), kind: 'auto', text: 'Brief A-0212 generado · faltan 4 datos' },
      { t: ago(8.5), kind: 'team', text: 'Inés pidió fotos del jardín a Andrés Quintero' },
      { t: ago(2), kind: 'auto', text: 'Solicitud recibida de Sofía Martínez · casa nueva en Barichara' },
    ];
    const messages = [
      { req: 'A-0211', channel: 'whatsapp', t: ago(30), text: `Listo, Daniela. Visita confirmada el ${longDay(firstSlot)} a las 11:00 en Chapinero, Bogotá. Irá Tomás Londoño.` },
      { req: 'A-0212', channel: 'whatsapp', t: ago(9), text: 'Hola, Andrés. Recibimos tu proyecto de paisaje en Rionegro. Para avanzar, elige el día de la visita en el enlace.' },
      { req: 'A-0213', channel: 'whatsapp', t: ago(2), text: 'Hola, Sofía. Recibimos tu proyecto de casa nueva en Barichara. Para avanzar, elige el día de la visita en el enlace.' },
      { req: 'A-0210', channel: 'email', t: ago(52), subject: 'Propuesta de honorarios · A-0210', text: 'Adjuntamos la propuesta con etapas, entregables y plazos. Podemos revisarla juntos cuando quieran.' },
    ];
    return { version: 1, counter: 213, requests, log, messages, selected: 'A-0213', view: 'cliente', clientReq: null, clientPanel: 'form', map: 0 };
  }

  function validRequest(request) {
    const int = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    const str = (value, max) => typeof value === 'string' && value.length <= max;
    return request && typeof request === 'object'
      && /^A-\d{4}$/.test(request.id) && str(request.name, 60) && request.name.trim() && str(request.phone, 18) && str(request.email, 80) && str(request.note, 300)
      && TYPES[request.type] && int(request.area, 20, 5000) && str(request.city, 60) && LOTS[request.lot] && BUDGETS[request.budget] && TIMES[request.timeline]
      && Array.isArray(request.styles) && request.styles.length <= 2 && request.styles.every((key) => STYLES[key])
      && Array.isArray(request.docs) && request.docs.every((key) => DOCS[key])
      && int(request.stage, 0, 4) && Number.isFinite(request.created)
      && Array.isArray(request.checks) && request.checks.length <= 10 && request.checks.every((item) => item && str(item.k, 20) && str(item.label, 60) && typeof item.done === 'boolean')
      && (request.visit === null || (request.visit && /^\d{4}-\d{2}-\d{2}$/.test(request.visit.date) && HOURS.includes(request.visit.time)));
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!saved || saved.version !== 1 || !Array.isArray(saved.requests) || saved.requests.length > 60 || !saved.requests.every(validRequest)) return seed();
      if (!Array.isArray(saved.log) || !Array.isArray(saved.messages) || !Number.isInteger(saved.counter)) return seed();
      saved.log = saved.log.filter((entry) => entry && typeof entry.text === 'string' && Number.isFinite(entry.t)).slice(-60);
      saved.messages = saved.messages.filter((message) => message && typeof message.text === 'string' && ['whatsapp', 'email'].includes(message.channel)).slice(-80);
      saved.view = saved.view === 'estudio' ? 'estudio' : 'cliente';
      saved.clientPanel = saved.clientPanel === 'done' ? 'done' : 'form';
      if (!saved.requests.some((request) => request.id === saved.clientReq)) { saved.clientReq = null; saved.clientPanel = 'form'; }
      if (!saved.requests.some((request) => request.id === saved.selected)) saved.selected = saved.requests[0] ? saved.requests[0].id : null;
      saved.map = Number.isInteger(saved.map) ? Math.max(0, Math.min(5, saved.map)) : 0;
      return saved;
    } catch (_) { return seed(); }
  }
  let state = load();
  const save = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Sin almacenamiento, el ejemplo sigue funcionando en memoria. */ } };
  const find = (id) => state.requests.find((request) => request.id === id);

  // ——— Utilidades de interfaz ———
  const toastEl = document.getElementById('aa-toast');
  let toastTimer = 0;
  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 3400);
  }
  function logEvent(text, kind = 'auto') {
    state.log.push({ t: Date.now(), kind, text });
    state.log = state.log.slice(-60);
    save();
    renderTimeline(true);
  }
  function addMessage(message) {
    state.messages.push({ t: Date.now(), ...message });
    state.messages = state.messages.slice(-80);
    save();
  }
  const scrollToEl = (element, block = 'start') => element && element.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block });

  // ——— Línea de tiempo ———
  const timeline = document.getElementById('aa-timeline');
  function renderTimeline(animateFirst = false) {
    const today = todayIso();
    timeline.innerHTML = state.log.slice().reverse().slice(0, 24).map((entry, index) => {
      const when = isoDate(new Date(entry.t)) === today ? `Hoy · ${clock(entry.t)}` : `${cap(shortDay(isoDate(new Date(entry.t))))} · ${clock(entry.t)}`;
      return `<li class="is-${entry.kind === 'team' ? 'team' : 'auto'}${animateFirst && index === 0 ? ' is-new' : ''}"><time>${esc(when)}</time><p>${esc(entry.text)}</p></li>`;
    }).join('');
  }

  // ——— Mapa del recorrido ———
  function renderMap() {
    $$('#aa-map li').forEach((item, index) => item.classList.toggle('is-on', index < state.map));
  }
  function setMap(level) { state.map = Math.max(state.map, level); save(); renderMap(); }

  // ——— Teléfono del cliente ———
  let channel = 'whatsapp';
  const phoneBody = document.getElementById('aa-phone-body');
  function renderPhone({ typing = false, animateLast = false } = {}) {
    const request = state.clientReq ? find(state.clientReq) : null;
    document.getElementById('aa-phone-sub').textContent = request ? `Para ${request.name}` : 'Cuenta de empresa';
    if (!request) {
      phoneBody.innerHTML = `<div class="aa-phone-empty"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 12h32v20H20l-8 7v-7H8z"/></svg><p>Cuando envíes la solicitud, aquí verás lo que le llega al cliente.</p></div>`;
      return;
    }
    const list = state.messages.filter((message) => message.req === request.id && message.channel === channel);
    if (!list.length) {
      phoneBody.innerHTML = `<div class="aa-phone-empty"><p>${channel === 'email' ? (request.email ? 'Todavía no hay correos para este proyecto.' : 'El cliente no dejó correo: todo llega por WhatsApp.') : 'Todavía no hay mensajes.'}</p></div>`;
    } else if (channel === 'whatsapp') {
      phoneBody.innerHTML = `<p class="aa-chat-day">Hoy</p>${list.map((message, index) => message.scheduled
        ? `<p class="aa-chat-note${animateLast && index === list.length - 1 ? ' is-new' : ''}">${esc(message.text)}</p>`
        : `<div class="aa-bubble${animateLast && index === list.length - 1 ? ' is-new' : ''}"><p>${esc(message.text)}${message.link ? `<span class="aa-bubble-link">${esc(message.link)}</span>` : ''}</p><time>${clock(message.t)}</time></div>`).join('')}`;
    } else {
      phoneBody.innerHTML = list.map((message, index) => `<div class="aa-mail${animateLast && index === list.length - 1 ? ' is-new' : ''}"><small>De: AURA Estudio · ${clock(message.t)}</small><strong>${esc(message.subject || 'Mensaje de AURA')}</strong><p>${esc(message.text)}</p>${message.attachment ? `<span class="aa-attach">${esc(message.attachment)}</span>` : ''}</div>`).join('');
    }
    if (typing) phoneBody.insertAdjacentHTML('beforeend', '<div class="aa-typing" aria-label="AURA está escribiendo"><i></i><i></i><i></i></div>');
    phoneBody.scrollTop = phoneBody.scrollHeight;
  }
  $$('[data-channel]').forEach((button) => button.addEventListener('click', () => {
    channel = button.dataset.channel;
    $$('[data-channel]').forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
    renderPhone();
  }));

  // ——— Horarios de visita ———
  function takenSlots(exceptId) {
    const taken = new Set(state.requests.filter((request) => request.visit && request.id !== exceptId).map((request) => `${request.visit.date} ${request.visit.time}`));
    businessDays(6).forEach((day, dayIndex) => HOURS.forEach((hour, hourIndex) => { if ((dayIndex * 3 + hourIndex) % 4 === 1) taken.add(`${day} ${hour}`); }));
    return taken;
  }
  function renderSlots(container, exceptId, selected) {
    const taken = takenSlots(exceptId);
    container.innerHTML = businessDays(6).map((day) => `<div class="aa-slot-day"><p>${esc(cap(shortDay(day)))}</p>${HOURS.map((hour) => {
      const key = `${day} ${hour}`;
      const busy = taken.has(key);
      return `<button type="button" class="aa-slot" data-slot="${key}" aria-pressed="${selected === key}" ${busy ? 'disabled aria-label="' + esc(`${longDay(day)}, ${hour}, ocupado`) + '"' : 'aria-label="' + esc(`${longDay(day)}, ${hour}`) + '"'}>${busy ? '<s>' + hour + '</s>' : hour}</button>`;
    }).join('')}</div>`).join('');
  }
  function bindSlots(container, onPick) {
    container.addEventListener('click', (event) => {
      const button = event.target.closest('[data-slot]');
      if (!button || button.disabled) return;
      $$('[data-slot]', container).forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      onPick(button.dataset.slot);
    });
  }

  function scheduleVisit(request, slot, by) {
    const [date, time] = slot.split(' ');
    request.visit = { date, time };
    request.stage = Math.max(request.stage, 2);
    const owner = TYPES[request.type].owner;
    const pending = missing(request).slice(0, 2).map((item) => item.label.toLowerCase());
    addMessage({ req: request.id, channel: 'whatsapp', text: `Listo, ${firstName(request.name)}. Visita confirmada el ${longDay(date)} a las ${time} en ${request.city}. Irá ${owner}.${pending.length ? ` Si puedes, ten a mano: ${pending.join(' y ')}.` : ''}` });
    addMessage({ req: request.id, channel: 'whatsapp', scheduled: true, text: `Recordatorio programado · se enviará el ${longDay(dayBefore(date))} a las 9:00` });
    if (request.email) addMessage({ req: request.id, channel: 'email', subject: `Visita confirmada · ${request.id}`, text: `${longDay(date)} a las ${time}. Te enviamos la invitación para tu calendario.`, attachment: 'invitacion-visita.ics' });
    logEvent(by === 'team' ? `Tu equipo agendó la visita de ${request.name} · ${shortDay(date)}, ${time}` : `${request.name} eligió su visita · ${shortDay(date)}, ${time}`, by === 'team' ? 'team' : 'auto');
    logEvent(`Confirmación por WhatsApp enviada a ${request.name}`);
    logEvent(`Visita añadida al calendario de ${owner}`);
    save();
  }

  // ——— Formulario guiado ———
  const form = document.getElementById('aa-form');
  const steps = $$('.aa-step', form);
  const nextButton = document.getElementById('aa-next');
  const backButton = document.getElementById('aa-back');
  const areaRange = document.getElementById('aa-area-range');
  const areaInput = document.getElementById('aa-area');
  let step = 1;

  document.getElementById('aa-budget-chips').innerHTML = Object.entries(BUDGETS).map(([key, budget]) => `<label class="aa-chip"><input type="radio" name="budget" value="${key}"><span>${esc(budget.label)}</span></label>`).join('');
  document.getElementById('aa-time-chips').innerHTML = Object.entries(TIMES).map(([key, label]) => `<label class="aa-chip"><input type="radio" name="timeline" value="${key}"><span>${esc(label)}</span></label>`).join('');
  document.getElementById('aa-styles').innerHTML = Object.entries(STYLES).map(([key, style]) => `<label class="aa-style"><input type="checkbox" name="styles" value="${key}"><img src="${style.img}" alt="" width="400" height="225" loading="lazy" decoding="async"><span>${esc(style.label)}</span><i aria-hidden="true">✓</i></label>`).join('');
  document.getElementById('aa-docs').innerHTML = Object.entries(DOCS).map(([key, label]) => `<label class="aa-chip aa-chip-check"><input type="checkbox" name="docs" value="${key}"><span>${esc(label)}</span></label>`).join('');

  function readForm() {
    const data = new FormData(form);
    return {
      type: data.get('type') || '', area: Number(areaInput.value), city: String(data.get('city') || '').trim(), lot: data.get('lot') || 'si',
      budget: data.get('budget') || '', timeline: data.get('timeline') || '', styles: data.getAll('styles').map(String), docs: data.getAll('docs').map(String),
      note: String(data.get('note') || '').trim(), name: String(data.get('name') || '').trim(), phone: String(data.get('phone') || '').trim(), email: String(data.get('email') || '').trim(),
    };
  }
  function setError(key, text) {
    const element = $(`[data-error-for="${key}"]`, form);
    if (element) element.textContent = text;
  }
  function validateStep(number) {
    const data = readForm();
    $$('.aa-error', steps[number - 1]).forEach((element) => { element.textContent = ''; });
    let firstInvalid = null;
    const fail = (key, text, element) => { setError(key, text); if (!firstInvalid) firstInvalid = element; };
    if (number === 1 && !data.type) fail('type', 'Elige un tipo de proyecto para continuar.', $('input[name="type"]', form));
    if (number === 2) {
      if (!Number.isInteger(data.area) || data.area < 20 || data.area > 5000) areaInput.value = Math.max(20, Math.min(5000, Math.round(data.area) || 20));
      if (data.city.length < 3) fail('city', 'Escribe el municipio o barrio, aunque sea aproximado.', document.getElementById('aa-city'));
    }
    if (number === 3) {
      if (!data.budget) fail('budget', 'Elige un rango. «Aún no lo sé» también vale.', $('input[name="budget"]', form));
      if (!data.timeline) fail('timeline', 'Elige cuándo te gustaría empezar.', $('input[name="timeline"]', form));
    }
    if (number === 6) {
      if (data.name.length < 2) fail('name', 'Escribe tu nombre.', document.getElementById('aa-name'));
      if (data.phone.replace(/\D/g, '').length < 7) fail('phone', 'Escribe un número de WhatsApp (al menos 7 dígitos).', document.getElementById('aa-phone'));
    }
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }
  function showStep(number, focus = true) {
    const previous = step;
    step = number;
    steps.forEach((fieldset) => { fieldset.hidden = Number(fieldset.dataset.step) !== number; });
    const current = steps[number - 1];
    if (!reduced()) {
      current.classList.remove('is-entering-back', 'is-entering');
      void current.offsetWidth;
      current.classList.add(number >= previous ? 'is-entering' : 'is-entering-back');
    }
    document.getElementById('aa-step-label').textContent = `Paso ${number} de ${steps.length}`;
    document.getElementById('aa-progress-bar').style.transform = `scaleX(${number / steps.length})`;
    backButton.hidden = number === 1;
    nextButton.innerHTML = number === steps.length ? 'Enviar mi proyecto <span aria-hidden="true">↗</span>' : 'Continuar <span aria-hidden="true">→</span>';
    if (focus) { const legend = $('legend', current); legend.setAttribute('tabindex', '-1'); legend.focus({ preventScroll: true }); }
  }
  form.addEventListener('change', (event) => {
    if (event.target.name === 'type') {
      setError('type', '');
      const preset = TYPES[event.target.value].area;
      areaRange.value = Math.min(2000, preset);
      areaInput.value = preset;
    }
    if (event.target.name === 'budget') setError('budget', '');
    if (event.target.name === 'timeline') setError('timeline', '');
    if (event.target.name === 'styles') {
      const chosen = $$('input[name="styles"]:checked', form);
      if (chosen.length > 2) { event.target.checked = false; setError('styles', 'Elige como máximo dos imágenes.'); } else setError('styles', '');
    }
  });
  areaRange.addEventListener('input', () => { areaInput.value = areaRange.value; });
  areaInput.addEventListener('input', () => { const value = Number(areaInput.value); if (Number.isFinite(value)) areaRange.value = Math.min(2000, Math.max(20, value)); });
  backButton.addEventListener('click', () => { if (step > 1) showStep(step - 1); });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateStep(step)) return;
    if (step < steps.length) { showStep(step + 1); return; }
    submitRequest();
  });

  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, reduced() ? Math.min(ms, 120) : ms));

  async function submitRequest() {
    const data = readForm();
    state.counter += 1;
    const id = `A-${String(state.counter).padStart(4, '0')}`;
    const request = { id, name: data.name.slice(0, 60), phone: data.phone.slice(0, 18), email: data.email.slice(0, 80), type: data.type, area: Math.max(20, Math.min(5000, Math.round(data.area))), city: data.city.slice(0, 60), lot: data.lot, budget: data.budget, timeline: data.timeline, styles: data.styles.slice(0, 2), docs: data.docs, note: data.note.slice(0, 300), stage: 0, visit: null, created: Date.now() };
    request.checks = buildChecklist(request);
    state.requests.push(request);
    state.clientReq = id;
    state.clientPanel = 'done';
    state.selected = id;
    state.map = 0;
    save();
    showDone();
    setMap(1);
    logEvent(`Solicitud recibida de ${request.name} · ${TYPES[request.type].label.toLowerCase()} en ${request.city}`);
    renderPhone({ typing: true });
    await wait(700);
    const owner = TYPES[request.type].owner;
    const gaps = missing(request).length;
    logEvent(`Brief ${id} generado · ${gaps ? `faltan ${gaps} ${gaps === 1 ? 'dato' : 'datos'}` : 'completo'}`);
    setMap(2);
    await wait(600);
    logEvent(`Asignada a ${owner} (${TYPES[request.type].role}) · etapa Solicitud`);
    setMap(3);
    renderStudio();
    await wait(500);
    addMessage({ req: id, channel: 'whatsapp', text: `Hola, ${firstName(request.name)}. Soy ${firstName(owner)}, de AURA. Recibimos tu proyecto: ${TYPES[request.type].label.toLowerCase()} de ${request.area} m² en ${request.city}. Para avanzar, elige el día de la visita:`, link: 'Elegir día de visita' });
    if (request.email) addMessage({ req: id, channel: 'email', subject: `Tu brief de proyecto · ${id}`, text: 'Adjuntamos el resumen de lo que nos contaste. Si algo no está bien, responde a este correo y lo ajustamos.', attachment: `brief-${id}.pdf` });
    renderPhone({ animateLast: true });
    logEvent(`WhatsApp de bienvenida enviado a ${request.name}`);
  }

  // ——— Panel de confirmación del cliente ———
  const doneEl = document.getElementById('aa-done');
  const clientSlots = document.getElementById('aa-client-slots');
  const clientConfirm = document.getElementById('aa-client-confirm');
  const visitCard = document.getElementById('aa-visit-card');
  visitCard.addEventListener('click', (event) => { if (event.target.closest('[data-calendar]')) toast('En la versión real se descarga la invitación para tu calendario.'); });
  let clientSlot = null;
  function showDone(focus = true) {
    const request = find(state.clientReq);
    if (!request) return;
    form.hidden = true;
    $('.aa-request-top', document.getElementById('aa-request')).hidden = true;
    $('.aa-progress', document.getElementById('aa-request')).hidden = true;
    doneEl.hidden = false;
    document.getElementById('aa-done-id').textContent = request.id;
    if (request.visit) {
      document.getElementById('aa-done-title').textContent = 'Visita confirmada.';
      document.getElementById('aa-done-text').textContent = `Te esperamos el ${longDay(request.visit.date)} a las ${request.visit.time}. Irá ${TYPES[request.type].owner}. Te escribimos un día antes para recordártelo.`;
      clientSlots.hidden = true;
      clientConfirm.hidden = true;
      const date = parseDate(request.visit.date);
      const pending = missing(request).slice(0, 3);
      const part = (options) => new Intl.DateTimeFormat('es-CO', options).format(date).replace('.', '');
      visitCard.hidden = false;
      visitCard.innerHTML = `<div class="aa-visit-date" aria-hidden="true"><span>${esc(part({ weekday: 'short' }))}</span><strong>${date.getDate()}</strong><span>${esc(part({ month: 'short' }))}</span></div>
        <dl class="aa-visit-info"><div><dt>Hora</dt><dd>${request.visit.time} · una hora</dd></div><div><dt>Lugar</dt><dd>${esc(request.city)}</dd></div><div><dt>Quién va</dt><dd>${esc(TYPES[request.type].owner)}, ${esc(TYPES[request.type].role)}</dd></div></dl>
        ${pending.length ? `<div class="aa-visit-bring"><p>Si puedes, ten a mano</p><ul>${pending.map((item) => `<li>${esc(item.label)}</li>`).join('')}</ul></div>` : ''}
        <button type="button" class="aa-btn aa-btn-ghost aa-btn-sm" data-calendar>Añadir a mi calendario</button>`;
    } else {
      document.getElementById('aa-done-title').textContent = `Gracias, ${firstName(request.name)}. Ya tenemos tu proyecto.`;
      document.getElementById('aa-done-text').textContent = 'Elige cuándo podemos visitar el lugar. Es una visita de una hora, sin costo.';
      clientSlots.hidden = false;
      clientConfirm.hidden = false;
      visitCard.hidden = true;
      clientSlot = null;
      clientConfirm.disabled = true;
      renderSlots(clientSlots, request.id, null);
    }
    if (focus) doneEl.focus({ preventScroll: true });
  }
  bindSlots(clientSlots, (slot) => { clientSlot = slot; clientConfirm.disabled = false; });
  clientConfirm.addEventListener('click', () => {
    const request = find(state.clientReq);
    if (!request || !clientSlot) return;
    scheduleVisit(request, clientSlot, 'client');
    setMap(5);
    showDone();
    renderPhone({ animateLast: true });
    renderStudio();
  });
  function resetForm() {
    form.reset();
    areaRange.value = 180;
    areaInput.value = 180;
    $$('.aa-error', form).forEach((element) => { element.textContent = ''; });
    form.hidden = false;
    $('.aa-request-top').hidden = false;
    $('.aa-progress').hidden = false;
    doneEl.hidden = true;
    showStep(1, false);
  }
  document.getElementById('aa-new-request').addEventListener('click', () => {
    state.clientPanel = 'form';
    state.clientReq = null;
    state.map = 0;
    save();
    resetForm();
    renderMap();
    renderPhone();
    $('legend', steps[0]).focus();
  });

  // ——— Vista del estudio ———
  const metricsEl = document.getElementById('aa-metrics');
  const board = document.getElementById('aa-board');
  const brief = document.getElementById('aa-brief');
  const sentList = document.getElementById('aa-sent-list');
  const shownMetrics = {};

  function metrics() {
    const now = new Date();
    const month = state.requests.filter((request) => { const date = new Date(request.created); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); });
    const today = state.requests.filter((request) => isoDate(new Date(request.created)) === todayIso()).length;
    const won = state.requests.filter((request) => request.stage >= 3).length;
    const rate = state.requests.length ? Math.round((won / state.requests.length) * 100) : 0;
    const value = state.requests.reduce((sum, request) => sum + BUDGETS[request.budget].mid, 0);
    const upcoming = state.requests.filter((request) => request.visit && request.visit.date >= todayIso()).sort((a, b) => `${a.visit.date}${a.visit.time}`.localeCompare(`${b.visit.date}${b.visit.time}`));
    return [
      { key: 'month', label: 'Solicitudes del mes', value: month.length, format: (n) => String(Math.round(n)), note: today ? `${today} ${today === 1 ? 'llegó' : 'llegaron'} hoy` : 'Ninguna hoy todavía' },
      { key: 'rate', label: 'Conversión (ejemplo)', value: rate, format: (n) => `${Math.round(n)} %`, note: `${won} de ${state.requests.length} llegaron a propuesta` },
      { key: 'value', label: 'Valor en cartera', value, format: (n) => money(n), note: 'Estimado: suma de presupuestos' },
      { key: 'visits', label: 'Visitas agendadas', value: upcoming.length, format: (n) => String(Math.round(n)), note: upcoming[0] ? `Próxima: ${shortDay(upcoming[0].visit.date)}, ${upcoming[0].visit.time}` : 'Sin visitas próximas' },
    ];
  }
  function renderMetrics() {
    const list = metrics();
    metricsEl.innerHTML = list.map((metric) => `<div class="aa-metric"><p>${esc(metric.label)}</p><strong data-metric="${metric.key}">${esc(metric.format(shownMetrics[metric.key] ?? metric.value))}</strong><small>${esc(metric.note)}</small></div>`).join('');
    list.forEach((metric) => {
      const from = shownMetrics[metric.key];
      shownMetrics[metric.key] = metric.value;
      const element = $(`[data-metric="${metric.key}"]`, metricsEl);
      if (from === undefined || from === metric.value || reduced()) { element.textContent = metric.format(metric.value); return; }
      element.classList.add('is-changing');
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 900);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = metric.format(from + (metric.value - from) * eased);
        if (progress < 1) requestAnimationFrame(tick); else element.classList.remove('is-changing');
      };
      requestAnimationFrame(tick);
    });
  }

  function cardHtml(request) {
    const total = request.checks.length;
    const done = total - missing(request).length;
    const selected = request.id === state.selected;
    const isNew = request.stage === 0 && Date.now() - request.created < 30 * 60e3;
    return `<li class="aa-card${selected ? ' is-selected' : ''}" data-id="${request.id}" draggable="true">
      <button type="button" class="aa-card-main" data-select="${request.id}" aria-pressed="${selected}" aria-label="Ver brief de ${esc(request.name)}, ${esc(TYPES[request.type].label)}">
        <span class="aa-card-top"><span>${request.id}</span>${isNew ? '<b>Nueva</b>' : ''}</span>
        <strong>${esc(request.name)}</strong>
        <span class="aa-card-what">${esc(TYPES[request.type].label)} · ${request.area.toLocaleString('es-CO')} m²</span>
        <span class="aa-card-where">${esc(request.city.split(',')[0])}</span>
        <span class="aa-card-meter" aria-hidden="true"><i style="transform:scaleX(${(done / total).toFixed(3)})"></i></span>
        <span class="aa-card-foot"><span>${done}/${total} datos</span>${request.visit && request.stage === 2 ? `<span>${esc(cap(shortDay(request.visit.date)))}</span>` : `<span class="aa-avatar" title="${esc(TYPES[request.type].owner)}">${esc(initials(TYPES[request.type].owner))}</span>`}</span>
      </button>
      <div class="aa-card-moves">
        <button type="button" data-move="-1" data-id="${request.id}" ${request.stage === 0 ? 'disabled' : ''} aria-label="Mover ${esc(request.name)} a ${request.stage > 0 ? STAGES[request.stage - 1].name : ''}">←</button>
        <button type="button" data-move="1" data-id="${request.id}" ${request.stage === 4 ? 'disabled' : ''} aria-label="Mover ${esc(request.name)} a ${request.stage < 4 ? STAGES[request.stage + 1].name : ''}">→</button>
      </div>
    </li>`;
  }
  function renderBoard() {
    // FLIP: guardamos dónde estaba cada tarjeta para animar el cambio de columna.
    const before = new Map($$('.aa-card', board).map((card) => [card.dataset.id, card.getBoundingClientRect()]));
    const focusedMove = document.activeElement && board.contains(document.activeElement) ? { id: document.activeElement.dataset.id || document.activeElement.dataset.select, move: document.activeElement.dataset.move } : null;
    board.innerHTML = STAGES.map((stage, index) => {
      const items = state.requests.filter((request) => request.stage === index).sort((a, b) => b.created - a.created);
      return `<section class="aa-col" data-stage="${index}" aria-label="${stage.name}, ${items.length} ${items.length === 1 ? 'proyecto' : 'proyectos'}">
        <header><span class="aa-col-no">0${index + 1}</span><h4>${stage.name}</h4><span class="aa-col-count">${items.length}</span><small>${stage.hint}</small></header>
        <ul>${items.map(cardHtml).join('') || '<li class="aa-col-empty">Sin proyectos</li>'}</ul>
      </section>`;
    }).join('');
    if (focusedMove && focusedMove.id) {
      const target = focusedMove.move ? $(`[data-move="${focusedMove.move}"][data-id="${focusedMove.id}"]`, board) : $(`[data-select="${focusedMove.id}"]`, board);
      const fallback = $(`[data-select="${focusedMove.id}"]`, board);
      (target && !target.disabled ? target : fallback)?.focus({ preventScroll: true });
    }
    if (reduced()) return;
    $$('.aa-card', board).forEach((card) => {
      const old = before.get(card.dataset.id);
      const now = card.getBoundingClientRect();
      if (!old) { if (before.size) card.animate([{ opacity: 0, transform: 'translateY(-10px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,0,1)' }); return; }
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      card.animate([{ transform: `translate(${dx}px, ${dy}px)`, boxShadow: '0 18px 40px -16px #11161266' }, { transform: 'none', boxShadow: '0 0 0 0 transparent' }], { duration: 620, easing: 'cubic-bezier(.2,.7,0,1)' });
    });
  }

  function renderBrief() {
    const request = find(state.selected);
    if (!request) { brief.innerHTML = '<p class="aa-brief-empty">Elige una tarjeta para ver su brief.</p>'; sentList.innerHTML = ''; return; }
    const type = TYPES[request.type];
    const gaps = missing(request);
    const check = ratio(request);
    const created = new Date(request.created);
    brief.innerHTML = `
      <header class="aa-brief-head">
        <span class="aa-brief-mark">AURA</span>
        <div><small>Brief de proyecto</small><strong>${request.id}</strong></div>
        <span class="aa-brief-date">${esc(cap(shortDay(isoDate(created))))} · ${clock(request.created)}</span>
      </header>
      <h4 class="aa-brief-title">${esc(type.label)} · ${request.area.toLocaleString('es-CO')} m²</h4>
      <p class="aa-brief-sub">${esc(request.city)} · ${esc(LOTS[request.lot])}</p>
      <dl class="aa-brief-grid">
        <div><dt>Cliente</dt><dd>${esc(request.name)}</dd></div>
        <div><dt>WhatsApp</dt><dd>${esc(request.phone)}</dd></div>
        <div><dt>Presupuesto</dt><dd>${esc(BUDGETS[request.budget].label)}</dd></div>
        <div><dt>Plazo</dt><dd>${esc(TIMES[request.timeline])}</dd></div>
        <div><dt>Responsable</dt><dd>${esc(type.owner)}</dd></div>
        <div><dt>Etapa</dt><dd>${esc(STAGES[request.stage].name)}</dd></div>
      </dl>
      ${check ? `<div class="aa-brief-ratio is-${check.verdict.tone}"><div><small>Presupuesto por m²</small><strong>≈ ${formatPerM2(check.perM2)}</strong></div><div><b>${check.verdict.text}</b><span>${check.verdict.note} Referencia orientativa de ejemplo.</span></div></div>` : '<div class="aa-brief-ratio is-low"><div><small>Presupuesto por m²</small><strong>Por definir</strong></div><div><b>Sin rango</b><span>Se habla en la visita, con ejemplos de costo por m².</span></div></div>'}
      <div class="aa-brief-block"><h5>Referencias de estilo</h5>${request.styles.length ? `<div class="aa-brief-styles">${request.styles.map((key) => `<figure><img src="${STYLES[key].img}" alt="" width="400" height="225" loading="lazy" decoding="async"><figcaption>${esc(STYLES[key].label)}</figcaption></figure>`).join('')}</div>` : '<p class="aa-brief-muted">El cliente aún no eligió referencias.</p>'}</div>
      ${request.note ? `<div class="aa-brief-block"><h5>En palabras del cliente</h5><p class="aa-brief-quote">«${esc(request.note)}»</p></div>` : ''}
      <div class="aa-brief-block aa-brief-check"><h5>Lo que falta <span>${gaps.length ? `${gaps.length} de ${request.checks.length} pendientes` : 'Todo listo'}</span></h5>
        <ul>${request.checks.map((item) => `<li><label class="${item.done ? 'is-done' : ''}"><input type="checkbox" data-check="${esc(item.k)}" ${item.done ? 'checked' : ''} ${item.k === 'basico' ? 'disabled' : ''}><span class="aa-tick" aria-hidden="true"></span>${esc(item.label)}</label></li>`).join('')}</ul>
      </div>
      <footer class="aa-brief-actions">
        ${request.visit ? `<p class="aa-brief-visit"><span>Visita</span>${esc(cap(longDay(request.visit.date)))} · ${request.visit.time}</p>` : `<button type="button" class="aa-btn aa-btn-primary aa-btn-sm" data-open-visit="${request.id}">Agendar visita</button>`}
        ${request.stage < 4 ? `<button type="button" class="aa-btn aa-btn-ghost aa-btn-sm" data-advance="${request.id}">Pasar a ${STAGES[request.stage + 1].name} →</button>` : ''}
        <button type="button" class="aa-btn aa-btn-ghost aa-btn-sm" data-pdf>Descargar PDF</button>
      </footer>`;
    const sent = state.messages.filter((message) => message.req === request.id).slice().reverse();
    sentList.innerHTML = sent.length ? `<ul class="aa-sent-items">${sent.map((message) => `<li class="is-${message.channel}${message.scheduled ? ' is-scheduled' : ''}"><span class="aa-sent-channel">${message.scheduled ? 'Programado' : message.channel === 'email' ? 'Correo' : 'WhatsApp'}</span><time>${clock(message.t)}</time>${message.subject ? `<strong>${esc(message.subject)}</strong>` : ''}<p>${esc(message.text)}</p></li>`).join('')}</ul>` : '<p class="aa-brief-muted">Aún no se ha enviado nada a este cliente.</p>';
  }
  function renderStudio() { renderMetrics(); renderBoard(); renderBrief(); }

  function moveRequest(request, target, by = 'team') {
    if (!request || target < 0 || target > 4 || target === request.stage) return;
    if (target === 2 && !request.visit) { openVisit(request); return; }
    const from = request.stage;
    request.stage = target;
    state.selected = request.id;
    save();
    logEvent(`${request.name}: ${STAGES[from].name} → ${STAGES[target].name}`, by);
    if (target === 3 && from < 3) {
      addMessage({ req: request.id, channel: request.email ? 'email' : 'whatsapp', subject: `Propuesta de honorarios · ${request.id}`, text: `Hola, ${firstName(request.name)}. Te enviamos la propuesta de honorarios con etapas, entregables y plazos. Podemos revisarla juntos cuando quieras.`, attachment: `propuesta-${request.id}.pdf` });
      logEvent(`Propuesta de honorarios enviada a ${request.name}`);
    }
    if (target === 4 && from < 4) {
      addMessage({ req: request.id, channel: 'whatsapp', text: `¡Arrancamos, ${firstName(request.name)}! Esta semana empieza el anteproyecto. Te compartimos el calendario de entregas.` });
      logEvent(`Mensaje de inicio de diseño enviado a ${request.name}`);
    }
    renderStudio();
    if (state.clientReq === request.id) renderPhone();
  }

  board.addEventListener('click', (event) => {
    const move = event.target.closest('[data-move]');
    if (move) { const request = find(move.dataset.id); if (request) moveRequest(request, request.stage + Number(move.dataset.move)); return; }
    const select = event.target.closest('[data-select]');
    if (select) { state.selected = select.dataset.select; save(); renderBoard(); renderBrief(); }
  });
  // Arrastrar y soltar (escritorio). En táctil se usan las flechas de cada tarjeta.
  let draggingId = null;
  board.addEventListener('dragstart', (event) => {
    const card = event.target.closest('.aa-card');
    if (!card) return;
    draggingId = card.dataset.id;
    card.classList.add('is-dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggingId);
  });
  board.addEventListener('dragend', () => { draggingId = null; $$('.is-dragging, .is-over', board).forEach((element) => element.classList.remove('is-dragging', 'is-over')); });
  board.addEventListener('dragover', (event) => {
    const column = event.target.closest('.aa-col');
    if (!column || !draggingId) return;
    event.preventDefault();
    $$('.aa-col.is-over', board).forEach((other) => { if (other !== column) other.classList.remove('is-over'); });
    column.classList.add('is-over');
  });
  board.addEventListener('dragleave', (event) => { const column = event.target.closest('.aa-col'); if (column && !column.contains(event.relatedTarget)) column.classList.remove('is-over'); });
  board.addEventListener('drop', (event) => {
    const column = event.target.closest('.aa-col');
    if (!column || !draggingId) return;
    event.preventDefault();
    const request = find(draggingId);
    draggingId = null;
    moveRequest(request, Number(column.dataset.stage));
  });

  brief.addEventListener('change', (event) => {
    const box = event.target.closest('[data-check]');
    if (!box) return;
    const request = find(state.selected);
    const item = request && request.checks.find((check) => check.k === box.dataset.check);
    if (!item) return;
    item.done = box.checked;
    save();
    logEvent(`${item.done ? 'Recibido' : 'Pendiente de nuevo'}: ${item.label.toLowerCase()} · ${request.name}`, 'team');
    renderBoard();
    renderBrief();
    const again = $(`[data-check="${CSS.escape(item.k)}"]`, brief);
    if (again) again.focus({ preventScroll: true });
  });
  brief.addEventListener('click', (event) => {
    const visit = event.target.closest('[data-open-visit]');
    if (visit) { openVisit(find(visit.dataset.openVisit)); return; }
    const advance = event.target.closest('[data-advance]');
    if (advance) { const request = find(advance.dataset.advance); if (request) moveRequest(request, request.stage + 1); return; }
    if (event.target.closest('[data-pdf]')) toast('En la versión real, aquí se descarga el brief en PDF con la marca del estudio.');
  });

  // ——— Diálogo para agendar desde el estudio ———
  const visitDialog = document.getElementById('aa-visit-dialog');
  const studioSlots = document.getElementById('aa-studio-slots');
  const studioConfirm = document.getElementById('aa-studio-confirm');
  let visitFor = null;
  let studioSlot = null;
  function openVisit(request) {
    if (!request) return;
    visitFor = request.id;
    studioSlot = null;
    studioConfirm.disabled = true;
    document.getElementById('aa-visit-title').textContent = `Visita para ${request.name}`;
    document.getElementById('aa-visit-text').textContent = `${TYPES[request.type].label} en ${request.city}. Los horarios tachados ya están ocupados en el calendario del equipo.`;
    renderSlots(studioSlots, request.id, null);
    visitDialog.showModal();
  }
  bindSlots(studioSlots, (slot) => { studioSlot = slot; studioConfirm.disabled = false; });
  studioConfirm.addEventListener('click', () => {
    const request = find(visitFor);
    if (!request || !studioSlot) return;
    scheduleVisit(request, studioSlot, 'team');
    state.selected = request.id;
    if (state.clientReq === request.id) setMap(5);
    save();
    visitDialog.close();
    renderStudio();
    if (state.clientReq === request.id) { showDone(false); renderPhone(); }
    toast(`Visita agendada. ${firstName(request.name)} recibió la confirmación (ejemplo).`);
  });
  $$('[data-close]', visitDialog).forEach((button) => button.addEventListener('click', () => visitDialog.close()));
  visitDialog.addEventListener('click', (event) => { if (event.target === visitDialog) visitDialog.close(); });

  // ——— Vistas ———
  const tabs = $$('[data-view]');
  function setView(view, focus = false) {
    state.view = view;
    save();
    tabs.forEach((tab) => {
      const on = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    $$('.aa-view').forEach((panel) => {
      const on = panel.id === `view-${view}`;
      panel.hidden = !on;
      if (on && !reduced()) { panel.classList.remove('is-entering'); void panel.offsetWidth; panel.classList.add('is-entering'); }
    });
    if (view === 'estudio') renderStudio();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setView(tabs[next].dataset.view, true);
    });
  });

  // ——— Reiniciar ———
  document.getElementById('aa-reset').addEventListener('click', () => {
    stopDemo();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* nada que borrar */ }
    state = seed();
    Object.keys(shownMetrics).forEach((key) => delete shownMetrics[key]);
    resetForm();
    renderAll();
    toast('Ejemplo reiniciado: volvimos a los datos iniciales.');
  });

  // ——— Recorrido automático ———
  const demoBar = document.getElementById('aa-demo-bar');
  const demoText = document.getElementById('aa-demo-text');
  let demoToken = 0;
  class Stopped extends Error {}
  function stopDemo() {
    if (!document.body.classList.contains('is-demo')) return;
    demoToken += 1;
    document.body.classList.remove('is-demo');
    demoBar.hidden = true;
    $$('.aa-pulse').forEach((element) => element.classList.remove('aa-pulse'));
  }
  document.getElementById('aa-demo-stop').addEventListener('click', () => { stopDemo(); toast('Recorrido detenido. Puedes seguir tú desde aquí.'); });

  async function runDemo() {
    stopDemo();
    const token = ++demoToken;
    const pause = async (ms) => { await wait(ms); if (token !== demoToken) throw new Stopped(); };
    const say = (text) => { demoText.textContent = text; };
    const pulse = async (element, ms = 650) => {
      if (!element) return;
      element.classList.add('aa-pulse');
      await pause(ms);
      element.classList.remove('aa-pulse');
    };
    const pick = async (selector, ms = 520) => {
      const input = $(selector, form);
      if (!input) return;
      const label = input.closest('label');
      if (label) label.classList.add('aa-pulse');
      await pause(ms * 0.5);
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await pause(ms * 0.5);
      if (label) label.classList.remove('aa-pulse');
    };
    const type = async (input, text) => {
      input.focus({ preventScroll: true });
      input.value = '';
      if (reduced()) { input.value = text; return; }
      for (const char of text) { input.value += char; await pause(28 + Math.random() * 30); }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const next = async () => { await pulse(nextButton, 380); nextButton.click(); await pause(650); };
    document.body.classList.add('is-demo');
    demoBar.hidden = false;
    try {
      say('1/6 · El cliente cuenta su proyecto');
      setView('cliente');
      if (state.clientPanel === 'done') { state.clientPanel = 'form'; state.clientReq = null; state.map = 0; save(); renderMap(); renderPhone(); }
      resetForm();
      scrollToEl(document.getElementById('flujo'));
      await pause(900);
      await pick('input[name="type"][value="casa"]', 800);
      await next();
      const target = 220;
      for (let value = Number(areaRange.value); value <= target; value += 4) { areaRange.value = value; areaInput.value = value; await pause(12); }
      areaInput.value = target;
      await type(document.getElementById('aa-city'), 'Anapoima, Cundinamarca');
      await pick('input[name="lot"][value="si"]', 400);
      await next();
      await pick('input[name="budget"][value="b3"]');
      await pick('input[name="timeline"][value="t3"]');
      await next();
      await pick('input[name="styles"][value="tropical"]', 600);
      await pick('input[name="styles"][value="concreto"]', 600);
      await next();
      await pick('input[name="docs"][value="fotos"]', 500);
      await type(document.getElementById('aa-note'), 'Somos cuatro y trabajamos desde casa. Queremos un patio con sombra.');
      await next();
      await type(document.getElementById('aa-name'), 'Lina Vélez');
      await type(document.getElementById('aa-phone'), '300 555 0142');
      await pause(300);
      say('2/6 · Se arma el brief y se avisa al cliente');
      await pulse(nextButton, 380);
      nextButton.click();
      await pause(2900);
      say('3/6 · El cliente elige el día de la visita');
      scrollToEl(document.getElementById('aa-request'), 'center');
      await pause(700);
      const slot = $('[data-slot]:not(:disabled)', clientSlots);
      if (slot) { await pulse(slot, 500); slot.click(); }
      await pause(500);
      await pulse(clientConfirm, 400);
      clientConfirm.click();
      await pause(2200);
      say('4/6 · El estudio lo ve en su pipeline');
      setView('estudio');
      scrollToEl(document.getElementById('flujo'));
      await pause(900);
      const card = $(`.aa-card[data-id="${state.clientReq}"]`, board);
      if (card) { scrollToEl(card, 'center'); await pulse(card, 1500); }
      say('5/6 · El brief dice qué falta pedir');
      scrollToEl(brief, 'start');
      await pause(1200);
      const pending = $('[data-check]:not(:checked):not(:disabled)', brief);
      if (pending) { await pulse(pending.closest('label'), 700); pending.click(); }
      await pause(1400);
      say('6/6 · Tras la visita, la propuesta sale sola');
      const request = find(state.clientReq);
      scrollToEl(document.getElementById('aa-metrics'), 'start');
      await pause(800);
      if (request) moveRequest(request, 3);
      await pause(2600);
      stopDemo();
      toast('Ese es el flujo completo. Ahora pruébalo tú con tu propio proyecto.');
    } catch (error) {
      if (!(error instanceof Stopped)) { stopDemo(); throw error; }
    }
  }
  $$('[data-demo-start]').forEach((button) => button.addEventListener('click', runDemo));

  // ——— Arranque ———
  function renderAll() {
    renderTimeline();
    renderMap();
    renderPhone();
    if (state.clientPanel === 'done' && state.clientReq) showDone(false); else resetForm();
    setView(state.view);
    if (state.view !== 'estudio') renderStudio();
  }
  showStep(1, false);
  const hash = window.location.hash.replace('#', '');
  if (hash === 'estudio' || hash === 'cliente') state.view = hash;
  renderAll();
  if (hash === 'estudio' || hash === 'cliente') window.requestAnimationFrame(() => document.getElementById('flujo').scrollIntoView());
})();
