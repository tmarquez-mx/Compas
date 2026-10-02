const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');

// Run real UI functions against the shipped core/controller. Only browser I/O
// (DOM, prompts and download delivery) is stubbed. No personal storage is read.
const htmlPath=process.argv[2]||path.resolve(__dirname,'../dist/index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const core=html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1];
const ui=html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1];
function statementAt(index,label){
 assert(index>=0,'Falta el código real de UI: '+label);
 const lines=ui.slice(index).split('\n');let source='';
 for(const line of lines){source+=line+'\n';try{new vm.Script(source);return source;}catch(err){if(!(err instanceof SyntaxError))throw err;}}
 throw new Error('No se pudo extraer '+label);
}
function realFunction(name){
 const match=new RegExp('^(?:async )?function '+name+'\\(','m').exec(ui);
 assert(match,'Falta la función real de UI: '+name);
 return statementAt(match.index,name);
}
const functions=['stateStamp','saveMessage','saveInfo','updateEditControls','workspaceNotice','ensureEditable','saveWorkspace','persist','mutate','backup','confirmBackup','replaceState','acquireEditing','releaseEditing','recoveryDialog','btn'].map(realFunction).join('\n');
const metadataStartup=statementAt(ui.indexOf('try{const raw=localStore?.getItem(BACKUP_META_KEY)'),'lectura de metadata de respaldo');
let count=0;
function check(label,fn){fn();count++;console.log('OK '+label);}
function storage(initial={}){
 const values=new Map(Object.entries(initial)),writes=[];
 return {values,writes,failKeys:new Set(),getItem(key){return values.get(key)??null;},
  setItem(key,value){writes.push(key);if(this.failKeys.has(key))throw new Error('Cuota agotada');values.set(key,String(value));},removeItem(key){values.delete(key);}};
}
function harness({mode='owner',raw,dirty=true,storeInput}={}){
 const nodes=new Map(),messages=[],downloads=[],renders=[],prompts=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,hidden:true,innerHTML:'',textContent:'',closed:false,open:false,classList:{remove(){}},close(){this.closed=true;this.open=false;},showModal(){this.open=true;}});return nodes.get(id);};
 const context={TextEncoder,TextDecoder,Uint8Array,DataView,Date,Math,Set,Map,JSON,Intl,console};vm.createContext(context);vm.runInContext(core,context);
 const C=context.CompasCore;assert.equal(typeof context.CompasStorage?.startStorage,'function');
 const original=C.demo();original.isDemo=false;original.project.title='Bitácora ficticia para pruebas de UI';
 const KEY='compas-test-runtime',BACKUP_META_KEY='compas-test-backup-meta',localStore=storeInput||storage({[KEY]:raw===undefined?C.backup(original):raw});
 Object.assign(context,{C,e:C.esc,$:node,KEY,BACKUP_META_KEY,VERSION:'prueba',localStore,localStorage:localStore,
  state:original,dirty,storageAvailable:mode==='owner',writeMode:mode,saveStatus:'saved',saveWarning:'',previewShare:null,backupMeta:null,pendingBackup:null,recoveryDraft:null,
  lockRequestPending:false,releaseEditLock:null,navigator:{},document:{activeElement:null,querySelectorAll(){return [];},querySelector(){return null;}},dialogTrigger:null,
  reportOptions:null,actionFilter:'todos',routeLevel:'',routeSemester:'',todoFilter:'pendientes',confirmAnswer:true,
  render(){renders.push(true);},navigate(view){context.view=view;},toast(message,undo){messages.push({message,undo});},
  download(content,name,type){if(context.failDownload)throw new Error('Descarga bloqueada');downloads.push({content,name,type});},
  confirm(message){prompts.push(message);return context.confirmAnswer;}});
 context.workspace=context.CompasStorage.startStorage({storage:localStore,key:KEY,core:C,canWrite:()=>context.writeMode==='owner'});
 const opened=context.workspace.open();if(opened.state)context.state=opened.state;else if(opened.status==='corrupt'){context.saveStatus='corrupt';context.storageAvailable=false;}
 vm.runInContext(functions,context);
 return {context,C,localStore,node,messages,downloads,prompts,renders,run:code=>vm.runInContext(code,context)};
}

