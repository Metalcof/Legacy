"""Genera una página de propuesta para cada empresa del Excel de prospectos.

Uso (desde la carpeta del proyecto):
    python scripts/generar-propuestas.py "ruta/Prospectos.xlsx"

Crea propuestas/<enlace>.html y propuestas/enlaces.csv (Empresa → enlace) para
combinar con el correo. La carpeta propuestas/ está en .gitignore: no se sube a
GitHub, pero el paquete de cPanel la incluye si existe.

Privacidad: solo se usan Empresa, País, Sector, "Observación para el correo"
(el texto que ya se les envía) y "Servicio a ofrecer". Nunca correos, teléfonos,
decisores ni el detalle técnico del problema. Los enlaces llevan una parte
aleatoria estable (guardada en propuestas/.clave) y las páginas piden no ser
indexadas. Para España se usa una versión más general (LSSI/RGPD).
"""
import csv, hashlib, hmac, html, json, os, re, secrets, sys, unicodedata

try:
    import openpyxl
except ImportError:
    sys.exit('Falta openpyxl: python -m pip install openpyxl')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'propuestas')
SHEETS = ['Con correo', 'Revisar antes de enviar', 'Solo teléfono-WhatsApp']

# Palabras del sector → clave de soluciones.js. El orden importa: lo más específico primero.
SECTOR_RULES = [
    ('veterinaria', ['veterinari']),
    ('distribucion', ['cecinas', 'carnicer', 'insumos dentales', 'distribuidora de']),
    ('restaurante', ['restaurante', 'parrilla', 'asados']),
    ('hotel', ['hotel']),
    ('industria', ['fábrica', 'fundición', 'metalmec', 'prefabric', 'confeccion', 'muebles', 'ingenier']),
    ('salud', ['dental', 'odontol', 'ortodon', 'médic', 'cardiol', 'laboratorio clínico', 'oftalmol', 'estétic', 'spa', 'cirugía', 'clínica']),
    ('hotel', ['turismo', 'tours a']),
    ('taller', ['taller', 'automotri']),
    ('inmobiliaria', ['inmobiliari', 'constructora', 'bienes raíces']),
    ('logistica', ['transporte', 'logística', 'carga', 'grúas']),
    ('legal', ['abogad', 'jurídic', 'notar', 'contab', 'contador', 'fiscal', 'auditor']),
    ('educacion', ['colegio', 'academia', 'escuela', 'capacitación', 'preicfes', 'preuniversit']),
    ('distribucion', ['ferreter', 'material', 'acero', 'distribu', 'herramient', 'gas', 'aliment']),
]
SECTOR_NAMES = {
    'salud': 'clínicas y centros de salud', 'veterinaria': 'veterinarias', 'distribucion': 'ferreterías y distribuidoras',
    'industria': 'fábricas e industria', 'legal': 'despachos legales y contables', 'educacion': 'colegios y academias',
    'restaurante': 'restaurantes', 'hotel': 'hoteles y turismo', 'taller': 'talleres', 'inmobiliaria': 'inmobiliarias y constructoras',
    'logistica': 'transporte y logística',
}
# Demos del sitio que más se parecen a cada sector.
DEMOS = {
    'salud': [('demos/clinica.html', 'ALMA, web de un centro de bienestar con agenda'), ('demos/sector-automation.html#clinica', 'Agenda que ocupa y libera cupos')],
    'veterinaria': [('demos/clinica.html', 'ALMA, web con servicios y agenda de citas'), ('demos/sector-automation.html#clinica', 'Agenda con confirmaciones automáticas')],
    'distribucion': [('demos/tienda.html', 'WAV, tienda con catálogo y carrito'), ('demos/sector-automation.html#tienda', 'Pedidos que descuentan inventario')],
    'industria': [('demos/arquitectura.html', 'AURA, web corporativa con fichas de proyectos'), ('demos/sector-automation.html#arquitectura', 'Solicitudes que se vuelven un brief ordenado')],
    'legal': [('demos/portfolio.html', 'Web profesional con casos y servicios'), ('demos/sector-automation.html#personal', 'Solicitudes que se vuelven propuestas')],
    'educacion': [('demos/portfolio.html', 'Web con programas y servicios'), ('demos/sector-automation.html#personal', 'Inscripciones con seguimiento por etapas')],
    'restaurante': [('demos/restaurante.html', 'LUMBRE, carta con fotos y pedidos'), ('demos/sector-automation.html#restaurante', 'Reservas con mesa asignada')],
    'hotel': [('demos/cafeteria.html', 'Maré, web con fotos y experiencias'), ('demos/sector-automation.html#restaurante', 'Reservas que se ordenan solas')],
    'taller': [('demos/clinica.html', 'Web con servicios y agenda de citas'), ('demos/sector-automation.html#clinica', 'Citas con horario y confirmación')],
    'inmobiliaria': [('demos/arquitectura.html', 'AURA, galería de proyectos con fichas'), ('demos/sector-automation.html#arquitectura', 'Solicitudes con seguimiento')],
    'logistica': [('demos/arquitectura.html', 'Web corporativa con servicios'), ('demos/sector-automation.html#tienda', 'Pedidos con comprobante y estado')],
}


