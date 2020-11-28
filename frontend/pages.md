Registreerpagina

inputvelden:
afbeeldingen,
email;
gebruikersnaam;
wachtwoord;
herhaling wachtwoord;

Request voor de backend:
email;
wachtwoord;
gebruikersnaam;
profielfoto;

Check in de Frontend:
Wachtwoord + Herhaling wachtwoord

Antwoord van de backend:
/als het goedgaat
JSON Object: {
  Statuscode,
  message: string
}
/als het foutgaat
JSON Object: {
  Statuscode,
  Error: string
}

Loginpagina

inputvelden:
Username (als email)
Wachtwoord

Request voor de backend:
Email,
Password

Check in de Frontend:
Check of het een geldige email is.

Antwoord van de backend:
/als het goedgaat
Het gehele userobject

/als het foutgaat
JSON Object: {
  Error: message
}

Plattegrondpagina

inputvelden:
{ophalen statisch het pad naar de plattegrond}

Request voor de backend:
JoinRoom{
  sessionkey: string,
  roomId: string (de id van de <g>)
}

Antwoord van de backend:
JSON object Room: {
  roomId: string,
  users: {
    username: string,
    id: number,
    image: string,
    //... all user prperties except the session key
  } = [], //dus in de vorm van een array
  groups: {
    memberIds: number[],
    groupId: number
  } = []
}

Kamerviewpagina

Inputvelden:
{via prop} de gehele JSON object Room
{onClick gebruiker} 

Request voor de backend:
ConversationRequest{
  sessionKey: string,
  userId: number,
  conversationType: string
}
ConversationRequestResponse{
  sessionKey: string,
  latestRequest.id: number,
  response: boolean
}


Antwoord van de backend:
/als het lukt
JSON object{
  message: string
}
/als het foutgaat
JSON object{
  error: string
}
/naar ontvangende gebruiker
JSON object{
  ConsationReqeust{
    //data
  }
}

ConversationRequestResponse
/als het goedgaat
JSON object group{
  groupId: number,
  roomCode: string,
  memberId: number[],
  typeConversation: string
}
/als het foutgaat
JSON object Message{
  message: string
}

