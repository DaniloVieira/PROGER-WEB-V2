# SPEC-004 — Tela de Programação com Dynamic Tabs Shell

> **Status:** Draft → **Approved**  
> **Data:** 2026-07-21  
> **Owner:** Supero Smart Code / Engie  
> **Versão:** 1.0  
> **Depende de:** SPEC-003 (Dashboard com paridade visual legado)

---

## 1. Objetivo

Implementar a **tela de Programação de Geração** (`/programacao/[cdUsina]`) como um **shell de abas dinâmicas** (dynamic tabs) estilo Jira/Azure DevOps, onde:

- O **Dashboard** é a aba fixa e inicial
- Cada usina aberta vira uma **aba dinâmica** com rota própria (deep link)
- O componente de programação é **desacoplado** do shell — renderizável tanto aninhado (dentro das abas) quanto standalone (em nova aba do navegador)
- O estado das abas **persiste na URL** para sobreviver a refresh

---

## 2. Requisitos Funcionais

### 2.1 Shell de Abas (Tab Shell)

| ID | Requisito | Critério de Aceitação |
| ---- | ----------- | ---------------------- |
| **TS-001** | Aba fixa "Dashboard" | Sempre presente, primeira posição, **não fechável**, **não reordenável**. Ícone opcional (🏠). |
| **TS-002** | Abas dinâmicas de Programação | Ao clicar em uma usina no Dashboard, abre aba com título `cdUsina` (ex: `UHJA`). Máximo **8 abas dinâmicas**. |
| **TS-003** | Fechamento individual | Cada aba dinâmica tem botão ✕. Atalho `Ctrl+W` fecha aba ativa. |
| **TS-004** | Reordenação | Abas dinâmicas podem ser reordenadas via drag-and-drop (`@dnd-kit/sortable`). Dashboard permanece fixo. |
| **TS-005** | Deep link | Cada aba dinâmica corresponde à rota `/programacao/[cdUsina]`. URL acessível diretamente em nova aba do navegador. |
| **TS-006** | Persistência de estado | Estado das abas (quais abertas, ordem, aba ativa) persiste na **URL via query string** (`?tabs=UHJA,UHCC&active=UHJA`) ou **localStorage** com sincronização. |
| **TS-007** | Indicador de carregamento | Aba exibe spinner enquanto dados carregam (TanStack Query `isLoading`). |
| **TS-008** | Indicador de alteração | Aba exibe dot laranja (●) quando há dados não salvos (dirty state). |

### 2.2 Componente de Programação (Desacoplado)

| ID | Requisito | Critério de Aceitação |
| ---- | ----------- | ---------------------- |
| **PG-001** | Renderização dual | O componente `ProgramacaoPage` renderiza **com ou sem** o Tab Shell. Quando a rota é `/programacao/[cdUsina]` acessada diretamente, exibe apenas o conteúdo da programação (sem abas). Quando navegado internamente, renderiza dentro do shell. |
| **PG-002** | Paridade visual com legado | Replicar o layout da tela de programação do PROGER 2: grid horária (48 períodos), cabeçalho com metadados da usina, botões de ação (Publicar, Copiar ONS, Importar). |
| **PG-003** | Grid Excel-like (`ProgerSheet`) | Usar `ProgerSheet` (componente customizado `<table>` HTML) com: seleção de range, edição inline (double-click **ou** digitar ao selecionar), shift+arrastar para replicar, copiar/colar (Ctrl+C/V), undo/redo, coloração condicional por alertas de restrição. **Tipo de input configurável por coluna** (`number` default ou `text`). |
| **PG-003.1** | Edição ao digitar | Quando uma célula está selecionada (foco) e o usuário digita qualquer tecla, a célula entra automaticamente em modo de edição — comportamento Excel-like. |
| **PG-003.2** | Tipo de input por coluna | Default `number` (só aceita dígitos e separador decimal). Configurável para `text` (letras+números) por coluna via prop `inputType`. Ex: coluna "Intervalo" aceita `text`, coluna "Geração MW" é `number`. |
| **PG-004** | Cálculo hidráulico em tempo real | Ao editar geração MW (ou outros campos editáveis), o backend recalcula automaticamente vazão turbinada, defluente, afluente, volume, nível (via API do Módulo Calculation). |
| **PG-005** | Validação de restrições | Integrar com `ValidadorPainelService` (backend) para destacar células que violam restrições ativas (borda vermelha pulse, tooltip). |
| **PG-006** | Undo/Redo | Stack de operações no Zustand store. `Ctrl+Z` / `Ctrl+Y` para desfazer/refazer edições na grid. |
| **PG-006** | Persistência | Botão "Salvar" persiste dados via `CommandBus` (`EditarDadosProgramacaoCommand`). Toast de sucesso/erro. |
| **PG-007** | Publicação | Botão "Publicar" dispara `PublicarProgramacaoCommand` com confirmação modal. |
| **PG-008** | Copiar ONS | Botão "Copiar Dados ONS" copia valores ONS para os campos editáveis (se disponíveis). |

