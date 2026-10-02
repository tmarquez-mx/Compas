(function (global) {
'use strict';
const FOOTER = 'CSP | Universidad Iberoamericana Ciudad de México';
const STATES = {'pendiente':'Pendiente','en-proceso':'En proceso','bloqueado':'Bloqueado','resuelto':'Resuelto'};
const DISPOSITIONS = {incorporar:'Incorporar',parcial:'Incorporar parcialmente',justificar:'No incorporar con justificación',revisar:'Por decidir'};
const CATEGORIES = ['Lectura','Escritura','Trabajo de campo / levantamiento de datos','Análisis de datos','Publicación','Capacitación','Supervisión','Gestión de la investigación','Otra'];
const uid = () => 'c-' + (global.crypto && global.crypto.randomUUID ? global.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
const today = () => { const d = new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const shift = n => {const d=new Date(today()+'T12:00:00');d.setDate(d.getDate()+n);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);};
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = v => v ? new Date(v+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'}) : 'Sin fecha';
const clone = v => JSON.parse(JSON.stringify(v));
// The reference is a dated draft supplied by the coordination, not an official regulation.
const MAX_BACKUP_BYTES=24*1024*1024;
const ROUTE_VERSION='borrador-2026-09-10';
const LEVELS={maestria:'Maestría',doctorado:'Doctorado'};
const ROUTE_STATES={pendiente:'Por trabajar','en-proceso':'En desarrollo',bloqueado:'Necesita ajuste',resuelto:'Realizado'};
const REVIEWS={'sin-revision':'Sin revisión registrada','por-revisar':'Para revisión',revisado:'Revisión registrada',aprobado:'Aprobación registrada'};
const ROUTES={
 maestria:[
  {semester:1,title:'Plantear el proyecto',spaces:'Metodología de la investigación',note:'Proyecto aprobado y desarrollo de habilidades de investigación. Si cambia el tema, el borrador indica entregar el nuevo proyecto al finalizar el semestre para obtener calificación aprobatoria. Compás no asigna calificaciones.',products:[
   ['m1-protocolo','protocolo','Protocolo de investigación','Protocolo con revisión de literatura. Registrar la aprobación del proyecto cuando corresponda.']]},
  {semester:2,title:'Construir el diseño',spaces:'Métodos cualitativos de la investigación social / Métodos cuantitativos de la investigación social',note:'Diseño metodológico y técnicas de recolección y análisis (codificación y sistematización), revisados por la dirección de tesis.',products:[
   ['m2-metodo','metodo','Capítulo metodológico e instrumento','Capítulo metodológico con diseño del instrumento; documentar su revisión con la dirección.']]},
  {semester:3,title:'Presentar y construir datos',spaces:'Coloquio de tesistas · Seminario de investigación 1',note:'El borrador pide presentar el 50% de la tesis: planteamiento y diseño, incluidos los instrumentos de recopilación. Es una referencia textual; Compás no calcula ese porcentaje.',products:[
   ['m3-coloquio','coloquio','Presentación de avances en coloquio','Planteamiento y diseño, incluidos los instrumentos de recopilación de datos.'],
   ['m3-datos','datos','Recolección y sistematización','El borrador menciona transcripciones, bases de datos analizadas y notas de campo. Registra aquí solo una descripción del avance, sin adjuntar esos datos.']]},
  {semester:4,title:'Analizar e integrar el borrador',spaces:'Seminario de investigación 2 · Seminario de análisis de datos',note:'Ambos productos se indican como “subido en BS”. El borrador no fija un mes ni una fecha de defensa.',products:[
   ['m4-borrador','tesis','Borrador de tesis','Integrar el borrador y registrar su entrega en BS.'],
   ['m4-analisis','analisis','Análisis de datos','Documentar el avance del análisis y su entrega en BS, sin cargar datos de investigación en Compás.']]}
 ],
 doctorado:[
  {semester:1,title:'Fundamentar el proyecto',spaces:'Metodología de la investigación social',note:'Proyecto aprobado y habilidades de investigación. El borrador no especifica quién aprueba el proyecto.',products:[
   ['d1-proyecto','proyecto','Proyecto de investigación','Registrar el proyecto y su aprobación cuando corresponda.'],
   ['d1-estado','literatura','Estado del arte','Formas de construcción y contenido del estado del arte.']]},
  {semester:2,title:'Desarrollar con supervisión',spaces:'Métodos cualitativos de la investigación social / Métodos cuantitativos de la investigación social · Coloquio de Tesistas (verano)',note:'Productos con la supervisión de la directora o director. En este semestre no se establece todavía su aprobación.',products:[
   ['d2-teoria','teoria','Marco teórico','Desarrollar el marco teórico con supervisión.'],
   ['d2-metodo','metodo','Diseño metodológico e instrumentos','Desarrollar el diseño metodológico y los instrumentos con supervisión.'],
   ['d2-coloquio','coloquio','Coloquio de Tesistas de verano','Registrar la participación o presentación en el coloquio; verano es la referencia del borrador.']]},
  {semester:3,title:'Revisar y obtener aprobación',spaces:'Seminario de investigación 1',note:'El borrador pide aprobación del marco teórico, diseño metodológico e instrumentos por la dirección. Continúa el trabajo del semestre 2; conserva sus versiones.',products:[
   ['d3-teoria','teoria','Marco teórico: etapa de aprobación','Registrar la versión aprobada por la dirección.'],
   ['d3-metodo','metodo','Diseño e instrumentos: etapa de aprobación','Registrar la versión del diseño metodológico y los instrumentos aprobada por la dirección.']]},
  {semester:4,title:'Integrar y presentar candidatura',spaces:'Seminario de investigación 2 · Examen de candidatura como parte del Coloquio de Tesistas',note:'El examen de candidatura corresponde a este semestre. Registrar su realización no equivale a registrar un resultado aprobatorio.',products:[
   ['d4-planteamiento','proyecto','Planteamiento','Integrar el planteamiento de la investigación.'],
   ['d4-literatura','literatura','Revisión de literatura','Integrar la revisión de literatura para esta etapa.'],
   ['d4-teoria','teoria','Marco teórico integrado','Integrar la versión del marco teórico para esta etapa.'],
   ['d4-metodo','metodo','Descripción de métodos e instrumentos','Integrar la descripción de métodos y el diseño de instrumentos.'],
   ['d4-candidatura','candidatura','Examen de candidatura','Registrar la realización del examen y, por separado, el resultado comunicado.']]},
  {semester:5,title:'Construir y sistematizar',spaces:'Seminario de investigación 3',note:'Recolección y sistematización de datos. Registra decisiones y revisiones de avance, sin cargar los datos.',products:[
   ['d5-datos','datos','Recolección y sistematización','Documentar el avance de la construcción y organización de datos.']]},
  {semester:6,title:'Continuar y presentar avances',spaces:'Seminario de investigación 4 · Coloquio de Tesistas',note:'El borrador incluye “habilitación para construcción de datos” y presentar el 70% de la tesis en el coloquio. Se conserva esa formulación; no define cómo calcular el porcentaje.',products:[
   ['d6-datos','datos','Recolección y sistematización: continuidad','Continuar el producto del semestre 5 y registrar la versión o corte del avance.'],
   ['d6-coloquio','coloquio','Presentación de avances en coloquio','Referencia del borrador: presentar el 70% de la tesis. Compás no estima ese porcentaje.']]},
  {semester:7,title:'Interpretar y analizar',spaces:'Seminario de titulación 1 · Seminario de análisis de datos',note:'Interpretación y análisis de datos.',products:[
   ['d7-analisis','analisis','Interpretación y análisis','Documentar el desarrollo de la interpretación y el análisis, mediante referencias generales a versiones.']]},
  {semester:8,title:'Integrar el borrador de tesis',spaces:'Seminario de titulación 2',note:'El borrador indica “Subir en BS — mayo”. No especifica día, año ni fecha de defensa.',products:[
   ['d8-borrador','tesis','Borrador de tesis','Integrar el borrador y registrar su entrega en BS; mayo es la referencia del documento.']]}
 ]
};
const MILESTONES=Object.entries(ROUTES).flatMap(([level,stages])=>stages.flatMap(s=>s.products.map(([id,work,title,expected])=>({id,workId:level+'-'+work,title,expected,level,semester:s.semester,spaces:s.spaces,note:s.note,templateVersion:ROUTE_VERSION}))));
const milestone=id=>MILESTONES.find(m=>m.id===id);
function routeDefault(id){
 if(!milestone(id))throw new Error('Producto de ruta desconocido.');
 return {id,templateVersion:ROUTE_VERSION,status:'pendiente',versionLabel:'',evidence:'',planSemester:String(milestone(id).semester),due:'',adjustmentReason:'',reviewState:'sin-revision',reviewBy:'',reviewDate:'',privateNotes:'',updatedAt:'',history:[]};
}
function routeAt(state,id,cutoff){
 const p=state.routeProgress.find(x=>x.id===id);if(!p)return null;
 return [...p.history,p].filter(x=>!cutoff||x.updatedAt<=cutoff).at(-1)||null;
}
function saveRoute(state,id,values){
 const next=clone(state),old=next.routeProgress.find(x=>x.id===id),base=old||routeDefault(id);
 const p={...base,...values,id,templateVersion:ROUTE_VERSION,updatedAt:today(),history:old?[...old.history,Object.fromEntries(Object.entries(old).filter(([k])=>k!=='history'))]:[]};
 if(p.status==='resuelto'&&!p.evidence.trim())throw new Error('Describe la evidencia o referencia del producto realizado.');
 if((p.planSemester!==String(milestone(id).semester)||(old&&(p.planSemester!==old.planSemester||p.due!==old.due)))&&!p.adjustmentReason.trim())throw new Error('Explica el motivo del ajuste en tu plan.');
 if(['revisado','aprobado'].includes(p.reviewState)&&(!p.reviewDate||!p.evidence.trim()||!p.reviewBy.trim()))throw new Error('Registra la persona, fecha y referencia de la revisión o aprobación.');
 const pos=next.routeProgress.findIndex(x=>x.id===id);if(pos<0)next.routeProgress.push(p);else next.routeProgress[pos]=p;
 return validate(next);
}
function setTodoDone(state,id,done){
 const next=clone(state),t=next.todos.find(x=>x.id===id);if(!t)throw new Error('No se encontró la tarea.');
 t.done=done;t.completedAt=done?today():'';return validate(next);
}
function removeRecord(state,key,id){
 if(!['sessions','actions','decisions','timeEntries','reflections','todos'].includes(key))throw new Error('No se puede eliminar este tipo de registro.');
 const next=clone(state);next[key]=next[key].filter(x=>x.id!==id);
 if(key==='sessions')next.actions.forEach(a=>{if(a.sourceId===id)a.sourceId='';});
 if(key==='actions')[...next.timeEntries,...next.todos].forEach(t=>{if(t.actionId===id)t.actionId='';});
 return validate(next);
}


function blank() {
 return {schemaVersion:2,isDemo:false,project:{id:uid(),level:'',title:'',student:'',program:'',generation:'',semester:'',director:'',line:'',question:'',objectives:'',approach:'',scope:'',milestone:'',milestoneDate:'',privateNotes:''},sessions:[],actions:[],decisions:[],timeEntries:[],reflections:[],routeProgress:[],todos:[]};
}
function demo() {
 const s=blank();s.isDemo=true;
 Object.assign(s.project,{level:'maestria',title:'Redes vecinales y participación política juvenil',student:'Alex · ejemplo ficticio',program:'Maestría en Ciencias Sociales y Políticas',generation:'2026',semester:'3',director:'Dirección de tesis · ejemplo ficticio',line:'Instituciones y participación',question:'¿Cómo influyen las redes vecinales en la participación política de jóvenes en dos colonias de la Ciudad de México?',objectives:'Comprender las formas de participación juvenil.\nComparar el papel de las redes vecinales en dos contextos locales.',approach:'Estudio comparativo cualitativo con entrevistas semiestructuradas.',scope:'Dos colonias; participación en espacios comunitarios. Delimitación de casos por revisar.',milestone:'Revisar el diseño metodológico con la dirección',milestoneDate:shift(10),privateNotes:'Recordatorio personal ficticio: necesito dejar tiempo entre lectura y escritura.'});
 s.sessions=[
 {id:'ses-coloquio',type:'coloquio',date:shift(-18),title:'Coloquio de avances',participants:'Comité · ejemplo ficticio',presented:'Protocolo y primer apartado del marco conceptual',agenda:'Coherencia entre pregunta, conceptos y selección de casos.',advances:'Primera versión del marco conceptual y mapa de literatura.',summary:'Precisar el concepto de participación y justificar los casos comparados.',reviewed:'registrado',nextDate:shift(90),presentsAgain:'si',privateNotes:'Reflexión privada ficticia sobre cómo viví la presentación.'},
 {id:'ses-supervision',type:'supervision',date:shift(-5),title:'Revisión del diseño metodológico',participants:'Tesista y dirección · ejemplo ficticio',presented:'Matriz de selección de casos, versión 2',agenda:'Revisar el alcance de la comparación.\nAcordar los criterios de selección.',advances:'Se precisó la definición de participación y se identificaron criterios de contraste.',summary:'Comparar dos contextos y explicitar los límites de la selección.',reviewed:'revisado',nextDate:shift(10),presentsAgain:'no',privateNotes:'Nota personal ficticia: preparar una sola pregunta central para la siguiente sesión.'}
 ];
 s.actions=[
 {id:'act-casos',sourceType:'supervision',sourceId:'ses-supervision',sourceLabel:'Revisión del diseño metodológico',date:shift(-5),updatedAt:shift(-2),commenter:'Dirección',category:'Metodológico',comment:'Explicitar por qué estos dos casos permiten una comparación relevante.',disposition:'incorporar',rationale:'El contraste territorial permite examinar distintas formas de articulación vecinal.',description:'Precisar y justificar el criterio de selección de casos',owner:'Tesista',due:shift(7),priority:'alta',status:'en-proceso',evidence:'Matriz de selección de casos, versión 2.',response:'',privateNotes:''},
 {id:'act-concepto',sourceType:'coloquio',sourceId:'ses-coloquio',sourceLabel:'Coloquio de avances',date:shift(-18),updatedAt:shift(-4),commenter:'Comité',category:'Teórico-conceptual',comment:'Distinguir participación comunitaria y participación política.',disposition:'incorporar',rationale:'La precisión conceptual hace explícito qué prácticas se analizarán.',description:'Precisar el concepto de participación en el marco analítico',owner:'Tesista',due:shift(-3),priority:'alta',status:'resuelto',evidence:'Capítulo 1, apartado 1.2, versión del '+fmt(shift(-4))+'.',response:'Se delimitó el concepto y se explicaron sus dimensiones.',privateNotes:''},
 {id:'act-guia',sourceType:'supervision',sourceId:'ses-supervision',sourceLabel:'Revisión del diseño metodológico',date:shift(-5),updatedAt:shift(-5),commenter:'Dirección',category:'Metodológico',comment:'Vincular las preguntas de entrevista con los objetivos de la investigación.',disposition:'incorporar',rationale:'La guía debe producir información pertinente para responder la pregunta.',description:'Revisar la relación entre objetivos y guía de entrevista',owner:'Tesista',due:shift(14),priority:'media',status:'pendiente',evidence:'',response:'',privateNotes:''}
 ];
 s.decisions=[{id:'dec-alcance',date:shift(-5),title:'Delimitar la comparación a dos contextos',previous:'Explorar cuatro colonias con criterios aún abiertos.',current:'Comparar dos colonias con criterios de contraste explícitos.',reason:'El acceso y el tiempo disponible permiten profundizar en dos contextos.',alternatives:'Mantener cuatro casos con menor profundidad; realizar un único estudio de caso.',impact:'Ajustar selección, cronograma y alcance de las conclusiones.',reviewDate:shift(10),questionCheck:'La comparación permite examinar cómo intervienen distintas redes vecinales.',basisCheck:'Criterios de contraste y pertinencia teórica por desarrollar.',feasibilityCheck:'Confirmar acceso antes de cerrar la selección.',ethicsCheck:'Revisar condiciones de acceso y evitar información que identifique a participantes.',supersedes:'',privateNotes:''}];
 s.timeEntries=[
 {id:'time-1',date:shift(-4),category:'Lectura',minutes:90,actionId:'act-casos',note:'Lectura sobre comparación cualitativa.'},
 {id:'time-2',date:shift(-3),category:'Escritura',minutes:120,actionId:'act-casos',note:'Redacción de criterios.'},
 {id:'time-3',date:shift(-2),category:'Supervisión',minutes:60,actionId:'',note:'Preparación de la próxima reunión.'},
 {id:'time-4',date:shift(-1),category:'Análisis de datos',minutes:75,actionId:'',note:'Ejercicio ficticio de organización analítica.'}
 ];
 s.reflections=[{id:'ref-1',date:shift(-2),text:'Ejemplo privado: distinguir qué necesita más lectura y qué ya puedo empezar a escribir.'}];
 s.actions.forEach(a=>a.milestoneId=a.id==='act-concepto'?'m3-coloquio':'m2-metodo');
 s.decisions.forEach(d=>d.milestoneId='m2-metodo');
 s.routeProgress=[{...routeDefault('m2-metodo'),status:'en-proceso',versionLabel:'Versión 2',evidence:'Capítulo metodológico, matriz de casos revisada.',planSemester:'3',due:shift(10),adjustmentReason:'Revisar la delimitación después de la supervisión.',reviewState:'por-revisar',updatedAt:shift(-2)},{...routeDefault('m3-coloquio'),status:'resuelto',versionLabel:'Presentación de avances',evidence:'Presentación ficticia de planteamiento y diseño.',updatedAt:shift(-18)}];
 s.todos=[{id:'todo-criterios',title:'Redactar un párrafo sobre los criterios de selección',date:shift(-2),due:shift(1),priority:'alta',done:false,completedAt:'',actionId:'act-casos',milestoneId:'m2-metodo',privateNotes:'Tarea de ejemplo: reservar un bloque breve de escritura.'},{id:'todo-agenda',title:'Preparar las preguntas para la próxima supervisión',date:shift(-2),due:shift(8),priority:'media',done:false,completedAt:'',actionId:'',milestoneId:'',privateNotes:''}];
 return s;
}
function validate(input) {
 if (!input || typeof input!=='object' || Array.isArray(input) || ![1,2].includes(input.schemaVersion)) throw new Error('El archivo no es una bitácora Compás compatible.');
 if(input.schemaVersion===1)input={...input,schemaVersion:2,project:{...input.project,level:''},routeProgress:[],todos:[]};
 const out=blank();
 const string=(v,k,max=16000)=>{if(v===undefined)return '';if(typeof v!=='string'||v.length>max)throw new Error('Revisa el campo '+k+'.');return v;};
 const date=(v,k)=>{v=string(v,k,10);if(v&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T12:00:00'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v))throw new Error('Fecha inválida en '+k+'.');return v;};
 const id=(v,k)=>{v=string(v,k,80);if(!/^[a-zA-Z0-9-]+$/.test(v))throw new Error('Identificador inválido en '+k+'.');return v;};
 const pick=(o,keys)=>{if(!o||typeof o!=='object'||Array.isArray(o))throw new Error('Registro inválido.');const r={};keys.forEach(k=>r[k]=string(o[k],k));return r;};
 const list=(k)=>{if(!Array.isArray(input[k])||input[k].length>3000)throw new Error('Lista inválida o demasiado grande: '+k+'.');return input[k];};
 const oneOf=(v,vals,k)=>{if(!vals.includes(v))throw new Error('Valor inválido en '+k+'.');return v;};
 out.isDemo=input.isDemo===true;
 out.project=pick(input.project,Object.keys(out.project));out.project.id=id(input.project.id,'proyecto');out.project.milestoneDate=date(input.project.milestoneDate,'próximo hito');
 oneOf(out.project.level,['',...Object.keys(LEVELS)],'nivel');
 out.sessions=list('sessions').map(x=>{const r=pick(x,['id','type','date','title','participants','presented','agenda','advances','summary','reviewed','nextDate','presentsAgain','privateNotes']);r.id=id(r.id,'sesión');r.date=date(r.date,'sesión');r.nextDate=date(r.nextDate,'próxima sesión');r.type=oneOf(r.type,['coloquio','supervision'],'tipo de sesión');r.reviewed=oneOf(r.reviewed,['registrado','revisado'],'revisión');r.presentsAgain=oneOf(r.presentsAgain,['si','no','por-definir'],'próximo coloquio');return r;});
 out.actions=list('actions').map(x=>{const r=pick(x,['id','sourceType','sourceId','sourceLabel','date','updatedAt','commenter','category','comment','disposition','rationale','description','owner','due','priority','status','evidence','response','privateNotes','milestoneId']);r.id=id(r.id,'compromiso');r.date=date(r.date,'registro');r.updatedAt=date(r.updatedAt,'actualización');r.due=date(r.due,'compromiso');oneOf(r.sourceType,['personal','coloquio','supervision'],'origen');oneOf(r.disposition,Object.keys(DISPOSITIONS),'decisión sobre comentario');oneOf(r.priority,['alta','media','baja'],'prioridad');oneOf(r.status,Object.keys(STATES),'estado');return r;});
 out.decisions=list('decisions').map(x=>{const r=pick(x,['id','date','title','previous','current','reason','alternatives','impact','reviewDate','questionCheck','basisCheck','feasibilityCheck','ethicsCheck','supersedes','privateNotes','milestoneId']);r.id=id(r.id,'decisión');r.date=date(r.date,'decisión');r.reviewDate=date(r.reviewDate,'revisión');return r;});
 out.timeEntries=list('timeEntries').map(x=>{const r=pick(x,['id','date','category','actionId','note']);r.id=id(r.id,'dedicación');r.date=date(r.date,'dedicación');if(!Number.isInteger(x.minutes)||x.minutes<1||x.minutes>1440)throw new Error('La duración debe estar entre 1 y 1440 minutos.');r.minutes=x.minutes;return r;});
 out.reflections=list('reflections').map(x=>{const r=pick(x,['id','date','text']);r.id=id(r.id,'reflexión');r.date=date(r.date,'reflexión');return r;});
 const routeRecord=(x)=>{
  const r=pick(x,['id','templateVersion','status','versionLabel','evidence','planSemester','due','adjustmentReason','reviewState','reviewBy','reviewDate','privateNotes','updatedAt']);
  r.id=id(r.id,'producto');if(!milestone(r.id))throw new Error('Producto de ruta desconocido.');
  if(r.templateVersion!==ROUTE_VERSION)throw new Error('La versión de la ruta no es compatible.');
  oneOf(r.status,Object.keys(ROUTE_STATES),'avance del producto');oneOf(r.reviewState,Object.keys(REVIEWS),'revisión del producto');
  if(!/^[1-9][0-9]?$/.test(r.planSemester))throw new Error('El semestre planeado debe estar entre 1 y 99.');
  r.due=date(r.due,'fecha planeada');r.reviewDate=date(r.reviewDate,'revisión');r.updatedAt=date(r.updatedAt,'actualización de ruta');
  if(!r.updatedAt)throw new Error('Falta la fecha de actualización del producto.');
  if(r.status==='resuelto'&&!r.evidence.trim())throw new Error('El producto realizado necesita una referencia de avance.');
  if(['revisado','aprobado'].includes(r.reviewState)&&(!r.reviewBy.trim()||!r.reviewDate||!r.evidence.trim()))throw new Error('La revisión requiere persona, fecha y referencia.');
  if(r.reviewDate&&r.reviewDate>r.updatedAt)throw new Error('La revisión no puede ser posterior al registro de avance.');
  return r;
 };
 out.routeProgress=list('routeProgress').map(x=>{const r=routeRecord(x);if(!Array.isArray(x.history)||x.history.length>500)throw new Error('Historial de ruta inválido o demasiado largo.');r.history=x.history.map(routeRecord);if(r.history.some(h=>h.id!==r.id))throw new Error('Historial vinculado a otro producto.');
 const timeline=[...r.history,r];if(timeline.some((h,i)=>i&&h.updatedAt<timeline[i-1].updatedAt))throw new Error('El historial de ruta debe conservar su orden cronológico.');return r;});
 out.todos=list('todos').map(x=>{const r=pick(x,['id','title','date','due','priority','completedAt','actionId','milestoneId','privateNotes']);r.id=id(r.id,'tarea');if(!r.title.trim())throw new Error('La tarea necesita un título.');r.date=date(r.date,'tarea');r.due=date(r.due,'tarea');r.completedAt=date(r.completedAt,'tarea completada');if(typeof x.done!=='boolean')throw new Error('Estado de tarea inválido.');r.done=x.done;if(r.done!==Boolean(r.completedAt))throw new Error('La fecha de cierre de la tarea no corresponde con su estado.');oneOf(r.priority,['alta','media','baja'],'prioridad');if(x.importKey!==undefined){r.importKey=string(x.importKey,'origen de importación',80);if(!/^(csv|ics)-[a-z0-9-]{1,70}$/.test(r.importKey))throw new Error('Origen de importación inválido.');}return r;});
 for(const x of [...out.actions,...out.decisions,...out.todos])if(x.milestoneId&&!milestone(x.milestoneId))throw new Error('Vínculo a un producto de ruta desconocido.');
 for(const x of out.todos)if(x.actionId&&!out.actions.some(a=>a.id===x.actionId))throw new Error('La tarea apunta a un compromiso inexistente.');
 for(const k of ['sessions','actions','decisions','timeEntries','reflections','routeProgress','todos']) {const ids=out[k].map(x=>x.id);if(new Set(ids).size!==ids.length)throw new Error('Hay identificadores duplicados en '+k+'.');}
 for(const x of out.actions)if(x.sourceId&&!out.sessions.some(s=>s.id===x.sourceId))throw new Error('Un compromiso apunta a una sesión inexistente.');
 for(const x of out.timeEntries)if(x.actionId&&!out.actions.some(a=>a.id===x.actionId))throw new Error('Un registro de tiempo apunta a un compromiso inexistente.');
 for(const x of out.decisions)if(x.supersedes&&!out.decisions.some(d=>d.id===x.supersedes))throw new Error('Falta una decisión previa en el historial.');
 if(new TextEncoder().encode(backupText(out)).length>MAX_BACKUP_BYTES)throw new Error('La bitácora supera los 24 MB. No se guardó el cambio. Descarga tu respaldo antes de reducir registros.');
 return out;
}
function backupText(state){return JSON.stringify({format:'compas-backup',version:2,savedAt:new Date().toISOString(),data:state},null,2);}
function backup(state){return backupText(validate(state));}
function restore(text){if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('El archivo excede el límite de 24 MB o no es texto.');let o;try{o=JSON.parse(text);}catch(_){throw new Error('No se pudo leer el archivo. Abre un respaldo JSON descargado desde Compás.');}if(!o||typeof o!=='object'||Array.isArray(o)||o.format!=='compas-backup'||![1,2].includes(o.version))throw new Error('Selecciona un respaldo editable de Compás; los reportes de consulta no son respaldos.');if(o.data?.schemaVersion!==o.version)throw new Error('La versión del respaldo no coincide con su contenido.');return validate(o.data);}
function makeShare(state,options) {
 const select=(key,id)=>Array.isArray(options[key])&&options[key].includes(id);
 const textFields=(obj,keys)=>Object.fromEntries(keys.map(k=>[k,typeof obj[k]==='string'?obj[k]:'']));
 const between=d=>(!options.from||d>=options.from)&&(!options.to||d<=options.to);
 const share={format:'compas-report',version:1,generatedAt:new Date().toISOString(),from:options.from||'',to:options.to||'',title:options.title||'Reporte de seguimiento',isDemo:state.isDemo===true,project:null,sessions:[],actions:[],decisions:[],route:[]};
 if(options.project) {
  share.project=textFields(state.project,['title','level','program','generation','semester','line','question','objectives','approach','scope','milestone','milestoneDate']);
  if(options.names)Object.assign(share.project,textFields(state.project,['student','director']));
 }
 share.sessions=state.sessions.filter(x=>select('sessions',x.id)&&between(x.date)).map(x=>{
  const s=textFields(x,['type','date','title','presented','agenda','advances','summary','reviewed','nextDate','presentsAgain']);
  if(options.names)s.participants=x.participants;return s;
 });
 share.actions=state.actions.filter(x=>select('actions',x.id)&&(!options.to||x.date<=options.to)&&(x.status!=='resuelto'||!options.from||x.updatedAt>=options.from)).map(x=>{
  const a=textFields(x,['sourceType','sourceLabel','date','comment','category','disposition','rationale','description','due','priority','status','evidence','response']);
  if(options.names)Object.assign(a,textFields(x,['commenter','owner']));return a;
 });
 share.decisions=state.decisions.filter(x=>select('decisions',x.id)&&between(x.date)).map(x=>textFields(x,['date','title','previous','current','reason','alternatives','impact','reviewDate','questionCheck','basisCheck','feasibilityCheck','ethicsCheck']));
 share.route=state.routeProgress.filter(x=>select('route',x.id)).map(x=>({m:milestone(x.id),p:routeAt(state,x.id,options.to)})).filter(x=>x.p).map(({m,p})=>{
  const r={level:LEVELS[m.level],title:m.title,referenceSemester:String(m.semester),expected:m.expected,templateVersion:m.templateVersion,...textFields(p,['status','versionLabel','evidence','planSemester','due','adjustmentReason','reviewState','reviewDate','updatedAt'])};
  if(options.names)r.reviewBy=p.reviewBy;
  return r;
 });
 return share;
}
const reportStyle = 'body{font-family:Arial,sans-serif;color:#171717;background:#fff;margin:0;line-height:1.6}main{max-width:1080px;margin:auto;padding:42px 32px}h1{font-size:34px;line-height:1.2;margin:16px 0}h2{font-size:23px;margin:32px 0 14px;border-bottom:2px solid #e00034;padding-bottom:8px}h3{font-size:18px;margin:0 0 12px}p{white-space:pre-wrap;overflow-wrap:anywhere}small,.muted{color:#605953}.brand{color:#e00034;font-size:25px;font-weight:700}.meta{color:#605953;font-size:14px}.record{padding:20px 0;border-bottom:1px solid #dedbd8;break-inside:avoid}.pair{display:grid;grid-template-columns:180px 1fr;gap:16px;margin:8px 0}.pair dt{color:#605953}.pair dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.pills{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.pill{background:#f2f0ee;padding:6px 10px;font-size:14px}.toolbar{padding:16px 32px;border-bottom:1px solid #dedbd8;display:flex;gap:16px;align-items:center;flex-wrap:wrap}button,select{font:inherit;padding:10px;border:1px solid #82786f;background:#fff;border-radius:4px}button{cursor:pointer}.summary{display:flex;gap:32px;flex-wrap:wrap}.summary strong{display:block;font-size:28px}.bar{height:8px;background:#e00034;margin:10px 0}.footer{font-size:13px;color:#605953;border-top:1px solid #dedbd8;margin-top:38px;padding-top:18px}a{color:#e00034}@media(max-width:600px){main{padding:24px 18px}.pair{grid-template-columns:1fr;gap:0}.toolbar{padding:12px 18px}}@page{size:A4;margin:16mm}@media print{.toolbar{display:none}main{max-width:none;padding:0;font-size:10pt}h1{font-size:23pt}h2{font-size:16pt}h3{font-size:12pt}.pair{grid-template-columns:130px 1fr}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.record[hidden]{display:block!important}}';
function reportHTML(r) {
 const pair=(label,value)=>value?'<div class="pair"><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>':'';
 const p=r.project;
 let b='<main><div class="brand">Compás</div><h1>'+esc(r.title)+'</h1><p class="meta">Corte: '+esc(fmt(r.to||today()))+' · Generado: '+esc(new Date(r.generatedAt).toLocaleString('es-MX'))+(r.isDemo?' · EJEMPLO FICTICIO':'')+'</p><p class="meta">Copia de consulta. Contiene los registros seleccionados por el tesista. No se actualiza automáticamente.</p>';
 b+='<div class="summary"><div><strong>'+r.actions.length+'</strong>compromisos seleccionados</div><div><strong>'+r.decisions.length+'</strong>decisiones</div><div><strong>'+r.sessions.length+'</strong>sesiones</div></div>';
 if(p){b+='<h2>Rumbo de la tesis</h2><h3>'+esc(p.title||'Tesis sin título')+'</h3><dl>'+pair('Tesista',p.student)+pair('Dirección',p.director)+pair('Nivel',LEVELS[p.level])+pair('Programa',p.program)+pair('Generación / semestre',[p.generation,p.semester].filter(Boolean).join(' / '))+pair('Línea',p.line)+pair('Pregunta',p.question)+pair('Objetivos',p.objectives)+pair('Enfoque',p.approach)+pair('Alcance',p.scope)+pair('Próximo hito',p.milestone)+pair('Fecha del hito',p.milestoneDate?fmt(p.milestoneDate):'')+'</dl>';}
 if(r.route?.length)b+='<h2>Mi ruta · productos seleccionados</h2><p class="meta">Ruta de referencia en borrador, versión '+esc(ROUTE_VERSION)+'. Último registro disponible hasta la fecha de corte; puede ser anterior al inicio del periodo. Los estados y las revisiones son registros del tesista, sin firma ni VoBo verificado. No representan un porcentaje de avance de la tesis.</p>'+r.route.map(x=>'<article class="record"><h3>'+esc(x.title)+'</h3><dl>'+pair('Nivel',x.level)+pair('Semestre de referencia',x.referenceSemester)+pair('Resultado esperado',x.expected)+pair('Semestre en mi plan',x.planSemester)+pair('Fecha planeada',x.due?fmt(x.due):'')+pair('Estado',ROUTE_STATES[x.status])+pair('Versión del producto',x.versionLabel)+pair('Referencia de avance',x.evidence)+pair('Motivo del ajuste',x.adjustmentReason)+pair('Revisión / aprobación',REVIEWS[x.reviewState])+pair('Persona que revisó',x.reviewBy)+pair('Fecha de revisión',x.reviewDate?fmt(x.reviewDate):'')+pair('Registro actualizado',fmt(x.updatedAt))+'</dl></article>').join('');
 if(r.actions.length){
  b+='<h2>Acuerdos y compromisos</h2>';
  const done=r.actions.filter(x=>x.status==='resuelto').length;
  b+='<p class="meta">'+done+' resueltos de '+r.actions.length+' compromisos seleccionados. Este conteo no mide el porcentaje de avance de la tesis.</p>';
  b+=r.actions.map(a=>'<article class="record" data-status="'+esc(a.status)+'"><h3>'+esc(a.description)+'</h3><div class="pills"><span class="pill">'+esc(STATES[a.status])+'</span><span class="pill">Prioridad '+esc(a.priority)+'</span><span class="pill">'+esc(fmt(a.due))+'</span></div><dl>'+pair('Origen',a.sourceLabel||'Registro personal')+pair('Responsable',a.owner)+pair('Comentario',a.comment)+pair('Fuente',a.commenter)+pair('Tipo',a.category)+pair('Decisión',DISPOSITIONS[a.disposition])+pair('Justificación',a.rationale)+pair('Evidencia de avance',a.evidence)+pair('Respuesta / cierre',a.response)+'</dl></article>').join('');
 }
 if(r.decisions.length)b+='<h2>Decisiones y cambios de rumbo</h2>'+r.decisions.map(d=>'<article class="record"><h3>'+esc(d.title)+'</h3><p class="meta">'+esc(fmt(d.date))+'</p><dl>'+pair('Planteamiento previo',d.previous)+pair('Decisión actual',d.current)+pair('Motivo',d.reason)+pair('Alternativas',d.alternatives)+pair('Consecuencias',d.impact)+pair('Relación con la pregunta',d.questionCheck)+pair('Fundamento',d.basisCheck)+pair('Viabilidad',d.feasibilityCheck)+pair('Consideraciones éticas',d.ethicsCheck)+pair('Próxima revisión',d.reviewDate?fmt(d.reviewDate):'')+'</dl></article>').join('');
 if(r.sessions.length)b+='<h2>Sesiones de seguimiento</h2>'+r.sessions.map(s=>'<article class="record"><h3>'+esc(s.title)+'</h3><p class="meta">'+(s.type==='coloquio'?'Coloquio':'Supervisión')+' · '+esc(fmt(s.date))+'</p><dl>'+pair('Participantes',s.participants)+pair('Avance presentado',s.presented)+pair('Agenda',s.agenda)+pair('Avances desde la sesión anterior',s.advances)+pair('Síntesis y acuerdos',s.summary)+pair('Revisión de la minuta',s.reviewed==='revisado'?'El tesista registró que la minuta fue revisada con la dirección. No constituye firma ni VoBo verificado.':'Registrada por el tesista; revisión con la dirección pendiente.')+pair('Próxima sesión',s.nextDate?fmt(s.nextDate):'')+'</dl></article>').join('');
 b+='<footer class="footer">'+esc(FOOTER)+'</footer></main>';
 const viewerScript="document.getElementById('filter').addEventListener('change',function(){document.querySelectorAll('[data-status]').forEach(function(x){x.hidden=this.value!=='todos'&&x.dataset.status!==this.value;},this);});document.getElementById('print').addEventListener('click',function(){window.print();});";
 return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src '+ "'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"+'"><title>'+esc(r.title)+' · Compás</title><style>'+reportStyle+'</style></head><body><div class="toolbar"><button id="print" type="button">Imprimir / Guardar PDF</button><label>Ver compromisos <select id="filter"><option value="todos">Todos los seleccionados</option>'+Object.entries(STATES).map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('')+'</select></label><small>El PDF incluye todos los registros de esta copia.</small></div>'+b+'<script>'+viewerScript+'<\/script></body></html>';
}
function xml(v){return String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function zipStore(files) {
 const enc=new TextEncoder();let offset=0;const pieces=[],centrals=[];
 const crc=b=>{let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
 const header=n=>new Uint8Array(n);
 for(const [name,content] of files){const fn=enc.encode(name),data=enc.encode(content),sum=crc(data);const h=header(30),v=new DataView(h.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(10,0,true);v.setUint16(12,33,true);v.setUint32(14,sum,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,fn.length,true);pieces.push(h,fn,data);const c=header(46),cv=new DataView(c.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(14,33,true);cv.setUint32(16,sum,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,fn.length,true);cv.setUint32(42,offset,true);centrals.push(c,fn);offset+=h.length+fn.length+data.length;}
 const size=centrals.reduce((n,x)=>n+x.length,0),end=header(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);const all=[...pieces,...centrals,end];const result=new Uint8Array(all.reduce((n,x)=>n+x.length,0));let n=0;for(const x of all){result.set(x,n);n+=x.length;}return result;
}
function excelBytes(r) {
 const projectLabels={level:'Nivel',title:'Título de la tesis',student:'Tesista',director:'Dirección de tesis',program:'Programa',generation:'Generación',semester:'Semestre',line:'Línea de investigación',question:'Pregunta de investigación',objectives:'Objetivos',approach:'Enfoque metodológico',scope:'Alcance y límites',milestone:'Próximo hito',milestoneDate:'Fecha del próximo hito'};
 const sheets=[
 ['Rumbo',[['Campo','Contenido'],['Reporte',r.title],['Fecha de corte',r.to||today()],['Generado',r.generatedAt],['Aviso','Copia de los registros seleccionados; no se actualiza automáticamente.'],...(r.project?Object.entries(r.project).map(([k,v])=>[projectLabels[k]||k,k==='level'?(LEVELS[v]||''):v]):[]),['Institución',FOOTER]]],
 ['Compromisos',[['Compromiso','Origen','Comentario','Decisión','Justificación','Responsable','Fecha','Prioridad','Estado','Evidencia','Respuesta'],...r.actions.map(a=>[a.description,a.sourceLabel,a.comment,DISPOSITIONS[a.disposition],a.rationale,a.owner||'',a.due,a.priority,STATES[a.status],a.evidence,a.response])]],
 ['Decisiones',[['Fecha','Decisión','Antes','Ahora','Motivo','Alternativas','Consecuencias','Pregunta','Fundamento','Viabilidad','Ética','Revisar'],...r.decisions.map(d=>[d.date,d.title,d.previous,d.current,d.reason,d.alternatives,d.impact,d.questionCheck,d.basisCheck,d.feasibilityCheck,d.ethicsCheck,d.reviewDate])]],
 ['Sesiones',[['Fecha','Tipo','Sesión','Participantes','Avance presentado','Agenda','Avances','Síntesis','Revisión registrada por tesista','Próxima fecha'],...r.sessions.map(s=>[s.date,s.type==='coloquio'?'Coloquio':'Supervisión',s.title,s.participants||'',s.presented,s.agenda,s.advances,s.summary,s.reviewed==='revisado'?'Revisada con dirección; sin firma verificada':'Pendiente de revisión',s.nextDate])]]
 ];
 sheets.push(['Mi ruta',[['Nivel','Producto','Semestre de referencia','Semestre en mi plan','Fecha planeada','Estado','Versión del producto','Referencia de avance','Motivo del ajuste','Revisión registrada por tesista','Persona que revisó','Fecha de revisión','Último registro','Versión del borrador','Aviso'],...(r.route||[]).map(x=>[x.level,x.title,x.referenceSemester,x.planSemester,x.due,ROUTE_STATES[x.status],x.versionLabel,x.evidence,x.adjustmentReason,REVIEWS[x.reviewState],x.reviewBy||'',x.reviewDate,x.updatedAt,x.templateVersion,'Ruta de referencia en borrador. Registro del tesista; sin firma ni VoBo verificado. No mide porcentaje de avance de tesis.'])]]);
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'],
 ['_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
 ['xl/workbook.xml','<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map(([name],i)=>'<sheet name="'+xml(name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'],
 ['xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
 ['xl/styles.xml','<styleSheet xmlns="'+ns+'"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE00034"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']];
 sheets.forEach(([,rows],i)=>files.push(['xl/worksheets/sheet'+(i+1)+'.xml','<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+rows[0].map((_,n)=>'<col min="'+(n+1)+'" max="'+(n+1)+'" width="'+(i===0&&n===1?90:32)+'" customWidth="1"/>').join('')+'</cols><sheetData>'+rows.map((row,j)=>'<row r="'+(j+1)+'"'+(j===0?' ht="30" customHeight="1"':'')+'>'+row.map((value,k)=>'<c r="'+String.fromCharCode(65+k)+(j+1)+'" t="inlineStr" s="'+(j===0?1:0)+'"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>').join('')+'</row>').join('')+'</sheetData><autoFilter ref="A1:'+String.fromCharCode(64+rows[0].length)+rows.length+'"/></worksheet>']));
 return zipStore(files);
}
// Local ToDo import. These helpers run in the CompasCore scope; no network or storage.
const MAX_TODO_IMPORT_BYTES=2*1024*1024;
const MAX_TODO_IMPORT_ROWS=1000;
function todoImportInput(text){
 if(typeof text!=='string'||text.length>MAX_TODO_IMPORT_BYTES||new TextEncoder().encode(text).length>MAX_TODO_IMPORT_BYTES)throw new Error('El archivo debe ser texto UTF-8 de hasta 2 MB.');
 if(text.includes('\u0000')||text.includes('\uFFFD'))throw new Error('No se pudo leer el archivo como UTF-8. Expórtalo con esa codificación e intenta de nuevo.');
 return text.replace(/^\uFEFF/,'');
}
// SHA-256 prefix: retain a stable source fingerprint, never the calendar UID itself.
function todoImportFingerprint(format,value){
 const b=Array.from(new TextEncoder().encode(value)),bits=b.length*8;b.push(128);while(b.length%64!==56)b.push(0);
 for(let i=7;i>=0;i--)b.push(Math.floor(bits/Math.pow(256,i))&255);
 const k=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],r=(v,n)=>(v>>>n)|(v<<(32-n));
 for(let o=0;o<b.length;o+=64){const w=[];for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2];w[i]=(w[i-16]+(r(x,7)^r(x,18)^(x>>>3))+w[i-7]+(r(y,17)^r(y,19)^(y>>>10)))|0;}let [a,c,d,e,f,g,j,l]=h;for(let i=0;i<64;i++){const t=(l+(r(f,6)^r(f,11)^r(f,25))+((f&g)^(~f&j))+k[i]+w[i])|0,u=((r(a,2)^r(a,13)^r(a,22))+((a&c)^(a&d)^(c&d)))|0;l=j;j=g;g=f;f=(e+t)|0;e=d;d=c;c=a;a=(t+u)|0;}[a,c,d,e,f,g,j,l].forEach((v,i)=>h[i]=(h[i]+v)|0);}
 return format+'-'+h.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('').slice(0,24);
}
function todoImportCSVRows(text,separator){
 const rows=[];let cells=[],cell='',quoted=false,closed=false,line=1,start=1,started=false;
 const addCell=()=>{cells.push(cell);cell='';closed=false;started=false;if(cells.length>100)throw new Error('El CSV tiene más de 100 columnas.');};
 const addRow=()=>{addCell();rows.push({cells,row:start});cells=[];start=line+1;if(rows.length>MAX_TODO_IMPORT_ROWS+2)throw new Error('El CSV tiene más de 1000 filas de datos.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=c;if(c==='\n'||(c==='\r'&&text[i+1]!=='\n'))line++;}continue;}
  if(closed&&c!==separator&&c!=='\r'&&c!=='\n')throw new Error('CSV inválido: hay texto después de una comilla de cierre en la línea '+line+'.');
  if(c==='"'){if(started||cell)throw new Error('CSV inválido: una comilla dentro de un campo debe duplicarse en la línea '+line+'.');quoted=true;started=true;}
  else if(c===separator)addCell();
  else if(c==='\r'||c==='\n'){addRow();if(c==='\r'&&text[i+1]==='\n')i++;line++;start=line;}
  else{cell+=c;started=true;}
 }
 if(quoted)throw new Error('CSV inválido: falta cerrar una comilla.');
 if(cell||cells.length||started||closed)addRow();
 return rows;
}
function todoImportParseCSV(text){
 if(/^\s*BEGIN:VCALENDAR/i.test(text))throw new Error('Este archivo es iCalendar. Selecciona un archivo .ics.');
 const warnings=[];let fixed='';const directive=text.match(/^sep=([,;\t])\r?\n/i);if(directive){fixed=directive[1];text=text.slice(directive[0].length);warnings.push('Se usó el separador declarado por el archivo CSV.');}
 // Examine the header outside quotes; do not infer a delimiter from quoted content.
 let inQuote=false,commas=0,semicolons=0,tabs=0;const headerText=text.replace(/^(?:[ \t]*(?:\r\n|\n|\r))+/,'');
 for(let i=0;i<headerText.length;i++){const c=headerText[i];if(c==='"'){if(inQuote&&headerText[i+1]==='"')i++;else inQuote=!inQuote;}else if(!inQuote){if(c==='\r'||c==='\n')break;if(c===',')commas++;if(c===';')semicolons++;if(c==='\t')tabs++;}}
 const separator=fixed||(tabs>commas&&tabs>semicolons?'\t':semicolons>commas?';':',');
 const all=todoImportCSVRows(text,separator);if(directive)all.forEach(r=>r.row++);const rows=all.filter(r=>r.cells.some(c=>c.trim()));
 if(all.length!==rows.length)warnings.push('Se omitieron '+(all.length-rows.length)+' filas vacías.');
 if(!rows.length)throw new Error('El CSV está vacío.');
 const header=rows.shift();if(!header.cells.length||header.cells.length>100)throw new Error('El CSV debe tener entre 1 y 100 columnas.');
 if(rows.length>MAX_TODO_IMPORT_ROWS)throw new Error('El CSV tiene más de 1000 filas de datos.');
 if(!rows.length)throw new Error('El CSV tiene encabezados, pero no tiene tareas.');
 const columns=header.cells.map((c,i)=>c.trim()||'Columna '+(i+1)+' (sin encabezado)');
 if(header.cells.some(c=>!c.trim()))warnings.push('Hay columnas sin encabezado; elige sus campos por posición.');
 const uneven=rows.filter(r=>r.cells.length!==columns.length).length;if(uneven)warnings.push(uneven+' filas tienen un número de columnas diferente al encabezado y requieren corrección.');
 return {format:'csv',columns,records:rows,warnings,separator};
}
function todoImportISO(y,m,d){
 const s=String(y).padStart(4,'0')+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 return y>=1&&y<=9999&&m>=1&&m<=12&&d>=1&&d<=31&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s?s:'';
}
function todoImportDate(value,order,warnings){
 const s=String(value||'').trim();if(!s)return {value:'',issue:''};
 let m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/);
 if(m){if(m[4]&&(+m[4]>23||+m[5]>59||(m[6]&&+m[6]>60)))return {value:'',issue:'La hora de la fecha no es válida.'};const d=todoImportISO(+m[1],+m[2],+m[3]);if(d&&m[4])warnings.push('Se conserva el día escrito; la hora y la zona horaria no se importan.');return {value:d,issue:d?'':'La fecha no es válida.'};}
 m=s.match(/^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})$/);
 if(m){if(!['dmy','mdy','ymd'].includes(order))return {value:'',issue:'Elige el orden de día, mes y año para esta fecha.'};let y,month,d;if(order==='dmy'){d=+m[1];month=+m[2];y=+m[3];if(m[3].length!==4)return {value:'',issue:'El año debe tener cuatro cifras.'};}else if(order==='mdy'){month=+m[1];d=+m[2];y=+m[3];if(m[3].length!==4)return {value:'',issue:'El año debe tener cuatro cifras.'};}else{y=+m[1];month=+m[2];d=+m[3];if(m[1].length!==4)return {value:'',issue:'El año debe tener cuatro cifras.'};}const iso=todoImportISO(y,month,d);return {value:iso,issue:iso?'':'La fecha no es válida para el orden elegido.'};}
 // Notion exports unambiguous written dates in English, depending on workspace language.
 const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,octubre:10,noviembre:11,diciembre:12};
 const lower=s.toLocaleLowerCase('es');m=lower.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{4})$/)||lower.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/);
 if(m){const firstIsMonth=Boolean(months[m[1]]),month=months[firstIsMonth?m[1]:m[2]],d=+(firstIsMonth?m[2]:m[1]),iso=month?todoImportISO(+m[3],month,d):'';return {value:iso,issue:iso?'':'La fecha escrita no es válida.'};}
 return {value:'',issue:'Fecha no compatible. Usa AAAA-MM-DD o una fecha numérica con el orden indicado; los intervalos deben separarse.'};
}
function todoImportText(v){return String(v||'').replace(/\\([nN,;\\])/g,(_,c)=>c==='n'||c==='N'?'\n':c);}
function todoImportICSProperty(line,row){
 let quote=false,colon=-1;for(let i=0;i<line.length;i++){if(line[i]==='"')quote=!quote;else if(line[i]===':'&&!quote){colon=i;break;}}
 if(colon<1)throw new Error('iCalendar inválido: falta el separador de una propiedad en la línea '+row+'.');
 const head=line.slice(0,colon),name=head.split(';')[0].toUpperCase();if(!/^[A-Z0-9-]+$/.test(name))throw new Error('Propiedad iCalendar inválida en la línea '+row+'.');
 return {name,value:line.slice(colon+1),params:head.slice(name.length)};
}
function todoImportICSDate(p,warnings){
 if(!p)return {value:'',issue:''};const s=p.value,m=s.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
 if(!m||m[4]&&(+m[4]>23||+m[5]>59||+m[6]>60))return {value:'',issue:'Fecha iCalendar no válida.'};
 if(/;VALUE=DATE(?:;|$)/i.test(p.params)&&m[4])return {value:'',issue:'El calendario mezcla una fecha de día completo con una hora.'};
 const iso=todoImportISO(+m[1],+m[2],+m[3]);if(iso&&m[4])warnings.push('Se conserva el día escrito; la hora y la zona horaria no se importan.');
 return {value:iso,issue:iso?'':'Fecha iCalendar no válida.'};
}
function todoImportICSRecord(part,method){
 const warnings=[],issues=[],props=part.props,get=name=>(props[name]||[])[0];
 for(const name of ['SUMMARY','DTSTART','DUE','STATUS','COMPLETED','DESCRIPTION','UID','PRIORITY'])if((props[name]||[]).length>1)issues.push('La propiedad '+name+' aparece más de una vez. Corrige el calendario.');
 const title=todoImportText(get('SUMMARY')?.value).trim(),status=(get('STATUS')?.value||'').toUpperCase();
 const skip=method==='CANCEL'||status==='CANCELLED'||Boolean(get('RECURRENCE-ID'));
 if(method==='CANCEL'||status==='CANCELLED')issues.push('Registro cancelado: no se convierte en tarea.');
 if(get('RECURRENCE-ID'))issues.push('Excepción de una serie recurrente: no se convierte automáticamente en tarea.');
 if(get('RRULE')||get('RDATE')||get('EXDATE'))warnings.push('Serie recurrente: solo se propone el evento o tarea base; no se generan repeticiones ni excepciones.');
 if(part.type==='VEVENT')warnings.push('Se toma el inicio del evento como fecha de la tarea.');
 const d=todoImportICSDate(part.type==='VTODO'?(get('DUE')||get('DTSTART')):get('DTSTART'),warnings);if(d.issue)issues.push(d.issue);
 const c=todoImportICSDate(get('COMPLETED'),warnings);if(c.issue)issues.push('Fecha de cierre: '+c.issue);
 let done=part.type==='VTODO'&&(status==='COMPLETED'||!status&&Boolean(get('COMPLETED'))),completedAt=done?(c.value||today()):'';
 if(done&&!c.value)warnings.push('El calendario marca la tarea terminada sin fecha de cierre; se registrará la fecha de hoy.');
 if(!done&&get('COMPLETED'))issues.push('La fecha de cierre no coincide con el estado de la tarea.');
 if(status==='TENTATIVE')warnings.push('El calendario marca este evento como provisional.');
 const states=part.type==='VTODO'?['COMPLETED','NEEDS-ACTION','IN-PROCESS','CANCELLED']:['CONFIRMED','TENTATIVE','CANCELLED'];
 if(status&&!states.includes(status))issues.push('Estado no válido para '+part.type+': revisa el archivo.');
 let priority='media';const pv=get('PRIORITY')?.value;if(pv!==undefined&&pv!==''){if(!/^[0-9]$/.test(pv))issues.push('Prioridad iCalendar no válida.');else priority=+pv===0||+pv===5?'media':+pv<5?'alta':'baja';}
 const privateNotes=todoImportText(get('DESCRIPTION')?.value),source=get('UID')?.value||JSON.stringify([title,d.value,part.type]);
 return {title,due:d.value,priority,done,completedAt,privateNotes,sourceKey:todoImportFingerprint('ics',part.type+'\n'+source),warnings,issues,skip};
}
function todoImportParseICS(text){
 const raw=text.split(/\r\n|\n|\r/),lines=[];for(let i=0;i<raw.length;i++){const s=raw[i];if(/^[ \t]/.test(s)){if(!lines.length)throw new Error('iCalendar inválido: continuación sin propiedad.');lines[lines.length-1].text+=s.slice(1);}else if(s!=='')lines.push({text:s,row:i+1});}
 const stack=[],parts=[];let active=null,method='',calendars=0;
 for(const line of lines){const p=todoImportICSProperty(line.text,line.row);
  if(p.name==='BEGIN'){const name=p.value.toUpperCase();if(name==='VCALENDAR'){if(stack.length||calendars)throw new Error('Selecciona un archivo que contenga un solo calendario.');calendars++;}else if(!stack.length)throw new Error('El archivo iCalendar necesita BEGIN:VCALENDAR.');
   if(['VEVENT','VTODO'].includes(name)){if(stack.length!==1||stack[0]!=='VCALENDAR')throw new Error('Estructura de calendario no compatible.');if(parts.length>=MAX_TODO_IMPORT_ROWS)throw new Error('El calendario tiene más de 1000 eventos o tareas.');active={type:name,props:Object.create(null)};parts.push(active);}stack.push(name);continue;}
  if(p.name==='END'){const name=p.value.toUpperCase();if(stack.pop()!==name)throw new Error('iCalendar inválido: los componentes no cierran en el orden correcto.');if(['VEVENT','VTODO'].includes(name))active=null;continue;}
  if(!stack.length)throw new Error('iCalendar inválido: hay propiedades fuera del calendario.');
  if(stack.length===1&&p.name==='METHOD')method=p.value.toUpperCase();
  if(active&&stack.at(-1)===active.type){if(!active.props[p.name])active.props[p.name]=[];active.props[p.name].push(p);}
 }
 if(stack.length||calendars!==1)throw new Error('El archivo iCalendar está incompleto.');
 if(!parts.length)throw new Error('El calendario no tiene eventos VEVENT ni tareas VTODO.');
 return {format:'ics',columns:[],records:parts.map(p=>todoImportICSRecord(p,method)),warnings:['Se importan títulos, fechas, prioridad y estado. No se importan horarios, alarmas, asistentes, organizadores, enlaces ni adjuntos.']};
}
function parseTodoImport(text,format){
 const source=todoImportInput(text);if(format==='csv')return todoImportParseCSV(source);if(format==='ics')return todoImportParseICS(source);throw new Error('Selecciona un archivo CSV o iCalendar (.ics).');
}
function todoImportNormal(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim().replace(/\s+/g,' ');}
function mapTodoImport(parsed,mapping={},options={}){
 if(!parsed||!['csv','ics'].includes(parsed.format)||!Array.isArray(parsed.records)||parsed.records.length>MAX_TODO_IMPORT_ROWS)throw new Error('La vista previa de importación no es válida.');
 return parsed.records.map((row,index)=>{
  let c;
  if(parsed.format==='ics')c={title:row.title,due:row.due,priority:row.priority,done:row.done,completedAt:row.completedAt,privateNotes:options.includeNotes===true?row.privateNotes:'',sourceKey:row.sourceKey,warnings:[...(row.warnings||[])],issues:[...(row.issues||[])],skip:row.skip===true,index};
  else{
   if(!Array.isArray(row.cells))throw new Error('Fila CSV inválida.');
   const value=key=>{const raw=mapping[key],i=typeof raw==='number'?raw:typeof raw==='string'&&/^\d+$/.test(raw)?+raw:-1;return Number.isInteger(i)&&i>=0&&i<row.cells.length?row.cells[i]:'';},warnings=[],issues=[];
   if(row.cells.length!==parsed.columns.length)issues.push('La fila '+row.row+' no coincide con el número de columnas del encabezado.');
   const rawTitle=value('title'),d=todoImportDate(value('due'),options.dateOrder,warnings);if(d.issue)issues.push(d.issue);
   const p=todoImportNormal(value('priority'));let priority='media';if(p){if(['alta','high','urgent','urgente','1'].includes(p))priority='alta';else if(['media','medium','normal','2'].includes(p))priority='media';else if(['baja','low','3'].includes(p))priority='baja';else issues.push('Prioridad no reconocida. Usa alta, media o baja, o deja esa columna sin importar.');}
   const status=todoImportNormal(value('status'));let done=false;if(status){if(['true','1','yes','si','done','completed','complete','hecho','hecha','terminado','terminada','finalizado','finalizada','completado','completada','✔','✓','checked'].includes(status))done=true;else if(!['false','0','no','todo','to do','pending','pendiente','por hacer','por trabajar','not started','en proceso','en-proceso','in progress','in-progress','needs-action','unchecked'].includes(status))issues.push('Estado no reconocido. Usa pendiente o completada, o deja esa columna sin importar.');}
   if(done)warnings.push('La tarea se marca terminada; se registrará hoy como fecha de cierre.');
   c={title:rawTitle.trim(),due:d.value,priority,done,completedAt:done?today():'',privateNotes:options.includeNotes===true?value('notes'):'',sourceKey:todoImportFingerprint('csv',JSON.stringify(row.cells)),warnings,issues,skip:false,index,row:row.row};
  }
  if(typeof c.title!=='string'||!c.title.trim())c.issues.push('La tarea necesita un título. Elige una columna de título o corrige el archivo.');
  for(const [key,label] of [['title','El título'],['privateNotes','La nota']])if(typeof c[key]!=='string'||c[key].length>16000)c.issues.push(label+' supera el límite de 16 000 caracteres o no es texto.');
  return c;
 });
}
function todoImportEquivalent(c){return String(c.title||'').normalize('NFKC').toLocaleLowerCase('es').trim().replace(/\s+/g,' ')+'\n'+c.due;}
function todoImportDuplicates(state,candidates){
 if(!state||!Array.isArray(state.todos)||!Array.isArray(candidates))throw new Error('No se puede comparar la importación con las tareas actuales.');
 const keys=new Set(state.todos.map(t=>t.importKey).filter(Boolean)),equiv=new Set(state.todos.map(todoImportEquivalent)),duplicates=[];
 for(const c of candidates){if(c.skip||c.issues?.length)continue;const key=c.sourceKey,eq=todoImportEquivalent(c);if(key&&keys.has(key)||equiv.has(eq))duplicates.push(c.index);else{if(key)keys.add(key);equiv.add(eq);}}
 return duplicates;
}
function mergeTodoImport(state,candidates,selectedIndices){
 if(!Array.isArray(candidates)||candidates.length>MAX_TODO_IMPORT_ROWS||!Array.isArray(selectedIndices)||selectedIndices.length>MAX_TODO_IMPORT_ROWS)throw new Error('Selecciona hasta 1000 tareas de una vista previa válida.');
 const selected=new Set(selectedIndices);if(selected.size!==selectedIndices.length||selectedIndices.some(i=>!Number.isInteger(i)))throw new Error('La selección de tareas no es válida.');
 const byIndex=new Map(candidates.map(c=>[c.index,c]));if(byIndex.size!==candidates.length||selectedIndices.some(i=>!byIndex.has(i)))throw new Error('La selección no coincide con la vista previa.');
 const next=clone(state),keys=new Set(next.todos.map(t=>t.importKey).filter(Boolean)),equiv=new Set(next.todos.map(todoImportEquivalent));let added=0,duplicates=0;
 for(const index of selectedIndices){const c=byIndex.get(index);if(c.skip||!Array.isArray(c.issues)||c.issues.length)throw new Error('Hay tareas seleccionadas con errores. Corrige el archivo antes de importarlas.');
  if(typeof c.sourceKey!=='string'||! /^(csv|ics)-[a-z0-9-]{1,70}$/.test(c.sourceKey))throw new Error('El origen de una tarea importada no es válido.');
  const eq=todoImportEquivalent(c);if(keys.has(c.sourceKey)||equiv.has(eq)){duplicates++;continue;}
  next.todos.push({id:uid(),title:c.title,date:today(),due:c.due,priority:c.priority,done:c.done,completedAt:c.completedAt,actionId:'',milestoneId:'',privateNotes:c.privateNotes,importKey:c.sourceKey});keys.add(c.sourceKey);equiv.add(eq);added++;
 }
 if(next.todos.length>3000)throw new Error('La importación supera el límite de 3000 tareas. No se guardó ningún cambio.');
 return {state:validate(next),added,duplicates};
}

global.CompasCore={MAX_TODO_IMPORT_BYTES,MAX_TODO_IMPORT_ROWS,parseTodoImport,mapTodoImport,todoImportDuplicates,mergeTodoImport,MAX_BACKUP_BYTES,ROUTE_VERSION,LEVELS,ROUTE_STATES,REVIEWS,ROUTES,MILESTONES,milestone,routeDefault,routeAt,saveRoute,setTodoDone,removeRecord,FOOTER,STATES,DISPOSITIONS,CATEGORIES,uid,today,shift,esc,fmt,clone,blank,demo,validate,backup,restore,makeShare,reportHTML,excelBytes};
})(globalThis);
