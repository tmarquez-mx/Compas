// Calendario iCalendar (RFC 5545). Se exportan eventos de día completo,
// compatibles con la importación de Google Calendar, Apple y Outlook.
function calendarDate(value) {
  if (typeof value !== "string" || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))
    return false;
  const date = new Date(value + "T00:00:00Z");
  return (
    value.slice(0, 4) !== "0000" &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
function calendarCandidates(input) {
  if (!input || !Array.isArray(input.todos) || input.todos.length > 3000)
    throw new Error("No se pudo leer la lista de tareas.");
  const candidates = [],
    ids = new Set();
  for (const task of input.todos) {
    if (!task || task.done !== false || !task.due) continue;
    if (
      typeof task.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(task.id) ||
      ids.has(task.id) ||
      typeof task.title !== "string" ||
      !task.title.trim() ||
      task.title.length > 16000 ||
      !calendarDate(task.due)
    )
      throw new Error(
        "Revisa el título y la fecha de tus tareas antes de exportar.",
      );
    ids.add(task.id);
    // Lista de campos permitidos: no se copian notas, vínculos ni otros datos.
    candidates.push({ id: task.id, title: task.title, due: task.due });
  }
  return candidates.sort(
    (a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title),
  );
}
function calendarText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
}
function calendarFold(line) {
  let result = "",
    bytes = 0;
  // Iterar por puntos de código mantiene intactas las secuencias UTF-8.
  // El espacio de continuación también cuenta dentro de los 75 octetos.
  for (const character of line) {
    const point = character.codePointAt(0),
      length = point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes + length > 75) {
      result += "\r\n ";
      bytes = 1;
    }
    result += character;
    bytes += length;
  }
  return result;
}
function calendarICS(input, selectedIds, now = new Date()) {
  const projectId = input?.project?.id;
  if (typeof projectId !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(projectId))
    throw new Error("No se pudo identificar tu bitácora.");
  if (!Array.isArray(selectedIds) || selectedIds.length > 3000)
    throw new Error("Selecciona las tareas que quieres llevar al calendario.");
  const selected = new Set(selectedIds),
    tasks = calendarCandidates(input).filter((task) => selected.has(task.id));
  if (!tasks.length)
    throw new Error("Selecciona al menos una tarea pendiente con fecha.");
  const stampDate = new Date(now);
  if (
    !Number.isFinite(stampDate.getTime()) ||
    stampDate.getUTCFullYear() < 1 ||
    stampDate.getUTCFullYear() > 9999
  )
    throw new Error("No se pudo leer la fecha de exportación.");
  const stamp = stampDate
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z"),
    lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Compas//ToDo//ES",
      "CALSCALE:GREGORIAN",
    ];
  for (const task of tasks) {
    // Reutiliza SHA-256 local: identificador estable sin exponer los ids personales.
    const id = todoImportFingerprint("compas", projectId + "\n" + task.id),
      start = task.due.replace(/-/g, ""),
      end = new Date(task.due + "T00:00:00Z");
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + id + "@compas.invalid",
      "DTSTAMP:" + stamp,
      "DTSTART;VALUE=DATE:" + start,
    );
    // El último día del año 9999 no tiene un DTEND de cuatro dígitos.
    // DURATION:P1D expresa ese mismo día completo sin una fecha fuera del estándar.
    if (end.getUTCFullYear() <= 9999)
      lines.push(
        "DTEND;VALUE=DATE:" + end.toISOString().slice(0, 10).replace(/-/g, ""),
      );
    else lines.push("DURATION:P1D");
    lines.push(
      "SUMMARY:" + calendarText(task.title),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(calendarFold).join("\r\n") + "\r\n";
}
