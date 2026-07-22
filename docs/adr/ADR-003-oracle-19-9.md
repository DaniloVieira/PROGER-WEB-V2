# ADR-003: Manutenção do Oracle 19.9 como Banco Transacional

## Status
Accepted

## Context
O PROGER v1 utiliza Oracle 19.9 (OMDES) com schema PROGER contendo 33 tabelas, procedures, triggers e views materializadas. A proposta de modernização incluía a migração para PostgreSQL, mas isso implicaria:
- Migração de tipos Oracle específicos (NUMBER(p,s), VARCHAR2, CLOB, TIMESTAMP(6)) para equivalentes PostgreSQL
- Reescrita de procedures PL/SQL em PL/pgSQL
- Validação de performance de queries complexas com CTEs e window functions
- Projeto de DBA dedicado por 2-3 meses

## Decision
Manter o **Oracle 19.9** como banco transacional no PROGER v2, mapeando as tabelas existentes para entidades TypeORM. O PostgreSQL foi descartado como opção para o banco transacional.

A estratégia de leitura otimizada (read model) será via:
- Materialized views no Oracle para queries frequentes
- Cache Redis para dados de usina e programação
- TypeORM com driver `oracledb` para acesso transacional

### Evolução de Schema (DDL/DML)
O repositório `proger-database` (projeto separado no Git) continua sendo a **fonte única da verdade** para evolução de schema:

- **DDL base:** `database/tables/` — CREATE TABLE, constraints, índices, comments
- **Sequences:** `database/sequences/` — CREATE SEQUENCE
- **Alterações por feature:** `database/old/PRG-XXX/` — ALTER TABLE, UPDATE, INSERT por ticket Jira
- **Script master:** `executa-PRG-XXX.sql` — orquestra execução com logging via SQLcl

**Regras:**
- TypeORM **NUNCA** cria ou altera tabelas (`synchronize: false`, `migrationsRun: false`)
- Tabelas novas do v2 (ex: `PRG_OUTBOX`) têm seu DDL versionado no `proger-database`, não no `proger-api`
- O DBA/Engenheiro de Dados executa scripts SQL manualmente via SQLcl, seguindo o mesmo processo do v1
- O `proger-api` usa TypeORM apenas para mapeamento de entidades e execução de queries DML (SELECT, INSERT, UPDATE, DELETE)
- A tabela `PRG_TYPEORM_MIGRATIONS` existe apenas para controle interno do TypeORM, não para versionamento de schema da aplicação

## Consequences

### Positivas
- Zero migração de dados na Fase 0/Fase 1
- Reaproveitamento de expertise DBA interna (Oracle)
- Procedures e functions PL/SQL legadas continuam operando
- Materialized views no Oracle são maduras e bem suportadas

### Negativas
- Vendor lock-in em Oracle (licenciamento, suporte, custo)
- Driver `oracledb` requer Instant Client instalado no container (aumenta tamanho de imagem)
- TypeORM tem menos adoção com Oracle do que com PostgreSQL/MySQL (menos exemplos na comunidade)
- Ferramentas de observabilidade (Prometheus, OpenTelemetry) têm integração nativa melhor com PostgreSQL

### Neutras
- O schema Oracle já está mapeado em `docs/database/ORACLE-SCHEMA-MAPPING.md`
- A conexão é via pool de conexões TypeORM (mesmo padrão de outras stacks da empresa)

## Quando revisitar
- Se o custo de licenciamento Oracle se tornar insustentável
- Se a ENGIE adotar política de cloud-native databases (ex: Aurora PostgreSQL, AlloyDB)
- Se o driver `oracledb` apresentar problemas de compatibilidade com Node.js 20 LTS

---
**Supersedes:** N/A
**Superseded by:** N/A
