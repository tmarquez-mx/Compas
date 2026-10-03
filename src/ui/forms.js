function field(name, label, value, opts = {}) {
  const attrs =
    (opts.required ? " required" : "") +
    (opts.max ? ' max="' + e(opts.max) + '"' : "") +
    (opts.min !== undefined ? ' min="' + e(opts.min) + '"' : "") +
    (opts.list ? ' list="' + opts.list + '"' : "");
  const input = opts.options
    ? '<select name="' +
      name +
      '"' +
      attrs +
      ">" +
      opts.options
        .map(
          ([v, t]) =>
            '<option value="' +
            e(v) +
            '"' +
            (value === v ? " selected" : "") +
            ">" +
            e(t) +
            "</option>",
        )
        .join("") +
      "</select>"
    : opts.textarea
      ? '<textarea name="' +
        name +
        '" rows="' +
        (opts.rows || 3) +
        '" maxlength="16000"' +
        attrs +
        ">" +
        e(value || "") +
        "</textarea>"
      : '<input name="' +
        name +
        '" type="' +
        (opts.type || "text") +
        '" value="' +
        e(value === undefined ? "" : value) +
        '"' +
        (opts.type === "number" ? ' step="1"' : ' maxlength="1000"') +
        attrs +
        ">";
  return (
    '<label class="field ' +
    (opts.wide ? "wide" : "") +
    '"><span>' +
    e(label) +
    (opts.required ? " *" : "") +
    "</span>" +
    input +
    (opts.hint ? '<small class="hint">' + e(opts.hint) + "</small>" : "") +
    "</label>"
  );
}
function formSection(title, hint) {
  return (
    '<div class="form-section"><h3>' +
    e(title) +
    "</h3>" +
    (hint ? '<p class="hint">' + e(hint) + "</p>" : "") +
    "</div>"
  );
}
function openForm(title, subtitle, body, onSubmit, onDelete, deleteText) {
  const d = $("editor");
  dialogTrigger = document.activeElement;
  d.classList.remove("appearance-dialog", "todo-import-dialog");
  d.innerHTML =
    '<form id="edit-form"><header class="dialog-top"><div><h2 id="dialog-title">' +
    e(title) +
    '</h2><p class="hint">' +
    e(subtitle) +
    "</p></div>" +
    btn("Cerrar", "close", "", "ghost") +
    '</header><div class="dialog-body"><div id="form-error" class="error" role="alert" hidden></div><div class="form-grid">' +
    body +
    '</div></div><footer class="dialog-bottom"><div>' +
    (onDelete ? btn("Eliminar registro", "delete-record", "", "danger") : "") +
    '</div><div class="toolbar">' +
    btn("Cancelar", "close") +
    '<button type="submit" class="button primary">Guardar cambios</button></div></footer></form>';
  $("edit-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    try {
      const fields = Object.fromEntries(new FormData(ev.currentTarget));
      for (const el of ev.currentTarget.querySelectorAll("[required]")) {
        if (!String(fields[el.name] || "").trim())
          throw new Error("Completa los campos marcados con *.");
      }
      onSubmit(fields);
      d.close();
      toast(
        storageAvailable
          ? "Listo. Guardado en este navegador."
          : "Registro preparado. Descarga un respaldo para conservarlo.",
      );
    } catch (err) {
      ev.currentTarget
        .querySelectorAll("details")
        .forEach((x) => (x.open = true));
      $("form-error").textContent = err.message;
      $("form-error").hidden = false;
      $("form-error").scrollIntoView({ block: "nearest" });
    }
  });
  const del = d.querySelector('[data-do="delete-record"]');
  if (del)
    del.onclick = () => {
      if (confirm(deleteText || "¿Eliminar este registro de tu bitácora?")) {
        try {
          onDelete();
          d.close();
          toast(saveMessage("Registro eliminado."));
        } catch (err) {
          $("form-error").textContent = err.message;
          $("form-error").hidden = false;
        }
      }
    };
  d.showModal();
}
function upsert(key, obj) {
  if (
    !mutate((s) => {
      const at = s[key].findIndex((x) => x.id === obj.id);
      if (at < 0) s[key].push(obj);
      else s[key][at] = obj;
    })
  )
    throw new Error(
      saveWarning || "No se pudo guardar el registro. Revisa sus campos.",
    );
}
function remove(key, id) {
  const next = C.removeRecord(state, key, id);
  if (!mutate((s) => Object.assign(s, next)))
    throw new Error("No se pudo eliminar el registro.");
}
