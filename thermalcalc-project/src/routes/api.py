# api.py - Início do arquivo
from flask import Blueprint, request, jsonify
# Garanta que estes imports comecem com "src."
from src.models.materials_internal import materials_db
from src.routes.thermal_calc import (
    encontrar_temperatura_face_fria, 
    calcular_h_conv, 
    calcular_economia_financeira,
    encontrar_espessura_minima_condensacao,
    SIGMA
)
import os
import tempfile
from datetime import datetime

# O resto do seu arquivo continua aqui...
# (Não precisa colar o resto, apenas garanta que as importações acima estão corretas)
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Dados de combustíveis atualizados
COMBUSTIVEIS = {
    "Óleo BPF (kg)": {"v": 3.50, "pc": 11.34, "ef": 0.80, "fator_emissao": 3.15},
    "Gás Natural (m³)": {"v": 3.60, "pc": 9.65, "ef": 0.75, "fator_emissao": 2.0},
    "Lenha Eucalipto 30% umidade (ton)": {"v": 200.00, "pc": 3500.00, "ef": 0.70, "fator_emissao": 1260},
    "Eletricidade (kWh)": {"v": 0.75, "pc": 1.00, "ef": 1.00, "fator_emissao": 0.0358}
}

@api_bp.route('/materials', methods=['GET'])
def get_materials():
    """Retorna todos os materiais isolantes"""
    try:
        materials = materials_db.get_materials()
        return jsonify({"success": True, "data": materials})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/finishes', methods=['GET'])
def get_finishes():
    """Retorna todos os acabamentos"""
    try:
        finishes = materials_db.get_finishes()
        return jsonify({"success": True, "data": finishes})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/fuels', methods=['GET'])
def get_fuels():
    """Retorna todos os tipos de combustível"""
    try:
        fuels = materials_db.get_fuels()
        return jsonify({"success": True, "data": fuels})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/calculate/thermal', methods=['POST'])
def calculate_thermal():
    """Realiza o cálculo térmico e financeiro com suporte a múltiplas camadas"""
    try:
        data = request.get_json()
        
        # Validação dos dados obrigatórios
        required_fields = ['material', 'finish', 'geometry', 'hotTemp', 'ambientTemp', 'layerThicknesses']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Campo obrigatório: {field}"}), 400
        
        # Buscar dados do material e acabamento
        materials = materials_db.get_materials()
        finishes = materials_db.get_finishes()
        
        material = next((m for m in materials if m['nome'] == data['material']), None)
        finish = next((f for f in finishes if f['acabamento'] == data['finish']), None)
        
        if not material:
            return jsonify({"success": False, "error": "Material não encontrado"}), 400
        if not finish:
            return jsonify({"success": False, "error": "Acabamento não encontrado"}), 400
        
        # Validar temperatura do material
        if not (material['t_min'] <= data['hotTemp'] <= material['t_max']):
            return jsonify({
                "success": False, 
                "error": f"Temperatura fora dos limites do material ({material['t_min']}°C a {material['t_max']}°C)"
            }), 400
        
        if data['hotTemp'] <= data['ambientTemp']:
            return jsonify({
                "success": False, 
                "error": "A temperatura da face quente deve ser maior que a temperatura ambiente"
            }), 400
        
        # Parâmetros do cálculo
        Tq = data['hotTemp']
        To = data['ambientTemp']
        geometry = data['geometry']
        emissividade = finish['emissividade']
        k_func_str = material['k_func']
        
        # Calcular espessura total
        L_total = sum(data['layerThicknesses']) / 1000  # Converter mm para m
        
        # Diâmetro da tubulação (se aplicável)
        pipe_diameter_m = data.get('pipeDiameter', 0) / 1000 if data.get('pipeDiameter') else None
        
        # Calcular temperatura da face fria
        Tf, q_com_isolante, convergiu = encontrar_temperatura_face_fria(
            Tq, To, L_total, k_func_str, geometry, emissividade, pipe_diameter_m
        )
        
        if not convergiu:
            return jsonify({"success": False, "error": "Não foi possível convergir o cálculo"}), 400
        
        # Calcular perda sem isolante
        h_sem = calcular_h_conv(Tq, To, geometry, pipe_diameter_m)
        q_rad_sem = emissividade * SIGMA * ((Tq + 273.15)**4 - (To + 273.15)**4)
        q_conv_sem = h_sem * (Tq - To)
        q_sem_isolante = q_conv_sem + q_rad_sem
        
        # Converter para kW/m²
        perda_com_kw = q_com_isolante / 1000
        perda_sem_kw = q_sem_isolante / 1000
        
        result = {
            'temperatureFaceFria': round(Tf, 1),
            'perdaComIsolante': round(perda_com_kw, 3),
            'perdaSemIsolante': round(perda_sem_kw, 3),
            'convergiu': convergiu
        }
        
        # Cálculo financeiro (se solicitado)
        if data.get('calculateFinancial', False):
            financial_data = data.get('financialData', {})
            combustivel = financial_data.get('fuel', 'Eletricidade (kWh)')
            
            fuels = materials_db.get_fuels()
            if combustivel in fuels:
                comb_data = fuels[combustivel]
                valor_combustivel = financial_data.get('fuelCost', comb_data['v'])
                
                economia = calcular_economia_financeira(
                    perda_com_kw, perda_sem_kw,
                    financial_data.get('area', 10),
                    financial_data.get('hoursPerDay', 8),
                    financial_data.get('daysPerWeek', 5),
                    valor_combustivel,
                    comb_data['pc'],
                    comb_data['ef'],
                    comb_data['fator_emissao']
                )
                
                result.update({
                    'economiaMensal': round(economia['economia_mensal'], 2),
                    'economiaAnual': round(economia['economia_anual'], 2),
                    'co2EvitadoTonAno': round(economia['co2_ton_ano'], 2),
                    'reducaoPercentual': round(economia['reducao_pct'], 1)
                })
        
        return jsonify({"success": True, "data": result})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/calculate/condensation', methods=['POST'])
