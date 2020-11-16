### samevatting demo
De demo werkte niet omdat er op het laatste moment nog fouten bleken te zitten in het managen van gesprekken.

TODOtjes
-	SVG verwerken (Richard)
-	Registreren gesprekken en veel testen
-	Errors beter afhandelen in de frontend
-	Test driven werken in de backend!!!!!!

### algemeen
- Jelle: Ik had het druk en heb uiteindelijk minder mee kunnen helpen dan ik zou willen.

- De data types moeten beter worden gecommuniceerd. 

- Nu moeten er tests gemaakt worden voor elke PR zodat we beter kunnen zien waar eventuele fouten zitten.



### Sprint 4 login session #76 (ready)
Werkt goed, maar moet nog worden geïntegreerd. Ook moet de email nog beter worden gecheckt.

### backend - gebruikersdatabase #47 (ready)
Daar moet een id, naam, foto moet worden toegevoegd weer

### gesprek management #52 (ready)
Er staan weinig/geen tests in, waardoor we niet weten waar de errors vandaan kwamen. Dit was ook een van de oorzaken van de demo die het niet deed.

Ook is het misschien handiger om de database ervoor aan te passen zodat die er ongeveer zo uitziet:
```ts
roomcode: string,
members: List<User>,
roomtype: string
```

### registreer pagina toevoegen #60 (ready)
Werkt goed, maar er zit een probleempje in met nuxt.

### Een documentje waar de API van onze backend wordt gedefinieerd. Hierbij horen ook de socketio hooks. #54 (ready)
Deze was nog niet gemergd. Luuk is ermee bezig.


### modulair jitsi-handling component maken #61 (in progress)
Er is niet echt een 'component' gemaakt, maar meer een pagina.

### release document maken en updaten #5
Wouter heeft dit in de wiki gezet.

### frontend - gebruikerslijst #46
We hebben nog geen gebruikerstatus. Voor de rest is de stijl alleen geupdate met een css grid.

### gebruikers naar elkaar toe laten bewegen als ze in gesprek gaan #44
Dit gaat nog fout in de backend. Wel is er een geteste component gemaakt die dit implementeert.

### frontend inlog-sessie managent #58
Er is een store gemaakt waar dit in wordt afgehandeld. Dit moet nog worden toegevoegd aan al onze api requests zodat een gebruiker daadwerkelijk inlogt.

### frontend - kamerview #49
Dit is een beetje samengevallen met de gebruikerslijst.
