'use strict';

(() => {
  const sectorKeys = ['cafeteria', 'arquitectura', 'tienda', 'clinica', 'restaurante', 'personal'];
  const storageKey = 'nexo-sector-projects-v1';
  const paletteKey = 'nexo-sector-palette-v1';
  const currency = value => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const localDate = (offset = 0) => {
    const now = new Date();
    now.setDate(now.getDate() + offset);
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const displayDate = value => {
    const parts = String(value).split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(new Date(parts[0], parts[1] - 1, parts[2]));
  };
  const dateToday = localDate();
  const dateTomorrow = localDate(1);
  const isPastSlot = (date, time) => new Date(`${date}T${time}:00`).getTime() <= Date.now();
  const menu = {
    capuchino: { name: 'Flat white', price: 12000 },
    espresso: { name: 'Croissant de mantequilla', price: 9000 },
    croissant: { name: 'Iced latte', price: 14000 },
  };
  const finishes = { lavanda: 'Lavanda', grafito: 'Grafito', lima: 'Lima' };
  const initialStock = { lavanda: 8, grafito: 6, lima: 5 };
  const unitPrice = 349900;
  const services = { bienestar: 'Consulta de bienestar', acompanamiento: 'Acompañamiento personal', relajacion: 'Sesión de relajación' };
  const appointmentHours = ['09:00', '10:30', '14:00', '16:30'];
  const appointmentCapacity = 2;
  const dinnerHours = ['18:00', '19:30', '21:00'];
  const tables = [2, 2, 2, 2, 4, 4, 4, 6, 6].map((capacity, index) => ({ id: index + 1, capacity }));
  const architecturePhases = ['Brief organizado', 'En revisión', 'Visita por coordinar'];
  const proposalPhases = ['Brief', 'Propuesta', 'En revisión'];
  const goals = { lanzamiento: 'Lanzar una marca', renovar: 'Renovar mi identidad', vender: 'Presentar mis servicios', personal: 'Construir mi marca personal' };
  const packages = {
    esencial: { name: 'Esencial', price: 800000, days: 14, scope: ['Sesión de dirección de marca', 'Paleta y tipografía', 'Guía visual breve'] },
    identidad: { name: 'Identidad', price: 1600000, days: 21, scope: ['Dirección de marca', 'Identidad visual', 'Sistema de aplicaciones', 'Guía de uso'] },
    estrategia: { name: 'Estrategia + identidad', price: 2400000, days: 30, scope: ['Diagnóstico y posicionamiento', 'Mensaje de marca', 'Identidad visual', 'Plan de lanzamiento', 'Guía de uso'] },
  };
  const projects = {
    cafeteria: { brand: 'Maré', label: 'CAFETERÍA / RECOGIDA', title: 'Tu café, sin perder el turno.', description: 'Los pedidos que llegan por mensajes se mezclan. Aquí cada uno tiene su ticket, su hora y un lugar claro en la cola.', process: ['Recibe el pedido', 'Prepara en orden', 'Marca listo'], imageAlt: 'Barista preparando tazas en el área de recogida de Maré', formTitle: 'Un pedido para recoger', resultsTitle: 'La cola de recogida', cta: '¿Tu cafetería necesita organizar sus pedidos?', link: 'cafeteria.html' },
    arquitectura: { brand: 'AURA', label: 'ARQUITECTURA / PROYECTOS', title: 'Una idea merece un buen inicio.', description: 'Un correo con pocos datos no cuenta toda la historia. Organiza el tipo de proyecto, su escala y el plazo antes de pasar a la siguiente conversación.', process: ['Recibe la idea', 'Organiza el brief', 'Prepara la visita'], imageAlt: 'Mesa de trabajo con maqueta arquitectónica y muestras de materiales en AURA', formTitle: 'Una nueva idea', resultsTitle: 'Expedientes del estudio', cta: '¿Tu estudio necesita ordenar sus solicitudes?', link: 'arquitectura.html' },
    tienda: { brand: 'WAV', label: 'TIENDA / PEDIDOS Y STOCK', title: 'Cada pedido, bien preparado.', description: 'Vender también es saber qué queda disponible. Un pedido reserva el acabado elegido, prepara un comprobante y deja el stock al día.', process: ['Elige el acabado', 'Reserva existencias', 'Prepara el pedido'], imageAlt: 'Estación de empaquetado de auriculares para pedidos de WAV', formTitle: 'Preparar un pedido', resultsTitle: 'Pedidos de Wave One', cta: '¿Tu tienda necesita conectar pedidos y existencias?', link: 'tienda.html' },
    clinica: { brand: 'ALMA', label: 'BIENESTAR / AGENDA', title: 'Tiempo para cada persona.', description: 'La recepción necesita ver quién viene y cuándo. Consulta los espacios del día, confirma una cita y libera el horario si los planes cambian.', process: ['Consulta el horario', 'Confirma la cita', 'Organiza el día'], imageAlt: 'Recepcionista organizando la agenda de un centro de bienestar ALMA', formTitle: 'Agendar una cita', resultsTitle: 'La agenda de ALMA', cta: '¿Tu negocio necesita una agenda más clara?', link: 'clinica.html' },
    restaurante: { brand: 'LUMBRE', label: 'RESTAURANTE / RESERVAS', title: 'Una mesa lista para recibirte.', description: 'Una reserva debe caber de verdad. Elige cuántas personas vienen y el turno: el sistema encuentra una mesa disponible del tamaño adecuado.', process: ['Elige el turno', 'Asigna una mesa', 'Recibe a tus invitados'], imageAlt: 'Comedor de LUMBRE preparado para recibir reservas durante la noche', formTitle: 'Reservar una mesa', resultsTitle: 'El salón de LUMBRE', cta: '¿Tu restaurante necesita organizar su salón?', link: 'restaurante.html' },
    personal: { brand: 'Valeria Ríos', label: 'MARCA PERSONAL / PROPUESTAS', title: 'De una conversación a una propuesta.', description: 'Una buena idea puede quedarse en el chat. Convierte el objetivo del cliente en un alcance concreto y acompáñalo hasta la revisión de la propuesta.', process: ['Recibe el objetivo', 'Prepara el alcance', 'Avanza la propuesta'], imageAlt: 'Consultora de marca trabajando con agenda y materiales en su oficina', formTitle: 'Un nuevo brief', resultsTitle: 'Propuestas en marcha', cta: '¿Tu marca personal necesita organizar sus proyectos?', link: 'portfolio.html' },
  };

  function createSeed() {
    return {
      version: 1,
      counters: { cafeteria: 103, arquitectura: 202, tienda: 301, clinica: 402, restaurante: 502, personal: 602 },
      cafeteria: [
        { id: 'M-102', name: 'Sofía', product: 'capuchino', quantity: 2, time: '10:30', status: 'Preparando' },
        { id: 'M-103', name: 'Diego', product: 'croissant', quantity: 1, time: '10:45', status: 'Listo' },
      ],
      arquitectura: [
        { id: 'A-201', name: 'Lina y Andrés', type: 'Casa', area: 120, months: 4, phase: 0, checklist: [true, false, false] },
        { id: 'A-202', name: 'Estudio Sol', type: 'Interior comercial', area: 80, months: 3, phase: 1, checklist: [true, true, true] },
      ],
      tienda: [{ id: 'W-301', name: 'Laura', color: 'lavanda', quantity: 1, status: 'Reservado' }],
      clinica: [
        { id: 'AL-401', name: 'Andrea', service: 'bienestar', date: dateTomorrow, time: '09:00', status: 'Confirmada' },
        { id: 'AL-402', name: 'Tomás', service: 'relajacion', date: dateTomorrow, time: '14:00', status: 'Confirmada' },
      ],
      restaurante: [
        { id: 'L-501', name: 'Camilo', people: 3, date: dateTomorrow, time: '19:30', table: 5, status: 'Confirmada' },
        { id: 'L-502', name: 'Lucía', people: 2, date: dateTomorrow, time: '18:00', table: 1, status: 'Confirmada' },
      ],
      personal: [
        { id: 'V-601', name: 'Taller Nube', goal: 'lanzamiento', package: 'identidad', note: 'Una marca de objetos para el hogar.', phase: 0 },
        { id: 'V-602', name: 'Elena, nutricionista', goal: 'personal', package: 'esencial', note: 'Presentar mis servicios de forma cercana.', phase: 1 },
      ],
    };
  }

  function validRecord(key, record) {
    if (!record || typeof record !== 'object' || typeof record.id !== 'string' || typeof record.name !== 'string' || record.name.length > 80) return false;
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
    if (key === 'cafeteria') return Boolean(menu[record.product]) && integer(record.quantity, 1, 12) && /^\d{2}:\d{2}$/.test(record.time) && ['Preparando', 'Listo'].includes(record.status);
    if (key === 'arquitectura') return ['Casa', 'Apartamento', 'Interior comercial', 'Oficina'].includes(record.type) && integer(record.area, 20, 5000) && integer(record.months, 1, 24) && integer(record.phase, 0, 2) && Array.isArray(record.checklist) && record.checklist.length === 3 && record.checklist.every(value => typeof value === 'boolean');
    if (key === 'tienda') return Boolean(finishes[record.color]) && integer(record.quantity, 1, 5) && ['Reservado', 'Preparado', 'Cancelado'].includes(record.status);
    if (key === 'clinica') return Boolean(services[record.service]) && validDate(record.date) && appointmentHours.includes(record.time) && ['Confirmada', 'Cancelada'].includes(record.status);
    if (key === 'restaurante') return integer(record.people, 1, 6) && validDate(record.date) && dinnerHours.includes(record.time) && integer(record.table, 1, 9) && ['Confirmada', 'Cancelada'].includes(record.status);
    if (key === 'personal') return Boolean(goals[record.goal]) && Boolean(packages[record.package]) && typeof record.note === 'string' && record.note.length <= 300 && integer(record.phase, 0, 2);
    return false;
  }

  function readState() {
    const seed = createSeed();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || saved.version !== 1 || !saved.counters) return seed;
      for (const key of sectorKeys) {
        if (!Array.isArray(saved[key]) || saved[key].length > 100 || !saved[key].every(record => validRecord(key, record)) || !Number.isInteger(saved.counters[key]) || saved.counters[key] < seed.counters[key]) return seed;
      }
      for (const color of Object.keys(finishes)) if (saved.tienda.filter(order => order.color === color && order.status !== 'Cancelado').reduce((sum, order) => sum + order.quantity, 0) > initialStock[color]) return seed;
      return saved;
    } catch (_) { return seed; }
  }

  let state = readState();
  let activeSector = 'cafeteria';
  const panelRoot = document.getElementById('sector-panels');
  const prefix = { cafeteria: 'M', arquitectura: 'A', tienda: 'W', clinica: 'AL', restaurante: 'L', personal: 'V' };
  const nextId = key => `${prefix[key]}-${++state.counters[key]}`;
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (_) { /* All actions remain available in memory. */ } }
  function feedback(key, text, error = false) {
    const element = document.getElementById(`feedback-${key}`);
    element.dataset.error = String(error);
    element.textContent = text;
  }
  function input(key, name, label, type = 'text', attributes = '') {
    return `<div class="field"><label for="${key}-${name}">${label}</label><input id="${key}-${name}" name="${name}" type="${type}" ${attributes}></div>`;
  }
  function select(key, name, label, choices, selected = '') {
    return `<div class="field"><label for="${key}-${name}">${label}</label><select id="${key}-${name}" name="${name}" required>${choices.map(([value, text]) => `<option value="${value}"${value === selected ? ' selected' : ''}>${text}</option>`).join('')}</select></div>`;
  }
  const nameInput = key => input(key, 'name', key === 'personal' ? 'Cliente o marca' : key === 'arquitectura' ? 'Persona o empresa' : 'Nombre', 'text', 'required maxlength="80" autocomplete="off" placeholder="Por ejemplo, Sara"');
  const dateInput = key => input(key, 'date', 'Fecha', 'date', `required min="${dateToday}" value="${dateTomorrow}"`);
  function formContent(key) {
    if (key === 'cafeteria') return `${nameInput(key)}${select(key, 'product', 'Elige el producto', Object.entries(menu).map(([value, product]) => [value, `${product.name} · ${currency(product.price)}`]))}<div class="field-row">${input(key, 'quantity', 'Cantidad', 'number', 'required min="1" max="12" step="1" value="1"')}${input(key, 'time', 'Hora de recogida', 'time', 'required min="07:00" max="20:00" value="10:30"')}</div><div class="form-price"><span>Total del pedido</span><strong id="price-cafeteria">${currency(12000)}</strong></div><button class="primary-button" type="submit">Crear ticket de recogida ↗</button>`;
    if (key === 'arquitectura') return `${nameInput(key)}${select(key, 'type', 'Tipo de proyecto', ['Casa', 'Apartamento', 'Interior comercial', 'Oficina'].map(value => [value, value]))}<div class="field-row">${input(key, 'area', 'Área aproximada · m²', 'number', 'required min="20" max="5000" step="1" value="120"')}${input(key, 'months', 'Plazo deseado · meses', 'number', 'required min="1" max="24" step="1" value="4"')}</div><button class="primary-button" type="submit">Organizar el brief ↗</button>`;
    if (key === 'tienda') return `<div class="product-preview"><img id="order-product-photo" src="../assets/headphones-lavanda.webp" width="72" height="72" alt="Auriculares Wave One en acabado lavanda"><p><strong>Wave One</strong>${currency(unitPrice)} por unidad</p></div>${nameInput(key)}${select(key, 'color', 'Acabado', Object.entries(finishes))}${input(key, 'quantity', 'Cantidad', 'number', 'required min="1" max="5" step="1" value="1"')}<div class="form-price"><span>Total ilustrativo</span><strong id="price-tienda">${currency(unitPrice)}</strong></div><button class="primary-button" type="submit">Reservar stock y crear pedido ↗</button>`;
    if (key === 'clinica') return `${nameInput(key)}${select(key, 'service', 'Servicio', Object.entries(services))}${dateInput(key)}${select(key, 'time', 'Hora', appointmentHours.map(time => [time, time]))}<button class="primary-button" type="submit">Confirmar cita ↗</button>`;
    if (key === 'restaurante') return `${nameInput(key)}${input(key, 'people', 'Número de personas', 'number', 'required min="1" max="6" step="1" value="2"')}${dateInput(key)}${select(key, 'time', 'Turno', dinnerHours.map(time => [time, time]), '19:30')}<button class="primary-button" type="submit">Encontrar mesa y reservar ↗</button>`;
    return `${nameInput(key)}${select(key, 'goal', 'Objetivo principal', Object.entries(goals))}${select(key, 'package', 'Paquete', Object.entries(packages).map(([value, item]) => [value, `${item.name} · ${currency(item.price)}`]))}<div class="field full-width"><label for="personal-note">Cuéntame un poco más</label><textarea id="personal-note" name="note" maxlength="300" placeholder="¿Qué quieres que cambie en tu marca?"></textarea></div><div class="form-price"><span>Valor ilustrativo</span><strong id="price-personal">${currency(800000)}</strong></div><button class="primary-button" type="submit">Preparar alcance y propuesta ↗</button>`;
  }

  panelRoot.innerHTML = sectorKeys.map(key => {
    const project = projects[key];
    return `<section class="sector-panel" id="${key}" data-sector="${key}" role="tabpanel" aria-labelledby="tab-${key}" tabindex="-1"${key !== 'cafeteria' ? ' hidden' : ''}>
      <header class="project-intro"><div><p class="project-kicker">${project.label}</p><h2>${project.title}</h2><p class="intro-description">${project.description}</p><div class="process-line" aria-label="Pasos del proceso">${project.process.map((step, index) => `${index ? '<i aria-hidden="true">→</i>' : ''}<span>${step}</span>`).join('')}</div></div><figure><img src="../assets/auto-${key}.webp" srcset="../assets/auto-${key}-small.webp 800w, ../assets/auto-${key}.webp 1600w" sizes="(max-width:800px) calc(100vw - 40px), 440px" width="1600" height="900" alt="${project.imageAlt}" loading="${key === 'cafeteria' ? 'eager' : 'lazy'}" decoding="async"></figure></header>
      <div class="dashboard-topline"><h3>${project.brand} · Operación diaria</h3><button type="button" data-action="reset-module" data-sector="${key}">Volver al ejemplo inicial</button></div>
      <div class="metrics" id="metrics-${key}"></div>
      <div class="dashboard-grid"><div class="form-card"><div class="card-heading"><h4>${project.formTitle}</h4></div><p class="form-note">${key === 'cafeteria' ? 'Horarios de ejemplo de 07:00 a 20:00. Los precios son ilustrativos.' : key === 'clinica' || key === 'restaurante' ? 'La agenda comienza mañana. Prueba local con disponibilidad de ejemplo.' : 'Prueba con datos de ejemplo. Todos los valores son ilustrativos.'}</p><form class="business-form" data-business-form="${key}">${formContent(key)}</form><div id="feedback-${key}" class="feedback" role="status" aria-live="polite"></div></div><div class="result-card"><div class="card-heading"><h4>${project.resultsTitle}</h4><small id="record-count-${key}"></small></div><div id="results-${key}"></div></div></div>
      <div class="sector-cta"><p>${project.cta}</p><a href="../index.html#contacto">Quiero un proyecto así ↗</a><a href="${project.link}">Ver la web de ${project.brand} ↗</a></div>
    </section>`;
  }).join('');

  function metrics(key, values) {
    document.getElementById(`metrics-${key}`).innerHTML = values.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${escape(value)}</strong></div>`).join('');
  }
  const badge = (status, variant = '') => `<span class="badge ${variant}">${escape(status)}</span>`;
  const actionButton = (key, id, action, label, subtle = false, disabled = false) => `<button type="button" class="small-button${subtle ? ' subtle' : ''}" data-action="${action}" data-sector="${key}" data-record="${escape(id)}"${disabled ? ' disabled' : ''}>${label}</button>`;
  const empty = message => `<p class="empty-state">${message}</p>`;
  const countRecords = key => { document.getElementById(`record-count-${key}`).textContent = `${state[key].length} ${state[key].length === 1 ? 'registro' : 'registros'}`; };
  const availableStock = color => initialStock[color] - state.tienda.filter(order => order.color === color && order.status !== 'Cancelado').reduce((sum, order) => sum + order.quantity, 0);
  const appointmentCount = (date, time) => state.clinica.filter(item => item.date === date && item.time === time && item.status === 'Confirmada').length;
  const currentForm = key => document.querySelector(`[data-business-form="${key}"]`);
  const bookedTable = (date, time, tableId) => state.restaurante.find(item => item.date === date && item.time === time && item.table === tableId && item.status === 'Confirmada');

  function renderCafe() {
    const pending = state.cafeteria.filter(item => item.status === 'Preparando');
    metrics('cafeteria', [['En preparación', pending.length], ['Listos para recoger', state.cafeteria.length - pending.length], ['Valor de la cola', currency(pending.reduce((sum, item) => sum + menu[item.product].price * item.quantity, 0))]]);
    const sorted = [...state.cafeteria].sort((a, b) => Number(a.status === 'Listo') - Number(b.status === 'Listo') || a.time.localeCompare(b.time));
    document.getElementById('results-cafeteria').innerHTML = sorted.length ? `<div class="records">${sorted.map(item => `<article class="record queue-item" data-ready="${item.status === 'Listo'}"><div class="ticket-number">${escape(item.id.split('-')[1])}</div><div><div class="record-top"><div><p class="record-id">TICKET ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(item.status, item.status === 'Listo' ? 'completed' : '')}</div><p class="record-detail">${item.quantity} × ${menu[item.product].name}<br>Recogida a las ${escape(item.time)}</p><div class="record-footer"><span>${currency(menu[item.product].price * item.quantity)}</span>${actionButton('cafeteria', item.id, 'cafe-ready', item.status === 'Listo' ? 'Volver a preparación' : 'Marcar listo', item.status === 'Listo')}</div></div></article>`).join('')}</div>` : empty('Todavía no hay pedidos. Crea el primer ticket.');
  }

  function renderArchitecture() {
    metrics('arquitectura', [['Ideas recibidas', state.arquitectura.length], ['En revisión', state.arquitectura.filter(item => item.phase === 1).length], ['Visitas por coordinar', state.arquitectura.filter(item => item.phase === 2).length]]);
    document.getElementById('results-arquitectura').innerHTML = `<div class="records">${[...state.arquitectura].reverse().map(item => `<article class="record"><div class="record-top"><div><p class="record-id">EXPEDIENTE ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(architecturePhases[item.phase])}</div><p class="record-detail">${escape(item.type)} · ${item.area} m² · Plazo deseado: ${item.months} ${item.months === 1 ? 'mes' : 'meses'}<br>${item.area <= 150 ? 'Escala compacta: priorizar distribución y uso.' : item.area <= 500 ? 'Escala media: organizar áreas y etapas.' : 'Escala amplia: revisar fases y coordinación.'}</p><div class="project-checklist">${['Necesidad principal revisada', 'Datos de escala y plazo completos', 'Referencia visual preparada'].map((label, index) => `<label><input type="checkbox" data-checklist="${escape(item.id)}" data-check-index="${index}"${item.checklist[index] ? ' checked' : ''}>${label}</label>`).join('')}</div><div class="phase-track" aria-label="Etapa ${item.phase + 1} de 3">${[0, 1, 2].map(index => `<span class="${index <= item.phase ? 'done' : ''}"></span>`).join('')}</div><div class="record-footer"><span>${item.checklist.filter(Boolean).length}/3 revisados</span><div class="record-actions">${item.phase > 0 ? actionButton('arquitectura', item.id, 'aura-back', 'Anterior', true) : ''}${actionButton('arquitectura', item.id, 'aura-next', item.phase === 0 ? 'Pasar a revisión' : item.phase === 1 ? 'Preparar visita' : 'Visita preparada', false, item.phase === 2)}</div></div></article>`).join('')}</div>`;
  }

  function renderStore() {
    const active = state.tienda.filter(order => order.status !== 'Cancelado');
    metrics('tienda', [['Unidades disponibles', Object.keys(finishes).reduce((sum, color) => sum + availableStock(color), 0)], ['Pedidos activos', active.length], ['Valor reservado', currency(active.reduce((sum, order) => sum + order.quantity * unitPrice, 0))]]);
    document.getElementById('results-tienda').innerHTML = `<div class="inventory" aria-label="Existencias por acabado">${Object.entries(finishes).map(([color, name]) => `<div class="inventory-item">${name}<strong>${availableStock(color)}</strong>disponibles</div>`).join('')}</div><div class="records">${[...state.tienda].reverse().map(item => `<article class="record"><div class="record-top"><div><p class="record-id">COMPROBANTE ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(item.status, item.status === 'Cancelado' ? 'cancelled' : item.status === 'Preparado' ? 'completed' : '')}</div><p class="record-detail">Wave One · ${finishes[item.color]} · ${item.quantity} ${item.quantity === 1 ? 'unidad' : 'unidades'}<br>${currency(unitPrice)} × ${item.quantity}</p><div class="record-footer"><span>${currency(item.quantity * unitPrice)}</span><div class="record-actions">${item.status === 'Reservado' ? actionButton('tienda', item.id, 'wav-prepared', 'Marcar preparado') : ''}${item.status !== 'Cancelado' ? actionButton('tienda', item.id, 'wav-cancel', 'Cancelar y devolver stock', true) : '<span class="record-detail">Stock devuelto</span>'}</div></div></article>`).join('')}</div>`;
  }

  function renderClinic() {
    const date = currentForm('clinica').elements.date.value || dateToday;
    const selected = state.clinica.filter(item => item.date === date && item.status === 'Confirmada');
    metrics('clinica', [['Citas del día elegido', selected.length], ['Espacios libres', appointmentHours.length * appointmentCapacity - selected.length], ['Duración por turno', '60 min']]);
    document.getElementById('results-clinica').innerHTML = `<div class="availability"><p class="availability-heading">Disponibilidad para ${escape(displayDate(date))} · 2 cupos por turno</p><div class="slot-grid">${appointmentHours.map(time => { const count = appointmentCapacity - appointmentCount(date, time); return `<div class="slot${count === 0 ? ' full' : ''}"><strong>${time}</strong>${count} ${count === 1 ? 'cupo' : 'cupos'}</div>`; }).join('')}</div></div><div class="records">${[...state.clinica].sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time)).map(item => `<article class="record"><div class="record-top"><div><p class="record-id">CITA ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(item.status, item.status === 'Cancelada' ? 'cancelled' : '')}</div><p class="record-detail">${services[item.service]}<br>${escape(displayDate(item.date))} · ${item.time}–${endHour(item.time)}</p><div class="record-footer"><span>${item.status === 'Cancelada' ? 'Horario liberado' : 'Confirmación preparada'}</span>${item.status === 'Confirmada' ? actionButton('clinica', item.id, 'alma-cancel', 'Cancelar cita', true) : ''}</div></article>`).join('')}</div>`;
  }
  function endHour(time) { const [hour, minute] = time.split(':').map(Number); return `${String(hour + 1).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; }

  function renderRestaurant() {
    const form = currentForm('restaurante');
    const date = form.elements.date.value || dateToday;
    const time = form.elements.time.value;
    const active = state.restaurante.filter(item => item.date === date && item.time === time && item.status === 'Confirmada');
    const occupiedSeats = active.reduce((sum, item) => sum + tables[item.table - 1].capacity, 0);
    metrics('restaurante', [['Mesas libres en el turno', tables.length - active.length], ['Personas esperadas', active.reduce((sum, item) => sum + item.people, 0)], ['Asientos disponibles', 32 - occupiedSeats]]);
    document.getElementById('results-restaurante').innerHTML = `<p class="availability-heading">Salón · ${escape(displayDate(date))} · ${time}</p><div class="table-map">${tables.map(table => { const booking = bookedTable(date, time, table.id); return `<div class="table-seat${booking ? ' busy' : ''}"><strong>Mesa ${table.id}</strong><span>${table.capacity} personas</span><span data-booking-name="${booking ? escape(booking.id) : ''}">${booking ? '' : 'Disponible'}</span></div>`; }).join('')}</div><p class="capacity-note">Capacidad: 4 mesas de 2 · 3 mesas de 4 · 2 mesas de 6. Una reserva ocupa la mesa completa durante su turno.</p><div class="records">${[...state.restaurante].reverse().map(item => `<article class="record"><div class="record-top"><div><p class="record-id">RESERVA ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(item.status, item.status === 'Cancelada' ? 'cancelled' : '')}</div><p class="record-detail">Mesa ${item.table} · ${item.people} ${item.people === 1 ? 'persona' : 'personas'}<br>${escape(displayDate(item.date))} · Turno ${item.time}</p><div class="record-footer"><span>${item.status === 'Cancelada' ? 'Mesa liberada' : 'Mesa asignada'}</span>${item.status === 'Confirmada' ? actionButton('restaurante', item.id, 'lumbre-cancel', 'Cancelar y liberar', true) : ''}</div></article>`).join('')}</div>`;
  }

  function renderPersonal() {
    metrics('personal', [['Briefs recibidos', state.personal.length], ['Propuestas preparadas', state.personal.filter(item => item.phase >= 1).length], ['Valor en revisión', currency(state.personal.filter(item => item.phase === 2).reduce((sum, item) => sum + packages[item.package].price, 0))]]);
    document.getElementById('results-personal').innerHTML = `<div class="proposal-stages">${proposalPhases.map((phase, index) => `<div>${phase}<strong>${state.personal.filter(item => item.phase === index).length}</strong></div>`).join('')}</div><div class="records">${[...state.personal].reverse().map(item => { const pack = packages[item.package]; return `<article class="record"><div class="record-top"><div><p class="record-id">PROPUESTA ${escape(item.id)}</p><h5 data-record-name="${escape(item.id)}"></h5></div>${badge(proposalPhases[item.phase])}</div><p class="record-detail">${goals[item.goal]}<br>Paquete ${pack.name} · ${pack.days} días estimados${item.note ? `<br>«<span data-record-note="${escape(item.id)}"></span>»` : ''}</p><ul class="scope-list">${pack.scope.map(scope => `<li>${scope}</li>`).join('')}</ul><div class="record-footer"><span>${currency(pack.price)}</span><div class="record-actions">${item.phase > 0 ? actionButton('personal', item.id, 'personal-back', 'Anterior', true) : ''}${actionButton('personal', item.id, 'personal-next', item.phase === 0 ? 'Preparar propuesta' : item.phase === 1 ? 'Pasar a revisión' : 'En revisión', false, item.phase === 2)}</div></div></article>`; }).join('')}</div>`;
  }

  function hydrateRecordText(key) {
    const result = document.getElementById('results-' + key);
    result.querySelectorAll('[data-record-name]').forEach(element => {
      const item = state[key].find(record => record.id === element.dataset.recordName);
      if (item) element.textContent = item.name;
    });
    result.querySelectorAll('[data-record-note]').forEach(element => {
      const item = state[key].find(record => record.id === element.dataset.recordNote);
      if (item) element.textContent = item.note;
    });
    result.querySelectorAll('[data-booking-name]').forEach(element => {
      const item = state.restaurante.find(record => record.id === element.dataset.bookingName);
      if (item) element.textContent = item.name;
    });
  }

  const renderers = { cafeteria: renderCafe, arquitectura: renderArchitecture, tienda: renderStore, clinica: renderClinic, restaurante: renderRestaurant, personal: renderPersonal };
  function render(key) { renderers[key](); hydrateRecordText(key); countRecords(key); }
  sectorKeys.forEach(render);

  function refreshForm(key) {
    const form = currentForm(key);
    if (key === 'cafeteria') document.getElementById('price-cafeteria').textContent = currency(menu[form.elements.product.value].price * (Number(form.elements.quantity.value) || 0));
    if (key === 'tienda') {
      document.getElementById('price-tienda').textContent = currency(unitPrice * (Number(form.elements.quantity.value) || 0));
      const image = document.getElementById('order-product-photo');
      const color = form.elements.color.value;
      image.src = `../assets/headphones-${color}.webp`;
      image.alt = `Auriculares Wave One en acabado ${finishes[color].toLowerCase()}`;
    }
    if (key === 'personal') document.getElementById('price-personal').textContent = currency(packages[form.elements.package.value].price);
    if (key === 'clinica' && form.elements.date.value && form.elements.date.validity.valid) render('clinica');
    if (key === 'restaurante' && form.elements.date.value && form.elements.date.validity.valid) render('restaurante');
  }

  document.querySelectorAll('[data-business-form]').forEach(form => {
    const key = form.dataset.businessForm;
    form.addEventListener('input', () => refreshForm(key));
    form.addEventListener('change', () => refreshForm(key));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = Object.fromEntries(new FormData(form));
      data.name = data.name.trim();
      if (data.name.length < 2) { feedback(key, 'Escribe un nombre de al menos dos caracteres.', true); form.elements.name.focus(); return; }
      if (state[key].length >= 100) { feedback(key, 'El ejemplo admite 100 registros. Reinicia este proyecto para continuar.', true); return; }
      let message = '';
      if (key === 'cafeteria') {
        const quantity = Number(data.quantity);
        const id = nextId(key);
        state[key].push({ id, name: data.name, product: data.product, quantity, time: data.time, status: 'Preparando' });
        message = `Ticket ${id} creado para ${data.name}: ${quantity} × ${menu[data.product].name}. Recogida ${data.time}, total ${currency(quantity * menu[data.product].price)}. Ya está en la cola.`;
      } else if (key === 'arquitectura') {
        const id = nextId(key);
        state[key].push({ id, name: data.name, type: data.type, area: Number(data.area), months: Number(data.months), phase: 0, checklist: [false, true, false] });
        message = `Brief ${id} organizado: ${data.type}, ${data.area} m² y ${data.months} meses. Completa su checklist y pásalo a revisión.`;
      } else if (key === 'tienda') {
        const quantity = Number(data.quantity);
        const stock = availableStock(data.color);
        if (quantity > stock) { feedback(key, `Quedan ${stock} unidades en ${finishes[data.color]}. Reduce la cantidad o elige otro acabado.`, true); return; }
        const id = nextId(key);
        state[key].push({ id, name: data.name, color: data.color, quantity, status: 'Reservado' });
        message = `Comprobante ${id} creado por ${currency(quantity * unitPrice)}. ${quantity} ${quantity === 1 ? 'unidad reservada' : 'unidades reservadas'} en ${finishes[data.color]}. Puedes cancelar para devolver el stock.`;
      } else if (key === 'clinica') {
        if (data.date < dateToday) { feedback(key, 'Elige una fecha de hoy en adelante.', true); return; }
        if (isPastSlot(data.date, data.time)) { feedback(key, 'Ese horario ya pasó. Elige un turno futuro; la agenda comienza mañana como ejemplo.', true); return; }
        if (appointmentCount(data.date, data.time) >= appointmentCapacity) { feedback(key, `El turno ${data.time} del ${displayDate(data.date)} está completo. Elige otra hora o cancela una cita para liberar espacio.`, true); return; }
        const id = nextId(key);
        state[key].push({ id, name: data.name, service: data.service, date: data.date, time: data.time, status: 'Confirmada' });
        message = `Confirmación ${id}: ${data.name}, ${services[data.service]}, ${displayDate(data.date)} de ${data.time} a ${endHour(data.time)}. El cupo quedó reservado en este ejemplo.`;
      } else if (key === 'restaurante') {
        if (data.date < dateToday) { feedback(key, 'Elige una fecha de hoy en adelante.', true); return; }
        if (isPastSlot(data.date, data.time)) { feedback(key, 'Ese turno ya pasó. Elige una fecha u hora futura; las reservas de ejemplo empiezan mañana.', true); return; }
        const people = Number(data.people);
        const table = tables.find(item => item.capacity >= people && !bookedTable(data.date, data.time, item.id));
        if (!table) { feedback(key, `No quedan mesas para ${people} personas en ese turno. Prueba otro horario o libera una reserva.`, true); return; }
        const id = nextId(key);
        state[key].push({ id, name: data.name, people, date: data.date, time: data.time, table: table.id, status: 'Confirmada' });
        message = `Reserva ${id} confirmada: mesa ${table.id} para ${people} personas, ${displayDate(data.date)} a las ${data.time}. La mesa figura ocupada en el plano del turno.`;
      } else {
        const id = nextId(key);
        const pack = packages[data.package];
        state[key].push({ id, name: data.name, goal: data.goal, package: data.package, note: data.note.trim(), phase: 0 });
        message = `Brief ${id} creado para ${data.name}. Alcance ${pack.name}, ${currency(pack.price)} y ${pack.days} días ilustrativos. Revisa el alcance y mueve la tarjeta a propuesta.`;
      }
      persist();
      render(key);
      feedback(key, message);
      form.elements.name.value = '';
    });
  });

  document.addEventListener('change', event => {
    const checkbox = event.target.closest('[data-checklist]');
    if (!checkbox) return;
    const item = state.arquitectura.find(record => record.id === checkbox.dataset.checklist);
    if (!item) return;
    const index = Number(checkbox.dataset.checkIndex);
    item.checklist[index] = checkbox.checked;
    persist();
    render('arquitectura');
    const replacement = document.querySelector(`[data-checklist="${CSS.escape(item.id)}"][data-check-index="${index}"]`);
    replacement?.focus({ preventScroll: true });
    feedback('arquitectura', `${item.name}: ${item.checklist.filter(Boolean).length} de 3 puntos revisados.`);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const key = button.dataset.sector;
    if (action === 'reset-all') {
      state = createSeed();
      sectorKeys.forEach(sector => { currentForm(sector).reset(); render(sector); refreshForm(sector); feedback(sector, 'Proyecto restaurado a sus datos de ejemplo.'); });
      persist();
      document.getElementById('global-feedback').textContent = 'Los seis proyectos volvieron a sus datos iniciales.';
      return;
    }
    if (!sectorKeys.includes(key)) return;
    if (action === 'reset-module') {
      const seed = createSeed();
      state[key] = seed[key];
      state.counters[key] = seed.counters[key];
      currentForm(key).reset();
      persist(); render(key); refreshForm(key);
      feedback(key, 'Proyecto restaurado. Los otros cinco conservan tus cambios.');
      return;
    }
    const item = state[key].find(record => record.id === button.dataset.record);
    if (!item) return;
    let message = '';
    if (action === 'cafe-ready') { item.status = item.status === 'Listo' ? 'Preparando' : 'Listo'; message = `${item.id}: ${item.status === 'Listo' ? 'listo para recoger' : 'volvió a preparación'}.`; }
    if (action === 'aura-next') {
      if (!item.checklist.every(Boolean)) { feedback(key, 'Completa los tres puntos del checklist antes de avanzar este proyecto.', true); return; }
      item.phase = Math.min(2, item.phase + 1); message = `${item.id}: ${architecturePhases[item.phase].toLowerCase()}.`;
    }
    if (action === 'aura-back') { item.phase = Math.max(0, item.phase - 1); message = `${item.id}: volvió a ${architecturePhases[item.phase].toLowerCase()}.`; }
    if (action === 'wav-prepared') { item.status = 'Preparado'; message = `${item.id}: pedido preparado. Las existencias siguen reservadas.`; }
    if (action === 'wav-cancel') { item.status = 'Cancelado'; message = `${item.id}: cancelado. ${item.quantity} unidades en ${finishes[item.color]} devueltas al stock.`; }
    if (action === 'alma-cancel') { item.status = 'Cancelada'; message = `${item.id}: cita cancelada y cupo de ${item.time} liberado.`; }
    if (action === 'lumbre-cancel') { item.status = 'Cancelada'; message = `${item.id}: cancelada. Mesa ${item.table} disponible de nuevo en ese turno.`; }
    if (action === 'personal-next') { item.phase = Math.min(2, item.phase + 1); message = `${item.id}: ${proposalPhases[item.phase].toLowerCase()}, con alcance ${packages[item.package].name}.`; }
    if (action === 'personal-back') { item.phase = Math.max(0, item.phase - 1); message = `${item.id}: volvió a ${proposalPhases[item.phase].toLowerCase()}.`; }
    persist(); render(key); feedback(key, message);
    const target = document.querySelector(`[data-sector="${key}"][data-record="${CSS.escape(item.id)}"]:not(:disabled)`) || document.querySelector(`[data-action="reset-module"][data-sector="${key}"]`);
    target?.focus({ preventScroll: true });
  });

  function activateSector(key, focusPanel = true) {
    activeSector = sectorKeys.includes(key) ? key : 'cafeteria';
    sectorKeys.forEach(sector => {
      const active = sector === activeSector;
      document.getElementById(sector).hidden = !active;
      const tab = document.getElementById(`tab-${sector}`);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.title = `${projects[activeSector].brand} · Un negocio que fluye · ${studioName}`;
    if (focusPanel) document.getElementById(activeSector).focus({ preventScroll: true });
  }
  const tabs = [...document.querySelectorAll('[data-sector-tab]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      const key = tab.dataset.sectorTab;
      if (location.hash === `#${key}`) activateSector(key);
      else location.hash = key;
    });
    tab.addEventListener('keydown', event => {
      let target = index;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') target = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault();
      const key = tabs[target].dataset.sectorTab;
      history.replaceState(null, '', `#${key}`);
      activateSector(key, false);
      tabs[target].focus({ preventScroll: true });
      tabs[target].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    });
  });
  window.addEventListener('hashchange', () => activateSector(location.hash.slice(1)));

  const studioName = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach(element => { element.textContent = studioName; });
  const palettes = ['original', 'verde', 'cian', 'violeta'];
  function setPalette(value) {
    const selected = palettes.includes(value) ? value : 'original';
    document.body.dataset.palette = selected;
    document.querySelectorAll('button[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === selected)));
    try { localStorage.setItem(paletteKey, selected); } catch (_) { /* The current palette remains usable. */ }
  }
  document.querySelectorAll('button[data-palette]').forEach(button => button.addEventListener('click', () => setPalette(button.dataset.palette)));
  let palette = 'original';
  try { palette = localStorage.getItem(paletteKey) || 'original'; } catch (_) { /* Use the original palette. */ }
  setPalette(palette);
  activateSector(location.hash.slice(1), Boolean(location.hash));
})();
