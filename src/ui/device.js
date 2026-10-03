// Este control se ejecuta antes de abrir almacenamiento, fotos o permisos de edición.
// Identifica teléfonos y tabletas; el ancho de la ventana no limita una computadora.
function isHandheld(device) {
  return (
    device?.userAgentData?.mobile === true ||
    /Android|iPhone|iPod|iPad/i.test(device?.userAgent || "") ||
    (device?.platform === "MacIntel" && device?.maxTouchPoints > 1)
  );
}
function showDesktopNotice() {
  document.title = "Compás · abre en una computadora";
  document.body.innerHTML =
    '<main class="device-notice" aria-labelledby="device-title"><h1 id="device-title">Compás se usa en una computadora</h1><p>Para trabajar con calma y conservar una sola bitácora, continúa en tu computadora. Cada navegador guarda su propia copia: una carpeta de nube puede conservar tus respaldos, pero no sincroniza el trabajo entre dispositivos.</p><ol><li>Descarga <strong>Compas-para-tesistas.zip</strong> en tu computadora y extrae la carpeta.</li><li>Abre <strong>Compas.html</strong> con el navegador que usarás habitualmente.</li><li>Si ya empezaste una bitácora, pulsa <strong>Abrir respaldo</strong> y elige tu archivo <strong>.json</strong> más reciente.</li></ol><p class="hint">Puedes guardar el respaldo en una carpeta de Google Drive, iCloud Drive, OneDrive o Dropbox de tu computadora. Para subirlo a la nube, ese servicio necesita internet. Después vuelve a abrir Compas.html en esa misma computadora y navegador.</p><p class="device-identity">CSP | Universidad Iberoamericana Ciudad de México</p></main>';
}
