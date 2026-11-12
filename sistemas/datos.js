// Generado: contenido de cada presentación (datos de pantallas ficticios).
window.NEXO_SISTEMAS = [
 {
  "key": "talento-humano",
  "familia": "SiGeDo",
  "nombre": "Talento Humano y Mi Talento Humano",
  "area": "Personas",
  "color": "#6a0899",
  "icono": "personas",
  "portada": {
   "titulo": "Antes era una planilla. Hoy es Talento Humano.",
   "bajada": "Expedientes, permisos con firma y un portal donde cada colaborador hace sus propios trámites."
  },
  "resumen": "Talento Humano es el módulo de SiGeDo donde el área lleva expedientes, permisos, vacaciones, licencias y capacitación. Mi Talento Humano es el portal de autogestión: cada colaborador ve su perfil, pide permisos con su firma, envía solicitudes y consulta sus desprendibles.",
  "funciones": [
   {
    "t": "Expedientes por colaborador",
    "d": "Documentos de cada persona por etapas: precontractual, contractual, ejecución, terminación y postcontractual."
   },
   {
    "t": "Alertas de contratos",
    "d": "Muestra los contratos próximos a vencer."
   },
   {
    "t": "Checklist de contratación",
    "d": "Lo que falta por entregar en cada ingreso."
   },
   {
    "t": "Plan de capacitación",
    "d": "Programadas contra ejecutadas, con cumplimiento por mes."
   },
   {
    "t": "Permisos con firma",
    "d": "Formato TAH-F-05 con firma del colaborador, del jefe y de Talento Humano."
   },
   {
    "t": "Vacaciones y licencias",
    "d": "Solicitudes, días disponibles y estado de cada una."
   },
   {
    "t": "Certificación laboral",
    "d": "Se genera desde la ficha del colaborador."
   },
   {
    "t": "Mi Talento Humano",
    "d": "Perfil, datos de contacto, permisos y solicitudes de cada colaborador."
   },
   {
    "t": "Desprendibles de nómina",
    "d": "Cada quien consulta y descarga los suyos, solo lectura."
   }
  ],
  "pantalla": {
   "tipo": "tabla",
   "app": "Talento Humano",
   "ruta": "Talento Humano / Permisos",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Dashboard",
      "Nómina"
     ]
    },
    {
     "g": "TALENTO HUMANO",
     "i": [
      "Expedientes",
      "Alertas",
      "Checklist",
      "Calendario",
      "Plan de Capacitación",
      "Permisos",
      "Solicitudes"
     ]
    },
    {
     "g": "NOVEDADES",
     "i": [
      "Vacaciones",
      "Licencias",
      "Certificación laboral"
     ]
    },
    {
     "g": "SISTEMA",
     "i": [
      "Búsqueda",
      "Reportes",
      "Respaldo"
     ]
    }
   ],
   "activo": "Permisos",
   "acciones": [
    "+ Nuevo permiso",
    "Ficha del día",
    "Exportar CSV",
    "Correos"
   ],
   "columnas": [
    "N°",
    "Colaborador",
    "Área",
    "Fecha",
    "Tipo",
    "Estado"
   ],
   "filas": [
    [
     "118",
     "Laura Martínez",
     "Producción",
     "15 oct",
     "Salud",
     "Pendiente"
    ],
    [
     "117",
     "Jorge López",
     "Almacén",
     "14 oct",
     "Personal",
     "Autorizado"
    ],
    [
     "116",
     "Ana María Gómez",
     "Comercial",
     "14 oct",
     "Escolar",
     "Autorizado"
    ],
    [
     "115",
     "Iván Salazar",
     "Producción",
     "13 oct",
     "Legal",
     "Autorizado"
    ],
    [
     "114",
     "Daniela Reyes",
     "Calidad",
     "10 oct",
     "Personal",
     "Rechazado"
    ],
    [
     "113",
     "Fabián Mejía",
     "Mantenimiento",
     "9 oct",
     "Salud",
     "Autorizado"
    ],
    [
     "112",
     "Natalia Ortiz",
     "Diseño",
     "8 oct",
     "Escolar",
     "Pendiente"
    ]
   ]
  },
  "flujo": {
   "titulo": "Pedir un permiso toma un minuto",
   "pasos": [
    {
     "t": "Entra a Mi Talento Humano",
     "d": "Con su cuenta de SiGeDo, desde el celular o el computador"
    },
    {
     "t": "Llena el permiso",
     "d": "Motivo personal, salud, escolar o legal, con fecha, horas y soporte"
    },
    {
     "t": "Firma en pantalla",
     "d": "Con el dedo, el lápiz de la tablet o el mouse"
    },
    {
     "t": "El jefe lo autoriza",
     "d": "Recibe el aviso, revisa y firma desde su propio portal"
    }
   ],
   "actores": [
    {
     "t": "Colaborador",
     "d": "Envía y firma su solicitud"
    },
    {
     "t": "Jefe inmediato",
     "d": "Autoriza con su firma"
    },
    {
     "t": "Talento Humano",
     "d": "Revisa y pone su firma"
    },
    {
     "t": "Listo",
     "d": "Formato con las tres firmas en PDF"
    }
   ],
   "estados": [
    "Pendiente",
    "Autorizado por el jefe",
    "Firmado por Talento Humano"
   ]
  },
  "aviso": {
   "de": "SiGeDo · Talento Humano",
   "para": "Jefe inmediato",
   "asunto": "Permiso de Laura Martínez — N° 118",
   "etiqueta": "REQUIERE TU REVISIÓN",
   "cuerpo": "Laura Martínez (Producción) registró un permiso en SiGeDo que requiere tu revisión.",
   "campos": [
    [
     "N°",
     "118"
    ],
    [
     "Tipo",
     "Salud"
    ],
    [
     "Fecha del permiso",
     "15 de octubre"
    ],
    [
     "Horario",
     "8:00 a 10:30"
    ],
    [
     "Motivo",
     "Cita médica"
    ],
    [
     "Estado actual",
     "Pendiente"
    ]
   ],
   "boton": "Revisar y firmar en SiGeDo"
  },
  "antes": {
   "titulo": "Planilla impresa",
   "d": "El permiso se llenaba en papel, había que buscar al jefe para la firma y archivarlo a mano."
  },
  "ahora": [
   {
    "t": "Firma digital",
    "d": "Con el dedo, el lápiz o el mouse"
   },
   {
    "t": "Aviso por correo",
    "d": "El jefe se entera al instante"
   },
   {
    "t": "Ficha del día",
    "d": "Quién tiene permiso hoy, en un PDF"
   },
   {
    "t": "Autogestión",
    "d": "Cada colaborador hace sus trámites"
   },
   {
    "t": "Desprendibles",
    "d": "Disponibles sin pedírselos a nadie"
   },
   {
    "t": "Gráficos",
    "d": "Permisos por tipo, área y mes"
   }
  ],
  "mercado": "Buk + Factorial",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Menos papel, menos vueltas y cada firma en su lugar."
 },
 {
  "key": "inventario",
  "familia": "SiGeDo",
  "nombre": "Almacén y Compras",
  "area": "Operación y planta",
  "color": "#0b6e69",
  "icono": "caja",
  "portada": {
   "titulo": "Antes era un kárdex en Excel. Hoy es Almacén y Compras.",
   "bajada": "Cada insumo, lote, entrada y salida queda registrado y con el stock al día."
  },
  "resumen": "Es el inventario de insumos de la planta: stock por bodega, lotes, movimientos, compras y entrega de EPP. Lo usan el almacenista y el líder de almacén.",
  "funciones": [
   {
    "t": "Insumos con mínimo y máximo",
    "d": "Cada insumo con bodega, categoría, unidad, consumo diario y días restantes."
   },
   {
    "t": "Alertas de stock",
    "d": "Marca en el menú lo que quedó bajo o crítico."
   },
   {
    "t": "Lotes y FEFO",
    "d": "Controla vencimientos y propone sacar primero lo que vence antes."
   },
   {
    "t": "Entradas",
    "d": "Proveedor, factura, OT, lote y lo esperado contra lo recibido."
   },
   {
    "t": "Salidas con firma",
    "d": "Varios insumos por salida y firma de quien recibe en la pantalla."
   },
   {
    "t": "Transferencias y ajustes",
    "d": "Mueve stock entre bodegas y cuadra el conteo físico con su motivo."
   },
   {
    "t": "Órdenes de compra y proveedores",
    "d": "OC en borrador, aprobada, recibida o cancelada, con días de entrega."
   },
   {
    "t": "Historial de EPP",
    "d": "Quién recibió cada elemento de protección, primera vez o reposición."
   },
   {
    "t": "Reportes",
    "d": "Exporta a Excel, CSV y PDF, e importa insumos desde CSV."
   }
  ],
  "pantalla": {
   "tipo": "panel",
   "app": "Almacén y Compras",
   "ruta": "Almacén / Dashboard",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Dashboard"
     ]
    },
    {
     "g": "INVENTARIO",
     "i": [
      "Insumos",
      "Alertas",
      "Lotes / FEFO"
     ]
    },
    {
     "g": "MOVIMIENTOS",
     "i": [
      "Entradas",
      "Salidas",
      "Transferencias",
      "Ajustes"
     ]
    },
    {
     "g": "COMPRAS",
     "i": [
      "Órdenes de Compra",
      "Proveedores"
     ]
    },
    {
     "g": "REPORTES",
     "i": [
      "Historial EPP",
      "Requisiciones",
      "PDF Inventario"
     ]
    },
    {
     "g": "CONFIGURACIÓN",
     "i": [
      "Bodegas",
      "Categorías",
      "Unidades",
      "Configuración"
     ]
    }
   ],
   "activo": "Dashboard",
   "acciones": [
    "+ Nuevo Insumo",
    "Exportar Excel"
   ],
   "kpis": [
    {
     "v": "86",
     "t": "Total insumos"
    },
    {
     "v": "79",
     "t": "Stock normal"
    },
    {
     "v": "7",
     "t": "Alertas activas"
    },
    {
     "v": "3",
     "t": "OC pendientes"
    }
   ],
   "barras": [
    {
     "t": "Lámina cold rolled",
     "v": 70
    },
    {
     "t": "Soldadura MIG",
     "v": 12
    },
    {
     "t": "Pintura electrostática",
     "v": 28
    },
    {
     "t": "Tornillo autoperforante",
     "v": 85
    },
    {
     "t": "Guantes de vaqueta",
     "v": 20
    },
    {
     "t": "Disco de corte",
     "v": 55
    }
   ]
  },
  "flujo": {
   "titulo": "Una salida de almacén queda firmada en un minuto",
   "pasos": [
    {
     "t": "Busca el insumo",
     "d": "Por nombre o código, con el stock a la vista"
    },
    {
     "t": "Elige el lote",
     "d": "El sistema propone el que vence primero"
    },
    {
     "t": "Registra quién recibe",
     "d": "Nombre, cargo y firma en la pantalla"
    },
    {
     "t": "El stock se actualiza",
     "d": "Si baja del mínimo, aparece la alerta"
    }
   ],
   "actores": [
    {
     "t": "Almacenista",
     "d": "Registra entradas, salidas y lotes"
    },
    {
     "t": "Colaborador",
     "d": "Recibe el insumo y firma"
    },
    {
     "t": "Líder de almacén",
     "d": "Hace ajustes y gestiona compras"
    },
    {
     "t": "Listo",
     "d": "Stock al día y con responsable"
    }
   ],
   "estados": [
    "Normal",
    "Bajo",
    "Crítico"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Kárdex en hoja de cálculo",
   "d": "Los movimientos se anotaban a mano y el stock real solo se sabía al contar."
  },
  "ahora": [
   {
    "t": "Stock en vivo",
    "d": "Cada entrada y salida lo mueve"
   },
   {
    "t": "Alertas",
    "d": "Bajo y crítico se ven en el menú"
   },
   {
    "t": "FEFO",
    "d": "Primero sale lo que vence antes"
   },
   {
    "t": "Firma de recibido",
    "d": "En la pantalla, al entregar"
   },
   {
    "t": "Trazabilidad",
    "d": "Cada registro guarda quién lo hizo"
   },
   {
    "t": "Reportes",
    "d": "Excel, CSV y PDF en un clic"
   }
  ],
  "mercado": "Zoho Inventory + Odoo Inventario",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Lo que hay en bodega, a la vista de todos."
 },
 {
  "key": "requisiciones",
  "familia": "SiGeDo",
  "nombre": "Requisiciones",
  "area": "Operación y planta",
  "color": "#155e75",
  "icono": "carrito",
  "portada": {
   "titulo": "Antes era una nota en papel. Hoy es Requisiciones.",
   "bajada": "Cualquier área pide insumos en dos minutos y Almacén lo sabe al instante."
  },
  "resumen": "Es el formulario con el que las áreas piden insumos a Almacén y Compras, sin usuario ni contraseña. Almacén aprueba, entrega y deja el comprobante.",
  "funciones": [
   {
    "t": "Formulario abierto",
    "d": "Cualquier área lo usa sin usuario ni contraseña."
   },
   {
    "t": "Catálogo con stock",
    "d": "Al elegir un insumo se ve cuánto hay y en qué bodega."
   },
   {
    "t": "Insumos no registrados",
    "d": "Se puede pedir lo que aún no existe en el almacén."
   },
   {
    "t": "Foto de referencia",
    "d": "Una imagen para que Compras sepa qué traer."
   },
   {
    "t": "Urgencia y fecha",
    "d": "Normal, urgente o muy urgente, con la fecha en que se necesita."
   },
   {
    "t": "Aviso por correo",
    "d": "Almacén recibe cada requisición nueva con su detalle."
   },
   {
    "t": "Aprobación por ítem",
    "d": "Se aprueba, ajusta o rechaza cada insumo por separado."
   },
   {
    "t": "PDF de solicitud y de entrega",
    "d": "Quien pide descarga su solicitud y la entrega deja comprobante."
   },
   {
    "t": "Tutorial guiado",
    "d": "Un recorrido paso a paso para quien lo usa por primera vez."
   }
  ],
  "pantalla": {
   "tipo": "tabla",
   "app": "Almacén y Compras",
   "ruta": "Almacén / Requisiciones",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Dashboard"
     ]
    },
    {
     "g": "INVENTARIO",
     "i": [
      "Insumos",
      "Alertas",
      "Lotes / FEFO"
     ]
    },
    {
     "g": "MOVIMIENTOS",
     "i": [
      "Entradas",
      "Salidas",
      "Transferencias",
      "Ajustes"
     ]
    },
    {
     "g": "COMPRAS",
     "i": [
      "Órdenes de Compra",
      "Proveedores"
     ]
    },
    {
     "g": "REPORTES",
     "i": [
      "Historial EPP",
      "Requisiciones",
      "PDF Inventario"
     ]
    }
   ],
   "activo": "Requisiciones",
   "acciones": [
    "Exportar",
    "Actualizar"
   ],
   "columnas": [
    "Fecha",
    "Solicitante",
    "Área",
    "Insumos",
    "Urgencia",
    "Estado"
   ],
   "filas": [
    [
     "5 nov",
     "Diego Martínez",
     "Producción",
     "3",
     "Urgente",
     "Pendiente"
    ],
    [
     "4 nov",
     "Claudia Mora",
     "Calidad",
     "2",
     "Normal",
     "Pendiente"
    ],
    [
     "4 nov",
     "Héctor Barrera",
     "Mantenimiento",
     "4",
     "Muy urgente",
     "Parcialmente aprobada"
    ],
    [
     "3 nov",
     "Luisa Torres",
     "Logística",
     "1",
     "Normal",
     "Aprobada"
    ],
    [
     "31 oct",
     "Camilo Rojas",
     "Producción",
     "5",
     "Urgente",
     "Entregada"
    ],
    [
     "30 oct",
     "Lorena Gil",
     "Talento Humano",
     "2",
     "Normal",
     "Entregada"
    ],
    [
     "29 oct",
     "Ricardo Paz",
     "Comercial",
     "1",
     "Normal",
     "Rechazada"
    ]
   ]
  },
  "flujo": {
   "titulo": "Pedir insumos toma dos minutos",
   "pasos": [
    {
     "t": "Llena tus datos",
     "d": "Nombre, área, fecha requerida y urgencia"
    },
    {
     "t": "Elige los insumos",
     "d": "Del catálogo, viendo el stock disponible"
    },
    {
     "t": "Agrega lo que falta",
     "d": "Insumos no registrados y una foto de referencia"
    },
    {
     "t": "Envía",
     "d": "Descargas tu PDF y Almacén recibe el aviso"
    }
   ],
   "actores": [
    {
     "t": "Solicitante",
     "d": "Cualquier área, desde el formulario"
    },
    {
     "t": "Almacén y Compras",
     "d": "Aprueba ítem por ítem y ajusta cantidades"
    },
    {
     "t": "Listo",
     "d": "Entrega con comprobante en PDF"
    }
   ],
   "estados": [
    "Pendiente",
    "Aprobada",
    "Entregada"
   ]
  },
  "aviso": {
   "de": "SiGeDo · Requisiciones",
   "para": "Almacén y Compras",
   "asunto": "Nueva requisición — Diego Martínez · Producción",
   "etiqueta": "NUEVA REQUISICIÓN",
   "cuerpo": "Diego Martínez (Producción) envió una solicitud de insumos.",
   "campos": [
    [
     "Solicitante",
     "Diego Martínez"
    ],
    [
     "Área",
     "Producción"
    ],
    [
     "Urgencia",
     "Urgente"
    ],
    [
     "Fecha requerida",
     "12 de noviembre"
    ]
   ],
   "boton": "Abrir en Almacén"
  },
  "antes": {
   "titulo": "Pedidos de palabra o en papel",
   "d": "Cada área pedía por mensaje o en una hoja, y no quedaba claro qué se aprobó ni qué se entregó."
  },
  "ahora": [
   {
    "t": "Formulario abierto",
    "d": "Sin usuario ni contraseña"
   },
   {
    "t": "Stock a la vista",
    "d": "Al elegir cada insumo"
   },
   {
    "t": "Aviso inmediato",
    "d": "Almacén recibe un correo"
   },
   {
    "t": "Aprobación por ítem",
    "d": "Total, parcial o rechazada"
   },
   {
    "t": "PDF de solicitud",
    "d": "Para quien pide"
   },
   {
    "t": "Comprobante de entrega",
    "d": "Pedido contra entregado"
   }
  ],
  "mercado": "Procurify + Odoo Compras",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Pedir es fácil y queda registrado."
 },
 {
  "key": "mantenimiento",
  "familia": "SiGeDo",
  "nombre": "Mantenimiento",
  "area": "Operación y planta",
  "color": "#073b35",
  "icono": "llave",
  "portada": {
   "titulo": "Antes eran carpetas de papel. Hoy es Mantenimiento.",
   "bajada": "Cada equipo tiene su hoja de vida y cualquier falla se reporta desde un código QR."
  },
  "resumen": "Es el control de los equipos de la planta: hojas de vida, cronograma preventivo, reportes de mantenimiento y reportes de falla. Lo usan el jefe de mantenimiento, los técnicos y cualquier operario que detecte una falla.",
  "funciones": [
   {
    "t": "Hojas de vida",
    "d": "Ficha de cada equipo con fotos, documentos y PDF descargable."
   },
   {
    "t": "Calibraciones",
    "d": "Certificados externos con fecha de la próxima calibración."
   },
   {
    "t": "Cronograma anual",
    "d": "Preventivos programados contra ejecutados, con su porcentaje de cumplimiento."
   },
   {
    "t": "Reportes de mantenimiento",
    "d": "Preventivo, correctivo o predictivo, con técnico, tiempo y costo."
   },
   {
    "t": "Reporte de falla por QR",
    "d": "Desde el celular, sin usuario ni contraseña."
   },
   {
    "t": "Alertas",
    "d": "Mantenimientos próximos o vencidos a la vista."
   },
   {
    "t": "Historial",
    "d": "Todo lo que se le ha hecho a cada equipo."
   },
   {
    "t": "Indicadores",
    "d": "Tiempo medio entre fallas y tiempo medio de reparación por equipo."
   },
   {
    "t": "Técnicos y áreas",
    "d": "Quién atiende y dónde está cada equipo."
   }
  ],
  "pantalla": {
   "tipo": "tarjetas",
   "app": "Mantenimiento",
   "ruta": "Mantenimiento / Hojas de Vida",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Dashboard"
     ]
    },
    {
     "g": "EQUIPOS",
     "i": [
      "Hojas de Vida",
      "Alertas"
     ]
    },
    {
     "g": "MANTENIMIENTO",
     "i": [
      "Reportes de Mantenimiento",
      "Reportes de Fallas",
      "Historial",
      "Cronograma 2026"
     ]
    },
    {
     "g": "INDICADORES",
     "i": [
      "Indicadores"
     ]
    },
    {
     "g": "CONFIGURACIÓN",
     "i": [
      "Técnicos",
      "Áreas",
      "Configuración"
     ]
    }
   ],
   "activo": "Hojas de Vida",
   "acciones": [
    "+ Nuevo Equipo",
    "Reporte PDF"
   ],
   "items": [
    {
     "t": "Dobladora hidráulica",
     "s": "Producción · Próximo: 18 nov",
     "estado": "Activo"
    },
    {
     "t": "Cizalla de lámina",
     "s": "Producción · 1 falla abierta",
     "estado": "Activo"
    },
    {
     "t": "Soldadora MIG 2",
     "s": "Soldadura · Próximo: 25 nov",
     "estado": "Activo"
    },
    {
     "t": "Compresor de aire",
     "s": "Pintura · Próximo: 2 dic",
     "estado": "Activo"
    },
    {
     "t": "Cabina de pintura",
     "s": "Pintura · Calibración al día",
     "estado": "Activo"
    },
    {
     "t": "Taladro de banco",
     "s": "Ensamble · Sin uso este mes",
     "estado": "Inactivo"
    },
    {
     "t": "Troqueladora pequeña",
     "s": "Producción · Reemplazada",
     "estado": "Baja"
    },
    {
     "t": "Horno de curado",
     "s": "Pintura · Próximo: 9 dic",
     "estado": "Activo"
    }
   ]
  },
  "flujo": {
   "titulo": "Reportar una falla toma un minuto",
   "pasos": [
    {
     "t": "Escanea el QR",
     "d": "Con el celular, sin usuario ni contraseña"
    },
    {
     "t": "Elige el equipo",
     "d": "O describe el elemento si no está en la lista"
    },
    {
     "t": "Cuenta qué pasó",
     "d": "Tipo de falla, prioridad, fecha y quién reporta"
    },
    {
     "t": "Mantenimiento la atiende",
     "d": "Abre el reporte con los datos ya cargados"
    }
   ],
   "actores": [
    {
     "t": "Operario",
     "d": "Reporta la falla desde el QR"
    },
    {
     "t": "Jefe de mantenimiento",
     "d": "Asigna técnico y abre el reporte"
    },
    {
     "t": "Técnico",
     "d": "Registra trabajo, tiempo y costo"
    },
    {
     "t": "Listo",
     "d": "Queda en la hoja de vida del equipo"
    }
   ],
   "estados": [
    "Reportada",
    "En mantenimiento",
    "Cerrada"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Hojas de vida en carpetas",
   "d": "La historia de cada equipo estaba en papel y las fallas se avisaban de palabra."
  },
  "ahora": [
   {
    "t": "Falla por QR",
    "d": "Desde cualquier celular"
   },
   {
    "t": "Hoja de vida digital",
    "d": "Fotos, documentos y PDF"
   },
   {
    "t": "Cronograma anual",
    "d": "Programado contra ejecutado"
   },
   {
    "t": "Calibraciones",
    "d": "Con su próxima fecha"
   },
   {
    "t": "Indicadores",
    "d": "Fallas y reparaciones por equipo"
   },
   {
    "t": "Historial completo",
    "d": "Todo queda en un solo lugar"
   }
  ],
  "mercado": "Fracttal + MaintainX",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Cada equipo con su historia, cada falla con su respuesta."
 },
 {
  "key": "activos-fijos",
  "familia": "SiGeDo",
  "nombre": "Activos Fijos",
  "area": "Administración y finanzas",
  "color": "#115e59",
  "icono": "etiqueta",
  "portada": {
   "titulo": "Antes era una lista en Excel. Hoy es Activos Fijos.",
   "bajada": "Cada activo tiene su código QR, su responsable y su historia de traslados."
  },
  "resumen": "Es el registro de los bienes de la empresa: computadores, muebles, herramientas y maquinaria. Lo usa el responsable de activos para asignar, trasladar, dar de baja y tomar inventario con la cámara.",
  "funciones": [
   {
    "t": "Catálogo de activos",
    "d": "Código por categoría, foto, área, responsable y vida útil."
   },
   {
    "t": "Etiquetas QR",
    "d": "Una por activo o todas de una vez para imprimir."
   },
   {
    "t": "Lector QR",
    "d": "Busca un activo escaneando su etiqueta con la cámara."
   },
   {
    "t": "Toma de inventario",
    "d": "Escanea lo que encuentra, marca faltantes y genera el reporte."
   },
   {
    "t": "Traslados",
    "d": "De un área a otra, con responsable, motivo y acta en PDF."
   },
   {
    "t": "Asignaciones",
    "d": "A una persona con su cargo, acta en PDF y registro de devolución."
   },
   {
    "t": "Bajas",
    "d": "Por deterioro, obsolescencia, pérdida, venta o donación, con quién la autorizó."
   },
   {
    "t": "Hoja de vida del activo",
    "d": "PDF con su ficha, traslados y asignaciones."
   },
   {
    "t": "Reportes",
    "d": "PDF general por área y categoría, e importación desde Mantenimiento."
   }
  ],
  "pantalla": {
   "tipo": "tabla",
   "app": "Activos Fijos",
   "ruta": "Activos Fijos / Catálogo de Activos",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Dashboard"
     ]
    },
    {
     "g": "ACTIVOS",
     "i": [
      "Catálogo de Activos",
      "Lector QR"
     ]
    },
    {
     "g": "CONTROL",
     "i": [
      "Traslados",
      "Asignaciones",
      "Bajas"
     ]
    },
    {
     "g": "REPORTES",
     "i": [
      "Reportes"
     ]
    },
    {
     "g": "CONFIGURACIÓN",
     "i": [
      "Categorías",
      "Áreas",
      "Configuración"
     ]
    }
   ],
   "activo": "Catálogo de Activos",
   "acciones": [
    "+ Nuevo Activo",
    "Imprimir QR masivo",
    "Reporte PDF"
   ],
   "columnas": [
    "Código",
    "Nombre",
    "Categoría",
    "Área",
    "Responsable",
    "Estado"
   ],
   "filas": [
    [
     "EC-014",
     "Computador portátil",
     "Equipo de cómputo",
     "Comercial",
     "Luisa Torres",
     "Activo"
    ],
    [
     "MU-031",
     "Escritorio en L",
     "Muebles y enseres",
     "Administración",
     "Ricardo Paz",
     "Activo"
    ],
    [
     "HE-008",
     "Taladro percutor",
     "Herramienta",
     "Producción",
     "Héctor Barrera",
     "En préstamo"
    ],
    [
     "EC-022",
     "Impresora láser",
     "Equipo de cómputo",
     "Calidad",
     "Claudia Mora",
     "En reparación"
    ],
    [
     "MQ-005",
     "Compresor portátil",
     "Maquinaria",
     "Producción",
     "Miguel Ríos",
     "Activo"
    ],
    [
     "EC-027",
     "Monitor de 24 pulgadas",
     "Equipo de cómputo",
     "Diseño",
     "María José Castro",
     "Activo"
    ],
    [
     "MU-044",
     "Silla ergonómica",
     "Muebles y enseres",
     "Talento Humano",
     "Lorena Gil",
     "Baja"
    ]
   ]
  },
  "flujo": {
   "titulo": "La vida de un activo, de punta a punta",
   "pasos": [
    {
     "t": "Regístralo",
     "d": "Código automático por categoría y foto"
    },
    {
     "t": "Etiquétalo",
     "d": "Imprime su código QR y pégalo"
    },
    {
     "t": "Asígnalo o trasládalo",
     "d": "Cada movimiento deja su acta en PDF"
    },
    {
     "t": "Dale de baja",
     "d": "Con motivo y quién la autorizó"
    }
   ],
   "actores": [
    {
     "t": "Responsable de activos",
     "d": "Registra, etiqueta y toma inventario"
    },
    {
     "t": "Colaborador",
     "d": "Recibe el activo con su acta"
    },
    {
     "t": "Quien autoriza",
     "d": "Aprueba traslados y bajas"
    },
    {
     "t": "Listo",
     "d": "Cada bien con dueño y ubicación"
    }
   ],
   "estados": [
    "Activo",
    "En reparación",
    "Baja"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Lista en hoja de cálculo",
   "d": "Los activos se listaban a mano y las entregas se firmaban en hojas sueltas."
  },
  "ahora": [
   {
    "t": "Código QR",
    "d": "En cada activo"
   },
   {
    "t": "Inventario con cámara",
    "d": "Escanea y marca faltantes"
   },
   {
    "t": "Actas en PDF",
    "d": "Asignación, traslado y baja"
   },
   {
    "t": "Responsable claro",
    "d": "Quién tiene qué y dónde"
   },
   {
    "t": "Bajas con motivo",
    "d": "Y quién las autorizó"
   },
   {
    "t": "Hoja de vida",
    "d": "La historia de cada activo"
   }
  ],
  "mercado": "EZOfficeInventory + Asset Panda",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Cada bien de la empresa, ubicado y con responsable."
 },
 {
  "key": "gestion-snc",
  "familia": "SiGeDo",
  "nombre": "Gestión SNC",
  "area": "Calidad",
  "color": "#92400e",
  "icono": "alerta",
  "portada": {
   "titulo": "Antes era un formato que se perdía. Hoy es Gestión SNC.",
   "bajada": "Cada salida no conforme llega al proceso responsable y no se cierra sin plan de acción."
  },
  "resumen": "Es el registro de las salidas no conformes de todos los procesos de la empresa. Cualquier colaborador reporta desde un QR y el líder de cada proceso responde, ejecuta y cierra.",
  "funciones": [
   {
    "t": "Reporte por QR",
    "d": "Formulario abierto con descripción, acción inmediata y evidencia en fotos o PDF."
   },
   {
    "t": "Bandeja por proceso",
    "d": "Cada líder ve solo las SNC de su proceso, con número propio."
   },
   {
    "t": "Respuesta del líder",
    "d": "Tratamiento aplicado, causa raíz y respuesta, para aprobación del administrador."
   },
   {
    "t": "Plan de acción",
    "d": "Actividades asignadas con estado pendiente, en progreso o completada."
   },
   {
    "t": "Trazabilidad",
    "d": "Notas y evidencias en orden, con relación descargable en PDF."
   },
   {
    "t": "Reasignar proceso",
    "d": "Si la SNC le corresponde a otra área, pasa al líder correcto."
   },
   {
    "t": "Campana de avisos",
    "d": "Avisa cuando alguien responde o comenta una SNC."
   },
   {
    "t": "Indicadores",
    "d": "Malla por proceso y mes, días promedio de cierre y tendencia por tipo."
   },
   {
    "t": "Catálogos",
    "d": "Tipos de SNC y tratamientos que se eligen en los formularios."
   }
  ],
  "pantalla": {
   "tipo": "tabla",
   "app": "Gestión SNC",
   "ruta": "Gestión SNC / Bandeja",
   "menu": [
    {
     "g": "PRINCIPAL",
     "i": [
      "Bandeja",
      "Indicadores",
      "Tipos de SNC",
      "Reportar SNC (QR)"
     ]
    }
   ],
   "activo": "Bandeja",
   "acciones": [
    "Limpiar filtros",
    "Reportar SNC (QR)"
   ],
   "columnas": [
    "N° SNC",
    "Proceso",
    "Tipo",
    "Reportante",
    "Fecha hechos",
    "Estado"
   ],
   "filas": [
    [
     "PROD-012",
     "Producción",
     "Defecto de soldadura",
     "Héctor Barrera",
     "3 nov",
     "Abierta"
    ],
    [
     "ALM-004",
     "Almacén",
     "Insumo entregado errado",
     "Diego Martínez",
     "31 oct",
     "Respondida"
    ],
    [
     "LOG-007",
     "Logística",
     "Despacho con accesorio faltante",
     "Luisa Torres",
     "28 oct",
     "En plan de acción"
    ],
    [
     "PROD-011",
     "Producción",
     "Pintura con desprendimiento",
     "Miguel Ríos",
     "27 oct",
     "En plan de acción"
    ],
    [
     "MNT-003",
     "Mantenimiento",
     "Equipo entregado sin prueba",
     "Camilo Rojas",
     "24 oct",
     "Actividad completada"
    ],
    [
     "COM-005",
     "Comercial",
     "Cotización desactualizada",
     "Lorena Gil",
     "20 oct",
     "Cerrada"
    ],
    [
     "DIS-002",
     "Diseño",
     "Plano sin revisión",
     "Ricardo Paz",
     "17 oct",
     "Cerrada"
    ]
   ]
  },
  "flujo": {
   "titulo": "Reportar una salida no conforme toma un minuto",
   "pasos": [
    {
     "t": "Escanea el QR",
     "d": "Sin usuario ni contraseña"
    },
    {
     "t": "Cuenta qué pasó",
     "d": "Proceso responsable, tipo, descripción y acción inmediata"
    },
    {
     "t": "Adjunta evidencia",
     "d": "Fotos o PDF"
    },
    {
     "t": "El líder responde",
     "d": "Tratamiento, causa raíz y plan de acción"
    }
   ],
   "actores": [
    {
     "t": "Quien reporta",
     "d": "Cualquier colaborador, desde el QR"
    },
    {
     "t": "Líder de proceso",
     "d": "Responde y ejecuta el plan"
    },
    {
     "t": "Administrador SNC",
     "d": "Aprueba, asigna actividades y cierra"
    },
    {
     "t": "Listo",
     "d": "Caso cerrado y trazable"
    }
   ],
   "estados": [
    "Abierta",
    "En plan de acción",
    "Cerrada"
   ]
  },
  "aviso": {
   "de": "SiGeDo · Gestión SNC",
   "para": "Líder del proceso responsable",
   "asunto": "Nueva SNC — Producción",
   "etiqueta": "NUEVA SALIDA NO CONFORME",
   "cuerpo": "Se reportó una salida no conforme del proceso Producción: poros en la soldadura de la cámara de combustión.",
   "campos": [
    [
     "Reportante",
     "Héctor Barrera"
    ],
    [
     "Fecha de los hechos",
     "3 de noviembre"
    ],
    [
     "Tipo de SNC",
     "Defecto de soldadura"
    ]
   ],
   "boton": "Ver en Gestión SNC"
  },
  "antes": {
   "titulo": "Formato impreso o un mensaje",
   "d": "Las no conformidades se reportaban en papel o por chat, y el seguimiento dependía de la memoria."
  },
  "ahora": [
   {
    "t": "Reporte por QR",
    "d": "Desde cualquier celular"
   },
   {
    "t": "Cada líder ve lo suyo",
    "d": "Por proceso"
   },
   {
    "t": "Plan de acción",
    "d": "Con actividades y evidencias"
   },
   {
    "t": "Trazabilidad",
    "d": "Todo lo hecho, en orden"
   },
   {
    "t": "Aviso por correo",
    "d": "Al líder y al administrador"
   },
   {
    "t": "Malla de indicadores",
    "d": "Verde, ámbar o rojo por mes"
   }
  ],
  "mercado": "Kawak + Isotools",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Cada error se reporta, se corrige y se aprende."
 },
 {
  "key": "gestion-comercial",
  "familia": "SiGeDo",
  "nombre": "Gestión Comercial",
  "area": "Comercial y clientes",
  "color": "#0f5e63",
  "icono": "grafica",
  "portada": {
   "titulo": "Antes era un Excel por revisar. Hoy es Gestión Comercial.",
   "bajada": "Las conversaciones del CRM y el informe de cada asesor se convierten en tableros claros, mes a mes."
  },
  "resumen": "Tablero comercial que lee el reporte mensual del CRM y muestra conversaciones, tiempos de respuesta y desempeño por asesor. Incluye el Informe Comercial que cada asesor cierra y firma, y que el líder aprueba.",
  "funciones": [
   {
    "t": "Dashboard mensual",
    "d": "Filtra por día, asesor, departamento y fuente del contacto."
   },
   {
    "t": "Meta de primera respuesta",
    "d": "Tú fijas los minutos y el tablero marca quién cumple."
   },
   {
    "t": "Tendencia anual",
    "d": "Los indicadores de cada mes en una sola línea de tiempo."
   },
   {
    "t": "Comparar meses",
    "d": "Dos periodos lado a lado con la diferencia calculada."
   },
   {
    "t": "Historial de reportes",
    "d": "Cada mes cargado queda como una tarjeta para volver a abrir."
   },
   {
    "t": "Cargar Excel del CRM",
    "d": "Se arrastra el archivo y el resumen del mes se guarda solo."
   },
   {
    "t": "Informe Comercial",
    "d": "Ventas, prospectos, licitaciones, ofertas, SNC, PQRSF y garantías del asesor."
   },
   {
    "t": "Consolidado del equipo",
    "d": "Cumplimiento de metas y ventas de todos los asesores en una vista."
   },
   {
    "t": "Descarga en PDF",
    "d": "Cada tablero e informe sale listo para imprimir."
   }
  ],
  "pantalla": {
   "tipo": "panel",
   "app": "SiGeDo Comercial",
   "ruta": "Gestión Comercial / Métricas CRM",
   "menu": [
    {
     "g": "GESTIÓN COMERCIAL",
     "i": [
      "Métricas CRM",
      "Gestión de Ventas",
      "Comisiones",
      "Telemercadeo",
      "Informe Comercial",
      "Mapa SECOP"
     ]
    },
    {
     "g": "SERVICIO POST VENTA",
     "i": [
      "Garantías",
      "Encuesta de Satisfacción"
     ]
    }
   ],
   "activo": "Métricas CRM",
   "acciones": [
    "Descargar PDF",
    "Cargar Excel"
   ],
   "kpis": [
    {
     "v": "214",
     "t": "Conversaciones"
    },
    {
     "v": "138",
     "t": "Nuevos contactos"
    },
    {
     "v": "92",
     "t": "Desde anuncio"
    },
    {
     "v": "9 min",
     "t": "1ª respuesta promedio"
    }
   ],
   "barras": [
    {
     "t": "Valentina Ospina",
     "v": 82
    },
    {
     "t": "Julián Cardona",
     "v": 68
    },
    {
     "t": "Marcela Quintero",
     "v": 55
    },
    {
     "t": "Sebastián Vargas",
     "v": 41
    },
    {
     "t": "Tatiana Muñoz",
     "v": 30
    }
   ]
  },
  "flujo": {
   "titulo": "El informe del mes se cierra y se firma en línea",
   "pasos": [
    {
     "t": "Abre el informe",
     "d": "Elige el periodo y el asesor"
    },
    {
     "t": "Completa las secciones",
     "d": "Los prospectos del CRM llegan solos"
    },
    {
     "t": "Cierra y firma",
     "d": "El asesor entrega su informe al líder"
    },
    {
     "t": "Aprobación",
     "d": "El líder aprueba y firma, o lo devuelve a borrador"
    }
   ],
   "actores": [
    {
     "t": "Asesor",
     "d": "Llena y cierra su informe del mes"
    },
    {
     "t": "Líder del área",
     "d": "Revisa, aprueba y firma"
    },
    {
     "t": "Gerente Comercial",
     "d": "Ve el consolidado del equipo"
    },
    {
     "t": "Listo",
     "d": "Informe aprobado y en PDF"
    }
   ],
   "estados": [
    "Borrador",
    "Pendiente de aprobación",
    "Aprobado"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Excel del CRM revisado a mano",
   "d": "El reporte del CRM se miraba fila por fila y el informe de cada asesor se armaba aparte, en documentos sueltos."
  },
  "ahora": [
   {
    "t": "Carga en segundos",
    "d": "Se arrastra el Excel y listo"
   },
   {
    "t": "Tiempos de respuesta",
    "d": "Cumple, intermedio o no cumple"
   },
   {
    "t": "Ranking de asesores",
    "d": "Conversaciones y resueltas por persona"
   },
   {
    "t": "Mes contra mes",
    "d": "Comparación lado a lado"
   },
   {
    "t": "Informe firmado",
    "d": "Asesor cierra, líder aprueba"
   },
   {
    "t": "PDF al instante",
    "d": "Tableros e informes para imprimir"
   }
  ],
  "mercado": "HubSpot Sales Hub + Zoho Analytics",
  "tech": "HTML · JavaScript · Firebase · Chart.js · SheetJS · jsPDF",
  "cierre": "Los números del equipo comercial, claros y en un solo lugar."
 },
 {
  "key": "mapa-secop",
  "familia": "SiGeDo",
  "nombre": "Mapa SECOP",
  "area": "Comercial y clientes",
  "color": "#4c1d95",
  "icono": "mapa",
  "portada": {
   "titulo": "Antes era un reparto de palabra. Hoy es Mapa SECOP.",
   "bajada": "Colombia dividida en seis regiones, cada una con un comercial responsable que rota cada trimestre."
  },
  "resumen": "Mapa interactivo que reparte el país en seis zonas para la búsqueda de contratación pública en SECOP. Cada comercial sabe qué departamentos le tocan, desde cuándo y cuándo cambia.",
  "funciones": [
   {
    "t": "Mapa territorial",
    "d": "Departamentos y Bogotá agrupados en seis zonas de color."
   },
   {
    "t": "Responsable por zona",
    "d": "Quién atiende cada región en el periodo actual."
   },
   {
    "t": "Rotación trimestral",
    "d": "El responsable cambia cada tres meses, en ciclo."
   },
   {
    "t": "Próximo trimestre",
    "d": "Vista previa de cómo quedarán las zonas."
   },
   {
    "t": "Historial trimestral",
    "d": "Los cambios anteriores se conservan."
   },
   {
    "t": "Municipios",
    "d": "Al elegir un departamento se ven sus municipios."
   },
   {
    "t": "Mi zona actual",
    "d": "Cada comercial ve primero lo que le corresponde."
   },
   {
    "t": "Configuración",
    "d": "Fecha inicial, orden de rotación y comercial inicial por zona."
   },
   {
    "t": "Pantalla completa",
    "d": "Para revisarlo en reunión de equipo."
   }
  ],
  "pantalla": {
   "tipo": "tarjetas",
   "app": "SiGeDo SECOP",
   "ruta": "Gestión Comercial / Mapa SECOP",
   "menu": [
    {
     "g": "GESTIÓN COMERCIAL",
     "i": [
      "Métricas CRM",
      "Gestión de Ventas",
      "Comisiones",
      "Telemercadeo",
      "Informe Comercial",
      "Mapa SECOP"
     ]
    },
    {
     "g": "SERVICIO POST VENTA",
     "i": [
      "Garantías",
      "Encuesta de Satisfacción"
     ]
    }
   ],
   "activo": "Mapa SECOP",
   "acciones": [
    "Pantalla completa",
    "Configurar mapa"
   ],
   "items": [
    {
     "t": "Región Norte · Caribe",
     "s": "Valentina Ospina",
     "estado": "Periodo actual"
    },
    {
     "t": "Región Noroccidente · Eje Cafetero",
     "s": "Julián Cardona",
     "estado": "Periodo actual"
    },
    {
     "t": "Región Centro · Oriente",
     "s": "Marcela Quintero",
     "estado": "Periodo actual"
    },
    {
     "t": "Región Suroccidente · Pacífico",
     "s": "Sebastián Vargas",
     "estado": "Periodo actual"
    },
    {
     "t": "Región Sur · Alto Magdalena y Amazonía",
     "s": "Tatiana Muñoz",
     "estado": "Periodo actual"
    },
    {
     "t": "Región Llanos · Amazonía Oriental",
     "s": "Óscar Medina",
     "estado": "Periodo actual"
    }
   ]
  },
  "flujo": {
   "titulo": "El reparto del país se arma una vez y rota solo",
   "pasos": [
    {
     "t": "Fecha inicial",
     "d": "Se define cuándo empieza el ciclo"
    },
    {
     "t": "Orden de rotación",
     "d": "Los seis comerciales en un ciclo circular"
    },
    {
     "t": "Comercial inicial",
     "d": "Una persona distinta en cada zona"
    },
    {
     "t": "Rota cada trimestre",
     "d": "El mapa cambia de responsable solo"
    }
   ],
   "actores": [
    {
     "t": "Gerencia",
     "d": "Configura y aprueba el mapa"
    },
    {
     "t": "Comercial",
     "d": "Consulta su zona y sus municipios"
    },
    {
     "t": "Equipo comercial",
     "d": "Ve el reparto completo del país"
    },
    {
     "t": "Listo",
     "d": "Cada zona con su responsable"
    }
   ],
   "estados": [
    "Configuración pendiente",
    "Periodo actual",
    "Próximo trimestre"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Reparto de palabra",
   "d": "Quién revisaba cada departamento se acordaba en reunión y no quedaba registro de los cambios."
  },
  "ahora": [
   {
    "t": "Seis regiones fijas",
    "d": "Todo el país cubierto"
   },
   {
    "t": "Un responsable por zona",
    "d": "Sin cruces ni huecos"
   },
   {
    "t": "Cambio cada trimestre",
    "d": "Rotación automática"
   },
   {
    "t": "Fechas claras",
    "d": "Inicio y próximo cambio"
   },
   {
    "t": "Historial guardado",
    "d": "Nada se borra al reconfigurar"
   },
   {
    "t": "Mapa sin internet externo",
    "d": "Cartografía del DANE guardada localmente"
   }
  ],
  "mercado": "Salesforce Maps + Badger Maps",
  "tech": "HTML · JavaScript · Firebase · Mapa SVG con datos del DANE",
  "cierre": "Todo el país cubierto, con un responsable claro en cada zona."
 },
 {
  "key": "generadores",
  "familia": "SiGeDo",
  "nombre": "Generadores de firma y rótulos",
  "area": "Documentos",
  "color": "#0e5a73",
  "icono": "etiqueta",
  "portada": {
   "titulo": "Antes cada quien hacía los suyos. Hoy son los Generadores de SiGeDo.",
   "bajada": "Firmas de correo y rótulos de archivo iguales para toda la empresa, en minutos."
  },
  "resumen": "Son dos herramientas de SiGeDo: el Generador de Firma de Correo y el Sistema de Rotulación Archivística. Las usa cualquier colaborador para su firma en Gmail y el equipo de archivo para rotular carpetas y cajas.",
  "funciones": [
   {
    "t": "Firma de correo corporativa",
    "d": "Nombre, cargo, celular y correo; si un campo no aplica, no aparece."
   },
   {
    "t": "Vista previa en vivo",
    "d": "Así se verá la firma en el correo."
   },
   {
    "t": "Copiar y pegar en Gmail",
    "d": "Con la guía paso a paso para dejarla predeterminada."
   },
   {
    "t": "Tres tipos de rótulo",
    "d": "Lomo de carpeta AZ, carpeta o expediente y caja de archivo X300."
   },
   {
    "t": "Formato oficial",
    "d": "Encabezado de control con código, versión y fecha del formato."
   },
   {
    "t": "Autocompletar desde la TRD",
    "d": "Sección, subsección y serie salen de Gestión Documental."
   },
   {
    "t": "Edición con un clic",
    "d": "Cualquier campo se edita sobre el mismo rótulo."
   },
   {
    "t": "PDF a tamaño real",
    "d": "Uno por uno o todos de una vez, listos para imprimir."
   },
   {
    "t": "Tutorial guiado",
    "d": "Seis pasos para aprender a usarlo."
   }
  ],
  "pantalla": {
   "tipo": "tarjetas",
   "app": "SiGeDo",
   "ruta": "Generadores / Rótulos",
   "menu": [
    {
     "g": "GENERADORES",
     "i": [
      "Firma de correo",
      "Rótulos"
     ]
    }
   ],
   "activo": "Rótulos",
   "acciones": [
    "Subir logo",
    "Descargar todos en PDF"
   ],
   "items": [
    {
     "t": "Lomo de carpeta AZ",
     "s": "7,5 × 22 cm · Talento Humano",
     "estado": "Listo"
    },
    {
     "t": "Carpeta / Expediente",
     "s": "24 × 14 cm · ES-GDO-FOR-01",
     "estado": "Listo"
    },
    {
     "t": "Caja de archivo X300",
     "s": "28 × 14 cm · ES-GDO-FOR-02",
     "estado": "En edición"
    },
    {
     "t": "Lomo de carpeta AZ",
     "s": "7,5 × 22 cm · Producción",
     "estado": "Listo"
    },
    {
     "t": "Firma de Laura Martínez",
     "s": "Coordinadora de Talento Humano",
     "estado": "Copiada"
    },
    {
     "t": "Firma de Carlos Ramírez",
     "s": "Asesor comercial",
     "estado": "Copiada"
    },
    {
     "t": "Firma de Paula Vega",
     "s": "Auxiliar de archivo",
     "estado": "En edición"
    }
   ]
  },
  "flujo": {
   "titulo": "Un rótulo en dos minutos",
   "pasos": [
    {
     "t": "Elige el rótulo",
     "d": "Lomo AZ, carpeta o caja X300"
    },
    {
     "t": "Autocompleta desde la TRD",
     "d": "Sección, subsección y serie documental"
    },
    {
     "t": "Ajusta los campos",
     "d": "Fechas extremas, número de carpeta y folios"
    },
    {
     "t": "Descarga el PDF",
     "d": "Tamaño exacto para imprimir y pegar"
    }
   ],
   "actores": [
    {
     "t": "Auxiliar de archivo",
     "d": "Arma el rótulo"
    },
    {
     "t": "Gestión Documental",
     "d": "Aporta las series de la TRD"
    },
    {
     "t": "Listo",
     "d": "Carpetas y cajas rotuladas igual"
    }
   ],
   "estados": [
    "En edición",
    "Listo",
    "Impreso"
   ]
  },
  "aviso": null,
  "antes": {
   "titulo": "Cada quien a su manera",
   "d": "Las firmas y los rótulos se armaban por separado, con formatos y tamaños distintos."
  },
  "ahora": [
   {
    "t": "Firma igual para todos",
    "d": "Con la imagen de la marca"
   },
   {
    "t": "Lista en Gmail",
    "d": "Copiar y pegar"
   },
   {
    "t": "Formato oficial",
    "d": "Rótulos con código y versión"
   },
   {
    "t": "Series desde la TRD",
    "d": "Sin escribirlas a mano"
   },
   {
    "t": "Tamaño exacto",
    "d": "PDF listo para imprimir"
   },
   {
    "t": "Todos de una vez",
    "d": "Una sola descarga"
   }
  ],
  "mercado": "WiseStamp + Avery Design & Print",
  "tech": "HTML · JavaScript · Firebase · jsPDF",
  "cierre": "La imagen de la empresa, igual en cada correo y en cada caja."
 },
 {
  "key": "administracion-sigedo",
  "familia": "SiGeDo",
  "nombre": "Panel Admin de SiGeDo",
  "area": "Administración y finanzas",
  "color": "#1f3a4d",
  "icono": "llave",
  "portada": {
   "titulo": "Antes cada quien pedía acceso como podía. Hoy es el Panel Admin.",
   "bajada": "Un solo lugar para decidir quién entra a cada módulo y qué puede hacer adentro."
  },
  "resumen": "El Panel Admin es la puerta de entrada de SiGeDo: crea los usuarios y les asigna módulos y roles. Solo lo usa el administrador; nadie puede darse acceso por su cuenta.",
  "funciones": [
   {
    "t": "Crear usuarios",
    "d": "Con correo y una contraseña temporal para el primer ingreso."
   },
   {
    "t": "Asignar módulos",
    "d": "Uno o varios: Gestión Documental, Talento Humano, Almacén, Mantenimiento, Producción y más."
   },
   {
    "t": "Roles por módulo",
    "d": "Quién solo registra y quién tiene control total, en cada área."
   },
   {
    "t": "Acceso por áreas",
    "d": "En Gestión Documental se limita qué secciones, TRD e inventarios ve cada usuario."
   },
   {
    "t": "Procesos en SNC",
    "d": "Cada líder ve y responde solo las de sus procesos."
   },
   {
    "t": "Invitación por correo",
    "d": "El usuario recibe un enlace para poner su propia contraseña."
   },
   {
    "t": "Editar y quitar acceso",
    "d": "Cambiar módulos o eliminar el acceso de un usuario."
   },
   {
    "t": "Estadísticas",
    "d": "Registros por módulo, distribución de usuarios y registros recientes."
   },
   {
    "t": "Estado de módulos",
    "d": "Acceso directo a cada módulo de la plataforma."
   }
  ],
  "pantalla": {
   "tipo": "tabla",
   "app": "Panel Admin",
   "ruta": "Panel Admin / Usuarios",
   "menu": [
    {
     "g": "PANEL",
     "i": [
      "Usuarios",
      "Estadísticas",
      "Estado módulos",
      "Crear usuario"
     ]
    }
   ],
   "activo": "Usuarios",
   "acciones": [
    "Crear usuario",
    "Enviar invitación"
   ],
   "columnas": [
    "Usuario",
    "Módulos asignados",
    "Rol",
    "Registrado",
    "Estado"
   ],
   "filas": [
    [
     "Laura Martínez",
     "Talento Humano",
     "Jefe de Talento Humano",
     "3 feb 2026",
     "Activo"
    ],
    [
     "Jorge López",
     "Almacén",
     "Auxiliar de Almacén",
     "10 feb 2026",
     "Activo"
    ],
    [
     "Iván Salazar",
     "Producción",
     "Operario",
     "2 mar 2026",
     "Activo"
    ],
    [
     "Fabián Mejía",
     "Mantenimiento",
     "Técnico",
     "15 mar 2026",
     "Activo"
    ],
    [
     "Daniela Reyes",
     "Control y Calidad · Gestión SNC",
     "Auxiliar de Calidad",
     "8 abr 2026",
     "Activo"
    ],
    [
     "Carlos Ramírez",
     "Gestión Comercial",
     "Asesor",
     "20 may 2026",
     "Activo"
    ],
    [
     "Natalia Ortiz",
     "—",
     "—",
     "4 nov 2026",
     "Sin módulos"
    ]
   ]
  },
  "flujo": {
   "titulo": "Dar acceso toma un minuto",
   "pasos": [
    {
     "t": "Crea el usuario",
     "d": "Correo y contraseña temporal"
    },
    {
     "t": "Marca sus módulos",
     "d": "Uno o varios, según su trabajo"
    },
    {
     "t": "Elige su rol",
     "d": "Qué puede hacer y qué no en cada módulo"
    },
    {
     "t": "Envía la invitación",
     "d": "El usuario pone su propia contraseña"
    }
   ],
   "actores": [
    {
     "t": "Administrador",
     "d": "Crea el usuario y asigna módulos"
    },
    {
     "t": "Usuario",
     "d": "Recibe el correo y entra"
    },
    {
     "t": "Listo",
     "d": "Cada quien ve solo lo que le corresponde"
    }
   ],
   "estados": [
    "Sin módulos",
    "Módulos asignados",
    "Acceso activo"
   ]
  },
  "aviso": {
   "de": "SiGeDo",
   "para": "Usuario nuevo",
   "asunto": "Restablece tu contraseña de SiGeDo",
   "etiqueta": "INVITACIÓN",
   "cuerpo": "Usa este enlace para crear tu propia contraseña y entrar a SiGeDo.",
   "campos": [
    [
     "Cuenta",
     "Laura Martínez"
    ]
   ],
   "boton": "Crear mi contraseña"
  },
  "antes": {
   "titulo": "Accesos sueltos",
   "d": "Cada módulo manejaba sus propios accesos y no había un lugar para ver quién entraba a qué."
  },
  "ahora": [
   {
    "t": "Un solo panel",
    "d": "Todos los usuarios en una tabla"
   },
   {
    "t": "Roles claros",
    "d": "Quién registra y quién borra"
   },
   {
    "t": "Nadie se autoasigna",
    "d": "Solo el administrador da acceso"
   },
   {
    "t": "Invitación segura",
    "d": "Cada usuario pone su contraseña"
   },
   {
    "t": "Acceso por áreas",
    "d": "Cada quien ve lo suyo"
   },
   {
    "t": "Retiro inmediato",
    "d": "Se quita el acceso en un clic"
   }
  ],
  "mercado": "Okta + JumpCloud",
  "tech": "HTML · JavaScript · Firebase",
  "cierre": "Más módulos, sin perder el control de quién entra."
 }
];
