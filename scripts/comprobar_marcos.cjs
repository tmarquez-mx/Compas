// Usa una imagen dibujada y perfiles nuevos; no lee fotos ni datos del usuario.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.COMPAS_PLAYWRIGHT || "playwright");
const root = path.resolve(__dirname, ".."),
  out = process.env.COMPAS_DEMO_WORK || "/tmp/compas-marcos-qa";
const styles = [
  ["mexicano", "Mexicano · Talavera", "Azulejos, cobalto y flores geométricas"],
  ["nemo", "Nemo · Marino", "Azul profundo, coral y ondas"],
  ["cubista", "Cubista", "Planos de color y líneas asimétricas"],
  ["graduado", "Graduado", "Un birrete grande sobre tu retrato"],
  ["nostalgico", "Nostálgico", "Papel cálido, cinta e instantánea"],
  ["memphis", "Memphis", "Color, zigzags y juego gráfico"],
  ["botanico", "Botánico", "Verde profundo, hojas y oro tenue"],
];
fs.mkdirSync(out, { recursive: true });
(async () => {
  const server = http.createServer((q, r) => {
    r.setHeader("Content-Type", "text/html; charset=utf-8");
    r.end(fs.readFileSync(root + "/dist/index.html"));
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
    for (const protocol of ["http", "file"]) {
      const ctx = await browser.newContext({
          viewport: { width: 1280, height: 1000 },
          locale: "es-MX",
        }),
        page = await ctx.newPage(),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(
        protocol === "file"
          ? "file://" + root + "/dist/index.html"
          : "http://127.0.0.1:" + server.address().port,
      );
      await page.locator('[data-do="appearance"]').click();
      const photo = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 600;
        c.height = 650;
        const g = c.getContext("2d");
        const sky = g.createLinearGradient(0, 0, 0, 650);
        sky.addColorStop(0, "#afc6c7");
        sky.addColorStop(0.7, "#ede0c1");
        g.fillStyle = sky;
        g.fillRect(0, 0, 600, 650);
        g.fillStyle = "#efe0a8";
        g.beginPath();
        g.arc(440, 165, 62, 0, Math.PI * 2);
        g.fill();
        for (const [color, points] of [
          [
            "#8caaa1",
            [
              [0, 440],
              [160, 240],
              [320, 400],
              [495, 285],
              [600, 410],
            ],
          ],
          [
            "#688878",
            [
              [0, 420],
              [160, 345],
              [390, 500],
              [600, 400],
            ],
          ],
          [
            "#375e51",
            [
              [0, 520],
              [240, 480],
              [470, 540],
              [600, 505],
            ],
          ],
        ]) {
          g.fillStyle = color;
          g.beginPath();
          points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.lineTo(600, 650);
          g.lineTo(0, 650);
          g.fill();
        }
        g.fillStyle = "#d9c09a";
        g.beginPath();
        g.moveTo(405, 455);
        g.bezierCurveTo(395, 510, 200, 555, 170, 650);
        g.lineTo(290, 650);
        g.bezierCurveTo(280, 570, 422, 515, 410, 455);
        g.fill();
        return c.toDataURL("image/png").split(",")[1];
      });
      await page.locator("#photo-input").setInputFiles({
        name: "paisaje-ficticio.png",
        mimeType: "image/png",
        buffer: Buffer.from(photo, "base64"),
      });
      await page.waitForFunction(
        () => document.querySelector("#personal-image").naturalWidth > 0,
      );
      const artwork = {};
      for (const [key] of styles) {
        // Elegir un marco desde Sin foto debe mostrarlo y actualizar el radio.
        await page.locator('[name="photo-mode"][value="none"]').check();
        assert.equal(await page.locator("#personal-frame").isVisible(), false);
        const choice = page.locator(
          '[data-do="frame"][data-frame="' + key + '"]',
        );
        await choice.click();
        assert.equal(await choice.getAttribute("aria-pressed"), "true");
        assert(
          await page.locator('[name="photo-mode"][value="frame"]').isChecked(),
        );
        assert.equal(await page.locator(".background-preview").count(), 0);
        assert(await page.locator("#personal-frame").isVisible());
        assert.equal(
          await page.locator("#personal-frame").getAttribute("data-frame"),
          key,
        );
        assert.equal(
          await page
            .locator(".keepsake-preview .keepsake-frame")
            .getAttribute("data-frame"),
          key,
        );
        artwork[key] = await page.locator("#personal-frame-art").innerHTML();
        assert.equal(artwork[key].includes("<svg"), key !== "nostalgico");
        if (key === "graduado") {
          const cap = await page
            .locator("#personal-frame-art .graduation-cap")
            .evaluate((n) => {
              const b = n.getBBox();
              return { x: b.x, y: b.y, width: b.width };
            });
          assert(cap.y < 0, "El birrete debe sobresalir por encima del marco");
          assert(cap.width > 140, "El birrete debe ser grande");
          assert(
            Math.abs(cap.x + cap.width / 2 - 90) < 2,
            "El birrete debe quedar centrado",
          );
          assert.equal(
            await page
              .locator("#personal-frame-art svg")
              .evaluate((n) => getComputedStyle(n).overflow),
            "visible",
          );
        }
        const pref = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("compas-appearance-v1")),
        );
        assert.equal(pref.frame, key);
        assert.equal(pref.photoMode, "frame");
        await page.locator('#editor [data-do="close"]').last().click();
        await page.reload();
        await page.waitForFunction(
          () => document.querySelector("#personal-image").naturalWidth > 0,
        );
        assert.equal(
          await page.locator("#personal-frame").getAttribute("data-frame"),
          key,
        );
        assert(await page.locator("#personal-frame").isVisible());
        assert.equal(
          await page.locator("#personal-frame-art").innerHTML(),
          artwork[key],
        );
        await page.locator('[data-do="appearance"]').click();
      }
      for (const key of ["homepad", "none"]) {
        await page
          .locator('[data-do="frame"][data-frame="' + key + '"]')
          .click();
        assert.equal(
          await page.locator("#personal-frame").getAttribute("data-frame"),
          key,
        );
        assert.equal(await page.locator("#personal-frame-art").innerHTML(), "");
        assert(await page.locator("#personal-image").isVisible());
        assert.equal(
          await page.locator(".homepad-clock-option").isVisible(),
          key === "homepad",
        );
      }
      await page.locator('[data-do="frame"][data-frame="mexicano"]').click();
      for (const width of [390, 720, 1080, 1280]) {
        await page.setViewportSize({ width, height: 1000 });
        const overflow = await page.evaluate(() => {
          const d = document.querySelector("#editor");
          return d.scrollWidth > d.clientWidth + 1;
        });
        assert.equal(
          overflow,
          false,
          "Personalizar desborda a " + width + " px",
        );
      }
      await page.screenshot({
        path: path.join(out, "personalizar-" + protocol + ".png"),
      });
      assert.deepEqual(errors, []);
      if (protocol === "http") {
        const css = (await page.locator("style").allTextContents()).join("\n"),
          gallery = await ctx.newPage();
        await gallery.setViewportSize({ width: 1160, height: 840 });
        await gallery.setContent(
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>' +
            css +
            '\nbody{display:block!important;min-width:0;background:#f3efe5;padding:40px 52px;color:#24362d}h1{font-family:"Alumni Sans",sans-serif;font-size:52px;line-height:1;margin:0 0 12px}p{margin:0;color:#58655c}main{padding:0;max-width:none}.gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:25px 26px;margin-top:30px}.gallery-card{padding-top:22px;display:grid;justify-items:center;text-align:center;gap:6px}.gallery-card .keepsake-preview{width:170px;margin:6px 10px 14px}.gallery-card img{height:145px}.gallery-card h2{font-size:19px;margin:0;color:#24362d}.gallery-card p{font-size:13px;line-height:1.35;max-width:220px}.gallery-note{font-size:13px;margin-top:28px}</style></head><body><main><h1>Tu rincón, a tu estilo</h1><p>Siete marcos nuevos para Compás. Elige el que te acompañe hoy.</p><div class="gallery">' +
            styles
              .map(
                ([key, label, detail]) =>
                  '<article class="gallery-card"><div class="keepsake-preview"><div class="keepsake-frame" data-frame="' +
                  key +
                  '"><div class="frame-art" aria-hidden="true">' +
                  artwork[key] +
                  '</div><img alt="Paisaje ficticio" src="data:image/png;base64,' +
                  photo +
                  '"></div></div><h2>' +
                  label +
                  "</h2><p>" +
                  detail +
                  "</p></article>",
              )
              .join("") +
            '</div><p class="gallery-note">Todos disponibles desde el principio · Paisaje de muestra dibujado para esta vista previa</p></main></body></html>',
        );
        await gallery.evaluate(() => document.fonts.ready);
        await gallery.screenshot({
          path: path.join(out, "Vista-marcos-nuevos.png"),
          fullPage: true,
        });
        await gallery.close();
      }
      await ctx.close();
      console.log(
        "Marcos " +
          protocol +
          ": siete estilos, recuperación de foto y selección, cambio desde Sin foto, HomePad y Sin marco y ventanas estrechas; cero errores JS.",
      );
    }
  } finally {
    await browser?.close();
    await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
