# PROGER v2.0 — Progresso da Implementação

> **Última atualização:** 2026-06-28
> **Sessão:** Fase 3 — Frontend & Notificações (completa)
> **Documento de referência:** `ARQUITETURA-PROGER-v2.md`

---

## Status Geral

| Fase | Descrição | Status |
| ------ | ----------- | -------- |
| Fase 3.5 | Dashboard Polish & Restrições | ✅ **Completa** | SPEC-003, SPEC-003-v2 e SPEC-004 implementadas |
| **Fase 0** | Fundação (PoC) | ✅ **Completa** |
| **Fase 1** | Desacoplamento (MVP) | ✅ **Completa** | Tasks 1.1–1.8 todas prontas |
| **Fase 2** | Integração & Testes E2E | ✅ **Completa** | docker-compose, E2E tests, gateway polish, Swagger |
| **Fase 3** | Frontend & Notificações | ✅ **Completa** | proger-web scaffold, Tab Shell, ProgerGrid, Dashboard, Login, WebSocket, Dockerfile |
| Fase 4 | Otimização & Produção | ⬜ Pendente | CI/CD, Worker real, monitoramento |

---

## Fase 0 — Detalhamento

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 1 | Scaffold do `proger-api` (NestJS modular monolith) | ✅ Pronto | `proger-api/` com package.json, tsconfig, nest-cli, jest, .env.example |
| 2 | Módulo Calculation — cálculos hidráulicos | ✅ Pronto | Value Objects (Vazao, Volume, NivelReservatorio) + CalculoHidraulicoService. 17 testes passando. |
| 3 | Módulo Query — endpoints de leitura | ✅ Pronto | `GET /api/v2/programacoes`, `GET /api/v2/programacoes/:id/dados`, `GET /api/v2/usinas/:cdUsina/historico` · Read Model denormalizado · In-memory fake repos · 26 testes passando (17 calculation + 9 query/usina) |
| 4 | Módulo Command — `PublicarProgramacao` + Outbox | ✅ Pronto | CQRS command handler + Outbox Pattern · `POST /api/v2/programacoes/:id/publicar` · Store in-memory compartilhado com QueryModule · 9 testes passando · 100% cov Application/Domain |
| 5 | Integração Oracle 19.9 — TypeORM + entidades | ✅ Pronto | Conexão Oracle 19.9 validada com sucesso. Entidades TypeORM criadas (PRG_PROGRAMACAO, PRG_DADOS_PROGRAMACAO, PRG_USINA, PRG_OUTBOX). Repositories TypeORM implementando ports. TypeOrmModule configurado no AppModule com `synchronize: false` (TypeORM NUNCA cria/altera tabelas). Switch in-memory/Oracle via `USE_IN_MEMORY`. DDL da nova tabela PRG_OUTBOX versionado no repositório `proger-database` **local** (`proger-database/database/proger-v2/CREATE_TABLE_PRG_OUTBOX.sql`) — cópia isolada do repo original, seguindo o mesmo processo do v1. Scripts de migration TypeORM removidos do `proger-api`. 35/35 testes passando. Falta: remover fallback in-memory quando houver confiança total no Oracle. |
| 6 | Gate PoC — comparar resultados com frontend legado | ✅ Pronto | Cenário de teste real extraído do Oracle (programação 128931, UHJA, 17/06/26). Teste comparativo criado (`calculo-hidraulico-gate-poc.spec.ts`) com dados reais de curva cota-volume, parâmetros e tempos de viagem. **Descoberta crítica:** o legado usa `PRG_PRODUTIBILIDADE.VL_PRODUTIBILIDADE` (0.3935) e não `PRG_PARAMETROS.PRODUTIBILIDADE` (0.3781). Com a produtibilidade correta, os cálculos do NestJS batem com o Oracle: vazão turbinada=203, defluente=203, afluente=320, volume com divergência de ~0.04 (aceitável para PoC), nível=557.41. Testes: 42/42 passando (12 suites).

---

## Arquivos Novos desta Sessão

