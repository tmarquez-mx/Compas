// Los archivos de importación permanecen en memoria hasta cerrar el asistente.
let todoImportDraft = null,
  todoImportRevision = 0;
function todoImportError(message) {
  const n = $("todo-import-error");
  if (n) {
    n.textContent = message;
    n.hidden = false;
  } else toast(message);
}
function todoImportStart() {
  const d = $("editor");
  dialogTrigger = document.activeElement;
  todoImportDraft = null;
  todoImportRevision++;
  d.classList.remove("appearance-dialog", "todo-import-dialog");
  d.classList.add("todo-import-dialog");
  d.innerHTML =
    '<div class="dialog-top"><div><h2 id="dialog-title">Traer tareas a Compás</h2><p class="hint">Elige un archivo y revisa qué quieres añadir a tu ToDo.</p></div>' +
    btn("Cerrar", "close", "", "ghost") +
    '</div><div class="dialog-body"><div id="todo-import-error" class="error" role="alert" hidden></div><label class="field"><span>Archivo CSV o ICS</span><input id="todo-import-file" type="file" accept=".csv,.ics,text/csv,text/calendar"><small class="hint">Hasta 2 MB y 1,000 registros. El CSV debe tener encabezados. Se lee en tu computadora; no se envía a servidores.</small></label><div class="import-guidance"><p><strong>Notion:</strong> exporta la base de tareas como CSV.</p><p><strong>Google Calendar, Outlook o Calendario de Apple:</strong> exporta un calendario como ICS. Podrás elegir los eventos que quieras convertir en tareas.</p><p class="hint">Si recibes un ZIP, descomprímelo y elige el CSV o ICS. No es sincronización: el archivo original y sus futuras actualizaciones permanecen en la otra aplicación.</p></div><details class="form-extra"><summary>Pegar texto CSV o ICS</summary><div class="form-grid"><label class="field"><span>Formato del texto</span><select id="todo-import-format"><option value="csv">CSV · tabla de tareas</option><option value="ics">ICS · calendario o tareas</option></select></label><label class="field wide"><span>Contenido del archivo</span><textarea id="todo-import-paste" rows="5" placeholder="Pega aquí el contenido de tu CSV o ICS"></textarea></label><div>' +
    btn("Revisar texto", "todo-import-text", "", "compact") +
    '</div></div></details><p class="hint">Los títulos se importan como texto. Las notas son opcionales y quedan fuera de los reportes.</p></div><div class="dialog-bottom"><span class="hint">Nada se añade hasta que confirmes tu selección.</span>' +
    btn("Cancelar", "close") +
    "</div>";
  if (!d.open) d.showModal();
}
function importHeaderKey(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
function importGuess(columns, names, fallback = -1) {
  const i = columns.findIndex((c) => names.includes(importHeaderKey(c)));
  return i < 0 ? fallback : i;
}
function todoImportLoad(text, format, name) {
  const parsed = C.parseTodoImport(text, format),
    columns = parsed.columns;
  todoImportDraft = {
    parsed,
    name: name || "Texto pegado",
    mapping: {
      title: importGuess(
        columns,
        ["title", "titulo", "name", "nombre", "task", "tarea", "actividad"],
        columns.length ? 0 : -1,
      ),
      due: importGuess(columns, [
        "due",
        "due date",
        "fecha",
        "date",
        "fecha prevista",
        "fecha limite",
        "deadline",
        "vencimiento",
      ]),
      priority: importGuess(columns, ["priority", "prioridad"]),
      status: importGuess(columns, [
        "status",
        "estado",
        "done",
        "completed",
        "completada",
        "terminada",
      ]),
      notes: importGuess(columns, [
        "notes",
        "notas",
        "description",
        "descripcion",
        "nota privada",
      ]),
    },
    options: { dateOrder: "dmy", includeNotes: false },
    candidates: [],
    duplicates: new Set(),
    selected: new Set(),
    page: 0,
  };
  todoImportRemap();
  todoImportPreview();
}
function todoImportRemap() {
  const x = todoImportDraft;
  x.candidates = C.mapTodoImport(x.parsed, x.mapping, x.options);
  x.duplicates = new Set(C.todoImportDuplicates(state, x.candidates));
  x.selected = new Set();
  x.page = 0;
}
function importMappingField(key, label) {
  const x = todoImportDraft;
  return (
    '<label class="field"><span>' +
    label +
    '</span><select data-import-map="' +
    key +
    '"><option value="-1">' +
    (key === "title" ? "Elegir columna" : "No importar") +
    "</option>" +
    x.parsed.columns
      .map(
        (c, i) =>
          '<option value="' +
          i +
          '"' +
          (x.mapping[key] === i ? " selected" : "") +
          ">" +
          e(c || "Columna " + (i + 1)) +
          "</option>",
      )
      .join("") +
    "</select></label>"
  );
}
function todoImportPreview() {
  const active = document.activeElement,
    focusId = active?.id?.startsWith("todo-import-") ? active.id : "",
    focusMap = active?.dataset?.importMap,
    focusAction = active?.dataset?.do,
    scroll = $("editor").querySelector(".dialog-body")?.scrollTop || 0;
  const x = todoImportDraft;
  if (!x) return;
  const d = $("editor"),
    csv = x.parsed.format === "csv",
    available = x.candidates.filter(
      (c) => !c.issues.length && !x.duplicates.has(c.index),
    ),
    pages = Math.max(1, Math.ceil(x.candidates.length / 25)),
    slice = x.candidates.slice(x.page * 25, x.page * 25 + 25);
  d.innerHTML =
    '<div class="dialog-top"><div><h2 id="dialog-title">Elige las tareas que quieres traer</h2><p class="hint">' +
    e(x.name) +
    " · " +
    x.candidates.length +
    " registros encontrados</p></div>" +
    btn("Cerrar", "close", "", "ghost") +
    '</div><div class="dialog-body"><div id="todo-import-error" class="error" role="alert" hidden></div>' +
    (csv
      ? '<details class="form-extra" open><summary>Columnas y formato de fecha</summary><p class="hint">Revisa qué representa cada columna. Cambiar estos ajustes reinicia la selección.</p><div class="form-grid">' +
        importMappingField("title", "Título de la tarea *") +
        importMappingField("due", "Fecha prevista") +
        importMappingField("priority", "Prioridad") +
        importMappingField("status", "Estado") +
        importMappingField("notes", "Notas privadas (opcional)") +
        '<label class="field"><span>Orden de las fechas del CSV</span><select id="todo-import-date-order">' +
        [
          ["dmy", "Día / mes / año"],
          ["mdy", "Mes / día / año"],
          ["ymd", "Año / mes / día"],
        ]
          .map(
            ([v, t]) =>
              '<option value="' +
              v +
              '"' +
              (x.options.dateOrder === v ? " selected" : "") +
              ">" +
              t +
              "</option>",
          )
          .join("") +
        '</select><small class="hint">Las fechas ISO, como 2026-10-01, se reconocen directamente.</small></label></div></details>'
      : '<p class="privacy-note">Los eventos elegidos se convertirán en tareas. Se conserva el día declarado en el archivo; no se importan horarios ni se generan repeticiones.</p>') +
    '<label class="import-notes"><input id="todo-import-notes" type="checkbox"' +
    (x.options.includeNotes ? " checked" : "") +
    '> Incluir notas privadas del archivo</label><p class="hint">Desactivado por defecto. No se importan asistentes, ubicaciones, adjuntos ni enlaces de calendario.</p>' +
    (x.parsed.warnings.length
      ? '<details class="import-warnings"><summary>Observaciones del archivo · ' +
        x.parsed.warnings.length +
        "</summary><ul>" +
        x.parsed.warnings.map((w) => "<li>" + e(w) + "</li>").join("") +
        "</ul></details>"
      : "") +
    '<div class="import-selection"><p id="todo-import-count" role="status">' +
    x.selected.size +
    " seleccionadas · " +
    available.length +
    " disponibles" +
    (x.duplicates.size ? " · " + x.duplicates.size + " duplicadas" : "") +
    '</p><div class="toolbar">' +
    btn("Seleccionar todas las disponibles", "todo-import-all", "", "compact") +
    btn("Quitar selección", "todo-import-none", "", "ghost compact") +
    '</div></div><div class="table-wrap"><table class="time-table import-table"><thead><tr><th>Elegir</th><th>Tarea y observaciones</th><th>Fecha prevista</th><th>Estado</th></tr></thead><tbody>' +
    slice
      .map((c) => {
        const duplicate = x.duplicates.has(c.index),
          disabled = c.issues.length || duplicate;
        return (
          '<tr><td><input type="checkbox" data-import-select="' +
          c.index +
          '" aria-label="' +
          e("Importar: " + (c.title || "Registro sin título")) +
          '"' +
          (disabled ? " disabled" : "") +
          (x.selected.has(c.index) ? " checked" : "") +
          "></td><td><strong>" +
          e(c.title || "Sin título") +
          "</strong>" +
          (duplicate ? ["Ya está en ToDo o repetida en este archivo"] : [])
            .concat(c.issues, c.warnings)
            .map(
              (w) =>
                '<div class="hint' +
                (c.issues.includes(w) ? " import-issue" : "") +
                '">' +
                e(w) +
                "</div>",
            )
            .join("") +
          (x.options.includeNotes && c.privateNotes
            ? '<details class="details"><summary>Nota privada que se importará</summary><p class="small pre">' +
              e(c.privateNotes) +
              "</p></details>"
            : "") +
          "</td><td>" +
          e(c.due ? fmt(c.due) : "Sin fecha") +
          "</td><td>" +
          e(c.done ? "Terminada" : "Por hacer") +
          '<div class="hint">Prioridad ' +
          e(c.priority) +
          "</div></td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>" +
    (pages > 1
      ? '<div class="import-pagination">' +
        btn(
          "Anterior",
          "todo-import-page",
          'data-page="' +
            (x.page - 1) +
            '"' +
            (x.page === 0 ? " disabled" : ""),
          "compact",
        ) +
        "<span>Página " +
        (x.page + 1) +
        " de " +
        pages +
        "</span>" +
        btn(
          "Siguiente",
          "todo-import-page",
          'data-page="' +
            (x.page + 1) +
            '"' +
            (x.page === pages - 1 ? " disabled" : ""),
          "compact",
        ) +
        "</div>"
      : "") +
    '<p class="hint">Los registros con errores o duplicados no se añaden. Para corregir un registro, ajusta el archivo y vuelve a abrirlo. Ninguna tarea existente se reemplaza.</p><div class="import-backup"><p class="hint">Puedes descargar un respaldo antes de añadir las tareas.</p>' +
    btn("Descargar respaldo", "backup", "", "compact") +
    '</div></div><div class="dialog-bottom">' +
    btn("Otro archivo", "todo-import-other", "", "ghost") +
    '<div class="toolbar">' +
    btn("Cancelar", "close") +
    btn(
      "Añadir " + x.selected.size + " tareas a ToDo",
      "todo-import-commit",
      x.selected.size ? "" : "disabled",
      "primary",
    ) +
    "</div></div>";
  const body = d.querySelector(".dialog-body");
  if (body) body.scrollTop = scroll;
  const focus = focusId
    ? document.getElementById(focusId)
    : focusMap
      ? d.querySelector('[data-import-map="' + focusMap + '"]')
      : focusAction
        ? d.querySelector('[data-do="' + focusAction + '"]')
        : null;
  focus?.focus({ preventScroll: true });
}
function todoImportCommit() {
  const x = todoImportDraft;
  if (!x || !x.selected.size) return;
  try {
    const beforeIds = new Set(state.todos.map((t) => t.id)),
      result = C.mergeTodoImport(state, x.candidates, [...x.selected]);
    if (!mutate((s) => Object.assign(s, result.state))) {
      todoImportError(
        saveWarning ||
          "No se pudo añadir el lote. La selección sigue disponible.",
      );
      return;
    }
    const added = new Map(
      state.todos
        .filter((t) => !beforeIds.has(t.id))
        .map((t) => [t.id, JSON.stringify(t)]),
    );
    todoFilter = "todas";
    $("editor").close();
    navigate("todo");
    toast(
      saveMessage(
        result.added +
          " tareas añadidas" +
          (result.duplicates
            ? " · " + result.duplicates + " duplicadas omitidas"
            : "") +
          ". Descarga tu respaldo para conservarlas.",
      ),
      result.added
        ? () => {
            let kept = 0;
            mutate((s) => {
              s.todos = s.todos.filter((t) => {
                if (!added.has(t.id)) return true;
                if (JSON.stringify(t) !== added.get(t.id)) {
                  kept++;
                  return true;
                }
                return false;
              });
            });
            toast(
              kept
                ? "Se deshizo el lote; se conservaron " +
                    kept +
                    " tareas que modificaste."
                : "Importación deshecha. Las tareas anteriores se conservaron.",
            );
          }
        : null,
    );
  } catch (err) {
    todoImportError(err.message);
  }
}
