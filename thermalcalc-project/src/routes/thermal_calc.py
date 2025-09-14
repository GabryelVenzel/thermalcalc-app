"""
Módulo de cálculos térmicos baseado na lógica do Streamlit
"""
import math

# Constante global
SIGMA = 5.67e-8

def calcular_k(k_func_str, T_media):
    """Calcula a condutividade térmica baseada na função e temperatura média"""
    try:
        k_func_safe = str(k_func_str).replace(',', '.')
        return eval(k_func_safe, {"math": math, "T": T_media})
    except Exception as ex:
        print(f"Erro na fórmula k(T) '{k_func_str}': {ex}")
        return None

def calcular_h_conv(Tf, To, geometry, outer_diameter_m=None, wind_speed_ms=0):
    """Calcula o coeficiente de convecção"""
    Tf_K, To_K = Tf + 273.15, To + 273.15
    T_film_K = (Tf_K + To_K) / 2
    g, beta = 9.81, 1 / T_film_K
    nu = 1.589e-5 * (T_film_K / 293.15)**0.7
    alpha = 2.25e-5 * (T_film_K / 293.15)**0.8
    k_ar = 0.0263
    Pr = nu / alpha
    delta_T = abs(Tf - To)
    if delta_T == 0: 
        return 0
    
    if wind_speed_ms >= 1.0:
        L_c = 1.0 if geometry == "Superfície Plana" else outer_diameter_m
        if L_c is None or L_c == 0: 
            L_c = 1.0
        Re = (wind_speed_ms * L_c) / nu
        if Re < 5e5:
            Nu = 0.664 * (Re**0.5) * (Pr**(1/3))
        else:
            Nu = (0.037 * (Re**0.8) - 871) * (Pr**(1/3))
    else:
        if geometry == "Superfície Plana":
            L_c = 0.1
            Ra = (g * beta * delta_T * L_c**3) / (nu * alpha)
            Nu = 0.27 * Ra**(1/4)
        elif geometry == "Tubulação":
            L_c = outer_diameter_m
            Ra = (g * beta * delta_T * L_c**3) / (nu * alpha)
            term1 = 0.60
            term2 = (0.387 * Ra**(1/6)) / ((1 + (0.559 / Pr)**(9/16))**(8/27))
            Nu = (term1 + term2)**2
        else:
            Nu = 0
    
    return (Nu * k_ar) / L_c

def encontrar_temperatura_face_fria(Tq, To, L_total, k_func_str, geometry, emissividade, pipe_diameter_m=None, wind_speed_ms=0):
    """Encontra a temperatura da face fria através de iteração"""
    Tf = To + 10.0
    max_iter, step, min_step, tolerancia = 1000, 50.0, 0.001, 0.5
    erro_anterior = None
    
    for i in range(max_iter):
        T_media = (Tq + Tf) / 2
        k = calcular_k(k_func_str, T_media)
        if k is None or k <= 0: 
            return None, None, False

        if geometry == "Superfície Plana":
            q_conducao = k * (Tq - Tf) / L_total
            outer_surface_diameter = L_total
        elif geometry == "Tubulação":
            r_inner = pipe_diameter_m / 2
            r_outer = r_inner + L_total
            if r_inner <= 0 or r_outer <= r_inner: 
                return None, None, False
            q_conducao = (k * (Tq - Tf)) / (r_outer * math.log(r_outer / r_inner))
            outer_surface_diameter = r_outer * 2

        Tf_K, To_K = Tf + 273.15, To + 273.15
        h_conv = calcular_h_conv(Tf, To, geometry, outer_surface_diameter, wind_speed_ms)
        q_rad = emissividade * SIGMA * (Tf_K**4 - To_K**4)
        q_conv = h_conv * (Tf - To)
        q_transferencia = q_conv + q_rad
        
        erro = q_conducao - q_transferencia
        if abs(erro) < tolerancia: 
            return Tf, q_transferencia, True

        if erro_anterior is not None and erro * erro_anterior < 0:
            step = max(min_step, step * 0.5)
        Tf += step if erro > 0 else -step
        erro_anterior = erro
        
    return Tf, None, False

def calcular_economia_financeira(perda_com_kw, perda_sem_kw, area_m2, horas_dia, dias_semana, valor_combustivel, poder_calorifico, eficiencia, fator_emissao):
    """Calcula a economia financeira e ambiental"""
    # Cálculo da economia energética
    economia_kw = (perda_sem_kw - perda_com_kw) * area_m2
    economia_kwh_dia = economia_kw * horas_dia
    economia_kwh_semana = economia_kwh_dia * dias_semana
    economia_kwh_mes = economia_kwh_semana * 4.33  # média de semanas por mês
    economia_kwh_ano = economia_kwh_mes * 12
    
    # Conversão para unidade de combustível
    energia_combustivel_mes = economia_kwh_mes / (poder_calorifico * eficiencia)
    energia_combustivel_ano = economia_kwh_ano / (poder_calorifico * eficiencia)
    
    # Cálculo financeiro
    economia_mensal = energia_combustivel_mes * valor_combustivel
    economia_anual = energia_combustivel_ano * valor_combustivel
    
    # Cálculo de CO2
    co2_kg_ano = energia_combustivel_ano * fator_emissao
    co2_ton_ano = co2_kg_ano / 1000
    
    # Percentual de redução
    reducao_pct = ((perda_sem_kw - perda_com_kw) / perda_sem_kw) * 100 if perda_sem_kw > 0 else 0
    
    return {
        'economia_mensal': economia_mensal,
        'economia_anual': economia_anual,
        'co2_ton_ano': co2_ton_ano,
        'reducao_pct': reducao_pct,
        'economia_kwh_ano': economia_kwh_ano
    }

def calcular_temperatura_orvalho(temperatura_ambiente, umidade_relativa):
    """Calcula a temperatura de orvalho"""
    a_mag, b_mag = 17.27, 237.7
    alfa = ((a_mag * temperatura_ambiente) / (b_mag + temperatura_ambiente)) + math.log(umidade_relativa / 100.0)
    T_orvalho = (b_mag * alfa) / (a_mag - alfa)
    return T_orvalho

def encontrar_espessura_minima_condensacao(Ti, Ta, k_func_str, geometry, pipe_diameter_m, wind_speed, umidade_relativa, max_espessura_mm=500):
    """Encontra a espessura mínima para evitar condensação"""
    T_orvalho = calcular_temperatura_orvalho(Ta, umidade_relativa)
    
    for L_teste_mm in range(1, max_espessura_mm + 1):
        L_teste = L_teste_mm * 0.001  # Converte para metros
        Tf, _, convergiu = encontrar_temperatura_face_fria(
            Ti, Ta, L_teste, k_func_str, 
            geometry, 0.9, pipe_diameter_m, wind_speed_ms=wind_speed
        )
        if convergiu and Tf >= T_orvalho:
            return L_teste_mm, T_orvalho
    
    return None, T_orvalho