| Arquivo | Descrição |
| --------- | ----------- |
| `docs/database/ORACLE-SCHEMA-MAPPING.md` | Schema completo do Oracle dev — 33 tabelas, tipos, constraints, relacionamentos, mapeamento Oracle→TypeORM |
| `.pi/mcp-oracle-wrapper.sh` | Script wrapper para conectar MCP Oracle ao banco de dev na próxima sessão |
| `~/.pi/agent/mcp.json` | Configuração do MCP Oracle para o Pi (carrega automaticamente no startup) |
| `docs/specs/SPEC-001-proger-v2-poc.md` | SPEC formal da Fase 0 (retrospectivo, status Approved) |
| `docs/adr/ADR-001-modular-monolith.md` | Decisão: Modular Monolith com Ports & Adapters |
| `docs/adr/ADR-002-cqrs-outbox.md` | Decisão: CQRS com Outbox Pattern |
| `docs/adr/ADR-003-oracle-19-9.md` | Decisão: Manter Oracle 19.9 como banco transacional |
| `docs/adr/ADR-004-in-memory-store-poc.md` | Decisão: Store In-Memory para PoC (com débito técnico DT-001) |
| `docs/domain/glossary.md` | Linguagem Ubíqua do domínio PROGER |
| `README.md` | Quick start, arquitetura, variáveis de ambiente, estrutura do projeto |
| `CONTRIBUTING.md` | Regras de contribuição, convenções de código, TDD, commits, PRs |
| `CHANGELOG.md` | Keep a Changelog — releases e próximas versões |
| `.github/PULL_REQUEST_TEMPLATE.md` | Template de PR no padrão Supero |
| `.github/workflows/ci.yml` | Pipeline CI: lint, typecheck, testes, cobertura, security scan, build |

## Estrutura do Projeto

```
proger-api/                     # Código-fonte do modular monolith NestJS
├── package.json              # NestJS 10, Node 20, TypeORM, Oracle, BullMQ, Zod
├── tsconfig.json             # Paths: @/*, @modules/*, @shared/*
├── nest-cli.json
├── jest.config.js            # moduleNameMapper para @/, @modules/, @shared/
├── .env.example
└── src/
    ├── main.ts               # Bootstrap NestJS, Swagger, global prefix /api/v2
    ├── app.module.ts         # CalculationModule, QueryModule, UsinaModule registrados
    ├── shared/
    │   └── domain/
    │       ├── domain.exception.ts
    │       ├── value-object.ts
    │       ├── aggregate-root.ts
    │       ├── domain-event.ts
    │       └── index.ts
    └── modules/
        ├── command/
        │   ├── command.module.ts
        │   ├── application/
        │   │   ├── commands/
        │   │   │   └── publicar-programacao.command.ts
        │   │   └── dtos/
        │   │       └── publicar-programacao.dto.ts
        │   ├── domain/
        │   │   ├── entities/
        │   │   │   ├── programacao.entity.ts
        │   │   │   └── outbox-message.entity.ts
        │   │   ├── events/
        │   │   │   └── programacao-publicada.event.ts
        │   │   └── ports/
        │   │       ├── programacao-write-repository.port.ts
        │   │       └── outbox-repository.port.ts
        │   └── infrastructure/
        │       ├── controllers/
        │       │   └── programacao-command.controller.ts
        │       ├── repositories/
        │       │   └── in-memory-programacao-write.repository.ts
        │       └── outbox/
        │           ├── in-memory-outbox.repository.ts
        │           └── outbox-publisher.service.ts
        ├── calculation/
        │   ├── calculation.module.ts
        │   └── domain/
        │       ├── value-objects/
        │       │   ├── vazao.ts
        │       │   ├── volume.ts
        │       │   ├── nivel-reservatorio.ts
        │       │   └── index.ts
        │       └── services/
        │           ├── calculo-hidraulico.service.ts
        │           └── index.ts
        ├── query/
        │   ├── query.module.ts
        │   ├── application/
        │   │   ├── queries/
        │   │   │   ├── listar-programacoes.query.ts
        │   │   │   └── buscar-programacao-dados.query.ts
        │   │   └── dtos/
        │   │       ├── programacao-resumo.dto.ts
        │   │       └── programacao-dados.dto.ts
        │   ├── domain/
        │   │   └── read-models/
        │   │       └── programacao-read.model.ts
        │   └── infrastructure/
        │       ├── controllers/
        │       │   └── programacao-query.controller.ts
        │       └── repositories/
        │           └── in-memory-programacao-read.repository.ts
        └── usina/
            ├── usina.module.ts
            ├── application/
            │   ├── queries/
            │   │   └── buscar-usina-historico.query.ts
            │   └── dtos/
            │       └── usina-resumo.dto.ts
            ├── domain/
            │   └── read-models/
            │       ├── usina-read.model.ts
            │       └── usina-read-repository.port.ts
            └── infrastructure/
                ├── controllers/
                │   └── usina-query.controller.ts
                └── repositories/
                    └── in-memory-usina-read.repository.ts

proger-database/                # DDL/DML Oracle — cópia isolada do repo original (v2 PoC)
├── README.md                   # Aviso: cópia isolada, não modificar o original
└── database/
    ├── old/PRG-XXX/            # Scripts legados v1 (referência)
    ├── tables/                 # DDL base v1
    ├── sequences/              # Sequences v1
    ├── plano-deploy/           # Deploys legados v1
    └── proger-v2/              # Scripts NOVOS do v2 (Fase 0+)
        ├── CREATE_TABLE_PRG_OUTBOX.sql
        └── executa-proger-v2-fase0.sql
```

