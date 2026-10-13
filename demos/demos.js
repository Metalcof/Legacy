'use strict';

const demoStudioName = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Nexo Studio';
document.querySelectorAll('[data-brand]').forEach((element) => { element.textContent = demoStudioName; });
document.title = document.title.replace('Nexo Studio', demoStudioName);
const demoDescription = document.querySelector('meta[name="description"]');
if (demoDescription) demoDescription.content = demoDescription.content.replace('Nexo Studio', demoStudioName);

const demoThemeButtons = document.querySelectorAll('button[data-demo-theme]');
if (demoThemeButtons.length) {
  const demoThemeNames = ['original', 'green', 'cyan', 'violet'];
  const demoPageName = document.body.classList.contains('store') ? 'store' : document.body.classList.contains('coffee') ? 'coffee' : 'architecture';
  const demoThemeStorageKey = `nexo-demo-theme-${demoPageName}-v1`;
  function applyDemoTheme(theme) {
    const validTheme = demoThemeNames.includes(theme) ? theme : 'original';
    document.body.dataset.demoTheme = validTheme;
    demoThemeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.demoTheme === validTheme)));
  }
  let initialDemoTheme = 'original';
  try { initialDemoTheme = localStorage.getItem(demoThemeStorageKey) || 'original'; } catch (_) { /* The controls also work without browser storage. */ }
  applyDemoTheme(initialDemoTheme);
  demoThemeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.dataset.demoTheme;
      applyDemoTheme(theme);
      try { localStorage.setItem(demoThemeStorageKey, theme); } catch (_) { /* Keep the selected theme for this visit. */ }
    });
  });
}

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
});

document.querySelectorAll('[data-menu-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.menuFilter;
    document.querySelectorAll('[data-menu-filter]').forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
    document.querySelectorAll('[data-menu-kind]').forEach((item) => { item.hidden = category !== 'all' && item.dataset.menuKind !== category; });
  });
});

const projectDialog = document.getElementById('project-dialog');
if (projectDialog) {
  const projects = {
    patio: { title: 'Casa del patio', description: 'Una vivienda de 240 m² que se organiza alrededor de un árbol existente. Las habitaciones miran al patio; los corredores abiertos y las celosías de madera permiten que la sombra y la ventilación formen parte del espacio. La propuesta integra arquitectura, vegetación y una terraza de uso cotidiano.', type: 'Vivienda unifamiliar + paisaje', materials: 'Travertino, concreto, madera y vidrio', idea: 'El patio como una habitación más', stage: 'Anteproyecto' },
    refugio: { title: 'Loft Luz', description: 'Una rehabilitación de 180 m² que reúne vivienda y estudio en una estructura de doble altura. La escalera de roble conecta la zona común con el altillo, mientras las ventanas industriales conservan la amplitud y la entrada de luz del edificio. El trabajo se concentra en distribución, materialidad y mobiliario.', type: 'Rehabilitación de vivienda y estudio', materials: 'Roble, piedra natural y acero', idea: 'Vivir y trabajar en una doble altura', stage: 'Desarrollo de diseño' },
  };
  document.querySelectorAll('[data-project]').forEach((button) => {
    button.addEventListener('click', () => {
      const project = projects[button.dataset.project];
      if (!project) return;
      document.getElementById('project-title').textContent = project.title;
      document.getElementById('project-description').textContent = project.description;
      document.getElementById('project-type').textContent = project.type;
      document.getElementById('project-materials').textContent = project.materials;
      document.getElementById('project-idea').textContent = project.idea;
      document.getElementById('project-stage').textContent = project.stage;
      projectDialog.showModal();
    });
  });
}

