function stateStamp() {
  const value = JSON.stringify(C.validate(state));
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ value.charCodeAt(i);
  }
  return (a >>> 0).toString(16) + "-" + (b >>> 0).toString(16);
}
try {
  const raw = localStore?.getItem(BACKUP_META_KEY);
  if (raw) {
    const m = JSON.parse(raw);
    if (
      m?.confirmed === true &&
      typeof m.stamp === "string" &&
      typeof m.projectId === "string" &&
      Number.isFinite(Date.parse(m.at))
    )
      backupMeta = m;
  }
  if (
    backupMeta?.projectId === state.project.id &&
    backupMeta.stamp === stateStamp()
  )
    dirty = false;
} catch (_) {}
try {
  const saved = JSON.parse(localStore?.getItem(APPEARANCE_KEY) || "null");
  if (
    saved &&
    Object.hasOwn(THEMES, saved.theme) &&
    ["none", "frame", "background"].includes(saved.photoMode)
  )
    appearance = normalizeAppearance(saved);
} catch (_) {}
function toast(t, undo) {
  const n = $("toast");
  n.textContent = t;
  if (undo) {
    const projectId = state.project.id;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Deshacer";
    button.onclick = () => {
      if (state.project.id !== projectId) {
        toast("Ese cambio pertenece a otra bitácora.");
        return;
      }
      n.hidden = true;
      undo();
    };
    n.append(button);
  }
  n.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (n.hidden = true), undo ? 10000 : 5000);
}
function saveMessage(text) {
  return storageAvailable
    ? text
    : text +
        " El cambio está solo en esta sesión. Descarga tu respaldo para conservarlo.";
}
function saveInfo() {
  const meta = backupMeta?.projectId === state.project.id ? backupMeta : null,
    last = meta
      ? new Date(meta.at).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
        })
      : "";
  const saved = storageAvailable
    ? "Guardado en este navegador"
    : "Cambios solo en esta sesión";
  const detail = meta
    ? "Respaldo confirmado: " + last + (dirty ? " · Hay avances nuevos" : "")
    : "Descarga y confirma tu respaldo personal";
  $("save-info").innerHTML =
    '<strong><span class="save-dot" aria-hidden="true"></span>' +
    e(
      writeMode === "readonly"
        ? "Consulta · otra pestaña está editando"
        : writeMode === "pending"
          ? "Preparando tu espacio"
          : state.isDemo
            ? "Ejemplo ficticio"
            : saved,
    ) +
    "</strong><small>Compás " +
    e(VERSION) +
    " · " +
    e(detail) +
    "</small>";
  workspaceNotice();
  updateEditControls();
}
function updateEditControls() {
  const blocked =
    ["pending", "readonly"].includes(writeMode) || saveStatus === "conflict";
  const editing = [
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
    "new",
    "demo",
  ];
  document.querySelectorAll("#main [data-do]").forEach((n) => {
    if (editing.includes(n.dataset.do))
      n.disabled =
        blocked ||
        (saveStatus === "corrupt" && !["new", "demo"].includes(n.dataset.do));
  });
  document
    .querySelectorAll("[data-todo-check]")
    .forEach((n) => (n.disabled = blocked || saveStatus === "corrupt"));
  const openButton = document.querySelector('[data-do="open"]');
  if (openButton) openButton.disabled = blocked;
}
function workspaceNotice() {
  const n = $("workspace-notice");
  if (!n) return;
  let text = "",
    actions = "";
  if (writeMode === "pending")
    text = "Comprobando que esta sea la única pestaña de edición…";
  else if (writeMode === "readonly") {
    text =
      "Compás está abierto para editar en otra pestaña. Aquí puedes consultar y descargar un respaldo. Cierra la otra pestaña para continuar aquí.";
    actions = btn("Volver a comprobar", "retry-edit", "", "compact");
  } else if (saveStatus === "conflict") {
    text =
      "Otra copia cambió la bitácora del navegador. Tus anotaciones siguen en esta pestaña. Descarga tu respaldo antes de cerrar y vuelve a abrir Compás.";
    actions = btn("Descargar mis anotaciones", "backup", "", "compact");
  } else if (saveStatus === "corrupt") {
    text =
      "La copia del navegador no se pudo leer. Se conserva intacta; puedes descargarla desde Recuperación o abrir un respaldo válido. El ejemplo no la sustituye.";
    actions = btn("Recuperación", "recovery", "", "compact");
  } else if (writeMode === "session" || (!storageAvailable && dirty)) {
    text =
      "Trabajas en modo temporal: los cambios permanecen en esta pestaña. Descarga y confirma un respaldo antes de cerrar.";
    actions = btn("Descargar respaldo", "backup", "", "compact");
  } else if (saveWarning) {
    text = saveWarning;
    actions = btn("Recuperación", "recovery", "", "compact");
  }
  if (pendingBackup) {
    text +=
      (text ? " " : "") +
      "Tu respaldo está preparado. Confírmalo cuando hayas localizado el archivo descargado.";
    actions += btn("Ya guardé el archivo", "confirm-backup", "", "compact");
  }
  n.hidden = !text;
  n.innerHTML = text
    ? "<p>" +
      e(text) +
      "</p>" +
      (pendingBackup
        ? '<p class="hint">Puedes guardar el JSON en tu computadora o moverlo a una carpeta de Google Drive, OneDrive, Dropbox u otro servicio que ya uses. La subida a la nube necesita internet y la gestiona ese servicio. Compás no conecta cuentas ni sincroniza dispositivos.</p>'
        : "") +
      '<div class="toolbar">' +
      actions +
      "</div>"
    : "";
}
function ensureEditable() {
  if (
    writeMode === "pending" ||
    writeMode === "readonly" ||
    saveStatus === "conflict"
  ) {
    toast(
      writeMode === "readonly"
        ? "Cierra la otra pestaña de edición y pulsa Volver a comprobar."
        : saveStatus === "conflict"
          ? "Descarga tus anotaciones y vuelve a abrir Compás antes de editar."
          : "Espera a que termine la comprobación de guardado.",
    );
    return false;
  }
  if (saveStatus === "corrupt") {
    toast(
      "Abre un respaldo válido o elige una nueva bitácora. La copia dañada se conservará en Recuperación.",
    );
    return false;
  }
  return true;
}
function saveWorkspace(
  next,
  { replace = false, resolve = false, recoveryRaw = null } = {},
) {
  if (!replace && !ensureEditable()) return false;
  if (
    writeMode === "pending" ||
    writeMode === "readonly" ||
    saveStatus === "conflict"
  ) {
    ensureEditable();
    return false;
  }
  let result;
  try {
    result =
      recoveryRaw !== null
        ? workspace.restoreRecovery(recoveryRaw)
        : resolve
          ? workspace.resolve(next)
          : replace
            ? workspace.replace(next)
            : workspace.save(next);
  } catch (err) {
    toast(err.message);
    return false;
  }
  if (!result.ok) {
    saveStatus = result.status;
    saveWarning = result.message || "";
    if (result.status === "conflict") storageAvailable = false;
    saveInfo();
    toast(result.message);
    return false;
  }
  state = result.state;
  dirty = true;
  previewShare = null;
  storageAvailable = result.persisted === true;
  saveStatus = storageAvailable ? "saved" : "temporary";
  saveWarning =
    result.persisted &&
    result.message !== "La copia de Compás está guardada en este navegador."
      ? result.message || ""
      : "";
  saveInfo();
  return true;
}

