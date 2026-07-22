# ADR-001: Modular Monolith com Ports & Adapters

## Status
Accepted

## Context
O PROGER v1 era um monolito Java (`proger-api`) acumulando responsabilidades de consulta, importação, cálculo e agendamento. A proposta inicial para v2 sugeria microserviços completos desde o início (`proger-query-api`, `proger-command-api`, `proger-calc-engine`, etc.), mas isso imporia complexidade operacional (deploys múltiplos, networking, observabilidade distribuída, eventual consistency) antes de termos validado a nova stack.

Precisávamos de uma estratégia que:
1. Permitisse desenvolvimento rápido na Fase 0 (PoC)
2. Mantivesse os contratos de domínio isolados (para futura extração)
3. Não criasse lock-in arquitetural

## Decision
Adotar **Modular Monolith** como estratégia inicial: todos os bounded contexts coexistem no mesmo processo NestJS, mas cada módulo mantém seu próprio domínio, application e infrastructure, comunicando exclusivamente via **ports (interfaces)**.

A regra de ouro é: **módulos nunca importam implementações de outros módulos diretamente**. Toda dependência passa por interfaces definidas no módulo consumidor.

## Consequences

### Positivas
- Velocidade de desenvolvimento na Fase 0 (um processo, um banco, um deploy)
- Testes de integração entre contextos são trivialmente rápidos (in-process)
- Refatoração entre contextos não exige mudanças de rede ou contratos HTTP
- Extração para microserviço independente é trivial: troca-se o adapter in-process por um adapter REST/gRPC, mantendo as mesmas interfaces de port

### Negativas
- Deploy do monolith exige restart completo (risco maior de indisponibilidade)
- Escalabilidade não pode ser feita por contexto (escala o processo inteiro)
- Stack compartilhada (mesma versão Node, NestJS, TypeORM para todos os contextos)

### Neutras
- O mesmo banco Oracle é compartilhado, com cada módulo acessando apenas suas tabelas (schema separado por bounded context, não fisicamente)
- A complexidade de infraestrutura (Redis, BullMQ, TypeORM) é a mesma; apenas o runtime é unificado

## Quando revisitar
Esta decisão deve ser revisitada quando:
- Um módulo crescer além de 3 engenheiros dedicados
- Requisitos de escala independente surgirem (ex: Calculation precisa de GPU/cluster separado)
- SLA de deploy exigir rollout canário por contexto

---
**Supersedes:** N/A
**Superseded by:** N/A