def calculate_condensation():
    """Realiza o cálculo de condensação"""
    try:
        data = request.get_json()
        
        # Validação dos dados obrigatórios
        required_fields = ['material', 'geometry', 'internalTemp', 'ambientTemp', 'humidity']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "error": f"Campo obrigatório: {field}"}), 400
        
        # Buscar dados do material
        materials = materials_db.get_materials()
        material = next((m for m in materials if m['nome'] == data['material']), None)
        
        if not material:
            return jsonify({"success": False, "error": "Material não encontrado"}), 400
        
        # Validar temperaturas
        Ti = data['internalTemp']
        Ta = data['ambientTemp']
        
        if Ta <= Ti:
            return jsonify({
                "success": False, 
                "error": "A temperatura ambiente deve ser maior que a temperatura interna"
            }), 400
        
        # Parâmetros do cálculo
        geometry = data['geometry']
        k_func_str = material['k_func']
        pipe_diameter_m = data.get('pipeDiameter', 0) / 1000 if data.get('pipeDiameter') else None
        wind_speed = data.get('windSpeed', 0)
        humidity = data['humidity']
        
        # Calcular espessura mínima
        espessura_mm, T_orvalho = encontrar_espessura_minima_condensacao(
            Ti, Ta, k_func_str, geometry, pipe_diameter_m, wind_speed, humidity
        )
        
        if espessura_mm is None:
            return jsonify({
                "success": False, 
                "error": "Não foi possível encontrar espessura que evite condensação até 500mm"
            }), 400
        
        result = {
            'temperaturaOrvalho': round(T_orvalho, 1),
            'espessuraMinima': espessura_mm,
            'success': True
        }
        
        return jsonify({"success": True, "data": result})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/download/pdf/<report_type>', methods=['POST'])
def download_pdf(report_type):
    """Gera e retorna um PDF do relatório"""
    try:
        from src.utils.pdf_generator import PDFGenerator
        from flask import send_file
        
        data = request.get_json()
        
        # Validar tipo de relatório
        if report_type not in ['thermal', 'condensation']:
            return jsonify({"success": False, "error": "Tipo de relatório inválido"}), 400
        
        # Criar gerador de PDF
        pdf_generator = PDFGenerator()
        
        # Criar arquivo temporário
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_path = tmp_file.name
        
        try:
            if report_type == 'thermal':
                # Gerar relatório térmico
                pdf_generator.generate_thermal_report(data, tmp_path)
                filename = f"relatorio_termico_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            else:
                # Gerar relatório de condensação
                pdf_generator.generate_condensation_report(data, tmp_path)
                filename = f"relatorio_condensacao_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Retornar o arquivo PDF
            return send_file(
                tmp_path,
                as_attachment=True,
                download_name=filename,
                mimetype='application/pdf'
            )
            
        except Exception as e:
            # Limpar arquivo temporário em caso de erro
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
            raise e
            
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@api_bp.route('/validate/temperature', methods=['POST'])
def validate_temperature():
    """Valida se a temperatura está dentro do range do material"""
    try:
        data = request.get_json()
        material_name = data.get('material')
        temperature = data.get('temperature')
        
        materials = materials_db.get_materials()
        material = next((m for m in materials if m['nome'] == material_name), None)
        
        if not material:
            return jsonify({"success": False, "error": "Material não encontrado"}), 404
        
        is_valid = material['t_min'] <= temperature <= material['t_max']
        
        return jsonify({
            "success": True,
            "data": {
                'valid': is_valid,
                't_min': material['t_min'],
                't_max': material['t_max'],
                'message': f"Temperatura deve estar entre {material['t_min']}°C e {material['t_max']}°C" if not is_valid else "Temperatura válida"
            }
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

