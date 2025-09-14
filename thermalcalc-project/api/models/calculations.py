import math

# Constante de Stefan-Boltzmann
SIGMA = 5.67e-8

class ThermalCalculations:
    @staticmethod
    def calculate_thermal_conductivity(k_func_str, T_media):
        """
        Calcula a condutividade térmica baseada na função e temperatura média
        """
        try:
            k_func_safe = str(k_func_str).replace(",", ".")
            k_val = eval(k_func_safe, {"math": math, "T": T_media})
            print(f"  DEBUG Backend: calculate_thermal_conductivity(T_media={T_media:.2f}) -> k={k_val:.6f}")
            return k_val
        except Exception as e:
            print(f"  DEBUG Backend: Erro em calculate_thermal_conductivity: {e}")
            return None

    @staticmethod
    def calculate_h_conv(Tf, To, geometry, outer_diameter_m=None, wind_speed_ms=0):
        """
        Calcula o coeficiente de transferência de calor por convecção
        """
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
                L_c = 0.1 # Mantido como 0.1 para Superfície Plana sem vento, conforme Streamlit
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
        
        h_conv_val = (Nu * k_ar) / L_c
        print(f"  DEBUG Backend: calculate_h_conv(Tf={Tf:.1f}, To={To:.1f}, geo={geometry}, Lc={L_c:.3f}) -> h_conv={h_conv_val:.3f}")
        return h_conv_val

    @staticmethod
    def find_cold_face_temperature(Tq, To, L_total, k_func_str, geometry, emissividade, pipe_diameter_m=None, wind_speed_ms=0):
        """
        Encontra a temperatura da face fria usando método iterativo
        """
        Tf = To + 10.0
        max_iter, step, min_step, tolerancia = 1000, 50.0, 0.001, 0.5
        erro_anterior = None
        
        print(f"DEBUG Backend: Iniciando iteração para encontrar Tf. Tq={Tq}, To={To}, L_total={L_total}, k_func={k_func_str}, geo={geometry}, emi={emissividade}, pipe_d={pipe_diameter_m}")

        for i in range(max_iter):
            T_media = (Tq + Tf) / 2
            k = ThermalCalculations.calculate_thermal_conductivity(k_func_str, T_media)
            if k is None or k <= 0: 
                print(f"DEBUG Backend: k é None ou <= 0 na iteração {i}")
                return None, None, False

            if geometry == "Superfície Plana":
                q_conducao = k * (Tq - Tf) / L_total
                outer_surface_diameter = L_total
            elif geometry == "Tubulação":
                r_inner = pipe_diameter_m / 2
                r_outer = r_inner + L_total
                if r_inner <= 0 or r_outer <= r_inner: 
                    print(f"DEBUG Backend: Raio inválido na iteração {i}")
                    return None, None, False
                q_conducao = (k * (Tq - Tf)) / (r_outer * math.log(r_outer / r_inner))
                outer_surface_diameter = r_outer * 2

            Tf_K, To_K = Tf + 273.15, To + 273.15
            h_conv = ThermalCalculations.calculate_h_conv(Tf, To, geometry, outer_surface_diameter, wind_speed_ms)
            q_rad = emissividade * SIGMA * (Tf_K**4 - To_K**4)
            q_conv = h_conv * (Tf - To)
            q_transferencia = q_conv + q_rad
            
            erro = q_conducao - q_transferencia
            
            print(f"DEBUG Backend Iter {i}: Tf={Tf:.2f}, T_media={T_media:.2f}, k={k:.6f}, q_conducao={q_conducao:.3f}, h_conv={h_conv:.3f}, q_rad={q_rad:.3f}, q_conv={q_conv:.3f}, q_transferencia={q_transferencia:.3f}, erro={erro:.3f}")

            if abs(erro) < tolerancia: 
                print(f"DEBUG Backend: Convergido na iteração {i}. Tf={Tf:.2f}, q_transferencia={q_transferencia:.3f}")
                return Tf, q_transferencia, True

            if erro_anterior is not None and erro * erro_anterior < 0:
                step = max(min_step, step * 0.5)
            Tf += step if erro > 0 else -step
            erro_anterior = erro
            
        print("DEBUG Backend: Não convergiu após max_iter.")
        return Tf, None, False

    @staticmethod
    def calculate_thermal_performance(data, materials_data, finishes_data):
        """
        Calcula o desempenho térmico usando a lógica correta do código de referência
        """
        try:
            # Extrair dados
            material = data.get("material")
            finish = data.get("finish")
            geometry = data.get("geometry", "Superfície Plana")
            pipe_diameter = data.get("pipeDiameter", 88.9)
            hot_temp = data.get("hotTemp")
            ambient_temp = data.get("ambientTemp")
            layers = data.get("layers", 1)
            layer_thicknesses = data.get("layerThicknesses", [])
            financial_calc = data.get("financialCalc", False)
            
            # Validar temperatura do material
            material_data = next((m for m in materials_data if m["nome"] == material), None)
            if material_data:
                if not (material_data["t_min"] <= hot_temp <= material_data["t_max"]):
                    raise Exception(f"Temperatura {hot_temp}°C está fora do range permitido para {material} ({material_data['t_min']}°C a {material_data['t_max']}°C)")
            
            # Obter propriedades do acabamento
            finish_data = next((f for f in finishes_data if f["acabamento"] == finish), None)
            emissivity = finish_data["emissividade"] if finish_data else 0.9
            
            # Calcular espessura total em metros
            total_thickness = sum(layer_thicknesses) / 1000  # converter mm para m
            
            # Usar a função correta para encontrar a temperatura da face fria
            k_func_str = material_data["k_func"] if material_data else "0.05"
            pipe_diameter_m = pipe_diameter / 1000 if geometry == "Tubulação" else None
            
            cold_face_temp, heat_loss_with_w, converged = ThermalCalculations.find_cold_face_temperature(
                hot_temp, ambient_temp, total_thickness, k_func_str, geometry, emissivity, pipe_diameter_m
            )
            
            if not converged:
                raise Exception("Cálculo não convergiu. Verifique os parâmetros de entrada.")
            
            # Converter para kW/m²
            heat_loss_with = heat_loss_with_w / 1000
            
            # Cálculo da perda sem isolante usando a mesma lógica do código de referência
            if geometry == "Superfície Plana":
                h_sem = ThermalCalculations.calculate_h_conv(hot_temp, ambient_temp, geometry, None)
                q_rad_sem = emissivity * SIGMA * ((hot_temp + 273.15)**4 - (ambient_temp + 273.15)**4)
                q_conv_sem = h_sem * (hot_temp - ambient_temp)
                heat_loss_without = (q_conv_sem + q_rad_sem) / 1000  # kW/m²
            else:  # Tubulação
                pipe_diameter_m = pipe_diameter / 1000
                h_sem = ThermalCalculations.calculate_h_conv(hot_temp, ambient_temp, geometry, pipe_diameter_m)
                q_rad_sem = emissivity * SIGMA * ((hot_temp + 273.15)**4 - (ambient_temp + 273.15)**4)
                q_conv_sem = h_sem * (hot_temp - ambient_temp)
                heat_loss_without = (q_conv_sem + q_rad_sem) / 1000  # kW/m²
            
            # Redução de perda
            loss_reduction = ((heat_loss_without - heat_loss_with) / heat_loss_without) * 100 if heat_loss_without > 0 else 0
            
            # Cálculo das temperaturas entre camadas (simplificado)
            layer_temperatures = []
            if layers > 1:
                temp_drop_per_layer = (hot_temp - cold_face_temp) / layers
                for i in range(layers - 1):
                    layer_temp = hot_temp - (i + 1) * temp_drop_per_layer
                    layer_temperatures.append(round(layer_temp, 1))
            
            result = {
                "coldFaceTemp": round(cold_face_temp, 1),
                "heatLossWithInsulation": round(heat_loss_with, 3),
                "heatLossWithoutInsulation": round(heat_loss_without, 3),
                "reducaoPercentual": round(loss_reduction, 1),
                "layerTemperatures": layer_temperatures
            }
            
            # Cálculo financeiro se solicitado
            if financial_calc:
                fuel_type = data.get("fuelType", "Óleo BPF (kg)")
                area = data.get("area", 10)
                hours_per_day = data.get("hoursPerDay", 8)
                days_per_week = data.get("daysPerWeek", 5)
                fuel_cost = data.get("fuelCost", 3.50)
                
                # Dados dos combustíveis baseados no código de referência
                combustiveis = {
                    "Óleo BPF (kg)": {"v": fuel_cost, "pc": 11.34, "ef": 0.80, "fator_emissao": 3.15},
                    "Gás Natural (m³)": {"v": fuel_cost, "pc": 9.65, "ef": 0.75, "fator_emissao": 2.0},
                    "Lenha Eucalipto 30% umidade (ton)": {"v": fuel_cost, "pc": 3500.00, "ef": 0.70, "fator_emissao": 1260},
                    "Eletricidade (kWh)": {"v": fuel_cost, "pc": 1.00, "ef": 1.00, "fator_emissao": 0.0358}
                }
                
                comb_data = combustiveis.get(fuel_type, combustiveis["Óleo BPF (kg)"])
                
                # Seguindo exatamente a lógica do Streamlit
                economia_kw_m2 = heat_loss_without - heat_loss_with
                custo_kwh = fuel_cost / (comb_data["pc"] * comb_data["ef"])
                monthly_economy = economia_kw_m2 * custo_kwh * area * hours_per_day * days_per_week * 4.33
                annual_economy = monthly_economy * 12
                
                # Cálculo de Carbono seguindo exatamente o Streamlit
                energia_efetiva_anual_kwh = economia_kw_m2 * area * hours_per_day * days_per_week * 4.33 * 12
                energia_bruta_anual_kwh = energia_efetiva_anual_kwh / comb_data["ef"]
                quantidade_comb_poupado = energia_bruta_anual_kwh / comb_data["pc"]
                co2_evitado_anual_kg = quantidade_comb_poupado * comb_data["fator_emissao"]
                co2_avoided = co2_evitado_anual_kg / 1000
                
                result.update({
                    "monthlyEconomy": round(monthly_economy, 2),
                    "annualEconomy": round(annual_economy, 2),
                    "co2Avoided": round(co2_avoided, 2)
                })
            
            return result
            
        except Exception as e:
            raise Exception(f"Erro no cálculo térmico: {str(e)}")
    
    @staticmethod
    def calculate_condensation(data, materials_data):
        """
        Calcula a espessura mínima para evitar condensação
        """
        try:
            material = data.get("material")
            geometry = data.get("geometry", "Superfície Plana")
            pipe_diameter = data.get("pipeDiameter", 88.9)
            internal_temp = data.get("internalTemp")
            ambient_temp = data.get("ambientTemp")
            humidity = data.get("humidity")
            wind_speed = data.get("windSpeed", 0)
            
            # Obter propriedades do material
            material_data = next((m for m in materials_data if m["nome"] == material), None)
            k_func_str = material_data["k_func"] if material_data else "0.05"
            
            # Cálculo da temperatura de orvalho usando fórmula de Magnus
            a = 17.27
            b = 237.7
            alpha = ((a * ambient_temp) / (b + ambient_temp)) + math.log(humidity / 100.0)
            dew_point = (b * alpha) / (a - alpha)
            
            # Iteração para encontrar espessura mínima
            min_thickness = 0
            for thickness_mm in range(1, 200):  # Testar de 1 a 200 mm
                thickness = thickness_mm / 1000  # converter para metros
                
                # Usar a mesma lógica do código de referência
                pipe_diameter_m = pipe_diameter / 1000 if geometry == "Tubulação" else None
                
                # Encontrar temperatura da superfície externa usando método iterativo
                surface_temp, _, converged = ThermalCalculations.find_cold_face_temperature(
                    internal_temp, ambient_temp, thickness, k_func_str, geometry, 0.9, pipe_diameter_m, wind_speed
                )
                
                if converged and surface_temp > dew_point + 2:  # Margem de segurança de 2°C
                    min_thickness = thickness_mm
                    break
            
            return {
                "dewPoint": round(dew_point, 1),
                "minThickness": min_thickness
            }
            
        except Exception as e:
            raise Exception(f"Erro no cálculo de condensação: {str(e)}")
    
    @staticmethod
    def validate_material_temperature(material, temperature, materials_data):
        """
        Valida se a temperatura está dentro do range do material
        """
        for mat in materials_data:
            if mat["nome"] == material:
                return mat["t_min"] <= temperature <= mat["t_max"]
        return True



