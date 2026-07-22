# ADR-002: CQRS com Outbox Pattern

## Status
Accepted

## Context
O PROGER v1 misturava operações de leitura e escrita no mesmo serviço Java, com queries complexas (dashboard, histórico, programação) competindo por recursos com jobs de importação e comandos de publicação. Isso gerava:
- Queries lentas afetando a latência de comandos críticos
- Dificuldade em otimizar o modelo de dados separadamente para leitura e escrita
- Acoplamento entre lógica de consulta e regras de negócio

Precisávamos separar as responsabilidades sem introduzir complexidade desnecessária no PoC.

## Decision
Aplicar **CQRS (Command Query Responsibility Segregation)** dentro do modular monolith:
- **Command Side:** comandos de negócio (`PublicarProgramacao`, `EditarDadosProgramacao`) com regras de domínio, validações e emissão de eventos
- **Query Side:** read models denormalizados otimizados para leitura (programação resumo, dados completos, histórico de usina)
- **Outbox Pattern:** eventos de domínio são persistidos na mesma transação do comando (tabela `outbox` in-memory no PoC), garantindo consistência entre estado e eventos

No PoC:
- O mecanismo de publicação de eventos é via `EventEmitter2` (in-process)
- A tabela `outbox` é um array in-memory no `InMemoryOutboxRepository`
- Na Fase 1, o adapter será trocado por TypeORM + BullMQ

## Consequences

### Positivas
- Queries e comandos podem ser otimizados independentemente
- Eventos de domínio (`ProgramacaoPublicada`) são first-class citizens
- Facilita futura extração de microserviços (o evento já é o contrato de integração)

### Negativas
- Consistência eventual entre read model e write model (no PoC, é instantânea por compartilhamento de store)
- Complexidade adicional de manter dois modelos (commands e queries)
- Outbox requer mecanismo de polling/publicação que não é trivial em produção

### Neutras
- No PoC, a separação é puramente estrutural (mesmo store in-memory); o ganho real de CQRS virá com Oracle + materialized views na Fase 1

## Quando revisitar
- Se a latência de leitura não justificar o overhead de manter dois modelos
- Se eventual consistency se tornar problema para requisitos de negócio (ex: o usuário precisa ver a publicação imediatamente sem refresh)

---
**Supersedes:** N/A
**Superseded by:** N/A
