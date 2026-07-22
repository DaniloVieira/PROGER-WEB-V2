# SPEC-003: Dashboard — Correções de UI/UX para Paridade com Legado PROGER 2

**Status:** Completed ✅
**Owner:** Supero Smart Code / Engie
**Reviewers:** Engie Architecture Board
**Data:** 2026-07-21
**Tickets:** PROGER-v2-FASE0 (continuação — ajustes visuais dashboard)
**Depends on:** SPEC-001 (Fase 0 — PoC Fundação)

---

## 1. Problema

O dashboard do PROGER SMARTCODE (Painel de Programação Diária) foi implementado com diferenças visuais e comportamentais em relação ao legado PROGER 2. Essas divergências foram identificadas durante sessão de validação visual comparativa entre as duas versões. O objetivo é alcançar **paridade visual e comportamental** no dashboard, garantindo que usuários do legado não percebam regressão ao migrar para o novo sistema.

As divergências estavam em:

- Data default do filtro (deveria ser D+1, estava como hoje)
- Fundo opaco dos cards de gráfico (deveria ser transparente)
- Círculos no hover do mouse sobre gráficos (deveria ser desativado)
- Linhas de nível máximo/mínimo (tracejadas vermelhas) acompanhando a curva de nível (deveriam ser horizontais fixas — restrição ou eixo)
- Linha de disponibilidade sobreposta à barra de geração (deveria refletir valor real de disponibilidade)
- Nome da usina vazando da aba lateral em nomes longos

## 2. Contexto

Este trabalho é parte da **Task Azure DevOps 19191** (Diagnóstico Técnico da Arquitetura) e **19196** (PoC Limitada — Cálculo no Back-end ou Cache em Memória), que mapearam o legado PROGER 2 e definiram a evolução arquitetural para o PROGER SMARTCODE.

O relatório `GANHOS-POC-IMPLEMENTADOS.md` (sessão anterior) documentou o estado da PoC em 2026-07-17. Esta SPEC cobre os **ajustes de UI/UX** identificados posteriormente durante validação visual do dashboard.

Referências do legado analisadas:

- `proger-web/src/utils/DadosGraficoUtils.js` — cálculo de dados do gráfico
- `proger-web/src/components/hooks/useValidaRestricoes.js` — extração de restrições ativas
- `proger-web/src/components/PainelProgDiariaEnergia/UsinaChart/Graficos/Grafico1.js` — renderização top chart
- `proger-web/src/components/PainelProgDiariaEnergia/UsinaChart/Graficos/Grafico2.js` — renderização bottom chart

## 3. Objetivos (e Não-Objetivos)

### Objetivos

- **O1.** Data default do filtro de data no dashboard deve ser D+1 (amanhã) ao abrir a página pela primeira vez
- **O2.** Fundo dos cards de gráfico deve ser transparente (sem card opaco), permitindo o fundo escuro do dashboard passar por trás
- **O3.** Eliminar círculos de hover (`activeDot`) em todas as linhas dos gráficos (top e bottom)
- **O4.** Linhas de nível máximo/mínimo devem ser horizontais fixas: restrição ativa (tipos 19/20) com fallback para parâmetros de eixo (`EIXO_NV_MAX` / `EIXO_NV_MIN`)
- **O5.** Linha tracejada de disponibilidade (`dispGeracaoRef`) deve refletir o valor real de `disponivel` (não `geracaoMW`)
- **O6.** Nome da usina na aba lateral rotacionada não deve vazar do container — truncar com reticências (`…`)

### Não-Objetivos

- **NÃO** replicar validações de restrições de geração (tipos 21/22/23) — escopo separado
- **NÃO** alterar cores, fontes ou layout geral do dashboard além do especificado
- **NÃO** incluir abas internas (multi-usina) — será Fase 2
- **NÃO** alterar comportamento de cálculos hidráulicos — apenas apresentação

## 4. Requisitos

### Funcionais

