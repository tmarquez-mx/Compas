const MAX_TODO_IMPORT_BYTES = 2 * 1024 * 1024;
const MAX_TODO_IMPORT_ROWS = 1000;
function todoImportInput(text) {
  if (
    typeof text !== "string" ||
    text.length > MAX_TODO_IMPORT_BYTES ||
    new TextEncoder().encode(text).length > MAX_TODO_IMPORT_BYTES
  )
    throw new Error("El archivo debe ser texto UTF-8 de hasta 2 MB.");
  if (text.includes("\u0000") || text.includes("\uFFFD"))
    throw new Error(
      "No se pudo leer el archivo como UTF-8. Expórtalo con esa codificación e intenta de nuevo.",
    );
  return text.replace(/^\uFEFF/, "");
}
// SHA-256 prefix: retain a stable source fingerprint, never the calendar UID itself.
function todoImportFingerprint(format, value) {
  const b = Array.from(new TextEncoder().encode(value)),
    bits = b.length * 8;
  b.push(128);
  while (b.length % 64 !== 56) b.push(0);
  for (let i = 7; i >= 0; i--)
    b.push(Math.floor(bits / Math.pow(256, i)) & 255);
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const h = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
      0x1f83d9ab, 0x5be0cd19,
    ],
    r = (v, n) => (v >>> n) | (v << (32 - n));
  for (let o = 0; o < b.length; o += 64) {
    const w = [];
    for (let i = 0; i < 16; i++)
      w[i] =
        (b[o + i * 4] << 24) |
        (b[o + i * 4 + 1] << 16) |
        (b[o + i * 4 + 2] << 8) |
        b[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const x = w[i - 15],
        y = w[i - 2];
      w[i] =
        (w[i - 16] +
          (r(x, 7) ^ r(x, 18) ^ (x >>> 3)) +
          w[i - 7] +
          (r(y, 17) ^ r(y, 19) ^ (y >>> 10))) |
        0;
    }
    let [a, c, d, e, f, g, j, l] = h;
    for (let i = 0; i < 64; i++) {
      const t =
          (l +
            (r(f, 6) ^ r(f, 11) ^ r(f, 25)) +
            ((f & g) ^ (~f & j)) +
            k[i] +
            w[i]) |
          0,
        u =
          ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & c) ^ (a & d) ^ (c & d))) | 0;
      l = j;
      j = g;
      g = f;
      f = (e + t) | 0;
      e = d;
      d = c;
      c = a;
      a = (t + u) | 0;
    }
    [a, c, d, e, f, g, j, l].forEach((v, i) => (h[i] = (h[i] + v) | 0));
  }
  return (
    format +
    "-" +
    h
      .map((v) => (v >>> 0).toString(16).padStart(8, "0"))
      .join("")
      .slice(0, 24)
  );
}
function todoImportCSVRows(text, separator) {
  const rows = [];
  let cells = [],
    cell = "",
    quoted = false,
    closed = false,
    line = 1,
    start = 1,
    started = false;
  const addCell = () => {
    cells.push(cell);
    cell = "";
    closed = false;
    started = false;
    if (cells.length > 100)
      throw new Error("El CSV tiene más de 100 columnas.");
  };
  const addRow = () => {
    addCell();
    rows.push({ cells, row: start });
    cells = [];
    start = line + 1;
    if (rows.length > MAX_TODO_IMPORT_ROWS + 2)
      throw new Error("El CSV tiene más de 1000 filas de datos.");
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else {
        cell += c;
        if (c === "\n" || (c === "\r" && text[i + 1] !== "\n")) line++;
      }
      continue;
    }
    if (closed && c !== separator && c !== "\r" && c !== "\n")
      throw new Error(
        "CSV inválido: hay texto después de una comilla de cierre en la línea " +
          line +
          ".",
      );
    if (c === '"') {
      if (started || cell)
        throw new Error(
          "CSV inválido: una comilla dentro de un campo debe duplicarse en la línea " +
            line +
            ".",
        );
      quoted = true;
      started = true;
    } else if (c === separator) addCell();
    else if (c === "\r" || c === "\n") {
      addRow();
      if (c === "\r" && text[i + 1] === "\n") i++;
      line++;
      start = line;
    } else {
      cell += c;
      started = true;
    }
  }
  if (quoted) throw new Error("CSV inválido: falta cerrar una comilla.");
  if (cell || cells.length || started || closed) addRow();
  return rows;
}
function todoImportParseCSV(text) {
  if (/^\s*BEGIN:VCALENDAR/i.test(text))
    throw new Error("Este archivo es iCalendar. Selecciona un archivo .ics.");
  const warnings = [];
  let fixed = "";
  const directive = text.match(/^sep=([,;\t])\r?\n/i);
  if (directive) {
    fixed = directive[1];
    text = text.slice(directive[0].length);
    warnings.push("Se usó el separador declarado por el archivo CSV.");
  }
  // Examine the header outside quotes; do not infer a delimiter from quoted content.
  let inQuote = false,
    commas = 0,
    semicolons = 0,
    tabs = 0;
  const headerText = text.replace(/^(?:[ \t]*(?:\r\n|\n|\r))+/, "");
  for (let i = 0; i < headerText.length; i++) {
    const c = headerText[i];
    if (c === '"') {
      if (inQuote && headerText[i + 1] === '"') i++;
      else inQuote = !inQuote;
    } else if (!inQuote) {
      if (c === "\r" || c === "\n") break;
      if (c === ",") commas++;
      if (c === ";") semicolons++;
      if (c === "\t") tabs++;
    }
  }
  const separator =
    fixed ||
    (tabs > commas && tabs > semicolons
      ? "\t"
      : semicolons > commas
        ? ";"
        : ",");
  const all = todoImportCSVRows(text, separator);
  if (directive) all.forEach((r) => r.row++);
  const rows = all.filter((r) => r.cells.some((c) => c.trim()));
  if (all.length !== rows.length)
    warnings.push(
      "Se omitieron " + (all.length - rows.length) + " filas vacías.",
    );
  if (!rows.length) throw new Error("El CSV está vacío.");
  const header = rows.shift();
  if (!header.cells.length || header.cells.length > 100)
    throw new Error("El CSV debe tener entre 1 y 100 columnas.");
  if (rows.length > MAX_TODO_IMPORT_ROWS)
    throw new Error("El CSV tiene más de 1000 filas de datos.");
  if (!rows.length)
    throw new Error("El CSV tiene encabezados, pero no tiene tareas.");
  const columns = header.cells.map(
    (c, i) => c.trim() || "Columna " + (i + 1) + " (sin encabezado)",
  );
  if (header.cells.some((c) => !c.trim()))
    warnings.push(
      "Hay columnas sin encabezado; elige sus campos por posición.",
    );
  const uneven = rows.filter((r) => r.cells.length !== columns.length).length;
  if (uneven)
    warnings.push(
      uneven +
        " filas tienen un número de columnas diferente al encabezado y requieren corrección.",
    );
  return { format: "csv", columns, records: rows, warnings, separator };
}
function todoImportISO(y, m, d) {
  const s =
    String(y).padStart(4, "0") +
    "-" +
    String(m).padStart(2, "0") +
    "-" +
    String(d).padStart(2, "0");
  return y >= 1 &&
    y <= 9999 &&
    m >= 1 &&
    m <= 12 &&
    d >= 1 &&
    d <= 31 &&
    Number.isFinite(Date.parse(s + "T12:00:00Z")) &&
    new Date(s + "T12:00:00Z").toISOString().slice(0, 10) === s
    ? s
    : "";
}
function todoImportDate(value, order, warnings) {
  const s = String(value || "").trim();
  if (!s) return { value: "", issue: "" };
  let m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/,
  );
  if (m) {
    if (m[4] && (+m[4] > 23 || +m[5] > 59 || (m[6] && +m[6] > 60)))
      return { value: "", issue: "La hora de la fecha no es válida." };
    const d = todoImportISO(+m[1], +m[2], +m[3]);
    if (d && m[4])
      warnings.push(
        "Se conserva el día escrito; la hora y la zona horaria no se importan.",
      );
    return { value: d, issue: d ? "" : "La fecha no es válida." };
  }
  m = s.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/);
  if (m) {
    if (!["dmy", "mdy", "ymd"].includes(order))
      return {
        value: "",
        issue: "Elige el orden de día, mes y año para esta fecha.",
      };
    let y, month, d;
    if (order === "dmy") {
      d = +m[1];
      month = +m[2];
      y = +m[3];
      if (m[3].length !== 4)
        return { value: "", issue: "El año debe tener cuatro cifras." };
    } else if (order === "mdy") {
      month = +m[1];
      d = +m[2];
      y = +m[3];
      if (m[3].length !== 4)
        return { value: "", issue: "El año debe tener cuatro cifras." };
    } else {
      y = +m[1];
      month = +m[2];
      d = +m[3];
      if (m[1].length !== 4)
        return { value: "", issue: "El año debe tener cuatro cifras." };
    }
    const iso = todoImportISO(y, month, d);
    return {
      value: iso,
      issue: iso ? "" : "La fecha no es válida para el orden elegido.",
    };
  }
  // Notion exports unambiguous written dates in English, depending on workspace language.
  const months = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };
  const lower = s.toLocaleLowerCase("es");
  m =
    lower.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/) ||
    lower.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/);
  if (m) {
    const firstIsMonth = Boolean(months[m[1]]),
      month = months[firstIsMonth ? m[1] : m[2]],
      d = +(firstIsMonth ? m[2] : m[1]),
      iso = month ? todoImportISO(+m[3], month, d) : "";
    return { value: iso, issue: iso ? "" : "La fecha escrita no es válida." };
  }
  return {
    value: "",
    issue:
      "Fecha no compatible. Usa AAAA-MM-DD o una fecha numérica con el orden indicado; los intervalos deben separarse.",
  };
}
function todoImportText(v) {
  return String(v || "").replace(/\\([nN,;\\])/g, (_, c) =>
    c === "n" || c === "N" ? "\n" : c,
  );
}
function todoImportICSProperty(line, row) {
  let quote = false,
    colon = -1;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quote = !quote;
    else if (line[i] === ":" && !quote) {
      colon = i;
      break;
    }
  }
  if (colon < 1)
    throw new Error(
      "iCalendar inválido: falta el separador de una propiedad en la línea " +
        row +
        ".",
    );
  const head = line.slice(0, colon),
    name = head.split(";")[0].toUpperCase();
  if (!/^[A-Z0-9-]+$/.test(name))
    throw new Error("Propiedad iCalendar inválida en la línea " + row + ".");
  return {
    name,
    value: line.slice(colon + 1),
    params: head.slice(name.length),
  };
}
function todoImportICSDate(p, warnings) {
  if (!p) return { value: "", issue: "" };
  const s = p.value,
    m = s.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m || (m[4] && (+m[4] > 23 || +m[5] > 59 || +m[6] > 60)))
    return { value: "", issue: "Fecha iCalendar no válida." };
  if (/;VALUE=DATE(?:;|$)/i.test(p.params) && m[4])
    return {
      value: "",
      issue: "El calendario mezcla una fecha de día completo con una hora.",
    };
  const iso = todoImportISO(+m[1], +m[2], +m[3]);
  if (iso && m[4])
    warnings.push(
      "Se conserva el día escrito; la hora y la zona horaria no se importan.",
    );
  return { value: iso, issue: iso ? "" : "Fecha iCalendar no válida." };
}
function todoImportICSRecord(part, method) {
  const warnings = [],
    issues = [],
    props = part.props,
    get = (name) => (props[name] || [])[0];
  for (const name of [
    "SUMMARY",
    "DTSTART",
    "DUE",
    "STATUS",
    "COMPLETED",
    "DESCRIPTION",
    "UID",
    "PRIORITY",
  ])
    if ((props[name] || []).length > 1)
      issues.push(
        "La propiedad " +
          name +
          " aparece más de una vez. Corrige el calendario.",
      );
  const title = todoImportText(get("SUMMARY")?.value).trim(),
    status = (get("STATUS")?.value || "").toUpperCase();
  const skip =
    method === "CANCEL" ||
    status === "CANCELLED" ||
    Boolean(get("RECURRENCE-ID"));
  if (method === "CANCEL" || status === "CANCELLED")
    issues.push("Registro cancelado: no se convierte en tarea.");
  if (get("RECURRENCE-ID"))
    issues.push(
      "Excepción de una serie recurrente: no se convierte automáticamente en tarea.",
    );
  if (get("RRULE") || get("RDATE") || get("EXDATE"))
    warnings.push(
      "Serie recurrente: solo se propone el evento o tarea base; no se generan repeticiones ni excepciones.",
    );
  if (part.type === "VEVENT")
    warnings.push("Se toma el inicio del evento como fecha de la tarea.");
  const d = todoImportICSDate(
    part.type === "VTODO" ? get("DUE") || get("DTSTART") : get("DTSTART"),
    warnings,
  );
  if (d.issue) issues.push(d.issue);
  const c = todoImportICSDate(get("COMPLETED"), warnings);
  if (c.issue) issues.push("Fecha de cierre: " + c.issue);
  let done =
      part.type === "VTODO" &&
      (status === "COMPLETED" || (!status && Boolean(get("COMPLETED")))),
    completedAt = done ? c.value || today() : "";
  if (done && !c.value)
    warnings.push(
      "El calendario marca la tarea terminada sin fecha de cierre; se registrará la fecha de hoy.",
    );
  if (!done && get("COMPLETED"))
    issues.push("La fecha de cierre no coincide con el estado de la tarea.");
  if (status === "TENTATIVE")
    warnings.push("El calendario marca este evento como provisional.");
  const states =
    part.type === "VTODO"
      ? ["COMPLETED", "NEEDS-ACTION", "IN-PROCESS", "CANCELLED"]
      : ["CONFIRMED", "TENTATIVE", "CANCELLED"];
  if (status && !states.includes(status))
    issues.push("Estado no válido para " + part.type + ": revisa el archivo.");
  let priority = "media";
  const pv = get("PRIORITY")?.value;
  if (pv !== undefined && pv !== "") {
    if (!/^[0-9]$/.test(pv)) issues.push("Prioridad iCalendar no válida.");
    else
      priority = +pv === 0 || +pv === 5 ? "media" : +pv < 5 ? "alta" : "baja";
  }
  const privateNotes = todoImportText(get("DESCRIPTION")?.value),
    source = get("UID")?.value || JSON.stringify([title, d.value, part.type]);
  return {
    title,
    due: d.value,
    priority,
    done,
    completedAt,
    privateNotes,
    sourceKey: todoImportFingerprint("ics", part.type + "\n" + source),
    warnings,
    issues,
    skip,
  };
}
function todoImportParseICS(text) {
  const raw = text.split(/\r\n|\n|\r/),
    lines = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    if (/^[ \t]/.test(s)) {
      if (!lines.length)
        throw new Error("iCalendar inválido: continuación sin propiedad.");
      lines[lines.length - 1].text += s.slice(1);
    } else if (s !== "") lines.push({ text: s, row: i + 1 });
  }
  const stack = [],
    parts = [];
  let active = null,
    method = "",
    calendars = 0;
  for (const line of lines) {
    const p = todoImportICSProperty(line.text, line.row);
    if (p.name === "BEGIN") {
      const name = p.value.toUpperCase();
      if (name === "VCALENDAR") {
        if (stack.length || calendars)
          throw new Error(
            "Selecciona un archivo que contenga un solo calendario.",
          );
        calendars++;
      } else if (!stack.length)
        throw new Error("El archivo iCalendar necesita BEGIN:VCALENDAR.");
      if (["VEVENT", "VTODO"].includes(name)) {
        if (stack.length !== 1 || stack[0] !== "VCALENDAR")
          throw new Error("Estructura de calendario no compatible.");
        if (parts.length >= MAX_TODO_IMPORT_ROWS)
          throw new Error("El calendario tiene más de 1000 eventos o tareas.");
        active = { type: name, props: Object.create(null) };
        parts.push(active);
      }
      stack.push(name);
      continue;
    }
    if (p.name === "END") {
      const name = p.value.toUpperCase();
      if (stack.pop() !== name)
        throw new Error(
          "iCalendar inválido: los componentes no cierran en el orden correcto.",
        );
      if (["VEVENT", "VTODO"].includes(name)) active = null;
      continue;
    }
    if (!stack.length)
      throw new Error(
        "iCalendar inválido: hay propiedades fuera del calendario.",
      );
    if (stack.length === 1 && p.name === "METHOD")
      method = p.value.toUpperCase();
    if (active && stack.at(-1) === active.type) {
      if (!active.props[p.name]) active.props[p.name] = [];
      active.props[p.name].push(p);
    }
  }
  if (stack.length || calendars !== 1)
    throw new Error("El archivo iCalendar está incompleto.");
  if (!parts.length)
    throw new Error("El calendario no tiene eventos VEVENT ni tareas VTODO.");
  return {
    format: "ics",
    columns: [],
    records: parts.map((p) => todoImportICSRecord(p, method)),
    warnings: [
      "Se importan títulos, fechas, prioridad y estado. No se importan horarios, alarmas, asistentes, organizadores, enlaces ni adjuntos.",
    ],
  };
}
function parseTodoImport(text, format) {
  const source = todoImportInput(text);
  if (format === "csv") return todoImportParseCSV(source);
  if (format === "ics") return todoImportParseICS(source);
  throw new Error("Selecciona un archivo CSV o iCalendar (.ics).");
}
function todoImportNormal(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim()
    .replace(/\s+/g, " ");
}
function mapTodoImport(parsed, mapping = {}, options = {}) {
  if (
    !parsed ||
    !["csv", "ics"].includes(parsed.format) ||
    !Array.isArray(parsed.records) ||
    parsed.records.length > MAX_TODO_IMPORT_ROWS
  )
    throw new Error("La vista previa de importación no es válida.");
  return parsed.records.map((row, index) => {
    let c;
    if (parsed.format === "ics")
      c = {
        title: row.title,
        due: row.due,
        priority: row.priority,
        done: row.done,
        completedAt: row.completedAt,
        privateNotes: options.includeNotes === true ? row.privateNotes : "",
        sourceKey: row.sourceKey,
        warnings: [...(row.warnings || [])],
        issues: [...(row.issues || [])],
        skip: row.skip === true,
        index,
      };
    else {
      if (!Array.isArray(row.cells)) throw new Error("Fila CSV inválida.");
      const value = (key) => {
          const raw = mapping[key],
            i =
              typeof raw === "number"
                ? raw
                : typeof raw === "string" && /^\d+$/.test(raw)
                  ? +raw
                  : -1;
          return Number.isInteger(i) && i >= 0 && i < row.cells.length
            ? row.cells[i]
            : "";
        },
        warnings = [],
        issues = [];
      if (row.cells.length !== parsed.columns.length)
        issues.push(
          "La fila " +
            row.row +
            " no coincide con el número de columnas del encabezado.",
        );
      const rawTitle = value("title"),
        d = todoImportDate(value("due"), options.dateOrder, warnings);
      if (d.issue) issues.push(d.issue);
      const p = todoImportNormal(value("priority"));
      let priority = "media";
      if (p) {
        if (["alta", "high", "urgent", "urgente", "1"].includes(p))
          priority = "alta";
        else if (["media", "medium", "normal", "2"].includes(p))
          priority = "media";
        else if (["baja", "low", "3"].includes(p)) priority = "baja";
        else
          issues.push(
            "Prioridad no reconocida. Usa alta, media o baja, o deja esa columna sin importar.",
          );
      }
      const status = todoImportNormal(value("status"));
      let done = false;
      if (status) {
        if (
          [
            "true",
            "1",
            "yes",
            "si",
            "done",
            "completed",
            "complete",
            "hecho",
            "hecha",
            "terminado",
            "terminada",
            "finalizado",
            "finalizada",
            "completado",
            "completada",
            "✔",
            "✓",
            "checked",
          ].includes(status)
        )
          done = true;
        else if (
          ![
            "false",
            "0",
            "no",
            "todo",
            "to do",
            "pending",
            "pendiente",
            "por hacer",
            "por trabajar",
            "not started",
            "en proceso",
            "en-proceso",
            "in progress",
            "in-progress",
            "needs-action",
            "unchecked",
          ].includes(status)
        )
          issues.push(
            "Estado no reconocido. Usa pendiente o completada, o deja esa columna sin importar.",
          );
      }
      if (done)
        warnings.push(
          "La tarea se marca terminada; se registrará hoy como fecha de cierre.",
        );
      c = {
        title: rawTitle.trim(),
        due: d.value,
        priority,
        done,
        completedAt: done ? today() : "",
        privateNotes: options.includeNotes === true ? value("notes") : "",
        sourceKey: todoImportFingerprint("csv", JSON.stringify(row.cells)),
        warnings,
        issues,
        skip: false,
        index,
        row: row.row,
      };
    }
    if (typeof c.title !== "string" || !c.title.trim())
      c.issues.push(
        "La tarea necesita un título. Elige una columna de título o corrige el archivo.",
      );
    for (const [key, label] of [
      ["title", "El título"],
      ["privateNotes", "La nota"],
    ])
      if (typeof c[key] !== "string" || c[key].length > 16000)
        c.issues.push(
          label + " supera el límite de 16 000 caracteres o no es texto.",
        );
    return c;
  });
}
function todoImportEquivalent(c) {
  return (
    String(c.title || "")
      .normalize("NFKC")
      .toLocaleLowerCase("es")
      .trim()
      .replace(/\s+/g, " ") +
    "\n" +
    c.due
  );
}
function todoImportDuplicates(state, candidates) {
  if (!state || !Array.isArray(state.todos) || !Array.isArray(candidates))
    throw new Error(
      "No se puede comparar la importación con las tareas actuales.",
    );
  const keys = new Set(state.todos.map((t) => t.importKey).filter(Boolean)),
    equiv = new Set(state.todos.map(todoImportEquivalent)),
    duplicates = [];
  for (const c of candidates) {
    if (c.skip || c.issues?.length) continue;
    const key = c.sourceKey,
      eq = todoImportEquivalent(c);
    if ((key && keys.has(key)) || equiv.has(eq)) duplicates.push(c.index);
    else {
      if (key) keys.add(key);
      equiv.add(eq);
    }
  }
  return duplicates;
}
function mergeTodoImport(state, candidates, selectedIndices) {
  if (
    !Array.isArray(candidates) ||
    candidates.length > MAX_TODO_IMPORT_ROWS ||
    !Array.isArray(selectedIndices) ||
    selectedIndices.length > MAX_TODO_IMPORT_ROWS
  )
    throw new Error("Selecciona hasta 1000 tareas de una vista previa válida.");
  const selected = new Set(selectedIndices);
  if (
    selected.size !== selectedIndices.length ||
    selectedIndices.some((i) => !Number.isInteger(i))
  )
    throw new Error("La selección de tareas no es válida.");
  const byIndex = new Map(candidates.map((c) => [c.index, c]));
  if (
    byIndex.size !== candidates.length ||
    selectedIndices.some((i) => !byIndex.has(i))
  )
    throw new Error("La selección no coincide con la vista previa.");
  const next = clone(state),
    keys = new Set(next.todos.map((t) => t.importKey).filter(Boolean)),
    equiv = new Set(next.todos.map(todoImportEquivalent));
  let added = 0,
    duplicates = 0;
  for (const index of selectedIndices) {
    const c = byIndex.get(index);
    if (c.skip || !Array.isArray(c.issues) || c.issues.length)
      throw new Error(
        "Hay tareas seleccionadas con errores. Corrige el archivo antes de importarlas.",
      );
    if (
      typeof c.sourceKey !== "string" ||
      !/^(csv|ics)-[a-z0-9-]{1,70}$/.test(c.sourceKey)
    )
      throw new Error("El origen de una tarea importada no es válido.");
    const eq = todoImportEquivalent(c);
    if (keys.has(c.sourceKey) || equiv.has(eq)) {
      duplicates++;
      continue;
    }
    next.todos.push({
      id: uid(),
      title: c.title,
      date: today(),
      due: c.due,
      priority: c.priority,
      done: c.done,
      completedAt: c.completedAt,
      actionId: "",
      milestoneId: "",
      privateNotes: c.privateNotes,
      importKey: c.sourceKey,
    });
    keys.add(c.sourceKey);
    equiv.add(eq);
    added++;
  }
  if (next.todos.length > 3000)
    throw new Error(
      "La importación supera el límite de 3000 tareas. No se guardó ningún cambio.",
    );
  return { state: validate(next), added, duplicates };
}
