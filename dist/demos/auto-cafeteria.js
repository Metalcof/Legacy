'use strict';
// Maré · pedidos para recoger. Pedido del cliente → ticket → cola de barra → listo → aviso por WhatsApp.
(() => {
  /* ---------- Marca del estudio ---------- */
  const studio = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach((element) => { element.textContent = studio; });
  document.title = document.title.replace('Nexo Studio', studio);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = description.content.replace('Nexo Studio', studio);

  /* ---------- Datos ---------- */
  const STORAGE_KEY = 'nexo-auto-cafeteria-v1';
  const STATUSES = ['recibido', 'preparando', 'listo', 'entregado'];
  const menu = {
    flatwhite: { name: 'Flat white', price: 12000, note: 'Doble espresso y leche sedosa', img: '../assets/case-cafe-flatwhite-small.webp' },
    iced: { name: 'Iced latte', price: 14000, note: 'Espresso, hielo y leche fría', img: '../assets/case-cafe-iced-small.webp' },
    espresso: { name: 'Espresso', price: 7000, note: 'Corto, con notas a panela', icon: 'cup' },
    croissant: { name: 'Croissant', price: 9000, note: 'Mantequilla, horneado hoy', img: '../assets/case-cafe-croissant-small.webp' },
    banano: { name: 'Pan de banano', price: 10000, note: 'Con nueces, porción generosa', icon: 'loaf' },
  };
  const icons = {
    cup: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 19h20v8a10 10 0 0 1-20 0z" fill="#fbf7f0" stroke="#3a2a21" stroke-width="2"/><path d="M32 21h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#3a2a21" stroke-width="2"/><path d="M18 9c-2 3 2 4 0 7M24 9c-2 3 2 4 0 7" fill="none" stroke="#a45228" stroke-width="2" stroke-linecap="round"/><path d="M9 40h28" stroke="#3a2a21" stroke-width="2" stroke-linecap="round"/></svg>',
    loaf: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 30c0-10 7-16 16-16s16 6 16 16v6H8z" fill="#c98a4a" stroke="#3a2a21" stroke-width="2"/><path d="M17 20l3 5M24 18v6M31 20l-3 5" stroke="#7d4a22" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  const slotOffsets = [10, 20, 30];
  const money = (value) => `$ ${new Intl.NumberFormat('es-CO').format(value)}`;
  const pad = (number) => String(number).padStart(2, '0');
  const hhmm = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const roundedFromNow = (minutes) => {
    const date = new Date(Date.now() + minutes * 60000);
    date.setMinutes(Math.ceil(date.getMinutes() / 5) * 5, 0, 0);
    return hhmm(date);
  };
  const today = () => { const now = new Date(); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; };
  const agoTime = (minutes) => hhmm(new Date(Date.now() - minutes * 60000));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const itemCount = (items) => Object.values(items).reduce((sum, qty) => sum + qty, 0);
  const orderTotal = (items) => Object.entries(items).reduce((sum, [key, qty]) => sum + menu[key].price * qty, 0);
  const itemsText = (items) => Object.entries(items).map(([key, qty]) => `${qty} × ${menu[key].name}`);

  function seed() {
    return {
      version: 1,
      day: today(),
      counter: 103,
      stats: { orders: 26, sales: 389000, prepSum: 74, prepCount: 9 },
      orders: [
        { id: 'M-101', name: 'Sofía', items: { flatwhite: 1, croissant: 1 }, pickup: roundedFromNow(5), status: 'preparando', prep: 0, chat: [] },
        { id: 'M-102', name: 'Diego', items: { espresso: 2, banano: 1 }, pickup: roundedFromNow(15), status: 'recibido', prep: 0, chat: [] },
        { id: 'M-103', name: 'Camila', items: { iced: 1 }, pickup: roundedFromNow(0), status: 'listo', prep: 6, chat: [] },
      ],
      log: [
        { time: agoTime(2), text: 'Aviso “tu pedido está listo” enviado por WhatsApp a Camila', kind: 'auto' },
        { time: agoTime(2), text: 'La barra marcó M-103 como listo', kind: 'team' },
        { time: agoTime(6), text: 'Ticket M-102 creado y enviado a la cola de la barra', kind: 'auto' },
        { time: agoTime(9), text: 'La barra empezó a preparar M-101', kind: 'team' },
      ],
      draft: { items: {}, slot: 1, name: '' },
      phone: { view: 'order', trackId: null },
    };
  }

  const isText = (value, max) => typeof value === 'string' && value.length <= max;
  const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  const validItems = (items, allowEmpty) => items && typeof items === 'object' && !Array.isArray(items)
    && Object.entries(items).every(([key, qty]) => menu[key] && isInt(qty, 1, 20))
    && (allowEmpty || Object.keys(items).length > 0);
  function validState(data) {
    if (!data || data.version !== 1 || data.day !== today() || !isInt(data.counter, 103, 99999)) return false;
    const { stats, orders, log, draft, phone } = data;
    if (!stats || !isInt(stats.orders, 0, 1e6) || !isInt(stats.sales, 0, 1e12) || !isInt(stats.prepSum, 0, 1e7) || !isInt(stats.prepCount, 1, 1e6)) return false;
    if (!Array.isArray(orders) || orders.length > 40) return false;
    const orderOk = (order) => order && /^M-\d{3,5}$/.test(order.id) && isText(order.name, 24) && order.name.trim() && validItems(order.items, false)
      && /^\d{2}:\d{2}$/.test(order.pickup) && STATUSES.includes(order.status) && isInt(order.prep, 0, 60)
      && Array.isArray(order.chat) && order.chat.length <= 6 && order.chat.every((message) => message && isText(message.text, 200) && isText(message.time, 5));
    if (!orders.every(orderOk)) return false;
    if (!Array.isArray(log) || log.length > 60 || !log.every((entry) => entry && isText(entry.time, 5) && isText(entry.text, 200) && ['auto', 'team', 'client'].includes(entry.kind))) return false;
    if (!draft || !validItems(draft.items, true) || !isInt(draft.slot, 0, 2) || !isText(draft.name, 24)) return false;
    if (!phone || !['order', 'track'].includes(phone.view) || !(phone.trackId === null || orders.some((order) => order.id === phone.trackId))) return false;
    return true;
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (validState(saved)) return saved;
    } catch (_) { /* Datos dañados o almacenamiento bloqueado: se usa el ejemplo inicial. */ }
    return seed();
  }
  let state = load();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* La demo sigue funcionando en memoria. */ }
  }

  /* ---------- Referencias ---------- */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const productsList = $('[data-products]');
  const slotsList = $('[data-slots]');
  const nameInput = $('[data-name]');
  const sendButton = $('[data-send]');
  const hint = $('[data-hint]');
  const push = $('[data-push]');
  const announcer = $('[data-announce]');
  const logList = $('[data-log]');
  const phone = $('[data-phone]');
  const barra = $('[data-barra]');
  const findOrder = (id) => state.orders.find((order) => order.id === id);

  function announce(message) {
    announcer.textContent = '';
    window.setTimeout(() => { announcer.textContent = message; }, 40);
  }
  function addLog(text, kind = 'auto') {
    state.log.unshift({ time: hhmm(new Date()), text, kind });
    state.log = state.log.slice(0, 40);
  }

  /* ---------- Teléfono: pedido ---------- */
  function buildProducts() {
    productsList.innerHTML = Object.entries(menu).map(([key, item]) => `
      <li class="product" data-product="${key}">
        <span class="thumb">${item.img ? `<img src="${item.img}" alt="" width="56" height="56" loading="lazy" decoding="async">` : icons[item.icon]}</span>
        <span class="product-info"><b>${item.name}</b><small>${item.note}</small><span class="price">${money(item.price)}</span></span>
        <span class="stepper" role="group" aria-label="Cantidad de ${item.name}">
          <button type="button" data-qty="-1" data-key="${key}" aria-label="Quitar un ${item.name}">−</button>
          <output data-qty-value="${key}" aria-live="polite">0</output>
          <button type="button" data-qty="1" data-key="${key}" aria-label="Añadir un ${item.name}">+</button>
        </span>
      </li>`).join('');
  }
  function renderSlots() {
    slotsList.innerHTML = slotOffsets.map((minutes, index) => `
      <button type="button" class="slot" data-slot="${index}" aria-pressed="${state.draft.slot === index}"><b>${roundedFromNow(minutes)}</b><small>en ~${minutes} min</small></button>`).join('');
  }
  function renderDraft() {
    const { items, name } = state.draft;
    Object.keys(menu).forEach((key) => {
      const qty = items[key] || 0;
      const output = $(`[data-qty-value="${key}"]`);
      output.textContent = String(qty);
      output.closest('.product').classList.toggle('is-picked', qty > 0);
      $(`[data-qty="-1"][data-key="${key}"]`).disabled = qty === 0;
    });
    $$('[data-slot]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.slot) === state.draft.slot)));
    if (nameInput.value !== name) nameInput.value = name;
    const count = itemCount(items);
    $('[data-total]').textContent = money(orderTotal(items));
    const ready = count > 0 && name.trim().length > 0;
    sendButton.disabled = !ready;
    hint.textContent = count === 0 ? 'Elige al menos un producto.' : !name.trim() ? 'Escribe tu nombre para llamarte en la barra.' : `${count} ${count === 1 ? 'producto' : 'productos'} · listo para enviar`;
  }
  function changeQty(key, delta) {
    const current = state.draft.items[key] || 0;
    const next = Math.max(0, Math.min(9, current + delta));
    if (next === 0) delete state.draft.items[key];
    else state.draft.items[key] = next;
    save();
    renderDraft();
    renderRail();
  }

  /* ---------- Teléfono: seguimiento y mensajes ---------- */
  const chatTexts = {
    recibido: (order) => `¡Hola, ${order.name}! Recibimos tu pedido ${order.id}. Lo tendremos listo para las ${order.pickup}.`,
    preparando: () => 'Tu pedido ya se está preparando en la barra.',
    listo: (order) => `¡Tu pedido ${order.id} está listo! Te esperamos en la barra. Pregunta por tu nombre.`,
    entregado: () => 'Gracias por pasar por Maré. ¡Que lo disfrutes!',
  };
  function pushChat(order, status) {
    order.chat.push({ text: chatTexts[status](order), time: hhmm(new Date()) });
    order.chat = order.chat.slice(-6);
  }
  const trackTitles = { recibido: 'Recibimos tu pedido', preparando: 'Lo estamos preparando', listo: 'Tu pedido está listo', entregado: '¡Buen provecho!' };
  function renderPhone() {
    const tracked = state.phone.trackId && findOrder(state.phone.trackId);
    const view = state.phone.view === 'track' && tracked ? 'track' : 'order';
    $$('[data-screen]').forEach((screen) => { screen.hidden = screen.dataset.screen !== view; });
    phone.dataset.view = view;
    if (view !== 'track') return;
    $('[data-track-id]').textContent = `Pedido ${tracked.id}`;
    $('[data-track-time]').textContent = tracked.pickup;
    $('[data-track-title]').textContent = trackTitles[tracked.status];
    const level = STATUSES.indexOf(tracked.status);
    $$('[data-track-steps] li').forEach((step, index) => {
      step.classList.toggle('is-done', index < level || level === 3);
      step.classList.toggle('is-now', index === level);
      if (index === level) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
    });
    $('[data-track-items]').innerHTML = Object.entries(tracked.items).map(([key, qty]) => `<li><span>${qty} × ${esc(menu[key].name)}</span><span>${money(menu[key].price * qty)}</span></li>`).join('')
      + `<li class="track-total"><span>Total</span><span>${money(orderTotal(tracked.items))}</span></li>`;
    const chat = $('[data-chat]');
    const previous = chat.childElementCount;
    chat.innerHTML = tracked.chat.map((message) => `<p class="bubble"><span>${esc(message.text)}</span><small>${esc(message.time)} ✓✓</small></p>`).join('');
    if (tracked.chat.length > previous && previous > 0 && !reduced.matches) chat.lastElementChild.classList.add('is-new');
    chat.scrollTop = chat.scrollHeight;
  }
  let pushTimer = 0;
  function showPush(text) {
    $('[data-push-text]').textContent = text;
    push.hidden = false;
    push.classList.remove('is-in');
    void push.offsetWidth;
    push.classList.add('is-in');
    window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => { push.classList.remove('is-in'); window.setTimeout(() => { push.hidden = true; }, 400); }, 3800);
  }

  /* ---------- Barra ---------- */
  const actions = { recibido: 'Empezar a preparar', preparando: 'Marcar listo', listo: 'Entregado' };
  function minutesUntil(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    let diff = Math.round((target - Date.now()) / 60000);
    if (diff < -720) diff += 1440;
    return diff;
  }
  function dueText(order) {
    const diff = minutesUntil(order.pickup);
    if (order.status === 'listo') return 'Esperando al cliente';
    if (diff > 0) return `Recoge en ${diff} min`;
    if (diff === 0) return 'Recoge ahora';
    return `Recoge hace ${-diff} min`;
  }
  let freshTicket = null;
  function ticketHTML(order) {
    const late = order.status !== 'listo' && minutesUntil(order.pickup) <= 3;
    return `<article class="ticket${late ? ' is-due' : ''}" data-ticket="${order.id}" aria-label="Pedido ${order.id} de ${esc(order.name)}">
      <header><b class="ticket-id">${order.id}</b><span class="ticket-time">${order.pickup}</span></header>
      <p class="ticket-name">${esc(order.name)}</p>
      <ul>${itemsText(order.items).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
      <p class="ticket-due">${dueText(order)}</p>
      <button type="button" class="ticket-action" data-advance="${order.id}">${actions[order.status]}</button>
    </article>`;
  }
  function renderBoard() {
    ['recibido', 'preparando', 'listo'].forEach((status) => {
      const orders = state.orders.filter((order) => order.status === status);
      const list = $(`[data-list="${status}"]`);
      list.innerHTML = orders.length ? orders.map(ticketHTML).join('') : `<p class="lane-empty">${status === 'recibido' ? 'Sin pedidos nuevos' : status === 'preparando' ? 'Nada en preparación' : 'Nada por entregar'}</p>`;
      $(`[data-count="${status}"]`).textContent = String(orders.length);
    });
    if (freshTicket) {
      const ticket = $(`[data-ticket="${freshTicket}"]`);
      if (ticket && !reduced.matches) ticket.classList.add('is-fresh');
      freshTicket = null;
    }
  }
  const shownMetrics = {};
  function setMetric(key, value, format) {
    const element = $(`[data-metric="${key}"]`);
    const from = shownMetrics[key];
    shownMetrics[key] = value;
    if (from === undefined || from === value || reduced.matches) { element.textContent = format(value); return; }
    const start = performance.now();
    const duration = 700;
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      element.textContent = format(from + (value - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    element.parentElement.classList.remove('is-bump');
    void element.offsetWidth;
    element.parentElement.classList.add('is-bump');
  }
  function renderMetrics() {
    const { stats } = state;
    setMetric('orders', stats.orders, (value) => String(Math.round(value)));
    setMetric('avg', stats.prepSum / stats.prepCount, (value) => `${value.toLocaleString('es-CO', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} min`);
    setMetric('sales', stats.sales, (value) => money(Math.round(value / 100) * 100));
    setMetric('queue', state.orders.filter((order) => order.status === 'recibido' || order.status === 'preparando').length, (value) => String(Math.round(value)));
  }

  /* ---------- Registro y recorrido ---------- */
  function renderLog() {
    logList.innerHTML = state.log.map((entry, index) => `<li class="log-${entry.kind}${index === 0 && logFresh ? ' is-new' : ''}"><time>${esc(entry.time)}</time><span class="log-tag">${entry.kind === 'auto' ? 'Automático' : entry.kind === 'team' ? 'Barra' : 'Cliente'}</span><p>${esc(entry.text)}</p></li>`).join('')
      || '<li class="log-empty"><p>Aún no hay movimientos.</p></li>';
    logFresh = false;
  }
  let logFresh = false;
  let lastRail = -1;
  function renderRail() {
    const tracked = state.phone.view === 'track' && state.phone.trackId && findOrder(state.phone.trackId);
    let reached = 0;
    if (tracked) reached = { recibido: 3, preparando: 3, listo: 5, entregado: 5 }[tracked.status];
    else if (itemCount(state.draft.items) > 0) reached = 1;
    $$('[data-rail] li').forEach((step) => {
      const number = Number(step.dataset.step);
      step.classList.toggle('is-on', number <= reached);
      step.classList.toggle('is-current', number === reached && !(tracked && tracked.status === 'entregado'));
      if (number <= reached && number > lastRail && lastRail >= 0 && !reduced.matches) {
        step.classList.remove('is-flash');
        void step.offsetWidth;
        step.classList.add('is-flash');
      }
    });
    lastRail = reached;
  }

  function renderAll() {
    renderDraft();
    renderPhone();
    renderBoard();
    renderMetrics();
    renderLog();
    renderRail();
  }

  /* ---------- Acciones ---------- */
  function createOrder() {
    const { items, slot } = state.draft;
    const name = state.draft.name.trim().slice(0, 24);
    if (!itemCount(items) || !name) return null;
    state.counter += 1;
    const order = { id: `M-${state.counter}`, name, items: { ...items }, pickup: roundedFromNow(slotOffsets[slot]), status: 'recibido', prep: 0, chat: [] };
    const total = orderTotal(order.items);
    pushChat(order, 'recibido');
    state.orders.push(order);
    state.stats.orders += 1;
    state.stats.sales += total;
    addLog(`Pedido de ${name} recibido · ${itemCount(order.items)} ${itemCount(order.items) === 1 ? 'producto' : 'productos'} · ${money(total)}`, 'client');
    addLog(`Ticket ${order.id} creado y enviado a la cola de la barra`);
    addLog(`Confirmación enviada por WhatsApp a ${name}: recoge a las ${order.pickup}`);
    addLog(`Venta del día actualizada: ${money(state.stats.sales)}`);
    state.draft = { items: {}, slot: 1, name: '' };
    state.phone = { view: 'track', trackId: order.id };
    pruneOrders();
    freshTicket = order.id;
    logFresh = true;
    save();
    renderAll();
    announce(`Pedido ${order.id} enviado. Aparece en la columna Recibido de la barra.`);
    return order;
  }
  function pruneOrders() {
    const delivered = state.orders.filter((order) => order.status === 'entregado' && order.id !== state.phone.trackId);
    if (delivered.length > 0) state.orders = state.orders.filter((order) => !delivered.includes(order));
  }
  function advance(id) {
    const order = findOrder(id);
    if (!order || order.status === 'entregado') return;
    const next = STATUSES[STATUSES.indexOf(order.status) + 1];
    order.status = next;
    if (next === 'preparando') {
      addLog(`La barra empezó a preparar ${order.id}`, 'team');
      addLog(`Estado actualizado: ${order.name} ya ve “Preparando” en su teléfono`);
      pushChat(order, 'preparando');
    } else if (next === 'listo') {
      order.prep = Math.min(12, 3 + Math.round(itemCount(order.items) * 1.3));
      state.stats.prepSum += order.prep;
      state.stats.prepCount += 1;
      addLog(`La barra marcó ${order.id} como listo`, 'team');
      addLog(`Aviso “tu pedido está listo” enviado por WhatsApp a ${order.name}`);
      addLog(`Tiempo de preparación: ${order.prep} min · promedio del día actualizado`);
      pushChat(order, 'listo');
      if (state.phone.view === 'track' && state.phone.trackId === order.id) showPush(`¡Tu pedido ${order.id} está listo! Te esperamos en la barra.`);
    } else if (next === 'entregado') {
      addLog(`${order.id} entregado a ${order.name} · sale de la cola`, 'team');
      pushChat(order, 'entregado');
      if (state.phone.trackId !== order.id) state.orders = state.orders.filter((item) => item !== order);
    }
    logFresh = true;
    save();
    renderAll();
    announce(`${order.id}: ${next}.`);
  }

  /* ---------- Eventos ---------- */
  productsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-qty]');
    if (button && !button.disabled) changeQty(button.dataset.key, Number(button.dataset.qty));
  });
  slotsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-slot]');
    if (!button) return;
    state.draft.slot = Number(button.dataset.slot);
    save();
    renderDraft();
  });
  nameInput.addEventListener('input', () => {
    state.draft.name = nameInput.value.slice(0, 24);
    save();
    renderDraft();
  });
  nameInput.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !sendButton.disabled) sendButton.click(); });
  sendButton.addEventListener('click', () => createOrder());
  $('[data-again]').addEventListener('click', () => {
    state.phone = { view: 'order', trackId: null };
    pruneOrders();
    save();
    renderAll();
    nameInput.focus({ preventScroll: true });
  });
  barra.addEventListener('click', (event) => {
    const button = event.target.closest('[data-advance]');
    if (button) advance(button.dataset.advance);
  });

  /* ---------- Demostración automática ---------- */
  let run = 0;
  const autoplayButtons = $$('[data-autoplay]');
  const setAutoplayUI = (playing) => {
    document.body.classList.toggle('is-autoplay', playing);
    autoplayButtons.forEach((button) => {
      button.querySelector('[data-autoplay-label]').textContent = playing ? 'Detener demostración' : 'Ver el flujo completo';
      button.setAttribute('aria-pressed', String(playing));
    });
  };
  const stopAutoplay = () => { if (run) { run = 0; setAutoplayUI(false); $$('.is-tapping').forEach((element) => element.classList.remove('is-tapping')); } };
  const wait = (ms, token) => new Promise((resolve, reject) => {
    window.setTimeout(() => (token === run ? resolve() : reject(new Error('stopped'))), reduced.matches ? Math.min(ms, 250) : ms);
  });
  const stacked = () => window.matchMedia('(max-width: 980px)').matches;
  function focusView(element) {
    if (!stacked()) return;
    element.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'center' });
  }
  async function tap(element, token) {
    element.classList.add('is-tapping');
    await wait(260, token);
    element.classList.remove('is-tapping');
  }
  async function autoplay() {
    const token = ++run;
    setAutoplayUI(true);
    try {
      state.phone = { view: 'order', trackId: null };
      state.draft = { items: {}, slot: 1, name: '' };
      pruneOrders();
      save();
      renderAll();
      $('.screen-scroll').scrollTop = 0;
      $('#en-vivo').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      await wait(900, token);
      focusView(phone);
      await wait(400, token);
      for (const [key, times] of [['flatwhite', 2], ['croissant', 1]]) {
        for (let index = 0; index < times; index += 1) {
          const plus = $(`[data-qty="1"][data-key="${key}"]`);
          await tap(plus, token);
          changeQty(key, 1);
          await wait(320, token);
        }
      }
      const scroller = $('.screen-scroll');
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: reduced.matches ? 'auto' : 'smooth' });
      await wait(450, token);
      const slot = $('[data-slot="1"]');
      await tap(slot, token);
      state.draft.slot = 1;
      renderDraft();
      await wait(300, token);
      for (const letter of 'Valentina') {
        state.draft.name += letter;
        renderDraft();
        await wait(70, token);
      }
      save();
      await wait(450, token);
      await tap(sendButton, token);
      const order = createOrder();
      await wait(1500, token);
      focusView(barra);
      await wait(900, token);
      for (const _step of ['preparando', 'listo']) {
        const button = $(`[data-advance="${order.id}"]`);
        if (!button) throw new Error('stopped');
        await tap(button, token);
        advance(order.id);
        await wait(_step === 'preparando' ? 2000 : 600, token);
        if (_step === 'listo') { focusView(phone); await wait(2600, token); }
      }
      focusView(barra);
      await wait(700, token);
      const deliver = $(`[data-advance="${order.id}"]`);
      if (deliver) { await tap(deliver, token); advance(order.id); }
      await wait(600, token);
      if (stacked()) $('.log-card').scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    } catch (_) { /* Detenida por el usuario o por reiniciar. */ }
    if (token === run) { run = 0; setAutoplayUI(false); }
  }
  autoplayButtons.forEach((button) => button.addEventListener('click', () => { if (run) stopAutoplay(); else autoplay(); }));
  // Si la persona toca algo durante la demostración, toma el control.
  $('.views').addEventListener('click', (event) => { if (event.isTrusted && run && event.target.closest('button, input, label')) stopAutoplay(); }, true);
  nameInput.addEventListener('keydown', (event) => { if (event.isTrusted && run) stopAutoplay(); });

  $('[data-reset]').addEventListener('click', () => {
    stopAutoplay();
    state = seed();
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Sin almacenamiento disponible. */ }
    push.hidden = true;
    lastRail = -1;
    renderSlots();
    renderAll();
    announce('Ejemplo reiniciado.');
  });

  /* ---------- Reloj ---------- */
  function tickClock() {
    const now = hhmm(new Date());
    $$('[data-clock]').forEach((element) => { element.textContent = now; });
  }
  buildProducts();
  renderSlots();
  tickClock();
  renderAll();
  window.setInterval(() => {
    tickClock();
    renderSlots();
    renderDraft();
    // Solo el texto de tiempo: así no se pierde el foco del teclado en la barra.
    $$('[data-ticket]').forEach((ticket) => {
      const order = findOrder(ticket.dataset.ticket);
      if (!order) return;
      ticket.querySelector('.ticket-due').textContent = dueText(order);
      ticket.classList.toggle('is-due', order.status !== 'listo' && minutesUntil(order.pickup) <= 3);
    });
  }, 30000);
})();
