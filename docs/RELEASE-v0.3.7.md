# Compás 0.3.7 · Un espacio para acompañarte

Versión para el piloto. Compás permite empezar con un paso pequeño o una página del diario, sin exigir un título o una pregunta terminados. No es necesario llenar todos los apartados.

## Cambios

- Pantallas más despejadas: se eliminan los rótulos sobre los títulos principales y las descripciones repetidas en todas las vistas. Se mantienen avisos breves de privacidad y los datos de proyecto, fechas, estados, hitos y guardado.
- Opción «Sin marco» para mostrar la foto sola, con adornos opcionales. La ayuda distingue guardar un formulario, el guardado automático del navegador y descargar un respaldo.

- Uso definido para computadora y un navegador habitual. En celulares y tabletas se muestra un aviso antes de abrir almacenamiento o iniciar la bitácora. Una ventana estrecha de escritorio conserva su funcionamiento. Los respaldos JSON pueden guardarse localmente o en una carpeta de nube configurada por el usuario; la subida requiere internet y no crea sincronización entre dispositivos.

- ToDo exporta una selección de tareas pendientes con fecha como ICS para importar en Google Calendar, Calendario de Apple u Outlook. Eventos de día completo con título y fecha; sin notas privadas ni sincronización automática.
- El módulo Supervisión se llama Asesoría de tesis en la navegación, los formularios, la ayuda y los reportes. Las claves internas y los respaldos anteriores siguen siendo compatibles.

- Explicaciones en todos los botones al pasar el ratón o enfocarlos con el teclado. Escape cierra la explicación antes del diálogo.
- Diario privado con páginas fechadas, creación, edición y eliminación. Conserva las reflexiones anteriores y se incluye en el respaldo; queda fuera de los reportes.
- Dedicación en **ToDo → Registrar dedicación (opcional)**, plegada debajo de las tareas. Conserva los registros de actividades y horas existentes. Diario queda dedicado a escribir. Conversaciones y decisiones en una sección desplegable de Brújula.
- Rincón personal con marcos de Lino, Madera, Jardín y Arcilla, formas suaves y texturas tenues. Flores, hojas o estrellas sobre las esquinas y los bordes de la foto, con el centro despejado; la vista previa muestra la composición. Sin foto o en modo fondo, los adornos acompañan una tarjeta «A tu ritmo».
- Invitación discreta al completar una tarea, producto o compromiso; se puede cerrar y desactivar. Todos los adornos están disponibles desde el principio, sin puntos ni rachas. Completar tareas no aprueba productos.
- Cómo usar Compás comienza por descargar y descomprimir el ZIP, distingue los archivos, explica que Compas.html se abre en el navegador sin instalación y describe respaldo, cierre y reapertura en cada sesión.
- ZIP reducido a la aplicación, una guía HTML y un TXT con ligas a los materiales en línea. El video, las animaciones y las comprobaciones se consultan en la página de Compás.
- Código modularizado y optimizaciones de validación, guardado y reportes de la auditoría del 3 de octubre.
- Mapa, tres recorridos y video actualizados con las pantallas despejadas; el recorrido de ToDo incluye dedicación opcional, foto sin marco, adornos y Diario.

## Compatibilidad y comprobaciones

Se mantiene el esquema 2 y la apertura de respaldos anteriores. Los registros de dedicación se conservan en `timeEntries`, aunque ahora se consultan desde ToDo; siguen incluidos en el respaldo y fuera de los reportes. Las preferencias de apariencia antiguas reciben valores predeterminados para las opciones nuevas. Las selecciones anteriores de Sencillo y Cielo se conservan con los nombres Lino y Arcilla. Los marcos, adornos y la foto son locales al navegador y no forman parte del respaldo.

167 comprobaciones automatizadas, build reproducible y ZIP validado. Navegador aislado en macOS por servidor local y apertura directa con `file://`: rincón y vista previa compuestos, adornos sobre los bordes de la foto, tarjeta sin foto, tamaños de 390 a 1150 píxeles sin obstáculos, diario y preferencias conservados al recargar, exclusión del diario de reportes, ayuda con ratón y teclado, diálogo y Escape, ventanas estrechas de escritorio sin desbordamiento y recorridos de ruta, tareas, diario, adornos, reportes y respaldo. La exportación de calendario se comprueba con selección, privacidad, escape de texto, UTF-8, fechas bisiestas y límites del año. El navegador descargó calendarios de 1,001 tareas sin modificar la bitácora; se verificaron estados vacíos, títulos legibles y fechas separadas. Las pruebas de iPhone, Android e iPad verificaron el aviso con cero accesos al almacenamiento y conservaron intactos los datos de prueba. También se cerró completamente Chromium y se volvió a abrir el mismo HTML con un perfil ficticio persistente: la entrada del diario se recuperó.

Las comprobaciones manuales de distribución amplia en Windows y otros navegadores siguen pendientes según la guía de desarrollo. Esta entrega se presenta como piloto.
