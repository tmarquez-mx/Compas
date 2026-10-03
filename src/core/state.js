function createState(projectId) {
  return {
    schemaVersion: 2,
    isDemo: false,
    project: {
      id: projectId,
      level: "",
      title: "",
      student: "",
      program: "",
      generation: "",
      semester: "",
      director: "",
      line: "",
      question: "",
      objectives: "",
      approach: "",
      scope: "",
      milestone: "",
      milestoneDate: "",
      privateNotes: "",
    },
    sessions: [],
    actions: [],
    decisions: [],
    timeEntries: [],
    reflections: [],
    routeProgress: [],
    todos: [],
  };
}
function blank() {
  return createState(uid());
}
function demo() {
  const s = blank();
  s.isDemo = true;
  Object.assign(s.project, {
    level: "maestria",
    title: "Redes vecinales y participación política juvenil",
    student: "Alex · ejemplo ficticio",
    program: "Maestría en Ciencias Sociales y Políticas",
    generation: "2026",
    semester: "3",
    director: "Dirección de tesis · ejemplo ficticio",
    line: "Instituciones y participación",
    question:
      "¿Cómo influyen las redes vecinales en la participación política de jóvenes en dos colonias de la Ciudad de México?",
    objectives:
      "Comprender las formas de participación juvenil.\nComparar el papel de las redes vecinales en dos contextos locales.",
    approach:
      "Estudio comparativo cualitativo con entrevistas semiestructuradas.",
    scope:
      "Dos colonias; participación en espacios comunitarios. Delimitación de casos por revisar.",
    milestone: "Revisar el diseño metodológico con la dirección",
    milestoneDate: shift(10),
    privateNotes:
      "Recordatorio personal ficticio: necesito dejar tiempo entre lectura y escritura.",
  });
  s.sessions = [
    {
      id: "ses-coloquio",
      type: "coloquio",
      date: shift(-18),
      title: "Coloquio de avances",
      participants: "Comité · ejemplo ficticio",
      presented: "Protocolo y primer apartado del marco conceptual",
      agenda: "Coherencia entre pregunta, conceptos y selección de casos.",
      advances: "Primera versión del marco conceptual y mapa de literatura.",
      summary:
        "Precisar el concepto de participación y justificar los casos comparados.",
      reviewed: "registrado",
      nextDate: shift(90),
      presentsAgain: "si",
      privateNotes:
        "Reflexión privada ficticia sobre cómo viví la presentación.",
    },
    {
      id: "ses-supervision",
      type: "supervision",
      date: shift(-5),
      title: "Revisión del diseño metodológico",
      participants: "Tesista y dirección · ejemplo ficticio",
      presented: "Matriz de selección de casos, versión 2",
      agenda:
        "Revisar el alcance de la comparación.\nAcordar los criterios de selección.",
      advances:
        "Se precisó la definición de participación y se identificaron criterios de contraste.",
      summary:
        "Comparar dos contextos y explicitar los límites de la selección.",
      reviewed: "revisado",
      nextDate: shift(10),
      presentsAgain: "no",
      privateNotes:
        "Nota personal ficticia: preparar una sola pregunta central para la siguiente sesión.",
    },
  ];
  s.actions = [
    {
      id: "act-casos",
      sourceType: "supervision",
      sourceId: "ses-supervision",
      sourceLabel: "Revisión del diseño metodológico",
      date: shift(-5),
      updatedAt: shift(-2),
      commenter: "Dirección",
      category: "Metodológico",
      comment:
        "Explicitar por qué estos dos casos permiten una comparación relevante.",
      disposition: "incorporar",
      rationale:
        "El contraste territorial permite examinar distintas formas de articulación vecinal.",
      description: "Precisar y justificar el criterio de selección de casos",
      owner: "Tesista",
      due: shift(7),
      priority: "alta",
      status: "en-proceso",
      evidence: "Matriz de selección de casos, versión 2.",
      response: "",
      privateNotes: "",
    },
    {
      id: "act-concepto",
      sourceType: "coloquio",
      sourceId: "ses-coloquio",
      sourceLabel: "Coloquio de avances",
      date: shift(-18),
      updatedAt: shift(-4),
      commenter: "Comité",
      category: "Teórico-conceptual",
      comment: "Distinguir participación comunitaria y participación política.",
      disposition: "incorporar",
      rationale:
        "La precisión conceptual hace explícito qué prácticas se analizarán.",
      description:
        "Precisar el concepto de participación en el marco analítico",
      owner: "Tesista",
      due: shift(-3),
      priority: "alta",
      status: "resuelto",
      evidence: "Capítulo 1, apartado 1.2, versión del " + fmt(shift(-4)) + ".",
      response: "Se delimitó el concepto y se explicaron sus dimensiones.",
      privateNotes: "",
    },
    {
      id: "act-guia",
      sourceType: "supervision",
      sourceId: "ses-supervision",
      sourceLabel: "Revisión del diseño metodológico",
      date: shift(-5),
      updatedAt: shift(-5),
      commenter: "Dirección",
      category: "Metodológico",
      comment:
        "Vincular las preguntas de entrevista con los objetivos de la investigación.",
      disposition: "incorporar",
      rationale:
        "La guía debe producir información pertinente para responder la pregunta.",
      description: "Revisar la relación entre objetivos y guía de entrevista",
      owner: "Tesista",
      due: shift(14),
      priority: "media",
      status: "pendiente",
      evidence: "",
      response: "",
      privateNotes: "",
    },
  ];
  s.decisions = [
    {
      id: "dec-alcance",
      date: shift(-5),
      title: "Delimitar la comparación a dos contextos",
      previous: "Explorar cuatro colonias con criterios aún abiertos.",
      current: "Comparar dos colonias con criterios de contraste explícitos.",
      reason:
        "El acceso y el tiempo disponible permiten profundizar en dos contextos.",
      alternatives:
        "Mantener cuatro casos con menor profundidad; realizar un único estudio de caso.",
      impact: "Ajustar selección, cronograma y alcance de las conclusiones.",
      reviewDate: shift(10),
      questionCheck:
        "La comparación permite examinar cómo intervienen distintas redes vecinales.",
      basisCheck:
        "Criterios de contraste y pertinencia teórica por desarrollar.",
      feasibilityCheck: "Confirmar acceso antes de cerrar la selección.",
      ethicsCheck:
        "Revisar condiciones de acceso y evitar información que identifique a participantes.",
      supersedes: "",
      privateNotes: "",
    },
  ];
  s.timeEntries = [
    {
      id: "time-1",
      date: shift(-4),
      category: "Lectura",
      minutes: 90,
      actionId: "act-casos",
      note: "Lectura sobre comparación cualitativa.",
    },
    {
      id: "time-2",
      date: shift(-3),
      category: "Escritura",
      minutes: 120,
      actionId: "act-casos",
      note: "Redacción de criterios.",
    },
    {
      id: "time-3",
      date: shift(-2),
      category: "Asesoría de tesis",
      minutes: 60,
      actionId: "",
      note: "Preparación de la próxima reunión.",
    },
    {
      id: "time-4",
      date: shift(-1),
      category: "Análisis de datos",
      minutes: 75,
      actionId: "",
      note: "Ejercicio ficticio de organización analítica.",
    },
  ];
  s.reflections = [
    {
      id: "ref-1",
      date: shift(-2),
      text: "Ejemplo privado: distinguir qué necesita más lectura y qué ya puedo empezar a escribir.",
    },
  ];
  s.actions.forEach(
    (a) =>
      (a.milestoneId = a.id === "act-concepto" ? "m3-coloquio" : "m2-metodo"),
  );
  s.decisions.forEach((d) => (d.milestoneId = "m2-metodo"));
  s.routeProgress = [
    {
      ...routeDefault("m2-metodo"),
      status: "en-proceso",
      versionLabel: "Versión 2",
      evidence: "Capítulo metodológico, matriz de casos revisada.",
      planSemester: "3",
      due: shift(10),
      adjustmentReason: "Revisar la delimitación después de la asesoría de tesis.",
      reviewState: "por-revisar",
      updatedAt: shift(-2),
    },
    {
      ...routeDefault("m3-coloquio"),
      status: "resuelto",
      versionLabel: "Presentación de avances",
      evidence: "Presentación ficticia de planteamiento y diseño.",
      updatedAt: shift(-18),
    },
  ];
  s.todos = [
    {
      id: "todo-criterios",
      title: "Redactar un párrafo sobre los criterios de selección",
      date: shift(-2),
      due: shift(1),
      priority: "alta",
      done: false,
      completedAt: "",
      actionId: "act-casos",
      milestoneId: "m2-metodo",
      privateNotes: "Tarea de ejemplo: reservar un bloque breve de escritura.",
    },
    {
      id: "todo-agenda",
      title: "Preparar las preguntas para la próxima asesoría de tesis",
      date: shift(-2),
      due: shift(8),
      priority: "media",
      done: false,
      completedAt: "",
      actionId: "",
      milestoneId: "",
      privateNotes: "",
    },
  ];
  return s;
}
function normalizeState(input) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    ![1, 2].includes(input.schemaVersion)
  )
    throw new Error("El archivo no es una bitácora Compás compatible.");
  if (input.schemaVersion === 1)
    input = {
      ...input,
      schemaVersion: 2,
      project: { ...input.project, level: "" },
      routeProgress: [],
      todos: [],
    };
  const out = createState("");
  const string = (v, k, max = 16000) => {
    if (v === undefined) return "";
    if (typeof v !== "string" || v.length > max)
      throw new Error("Revisa el campo " + k + ".");
    return v;
  };
  const date = (v, k) => {
    v = string(v, k, 10);
    if (
      v &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(v) ||
        !Number.isFinite(Date.parse(v + "T12:00:00")) ||
        new Date(v + "T12:00:00Z").toISOString().slice(0, 10) !== v)
    )
      throw new Error("Fecha inválida en " + k + ".");
    return v;
  };
  const id = (v, k) => {
    v = string(v, k, 80);
    if (!/^[a-zA-Z0-9-]+$/.test(v))
      throw new Error("Identificador inválido en " + k + ".");
    return v;
  };
  const pick = (o, keys) => {
    if (!o || typeof o !== "object" || Array.isArray(o))
      throw new Error("Registro inválido.");
    const r = {};
    keys.forEach((k) => (r[k] = string(o[k], k)));
    return r;
  };
  const list = (k) => {
    if (!Array.isArray(input[k]) || input[k].length > 3000)
      throw new Error("Lista inválida o demasiado grande: " + k + ".");
    return input[k];
  };
  const oneOf = (v, vals, k) => {
    if (!vals.includes(v)) throw new Error("Valor inválido en " + k + ".");
    return v;
  };
  out.isDemo = input.isDemo === true;
  out.project = pick(input.project, Object.keys(out.project));
  out.project.id = id(input.project.id, "proyecto");
  out.project.milestoneDate = date(input.project.milestoneDate, "próximo hito");
  oneOf(out.project.level, ["", ...Object.keys(LEVELS)], "nivel");
  out.sessions = list("sessions").map((x) => {
    const r = pick(x, [
      "id",
      "type",
      "date",
      "title",
      "participants",
      "presented",
      "agenda",
      "advances",
      "summary",
      "reviewed",
      "nextDate",
      "presentsAgain",
      "privateNotes",
    ]);
    r.id = id(r.id, "sesión");
    r.date = date(r.date, "sesión");
    r.nextDate = date(r.nextDate, "próxima sesión");
    r.type = oneOf(r.type, ["coloquio", "supervision"], "tipo de sesión");
    r.reviewed = oneOf(r.reviewed, ["registrado", "revisado"], "revisión");
    r.presentsAgain = oneOf(
      r.presentsAgain,
      ["si", "no", "por-definir"],
      "próximo coloquio",
    );
    return r;
  });
  out.actions = list("actions").map((x) => {
    const r = pick(x, [
      "id",
      "sourceType",
      "sourceId",
      "sourceLabel",
      "date",
      "updatedAt",
      "commenter",
      "category",
      "comment",
      "disposition",
      "rationale",
      "description",
      "owner",
      "due",
      "priority",
      "status",
      "evidence",
      "response",
      "privateNotes",
      "milestoneId",
    ]);
    r.id = id(r.id, "compromiso");
    r.date = date(r.date, "registro");
    r.updatedAt = date(r.updatedAt, "actualización");
    r.due = date(r.due, "compromiso");
    oneOf(r.sourceType, ["personal", "coloquio", "supervision"], "origen");
    oneOf(
      r.disposition,
      Object.keys(DISPOSITIONS),
      "decisión sobre comentario",
    );
    oneOf(r.priority, ["alta", "media", "baja"], "prioridad");
    oneOf(r.status, Object.keys(STATES), "estado");
    return r;
  });
  out.decisions = list("decisions").map((x) => {
    const r = pick(x, [
      "id",
      "date",
      "title",
      "previous",
      "current",
      "reason",
      "alternatives",
      "impact",
      "reviewDate",
      "questionCheck",
      "basisCheck",
      "feasibilityCheck",
      "ethicsCheck",
      "supersedes",
      "privateNotes",
      "milestoneId",
    ]);
    r.id = id(r.id, "decisión");
    r.date = date(r.date, "decisión");
    r.reviewDate = date(r.reviewDate, "revisión");
    return r;
  });
  out.timeEntries = list("timeEntries").map((x) => {
    const r = pick(x, ["id", "date", "category", "actionId", "note"]);
    r.id = id(r.id, "dedicación");
    r.date = date(r.date, "dedicación");
    if (!Number.isInteger(x.minutes) || x.minutes < 1 || x.minutes > 1440)
      throw new Error("La duración debe estar entre 1 y 1440 minutos.");
    r.minutes = x.minutes;
    return r;
  });
  out.reflections = list("reflections").map((x) => {
    const r = pick(x, ["id", "date", "text"]);
    r.id = id(r.id, "reflexión");
    r.date = date(r.date, "reflexión");
    return r;
  });
  const routeRecord = (x) => {
    const r = pick(x, [
      "id",
      "templateVersion",
      "status",
      "versionLabel",
      "evidence",
      "planSemester",
      "due",
      "adjustmentReason",
      "reviewState",
      "reviewBy",
      "reviewDate",
      "privateNotes",
      "updatedAt",
    ]);
    r.id = id(r.id, "producto");
    if (!milestone(r.id)) throw new Error("Producto de ruta desconocido.");
    if (r.templateVersion !== ROUTE_VERSION)
      throw new Error("La versión de la ruta no es compatible.");
    oneOf(r.status, Object.keys(ROUTE_STATES), "avance del producto");
    oneOf(r.reviewState, Object.keys(REVIEWS), "revisión del producto");
    if (!/^[1-9][0-9]?$/.test(r.planSemester))
      throw new Error("El semestre planeado debe estar entre 1 y 99.");
    r.due = date(r.due, "fecha planeada");
    r.reviewDate = date(r.reviewDate, "revisión");
    r.updatedAt = date(r.updatedAt, "actualización de ruta");
    if (!r.updatedAt)
      throw new Error("Falta la fecha de actualización del producto.");
    if (r.status === "resuelto" && !r.evidence.trim())
      throw new Error(
        "El producto realizado necesita una referencia de avance.",
      );
    if (
      ["revisado", "aprobado"].includes(r.reviewState) &&
      (!r.reviewBy.trim() || !r.reviewDate || !r.evidence.trim())
    )
      throw new Error("La revisión requiere persona, fecha y referencia.");
    if (r.reviewDate && r.reviewDate > r.updatedAt)
      throw new Error(
        "La revisión no puede ser posterior al registro de avance.",
      );
    return r;
  };
  out.routeProgress = list("routeProgress").map((x) => {
    const r = routeRecord(x);
    if (!Array.isArray(x.history) || x.history.length > 500)
      throw new Error("Historial de ruta inválido o demasiado largo.");
    r.history = x.history.map(routeRecord);
    if (r.history.some((h) => h.id !== r.id))
      throw new Error("Historial vinculado a otro producto.");
    const timeline = [...r.history, r];
    if (timeline.some((h, i) => i && h.updatedAt < timeline[i - 1].updatedAt))
      throw new Error(
        "El historial de ruta debe conservar su orden cronológico.",
      );
    return r;
  });
  out.todos = list("todos").map((x) => {
    const r = pick(x, [
      "id",
      "title",
      "date",
      "due",
      "priority",
      "completedAt",
      "actionId",
      "milestoneId",
      "privateNotes",
    ]);
    r.id = id(r.id, "tarea");
    if (!r.title.trim()) throw new Error("La tarea necesita un título.");
    r.date = date(r.date, "tarea");
    r.due = date(r.due, "tarea");
    r.completedAt = date(r.completedAt, "tarea completada");
    if (typeof x.done !== "boolean")
      throw new Error("Estado de tarea inválido.");
    r.done = x.done;
    if (r.done !== Boolean(r.completedAt))
      throw new Error(
        "La fecha de cierre de la tarea no corresponde con su estado.",
      );
    oneOf(r.priority, ["alta", "media", "baja"], "prioridad");
    if (x.importKey !== undefined) {
      r.importKey = string(x.importKey, "origen de importación", 80);
      if (!/^(csv|ics)-[a-z0-9-]{1,70}$/.test(r.importKey))
        throw new Error("Origen de importación inválido.");
    }
    return r;
  });
  const ids = {};
  for (const key of [
    "sessions",
    "actions",
    "decisions",
    "timeEntries",
    "reflections",
    "routeProgress",
    "todos",
  ]) {
    ids[key] = new Set(out[key].map((record) => record.id));
    if (ids[key].size !== out[key].length)
      throw new Error("Hay identificadores duplicados en " + key + ".");
  }
  for (const record of [...out.actions, ...out.decisions, ...out.todos])
    if (record.milestoneId && !milestone(record.milestoneId))
      throw new Error("Vínculo a un producto de ruta desconocido.");
  for (const task of out.todos)
    if (task.actionId && !ids.actions.has(task.actionId))
      throw new Error("La tarea apunta a un compromiso inexistente.");
  for (const action of out.actions)
    if (action.sourceId && !ids.sessions.has(action.sourceId))
      throw new Error("Un compromiso apunta a una sesión inexistente.");
  for (const entry of out.timeEntries)
    if (entry.actionId && !ids.actions.has(entry.actionId))
      throw new Error(
        "Un registro de tiempo apunta a un compromiso inexistente.",
      );
  for (const decision of out.decisions)
    if (decision.supersedes && !ids.decisions.has(decision.supersedes))
      throw new Error("Falta una decisión previa en el historial.");
  return out;
}
function backupText(state) {
  return JSON.stringify(
    {
      format: "compas-backup",
      version: 2,
      savedAt: new Date().toISOString(),
      data: state,
    },
    null,
    2,
  );
}
// Una sola normalización y serialización por respaldo o escritura. La comprobación
// del límite permanece en esta frontera, también cuando solo se llama a validate.
function prepareBackup(input) {
  const state = normalizeState(input);
  const text = backupText(state);
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error(
      "La bitácora supera los 24 MB. No se guardó el cambio. Descarga tu respaldo antes de reducir registros.",
    );
  return { state, text };
}
function validate(input) {
  return prepareBackup(input).state;
}
function backup(state) {
  return prepareBackup(state).text;
}
function restore(text) {
  if (
    typeof text !== "string" ||
    new TextEncoder().encode(text).length > MAX_BACKUP_BYTES
  )
    throw new Error("El archivo excede el límite de 24 MB o no es texto.");
  let o;
  try {
    o = JSON.parse(text);
  } catch (_) {
    throw new Error(
      "No se pudo leer el archivo. Abre un respaldo JSON descargado desde Compás.",
    );
  }
  if (
    !o ||
    typeof o !== "object" ||
    Array.isArray(o) ||
    o.format !== "compas-backup" ||
    ![1, 2].includes(o.version)
  )
    throw new Error(
      "Selecciona un respaldo editable de Compás; los reportes de consulta no son respaldos.",
    );
  if (o.data?.schemaVersion !== o.version)
    throw new Error("La versión del respaldo no coincide con su contenido.");
  return validate(o.data);
}
