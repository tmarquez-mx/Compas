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
- `src/core.js`: validación, migraciones, importación y exportación de los datos.
- `src/storage.js`: conservación y recuperación del trabajo en el navegador.
- `src/ui.js`: navegación, formularios y acciones de la interfaz.
- `dist/index.html`: archivo generado que abre el tesista.
- `dist/manifest.json`: versión y huellas SHA-256 del HTML y de sus fuentes.

La plantilla tiene exactamente un marcador de cada tipo: `{{COMPAS_STYLES}}`, `{{COMPAS_CORE}}`, `{{COMPAS_STORAGE}}`, `{{COMPAS_UI}}` y `{{COMPAS_VERSION}}`. El marcador de versión está en el metadato `compas-version`. Las fuentes core y storage se incorporan juntas en el script `compas-core`; la interfaz se incorpora en `compas-ui`. El resultado conserva solamente esos dos scripts.

El build hace una única sustitución, comprueba la sintaxis JavaScript y rechaza etiquetas de cierre que puedan romper la página. Los textos de las fuentes no se reinterpretan como marcadores. No edites `dist/index.html` a mano: se genera con:

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

El paquete predeterminado es `paquetes/Compas-para-tesistas.zip`. Incluye el video si existe `video-demo/Compas-demo.mp4`. También puedes indicar otro MP4:

```sh
python3 scripts/crear_paquete.py --video /ruta/Compas-demo.mp4
```

La variante sin video permite verificar el empaquetado en integración continua:

```sh
python3 scripts/crear_paquete.py --no-video --output /tmp/Compas-para-tesistas.zip
```

Solo se empaquetan la aplicación, las instrucciones, el manifiesto, las huellas y el video opcional. Nunca se recorre la carpeta para agregar archivos personales. El ZIP comprueba cada contenido byte a byte, identifica su versión y lleva `manifest.json` y `SHA256SUMS.txt`. También se escribe una huella del ZIP junto a él. Los mismos archivos producen el mismo ZIP; no se incluyen fechas variables.

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
