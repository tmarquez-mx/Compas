// Navegador aislado y ejemplo ficticio; no abre perfiles ni bitácoras personales.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.COMPAS_PLAYWRIGHT || "playwright");
const root = path.resolve(__dirname, ".."),
  out = process.env.COMPAS_DEMO_WORK || "/tmp/compas-rutas-qa";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = http.createServer((q, r) => {
    r.setHeader("Content-Type", "text/html; charset=utf-8");
    r.end(fs.readFileSync(path.join(root, "dist/index.html")));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.COMPAS_CHROMIUM
        ? { executablePath: process.env.COMPAS_CHROMIUM }
        : {}),
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 1000 },
        locale: "es-MX",
        timezoneId: "America/Mexico_City",
      }),
      page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:" + server.address().port);
    await page.locator('.side-nav [data-view="ruta"]').click();
    const submit = () => page.locator('#edit-form [type="submit"]').click();
    await page.locator('[data-do="route-setup"]').click();
    await page
      .locator('[name="templateId"]')
      .selectOption("sintetica-sociologia-maestria");
    assert.equal(
      await page.locator('[name="program"]').inputValue(),
      "Maestría en Sociología",
    );
    await submit();
    assert(
      (await page.locator(".route-origin").innerText()).includes(
        "Ruta orientativa, no oficial",
      ),
    );
    assert.equal(await page.locator(".semester-stop").count(), 4);
    await page.locator('[data-do="route-product"]').first().click();
    await page.locator('[name="title"]').fill("ENTREGABLE_FICTICIO");
    await page
      .locator('[name="expected"]')
      .fill("Descripción orientativa para la prueba");
    await page.locator('[name="semester"]').fill("2");
    await submit();
    await page.locator('[data-do="route-stage"][data-semester="2"]').click();
    let card = page
      .locator(".route-card")
      .filter({
        has: page.getByRole("heading", {
          name: "ENTREGABLE_FICTICIO",
          exact: true,
        }),
      });
    assert.equal(await card.count(), 1);
    await card.locator('[data-do="route-progress"]').click();
    await page.locator('[name="status"]').selectOption("en-proceso");
    await page.locator('[name="versionLabel"]').fill("Primera versión");
    await page
      .locator('[name="evidence"]')
      .fill("Resultado académico ficticio");
    await page.locator('[name="privateNotes"]').fill("NOTA_PRIVADA_RUTA_039");
    await submit();
    await card.locator('[data-do="todo-edit"]').click();
    await page.locator('[name="title"]').fill("TAREA_PRIVADA_RUTA_039");
    await submit();
    await card.locator('[data-do="route-product"]').click();
    await page.locator('[name="title"]').fill("ENTREGABLE_ADAPTADO");
    await page.locator('[name="semester"]').fill("3");
    await submit();
    await page.locator('[data-do="route-stage"][data-semester="3"]').click();
    card = page
      .locator(".route-card")
      .filter({
        has: page.getByRole("heading", {
          name: "ENTREGABLE_ADAPTADO",
          exact: true,
        }),
      });
    assert((await card.innerText()).includes("Primera versión"));
    assert((await card.innerText()).includes("Historial"));
    await page.screenshot({ path: path.join(out, "ruta-adaptada.png") });
    await card.locator('[data-do="route-archive"]').click();
    assert.equal(
      await page
        .locator(".route-card")
        .filter({
          has: page.getByRole("heading", {
            name: "ENTREGABLE_ADAPTADO",
            exact: true,
          }),
        })
        .count(),
      0,
    );
    await page
      .locator(".route-carry > summary")
      .filter({ hasText: "Entregables retirados" })
      .click();
    await page
      .locator(".related-stage")
      .filter({ has: page.getByText("ENTREGABLE_ADAPTADO", { exact: true }) })
      .locator('[data-do="route-unarchive"]')
      .click();
    assert.equal(await card.count(), 1);
    await page.reload();
    await page.locator('.side-nav [data-view="todo"]').click();
    assert(
      (await page.locator("#main").innerText()).includes(
        "TAREA_PRIVADA_RUTA_039",
      ),
    );
    assert(
      (await page.locator("#main").innerText()).includes("ENTREGABLE_ADAPTADO"),
    );
    await page.locator('.side-nav [data-view="ruta"]').click();
    await page.locator('[data-do="route-semester"]').click();
    await page.locator('[name="title"]').fill("Etapa de mi programa");
    await page.locator('[name="spaces"]').fill("Seminario ficticio");
    await submit();
    assert(
      (await page.locator(".route-heading").innerText()).includes(
        "Seminario ficticio",
      ),
    );
    await page.locator('.side-nav [data-view="reportes"]').click();
    await page
      .locator(".choice")
      .filter({ hasText: "ENTREGABLE_ADAPTADO" })
      .locator("input")
      .check();
    await page.locator('[data-do="preview"]').click();
    const report = await page.locator("#report-frame").getAttribute("srcdoc");
    assert(report.includes("Origen de la ruta actual"));
    assert(
      report.includes("Ruta orientativa con ajustes personales, no oficial"),
    );
    assert(!report.includes("NOTA_PRIVADA_RUTA_039"));
    assert(!report.includes("TAREA_PRIVADA_RUTA_039"));
    await page.screenshot({ path: path.join(out, "reporte-origen.png") });
    const download = await Promise.all([
      page.waitForEvent("download"),
      page.locator('[data-do="backup"]').click(),
    ]);
    const dest = path.join(out, "respaldo-ficticio.json");
    await download[0].saveAs(dest);
    const data = JSON.parse(fs.readFileSync(dest));
    assert.equal(data.version, 3);
    assert(
      data.data.routePlan.products.some(
        (p) => p.title === "ENTREGABLE_ADAPTADO",
      ),
    );
    await page.locator('.side-nav [data-view="ruta"]').click();
    for (const width of [390, 720, 1080]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.locator('[data-do="route-setup"]').click();
    await page
      .locator('[name="templateId"]')
      .selectOption("sintetica-ingenieria-doctorado");
    assert.equal(await page.locator('[name="semesters"]').inputValue(), "8");
    await submit();
    assert.equal(await page.locator(".semester-stop").count(), 8);
    await page.screenshot({ path: path.join(out, "doctorado-ingenieria.png") });
    const second = await context.newPage();
    await second.goto("http://127.0.0.1:" + server.address().port + "/#ruta");
    await second.waitForFunction(
      () => document.querySelector('[data-do="route-setup"]').disabled,
    );
    assert(
      await second.locator('[data-do="route-product"]').first().isDisabled(),
    );
    await second.close();
    assert.deepEqual(errors, []);
    console.log(
      "Rutas OK: plantillas, adaptación, historial, retiro y recuperación, ToDo, recarga, semestre, reporte privado, respaldo v3 y tamaños 390/720/1080; cero errores JS.",
    );
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
