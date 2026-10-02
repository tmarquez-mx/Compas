# Compás

Seguimiento del proceso de tesis para el Posgrado en Ciencias Sociales y Políticas de la Ibero.

## Abrir el prototipo

Abre dist/index.html con doble clic y elige tu navegador. Es un archivo autosuficiente: funciona sin internet y sin instalar dependencias.

Al abrirlo por primera vez encontrarás un ejemplo ficticio. Puedes modificarlo para explorar las funciones o elegir Empezar mi bitácora. Si el navegador conserva una copia auxiliar previa, Compás la recupera.

## Recorrido sugerido

1. En Brújula, edita el rumbo: nivel (maestría o doctorado), semestre actual, pregunta, objetivos, enfoque, alcance y próximo hito.
2. En Mi ruta, consulta los productos de cada semestre. Registra versiones, referencias de avance, revisión con la dirección y ajustes del plan. Cada actualización conserva el registro anterior.
3. En ToDo, desglosa el trabajo en tareas privadas. Puedes vincularlas con compromisos y productos; terminarlas no cierra automáticamente los otros registros.
4. Registra un coloquio o una reunión de supervisión. Agrega un compromiso vinculado a esa sesión.
5. Revisa ese compromiso, distingue tu decisión sobre el comentario de su estado de atención y anota una evidencia de avance o respuesta.
6. Registra una decisión metodológica. Usa Registrar cambio posterior cuando el rumbo evolucione; la decisión previa permanece en el historial.
7. En Dedicación, captura actividades y reflexiones privadas.
8. Descarga el respaldo personal para conservar todo el trabajo. Usa Abrir respaldo para continuar.
9. En Reportes, selecciona el periodo y los registros, revisa la copia y descarga el panel de consulta o Excel. Para obtener un PDF, usa Imprimir / Guardar PDF y elige Guardar como PDF en el diálogo del navegador.

## Archivos y privacidad

El respaldo JSON contiene todos los módulos, el ToDo, el historial de productos, las horas y las notas privadas. Es editable por Compás, no está cifrado y no debe compartirse con la dirección como si fuera un reporte.

Los reportes se construyen mediante una selección explícita de campos académicos. No contienen las tareas ToDo ni sus conteos, los registros de dedicación ni sus totales, reflexiones, notas privadas o el historial completo de los productos. No basta con ocultar información en pantalla: los datos privados no se incluyen en los archivos compartibles.

La exclusión automática de campos de nombres no elimina nombres escritos libremente en otros textos. Revisa la vista previa antes de compartir. Tampoco detecta automáticamente datos sensibles.

Registra decisiones metodológicas y revisiones de avances. Evita entrevistas, transcripciones, bases de datos, nombres de participantes de la investigación y lugares sensibles.

La aplicación no envía contenido a servidores. No usa fuentes remotas, analítica, servicios de IA ni dependencias de red. Una política de seguridad bloquea conexiones desde la página. La copia auxiliar del navegador es de conveniencia; puede borrarse o no estar disponible, especialmente en navegación privada o al abrir archivos locales. El respaldo descargado es la forma de conservar el trabajo.

Si guardas un archivo en Google Drive, OneDrive, iCloud u otra carpeta sincronizada, ese archivo también puede almacenarse en la nube por decisión o configuración de tu equipo.

El panel HTML de consulta es autosuficiente y puede abrirse sin internet. Lleva una fecha de corte, permite filtrar compromisos y no modifica la bitácora original ni recibe actualizaciones automáticas. Su PDF incluye todos los registros seleccionados al generar esa copia, aunque se haya aplicado un filtro de consulta.

## Mi ruta y ToDo

Las rutas son la transcripción operativa de los dos borradores compartidos por la coordinación el 10 de septiembre de 2026. La versión de referencia se identifica como borrador-2026-09-10; no se presenta como reglamento oficial.

