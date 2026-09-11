const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const htmlPath=process.argv[2]||path.resolve(__dirname,'../dist/index.html');
const output=process.argv[3]||'/private/tmp/compas-validation';
const html=fs.readFileSync(htmlPath,'utf8');
const core=html.match(/<script id="compas-core">([\s\S]*?)<\/script>/)[1];
const ui=html.match(/<script id="compas-ui">([\s\S]*?)<\/script>/)[1];
new vm.Script(ui);
const context={TextEncoder,Uint8Array,DataView,Date,Math,Set,Map,JSON,Intl,console};
vm.createContext(context);vm.runInContext(core,context);
const C=context.CompasCore;
let count=0;
const check=(label,fn)=>{fn();count++;console.log('OK '+label);};
const state=C.demo();
const opts={from:'',to:'',project:true,names:false,actions:state.actions.map(x=>x.id),sessions:state.sessions.map(x=>x.id),decisions:state.decisions.map(x=>x.id),route:state.routeProgress.map(x=>x.id),title:'Reporte de prueba'};
check('Respaldo y reapertura conservan los siete módulos',()=>assert.equal(JSON.stringify(C.restore(C.backup(state))),JSON.stringify(C.validate(state))));
check('Una bitácora vacía es válida',()=>assert.equal(C.validate(C.blank()).actions.length,0));
check('Archivos inválidos y versiones desconocidas se rechazan',()=>{
 assert.throws(()=>C.restore('{incorrecto'));
 assert.throws(()=>C.restore(JSON.stringify({format:'compas-report',version:1,data:state})));
 assert.throws(()=>C.restore(JSON.stringify({format:'compas-backup',version:99,data:state})));
 const wrong=C.clone(state);wrong.timeEntries[0].minutes=-5;assert.throws(()=>C.validate(wrong));
 wrong.timeEntries[0].minutes=60;wrong.sessions[0].date='2026-02-31';assert.throws(()=>C.validate(wrong));
});
check('Se rechazan duplicados y vínculos a registros inexistentes',()=>{
 const wrong=C.clone(state);wrong.actions.push(C.clone(wrong.actions[0]));assert.throws(()=>C.validate(wrong));
 const orphan=C.clone(state);orphan.timeEntries[0].actionId='no-existe';assert.throws(()=>C.validate(orphan));
});
const secret='SECRETO_PRIVADO_NO_EXPORTAR_938471';
const privateState=C.clone(state);
privateState.project.privateNotes=secret;
privateState.todos.forEach(x=>{x.title=secret;x.privateNotes=secret;});
privateState.routeProgress.forEach(x=>{x.privateNotes=secret;x.history.forEach(h=>h.privateNotes=secret);});
privateState.sessions.forEach(x=>x.privateNotes=secret);
privateState.actions.forEach(x=>x.privateNotes=secret);
privateState.decisions.forEach(x=>x.privateNotes=secret);
privateState.reflections.forEach(x=>x.text=secret);
privateState.timeEntries.forEach(x=>{x.note=secret;x.category=secret;});
privateState.sessions[0].unexpectedPrivate={content:secret};
const report=C.makeShare(privateState,opts);
const doc=C.reportHTML(report),excel=C.excelBytes(report);
check('Privacidad: horas, reflexiones y notas no viajan en ningún reporte',()=>{
 for(const output of [JSON.stringify(report),doc,Buffer.from(excel).toString('utf8')]){
  assert(!output.includes(secret));assert(!output.includes('timeEntries'));assert(!output.includes('privateNotes'));assert(!output.includes('"todos":'));assert(!output.includes('completedAt'));
 }
 assert(C.backup(privateState).includes(secret));
});
check('La selección no incorpora registros desmarcados ni sus vínculos',()=>{
 const r=C.makeShare(state,{...opts,project:false,sessions:[],decisions:[],route:[],actions:[state.actions[0].id]});
 assert.equal(r.route.length,0);assert.equal(r.project,null);assert.equal(r.sessions.length,0);assert.equal(r.decisions.length,0);assert.equal(r.actions.length,1);
 assert(!JSON.stringify(r).includes(state.actions[1].description));
});
check('Los campos de nombres se incluyen solo al seleccionarlos',()=>{
 assert(!JSON.stringify(report).includes(state.project.student));
 assert(!Object.hasOwn(report.sessions[0],'participants'));
 const r=C.makeShare(state,{...opts,names:true});assert.equal(r.project.student,state.project.student);
});
check('El periodo conserva pendientes anteriores y excluye sesiones fuera de fecha',()=>{
 const r=C.makeShare(state,{...opts,from:C.today(),to:C.today()});
 assert.equal(r.sessions.length,0);assert.equal(r.decisions.length,0);
 assert.equal(r.actions.length,state.actions.filter(a=>a.status!=='resuelto').length);
});
check('Los textos se escapan y Excel no ejecuta fórmulas de las celdas',()=>{
 const hostile=C.clone(state);hostile.project.title='<img src=x onerror=alert(1)> & </script>';
 hostile.routeProgress[0].evidence='<img src=x onerror=alert(2)> & </script>';hostile.actions[0].description='=HYPERLINK("https://example.invalid","x")';
 const r=C.makeShare(hostile,opts),h=C.reportHTML(r),x=Buffer.from(C.excelBytes(r)).toString('utf8');
 assert(!h.includes('<img src=x'));assert(h.includes('&lt;img'));
 assert(!x.includes('<f>'));assert(x.includes('t="inlineStr"'));
 fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'formula-safe.xlsx'),C.excelBytes(r));
});
check('El prototipo no necesita recursos externos ni conexiones',()=>{
 assert(html.includes("connect-src 'none'"));
 assert(!/<script[^>]+src=/i.test(html));
 assert(!/<link[^>]+href=/i.test(html));
 assert(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(core+ui));
 assert.equal((html.match(/<script id="compas-/g)||[]).length,2);
 assert.equal((html.match(/<\/script>/g)||[]).length,2);
 assert(html.includes(C.FOOTER));
});

check('Respaldo v1 real migra sin inferir nivel ni perder datos',()=>{
 const legacy=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/legacy-v1.json'),'utf8'));
 legacy.data.project.semester='10 · extensión';
 const migrated=C.restore(JSON.stringify(legacy));
 assert.equal(migrated.schemaVersion,2);assert.equal(migrated.project.level,'');assert.equal(migrated.project.semester,'10 · extensión');
 assert.equal(migrated.todos.length,0);assert.equal(migrated.routeProgress.length,0);
 for(const key of ['sessions','actions','decisions','timeEntries','reflections']) {
  assert.equal(migrated[key].length,legacy.data[key].length);
  legacy.data[key].forEach((x,i)=>Object.entries(x).forEach(([k,v])=>assert.equal(migrated[key][i][k],v)));
 }
 assert.equal(C.restore(C.backup(migrated)).project.semester,'10 · extensión');
});
check('La ruta conserva 4 y 8 semestres y sus referencias textuales',()=>{
 assert.equal(C.ROUTES.maestria.length,4);assert.equal(C.ROUTES.doctorado.length,8);
 assert.equal(new Set(C.MILESTONES.map(m=>m.id)).size,C.MILESTONES.length);
 assert(C.ROUTES.maestria[2].note.includes('50%'));assert(C.ROUTES.doctorado[5].note.includes('70%'));
 assert(C.ROUTES.doctorado[7].note.includes('mayo'));assert(C.milestone('d2-coloquio'));
 assert.equal(C.milestone('d2-teoria').workId,C.milestone('d4-teoria').workId);
 assert.equal(C.milestone('d1-estado').workId,C.milestone('d4-literatura').workId);
});
check('Cambiar de nivel conserva progresos, ToDo y compromisos',()=>{
 const next=C.clone(state);next.project.level='doctorado';next.project.semester='9';
 const valid=C.restore(C.backup(next));assert.equal(valid.routeProgress.length,state.routeProgress.length);
 assert.equal(valid.todos.length,state.todos.length);assert.equal(valid.actions[0].milestoneId,state.actions[0].milestoneId);
});
check('Una tarea terminada no cierra compromisos ni productos',()=>{
 const next=C.setTodoDone(state,state.todos[0].id,true);
 assert(next.todos[0].done);assert.equal(next.todos[0].completedAt,C.today());assert.equal(state.todos[0].done,false);
 assert.equal(JSON.stringify(next.actions),JSON.stringify(C.validate(state).actions));assert.equal(JSON.stringify(next.routeProgress),JSON.stringify(C.validate(state).routeProgress));
 const reopened=C.setTodoDone(next,state.todos[0].id,false);assert(!reopened.todos[0].done);assert.equal(reopened.todos[0].completedAt,'');
});
check('Eliminar un compromiso conserva tareas y horas, sin vínculos huérfanos',()=>{
 const next=C.removeRecord(state,'actions','act-casos');
 assert.equal(next.todos.length,state.todos.length);assert.equal(next.timeEntries.length,state.timeEntries.length);
 assert.equal(next.todos[0].actionId,'');assert.equal(next.todos[0].milestoneId,'m2-metodo');
 assert(next.timeEntries.filter(t=>t.id==='time-1'||t.id==='time-2').every(t=>!t.actionId));
 const wrong=C.clone(state);wrong.todos[0].actionId='missing';assert.throws(()=>C.validate(wrong));
 wrong.todos[0].actionId='';wrong.todos[0].milestoneId='missing';assert.throws(()=>C.validate(wrong));
});
check('Reprogramar preserva versiones y requiere motivo',()=>{
 assert.throws(()=>C.saveRoute(state,'m2-metodo',{planSemester:'5',adjustmentReason:''}));
 const next=C.saveRoute(state,'m2-metodo',{planSemester:'5',adjustmentReason:'Revisar el acceso al campo',versionLabel:'Versión 3'});
 const p=next.routeProgress.find(x=>x.id==='m2-metodo');
 assert.equal(p.history.length,1);assert.equal(p.history[0].planSemester,'3');assert.equal(p.planSemester,'5');
 assert.equal(p.history[0].versionLabel,'Versión 2');assert.equal(p.versionLabel,'Versión 3');
 assert.equal(C.restore(C.backup(next)).routeProgress[0].history.length,1);
});
check('Realización y aprobación necesitan evidencia; revisión exige persona y fecha',()=>{
 assert.throws(()=>C.saveRoute(state,'m1-protocolo',{status:'resuelto',evidence:''}));
 assert.throws(()=>C.saveRoute(state,'m1-protocolo',{reviewState:'aprobado',evidence:'Protocolo v1',reviewDate:C.today()}));
 const next=C.saveRoute(state,'m1-protocolo',{reviewState:'aprobado',evidence:'Protocolo v1',reviewDate:C.today(),reviewBy:'Directora de ejemplo'});
 const p=next.routeProgress.find(x=>x.id==='m1-protocolo');assert.equal(p.status,'pendiente');assert.equal(p.reviewState,'aprobado');
 const r=C.makeShare(next,{...opts,route:['m1-protocolo']});assert.equal(r.route.length,1);assert(!Object.hasOwn(r.route[0],'reviewBy'));
 assert.equal(C.makeShare(next,{...opts,route:['m1-protocolo'],names:true}).route[0].reviewBy,'Directora de ejemplo');
});
check('El corte de ruta recupera la versión previa y rechaza historia desordenada',()=>{
 const first=C.saveRoute(C.blank(),'m1-protocolo',{versionLabel:'v1',evidence:'Primera versión'});
 first.routeProgress[0].updatedAt='2026-01-01';
 const second=C.saveRoute(first,'m1-protocolo',{versionLabel:'v2',evidence:'Segunda versión'});
 assert.equal(C.routeAt(second,'m1-protocolo','2026-01-02').versionLabel,'v1');
 assert.equal(C.routeAt(second,'m1-protocolo',C.today()).versionLabel,'v2');
 const r=C.makeShare(second,{route:['m1-protocolo'],to:'2026-01-02'});assert.equal(r.route[0].versionLabel,'v1');
 assert(!JSON.stringify(r).includes('Segunda versión'));assert(!JSON.stringify(r).includes('history'));
 second.routeProgress[0].history[0].updatedAt='2099-01-01';assert.throws(()=>C.validate(second));
});
check('Un reporte de ruta no arrastra tareas, historial ni compromisos vinculados',()=>{
 const next=C.saveRoute(state,'m2-metodo',{privateNotes:secret});
 next.routeProgress[0].history[0].privateNotes=secret;
 const r=C.makeShare(next,{route:['m2-metodo'],project:false,names:false}),doc=C.reportHTML(r),xls=Buffer.from(C.excelBytes(r)).toString('utf8');
 for(const out of [JSON.stringify(r),doc,xls]){assert(!out.includes(secret));assert(!out.includes(state.todos[0].title));assert(!out.includes(state.actions[0].description));assert(!out.includes('history'));}
 assert.equal(r.route.length,1);assert.equal(r.actions.length,0);assert.equal(r.sessions.length,0);
});
check('El límite común permite reabrir respaldos con historiales grandes',()=>{
 const big=C.saveRoute(C.blank(),'m1-protocolo',{evidence:'a'.repeat(16000)});
 const record=big.routeProgress[0],snapshot={...record};delete snapshot.history;
 record.history=Array.from({length:410},()=>({...snapshot}));
 const backup=C.backup(big);assert(Buffer.byteLength(backup)>6*1024*1024);
 assert.equal(C.restore(backup).routeProgress[0].history.length,410);
 record.history.forEach(x=>{x.privateNotes='ñ'.repeat(16000);x.versionLabel='b'.repeat(16000);x.adjustmentReason='c'.repeat(16000);});
 assert.throws(()=>C.validate(big),/24 MB/);
});

fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'consulta.html'),doc);
fs.writeFileSync(path.join(output,'reporte.xlsx'),excel);
fs.writeFileSync(path.join(output,'respaldo.json'),C.backup(state));
console.log(count+' comprobaciones completadas.');
