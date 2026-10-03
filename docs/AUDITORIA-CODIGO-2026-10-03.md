# Auditoría y refactorización de Compás · 3 de octubre de 2026

Se revisó la aplicación local, su ensamblado y las pruebas a partir de `afb0efb` (0.3.6). La revisión produjo cambios de código, no solamente recomendaciones. Conserva el formato de respaldo, los siete módulos, las reglas de privacidad y el funcionamiento sin conexión.

## Hallazgos corregidos

| Hallazgo | Cambio aplicado |
| --- | --- |
| Núcleo e interfaz concentrados en dos archivos, con funciones extensas comprimidas | Núcleo en ocho archivos e interfaz en dieciséis, agrupados por responsabilidad. Código y CSS con formato legible. |
| Funciones sin llamadas | Eliminadas `persist`, `compass` y `routeSummary`; retirado `startupNotice`, que nunca recibía un aviso. |
| Estilos de elementos que ya no se renderizaban | Retirados 24 selectores asociados a nueve clases obsoletas, incluidas sus variantes responsivas. |
| Validación de vínculos con búsquedas repetidas en listas | Índices `Set` por colección; se mantienen las comprobaciones de duplicados, vínculos, fechas y límites. |
| Validación que creaba un UUID provisional y lo descartaba | Constructor interno sin generación de identidad; las bitácoras nuevas siguen recibiendo su UUID. |
| Guardado con normalización y serialización repetidas | `prepareBackup` devuelve el estado normalizado y su JSON en una sola preparación. El controlador conserva la verificación del diario y del commit. |
| Propiedades del almacenamiento que construían una instantánea completa, leyendo y restaurando las copias auxiliares | Consultas directas para estado, mensaje y base. La propiedad `state` continúa entregando una copia defensiva. Las instantáneas completas siguen disponibles cuando hacen falta. |
| Búsquedas repetidas de productos e historial | Catálogo indexado con `Map`; consulta de historial desde el corte más reciente hacia atrás, aprovechando el orden cronológico validado. |
| Reportes con búsquedas de selección lineales por registro | Selecciones con `Set` y una función compartida para filtrar. Se mantienen la selección explícita, el corte temporal y la exclusión de información privada. |
| Contador de la selección que construía el reporte completo | `reportCount` cuenta las referencias elegidas sin generar copias de sus textos. |
| Tabla de acciones reconstruida en cada clic | Tabla creada una sola vez; el botón y su identificador se pasan al manejador. Se mantiene la comprobación de permiso de edición. |
| Pruebas dependientes del formato comprimido y de la función siguiente | Extracción compartida de declaraciones reales con validación sintáctica; los casos siguen ejecutando código del HTML entregado. |

## Organización resultante

`scripts/source-files.cjs` declara el orden de las 26 fuentes de JavaScript y CSS. El build comprueba cada fuente, ensambla los cierres privados y valida nuevamente los dos scripts completos. `dist/manifest.json` registra las huellas de todas las fuentes, la plantilla y `VERSION`.

- `src/core/`: utilidades, referencia académica, cambios de ruta, esquema y respaldos, reportes, Excel, importación ToDo y API pública.
- `src/ui/`: estado de la interfaz, persistencia y recuperación, apariencia, controles compartidos, navegación, vistas y formularios por función, importación, ayuda y eventos.
- `src/storage.js`: controlador durable y sus copias de recuperación; se conserva como unidad independiente.

Son archivos de organización que comparten un cierre privado, no módulos ES independientes. No se añadió carga por red, bibliotecas en ejecución ni una instalación npm obligatoria. El descargable continúa siendo un único HTML.

## Resultados medidos

Medianas de siete ejecuciones tras tres calentamientos, en Node.js de esta computadora. Datos ficticios con 3.000 registros **en cada una** de seis colecciones (18.000 registros en total), además de la ruta. Antes de medir se comprobó igualdad del estado normalizado y del contenido de los reportes, excluyendo su hora de generación.

| Operación | Antes | Después |
| --- | ---: | ---: |
| Validar bitácora | 305,91 ms | 71,24 ms |
| Preparar respaldo | 315,95 ms | 71,96 ms |
| Construir reporte seleccionado | 33,01 ms | 9,26 ms |
| Contar registros seleccionados | 33,46 ms | 0,54 ms |

Son medidas locales, no una garantía de tiempo para todos los equipos. El caso de 1.000 registros por colección también mejoró. La comparación se puede repetir sin dependencias adicionales:

```sh
git show afb0efb:dist/index.html > /tmp/Compas-anterior.html
npm run build
node scripts/benchmark.cjs /tmp/Compas-anterior.html
```

El HTML pasó de 218.867 a 278.458 bytes por conservar el formato legible del código. No se afirma una mejora del tamaño ni del tiempo de carga. Las mejoras medidas son de procesamiento; no se incorporó un minificador ni una cadena adicional de dependencias.

## Verificación

- 127 comprobaciones: 6 del build, 24 del núcleo, 29 de interfaz, 30 de persistencia y 38 de importación.
- Cinco casos nuevos cubren el conteo de reportes, la preparación normalizada del respaldo, las propiedades del almacenamiento, la preparación única por guardado y el botón real de recuperación.
- Análisis estático del JavaScript ensamblado: sin variables sin uso, referencias indefinidas, claves duplicadas, código inalcanzable ni expresiones binarias constantes detectadas por las reglas aplicadas.
- Comparación visual automatizada en Chromium aislado, en macOS y con apertura `file://`: siete vistas a 1440 y 390 píxeles, más los diálogos de proyecto, apariencia y ayuda. Las 17 parejas de capturas son idénticas píxel a píxel.
- Recorridos mediante la interfaz: actualizar un producto conservando su historia, crear y completar una tarea vinculada, seleccionar y descargar un reporte sin la tarea privada, y descargar un respaldo. Sin errores JavaScript.
- Build reproducible y ZIP regenerado con aplicación, instrucciones, mapa, animaciones y video existentes. La interfaz no cambió; esos materiales siguen representando sus recorridos.

La comprobación del navegador es automatizada en Chromium de macOS; las pruebas manuales en Windows y otros navegadores conservan su estado documentado en la guía de desarrollo. Esta revisión no publica una nueva versión ni cambia la etiqueta 0.3.6 ya publicada.