---

## 3. Arquitetura Frontend

### 3.1 Roteamento — Nested Routes / Layout Routes

Estrutura de rotas no Next.js 14 App Router:

```
app/
├── (main)/                    # Grupo de rotas autenticadas
│   ├── layout.tsx             # MainLayout (header + TabShell)
│   ├── page.tsx               # Redireciona para /dashboard
│   ├── dashboard/
│   │   └── page.tsx           # DashboardPage (aba fixa)
│   └── programacao/
│       └── [cdUsina]/
│           └── page.tsx       # ProgramacaoPage (componente desacoplado)
├── programacao/
│   └── [cdUsina]/
│       └── page.tsx           # ProgramacaoPage standalone (SEM shell)
```

**Explicação:**

- Rotas dentro de `(main)/` renderizam **com** o Tab Shell (layout compartilhado)
- Rotas em `programacao/[cdUsina]/` (fora do grupo) renderizam **sem** o Tab Shell
- Ambas usam o **mesmo componente** `ProgramacaoPage`, passando uma prop `standalone?: boolean`

### 3.2 Estado das Abas — URL + localStorage

**Opção A (URL-first):**

```
/dashboard?tabs=UHJA,UHCC,UHCB&active=UHJA
```

- `tabs`: lista de cdUsinas abertos, separados por vírgula
- `active`: cdUsina da aba ativa
- Ao dar refresh, o TabShell lê a URL e restaura as abas

**Opção B (localStorage + sync):**

- `localStorage.setItem('proger-tabs', JSON.stringify({ tabs, activeTabId }))`
- Sync com URL quando mudar de aba
- Fallback para URL quando localStorage vazio

**Decisão:** Implementar **Opção A (URL-first)** por ser mais robusta (funciona em nova aba, compartilhável, bookmarkável).

### 3.3 Integração com useTabStore (Zustand)

Extensões no store existente:

```typescript
interface TabState {
  tabs: Tab[];
  activeTabId: string;
  // Novo
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  reorderTabs: (from: number, to: number) => void;
  setActiveTab: (id: string) => void;
  getTabsFromUrl: () => { tabs: Tab[]; activeTabId: string };
  syncToUrl: () => void;
}
```

---

## 4. Arquitetura Backend (API)

### 4.1 Endpoints Necessários

| Método | Endpoint | Descrição | Módulo |
| -------- | ---------- | ----------- | -------- |
| `GET` | `/api/v2/programacoes/:cdProgramacao/dados` | Dados da programação (48 períodos) | Query |
| `PUT` | `/api/v2/programacoes/:cdProgramacao/dados` | Editar dados da programação | Command |
| `POST` | `/api/v2/programacoes/:cdProgramacao/publicar` | Publicar programação | Command |
| `POST` | `/api/v2/programacoes/:cdProgramacao/copiar-ons` | Copiar dados ONS para campos editáveis | Command |
| `GET` | `/api/v2/programacoes/:cdProgramacao/restricoes` | Restrições ativas para a programação | Restriction |
| `POST` | `/api/v2/programacoes/:cdProgramacao/validar` | Validar programação contra restrições | Restriction |
| `POST` | `/api/v2/calculo/hidraulico` | Recalcular balanço hidráulico | Calculation |

