function milestoneOptions(selected) {
  const level = state.project.level;
  return [
    ["", "Sin vínculo"],
    ...C.routeMilestones(state, true)
      .filter((m) => (!m.archived && m.level === level) || m.id === selected)
      .map((m) => [
        m.id,
        C.LEVELS[m.level] + " · S" + m.semester + " · " + m.title,
      ]),
  ];
}

function routeStatus(p) {
  return p ? C.ROUTE_STATES[p.status] : "Sin registro";
}
function routeCard(m) {
  const p = state.routeProgress.find((x) => x.id === m.id),
    value = p || C.routeDefault(m.id, state),
    acts = state.actions.filter((a) => a.milestoneId === m.id),
    decs = state.decisions.filter((d) => d.milestoneId === m.id);
  const related = C.routeMilestones(state).filter(
    (other) => other.workId === m.workId && other.id !== m.id,
  );
  const detail = (l, v) =>
    v ? "<dt>" + e(l) + "</dt><dd>" + e(v) + "</dd>" : "";
  return (
    '<article class="card route-card"><div class="card-head"><span class="eyebrow">Producto · S' +
    m.semester +
    '</span><span class="badge">' +
    e(routeStatus(p)) +
    "</span></div><h3>" +
    e(m.title) +
    '</h3><p class="small">' +
    e(m.expected) +
    '</p><div class="route-plan"><span>Referencia: semestre ' +
    m.semester +
    "</span><strong>Mi plan: semestre " +
    e(value.planSemester) +
    "</strong><span>" +
    e(fmt(value.due)) +
    "</span></div>" +
    (value.versionLabel
      ? '<p class="hint">Versión: ' + e(value.versionLabel) + "</p>"
      : "") +
    (value.evidence
      ? '<p class="small pre">' + e(value.evidence) + "</p>"
      : "") +
    '<p class="hint">' +
    e(C.REVIEWS[value.reviewState]) +
    (value.reviewDate ? " · " + e(fmt(value.reviewDate)) : "") +
    "</p>" +
    (value.adjustmentReason
      ? '<p class="hint pre"><strong>Ajuste del plan:</strong> ' +
        e(value.adjustmentReason) +
        "</p>"
      : "") +
    '<div class="toolbar route-actions">' +
    btn(
      p ? "Actualizar avance" : "Registrar avance",
      "route-progress",
      'data-id="' + m.id + '"',
      "compact primary",
    ) +
    btn(
      "Añadir compromiso",
      "action",
      'data-milestone="' + m.id + '"',
      "compact",
    ) +
    btn(
      "Añadir ToDo",
      "todo-edit",
      'data-milestone="' + m.id + '"',
      "compact",
    ) +
    btn(
      "Adaptar entregable",
      "route-product",
      'data-id="' + e(m.id) + '"',
      "ghost compact",
    ) +
    btn(
      "Retirar del plan",
      "route-archive",
      'data-id="' + e(m.id) + '"',
      "ghost compact",
    ) +
    "</div>" +
    (acts.length
      ? '<details class="details"><summary>' +
        acts.length +
        " compromisos vinculados</summary>" +
        acts.map(actionRow).join("") +
        "</details>"
      : "") +
    (decs.length
      ? '<details class="details"><summary>Decisiones vinculadas</summary>' +
        decs
          .map(
            (d) =>
              "<p>" +
              btn(
                d.title,
                "decision",
                'data-id="' + e(d.id) + '"',
                "ghost compact",
              ) +
              "</p>",
          )
          .join("") +
        "</details>"
      : "") +
    (related.length
      ? '<details class="details"><summary>El mismo trabajo en otros semestres</summary><p class="hint">Cada etapa conserva su propio registro; actualizar una no completa las demás.</p>' +
        related
          .map((other) => {
            const op = state.routeProgress.find((x) => x.id === other.id);
            return (
              '<div class="related-stage"><strong>S' +
              other.semester +
              " · " +
              e(other.title) +
              '</strong><p class="hint">' +
              e(routeStatus(op)) +
              (op?.versionLabel ? " · " + e(op.versionLabel) : "") +
              "</p>" +
              btn(
                "Ver etapa",
                "route-stage",
                'data-semester="' + other.semester + '"',
                "ghost compact",
              ) +
              "</div>"
            );
          })
          .join("") +
        "</details>"
      : "") +
    (p?.history.length
      ? '<details class="details"><summary>Historial · ' +
        p.history.length +
        " registros anteriores</summary>" +
        p.history
          .slice()
          .reverse()
          .map(
            (h) =>
              '<div class="related-stage"><strong>' +
              e(fmt(h.updatedAt)) +
              " · " +
              e(h.versionLabel || "Sin etiqueta de versión") +
              "</strong><dl>" +
              detail("Estado", C.ROUTE_STATES[h.status]) +
              detail("Referencia de avance", h.evidence) +
              detail(
                "Plan",
                "Semestre " + h.planSemester + " · " + fmt(h.due),
              ) +
              detail("Motivo del ajuste", h.adjustmentReason) +
              detail("Revisión", C.REVIEWS[h.reviewState]) +
              detail("Persona que revisó", h.reviewBy) +
              detail(
                "Fecha de revisión",
                h.reviewDate ? fmt(h.reviewDate) : "",
              ) +
              detail("Nota privada · solo para ti", h.privateNotes) +
              "</dl></div>",
          )
          .join("") +
        "</details>"
      : "") +
    "</article>"
  );
}
function renderRoute() {
  let h = head(
    "Mi ruta de tesis",
    '<div class="toolbar">' +
      btn("Elegir y adaptar ruta", "route-setup", "", "primary") +
      btn("Nivel y semestre", "level", "", "compact") +
      "</div>",
  );
  if (!state.project.level)
    return (
      h +
      '<section class="card">' +
      empty(
        "Elige maestría o doctorado",
        "Registra tu nivel y el semestre que cursas para ubicarte en la ruta.",
        btn("Configurar mi ruta", "route-setup", "", "primary"),
      ) +
      "</section>"
    );
  const level = routeLevel || state.project.level,
    stages = C.routeStages(state, level),
    current = Number(state.project.semester),
    selected =
      Number(routeSemester || (level === state.project.level ? current : 1)) ||
      1,
    stage = stages.find((x) => x.semester === selected);
  const products = C.routeMilestones(state).filter((m) => m.level === level),
    inStage = products.filter((m) => {
      const p = state.routeProgress.find((x) => x.id === m.id);
      return Number(p?.planSemester || m.semester) === selected;
    });
  h += routeOriginCard(level);
  h +=
    '<div class="filter-row"><p class="small">Mi nivel: <strong>' +
    e(C.LEVELS[state.project.level]) +
    "</strong> · Cursando semestre <strong>" +
    e(state.project.semester || "por definir") +
    '</strong></p><label>Consultar ruta <select id="route-level">' +
    Object.entries(C.LEVELS)
      .map(
        ([v, t]) =>
          '<option value="' +
          v +
          '"' +
          (v === level ? " selected" : "") +
          ">" +
          t +
          "</option>",
      )
      .join("") +
    '</select></label></div><nav class="semester-rail" aria-label="Semestres de la ruta">' +
    stages
      .map(
        (s) =>
          '<button class="semester-stop' +
          (selected === s.semester ? " selected" : "") +
          '" data-do="route-stage" data-semester="' +
          s.semester +
          '"' +
          (selected === s.semester ? ' aria-current="step"' : "") +
          "><span>Semestre " +
          s.semester +
          "</span><small>" +
          e(s.title) +
          "</small>" +
          (s.semester === current && level === state.project.level
            ? "<em>Semestre actual</em>"
            : "") +
          "</button>",
      )
      .join("") +
    [
      ...new Set([
        ...(level === state.project.level ? [current] : []),
        ...products.map((m) => m.semester),
        ...state.routeProgress
          .filter((p) => C.milestone(p.id, state).level === level)
          .map((p) => Number(p.planSemester)),
      ]),
    ]
      .filter((n) => n > stages.length)
      .sort((a, b) => a - b)
      .map(
        (n) =>
          '<button class="semester-stop' +
          (selected === n ? " selected" : "") +
          '" data-do="route-stage" data-semester="' +
          n +
          '"' +
          (selected === n ? ' aria-current="step"' : "") +
          "><span>Semestre " +
          n +
          "</span><small>Continuidad de mi plan</small>" +
          (n === current && level === state.project.level
            ? "<em>Semestre actual</em>"
            : "") +
          "</button>",
      )
      .join("") +
    "</nav>";
  h +=
    '<section class="route-heading"><span class="eyebrow">Semestre ' +
    selected +
    "</span><h2>" +
    e(stage?.title || "Continuidad de tu plan") +
    "</h2>" +
    (stage?.spaces ? "<p>" + e(stage.spaces) + "</p>" : "") +
    (stage?.note ? '<p class="hint">' + e(stage.note) + "</p>" : "") +
    '<div class="toolbar">' +
    btn("Adaptar semestre", "route-semester", "", "ghost compact") +
    btn("Añadir entregable", "route-product", "", "compact primary") +
    "</div></section>";
  h += '<div class="record-grid">' + inStage.map(routeCard).join("") + "</div>";
  const pending = products.filter((m) => {
    const p = state.routeProgress.find((x) => x.id === m.id);
    return (
      !inStage.includes(m) &&
      Number(p?.planSemester || m.semester) < selected &&
      p?.status !== "resuelto"
    );
  });
  if (!inStage.length)
    h +=
      '<section class="card">' +
      empty(
        "Sin productos programados aquí",
        "Añade un entregable de tu programa o retoma uno de los semestres anteriores.",
        btn("Añadir entregable", "route-product", "", "primary"),
      ) +
      "</section>";
  if (pending.length)
    h +=
      '<details class="route-carry"><summary>Por retomar de otros semestres · ' +
      pending.length +
      ' productos</summary><p class="hint">Sin un registro de realización, estos productos siguen disponibles. No es una evaluación de retraso.</p><div class="record-grid">' +
      pending.map(routeCard).join("") +
      "</div></details>";
  const retired = C.routeMilestones(state, true).filter(
    (m) =>
      m.level === level &&
      m.archived &&
      (state.routePlan.products.some((p) => p.id === m.id) ||
        state.routeProgress.some((p) => p.id === m.id)),
  );
  if (retired.length)
    h +=
      '<details class="route-carry"><summary>Entregables retirados · ' +
      retired.length +
      "</summary>" +
      retired
        .map(
          (m) =>
            '<div class="related-stage"><strong>' +
            e(m.title) +
            '</strong><div class="toolbar">' +
            btn(
              "Volver a incluir",
              "route-unarchive",
              'data-id="' + e(m.id) + '"',
              "compact",
            ) +
            (state.routeProgress.some((p) => p.id === m.id)
              ? btn(
                  "Ver avances e historial",
                  "route-progress",
                  'data-id="' + e(m.id) + '"',
                  "ghost compact",
                )
              : "") +
            "</div></div>",
        )
        .join("") +
      "</details>";
  h +=
    '<p class="hint route-footnote">Registra decisiones metodológicas, versiones y revisiones de avance. Conserva las entrevistas, transcripciones y bases de datos fuera de Compás.</p>';
  return h;
}
function routeForm(id) {
  const m = C.milestone(id, state);
  if (!m) return;
  const p =
    state.routeProgress.find((x) => x.id === id) || C.routeDefault(id, state);
  const b =
    formSection(
      "Entregable de mi ruta",
      C.LEVELS[m.level] + " · Semestre " + m.semester + " · " + m.expected,
    ) +
    field("status", "Estado del producto", p.status, {
      options: Object.entries(C.ROUTE_STATES),
    }) +
    field("versionLabel", "Versión o corte del producto", p.versionLabel, {
      hint: "Ejemplo: capítulo metodológico, versión 3.",
    }) +
    field("evidence", "Referencia del avance realizado", p.evidence, {
      textarea: true,
      wide: true,
      hint: "Describe el resultado o el apartado revisado. No pegues datos de investigación.",
    }) +
    formSection(
      "Mi plan",
      "Modificar fechas o semestre conserva el registro anterior y requiere explicar el ajuste.",
    ) +
    field("planSemester", "Semestre en mi plan", p.planSemester, {
      type: "number",
      min: 1,
      max: 99,
      required: true,
    }) +
    field("due", "Fecha planeada", p.due, { type: "date" }) +
    field(
      "adjustmentReason",
      "Motivo académico o de viabilidad del ajuste",
      p.adjustmentReason,
      {
        textarea: true,
        wide: true,
        hint: "Este campo puede compartirse al seleccionar el producto en un reporte.",
      },
    ) +
    formSection(
      "Revisión y aprobación",
      "Registra lo comunicado por tu dirección. Compás no verifica firmas ni otorga aprobaciones.",
    ) +
    field("reviewState", "Situación de la revisión", p.reviewState, {
      options: Object.entries(C.REVIEWS),
    }) +
    field("reviewDate", "Fecha de revisión o aprobación", p.reviewDate, {
      type: "date",
      max: C.today(),
    }) +
    field("reviewBy", "Persona que revisó o aprobó", p.reviewBy, {
      wide: true,
      hint: "Necesaria al registrar revisión o aprobación.",
    }) +
    formSection(
      "Espacio privado",
      "Esta nota y el historial completo permanecen en el respaldo personal. Los reportes incluyen solo el corte seleccionado.",
    ) +
    field("privateNotes", "Nota para ti", p.privateNotes, {
      textarea: true,
      wide: true,
    });
  openForm(
    m.title,
    "Cada actualización conserva la versión anterior. Completar ToDo no modifica este registro.",
    b,
    (f) => {
      const next = C.saveRoute(state, id, f);
      if (!mutate((s) => Object.assign(s, next)))
        throw new Error("No se pudo guardar el avance.");
    },
  );
}
function routeOriginCard(level) {
  const origin = C.routeProvenance(state, level);
  if (!origin) return "";
  return (
    '<section class="route-origin"><strong>' +
    e(origin.label) +
    '</strong><p class="small">' +
    e(origin.template) +
    "</p><details><summary>Ver origen" +
    (origin.adaptations.length ? " y ajustes" : "") +
    '</summary><p class="hint">' +
    e(origin.version) +
    " · " +
    e(origin.source) +
    "</p>" +
    (origin.adaptations.length
      ? '<ul class="small">' +
        origin.adaptations.map((x) => "<li>" + e(x) + "</li>").join("") +
        "</ul>"
      : "") +
    "</details></section>"
  );
}
function routeSetupForm() {
  const level = routeLevel || state.project.level || "maestria";
  const template = C.routeProvenance(state, level);
  const body =
    field(
      "templateId",
      "Ruta de partida",
      template?.templateId || "csp-" + level,
      {
        options: C.ROUTE_TEMPLATES.map((t) => [
          t.id,
          t.title +
            (t.status === "official"
              ? " · oficial"
              : t.status === "draft"
                ? " · borrador"
                : t.status === "synthetic"
                  ? " · orientativa, no oficial"
                  : ""),
        ]),
        wide: true,
      },
    ) +
    field("program", "Mi programa o posgrado", state.project.program, {
      wide: true,
    }) +
    field(
      "department",
      "Carrera o departamento (opcional)",
      state.routePlan.department,
      { wide: true },
    ) +
    field(
      "semesters",
      "Semestres previstos",
      state.routePlan.durations[level],
      {
        type: "number",
        min: 1,
        max: 99,
        required: true,
        hint: "Puedes adaptar la duración a tu programa.",
      },
    );
  openForm(
    "Elegir y adaptar mi ruta",
    "Las plantillas identifican su origen. Cambiar de plantilla conserva tus avances y vínculos; los entregables anteriores quedan disponibles para retomarlos.",
    body,
    (f) => {
      const next = C.applyRouteTemplate(state, f.templateId, f);
      if (!mutate((s) => Object.assign(s, next)))
        throw new Error("No se pudo guardar tu ruta.");
      routeLevel = next.project.level;
      routeSemester = "1";
      render();
    },
  );
  const select = $("editor").querySelector('[name="templateId"]');
  let suggestedProgram = state.project.program;
  select.addEventListener("change", () => {
    const t = C.ROUTE_TEMPLATES.find((t) => t.id === select.value);
    const program = $("editor").querySelector('[name="program"]');
    if (program.value === suggestedProgram) {
      program.value = t.program || program.value;
      suggestedProgram = program.value;
    }
    $("editor").querySelector('[name="semesters"]').value =
      t.stages.length || (t.level === "maestria" ? 4 : 8);
  });
}
function routeProductForm(id = "") {
  const m = id ? C.milestone(id, state) : null;
  const level = m?.level || routeLevel || state.project.level;
  if (!level) return routeSetupForm();
  const p = state.routeProgress.find((p) => p.id === id);
  const body =
    field("title", "Nombre del entregable", m?.title || "", {
      required: true,
      wide: true,
      hint: "Ejemplo: revisión bibliográfica, prototipo, obra, artículo o capítulo.",
    }) +
    field("expected", "Qué se espera entregar (opcional)", m?.expected || "", {
      textarea: true,
      wide: true,
    }) +
    field(
      "semester",
      "Semestre previsto",
      p?.planSemester ||
        m?.semester ||
        routeSemester ||
        state.project.semester ||
        "1",
      { type: "number", min: 1, max: 99, required: true },
    );
  openForm(
    id ? "Adaptar entregable" : "Añadir entregable",
    "Ajusta el nombre y lo que necesitas entregar en tu posgrado. Tus avances, notas y tareas vinculadas se conservan.",
    body,
    (f) => {
      const next = C.saveRouteProduct(state, id, { ...f, level });
      if (!mutate((s) => Object.assign(s, next)))
        throw new Error("No se pudo guardar el entregable.");
    },
  );
}
function routeStageForm() {
  const level = routeLevel || state.project.level;
  const semester = Number(routeSemester || state.project.semester) || 1;
  const stage = C.routeStages(state, level)?.find(
    (s) => s.semester === semester,
  ) || { title: "Mi semestre " + semester, spaces: "", note: "" };
  const body =
    field("title", "Nombre de esta etapa", stage.title, {
      required: true,
      wide: true,
    }) +
    field(
      "spaces",
      "Materias, seminarios o espacios (opcional)",
      stage.spaces,
      { wide: true },
    ) +
    field("note", "Indicaciones para este semestre (opcional)", stage.note, {
      textarea: true,
      wide: true,
    });
  openForm(
    "Adaptar semestre " + semester,
    "Usa los nombres e indicaciones de tu programa.",
    body,
    (f) => {
      const next = C.saveRouteStage(state, level, semester, f);
      if (!mutate((s) => Object.assign(s, next)))
        throw new Error("No se pudo guardar el semestre.");
    },
  );
}
function routeArchive(id, archived) {
  const next = C.archiveRouteProduct(state, id, archived);
  if (!mutate((s) => Object.assign(s, next)))
    throw new Error("No se pudo guardar el cambio.");
  toast(
    archived
      ? "Entregable retirado del plan. Sus registros siguen disponibles."
      : "Entregable recuperado en tu plan.",
  );
}
