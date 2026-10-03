"use strict";
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { functionSource } = require("./support/source.cjs");
const html = fs.readFileSync(
    process.argv[2] || path.resolve(__dirname, "../dist/index.html"),
    "utf8",
  ),
  core = html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1],
  ui = html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1],
  sandbox = {
    TextEncoder,
    TextDecoder,
    Uint8Array,
    DataView,
    Date,
    Math,
    Set,
    Map,
    JSON,
    Intl,
  };
vm.createContext(sandbox);
vm.runInContext(core, sandbox);
const C = sandbox.CompasCore,
  now = new Date("2026-10-03T18:21:34.789Z"),
  task = (id, title, due, extra = {}) => ({
    id,
    title,
    due,
    done: false,
    ...extra,
  }),
  state = (todos) => ({
    project: {
      id: "private-project-92",
      title: "PROYECTO_PRIVADO",
      privateNotes: "PROYECTO_SECRETO",
    },
    todos,
    reflections: [{ text: "DIARIO_SECRETO" }],
  }),
  unfold = (text) => text.replace(/\r\n[ \t]/g, ""),
  exportOne = (due, title = "Revisar introducción") =>
    C.calendarICS(state([task("task-1", title, due)]), ["task-1"], now);
let count = 0;
function check(label, fn) {
  fn();
  count++;
  console.log("OK " + label);
}

