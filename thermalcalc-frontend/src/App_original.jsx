import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Thermometer, Calculator, Leaf, TrendingUp, FileText, Menu, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import thermalcalcLogo from './assets/thermalcalc_logo_transparent.png'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('thermal')
  const [materials, setMaterials] = useState([])
  const [finishes, setFinishes] = useState([])
  const [fuels, setFuels] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Estados para cálculo térmico
  const [thermalData, setThermalData] = useState({
    material: '',
    finish: '',
    geometry: 'Superfície Plana',
    hotTemp: 250,
    ambientTemp: 30,
    layerThicknesses: [51],
    pipeDiameter: 88.9,
    calculateFinancial: false,
    financialData: {
      fuel: 'Eletricidade (kWh)',
      fuelCost: 0.65,
      area: 10,
      hoursPerDay: 8,
      daysPerWeek: 5,
      editFuelCost: false
    }
  })

  // Estados para cálculo de condensação
  const [condensationData, setCondensationData] = useState({
    material: '',
    geometry: 'Superfície Plana',
    internalTemp: 5,
    ambientTemp: 25,
    humidity: 70,
    windSpeed: 0,
    pipeDiameter: 88.9
  })

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  // Carregar dados da API ao inicializar
  useEffect(() => {
    const loadData = async () => {
      try {
        const [materialsRes, finishesRes, fuelsRes] = await Promise.all([
          fetch('/api/materials'),
          fetch('/api/finishes'),
          fetch('/api/fuels')
        ]);

        const materialsData = await materialsRes.json();
        const finishesData = await finishesRes.json();
        const fuelsData = await fuelsRes.json();

        if (materialsData.success) setMaterials(materialsData.data);
        if (finishesData.success) setFinishes(finishesData.data);
        if (fuelsData.success) setFuels(Object.keys(fuelsData.data));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  // Atualizar custo do combustível quando o tipo muda
  useEffect(() => {
    if (!thermalData.financialData.editFuelCost && fuels.length > 0) {
      fetch('/api/fuels')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const fuelData = data.data[thermalData.financialData.fuel];
            if (fuelData) {
              setThermalData(prev => ({
                ...prev,
                financialData: {
                  ...prev.financialData,
                  fuelCost: fuelData.v
                }
              }));
            }
          }
        })
        .catch(console.error);
    }
  }, [thermalData.financialData.fuel, thermalData.financialData.editFuelCost, fuels]);

  const handleThermalCalculation = async () => {
    setLoading(true)
    try {
      // Validar se os campos obrigatórios estão preenchidos
      if (!thermalData.material || !thermalData.finish) {
        alert('Por favor, selecione o material do isolante e o tipo de acabamento.');
        setLoading(false);
        return;
      }

      const requestData = {
        material: thermalData.material,
        finish: thermalData.finish,
        geometry: thermalData.geometry,
        hotTemp: thermalData.hotTemp,
        ambientTemp: thermalData.ambientTemp,
        layerThicknesses: thermalData.layerThicknesses,
        pipeDiameter: thermalData.pipeDiameter,
        calculateFinancial: thermalData.calculateFinancial,
        financialData: thermalData.financialData
      };

      const response = await fetch('/api/calculate/thermal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setResults({
          type: 'thermal',
          ...result.data
        });
      } else {
        alert(`Erro no cálculo: ${result.error}`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro no cálculo:', error);
      alert('Erro ao realizar o cálculo. Tente novamente.');
      setLoading(false);
    }
  }

  const handleCondensationCalculation = async () => {
    setLoading(true)
    try {
      // Validar se os campos obrigatórios estão preenchidos
      if (!condensationData.material) {
        alert('Por favor, selecione o material do isolante.');
        setLoading(false);
        return;
      }

      const requestData = {
        material: condensationData.material,
        geometry: condensationData.geometry,
        internalTemp: condensationData.internalTemp,
        ambientTemp: condensationData.ambientTemp,
        humidity: condensationData.humidity,
        windSpeed: condensationData.windSpeed,
        pipeDiameter: condensationData.pipeDiameter
      };

      const response = await fetch('/api/calculate/condensation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setResults({
          type: 'condensation',
          ...result.data
        });
      } else {
        alert(`Erro no cálculo: ${result.error}`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Erro no cálculo:', error);
      alert('Erro ao realizar o cálculo. Tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile-Optimized */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={thermalcalcLogo} alt="ThermalCalc" className="h-12 sm:h-16" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">ThermalCalc</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">cálculos claros, decisões eficientes</p>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="sm:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Menu</h3>
                  <Button 
                    variant={activeTab === 'thermal' ? 'default' : 'ghost'} 
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('thermal');
                      setResults(null);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Thermometer className="w-4 h-4 mr-2" />
                    Cálculo Térmico
                  </Button>
                  <Button 
                    variant={activeTab === 'condensation' ? 'default' : 'ghost'} 
                    className="justify-start"
                    onClick={() => {
                      setActiveTab('condensation');
                      setResults(null);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Cálculo Frio
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Análise de Isolamento Térmico</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Ferramenta profissional para cálculos térmicos e análise de retorno financeiro em isolamentos industriais
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setResults(null); }} className="space-y-6">
          {/* Desktop Tab Navigation */}
          <TabsList className="hidden sm:grid w-full grid-cols-2">
            <TabsTrigger value="thermal" className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4" />
              <span>Cálculo Térmico e Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="condensation" className="flex items-center space-x-2">
              <Calculator className="w-4 h-4" />
              <span>Cálculo Térmico Frio</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile Tab Indicator */}
          <div className="sm:hidden bg-muted rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              {activeTab === 'thermal' ? (
                <>
                  <Thermometer className="w-5 h-5 text-primary" />
                  <span className="font-medium">Cálculo Térmico e Financeiro</span>
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5 text-primary" />
                  <span className="font-medium">Cálculo Térmico Frio</span>
                </>
              )}
            </div>
          </div>

          {/* Aba Cálculo Térmico */}
          <TabsContent value="thermal" className="space-y-6">
            <Card className="thermal-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Thermometer className="w-5 h-5 text-primary" />
                  <span>Parâmetros do Isolamento Térmico</span>
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros para análise térmica e financeira
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material do Isolante</Label>
                    <Select value={thermalData.material} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, material: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.nome} value={material.nome}>
                            {material.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finish">Tipo de Acabamento</Label>
                    <Select value={thermalData.finish} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, finish: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o acabamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishes.map((finish) => (
                          <SelectItem key={finish.acabamento} value={finish.acabamento}>
                            {finish.acabamento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geometry">Tipo de Superfície</Label>
                    <Select value={thermalData.geometry} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, geometry: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Superfície Plana">Superfície Plana</SelectItem>
                        <SelectItem value="Tubulação">Tubulação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {thermalData.geometry === 'Tubulação' && (
                  <div className="space-y-2">
                    <Label htmlFor="pipeDiameter">Diâmetro externo da tubulação (mm)</Label>
                    <Input
                      type="number"
                      value={thermalData.pipeDiameter}
                      onChange={(e) => setThermalData(prev => ({...prev, pipeDiameter: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotTemp">Temperatura da face quente (°C)</Label>
                    <Input
                      type="number"
                      value={thermalData.hotTemp}
                      onChange={(e) => setThermalData(prev => ({...prev, hotTemp: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ambientTemp">Temperatura ambiente (°C)</Label>
                    <Input
                      type="number"
                      value={thermalData.ambientTemp}
                      onChange={(e) => setThermalData(prev => ({...prev, ambientTemp: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thickness">Espessura do isolante (mm)</Label>
                    <Input
                      type="number"
                      value={thermalData.layerThicknesses[0]}
                      onChange={(e) => setThermalData(prev => ({...prev, layerThicknesses: [parseFloat(e.target.value)]}))}
                      className="thermal-input"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="calculateFinancial"
                    checked={thermalData.calculateFinancial}
                    onCheckedChange={(checked) => setThermalData(prev => ({...prev, calculateFinancial: checked}))}
                  />
                  <Label htmlFor="calculateFinancial" className="text-sm font-medium">
                    Calcular retorno financeiro e ambiental
                  </Label>
                </div>

                {thermalData.calculateFinancial && (
                  <Card className="bg-muted/50 border-dashed">
                    <CardHeader>
                      <CardTitle className="text-lg">Dados Financeiros</CardTitle>
                      <CardDescription>Configure os parâmetros para análise econômica</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fuel">Tipo de Combustível</Label>
                          <Select value={thermalData.financialData?.fuel || 'Eletricidade (kWh)'} onValueChange={(value) => 
                            setThermalData(prev => ({...prev, financialData: {...prev.financialData, fuel: value}}))
                          }>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fuels.map((fuel) => (
                                <SelectItem key={fuel} value={fuel}>
                                  {fuel}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="editFuelCost"
                              checked={thermalData.financialData?.editFuelCost}
                              onCheckedChange={(checked) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, editFuelCost: checked}}))}
                            />
                            <Label htmlFor="editFuelCost" className="text-sm font-medium">
                              Editar Custo do Combustível (R$)
                            </Label>
                          </div>
                          <Input
                            type="number"
                            step="0.01"
                            value={thermalData.financialData?.fuelCost || 0.65}
                            onChange={(e) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, fuelCost: parseFloat(e.target.value)}}))}
                            className="thermal-input"
                            disabled={!thermalData.financialData?.editFuelCost}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="area">Área da superfície (m²)</Label>
                          <Input
                            type="number"
                            value={thermalData.financialData?.area || 10}
                            onChange={(e) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, area: parseFloat(e.target.value)}}))}
                            className="thermal-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hoursPerDay">Horas por dia</Label>
                          <Input
                            type="number"
                            value={thermalData.financialData?.hoursPerDay || 8}
                            onChange={(e) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, hoursPerDay: parseFloat(e.target.value)}}))}
                            className="thermal-input"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="daysPerWeek">Dias por semana</Label>
                          <Input
                            type="number"
                            value={thermalData.financialData?.daysPerWeek || 5}
                            onChange={(e) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, daysPerWeek: parseFloat(e.target.value)}}))}
                            className="thermal-input"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={handleThermalCalculation}
                  disabled={loading}
                  className="thermal-button-primary w-full"
                >
                  {loading ? 'Calculando...' : 'Calcular'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Cálculo de Condensação */}
          <TabsContent value="condensation" className="space-y-6">
            <Card className="thermal-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-secondary" />
                  <span>Cálculo de Espessura Mínima para Condensação</span>
                </CardTitle>
                <CardDescription>
                  Determine a espessura mínima para evitar condensação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condensationMaterial">Material do Isolante</Label>
                    <Select value={condensationData.material} onValueChange={(value) => 
                      setCondensationData(prev => ({...prev, material: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha o material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map((material) => (
                          <SelectItem key={material.nome} value={material.nome}>
                            {material.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condensationGeometry">Tipo de Superfície</Label>
                    <Select value={condensationData.geometry} onValueChange={(value) => 
                      setCondensationData(prev => ({...prev, geometry: value}))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Superfície Plana">Superfície Plana</SelectItem>
                        <SelectItem value="Tubulação">Tubulação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="internalTemp">Temperatura interna (°C)</Label>
                    <Input
                      type="number"
                      value={condensationData.internalTemp}
                      onChange={(e) => setCondensationData(prev => ({...prev, internalTemp: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condensationAmbientTemp">Temperatura ambiente (°C)</Label>
                    <Input
                      type="number"
                      value={condensationData.ambientTemp}
                      onChange={(e) => setCondensationData(prev => ({...prev, ambientTemp: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="humidity">Umidade relativa (%)</Label>
                    <Input
                      type="number"
                      value={condensationData.humidity}
                      onChange={(e) => setCondensationData(prev => ({...prev, humidity: parseFloat(e.target.value)}))}
                      className="thermal-input"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCondensationCalculation}
                  disabled={loading}
                  className="thermal-button-secondary w-full"
                >
                  {loading ? 'Calculando...' : 'Calcular Espessura Mínima'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resultados */}
        {results && (
          <Card className="thermal-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Resultados do Cálculo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.type === 'thermal' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{results.temperatureFaceFria}°C</div>
                    <div className="text-sm text-muted-foreground">Temperatura Face Fria</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{results.perdaComIsolante} kW/m²</div>
                    <div className="text-sm text-muted-foreground">Perda com Isolante</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-accent">{results.perdaSemIsolante} kW/m²</div>
                    <div className="text-sm text-muted-foreground">Perda sem Isolante</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{results.reducaoPercentual}%</div>
                    <div className="text-sm text-muted-foreground">Redução de Perda</div>
                  </div>
                  {thermalData.calculateFinancial && (
                    <>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-primary">R$ {results.economiaMensal?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div className="text-sm text-muted-foreground">Economia Mensal</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-secondary">R$ {results.economiaAnual?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div className="text-sm text-muted-foreground">Economia Anual</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-accent flex items-center justify-center space-x-1">
                          <Leaf className="w-5 h-5" />
                          <span>{results.co2EvitadoTonAno} t</span>
                        </div>
                        <div className="text-sm text-muted-foreground">CO₂ Evitado/Ano</div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{results.temperaturaOrvalho}°C</div>
                    <div className="text-sm text-muted-foreground">Temperatura de Orvalho</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary">{results.espessuraMinima} mm</div>
                    <div className="text-sm text-muted-foreground">Espessura Mínima</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button className="thermal-button-secondary flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Download Relatório PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 ThermalCalc. Todos os direitos reservados.</p>
            <p className="text-sm mt-2">Calculadora Térmica e de Retorno Financeiro para Isolamentos Industriais</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

