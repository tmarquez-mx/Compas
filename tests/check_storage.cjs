const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');

// Evaluate the shipped code, with storage supplied by this harness. Every
// project and backup in these checks is fictitious; no browser data is read.
const htmlPath=process.argv[2]||path.resolve(__dirname,'../dist/index.html');
const html=fs.readFileSync(htmlPath,'utf8');
const core=html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1];
const sandbox={TextEncoder,TextDecoder,Uint8Array,DataView,Date,Math,Set,Map,JSON,Intl,console};
vm.createContext(sandbox);vm.runInContext(core,sandbox);
if(process.argv[3])vm.runInContext(fs.readFileSync(process.argv[3],'utf8'),sandbox);
const C=sandbox.CompasCore,S=sandbox.CompasStorage;
assert.equal(typeof S?.startStorage,'function','El artefacto debe incluir CompasStorage.');
const KEY='compas-test-workspace',RECOVERY=KEY+'-recovery-v1',JOURNAL=KEY+'-journal-v1',PENDING=KEY+'-pending-v1';
let count=0;
function check(label,fn){fn();count++;console.log('OK '+label);}
function store(initial={}){
 const values=new Map(Object.entries(initial)),writes=[];
 return {values,writes,failRead:false,failKeys:new Set(),
  getItem(key){if(this.failRead)throw new Error('Lectura no disponible');return values.has(key)?values.get(key):null;},
  setItem(key,value){writes.push(key);if(this.failKeys.has(key))throw new Error('Cuota o acceso denegado');values.set(key,String(value));},
  removeItem(key){values.delete(key);}};
}
function project(title){const state=C.demo();state.isDemo=false;state.project.title=title;return state;}
function controller(storage,canWrite=()=>true){return S.startStorage({storage,key:KEY,core:C,canWrite});}
const original=project('Proyecto ficticio original'),originalRaw=C.backup(original);

