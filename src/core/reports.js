function selectedReportRecords(state, options) {
  const selected = Object.fromEntries(
    ["sessions", "actions", "decisions", "route"].map((key) => [
      key,
      new Set(Array.isArray(options[key]) ? options[key] : []),
    ]),
  );
  const between = (d) =>
    (!options.from || d >= options.from) && (!options.to || d <= options.to);
  return {
    sessions: state.sessions.filter(
      (x) => selected.sessions.has(x.id) && between(x.date),
    ),
    actions: state.actions.filter(
      (x) =>
        selected.actions.has(x.id) &&
        (!options.to || x.date <= options.to) &&
        (x.status !== "resuelto" ||
          !options.from ||
          x.updatedAt >= options.from),
    ),
    decisions: state.decisions.filter(
      (x) => selected.decisions.has(x.id) && between(x.date),
    ),
    route: state.routeProgress
      .filter((x) => selected.route.has(x.id))
      .map((x) => ({ m: milestone(x.id), p: routeSnapshot(x, options.to) }))
      .filter((x) => x.p),
  };
}
function reportCount(state, options) {
  return Object.values(selectedReportRecords(state, options)).reduce(
    (total, records) => total + records.length,
    0,
  );
}
function makeShare(state, options) {
  const records = selectedReportRecords(state, options);
  const textFields = (obj, keys) =>
    Object.fromEntries(
      keys.map((k) => [k, typeof obj[k] === "string" ? obj[k] : ""]),
    );
  const share = {
    format: "compas-report",
    version: 1,
    generatedAt: new Date().toISOString(),
    from: options.from || "",
    to: options.to || "",
    title: options.title || "Reporte de seguimiento",
    isDemo: state.isDemo === true,
    project: null,
    sessions: [],
    actions: [],
    decisions: [],
    route: [],
  };
  if (options.project) {
    share.project = textFields(state.project, [
      "title",
      "level",
      "program",
      "generation",
      "semester",
      "line",
      "question",
      "objectives",
      "approach",
      "scope",
      "milestone",
      "milestoneDate",
    ]);
    if (options.names)
      Object.assign(
        share.project,
        textFields(state.project, ["student", "director"]),
      );
  }
  share.sessions = records.sessions.map((x) => {
    const s = textFields(x, [
      "type",
      "date",
      "title",
      "presented",
      "agenda",
      "advances",
      "summary",
      "reviewed",
      "nextDate",
      "presentsAgain",
    ]);
    if (options.names) s.participants = x.participants;
    return s;
  });
  share.actions = records.actions.map((x) => {
    const a = textFields(x, [
      "sourceType",
      "sourceLabel",
      "date",
      "comment",
      "category",
      "disposition",
      "rationale",
      "description",
      "due",
      "priority",
      "status",
      "evidence",
      "response",
    ]);
    if (options.names) Object.assign(a, textFields(x, ["commenter", "owner"]));
    return a;
  });
  share.decisions = records.decisions.map((x) =>
    textFields(x, [
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
    ]),
  );
  share.route = records.route.map(({ m, p }) => {
    const r = {
      level: LEVELS[m.level],
      title: m.title,
      referenceSemester: String(m.semester),
      expected: m.expected,
      templateVersion: m.templateVersion,
      ...textFields(p, [
        "status",
        "versionLabel",
        "evidence",
        "planSemester",
        "due",
        "adjustmentReason",
        "reviewState",
        "reviewDate",
        "updatedAt",
      ]),
    };
    if (options.names) r.reviewBy = p.reviewBy;
    return r;
  });
  return share;
}
const reportStyle =
  "body{font-family:Arial,sans-serif;color:#171717;background:#fff;margin:0;line-height:1.6}main{max-width:1080px;margin:auto;padding:42px 32px}h1{font-size:34px;line-height:1.2;margin:16px 0}h2{font-size:23px;margin:32px 0 14px;border-bottom:2px solid #e00034;padding-bottom:8px}h3{font-size:18px;margin:0 0 12px}p{white-space:pre-wrap;overflow-wrap:anywhere}small,.muted{color:#605953}.brand{color:#e00034;font-size:25px;font-weight:700}.meta{color:#605953;font-size:14px}.record{padding:20px 0;border-bottom:1px solid #dedbd8;break-inside:avoid}.pair{display:grid;grid-template-columns:180px 1fr;gap:16px;margin:8px 0}.pair dt{color:#605953}.pair dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.pills{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.pill{background:#f2f0ee;padding:6px 10px;font-size:14px}.toolbar{padding:16px 32px;border-bottom:1px solid #dedbd8;display:flex;gap:16px;align-items:center;flex-wrap:wrap}button,select{font:inherit;padding:10px;border:1px solid #82786f;background:#fff;border-radius:4px}button{cursor:pointer}.summary{display:flex;gap:32px;flex-wrap:wrap}.summary strong{display:block;font-size:28px}.bar{height:8px;background:#e00034;margin:10px 0}.footer{font-size:13px;color:#605953;border-top:1px solid #dedbd8;margin-top:38px;padding-top:18px}a{color:#e00034}@media(max-width:600px){main{padding:24px 18px}.pair{grid-template-columns:1fr;gap:0}.toolbar{padding:12px 18px}}@page{size:A4;margin:16mm}@media print{.toolbar{display:none}main{max-width:none;padding:0;font-size:10pt}h1{font-size:23pt}h2{font-size:16pt}h3{font-size:12pt}.pair{grid-template-columns:130px 1fr}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.record[hidden]{display:block!important}}";
