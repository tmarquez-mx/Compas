# Auditoría de diseño y experiencia de usuario de Compás

**Fecha:** 1 de octubre de 2026  
**Versión revisada:** `efbf7c8`  
**Alcance:** interfaz local, arquitectura de información, recorridos principales, formularios, microtextos, privacidad, respaldo, diseño responsivo, accesibilidad y correspondencia con el Manual de Identidad IBERO 2024.

## Dictamen

Compás ya tiene una base funcional mucho mejor que la de un prototipo superficial: los siete módulos se relacionan entre sí, la privacidad está pensada desde la estructura de los datos, el respaldo y los reportes cumplen funciones distintas, y la ruta conserva versiones en vez de convertir el proceso de tesis en un porcentaje engañoso.

La experiencia visual todavía se parece demasiado a un tablero administrativo. La combinación de barra lateral numerada, tarjetas blancas equivalentes, botones rectangulares y formularios extensos comunica “sistema de gestión”. Esa apariencia es clara, pero genérica y poco acogedora. Para una persona que llega cansada o preocupada por su tesis, el sistema muestra demasiadas posibilidades y demasiada información antes de ayudarle a resolver una sola cosa.

El principal problema de experiencia no es la cantidad de módulos. Es la diferencia entre la promesa de acciones sencillas y el esfuerzo que exigen. “Nuevo compromiso”, “Editar rumbo” o “Registrar una decisión” abren formularios largos, con muchos campos visibles a la vez. El usuario necesita tomar decisiones sobre la estructura de Compás antes de poder registrar la idea que traía en mente.

La recomendación es conservar el modelo de datos y rediseñar la experiencia alrededor de una idea: **orientarse, registrar un paso breve y volver al trabajo de tesis**. La dirección visual propuesta se llama **Cartografía serena**: una interfaz editorial, espaciosa y sobria, con la ruta como hilo gráfico, el rojo IBERO como punto de orientación y una jerarquía que ofrece una sola acción principal por pantalla.

## Evaluación actual

| Dimensión | Calificación | Observación |
|---|---:|---|
| Utilidad académica | 8/10 | Las relaciones entre ruta, sesiones, decisiones, compromisos y tareas son valiosas. |
| Privacidad y control | 9/10 | La separación entre respaldo personal y reporte compartible es una fortaleza real. |
| Claridad de arquitectura | 7/10 | Los módulos son comprensibles, aunque se muestran todos con la misma importancia. |
| Facilidad de captura | 4/10 | Los formularios convierten acciones pequeñas en registros extensos. |
| Jerarquía visual | 6/10 | Es legible, pero casi todas las tarjetas y acciones compiten en el mismo plano. |
| Calma y cuidado emocional | 5/10 | El lenguaje intenta acompañar, pero la densidad y las alertas generan presión. |
| Identidad propia | 4/10 | La brújula existe como ilustración, pero el conjunto se percibe como dashboard. |
| Accesibilidad | 6/10 | Hay semántica y foco visible; persisten fallas de contraste y navegación móvil. |
| Diseño responsivo | 5/10 | La interfaz se adapta, pero la navegación se vuelve una franja larga de siete opciones. |
| Confianza en guardado | 4/10 | “Cambios sin descargar” mezcla guardado local, respaldo y riesgo de pérdida. |

## Lo que debe conservarse

1. **La privacidad por diseño.** ToDo, horas, reflexiones y notas privadas quedan fuera de los reportes.
2. **La diferencia entre respaldo y reporte.** Es una distinción necesaria y poco común en herramientas académicas.
3. **La ruta como referencia flexible.** Compás permite reprogramar y explica que los estados no equivalen a un porcentaje de tesis.
4. **La historia de las decisiones.** Conservar el planteamiento previo y el motivo del cambio tiene valor metodológico.
5. **La relación entre registros.** Una tarea puede vincularse con un compromiso o producto sin cerrar automáticamente ninguno.
6. **El tono no punitivo.** Expresiones como “Por retomar” funcionan mejor que “Atrasado”.
7. **Los detalles plegables.** En sesiones e historiales reducen densidad sin ocultar información esencial.
8. **La operación local y sin recursos externos.** Es coherente con la promesa de privacidad.