def sector_key(text):
    t = (text or '').lower()
    for key, words in SECTOR_RULES:
        if any(w in t for w in words):
            return key
    return 'distribucion'


def slugify(text):
    t = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    t = re.sub(r'[^a-z0-9]+', '-', t).strip('-')
    return '-'.join(t.split('-')[:4])[:32].strip('-') or 'empresa'


def load_key():
    path = os.path.join(OUT, '.clave')
    if os.path.exists(path):
        with open(path, encoding='utf-8') as f:
            return f.read().strip().encode()
    key = secrets.token_hex(16)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(key)
    return key.encode()


def clean(value):
    return re.sub(r'\s+', ' ', str(value or '')).strip()


def page(row, slug, key):
    esc = lambda v: html.escape(v, quote=True)
    js = lambda v: json.dumps(v, ensure_ascii=False).replace('</', '<\\u002f')
    empresa = clean(row.get('Empresa'))
    pais = clean(row.get('País'))
    observacion = clean(row.get('Observación para el correo')).rstrip('.')
    servicio = clean(row.get('Servicio a ofrecer')).rstrip('.')
    general = pais.lower().startswith('españa') or not observacion
    intro = (f'Preparamos esta página para mostrarles cómo podría verse y funcionar la atención en línea de {empresa}.'
             if general else f'Revisando su negocio, {observacion}. Esto suele costar clientes que no esperan respuesta y horas del equipo en tareas repetitivas.')
    propuesta = servicio if (servicio and not general) else 'Una web moderna con mantenimiento mensual, agenda o pedidos en línea conectados a WhatsApp y un asistente que responde las 24 horas'
    demos = ''.join(f'<li><a href="../{href}"><strong>{esc(label)}</strong><span>Abrir la demo ↗</span></a></li>' for href, label in DEMOS[key])
    wa_text = f'Hola. Somos de {empresa}. Vimos la propuesta y nos interesa la revisión gratuita de 20 minutos.'
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#0c0d12">
  <title>Una idea para {esc(empresa)}</title>
  <link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../styles.css">
  <script src="../config.js" defer></script>
  <script src="../soluciones.js" defer></script>
