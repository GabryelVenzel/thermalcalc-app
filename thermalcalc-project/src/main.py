# main.py - VERSÃO FINAL CORRIGIDA
import os
import sys
# ESSAS 3 LINHAS SÃO A CORREÇÃO CRÍTICA
# Elas garantem que o Python encontre a pasta 'src'
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask
from flask_cors import CORS
# Voltamos a usar o import com "src."
from src.routes.api import api_bp

app = Flask(__name__)

# Configuração de CORS
vercel_url = os.environ.get('VERCEL_URL')
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if vercel_url:
    origins.append(f"https://{vercel_url}")
    # ATENÇÃO: Verifique se o nome do projeto está correto aqui
    origins.append(r"https://thermalcalc-app-.*\.vercel\.app")

CORS(app, resources={r"/api/*": {"origins": origins}})

app.register_blueprint(api_bp)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)