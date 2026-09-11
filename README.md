# Compás
**Instrumento para mapear el proceso de tesis**

Una aplicación personal para organizar el proceso de tesis en maestría y doctorado: ruta por semestres, acuerdos, decisiones, supervisión, tareas y dedicación.

## Descargar y empezar

### [Descargar Compás para Windows y Mac (.zip)](https://github.com/tmarquez-mx/Compas/releases/latest/download/Compas-para-tesistas.zip)

## Importante: avisa que probarás Compás

Después de descargar Compás, escribe a [posgrado.sociales@ibero.mx](mailto:posgrado.sociales@ibero.mx) e indica que lo descargaste y que lo probarás. Así, la Coordinación podrá avisarte por correo cuando haya una nueva versión para que actualices tu copia. Si no das este aviso, podrías quedarte con una versión desactualizada.

1. Descarga el ZIP y **descomprímelo por completo**.
2. Abre la carpeta **Compas** y lee **Empezar-aqui.html**.
3. Abre **Compas.html** en un navegador actualizado.
4. Elige **Empezar mi bitácora** o explora el ejemplo ficticio.
5. Al terminar, pulsa **Descargar respaldo** para conservar tu trabajo.

No necesitas instalar Python, Node ni otras herramientas. Puedes trabajar sin internet.

El ZIP contiene la aplicación, instrucciones y el video demo. Es el mismo paquete para Windows y Mac. Se ha comprobado en Mac; la prueba en un equipo Windows está pendiente.

[Versiones publicadas](https://github.com/tmarquez-mx/Compas/releases) · [Descargar el video demo](https://github.com/tmarquez-mx/Compas/releases/latest/download/Compas-demo.mp4)

## Qué incluye

- **Brújula:** pregunta de investigación, próximo hito y decisiones.
- **Mi ruta:** maestría o doctorado, semestres, productos, versiones y ajustes de la planeación.
- **ToDo:** tareas privadas con fechas, prioridades y vínculos con compromisos o productos.
- **Coloquios y Supervisión:** sesiones, retroalimentación y seguimiento de acuerdos.
- **Dedicación:** actividades, horas y reflexiones personales.
- **Reportes:** selección de avances para compartir como HTML, Excel o PDF mediante la impresión del navegador.

Las rutas son referencias en borrador. Compás no calcula el porcentaje de avance de una tesis ni otorga aprobaciones. La revisión de un producto o una minuta es un registro del tesista, sin firma verificada.

## Tu bitácora y tus reportes

| Archivo | Uso |
| --- | --- |
| Compas.html | La aplicación que puedes abrir en tu navegador. |
| Respaldo personal JSON | Conserva todos los módulos y registros privados; se vuelve a abrir en Compás. |
| Reporte HTML, Excel o PDF | Contiene la selección que decides compartir. No sustituye al respaldo. |

La aplicación **no envía los registros a servidores** y no requiere cuentas. La descarga desde GitHub no le da acceso a tus anotaciones. El navegador puede conservar una copia auxiliar, pero esa copia puede borrarse: descarga respaldos regularmente.

Las tareas ToDo, las horas y sus totales, las reflexiones y las notas privadas quedan fuera de los reportes. El respaldo personal sí las contiene y no está cifrado. Si lo guardas en una carpeta sincronizada, también podrá almacenarse en la nube.

Registra decisiones metodológicas y revisiones de avances. Conserva fuera de Compás entrevistas, transcripciones, bases de datos e información que identifique a participantes de la investigación.

**No publiques respaldos personales ni datos de investigación en este repositorio o en sus incidencias.**

## Actualizar sin perder tu trabajo

Antes de sustituir la aplicación, descarga el respaldo desde tu versión actual. Descarga y descomprime el nuevo paquete, abre Compas.html y usa **Abrir respaldo**. Los respaldos de la versión 1 son compatibles con esta versión.

## Para quienes revisan el código

La aplicación completa está en [dist/index.html](dist/index.html). Los registros incluidos en el ejemplo y las pruebas son ficticios.

[Detalles de funcionamiento y validación](docs/DESARROLLO.md) · [Guía para tesistas](docs/EMPEZAR.md)

Ejecutar comprobaciones:

    node tests/check_compas.cjs

Generar el paquete:

    python3 scripts/crear_paquete.py --video /ruta/Compas-demo.mp4

---

Coordinación del Posgrado en Ciencias Sociales y Políticas - Ibero