check("Calendario ofrece sólo títulos y fechas de tareas pendientes", () => {
  const input = state([
    task("a", "Pendiente", "2026-10-06", {
      privateNotes: "NOTA_SECRETA",
      actionId: "compromiso-privado",
    }),
    task("b", "Terminada", "2026-10-07", { done: true }),
    task("c", "Sin fecha", ""),
  ]);
  assert.equal(
    JSON.stringify(C.calendarCandidates(input)),
    JSON.stringify([{ id: "a", title: "Pendiente", due: "2026-10-06" }]),
  );
});
check(
  "Cada selección genera un VEVENT de un día, sin bloquear disponibilidad",
  () => {
    const text = exportOne("2026-10-06");
    assert(text.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n"));
    assert(text.endsWith("END:VCALENDAR\r\n"));
    assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1);
    assert(
      text.includes(
        "DTSTART;VALUE=DATE:20261006\r\nDTEND;VALUE=DATE:20261007\r\n",
      ),
    );
    assert(text.includes("TRANSP:TRANSPARENT\r\n"));
    assert(!text.includes("VTODO"));
  },
);
check(
  "Fecha de exportación usa DTSTAMP UTC real, independiente del vencimiento",
  () => {
    assert(exportOne("2026-10-06").includes("DTSTAMP:20261003T182134Z\r\n"));
    assert.throws(() =>
      C.calendarICS(
        state([task("a", "Tarea", "2026-10-06")]),
        ["a"],
        "inválida",
      ),
    );
  },
);
check(
  "La fecha final avanza con UTC entre meses, años y años bisiestos",
  () => {
    for (const [due, end] of [
      ["2026-12-31", "20270101"],
      ["2024-02-28", "20240229"],
      ["2024-02-29", "20240301"],
      ["2026-02-28", "20260301"],
      ["2026-03-08", "20260309"],
      ["0001-12-31", "00020101"],
    ])
      assert(exportOne(due).includes("DTEND;VALUE=DATE:" + end + "\r\n"), due);
  },
);
check("El último día del año 9999 conserva duración válida de un día", () => {
  const text = exportOne("9999-12-31");
  assert(text.includes("DTSTART;VALUE=DATE:99991231\r\nDURATION:P1D\r\n"));
  assert(!text.includes("DTEND:"));
  assert(!text.includes("10000"));
});
check(
  "Fechas imposibles, incompletas y fuera del calendario se rechazan",
  () => {
    for (const due of [
      "2026-02-29",
      "2026-02-31",
      "2026-13-01",
      "2026-10-6",
      "0000-01-01",
      "10000-01-01",
      "2026-10-06\r\nBEGIN:VEVENT",
    ])
      assert.throws(() => exportOne(due), /título y la fecha/);
  },
);
check(
  "Selección excluye tareas no elegidas y terminadas aunque se pidan sus ids",
  () => {
    const input = state([
        task("a", "Sí", "2026-10-06"),
        task("b", "NO_ELEGIDA", "2026-10-07"),
        task("c", "TERMINADA", "2026-10-07", { done: true }),
      ]),
      text = C.calendarICS(input, ["a", "c", "inventado"], now);
    assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1);
    assert(!text.includes("NO_ELEGIDA"));
    assert(!text.includes("TERMINADA"));
  },
);
check(
  "No se exporta sin una selección válida ni se crean fechas para tareas sin fecha",
  () => {
    const input = state([task("a", "Sin fecha", "")]);
    for (const selected of [[], ["a"], ["desconocida"]])
      assert.throws(
        () => C.calendarICS(input, selected, now),
        /pendiente con fecha/,
      );
    assert.throws(() => C.calendarICS(input, null, now), /Selecciona/);
  },
);
check(
  "El UID conserva identidad al cambiar título, fecha o momento de exportación",
  () => {
    const first = unfold(exportOne("2026-10-06")).match(/^UID:(.+)$/m)[1],
      changed = C.calendarICS(
        state([task("task-1", "Título nuevo", "2026-11-06")]),
        ["task-1"],
        new Date("2026-10-04T00:00:00Z"),
      );
    assert.equal(unfold(changed).match(/^UID:(.+)$/m)[1], first);
    const expected =
      "compas-" +
      crypto
        .createHash("sha256")
        .update("private-project-92\ntask-1")
        .digest("hex")
        .slice(0, 24) +
      "@compas.invalid";
    assert.equal(first, expected);
    assert(!first.includes("private-project-92"));
    assert(!first.includes("task-1"));
  },
);
check("UID separa tareas y bitácoras sin copiar sus identificadores", () => {
  const input = state([
      task("a", "Uno", "2026-10-06"),
      task("b", "Dos", "2026-10-06"),
    ]),
    ids = unfold(C.calendarICS(input, ["a", "b"], now)).match(/^UID:.+$/gm);
  assert.equal(new Set(ids).size, 2);
  const other = state([task("a", "Uno", "2026-10-06")]);
  other.project.id = "another-project";
  assert(
    !ids.includes(
      unfold(C.calendarICS(other, ["a"], now)).match(/^UID:.+$/m)[0],
    ),
  );
});
check(
  "ICS escapa comas, punto y coma, barras y todos los saltos de línea",
  () => {
    const text = unfold(
      exportOne(
        "2026-10-06",
        "Revisar: uno, dos; C:\\tesis\r\nTres\rCuatro\nCinco",
      ),
    );
    assert(
      text.includes(
        "SUMMARY:Revisar: uno\\, dos\\; C:\\\\tesis\\nTres\\nCuatro\\nCinco\r\n",
      ),
    );
    assert.equal((text.match(/BEGIN:VEVENT/g) || []).length, 1);
  },
);
check(
  "Un título con sintaxis ICS sigue siendo texto y elimina controles inválidos",
  () => {
    const title =
        "Paso\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nATTENDEE:otra@example.invalid\u0000\u0001\u0007",
      text = unfold(exportOne("2026-10-06", title));
    assert.equal((text.match(/^BEGIN:VEVENT\r?$/gm) || []).length, 1);
    assert.equal((text.match(/^END:VEVENT\r?$/gm) || []).length, 1);
    assert(!/^ATTENDEE:/m.test(text));
    assert(!text.includes("\u0000"));
  },
);
check(
  "Plegado limita cada línea física a 75 octetos sin cortar Unicode",
  () => {
    const title = "🪴 árbol, útil; 漢字 ".repeat(70),
      text = exportOne("2026-10-06", title);
    for (const line of text.split("\r\n")) {
      assert(
        Buffer.byteLength(line, "utf8") <= 75,
        Buffer.byteLength(line, "utf8"),
      );
      assert.equal(
        new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(line)),
        line,
      );
    }
    const parsed = C.parseTodoImport(text, "ics");
    assert.equal(parsed.records.length, 1);
    assert.equal(parsed.records[0].title, title.trim());
    assert.equal(parsed.records[0].due, "2026-10-06");
  },
);
check("Todas las líneas usan CRLF y terminan con CRLF", () => {
  const text = exportOne("2026-10-06", "Título largo ".repeat(50));
  assert(!text.replace(/\r\n/g, "").includes("\r"));
  assert(!text.replace(/\r\n/g, "").includes("\n"));
  assert(text.endsWith("\r\n"));
});
check(
  "Exportación nunca incluye notas, diario, proyecto ni vínculos privados",
  () => {
    const input = state([
        task("a", "Paso elegido", "2026-10-06", {
          privateNotes: "NOTA_SECRETA",
          actionId: "COMPROMISO_PRIVADO",
          milestoneId: "HITO_PRIVADO",
          importKey: "ORIGEN_PRIVADO",
          url: "https://privado.invalid",
        }),
      ]),
      text = C.calendarICS(input, ["a"], now);
    for (const secret of [
      "NOTA_SECRETA",
      "DIARIO_SECRETO",
      "PROYECTO_PRIVADO",
      "PROYECTO_SECRETO",
      "COMPROMISO_PRIVADO",
      "HITO_PRIVADO",
      "ORIGEN_PRIVADO",
      "privado.invalid",
      "private-project-92",
    ])
      assert(!text.includes(secret), secret);
    for (const property of [
      "DESCRIPTION",
      "URL",
      "ATTENDEE",
      "ORGANIZER",
      "LOCATION",
      "VALARM",
    ])
      assert(!text.includes(property + ":"));
  },
);
check(
  "Generar el calendario y la selección no modifica el estado ni el respaldo",
  () => {
    const input = state([task("a", "Paso", "2026-10-06")]),
      before = JSON.stringify(input);
    C.calendarCandidates(input);
    C.calendarICS(input, ["a"], now);
    assert.equal(JSON.stringify(input), before);
    const full = C.demo(),
      backupData = JSON.parse(C.backup(full)).data;
    C.calendarICS(
      full,
      C.calendarCandidates(full).map((item) => item.id),
      now,
    );
    assert.deepEqual(JSON.parse(C.backup(full)).data, backupData);
  },
);
check(
  "Calendario admite 3000 tareas sin límite artificial de importación",
  () => {
    const input = state(
        Array.from({ length: 3000 }, (_, i) =>
          task("task-" + i, "Paso " + i, "2026-10-06"),
        ),
      ),
      text = C.calendarICS(
        input,
        input.todos.map((item) => item.id),
        now,
      );
    assert.equal((text.match(/^BEGIN:VEVENT\r?$/gm) || []).length, 3000);
    input.todos.push(task("extra", "Extra", "2026-10-06"));
    assert.throws(() => C.calendarCandidates(input), /lista/);
  },
);
check(
  "Datos malformados no se convierten en propiedades del calendario",
  () => {
    for (const input of [
      null,
      {},
      state([task("id\r\nURL:evil", "Paso", "2026-10-06")]),
      state([task("a", "", "2026-10-06")]),
      state([task("a", "x".repeat(16001), "2026-10-06")]),
      state([
        task("a", "Paso", "2026-10-06"),
        task("a", "Duplicada", "2026-10-07"),
      ]),
    ])
      assert.throws(() => C.calendarCandidates(input));
  },
);

