"""Crea un ZIP validado de Compás, sin dependencias de terceros."""
from pathlib import Path
import argparse
import hashlib
import html
import json
import os
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def guide_html(guide, has_video, has_demos=False):
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
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><title>Empezar con Compás</title><style>body{font-family:Arial,sans-serif;line-height:1.65;max-width:820px;margin:auto;padding:32px;color:#191919}h1{color:#e00034}h2{margin-top:30px}a{color:#e00034}.button{display:inline-block;padding:12px 18px;border:1px solid #e00034;text-decoration:none;margin:8px 12px 8px 0}@media print{.links{display:none}body{padding:0}}</style></head><body><div class="links"><a class="button" href="Compas.html">Abrir Compás</a>' + video_link + demos_link + '</div>' + ''.join(parts) + '</body></html>').encode('utf-8')


def main():
    parser = argparse.ArgumentParser(description='Prueba la entrega y genera el paquete descargable de Compás.')
    video_args = parser.add_mutually_exclusive_group()
    video_args.add_argument('--video', type=Path, help='Video demo MP4; por defecto se incluye video-demo/Compas-demo.mp4 cuando existe.')
    video_args.add_argument('--no-video', action='store_true', help='Genera una variante sin video, usada para la verificación en CI.')
    parser.add_argument('--output', type=Path, default=ROOT / 'paquetes/Compas-para-tesistas.zip', help='Archivo ZIP de salida.')
    args = parser.parse_args()
    if args.output.suffix.lower() != '.zip':
        parser.error('--output debe indicar un archivo .zip.')
    video = None if args.no_video else (args.video or ROOT / 'video-demo/Compas-demo.mp4')
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
    files = {
        'Compas.html': application,
        'Empezar-aqui.html': guide_html(guide, bool(video), (ROOT / 'docs/demos/index.html').is_file()),
        'Empezar-aqui.txt': guide_bytes,
    }
    demo_dir = ROOT / 'docs/demos'
    if (demo_dir / 'index.html').is_file():
        # Lista pública explícita: no se agregan capturas temporales ni respaldos.
        for name in ['compas-comentado.png', 'mi-ruta.gif', 'todo.gif', 'reportes.gif']:
            files[name] = (demo_dir / name).read_bytes()
        files['Conocer-Compas.html'] = (demo_dir / 'index.html').read_bytes()
    if video:
        files['Compas-demo.mp4'] = video.read_bytes()
        subtitles = video.with_suffix('.srt')
        if subtitles.is_file():
            files['Compas-demo.srt'] = subtitles.read_bytes()
    manifest = {
        'name': 'Compás',
        'version': version,
        'includesVideo': bool(video),
        'files': {name: {'sha256': digest(data), 'bytes': len(data)} for name, data in sorted(files.items())},
        'build': build_manifest,
    }
    files['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    files['SHA256SUMS.txt'] = ''.join(digest(data) + '  ' + name + '\n' for name, data in sorted(files.items())).encode('utf-8')
    target = args.output.resolve()
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
            if archive.testzip() is not None:
                raise ValueError('El ZIP no supera su comprobación de integridad.')
            expected = {'Compas/' + name for name in files}
            if set(archive.namelist()) != expected:
                raise ValueError('El ZIP contiene archivos inesperados.')
            for name, data in files.items():
                if archive.read('Compas/' + name) != data:
                    raise ValueError('Contenido distinto en ' + name)
            if archive.read('Compas/Compas.html') != application or archive.read('Compas/Empezar-aqui.txt') != guide_bytes:
                raise ValueError('La aplicación o guía empaquetadas difieren de sus fuentes.')
        os.replace(temporary, target)
    finally:
        if temporary.exists():
            temporary.unlink()
    sum_path = target.parent / 'SHA256SUMS.txt'
    sum_path.write_text(digest(target.read_bytes()) + '  ' + target.name + '\n', encoding='utf-8')
    print(str(target))
    print(f'ZIP {version} verificado: {len(files)} archivos públicos, ' + ('con video' if video else 'sin video') + f'; {target.stat().st_size / 1024 / 1024:.1f} MB.')
    print('Aplicación y guía idénticas a las fuentes; manifiesto y SHA256SUMS incluidos.')


if __name__ == '__main__':
    main()
