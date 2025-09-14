# main.py - Versão Simplificada para Vercel
import os
from flask import Flask
from flask_cors import CORS
from src.routes.api import api_bp # Garante que a API seja importada

# Inicializa a aplicação Flask
app = Flask(__name__)

# --- Início da Configuração de CORS (Recomendado) ---
# Pega a URL de produção da Vercel a partir de uma variável de ambiente
vercel_url = os.environ.get('VERCEL_URL')

# Cria uma lista de origens permitidas
origins = [
    "http://localhost:5173",  # Para desenvolvimento local com Vite
    "http://127.0.0.1:5173", # Alternativa para desenvolvimento local
]

# Se a aplicação estiver na Vercel, adiciona a URL dela dinamicamente
if vercel_url:
    # Adiciona a URL de produção principal
    origins.append(f"https://{vercel_url}")
    # Adiciona um padrão para as URLs de preview (ex: thermalcalc-git-main-seurepo.vercel.app)
    # ATENÇÃO: Troque 'thermalcalc' pelo nome do seu projeto na Vercel se for diferente
    origins.append(r"https://thermalcalc-.*\.vercel\.app")

# Aplica a configuração de CORS à sua API
CORS(app, resources={r"/api/*": {"origins": origins}})
# --- Fim da Configuração de CORS ---

# Registrar o blueprint da API
app.register_blueprint(api_bp)

# O if __name__ == '__main__': é mantido para rodar localmente, mas não é usado pela Vercel.
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)