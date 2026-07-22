# SPEC-002: PROGER v2.0 — Fase 1: Desacoplamento MVP

**Status:** Draft
**Owner:** Supero Smart Code / Engie
**Reviewers:** Engie Architecture Board
**Data:** 2026-06-25
**Tickets:** PROGER-v2-FASE1
**Depends on:** SPEC-001 (Fase 0 — PoC Fundação)

---

## 1. Problema

A Fase 0 provou que a stack NestJS 10 + TypeORM + Oracle 19.9 consegue reproduzir os cálculos hidráulicos do legado com precisão aceitável. No entanto, o PoC ainda depende de:
- Store in-memory compartilhado (tech-debt DT-001)
- Cálculos com dados hardcoded (não consultam Oracle em runtime)
- Sem validação de restrições operacionais (limites de nível, vazão, geração)
- Sem worker de importação de dados ONS/Historiador
- Autenticação não integrada (endpoints abertos)

A Fase 1 deve transformar o PoC em um MVP funcional: integrado ao Oracle, com restrições operacionais, importação automática de dados e autenticação reaproveitada do legado.

---

## 2. Objetivos (e Não-Objetivos)

### Objetivos
- **O1.** Remover completamente o fallback in-memory (DT-001): todos os repositories devem usar Oracle via TypeORM
- **O2.** Mapear `PRG_PRODUTIBILIDADE` e integrar como fonte da verdade para cálculos hidráulicos (descoberta do Gate PoC)
- **O3.** Implementar Módulo Restriction com validação de limites operacionais (nível mín/máx, vazão, geração, produtibilidade)
- **O4.** Criar `proger-importacao-worker` (BullMQ worker separado) para jobs de importação ONS/Historiador
- **O5.** Reaproveitar lógica de autenticação do `proger-auth` legado (NestJS 8 → 10, Node 14 → 20)
- **O6.** Integrar o novo `proger-api` v2 com o `proger-auth` modernizado via JWT/LDAP

### Não-Objetivos
- **NÃO** incluir frontend Next.js (será Fase 2)
- **NÃO** incluir grid Excel-like ou dashboards (Fase 2)
- **NÃO** reescrever toda a lógica de importação do monolito Java (extrair apenas o worker)
- **NÃO** implementar notificações por e-mail/SMS (serviço existente `proger-notification-api`)
- **NÃO** migrar dados históricos (dados já estão no Oracle)

---

## 3. Requisitos

### Funcionais
- **RF-01:** O sistema deve consultar `PRG_PRODUTIBILIDADE` em tempo de execução para obter a produtibilidade correta por usina
- **RF-02:** O sistema deve validar restrições operacionais antes de persistir uma programação (nível, vazão, geração fora dos limites → rejeitar)
- **RF-03:** O sistema deve importar dados ONS/Historiador via worker assíncrono (BullMQ)
- **RF-04:** O sistema deve autenticar usuários via LDAP e emitir JWT compatível com o legado
- **RF-05:** O sistema deve autorizar endpoints com base em perfis (PROGER-PROGRAMADOR, PROGER-OPERADOR, etc.)

### Não-Funcionais
- **RNF-01:** Cobertura de testes ≥ 90% em Domain e Application
- **RNF-02:** Latência p95 < 500ms para endpoints de consulta (com Oracle real)
- **RNF-03:** Latência p95 < 2s para cálculos hidráulicos com dados Oracle
- **RNF-04:** Worker de importação deve processar ≥ 1 job/minuto em dev
- **RNF-05:** LGPD — dados pessoais ofuscados em logs (mascaramento de e-mail, CPF, nome de usuário)

---

## 4. Proposta Técnica

### Arquitetura
- **Modular Monolith** mantido: `proger-api` continua com 6 módulos internos
- **Ports & Adapters:** novas ports para `ProdutibilidadeRepository`, `RestricaoRepository`, `AuthService`
- **BullMQ Worker:** `proger-importacao-worker` como processo separado (mesmo repo, entrypoint diferente)
- **Auth:** reaproveitar `proger-auth` existente, migrando para NestJS 10 + Node 20

### Decisões-chave
- **Remover in-memory:** deletar `InMemoryProgramacaoStore`, `InMemoryProgramacaoReadRepository`, `InMemoryProgramacaoWriteRepository`, `InMemoryOutboxRepository`, `InMemoryUsinaReadRepository`
- **Produtibilidade:** nova entidade `PrgProdutibilidadeEntity` + `ProdutibilidadeRepository` (TypeORM) + port `IProdutibilidadeRepository`
- **Restriction:** novo módulo `RestrictionModule` com `ValidarRestricoesUseCase` e `RestricaoRepository` (Oracle)
- **Importação:** worker BullMQ com job `ImportarDadosONSJob` e `ImportarDadosHistoriadorJob`
- **Auth:** JWT + LDAP via `proger-auth` modernizado, integrado como BFF ou middleware

