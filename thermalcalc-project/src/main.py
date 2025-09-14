# main.py - Versão Corrigida
import os
from flask import Flask
from flask_cors import CORS
# AQUI ESTÁ A MUDANÇA: removido o "src."
from routes.api import api_bp 

app = Flask(__name__)

# Configuração de CORS
vercel_url = os.environ.get('VERCEL_URL')
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if vercel_url:
    origins.append(f"https://{vercel_url}")
    origins.append(r"https://thermalcalc-app-.*\.vercel\.app")

CORS(app, resources={r"/api/*": {"origins": origins}})

# Registrar o blueprint da API
app.register_blueprint(api_bp)

# Mantido para desenvolvimento local
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)