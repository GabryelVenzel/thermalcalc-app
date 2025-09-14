import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Thermometer, Calculator, Leaf, TrendingUp, FileText, Menu } from 'lucide-react'
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
    if (!thermalData.financialData.editFuelCost && fuels.length > 0 && thermalData.financialData.fuel) {
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
        // --- INÍCIO DO NOVO BLOCO DE VALIDAÇÃO ---
        if (thermalData.calculateFinancial) {
            if (thermalData.financialData.hoursPerDay > 24) {
              alert('Erro: O número de horas por dia não pode ser maior que 24.');
              setLoading(false);
              return; // Impede a continuação do cálculo
            }
            if (thermalData.financialData.daysPerWeek > 7) {
              alert('Erro: O número de dias por semana não pode ser maior que 7.');
              setLoading(false);
              return; // Impede a continuação do cálculo
            }
          }
          // --- FIM DO NOVO BLOCO DE VALIDAÇÃO ---

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const result = await response.json();
      if (result.success) {
        setResults({ type: 'thermal', ...result.data });
      } else {
        alert(`Erro no cálculo: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro no cálculo:', error);
      alert('Erro ao realizar o cálculo. Tente novamente.');
    } finally {
        setLoading(false);
    }
  }

  const handleCondensationCalculation = async () => {
    setLoading(true)
    try {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const result = await response.json();
      if (result.success) {
        setResults({ type: 'condensation', ...result.data });
      } else {
        alert(`Erro no cálculo: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro no cálculo de condensação:', error);
      alert('Erro ao realizar o cálculo. Tente novamente.');
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!results) {
      alert("Primeiro, realize um cálculo para gerar o relatório.");
      return;
    }
    setLoading(true);
    try {
      const reportType = results.type;
      const requestData = {
        ...(reportType === 'thermal' ? thermalData : condensationData),
        results: results
      };
      const response = await fetch(`/api/download/pdf/${reportType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      if (response.ok) {
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'relatorio.pdf';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
          }
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert(`Erro ao gerar o PDF: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao baixar o PDF:', error);
      alert('Ocorreu um erro ao tentar baixar o relatório.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="flex items-center justify-between">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Aba Cálculo Térmico */}
          <TabsContent value="thermal" className="space-y-6">
            <Card className="thermal-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Thermometer className="w-5 h-5 text-primary" />
                  <span>Parâmetros do Isolamento Térmico</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure os parâmetros para análise térmica e financeira
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grid responsivo para mobile */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material" className="text-sm font-medium">Material do Isolante</Label>
                    <Select value={thermalData.material} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, material: value}))
                    }>
                      <SelectTrigger className="h-12 w-full">
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
                    <Label htmlFor="finish" className="text-sm font-medium">Tipo de Acabamento</Label>
                    <Select value={thermalData.finish} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, finish: value}))
                    }>
                      <SelectTrigger className="h-12 w-full">
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
                    <Label htmlFor="geometry" className="text-sm font-medium">Tipo de Superfície</Label>
                    <Select value={thermalData.geometry} onValueChange={(value) => 
                      setThermalData(prev => ({...prev, geometry: value}))
                    }>
                      <SelectTrigger className="h-12 w-full">
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
                    <Label htmlFor="pipeDiameter" className="text-sm font-medium">Diâmetro externo da tubulação (mm)</Label>
                    <Input
                      type="number"
                      value={thermalData.pipeDiameter}
                      onChange={(e) => setThermalData(prev => ({...prev, pipeDiameter: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hotTemp" className="text-sm font-medium">Temperatura da face quente (°C)</Label>
                    <Input
                      type="number"
                      value={thermalData.hotTemp}
                      onChange={(e) => setThermalData(prev => ({...prev, hotTemp: parseFloat(e.target.value)}))}
                      className="thermal-input h-12 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ambientTemp" className="text-sm font-medium">Temperatura ambiente (°C)</Label>
                    <Input
                      type="number"
                      value={thermalData.ambientTemp}
                      onChange={(e) => setThermalData(prev => ({...prev, ambientTemp: parseFloat(e.target.value)}))}
                      className="thermal-input h-12 w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thickness" className="text-sm font-medium">Espessura do isolante (mm)</Label>
                    <Input
                      type="number"
                      value={thermalData.layerThicknesses[0]}
                      onChange={(e) => setThermalData(prev => ({...prev, layerThicknesses: [parseFloat(e.target.value)]}))}
                      className="thermal-input h-12 w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <Checkbox
                    id="calculateFinancial"
                    checked={thermalData.calculateFinancial}
                    onCheckedChange={(checked) => setThermalData(prev => ({...prev, calculateFinancial: checked}))}
                    className="h-5 w-5"
                  />
                  <Label htmlFor="calculateFinancial" className="text-sm font-medium cursor-pointer">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fuel" className="text-sm font-medium">Tipo de Combustível</Label>
                          <Select value={thermalData.financialData?.fuel || ''} onValueChange={(value) => 
                            setThermalData(prev => ({...prev, financialData: {...prev.financialData, fuel: value}}))
                          }>
                            <SelectTrigger className="h-12">
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
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id="editFuelCost"
                              checked={thermalData.financialData?.editFuelCost}
                              onCheckedChange={(checked) => setThermalData(prev => ({...prev, financialData: {...prev.financialData, editFuelCost: checked}}))}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="editFuelCost" className="text-sm font-medium">
                              Editar Custo do Combustível (R$)
                            </Label>
                          </div>
                          <Input
                            type="number"
                            min="0" // Validação adicionada
                            step="0.01"
                            value={thermalData.financialData?.fuelCost}
                            onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseFloat(value);
                                if (value === '' || numericValue >= 0) {
                                    setThermalData(prev => ({ ...prev, financialData: { ...prev.financialData, fuelCost: value === '' ? '' : numericValue } }));
                                }
                            }}
                            className="thermal-input h-12"
                            disabled={!thermalData.financialData?.editFuelCost}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="area" className="text-sm font-medium">Área da superfície (m²)</Label>
                          <Input
                            type="number"
                            min="0" // Validação adicionada
                            value={thermalData.financialData?.area}
                            onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseFloat(value);
                                if (value === '' || numericValue >= 0) {
                                    setThermalData(prev => ({ ...prev, financialData: { ...prev.financialData, area: value === '' ? '' : numericValue } }));
                                }
                            }}
                            className="thermal-input h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="hoursPerDay" className="text-sm font-medium">Horas por dia</Label>
                          <Input
                            type="number"
                            min="0" // Validação adicionada
                            value={thermalData.financialData?.hoursPerDay}
                            onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseFloat(value);
                                if (value === '' || numericValue >= 0) {
                                    setThermalData(prev => ({ ...prev, financialData: { ...prev.financialData, hoursPerDay: value === '' ? '' : numericValue } }));
                                }
                            }}
                            className="thermal-input h-12"
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                          <Label htmlFor="daysPerWeek" className="text-sm font-medium">Dias por semana</Label>
                          <Input
                            type="number"
                            min="0" // Validação adicionada
                            value={thermalData.financialData?.daysPerWeek}
                            onChange={(e) => {
                                const value = e.target.value;
                                const numericValue = parseFloat(value);
                                if (value === '' || numericValue >= 0) {
                                    setThermalData(prev => ({ ...prev, financialData: { ...prev.financialData, daysPerWeek: value === '' ? '' : numericValue } }));
                                }
                            }}
                            className="thermal-input h-12"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Button 
                  onClick={handleThermalCalculation}
                  disabled={loading}
                  className="thermal-button-primary w-full h-12 text-base font-semibold"
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
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Calculator className="w-5 h-5 text-secondary" />
                  <span>Parâmetros para Prevenção de Condensação</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure os parâmetros para cálculo de espessura mínima contra condensação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condensationMaterial" className="text-sm font-medium">Material do Isolante</Label>
                    <Select value={condensationData.material} onValueChange={(value) => 
                      setCondensationData(prev => ({...prev, material: value}))
                    }>
                      <SelectTrigger className="h-12">
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
                    <Label htmlFor="condensationGeometry" className="text-sm font-medium">Tipo de Superfície</Label>
                    <Select value={condensationData.geometry} onValueChange={(value) => 
                      setCondensationData(prev => ({...prev, geometry: value}))
                    }>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Superfície Plana">Superfície Plana</SelectItem>
                        <SelectItem value="Tubulação">Tubulação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="windSpeed" className="text-sm font-medium">Velocidade do vento (m/s)</Label>
                    <Input
                      type="number"
                      value={condensationData.windSpeed}
                      onChange={(e) => setCondensationData(prev => ({...prev, windSpeed: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>
                </div>

                {condensationData.geometry === 'Tubulação' && (
                  <div className="space-y-2">
                    <Label htmlFor="condensationPipeDiameter" className="text-sm font-medium">Diâmetro externo da tubulação (mm)</Label>
                    <Input
                      type="number"
                      value={condensationData.pipeDiameter}
                      onChange={(e) => setCondensationData(prev => ({...prev, pipeDiameter: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="internalTemp" className="text-sm font-medium">Temperatura interna (°C)</Label>
                    <Input
                      type="number"
                      value={condensationData.internalTemp}
                      onChange={(e) => setCondensationData(prev => ({...prev, internalTemp: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condensationAmbientTemp" className="text-sm font-medium">Temperatura ambiente (°C)</Label>
                    <Input
                      type="number"
                      value={condensationData.ambientTemp}
                      onChange={(e) => setCondensationData(prev => ({...prev, ambientTemp: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="humidity" className="text-sm font-medium">Umidade relativa (%)</Label>
                    <Input
                      type="number"
                      value={condensationData.humidity}
                      onChange={(e) => setCondensationData(prev => ({...prev, humidity: parseFloat(e.target.value)}))}
                      className="thermal-input h-12"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCondensationCalculation}
                  disabled={loading}
                  className="thermal-button-secondary w-full h-12 text-base font-semibold"
                >
                  {loading ? 'Calculando...' : 'Calcular Espessura Mínima'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resultados Mobile-Optimized */}
        {results && (
          <Card className="thermal-card mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Resultados do Cálculo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.type === 'thermal' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{results.temperatureFaceFria}°C</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Temperatura Face Fria</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-secondary">{results.perdaComIsolante} kW/m²</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Perda com Isolante</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-accent">{results.perdaSemIsolante} kW/m²</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Perda sem Isolante</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{results.reducaoPercentual}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Redução de Perda</div>
                  </div>
                  {thermalData.calculateFinancial && (
                    <>
                      <div className="bg-muted rounded-lg p-4 text-center sm:col-span-2 lg:col-span-1">
                        <div className="text-lg sm:text-2xl font-bold text-primary">R$ {results.economiaMensal?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Economia Mensal</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center sm:col-span-2 lg:col-span-1">
                        <div className="text-lg sm:text-2xl font-bold text-secondary">R$ {results.economiaAnual?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Economia Anual</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4 text-center sm:col-span-2 lg:col-span-1">
                        <div className="text-lg sm:text-2xl font-bold text-accent flex items-center justify-center space-x-1">
                          <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>{results.co2EvitadoTonAno} t</span>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground">CO₂ Evitado/Ano</div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-secondary">{results.temperaturaOrvalho}°C</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Temperatura de Orvalho</div>
                  </div>
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{results.espessuraMinima} mm</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Espessura Mínima</div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleDownloadPdf}
                  disabled={loading}
                  className="thermal-button-secondary flex items-center space-x-2 h-12 px-6"
                >
                  <FileText className="w-4 h-4" />
                  <span>{loading ? 'Gerando PDF...' : 'Download Relatório PDF'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer Mobile-Optimized */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">&copy; 2024 ThermalCalc. Todos os direitos reservados.</p>
            <p className="text-xs mt-2">Calculadora Térmica e de Retorno Financeiro para Isolamentos Industriais</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App