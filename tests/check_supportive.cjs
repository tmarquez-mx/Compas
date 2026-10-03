"use strict";
const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const { functionSource, statementSource } = require("./support/source.cjs");
const html = fs.readFileSync(
  process.argv[2] || path.resolve(__dirname, "../dist/index.html"),
  "utf8",
);
const core = html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1],
  ui = html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1];
const sandbox = {
  TextEncoder,
  TextDecoder,
  Uint8Array,
  DataView,
  Date,
  Math,
  JSON,
  Set,
  Map,
  Intl,
};
vm.createContext(sandbox);
vm.runInContext(core, sandbox);
const C = sandbox.CompasCore;
sandbox.C = C;
sandbox.e = C.esc;
sandbox.fmt = C.fmt;
for (const name of [
  "THEMES",
  "FRAME_STYLES",
  "DECORATIONS",
  "MODULE_HELP",
  "ACTION_HELP",
])
  vm.runInContext(
    statementSource(ui, ui.indexOf("const " + name + " ="), name),
    sandbox,
  );
for (const name of [
  "normalizeAppearance",
  "ornamentSVG",
  "completedStep",
  "celebrationBanner",
  "buttonHelp",
  "btn",
  "todoSort",
  "renderTodo",
  "renderTime",
  "renderJournal",
  "reflectionForm",
])
  vm.runInContext(functionSource(ui, name), sandbox);
