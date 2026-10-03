function renderBrujula() {
  const p = state.project,
    tasks = state.todos
      .filter((t) => !t.done)
      .sort(todoSort)
      .slice(0, 3),
    stages = C.ROUTES[p.level],
    current = Number(p.semester),
    nextSession = state.sessions
      .filter((s) => s.nextDate && s.nextDate >= C.today())
      .sort((a, b) => a.nextDate.localeCompare(b.nextDate))[0],
    decisions = state.decisions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date)),
    recent = decisions[0];
  let h =
    '<section class="home-intro"><div class="home-title-row"><h1>' +
    e(p.title || "Un punto de partida para tu tesis") +
    "</h1>" +
    btn(
      p.title ? "Editar rumbo" : "Empezar mi proyecto",
      "project",
      "",
      "compact",
    ) +
    "</div>" +
    (p.question ? '<p class="home-question">' + e(p.question) + "</p>" : "") +
    "</section>";
  h +=
    '<div class="journal-shortcut">' +
    btn("Escribir en mi diario", "reflection", "", "ghost compact") +
    "</div>";
  h +=
    '<div class="home-layout"><section class="focus-panel"><div class="card-head"><h2>Para hoy</h2><span class="focus-count">' +
    (tasks.length
      ? tasks.length +
        (tasks.length === 1 ? " paso posible" : " pasos posibles")
      : "Tu siguiente paso") +
    "</span></div>" +
    (tasks.length
      ? tasks
          .map((t) => {
            const a = state.actions.find((x) => x.id === t.actionId),
              m = C.milestone(t.milestoneId);
            return (
              '<div class="focus-task"><input id="focus-' +
              e(t.id) +
              '" type="checkbox" data-todo-check="' +
              e(t.id) +
              '" aria-label="Completar: ' +
              e(t.title) +
              '"><div><label for="focus-' +
              e(t.id) +
              '">' +
              e(t.title) +
              '</label><p class="hint">' +
              e(
                a
                  ? "Compromiso: " + a.description
                  : m
                    ? m.title
                    : "Tarea personal",
              ) +
              "</p></div><time>" +
              e(t.due ? fmt(t.due) : "Sin fecha") +
              "</time></div>"
            );
          })
          .join("")
      : empty(
          "Puedes empezar con algo pequeño",
          "Anota una acción concreta: leer un apartado, revisar un párrafo o preparar una pregunta.",
        )) +
    '<div class="focus-foot"><p class="hint">Tus tareas son privadas. Completar una no cierra compromisos ni productos.</p>' +
    btn("Añadir un paso", "todo-edit", "", "primary") +
    '</div><button class="button ghost compact" data-view="todo" style="margin-top:12px">Ver todas mis tareas</button></section><aside class="home-route"><h2>' +
    e(
      stages
        ? C.LEVELS[p.level] + " · semestre " + (p.semester || "por definir")
        : "Ubica tu punto de partida",
    ) +
    '</h2><p class="hint">Ruta de referencia; puedes adaptar el plan.</p>' +
    (stages
      ? '<ol class="route-trail">' +
        stages
          .map(
            (s) =>
              '<li class="' +
              (s.semester === current ? "current" : "") +
              '"><small>Semestre ' +
              s.semester +
              (s.semester === current ? " · Ahora" : "") +
              "</small><strong>" +
              e(s.title) +
              "</strong></li>",
          )
          .join("") +
        (current > stages.length
          ? '<li class="current"><small>Semestre ' +
            current +
            " · Ahora</small><strong>Continuidad de tu plan</strong></li>"
          : "") +
        '</ol><button class="button ghost compact" data-view="ruta">Ver mi ruta completa →</button>'
      : btn("Nivel y semestre", "level", "", "compact")) +
    '<div class="home-hito"><span class="eyebrow">Próximo hito</span><p>' +
    e(
      p.milestone || "Define un resultado que puedas revisar con tu dirección.",
    ) +
    '</p><span class="hint">' +
    e(
      p.milestoneDate ? fmt(p.milestoneDate) : "Puedes fijar una fecha después",
    ) +
    "</span></div></aside></div>";
  h +=
    '<details class="home-followup"><summary>Conversaciones y decisiones</summary><div class="home-lower"><section><h2>Próxima conversación</h2>' +
    (nextSession
      ? '<span class="session-date">' +
        e(fmt(nextSession.nextDate)) +
        '</span><h3 style="margin-top:8px">' +
        e(nextSession.title) +
        '</h3><p class="hint pre">' +
        e(
          nextSession.summary ||
            "Retoma los acuerdos de tu última reunión para preparar la siguiente conversación.",
        ) +
        "</p>" +
        btn(
          "Retomar acuerdos",
          "session",
          'data-id="' + e(nextSession.id) + '"',
          "ghost compact",
        )
      : empty(
          "Una pregunta para conversar",
          "Agenda una reunión o registra la conversación que ya tuviste.",
          btn(
            "Preparar reunión",
            "session",
            'data-type="supervision"',
            "ghost compact",
          ),
        )) +
    "</section><section><h2>Un cambio reciente</h2>" +
    (recent
      ? '<span class="hint">' +
        e(fmt(recent.date)) +
        '</span><h3 style="margin-top:8px">' +
        e(recent.title) +
        '</h3><p class="hint pre">' +
        e(recent.current) +
        "</p>" +
        btn(
          "Retomar decisión",
          "decision",
          'data-id="' + e(recent.id) + '"',
          "ghost compact",
        )
      : empty(
          "Las decisiones también son avances",
          "Conserva qué decidiste y por qué. Puedes profundizar después.",
        )) +
    btn("Registrar una decisión", "decision", "", "ghost compact") +
    "</section></div></details>";
  h +=
    '<details class="home-archive"><summary>Decisiones y cambios de rumbo <span>' +
    decisions.length +
    (decisions.length === 1 ? " registro" : " registros") +
    "</span></summary>" +
    decisions
      .map(
        (d) =>
          '<article class="decision-item"><div class="card-head"><div><div class="row-meta">' +
          e(fmt(d.date)) +
          (d.supersedes ? " · Actualiza una decisión anterior" : "") +
          "</div><h3>" +
          e(d.title) +
          "</h3></div>" +
          btn("Revisar", "decision", 'data-id="' + e(d.id) + '"', "compact") +
          '</div><p class="pre">' +
          e(d.current) +
          '</p><div class="row-meta"><span>Revisar: ' +
          e(fmt(d.reviewDate)) +
          "</span>" +
          btn(
            "Registrar cambio posterior",
            "evolve",
            'data-id="' + e(d.id) + '"',
            "ghost compact",
          ) +
          "</div></article>",
      )
      .join("") +
    "</details>";
  h +=
    '<details class="home-archive"><summary>Acuerdos y compromisos <span>' +
    state.actions.filter((a) => a.status !== "resuelto").length +
    " por retomar</span></summary>" +
    btn("Nuevo compromiso", "action", "", "compact") +
    actionSection(state.actions, "Mis compromisos") +
    "</details>";
  return h;
}

