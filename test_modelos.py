import configparser
from google import genai

# Leer la API key
config = configparser.ConfigParser()
config.read("config.ini")
api_key = config["google"]["API_KEY"]

# Inicializar el cliente
client = genai.Client(api_key=api_key)

# Listar modelos disponibles
for model in client.models.list():
    print(model.name)
