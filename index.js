// MODULES UTILISES
// ========================================================
var http 					= require("http");
var mysql 					= require('mysql');
var webRestServer			= require("./webRestServer");
var calculerMoyenneMesures		= require('./calculerMoyenneMesures');
var log					= require('./log');


// PARAMETRAGE
// ========================================================
// Arduino série ----------------------------------------------
GLOBAL.arduinoSerialPort		= "COM7";
GLOBAL.arduinoSerialSpeed		= 9600;
// Web/Rest server ------------------------------------------
GLOBAL.myRestPort 			= process.env.OPENSHIFT_NODEJS_PORT 		|| 8080;		// Pour Openshift
GLOBAL.myIpAddress 			= process.env.OPENSHIFT_NODEJS_IP 			|| 'localhost';	// Pour Openshift
// Connexion mySql -------------------------------------------
GLOBAL.mySqlHost 			= process.env.OPENSHIFT_MYSQL_DB_HOST 		|| "localhost";	// PourOpenshift
GLOBAL.mySqlPort 			= process.env.OPENSHIFT_MYSQL_DB_PORT		|| 3306		// PourOpenshift
GLOBAL.mySqlUser 			= process.env.OPENSHIFT_MYSQL_DB_USERNAME	|| "root";		// PourOpenshift
GLOBAL.mySqlPassword			= process.env.OPENSHIFT_MYSQL_DB_PASSWORD 	|| "root";		// PourOpenshift
// Correction des mesures -----------------------------------
// Ajouter 5hPa pour avoir la pression au niveau de la mer
GLOBAL.correctionPressionNiveauMer	= 5;	
// Fhz des moyennes ------------------------------------------
// Le serveur effectue le calcul
// et stocage des mesures moyennes toutes les 10 mn (en millisecondes) :
GLOBAL.fhzCalculMoyenneMesures	= 5 * 60 * 1000;
// Temps en ms ou bout duquel le contact avec la sonde est considéré comme perdu
// (la sonde envoie normalement une mesure toutes les 10s)
GLOBAL.tempsPerteContactSonde	= 15000;
// Logging parameters ---------------------------------------
GLOBAL.consoleLoggingLevel		= 4; 		// DETAIL
GLOBAL.dbLoggingLevel			= 3;		// INFO
GLOBAL.colorLogging			= true;	// On loggue avec des couleurs en fct du niveau

// VARIABLES GLOBALES
// ========================================================
// Liste des mesures corrigées mais non moyennées
GLOBAL.listeMesuresTemporaires		= [];
// Pour vérifier le contact avec la sonde
GLOBAL.contactSondeOk			= false;	// Au démarrage, aucun contact avec la sonde
GLOBAL.watchDogTimerContactSonde	= {};
// Démarrage Mysql
GLOBAL.sqlPool =  mysql.createPool({
  	host : mySqlHost,
	port : mySqlPort,
  	user : mySqlUser,
  	password: mySqlPassword
});
// Gestion des télécommandes
GLOBAL.commandNew = "00";
GLOBAL.commandActive = "00";
GLOBAL.commandBack = "00";
GLOBAL.commandSent = true;
GLOBAL.commandSyncError = false;
// Analyse des connexion
GLOBAL.adresseGetData = {};
GLOBAL.adresseSetData = {};
GLOBAL.adresseGetLogs = {};

// INITIALISATION
// ========================================================
// REST callback server START ----------------------------------
webRestServer.start();
// On calcule la moyenne des données à la fhz donnée -----------
setInterval(calculerMoyenneMesures, fhzCalculMoyenneMesures);
