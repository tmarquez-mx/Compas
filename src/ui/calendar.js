// La selección permanece sólo en memoria y no cambia las tareas de la bitácora.
let todoCalendarDraft = null;
function todoCalendarStart() {
  let candidates;
  try {
    candidates = C.calendarCandidates(state);
  } catch (error) {
    toast(error.message);
    return;
  }
  todoCalendarDraft = {
    candidates,
    selected: new Set(candidates.map((task) => task.id)),
  };
  const d = $("editor");
  dialogTrigger = document.activeElement;
  d.classList.remove("appearance-dialog", "todo-import-dialog");
  d.classList.add("todo-import-dialog");
  const undated = state.todos.filter((task) => !task.done && !task.due).length;
  d.innerHTML =
    '<div class="dialog-top"><div><h2 id="dialog-title">Llevar mis tareas al calendario</h2><p class="hint">Elige los pasos que quieres recordar en Google Calendar, Calendario de Apple u Outlook.</p></div>' +
    btn("Cerrar", "close", "", "ghost") +
    '</div><div class="dialog-body"><div id="todo-calendar-error" class="error" role="alert" hidden></div><p>Se guardará un archivo <strong>.ics</strong> con los títulos y las fechas que elijas. Cada tarea aparecerá como un evento de día completo en su fecha prevista; tus notas privadas se quedan en Compás.</p><p class="hint">Sólo aparecen tareas pendientes con fecha.' +
    (undated
      ? " Tienes " +
        undated +
        " sin fecha: puedes añadirla desde Editar tarea y volver aquí."
      : "") +
    '</p><div class="import-selection"><p id="todo-calendar-count" role="status"></p><div class="toolbar">' +
    btn(
      "Seleccionar todas",
      "todo-calendar-all",
      candidates.length ? "" : "disabled",
      "compact",
    ) +
    btn(
      "Quitar selección",
      "todo-calendar-none",
      candidates.length ? "" : "disabled",
      "ghost compact",
    ) +
    "</div></div>" +
    (candidates.length
      ? '<div class="table-wrap"><table class="time-table calendar-table"><thead><tr><th>Elegir tarea</th><th>Fecha prevista</th></tr></thead><tbody>' +
        candidates
          .map(
            (task) =>
              '<tr><td><label class="import-notes"><input type="checkbox" data-calendar-select="' +
              e(task.id) +
              '" value="' +
              e(task.id) +
              '" checked><span>' +
              e(
                task.title.length > 300
                  ? task.title.slice(0, 300) + "…"
                  : task.title,
              ) +
              "</span></label></td><td>" +
              e(fmt(task.due)) +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>"
      : empty(
          "Aún no hay tareas para llevar al calendario",
          "Añade una fecha prevista a una tarea pendiente y vuelve a exportar.",
        )) +
    '<details class="form-extra"><summary>Cómo importar el archivo</summary><div class="import-guidance"><p><strong>Google Calendar (en computadora):</strong> Configuración → Importar y exportar → Seleccionar un archivo del ordenador. Elige el .ics, el calendario de destino y pulsa Importar.</p><p><strong>Calendario de Apple (en Mac):</strong> Archivo → Importar. Elige el .ics y el calendario donde quieres añadirlo.</p><p><strong>Outlook en la web:</strong> Agregar calendario → Cargar desde archivo. Elige el .ics y el calendario de destino; pulsa Importar.</p></div></details><p class="hint">Después de descargar, importa el archivo en tu calendario. No hay conexión ni sincronización automática: los cambios de fecha o estado se hacen por separado. Revisa tu calendario antes de volver a importar para evitar duplicados.</p></div><div class="dialog-bottom"><span class="hint" id="todo-calendar-status" role="status">El archivo contiene sólo la selección que estás viendo.</span><div class="toolbar">' +
    btn("Cancelar", "close") +
    btn(
      "Descargar calendario .ics",
      "todo-calendar-download",
      'id="todo-calendar-download"',
      "primary",
    ) +
    "</div></div>";
  todoCalendarUpdate();
  if (!d.open) d.showModal();
}
function todoCalendarUpdate() {
  if (!todoCalendarDraft) return;
  const count = todoCalendarDraft.selected.size,
    status = $("todo-calendar-count"),
    button = $("todo-calendar-download");
  if (status)
    status.textContent =
      count +
      (count === 1 ? " tarea seleccionada" : " tareas seleccionadas") +
      " · " +
      todoCalendarDraft.candidates.length +
      " disponibles";
  if (button) button.disabled = !count;
}
function todoCalendarSelect(all) {
  if (!todoCalendarDraft) return;
  todoCalendarDraft.selected = new Set(
    all ? todoCalendarDraft.candidates.map((task) => task.id) : [],
  );
  $("editor")
    .querySelectorAll("[data-calendar-select]")
    .forEach((checkbox) => {
      checkbox.checked = todoCalendarDraft.selected.has(checkbox.value);
    });
  todoCalendarUpdate();
}
function todoCalendarDownload() {
  if (!todoCalendarDraft) return;
  try {
    const text = C.calendarICS(state, [...todoCalendarDraft.selected]);
    download(
      text,
      "Compas-tareas-" + C.today() + ".ics",
      "text/calendar;charset=utf-8",
    );
    $("todo-calendar-error").hidden = true;
    $("todo-calendar-status").textContent =
      "Archivo preparado. Busca el .ics en tus descargas e impórtalo en tu calendario.";
    toast(
      "Calendario preparado. Importa el archivo .ics en el calendario que uses.",
    );
  } catch (error) {
    const status = $("todo-calendar-error");
    status.textContent = error.message;
    status.hidden = false;
    status.scrollIntoView({ block: "nearest" });
  }
}
