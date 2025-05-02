function lib_functionalUtilities() {
  const isStruct = function (x) {
    if (x == null) return false;
    if (typeof x != 'object') return false;
    if (Array.isArray(x)) return false;
    if (x.constructor != ({}).constructor) return false;
    return true
  }
  const updateStruct = function (struct, transformation, initial) {
    if (!isStruct(struct)) throw `Given ${struct} as first argument, but it is not of the form {...}`;
    if (!isStruct(transformation)) throw `Given ${transformation} as second argument, but it is not of the form {...}`;
    if (initial != undefined && !isStruct(initial)) throw `The initial argument has to be of the form {...} and it represents the values to be put if the key is not found in the original "struct"`;
    const newStruct = { ...struct };
    for (let key in transformation) {
      if (!struct.hasOwnProperty(key)) continue;
      if (!isStruct(struct[key])) {
        if (typeof transformation[key] != 'function') throw `Given ${transformation} as second argument, but its value in ${key} is not a function. It has to store an update function taking the current value and outputing the new value`;
        newStruct[key] = transformation[key](struct[key]);
        continue
      }
      newStruct[key] = updateStruct(struct[key], transformation[key])
    }
    if (initial == undefined) return newStruct;
    for (let key in initial) {
      const hasit = struct.hasOwnProperty(key);
      if (hasit && !isStruct(initial[key])) continue;
      if (!hasit) {
        newStruct[key] = initial[key];
        continue
      }
      if (!isStruct(newStruct[key])) throw `What do you think you are doing? ${newStruct[key]} is not of the form {...}`
      newStruct[key] = updateStruct(newStruct[key], {}, initial[key])
    }
    return newStruct
  }
  const sumType = function (...constructors) {
    let type = {};
    constructors.forEach(s => {
      if (typeof s != 'string') throw `The constructors must be strings but I was given ${s} as a constructor`;
      type[s] = stored => function (cases) {
        const errmsg = `In constructor ${s} I was given ${cases} as the "pattern match", but it has to be of the form {...} with the keys being the constructiors and the values being functions that take the stored value and output something`;
        if (!isStruct(cases)) throw errmsg;
        let nonExistingCase = false; let problematicCase;
        for (let key in cases) {
          if (constructors.includes(key)) continue;
          nonExistingCase = true;
          problematicCase = key
        }
        if (nonExistingCase) throw `In constructor ${s} I was given a ${problematicCase} case in the "pattern match", but there is no such constructor`;
        let missingCase = false;
        constructors.forEach(t => {
          if (cases.hasOwnProperty(t)) return;
          missingCase = true;
          problematicCase = t
        });
        if (missingCase) throw `In constructor ${s}, the "pattern match" given is missing the case ${problematicCase}`;
        if (typeof cases[s] != 'function') throw errmsg;
        return cases[s](stored)
      }
    });
    return type
  }
  const Maybe = sumType('Just', 'Nothing');
  const getField = function (struct, key) {
    if (!struct.hasOwnProperty(key)) return Maybe.Nothing();
    return Maybe.Just(struct[key])
  }
  const runState = function (parameters, initial, update) {
    if (typeof update != 'function') throw `Given ${update} as the update argument, but it is not a function. It has to be a function that takes the parameters and the current state, and returns a list [newState, message] with the updated State and the message to return`;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Hoja de qp');
    let currentState = sheet.getRange(1, 1).getValue();
    if (currentState == '') {
      sheet.getRange(1, 1).setValue(JSON.stringify(initial));
      currentState = initial
    } else currentState = JSON.parse(currentState);
    [newState, message] = update(parameters, currentState);
    sheet.getRange(1, 1).setValue(JSON.stringify(newState));
    return ContentService.createTextOutput(message);
  };
  return { updateStruct, sumType, runState, Maybe, getField }
}
function doGet(e) {
  const { updateStruct, runState, getField } = lib_functionalUtilities();
  const singleton = function (key, value) {
    const r = {};
    r[key] = value;
    return r
  }
  const format = function (n) {
    if (isNaN(n)) return "0 penes";
    else if (n >= 0) return `${n} pene${n == 1 ? "" : "s"}`;
    else return `${-n} coño${n == -1 ? "" : "s"}`
  }
  const numToDate = function (num) {
    return new Date(num.year, num.month, num.day, num.hours)
  }
  const dateToNum = function (date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hours: date.getHours()
    }
  }
  //dada la fecha actual, y otra fecha, regresa un booleano indicando si ha pasado mas de cierto tiempo desde la fecha hasta ahora
  const util = function (now, date, time) {
    if (now.getFullYear() - date.year >= time.year && now.getMonth() - date.month >= time.month && now.getDate() - date.day >= time.day && now.getHours() - date.hours >= time.hours) return true;
    return false
  }
  return runState(
    e.parameter,
    {
      players: {
        guspito019: { points: 90 },
        Vane96: { points: 440 },
        hiddxn: { points: 1 },
        Meru_Harukata_: { points: -8 },
        Guillestina_Palami: { points: -35 },
        Josuemtz55: { points: -20 },
        Kaloxzc: { points: 2020, inventory: { condones: 5 } }
      },
      shop: {
        lastStockRefill: {
          year: 2025,
          month: 4,
          day: 1,
          hours: 0
        },
        items: {
          condones: {
            maxStock: 3,
            stock: 3,
            price: 2000
          }
        }
      }
    },
    (params, currentState) => {
      const { action, user, giveTo } = params;
      let newState;
      if (action == 'jugar') {
        const ganancias = [30, 20, 5];
        const perdidas = [-20, -10, -5];
        const opciones = ganancias.concat(perdidas);
        const cambio = opciones[Math.floor(Math.random() * opciones.length)];
        newState = updateStruct(currentState, { players: singleton(user, { points: a => a + cambio }) }, {
          players: singleton(user, {
            points: cambio,
            inventory: {}
          })
        })
        points = newState.players[user].points;
        return [newState, cambio > 0
          ? `${user} ganó ${format(cambio)} BoyKisserSwoon ! Ahora tienes ${format(points)}`
          : `${user} perdió ${format(-cambio)} BoykisserSad ! Ahora tienes ${format(points)}`
        ]
      }
      if (action == 'points') {
        let who = giveTo == "null" ? user : giveTo;
        return [
          currentState,
          getField(currentState.players, who)({
            Just: a => `${who} tiene ${format(a.points)}`,
            Nothing: () => `Error: ${who} no existe aún. Tiene que usar !jugar primero.`
          })
        ]
      }
      if (action == 'comprar') {
        const itemComprar = params.item.toLowerCase();
        const item = currentState.shop.items[itemComprar];
        if (!item) return [currentState, `Error: El objeto "${itemComprar}" no existe en la tienda.`];
        const { price, stock } = item;
        if (stock < 1) return [currentState, `¡No queda stock de ${itemComprar} por hoy! Intenta mañana OwO`];
        let points = getField(currentState.players, user)({
          Just: a => a.points,
          Nothing: () => 0
        });
        if (points < price) return [currentState, `No tienes suficientes penes para comprar ${itemComprar}. Necesitas ${format(price)}.`];
        const refill = util(new Date(), currentState.shop.lastStockRefill, {
          year: 0,
          month: 0,
          day: 1,
          hours: 0
        }) ? item.maxStock : 0;
        newState = updateStruct(currentState, {
          shop: {
            items: singleton(itemComprar, { stock: a => a + refill - 1 }),
            lastStockRefill: () => dateToNum(new Date())
          },
          players: singleton(user, {
            points: a => a - price,
            inventory: singleton(itemComprar, a => a + 1)
          })
        }, { players: singleton(user, { inventory: singleton(itemComprar, 1) }) });
        points = points - price; stock = stock + refill - 1;
        return [newState, `${user} compró 1 de ${itemComprar} por ${format(price)}, quedan ${stock}. Ahora tienes ${points}`];
      }
      if (action == 'dar') {
        const amount = parseInt(params.amount);
        if (isNaN(amount) || amount <= 0) return [currentState, `Error: debes dar una cantidad valida de penes.`];
        if (user == giveTo) return [currentState, `Error: no puedes darte penes a ti mismo idiota `];
        let points = getField(currentState.players, user)({
          Just: a => a.points,
          Nothing: () => 0
        });
        if (points < amount) return [currentState, `Error: no tienes suficientes penes WAJAJA . Tienes ${format(points)} X3 `];
        receiver = currentState.players[giveTo];
        if (!receiver) return [currentState, `Error: ${giveTo} no existe aún. Tiene que usar !jugar primero.`];
        points = points - amount; const points2 = receiver.points + amount;
        newState = updateStruct(currentState, {
          players: {
            ...singleton(user, { points: () => points }),
            ...singleton(giveTo, { points: () => points2 })
          }
        });
        return [newState, `${user} le dio ${format(amount)} a ${giveTo} FemboyHop ! Jigglin Ahora tienes ${points}`];
      }
      if (action == 'gamba') {
        let points = getField(currentState.players, user)({
          Just: a => a.points,
          Nothing: () => 0
        });
        let apuesta = params.bet.toLowerCase() == 'all' ? points : parseInt(params.bet);
        if (isNaN(apuesta) || apuesta <= 0) return [currentState, `Error: debes apostar una cantidad válida de penes.`];
        if (points < apuesta) return [currentState, `No tienes suficientes penes para apostar ${format(points)} chale . Actualmente tienes ${format(points)} X3 `];
        const exito = Math.random() < 0.5;
        const condones = getField(currentState.players[user].inventory, 'condones')({
          Just: n => n,
          Nothing: () => 0
        });
        if (exito) return [updateStruct(currentState, { players: singleton(user, { points: x => x + apuesta }) }), `${user} apostó ${format(apuesta)} y ganó! BoykisserDance Ahora tienes ${format(points + apuesta)} X3`];
        if (condones > 0) return [
          updateStruct(currentState, { players: singleton(user, { inventory: { condones: x => x - 1 } }) }),
          `${user} perdió la apuesta, pero su condón lo protegió! ${condones == 1
            ? `Era tu último condón, ahora estás vulnerable`
            : `Aún tienes ${condones - 1} condones.`
          }`
        ];
        return [
          updateStruct(currentState, { players: singleton(user, { points: x => x - apuesta }) }),
          `${user} apostó ${format(apuesta)} y perdió! sadkitty  Ahora tienes ${format(points - apuesta)}`
        ]
      }
      if (action === "ranking") {
        // Solo permitir a Kalox ejecutar el comando para evitar spam
        if (user !== "Kaloxzc") {
          return [currentState, `Solo Kalox puede usar este comando para evitar tageos.`]
        }

        const players = currentState.players;

        if (!players) {
          return [currentState, "❌ Error: No hay datos de jugadores disponibles."];
        }

        const usersData = Object.keys(players).map(name => {
          const playerData = players[name];
          return {
            name: name,
            points: playerData.points || 0
          };
        });

        usersData.sort((a, b) => b.points - a.points);
        const top5 = usersData.slice(0, 5);

        let rankingText = top5.map((u, i) => `${i + 1}. ${u.name} (${u.points})`).join(' --- ');

        return [currentState, `🏆 Top 5 global: ${rankingText}`];
      }
    }

  )
}

