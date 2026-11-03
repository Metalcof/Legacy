# Tu estudio digital

Página estática en español para una agencia de desarrollo web, integraciones y plataformas de gestión. Diseño claro con acento azul ultramar, titulares expandidos y bloques oscuros, fotografías realistas generadas con IA y texto principal de 18 px. Se adapta a celular e incluye seis proyectos web ampliados y seis automatizaciones relacionadas con esos negocios, un laboratorio para armar una web en vivo, demos grabadas en video, un recorrido guiado con puntero, un recorrido interactivo de un proyecto y contacto por WhatsApp o correo. Las categorías filtran un proyecto web y una automatización por sector. Cada demo conserva su propio selector de paleta.

## Cambiar el nombre y el contacto

Edita `config.js`. El nombre se aplica a la página principal y a los créditos de las demos:

```js
window.SITE_CONFIG = {
  name: 'El nombre de tu empresa',
  phone: '573185314299',
  email: 'hernan.pipe12@gmail.com'
};
```

WhatsApp usa el número internacional sin espacios ni signo `+`. Actualmente se configuró Colombia (`57`).

## Ver la página

Con Apache encendido en XAMPP, abre `http://localhost/Miempresa/`. No necesitas instalar paquetes, configurar una base de datos ni compilar para verla localmente.

También puedes servirla con PHP desde esta carpeta:

```powershell
C:\xampp\php\php.exe -S 127.0.0.1:4173
```

## Publicar en tu dominio con cPanel

El sitio está hecho con HTML, CSS y JavaScript. Puede funcionar directamente en Apache: el servidor no necesita Node, compilación ni base de datos.

1. Edita `config.js` con el nombre de tu empresa y tus datos de contacto.
2. Desde esta carpeta, ejecuta `powershell -ExecutionPolicy Bypass -File scripts/package-cpanel.ps1`. Se creará `.sites-runtime/nexo-studio-cpanel.zip` con los archivos necesarios del sitio. No incluye herramientas de desarrollo, capturas ni configuración de Sites.
3. En el administrador de archivos de cPanel, abre `public_html` o la carpeta de documentos asignada a tu dominio. Si allí ya hay una web, guarda una copia antes de reemplazarla.
4. Sube el ZIP y extráelo en esa carpeta. `index.html`, `styles.css`, `app.js`, `effects.js`, `project-journey.js`, `config.js`, `assets/` y `demos/` deben quedar directamente allí, sin una carpeta `dist/` intermedia. El paquete incluye `.htaccess` si existe en el proyecto.
5. Cuando el dominio apunte a tu alojamiento y tengas el certificado SSL activo, abre tu dominio y comprueba el formulario, las seis demos, el laboratorio de automatizaciones y los enlaces de contacto. Puedes borrar el ZIP del alojamiento después de extraerlo.

Para actualizar la web, vuelve a generar el ZIP después de editar los archivos y sube su contenido. También puedes modificar `config.js` directamente en cPanel para cambiar el nombre o los contactos.

## Publicación con Sites

`scripts/build.mjs` copia los archivos del sitio a `dist/`, la carpeta de publicación. Ejecuta `node scripts/build.mjs` después de editar los archivos para actualizarla. La configuración de Sites está en `.openai/hosting.json`. Este flujo es independiente del ZIP para cPanel. Ambos conservan las imágenes WebP optimizadas y excluyen una lista concreta de los PNG originales y los antiguos robots; otros PNG que agregues al proyecto se copian normalmente.

## Sistema visual de la portada

La portada sigue el modelo de las páginas de producto de software: lienzo porcelana, acento azul ultramar para marca y acciones, amarillo solo como señal de datos en vivo, titulares en Archivo expandida, fotografías de personas trabajando con tarjetas de interfaz de ejemplo flotando encima, bloques que alternan imagen y texto, cifras, preguntas frecuentes y un pie completo. Los colores y la tipografía están en variables al inicio de `styles.css`:

| Variable | Valor | Uso |
| --- | --- | --- |
| `--hoja` | `#fafaf8` | Fondo de la página |
| `--tinta` | `#0f1115` | Texto, panel del diagrama, contacto y pie |
| `--acento` | `#3b2bf5` | Botones principales, enlaces, marca y elementos activos |
| `--acento-hover` | `#2a1bd9` | Botones al pasar el mouse |
| `--acento-suave` | `#ecebff` | Fondos de etiquetas y de "dos caminos" |
| `--acento-texto` | `#2a1fb8` | Texto sobre `--acento-suave` |
| `--acento-claro` | `#a59dff` | El acento sobre fondos oscuros |
| `--amarillo` | `#ffc62b` | Señal: diagrama, progreso y datos en vivo |
| `--niebla` | `#f1f1ed` | Secciones de apoyo |
| `--suave` | `#555a63` | Texto secundario |