## Hallazgos críticos

### P0. El estado de guardado produce una alarma permanente

Al abrir una copia auxiliar desde `localStorage`, Compás asigna `dirty=true`. Por ello puede mostrar “Cambios sin descargar” aunque el usuario no haya modificado nada durante esa sesión y aunque haya descargado un respaldo anteriormente. Además, cualquier cambio activa una advertencia al cerrar la página.

**Impacto:** la interfaz convierte el respaldo en una tarea constante y puede generar habituación a las alertas. El usuario deja de saber si su trabajo está guardado o en riesgo.

**Recomendación:** separar tres estados reales:

- **Guardado en este navegador:** cada edición se conserva localmente.
- **Último respaldo:** fecha y hora de la última descarga registrada.
- **Conviene actualizar el respaldo:** aviso discreto después de cambios relevantes o de un periodo definido.

El mensaje principal debe ser “Guardado en este equipo”. El riesgo y la acción de respaldo pueden aparecer en un menú de seguridad o como recordatorio contextual, sin ocupar el estado global de toda la sesión.

### P0. Las acciones breves abren formularios desproporcionados

“Nuevo compromiso” muestra origen, producto, fecha, fuente, categoría, decisión sobre el comentario, comentario, justificación, acción, responsable, fecha, prioridad, estado, evidencia, respuesta y nota privada. “Nueva decisión” y “Editar rumbo” tienen una carga similar.

**Impacto:** el usuario posterga el registro, introduce texto de relleno o abandona el formulario. La herramienta compite con la tesis en vez de aliviar su administración.

**Recomendación:** captura progresiva en dos capas.

- **Registro rápido:** nombre o acción, fecha opcional y vínculo opcional. Debe poder completarse en menos de un minuto.
- **Profundizar:** fundamento, impacto, alternativas, evidencia, revisión y notas privadas en un bloque plegable o en una segunda pantalla.

Compás debe guardar borradores incompletos. Los campos académicamente útiles no deben convertirse en obstáculos de entrada.

### P0. Brújula resume información, pero no orienta una sesión de trabajo

La pantalla inicial presenta pregunta, hito, tres compromisos, una brújula, resumen de ruta, decisiones y todos los compromisos. Es un buen archivo de situación, pero no responde con suficiente claridad: “¿Qué puedo hacer ahora?”.

**Impacto:** una persona estresada vuelve a enfrentarse al conjunto de su tesis.

**Recomendación:** colocar al inicio una tarjeta dominante llamada **Para hoy**, con un máximo de tres opciones:

- Retomar una tarea concreta.
- Preparar la próxima reunión o entrega.
- Registrar algo que ocurrió.

La pregunta de investigación, la ruta y la historia pueden permanecer accesibles en un segundo plano. La portada debe ayudar a empezar, no sólo a recordar.

### P0. “Nivel y semestre” no corresponde con la pantalla que abre

El botón de Mi ruta promete una configuración pequeña, pero abre el formulario completo del proyecto: título, nombres, programa, línea, pregunta, objetivos, enfoque, alcance, hito y notas privadas.

**Impacto:** se rompe la expectativa y aumenta la sensación de trabajo administrativo.

**Recomendación:** crear un editor breve de nivel y semestre. “Editar proyecto” puede abrir la carta de navegación completa desde Brújula.

### P0. Reportes ofrece demasiadas decisiones en una sola vista

La pantalla combina título, periodo, datos personales, rumbo, listas de compromisos, decisiones, sesiones y productos. Después añade una vista previa y tres formatos de salida.

**Impacto:** aumenta el riesgo de compartir de más y exige mucha revisión visual.

**Recomendación:** recorrido de tres pasos:

1. **Qué quieres contar:** avance para supervisión, preparación de coloquio o reporte libre.
2. **Qué incluir:** selección agrupada con resumen claro de contenido privado excluido.
3. **Revisar y descargar:** vista previa y formato.

El último paso debe mostrar una frase inequívoca: “Compartirás 5 registros. No se incluirán tareas, horas ni notas privadas”.

## Hallazgos de alta prioridad

### P1. La interfaz usa el patrón visual de un panel administrativo