### 4.2 Contrato de Dados

```typescript
// Request: PUT /api/v2/programacoes/:cdProgramacao/dados
interface EditarDadosProgramacaoDto {
  dados: Array<{
    nrIntervaloTempo: number;
    geracaoMW?: number;
    vazaoVertida?: number;
    // Campos calculados são read-only (retornados pelo backend)
  }>;
}

// Response: GET /api/v2/programacoes/:cdProgramacao/dados
interface DadosProgramacaoResponse {
  cdProgramacao: number;
  cdUsina: string;
  dtProgramacao: string;
  situacao: 'EM_EDICAO' | 'PUBLICADA';
  dados: DadosProgramacaoItem[];
  restricoesAtivas: RestricaoAtiva[];
  alertas: AlertaRestricaoItem[];
}
```

---

## 5. Design UX/UI

### 5.1 Layout da Tela de Programação (Paridade com Legado)

A tela de programação segue o **layout do legado PROGER 2** — área principal dividida em duas colunas: **gráficos à esquerda (70%)** e **grid de edição à direita (30%)**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard │  UHJA ✕  │  UHCC ✕  │  + ...                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │  UHE JAGUARA — Jaguara    [Salvar] [Publicar] [Copiar ONS] [Simular] │   │
│  │  Data: 23/07/2026  │  Situação: EM EDIÇÃO  │  Programação: #128931   │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐ │   │
│  │  │Vazão Defl│Vazão Incr│Vazão Aflu│Vazão Turb│Vazão Vert│Vazão Defl│ │   │
│  │  │Montante  │          │ente [m³/s]│inada [m³/s]│ida [m³/s]│uente [m³/s]│ │   │
│  │  │  0       │  0       │  0       │  0       │  0       │  0       │ │   │
│  │  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤ │   │
│  │  │Nível Inic│Nível Final│Variação │Geração Méd│Vol. Útil │          │ │   │
│  │  │557.61 [m]│557.61 [m]│  0.00    │  0 [MW]  │69.53%    │          │ │   │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                    UHE JAGUARA                         [ONS]   │ │   │
│  │  │         SIMULAÇÃO HIDROENERGÉTICA - PROGRAMAÇÃO                │ │   │
│  │  │  ┌──────────────────────────────────────────────────────────┐   │ │   │
│  │  │  │  ████▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲   │   │ │   │
│  │  │  │  ─── Nível Reservatório  - - - Nível Máximo/Mínimo       │   │ │   │
│  │  │  │  ▓▓▓ Dados Verificados      ── Geração UHLB                │   │ │   │
│  │  │  │                                                            │   │ │   │
│  │  │  │     22/07/2026        │        23/07/2026                │   │ │   │
│  │  │  └──────────────────────────────────────────────────────────┘   │ │   │
│  │  │  [Geração] [Vazão Afluente] [Vazão Vertida] [Nível] [Dados Verif]│ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  ████████████████████████████████████████████████████████████  │ │   │
│  │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ │   │
│  │  │  ─── Disponibilidade de Geração                                │ │   │
│  │  │                                                            │   │ │   │
│  │  │     22/07/2026        │        23/07/2026                │   │ │   │
│  │  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │  │  [Geração UHJA] [Disponibilidade] [Dados Verificados]              │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐   │
│  │  [📊] [📥] [🔄] [✓] [📋] [📁] [⚙️]  ← botões de ação da grid      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  │ Intervalo │ Dados ONS │ Programação │ Qvert    │ Qincr    │    │   │
│  │  │           │ UHLB│UHJA │ UHLB│UHJA   │ UHLB│UHJA│ UHLB│UHJA│    │   │
│  │  ├───────────┼─────┼─────┼─────────────┼──────────┼──────────┤    │   │
│  │  │ 00:00-00:30│  0  │  0  │    0  │  0  │   0  │  0 │  0  │  0 │    │   │
│  │  │ 00:30-01:00│  0  │  0  │    0  │  0  │   0  │  0 │  0  │  0 │    │   │
│  │  │    ...    │ ... │ ... │   ... │ ... │  ... │ ...│ ... │ ...│    │   │
│  │  │ 23:30-00:00│  0  │  0  │    0  │  0  │   0  │  0 │  0  │  0 │    │   │
│  │  ├───────────┼─────┼─────┼─────────────┼──────────┼──────────┤    │   │
│  │  │ Média     │  0  │  0  │    0  │  0  │   0  │  0 │  0  │  0 │    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Componentes Reaproveitados do Dashboard