let count = 0;
const check = (name, fn) => {
  fn();
  count++;
  console.log("OK " + name);
};
const run = (code) => vm.runInContext(code, sandbox);
check(
  "Apariencia anterior conserva tema y foto y recibe opciones nuevas",
  () => {
    sandbox.saved = { theme: "noche", photoMode: "background" };
    const result = run("normalizeAppearance(saved)");
    assert.equal(result.theme, "noche");
    assert.equal(result.photoMode, "background");
    assert.equal(result.frame, "sencillo");
    assert.equal(result.decoration, "none");
    assert.equal(result.celebrate, true);
  },
);
check(
  "Preferencias desconocidas no se convierten en atributos ni adornos",
  () => {
    sandbox.saved = {
      theme: "<script>",
      photoMode: "x",
      frame: '" onerror="x',
      decoration: "<svg onload=x>",
      celebrate: "false",
    };
    const result = run("normalizeAppearance(saved)");
    assert.equal(result.theme, "aire");
    assert.equal(result.frame, "sencillo");
    assert.equal(result.decoration, "none");
    assert.equal(run("ornamentSVG(saved.decoration)"), "");
  },
);
check("La preferencia de omitir invitaciones se conserva", () => {
  sandbox.saved = {
    theme: "cielo",
    photoMode: "frame",
    frame: "jardin",
    decoration: "flores",
    celebrate: false,
  };
  const result = run("normalizeAppearance(saved)");
  assert.equal(result.celebrate, false);
  assert.equal(result.frame, "jardin");
  assert.equal(result.decoration, "flores");
});
check(
  "Terminar una tarea reconoce el paso sin cerrar su producto ni compromiso",
  () => {
    sandbox.before = C.demo();
    sandbox.after = C.setTodoDone(
      sandbox.before,
      sandbox.before.todos[0].id,
      true,
    );
    assert.equal(
      run("completedStep(before,after)"),
      sandbox.before.todos[0].title,
    );
    assert.equal(
      JSON.stringify(sandbox.after.routeProgress),
      JSON.stringify(sandbox.before.routeProgress),
    );
    assert.equal(
      JSON.stringify(sandbox.after.actions),
      JSON.stringify(sandbox.before.actions),
    );
  },
);
check(
  "Editar, reabrir o importar tareas terminadas no crea un logro nuevo",
  () => {
    sandbox.before = C.demo();
    sandbox.after = C.clone(sandbox.before);
    sandbox.after.todos[0].title = "Otro texto";
    assert.equal(run("completedStep(before,after)"), "");
    sandbox.after.todos.push({
      ...sandbox.after.todos[0],
      id: "importada-finalizada",
      done: true,
    });
    assert.equal(run("completedStep(before,after)"), "");
    sandbox.before = C.setTodoDone(
      sandbox.before,
      sandbox.before.todos[0].id,
      true,
    );
    sandbox.after = C.setTodoDone(
      sandbox.before,
      sandbox.before.todos[0].id,
      false,
    );
    assert.equal(run("completedStep(before,after)"), "");
  },
);
check(
  "Completar producto o compromiso también permite reconocer el paso",
  () => {
    sandbox.before = C.demo();
    sandbox.after = C.clone(sandbox.before);
    sandbox.after.routeProgress[0].status = "resuelto";
    assert.equal(
      run("completedStep(before,after)"),
      C.milestone(sandbox.after.routeProgress[0].id).title,
    );
    sandbox.after = C.clone(sandbox.before);
    sandbox.after.actions[0].status = "resuelto";
    assert.equal(
      run("completedStep(before,after)"),
      sandbox.after.actions[0].description,
    );
  },
);
check("El reconocimiento escapa el texto y puede omitirse", () => {
  sandbox.celebration = "<img src=x onerror=x>";
  sandbox.appearance = { celebrate: true };
  assert(!run("celebrationBanner()").includes("<img"));
  assert(run("celebrationBanner()").includes("&lt;img"));
  sandbox.appearance.celebrate = false;
  assert.equal(run("celebrationBanner()"), "");
});
check(
  "Diario conserva reflexiones antiguas y entradas nuevas al respaldar",
  () => {
    const input = C.demo(),
      old = JSON.stringify(input.reflections);
    input.reflections.push({
      id: "diario-ficticio",
      date: C.today(),
      text: "Hoy escribí una frase y fue suficiente.",
    });
    const restored = C.restore(C.backup(input));
    assert.equal(JSON.stringify(restored.reflections.slice(0, -1)), old);
    assert.equal(
      restored.reflections.at(-1).text,
      input.reflections.at(-1).text,
    );
  },
);
check("El diario no aparece en reportes HTML ni Excel", () => {
  const input = C.demo(),
    secret = "DIARIO_PRIVADO_381759";
  input.reflections.push({
    id: "diario-secreto",
    date: C.today(),
    text: secret,
  });
  const report = C.makeShare(input, {
    project: true,
    names: true,
    actions: input.actions.map((x) => x.id),
    sessions: input.sessions.map((x) => x.id),
    decisions: input.decisions.map((x) => x.id),
    route: input.routeProgress.map((x) => x.id),
  });
  assert(!JSON.stringify(report).includes(secret));
  assert(!C.reportHTML(report).includes(secret));
  assert(!Buffer.from(C.excelBytes(report)).includes(Buffer.from(secret)));
});
check(
  "El diario conserva páginas escapadas y ToDo ofrece la dedicación opcional sin cambiar datos",
  () => {
    sandbox.state = C.demo();
    sandbox.timeExpanded = false;
    sandbox.timePeriod = "todo";
    sandbox.todoFilter = "pendientes";
    sandbox.state.reflections = [
      {
        id: "ficticia",
        date: C.today(),
        text: "<script>texto privado</script>",
      },
    ];
    sandbox.head = () => "";
    sandbox.empty = () => "";
    const before = JSON.stringify(sandbox.state);
    const journal = run("renderJournal()");
    assert(journal.includes("&lt;script&gt;"));
    assert(!journal.includes("<script>"));
    assert(!journal.includes("Registrar dedicación"));
    assert(!journal.includes('id="time-period"'));
    const todo = run("renderTodo()");
    assert(todo.includes('<details class="todo-time">'));
    assert(todo.includes("Registrar dedicación (opcional)"));
    assert(todo.includes('id="time-period"'));
    assert(!todo.includes("texto privado"));
    const existing = sandbox.state.timeEntries[0];
    assert(todo.includes('data-id="' + existing.id + '"'));
    sandbox.timeExpanded = true;
    assert(run("renderTodo()").includes('<details class="todo-time" open>'));
    assert.equal(JSON.stringify(sandbox.state), before);
  },
);
check(
  "Una página nueva del diario puede guardarse y una antigua puede editarse o eliminarse",
  () => {
    sandbox.state = C.demo();
    let form, stored;
    sandbox.field = () => "";
    sandbox.openForm = (...args) => (form = args);
    sandbox.upsert = (key, value) => (stored = { key, value });
    sandbox.remove = (key, id) => (stored = { key, id });
    run("reflectionForm()");
    assert.equal(form[4], null);
    form[3]({ date: C.today(), text: "Una idea para mañana" });
    assert.equal(stored.key, "reflections");
    assert.equal(stored.value.text, "Una idea para mañana");
    sandbox.entryId = sandbox.state.reflections[0].id;
    run("reflectionForm(entryId)");
    form[4]();
    assert.equal(stored.id, sandbox.entryId);
  },
);
check(
  "Ayuda de botones distingue diario, respaldo, selección y guardado",
  () => {
    const help = (dataset, type = "button", text = "") => {
      sandbox.button = {
        dataset,
        type,
        textContent: text,
        getAttribute: () => null,
      };
      return run("buttonHelp(button)");
    };
    assert(help({ do: "reflection" }).includes("diario"));
    assert(help({ do: "backup" }).includes("completa"));
    assert(help({ view: "reportes" }).includes("quedan fuera"));
    assert(help({}, "submit").includes("Guarda"));
    assert(help({}, "button", "Deshacer").includes("Revierte"));
  },
);
console.log(count + " comprobaciones de acompañamiento pasaron.");
