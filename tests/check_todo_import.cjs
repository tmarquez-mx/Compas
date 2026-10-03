const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');

const htmlPath=process.argv[2]||path.resolve(__dirname,'../dist/index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const match=html.match(/<script id="compas-core">([\s\S]*?)<\/script>/);
assert(match,'No se encontró el núcleo Compás.');
const context={TextEncoder,Uint8Array,DataView,Date,Math,Set,Map,JSON,Intl,console};
vm.createContext(context);vm.runInContext(match[1],context);
const C=context.CompasCore;
for(const helper of ['parseTodoImport','mapTodoImport','mergeTodoImport'])assert.equal(typeof C[helper],'function','Falta '+helper);
let count=0;
const check=(label,fn)=>{fn();count++;console.log('OK '+label);};
const mapping={title:0,due:1,priority:2,status:3,notes:4};
const csv=(text,options={})=>C.mapTodoImport(C.parseTodoImport(text,'csv'),mapping,{dateOrder:'dmy',...options});
const ics=body=>'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Compas//Pruebas ficticias//ES\r\n'+body+'\r\nEND:VCALENDAR\r\n';
const calendar=body=>C.mapTodoImport(C.parseTodoImport(ics(body),'ics'),{},{});
const selected=candidates=>candidates.filter(c=>!c.issues.length).map(c=>c.index);
const joinWarnings=parsed=>JSON.stringify(parsed.warnings||[]);
const item=(title,due='',extra={})=>({id:C.uid(),title,date:C.today(),due,priority:'media',done:false,completedAt:'',actionId:'',milestoneId:'',privateNotes:'',...extra});

check('CSV con BOM, comas entre comillas, Unicode y salto de línea preserva textos',()=>{
 const parsed=C.parseTodoImport('\ufeffTarea,Fecha,Prioridad,Estado,Notas\r\n"Revisar García, Pérez y Muñoz",2026-11-05,Alta,Pendiente,"Primera línea\r\nSegunda línea con ""cita"""\r\n','csv');
 assert.equal(parsed.format,'csv');assert.equal(parsed.columns.length,5);assert.equal(parsed.records.length,1);
 const rows=C.mapTodoImport(parsed,mapping,{dateOrder:'dmy',includeNotes:true});
 assert.equal(rows[0].title,'Revisar García, Pérez y Muñoz');assert.equal(rows[0].due,'2026-11-05');assert.equal(rows[0].priority,'alta');
 assert.match(rows[0].privateNotes,/Primera línea\r?\nSegunda línea con "cita"/);assert.equal(rows[0].issues.length,0);
});
check('CSV de punto y coma y tabulador admite delimitadores sin partir texto citado',()=>{
 for(const separator of [';','\t']){
  const text=['Título','Fecha','Prioridad','Estado','Notas'].join(separator)+'\n'+['"Escribir; revisar\tcapítulo"','2026-12-15','Baja','Pendiente',''].join(separator)+'\n';
  const parsed=C.parseTodoImport(text,'csv');assert.equal(parsed.columns.length,5);
  const rows=C.mapTodoImport(parsed,mapping,{});assert.equal(rows[0].title,'Escribir; revisar\tcapítulo');assert.equal(rows[0].priority,'baja');
 }
});
check('Líneas vacías antes del encabezado no ocultan el separador y conservan la referencia de fila',()=>{
 const parsed=C.parseTodoImport('\r\n\r\nTítulo;Fecha;Prioridad;Estado;Notas\r\nLectura;2026-11-05;Alta;Pendiente;\r\n','csv');
 assert.equal(parsed.columns.length,5);assert.equal(parsed.records[0].row,4);
 const rows=C.mapTodoImport(parsed,mapping,{dateOrder:'dmy'});assert.equal(rows[0].title,'Lectura');assert.equal(rows[0].due,'2026-11-05');assert.equal(rows[0].issues.length,0);
});
check('El mapeo de CSV depende de columnas elegidas, no de un encabezado fijo',()=>{
 const parsed=C.parseTodoImport('Notas,Estado,Nombre,Prioridad,Fecha\nnota privada,Done,Preparar lectura,High,2026-11-03\n','csv');
 const rows=C.mapTodoImport(parsed,{title:2,due:4,priority:3,status:1,notes:0},{includeNotes:true,dateOrder:'ymd'});
 assert.equal(rows[0].title,'Preparar lectura');assert.equal(rows[0].due,'2026-11-03');assert.equal(rows[0].priority,'alta');assert.equal(rows[0].done,true);assert(rows[0].completedAt);assert.equal(rows[0].privateNotes,'nota privada');
});
check('Las notas se omiten por defecto y solo se incorporan por elección explícita',()=>{
 const text='Tarea,Fecha,Prioridad,Estado,Notas\nRevisar capítulo,2026-11-12,Media,Pendiente,NOTA_PRIVADA_731\n';
 assert.equal(csv(text)[0].privateNotes,'');assert.equal(csv(text,{includeNotes:true})[0].privateNotes,'NOTA_PRIVADA_731');
});
check('La fecha ambigua CSV respeta día/mes frente a mes/día',()=>{
 const text='Tarea,Fecha,Prioridad,Estado,Notas\nEscribir capítulo,04/05/2026,Media,Pendiente,\n';
 assert.equal(csv(text,{dateOrder:'dmy'})[0].due,'2026-05-04');assert.equal(csv(text,{dateOrder:'mdy'})[0].due,'2026-04-05');
});
check('Fechas ISO, años bisiestos y fecha ausente se normalizan sin inferencias de calendario',()=>{
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nRevisar,2028-02-29,Media,Pendiente,\nLeer,,Baja,Pendiente,\n');
 assert.equal(rows[0].due,'2028-02-29');assert.equal(rows[1].due,'');assert(rows.every(r=>!r.issues.length));
});
check('Fechas imposibles y años incompletos quedan bloqueados en la vista previa',()=>{
 for(const date of ['31/02/2026','2026-02-29','04/05/26','2026-13-01']){
  const row=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLectura,'+date+',Media,Pendiente,\n')[0];assert(row.issues.length,'Fecha inválida aceptada: '+date);
 }
});
check('Una fila vacía no genera tarea y un título vacío bloquea su fila',()=>{
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\n\n,2026-10-05,Media,Pendiente,\nTítulo válido,,Media,Pendiente,\n');
 assert.equal(rows.length,2);assert(rows[0].issues.length);assert.equal(rows[1].title,'Título válido');assert.equal(rows[1].issues.length,0);
});
check('CSV truncado, vacío y un calendario declarado como CSV se rechazan',()=>{
 assert.throws(()=>C.parseTodoImport('Tarea,Fecha\n"sin cierre,2026-10-01','csv'));
 assert.throws(()=>C.parseTodoImport('','csv'));
 assert.throws(()=>C.parseTodoImport(ics('BEGIN:VEVENT\r\nSUMMARY:Lectura\r\nEND:VEVENT'),'csv'));
});
check('Un formato no admitido no se interpreta como CSV ni como calendario',()=>{
 assert.throws(()=>C.parseTodoImport('Tarea,Fecha\nLeer,2026-10-02','xlsx'));
});
check('El límite de 2 MB se mide en bytes UTF-8, incluidos los caracteres acentuados',()=>{
 const prefix='Título\n',remaining=C.MAX_TODO_IMPORT_BYTES-new TextEncoder().encode(prefix).length;
 const text=prefix+'á'.repeat(Math.floor(remaining/2))+(remaining%2?'x':'');
 assert.equal(new TextEncoder().encode(text).length,C.MAX_TODO_IMPORT_BYTES);
 assert.equal(C.parseTodoImport(text,'csv').records.length,1);
 assert.throws(()=>C.parseTodoImport(text+'á','csv'),/2 MB/);
 assert.throws(()=>C.parseTodoImport(ics('DESCRIPTION:'+'á'.repeat(C.MAX_TODO_IMPORT_BYTES/2)),'ics'),/2 MB/);
});
check('CSV e ICS aceptan 1000 registros y rechazan un archivo que supera ese límite',()=>{
 const rows=Array.from({length:C.MAX_TODO_IMPORT_ROWS},(_,i)=>'Tarea ficticia '+i);
 assert.equal(C.parseTodoImport('Título\n'+rows.join('\n'),'csv').records.length,C.MAX_TODO_IMPORT_ROWS);
 assert.throws(()=>C.parseTodoImport('Título\n'+[...rows,'Una más'].join('\n'),'csv'),/1000/);
 const events=rows.map((title,i)=>['BEGIN:VEVENT','UID:limite-'+i+'@example.invalid','DTSTART;VALUE=DATE:20261101','SUMMARY:'+title,'END:VEVENT'].join('\r\n'));
 assert.equal(C.parseTodoImport(ics(events.join('\r\n')),'ics').records.length,C.MAX_TODO_IMPORT_ROWS);
 assert.throws(()=>C.parseTodoImport(ics([...events,events[0]].join('\r\n')),'ics'),/1000/);
});
check('El CSV limita las columnas y el mapeo bloquea títulos y notas demasiado largos',()=>{
 const header=Array.from({length:100},(_,i)=>'Columna '+i),cells=header.map(()=> 'valor');
 assert.equal(C.parseTodoImport(header.join(',')+'\n'+cells.join(','),'csv').columns.length,100);
 assert.throws(()=>C.parseTodoImport([...header,'Extra'].join(',')+'\n'+[...cells,'valor'].join(','),'csv'),/100 columnas/);
 const title=csv('Tarea,Fecha,Prioridad,Estado,Notas\n'+'x'.repeat(16001)+',,Media,Pendiente,\n')[0];assert(title.issues.length);
 const note=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLectura,,Media,Pendiente,'+'x'.repeat(16001)+'\n',{includeNotes:true})[0];assert(note.issues.length);
});
check('VEVENT plegado conserva título y escapes TEXT al convertir inicio en fecha',()=>{
 const body=['BEGIN:VEVENT','UID:compas-fold-1@example.invalid','DTSTART;VALUE=DATE:20261115','SUMMARY:Revisar marco teórico de la',' investigación social\\, versión 2','DESCRIPTION:Notas\\nSegunda línea\\; literal\\, coma y \\\\ barra','END:VEVENT'].join('\r\n');
 const parsed=C.parseTodoImport(ics(body),'ics');assert.equal(parsed.format,'ics');assert.equal(parsed.records.length,1);
 const rows=C.mapTodoImport(parsed,{}, {includeNotes:true});
 assert.equal(rows[0].title,'Revisar marco teórico de lainvestigación social, versión 2');assert.equal(rows[0].due,'2026-11-15');
 assert.equal(rows[0].privateNotes,'Notas\nSegunda línea; literal, coma y \\ barra');assert.equal(rows[0].issues.length,0);
});
check('VTODO usa DUE, STATUS y COMPLETED para conservar una tarea finalizada',()=>{
 const rows=calendar(['BEGIN:VTODO','UID:compas-complete-1@example.invalid','DTSTART;VALUE=DATE:20261101','DUE;VALUE=DATE:20261130','SUMMARY:Revisar bibliografía','STATUS:COMPLETED','COMPLETED:20261121T143000Z','PRIORITY:1','END:VTODO'].join('\r\n'));
 assert.equal(rows[0].due,'2026-11-30');assert.equal(rows[0].done,true);assert.equal(rows[0].completedAt,'2026-11-21');assert.equal(rows[0].priority,'alta');assert.equal(rows[0].issues.length,0);
});
check('Los estados propios de VTODO y VEVENT no se intercambian silenciosamente',()=>{
 const rows=calendar(['BEGIN:VEVENT','UID:estado-evento@example.invalid','DTSTART;VALUE=DATE:20261101','SUMMARY:Evento','STATUS:COMPLETED','END:VEVENT','BEGIN:VTODO','UID:estado-tarea@example.invalid','DUE;VALUE=DATE:20261101','SUMMARY:Tarea','STATUS:CONFIRMED','END:VTODO'].join('\r\n'));
 assert.equal(rows.length,2);assert(rows.every(r=>r.issues.length));
});
check('Eventos con zona horaria conservan la fecha declarada y no desplazan el día',()=>{
 const rows=calendar(['BEGIN:VEVENT','UID:compas-timezone-1@example.invalid','DTSTART;TZID=Europe/London:20261231T233000','SUMMARY:Planificar año','END:VEVENT','BEGIN:VEVENT','UID:compas-timezone-2@example.invalid','DTSTART:20270101T003000Z','SUMMARY:Revisar plan','END:VEVENT'].join('\r\n'));
 assert.equal(rows[0].due,'2026-12-31');assert.equal(rows[1].due,'2027-01-01');
});
check('RRULE y excepciones recurrentes no expanden infinitamente la importación',()=>{
 const parsed=C.parseTodoImport(ics(['BEGIN:VEVENT','UID:compas-recurring@example.invalid','DTSTART;VALUE=DATE:20261101','SUMMARY:Seminario recurrente','RRULE:FREQ=DAILY','EXDATE;VALUE=DATE:20261102','END:VEVENT'].join('\r\n')),'ics');
 const rows=C.mapTodoImport(parsed,{},{});assert.equal(rows.length,1);assert.equal(rows[0].due,'2026-11-01');
 assert(joinWarnings(parsed).length>2||rows[0].warnings.length,'Falta advertencia de recurrencia sin expansión.');
});
check('Las cancelaciones quedan fuera de las filas importables',()=>{
 const parsed=C.parseTodoImport(ics(['BEGIN:VEVENT','UID:compas-cancelled@example.invalid','DTSTART;VALUE=DATE:20261101','SUMMARY:Sesión cancelada','STATUS:CANCELLED','END:VEVENT'].join('\r\n')),'ics');
 const rows=C.mapTodoImport(parsed,{},{});assert(rows.length===0||rows.every(r=>r.issues.length));
 assert.equal(C.mergeTodoImport(C.blank(),rows,selected(rows)).added,0);
});
check('VEVENT y VTODO sin fecha siguen siendo tareas manuales y omiten notas por defecto',()=>{
 const rows=calendar(['BEGIN:VTODO','UID:compas-undated@example.invalid','SUMMARY:Leer ensayo','DESCRIPTION:NO_EXPORTAR_119','END:VTODO'].join('\r\n'));
 assert.equal(rows[0].due,'');assert.equal(rows[0].privateNotes,'');assert.equal(rows[0].issues.length,0);
});
check('No se incorporan alarmas, asistentes, enlaces ni adjuntos como notas',()=>{
 const rows=C.mapTodoImport(C.parseTodoImport(ics(['BEGIN:VEVENT','UID:compas-privacy@example.invalid','DTSTART;VALUE=DATE:20261101','SUMMARY:Lectura','ATTENDEE:mailto:persona@example.invalid','LOCATION:DOMICILIO_PRIVADO','URL:https://example.invalid/privado','ATTACH:https://example.invalid/datos','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:ALARMA_PRIVADA','TRIGGER:-PT15M','END:VALARM','END:VEVENT'].join('\r\n')),'ics'),{}, {includeNotes:true});
 assert.equal(rows[0].title,'Lectura');assert.equal(rows[0].privateNotes,'');assert(!JSON.stringify(rows).includes('DOMICILIO_PRIVADO'));assert(!JSON.stringify(rows).includes('ALARMA_PRIVADA'));
});
check('Un ICS truncado, fechas inválidas y ausencia de título no se guardan',()=>{
 assert.throws(()=>C.parseTodoImport('BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nSUMMARY:Truncado\r\nEND:VEVENT','ics'));
 const rows=calendar(['BEGIN:VEVENT','UID:compas-bad-date@example.invalid','DTSTART;VALUE=DATE:20260231','SUMMARY:Fecha inválida','END:VEVENT','BEGIN:VTODO','UID:compas-no-title@example.invalid','DUE;VALUE=DATE:20261001','END:VTODO'].join('\r\n'));
 assert.equal(rows.length,2);assert(rows.every(r=>r.issues.length));
});
check('Títulos HTML/XML permanecen texto literal y se escapan antes de presentarse',()=>{
 const hostile='<img src=x onerror=alert(1)> & <script>alert(2)</script>';
 const text='Tarea,Fecha,Prioridad,Estado,Notas\n"'+hostile+'",2026-11-15,Media,Pendiente,"'+hostile+'"\n';
 const rows=csv(text,{includeNotes:true});assert.equal(rows[0].title,hostile);assert.equal(rows[0].privateNotes,hostile);
 const markup=C.esc(rows[0].title);assert(!markup.includes('<img'));assert(!markup.includes('<script'));assert(markup.includes('&lt;img'));assert(markup.includes('&amp;'));
});
check('La vista previa escapa archivo, encabezados, títulos, notas y observaciones',()=>{
 const ui=html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1];
 const { functionSource }=require('./support/source.cjs');
 const mappingFunction=functionSource(ui,'importMappingField');
 const previewFunction=functionSource(ui,'todoImportPreview');
 const hostile='<img src=x onerror=alert(1)> & "nombre" <script>alert(2)</script>';
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLectura,2026-11-01,Media,Pendiente,\n');
 rows[0].title=hostile;rows[0].privateNotes=hostile;rows[0].warnings=[hostile];
 const dialog={innerHTML:'',querySelector:()=>null},draft={parsed:{format:'csv',columns:[hostile],warnings:[hostile]},mapping:{title:0,due:-1,priority:-1,status:-1,notes:-1},options:{dateOrder:'dmy',includeNotes:true},candidates:rows,duplicates:new Set(),selected:new Set(),page:0,name:hostile};
 const viewContext={todoImportDraft:draft,C,e:C.esc,fmt:C.fmt,$:()=>dialog,btn:label=>'<button>'+C.esc(label)+'</button>',document:{activeElement:null,getElementById:()=>null},Set,Math};
 vm.createContext(viewContext);vm.runInContext(mappingFunction+'\n'+previewFunction+'\ntodoImportPreview();',viewContext);
 assert(!dialog.innerHTML.includes('<img'));assert(!dialog.innerHTML.includes('<script>'));assert(!dialog.innerHTML.includes(hostile));assert(dialog.innerHTML.includes('&lt;img'));
 assert(dialog.innerHTML.includes('aria-label="Importar: &lt;img'));assert(dialog.innerHTML.includes('&quot;nombre&quot;'));
});
check('Solo las filas seleccionadas se añaden; compromisos y productos quedan intactos',()=>{
 const state=C.demo(),before=JSON.stringify(state);const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nPrimera,,Media,Pendiente,\nSegunda,2026-11-15,Alta,Pendiente,\n');
 const result=C.mergeTodoImport(state,rows,[rows[1].index]);assert.equal(result.added,1);assert.equal(result.state.todos.length,state.todos.length+1);assert.equal(result.state.todos.at(-1).title,'Segunda');
 assert.equal(result.state.todos.at(-1).actionId,'');assert.equal(result.state.todos.at(-1).milestoneId,'');assert.equal(JSON.stringify(state),before);
 for(const field of ['project','actions','routeProgress','sessions','decisions','timeEntries','reflections'])assert.equal(JSON.stringify(result.state[field]),JSON.stringify(C.validate(state)[field]));
});
check('La selección vacía no modifica la bitácora',()=>{
 const state=C.blank(),rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLeer,,Media,Pendiente,\n');
 const result=C.mergeTodoImport(state,rows,[]);assert.equal(result.added,0);assert.equal(JSON.stringify(result.state),JSON.stringify(C.validate(state)));
});
check('Repetir una importación no duplica tareas, tampoco tras editar el título importado',()=>{
 const state=C.blank(),rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nEscribir argumento,2026-11-01,Media,Pendiente,\n');
 const first=C.mergeTodoImport(state,rows,selected(rows));assert.equal(first.added,1);assert(first.state.todos[0].importKey);
 first.state.todos[0].title='Escribir el argumento reformulado';first.state.todos[0].due='2026-12-02';
 const second=C.mergeTodoImport(first.state,rows,selected(rows));assert.equal(second.added,0);assert.equal(second.duplicates,1);assert.equal(second.state.todos.length,1);assert.equal(second.state.todos[0].title,'Escribir el argumento reformulado');
});
check('Reimportar un UID de calendario no sustituye las ediciones hechas en Compás',()=>{
 const body=['BEGIN:VEVENT','UID:compas-reimport@example.invalid','DTSTART;VALUE=DATE:20261115','SUMMARY:Supervisión inicial','END:VEVENT'].join('\r\n');
 const rows=calendar(body),first=C.mergeTodoImport(C.blank(),rows,selected(rows));first.state.todos[0].title='Supervisión revisada localmente';
 const changed=calendar(body.replace('20261115','20261210').replace('Supervisión inicial','Supervisión editada en calendario'));
 const second=C.mergeTodoImport(first.state,changed,selected(changed));assert.equal(second.added,0);assert.equal(second.duplicates,1);assert.equal(second.state.todos[0].title,'Supervisión revisada localmente');
});
check('Una tarea manual con igual título y fecha evita duplicados y no recibe importKey',()=>{
 const state=C.blank();state.todos.push(item('Leer artículo','2026-11-01'));
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLeer artículo,2026-11-01,Media,Pendiente,\n');
 const result=C.mergeTodoImport(state,rows,selected(rows));assert.equal(result.added,0);assert.equal(result.duplicates,1);assert.equal(result.state.todos.length,1);assert(!result.state.todos[0].importKey);
});
check('La comparación de duplicados conserva las diferencias de acentos en los títulos',()=>{
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nRevisar año,2026-11-01,Media,Pendiente,\nRevisar ano,2026-11-01,Media,Pendiente,\n');
 const result=C.mergeTodoImport(C.blank(),rows,selected(rows));assert.equal(result.added,2);assert.equal(result.duplicates,0);
});
check('Los duplicados dentro del mismo archivo solo se guardan una vez',()=>{
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLeer ensayo,2026-11-01,Media,Pendiente,\nLeer ensayo,2026-11-01,Media,Pendiente,\n');
 const result=C.mergeTodoImport(C.blank(),rows,selected(rows));assert.equal(result.added,1);assert.equal(result.duplicates,1);
});
check('Seleccionar una fila inválida o inexistente falla sin guardar cambios parciales',()=>{
 const state=C.blank(),before=JSON.stringify(state),rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nVálida,2026-11-01,Media,Pendiente,\nInválida,31/02/2026,Media,Pendiente,\n');
 assert.throws(()=>C.mergeTodoImport(state,rows,rows.map(r=>r.index)));assert.equal(JSON.stringify(state),before);
 assert.throws(()=>C.mergeTodoImport(state,rows,[rows[0].index,999999]));assert.equal(JSON.stringify(state),before);
});
check('Las fechas inválidas no pueden guardarse borrando el aviso de la vista previa',()=>{
 const state=C.blank(),before=JSON.stringify(state),rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nLeer ensayo,2026-11-01,Media,Pendiente,\n');
 rows[0].due='2026-02-31';rows[0].issues=[];
 assert.throws(()=>C.mergeTodoImport(state,rows,[rows[0].index]));assert.equal(JSON.stringify(state),before);
});
check('El límite de tareas evita una importación parcial cuando la bitácora está llena',()=>{
 const state=C.blank();state.todos=Array.from({length:3000},(_,i)=>item('Tarea previa '+i));
 const before=JSON.stringify(state),rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nNueva tarea,2026-11-01,Media,Pendiente,\n');
 assert.throws(()=>C.mergeTodoImport(state,rows,selected(rows)));assert.equal(JSON.stringify(state),before);
});
check('La clave de importación sobrevive respaldo, reapertura y marcar tarea terminada',()=>{
 const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\nRevisar citas,2026-11-01,Media,Pendiente,\n');
 const merged=C.mergeTodoImport(C.blank(),rows,selected(rows));const key=merged.state.todos[0].importKey;
 const done=C.setTodoDone(merged.state,merged.state.todos[0].id,true),restored=C.restore(C.backup(done));assert.equal(restored.todos[0].importKey,key);assert.equal(restored.todos[0].done,true);
 assert.equal(C.mergeTodoImport(restored,rows,selected(rows)).added,0);
});
check('Notas, títulos y claves importadas se quedan fuera de reportes para compartir',()=>{
 const secret='SECRETO_IMPORTACION_913745';const rows=csv('Tarea,Fecha,Prioridad,Estado,Notas\n'+secret+',2026-11-01,Media,Pendiente,'+secret+'\n',{includeNotes:true});
 const state=C.mergeTodoImport(C.blank(),rows,selected(rows)).state;
 const report=C.makeShare(state,{project:true,names:false,actions:[],sessions:[],decisions:[],route:[]});
 for(const text of [JSON.stringify(report),C.reportHTML(report),Buffer.from(C.excelBytes(report)).toString('utf8')]){assert(!text.includes(secret));assert(!text.includes('importKey'));assert(!text.includes('privateNotes'));}
 assert(C.backup(state).includes(secret));assert(C.backup(state).includes(state.todos[0].importKey));
});

