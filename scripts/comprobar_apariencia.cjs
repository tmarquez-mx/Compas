// Migración y detalles con una imagen dibujada y perfiles nuevos, sin datos personales.
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  assert = require("node:assert/strict");
const { chromium } = require(process.env.COMPAS_PLAYWRIGHT || "playwright");
const root = path.resolve(__dirname, ".."),
  out = process.env.COMPAS_DEMO_WORK || "/tmp/compas-apariencia-qa";
fs.mkdirSync(out, { recursive: true });
const details = [
  ["velas", "Velas"],
  ["copas", "Copas"],
  ["globos", "Globos"],
  ["cumpleanos", "Cumpleaños"],
  ["confeti", "Confeti"],
];
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
          timezoneId: "America/Mexico_City",
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
      assert.equal(await page.locator('[data-do="frame"]').count(), 9);
      assert.equal(await page.locator('[name="photo-mode"]').count(), 2);
      assert.equal(
        await page
          .locator(
            '.ambient-photo, #ambient-image, .background-preview, [name="photo-mode"][value="background"], [data-do="frame"][data-frame="sencillo"], [data-do="frame"][data-frame="madera"], [data-do="frame"][data-frame="jardin"], [data-do="frame"][data-frame="cielo"]',
          )
          .count(),
        0,
      );
      const photo = await page.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = 600;
        c.height = 450;
        const g = c.getContext("2d");
        g.fillStyle = "#c5d4d2";
        g.fillRect(0, 0, 600, 450);
        g.fillStyle = "#efe0a9";
        g.beginPath();
        g.arc(465, 95, 50, 0, Math.PI * 2);
        g.fill();
        for (const [color, points] of [
          [
            "#8eac9b",
            [
              [0, 350],
              [170, 135],
              [420, 380],
              [600, 255],
            ],
          ],
          [
            "#496f61",
            [
              [0, 390],
              [230, 300],
              [410, 360],
              [600, 290],
            ],
          ],
        ]) {
          g.fillStyle = color;
          g.beginPath();
          points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
          g.lineTo(600, 450);
          g.lineTo(0, 450);
          g.fill();
        }
        return c.toDataURL("image/png");
      });
      await page.locator("#photo-input").setInputFiles({
        name: "paisaje-ficticio.png",
        mimeType: "image/png",
        buffer: Buffer.from(photo.split(",")[1], "base64"),
      });
      await page.waitForFunction(
        () => document.querySelector("#personal-image").naturalWidth > 0,
      );
      await page.locator('#editor [data-do="close"]').last().click();
      const photoBefore = await page
        .locator("#personal-image")
        .evaluate(async (n) => {
          const c = document.createElement("canvas");
          c.width = n.naturalWidth;
          c.height = n.naturalHeight;
          c.getContext("2d").drawImage(n, 0, 0);
          return c.toDataURL("image/png");
        });
      for (const frame of [
        "sencillo",
        "madera",
        "jardin",
        "cielo",
        "homepad",
      ]) {
        await page.evaluate(
          (frame) =>
            localStorage.setItem(
              "compas-appearance-v1",
              JSON.stringify({
                theme: "cielo",
                frame,
                photoMode: "background",
                decoration: "flores",
                clock: false,
                celebrate: false,
              }),
            ),
          frame,
        );
        await page.reload();
        await page.waitForFunction(
          () => document.querySelector("#personal-image").naturalWidth > 0,
        );
        assert.equal(
          await page.locator("#personal-frame").getAttribute("data-frame"),
          frame === "homepad" ? "homepad" : "none",
        );
        assert(await page.locator("#personal-frame").isVisible());
        assert.equal(
          await page.locator("html").getAttribute("data-theme"),
          "cielo",
        );
        assert.equal(
          await page.locator("body").getAttribute("data-photo-mode"),
          "frame",
        );
        const photoAfter = await page
          .locator("#personal-image")
          .evaluate(async (n) => {
            const c = document.createElement("canvas");
            c.width = n.naturalWidth;
            c.height = n.naturalHeight;
            c.getContext("2d").drawImage(n, 0, 0);
            return c.toDataURL("image/png");
          });
        assert.equal(
          photoAfter,
          photoBefore,
          "La migración no debe cambiar la foto",
        );
        await page.locator('[data-do="appearance"]').click();
        assert.equal(
          await page.locator('[name="celebrate"]').isChecked(),
          false,
        );
        if (frame === "homepad") {
          assert.equal(
            await page.locator('[name="homepad-clock"]').isChecked(),
            false,
          );
          await page.locator('[name="homepad-clock"]').check();
          assert(
            await page.locator("#personal-frame .homepad-clock").isVisible(),
          );
        }
        await page.locator('#editor [data-do="close"]').last().click();
      }
      const artwork = {};
      for (const [key] of details) {
        await page.locator('[data-do="appearance"]').click();
        await page
          .locator('[data-do="decoration"][data-decoration="' + key + '"]')
          .click();
        assert.equal(
          await page
            .locator('[data-do="decoration"][data-decoration="' + key + '"]')
            .getAttribute("aria-pressed"),
          "true",
        );
        artwork[key] = await page.locator("#personal-ornament").innerHTML();
        assert(artwork[key].includes("<svg"));
        assert.equal(
          await page
            .locator(".keepsake-preview .personal-ornament")
            .innerHTML(),
          artwork[key],
        );
        await page.locator('#editor [data-do="close"]').last().click();
        await page.reload();
        await page.waitForFunction(
          () => document.querySelector("#personal-image").naturalWidth > 0,
        );
        assert.equal(
          await page.locator("#personal-ornament").innerHTML(),
          artwork[key],
        );
      }
      await page.locator('[data-do="appearance"]').click();
      await page.locator('[name="photo-mode"][value="none"]').check();
      assert(await page.locator("#keepsake-paper").isVisible());
      assert.equal(await page.locator("#personal-frame").isVisible(), false);
      await page.locator('[data-do="frame"][data-frame="nostalgico"]').click();
      assert(await page.locator("#personal-frame").isVisible());
      await page.screenshot({
        path: path.join(out, "personalizar-" + protocol + ".png"),
      });
      if (protocol === "http") {
        const css = (await page.locator("style").allTextContents()).join("\n"),
          gallery = await ctx.newPage();
        await gallery.setViewportSize({ width: 1080, height: 790 });
        await gallery.setContent(
          '<!doctype html><html lang="es"><head><meta charset="utf-8"><style>' +
            css +
            '\nbody{display:block!important;background:#f3efe5;padding:40px 52px;color:#24362d}main{padding:0}h1{font-family:"Alumni Sans",sans-serif;font-size:48px;line-height:1;margin:0 0 12px}p{color:#58655c;margin:0}.samples{display:grid;grid-template-columns:repeat(3,1fr);gap:35px 28px;margin-top:30px}.sample{display:grid;justify-items:center;gap:10px;padding:6px}.sample .keepsake-preview{width:175px;margin:8px 12px 12px}.sample img{height:138px}.sample h2{font-size:20px;margin:0}.note{font-size:13px;margin-top:30px}</style></head><body><main><h1>Pequeños detalles para acompañarte</h1><p>Velas, copas, globos, cumpleaños y confeti. Elige uno cuando quieras.</p><div class="samples">' +
            details
              .map(
                ([key, label]) =>
                  '<section class="sample"><div class="keepsake-preview"><div class="keepsake-frame" data-frame="nostalgico"><img src="' +
                  photo +
                  '" alt="Paisaje ficticio"></div><div class="personal-ornament" aria-hidden="true">' +
                  artwork[key] +
                  "</div></div><h2>" +
                  label +
                  "</h2></section>",
              )
              .join("") +
            '</div><p class="note">Todos disponibles desde el principio · Paisaje dibujado de muestra</p></main></body></html>',
        );
        await gallery.evaluate(() => document.fonts.ready);
        await gallery.screenshot({
          path: path.join(out, "Detalles-nuevos.png"),
          fullPage: true,
        });
        await gallery.close();
      }
      assert.deepEqual(errors, []);
      await ctx.close();
      console.log(
        "Apariencia " +
          protocol +
          ": opciones retiradas ausentes, migración con foto intacta, cinco detalles persistentes, HomePad y tarjeta sin foto; cero errores JS.",
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
