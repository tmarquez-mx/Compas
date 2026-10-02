/* Captura recorridos reales en un navegador aislado, únicamente con el ejemplo ficticio.
 * COMPAS_PLAYWRIGHT apunta al paquete playwright; COMPAS_CHROMIUM es opcional.
 * Salida temporal: COMPAS_DEMO_WORK (por defecto /tmp/compas-demos-0.3.6).
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {chromium}=require(process.env.COMPAS_PLAYWRIGHT||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.COMPAS_DEMO_WORK||'/tmp/compas-demos-0.3.6';
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
 await fill('[name="evidence"]','Capítulo metodológico: criterios de contraste precisados tras la supervisión.','01 · Mi ruta','Describe el avance; los datos de investigación se conservan fuera de Compás.');
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
 await shot('02 · ToDo','La tarea queda vinculada al diseño metodológico de tu ruta.',3.4);
 await click('#edit-form [type="submit"]','02 · ToDo','Guarda la tarea para retomarla desde ToDo o Brújula.');
 await click('.side-nav [data-view="todo"]','02 · ToDo','Tus tareas permanecen en tu bitácora personal.');
 const todoRow=page.locator('.todo-row').filter({hasText:'Revisar dos párrafos sobre la selección de casos'});
 const todoId=await todoRow.locator('[data-todo-check]').getAttribute('data-todo-check');
 await click(`[data-todo-check="${todoId}"]`,'02 · ToDo','Marca el paso terminado; su producto y compromiso siguen abiertos.');
 await page.locator('#todo-filter').selectOption('terminadas');
 await shot('02 · ToDo','Consulta Terminadas para reconocer tus pasos realizados.',4);
 const task=await page.evaluate(id=>JSON.parse(localStorage.getItem('compas-personal-v1')).data.todos.find(t=>t.id===id),todoId);
 if(!task.done||task.milestoneId!=='m2-metodo')throw new Error('Tarea no terminada o sin vínculo');
 checks.push('ToDo: tarea creada, vinculada a m2-metodo y terminada por la interfaz.');
 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 chapter='reportes';
 await click('.side-nav [data-view="reportes"]','03 · Reportes','Elige qué parte de tu trayectoria vas a compartir.');
 await fill('#report-title','Avances para la próxima supervisión','03 · Reportes','Pon un título que identifique esta conversación.');
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
 if(!reportText.includes('criterios de contraste')||reportText.includes('Revisar dos párrafos sobre la selección de casos'))throw new Error('Reporte incorrecto o incluye ToDo');
 const dlPromise=page.waitForEvent('download');
 await click('[data-do="html"]','03 · Reportes','Descarga el panel de consulta con tu selección.',3);
 const dl=await dlPromise;await dl.saveAs(path.join(out,'reporte-ficticio.html'));
 checks.push('Reportes: selección de compromiso y producto; panel HTML descargado; tarea privada ausente.');
 await shot('03 · Reportes','También puedes descargar Excel o imprimir y guardar PDF.',4);
 await page.locator('#toast').waitFor({state:'hidden',timeout:12000});
 chapter='cierre';
 await page.evaluate(()=>window.scrollTo(0,0));
 await click('.side-nav [data-view="brujula"]','Tu trayectoria, contigo','El respaldo conserva todo; el reporte comparte una selección.',4);
 const backup=page.waitForEvent('download');
 await click('.topbar [data-do="backup"]','Tu trayectoria, contigo','Descarga el respaldo y localiza el archivo antes de confirmarlo.',3.4);
 const backupFile=await backup;await backupFile.saveAs(path.join(out,'respaldo-ficticio.json'));
 await page.screenshot({path:path.join(out,'respaldo.png')});
 if(errors.length)throw new Error(errors.join('\n'));
 checks.push('Respaldo ficticio descargado; cero errores JavaScript durante los recorridos.');
 fs.writeFileSync(path.join(out,'frames.json'),JSON.stringify({version:fs.readFileSync(path.join(root,'VERSION'),'utf8').trim(),applicationSha256:crypto.createHash('sha256').update(html).digest('hex'),viewport:{width:1440,height:900},frames,checks},null,2));
 console.log(JSON.stringify({out,frames:frames.length,checks},null,2));
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
