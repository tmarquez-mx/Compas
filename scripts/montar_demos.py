"""Monta las capturas reales, anotaciones, GIF y MP4. Requiere Pillow y FFmpeg.
Uso: python3 scripts/montar_demos.py --work /tmp/compas-demos-0.3.6 --ffmpeg /ruta/ffmpeg
La narración opcional usa la voz local Paulina de macOS; no envía texto a servicios.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, hashlib, json, subprocess, textwrap, re, wave

ROOT=Path(__file__).resolve().parents[1]
RED='#e00034'; INK='#223a34'; MUTED='#4e655e'; BG='#f1f6f3'
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD='/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(n,bold=False): return ImageFont.truetype(BOLD if bold else FONT,n)
def wrap(draw,text,pos,width,size=22,color=INK,bold=False,line=1.35):
    f=font(size,bold);x,y=pos;words=text.split();row=''
    for word in words:
        candidate=(row+' '+word).strip()
        if draw.textlength(candidate,font=f)>width and row:
            draw.text((x,y),row,font=f,fill=color);y+=int(size*line);row=word
        else: row=candidate
    if row: draw.text((x,y),row,font=f,fill=color);y+=int(size*line)
    return y

def badge(d,x,y,n,r=19):
    d.ellipse((x-r,y-r,x+r,y+r),fill=RED,outline='white',width=3)
    d.text((x,y),str(n),font=font(19,True),fill='white',anchor='mm')

def overview(work,dest):
    im=Image.new('RGB',(1920,1320),BG);d=ImageDraw.Draw(im)
    d.text((36,32),'COMPÁS',font=font(48,True),fill=RED)
    d.text((310,43),'Organiza y da seguimiento a tu tesis',font=font(36,True),fill=INK)
    d.text((38,106),'Mapa comentado · Interfaz 0.3.6 · Todos los registros de esta imagen son ficticios',font=font(23),fill=MUTED)
    screen=Image.open(work/'brujula.png').convert('RGB');scale=1240/1440
    screen=screen.resize((1240,775),Image.Resampling.LANCZOS);im.paste(screen,(330,176))
    d.rounded_rectangle((328,174,1572,953),radius=12,outline='#a8bab1',width=2)
    targets=json.loads((work/'targets.json').read_text())
    modules=[('brujula','Brújula','Tu pregunta, pasos para hoy, próximo hito, decisiones y acuerdos.'),('ruta','Mi ruta','Productos por semestre, versiones, revisión, ajustes e historial.'),('todo','ToDo','Tareas privadas, fechas, prioridades, vínculos e importación CSV / ICS.'),('coloquios','Coloquios','Presentaciones, comentarios recibidos y seguimiento de compromisos.'),('supervision','Supervisión','Agenda, avances, acuerdos y preparación de la próxima reunión.'),('dedicacion','Dedicación','Actividades, horas y reflexiones privadas sobre tu proceso.'),('reportes','Reportes','Selecciona avances, revisa y comparte HTML, Excel o PDF.')]
    for i,(key,title,body) in enumerate(modules,1):
        y=176+(i-1)*116
        badge(d,55,y+21,i);d.text((84,y+5),title,font=font(24,True),fill=INK)
        wrap(d,body,(34,y+43),275,20)
        b=targets[key];badge(d,330+(b['x']+b['width']-15)*scale,176+(b['y']+b['height']/2)*scale,i,16)
    utilities=[('open','Abrir respaldo','Retoma una bitácora desde su archivo personal JSON.'),('backup','Descargar respaldo','Conserva todos tus registros. Localiza el archivo y confirma que lo guardaste.'),('recovery','Recuperación','Descarga o restaura copias anteriores disponibles en este navegador.'),('appearance','Personalizar','Elige Aire, Cielo, Noche o IBERO; añade una foto local.'),('help','Ayuda','Consulta instrucciones, privacidad y contacto para fallas y comentarios.')]
    for j,(key,title,body) in enumerate(utilities,8):
        y=184+(j-8)*154
        badge(d,1632,y+20,j);wrap(d,title,(1660,y+3),238,23,bold=True)
        wrap(d,body,(1608,y+55),270,21)
        b=targets[key];badge(d,330+(b['x']+b['width']/2)*scale,176+(b['y']+b['height']/2)*scale,j,16)
    d.rounded_rectangle((330,977,1570,1216),radius=18,fill='white',outline='#c7d5ce')
    d.text((355,997),'Dentro de Brújula: orientarte, actuar y revisar el rumbo',font=font(27,True),fill=INK)
    cells=[('Tu rumbo','Pregunta de investigación, nivel, semestre y próximo hito.'),('Para hoy','Hasta tres tareas pendientes; un paso concreto para volver a tu tesis.'),('Conversaciones y decisiones','Próxima reunión, cambio reciente y archivo de acuerdos y decisiones.')]
    for k,(title,body) in enumerate(cells):
        x=355+k*398;yy=wrap(d,title,(x,1050),355,23,RED,True)
        wrap(d,body,(x,yy+10),355,22)
    d.text((36,1260),'En tu equipo · Sin cuentas · Sin envío de registros a servidores',font=font(23,True),fill=INK)
    d.text((1110,1260),'Respaldo completo ≠ reporte seleccionado',font=font(23,True),fill=RED)
    im.save(dest/'compas-comentado.png',optimize=True)
    return im

def compose(work,f):
    im=Image.new('RGB',(1440,1080),BG);im.paste(Image.open(work/f['file']).convert('RGB'),(0,100));d=ImageDraw.Draw(im)
    d.text((32,23),f['title'],font=font(32,True),fill=INK)
    d.text((1410,31),'COMPÁS 0.3.6 · Ejemplo ficticio',anchor='ra',font=font(19),fill=MUTED)
    d.rectangle((0,83,1440,89),fill=RED)
    wrap(d,f['caption'],(32,1019),1376,24,bold=True,line=1.18)
    b=f.get('highlight')
    if b:
        box=(b['x']-4,b['y']+96,b['x']+b['width']+4,b['y']+b['height']+104)
        d.rounded_rectangle(box,radius=8,outline=RED,width=4)
    x=f['pointer']['x'];y=f['pointer']['y']+100
    pts=[(x,y),(x+4,y+29),(x+11,y+22),(x+18,y+35),(x+24,y+31),(x+17,y+18),(x+28,y+17)]
    d.polygon(pts,fill='white',outline=INK);d.line(pts+[pts[0]],fill=INK,width=2)
    return im

NARRATION={
 'intro':'Compás. Organiza y da seguimiento a tu tesis. Esta pantalla comentada reúne sus siete módulos y los controles para conservar tu trabajo. Brújula muestra tu rumbo, pasos para hoy y próximo hito. Mi ruta conserva productos y versiones. To Do organiza tareas privadas. Coloquios y Supervisión conectan conversaciones con compromisos. Dedicación registra tiempo y reflexiones personales. Reportes comparte los avances que eliges. Puedes personalizar tu espacio, abrir y descargar respaldos, recuperar copias y consultar ayuda. Todo lo que verás es un ejemplo ficticio.',
 'mi-ruta':'Primero, revisa tu ruta. Consulta los productos por semestre y retoma el diseño metodológico. Registra una nueva versión y describe el avance realizado. Si necesitas mover una fecha, explica el motivo académico o de viabilidad. Guarda los cambios. El historial conserva la versión anterior y permite reconocer cómo cambió tu plan. La ruta es una referencia en borrador: no calcula un porcentaje de avance ni verifica aprobaciones.',
 'todo':'Ahora convierte ese producto en un paso pequeño: revisar dos párrafos sobre la selección de casos. Asigna una fecha y, si lo necesitas, una prioridad. El vínculo con el producto permanece visible. Guarda la tarea y abre To Do. Al terminar el paso, márcalo y consulta las tareas terminadas. Completar una tarea no cierra el compromiso ni aprueba el producto. También puedes importar tareas desde archivos CSV o ICS. Las tareas son privadas y quedan fuera de los reportes.',
 'reportes':'Por último, prepara la conversación con tu dirección. Pon un título al reporte y elige los registros pertinentes: en este ejemplo, un compromiso y el corte actual del diseño metodológico. Decide si necesitas compartir los campos de nombres. Prepara la vista previa y revisa la copia que recibirá la otra persona. Después descarga el panel de consulta. También puedes descargar Excel o imprimir y guardar PDF. El reporte contiene una selección con fecha de corte. Las tareas, horas, reflexiones y notas privadas quedan fuera.',
 'cierre':'Tu trayectoria permanece contigo. Descarga un respaldo personal para conservar todos los módulos. Localiza el archivo y confirma que lo guardaste. El respaldo permite continuar trabajando; el reporte comparte una selección. Registra decisiones y revisiones de avance. Conserva entrevistas, transcripciones y bases de datos fuera de Compás. Compás: organiza y da seguimiento a tu tesis, para llegar a buen puerto.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('--work',type=Path,default=Path('/tmp/compas-demos-0.3.6'));p.add_argument('--ffmpeg',required=True);p.add_argument('--silent',action='store_true');args=p.parse_args()
    work=args.work;dest=ROOT/'docs/demos';dest.mkdir(exist_ok=True);media=ROOT/'video-demo';media.mkdir(exist_ok=True)
    info=json.loads((work/'frames.json').read_text());annotated=overview(work,dest)
    rendered=work/'montaje';rendered.mkdir(exist_ok=True)
    frames=info['frames'];groups={};timeline=[]
    # El mapa conserva todos sus rótulos; el video invita a consultarlo a tamaño completo.
    intro=Image.new('RGB',(1440,1080),BG);intro.paste(annotated.resize((1440,990),Image.Resampling.LANCZOS),(0,0));d=ImageDraw.Draw(intro);d.text((40,1024),'Conoce el mapa; después sigue tres recorridos reales.',font=font(27,True),fill=INK);intro.save(rendered/'intro.png')
    timeline.append({'file':'intro.png','seconds':30,'chapter':'intro'})
    for i,f in enumerate(frames):
        im=compose(work,f);name=f'{i:03}.png';im.save(rendered/name)
        groups.setdefault(f['chapter'],[]).append((im,f['seconds']))
        timeline.append({'file':name,'seconds':f['seconds'],'chapter':f['chapter']})
    for name,items in groups.items():
        if name=='cierre':continue
        samples=Image.new('RGB',(1200,900),BG)
        for j,(sample,_) in enumerate(items[::max(1,len(items)//20)]):
            if j>=20: break
            samples.paste(sample.resize((240,180),Image.Resampling.LANCZOS),((j%5)*240,(j//5)*180))
        palette=samples.quantize(colors=148,method=Image.Quantize.MEDIANCUT)
        # Conserva colores oscuros exactos: reducir muestras no debe aclarar la tipografía.
        fixed=[(34,58,52),(35,47,42),(25,25,25),(0,0,0),(78,101,94),(68,86,78),(224,0,52),(255,255,255),(241,246,243),(248,251,249),(199,213,206),(168,186,177)]
        palette.putpalette(palette.getpalette()[:148*3]+[v for color in fixed for v in color]+[0]*(96*3))
        imgs=[im.resize((1200,900),Image.Resampling.LANCZOS).quantize(palette=palette,dither=Image.Dither.NONE) for im,_ in items]
        durations=[max(80,round(sec*1000/10)*10) for _,sec in items]
        imgs[0].save(dest/(name+'.gif'),save_all=True,append_images=imgs[1:],duration=durations,loop=0,optimize=False,disposal=1)
        print(f'GIF {name}: {sum(durations)/1000:.1f} s',flush=True)
    # Cierre ilustrado: ruta y velero, con movimiento suave, sin inventar pantallas de producto.
    for i in range(12):
        im=Image.new('RGB',(1440,1080),BG);d=ImageDraw.Draw(im)
        d.text((100,220),'COMPÁS',font=font(92,True),fill=RED)
        d.text((100,355),'Organiza y da seguimiento a tu tesis',font=font(45,True),fill=INK)
        wrap(d,'Decisiones, acuerdos y próximos pasos, en un solo lugar.',(100,438),1000,31)
        d.text((100,530),'Tu respaldo completo. Tu reporte seleccionado.',font=font(30,True),fill=MUTED)
        d.line((100,770,1200,770),fill='#8caaa0',width=5)
        for x in [100,350,600,850]:d.ellipse((x-10,760,x+10,780),fill=RED)
        offset=[0,-3,-5,-4,-2,0,2,4,5,4,2,0][i];x=1190;y=760+offset
        d.polygon([(x-55,y),(x+55,y),(x+30,y+24),(x-28,y+24)],fill=RED)
        d.line((x,y,x,y-100),fill=RED,width=4);d.polygon([(x-5,y-94),(x-5,y-10),(x-62,y-10)],fill=RED);d.polygon([(x+4,y-84),(x+4,y-10),(x+50,y-10)],fill='#eaa1b2')
        d.text((100,858),'... y llegar a buen puerto',font=font(43,True),fill=INK)
        d.text((100,990),'CSP | Universidad Iberoamericana Ciudad de México',font=font(23),fill=MUTED)
        fn=f'cierre-{i:02}.png';im.save(rendered/fn);timeline.append({'file':fn,'seconds':0.5,'chapter':'cierre'})
    durations={ch:sum(f['seconds'] for f in timeline if f['chapter']==ch) for ch in NARRATION}
    speech_cues={}
    if not args.silent:
        for ch,text in NARRATION.items():
            speech_cues[ch]=[];parts=[];pos=0.0
            for j,sentence in enumerate(re.split(r'(?<=[.!?])\s+',text)):
                speech=work/f'{ch}-{j}.txt';speech.write_text(sentence)
                aiff=work/f'{ch}-{j}.aiff';wav=work/f'{ch}-{j}.wav'
                subprocess.run(['say','-v','Paulina','-r','172','-f',str(speech),'-o',str(aiff)],check=True)
                subprocess.run([args.ffmpeg,'-y','-loglevel','error','-i',str(aiff),'-ar','48000','-ac','1',str(wav)],check=True)
                with wave.open(str(wav)) as w: length=w.getnframes()/w.getframerate()
                if length <= 0: raise RuntimeError('La voz local produjo un archivo vacío; comprueba los permisos de síntesis de voz.')
                speech_cues[ch].append((pos,pos+length,sentence));pos+=length;parts.append(wav)
            if pos+1>durations[ch]:
                delta=pos+1-durations[ch]
                last=next(f for f in reversed(timeline) if f['chapter']==ch)
                last['seconds']+=delta;durations[ch]+=delta
            partlist=work/(ch+'-audio.ffconcat');partlist.write_text('ffconcat version 1.0\n'+''.join("file '"+str(w)+"'\n" for w in parts))
            subprocess.run([args.ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(partlist),'-af','apad','-t',str(durations[ch]),str(work/(ch+'.wav'))],check=True)
        audioList=work/'audio.ffconcat';audioList.write_text('ffconcat version 1.0\n'+''.join("file '"+str(work/(ch+'.wav'))+"'\n" for ch in NARRATION))
        subprocess.run([args.ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(audioList),str(work/'narracion.wav')],check=True)
    listing=work/'montaje.ffconcat';listing.write_text('ffconcat version 1.0\n'+''.join("file '"+str(rendered/f['file'])+"'\noption framerate 100\nduration "+str(f['seconds'])+'\n' for f in timeline)+"file '"+str(rendered/timeline[-1]['file'])+"'\noption framerate 100\n")
    cmd=[args.ffmpeg,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(listing)]
    if not args.silent:cmd+=['-i',str(work/'narracion.wav')]
    cmd+=['-vf','fps=20','-c:v','libx264','-preset','medium','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart']
    if not args.silent:cmd+=['-c:a','aac','-b:a','128k','-shortest']
    cmd+=['-t',str(sum(durations.values())),str(media/'Compas-demo.mp4')];subprocess.run(cmd,check=True)
    # SRT distribuye cada capítulo narrado en frases; el texto visual permite seguirlo sin sonido.
    srt=[];start=0;number=1
    def stamp(t):
        ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    for ch,text in NARRATION.items():
        for cue_start,cue_end,sentence in speech_cues.get(ch,[]):
            srt.append(f'{number}\n{stamp(start+cue_start)} --> {stamp(start+cue_end)}\n'+'\n'.join(textwrap.wrap(sentence,70))+'\n');number+=1
        start+=durations[ch]
    (media/'Compas-demo.srt').write_text('\n'.join(srt))
    (dest/'guion-recorridos.md').write_text('# Compás 0.3.6 · Guion de los recorridos\n\nCapturas reales de `dist/index.html`, en un contexto de navegador aislado y con el ejemplo ficticio.\n\n'+''.join('## '+ch+'\n\n'+text+'\n\n' for ch,text in NARRATION.items())+'## Comprobaciones de la captura\n\n'+''.join('- '+c+'\n' for c in info['checks']))
    manifest={'version':info['version'],'applicationSha256':info['applicationSha256'],'viewport':info['viewport'],'checks':info['checks'],'chaptersSeconds':durations,'audio':'Paulina, es-MX, síntesis local macOS' if not args.silent else None,'files':{p.name:{'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size} for p in [dest/'compas-comentado.png',*[dest/(ch+'.gif') for ch in ['mi-ruta','todo','reportes']],media/'Compas-demo.mp4']}}
    (dest/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'chaptersSeconds':durations,'totalSeconds':sum(durations.values()),'video':str(media/'Compas-demo.mp4')},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
