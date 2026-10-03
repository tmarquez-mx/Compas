// Medianas de 7 ejecuciones tras 3 calentamientos; solo datos ficticios.
// Verifica equivalencia de estados y reportes antes de medir.
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert/strict"),
  { performance } = require("perf_hooks");
if (!process.argv[2]) {
  console.error("Uso: node scripts/benchmark.cjs /ruta/Compas-anterior.html");
  process.exit(1);
}
const extract = (html) => {
  const match = html.match(/<script id="compas-core">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("El HTML debe incluir el núcleo de Compás.");
  return match[1];
};
const original = extract(fs.readFileSync(process.argv[2], "utf8"));
const current = extract(
  fs.readFileSync(
    require("path").resolve(__dirname, "../dist/index.html"),
    "utf8",
  ),
);
const load = (code) => {
  const ctx = {
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
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx.CompasCore;
};
const before = load(original),
  after = load(current);
function measure(fn) {
  for (let i = 0; i < 3; i++) fn();
  const samples = [];
  for (let i = 0; i < 7; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  return +samples.sort((a, b) => a - b)[3].toFixed(2);
}
const results = [];
for (const size of [1000, 3000]) {
  const state = before.demo();
  for (const key of [
    "sessions",
    "actions",
    "decisions",
    "todos",
    "timeEntries",
    "reflections",
  ]) {
    const template = state[key][0];
    state[key] = Array.from({ length: size }, (_, i) => ({
      ...before.clone(template),
      id: key + "-" + i,
    }));
  }
  state.actions.forEach((x, i) => (x.sourceId = "sessions-" + i));
  state.todos.forEach((x, i) => {
    x.sessionId = "sessions-" + i;
    x.actionId = "actions-" + i;
  });
  state.timeEntries.forEach((x, i) => (x.actionId = "actions-" + i));
  state.decisions.forEach(
    (x, i) => (x.supersedes = i ? "decisions-" + (i - 1) : ""),
  );
  const opts = {
    from: "",
    to: "",
    project: true,
    names: false,
    actions: state.actions.map((x) => x.id),
    sessions: state.sessions.map((x) => x.id),
    decisions: state.decisions.map((x) => x.id),
    route: state.routeProgress.map((x) => x.id),
  };
  assert.equal(
    JSON.stringify(before.validate(state)),
    JSON.stringify(after.validate(state)),
  );
  const b = before.makeShare(state, opts),
    a = after.makeShare(state, opts);
  delete b.generatedAt;
  delete a.generatedAt;
  assert.equal(JSON.stringify(b), JSON.stringify(a));
  for (const operation of ["validate", "backup", "makeShare"])
    results.push({
      size,
      operation,
      beforeMs: measure(() => before[operation](state, opts)),
      afterMs: measure(() => after[operation](state, opts)),
    });
  results.push({
    size,
    operation: "reportCount",
    beforeMs: measure(() => {
      const r = before.makeShare(state, opts);
      return (
        r.actions.length +
        r.sessions.length +
        r.decisions.length +
        r.route.length
      );
    }),
    afterMs: measure(() => after.reportCount(state, opts)),
  });
}
console.log(JSON.stringify(results, null, 2));
