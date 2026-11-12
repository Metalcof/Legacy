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

  // ---------- Una composición propia por sistema ----------
  const E = {
    // Talento humano: carné y permiso firmado
    'talento-humano': S => `<div class="ar-bg grad"></div>
      ${at(40, 50, 170, 250, 'ar-badge', `<span class="ar-hole"></span>${av('LM')}<p class="ar-t" style="margin-top:12px">Laura Martínez</p><p class="ar-s">Producción</p>${lines(70, 50)}<span class="ar-chip ok">Activo</span>`, 'transform:rotate(-5deg)')}
      ${at(232, 40, 210, 0, 'ar-card', `<p class="ar-s">Permiso · Salud</p><p class="ar-t">15 de octubre</p>${lines(90, 60)}<svg viewBox="0 0 160 50" class="ar-sign"><path d="M5 35 C25 5 35 45 55 25 S80 10 90 30 S120 40 150 15" fill="none" stroke="#1d2a6b" stroke-width="2.4" stroke-linecap="round"/></svg>`)}
      ${at(250, 268, 0, 0, 'ar-stamp ok', 'AUTORIZADO')}`,

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

    // Gestión SNC: reporte por QR → bandeja → plan de acción
    'gestion-snc': S => `<div class="ar-bg dark"></div>
      ${[['Reporte por QR', 'qr', 'mal'], ['Bandeja del proceso', 'documento', 'esp'], ['Plan de acción', 'check', 'ok']].map(([t, n, k], i) => at(30 + i * 148, 120 - (i % 2) * 40, 128, 150, 'ar-step3 ' + k, `${ic(n)}<b>${t}</b>${lines(80, 50)}`)).join('')}
      ${at(30, 300, 420, 0, 'ar-flow', '<i></i><i></i><i></i>')}`,

    // Gestión comercial: tendencia al alza
    'gestion-comercial': S => `<div class="ar-bg dark"></div>
      ${at(30, 30, 420, 300, 'ar-card ar-glass', `<div class="ar-kp">${[['214', 'Conversaciones'], ['138', 'Contactos'], ['92', 'Desde anuncio']].map(([v, t]) => `<span><b>${v}</b><small>${t}</small></span>`).join('')}</div><svg viewBox="0 0 400 170" class="ar-line"><defs><linearGradient id="ar-lg-${S.key}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--cl)" stop-opacity=".55"/><stop offset="1" stop-color="var(--cl)" stop-opacity="0"/></linearGradient></defs><path d="M0 150 L50 130 L100 138 L150 100 L200 108 L250 70 L300 78 L350 40 L400 22 V170 H0 Z" fill="url(#ar-lg-${S.key})"/><path d="M0 150 L50 130 L100 138 L150 100 L200 108 L250 70 L300 78 L350 40 L400 22" fill="none" stroke="var(--cl)" stroke-width="3"/><circle cx="400" cy="22" r="6" fill="#fff"/></svg>`)}`,

    // Mapa SECOP: Colombia por regiones
    'mapa-secop': S => `<div class="ar-bg dark"></div>
      <svg class="ar-map" viewBox="0 0 220 260"><defs><clipPath id="ar-col-${S.key}"><path d="M70 22 L110 10 L150 2 L164 8 L144 34 L152 64 L196 74 L200 114 L176 124 L180 176 L146 206 L130 252 L122 210 L92 180 L42 170 L20 144 L30 104 L20 72 L40 52 L50 32 Z"/></clipPath></defs>
      <g clip-path="url(#ar-col-${S.key})">${[['#7c3aed', '0,0 120,0 100,80 0,90'], ['#a78bfa', '120,0 220,0 220,90 100,80'], ['#5b21b6', '0,90 100,80 110,150 0,170'], ['#c4b5fd', '100,80 220,90 220,160 110,150'], ['#6d28d9', '0,170 110,150 130,260 0,260'], ['#8b5cf6', '110,150 220,160 220,260 130,260']].map(([c, p]) => `<polygon points="${p}" fill="${c}"/>`).join('')}</g>
      <path d="M70 22 L110 10 L150 2 L164 8 L144 34 L152 64 L196 74 L200 114 L176 124 L180 176 L146 206 L130 252 L122 210 L92 180 L42 170 L20 144 L30 104 L20 72 L40 52 L50 32 Z" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1.5"/></svg>
      ${[[150, 70], [250, 90], [150, 170], [250, 190], [190, 250]].map(([x, y]) => `<span class="ar-pin" style="left:${x}px;top:${y}px"></span>`).join('')}
      ${at(320, 60, 140, 0, 'ar-card', ['Caribe', 'Andina', 'Pacífico', 'Orinoquía'].map((t, i) => `<p class="ar-row">${av(['VO', 'JC', 'MQ', 'SV'][i], ['#7c3aed', '#a78bfa', '#5b21b6', '#c4b5fd'][i])}${t}</p>`).join(''))}`,

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
