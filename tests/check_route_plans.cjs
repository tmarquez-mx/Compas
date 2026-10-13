const fs = require("node:fs"),
  vm = require("node:vm"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const html = fs.readFileSync(
  process.argv[2] || path.resolve(__dirname, "../dist/index.html"),
  "utf8",
);
const core = html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1];
function load(source = core) {
  const box = {
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
  vm.createContext(box);
  vm.runInContext(source, box);
  return box.CompasCore;
}
const C = load();
let count = 0;
function check(label, fn) {
  fn();
  count++;
  console.log("OK " + label);
}
check(
  "Respaldos anteriores reciben la ruta original sin perder avances ni vínculos",
  () => {
    const old = C.demo();
    delete old.routePlan;
    old.schemaVersion = 2;
    const s = C.restore(
      JSON.stringify({ format: "compas-backup", version: 2, data: old }),
    );
    assert.equal(s.routePlan.templates.maestria, "csp-maestria");
    assert.equal(s.routeProgress.length, old.routeProgress.length);
    assert.equal(s.todos[0].milestoneId, old.todos[0].milestoneId);
  },
);
check(
  "Adaptar nombre y descripción mantiene identidad, notas privadas, avances y tareas",
  () => {
    const old = C.demo(),
      s = C.saveRouteProduct(old, "m2-metodo", {
        title: "Prototipo funcional",
        expected: "Prueba de uso",
        semester: "2",
      });
    assert.equal(C.milestone("m2-metodo", s).title, "Prototipo funcional");
    assert.equal(s.routeProgress[0].evidence, old.routeProgress[0].evidence);
    assert.equal(
      s.routeProgress[0].privateNotes,
      old.routeProgress[0].privateNotes,
    );
    assert.equal(s.todos[0].milestoneId, "m2-metodo");
    assert.equal(
      C.milestone("m2-metodo", old).title,
      "Capítulo metodológico e instrumento",
    );
  },
);
check("Reprogramar un entregable preserva el corte previo del avance", () => {
  const old = C.demo(),
    s = C.saveRouteProduct(old, "m2-metodo", {
      title: "Prototipo",
      expected: "",
      semester: "6",
    }),
    p = s.routeProgress.find((p) => p.id === "m2-metodo");
  assert.equal(p.planSemester, "6");
  assert.equal(p.history.length, old.routeProgress[0].history.length + 1);
  assert.equal(
    p.history.at(-1).planSemester,
    old.routeProgress[0].planSemester,
  );
});
check(
  "Entregables propios soportan avances, respaldo, tareas y reportes",
  () => {
    let s = C.saveRouteProduct(C.demo(), "", {
      level: "maestria",
      title: "Obra y memoria",
      expected: "Presentación y memoria escrita",
      semester: "5",
    });
    const m = C.routeMilestones(s).find((m) => m.title === "Obra y memoria");
    s = C.saveRoute(s, m.id, {
      status: "en-proceso",
      versionLabel: "v1",
      planSemester: "5",
    });
    s.todos[0].milestoneId = m.id;
    s = C.restore(C.backup(s));
    assert.equal(C.milestone(m.id, s).title, "Obra y memoria");
    assert.equal(
      C.makeShare(s, { route: [m.id] }).route[0].title,
      "Obra y memoria",
    );
  },
);
check("Retirar y recuperar un entregable mantiene historial y vínculos", () => {
  const old = C.demo(),
    s = C.archiveRouteProduct(old, "m2-metodo");
  assert(!C.routeMilestones(s).some((m) => m.id === "m2-metodo"));
  assert(C.milestone("m2-metodo", s).archived);
  assert.equal(s.todos[0].milestoneId, "m2-metodo");
  assert.deepEqual(
    JSON.stringify(s.routeProgress),
    JSON.stringify(old.routeProgress),
  );
  assert(
    C.routeMilestones(C.archiveRouteProduct(s, "m2-metodo", false)).some(
      (m) => m.id === "m2-metodo",
    ),
  );
});
check(
  "Empezar desde cero conserva los registros retirados y la otra ruta",
  () => {
    const old = C.demo(),
      s = C.applyRouteTemplate(old, "personal-maestria", {
        semesters: "6",
        program: "Diseño",
        department: "Diseño",
      });
    assert.equal(
      C.routeMilestones(s).filter((m) => m.level === "maestria").length,
      0,
    );
    assert(C.routeMilestones(s).some((m) => m.level === "doctorado"));
    assert.equal(s.routeProgress.length, old.routeProgress.length);
    assert.equal(C.routeProvenance(s, "maestria").label, "Ruta personal");
    assert.equal(C.routeStages(s, "maestria").length, 6);
  },
);
check(
  "Modificar un semestre persiste materias y no cambia la plantilla original",
  () => {
    let s = C.saveRouteStage(C.demo(), "maestria", 2, {
      title: "Diseñar el prototipo",
      spaces: "Taller de proyecto",
      note: "Entrega a la dirección",
    });
    s = C.restore(C.backup(s));
    assert.equal(C.routeStages(s, "maestria")[1].spaces, "Taller de proyecto");
    assert.equal(C.ROUTES.maestria[1].title, "Construir el diseño");
  },
);
check("El borrador no se presenta como una ruta oficial", () => {
  assert.equal(C.routeProvenance(C.demo(), "maestria").status, "draft");
  const s = C.saveRouteProduct(C.demo(), "m2-metodo", {
    title: "Otro",
    expected: "",
    semester: "2",
  });
  assert.equal(
    C.routeProvenance(s, "maestria").label,
    "Referencia en borrador con ajustes personales",
  );
});
check("Un respaldo no puede autodeclarar su ruta como oficial", () => {
  const s = C.demo();
  s.routePlan.status = "official";
  s.routePlan.source = "oficial";
  s.routePlan.templates.maestria = "oficial-inventada";
  assert.throws(() => C.validate(s));
  s.routePlan.templates.maestria = "csp-maestria";
  assert.equal(C.routeProvenance(C.validate(s), "maestria").status, "draft");
});
check(
  "Una plantilla oficial del catálogo de prueba distingue los ajustes personales",
  () => {
    const official = load(
      core.replace('status: "draft"', 'status: "official"'),
    );
    const base = official.blank();
    base.project.level = "maestria";
    base.project.program = "Maestría en Ciencias Sociales y Políticas";
    assert.equal(
      official.routeProvenance(base, "maestria").label,
      "Ruta oficial del programa",
    );
    const adapted = official.saveRouteProduct(base, "m2-metodo", {
      title: "Otra entrega",
      expected: "",
      semester: "2",
    });
    assert.equal(
      official.routeProvenance(adapted, "maestria").label,
      "Ruta oficial con ajustes personales",
    );
  },
);
check(
  "Los reportes y Excel señalan origen sin notas privadas ni títulos no seleccionados",
  () => {
    let s = C.saveRouteProduct(C.demo(), "", {
      level: "maestria",
      title: "PRODUCTO_NO_SELECCIONADO",
      expected: "",
      semester: "3",
    });
    s.routeProgress[0].privateNotes = "NOTA_PRIVADA_SINTETICA";
    const r = C.makeShare(s, {
      route: ["m2-metodo"],
      project: false,
      names: false,
    });
    assert.equal(r.routeOrigins.length, 1);
    const doc = C.reportHTML(r),
      xls = Buffer.from(C.excelBytes(r)).toString("utf8");
    assert(doc.includes("Origen de la ruta actual"));
    assert(xls.includes("Origen de mi ruta"));
    assert(!doc.includes("PRODUCTO_NO_SELECCIONADO"));
    assert(!xls.includes("PRODUCTO_NO_SELECCIONADO"));
    assert(!doc.includes(s.routeProgress[0].privateNotes));
  },
);
check("La selección vacía no expone el origen del programa", () => {
  const r = C.makeShare(C.demo(), { project: false });
  assert.equal(r.routeOrigins.length, 0);
});
check(
  "Configuraciones corruptas, semestres inválidos y duplicados se rechazan sin modificar estado",
  () => {
    const old = C.demo(),
      raw = JSON.stringify(old);
    for (const semester of [0, 100, NaN])
      assert.throws(() =>
        C.saveRouteProduct(old, "m2-metodo", {
          title: "Nombre",
          expected: "",
          semester,
        }),
      );
    assert.equal(JSON.stringify(old), raw);
    const bad = C.clone(old);
    bad.routePlan.products = [
      {
        id: "m2-metodo",
        level: "doctorado",
        title: "No",
        expected: "",
        semester: 1,
        archived: false,
      },
    ];
    assert.throws(() => C.validate(bad));
  },
);
check("Los nombres personalizados se escapan en HTML y Excel", () => {
  const s = C.saveRouteProduct(C.demo(), "m2-metodo", {
    title: "<img onerror=evil()>",
    expected: "<script>evil</script>",
    semester: "2",
  });
  const r = C.makeShare(s, { route: ["m2-metodo"] });
  assert(C.reportHTML(r).includes("&lt;img"));
  assert(!C.reportHTML(r).includes("<img onerror"));
  assert(
    !Buffer.from(C.excelBytes(r)).toString("utf8").includes("<script>evil"),
  );
});
check("Los 19 posgrados tienen rutas sintéticas propias y no oficiales", () => {
  const templates = C.ROUTE_TEMPLATES.filter((t) => t.status === "synthetic");
  assert.equal(templates.length, 19);
  for (const t of templates) {
    const s = C.applyRouteTemplate(C.blank(), t.id, {
      semesters: String(t.stages.length),
      program: t.program,
    });
    assert.equal(
      C.routeProvenance(s, t.level).label,
      "Ruta orientativa, no oficial",
    );
    const products = C.routeMilestones(s).filter((m) => m.level === t.level);
    assert.equal(
      products.length,
      t.stages.reduce((n, x) => n + x.products.length, 0),
    );
    assert(products.every((m) => m.templateVersion === "sintetica-2026-10-12"));
    assert.equal(C.restore(C.backup(s)).routePlan.templates[t.level], t.id);
  }
});
check(
  "Añadir un entregable en otro semestre extiende la ruta y conserva el plan",
  () => {
    const s = C.saveRouteProduct(C.demo(), "", {
      level: "maestria",
      title: "Entrega final",
      expected: "",
      semester: "7",
    });
    assert(C.routeStages(s, "maestria").some((x) => x.semester === 7));
  },
);
check(
  "El respaldo usa versión 3 para que versiones anteriores no descarten la ruta adaptada",
  () => {
    const b = JSON.parse(C.backup(C.demo()));
    assert.equal(b.version, 3);
    assert.equal(b.data.schemaVersion, 3);
  },
);
check(
  "Un respaldo nuevo sin su configuración se rechaza en lugar de reiniciar la ruta",
  () => {
    const s = C.demo();
    delete s.routePlan;
    assert.throws(() => C.validate(s));
  },
);
console.log(count + " comprobaciones de rutas personalizables.");