| Componente do Dashboard | Reaproveitado? | Como na Tela de Programação |
| ------------------------ | ---------------- | ---------------------------- |
| `ProgerChartCard` | ✅ **Parcial** | Extrair `ProgerChartCore` (lógica Recharts) para reutilização. Criar `ProgerSimulationChart` (wrapper full-page) com título, legenda, eixos com unidades, botão ONS. |
| `ProgerTooltip` | ✅ **Sim** | Mesmo componente para tooltips de restrição nos gráficos. |
| `ProgerDatePicker` | ✅ **Sim** | Seletor de data no header da página. |
| `ProgerActionButton` | ✅ **Sim** | Botões de ação (Publicar, Copiar ONS, Simular, etc.). |
| `ProgerConfirmDialog` | ✅ **Sim** | Modais de confirmação (publicar, reverter). |

### 5.3 Novos Componentes

| Componente | Descrição |
| ----------- | ----------- |
| `ProgerSimulationChart` | Wrapper full-page dos dois gráficos (top + bottom) com título, legenda completa, eixos com unidades, botão ONS. Usa `ProgerChartCore` internamente. |
| `ProgerChartCore` | Lógica Recharts extraída de `ProgerChartCard` — renderiza `ComposedChart` com dados, eixos, séries. Reutilizável entre dashboard e tela de programação. |
| `ProgerResumoHeader` | Tabela de resumo com 11 métricas agregadas (vazões, níveis, geração média, volume útil). Estilo: bordas arredondadas, fundo escuro. |
| `ProgerSheet` | Grid de programação (componente customizado `<table>`). Ver seção 5.5. |
| `ProgerActionBar` | Barra de botões de ação acima da grid (Copiar ONS, Publicar, Simular, Reverter, Aceitar, etc.). |

### 5.4 Layout Responsivo

```
Desktop (>=1280px):  Gráficos 70% │ Grid 30%
Tablet (1024-1279px): Gráficos 60% │ Grid 40%  (grid com menos colunas visíveis)
Tablet (<1024px):     Gráficos 100% (stacked) │ Grid 100% (abaixo)
Mobile (<768px):      Apenas grid em modo read-only + gráficos simplificados
```

### 5.5 Grid de Programação (`ProgerSheet` — componente customizado)

A grid usa **`<table>` HTML pura** (zero bibliotecas externas de grid), replicando o comportamento do `react-datasheet` do legado.

**Estrutura de dados da célula:**

```typescript
interface CellData {
  value: string | number;
  readOnly?: boolean;
  inputType?: "number" | "text";   // default: "number"
  className?: string;              // classes CSS: white-col, gray-col, red-font, manual-cell
  stroke?: boolean;                // border-left: 2px solid #C4C4C4
  restricoes?: string[];           // descrições de restrições violadas
  isManual?: boolean;              // editado manualmente
}
```

**Funcionalidades implementadas:**

