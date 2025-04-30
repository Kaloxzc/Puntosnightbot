function lib_functionalUtilities(){
  const isStruct=function(x){
    if(x==null)return false;
    if(typeof x !='object')return false;
    if(Array.isArray(x))return false;
    if(x.constructor!=({}).constructor)return false;
    return true
  }
  const updateStruct=function(struct, transformation, initial){
    if(!isStruct(struct))throw `Given ${struct} as first argument, but it is not of the form {...}`;
    if(!isStruct(transformation))throw `Given ${transformation} as second argument, but is not of the form {...}`;
    if(initial!=undefined&&!isStruct(initial))throw `The initial argument has to be of the form {...} and it represents the values to be put if the key is not found in the original "struct"`;
    const newStruct = {...struct};
    for(let key in transformation){
      if(!struct.hasOwnProperty(key))continue;
      if(!isStruct(struct[key])){
        if(typeof transformation[key]!='function')throw `Given ${transformation} as second argument, but its value in ${key} is not a function. It has to store an update function taking the current value and outputing the new value`;
        newStruct[key]=transformation[key](struct[key]);
        continue
      }
      newStruct[key]=updateStruct(struct[key],transformation[key])
    }
    for(let key in initial){
      if(struct.hasOwnProperty(key))continue;
      newStruct[key]=initial[key]
    }
    return newStruct
  }
  const sumType=function(...constructors){
    let type={};
    constructors.forEach(s=>{
      if(typeof s!='string')throw `The constructors must be strings but I was given ${s} as a constructor`;
      type[s]=stored=>function(cases){
        const errmsg=`In constructor ${s} I was given ${cases} as the "pattern match", but it has to be of the form {...} with the keys being the constructiors and the values being functions that take the stored value and output something`;
        if(!isStruct(cases))throw errmsg;
        let nonExistingCase=false;let problematicCase;
        for(let key in cases){
          if(constructors.includes(key))continue;
          nonExistingCase=true;
          problematicCase=key
        }
        if(nonExistingCase)throw `In constructor ${s} I was given a ${problematicCase} case in the "pattern match", but there is no such constructor`;
        let missingCase=false;
        constructors.forEach(t=>{
          if(cases.hasOwnProperty(t))return;
          missingCase=true;
          problematicCase=t
        });
        if(missingCase)throw `In constructor ${s}, the "pattern match" given is missing the case ${problematicCase}`;
        if(typeof cases[s]!='function')throw errmsg;
        return cases[s](stored)
      }
    });
    return type
  }
  const Maybe=sumType('Just', 'Nothing');
  const getField=function(struct, key){
    if(!struct.hasOwnProperty(key))return Maybe.Nothing();
    return Maybe.Just(struct[key])
  }
  const runState=function(parameters,initial,update){
    if(typeof update!='function')throw `Given ${update} as the update argument, but it is not a function. It has to be a function that takes the parameters and the current state, and returns a list [newState, message] with the updated State and the message to return`;
    const sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja de qp');
    let currentState=sheet.getRange(1,1).getValue();
    if(currentState==''){
      sheet.getRange(1,1).setValue(JSON.stringify(initial));
      currentState=initial
    }else currentState=JSON.parse(currentState);
    [newState, message]=update(parameters,currentState);
    sheet.getRange(1,1).setValue(JSON.stringify(newState));
    return ContentService.createTextOutput(message);
  };
  return {updateStruct,sumType, runState, Maybe, getField}
}
function doGet(e){
  const {updateStruct,sumType,runState,Maybe,getField}=lib_functionalUtilities();
  const smallStruct=function(key,value){
    const r={};
    r[key]=value;
    return r
  }
  const points=function(n){
    if(isNaN(n))return "0 penes";
    else if(n>=0)return `${n} pene${n==1?"":"s"}`;
    else return `${-n} coño${n==-1?"":"s"}`
  }
  const numToDate=function(num){
    return new Date(num.year,num.month,num.day,num.hours)
  }
  const dateToNum=function(date){
    return {
      year:date.getFullYear(),
      month:date.getMonth(),
      day:date.getDate(),
      hours:date.getHours()
    }
  }
  //data la fecha actual, y otra fecha, regresa un booleano indicando si ha pasado mas de cierto tiempo desde la fecha hasta ahora
  const util=function(now,date,time){
    if(now.getFullYear()-date.year>=time.year&&now.getMonth()-date.month>=time.month&&now.getDate()-date.day>=time.day&&now.getHours()-date.hours>=time.hours)return true;
    return false
  }
  return runState(
    e.parameter,
    {
      players:{},
      shop:{
        lastStockRefill:{
          year:2025,
          month:3,
          day:28,
          hours:0
        },
        items:{
          condones:{
            maxStock:3,
            stock:3,
            price:2000
          }
        }
      }
    },
    (parameters,currentState)=>{
      const {action,user,giveTo}=parameters;
      let newState;let message;
      if(action=='jugar'){
        const ganancias = [30, 20, 5];
        const perdidas = [-20, -10, -5];
        const opciones = ganancias.concat(perdidas);
        const cambio = opciones[Math.floor(Math.random() * opciones.length)];
        newState=updateStruct(currentState,{players:players=>updateStruct(
          players,
          smallStruct(user,{points:n=>n+cambio}),
          smallStruct(user,{
            points:0,
            inventory:{}
          })
        )});
        return [newState,(cambio>=0
          ?`${user} ganó ${points(cambio)} BoyKisserSwoon ! Ahora tienes ${points(newState.players[user].points)}`
          :`${user} perdió ${points(cambio)} BoyKisserSad ! Ahora tienes ${points(newState.players[user].points)}`
        )]
      }
      if(action=='points'){
        let who=giveTo=="null"?user:giveTo;
        return [
          currentState,
          getField(currentState.players,who)({
            Just:p=>`${who} tiene ${points(p.points)}`,
            Nothing:()=>`Error: ${who} no existe aún. Tiene que usar !jugar primero.`
          })
        ]
      }
      if(action=='comprar'){
        const itemComprar = parameters.item?.toLowerCase();
        if (!itemComprar || !currentState.shop.items[itemComprar])return [currentState,`Error: El objeto "${itemComprar} no existe en la tienda."`];
        const price=currentState.shop.items[itemComprar].price;
        if(currentState.shop.items[itemComprar].stock<1)return [currentState, `¡No queda stock de ${itemComprar} por hoy! Intenta mañana OwO`];
        const toSpend=getField(currentState.players,user)({
          Just:p=>p.points,
          Nothing:()=>0
        })
        if(toSpend<price)return [currentState,`No tienes suficientes penes para comprar ${itemComprar}. Necesitas ${points(price)}.`];
        const refill=util(new Date(),currentState.shop.lastStockRefill,{
          year:0,
          month:0,
          day:1,
          hours:0
        });
        newState=updateStruct(currentState,{
          shop:{
            items:smallStruct(itemComprar,{stock:stock=>-1+stock+refill?currentState.shop.items[itemComprar].maxStock:0}),
            lastStockRefill:dateToNum(new Date())
          },
          players:smallStruct(user,{
            points:points=>points-price,
            inventory:inventory=>updateStruct(inventory,smallStruct(itemComprar,item=>item+1),smallStruct(itemComprar,1))
          })
        });
        return [newState,`${user} compró 1 de ${itemComprar} por ${points(price)}, quedan ${newState.shop.items[itemComprar].stock}. Ahora tienes ${points(newState.players[user].points)}`];
      }
      if(action=='dar'){
        const amount = parseInt(parameters.amount);
        if (isNaN(amount) || amount <= 0)return [currentState,`Error: debes dar una cantidad valida de penes.`];
        if(user==giveTo)return [currentState,`Error: no puedes darte penes a ti mismo idiota `];
        if (amount <= 0)return [currentState,"Error: la cantidad debe ser mayor que 0 xd "];
        const toSpend=getField(currentState.players,user)({
          Just:p=>p.points,
          Nothing:()=>0
        });
        if(toSpend<amount)return [currentState,`Error: no tienes suficientes penes WAJAJA . Tienes ${points(toSpend)} X3 `];
        newState=getField(currentState.players,giveTo)({
          Nothing:()=>currentState,
          Just:player=>updateStruct(currentState,{players:players=>updateStruct(players,{
            ...smallStruct(user,{points:points=>points-amount}),
            ...smallStruct(giveTo,{points:points=>points+amount})
          })})
        });
        return [newState,getField(currentState.players,giveTo)({
          Nothing:()=>`Error: ${giveTo} no existe aún. Tiene que usar !jugar primero.`,
          Just:player=>`${user} le dio ${points(amount)} a ${giveTo} FemboyHop ! Jigglin Ahora tienes ${points(newState.players[user].points)}`
        })]
      }
      if(action=='gamba'){
        const toSpend=getField(currentState.players,user)({
          Just:p=>p.points,
          Nothing:()=>0
        });
        let apuesta=parameters.bet?.toLowerCase()=='all'?toSpend:parseInt(parameters.bet);
        if (isNaN(apuesta) || apuesta <= 0)return [currentState,`Error: debes apostar una cantidad válida de penes.`];
        if(toSpend<apuesta)return [currentState,`No tienes suficientes penes para apostar ${apuesta} chale . Actualmente tienes ${points(toSpend)} X3 `];
        const exito = Math.random() < 0.5;
        const condones=getField(currentState.players[user].inventory,'condones')({
          Just:n=>n,
          Nothing:()=>0
        });
        if(exito)return [updateStruct(currentState,{players:smallStruct(user,{points:x=>x+apuesta})}),`${user} apostó ${apuesta} y ganó! BoykisserDance Ahora tienes ${points(toSpend+apuesta)} X3`];
        if(condones>0)return [
          updateStruct(currentState,{players:smallStruct(user,{inventory:{condones:x=>x-1}})}),
          `${user} perdió la apuesta, pero su condón lo protegió! ${condones==1
            ?`Era tu último condón, ahora estás vulnerable`
            :`Aún tienes ${condones-1} condones.`
          }`
        ];
        return [
          updateStruct(currentState,{players:smallStruct(user,{points:x=>x-apuesta})}),
          `${user} apostó ${points(apuesta)} y perdió! sadKitty Ahora tienes ${points(toSpend-apuesta)}`
        ]
      }
      if(action=='ranking'){
        return [currentState,'perdón, me dio mucha hueva']
      }
    }
  )
}
//Comando !ranking
/**if (action === "ranking") {
  // Obtenemos los datos de todos
  const usersData = data.map(r => ({
    name: r[0],
    points: parseInt(r[1])
  }));

  // Ordenamos por puntos de mayor a menor
  usersData.sort((a, b) => b.points - a.points);

  // Tomamos solo los primeros 5
  const top5 = usersData.slice(0, 5);

  // Armamos el mensaje
  let rankingText = top5.map((u, i) => `${i + 1}. ${u.name} (${points(u.points)})`).join(' --- ');

  return ContentService.createTextOutput(`Top 5 global: ${rankingText}`);
 }
 if(action == 'test'){
  let query=e.parameter.query;
  if(query.length==0)return test("Vacío");
  return test(query[0])
 }
*/