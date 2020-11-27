## Loginscherm
### Layout:

  - Inputveld van het emailadres:  (loginForm.username als String)
    > Hierin wordt het emailadres van de gebruiker ingevoerd. 
  - Inputveld van het wachtwoord: (loginForm.password als String)
    > Hierin wordt het wachtwoord van de gebruiker ingevoerd.
  - Verstuurknop van het inlogformulier: (loginForm{ username: "", password: ""})
    > Hier wordt de login API Request geactiveerd.
  - Routerknop naar de registreerpagina
     > Hier wordt de gebruiker naar de registreerpagina gestuurd.
### API Requests:   

  - login ( loginForm.username en loginForm.password)
### API Responses:

  - login antwoord wordt opgeslagen als errorMsg met type: String 

## Registreerscherm
### Layout:

  - Inputveld van emailadres: (registerForm.newEmail als String)
     > Hierin wordt het emailadres van de gebruiker ingevoerd.
  - Inputveld van gebruikersnaam: (registerForm.newUsername als String)
     > Hierin wordt de gebruikersnaam van de gebruiker ingevoerd.
  - Inputveld van de afbeelding: (registerForm.newPicture als Afbeelding(waarschijnlijk als String in base64))
     > Hierin wordt een afbeelding geupload door de gebruiker.
  - Inputveld van het wachtwoord: (registerForm.newPassword als String)
     > Hierin wordt het wachtwoord voor het account ingevoerd.
  - Inputveld van het herhaalde wachtwoord (registerForm.CheckNewPassword als String)
    >  Hierin wordt voor de tweede keer het wachtwoord ingevoerd door de gebruiker.
  - Verstuurknop van het registratieformulier: (registerForm{ newEmail: "", newUsername: "", ..., newPassword: ""})
    >  Hier wordt de signup API Request geactiveerd.
  - Routerknop naar het loginscherm
    >  Hier wordt de gebruiker naar het loginscherm gestuurd.

### API Requests:

  - signup ( this.registerForm.newEmail, this.registerForm.newPassword, this.registerForm.newPicture en this.registerForm.newUsername)
### API Responses:

  - signup antwoord wordt opgeslagen als errorMsg met type: String
## Plattegrond
### Layout:
  - Iframe venster: ({plattegrond}.sozi.html)
    - sozi pagina (svg afbeelding)
     >  Hierin bevindt zich de plattegrond waarin alle kamers een clickfunctie hebben om erheen te gaan
    - Kamerknoppen naar kamer (Kamerobject gegevens opgehaald uit de joinRoom API Request)
     >  Bij het drukken op een Kamerknop eerst de joinRoom API Request geactiveerd;
     >  Hierna wordt het kamerscherm geladen.
  - Verstuurknop om uit te loggen
    >  Hier wordt de logout API Request geactiveerd.
### API Requests:

  - joinRoom (sessionkey, roomId (de id van de html g))
  - logout (sessionkey)

### API Responses:

  - joinRoom antwoord (wat wordt er geantwoord?)
  - logout antwoord (wat wordt er geantwoord?)

## Kamerview
### Layout:
  - De gehele kamer
    > de gehele kamer bestaat voornamelijk uit Userspace en Sidebar.
    - Userspace
      > Dit is een componentruimte waarin alle gebruikerinteractie plaatsvindt van alle gesprekken
    - Sidebar
      > Dit is de componentruimte waarin informatie voor alle gebruikers worden getoont.
    > de overige delen zijn "overlays" voor de gespreksfunctionaliteiten.
    - TimedInfoMessageBox
      > Dit is een popUp voor informatie
    - Conference
      > Dit is een popUp voor het bellen
    - ConformationPrompt
      > Dit is een popUp voor het accepteren van een verzoek
    - TypeConformationPrompt
      > Dit is een popUp voor het specificeren welk type gesprek er gestart moet worden.
### Components:
  - Userspace
    > Toelichting wat er in de component gebeurt.
  - Sidebar
    > Toelichting wat er in de component gebeurt.
  - TimedInfoMessageBox
    > Toelichting wat er in de component gebeurt.
  - Conference
    > Hier wordt de Jitsi venster weergegeven met close/leave knop als de parameter openConference op true staat. De toolbar buttons die bij de Jitsi venster wordt weergegeven worden aangepast naar de rol van de gebruiker (moderator/geen moderator). Wanneer de gebruiker op close/leave knop drukt, dan wordt de Jitsi venster gesloten en de gebruiker wordt uit de conferentie/gesprek verwijderd.
  - ConformationPrompt
    > Hier wordt aan de gebruiker gevraagd of hij/zij de request wil accepteren of weigeren.
  - TypeConformationPrompt
    > Hier wordt aan de gebruiker gevraagd welke type conversatie (gesloten/open/prive) hij/zij wilt.
### API Requests:
  //Alle username moet nog naar sessionKey veranderd worden
  - checkType (username, withWho.user)
  - accpetRequest (username, withWho)
  - declineRequest (username, withWho)
  - closedConversation (username, typeConversationUser, conversation.type)
  - openConversation (username, typeConversationUser, conversation.type)
  - closedConversation (username, typeConversation, conversation.type)
  - joinOpenConversation (username, typeConversationUser)
  - joinClosedConversation (username, typeConversationUser, conversation.type)
  - Conference
    > - onLeaveRoom (username)
    > - onCloseRoom (username)

### API Responses:
  - data.room wordt opgeslagen als conversation.room
  - data.message wordt opgeslagen als info
  
## Admin pagina

### layout:
  - Hoofdscherm
    > deel van het scherm waarin de locatie van de plattegrondbestand kan worden geselecteerd
  - Sidebar
    > deel van het scherm waarin alle gebruikers van alle kamers staan. (hier voegen we geen interacties nog aan toe.)

### Components:
  - FileSelector component
    > Hier wordt een file geselecteerd.
  - Sidebar
    > Lijst met alle gebruikers + zoekfunctie.
 ### API Requests:
 
  - TODO
  

 ### API Responses:
 
  - TODO api voor het opslaan van de file.
  - data.users wordt opgeslagen om in de sidebar te tonen.