Las tarjetas tienen el mismo fondo, borde, radio y profundidad. La barra lateral numerada y el encabezado con controles de archivo refuerzan ese patrón. La metáfora de navegación aparece en una ilustración aislada, no en la estructura de la experiencia.

**Recomendación:** usar la ruta como sistema de composición: puntos de referencia, trazos cortos, coordenadas de semestre y señales de “ahora”, “después” y “registrado”. Evitar timones, mapas antiguos y decoración náutica literal. La identidad debe sentirse académica y contemporánea.

### P1. La brújula desaparece en pantallas de 1050 píxeles o menos

La pieza que más diferencia a Compás se oculta en portátiles pequeños, ventanas divididas y tabletas.

**Recomendación:** convertirla en un elemento compacto o integrado en el encabezado. Debe adaptarse, no desaparecer.

### P1. El rojo funciona a la vez como marca, acción, alerta, fecha y estado

El rojo IBERO es correcto, pero se usa para demasiadas funciones. En una herramienta para personas estresadas, la repetición del rojo puede sentirse como urgencia.

**Recomendación:** reservar el rojo para el rumbo actual, la acción principal y los hitos que requieren atención. Usar negro y gris cálido oscuro para texto; fondos cálidos muy suaves para agrupación. Las fechas vencidas necesitan texto y contexto, no sólo color.

### P1. La ruta horizontal no ofrece una lectura suficientemente narrativa

Cada semestre aparece como una tarjeta en un carril horizontal. Esto permite elegir, pero no expresa bien la relación entre el plan institucional, el plan personal y lo que está activo ahora.

**Recomendación:** mostrar tres capas dentro de una misma cartografía:

- **Referencia del programa.** Qué se espera en el semestre.
- **Mi plan.** A qué semestre o fecha lo movió el tesista.
- **Ahora.** El producto que conviene retomar y su siguiente acción.

La ruta debe admitir desvíos visibles y explicados, no parecer una secuencia que se “incumple”.

### P1. La terminología de privacidad es correcta, pero demasiado repetida

Los avisos extensos aparecen en varias pantallas y formularios. La repetición aumenta densidad y puede hacer que el usuario deje de leerlos.

**Recomendación:** establecer un sistema constante:

- Un icono y etiqueta breve **Privado** junto a campos o módulos.
- Un icono y etiqueta **Puede incluirse en reportes** donde corresponda.
- Un centro de privacidad accesible desde el encabezado con la explicación completa.
- Avisos extensos sólo antes de compartir o importar.

### P1. Dedicación puede convertirse involuntariamente en una medida de productividad

El número grande de horas domina el módulo, aunque el texto aclara que no equivale a avance.

**Recomendación:** dar el mismo peso a la reflexión cualitativa. Cambiar “Dedicación registrada” por “Cómo se distribuyó tu trabajo” y acompañar las horas con una pregunta breve: “¿Qué actividad te ayudó más esta semana?”. No añadir metas, rachas ni comparaciones competitivas.

### P1. Los estados tienen poco significado operativo

“Pendiente”, “En proceso”, “Bloqueado” y “Resuelto” describen, pero la interfaz no siempre sugiere qué hacer con un bloqueo o una fecha por revisar.

**Recomendación:** añadir acciones contextuales:

- Bloqueado → “Anotar qué necesitas”.
- Por revisar → “Reprogramar” o “Conversar en supervisión”.
- Resuelto → “Registrar evidencia” si falta.

### P1. Los controles principales compiten entre sí

En una tarjeta de ruta aparecen “Registrar avance”, “Añadir compromiso” y “Añadir ToDo” con peso similar. En la barra superior, “Abrir respaldo” y “Descargar respaldo” permanecen siempre visibles aunque no sean la tarea actual.

**Recomendación:** una acción primaria por contexto. Las acciones relacionadas pueden vivir en un menú “Añadir…” o aparecer después de registrar el avance.

### P1. La etiqueta “Prototipo local” reduce la confianza de una versión distribuida

El encabezado y la ayuda siguen describiendo Compás como prototipo. Para quien descarga una versión publicada, esto sugiere fragilidad o temporalidad.

