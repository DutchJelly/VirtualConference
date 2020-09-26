$(document).ready(function() {
	// Initialisatie van de variabelen
	var base_url = location.protocol + '//' + document.domain + ':' + location.port;
	var url = window.location.pathname;
	var mijn_gebruikersnaam = url.substring(url.lastIndexOf('/')+1);

	namespace = "/chat";
	var socket = io.connect(base_url + namespace);

	// Als de gebruiker is connected, registreer de gebruiker
	socket.on('connect', function() {
		socket.emit('registratie', {gebruiker: mijn_gebruikersnaam});
	});

	// Update de lijst met de gebruiker als een gebruiker connected of disconnected is
	socket.on('actieve_gebruikers_lijst', function(msg) {
		if (msg.type == 'connect') {
			var gebruiker_lijst = ''; // Lijst met alle actieve gebruikers
			$.each(msg.data.gebruikers, function(key, value) {
				if (key == mijn_gebruikersnaam) { // Als de gebruiker de huidige gebruiker is
					gebruiker_lijst += '<tr><td><a href="#">'+ key +' (jij)</td></tr>';
				} 
				else { // Als de gebruiker een andere gebruiker is
					gebruiker_lijst += '<tr><td><a href="#" class="gebruiker-lijst" data-id="'+key+'">'+ key +' </td></tr>';
				}
			}); 
			// Update HTML pagina waarbij deze lijst verschijnt
			$('#gebruikers').html(gebruiker_lijst);
		}		
	});

	// Het aanmaken van een chat venster en het verschijnen van berichten die door de gebruikers zijn verstuurd
	socket.on('chat_reactie', function(msg) {
		if ('type' in msg) {
			if (msg.type == 'prive' || msg.type == 'groep') {
				if (msg.type == 'groep') { // Als het een groepschat is
					var chat_id = 'groepen_' + msg.data.groep;
					var chat_header = 'Groep: ' + msg.data.groep;
					var chat_body = 'groepen_' + mijn_gebruikersnaam + '_' + msg.data.groep;
					var chat_input = 'groepen_chat_' + msg.data.groep;
					var geschiedenis = 'geschiedenis' + chat_body;
				} 
				else { // Als het een prive chat is 
					var chat_id = msg.data.gebruiker;
					var chat_header = msg.data.gebruiker;
					var chat_body = mijn_gebruikersnaam + '_' + msg.data.gebruiker;
					var chat_input = 'chat_' + msg.data.gebruiker;	
					var geschiedenis = 'geschiedenis' + chat_body;
				}
				// Het aanmaken van een chat-venster
				var add_chat_html = `
					<div id="`+chat_id+`">
						<div class="panel" >
							<div class="panel-heading"><b> `+chat_header+` </b> 
								<button class="button_style sluit-chat" style="cursor:pointer" data-id="`+chat_id+`"; return false">sluiten</button> 
							</div>
							<div id="`+chat_body+`" class="panel-body" style="height: 300px;overflow:auto;">
								<div id="`+geschiedenis+`"></div>
							</div>
							<div>
								<form id="`+chat_id+`" action="#" class="form-inline message-form">
									<input type="hidden" data-id="`+chat_id+`" id="sid" name="sid">
									<div>
										<textarea placeholder="Type een bericht..." rows="1" name="`+chat_input+`" id="`+chat_input+`"></textarea>
									</div>
									<div class="form-group">
										<input type="submit" value="verzenden">
									</div>
								</form>
							</div>
						</div>
					</div>`;
				// Update HTML pagina
				$('#chat').append(add_chat_html); 

				var lijst = ''; // Het aanmaken van een lijst met chat geschiedenis voor elke openstaande chat
				$.each(msg.data.lijst, function(key, value) {
					lijst += '<div class="clearfix" style="height: 33px; text-align:center;">'+value+'</div>';
				})
				// Update HTML chat venster waarbij de chat geschiedenis verschijnt
				$('#'+geschiedenis).html(lijst);
			} 
			else if (msg.type == 'prive_bericht') { // Het verschijnen van prive bericht die door een andere gebruiker is verstuurd
                var ontvangen_bericht = '<div class="clearfix" style="height: 33px; text-align:left;"><strong>'+msg.data.van+'</strong>'+msg.data.tekst+'</div>';
                // Update HTML chat venster waarbij de bericht verschijnt
        		$('#'+mijn_gebruikersnaam+'_'+msg.data.van).append(ontvangen_bericht);
        	} 
        	else { // Het verschijnen van groepsbericht
				var van_gebruiker = ''; // Diegene die de bericht heeft gestuurd
				var class_tekst = ''; // De inhoud van het bericht

				if (msg.data.van == mijn_gebruikersnaam){ // Als de huidige gebruiker een bericht heeft gestuurd
					van_gebruiker = mijn_gebruikersnaam;
					class_tekst = "right"; // Het bericht zal aan de rechterkant verschijnen
				} 
				else { // Als een andere gebruiker een bericht heeft gestuurd
					van_gebruiker = msg.data.van;
					class_tekst = "left"; // Het bericht zal aan de linkerkant verschijnen
				}
				var ontvangen_bericht = '<div class="clearfix" style="height: 33px; text-align:'+class_tekst+';"><strong>'+van_gebruiker+'</strong> '+msg.data.tekst+'</div>';	
				// Update HTML chat venster waarbij het bericht vershijnt
        		$('#groepen_' + mijn_gebruikersnaam + '_' + msg.data.groep).append(ontvangen_bericht);
        	}
		}
	});

	// Het verschijnen van een lijst met alle gebruikers waarbij de huidige gebruiker op namen kunnen 
	// klikken om ze zo in de nieuw door de huidige gebruiker aangemaakt groepschat te zetten
	socket.on('lijst_groep_aanmaken', function(msg) {
		var naam_lijst = ''; // Lijst met alle gebruikers
		var groepsnaam = msg.data.groep; // De naam van de groep die door de huidige gebruiker is gegeven
		var lijst_html = `
			<div id="lijst" class="naamlijst" action="#">
				<div id="lijst_body">
					<div id="groepsnaam" name="groepsnaam">** Kies hieronder de groepsleden voor groep: `+groepsnaam+` ** </div>
					<div id="namen_lijst"></div>
					<button type="button" class="aanmaken" style="float: center">aanmaken</button>
				</div>
            </div>`;
        // Update HTML pagina waarbij deze lijst verschijnt
        $('#naamlijst').html(lijst_html);

		$.each(msg.data.lijst, function(key, value) { // Het ophalen van alle namen van de gebruikers
			naam_lijst += '<div style="height: 33px;"><a href="#" class="groep_gebruiker" data-id="'+value+'">'+value+'</div>';
		})
		// Update HTML lijst waarbij de lijst met de namen van de gebruikers wordt gevuld
		$('#namen_lijst').html(naam_lijst);
	});

	// Het verschijnen van alle groepschatten waarvan de huidige gebruiker deel uitmaakt
	socket.on('groep_lijst', function(msg) {
		var groep_lijst = ''; // Lijst van alle groepschatten van de huidige gebruiker
		var groep_id = 'groepen_'+mijn_gebruikersnaam;
		var groep_html = `<div id="`+groep_id+`"></div>`;
		// Update HTML pagina met deze lijst 
		$('#groepen').html(groep_html);
		
		$.each(msg.data.groep, function(key, value) { // Het ophalen van alle groepschatten van de huidige gebruiker
			groep_lijst += '<tr><td><a href="#" class="join_groep" data-id="'+value+'">'+value+'</td><tr>';
		})
		// Update HTML lijst met alle groepschatten van de huidige gebruiker
		$('#groepen_'+mijn_gebruikersnaam).html(groep_lijst);
	});

	// Het verschijnen van alert-berichten
	socket.on('alert_bericht', function(msg) {
		var tekst = msg.bericht;
		alert(tekst);
	})

	// Het verschijnen van de prive bericht die door de huidige gebruiker zelf is verstuurd
	socket.on('eigen_bericht', function(msg) {
		var bericht = '<div class="clearfix" style="height: 33px; text-align: right"><strong>'+mijn_gebruikersnaam+'</strong>'+msg.data.tekst+'</div>';
        $('#'+mijn_gebruikersnaam+'_'+msg.data.naar).append(bericht); // Het verschijnen van bericht
        $('#chat_'+msg.data.naar).val(''); // Het legen van de tekstveld waar een bericht getypet kan worden
	});

	// Huidige gebruiker kan met een andere gebruiker prive chat beginnen door op zijn naam te klikken
	$(document).on('click', '.gebruiker-lijst', function(msg) {
		var gebruiker_naam = $(this).data('id'); // De naam van de gebruiker met wie de huidige gebruiker een chat begint
		socket.emit('prive_bericht', {gebruiker: gebruiker_naam}); // Het aanmaken van een chat venster
		return false;
	});

	// Het uitvoeren van submit actie om berichten te versturen
	$(document).delegate('form', 'submit', function(event) {
		var $form = $(this);
		var vriend_id = $form.attr('id'); // De gebruiker naar wie de bericht wordt verstuurd
		var tekst = $form[0][1].value; // Te versturen bericht

		if (vriend_id.match("^groepen_")){ // Het versturen van groepsbericht
            groep_naam = vriend_id.substring(vriend_id.lastIndexOf('_')+1);
            vriend_id = groep_naam; // De naam van de groepschat
            $('#groepen_chat_'+groep_naam).val(''); // Het legen van de tekstveld waar een bericht getypet kan worden
			socket.emit('groep_verzenden', {vriend: vriend_id, tekst: tekst}); // Het verschijnen van bericht
			var soort = 'groep'; // Type bericht
		} 
		else{ // Het versturen van privebericht
			socket.emit('mijn_bericht', {vriend: vriend_id, tekst: tekst}); // Het verchijnen van bericht in de chatvenster van de huidige gebruiker
			socket.emit('prive_verzenden', {vriend: vriend_id, tekst: tekst}); // Het verschijnen van bericht in de chatvenster van een andere gebruiker
			var soort = 'prive'; // Type bericht
		}
		socket.emit('geschiedenis', {vriend: vriend_id, tekst: tekst, soort: soort}); // De bericht opslaan in de database
		return false;
	});

	// Het doorgeven van een groepsnaam om een groepschat aan te maken
	$(document).on('click', '.groep_aanmaken', function(event) {
		var groep_naam = $('#groep_naam').val(); // De naam van de groepschat
		socket.emit('groep_naam', {groep: groep_naam}); 
		return false;
	});

	// Het toevoegen van een gebruiker in de nieuw aangemaakt groepschat door op een gebruiker
	// te klikken uit de gebruikerslijst die bij het aanmaken van een groepschat verschijnt
	$(document).on('click', '.groep_gebruiker', function() {
		var groepslid = $(this).data('id'); // De geselecteerde gebruiker
		var groepsnaam = $('#groep_naam').val(); // De naam van de groepschat
		socket.emit('groep_gebruiker', {naam: groepslid, groep: groepsnaam});
		return false;
	});

	// Het definitief aanmaken van een groepschat nadat de huidige gebruiker
	// klaar is met het kiezen van alle groepsleden voor deze groepschat
	$(document).on('click', '.aanmaken', function() {
		var groepsnaam = $('#groep_naam').val(); // De naam van de groepschat
		$('#groep_naam').val(''); // Het legen van de tekstveld waar de groepsnaam ingevuld kan worden om een nieuwe groepschat aan te kunnen maken
		$('#lijst_body').remove(); // De lijst met alle gebruikers wordt weggehaald
		socket.emit('aanmaken_groep', {groep: groepsnaam});
		return false;
	});

	// Door op een groepschat te klikken kan de gebruiker deze groep join
	$(document).on('click', '.join_groep', function() {
		var groep_naam = $(this).data('id'); // De naam van de groepschat
		socket.emit('join_groep', {groep: groep_naam});
		return false;
	});

	// Door te klikken op 'sluiten' kan de huidige gebruiker de chat sluiten
	$(document).on('click', '.sluit-chat', function() {
		var naam = $(this).data('id'); // De gebruiker naar wie of de groep waarnaartoe de bericht wordt verstuurd

		if(naam.match("^groepen_")) { // Als het een groepschat is 
            groep_naam = naam.substring(naam.lastIndexOf('_')+1); // De naam van de groepschat
            socket.emit('sluit_chat', {vriend: groep_naam});
		}
		else { // Als het een prive chat is
			socket.emit('sluit_chat', {vriend: naam});
		}
		$('#'+naam).remove(); // Het weghalen van de chat venster
		return false;
	});

	// Het uitloggen van een gebruiker door op de button 'log hier uit' te klikken
	$(document).on('click', '.uitloggen', function() {
		uitloggen = '/uitloggen';
		window.location.href = base_url+uitloggen;
		return false;
	});
});
