(function(global){
'use strict';
// El dueño del Web Lock es el único autorizado para escribir la copia principal.
// Sin ese lock, este controlador admite trabajo en memoria, nunca un CAS simulado.
function startStorage({storage,key,core,canWrite}){
 if(!core||typeof core.validate!=='function'||typeof core.backup!=='function'||typeof core.restore!=='function')throw new Error('Falta el núcleo de Compás para abrir el almacenamiento.');
 if(typeof key!=='string'||!key)throw new Error('Falta la clave de almacenamiento de Compás.');
 const recoveryKey=key+'-recovery-v1',journalKey=key+'-journal-v1',pendingKey=key+'-pending-v1';
 let base=null,current=null,problem='',problemMessage='',corrupt=false,corruptAuthorized=false,available=true;
 const owner=()=>{try{return typeof canWrite==='function'?canWrite()===true:canWrite===true;}catch(_){return false;}};
 const messageFor={
  ready:'La copia de Compás está guardada en este navegador.',
  session:'Los cambios quedan solo en esta sesión. Descarga un respaldo para conservarlos.',
  corrupt:'La copia del navegador no se pudo leer. Sigue intacta; recupérala o descárgala antes de empezar otra bitácora.',
  conflict:'Otra pestaña cambió la copia del navegador. No se guardó ni se sustituyó tu trabajo. Descarga un respaldo de esta sesión y vuelve a abrir la copia guardada.',
  unavailable:'No se pudo acceder al almacenamiento del navegador. Descarga un respaldo para conservar tu trabajo.',
  error:'No se pudo guardar el cambio. La copia anterior sigue intacta; descarga un respaldo antes de continuar.'
 };
 const getStatus=()=>problem||(corrupt&&!corruptAuthorized?'corrupt':!available?'unavailable':owner()?'ready':'session');
 const readItem=k=>{if(!storage||typeof storage.getItem!=='function')throw new Error('Almacenamiento no disponible.');return storage.getItem(k);};
 const makeRecord=(raw,reason)=>({format:'compas-local-recovery',version:1,at:new Date().toISOString(),reason,raw});
 function recordAt(k){
  const text=readItem(k);if(text===null)return null;
  let value;try{value=JSON.parse(text);}catch(_){return {raw:text,at:'',reason:'metadata-unreadable',unreadable:true};}
  if(!value||value.format!=='compas-local-recovery'||value.version!==1||typeof value.raw!=='string'||typeof value.at!=='string'||typeof value.reason!=='string')return {raw:text,at:'',reason:'metadata-unreadable',unreadable:true};
  const result={raw:value.raw,at:value.at,reason:value.reason};try{result.state=core.restore(value.raw);}catch(_){}return result;
 }
 function getRecovery(){try{return recordAt(recoveryKey);}catch(_){return null;}}
 function getJournal(){try{const pending=recordAt(pendingKey);if(pending)return {...pending,pending:true};const committed=recordAt(journalKey);return committed?{...committed,pending:false}:null;}catch(_){return null;}}
 function snapshot(){return {status:getStatus(),state:current?core.clone(current):null,rawBase:base,recovery:getRecovery(),journal:getJournal(),message:problemMessage||messageFor[getStatus()]};}
 function result(ok,persisted,state,message){return {ok,persisted,status:getStatus(),state:state?core.clone(state):null,message:message||problemMessage||messageFor[getStatus()]};}
 function fail(status,message){problem=status;problemMessage=message;return result(false,false,current,message);}
 function reload(){
  problem='';problemMessage='';corrupt=false;corruptAuthorized=false;available=true;current=null;
  try{base=readItem(key);if(base!==null){try{current=core.restore(base);}catch(_){corrupt=true;}}}
  catch(_){available=false;base=null;}
  return snapshot();
 }
 function preserve(raw,reason){
  if(raw===null)return;
  const existing=recordAt(recoveryKey);
  if(existing){if(!existing.unreadable&&existing.raw===raw)return;throw new Error('Ya hay una copia de recuperación pendiente. Descárgala y confirma que la conservaste antes de reemplazar otra bitácora.');}
  storage.setItem(recoveryKey,JSON.stringify(makeRecord(raw,reason)));
  const verified=recordAt(recoveryKey);if(!verified||verified.unreadable||verified.raw!==raw)throw new Error('No se pudo comprobar la copia de recuperación. La bitácora anterior no se reemplazó.');
 }
 function finalizePending(record){
  storage.setItem(journalKey,JSON.stringify(makeRecord(record.raw,record.reason)));
  const verified=recordAt(journalKey);if(!verified||verified.unreadable||verified.raw!==record.raw)throw new Error('No se pudo comprobar el diario de recuperación.');
  storage.removeItem(pendingKey);
 }
 function write(next,kind,recoveryRaw){
  let valid,raw;try{valid=core.validate(next);raw=core.backup(valid);}catch(err){return result(false,false,current,err.message||'El cambio no es una bitácora válida.');}
  // Incluso un llamador que use save por error no puede cambiar de proyecto sin recuperación.
  if(kind==='save'&&current&&current.project.id!==valid.project.id)kind='replace';
  if(problem==='conflict')return result(false,false,current);
  if(corrupt&&!corruptAuthorized&&!['resolve','recover'].includes(kind))return result(false,false,current,messageFor.corrupt);
  if(kind==='recover'&&(!owner()||!available))return result(false,false,current,'Esta pestaña no puede recuperar una copia guardada. Abre Compás en la pestaña con permiso de escritura.');
  if(!owner()||!available){
   if(kind==='resolve')corruptAuthorized=true;
   current=valid;problem='';problemMessage='';return result(true,false,current,messageFor.session);
  }
  let actual;
  try{actual=readItem(key);}catch(_){return fail('unavailable','No se pudo comprobar la copia del navegador. El cambio no se guardó; descarga un respaldo para conservar tu trabajo.');}
  if(actual!==base)return fail('conflict',messageFor.conflict);
  if(kind!=='recover'&&(kind==='resolve'||kind==='replace'||corrupt)){
   try{preserve(base,corrupt?'corrupt':kind);}catch(err){return fail('error',err.message||'No se pudo conservar la copia anterior. No se reemplazó la bitácora.');}
  }
  // Completar un checkpoint de un commit anterior antes de preparar el siguiente.
  // Un checkpoint del intento fallido con la misma base puede reutilizarse.
  let pending=null;
  try{
   pending=recordAt(pendingKey);
   if(pending?.unreadable)throw new Error('El diario pendiente no se pudo leer. Descárgalo antes de continuar; no se guardó el cambio.');
   if(pending&&pending.raw!==base){finalizePending(pending);pending=null;}
   if(base!==null&&!pending){pending=makeRecord(base,kind);storage.setItem(pendingKey,JSON.stringify(pending));const check=recordAt(pendingKey);if(!check||check.unreadable||check.raw!==base)throw new Error('No se pudo comprobar el diario de recuperación.');}
  }catch(err){return fail('error',err.message==='El diario pendiente no se pudo leer. Descárgalo antes de continuar; no se guardó el cambio.'?err.message:'No se pudo preparar la recuperación del cambio. La copia anterior sigue intacta; descarga un respaldo antes de continuar.');}
  // Comprobar de nuevo tras preparar la recuperación; el lock sigue siendo obligatorio.
  try{
   if(!owner()||readItem(key)!==base)return fail('conflict',messageFor.conflict);
   if(kind==='recover'){const source=recordAt(recoveryKey);if(!source||source.unreadable||source.raw!==recoveryRaw)return result(false,false,current,'La copia de recuperación cambió. Revísala antes de recuperarla.');}
  }
  catch(_){return fail('unavailable','No se pudo comprobar la copia anterior. No se guardó el cambio; descarga un respaldo.');}
  try{storage.setItem(key,raw);}
  catch(_){return fail('error',messageFor.error);}
  const previousBase=base;
  // La copia solicitada no se retira de recovery hasta comprobar su commit.
  // Si la comprobación falla, pending sigue conservando la base anterior.
  if(kind==='recover'){
   try{if(readItem(key)!==raw)return fail('conflict','La copia activa cambió durante la recuperación. Las copias de recuperación siguen conservadas; vuelve a abrir la copia guardada.');}
   catch(_){return fail('unavailable','No se pudo comprobar la recuperación. Las copias siguen conservadas; vuelve a abrir Compás antes de editar.');}
  }
  base=raw;current=valid;corrupt=false;corruptAuthorized=false;problem='';problemMessage='';
  let warning='';
  if(kind==='recover'&&previousBase!==null){
   try{
    storage.setItem(recoveryKey,JSON.stringify(makeRecord(previousBase,'recovery-swap')));
    const rotated=recordAt(recoveryKey);if(!rotated||rotated.unreadable||rotated.raw!==previousBase)throw new Error();
   }catch(_){warning='La bitácora recuperada quedó guardada. No se pudo completar la rotación de recuperación; la copia anterior sigue conservada en el diario. Descarga un respaldo.';}
  }
  if(pending){try{finalizePending(pending);}catch(_){warning=warning||'El cambio quedó guardado en este navegador. También se conservó una copia anterior en el diario pendiente; descarga un respaldo.';}}
  return result(true,true,current,warning||messageFor.ready);
 }
 function restoreRecovery(expectedRaw){
  if(!owner()||!available)return result(false,false,current,'Esta pestaña no puede recuperar una copia guardada. Abre Compás en la pestaña con permiso de escritura.');
  let source;
  try{source=recordAt(recoveryKey);}catch(_){return fail('unavailable','No se pudo leer la copia de recuperación. No se reemplazó la bitácora activa.');}
  if(!source||source.unreadable||typeof expectedRaw!=='string'||source.raw!==expectedRaw)return result(false,false,current,'La copia de recuperación cambió. Revísala antes de recuperarla.');
  let recovered;try{recovered=core.restore(source.raw);}catch(_){return result(false,false,current,'Esta copia de recuperación no es una bitácora compatible. Descárgala para revisarla; la bitácora activa sigue intacta.');}
  return write(recovered,'recover',expectedRaw);
 }
 function releaseRecovery(expectedRaw){
  if(!owner())return {ok:false,message:'Abre Compás en la pestaña con permiso de escritura para liberar esa copia.'};
  try{const existing=recordAt(recoveryKey);if(!existing)return {ok:true};if(existing.raw!==expectedRaw)return {ok:false,message:'La copia de recuperación cambió. Revísala antes de liberarla.'};storage.removeItem(recoveryKey);if(readItem(recoveryKey)!==null)throw new Error();return {ok:true};}
  catch(_){return {ok:false,message:'No se pudo liberar la copia de recuperación. Sigue conservada.'};}
 }
 reload();
 const controller={open:snapshot,read:snapshot,reload,save:next=>write(next,'save'),replace:next=>write(next,'replace'),resolve:next=>write(next,'resolve'),restoreRecovery,getRecovery,getJournal,releaseRecovery,keys:Object.freeze({current:key,recovery:recoveryKey,journal:journalKey,pending:pendingKey})};
 for(const name of ['status','state','rawBase','message'])Object.defineProperty(controller,name,{enumerable:true,get:()=>snapshot()[name]});
 return controller;
}
global.CompasStorage={startStorage};
})(globalThis);
