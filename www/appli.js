// Paramètres
intituleDuree = {
	"7200000":		"Depuis 2 heures",
	"21600000":	"Depuis 6h",
	"43200000":	"Depuis 12h",
	"86400000":	"Depuis 1 jour",
	"604800000":	"Depuis 1 semaine",
	"2678400000":	"Depuis 1 mois",
	"31536000000":	"Depuis 1 an"
};

intuleCommande = {
	"00":	"éteint",
	"01":	"hors gel",
	"10":	"réduit",
	"11":	"confort"
}
// Variable globale
var donnees = {};
var commandSent = false;

// Get et affiche les données
var obtenirEtAfficherDonnees = function() {
	if (!hold) { 
		// On éteint la LED pour montrer qu'il y a un polling
		$("#colorLed1").attr("stop-color","#000000");
		// On fait la requête Ajax
		$.ajax({ 
			type: 'GET',
			url: "../getData",
			data:{"depuis":$("#zoneDepuis").val()},	// selon le depuis sélectionné
			success : function(data, status, xhr ) {
				// Si il y a des données
				if (data.listeMesures.length != 0) {
					var derniereMesure = data.listeMesures[data.listeMesures.length - 1];
					// On affiche les données
					$("#zoneTemperatureInterne").html(derniereMesure.T_int + " °C");
					$("#zonePression").html(derniereMesure.P +" hPa");
					// On affiche la date et heure de la dernière mesure
					$("#zoneDateHeureDerniereMesure").html(transformerTsEnDateHeure(derniereMesure.TS));
					// On affiche les courbes
					donnees = data.listeMesures;
					dessinerCourbes(donnees);
				}
				// Dans tous les cas
				// On affiche les données de commandes
				// "commandBack":commandBack,"commandSyncError":commandSyncError
				if (data.commandSyncError) 	$("#zoneStatusCommande").removeClass("ok").addClass("error");
				else					$("#zoneStatusCommande").removeClass("error").addClass("ok");
				// On affiche le retour d'affichage
				$("#zoneStatusCommande").html(intuleCommande[data.commandBack]);
				// Si la commande vient d'être envoyée, on remet l'indicateur commandSent à false qd la commande back == la commande
				if (commandSent) {
					if (data.commandBack == $("#zoneSaisieCommande").val()) 	commandSent = false;
				}
				// On sélectionne la valeur du retour d'affichage si la commande ne vient pas d'être envoyée
				else {
					$('#zoneSaisieCommande option[value="' + data.commandBack + '"]').prop('selected', true);
				}
				// On affiche l'état serveur
				afficherEtatReseau(true,data.contactSondeOk,data.contactSondeOk);
			},
			error : function(e) {
				afficherEtatReseau(false);
			},
			dataType: 'json'
		});
	}
};

// Allume les leds de l'état du réseau
var afficherEtatReseau = function(etatLienServeur,etatLienBox,etatLienArduino,etatLienRadiateur) {
	// Si on a le lien avec le serveur
	if (etatLienServeur) {
		$("#colorLed1").attr("stop-color","#00ff00");
		// Si on a le lien avec la box
		if (etatLienBox) {
			$("#colorLed2").attr("stop-color","#00ff00");
			// Si on a le lien avec l'Arduino
			if (etatLienArduino) 	$("#colorLed3").attr("stop-color","#00ff00");
			else				$("#colorLed3").attr("stop-color","#ff0000");
		}
		// Sinon, pas de lien avec la box
		else {
			$("#colorLed2").attr("stop-color","#ff0000");
			// Si on a le lien avec l'Arduino
			if (etatLienArduino) 	$("#colorLed3").attr("stop-color","#00ff00");
			else				$("#colorLed3").attr("stop-color","#ff0000");			
		}
	}
	// Sinon lien cassé avec le serveur
	else {
		$("#colorLed1").attr("stop-color","#ff0000");
		$("#colorLed2").attr("stop-color","#000000");
		$("#colorLed3").attr("stop-color","#000000");
	}
}

