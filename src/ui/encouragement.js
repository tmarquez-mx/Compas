// Reconocimientos opcionales: no conceden aprobación ni desbloquean funciones.
function completedStep(before, after) {
  for (const [key, finished, label] of [
    ["todos", (x) => x.done, (x) => x.title],
    [
      "routeProgress",
      (x) => x.status === "resuelto",
      (x) => C.milestone(x.id)?.title || "Tu producto",
    ],
    ["actions", (x) => x.status === "resuelto", (x) => x.description],
  ]) {
    const previous = new Map(before[key].map((x) => [x.id, x]));
    const completed = after[key].find(
      (x) => previous.has(x.id) && !finished(previous.get(x.id)) && finished(x),
    );
    if (completed) return label(completed);
  }
  return "";
}
function celebrationBanner() {
  return celebration && appearance.celebrate
    ? '<aside class="celebration-note" aria-label="Un avance para reconocer"><div><strong>Un paso que merece reconocerse.</strong><p>' +
        e(celebration) +
        '</p><p class="hint">Si te apetece, acompaña este momento con flores o un marco para tu espacio.</p></div><div class="toolbar">' +
        btn("Elegir un detalle", "appearance", "", "compact") +
        btn("Ahora no", "dismiss-celebration", "", "ghost compact") +
        "</div></aside>"
    : "";
}
