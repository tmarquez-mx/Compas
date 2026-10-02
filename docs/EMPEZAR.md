# Empezar con Compás
Organiza y da seguimiento a tu tesis · Versión 0.3.6

## Importante: avisa que probarás Compás

Después de descargar Compás, escribe a posgrado.sociales@ibero.mx e indica que lo descargaste y que lo probarás. Así, la Coordinación podrá avisarte por correo cuando haya una nueva versión para que actualices tu copia. Si no das este aviso, podrías quedarte con una versión desactualizada.

## 1. Abre tu aplicación
Esta primera versión está pensada para trabajar en una sola computadora y un mismo navegador. Elige una carpeta fija para la aplicación y otra para tus respaldos.

Descomprime todo el ZIP. En Windows, usa «Extraer todo»; en Mac, abre el ZIP para extraer la carpeta. Después abre Compas.html en un navegador actualizado. Si se abre en un editor de texto, utiliza «Abrir con» y elige tu navegador. No trabajes dentro del ZIP.

El mismo paquete sirve para Windows y Mac. Esta versión fue comprobada en Mac; la prueba en un equipo Windows está pendiente. No necesitas instalar programas de desarrollo.

## 2. Empieza tu bitácora
La primera apertura muestra un ejemplo ficticio. Puedes recorrerlo o elegir «Empezar mi bitácora». Registra tu nivel, semestre, título y pregunta de investigación. En «Mi ruta» encontrarás los productos de referencia por semestre.

Consulta la ruta, registra versiones de tus avances y ajusta tu plan con un motivo. Las tareas de ToDo te ayudan a dar pasos pequeños; completarlas no cierra automáticamente un compromiso ni aprueba un producto.

## Importa tareas de otra aplicación

En «ToDo», pulsa «Importar tareas». Elige un CSV o ICS guardado en tu computadora, de hasta 2 MB y 1,000 registros. El CSV debe usar codificación UTF-8. Si tu exportación viene en ZIP, descomprímelo primero: Compás necesita el CSV o ICS que contiene.

Para Notion, exporta la base de tareas con «Markdown & CSV». Para Google Calendar, exporta desde su versión de computadora. En Outlook clásico, usa «Archivo → Guardar calendario»; en Calendario de Apple en Mac, elige un calendario y «Archivo → Exportar → Exportar». En Apple no elijas «Archivo de calendario», que produce un ICBU incompatible. No necesitas publicar un calendario ni compartir una dirección pública.

En CSV, elige la columna que contiene el título. Fecha, prioridad y estado son opcionales. Indica el orden de las fechas, por ejemplo día/mes/año, y revisa cómo quedan en la vista previa. Las notas están desactivadas por defecto: elígelas solo si quieres conservar ese texto en tus tareas privadas.

En ICS, selecciona únicamente los eventos que quieras convertir en tareas. Se conserva el día de inicio declarado en el archivo; para componentes de tarea, se usa su vencimiento. No se importa la hora ni se convierte a otra zona horaria. Una serie repetida aparece como un evento base: Compás no genera sus próximas repeticiones. Las cancelaciones y las excepciones de la serie se omiten y se avisa en la vista previa.

Revisa y marca lo que quieres incorporar; inicialmente no hay filas seleccionadas. Los registros inválidos y los duplicados detectados no pueden elegirse. Puedes descargar un respaldo desde esa vista; recomendamos comprobar que esté guardado antes de confirmar. Cancelar la vista previa deja tu bitácora como estaba. Después de importar, «Deshacer» permanece disponible durante diez segundos y retira el lote; conserva cualquier tarea del lote que hayas editado después de importarla.

Esta es una importación puntual: los cambios de Notion o del calendario no se transmiten a Compás. Reimportar no actualiza ni elimina las tareas existentes. Las importadas se pueden editar, terminar o eliminar como cualquier tarea de ToDo, y quedan fuera de los reportes. Tu respaldo personal sí las conserva.

