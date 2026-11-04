'use strict';
// Valeria Ríos: casos ampliados, laboratorio de paleta y carta mensual de ejemplo.
// Se carga después de extra.js y solo añade comportamiento; nada se envía ni se guarda fuera del navegador.
(() => {
  const byId = id => document.getElementById(id);
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ---------- Casos de estudio ---------- */
  const cases = {
    botanica: {
      facts: [['Sector', 'Cosmética botánica'], ['Alcance', 'Estrategia, identidad y packaging'], ['Duración estimada', '6 semanas']],
      chapters: [
        ['Reto', 'Raíz tenía buenos productos y una comunidad pequeña pero fiel. Su imagen, en cambio, se parecía a la de cualquier marca «natural»: verde, hojas y tipografía redonda. Necesitaba distinguirse sin perder la calidez.'],
        ['Enfoque', 'Partimos del gesto diario (abrir un frasco, aplicar, respirar) y lo convertimos en el centro del relato. La paleta sale de la piedra, el ámbar y la hoja seca; la tipografía editorial aporta calma, y el packaging deja aire alrededor del producto.'],
        ['Resultado', 'Una marca que se reconoce en el estante y en redes. El equipo tiene una guía para fotografiar, escribir y lanzar productos sin empezar de cero cada vez.']
      ],
      palette: [['Piedra', '#c9b79c'], ['Ámbar', '#8a5a2b'], ['Hoja seca', '#3f4a3a'], ['Lino', '#efe8dc']]
    },
    hotel: {
      facts: [['Sector', 'Hotel boutique'], ['Alcance', 'Narrativa, fotografía y web'], ['Duración estimada', '8 semanas']],
      chapters: [
        ['Reto', 'Las fotos y los textos de Casa Nativa decían lo mismo que los de cualquier hotel: habitaciones, desayuno, wifi. Lo especial, el patio, el ritmo lento y la gente, no aparecía por ningún lado.'],
        ['Enfoque', 'Organizamos la historia como una visita: la llegada, el patio, quedarse. Una voz cercana, fotografía de luz natural, materiales y manos, y una web donde reservar es la consecuencia de imaginarse allí.'],
        ['Resultado', 'Un relato que el equipo repite con naturalidad en la recepción y en redes, y una estructura de contenido lista para crecer con nuevas experiencias.']
      ],
      palette: [['Terracota', '#b4583a'], ['Cal', '#f1e6d6'], ['Patio', '#4d6b3c'], ['Madera', '#6b4a32']]
    },
    taller: {
      facts: [['Sector', 'Talleres creativos'], ['Alcance', 'Propuesta de valor y sistema visual'], ['Duración estimada', '5 semanas']],
      chapters: [
        ['Reto', 'Los talleres funcionaban muy bien en la sala, pero eran difíciles de explicar antes: «una sesión creativa» no le dice a nadie qué va a pasar ni qué se lleva.'],
        ['Enfoque', 'Pusimos el proceso al frente: una pregunta compartida, materiales sencillos y decisiones en equipo. Un sistema modular de tarjetas, notas y flechas que sirve igual para una propuesta, una diapositiva o una invitación.'],
        ['Resultado', 'Una propuesta de valor que se entiende en una frase y un kit de piezas para presentar talleres y programas con la misma voz.']
      ],
      palette: [['Tinta', '#1f3a5f'], ['Nota', '#f2c94c'], ['Papel', '#f6f3ec'], ['Coral', '#e2725b']]
    }
  };

  const luminance = hex => {
    const value = parseInt(hex.slice(1), 16);
    return [value >> 16, (value >> 8) & 255, value & 255]
      .map(channel => { const c = channel / 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; })
      .reduce((sum, c, index) => sum + c * [.2126, .7152, .0722][index], 0);
  };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
  const readableOn = hex => (contrast(hex, '#1a1530') >= contrast(hex, '#ffffff') ? '#1a1530' : '#ffffff');

  const detail = byId('vr-case-detail');
  const dialog = byId('portfolio-dialog');
  const caseButtons = [...document.querySelectorAll('[data-portfolio-case]')];
  let currentCase = null;
  caseButtons.forEach(button => button.addEventListener('click', () => {
    const data = cases[button.dataset.portfolioCase];
    if (!data || !detail) return;
    currentCase = button;
    const facts = el('dl', 'vr-case-facts');
    data.facts.forEach(([term, value]) => { const row = el('div'); row.append(el('dt', '', term), el('dd', '', value)); facts.append(row); });
    const chapters = el('ol', 'vr-chapters');
    data.chapters.forEach(([title, text], index) => {
      const item = el('li');
      const heading = el('h4');
      heading.append(el('small', '', `0${index + 1}`), document.createTextNode(title));
      item.append(heading, el('p', '', text));
      chapters.append(item);
    });
    const palette = el('div', 'vr-case-palette');
    palette.setAttribute('aria-label', 'Paleta de la marca');
    palette.setAttribute('role', 'list');
    data.palette.forEach(([name, hex]) => {
      const chip = el('span');
      chip.setAttribute('role', 'listitem');
      chip.style.background = hex;
      chip.style.color = readableOn(hex);
      chip.append(document.createTextNode(name), el('small', '', hex.toUpperCase()));
      palette.append(chip);
    });
    detail.replaceChildren(facts, chapters, palette);
    const link = byId('portfolio-case-link');
    if (link) link.href = 'auto-personal.html';
    dialog?.scrollTo?.(0, 0);
  }));
  byId('vr-case-next')?.addEventListener('click', () => {
    if (!currentCase || !dialog) return;
    const next = caseButtons[(caseButtons.indexOf(currentCase) + 1) % caseButtons.length];
    dialog.close();
    next.click();
  });

  /* ---------- Laboratorio de paleta ---------- */
  const stage = byId('vr-lab-stage');
  if (stage) {
    const moods = {
      serena: { label: 'Serena', tagline: 'Hecho con calma', colors: ['#2f3e5c', '#c9d6df', '#141a28', '#f4f1ea'] },
      calida: { label: 'Cálida', tagline: 'Como en casa', colors: ['#b4583a', '#f2c18d', '#3b2418', '#fbf3e8'] },
      audaz: { label: 'Audaz', tagline: 'Sin pedir permiso', colors: ['#6747c7', '#ffd36b', '#16112b', '#f6f2ea'] },
      natural: { label: 'Natural', tagline: 'Crece despacio', colors: ['#4d6b3c', '#d9c7a3', '#1f2a1b', '#f3efe4'] }
    };
    const fonts = {
      serif: { family: "Georgia, 'Times New Roman', serif", weight: 400, track: '-.04em' },
      sans: { family: 'Archivo, Manrope, Arial, sans-serif', weight: 800, track: '-.05em' }
    };
    const roles = ['Principal', 'Acento', 'Tinta', 'Fondo'];
    const nameInput = byId('vr-lab-name');
    const moodBox = byId('vr-lab-moods');
    const swatchBox = byId('vr-lab-swatches');
    const hexList = byId('vr-lab-hexes');
    const status = byId('vr-lab-status');
    const state = { mood: 'audaz', font: 'serif', colors: [...moods.audaz.colors] };

    const hslToHex = (h, s, l) => {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    Object.entries(moods).forEach(([key, mood]) => {
      const chip = el('button', 'vr-chip');
      chip.type = 'button';
      chip.dataset.mood = key;
      const dots = el('span', 'vr-chip-dots');
      dots.setAttribute('aria-hidden', 'true');
      mood.colors.slice(0, 3).forEach(color => { const dot = el('b'); dot.style.background = color; dots.append(dot); });
      chip.append(dots, document.createTextNode(mood.label));
      chip.addEventListener('click', () => { state.mood = key; state.colors = [...mood.colors]; render(`Carácter ${mood.label.toLowerCase()}: paleta y forma actualizadas.`); });
      moodBox.append(chip);
    });

    document.querySelectorAll('#vr-lab-fonts [data-font]').forEach(button => button.addEventListener('click', () => {
      state.font = button.dataset.font;
      render(state.font === 'serif' ? 'Tipografía editorial: serena y con historia.' : 'Tipografía moderna: directa y contundente.');
    }));

    byId('vr-lab-shuffle').addEventListener('click', () => {
      const hue = Math.floor(Math.random() * 360);
      const offset = [150, 40, 200, 320][Math.floor(Math.random() * 4)];
      state.colors = [hslToHex(hue, 52, 40), hslToHex((hue + offset) % 360, 82, 70), hslToHex(hue, 38, 12), hslToHex(hue, 32, 95)];
      render('Nueva mezcla lista. Toca un tono para hacerlo principal.');
    });

    byId('vr-lab-copy').addEventListener('click', async () => {
      const text = state.colors.map((color, index) => `${roles[index]}: ${color.toUpperCase()}`).join('\n');
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = 'Paleta copiada al portapapeles.';
      } catch {
        status.textContent = `Tu paleta: ${state.colors.map(color => color.toUpperCase()).join(' · ')}`;
      }
    });

    nameInput.addEventListener('input', () => render());

    function render(message) {
      const [primary, accent, ink, paper] = state.colors;
      const name = nameInput.value.trim() || 'Tu marca';
      const font = fonts[state.font];
      stage.style.setProperty('--lab-1', primary);
      stage.style.setProperty('--lab-2', accent);
      stage.style.setProperty('--lab-3', ink);
      stage.style.setProperty('--lab-4', paper);
      stage.style.setProperty('--lab-font', font.family);
      stage.style.setProperty('--lab-weight', font.weight);
      stage.style.setProperty('--lab-track', font.track);
      stage.dataset.mood = state.mood;
      // El texto del post y de la tarjeta siempre se mantiene legible, sin importar el tono elegido.
      stage.querySelector('.vr-mock-post').style.color = contrast(primary, paper) >= contrast(primary, ink) ? paper : ink;
      stage.querySelector('.vr-mock-card strong').style.color = contrast(primary, paper) >= 3 ? primary : ink;
      stage.querySelectorAll('[data-lab-name]').forEach(node => { node.textContent = name; });
      stage.querySelectorAll('[data-lab-initial]').forEach(node => { node.textContent = name.charAt(0).toUpperCase(); });
      stage.querySelectorAll('[data-lab-tagline]').forEach(node => { node.textContent = moods[state.mood].tagline; });
      stage.setAttribute('aria-label', `Vista previa de ${name}: carácter ${moods[state.mood].label.toLowerCase()}, tipografía ${state.font === 'serif' ? 'editorial' : 'moderna'}, color principal ${primary.toUpperCase()}.`);

      moodBox.querySelectorAll('[data-mood]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.mood === state.mood)));
      document.querySelectorAll('#vr-lab-fonts [data-font]').forEach(chip => chip.setAttribute('aria-pressed', String(chip.dataset.font === state.font)));

      swatchBox.replaceChildren(...state.colors.map((color, index) => {
        const swatch = el('button', 'vr-sw');
        swatch.type = 'button';
        swatch.style.background = color;
        swatch.setAttribute('aria-pressed', String(index === 0));
        swatch.setAttribute('aria-label', `${roles[index]} ${color.toUpperCase()}${index === 0 ? ', color principal actual' : ', usar como principal'}`);
        swatch.addEventListener('click', () => {
          if (index === 0) return;
          [state.colors[0], state.colors[index]] = [state.colors[index], state.colors[0]];
          render(`${color.toUpperCase()} ahora es el color principal.`);
          swatchBox.querySelector('.vr-sw')?.focus({ preventScroll: true });
        });
        return swatch;
      }));
      hexList.replaceChildren(...state.colors.map((color, index) => {
        const item = el('li', '', `${roles[index]} · ${color.toUpperCase()}`);
        item.style.background = color;
        item.style.color = readableOn(color);
        return item;
      }));
      if (message) status.textContent = message;
    }
    render();
  }

  /* ---------- Carta mensual (simulada) ---------- */
  const letter = byId('vr-letter');
  if (letter) {
    const input = byId('vr-letter-email');
    const status = byId('vr-letter-status');
    letter.addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      input.setAttribute('aria-invalid', String(!valid));
      status.classList.toggle('is-error', !valid);
      if (!valid) {
        status.textContent = 'Revisa el correo: parece que le falta algo (por ejemplo, nombre@correo.com).';
        input.focus();
        return;
      }
      status.textContent = 'Listo. En el sitio real, la primera carta llegaría el próximo mes. (Ejemplo: no se envió nada.)';
      letter.reset();
      input.removeAttribute('aria-invalid');
    });
  }
})();