Para cambiar el acento, modifica las variables `--acento…`. Los botones usan texto blanco sobre `--acento`: si eliges otro color, comprueba que el contraste sea de al menos 4,5 : 1 (con el ultramar actual es de unos 8 : 1).

Las tarjetas de interfaz (agenda, pedido, citas del día) son maquetas HTML con datos de ejemplo, marcadas como tales. No se conectan a ningún sistema. Si cambias una foto, revisa que la tarjeta no tape lo importante.

La tipografía es Archivo variable (`assets/archivo-var.woff2`), con los ejes de peso y de ancho. Si cambias de fuente, conserva la declaración `font-stretch` del `@font-face`.

## Pensada para la campaña de revisión gratuita

La página responde al correo de prospección: quien llega encuentra la revisión gratuita de 20 minutos, la web con mantenimiento mensual, la agenda o pedidos en línea conectados a WhatsApp y el asistente de WhatsApp 24 h, con las mismas palabras del correo.

- **¿Tu web tiene alguno de estos problemas?** (`#diagnostico`): los nueve problemas más frecuentes (web desactualizada, caída, botones rotos, no se ve en celular, todo a mano por WhatsApp, textos de plantilla, solo Facebook, sin conexión segura, "en construcción"). Al marcarlos se explica qué cuestan y cómo se resuelven, y "Pide tu revisión gratuita" abre el formulario con la lista escrita.
- **Así funcionaría en tu negocio** (`#sectores`): once sectores (clínicas, veterinarias, ferreterías y distribuidoras, industria, abogados y contadores, colegios y academias, restaurantes, hoteles, talleres, inmobiliarias, transporte) con un asistente de WhatsApp de ejemplo que agenda, cotiza o toma pedidos, y el panel donde el equipo lo ve. Textos y conversaciones en `soluciones.js`; las marcas son ficticias.
- **Cómo empezamos** (`#empezar`): revisión gratuita, propuesta, construcción y mantenimiento mensual.
- El formulario pide la web actual (opcional) y la incluye en el mensaje.

## Propuestas personalizadas para la campaña

`scripts/generar-propuestas.py` crea una página por empresa del Excel de prospectos ("Una idea para {Empresa}"): lo que el correo ya les dice, el servicio propuesto, el asistente de WhatsApp de su sector, ejemplos parecidos y el botón para agendar la revisión gratuita por WhatsApp con un mensaje preparado.

```powershell
python -m pip install openpyxl
python scripts/generar-propuestas.py "C:uta\Prospectos_empresas_hispanas.xlsx"
```

- Crea `propuestas/<empresa>-<código>.html` y `propuestas/enlaces.csv` (Empresa → enlace) para combinar con el correo. El enlace completo es `https://tudominio/propuestas/...`.
- Solo usa Empresa, País, Sector, "Observación para el correo" y "Servicio a ofrecer". Nunca correos, teléfonos, decisores ni el detalle técnico del problema. Para España usa un texto general.
- El código del enlace no se puede adivinar y es estable: depende de `propuestas/.clave`. No borres ese archivo después de enviar correos, o los enlaces cambiarán.
- Las páginas piden no aparecer en buscadores, y `propuestas/index.html` evita que se liste la carpeta.
- `propuestas/`, los Excel y los CSV están en `.gitignore`: no se suben a GitHub. El paquete de cPanel sí incluye `propuestas/` si existe.

## Estructura de la portada

1. **Portada oscura** con un muro inclinado de capturas reales de las seis webs de ejemplo, que se mueve solo y se detiene al pasar el mouse. Cada captura abre su demo.
2. **Franja de capacidades** en movimiento.
3. **Proyectos** como casos de estudio: cada negocio con su web en computador y celular, qué hace la web, qué hace la automatización y enlaces a ambas. El filtro por sector muestra un solo negocio y destaca su automatización.
4. **Laboratorio** "Arma una web".
5. **Automatizaciones**: diagrama en vivo y seis paneles reales de las automatizaciones.
6. **Demos grabadas**, **servicios**, **proceso**, **preguntas** y **contacto**.

Las capturas están en `assets/shots/` (WebP). Si cambias una demo, vuelve a capturarla con el mismo nombre: `<sector>-d1.webp` (computador), `<sector>-m1.webp` (celular) y `auto-<sector>.webp` (automatización).

## Laboratorio, videos y movimiento

