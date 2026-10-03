"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_GROUPS = require("./source-files.cjs");
const TOKENS = [...Object.keys(SOURCE_GROUPS), "COMPAS_VERSION"];
const sha256 = (bytes) =>
  crypto.createHash("sha256").update(bytes).digest("hex");

function build(root = ROOT) {
  const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
  if (!/^\d+\.\d+\.\d+$/.test(version))
    throw new Error("VERSION debe contener una versión como 0.3.6.");
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8"),
  );
  if (packageJson.version !== version)
    throw new Error("package.json y VERSION no coinciden.");
  const templateBytes = fs.readFileSync(path.join(root, "src/index.html"));
  const template = templateBytes.toString("utf8");
  const found = template.match(/\{\{COMPAS_[A-Z_]+\}\}/g) || [];
  for (const token of TOKENS) {
    if (found.filter((value) => value === "{{" + token + "}}").length !== 1) {
      throw new Error(
        "src/index.html debe contener exactamente una vez {{" + token + "}}.",
      );
    }
  }
  if (found.length !== TOKENS.length)
    throw new Error("Hay un marcador COMPAS desconocido en la plantilla.");
  const values = { COMPAS_VERSION: version };
  const sources = {
    "src/index.html": sha256(templateBytes),
    VERSION: sha256(fs.readFileSync(path.join(root, "VERSION"))),
  };
  for (const [token, group] of Object.entries(SOURCE_GROUPS)) {
    const parts = [];
    for (const filename of group.files) {
      const bytes = fs.readFileSync(path.join(root, "src", filename));
      const source = bytes.toString("utf8");
      sources["src/" + filename] = sha256(bytes);
      const closingTag =
        token === "COMPAS_STYLES" ? /<\/style\b/i : /<\/script\b/i;
      if (closingTag.test(source))
        throw new Error(
          filename + " contiene una etiqueta de cierre que rompería el HTML.",
        );
      if (filename.endsWith(".js"))
        new vm.Script(source, { filename: "src/" + filename });
      parts.push(source);
    }
    values[token] =
      (group.before || "") + parts.join("\n") + (group.after || "");
  }
  // Una sola pasada: el contenido insertado nunca se vuelve a interpretar como plantilla.
  const html = template.replace(
    /\{\{(COMPAS_[A-Z_]+)\}\}/g,
    (_match, token) => values[token],
  );
  validateHTML(html, version);
  const bytes = Buffer.from(html, "utf8");
  const manifest = Buffer.from(
    JSON.stringify(
      {
        name: "Compás",
        version,
        application: {
          file: "index.html",
          sha256: sha256(bytes),
          bytes: bytes.length,
        },
        sources,
      },
      null,
      2,
    ) + "\n",
  );
  return { version, html: bytes, manifest };
}

function validateHTML(html, version) {
  const scripts = [
    ...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi),
  ];
  if (
    scripts.length !== 2 ||
    !/^\s+id="compas-core"\s*$/.test(scripts[0][1]) ||
    !/^\s+id="compas-ui"\s*$/.test(scripts[1][1])
  ) {
    throw new Error(
      "La aplicación debe mantener únicamente los scripts compas-core y compas-ui.",
    );
  }
  scripts.forEach(
    (script, index) =>
      new vm.Script(script[2], {
        filename: index ? "compas-ui" : "compas-core",
      }),
  );
  if (!html.includes("connect-src 'none'"))
    throw new Error(
      "Falta el bloqueo de conexiones en la política de seguridad.",
    );
  if (!html.includes('<meta name="compas-version" content="' + version + '">'))
    throw new Error("Falta el metadato compas-version de la entrega.");
  if (
    /<(?:script|img)\b[^>]*\bsrc\s*=\s*["']https?:/i.test(html) ||
    /<link\b[^>]*\bhref\s*=\s*["']https?:/i.test(html)
  ) {
    throw new Error("La aplicación incluye un recurso remoto.");
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--check"))
    throw new Error("Uso: node scripts/build.cjs [--check]");
  const result = build();
  const outputs = {
    "index.html": result.html,
    "manifest.json": result.manifest,
  };
  if (args.includes("--check")) {
    for (const [name, bytes] of Object.entries(outputs)) {
      const file = path.join(ROOT, "dist", name);
      if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) {
        throw new Error(
          "dist/" +
            name +
            " no corresponde a las fuentes. Ejecuta npm run build.",
        );
      }
    }
    console.log("Build reproducible verificado · Compás " + result.version);
    return;
  }
  fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
  for (const [name, bytes] of Object.entries(outputs)) {
    const file = path.join(ROOT, "dist", name);
    fs.writeFileSync(file + ".tmp", bytes);
    fs.renameSync(file + ".tmp", file);
  }
  console.log(
    "Compás " +
      result.version +
      " generado en dist/index.html · " +
      result.html.length +
      " bytes",
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("Build rechazado: " + error.message);
    process.exitCode = 1;
  }
}
module.exports = { build, validateHTML };
