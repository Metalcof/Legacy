'use strict';

const demoStudioName = window.SITE_CONFIG && typeof window.SITE_CONFIG.name === 'string' && window.SITE_CONFIG.name.trim() ? window.SITE_CONFIG.name.trim() : 'Cromathic Studio';
document.querySelectorAll('[data-brand]').forEach((element) => { element.textContent = demoStudioName; });
document.title = document.title.replace('Cromathic Studio', demoStudioName);
const demoDescription = document.querySelector('meta[name="description"]');
if (demoDescription) demoDescription.content = demoDescription.content.replace('Cromathic Studio', demoStudioName);

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

// Dialogs with an exit animation expose `animatedClose`; the rest close at once.
function requestDialogClose(dialog) {
  if (typeof dialog.animatedClose === 'function') dialog.animatedClose();
  else dialog.close();
}
document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => requestDialogClose(button.closest('dialog')));
});
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) requestDialogClose(dialog);
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
  const maxPerColor = 99;
  const undoDuration = 5000;
  const cartDialog = document.getElementById('cart-dialog');
  const itemsList = document.getElementById('cart-items');
  const emptyState = document.getElementById('cart-empty');
  const doneState = document.getElementById('cart-done');
  const footer = document.getElementById('cart-foot');
  const checkoutButton = document.getElementById('cart-checkout');
  const closeButton = cartDialog.querySelector('.dialog-close');
  const undoBar = document.getElementById('cart-undo');
  const undoText = document.getElementById('cart-undo-text');
  const undoButton = document.getElementById('cart-undo-button');
  const liveRegion = document.getElementById('cart-live');
  const toast = document.getElementById('cart-toast');
  const headerTrigger = document.querySelector('.site-nav [data-open-cart]');
  const floatingTrigger = document.querySelector('.cart-fab');
  const addButton = document.getElementById('add-cart');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => motionQuery.matches;
  const formatPrice = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  const productName = (color) => `Wave One ${palette[color].name}`;
  const pluralItems = (count) => `${count} ${count === 1 ? 'artículo' : 'artículos'}`;
  const imageFor = (color) => `../assets/headphones-${color}.webp`;
  const icons = {
    minus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9"/></svg>',
    trash: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 5.5l.8 10.6a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L15 5.5M8.3 8.5v6M11.7 8.5v6"/></svg>',
  };

  let selected = 'lavanda';
  let cart = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      Object.keys(saved).forEach((color) => {
        if (palette[color] && Number.isInteger(saved[color]) && saved[color] > 0 && saved[color] <= maxPerColor) cart[color] = saved[color];
      });
    }
  } catch (_) { /* The demo stays usable when browser storage is unavailable. */ }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (_) { /* Keep the in-memory bag available. */ }
  }
  const countItems = () => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  // Small motion helpers. CSS reduced-motion rules do not reach the Web Animations API, so every call checks it.
  function tick(element, direction = 0) {
    if (reducedMotion() || !cartDialog.open) return;
    element.animate([{ transform: `translateY(${direction * 7}px)`, opacity: 0.15 }, { transform: 'none', opacity: 1 }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function setAnimatedText(element, text, direction = 0) {
    if (element.textContent === text) return;
    element.textContent = text;
    tick(element, direction);
  }
  function announce(message) {
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 30);
  }

  // Cart lines are kept in the DOM and updated in place so focus and exit animations survive re-renders.
  const lines = new Map();
  function buildLine(color) {
    const line = document.createElement('li');
    line.className = 'cart-line';
    line.dataset.line = color;
    line.style.setProperty('--tile', palette[color].light);
    line.innerHTML = `<div class="cart-thumb"><img src="${imageFor(color)}" alt="" width="88" height="88" decoding="async"></div>
      <div class="cart-line-info">
        <div class="cart-line-head"><h3>Wave One</h3><span class="cart-line-total"></span></div>
        <p class="cart-line-meta"><span class="cart-swatch" aria-hidden="true"></span>${palette[color].name}<span class="cart-line-unit">${formatPrice(unitPrice)} c/u</span></p>
        <div class="cart-line-actions">
          <div class="cart-stepper" role="group" aria-label="Cantidad de ${productName(color)}">
            <button type="button" class="cart-step" data-cart-color="${color}" data-cart-action="minus">${icons.minus}</button>
            <span class="cart-qty"></span>
            <button type="button" class="cart-step" data-cart-color="${color}" data-cart-action="plus">${icons.plus}</button>
          </div>
          <button type="button" class="cart-remove" data-cart-color="${color}" data-cart-action="remove" aria-label="Eliminar ${productName(color)}" title="Eliminar">${icons.trash}</button>
        </div>
      </div>`;
    return {
      el: line,
      quantity: line.querySelector('.cart-qty'),
      total: line.querySelector('.cart-line-total'),
      minus: line.querySelector('[data-cart-action="minus"]'),
      plus: line.querySelector('[data-cart-action="plus"]'),
      remove: line.querySelector('[data-cart-action="remove"]'),
    };
  }
  function updateLine(color) {
    const node = lines.get(color);
    const quantity = cart[color];
    const previous = Number(node.quantity.textContent) || quantity;
    setAnimatedText(node.quantity, String(quantity), Math.sign(quantity - previous));
    setAnimatedText(node.total, formatPrice(unitPrice * quantity));
    node.minus.setAttribute('aria-label', quantity === 1 ? `Quitar ${productName(color)} de la bolsa` : `Reducir cantidad de ${productName(color)}`);
    node.plus.setAttribute('aria-label', `Aumentar cantidad de ${productName(color)}`);
    node.plus.disabled = quantity >= maxPerColor;
  }
  function lineKeyframes(element, hidden) {
    const styles = getComputedStyle(element);
    const height = `${element.offsetHeight}px`;
    const open = { height, paddingTop: styles.paddingTop, paddingBottom: styles.paddingBottom, borderBottomWidth: styles.borderBottomWidth };
    const closed = { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px' };
    return [
      { ...open, opacity: 1, transform: 'none', easing: 'cubic-bezier(.4,0,1,1)' },
      { ...open, opacity: 0, transform: hidden, offset: 0.42, easing: 'cubic-bezier(.3,0,.2,1)' },
      { ...closed, opacity: 0, transform: hidden },
    ];
  }
  function enterLine(element) {
    element.classList.add('no-enter');
    if (reducedMotion()) return;
    element.style.overflow = 'hidden';
    const animation = element.animate(lineKeyframes(element, 'translateX(32px)').reverse().map((frame, index) => ({ ...frame, offset: [0, 0.58, 1][index], easing: index === 0 ? 'cubic-bezier(.3,0,.2,1)' : 'cubic-bezier(.2,.8,.2,1)' })), { duration: 480 });
    animation.finished.catch(() => {}).then(() => { element.style.overflow = ''; });
  }
  function leaveLine(color, delay) {
    const node = lines.get(color);
    if (!node) return Promise.resolve();
    lines.delete(color);
    const element = node.el;
    element.classList.add('is-leaving');
    element.inert = true;
    if (reducedMotion()) { element.remove(); return Promise.resolve(); }
    element.style.overflow = 'hidden';
    const animation = element.animate(lineKeyframes(element, 'translateX(44px)'), { duration: 500, delay, fill: 'both' });
    return animation.finished.catch(() => {}).then(() => element.remove());
  }
  function syncLines(entering = []) {
    const order = Object.keys(cart);
    order.forEach((color, index) => {
      if (!lines.has(color)) {
        const node = buildLine(color);
        lines.set(color, node);
        const nextColor = order.slice(index + 1).find((other) => lines.has(other));
        itemsList.insertBefore(node.el, nextColor ? lines.get(nextColor).el : null);
        if (entering.includes(color)) enterLine(node.el);
      }
      updateLine(color);
    });
    lines.forEach((node, color) => {
      if (!(color in cart)) { node.el.remove(); lines.delete(color); }
    });
    [...lines.values()].forEach((node, index) => node.el.style.setProperty('--i', index));
  }

  function renderBadges(count = countItems()) {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = count;
      badge.dataset.empty = String(count === 0);
    });
    if (floatingTrigger) floatingTrigger.setAttribute('aria-label', `Abrir mi bolsa, ${pluralItems(count)}`);
  }
  function renderSummary(updateBadges = true) {
    const count = countItems();
    const total = formatPrice(unitPrice * count);
    if (updateBadges) renderBadges(count);
    document.getElementById('cart-head-count').textContent = pluralItems(count);
    document.getElementById('cart-sub-label').textContent = `Subtotal · ${pluralItems(count)}`;
    setAnimatedText(document.getElementById('cart-subtotal'), total);
    setAnimatedText(document.getElementById('cart-total'), total);
    checkoutButton.disabled = count === 0;
    const isDone = cartDialog.dataset.view === 'done';
    const stillLeaving = Boolean(itemsList.querySelector('.is-leaving'));
    itemsList.hidden = isDone;
    doneState.hidden = !isDone;
    emptyState.hidden = isDone || count > 0 || stillLeaving;
    footer.hidden = isDone || (count === 0 && !stillLeaving);
  }

  // Undo snackbar: one pending action at a time, ~5 s, paused while the pointer rests on it.
  let pendingUndo = null;
  let undoTimer = 0;
  let undoStarted = 0;
  let undoRemaining = 0;
  function startUndoTimer(duration) {
    window.clearTimeout(undoTimer);
    undoRemaining = duration;
    undoStarted = performance.now();
    undoTimer = window.setTimeout(() => hideUndo(), duration);
  }
  function focusFallback() {
    const target = itemsList.querySelector('.cart-line:not(.is-leaving) [data-cart-action]')
      || (!emptyState.hidden && emptyState.querySelector('button'))
      || (!footer.hidden && !checkoutButton.disabled && checkoutButton)
      || closeButton;
    target.focus({ preventScroll: true });
  }
  function showUndo(message, snapshot) {
    pendingUndo = snapshot;
    undoText.textContent = message;
    undoBar.classList.remove('is-visible', 'is-paused');
    void undoBar.offsetWidth; // Restart the countdown bar.
    undoBar.classList.add('is-visible');
    startUndoTimer(undoDuration);
    undoButton.focus({ preventScroll: true });
  }
  function hideUndo({ restoreFocus = true } = {}) {
    window.clearTimeout(undoTimer);
    pendingUndo = null;
    const hadFocus = undoBar.contains(document.activeElement);
    undoBar.classList.remove('is-visible', 'is-paused');
    if (hadFocus && restoreFocus && cartDialog.open) focusFallback();
  }
  undoBar.addEventListener('pointerenter', () => {
    if (!pendingUndo || undoBar.classList.contains('is-paused')) return;
    window.clearTimeout(undoTimer);
    undoRemaining -= performance.now() - undoStarted;
    undoBar.classList.add('is-paused');
  });
  undoBar.addEventListener('pointerleave', () => {
    if (!pendingUndo || !undoBar.classList.contains('is-paused')) return;
    undoBar.classList.remove('is-paused');
    startUndoTimer(Math.max(undoRemaining, 1200));
  });
  undoButton.addEventListener('click', () => {
    if (!pendingUndo) return;
    const { order, removed, restoredMessage } = pendingUndo;
    const restored = [];
    removed.forEach(([color, quantity]) => {
      if (!lines.has(color)) restored.push(color);
      cart[color] = Math.min(maxPerColor, (cart[color] || 0) + quantity);
    });
    const ordered = {};
    [...order, ...Object.keys(cart)].forEach((color) => { if (color in cart && !(color in ordered)) ordered[color] = cart[color]; });
    cart = ordered;
    persist();
    hideUndo({ restoreFocus: false });
    syncLines(restored);
    renderSummary();
    const first = lines.get(removed[0][0]);
    if (first) {
      first.remove.focus({ preventScroll: true });
      first.el.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
    announce(restoredMessage);
  });

  function removeColors(colors, message, restoredMessage) {
    const valid = colors.filter((color) => color in cart);
    if (!valid.length) return;
    const snapshot = { order: Object.keys(cart), removed: valid.map((color) => [color, cart[color]]), restoredMessage };
    valid.forEach((color) => { delete cart[color]; });
    persist();
    const leaving = valid.map((color, index) => leaveLine(color, index * 70));
    renderSummary();
    showUndo(message, snapshot);
    Promise.all(leaving).then(() => renderSummary());
  }

  itemsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-cart-action]');
    if (!button || button.disabled) return;
    const { cartColor: color, cartAction: action } = button.dataset;
    if (!(color in cart)) return;
    if (action === 'remove' || (action === 'minus' && cart[color] === 1)) {
      removeColors([color], `${productName(color)} eliminado`, `${productName(color)} vuelve a tu bolsa`);
      return;
    }
    if (action === 'minus') cart[color] -= 1;
    else if (action === 'plus' && cart[color] < maxPerColor) cart[color] += 1;
    persist();
    updateLine(color);
    renderSummary();
    announce(`${productName(color)}: ${cart[color]} ${cart[color] === 1 ? 'unidad' : 'unidades'}`);
    if (button.disabled) lines.get(color).minus.focus();
  });
  document.getElementById('cart-clear').addEventListener('click', () => {
    removeColors(Object.keys(cart), 'Bolsa vaciada', 'Tu bolsa está de vuelta');
  });

  checkoutButton.addEventListener('click', () => {
    const count = countItems();
    if (!count) return;
    hideUndo({ restoreFocus: false });
    document.getElementById('cart-order-id').textContent = `WAV-${String(Math.floor(1000 + Math.random() * 9000))}`;
    document.getElementById('cart-done-count').textContent = pluralItems(count);
    document.getElementById('cart-done-total').textContent = formatPrice(unitPrice * count);
    cart = {};
    persist();
    cartDialog.dataset.view = 'done';
    syncLines();
    renderSummary();
    document.getElementById('cart-done-title').focus({ preventScroll: true });
  });

  // Opening and closing: the drawer animates out before the native dialog actually closes.
  let closing = false;
  let closeTimer = 0;
  const afterClose = [];
  function finishClose() {
    if (!closing) return;
    closing = false;
    window.clearTimeout(closeTimer);
    cartDialog.classList.remove('is-closing');
    if (cartDialog.open) cartDialog.close();
  }
  function closeCart(callback) {
    if (callback) afterClose.push(callback);
    if (!cartDialog.open) { afterClose.splice(0).forEach((run) => run()); return; }
    if (closing) return;
    if (reducedMotion()) { cartDialog.close(); return; }
    closing = true;
    cartDialog.classList.add('is-closing');
    closeTimer = window.setTimeout(finishClose, 520);
  }
  cartDialog.animatedClose = () => closeCart();
  cartDialog.addEventListener('animationend', (event) => {
    if (closing && event.target === cartDialog && !event.pseudoElement && /^wav(Drawer|Sheet)Out$/.test(event.animationName)) finishClose();
  });
  cartDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeCart();
  });
  cartDialog.addEventListener('close', () => {
    closing = false;
    window.clearTimeout(closeTimer);
    cartDialog.classList.remove('is-closing');
    hideUndo({ restoreFocus: false });
    itemsList.querySelectorAll('.no-enter').forEach((line) => line.classList.remove('no-enter'));
    if (cartDialog.dataset.view === 'done') { cartDialog.dataset.view = 'cart'; renderSummary(); }
    afterClose.splice(0).forEach((run) => run());
  });
  function openCart() {
    hideToast();
    if (cartDialog.open) return;
    cartDialog.dataset.view = 'cart';
    syncLines();
    renderSummary();
    cartDialog.showModal();
  }
  document.querySelectorAll('[data-open-cart]').forEach((button) => button.addEventListener('click', openCart));
  emptyState.querySelector('[data-cart-browse]').addEventListener('click', () => {
    closeCart(() => {
      document.getElementById('producto').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      addButton.focus({ preventScroll: true });
    });
  });

  // Floating bag: appears when the header button scrolls away, so there is always a visible target.
  if (floatingTrigger && headerTrigger && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      floatingTrigger.classList.toggle('is-visible', !entry.isIntersecting);
    }).observe(headerTrigger);
  }
  const isInView = (element) => {
    const bounds = element.getBoundingClientRect();
    return bounds.width > 0 && bounds.bottom > 0 && bounds.top < window.innerHeight;
  };
  const visibleTrigger = () => (isInView(headerTrigger) || !floatingTrigger ? headerTrigger : floatingTrigger);

  function bump(trigger) {
    const badge = trigger.querySelector('[data-cart-count]');
    if (!badge || reducedMotion()) return;
    badge.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.5)', offset: 0.3 },
      { transform: 'scale(.88)', offset: 0.62 },
      { transform: 'scale(1.06)', offset: 0.82 },
      { transform: 'scale(1)' },
    ], { duration: 620, easing: 'cubic-bezier(.3,.7,.4,1)' });
    const accent = getComputedStyle(document.body).getPropertyValue('--demo-accent').trim() || '#c3ff57';
    trigger.animate([{ boxShadow: `0 0 0 0 ${accent}73` }, { boxShadow: `0 0 0 12px ${accent}00` }], { duration: 650, easing: 'ease-out' });
  }
  function flyToBag(color, trigger) {
    const productImage = document.querySelector('.product-display img');
    if (reducedMotion() || !productImage) return Promise.resolve();
    const imageBounds = productImage.getBoundingClientRect();
    const source = isInView(productImage) && imageBounds.top > -imageBounds.height / 3 ? imageBounds : addButton.getBoundingClientRect();
    const target = (trigger.querySelector('[data-cart-count]') || trigger).getBoundingClientRect();
    const size = Math.round(Math.min(source.width, source.height, 300) * (source === imageBounds ? 0.6 : 1.4));
    const startX = source.left + source.width / 2 - size / 2;
    const startY = source.top + source.height / 2 - size / 2;
    const deltaX = target.left + target.width / 2 - (startX + size / 2);
    const deltaY = target.top + target.height / 2 - (startY + size / 2);
    const endScale = 18 / size;
    const flyer = document.createElement('div');
    flyer.className = 'cart-fly';
    flyer.setAttribute('aria-hidden', 'true');
    flyer.style.cssText = `left:${startX}px;top:${startY}px;width:${size}px;height:${size}px`;
    flyer.innerHTML = `<div class="cart-fly-y"><div class="cart-fly-item"><img src="${imageFor(color)}" alt=""></div></div>`;
    document.body.append(flyer);
    const duration = 680;
    const animations = [
      flyer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${deltaX}px)` }], { duration, easing: 'cubic-bezier(.45,0,.75,.55)', fill: 'forwards' }),
      flyer.firstElementChild.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${deltaY}px)` }], { duration, easing: 'cubic-bezier(.2,.6,.35,1)', fill: 'forwards' }),
      flyer.querySelector('.cart-fly-item').animate([
        { transform: 'scale(.82)', opacity: 0 },
        { transform: 'scale(1.04)', opacity: 1, offset: 0.16, easing: 'cubic-bezier(.5,0,.8,.4)' },
        { transform: `scale(${endScale * 1.3})`, opacity: 1, offset: 0.9 },
        { transform: `scale(${endScale})`, opacity: 0 },
      ], { duration, fill: 'forwards' }),
    ];
    return Promise.all(animations.map((animation) => animation.finished)).catch(() => {}).then(() => flyer.remove());
  }

  let toastTimer = 0;
  function hideToast() {
    window.clearTimeout(toastTimer);
    toast.classList.remove('visible');
  }
  function showToast(color, message) {
    document.getElementById('cart-toast-image').src = imageFor(color);
    toast.style.setProperty('--tile', palette[color].light);
    // Show the toast on the half of the screen the add button is not in, so it never covers it.
    const addBounds = addButton.getBoundingClientRect();
    toast.classList.toggle('is-top', addBounds.top + addBounds.height / 2 > window.innerHeight / 2);
    document.getElementById('cart-toast-text').textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, 3400);
  }
  toast.addEventListener('pointerenter', () => window.clearTimeout(toastTimer));
  toast.addEventListener('pointerleave', () => { if (toast.classList.contains('visible')) toastTimer = window.setTimeout(hideToast, 1600); });

  document.querySelectorAll('[data-color]').forEach((button) => {
    button.addEventListener('click', () => {
      selected = button.dataset.color;
      document.getElementById('color-name').textContent = palette[selected].name;
      document.querySelectorAll('[data-product-image]').forEach((productImage) => {
        productImage.src = imageFor(selected);
        productImage.alt = `Auriculares Wave One de acabado ${palette[selected].name.toLowerCase()}, fotografía de producto conceptual generada con IA`;
      });
      document.querySelectorAll('[data-color]').forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    });
  });

  let autoOpened = false;
  addButton.addEventListener('click', () => {
    const color = selected;
    const current = cart[color] || 0;
    if (current >= maxPerColor) { showToast(color, 'La cantidad máxima por acabado es 99.'); return; }
    const wasEmpty = countItems() === 0;
    cart[color] = current + 1;
    persist();
    syncLines();
    renderSummary(false);
    addButton.classList.remove('is-added');
    void addButton.offsetWidth;
    addButton.classList.add('is-added');
    const trigger = visibleTrigger();
    flyToBag(color, trigger).then(() => {
      renderBadges();
      bump(trigger);
      if (wasEmpty && !autoOpened) {
        autoOpened = true;
        window.setTimeout(openCart, reducedMotion() ? 0 : 140);
      } else {
        showToast(color, `${productName(color)} añadido a tu bolsa`);
      }
    });
  });

  syncLines();
  renderSummary();
}
