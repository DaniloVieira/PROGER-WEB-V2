# Task 1.6 — Modernizar proger-auth (NestJS 8→10, Node 14→20)

> **Data:** 2026-06-27
> **Status:** ✅ Concluída (build passando, 22 arquivos migrados)

## Resumo das Mudanças

O projeto `proger-auth` foi copiado do repositório original (`PROGER OPSC/Projetos/proger-auth`) para dentro do monorepo PROGER SMARTCODE, ao lado de `proger-api` e `proger-worker-importacao`, e então modernizado.

## Migrações Realizadas

| Componente | Antes | Depois |
|---|---|---|
| NestJS | 8.x | 10.x |
| Node.js target | ES5 (Node 14) | ES2021 (Node 20) |
| TypeORM | 0.2.x | 0.3.x |
| oracledb | 5.x | 6.x |
| rxjs | ^7.2.0 | ^7.8.0 |
| @nestjs/jwt | 8.x | 10.x |
| @nestjs/config | 2.x | 3.x |
| @nestjs/swagger | 5.x | 7.x |
| @nestjs/passport | 8.x | 10.x |
| @nestjs/axios | 0.0.8 | ^3.0.0 |
| class-validator | (não tinha) | ^0.14.0 |
| class-transformer | (não tinha) | ^0.5.1 |
| TypeScript | ^4.3.5 | ^5.3.0 |
| reflect-metadata | ^0.1.13 | ^0.2.2 |

## Arquivos Criados/Reescritos

| Arquivo | Mudança |
|---|---|
| `package.json` | Reescrito — deps NestJS 10, TypeORM 0.3, oracledb 6 |
| `tsconfig.json` | Target ES2021, strictNullChecks, paths aliases |
| `.env` | Alinhado com proger-api (DB_HOST, DB_PORT, etc.) |
| `.env.example` | Criado — template para variáveis de ambiente |
| `.nvmrc` | `20` (era `14`) |
| `nest-cli.json` | Atualizado para NestJS 10 |
| `src/main.ts` | Reescrito — global prefix `/api/v2/auth`, Swagger, ValidationPipe |
| `src/app.module.ts` | Simplificado — ConfigModule.forRoot({ isGlobal: true }) |
| `src/config/config.ts` | Reescrito — registerAs() ao invés de config() síncrono |
| `src/config/database.config.ts` | TypeORM 0.3 — useFactory com ConfigService, sem DataSource manual |
| `src/entities/UsuarioProger.ts` | TypeORM 0.3 — decorators atualizados, schema explícito |
| `src/modules/auth/auth.module.ts` | JwtModule.registerAsync(), ConfigModule.forRoot({ isGlobal: true }) |
| `src/modules/auth/controllers/auth.controller.ts` | Swagger decorators, endpoints simplificados |
| `src/modules/auth/services/auth.service.ts` | Reescrito — fluxo completo: fetchProfiles (OSB), fetchDomains (OSB), getPermissionsByProfiles (JSON), createProgerUser (Oracle). Lodash para filtro de perfis por prefixo |
| `src/modules/auth/services/cryptography.service.ts` | Mantido — CryptoJS |
| `src/modules/auth/strategies/jwt/jwt.strategy.ts` | Simplificado — ConfigService para secret |
| `src/modules/auth/strategies/ldap.strategy.ts` | Modernizado — credentialsLookup, bindDN=cn+DN, login externo via token, CryptographyService |
| `src/modules/auth/guards/` | Corrigido — extends AuthGuard('ldap'/'jwt') + handleRequest (antes: CanActivate manual, não invocava Passport) |
| `src/modules/auth/dto/` | UserInfoDTO com dominios/perfis/permissions, UserToken com access_token+user_token, RequestDataDTO para OSB |
| `src/modules/ping/` | Swagger decorators |
| `src/modules/realtime-session/` | Types atualizados, null safety |

## Arquivos Removidos

| Arquivo | Motivo |
|---|---|
| `src/modules/auth/strategies/jwt/modules/jwt.athorization.module.ts` | Lógica duplicada, typo no nome. JwtModule.registerAsync() no auth.module.ts |
| `src/modules/auth/strategies/jwt/modules/jwt.credentials.module.ts` | Idem — substituído por JwtModule |
| `src/modules/auth/dto/request-data.dto.ts` | Não utilizado |
| `src/app.controller.ts` | Removido — endpoint ping já existe em PingModule |
| `node_modules/`, `dist/`, `.git/` | Limpos na cópia |
| `Dockerfile`, `docker-libs/`, `Kubernetes/` | Removidos — serão recriados quando necessário |