## 3. Haz tuyo el espacio
Pulsa «Personalizar», debajo del portarretratos, en la barra lateral. Elige Aire (verde salvia), Cielo (azul), Noche (oscuro) o IBERO (rojo, blanco y gris cálido). El rojo institucional se conserva. Aire tiene una textura de papel tenue y Cielo, líneas suaves; Noche mantiene un fondo despejado; IBERO usa detalles rojos y esquinas angulares. Puedes elegir una imagen JPG, PNG o WebP para mostrarla en un portarretratos o como fondo suave; también puedes ocultarla.

La foto se guarda únicamente en este navegador, separada de la bitácora. No se incluye en respaldos ni reportes. Si cambias de navegador o borras sus datos, vuelve a elegirla. El portarretratos aparece después de elegir la foto y no lleva texto al pie. Si el navegador bloquea su almacenamiento, la imagen se muestra durante esa sesión y Compás indica que no pudo conservar el cambio.

## 4. Conserva tu trabajo
Al terminar una sesión, pulsa «Descargar respaldo». El archivo JSON incluye todos tus registros y notas privadas. Guárdalo en una carpeta que puedas localizar; conserva también algunas versiones anteriores.

Preparar la descarga no confirma que el archivo esté guardado. Localiza el JSON descargado y pulsa «Ya guardé el archivo» en Compás. Si añadiste cambios después de prepararlo, descarga un respaldo nuevo. La barra superior distingue la copia del navegador, el respaldo confirmado por ti y los avances posteriores.

La copia auxiliar del navegador no sustituye al respaldo. Puede desaparecer al borrar sus datos, cambiar de navegador o usar navegación privada.

Usa «Abrir respaldo» cuando necesites recuperar tu trabajo o actualizar la aplicación. Selecciona tu JSON más reciente. Abrir otro respaldo reemplaza la bitácora actual: descarga primero los cambios que quieras conservar.

Conserva una sola copia de trabajo de Compás. Si abres una segunda pestaña, quedará en consulta mientras otra esté editando. Después de cerrar la primera, pulsa «Volver a comprobar». Si tu navegador no puede proteger la edición entre pestañas, Compás trabaja en modo temporal sin sustituir la copia del navegador: descarga y confirma tu respaldo antes de cerrar.

En «Recuperación» puedes descargar o reabrir copias conservadas antes de sustituir una bitácora. Una copia dañada se mantiene intacta y puede descargarse para intentar recuperarla. Si ya existe una copia anterior pendiente, Compás pide conservarla antes de liberar ese espacio. Un error de guardado conserva la bitácora anterior y deja abierto el formulario para volver a intentar.

## 5. Comparte una selección
En «Reportes», selecciona los registros que quieres compartir y revisa la vista previa. Puedes descargar un panel HTML de consulta, un archivo Excel o imprimir y guardar PDF desde el navegador.

Las tareas ToDo, las horas, las reflexiones y las notas privadas quedan fuera de los reportes. No compartas el respaldo JSON como si fuera un reporte: contiene tu bitácora completa.

## 6. Cuida la información
Esta aplicación funciona sin conexión y no envía tus anotaciones a servidores. Descárgala desde GitHub; después puedes usarla en tu equipo sin iniciar sesión.

Registra decisiones metodológicas y revisiones de avances. No pegues entrevistas, transcripciones, bases de datos ni información identificable de participantes.

Si guardas el respaldo en una carpeta sincronizada con la nube, ese archivo también puede almacenarse allí. Para conservarlo solo en tu equipo, elige una carpeta sin sincronización.

## 7. Actualiza con tu respaldo
Primero descarga el respaldo desde tu aplicación actual. Cierra las pestañas de la versión anterior. Luego descarga la nueva versión de Compás, descomprímela y usa «Abrir respaldo». Esta versión puede abrir los respaldos de la versión 1.

## Fallas y comentarios

Escribe a teresa.marquez@ibero.mx. Repositorio: https://github.com/tmarquez-mx/Compas. Describe qué ocurrió y qué navegador usas; revisa que las capturas no muestren información privada.

## Video demo
Si tu paquete incluye Compas-demo.mp4, encontrarás un recorrido de aproximadamente 3 minutos, con datos ficticios, acciones animadas, flechas, sonidos suaves de clic, voz sintética en español de México. El video muestra la interfaz de la versión anterior; el nuevo diseño conserva esos módulos y añade Personalizar.

CSP | Universidad Iberoamericana Ciudad de México
