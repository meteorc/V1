// Used MODULES
// ========================================================
var colors 			= require('colors');
var mysqlStringEscape		= require('./mysqlStringEscape');

// Outil de log
// ========================================================
// LA VARIABLE consoleLoggingLevel est GLOBALE dans index.js
// LA VARIABLE dbLoggingLevel est GLOBALE dans index.js

// On ne loggue que les évènements de niveau inférieur ou égal à consoleLoggingLevel :
// 4 : => logging de tout : DETAIL + INFO + WARNING + ERROR + ALWAYS
// 3 : => logging de : INFO + WARNING + ERROR + ALWAYS
// 2 : => logging de : WARNING + ERROR + ALWAYS
// 1 : => logging de : ERROR +ALWAYS
// 0 : => logging de seulement ALWAYS (notamment les erreurs de logging)

// Idem pour le logging dans la bd avec dbLoggingLevel

// Log colors setting
// ========================================================
colors.setTheme({
	detail:"grey",
	info: 'green',
	warning: 'yellow',
	error: 'red',
	errorLog:'red',
	always: 'cyan'
});

// Time stamp formatting functions
// =============================================
// Renvoie un nombre strictement inférieur à 100 formaté au format xx, sinon renvoie le nombre
function xxFormat(nombre) {
	return nombre < 10 ? "0" + nombre : nombre;
};
// Renvoie un nombre strictement inférieur à 1000 formaté au format xxx, sinon renvoie le nombre
function xxxFormat(nombre) {
	return nombre < 10 ? "00" + nombre : (nombre < 100 ? "0" + nombre : nombre) ;
};
// Renvoie un date au format JJ/MM/AAAA
function jjmmaaaaFormat(date) {
	var j = xxFormat(date.getDate());
	var m = xxFormat(date.getMonth() + 1);
	var a = xxFormat(date.getFullYear());
	var jjmmaaaa = j + "/" + m + "/" + a ;
	return jjmmaaaa;
};
// Renvoie un heure au format hh:mm:ss
function hhmmssFormat(date) {
	var h = xxFormat(date.getHours());
	var mn = xxFormat(date.getMinutes());
	var s = xxFormat(date.getSeconds());
	var hhmmss = h + ":" + mn + ":" + s ;
	return hhmmss;
};
// Renvoie un heure au format hh:mm:ss.mmm (millisecondes)
function hhmmssMilliFormat(date) {
	var ms= xxxFormat(date.getMilliseconds());
	var hhmmssMilli = hhmmssFormat(date) + "." + ms ;
	return hhmmssMilli;
};

// Fonction de LOG :
// Trois niveaux :
// -DETAIL 		- code numérique : 4
// -INFO 		- code numérique : 3
// -WARNING 	- code numérique : 2
// -ERROR 		- code numérique : 1
// -ALWAYS 		- code numérique : 0 : ne peut-être caché
// ========================================================
function log(niveau,module,texte) {
	var maintenant = new Date();
	var horodatage = "";
	horodatage	+= jjmmaaaaFormat(maintenant) + " ";
	horodatage	+= hhmmssMilliFormat(maintenant);
	switch (niveau) {
		case "DETAIL":
			var niveauNum = 4;
			break;
		case "INFO":
			var niveauNum = 3;
			break;
		case "WARNING":
			var niveauNum = 2;
			break;
		case "ERROR":
			var niveauNum = 1;
			break;
		case "ALWAYS":
			var niveauNum = 0;
			break;
		default:
			var niveauNum = 0;
			niveau = "ERREUR DE NIVEAU DE LOGGING";
			break;
	}
	if (niveauNum <= consoleLoggingLevel) {
		// On logue selon la couleur
		var texteAlogguer = horodatage  + " [" + module + "] " + texte;
		if (colorLogging) {
			switch (niveau) {
				case "DETAIL":
					console.log(texteAlogguer.detail);
					break;
				case "INFO":
					console.log(texteAlogguer.info);
					break;
				case "WARNING":
					console.log(texteAlogguer.warning);
					break;
				case "ERROR":
					console.log(texteAlogguer.error);
					break;
				case "ALWAYS":
					console.log(texteAlogguer.always);
					break;
				default:
					console.log(texteAlogguer.errorLog);
					break;
			}
		}
		else {
			console.log(texteAlogguer + "\r\n");
		}
	}
	if (niveauNum <= dbLoggingLevel) {
		// On ajoute à la base
		sqlPool.getConnection(function(err, connection){
			// S'il y a une erreur de connexion
			if (err) {
				console.log("Connexion à la base impossible : " + JSON.stringify(err)) ;
			}
			// Sinon tout est ok
			else {
				var queryString = "INSERT INTO log (TS,niveau,module,texte) VALUES (" 
					+ maintenant.getTime() + "," 
					+ "\"" + niveauNum + "\"," 
					+ "\"" + mysqlStringEscape(module) + "\"," 
					+ "\"" + mysqlStringEscape(texte) + "\""
					+")";
				connection.query("use meteo");
				connection.query(queryString,  function(err, rows){
					if(err)	{
						console.log("ERREUR : lors de l'ajout de la mesure moyenne à la base" );
						console.log("ERREUR : " + JSON.stringify(err));
						console.log("------------------------------------------------");
					}
				});
				connection.release();
			}
		});
	}
}

// Export the function
// ========================================================
module.exports = log;