Maestría tiene cuatro semestres de referencia y doctorado, ocho. El semestre personal puede continuar más allá de esos límites. El carril muestra también los semestres adicionales donde hayas programado productos. Cambiar de nivel conserva los registros de la ruta anterior, que puede consultarse con el selector.

Los productos relacionados conservan un vínculo entre etapas: por ejemplo, marco teórico y diseño metodológico en doctorado S2, S3 y S4. Cada etapa y cada actualización tiene su propio registro; no se aprueban automáticamente las otras versiones.

Se distinguen estado de avance, referencia de versión y situación de revisión. Una revisión o aprobación requiere persona, fecha y referencia, y sigue siendo una declaración registrada por el tesista. Reprogramar requiere un motivo. El historial anterior permanece en el respaldo.

Los porcentajes 50% y 70%, la mención de BS y mayo se conservan como texto del borrador. Compás no calcula avance de tesis a partir de tareas, horas ni casillas. No añade fechas de defensa ni hitos de graduación no proporcionados.

En Reportes, los productos de Mi ruta se seleccionan individualmente; están desmarcados por defecto. Se incluye el último registro disponible hasta la fecha de corte, aunque sea anterior al inicio del periodo. No se incluyen versiones posteriores a ese corte, historial privado, tareas o compromisos vinculados que no hayan sido seleccionados. Excel añade una hoja Mi ruta.

ToDo permite crear, editar, eliminar, terminar y reabrir tareas, con prioridad, fecha y vínculos opcionales. Ofrece filtros por pendientes, hoy y anteriores, próximos siete días, terminadas y todas. Si se elimina un compromiso, sus tareas y registros de tiempo se conservan sin ese vínculo.

## Importación local de ToDo · 0.3.5

El importador recibe un archivo CSV en UTF-8 o ICS desde el equipo, con un límite de 2 MB y 1,000 registros. No tiene OAuth, suscripciones, enlaces de calendario, solicitudes de red ni sincronización. La exportación se hace en la aplicación de origen; Compás recibe el archivo descomprimido. No requiere publicar el calendario.

La lectura abre una vista previa sin modificar el estado. En CSV se elige la columna de título, obligatoria, y opcionalmente fecha, prioridad y estado; el orden día/mes/año, mes/día/año o año/mes/día se establece de forma explícita. Las notas requieren una elección adicional y están desactivadas inicialmente. Solo los campos seleccionados se convierten en tareas, no páginas de Notion, archivos adjuntos o el contenido completo del archivo.