**Recomendación:** usar “Compás · En este equipo” y mostrar la versión en Ayuda o Acerca de.

### P1. Persiste una frase que se había pedido retirar

En Mi ruta aparece “a partir de las rutas compartidas por la coordinación”. Aunque no coincide palabra por palabra con la frase anterior, conserva la misma afirmación que se solicitó omitir.

**Recomendación:** dejar: “Ruta de referencia en borrador. Versión 10 de septiembre de 2026. Puedes ajustar tu plan y conservar el motivo”.

## Accesibilidad y diseño inclusivo

### P1. El gris institucional no alcanza contraste para texto pequeño

`#82786F` sobre blanco tiene una relación aproximada de 4.32:1 y sobre el fondo `#F7F7F5`, 4.02:1. No alcanza el mínimo AA de 4.5:1 para texto normal. Se usa en números de navegación, etiquetas y otros textos de 12 a 14 píxeles.

**Recomendación:** reservar `#82786F` para bordes, formas grandes y elementos decorativos. Usar `#605951` o un tono más oscuro para texto pequeño.

### P1. La tipografía institucional declarada no está incluida

El CSS pide IBEROAMERICANA, pero el archivo local no contiene la fuente. En la mayoría de los equipos se verá Arial. El Manual de Identidad establece IBEROAMERICANA como tipografía auxiliar institucional.

**Recomendación:** solicitar a Comunicación Institucional el archivo y la autorización de uso digital, e integrarlo dentro del paquete local. Si no se autoriza, documentar un sustituto aprobado. No descargar ni reconstruir la fuente por cuenta propia.

### P1. El enlace para saltar al contenido no se hace visible al recibir foco

Existe el enlace “Ir al contenido”, pero conserva la clase visualmente oculta incluso al navegar con teclado.

**Recomendación:** mostrarlo al recibir `:focus-visible`, en la esquina superior izquierda y con contraste alto.

### P1. La navegación móvil se convierte en siete botones envueltos

En menos de 720 píxeles, la barra lateral pasa a una fila flexible con los siete módulos. Puede ocupar varias líneas, cambiar de altura entre dispositivos y perder la sensación de ubicación.

**Recomendación:** usar un selector de sección con el módulo actual visible y un menú accesible, o una barra inferior con cuatro destinos principales y “Más”. Brújula, Ruta y ToDo deben quedar al alcance inmediato.

### P2. El foco debe regresar al control que abrió un diálogo

Los diálogos nativos ayudan con teclado, pero no hay una gestión explícita del retorno de foco.

**Recomendación:** guardar el elemento activador y devolverle el foco al cerrar, cancelar o guardar.

### P2. El movimiento futuro debe respetar preferencias del sistema

Ya existe una regla para movimiento reducido, pero hoy sólo afecta el desplazamiento.

**Recomendación:** cualquier trazo de ruta, transición o microanimación debe desactivarse con `prefers-reduced-motion`.

## Revisión por módulo

### Brújula

**Funciona:** reúne pregunta, hito, próximos compromisos y decisiones.  
**Fricción:** es una página larga y retrospectiva.  
**Rediseño:** una cabecera editorial con la pregunta; debajo, **Para hoy** como centro de acción. La ruta y las decisiones aparecen como dos referencias secundarias. “Todos los compromisos” puede moverse a una vista específica o plegarse.

### Mi ruta

**Funciona:** distingue referencia, plan propio, estado, evidencia y revisión.  
**Fricción:** el carril de semestres y las tarjetas de producto exigen mucha lectura; las tres acciones por producto fragmentan la atención.  
**Rediseño:** una ruta vertical o escalonada con un foco claro en el semestre actual. Mostrar primero el producto, su estado y la siguiente acción; desplegar evidencia, aprobación e historial al solicitarlo.

### ToDo

**Funciona:** las tareas son privadas, reversibles y pueden vincularse.  
**Fricción:** la lista se parece a un gestor de tareas convencional.  
**Rediseño:** abrir con **Hoy** y permitir una captura directa en la página. Limitar visualmente el foco a tres tareas y dejar el resto en “Después”. No impedir que existan más; sólo reducir lo que compite por atención.

