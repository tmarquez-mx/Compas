function routeDefault(id) {
  if (!milestone(id)) throw new Error("Producto de ruta desconocido.");
  return {
    id,
    templateVersion: ROUTE_VERSION,
    status: "pendiente",
    versionLabel: "",
    evidence: "",
    planSemester: String(milestone(id).semester),
    due: "",
    adjustmentReason: "",
    reviewState: "sin-revision",
    reviewBy: "",
    reviewDate: "",
    privateNotes: "",
    updatedAt: "",
    history: [],
  };
}
function routeSnapshot(product, cutoff) {
  if (!product) return null;
  if (!cutoff || product.updatedAt <= cutoff) return product;
  for (let i = product.history.length - 1; i >= 0; i--)
    if (product.history[i].updatedAt <= cutoff) return product.history[i];
  return null;
}
function routeAt(state, id, cutoff) {
  return routeSnapshot(
    state.routeProgress.find((product) => product.id === id),
    cutoff,
  );
}
function saveRoute(state, id, values) {
  const next = clone(state),
    old = next.routeProgress.find((x) => x.id === id),
    base = old || routeDefault(id);
  const p = {
    ...base,
    ...values,
    id,
    templateVersion: ROUTE_VERSION,
    updatedAt: today(),
    history: old
      ? [
          ...old.history,
          Object.fromEntries(
            Object.entries(old).filter(([k]) => k !== "history"),
          ),
        ]
      : [],
  };
  if (p.status === "resuelto" && !p.evidence.trim())
    throw new Error(
      "Describe la evidencia o referencia del producto realizado.",
    );
  if (
    (p.planSemester !== String(milestone(id).semester) ||
      (old && (p.planSemester !== old.planSemester || p.due !== old.due))) &&
    !p.adjustmentReason.trim()
  )
    throw new Error("Explica el motivo del ajuste en tu plan.");
  if (
    ["revisado", "aprobado"].includes(p.reviewState) &&
    (!p.reviewDate || !p.evidence.trim() || !p.reviewBy.trim())
  )
    throw new Error(
      "Registra la persona, fecha y referencia de la revisión o aprobación.",
    );
  const pos = next.routeProgress.findIndex((x) => x.id === id);
  if (pos < 0) next.routeProgress.push(p);
  else next.routeProgress[pos] = p;
  return validate(next);
}
function setTodoDone(state, id, done) {
  const next = clone(state),
    t = next.todos.find((x) => x.id === id);
  if (!t) throw new Error("No se encontró la tarea.");
  t.done = done;
  t.completedAt = done ? today() : "";
  return validate(next);
}
function removeRecord(state, key, id) {
  if (
    ![
      "sessions",
      "actions",
      "decisions",
      "timeEntries",
      "reflections",
      "todos",
    ].includes(key)
  )
    throw new Error("No se puede eliminar este tipo de registro.");
  const next = clone(state);
  next[key] = next[key].filter((x) => x.id !== id);
  if (key === "sessions")
    next.actions.forEach((a) => {
      if (a.sourceId === id) a.sourceId = "";
    });
  if (key === "actions")
    [...next.timeEntries, ...next.todos].forEach((t) => {
      if (t.actionId === id) t.actionId = "";
    });
  return validate(next);
}
