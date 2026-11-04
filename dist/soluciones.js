'use strict';
// Diagnóstico de problemas frecuentes y soluciones por sector con un asistente de WhatsApp simulado.
// Todas las marcas del simulador son ficticias.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => reduced.matches || document.body.classList.contains('motion-paused');
  const wait = ms => new Promise(resolve => setTimeout(resolve, still() ? 0 : ms));
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; };

  /* ---------- Problemas frecuentes ---------- */
  const problems = [
    { key: 'desactualizada', title: 'Lleva años sin actualizarse', cost: 'Fechas viejas, promociones vencidas o un diseño de otra época hacen dudar al cliente antes de escribirte.', fix: 'Rediseño con textos y fotos al día, y mantenimiento mensual para que no vuelva a pasar.', service: 'Página web moderna con mantenimiento' },
    { key: 'caida', title: 'No carga o aparece suspendida', cost: 'Cada visita se pierde en una página de error, y los buscadores dejan de mostrarte.', fix: 'Recuperamos o reconstruimos el sitio en un alojamiento estable, con conexión segura y revisión mensual.', service: 'Página web moderna con mantenimiento' },
    { key: 'botones', title: 'Botones o formularios que no funcionan', cost: 'El cliente que ya quería escribirte por WhatsApp, agendar o cotizar se queda sin cómo hacerlo.', fix: 'Revisamos cada botón, número y formulario, y los probamos cada mes.', service: 'Corrección y mantenimiento mensual' },
    { key: 'celular', title: 'No se ve bien en el celular', cost: 'La mayoría de visitas llegan desde el celular: si hay que hacer zoom para leer, se van.', fix: 'Diseño pensado primero para celular, rápido y fácil de tocar.', service: 'Página web moderna con mantenimiento' },
    { key: 'manual', title: 'Todo se agenda o se pide a mano por WhatsApp', cost: 'Horas del equipo contestando lo mismo, y clientes que no esperan respuesta y se van con otro.', fix: 'Agenda o pedidos en línea conectados a tu WhatsApp, y un asistente que responde las 24 horas.', service: 'Agenda o pedidos en línea + asistente de WhatsApp' },
    { key: 'plantilla', title: 'Textos de plantilla o secciones vacías', cost: '"Título del sitio" o textos de relleno hacen ver el negocio descuidado, aunque no lo sea.', fix: 'Escribimos contigo los textos reales de cada sección y completamos lo que falta.', service: 'Página web moderna con mantenimiento' },
    { key: 'sin-web', title: 'Solo tienes Facebook o un directorio', cost: 'Dependes de una red que cambia sus reglas y no muestra tus servicios, horarios ni precios completos.', fix: 'Tu propia web con dominio y correo de tu empresa, conectada a tus redes y a WhatsApp.', service: 'Página web moderna con mantenimiento' },
    { key: 'seguridad', title: 'Sin conexión segura o con contenido extraño', cost: 'El navegador marca "No seguro" y a veces aparecen enlaces o textos que tú no publicaste.', fix: 'Limpieza de seguridad, certificado HTTPS y actualizaciones cada mes.', service: 'Corrección y mantenimiento mensual' },
    { key: 'construccion', title: 'Dice "en construcción" desde hace tiempo', cost: 'Un aviso permanente hace pensar que el negocio no está activo.', fix: 'Publicamos primero lo esencial y sumamos el resto por etapas.', service: 'Página web moderna con mantenimiento' }
  ];

  // Cuánto baja la "salud" de la web cada problema (orientativo, para la demostración).
  const weights = { caida: 45, 'sin-web': 35, seguridad: 20, construccion: 18, botones: 16, celular: 15, manual: 12, desactualizada: 12, plantilla: 10 };
  const icons = {
    desactualizada: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="8"/>',
    caida: '<path d="M4 4l16 16M9.5 5.5A8 8 0 0 1 20 12M4 12a8 8 0 0 0 11 7.4"/>',
    botones: '<rect x="4" y="8" width="16" height="8" rx="4"/><path d="M15 3l-2 4M9 21l2-4"/>',
    celular: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
    manual: '<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z"/>',
    plantilla: '<path d="M5 6h14M5 11h9M5 16h12"/>',
    'sin-web': '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.5 2.5 13.5 0 16M12 4c-2.5 2.5-2.5 13.5 0 16"/>',
    seguridad: '<rect x="6" y="10" width="12" height="9" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0"/>',
    construccion: '<path d="M3 20h18M6 20l6-14 6 14M8 15h8"/>'
  };

  const diag = document.getElementById('diagnostico');
  if (diag) {
    const list = diag.querySelector('[data-diag-list]');
    const detail = diag.querySelector('[data-diag-detail]');
    const summary = diag.querySelector('[data-diag-summary]');
    const send = diag.querySelector('[data-diag-send]');
    const browser = diag.querySelector('[data-diag-browser]');
    const score = diag.querySelector('[data-diag-score]');
    const points = diag.querySelector('[data-diag-points]');
    const viewButtons = [...diag.querySelectorAll('[data-diag-view]')];
    const picked = new Set();
    let current = problems[4];
    let shown = 100;
    let counter;

    problems.forEach(problem => {
      const button = el('button', 'diag-item');
      button.type = 'button';
      button.dataset.problem = problem.key;
      button.setAttribute('aria-pressed', 'false');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true'); icon.classList.add('diag-icon');
      icon.innerHTML = icons[problem.key];
      button.append(icon, el('span', null, problem.title), el('i', 'diag-check'));
      button.querySelector('i').setAttribute('aria-hidden', 'true');
      list.append(button);
    });

    function animateScore(target) {
      clearInterval(counter);
      score.dataset.level = target >= 80 ? 'ok' : target >= 50 ? 'warn' : 'bad';
      score.style.setProperty('--score', target);
      if (still()) { shown = target; points.textContent = String(target); return; }
      counter = setInterval(() => {
        shown += Math.sign(target - shown) * Math.max(1, Math.round(Math.abs(target - shown) / 6));
        points.textContent = String(shown);
        if (shown === target) clearInterval(counter);
      }, 30);
    }

    function setView(view) {
      browser.dataset.view = view;
      viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.diagView === view)));
      const fixed = view === 'nexo';
      animateScore(fixed ? 98 : Math.max(8, 100 - [...picked].reduce((sum, key) => sum + weights[key], 0)));
    }

    function render(focusKey) {
      list.querySelectorAll('[data-problem]').forEach(button => {
        button.setAttribute('aria-pressed', String(picked.has(button.dataset.problem)));
        button.classList.toggle('is-current', button.dataset.problem === current.key);
      });
      problems.forEach(problem => browser.classList.toggle(`has-${problem.key}`, picked.has(problem.key)));
      // Resalta en la ventana el defecto que se acaba de marcar.
      browser.querySelectorAll('.is-flash').forEach(node => node.classList.remove('is-flash'));
      if (focusKey && picked.has(focusKey)) {
        browser.querySelectorAll(`[data-def="${focusKey}"]`).forEach(node => { void node.offsetWidth; node.classList.add('is-flash'); });
      }
      detail.classList.remove('is-changing'); void detail.offsetWidth; detail.classList.add('is-changing');
      detail.querySelector('[data-diag-title]').textContent = current.title;
      detail.querySelector('[data-diag-cost]').textContent = current.cost;
      detail.querySelector('[data-diag-fix]').textContent = current.fix;
      detail.querySelector('[data-diag-service]').textContent = current.service;
      const services = [...new Set(problems.filter(p => picked.has(p.key)).map(p => p.service))];
      summary.textContent = picked.size
        ? `Marcaste ${picked.size} ${picked.size === 1 ? 'problema' : 'problemas'}. Te proponemos: ${services.join('; ')}.`
        : 'Marca los problemas que veas y mira cómo se ve tu web para tus clientes.';
      setView(browser.dataset.view === 'nexo' && picked.size ? 'hoy' : browser.dataset.view);
    }

    list.addEventListener('click', event => {
      const button = event.target instanceof Element && event.target.closest('[data-problem]');
      if (!button) return;
      const key = button.dataset.problem;
      if (picked.has(key)) picked.delete(key); else picked.add(key);
      current = problems.find(p => p.key === key);
      browser.dataset.view = 'hoy';
      render(key);
    });
    viewButtons.forEach(button => button.addEventListener('click', () => setView(button.dataset.diagView)));

    send?.addEventListener('click', () => {
      const field = document.getElementById('project-description');
      if (!field) return;
      const chosen = problems.filter(p => picked.has(p.key)).map(p => `- ${p.title}`);
      const text = chosen.length ? `Revisé mi web y veo esto:\n${chosen.join('\n')}\n\nMi negocio es…` : '';
      if (text && (!field.value.trim() || field.dataset.prefilled === 'diag')) { field.value = text; field.dataset.prefilled = 'diag'; }
    });
    render();
  }

  /* ---------- Sectores con asistente de WhatsApp ---------- */
  const hours = ['Mañana 9:00', 'Mañana 11:30', 'Jueves 4:00 p. m.'];
  const sectors = [
    { key: 'salud', label: 'Clínicas dentales y médicas', brand: 'Clínica Sonrisa', builds: ['Web con servicios, especialistas y sedes', 'Citas en línea por especialista y sede', 'Recordatorios automáticos para reducir inasistencias'],
      intent: 'Agendar una cita', ask1: '¡Claro! ¿Qué servicio necesitas?', opts1: ['Valoración', 'Limpieza', 'Ortodoncia', 'Urgencia'], ask2: 'Tengo estos horarios disponibles:', opts2: hours,
      done: (a, b) => `Listo: ${a.toLowerCase()} agendada para ${b.toLowerCase()}. Te recordaré un día antes por aquí.`,
      info: ['Horario y dirección', 'Atendemos de lunes a sábado, de 8:00 a. m. a 6:00 p. m. Te comparto la ubicación para llegar fácil.'],
      panel: 'Agenda de la clínica', rows: [['9:00', 'Control de ortodoncia', 'Confirmada'], ['10:30', 'Primera valoración', 'Confirmada']] },
    { key: 'veterinaria', label: 'Veterinarias', brand: 'Clínica Huellitas', builds: ['Web con servicios, urgencias y especialidades', 'Agenda de consultas, vacunas y peluquería', 'Avisos de próxima vacuna por WhatsApp'],
      intent: 'Agendar consulta', ask1: '¿Cuál es el motivo de la visita?', opts1: ['Vacunas', 'Consulta general', 'Peluquería', 'Urgencia'], ask2: 'Perfecto. Elige un horario:', opts2: hours,
      done: (a, b) => `Agendado: ${a.toLowerCase()} para ${b.toLowerCase()}. Te avisaremos tres días antes de la próxima vacuna.`,
      info: ['¿Atienden urgencias?', 'Sí, la línea de urgencias funciona las 24 horas. Si es grave, llámanos y sal hacia la clínica.'],
      panel: 'Consultas de hoy', rows: [['8:30', 'Vacuna anual · Lola', 'Confirmada'], ['11:00', 'Control · Max', 'Confirmada']] },
    { key: 'distribucion', label: 'Ferreterías y distribuidoras', brand: 'Ferretería El Tornillo', builds: ['Catálogo con precios para mostrador y mayoristas', 'Cotizador en línea que llega a tu correo y CRM', 'Pedidos por WhatsApp con estado de despacho'],
      intent: 'Cotizar productos', ask1: '¿Qué producto necesitas?', opts1: ['Cemento 50 kg', 'Varilla 3/8"', 'Pintura 5 galones'], ask2: '¿Qué cantidad?', opts2: ['10 unidades', '50 unidades', '100 unidades'],
      done: (a, b) => `Cotización C-2041 lista: ${b} de ${a}. Te la envié al correo y vale por 7 días. ¿Te llamamos para coordinar el transporte?`,
      info: ['¿Hacen envíos?', 'Sí, despachamos en la ciudad y alrededores. Con tu cotización calculamos el envío.'],
      panel: 'Cotizaciones del día', rows: [['C-2039', 'Tubería PVC · 40 und', 'Enviada'], ['C-2040', 'Bloques · 500 und', 'Aprobada']] },
    { key: 'industria', label: 'Fábricas e industria', brand: 'Metales Andinos', builds: ['Web corporativa con catálogo técnico', 'Formulario de cotización con planos y medidas', 'CRM para seguir cada solicitud hasta el pedido'],
      intent: 'Solicitar cotización', ask1: '¿Qué necesitas fabricar o comprar?', opts1: ['Piezas a medida', 'Tubería', 'Perfiles y láminas'], ask2: '¿Para cuándo lo necesitas?', opts2: ['Este mes', 'En dos meses', 'Solo estoy averiguando'],
      done: (a) => `Solicitud S-318 registrada: ${a.toLowerCase()}. Un ingeniero te contacta en menos de 24 horas.`,
      info: ['Fichas técnicas', 'Te comparto el catálogo técnico en PDF con medidas, materiales y normas.'],
      panel: 'Solicitudes en el CRM', rows: [['S-316', 'Fundición · 200 kg', 'En revisión'], ['S-317', 'Perfiles · obra', 'Cotizada']] },
    { key: 'legal', label: 'Abogados, notarías y contadores', brand: 'Estudio Ríos & Asociados', builds: ['Web con áreas de práctica y equipo', 'Agenda de consultas y videollamadas', 'Portal para enviar documentos y ver el avance'],
      intent: 'Agendar una consulta', ask1: '¿Sobre qué tema es tu consulta?', opts1: ['Laboral', 'Familia', 'Impuestos', 'Trámite notarial'], ask2: '¿Cómo prefieres reunirte?', opts2: ['Videollamada mañana 10:00', 'Presencial jueves 4:00 p. m.'],
      done: (a, b) => `Consulta de ${a.toLowerCase()} agendada: ${b.toLowerCase()}. Te envío la lista de documentos que conviene tener a mano.`,
      info: ['¿Cuánto cuesta la consulta?', 'Te lo confirmamos según el tema; antes de la reunión recibes el valor por escrito.'],
      panel: 'Consultas agendadas', rows: [['Lun 9:00', 'Contrato laboral', 'Confirmada'], ['Lun 3:00', 'Escritura', 'Documentos ok']] },
    { key: 'educacion', label: 'Colegios y academias', brand: 'Academia Arte Vivo', builds: ['Web con programas, horarios y docentes', 'Inscripción y pago en línea', 'Recordatorios de pagos y clases'],
      intent: 'Inscribirme', ask1: '¿Qué programa te interesa?', opts1: ['Música', 'Danza', 'Preuniversitario'], ask2: '¿En qué horario?', opts2: ['Mañanas', 'Tardes', 'Sábados'],
      done: (a, b) => `Preinscripción lista: ${a.toLowerCase()}, ${b.toLowerCase()}. Te envío el enlace de pago y la fecha de inicio.`,
      info: ['¿Hay clase de prueba?', 'Sí, puedes agendar una clase de prueba sin costo antes de inscribirte.'],
      panel: 'Inscripciones', rows: [['#1182', 'Piano · tardes', 'Pagada'], ['#1183', 'Danza · sábados', 'Pendiente']] },
    { key: 'restaurante', label: 'Restaurantes y alimentos', brand: 'Parrilla La Brasa', builds: ['Web con menú, sedes y horarios', 'Pedidos y reservas en línea', 'Pedidos por WhatsApp directo a la cocina'],
      intent: 'Hacer un pedido', ask1: '¿Qué te provoca hoy?', opts1: ['Combo familiar', 'Bife de chorizo', 'Empanadas x6'], ask2: '¿Cómo lo recibes?', opts2: ['A domicilio', 'Recojo en la sede'],
      done: (a, b) => `Pedido P-512 recibido: ${a.toLowerCase()}, ${b.toLowerCase()}. Tiempo estimado: 35 minutos.`,
      info: ['Reservar una mesa', 'Claro. Dime para cuántas personas y a qué hora, y te confirmo la mesa en la sede que prefieras.'],
      panel: 'Pedidos en cocina', rows: [['P-510', 'Parrillada x2', 'Preparando'], ['P-511', 'Empanadas x12', 'En camino']] },
    { key: 'hotel', label: 'Hoteles y turismo', brand: 'Hotel Casa Brisa', builds: ['Web bilingüe con habitaciones y experiencias', 'Reservas directas sin comisiones', 'Asistente que responde dudas a cualquier hora'],
      intent: 'Reservar', ask1: '¿Qué tipo de habitación buscas?', opts1: ['Doble', 'Suite', 'Familiar'], ask2: '¿Para cuándo?', opts2: ['Este fin de semana', 'La próxima semana'],
      done: (a, b) => `Reserva preconfirmada: habitación ${a.toLowerCase()}, ${b.toLowerCase()}. Te envío el enlace de pago seguro y cómo llegar.`,
      info: ['¿Incluye desayuno?', 'Sí, todas las tarifas directas incluyen desayuno y acceso al spa.'],
      panel: 'Reservas', rows: [['R-2201', 'Suite · 2 noches', 'Pagada'], ['R-2202', 'Doble · 1 noche', 'Por pagar']] },
    { key: 'taller', label: 'Talleres automotrices', brand: 'Taller Motor Uno', builds: ['Web con servicios y marcas que atiendes', 'Cita previa en línea', 'Aviso por WhatsApp cuando el vehículo está listo'],
      intent: 'Pedir cita', ask1: '¿Qué servicio necesita tu vehículo?', opts1: ['Mantenimiento', 'Frenos', 'Diagnóstico', 'Chapa y pintura'], ask2: 'Elige un horario:', opts2: hours,
      done: (a, b) => `Cita confirmada: ${a.toLowerCase()}, ${b.toLowerCase()}. Te escribimos cuando tu vehículo esté listo.`,
      info: ['¿Cuánto tarda un mantenimiento?', 'Un mantenimiento básico tarda unas dos horas. Puedes esperar o dejarlo y te avisamos.'],
      panel: 'Citas del taller', rows: [['8:00', 'Frenos · sedán', 'En taller'], ['10:00', 'Mantenimiento · SUV', 'Listo']] },
    { key: 'inmobiliaria', label: 'Inmobiliarias y constructoras', brand: 'Hábitat Inmobiliaria', builds: ['Web con inmuebles, fotos y filtros', 'Agenda de visitas a la sala de ventas', 'CRM para no perder ningún interesado'],
      intent: 'Ver inmuebles', ask1: '¿Qué buscas?', opts1: ['Apartamento', 'Casa', 'Local comercial'], ask2: '¿Cuándo puedes visitarlo?', opts2: ['Sábado 10:00', 'Entre semana en la tarde'],
      done: (a, b) => `Te envié 3 opciones de ${a.toLowerCase()} y agendé tu visita: ${b.toLowerCase()}. Un asesor te acompaña.`,
      info: ['Opciones de crédito', 'Te compartimos los bancos con los que trabajamos y un simulador de cuota.'],
      panel: 'Visitas agendadas', rows: [['Sáb 9:00', 'Apto 3 hab.', 'Confirmada'], ['Sáb 11:00', 'Casa esquinera', 'Confirmada']] },
    { key: 'logistica', label: 'Transporte y logística', brand: 'Carga Express', builds: ['Web corporativa con servicios y cobertura', 'Cotizador de envíos en línea', 'Rastreo del envío por guía y WhatsApp'],
      intent: 'Cotizar un envío', ask1: '¿Qué vas a enviar?', opts1: ['Paquetes', 'Carga paletizada', 'Vehículo completo'], ask2: '¿Qué ruta?', opts2: ['Dentro de la ciudad', 'Nacional'],
      done: (a, b) => `Cotización T-877 lista: ${a.toLowerCase()}, ${b.toLowerCase()}. Al confirmar te enviamos la guía para rastrearlo.`,
      info: ['Rastrear mi envío', 'Tu envío G-55210 salió de bodega hoy a las 8:40 a. m. y llega mañana antes del mediodía.'],
      panel: 'Envíos', rows: [['G-55208', 'Bogotá → Cali', 'En ruta'], ['G-55209', 'Local · 3 cajas', 'Entregado']] }
  ];

  const root = document.getElementById('sectores');
  if (!root) return;
  const tabs = root.querySelector('[data-sector-tabs]');
  const buildsList = root.querySelector('[data-sector-builds]');
  const title = root.querySelector('[data-sector-title]');
  const chat = root.querySelector('[data-chat]');
  const chatName = root.querySelector('[data-chat-name]');
  const replies = root.querySelector('[data-chat-replies]');
  const panelTitle = root.querySelector('[data-panel-title]');
  const panelRows = root.querySelector('[data-panel-rows]');
  const restart = root.querySelector('[data-chat-restart]');
  // Una propuesta personalizada puede abrir directamente su sector con data-initial.
  let sector = sectors.find(item => item.key === root.dataset.initial) || sectors[0];
  let run = 0;

  sectors.forEach((item, index) => {
    const tab = el('button', 'sector-tab', item.label);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.id = `sector-tab-${item.key}`;
    tab.dataset.sector = item.key;
    tab.setAttribute('aria-controls', 'sector-panel');
    tab.setAttribute('aria-selected', String(item === sector));
    tab.tabIndex = item === sector ? 0 : -1;
    tabs.append(tab);
  });

  function bubble(text, who) {
    const node = el('div', `chat-msg chat-${who}`, text);
    chat.append(node);
    chat.scrollTop = chat.scrollHeight;
    return node;
  }
  async function botSays(text, token) {
    const typing = el('div', 'chat-msg chat-bot chat-typing');
    typing.setAttribute('aria-hidden', 'true');
    typing.append(el('i'), el('i'), el('i'));
    chat.append(typing); chat.scrollTop = chat.scrollHeight;
    await wait(700 + Math.min(900, text.length * 12));
    typing.remove();
    if (token !== run) return false;
    bubble(text, 'bot');
    return true;
  }
  function ask(options, token) {
    return new Promise(resolve => {
      replies.replaceChildren(...options.map(option => {
        const button = el('button', 'chat-reply', option);
        button.type = 'button';
        button.addEventListener('click', () => {
          if (token !== run) return;
          replies.replaceChildren();
          bubble(option, 'user');
          resolve(option);
        });
        return button;
      }));
    });
  }
  function renderPanel(extra) {
    panelTitle.textContent = sector.panel;
    const rows = extra ? [...sector.rows, extra] : sector.rows;
    panelRows.replaceChildren(...rows.map((row, i) => {
      const tr = el('li', extra && i === rows.length - 1 ? 'is-new' : '');
      tr.append(el('b', null, row[0]), el('span', null, row[1]), el('em', null, row[2]));
      return tr;
    }));
  }

  async function conversation() {
    const token = ++run;
    chat.replaceChildren();
    replies.replaceChildren();
    if (!(await botSays(`¡Hola! Soy el asistente de ${sector.brand}. Respondo a cualquier hora. ¿En qué te ayudo?`, token))) return;
    const choice = await ask([sector.intent, sector.info[0]], token);
    if (token !== run) return;
    if (choice === sector.info[0]) {
      if (!(await botSays(sector.info[1], token))) return;
      if (!(await botSays(`¿Quieres ${sector.intent.charAt(0).toLowerCase() + sector.intent.slice(1)}?`, token))) return;
      await ask([sector.intent], token);
      if (token !== run) return;
    }
    if (!(await botSays(sector.ask1, token))) return;
    const a = await ask(sector.opts1, token);
    if (token !== run) return;
    if (!(await botSays(sector.ask2, token))) return;
    const b = await ask(sector.opts2, token);
    if (token !== run) return;
    const reply = sector.done(a, b);
    if (!(await botSays(reply, token))) return;
    // La nueva fila usa el código que dio el asistente o, si no hay, la hora elegida.
    const code = reply.match(/\b[A-Z]-\d+\b/)?.[0] || b.match(/\d{1,2}:\d{2}/)?.[0] || 'Nuevo';
    renderPanel([code, a, 'Nuevo']);
    root.querySelector('.sector-panel-team')?.classList.add('has-new');
  }

  function select(key, focus) {
    sector = sectors.find(item => item.key === key) || sectors[0];
    tabs.querySelectorAll('[role="tab"]').forEach(tab => {
      const on = tab.dataset.sector === sector.key;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    root.querySelector('#sector-panel').setAttribute('aria-labelledby', `sector-tab-${sector.key}`);
    title.textContent = sector.label;
    chatName.textContent = sector.brand;
    buildsList.replaceChildren(...sector.builds.map(text => el('li', null, text)));
    root.querySelector('.sector-panel-team')?.classList.remove('has-new');
    renderPanel();
    conversation();
  }

  tabs.addEventListener('click', event => {
    const tab = event.target instanceof Element && event.target.closest('[role="tab"]');
    if (tab) select(tab.dataset.sector);
  });
  tabs.addEventListener('keydown', event => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = sectors.indexOf(sector);
    const next = { ArrowRight: index + 1, ArrowDown: index + 1, ArrowLeft: index - 1, ArrowUp: index - 1, Home: 0, End: sectors.length - 1 }[event.key];
    select(sectors[(next + sectors.length) % sectors.length].key, true);
  });
  restart?.addEventListener('click', conversation);

  // Arranca la conversación cuando la sección se ve, no antes.
  let started = false;
  const begin = () => { if (!started) { started = true; select(sector.key); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry], observer) => { if (entry.isIntersecting) { begin(); observer.disconnect(); } }, { threshold: .25 }).observe(root);
  } else begin();
  // Para el recorrido guiado y para quien llega con #sectores.
  window.nexoSectores = { select, begin };
})();