---

## Decisões Tomadas

1. **Modular Monolith** — Todos os módulos (Query, Command, Calculation, Restriction, Usina, Programação) em um único projeto NestJS, comunicando via ports (interfaces)
2. **Oracle 19.9** — Banco transacional mantido; sem PostgreSQL; read model via materialized views no Oracle + cache Redis
3. **Cloud-agnostic** — Arquitetura pronta para AWS (EKS, RDS, ElastiCache, S3) sem mudança de código
4. **Stack** — NestJS 10 / Node 20 LTS / TypeORM / BullMQ / Redis 7 / Oracle 19.9
5. **TDD** — Testes escritos antes da implementação (Value Objects e Domain Services)
6. **Store in-memory compartilhado** — `InMemoryProgramacaoStore` em `shared/infrastructure/persistence` para garantir consistência entre QueryModule e CommandModule no PoC. Será removido quando o Oracle for integrado.

---

## Como Retomar

### Em uma nova sessão, diga

```
Leia o arquivo PROGRESS.md em /home/danilo/Projetos/Engie/PROGER SMARTCODE/
e continue a implementação da Fase 0 a partir da task 5 (Integração Oracle 19.9).
O schema já está mapeado em docs/database/ORACLE-SCHEMA-MAPPING.md.
```

### MCP Oracle disponível automaticamente

Na próxima sessão, o MCP `oracle-proger-dev` estará conectado automaticamente. Para usar:

```
mcp({ connect: "oracle-proger-dev" })
```

Isso permite executar queries SQL diretamente no banco de dev via ferramentas MCP (`read-query`, `table`, etc.).

### Ou, se preferir buscar na memória persistente

```
Use memory_search com query "proger fase 0" para recuperar o contexto.
```

---