### Coloquios

**Funciona:** convierte comentarios en decisiones y compromisos.  
**Fricción:** la relación comentario → decisión → respuesta queda distribuida entre formulario, tarjetas y sección de desacuerdos.  
**Rediseño:** organizar cada coloquio como una secuencia: **Qué presenté / Qué escuché / Qué decidí / Qué haré**. Esta estructura puede ser visual y no necesita exponer todos los campos al inicio.

### Supervisión

**Funciona:** reconoce preparación, reunión y continuidad.  
**Fricción:** la idea “antes, durante, después” sólo aparece como aviso.  
**Rediseño:** convertirla en la estructura principal de cada reunión. Antes de la fecha se muestra la agenda; al abrir la reunión, un modo breve de notas; después, acuerdos y próxima fecha.

### Dedicación

**Funciona:** registra tiempo sin equipararlo a avance y conserva reflexiones privadas.  
**Fricción:** el total de horas domina y puede provocar culpa.  
**Rediseño:** mostrar una composición equilibrada entre distribución, contexto y reflexión. La pregunta útil es “¿Cómo trabajaste y qué te ayudó?”, no “¿Cuántas horas acumulaste?”.

### Reportes

**Funciona:** ofrece control granular y exclusiones privadas correctas.  
**Fricción:** todas las decisiones aparecen simultáneamente.  
**Rediseño:** asistente de tres pasos, plantillas por propósito y una revisión final explícita. Mantener Excel, panel y PDF, pero elegir formato después de confirmar el contenido.

## Dirección visual: Cartografía serena

### Personalidad

Compás debe sentirse como una mesa de trabajo ordenada: seria, cálida, silenciosa y confiable. La navegación aporta la estructura; la tesis sigue siendo protagonista. La metáfora no necesita ilustraciones constantes. Puede vivir en el modo de organizar el espacio.

### Sistema visual

- **Fondo:** blanco cálido o papel muy suave, con áreas amplias sin bordes.
- **Rojo IBERO `#E00034`:** orientación actual, una acción principal y marcadores esenciales.
- **Warm Gray 9 `#82786F`:** líneas, mapas y superficies grandes; no texto pequeño.
- **Negro y gris oscuro:** lectura continua y estados normales.
- **Tarjetas:** menos cajas. Usar separación, sangrías y líneas de ruta para agrupar.
- **Tipografía:** IBEROAMERICANA autorizada, con títulos editoriales y texto respirable. Longitud ideal de 55 a 75 caracteres por línea.
- **Iconografía:** trazos simples inspirados en coordenadas, marcas de registro, mojones y dirección. Evitar iconos genéricos de dashboard.
- **Textura:** sólo una textura institucional oficial si la DCI entrega el archivo. Como alternativa, usar líneas cartográficas propias que no reproduzcan partes del escudo o logotipo.

### Movimiento

- Transiciones de 160 a 220 ms para mostrar relaciones y cambios de estado.
- Un trazo corto puede conectar un acuerdo con una tarea o un producto.
- Al completar una tarea, el marcador se asienta y aparece “Hecho”; sin confeti, rachas ni sonidos.
- La ruta puede dibujarse una vez al entrar en el módulo, con una versión estática para movimiento reducido.

### Lenguaje

El tono debe ser directo y adulto. Debe aliviar sin infantilizar.

| Situación | Texto actual o típico | Propuesta |
|---|---|---|
| Inicio | “El siguiente paso” con varios compromisos | “Para hoy” y hasta tres acciones concretas |
| Sin tareas | “Sin tareas en esta vista” | “No hay nada pendiente aquí. Puedes volver a tu tesis.” |
| Fecha vencida | “Por revisar” | “La fecha pasó. ¿Quieres reprogramar o llevarlo a supervisión?” |
| Guardado | “Cambios sin descargar” | “Guardado en este equipo · Respaldo del 28 sep” |
| Bloqueo | “Bloqueado” | “Bloqueado · anota qué necesitas para continuar” |
| Final de captura | “Registro guardado en la bitácora” | “Listo. Puedes volver a tu tesis.” |

## Estructura propuesta de la portada

