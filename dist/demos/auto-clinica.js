'use strict';
// ALMA · agenda automática. Simulación local: una semana de citas con recordatorios,
// lista de espera, asistencia y seguimiento. No se envían mensajes ni se guardan datos reales.
(() => {
  const config = window.SITE_CONFIG || {};
  const studio = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = studio; });
  document.title = document.title.replace('Nexo Studio', studio);

  const $ = id => document.getElementById(id);
  const STORAGE = 'nexo-auto-clinica-v1';
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const calm = () => reducedQuery.matches;

  // ---------- Datos fijos ----------
  const DAYS = 6; // lunes a sábado
  const HOURS = [8, 9, 10, 11, 12, 14, 15, 16];
  const DAY = 1440;
  const START_CLOCK = 8 * 60; // lunes 08:00
  const END_CLOCK = 5 * DAY + 18 * 60; // sábado 18:00
  const LEAD = 60; // se puede reservar con al menos 1 h de margen

  const SPECIALISTS = {
    mariana: { name: 'Mariana Ortiz', short: 'Mariana', service: 'Fisioterapia', tint: '#cfe0d3' },
    daniel: { name: 'Daniel Vélez', short: 'Daniel', service: 'Fisioterapia', tint: '#d8e4dc' },
    julian: { name: 'Julián Restrepo', short: 'Julián', service: 'Psicología', tint: '#e6dccd' },
    laura: { name: 'Laura Cifuentes', short: 'Laura', service: 'Nutrición', tint: '#e3e6cf' },
    andres: { name: 'Andrés Mejía', short: 'Andrés', service: 'Masaje terapéutico', tint: '#ead9cb' }
  };
  const SPEC_IDS = Object.keys(SPECIALISTS);
  const SERVICES = { 'Fisioterapia': 50, 'Psicología': 50, 'Nutrición': 40, 'Masaje terapéutico': 60 };
  const range = (a, b) => HOURS.filter(h => h >= a && h <= b);
  function works(spec, d, h) {
    switch (spec) {
      case 'mariana': return d <= 4 && h <= 12;
      case 'daniel': return (d <= 3 && h >= 12) || (d === 5 && h <= 12);
      case 'julian': return [0, 1, 3, 4].includes(d) && range(9, 16).includes(h);
      case 'laura': return (d >= 1 && d <= 3 && h <= 15) || (d === 5 && h <= 11);
      case 'andres': return (d >= 2 && d <= 4 && h >= 10) || (d === 5 && h <= 12);
      default: return false;
    }
  }
  const NAMES = ['Andrea L.', 'Tomás R.', 'Lucía M.', 'Felipe G.', 'Isabel C.', 'Mateo P.', 'Carolina V.', 'Santiago H.', 'Daniela O.', 'Juan Pablo S.', 'Manuela T.', 'Esteban N.', 'Natalia B.', 'Simón A.', 'Gabriela F.', 'Nicolás E.', 'María José R.', 'Alejandro D.', 'Juliana K.', 'Camilo Z.', 'Sara Q.', 'Emilio J.', 'Verónica U.', 'Pablo I.', 'Mónica Y.', 'Ricardo W.', 'Diana X.', 'Hernán L.', 'Catalina P.', 'Óscar M.', 'Elena S.', 'Andrés F.', 'Paola N.', 'Luis Miguel C.', 'Adriana G.', 'Jorge V.'];
  const WAITLIST_SEED = [
    { id: 'w1', name: 'Valentina P.', service: 'Fisioterapia', pref: 'mananas' },
    { id: 'w2', name: 'Sergio L.', service: 'Psicología', pref: 'cualquiera' },
    { id: 'w3', name: 'Ana M.', service: 'Fisioterapia', pref: 'tardes' },
    { id: 'w4', name: 'Paula G.', service: 'Nutrición', pref: 'cualquiera' },
    { id: 'w5', name: 'Martín C.', service: 'Masaje terapéutico', pref: 'cualquiera' }
  ];
  const PREF_LABEL = { mananas: 'Mañanas', tardes: 'Tardes', cualquiera: 'Cualquier horario' };

  // Fechas reales de la próxima semana, solo para las etiquetas.
  const monday = (() => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const add = ((8 - date.getDay()) % 7) || 7;
    date.setDate(date.getDate() + add);
    return date;
  })();
  const dayDate = d => { const date = new Date(monday); date.setDate(monday.getDate() + d); return date; };
  const DAY_SHORT = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const DAY_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const pad = n => String(n).padStart(2, '0');
  const hm = minutes => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  const dayNum = d => dayDate(d).getDate();
  const monthShort = d => new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(dayDate(d)).replace('.', '');
  const stamp = t => `${DAY_SHORT[Math.min(5, Math.floor(t / DAY))]} ${hm(t % DAY)}`;
  const slotLabel = (d, h) => `${DAY_SHORT[d]} ${dayNum(d)} · ${pad(h)}:00`;
  const slotLong = (d, h) => `el ${DAY_LONG[d]} ${dayNum(d)} de ${new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(dayDate(d))} a las ${pad(h)}:00`;
  const startOf = appt => appt.d * DAY + appt.h * 60;

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Estado ----------
  let state;
  function seed() {
    const random = rng(20261109);
    const appts = [];
    let seq = 100;
    let nameIndex = 0;
    const forcedFree = new Set(['mariana|2|10', 'mariana|4|10', 'mariana|4|9']);
    const forced = {
      'mariana|2|12': { patient: 'Tomás R.', response: 'cancel', noShow: false },
      'mariana|2|11': { patient: 'Hernán L.', response: 'silent', noShow: true },
      'mariana|2|9': { patient: 'Lucía M.', response: 'confirm', noShow: false }
    };
    SPEC_IDS.forEach(spec => {
      for (let d = 0; d < DAYS; d += 1) {
        HOURS.forEach(h => {
          if (!works(spec, d, h)) return;
          const key = `${spec}|${d}|${h}`;
          const roll = random();
          const r2 = random();
          const r3 = random();
          const r4 = random();
          if (forcedFree.has(key)) return;
          let data = forced[key];
          if (!data) {
            if (roll > 0.7) return;
            let response = 'confirm';
            if (r2 < 0.035) response = 'cancel';
            else if (r2 < 0.12) response = 'silent';
            data = { patient: NAMES[nameIndex++ % NAMES.length], response, noShow: response === 'silent' && r3 < 0.5 };
          }
          const appt = { id: `AL-${++seq}`, spec, d, h, patient: data.patient, type: r4 < 0.25 ? 'Primera visita' : 'Control', status: 'booked', source: 'seed', response: data.response, noShow: data.noShow, reminded: false, followed: false, user: false };
          if (startOf(appt) - DAY < START_CLOCK) {
            if (data.response === 'cancel') return;
            appt.reminded = true;
            if (data.response === 'confirm') appt.status = 'confirmed';
          }
          appts.push(appt);
        });
      }
    });
    return {
      v: 1,
      clock: START_CLOCK,
      seq,
      appts,
      waitlist: WAITLIST_SEED.map(item => ({ ...item, status: 'waiting', apptId: null })),
      log: [{ id: 1, t: START_CLOCK, kind: 'info', text: `La semana empieza con ${appts.length} citas agendadas y los recordatorios programados.` }],
      logSeq: 1,
      chat: [],
      chatSeq: 0,
      unread: 0,
      stats: { reminders: 0, confirmed: 0, avoided: 0, recovered: 0, noshows: 0, followups: 0 },
      userAppt: null,
      draft: { service: 'Fisioterapia', spec: 'mariana', type: 'Primera visita', d: 2, h: null, name: 'Camila R.' },
      phoneTab: 'book',
      view: 'patient',
      calSpec: 'mariana',
      selected: null
    };
  }

  const isNum = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  function valid(data) {
    if (!data || data.v !== 1 || !isNum(data.clock, START_CLOCK, END_CLOCK)) return false;
    if (!Array.isArray(data.appts) || !Array.isArray(data.waitlist) || !Array.isArray(data.log) || !Array.isArray(data.chat)) return false;
    if (!data.stats || typeof data.stats !== 'object' || !data.draft || typeof data.draft !== 'object') return false;
    const statuses = ['booked', 'confirmed', 'cancelled', 'attended', 'noshow'];
    const apptsOk = data.appts.every(a => a && typeof a.id === 'string' && SPECIALISTS[a.spec] && isNum(a.d, 0, 5) && HOURS.includes(a.h) && typeof a.patient === 'string' && a.patient.length <= 60 && statuses.includes(a.status));
    const waitOk = data.waitlist.every(w => w && typeof w.name === 'string' && SERVICES[w.service] && PREF_LABEL[w.pref]);
    const chatOk = data.chat.every(m => m && typeof m.text === 'string' && ['alma', 'patient'].includes(m.from));
    return apptsOk && waitOk && chatOk && data.appts.length < 400 && data.log.length < 200 && data.chat.length < 80;
  }
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (valid(data)) {
        const d = data.draft;
        if (!SERVICES[d.service] || !SPECIALISTS[d.spec] || SPECIALISTS[d.spec].service !== d.service || !['Primera visita', 'Control'].includes(d.type) || !(d.d === null || isNum(d.d, 0, 5)) || !(d.h === null || HOURS.includes(d.h)) || typeof d.name !== 'string') data.draft = seed().draft;
        if (!SPECIALISTS[data.calSpec]) data.calSpec = 'mariana';
        return data;
      }
    } catch { /* datos dañados: se vuelve a empezar */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(STORAGE, JSON.stringify(state)); } catch { /* sin almacenamiento: sigue en memoria */ }
  }

  // ---------- Motor ----------
  const active = a => a.status !== 'cancelled';
  const apptAt = (spec, d, h) => state.appts.find(a => a.spec === spec && a.d === d && a.h === h && active(a));
  const freeSlot = (spec, d, h, at = state.clock) => works(spec, d, h) && !apptAt(spec, d, h) && d * DAY + h * 60 >= at + LEAD;
  const userAppt = () => state.appts.find(a => a.id === state.userAppt) || null;
  const userBusy = () => { const a = userAppt(); return Boolean(a && ['booked', 'confirmed'].includes(a.status)); };
  const totalCapacity = (() => { let n = 0; SPEC_IDS.forEach(s => { for (let d = 0; d < DAYS; d += 1) HOURS.forEach(h => { if (works(s, d, h)) n += 1; }); }); return n; })();
  const capacityOf = spec => { let n = 0; for (let d = 0; d < DAYS; d += 1) HOURS.forEach(h => { if (works(spec, d, h)) n += 1; }); return n; };

  let fresh = { log: new Set(), chat: new Set(), cells: new Set() };
  function log(kind, text, t = state.clock) {
    state.logSeq += 1;
    state.log.unshift({ id: state.logSeq, t, kind, text });
    state.log = state.log.slice(0, 60);
    fresh.log.add(state.logSeq);
  }
  function message(from, text, actions = [], extra = {}) {
    state.chatSeq += 1;
    state.chat.push({ id: state.chatSeq, from, t: state.clock, text, actions, used: false, ...extra });
    state.chat = state.chat.slice(-40);
    if (from === 'alma' && state.phoneTab !== 'chat') state.unread += 1;
    fresh.chat.add(state.chatSeq);
  }

  function dueEvents(limit) {
    const events = [];
    state.appts.forEach(a => {
      const start = startOf(a);
      if (!a.reminded && a.status === 'booked' && start - DAY <= limit) events.push({ at: start - DAY, type: 'reminder', a });
      if (['booked', 'confirmed'].includes(a.status) && start <= limit) events.push({ at: start, type: 'visit', a });
      if (['attended', 'noshow'].includes(a.status) && !a.followed && start + 180 <= limit) events.push({ at: start + 180, type: 'follow', a });
    });
    return events.sort((x, y) => x.at - y.at || (x.a.user ? -1 : 1));
  }
  function nextUserEvent() {
    const a = userAppt();
    if (!a) return null;
    const start = startOf(a);
    if (!a.reminded && a.status === 'booked') return { at: Math.max(state.clock, start - DAY), label: `recordatorio de ${firstName(a.patient)}` };
    if (['booked', 'confirmed'].includes(a.status)) return { at: start, label: `la cita de ${firstName(a.patient)}` };
    if (['attended', 'noshow'].includes(a.status) && !a.followed) return { at: start + 180, label: 'el seguimiento' };
    return null;
  }
  const firstName = name => name.split(' ')[0];

  function advance(target) {
    target = Math.min(END_CLOCK, Math.max(state.clock, target));
    const batch = { day: null, at: 0, reminders: {}, visits: 0, follows: 0 };
    let guard = 0;
    let events = dueEvents(target);
    while (events.length && guard < 800) {
      guard += 1;
      const event = events[0];
      const day = Math.floor(event.at / DAY);
      if (batch.day !== null && day !== batch.day) flushBatch(batch);
      batch.day = day;
      state.clock = Math.max(state.clock, event.at);
      batch.at = state.clock;
      if (event.type === 'reminder') handleReminder(event.a, batch);
      else if (event.type === 'visit') handleVisit(event.a, batch);
      else handleFollow(event.a, batch);
      events = dueEvents(target);
    }
    flushBatch(batch);
    state.clock = target;
  }
  // Los envíos masivos se resumen por día; lo importante (cancelaciones, inasistencias, tu paciente) va uno a uno.
  function flushBatch(batch) {
    const t = batch.at;
    Object.entries(batch.reminders).forEach(([d, n]) => log('reminder', `Recordatorio de 24 h enviado a ${n} ${n === 1 ? 'paciente' : 'pacientes'} con cita el ${DAY_LONG[d]}.`, t));
    if (batch.visits) log('visit', `${batch.visits} ${batch.visits === 1 ? 'paciente llegó' : 'pacientes llegaron'} a su cita. Recepción solo tuvo que recibirlos.`, t);
    if (batch.follows) log('follow', `Mensaje de seguimiento enviado a ${batch.follows} ${batch.follows === 1 ? 'paciente atendido' : 'pacientes atendidos'}, con su próxima cita sugerida.`, t);
    batch.reminders = {};
    batch.visits = 0;
    batch.follows = 0;
  }
  function handleReminder(a, batch) {
    a.reminded = true;
    state.stats.reminders += 1;
    if (a.user) {
      log('reminder', `Recordatorio enviado a ${a.patient}: ${slotLabel(a.d, a.h)} con ${SPECIALISTS[a.spec].short}. Esperando respuesta.`, state.clock);
      message('alma', `Hola ${firstName(a.patient)}, te recordamos tu cita de ${SPECIALISTS[a.spec].service.toLowerCase()} ${slotLong(a.d, a.h)} con ${SPECIALISTS[a.spec].name}. ¿Nos confirmas?`, [{ act: 'confirm', label: 'Confirmo asistencia' }, { act: 'cancel', label: 'Necesito cancelar' }], { kind: 'reminder', appt: a.id });
      return;
    }
    batch.reminders[a.d] = (batch.reminders[a.d] || 0) + 1;
    if (a.response === 'confirm') { a.status = 'confirmed'; state.stats.confirmed += 1; }
    else if (a.response === 'cancel') {
      log('cancel', `${a.patient} respondió al recordatorio: no puede venir ${DAY_SHORT[a.d]} ${pad(a.h)}:00. Aviso con 24 h de margen.`);
      cancelAppt(a, 'patient');
    }
  }
  function handleVisit(a, batch) {
    const noShow = a.user ? false : a.status === 'booked' && a.noShow;
    if (noShow) {
      a.status = 'noshow';
      state.stats.noshows += 1;
      log('noshow', `${a.patient} no llegó a su cita de ${pad(a.h)}:00 con ${SPECIALISTS[a.spec].short}. No había confirmado el recordatorio.`);
    } else {
      a.status = 'attended';
      if (a.user) {
        log('visit', `${a.patient} llegó a recepción para su cita con ${SPECIALISTS[a.spec].short}. Asistencia registrada.`);
      } else batch.visits += 1;
    }
    fresh.cells.add(a.id);
  }
  function suggestionFor(a) {
    for (let step = 2; step < 12; step += 1) {
      const d = a.d + step;
      if (d < DAYS && freeSlot(a.spec, d, a.h)) return { d, h: a.h };
    }
    for (let d = a.d + 1; d < DAYS; d += 1) {
      const h = HOURS.find(hour => freeSlot(a.spec, d, hour));
      if (h !== undefined) return { d, h };
    }
    return null;
  }
  function handleFollow(a, batch) {
    a.followed = true;
    if (!a.user) {
      if (a.status === 'attended') { batch.follows += 1; state.stats.followups += 1; }
      else log('follow', `Mensaje a ${a.patient}: “Te extrañamos hoy, ¿buscamos otro horario?”`);
      return;
    }
    state.stats.followups += 1;
    const spec = SPECIALISTS[a.spec];
    const next = suggestionFor(a);
    if (a.status === 'attended') {
      const text = `Hola ${firstName(a.patient)}, ¿cómo te sentiste después de tu sesión con ${spec.short}? Para seguir con tu plan te sugerimos un control ${next ? slotLong(next.d, next.h) : 'la próxima semana'}.`;
      message('alma', text, next ? [{ act: 'book-next', label: `Reservar ${DAY_SHORT[next.d]} ${pad(next.h)}:00`, d: next.d, h: next.h }] : [], { kind: 'follow', appt: a.id });
      log('follow', `Seguimiento enviado a ${a.patient} con una próxima cita sugerida${next ? `: ${slotLabel(next.d, next.h)}` : ''}.`);
    } else {
      message('alma', `Hola ${firstName(a.patient)}, hoy te extrañamos en ALMA. ¿Buscamos otro horario con ${spec.short}?`, next ? [{ act: 'book-next', label: `Reservar ${DAY_SHORT[next.d]} ${pad(next.h)}:00`, d: next.d, h: next.h }] : [], { kind: 'follow', appt: a.id });
      log('follow', `Mensaje para reprogramar enviado a ${a.patient.replace(/\.$/, '')}.`);
    }
  }

  function cancelAppt(a, by) {
    a.status = 'cancelled';
    a.cancelledBy = by;
    a.cancelledAt = state.clock;
    fresh.cells.add(`${a.spec}|${a.d}|${a.h}`);
    const ahead = startOf(a) - state.clock;
    if (by === 'patient' && ahead >= 120) state.stats.avoided += 1;
    if (ahead < LEAD + 60) {
      log('info', `El espacio de ${slotLabel(a.d, a.h)} queda libre, pero es demasiado pronto para ofrecerlo.`);
      return null;
    }
    return offerToWaitlist(a.spec, a.d, a.h);
  }
  function offerToWaitlist(spec, d, h) {
    const service = SPECIALISTS[spec].service;
    const match = state.waitlist.find(w => w.status === 'waiting' && w.service === service && (w.pref === 'cualquiera' || (w.pref === 'mananas' ? h < 13 : h >= 13)));
    log('free', `Espacio liberado: ${slotLabel(d, h)} con ${SPECIALISTS[spec].short}.`);
    if (!match) {
      log('info', `Nadie compatible en la lista de espera. El horario queda visible para reservas en línea.`);
      return null;
    }
    log('offer', `Ofrecido automáticamente a ${match.name} (lista de espera) por WhatsApp.`);
    state.seq += 1;
    const appt = { id: `AL-${state.seq}`, spec, d, h, patient: match.name, type: 'Control', status: 'confirmed', source: 'waitlist', response: 'confirm', noShow: false, reminded: d * DAY + h * 60 - DAY <= state.clock, followed: false, user: false };
    state.appts.push(appt);
    match.status = 'booked';
    match.apptId = appt.id;
    state.stats.recovered += 1;
    fresh.cells.add(appt.id);
    log('recovered', `${match.name} aceptó en 6 minutos. El espacio se recuperó sin una sola llamada.`, state.clock + 6);
    return appt;
  }

  function book({ spec, d, h, type, name, source = 'online' }) {
    if (!freeSlot(spec, d, h)) return null;
    state.seq += 1;
    const appt = { id: `AL-${state.seq}`, spec, d, h, patient: name, type, status: 'booked', source, response: null, noShow: false, reminded: false, followed: false, user: true, bookedAt: state.clock };
    const start = startOf(appt);
    if (start - DAY <= state.clock) appt.reminded = true;
    state.appts.push(appt);
    state.userAppt = appt.id;
    state.calSpec = spec;
    state.selected = appt.id;
    fresh.cells.add(appt.id);
    const sp = SPECIALISTS[spec];
    log('book', `Nueva reserva en línea: ${name}, ${sp.service.toLowerCase()} (${type.toLowerCase()}) ${slotLabel(d, h)} con ${sp.short}.`);
    log('confirm', `Confirmación enviada por WhatsApp a ${name}${appt.reminded ? ' (faltan menos de 24 h, no hace falta recordatorio)' : `; recordatorio programado para ${stamp(start - DAY)}`}.`);
    message('patient', `Quiero reservar ${sp.service.toLowerCase()} con ${sp.short}, ${DAY_SHORT[d]} ${pad(h)}:00.`);
    message('alma', `¡Listo, ${firstName(name)}! Tu cita de ${sp.service.toLowerCase()} (${type.toLowerCase()}) quedó ${slotLong(d, h)} con ${sp.name}. Duración: ${SERVICES[sp.service]} min. Carrera 4 # 69-21. Te escribiremos 24 h antes para confirmar.`, [], { kind: 'confirm', appt: appt.id });
    return appt;
  }

  // ---------- Vista: celular ----------
  const bookingRoot = $('aa-booking');
  const chatRoot = $('aa-chat');
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('data-') || key.startsWith('aria-') || ['type', 'role', 'id', 'for', 'name', 'value', 'maxlength', 'autocomplete', 'tabindex', 'title'].includes(key)) node.setAttribute(key, value === true ? '' : value);
      else node[key] = value;
    });
    children.flat().forEach(child => { if (child !== null && child !== undefined && child !== false) node.append(child.nodeType ? child : document.createTextNode(String(child))); });
    return node;
  }
  function chipGroup(label, field, options, current) {
    return el('fieldset', { class: 'aa-field' },
      el('legend', { text: label }),
      el('div', { class: 'aa-chips' }, options.map(option => el('button', {
        type: 'button', class: 'aa-chip', 'data-field': field, 'data-value': option.value,
        'aria-pressed': String(String(option.value) === String(current)), disabled: option.disabled || undefined,
        'aria-label': option.aria
      }, option.label, option.sub ? el('small', { text: option.sub }) : null))));
  }
  function renderBooking() {
    const draft = state.draft;
    bookingRoot.replaceChildren();
    if (userBusy()) {
      const a = userAppt();
      const sp = SPECIALISTS[a.spec];
      bookingRoot.append(el('div', { class: 'aa-booked-card' },
        el('span', { class: 'aa-booked-ico', 'aria-hidden': 'true', text: '✓' }),
        el('p', { class: 'aa-booked-title', text: 'Ya tienes una cita' }),
        el('p', { text: `${sp.service} con ${sp.name}` }),
        el('p', { class: 'aa-booked-when', text: `${DAY_LONG[a.d]} ${dayNum(a.d)} · ${pad(a.h)}:00` }),
        el('p', { class: 'aa-booked-status', text: a.status === 'confirmed' ? 'Asistencia confirmada' : a.reminded ? 'Esperando tu confirmación' : 'Recordatorio 24 h antes' }),
        el('button', { type: 'button', class: 'aa-link-btn', 'data-act': 'open-chat', text: 'Ver mensajes' })));
      return;
    }
    const specs = SPEC_IDS.filter(id => SPECIALISTS[id].service === draft.service);
    if (!specs.includes(draft.spec)) draft.spec = specs[0];
    const dayOptions = Array.from({ length: DAYS }, (_, d) => {
      const has = HOURS.some(h => freeSlot(draft.spec, d, h));
      return { value: d, label: DAY_SHORT[d], sub: String(dayNum(d)), disabled: !has, aria: `${DAY_LONG[d]} ${dayNum(d)}${has ? '' : ', sin horarios'}` };
    });
    if (dayOptions[draft.d]?.disabled) draft.d = (dayOptions.find(o => !o.disabled) || { value: null }).value;
    const freeHours = draft.d === null ? [] : HOURS.filter(h => freeSlot(draft.spec, draft.d, h));
    if (!freeHours.includes(draft.h)) draft.h = null;
    const name = el('input', { id: 'aa-name', class: 'aa-input', value: draft.name, maxlength: 40, autocomplete: 'off', name: 'patient' });
    name.addEventListener('input', () => { state.draft.name = name.value; save(); });
    const workingHours = draft.d === null ? [] : HOURS.filter(h => works(draft.spec, draft.d, h));
    bookingRoot.append(
      chipGroup('Servicio', 'service', Object.keys(SERVICES).map(s => ({ value: s, label: s })), draft.service),
      chipGroup('Especialista', 'spec', specs.map(id => ({ value: id, label: SPECIALISTS[id].name })), draft.spec),
      chipGroup('Tipo de cita', 'type', [{ value: 'Primera visita', label: 'Primera visita' }, { value: 'Control', label: 'Control' }], draft.type),
      chipGroup('Día', 'd', dayOptions, draft.d),
      workingHours.length
        ? chipGroup('Hora disponible', 'h', workingHours.map(h => ({ value: h, label: `${pad(h)}:00`, disabled: !freeHours.includes(h), aria: `${pad(h)}:00${freeHours.includes(h) ? '' : ', ocupado'}` })), draft.h)
        : el('p', { class: 'aa-empty', text: 'No quedan horarios esta semana con esta persona.' }),
      el('div', { class: 'aa-field' }, el('label', { for: 'aa-name', text: 'Tu nombre (ficticio)' }), name),
      el('button', { type: 'button', class: 'aa-btn aa-book-btn', 'data-act': 'book', disabled: draft.h === null || undefined }, draft.h === null ? 'Elige una hora' : `Reservar ${DAY_SHORT[draft.d]} ${pad(draft.h)}:00`)
    );
  }
  function renderChat() {
    const atBottom = chatRoot.scrollHeight - chatRoot.scrollTop - chatRoot.clientHeight < 40;
    chatRoot.replaceChildren();
    if (!state.chat.length) {
      chatRoot.append(el('p', { class: 'aa-chat-empty', text: 'Aquí aparecerán la confirmación, el recordatorio y el seguimiento de tu cita.' }));
    }
    let lastDay = null;
    state.chat.forEach(m => {
      const d = Math.min(5, Math.floor(m.t / DAY));
      if (d !== lastDay) { chatRoot.append(el('p', { class: 'aa-chat-day', text: `${DAY_LONG[d]} ${dayNum(d)}` })); lastDay = d; }
      const bubble = el('div', { class: `aa-msg aa-msg-${m.from}${fresh.chat.has(m.id) ? ' is-new' : ''}` },
        el('p', { text: m.text }),
        el('span', { class: 'aa-msg-time', text: hm(m.t % DAY) + (m.from === 'patient' ? ' ✓✓' : '') }));
      if (m.actions?.length) {
        bubble.append(el('div', { class: 'aa-msg-actions' }, m.actions.map((action, index) => el('button', {
          type: 'button', class: 'aa-reply', 'data-act': action.act, 'data-msg': m.id, 'data-index': index, disabled: m.used || undefined
        }, action.label))));
      }
      chatRoot.append(bubble);
    });
    if (atBottom || fresh.chat.size) chatRoot.scrollTop = chatRoot.scrollHeight;
  }
  function setPhoneTab(tab, focus = false) {
    state.phoneTab = tab;
    if (tab === 'chat') state.unread = 0;
    document.querySelectorAll('[data-ptab]').forEach(button => {
      const on = button.dataset.ptab === tab;
      button.setAttribute('aria-selected', String(on));
      button.tabIndex = on ? 0 : -1;
      if (on && focus) button.focus();
    });
    $('pscreen-book').hidden = tab !== 'book';
    $('pscreen-chat').hidden = tab !== 'chat';
    renderUnread();
    if (tab === 'chat') chatRoot.scrollTop = chatRoot.scrollHeight;
  }
  function renderUnread() {
    const badge = $('aa-unread');
    badge.textContent = state.unread;
    badge.hidden = !state.unread;
  }

  // ---------- Vista: recepción ----------
  const STATUS_LABEL = { booked: 'Sin confirmar', confirmed: 'Confirmada', attended: 'Asistió', noshow: 'No asistió', cancelled: 'Cancelada' };
  function renderMetrics() {
    const activeCount = state.appts.filter(active).length;
    const pct = Math.round((activeCount / totalCapacity) * 100);
    const tiles = [
      ['Ocupación de la semana', `${pct}%`, `${activeCount} de ${totalCapacity} espacios`, pct],
      ['Recordatorios enviados', state.stats.reminders, 'desde el lunes 08:00'],
      ['Inasistencias evitadas', state.stats.avoided, `${state.stats.recovered} ${state.stats.recovered === 1 ? 'espacio recuperado' : 'espacios recuperados'}`],
      ['No asistieron', state.stats.noshows, 'con mensaje para reprogramar']
    ];
    const root = $('aa-metrics');
    const previous = [...root.querySelectorAll('strong')].map(node => node.textContent);
    root.replaceChildren(...tiles.map(([label, value, sub, bar], index) => el('div', { class: 'aa-metric' },
      el('span', { text: label }),
      el('strong', { class: previous.length && previous[index] !== String(value) ? 'is-bump' : '', text: value }),
      el('small', { text: sub }),
      bar !== undefined ? el('i', { class: 'aa-metric-bar', style: `--s:${Math.min(1, bar / 100)}`, 'aria-hidden': 'true' }) : null)));
  }
  function renderSpecTabs() {
    $('aa-spec-tabs').replaceChildren(...SPEC_IDS.map(id => {
      const sp = SPECIALISTS[id];
      const on = state.calSpec === id;
      return el('button', { type: 'button', role: 'tab', class: 'aa-spec-tab', 'data-spec': id, 'aria-selected': String(on), tabindex: on ? 0 : -1, style: `--tint:${sp.tint}` },
        el('span', { class: 'aa-spec-avatar', 'aria-hidden': 'true', text: sp.name.split(' ').map(p => p[0]).join('') }),
        el('span', { class: 'aa-spec-text' }, el('b', { text: sp.short }), el('small', { text: sp.service })));
    }));
  }
  function renderCalendar() {
    const spec = state.calSpec;
    const cal = $('aa-cal');
    const nowDay = Math.floor(state.clock / DAY);
    cal.replaceChildren();
    const head = el('div', { class: 'aa-cal-row aa-cal-headrow' }, el('span', { class: 'aa-cal-corner', 'aria-hidden': 'true' }));
    for (let d = 0; d < DAYS; d += 1) head.append(el('span', { class: `aa-cal-day${d === nowDay ? ' is-today' : ''}` }, el('b', { text: DAY_SHORT[d] }), el('small', { text: `${dayNum(d)} ${monthShort(d)}` })));
    cal.append(head);
    HOURS.filter(h => Array.from({ length: DAYS }, (_, d) => d).some(d => works(spec, d, h))).forEach(h => {
      const row = el('div', { class: 'aa-cal-row' }, el('span', { class: 'aa-cal-hour', text: `${pad(h)}:00` }));
      for (let d = 0; d < DAYS; d += 1) {
        const start = d * DAY + h * 60;
        const past = start + 60 <= state.clock;
        const now = state.clock >= start && state.clock < start + 60;
        if (!works(spec, d, h)) { row.append(el('span', { class: 'aa-cell is-off', 'aria-label': `${DAY_LONG[d]} ${pad(h)}:00, no atiende` })); continue; }
        const a = apptAt(spec, d, h);
        if (!a) {
          const cancelled = state.appts.find(x => x.spec === spec && x.d === d && x.h === h && x.status === 'cancelled');
          row.append(el('span', { class: `aa-cell is-free${past ? ' is-past' : ''}${now ? ' is-now' : ''}${fresh.cells.has(`${spec}|${d}|${h}`) ? ' is-flash' : ''}`, 'aria-label': `${DAY_LONG[d]} ${pad(h)}:00, libre` }, el('span', { class: 'aa-cell-free', text: cancelled ? 'Liberado' : 'Libre' })));
          continue;
        }
        const kind = a.status === 'noshow' ? 'no' : a.user ? 'you' : a.source === 'waitlist' ? 'wait' : a.status === 'booked' ? 'pending' : 'ok';
        const cls = ['aa-cell', 'is-appt', `k-${kind}`, past ? 'is-past' : '', now ? 'is-now' : '', state.selected === a.id ? 'is-selected' : '', fresh.cells.has(a.id) ? 'is-flash' : ''].filter(Boolean).join(' ');
        const initials = a.patient.split(' ').map(p => p[0]).join('').slice(0, 2);
        row.append(el('button', { type: 'button', class: cls, 'data-appt': a.id, 'aria-pressed': String(state.selected === a.id), 'aria-label': `${DAY_LONG[d]} ${pad(h)}:00, ${a.patient}, ${STATUS_LABEL[a.status]}${a.source === 'waitlist' ? ', desde lista de espera' : ''}` },
          el('span', { class: 'aa-cell-name', text: a.patient }),
          el('span', { class: 'aa-cell-ini', 'aria-hidden': 'true', text: initials }),
          el('span', { class: 'aa-cell-status', text: a.source === 'waitlist' && a.status === 'confirmed' ? 'Lista de espera' : STATUS_LABEL[a.status] })));
      }
      cal.append(row);
    });
    const end = dayDate(5);
    $('aa-week-label').textContent = `Semana del ${dayNum(0)} ${monthShort(0)} al ${end.getDate()} ${monthShort(5)} · ${SPECIALISTS[spec].name}`;
  }
  function renderDetail() {
    const root = $('aa-detail');
    const a = state.appts.find(x => x.id === state.selected);
    root.replaceChildren();
    if (!a) {
      root.append(el('p', { class: 'aa-detail-empty' }, el('b', { text: 'Toca una cita del calendario' }), ' para ver su estado y lo que hizo la automatización.'));
      return;
    }
    const sp = SPECIALISTS[a.spec];
    const start = startOf(a);
    const history = [];
    history.push(a.source === 'waitlist' ? 'Agendada desde la lista de espera' : a.user ? 'Reservada en línea · confirmación enviada' : 'Agendada · confirmación enviada');
    if (a.source === 'waitlist') history.push('Aceptó la oferta por WhatsApp');
    else if (a.reminded && a.status !== 'cancelled') history.push(a.response === 'confirm' ? 'Recordatorio 24 h · confirmó' : startOf(a) - a.bookedAt < DAY ? 'Reservó con menos de 24 h: sin recordatorio' : 'Recordatorio enviado · sin respuesta');
    if (a.status === 'cancelled') history.push(`Canceló ${a.cancelledBy === 'reception' ? 'por recepción' : 'respondiendo al recordatorio'}`);
    if (a.status === 'attended') history.push('Asistió');
    if (a.status === 'noshow') history.push('No asistió');
    if (a.followed) history.push('Seguimiento enviado');
    const actions = el('div', { class: 'aa-detail-actions' });
    const future = start > state.clock;
    if (future && ['booked', 'confirmed'].includes(a.status)) {
      actions.append(el('button', { type: 'button', class: 'aa-btn aa-btn-small aa-btn-ghost', 'data-act': 'reception-cancel', 'data-appt': a.id, text: 'Cancelar y ofrecer a la lista de espera' }));
    } else if (!future && ['attended', 'noshow'].includes(a.status)) {
      actions.append(el('button', { type: 'button', class: 'aa-btn aa-btn-small aa-btn-ghost', 'data-act': 'toggle-attend', 'data-appt': a.id, text: a.status === 'attended' ? 'Marcar como no asistió' : 'Marcar como asistió' }));
    }
    root.append(
      el('div', { class: 'aa-detail-top' }, el('span', { class: `aa-pill s-${a.status}`, text: STATUS_LABEL[a.status] }), el('small', { text: a.id })),
      el('h4', { text: a.patient }),
      el('p', { class: 'aa-detail-when', text: `${sp.service} · ${a.type} · ${DAY_LONG[a.d]} ${dayNum(a.d)}, ${pad(a.h)}:00 · ${sp.short}` }),
      el('ul', { class: 'aa-detail-history' }, history.map(item => el('li', { text: item }))),
      actions
    );
  }
  function renderWaitlist() {
    $('aa-waitlist').replaceChildren(...state.waitlist.map(w => {
      const a = state.appts.find(x => x.id === w.apptId);
      return el('li', { class: `aa-wait${w.status === 'booked' ? ' is-done' : ''}${a && fresh.cells.has(a.id) ? ' is-flash' : ''}` },
        el('span', { class: 'aa-wait-name', text: w.name }),
        el('span', { class: 'aa-wait-meta', text: `${w.service} · ${PREF_LABEL[w.pref]}` }),
        el('span', { class: 'aa-wait-state', text: w.status === 'booked' && a ? `Agendada ${DAY_SHORT[a.d]} ${pad(a.h)}:00` : 'Esperando' }));
    }));
  }
  const LOG_ICON = { info: '•', book: '+', confirm: '✓', reminder: '◷', cancel: '×', free: '○', offer: '→', recovered: '★', visit: '✓', noshow: '!', follow: '♡' };
  function renderLog() {
    $('aa-log').replaceChildren(...[...state.log].sort((x, y) => y.t - x.t || y.id - x.id).slice(0, 40).map((entry, index) => {
      const isNew = fresh.log.has(entry.id);
      return el('li', { class: `aa-log-item k-${entry.kind}${isNew ? ' is-new' : ''}`, style: isNew ? `--i:${Math.min(index, 8)}` : undefined },
        el('span', { class: 'aa-log-ico', 'aria-hidden': 'true', text: LOG_ICON[entry.kind] || '•' }),
        el('span', { class: 'aa-log-time', text: stamp(entry.t) }),
        el('span', { class: 'aa-log-text', text: entry.text }));
    }));
  }
  function renderBars() {
    $('aa-bars').replaceChildren(...SPEC_IDS.map(id => {
      const sp = SPECIALISTS[id];
      const count = state.appts.filter(a => a.spec === id && active(a)).length;
      const cap = capacityOf(id);
      const pct = Math.round((count / cap) * 100);
      return el('li', {},
        el('div', { class: 'aa-bar-top' }, el('b', { text: sp.name }), el('span', { text: `${count} citas · ${pct}%` })),
        el('div', { class: 'aa-bar', role: 'img', 'aria-label': `${sp.name}: ${count} de ${cap} espacios ocupados` }, el('i', { style: `--s:${Math.min(1, pct / 100)};--tint:${sp.tint}` })));
    }));
  }

  // ---------- Recorrido y controles ----------
  function renderRail() {
    const a = state.appts.find(x => x.id === state.railAppt) || userAppt();
    const nextBooked = state.appts.find(x => x.id === state.nextBooked && active(x));
    const steps = [
      { key: 'book', title: 'Reserva', note: 'Elige servicio, persona y hora' },
      { key: 'confirm', title: 'Confirmación', note: 'WhatsApp al instante' },
      { key: 'remind', title: 'Recordatorio 24 h', note: 'Con botones de respuesta' },
      { key: 'answer', title: 'Respuesta', note: 'Confirma o libera el espacio' },
      { key: 'visit', title: 'Visita', note: 'Asistencia registrada' },
      { key: 'follow', title: 'Seguimiento', note: 'Próxima cita sugerida' }
    ];
    const status = {};
    if (!a) status.book = 'current';
    else {
      status.book = 'done'; status.confirm = 'done';
      if (a.status === 'cancelled') {
        status.remind = 'done'; status.answer = 'alt'; status.visit = 'skip'; status.follow = 'skip';
        const filled = state.appts.find(x => x.spec === a.spec && x.d === a.d && x.h === a.h && x.source === 'waitlist');
        steps[3].note = filled ? `Canceló · espacio para ${filled.patient}` : 'Canceló · espacio liberado';
      } else {
        status.remind = a.reminded ? 'done' : 'current';
        if (a.reminded && startOf(a) - DAY > -1 && a.status === 'booked' && !state.chat.some(m => m.kind === 'reminder' && m.appt === a.id)) steps[2].note = 'No hace falta: faltaban menos de 24 h';
        status.answer = a.status === 'booked' ? (a.reminded ? 'current' : '') : 'done';
        if (a.status !== 'booked') steps[3].note = 'Confirmó asistencia';
        status.visit = ['attended', 'noshow'].includes(a.status) ? 'done' : (a.status === 'confirmed' ? 'current' : '');
        if (a.status === 'noshow') { status.visit = 'alt'; steps[4].note = 'No asistió'; }
        status.follow = a.followed ? 'done' : (['attended', 'noshow'].includes(a.status) ? 'current' : '');
        if (a.followed && nextBooked) steps[5].note = `Control reservado: ${slotLabel(nextBooked.d, nextBooked.h)}`;
      }
    }
    $('aa-rail').replaceChildren(...steps.map((step, index) => el('li', { class: `aa-rail-step${status[step.key] ? ` is-${status[step.key]}` : ''}`, 'aria-current': status[step.key] === 'current' ? 'step' : undefined },
      el('span', { class: 'aa-rail-num', 'aria-hidden': 'true', text: status[step.key] === 'done' ? '✓' : String(index + 1) }),
      el('span', { class: 'aa-rail-text' }, el('b', { text: step.title }), el('small', { text: step.note })))));
  }
  function renderControls() {
    const dayIndex = Math.min(5, Math.floor(state.clock / DAY));
    $('aa-clock').textContent = `${DAY_LONG[dayIndex]} ${dayNum(dayIndex)} · ${hm(state.clock % DAY)}`;
    $('aa-phone-time').textContent = hm(state.clock % DAY);
    const next = nextUserEvent();
    const ended = state.clock >= END_CLOCK;
    const advanceButton = $('aa-advance');
    $('aa-advance-label').textContent = ended ? 'Semana terminada' : next ? `Adelantar a ${stamp(next.at)} · ${next.label}` : `Adelantar a ${stamp(Math.min(END_CLOCK, state.clock + DAY))}`;
    advanceButton.disabled = ended || demo.running;
    $('aa-plus').disabled = ended || demo.running;
    $('aa-reset').disabled = demo.running;
  }

  function renderAll() {
    renderControls();
    renderRail();
    renderBooking();
    renderChat();
    renderUnread();
    renderMetrics();
    renderSpecTabs();
    renderCalendar();
    renderDetail();
    renderWaitlist();
    renderLog();
    renderBars();
    const badge = $('aa-reception-badge');
    if (fresh.cells.size && state.view === 'patient') badge.hidden = false;
    fresh = { log: new Set(), chat: new Set(), cells: new Set() };
  }
  function commit() { save(); renderAll(); }

  function setView(view, focus = false) {
    state.view = view;
    document.querySelector('.aa-stage').dataset.view = view;
    document.querySelectorAll('[data-view][role="tab"]').forEach(tab => {
      const on = tab.dataset.view === view;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    if (view === 'reception') $('aa-reception-badge').hidden = true;
  }

  let toastTimer = 0;
  function toast(text) {
    const node = $('aa-toast');
    node.textContent = text;
    node.hidden = false;
    node.classList.remove('is-out');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      node.classList.add('is-out');
      window.setTimeout(() => { node.hidden = true; }, calm() ? 0 : 300);
    }, 3200);
  }

  // ---------- Acciones ----------
  function doAdvance(target) {
    if (demo.running && !demo.internal) return;
    const before = state.clock;
    advance(target);
    if (state.clock === before) return;
    commit();
  }
  function act(action, data = {}) {
    const a = userAppt();
    switch (action) {
      case 'book': {
        const d = state.draft;
        const name = (d.name || '').trim().slice(0, 40) || 'Camila R.';
        const created = book({ spec: d.spec, d: d.d, h: d.h, type: d.type, name });
        if (!created) { toast('Ese horario ya no está libre. Elige otro.'); commit(); return; }
        state.railAppt = created.id;
        state.nextBooked = null;
        state.draft.h = null;
        setPhoneTab('chat');
        commit();
        toast(`Reserva creada: ${slotLabel(created.d, created.h)}. Mira la agenda de recepción.`);
        return;
      }
      case 'confirm': {
        if (!a || a.status !== 'booked') return;
        markUsed(data.msg);
        a.status = 'confirmed';
        a.response = 'confirm';
        state.stats.confirmed += 1;
        message('patient', 'Confirmo asistencia 👍');
        message('alma', `¡Gracias, ${firstName(a.patient)}! Te esperamos. Llega 10 minutos antes para tomarte un té en la sala del jardín.`);
        log('confirm', `${a.patient} confirmó su cita de ${slotLabel(a.d, a.h)} desde el recordatorio.`);
        fresh.cells.add(a.id);
        commit();
        return;
      }
      case 'cancel': {
        if (!a || !['booked', 'confirmed'].includes(a.status)) return;
        markUsed(data.msg);
        message('patient', 'Necesito cancelar, me salió un imprevisto.');
        log('cancel', `${a.patient} canceló desde el recordatorio, con ${Math.round((startOf(a) - state.clock) / 60)} h de anticipación.`);
        const filled = cancelAppt(a, 'patient');
        message('alma', `Listo, ${firstName(a.patient)}: cancelamos tu cita sin costo. ${filled ? 'Tu espacio ya lo aprovechará otra persona de la lista de espera. ' : ''}¿Quieres elegir otro horario?`, [{ act: 'open-book', label: 'Elegir otro horario' }]);
        state.selected = filled ? filled.id : null;
        state.calSpec = a.spec;
        commit();
        if (filled) toast(`Espacio ofrecido a ${filled.patient} y agendado automáticamente.`);
        return;
      }
      case 'book-next': {
        const msg = state.chat.find(m => m.id === Number(data.msg));
        const option = msg?.actions?.[Number(data.index)];
        if (!option || msg.used || !a) return;
        if (userBusy()) { toast('Ya tienes una cita activa.'); return; }
        const created = book({ spec: a.spec, d: option.d, h: option.h, type: 'Control', name: a.patient });
        markUsed(data.msg);
        if (created) state.nextBooked = created.id;
        if (!created) { message('alma', 'Ese horario se ocupó hace un momento. Elige otro desde Reservar.', [{ act: 'open-book', label: 'Ver horarios' }]); commit(); return; }
        commit();
        toast(`Control agendado: ${slotLabel(created.d, created.h)}.`);
        return;
      }
      case 'open-book': setPhoneTab('book'); markUsed(data.msg); commit(); return;
      case 'open-chat': setPhoneTab('chat'); commit(); return;
      case 'reception-cancel': {
        const target = state.appts.find(x => x.id === data.appt);
        if (!target || !['booked', 'confirmed'].includes(target.status)) return;
        log('cancel', `Recepción canceló la cita de ${target.patient} (${slotLabel(target.d, target.h)}) a pedido del paciente.`);
        if (target.user) message('alma', `Hola ${firstName(target.patient)}, según lo que hablaste con recepción, cancelamos tu cita ${slotLong(target.d, target.h)}.`, [{ act: 'open-book', label: 'Elegir otro horario' }]);
        const filled = cancelAppt(target, 'reception');
        state.selected = filled ? filled.id : null;
        commit();
        if (filled) toast(`Espacio ofrecido a ${filled.patient} y agendado automáticamente.`);
        return;
      }
      case 'toggle-attend': {
        const target = state.appts.find(x => x.id === data.appt);
        if (!target) return;
        if (target.status === 'attended') { target.status = 'noshow'; state.stats.noshows += 1; log('noshow', `Recepción marcó que ${target.patient} no asistió.`); }
        else if (target.status === 'noshow') { target.status = 'attended'; state.stats.noshows = Math.max(0, state.stats.noshows - 1); log('visit', `Recepción corrigió: ${target.patient} sí asistió.`); }
        fresh.cells.add(target.id);
        commit();
        return;
      }
      default:
    }
  }
  function markUsed(id) {
    const msg = state.chat.find(m => m.id === Number(id));
    if (msg) msg.used = true;
  }

  // Delegación de eventos
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (demo.running && !demo.internal && target.closest('.aa-live') && !target.matches('#aa-demo')) return;
    if (target.matches('.aa-chip')) {
      const { field, value } = target.dataset;
      state.draft[field] = ['d', 'h'].includes(field) ? Number(value) : value;
      if (field === 'service') { state.draft.spec = SPEC_IDS.find(id => SPECIALISTS[id].service === value); state.draft.h = null; }
      if (field === 'spec' || field === 'd') state.draft.h = null;
      if (field === 'spec') state.calSpec = value;
      save();
      renderBooking();
      if (field === 'spec') { renderSpecTabs(); renderCalendar(); }
      bookingRoot.querySelector(`[data-field="${field}"][data-value="${CSS.escape(value)}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (target.dataset.act) { act(target.dataset.act, target.dataset); return; }
    if (target.dataset.ptab) { setPhoneTab(target.dataset.ptab); save(); renderChat(); return; }
    if (target.dataset.view && target.getAttribute('role') === 'tab') { setView(target.dataset.view); save(); return; }
    if (target.dataset.spec) { state.calSpec = target.dataset.spec; save(); renderSpecTabs(); renderCalendar(); $('aa-spec-tabs').querySelector(`[data-spec="${target.dataset.spec}"]`)?.focus(); return; }
    if (target.dataset.appt && target.classList.contains('aa-cell')) { state.selected = target.dataset.appt; save(); renderCalendar(); renderDetail(); document.querySelector(`.aa-cell[data-appt="${target.dataset.appt}"]`)?.focus({ preventScroll: true }); return; }
  });
  // Flechas en las pestañas
  document.addEventListener('keydown', event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const list = [...tab.parentElement.querySelectorAll('[role="tab"]')];
    const index = list.indexOf(tab);
    const next = { ArrowRight: (index + 1) % list.length, ArrowLeft: (index - 1 + list.length) % list.length, Home: 0, End: list.length - 1 }[event.key];
    event.preventDefault();
    list[next].click();
    list[next].focus();
  });
  $('aa-advance').addEventListener('click', () => {
    const next = nextUserEvent();
    doAdvance(next ? next.at : state.clock + DAY);
  });
  $('aa-plus').addEventListener('click', () => doAdvance(state.clock + 180));
  $('aa-reset').addEventListener('click', () => { reset(); toast('Semana reiniciada con los datos de ejemplo.'); });

  function reset() {
    try { localStorage.removeItem(STORAGE); } catch { /* nada */ }
    state = seed();
    setPhoneTab('book');
    setView('patient');
    commit();
  }

  // ---------- Recorrido automático ----------
  const demo = { running: false, internal: false, token: 0 };
  const caption = $('aa-caption');
  const narrow = window.matchMedia('(max-width: 960px)');
  function wait(ms, token) {
    return new Promise((resolve, reject) => window.setTimeout(() => (token === demo.token ? resolve() : reject(new Error('stop'))), calm() ? 40 : ms));
  }
  function say(step, text) {
    caption.hidden = false;
    caption.replaceChildren(el('b', { text: `${step}/6` }), ` ${text}`);
  }
  function focusOn(selector, block = 'center') {
    const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
    node?.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block });
    return node;
  }
  async function press(selector, token, ms = 650) {
    const node = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!node) throw new Error(`missing ${selector}`);
    focusOn(node, 'nearest');
    node.classList.add('is-demo-target');
    await wait(ms, token);
    node.classList.remove('is-demo-target');
    demo.internal = true;
    try { node.click(); } finally { demo.internal = false; }
    await wait(200, token);
  }
  function showView(view) { if (narrow.matches) setView(view); }
  function demoAdvance(target) { demo.internal = true; try { doAdvance(target); } finally { demo.internal = false; } }
  function finishDemo(completed) {
    demo.running = false;
    document.body.classList.remove('is-demo');
    document.querySelectorAll('[data-demo-start] span:last-child').forEach(node => { if (node.closest('#aa-demo')) node.textContent = 'Ver el flujo completo'; });
    document.querySelectorAll('.is-demo-target').forEach(node => node.classList.remove('is-demo-target'));
    renderControls();
    if (completed) {
      document.body.dataset.demo = 'done';
      say(6, 'Listo: reserva, recordatorio, lista de espera, asistencia y seguimiento, sin una sola llamada.');
      toast('Así trabaja sola la agenda de ALMA. Ahora pruébala tú.');
    } else {
      document.body.dataset.demo = 'stopped';
      caption.hidden = true;
    }
  }
  async function runDemo() {
    if (demo.running) { demo.token += 1; finishDemo(false); return; }
    demo.token += 1;
    const token = demo.token;
    reset();
    demo.running = true;
    document.body.dataset.demo = 'running';
    document.body.classList.add('is-demo');
    const label = document.querySelector('#aa-demo span:last-child');
    if (label) label.textContent = 'Detener el recorrido';
    renderControls();
    $('en-vivo').scrollIntoView({ behavior: calm() ? 'auto' : 'smooth', block: 'start' });
    try {
      await wait(700, token);
      showView('patient');
      say(1, 'Camila reserva fisioterapia con Mariana desde su celular.');
      focusOn('.aa-phone');
      await wait(500, token);
      await press('[data-field="service"][data-value="Fisioterapia"]', token);
      await press('[data-field="spec"][data-value="mariana"]', token);
      await press('[data-field="type"][data-value="Primera visita"]', token, 450);
      await press('[data-field="d"][data-value="2"]', token);
      await press('[data-field="h"][data-value="10"]', token);
      await press('[data-act="book"]', token, 800);
      say(2, 'La confirmación llega por WhatsApp y la cita aparece sola en la agenda de recepción.');
      await wait(2200, token);
      showView('reception');
      focusOn('.aa-cell.k-you');
      await wait(2400, token);
      showView('patient');
      focusOn('.aa-phone');
      say(3, 'El reloj avanza hasta 24 h antes: sale el recordatorio con botones para responder.');
      await wait(1200, token);
      demoAdvance(nextUserEvent().at);
      focusOn('.aa-reply[data-act="confirm"]:not([disabled])');
      await wait(1800, token);
      await press('.aa-reply[data-act="confirm"]:not([disabled])', token, 900);
      say(4, 'Otro paciente, Tomás, cancela su cita del miércoles: el espacio se ofrece solo a Valentina, de la lista de espera.');
      await wait(1200, token);
      demoAdvance(nextUserEvent().at);
      state.selected = state.appts.find(x => x.source === 'waitlist')?.id || state.selected;
      state.calSpec = 'mariana';
      renderAll();
      showView('reception');
      focusOn('.aa-cell.is-selected');
      await wait(3600, token);
      say(5, 'Camila asiste. Hernán no llegó: queda registrado y recibe un mensaje para reprogramar.');
      await wait(1200, token);
      demoAdvance(nextUserEvent().at);
      state.selected = state.appts.find(x => x.status === 'noshow' && x.spec === 'mariana' && x.d === 2)?.id || state.selected;
      renderCalendar();
      renderDetail();
      focusOn('.aa-cell.is-selected');
      await wait(2800, token);
      showView('patient');
      focusOn('.aa-phone');
      say(6, 'Después de la visita llega el seguimiento con la próxima cita sugerida. Camila la reserva con un toque.');
      await wait(2000, token);
      await press('.aa-reply[data-act="book-next"]:not([disabled])', token, 1000);
      await wait(1400, token);
      finishDemo(true);
    } catch (error) {
      if (error.message !== 'stop') { console.warn(error); finishDemo(false); }
    }
  }
  document.querySelectorAll('[data-demo-start]').forEach(button => button.addEventListener('click', () => {
    if (button.id !== 'aa-demo' && demo.running) return;
    runDemo();
  }));

  // ---------- Arranque ----------
  state = load();
  setPhoneTab(state.phoneTab === 'chat' ? 'chat' : 'book');
  setView(state.view === 'reception' ? 'reception' : 'patient');
  renderAll();
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE || demo.running) return;
    state = load();
    setPhoneTab(state.phoneTab === 'chat' ? 'chat' : 'book');
    setView(state.view === 'reception' ? 'reception' : 'patient');
    renderAll();
  });
})();
