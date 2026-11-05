// Catálogo: agrupa los sistemas y abre la presentación de cada uno.
(function () {
  const I = window.NexoIcono;
  const LISTA = window.NEXO_SISTEMAS || [];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const GRUPOS = [
    { k: 'agora', t: 'Ágora', d: 'El portal corporativo: cada persona entra una sola vez y desde ahí abre todas las aplicaciones.' },
    { k: 'apps', t: 'Aplicaciones', d: 'Sistemas propios para pedidos, producción, finanzas, nómina, diseño y formación.' },
    { k: 'sigedo', t: 'SiGeDo', d: 'La plataforma de gestión: documentos, personas, inventario, mantenimiento, calidad y la parte comercial, módulo por módulo.' },
  ];
  const grupoDe = s => s.familia === 'SiGeDo' ? 'sigedo' : (s.key === 'agora' || s.key === 'eco-ia') ? 'agora' : 'apps';

  const cont = document.getElementById('cat-grupos');
  const filtros = document.getElementById('cat-filtros');
  if (LISTA[0]) document.getElementById('cat-play').href = 'ver.html?p=' + encodeURIComponent(LISTA[0].key);

  cont.innerHTML = GRUPOS.map(g => {
    const items = LISTA.filter(s => grupoDe(s) === g.k);
    if (!items.length) return '';
    return `<section class="cat-grupo" data-g="${g.k}">
      <h2>${esc(g.t)} <small>${items.length} ${items.length === 1 ? 'sistema' : 'sistemas'}</small></h2>
      <p>${esc(g.d)}</p>
      <div class="cat-grid">${items.map(s => `
        <a class="card" href="ver.html?p=${encodeURIComponent(s.key)}" style="--c:${esc(s.color)}" aria-label="Ver la presentación de ${esc(s.nombre)}">
          <div class="thumb">${window.NexoArte(s)}<span class="play">${I('play')}</span></div>
          <div class="card-b"><span class="tile">${I(s.icono)}</span><div><h3>${esc(s.nombre)}</h3><p class="card-meta">${esc(s.area)}</p></div></div>
        </a>`).join('')}</div>
    </section>`;
  }).join('');

  window.NexoMock.ajustar(cont);

  const presentes = GRUPOS.filter(g => LISTA.some(s => grupoDe(s) === g.k));
  filtros.innerHTML = `<button type="button" aria-pressed="true" data-g="todos">Todos<span>${LISTA.length}</span></button>` +
    presentes.map(g => `<button type="button" aria-pressed="false" data-g="${g.k}">${esc(g.t)}<span>${LISTA.filter(s => grupoDe(s) === g.k).length}</span></button>`).join('');
  filtros.addEventListener('click', e => {
    const bt = e.target.closest('button');
    if (!bt) return;
    filtros.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === bt)));
    cont.querySelectorAll('.cat-grupo').forEach(sec => { sec.hidden = bt.dataset.g !== 'todos' && sec.dataset.g !== bt.dataset.g; });
  });
})();
