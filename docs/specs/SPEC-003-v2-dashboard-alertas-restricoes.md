# SPEC-003-v2: Dashboard — Alertas de Restrições no Painel

**Status:** Completed ✅  
**Owner:** Supero Smart Code / Engie  
**Reviewers:** Engie Architecture Board  
**Data:** 2026-07-21  
**Depends on:** SPEC-003 (Dashboard UI/UX Paridade)  

---

## 1. Problema

O dashboard do PROGER SMARTCODE renderiza o grid de usinas com cards de gráficos, mas **não exibe os alertas de restrições violadas** na lateral esquerda de cada usina. No legado PROGER 2, quando uma usina viola restrições ativas (máximo/minimo de vazão, geração, nível, taxas de variação), ícones vermelhos aparecem na lateral com tooltip descrevendo as restrições violadas.

A ausência desses alertas impede que operadores identifiquem visualmente usinas com problemas antes de abrir a tela de programação.

## 2. Contexto

O legado PROGER 2 calcula alertas no frontend (`useValidaRestricoes.js` + `useAlertUsina.js`), iterando sobre cada período do dia atual e aplicando 9 tipos de regra (23 `CD_TP_RESTRICAO` distintos). O resultado é agrupado por `iconeTipoAtributo` em 3 ícones: `faPrescriptionBottle` (nível), `faBolt` (geração), `faTint` (hidráulico/vazão).

No SMARTCODE, optamos pela **Alternativa A** (backend calcula e retorna alertas prontos), com a customização solicitada pelo usuário: retornar `alertasRestricoesPainel` como objeto categorizado com as descrições das restrições violadas.

Base de dados já possui `PRG_TIPOS_RESTRICAO` com `CD_TIPO_ATRIBUTO` (1=Vazão/hidráulico, 2=Geração, 3=Nível).

## 3. Objetivos (e Não-Objetivos)

### Objetivos

- **O1.** Backend calcula violações de restrições para os 48 períodos do dia atual no painel
- **O2.** Backend retorna `alertasRestricoesPainel` agrupado por `CD_TIPO_ATRIBUTO` com descrições (`DS_RESTRICAO`) e códigos (`CD_TP_RESTRICAO`)
- **O3.** Frontend consome alertas e renderiza ícones vermelhos (Pill=nível, Zap=geração, Droplets=hidráulico)
- **O4.** Tooltip no hover do ícone mostra a lista de restrições violadas
- **O5.** Ícones sem violações permanecem transparentes (invisíveis)
- **O6.** Taxas de variação (tipos 7-18) também são validadas no painel

### Não-Objetivos

- **NÃO** alterar comportamento de cálculo hidráulico do painel
- **NÃO** alterar endpoint de validação unitário (`ValidarRestricoesUseCase`) — usado pela tela de programação
- **NÃO** incluir alerta ONS neste escopo (é regra independente, fora de `PRG_TIPOS_RESTRICAO`)

## 4. Requisitos

### Funcionais

- **RF-01:** O backend deve validar restrições para cada um dos 48 períodos do dia atual (índices 48-95 do array `dados`)
- **RF-02:** O backend deve aplicar todos os 23 tipos de regra: max/min value (1-6, 19-20, 22-23), taxas de variação (7-18), faixa proibida (21)
- **RF-03:** O DTO `DadosPainelDto` deve conter `alertasRestricoesPainel` com estrutura:

  ```json
  {
    "geracao": [{ "cdTpRestricao": 22, "descricao": "Geração Mínima (MW)" }],
    "hidrico": [{ "cdTpRestricao": 4, "descricao": "Vazão Defluente Máxima (m³/s)" }],
    "nivel": [{ "cdTpRestricao": 20, "descricao": "Nível Máximo (m)" }]
  }
  ```

- **RF-04:** Arrays vazios na categoria = ícone transparente (sem alerta)
- **RF-05:** Tooltip no hover do ícone deve listar todas as `descricao` da categoria, separadas por quebra de linha

### Não-Funcionais

