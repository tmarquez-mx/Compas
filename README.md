# Compás

## [⬇ Descargar Compás 0.3.13 para Windows y Mac (.ZIP)](https://github.com/tmarquez-mx/Compas/releases/latest/download/Compas-para-tesistas.zip)

**Descomprime el ZIP y abre `Compas.html`. No necesitas instalar nada.**

[Manual para empezar y continuar](docs/EMPEZAR.md) · [Cambios de esta versión](docs/RELEASE-v0.3.13.md) · [Versiones publicadas](https://github.com/tmarquez-mx/Compas/releases)

**Organiza y da seguimiento a tu tesis.** Decisiones, acuerdos y próximos pasos, en un solo lugar.

Compás es una aplicación personal para computadora y un navegador habitual. Funciona sin Internet después de descargarla. No sincroniza dispositivos ni incluye una versión de trabajo para celular o tableta.

## Empezar y volver a abrir

1. Descarga y **descomprime por completo** el ZIP. Guarda la carpeta **Compas** en un lugar fijo.
2. Lee **Empezar-aqui.html** y abre **Compas.html** con tu navegador habitual.
3. Explora el ejemplo ficticio o elige **Empezar mi bitácora**.
4. Los cambios confirmados con **Guardar cambios** y las tareas marcadas se conservan automáticamente cuando Compás indica **Guardado en este navegador**.
5. Al terminar, pulsa **Descargar respaldo**, localiza el JSON, confirma **Ya guardé el archivo** y cierra la pestaña.
6. La siguiente vez abre el mismo **Compas.html**, desde la misma carpeta y con el mismo navegador. Si no aparece tu trabajo, usa **Abrir respaldo** con tu JSON más reciente.

El ZIP tiene **tres archivos**: la aplicación, las instrucciones y **Materiales-en-linea.txt**, con ligas al video, las animaciones y las comprobaciones. Es el mismo paquete para Windows y Mac. La apertura directa y por servidor local se han comprobado en macOS con un navegador aislado; la prueba en Windows y otros navegadores sigue pendiente. Esta entrega continúa como piloto.

### Importante: avisa que probarás Compás

Después de descargarlo, escribe a [posgrado.sociales@ibero.mx](mailto:posgrado.sociales@ibero.mx) e indica que lo probarás. Así, la Coordinación podrá avisarte cuando haya una nueva versión para actualizar tu copia.

## Qué incluye

- **Brújula:** tu rumbo, hasta tres pasos pendientes, próximo hito y decisiones.
- **Mi ruta:** 19 plantillas sintéticas por posgrado, borradores previos y ruta propia; semestres y entregables adaptables, versiones y retiro reversible. Las propuestas sintéticas se señalan como **no oficiales**. [Origen de las rutas](docs/RUTAS-POR-POSGRADO.md).
- **ToDo:** tareas privadas, importación de CSV o ICS y exportación de tareas elegidas a Google, Apple y Outlook mediante ICS. La dedicación es opcional y está plegada debajo de las tareas.
- **Coloquios y Asesoría de tesis:** conversaciones, comentarios y seguimiento de acuerdos.
- **Diario:** páginas privadas con fecha para escribir ideas, dudas o cómo te fue.
- **Reportes:** selección de avances para compartir como HTML, Excel o PDF mediante impresión.
- **Personalizar:** cuatro temas; Sin marco, HomePad con reloj local y siete marcos con carácter. Flores, hojas, estrellas, velas, copas, globos, cumpleaños y confeti acompañan los bordes de la foto. Todos los detalles están disponibles desde el principio.

Compás no calcula un porcentaje de tesis ni otorga aprobaciones académicas. Terminar una tarea no aprueba un producto ni cierra un compromiso. La revisión registrada por el tesista no equivale a una firma verificada.

## Conservar y compartir tu trabajo

La aplicación no envía tus registros a servidores ni requiere cuentas. El navegador conserva una copia auxiliar que puede borrarse: **descarga y confirma respaldos regularmente**. El texto escrito en un formulario que todavía no guardaste no se conserva.

El **respaldo JSON** contiene todo tu trabajo, incluido el diario y las notas privadas; no está cifrado. Los **reportes** contienen únicamente la selección que decides compartir y excluyen ToDo, dedicación, diario y notas privadas. No sustituyen al respaldo.

Puedes conservar el JSON en una carpeta de Google Drive, OneDrive, Dropbox u otro servicio que ya tengas configurado. Su subida requiere Internet y la gestiona ese servicio; no crea sincronización entre dispositivos. Mantén una sola copia de trabajo.

Para actualizar, descarga un respaldo desde tu versión actual, cierra sus pestañas, descomprime el nuevo ZIP y abre tu JSON mediante **Abrir respaldo**. Compás 0.3.13 abre formatos 1, 2 y 3. Los nuevos respaldos usan formato 3 y requieren Compás 0.3.9 o posterior para conservar la ruta adaptada. La foto y la apariencia permanecen en el navegador y quedan fuera del respaldo.

**No publiques respaldos personales ni datos de investigación en este repositorio o sus incidencias.** El [manual](docs/EMPEZAR.md) explica el guardado, la reapertura, las rutas y el intercambio con calendarios.

## Compás en acción

El [mapa comentado](docs/demos/compas-comentado.png), los recorridos de [Mi ruta](docs/demos/mi-ruta.gif), [ToDo](docs/demos/todo.gif) y [Reportes](docs/demos/reportes.gif), y el [video](https://github.com/tmarquez-mx/Compas/releases/download/v0.3.7/Compas-demo.mp4) muestran la **versión 0.3.7**, anterior a las rutas adaptables y al rincón actual. [Guion y comprobaciones](docs/demos/guion-recorridos.md) · [Manifiesto](docs/demos/manifest.json).

## Fallas y comentarios

Escribe a [teresa.marquez@ibero.mx](mailto:teresa.marquez@ibero.mx) o abre una [incidencia](https://github.com/tmarquez-mx/Compas/issues). Describe qué ocurrió y qué navegador usas, sin compartir información privada.

## Para quienes mantienen el código

La aplicación autosuficiente en [dist/index.html](dist/index.html) se genera desde [src/](src/); no se edita a mano. [Entorno y comandos](docs/DESARROLLO-ENTORNO.md) · [Funcionamiento y validación](docs/DESARROLLO.md).

```sh
npm run check
npm test
npm run package
```

Los registros de ejemplo y pruebas son ficticios. El empaquetador valida el ZIP y genera su huella SHA-256; la aplicación no necesita dependencias ni conexiones para funcionar.

---

CSP | Universidad Iberoamericana Ciudad de México
