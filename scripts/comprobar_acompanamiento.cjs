/* Verificación con navegador aislado y datos ficticios. Requiere las mismas
 * variables COMPAS_PLAYWRIGHT/COMPAS_CHROMIUM que capturar_demos.cjs.
 * No lee el perfil ni archivos personales del usuario. */
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.COMPAS_PLAYWRIGHT || "playwright");
const root = path.resolve(__dirname, "..");
const out = process.env.COMPAS_DEMO_WORK || "/tmp/compas-acompanamiento";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const html = fs.readFileSync(path.join(root, "dist/index.html"));
  const server = http.createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.COMPAS_CHROMIUM
        ? { executablePath: process.env.COMPAS_CHROMIUM }
        : {}),
    });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "es-MX",
      timezoneId: "America/Mexico_City",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      process.env.COMPAS_FILE === "1"
        ? "file://" + path.join(root, "dist/index.html")
        : "http://127.0.0.1:" + server.address().port,
    );
    await page.waitForTimeout(350);
    assert(
      (await page.locator("#save-info").innerText()).includes(
        "Ejemplo ficticio",
      ),
    );
    const question = await page.locator(".home-question").innerText();
    for (const view of [
      "brujula",
      "ruta",
      "todo",
      "coloquios",
      "supervision",
      "dedicacion",
      "reportes",
    ]) {
      await page.locator('.side-nav [data-view="' + view + '"]').click();
      assert.equal(await page.locator("#main h1").count(), 1);
      assert.equal(
        await page.locator("#main > .eyebrow, .home-intro > .eyebrow").count(),
        0,
      );
      assert.equal(await page.locator(".page-head p").count(), 0);
    }
    await page.locator('.side-nav [data-view="brujula"]').click();
    assert.equal(await page.locator(".home-question").innerText(), question);
    assert.equal(
      await page.locator(".home-followup").getAttribute("open"),
      null,
    );
    const missingHelp = () =>
      page.locator("button:not([data-tooltip])").count();
    assert.equal(await missingHelp(), 0);
    await page.locator('[data-do="backup"]').hover();
    await page.waitForTimeout(430);
    assert.equal(await page.locator("#button-hint").isVisible(), true);
    assert((await page.locator("#button-hint").innerText()).includes("diario"));
    await page.screenshot({ path: path.join(out, "ayuda-raton.png") });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#button-hint").isVisible(), false);
    await page.keyboard.press("Tab");
    await page.locator('[data-do="backup"]').focus();
    assert.equal(await page.locator("#button-hint").isVisible(), true);
    await page.keyboard.press("Escape");
    await page.locator('.side-nav [data-view="todo"]').click();
    assert.equal(await page.locator(".todo-time").getAttribute("open"), null);
    await page.locator(".todo-time > summary").click();
    await page.locator("#time-period").selectOption("7");
    assert.equal(await page.locator(".todo-time").getAttribute("open"), "");
    await page.locator("#todo-filter").selectOption("todas");
    assert.equal(await page.locator(".todo-time").getAttribute("open"), "");
    const timeRows = page.locator(".time-table tbody tr");
    const timeCount = await timeRows.count();
    const existingTime = timeRows.first();
    const existingTimeId = await existingTime
      .locator('[data-do="time"]')
      .getAttribute("data-id");
    await existingTime.locator('[data-do="time"]').click();
    await page.locator('[name="note"]').fill("DEDICACION_FICTICIA_PRIVADA_037");
    await page.locator('#edit-form [type="submit"]').click();
    assert.equal(await timeRows.count(), timeCount);
    assert.equal(await page.locator(".todo-time").getAttribute("open"), "");
    await page.locator('.todo-time [data-do="time"]').first().click();
    await page.locator('[name="minutes"]').fill("15");
    await page.locator('#edit-form [type="submit"]').click();
    assert.equal(await timeRows.count(), timeCount + 1);
    await page.screenshot({ path: path.join(out, "todo-dedicacion.png") });
    await page.reload();
    await page.waitForTimeout(350);
    await page.locator(".todo-time > summary").click();
    assert.equal(await timeRows.count(), timeCount + 1);
    assert(
      (
        await timeRows
          .filter({
            has: page.locator(
              '[data-do="time"][data-id="' + existingTimeId + '"]',
            ),
          })
          .innerText()
      ).includes("DEDICACION_FICTICIA_PRIVADA_037"),
    );
    await page.locator('.side-nav [data-view="dedicacion"]').click();
    assert.equal(
      await page.locator('.todo-time, #time-period, [data-do="time"]').count(),
      0,
    );
    assert.equal(
      await page.locator("#main h1").innerText(),
      "Querido diario...",
    );
    const prior = await page.locator(".journal-entry").count();
    await page.locator('[data-do="reflection"]').first().click();
    await page
      .locator('[name="text"]')
      .fill(
        "DIARIO_FICTICIO_PRIVADO_037 · Hoy encontré una forma más sencilla de explicar mi idea.",
      );
    await page.locator('#edit-form [type="submit"]').click();
    assert.equal(await page.locator(".journal-entry").count(), prior + 1);
    await page.reload();
    await page.waitForTimeout(350);
    assert(
      (await page.locator(".journal-entry").first().innerText()).includes(
        "DIARIO_FICTICIO_PRIVADO_037",
      ),
    );
    await page
      .locator(".journal-entry")
      .first()
      .locator('[data-do="reflection"]')
      .click();
    await page
      .locator('[name="text"]')
      .fill("DIARIO_FICTICIO_PRIVADO_037 · Puedo avanzar a mi ritmo.");
    await page.locator('#edit-form [type="submit"]').click();
    await page.screenshot({ path: path.join(out, "diario.png") });
    const stored = await page.evaluate(() => {
      const C = globalThis.CompasCore,
        state = C.restore(localStorage.getItem("compas-personal-v1"));
      const report = C.makeShare(state, {
        project: true,
        actions: state.actions.map((x) => x.id),
        sessions: state.sessions.map((x) => x.id),
        decisions: state.decisions.map((x) => x.id),
        route: state.routeProgress.map((x) => x.id),
      });
      return {
        saved: state.reflections.some((x) =>
          x.text.includes("DIARIO_FICTICIO_PRIVADO_037"),
        ),
        shared: JSON.stringify(report).includes("DIARIO_FICTICIO_PRIVADO_037"),
      };
    });
    assert.deepEqual(stored, { saved: true, shared: false });
    await page.locator('[data-do="appearance"]').first().click();
    await page
      .locator('[data-do="decoration"][data-decoration="flores"]')
      .click();
    assert.equal(await page.locator("#personal-frame").isVisible(), false);
    assert.equal(await page.locator("#keepsake-paper").isVisible(), true);
    assert.equal(
      await page.locator("#keepsake-paper").innerText(),
      "A tu ritmo",
    );
    assert.equal(await page.locator("#personal-ornament svg").count(), 1);
    assert.equal(
      await page.locator(".keepsake-preview .photo-placeholder").innerText(),
      "A tu ritmo",
    );
    // Imagen de prueba capturada en este mismo contexto ficticio; no se abre una foto personal.
    const photo = await page.screenshot({
      clip: { x: 0, y: 0, width: 32, height: 32 },
    });
    await page.locator("#photo-input").setInputFiles({
      name: "foto-ficticia.png",
      mimeType: "image/png",
      buffer: photo,
    });
    await page.waitForFunction(() =>
      document
        .querySelector("#appearance-status")
        ?.textContent.includes("Foto guardada"),
    );
    await page.locator('[data-do="frame"][data-frame="jardin"]').click();
    await page
      .locator('[data-do="decoration"][data-decoration="flores"]')
      .click();
    assert.equal(
      await page.locator("#personal-frame").getAttribute("data-frame"),
      "jardin",
    );
    assert.equal(await page.locator("#personal-ornament svg").count(), 1);
    assert.equal(
      await page
        .locator(".keepsake-preview .keepsake-frame")
        .getAttribute("data-frame"),
      "jardin",
    );
    const previewFlowers = await page
      .locator(".keepsake-preview .personal-ornament")
      .innerHTML();
    await page
      .locator('[data-do="decoration"][data-decoration="hojas"]')
      .click();
    assert.notEqual(
      await page.locator(".keepsake-preview .personal-ornament").innerHTML(),
      previewFlowers,
    );
    await page.locator('[data-do="frame"][data-frame="madera"]').click();
    assert.equal(
      await page
        .locator(".keepsake-preview .keepsake-frame")
        .getAttribute("data-frame"),
      "madera",
    );
    await page.locator('[data-do="frame"][data-frame="jardin"]').click();
    await page
      .locator('[data-do="decoration"][data-decoration="flores"]')
      .click();
    for (const mode of ["none", "background"]) {
      await page.locator('[name="photo-mode"][value="' + mode + '"]').check();
      assert.equal(await page.locator("#personal-frame").isVisible(), false);
      assert.equal(await page.locator("#keepsake-paper").isVisible(), true);
      assert.equal(
        await page.locator("#keepsake-paper").innerText(),
        "A tu ritmo",
      );
      assert.equal(await page.locator("#personal-ornament").isVisible(), true);
    }
    await page.locator('[name="photo-mode"][value="frame"]').check();
    assert.equal(await page.locator("#keepsake-paper").isVisible(), false);
    assert.equal(await missingHelp(), 0);
    await page.locator('[data-do="frame"][data-frame="madera"]').hover();
    await page.waitForTimeout(430);
    assert.equal(await page.locator("#button-hint").isVisible(), true);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: path.join(out, "personalizar.png") });
    await page.locator('#editor [data-do="close"]').first().click();
    await page.reload();
    await page.waitForTimeout(350);
    assert.equal(
      await page.locator("#personal-frame").getAttribute("data-frame"),
      "jardin",
    );
    assert.equal(await page.locator("#personal-frame").isVisible(), true);
    assert.equal(await page.locator("#personal-ornament svg").count(), 1);
    const checkCorner = async (width) => {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const corner = document.querySelector("#personal-keepsake"),
          frame = document.querySelector("#personal-frame"),
          image = document.querySelector("#personal-image"),
          ornament = document.querySelector("#personal-ornament"),
          button = document.querySelector("#personalize-shortcut"),
          imageRect = image.getBoundingClientRect(),
          ornamentRect = ornament.getBoundingClientRect(),
          cornerRect = corner.getBoundingClientRect(),
          buttonRect = button.getBoundingClientRect();
        const intersect = (a, b) =>
          Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
          Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        const hit = document.elementFromPoint(
          (imageRect.left + imageRect.right) / 2,
          (imageRect.top + imageRect.bottom) / 2,
        );
        return {
          composed: corner.contains(frame) && corner.contains(ornament),
          position: getComputedStyle(corner).position,
          overlapsPhoto: intersect(imageRect, ornamentRect) > 0,
          ornamentStartsAbovePhotoBottom: ornamentRect.top < imageRect.bottom,
          clearsButton:
            intersect(ornamentRect, buttonRect) === 0 &&
            intersect(cornerRect, buttonRect) === 0,
          ignoresPointer:
            [corner, frame, ornament, ornament.querySelector("svg")].every(
              (element) => getComputedStyle(element).pointerEvents === "none",
            ) &&
            !!hit &&
            !corner.contains(hit),
          fitsViewport:
            document.documentElement.scrollWidth <= innerWidth &&
            ornamentRect.left >= 0 &&
            ornamentRect.right <= innerWidth,
        };
      });
      assert.deepEqual(
        geometry,
        {
          composed: true,
          position: "relative",
          overlapsPhoto: true,
          ornamentStartsAbovePhotoBottom: true,
          clearsButton: true,
          ignoresPointer: true,
          fitsViewport: true,
        },
        "Rincón compuesto y accesible a " + width + " px",
      );
    };
    for (const width of [1440, 390, 600, 720, 1150]) await checkCorner(width);
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("#personal-keepsake").isVisible(), false);
    await page.emulateMedia({ media: "screen" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.side-nav [data-view="brujula"]').click();
    const checkbox = page.locator("[data-todo-check]").first();
    await checkbox.click();
    assert.equal(await page.locator(".celebration-note").count(), 1);
    await page.screenshot({ path: path.join(out, "avance.png") });
    await page.locator('[data-do="dismiss-celebration"]').click();
    assert.equal(await page.locator(".celebration-note").count(), 0);
    await page.locator('[data-do="appearance"]').first().click();
    await page.locator('[name="celebrate"]').uncheck();
    await page.locator('#editor [data-do="close"]').first().click();
    await page.locator("[data-todo-check]").first().click();
    assert.equal(await page.locator(".celebration-note").count(), 0);
    await page.reload();
    await page.waitForTimeout(350);
    assert.equal(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("compas-appearance-v1")).celebrate,
      ),
      false,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    if (!(await page.locator('.side-nav [data-view="dedicacion"]').isVisible()))
      await page.locator("#mobile-menu").click();
    await page.locator('.side-nav [data-view="dedicacion"]').click();
    await page.screenshot({ path: path.join(out, "diario-movil.png") });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator('[data-do="appearance"]').first().click();
    await page.locator('[data-do="theme"][data-theme="noche"]').click();
    await page.screenshot({
      path: path.join(out, "personalizar-movil-noche.png"),
    });
    assert.equal(await missingHelp(), 0);
    await page.locator('#editor [data-do="close"]').first().click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('.topbar [data-do="help"]').click();
    assert(
      (await page.locator("#editor h3").first().innerText()).includes("ZIP"),
    );
    assert((await page.locator("#editor").innerText()).includes("Compas.html"));
    assert(
      (await page.locator("#editor").innerText()).includes("cierra la pestaña"),
    );
    await page.screenshot({ path: path.join(out, "como-usar.png") });
    await page.locator('#editor [data-do="close"]').first().click();
    page.on("dialog", (dialog) => dialog.accept());
    await page.locator('.topbar [data-do="help"]').click();
    await page.locator('#editor [data-do="new"]').click();
    assert.equal(await page.locator("#edit-form [required]").count(), 0);
    await page.locator('#edit-form [type="submit"]').click();
    assert.equal(await page.locator("#editor").getAttribute("open"), null);
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          checks: [
            "Siete pantallas sin rótulos sobre títulos ni descripciones repetidas; pregunta de tesis conservada.",
            "Ayuda de todos los botones, ratón, teclado, Escape y diálogo.",
            "Diario: crear, editar, reabrir y excluir de reportes.",
            "ToDo: dedicación opcional, editar actividades anteriores, guardar nuevas y reabrirlas.",
            "Foto ficticia, marco y flores conservados al reabrir.",
            "Rincón y vista previa compuestos; adornos sobre la foto y tarjeta sin foto.",
            "Rincón sin desbordamiento ni obstáculos a 390, 600, 720 y 1150 px; oculto en impresión.",
            "Reconocimiento al terminar y preferencia para desactivarlo.",
            "Diario y personalización en móvil, sin desbordamiento.",
          ],
          errors,
          out,
        },
        null,
        2,
      ),
    );
    await context.close();
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