| Funcionalidade | Implementação |
| ---------------- | --------------- |
| **Render base** | `<table>` HTML com `<thead>`, `<tbody>`, `<tfoot>`. Sem virtualização necessária (apenas 48–96 linhas). |
| **Seleção de range** | State `selectedRange: {startRow, startCol, endRow, endCol}`. Eventos `onMouseDown`/`onMouseOver`/`onMouseUp` na `<td>`. |
| **Edição inline (double-click)** | `onDoubleClick` na `<td>` → troca para `<input>` inline. `onBlur` ou `Enter` confirma; `Escape` cancela. |
| **Edição ao digitar (Excel-like)** | `onKeyDown` no `<table>` → se uma célula está selecionada e a tecla é alfanumérica, entra em modo edição automaticamente. |
| **Shift + arrastar (replicar)** | `event.shiftKey` + detecção de direção (horizontal/vertical). Replicar valor da célula inicial para todo o range. Verificar `!readOnly` no destino. |
| **Ctrl+C / Ctrl+V** | `document.addEventListener('copy'/'paste')` + `clipboardData`. Serializar range como TSV. |
| **Tipo de input** | Prop `inputType` por célula: `"number"` (default, valida regex `[0-9,.-]`) ou `"text"` (qualquer caractere). |
| **Cores** | Função `getCellClassName(cell, row, col)` retorna classes Tailwind: `bg-[#1a1d21]`/`bg-[#222224]` (stripes), `text-red-500`, `text-orange-400`, `text-blue-400` (manual). |
| **Read-only** | Células `readOnly: true` ignoram `onDoubleClick`, `onKeyDown` de edição e não entram no range de replicação. |
| **Validação inline** | Hook `useSheetCellFormatter(dadosGraficos, restricoesAtivas)` — replica `parseToObjectValue` do legado, aplicando classes e `restricoes`. |
| **Stroke (borda)** | Prop `stroke: true` → `style={{ borderLeft: '2px solid #C4C4C4' }}` na `<td>`. |
| **Formatação numérica** | `valueRenderer` usa `Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2})`. |
| **Undo/Redo** | Stack no Zustand: `Ctrl+Z` / `Ctrl+Y`. |

### 5.6 API do `ProgerSheet`

```tsx
<ProgerSheet
  data={CellData[][]}                    // Array2D de CellData
  onCellsChanged={(changes) => void}     // Array de {row, col, value}
  onSelect={({start, end}) => void}      // Coordenadas do range selecionado
  valueRenderer={(value, cell) => string} // Formatação do valor exibido
  cellRenderer={(props) => JSX.Element}   // Render customizado da <td>
  sheetRenderer={({children}) => JSX.Element} // Wrapper <table>
  inputType="number"                     // Default global
/>
```

### 5.7 Cores da Grid (Coloração Condicional)

| Estado | Fundo | Texto | Borda |
| -------- | ------- | ------- | ------- |
| Valor dentro dos limites | `#1a1d21` (default) | `#ffffff` | `transparent` |
| Aviso (margem < 5%) | `#3d3a1a` (amarelo escuro) | `#ffcc00` | `transparent` |
| Violação crítica | `#3d1a1a` (vermelho escuro) | `#ff4444` | `#ff4444` pulse |
| Dados verificados | `#1a1d21` | `#888888` itálico | `transparent` |
| Valor manual | `#1a1d21` | `#5d9cec` | `transparent` |
| Valor ONS | `#1a1d21` | `#42A5F5` | `transparent` |

---

## 6. Implementação

### 6.1 Checklist de Tarefas

#### Phase 1 — Refactor do Tab Shell (URL persistence)

- [ ] Extender `useTabStore` com `getTabsFromUrl()` e `syncToUrl()`
- [ ] Modificar `TabShell` para ler estado inicial da URL
- [ ] Adicionar `standalone` prop ao `MainLayout` (condicional)

#### Phase 2 — Roteamento (Nested Routes)

- [ ] Criar rota standalone `app/programacao/[cdUsina]/page.tsx`
- [ ] Criar rota com shell `app/(main)/programacao/[cdUsina]/page.tsx`
- [ ] Extrair `ProgramacaoContent` como componente compartilhado

#### Phase 3 — Tela de Programação (UI)

**Layout geral:**

- [ ] Criar `ProgramacaoPage` com layout de 2 colunas (gráficos 70% + grid 30%)
- [ ] Criar `ProgerResumoHeader` — tabela com 11 métricas agregadas (vazões, níveis, geração, volume)

