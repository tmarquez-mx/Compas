// El diario conserva la colección reflections: las notas de versiones anteriores
// siguen disponibles y los reportes continúan excluyéndolas por completo.
function renderJournal() {
  const entries = state.reflections
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  let h = head(
    "Querido diario...",
    btn("Escribir en mi diario", "reflection", "", "primary"),
  );
  h +=
    '<p class="module-note"><span class="badge private">Solo para ti</span> Se guarda en tu respaldo, sin incluirse en reportes.</p>';
  h +=
    '<section class="journal-pages" aria-label="Entradas de tu diario">' +
    (entries
      .map(
        (r) =>
          '<article class="card journal-entry"><div class="card-head"><h2>' +
          e(fmt(r.date)) +
          "</h2>" +
          btn(
            "Editar entrada",
            "reflection",
            'data-id="' + e(r.id) + '"',
            "ghost compact",
          ) +
          '</div><p class="pre">' +
          e(r.text) +
          "</p></article>",
      )
      .join("") ||
      empty(
        "Tu primera página puede ser breve",
        "Una frase, una duda o algo que hoy te ayudó. Este espacio no es una evaluación.",
      )) +
    "</section>";
  return h;
}
function reflectionForm(id) {
  const x = state.reflections.find((r) => r.id === id) || {
    id: C.uid(),
    date: C.today(),
    text: "",
  };
  openForm(
    id ? "Una página de tu diario" : "¿Qué quieres dejar escrito hoy?",
    "Solo para ti. Puedes escribir libremente; no hay una respuesta correcta.",
    field("date", "Fecha de esta página", x.date, {
      type: "date",
      required: true,
      max: C.today(),
    }) +
      '<div class="journal-prompts wide"><p class="hint">Si quieres una idea para empezar:</p><p>Algo que descubrí · Una dificultad que quiero conversar · Algo que hoy me hizo bien</p></div>' +
      field("text", "Mi entrada", x.text, {
        textarea: true,
        wide: true,
        required: true,
        rows: 9,
        hint: "También puedes retomar aquí las reflexiones que ya habías escrito.",
      }),
    (f) => upsert("reflections", { ...x, ...f }),
    id ? () => remove("reflections", id) : null,
  );
}
