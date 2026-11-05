// Ilustración propia de cada sistema (lienzo de 480×360 que se escala). Sin logos ni datos reales.
(function () {
  const I = window.NexoIcono;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Piezas básicas ----------
  // Caja posicionada: x, y, ancho, alto (0 = automático)
  const at = (x, y, w, h, cls, inner = '', st = '') => `<div class="${cls}" style="left:${x}px;top:${y}px;${w ? `width:${w}px;` : ''}${h ? `height:${h}px;` : ''}${st}">${inner}</div>`;
  const L = (w, c, h) => `<i class="ar-l" style="width:${w}%${c ? ';background:' + c : ''}${h ? ';height:' + h + 'px' : ''}"></i>`;
  const lines = (...ws) => ws.map(w => L(w)).join('');
  const ic = (n, cls = '') => `<span class="ar-ic ${cls}">${I(n)}</span>`;
  const chip = (t, cls = '') => `<span class="ar-chip ${cls}">${esc(t)}</span>`;
  const av = (t, c) => `<span class="ar-av" style="${c ? 'background:' + c : ''}">${esc(t)}</span>`;
  const donut = (vals, cols, size = 90, grosor = 14, centro = '') => {
    const r = (size - grosor) / 2, C = 2 * Math.PI * r;
    let acc = 0;
    const arcs = vals.map((v, i) => { const s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${cols[i]}" stroke-width="${grosor}" stroke-dasharray="${(v / 100 * C).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-acc / 100 * C).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="${vals.length === 1 ? 'round' : 'butt'}"/>`; acc += v; return s; }).join('');
    return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(0,0,0,.07)" stroke-width="${grosor}"/>${arcs}${centro ? `<text x="50%" y="54%" text-anchor="middle" font-size="${size / 5}" font-weight="800" fill="currentColor">${centro}</text>` : ''}</svg>`;
  };
  const sparks = (x, y) => Array.from({ length: 9 }, (_, i) => { const a = (i * 40 + 10) * Math.PI / 180, d = 10 + (i % 3) * 9; return `<i class="ar-spark" style="left:${x + Math.cos(a) * d}px;top:${y + Math.sin(a) * d * .7 + 6}px;--s:${.5 + (i % 3) * .3}"></i>`; }).join('');

  // Estufa ecoeficiente en isométrico (SVG)
  const estufa = (w = 150, c = '#2b2d33') => `<svg viewBox="0 0 150 130" width="${w}" class="ar-estufa">
    <rect x="104" y="0" width="12" height="40" fill="#5c5f66"/><rect x="104" y="0" width="5" height="40" fill="#7d8088"/>
    <polygon points="10,44 80,26 140,44 70,62" fill="#3a3c42"/>
    <ellipse cx="50" cy="44" rx="13" ry="5" fill="#16171a" stroke="#6a6d74"/><ellipse cx="88" cy="40" rx="11" ry="4.2" fill="#16171a" stroke="#6a6d74"/><ellipse cx="80" cy="52" rx="9" ry="3.4" fill="#16171a" stroke="#6a6d74"/>
    <polygon points="10,44 70,62 70,118 10,100" fill="${c}"/><polygon points="70,62 140,44 140,102 70,118" fill="#1b1c20"/>
    <polygon points="20,62 60,73 60,96 20,85" fill="#121316" stroke="#6a6d74" stroke-width="1.2"/><circle cx="40" cy="80" r="5" fill="#f08a3c" opacity=".9"/>
    <polygon points="80,72 130,58 130,90 80,104" fill="#2a2c31" stroke="#55585e"/><rect x="96" y="76" width="18" height="3" fill="#c9ccd2" transform="skewY(-15)"/>
    <polygon points="10,100 70,118 70,124 10,106" fill="#0d0e10"/><polygon points="70,118 140,102 140,108 70,124" fill="#0a0a0c"/></svg>`;

  // ---------- Una composición propia por sistema ----------
  const E = {
    // Portal: lanzador de aplicaciones en perspectiva
    agora: S => `<div class="ar-bg mesh"></div>
      ${at(40, 34, 400, 0, 'ar-card ar-greet', `<p class="ar-t">Buenos días, Laura</p><div class="ar-search">${I('ia')}<span>Buscar o preguntar a ECO-IA</span><b>Ctrl K</b></div>`)}
      <div class="ar-grid3d">${[['#14b8a6', 'escudo'], ['#e11d48', 'chispa'], ['#f59e0b', 'dinero'], ['#2563eb', 'documento'], ['#16a34a', 'grafica'], ['#a855f7', 'libro'], ['#ea580c', 'fabrica'], ['#0891b2', 'camion'], ['#dc2626', 'laser']].map(([c, n], i) => `<span class="ar-app" style="--a:${c};--i:${i}">${I(n)}</span>`).join('')}</div>`,

    // ECO-IA: chat con la IA en un celular
    'eco-ia': S => `<div class="ar-bg dark"></div><span class="ar-orb" style="left:300px;top:40px"></span>
      ${at(56, 26, 170, 316, 'ar-phone', `<div class="ar-phone-s">
        <p class="ar-s" style="text-align:center;margin:6px 0 10px">ECO-IA</p>
        <div class="ar-bub me">¿Cuántas órdenes hay en planta?</div>
        <div class="ar-bub ia"><b>${I('ia')} 12 órdenes</b>${['#a78bfa', '#7c3aed', '#c4b5fd', '#6d28d9'].map((c, i) => `<span class="ar-hbar" style="width:${[80, 56, 38, 22][i]}%;background:${c}"></span>`).join('')}</div>
        <div class="ar-bub me">¿Y cuáles están urgentes?</div>
        <div class="ar-typing"><i></i><i></i><i></i></div></div>`)}
      ${at(262, 168, 180, 0, 'ar-card', `<p class="ar-s">Consulta en vivo</p>${['Pedidos', 'Producción', 'Gastos', 'Documentos'].map(t => `<p class="ar-row">${I('check')}${t}</p>`).join('')}`)}`,

    // Pedidos: una orden de trabajo que viaja por las áreas
    pedidos: S => `<div class="ar-bg dots"></div>
      <svg class="ar-abs" viewBox="0 0 480 360"><path d="M50 260 C110 260 120 80 180 80 S280 280 340 280 S420 120 430 100" fill="none" stroke="var(--c)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".5"/></svg>
      ${[['Ventas', 'carrito', 22, 236], ['Diseño', 'chispa', 150, 40], ['Producción', 'fabrica', 300, 250], ['Despacho', 'camion', 392, 60]].map(([t, n, x, y], i) => at(x, y, 0, 0, 'ar-stage' + (i < 3 ? ' ok' : ''), `${ic(n)}<b>${t}</b>`)).join('')}
      ${at(170, 140, 150, 0, 'ar-card ar-ot', `<p class="ar-s">Orden de trabajo</p><p class="ar-t">OT 412A</p>${lines(80, 60)}<span class="ar-firma">${I('firma')} Firmada</span>`)}`,

    // Panel de producción: indicador circular grande
    'panel-produccion': S => `<div class="ar-bg dark"></div>
      ${at(34, 40, 200, 280, 'ar-card ar-glass', `<p class="ar-s">Avance de planta</p><div class="ar-c" style="margin-top:12px">${donut([72], ['var(--cl)'], 150, 18, '72%')}</div><p class="ar-s" style="text-align:center;margin-top:8px">8 órdenes en curso</p>`)}
      ${at(252, 40, 196, 280, 'ar-card ar-glass', ['Corte', 'Doblez', 'Soldadura', 'Pintura', 'Ensamble', 'Calidad'].map((t, i) => `<div class="ar-st"><span>${t}</span><i style="--v:${[100, 92, 78, 60, 34, 12][i]}%"></i></div>`).join(''))}`,

    // Distribución: préstamo de una estufa entre dos órdenes
    'distribucion-estufas': S => `<div class="ar-bg paper"></div>
      ${at(24, 64, 150, 0, 'ar-card', `<p class="ar-s">OT 405A</p><p class="ar-t">Terminada</p><div style="margin-top:8px">${estufa(120)}</div>`)}
      ${at(306, 64, 150, 0, 'ar-card', `<p class="ar-s">OT 412A</p><p class="ar-t">Urgente</p><div class="ar-hueco">${I('estrella')}</div>`)}
      <svg class="ar-abs" viewBox="0 0 480 360"><path d="M170 150 Q240 60 310 150" fill="none" stroke="var(--c)" stroke-width="3" stroke-dasharray="6 7"/><polygon points="304,140 316,154 300,156" fill="var(--c)"/></svg>
      ${at(196, 250, 90, 0, 'ar-truck', I('camion'))}
      ${at(150, 300, 180, 0, 'ar-chip ok big', 'Préstamo aprobado · vuelve sola')}`,

    // Gestión en láser: lámina cortándose con chispas
    'gestion-laser': S => `<div class="ar-bg steel"></div>
      <div class="ar-sheet"><svg viewBox="0 0 300 200"><path d="M40 40 H180 a20 20 0 0 1 20 20 V150 H40 Z M80 80 h40 v40 h-40 Z M150 70 a14 14 0 1 0 0.1 0" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-dasharray="4 4"/><path d="M40 40 H180 a20 20 0 0 1 20 20 V112" fill="none" stroke="#ff7a3d" stroke-width="3"/><path d="M40 40 H180 a20 20 0 0 1 20 20 V112" fill="none" stroke="#ffd2a8" stroke-width="1"/></svg></div>
      ${at(286, 40, 60, 120, 'ar-head', '<i></i>')}<span class="ar-beam" style="left:313px;top:158px;height:62px"></span>${sparks(309, 216)}
      ${at(30, 26, 170, 0, 'ar-card', `<p class="ar-s">Bitácora del turno</p><p class="ar-t">Corte de laterales</p><p class="ar-s">OT 412A · 12 piezas</p>`)}`,

    // Gastos mensuales: cuentas, categorías y recibo pagado
    gastos: S => `<div class="ar-bg mesh"></div>
      ${at(30, 40, 200, 120, 'ar-bank', `<p>Cuenta principal</p><b>$ 18.420.000</b><small>•••• 2045</small>`, 'transform:rotate(-6deg)')}
      ${at(60, 150, 200, 120, 'ar-bank b2', `<p>Caja menor</p><b>$ 640.000</b><small>Efectivo</small>`, 'transform:rotate(3deg)')}
      ${at(282, 34, 170, 0, 'ar-card', `<p class="ar-s">Gastos de noviembre</p><div class="ar-c" style="margin:8px 0">${donut([38, 24, 18, 20], ['var(--c)', '#f59e0b', '#0ea5e9', '#a3a3a3'], 104, 20)}</div>${['Materia prima', 'Servicios', 'Nómina'].map((t, i) => `<p class="ar-row"><i class="ar-dot" style="background:${['var(--c)', '#f59e0b', '#0ea5e9'][i]}"></i>${t}</p>`).join('')}`)}
      ${at(296, 262, 150, 0, 'ar-stamp ok', 'PAGADO')}`,

    // Nómina: desprendible con el neto destacado
    nomina: S => `<div class="ar-bg grad"></div>
      ${at(70, 20, 240, 320, 'ar-paper', `<p class="ar-s">Desprendible · 2.ª quincena</p><p class="ar-t">Ana María Gómez</p><div class="ar-tabla">${[['Salario', '1.423.500'], ['Horas extra', '86.400'], ['Comisiones', '210.000'], ['Salud', '- 56.900'], ['Pensión', '- 56.900']].map(([a, b]) => `<p><span>${a}</span><b>${b}</b></p>`).join('')}</div><div class="ar-neto"><span>Neto a pagar</span><b>$ 1.606.100</b></div>`, 'transform:rotate(-3deg)')}
      ${at(320, 200, 120, 0, 'ar-coins', '<i></i><i></i><i></i><i></i>')}
      ${at(300, 56, 150, 0, 'ar-chip ok big', '✓ Calculada sola')}`,

    // Gestión de estufas: costo que se arma hasta el precio
    'gestion-estufas': S => `<div class="ar-bg paper"></div>
      ${at(22, 70, 0, 0, 'ar-free', estufa(190, '#30333a'))}
      ${at(250, 36, 200, 0, 'ar-card', `<p class="ar-s">Costo por estufa</p><div class="ar-stack">${[['Materia prima', 46, 'var(--c)'], ['Mano de obra', 22, '#f59e0b'], ['Gastos fijos', 18, '#0ea5e9'], ['Utilidad', 14, '#16a34a']].map(([t, v, c]) => `<i style="flex:${v};background:${c}" title="${t}"></i>`).join('')}</div>${['Materia prima', 'Mano de obra', 'Gastos fijos', 'Utilidad'].map((t, i) => `<p class="ar-row"><i class="ar-dot" style="background:${['var(--c)', '#f59e0b', '#0ea5e9', '#16a34a'][i]}"></i>${t}</p>`).join('')}`)}
      ${at(282, 250, 160, 0, 'ar-tag', `${I('etiqueta')}<b>Precio de venta</b>`)}`,

    // OIKOS: mapa de procesos con semáforos
    oikos: S => `<div class="ar-bg dots"></div>
      ${[['Estratégicos', 30, 40], ['Misionales', 30, 150], ['Apoyo', 30, 260]].map(([t, x, y], r) => at(x, y, 420, 76, 'ar-lane', `<b>${t}</b>${[0, 1, 2].map(k => `<span class="ar-proc"><i class="ar-sem ${['ok', 'esp', 'ok', 'ok', 'mal', 'ok', 'esp', 'ok', 'ok'][r * 3 + k]}"></i>${['Dirección', 'Calidad', 'Riesgos', 'Comercial', 'Producción', 'Despacho', 'Compras', 'Talento', 'Mantenimiento'][r * 3 + k]}</span>`).join('')}`)).join('')}`,

    // Vulkano: planos en abanico
    vulkano: S => `<div class="ar-bg dark"></div>
      ${[-14, -4, 6].map((r, i) => at(90 + i * 40, 50 + i * 8, 230, 170, 'ar-blue', `<svg viewBox="0 0 230 170"><rect x="30" y="40" width="110" height="80" fill="none" stroke="#cfe6ff" stroke-width="1.5"/><circle cx="170" cy="80" r="26" fill="none" stroke="#cfe6ff" stroke-width="1.5"/><path d="M30 135 h110 M30 130 v10 M140 130 v10" stroke="#cfe6ff"/><text x="70" y="152" fill="#cfe6ff" font-size="9">850 mm</text><path d="M60 40 v80 M30 70 h110" stroke="#cfe6ff" stroke-dasharray="3 3" opacity=".6"/></svg>`, `transform:rotate(${r}deg)`)).join('')}
      ${at(300, 262, 150, 0, 'ar-chip big', 'Plano · versión 3')}`,

    // Yukeinsi: manual técnico y pieza en despiece
    yukeinsi: S => `<div class="ar-bg paper"></div>
      ${at(40, 40, 170, 250, 'ar-book', `<p class="ar-s" style="color:#fff;opacity:.7">Manual técnico</p><p class="ar-t" style="color:#fff">Estufa 3 puestos</p><div style="margin-top:28px">${estufa(130, '#4b4f58')}</div>`)}
      ${at(232, 50, 220, 0, 'ar-card', `<svg viewBox="0 0 200 120"><g fill="none" stroke="var(--c)" stroke-width="1.6"><rect x="20" y="20" width="60" height="40"/><rect x="34" y="70" width="60" height="30" transform="translate(10 6)"/><circle cx="140" cy="40" r="18"/><circle cx="140" cy="40" r="6"/><path d="M80 40 H122 M64 64 V76" stroke-dasharray="3 3"/></g></svg><p class="ar-s">Despiece · ficha técnica</p>`)}
      ${at(258, 250, 170, 0, 'ar-share', `${I('mensaje')}<span>Compartir ficha</span>`)}`,

    // Atenea: curso con avance y certificado
    atenea: S => `<div class="ar-bg grad"></div>
      ${at(34, 40, 220, 0, 'ar-card', `<div class="ar-course"></div><p class="ar-t">Inducción de seguridad</p><p class="ar-s">6 lecciones · examen final</p><div class="ar-prog"><i style="width:80%"></i></div><p class="ar-s">80% completado</p>`)}
      ${at(272, 40, 170, 0, 'ar-card', `<p class="ar-s">Examen</p>${['Usar casco', 'Guantes al soldar', 'Saltar la inducción'].map((t, i) => `<p class="ar-opt ${i < 2 ? 'ok' : 'no'}">${I(i < 2 ? 'check' : 'alerta')}${t}</p>`).join('')}`)}
      ${at(282, 220, 150, 0, 'ar-medal', `${I('estrella')}<b>Certificado</b>`)}`,

    // Sitio web: catálogo con carrito y WhatsApp
    'sitio-web': S => `<div class="ar-bg mesh"></div>
      ${at(30, 30, 420, 300, 'ar-browser', `<div class="ar-bbar"><i></i><i></i><i></i><span></span></div><div class="ar-hero"><div><p class="ar-t" style="font-size:20px;color:#fff">Cocina con menos leña</p><span class="ar-btn">Cotizar</span></div><div class="ar-c">${estufa(150, '#3a3d44')}</div></div><div class="ar-prods">${[0, 1, 2].map(() => `<span>${lines(70, 40)}</span>`).join('')}</div>`)}
      ${at(392, 280, 50, 50, 'ar-wa', I('mensaje'))}${at(380, 40, 0, 0, 'ar-cart', `${I('carrito')}<b>2</b>`)}`,

    // Talento humano: carné y permiso firmado
    'talento-humano': S => `<div class="ar-bg grad"></div>
      ${at(40, 50, 170, 250, 'ar-badge', `<span class="ar-hole"></span>${av('LM')}<p class="ar-t" style="margin-top:12px">Laura Martínez</p><p class="ar-s">Producción</p>${lines(70, 50)}<span class="ar-chip ok">Activo</span>`, 'transform:rotate(-5deg)')}
      ${at(232, 40, 210, 0, 'ar-card', `<p class="ar-s">Permiso · Salud</p><p class="ar-t">15 de octubre</p>${lines(90, 60)}<svg viewBox="0 0 160 50" class="ar-sign"><path d="M5 35 C25 5 35 45 55 25 S80 10 90 30 S120 40 150 15" fill="none" stroke="#1d2a6b" stroke-width="2.4" stroke-linecap="round"/></svg>`)}
      ${at(250, 268, 0, 0, 'ar-stamp ok', 'AUTORIZADO')}`,

    // Gestión documental: carpetas y versiones
    'gestion-documental': S => `<div class="ar-bg dots"></div>
      ${['#0f766e', '#14b8a6', '#5eead4'].map((c, i) => at(40 + i * 16, 70 - i * 18, 220, 200, 'ar-folder', '', `--f:${c};z-index:${3 - i}`)).join('')}
      ${at(80, 120, 180, 0, 'ar-card', `<p class="ar-s">Manual de calidad</p>${lines(90, 70, 80)}<p class="ar-row">${I('firma')}Firmado</p>`, 'z-index:4')}
      ${at(290, 60, 160, 0, 'ar-card', `<p class="ar-s">Versiones</p>${['v3 · vigente', 'v2 · obsoleta', 'v1 · obsoleta'].map((t, i) => `<p class="ar-ver ${i ? '' : 'on'}">${t}</p>`).join('')}`)}`,

    // Almacén: estantería con niveles de stock
    inventario: S => `<div class="ar-bg paper"></div>
      ${at(30, 40, 250, 280, 'ar-shelf', [0, 1, 2].map(r => `<div class="ar-sh">${[0, 1, 2, 3].map(k => `<span class="ar-box" style="height:${[46, 34, 52, 28, 40, 50, 22, 44, 36, 48, 30, 42][r * 4 + k]}px"></span>`).join('')}</div>`).join(''))}
      ${at(296, 50, 156, 0, 'ar-card', `<p class="ar-s">Stock</p>${['Lámina CR', 'Soldadura', 'Pintura', 'Tornillos'].map((t, i) => `<div class="ar-st"><span>${t}</span><i style="--v:${[78, 54, 18, 66][i]}%" class="${i === 2 ? 'low' : ''}"></i></div>`).join('')}`)}
      ${at(300, 262, 0, 0, 'ar-alert', `${I('alerta')}Pintura bajo el mínimo`)}`,

    // Requisiciones: formulario que llega al almacén
    requisiciones: S => `<div class="ar-bg grad"></div>
      ${at(40, 30, 210, 300, 'ar-clip', `<span class="ar-clamp"></span><p class="ar-t" style="margin-top:14px">Requisición</p>${['Guantes', 'Discos de corte', 'Lija 120', 'Electrodos'].map((t, i) => `<p class="ar-check ${i < 3 ? 'on' : ''}">${I('check')}${t}<b>${[4, 10, 20, 2][i]}</b></p>`).join('')}<span class="ar-btn" style="margin-top:12px">Enviar</span>`)}
      <svg class="ar-abs" viewBox="0 0 480 360"><path d="M262 180 C300 180 300 150 336 150" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/></svg>
      ${at(330, 100, 120, 120, 'ar-cube', I('caja'))}${at(318, 246, 0, 0, 'ar-chip ok big', 'Recibida en almacén')}`,

    // Mantenimiento: máquina con engranajes, QR y cronograma
    mantenimiento: S => `<div class="ar-bg steel"></div>
      ${at(36, 70, 120, 120, 'ar-gear big', I('engranaje'))}${at(132, 160, 80, 80, 'ar-gear', I('engranaje'))}
      ${at(70, 240, 0, 0, 'ar-qr', '')}
      ${at(240, 36, 210, 0, 'ar-card', `<p class="ar-s">Cronograma · noviembre</p><div class="ar-cal">${Array.from({ length: 28 }, (_, i) => `<i class="${[3, 9, 17, 24].includes(i) ? 'on' : i === 12 ? 'warn' : ''}"></i>`).join('')}</div><p class="ar-row">${I('llave')}Dobladora · preventivo</p>`)}`,

    // Activos fijos: celular escaneando QR
    'activos-fijos': S => `<div class="ar-bg dark"></div>
      ${at(40, 40, 180, 0, 'ar-card ar-glass', ['Portátil EC-014', 'Escritorio MU-031', 'Taladro HE-008', 'Impresora EC-022'].map((t, i) => `<p class="ar-row">${I(i === 3 ? 'alerta' : 'check')}${t}</p>`).join('') + `<p class="ar-s" style="margin-top:6px">3 encontrados · 1 faltante</p>`)}
      ${at(270, 24, 160, 312, 'ar-phone', `<div class="ar-phone-s ar-scan"><div class="ar-qr big"></div><span class="ar-scanline"></span><p class="ar-s" style="text-align:center;color:#fff">Escaneando…</p></div>`)}`,

    // Producción: diagrama de avance por orden
    produccion: S => `<div class="ar-bg dots"></div>
      ${at(30, 40, 420, 280, 'ar-card', `<p class="ar-s">Avance por orden</p>${['OT 412', 'OT 415', 'OT 416', 'OT 420', 'OT 421'].map((t, i) => `<div class="ar-gantt"><span>${t}</span><i style="margin-left:${[0, 10, 22, 30, 44][i]}%;width:${[70, 54, 48, 40, 30][i]}%"></i></div>`).join('')}<div class="ar-units">${Array.from({ length: 6 }, () => `<span>${estufa(44)}</span>`).join('')}</div>`)}`,

    // Control y calidad: inspección con lupa y sello
    'control-calidad': S => `<div class="ar-bg grad"></div>
      ${at(40, 40, 230, 0, 'ar-card', `<p class="ar-s">Inspección final · OT 412A</p>${['Soldaduras', 'Pintura', 'Hornilla', 'Chimenea'].map((t, i) => `<p class="ar-check on">${I('check')}${t}</p>`).join('')}<svg viewBox="0 0 160 40" class="ar-sign"><path d="M5 28 C30 4 40 36 62 18 S96 8 110 26 S140 30 155 10" fill="none" stroke="#1d2a6b" stroke-width="2.2" stroke-linecap="round"/></svg>`)}
      ${at(290, 60, 150, 150, 'ar-shield', I('escudo'))}${at(282, 262, 0, 0, 'ar-stamp ok', 'LIBERADO')}`,

    // Gestión SNC: reporte por QR → bandeja → plan de acción
    'gestion-snc': S => `<div class="ar-bg dark"></div>
      ${[['Reporte por QR', 'qr', 'mal'], ['Bandeja del proceso', 'documento', 'esp'], ['Plan de acción', 'check', 'ok']].map(([t, n, k], i) => at(30 + i * 148, 120 - (i % 2) * 40, 128, 150, 'ar-step3 ' + k, `${ic(n)}<b>${t}</b>${lines(80, 50)}`)).join('')}
      ${at(30, 300, 420, 0, 'ar-flow', '<i></i><i></i><i></i>')}`,

    // Diseño: lienzo con curva, paleta y capas
    diseno: S => `<div class="ar-bg mesh"></div>
      ${at(30, 30, 300, 300, 'ar-canvas', `<svg viewBox="0 0 300 300"><path d="M40 220 C80 60 200 60 250 200" fill="none" stroke="var(--c)" stroke-width="5" stroke-linecap="round"/><path d="M40 220 L90 90 M250 200 L210 80" stroke="#94a3b8" stroke-width="1.2"/><circle cx="90" cy="90" r="6" fill="#fff" stroke="#94a3b8"/><circle cx="210" cy="80" r="6" fill="#fff" stroke="#94a3b8"/><rect x="34" y="214" width="12" height="12" fill="#fff" stroke="var(--c)" stroke-width="2"/><rect x="244" y="194" width="12" height="12" fill="#fff" stroke="var(--c)" stroke-width="2"/></svg>`)}
      ${at(350, 40, 100, 0, 'ar-card', `<p class="ar-s">Paleta</p><div class="ar-pal">${['#e11d48', '#f59e0b', '#0f766e', '#1d4ed8', '#111827', '#f5f5f4'].map(c => `<i style="background:${c}"></i>`).join('')}</div>`)}
      ${at(350, 170, 100, 0, 'ar-card', `<p class="ar-s">Capas</p>${['Logo', 'Texto', 'Fondo'].map(t => `<p class="ar-layer">${t}</p>`).join('')}`)}`,

    // Gestión comercial: tendencia al alza
    'gestion-comercial': S => `<div class="ar-bg dark"></div>
      ${at(30, 30, 420, 300, 'ar-card ar-glass', `<div class="ar-kp">${[['214', 'Conversaciones'], ['138', 'Contactos'], ['92', 'Desde anuncio']].map(([v, t]) => `<span><b>${v}</b><small>${t}</small></span>`).join('')}</div><svg viewBox="0 0 400 170" class="ar-line"><defs><linearGradient id="ar-lg-${S.key}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--cl)" stop-opacity=".55"/><stop offset="1" stop-color="var(--cl)" stop-opacity="0"/></linearGradient></defs><path d="M0 150 L50 130 L100 138 L150 100 L200 108 L250 70 L300 78 L350 40 L400 22 V170 H0 Z" fill="url(#ar-lg-${S.key})"/><path d="M0 150 L50 130 L100 138 L150 100 L200 108 L250 70 L300 78 L350 40 L400 22" fill="none" stroke="var(--cl)" stroke-width="3"/><circle cx="400" cy="22" r="6" fill="#fff"/></svg>`)}`,

    // Ventas: factura con abonos
    ventas: S => `<div class="ar-bg paper"></div>
      ${at(40, 24, 220, 312, 'ar-paper ar-ticket', `<p class="ar-s">Venta #2041</p><p class="ar-t">Restaurante El Fogón</p><div class="ar-tabla">${[['Estufa gastronómica', '2'], ['Flete', '1'], ['Instalación', '1']].map(([a, b]) => `<p><span>${a}</span><b>${b}</b></p>`).join('')}</div><div class="ar-neto"><span>Total</span><b>$ 6.400.000</b></div><p class="ar-s" style="margin-top:10px">Abonado 50%</p><div class="ar-prog"><i style="width:50%"></i></div>`)}
      ${at(290, 70, 150, 0, 'ar-card', `<p class="ar-s">Abonos</p>${['Anticipo', 'Segundo pago'].map((t, i) => `<p class="ar-row">${I(i ? 'reloj' : 'check')}${t}</p>`).join('')}`)}
      ${at(300, 230, 0, 0, 'ar-truck', I('camion'))}`,

    // Telemercadeo: llamada y plantillas de mensaje
    'seguimiento-clientes': S => `<div class="ar-bg grad"></div>
      ${at(50, 24, 170, 316, 'ar-phone', `<div class="ar-phone-s ar-call">${av('VO', '#fff')}<p class="ar-t" style="color:#fff;margin-top:10px">Valentina Ospina</p><p class="ar-s" style="color:#fff;opacity:.7">Llamando… 02:14</p><div class="ar-callbtn"><i></i><i class="end"></i></div></div>`)}
      ${at(250, 50, 200, 0, 'ar-bub ia big', '¡Hola, Valentina! ¿Pudiste revisar la cotización de la estufa?')}${at(250, 170, 200, 0, 'ar-tpl', `${I('documento')}Plantilla · Seguimiento`)}${at(250, 226, 200, 0, 'ar-tpl', `${I('calendario')}Volver a llamar el jueves`)}`,

    // Mapa SECOP: Colombia por regiones
    'mapa-secop': S => `<div class="ar-bg dark"></div>
      <svg class="ar-map" viewBox="0 0 220 260"><defs><clipPath id="ar-col-${S.key}"><path d="M70 22 L110 10 L150 2 L164 8 L144 34 L152 64 L196 74 L200 114 L176 124 L180 176 L146 206 L130 252 L122 210 L92 180 L42 170 L20 144 L30 104 L20 72 L40 52 L50 32 Z"/></clipPath></defs>
      <g clip-path="url(#ar-col-${S.key})">${[['#7c3aed', '0,0 120,0 100,80 0,90'], ['#a78bfa', '120,0 220,0 220,90 100,80'], ['#5b21b6', '0,90 100,80 110,150 0,170'], ['#c4b5fd', '100,80 220,90 220,160 110,150'], ['#6d28d9', '0,170 110,150 130,260 0,260'], ['#8b5cf6', '110,150 220,160 220,260 130,260']].map(([c, p]) => `<polygon points="${p}" fill="${c}"/>`).join('')}</g>
      <path d="M70 22 L110 10 L150 2 L164 8 L144 34 L152 64 L196 74 L200 114 L176 124 L180 176 L146 206 L130 252 L122 210 L92 180 L42 170 L20 144 L30 104 L20 72 L40 52 L50 32 Z" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/></svg>
      ${[[150, 70], [250, 90], [150, 170], [250, 190], [190, 250]].map(([x, y]) => `<span class="ar-pin" style="left:${x}px;top:${y}px"></span>`).join('')}
      ${at(320, 60, 140, 0, 'ar-card', ['Caribe', 'Andina', 'Pacífico', 'Orinoquía'].map((t, i) => `<p class="ar-row">${av(['VO', 'JC', 'MQ', 'SV'][i], ['#7c3aed', '#a78bfa', '#5b21b6', '#c4b5fd'][i])}${t}</p>`).join(''))}`,

    // Garantías: escudo y línea de seis pasos
    garantias: S => `<div class="ar-bg dots"></div>
      ${at(40, 50, 150, 150, 'ar-shield', I('escudo'))}
      ${at(220, 40, 230, 0, 'ar-card', `<p class="ar-s">Caso GAR-021</p><p class="ar-t">Hornilla con fisura</p><div class="ar-steps6">${Array.from({ length: 6 }, (_, i) => `<i class="${i < 4 ? 'on' : ''}"></i>`).join('')}</div><p class="ar-s">Paso 4 de 6 · a tiempo</p>`)}
      ${at(40, 250, 410, 0, 'ar-sem-row', ['ok', 'esp', 'mal'].map(k => `<span class="ar-sem big ${k}"></span>`).join('') + '<b>Semáforo de tiempos de servicio</b>')}`,

    // PQRS: bandeja con radicados por tipo
    pqrs: S => `<div class="ar-bg grad"></div>
      ${at(40, 30, 400, 300, 'ar-card', `<p class="ar-s">Bandeja de PQRS</p>${[['P', 'Petición', '#2563eb', 'RAD-0410'], ['Q', 'Queja', '#dc2626', 'RAD-0412'], ['R', 'Reclamo', '#ea580c', 'RAD-0415'], ['S', 'Sugerencia', '#16a34a', 'RAD-0418']].map(([l, t, c, r], i) => `<div class="ar-inbox"><span class="ar-letter" style="background:${c}">${l}</span><div><b>${t}</b><small>${r}</small></div>${chip(['Asignada', 'Respondida', 'En revisión', 'Nueva'][i], ['esp', 'ok', 'esp', ''][i])}</div>`).join('')}`)}`,

    // Comisiones: ranking con monedas
    comisiones: S => `<div class="ar-bg mesh"></div>
      <div class="ar-podium">${[['CR', 160, '2'], ['LM', 210, '1'], ['AC', 120, '3']].map(([t, h, n]) => `<div>${av(t)}<span style="height:${h}px"><b>${n}</b></span></div>`).join('')}</div>
      ${at(330, 60, 120, 0, 'ar-coins', '<i></i><i></i><i></i><i></i><i></i>')}${at(300, 250, 0, 0, 'ar-chip ok big', 'Meta cumplida')}`,

    // Encuesta: estrellas y caritas
    'encuesta-satisfaccion': S => `<div class="ar-bg paper"></div>
      ${at(40, 50, 400, 0, 'ar-card ar-c', `<p class="ar-t">¿Cómo fue tu experiencia?</p><div class="ar-stars">${[0, 1, 2, 3, 4].map(i => `<span class="${i < 4 ? 'on' : ''}">${I('estrella')}</span>`).join('')}</div><div class="ar-faces">${['😞', '😐', '🙂', '😄'].map((f, i) => `<span class="${i === 3 ? 'on' : ''}">${f}</span>`).join('')}</div>`)}
      ${at(140, 236, 200, 0, 'ar-card ar-c', `<p class="ar-s">Satisfacción</p><b class="ar-big">92%</b>`)}`,

    // Generadores: firma de correo y rótulo de archivo
    generadores: S => `<div class="ar-bg dots"></div>
      ${at(30, 50, 260, 0, 'ar-card ar-sig', `<span class="ar-sig-logo"></span><div><p class="ar-t">Natalia Ortiz</p><p class="ar-s">Asistente comercial</p>${lines(80, 60)}</div>`)}
      ${at(220, 170, 230, 150, 'ar-label', `<p class="ar-s">ARCHIVO CENTRAL</p><p class="ar-t">Contratos 2026</p><p class="ar-s">Caja 04 · Carpeta 12</p><div class="ar-barcode">${Array.from({ length: 34 }, (_, i) => `<i style="width:${1 + (i * 7) % 3}px"></i>`).join('')}</div>`, 'transform:rotate(4deg)')}`,

    // Administración: usuarios con interruptores de módulos
    'administracion-sigedo': S => `<div class="ar-bg dark"></div>
      ${at(40, 40, 400, 280, 'ar-card ar-glass', [['LM', 'Laura Martínez', [1, 1, 0]], ['CR', 'Carlos Ramírez', [1, 0, 1]], ['PV', 'Paula Vega', [0, 1, 1]], ['AC', 'Andrés Cruz', [1, 1, 1]]].map(([a, n, sw]) => `<div class="ar-user">${av(a)}<b>${n}</b>${sw.map(o => `<span class="ar-sw ${o ? 'on' : ''}"></span>`).join('')}</div>`).join('') + `<p class="ar-s" style="margin-top:8px">${I('llave')} Permisos por módulo y rol</p>`)}`,
  };

  // Si un sistema no tiene composición propia, se usa una genérica con su ícono
  const generica = S => `<div class="ar-bg grad"></div>${at(170, 110, 140, 140, 'ar-shield', I(S.icono))}`;

  const arte = S => `<div class="arte"><div class="arte-in"><div class="ar" style="--c:${esc(S.color)}">${(E[S.key] || generica)(S)}</div></div></div>`;
  window.NexoArte = arte;
})();
