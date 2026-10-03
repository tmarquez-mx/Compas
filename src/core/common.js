const FOOTER = "CSP | Universidad Iberoamericana Ciudad de México";
const STATES = {
  pendiente: "Pendiente",
  "en-proceso": "En proceso",
  bloqueado: "Bloqueado",
  resuelto: "Resuelto",
};
const DISPOSITIONS = {
  incorporar: "Incorporar",
  parcial: "Incorporar parcialmente",
  justificar: "No incorporar con justificación",
  revisar: "Por decidir",
};
const CATEGORIES = [
  "Lectura",
  "Escritura",
  "Trabajo de campo / levantamiento de datos",
  "Análisis de datos",
  "Publicación",
  "Capacitación",
  "Asesoría de tesis",
  "Gestión de la investigación",
  "Otra",
];
const uid = () =>
  "c-" +
  (global.crypto && global.crypto.randomUUID
    ? global.crypto.randomUUID()
    : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const shift = (n) => {
  const d = new Date(today() + "T12:00:00");
  d.setDate(d.getDate() + n);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
const esc = (v) =>
  String(v == null ? "" : v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v) =>
  v
    ? new Date(v + "T12:00:00").toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";
const clone = (v) => JSON.parse(JSON.stringify(v));
const MAX_BACKUP_BYTES = 24 * 1024 * 1024;
