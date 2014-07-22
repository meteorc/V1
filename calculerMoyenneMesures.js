/// BUT DU MODULE :
// - calculer la moyenne d'une liste de mesures et enregistrer cette moyenne dans la base en l'horodatant


// MODULES UTILISES
// ========================================================
var log					= require('./log');

// CALCULER la MOYENNE des MESURES, fonction exportée
// Utilisation des variables globales suivantes :
// - listeMesuresTemporaires
// - sqlPool
// ========================================================
var calculerMoyenneMesures = function() {
	var nb_mesures = listeMesuresTemporaires.length;
	// Si il y a des mesures temporaires
	if (nb_mesures >0) {
		// On crée un objet valeur moyenne
		var valeurMoyenne = {"T_int":0,"P":0};
		// On calcule la somme des mesures temporaires
		for (var index in listeMesuresTemporaires) {
			valeurMoyenne.T_int 	+= listeMesuresTemporaires[index].T_int;
			valeurMoyenne.P 		+= listeMesuresTemporaires[index].P;
		}
		// On arrondi les mesures à 1 chiffre en calculant la moyenne
		valeurMoyenne.T_int 	= Math.round(valeurMoyenne.T_int/nb_mesures*10)/10;
		valeurMoyenne.P 		= Math.round(valeurMoyenne.P/nb_mesures*10)/10;
		log("INFO",module.filename,"Calcul moyenne de " + nb_mesures + " échantillon(s) : T_int = " + valeurMoyenne.T_int + " , P = " + valeurMoyenne.P) ;
		// On ajoute à la base
		sqlPool.getConnection(function(err, connection){
			// S'il y a une erreur de connexion
			if (err) {
				log("ERROR",module.filename,"Connexion à la base impossible : " + JSON.stringify(err)) ;
			}
			// Sinon tout est ok
			else {
				var queryString = "INSERT INTO mesures (TS,T_int,P,nb_mesures) VALUES (" 
					+ sqlPool.escape(new Date().getTime()) 
					+ "," 
					+ sqlPool.escape(valeurMoyenne.T_int)  
					+ "," 
					+ sqlPool.escape(valeurMoyenne.P) 
					+ "," 
					+ sqlPool.escape(nb_mesures) 
					+ ")";
				connection.query("use meteo");
				connection.query(queryString,  function(err, rows){
					if(err)	{
						log("INFO",module.filename,"Erreur lors de l'ajout de la mesure moyenne à la base : " + JSON.stringify(err)) ;
					}
					else{
						log("INFO",module.filename,"Mesure moyenne ajoutée à la base") ;
					}
				});
				connection.release();
			}
		});
		// On supprime les mesures temporaires
		listeMesuresTemporaires = [];
	}
	// Sinon on ne fait rien
}

// EXPORT DU MODULE
// ========================================================
module.exports = calculerMoyenneMesures;