**Laboratorio "Arma una web"** (`#laboratorio`, código en `lab.js`). El visitante elige negocio, color, letra, forma, distribución, modo claro u oscuro y funciones (WhatsApp, reservas, carrito, reseñas), y una web de ejemplo cambia en vivo. Puede verla como computador o celular, pedir una combinación al azar y, con "Quiero esta web", abrir el formulario con su elección ya escrita. Los textos y fotos de cada negocio están en el objeto `sectors` de `lab.js`; los colores en las reglas `.lab-site[data-color=…]` de `styles.css`.

**Demos grabadas** (`#en-accion`). Cuatro videos reales de las demos en uso, en `assets/video/` (`.webm` y su imagen `.jpg`). Cada capítulo apunta a un nombre base con `data-reel-src`; para cambiar un video, reemplaza los dos archivos con el mismo nombre. Se reproducen sin sonido, solo cuando la sección está a la vista, y pasan solos al siguiente capítulo.

**Recorrido guiado** (`tour.js`). El botón "¿Cómo funciona?" (en la portada, en el laboratorio y flotante abajo a la izquierda) ofrece dos recorridos: cómo diseñamos tu web y cómo funcionan las automatizaciones. Un puntero se mueve por la página, toca los botones de verdad e ilumina cada parte con una explicación corta. Avanza solo, se puede pausar, ir atrás o cerrar con Esc. Los pasos y textos están en el objeto `tours` de `tour.js`.

**Vista previa en video**: al pasar el mouse por los proyectos de cafetería, tienda y clínica, la foto se convierte en la demo grabada.

**Movimiento** (`motion.js` y el bloque final de `styles.css`): entrada de la portada, notificaciones que cambian, barras que se actualizan, revelado de fotos y tarjetas al hacer scroll, cifras que cuentan, profundidad en las tarjetas, registro en vivo del diagrama y transiciones en filtros, colores y pasos. Si el sistema pide reducir movimiento, o si alguien usa el botón de pausa del diagrama, todo queda quieto y completo.

## Demos y automatizaciones

Las seis demos son conceptos navegables con fotografía realista, contacto conectado a `config.js` y selector de tema:

| Demo | Archivo | Ejemplo de uso |
| --- | --- | --- |
| Maré | `demos/cafeteria.html` | Carta con fotos individuales, barista, historia del lugar y recogida. |
| WAV | `demos/tienda.html` | Tienda con escenas de uso, detalles, tres acabados y carrito local. |
| AURA | `demos/arquitectura.html` | Galería de arquitectura, interiores, fichas de espacios y solicitudes. |
| ALMA | `demos/clinica.html` | Equipo, consulta, servicios y agenda de visitas. |
| LUMBRE | `demos/restaurante.html` | Una fotografía por plato, filtros y pedido con cantidades. |
| Valeria Ríos | `demos/portfolio.html` | Casos propios de cosmética, hotelería y talleres creativos. |

`demos/sector-automation.html` reúne seis proyectos interactivos, cada uno con fotografías y reglas específicas del negocio:

| Categoría | Enlace al proyecto | Qué permite probar |
| --- | --- | --- |
| Cafetería | `demos/sector-automation.html#cafeteria` | Pedido para recoger, ticket, cola de preparación y estado listo. |
| Arquitectura | `demos/sector-automation.html#arquitectura` | Solicitud, brief, checklist y fases de revisión. |
| Tienda online | `demos/sector-automation.html#tienda` | Pedido por acabado, total, inventario y reversión. |
| Clínica | `demos/sector-automation.html#clinica` | Horario disponible, reserva y cancelación que libera el cupo. |
| Restaurante | `demos/sector-automation.html#restaurante` | Capacidad de mesas, asignación, reserva y liberación. |
| Marca personal | `demos/sector-automation.html#personal` | Brief, alcance, propuesta y seguimiento por fases. |

Los módulos tienen formularios, resultados y registros locales. El selector de sector de la portada muestra el sitio web y el proceso relacionados. Los botones de navegación y los enlaces de cada web abren el módulo correspondiente.

El laboratorio general anterior sigue disponible en `demos/automatizaciones.html`:

- `#leads`: recibir consultas y calcular su prioridad.
- `#reservas`: consultar disponibilidad y generar una confirmación.
- `#pedidos`: calcular el total, comprobar stock y preparar un comprobante.

Estos flujos son simulaciones locales: no envían datos a servicios externos, no gestionan reservas reales y no procesan pagos. Una integración de producción necesita conectar los servicios del negocio.

## Cómo funciona

