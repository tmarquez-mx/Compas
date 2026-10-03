function replaceState(next, label, { recoveryRaw = null } = {}) {
  if (
    dirty &&
    !confirm(
      "Tienes cambios sin un respaldo confirmado. ¿Reemplazar la bitácora actual? Cancela para guardar primero tu respaldo.",
    )
  )
    return false;
  let resolve = false;
  try {
    if (workspace.rawBase !== null) C.restore(workspace.rawBase);
  } catch (_) {
    resolve = true;
  }
  if (!saveWorkspace(next, { replace: true, resolve, recoveryRaw }))
    return false;
  pendingBackup = null;
  celebration = "";
  reportOptions = null;
  previewShare = null;
  actionFilter = "todos";
  routeLevel = "";
  routeSemester = "";
  todoFilter = "pendientes";
  $("editor").close();
  navigate("brujula");
  toast(saveMessage(label));
  return true;
}
function prepareReport() {
  initReport();
  if (
    reportOptions.from &&
    reportOptions.to &&
    reportOptions.from > reportOptions.to
  ) {
    toast("La fecha inicial debe ser igual o anterior a la fecha de corte.");
    return;
  }
  previewShare = C.makeShare(state, reportOptions);
  if (
    !previewShare.project &&
    !previewShare.actions.length &&
    !previewShare.decisions.length &&
    !previewShare.sessions.length &&
    !previewShare.route.length
  ) {
    previewShare = null;
    toast("Selecciona al menos un registro o el rumbo de tu tesis.");
    return;
  }
  render();
  $("report-frame").scrollIntoView({ behavior: "smooth", block: "start" });
}
const actionHandlers = {
  close: (b, id) => $("editor").close(),
  "confirm-backup": confirmBackup,
  "retry-edit": (b, id) => acquireEditing(true),
  recovery: recoveryDialog,
  "recovery-download": (b, id) => {
    const r = recoveryDraft?.[b.dataset.kind];
    if (r)
      download(
        r.raw,
        "Compas-recuperacion-" + C.today() + ".json",
        "application/json",
      );
  },
  "recovery-restore": (b, id) => {
    const r = recoveryDraft?.[b.dataset.kind];
    if (r?.state)
      replaceState(r.state, "Copia recuperada. Revisa tus registros.", {
        recoveryRaw: b.dataset.kind === "recovery" ? r.raw : null,
      });
  },
  "recovery-release": (b, id) => {
    const r = recoveryDraft?.recovery;
    if (
      r &&
      confirm(
        "¿Ya localizaste y guardaste el archivo de esta copia anterior? Al continuar se libera su espacio de recuperación.",
      )
    ) {
      const result = workspace.releaseRecovery(r.raw);
      if (result.ok) {
        recoveryDialog();
        saveInfo();
      } else toast(result.message);
    }
  },
  "todo-import": todoImportStart,
  "todo-import-other": todoImportStart,
  "todo-import-text": (b, id) => {
    try {
      todoImportLoad(
        $("todo-import-paste").value,
        $("todo-import-format").value,
        "Texto pegado",
      );
    } catch (err) {
      todoImportError(err.message);
    }
  },
  "todo-import-all": (b, id) => {
    todoImportDraft.selected = new Set(
      todoImportDraft.candidates
        .filter(
          (c) => !c.issues.length && !todoImportDraft.duplicates.has(c.index),
        )
        .map((c) => c.index),
    );
    todoImportPreview();
  },
  "todo-import-none": (b, id) => {
    todoImportDraft.selected.clear();
    todoImportPreview();
  },
  "todo-import-page": (b, id) => {
    todoImportDraft.page = Number(b.dataset.page);
    todoImportPreview();
  },
  "todo-import-commit": todoImportCommit,
  "todo-calendar": () => todoCalendarStart(),
  "todo-calendar-all": () => todoCalendarSelect(true),
  "todo-calendar-none": () => todoCalendarSelect(false),
  "todo-calendar-download": () => todoCalendarDownload(),
  help,
  backup,
  open: (b, id) => $("backup-input").click(),
  project: projectForm,
  level: levelForm,
  appearance: (b, id) => appearanceDialog(),
  "dismiss-celebration": () => {
    celebration = "";
    render();
  },
  frame: (b) => {
    if (!Object.hasOwn(FRAME_STYLES, b.dataset.frame)) return;
    appearance.frame = b.dataset.frame;
    const stored = saveAppearance();
    appearanceStatus(
      stored
        ? "Marco guardado en este navegador."
        : "Marco elegido para esta sesión.",
    );
  },
  decoration: (b) => {
    if (!Object.hasOwn(DECORATIONS, b.dataset.decoration)) return;
    appearance.decoration = b.dataset.decoration;
    const stored = saveAppearance();
    appearanceStatus(
      stored
        ? "Detalle guardado en este navegador."
        : "Detalle elegido para esta sesión.",
    );
  },
  "toggle-nav": (b, id) => {
    const expanded = $("module-nav").classList.toggle("nav-expanded");
    $("mobile-menu").setAttribute("aria-expanded", String(expanded));
  },
  theme: (b, id) => {
    if (!Object.hasOwn(THEMES, b.dataset.theme)) return;
    appearance.theme = b.dataset.theme;
    const stored = saveAppearance();
    document
      .querySelectorAll(".theme-choice")
      .forEach((x) =>
        x.setAttribute(
          "aria-pressed",
          String(x.dataset.theme === appearance.theme),
        ),
      );
    appearanceStatus(
      stored
        ? "Tema aplicado. Puedes seguir trabajando."
        : "Tema aplicado en esta sesión; el navegador no permite guardar la preferencia.",
    );
  },
  "choose-photo": (b, id) => {
    if (!photoBusy) $("photo-input").click();
  },
  "remove-photo": async (b, id) => {
    if (photoBusy) return;
    photoBusy = true;
    photoRevision++;
    appearanceStatus("Quitando la foto…");
    try {
      await photoStore("readwrite", (store) => store.delete("photo"));
      showPhoto(null);
      appearanceDialog(true);
      appearanceStatus("Foto quitada de este navegador.");
    } catch (err) {
      appearanceStatus(err.message);
    } finally {
      photoBusy = false;
    }
  },
  "reset-appearance": (b, id) => {
    appearance = normalizeAppearance({ photoMode: "none" });
    const stored = saveAppearance();
    appearanceDialog(true);
    appearanceStatus(
      stored
        ? "Tema Aire restablecido. La foto queda oculta; puedes quitarla si lo deseas."
        : "Apariencia restablecida para esta sesión.",
    );
  },
  "route-progress": (b, id) => routeForm(id),
  "route-stage": (b, id) => {
    routeSemester = b.dataset.semester;
    render();
  },
  "todo-edit": (b, id) => todoForm(id, b.dataset.source, b.dataset.milestone),
  action: (b, id) => actionForm(id, b.dataset.source, b.dataset.milestone),
  session: (b, id) => sessionForm(id, b.dataset.type),
  decision: (b, id) => decisionForm(id),
  evolve: (b, id) => decisionForm(null, id),
  time: (b, id) => timeForm(id),
  reflection: (b, id) => reflectionForm(id),
  new: (b, id) => {
    if (replaceState(C.blank(), "Tu nueva bitácora está lista.")) projectForm();
  },
  demo: (b, id) => replaceState(C.demo(), "Ejemplo ficticio cargado."),
  preview: prepareReport,
  html: (b, id) => {
    if (previewShare) {
      download(
        C.reportHTML(previewShare),
        "Compas-consulta-" + (previewShare.to || C.today()) + ".html",
        "text/html;charset=utf-8",
      );
      toast("Panel de consulta preparado con tu selección.");
    }
  },
  excel: (b, id) => {
    if (previewShare) {
      download(
        C.excelBytes(previewShare),
        "Compas-reporte-" + (previewShare.to || C.today()) + ".xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      toast("Excel preparado con los registros seleccionados.");
    }
  },
  pdf: (b, id) => {
    const frame = $("report-frame");
    if (frame) {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (_) {
        toast("Usa el botón Imprimir / Guardar PDF dentro de la vista previa.");
      }
    }
  },
};
document.addEventListener("click", (ev) => {
  const nav = ev.target.closest("[data-view]");
  if (nav) {
    navigate(nav.dataset.view);
    return;
  }
  const b = ev.target.closest("[data-do]");
  if (!b) return;
  const a = b.dataset.do,
    id = b.dataset.id;
  if (a === "delete-record") return;
  if (
    [
      "project",
      "level",
      "todo-edit",
      "route-progress",
      "action",
      "session",
      "decision",
      "evolve",
      "time",
      "reflection",
      "todo-import",
    ].includes(a) &&
    !ensureEditable()
  )
    return;

  if (Object.hasOwn(actionHandlers, a)) actionHandlers[a](b, id);
});
document.addEventListener("change", (ev) => {
  const el = ev.target;
  if (el.dataset.calendarSelect !== undefined) {
    if (!todoCalendarDraft) return;
    const id = el.dataset.calendarSelect;
    if (!todoCalendarDraft.candidates.some((task) => task.id === id)) return;
    if (el.checked) todoCalendarDraft.selected.add(id);
    else todoCalendarDraft.selected.delete(id);
    todoCalendarUpdate();
    return;
  }
  if (el.name === "celebrate") {
    appearance.celebrate = el.checked;
    if (!el.checked) celebration = "";
    const stored = saveAppearance();
    render();
    appearanceStatus(
      stored
        ? "Preferencia guardada. Tú eliges cómo acompañar tus avances."
        : "Preferencia aplicada en esta sesión.",
    );
    return;
  }
  if (el.dataset.importMap) {
    todoImportDraft.mapping[el.dataset.importMap] = Number(el.value);
    todoImportRemap();
    todoImportPreview();
    return;
  }
  if (el.id === "todo-import-date-order" || el.id === "todo-import-notes") {
    todoImportDraft.options[
      el.id === "todo-import-date-order" ? "dateOrder" : "includeNotes"
    ] = el.type === "checkbox" ? el.checked : el.value;
    todoImportRemap();
    todoImportPreview();
    return;
  }
  if (el.dataset.importSelect !== undefined) {
    const index = Number(el.dataset.importSelect);
    if (el.checked) todoImportDraft.selected.add(index);
    else todoImportDraft.selected.delete(index);
    const count = todoImportDraft.selected.size;
    const b = $("editor").querySelector('[data-do="todo-import-commit"]');
    b.textContent = "Añadir " + count + " tareas a ToDo";
    b.disabled = !count;
    const n = $("todo-import-count");
    n.textContent =
      count +
      " seleccionadas · " +
      todoImportDraft.candidates.filter(
        (c) => !c.issues.length && !todoImportDraft.duplicates.has(c.index),
      ).length +
      " disponibles" +
      (todoImportDraft.duplicates.size
        ? " · " + todoImportDraft.duplicates.size + " duplicadas"
        : "");
    return;
  }
  if (el.id === "todo-import-file") {
    const file = el.files[0];
    if (!file) return;
    const revision = ++todoImportRevision;
    el.disabled = true;
    Promise.resolve()
      .then(async () => {
        if (file.size > 2 * 1024 * 1024)
          throw new Error(
            "El archivo supera los 2 MB. Exporta una selección más pequeña.",
          );
        const format = file.name.toLowerCase().endsWith(".ics")
          ? "ics"
          : file.name.toLowerCase().endsWith(".csv")
            ? "csv"
            : "";
        if (!format)
          throw new Error(
            "Elige un archivo CSV o ICS; descomprime el ZIP si es necesario.",
          );
        let text;
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(
            await file.arrayBuffer(),
          );
        } catch (_) {
          throw new Error(
            "No se pudo leer como UTF-8. Exporta el archivo como CSV UTF-8 o ICS.",
          );
        }
        if (revision === todoImportRevision && $("editor").open)
          todoImportLoad(text, format, file.name);
      })
      .catch((err) => {
        if (revision === todoImportRevision && $("editor").open)
          todoImportError(err.message);
      })
      .finally(() => {
        if (el.isConnected) {
          el.disabled = false;
          el.value = "";
        }
      });
    return;
  }
  if (el.name === "photo-mode") {
    appearance.photoMode = el.value;
    const stored = saveAppearance();
    appearanceStatus(
      !photoBlob && el.value !== "none"
        ? "Elige una foto para verla aquí."
        : stored
          ? "Preferencia guardada en este navegador."
          : "Preferencia aplicada sólo en esta sesión.",
    );
    return;
  }
  if (el.id === "route-level") {
    routeLevel = el.value;
    routeSemester = "1";
    render();
    return;
  }
  if (el.id === "todo-filter") {
    todoFilter = el.value;
    render();
    return;
  }
  if (el.dataset.todoCheck) {
    const id = el.dataset.todoCheck,
      done = el.checked,
      next = C.setTodoDone(state, id, done);
    if (mutate((s) => Object.assign(s, next))) {
      toast(
        saveMessage(done ? "Un paso terminado." : "Tarea abierta de nuevo."),
        () => mutate((s) => Object.assign(s, C.setTodoDone(s, id, !done))),
      );
      const focus =
        document.querySelector('[data-todo-check="' + CSS.escape(id) + '"]') ||
        document.querySelector('[data-do="todo-edit"]');
      focus?.focus({ preventScroll: true });
    }
    return;
  }
  if (el.id === "time-period") {
    timePeriod = el.value;
    render();
    return;
  }
  if (el.id === "action-filter") {
    actionFilter = el.value;
    render();
    return;
  }
  if (el.dataset.reportList) {
    const key = el.dataset.reportList;
    reportOptions[key] = el.checked
      ? [...new Set([...reportOptions[key], el.value])]
      : reportOptions[key].filter((x) => x !== el.value);
    previewShare = null;
    render();
    return;
  }
  const map = {
    "report-title": "title",
    "report-from": "from",
    "report-to": "to",
    "report-project": "project",
    "report-names": "names",
  };
  if (map[el.id]) {
    reportOptions[map[el.id]] = el.type === "checkbox" ? el.checked : el.value;
    previewShare = null;
    if (el.id === "report-title") {
      const preview = document.querySelector(".report-preview");
      if (preview) preview.remove();
    } else render();
  }
});
$("backup-input").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  try {
    if (file.size > C.MAX_BACKUP_BYTES)
      throw new Error("El archivo excede el límite de 24 MB.");
    const next = C.restore(await file.text());
    replaceState(next, "Respaldo abierto. Puedes continuar tu trayectoria.");
  } catch (err) {
    toast(err.message);
  } finally {
    ev.target.value = "";
  }
});
$("photo-input").addEventListener("change", async (ev) => {
  const file = ev.target.files[0];
  if (!file || photoBusy) return;
  photoBusy = true;
  photoRevision++;
  appearanceStatus("Preparando tu foto…");
  try {
    const blob = await compressPhoto(file);
    let photoStored = true;
    try {
      await photoStore("readwrite", (store) => store.put(blob, "photo"));
    } catch (_) {
      photoStored = false;
    }
    showPhoto(blob);
    if (appearance.photoMode === "none") appearance.photoMode = "frame";
    const stored = saveAppearance();
    if ($("editor").open && $("appearance-status")) appearanceDialog(true);
    appearanceStatus(
      !photoStored
        ? "La foto está visible sólo en esta sesión. No se pudo conservar el cambio de foto en este navegador."
        : stored
          ? "Foto guardada sólo en este navegador."
          : "Foto guardada; la preferencia de presentación vale sólo para esta sesión.",
    );
  } catch (err) {
    appearanceStatus(
      err.message || "No se pudo leer la imagen. Intenta con otra foto.",
    );
  } finally {
    photoBusy = false;
    ev.target.value = "";
  }
});
$("editor").addEventListener("close", () => {
  todoCalendarDraft = null;
  todoImportDraft = null;
  todoImportRevision++;
  recoveryDraft = null;
  if (dialogTrigger?.isConnected) dialogTrigger.focus({ preventScroll: true });
  else
    document
      .querySelector('.nav-item[aria-current="page"]')
      ?.focus({ preventScroll: true });
});
document.addEventListener(
  "invalid",
  (ev) => {
    ev.target.closest("details")?.setAttribute("open", "");
  },
  true,
);
window.addEventListener("beforeunload", (ev) => {
  if (dirty && !storageAvailable) {
    ev.preventDefault();
    ev.returnValue = "";
  }
});
window.addEventListener("storage", (ev) => {
  if (ev.key === KEY && ev.newValue !== workspace.rawBase) {
    saveStatus = "conflict";
    storageAvailable = false;
    saveInfo();
  }
});
window.addEventListener("pagehide", releaseEditing);
window.addEventListener("pageshow", (ev) => {
  if (ev.persisted) acquireEditing(false);
});
window.addEventListener("hashchange", () => {
  const next = location.hash.slice(1);
  if (Object.hasOwn(views, next) && next !== view) {
    view = next;
    render();
  }
});
view = Object.hasOwn(views, location.hash.slice(1))
  ? location.hash.slice(1)
  : "brujula";
render();
installButtonHelp();
acquireEditing(true);
// This optional browser integration navigates only; it does not return personal records.
if (document.modelContext && document.modelContext.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(
      document.modelContext.registerTool(
        {
          name: "navigate_compas_module",
          title: "Abrir un módulo de Compás",
          description:
            "Abre un módulo visible de Compás. No devuelve el contenido de la bitácora ni modifica sus registros.",
          inputSchema: {
            type: "object",
            properties: {
              module: { type: "string", enum: Object.keys(views) },
            },
            required: ["module"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (
              !input ||
              Object.keys(input).length !== 1 ||
              !Object.hasOwn(views, input.module)
            )
              throw new Error("Selecciona un módulo válido.");
            navigate(input.module);
            return { openedModule: input.module };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch (_) {}
  window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
}
