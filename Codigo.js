function doGet(e) 
//Verificar usuario
{
  if (!e.parameter.user) {
    return ContentService.createTextOutput("Error: falta el nombre de usuario.");
  }
//Variables
  const action = e.parameter.action;
  const user = e.parameter.user.toLowerCase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Puntos");
  const data = sheet.getDataRange().getValues();
  const giveTo = e.parameter.giveTo?.toLowerCase();
  const amount = parseInt(e.parameter.amount);
  let userRow = data.findIndex(r => r[0] && r[0].toLowerCase() === user.toLowerCase());
  let userPoints=0;
  if (action === "jugar"){
    // Comando !jugar
    const ganancias = [30, 20, 5];
    const perdidas = [-20, -10, -5];
    const opciones = ganancias.concat(perdidas);
    const cambio = opciones[Math.floor(Math.random() * opciones.length)];
    userPoints = modifyPoints(user, a => a + cambio);
    if(userPoints==null){
      sheet.appendRow([user, cambio]);
      userPoints=cambio;
    }
  
  
   // Si GANÓ (cambio positivo)
   if (cambio > 0) {
    const resultado = `¡${user} ganó ${points(cambio)} BoyKisserSwoon ! Ahora tienes ${points(userPoints)}.`;
    return ContentService.createTextOutput(resultado);
   }
  
   // Si PERDIÓ (cambio negativo)
   if (cambio < 0) {
    const resultado = `¡${user} perdió ${Math.abs(cambio)} penes! BoykisserSad  Ahora tienes ${points(userPoints)} `;
      return ContentService.createTextOutput(resultado);
    let protecciones = parseInt(sheet.getRange(userRow + 1, 3).getValue()); // Columna 3 = Protección
   if(userRow == -1){
    protecciones = 0
   }
    if (protecciones > 0) {
      // Tiene protección
      protecciones -= 1;
      sheet.getRange(userRow + 1, 3).setValue(protecciones);

    }
   }
   }
  if (userRow === -1) {
    sheet.appendRow([user, 0]);
    userRow = data.length;
  }
  //Variable para detectar coño o pene
  userPoints = parseInt(sheet.getRange(userRow + 1, 2).getValue());
  const tipoPuntos = userPoints >= 0 ? "penes" : "coños";
  //Funcion que convierte un numero a penes/coños
  function points(n){
    if(isNaN(n))return "0 penes";
    else if(n>=0)return `${n} pene${n==1?"":"s"}`;
    else return `${-n} coño${n==-1?"":"s"}`
  }
  //Función que busca el usuario, obtiene sus puntos, y de acuerdo al callback (una función de transformación) llamado "modifier", transforma los puntos del usuario
  function modifyPoints(user,modifier){
    let row = data.findIndex(r => r[0] && r[0].toLowerCase() === user.toLowerCase());
    if (row === -1) return null;
    let points=parseInt(sheet.getRange(row + 1, 2).getValue());
    points=modifier(points);
    sheet.getRange(row + 1, 2).setValue(points);
    return points;
  }
  // Comando !penes
 if (action === "points") {
  let who=giveTo=="null"?user:giveTo;
  const pointsRow = data.findIndex(r => r[0] && r[0].toLowerCase() === who.toLowerCase());

  if (pointsRow === -1) {
    return ContentService.createTextOutput(`Error: ${who} no existe aún. Tiene que usar !jugar primero.`);
  }
  return ContentService.createTextOutput(`${who} tiene ${points(modifyPoints(who,x=>x))}.`);
}
  //Comando !comprar
if (action === "comprar") {
  const itemComprar = e.parameter.item?.toLowerCase(); // el ítem que pidió
  const tienda = {
    "condon": { nombre: "Condon", precio: 2000 },
  };
  
  if (!itemComprar || !tienda[itemComprar]) {
    return ContentService.createTextOutput(`Error: El objeto "${itemComprar}" no existe en la tienda.`);
  }
  let cantidadDisponible = null;  
  const itemInfo = tienda[itemComprar];

  if (userPoints < itemInfo.precio) {
    return ContentService.createTextOutput(`No tienes suficientes ${tipoPuntos} para comprar ${itemInfo.nombre}. Necesitas ${itemInfo.precio}.`);
  }
if (itemInfo.nombre === "Condon") {
  const stockSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Stock");
  const stockData = stockSheet.getDataRange().getValues();
  const stockRow = stockData.findIndex(r => r[0]?.toLowerCase() === "proteccion");

  if (stockRow !== -1) {
    cantidadDisponible = parseInt(stockData[stockRow][1]);
    let ultimaRecarga = new Date(stockData[stockRow][2]);
    const ahora = new Date();

    // Verificar si ya pasó 1 día
    if ((ahora - ultimaRecarga) >= (24 * 60 * 60 * 1000)) {
      cantidadDisponible = 5; // Stock nuevo
      stockSheet.getRange(stockRow + 1, 2).setValue(cantidadDisponible);
      stockSheet.getRange(stockRow + 1, 3).setValue(ahora);
    }

    if (cantidadDisponible <= 0) {
  // Evitar que compre si ya no hay stock
  return ContentService.createTextOutput(`¡No quedan protecciones hoy! Intenta mañana OwO`);
  }

// SOLO SI HAY STOCK
   cantidadDisponible--; // Descuenta 1
   stockSheet.getRange(stockRow + 1, 2).setValue(cantidadDisponible);

// Actualizar protecciones del usuario

  }
}
  // La resta del comprar
  userPoints -= itemInfo.precio;
  sheet.getRange(userRow + 1, 2).setValue(userPoints);

  // Si es protección, sumar 1 protección
  if (itemInfo.nombre === "Condon") {
    let proteccionesActuales = parseInt(sheet.getRange(userRow + 1, 3).getValue()) || 0;
    sheet.getRange(userRow + 1, 3).setValue(proteccionesActuales + 1);
  }

  //Agregar a inventario
  const inventario = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventario");
  const dataInventario = inventario.getDataRange().getValues();
  let inventarioRow = dataInventario.findIndex(r => r[0] && r[0].toLowerCase() === user && r[1] === itemInfo.nombre);

  if (inventarioRow === -1) {
    inventario.appendRow([user, itemInfo.nombre, 1]);
  } else {
    let cantidadActual = parseInt(inventario.getRange(inventarioRow + 1, 3).getValue());
    inventario.getRange(inventarioRow + 1, 3).setValue(cantidadActual + 1);
  }

  let mensaje = `¡${user} compró 1 ${itemInfo.nombre} por ${itemInfo.precio} ${tipoPuntos}. Ahora tienes ${userPoints} ${tipoPuntos}.`;

  if (itemInfo.nombre === "Condon" && cantidadDisponible !== null && cantidadDisponible >= 0) {
   mensaje = `¡${user} compró 1 ${itemInfo.nombre} por ${itemInfo.precio} ${tipoPuntos}, quedan ${cantidadDisponible} protecciones disponibles! Ahora tienes ${userPoints} ${tipoPuntos}.`;
  }

return ContentService.createTextOutput(mensaje);
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
    if (success==null)return ContentService.createTextOutput(`Error: ${giveTo} no existe aún. Tiene que usar !jugar primero.`);
    userPoints=modifyPoints(user,userPoints=>userPoints - amount);

    return ContentService.createTextOutput(`${user} le dio ${points(amount)} a ${giveTo} FemboyHop ! Jigglin Ahora tienes ${points(userPoints)} X3`)
  }
  //Comando !gamba
  if (action === "gamba"){  
  let apuesta = e.parameter.bet?.toLowerCase() === "all" ? Math.abs(userPoints) : parseInt(e.parameter.bet);
  if (isNaN(apuesta) || apuesta <= 0) {
    return ContentService.createTextOutput(`Error: debes apostar una cantidad válida de penes.`);
  }
  if (userPoints < apuesta) {
    return ContentService.createTextOutput(`No tienes suficientes penes para apostar ${apuesta} chale . Actualmente tienes ${points(userPoints)} X3 `);
  }

  // 50% de ganar o perder
  const exito = Math.random() < 0.5; // true = gana, false = pierde

  if (exito) {
    userPoints=modifyPoints(user,x=>x + apuesta);
    return ContentService.createTextOutput(`${user} apostó ${points(apuesta)} y ganó! BoykisserDance Ahora tienes ${points(userPoints)} X3`)
  } 
  if (!exito) { // perdió
  let protecciones = parseInt(sheet.getRange(userRow + 1, 3).getValue());
  if (protecciones > 0) {
    protecciones -= 1;
    sheet.getRange(userRow + 1, 3).setValue(protecciones);
    
    if (protecciones > 0) {
      return ContentService.createTextOutput(`¡${user} perdió la apuesta, pero su protección lo salvó! Aún tienes ${protecciones} protecciones.`);
    } else {
      return ContentService.createTextOutput(`¡${user} perdió la apuesta, pero su protección lo salvó! ¡Era tu última protección, ahora estás vulnerable!`);
    }
  } else {
    // Sin protecciones, pierde normalmente
    userPoints -= apuesta;
    sheet.getRange(userRow + 1, 2).setValue(userPoints);
    return ContentService.createTextOutput(`¡${user} apostó ${apuesta} penes y perdió! sadkitty Ahora tienes ${Math.abs(userPoints)} ${tipoPuntos}.`);
  }
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

}
