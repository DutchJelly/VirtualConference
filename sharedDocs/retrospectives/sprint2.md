# Retrospective sprint 2

### issues die niet worden teruggeschoven
> **Gebruikers opvragen** (done)
> de api ondersteunt het request

> **Eisen in backlog schrijven** (ready)
> Dit is helemaal goed gegaan, en er zijn verder geen nieuwe eisen bijgekomen.

> **diagrammen updaten** (ready)
> De diagrammen werkten goed bij de meetings en hoeven niet te worden aangepast.

> **readme aanpassen** (ready)
> De readme is aangepast en hoeft niet weer aangepast te worden.

> **login page (frontend)** (done)
> Het ontwerp van de login pagina is helemaal klaar en heeft geen werk meer nodig.

### issues die we wel terugschuiven

**Kamerview - frontend** (ready)
De kamerview is gemaakt, en werkte voor de demo. Er is besloten dat dit issue echter nog niet helemaal klaar was: de stijl is nog niet helemaal zoals in de ontwerpen, en kan dus nog wat werk gebruiken.

**Userlist - frontend** (ready)
Hier geldt hetzelfde als de kamerview: de stijl (css) moet nog even worden aangepast/geschreven.

**Gesprek management** (ready)
Het gesprek management mist nog de optie om conversatietypes te ondersteunen. Dit moet nog worden toegevoegd aan de backend. Ook zou er met een database gewerkt kunnen/moeten worden zodat de applicatie niet kapot gaan wanneer de backend opnieuw opstart. *dit is een backend issue*

**Login handling** (ready)
Het inloggen werkt nu helemaal op zichzelf alleen met een gebruikersnaam en wachtwoord. Er moet nu met sessies gewerkt worden, en moeten er socket updates worden gegeven 'on-login'.

**Jitsi GUI** (ready)
Op de demo deed de embedded jitsi-conferentie het. Hier willen we echter nog veel functies aan toevoegen. Wat er nog miste was de optie om op te hangen, maar dit zal worden geimplementeerd in een issue die meer over de API van jitsi gaat.

### issues die nog in progress waren

**backend - gebruikersdatabase** (in progress)
Dit is nog niet helemaal af omdat er nog niet helemaal duidelijk was wat er in de database moest. Ook moest er nog georienteerd worden hoe alles werkte.

Dit issue zullen we dus weer in sprint 3 zetten, met de volgende kolommen:
- status
- foto
- sessie
- (socket)

### issues waar niet mee begonnen is

**gebruikers naar elkaar toe laten bewegen** (sprint backlog)
We hadden verkeerd ingeschat hoeveel tijd het opzetten van de infrastructuur was voordat we konden beginnen aan dit issue. Hierdoor kon er pas aan dit issue begonnen worden op de dag voor de deadline. Dit item zal dus worden toegevoegd aan de backlog van sprint 3. 

**release document maken en updaten** (sprint backlog)
Iedereen was dit vergeten te doen, en iedereen wilde eerst belangrijkere issues voor de demo afwerken. Deze zal dus weer terug worden geschoven.

**API documentatie**
Dit is niet gedaan omdat er nog weinig formele 'routes' waren in onze API. Ook zijn hier tools voor om dit automatisch te genereren, waar nog naar moet worden gekeken. Uiteraard schuiven we dit naar sprint 3.

### algemeen
- De issues moeten beter worden bijgehouden.
- Er moet meer met branches worden gewerkt. We gaan vanaf deze retrospective ook werken vanuit een branch 'sprint #', in plaats van de master branch. De master branch houdt op die manier altijd een stabiele versie van het product bij.
- De git repository moet worden opgeschoond.

# Nieuwe issues

**userlist data**
Alle benodigde userdata moet goed worden gerepresenteerd in de userlist component.

**sorteren gebruikersiconen**
De gebruikersiconen die in de kamer 'rondlopen' moeten ook gesorteerd/gehighlight worden als de gebruikerslijst wordt gesorteerd.

**jitsi component**
Jitsi moet worden veranderd naar een component met modulaire functies zoals 'onHangup', 'onJoin', etc. De jitsi API heeft heel veel events die gebruikt kunnen worden. Ook moet dit natuurlijk groepen en de conversatietypes ondersteunen. Dit is handig om te doen na/met de 'gespreksmanagement' issue. 

**registreer pagina**
Gebruikers moeten kunnen registreren.

# Takenverdeling voorkeuren
**Luuk**: database/inloggin
**Milou**: geen voorkeur
**Wouter**: kamerview/ontwerp
**Jie**: geen voorkeur
**Richard**: Frontend, meer de technische (dataflow) kant
**Jelle**: Kamerview ontwerpen, backend issues