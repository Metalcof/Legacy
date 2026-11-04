'use strict';
// WAV ops — un pedido de la tienda dispara pago, inventario, factura, guía, avisos y métricas.
// Todo es de ejemplo y vive en este navegador (localStorage), no se cobra ni se envía nada.
(() => {
  const studio = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Nexo Studio';
  document.querySelectorAll('[data-brand]').forEach((element) => { element.textContent = studio; });
  document.title = document.title.replace('Nexo Studio', studio);

  const KEY = 'nexo-auto-tienda-v1';
  const PRICE = 349900;
  const THRESHOLD = 5;
  const TARGET = 20;
  const MAX_QTY = 3;
  const FLOW_DONE = 7;
  const finishes = {
    lavanda: { name: 'Lavanda', tile: '#afa0d7' },
    grafito: { name: 'Grafito', tile: '#6a6a73' },
    lima: { name: 'Lima', tile: '#c9de84' },
  };
  const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira', 'Cartagena', 'Manizales'];
  const people = [['Laura Gómez', 'Medellín'], ['Camila Ortiz', 'Cali'], ['Julián Mora', 'Barranquilla'], ['Valentina Rojas', 'Bucaramanga'], ['Daniel Herrera', 'Pereira']];
  const pays = { tarjeta: 'Tarjeta', pse: 'PSE', nequi: 'Nequi' };
  const statuses = ['nuevo', 'pagado', 'empacado', 'en-camino', 'entregado'];
  const statusLabel = { nuevo: 'Procesando', pagado: 'Pagado', empacado: 'Empacado', 'en-camino': 'En camino', entregado: 'Entregado' };
  const nextAction = { pagado: ['empacado', 'Marcar empacado'], empacado: ['en-camino', 'Entregar a transportadora'], 'en-camino': ['entregado', 'Confirmar entrega'] };
  const nodes = ['pedido', 'pago', 'inventario', 'factura', 'guia', 'avisos', 'metricas'];

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const now = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const first = (name) => String(name).trim().split(/\s+/)[0];
  const img = (color) => `../assets/headphones-${color}.webp`;
  const units = (n) => `${n} ${n === 1 ? 'unidad' : 'unidades'}`;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const tracking = () => `WV ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} CO`;

  /* Estado ------------------------------------------------------------- */
  function seed() {
    return {
      v: 1, seq: 1043, inv: 2188, oc: 311, logN: 6, view: 'team', selected: 'WAV-1042',
      stock: { lavanda: 12, grafito: 9, lima: 6 },
      orders: [
        { id: 'WAV-1040', name: 'Andrés Ruiz', city: 'Bogotá', color: 'grafito', qty: 1, pay: 'tarjeta', invoice: 'FE-2185', tracking: 'WV 3907 1152 CO', status: 'entregado', flow: FLOW_DONE, times: { pagado: '08:12', empacado: '08:40', 'en-camino': '10:05', entregado: '12:31' } },
        { id: 'WAV-1041', name: 'Mariana López', city: 'Medellín', color: 'lavanda', qty: 2, pay: 'pse', invoice: 'FE-2186', tracking: 'WV 5521 0846 CO', status: 'en-camino', flow: FLOW_DONE, times: { pagado: '09:26', empacado: '09:58', 'en-camino': '11:20' } },
        { id: 'WAV-1042', name: 'Sebastián Díaz', city: 'Cali', color: 'lima', qty: 1, pay: 'nequi', invoice: 'FE-2187', tracking: 'WV 7740 2319 CO', status: 'empacado', flow: FLOW_DONE, times: { pagado: '10:47', empacado: '11:15' } },
      ],
      log: [
        { n: 6, t: '11:20', type: 'msg', text: 'WhatsApp y correo a Mariana: WAV-1041 va en camino.' },
        { n: 5, t: '11:15', type: 'msg', text: 'WhatsApp a Sebastián: su pedido WAV-1042 está empacado.' },
        { n: 4, t: '11:15', type: 'ship', text: 'WAV-1042 empacado. Etiqueta WV 7740 2319 CO lista para imprimir.' },
        { n: 3, t: '10:47', type: 'stock', text: 'Inventario Lima: 7 → 6.' },
        { n: 2, t: '10:47', type: 'pay', text: 'Pago confirmado por Nequi · WAV-1042 · $ 349.900.' },
        { n: 1, t: '08:12', type: 'pay', text: 'Pago confirmado por tarjeta · WAV-1040 · $ 349.900.' },
      ],
    };
  }
  const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const isStr = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max;
  function validOrder(o) {
    if (!o || typeof o !== 'object') return false;
    if (!/^WAV-\d{3,6}$/.test(o.id) || !isStr(o.name, 40) || !isStr(o.city, 40) || !finishes[o.color] || !isInt(o.qty, 1, MAX_QTY) || !pays[o.pay]) return false;
    if (!statuses.includes(o.status) || !isInt(o.flow, 0, FLOW_DONE) || !o.times || typeof o.times !== 'object') return false;
    if ((o.invoice != null && !isStr(o.invoice, 12)) || (o.tracking != null && !isStr(o.tracking, 24))) return false;
    return Object.entries(o.times).every(([k, v]) => statuses.includes(k) && /^\d{2}:\d{2}$/.test(v));
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return seed();
      const s = JSON.parse(raw);
      const ok = s && s.v === 1 && isInt(s.seq, 1, 999999) && isInt(s.inv, 1, 999999) && isInt(s.oc, 1, 999999) && isInt(s.logN, 0, 1e7)
        && s.stock && Object.keys(finishes).every((c) => isInt(s.stock[c], 0, 999))
        && Array.isArray(s.orders) && s.orders.length <= 40 && s.orders.every(validOrder)
        && Array.isArray(s.log) && s.log.length <= 60 && s.log.every((l) => l && isInt(l.n, 0, 1e7) && /^\d{2}:\d{2}$/.test(l.t) && typeof l.type === 'string' && isStr(l.text, 220))
        && ['team', 'client'].includes(s.view);
      if (!ok) return seed();
      if (!s.orders.some((o) => o.id === s.selected)) s.selected = s.orders.length ? s.orders[s.orders.length - 1].id : null;
      s.orders.forEach((o) => { while (o.flow < FLOW_DONE) runStep(s, o, o.flow, true); });
      return s;
    } catch (_) { return seed(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* La demo sigue funcionando sin almacenamiento. */ }
  }
  function addLog(s, type, text) {
    s.logN += 1;
    s.log.unshift({ n: s.logN, t: now(), type, text });
    s.log.length = Math.min(s.log.length, 40);
  }
  const lowFinishes = (s) => Object.keys(finishes).filter((c) => s.stock[c] < THRESHOLD);

  // Cada paso del flujo automático. Se usa animado al recibir un pedido y de una vez al recargar a mitad de camino.
  function runStep(s, o, step) {
    const f = finishes[o.color].name;
    const total = money(PRICE * o.qty);
    if (step === 0) {
      addLog(s, 'order', `Pedido ${o.id} recibido: ${o.name}, ${o.city} · Wave One ${f} × ${o.qty}.`);
    } else if (step === 1) {
      o.status = 'pagado';
      o.times.pagado = o.times.pagado || now();
      addLog(s, 'pay', `Pago confirmado por ${pays[o.pay]} · ${o.id} · ${total}.`);
    } else if (step === 2) {
      const before = s.stock[o.color];
      s.stock[o.color] = Math.max(0, before - o.qty);
      addLog(s, 'stock', `Inventario ${f}: ${before} → ${s.stock[o.color]}.`);
      if (s.stock[o.color] < THRESHOLD) addLog(s, 'alert', `Stock bajo de ${f} (${s.stock[o.color]}). Sugerencia: pedir ${TARGET - s.stock[o.color]} unidades al proveedor.`);
    } else if (step === 3) {
      o.invoice = `FE-${s.inv}`;
      s.inv += 1;
      addLog(s, 'doc', `Factura electrónica ${o.invoice} generada y enviada a ${first(o.name)} por correo.`);
    } else if (step === 4) {
      o.tracking = tracking();
      addLog(s, 'ship', `Guía ${o.tracking} creada con transportadora nacional.`);
    } else if (step === 5) {
      addLog(s, 'msg', `WhatsApp y correo a ${first(o.name)}: pago confirmado, pedido ${o.id}.`);
    }
    o.flow = Math.max(o.flow, step + 1);
  }

  let state = load();
  save();

  /* Formulario --------------------------------------------------------- */
  const form = $('ops-form');
  const nameInput = $('ops-name');
  const citySelect = $('ops-city');
  const qtyOut = $('ops-qty');
  const formMsg = $('ops-form-msg');
  const submit = $('ops-submit');
  let qty = 1;
  let personIndex = 0;
  citySelect.innerHTML = cities.map((c) => `<option>${esc(c)}</option>`).join('');
  $('ops-people').innerHTML = people.map(([n, c], i) => `<button type="button" data-person="${i}" aria-pressed="${i === 0}" aria-label="${esc(n)}, ${esc(c)}">${esc(first(n))} · ${esc(c)}</button>`).join('');
  $('ops-finishes').innerHTML = Object.entries(finishes).map(([key, f], i) => `<label class="ops-finish"><input type="radio" name="color" value="${key}"${i === 0 ? ' checked' : ''}><img src="${img(key)}" alt="" width="54" height="54"><b>${f.name}</b><small data-stock-label="${key}"></small></label>`).join('');
  $('ops-pay').innerHTML = Object.entries(pays).map(([key, label], i) => `<label><input type="radio" name="pay" value="${key}"${i === 0 ? ' checked' : ''}>${label}</label>`).join('');
  $('ops-threshold').textContent = THRESHOLD;
  function choosePerson(index) {
    personIndex = index;
    const [n, c] = people[index];
    nameInput.value = n;
    citySelect.value = c;
    document.querySelectorAll('[data-person]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.person) === index)));
  }
  choosePerson(0);
  document.querySelectorAll('[data-person]').forEach((b) => b.addEventListener('click', () => choosePerson(Number(b.dataset.person))));
  nameInput.addEventListener('input', () => document.querySelectorAll('[data-person]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.person) === personIndex && nameInput.value.trim() === people[personIndex][0]))));
  const selectedColor = () => form.querySelector('input[name="color"]:checked').value;
  function setQty(value) {
    qty = Math.min(MAX_QTY, Math.max(1, value));
    qtyOut.textContent = qty;
    form.querySelector('[data-qty="-1"]').disabled = qty <= 1;
    form.querySelector('[data-qty="1"]').disabled = qty >= MAX_QTY;
    $('ops-total').textContent = money(PRICE * qty);
  }
  form.querySelectorAll('[data-qty]').forEach((b) => b.addEventListener('click', () => setQty(qty + Number(b.dataset.qty))));
  setQty(1);
  form.addEventListener('change', () => { formMsg.textContent = ''; });
  function renderFormStock() {
    Object.keys(finishes).forEach((c) => {
      const label = form.querySelector(`[data-stock-label="${c}"]`);
      const n = state.stock[c];
      label.textContent = n === 0 ? 'Agotado' : `${n} disponibles`;
      label.className = n === 0 ? 'is-out' : n < THRESHOLD ? 'is-low' : '';
    });
  }

  /* Render ------------------------------------------------------------- */
  const selectedOrder = () => state.orders.find((o) => o.id === state.selected) || null;
  const counted = () => state.orders.filter((o) => o.flow >= FLOW_DONE);
  const shownStock = {};
  let seenLog = state.logN;
  let freshOrder = null;
  let docKeys = { invoice: '', label: '' };
  let chatCount = { id: null, n: 0 };

  function renderKpis(bump = false) {
    const list = counted();
    const sales = list.reduce((sum, o) => sum + PRICE * o.qty, 0);
    const unitsSold = list.reduce((sum, o) => sum + o.qty, 0);
    const pending = list.filter((o) => o.status === 'pagado' || o.status === 'empacado').length;
    const tiles = [
      ['Ventas del día', money(sales), 'IVA incluido'],
      ['Pedidos', String(list.length), `${pending} por despachar`],
      ['Ticket promedio', money(list.length ? Math.round(sales / list.length) : 0), 'ventas ÷ pedidos'],
      ['Unidades', String(unitsSold), 'Wave One vendidos'],
    ];
    $('ops-kpis').innerHTML = tiles.map(([k, v, s]) => `<div class="ops-kpi${bump ? ' is-bump' : ''}"><span>${k}</span><strong>${v}</strong><small>${s}</small></div>`).join('');
    $('ops-pending').textContent = `${list.length} pedidos · ${pending} por despachar`;
  }
  function renderStock() {
    const max = Math.max(TARGET, ...Object.values(state.stock));
    $('ops-stock').innerHTML = Object.entries(finishes).map(([c, f]) => {
      const n = state.stock[c];
      const changed = shownStock[c] !== undefined && shownStock[c] !== n;
      return `<div class="ops-stock-row${n < THRESHOLD ? ' is-low' : ''}" style="--tile:${f.tile}"><img src="${img(c)}" alt="" width="44" height="44"><div><b>${f.name}<small>${n < THRESHOLD ? (n === 0 ? 'Agotado' : 'Stock bajo') : 'Disponible'}</small></b><div class="ops-bar" role="img" aria-label="${f.name}: ${n} de ${max} unidades"><i style="transform:scaleX(${(n / max).toFixed(3)})"></i><u style="left:${(THRESHOLD / max) * 100}%"></u></div></div><span class="ops-stock-num${changed ? ' is-tick' : ''}">${n}</span></div>`;
    }).join('');
    Object.keys(finishes).forEach((c) => { shownStock[c] = state.stock[c]; });
    const low = lowFinishes(state);
    const box = $('ops-restock');
    box.hidden = !low.length;
    box.innerHTML = low.map((c) => `<p><b>Reposición sugerida:</b> ${TARGET - state.stock[c]} unidades de Wave One ${finishes[c].name} para volver a ${TARGET}. Quedan ${state.stock[c]}.</p><button type="button" class="ops-btn" data-restock="${c}">Aprobar orden de compra · ${finishes[c].name}</button>`).join('<hr style="border:0;border-top:1px solid #ffb35c33;margin:14px 0">');
    renderFormStock();
  }
  function renderChart() {
    const list = counted();
    const per = Object.fromEntries(Object.keys(finishes).map((c) => [c, list.filter((o) => o.color === c).reduce((s, o) => s + o.qty, 0)]));
    const max = Math.max(4, ...Object.values(per));
    $('ops-chart').innerHTML = Object.entries(finishes).map(([c, f]) => `<div class="ops-col" style="--tile:${f.tile}"><strong>${per[c]}</strong><div class="ops-col-track" role="img" aria-label="${f.name}: ${units(per[c])}"><i style="transform:scaleY(${(per[c] / max).toFixed(3)})"></i></div><span>${f.name}</span></div>`).join('');
  }
  function renderOrders() {
    const rows = [...state.orders].reverse().map((o) => {
      const f = finishes[o.color];
      const next = o.flow >= FLOW_DONE && nextAction[o.status];
      const action = next ? `<button type="button" class="ops-next" data-advance="${o.id}">${next[1]}</button>` : `<span class="ops-done">${o.status === 'entregado' ? `Entregado ${o.times.entregado}` : 'Automatizando…'}</span>`;
      return `<div class="ops-order-row${o.id === state.selected ? ' is-selected' : ''}${o.id === freshOrder ? ' is-new' : ''}" style="--tile:${f.tile}"><button type="button" class="ops-order-pick" data-pick="${o.id}" aria-label="Ver ${o.id} de ${esc(o.name)}" aria-pressed="${o.id === state.selected}"></button><img src="${img(o.color)}" alt="" width="44" height="44"><div class="ops-order-main"><b>${o.id} · ${esc(o.name)}</b><span>${f.name} × ${o.qty} · ${esc(o.city)} · ${money(PRICE * o.qty)}</span></div><span class="ops-pill" data-s="${o.status}">${statusLabel[o.status]}</span>${action}</div>`;
    });
    $('ops-orders').innerHTML = rows.join('');
    freshOrder = null;
  }
  function barcode(text) {
    let x = 0;
    let bars = '';
    const digits = text.replace(/\D/g, '') + '07';
    for (let i = 0; i < digits.length; i += 1) {
      const d = Number(digits[i]);
      [1 + (d % 3), 1 + ((d + i) % 2), 2 + ((d * 7) % 3)].forEach((w, k) => {
        if (k !== 1) bars += `<rect x="${x}" y="0" width="${w}" height="50"/>`;
        x += w + 1;
      });
    }
    return `<svg class="ops-barcode" viewBox="0 0 ${x} 50" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="2" height="50"/>${bars}</svg>`;
  }
  function renderDocs() {
    const o = selectedOrder();
    const inv = $('ops-invoice');
    const label = $('ops-label');
    if (!o) { inv.innerHTML = '<p class="ops-empty-doc">Sin pedido seleccionado.</p>'; label.innerHTML = ''; return; }
    const total = PRICE * o.qty;
    const base = Math.round(total / 1.19);
    const invKey = `${o.id}-${o.flow >= 4}`;
    inv.innerHTML = o.flow >= 4 ? `<div class="ops-doc-top"><div><span class="ops-doc-kicker">Vista previa · ejemplo</span><div class="ops-doc-brand">wav<span>.</span></div></div><div class="ops-doc-meta"><b>Factura electrónica ${esc(o.invoice)}</b>Pedido ${o.id} · hoy ${o.times.pagado || ''}<br>Cliente: ${esc(o.name)}</div></div><dl><div><dt>Wave One ${finishes[o.color].name} × ${o.qty}</dt><dd>${money(total)}</dd></div><div><dt>Base gravable</dt><dd>${money(base)}</dd></div><div><dt>IVA 19 %</dt><dd>${money(total - base)}</dd></div><div><dt>Envío</dt><dd>Gratis</dd></div><div class="ops-inv-total"><dt>Total pagado · ${pays[o.pay]}</dt><dd>${money(total)}</dd></div></dl><p class="ops-doc-foot">Documento de ejemplo sin validez fiscal. En un proyecto real se emite con tu proveedor de facturación electrónica.</p>`
      : '<p class="ops-empty-doc">Generando factura…</p>';
    if (docKeys.invoice !== invKey) { inv.classList.remove('is-fresh'); void inv.offsetWidth; inv.classList.add('is-fresh'); docKeys.invoice = invKey; }
    const labelKey = `${o.id}-${o.flow >= 5}`;
    label.innerHTML = o.flow >= 5 ? `<div class="ops-doc-top" style="border:0;padding:0"><div><span class="ops-doc-kicker">Guía de envío · ejemplo</span><div class="ops-doc-brand">wav<span>.</span></div></div><div class="ops-doc-meta"><b>Transportadora nacional</b>${o.qty} paquete · ${(0.6 * o.qty).toFixed(1).replace('.', ',')} kg</div></div><div class="ops-label-grid"><div><small>Remite</small><b>WAV</b>Bodega Bogotá</div><div><small>Destino</small><span class="ops-label-city">${esc(o.city)}</span>${esc(o.name)}</div></div>${barcode(o.tracking)}<p class="ops-track-num">${esc(o.tracking)}</p><p class="ops-doc-foot" style="margin-top:auto">Pedido ${o.id} · Wave One ${finishes[o.color].name} × ${o.qty}. Etiqueta de ejemplo, no corresponde a un envío real.</p>`
      : '<p class="ops-empty-doc">Creando guía…</p>';
    if (docKeys.label !== labelKey) { label.classList.remove('is-fresh'); void label.offsetWidth; label.classList.add('is-fresh'); docKeys.label = labelKey; }
  }
  function messagesFor(o) {
    if (!o || o.flow < 6) return [];
    const f = finishes[o.color].name;
    const list = [];
    if (o.times.pagado) list.push([o.times.pagado, `Hola ${esc(first(o.name))}, recibimos tu pago de ${money(PRICE * o.qty)} por Wave One ${f} × ${o.qty}. Tu pedido es ${o.id}. Te avisamos cuando lo empaquemos.`, `Confirmación de tu pedido ${o.id}`, `Factura ${esc(o.invoice)} adjunta`]);
    if (o.times.empacado) list.push([o.times.empacado, `Tu Wave One ${f} ya está empacado y listo para salir de bodega.`, null, null]);
    if (o.times['en-camino']) list.push([o.times['en-camino'], `Va en camino. Guía ${esc(o.tracking)} con transportadora nacional. Llega a ${esc(o.city)} en 2 a 3 días hábiles.`, 'Tu pedido va en camino', `Sigue la guía ${esc(o.tracking)}`]);
    if (o.times.entregado) list.push([o.times.entregado, `Entregado en ${esc(o.city)}. Que lo disfrutes. Si algo no está bien, responde este mensaje y te ayudamos.`, 'Pedido entregado', 'Tienes 30 días para devoluciones']);
    return list;
  }
  function renderClient() {
    const o = selectedOrder();
    const track = $('ops-track');
    if (!o) { track.innerHTML = ''; $('ops-chat').innerHTML = ''; $('ops-mail').innerHTML = ''; return; }
    const f = finishes[o.color];
    const reached = statuses.indexOf(o.status);
    const steps = [['pagado', 'Pagado', 'Recibimos tu pago'], ['empacado', 'Empacado', 'Listo en bodega'], ['en-camino', 'En camino', 'Con la transportadora'], ['entregado', 'Entregado', `En ${esc(o.city)}`]];
    const title = { nuevo: 'Confirmando tu pago…', pagado: 'Pago recibido. Lo estamos preparando.', empacado: 'Tu pedido está empacado.', 'en-camino': 'Tu pedido va en camino.', entregado: 'Tu pedido fue entregado.' }[o.status];
    track.innerHTML = `<div class="tk-top"><div class="ops-doc-brand">wav<span>.</span></div><small>Seguimiento</small></div><div class="tk-hero"><p>Hola ${esc(first(o.name))} · ${o.id}</p><h4>${title}</h4><div class="tk-prod" style="--tile:${f.tile}"><img src="${img(o.color)}" alt="" width="52" height="52"><div><b>Wave One ${f.name}</b><span>${units(o.qty)} · ${money(PRICE * o.qty)}</span></div></div></div><div class="tk-body"><ol class="tk-steps">${steps.map(([k, label, sub], i) => { const done = reached >= i + 1; return `<li class="${done ? 'is-done' : ''}${reached === i + 1 ? ' is-current' : ''}"><span class="tk-dot" aria-hidden="true">✓</span><div><b>${label}</b><span>${done ? `${o.times[k] || ''} · ${sub}` : 'Pendiente'}</span></div></li>`; }).join('')}</ol>${o.flow >= 5 ? `<div class="tk-card"><small>Número de guía</small><b>${esc(o.tracking)}</b></div>` : ''}<div class="tk-card"><small>Entrega estimada</small><b style="font-family:inherit;letter-spacing:0">${o.status === 'entregado' ? `Entregado hoy, ${o.times.entregado}` : `2 a 3 días hábiles · ${esc(o.city)}`}</b></div><p class="tk-help">¿Dudas? Responde al WhatsApp de WAV.</p></div>`;
    const msgs = messagesFor(o);
    const prev = chatCount.id === o.id ? chatCount.n : msgs.length;
    $('ops-chat').innerHTML = msgs.length ? msgs.map(([t, text], i) => `<p class="ops-bubble${i >= prev ? ' is-new' : ''}">${text}<time>${t}</time></p>`).join('') : '<p class="ops-chat-empty">Los mensajes aparecen cuando el pago se confirma.</p>';
    chatCount = { id: o.id, n: msgs.length };
    const chat = $('ops-chat');
    chat.scrollTop = chat.scrollHeight;
    const mails = msgs.filter((m) => m[2]).reverse();
    $('ops-mail').innerHTML = mails.length ? mails.map(([t, , subject, preview], i) => `<li${i === 0 && msgs.length > prev ? ' class="is-new"' : ''}><i aria-hidden="true">w.</i><div><b>${subject}</b><span>WAV · ${preview}</span></div><time>${t}</time></li>`).join('') : '<li class="ops-mail-empty">Todavía no hay correos.</li>';
  }
  const logIcons = {
    order: '<path d="M5 7h14l-1.2 12H6.2L5 7Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    pay: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    stock: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/>',
    restock: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 9v6M9 12h6"/>',
    alert: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
    block: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>',
    doc: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/>',
    ship: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/>',
    msg: '<path d="M4 5h16v11H9l-5 4z"/>',
  };
  function renderLog() {
    $('ops-log').innerHTML = state.log.map((l) => `<li data-type="${esc(l.type)}"${l.n > seenLog ? ' class="is-new"' : ''}><span class="ops-log-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${logIcons[l.type] || logIcons.order}</svg></span><p class="ops-log-text" style="margin:0">${esc(l.text)}<time>${l.t}</time></p></li>`).join('');
    seenLog = state.logN;
    $('ops-log').scrollTop = 0;
  }
  function renderRail(active = -1, done = -1) {
    const rail = $('ops-rail');
    rail.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('is-active', i === active);
      li.classList.toggle('is-done', i <= done && i !== active);
    });
    const reach = Math.max(active, done);
    rail.style.setProperty('--progress', reach < 0 ? 0 : (reach / (nodes.length - 1)).toFixed(3));
    if (active >= 0 && rail.scrollWidth > rail.clientWidth + 4) {
      const li = rail.children[active];
      rail.scrollTo({ left: li.offsetLeft - (rail.clientWidth - li.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
    }
  }
  function setView(view) {
    state.view = view;
    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    $('view-team').hidden = view !== 'team';
    $('view-client').hidden = view !== 'client';
    save();
  }
  function renderAll(bump = false) {
    renderKpis(bump);
    renderStock();
    renderChart();
    renderOrders();
    renderDocs();
    renderClient();
    renderLog();
  }
  const announce = (text) => { const el = $('ops-announce'); el.textContent = ''; window.setTimeout(() => { el.textContent = text; }, 40); };

  /* Flujo ---------------------------------------------------------------- */
  let busy = false;
  let runToken = 0;
  const timers = new Set();
  const wait = (ms) => new Promise((resolve) => { const t = window.setTimeout(() => { timers.delete(t); resolve(); }, ms); timers.add(t); });
  function setBusy(value) {
    busy = value;
    submit.disabled = value;
    submit.classList.toggle('is-running', value);
    submit.firstChild.textContent = value ? 'Automatizando… ' : 'Recibir pedido ';
  }

  async function placeOrder(data) {
    if (busy) return null;
    const token = runToken;
    formMsg.textContent = '';
    const name = data.name.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (name.length < 2) { formMsg.textContent = 'Escribe el nombre del cliente para crear el pedido.'; nameInput.focus(); return null; }
    if (state.stock[data.color] < data.qty) {
      const f = finishes[data.color].name;
      formMsg.textContent = `${state.stock[data.color] === 0 ? `No quedan unidades de ${f}` : `Solo ${state.stock[data.color] === 1 ? 'queda 1' : `quedan ${state.stock[data.color]}`} de ${f}`}. El pedido no se crea para no vender lo que no hay: aprueba la reposición sugerida.`;
      addLog(state, 'block', `Pedido bloqueado: ${name} pidió ${data.qty} × ${f} y quedan ${state.stock[data.color]}.`);
      save(); renderLog(); renderStock();
      return null;
    }
    setBusy(true);
    const order = { id: `WAV-${state.seq}`, name, city: data.city, color: data.color, qty: data.qty, pay: data.pay, invoice: null, tracking: null, status: 'nuevo', flow: 0, times: {} };
    state.seq += 1;
    state.orders.push(order);
    if (state.orders.length > 30) state.orders.shift();
    state.selected = order.id;
    freshOrder = order.id;
    form.classList.remove('is-flash'); void form.offsetWidth; form.classList.add('is-flash');
    const pause = reduced() ? 380 : 720;
    for (let step = 0; step < nodes.length; step += 1) {
      if (token !== runToken) return null;
      renderRail(step, step - 1);
      if (step < 6) runStep(state, order, step);
      else order.flow = FLOW_DONE;
      save();
      if (step === 6) renderAll(true); else { renderStock(); renderOrders(); renderDocs(); renderClient(); renderLog(); }
      if (step === 1) announce(`Pedido ${order.id} recibido y pagado.`);
      await wait(pause);
    }
    if (token !== runToken) return null;
    renderRail(-1, nodes.length - 1);
    announce(`Pedido ${order.id} listo: inventario, factura, guía y avisos completados.`);
    setBusy(false);
    return order;
  }
  function advance(id) {
    const o = state.orders.find((x) => x.id === id);
    if (!o || o.flow < FLOW_DONE || !nextAction[o.status]) return;
    const [next] = nextAction[o.status];
    o.status = next;
    o.times[next] = now();
    const who = first(o.name);
    if (next === 'empacado') { addLog(state, 'ship', `${o.id} empacado. Etiqueta ${o.tracking} lista para imprimir.`); addLog(state, 'msg', `WhatsApp a ${who}: su pedido ${o.id} está empacado.`); }
    if (next === 'en-camino') { addLog(state, 'ship', `${o.id} entregado a la transportadora.`); addLog(state, 'msg', `WhatsApp y correo a ${who}: va en camino, guía ${o.tracking}.`); }
    if (next === 'entregado') { addLog(state, 'ship', `${o.id} entregado en ${o.city}.`); addLog(state, 'msg', `WhatsApp y correo a ${who}: pedido entregado.`); }
    state.selected = o.id;
    save();
    renderAll(next === 'en-camino');
    announce(`${o.id}: ${statusLabel[next]}. Cliente avisado.`);
  }
  function restock(color) {
    if (!finishes[color] || state.stock[color] >= THRESHOLD) return;
    const amount = TARGET - state.stock[color];
    state.stock[color] += amount;
    formMsg.textContent = '';
    addLog(state, 'restock', `Orden de compra OC-${state.oc} aprobada: ${amount} × Wave One ${finishes[color].name}. Inventario en ${state.stock[color]}.`);
    state.oc += 1;
    save();
    renderStock();
    renderLog();
    announce(`Reposición aprobada: ${finishes[color].name} vuelve a ${state.stock[color]} unidades.`);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    placeOrder({ name: nameInput.value, city: citySelect.value, color: selectedColor(), qty, pay: form.querySelector('input[name="pay"]:checked').value });
  });
  document.addEventListener('click', (event) => {
    const adv = event.target.closest('[data-advance]');
    if (adv) { const id = adv.dataset.advance; advance(id); const again = document.querySelector(`[data-advance="${id}"]`) || document.querySelector(`[data-pick="${id}"]`); if (again) again.focus({ preventScroll: true }); return; }
    const pick = event.target.closest('[data-pick]');
    if (pick) { state.selected = pick.dataset.pick; save(); renderOrders(); renderDocs(); renderClient(); const again = document.querySelector(`[data-pick="${pick.dataset.pick}"]`); if (again) again.focus({ preventScroll: true }); return; }
    const rs = event.target.closest('[data-restock]');
    if (rs) { restock(rs.dataset.restock); const btn = document.querySelector('[data-restock]'); (btn || $('stock-title')).focus?.({ preventScroll: true }); }
  });
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { setView(b.dataset.view); if (b.dataset.view === 'client') renderClient(); }));

  /* Demo automática ------------------------------------------------------ */
  const autoButtons = document.querySelectorAll('[data-autoplay]');
  async function autoplay() {
    if (busy) return;
    const token = ++runToken;
    autoButtons.forEach((b) => b.classList.add('is-running'));
    const ok = () => token === runToken;
    const live = $('en-vivo');
    setView('team');
    live.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    await wait(900); if (!ok()) return;
    choosePerson(state.seq % people.length);
    await wait(500); if (!ok()) return;
    const color = state.stock.lima >= 2 ? 'lima' : Object.keys(finishes).sort((a, b) => state.stock[b] - state.stock[a])[0];
    form.querySelector(`input[name="color"][value="${color}"]`).checked = true;
    await wait(450); if (!ok()) return;
    setQty(state.stock[color] >= 2 ? 2 : 1);
    form.querySelector('input[name="pay"][value="pse"]').checked = true;
    await wait(550); if (!ok()) return;
    if (state.stock[color] < qty) restock(color);
    const order = await placeOrder({ name: nameInput.value, city: citySelect.value, color, qty, pay: 'pse' });
    if (!ok() || !order) { autoButtons.forEach((b) => b.classList.remove('is-running')); return; }
    await wait(900); if (!ok()) return;
    setView('client');
    renderClient();
    const views = document.querySelector('.ops-views');
    if (views.getBoundingClientRect().top < 0 || views.getBoundingClientRect().top > window.innerHeight * 0.6) views.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    for (let i = 0; i < 3; i += 1) {
      await wait(1800); if (!ok()) return;
      advance(order.id);
    }
    await wait(2000); if (!ok()) return;
    setView('team');
    renderAll(true);
    const target = !$('ops-restock').hidden ? $('ops-restock') : $('ops-kpis');
    target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    autoButtons.forEach((b) => b.classList.remove('is-running'));
  }
  autoButtons.forEach((b) => b.addEventListener('click', autoplay));

  $('ops-reset').addEventListener('click', () => {
    runToken += 1;
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    setBusy(false);
    autoButtons.forEach((b) => b.classList.remove('is-running'));
    try { localStorage.removeItem(KEY); } catch (_) { /* Sin almacenamiento, el reinicio es solo en memoria. */ }
    state = seed();
    seenLog = state.logN;
    Object.keys(shownStock).forEach((k) => delete shownStock[k]);
    save();
    formMsg.textContent = '';
    choosePerson(0);
    form.querySelector('input[name="color"][value="lavanda"]').checked = true;
    form.querySelector('input[name="pay"][value="tarjeta"]').checked = true;
    setQty(1);
    setView('team');
    renderRail();
    renderAll();
    announce('Demo reiniciada con los datos de ejemplo.');
  });

  setView(state.view);
  renderRail();
  renderAll();
})();
