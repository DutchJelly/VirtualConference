import time
from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_socketio import SocketIO, join_room, Namespace, emit, disconnect
from flask_sqlalchemy import SQLAlchemy
from wtform_velden import *

async_mode = None

app = Flask(__name__)
app.secret_key='p\x85\xd5\x1c\xa8\x90\x1d\x81\xc9\\ai\xcc\x82I\x9c\x95]\xae\xfdB\x95\xe9@'
app.config['WTF_CSRF_SECRET_KEY'] = "b'f\xfa\x8b{X\x8b\x9eM\x83l\x19\xad\x84\x08\xaa"

app.config['SQLALCHEMY_DATABASE_URI']='sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

socketio = SocketIO(app, async_mode=async_mode)

clients = [] # Bewaart de sid van de actieve gebruikers
gebruikers = {} # Slaat de actieve gebruikers op met de betreffende sid
ingelogde_gebruikers = [] # Bewaart de huidige ingelogde gebruikers
alle_chat = {} # Bewaart alle openstaande chat van een gebruiker
groepsleden = [] # Bewaart de geselecteerde groepsleden bij het aanmaken van een groepschat

# Tabel waarin de gebruikersnaaam en de wachtwoord worden opgeslagen bij het registreren
class Gebruiker(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    gebruikersnaam = db.Column(db.String, unique=True, nullable=False)
    wachtwoord = db.Column(db.String, unique=True, nullable=False)

# Tabel waarin alle privechat geschiedenis wordt opgeslagen
class Geschiedenis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    van_naam = db.Column(db.String)
    naar_naam = db.Column(db.String)
    bericht = db.Column(db.String)

# Tabel waarin alle groepschat en de groepsleden worden opgeslagen
class Groep(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    groep_naam = db.Column(db.String, nullable =False)
    naam = db.Column(db.String, nullable=False)

# Tabel waarin alle groepschat geschiedenis wordt opgeslagen
class GroepGeschiedenis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    groep = db.Column(db.String, nullable =False)
    bericht = db.Column(db.String)

# 'registratie' pagina waar een gebruiker geregistreerd kan worden
@app.route("/registratie", methods=['GET', 'POST'])
def registratie():
    # Registratie formulier
    reg_form = RegistratieForm()

    # Als de gebruikersnaam en de wachtwoord geldig zijn
    if reg_form.validate_on_submit():
        gebruikersnaam = reg_form.gebruikersnaam.data
        wachtwoord = reg_form.wachtwoord.data

        # Hash wachtwoord
        wachtwoord = pbkdf2_sha256.hash(wachtwoord)

        # Opslaan in de database
        gebruiker = Gebruiker(gebruikersnaam=gebruikersnaam, wachtwoord=wachtwoord)
        db.session.add(gebruiker)
        db.session.commit()

        flash('Succesvol geregistreerd, log nu in!')
        return redirect(url_for('index')) # Omleiden naar de inlogpagina

    return render_template("registratie.html", form=reg_form) # Registratiepagina

# 'index' pagina waar de gebruiker zich kan inloggen
@app.route("/", methods=['GET', 'POST'])
def index():
    # Inlogformulier
    inlog_form = InlogForm()

    # Als de gebruikersnaam en de wachtwoord correct zijn
    if inlog_form.validate_on_submit():
        gebruikersnaam = inlog_form.gebruikersnaam.data
        ingelogde_gebruikers.append(gebruikersnaam) # Het opslaan van ingelogde gebruiker
        return redirect(url_for('chat', gebruikersnaam=gebruikersnaam)) # Omleiden naar de chatpagina

    return render_template("inlogpagina.html", form=inlog_form) # Inlogpagina

# Uitlogpagina waarbij de gebruiker wordt afgemeld
@app.route("/uitloggen", methods=['GET'])
def uitloggen():
    flash('Je bent uitgelogd')
    return redirect(url_for('index')) # Omleiden naar de inlogpagina

# Chatpagina die op de naam van de huidige gebruiker staat waar de gebruiker kan chatten
@app.route("/<string:gebruikersnaam>", methods=['GET', 'POST'])
def chat(gebruikersnaam):
    if gebruikersnaam in ingelogde_gebruikers: # Als de gebruiker ingelogd is
        flash('Welkom, {0}'.format(gebruikersnaam))
        return render_template("chat.html", async_mode=socketio.async_mode) # Chatpagina wordt geladen
    else: # De gebruiker is nog niet ingelogd
        flash('Je moet eerst inloggen')
        return redirect(url_for('index')) # Omleiden naar de inlogpagina

# Achtergrond thread voor het draaien van achtergrondtaken
thread = None
def achtergrond_thread():
    teller = 0
    while True: # Taken laten inslapen
        socketio.sleep(10) # Slaap gedurende 10 seconden
        teller += 1

# Het ophalen van de gebruikersnaam met de gegeven sid
def geef_gebruikersnaam(sid):
    for gebruiker in gebruikers: # Als de gebruiker bestaat in de dictionary gebruikers
        if gebruikers[gebruiker] == sid:
            return gebruiker
    return False

# Hierin worden alle socketio functies gedefinieerd
class WebChat(Namespace):
    # Als een gebruiker connected is
    def on_connect(self):
        global thread
        clients.append(request.sid) # Het toevoegen van sid in de lijst 'clients'
        if thread is None: # Het starten van achtergrondtaken
            thread = socketio.start_background_task(target=achtergrond_thread)

    # Het registreren van de huidige gebruiker
    def on_registratie(self, json):
        # Registreer de gebruiker in de gebruikerslijst
        gebruikers[json['gebruiker']] = request.sid

        # Voegt gebruiker toe in de object om zo alle openstaande chat van de gebruiker op te kunnen slaan
        alle_chat[json['gebruiker']] = []

        # Broadcast naar alle gebruikers dat een gebruiker connected is
        emit('actieve_gebruikers_lijst', {
            'type': 'connect',
            'data': {
                'gebruikers': gebruikers
            }
        }, broadcast=True)

        # Het ophalen van alle groepschatten waarin de huidige gebruiker zit
        groepschatten = Groep.query.filter_by(naam=json['gebruiker']).all()
        groepen = []
        for groepschat in groepschatten: # Het opslaan van alle groepschatten in de lijst 'groepen'
            groepen.append(groepschat.groep_naam) 

        # Het verschijnen van alle groepschatten van de huidige gebruiker op zijn lijst met actieve gebruikers
        emit('groep_lijst', {
            'data': {
                'groep': groepen
            }
        }, room=gebruikers[json['gebruiker']])

    # Het aanmaken van een privechat
    def on_prive_bericht(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker
        vriend = json['gebruiker'] # De gebruiker met wie de huidige gebruiker een privechat gaat beginnen

        # Als de huidige gebruiker nog geen openstaande chat heeft met deze gebruiker
        if vriend not in alle_chat[mijn_gebruikersnaam]:
            # Het ophalen van de chat geschiedenis tussen deze twee gebruikers
            geschiedenis_lijst = Geschiedenis.query.filter((
            (Geschiedenis.van_naam == mijn_gebruikersnaam) | (Geschiedenis.van_naam == vriend)), 
            ((Geschiedenis.naar_naam == vriend) | (Geschiedenis.naar_naam == mijn_gebruikersnaam))).all()

            lijst = []
            for geschiedenis in geschiedenis_lijst: # Alle geschiedenis in de lijst 'lijst' zetten
                lijst.append(geschiedenis.bericht)

            # Het aanmaken van een chatvenster tussen deze twee gebruikers met chat geschiedenis
            emit('chat_reactie', {
                'type': 'prive',
                'data': {
                    'gebruiker': vriend,
                    'lijst': lijst
                }
            })
            # Voegt de gebruiker toe in de lijst van alle openstaande chat van de huidige gebruiker
            alle_chat[mijn_gebruikersnaam].append(vriend)

    # Het sturen van prive berichten
    def on_prive_verzenden(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker
        tijd = time.strftime('%I:%M%p', time.localtime()) # Huidige tijd
        bericht_tekst = ' ('+tijd+'): '+json['tekst'] # Te versturen bericht met de huidige tijd erbij

        # Het verschijnen van prive bericht in de chatvenster van de gebruiker naar wie de bericht is verstuurd
        if json['vriend'] in gebruikers:
            emit('chat_reactie', {
                'type': 'prive_bericht',
                'data': {
                    'tekst': bericht_tekst,
                    'van': mijn_gebruikersnaam
                }
            }, room=gebruikers[json['vriend']]) 

    # Het verschijnen van de bericht die door de huidige gebruiker zelf is gestuurd
    def on_mijn_bericht(self, json):
        tijd = time.strftime('%I:%M%p', time.localtime()) # Huidige tijd
        bericht_tekst = ' ('+tijd+'): '+json['tekst'] # Te versturen bericht met de huidige tijd erbij

        # Het verschijnen van bericht in de chatvenster van de hudige gebruiker
        emit('eigen_bericht', {
            'data': {
                'tekst': bericht_tekst,
                'naar': json['vriend']
            }
        }) 

    # Als een gebruiker disconnected is
    def on_disconnect(self):
        if request.sid in clients: # Als de huidige gebruiker nog niet is afgemeld
            clients.remove(request.sid) # Verwijder de sid van de lijst 'clients'
            mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker

            if mijn_gebruikersnaam: # Als de gebruiker bestaat
                # Verwijder de gebruiker van de dictionary gebruikers
                gebruikers.pop(mijn_gebruikersnaam)

                # Update de actieve gebruikerslijst
                emit('actieve_gebruikers_lijst', {
                    'type': 'connect',
                    'data': {
                        'gebruikers': gebruikers
                    }
                }, broadcast=True)

            # Als de gebruiker is ingelogd, verwijder de gebruiker van de lijst 'ingelogde_gebruikers'
            if mijn_gebruikersnaam in ingelogde_gebruikers:
                ingelogde_gebruikers.remove(mijn_gebruikersnaam)

    # Het opslaan van chatgeschiedenis in de database
    def on_geschiedenis(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker

        tijd = time.strftime('%I:%M%p', time.localtime()) # Huidige tijd
        bericht_tekst = ' ('+tijd+'): '+json['tekst'] # Verstuurd bericht met de huidige tijd erbij
        bericht = mijn_gebruikersnaam+bericht_tekst # Met de gebruiker erbij die de bericht heeft gestuurd

        if (json['soort'] == 'prive'): # Als het een prive bericht is
            naar = json['vriend'] # De gebruiker naar wie de bericht is verstuurd
            # Opslaan van de bericht in de database
            bericht = Geschiedenis(van_naam=mijn_gebruikersnaam, naar_naam=naar, bericht=bericht)
            db.session.add(bericht)
            db.session.commit()
        else: # Als het een groepsbericht is
            groep_naam = json['vriend'] # De groep waarnaartoe de bericht is verstuurd
            # Opslaan van de bericht in de database
            bericht = GroepGeschiedenis(groep=groep_naam, bericht=bericht)
            db.session.add(bericht)
            db.session.commit()

    # Het verschijnen van de lijst met alle gebruikers zodat de huidige gebruiker zijn groepsleden kan kiezen
    def on_groep_naam(self, json):
        groep = json['groep'] # De groepsnaam
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker

        # Verwijder alle groepsleden van de lijst met groepsleden
        groepsleden.clear()

        groepsnaam = Groep.query.filter_by(groep_naam=groep).first() # Checkt of de groepsnaam al bestaat
        if groepsnaam == None: # Als de groepsnaam nog niet betstaat
            groepsleden.append(mijn_gebruikersnaam) # Veogt de huidige gebruiker toe in de lijst met groepsleden
            namen_lijst = Gebruiker.query.all() # Het ophalen van alle gebruikers
            naam_lijst = []
            for naam in namen_lijst: # Opslaan van alle gebruikersnaam in de lijst 'naam_lijst'
                # De gebruiker die de groep aanmaakt, zit al standard in de groep
                if naam.gebruikersnaam != mijn_gebruikersnaam:
                    naam_lijst.append(naam.gebruikersnaam)

            # Verschijnen van de lijst
            emit('lijst_groep_aanmaken', {
                'data': {
                    'lijst': naam_lijst,
                    'groep': groep
                }
            })
        else: # Als de groepsnaam al bestaat, moet de huidige gebruiker een andere naam kiezen
            emit('alert_bericht', {
                'bericht': '{0} bestaat al, kies een andere naam'.format(groep)
            })

    # Het toevoegen van geselecteerde gebruiker in de database met betreffende groepsnaam
    def on_groep_gebruiker(self, json):
        groepsnaam = json['groep'] # De naam van de groepschat
        deelnemer = json['naam'] # Het gekozen groepslid
        bestaat = False # Bijhoudt of de gebruiker al in de groepschat zit

        for groepslid in groepsleden: 
            if groepslid == deelnemer: # Als de geselecteerde gebruiker al in de groepschat zit
                emit('alert_bericht', {
                    'bericht': '{0} zit al in deze groep'.format(deelnemer)
                })
                bestaat = True
        
        if bestaat == False: # Als de gesecleteerde gebruiker nog niet in de groepschat zit
            groepsleden.append(deelnemer) # Voeg de gebruiker toe aan de lijst met groepsleden
            emit('alert_bericht', {
                'bericht': '{0} zit nu in deze groep'.format(deelnemer)
            })

    # Het definief aanmaken van de groepschat
    def on_aanmaken_groep(self, json):
        teller = 0
        groepsnaam = json['groep'] # De naam van de groepschat

        for groepslid in groepsleden: # Telt het aantal groepsleden
            teller = teller + 1

        if (teller >= 3): # Als het aantal groepsleden groter of gelijk is aan drie, dan kan de groepschat aangemaakt worden 
            for groepslid in groepsleden: 
                # Voegt de gebruiker toe in de database
                deelnemers = Groep(groep_naam=groepsnaam, naam=groepslid)
                db.session.add(deelnemers)
                db.session.commit()
                # Het ophalen van alle groepschatten van de betreffende gebruiker
                groepschatten = Groep.query.filter_by(naam=groepslid).all()

                groepen = [] # Het opslaan van alle groepschatten van de betreffende gebruiker in de lijst 'groepen'
                for groepschat in groepschatten: 
                    groepen.append(groepschat.groep_naam)

                # Update de lijst met alle groepschatten van de actieve gebruikers
                if groepslid in gebruikers:
                    emit('groep_lijst', {
                        'data': {
                            'groep': groepen
                        }
                    }, room=gebruikers[groepslid])
        else: # Anders, geeft een alert bericht dat er te weinig groepsleden zijn om een groepschat aan te maken
            emit('alert_bericht', {
                'bericht': 'De groep moet minimaal drie gebruikers hebben, maak opnieuw de groep.'
            })

    # Een groepchat join
    def on_join_groep(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker        
        groepschat = str(json['groep']) # De naam van de groepschat
        join_room(groepschat) # Join groepschat

        # Als de huidige gebruiker de groepschat nog niet open heeft staan
        if groepschat not in alle_chat[mijn_gebruikersnaam]:
            # Het ophalen van alle geschiedenis van de betreffende groepschat
            geschiedenis_lijst = GroepGeschiedenis.query.filter_by(groep=groepschat).all()

            lijst = [] # Het opslaan van alle geschiedenis van de betreffende groepschat in de lijst 'lijst'
            for geschiedenis in geschiedenis_lijst:
                lijst.append(geschiedenis.bericht)

            # Groepschatvenster openen met alle geschiedenis van de betreffende groepschat
            emit('chat_reactie', {
                'type': 'groep',
                'data': {
                    'groep': groepschat,
                    'lijst': lijst
                }
            })
            # Voegt de groepschat toe in de lijst van alle openstaande chat van de huidige gebruiker
            alle_chat[mijn_gebruikersnaam].append(groepschat)

    # Het versturen van een groepsbericht
    def on_groep_verzenden(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker
        groep = json['vriend'] # De naam van de groepschat
        tijd = time.strftime('%I:%M%p', time.localtime()) # Huidige tijd
        bericht_tekst = ' ('+tijd+'): '+json['tekst'] # Te versturen bericht met de huidige tijd erbij

        # Het versturen van bericht naar de betreffende groepschat
        emit('chat_reactie', {
            'type': 'groep_bericht',
            'data': {
                'tekst': bericht_tekst,
                'groep': groep,
                'van': mijn_gebruikersnaam
            }
        }, room=groep) 

    # Bij het sluiten van de chat venster verwijder de gebruiker of de groep van de lijst met alle openstaande chat
    def on_sluit_chat(self, json):
        mijn_gebruikersnaam = geef_gebruikersnaam(request.sid) # Huidige gebruiker
        # Verwijder de gebruiker of de groepschat van de lijst met alle openstaande chat van de huidige gebruiker
        alle_chat[mijn_gebruikersnaam].remove(json['vriend'])

socketio.on_namespace(WebChat('/chat'))

if __name__ == '__main__':
    db.create_all() # Het aanmaken van alle tabellen in de database
    app.run(debug=True) # Runnen van de applicatie

