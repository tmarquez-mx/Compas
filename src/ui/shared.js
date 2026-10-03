function empty(title, text, action) {
  return (
    '<div class="empty"><h3>' +
    e(title) +
    "</h3><p>" +
    e(text) +
    "</p>" +
    (action || "") +
    "</div>"
  );
}
function btn(label, action, extra, cls) {
  return (
    '<button type="button" class="button ' +
    (cls || "") +
    '" data-do="' +
    action +
    '" ' +
    (extra || "") +
    ">" +
    e(label) +
    "</button>"
  );
}
function badge(s) {
  return (
    '<span class="badge status-' + e(s) + '">' + e(C.STATES[s] || s) + "</span>"
  );
}
function head(title, action) {
  return (
    '<div class="page-head"><div><h1>' +
    e(title) +
    "</h1></div>" +
    (action || "") +
    "</div>"
  );
}
function demoBanner() {
  return state.isDemo
    ? '<div class="demo-banner"><div><strong>Ejemplo ficticio.</strong> Explora Compás con estos registros de muestra.</div>' +
        btn("Empezar mi bitácora", "new", "", "compact") +
        "</div>"
    : "";
}
function actionRow(a) {
  const late = a.due && a.due < C.today() && a.status !== "resuelto";
  return (
    '<article class="action-row"><div><div class="action-title">' +
    e(a.description) +
    '</div><div class="row-meta"><span>' +
    e(a.sourceLabel || "Registro personal") +
    '</span><span class="' +
    (late ? "overdue" : "") +
    '">' +
    (late ? "Por revisar · " : "") +
    e(fmt(a.due)) +
    "</span><span>Prioridad " +
    e(a.priority) +
    '</span></div></div><div class="action-side">' +
    badge(a.status) +
    btn("Revisar", "action", 'data-id="' + e(a.id) + '"', "compact") +
    btn(
      "Desglosar en ToDo",
      "todo-edit",
      'data-source="' + e(a.id) + '"',
      "ghost compact",
    ) +
    "</div></article>"
  );
}
function actionSection(items, title) {
  return (
    '<div class="section-title"><h2>' +
    e(title) +
    '</h2><label class="small">Estado <select id="action-filter" aria-label="Filtrar compromisos por estado"><option value="todos">Todos</option>' +
    Object.entries(C.STATES)
      .map(
        ([v, t]) =>
          '<option value="' +
          v +
          '"' +
          (actionFilter === v ? " selected" : "") +
          ">" +
          t +
          "</option>",
      )
      .join("") +
    '</select></label></div><section class="card action-list">' +
    (items
      .filter((a) => actionFilter === "todos" || a.status === actionFilter)
      .map(actionRow)
      .join("") ||
      empty(
        "Sin compromisos en esta vista",
        "Agrega un compromiso o cambia el filtro.",
      )) +
    "</section>"
  );
}
