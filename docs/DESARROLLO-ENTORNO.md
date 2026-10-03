# Entorno de desarrollo de Compás

Compás se desarrolla en fuentes separadas y se distribuye como un único HTML autosuficiente. No utiliza servicios de red, servidor de datos, cuenta del tesista, dependencias npm ni bibliotecas externas en tiempo de ejecución.

## Requisitos

- Node.js 20 o posterior; la integración continua utiliza Node.js 22.
- Python 3.9 o posterior para el servidor local y el ZIP. Los comandos npm encuentran `python3`, `python` o `py -3`, según el sistema.
- Un navegador de escritorio. La compatibilidad publicada debe basarse en pruebas del descargable abierto con doble clic, además de las pruebas mediante el servidor de desarrollo.

No es necesario ejecutar `npm install`: no hay dependencias. Los comandos siguientes se ejecutan desde la carpeta del repositorio.

## Fuentes y build

- `VERSION`: versión de la entrega; debe coincidir con `package.json`.
- `src/index.html`: estructura y plantilla.
- `src/styles.css`: temas, componentes y accesibilidad visual.
- `src/core/`: núcleo dividido en validación, referencia de ruta, cambios de estado, reportes, Excel e importación ToDo. `api.js` define la API pública.
- `src/storage.js`: conservación y recuperación del trabajo en el navegador.
- `src/ui/`: vistas y formularios agrupados por función, almacenamiento de la interfaz, apariencia y eventos. `forms.js` contiene los controles compartidos.
- `scripts/source-files.cjs`: lista explícita y ordenada de fuentes que ensambla el build.
- `dist/index.html`: archivo generado que abre el tesista.
- `dist/manifest.json`: versión y huellas SHA-256 del HTML y de sus fuentes.

La plantilla tiene exactamente un marcador de cada tipo: `{{COMPAS_STYLES}}`, `{{COMPAS_CORE}}`, `{{COMPAS_STORAGE}}`, `{{COMPAS_UI}}` y `{{COMPAS_VERSION}}`. El marcador de versión está en el metadato `compas-version`. Las fuentes core y storage se incorporan juntas en el script `compas-core`; la interfaz se incorpora en `compas-ui`. El resultado conserva solamente esos dos scripts.

Cada grupo de fuentes comparte un cierre privado: son unidades de organización del código, no módulos ES cargados por el navegador. Solo `CompasCore` y `CompasStorage` se exponen globalmente. El build valida cada archivo y los scripts completos, incorpora todas las huellas de las fuentes y hace una única sustitución, comprueba la sintaxis JavaScript y rechaza etiquetas de cierre que puedan romper la página. Los textos de las fuentes no se reinterpretan como marcadores. No edites `dist/index.html` a mano: se genera con:

```sh
npm run build
```

Para comprobar que la entrega guardada coincide byte a byte con las fuentes:

```sh
npm run check
```

## Ejecutar y probar

```sh
npm run dev
```

Abre `http://127.0.0.1:8766/`. El servidor escucha únicamente en esta computadora, sirve exclusivamente `dist/` y desactiva la caché. No sincroniza ni recibe registros. Usa Ctrl+C para detenerlo. Si el puerto está ocupado, utiliza `python3 scripts/servir_local.py --port 8772` después del build. Al modificar una fuente, vuelve a generar el HTML y recarga la página.

```sh
npm test
```

El comando genera el HTML, verifica su reproducibilidad, prueba el build y ejecuta todos los archivos `tests/check_*.cjs`. Así se incorporan automáticamente las pruebas de almacenamiento y runtime. Todas usan datos ficticios. Las pruebas rechazadas detienen el comando. Para comprobar una entrega generada sin modificarla, usa `node scripts/test.cjs --built`.

## Preparar una entrega

1. Actualiza `VERSION`, `package.json`, la identificación de versión de `docs/EMPEZAR.md` y las notas de cambios.
2. Ejecuta `npm run build`, `npm run check` y `npm test`.
3. Completa el recorrido manual en los navegadores y sistemas declarados compatibles.
4. Genera el ZIP con `npm run package`. El empaquetador repite las pruebas y rechaza un `dist` desactualizado.
5. Revisa el ZIP descomprimido. Publica mediante una versión de GitHub y una etiqueta que identifique exactamente el código probado, después de tener autorización para publicar.

El paquete predeterminado es `paquetes/Compas-para-tesistas.zip`, con exactamente tres archivos: `Compas/Compas.html`, `Compas/Empezar-aqui.html` y `Compas/Materiales-en-linea.txt`. El TXT procede de `docs/MATERIALES-EN-LINEA.txt`: conserva las ligas públicas comprobadas al video, los recorridos y las comprobaciones. Estos materiales no se incluyen en la descarga principal. La guía omite los apartados de medios ausentes y comprueba que sus enlaces locales sí estén en el ZIP.

El argumento `--no-video` sigue siendo compatible con la verificación del paquete principal de tres archivos en integración continua:

```sh
python3 scripts/crear_paquete.py --no-video --output /tmp/Compas-para-tesistas.zip
```

El empaquetador utiliza una lista pública explícita y nunca recorre la carpeta para agregar archivos personales. Comprueba cada contenido byte a byte, rechaza entradas inesperadas o repetidas y escribe la huella del ZIP en `paquetes/SHA256SUMS.txt`. Los mismos archivos producen el mismo ZIP; no se incluyen fechas variables. La opción histórica `--complete` permanece para archivos internos de mantenimiento y no forma parte de la entrega del piloto.

