/* Captura recorridos reales en un navegador aislado, únicamente con el ejemplo ficticio.
 * COMPAS_PLAYWRIGHT apunta al paquete playwright; COMPAS_CHROMIUM es opcional.
 * Salida temporal: COMPAS_DEMO_WORK (por defecto /tmp/compas-demos-0.3.7).
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require(process.env.COMPAS_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.COMPAS_DEMO_WORK||'/tmp/compas-demos-0.3.7';
fs.mkdirSync(out,{recursive:true});
const frames=[],checks=[];let page,browser,context,chapter='',pointer={x:1120,y:760},seq=0;
async function shot(title,caption,seconds=3.4,highlight=null){
 await page.evaluate(()=>{document.activeElement?.blur();});
 const file=`${String(seq++).padStart(3,'0')}.png`;
 await page.screenshot({path:path.join(out,file)});
 frames.push({file,chapter,title,caption,seconds,pointer:{...pointer},highlight});
}
async function move(selector,title,caption){
 const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();
 const b=await el.boundingBox();if(!b)throw new Error(`Control invisible: ${selector}`);
 const target={x:b.x+b.width/2,y:b.y+b.height/2},start={...pointer};
 for(let i=1;i<=6;i++){
  pointer={x:start.x+(target.x-start.x)*i/6,y:start.y+(target.y-start.y)*i/6};
  await shot(title,caption,0.08,b);
 }
 return el;
}
async function click(selector,title,caption,seconds=3.4){
 const el=await move(selector,title,caption);await shot(title,caption,0.5,await el.boundingBox());
 await el.click();await page.waitForTimeout(160);await shot(title,caption,seconds);
}
async function fill(selector,value,title,caption){
 const el=await move(selector,title,caption);await el.click();
 // Cuatro etapas capturadas muestran escritura real, sin cambiar datos fuera de la interfaz.
 for(let i=1;i<=4;i++){await el.fill(value.slice(0,Math.ceil(value.length*i/4)));await shot(title,caption,i===4?2.8:0.22,await el.boundingBox());}
}
async function scroll(selector,title,caption){
 const el=page.locator(selector).first();const b=await el.boundingBox();
 const amount=b.y-175;
 for(let i=0;i<6;i++){await page.evaluate(y=>window.scrollBy(0,y),amount/6);await shot(title,caption,0.10);}
 await shot(title,caption,3.8);
}
async function originalKeepsakeImage(){
 // Ilustración original de un paisaje: sólo colores y formas locales, sin fotos ni recursos externos.
 const art=await context.newPage();
 await art.setContent('<!doctype html><style>*{box-sizing:border-box}html,body{margin:0;width:700px;height:800px;overflow:hidden}</style><svg xmlns="http://www.w3.org/2000/svg" width="700" height="800" viewBox="0 0 700 800"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#e7d9c4"/><stop offset="1" stop-color="#f2ece0"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#8da7a3"/><stop offset="1" stop-color="#c3d0c0"/></linearGradient></defs><rect width="700" height="800" fill="url(#sky)"/><circle cx="472" cy="208" r="64" fill="#d7ac67" opacity=".75"/><path d="M0 404Q103 224 230 395Q377 188 523 406Q613 326 700 400V800H0Z" fill="#a5ad91"/><path d="M0 504Q119 371 289 449Q476 302 700 475V800H0Z" fill="#788d74"/><path d="M0 570Q205 498 370 529Q558 495 700 555V800H0Z" fill="url(#water)"/><g fill="none" stroke="#d6dfcf" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M295 605h158M118 661h172M395 693h140M241 749h125"/></g><path d="M0 724Q99 684 130 579Q142 499 206 425" fill="none" stroke="#686c50" stroke-width="13" stroke-linecap="round"/><g fill="#647958"><path d="M111 638Q50 619 48 571Q108 569 111 638Z"/><path d="M134 573Q161 511 206 528Q188 573 134 573Z"/><path d="M148 520Q100 487 111 455Q157 462 148 520Z"/><path d="M175 467Q184 415 223 415Q219 453 175 467Z"/></g><path d="M577 800Q579 740 631 710Q658 672 650 626" fill="none" stroke="#707356" stroke-width="10" stroke-linecap="round"/><g fill="#87956b"><path d="M608 732Q559 723 563 689Q604 688 608 732Z"/><path d="M640 698Q671 667 699 685Q678 716 640 698Z"/><path d="M652 654Q620 638 624 610Q653 610 652 654Z"/></g></svg>');
 const image=await art.locator('svg').screenshot();await art.close();return image;
}
(async()=>{
 const html=fs.readFileSync(path.join(root,'dist/index.html'));
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(html);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
 browser=await chromium.launch({headless:true,...(process.env.COMPAS_CHROMIUM?{executablePath:process.env.COMPAS_CHROMIUM}:{})});
 context=await browser.newContext({viewport:{width:1440,height:900},locale:'es-MX',timezoneId:'America/Mexico_City',acceptDownloads:true,reducedMotion:'reduce'});
 page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForTimeout(500);
 if(!(await page.locator('#save-info').innerText()).includes('Ejemplo ficticio'))throw new Error('La captura exige el ejemplo ficticio');
 const keepsakeImage=await originalKeepsakeImage();
 await page.locator('#personalize-shortcut').click();
 await page.locator('#photo-input').setInputFiles({name:'paisaje-ficticio.png',mimeType:'image/png',buffer:keepsakeImage});
 await page.waitForFunction(()=>document.querySelector('#personal-image')?.naturalWidth>0);
 await page.locator('[data-do="frame"][data-frame="madera"]').click();
 await page.locator('[data-do="decoration"][data-decoration="flores"]').click();
 await page.locator('#editor .dialog-top [data-do="close"]').click();
 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 if(!(await page.locator('#personal-keepsake').isVisible())||await page.locator('#personal-frame').getAttribute('data-frame')!=='madera')throw new Error('Rincón con foto y madera no visible');
 checks.push('Rincón: paisaje original ficticio, marco de madera y flores sobre los bordes de la foto.');
 await page.screenshot({path:path.join(out,'brujula.png')});
 const targets=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('.side-nav [data-view], .topbar [data-do], #personalize-shortcut')].map(el=>{const b=el.getBoundingClientRect();return [el.dataset.view||el.dataset.do,{x:b.x,y:b.y,width:b.width,height:b.height}];})));
 fs.writeFileSync(path.join(out,'targets.json'),JSON.stringify(targets,null,2));
 chapter='mi-ruta';
 await shot('01 · Mi ruta','Una referencia por semestres; un plan que puedes revisar.',3);
 await click('.side-nav [data-view="ruta"]','01 · Mi ruta','Consulta los productos esperados en cada semestre.');
 await click('[data-do="route-stage"][data-semester="2"]','01 · Mi ruta','Recorre la referencia: cada semestre conserva su propio registro.',2.5);
 await click('[data-do="route-stage"][data-semester="3"]','01 · Mi ruta','Retoma el diseño metodológico en tu plan actual.',2.5);
 await click('[data-do="route-progress"][data-id="m2-metodo"]','01 · Mi ruta','Registra una versión y la referencia de lo que avanzaste.');
 await fill('[name="versionLabel"]','Versión 3 · criterios de contraste','01 · Mi ruta','Da un nombre al corte de tu trabajo.');
 await fill('[name="evidence"]','Capítulo metodológico: criterios de contraste precisados tras la asesoría de tesis.','01 · Mi ruta','Describe el avance; los datos de investigación se conservan fuera de Compás.');
 await page.locator('[name="due"]').scrollIntoViewIfNeeded();
 await page.locator('[name="due"]').fill('2026-10-20');
 await fill('[name="adjustmentReason"]','Reservar una semana para revisar la viabilidad de los dos casos.','01 · Mi ruta','Si ajustas la fecha, explica el motivo del cambio.');
 await click('#edit-form [type="submit"]','01 · Mi ruta','Guarda el corte actualizado sin perder la versión anterior.');
 if(await page.locator('#editor').evaluate(el=>el.open))throw new Error(await page.locator('#form-error').innerText());
 const card=page.locator('.route-card').filter({has:page.locator('[data-id="m2-metodo"]')});
 await card.getByText('Historial ·', {exact:false}).click();
 await scroll('.route-card:has([data-id="m2-metodo"]) details[open]','01 · Mi ruta','El historial conserva la versión 2 y el plan anterior.');
 const route=await page.evaluate(()=>JSON.parse(localStorage.getItem('compas-personal-v1')).data.routeProgress.find(p=>p.id==='m2-metodo'));
 if(route.versionLabel!=='Versión 3 · criterios de contraste'||!route.history.some(h=>h.versionLabel==='Versión 2'))throw new Error('No se conservó el historial');
 checks.push('Ruta: versión 3 guardada y versión 2 conservada en historial.');
 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 chapter='todo';
 await click('.route-card:has([data-id="m2-metodo"]) [data-do="todo-edit"]','02 · ToDo','Del producto de la ruta a una tarea pequeña y concreta.');
 await fill('[name="title"]','Revisar dos párrafos sobre la selección de casos','02 · ToDo','Escribe un siguiente paso que puedas realizar.');
 await page.locator('[name="due"]').fill('2026-10-06');
 await click('#edit-form .form-extra summary','02 · ToDo','Puedes añadir prioridad, vínculos y una nota privada.',2.5);
 await page.locator('[name="priority"]').selectOption('alta');
 const privateCalendarNote='Nota ficticia solo para mí: conversar antes de enviar este borrador.';
 await page.locator('[name="privateNotes"]').fill(privateCalendarNote);
 await shot('02 · ToDo','La tarea queda vinculada al diseño metodológico de tu ruta.',3.4);
 await click('#edit-form [type="submit"]','02 · ToDo','Guarda la tarea para retomarla desde ToDo o Brújula.');
 await click('.side-nav [data-view="todo"]','02 · ToDo','Tus tareas permanecen en tu bitácora personal.');
 const todoRow=page.locator('.todo-row').filter({hasText:'Revisar dos párrafos sobre la selección de casos'});
 const todoId=await todoRow.locator('[data-todo-check]').getAttribute('data-todo-check');
 await click('[data-do="todo-calendar"]','02 · ToDo y mi calendario','Lleva las tareas pendientes con fecha a tu calendario.');
 await click('[data-do="todo-calendar-none"]','02 · ToDo y mi calendario','Tú decides qué tareas añadir; sus notas privadas quedan fuera.',2);
 await click(`[data-calendar-select="${todoId}"]`,'02 · ToDo y mi calendario','Elige este paso para el 6 de octubre.',2.5);
 const calendarDownload=page.waitForEvent('download');
 await click('[data-do="todo-calendar-download"]','02 · ToDo y mi calendario','Descarga el archivo ICS e impórtalo en Google, Apple u Outlook.',3.4);
 const calendarFile=await calendarDownload;await calendarFile.saveAs(path.join(out,'tareas-ficticias.ics'));
 const calendarText=fs.readFileSync(path.join(out,'tareas-ficticias.ics'),'utf8').replace(/\r?\n[ \t]/g,'');
 if((calendarText.match(/BEGIN:VEVENT/g)||[]).length!==1||!calendarText.includes('SUMMARY:Revisar dos párrafos sobre la selección de casos')||!calendarText.includes('DTSTART;VALUE=DATE:20261006')||calendarText.includes(privateCalendarNote)||calendarText.includes('DESCRIPTION:'))throw new Error('Exportación ICS incorrecta o con notas privadas');
 checks.push('Calendario: una tarea pendiente seleccionada, fecha 6 de octubre; ICS descargado sin notas privadas para importación manual.');
 if(await page.locator('#editor').evaluate(el=>el.open))await click('#editor .dialog-top [data-do="close"]','02 · ToDo y mi calendario','El archivo se importa manualmente; Compás no sincroniza calendarios.',2);
 await click(`[data-todo-check="${todoId}"]`,'02 · ToDo','Marca el paso terminado; su producto y compromiso siguen abiertos.');
 await page.locator('#todo-filter').selectOption('terminadas');
 await shot('02 · ToDo','Consulta Terminadas para reconocer tus pasos realizados.',4);
 const task=await page.evaluate(id=>JSON.parse(localStorage.getItem('compas-personal-v1')).data.todos.find(t=>t.id===id),todoId);
 if(!task.done||task.milestoneId!=='m2-metodo')throw new Error('Tarea no terminada o sin vínculo');
 checks.push('ToDo: tarea creada, vinculada a m2-metodo y terminada por la interfaz.');
 await click('.todo-time > summary','02 · Tu dedicación','Si te sirve, registra el tiempo que dedicaste a este paso.',2.5);
 await click('.todo-time [data-do="time"]','02 · Tu dedicación','Registrar dedicación es opcional y permanece en ToDo.',2.5);
 await page.locator('[name="category"]').fill('Escritura');
 await page.locator('[name="hours"]').fill('0');
 await page.locator('[name="minutes"]').fill('45');
 const activityNote='Revisé dos párrafos y precisé los criterios de selección.';
 await page.locator('[name="note"]').fill(activityNote);
 await shot('02 · Tu dedicación','En este ejemplo registras 45 minutos de escritura, sin una meta de horas.',3.4);
 await click('#edit-form [type="submit"]','02 · Tu dedicación','Las actividades y sus notas quedan fuera de los reportes.',3);
 const activity=await page.evaluate(()=>JSON.parse(localStorage.getItem('compas-personal-v1')).data.timeEntries.find(t=>t.category==='Escritura'&&t.minutes===45&&t.note==='Revisé dos párrafos y precisé los criterios de selección.'));
 if(!activity)throw new Error('Actividad opcional no guardada desde ToDo');
 if(!(await page.locator('.todo-time').evaluate(el=>el.open)))throw new Error('Dedicación no conservó el panel abierto');
 await scroll('.todo-time .time-total','02 · Tu dedicación','Puedes consultar tus actividades cuando lo necesites.');
 checks.push('Dedicación: 45 minutos de escritura guardados desde el apartado opcional de ToDo.');
 await click('.todo-time > summary','02 · Tu dedicación','Puedes cerrar este apartado y continuar con tu siguiente paso.',2);
 await click('.celebration-note [data-do="appearance"]','02 · Un paso y un detalle','Una foto, un marco natural y flores para hacer tuyo este rincón.');
 await click('[data-do="frame"][data-frame="none"]','02 · Un paso y un detalle','También puedes dejar tu foto sin marco y conservar sus flores.',2.5);
 await page.locator('#editor .photo-preview').scrollIntoViewIfNeeded();
 await shot('02 · Un paso y un detalle','Sin marco: tu imagen y sus detalles, con el centro libre.',3);
 await click('[data-do="frame"][data-frame="jardin"]','02 · Un paso y un detalle','Elige un marco suave, con textura de jardín y bordes irregulares.');
 await click('[data-do="decoration"][data-decoration="flores"]','02 · Un paso y un detalle','Flores y ramitas sobre los bordes de tu foto, como un pequeño rincón analógico.');
 await page.locator('#editor .photo-preview').scrollIntoViewIfNeeded();
 await shot('02 · Un paso y un detalle','Tu foto, marco y flores forman un solo rincón. Todos los detalles están disponibles desde el principio.',4);
 await click('#editor .dialog-top [data-do="close"]','02 · Un paso y un detalle','Continúa a tu ritmo. Puedes desactivar estas invitaciones.');
 await click('.side-nav [data-view="dedicacion"]','02 · Mi diario','Un espacio privado para reconocer lo vivido; no hay que escribir todos los días.');
 if(await page.locator('h1').innerText()!=='Querido diario...'||await page.locator('.todo-time').count())throw new Error('Diario debe conservar sólo sus páginas y el título Querido diario...');
 await click('[data-do="reflection"]','02 · Mi diario','Escribe una idea, una duda o algo que hoy te ayudó.');
 await fill('[name="text"]','Hoy encontré una forma más clara de explicar los criterios de selección. Una conversación breve me ayudó a destrabar el siguiente paso.','02 · Mi diario','Una página para ti; no aparecerá en los reportes para compartir.');
 await click('#edit-form [type="submit"]','02 · Mi diario','Guarda la página para retomarla otro día.');
 const diary=await page.evaluate(()=>JSON.parse(localStorage.getItem('compas-personal-v1')).data.reflections);
 if(!diary.some(entry=>entry.text.includes('Una conversación breve')))throw new Error('Diario no guardado');
 if(await page.locator('#personal-ornament svg').count()!==1)throw new Error('Flores no visibles');
 if(await page.locator('#personal-frame').getAttribute('data-frame')!=='jardin')throw new Error('Marco de jardín no elegido');
 checks.push('Diario: Querido diario... contiene sólo páginas; entrada ficticia guardada. Sin marco probado; Jardín y flores visibles al final.');
 await click('[data-do="dismiss-celebration"]','02 · Mi diario','El avance se conserva aunque cierres la invitación.');

 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 chapter='reportes';
 await click('.side-nav [data-view="reportes"]','03 · Reportes','Elige qué parte de tu trayectoria vas a compartir.');
 await fill('#report-title','Avances para la próxima asesoría de tesis','03 · Reportes','Pon un título que identifique esta conversación.');
 const choices=await page.locator('[data-report-list]:checked').evaluateAll(els=>els.map(e=>({key:e.dataset.reportList,id:e.value})));
 for(const c of choices)await page.locator(`[data-report-list="${c.key}"][value="${c.id}"]`).uncheck();
 await page.locator('#report-names').uncheck();
 await shot('03 · Reportes','La selección es tuya: incluye el rumbo y solo los registros pertinentes.',3);
 await click('[data-report-list="actions"][value="act-casos"]','03 · Reportes','Elige el compromiso que quieres conversar.');
 await click('[data-report-list="route"][value="m2-metodo"]','03 · Reportes','Añade el corte actual del producto, sin su historial privado.');
 await click('[data-do="preview"]','03 · Reportes','Prepara la copia que recibirá tu dirección.');
 await scroll('.report-preview','03 · Reportes','Revisa la vista previa antes de descargar.');
 const frame=page.frameLocator('#report-frame');
 await frame.locator('body').waitFor();
 const reportText=await frame.locator('body').innerText();
 if(!reportText.includes('criterios de contraste')||(reportText.includes('Revisar dos párrafos sobre la selección de casos')||reportText.includes('Una conversación breve')||reportText.includes(activityNote)))throw new Error('Reporte incorrecto o incluye tareas, diario o notas de actividad');
 const dlPromise=page.waitForEvent('download');
 await click('[data-do="html"]','03 · Reportes','Descarga el panel de consulta con tu selección.',3);
 const dl=await dlPromise;await dl.saveAs(path.join(out,'reporte-ficticio.html'));
 checks.push('Reportes: selección de compromiso y producto; panel HTML descargado; tareas, diario y notas de actividad ausentes.');
 await shot('03 · Reportes','También puedes descargar Excel o imprimir y guardar PDF.',4);
 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 chapter='cierre';
 await page.evaluate(()=>window.scrollTo(0,0));
 await click('.side-nav [data-view="brujula"]','Tu trayectoria, contigo','El respaldo conserva todo; el reporte comparte una selección.',4);
 const backup=page.waitForEvent('download');
 await click('.topbar [data-do="backup"]','Tu trayectoria, contigo','Guarda el JSON en tu computadora o en una carpeta de nube ya configurada.',3.4);
 const backupFile=await backup;await backupFile.saveAs(path.join(out,'respaldo-ficticio.json'));
 await shot('Tu trayectoria, contigo','Drive, OneDrive o Dropbox necesitan internet para subirlo; Compás no sincroniza.',3.4);
 await page.screenshot({path:path.join(out,'respaldo.png')});
 if(errors.length)throw new Error(errors.join('\n'));
 checks.push('Respaldo ficticio descargado; cero errores JavaScript durante los recorridos.');
 fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify({version:fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),applicationSource:'dist/index.html',applicationBytes:html.length,applicationSha256:crypto.createHash('sha256').update(html).digest('hex'),captureMethod:'Playwright / Chromium · HTTP local · contexto aislado',viewport:{width:1440,height:900},frames,checks},null,2));
 console.log(JSON.stringify({out,frames:frames.length,checks},null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
