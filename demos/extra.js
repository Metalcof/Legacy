'use strict';

(() => {
  const config = window.SITE_CONFIG || {};
  const studio = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Cromathic Studio';
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = studio; });
  document.title = document.title.replace('Cromathic Studio', studio);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = description.content.replace('Cromathic Studio', studio);
  const phone = String(config.phone || '573185314299').replace(/\D/g, '');
  document.querySelectorAll('[data-studio-contact]').forEach(link => {
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, ${studio}. Me gustaría crear una página personal con un diseño como este portfolio.`)}`;
  });

  const byId = id => document.getElementById(id);
  const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  };
  const money = amount => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const today = ['year', 'month', 'day'].map(type => dateParts.find(part => part.type === type).value).join('-');
  const prettyDate = value => new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00-05:00`));
  const details = (container, pairs) => {
    container.replaceChildren();
    pairs.forEach(([label, value]) => {
      const row = element('div');
      row.append(element('dt', label), element('dd', value));
      container.append(row);
    });
  };
  const emptyTable = (body, columns, text) => {
    const row = element('tr');
    const cell = element('td', text, 'table-empty');
    cell.colSpan = columns;
    row.append(cell);
    body.replaceChildren(row);
  };

  const darkTheme = document.body.classList.contains('restaurant') || document.body.classList.contains('automation');
  const themeColors = darkTheme
    ? { green: '#91dfb0', cyan: '#83ddeb', violet: '#caa8ff' }
    : { green: '#336b4b', cyan: '#176776', violet: '#6848ab' };
  const themeButtons = [...document.querySelectorAll('[data-theme]')];
  themeButtons.forEach(button => button.addEventListener('click', () => {
    const theme = button.dataset.theme;
    if (theme === 'original') document.body.style.removeProperty('--accent');
    else if (Object.hasOwn(themeColors, theme)) document.body.style.setProperty('--accent', themeColors[theme]);
    themeButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));

  // A calendar is local to its page. No external calendars, messages or real bookings are used.
  function initializeCalendar(prefix, seedOccupied = false) {
    const form = byId(`${prefix}-form`);
    if (!form) return null;
    const nameInput = byId(`${prefix}-name`);
    const serviceInput = byId(`${prefix}-service`);
    const dateInput = byId(`${prefix}-date`);
    const times = byId(`${prefix}-times`);
    const output = byId(`${prefix}-result`);
    const cancelButton = byId(`${prefix}-cancel`);
    const resetButton = byId(`${prefix}-reset`);
    const status = byId(`${prefix}-status`);
    const submit = form.querySelector('[type="submit"]');
    const slots = ['09:00', '10:00', '11:00', '14:00', '15:00'];
    const fixedOccupied = seedOccupied ? new Set([`${today}|10:00`]) : new Set();
    let records = [];
    let selected = '09:00';
    let sequence = 1;
    dateInput.min = today;
    dateInput.defaultValue = today;
    dateInput.value = today;

    const occupied = time => fixedOccupied.has(`${dateInput.value}|${time}`) || records.some(record => record.date === dateInput.value && record.time === time);
    function renderTimes(focusSelected = false) {
      const available = slots.filter(time => !occupied(time));
      if (!available.includes(selected)) selected = available[0] || null;
      times.replaceChildren();
      slots.forEach(time => {
        const busy = occupied(time);
        const button = element('button', busy ? `${time} · ocupado` : time, 'time-button');
        button.type = 'button';
        button.dataset.time = time;
        button.disabled = busy;
        button.setAttribute('aria-label', `${time}, ${busy ? 'horario ocupado' : 'horario disponible'}`);
        button.setAttribute('aria-pressed', String(time === selected));
        times.append(button);
      });
      submit.disabled = !selected;
      if (focusSelected && selected) times.querySelector(`[data-time="${selected}"]`).focus({ preventScroll: true });
      if (!selected && document.activeElement === submit) dateInput.focus({ preventScroll: true });
    }
    function renderConfirmation() {
      const last = records.at(-1);
      output.hidden = !last;
      cancelButton.disabled = !last;
      const placeholder = byId(`${prefix}-placeholder`);
      if (placeholder) placeholder.hidden = Boolean(last);
      if (last) {
        const confirmation = prefix === 'clinic'
          ? `${last.name}, este ejemplo muestra tu espacio para ${last.service.toLowerCase()}. No representa una cita real.`
          : `Hola, ${last.name}. Tu reunión de ejemplo queda preparada para el ${prettyDate(last.date)} a las ${last.time}, hora de Colombia. Este mensaje no se envía a nadie.`;
        byId(`${prefix}-confirmation`).textContent = confirmation;
        details(byId(`${prefix}-details`), [['Referencia local', last.id], ['Servicio', last.service], ['Día', prettyDate(last.date)], ['Hora de Colombia', last.time], ['Duración', '30 minutos']]);
      }
      const count = byId(`${prefix}-count`);
      if (count) count.textContent = records.length;
    }
    times.addEventListener('click', event => {
      const button = event.target.closest('[data-time]');
      if (!button || button.disabled) return;
      selected = button.dataset.time;
      renderTimes(true);
    });
    dateInput.addEventListener('change', () => {
      selected = null;
      renderTimes();
      status.textContent = dateInput.value ? `Disponibilidad de ejemplo para el ${prettyDate(dateInput.value)}.` : 'Selecciona un día para ver los horarios.';
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const name = nameInput.value.trim();
      if (!name) { status.textContent = 'Escribe un nombre ficticio para el ejemplo.'; nameInput.focus(); return; }
      if (!dateInput.value || dateInput.value < today) { status.textContent = 'Elige hoy o un día posterior.'; dateInput.focus(); return; }
      if (!selected || occupied(selected)) { status.textContent = 'Elige un horario disponible.'; renderTimes(); return; }
      const record = { id: `${prefix === 'clinic' ? 'ALMA' : 'SIM'}-${String(sequence++).padStart(3, '0')}`, name, service: serviceInput.value, date: dateInput.value, time: selected };
      records.push(record);
      renderConfirmation();
      renderTimes();
      status.textContent = `Reserva de ejemplo creada: ${prettyDate(record.date)}, ${record.time}. Ese horario aparece ahora como ocupado.`;
    });
    cancelButton.addEventListener('click', () => {
      const removed = records.pop();
      if (!removed) return;
      if (removed.date === dateInput.value) selected = removed.time;
      renderConfirmation();
      renderTimes();
      status.textContent = `La reserva ${removed.id} se canceló. Su horario vuelve a estar disponible.`;
      if (cancelButton.disabled || output.hidden) dateInput.focus({ preventScroll: true });
    });
    function reset(announce = true) {
      records = [];
      sequence = 1;
      form.reset();
      dateInput.value = today;
      selected = '09:00';
      renderConfirmation();
      renderTimes();
      status.textContent = announce ? 'Agenda local reiniciada. Puedes crear un nuevo ejemplo.' : '';
    }
    if (resetButton) resetButton.addEventListener('click', () => reset());
    renderTimes();
    renderConfirmation();
    return { reset, serviceInput, dateInput };
  }

  const clinic = initializeCalendar('clinic');
  document.querySelectorAll('[data-clinic-service]').forEach(button => button.addEventListener('click', () => {
    if (!clinic) return;
    clinic.serviceInput.value = button.dataset.clinicService;
    byId('agenda').scrollIntoView({ block: 'start', behavior: 'auto' });
    clinic.dateInput.focus({ preventScroll: true });
  }));
  const booking = initializeCalendar('booking', true);

  // LUMBRE: pedido de ejemplo con cajón lateral. Todo ocurre en esta página; nada se cobra ni se envía.
  if (byId('lumbre-cart')) {
    const storageKey = 'nexo-lumbre-demo-order-v1';
    const maxQuantity = 12;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const calm = () => reducedMotion.matches;
    const wide = window.matchMedia('(min-width: 801px)');
    const ease = 'cubic-bezier(.32,.72,0,1)';
    const dishes = {
      tostadas: { name: 'Tostadas de la huerta', price: 24000, note: 'Pan artesanal · tomates asados', image: 'case-restaurant-tostadas' },
      pesca: { name: 'Pesca al fuego', price: 48000, note: 'A la parrilla · toque de cítricos', image: 'case-restaurant-fish' },
      arroz: { name: 'Arroz de la tierra', price: 39000, note: 'Cremoso · hongos y hierbas', image: 'case-restaurant-rice' },
      cacao: { name: 'Cacao y memoria', price: 21000, note: 'Chocolate oscuro · crema suave', image: 'case-restaurant-cacao' }
    };
    const modes = {
      recoger: { label: 'Recoger en el local', fee: 0, eta: 'listo en 25 min' },
      domicilio: { label: 'Domicilio', fee: 6000, eta: 'llega en 40–50 min' }
    };
    const icons = {
      trash: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>',
      minus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12"/></svg>',
      plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M6 12h12M12 6v12"/></svg>'
    };

    const dialog = byId('lumbre-cart');
    const panel = dialog.querySelector('.cart-panel');
    const list = byId('cart-lines');
    const emptyView = byId('cart-empty');
    const doneView = byId('cart-done');
    const summary = byId('cart-summary');
    const sendButton = byId('cart-send');
    const clearButton = byId('cart-clear');
    const totalNode = byId('cart-total');
    const toast = byId('cart-toast');
    const toastText = byId('cart-toast-text');
    const toastUndo = byId('cart-toast-undo');
    const toastTimer = toast.querySelector('.cart-toast-timer');
    const pageLive = byId('restaurant-status');
    const cartLive = byId('cart-live');
    const headerTrigger = document.querySelector('.cart-trigger');
    const fab = document.querySelector('.cart-fab');
    const modeInputs = [...dialog.querySelectorAll('input[name="lumbre-mode"]')];

    let order = { items: [], mode: 'recoger' };
    let view = 'cart';
    let undoAction = null;
    let timerAnimation = null;
    let afterClose = null;
    let closing = null;

    const findItem = id => order.items.find(item => item.id === id);
    const count = () => order.items.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = () => order.items.reduce((sum, item) => sum + dishes[item.id].price * item.qty, 0);
    const deliveryFee = () => (order.items.length ? modes[order.mode].fee : 0);
    const grandTotal = () => subtotal() + deliveryFee();
    const plates = amount => `${amount} ${amount === 1 ? 'plato' : 'platos'}`;
    const play = (node, keyframes, options) => (!node || calm() || !node.isConnected ? null : node.animate(keyframes, options));

    function load() {
      try {
        const data = JSON.parse(localStorage.getItem(storageKey) || 'null');
        if (!data || typeof data !== 'object') return;
        const seen = new Set();
        const items = (Array.isArray(data.items) ? data.items : []).flatMap(item => {
          const id = item && typeof item.id === 'string' ? item.id : '';
          const qty = Math.min(maxQuantity, Math.floor(Number(item?.qty)));
          if (!Object.hasOwn(dishes, id) || seen.has(id) || !(qty >= 1)) return [];
          seen.add(id);
          return [{ id, qty }];
        });
        order = { items, mode: Object.hasOwn(modes, data.mode) ? data.mode : 'recoger' };
      } catch {
        order = { items: [], mode: 'recoger' };
      }
    }
    function save() {
      try { localStorage.setItem(storageKey, JSON.stringify({ v: 1, items: order.items, mode: order.mode })); } catch { /* Sin almacenamiento, el pedido sigue funcionando en memoria. */ }
    }
    function announce(text) {
      const region = dialog.open ? cartLive : pageLive;
      region.textContent = '';
      window.setTimeout(() => { region.textContent = text; }, 60);
    }

    function iconButton(className, label, icon, action, id) {
      const button = element('button', undefined, className);
      button.type = 'button';
      button.innerHTML = icon;
      button.setAttribute('aria-label', label);
      button.dataset.cartAction = action;
      button.dataset.dishId = id;
      return button;
    }
    function createLine(id) {
      const dish = dishes[id];
      const line = element('li', undefined, 'cart-line');
      line.dataset.line = id;
      const inner = element('div', undefined, 'cart-line-inner');
      const thumb = element('img', undefined, 'cart-line-thumb');
      Object.assign(thumb, { src: `../assets/${dish.image}-small.webp`, alt: '', width: 76, height: 76, decoding: 'async' });
      const info = element('div', undefined, 'cart-line-info');
      info.append(element('p', dish.name, 'cart-line-name'), element('p', dish.note, 'cart-line-note'), element('p', `${money(dish.price)} c/u`, 'cart-line-unit'));
      const stepper = element('div', undefined, 'cart-stepper');
      stepper.setAttribute('role', 'group');
      stepper.setAttribute('aria-label', `Cantidad de ${dish.name}`);
      stepper.append(iconButton('cart-step', `Quitar una unidad de ${dish.name}`, icons.minus, 'minus', id), element('span', '1', 'cart-qty'), iconButton('cart-step', `Agregar una unidad de ${dish.name}`, icons.plus, 'plus', id));
      inner.append(thumb, info, iconButton('cart-remove', `Eliminar ${dish.name}`, icons.trash, 'remove', id), stepper, element('strong', '', 'cart-line-total'));
      line.append(inner);
      return line;
    }
    function updateLine(line, item) {
      const dish = dishes[item.id];
      line.querySelector('.cart-qty').textContent = item.qty;
      line.querySelector('.cart-line-total').textContent = money(dish.price * item.qty);
      line.querySelector('[data-cart-action="plus"]').disabled = item.qty >= maxQuantity;
      line.querySelector('[data-cart-action="minus"]').setAttribute('aria-label', item.qty === 1 ? `Quitar una unidad y eliminar ${dish.name}` : `Quitar una unidad de ${dish.name}`);
    }
    function enter(line) {
      line.classList.add('is-moving');
      const height = line.offsetHeight;
      const animation = play(line, [{ height: '0px', opacity: 0, transform: 'translateX(18px)' }, { height: `${height}px`, opacity: 1, transform: 'none' }], { duration: 380, easing: ease });
      if (!animation) { line.classList.remove('is-moving'); return; }
      animation.finished.then(() => line.classList.remove('is-moving'), () => {});
    }
    function leave(line, delay = 0) {
      line.classList.add('is-leaving', 'is-moving');
      const height = line.offsetHeight;
      const animation = play(line, [
        { height: `${height}px`, opacity: 1, transform: 'none' },
        { height: `${height}px`, opacity: 0, transform: 'translateX(32px)', offset: .5 },
        { height: '0px', opacity: 0, transform: 'translateX(32px)' }
      ], { duration: 440, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      line.leaveAnimation = animation;
      if (!animation) { line.remove(); return Promise.resolve(); }
      return animation.finished.then(() => { if (line.classList.contains('is-leaving')) line.remove(); }, () => {});
    }
    // Una fila por plato, sin reconstruir la lista, para que entradas y salidas se animen.
    function syncLines(entering = []) {
      const wanted = new Set(order.items.map(item => item.id));
      [...list.children].forEach(line => { if (!wanted.has(line.dataset.line) && !line.classList.contains('is-leaving')) line.remove(); });
      let previous = null;
      order.items.forEach(item => {
        let line = list.querySelector(`[data-line="${item.id}"]`);
        let isNew = !line;
        if (line?.classList.contains('is-leaving')) {
          line.leaveAnimation?.cancel();
          line.classList.remove('is-leaving', 'is-moving');
          isNew = true;
        }
        line ||= createLine(item.id);
        const reference = previous ? previous.nextElementSibling : list.firstElementChild;
        if (reference !== line) list.insertBefore(line, reference);
        updateLine(line, item);
        if (isNew && entering.includes(item.id) && dialog.open) enter(line);
        previous = line;
      });
    }
    function placeToast() {
      if (dialog.open) {
        if (toast.parentElement !== panel) panel.append(toast);
        toast.style.setProperty('--toast-offset', `${summary.hidden ? 0 : summary.offsetHeight}px`);
      } else if (toast.parentElement !== document.body) {
        document.body.append(toast);
      }
    }
    function refreshViews() {
      const hasItems = order.items.length > 0;
      const leaving = Boolean(list.querySelector('.is-leaving'));
      list.hidden = view === 'done' || (!hasItems && !leaving);
      emptyView.hidden = view === 'done' || hasItems || leaving;
      doneView.hidden = view !== 'done';
      summary.hidden = view === 'done' || (!hasItems && !leaving);
      if (!toast.hidden) placeToast();
    }
    function renderTotals() {
      const amount = count();
      const total = grandTotal();
      const totalText = money(total);
      document.querySelectorAll('[data-cart-count]').forEach(badge => { badge.textContent = amount; badge.hidden = amount === 0; });
      document.querySelectorAll('[data-cart-total-mini]').forEach(node => { node.textContent = totalText; node.hidden = amount === 0; });
      [headerTrigger, fab].forEach(trigger => trigger.setAttribute('aria-label', amount ? `Abrir tu pedido: ${plates(amount)}, ${totalText}` : 'Abrir tu pedido, vacío'));
      byId('cart-title-count').textContent = amount ? `(${amount})` : '';
      byId('cart-subtotal').textContent = money(subtotal());
      byId('cart-delivery-label').textContent = modes[order.mode].label;
      byId('cart-delivery').textContent = deliveryFee() ? money(deliveryFee()) : 'Sin costo';
      if (totalNode.textContent !== totalText) {
        totalNode.textContent = totalText;
        if (dialog.open) play(totalNode, [{ opacity: .35, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: ease });
      }
      sendButton.querySelector('.cart-send-label').textContent = amount ? `Enviar pedido · ${totalText}` : 'Enviar pedido';
      sendButton.disabled = !amount || sendButton.classList.contains('is-loading');
      clearButton.disabled = !amount;
      modeInputs.forEach(input => { input.checked = input.value === order.mode; });
      renderMini(totalText);
    }
    function renderMini(totalText) {
      const mini = byId('restaurant-items');
      mini.replaceChildren();
      if (!order.items.length) mini.append(element('li', 'Tu pedido empieza con algo que te apetezca.', 'order-empty'));
      order.items.forEach(item => {
        const dish = dishes[item.id];
        const row = element('li');
        row.dataset.mini = item.id;
        const thumb = element('img');
        Object.assign(thumb, { src: `../assets/${dish.image}-small.webp`, alt: '', width: 40, height: 40, loading: 'lazy', decoding: 'async' });
        const name = element('span', undefined, 'order-mini-name');
        name.append(element('span', `${item.qty} ×`, 'order-mini-qty'), document.createTextNode(` ${dish.name}`));
        row.append(thumb, name, element('span', money(dish.price * item.qty), 'order-mini-price'));
        mini.append(row);
      });
      byId('restaurant-total').textContent = totalText;
    }
    function commit(entering = []) {
      save();
      syncLines(entering);
      renderTotals();
      refreshViews();
    }

    function showToast(text, onUndo = null) {
      undoAction = onUndo;
      toastText.textContent = text;
      toastUndo.hidden = !onUndo;
      toast.getAnimations().forEach(animation => animation.cancel());
      const wasHidden = toast.hidden;
      toast.hidden = false;
      placeToast();
      if (wasHidden) play(toast, [{ opacity: 0, transform: 'translateY(14px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: ease });
      timerAnimation?.cancel();
      timerAnimation = toastTimer.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: onUndo ? 5000 : 3000, fill: 'forwards' });
      timerAnimation.finished.then(() => hideToast(), () => {});
    }
    function hideToast() {
      timerAnimation?.cancel();
      timerAnimation = null;
      undoAction = null;
      if (toast.hidden) return;
      const finish = () => {
        const hadFocus = toast.contains(document.activeElement);
        toast.hidden = true;
        toast.getAnimations().forEach(animation => animation.cancel());
        if (hadFocus) focusInsideCart();
      };
      const exit = play(toast, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      if (exit) exit.finished.then(finish, () => {});
      else finish();
    }
    function focusInsideCart() {
      if (!dialog.open) return;
      const target = list.querySelector('.cart-line:not(.is-leaving) .cart-remove') || (!emptyView.hidden && emptyView.querySelector('button')) || dialog.querySelector('.cart-close');
      target.focus({ preventScroll: true });
    }

    function addDish(id) {
      const item = findItem(id);
      if (item && item.qty >= maxQuantity) {
        showToast(`Máximo ${maxQuantity} unidades por plato en esta demo.`);
        announce(`Máximo ${maxQuantity} unidades de ${dishes[id].name} en esta demo.`);
        return false;
      }
      if (item) item.qty += 1;
      else order.items.push({ id, qty: 1 });
      view = 'cart';
      commit([id]);
      announce(`${dishes[id].name} agregado. ${plates(count())} en tu pedido, total ${money(grandTotal())}.`);
      return true;
    }
    function removeLine(id) {
      const index = order.items.findIndex(item => item.id === id);
      if (index < 0) return;
      const [removed] = order.items.splice(index, 1);
      const line = list.querySelector(`[data-line="${id}"]`);
      const hadFocus = Boolean(line?.contains(document.activeElement));
      const visible = [...list.querySelectorAll('.cart-line:not(.is-leaving)')];
      const position = visible.indexOf(line);
      const neighbor = visible[position + 1] || visible[position - 1];
      save();
      renderTotals();
      if (line) leave(line).then(refreshViews);
      refreshViews();
      showToast(`${dishes[id].name} eliminado`, () => {
        const existing = findItem(id);
        if (existing) existing.qty = Math.min(maxQuantity, existing.qty + removed.qty);
        else order.items.splice(Math.min(index, order.items.length), 0, removed);
        return [id];
      });
      announce(`${dishes[id].name} eliminado del pedido. Puedes deshacerlo durante unos segundos.`);
      if (hadFocus) (neighbor?.querySelector('.cart-remove') || toastUndo).focus({ preventScroll: true });
    }
    function clearOrder() {
      if (!order.items.length) return;
      const snapshot = order.items.map(item => ({ ...item }));
      order.items = [];
      save();
      renderTotals();
      const lines = [...list.querySelectorAll('.cart-line:not(.is-leaving)')];
      Promise.all(lines.map((line, position) => leave(line, position * 50))).then(refreshViews);
      refreshViews();
      showToast('Pedido vaciado', () => {
        snapshot.forEach(saved => {
          const existing = findItem(saved.id);
          if (existing) existing.qty = Math.min(maxQuantity, existing.qty + saved.qty);
        });
        order.items = [...snapshot.filter(saved => !findItem(saved.id)), ...order.items];
        return snapshot.map(saved => saved.id);
      });
      announce('Pedido vaciado. Puedes deshacerlo durante unos segundos.');
      toastUndo.focus({ preventScroll: true });
    }
    function changeQuantity(id, step) {
      const item = findItem(id);
      if (!item) return;
      if (step < 0 && item.qty === 1) { removeLine(id); return; }
      const next = Math.min(maxQuantity, item.qty + step);
      if (next === item.qty) return;
      item.qty = next;
      commit();
      play(list.querySelector(`[data-line="${id}"] .cart-qty`), [{ opacity: 0, transform: `translateY(${step > 0 ? 8 : -8}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: ease });
      announce(`${dishes[id].name}: ${item.qty} ${item.qty === 1 ? 'unidad' : 'unidades'}. Total ${money(grandTotal())}.`);
    }

    function openCart() {
      closing?.finish(false);
      if (!dialog.open) dialog.showModal();
      syncLines();
      refreshViews();
      placeToast();
    }
    // Cierra con animación; si la animación no llega a terminar, un temporizador cierra igual.
    function closeCart(then = null) {
      afterClose = then;
      if (!dialog.open) { runAfterClose(); return; }
      if (closing) return;
      let done = false;
      let timer = 0;
      const onEnd = event => { if (event.target === panel) finish(); };
      const finish = (shouldClose = true) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        panel.removeEventListener('animationend', onEnd);
        dialog.classList.remove('is-closing');
        closing = null;
        if (shouldClose) dialog.close();
      };
      closing = { finish };
      if (calm()) { finish(); return; }
      dialog.classList.add('is-closing');
      panel.addEventListener('animationend', onEnd);
      timer = window.setTimeout(finish, 420);
    }
    function runAfterClose() {
      const callback = afterClose;
      afterClose = null;
      callback?.();
    }
    function goToMenu() {
      closeCart(() => {
        byId('carta').scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' });
        const first = [...document.querySelectorAll('[data-add-dish]')].find(button => !button.closest('[data-dish-category]').hidden);
        first?.focus({ preventScroll: true });
      });
    }

    function pressFeedback(button) {
      play(button, [{ transform: 'scale(1)' }, { transform: 'scale(.92)', offset: .35 }, { transform: 'scale(1.04)', offset: .7 }, { transform: 'scale(1)' }], { duration: 380, easing: 'ease-out' });
      button.classList.add('is-added');
      window.clearTimeout(button.addedTimer);
      button.addedTimer = window.setTimeout(() => button.classList.remove('is-added'), 1300);
    }
    function bump(target) {
      play(target.querySelector('.cart-badge'), [{ transform: 'scale(1)' }, { transform: 'scale(1.4)', offset: .4 }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)' });
      play(target.querySelector('svg'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-12deg)', offset: .3 }, { transform: 'rotate(8deg)', offset: .65 }, { transform: 'rotate(0)' }], { duration: 460, easing: 'ease-out' });
    }
    const inView = node => {
      const rect = node?.getBoundingClientRect();
      return Boolean(rect && rect.width && rect.top >= 0 && rect.bottom <= window.innerHeight);
    };
    // Destino del vuelo: la cabecera si se ve; en pantallas amplias, el resumen junto a la carta; si no, el botón flotante.
    function flightTarget(id) {
      const miniImage = byId('restaurant-items').querySelector(`[data-mini="${id}"] img`);
      if (inView(headerTrigger)) return { node: headerTrigger.querySelector('svg'), land: () => bump(headerTrigger) };
      if (wide.matches && inView(miniImage)) {
        return { node: miniImage, land: () => {
          play(byId('restaurant-items').querySelector(`[data-mini="${id}"] img`), [{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.5,.5,1)' });
          play(byId('restaurant-total'), [{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 360, easing: ease });
        } };
      }
      if (!fab.classList.contains('is-visible')) return { node: headerTrigger.querySelector('svg'), land: () => bump(headerTrigger) };
      return { node: fab.querySelector('svg'), land: () => bump(fab) };
    }
    // El plato vuela hasta el pedido con un arco suave: solo transformaciones.
    function flyToCart(image, id) {
      const target = flightTarget(id);
      const from = image?.getBoundingClientRect();
      const to = target.node.getBoundingClientRect();
      if (calm() || !from || !from.width || from.bottom < 0 || from.top > window.innerHeight || !to.width) { target.land(); return; }
      const size = 84;
      const endScale = Math.min(.6, Math.max(.22, to.width / size));
      const startX = from.left + from.width / 2 - size / 2;
      const startY = from.top + from.height / 2 - size / 2;
      const dx = to.left + to.width / 2 - size / 2 - startX;
      const dy = to.top + to.height / 2 - size / 2 - startY;
      const flyer = element('div', undefined, 'cart-fly');
      flyer.style.left = `${startX}px`;
      flyer.style.top = `${startY}px`;
      const lift = element('div');
      const clone = element('img');
      Object.assign(clone, { src: image.currentSrc || image.src, alt: '' });
      lift.append(clone);
      flyer.append(lift);
      document.body.append(flyer);
      const duration = 620;
      const upward = dy < 0;
      flyer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration, easing: upward ? 'cubic-bezier(.55,0,.45,1)' : 'cubic-bezier(.3,.55,.4,1)', fill: 'forwards' });
      lift.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${dy}px)` }], { duration, easing: upward ? 'cubic-bezier(.25,.7,.35,1)' : 'cubic-bezier(.55,-0.45,.75,.9)', fill: 'forwards' });
      clone.animate([
        { transform: 'scale(.55)', opacity: 0 },
        { transform: 'scale(1.06)', opacity: 1, offset: .18 },
        { transform: 'scale(.85)', opacity: 1, offset: .55 },
        { transform: `scale(${endScale + .06})`, opacity: .95, offset: .9 },
        { transform: `scale(${endScale})`, opacity: 0 }
      ], { duration, fill: 'forwards' }).finished.then(() => { flyer.remove(); target.land(); }, () => flyer.remove());
    }

    load();
    syncLines();
    renderTotals();
    refreshViews();

    document.querySelectorAll('[data-cart-open]').forEach(button => button.addEventListener('click', openCart));
    dialog.querySelectorAll('[data-cart-close]').forEach(button => button.addEventListener('click', () => closeCart()));
    dialog.querySelectorAll('[data-cart-menu]').forEach(button => button.addEventListener('click', goToMenu));
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeCart(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) closeCart(); });
    dialog.addEventListener('close', () => {
      if (view === 'done') view = 'cart';
      placeToast();
      refreshViews();
      runAfterClose();
    });
    list.addEventListener('click', event => {
      const button = event.target.closest('[data-cart-action]');
      if (!button || button.disabled) return;
      const { cartAction: action, dishId: id } = button.dataset;
      if (action === 'remove') removeLine(id);
      else changeQuantity(id, action === 'plus' ? 1 : -1);
    });
    modeInputs.forEach(input => input.addEventListener('change', () => {
      if (!input.checked || !Object.hasOwn(modes, input.value)) return;
      order.mode = input.value;
      save();
      renderTotals();
      announce(`${modes[order.mode].label}: ${deliveryFee() ? `entrega ${money(deliveryFee())}` : 'sin costo'}. Total ${money(grandTotal())}.`);
    }));
    clearButton.addEventListener('click', clearOrder);
    toastUndo.addEventListener('click', () => {
      const restore = undoAction;
      if (!restore) return;
      const restored = restore();
      view = 'cart';
      commit(restored);
      const focusTarget = list.querySelector(`[data-line="${restored[0]}"] .cart-remove`);
      if (toast.contains(document.activeElement) && focusTarget) focusTarget.focus({ preventScroll: true });
      hideToast();
      announce(`Restaurado. ${plates(count())} en tu pedido, total ${money(grandTotal())}.`);
    });
    ['pointerenter', 'focusin'].forEach(type => toast.addEventListener(type, () => timerAnimation?.pause()));
    ['pointerleave', 'focusout'].forEach(type => toast.addEventListener(type, () => {
      window.setTimeout(() => { if (!toast.matches(':hover') && !toast.contains(document.activeElement)) timerAnimation?.play(); });
    }));
    sendButton.addEventListener('click', () => {
      if (!order.items.length || sendButton.classList.contains('is-loading')) return;
      const code = `LUM-${Math.floor(100 + Math.random() * 900)}`;
      const recap = [['Platos', plates(count())], ['Entrega', `${modes[order.mode].label} · ${modes[order.mode].eta}`], ['Total', money(grandTotal())]];
      sendButton.classList.add('is-loading');
      sendButton.disabled = true;
      sendButton.setAttribute('aria-busy', 'true');
      window.setTimeout(() => {
        sendButton.classList.remove('is-loading');
        sendButton.removeAttribute('aria-busy');
        hideToast();
        byId('cart-done-code').textContent = `Pedido de ejemplo ${code}`;
        details(byId('cart-done-details'), recap);
        order.items = [];
        list.replaceChildren();
        view = 'done';
        save();
        renderTotals();
        refreshViews();
        if (dialog.open) doneView.focus({ preventScroll: true });
        announce(`Pedido de ejemplo ${code}. Esto es una demo: no se cobra ni se envía nada.`);
      }, calm() ? 0 : 700);
    });
    document.querySelectorAll('[data-add-dish]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.addDish;
      if (!Object.hasOwn(dishes, id) || !addDish(id)) return;
      pressFeedback(button);
      flyToCart(button.closest('.dish')?.querySelector('.dish-photo img'), id);
    }));
    document.querySelectorAll('[data-dish-filter]').forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.dishFilter;
      document.querySelectorAll('[data-dish-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      document.querySelectorAll('[data-dish-category]').forEach(dish => { dish.hidden = category !== 'all' && dish.dataset.dishCategory !== category; });
    }));
    // El botón flotante aparece cuando la cabecera sale de la vista. En pantallas amplias se retira
    // mientras el resumen junto a la carta está a la vista, para no taparlo.
    const seen = { header: true, card: false };
    const orderCard = byId('pedido');
    const updateFab = () => {
      const show = !seen.header && !(wide.matches && seen.card);
      fab.classList.toggle('is-visible', show);
      fab.inert = !show;
    };
    if ('IntersectionObserver' in window) {
      const watcher = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.target === headerTrigger) seen.header = entry.isIntersecting;
          else seen.card = entry.isIntersecting && entry.intersectionRatio >= .5;
        });
        updateFab();
      }, { threshold: [0, .5, 1] });
      watcher.observe(headerTrigger);
      if (orderCard) watcher.observe(orderCard);
    } else {
      seen.header = false;
    }
    wide.addEventListener('change', updateFab);
    updateFab();
    window.addEventListener('storage', event => {
      if (event.key !== storageKey) return;
      load();
      syncLines();
      renderTotals();
      refreshViews();
    });
  }

  if (byId('portfolio-dialog')) {
    const cases = {
      botanica: { title: 'Raíz. Un ritual que empieza en los detalles.', description: 'Una marca de cosmética botánica quería reunir su origen natural y una presencia más contemporánea. La dirección parte de un gesto sencillo: convertir la rutina diaria en un momento propio. Tonos de piedra y hojas, vidrio ámbar y una fotografía que deja hablar a los materiales.', deliverables: ['Un relato de marca alrededor del ritual cotidiano y el origen botánico.', 'Paleta natural, tipografía editorial y dirección de packaging.', 'Fotografía de producto y una estructura de catálogo fácil de recorrer.'], image: 'case-personal-cosmetics', alt: 'Dirección visual de Raíz con cosmética botánica en vidrio ámbar y packaging neutro', link: 'auto-personal.html' },
      hotel: { title: 'Casa Nativa. Una invitación a otro ritmo.', description: 'Un hotel boutique en el paisaje cafetero necesitaba contar lo que lo hace particular: un patio vivo, materiales cálidos y una hospitalidad cercana. La propuesta organiza la historia alrededor de la llegada, los espacios y el tiempo de quedarse, con una mirada editorial que permite imaginar la visita.', deliverables: ['Narrativa de hospitalidad y un tono cercano para la marca.', 'Dirección fotográfica del patio, los materiales y el ambiente.', 'Arquitectura de contenido para habitaciones, experiencias y consultas.'], image: 'case-personal-hotel', alt: 'Patio de Casa Nativa, un hotel boutique con arcos cálidos y vegetación tropical', link: 'auto-personal.html' },
      taller: { title: 'Ideas en Mesa. La claridad se construye conversando.', description: 'Un servicio de talleres creativos buscaba explicar qué ocurre cuando varias miradas se encuentran alrededor de una idea. La dirección pone el proceso al frente: una pregunta compartida, materiales sencillos y decisiones que toman forma en equipo. Una identidad flexible para sesiones, programas y propuestas.', deliverables: ['Una propuesta de valor clara para talleres y consultoría creativa.', 'Sistema visual para sesiones, materiales y presentaciones.', 'Contenido que conecta el primer contacto, la propuesta y el seguimiento.'], image: 'case-personal-workshop', alt: 'Sesión de Ideas en Mesa con tres adultos ficticios, libretas y notas de trabajo', link: 'auto-personal.html' }
    };
    const dialog = byId('portfolio-dialog');
    let opener = null;
    document.querySelectorAll('[data-portfolio-case]').forEach(button => button.addEventListener('click', () => {
      const item = cases[button.dataset.portfolioCase];
      if (!item) return;
      opener = button;
      byId('portfolio-case-title').textContent = item.title;
      byId('portfolio-case-description').textContent = item.description;
      byId('portfolio-case-link').href = item.link;
      const image = byId('portfolio-case-image');
      image.src = `../assets/${item.image}.webp`;
      image.srcset = `../assets/${item.image}-small.webp 800w, ../assets/${item.image}.webp 1600w`;
      image.sizes = '(max-width:800px) 90vw, 680px';
      image.alt = `${item.alt}, fotografía creada con IA`;
      byId('portfolio-case-deliverables').replaceChildren(...item.deliverables.map(text => element('li', text)));
      dialog.showModal();
    }));
    byId('portfolio-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
  }

  let resetLeads = null;
  if (byId('lead-form')) {
    const form = byId('lead-form');
    const inbox = byId('lead-inbox');
    const status = byId('lead-status');
    const response = byId('lead-response');
    const projects = { web: ['Página web', 'Equipo web'], tienda: ['Tienda online', 'Equipo de tiendas'], auto: ['Automatización', 'Equipo de procesos'] };
    let leads = [];
    function renderInbox() {
      inbox.replaceChildren();
      if (!leads.length) emptyTable(inbox, 4, 'Todavía no hay consultas en esta sesión.');
      leads.forEach(lead => {
        const row = element('tr');
        const priority = element('td');
        priority.append(element('span', lead.priority, `priority-tag ${lead.level}`));
        row.append(element('td', lead.name), element('td', lead.project), priority, element('td', lead.destination));
        inbox.append(row);
      });
      byId('lead-count').textContent = leads.length;
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const values = new FormData(form);
      const name = String(values.get('name') || '').trim();
      if (!name) { status.textContent = 'Usa un nombre ficticio para crear la consulta.'; byId('lead-name').focus(); return; }
      const [project, destination] = projects[values.get('type')];
      const high = values.get('budget') === 'definido' && values.get('timeline') === 'este-mes';
      const medium = !high && values.get('budget') !== 'explorar';
      const priority = high ? 'Alta' : medium ? 'Seguimiento' : 'Orientación inicial';
      const level = high ? 'high' : medium ? 'medium' : 'initial';
      leads.unshift({ name, project, destination, priority, level });
      renderInbox();
      byId('lead-result-title').textContent = `${priority} · ${destination}`;
      byId('lead-result').textContent = `La consulta de ${name} sobre ${project.toLowerCase()} quedó organizada en la bandeja local.`;
      response.value = `Hola, ${name}. Gracias por contarnos tu idea de ${project.toLowerCase()}. ${high ? 'Tu objetivo y fecha están definidos; podemos preparar una conversación sobre el alcance.' : medium ? 'El siguiente paso es revisar las funciones y el contenido que necesita tu proyecto.' : 'Podemos empezar explorando tu idea y las opciones que tendrían sentido para ti.'}\n\nMensaje conceptual preparado para revisión. No se ha enviado.`;
      byId('lead-copy').disabled = false;
      status.textContent = `Consulta organizada con prioridad ${priority.toLowerCase()}. La bandeja y la respuesta de ejemplo están actualizadas.`;
    });
    byId('lead-copy').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(response.value); status.textContent = 'Respuesta de ejemplo copiada.'; }
      catch (_) { response.focus(); response.select(); status.textContent = 'Seleccionamos la respuesta. Puedes copiarla con Ctrl+C.'; }
    });
    resetLeads = (announce = true) => {
      leads = [];
      form.reset();
      response.value = '';
      byId('lead-copy').disabled = true;
      byId('lead-result-title').textContent = 'Tu siguiente paso aparecerá aquí.';
      byId('lead-result').textContent = 'Completa una consulta para ver cómo se organiza.';
      renderInbox();
      status.textContent = announce ? 'Consultas locales reiniciadas.' : '';
    };
    byId('lead-reset').addEventListener('click', () => resetLeads());
    renderInbox();
  }

  let resetOrders = null;
  if (byId('order-form')) {
    const form = byId('order-form');
    const select = byId('order-product');
    const quantity = byId('order-quantity');
    const status = byId('order-status');
    const invoice = byId('order-invoice');
    const products = {
      libreta: { name: 'Libreta de ideas', price: 29000, initial: 8, stock: 8 },
      botella: { name: 'Botella de acero', price: 59000, initial: 6, stock: 6 },
      lampara: { name: 'Lámpara de escritorio', price: 129000, initial: 4, stock: 4 }
    };
    let orders = [];
    let sequence = 1;
    function renderStock() {
      Object.entries(products).forEach(([id, product]) => { document.querySelector(`[data-stock="${id}"]`).textContent = product.stock; });
      const product = products[select.value];
      quantity.max = Math.max(1, product.stock);
      byId('order-available').textContent = `${product.stock} unidades disponibles. Precio por unidad: ${money(product.price)}.`;
      byId('order-create').disabled = product.stock === 0;
      if (Number(quantity.value) > product.stock && product.stock > 0) quantity.value = product.stock;
    }
    function renderOrders() {
      const history = byId('order-history');
      history.replaceChildren();
      if (!orders.length) emptyTable(history, 4, 'Crea un pedido para ver el registro.');
      [...orders].reverse().forEach(order => {
        const row = element('tr');
        row.append(element('td', order.id), element('td', products[order.product].name), element('td', order.quantity), element('td', money(order.total)));
        history.append(row);
      });
      const last = orders.at(-1);
      invoice.hidden = !last;
      byId('order-placeholder').hidden = Boolean(last);
      byId('order-undo').disabled = !last;
      byId('order-count').textContent = orders.length;
      if (last) {
        const product = products[last.product];
        const values = element('dl');
        details(values, [['Producto', product.name], ['Cantidad', last.quantity], ['Precio por unidad', money(product.price)], ['Stock disponible ahora', product.stock], ['Total ilustrativo', money(last.total)]]);
        invoice.replaceChildren(element('span', 'DOCUMENTO CONCEPTUAL / SIN VALIDEZ FISCAL'), element('h4', last.id), values);
      } else invoice.replaceChildren();
    }
    select.addEventListener('change', renderStock);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const id = select.value;
      const product = products[id];
      const amount = Number(quantity.value);
      if (!Number.isInteger(amount) || amount < 1 || amount > product.stock) { status.textContent = `Elige entre 1 y ${product.stock} unidades disponibles.`; quantity.focus(); return; }
      const order = { id: `PED-${String(sequence++).padStart(3, '0')}`, product: id, quantity: amount, total: amount * product.price };
      product.stock -= amount;
      orders.push(order);
      renderStock();
      renderOrders();
      status.textContent = `${order.id} creado. Total ${money(order.total)}; inventario actualizado a ${product.stock} unidades.`;
      if (!product.stock && document.activeElement === byId('order-create')) select.focus({ preventScroll: true });
    });
    byId('order-undo').addEventListener('click', () => {
      const removed = orders.pop();
      if (!removed) return;
      products[removed.product].stock += removed.quantity;
      renderStock();
      renderOrders();
      status.textContent = `${removed.id} deshecho. Se devolvieron ${removed.quantity} unidades al inventario local.`;
      if (!orders.length) select.focus({ preventScroll: true });
    });
    resetOrders = (announce = true) => {
      orders = [];
      sequence = 1;
      Object.values(products).forEach(product => { product.stock = product.initial; });
      form.reset();
      renderStock();
      renderOrders();
      status.textContent = announce ? 'Inventario y pedidos de ejemplo reiniciados.' : '';
    };
    byId('order-reset').addEventListener('click', () => resetOrders());
    renderStock();
    renderOrders();
  }

  const flowTabs = [...document.querySelectorAll('[role="tab"][data-flow]')];
  if (flowTabs.length) {
    const panels = [...document.querySelectorAll('[data-flow-panel]')];
    function selectFlow(flow, focus = false, updateHash = false) {
      const panel = panels.find(node => node.dataset.flowPanel === flow);
      const tab = flowTabs.find(node => node.dataset.flow === flow);
      if (!panel || !tab) return;
      panels.forEach(node => { node.hidden = node !== panel; });
      flowTabs.forEach(node => { const active = node === tab; node.setAttribute('aria-selected', String(active)); node.tabIndex = active ? 0 : -1; });
      if (updateHash) history.replaceState(null, '', `#${panel.id}`);
      if (focus) tab.focus({ preventScroll: true });
    }
    function selectHash() {
      const panel = panels.find(node => `#${node.id}` === location.hash);
      if (panel) {
        selectFlow(panel.dataset.flowPanel);
        // A hidden panel cannot receive the browser's first anchor jump.
        panel.scrollIntoView({ block: 'start', behavior: 'auto' });
      }
    }
    flowTabs.forEach(tab => {
      tab.addEventListener('click', () => selectFlow(tab.dataset.flow, false, true));
      tab.addEventListener('keydown', event => {
        const index = flowTabs.indexOf(tab);
        const targets = { ArrowRight: (index + 1) % flowTabs.length, ArrowLeft: (index - 1 + flowTabs.length) % flowTabs.length, Home: 0, End: flowTabs.length - 1 };
        if (Object.hasOwn(targets, event.key)) { event.preventDefault(); selectFlow(flowTabs[targets[event.key]].dataset.flow, true, true); }
      });
    });
    window.addEventListener('hashchange', selectHash);
    selectHash();
    byId('reset-all').addEventListener('click', () => {
      resetLeads?.(false);
      booking?.reset(false);
      resetOrders?.(false);
      const active = panels.find(panel => !panel.hidden);
      const localStatus = active.querySelector('[role="status"]');
      localStatus.textContent = 'Los tres ejemplos se reiniciaron. Puedes probarlos de nuevo.';
    });
  }
})();