function reportHTML(r) {
  const pair = (label, value) =>
    value
      ? '<div class="pair"><dt>' +
        esc(label) +
        "</dt><dd>" +
        esc(value) +
        "</dd></div>"
      : "";
  const p = r.project;
  let b =
    '<main><div class="brand">Compás</div><h1>' +
    esc(r.title) +
    '</h1><p class="meta">Corte: ' +
    esc(fmt(r.to || today())) +
    " · Generado: " +
    esc(new Date(r.generatedAt).toLocaleString("es-MX")) +
    (r.isDemo ? " · EJEMPLO FICTICIO" : "") +
    '</p><p class="meta">Copia de consulta. Contiene los registros seleccionados por el tesista. No se actualiza automáticamente.</p>';
  b +=
    '<div class="summary"><div><strong>' +
    r.actions.length +
    "</strong>compromisos seleccionados</div><div><strong>" +
    r.decisions.length +
    "</strong>decisiones</div><div><strong>" +
    r.sessions.length +
    "</strong>sesiones</div></div>";
  if (p) {
    b +=
      "<h2>Rumbo de la tesis</h2><h3>" +
      esc(p.title || "Tesis sin título") +
      "</h3><dl>" +
      pair("Tesista", p.student) +
      pair("Dirección", p.director) +
      pair("Nivel", LEVELS[p.level]) +
      pair("Programa", p.program) +
      pair(
        "Generación / semestre",
        [p.generation, p.semester].filter(Boolean).join(" / "),
      ) +
      pair("Línea", p.line) +
      pair("Pregunta", p.question) +
      pair("Objetivos", p.objectives) +
      pair("Enfoque", p.approach) +
      pair("Alcance", p.scope) +
      pair("Próximo hito", p.milestone) +
      pair("Fecha del hito", p.milestoneDate ? fmt(p.milestoneDate) : "") +
      "</dl>";
  }
  if (r.route?.length)
    b +=
      '<h2>Mi ruta · productos seleccionados</h2><p class="meta">Ruta de referencia en borrador, versión ' +
      esc(ROUTE_VERSION) +
      ". Último registro disponible hasta la fecha de corte; puede ser anterior al inicio del periodo. Los estados y las revisiones son registros del tesista, sin firma ni VoBo verificado. No representan un porcentaje de avance de la tesis.</p>" +
      r.route
        .map(
          (x) =>
            '<article class="record"><h3>' +
            esc(x.title) +
            "</h3><dl>" +
            pair("Nivel", x.level) +
            pair("Semestre de referencia", x.referenceSemester) +
            pair("Resultado esperado", x.expected) +
            pair("Semestre en mi plan", x.planSemester) +
            pair("Fecha planeada", x.due ? fmt(x.due) : "") +
            pair("Estado", ROUTE_STATES[x.status]) +
            pair("Versión del producto", x.versionLabel) +
            pair("Referencia de avance", x.evidence) +
            pair("Motivo del ajuste", x.adjustmentReason) +
            pair("Revisión / aprobación", REVIEWS[x.reviewState]) +
            pair("Persona que revisó", x.reviewBy) +
            pair("Fecha de revisión", x.reviewDate ? fmt(x.reviewDate) : "") +
            pair("Registro actualizado", fmt(x.updatedAt)) +
            "</dl></article>",
        )
        .join("");
  if (r.actions.length) {
    b += "<h2>Acuerdos y compromisos</h2>";
    const done = r.actions.filter((x) => x.status === "resuelto").length;
    b +=
      '<p class="meta">' +
      done +
      " resueltos de " +
      r.actions.length +
      " compromisos seleccionados. Este conteo no mide el porcentaje de avance de la tesis.</p>";
    b += r.actions
      .map(
        (a) =>
          '<article class="record" data-status="' +
          esc(a.status) +
          '"><h3>' +
          esc(a.description) +
          '</h3><div class="pills"><span class="pill">' +
          esc(STATES[a.status]) +
          '</span><span class="pill">Prioridad ' +
          esc(a.priority) +
          '</span><span class="pill">' +
          esc(fmt(a.due)) +
          "</span></div><dl>" +
          pair("Origen", a.sourceLabel || "Registro personal") +
          pair("Responsable", a.owner) +
          pair("Comentario", a.comment) +
          pair("Fuente", a.commenter) +
          pair("Tipo", a.category) +
          pair("Decisión", DISPOSITIONS[a.disposition]) +
          pair("Justificación", a.rationale) +
          pair("Evidencia de avance", a.evidence) +
          pair("Respuesta / cierre", a.response) +
          "</dl></article>",
      )
      .join("");
  }
  if (r.decisions.length)
    b +=
      "<h2>Decisiones y cambios de rumbo</h2>" +
      r.decisions
        .map(
          (d) =>
            '<article class="record"><h3>' +
            esc(d.title) +
            '</h3><p class="meta">' +
            esc(fmt(d.date)) +
            "</p><dl>" +
            pair("Planteamiento previo", d.previous) +
            pair("Decisión actual", d.current) +
            pair("Motivo", d.reason) +
            pair("Alternativas", d.alternatives) +
            pair("Consecuencias", d.impact) +
            pair("Relación con la pregunta", d.questionCheck) +
            pair("Fundamento", d.basisCheck) +
            pair("Viabilidad", d.feasibilityCheck) +
            pair("Consideraciones éticas", d.ethicsCheck) +
            pair("Próxima revisión", d.reviewDate ? fmt(d.reviewDate) : "") +
            "</dl></article>",
        )
        .join("");
  if (r.sessions.length)
    b +=
      "<h2>Sesiones de seguimiento</h2>" +
      r.sessions
        .map(
          (s) =>
            '<article class="record"><h3>' +
            esc(s.title) +
            '</h3><p class="meta">' +
            (s.type === "coloquio" ? "Coloquio" : "Asesoría de tesis") +
            " · " +
            esc(fmt(s.date)) +
            "</p><dl>" +
            pair("Participantes", s.participants) +
            pair("Avance presentado", s.presented) +
            pair("Agenda", s.agenda) +
            pair("Avances desde la sesión anterior", s.advances) +
            pair("Síntesis y acuerdos", s.summary) +
            pair(
              "Revisión de la minuta",
              s.reviewed === "revisado"
                ? "El tesista registró que la minuta fue revisada con la dirección. No constituye firma ni VoBo verificado."
                : "Registrada por el tesista; revisión con la dirección pendiente.",
            ) +
            pair("Próxima sesión", s.nextDate ? fmt(s.nextDate) : "") +
            "</dl></article>",
        )
        .join("");
  b += '<footer class="footer">' + esc(FOOTER) + "</footer></main>";
  const viewerScript =
    "document.getElementById('filter').addEventListener('change',function(){document.querySelectorAll('[data-status]').forEach(function(x){x.hidden=this.value!=='todos'&&x.dataset.status!==this.value;},this);});document.getElementById('print').addEventListener('click',function(){window.print();});";
  return (
    '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src ' +
    "'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" +
    '"><title>' +
    esc(r.title) +
    " · Compás</title><style>" +
    reportStyle +
    '</style></head><body><div class="toolbar"><button id="print" type="button" title="Abre las opciones de impresión del reporte; también puedes guardarlo como PDF.">Imprimir / Guardar PDF</button><label>Ver compromisos <select id="filter"><option value="todos">Todos los seleccionados</option>' +
    Object.entries(STATES)
      .map(([v, l]) => '<option value="' + v + '">' + l + "</option>")
      .join("") +
    "</select></label><small>El PDF incluye todos los registros de esta copia.</small></div>" +
    b +
    "<script>" +
    viewerScript +
    "<\/script></body></html>"
  );
}
