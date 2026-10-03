function renderSessions(type) {
  const collo = type === "coloquio",
    sessions = state.sessions
      .filter((s) => s.type === type)
      .sort((a, b) => b.date.localeCompare(a.date));
  let h = head(
    collo ? "Del comentario a la decisión" : "Conversaciones con continuidad",
    btn(
      collo ? "Registrar coloquio" : "Nueva reunión",
      "session",
      'data-type="' + type + '"',
      "primary",
    ),
  );
  h +=
    '<div class="record-grid">' +
    (sessions
      .map((s) => {
        const acts = state.actions.filter((a) => a.sourceId === s.id);
        const detail = (l, v) =>
          v ? "<dt>" + e(l) + "</dt><dd>" + e(v) + "</dd>" : "";
        return (
          '<article class="card session-card"><div class="card-head"><span class="session-date">' +
          e(fmt(s.date)) +
          '</span><span class="badge">' +
          (s.reviewed === "revisado"
            ? "Revisión registrada"
            : "Por revisar con dirección") +
          "</span></div><h3>" +
          e(s.title) +
          '</h3><p class="small pre">' +
          e(
            s.summary ||
              s.agenda ||
              "Agrega la agenda y los acuerdos de esta sesión.",
          ) +
          '</p><div class="row-meta"><span>' +
          acts.length +
          " compromisos vinculados</span><span>Próxima: " +
          e(fmt(s.nextDate)) +
          '</span></div><details class="details"><summary>Ver agenda y avances</summary><dl>' +
          detail("Participantes", s.participants) +
          detail("Avance presentado", s.presented) +
          detail("Agenda / preguntas para conversar", s.agenda) +
          detail("Avances desde la sesión anterior", s.advances) +
          (s.privateNotes
            ? "<dt>Notas privadas · solo en tu bitácora</dt><dd>" +
              e(s.privateNotes) +
              "</dd>"
            : "") +
          '</dl></details><div class="session-foot">' +
          btn(
            "Editar sesión",
            "session",
            'data-id="' + e(s.id) + '" data-type="' + type + '"',
            "compact",
          ) +
          btn(
            "Añadir compromiso",
            "action",
            'data-source="' + e(s.id) + '"',
            "compact",
          ) +
          "</div></article>"
        );
      })
      .join("") ||
      '<section class="card">' +
        empty(
          collo ? "Tu primer coloquio" : "Tu primera reunión",
          collo
            ? "Registra qué presentaste y qué comentarios recibiste."
            : "Empieza por una agenda breve y las decisiones que necesitas conversar.",
        ) +
        "</section>") +
    "</div>";
  h += actionSection(
    state.actions.filter((a) => a.sourceType === type),
    collo ? "Seguimiento de comentarios" : "Compromisos de asesoría de tesis",
  );
  if (collo) {
    const disagreements = state.actions.filter(
      (a) =>
        a.sourceType === type &&
        ["parcial", "justificar"].includes(a.disposition),
    );
    h +=
      '<div class="section-title"><h2>Comentarios con respuesta parcial o desacuerdo</h2></div><section class="card">' +
      (disagreements
        .map(
          (a) =>
            '<article class="decision-item"><h3>' +
            e(a.comment || a.description) +
            '</h3><p class="pre">' +
            e(a.rationale) +
            "</p>" +
            btn(
              "Revisar justificación",
              "action",
              'data-id="' + e(a.id) + '"',
              "compact",
            ) +
            "</article>",
        )
        .join("") ||
        '<p class="muted small">Las justificaciones de comentarios no incorporados o atendidos parcialmente aparecerán aquí.</p>') +
      "</section>";
  }
  return h;
}

function sessionForm(id, type) {
  const x = state.sessions.find((s) => s.id === id) || {
      id: C.uid(),
      type: type || "supervision",
      date: C.today(),
      title: "",
      participants: "",
      presented: "",
      agenda: "",
      advances: "",
      summary: "",
      reviewed: "registrado",
      nextDate: "",
      presentsAgain: "por-definir",
      privateNotes: "",
    },
    collo = x.type === "coloquio";
  let b =
    field("title", "Nombre de la sesión", x.title, {
      wide: true,
      required: true,
    }) +
    field("date", "Fecha", x.date, { type: "date", required: true }) +
    field("agenda", "Agenda y decisiones que necesitas conversar", x.agenda, {
      textarea: true,
      wide: true,
    }) +
    '<details class="form-extra"' +
    (id ? " open" : "") +
    '><summary>Avances, acuerdos y próxima reunión</summary><div class="form-grid">' +
    field("participants", "Participantes / comentaristas", x.participants) +
    field("presented", "Avance presentado", x.presented, {
      wide: true,
      hint: "Indica capítulo, apartado o versión; no adjuntes datos de investigación.",
    }) +
    field("advances", "Avances desde la sesión anterior", x.advances, {
      textarea: true,
      wide: true,
    }) +
    field("summary", "Síntesis y acuerdos de la sesión", x.summary, {
      textarea: true,
      wide: true,
      hint: "Después puedes crear compromisos con responsable y plazo, vinculados a esta sesión.",
    }) +
    field("reviewed", "Revisión de la minuta", x.reviewed, {
      options: [
        ["registrado", "Registrada por el tesista"],
        ["revisado", "Revisada con la dirección"],
      ],
      hint: "Es un registro del tesista. No constituye firma ni VoBo verificado.",
    }) +
    field(
      "nextDate",
      collo ? "Próximo coloquio o revisión" : "Próxima reunión",
      x.nextDate,
      { type: "date" },
    );
  if (collo)
    b += field(
      "presentsAgain",
      "¿Corresponde presentar de nuevo?",
      x.presentsAgain,
      {
        options: [
          ["por-definir", "Por definir"],
          ["si", "Sí"],
          ["no", "No"],
        ],
      },
    );
  b +=
    '</div></details><details class="form-extra"><summary>Una reflexión privada para ti</summary><div class="form-grid">' +
    field("privateNotes", "Notas para ti", x.privateNotes, {
      textarea: true,
      wide: true,
      hint: "Permanece en tu bitácora. No se incorpora a los reportes.",
    }) +
    "</div></details>";
  openForm(
    collo ? "Registro de coloquio" : "Reunión de asesoría de tesis",
    "Registra el proceso académico sin incluir transcripciones ni información de participantes de la investigación.",
    b,
    (f) => {
      if (f.nextDate && f.nextDate < f.date)
        throw new Error(
          "La próxima sesión debe tener una fecha igual o posterior a esta reunión.",
        );
      upsert("sessions", { ...x, ...f });
    },
    id ? () => remove("sessions", id) : null,
    "¿Eliminar esta sesión y sus notas privadas? Sus compromisos se conservarán.",
  );
}