// Ejecuta el mismo asistente entregado para comprobar selección, errores y privacidad del HTML.
sandbox.C = C;
sandbox.e = C.esc;
sandbox.fmt = C.fmt;
sandbox.state = state([
  task("a", '<img src=x onerror="evil">', "2026-10-06", {
    privateNotes: "NOTA_SECRETA",
  }),
  task("b", "Sin fecha", ""),
]);
const elements = Object.create(null),
  editor = {
    innerHTML: "",
    open: false,
    classList: { remove() {}, add() {} },
    showModal() {
      this.open = true;
    },
    querySelectorAll() {
      return checkboxNodes;
    },
  },
  checkboxNodes = [{ value: "a", checked: true }];
elements.editor = editor;
for (const id of [
  "todo-calendar-count",
  "todo-calendar-download",
  "todo-calendar-error",
  "todo-calendar-status",
])
  elements[id] = {
    textContent: "",
    disabled: false,
    hidden: true,
    scrollIntoView() {},
  };
sandbox.$ = (id) => elements[id];
sandbox.document = { activeElement: { id: "calendar-trigger" } };
sandbox.dialogTrigger = null;
sandbox.download = (...args) => {
  sandbox.downloaded = args;
};
sandbox.toast = (text) => {
  sandbox.toastText = text;
};
vm.runInContext("let todoCalendarDraft = null;", sandbox);
for (const name of [
  "btn",
  "empty",
  "todoCalendarStart",
  "todoCalendarUpdate",
  "todoCalendarSelect",
  "todoCalendarDownload",
])
  vm.runInContext(functionSource(ui, name), sandbox);