function levelForm() {
  const p = state.project;
  openForm(
    "Nivel y semestre",
    "Ubica tu punto de partida. Puedes volver a ajustarlo después.",
    field("level", "Nivel", p.level, {
      required: true,
      options: [["", "Selecciona tu nivel"], ...Object.entries(C.LEVELS)],
    }) +
      field(
        "semester",
        "Semestre actual",
        /^[1-9][0-9]?$/.test(p.semester) ? p.semester : "",
        {
          type: "number",
          min: 1,
          max: 99,
          required: true,
          hint: "Tu plan puede continuar después del último semestre de referencia.",
        },
      ),
    (f) => {
      routeLevel = "";
      routeSemester = "";
      if (!mutate((s) => Object.assign(s.project, f)))
        throw new Error("No se pudo guardar tu nivel y semestre.");
    },
  );
}
function projectForm() {
  const p = state.project;
  const b =
    field("title", "Título provisional (opcional)", p.title, {
      wide: true,
    }) +
    field("question", "Pregunta que quieres explorar (opcional)", p.question, {
      textarea: true,
      wide: true,
    }) +
    field("level", "Nivel", p.level, {
      options: [["", "Selecciona tu nivel"], ...Object.entries(C.LEVELS)],
      hint: "Cambiar de nivel conserva los registros de tu ruta anterior.",
    }) +
    field(
      "semester",
      "Semestre actual",
      /^[1-9][0-9]?$/.test(p.semester) ? p.semester : "",
      {
        type: "number",
        min: 1,
        max: 99,
        hint:
          p.semester && !/^[1-9][0-9]?$/.test(p.semester)
            ? "Registro anterior: " +
              p.semester +
              ". Indica ahora el número de semestre."
            : "Puedes continuar después del último semestre de referencia.",
      },
    ) +
    field("milestone", "Próximo hito (opcional)", p.milestone, {
      wide: true,
      hint: "Un resultado concreto que puedas revisar con tu dirección.",
    }) +
    field("milestoneDate", "Fecha del hito", p.milestoneDate, {
      type: "date",
    }) +
    '<details class="form-extra"><summary>Datos académicos y carta de navegación</summary><div class="form-grid">' +
    field("student", "Nombre del tesista", p.student) +
    field("program", "Programa", p.program) +
    field("generation", "Generación", p.generation) +
    field("director", "Dirección de tesis", p.director) +
    field("line", "Línea de investigación", p.line) +
    field("objectives", "Objetivos", p.objectives, {
      textarea: true,
      wide: true,
    }) +
    field("approach", "Enfoque y estrategia metodológica", p.approach, {
      textarea: true,
      wide: true,
    }) +
    field("scope", "Alcance y límites", p.scope, {
      textarea: true,
      wide: true,
    }) +
    '</div></details><details class="form-extra"><summary>Una nota privada para ti</summary><div class="form-grid">' +
    field("privateNotes", "Notas privadas", p.privateNotes, {
      textarea: true,
      wide: true,
      hint: "Este campo nunca se incluye en los reportes para compartir.",
    }) +
    "</div></details>";
  openForm(
    "El rumbo de tu tesis",
    "Los campos con * son necesarios. Tus datos permanecen en tu bitácora personal.",
    b,
    (f) => {
      routeLevel = "";
      routeSemester = "";
      if (!mutate((s) => Object.assign(s.project, f)))
        throw new Error("No se pudo guardar el rumbo.");
    },
  );
}