**Gráficos (reaproveitando `ProgerChartCard`):**

- [ ] Extrair `ProgerChartCore` do `ProgerChartCard` (lógica Recharts compartilhável)
- [ ] Criar `ProgerSimulationChart` — wrapper full-page com:
  - Título "UHE X — SIMULAÇÃO HIDROENERGÉTICA - PROGRAMAÇÃO"
  - Botão ONS no canto superior direito
  - Dois eixos Y com unidades ([m³/s], [m], [MW])
  - Legenda completa abaixo de cada gráfico
  - Separação visual D-1 / D (ReferenceArea)
- [ ] Integrar gráficos top (vazão/nível) e bottom (geração/disponibilidade)

**Grid (`ProgerSheet`):**

- [ ] Criar `ProgerSheet` (componente customizado `<table>`)
- [ ] Implementar seleção de range (click + drag)
- [ ] Implementar edição inline (double-click **e** digitar ao selecionar)
- [ ] Implementar tipo de input por coluna (`number` default / `text` configurável)
- [ ] Implementar shift+arrastar para replicar valores
- [ ] Implementar Ctrl+C / Ctrl+V (clipboard nativo)
- [ ] Implementar coloração condicional via `getCellClassName()`
- [ ] Adicionar tooltips de restrição em células

**Botões de ação:**

- [ ] Criar `ProgerActionBar` — barra de botões acima da grid
- [ ] Integrar botões: Copiar ONS, Publicar, Simular, Reverter, Aceitar, Importar Manual

#### Phase 4 — Integração Backend

- [ ] Endpoint `GET /programacoes/:id/dados` (QueryModule)
- [ ] Endpoint `PUT /programacoes/:id/dados` (CommandModule)
- [ ] Endpoint `POST /programacoes/:id/publicar` (CommandModule)
- [ ] Endpoint `POST /calculo/hidraulico` (CalculationModule)
- [ ] Integrar `ValidadorPainelService` na grid

#### Phase 5 — UX Polish

- [ ] Undo/Redo na grid (Zustand stack)
- [ ] Dirty state indicator (● na aba)
- [ ] Loading skeleton durante fetch
- [ ] Toast notifications (sonner)

### 6.2 Dependências

| Dependência | Versão | Uso |
| ------------- | -------- | ----- |
| `@dnd-kit/core` | `^6.1.0` | Drag-and-drop de abas (já instalado) |
| `@dnd-kit/sortable` | `^8.0.0` | Reordenação (já instalado) |
| `zustand` | `^4.5.0` | Estado global + undo/redo stack (já instalado) |
| `@tanstack/react-query` | `^5.0.0` | Server state (já instalado) |
| `react-hook-form` | `^7.51.0` | Formulários (já instalado) |
| `zod` | `^3.22.0` | Validação (já instalado) |

> **Nota:** `ag-grid-enterprise` será **removido**. A grid de programação usa `ProgerSheet` (componente customizado `<table>` HTML, zero dependências externas).

---

## 7. Testes

### 7.1 Testes de Unidade (Frontend)

```typescript
// useTabStore.test.ts
describe('TabStore URL persistence', () => {
  it('should restore tabs from URL query params', () => {
    // Mock window.location.search = '?tabs=UHJA,UHCC&active=UHJA'
    const store = useTabStore.getState();
    expect(store.tabs).toHaveLength(3); // Dashboard + 2 dinâmicas
    expect(store.activeTabId).toBe('UHJA');
  });

  it('should sync tabs to URL when adding tab', () => {
    const store = useTabStore.getState();
    store.addTab({ id: 'UHCB', title: 'UHCB', path: '/programacao/UHCB' });
    // Assert URL updated
  });
});
```

### 7.2 Testes E2E