const run = (code) => vm.runInContext(code, sandbox);
check(
  "Diálogo elige todas las candidatas inicialmente, escapa títulos y explica importación manual",
  () => {
    run("todoCalendarStart()");
    assert.equal(run("todoCalendarDraft.selected.size"), 1);
    assert.equal(editor.open, true);
    assert(editor.innerHTML.includes("&lt;img"));
    assert(!editor.innerHTML.includes("NOTA_SECRETA"));
    assert(editor.innerHTML.includes("Tienes 1 sin fecha"));
    assert(
      editor.innerHTML.includes("No hay conexión ni sincronización automática"),
    );
    for (const name of ["Google Calendar", "Calendario de Apple", "Outlook"])
      assert(editor.innerHTML.includes(name));
  },
);
check(
  "Quitar y recuperar selección actualiza checkboxes, conteo y botón",
  () => {
    run("todoCalendarSelect(false)");
    assert.equal(run("todoCalendarDraft.selected.size"), 0);
    assert.equal(checkboxNodes[0].checked, false);
    assert.equal(elements["todo-calendar-download"].disabled, true);
    assert(elements["todo-calendar-count"].textContent.startsWith("0 tareas"));
    run("todoCalendarSelect(true)");
    assert.equal(checkboxNodes[0].checked, true);
    assert.equal(elements["todo-calendar-download"].disabled, false);
  },
);
check(
  "Descarga usa .ics UTF-8 sin mutar estado y conserva instrucciones abiertas",
  () => {
    const before = JSON.stringify(sandbox.state);
    run("todoCalendarDownload()");
    assert.match(
      sandbox.downloaded[1],
      /^Compas-tareas-\d{4}-\d{2}-\d{2}\.ics$/,
    );
    assert.equal(sandbox.downloaded[2], "text/calendar;charset=utf-8");
    assert(sandbox.downloaded[0].includes("BEGIN:VEVENT"));
    assert(
      elements["todo-calendar-status"].textContent.includes(
        "Archivo preparado",
      ),
    );
    assert.equal(JSON.stringify(sandbox.state), before);
    assert.equal(editor.open, true);
  },
);
check(
  "Una selección vacía o desactualizada muestra error y no descarga",
  () => {
    sandbox.downloaded = null;
    run("todoCalendarSelect(false); todoCalendarDownload()");
    assert.equal(sandbox.downloaded, null);
    assert.equal(elements["todo-calendar-error"].hidden, false);
    assert(elements["todo-calendar-error"].textContent.includes("Selecciona"));
    run("todoCalendarSelect(true)");
    sandbox.state.todos[0].done = true;
    run("todoCalendarDownload()");
    assert.equal(sandbox.downloaded, null);
  },
);
check(
  "El asistente vacío invita a añadir fecha y mantiene descarga desactivada",
  () => {
    sandbox.state = state([task("a", "Sin fecha", "")]);
    run("todoCalendarStart()");
    assert(
      editor.innerHTML.includes("Aún no hay tareas para llevar al calendario"),
    );
    assert.equal(elements["todo-calendar-download"].disabled, true);
  },
);
console.log(count + " comprobaciones de calendario superadas.");