## Build & Testes

```
✅ npx nest build — compila sem erros
✅ npm install — 812 packages, dependências resolvidas
⚠️  npm audit — 47 vulnerabilidades (herdadas de passport-ldapauth, etc.)
❌ Testes — sem testes unitários (eram spec.ts vazio no original)
```

## Estrutura Final

```
proger-auth/
├── package.json              # NestJS 10, TypeORM 0.3, oracledb 6
├── tsconfig.json             # Target ES2021, strictNullChecks
├── nest-cli.json
├── .env                      # Credenciais dev (Oracle, LDAP)
├── .env.example
├── .nvmrc                    # 20
├── config/
│   └── permissoes.json       # Permissões por perfil
└── src/
    ├── main.ts               # Bootstrap NestJS, Swagger, /api/v2/auth
    ├── app.module.ts          # ConfigModule.forRoot({ isGlobal: true })
    ├── config/
    │   ├── config.ts          # registerAs('config', ...) — LDAP, OSB, JWT, DB
    │   └── database.config.ts # TypeORM 0.3 Oracle factory
    ├── entities/
    │   └── UsuarioProger.ts  # TypeORM 0.3 entity, schema PROGER
    └── modules/
        ├── auth/
        │   ├── auth.module.ts
        │   ├── controllers/auth.controller.ts  # POST /login, GET /profile
        │   ├── dto/
        │   │   ├── user-credentials.dto.ts
        │   │   ├── user-info.dto.ts
        │   │   └── user-token.dto.ts
        │   ├── guards/
        │   │   ├── jwt-auth.guard.ts
        │   │   └── ldap-auth.guard.ts
        │   ├── services/
        │   │   ├── auth.service.ts
        │   │   └── cryptography.service.ts
        │   └── strategies/
        │       ├── jwt/jwt.strategy.ts
        │       └── ldap.strategy.ts
        ├── ping/
        │   ├── ping.module.ts
        │   ├── ping.controller.ts
        │   └── ping.service.ts
        └── realtime-session/
            ├── realtime-session.module.ts
            ├── model/user-programador.dto.ts
            └── services/websocket/websocket.service.ts
```

## Pendências

1. **Testes unitários** — Não existem testes significativos. Criar spec.ts para AuthService, CryptographyService, JwtStrategy, LdapStrategy
2. **LDAP credentials** — As credenciais LDAP no `.env` apontam para `D92.tes.local` (dev). Verificar se funciona em produção
3. **OSB endpoints** — `esbdes.ds55.local` é dev. Produção precisa de URLs diferentes
4. **Dockerfile** — Removido; recriar para Node 20 Alpine
5. **WebSocket** — `RealtimeSessionModule` mantido como placeholder; precisa de autenticação JWT no handshake
6. **passport-ldapauth** — Versão 3.0.1 é a última; pacote tem 47 vulnerabilidades herdadas

## Correções Pós-Migração (2026-06-27)

### Bug: Swagger sem campos username/password
- **Causa**: `LdapAuthGuard` implementava `CanActivate` manualmente (nunca invocava Passport)
- **Correção**: `LdapAuthGuard` agora `extends AuthGuard('ldap')` com `handleRequest()`
- **Correção**: Adicionado `@ApiBody({ type: UserCredentialsDTO })` no endpoint `POST /login`

### Bug: LDAP bind error (000004DC)
- **Causa**: `bindDN` não montava o DN completo — faltava `cn=${LDAP_USER},${LDAP_DN}`
- **Causa**: Faltava `credentialsLookup` — função custom que extrai credenciais do `req.body` e suporta login externo via token
- **Correção**: `LdapStrategy` agora monta `bindDN=cn=USER,DN` e tem `credentialsLookup`
- **Correção**: `.env` atualizado com `LDAP_USER`, `LDAP_PASSWORD`, `OSB_AD_USER`, `OSB_AD_PASSWORD`