| Cenário | Passos | Resultado Esperado |
| --------- | -------- | ------------------- |
| Abrir usina em nova aba | 1. Clicar em UHJA no Dashboard | Aba "UHJA" aparece, URL = `/programacao/UHJA` |
| Fechar aba | 1. Clicar ✕ na aba UHJA | Aba some, volta para Dashboard |
| Reordenar abas | 1. Drag UHCC para antes de UHJA | Ordem alterada, URL atualizada |
| Refresh preserva abas | 1. Abrir UHJA e UHCC 2. F5 | Ambas as abas restauradas, ativa mantida |
| Deep link standalone | 1. Abrir `/programacao/UHJA` em nova guia | Tela renderiza SEM shell de abas |
| Editar célula (double-click) | 1. Double-click em Geração 00:00 2. Digitar 100 3. Tab | Valor salvo, células calculadas atualizadas, ● aparece na aba |
| Editar célula (digitar) | 1. Click em Geração 00:00 2. Digitar 100 | Célula entra em modo edição automaticamente, valor salvo |
| Replicar com shift | 1. Click em célula 00:00 2. Segurar SHIFT + arrastar até 04:00 3. Soltar | Todas as células do range recebem o mesmo valor |
| Header de resumo | 1. Abrir `/programacao/UHJA` | Tabela com 11 métricas visível (vazões, níveis, geração, volume) |
| Gráficos com legenda | 1. Abrir `/programacao/UHJA` | Dois gráficos renderizados com título, eixos com unidades, legenda completa |
| Botão ONS | 1. Abrir `/programacao/UHJA` | Botão "ONS" visível no canto superior direito do gráfico top |

---

## 8. Riscos e Mitigações

| Risco | Impacto | Mitigação |
| ------- | --------- | ----------- |
| Complexidade do roteamento Next.js | Alto | Usar grupo de rotas `(main)` + rotas paralelas fora do grupo. Testar ambos os modos (shell/standalone) desde o início. |
| Performance da grid com 48 linhas + cálculos | Médio | `ProgerSheet` usa `<table>` HTML pura (sem virtualização necessária para apenas 48–96 linhas). Cálculos hidráulicos no backend (não no browser). |
| Estado da URL ficar grande (>2k chars) | Baixo | Limitar a 8 abas. Usar localStorage como fallback se URL muito grande. |
| Concorrência de edição (2 usuários editando) | Alto | Implementar optimistic locking no backend (versionamento da programação). |

---

## 9. Decisões de Arquitetura

### ADR-007: Dynamic Tabs com URL Persistence

**Contexto:** Precisamos de abas dinâmicas que sobrevivam a refresh e permitam deep link.

**Decisão:** Usar **URL query parameters** (`?tabs=...&active=...`) como fonte primária de verdade para o estado das abas. localStorage como cache secundário.

**Consequências:**

- (+) URLs compartilháveis e bookmarkáveis
- (+) Funciona em nova aba do navegador sem código extra
- (-) URL pode ficar longa com muitas abas (mitigado pelo limite de 8)

### ADR-008: Componente Desacoplado (Shell vs Standalone)

**Contexto:** O mesmo componente de programação deve funcionar dentro do shell de abas ou sozinho.

**Decisão:** Criar o componente `ProgramacaoContent` puro (sem layout). Duas rotas Next.js compartilham o mesmo componente:

- `app/(main)/programacao/[cdUsina]/page.tsx` → renderiza com TabShell
- `app/programacao/[cdUsina]/page.tsx` → renderiza sem TabShell

**Consequências:**

- (+) Sem duplicação de código
- (+) SEO funciona para URLs standalone
- (-) Roteamento ligeiramente mais complexo

---

## 10. Referências

- [ARQUITETURA-PROGER-v2.md](/docs/ARQUITETURA-PROGER-v2.md) — Seção 7.3.1 (Tab Shell)
- [SPEC-003](/docs/specs/SPEC-003-dashboard-ui-ux-paridade-legado.md) — Dashboard (base)
- [SPEC-003-v2](/docs/specs/SPEC-003-v2-dashboard-alertas-restricoes.md) — Alertas de restrição
- [Next.js App Router — Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes)
- [Next.js App Router — Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes)

---

## 11. Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-07-21 | Danilo Vieira | Criação inicial da SPEC-004 |