- **RNF-01:** Sem regressão de performance — validação deve ser O(n×m) onde n=48 períodos, m=restricoesAtivas
- **RNF-02:** Retrocompatível: campo `alertasRestricoesPainel` é opcional no DTO
- **RNF-03:** Tipagem TypeScript `strict: true` preservada

## 5. Proposta Técnica

### 5.1 Backend — Extensão do domínio de restrições

**Novo serviço:** `ValidadorPainelService` (`modules/restriction/domain/services/validador-painel.service.ts`)

- Recebe: `DadosPainelItem[]` (array completo), `RestricaoAtiva[]`
- Retorna: `Map<number, ViolacaoRestricao[]>` (violacoes por cdTpRestricao)
- Implementa:
  - Max/min value: delega para `ValidadorRestricoes` existente
  - Taxas de variação (tipos 7-18): calcula diferença entre períodos consecutivos
  - Taxas móveis (tipos 17-18): janela deslizante sobre array

**Extensão `RestricaoAtiva`:**

- Adicionar `cdTipoAtributo: number` (mapeamento 1→hidrico, 2→geracao, 3→nivel)

**Extensão `TypeOrmRestricaoRepository`:**

- Incluir `tr.CD_TIPO_ATRIBUTO` no SELECT

**Extensão `DadosPainel` read model:**

```ts
export interface AlertaRestricaoItem {
  cdTpRestricao: number;
  descricao: string;
}
export interface AlertasRestricoesPainel {
  geracao: AlertaRestricaoItem[];
  hidrico: AlertaRestricaoItem[];
  nivel: AlertaRestricaoItem[];
}
// Adicionar a DadosPainel
```

**Extensão `DadosPainelDto`:**

- Adicionar `AlertasRestricoesPainelDto` com `@ApiProperty`

**Modificação `TypeOrmProgramacaoReadRepository`:**

- Após calcular `dados` e buscar `restricoes`, instanciar `ValidadorPainelService`
- Iterar períodos 48-95, coletar violações distintas
- Agrupar por `cdTipoAtributo` → categorias

### 5.2 Frontend — Consumo e renderização

**Extensão `types/api.ts`:**

```ts
export interface AlertaRestricaoItem {
  cdTpRestricao: number;
  descricao: string;
}
export interface AlertasRestricoesPainel {
  geracao: AlertaRestricaoItem[];
  hidrico: AlertaRestricaoItem[];
  nivel: AlertaRestricaoItem[];
}
// Adicionar a DadosPainelResponse
```

**Modificação `dashboard-page.tsx`:**

- Extrair `alertasRestricoesPainel` de `historicoQueries[index]?.data`
- Passar para `ProgerChartCard`

**Modificação `ProgerChartCard`:**

- Adicionar prop `alertasRestricoesPainel?: AlertasRestricoesPainel`
- Renderizar tooltip com descrições no hover de cada ícone

## 6. Planos de Testes

### Unitários (backend)

- `ValidadorPainelService`: cenário com 2 restrições violadas em 3 períodos → deve retornar violações distintas
- `ValidadorPainelService`: taxa de variação meia-hora → diferença entre períodos i e i-1
- Mapeamento `cdTipoAtributo` → categoria correta

### Integração (backend)

- `GET /api/v2/programacao/painel/{cdUsina}?dt=...` retorna `alertasRestricoesPainel`
- Categorias vazias quando não há violações

### Visual / E2E (frontend)

- Dashboard com usina violando restrição de nível → ícone Pill vermelho com tooltip
- Dashboard com usina sem violações → todos ícones transparentes
- Tooltip lista todas as descrições da categoria

## 7. Estimativa

| Task | Esforço |
| ------ | --------- |
| ValidadorPainelService + taxas de variação | 1h30 |
| Extensão repository + DTO + handler | 30 min |
| Integração no ProgramacaoReadRepository | 30 min |
| Frontend types + dashboard-page + ProgerChartCard | 30 min |
| Testes unitários + E2E visual | 30 min |
| **Total** | **~3h30** |

## 8. Histórico de Revisão

| Data | Versão | Autor | Mudança |
|------|--------|-------|---------|
| 2026-07-21 | 1.0 | Supero Smart Code | Criação — continuação SPEC-003 |