- **RF-01:** O filtro de data do dashboard deve abrir com data default = data atual + 1 dia (D+1)
- **RF-02:** Os cards que envolvem gráfico + header não devem ter fundo opaco (`backgroundColor` deve ser removido)
- **RF-03:** Ao passar o mouse sobre qualquer linha dos gráficos, não devem aparecer círculos de destaque (`activeDot`)
- **RF-04:** A linha tracejada de nível máximo deve ser horizontal fixa no valor da restrição ativa (tipo 20) ou `EIXO_NV_MAX`
- **RF-05:** A linha tracejada de nível mínimo deve ser horizontal fixa no valor da restrição ativa (tipo 19) ou `EIXO_NV_MIN`
- **RF-06:** A linha tracejada de disponibilidade no bottom chart deve refletir o campo `disponivel` retornado pela API
- **RF-07:** Nomes de usina longos na aba lateral devem ser truncados com reticências em vez de vazar para fora

### Não-Funcionais

- **RNF-01:** Alterações devem ser retrocompatíveis com o contrato da API existente (campos adicionados como opcionais)
- **RNF-02:** Sem regressão de performance — queries de restrição devem ser feitas uma vez por usina
- **RNF-03:** Tipagem TypeScript `strict: true` preservada

## 5. Proposta Técnica

### 5.1 Data Default D+1

- Adicionar função `tomorrowISO()` em `proger-web/src/lib/date-utils.ts`
- Usar `tomorrowISO()` no estado inicial do `DashboardPage`

### 5.2 Fundo Transparente dos Cards

- Remover `style={{ backgroundColor: "#222224" }}` dos wrappers em `dashboard-page.tsx`
- Preservar `backgroundColor` interno do `ProgerChartCard` para evitar regressão em outros consumidores

### 5.3 ActiveDot Removido

- Adicionar `activeDot={false}` em todas as 6 instâncias de `<Line>` em `proger-chart-card.tsx`

### 5.4 Nível Máximo/Mínimo com Restrição + Fallback

**Backend:**

- Injetar `IRestricaoRepository` em `TypeOrmProgramacaoReadRepository`
- Buscar restrições ativas por usina (`cdTpRestricao === 19` para mínimo, `20` para máximo)
- Aplicar fórmula do legado: `restricao || paramEixo || 0`
- Adicionar `nivelMaximoReservatorio` e `nivelMinimoReservatorio` em `DadosPainelDto` / `DadosPainelItem`

**Frontend:**

- Adicionar campos em `DadosPainelItem` (`types/api.ts`)
- Ajustar `mapearHistoricoParaChart` para usar os novos campos
- Adicionar `strokeWidth={2}` na linha `nivelReservatorio` para evitar que o tracejado branco deixe passar a linha vermelha por baixo

### 5.5 Disponibilidade Correta no Bottom Chart

- Adicionar `disponivel: number` em `DadosPainelItem`
- Alterar `mapearHistoricoParaChart` para mapear `dispGeracaoRef: item.disponivel`

### 5.6 Truncamento do Nome da Usina

- Adicionar `overflow: "hidden"` e `textOverflow: "ellipsis"` no `<span>` do nome da usina na aba lateral rotacionada

## 6. Alternativas Consideradas

### Alternativa A — Corrigir nível min/max no frontend (em vez de backend)

- **Descrição:** Dashboard buscaria `getRestricoes` e aplicaria fallback localmente
- **Por que descartamos:** Duplicaria lógica de domínio no frontend (anti-padrão Ports & Adapters). O backend já consulta restrições; a lógica pertence ao domínio.
- **Quando reconsiderar:** Se houvesse latência excessiva na query de restrições por usina.

### Alternativa B — Manter fundo opaco e alterar cor do dashboard

- **Descrição:** Em vez de remover `backgroundColor`, mudar o fundo geral do dashboard para a mesma cor do card
- **Por que descartamos:** O legado intencionalmente tem fundo escuro único com gráficos transparentes sobrepostos. Mudar o fundo geral criaria diferença visual.
- **Quando reconsiderar:** Se o design system da ENGIE definir nova paleta.

