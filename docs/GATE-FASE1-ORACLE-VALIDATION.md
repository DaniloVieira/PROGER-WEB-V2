# Gate Fase 1 — Validação Integrada com Oracle Dev

> **Data:** 2026-06-27
> **Ambiente:** Oracle 19.9 (OMDES dev), Node 24, TZ=America/Sao_Paulo

## 1. Conexão Oracle

| Item | Resultado |
|------|-----------|
| TypeORM → Oracle | ✅ Conectado com sucesso |
| Session Timezone | `-03:00` (BRT) |
| DB Timezone | `-03:00` (BRT) |
| Entities mapeadas | 7 (PRG_PROGRAMACAO, PRG_DADOS_PROGRAMACAO, PRG_USINA, PRG_OUTBOX, PRG_PRODUTIBILIDADE, PRG_RESTRICAO_USINA, PRG_TIPOS_RESTRICAO) |
| `synchronize: false` | ✅ Nenhuma tabela criada/alterada |

## 2. Endpoints Validados contra Oracle

### 2.1 `GET /api/v2/programacoes?cdUsina=UHJA&dtProgramacao=2026-06-27`

```json
{
  "items": [
    {
      "cdProgramacao": 129428,
      "cdUsina": "UHJA",
      "dtProgramacao": "2026-06-27",
      "situacao": "PUBLICADA"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 5
}
```

✅ **Data correta** — `dtProgramacao: "2026-06-27"` (não `2026-06-26` nem `2026-06-28`)

### 2.2 `GET /api/v2/programacoes?dtProgramacao=2026-06-27` (sem cdUsina)

```json
{
  "total": 21,
  "items": [
    {"cdProgramacao": 129730, "cdUsina": "UHBG", "dtProgramacao": "2026-06-27", "situacao": "EM_EDICAO"},
    {"cdProgramacao": 129429, "cdUsina": "UHCB", "dtProgramacao": "2026-06-27", "situacao": "PUBLICADA"},
    ...
  ]
}
```

✅ **Retorna todas as 21 usinas programadas para 2026-06-27**

### 2.3 `GET /api/v2/programacoes/129428/dados`

```json
{
  "cdProgramacao": 129428,
  "cdUsina": "UHJA",
  "dtProgramacao": "2026-06-27",
  "situacao": "PUBLICADA",
  "dados": [48 itens com dados de geração, vazão, volume, nível]
}
```

✅ **48 registros de dados** (24h × 2 pontos/hora = 48 half-hour intervals)

### 2.4 `GET /api/v2/usinas/UHJA/historico?dtInicio=2026-06-24&dtFim=2026-06-27`

| Data | Items | Observação |
|------|-------|------------|
| 2026-06-24 | 48 | ✅ Dentro do range |
| 2026-06-25 | 48 | ✅ Dentro do range |
| 2026-06-26 | 48 | ✅ Dentro do range |
| 2026-06-27 | 48 | ✅ Dentro do range |

✅ **Sem datas extras do dia 23** — filtro de timezone funciona corretamente

### 2.5 `GET /api/v2/usinas` (lista)

⚠️ Retorna 404 — endpoint de listagem de usinas não implementado (apenas `/usinas/:cdUsina/historico` existe)

## 3. Timezone — Bug Corrigido

### Problema Original
- Query no Oracle comparava `DT_PROGRAMACAO` com `T12:00:00Z`, mas dados estão com hora `00:00:00`
- Em `TZ=America/Sao_Paulo`, `T00:00:00Z` vira o dia anterior no SQLite

### Solução Implementada
Arquivo: `src/shared/infrastructure/persistence/typeorm/date-utils.ts`

| Função | Propósito | Usa |
|--------|-----------|-----|
| `toDateString(date)` | Extrai `YYYY-MM-DD` via UTC | `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()` |
| `startOfDay(str)` | `T00:00:00Z` — limite inferior para query de 1 dia | Queries de `PRG_PROGRAMACAO` |
| `endOfDay(str)` | `T23:59:59.999Z` — limite superior para query de 1 dia | Queries de `PRG_PROGRAMACAO` |
| `startOfDayWithBuffer(str)` | `T00:00:00Z - 1 dia` — buffer para timezone | Queries de `PRG_DADOS_PROGRAMACAO` |
| `endOfDayWithBuffer(str)` | `T23:59:59.999Z + 1 dia` — buffer para timezone | Queries de `PRG_DADOS_PROGRAMACAO` |
| `safeNoon(str)` | `T12:00:00Z` — gravação timezone-safe | Write repository |

### Estratégia por Tabela

| Tabela | Campo | Hora armazenada | Estratégia de query |
|--------|-------|-----------------|---------------------|
| `PRG_PROGRAMACAO` | `DT_PROGRAMACAO` | `00:00:00` (meia-noite) | `>= startOfDay AND <= endOfDay` |
| `PRG_DADOS_PROGRAMACAO` | `DT_PROGRAMACAO` | `00:00:00` a `23:30:00` (half-hour) | `Between(startOfDayWithBuffer, endOfDayWithBuffer)` + filtro `toDateString()` |

## 4. Testes

| Suite | Resultado | Observação |
|-------|----------|------------|
| Todos (19 suites) | ✅ 62/62 passando | Inclui `TZ=America/Sao_Paulo` |
| programacao-read integration | ✅ 5/5 | SQLite com timezone BRT |
| programacao-write integration | ✅ | SQLite com timezone BRT |
| usina-read integration | ✅ | SQLite com timezone BRT |

## 5. Pendências Conhecidas

1. **`GET /api/v2/usinas`** — Endpoint de listagem não implementado (existe apenas `/usinas/:cdUsina/historico`)
2. **Dados com zeros** — Os dados de `2026-06-24` a `2026-06-27` para UHJA estão com `geracaoMW=0` (dados de programação futura ainda não preenchidos). Dados históricos com valores reais existem (ex: `2026-06-17`)
3. **`safeNoon` vs Oracle** — Writes com `safeNoon` armazenam `12:00:00` (ou `09:00:00` BRT), enquanto dados existentes usam `00:00:00`. O range query garante compatibilidade, mas é inconsistente visualmente no banco.
4. **Endpoint `/usinas`** — Retornou 404; apenas `/usinas/:cdUsina/historico` está implementado