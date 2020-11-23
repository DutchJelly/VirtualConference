## Loginscherm
### Layout:

  - Inputveld van het emailadres:  (loginForm.username als String)<br>
    > Hierin wordt het emailadres van de gebruiker ingevoerd. 
  - Inputveld van het wachtwoord: (loginForm.password als String)<br>
    Hierin wordt het wachtwoord van de gebruiker ingevoerd.
  - Verstuurknop van het inlogformulier: (loginForm{ username: "", password: ""})<br>
    Hier wordt de login API Request geactiveerd.
  - Routerknop naar de registreerpagina<br>
     Hier wordt de gebruiker naar de registreerpagina gestuurd.
### API Requests:   

  - login ( loginForm.username en loginForm.password)
### API Responses:

  - login antwoord wordt opgeslagen als errorMsg met type: String 

## Registreerscherm
### Layout:

  - Inputveld van emailadres: (registerForm.newEmail als String)<br>
     Hierin wordt het emailadres van de gebruiker ingevoerd.
  - Inputveld van gebruikersnaam: (registerForm.newUsername als String)<br>
     Hierin wordt de gebruikersnaam van de gebruiker ingevoerd.
  - Inputveld van de afbeelding: (registerForm.newPicture als Afbeelding(waarschijnlijk als String in base64))<br>
     Hierin wordt een afbeelding geupload door de gebruiker.
  - Inputveld van het wachtwoord: (registerForm.newPassword als String)<br>
     Hierin wordt het wachtwoord voor het account ingevoerd.
  - Inputveld van het herhaalde wachtwoord (registerForm.CheckNewPassword als String)<br>
     Hierin wordt voor de tweede keer het wachtwoord ingevoerd door de gebruiker.
  - Verstuurknop van het registratieformulier: (registerForm{ newEmail: "", newUsername: "", ..., newPassword: ""})<br>
     Hier wordt de signup API Request geactiveerd.
  - Routerknop naar het loginscherm<br>
     Hier wordt de gebruiker naar het loginscherm gestuurd.

### API Requests:

  - signup ( this.registerForm.newEmail, this.registerForm.newPassword, this.registerForm.newPicture en this.registerForm.newUsername)
### API Responses:

  - signup antwoord wordt opgeslagen als errorMsg met type: String
## Plattegrond
### Layout:
  - Iframe venster: ({plattegrond}.sozi.html)
    - sozi pagina (svg afbeelding)<br>
      Hierin bevindt zich de plattegrond waarin alle kamers een clickfunctie hebben om erheen te gaan
    - Kamerknoppen naar kamer (Kamerobject gegevens opgehaald uit de joinRoom API Request)<br>
      Bij het drukken op een Kamerknop eerst de joinRoom API Request geactiveerd;<br>
      Hierna wordt het kamerscherm geladen.
  - Verstuurknop om uit te loggen<br>
     Hier wordt de loguit API Request geactiveerd.
### API Requests:

### API Responses:


## Kamerview
### Layout:

### API Requests:

### API Responses:

