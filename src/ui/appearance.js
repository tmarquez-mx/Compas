function normalizeAppearance(saved) {
  return {
    theme: Object.hasOwn(THEMES, saved?.theme) ? saved.theme : "aire",
    photoMode: ["none", "frame", "background"].includes(saved?.photoMode)
      ? saved.photoMode
      : "frame",
    frame: Object.hasOwn(FRAME_STYLES, saved?.frame) ? saved.frame : "sencillo",
    decoration: Object.hasOwn(DECORATIONS, saved?.decoration)
      ? saved.decoration
      : "none",
    celebrate: typeof saved?.celebrate === "boolean" ? saved.celebrate : true,
  };
}
function ornamentSVG(kind) {
  if (!["flores", "hojas", "estrellas"].includes(kind)) return "";
  const sprigs =
    '<g fill="none" stroke="#6a7750" stroke-width="1.8" stroke-linecap="round"><path d="M8 170Q23 137 18 98M9 169Q39 145 69 158M142 8Q158 27 172 65"/></g><g fill="#8a9a6b" stroke="#65764c" stroke-width=".5"><path d="M18 128Q1 126 3 110Q17 110 18 128Z"/><path d="M19 119Q36 111 30 101Q18 105 19 119Z"/><path d="M14 147Q-1 143 2 133Q14 133 14 147Z"/><path d="M34 155Q35 135 47 137Q47 151 34 155Z"/><path d="M48 155Q54 169 66 167Q65 155 48 155Z"/><path d="M155 26Q139 29 138 17Q149 15 155 26Z"/><path d="M161 37Q175 25 177 37Q174 46 161 37Z"/><path d="M168 54Q153 54 154 43Q163 42 168 54Z"/></g>';
  let details = sprigs;
  if (kind === "flores") {
    const flower = (x, y, color, tilt) =>
      '<g transform="translate(' +
      x +
      " " +
      y +
      ") rotate(" +
      tilt +
      ')"><g fill="' +
      color +
      '" stroke="#9b7862" stroke-opacity=".3" stroke-width=".6"><path d="M0 1C-13-2-12-14-5-14C2-14 5-5 0 1Z"/><path d="M0 1C-2-12 10-15 13-8C17-1 7 3 0 1Z"/><path d="M0 1C12-5 18 6 11 11C5 16 0 9 0 1Z"/><path d="M0 1C9 12-1 20-7 12C-12 6-5 2 0 1Z"/><path d="M0 1C-4 13-17 8-14 0C-12-7-4-4 0 1Z"/></g><circle cy="2" r="3.8" fill="#c4a34f"/><circle cx="-1" cy="1" r="1" fill="#f5e3a4"/></g>';
    details +=
      '<path d="M9 169Q24 141 35 143M15 151Q4 127 13 115" fill="none" stroke="#6a7750" stroke-width="1.6"/>' +
      flower(13, 116, "#dfb2ab", -18) +
      flower(35, 145, "#eadbc0", 24) +
      flower(13, 160, "#baa3ba", -8) +
      flower(163, 22, "#eadbc0", 18);
  }
  if (kind === "estrellas") {
    details =
      '<g fill="none" stroke="#ad9564" stroke-width="1" stroke-linecap="round"><path d="M23 1Q22 8 18 17M163 139Q170 155 165 174"/></g><g fill="#dcc087" stroke="#a88a52" stroke-width=".8"><path d="m19 13 4 8 10 2-8 6 1 10-8-5-9 4 3-10-7-7 10-1Z"/><path d="m157 142 4 6 7 1-6 5 1 7-7-3-6 3 2-7-5-6 7 1Z"/><path d="m166 167 3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Z"/></g>';
  }
  return (
    '<svg viewBox="0 0 180 180" preserveAspectRatio="none" focusable="false">' +
    details +
    "</svg>"
  );
}
function keepsakePreview() {
  return (
    '<div class="keepsake-preview"><div class="keepsake-frame" data-frame="' +
    appearance.frame +
    '">' +
    (photoURL
      ? '<img src="' + e(photoURL) + '" alt="Vista previa de tu foto">'
      : '<div class="photo-placeholder"><span>A tu ritmo</span></div>') +
    '</div><div class="personal-ornament" aria-hidden="true">' +
    ornamentSVG(appearance.decoration) +
    "</div></div>"
  );
}
function applyAppearance() {
  document.documentElement.dataset.theme = appearance.theme;
  document.body.dataset.photoMode = photoBlob ? appearance.photoMode : "none";
  const framedPhoto = !!photoBlob && appearance.photoMode === "frame";
  const decorated = appearance.decoration !== "none";
  $("personal-keepsake").hidden = !framedPhoto && !decorated;
  $("personal-frame").hidden = !framedPhoto;
  $("personal-frame").dataset.frame = appearance.frame;
  $("keepsake-paper").hidden = framedPhoto || !decorated;
  const ornament = $("personal-ornament");
  ornament.hidden = !decorated;
  ornament.innerHTML = ornamentSVG(appearance.decoration);
  const preview = document.querySelector(".keepsake-preview");
  if (preview) {
    preview.querySelector(".keepsake-frame").dataset.frame = appearance.frame;
    preview.querySelector(".personal-ornament").innerHTML = ornamentSVG(
      appearance.decoration,
    );
  }
  for (const key of ["frame", "decoration"])
    document
      .querySelectorAll('[data-do="' + key + '"]')
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset[key] === appearance[key]),
        ),
      );
  document.querySelector(".sidebar").classList.toggle("has-frame", framedPhoto);
}
function saveAppearance() {
  applyAppearance();
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
    return true;
  } catch (_) {
    return false;
  }
}
function photoStore(mode, operation) {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(
        new Error("Este navegador no permite conservar fotografías locales."),
      );
      return;
    }
    const request = indexedDB.open("compas-personal-appearance", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("assets");
    request.onerror = () =>
      reject(new Error("No se pudo abrir el almacenamiento de la foto."));
    request.onblocked = () =>
      reject(new Error("Cierra otras pestañas de Compás e intenta de nuevo."));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      let value;
      try {
        const tx = db.transaction("assets", mode),
          r = operation(tx.objectStore("assets"));
        r.onsuccess = () => (value = r.result);
        tx.oncomplete = () => {
          db.close();
          resolve(value);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(new Error("No se pudo guardar la foto en este navegador."));
        };
      } catch (err) {
        db.close();
        reject(err);
      }
    };
  });
}
function showPhoto(blob) {
  if (photoURL) URL.revokeObjectURL(photoURL);
  photoBlob = blob;
  photoURL = blob ? URL.createObjectURL(blob) : "";
  for (const id of ["personal-image", "ambient-image"]) {
    if (photoURL) $(id).src = photoURL;
    else $(id).removeAttribute("src");
  }
  applyAppearance();
}
async function compressPhoto(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Elige una imagen JPG, PNG o WebP.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Elige una imagen menor de 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (!img.naturalWidth || !img.naturalHeight)
      throw new Error("La imagen no se pudo leer.");
    const ratio = Math.min(
        1,
        1400 / Math.max(img.naturalWidth, img.naturalHeight),
      ),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no pudo preparar la fotografía.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8),
    );
    if (!blob || blob.size >= 2 * 1024 * 1024)
      throw new Error(
        "No se pudo preparar una imagen ligera. Intenta con otra foto.",
      );
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}
function appearanceStatus(message) {
  if ($("appearance-status")) $("appearance-status").textContent = message;
  else toast(message);
}
function appearanceDialog(refresh = false) {
  const d = $("editor");
  d.classList.remove("todo-import-dialog");
  if (!refresh) dialogTrigger = document.activeElement;
  d.classList.add("appearance-dialog");
  d.innerHTML =
    '<div class="dialog-top"><div><h2 id="dialog-title">Tu rincón en Compás</h2><p class="hint">Una foto, un marco y pequeños detalles para sentir este espacio tuyo.</p></div>' +
    btn("Cerrar", "close", "", "ghost") +
    '</div><div class="dialog-body"><h3>Tema</h3><div class="theme-grid">' +
    Object.entries(THEMES)
      .map(
        ([key, label]) =>
          '<button type="button" class="theme-choice" data-do="theme" data-theme="' +
          key +
          '" aria-pressed="' +
          (appearance.theme === key) +
          '"><span class="theme-swatch ' +
          key +
          '" aria-hidden="true"></span>' +
          label +
          "</button>",
      )
      .join("") +
    '</div><h3>Tu foto y su rincón</h3><div class="photo-preview">' +
    keepsakePreview() +
    '<div><p class="hint">Flores y ramitas descansan sobre los bordes, dejando libre el centro de tu foto. Sin foto, acompañan una pequeña tarjeta. También puedes usar tu imagen como fondo suave.</p><div class="toolbar" style="margin-top:10px">' +
    btn(
      photoBlob ? "Cambiar foto" : "Elegir foto",
      "choose-photo",
      "",
      "compact",
    ) +
    (photoBlob ? btn("Quitar", "remove-photo", "", "ghost compact") : "") +
    '</div></div></div><div class="photo-modes" role="group" aria-label="Cómo mostrar tu foto">' +
    [
      ["none", "Sin foto"],
      ["frame", "Foto en tu rincón"],
      ["background", "Fondo suave"],
    ]
      .map(
        ([v, label]) =>
          '<label><input type="radio" name="photo-mode" value="' +
          v +
          '"' +
          (appearance.photoMode === v ? " checked" : "") +
          ">" +
          label +
          "</label>",
      )
      .join("") +
    '</div><h3>Tu foto, con o sin marco</h3><p class="hint">Puedes dejar la foto sola o acompañarla con lino, madera, tonos de jardín o arcilla.</p><div class="detail-choices frame-choices" role="group" aria-label="Marco para tu foto">' +
    Object.entries(FRAME_STYLES)
      .map(
        ([key, label]) =>
          '<button type="button" class="detail-choice" data-do="frame" data-frame="' +
          key +
          '" aria-pressed="' +
          (appearance.frame === key) +
          '"><span class="frame-sample keepsake-frame" data-frame="' +
          key +
          '" aria-hidden="true"></span>' +
          label +
          "</button>",
      )
      .join("") +
    '</div><h3>Un detalle para acompañarte</h3><p class="hint">Todos están disponibles desde el principio. Elige uno cuando quieras, también en los días difíciles.</p><div class="detail-choices" role="group" aria-label="Adorno de tu espacio">' +
    Object.entries(DECORATIONS)
      .map(
        ([key, label]) =>
          '<button type="button" class="detail-choice" data-do="decoration" data-decoration="' +
          key +
          '" aria-pressed="' +
          (appearance.decoration === key) +
          '"><span class="ornament-sample" aria-hidden="true">' +
          (ornamentSVG(key) || "—") +
          "</span>" +
          label +
          "</button>",
      )
      .join("") +
    '</div><label class="celebrate-option"><input type="checkbox" name="celebrate"' +
    (appearance.celebrate ? " checked" : "") +
    '> Ofrecerme un detalle al terminar una tarea, un producto o un compromiso</label><p class="hint">Es una invitación opcional, no una calificación ni una aprobación académica.</p><p class="hint">La foto, los marcos y los adornos permanecen en este navegador. No se incluyen en respaldos ni reportes; puedes volver a elegirlos si cambias de equipo.</p><p class="appearance-status" id="appearance-status" role="status"></p></div><div class="dialog-bottom">' +
    btn("Restablecer apariencia", "reset-appearance", "", "ghost") +
    btn("Listo", "close", "", "primary") +
    "</div>";
  if (!d.open) d.showModal();
}
applyAppearance();
photoStore("readonly", (store) => store.get("photo"))
  .then((blob) => {
    if (
      photoRevision === 0 &&
      blob instanceof Blob &&
      blob.type === "image/jpeg" &&
      blob.size < 2 * 1024 * 1024
    )
      showPhoto(blob);
  })
  .catch(() => {});