</head>
<body class="proposal">
  <header class="header proposal-header">
    <a class="brand" href="../index.html"><svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8"/><path d="M11.5 12 20.5 20"/><circle cx="9" cy="10" r="3.2"/><circle cx="23" cy="22" r="3.2"/></svg><span data-brand>Nexo Studio</span></a>
    <a class="button button-accent nav-cta" data-wa href="#">Agendar la revisión</a>
  </header>
  <main>
    <section class="intro on-dark proposal-hero">
      <div class="shell intro-copy">
        <p class="intro-note"><span aria-hidden="true"></span>Preparado para {esc(empresa)}</p>
        <h1>Una idea para {esc(empresa)}.</h1>
        <p class="lead">{esc(intro)}</p>
        <div class="proposal-offer"><p class="proposal-offer-label">Lo que les proponemos</p><p>{esc(propuesta)}.</p></div>
        <div class="intro-actions">
          <a class="button button-accent" data-wa href="#">Agendar la revisión gratuita</a>
          <a class="button button-ghost" href="#sectores">Ver cómo funcionaría</a>
        </div>
        <p class="intro-promise">20 minutos, sin compromiso: les mostramos qué mejoraríamos y cuánto costaría.</p>
      </div>
    </section>

    <section class="sectors on-dark" id="sectores" data-initial="{key}" aria-labelledby="sectors-title">
      <div class="shell">
        <div class="work-head">
          <h2 id="sectors-title">Así atendería su asistente de WhatsApp.</h2>
          <p>Un ejemplo para {esc(SECTOR_NAMES[key])}: respondan como si fueran un cliente y miren cómo llega al panel del equipo.</p>
        </div>
        <div class="sector-tabs" role="tablist" aria-label="Sectores" data-sector-tabs></div>
        <div class="sector-panel" id="sector-panel" role="tabpanel" tabindex="0">
          <div class="sector-info">
            <h3 data-sector-title></h3>
            <p class="sector-kicker">Lo que construiríamos:</p>
            <ul class="sector-builds" data-sector-builds></ul>
            <a class="button button-accent" data-wa href="#">Lo queremos para {esc(empresa)}</a>
          </div>
          <div class="phone" aria-label="Conversación de ejemplo con un asistente de WhatsApp">
            <div class="phone-top"><span class="phone-avatar" aria-hidden="true"></span><div><strong data-chat-name></strong><small>en línea · asistente</small></div><button type="button" class="phone-restart" data-chat-restart aria-label="Reiniciar la conversación">↻</button></div>
            <div class="chat" data-chat role="log" aria-live="polite"></div>
            <div class="chat-replies" data-chat-replies></div>
          </div>
          <div class="sector-panel-team">
            <p class="team-label">Lo que vería su equipo</p>
            <div class="team-card"><strong data-panel-title></strong><ul class="team-rows" data-panel-rows></ul></div>
            <p class="team-note">Marca y datos de ejemplo. No se envían mensajes reales.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="proposal-demos">
      <div class="shell">
        <div class="work-head"><h2>Ejemplos que pueden abrir.</h2><p>Proyectos conceptuales con datos de muestra, parecidos a lo que haríamos para ustedes.</p></div>
        <ul class="proposal-demo-list">{demos}<li><a href="../index.html#proyectos"><strong>Todos los proyectos de ejemplo</strong><span>Ver en nuestra web ↗</span></a></li></ul>
      </div>
    </section>

    <section class="steps">
      <div class="shell">
        <div class="work-head"><h2>Cómo empezaríamos.</h2><p>Sin compromiso hasta que tengan una propuesta clara, con precio y tiempos.</p></div>
        <ol class="step-list">
          <li><span class="step-n">1</span><h3>Revisión gratuita</h3><p>En 20 minutos revisamos su web y cómo atienden hoy, y les mostramos qué mejoraríamos.</p></li>
          <li><span class="step-n">2</span><h3>Propuesta clara</h3><p>Alcance, precio y tiempos por escrito. Ustedes deciden si seguimos.</p></li>
          <li><span class="step-n">3</span><h3>Construcción</h3><p>Diseñamos la web y conectamos agenda, pedidos y WhatsApp, con avances antes de publicar.</p></li>
          <li><span class="step-n">4</span><h3>Mantenimiento mensual</h3><p>Actualizamos y revisamos que todo funcione cada mes.</p></li>
        </ol>
        <div class="steps-cta"><a class="button button-accent" data-wa href="#">Agendar la revisión gratuita</a><a class="text-link" data-mail href="#">O escríbannos por correo</a></div>
      </div>
    </section>
  </main>
  <footer class="footer on-dark proposal-footer">
    <div class="shell footer-bottom">
      <small>Página preparada para {esc(empresa)} por <span data-brand>Nexo Studio</span>. Las marcas de los ejemplos son ficticias.</small>
      <small>Si prefieren no recibir más mensajes nuestros, respondan "no" y no volveremos a escribirles.</small>
    </div>
  </footer>
  <script>
    document.addEventListener('DOMContentLoaded', () => {{
      const c = window.SITE_CONFIG || {{}};
      const brand = (c.name || 'Nexo Studio').trim();
      const phone = String(c.phone || '').replace(/\\D/g, '');
      const email = c.email || '';
      const text = {js(wa_text)};
      document.querySelectorAll('[data-brand]').forEach(el => {{ el.textContent = brand; }});
      document.querySelectorAll('[data-wa]').forEach(el => {{ el.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text); el.target = '_blank'; el.rel = 'noopener noreferrer'; }});
      document.querySelectorAll('[data-mail]').forEach(el => {{ el.href = 'mailto:' + email + '?subject=' + encodeURIComponent('Revisión gratuita: ' + {js(empresa)}) + '&body=' + encodeURIComponent(text); }});
    }});
  </script>
</body>
</html>
'''


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    key = load_key()
    wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
    links, seen = [], set()
    for name in SHEETS:
        if name not in wb.sheetnames:
            continue
        rows = list(wb[name].iter_rows(values_only=True))
        header = [clean(h) for h in rows[0]]
        for values in rows[1:]:
            row = dict(zip(header, values))
            empresa = clean(row.get('Empresa'))
            if not empresa or empresa in seen:
                continue
            seen.add(empresa)
            token = hmac.new(key, empresa.encode(), hashlib.sha256).hexdigest()[:8]
            slug = f'{slugify(empresa)}-{token}'
            sk = sector_key(row.get('Sector'))
            with open(os.path.join(OUT, slug + '.html'), 'w', encoding='utf-8', newline='\n') as f:
                f.write(page(row, slug, sk))
            links.append({'Empresa': empresa, 'Hoja': name, 'País': clean(row.get('País')), 'Sector detectado': sk, 'Enlace': f'propuestas/{slug}.html'})
    # Evita que alguien liste la carpeta en el servidor.
    with open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8') as f:
        f.write('<!DOCTYPE html><meta charset="UTF-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=../index.html"><title>Nexo Studio</title>')
    with open(os.path.join(OUT, 'enlaces.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(links[0].keys()))
        writer.writeheader(); writer.writerows(links)
    print(f'{len(links)} propuestas creadas en {OUT}')


if __name__ == '__main__':
    main()
