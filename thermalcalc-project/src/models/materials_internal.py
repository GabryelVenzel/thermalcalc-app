# Base de dados interna de materiais isolantes e acabamentos
# Todas as informações são armazenadas localmente para uso offline

MATERIALS = [
    {
        'nome': 'Manta de fibra cerâmica 96Kg/m³ até 1260°C',
        'k_func': '0.0317 * math.exp(0.0024 * T)',
        't_min': 25,
        't_max': 1260
    },
    {
        'nome': 'Manta de fibra cerâmica 128Kg/m³ até 1260°C',
        'k_func': '0.0349 * math.exp(0.0021 * T)',
        't_min': 25,
        't_max': 1260
    },
    {
        'nome': 'Manta de fibra de vidro 130Kg/m³ até 800°C',
        'k_func': '0.0286 * math.exp(0.0029 * T)',
        't_min': 25,
        't_max': 800
    },
    {
        'nome': 'Lã de rocha 100Kg/m³ até 300°C',
        'k_func': '0.0333 * math.exp(0.0048 * T)',
        't_min': 25,
        't_max': 300
    },
    {
        'nome': 'Lã de rocha 64Kg/m³ até 300°C',
        'k_func': '0.0333 * math.exp(0.0036 * T)',
        't_min': 25,
        't_max': 300
    },
    {
        'nome': 'Lã de Vidro 12Kg/m³',
        'k_func': '4.2e-2',
        't_min': -20,
        't_max': 230
    },
    {
        'nome': 'Aerogel 160Kg/m³ até 650°C',
        'k_func': '0.0183 * math.exp(0.0022 * T)',
        't_min': 25,
        't_max': 650
    },
    {
        'nome': 'Microporoso 220Kg/m³ até 1000°C',
        'k_func': '0.0215 + 2.8e-05*T + 1.2e-08*T**2 + 0.0*T**3 + 0.0*T**4',
        't_min': 25,
        't_max': 1000
    },
    {
        'nome': 'Espuma elastomérica 50Kg/m³',
        'k_func': '0.034 + 8e-05*T + 1e-06*T**2 + 0.0*T**3 + 0.0*T**4',
        't_min': -50,
        't_max': 110
    },
    {
        'nome': 'Silicato de cálcio 240Kg/m³',
        'k_func': '0.052 + 0.000133 * T',
        't_min': 25,
        't_max': 815
    },
    {
        'nome': 'Perlita expandida',
        'k_func': '5.05e-2',
        't_min': -40,
        't_max': 650
    },
    {
        'nome': 'Vidro celular (Foamglas)',
        'k_func': '4.5e-2',
        't_min': -268,
        't_max': 482
    },
    {
        'nome': 'Espuma Rígida de Poliisocianurato (PIR)',
        'k_func': '2.2e-2',
        't_min': -70,
        't_max': 150
    }
]

FINISHES = [
    {
        'acabamento': 'Jaqueta térmica removível (ε = 0,90)',
        'emissividade': 0.90
    },
    {
        'acabamento': 'Isolamento Fixo - Alumínio Novo (ε = 0,15)',
        'emissividade': 0.15
    },
    {
        'acabamento': 'Isolamento Fixo - Alumínio Desgastado (ε = 0,45)',
        'emissividade': 0.45
    },
    {
        'acabamento': 'Isolamento Fixo - Aço Inox Novo (ε = 0,20)',
        'emissividade': 0.20
    },
    {
        'acabamento': 'Isolamento Fixo - Aço Inox Desgastado (ε = 0,65)',
        'emissividade': 0.65
    },
    {
        'acabamento': 'Isolamento Fixo - Aço Galvanizado Novo (ε = 0,25)',
        'emissividade': 0.25
    },
    {
        'acabamento': 'Isolamento Fixo - Aço Galvanizado Desgastado (ε = 0,80)',
        'emissividade': 0.80
    }
]

# Combustíveis para cálculo financeiro
COMBUSTIVEIS = {
            "Óleo BPF (kg)":                   {"v": 3.50, "pc": 11.34, "ef": 0.80, "fator_emissao": 3.15},
            "Gás Natural (m³)":                {"v": 3.60, "pc": 9.65,  "ef": 0.75, "fator_emissao": 2.0},
            "Lenha Eucalipto 30% umidade (ton)": {"v": 200.00,"pc": 3500.00,"ef": 0.70, "fator_emissao": 1260},
            "Eletricidade (kWh)":                {"v": 0.75, "pc": 1.00,  "ef": 1.00, "fator_emissao": 0.0358}
}

class MaterialsDatabase:
    """Classe para gerenciar a base de dados de materiais e acabamentos"""
    
    def __init__(self):
        self.materials = MATERIALS
        self.finishes = FINISHES
        self.fuels = COMBUSTIVEIS
    
    def get_materials(self):
        """Retorna lista de materiais disponíveis"""
        return self.materials
    
    def get_finishes(self):
        """Retorna lista de acabamentos disponíveis"""
        return self.finishes
    
    def get_fuels(self):
        """Retorna lista de combustíveis disponíveis"""
        return self.fuels
    
    def get_material_by_name(self, name):
        """Busca material por nome"""
        for material in self.materials:
            if material['nome'] == name:
                return material
        return None
    
    def get_finish_by_name(self, name):
        """Busca acabamento por nome"""
        for finish in self.finishes:
            if finish['acabamento'] == name:
                return finish
        return None
    
    def get_fuel_by_name(self, name):
        """Busca combustível por nome"""
        return self.fuels.get(name, None)

# Instância global para uso na aplicação
materials_db = MaterialsDatabase()

