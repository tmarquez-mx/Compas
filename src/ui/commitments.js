function actionForm(id, sourceId, milestoneId) {
  const src = state.sessions.find((s) => s.id === sourceId);
  const x = state.actions.find((a) => a.id === id) || {
    id: C.uid(),
    milestoneId: milestoneId || "",
    sourceType: src ? src.type : "personal",
    sourceId: src ? src.id : "",
    sourceLabel: src ? src.title : "Registro personal",
    date: C.today(),
    updatedAt: C.today(),
    commenter: "",
    category: "Metodológico",
    comment: "",
    disposition: "incorporar",
    rationale: "",
    description: "",
    owner: "Tesista",
    due: "",
    priority: "media",
    status: "pendiente",
    evidence: "",
    response: "",
    privateNotes: "",
  };
  const categories = [
    "Teórico-conceptual",
    "Metodológico",
    "Análisis de datos",
    "Estructura / argumentación",
    "Redacción / estilo",
    "Fuentes / bibliografía",
    "Ética / trabajo de campo",
    "Alcance / viabilidad",
    "Otro",
  ];
  const b =
    field("description", "Acción / compromiso concreto", x.description, {
      wide: true,
      required: true,
    }) +
    field("owner", "Responsable", x.owner, { required: true }) +
    field("due", "Fecha compromiso", x.due, { type: "date" }) +
    '<details class="form-extra"' +
    (id ? " open" : "") +
    '><summary>Comentario, vínculos y seguimiento académico</summary><div class="form-grid">' +
    field("sourceId", "Origen", x.sourceId, {
      wide: true,
      options: [
        ["", "Registro personal"],
        ...state.sessions.map((s) => [
          s.id,
          (s.type === "coloquio" ? "Coloquio" : "Asesoría de tesis") +
            " · " +
            s.title +
            " · " +
            fmt(s.date),
        ]),
      ],
    }) +
    field("milestoneId", "Producto de mi ruta (opcional)", x.milestoneId, {
      wide: true,
      options: milestoneOptions(x.milestoneId),
    }) +
    field("date", "Fecha del registro", x.date, {
      type: "date",
      required: true,
    }) +
    field("commenter", "Fuente del comentario", x.commenter) +
    field("category", "Tipo de comentario", x.category, {
      options: categories.map((c) => [c, c]),
    }) +
    field("disposition", "Decisión sobre el comentario", x.disposition, {
      options: Object.entries(C.DISPOSITIONS),
    }) +
    field("comment", "Comentario recibido", x.comment, {
      textarea: true,
      wide: true,
    }) +
    field("rationale", "Justificación o alternativa propuesta", x.rationale, {
      textarea: true,
      wide: true,
      hint: "Necesaria si decides incorporar parcialmente o no incorporar el comentario.",
    }) +
    field("priority", "Prioridad", x.priority, {
      options: [
        ["alta", "Alta"],
        ["media", "Media"],
        ["baja", "Baja"],
      ],
    }) +
    field("status", "Estado de atención", x.status, {
      options: Object.entries(C.STATES),
    }) +
    field("evidence", "Evidencia o referencia de avance", x.evidence, {
      textarea: true,
      wide: true,
      hint: "Por ejemplo: capítulo 2, apartado 2.1, versión y fecha. No cargues datos, entrevistas ni archivos sensibles.",
    }) +
    field(
      "response",
      "Respuesta para el próximo coloquio o revisión",
      x.response,
      { textarea: true, wide: true },
    ) +
    formSection("Nota privada", "Este campo queda fuera de los reportes.") +
    field("privateNotes", "Notas para ti", x.privateNotes, {
      textarea: true,
      wide: true,
    }) +
    "</div></details>";
  openForm(
    id ? "Revisar compromiso" : "Nuevo compromiso",
    "Un compromiso puede surgir de un coloquio, una asesoría de tesis o una decisión propia.",
    b,
    (f) => {
      if (
        ["parcial", "justificar"].includes(f.disposition) &&
        !f.rationale.trim()
      )
        throw new Error(
          "Explica la justificación académica o la alternativa propuesta.",
        );
      if (f.status === "resuelto" && !f.evidence.trim() && !f.response.trim())
        throw new Error(
          "Para marcarlo como resuelto, registra una evidencia de avance o una respuesta de cierre.",
        );
      const origin = state.sessions.find((s) => s.id === f.sourceId);
      upsert("actions", {
        ...x,
        ...f,
        sourceType: origin ? origin.type : "personal",
        sourceLabel: origin ? origin.title : "Registro personal",
        updatedAt: C.today(),
      });
    },
    id ? () => remove("actions", id) : null,
    "¿Eliminar este compromiso? Las tareas ToDo y actividades de dedicación se conservarán sin este vínculo.",
  );
}
function decisionForm(id, previousId) {
  const prev = state.decisions.find((d) => d.id === previousId);
  const x = state.decisions.find((d) => d.id === id) || {
    id: C.uid(),
    date: C.today(),
    title: "",
    previous: prev ? prev.current : "",
    current: "",
    reason: "",
    alternatives: "",
    impact: "",
    reviewDate: "",
    questionCheck: "",
    basisCheck: "",
    feasibilityCheck: "",
    ethicsCheck: "",
    supersedes: prev ? prev.id : "",
    milestoneId: prev?.milestoneId || "",
    privateNotes: "",
  };
  const b =
    field("title", "Decisión o cambio de rumbo", x.title, {
      wide: true,
      required: true,
    }) +
    field("current", "Qué decides ahora", x.current, {
      textarea: true,
      wide: true,
      required: true,
    }) +
    field("reason", "Por qué tomas esta decisión", x.reason, {
      textarea: true,
      wide: true,
      required: true,
    }) +
    '<details class="form-extra"' +
    (id ? " open" : "") +
    '><summary>Fechas, alternativas y brújula de la decisión</summary><div class="form-grid">' +
    field("date", "Fecha", x.date, { type: "date", required: true }) +
    field("reviewDate", "Cuándo revisarla", x.reviewDate, { type: "date" }) +
    field("milestoneId", "Producto de mi ruta (opcional)", x.milestoneId, {
      wide: true,
      options: milestoneOptions(x.milestoneId),
    }) +
    field("previous", "Planteamiento previo", x.previous, {
      textarea: true,
      wide: true,
    }) +
    field("alternatives", "Alternativas consideradas", x.alternatives, {
      textarea: true,
      wide: true,
    }) +
    field("impact", "Qué cambia en la tesis", x.impact, {
      textarea: true,
      wide: true,
      hint: "Pregunta, objetivos, conceptos, casos, análisis, escritura o calendario.",
    }) +
    formSection(
      "Brújula de la decisión",
      "Puedes profundizar después. Compás no califica ni decide por ti.",
    ) +
    field(
      "questionCheck",
      "¿Cómo contribuye a responder tu pregunta?",
      x.questionCheck,
      { textarea: true, wide: true },
    ) +
    field(
      "basisCheck",
      "¿Qué fundamento teórico o metodológico la sostiene?",
      x.basisCheck,
      { textarea: true, wide: true },
    ) +
    field(
      "feasibilityCheck",
      "¿Es viable con tu tiempo y condiciones de acceso?",
      x.feasibilityCheck,
      { textarea: true, wide: true },
    ) +
    field(
      "ethicsCheck",
      "¿Qué implicaciones éticas necesitas revisar?",
      x.ethicsCheck,
      { textarea: true, wide: true },
    ) +
    field("privateNotes", "Nota privada", x.privateNotes, {
      textarea: true,
      wide: true,
      hint: "Esta nota queda fuera de los reportes compartidos.",
    }) +
    "</div></details>";
  openForm(
    prev
      ? "Registrar un cambio posterior"
      : id
        ? "Revisar decisión"
        : "Nueva decisión",
    prev
      ? "La decisión anterior se conserva en el historial."
      : "Para documentar una nueva etapa, usa “Registrar cambio posterior” y conserva la decisión previa.",
    b,
    (f) => {
      if (f.reviewDate && f.reviewDate < f.date)
        throw new Error(
          "La revisión debe ser posterior o igual a la fecha de decisión.",
        );
      upsert("decisions", { ...x, ...f });
    },
    id && !state.decisions.some((d) => d.supersedes === id)
      ? () => remove("decisions", id)
      : null,
  );
}
