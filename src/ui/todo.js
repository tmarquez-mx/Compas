function todoSort(a, b) {
  return (
    Number(a.done) - Number(b.done) ||
    (a.due || "9999").localeCompare(b.due || "9999") ||
    { alta: 0, media: 1, baja: 2 }[a.priority] -
      { alta: 0, media: 1, baja: 2 }[b.priority] ||
    a.title.localeCompare(b.title)
  );
}
function renderTodo() {
  let h = head(
    "ToDo · un paso a la vez",
    '<div class="toolbar">' +
      btn("Importar tareas", "todo-import") +
      btn("Exportar a calendario", "todo-calendar") +
      btn("Nueva tarea", "todo-edit", "", "primary") +
      "</div>",
  );
  h +=
    '<p class="module-note"><span class="badge private">Solo para ti</span> Completar una tarea no cierra compromisos ni aprueba productos.</p>';
  const filters = {
    pendientes: "Por hacer",
    hoy: "Hoy y anteriores",
    semana: "Próximos 7 días",
    terminadas: "Terminadas",
    todas: "Todas",
  };
  const items = state.todos
    .filter(
      (t) =>
        todoFilter === "todas" ||
        (todoFilter === "terminadas" && t.done) ||
        (todoFilter === "pendientes" && !t.done) ||
        (todoFilter === "hoy" && !t.done && t.due && t.due <= C.today()) ||
        (todoFilter === "semana" &&
          !t.done &&
          t.due >= C.today() &&
          t.due <= C.shift(6)),
    )
    .sort(todoSort);
  h +=
    '<div class="filter-row"><h2>Mis tareas</h2><label>Mostrar <select id="todo-filter">' +
    Object.entries(filters)
      .map(
        ([v, l]) =>
          '<option value="' +
          v +
          '"' +
          (todoFilter === v ? " selected" : "") +
          ">" +
          l +
          "</option>",
      )
      .join("") +
    "</select></label></div>";
  h +=
    '<section class="card todo-list">' +
    (items
      .map((t) => {
        const a = state.actions.find((x) => x.id === t.actionId),
          m = C.milestone(t.milestoneId),
          late = !t.done && t.due && t.due < C.today();
        return (
          '<article class="todo-row' +
          (t.done ? " completed" : "") +
          '"><label class="todo-check"><input type="checkbox" data-todo-check="' +
          e(t.id) +
          '"' +
          (t.done ? " checked" : "") +
          ' aria-label="' +
          e((t.done ? "Reabrir: " : "Completar: ") + t.title) +
          '"><span class="todo-title">' +
          e(t.title) +
          '</span></label><div class="todo-meta"><div class="row-meta"><span class="' +
          (late ? "overdue" : "") +
          '">' +
          (late ? "Revisar fecha · " : "") +
          e(fmt(t.due)) +
          "</span><span>Prioridad " +
          e(t.priority) +
          "</span>" +
          (t.done
            ? "<span>Terminada: " + e(fmt(t.completedAt)) + "</span>"
            : "") +
          "</div>" +
          (a
            ? '<p class="hint">Compromiso: ' + e(a.description) + "</p>"
            : "") +
          (m
            ? '<p class="hint">' +
              e(C.LEVELS[m.level]) +
              " · S" +
              m.semester +
              " · " +
              e(m.title) +
              "</p>"
            : "") +
          (t.privateNotes
            ? '<details class="details"><summary>Nota privada</summary><p class="small pre">' +
              e(t.privateNotes) +
              "</p></details>"
            : "") +
          "</div>" +
          btn("Editar", "todo-edit", 'data-id="' + e(t.id) + '"', "compact") +
          "</article>"
        );
      })
      .join("") ||
      empty(
        "Sin tareas en esta vista",
        "Puedes añadir una tarea o consultar otro filtro.",
        btn("Añadir tarea", "todo-edit", "", "compact"),
      )) +
    "</section>";
  h +=
    '<details class="todo-time"' +
    (timeExpanded ? " open" : "") +
    "><summary>Registrar dedicación (opcional)</summary>" +
    renderTime() +
    "</details>";
  return h;
}

function todoForm(id, actionId, milestoneId) {
  const a = state.actions.find((x) => x.id === actionId),
    t = state.todos.find((x) => x.id === id) || {
      id: C.uid(),
      title: "",
      date: C.today(),
      due: a?.due || "",
      priority: a?.priority || "media",
      done: false,
      completedAt: "",
      actionId: a?.id || "",
      milestoneId: milestoneId || a?.milestoneId || "",
      privateNotes: "",
    };
  const b =
    field("title", "¿Cuál es el siguiente paso concreto?", t.title, {
      wide: true,
      required: true,
      hint: "Ejemplo: revisar dos párrafos de la justificación.",
    }) +
    field("due", "Fecha prevista (opcional)", t.due, {
      type: "date",
      wide: true,
    }) +
    '<details class="form-extra"' +
    (id ? " open" : "") +
    '><summary>Prioridad, vínculos y nota privada</summary><div class="form-grid">' +
    field("priority", "Prioridad", t.priority, {
      options: [
        ["alta", "Alta"],
        ["media", "Media"],
        ["baja", "Baja"],
      ],
    }) +
    field("actionId", "Vincular con un compromiso", t.actionId, {
      wide: true,
      options: [
        ["", "Sin vínculo"],
        ...state.actions.map((x) => [x.id, x.description]),
      ],
    }) +
    field("milestoneId", "Vincular con un producto de la ruta", t.milestoneId, {
      wide: true,
      options: milestoneOptions(t.milestoneId),
    }) +
    field("privateNotes", "Notas privadas", t.privateNotes, {
      textarea: true,
      wide: true,
    }) +
    "</div></details>";
  openForm(
    id ? "Editar tarea" : "Añadir un paso",
    "Solo para ti. Puedes guardar una tarea con una sola frase.",
    b,
    (f) => upsert("todos", { ...t, ...f }),
    id ? () => remove("todos", id) : null,
    "¿Eliminar esta tarea? Su compromiso y producto se conservarán.",
  );
}
