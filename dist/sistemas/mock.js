// Pantallas simuladas de cada sistema (sin logos ni datos reales). Las usan el catálogo y el reproductor.
(function () {
  const I = window.NexoIcono;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Color del estado según la palabra
  const tono = t => {
    const s = String(t).toLowerCase();
    if (/(rechaz|vencid|inactiv|bajo|agotad|anulad|cancel|cr[ií]tic|baja\b|falla|urgente|no cumpl|no conforme|perdid)/.test(s)) return 'mal';
    if (/(finaliz|respond|valid|despach|activ|autoriz|aprob|entreg|cumpl|pagad|cerrad|liber|listo|normal|complet|resuelt|firmad|vigente|disponible|enviad|ganad|conforme|al d[ií]a|copiad|publicad)/.test(s)) return 'ok';
    if (/(cotiz|producci|pendient|revisi|proceso|sin inici|espera|program|borrador|asignad|abiert|nuev|curso|parcial|por |pr[oó]xim|edici|reportad|mantenimiento|reparaci|registrad)/.test(s)) return 'esp';
    return '';
  };
  const pill = t => `<span class="pill ${tono(t)}">${esc(t)}</span>`;

  // Ícono para cada función según sus palabras
  const REGLAS = [
    [/firma/, 'firma'], [/correo|aviso|alerta|notific/, 'alerta'], [/qr/, 'qr'], [/pdf|document|archivo|expedient|hoja de vida|plantilla|formato/, 'documento'],
    [/inventario|insumo|bodega|stock|lote|almac/, 'caja'], [/compra|carrito|cotiz|venta|pedido/, 'carrito'], [/mapa|ciudad|regi|zona/, 'mapa'],
    [/calendario|cronograma|fecha|vacacion|agenda|parrilla/, 'calendario'], [/indicador|tablero|dashboard|reporte|informe|gr[aá]fic|m[eé]trica|ranking/, 'grafica'],
    [/pago|saldo|n[oó]mina|comisi|dinero|gasto|costo|precio|abono|cartera/, 'dinero'], [/persona|colaborador|usuario|empleado|cliente|asesor|rol/, 'personas'],
    [/mensaje|whatsapp|llamada|chat|pregunta|encuesta/, 'mensaje'], [/ia\b|inteligencia|asistente/, 'ia'], [/mantenimiento|equipo|m[aá]quina|herramienta|falla/, 'llave'],
    [/producci|planta|fabric|orden de trabajo|\bot\b/, 'fabrica'], [/despacho|env[ií]o|transport|traslado|pr[eé]stamo|distribu/, 'camion'],
    [/calidad|inspecci|liberaci|auditor|riesgo|seguridad|permiso|acceso/, 'escudo'], [/curso|capacit|examen|formaci|manual/, 'libro'],
    [/corte|l[aá]ser/, 'laser'], [/r[oó]tulo|etiqueta|c[oó]digo/, 'etiqueta'], [/web|sitio|cat[aá]logo|blog/, 'web'], [/dise[nñ]o|plano|imagen/, 'chispa'],
  ];
  const iconoDe = (t, def) => { const s = String(t).toLowerCase(); for (const [re, ic] of REGLAS) if (re.test(s)) return ic; return def || 'check'; };

  // a(at, clases): atributos de una pieza animada (o estática si anim = false)
  const attr = anim => (at, extra = '') => anim ? `class="b ${extra}" data-at="${at}"` : (extra ? `class="${extra}"` : '');

  // Columnas: máximo 6 (las primeras y las últimas; la última es el estado)
  const recorta = P => {
    const n = (P.columnas || []).length;
    const keep = n <= 6 ? [...Array(n).keys()] : [0, 1, 2, n - 3, n - 2, n - 1];
    return { cols: keep.map(i => P.columnas[i]), filas: (P.filas || []).map(f => keep.map(i => f[i] == null ? '' : f[i])) };
  };

  const cuerpo = (S, anim, t0) => {
    const P = S.pantalla || {};
    const a = attr(anim);
    if (P.tipo === 'tarjetas') {
      return `<ul class="tarj">${(P.items || []).slice(0, 9).map((it, i) => `<li ${a(t0 + i * .22)}><span class="th">${I(iconoDe(it.t + ' ' + it.s, S.icono))}</span><strong>${esc(it.t)}</strong><small>${esc(it.s)}</small>${pill(it.estado)}</li>`).join('')}</ul>`;
    }
    if (P.tipo === 'kanban') {
      let n = 0;
      return `<ul class="kan">${(P.carriles || []).slice(0, 4).map(c => `<li><h5>${esc(c.t)}<span>${(c.items || []).length}</span></h5>${(c.items || []).slice(0, 3).map(it => `<div ${a(t0 + (n++) * .25, 'k')}><i></i><strong>${esc(it.t)}</strong><small>${esc(it.s)}</small></div>`).join('')}</li>`).join('')}</ul>`;
    }
    if (P.tipo === 'panel') {
      return `<ul class="kpis">${(P.kpis || []).slice(0, 4).map((k, i) => `<li ${a(t0 + i * .25)}><b ${anim ? `data-count="${esc(k.v)}" data-at="${t0 + i * .25}"` : ''}>${esc(k.v)}</b><small>${esc(k.t)}</small></li>`).join('')}</ul>
        <ul class="barras">${(P.barras || []).slice(0, 6).map((r, i) => `<li ${anim ? a(t0 + 1 + i * .3) : 'class="on"'} style="--v:${Math.max(0, Math.min(100, +r.v || 0))}"><span>${esc(r.t)}</span><i><b></b></i><em>${esc(r.v)}%</em></li>`).join('')}</ul>`;
    }
    const { cols, filas } = recorta(P);
    return `<table class="tbl"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${filas.slice(0, 8).map((f, i) => `<tr ${a(t0 + i * .2, i === 1 ? 'pk' : '')}>${f.map((c, j) => `<td>${j === f.length - 1 ? pill(c) : esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };

  // Ventana completa de la aplicación simulada
  const win = (S, o = {}) => {
    const P = S.pantalla || {};
    const anim = !!o.anim, t0 = o.t0 || 0;
    const a = attr(anim);
    return `<div ${a(o.at || 0, 'win ' + (o.clase || ''))}>
      <div class="win-bar"><i></i><i></i><i></i><span>${esc(S.familia)} · ${esc(P.app || S.nombre)}</span></div>
      <div class="win-body">
        <aside class="side"><div class="side-app">${I(S.icono)}${esc(P.app || S.nombre)}</div>
          ${(P.menu || []).slice(0, 4).map(g => `<small>${esc(g.g)}</small><ul>${(g.i || []).slice(0, 4).map(it => `<li class="${it === P.activo ? 'act' : ''}">${esc(it)}</li>`).join('')}</ul>`).join('')}
        </aside>
        <div class="main">
          <div class="main-top"><div class="ruta">${esc(P.ruta || '')}<b>${esc(P.activo || P.app || '')}</b></div>
            <div class="acc">${(P.acciones || []).slice(0, 3).map(x => `<span>${esc(x)}</span>`).join('')}</div></div>
          ${cuerpo(S, anim, t0)}
          <p ${a(t0 + .4, 'sync')} style="margin-top:10px">Sincronizado</p>
        </div>
      </div>
      ${o.ficticio === false ? '' : '<span class="ficticio">Datos ficticios</span>'}
    </div>`;
  };

  // Miniatura escalada: la ventana se dibuja a 820×512 y se encoge para caber
  const mini = (S, o = {}) => `<div class="escala ${o.clase || ''}"><div class="escala-in">${win(S, { ficticio: false, at: o.at, anim: false })}</div></div>`;

  // Las miniaturas (820 de ancho) y las ilustraciones (480) se escalan al ancho de su caja
  const base = el => el.classList.contains('arte') ? 480 : 820;
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => es.forEach(e => {
    const w = e.contentRect.width;
    if (w) e.target.firstElementChild.style.transform = `scale(${w / base(e.target)})`;
  })) : null;
  const ajustar = root => (root || document).querySelectorAll('.escala,.arte').forEach(el => {
    if (ro) ro.observe(el); else el.firstElementChild.style.transform = `scale(${el.clientWidth / base(el)})`;
  });

  window.NexoMock = { esc, tono, pill, iconoDe, win, mini, ajustar };
})();
