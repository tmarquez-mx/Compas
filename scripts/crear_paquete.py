from pathlib import Path
import argparse,html,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Genera el paquete descargable de Compás.')
parser.add_argument('--video',type=Path,required=True,help='Video demo MP4 con datos ficticios.')
args=parser.parse_args()
if not args.video.is_file():raise SystemExit('No se encontró el video demo.')
out=ROOT/'paquetes';out.mkdir(exist_ok=True)
guide=(ROOT/'docs/EMPEZAR.md').read_text(encoding='utf-8')
parts=[]
for paragraph in guide.split('\n\n'):
 if paragraph.startswith('## '):
  lines=paragraph.splitlines();parts.append('<h2>'+html.escape(lines[0][3:])+'</h2>'+('<p>'+html.escape(' '.join(lines[1:]))+'</p>' if len(lines)>1 else ''))
 elif paragraph.startswith('# '):
  lines=paragraph.splitlines();parts.append('<h1>'+html.escape(lines[0][2:])+'</h1><p>'+html.escape(' '.join(lines[1:]))+'</p>')
 else:parts.append('<p>'+html.escape(paragraph).replace('\n','<br>')+'</p>')
doc='<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Empezar con Compás</title><style>body{font-family:Arial,sans-serif;line-height:1.65;max-width:820px;margin:auto;padding:32px;color:#191919}h1{color:#e00034}h2{margin-top:30px}a{color:#e00034}.button{display:inline-block;padding:12px 18px;border:1px solid #e00034;text-decoration:none;margin:8px 12px 8px 0}@media print{.links{display:none}body{padding:0}}</style><body><div class="links"><a class="button" href="Compas.html">Abrir Compás</a><a class="button" href="Compas-demo.mp4">Ver video demo</a></div>'+''.join(parts)+'</body></html>'
application=(ROOT/'dist/index.html').read_bytes()
target=out/'Compas-para-tesistas.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 z.writestr('Compas/Compas.html',application)
 z.writestr('Compas/Empezar-aqui.html',doc)
 z.writestr('Compas/Empezar-aqui.txt',guide)
 z.write(args.video,'Compas/Compas-demo.mp4',compress_type=zipfile.ZIP_STORED)
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 assert z.read('Compas/Compas.html')==application
 assert set(z.namelist())=={'Compas/Compas.html','Compas/Empezar-aqui.html','Compas/Empezar-aqui.txt','Compas/Compas-demo.mp4'}
digest=hashlib.sha256(target.read_bytes()).hexdigest()
(out/'SHA256SUMS.txt').write_text(digest+'  '+target.name+'\n',encoding='utf-8')
print(str(target))
print('ZIP verificado: aplicación, instrucciones y video; '+str(round(target.stat().st_size/1024/1024,1))+' MB.')
