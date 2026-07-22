# ADR-006: Separação do Worker de Importação como Microserviço Independente

## Status
Accepted

## Context
Durante a Fase 1 (MVP), o scaffold do worker de importação (ONS/Historiador) foi inicialmente criado dentro do `proger-api` modular monolith (`src/workers/importacao/`). Após revisão arquitetural, identificou-se que esta abordagem viola o princípio de responsabilidade única do monolito.

O `proger-api` deveria conter apenas:
- CQRS (Command e Query modules)
- Cálculos hidráulicos e simulações
- Alertas de restrições operacionais

A importação de dados ONS e do Historiador (PI System) é uma preocupação separada: ingestão de dados externos, processamento em lote, integração com sistemas de terceiros. Não faz parte do domínio core de programação de geração.

## Decision
Extrair o worker de importação do `proger-api` e criar um **microserviço separado**: `proger-worker-importacao`.

### Responsabilidades por serviço

| Serviço | Responsabilidades | Tecnologia |
|---------|-------------------|------------|
| `proger-api` | CQRS, cálculos hidráulicos, simulações, alertas de restrições | NestJS 10, TypeORM, Oracle |
| `proger-worker-importacao` | Ingestão de dados ONS e Historiador, jobs em background | Node.js 20, BullMQ, Redis, TypeORM |
| `proger-auth` | Autenticação e autorização (LDAP/JWT) | NestJS 10 (modernizado) |

### Comunicação entre serviços
- O `proger-api` **não** depende do worker. O worker é acionado por:
  - Scheduler interno (cron)
  - Mensagens em fila (BullMQ/Redis)
  - Eventos do sistema legado
- O worker **persiste** dados diretamente no Oracle (mesmo banco do `proger-api`, mas via TypeORM independente)
- O worker **notifica** conclusão via:
  - Logs estruturados (observabilidade)
  - Eventos de domínio (quando houver event bus)
  - Status em tabela de controle (`PRG_JOB_SOA`)

## Consequences

### Positivas
- Separação clara de responsabilidades (SRP)
- O monolito `proger-api` não carrega dependências de BullMQ e Redis (exceto se necessário para outras filas)
- O worker pode escalar independentemente (mais instâncias de worker, não de API)
- Facilita deploy separado: worker pode ser atualizado sem afetar a API
- Testes de integração mais simples (testar API e worker isoladamente)

### Negativas
- Overhead operacional: mais um serviço para monitorar, logar, deployar
- Risco de divergência de schema Oracle: worker e API usam o mesmo banco; mudanças em DDL afetam ambos
- Comunicação assíncrona adiciona complexidade (eventual consistency)

### Mitigações
- DDL versionado em `proger-database` (single source of truth)
- Ambos os serviços usam as mesmas entidades TypeORM (compartilhadas via pacote ou cópia)
- Observabilidade unificada (mesmo formato de logs, mesmo trace_id)

## Related
- ADR-001 (Modular Monolith): o worker é a primeira extração para microserviço
- ADR-003 (Oracle 19.9): ambos os serviços compartilham o mesmo banco transacional

---
**Atualizado em:** 2026-06-25