1. **Encabezado breve:** nombre del proyecto y pregunta de investigación.
2. **Para hoy:** una tarjeta dominante con hasta tres acciones y una captura rápida.
3. **Tu posición:** semestre, producto activo y próximo hito en una línea de ruta compacta.
4. **Reunión próxima:** sólo si existe una fecha o agenda pendiente.
5. **Cambios recientes:** decisiones y actualizaciones, plegadas por defecto.
6. **Seguridad:** estado de guardado y respaldo en una zona estable, sin competir con el trabajo.

La pantalla inicial no debe mostrar simultáneamente la brújula ilustrada, todas las decisiones y todos los compromisos. Esa información sigue existiendo, pero la jerarquía debe proteger la atención.

## Plan recomendado

### Fase 1. Reducir fricción y aumentar confianza

1. Corregir el modelo y los mensajes de guardado.
2. Separar “Nivel y semestre” del formulario completo del proyecto.
3. Crear captura rápida para tarea, compromiso y decisión.
4. Limitar Brújula a lo que requiere atención ahora.
5. Transformar Reportes en tres pasos.
6. Corregir contraste, enlace de salto y retorno de foco.
7. Retirar “Prototipo local” y la frase pendiente de Mi ruta.

### Fase 2. Dar identidad propia

1. Aplicar Cartografía serena al armazón, Brújula y Mi ruta.
2. Reducir el número de tarjetas y reservar el rojo para orientación.
3. Integrar la tipografía institucional autorizada.
4. Crear iconos y marcadores propios.
5. Rediseñar móvil con navegación compacta.

### Fase 3. Afinar el acompañamiento

1. Estructurar Supervisión como antes/durante/después.
2. Estructurar Coloquios como presenté/escuché/decidí/haré.
3. Equilibrar horas y reflexión en Dedicación.
4. Añadir deshacer para tareas, estados y eliminaciones recientes.
5. Incorporar microanimaciones accesibles.

## Criterios de aceptación

- Un tesista nuevo puede crear su bitácora y una primera tarea en menos de dos minutos.
- Una tarea o un compromiso simple requiere como máximo tres campos visibles al inicio.
- Cada pantalla tiene una sola acción primaria inequívoca.
- Brújula muestra como máximo tres acciones “Para hoy”.
- El usuario puede explicar con sus palabras la diferencia entre guardado local, respaldo y reporte.
- No aparece una advertencia de cambios si no hubo cambios desde el último estado conocido.
- Todos los textos normales alcanzan WCAG AA.
- La navegación con teclado muestra el enlace de salto y devuelve el foco al cerrar diálogos.
- En móvil, los siete módulos no ocupan varias filas permanentes.
- El usuario puede registrar un cambio de rumbo sin completar de inmediato toda la reflexión metodológica.
- Un reporte deja claro, antes de descargar, qué incluye y qué excluye.
- La identidad visual se reconoce en escala de grises por su composición y no sólo por el rojo.

## Validación con usuarios

Después del primer rediseño conviene probar con cinco tesistas de distintos semestres. No se necesita una encuesta extensa. Cada persona debería intentar estas tareas sin instrucciones:

1. Registrar una tarea para hoy.
2. Preparar una reunión de supervisión.
3. Registrar una decisión metodológica y dejar la reflexión para después.
4. Reprogramar un producto de la ruta sin sentir que “falló”.
5. Generar un reporte que no incluya notas privadas.
6. Cerrar y volver a abrir Compás explicando qué quedó guardado.

Las métricas útiles son tiempo, errores, abandonos, campos que generan duda y expresiones espontáneas de tranquilidad o presión. La pregunta final más reveladora sería: **“¿Compás te ayudó a volver a tu tesis o te dejó otra tarea administrativa?”**

## Conclusión de la auditoría

Compás no necesita más funciones para volverse más valioso. Necesita hacer visibles menos cosas a la vez, permitir registros mucho más breves y usar su metáfora de orientación como estructura de interacción. La privacidad, la trazabilidad y la flexibilidad ya son una base fuerte. El siguiente salto de calidad está en transformar esa solidez técnica en una experiencia que diga: **sé dónde estás, aquí hay un paso posible y puedes volver a tu tesis**.
