function navigate(next) {
  if (!Object.hasOwn(views, next)) return;
  view = next;
  location.hash = next;
  $("module-nav").classList.remove("nav-expanded");
  $("mobile-menu").setAttribute("aria-expanded", "false");
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function render() {
  const dedication = document.querySelector(".todo-time");
  if (dedication) timeExpanded = dedication.open;
  document.querySelectorAll("[data-view]").forEach((n) => {
    const active = n.dataset.view === view;
    n.classList.toggle("active", active);
    if (active) n.setAttribute("aria-current", "page");
    else n.removeAttribute("aria-current");
  });
  const contents = {
    brujula: renderBrujula,
    ruta: renderRoute,
    todo: renderTodo,
    coloquios: () => renderSessions("coloquio"),
    supervision: () => renderSessions("supervision"),
    dedicacion: renderJournal,
    reportes: renderReports,
  };
  $("main").innerHTML = demoBanner() + celebrationBanner() + contents[view]();
  saveInfo();
  $("mobile-menu").textContent = "Más ▾";
  $("mobile-menu").classList.toggle(
    "current-more",
    !["brujula", "ruta", "todo"].includes(view),
  );
  if (previewShare && $("report-frame"))
    $("report-frame").srcdoc = C.reportHTML(previewShare);
}
