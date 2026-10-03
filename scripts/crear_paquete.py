"""Crea un ZIP validado de Compás, sin dependencias de terceros."""
from pathlib import Path
import argparse
import hashlib
import html
from html.parser import HTMLParser
import json
import os
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SIMPLE_NAME = 'Compas-para-tesistas.zip'
COMPLETE_NAME = 'Compas-con-recorridos.zip'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def package_guide(guide, has_video=False, has_demos=False):
    """Omite las instrucciones de medios que no viajan en esta variante."""
    paragraphs = []
    omitted_section = False
    for paragraph in guide.split('\n\n'):
        if paragraph.startswith('## '):
            title = paragraph.splitlines()[0][3:]
            omitted_section = ((title == 'Mapa y recorridos de Compás' and not has_demos)
                               or (title == 'Video demo' and not has_video))
        if omitted_section:
            if paragraph.startswith('CSP |'):
                paragraphs.append(paragraph)
            continue
        if ('Conocer-Compas.html' in paragraph and not has_demos
                or 'Compas-demo.mp4' in paragraph and not has_video):
            continue
        paragraphs.append(paragraph)
    return '\n\n'.join(paragraphs)


def guide_html(guide, has_video=False, has_demos=False):
    guide = package_guide(guide, has_video, has_demos)
    parts = []
    for paragraph in guide.split('\n\n'):
        if paragraph.startswith('## '):
            lines = paragraph.splitlines()
            parts.append('<h2>' + html.escape(lines[0][3:]) + '</h2>' + ('<p>' + html.escape(' '.join(lines[1:])) + '</p>' if len(lines) > 1 else ''))
        elif paragraph.startswith('# '):
            lines = paragraph.splitlines()
            parts.append('<h1>' + html.escape(lines[0][2:]) + '</h1><p>' + html.escape(' '.join(lines[1:])) + '</p>')
        else:
            parts.append('<p>' + html.escape(paragraph).replace('\n', '<br>') + '</p>')
    video_link = '<a class="button" href="Compas-demo.mp4">Ver video demo</a>' if has_video else ''
    demos_link = '<a class="button" href="Conocer-Compas.html">Conoce el mapa y los recorridos</a>' if has_demos else ''
    materials_link = '<a class="button" href="Materiales-en-linea.txt">Materiales en línea</a>'
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><title>Empezar con Compás</title><style>body{font-family:Arial,sans-serif;line-height:1.65;max-width:820px;margin:auto;padding:32px;color:#191919}h1{color:#e00034}h2{margin-top:30px}a{color:#e00034}.button{display:inline-block;padding:12px 18px;border:1px solid #e00034;text-decoration:none;margin:8px 12px 8px 0}@media print{.links{display:none}body{padding:0}}</style></head><body><div class="links"><a class="button" href="Compas.html">Abrir Compás</a>' + materials_link + video_link + demos_link + '</div>' + ''.join(parts) + '</body></html>').encode('utf-8')


class GuideLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.links.extend(value for name, value in attrs if name == 'href' and value)


def verify_archive(archive, files):
    if archive.testzip() is not None:
        raise ValueError('El ZIP no supera su comprobación de integridad.')
    expected = {'Compas/' + name for name in files}
    if set(archive.namelist()) != expected or len(archive.namelist()) != len(expected):
        raise ValueError('El ZIP contiene archivos inesperados o repetidos.')
    for name, data in files.items():
        if archive.read('Compas/' + name) != data:
            raise ValueError('Contenido distinto en ' + name)
    links = GuideLinks()
    links.feed(archive.read('Compas/Empezar-aqui.html').decode('utf-8'))
    for href in links.links:
        if ':' not in href and not href.startswith('#') and href not in files:
            raise ValueError('La guía enlaza un archivo ausente: ' + href)


def write_zip_sums(target):
    # Sólo se calculan los ZIP públicos conocidos y el archivo recién verificado.
    names = {SIMPLE_NAME, COMPLETE_NAME, target.name}
    entries = []
    for name in sorted(names):
        path = target.parent / name
        if path.is_file():
            entries.append(digest(path.read_bytes()) + '  ' + name + '\n')
    (target.parent / 'SHA256SUMS.txt').write_text(''.join(entries), encoding='utf-8')


def main():
    parser = argparse.ArgumentParser(description='Prueba la entrega y genera el paquete descargable de Compás.')
    parser.add_argument('--complete', action='store_true', help='Incluye mapa, recorridos animados y video opcional en Compas-con-recorridos.zip.')
    video_args = parser.add_mutually_exclusive_group()
    video_args.add_argument('--video', type=Path, help='Video demo MP4; implica --complete. En el paquete completo se usa video-demo/Compas-demo.mp4 cuando existe.')
    video_args.add_argument('--no-video', action='store_true', help='Omite el video en el paquete completo; también es compatible con el paquete simple y CI.')
    parser.add_argument('--output', type=Path, help='Archivo ZIP de salida; por defecto Compas-para-tesistas.zip o Compas-con-recorridos.zip según la variante.')
    args = parser.parse_args()
    complete = args.complete or bool(args.video)
    output = args.output or ROOT / 'paquetes' / (COMPLETE_NAME if complete else SIMPLE_NAME)
    if output.suffix.lower() != '.zip':
        parser.error('--output debe indicar un archivo .zip.')
    video = (args.video or ROOT / 'video-demo/Compas-demo.mp4') if complete and not args.no_video else None
    if args.video and not args.video.is_file():
        parser.error('No se encontró el video indicado.')
    if video and not video.is_file():
        video = None
    if video and video.suffix.lower() != '.mp4':
        parser.error('El video debe ser un archivo .mp4.')
    node = shutil.which('node')
    if not node:
        raise SystemExit('Se necesita Node.js 20 o posterior para probar la entrega antes de empaquetar.')
    # Se verifica dist sin regenerarlo: el ZIP nunca puede incluir una edición no probada.
    subprocess.run([node, str(ROOT / 'scripts/test.cjs'), '--built'], cwd=ROOT, check=True)
    version = (ROOT / 'VERSION').read_text(encoding='utf-8').strip()
    application = (ROOT / 'dist/index.html').read_bytes()
    build_manifest = json.loads((ROOT / 'dist/manifest.json').read_text(encoding='utf-8'))
    if build_manifest['version'] != version or build_manifest['application']['sha256'] != digest(application):
        raise SystemExit('El manifiesto de dist no corresponde a esta entrega.')
    guide_bytes = (ROOT / 'docs/EMPEZAR.md').read_bytes()
    guide = guide_bytes.decode('utf-8')
    if 'Versión ' + version not in guide:
        raise SystemExit('La guía EMPEZAR.md no identifica la versión de VERSION.')
    materials_path = ROOT / 'docs/MATERIALES-EN-LINEA.txt'
    if not materials_path.is_file():
        raise SystemExit('Falta docs/MATERIALES-EN-LINEA.txt con los enlaces públicos comprobados.')
    materials = materials_path.read_bytes()
    if 'https://' not in materials.decode('utf-8'):
        raise SystemExit('Materiales-en-linea.txt no contiene enlaces públicos HTTPS.')
    files = {
        'Compas.html': application,
        'Empezar-aqui.html': guide_html(guide, bool(video), complete and (ROOT / 'docs/demos/index.html').is_file()),
        'Materiales-en-linea.txt': materials,
    }
    if complete:
        files['Empezar-aqui.txt'] = package_guide(guide, bool(video), (ROOT / 'docs/demos/index.html').is_file()).encode('utf-8')
    demo_dir = ROOT / 'docs/demos'
    demo_manifest = None
    if complete and (demo_dir / 'index.html').is_file():
        # Lista pública explícita: no se agregan capturas temporales ni respaldos.
        for name in ['compas-comentado.png', 'mi-ruta.gif', 'todo.gif', 'reportes.gif']:
            files[name] = (demo_dir / name).read_bytes()
        files['Conocer-Compas.html'] = (demo_dir / 'index.html').read_bytes()
        demo_manifest = json.loads((demo_dir / 'manifest.json').read_text(encoding='utf-8'))
    if video:
        files['Compas-demo.mp4'] = video.read_bytes()
        subtitles = video.with_suffix('.srt')
        if subtitles.is_file():
            files['Compas-demo.srt'] = subtitles.read_bytes()
    if complete:
        manifest = {
            'name': 'Compás',
            'version': version,
            'includesVideo': bool(video),
            'files': {name: {'sha256': digest(data), 'bytes': len(data)} for name, data in sorted(files.items())},
            'build': build_manifest,
        }
        if demo_manifest:
            for name, metadata in demo_manifest['files'].items():
                if name == 'Compas-demo.mp4' and args.video:
                    # Un video indicado expresamente puede ser distinto al montado con estas capturas.
                    continue
                if name in files and (metadata['sha256'] != digest(files[name]) or metadata['bytes'] != len(files[name])):
                    raise SystemExit('El medio no coincide con el manifiesto de las capturas: ' + name)
            # Identifica la interfaz realmente capturada, aunque el HTML haya cambiado después.
            manifest['demos'] = demo_manifest
        files['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        files['SHA256SUMS.txt'] = ''.join(digest(data) + '  ' + name + '\n' for name, data in sorted(files.items())).encode('utf-8')
    elif set(files) != {'Compas.html', 'Empezar-aqui.html', 'Materiales-en-linea.txt'}:
        raise ValueError('El paquete simple debe contener únicamente la aplicación, su guía y el TXT de enlaces.')
    target = output.resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    temp_fd, temp_name = tempfile.mkstemp(prefix=target.stem + '-', suffix='.zip', dir=target.parent)
    os.close(temp_fd)
    temporary = Path(temp_name)
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name, data in sorted(files.items()):
                # Sin fechas variables ni atributos del equipo; el mismo contenido produce el mismo ZIP.
                info = zipfile.ZipInfo('Compas/' + name, date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_STORED if name.endswith('.mp4') else zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, data, compresslevel=9)
        with zipfile.ZipFile(temporary) as archive:
            verify_archive(archive, files)
        os.replace(temporary, target)
    finally:
        if temporary.exists():
            temporary.unlink()
    write_zip_sums(target)
    print(str(target))
    print(f'ZIP {version} verificado: {len(files)} archivos públicos, ' + ('con video' if video else 'sin video') + f'; {target.stat().st_size / 1024 / 1024:.1f} MB.')
    print('Aplicación idéntica a dist; guía y enlaces comprobados. ' + ('Manifiesto y SHA256SUMS incluidos.' if complete else 'Huella del ZIP guardada junto al paquete.'))


if __name__ == '__main__':
    main()