check('Preparar una descarga no confirma el respaldo ni limpia los cambios pendientes',()=>{
 const h=harness(),before=h.context.state;h.run('backup()');
 assert.equal(h.downloads.length,1);assert.equal(h.context.dirty,true);assert.equal(h.context.backupMeta,null);assert(h.context.pendingBackup);
 assert.equal(h.localStore.getItem(h.context.BACKUP_META_KEY),null);assert.equal(JSON.stringify(h.C.restore(h.downloads[0].content)),JSON.stringify(h.C.validate(before)));
 assert(h.node('workspace-notice').innerHTML.includes('Ya guardé el archivo'));
});
check('Confirmar explícitamente el respaldo actual limpia dirty y registra confirmed',()=>{
 const h=harness();h.run('backup()');assert.equal(h.run('confirmBackup()'),true);assert.equal(h.context.dirty,false);assert.equal(h.context.pendingBackup,null);
 const metadata=JSON.parse(h.localStore.getItem(h.context.BACKUP_META_KEY));assert.equal(metadata.confirmed,true);assert.equal(metadata.projectId,h.context.state.project.id);assert.equal(metadata.stamp,h.run('stateStamp()'));
});
check('Confirmar sin haber preparado respaldo no modifica el estado',()=>{
 const h=harness();assert.equal(h.run('confirmBackup()'),false);assert.equal(h.context.dirty,true);assert.equal(h.localStore.getItem(h.context.BACKUP_META_KEY),null);
});
check('La metadata antigua sin confirmación no declara respaldados los cambios',()=>{
 const h=harness(),metadata={projectId:h.context.state.project.id,stamp:h.run('stateStamp()'),at:new Date().toISOString()};h.localStore.values.set(h.context.BACKUP_META_KEY,JSON.stringify(metadata));
 h.run(metadataStartup);assert.equal(h.context.dirty,true);assert.equal(h.context.backupMeta,null);
});
check('La metadata confirmada del estado actual se reconoce al reabrir',()=>{
 const h=harness(),metadata={projectId:h.context.state.project.id,stamp:h.run('stateStamp()'),at:new Date().toISOString(),confirmed:true};h.localStore.values.set(h.context.BACKUP_META_KEY,JSON.stringify(metadata));
 h.run(metadataStartup);assert.equal(h.context.dirty,false);assert.equal(h.context.backupMeta.confirmed,true);
});
check('Una confirmación pendiente queda obsoleta al añadir nuevos cambios',()=>{
 const h=harness();h.run('backup()');assert.equal(h.run("mutate(s=>s.project.question='Pregunta ficticia posterior')"),true);
 assert.equal(h.run('confirmBackup()'),false);assert.equal(h.context.dirty,true);assert.equal(h.context.backupMeta,null);assert.equal(h.localStore.getItem(h.context.BACKUP_META_KEY),null);
 assert(h.messages.some(x=>/cambios posteriores/i.test(x.message)));
});
check('Una confirmación de otro proyecto no valida el respaldo de la bitácora actual',()=>{
 const h=harness();h.run('backup()');h.context.state=h.C.blank();h.context.dirty=true;
 assert.equal(h.run('confirmBackup()'),false);assert.equal(h.context.dirty,true);assert.equal(h.context.backupMeta,null);assert.equal(h.localStore.getItem(h.context.BACKUP_META_KEY),null);
});
check('Una descarga que falla no crea confirmación ni metadata de respaldo',()=>{
 const h=harness();h.context.failDownload=true;h.run('backup()');assert.equal(h.context.dirty,true);assert.equal(h.context.pendingBackup,null);assert.equal(h.context.backupMeta,null);assert.equal(h.downloads.length,0);
 assert(h.messages.some(x=>/no se pudo preparar/i.test(x.message)));
});
check('El guardado en modo temporal se comunica como sesión y deja intacta la copia durable',()=>{
 const h=harness({mode:'session'}),before=h.localStore.getItem(h.context.KEY);assert.equal(h.run("mutate(s=>s.project.title='Edición temporal ficticia')"),true);
 assert.equal(h.context.state.project.title,'Edición temporal ficticia');assert.equal(h.context.storageAvailable,false);assert.equal(h.context.saveStatus,'temporary');assert.equal(h.context.dirty,true);assert.equal(h.localStore.getItem(h.context.KEY),before);
 assert.match(h.run("saveMessage('Tarea preparada.')"),/solo en esta sesión/);assert.match(h.node('workspace-notice').innerHTML,/modo temporal/);
});
check('El guardado durable no presenta el mensaje de sesión temporal',()=>{
 const h=harness();assert.equal(h.run("mutate(s=>s.project.title='Edición durable ficticia')"),true);assert.equal(h.context.storageAvailable,true);assert.equal(h.context.saveStatus,'saved');
 assert.equal(h.C.restore(h.localStore.getItem(h.context.KEY)).project.title,'Edición durable ficticia');assert.equal(h.run("saveMessage('Tarea guardada.')"),'Tarea guardada.');
});
check('Una cuota agotada no convierte una operación fallida en guardado durable',()=>{
 const h=harness(),before=h.localStore.getItem(h.context.KEY),beforeState=JSON.stringify(h.context.state);h.localStore.failKeys.add(h.context.KEY);
 assert.equal(h.run("mutate(s=>s.project.title='Cambio ficticio que falla')"),false);assert.equal(h.localStore.getItem(h.context.KEY),before);assert.equal(JSON.stringify(h.context.state),beforeState);assert.equal(h.context.saveStatus,'error');
 assert(h.messages.some(x=>/no se pudo guardar|no se guardó/i.test(x.message)));
});
check('Pestañas de consulta o pendientes no ejecutan ni guardan mutaciones',()=>{
 for(const mode of ['readonly','pending']){const h=harness({mode}),before=h.localStore.getItem(h.context.KEY);h.context.callbackRan=false;
  assert.equal(h.run("mutate(s=>{callbackRan=true;s.project.title='No debe ocurrir';})"),false);assert.equal(h.context.callbackRan,false);assert.equal(h.localStore.getItem(h.context.KEY),before);assert.equal(h.localStore.writes.length,0);
 }
});
check('Cancelar reemplazo con cambios pendientes conserva datos y copia durable',()=>{
 const h=harness(),before=JSON.stringify(h.context.state),raw=h.localStore.getItem(h.context.KEY);h.context.confirmAnswer=false;h.context.next=h.C.blank();
 assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),false);assert.equal(JSON.stringify(h.context.state),before);assert.equal(h.localStore.getItem(h.context.KEY),raw);assert.equal(h.prompts.length,1);assert.equal(h.node('editor').closed,false);
});
check('Reemplazar proyecto conserva todos los datos de la bitácora anterior para recuperar',()=>{
 const h=harness(),before=h.C.validate(h.context.state);h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);
 assert.equal(h.context.state.project.id,h.context.next.project.id);assert.equal(JSON.stringify(h.context.workspace.getRecovery().state),JSON.stringify(before));assert.equal(h.node('editor').closed,true);
});
check('Un reemplazo cuyo guardado falla no cambia la bitácora activa',()=>{
 const h=harness(),before=JSON.stringify(h.context.state),raw=h.localStore.getItem(h.context.KEY);h.localStore.failKeys.add(h.context.KEY);h.context.next=h.C.blank();
 assert.equal(h.run("replaceState(next,'No debe reemplazar')"),false);assert.equal(JSON.stringify(h.context.state),before);assert.equal(h.localStore.getItem(h.context.KEY),raw);assert.equal(h.node('editor').closed,false);
});
check('Recuperar desde la interfaz intercambia las bitácoras sin perder la que estaba activa',()=>{
 const h=harness(),original=h.C.validate(h.context.state);h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);
 const active=h.C.validate(h.context.state);h.run('recoveryDialog()');h.context.selected=h.context.recoveryDraft.recovery;
 assert.equal(h.run("replaceState(selected.state,'Copia recuperada',{recoveryRaw:selected.raw})"),true);
 assert.equal(JSON.stringify(h.context.state),JSON.stringify(original));assert.equal(JSON.stringify(h.context.workspace.getRecovery().state),JSON.stringify(active));
 assert.equal(h.context.storageAvailable,true);assert.equal(h.context.dirty,true);assert.equal(h.node('editor').closed,true);
 assert.match(ui,/recoveryRaw:b\.dataset\.kind==='recovery'\?r\.raw:null/);
});
check('Una recuperación que cambió desde la vista no reemplaza la bitácora activa',()=>{
 const h=harness();h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);h.run('recoveryDialog()');h.context.selected=h.context.recoveryDraft.recovery;
 const active=JSON.stringify(h.context.state),raw=h.localStore.getItem(h.context.KEY);h.localStore.removeItem(h.context.workspace.keys.recovery);
 assert.equal(h.run("replaceState(selected.state,'No debe recuperar',{recoveryRaw:selected.raw})"),false);assert.equal(JSON.stringify(h.context.state),active);assert.equal(h.localStore.getItem(h.context.KEY),raw);assert.equal(h.node('editor').open,true);
 assert(h.messages.some(x=>/copia de recuperación cambió/i.test(x.message)));
});
check('Cancelar una recuperación conserva ambas copias',()=>{
 const h=harness();h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);h.run('recoveryDialog()');h.context.selected=h.context.recoveryDraft.recovery;h.context.confirmAnswer=false;
 const active=h.localStore.getItem(h.context.KEY),recovery=h.localStore.getItem(h.context.workspace.keys.recovery);
 assert.equal(h.run("replaceState(selected.state,'No debe recuperar',{recoveryRaw:selected.raw})"),false);assert.equal(h.localStore.getItem(h.context.KEY),active);assert.equal(h.localStore.getItem(h.context.workspace.keys.recovery),recovery);
});
check('El diario indica cómo liberar una recuperación ocupada antes de ofrecer sustituirla',()=>{
 const h=harness();h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);h.run('recoveryDialog()');
 assert(h.context.recoveryDraft.journal);assert.match(h.node('editor').innerHTML,/descarga y libera primero la copia anterior conservada/);
 assert(!h.node('editor').innerHTML.includes('data-do="recovery-restore" data-kind="journal"'));
 assert(h.node('editor').innerHTML.includes('data-do="recovery-restore" data-kind="recovery"'));
});
check('La recuperación en una pestaña de consulta solo permite descargar las copias',()=>{
 const h=harness();h.context.next=h.C.blank();assert.equal(h.run("replaceState(next,'Nueva bitácora ficticia')"),true);h.context.writeMode='readonly';h.run('recoveryDialog()');
 assert.match(h.node('editor').innerHTML,/data-do="recovery-restore" data-kind="recovery" disabled/);assert.match(h.node('editor').innerHTML,/data-do="recovery-release" disabled/);
 assert.match(h.node('editor').innerHTML,/data-do="recovery-download" data-kind="recovery"/);
});
check('La copia corrupta no se sobrescribe al intentar editar el ejemplo',()=>{
 const corrupt='{contenido_ficticio_dañado',h=harness({raw:corrupt});assert.equal(h.run("mutate(s=>s.project.title='Edición bloqueada')"),false);assert.equal(h.localStore.getItem(h.context.KEY),corrupt);assert.equal(h.context.saveStatus,'corrupt');
});
check('Recuperación ofrece descargar el texto dañado antes de autorizar un reemplazo',()=>{
 const corrupt='{copia_ficticia_dañada_sin_reemplazar',h=harness({raw:corrupt}),writes=h.localStore.writes.length;h.run('recoveryDialog()');
 assert.equal(h.context.recoveryDraft.damaged.raw,corrupt);assert.match(h.node('editor').innerHTML,/data-kind="damaged"/);assert.match(h.node('editor').innerHTML,/Descargar copia/);
 assert.equal(h.localStore.getItem(h.context.KEY),corrupt);assert.equal(h.localStore.writes.length,writes);assert.equal(h.node('editor').open,true);
});
check('Cambiar otro campo no modifica fechas académicas ni fechas previstas de tareas',()=>{
 const h=harness(),dates=JSON.stringify({sessions:h.context.state.sessions.map(x=>[x.date,x.nextDate]),todos:h.context.state.todos.map(x=>[x.date,x.due,x.completedAt]),actions:h.context.state.actions.map(x=>[x.date,x.updatedAt,x.due])});
 assert.equal(h.run("mutate(s=>s.project.title='Solo cambia el título ficticio')"),true);h.run('backup()');
 const reopened=h.C.restore(h.downloads[0].content);assert.equal(JSON.stringify({sessions:reopened.sessions.map(x=>[x.date,x.nextDate]),todos:reopened.todos.map(x=>[x.date,x.due,x.completedAt]),actions:reopened.actions.map(x=>[x.date,x.updatedAt,x.due])}),dates);
});

