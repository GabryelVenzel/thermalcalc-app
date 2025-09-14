# ThermalCalc - Calculadora Térmica e de Retorno Financeiro

## Visão Geral

O ThermalCalc é uma calculadora térmica profissional desenvolvida para análise de isolamentos industriais, com foco em cálculos térmicos precisos e análise de retorno financeiro e ambiental.

## Nova Identidade Visual

A aplicação foi completamente redesenhada com uma nova identidade visual que remove todas as referências às marcas Priner e Isolafácil, implementando um design moderno e técnico baseado nas cores:

- **Verde Principal**: #7CB342 (sustentabilidade e eficiência)
- **Azul Secundário**: #1976D2 (tecnologia e confiabilidade)
- **Azul Claro**: #42A5F5 (modernidade)
- **Cinza Escuro**: #424242 (profissionalismo)

## Funcionalidades

### 1. Cálculo Térmico e Financeiro
- Análise de perda térmica com e sem isolamento
- Cálculo de temperatura da face fria
- Análise de retorno financeiro
- Cálculo de economia de CO₂
- Suporte a múltiplos materiais isolantes
- Diferentes tipos de acabamento
- Geometrias: superfície plana e tubulação

### 2. Cálculo Térmico Frio (Condensação)
- Determinação da espessura mínima para evitar condensação
- Cálculo da temperatura de orvalho
- Análise considerando umidade relativa
- Suporte a diferentes velocidades de vento

## Estrutura do Projeto

```
thermalcalc-arquivos-finais.zip
├── thermalcalc-project/src/          # Backend Flask
│   ├── main.py                       # Aplicação principal
│   ├── routes/                       # Rotas da API
│   │   ├── api.py                   # Endpoints de cálculo
│   │   └── thermal_calc.py          # Lógica de cálculos térmicos
│   ├── data/                        # Base de dados
│   │   └── materials_db.py          # Materiais e acabamentos
│   └── static/                      # Arquivos estáticos (frontend build)
├── thermalcalc-frontend/            # Frontend React
│   ├── src/                         # Código fonte React
│   │   ├── App.jsx                  # Componente principal
│   │   ├── App.css                  # Estilos customizados
│   │   └── assets/                  # Imagens e recursos
│   ├── dist/                        # Build de produção
│   ├── package.json                 # Dependências
│   ├── vite.config.js              # Configuração Vite
│   └── index.html                   # HTML principal
├── thermalcalc_logo.png             # Logo ThermalCalc
├── thermalcalc_favicon.png          # Favicon
├── analise_visual.md                # Análise da identidade visual
└── diretrizes_estilo.md             # Diretrizes de design
```

## Como Hospedar

### Opção 1: Frontend Estático (Recomendado)
1. Use os arquivos da pasta `thermalcalc-frontend/dist/`
2. Hospede em qualquer servidor web (Netlify, Vercel, GitHub Pages, etc.)
3. A aplicação funcionará com dados simulados

### Opção 2: Aplicação Completa (Frontend + Backend)
1. **Backend Flask:**
   ```bash
   cd thermalcalc-project
   pip install flask flask-cors
   python src/main.py
   ```

2. **Frontend React (desenvolvimento):**
   ```bash
   cd thermalcalc-frontend
   npm install
   npm run dev
   ```

3. **Frontend React (produção):**
   ```bash
   cd thermalcalc-frontend
   npm run build
   # Copie os arquivos de dist/ para o servidor web
   ```

## Dependências

### Backend (Flask)
- Flask
- Flask-CORS
- Python 3.11+

### Frontend (React)
- React 18+
- Vite
- Tailwind CSS
- shadcn/ui components
- Lucide React (ícones)

## Configuração de Desenvolvimento

### Backend
```bash
cd thermalcalc-project
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\Scripts\activate  # Windows
pip install flask flask-cors
python src/main.py
```

### Frontend
```bash
cd thermalcalc-frontend
npm install
npm run dev
```

## API Endpoints

### GET /api/materials
Retorna lista de materiais disponíveis

### GET /api/finishes  
Retorna lista de acabamentos disponíveis

### GET /api/fuels
Retorna lista de combustíveis para cálculo financeiro

### POST /api/calculate/thermal
Realiza cálculo térmico e financeiro
```json
{
  "material": "string",
  "finish": "string", 
  "geometry": "Superfície Plana|Tubulação",
  "hotTemp": number,
  "ambientTemp": number,
  "layerThicknesses": [number],
  "pipeDiameter": number,
  "calculateFinancial": boolean,
  "financialData": {
    "fuel": "string",
    "fuelCost": number,
    "area": number,
    "hoursPerDay": number,
    "daysPerWeek": number
  }
}
```

### POST /api/calculate/condensation
Calcula espessura mínima para evitar condensação
```json
{
  "material": "string",
  "geometry": "Superfície Plana|Tubulação", 
  "internalTemp": number,
  "ambientTemp": number,
  "humidity": number,
  "windSpeed": number,
  "pipeDiameter": number
}
```

## Características Técnicas

- **Responsivo**: Interface adaptável para desktop e mobile
- **Moderno**: Utiliza React 18 com Vite para performance otimizada
- **Acessível**: Componentes seguem padrões de acessibilidade
- **Profissional**: Design técnico adequado para uso industrial
- **Validado**: Mantém toda a lógica de cálculo da versão Streamlit original

## Suporte

Para dúvidas técnicas ou melhorias, consulte a documentação dos arquivos inclusos:
- `analise_visual.md` - Detalhes da nova identidade visual
- `diretrizes_estilo.md` - Guia completo de design e implementação

## Licença

Projeto desenvolvido para uso interno. Todos os direitos reservados.

