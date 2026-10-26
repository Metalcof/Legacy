'use strict';

(() => {
  const root = document.querySelector('.journey-section');
  if (!root) return;
  const panel = root.querySelector('#journey-panel');
  const tabs = [...root.querySelectorAll('[role="tab"][data-journey-step]')];
  const previousButton = root.querySelector('[data-journey-nav="previous"]');
  const nextButton = root.querySelector('[data-journey-nav="next"]');
  const status = root.querySelector('[data-journey-status]');
  if (!panel || tabs.length !== 4) return;

  const studio = typeof window.SITE_CONFIG?.name === 'string' && window.SITE_CONFIG.name.trim()
    ? window.SITE_CONFIG.name.trim() : 'Nuestro estudio';
  const palettes = {
    amber: { accent: '#b66a3e', ink: '#3a2a21', paper: '#f4eadc', name: 'Ámbar y crema' },
    olive: { accent: '#65764a', ink: '#29382c', paper: '#edf0e3', name: 'Oliva y arena' }
  };
  const steps = [
    {
      label: 'La idea',
      title: 'Todo empieza con algo que quieres hacer realidad.',
      description: 'Imaginemos a Lucía, la dueña de Maré: una cafetería con personalidad que quiere llevar su experiencia a internet.',
      content: () => `
        <div class="journey-idea-layout">
          <figure class="journey-image-frame">
            <img class="journey-photo" src="assets/case-cafe-barista.webp" alt="Una persona prepara café de especialidad en la barra de Maré, fotografía creada con IA" width="1200" height="900" loading="lazy" decoding="async">
            <figcaption><span>Maré, el punto de partida</span><strong>Una buena experiencia merece llegar más lejos.</strong></figcaption>
          </figure>
          <div class="journey-brief">
            <span class="journey-mini-label">El primer mensaje</span>
            <blockquote>“Tengo una cafetería. Quiero que las personas vean nuestra carta, conozcan el lugar y puedan preguntarnos por una mesa.”</blockquote>
            <span class="journey-brief-author">Lucía · dueña de Maré · personaje de ejemplo</span>
            <dl class="journey-brief-facts">
              <div><dt>El negocio</dt><dd>Café de especialidad y encuentros de barrio.</dd></div>
              <div><dt>La necesidad</dt><dd>Una web que muestre la carta y la esencia del lugar.</dd></div>
              <div><dt>El siguiente paso</dt><dd>Facilitar el contacto y las consultas sobre reservas.</dd></div>
            </dl>
            <p class="journey-takeaway">Puedes empezar así: con una idea y lo que necesitas conseguir.</p>
          </div>
        </div>`
    },
    {
      label: 'La conversación',
      title: 'Escuchamos tu negocio antes de pensar en pantallas.',
      description: 'Una conversación concreta convierte “quiero una página” en un proyecto claro. Definimos juntos qué debe ver y hacer tu visitante.',
      content: () => `
        <div class="journey-conversation-layout">
          <figure class="journey-image-frame journey-conversation-photo">
            <img class="journey-photo" src="assets/creative-conversation.webp" alt="Dos personas conversan sobre un proyecto creativo en un estudio, con ideas sobre la mesa" width="1200" height="900" loading="lazy" decoding="async">
            <figcaption><span>Primero, entender</span><strong>Buenas preguntas. Una dirección compartida.</strong></figcaption>
          </figure>
          <div class="journey-conversation">
            <div class="journey-chat-heading"><span class="journey-mini-label">Una conversación de ejemplo</span><span class="journey-chat-concept">Caso conceptual</span></div>
            <div class="journey-chat-message journey-chat-studio"><span data-journey-brand>Nuestro estudio</span><p>¿Qué te gustaría que hiciera alguien después de entrar a tu web?</p></div>
            <div class="journey-chat-message journey-chat-founder"><span>Lucía · Maré</span><p>Que vea la carta, se imagine aquí y nos escriba para preguntar por una mesa.</p></div>
            <div class="journey-chat-message journey-chat-studio"><span data-journey-brand>Nuestro estudio</span><p>¿Cómo quieres que se sienta? ¿Y cómo prefieres recibir esas consultas?</p></div>
            <div class="journey-chat-message journey-chat-founder"><span>Lucía · Maré</span><p>Cálida y tranquila, como nuestro café. Para las consultas, WhatsApp es lo más fácil.</p></div>
            <div class="journey-agreement"><span class="journey-mini-label">Ya tenemos una dirección</span><p>Una portada con carácter, una carta fácil de explorar, la historia del lugar y un contacto claro.</p></div>
          </div>
        </div>`
    },
    {
      label: 'La propuesta visual',
      title: 'Primero ves cómo se va a sentir tu nueva web.',
      description: 'Antes de programar, elegimos colores, tipografía, imágenes y distribución. Puedes opinar y ajustar la propuesta con una referencia visual real.',
      content: () => `
        <div class="journey-design-layout">
          <div class="journey-moodboard">
            <span class="journey-mini-label">Dirección visual, antes de construir</span>
            <h4>Cálida. Cercana.<br>Con tiempo para disfrutar.</h4>
            <p>Prueba dos formas de contar la misma historia.</p>
            <div class="journey-palette-options" role="group" aria-label="Paleta del concepto visual">
              <button type="button" class="journey-palette-button" data-journey-palette="amber" aria-pressed="true"><span class="journey-palette-dot journey-palette-amber" aria-hidden="true"></span>Ámbar y crema</button>
              <button type="button" class="journey-palette-button" data-journey-palette="olive" aria-pressed="false"><span class="journey-palette-dot journey-palette-olive" aria-hidden="true"></span>Oliva y arena</button>
            </div>
            <div class="journey-swatches" aria-label="Tres colores de la propuesta"><span data-journey-swatch="accent"><i aria-hidden="true"></i><small>Acento</small></span><span data-journey-swatch="ink"><i aria-hidden="true"></i><small>Texto</small></span><span data-journey-swatch="paper"><i aria-hidden="true"></i><small>Fondo</small></span></div>
            <div class="journey-type-sample"><span class="journey-mini-label">Tipografía: serif editorial</span><strong>maré.</strong><p>Un buen café. Un mejor momento.</p></div>
            <ul class="journey-design-decisions"><li>Fotografías que transmiten la esencia del lugar.</li><li>Una carta visible y sencilla de recorrer.</li><li>Un camino claro hacia el contacto.</li></ul>
          </div>
          <div class="journey-wireframe" role="img" aria-label="Propuesta visual de Maré: portada con fotografía, carta, historia y contacto">
            <div class="journey-browser-bar"><span aria-hidden="true"><i></i><i></i><i></i></span><span>maré / propuesta visual</span></div>
            <div class="journey-wireframe-nav"><strong>maré.</strong><span>La carta &nbsp; Nuestro espacio &nbsp; Contacto</span></div>
            <div class="journey-wireframe-hero"><div><span>Café, sin prisa.</span><h4>Un buen café.<br>Un <em>mejor</em><br>momento.</h4><p>Un espacio para hacer una pausa y disfrutar lo cotidiano.</p><span class="journey-design-button">Descubre la carta</span></div><img src="assets/cafe-editorial.webp" alt="" width="900" height="1200" loading="lazy" decoding="async"></div>
            <div class="journey-wireframe-blocks"><span><strong>Nuestra carta</strong><small>Elige tu próxima pausa.</small></span><span><strong>El espacio</strong><small>Conoce lo que nos mueve.</small></span><span><strong>Conversemos</strong><small>Tu mesa empieza aquí.</small></span></div>
            <div class="journey-wireframe-note">Distribución y estilo de ejemplo. Se ajustan contigo.</div>
          </div>
        </div>
        <p class="journey-design-status" data-journey-palette-status role="status" aria-live="polite">Propuesta visual con paleta Ámbar y crema.</p>`
    },
    {
      label: 'La web terminada',
      title: 'La idea ya tiene una web que puedes explorar.',
      description: 'Convertimos la propuesta en una experiencia que funciona en computador y celular. Recorre este ejemplo y prueba los filtros de su carta.',
      content: () => `
        <div class="journey-final-toolbar"><div><span class="journey-mini-label">Maré, web conceptual interactiva</span><p>Puedes navegar dentro de la vista previa.</p></div><a class="journey-open-demo" href="demos/cafeteria.html" target="_blank" rel="noopener noreferrer">Abrir la web completa <span aria-hidden="true">↗</span></a></div>
        <div class="journey-live-preview"><iframe src="demos/cafeteria.html" title="Vista previa de la web de Maré" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe></div>
        <div class="journey-final-outcome"><p>Una idea, una dirección compartida y una página con personalidad.<span>Maré es una marca ficticia creada para mostrar este proceso.</span></p><button class="button button-accent" type="button" data-open-brief data-service="Página web">Quiero empezar mi proyecto</button></div>`
    }
  ];

  let activeStep = 0;
  let palette = 'amber';
  let initialized = false;

  function updatePalette(announce = false) {
    const colors = palettes[palette];
    root.dataset.journeyPalette = palette;
    panel.style.setProperty('--journey-accent', colors.accent);
    panel.style.setProperty('--journey-ink', colors.ink);
    panel.style.setProperty('--journey-paper', colors.paper);
    panel.querySelectorAll('[data-journey-palette]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.journeyPalette === palette));
    });
    panel.querySelectorAll('[data-journey-swatch]').forEach(swatch => {
      swatch.querySelector('i').style.backgroundColor = colors[swatch.dataset.journeySwatch];
    });
    const paletteStatus = panel.querySelector('[data-journey-palette-status]');
    if (paletteStatus) paletteStatus.textContent = `${announce ? 'Ahora ves la propuesta' : 'Propuesta visual'} con paleta ${colors.name}.`;
  }

  function selectStep(index, focusTab = false) {
    if (!Number.isInteger(index) || index < 0 || index >= steps.length) return;
    const step = steps[index];
    const focusedBefore = document.activeElement;
    if (!initialized || index !== activeStep) {
      activeStep = index;
      root.dataset.journeyStep = String(index);
      panel.dataset.journeyStep = String(index);
      // Only authored, fixed templates are inserted here; editable company names use textContent.
      panel.innerHTML = `<div class="journey-stage-copy"><span class="journey-mini-label">Paso ${index + 1} de 4</span><h3>${step.title}</h3><p>${step.description}</p></div>${step.content()}`;
      panel.querySelectorAll('[data-journey-brand]').forEach(element => { element.textContent = studio; });
      updatePalette();
      initialized = true;
    }
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      tab.classList.toggle('active', selected);
    });
    panel.setAttribute('aria-labelledby', tabs[index].id);
    if (previousButton) previousButton.disabled = index === 0;
    if (nextButton) nextButton.disabled = index === steps.length - 1;
    if (status) status.textContent = `Paso ${index + 1} de 4: ${step.label}`;
    if (focusTab || (focusedBefore === previousButton && previousButton.disabled) || (focusedBefore === nextButton && nextButton.disabled)) {
      tabs[index].focus({ preventScroll: true });
    }
  }

  root.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const tab = event.target.closest('[role="tab"][data-journey-step]');
    if (tab && tabs.includes(tab)) {
      selectStep(Number(tab.dataset.journeyStep));
      panel.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    const navigation = event.target.closest('[data-journey-nav]');
    if (navigation && !navigation.disabled) {
      selectStep(activeStep + (navigation.dataset.journeyNav === 'next' ? 1 : -1));
      panel.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
    const paletteButton = event.target.closest('button[data-journey-palette]');
    if (paletteButton && Object.hasOwn(palettes, paletteButton.dataset.journeyPalette)) {
      palette = paletteButton.dataset.journeyPalette;
      updatePalette(true);
    }
  });

  root.addEventListener('keydown', event => {
    if (!(event.target instanceof Element)) return;
    const tab = event.target.closest('[role="tab"][data-journey-step]');
    if (!tab || !tabs.includes(tab)) return;
    const position = tabs.indexOf(tab);
    const keys = {
      ArrowRight: (position + 1) % tabs.length,
      ArrowLeft: (position - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1
    };
    if (Object.hasOwn(keys, event.key)) {
      event.preventDefault();
      selectStep(keys[event.key], true);
    }
  });

  selectStep(0);
})();