### Bug: Perfis e permissões vazios
- **Causa**: `AuthService` original fazia 3 chamadas: `fetchProfiles()` (OSB validaUsuarioGrupoAD), `fetchDomains()` (OSB consultaDominiosSAU), `getPermissionsByProfiles()` (JSON file)
- **Causa**: Migração inicial simplificou o service removendo essas chamadas OSB
- **Correção**: `AuthService` reescrito com fluxo completo do original:
  1. `fetchProfiles(groupId)` → OSB `{sistema: 'PROGER', groupID}` → filtra perfis pelo prefixo do ambiente (`PROGER-DES-*`) → remove prefixo do ambiente
  2. `fetchDomains(groupId)` → OSB `{sistema: 'PROGER', groupID}` → retorna usinas/domínios (`UHPF`, `UHJA`, etc.)
  3. `getPermissionsByProfiles(profiles)` → lê `config/permissoes.json` → mapeia permissões por perfil
- **DTOs**: `UserInfoDTO` agora tem `dominios`, `perfis`, `permissions`; `UserToken` tem `access_token` + `user_token` + `user`
- **AuthModule**: Dois providers JWT (`JwtAuthorizationService` para HS512 com secret base64, `JwtCredentialsService` para login externo SAU)
- **Dependência**: Adicionado `lodash` para filtros de perfis (predicate, truncation, etc.)

### Bug: Entidade UsuarioProger com tabela e colunas erradas (ORA-00942)
- **Causa**: Entidade usava `@Entity('USUARIO_PROGER', { schema: 'PROGER' })` com colunas inexistentes (NM_USUARIO_COMPLETO, CD_GRUPO, etc.)
- **Causa**: `database.config.ts` tinha `schema: 'PROGER'` que qualificava queries como `"PROGER"."USUARIO_PROGER"`
- **Correção**: Entidade corrigida para `@Entity('PRG_USUARIO')` com colunas reais (`CD_USUARIO`, `NM_USUARIO`, `PROGER_PERFIS`, `PROGER_DOMINIOS`)
- **Correção**: Removido `schema` do `database.config.ts` — usuário PROGER já conecta ao schema correto
- **Correção**: `saveProgerUser()` atualizado para usar propriedades corretas da entidade (`id`, `nome`, `perfis.join(',')`, `dominios.join(',')`)

### Bug: Permissions vazias (objeto `{}`)
- **Causa**: `.env` tinha `FILE_PERMISSIONS=../../../../config/permissoes.json` que resolvia para `/home/danilo/config/permissoes.json` (inexistente)
- **Correção**: `.env` e `.env.example` atualizados para `FILE_PERMISSIONS=./config/permissoes.json` que resolve para `proger-auth/config/permissoes.json`

### Testes unitários (33 testes, 4 suites)
- `cryptography.service.spec.ts` — encrypt/decrypt com CryptoJS, chave padrão
- `jwt.strategy.spec.ts` — validação de payload (username, displayName, email, perfis)
- `ldap.strategy.spec.ts` — validação de user LDAP, null handling
- `auth.service.spec.ts` — fluxo completo: ldapLogin, fetchProfiles (predicate), fetchDomains, getPermissionsByProfiles, saveProgerUser (create/update), erro 403/504

### Novos arquivos criados nesta sessão
| Arquivo | Descrição |
|---|---|
| `proger-auth/src/modules/auth/services/cryptography.service.spec.ts` | 8 testes para CryptographyService |
| `proger-auth/src/modules/auth/strategies/jwt/jwt.strategy.spec.ts` | 3 testes para JwtStrategy |
| `proger-auth/src/modules/auth/strategies/ldap.strategy.spec.ts` | 3 testes para LdapStrategy |
| `proger-auth/src/modules/auth/services/auth.service.spec.ts` | 19 testes para AuthService |
| `proger-auth/Dockerfile` | Multi-stage Node 20 Alpine + Oracle InstantClient |
| `proger-api/src/modules/usina/application/queries/listar-usinas.query.ts` | Handler para GET /usinas |

### Endpoint GET /api/v2/usinas
- Adicionado `ListarUsinasHandler` (CQRS query handler)
- Adicionado `GET /usinas` no `UsinaQueryController`
- Retorna array de `UsinaResumoDto` (cdUsina, nomeUsina, tipo, situacao)
- Repository `listar()` já existia no `IUsinaReadRepository` e `TypeOrmUsinaReadRepository`
- 62/62 testes proger-api passando