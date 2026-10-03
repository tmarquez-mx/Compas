const C = globalThis.CompasCore,
  e = C.esc,
  fmt = C.fmt,
  $ = (id) => document.getElementById(id),
  KEY = "compas-personal-v1";
const VERSION = document.querySelector('meta[name="compas-version"]').content;
const views = {
  brujula: "Brújula",
  ruta: "Mi ruta",
  todo: "ToDo",
  coloquios: "Coloquios",
  supervision: "Asesoría de tesis",
  dedicacion: "Diario",
  reportes: "Reportes",
};
let state = C.demo(),
  view = "brujula",
  dirty = false,
  storageAvailable = false,
  previewShare = null,
  timePeriod = "30",
  timeExpanded = false,
  actionFilter = "todos",
  routeLevel = "",
  routeSemester = "",
  todoFilter = "pendientes",
  reportOptions = null,
  toastTimer;
const APPEARANCE_KEY = "compas-appearance-v1",
  BACKUP_META_KEY = "compas-backup-status-v1";
const THEMES = { aire: "Aire", cielo: "Cielo", noche: "Noche", ibero: "IBERO" };
const FRAME_STYLES = {
  none: "Sin marco",
  sencillo: "Lino",
  madera: "Madera",
  jardin: "Jardín",
  cielo: "Arcilla",
};
const DECORATIONS = {
  none: "Sin adorno",
  flores: "Flores",
  hojas: "Hojas",
  estrellas: "Estrellas",
};
let appearance = {
    theme: "aire",
    photoMode: "frame",
    frame: "sencillo",
    decoration: "none",
    celebrate: true,
  },
  photoBlob = null,
  photoURL = "",
  backupMeta = null,
  pendingBackup = null,
  dialogTrigger = null,
  photoBusy = false,
  photoRevision = 0,
  recoveryDraft = null;
let celebration = "";
let writeMode = "pending",
  saveStatus = "pending",
  saveWarning = "",
  releaseEditLock = null,
  lockRequestPending = false;
let localStore = null;
try {
  localStore = window.localStorage;
} catch (_) {}
const workspace = globalThis.CompasStorage.startStorage({
  storage: localStore,
  key: KEY,
  core: C,
  canWrite: () => writeMode === "owner",
});
const opened = workspace.open();
if (opened.state) {
  state = opened.state;
  dirty = true;
  storageAvailable = true;
  saveStatus = "saved";
} else if (opened.status === "corrupt") {
  saveStatus = "corrupt";
  saveWarning = opened.message;
} else if (opened.status === "unavailable") {
  saveStatus = "temporary";
  saveWarning = opened.message;
}