function mutate(fn) {
  if (!ensureEditable()) {
    render();
    return false;
  }
  const next = C.clone(state);
  const previous = state;
  try {
    fn(next);
    if (!saveWorkspace(next)) {
      render();
      return false;
    }
  } catch (err) {
    toast(err.message);
    return false;
  }
  if (appearance.celebrate)
    celebration =
      completedStep(previous, state) ||
      (completedStep(state, previous) ? "" : celebration);
  render();
  return true;
}
function download(content, name, type) {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function backup() {
  const name = "Compas-respaldo-personal-" + C.today() + ".json";
  try {
    download(C.backup(state), name, "application/json");
    pendingBackup = {
      projectId: state.project.id,
      stamp: stateStamp(),
      at: new Date().toISOString(),
      name,
    };
    saveInfo();
    toast(
      "Respaldo preparado. Localiza el archivo descargado y confirma que lo guardaste.",
    );
  } catch (err) {
    toast("No se pudo preparar el respaldo: " + err.message);
  }
}
function confirmBackup() {
  if (!pendingBackup) return false;
  if (
    pendingBackup.projectId !== state.project.id ||
    pendingBackup.stamp !== stateStamp()
  ) {
    pendingBackup = null;
    saveInfo();
    toast(
      "Hay cambios posteriores a ese respaldo. Descarga uno nuevo para conservarlos.",
    );
    return false;
  }
  backupMeta = { ...pendingBackup, confirmed: true };
  pendingBackup = null;
  dirty = false;
  try {
    localStore?.setItem(BACKUP_META_KEY, JSON.stringify(backupMeta));
  } catch (_) {}
  saveInfo();
  toast(
    "Respaldo confirmado por ti. Conserva el archivo para continuar tu trabajo.",
  );
  return true;
}
function acquireEditing(reload = false) {
  if (lockRequestPending || writeMode === "owner") return;
  lockRequestPending = true;
  writeMode = "pending";
  saveInfo();
  if (!navigator.locks?.request) {
    writeMode = "session";
    lockRequestPending = false;
    saveInfo();
    return;
  }
  Promise.resolve()
    .then(() =>
      navigator.locks.request(
        KEY + "-editing",
        { mode: "exclusive", ifAvailable: true },
        async (lock) => {
          lockRequestPending = false;
          if (!lock) {
            writeMode = "readonly";
            saveInfo();
            return;
          }
          writeMode = "owner";
          if (reload) {
            const current = workspace.reload();
            if (current.state) {
              state = current.state;
              dirty = !(
                backupMeta?.projectId === state.project.id &&
                backupMeta.stamp === stateStamp()
              );
              storageAvailable = true;
              saveStatus = "saved";
              saveWarning = "";
            } else {
              storageAvailable = false;
              saveStatus =
                current.status === "ready" ? "empty" : current.status;
              saveWarning = [
                "corrupt",
                "unavailable",
                "conflict",
                "error",
              ].includes(current.status)
                ? current.message || ""
                : "";
            }
            render();
          } else saveInfo();
          await new Promise((resolve) => {
            releaseEditLock = resolve;
          });
          releaseEditLock = null;
        },
      ),
    )
    .catch(() => {
      lockRequestPending = false;
      writeMode = "session";
      saveInfo();
    });
}
function releaseEditing() {
  if (releaseEditLock) {
    writeMode = "pending";
    releaseEditLock();
    releaseEditLock = null;
  }
}
function recoveryDialog() {
  const d = $("editor");
  dialogTrigger = document.activeElement;
  d.classList.remove("appearance-dialog", "todo-import-dialog");
  recoveryDraft = {
    recovery: workspace.getRecovery(),
    journal: workspace.getJournal(),
  };
  try {
    if (workspace.rawBase !== null) C.restore(workspace.rawBase);
  } catch (_) {
    recoveryDraft.damaged = {
      raw: workspace.rawBase,
      reason: "Copia del navegador que no pudo leerse",
    };
  }
  const records = Object.entries(recoveryDraft).filter(([, r]) => r),
    canRecover = writeMode === "owner" && saveStatus !== "conflict";
  d.innerHTML =
    '<div class="dialog-top"><div><h2 id="dialog-title">Recuperación de tu trabajo</h2><p class="hint">Estas copias permanecen en este navegador. Descárgalas antes de sustituirlas.</p></div>' +
    btn("Cerrar", "close", "", "ghost") +
    '</div><div class="dialog-body">' +
    (records.length
      ? records
          .map(
            ([key, r]) =>
              '<section class="recovery-record"><h3>' +
              e(
                key === "damaged"
                  ? "Copia que no pudo leerse"
                  : key === "recovery"
                    ? "Copia anterior conservada"
                    : "Última copia de seguridad local",
              ) +
              '</h3><p class="hint">' +
              e(
                {
                  replace: "Bitácora anterior a un reemplazo",
                  resolve: "Copia anterior conservada",
                  corrupt: "Copia que no pudo leerse",
                  save: "Copia anterior al último cambio",
                  "recovery-swap": "Bitácora anterior a una recuperación",
                  recover: "Bitácora anterior a una recuperación",
                }[r.reason] || "Copia de recuperación",
              ) +
              (r.at ? " · " + e(new Date(r.at).toLocaleString("es-MX")) : "") +
              '</p><div class="toolbar">' +
              btn(
                "Descargar copia",
                "recovery-download",
                'data-kind="' + key + '"',
                "compact",
              ) +
              (r.state &&
              (key === "recovery" ||
                !recoveryDraft.recovery ||
                recoveryDraft.recovery.raw === workspace.rawBase)
                ? btn(
                    "Recuperar esta bitácora",
                    "recovery-restore",
                    'data-kind="' + key + '"' + (canRecover ? "" : " disabled"),
                    "compact",
                  )
                : "") +
              (r.state &&
              key === "journal" &&
              recoveryDraft.recovery &&
              recoveryDraft.recovery.raw !== workspace.rawBase
                ? '<p class="hint">Para recuperar esta copia, descarga y libera primero la copia anterior conservada.</p>'
                : "") +
              "</div>" +
              (key === "recovery"
                ? '<details class="details"><summary>Después de guardar esta copia</summary><p class="hint">Cuando hayas localizado el archivo descargado, puedes liberar este espacio para conservar otra copia anterior. Esto no borra tu bitácora actual.</p>' +
                  btn(
                    "Ya guardé la copia · liberar espacio",
                    "recovery-release",
                    canRecover ? "" : "disabled",
                    "compact",
                  ) +
                  "</details>"
                : "") +
              "</section>",
          )
          .join("")
      : "<p>Aún no hay copias de recuperación. Tu respaldo descargado sigue siendo la forma de conservar el trabajo.</p>") +
    '<p class="hint">Los archivos incluyen información privada. Una copia dañada se descarga tal como está; conserva el archivo si necesitas ayuda para recuperarlo.</p></div><div class="dialog-bottom">' +
    btn("Listo", "close", "", "primary") +
    "</div>";
  if (!d.open) d.showModal();
}
