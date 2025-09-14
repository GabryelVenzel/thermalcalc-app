# Diretrizes de Estilo - ThermalCalc

## Identidade Visual

### Nome da Aplicação
- **ThermalCalc** - Calculadora Térmica e de Retorno Financeiro
- Tagline: "cálculos claros, decisões eficientes"

### Paleta de Cores

#### Cores Principais
```css
--primary-green: #7CB342;     /* Verde sustentabilidade */
--primary-blue: #1976D2;      /* Azul tecnologia */
--secondary-blue: #42A5F5;    /* Azul claro modernidade */
--text-dark: #424242;         /* Cinza escuro para texto */
--background: #FFFFFF;        /* Branco limpo */
```

#### Cores de Apoio
```css
--success: #4CAF50;           /* Verde sucesso */
--warning: #FF9800;           /* Laranja aviso */
--error: #F44336;             /* Vermelho erro */
--info: #2196F3;              /* Azul informação */
--light-gray: #F5F5F5;        /* Cinza claro fundo */
--medium-gray: #9E9E9E;       /* Cinza médio */
```

### Tipografia

#### Fontes
- **Primária**: Inter, Roboto, "Segoe UI", sans-serif
- **Secundária**: "Open Sans", Arial, sans-serif

#### Hierarquia
```css
/* Títulos principais */
h1: 2.5rem (40px), font-weight: 700, color: var(--text-dark)
h2: 2rem (32px), font-weight: 600, color: var(--text-dark)
h3: 1.5rem (24px), font-weight: 600, color: var(--text-dark)

/* Corpo do texto */
body: 1rem (16px), font-weight: 400, color: var(--text-dark)
small: 0.875rem (14px), font-weight: 400, color: var(--medium-gray)
```

## Componentes UI

### Botões

#### Botão Primário
```css
background: var(--primary-green);
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 0.3s ease;

hover: background: #689F38;
```

#### Botão Secundário
```css
background: var(--primary-blue);
color: white;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
transition: all 0.3s ease;

hover: background: #1565C0;
```

### Campos de Input
```css
border: 2px solid #E0E0E0;
border-radius: 8px;
padding: 12px 16px;
font-size: 1rem;
transition: border-color 0.3s ease;

focus: border-color: var(--primary-blue);
```

### Cards
```css
background: white;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
padding: 24px;
transition: box-shadow 0.3s ease;

hover: box-shadow: 0 4px 16px rgba(0,0,0,0.15);
```

## Layout

### Container Principal
- Max-width: 1200px
- Padding lateral: 24px
- Margin: 0 auto

### Grid System
- Gap entre elementos: 24px
- Responsivo: mobile-first approach

### Espaçamentos
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

## Elementos Específicos

### Header
- Background: white
- Box-shadow: 0 2px 4px rgba(0,0,0,0.1)
- Logo: ThermalCalc (altura: 40px)
- Padding: 16px 24px

### Formulário de Cálculo
- Background: var(--light-gray)
- Border-radius: 12px
- Padding: 32px
- Campos organizados em grid responsivo

### Resultados
- Cards com destaque visual
- Cores baseadas no tipo de resultado:
  - Economia: var(--primary-green)
  - Financeiro: var(--primary-blue)
  - Técnico: var(--secondary-blue)

### Footer
- Background: var(--text-dark)
- Color: white
- Padding: 24px
- Texto centralizado

## Responsividade

### Breakpoints
```css
mobile: 0px - 768px
tablet: 768px - 1024px
desktop: 1024px+
```

### Adaptações Mobile
- Padding reduzido: 16px
- Font-sizes menores
- Stack vertical para formulários
- Botões full-width

## Animações e Transições

### Padrão
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Effects
- Elevação sutil em cards
- Mudança de cor em botões
- Escala leve em elementos interativos

### Loading States
- Skeleton screens
- Spinners com cores da marca
- Feedback visual imediato

## Acessibilidade

### Contraste
- Mínimo 4.5:1 para texto normal
- Mínimo 3:1 para texto grande

### Focus States
- Outline visível: 2px solid var(--primary-blue)
- Border-radius: 4px

### Semântica
- Uso correto de headings (h1, h2, h3)
- Labels associados aos inputs
- Alt text em imagens
- ARIA labels quando necessário