if (document.body.classList.contains('store')) {
  const palette = {
    lavanda: { name: 'Lavanda', light: '#afa0d7', dark: '#8973b4' },
    grafito: { name: 'Grafito', light: '#45454c', dark: '#29292f' },
    lima: { name: 'Lima', light: '#c9de84', dark: '#9daf59' },
  };
  const storageKey = 'nexo-wav-demo-cart-v1';
  const unitPrice = 349900;
  const cartDialog = document.getElementById('cart-dialog');
  const formatPrice = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  let selected = 'lavanda';
  let cart = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      Object.keys(palette).forEach((color) => {
        if (Number.isInteger(saved[color]) && saved[color] > 0 && saved[color] <= 99) cart[color] = saved[color];
      });
    }
  } catch (_) { /* The demo stays usable when browser storage is unavailable. */ }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (_) { /* Keep the in-memory bag available. */ }
  }
  function changeCart(color, action) {
    if (action === 'remove' || (action === 'minus' && cart[color] === 1)) delete cart[color];
    else if (action === 'minus') cart[color]--;
    else if (action === 'plus' && cart[color] < 99) cart[color]++;
    persist();
    renderCart();
    const target = document.querySelector(`[data-cart-color="${color}"][data-cart-action="${action}"]:not(:disabled)`) || document.querySelector('[data-cart-action]:not(:disabled)') || cartDialog.querySelector('[data-close-dialog]');
    target.focus();
  }
  function renderCart() {
    const container = document.getElementById('cart-items');
    container.replaceChildren();
    let count = 0;
    Object.entries(cart).forEach(([color, quantity]) => {
      count += quantity;
      const line = document.createElement('div');
      line.className = 'cart-line';
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = 'Wave One';
      const detail = document.createElement('p');
      detail.textContent = `Color: ${palette[color].name}`;
      const controls = document.createElement('div');
      controls.className = 'cart-controls';
      const minus = document.createElement('button');
      minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Reducir cantidad de Wave One ${palette[color].name}`);
      minus.dataset.cartColor = color; minus.dataset.cartAction = 'minus';
      minus.addEventListener('click', () => changeCart(color, 'minus'));
      const amount = document.createElement('span');
      amount.textContent = quantity;
      const plus = document.createElement('button');
      plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Aumentar cantidad de Wave One ${palette[color].name}`); plus.disabled = quantity >= 99;
      plus.dataset.cartColor = color; plus.dataset.cartAction = 'plus';
      plus.addEventListener('click', () => changeCart(color, 'plus'));
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'cart-remove'; remove.textContent = 'Eliminar'; remove.setAttribute('aria-label', `Eliminar Wave One ${palette[color].name}`);
      remove.dataset.cartColor = color; remove.dataset.cartAction = 'remove';
      remove.addEventListener('click', () => changeCart(color, 'remove'));
      controls.append(minus, amount, plus, remove);
      content.append(title, detail, controls);
      const price = document.createElement('span');
      price.style.fontSize = '13px'; price.textContent = formatPrice(unitPrice * quantity);
      line.append(content, price); container.append(line);
    });
    if (!count) {
      const empty = document.createElement('p'); empty.className = 'cart-empty'; empty.textContent = 'Tu bolsa está esperando un poco de color.'; container.append(empty);
    }
    document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = count; });
    document.getElementById('cart-total').textContent = formatPrice(unitPrice * count);
  }
  document.querySelectorAll('[data-color]').forEach((button) => {
    button.addEventListener('click', () => {
      selected = button.dataset.color;
      document.getElementById('color-name').textContent = palette[selected].name;
      document.querySelectorAll('[data-product-image]').forEach((productImage) => {
        productImage.src = `../assets/headphones-${selected}.webp`;
        productImage.alt = `Auriculares Wave One de acabado ${palette[selected].name.toLowerCase()}, fotografía de producto conceptual generada con IA`;
      });
      document.querySelectorAll('[data-color]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    });
  });
  document.querySelectorAll('[data-open-cart]').forEach((button) => button.addEventListener('click', () => { renderCart(); cartDialog.showModal(); }));
  let toastTimer;
  document.getElementById('add-cart').addEventListener('click', () => {
    const toast = document.getElementById('cart-toast');
    if ((cart[selected] || 0) >= 99) { toast.textContent = 'La cantidad máxima por acabado es 99.'; }
    else { cart[selected] = (cart[selected] || 0) + 1; persist(); renderCart(); toast.textContent = `Wave One ${palette[selected].name} añadido a tu bolsa`; }
    toast.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 2600);
  });
  renderCart();
}
