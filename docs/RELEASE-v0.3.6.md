# Compás 0.3.6 · Paquete para tesistas

Esta entrega corrige la conservación del trabajo y organiza las fuentes para continuar el desarrollo. Mantiene la aplicación local y autosuficiente, sin cuentas ni sincronización.

## Cambios

- Brújula y ruta renovadas, cuatro temas y foto local opcional desde Personalizar.
- Importación local de tareas CSV e ICS con vista previa, selección, detección de duplicados y Deshacer.

- Edición exclusiva por pestaña cuando existe Web Locks; segunda pestaña de consulta, sin sobrescritura.
- Si no puede asegurarse la exclusividad, modo temporal que no modifica la copia compartida del navegador.
- Detección de cambios de otra copia antes de escribir; recuperación de proyectos reemplazados y copias dañadas, con intercambio de la copia anterior después de comprobar el guardado.
- Diario del estado anterior antes de cada escritura y rechazo sin cambios parciales ante fallos de almacenamiento.
- Respaldo preparado separado de confirmación explícita del tesista; confirmaciones anteriores sin ese dato no limpian cambios pendientes.
- Un Deshacer pendiente queda limitado a su bitácora. Los errores conservan los formularios para reintentar.
- Fuentes en src/, versión única, build reproducible, manifiesto y empaquetado condicionado a pruebas.
- 122 comprobaciones: 22 núcleo, 38 importación, 28 almacenamiento, 28 runtime y 6 build.
- Workflow de GitHub para verificar el código y ZIP en cada actualización.

## Desarrollo

    npm run dev
    npm test
    npm run check
    npm run package

No hay dependencias npm que instalar. Node 20+ y Python 3.9+ son herramientas del desarrollador; el tesista solo necesita un navegador. No se edita dist/index.html manualmente.

## Antes de distribución amplia

Completar la matriz manual del descargable en Windows y Mac, abierto por file://, comprobar descargas y reapertura reales, y evaluar accesibilidad con teclado, zoom y lector de pantalla. Ver docs/DESARROLLO-ENTORNO.md. La revisión en el navegador integrado por servidor local y los tests con I/O simulado no certifican esas plataformas.

## Descargables

- `Compas-para-tesistas.zip`: aplicación 0.3.6, instrucciones, manifiesto, huellas de integridad y video demo.
- `Compas-demo.mp4`: animación con taches y velero al cierre. Muestra la interfaz anterior; se conserva como recorrido introductorio.
- `SHA256SUMS.txt`: huellas del ZIP y el video.

Los recorridos GIF de Mi ruta y Reportes se conservan en el README; también muestran la interfaz anterior.