El formulario de contacto abre WhatsApp o la aplicación de correo del visitante con el mensaje preparado; el visitante confirma el envío. No almacena datos de consultas en un servidor. Las seis demos son conceptos de diseño. El carrito de WAV guarda productos solo en el navegador y no procesa pagos. Su selector Lavanda / Grafito / Lima cambia a una imagen fotográfica del producto en el color elegido, conservando la misma pose y el mismo encuadre.

`project-journey.js` muestra el caso conceptual de la cafetería Maré en cuatro etapas: la idea, la conversación, la propuesta visual antes de programar y la web terminada. Puedes avanzar con las pestañas, los botones anterior/siguiente o las flechas del teclado; Inicio y Fin seleccionan la primera y la última etapa. La propuesta visual permite probar dos paletas. La etapa final carga la demo funcional dentro de una vista previa y permite abrirla completa. La marca, las personas y la conversación son ficticias.

Se incluyen tipografía Archivo local en la portada (licencia en `assets/OFL-Archivo.txt`), navegación con teclado, etiquetas accesibles, un botón de pausa para el diagrama de la portada y soporte de la preferencia de movimiento reducido. `effects.js` conserva el filtro por sector del catálogo y el cambio de color de los audífonos de ejemplo. Las demos siguen usando Manrope e incluyen su propio selector de paleta; las de Maré, AURA y WAV permiten elegir Original, Verde, Cian o Violeta y conservan la elección por demo en el navegador. La única animación de la portada son los paquetes de datos del diagrama; no hay robot, canvas de partículas ni selector global de color.

Los enlaces internos usan navegación nativa con saltos inmediatos. Las fotografías se sirven en WebP, con versiones pequeñas para pantallas de menor tamaño y carga diferida en imágenes secundarias. La vista previa del caso Maré se crea solo al abrir la última etapa.

## Recursos visuales

Las fotografías se generaron con IA y se optimizaron para la web:

- `assets/cafe-editorial.webp`: cafetería luminosa, utilizada en la portada y el caso Maré.
- `assets/creative-conversation.webp`: conversación sobre un proyecto en un estudio creativo.
- `assets/architecture-editorial.webp`: casa contemporánea abierta a un jardín tropical, utilizada en el concepto AURA.
- `assets/interior-editorial.webp`: interior con materiales naturales para los proyectos de AURA.
- `assets/coffee-menu.webp`: café y repostería para la carta de Maré.
- `assets/wellness-editorial.webp`: espacio de bienestar para la demo de clínica.
- `assets/restaurant-editorial.webp`: ambiente gastronómico para la demo de restaurante.
- `assets/professional-editorial.webp`: fotografía profesional para el portfolio.
- `assets/headphones-lavanda.webp`, `assets/headphones-grafito.webp` y `assets/headphones-lima.webp`: tres variantes fotográficas de los auriculares WAV, con fondo transparente.

La ampliación añade 23 fotografías independientes: cuatro para la cafetería, dos de arquitectura, dos de los auriculares en uso y detalle, dos del centro de bienestar, cuatro platos del restaurante, tres proyectos propios del portfolio y seis contextos de automatización. Cada activo tiene una imagen diferente; la carta ya no reutiliza una panorámica recortada y el portfolio ya no repite Maré, AURA y ALMA como sus propios casos.

Las fotografías editoriales tienen una variante `-small.webp` para pantallas pequeñas. Las fotos nuevas se optimizan a un máximo de 1600 px y sus variantes pequeñas a 800 px. Las tres fotos de auriculares con fondo transparente se optimizan a 1200 px. Los PNG originales permanecen en `assets/` como archivos de edición y quedan fuera de `dist/` y del ZIP para cPanel, junto con las imágenes antiguas de robots. Los nombres, las marcas y las personas de estos ejemplos son ficticios; no son testimonios ni proyectos de clientes reales.

Las instrucciones de generación se conservan en [los prompts editoriales](qa/editorial-image-prompts.txt), [el prompt de arquitectura](qa/architecture-image-prompt.txt), [el prompt del interior](qa/interior-image-prompt.txt), [el prompt de la carta](qa/coffee-menu-image-prompt.txt), [los prompts de las nuevas demos](qa/new-demo-image-prompts.txt), [las variantes de auriculares](qa/headphone-image-prompts.txt), [las ocho nuevas fotos de café, arquitectura y producto](qa/sector-images-classic.txt), [las nueve fotos de clínica, restaurante y portfolio](qa/sector-images-extra.txt) y [los seis contextos de automatización](qa/sector-images-automation.txt). `qa/` queda fuera de los paquetes de publicación.
