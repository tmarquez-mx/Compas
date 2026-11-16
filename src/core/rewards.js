// La colección pertenece a la bitácora y viaja en su respaldo privado.
const REWARD_COLLECTIONS = [
  {title:'Mujeres que abrieron caminos',pieces:[['arendt','Hannah Arendt'],['ostrom','Elinor Ostrom'],['collins','Patricia Hill Collins'],['rivera','Silvia Rivera Cusicanqui']]},
  {title:'Tradiciones y debates',pieces:[['marxismos','Marxismos'],['comprensiva','Sociología comprensiva'],['interaccionismo','Interaccionismo simbólico'],['democracia','Teorías de la democracia']]},
  {title:'Pensar desde el Sur',pieces:[['dependencia','Dependencia'],['colonialidad','Colonialidad del poder'],['educacion','Educación popular'],['feminismos','Feminismos del Sur']]}
];
function rewardPiece(id){return REWARD_COLLECTIONS.flatMap(c=>c.pieces).find(p=>p[0]===id);}
function earnRewards(before,after){
  const earned=after.rewards || (after.rewards=[]);
  for(const kind of ['routeProgress','actions']){
    const prior=new Map(before[kind].map(x=>[x.id,x]));
    for(const item of after[kind]){
      const key=kind+':'+item.id;
      if(item.status==='resuelto' && prior.get(item.id)?.status!=='resuelto' && !earned.some(r=>r.key===key)){
        if(earned.length>=3000)continue;
        earned.push({key,piece:'',date:today()});
      }
    }
  }
}
function chooseReward(state,piece){
  if(!rewardPiece(piece))throw new Error('Elige una pieza de las colecciones.');
  if(!state.rewards.some(r=>r.piece===piece)){
    const pending=state.rewards.find(r=>!r.piece);
    if(!pending)throw new Error('Completa un producto o compromiso para elegir una pieza nueva.');
    pending.piece=piece;
  }
  state.selectedReward=piece;
}