check('La consulta deshabilita los controles de edición y los restablece al obtener permiso',()=>{
 const h=harness({mode:'readonly'}),buttons=['project','todo-edit','new'].map(action=>({dataset:{do:action},disabled:false})),checkbox={disabled:false},open={disabled:false};
 h.context.document.querySelectorAll=selector=>selector==='#main [data-do]'?buttons:selector==='[data-todo-check]'?[checkbox]:[];
 h.context.document.querySelector=()=>open;
 h.run('updateEditControls()');assert(buttons.every(b=>b.disabled));assert(checkbox.disabled);assert(open.disabled);
 h.context.writeMode='owner';h.run('updateEditControls()');assert(buttons.every(b=>!b.disabled));assert(!checkbox.disabled);assert(!open.disabled);
});
check('Una copia corrupta permite abrir respaldo o empezar de nuevo, sin habilitar ediciones del ejemplo',()=>{
 const h=harness({raw:'{copia_ficticia_corrupta'}),buttons=['project','todo-edit','new','demo'].map(action=>({dataset:{do:action},disabled:false})),checkbox={disabled:false},open={disabled:false};
 h.context.document.querySelectorAll=selector=>selector==='#main [data-do]'?buttons:selector==='[data-todo-check]'?[checkbox]:[];h.context.document.querySelector=()=>open;
 h.run('updateEditControls()');assert(buttons.find(b=>b.dataset.do==='project').disabled);assert(buttons.find(b=>b.dataset.do==='todo-edit').disabled);assert(!buttons.find(b=>b.dataset.do==='new').disabled);assert(!buttons.find(b=>b.dataset.do==='demo').disabled);assert(checkbox.disabled);assert(!open.disabled);
});
check('Un Deshacer pendiente no puede modificar otra bitácora',()=>{
 const h=harness(),container=h.node('toast');container.children=[];container.append=button=>container.children.push(button);h.context.document.createElement=()=>({});h.context.setTimeout=()=>1;h.context.clearTimeout=()=>{};h.context.toastTimer=null;h.context.undoRan=false;
 h.run(realFunction('toast'));h.run("toast('Cambio ficticio',()=>{undoRan=true;})");const button=container.children[0];h.context.state=h.C.blank();button.onclick();assert.equal(h.context.undoRan,false);assert.match(container.textContent,/otra bitácora/);
});

