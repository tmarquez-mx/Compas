function renderTime() {
  const min = timePeriod === "todo" ? "" : C.shift(-(Number(timePeriod) - 1)),
    entries = state.timeEntries
      .filter((t) => (!min || t.date >= min) && t.date <= C.today())
      .sort((a, b) => b.date.localeCompare(a.date)),
    totals = Object.create(null);
  entries.forEach(
    (t) => (totals[t.category] = (totals[t.category] || 0) + t.minutes),
  );
  const total = entries.reduce((n, t) => n + t.minutes, 0),
    hours = (m) =>
      new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(
        m / 60,
      );
  let h =
    '<div class="section-title"><h2>Tu dedicación</h2>' +
    btn("Registrar actividad", "time", "", "compact") +
    "</div>";
  h +=
    '<p class="module-note"><span class="badge private">Solo para ti</span> Las horas y sus notas quedan fuera de los reportes.</p><div class="filter-row"><h2>Distribución del tiempo</h2><label>Periodo <select id="time-period">' +
    [
      ["7", "Últimos 7 días"],
      ["30", "Últimos 30 días"],
      ["todo", "Todo el registro"],
    ]
      .map(
        ([v, t]) =>
          '<option value="' +
          v +
          '"' +
          (timePeriod === v ? " selected" : "") +
          ">" +
          t +
          "</option>",
      )
      .join("") +
    "</select></label></div>";
  h +=
    '<div><section class="card"><span class="eyebrow">Dedicación registrada</span><div class="time-total">' +
    hours(total) +
    ' <small>horas</small></div><p class="hint">' +
    entries.length +
    " actividades en el periodo</p>" +
    Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(
        ([cat, m]) =>
          '<div class="time-bar"><div class="time-bar-head"><span>' +
          e(cat) +
          "</span><span>" +
          hours(m) +
          ' h</span></div><div class="time-bar-track" role="img" aria-label="' +
          e(cat) +
          ": " +
          hours(m) +
          ' horas"><span style="width:' +
          ((m / total) * 100).toFixed(1) +
          '%"></span></div></div>',
      )
      .join("") +
    (!total
      ? empty(
          "Todavía sin actividades",
          "Puedes registrar una actividad al terminarla. La duración se captura manualmente.",
        )
      : "") +
    "</section>";
  h += "</div>";
  h +=
    '<div class="section-title"><h2>Registro de actividades</h2></div><section class="card"><div class="table-wrap"><table class="time-table"><thead><tr><th>Fecha</th><th>Actividad y vínculo</th><th>Duración</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>' +
    entries
      .map((t) => {
        const a = state.actions.find((a) => a.id === t.actionId);
        return (
          "<tr><td>" +
          e(fmt(t.date)) +
          "</td><td><strong>" +
          e(t.category) +
          "</strong>" +
          (a ? '<div class="hint">' + e(a.description) + "</div>" : "") +
          (t.note ? '<div class="hint pre">' + e(t.note) + "</div>" : "") +
          "</td><td>" +
          Math.floor(t.minutes / 60) +
          " h " +
          (t.minutes % 60) +
          " min</td><td>" +
          btn("Editar", "time", 'data-id="' + e(t.id) + '"', "compact") +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>" +
    (!entries.length
      ? '<p class="empty">Sin actividades en este periodo.</p>'
      : "") +
    "</section>";
  return h;
}

function timeForm(id) {
  const x = state.timeEntries.find((t) => t.id === id) || {
    id: C.uid(),
    date: C.today(),
    category: "Lectura",
    minutes: 60,
    actionId: "",
    note: "",
  };
  const cats = [
    ...new Set([...C.CATEGORIES, ...state.timeEntries.map((t) => t.category)]),
  ];
  const b =
    field("date", "Fecha de la actividad", x.date, {
      type: "date",
      required: true,
      max: C.today(),
    }) +
    field("category", "Tipo de actividad", x.category, {
      required: true,
      list: "activity-categories",
      hint: "Elige una sugerencia o escribe una categoría propia.",
    }) +
    '<datalist id="activity-categories">' +
    cats.map((c) => '<option value="' + e(c) + '"></option>').join("") +
    "</datalist>" +
    field("hours", "Horas", Math.floor(x.minutes / 60), {
      type: "number",
      min: 0,
      max: 24,
      required: true,
    }) +
    field("minutes", "Minutos adicionales", x.minutes % 60, {
      type: "number",
      min: 0,
      max: 59,
      required: true,
    }) +
    field("actionId", "Vincular con un compromiso (opcional)", x.actionId, {
      wide: true,
      options: [
        ["", "Sin vínculo"],
        ...state.actions.map((a) => [a.id, a.description]),
      ],
    }) +
    field("note", "Nota privada sobre la actividad", x.note, {
      wide: true,
      textarea: true,
      hint: "Puedes anotar qué hiciste o qué te ayudó. No incluyas datos de investigación.",
    });
  openForm(
    "Registrar dedicación",
    "Solo para ti. Estos registros y sus totales nunca se incluyen en los reportes compartidos.",
    b,
    (f) => {
      const minutes = Number(f.hours) * 60 + Number(f.minutes);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440)
        throw new Error("Registra una duración de entre 1 minuto y 24 horas.");
      if (f.date > C.today())
        throw new Error("Registra tiempo realizado, no actividades futuras.");
      upsert("timeEntries", {
        id: x.id,
        date: f.date,
        category: f.category.trim(),
        minutes,
        actionId: f.actionId,
        note: f.note,
      });
    },
    id ? () => remove("timeEntries", id) : null,
  );
}
