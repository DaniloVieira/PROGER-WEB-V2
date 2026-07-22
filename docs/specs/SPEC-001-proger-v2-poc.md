# SPEC-001: PROGER v2.0 — PoC de Fundação (Fase 0)

**Status:** Approved
**Owner:** Supero Smart Code / Engie
**Reviewers:** Engie Architecture Board
**Data:** 2026-06-24
**Tickets:** PROGER-v2-FASE0

---

## 1. Problema

O PROGER (Programação de Geração) é a plataforma crítica da ENGIE para simulação e programação operativa de usinas hidroelétricas e termoelétricas. A arquitetura atual, construída entre 2019–2023, apresenta acoplamento excessivo no monolito Java (`proger-api`), duplicação de regras de negócio entre frontend e backend, e ausência de separação de responsabilidades entre serviço de consulta e ingestão de dados.

Esta SPEC cobre a **Fase 0 (PoC de Fundação)**: provar que a nova stack (NestJS 10, Node 20, TypeORM, Oracle 19.9) consegue substituir o backend Java com consistência de dados e cálculos hidráulicos idênticos ao legado.

---

## 2. Objetivos (e Não-Objetivos)

### Objetivos
- Estabelecer scaffold técnico do `proger-api` v2 com NestJS 10 modular
- Migrar os cálculos hidráulicos do frontend (`DadosGraficoUtils.js`) para Domain Services testáveis no backend
- Implementar CQRS básico (Read-Side / Write-Side) com comunicação via ports
- Demonstrar publicação de programação via comando com Outbox Pattern
- Mapear schema Oracle 19.9 para futura integração com TypeORM

### Não-Objetivos
- NÃO incluir frontend Next.js (será Fase 2)
- NÃO incluir ingestão automática de ONS/Historiador (será Fase 1, serviço `proger-importacao-worker`)
- NÃO incluir autenticação/ autorização (será reaproveitado do `proger-auth` existente)
- NÃO incluir notificações por e-mail/SMS (serviço existente `proger-notification-api`)
- NÃO incluir grid Excel-like no frontend (será Fase 2)

---

## 3. Requisitos

### Funcionais
- **RF-01:** O sistema deve calcular vazão afluente, defluente, turbinada, volume total e nível de reservatório com precisão idêntica ao legado
- **RF-02:** O sistema deve expor endpoints REST para listar programações e consultar dados de uma programação específica
- **RF-03:** O sistema deve expor endpoint para consultar histórico de usina por intervalo de datas
- **RF-04:** O sistema deve permitir publicar uma programação via comando REST, alterando sua situação de "Em Edição" para "Publicada"
- **RF-05:** O sistema deve registrar eventos de domínio (`ProgramacaoPublicada`) na mesma unidade de trabalho do comando (Outbox Pattern)

### Não-Funcionais
- **RNF-01:** Cobertura de testes ≥ 90% em Domain e Application
- **RNF-02:** Build em < 30s; startup em < 5s
- **RNF-03:** Compatibilidade com Node.js 20 LTS
- **RNF-04:** Código 100% TypeScript com `strict: true`
- **RNF-05:** LGPD — dados pessoais ofuscados em logs (mascaramento de e-mail, CPF, nome de usuário quando aplicável)

---

## 4. Proposta Técnica

### Arquitetura
Modular Monolith com padrão Ports & Adapters (Hexagonal):
- Módulos NestJS independentes: `CalculationModule`, `QueryModule`, `CommandModule`, `UsinaModule`
- Comunicação exclusiva via interfaces (ports) — nenhum módulo importa implementação de outro
- Shared Kernel em `src/shared/domain/` com `AggregateRoot`, `DomainEvent`, `ValueObject`, `DomainException`

### Fluxo de Dados
```
HTTP Request → Controller (Adapter) → Use Case / Command Handler (Application)
                                           ↓
                                    Domain (Entities, VOs, Services)
                                           ↓
                                    Port (Interface) → Repository (Adapter)
```

### Decisões-chave
- Store in-memory compartilhado (`InMemoryProgramacaoStore`) no PoC para garantir consistência entre QueryModule e CommandModule sem depender de Oracle
- Value Objects imutáveis para Vazao, Volume, NivelReservatorio
- Domain Events publicados via `EventEmitter2` (in-process); futuramente trocado por BullMQ/Redis