// This manager models the external Web Locks service only. It does not set
// any UI mode or reload state: those decisions run in acquireEditing itself.
function exclusiveLocks(){
 const held=new Map(),requests=[];
 return {requests,held,request(name,options,callback){
  requests.push({name,options});assert.equal(options.mode,'exclusive');assert.equal(options.ifAvailable,true);
  if(held.has(name))return Promise.resolve(callback(null));
  const lock={name,mode:'exclusive'};held.set(name,lock);
  return Promise.resolve(callback(lock)).finally(()=>{if(held.get(name)===lock)held.delete(name);});
 }};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function asyncCheck(label,fn){await fn();count++;console.log('OK '+label);}
(async()=>{
 await asyncCheck('Dos pestañas solicitan el mismo lock; la segunda queda en consulta y adopta el último guardado al reintentar',async()=>{
  const first=harness({mode:'pending'}),second=harness({mode:'pending',storeInput:first.localStore}),locks=exclusiveLocks();first.context.navigator={locks};second.context.navigator={locks};
  first.run('acquireEditing()');await settle();second.run('acquireEditing()');await settle();
  assert.equal(first.context.writeMode,'owner');assert.equal(second.context.writeMode,'readonly');assert.equal(locks.requests[0].name,locks.requests[1].name);assert.equal(locks.held.size,1);
  assert.equal(first.run("mutate(s=>s.project.title='Último cambio ficticio de la pestaña dueña')"),true);assert.notEqual(second.context.state.project.title,first.context.state.project.title);
  assert.equal(second.run("mutate(s=>s.project.title='No debe sobrescribir')"),false);first.run('releaseEditing()');await settle();assert.equal(locks.held.size,0);
  second.run('acquireEditing(true)');await settle();assert.equal(second.context.writeMode,'owner');assert.equal(second.context.state.project.title,'Último cambio ficticio de la pestaña dueña');
  assert.equal(second.run("mutate(s=>s.project.question='Pregunta tras adoptar la copia')"),true);assert.equal(first.C.restore(first.localStore.getItem(first.context.KEY)).project.title,'Último cambio ficticio de la pestaña dueña');
  second.run('releaseEditing()');await settle();assert.equal(locks.held.size,0);
 });
 await asyncCheck('Sin Web Locks la interfaz adopta modo temporal y nunca escribe la copia principal',async()=>{
  const h=harness({mode:'pending'}),before=h.localStore.getItem(h.context.KEY);h.run('acquireEditing()');await settle();assert.equal(h.context.writeMode,'session');
  assert.equal(h.run("mutate(s=>s.project.title='Sesión ficticia sin Web Locks')"),true);assert.equal(h.context.storageAvailable,false);assert.equal(h.localStore.getItem(h.context.KEY),before);assert.match(h.run("saveMessage('Cambio preparado.')"),/solo en esta sesión/);
 });
 console.log(count+' comprobaciones del runtime de UI pasaron.');
})().catch(err=>{console.error(err);process.exitCode=1;});
