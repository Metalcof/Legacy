'use strict';

(() => {
  const config = window.SITE_CONFIG || {};
  const studio = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = studio; });
  document.title = document.title.replace('Nexo Studio', studio);
  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = description.content.replace('Nexo Studio', studio);
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

  if (byId('restaurant-items')) {
    const dishes = {
      tostadas: { name: 'Tostadas de la huerta', price: 24000 },
      pesca: { name: 'Pesca al fuego', price: 48000 },
      arroz: { name: 'Arroz de la tierra', price: 39000 },
      cacao: { name: 'Cacao y memoria', price: 21000 }
    };
    let basket = {};
    const items = byId('restaurant-items');
    const confirm = byId('restaurant-confirm');
    const clear = byId('restaurant-clear');
    const preview = byId('restaurant-preview');
    const status = byId('restaurant-status');
    const total = () => Object.entries(basket).reduce((sum, [id, quantity]) => sum + dishes[id].price * quantity, 0);
    function renderBasket() {
      items.replaceChildren();
      const entries = Object.entries(basket);
      if (!entries.length) items.append(element('p', 'Tu selección empieza con algo que te apetezca.', 'order-empty'));
      entries.forEach(([id, quantity]) => {
        const dish = dishes[id];
        const row = element('div', undefined, 'order-line');
        const heading = element('div', undefined, 'order-line-title');
        heading.append(element('strong', dish.name), element('span', money(dish.price * quantity)));
        const controls = element('div', undefined, 'quantity-controls');
        [['minus', '−', 'Reducir'], ['plus', '+', 'Aumentar'], ['remove', 'Eliminar', 'Eliminar']].forEach(([action, text, label], position) => {
          const button = element('button', text, action === 'remove' ? 'remove-button' : '');
          button.type = 'button';
          button.dataset.dishAction = action;
          button.dataset.dishId = id;
          button.disabled = action === 'plus' && quantity >= 12;
          button.setAttribute('aria-label', `${label} ${dish.name}`);
          controls.append(button);
          if (position === 0) controls.append(element('span', quantity));
        });
        row.append(heading, controls);
        items.append(row);
      });
      byId('restaurant-total').textContent = money(total());
      confirm.disabled = !entries.length;
      clear.disabled = !entries.length;
      preview.hidden = true;
    }
    function focusFallback() {
      const button = [...document.querySelectorAll('[data-add-dish]')].find(node => !node.closest('[data-dish-category]').hidden);
      button?.focus({ preventScroll: true });
    }
    document.querySelectorAll('[data-add-dish]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.addDish;
      if (!Object.hasOwn(dishes, id)) return;
      if ((basket[id] || 0) >= 12) { status.textContent = 'El límite de este ejemplo es 12 unidades por plato.'; return; }
      basket[id] = (basket[id] || 0) + 1;
      renderBasket();
      status.textContent = `${dishes[id].name} agregado. Total de ejemplo: ${money(total())}.`;
    }));
    items.addEventListener('click', event => {
      const button = event.target.closest('[data-dish-action]');
      if (!button || button.disabled) return;
      const { dishId: id, dishAction: action } = button.dataset;
      if (!Object.hasOwn(basket, id)) return;
      if (action === 'remove' || (action === 'minus' && basket[id] === 1)) delete basket[id];
      else if (action === 'minus') basket[id]--;
      else if (action === 'plus' && basket[id] < 12) basket[id]++;
      renderBasket();
      status.textContent = `Selección actualizada. Total de ejemplo: ${money(total())}.`;
      const replacement = items.querySelector(`[data-dish-id="${id}"][data-dish-action="${action}"]:not(:disabled)`) || items.querySelector('[data-dish-action]:not(:disabled)');
      if (replacement) replacement.focus({ preventScroll: true });
      else focusFallback();
    });
    document.querySelectorAll('[data-dish-filter]').forEach(button => button.addEventListener('click', () => {
      const category = button.dataset.dishFilter;
      document.querySelectorAll('[data-dish-filter]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
      document.querySelectorAll('[data-dish-category]').forEach(dish => { dish.hidden = category !== 'all' && dish.dataset.dishCategory !== category; });
    }));
    confirm.addEventListener('click', () => {
      const lines = Object.entries(basket).map(([id, quantity]) => `${quantity} × ${dishes[id].name}: ${money(dishes[id].price * quantity)}`);
      if (!lines.length) return;
      preview.textContent = `PEDIDO CONCEPTUAL\n\n${lines.join('\n')}\n\nTotal: ${money(total())}\n\nResumen preparado en esta página. No se envía al restaurante.`;
      preview.hidden = false;
      status.textContent = 'El resumen de tu pedido de ejemplo está preparado.';
    });
    clear.addEventListener('click', () => {
      basket = {};
      renderBasket();
      status.textContent = 'Selección vaciada. Puedes crear otro pedido de ejemplo.';
      focusFallback();
    });
    renderBasket();
  }

  if (byId('portfolio-dialog')) {
    const cases = {
      botanica: { title: 'Raíz. Un ritual que empieza en los detalles.', description: 'Una marca de cosmética botánica quería reunir su origen natural y una presencia más contemporánea. La dirección parte de un gesto sencillo: convertir la rutina diaria en un momento propio. Tonos de piedra y hojas, vidrio ámbar y una fotografía que deja hablar a los materiales.', deliverables: ['Un relato de marca alrededor del ritual cotidiano y el origen botánico.', 'Paleta natural, tipografía editorial y dirección de packaging.', 'Fotografía de producto y una estructura de catálogo fácil de recorrer.'], image: 'case-personal-cosmetics', alt: 'Dirección visual de Raíz con cosmética botánica en vidrio ámbar y packaging neutro', link: 'sector-automation.html#personal' },
      hotel: { title: 'Casa Nativa. Una invitación a otro ritmo.', description: 'Un hotel boutique en el paisaje cafetero necesitaba contar lo que lo hace particular: un patio vivo, materiales cálidos y una hospitalidad cercana. La propuesta organiza la historia alrededor de la llegada, los espacios y el tiempo de quedarse, con una mirada editorial que permite imaginar la visita.', deliverables: ['Narrativa de hospitalidad y un tono cercano para la marca.', 'Dirección fotográfica del patio, los materiales y el ambiente.', 'Arquitectura de contenido para habitaciones, experiencias y consultas.'], image: 'case-personal-hotel', alt: 'Patio de Casa Nativa, un hotel boutique con arcos cálidos y vegetación tropical', link: 'sector-automation.html#personal' },
      taller: { title: 'Ideas en Mesa. La claridad se construye conversando.', description: 'Un servicio de talleres creativos buscaba explicar qué ocurre cuando varias miradas se encuentran alrededor de una idea. La dirección pone el proceso al frente: una pregunta compartida, materiales sencillos y decisiones que toman forma en equipo. Una identidad flexible para sesiones, programas y propuestas.', deliverables: ['Una propuesta de valor clara para talleres y consultoría creativa.', 'Sistema visual para sesiones, materiales y presentaciones.', 'Contenido que conecta el primer contacto, la propuesta y el seguimiento.'], image: 'case-personal-workshop', alt: 'Sesión de Ideas en Mesa con tres adultos ficticios, libretas y notas de trabajo', link: 'sector-automation.html#personal' }
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