## Fase 1 — Detalhamento (Desacoplamento MVP)

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 1.1 | Remover fallback in-memory (`USE_IN_MEMORY`) | ✅ Pronto | 5 arquivos in-memory deletados. Provider switch removido de CommandModule, QueryModule, UsinaModule. `USE_IN_MEMORY` removido de `.env.example`. Testes: 42/42 passando. |
| 1.2 | Criar entidade TypeORM `PrgProdutibilidadeEntity` | ✅ Pronto | Entidade, port `IProdutibilidadeRepository`, `TypeOrmProdutibilidadeRepository` criados. Registrados em `AppModule` e `CalculationModule`. Testes: 42/42 passando. |
| 1.3 | Atualizar `CalculoHidraulicoService` para buscar produtibilidade da tabela correta | ✅ Pronto | Criado `CalcularProgramacaoHidraulicoUseCase` (Application layer) que busca produtibilidade via `IProdutibilidadeRepository` → Oracle `PRG_PRODUTIBILIDADE` e orquestra o domain service. Testes: 44/44 passando (13 suites). |
| 1.4 | Implementar Módulo Restriction (Restrição & Alertas) | ✅ Pronto | Entidades `PrgRestricaoUsinaEntity`, `PrgTiposRestricaoEntity` criadas. Domain service `ValidadorRestricoes` com suporte a 12 tipos de restrição (nível, vazão, geração, faixa proibida). Use case `ValidarRestricoesUseCase`. `RestrictionModule` registrado em `AppModule`. Testes: 52/52 passando (15 suites). |
| 1.5 | Criar `proger-worker-importacao` (BullMQ) | ✅ Pronto | **Microserviço separado** do `proger-api`. Scaffold criado em `proger-worker-importacao/`: `OnsProcessor`, `HistoriadorProcessor`, entrypoint `main.ts`, jobs placeholder, `docker-compose.yml` com Redis. ADR-006 registrado justificando a separação. Lógica real pendente — requer acesso à API ONS e PI System. Testes: 62/62 passando (19 suites). |
| 1.6 | Modernizar `proger-auth` (NestJS 8 → 10, Node 14 → 20) | ✅ Pronto | Copiado para monorepo. NestJS 10, TypeORM 0.3, oracledb 6, Node 20. Fluxo completo: fetchProfiles + fetchDomains + getPermissionsByProfiles. Entidade PRG_USUARIO corrigida. 33 testes unitários. Dockerfile Node 20 Alpine. Ver `docs/TASK-1.6-AUTH-MODERNIZATION.md`. |
| 1.7 | Criar `proger-api-gateway` (BFF) | ✅ Pronto | Scaffold criado em `proger-api-gateway/`: proxy reverso para proger-api + proger-auth, endpoint agregado `/dashboard/:cdUsina/:dtProgramacao`, JWT auth, rate limiting config. Build passando (48 decorator warnings do TS5.3). |
| 1.8 | **Gate Fase 1** — Validação integrada com Oracle | ✅ Pronto | API conectada ao Oracle dev, endpoints validados contra dados reais. Bug de timezone corrigido (range queries + buffer). Ver `docs/GATE-FASE1-ORACLE-VALIDATION.md`. Testes: 62/62 passando (incluindo TZ=America/Sao_Paulo). |

---

## Fase 2 — Detalhamento (Integração & Testes E2E)

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 2.1 | `docker-compose.yml` do monorepo | ✅ Pronto | 4 serviços (proger-api:3000, proger-auth:3001, gateway:3010, redis:6379) + rede proger-net. Oracle externo. Health checks. `.env.docker` template. Dockerfiles para api e gateway. |
| 2.2 | Testes E2E — proger-auth | ✅ Pronto | 11 testes E2E (supertest): ping, login, JWT validation, perfil, token structure. TypeORM/LDAP/OSB mocked. |
| 2.3 | Testes E2E — proger-api | ✅ Pronto | 7 testes E2E (supertest): programações (list, filter, pagination), dados programação, usinas, histórico. TypeORM mocked. |
| 2.4 | Testes E2E — proger-api-gateway | ✅ Pronto | 14 testes E2E (supertest): dashboard, proxy endpoints, auth login/token, JWT guard. HttpModule/ProxyService mocked. |
| 2.5 | Gateway polish — resolver decorator warnings | ✅ Pronto | Causa raiz: `tsconfig.build.json` não estendia `tsconfig.json`. Corrigido com `extends`. TypeScript 5.9.3 alinhado com proger-auth. Build com 0 erros/warnings. |
| 2.6 | Swagger no gateway | ✅ Pronto | `@nestjs/swagger@7` adicionado. DocumentBuilder com BearerAuth. Controllers decorados com ApiTags, ApiOperation, ApiParam, ApiBody. Swagger UI em `/docs`. DTOs: UserCredentialsDto, TokenLoginDto. |

---

## Arquivos de Referência