// Dessiner la courbe des températures
var dessinerCourbes = function(listeMesures) {
	// On prépare les données
	var arrayMesuresTemperatureInterne = [];
	var arrayMesuresTemperatureExterne = [];
	var arrayMesuresPression = [];
	// On récupère les données
	for (index in listeMesures) {
		var mesureCourante= listeMesures[index];
		// On génère l'array des mesures de pression
		var mesurePressionCourante = [mesureCourante.TS,mesureCourante.P];
		arrayMesuresPression.push(mesurePressionCourante);
		// On génère l'array des mesures de températures internes
		var mesureTemperatureInterne = [mesureCourante.TS,mesureCourante.T_int];
		arrayMesuresTemperatureInterne.push(mesureTemperatureInterne);
		// On génère l'array des mesures de températures externes
		var mesureTemperatureExterne = [mesureCourante.TS,0];
		arrayMesuresTemperatureExterne.push(mesureTemperatureExterne);
	}
	// On passe en français
	Highcharts.setOptions({
		global: {
			useUTC: false
		},
		lang: {
			months: mois,
			weekdays: jourSemaine,
			shortMonths: moisCourts,
			decimalPoint: ',',
			downloadPNG: 'Télécharger en image PNG',
			downloadJPEG: 'Télécharger en image JPEG',
			downloadPDF: 'Télécharger en document PDF',
			downloadSVG: 'Télécharger en document Vectoriel',
			loading: 'Chargement en cours...',
			printChart: 'Imprimer le graphique',
			resetZoom: 'Réinitialiser le zoom',
			resetZoomTitle: 'Réinitialiser le zoom au niveau 1:1',
			thousandsSep: ' '
		}
	    });
	// On dessine la courbe des températures
	$('#zoneDessinTemperatures').highcharts({
		chart: {
			type: 'line',
			zoomType: 'x'
		},
		title: {text: intituleDuree[$("#zoneDepuis").val()]},
		xAxis: {
			type: 'datetime',
			dateTimeLabelFormats:{
				second: '%H:%M:%S',
				minute: '%H:%M',
				hour: '%H:%M',
				day: '%e. %b',
				week: '%e. %b',
				month: '%b %y',
				year: '%Y'
			}
		},
		yAxis: {
			title: {text: 'Température (°C)'}
		},
		tooltip: {
			pointFormat: '{point.y:.1f} °C',
			dateTimeLabelFormats:{
				second: '%d/%m/%Y %H:%M:%S',
				minute: '%d/%m/%Y %H:%M:%S',
				hour: '%d/%m/%Y %H:%M:%S',
				day: '%d/%m/%Y %H:%M:%S',
				week: '%d/%m/%Y %H:%M:%S',
				month: '%d/%m/%Y %H:%M:%S',
				year: '%d/%m/%Y %H:%M:%S',
			}
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0,
		},
		series: [
			{
				name: 'intérieure',
				data: arrayMesuresTemperatureInterne,
				lineWidth: 1,
				showInLegend: false,
				marker:{radius:1.5}
			},
			{
				name: 'extérieure',
				data: arrayMesuresTemperatureExterne,
				lineWidth: 1,
				showInLegend: false,
				marker:{radius:1.5}
			}
		],
		plotOptions: {
			line: {animation: false}		// Pas d'animation au tracé de la ligne
		}
        });
	// On dessine la courbe des pressions
	if (hold) {
		$('#zoneDessinPressions').highcharts({
			chart: {
				type: 'line',
				zoomType: 'x'
			},
			title: {text: intituleDuree[$("#zoneDepuis").val()]},
			xAxis: {
				type: 'datetime',
				dateTimeLabelFormats:{
					second: '%H:%M:%S',
					minute: '%H:%M',
					hour: '%H:%M',
					day: '%e. %b',
					week: '%e. %b',
					month: '%b %y',
					year: '%Y'
				}
			},
			yAxis: {
				title: {text: 'Pression (hPa)'},
				// min:950,
				// max:1050,
			},
			tooltip: {
				pointFormat: '{point.y:.1f} hpA',
				dateTimeLabelFormats:{
					second: '%d/%m/%Y %H:%M:%S',
					minute: '%d/%m/%Y %H:%M:%S',
					hour: '%d/%m/%Y %H:%M:%S',
					day: '%d/%m/%Y %H:%M:%S',
					week: '%d/%m/%Y %H:%M:%S',
					month: '%d/%m/%Y %H:%M:%S',
					year: '%d/%m/%Y %H:%M:%S',
				}
			},
			series: [{
				name: 'pression',
				data: arrayMesuresPression,
				showInLegend: false,		// Ne pas faire apparaitre le nom de la série
				lineWidth: 1,
				marker:{radius:1.5}
			}],
			plotOptions: {
				line: {animation: false}		// Pas d'animation au tracé de la ligne
			}
		});
	}
	else {
		$('#zoneDessinPressions').highcharts({
			chart: {
				type: 'line',
				zoomType: 'x'
			},
			title: {text: intituleDuree[$("#zoneDepuis").val()]},
			xAxis: {
				type: 'datetime',
				dateTimeLabelFormats:{
					second: '%H:%M:%S',
					minute: '%H:%M',
					hour: '%H:%M',
					day: '%e. %b',
					week: '%e. %b',
					month: '%b %y',
					year: '%Y'
				}
			},
			yAxis: {
				title: {text: 'Pression (hPa)'},
				min:950,
				max:1050,
			},
			tooltip: {
				pointFormat: '{point.y:.1f} hpA',
				dateTimeLabelFormats:{
					second: '%d/%m/%Y %H:%M:%S',
					minute: '%d/%m/%Y %H:%M:%S',
					hour: '%d/%m/%Y %H:%M:%S',
					day: '%d/%m/%Y %H:%M:%S',
					week: '%d/%m/%Y %H:%M:%S',
					month: '%d/%m/%Y %H:%M:%S',
					year: '%d/%m/%Y %H:%M:%S',
				}
			},
			series: [{
				name: 'pression',
				data: arrayMesuresPression,
				showInLegend: false,		// Ne pas faire apparaitre le nom de la série
				lineWidth: 1,
				marker:{radius:1.5}
			}],
			plotOptions: {
				line: {animation: false}		// Pas d'animation au tracé de la ligne
			}
		});
	}
};
// Variables globales ---------------------------------------
var hold = false;

