// Solo este catálogo mantenido con fuentes institucionales puede declarar una ruta oficial.
// Los borradores existentes conservan su procedencia; no se convierten en planes oficiales.
const ROUTE_TEMPLATES = Object.freeze([
  ...syntheticTemplates(),
  {
    id: "csp-maestria",
    level: "maestria",
    title: "Ciencias Sociales y Políticas · Maestría",
    department: "Ciencias Sociales y Políticas",
    program: "Maestría en Ciencias Sociales y Políticas",
    status: "draft",
    version: ROUTE_VERSION,
    date: "2026-09-10",
    source:
      "Borrador compartido por la coordinación el 10 de septiembre de 2026",
    stages: ROUTES.maestria,
  },
  {
    id: "csp-doctorado",
    level: "doctorado",
    title: "Ciencias Sociales y Políticas · Doctorado",
    department: "Ciencias Sociales y Políticas",
    program: "Doctorado en Ciencias Sociales y Políticas",
    status: "draft",
    version: ROUTE_VERSION,
    date: "2026-09-10",
    source:
      "Borrador compartido por la coordinación el 10 de septiembre de 2026",
    stages: ROUTES.doctorado,
  },
  {
    id: "personal-maestria",
    level: "maestria",
    title: "Maestría · crear mi propia ruta",
    department: "",
    program: "",
    status: "personal",
    version: "personal-1",
    date: "",
    source: "Configurada por el tesista",
    stages: [],
  },
  {
    id: "personal-doctorado",
    level: "doctorado",
    title: "Doctorado · crear mi propia ruta",
    department: "",
    program: "",
    status: "personal",
    version: "personal-1",
    date: "",
    source: "Configurada por el tesista",
    stages: [],
  },
]);
const routeCatalogue = ROUTE_TEMPLATES.flatMap((t) =>
  t.stages.flatMap((s) =>
    s.products.map(([id, work, title, expected]) => ({
      id,
      workId: t.id + "-" + work,
      title,
      expected,
      level: t.level,
      semester: s.semester,
      spaces: s.spaces,
      note: s.note,
      templateId: t.id,
      templateVersion: t.version,
    })),
  ),
);
const routeCatalogueById = new Map(routeCatalogue.map((m) => [m.id, m]));
function catalogueMilestones() {
  return routeCatalogue;
}
function catalogueMilestone(id) {
  return routeCatalogueById.get(id);
}
function emptyRoutePlan() {
  return {
    templates: { maestria: "csp-maestria", doctorado: "csp-doctorado" },
    durations: { maestria: 4, doctorado: 8 },
    department: "",
    products: [],
    stages: [],
  };
}
function validateRoutePlan(value) {
  if (value === undefined) return emptyRoutePlan();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Configuración de ruta inválida.");
  const text = (v, label, max = 16000) => {
    if (typeof v !== "string" || v.length > max)
      throw new Error("Revisa " + label + ".");
    return v;
  };
  const number = (v) => {
    if (!Number.isInteger(v) || v < 1 || v > 99)
      throw new Error("El semestre debe estar entre 1 y 99.");
    return v;
  };
  const result = emptyRoutePlan();
  for (const level of Object.keys(LEVELS)) {
    const template = ROUTE_TEMPLATES.find(
      (t) => t.id === value.templates?.[level] && t.level === level,
    );
    if (!template) throw new Error("Plantilla de ruta desconocida.");
    result.templates[level] = template.id;
    result.durations[level] = number(value.durations?.[level]);
  }
  result.department = text(value.department, "departamento", 1000);
  for (const key of ["products", "stages"]) {
    if (
      !Array.isArray(value[key]) ||
      value[key].length > (key === "products" ? 1000 : 198)
    )
      throw new Error("Demasiados elementos en la ruta.");
    const seen = new Set();
    result[key] = value[key].map((x) => {
      if (!x || !Object.hasOwn(LEVELS, x.level))
        throw new Error("Nivel de ruta inválido.");
      const record = {
        level: x.level,
        semester: number(x.semester),
        title: text(x.title, "nombre", 1000),
      };
      if (!record.title.trim())
        throw new Error("Escribe un nombre para el entregable o semestre.");
      if (key === "products") {
        record.id = text(x.id, "identificador", 80);
        const base = catalogueMilestone(record.id);
        if (
          (!base && !/^c-[a-zA-Z0-9-]+$/.test(record.id)) ||
          (base && base.level !== record.level)
        )
          throw new Error("Identificador de entregable inválido.");
        record.workId = base?.workId || record.level + "-" + record.id;
        record.expected = text(x.expected, "descripción del entregable");
        if (typeof x.archived !== "boolean")
          throw new Error("Estado de entregable inválido.");
        record.archived = x.archived;
      } else {
        record.spaces = text(x.spaces, "materias o espacios", 1000);
        record.note = text(x.note, "nota del semestre");
      }
      const identity =
        key === "products" ? record.id : record.level + "-" + record.semester;
      if (seen.has(identity))
        throw new Error("Hay elementos duplicados en la ruta.");
      seen.add(identity);
      return record;
    });
  }
  return result;
}
function routeTemplate(state, level) {
  return ROUTE_TEMPLATES.find(
    (t) => t.id === (state.routePlan?.templates?.[level] || "csp-" + level),
  );
}
function routeMilestones(state, includeArchived = false) {
  const custom = state.routePlan?.products || [];
  const overrides = new Map(custom.map((x) => [x.id, x]));
  const all = catalogueMilestones().map((m) => ({
    ...m,
    archived: m.templateId !== routeTemplate(state, m.level)?.id,
    ...(overrides.get(m.id) || {}),
  }));
  all.push(
    ...custom
      .filter((x) => !catalogueMilestone(x.id))
      .map((x) => ({
        ...x,
        templateVersion: ROUTE_VERSION,
        spaces: "",
        note: "",
      })),
  );
  return includeArchived ? all : all.filter((x) => !x.archived);
}
function routeStages(state, level) {
  if (!Object.hasOwn(LEVELS, level)) return null;
  const template = routeTemplate(state, level),
    count = state.routePlan?.durations?.[level] || ROUTES[level].length;
  return Array.from({ length: count }, (_, i) => {
    const semester = i + 1;
    const base = template?.stages.find((x) => x.semester === semester);
    const custom = state.routePlan?.stages.find(
      (x) => x.level === level && x.semester === semester,
    );
    return {
      semester,
      title: "Mi semestre " + semester,
      spaces: "",
      note: "",
      ...(base || {}),
      ...(custom || {}),
    };
  });
}
function routeAdaptations(state, level) {
  const template = routeTemplate(state, level);
  if (!template || template.status === "personal") return [];
  const changes = [];
  if (
    (state.routePlan?.durations?.[level] || template.stages.length) !==
    template.stages.length
  )
    changes.push("Duración de la ruta adaptada");
  if (
    state.project.level === level &&
    state.project.program &&
    state.project.program !== template.program
  )
    changes.push("Nombre del posgrado distinto de la plantilla");
  if (
    state.routePlan?.department &&
    state.routePlan.department !== template.department
  )
    changes.push("Carrera o departamento distinto de la plantilla");
  for (const s of state.routePlan?.stages || []) {
    if (s.level !== level) continue;
    const original = template.stages.find((x) => x.semester === s.semester);
    if (
      !original ||
      ["title", "spaces", "note"].some((k) => s[k] !== original[k])
    )
      changes.push("Semestre " + s.semester + ": información adaptada");
  }
  for (const p of state.routePlan?.products || []) {
    if (p.level !== level) continue;
    const original = catalogueMilestone(p.id);
    if (!original && !p.archived) changes.push("Entregable propio: " + p.title);
    else if (original?.templateId !== template.id) continue;
    else if (p.archived) changes.push("Entregable retirado: " + original.title);
    else if (
      ["title", "expected", "semester"].some((k) => p[k] !== original[k])
    )
      changes.push("Entregable adaptado: " + p.title);
  }
  for (const p of state.routeProgress) {
    const original = catalogueMilestone(p.id);
    if (
      original?.templateId === template.id &&
      original.level === level &&
      Number(p.planSemester) !== original.semester
    )
      changes.push("Semestre reprogramado: " + milestone(p.id, state).title);
  }
  return [...new Set(changes)];
}
function routeProvenance(state, level) {
  const template = routeTemplate(state, level);
  if (!template) return null;
  const adaptations = routeAdaptations(state, level);
  return {
    level: LEVELS[level],
    templateId: template.id,
    program: template.program,
    department: template.department,
    template: template.title,
    version: template.version,
    date: template.date,
    source: template.source,
    status: template.status,
    label:
      template.status === "official"
        ? adaptations.length
          ? "Ruta oficial con ajustes personales"
          : "Ruta oficial del programa"
        : template.status === "synthetic"
          ? adaptations.length
            ? "Ruta orientativa con ajustes personales, no oficial"
            : "Ruta orientativa, no oficial"
          : template.status === "draft"
            ? adaptations.length
              ? "Referencia en borrador con ajustes personales"
              : "Referencia en borrador"
            : "Ruta personal",
    adaptations,
  };
}
function saveRouteProduct(state, id, values) {
  const next = clone(state),
    existing = id ? milestone(id, next) : null;
  if (id && !existing) throw new Error("No se encontró el entregable.");
  const product = {
    id: existing?.id || uid(),
    level: existing?.level || values.level,
    semester: Number(values.semester),
    title: String(values.title || "").trim(),
    expected: String(values.expected || "").trim(),
    archived: existing?.archived || false,
  };
  const at = next.routePlan.products.findIndex((x) => x.id === product.id);
  if (at < 0) next.routePlan.products.push(product);
  else next.routePlan.products[at] = product;
  if (
    Object.hasOwn(LEVELS, product.level) &&
    product.semester > next.routePlan.durations[product.level]
  )
    next.routePlan.durations[product.level] = product.semester;
  let valid = validate(next);
  const progress = valid.routeProgress.find((x) => x.id === product.id);
  if (progress && Number(progress.planSemester) !== product.semester)
    valid = saveRoute(valid, product.id, {
      planSemester: String(product.semester),
      adjustmentReason: String(
        values.adjustmentReason || "Adaptación del entregable a mi posgrado.",
      ),
    });
  return valid;
}
function archiveRouteProduct(state, id, archived = true) {
  const m = milestone(id, state);
  if (!m) throw new Error("No se encontró el entregable.");
  const next = clone(state),
    at = next.routePlan.products.findIndex((x) => x.id === id);
  const record = { ...m, archived };
  if (at < 0) next.routePlan.products.push(record);
  else next.routePlan.products[at] = record;
  return validate(next);
}
function saveRouteStage(state, level, semester, values) {
  const next = clone(state),
    s = {
      level,
      semester: Number(semester),
      title: String(values.title || "").trim(),
      spaces: String(values.spaces || ""),
      note: String(values.note || ""),
    };
  const at = next.routePlan.stages.findIndex(
    (x) => x.level === level && x.semester === s.semester,
  );
  if (at < 0) next.routePlan.stages.push(s);
  else next.routePlan.stages[at] = s;
  if (s.semester > next.routePlan.durations[level])
    next.routePlan.durations[level] = s.semester;
  return validate(next);
}
function applyRouteTemplate(state, templateId, values = {}) {
  const template = ROUTE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error("Plantilla desconocida.");
  let next = validate(state);
  const level = template.level,
    changing = next.routePlan.templates[level] !== template.id;
  if (changing) {
    for (const m of routeMilestones(next, true).filter(
      (m) =>
        m.level === level &&
        (!m.archived ||
          next.routeProgress.some((p) => p.id === m.id) ||
          next.routePlan.products.some((p) => p.id === m.id)),
    ))
      next = archiveRouteProduct(next, m.id, true);
    next.routePlan.stages = next.routePlan.stages.filter(
      (s) => s.level !== level,
    );
    if (template.status !== "personal") {
      for (const stage of template.stages)
        for (const [id] of stage.products) {
          next.routePlan.products = next.routePlan.products.filter(
            (x) => x.id !== id,
          );
        }
    }
  }
  next.routePlan.templates[level] = template.id;
  next.routePlan.durations[level] = Number(
    values.semesters ||
      template.stages.length ||
      (level === "maestria" ? 4 : 8),
  );
  next.routePlan.department = String(values.department || "");
  if (values.program !== undefined)
    next.project.program = String(values.program);
  next.project.level = level;
  return validate(next);
}