### Alternativa C — Aumentar largura da aba lateral em vez de truncar

- **Descrição:** Aumentar `width` do container rotacionado para acomodar nomes longos
- **Por que descartamos:** A aba lateral tem dimensões fixas por design (160px × 30px). Aumentar quebraria o grid responsivo.
- **Quando reconsiderar:** Se o design system definir nova largura padrão.

## 7. Riscos e Mitigações

| Risco | Severidade | Mitigação |
| ------- | ----------- | ----------- |
| Backend não retorna restrições corretamente (Oracle dev ≠ prod) | Alta | Validar com dados reais de staging; fallback para `0` garante que linhas ainda apareçam no eixo |
| `disponivel` ausente em alguns registros do banco | Média | Backend usa `COALESCE(NR_DISPONIVEL, VL_DISPONIVEL, 0)`; frontend recebe sempre um número |
| `activeDot={false}` remove interatividade esperada por usuários | Baixa | O legado também não mostra activeDot; esta é paridade, não regressão |
| Nome truncado pode confundir usinas com prefixo similar | Baixa | Reticências indicam truncamento; hover ou tooltip pode ser adicionado posteriormente |

## 8. Plano de Testes

### Unitários (frontend)

- `tomorrowISO()` deve retornar data atual + 1 dia no formato ISO
- `mapearHistoricoParaChart` deve propagar `nivelMaximoReservatorio`, `nivelMinimoReservatorio` e `disponivel` corretamente

### Integração (backend)

- `buscarDadosPainel` deve incluir `nivelMaximoReservatorio` e `nivelMinimoReservatorio` derivados de restrições
- Sem restrições ativas, deve usar `EIXO_NV_MAX` / `EIXO_NV_MIN` como fallback

### Visual / E2E (manual)

- Abrir dashboard → data deve ser amanhã
- Cards devem ter fundo transparente
- Hover sobre gráfico → sem círculos
- Linhas de nível devem ser horizontais fixas
- Linha de disponibilidade deve ser independente da barra de geração
- Nome longo (ex: "UHE Santo Antônio do Jari") truncado com "…"

## 9. Observabilidade

- Logs: adicionar `cd_usina` em logs de queries de restrições para debug
- Métricas: latência da query de restrições por usina (nova)

## 10. Estimativa

- **Esforço:** 1 dia (ajustes já executados em sessão única)
- **Infra incremental:** 0
- **Custo:** 0

## 11. Histórico de Revisão

| Data | Versão | Autor | Mudança |
|------|--------|-------|---------|
| 2026-07-21 | 1.0 | Supero Smart Code | Criação retroativa — ajustes de UI/UX do dashboard já implementados |

---

## Anexos

### A. Arquivos Alterados

| Arquivo | Mudança |
| --------- | --------- |
| `proger-web/src/lib/date-utils.ts` | Adicionado `tomorrowISO()` |
| `proger-web/src/components/dashboard/dashboard-page.tsx` | Data default D+1; fundo transparente; mapper usa `nivelMaximoReservatorio`, `nivelMinimoReservatorio`, `disponivel` |
| `proger-web/src/components/proger/proger-chart-card.tsx` | `activeDot={false}` em 6x `<Line>`; `strokeWidth={2}` em `nivelReservatorio`; `overflow` + `textOverflow` no nome da usina |
| `proger-web/src/types/api.ts` | Adicionado `nivelMaximoReservatorio?`, `nivelMinimoReservatorio?`, `disponivel` em `DadosPainelItem` |
| `proger-api/src/shared/infrastructure/persistence/typeorm/repositories/typeorm-programacao-read.repository.ts` | Injetado `IRestricaoRepository`; lógica `getNivelRes(restricao, param)` aplicada |
| `proger-api/src/modules/query/domain/read-models/programacao-read.model.ts` | Adicionados campos `nivelMaximoReservatorio` e `nivelMinimoReservatorio` |
