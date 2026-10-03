function milestoneOptions(selected) {
  const level = state.project.level;
  return [
    ["", "Sin vínculo"],
    ...C.MILESTONES.filter((m) => m.level === level || m.id === selected).map(
      (m) => [m.id, C.LEVELS[m.level] + " · S" + m.semester + " · " + m.title],
    ),
  ];
}

function routeStatus(p) {
  return p ? C.ROUTE_STATES[p.status] : "Sin registro";
}
function routeCard(m) {
  const p = state.routeProgress.find((x) => x.id === m.id),
    value = p || C.routeDefault(m.id),
    acts = state.actions.filter((a) => a.milestoneId === m.id),
    decs = state.decisions.filter((d) => d.milestoneId === m.id);
  const related = C.MILESTONES.filter(
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
    btn("Nivel y semestre", "level", "", "primary"),
  );
  if (!state.project.level)
    return (
      h +
      '<section class="card">' +
      empty(
        "Elige maestría o doctorado",
        "Registra tu nivel y el semestre que cursas para ubicarte en la ruta.",
        btn("Configurar mi ruta", "level", "", "primary"),
      ) +
      "</section>"
    );
  const level = routeLevel || state.project.level,
    stages = C.ROUTES[level],
    current = Number(state.project.semester),
    selected =
      Number(routeSemester || (level === state.project.level ? current : 1)) ||
      1,
    stage = stages.find((x) => x.semester === selected);
  const products = C.MILESTONES.filter((m) => m.level === level),
    inStage = products.filter((m) => {
      const p = state.routeProgress.find((x) => x.id === m.id);
      return m.semester === selected || Number(p?.planSemester) === selected;
    });
  h +=
    '<p class="module-note">Ruta de referencia en borrador. Puedes adaptar el plan; las revisiones son registros personales.</p>';
  h +=
    '<div class="filter-row"><p class="small">Mi nivel: <strong>' +
    e(C.LEVELS[state.project.level]) +
    "</strong> · Cursando semestre <strong>" +
    e(state.project.semester) +
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
        ...state.routeProgress
          .filter((p) => C.milestone(p.id).level === level)
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
    "</h2><p>" +
    e(
      stage?.spaces ||
        "El borrador termina en el semestre " +
          stages.length +
          ". Puedes seguir registrando y reprogramando productos.",
    ) +
    "</p>" +
    (stage ? '<p class="hint">' + e(stage.note) + "</p>" : "") +
    "</section>";
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
        "Retoma un producto de los semestres anteriores y ajusta su semestre en tu plan.",
      ) +
      "</section>";
  if (pending.length)
    h +=
      '<details class="route-carry"><summary>Por retomar de otros semestres · ' +
      pending.length +
      ' productos</summary><p class="hint">Sin un registro de realización, estos productos siguen disponibles. No es una evaluación de retraso.</p><div class="record-grid">' +
      pending.map(routeCard).join("") +
      "</div></details>";
  h +=
    '<p class="hint route-footnote">Registra decisiones metodológicas, versiones y revisiones de avance. Conserva las entrevistas, transcripciones y bases de datos fuera de Compás. “BS” se mantiene como aparece en el borrador.</p>';
  return h;
}
function routeForm(id) {
  const m = C.milestone(id);
  if (!m) return;
  const p = state.routeProgress.find((x) => x.id === id) || C.routeDefault(id);
  const b =
    formSection(
      "Referencia del borrador",
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
