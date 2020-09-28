import pytest
from app import *

# Een pytest fixture genaamd client() die de applicatie configureert voor testen
@pytest.fixture
def client():
    with app.test_client() as c:
    	yield c

# Test de return waarde van de if statement binnen de functie 'geef_gebruikersnaam'
def test_geef_gebruikersnaam_t1():
	gebruikers['ingelogde_gebruiker'] = 'gebruikers_sid' 
	assert geef_gebruikersnaam('gebruikers_sid') == 'ingelogde_gebruiker'

# Test de return waarde van de functie 'geef_gebruikersnaam' als de if statement niet wordt uitgevoerd
def test_geef_gebruikersnaam_t2():
	assert geef_gebruikersnaam('andere_sid') == False

# Hulpfunctie om de functie 'uitloggen' te testen
def uitloggen_t1(client):
	return client.get('/uitloggen', follow_redirects=True)

# Test de 'uitloggen' functie door te kijken of de flash bericht inderdaad wordt aangeroepen
def test_uitloggen_t1(client):
	rv = uitloggen_t1(client)
	assert b'Je bent uitgelogd' in rv.data

# Hulpfunctie om de if statement van de functie 'chat(gebruikersnaam)' te testen
def chat_t1(client):
	ingelogde_gebruikers.append('ingelogde_gebruiker')
	return client.get('/ingelogde_gebruiker', data={'ingelogde_gebruikers': ingelogde_gebruikers, 'gebruikersnaam': 'ingelogde_gebruiker'})

# Test de if statement van de 'chat(gebruikersnaam)' functie door te kijken of de flash bericht inderdaad wordt aangeroepen
def test_chat_t1(client):
	rv = chat_t1(client)
	assert b'Welkom, ingelogde_gebruiker' in rv.data

# Hulpfunctie om de else statement van de functie 'chat(gebruikersnaam)' te testen
def chat_t2(client):
	ingelogde_gebruikers.remove('ingelogde_gebruiker')
	return client.get('/ingelogde_gebruiker', follow_redirects=True)

# Test de else statement van de 'chat(gebruikersnaam)' functie door te kijken of de flash bericht inderdaad wordt aangeroepen
def test_chat_t2(client):
	rv = chat_t2(client)
	assert b'Je moet eerst inloggen' in rv.data

	