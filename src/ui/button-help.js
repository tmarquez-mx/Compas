// Ayuda de controles: un único globo compartido, con ratón y foco de teclado.
const MODULE_HELP = {
  brujula: "Empieza aquí: elige un paso pequeño y retoma tu rumbo.",
  ruta: "Consulta la referencia por semestres y adapta cada producto a tu plan.",
  todo: "Anota pasos pequeños. Si te sirve, registra también tu dedicación. Todo permanece privado.",
  coloquios:
    "Prepara o recuerda una presentación y los comentarios que recibiste.",
  supervision: "Guarda lo conversado con tu dirección y los próximos acuerdos.",
  dedicacion: "Escribe una idea, una duda o cómo te fue. Tu diario es privado.",
  reportes: "Elige qué avances compartir. Tu diario y tus tareas quedan fuera.",
};
const ACTION_HELP = {
  close:
    "Cierra esta ventana. Los cambios del formulario se conservan al pulsar Guardar cambios.",
  new: "Crea una bitácora propia a partir de una página en blanco.",
  demo: "Carga registros ficticios para explorar cómo funciona Compás.",
  project: "Anota o ajusta tu pregunta, tu proyecto y tu próximo hito.",
  level: "Indica nivel y semestre para consultar tu ruta de referencia.",
  "todo-edit":
    "Anota o revisa una tarea pequeña. Puede tener fecha y un vínculo; permanece privada.",
  "route-progress":
    "Anota lo que avanzaste en este producto y, si hace falta, ajusta tu plan. Se conserva su historia.",
  "route-stage":
    "Mira los productos de este semestre. Es una referencia que puedes adaptar.",
  session:
    "Anota una conversación o presentación y los acuerdos que quieres retomar.",
  action:
    "Anota o revisa un compromiso: qué se acordó y cómo darás el siguiente paso.",
  decision: "Guarda una decisión y sus motivos para poder retomarlos después.",
  evolve:
    "Registra una nueva decisión vinculada a la anterior, conservando ambas.",
  time: "Anota una actividad y su duración, si te resulta útil. Es un registro privado y opcional.",
  reflection:
    "Abre una página de tu diario. Solo va en tu respaldo personal, nunca en los reportes.",
  appearance:
    "Elige colores, foto, marco y adornos para que este espacio se sienta tuyo.",
  frame: "Elige este marco para tu foto. Puedes cambiarlo cuando quieras.",
  decoration:
    "Elige este adorno para acompañarte. No necesitas completar metas para usarlo.",
  "dismiss-celebration":
    "Cierra esta invitación y continúa a tu ritmo. Tu avance sigue guardado.",
  "toggle-nav": "Muestra u oculta los demás espacios de Compás.",
  theme: "Prueba este ambiente de colores; solo cambia la apariencia.",
  "choose-photo":
    "Elige una imagen de tu equipo. Se guarda en este navegador y no se comparte.",
  "remove-photo":
    "Quita la foto de este navegador; tus anotaciones permanecen.",
  "reset-appearance":
    "Vuelve al tema Aire, oculta la foto y retira adornos. No modifica tu bitácora.",
  "confirm-backup":
    "Confirma que localizaste y guardaste el archivo descargado de tu respaldo.",
  "retry-edit": "Comprueba si esta pestaña ya puede guardar cambios.",
  help: "Consulta cómo empezar, qué se guarda y cómo conservar tu trabajo.",
  open: "Retoma tu trabajo desde un respaldo personal JSON que ya guardaste.",
  backup:
    "Descarga tu bitácora completa, incluido tu diario privado, para poder recuperarla.",
  recovery: "Revisa las copias anteriores que este navegador pudo conservar.",
  "recovery-download":
    "Descarga la copia elegida para conservarla como archivo.",
  "recovery-restore":
    "Retoma la copia elegida; la bitácora activa se conserva como copia anterior cuando puede guardarse.",
  "recovery-release":
    "Libera el espacio de esta copia anterior después de conservar su archivo.",
  "delete-record": "Elimina esta anotación después de pedirte confirmación.",
  preview:
    "Prepara una copia con los registros que elegiste, para revisarla antes de compartir.",
  html: "Descarga el panel de consulta con tu selección. No incluye diario, tareas ni horas.",
  excel:
    "Descarga tu selección en Excel para consultar o conversar sobre los avances.",
  pdf: "Abre la impresión del reporte seleccionado. Allí puedes guardarlo como PDF.",
  "todo-import":
    "Trae tareas desde un CSV o ICS. Podrás revisar y elegir antes de añadirlas.",
  "todo-calendar":
    "Elige tareas con fecha y descarga un archivo para Google Calendar, Calendario de Apple u Outlook.",
  "todo-calendar-all":
    "Selecciona todas las tareas pendientes con fecha para este archivo de calendario.",
  "todo-calendar-none":
    "Quita la selección de tareas que vas a llevar al calendario.",
  "todo-calendar-download":
    "Descarga un ICS con los títulos y fechas elegidos. Después impórtalo en tu calendario.",
  "todo-import-other": "Elige otro archivo o texto para revisar sus tareas.",
  "todo-import-text":
    "Revisa el texto pegado y prepara las tareas; todavía no las guarda.",
  "todo-import-all":
    "Selecciona todas las tareas válidas disponibles en esta importación.",
  "todo-import-none": "Quita la selección de las tareas de esta importación.",
  "todo-import-page": "Mira otra página de las tareas que estás revisando.",
  "todo-import-commit":
    "Añade solo las tareas seleccionadas. Puedes deshacer el lote si no las has editado.",
};
function buttonHelp(button) {
  if (button.dataset.view)
    return MODULE_HELP[button.dataset.view] || "Abre este espacio de Compás.";
  if (button.dataset.do === "frame" && button.dataset.frame === "none")
    return "Muestra tu foto sola, sin marco. Puedes conservar sus adornos si quieres.";
  if (button.dataset.do)
    return ACTION_HELP[button.dataset.do] || "Abre esta opción para continuar.";
  if (button.type === "submit")
    return "Guarda esta anotación en tu bitácora. Después puedes volver a editarla.";
  if (button.textContent.trim() === "Deshacer")
    return "Revierte el último cambio que acabas de hacer.";
  return (
    button.getAttribute("aria-label") ||
    button.textContent.trim() ||
    "Usa esta opción para continuar."
  );
}
function installButtonHelp() {
  const hint = $("button-hint");
  let target = null,
    timer,
    keyboard = false;
  function hide() {
    clearTimeout(timer);
    if (target) {
      const ids = (target.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== hint.id);
      if (ids.length) target.setAttribute("aria-describedby", ids.join(" "));
      else target.removeAttribute("aria-describedby");
    }
    target = null;
    if (hint.hidePopover && hint.matches(":popover-open")) hint.hidePopover();
    hint.hidden = true;
  }
  function show(button) {
    hide();
    if (!button.isConnected) return;
    target = button;
    hint.textContent = buttonHelp(button);
    const description = button.getAttribute("aria-describedby") || "";
    button.setAttribute(
      "aria-describedby",
      (description + " " + hint.id).trim(),
    );
    if (!hint.showPopover)
      (button.closest("dialog[open]") || document.body).append(hint);
    hint.hidden = false;
    if (hint.showPopover) hint.showPopover();
    const box = button.getBoundingClientRect(),
      width = hint.offsetWidth,
      height = hint.offsetHeight;
    hint.style.left =
      Math.max(8, Math.min(box.left, window.innerWidth - width - 8)) + "px";
    hint.style.top =
      Math.max(
        8,
        box.bottom + height + 14 > window.innerHeight
          ? box.top - height - 8
          : box.bottom + 8,
      ) + "px";
  }
  function annotate(root) {
    for (const button of root.querySelectorAll("button"))
      button.dataset.tooltip = buttonHelp(button);
    if (root.matches?.("button")) root.dataset.tooltip = buttonHelp(root);
  }
  annotate(document);
  new MutationObserver((records) => {
    for (const record of records)
      for (const node of record.addedNodes)
        if (node.nodeType === 1) annotate(node);
    if (target && !target.isConnected) hide();
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("mouseover", (ev) => {
    const button = ev.target.closest("button");
    if (!button || button === ev.relatedTarget?.closest?.("button")) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(button), 350);
  });
  document.addEventListener("mouseout", (ev) => {
    const button = ev.target.closest("button");
    if (button && button !== ev.relatedTarget?.closest?.("button")) hide();
  });
  document.addEventListener("focusin", (ev) => {
    if (keyboard && ev.target.matches("button")) show(ev.target);
  });
  document.addEventListener("focusout", hide);
  document.addEventListener(
    "pointerdown",
    () => {
      keyboard = false;
      hide();
    },
    true,
  );
  document.addEventListener(
    "keydown",
    (ev) => {
      keyboard = true;
      if (ev.key === "Escape" && !hint.hidden) {
        ev.preventDefault();
        ev.stopPropagation();
        hide();
      }
    },
    true,
  );
  document.addEventListener("close", hide, true);
  document.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);
}
