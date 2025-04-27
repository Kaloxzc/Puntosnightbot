function doGet(e) 
//Verificar usuario
{
  if (!e.parameter.user) {
    return ContentService.createTextOutput("Error: falta el nombre de usuario.");
  }
//Variables
  const action = e.parameter.action;
  const user = e.parameter.user.toLowerCase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Hoja 1");
  const data = sheet.getDataRange().getValues();
  const giveTo = e.parameter.giveTo?.toLowerCase();
  const amount = parseInt(e.parameter.amount);
  let userRow = data.findIndex(r => r[0] && r[0].toLowerCase() === user);
  if (userRow === -1) {
    sheet.appendRow([user, 0]);
    userRow = data.length;
  }
  //Variable para detectar coño o pene
  let userPoints = parseInt(sheet.getRange(userRow + 1, 2).getValue());
  const tipoPuntos = userPoints >= 0 ? "penes" : "coños";
  //Funcion que convierte un numero a penes/coños
  function points(n){
    if(isNaN(n))return "0 penes";
    else if(n>=0)return `${n} pene${n==1?"":"s"}`;
    else return `${-n} coño${n==-1?"":"s"}`
  }
  //Función que busca el usuario, obtiene sus puntos, y de acuerdo al callback (una función de transformación) llamado "modifier", transforma los puntos del usuario
  function modifyPoints(user,modifier){
    let row = data.findIndex(r => r[0] && r[0].toLowerCase() === user);
    if (row === -1) return 0;
    let points=parseInt(sheet.getRange(row + 1, 2).getValue());
    sheet.getRange(row + 1, 2).setValue(modifier(points));
    return 1;
  }
  //Comando !penes
  if (action === "points") { 
    return ContentService.createTextOutput(`${user} tiene ${points(userPoints)}.`); 
  }
//Comando !dar
 if (action === "dar") {
    if (isNaN(amount) || amount <= 0){
      return ContentService.createTextOutput(`Error: debes dar una cantidad valida de penes.`);
  }
    if (user === giveTo) {
      return ContentService.createTextOutput(`Error: no puedes darte penes a ti mismo idiota `);
    }

    if (amount <= 0) {
      return ContentService.createTextOutput("Error: la cantidad debe ser mayor que 0 xd ");
    }
    if (userPoints < amount) {
      return ContentService.createTextOutput(`Error: no tienes suficientes penes WAJAJA . Tienes ${points(userPoints)} X3 `);
    }

    let success=modifyPoints(giveTo,giveToPoints=>giveToPoints + amount);
    if (success==0)return ContentService.createTextOutput(`Error: ${giveTo} no existe aún. Tiene que usar !jugar primero.`);
    modifyPoints(user,userPoints=>userPoints - amount);

    return ContentService.createTextOutput(`${user} le dio ${points(amount)} a ${giveTo} FemboyHop ! Jigglin Ahora tienes ${points(userPoints)} X3`)
  }
  //Comando !gamba
  if (action === "gamba"){  
  let apuesta = e.parameter.bet?.toLowerCase() === "all" ? Math.abs(userPoints) : parseInt(e.parameter.bet);
  if (userPoints == 0){
    return ContentService.createTextOutput(`No tienes penes para apostar. Tus penes actuales son ${userPoints}`);
  }
  if (isNaN(apuesta) || apuesta <= 0) {
    return ContentService.createTextOutput(`Error: debes apostar una cantidad válida de penes.`);
  }
  if (userPoints < apuesta) {
    return ContentService.createTextOutput(`No tienes suficientes penes para apostar ${apuesta} chale . Tus ${tipoPuntos} actuales son ${userPoints >= 0 ?userPoints : -userPoints} X3 `);
  }

  // 50% de ganar o perder
  const exito = Math.random() < 0.5; // true = gana, false = pierde

  if (exito) {
    modifyPoints(user,x=>x + apuesta);
    return ContentService.createTextOutput(`${user} apostó ${points(apuesta)} y ganó! BoykisserDance Ahora tienes ${points(userPoints)} X3`)
  } else {
    modifyPoints(user,x=>x-apuesta);
    return ContentService.createTextOutput(`${user} apostó ${points(apuesta)} y perdió! sadkitty Ahora tienes ${points(userPoints)} X3`)
  }
}
//Comando !ranking
if (action === "ranking") {
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
//Comando !jugar
 const ganancias = [30, 20, 5];
 const perdidas = [-20, -10, -5];
 const opciones = ganancias.concat(perdidas);
 const cambio = opciones[Math.floor(Math.random() * opciones.length)];

 userPoints += cambio;
 sheet.getRange(userRow + 1, 2).setValue(userPoints);
 const tipoPuntosFinal = userPoints >= 0 ? "penes" : "coños";

 const resultado = cambio > 0
    ? `¡${user} ganó ${points(cambio)} BoyKisserSwoon !Ahora tienes ${points(userPoints)}.`
    : `¡${user} perdió ${points(Math.abs(cambio))} BoykisserSad ! Ahora tienes ${points(userPoints)}.`;

  return ContentService.createTextOutput(resultado);

}