check('Deshacer un lote conserva tareas anteriores y las importadas que se editaron después',()=>{
 const ui=html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1];
 const source=require('./support/source.cjs').functionSource(ui, 'todoImportCommit');
 const prior=C.blank();prior.todos.push(item('Tarea anterior','2026-11-01'));const priorCopy=JSON.stringify(prior);
 const candidates=csv('Tarea,Fecha,Prioridad,Estado,Notas\nRevisar el argumento,2026-11-05,Media,Pendiente,\nRevisar bibliografía,2026-11-06,Media,Pendiente,\n');
 let undo;
 const mock={C,Set,Map,JSON,state:prior,todoImportDraft:{candidates,selected:new Set(selected(candidates))},todoFilter:'pendientes',
  $:()=>({close(){}}),navigate(){},saveMessage(message){return message;},toast(_message,callback){if(callback)undo=callback;},todoImportError(message){throw new Error(message);},
  mutate(fn){const next=C.clone(mock.state);fn(next);mock.state=C.validate(next);return true;}};
 vm.createContext(mock);vm.runInContext(source+'\ntodoImportCommit();',mock);
 assert.equal(mock.state.todos.length,3);assert.equal(mock.todoFilter,'todas');assert.equal(typeof undo,'function');assert.equal(JSON.stringify(prior),priorCopy);
 mock.state.todos.find(t=>t.title==='Revisar el argumento').title='Revisar argumento y conclusión';
 undo();assert.equal(mock.state.todos.length,2);assert(mock.state.todos.some(t=>t.title==='Tarea anterior'));assert(mock.state.todos.some(t=>t.title==='Revisar argumento y conclusión'));assert(!mock.state.todos.some(t=>t.title==='Revisar bibliografía'));
});

console.log('\n'+count+' comprobaciones de importación ToDo correctas.');
