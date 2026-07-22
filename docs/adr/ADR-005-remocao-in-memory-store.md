# ADR-005: Remoção do Store In-Memory e Uso de SQLite em Memória para Testes

## Status
Accepted

## Context
A Fase 0 (PoC) utilizou `InMemoryProgramacaoStore` como tech-debt (DT-001) para permitir desenvolvimento local sem dependência do Oracle. O store era compartilhado entre `QueryModule` e `CommandModule` via provider switch `USE_IN_MEMORY`.

Com a Fase 1 (MVP), o Oracle já está validado, o Gate PoC passou, e o fallback in-memory não é mais necessário. A questão levantada foi: manter o store apenas para testes de integração?

## Decision
Remover **completamente** o `InMemoryProgramacaoStore` e todos os repositories in-memory. Para testes de integração, usar **SQLite em memória** (`:memory:`) via TypeORM, que utiliza as mesmas entidades e queries sem depender do Oracle.

## Consequences

### Positivas
- Zero divergência entre código de teste e código de produção
- SQLite em memória captura comportamentos reais do TypeORM (queries, transações, relations)
- Nenhum risco de "verde em memória, vermelho no Oracle"
- Código-fonte reflete 100% a arquitetura de produção

### Negativas
- Setup de testes de integração requer configuração SQLite (adicional, mas trivial)
- Testes de integração ficam marginalmente mais lentos que in-memory puro (ainda <1s por suite)

### Alternativa descartada
Manter in-memory apenas para testes: rejeitada porque não captura comportamentos específicos do Oracle (tipos NUMBER, CLOB, palavras reservadas, locking) e viola o princípio de testcontainers para integração (AGENTS.md §5.3).

## Como implementar
1. Deletar `InMemoryProgramacaoStore` e in-memory repositories
2. Remover provider switch `USE_IN_MEMORY` dos modules
3. Configurar `TypeOrmModule.forRoot({ type: 'sqlite', database: ':memory:' })` em testes de integração
4. Ajustar testes unitários de Application para usar mocks de ports (não in-memory repos)

---
**Supersedes:** ADR-004-in-memory-store-poc.md (status: Deprecated)