## Comprobaciones manuales pendientes antes de distribución amplia

El workflow de GitHub verifica fuentes, pruebas y ZIP en Linux. Eso no certifica Windows, Mac ni el comportamiento del almacenamiento con `file://`. Registra sistema, navegador, versión de Compás y resultado de cada recorrido; no declares completada una combinación que no se haya probado.

| Recorrido | Resultado requerido |
| --- | --- |
| Windows y Mac: descargar, descomprimir y abrir con doble clic | El HTML abre sin dependencias ni recursos externos. |
| Crear una bitácora, cerrar y reabrir en el mismo navegador | Los cambios se recuperan o se explica claramente la limitación de almacenamiento. |
| Dos pestañas de la misma bitácora | No se pierde una modificación por sobrescritura silenciosa. |
| Almacenamiento bloqueado o lleno | Se informa que el cambio no se conservó y se ofrece guardar un respaldo. |
| Copia corrupta | La copia original puede descargarse antes de restaurar o reemplazar. |
| Descargar y cancelar un respaldo | Preparar la descarga no se presenta como confirmación de que el archivo existe. |
| Reemplazar o actualizar de versión | El tesista puede conservar sus avances; migraciones y validaciones rechazan archivos inválidos sin sustituir el trabajo. |
| CSV e ICS ficticios | Vista previa, selección, fechas, duplicados y Deshacer funcionan sin modificar tareas previas. |
| Reportes descargados | HTML, Excel y PDF contienen la selección; no incluyen ToDo, dedicación ni notas privadas. |
| Teclado, zoom y lector de pantalla | Foco, diálogos, etiquetas, estado de guardado y cuatro temas son utilizables. |

El archivo personal JSON no está cifrado. El empaquetador y el workflow no necesitan ni deben recibir bitácoras reales.

## Regenerar el mapa y los recorridos

Los scripts de producción de demos son independientes del build de la aplicación. Requieren Playwright con Chromium, Pillow y FFmpeg con libx264. No forman parte de las dependencias del tesista ni del comando npm test.

1. Ejecuta `scripts/capturar_demos.cjs` con Node; `COMPAS_PLAYWRIGHT` puede indicar la ubicación del paquete Playwright y `COMPAS_CHROMIUM` su ejecutable. `COMPAS_DEMO_WORK` define la carpeta temporal de capturas.
2. Ejecuta `python3 scripts/montar_demos.py --work /ruta/capturas --ffmpeg /ruta/ffmpeg`. En macOS, la narración utiliza la voz local Paulina; comprueba que la síntesis tiene los permisos del sistema necesarios. `--silent` genera una variante sin audio. Los subtítulos usan la duración real de cada frase sintetizada.
3. Revisa la pantalla comentada, los GIF completos y el MP4. El manifiesto en `docs/demos/manifest.json` identifica la aplicación capturada y las comprobaciones reales del historial, ToDo y reportes.
4. Comprueba que `applicationSha256` del manifiesto de los recorridos corresponda al `dist/index.html` final y que las huellas de sus medios coincidan con los archivos que publicarás.
5. Genera el ZIP principal con `npm run package`: contiene únicamente la aplicación, la guía y el TXT de ligas. El video, el mapa, los GIF y las comprobaciones se consultan en la página de Compás y en los archivos de la versión publicada; no se añaden al ZIP.

Publica los materiales desde una lista explícita de archivos públicos, sin capturas temporales ni respaldos. Los GIF, el mapa, la página de recorridos, el guion y el manifiesto se conservan en `docs/demos/`; el MP4 y sus subtítulos se adjuntan a la versión de GitHub junto al ZIP. Si publicas una lista de huellas para varios archivos, calcúlalas sobre esos archivos finales. La publicación debe conservar los nombres enlazados en `docs/MATERIALES-EN-LINEA.txt` y en README. Los enlaces `releases/latest/download/…` requieren que la entrega publicada sea la versión latest; una versión marcada como preliminar necesita ligas específicas de su etiqueta.

Las capturas se realizan en un contexto nuevo de Chromium con el ejemplo ficticio; no abren el perfil personal ni sus bitácoras. La carpeta temporal contiene un reporte y un respaldo ficticios usados para comprobar las descargas, y permanece fuera del repositorio.

## Verificar diario, ayuda y adornos

`scripts/comprobar_acompanamiento.cjs` utiliza un perfil nuevo de Chromium con datos ficticios. Comprueba ayuda de todos los botones con ratón y teclado, Escape dentro de un diálogo, creación/edición/reapertura del diario, exclusión de reportes, foto ficticia, marcos y flores, invitaciones desactivables, móvil y comienzo de una bitácora sin datos obligatorios. Requiere Playwright y Chromium mediante las mismas variables que `capturar_demos.cjs`; no instala dependencias ni lee perfiles personales. `COMPAS_FILE=1` realiza el mismo recorrido abriendo `dist/index.html` directamente, sin utilizar el servidor.

Las pruebas VM de `tests/check_supportive.cjs` se incluyen automáticamente en npm test. Conservan la compatibilidad de las preferencias de apariencia antiguas y las reflexiones del esquema 2, y comprueban las transiciones de finalización y la privacidad del diario.
