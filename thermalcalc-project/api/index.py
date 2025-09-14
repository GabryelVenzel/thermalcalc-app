# Adiciona o diretório 'api' ao path para permitir que outros módulos sejam encontrados
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))

from flask import Flask
from flask_cors import CORS
from routes.api import api_bp

app = Flask(__name__)
CORS(app)
app.register_blueprint(api_bp)