En ICS se usa el día declarado en DTSTART para un VEVENT y en DUE para un VTODO, sin conservar la hora ni convertir zonas horarias. No se usa DTEND como fecha de tarea. Los eventos se convierten en tareas; su confirmación de asistencia no se interpreta como finalización del trabajo. No se expanden las reglas de repetición: se muestra el evento base con una advertencia. Las cancelaciones y las excepciones de series se deshabilitan. Los asistentes, organizadores, ubicaciones, enlaces, adjuntos y alarmas no se incorporan. Referencia del formato: [RFC 5545](https://www.rfc-editor.org/info/rfc5545/).

La selección inicial está vacía; seleccionar todos solo marca registros válidos y no duplicados. La vista previa ofrece descargar un respaldo previo y recomienda comprobar su descarga. La incorporación agrega solo las tareas elegidas; cancelar o rechazar un archivo no sustituye el estado existente. Los duplicados detectados se deshabilitan, incluidos los ya importados; no existe actualización ni borrado de tareas originales a partir de una nueva importación. Deshacer el lote está disponible durante diez segundos y conserva las tareas del lote que se hayan editado posteriormente.

Las tareas incorporadas usan las mismas reglas de edición, validación, respaldo y privacidad que ToDo. Los reportes HTML, Excel y PDF excluyen estas tareas y sus conteos. El respaldo JSON sí conserva las tareas importadas. Los textos se muestran como contenido, sin ejecutar HTML ni fórmulas del archivo de origen.

Los proveedores documentan la exportación en [Notion](https://www.notion.com/help/export-your-content), [Google Calendar](https://support.google.com/calendar/answer/37111), [Outlook clásico](https://support.microsoft.com/en-us/outlook/export-an-outlook-calendar-to-google-calendar) y [Calendario de Apple en Mac](https://support.apple.com/es-lamr/guide/calendar/icl1023/mac). La compatibilidad se refiere a esos formatos exportados, no a una conexión directa con las cuentas.

## Apariencia y uso cotidiano

Brújula presenta hasta tres tareas pendientes, la posición en la ruta, el próximo hito y accesos a la conversación y decisión recientes. Los archivos completos de decisiones y compromisos se despliegan cuando se necesitan. No se calculan porcentajes ni se agregan indicadores de productividad.

Los formularios de proyecto, tarea, compromiso, decisión y sesión muestran primero sus campos esenciales. Los detalles académicos y notas privadas permanecen disponibles en desplegables; su contenido se conserva al guardar. Terminar una tarea desde Brújula o ToDo ofrece Deshacer durante diez segundos.

Personalizar, debajo del portarretratos sin pie de foto en la barra lateral, ofrece cuatro temas y tres modos de foto: oculta, portarretratos y fondo suave. Las preferencias usan una clave local independiente; la imagen se guarda como Blob en IndexedDB, en otra base. Se acepta JPG, PNG o WebP hasta 20 MB y se reduce a un JPEG de máximo 1,400 píxeles por lado, menor de 2 MB, sin conservar los metadatos del archivo original. No se aceptan enlaces remotos. La foto y el tema no se incorporan a los respaldos ni a los reportes. Si el navegador bloquea su almacenamiento, la imagen se muestra en la sesión actual y se explica que no se pudo conservar el cambio.

El indicador de guardado distingue copia del navegador, respaldo preparado y cambios posteriores. El estado del respaldo se conserva por proyecto con una huella del contenido validado y confirmación explícita del tesista. Preparar una descarga no limpia los cambios pendientes ni desactiva la confirmación de reemplazo. Las marcas de versiones anteriores sin confirmación no se consideran respaldos confirmados. La advertencia al cerrar queda reservada a cambios que no se pudieron guardar localmente. El reemplazo de una bitácora con avances posteriores al respaldo mantiene su confirmación y conserva una copia anterior recuperable si puede escribirse en el navegador. En modo temporal se mantiene el flujo de respaldo personal.

En ventanas estrechas, el menú muestra Brújula, Mi ruta y ToDo, y despliega los demás módulos en Más. Se mantienen foco visible, regreso del foco al cerrar diálogos, enlace para saltar al contenido y respeto por la preferencia de movimiento reducido. Las superficies sobre una foto son opacas para conservar la legibilidad.


## Guardado y recuperación · 0.3.6

El núcleo de persistencia está en src/storage.js, incorporado en el descargable. La interfaz adquiere un Web Lock exclusivo por la misma clave de almacenamiento, mantenido mientras la pestaña está activa. La segunda pestaña queda en consulta; al cerrar la primera puede volver a comprobar y adoptar explícitamente la última copia. No se simula atomicidad mediante localStorage. Si no existe Web Locks o falla la adquisición, se permite trabajo temporal sin escribir la copia compartida; se comunica este modo y se advierte al cerrar si hay cambios sin respaldo confirmado.

Cada escritura verifica que la copia principal no haya cambiado. Un conflicto conserva las anotaciones locales y bloquea la sustitución. Un error de cuota o de preparación del diario rechaza el cambio sin reemplazar la copia anterior; los formularios permanecen disponibles. El diario conserva el estado anterior mediante un checkpoint pendiente antes de escribir, y solo sustituye el checkpoint confirmado después de guardar la copia principal.

Una copia corrupta permanece intacta hasta una restauración o nuevo inicio explícito que conserve su contenido. Reemplazar otra bitácora conserva la anterior en una clave de recuperación independiente; si el espacio ya contiene otra copia distinta, no se sobrescribe. Recuperar esa copia intercambia la bitácora activa y la anterior después de comprobar el guardado. Si falla el intercambio, el diario conserva la copia anterior y se muestra un aviso. La recuperación usa el texto elegido en el diálogo; si cambió, no sustituye la bitácora activa. La liberación requiere confirmación explícita de que se conservó el archivo. Las copias de recuperación son privadas y no se incorporan a los reportes. No sustituyen al respaldo externo y pueden desaparecer al borrar datos del navegador.

El respaldo preparado registra solamente una confirmación pendiente. «Ya guardé el archivo» es una declaración del tesista, no una comprobación automática del disco. Solo se acepta si el proyecto y la huella siguen coincidiendo. Nuevos cambios o otra bitácora invalidan esa confirmación.

Las fuentes se organizan en src/ y se genera el mismo HTML autosuficiente. VERSION y package.json deben coincidir. El build, las pruebas, el servidor local y el paquete se describen en docs/DESARROLLO-ENTORNO.md. El workflow configurado ejecuta esas verificaciones antes de generar una variante del ZIP sin video; la entrega 0.3.6 superó esas verificaciones en GitHub.

## Compatibilidad

Los respaldos actuales usan versión 2. Compás sigue abriendo los respaldos de versión 1 y conserva sus textos, incluso semestres escritos libremente. El tesista elige su nivel al configurar la nueva ruta; no se infiere del nombre del programa. La copia auxiliar mantiene su clave anterior para poder recuperar el trabajo existente en el mismo navegador y dirección.

El límite común de validación y respaldo de la bitácora es 24 MB; la lectura de CSV e ICS para ToDo tiene el límite menor de 2 MB. Si un cambio supera el tamaño o los límites de registros correspondientes, se rechaza sin sustituir el estado anterior; no se recorta el historial. La copia auxiliar puede alcanzar antes el límite del navegador: descarga el respaldo personal para conservar el trabajo.

## Identidad

Nombre: Compás, en referencia al compás magnético.

La marca visible usa COMPÁS en mayúsculas: todos los caracteres parten de Arial Black, convertidos en contornos vectoriales, con la misma altura y grosor. La C contiene tres bloques de anotaciones y tres puntos de decisión. La C forma la primera letra, no un símbolo adicional al nombre. No lleva subtítulo. El logotipo se incorpora en línea en la aplicación y no requiere descargar fuentes ni imágenes. El original vectorial está en docs/diseno/compas-logotipo.svg.

Aire añade una textura de papel de muy baja intensidad; Cielo, líneas curvas suaves. Ambas son imágenes vectoriales incorporadas como datos, estáticas y sin conexiones. Se mantienen debajo de las superficies de trabajo y se ocultan al elegir una foto de fondo y al imprimir. Noche conserva su fondo despejado. IBERO usa blanco, rojo institucional y gris cálido, con navegación activa en rojo y un detalle angular en la superficie de trabajo, inspirado en https://ibero.mx/es-MX/home (consultado el 1 de octubre de 2026).

Referencia institucional: Manual de Identidad IBERO 2024, páginas 9 a 11. El documento de consulta no forma parte de esta distribución.

- Rojo principal: #E00034 (Pantone 185).
- Gris: #82786F (Warm Gray 9).
- Negro: #000000.
- Fondos personales Aire (salvia), Cielo (azul), Noche (oscuro) e IBERO (neutro), manteniendo el rojo institucional en marca y acciones principales.
- Tipografía: la familia IBEROAMERICANA está preparada en la prioridad de fuentes, pero sus archivos no están disponibles. Esta versión usa Arial como sustitución provisional. No se extrajeron ni reconstruyeron logotipos institucionales.

El pie de la aplicación y la ayuda ofrecen teresa.marquez@ibero.mx para fallas y comentarios, junto a https://github.com/tmarquez-mx/Compas. Estos enlaces solo se abren por decisión del tesista; no envían la bitácora.

Pie de página:
CSP | Universidad Iberoamericana Ciudad de México

## Alcance de esta versión

Prototipo local 0.3: siete módulos —Brújula, Mi ruta, ToDo, Coloquios, Supervisión, Dedicación y Reportes—, rutas ajustables por semestre, historial de productos y decisiones, tareas privadas, captura manual de dedicación, respaldo completo y reportes seleccionados.

Esta entrega está orientada al uso en una sola computadora y un mismo navegador. No se plantea distribución para teléfonos ni sincronización entre dispositivos.

La revisión de una minuta es una declaración registrada por el tesista. No es firma electrónica ni VoBo verificado. No hay cuentas, sincronización, colaboración simultánea, recordatorios externos ni almacenamiento en servidor.

La integración opcional del navegador para agentes solo permite navegar a un módulo; no devuelve registros personales ni modifica su contenido. Su disponibilidad depende del navegador.

## Comprobaciones

Se ejecutan 22 comprobaciones del núcleo: respaldo v2 y migración de un respaldo v1 real, datos vacíos y archivos inválidos, vínculos, privacidad, selección, nombres, periodos, escape de contenido, rutas de referencia, cambios de nivel, independencia del ToDo, eliminación sin pérdida de tareas, versiones, revisión, cortes históricos, tamaño de respaldo, separación de apariencia y estabilidad de la huella al reabrir un archivo. El Excel se verifica adicionalmente con openpyxl y lectura de sus relaciones y archivos XML.

La importación añade 38 comprobaciones de CSV, ICS, fechas, límites, duplicados, selección, escape de textos, conservación en respaldos, exclusión de reportes y Deshacer sin pérdida de ediciones posteriores. Estas 60 comprobaciones se complementan con 28 de almacenamiento, 28 de runtime de interfaz y 6 del build: 122 en total.

Las pruebas se ejecutan con Node:

    npm test
    npm run check

La importación 0.3.5 se comprobó en el navegador con datos ficticios: vista previa de CSV e ICS, elección de columnas y registros, tareas terminadas, duplicados y fechas inválidas.

La interfaz 0.3 se comprobó en el navegador integrado mediante un servidor local: cuatro temas, persistencia tras recarga, foto de muestra en portarretratos y fondo, navegación de los siete módulos, formularios abreviados, completar y deshacer tareas, preparación de respaldo y navegación opcional mediante WebMCP. La API del navegador integrado no devolvió confirmación de la descarga del JSON; su serialización y reapertura se validan con las comprobaciones automáticas. Se revisaron anchos de 320 y 390 píxeles, además del escritorio. La fotografía persistente al abrir directamente un archivo local y su comportamiento en Windows necesitan comprobación en esos navegadores; los errores de almacenamiento se comunican sin afectar la bitácora. La salida PDF usa la impresión nativa del navegador.

## Organización

- dist/index.html: aplicación local completa.
- El manual institucional original permanece como documento de consulta local.
- tests/check_compas.cjs: comprobaciones de respaldo, rutas, ToDo y privacidad.
- tests/fixtures/legacy-v1.json: respaldo ficticio de la versión anterior para comprobar compatibilidad.
- La distribución en GitHub permite descargar la aplicación; no sincroniza las bitácoras personales.

## Comprobación visual de 0.3.6

En el navegador integrado, mediante un servidor local separado con datos ficticios, se abrió una segunda pestaña: quedó en consulta con controles de edición deshabilitados. Después de modificar una tarea en la primera pestaña, cerrarla y volver a comprobar desde la segunda, se recuperó el cambio y se habilitó la edición. Preparar un respaldo mostró la confirmación pendiente sin afirmar que existía un archivo guardado. El navegador no expuso la ubicación de descarga al agente; no se confirmó como verificado en disco. No se observaron errores de consola en la pestaña de prueba.

La verificación de Windows y de apertura directa file://, las descargas nativas completas y la revisión con lector de pantalla permanecen pendientes antes de distribución amplia. Las pruebas automáticas cubren la serialización y recuperación; no sustituyen esas comprobaciones.
