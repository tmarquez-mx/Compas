function initReport() {
  if (!reportOptions)
    reportOptions = {
      title: "Reporte de seguimiento de tesis",
      from: C.shift(-30),
      to: C.today(),
      project: true,
      names: false,
      actions: state.actions.map((a) => a.id),
      sessions: state.sessions.map((s) => s.id),
      decisions: state.decisions.map((d) => d.id),
      route: [],
    };
}
function reportChoices(key, items, label) {
  const o = reportOptions;
  return (
    "<h3>" +
    label +
    '</h3><div class="choice-list">' +
    (items
      .map(
        (x) =>
          '<label class="choice"><input type="checkbox" data-report-list="' +
          key +
          '" value="' +
          e(x.id) +
          '"' +
          (o[key].includes(x.id) ? " checked" : "") +
          "><span><strong>" +
          e(x.description || x.title) +
          "</strong><small>" +
          e(fmt(x.date)) +
          (x.status
            ? " · " +
              e(
                (key === "route" ? C.ROUTE_STATES : C.STATES)[x.status] ||
                  x.status,
              )
            : "") +
          "</small></span></label>",
      )
      .join("") || '<p class="hint">Sin registros para este periodo.</p>') +
    "</div>"
  );
}
function renderReports() {
  initReport();
  const o = reportOptions,
    count = C.reportCount(state, o),
    between = (d) => (!o.from || d >= o.from) && (!o.to || d <= o.to);
  const actions = state.actions.filter(
    (a) =>
      (!o.to || a.date <= o.to) &&
      (a.status !== "resuelto" || !o.from || a.updatedAt >= o.from),
  );
  let h = head("Comparte una parte de tu trayectoria");
  h +=
    '<p class="module-note">Tu diario, tareas, horas y notas privadas quedan fuera del reporte.</p><div class="report-grid"><section class="card"><div class="form-grid"><label class="field wide"><span>Título del reporte</span><input id="report-title" maxlength="160" value="' +
    e(o.title) +
    '"></label><label class="field"><span>Desde</span><input id="report-from" type="date" value="' +
    e(o.from) +
    '"></label><label class="field"><span>Hasta / fecha de corte</span><input id="report-to" type="date" value="' +
    e(o.to) +
    '"></label></div><p class="hint">Los compromisos pendientes anteriores al periodo también están disponibles para seleccionar.</p><label class="choice"><input id="report-project" type="checkbox"' +
    (o.project ? " checked" : "") +
    '><span><strong>Incluir el rumbo actual de la tesis</strong><small>Pregunta, objetivos, enfoque, alcance y próximo hito.</small></span></label><label class="choice"><input id="report-names" type="checkbox"' +
    (o.names ? " checked" : "") +
    '><span><strong>Incluir los campos de nombres</strong><small>Tesista, dirección, participantes, fuente y responsables. Revisa los nombres escritos dentro de otros textos.</small></span></label><div class="report-checks">' +
    reportChoices("actions", actions, "Acuerdos y compromisos") +
    reportChoices(
      "decisions",
      state.decisions.filter((d) => between(d.date)),
      "Decisiones y cambios de rumbo",
    ) +
    reportChoices(
      "sessions",
      state.sessions.filter((s) => between(s.date)),
      "Sesiones",
    ) +
    '<p class="hint">Ruta: selecciona los productos que quieras compartir. Se muestra el último registro hasta la fecha de corte, aunque sea anterior a “Desde”. El historial y las tareas ToDo quedan fuera.</p>' +
    reportChoices(
      "route",
      state.routeProgress
        .map((p) => {
          const v = C.routeAt(state, p.id, o.to),
            m = C.milestone(p.id);
          return v
            ? {
                id: p.id,
                title:
                  C.LEVELS[m.level] + " · S" + m.semester + " · " + m.title,
                date: v.updatedAt,
                status: v.status,
              }
            : null;
        })
        .filter(Boolean),
      "Productos de mi ruta",
    ) +
    '</div></section><aside class="card"><span class="eyebrow">Tu selección</span><p class="selected-count">' +
    count +
    "</p><p>registros académicos" +
    (o.project ? " y el rumbo de la tesis" : "") +
    '</p><p class="hint">Revisa la vista previa antes de descargar.</p><div style="margin-top:22px">' +
    btn("Preparar vista previa", "preview", "", "primary") +
    '</div><hr style="border:0;border-top:1px solid var(--line);margin:24px 0"><p class="hint">El reporte no sustituye tu respaldo personal.</p></aside></div>';
  if (previewShare)
    h +=
      '<section class="report-preview" aria-label="Vista previa del reporte"><div class="section-title"><div><h2>Esto es lo que compartirás</h2><p class="hint">Verifica nombres, comentarios y referencias antes de descargar.</p></div><div class="toolbar">' +
      btn("Imprimir / Guardar PDF", "pdf", "", "primary") +
      btn("Descargar panel de consulta", "html") +
      btn("Descargar Excel", "excel") +
      '</div></div><iframe id="report-frame" title="Vista previa del reporte seleccionado" sandbox="allow-scripts allow-modals allow-same-origin"></iframe></section>';
  return h;
}
