## Socket.IO (WebSocket)
Socket.IO is een tweeweg verbinding tussen server en gebruiker. Normaal kan server niet sturen naar je webpagina, enkel andersom.
Kan gebruikt worden om realtime te updaten, in plaats van constant te pollen. Het wordt mogelijk niet gesupport door oude browsers, maar waarschijnlijk is het
beschikbaar genoeg is dat dit geen probleem is.     

<br>
Optionele, waarschijnlijk niet nodige, programmas: Docker, Typescript
</br>

## Introductie React
jarn add ...  -> Toevoegen dependencies  
node_modules -> Niet aankomen, daarin worden dependencies geinstalleerd    
package.json -> Bevat geinstalleerde dependencies  
build -> De complete webapp  
yarn.start -> Start de webapp  
service.worker -> Niet nodig, zorgt voor beschikbaarheid als gebruiker geen internet heeft  
index.js -> Hoeft niks aan verandert te worden  
app.css -> Style-document van de pagina  

Een react-computen kan gewoon een functie zijn, deze kan bijvoorbeeld HTML returnen (mag genest worden, zolang het maar geldige HTML is).  
Binnen HTML kan weer {JavaScript-code} gebruikt worden.  

Altijd [import React from "react"] bovenaan (zonder []), bij een component.  
Om een component te gebruiken (bijvoorbeeld bij app.css): [import Clock from "../Clock/index"].   
Met functies of classes werken, hij raadt functies aan.  

useState, useEffect kunnen geimporteerd worden via [import {useState} from "react"] afzonderlijk of samen via [import {useState, effectState} "react"].  
Binnen de functie van een component kan je useEffect(() => { code die onder andere interval definieert }) gebruiken om na een bepaalde interval de component-functie (opniew) te runnen.  

Om te printen in de consolse kan console.log() gebruikt worden  

Components kunnen 1 soort argument accepteren: props. Props kunnen gebruikt worden om een instantie van een component eigenschappen te gebruiken. Hierdoor kan de code hergebruikt worden, 
want instanties kunnen gescheiden worden via hun props.  


## Introductie Vue
index.vue bestaat uit template, script en style.   
Tailwind is een handige extension voor css (werkt ook voor React).  
Data moet een functie zijn de de state returned, want het mag niet de state zelf zijn.  
Tussen {{}} mag je javascript zetten (bijvoorbeeld variabelen).    
Props in Vue zijn erg overeenkomstig met props in React.  
Stel je iets berekenen (bijvoorbeeld twee variabelen samenvoegen, of "if dit, return dat"), dan kun je een "computed"-property gebruiken.  
Als je een dubbele punt voor je property zet, refereert hij naar de JavaScript waarde.  
[v-for="idx in [1,2,3,4]" :key="idx"] kan gebruikt worden als for-loop (in dit geval die 4 keer loopt). idx kan hier vervangen worden door een array die doorlopen moet worden.
De key kan gebruikt worden om te kijken of een element in de array verplaatst is (in dat geval hoeft deze niet re-rendered te worden).  
[v-if="variabele >= variabele">{{gebruikte variabelen}} kan als if-statement gebruikt worden.  
[hover:property] kan gebruikt worden om deze property enkel toe te kennen als er overheen "gehovered" wordt met de muis.  



