"use strict";

// Orden explícito del ensamblado. No hay carga de módulos ni red al abrir Compas.html.
// Los fragmentos de cada grupo comparten un cierre privado; solo api.js expone el núcleo.
module.exports = {
  COMPAS_STYLES: { files: ["styles.css"] },
  COMPAS_CORE: {
    files: [
      "core/common.js",
      "core/reference.js",
      "core/route.js",
      "core/state.js",
      "core/reports.js",
      "core/excel.js",
      "core/todo-import.js",
      "core/calendar.js",
      "core/api.js",
    ],
    before: "(function (global) {\n'use strict';\n",
    after: "\n})(globalThis);",
  },
  COMPAS_STORAGE: { files: ["storage.js"] },
  COMPAS_UI: {
    files: [
      "ui/device.js",
      "ui/state.js",
      "ui/workspace.js",
      "ui/appearance.js",
      "ui/shared.js",
      "ui/encouragement.js",
      "ui/render.js",
      "ui/route.js",
      "ui/todo.js",
      "ui/todo-import.js",
      "ui/calendar.js",
      "ui/brujula.js",
      "ui/sessions.js",
      "ui/commitments.js",
      "ui/dedication.js",
      "ui/journal.js",
      "ui/reports.js",
      "ui/forms.js",
      "ui/help.js",
      "ui/button-help.js",
      "ui/events.js",
    ],
    // Las funciones de device.js se elevan dentro del cierre. Retornar aquí
    // impide que se inicialice la bitácora en teléfonos y tabletas.
    before:
      "(function () {\n'use strict';\nif (isHandheld(navigator)) {\nshowDesktopNotice();\nreturn;\n}\n",
    after: "\n})();",
  },
};