| Arquivo | Descrição |
| --------- | ----------- |
| `ARQUITETURA-PROGER-v2.md` | Documento de arquitetura completo (1288 linhas) |
| `PROGRESS.md` | Este arquivo — status e retomada |
| `proger-api/` | Código-fonte do modular monolith |

---

## Fase 3 — Detalhamento (Frontend & Notificações)

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 3.1 | `proger-web` — Scaffold Next.js 14 + App Router | ✅ Pronto | Next.js 14.2 com App Router. Tailwind 3, shadcn/ui (card, input, label, tabs, badge, separator, skeleton, sheet, dropdown-menu, avatar, dialog, sonner, button). Zustand 4 (auth, tabs, notifications stores). TanStack Query 5. React Hook Form 7 + Zod. AG Grid Enterprise 31. @dnd-kit. Socket.IO Client 4. Axios. date-fns. Lucide icons. |
| 3.2 | Tab Shell — navegação por abas dinâmicas | ✅ Pronto | Componente `<TabShell>` com `useTabStore` Zustand. Máx 8 abas dinâmicas + Dashboard fixo. Drag-and-drop (`@dnd-kit/core` + `@dnd-kit/sortable`). Persistência em localStorage. Fechamento com botão ✕ ou Ctrl+W. `<SortableTab>` para reordenação. |
| 3.3 | ProgerGrid — grid Excel-like com AG Grid Enterprise | ✅ Pronto | Componente `ProgerGrid` com AG Grid Enterprise 31. Colunas: Hora, Vazão Turbinada, Vazão Defluente, Vazão Afluente, Nível, Volume, Geração. Edição inline (agNumberCellEditor). Colunas calculadas (Geração). Exportação CSV/Excel. Undo/Redo. |
| 3.4 | Dashboard UI — página inicial agregada | ✅ Pronto | Página `DashboardPage` com `TanStack Query`. Cards de resumo (total usinas, usinas ativas, programações hoje, restrições ativas). Lista de usinas clicável → abre aba de programação. Componentes `SummaryCard`, `UsinaCard`. |
| 3.5 | Tela de Login — autenticação LDAP/SAU | ✅ Pronto | Página `LoginPage` com React Hook Form + Zod. Tabs LDAP/Token SAU. Fluxo: POST `/api/v2/auth/login` → JWT → `useAuthStore` Zustand + localStorage. Redirecionamento para `/dashboard`. Toast com sonner. |
| 3.6 | WebSocket gateway — notificações real-time | ✅ Pronto | Socket.IO no `proger-api-gateway` (`WsGateway` + `WsModule`). JWT auth via handshake. 3 broadcast methods: `broadcastProgramacaoPublicada`, `broadcastRestricaoViolada`, `broadcastImportacaoConcluida`. Frontend hook `useNotifications` com Socket.IO Client. Toast notifications via sonner. |
| 3.7 | Dockerfile + docker-compose para `proger-web` | ✅ Pronto | Dockerfile multi-stage (Node 20 Alpine → standalone). `next.config.mjs` com `output: 'standalone'`. Serviço `proger-web` no `docker-compose.yml` (porta 3200→3000). Depende de `proger-api-gateway`. Health check. |

### Stack Tecnológica Frontend (ARQUITETURA-PROGER-v2)

| Componente | Tecnologia | Versão | Justificativa |
| ------------ | ----------- | -------- | --------------- |
| Framework | Next.js | 14 (App Router) | SSR, RSC, code-splitting, SEO, performance |
| UI Library | React | 18.x | Concurrent features, Suspense |
| Estilização | Tailwind CSS | 3.x | Utility-first, bundle pequeno |
| Componentes | shadcn/ui | latest | Acessível, customizável, sem lock-in |
| Estado Global | Zustand | 4.x | Leve, TypeScript-friendly |
| Server State | TanStack Query (React Query) | 5.x | Cache inteligente, background refetch |
| Grid | AG Grid Enterprise | 31.x | Edição inline, agrupamento, exportação |
| Gráficos | Recharts / Tremor | 2.x / latest | Dashboard visual |
| Formulários | React Hook Form + Zod | 7.x / 3.x | Performance, validação declarativa |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | 6.x | Reordenação de abas |
| Real-time | Socket.IO Client | 4.x | Notificações WebSocket |

