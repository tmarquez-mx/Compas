// Consulta siempre la hora del equipo; no acumula segundos ni necesita red.
let homepadClockTimer;
function clockHands(now) {
  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  return {
    hour: ((now.getHours() % 12) + minutes / 60) * 30,
    minute: minutes * 6,
    second: seconds * 6,
  };
}
function clockFace() {
  const marks = Array.from(
    { length: 60 },
    (_, i) =>
      '<path class="' +
      (i % 5 === 0 ? "clock-mark-hour" : "clock-mark-minute") +
      '" d="M50 4v' +
      (i % 5 === 0 ? 3.5 : 2.5) +
      '" transform="rotate(' +
      i * 6 +
      ' 50 50)"/>',
  ).join("");
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1,
      angle = (n * Math.PI) / 6;
    return (
      '<text x="' +
      (50 + 35 * Math.sin(angle)).toFixed(3) +
      '" y="' +
      (50 - 35 * Math.cos(angle)).toFixed(3) +
      '">' +
      n +
      "</text>"
    );
  }).join("");
  return (
    '<svg class="homepad-clock" viewBox="0 0 100 100" role="img" aria-label="Hora de tu computadora" focusable="false">' +
    '<circle class="clock-dial" cx="50" cy="50" r="49"/>' +
    '<g class="clock-marks">' +
    marks +
    "</g>" +
    '<g class="clock-numbers">' +
    numbers +
    "</g>" +
    '<g class="clock-hour" data-clock-hand="hour"><path class="clock-stem" d="M50 50V41"/><path d="M50 41V24"/></g>' +
    '<g class="clock-minute" data-clock-hand="minute"><path class="clock-stem" d="M50 50V43"/><path d="M50 43V8"/></g>' +
    '<path class="clock-second" data-clock-hand="second" d="M50 56V5"/>' +
    '<circle class="clock-hub" cx="50" cy="50" r="2.5"/><circle class="clock-pin" cx="50" cy="50" r="1.4"/></svg>'
  );
}
function stopHomepadClock() {
  clearTimeout(homepadClockTimer);
  homepadClockTimer = undefined;
}
function syncHomepadClock() {
  stopHomepadClock();
  if (document.hidden || appearance.frame !== "homepad" || !appearance.clock)
    return;
  const faces = [...document.querySelectorAll(".homepad-clock")].filter(
    (face) => {
      const dialog = face.closest("dialog");
      return dialog ? dialog.open : !$("personal-frame").hidden;
    },
  );
  if (!faces.length) return;
  const now = new Date(),
    hands = clockHands(now);
  const label =
    "Hora de tu computadora: " +
    now.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  for (const face of faces) {
    if (face.getAttribute("aria-label") !== label)
      face.setAttribute("aria-label", label);
    for (const [hand, angle] of Object.entries(hands))
      face
        .querySelector('[data-clock-hand="' + hand + '"]')
        .setAttribute("transform", "rotate(" + angle + " 50 50)");
  }
  homepadClockTimer = setTimeout(
    syncHomepadClock,
    1000 - now.getMilliseconds(),
  );
}
document.addEventListener("visibilitychange", syncHomepadClock);
window.addEventListener("pageshow", syncHomepadClock);
window.addEventListener("pagehide", stopHomepadClock);
