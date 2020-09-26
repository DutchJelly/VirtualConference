from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import InputRequired, Length, ValidationError

from passlib.hash import pbkdf2_sha256
from app import *


# Gebruikersnaam en wachtwoord checker
def ongeldige_inloggegevens(form, veld):
    wachtwoord = veld.data
    gebruikersnaam = form.gebruikersnaam.data

    # Checkt of de gebruikersnaam geldig is
    gebruiker_data = Gebruiker.query.filter_by(gebruikersnaam=gebruikersnaam).first()
    if gebruiker_data == None:
        raise ValidationError("Gebruikersnaam of wachtwoord is incorrect")

    # Checkt of de wachtwoord geldig is
    elif not pbkdf2_sha256.verify(wachtwoord, gebruiker_data.wachtwoord):
        raise ValidationError("Gebruikersnaam of wachtwoord is incorrect")


# Registratie formulier
class RegistratieForm(FlaskForm):
    gebruikersnaam = StringField('gebruikersnaam', validators=[InputRequired(message="Gebruikersnaam nodig")])
    wachtwoord = PasswordField('wachtwoord', validators=[InputRequired(message="Wachtwoord nodig"), Length(min=8, message="Wachtwoord moet minimaal 8 tekens lang zijn")])

    def validate_gebruikersnaam(self, gebruikersnaam): # Checkt of de gebruikersnaam niet al bestaat
        gebruiker_object = Gebruiker.query.filter_by(gebruikersnaam=gebruikersnaam.data).first()
        if gebruiker_object: # Als de gebruiker al bestaat
            raise ValidationError("Gebruikersnaam bestaat al, kies een andere gebruikersnaam")

# Inlogformulier
class InlogForm(FlaskForm):
    gebruikersnaam = StringField('gebruikersnaam', validators=[InputRequired(message="Gebruikersnaam nodig")])
    wachtwoord = PasswordField('wachtwoord', validators=[InputRequired(message="Wachtwoord nodig"), ongeldige_inloggegevens])