---

## Fase 3.5 — Dashboard Polish & Tela de Programação (SPEC-003 → SPEC-004)

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 3.5.1 | SPEC-003: Correções de UI/UX (paridade legado) | ✅ Completa | Data default D+1, fundo transparente, activeDot removido, nível max/min via restrição, disponibilidade correta, truncamento de nomes. Ver `docs/specs/SPEC-003-dashboard-ui-ux-paridade-legado.md`. |
| 3.5.2 | SPEC-003-v2: Alertas de Restrições no Painel | ✅ Completa | `ValidadorPainelService` no backend (48 períodos, 23 tipos de regra). Ícones vermelhos (Pill/Zap/Droplets) com tooltip instantâneo (`ProgerTooltip`). Commits: `proger-api` 3a9701a, `proger-web` 48c4e05, 0bd8abe, 420c7d3. Ver `docs/specs/SPEC-003-v2-dashboard-alertas-restricoes.md`. |
| 3.5.3 | SPEC-004: Tela de Programação com Dynamic Tabs | ✅ **Completa** | Shell de abas com URL persistence (`?tabs=UHJA,UHCC&active=UHJA`), roteamento nested (`/programacao/[cdUsina]`) + standalone (`/p/[cdUsina]`), grid Excel-like (`ProgerSheet` com seleção, copy/paste, shift+drag, edit-on-type), layout 2-colunas (gráficos 70% + grid 30%), header com 11 métricas (`ProgerResumoHeader`), gráficos de simulação (`ProgerSimulationChart`), action bar (`ProgerActionBar`). Endpoints backend: `GET/PUT /programacoes/:cd/dados`, `POST publicar`, `POST /calculo/hidraulico`. Commits: `proger-api` f3862b8, `proger-web` 3d30a9f. Ver `docs/specs/SPEC-004-tela-programacao-dynamic-tabs.md`. |

### Commits principais desta fase

| Serviço | Commit | Descrição |
| --------- | -------- | ----------- |
| `proger-api` | `98f8ff2` | Fix: vazão defluente usa valores do banco para validação (paridade legado) |
| `proger-api` | `1bc0e82` | ONS alert + `geracao_mw_ons` na query de dados painel |
| `proger-api` | `3a9701a` | Fix: alertas de restrição vazios — corrige `TypeOrmRestricaoRepository` (SQL raw) |
| `proger-web` | `88f9774` | Alertas de restrição no frontend + ONS indicator |
| `proger-web` | `48c4e05` | Tooltip instantâneo (`ProgerTooltip`) nos ícones de alerta |
| `proger-web` | `0bd8abe` | Fix: elimina barra de rolagem dupla no dashboard |
| `proger-api` | `f3862b8` | SPEC-004: Tela de Programação completa + correções críticas (periodo contract, N+1, publicar, disponivel, optimistic locking) |
| `proger-web` | `3d30a9f` | SPEC-004: Tela de Programação completa + correções críticas (route conflict, activeDot TS errors, middleware /p) |

---

## Fase 4 — Detalhamento (Otimização & Produção)

| # | Task | Status | Observações |
| --- | ------ | -------- | ------------- |
| 4.1 | CI/CD Pipeline | ⬜ Pendente | GitHub Actions para os 3 serviços (lint, typecheck, test, build, deploy). |
| 4.2 | Worker real (ONS/PI) | ⬜ Pendente | `proger-worker-importacao` com lógica real de importação. Depende de acesso à API ONS e PI System. |
| 4.3 | Monitoramento & alertas | ⬜ Pendente | Health checks, métricas, logging estruturado. |
| 4.4 | Aprovação stakeholders | ⬜ Pendente | CTO (Romeu) + Head Smart Solutions (José Hélio). |

---

## Contatos / Stakeholders

| Papel | Nome | Aprovação |
|-------|------|-----------|
| CTO | Romeu | ⬜ Pendente |
| Head Smart Solutions | José Hélio | ⬜ Pendente |

> ⚠️ O documento de arquitetura foi validado internamente, mas ainda aguarda aprovação formal dos stakeholders.
