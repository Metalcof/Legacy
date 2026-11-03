'use strict';
// Flujo de clientes de Valeria Ríos: brief → calificación y agenda → llamada → propuesta → firma → anticipo → proyecto.
// Todo ocurre en este navegador. No se envían mensajes, no se firman documentos y no se cobra nada.
(() => {
  const KEY = 'nexo-auto-personal-v1';
  const config = window.SITE_CONFIG || {};
  const studio = typeof config.name === 'string' && config.name.trim() ? config.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach(node => { node.textContent = studio; });
  document.title = document.title.replace('Nexo Studio', studio);
  const phone = String(config.phone || '573185314299').replace(/\D/g, '');
  document.querySelectorAll('[data-studio-contact]').forEach(link => {
    link.href = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola, ${studio}. Me interesa un flujo de clientes como el de Valeria Ríos para mi negocio.`)}`;
  });

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const money = amount => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  const fmtTime = ms => new Intl.DateTimeFormat('es-CO', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ms)).replace('.', '');
  const fmtDay = ms => new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms));
  const fmtShortDate = ms => new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms)).replace('.', '');
  const cap = text => text.charAt(0).toUpperCase() + text.slice(1);
  const firstName = name => String(name).trim().split(/\s+/)[0] || 'Cliente';
  const MIN = 60000;

  /* ---------- Catálogo (mismos paquetes y precios de la web) ---------- */
  const PACKAGES = {
    esencial: { name: 'Esencial', price: 800000, days: 14, rounds: 1, scope: ['Sesión de dirección de marca (2 horas)', 'Paleta de color y pareja tipográfica', 'Guía visual breve en PDF', 'Plantillas base para redes'] },
    identidad: { name: 'Identidad', price: 1600000, days: 21, rounds: 2, scope: ['Dirección de marca y concepto creativo', 'Identidad visual: logotipo, color y tipografía', 'Sistema de aplicaciones: redes, papelería y presentación', 'Guía de uso para tu equipo'] },
    estrategia: { name: 'Estrategia + identidad', price: 2400000, days: 30, rounds: 3, scope: ['Diagnóstico y posicionamiento', 'Mensaje central y tono de voz', 'Identidad visual completa', 'Plan de lanzamiento y guía de uso'] }
  };
  const EXTRAS = {
    naming: { name: 'Naming y verificación básica', price: 600000, weeks: 1 },
    foto: { name: 'Dirección de fotografía de marca', price: 900000, weeks: 1 },
    redes: { name: '12 plantillas editables para redes', price: 400000, weeks: 0 },
    taller: { name: 'Sesión de adopción con tu equipo', price: 350000, weeks: 0 }
  };
  const GOALS = { lanzar: 'Lanzar una marca nueva', renovar: 'Renovar una marca que ya existe', personal: 'Construir mi marca personal', ordenar: 'Ordenar cómo me comunico' };
  const GOAL_PHRASE = { lanzar: 'lanzar una marca nueva', renovar: 'renovar una marca que ya existe', personal: 'construir su marca personal', ordenar: 'ordenar cómo se comunica' };
  const TYPES = { servicios: 'Servicios profesionales', producto: 'Producto (cosmética, comida, moda…)', hospitalidad: 'Hospitalidad y turismo', educacion: 'Educación y talleres', otro: 'Otro tipo de negocio' };
  const BUDGETS = { menos2: 'Menos de $2 M', '2a4': '$2 a $4 M', '4a7': '$4 a $7 M', mas7: 'Más de $7 M' };
  const DEADLINES = { urgente: 'Este mes', '1a2': 'En 1 o 2 meses', flexible: 'Sin fecha fija' };
  const PHASES = ['Investigación', 'Concepto', 'Identidad', 'Entrega'];
  const PHASE_SHARE = [.2, .25, .4, .15];
  const PHASE_PREVIEW = ['Diagnóstico de una página', 'Dos rutas de concepto', 'Sistema de identidad aplicado', 'Archivos finales y guía de uso'];
  const STAGES = [
    { key: 'brief', label: 'Brief', hint: 'El cliente cuenta su proyecto' },
    { key: 'reply', label: 'Agenda', hint: 'Respuesta y horario' },
    { key: 'call', label: 'Llamada', hint: 'Descubrimiento' },
    { key: 'proposal', label: 'Propuesta', hint: 'Alcance y precio' },
    { key: 'sign', label: 'Firma', hint: 'Aceptación en línea' },
    { key: 'invoice', label: 'Anticipo', hint: 'Factura del 50 %' },
    { key: 'project', label: 'Proyecto', hint: 'Fases y rondas' }
  ];
  const SEEDS = [
    { name: 'Estudio Lumen', who: 'Ana, arquitecta', pkg: 'identidad', status: 'aceptada', value: 1600000 },
    { name: 'Café Origen', who: 'Julián, tostador', pkg: 'esencial', status: 'enviada', value: 800000 },
    { name: 'Mónica Arango', who: 'Coach de liderazgo', pkg: 'estrategia', status: 'aceptada', value: 2400000 },
    { name: 'Taller Barro', who: 'Sara, ceramista', pkg: 'identidad', status: 'enviada', value: 1900000 },
    { name: 'Nómada Viajes', who: 'Equipo de 4', pkg: 'estrategia', status: 'rechazada', value: 2400000 }
  ];
  const SLOT_TIMES = ['09:30', '11:00', '15:00', '17:30'];
  const SEED_STATUS = { aceptada: 'Aceptada', enviada: 'Enviada', rechazada: 'No avanzó' };

  const startOfToday = () => { const d = new Date(); d.setHours(9, 4, 0, 0); return d.getTime(); };
  const fresh = () => ({ v: 1, view: 'client', stage: 0, now: startOfToday(), lead: null, slot: null, notes: '', proposal: null, signed: null, invoice: null, project: null, log: [] });

  /* ---------- Persistencia protegida ---------- */
  const isStr = (value, max = 300) => typeof value === 'string' && value.length <= max;
  const isNum = value => typeof value === 'number' && Number.isFinite(value);
  const isInt = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  function valid(s) {
    if (!s || s.v !== 1 || !['client', 'valeria'].includes(s.view) || !isInt(s.stage, 0, 6) || !isNum(s.now) || !isStr(s.notes, 600)) return false;
    if (!Array.isArray(s.log) || s.log.length > 120 || !s.log.every(entry => entry && isNum(entry.t) && ['client', 'auto', 'valeria'].includes(entry.who) && isStr(entry.text, 400))) return false;
    if (s.lead !== null) {
      const l = s.lead;
      if (!l || !isStr(l.name, 60) || !isStr(l.brand, 60) || !isStr(l.email, 90) || !isStr(l.refs, 280) || !Object.hasOwn(GOALS, l.goal) || !Object.hasOwn(TYPES, l.type) || !Object.hasOwn(BUDGETS, l.budget) || !Object.hasOwn(DEADLINES, l.deadline) || !(l.want === '' || Object.hasOwn(PACKAGES, l.want))) return false;
    }
    if (s.slot !== null && (!s.slot || !isNum(s.slot.t))) return false;
    if (s.proposal !== null) {
      const p = s.proposal;
      if (!p || !Object.hasOwn(PACKAGES, p.pkg) || !Array.isArray(p.extras) || !p.extras.every(key => Object.hasOwn(EXTRAS, key)) || typeof p.urgent !== 'boolean' || ![0, 5, 10].includes(p.discount) || typeof p.sent !== 'boolean' || !isInt(p.number, 1, 999)) return false;
    }
    if (s.signed !== null && (!s.signed || !isStr(s.signed.name, 80) || !isNum(s.signed.t))) return false;
    if (s.invoice !== null && (!s.invoice || typeof s.invoice.paid !== 'boolean' || !isStr(s.invoice.method, 20) || !isInt(s.invoice.number, 1, 9999))) return false;
    if (s.project !== null) {
      const pr = s.project;
      if (!pr || !isInt(pr.phase, 0, 3) || !['work', 'review', 'done'].includes(pr.status) || !Array.isArray(pr.rounds) || pr.rounds.length !== 4 || !pr.rounds.every(n => isInt(n, 0, 20)) || !isStr(pr.lastNote, 240)) return false;
    }
    // Coherencia entre etapas.
    if (s.stage >= 1 && !s.lead) return false;
    if (s.stage >= 2 && !s.slot) return false;
    if (s.stage >= 3 && !s.proposal) return false;
    if (s.stage >= 4 && !s.proposal.sent) return false;
    if (s.stage >= 5 && (!s.signed || !s.invoice)) return false;
    if (s.stage === 6 && (!s.invoice.paid || !s.project)) return false;
    return true;
  }
  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return valid(parsed) ? parsed : null;
    } catch { return null; }
  }
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* almacenamiento no disponible: la demo sigue funcionando */ } }
  function clearSaved() { try { window.localStorage.removeItem(KEY); } catch { /* sin acceso */ } }

  let state = load() || fresh();
  const params = new URLSearchParams(window.location.search);
  const wantedPackage = Object.hasOwn(PACKAGES, params.get('paquete') || '') ? params.get('paquete') : '';

  /* ---------- Reglas de negocio ---------- */
  function scoreLead(lead) {
    const budget = { menos2: 10, '2a4': 26, '4a7': 35, mas7: 35 }[lead.budget];
    const time = { urgente: 9, '1a2': 20, flexible: 15 }[lead.deadline];
    const fit = { lanzar: 25, renovar: 25, personal: 23, ordenar: 18 }[lead.goal];
    const refsLength = lead.refs.trim().length;
    const refs = refsLength >= 40 ? 20 : refsLength >= 10 ? 12 : 4;
    const total = budget + time + fit + refs;
    return {
      total,
      level: total >= 75 ? 'alta' : total >= 55 ? 'media' : 'baja',
      parts: [['Presupuesto', budget, 35], ['Encaje con los servicios', fit, 25], ['Plazo', time, 20], ['Claridad de referencias', refs, 20]]
    };
  }
  function suggestPackage(lead) {
    const byBudget = { menos2: 'esencial', '2a4': 'identidad', '4a7': 'estrategia', mas7: 'estrategia' }[lead.budget];
    if (lead.want && PACKAGES[lead.want].price <= { menos2: 1900000, '2a4': 3900000, '4a7': 7e6, mas7: 1e9 }[lead.budget]) return lead.want;
    return byBudget;
  }
  function quote(p) {
    const pkg = PACKAGES[p.pkg];
    const extras = p.extras.reduce((sum, key) => sum + EXTRAS[key].price, 0);
    const base = pkg.price + extras;
    const urgency = p.urgent ? Math.round(base * .15 / 10000) * 10000 : 0;
    const discount = Math.round((base + urgency) * p.discount / 100 / 10000) * 10000;
    const total = base + urgency - discount;
    const weeks = Math.ceil(pkg.days / 7) + p.extras.reduce((sum, key) => sum + EXTRAS[key].weeks, 0);
    return { pkg, base, extras, urgency, discount, total, weeks, deposit: Math.round(total / 2) };
  }
  const proposalCode = p => `VR-${new Date(state.now).getFullYear()}-${String(p.number).padStart(3, '0')}`;
  const invoiceCode = i => `F-${String(i.number).padStart(4, '0')}`;

  function slotsFor(baseMs) {
    const days = [];
    const cursor = new Date(baseMs);
    cursor.setHours(0, 0, 0, 0);
    while (days.length < 5) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() === 0 || cursor.getDay() === 6) continue;
      const dayIndex = days.length;
      days.push({
        t: cursor.getTime(),
        slots: SLOT_TIMES.map((time, timeIndex) => {
          const [h, m] = time.split(':').map(Number);
          const at = new Date(cursor); at.setHours(h, m, 0, 0);
          return { time, t: at.getTime(), busy: (dayIndex * 3 + timeIndex) % 4 === 1 };
        })
      });
    }
    return days;
  }

  /* ---------- Registro y transiciones ---------- */
  // Avanza el reloj de ejemplo a un día hábil posterior, a una hora razonable de oficina.
  function bizDay(ms, days, hh, mm = 0) {
    const d = new Date(ms);
    let left = days;
    while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1; }
    d.setHours(hh, mm, 0, 0);
    return d.getTime();
  }
  function log(who, text, advance = 1) {
    if (typeof advance === 'object') state.now = Math.max(state.now + MIN, advance.at);
    else state.now += advance * MIN;
    state.log.push({ t: state.now, who, text });
    if (state.log.length > 120) state.log.splice(0, state.log.length - 120);
  }
  let lastLogCount = state.log.length;
  function announce(text) { const node = $('#ap-announce'); node.textContent = ''; window.setTimeout(() => { node.textContent = text; }, 40); }

  const actions = {
    submitBrief(lead) {
      state.lead = lead;
      const score = scoreLead(lead);
      const pkg = suggestPackage(lead);
      log('client', `${firstName(lead.name)} envió el brief de ${lead.brand}.`, 0);
      log('auto', `Brief calificado: ${score.total}/100, prioridad ${score.level}. Paquete sugerido: ${PACKAGES[pkg].name}.`, 1);
      log('auto', `Respuesta enviada a ${lead.email} con enlace para agendar la llamada.`, 1);
      state.stage = 1;
      announce('Brief enviado. La respuesta automática ya está en el correo del cliente.');
    },
    pickSlot(t) {
      state.slot = { t };
      log('client', `${firstName(state.lead.name)} eligió ${fmtDay(t)} a las ${new Date(t).toTimeString().slice(0, 5)}.`, 6);
      log('auto', 'Llamada agendada en el calendario. Recordatorios programados 24 h y 1 h antes.', 0);
      state.stage = 2;
      announce('Llamada agendada. Ahora le toca a Valeria.');
    },
    callDone(notes) {
      state.notes = notes;
      state.now = Math.max(state.now, state.slot.t);
      log('valeria', notes ? `Llamada hecha. Notas: «${notes.slice(0, 120)}${notes.length > 120 ? '…' : ''}»` : 'Llamada hecha. Hay encaje para avanzar.', 32);
      const pkg = suggestPackage(state.lead);
      state.proposal = { pkg, extras: [], urgent: state.lead.deadline === 'urgente', discount: 0, sent: false, number: 17 };
      log('auto', `Borrador de propuesta generado con el paquete ${PACKAGES[pkg].name}.`, 1);
      state.stage = 3;
      announce('Propuesta generada. Ajusta el alcance y envíala.');
    },
    sendProposal() {
      const q = quote(state.proposal);
      state.proposal.sent = true;
      log('valeria', `Propuesta ${proposalCode(state.proposal)} enviada por ${money(q.total)}.`, { at: bizDay(state.now, 1, 10, 15) });
      log('auto', `${firstName(state.lead.name)} abrió la propuesta. Recordatorio programado si no firma en 3 días.`, 12);
      state.stage = 4;
      announce('Propuesta enviada. Ahora el cliente puede revisarla y firmarla.');
    },
    sign(name) {
      const q = quote(state.proposal);
      state.signed = { name, t: state.now + 95 * MIN };
      log('client', `${name} aceptó y firmó la propuesta ${proposalCode(state.proposal)}.`, 95);
      state.invoice = { number: 142, paid: false, method: '' };
      log('auto', `Factura de anticipo ${invoiceCode(state.invoice)} enviada: ${money(Math.round(q.deposit * 1.19))} con IVA.`, 1);
      state.stage = 5;
      announce('Propuesta firmada. La factura de anticipo ya fue enviada.');
    },
    pay(method) {
      state.invoice.paid = true;
      state.invoice.method = method;
      log('client', `Anticipo pagado por ${method} (simulado).`, 24);
      state.project = { phase: 0, status: 'work', rounds: [0, 0, 0, 0], lastNote: '' };
      log('auto', 'Proyecto creado: tablero de 4 fases, carpeta compartida y fecha de inicio confirmada.', 1);
      state.stage = 6;
      announce('Pago registrado. El proyecto ya está en marcha.');
    },
    share() {
      const pr = state.project;
      pr.status = 'review';
      log('valeria', `Avance de ${PHASES[pr.phase]} compartido para revisión: ${PHASE_PREVIEW[pr.phase].toLowerCase()}.`, { at: bizDay(state.now, pr.rounds[pr.phase] ? 1 : 3, 16, 0) });
      log('auto', `Aviso enviado a ${firstName(state.lead.name)} para revisar el avance.`, 1);
      announce(`Avance de ${PHASES[pr.phase]} enviado al cliente.`);
    },
    approve() {
      const pr = state.project;
      log('client', `${firstName(state.lead.name)} aprobó ${PHASES[pr.phase]}.`, { at: bizDay(state.now, 1, 9, 40) });
      pr.lastNote = '';
      if (pr.phase === 3) {
        pr.status = 'done';
        const q = quote(state.proposal);
        log('auto', `Proyecto entregado. Factura de saldo F-${String(state.invoice.number + 1).padStart(4, '0')} generada por ${money(Math.round((q.total - q.deposit) * 1.19))} con IVA.`, 2);
        announce('Proyecto entregado. ¡Flujo completo!');
      } else {
        pr.phase += 1;
        pr.status = 'work';
        log('auto', `Fase ${PHASES[pr.phase]} en marcha.`, 1);
        announce(`${PHASES[pr.phase - 1]} aprobada. Empieza ${PHASES[pr.phase]}.`);
      }
    },
    requestChanges(note) {
      const pr = state.project;
      pr.rounds[pr.phase] += 1;
      pr.status = 'work';
      pr.lastNote = note;
      const used = pr.rounds.reduce((a, b) => a + b, 0);
      const allowed = PACKAGES[state.proposal.pkg].rounds;
      log('client', `${firstName(state.lead.name)} pidió ajustes en ${PHASES[pr.phase]}: «${note.slice(0, 120)}»`, { at: bizDay(state.now, 1, 11, 20) });
      log('auto', used > allowed ? `Ronda ${used}: supera las ${allowed} incluidas. Se marca para cotizar aparte.` : `Ronda ${used} de ${allowed} registrada.`, 1);
      announce('Ajustes registrados. Vuelve a Valeria.');
    }
  };
  function commit(fn, ...args) {
    fn(...args);
    render();
  }

  /* ---------- Componentes de interfaz ---------- */
  const actorOf = () => {
    if (state.stage <= 1 || state.stage === 4 || state.stage === 5) return 'client';
    if (state.stage === 6) return state.project.status === 'review' ? 'client' : state.project.status === 'done' ? 'none' : 'valeria';
    return 'valeria';
  };
  const actorTask = () => ({
    0: 'llenar el brief', 1: 'elegir un horario para la llamada', 2: 'hacer la llamada y confirmar el encaje', 3: 'ajustar y enviar la propuesta',
    4: 'revisar y firmar la propuesta', 5: 'pagar el anticipo', 6: state.project?.status === 'review' ? `revisar el avance de ${PHASES[state.project.phase]}` : `preparar el avance de ${PHASES[state.project?.phase || 0]}`
  }[state.stage]);

  function handoff() {
    const actor = actorOf();
    if (actor === 'none' || actor === state.view) return '';
    const other = actor === 'client' ? 'tu cliente' : 'Valeria';
    return `<div class="ap-handoff"><span class="ap-handoff-dot" aria-hidden="true"></span><p>Ahora le toca a <strong>${other}</strong>: ${actorTask()}.</p><button type="button" class="ap-mini-btn" data-action="view" data-to="${actor}">Ver lo que ve ${other} <span aria-hidden="true">→</span></button></div>`;
  }

  function proposalDoc({ preview = false } = {}) {
    const p = state.proposal;
    const lead = state.lead;
    const q = quote(p);
    const issued = state.proposal.sent ? state.now : state.now;
    let cursor = 0;
    const gantt = PHASES.map((phase, index) => {
      const span = Math.max(1, Math.round(q.weeks * PHASE_SHARE[index] * 10) / 10);
      const left = cursor; cursor += span;
      return { phase, left, span };
    });
    const totalSpan = cursor;
    const refs = lead.refs.trim();
    return `<article class="ap-doc${preview ? ' is-preview' : ''}" aria-label="Documento de propuesta">
      <header class="ap-doc-head">
        <div><span class="ap-doc-mark">Valeria Ríos<span>.</span></span><small>Estrategia de marca</small></div>
        <dl><div><dt>Propuesta</dt><dd>${proposalCode(p)}</dd></div><div><dt>Fecha</dt><dd>${fmtShortDate(issued)}</dd></div><div><dt>Válida hasta</dt><dd>${fmtShortDate(issued + 15 * 24 * 60 * MIN)}</dd></div></dl>
      </header>
      <h4 class="ap-doc-title">${esc(lead.brand)} <span>· ${esc(q.pkg.name)}</span></h4>
      <p class="ap-doc-for">Para ${esc(lead.name)} · ${esc(TYPES[lead.type].replace(/ \(.*\)/, ''))}</p>
      <section><h5><b>01</b> Lo que entendí</h5><p>${esc(firstName(lead.name))} quiere ${GOAL_PHRASE[lead.goal]} para ${esc(lead.brand)}${lead.deadline === 'urgente' ? ', con una fecha cercana' : lead.deadline === '1a2' ? ', con uno o dos meses de margen' : ', sin una fecha fija'}.${refs ? ` Sus referencias apuntan a «${esc(refs.replace(/[.\s]+$/, '').slice(0, 140))}${refs.length > 140 ? '…' : ''}».` : ''}${state.notes ? ` En la llamada acordamos: ${esc((state.notes.charAt(0).toLowerCase() + state.notes.slice(1)).replace(/[.\s]+$/, '').slice(0, 160))}.` : ''}</p></section>
      <section><h5><b>02</b> Alcance</h5><ul>${q.pkg.scope.map(item => `<li>${esc(item)}</li>`).join('')}${p.extras.map(key => `<li class="is-extra">${esc(EXTRAS[key].name)}</li>`).join('')}<li>${q.pkg.rounds} ${q.pkg.rounds === 1 ? 'ronda' : 'rondas'} de ajustes incluidas</li></ul></section>
      <section><h5><b>03</b> Cronograma · ${q.weeks} semanas</h5><div class="ap-gantt">${gantt.map(g => `<div class="ap-gantt-row"><span>${g.phase}</span><span class="ap-gantt-track"><span class="ap-fill" style="left:${(g.left / totalSpan) * 100}%;width:${(g.span / totalSpan) * 100}%"></span></span></div>`).join('')}</div></section>
      <section><h5><b>04</b> Inversión</h5><table class="ap-doc-table"><tbody>
        <tr><td>Paquete ${esc(q.pkg.name)}</td><td>${money(q.pkg.price)}</td></tr>
        ${p.extras.map(key => `<tr><td>${esc(EXTRAS[key].name)}</td><td>${money(EXTRAS[key].price)}</td></tr>`).join('')}
        ${q.urgency ? `<tr><td>Calendario prioritario (+15 %)</td><td>${money(q.urgency)}</td></tr>` : ''}
        ${q.discount ? `<tr><td>Ajuste acordado (−${p.discount} %)</td><td>−${money(q.discount)}</td></tr>` : ''}
        <tr class="is-total"><td>Total antes de IVA</td><td>${money(q.total)}</td></tr>
      </tbody></table><p class="ap-doc-terms">50 % para reservar la fecha de inicio (${money(q.deposit)}) y 50 % contra entrega. IVA del 19 % aparte.</p></section>
    </article>`;
  }

  function stepperHTML() {
    const done = state.stage === 6 && state.project?.status === 'done';
    return STAGES.map((stage, index) => {
      const status = done || index < state.stage ? 'done' : index === state.stage ? 'current' : 'next';
      return `<li class="is-${status}"${status === 'current' ? ' aria-current="step"' : ''}><span class="ap-step-dot" aria-hidden="true">${status === 'done' ? '✓' : index + 1}</span><span class="ap-step-text"><b>${stage.label}</b><small>${stage.hint}</small></span><span class="ap-sr">${status === 'done' ? '(completado)' : status === 'current' ? '(en curso)' : '(pendiente)'}</span></li>`;
    }).join('');
  }

  /* Vista del cliente */
  function clientScreen() {
    const lead = state.lead;
    switch (state.stage) {
      case 0: return briefForm();
      case 1: {
        const days = slotsFor(state.now);
        return `<div class="ap-mail">
          <div class="ap-mail-head"><span class="ap-avatar" aria-hidden="true">V</span><div><b>Valeria Ríos</b><small>para ${esc(lead.email)} · hace 1 min</small></div><span class="ap-chip ap-chip-auto">Respuesta automática</span></div>
          <h4>Gracias, ${esc(firstName(lead.name))}. Hablemos de ${esc(lead.brand)}.</h4>
          <p>Leí tu brief y me encantaría entender mejor lo que buscas. El siguiente paso es una llamada de 30 minutos, sin costo: elige el horario que te quede mejor y te llega la invitación al instante.</p>
        </div>
        <div class="ap-slots" role="group" aria-labelledby="ap-slots-title">
          <h4 id="ap-slots-title">Elige un horario <small>Hora de Colombia · videollamada de 30 min</small></h4>
          <div class="ap-days">${days.map(day => `<div class="ap-day"><b>${cap(new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(new Date(day.t)).replace('.', ''))}</b><small>${new Date(day.t).getDate()} ${new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(new Date(day.t)).replace('.', '')}</small>${day.slots.map(slot => `<button type="button" class="ap-slot" data-action="slot" data-t="${slot.t}" ${slot.busy ? 'disabled aria-label="' + slot.time + ', ocupado"' : `aria-label="${esc(fmtDay(slot.t))} a las ${slot.time}"`}>${slot.busy ? '—' : slot.time}</button>`).join('')}</div>`).join('')}</div>
          <p class="ap-fine">Los horarios ocupados vienen del calendario de Valeria (ejemplo).</p>
        </div>`;
      }
      case 2: return `${handoff()}<div class="ap-confirm">
          <span class="ap-confirm-icon" aria-hidden="true">✓</span>
          <h4>Tu llamada está confirmada</h4>
          <p class="ap-confirm-when">${cap(fmtDay(state.slot.t))} · ${new Date(state.slot.t).toTimeString().slice(0, 5)}</p>
          <p>Videollamada de 30 minutos con Valeria. El enlace llega a tu correo una hora antes.</p>
          <div class="ap-prep"><b>Para aprovecharla</b><ul><li>Piensa en tres marcas que admires y por qué.</li><li>Ten a mano lo que ya tienes: logo, fotos, textos.</li><li>Cuéntale a Valeria qué te haría decir «valió la pena».</li></ul></div>
          <p class="ap-fine">Recordatorios automáticos: 24 horas y 1 hora antes.</p>
        </div>`;
      case 3: return `${handoff()}<div class="ap-waiting">
          <div class="ap-waiting-ring" aria-hidden="true"></div>
          <h4>Tu propuesta está en camino</h4>
          <p>Valeria está convirtiendo lo que hablaron en un alcance concreto, con tiempos y precio. Te llegará por correo para revisarla y firmarla en línea.</p>
          <ol class="ap-mini-steps"><li class="is-done">Brief recibido</li><li class="is-done">Llamada hecha</li><li class="is-current">Propuesta en preparación</li><li>Firma y anticipo</li></ol>
        </div>`;
      case 4: return `<div class="ap-sign-layout">${proposalDoc()}
          <form class="ap-sign" id="ap-sign-form" novalidate>
            <h4>Aceptar la propuesta</h4>
            <p>Escribe tu nombre completo como firma. Recibirás una copia del documento firmado.</p>
            <label for="ap-sign-name">Nombre completo</label>
            <input id="ap-sign-name" name="name" type="text" maxlength="60" autocomplete="name" value="" placeholder="${esc(lead.name)}">
            <div class="ap-signature" aria-hidden="true"><span id="ap-signature-preview"></span><svg viewBox="0 0 220 24" preserveAspectRatio="none"><path d="M2 16 C 50 4, 90 24, 130 12 S 200 8, 218 14"/></svg></div>
            <label class="ap-check"><input type="checkbox" id="ap-sign-ok"> <span>Acepto el alcance, el cronograma y las condiciones de pago.</span></label>
            <button type="submit" class="ap-btn ap-btn-ink ap-btn-block" id="ap-sign-btn" disabled>Firmar y aceptar</button>
            <p class="ap-fine">Simulación: no se crea ninguna firma real.</p>
          </form></div>`;
      case 5: {
        const q = quote(state.proposal);
        const iva = Math.round(q.deposit * .19);
        return `<div class="ap-invoice">
          <header><div><span class="ap-doc-mark">Valeria Ríos<span>.</span></span><small>Factura de anticipo</small></div><div class="ap-invoice-num"><b>${invoiceCode(state.invoice)}</b><small>Vence en 5 días</small></div></header>
          <p class="ap-invoice-to">Para <b>${esc(lead.name)}</b> · ${esc(lead.brand)}</p>
          <table class="ap-doc-table"><tbody>
            <tr><td>Anticipo 50 % · Propuesta ${proposalCode(state.proposal)}</td><td>${money(q.deposit)}</td></tr>
            <tr><td>IVA 19 %</td><td>${money(iva)}</td></tr>
            <tr class="is-total"><td>Total a pagar</td><td>${money(q.deposit + iva)}</td></tr>
          </tbody></table>
          <fieldset class="ap-pay"><legend>Medio de pago</legend>
            <div class="ap-chips">${['PSE', 'Tarjeta', 'Transferencia'].map((m, i) => `<label class="ap-chip-radio"><input type="radio" name="ap-method" value="${m}"${i === 0 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</div>
          </fieldset>
          <button type="button" class="ap-btn ap-btn-ink ap-btn-block" data-action="pay">Pagar anticipo (simulado)</button>
          <p class="ap-fine">No se procesa ningún pago. El saldo se factura al entregar.</p>
        </div>`;
      }
      case 6: return clientProject();
      default: return '';
    }
  }

  function clientProject() {
    const pr = state.project;
    const progress = pr.status === 'done' ? 100 : Math.round(((pr.phase + (pr.status === 'review' ? .8 : .35)) / 4) * 100);
    const head = `<div class="ap-portal-head"><div><span class="ap-chip">Tu proyecto</span><h4>${esc(state.lead.brand)}</h4><p>${esc(PACKAGES[state.proposal.pkg].name)} · con Valeria Ríos</p></div><div class="ap-progress" style="--p:${progress}"><span>${progress}%</span></div></div>
      <ol class="ap-phases">${PHASES.map((phase, i) => `<li class="${pr.status === 'done' || i < pr.phase ? 'is-done' : i === pr.phase ? 'is-current' : ''}"><b>${phase}</b></li>`).join('')}</ol>`;
    if (pr.status === 'done') {
      return `${head}<div class="ap-delivered"><span class="ap-confirm-icon" aria-hidden="true">✓</span><h4>¡Tu marca está lista!</h4><p>Encontrarás los archivos finales y la guía de uso en tu carpeta compartida. La factura del saldo llegó a tu correo.</p><div class="ap-files">${['Guía de marca.pdf', 'Logotipos (SVG, PNG)', 'Paleta y tipografías', 'Plantillas editables'].map(f => `<span>${f}</span>`).join('')}</div></div>`;
    }
    if (pr.status === 'review') {
      const used = pr.rounds.reduce((a, b) => a + b, 0);
      const allowed = PACKAGES[state.proposal.pkg].rounds;
      return `${head}<div class="ap-review">
        <div class="ap-review-preview" data-phase="${pr.phase}" aria-hidden="true"><span></span><span></span><span></span><b>${esc(state.lead.brand)}</b></div>
        <div class="ap-review-copy"><span class="ap-chip ap-chip-sun">Nuevo avance</span><h4>${PHASES[pr.phase]}: ${PHASE_PREVIEW[pr.phase].toLowerCase()}</h4><p>Revísalo con calma. Puedes aprobarlo para seguir o pedir ajustes. Rondas usadas: ${used} de ${allowed}.</p>
          <form id="ap-feedback" novalidate><label for="ap-feedback-note">Comentarios para Valeria (opcional si apruebas)</label><textarea id="ap-feedback-note" maxlength="240" rows="3" placeholder="Por ejemplo: me gusta la segunda ruta, pero la quiero más cálida."></textarea><p class="ap-field-error" id="ap-feedback-error" hidden>Escribe qué te gustaría ajustar.</p>
          <div class="ap-review-actions"><button type="button" class="ap-btn ap-btn-ink" data-action="approve">Aprobar y seguir</button><button type="button" class="ap-btn ap-btn-ghost" data-action="changes">Pedir ajustes</button></div></form>
        </div></div>`;
    }
    return `${handoff()}${head}<div class="ap-waiting ap-waiting-inline"><div class="ap-waiting-ring" aria-hidden="true"></div><div><h4>Valeria está trabajando en ${PHASES[pr.phase]}</h4><p>Te avisaremos por correo cuando haya un avance para revisar.${pr.lastNote ? ` Tus últimos comentarios: «${esc(pr.lastNote)}».` : ''}</p></div></div>`;
  }

  function briefForm() {
    const want = wantedPackage;
    const chipGroup = (name, options, legend, hint) => `<fieldset class="ap-fieldset" data-field="${name}"><legend>${legend}${hint ? ` <small>${hint}</small>` : ''}</legend><div class="ap-chips">${Object.entries(options).map(([value, label]) => `<label class="ap-chip-radio"><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`).join('')}</div><p class="ap-field-error" id="ap-err-${name}" hidden>Elige una opción.</p></fieldset>`;
    return `<form class="ap-brief" id="ap-brief" novalidate>
      <div class="ap-brief-head"><div><span class="ap-chip">valeriarios.co/brief</span><h4>Cuéntame tu proyecto</h4><p>Cinco minutos. Con esto llego a nuestra llamada sabiendo de qué hablamos.</p></div><div class="ap-brief-progress" aria-hidden="true"><span id="ap-brief-bar"></span></div></div>
      <div class="ap-grid-2">
        <div class="ap-field"><label for="ap-name">Tu nombre</label><input id="ap-name" name="name" type="text" maxlength="60" autocomplete="name" required><p class="ap-field-error" id="ap-err-name" hidden>¿Cómo te llamas?</p></div>
        <div class="ap-field"><label for="ap-brand">Marca o proyecto</label><input id="ap-brand" name="brand" type="text" maxlength="60" autocomplete="organization" required><p class="ap-field-error" id="ap-err-brand" hidden>Escribe el nombre de tu marca o proyecto.</p></div>
        <div class="ap-field"><label for="ap-email">Correo</label><input id="ap-email" name="email" type="email" maxlength="90" autocomplete="email" required><p class="ap-field-error" id="ap-err-email" hidden>Revisa el correo.</p></div>
        <div class="ap-field"><label for="ap-type">Tipo de negocio</label><select id="ap-type" name="type">${Object.entries(TYPES).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
      </div>
      ${chipGroup('goal', GOALS, '¿Qué quieres lograr?')}
      ${chipGroup('budget', BUDGETS, 'Presupuesto aproximado', 'en pesos colombianos')}
      <p class="ap-smart" id="ap-smart" hidden></p>
      ${chipGroup('deadline', DEADLINES, '¿Para cuándo?')}
      <div class="ap-field"><label for="ap-refs">Referencias <small>marcas, colores o palabras que te inspiran</small></label><textarea id="ap-refs" name="refs" maxlength="280" rows="3" placeholder="Por ejemplo: sobria, cálida, con fotos de proceso y poco texto."></textarea></div>
      <div class="ap-field"><label for="ap-want">Paquete que te interesa <small>opcional</small></label><select id="ap-want" name="want"><option value="">Aún no lo sé</option>${Object.entries(PACKAGES).map(([v, p]) => `<option value="${v}"${v === want ? ' selected' : ''}>${p.name} · desde ${money(p.price)}</option>`).join('')}</select></div>
      <div class="ap-brief-actions"><button type="submit" class="ap-btn ap-btn-ink">Enviar brief <span aria-hidden="true">→</span></button><button type="button" class="ap-btn ap-btn-ghost" data-action="sample">Usar datos de ejemplo</button></div>
      <p class="ap-fine">Ejemplo: tus datos se quedan en este navegador.</p>
    </form>`;
  }

  /* Vista de Valeria */
  function scoreCard(lead) {
    const score = scoreLead(lead);
    const pkg = suggestPackage(lead);
    const r = 34; const c = 2 * Math.PI * r;
    return `<div class="ap-lead-card">
      <div class="ap-score" style="--c:${c};--o:${c * (1 - score.total / 100)}"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}"/><circle class="ap-score-fill" cx="40" cy="40" r="${r}"/></svg><b>${score.total}</b><small>de 100</small></div>
      <div class="ap-lead-main"><div class="ap-lead-top"><h4>${esc(lead.brand)}</h4><span class="ap-priority is-${score.level}">Prioridad ${score.level}</span></div><p>${esc(lead.name)} · ${esc(lead.email)}</p>
        <dl class="ap-lead-facts"><div><dt>Objetivo</dt><dd>${GOALS[lead.goal]}</dd></div><div><dt>Negocio</dt><dd>${esc(TYPES[lead.type].replace(/ \(.*\)/, ''))}</dd></div><div><dt>Presupuesto</dt><dd>${BUDGETS[lead.budget]}</dd></div><div><dt>Plazo</dt><dd>${DEADLINES[lead.deadline]}</dd></div></dl>
      </div>
      <div class="ap-bars">${score.parts.map(([label, pts, max]) => `<div><span>${label}</span><span class="ap-bar"><span class="ap-fill" style="--w:${(pts / max) * 100}%"></span></span><b>${pts}/${max}</b></div>`).join('')}</div>
      <p class="ap-suggest"><b>Sugerencia:</b> paquete ${PACKAGES[pkg].name} (desde ${money(PACKAGES[pkg].price)}).${lead.refs.trim() ? ` Referencias: «${esc(lead.refs.trim().slice(0, 110))}${lead.refs.trim().length > 110 ? '…' : ''}»` : ' Sin referencias: conviene preguntarlas en la llamada.'}</p>
    </div>`;
  }

  function inbox() {
    return `<div class="ap-inbox"><div class="ap-panel-title"><h4>Bandeja de solicitudes</h4><span class="ap-chip">Ejemplo</span></div>
      <div class="ap-inbox-empty"><span class="ap-waiting-ring" aria-hidden="true"></span><div><b>Esperando un brief nuevo</b><p>El formulario está publicado en la web de Valeria. Cuando alguien lo envía, aparece aquí ya calificado.</p></div></div>
      <ul class="ap-seeds">${SEEDS.map(seed => `<li><span class="ap-avatar is-soft" aria-hidden="true">${seed.name.charAt(0)}</span><div><b>${seed.name}</b><small>${seed.who} · ${PACKAGES[seed.pkg].name}</small></div><span class="ap-status is-${seed.status}">${SEED_STATUS[seed.status]}</span><span class="ap-seed-value">${money(seed.value)}</span></li>`).join('')}</ul></div>`;
  }

  function valeriaScreen() {
    const lead = state.lead;
    switch (state.stage) {
      case 0: return `${handoff()}${inbox()}`;
      case 1: return `${handoff()}<div class="ap-panel-title"><h4>Nuevo cliente potencial</h4><span class="ap-chip ap-chip-auto">Calificado automáticamente</span></div>${scoreCard(lead)}
        <details class="ap-auto-reply"><summary>Respuesta automática enviada <span>${fmtTime(state.now)}</span></summary><p>«Gracias, ${esc(firstName(lead.name))}. Leí tu brief y me encantaría entender mejor lo que buscas. Elige un horario para una llamada de 30 minutos…»</p></details>`;
      case 2: return `<div class="ap-panel-title"><h4>Llamada de descubrimiento</h4><span class="ap-chip">${cap(fmtDay(state.slot.t))} · ${new Date(state.slot.t).toTimeString().slice(0, 5)}</span></div>
        ${scoreCard(lead)}
        <form class="ap-call" id="ap-call-form" novalidate>
          <div class="ap-call-guide"><b>Guion sugerido</b><ol><li>¿Qué tiene que pasar para que este proyecto valga la pena?</li><li>¿Quién decide además de ti?</li><li>¿Qué te gusta y qué no de tus referencias?</li></ol></div>
          <div class="ap-field"><label for="ap-notes">Notas de la llamada <small>se suman a la propuesta</small></label><textarea id="ap-notes" maxlength="300" rows="3" placeholder="Por ejemplo: quiere estrenar marca en la feria de marzo; decide con su socia."></textarea></div>
          <button type="submit" class="ap-btn ap-btn-ink">Llamada hecha: generar propuesta <span aria-hidden="true">→</span></button>
        </form>`;
      case 3: return `<div class="ap-panel-title"><h4>Propuesta ${proposalCode(state.proposal)}</h4><span class="ap-chip ap-chip-auto">Borrador automático</span></div>
        <div class="ap-editor"><form class="ap-editor-form" id="ap-editor" novalidate>
          <fieldset class="ap-fieldset"><legend>Paquete</legend><div class="ap-chips ap-chips-stack">${Object.entries(PACKAGES).map(([v, p]) => `<label class="ap-chip-radio"><input type="radio" name="pkg" value="${v}"${state.proposal.pkg === v ? ' checked' : ''}><span>${p.name} <small>${money(p.price)}</small></span></label>`).join('')}</div></fieldset>
          <fieldset class="ap-fieldset"><legend>Extras</legend><div class="ap-checks">${Object.entries(EXTRAS).map(([v, x]) => `<label class="ap-check"><input type="checkbox" name="extras" value="${v}"${state.proposal.extras.includes(v) ? ' checked' : ''}> <span>${x.name} <small>+${money(x.price)}</small></span></label>`).join('')}</div></fieldset>
          <label class="ap-check ap-toggle"><input type="checkbox" name="urgent"${state.proposal.urgent ? ' checked' : ''}> <span>Calendario prioritario (+15 %)</span></label>
          <div class="ap-field"><label for="ap-discount">Ajuste de precio</label><select id="ap-discount" name="discount">${[0, 5, 10].map(d => `<option value="${d}"${state.proposal.discount === d ? ' selected' : ''}>${d ? `Descuento del ${d} %` : 'Sin ajuste'}</option>`).join('')}</select></div>
          <div class="ap-editor-total" id="ap-editor-total"></div>
          <button type="submit" class="ap-btn ap-btn-sun ap-btn-block">Enviar propuesta a ${esc(firstName(lead.name))} <span aria-hidden="true">↗</span></button>
        </form><div class="ap-editor-preview" id="ap-doc-slot">${proposalDoc({ preview: true })}</div></div>`;
      case 4: return `${handoff()}<div class="ap-panel-title"><h4>Seguimiento de la propuesta</h4><span class="ap-chip">${proposalCode(state.proposal)}</span></div>
        <ol class="ap-track"><li class="is-done"><b>Enviada</b><small>${money(quote(state.proposal).total)} antes de IVA</small></li><li class="is-done"><b>Abierta por ${esc(firstName(lead.name))}</b><small>Hace 12 minutos</small></li><li class="is-current"><b>Firma pendiente</b><small>Recordatorio automático en 3 días si no hay respuesta</small></li><li><b>Factura de anticipo</b><small>Se genera sola al firmar</small></li></ol>`;
      case 5: {
        const q = quote(state.proposal);
        return `${handoff()}<div class="ap-panel-title"><h4>Cobros</h4><span class="ap-chip ap-chip-auto">Factura enviada sola</span></div>
          <div class="ap-ledger"><div><small>Factura</small><b>${invoiceCode(state.invoice)}</b></div><div><small>Cliente</small><b>${esc(lead.brand)}</b></div><div><small>Valor con IVA</small><b>${money(Math.round(q.deposit * 1.19))}</b></div><div><small>Estado</small><b class="ap-status is-enviada">Pendiente</b></div></div>
          <ol class="ap-track"><li class="is-done"><b>Firmada por ${esc(state.signed.name)}</b><small>${fmtTime(state.signed.t)}</small></li><li class="is-done"><b>Factura enviada</b><small>50 % del total + IVA</small></li><li class="is-current"><b>Pago pendiente</b><small>Recordatorio amable programado en 3 días</small></li><li><b>Inicio del proyecto</b><small>Al confirmar el pago</small></li></ol>`;
      }
      case 6: return valeriaProject();
      default: return '';
    }
  }

  function valeriaProject() {
    const pr = state.project;
    const used = pr.rounds.reduce((a, b) => a + b, 0);
    const allowed = PACKAGES[state.proposal.pkg].rounds;
    const card = `<div class="ap-kcard"><b>${esc(state.lead.brand)}</b><small>${esc(PACKAGES[state.proposal.pkg].name)}</small><span class="ap-kcard-status is-${pr.status}">${pr.status === 'review' ? 'En revisión del cliente' : pr.status === 'done' ? 'Entregado' : pr.rounds[pr.phase] ? `Ajustes · ronda ${pr.rounds[pr.phase]}` : 'En trabajo'}</span></div>`;
    const board = `<div class="ap-board">${PHASES.map((phase, i) => `<div class="ap-col${i === pr.phase && pr.status !== 'done' ? ' is-active' : ''}${pr.status === 'done' || i < pr.phase ? ' is-done' : ''}"><h5>${phase}${pr.rounds[i] ? ` <small>${pr.rounds[i]} ${pr.rounds[i] === 1 ? 'ronda' : 'rondas'}</small>` : ''}</h5>${i === pr.phase && pr.status !== 'done' ? card : pr.status === 'done' || i < pr.phase ? '<span class="ap-col-done">✓ Aprobada</span>' : '<span class="ap-col-empty">Pendiente</span>'}${i === 3 && pr.status === 'done' ? card : ''}</div>`).join('')}</div>`;
    const top = `<div class="ap-panel-title"><h4>Proyecto ${esc(state.lead.brand)}</h4><span class="ap-chip">Rondas usadas ${used} de ${allowed}</span></div>`;
    if (pr.status === 'done') {
      const q = quote(state.proposal);
      const days = Math.max(1, Math.round((state.now - state.signed.t) / (24 * 60 * MIN)));
      return `${top}${board}<div class="ap-done-banner"><b>Proyecto entregado.</b> Factura de saldo generada y encuesta de cierre programada para dentro de 15 días.</div>
        <div class="ap-ledger"><div><small>De la firma a la entrega</small><b>${days} días</b></div><div><small>Facturado sin IVA</small><b>${money(q.total)}</b></div><div><small>Rondas de ajustes</small><b>${used} de ${allowed}</b></div><div><small>Mensajes manuales</small><b>Ninguno</b></div></div>`;
    }
    if (pr.status === 'review') return `${handoff()}${top}${board}`;
    return `${top}${board}<div class="ap-share">${pr.lastNote ? `<p class="ap-note-in"><b>Comentario del cliente:</b> «${esc(pr.lastNote)}»</p>` : ''}<p>Cuando el avance de <b>${PHASES[pr.phase]}</b> esté listo, compártelo: el cliente recibe un aviso y puede aprobar o pedir ajustes.</p><button type="button" class="ap-btn ap-btn-ink" data-action="share">Compartir avance de ${PHASES[pr.phase]} <span aria-hidden="true">↗</span></button></div>`;
  }

  function metricsHTML() {
    const q = state.proposal ? quote(state.proposal) : null;
    const sentNow = state.proposal?.sent ? 1 : 0;
    const signedNow = state.signed ? 1 : 0;
    const sent = SEEDS.length + sentNow;
    const accepted = SEEDS.filter(s => s.status === 'aceptada').length + signedNow;
    const delivered = state.project?.status === 'done';
    const pipeline = SEEDS.filter(s => s.status !== 'rechazada').reduce((sum, s) => sum + s.value, 0) + (sentNow && !delivered ? q.total : 0);
    const collected = SEEDS.filter(s => s.status === 'aceptada').reduce((sum, s) => sum + s.value / 2, 0) + (state.invoice?.paid ? q.deposit : 0) + (delivered ? q.total - q.deposit : 0);
    const rows = [
      ['Propuestas enviadas', sent, String(sent)],
      ['Aceptadas', accepted, `${accepted} <small>${Math.round((accepted / sent) * 100)} %</small>`],
      ['Valor en cartera', pipeline, money(pipeline)],
      ['Cobrado (sin IVA)', collected, money(collected)]
    ];
    return `<header><h3>Este mes</h3><span class="ap-chip">Datos de ejemplo</span></header><div class="ap-metric-grid">${rows.map(([label, , shown]) => `<div><small>${label}</small><b>${shown}</b></div>`).join('')}</div>`;
  }

  function logHTML() {
    if (!state.log.length) return '<li class="ap-log-empty">Aquí aparece cada paso automático: respuestas, recordatorios, facturas y avisos.</li>';
    return [...state.log].reverse().map((entry, index) => `<li class="who-${entry.who}${index < state.log.length - lastLogCount ? ' is-new' : ''}"><span class="ap-dot who-${entry.who}" aria-hidden="true"></span><div><small>${fmtTime(entry.t)} · ${entry.who === 'client' ? 'Cliente' : entry.who === 'auto' ? 'Automático' : 'Valeria'}</small><p>${esc(entry.text)}</p></div></li>`).join('');
  }

  /* ---------- Render ---------- */
  const screen = $('#ap-screen');
  let lastKey = '';
  function render() {
    $('#ap-stepper').innerHTML = stepperHTML();
    const progress = state.stage === 6 && state.project?.status === 'done' ? 1 : state.stage / (STAGES.length - 1);
    $('#ap-stepper').style.setProperty('--progress', progress);
    $('#ap-step-caption').textContent = `Etapa ${Math.min(state.stage + 1, 7)} de 7 · ${STAGES[state.stage].label}${state.stage === 6 && state.project?.status === 'done' ? ' (entregado)' : ''}`;
    $$('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === state.view)));
    const client = state.view === 'client';
    const frameTop = client
      ? `<div class="ap-frame-bar"><span class="ap-lights" aria-hidden="true"><span></span><span></span><span></span></span><span class="ap-url">${state.stage === 0 ? 'valeriarios.co/brief' : state.stage === 1 ? 'Correo · Bandeja de entrada' : state.stage >= 6 ? 'valeriarios.co/proyecto' : state.stage === 5 ? `valeriarios.co/factura/${invoiceCode(state.invoice).toLowerCase()}` : state.stage >= 4 ? `valeriarios.co/propuesta/${proposalCode(state.proposal).toLowerCase()}` : 'valeriarios.co'}</span><span class="ap-frame-tag">Vista del cliente</span></div>`
      : `<div class="ap-frame-bar is-studio"><span class="ap-studio-mark">V.</span><span class="ap-studio-tabs" aria-hidden="true">${['Solicitudes', 'Agenda', 'Propuestas', 'Cobros', 'Proyectos'].map((tab, i) => `<span class="${[0, 0, 1, 2, 2, 3, 4][state.stage] === i ? 'is-on' : ''}">${tab}</span>`).join('')}</span><span class="ap-frame-tag">Vista de Valeria</span></div>`;
    const key = `${state.view}-${state.stage}-${state.project?.phase ?? ''}-${state.project?.status ?? ''}`;
    screen.className = `ap-screen ${client ? 'is-client' : 'is-valeria'}`;
    screen.innerHTML = `${frameTop}<div class="ap-frame-body${key !== lastKey && !reduce ? ' ap-enter' : ''}">${client ? clientScreen() : valeriaScreen()}</div>`;
    lastKey = key;
    const metrics = $('#ap-metrics');
    metrics.hidden = client;
    if (!client) metrics.innerHTML = metricsHTML();
    $('#ap-log').innerHTML = logHTML();
    lastLogCount = state.log.length;
    bindScreen();
    save();
  }

  function bindScreen() {
    const brief = $('#ap-brief');
    if (brief) {
      const update = event => {
        updateBriefHints(brief);
        const field = event?.target;
        if (!field?.name) return;
        const value = String(field.value || '').trim();
        const ok = field.name === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) : field.type === 'radio' ? field.checked : value.length >= 2;
        const message = $(`#ap-err-${field.name}`);
        if (ok && message && !message.hidden) { message.hidden = true; if (field.type !== 'radio') field.setAttribute('aria-invalid', 'false'); }
      };
      brief.addEventListener('input', update);
      brief.addEventListener('change', update);
      update();
    }
    const editor = $('#ap-editor');
    if (editor) {
      const sync = () => {
        const data = new FormData(editor);
        state.proposal.pkg = Object.hasOwn(PACKAGES, data.get('pkg')) ? data.get('pkg') : state.proposal.pkg;
        state.proposal.extras = data.getAll('extras').filter(key => Object.hasOwn(EXTRAS, key));
        state.proposal.urgent = data.get('urgent') === 'on';
        state.proposal.discount = [0, 5, 10].includes(Number(data.get('discount'))) ? Number(data.get('discount')) : 0;
        $('#ap-doc-slot').innerHTML = proposalDoc({ preview: true });
        const q = quote(state.proposal);
        $('#ap-editor-total').innerHTML = `<span>Total antes de IVA</span><b>${money(q.total)}</b><small>${q.weeks} semanas · anticipo ${money(q.deposit)}</small>`;
        save();
      };
      editor.addEventListener('change', sync);
      sync();
    }
    const sign = $('#ap-sign-form');
    if (sign) {
      const input = $('#ap-sign-name');
      const ok = $('#ap-sign-ok');
      const update = () => {
        $('#ap-signature-preview').textContent = input.value.trim();
        $('#ap-sign-btn').disabled = !(input.value.trim().length >= 3 && ok.checked);
        sign.classList.toggle('has-sign', input.value.trim().length > 0);
      };
      input.addEventListener('input', update);
      ok.addEventListener('change', update);
    }
  }

  function updateBriefHints(form) {
    const data = new FormData(form);
    const filled = ['name', 'brand', 'email', 'goal', 'budget', 'deadline', 'refs'].filter(key => String(data.get(key) || '').trim()).length;
    $('#ap-brief-bar').style.setProperty('--w', `${(filled / 7) * 100}%`);
    const smart = $('#ap-smart');
    const budget = data.get('budget');
    if (budget) {
      const pkg = suggestPackage({ budget, want: data.get('want') || '' });
      const text = {
        menos2: 'Con este presupuesto, el punto de partida ideal es el paquete Esencial: ordena tu imagen antes de invertir más.',
        '2a4': 'Este rango encaja con el paquete Identidad, el más completo para verse a la altura de lo que haces.',
        '4a7': 'Con este rango podemos trabajar Estrategia + identidad, empezando por el posicionamiento.',
        mas7: 'Este rango permite Estrategia + identidad con extras como naming o dirección de fotografía.'
      }[budget];
      const want = data.get('want') || '';
      smart.hidden = false;
      smart.innerHTML = want && want === pkg
        ? `<span aria-hidden="true">✦</span> Elegiste el paquete ${PACKAGES[pkg].name} y encaja con tu presupuesto. Lo confirmamos en la llamada.`
        : `<span aria-hidden="true">✦</span> ${text} <b>Sugerido: ${PACKAGES[pkg].name}.</b>`;
    } else smart.hidden = true;
  }

  function readBrief(form) {
    const data = new FormData(form);
    const get = key => String(data.get(key) || '').trim();
    const lead = { name: get('name').slice(0, 60), brand: get('brand').slice(0, 60), email: get('email').slice(0, 90), goal: get('goal'), type: get('type'), budget: get('budget'), deadline: get('deadline'), refs: get('refs').slice(0, 280), want: get('want') };
    const errors = {
      name: lead.name.length < 2,
      brand: lead.brand.length < 2,
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email),
      goal: !Object.hasOwn(GOALS, lead.goal),
      budget: !Object.hasOwn(BUDGETS, lead.budget),
      deadline: !Object.hasOwn(DEADLINES, lead.deadline)
    };
    if (!Object.hasOwn(TYPES, lead.type)) lead.type = 'otro';
    if (!(lead.want === '' || Object.hasOwn(PACKAGES, lead.want))) lead.want = '';
    let first = null;
    Object.entries(errors).forEach(([key, bad]) => {
      const message = $(`#ap-err-${key}`);
      if (message) message.hidden = !bad;
      const field = form.querySelector(`[name="${key}"]`);
      if (field && field.type !== 'radio') field.setAttribute('aria-invalid', String(bad));
      if (bad && !first) first = field;
    });
    if (first) { first.focus(); return null; }
    return lead;
  }

  const SAMPLE = { name: 'Laura Méndez', brand: 'Brote Café', email: 'laura@brotecafe.co', type: 'producto', goal: 'lanzar', budget: '2a4', deadline: '1a2', refs: 'Sobria y cálida, con fotos del proceso del café, mucho blanco y poco texto.' };
  function fillSample(form) {
    Object.entries(SAMPLE).forEach(([key, value]) => {
      const fields = form.querySelectorAll(`[name="${key}"]`);
      fields.forEach(field => { if (field.type === 'radio') field.checked = field.value === value; else field.value = value; });
    });
    updateBriefHints(form);
  }

  /* ---------- Eventos ---------- */
  screen.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    if (form.id === 'ap-brief') {
      const lead = readBrief(form);
      if (lead) commit(actions.submitBrief, lead);
    } else if (form.id === 'ap-call-form') {
      commit(actions.callDone, $('#ap-notes').value.trim().slice(0, 300));
    } else if (form.id === 'ap-editor') {
      commit(actions.sendProposal);
    } else if (form.id === 'ap-sign-form') {
      const name = $('#ap-sign-name').value.trim().slice(0, 60);
      if (name.length >= 3 && $('#ap-sign-ok').checked) commit(actions.sign, name);
    }
  });
  screen.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'sample') fillSample($('#ap-brief'));
    else if (action === 'slot') { const t = Number(button.dataset.t); if (Number.isFinite(t)) commit(actions.pickSlot, t); }
    else if (action === 'pay') commit(actions.pay, ($('input[name="ap-method"]:checked') || { value: 'PSE' }).value);
    else if (action === 'share') commit(actions.share);
    else if (action === 'approve') commit(actions.approve);
    else if (action === 'changes') {
      const note = $('#ap-feedback-note');
      const text = note.value.trim().slice(0, 240);
      $('#ap-feedback-error').hidden = Boolean(text);
      note.setAttribute('aria-invalid', String(!text));
      if (!text) { note.focus(); return; }
      commit(actions.requestChanges, text);
    } else if (action === 'view') setView(button.dataset.to, true);
  });
  function setView(view, focusScreen = false) {
    if (!['client', 'valeria'].includes(view) || view === state.view) return;
    state.view = view;
    render();
    announce(view === 'client' ? 'Mostrando lo que ve tu cliente.' : 'Mostrando lo que ve Valeria.');
    if (focusScreen) $(`[data-view="${view}"]`).focus({ preventScroll: true });
  }
  $$('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));

  $('#ap-reset').addEventListener('click', () => {
    stopDemo();
    clearSaved();
    state = fresh();
    lastLogCount = 0;
    render();
    announce('Flujo reiniciado. Puedes empezar de nuevo desde el brief.');
  });

  /* ---------- Demostración automática ---------- */
  class Cancelled extends Error {}
  let demo = null;
  const demoBar = $('#ap-demo-bar');
  function setDemoUI(on, text) {
    $$('[data-demo-toggle]').forEach(button => {
      button.classList.toggle('is-running', on);
      button.setAttribute('aria-pressed', String(on));
      $('[data-demo-label]', button).textContent = on ? 'Detener demostración' : 'Ver el flujo completo';
    });
    demoBar.hidden = !on;
    if (text) $('#ap-demo-text').textContent = text;
    screen.classList.toggle('is-demo', on);
    screen.setAttribute('aria-busy', String(on));
  }
  function stopDemo() {
    if (!demo) return;
    demo.cancelled = true;
    demo = null;
    setDemoUI(false);
    $$('.ap-touch', screen).forEach(node => node.classList.remove('ap-touch'));
  }
  async function runDemo() {
    const token = { cancelled: false };
    demo = token;
    const wait = ms => new Promise((resolve, reject) => window.setTimeout(() => (token.cancelled ? reject(new Cancelled()) : resolve()), reduce ? Math.min(ms, 220) : ms));
    const need = selector => { if (token.cancelled) throw new Cancelled(); const node = $(selector, screen); if (!node) throw new Cancelled(); return node; };
    const touch = async node => {
      node.classList.add('ap-touch');
      node.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      await wait(520);
      node.classList.remove('ap-touch');
    };
    const type = async (selector, text) => {
      const field = need(selector);
      field.classList.add('ap-touch');
      if (reduce) field.value = text;
      else for (let i = 1; i <= text.length; i += 2) { field.value = text.slice(0, i + 1); field.dispatchEvent(new Event('input', { bubbles: true })); await wait(22); }
      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.classList.remove('ap-touch');
    };
    const pick = async selector => { const node = need(selector); await touch(node); node.click(); node.dispatchEvent(new Event('change', { bubbles: true })); };
    const step = (n, text) => { setDemoUI(true, `Paso ${n} de 9 · ${text}`); $('#ap-stepper').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' }); };
    try {
      state = fresh();
      lastLogCount = 0;
      render();
      setDemoUI(true, 'Preparando la demostración…');
      announce('La demostración reinicia el flujo desde el brief.');
      $('#flujo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      await wait(900);
      step(1, 'El cliente llena el brief');
      await type('#ap-name', SAMPLE.name);
      await type('#ap-brand', SAMPLE.brand);
      await type('#ap-email', SAMPLE.email);
      await pick('input[name="goal"][value="lanzar"]');
      await pick('input[name="budget"][value="2a4"]');
      await wait(700);
      await pick('input[name="deadline"][value="1a2"]');
      await type('#ap-refs', SAMPLE.refs);
      need('#ap-type').value = 'producto';
      await touch(need('#ap-brief button[type="submit"]'));
      need('#ap-brief').requestSubmit();
      step(2, 'Respuesta automática y agenda');
      await wait(1600);
      const slot = need('.ap-slot:not([disabled])');
      await touch(slot); slot.click();
      await wait(1300);
      step(3, 'Valeria ve el cliente calificado');
      setView('valeria');
      await wait(1500);
      await type('#ap-notes', 'Quiere abrir el local en dos meses; decide con su socio');
      await touch(need('#ap-call-form button[type="submit"]'));
      need('#ap-call-form').requestSubmit();
      step(4, 'Propuesta generada y ajustada');
      await wait(1400);
      await pick('input[name="extras"][value="redes"]');
      await wait(1100);
      await touch(need('#ap-editor button[type="submit"]'));
      need('#ap-editor').requestSubmit();
      await wait(900);
      step(5, 'El cliente firma en línea');
      setView('client');
      await wait(1300);
      await type('#ap-sign-name', SAMPLE.name);
      await pick('#ap-sign-ok');
      await touch(need('#ap-sign-btn'));
      need('#ap-sign-form').requestSubmit();
      step(6, 'Factura de anticipo y pago');
      await wait(1500);
      await touch(need('[data-action="pay"]'));
      need('[data-action="pay"]').click();
      await wait(1200);
      step(7, 'Proyecto en marcha');
      setView('valeria');
      for (let phase = 0; phase < 4; phase += 1) {
        await wait(1000);
        await touch(need('[data-action="share"]'));
        need('[data-action="share"]').click();
        await wait(700);
        setView('client');
        step(8, `El cliente revisa ${PHASES[phase]}`);
        await wait(1100);
        if (phase === 1) {
          await type('#ap-feedback-note', 'Me gusta la segunda ruta, pero la quiero un poco más cálida');
          await touch(need('[data-action="changes"]'));
          need('[data-action="changes"]').click();
          setView('valeria');
          await wait(900);
          await touch(need('[data-action="share"]'));
          need('[data-action="share"]').click();
          setView('client');
          await wait(1000);
        }
        await touch(need('[data-action="approve"]'));
        need('[data-action="approve"]').click();
        if (phase < 3) { setView('valeria'); step(7, `Valeria trabaja en ${PHASES[phase + 1]}`); }
      }
      step(9, 'Proyecto entregado');
      await wait(1400);
      setView('valeria');
      await wait(600);
    } catch (error) {
      if (!(error instanceof Cancelled)) throw error;
    } finally {
      if (demo === token) { demo = null; setDemoUI(false); }
    }
  }
  $$('[data-demo-toggle]').forEach(button => button.addEventListener('click', () => {
    if (demo) { stopDemo(); announce('Demostración detenida. Puedes seguir desde aquí.'); return; }
    runDemo();
  }));

  render();
})();
