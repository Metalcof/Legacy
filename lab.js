'use strict';
// Laboratorio "Arma una web": cambia una web de ejemplo en vivo según lo que elija el visitante.
(() => {
  const lab = document.getElementById('laboratorio');
  if (!lab) return;
  const site = lab.querySelector('[data-lab-site]');
  const frame = lab.querySelector('[data-lab-frame]');
  const status = lab.querySelector('[data-lab-status]');
  const heroImage = lab.querySelector('[data-lab-hero]');
  const cardsBox = lab.querySelector('[data-lab-cards]');
  const linksBox = lab.querySelector('[data-lab-links]');
  const cartCount = lab.querySelector('[data-lab-cart-count]');
  const url = lab.querySelector('[data-lab-url]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const sectors = {
    cafeteria: {
      name: 'Cafetería', brand: 'maré.', url: 'mare.co', links: ['Carta', 'El lugar', 'Visítanos'],
      kicker: 'Café de especialidad', title: 'Un buen café, sin prisa.',
      text: 'Granos de origen, pan del día y un jardín para quedarse.', cta: 'Ver la carta',
      hero: 'assets/cafe-editorial-small.webp', bookingTitle: 'Reserva una mesa', review: '4,9 de 5 en 312 reseñas',
      items: [['case-cafe-flatwhite-small', 'Flat white', '$ 7.000'], ['case-cafe-croissant-small', 'Croissant', '$ 7.500'], ['case-cafe-iced-small', 'Cold brew', '$ 9.000']]
    },
    clinica: {
      name: 'Clínica', brand: 'ALMA', url: 'alma.health', links: ['Servicios', 'Equipo', 'Agenda'],
      kicker: 'Centro de bienestar', title: 'Cuidarte también es una cita.',
      text: 'Fisioterapia, nutrición y consulta general en horarios que se adaptan a ti.', cta: 'Agendar cita',
      hero: 'assets/wellness-editorial-small.webp', bookingTitle: 'Elige tu horario', review: '4,8 de 5 en 520 reseñas',
      items: [['case-clinic-consultation-small', 'Consulta general', '$ 90.000'], ['case-clinic-team-small', 'Valoración inicial', '$ 60.000'], ['auto-clinica-small', 'Control', '$ 50.000']]
    },
    tienda: {
      name: 'Tienda', brand: 'WAV', url: 'wav.store', links: ['Audífonos', 'Acabados', 'Soporte'],
      kicker: 'Sonido sin cables', title: 'Wave One, en tres acabados.',
      text: 'Cancelación de ruido, 40 horas de batería y un estuche que cabe en cualquier bolsillo.', cta: 'Comprar ahora',
      hero: 'assets/case-wav-lifestyle-small.webp', bookingTitle: 'Recoge en tienda', review: '4,7 de 5 en 1.204 reseñas',
      items: [['headphones-lavanda', 'Wave One lavanda', '$ 489.000'], ['headphones-grafito', 'Wave One grafito', '$ 489.000'], ['headphones-lima', 'Wave One lima', '$ 489.000']]
    },
    restaurante: {
      name: 'Restaurante', brand: 'LUMBRE', url: 'lumbre.co', links: ['Carta', 'Reservas', 'Historia'],
      kicker: 'Cocina de fuego', title: 'Sabores de casa, hechos al carbón.',
      text: 'Producto local, fuego lento y una mesa larga para compartir.', cta: 'Reservar mesa',
      hero: 'assets/restaurant-editorial-small.webp', bookingTitle: 'Mesa para dos', review: '4,9 de 5 en 870 reseñas',
      items: [['case-restaurant-tostadas-small', 'Tostadas de pesca', '$ 32.000'], ['case-restaurant-fish-small', 'Pescado a la brasa', '$ 58.000'], ['case-restaurant-rice-small', 'Arroz del mar', '$ 49.000']]
    },
    arquitectura: {
      name: 'Arquitectura', brand: 'AURA', url: 'aura.studio', links: ['Proyectos', 'Estudio', 'Contacto'],
      kicker: 'Arquitectura e interiores', title: 'Casas que respiran con su entorno.',
      text: 'Diseñamos espacios cálidos, con luz natural y materiales honestos.', cta: 'Ver proyectos',
      hero: 'assets/architecture-editorial-small.webp', bookingTitle: 'Agenda una visita', review: '5 de 5 en 64 reseñas',
      items: [['case-architecture-patio-small', 'Casa Patio', '240 m²'], ['case-architecture-loft-small', 'Loft Centro', '96 m²'], ['interior-editorial-small', 'Interior Bruma', '130 m²']]
    },
    personal: {
      name: 'Marca personal', brand: 'Valeria Ríos', url: 'valeriarios.co', links: ['Casos', 'Servicios', 'Contacto'],
      kicker: 'Estrategia de marca', title: 'Marcas con una historia clara.',
      text: 'Acompaño a negocios creativos a decir qué hacen y por qué importa.', cta: 'Ver casos',
      hero: 'assets/professional-editorial-small.webp', bookingTitle: 'Agenda una llamada', review: '5 de 5 en 48 reseñas',
      items: [['case-personal-cosmetics-small', 'Cosmética Nativa', 'Caso'], ['case-personal-hotel-small', 'Hotel Bruma', 'Caso'], ['case-personal-workshop-small', 'Taller Arcilla', 'Caso']]
    }
  };
  const labels = {
    color: { ambar: 'ámbar', bosque: 'bosque', oceano: 'océano', ciruela: 'ciruela', coral: 'coral', grafito: 'grafito' },
    type: { moderna: 'moderna', clasica: 'clásica', compacta: 'compacta' },
    shape: { suave: 'suave', recta: 'recta', pildora: 'redonda' },
    layout: { dividida: 'dividida', centrada: 'centrada', portada: 'foto completa' },
    mode: { claro: 'claro', oscuro: 'oscuro' }
  };
  const featureNames = { whatsapp: 'WhatsApp', booking: 'reservas', cart: 'carrito', reviews: 'reseñas' };

  const state = { sector: 'cafeteria', color: 'ambar', type: 'clasica', shape: 'suave', layout: 'dividida', mode: 'claro' };
  const features = new Set(['whatsapp']);
  const cartItems = new Map();
  let swapTimer;

  const groups = [...lab.querySelectorAll('[data-lab-group]')];
  const toggles = [...lab.querySelectorAll('[data-feature]')];

  function describe() {
    const extras = [...features].map(key => featureNames[key]);
    return `${sectors[state.sector].name}, color ${labels.color[state.color]}, letra ${labels.type[state.type]}, forma ${labels.shape[state.shape]}, distribución ${labels.layout[state.layout]}, modo ${labels.mode[state.mode]}` +
      (extras.length ? `. Funciones: ${extras.join(', ')}.` : '. Sin funciones extra.');
  }

  function renderSector() {
    const data = sectors[state.sector];
    site.querySelectorAll('[data-lab-text]').forEach(el => {
      const key = el.dataset.labText;
      if (key in data) el.textContent = data[key];
    });
    url.textContent = data.url;
    linksBox.replaceChildren(...data.links.map(text => Object.assign(document.createElement('span'), { textContent: text })));
    heroImage.src = data.hero;
    const cards = [...cardsBox.children];
    data.items.forEach(([image, title, price], index) => {
      const card = cards[index];
      card.querySelector('img').src = `assets/${image}.webp`;
      card.querySelector('strong').textContent = title;
      card.querySelector('small').textContent = price;
      card.querySelector('.ls-add').setAttribute('aria-label', `Añadir ${title} al carrito de ejemplo`);
    });
  }

  function applyState(animateSector) {
    const sectorChanged = site.dataset.sector !== state.sector;
    ['color', 'type', 'shape', 'layout', 'mode'].forEach(key => { site.dataset[key] = state[key]; });
    if (sectorChanged) {
      site.dataset.sector = state.sector;
      if (cartItems.size) { cartItems.clear(); renderCart(); closeCart(); }
      if (animateSector && !reduced.matches && !document.body.classList.contains('motion-paused')) {
        clearTimeout(swapTimer);
        site.classList.add('is-swapping');
        swapTimer = setTimeout(() => {
          renderSector();
          const reveal = () => site.classList.remove('is-swapping');
          if (heroImage.complete) requestAnimationFrame(reveal);
          else { heroImage.addEventListener('load', reveal, { once: true }); setTimeout(reveal, 400); }
        }, 180);
      } else renderSector();
    }
    groups.forEach(group => {
      const key = group.dataset.labGroup;
      group.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === state[key])));
    });
    status.textContent = describe();
  }

  function applyFeatures() {
    toggles.forEach(button => {
      const on = features.has(button.dataset.feature);
      button.setAttribute('aria-pressed', String(on));
      site.classList.toggle(`has-${button.dataset.feature}`, on);
    });
    site.querySelectorAll('.ls-add').forEach(add => {
      const on = features.has('cart');
      add.tabIndex = on ? 0 : -1;
      if (on) add.removeAttribute('aria-hidden'); else add.setAttribute('aria-hidden', 'true');
    });
    cartOpen.tabIndex = features.has('cart') ? 0 : -1;
    status.textContent = describe();
  }

  groups.forEach(group => group.addEventListener('click', event => {
    const button = event.target instanceof Element && event.target.closest('button[data-value]');
    if (!button) return;
    state[group.dataset.labGroup] = button.dataset.value;
    applyState(true);
  }));

  toggles.forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.feature;
    if (features.has(key)) features.delete(key); else features.add(key);
    if (key === 'cart' && !features.has('cart')) { cartItems.clear(); renderCart(); closeCart(); }
    applyFeatures();
  }));

  /* ---------- Carrito de ejemplo dentro de la vista previa ---------- */
  const minicart = lab.querySelector('[data-lab-minicart]');
  const cartOpen = lab.querySelector('[data-lab-cart-open]');
  const cartList = lab.querySelector('[data-lab-cart-list]');
  const cartEmpty = lab.querySelector('[data-lab-cart-empty]');
  const cartTotal = lab.querySelector('[data-lab-cart-total]');
  const payButton = lab.querySelector('[data-lab-cart-pay]');
  const toNumber = text => /\$/.test(text) ? Number(text.replace(/\D/g, '')) : 0;
  const money = value => '$ ' + value.toLocaleString('es-CO');

  function renderCart() {
    const count = [...cartItems.values()].reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = String(count);
    cartList.replaceChildren(...[...cartItems.entries()].map(([key, item]) => {
      const li = document.createElement('li');
      li.dataset.key = key;
      const img = Object.assign(document.createElement('img'), { src: item.img, alt: '', width: 56, height: 56 });
      const info = document.createElement('div');
      info.append(Object.assign(document.createElement('strong'), { textContent: item.title }), Object.assign(document.createElement('small'), { textContent: item.price }));
      const qty = document.createElement('div');
      qty.className = 'ls-qty';
      const minus = Object.assign(document.createElement('button'), { type: 'button', textContent: '−', className: 'ls-qty-btn' });
      minus.dataset.cartAct = 'minus'; minus.setAttribute('aria-label', `Quitar una unidad de ${item.title}`);
      const plus = Object.assign(document.createElement('button'), { type: 'button', textContent: '+', className: 'ls-qty-btn' });
      plus.dataset.cartAct = 'plus'; plus.setAttribute('aria-label', `Agregar una unidad de ${item.title}`);
      qty.append(minus, Object.assign(document.createElement('span'), { textContent: String(item.qty) }), plus);
      const remove = Object.assign(document.createElement('button'), { type: 'button', className: 'ls-remove' });
      remove.dataset.cartAct = 'remove'; remove.setAttribute('aria-label', `Eliminar ${item.title} del carrito`);
      remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3"/></svg>';
      li.append(img, info, qty, remove);
      return li;
    }));
    cartEmpty.hidden = cartItems.size > 0;
    payButton.disabled = cartItems.size === 0;
    const total = [...cartItems.values()].reduce((sum, item) => sum + toNumber(item.price) * item.qty, 0);
    cartTotal.textContent = cartItems.size && !total ? 'A cotizar' : money(total);
  }
  function openCart() { minicart.hidden = false; requestAnimationFrame(() => minicart.classList.add('is-open')); cartOpen.setAttribute('aria-expanded', 'true'); }
  function closeCart() { minicart.classList.remove('is-open'); cartOpen.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!minicart.classList.contains('is-open')) minicart.hidden = true; }, reduced.matches ? 0 : 260); }

  cardsBox.addEventListener('click', event => {
    const add = event.target instanceof Element && event.target.closest('.ls-add');
    if (!add || !features.has('cart')) return;
    const card = add.closest('.ls-card');
    const key = `${state.sector}-${[...cardsBox.children].indexOf(card)}`;
    const item = cartItems.get(key) || { title: card.querySelector('strong').textContent, price: card.querySelector('small').textContent, img: card.querySelector('img').src, qty: 0 };
    item.qty = Math.min(99, item.qty + 1);
    cartItems.set(key, item);
    renderCart();
    const badge = cartCount.parentElement;
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    add.classList.remove('added'); void add.offsetWidth; add.classList.add('added');
    openCart();
    cartList.querySelector(`[data-key="${key}"]`)?.classList.add('is-new');
  });
  cartOpen.addEventListener('click', () => { if (minicart.classList.contains('is-open')) closeCart(); else openCart(); });
  lab.querySelector('[data-lab-cart-close]').addEventListener('click', closeCart);
  cartList.addEventListener('click', event => {
    const button = event.target instanceof Element && event.target.closest('[data-cart-act]');
    if (!button) return;
    const li = button.closest('li');
    const item = cartItems.get(li.dataset.key);
    const act = button.dataset.cartAct;
    if (act === 'plus') { item.qty = Math.min(99, item.qty + 1); renderCart(); return; }
    if (act === 'minus' && item.qty > 1) { item.qty -= 1; renderCart(); return; }
    // Eliminar: la fila sale con animación y luego se quita.
    li.classList.add('is-leaving');
    setTimeout(() => { cartItems.delete(li.dataset.key); renderCart(); }, reduced.matches ? 0 : 280);
  });
  payButton.addEventListener('click', () => {
    minicart.classList.add('is-paid');
    cartList.replaceChildren(Object.assign(document.createElement('li'), { className: 'ls-paid', textContent: 'Pedido de ejemplo listo. En tu web, aquí se conecta el pago en línea.' }));
    payButton.disabled = true;
    setTimeout(() => { cartItems.clear(); minicart.classList.remove('is-paid'); renderCart(); closeCart(); }, 2600);
  });
  renderCart();

  lab.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => {
    frame.dataset.device = button.dataset.device;
    lab.querySelectorAll('[data-device]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));

  const pick = list => list[Math.floor(Math.random() * list.length)];
  const shuffleButton = lab.querySelector('[data-lab-shuffle]');
  shuffleButton.addEventListener('click', () => {
    const randomize = () => {
      Object.keys(state).forEach(key => { state[key] = pick(Object.keys(key === 'sector' ? sectors : labels[key])); });
    };
    const finish = () => {
      randomize();
      features.clear();
      Object.keys(featureNames).forEach(key => { if (Math.random() > .45) features.add(key); });
      applyState(true); applyFeatures();
      shuffleButton.disabled = false;
    };
    if (reduced.matches || document.body.classList.contains('motion-paused')) { finish(); return; }
    // Una ruleta corta antes de quedarse con una combinación.
    shuffleButton.disabled = true;
    shuffleButton.classList.add('is-rolling');
    let spins = 0;
    const roll = setInterval(() => {
      ['color', 'type', 'shape', 'mode'].forEach(key => { state[key] = pick(Object.keys(labels[key])); });
      applyState(false);
      if (++spins >= 7) { clearInterval(roll); shuffleButton.classList.remove('is-rolling'); finish(); }
    }, 110);
  });

  // "Quiero una web así" abre el formulario con la combinación ya escrita.
  const sendButton = lab.querySelector('[data-lab-send]');
  const description = document.getElementById('project-description');
  let lastPrefill = '';
  sendButton.addEventListener('click', () => {
    if (!description) return;
    const text = `Me gustó esta combinación del laboratorio: ${describe()}\n\nMi negocio es…`;
    if (!description.value.trim() || description.value === lastPrefill) {
      description.value = text;
      lastPrefill = text;
    }
  });

  applyState(false);
  applyFeatures();
})();
