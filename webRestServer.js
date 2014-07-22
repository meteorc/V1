// MODULES UTILISES
// ========================================================
var express 		= require('express');
var log			= require('./log');

// enregistrerAdresseIp
// Enregistre l'adresse dans l'objetTrace indiqué
// ========================================================
function enregistrerAdresseIp(adresse,objetTrace) {
	// Si l'adresse existe déjà, on ajoute 1 au nb de connexions
	if (adresse in objetTrace) {
		objetTrace[String(adresse)] += 1 ;
	}
	else {
		// Sinon on ajoute l'adresse
		objetTrace[String(adresse)] = 1;
	}
}


// START, fonction exportée
// ========================================================
function start() {
	// Express instance
	var app = express();
	app.use(express.urlencoded());
	app.use(express.json());

	// For all static files in the WWW subdirectory
	// ==========================================
	app.get("/www/*", function(req, res){
		// No log for débugging the rest
		// log("INFO",module.filename,"Static file transfer : " + __dirname + "/www/" + req.params);
		res.sendfile( __dirname + "/www/" + req.params); 
	});
	
	// For GET DATA requests
	// ==========================================
	app.get("/getData", function(req, res){
		// On trace l'adresse IP
		var adresseIpPort = req.connection.remoteAddress + ":" +  req.connection.remotePort;
		enregistrerAdresseIp(req.connection.remoteAddress,adresseGetData);
		// On log l'adresse IP/port du client
		log("DETAIL",module.filename,"GETDATA from IP@ : " + adresseIpPort) ;
		// Callback pour renvoyer les données de température moyennes selon l'extraction de la base
		var callbackApresRequeteSql = function(sqlResult) {
			var jsonResponse = {"listeMesures":sqlResult,"contactSondeOk":contactSondeOk,"commandBack":commandBack,"commandSyncError":commandSyncError};
			// The JSON response is sent
			res.json(jsonResponse);
		}
		// Si le paramètre "depuis" est absent
		if (!req.query.depuis) {
			log("ERROR",module.filename,"Le paramètre \"depuis\" est absent de la requête.") ;
			return res.json(404, '404 Not Found');
		}
		// Si le paramètre "depuis" est un entier
		if (!isNaN(req.query.depuis) && parseInt(Number(req.query.depuis)) == req.query.depuis) {
			// On interroge la base
			sqlPool.getConnection(function(err, connection){
				// S'il y a une erreur de connexion
				if (err) {
					log("ERROR",module.filename,"Connexion à la base impossible : " + JSON.stringify(err)) ;
					return res.json(404, '404 Not Found');
				}
				// Sinon tout est ok
				else {
					var TSinitial = new Date().getTime() - req.query.depuis;
					var queryString = "select * from mesures where TS > " + TSinitial + " order by TS";
					connection.query("use meteo");
					connection.query(queryString,  function(err, rows){
						if (err) {
							log("ERROR",module.filename,"Pb de query lors de la requête getData : " + JSON.stringify(err)) ;
							return res.json(404, '404 Not Found');
						}
						else{
							callbackApresRequeteSql(rows);
						}
					});
					connection.release();
				}
			});
		}
		// Si le paramètre "depuis" n'est pas un entier
		else {
			log("ERROR",module.filename,"Le paramètre \"depuis\" n'est pas un entier.") ;
			return res.json(404, '404 Not Found');
		}
	});
	
	// For GET LOGS requests
	// ==========================================
	app.get("/getLogs", function(req, res){
		// On log l'adresse IP/port du client
		var adresseIpPort = req.connection.remoteAddress + ":" +  req.connection.remotePort;
		enregistrerAdresseIp(req.connection.remoteAddress,adresseGetLogs);
		log("DETAIL",module.filename,"GETLOGS from IP@ : " + adresseIpPort) ;
		// Callback pour renvoyer les données de log selon l'extraction de la base
		var callbackApresRequeteSql = function(sqlResult) {
			var jsonResponse = {
				"listeLogs":sqlResult,
				"adresseGetData":adresseGetData,
				"adresseSetData":adresseSetData,
				"adresseGetLogs":adresseGetLogs			
			};
			// The JSON response is sent
			res.json(jsonResponse);
		}
		// Si le paramètre "nb_lignes" est absent
		if (!req.query.nb_lignes) {
			log("ERROR",module.filename,"Le paramètre \"nb_lignes\" est absent de la requête.") ;
			return res.json(404, '404 Not Found');
		}
		// Si le paramètre "nb_lignes" est un entier
		if (!isNaN(req.query.nb_lignes) && parseInt(Number(req.query.nb_lignes)) == req.query.nb_lignes) {
			// On interroge la base
			sqlPool.getConnection(function(err, connection){
				// S'il y a une erreur de connexion
				if (err) {
					log("ERROR",module.filename,"Connexion à la base impossible : " + JSON.stringify(err)) ;
					return res.json(404, '404 Not Found');
				}
				// Sinon tout est ok
				else {
					var TSinitial = new Date().getTime() - req.query.depuis;
					var queryString = "select * from log order by id desc limit " + req.query.nb_lignes;
					connection.query("use meteo");
					connection.query(queryString,  function(err, rows){
						if (err) {
							log("ERROR",module.filename,"Pb de query lors de la requête getLogs : " + JSON.stringify(err)) ;
							return res.json(404, '404 Not Found');
						}
						else{
							callbackApresRequeteSql(rows);
						}
					});
					connection.release();
				}
			});
		}
		// Si le paramètre "depuis" n'est pas un entier
		else {
			log("ERROR",module.filename,"Le paramètre \"nb_lignes\" n'est pas un entier.") ;
			return res.json(404, '404 Not Found');
		}
	});
	
	// Message sent to server
	// ==========================================
	app.post('/setData', function(req, res) {
		// ???????????????????????????????????????????
		// ToDo : vérifier que les données sont correctes
		// ???????????????????????????????????????????
		// On a le contact avec la sonde
		// On resette le watchdog timer de contact sonde
		clearTimeout(watchDogTimerContactSonde);
		if (!contactSondeOk) {
			contactSondeOk = true;
			log(
				"WARNING",
				module.filename,
				"Reprise de contact avec la sonde."
			);
		}
		// On trace l'adresse IP
		var adresseIpPort = req.connection.remoteAddress + ":" +  req.connection.remotePort;
		enregistrerAdresseIp(req.connection.remoteAddress,adresseSetData);
		// On récupère les paramètres
		var derniereMesure = req.body;
		commandBack = derniereMesure.cmd;
		// On passe de KpA à hpA
		derniereMesure.P = derniereMesure.P*10 + correctionPressionNiveauMer;
		// On ajoute à la liste des mesures
		listeMesuresTemporaires.push(derniereMesure);
		// On resette le watchdog timer de contact sonde
		watchDogTimerContactSonde = setTimeout(function() {
				contactSondeOk = false;
				log(
					"WARNING",
					module.filename,
					"Pas de contact avec la sonde depuis plus de " + tempsPerteContactSonde/1000 + "s."
				);
			},
			tempsPerteContactSonde
		);
		// On trace
		// On log l'adresse IP/port du client et la mesure
		log(
			"DETAIL",
			module.filename,
			"SETDATA from IP@ : " 
			+ adresseIpPort
			+ ", T_int=" + derniereMesure.T_int
			+ ", P=" + derniereMesure.P 
			+ ", ram=" + derniereMesure.ram
			+ ", cmd=" + derniereMesure.cmd) ;
		// On gère le message de commande
		if (commandSent) {
			// On vérifie que le retour de commande correspond bien à la commande active
			if (commandBack != commandActive) {
				commandSyncError = true;
				
				// ToDO ??????????????????????????????????
				// Remettre la syncError à zéro si les choses se resynchronisent
				// ToDO ??????????????????????????????????
				
				log(
					"ERROR",
					module.filename,
					"Commande non synchronisée, commandBack : " +  commandBack + ", commandActive : " +  commandActive
				) ;
				// On tente de renvoyer la commande jusqu'à ce qu'il y ait synchro
				// On envoie la commande
				res.set('Action', commandActive);
				commandSent = true;
				// On loggue
				log(
					"INFO",
					module.filename,
					"Commande : " +  commandNew + " renvoyée à l'Arduino." 
				) ;
			}
		}
		else {
			// On envoie la commande si la nouvelle commande est différente de la commande active
			if (commandNew !=commandActive) {
				// On envoie la commande
				res.set('Action', commandNew);
				// On change la nouvelle commande active
				commandActive = commandNew;
				commandSent = true;
				// On loggue
				log(
					"INFO",
					module.filename,
					"Commande : " +  commandNew + " envoyée à l'Arduino." 
				) ;
			}
		
		}
		return res.json(201, '201 Created')
	});
	
	// RC Message sent to server
	// ==========================================
	app.post('/setCommand', function(req, res) {
		// On récupère la commande
		commandNew = req.body.command;
		commandSent = false;
		// On log l'adresse IP/port du client et la mesure
		log(
			"INFO",
			module.filename,
			"SETCOMMAND from IP@ : " 
			+ req.connection.remoteAddress 
			+ ":" 
			+  req.connection.remotePort
			+ ", nouvelle commande : " + commandNew) ;
		// Response OK created
		return res.json(201, '201 Created')
	});
	
	// REST server start
	// ===================================================
	//app.listen(myRestPort);
	app.listen(myRestPort, myIpAddress, function () {
		log("ALWAYS",module.filename,"Démarrage : WEB/REST server IP@ : " + myIpAddress + ":" + myRestPort) ;
	});

	
}


// EXPORT DU MODULE
// ===================================================
exports.start = start;