check('Abrir conserva todos los módulos de un respaldo válido',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage),opened=control.open();
 assert.equal(opened.status,'ready');assert.equal(JSON.stringify(opened.state),JSON.stringify(C.validate(original)));assert.equal(storage.writes.length,0);
});
check('Guardar un cambio durable se puede reabrir íntegro',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();
 const next=C.clone(original);next.project.question='Pregunta ficticia revisada';const result=control.save(next);
 assert.equal(result.ok,true);assert.equal(result.persisted,true);assert.equal(C.restore(storage.getItem(KEY)).project.question,next.project.question);
 assert.equal(JSON.stringify(controller(storage).open().state),JSON.stringify(C.validate(next)));
});
check('Una pestaña obsoleta no sobrescribe cambios de otra pestaña',()=>{
 const storage=store({[KEY]:originalRaw}),a=controller(storage),b=controller(storage);a.open();b.open();
 const first=C.clone(original);first.project.title='Cambio ficticio de A';assert.equal(a.save(first).persisted,true);
 const rawAfterA=storage.getItem(KEY),second=C.clone(original);second.project.question='Cambio ficticio de B';const result=b.save(second);
 assert.equal(result.ok,false);assert.equal(result.status,'conflict');assert.equal(storage.getItem(KEY),rawAfterA);
 assert.equal(C.restore(storage.getItem(KEY)).project.title,first.project.title);
});
check('Recargar tras un conflicto requiere adopción explícita de la copia guardada',()=>{
 const storage=store({[KEY]:originalRaw}),a=controller(storage),b=controller(storage);a.open();b.open();
 const first=C.clone(original);first.project.title='Primera edición ficticia';a.save(first);
 const stale=C.clone(original);stale.project.title='Edición obsoleta';assert.equal(b.save(stale).ok,false);
 assert.equal(b.reload().state.project.title,first.project.title);
 const adopted=C.clone(b.read().state);adopted.project.question='Cambio después de adoptar';assert.equal(b.save(adopted).persisted,true);
 assert.equal(C.restore(storage.getItem(KEY)).project.title,first.project.title);
});
check('Una sesión sin permiso de escritura nunca modifica la copia durable',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage,()=>false);control.open();
 const next=C.clone(original);next.project.title='Edición solo en memoria';const result=control.save(next);
 assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),originalRaw);assert(!storage.writes.includes(KEY));
});
check('Cambiar el permiso de escritura a mitad de sesión evita una escritura tardía',()=>{
 let allowed=true;const storage=store({[KEY]:originalRaw}),control=controller(storage,()=>allowed);control.open();allowed=false;
 const next=C.clone(original);next.project.title='Edición tardía ficticia';const result=control.save(next);
 assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),originalRaw);assert(!storage.writes.includes(KEY));
});
check('Una copia corrupta queda intacta y no admite un guardado ordinario',()=>{
 const corrupt='{bitacora_ficticia_incompleta',storage=store({[KEY]:corrupt}),control=controller(storage),opened=control.open();
 assert.equal(opened.status,'corrupt');assert.equal(control.save(project('Otra bitácora ficticia')).ok,false);assert.equal(storage.getItem(KEY),corrupt);
});
check('Resolver una copia corrupta conserva el texto original para recuperación',()=>{
 const corrupt='{copia_ficticia_recuperable',storage=store({[KEY]:corrupt}),control=controller(storage);control.open();
 const next=project('Bitácora recuperada ficticia'),result=control.resolve(next);
 assert.equal(result.ok,true);assert.equal(result.persisted,true);assert.equal(C.restore(storage.getItem(KEY)).project.title,next.project.title);
 assert(JSON.stringify(control.getRecovery()).includes('copia_ficticia_recuperable'));assert(storage.getItem(RECOVERY));
});
check('Reemplazar proyecto conserva la bitácora anterior completa',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const next=project('Proyecto sustituto ficticio');
 const result=control.replace(next);assert.equal(result.persisted,true);assert.equal(C.restore(storage.getItem(KEY)).project.id,next.project.id);
 const recovery=JSON.stringify(control.getRecovery());assert(recovery.includes(original.project.title));assert(recovery.includes(original.sessions[0].title));
 assert(recovery.includes(original.todos[0].title));assert(recovery.includes(original.project.privateNotes));
});
check('El diario conserva el estado anterior y la copia principal contiene el cambio',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const next=C.clone(original);next.project.title='Proyecto ficticio después';
 assert.equal(control.save(next).persisted,true);const journal=JSON.stringify(control.getJournal());assert(journal.includes(original.project.title));assert.equal(C.restore(storage.getItem(KEY)).project.title,next.project.title);assert(storage.getItem(JOURNAL));
});
check('Si falla conservar la recuperación, reemplazar no destruye la copia anterior',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();storage.failKeys.add(RECOVERY);
 const result=control.replace(project('Reemplazo que no debe ocurrir'));assert.equal(result.ok,false);assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),originalRaw);
});
check('Si falla preparar el diario pendiente, guardar no modifica la copia durable',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();storage.failKeys.add(PENDING);
 const next=C.clone(original);next.project.title='Cambio no durable por cuota';const result=control.save(next);
 assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),originalRaw);
});
check('Si falla finalizar el diario, el cambio durable conserva la copia anterior pendiente',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();storage.failKeys.add(JOURNAL);
 const next=C.clone(original);next.project.title='Cambio durable con diario pendiente';const result=control.save(next);
 assert.equal(result.persisted,true);assert.equal(C.restore(storage.getItem(KEY)).project.title,next.project.title);
 assert.equal(control.getJournal().pending,true);assert.equal(control.getJournal().raw,originalRaw);
 const later=C.clone(next);later.project.title='Cambio que debe esperar al diario';const unchanged=storage.getItem(KEY);
 assert.equal(control.save(later).ok,false);assert.equal(storage.getItem(KEY),unchanged);assert.equal(control.getJournal().raw,originalRaw);
});
check('Si falla escribir la copia principal, el último respaldo durable permanece intacto',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();storage.failKeys.add(KEY);
 const next=C.clone(original);next.project.title='Cambio no durable por cuota principal';const result=control.save(next);
 assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),originalRaw);
});
check('Un segundo guardado fallido conserva ambos checkpoints y permite reintentar',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const first=C.clone(original);first.project.title='Primer cambio durable ficticio';assert.equal(control.save(first).persisted,true);
 const firstRaw=storage.getItem(KEY),journalRaw=storage.getItem(JOURNAL),second=C.clone(first);second.project.title='Segundo cambio ficticio';storage.failKeys.add(KEY);
 assert.equal(control.save(second).persisted,false);assert.equal(storage.getItem(KEY),firstRaw);assert.equal(storage.getItem(JOURNAL),journalRaw);assert.equal(control.getJournal().raw,firstRaw);
 storage.failKeys.delete(KEY);assert.equal(control.save(second).persisted,true);assert.equal(C.restore(storage.getItem(KEY)).project.title,second.project.title);assert.equal(control.getJournal().raw,firstRaw);assert.equal(control.getJournal().pending,false);
});
check('Guardar por error otro proyecto también conserva la bitácora anterior',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const different=project('Otro proyecto ficticio enviado a save');assert.notEqual(different.project.id,original.project.id);
 const result=control.save(different);assert.equal(result.persisted,true);assert.equal(control.getRecovery().raw,originalRaw);assert.equal(C.restore(storage.getItem(KEY)).project.id,different.project.id);
});
check('Un estado inválido no llega al almacenamiento',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const next=C.clone(original);next.todos[0].priority='desconocida';
 const writes=storage.writes.length;const result=control.save(next);assert.equal(result.ok,false);assert.equal(storage.writes.length,writes);assert.equal(storage.getItem(KEY),originalRaw);
});
check('Un error al leer se informa sin afirmar que existe guardado durable',()=>{
 const storage=store({[KEY]:originalRaw});storage.failRead=true;const control=controller(storage),opened=control.open();
 assert.notEqual(opened.status,'ready');const result=control.save(project('Sesión sin acceso ficticia'));assert.equal(result.persisted,false);assert(!storage.writes.includes(KEY));
});
check('Una recuperación anterior pendiente no se sustituye por otro proyecto',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();const second=project('Segunda bitácora ficticia');assert.equal(control.replace(second).persisted,true);
 const recovery=storage.getItem(RECOVERY),current=storage.getItem(KEY);assert.equal(control.replace(project('Tercera bitácora ficticia')).ok,false);
 assert.equal(storage.getItem(RECOVERY),recovery);assert.equal(storage.getItem(KEY),current);
});
check('Liberar recuperación exige coincidir con la copia revisada y conserva la copia activa',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();assert.equal(control.replace(project('Bitácora activa ficticia')).persisted,true);
 const current=storage.getItem(KEY);assert.equal(control.releaseRecovery('otra copia').ok,false);assert(storage.getItem(RECOVERY));
 assert.equal(control.releaseRecovery(originalRaw).ok,true);assert.equal(storage.getItem(RECOVERY),null);assert.equal(storage.getItem(KEY),current);
});
check('Recuperar intercambia la copia elegida y la bitácora activa sin vaciar recuperación',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage),second=project('Bitácora activa para intercambio ficticio');
 assert.equal(control.replace(second).persisted,true);const secondRaw=storage.getItem(KEY);
 const result=control.restoreRecovery(originalRaw);assert.equal(result.ok,true);assert.equal(result.persisted,true);
 assert.equal(JSON.stringify(C.restore(storage.getItem(KEY))),JSON.stringify(C.validate(original)));assert.equal(control.getRecovery().raw,secondRaw);assert.equal(control.getJournal().raw,secondRaw);
 assert.equal(control.restoreRecovery(secondRaw).persisted,true);assert.equal(JSON.stringify(C.restore(storage.getItem(KEY))),JSON.stringify(C.validate(second)));
 assert.equal(JSON.stringify(C.restore(control.getRecovery().raw)),JSON.stringify(C.validate(original)));
});
check('Recuperar rechaza otra copia y una pestaña sin permiso de escritura',()=>{
 let allowed=true;const storage=store({[KEY]:originalRaw}),control=controller(storage,()=>allowed);assert.equal(control.replace(project('Copia activa ficticia protegida')).persisted,true);
 const active=storage.getItem(KEY),recovery=storage.getItem(RECOVERY),writes=storage.writes.length;
 assert.equal(control.restoreRecovery('copia distinta').ok,false);allowed=false;const result=control.restoreRecovery(originalRaw);
 assert.equal(result.ok,false);assert.equal(result.persisted,false);assert.equal(storage.writes.length,writes);assert.equal(storage.getItem(KEY),active);assert.equal(storage.getItem(RECOVERY),recovery);
});
check('Recuperar no modifica ninguna copia si falla preparar el diario',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);assert.equal(control.replace(project('Activa antes de fallar diario de recuperación')).persisted,true);
 const active=storage.getItem(KEY),recovery=storage.getItem(RECOVERY);storage.failKeys.add(PENDING);const result=control.restoreRecovery(originalRaw);
 assert.equal(result.ok,false);assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),active);assert.equal(storage.getItem(RECOVERY),recovery);
});
check('Recuperar no retira la copia solicitada si falla escribir la copia principal',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);assert.equal(control.replace(project('Activa antes de fallar commit de recuperación')).persisted,true);
 const active=storage.getItem(KEY),recovery=storage.getItem(RECOVERY);storage.failKeys.add(KEY);const result=control.restoreRecovery(originalRaw);
 assert.equal(result.ok,false);assert.equal(result.persisted,false);assert.equal(storage.getItem(KEY),active);assert.equal(storage.getItem(RECOVERY),recovery);assert.equal(control.getJournal().raw,active);
});
check('Si falla rotar recuperación, la copia recuperada queda guardada y la anterior queda en el diario',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);assert.equal(control.replace(project('Activa antes de fallar rotación')).persisted,true);
 const active=storage.getItem(KEY),recovery=storage.getItem(RECOVERY);storage.failKeys.add(RECOVERY);const result=control.restoreRecovery(originalRaw);
 assert.equal(result.ok,true);assert.equal(result.persisted,true);assert.match(result.message,/rotación/);
 assert.equal(JSON.stringify(C.restore(storage.getItem(KEY))),JSON.stringify(C.validate(original)));assert.equal(storage.getItem(RECOVERY),recovery);assert.equal(control.getJournal().raw,active);
});
check('Si falla finalizar el diario de recuperación, el checkpoint pendiente conserva la copia anterior',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);assert.equal(control.replace(project('Activa antes de fallar finalización de recuperación')).persisted,true);
 const active=storage.getItem(KEY);storage.failKeys.add(JOURNAL);const result=control.restoreRecovery(originalRaw);
 assert.equal(result.ok,true);assert.equal(result.persisted,true);assert.equal(control.getRecovery().raw,active);assert.equal(control.getJournal().raw,active);assert.equal(control.getJournal().pending,true);
 assert.equal(JSON.stringify(C.restore(storage.getItem(KEY))),JSON.stringify(C.validate(original)));
});
check('Recuperar una copia válida conserva también una copia activa dañada',()=>{
 const damaged='{copia_activa_ficticia_dañada',storedRecovery=JSON.stringify({format:'compas-local-recovery',version:1,at:new Date().toISOString(),reason:'replace',raw:originalRaw});
 const storage=store({[KEY]:damaged,[RECOVERY]:storedRecovery}),control=controller(storage);assert.equal(control.open().status,'corrupt');
 const result=control.restoreRecovery(originalRaw);assert.equal(result.persisted,true);assert.equal(control.getRecovery().raw,damaged);assert.equal(control.getJournal().raw,damaged);
 assert.equal(JSON.stringify(C.restore(storage.getItem(KEY))),JSON.stringify(C.validate(original)));
});
check('Una copia de recuperación cambiada antes del commit no reemplaza la copia activa',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);assert.equal(control.replace(project('Activa ante cambio externo de recuperación')).persisted,true);
 const active=storage.getItem(KEY),get=storage.getItem.bind(storage);let reads=0;
 storage.getItem=k=>{if(k===RECOVERY&&++reads===2)storage.values.set(RECOVERY,JSON.stringify({format:'compas-local-recovery',version:1,at:new Date().toISOString(),reason:'replace',raw:C.backup(project('Otra recuperación ficticia'))}));return get(k);};
 const result=control.restoreRecovery(originalRaw);assert.equal(result.ok,false);assert.equal(storage.getItem(KEY),active);assert.equal(control.getJournal().raw,active);
});
check('Consultar propiedades no lee las copias auxiliares ni entrega estado mutable',()=>{
 const storage=store({[KEY]:originalRaw}),control=controller(storage);control.open();
 const get=storage.getItem.bind(storage),reads=[];storage.getItem=key=>{reads.push(key);return get(key);};
 assert.equal(control.status,'ready');assert.equal(control.rawBase,originalRaw);assert.equal(typeof control.message,'string');
 const copy=control.state;copy.project.title='Cambio fuera del controlador';
 assert.equal(control.state.project.title,original.project.title);assert.deepEqual(reads,[]);
});
check('Guardar prepara un solo respaldo y conserva su estado normalizado',()=>{
 const storage=store({[KEY]:originalRaw});let preparations=0;
 const core={...C,prepareBackup:input=>{preparations++;return C.prepareBackup(input);}};
 const control=S.startStorage({storage,key:KEY,core,canWrite:()=>true});control.open();
 const next=C.clone(original);next.project.title='Cambio normalizado ficticio';next.project.extra='No pertenece al esquema';
 assert.equal(control.save(next).persisted,true);assert.equal(preparations,1);
 assert.equal(control.state.project.extra,undefined);assert.equal(C.restore(storage.getItem(KEY)).project.title,next.project.title);
});
console.log(count+' comprobaciones de persistencia pasaron.');
