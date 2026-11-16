function rewardArt(id) {
  const index=C.REWARD_COLLECTIONS.flatMap(c=>c.pieces).findIndex(p=>p[0]===id);
  if(index<0)return '';
  const xs=[165,465,790,1120], ys=[165,455,730];
  return '<span class="reward-art" aria-hidden="true" style="background-position:'+ (xs[index%4]/1256*100)+'% '+(ys[Math.floor(index/4)]/814*100)+'%"></span>';
}
function renderRewardCorner(){
  const holder=$('reward-corner');
  const piece=C.rewardPiece(state.selectedReward);
  holder.hidden=!piece;
  holder.innerHTML=piece ? '<button class="reward-on-shelf" data-do="rewards" aria-label="'+e(piece[1])+': abrir mis colecciones">'+rewardArt(piece[0])+'<span>'+e(piece[1])+'</span></button>' : '';
}
function rewardsDialog(refresh=false){
  const d=$('editor');
  if(!refresh)dialogTrigger=document.activeElement;
  d.classList.remove('todo-import-dialog','appearance-dialog');
  const owned=new Set(state.rewards.map(r=>r.piece).filter(Boolean));
  const pending=state.rewards.filter(r=>!r.piece).length;
  d.innerHTML='<div class="dialog-top"><div><h2 id="dialog-title">Mis colecciones</h2><p class="hint">Personas e ideas para acompañar tu trayectoria.</p></div>'+btn('Cerrar','close','','ghost')+'</div><div class="dialog-body reward-collections"><p role="status">'+(pending ? 'Tienes '+pending+' elección'+(pending===1?' pendiente.':'es pendientes.') : 'Cada producto o compromiso completado te permite elegir una pieza nueva.')+'</p><p class="hint">Elige una pieza para colocarla junto a tu foto. Puedes cambiarla o retirarla cuando quieras. Las tareas ToDo no conceden piezas.</p>'+
    C.REWARD_COLLECTIONS.map(c=>'<section><h3>'+e(c.title)+'</h3><div class="reward-shelf">'+c.pieces.map(([id,name])=>{
      const has=owned.has(id),selected=state.selectedReward===id,disabled= !has&&!pending;
      return '<button class="reward-choice" data-do="reward-choose" data-piece="'+id+'" aria-pressed="'+selected+'"'+(disabled?' disabled':'')+'>'+rewardArt(id)+'<strong>'+e(name)+'</strong><small>'+(selected?'En tu rincón':has?'Colocar':pending?'Elegir y conservar':'Por descubrir')+'</small></button>';
    }).join('')+'</div></section>').join('')+'<p class="hint">Retratos ilustrados y metáforas visuales, no retratos documentales ni resúmenes completos de las teorías. La colección se conserva en tu respaldo personal y no aparece en los reportes. Puedes elegir más tarde desde este estante.</p></div><div class="dialog-bottom">'+(state.selectedReward?btn('Retirar del rincón','reward-hide','','ghost'):'')+btn('Listo','close','','primary')+'</div>';
  if(!d.open)d.showModal();
}
