# ADR-004: Store In-Memory Compartilhado para PoC

## Status
Deprecated — Superseded by ADR-005

## Context
Na Fase 0 (PoC), precisávamos validar a arquitetura de CQRS e a separação entre QueryModule e CommandModule sem depender de:
- Configuração de conexão Oracle funcionando em ambiente local
- Migrations TypeORM aplicadas
- Dados de seed no banco

Isso bloquearia o desenvolvimento enquanto aguardávamos acesso completo ao ambiente Oracle de dev.

## Decision
Criar um **store in-memory compartilhado** (`InMemoryProgramacaoStore`) em `src/shared/infrastructure/persistence` que serve como fonte de verdade temporária tanto para QueryModule quanto para CommandModule.

Regras:
- O store é um `Map`/`Array` em memória, sem persistência
- Ambos os módulos acessam via suas respectivas ports (interfaces), implementadas por repositórios in-memory
- O Outbox Pattern também usa in-memory (`InMemoryOutboxRepository`)
- Toda implementação in-memory está marcada com `// TODO(supero): tech-debt — substituir por TypeORM repository`

## Consequences

### Positivas
- Desenvolvimento desbloqueado imediatamente (zero dependência de infraestrutura externa)
- Testes unitários e de integração rodam em <100ms (sem container Oracle)
- A arquitetura Ports & Adapters é validada sem ruído de configuração de banco

### Negativas
- Dados são perdidos no restart do processo
- Não reflete comportamento transacional do Oracle (isolamento, rollback, constraints)
- Risco de a implementação in-memory divergir do comportamento Oracle (ex: geração de IDs, ordenação default, case-sensitivity de VARCHAR2)
- Não testa o driver `oracledb` nem o TypeORM com Oracle

### Neutras
- A substituição por TypeORM repositories é mecânica: implementar as mesmas interfaces (ports) com `Repository<Entity>` do TypeORM
- Os testes existentes devem continuar passando após a troca (testes de comportamento, não de infraestrutura)

## Débito Técnico Registrado
- **Item:** DT-001 — Substituir InMemoryProgramacaoStore por TypeORM + Oracle repositories
- **Prioridade:** Alta (bloqueia Fase 1)
- **Esforço estimado:** 2 dias
- **Critério de aceitação:** Todos os testes existentes passam com TypeORM repositories conectados a Oracle de dev

---
**Supersedes:** N/A
**Superseded by:** ADR-005