---

## 5. Alternativas Consideradas

### Alternativa A: Microserviços completos desde o início
- **Descrição:** Criar `proger-query-api`, `proger-command-api`, `proger-calc-engine` como serviços independentes desde a Fase 0
- **Por que descartamos:** Over-engineering para PoC. A separação via ports dentro de modular monolith prova os contratos sem o custo operacional de deploy múltiplo, networking, observabilidade distribuída. Extração para microserviço é trivial trocando o adapter.
- **Quando reconsiderar:** Se um módulo crescer além de 3 engenheiros dedicados ou requisitos de escala independente surgirem.

### Alternativa B: PostgreSQL em vez de Oracle 19.9
- **Descrição:** Migrar o banco transacional para PostgreSQL 15+ no PoC
- **Por que descartamos:** O schema Oracle tem 33 tabelas com tipos específicos (NUMBER(p,s), VARCHAR2, CLOB, TIMESTAMP(6)) e procedures legadas. A migração de dados seria um projeto de meses. Manter Oracle no backend e usar read model materializado (views) é mais pragmático.
- **Quando reconsiderar:** Se houver projeto explícito de modernização de banco com equipe de DBA dedicada.

### Alternativa C: Prisma em vez de TypeORM
- **Descrição:** Usar Prisma como ORM para Oracle
- **Por que descartamos:** O driver Oracle do Prisma está em preview e não suporta todas as funcionalidades necessárias (especialmente NUMBER com precision/scale dinâmico). TypeORM com `oracledb` é estável e documentado.
- **Quando reconsiderar:** Quando Prisma sair de preview para Oracle com suporte completo a tipos numéricos.

---

## 6. Riscos e Mitigações

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Diferença numérica entre cálculos NestJS e Java legado | Alta | Criar suite de testes comparativos com dados reais; arredondamentos devem ser explicitados nos VOs |
| Performance do driver Oracle `oracledb` em TypeORM | Média | PoC valida conectividade e latência de queries simples antes de migração completa |
| Store in-memory não reflete comportamento transacional do Oracle | Média | Documentar explicitamente como tech-debt; trocar por TypeORM repositories na Fase 1 |
| Node.js 20 incompatível com bibliotecas Oracle legadas | Baixa | Validar no Docker com imagem `ghcr.io/oracle/oraclelinux8-instant-client:21` |

---

## 7. Plano de Testes

### Unitários
- Value Objects: Vazao, Volume, NivelReservatorio (validação de invariantes, aritmética)
- Domain Service: `CalculoHidraulicoService` (cenários conhecidos do legado)
- Command Handler: `PublicarProgramacaoHandler` (estados válidos/inválidos, emissão de evento)

### Integração
- Query handlers contra store in-memory
- Controllers REST via `supertest` (NestJS testing module)
- Verificação de contrato OpenAPI via `@nestjs/swagger`

### E2E (Fase 0 reduzido)
- Cenário: criar programação → publicar → consultar via GET → assert situação = PUBLICADA
- Não inclui frontend real; usa supertest

### Carga / Performance
- Fora do escopo da Fase 0

---

## 8. Plano de Rollout

- **Feature flags:** Não aplicável em PoC (não há produção)
- **Migração de dados:** Não aplicável em PoC (store in-memory)
- **Rollback:** Reset do container Docker ou reinício do processo NestJS

---

## 9. Observabilidade

- Logs estruturados via `nestjs-pino` (JSON stdout)
- `correlation_id` propagado via headers HTTP
- Health checks: `GET /health/live`, `GET /health/ready`
- Métricas de negócio: `programacao.publicada`, `calculo.executado` (expostas via endpoint Prometheus-ready, não ativo no PoC)

---

## 10. Estimativa

- **Esforço:** 5 dias (1 dev senior)
- **Infra incremental:** 0 (tudo local, in-memory)
- **Custo:** 0 (licenças existentes)

---

## Histórico de Revisão

| Data | Versão | Autor | Mudança |
|------|--------|-------|---------|
| 2026-06-24 | 1.0 | Supero Smart Code | Criação inicial (retrospectivo — PoC já executado) |