---

## 5. Alternativas Consideradas

### Alternativa A: Microserviços desde o início
- **Descrição:** Criar `proger-query-api`, `proger-command-api`, `proger-calc-engine`, `proger-auth` como serviços independentes
- **Por que descartamos:** Over-engineering para MVP. A separação via ports dentro do modular monolith prova os contratos. Extração para microserviço é trivial trocando o adapter.
- **Quando reconsiderar:** Se um módulo crescer além de 3 engenheiros dedicados ou requisitos de escala independente surgirem.

### Alternativa B: Knex.js em vez de TypeORM
- **Descrição:** Usar Knex.js (query builder) para acesso ao Oracle, evitando complexidade do TypeORM
- **Por que descartamos:** TypeORM já está integrado, entidades mapeadas, e o time tem expertise. Mudar agora aumentaria o risco sem benefício claro.
- **Quando reconsiderar:** Se o TypeORM apresentar problemas de performance com queries complexas ou locking.

### Alternativa C: RabbitMQ em vez de BullMQ
- **Descrição:** Usar RabbitMQ para filas de importação em vez de BullMQ/Redis
- **Por que descartamos:** BullMQ é nativo em Node.js, já usado no ecossistema Supero, e Redis é necessário para cache de qualquer forma. RabbitMQ adicionaria infraestrutura extra.
- **Quando reconsiderar:** Se necessitar de routing complexo, dead-letter exchange avançado, ou integração com sistemas não-Node.

---

## 6. Riscos e Mitigações

| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Performance do TypeORM com Oracle em queries complexas | Alta | Monitorar latência p95; criar índices Oracle adicionais se necessário; fallback para raw queries em casos críticos |
| Divergência de cálculos após remover in-memory | Alta | Manter Gate PoC como teste de regressão; comparar resultados com Oracle legado em staging |
| Worker de importação bloquear fila em caso de erro | Média | Dead-letter queue, retry exponencial, alertas via Sentry/Prometheus |
| Migração `proger-auth` quebrar compatibilidade com frontend legado | Média | Manter endpoint JWT compatível; testar integração com frontend v1 em staging |
| Schema Oracle não reflete produção (dev desatualizado) | Média | Validar schema com DBA antes de deploy; script de verificação de schema no CI |

---

## 7. Plano de Testes

### Unitários
- `CalculoHidraulicoService` com `PrgProdutibilidadeRepository` mockado (validar produtibilidade correta)
- `ValidarRestricoesUseCase` (cenários: dentro limites, fora limites, exatamente no limite)
- `ImportarDadosONSJob` (mock de API ONS, validar parsing e persistência)
- `AuthService` (mock LDAP, validar JWT claims)

### Integração
- Repositories TypeORM contra Oracle dev (testcontainers quando disponível)
- BullMQ worker em Docker Compose (Redis + worker + Oracle)
- `proger-auth` integrado com `proger-api` (end-to-end JWT)

### E2E
- Cenário: usuário autenticado → criar programação → validar restrições → publicar → consultar via GET
- Cenário: worker importa dados ONS → programação atualizada → cálculos recalculados
- **Gate Fase 1:** comparar resultados de cálculo com Oracle legado para 5 usinas diferentes

### Performance
- k6 ou Gatling: 10 usuários concorrentes consultando programação
- Target: p95 < 500ms para consulta, p95 < 2s para cálculo

---

## 8. Plano de Rollout

- **Feature flags:** Não aplicável (MVP sem produção ainda)
- **Migração de dados:** Não aplicável (dados já no Oracle)
- **Rollback:** Reverter commit + restaurar in-memory repositories se necessário (branch de backup)
- **Deploy:** Docker Compose em staging → validar com dados reais → deploy em produção (quando autorizado)

---

## 9. Observabilidade

- Métricas de negócio: `programacao.publicada`, `calculo.executado`, `restricao.violada`, `importacao.job_executado`
- Métricas de performance: latência Oracle p95, latência cálculo p95, fila BullMQ depth
- Logs estruturados: `correlation_id`, `user_id_hash`, `cd_usina`, `cd_programacao`
- Alertas: fila BullMQ > 100 jobs, latência Oracle > 1s, erro de autenticação > 5/min

---

## 10. Estimativa

- **Esforço:** 10–15 dias (2 devs seniors)
- **Infra incremental:** Redis (já planejado), worker de importação (novo)
- **Custo:** 0 (licenças existentes, Oracle mantido)

---

## Histórico de Revisão

| Data | Versão | Autor | Mudança |
|------|--------|-------|---------|
| 2026-06-25 | 1.0 | Supero Smart Code | Criação inicial |
