'use strict';
// LUMBRE · Reservas y salón. Todo ocurre en este navegador con datos de ejemplo:
// no se envían mensajes, no se hacen reservas reales y el reloj del salón es simulado.
(() => {
  const config = window.SITE_CONFIG || {};
  const studio = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Cromathic Studio';
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = studio; });
  document.title = document.title.replace('Cromathic Studio', studio);

  const KEY = 'nexo-auto-restaurante-v1';
  const CART_KEY = 'nexo-lumbre-demo-order-v1';
  const $ = id => document.getElementById(id);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reduced.matches;
  const narrow = window.matchMedia('(max-width: 980px)');
  const tallPlan = window.matchMedia('(max-width: 700px)');

  // ——— Reglas del salón ———
  const OPEN = 1135; // 18:55, hora inicial del reloj simulado
  const CLOSE = 1410; // 23:30
  const TURNS = { t1: { label: '19:00', start: 1140, name: 'Primer turno' }, t2: { label: '21:15', start: 1275, name: 'Segundo turno' } };
  const SIT = 95; // minutos de mesa hasta pedir la cuenta
  const PAY = 10; // minutos de la cuenta hasta liberar la mesa
  const GRACE = 15; // la mesa se guarda 15 minutos
  const NUDGE = 10; // aviso a los 10 minutos
  const ACTIVE = ['reservada', 'sentados', 'cuenta'];
  const STATUSES = [...ACTIVE, 'terminada', 'cancelada', 'noshow'];
  const ZONES = { salon: 'Salón', terraza: 'Terraza', cualquiera: 'Me da igual' };
  const TABLES = [
    { id: 'S1', seats: 2, zone: 'salon', shape: 'sq', wide: [90, 110], tall: [62, 100] },
    { id: 'S2', seats: 2, zone: 'salon', shape: 'sq', wide: [210, 110], tall: [154, 100] },
    { id: 'S3', seats: 2, zone: 'salon', shape: 'sq', wide: [330, 110], tall: [246, 100] },
    { id: 'S4', seats: 2, zone: 'salon', shape: 'sq', wide: [450, 110], tall: [338, 100] },
    { id: 'S5', seats: 4, zone: 'salon', shape: 'round', wide: [110, 275], tall: [75, 232] },
    { id: 'S6', seats: 4, zone: 'salon', shape: 'round', wide: [250, 275], tall: [200, 232] },
    { id: 'S7', seats: 4, zone: 'salon', shape: 'round', wide: [390, 275], tall: [325, 232] },
    { id: 'S8', seats: 6, zone: 'salon', shape: 'long', wide: [140, 455], tall: [105, 352] },
    { id: 'S9', seats: 6, zone: 'salon', shape: 'long', wide: [330, 455], tall: [295, 352] },
    { id: 'T1', seats: 2, zone: 'terraza', shape: 'sq', wide: [835, 115], tall: [75, 650] },
    { id: 'T2', seats: 4, zone: 'terraza', shape: 'round', wide: [835, 290], tall: [200, 655] },
    { id: 'T3', seats: 4, zone: 'terraza', shape: 'round', wide: [835, 465], tall: [320, 655] }
  ];
  const TABLE = Object.fromEntries(TABLES.map(table => [table.id, table]));
  const TOTAL_SEATS = TABLES.reduce((sum, table) => sum + table.seats, 0);
  const DISHES = { tostadas: 'Tostadas de la huerta', pesca: 'Pesca al fuego', arroz: 'Arroz de la tierra', cacao: 'Cacao y memoria' };

  // ——— Fechas y horas ———
  const pad = n => String(n).padStart(2, '0');
  const isoOf = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const dateOf = iso => { const [y, m, d] = String(iso).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
  const addDays = (iso, n) => { const date = dateOf(iso); date.setDate(date.getDate() + n); return isoOf(date); };
  const TODAY = isoOf(new Date());
  const TOMORROW = addDays(TODAY, 1);
  const hhmm = minutes => `${pad(Math.floor(minutes / 60) % 24)}:${pad(minutes % 60)}`;
  const longDate = iso => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(dateOf(iso));
  const shortDay = iso => new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric' }).format(dateOf(iso)).replace('.', '');
  const dayLabel = iso => (iso === TODAY ? 'Hoy' : iso === TOMORROW ? 'Mañana' : shortDay(iso));
  const dayPhrase = iso => (iso === TODAY ? 'hoy' : iso === TOMORROW ? 'mañana' : `el ${longDate(iso)}`);
  const persons = n => `${n} ${n === 1 ? 'persona' : 'personas'}`;
  const roundUp5 = n => Math.ceil(n / 5) * 5;
  const span = minutes => (minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  function dayChips() {
    const days = [];
    for (let i = 0; days.length < 4 && i < 10; i += 1) {
      const iso = addDays(TODAY, i);
      if (i === 0 || dateOf(iso).getDay() !== 1) days.push(iso);
    }
    return days;
  }

  // ——— Pedido de la web (solo lectura) ———
  function webOrder() {
    try {
      const data = JSON.parse(localStorage.getItem(CART_KEY) || 'null');
      const items = (Array.isArray(data?.items) ? data.items : []).filter(item => Object.hasOwn(DISHES, item?.id) && Number(item.qty) >= 1);
      if (!items.length) return null;
      return { count: items.reduce((sum, item) => sum + Math.floor(Number(item.qty)), 0), text: items.map(item => `${DISHES[item.id]} ×${Math.floor(Number(item.qty))}`).join(', ') };
    } catch { return null; }
  }

  // ——— Estado ———
  function booking(id, name, people, date, turn, zone, table, status, extra = {}) {
    return { id, name, people, date, turn, zone, table, status, seatedAt: null, billAt: null, arriveAt: null, holdUntil: null, nudged: false, confirmed: false, preorder: null, source: 'seed', ...extra };
  }
  function seed() {
    const T = TODAY;
    const state = {
      v: 1,
      clock: OPEN,
      seq: 515,
      bookings: [
        booking('L-501', 'Lucía Márquez', 2, T, 't1', 'salon', 'S1', 'sentados', { seatedAt: 1130, arriveAt: 1130, confirmed: true }),
        booking('L-502', 'Familia Restrepo', 6, T, 't1', 'salon', 'S8', 'reservada', { confirmed: true }),
        booking('L-503', 'Equipo Ardila', 5, T, 't1', 'salon', 'S9', 'sentados', { seatedAt: 1128, arriveAt: 1128, preorder: 'Menú del fuego ×5', confirmed: true }),
        booking('L-504', 'Camilo Vargas', 3, T, 't1', 'salon', 'S5', 'reservada', { arriveAt: 1142, confirmed: true }),
        booking('L-505', 'Valentina Ruiz', 4, T, 't1', 'terraza', 'T2', 'reservada', { arriveAt: 1147, confirmed: true }),
        booking('L-506', 'Andrés y Sofía', 2, T, 't1', 'salon', 'S3', 'reservada', { arriveAt: 1138, confirmed: true }),
        booking('L-507', 'Julián Mora', 2, T, 't1', 'terraza', 'T1', 'reservada', { arriveAt: 1150 }),
        booking('L-508', 'Mateo Gil', 4, T, 't2', 'salon', 'S5', 'reservada', { arriveAt: 1278 }),
        booking('L-509', 'Familia Gómez', 6, T, 't2', 'salon', 'S9', 'reservada', { arriveAt: 1281, preorder: 'Menú del fuego ×6', confirmed: true }),
        booking('L-510', 'Sara Peña', 2, T, 't2', 'salon', 'S1', 'reservada', { arriveAt: 1275 }),
        booking('L-511', 'Nicolás Ortega', 2, T, 't2', 'salon', 'S2', 'reservada', { arriveAt: 1290 }),
        booking('L-512', 'Paula Díaz', 4, T, 't2', 'terraza', 'T2', 'reservada', { arriveAt: 1283, confirmed: true }),
        booking('L-513', 'Ana Lucía Rey', 4, TOMORROW, 't1', 'salon', 'S6', 'reservada'),
        booking('L-514', 'Tomás Herrera', 2, TOMORROW, 't2', 'terraza', 'T1', 'reservada')
      ],
      tickets: [
        { id: 'C-503', booking: 'L-503', table: 'S9', label: 'Menú del fuego ×5', status: 'en marcha', at: 1128 },
        { id: 'C-509', booking: 'L-509', table: 'S9', label: 'Menú del fuego ×6', status: 'programada', at: null }
      ],
      waitlist: [],
      log: [
        { t: 1128, kind: 'cocina', text: 'Comanda a cocina · Mesa S9 · Menú del fuego ×5: primer tiempo en marcha.' },
        { t: 1128, kind: 'salon', text: 'Llegó Equipo Ardila (5) · mesa S9.' },
        { t: 1130, kind: 'salon', text: 'Llegó Lucía Márquez (2) · mesa S1.' },
        { t: 1020, kind: 'whatsapp', text: 'Recordatorios enviados a las 7 reservas del primer turno.' }
      ].sort((a, b) => b.t - a.t),
      phone: { screen: 'form', bookingId: null, waitId: null, chat: [] },
      rail: { done: [], current: 0 },
      selected: null
    };
    return state;
  }
  function validBooking(b) {
    return b && typeof b.id === 'string' && typeof b.name === 'string' && Number.isInteger(b.people) && b.people >= 1 && b.people <= 6
      && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && Object.hasOwn(TURNS, b.turn) && Object.hasOwn(TABLE, b.table) && STATUSES.includes(b.status);
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!data || data.v !== 1 || !Array.isArray(data.bookings) || !Array.isArray(data.waitlist) || !Array.isArray(data.tickets) || !Array.isArray(data.log)) return seed();
      if (!Number.isFinite(data.clock) || data.clock < OPEN || data.clock > CLOSE || !data.bookings.every(validBooking)) return seed();
      if (data.today !== TODAY) return seed(); // la noche de ejemplo siempre es la de hoy
      const phone = data.phone && typeof data.phone === 'object' ? data.phone : {};
      return {
        ...seed(),
        ...data,
        waitlist: data.waitlist.filter(w => w && typeof w.id === 'string' && Number.isInteger(w.people) && Object.hasOwn(TURNS, w.turn)),
        log: data.log.filter(entry => entry && typeof entry.text === 'string').slice(0, 120),
        phone: { screen: phone.screen === 'chat' ? 'chat' : 'form', bookingId: phone.bookingId || null, waitId: phone.waitId || null, chat: Array.isArray(phone.chat) ? phone.chat.filter(m => m && typeof m.text === 'string') : [] },
        rail: data.rail && Array.isArray(data.rail.done) ? data.rail : { done: [], current: 0 },
        selected: Object.hasOwn(TABLE, data.selected) ? data.selected : null
      };
    } catch { return seed(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ ...s, today: TODAY })); } catch { /* sin almacenamiento la demo sigue en memoria */ }
  }

  let s = load();
  let flash = null; // resaltado temporal de una mesa (no se guarda)
  let renderedChat = s.phone.chat.length;
  let renderedLog = s.log.length;
  let typing = false;

  // ——— Consultas ———
  const tonight = () => s.bookings.filter(b => b.date === TODAY);
  const occupying = b => ACTIVE.includes(b.status);
  const findBooking = id => s.bookings.find(b => b.id === id);
  const currentTurn = () => (s.clock < 1260 ? 't1' : 't2');
  const isFree = (tableId, date, turn) => !s.bookings.some(b => b.table === tableId && b.date === date && b.turn === turn && occupying(b));
  const turnOpen = (date, turn) => date !== TODAY || s.clock <= TURNS[turn].start + 45;
  // Lo que pasa ahora en la mesa. Una reserva del segundo turno solo «monta» la mesa desde las 20:15.
  function liveBooking(tableId) {
    const next = tonight().filter(b => b.table === tableId && occupying(b)).sort((a, b) => TURNS[a.turn].start - TURNS[b.turn].start)[0] || null;
    if (next && next.status === 'reservada' && next.turn === 't2' && s.clock < TURNS.t2.start - 60) return null;
    return next;
  }
  function bestTable(people, date, turn, zone) {
    const options = TABLES.filter(t => t.seats >= people && t.seats - people <= 4 && isFree(t.id, date, turn));
    if (!options.length) return null;
    const score = t => (t.seats - people) * 4 + (zone !== 'cualquiera' && t.zone !== zone ? 10 : 0);
    const table = options.sort((a, b) => score(a) - score(b) || a.id.localeCompare(b.id))[0];
    const empty = table.seats - people;
    const zoneOk = zone === 'cualquiera' || table.zone === zone;
    const reason = `${empty === 0 ? 'Sin sillas vacías' : `La más ajustada libre (${empty} ${empty === 1 ? 'silla sobra' : 'sillas sobran'})`}${zoneOk ? '' : ` · no quedaba sitio en ${ZONES[zone].toLowerCase()}`}`;
    return { table, reason, zoneOk };
  }
  function eta(people, date, turn) {
    if (date !== TODAY) return null;
    const ends = s.bookings
      .filter(b => b.date === date && b.turn === turn && occupying(b) && TABLE[b.table].seats >= people && TABLE[b.table].seats - people <= 4)
      .map(b => (b.status === 'cuenta' ? b.billAt + PAY : (b.seatedAt ?? Math.max(TURNS[turn].start, s.clock)) + SIT + PAY));
    if (!ends.length) return null;
    const at = roundUp5(Math.max(Math.min(...ends), s.clock + 10));
    return { at, minutes: at - s.clock };
  }

  // ——— Registro, pasos y narración ———
  const NARRATION = $('la-narration');
  function log(kind, text) {
    s.log.unshift({ t: s.clock, kind, text });
    if (s.log.length > 120) s.log.length = 120;
  }
  function step(n, text) {
    if (!s.rail.done.includes(n)) s.rail.done.push(n);
    s.rail.current = n;
    if (text) narrate(text);
  }
  function narrate(html) { NARRATION.innerHTML = html; }

  // ——— Acciones del salón ———
  function nextId() { s.seq += 1; return `L-${s.seq}`; }
  function addTicket(b) {
    if (!b.preorder) return;
    s.tickets.push({ id: `C-${b.id.slice(2)}`, booking: b.id, table: b.table, label: b.preorder, status: 'programada', at: null });
  }
  function ticketOf(b) { return s.tickets.find(t => t.booking === b.id); }
  function highlight(tableId, kind) {
    flash = { table: tableId, kind, until: Date.now() + 3400 };
    window.setTimeout(() => { if (flash && flash.until <= Date.now()) { flash = null; renderPlan(); } }, 3500);
  }
  function createBooking(data) {
    const b = booking(nextId(), data.name, data.people, data.date, data.turn, data.zone, data.table, 'reservada', {
      preorder: data.preorder || null,
      source: data.source || 'web',
      arriveAt: data.date === TODAY ? Math.max(TURNS[data.turn].start, s.clock) + (data.arriveIn ?? 5) : null,
      holdUntil: data.date === TODAY ? Math.max(TURNS[data.turn].start, s.clock) + GRACE : null
    });
    s.bookings.push(b);
    addTicket(b);
    return b;
  }
  function seat(b, auto = false) {
    b.status = 'sentados';
    b.seatedAt = s.clock;
    log('salon', `${auto ? 'Llegó' : 'Sentados'} ${b.name} (${b.people}) · mesa ${b.table}.`);
    const ticket = ticketOf(b);
    if (ticket && ticket.status === 'programada') {
      ticket.status = 'en marcha';
      ticket.at = s.clock;
      ticket.table = b.table;
      log('cocina', `Comanda a cocina · Mesa ${b.table} · ${ticket.label}: primer tiempo en marcha.`);
      step(5, `<strong>5 · Llegan y cocina arranca.</strong> ${escapeHtml(b.name)} se sentó en la mesa ${b.table} y la comanda (${escapeHtml(ticket.label)}) salió sola a cocina.`);
    }
  }
  function bill(b) {
    b.status = 'cuenta';
    b.billAt = s.clock;
    const ticket = ticketOf(b);
    if (ticket && ticket.status === 'en marcha') ticket.status = 'servida';
    log('salon', `Mesa ${b.table} pidió la cuenta (${b.name}).`);
  }
  function release(b, reason) {
    const table = b.table;
    if (reason === 'pagada') {
      b.status = 'terminada';
      log('salon', `Mesa ${table} cobrada y libre.`);
    } else {
      b.status = reason;
      s.tickets = s.tickets.filter(t => t.booking !== b.id || t.status !== 'programada');
    }
    if (b.date !== TODAY) { runWaitlist(); return; }
    const next = tonight().find(other => other.table === table && other.status === 'reservada' && TURNS[other.turn].start > TURNS[b.turn].start);
    if (reason === 'pagada' && next && s.clock < TURNS[next.turn].start - 60) {
      log('salon', `Mesa ${table} libre hasta las ${TURNS[next.turn].label} (reserva de ${next.name}).`);
      highlight(table, 'released');
    } else if (reason === 'pagada' && next) {
      log('salon', `Rotación de turno: mesa ${table} se monta para ${next.name} (${next.people}) a las ${TURNS[next.turn].label}.`);
      step(7, `<strong>7 · Rota el turno.</strong> La mesa ${table} terminó el primer turno y ya está montada para ${escapeHtml(next.name)} a las ${TURNS[next.turn].label}.`);
      highlight(table, 'assigned');
    } else {
      highlight(table, 'released');
    }
    runWaitlist();
  }
  function noShow(b, auto = true) {
    log('alerta', `${auto ? 'No llegó' : 'Marcada como no-show'}: ${b.name} · mesa ${b.table} liberada${auto ? ` a los ${GRACE} minutos` : ''}.`);
    log('whatsapp', `WhatsApp a ${b.name}: «Liberamos tu mesa de las ${TURNS[b.turn].label}. Si aún vienes, escríbenos y te buscamos sitio».`);
    step(6, `<strong>6 · El no-show libera la mesa.</strong> ${escapeHtml(b.name)} no llegó: a los ${GRACE} minutos la mesa ${b.table} quedó libre y pasó a la lista de espera.`);
    release(b, 'noshow');
  }
  function cancelBooking(b, byGuest = false) {
    log('reserva', `${byGuest ? `${b.name} canceló por WhatsApp` : `Reserva ${b.id} cancelada`} · mesa ${b.table} libre.`);
    release(b, 'cancelada');
  }
  function runWaitlist() {
    for (const entry of [...s.waitlist]) {
      if (entry.date === TODAY && s.clock > TURNS[entry.turn].start + 120) continue;
      const pick = bestTable(entry.people, entry.date, entry.turn, entry.zone);
      if (!pick) continue;
      s.waitlist = s.waitlist.filter(w => w.id !== entry.id);
      const b = createBooking({ ...entry, table: pick.table.id, source: 'espera', arriveIn: 10 });
      b.holdUntil = s.clock + 20;
      b.arriveAt = s.clock + 10;
      log('reserva', `Lista de espera → ${entry.name} (${entry.people}) recibe la mesa ${pick.table.id}.`);
      log('whatsapp', `WhatsApp a ${entry.name}: «Se liberó una mesa para ${entry.people}. Te la guardamos hasta las ${hhmm(b.holdUntil)}».`);
      highlight(pick.table.id, 'assigned');
      if (s.phone.waitId === entry.id) {
        s.phone.bookingId = b.id;
        s.phone.waitId = null;
        queueSay([{ who: 'in', tag: 'Lista de espera', text: `¡Buenas noticias, ${entry.name}! Se liberó la mesa ${pick.table.id} para ${persons(entry.people)}. Te la guardamos hasta las ${hhmm(b.holdUntil)}.` }]);
      }
    }
  }
  function tick() {
    s.clock += 5;
    const list = tonight();
    list.filter(b => b.status === 'reservada' && b.arriveAt !== null && s.clock >= b.arriveAt).forEach(b => seat(b, true));
    list.filter(b => b.status === 'reservada').forEach(b => {
      const limit = b.holdUntil ?? TURNS[b.turn].start + GRACE;
      if (!b.nudged && s.clock >= limit - (GRACE - NUDGE) && s.clock < limit) {
        b.nudged = true;
        log('whatsapp', `WhatsApp automático a ${b.name}: «¿Vienen en camino? Guardamos la mesa ${b.table} hasta las ${hhmm(limit)}».`);
      }
      if (s.clock >= limit) noShow(b);
    });
    list.filter(b => b.status === 'sentados' && s.clock >= b.seatedAt + SIT).forEach(bill);
    list.filter(b => b.status === 'cuenta' && s.clock >= b.billAt + PAY).forEach(b => release(b, 'pagada'));
  }
  function advance(minutes) {
    const steps = Math.round(minutes / 5);
    for (let i = 0; i < steps && s.clock < CLOSE; i += 1) tick();
    commit();
  }

  // ——— Solicitud desde el teléfono ———
  function request(data) {
    const pick = bestTable(data.people, data.date, data.turn, data.zone);
    s.phone.chat = s.phone.chat.filter(m => !m.actions || m.used); // limpia ofertas sin responder
    const asked = `Hola, mesa para ${data.people} ${dayPhrase(data.date)} a las ${TURNS[data.turn].label}${data.zone !== 'cualquiera' ? `, en ${ZONES[data.zone].toLowerCase()}` : ''}${data.preKind === 'fuego' ? '. Queremos el menú del fuego' : data.preKind === 'web' ? '. Sumen mi pedido de la web' : ''}. A nombre de ${data.name}.`;
    pushMsg({ who: 'out', text: asked });
    log('reserva', `Solicitud de ${data.name}: ${persons(data.people)}, ${dayLabel(data.date).toLowerCase()} ${TURNS[data.turn].label}, ${ZONES[data.zone].toLowerCase()}.`);
    step(1, `<strong>1 · Pide mesa.</strong> ${escapeHtml(data.name)} pidió mesa para ${data.people}, ${escapeHtml(dayPhrase(data.date))} a las ${TURNS[data.turn].label}.`);
    if (pick) {
      const b = createBooking({ ...data, table: pick.table.id });
      s.phone.bookingId = b.id;
      s.phone.waitId = null;
      log('reserva', `Mesa ${pick.table.id} asignada a ${b.id} · ${pick.reason}.`);
      log('whatsapp', `Confirmación enviada a ${data.name} por WhatsApp. Recordatorio programado para las ${hhmm(TURNS[data.turn].start - 120)}.`);
      if (b.preorder) log('cocina', `Cocina avisada: ${b.preorder} para la mesa ${b.table} a las ${TURNS[data.turn].label}.`);
      if (b.date === TODAY) highlight(b.table, 'assigned');
      step(2, `<strong>2 · Elige la mejor mesa.</strong> Mesa ${pick.table.id} (${pick.table.seats} sillas, ${ZONES[pick.table.zone].toLowerCase()}): ${escapeHtml(pick.reason.toLowerCase())}.${b.date === TODAY ? '' : ' Queda en «Próximas noches».'}`);
      commit();
      return queueSay([
        { who: 'in', tag: 'Reserva confirmada', text: `¡Listo, ${data.name}! Mesa para ${persons(data.people)} ${dayPhrase(data.date)} a las ${TURNS[data.turn].label}, en ${ZONES[pick.table.zone].toLowerCase()} (mesa ${pick.table.id}). Código ${b.id}. Te guardamos la mesa ${GRACE} minutos.${b.preorder ? ` Cocina ya sabe: ${b.preorder.toLowerCase()}.` : ''}` },
        { who: 'in', tag: `Recordatorio automático · ${b.date === TODAY ? hhmm(TURNS[data.turn].start - 120) : '2 h antes'}`, text: `Te esperamos ${dayPhrase(data.date)} a las ${TURNS[data.turn].label} en LUMBRE. ¿Sigue en pie?`, actions: [{ label: 'Sí, ahí estaremos', act: 'confirm', ref: b.id }, { label: 'Necesito cancelar', act: 'cancel', ref: b.id }] }
      ]).then(() => { step(3, `<strong>3 · Confirma y recuerda.</strong> Confirmación al instante y recordatorio dos horas antes, con opción de cancelar desde el mismo chat.`); commit(); });
    }
    const wait = eta(data.people, data.date, data.turn);
    const other = data.turn === 't1' ? 't2' : 't1';
    const alt = turnOpen(data.date, other) && bestTable(data.people, data.date, other, data.zone);
    s.phone.bookingId = null;
    s.phone.pending = { ...data };
    log('alerta', `Sin mesa para ${data.people} a las ${TURNS[data.turn].label}: se ofrece lista de espera${alt ? ` o el turno de las ${TURNS[other].label}` : ''}.`);
    step(4, `<strong>4 · Lista de espera.</strong> No hay mesa para ${data.people} a las ${TURNS[data.turn].label}${wait ? `: espera estimada ${span(wait.minutes)} (hacia las ${hhmm(wait.at)})` : ''}. El sistema ofrece la lista${alt ? ' o el otro turno' : ''}.`);
    commit();
    const actions = [{ label: 'Unirme a la lista de espera', act: 'join' }];
    if (alt) actions.push({ label: `Mejor a las ${TURNS[other].label} (hay mesa)`, act: 'alt', ref: other });
    actions.push({ label: 'No, gracias', act: 'decline' });
    return queueSay([{ who: 'in', tag: 'Sin mesa en ese turno', text: `${data.name}, para ${persons(data.people)} a las ${TURNS[data.turn].label} no queda mesa ahora mismo.${wait ? ` Espera estimada: ${span(wait.minutes)}, hacia las ${hhmm(wait.at)}.` : ' Te avisamos si alguien cancela.'} Si se libera antes una mesa, te escribo al momento.`, actions }]);
  }
  function chatAction(msgIndex, actionIndex) {
    const msg = s.phone.chat[msgIndex];
    const action = msg?.actions?.[actionIndex];
    if (!action || msg.used) return Promise.resolve();
    msg.used = true;
    msg.chosen = actionIndex;
    pushMsg({ who: 'out', text: action.label });
    const pending = s.phone.pending;
    if (action.act === 'confirm') {
      const b = findBooking(action.ref);
      if (b) { b.confirmed = true; log('whatsapp', `${b.name} confirmó asistencia (${b.id}).`); }
      commit();
      return queueSay([{ who: 'in', text: '¡Perfecto! Encendemos la brasa para ustedes.' }]);
    }
    if (action.act === 'cancel') {
      const b = findBooking(action.ref);
      if (b && occupying(b)) cancelBooking(b, true);
      s.phone.bookingId = null;
      commit();
      return queueSay([{ who: 'in', text: 'Cancelada, gracias por avisar. La mesa pasa a quien está en la lista de espera.' }]);
    }
    if (action.act === 'join' && pending) {
      const entry = { id: `E-${s.seq + 1}`, name: pending.name, people: pending.people, date: pending.date, turn: pending.turn, zone: pending.zone, preorder: pending.preorder || null, since: s.clock };
      s.seq += 1;
      s.waitlist.push(entry);
      s.phone.waitId = entry.id;
      s.phone.pending = null;
      const position = s.waitlist.filter(w => w.date === entry.date && w.turn === entry.turn).length;
      log('reserva', `${entry.name} (${entry.people}) entra en la lista de espera de las ${TURNS[entry.turn].label} · puesto ${position}.`);
      commit();
      return queueSay([{ who: 'in', text: `Listo: estás en la lista de espera, puesto ${position}. Te escribo en cuanto se libere una mesa para ${entry.people}.` }]);
    }
    if (action.act === 'alt' && pending) {
      s.phone.pending = null;
      commit();
      return request({ ...pending, turn: action.ref });
    }
    s.phone.pending = null;
    commit();
    return queueSay([{ who: 'in', text: 'Entendido. ¡Ojalá te veamos pronto junto al fuego!' }]);
  }

  // ——— Chat ———
  function pushMsg(msg) {
    s.phone.chat.push({ ...msg, t: s.clock });
    s.phone.screen = 'chat';
  }
  let sayChain = Promise.resolve();
  function queueSay(messages) {
    sayChain = sayChain.then(async () => {
      renderPhone();
      for (const msg of messages) {
        if (!calm()) {
          typing = true;
          renderChatTyping();
          await sleepPlain(650);
          typing = false;
        }
        pushMsg(msg);
        save();
        renderPhone();
      }
    });
    return sayChain;
  }
  const sleepPlain = ms => new Promise(resolve => window.setTimeout(resolve, ms));

  // ——— Pintar: plano SVG ———
  const plan = $('la-plan');
  let planLayout = null;
  function dims(table, tall) {
    if (table.shape === 'sq') return { w: tall ? 54 : 62, h: tall ? 54 : 62 };
    if (table.shape === 'round') return { r: tall ? 38 : 44 };
    return { w: tall ? 150 : 170, h: tall ? 58 : 70 };
  }
  function tableSvg(table, tall) {
    const [cx, cy] = tall ? table.tall : table.wide;
    const d = dims(table, tall);
    let chairs = '';
    let body = '';
    let ring = '';
    let top;
    if (table.shape === 'round') {
      [0, 90, 180, 270].forEach(angle => { chairs += `<rect class="chair" x="-12" y="${-(d.r + 15)}" width="24" height="10" rx="5" transform="rotate(${angle})"/>`; });
      body = `<circle class="tbl-body" r="${d.r}"/>`;
      ring = `<circle class="tbl-ring" r="${d.r + 4}"/>`;
      top = d.r + 15;
    } else {
      const xs = table.shape === 'sq' ? [0] : [-d.w / 3, 0, d.w / 3];
      xs.forEach(x => {
        chairs += `<rect class="chair" x="${x - 13}" y="${-(d.h / 2 + 15)}" width="26" height="10" rx="5"/>`;
        chairs += `<rect class="chair" x="${x - 13}" y="${d.h / 2 + 5}" width="26" height="10" rx="5"/>`;
      });
      body = `<rect class="tbl-body" x="${-d.w / 2}" y="${-d.h / 2}" width="${d.w}" height="${d.h}" rx="${table.shape === 'sq' ? 12 : 16}"/>`;
      ring = `<rect class="tbl-ring" x="${-d.w / 2 - 4}" y="${-d.h / 2 - 4}" width="${d.w + 8}" height="${d.h + 8}" rx="16"/>`;
      top = d.h / 2 + 15;
    }
    const fs = tall ? ' style="font-size:15px"' : '';
    return `<g class="tbl" data-table="${table.id}" transform="translate(${cx} ${cy})" tabindex="0" role="button">${chairs}${ring}${body}<text class="tbl-id" y="-9"${fs}>${table.id}</text><text class="tbl-sub" y="12"></text><g class="tbl-flag" transform="translate(0 ${-(top + 16)})" aria-hidden="true"><rect x="-44" y="-11" width="88" height="22" rx="11"/><text>ASIGNADA</text></g></g>`;
  }
  function buildPlan() {
    const tall = tallPlan.matches;
    planLayout = tall ? 'tall' : 'wide';
    const decor = tall
      ? `<rect class="la-zone-salon" x="8" y="8" width="384" height="500" rx="18"/><rect class="la-zone-terraza" x="8" y="528" width="384" height="244" rx="18"/>
         <text class="la-zone-label" x="26" y="38">SALÓN</text><text class="la-zone-label" x="26" y="558">TERRAZA</text>
         <rect class="la-bar" x="30" y="436" width="340" height="52" rx="12"/><text class="la-bar-label" x="200" y="467" text-anchor="middle">BARRA · COCINA ABIERTA</text>
         ${[70, 130, 190, 250, 310].map(x => `<circle class="chair" cx="${x}" cy="424" r="7" fill="#3a332a"/>`).join('')}
         <line class="la-door" x1="8" y1="270" x2="8" y2="320"/>
         <circle class="la-plant" cx="370" cy="552" r="12"/><circle class="la-plant" cx="30" cy="752" r="10"/><circle class="la-plant" cx="372" cy="752" r="10"/>`
      : `<rect class="la-zone-salon" x="10" y="10" width="650" height="580" rx="20"/><rect class="la-zone-terraza" x="680" y="10" width="310" height="580" rx="20"/>
         <text class="la-zone-label" x="34" y="44">SALÓN</text><text class="la-zone-label" x="704" y="44">TERRAZA</text>
         <rect class="la-bar" x="480" y="345" width="150" height="215" rx="14"/><text class="la-bar-label" x="555" y="445" text-anchor="middle">BARRA</text><text class="la-bar-label" x="555" y="465" text-anchor="middle">COCINA ABIERTA</text>
         ${[375, 415, 455, 495, 535].map(y => `<circle cx="462" cy="${y}" r="8" fill="#3a332a"/>`).join('')}
         <line class="la-door" x1="230" y1="590" x2="320" y2="590"/><text class="la-bar-label" x="275" y="576" text-anchor="middle">ENTRADA</text>
         <circle class="la-plant" cx="960" cy="44" r="16"/><circle class="la-plant" cx="960" cy="560" r="18"/><circle class="la-plant" cx="706" cy="566" r="12"/><circle class="la-plant" cx="706" cy="200" r="10"/>`;
    plan.innerHTML = `<svg viewBox="${tall ? '0 0 400 780' : '0 0 1000 600'}" role="group" aria-label="Plano del salón y la terraza de LUMBRE" font-family="Manrope, Arial, sans-serif">${decor}${TABLES.map(t => tableSvg(t, tall)).join('')}</svg>`;
  }
  function tableState(b) {
    if (!b) return 'free';
    return { reservada: 'reserved', sentados: 'seated', cuenta: 'bill' }[b.status];
  }
  function renderPlan() {
    if (planLayout !== (tallPlan.matches ? 'tall' : 'wide')) buildPlan();
    plan.querySelectorAll('.tbl').forEach(node => {
      const table = TABLE[node.dataset.table];
      const b = liveBooking(table.id);
      const state = tableState(b);
      node.classList.remove('is-free', 'is-reserved', 'is-seated', 'is-bill');
      node.classList.add(`is-${state}`);
      node.classList.toggle('is-selected', s.selected === table.id);
      const active = flash && flash.table === table.id && flash.until > Date.now();
      node.classList.toggle('is-assigned', Boolean(active && flash.kind === 'assigned'));
      node.classList.toggle('is-released', Boolean(active && flash.kind === 'released'));
      node.querySelector('.tbl-flag text').textContent = active && flash.kind === 'released' ? 'LIBERADA' : 'ASIGNADA';
      const sub = !b ? `${table.seats} sillas` : b.status === 'reservada' ? (table.shape === 'sq' ? TURNS[b.turn].label : `${TURNS[b.turn].label} · ${b.people}p`) : b.status === 'sentados' ? `${b.people} pax` : 'cuenta';
      node.querySelector('.tbl-sub').textContent = sub;
      const label = !b ? 'libre' : `${{ reservada: 'reservada', sentados: 'con clientes sentados', cuenta: 'pidió la cuenta' }[b.status]}: ${b.name}, ${persons(b.people)}, turno de las ${TURNS[b.turn].label}`;
      node.setAttribute('aria-label', `Mesa ${table.id}, ${table.seats} sillas, ${ZONES[table.zone].toLowerCase()}, ${label}`);
      node.setAttribute('aria-pressed', String(s.selected === table.id));
    });
  }

  // ——— Pintar: detalle de mesa ———
  const detail = $('la-detail');
  function renderDetail() {
    const table = TABLE[s.selected];
    if (!table) { detail.innerHTML = '<p class="la-detail-empty">Elige una mesa en el plano para ver quién la tiene, desde cuándo y qué sigue.</p>'; return; }
    const b = liveBooking(table.id);
    const state = tableState(b);
    const pillText = { free: 'Libre', reserved: 'Reservada', seated: 'Sentados', bill: 'Cuenta' }[state];
    const later = tonight().filter(o => o.table === table.id && occupying(o) && o !== b);
    let info = `${table.seats} sillas · ${ZONES[table.zone]}`;
    const actions = [];
    if (!b) {
      const waiting = s.waitlist.find(w => w.date === TODAY && w.people <= table.seats && table.seats - w.people <= 4);
      info += ' · lista para recibir';
      if (waiting) actions.push(`<button type="button" class="la-btn la-btn-primary" data-act="fromwait" data-ref="${waiting.id}">Dar a ${escapeHtml(waiting.name)} (${waiting.people})</button>`);
      actions.push('<button type="button" class="la-btn la-btn-soft" data-act="walkin">Sentar sin reserva</button>');
    } else {
      const ticket = ticketOf(b);
      info = `${b.name} · ${persons(b.people)} · turno ${TURNS[b.turn].label}${b.status === 'sentados' ? ` · sentados desde las ${hhmm(b.seatedAt)}` : ''}${b.status === 'cuenta' ? ` · cuenta desde las ${hhmm(b.billAt)}` : ''}${ticket ? ` · ${ticket.label}` : ''}${b.status === 'reservada' ? ` · se guarda hasta las ${hhmm(b.holdUntil ?? TURNS[b.turn].start + GRACE)}` : ''}`;
      if (b.status === 'reservada') {
        actions.push('<button type="button" class="la-btn la-btn-primary" data-act="seat">Llegaron · sentar</button>');
        actions.push('<button type="button" class="la-btn la-btn-soft" data-act="noshow">Marcar no-show</button>');
        actions.push('<button type="button" class="la-btn la-btn-ghost" data-act="cancel">Cancelar reserva</button>');
      } else if (b.status === 'sentados') {
        actions.push('<button type="button" class="la-btn la-btn-primary" data-act="bill">Pidieron la cuenta</button>');
      } else {
        actions.push('<button type="button" class="la-btn la-btn-primary" data-act="pay">Cobrada · liberar mesa</button>');
      }
    }
    const next = later.length ? `<p>Después: ${later.map(o => `${escapeHtml(o.name)} (${o.people}) a las ${TURNS[o.turn].label}`).join(' · ')}</p>` : '';
    detail.innerHTML = `<div class="la-detail-top"><div><h4>Mesa ${table.id}</h4><p>${escapeHtml(info)}</p>${next}</div><span class="la-pill is-${state}">${pillText}</span></div><div class="la-detail-actions">${actions.join('')}</div>`;
  }
  detail.addEventListener('click', event => {
    const button = event.target.closest('[data-act]');
    if (!button) return;
    const table = TABLE[s.selected];
    const b = liveBooking(table.id);
    const act = button.dataset.act;
    if (act === 'seat' && b) seat(b);
    if (act === 'bill' && b) bill(b);
    if (act === 'pay' && b) release(b, 'pagada');
    if (act === 'noshow' && b) noShow(b, false);
    if (act === 'cancel' && b) cancelBooking(b);
    if (act === 'walkin' && !b) {
      const walk = createBooking({ name: 'Sin reserva', people: table.seats, date: TODAY, turn: currentTurn(), zone: table.zone, table: table.id, source: 'walkin' });
      seat(walk);
    }
    if (act === 'fromwait' && !b) {
      const entry = s.waitlist.find(w => w.id === button.dataset.ref);
      if (entry) {
        s.waitlist = s.waitlist.filter(w => w.id !== entry.id);
        const nb = createBooking({ ...entry, table: table.id, source: 'espera' });
        seat(nb);
        log('reserva', `${entry.name} sale de la lista de espera · mesa ${table.id}.`);
        if (s.phone.waitId === entry.id) { s.phone.waitId = null; s.phone.bookingId = nb.id; queueSay([{ who: 'in', tag: 'Lista de espera', text: `${entry.name}, tu mesa ${table.id} está lista. ¡Bienvenidos!` }]); }
      }
    }
    commit();
    detail.querySelector('[data-act]')?.focus({ preventScroll: true });
  });
  function selectTable(id) {
    s.selected = s.selected === id ? null : id;
    renderPlan();
    renderDetail();
    save();
  }
  plan.addEventListener('click', event => {
    const node = event.target.closest('.tbl');
    if (node) selectTable(node.dataset.table);
  });
  plan.addEventListener('keydown', event => {
    const node = event.target.closest('.tbl');
    if (!node || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    selectTable(node.dataset.table);
  });

  // ——— Pintar: métricas, paneles y reloj ———
  function setMetric(name, value) { const node = document.querySelector(`[data-metric="${name}"]`); if (node) node.textContent = value; }
  function renderMetrics() {
    const turn = currentTurn();
    const inTurn = tonight().filter(b => b.turn === turn && occupying(b));
    const seats = inTurn.reduce((sum, b) => sum + TABLE[b.table].seats, 0);
    const pct = Math.round((seats / TOTAL_SEATS) * 100);
    setMetric('occupancy', `${pct}%`);
    setMetric('occupancy-sub', `${seats} de ${TOTAL_SEATS} sillas · ${TURNS[turn].label}`);
    document.querySelector('[data-metric="occupancy-bar"]').style.setProperty('--v', String(pct / 100));
    const night = tonight().filter(b => !['cancelada', 'noshow'].includes(b.status));
    const covers = night.reduce((sum, b) => sum + b.people, 0);
    const served = night.filter(b => ['sentados', 'cuenta', 'terminada'].includes(b.status)).reduce((sum, b) => sum + b.people, 0);
    setMetric('covers', String(covers));
    setMetric('covers-sub', `${served} ya sentados`);
    const free = TABLES.filter(t => !liveBooking(t.id)).length;
    setMetric('free', String(free));
    setMetric('free-sub', `de ${TABLES.length} mesas`);
    const waiting = s.waitlist.filter(w => w.date === TODAY);
    setMetric('wait', String(waiting.length));
    const first = waiting[0] && eta(waiting[0].people, TODAY, waiting[0].turn);
    setMetric('wait-sub', waiting.length ? (first ? `próxima mesa ~${hhmm(first.at)}` : 'esperando cancelación') : 'sin espera');
  }
  function renderPanels() {
    const wait = $('la-wait');
    $('la-wait-count').textContent = String(s.waitlist.length);
    wait.innerHTML = s.waitlist.length
      ? s.waitlist.map((w, i) => { const e = eta(w.people, w.date, w.turn); return `<li data-id="${w.id}"><span class="la-pos">${i + 1}</span><div><b>${escapeHtml(w.name)} · ${persons(w.people)}</b><span>${dayLabel(w.date)} ${TURNS[w.turn].label} · desde las ${hhmm(w.since)}${e ? ` · espera ~${span(e.minutes)}` : ''}</span></div></li>`; }).join('')
      : '<li class="la-empty">Nadie esperando. Si un turno se llena, aquí aparece la lista con su espera estimada.</li>';
    const upcoming = s.bookings.filter(b => b.date > TODAY && occupying(b)).sort((a, b) => a.date.localeCompare(b.date) || TURNS[a.turn].start - TURNS[b.turn].start);
    $('la-upcoming').innerHTML = upcoming.length
      ? upcoming.map(b => `<li><b>${escapeHtml(b.name)} · ${b.people}</b><span>${dayLabel(b.date)} ${TURNS[b.turn].label} · ${b.table}</span></li>`).join('')
      : '<li class="la-empty">Sin reservas para los próximos días.</li>';
    const order = { 'en marcha': 0, programada: 1, servida: 2 };
    const tickets = [...s.tickets].sort((a, b) => order[a.status] - order[b.status]);
    $('la-kitchen-count').textContent = String(tickets.filter(t => t.status !== 'servida').length);
    $('la-tickets').innerHTML = tickets.length
      ? tickets.map(t => { const b = findBooking(t.booking); const cls = { 'en marcha': 'is-firing', programada: 'is-programmed', servida: 'is-served' }[t.status]; return `<li data-id="${t.id}"><b>Mesa ${t.table} · ${escapeHtml(t.label)}</b><span class="la-ticket-state ${cls}">${t.status === 'en marcha' ? `En marcha · ${hhmm(t.at)}` : t.status === 'programada' ? 'Programada' : 'Servida'}</span><span>${b ? `${escapeHtml(b.name)} · ${dayLabel(b.date)} ${TURNS[b.turn].label}` : ''}</span></li>`; }).join('')
      : '<li class="la-empty">Las reservas con menú del fuego o pedido previo aparecen aquí.</li>';
    const logList = $('la-log');
    const fresh = Math.max(0, s.log.length - renderedLog);
    logList.innerHTML = s.log.slice(0, 60).map((entry, i) => `<li data-kind="${entry.kind}"${i < fresh && fresh < 10 ? ' class="is-new"' : ''}><time>${hhmm(entry.t)}</time><i aria-hidden="true"></i><span>${escapeHtml(entry.text)}</span></li>`).join('');
    renderedLog = s.log.length;
  }
  function renderClock() {
    const clock = $('la-clock');
    const text = hhmm(s.clock);
    if (clock.textContent !== text) {
      clock.textContent = text;
      clock.classList.remove('is-tick');
      void clock.offsetWidth;
      clock.classList.add('is-tick');
    }
    const turn = currentTurn();
    $('la-turn').textContent = s.clock >= CLOSE ? 'Servicio cerrado' : `${TURNS[turn].name} · ${TURNS[turn].label}`;
    $('la-advance').disabled = s.clock >= CLOSE;
    $('la-live-date').textContent = `En vivo · ${longDate(TODAY)}`;
  }
  function renderRail() {
    document.querySelectorAll('#la-rail li').forEach(li => {
      const n = Number(li.dataset.step);
      li.classList.toggle('is-done', s.rail.done.includes(n) && s.rail.current !== n);
      li.classList.toggle('is-current', s.rail.current === n);
    });
  }

  // ——— Pintar: teléfono ———
  const phone = $('la-phone');
  const draft = { people: 2, date: TODAY, turn: 't1', zone: 'salon', pre: 'ninguno', name: 'Daniela', fromWeb: false };
  function readParams() {
    const params = new URLSearchParams(window.location.search);
    if (![...params.keys()].length) return false;
    const people = Math.round(Number(params.get('personas')));
    if (people >= 1 && people <= 6) draft.people = people;
    const date = params.get('fecha');
    if (/^\d{4}-\d{2}-\d{2}$/.test(date || '') && date >= TODAY) draft.date = date;
    const turn = Object.keys(TURNS).find(key => TURNS[key].label === params.get('turno'));
    if (turn) draft.turn = turn;
    if (Object.hasOwn(ZONES, params.get('zona'))) draft.zone = params.get('zona');
    if (params.get('menu') === 'fuego') draft.pre = 'fuego';
    draft.fromWeb = true;
    return true;
  }
  function radio(name, value, checked, inner, disabled = false) {
    return `<label class="la-opt"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span>${inner}</span></label>`;
  }
  function renderForm() {
    const days = dayChips();
    if (!days.includes(draft.date)) days.push(draft.date);
    if (!turnOpen(draft.date, draft.turn)) draft.turn = turnOpen(draft.date, 't2') ? 't2' : draft.turn;
    const order = webOrder();
    if (draft.pre === 'web' && !order) draft.pre = 'ninguno';
    phone.innerHTML = `
      <div class="la-app-head"><div class="la-app-brand"><b>lumbre<span>.</span></b><small>Reservas</small></div><p>Cocina latina al fuego · Chapinero Alto</p>${draft.fromWeb ? '<p class="la-app-from">Traemos tu solicitud desde la web de LUMBRE. Revisa y pide la mesa.</p>' : ''}</div>
      <form class="la-app-body" id="la-app-form" novalidate>
        <div class="la-q"><label for="la-people-out">¿Cuántos vienen?</label><div class="la-people"><button type="button" data-people="-1" aria-label="Una persona menos">−</button><output id="la-people-out" aria-live="polite">${draft.people}<small>${draft.people === 1 ? 'PERSONA' : 'PERSONAS'}</small></output><button type="button" data-people="1" aria-label="Una persona más">+</button></div></div>
        <fieldset class="la-q"><legend>Día</legend><div class="la-opts">${days.map(iso => radio('la-date', iso, draft.date === iso, `${dayLabel(iso)}${iso === TODAY || iso === TOMORROW ? `<small>${shortDay(iso)}</small>` : ''}`)).join('')}</div></fieldset>
        <fieldset class="la-q"><legend>Turno</legend><div class="la-opts">${Object.entries(TURNS).map(([key, turn]) => radio('la-turn', key, draft.turn === key, `${turn.label}<small>${turnOpen(draft.date, key) ? turn.name.toLowerCase() : 'cerrado'}</small>`, !turnOpen(draft.date, key))).join('')}</div></fieldset>
        <fieldset class="la-q"><legend>Prefiero</legend><div class="la-opts">${Object.entries(ZONES).map(([key, label]) => radio('la-zone', key, draft.zone === key, label)).join('')}</div></fieldset>
        <fieldset class="la-q"><legend>Para cocina</legend><div class="la-opts">${radio('la-pre', 'ninguno', draft.pre === 'ninguno', 'Nada aún')}${radio('la-pre', 'fuego', draft.pre === 'fuego', 'Menú del fuego')}${order ? radio('la-pre', 'web', draft.pre === 'web', `Mi pedido web<small>${order.count} ${order.count === 1 ? 'plato' : 'platos'}</small>`) : ''}</div></fieldset>
        <div class="la-q"><label for="la-name">A nombre de</label><input class="la-name" id="la-name" name="name" autocomplete="off" maxlength="28" value="${escapeHtml(draft.name)}"></div>
        <button type="submit" class="la-app-submit" id="la-app-submit">Pedir mesa <span aria-hidden="true">→</span></button>
        <p class="la-app-note">Demo: no se hace ninguna reserva real ni se envían mensajes.</p>
      </form>`;
  }
  function renderChat() {
    const fresh = s.phone.chat.length - renderedChat;
    const messages = s.phone.chat.map((m, i) => {
      const isNew = fresh > 0 && i >= s.phone.chat.length - fresh;
      const actions = m.actions ? `<div class="la-msg-actions">${m.actions.map((a, j) => `<button type="button" data-msg="${i}" data-action="${j}"${m.used ? ' disabled' : ''}${m.used && m.chosen === j ? ' class="is-chosen"' : ''}>${escapeHtml(a.label)}${m.used && m.chosen === j ? ' ✓' : ''}</button>`).join('')}</div>` : '';
      return `<div class="la-msg ${m.who}${isNew ? ' is-new' : ''}">${m.tag ? `<span class="la-msg-tag">${escapeHtml(m.tag)}</span>` : ''}${escapeHtml(m.text)}${actions}<time>${hhmm(m.t)}</time></div>`;
    }).join('');
    phone.innerHTML = `
      <div class="la-chat-head"><span class="la-avatar" aria-hidden="true">l.</span><div><b>LUMBRE · Reservas</b><small>Cuenta de empresa · responde al instante</small></div></div>
      <div class="la-chat" id="la-chat" role="log" aria-live="polite" aria-label="Conversación con LUMBRE"><span class="la-day">${longDate(TODAY)}</span>${messages}${typing ? '<div class="la-typing" aria-label="LUMBRE está escribiendo"><i></i><i></i><i></i></div>' : ''}</div>
      <div class="la-chat-foot"><button type="button" data-new>Hacer otra reserva</button></div>`;
    renderedChat = s.phone.chat.length;
    const chat = $('la-chat');
    chat.scrollTop = chat.scrollHeight;
  }
  function renderChatTyping() { if (s.phone.screen === 'chat') renderChat(); }
  function renderPhone() {
    if (s.phone.screen === 'chat') renderChat();
    else { renderForm(); setPeople(draft.people); }
  }
  function syncTurnOptions() {
    phone.querySelectorAll('input[name="la-turn"]').forEach(input => {
      const open = turnOpen(draft.date, input.value);
      input.disabled = !open;
      input.nextElementSibling.querySelector('small').textContent = open ? TURNS[input.value].name.toLowerCase() : 'cerrado';
    });
    if (!turnOpen(draft.date, draft.turn) && turnOpen(draft.date, 't2')) {
      draft.turn = 't2';
      phone.querySelector('input[name="la-turn"][value="t2"]').checked = true;
    }
  }
  function setPeople(n) {
    draft.people = Math.min(6, Math.max(1, n));
    const out = $('la-people-out');
    if (out) out.innerHTML = `${draft.people}<small>${draft.people === 1 ? 'PERSONA' : 'PERSONAS'}</small>`;
    phone.querySelector('[data-people="-1"]')?.toggleAttribute('disabled', draft.people <= 1);
    phone.querySelector('[data-people="1"]')?.toggleAttribute('disabled', draft.people >= 6);
  }
  function submitForm() {
    const name = (draft.name || '').trim() || 'Invitado';
    const order = webOrder();
    const preorder = draft.pre === 'fuego' ? `Menú del fuego ×${draft.people}` : draft.pre === 'web' && order ? `Pedido web: ${order.text}` : null;
    draft.fromWeb = false;
    if (!turnOpen(draft.date, draft.turn)) { narrate('Ese turno ya cerró. Elige el siguiente turno o otro día.'); return Promise.resolve(); }
    return request({ name, people: draft.people, date: draft.date, turn: draft.turn, zone: draft.zone, preorder, preKind: preorder ? draft.pre : null });
  }
  phone.addEventListener('click', event => {
    const peopleButton = event.target.closest('[data-people]');
    if (peopleButton) { setPeople(draft.people + Number(peopleButton.dataset.people)); return; }
    const actionButton = event.target.closest('[data-action]');
    if (actionButton && !actionButton.disabled) { chatAction(Number(actionButton.dataset.msg), Number(actionButton.dataset.action)); return; }
    if (event.target.closest('[data-new]')) {
      s.phone = { screen: 'form', bookingId: null, waitId: null, chat: [], pending: null };
      renderedChat = 0;
      Object.assign(draft, { people: 2, zone: 'salon', pre: 'ninguno', fromWeb: false, name: ['Martín', 'Carolina', 'Jorge', 'Mariana', 'Felipe'][Math.floor(Math.random() * 5)] });
      save();
      renderPhone();
      phone.querySelector('[data-people="1"]')?.focus({ preventScroll: true });
    }
  });
  phone.addEventListener('change', event => {
    const input = event.target;
    if (input.name === 'la-date') { draft.date = input.value; syncTurnOptions(); }
    if (input.name === 'la-turn') draft.turn = input.value;
    if (input.name === 'la-zone') draft.zone = input.value;
    if (input.name === 'la-pre') draft.pre = input.value;
  });
  phone.addEventListener('input', event => { if (event.target.name === 'name') draft.name = event.target.value; });
  phone.addEventListener('submit', event => {
    event.preventDefault();
    const button = $('la-app-submit');
    button?.classList.add('is-pressed');
    submitForm();
  });

  // ——— Vistas (móvil) ———
  const stage = $('la-stage');
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  function showView(view) {
    stage.dataset.activeView = view;
    viewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  }
  viewButtons.forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));

  // ——— Pintado general ———
  function renderAll() {
    renderClock();
    renderPlan();
    renderDetail();
    renderMetrics();
    renderPanels();
    renderRail();
  }
  function commit() {
    save();
    renderAll();
  }

  // ——— Controles ———
  $('la-advance').addEventListener('click', () => {
    const before = s.log.length;
    const said = NARRATION.innerHTML;
    advance(15);
    if (NARRATION.innerHTML !== said) return; // un paso del flujo ya lo explicó
    if (s.log.length === before) narrate(`Son las <strong>${hhmm(s.clock)}</strong>. Sin novedades en el salón: todo sigue según lo previsto.`);
    else narrate(`Son las <strong>${hhmm(s.clock)}</strong>. ${escapeHtml(s.log[0].text)}`);
  });
  function resetAll(message = true) {
    stopDemo();
    try { localStorage.removeItem(KEY); } catch { /* nada que borrar */ }
    s = seed();
    flash = null;
    renderedChat = 0;
    renderedLog = s.log.length;
    Object.assign(draft, { people: 2, date: TODAY, turn: 't1', zone: 'salon', pre: 'ninguno', name: 'Daniela', fromWeb: false });
    sayChain = Promise.resolve();
    typing = false;
    renderPhone();
    commit();
    if (message) narrate('Noche reiniciada: 18:55, primer turno a punto de empezar. Pide una mesa o mira el flujo completo.');
  }
  $('la-reset').addEventListener('click', () => resetAll(true));

  // ——— Recorrido automático ———
  let demo = null;
  const STOP = Symbol('stop');
  const demoButtons = [...document.querySelectorAll('[data-autodemo]')];
  function setDemoUI(running) {
    document.body.classList.toggle('is-demo-running', running);
    demoButtons.forEach(button => {
      button.querySelector('[data-autodemo-label]').textContent = running ? 'Detener el recorrido' : 'Ver el flujo completo';
      button.setAttribute('aria-pressed', String(running));
    });
  }
  function stopDemo() {
    if (!demo) return;
    demo.stop = true;
    demo = null;
    setDemoUI(false);
  }
  async function runDemo() {
    const token = { stop: false };
    resetAll(false);
    demo = token;
    setDemoUI(true);
    const wait = ms => new Promise((resolve, reject) => window.setTimeout(() => (token.stop ? reject(STOP) : resolve()), calm() ? Math.min(ms, 220) : ms));
    const guard = async promise => { await promise; if (token.stop) throw STOP; };
    const pick = async (name, value) => {
      const input = phone.querySelector(`input[name="${name}"][value="${value}"]`);
      if (!input || input.disabled) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      const label = input.closest('.la-opt');
      label.classList.remove('is-pulse');
      void label.offsetWidth;
      label.classList.add('is-pulse');
      await wait(480);
    };
    const fill = async ({ people, date, turn, zone, pre, name }) => {
      while (draft.people !== people) { setPeople(draft.people + (people > draft.people ? 1 : -1)); await wait(260); }
      await pick('la-date', date);
      await pick('la-turn', turn);
      await pick('la-zone', zone);
      await pick('la-pre', pre);
      const field = $('la-name');
      field.value = '';
      for (const char of name) { field.value += char; await wait(calm() ? 0 : 45); }
      draft.name = name;
      await wait(400);
      $('la-app-submit').classList.add('is-pressed');
      await wait(250);
    };
    const tickTo = async (target, pause) => {
      while (s.clock < target) { advance(5); await wait(pause); }
    };
    try {
      (narrow.matches ? $('la-narration') : $('la-rail')).scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
      showView('guest');
      narrate('<strong>1 · Pide mesa.</strong> Daniela abre la reserva desde su teléfono: 4 personas, hoy, 19:00, terraza y menú del fuego.');
      await wait(1100);
      await fill({ people: 4, date: TODAY, turn: 't1', zone: 'terraza', pre: 'fuego', name: 'Daniela' });
      await guard(submitForm());
      if (narrow.matches) { showView('floor'); await wait(2600); showView('guest'); }
      await wait(1400);
      const confirmIndex = s.phone.chat.findIndex(m => m.actions && m.actions[0].act === 'confirm' && !m.used);
      if (confirmIndex >= 0) await guard(chatAction(confirmIndex, 0));
      await wait(1800);

      narrate('<strong>4 · Lista de espera.</strong> Ahora la familia Ortiz pide mesa para 6 a las 19:00, cuando las dos mesas de seis ya están tomadas.');
      phone.querySelector('[data-new]')?.click();
      await wait(900);
      await fill({ people: 6, date: TODAY, turn: 't1', zone: 'cualquiera', pre: 'ninguno', name: 'Familia Ortiz' });
      await guard(submitForm());
      await wait(1900);
      const joinIndex = s.phone.chat.findIndex(m => m.actions && m.actions[0].act === 'join' && !m.used);
      if (joinIndex >= 0) await guard(chatAction(joinIndex, 0));
      await wait(2000);

      showView('floor');
      stage.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
      narrate('<strong>5 · Llegan los grupos.</strong> Adelantamos el reloj: cada llegada cambia la mesa a «Sentados» y la comanda sale sola a cocina.');
      await wait(1200);
      await tickTo(1150, 1300);
      await wait(2200);
      await tickTo(1155, 1400);
      await wait(3200);
      if (narrow.matches) { showView('guest'); await wait(2400); showView('floor'); }

      narrate('Adelantamos el reloj hasta el final del primer turno: las mesas piden la cuenta, se cobran y se montan para las 21:15.');
      await wait(1400);
      await tickTo(1250, 380);
      await wait(2200);

      step(8, '<strong>8 · Métricas del turno.</strong> Ocupación, cubiertos, mesas libres y lista de espera se actualizan solos. Fin del recorrido: ahora pruébalo tú.');
      renderRail();
      document.querySelectorAll('.la-metric').forEach(card => { card.classList.add('is-flash'); window.setTimeout(() => card.classList.remove('is-flash'), 1800); });
      $('la-metrics').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'center' });
      save();
    } catch (error) {
      if (error !== STOP) throw error;
    } finally {
      if (demo === token) { demo = null; setDemoUI(false); }
    }
  }
  demoButtons.forEach(button => button.addEventListener('click', () => {
    if (demo) { stopDemo(); narrate('Recorrido detenido. Puedes seguir desde aquí o reiniciar la noche.'); return; }
    runDemo();
  }));

  // ——— Inicio ———
  const fromWeb = readParams();
  if (fromWeb) {
    s.phone.screen = 'form';
    narrate('Traemos tu solicitud desde la web de LUMBRE. Revisa los datos en el teléfono y pulsa «Pedir mesa».');
  }
  buildPlan();
  renderPhone();
  setPeople(draft.people);
  renderAll();
  tallPlan.addEventListener('change', renderPlan);
  if (fromWeb) window.requestAnimationFrame(() => (narrow.matches ? $('la-narration') : $('la-rail')).scrollIntoView({ block: 'start' }));
  window.addEventListener('storage', event => {
    if (event.key !== KEY || demo) return;
    s = load();
    renderPhone();
    renderAll();
  });
})();
