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
  homepad: "HomePad",
  mexicano: "Mexicano · Talavera",
  nemo: "Nemo · Marino",
  cubista: "Cubista",
  graduado: "Graduado",
  nostalgico: "Nostálgico",
  memphis: "Memphis",
  botanico: "Botánico",
};
const FRAME_DESCRIPTIONS = {
  mexicano:
    "Azulejo azul, flores geométricas y acentos de amarillo: un guiño a la Talavera.",
  nemo: "Azul profundo, coral y ondas: un rincón con aire marino.",
  cubista:
    "Planos asimétricos en terracota, azul y ocre, como un pequeño collage.",
  graduado:
    "Un birrete grande sobre el retrato, centrado y por fuera del marco. Queda mejor con una foto de frente y la cabeza cerca del borde superior.",
  nostalgico:
    "Una instantánea de papel cálido con cinta y borde inferior ancho.",
  memphis:
    "Bloques de color, puntos y zigzags con un aire gráfico de los ochenta.",
  botanico: "Verde profundo, hojas y líneas doradas para un rincón de jardín.",
};
const DECORATIONS = {
  none: "Sin adorno",
  flores: "Flores",
  hojas: "Hojas",
  estrellas: "Estrellas",
  velas: "Velas",
  copas: "Copas",
  globos: "Globos",
  cumpleanos: "Cumpleaños",
  confeti: "Confeti",
};
let appearance = {
    theme: "aire",
    photoMode: "frame",
    frame: "none",
    decoration: "none",
    celebrate: true,
    clock: true,
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