// Initialisation --------------------------------------------
$(document).ready(function () {
	// On met la led de contact sonde éteinte
	$("#colorLed2").attr("stop-color","#000000");
	// Fonction de gestion du bouton HOLD
	var releaseHold = function() {
		$("#boutonHold").html('Hold');
		hold = false;
		$("#boutonHold").removeClass('btn-warning');
		$("#boutonHold").addClass('btn-primary');
		dessinerCourbes(donnees);
	}
	var pushHold = function() {
		$("#boutonHold").html('Release');
		hold =  true;
		$("#boutonHold").removeClass('btn-primary');
		$("#boutonHold").addClass('btn-warning');
		// On affiche pour le changement d'échelle verticale
		dessinerCourbes(donnees);
	}
	// Si on appuie sur HOLD
	$("#boutonHold").click(function(){
		if (hold) 	releaseHold(); 	// On release
		else 		pushHold(); 	// On hold
	});
	// Si on change la durée d'affichage
	$("#zoneDepuis").change(function() {
		// On supprime l'éventuel hold
		if (hold) 	releaseHold();
		// On raffraichit les données
		obtenirEtAfficherDonnees();
	});
	// Si on change la commande
	$("#zoneSaisieCommande").change(function() {
		// On envoie en POST
		commandSent = true;
		$.ajax({ 
			type: 'POST',
			url: "../setCommand",
			headers: { 
				"Content-Type": "application/JSON; charset=utf-8"
			},
			data:JSON.stringify({"command":$("#zoneSaisieCommande").val()}),
			success : function( data ) {
				
			},
			error : function(e) {
				
			},
			dataType: 'json'
		});
	});
	// Initialisation de la date et de l'heure et les données initiales
	afficherDateHeure();
	obtenirEtAfficherDonnees();
	// On réaffiche toutes les secondes
	var interval1 = setInterval(afficherDateHeure, 1000);
	// On affiche les données toutes les 10s
	var interval2 = setInterval(obtenirEtAfficherDonnees, 10000);
});
