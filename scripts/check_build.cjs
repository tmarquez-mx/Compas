"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { build, validateHTML } = require("./build.cjs");
const groups = require("./source-files.cjs");
let count = 0;
const check = (label, fn) => {
  fn();
  count++;
  console.log("OK " + label);
};
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "compas-build-check-"));
try {
  fs.mkdirSync(path.join(fixture, "src"));
  fs.writeFileSync(path.join(fixture, "VERSION"), "0.3.6\n");
  fs.writeFileSync(path.join(fixture, "package.json"), '{"version":"0.3.6"}');
  const template =
    '<!doctype html><meta name="compas-version" content="{{COMPAS_VERSION}}"><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'"><style>{{COMPAS_STYLES}}</style><script id="compas-core">{{COMPAS_CORE}}\n{{COMPAS_STORAGE}}</script><script id="compas-ui">{{COMPAS_UI}}</script>';
  fs.writeFileSync(path.join(fixture, "src/index.html"), template);
  for (const group of Object.values(groups))
    for (const name of group.files) {
      const file = path.join(fixture, "src", name);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(
        file,
        name.endsWith(".css") ? "body{color:#191919}" : "",
      );
    }
  fs.writeFileSync(
    path.join(fixture, "src/core/common.js"),
    'const x="{{COMPAS_UI}}";',
  );
  fs.writeFileSync(path.join(fixture, "src/ui/state.js"), "void 0;");
  check(
    "El build es determinista y no reinterpreta marcadores dentro del código",
    () => {
      const first = build(fixture),
        second = build(fixture);
      assert(first.html.equals(second.html));
      assert(first.manifest.equals(second.manifest));
      assert(first.html.toString().includes('const x="{{COMPAS_UI}}";'));
    },
  );
  check(
    "El manifiesto corresponde al HTML generado y enumera las fuentes",
    () => {
      const result = build(fixture),
        manifest = JSON.parse(result.manifest);
      assert.equal(manifest.version, "0.3.6");
      assert.equal(manifest.application.bytes, result.html.length);
      assert.equal(
        Object.keys(manifest.sources).length,
        2 + Object.values(groups).reduce((n, g) => n + g.files.length, 0),
      );
      assert.match(manifest.application.sha256, /^[a-f0-9]{64}$/);
    },
  );
  check(
    "La plantilla rechaza marcadores duplicados, omitidos o desconocidos",
    () => {
      for (const wrong of [
        template + "{{COMPAS_UI}}",
        template.replace("{{COMPAS_UI}}", ""),
        template + "{{COMPAS_UNKNOWN}}",
      ]) {
        fs.writeFileSync(path.join(fixture, "src/index.html"), wrong);
        assert.throws(() => build(fixture));
      }
      fs.writeFileSync(path.join(fixture, "src/index.html"), template);
    },
  );
  check(
    "El build rechaza JavaScript inválido y etiquetas de cierre incrustadas",
    () => {
      for (const wrong of ["const =;", 'const raw="</script>";']) {
        fs.writeFileSync(path.join(fixture, "src/ui/state.js"), wrong);
        assert.throws(() => build(fixture));
      }
      fs.writeFileSync(path.join(fixture, "src/ui/state.js"), "void 0;");
      fs.writeFileSync(
        path.join(fixture, "src/" + groups.COMPAS_STYLES.files[0]),
        "/* </style> */",
      );
      assert.throws(() => build(fixture));
      fs.writeFileSync(
        path.join(fixture, "src/" + groups.COMPAS_STYLES.files[0]),
        "body{color:#191919}",
      );
    },
  );
  check(
    "La entrega rechaza scripts adicionales, recursos remotos y ausencia de CSP",
    () => {
      const valid = build(fixture).html.toString();
      assert.throws(() =>
        validateHTML(valid + "<script>void 0;</script>", "0.3.6"),
      );
      assert.throws(() =>
        validateHTML(
          valid + '<img src="https://example.invalid/x.png">',
          "0.3.6",
        ),
      );
      assert.throws(() =>
        validateHTML(valid.replace("connect-src 'none'", ""), "0.3.6"),
      );
    },
  );
  check("La versión única exige coincidencia con package.json", () => {
    fs.writeFileSync(path.join(fixture, "VERSION"), "0.3.7\n");
    assert.throws(() => build(fixture));
    fs.writeFileSync(path.join(fixture, "VERSION"), "desarrollo\n");
    assert.throws(() => build(fixture));
  });
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
console.log(count + " comprobaciones del build.");
