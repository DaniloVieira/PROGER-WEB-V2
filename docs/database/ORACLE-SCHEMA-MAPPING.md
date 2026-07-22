# PROGER Oracle Schema — Mapeamento para TypeORM

> **Gerado em:** 2026-06-25
> **Banco:** Oracle 19.9 (OMDES)
> **Schema:** PROGER
> **Host:** omdes-scan.ds55.local:1521
> **Extraído via:** SQLcl 26.1.2.0

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Tabelas Core (Negócio)](#2-tabelas-core-negócio)
3. [Tabelas de Apoio](#3-tabelas-de-apoio)
4. [Relacionamentos (FKs)](#4-relacionamentos-fks)
5. [Mapeamento de Tipos Oracle → TypeORM](#5-mapeamento-de-tipos-oracle--typeorm)
6. [Configuração MCP Oracle](#6-configuração-mcp-oracle)

---

## 1. Visão Geral

O schema PROGER contém **33 tabelas** organizadas em domínios:

| Domínio | Tabelas |
|---------|---------|
| Programação | PRG_PROGRAMACAO, PRG_DADOS_PROGRAMACAO, PRG_DADOS_PROG_TERM |
| Usinas | PRG_USINA, PRG_CURVA_COTA_VOL, PRG_POTENCIA_QDBRUTA, PRG_PRODUTIBILIDADE, PRG_PARAMETROS, PRG_RELAC_USINAS |
| Restrições | PRG_RESTRICAO_USINA, PRG_RESTRICAO_CONDICIONAL, PRG_TIPOS_RESTRICAO |
| Dados | PRG_DADOS_HISTORIADOR, PRG_DADOS_MANUAIS, PRG_IMPORT_MANUAL |
| Notificações | PRG_DESTINATARIO, PRG_GRUPO_NOTIFICACAO_EMAIL, PRG_G_NOTIF_EMAIL_DEST, PRG_G_NOTIF_EMAIL_USINA |
| Catálogos | PRG_LOOKUP, PRG_ITEM_LOOKUP |
| Suporte | PRG_ARQUIVO, PRG_JOB_SOA, PRG_USUARIO |

---

## 2. Tabelas Core (Negócio)

### PRG_PROGRAMACAO
Programação diária de uma usina.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable | Descrição |
|--------|-------------|--------|-----------|-------|----------|-----------|
| CD_PROGRAMACAO | NUMBER | 22 | 15 | 0 | N | PK — ID da programação |
| CD_USINA | VARCHAR2 | 10 | — | — | N | FK → PRG_USINA |
| DT_PROGRAMACAO | DATE | 7 | — | — | N | Data da programação |
| NM_USUARIO | VARCHAR2 | 400 | — | — | N | Usuário que criou/alterou |
| DT_ALTERACAO | DATE | 7 | — | — | N | Data da última alteração |
| DS_COMENTARIO | VARCHAR2 | 4000 | — | — | Y | Comentário livre |
| DT_ULTIMA_CONCILIACAO | DATE | 7 | — | — | Y | Data da última conciliação |
| DT_PUBLICACAO | DATE | 7 | — | — | Y | Data de publicação |
| NM_USUARIO_PUBLICACAO | VARCHAR2 | 400 | — | — | Y | Usuário que publicou |
| CD_USUARIO_PROGRAMACAO | VARCHAR2 | 400 | — | — | Y | ID do usuário no sistema de programação |
| CD_PERFIL_PROGRAMACAO | VARCHAR2 | 400 | — | — | Y | Perfil do usuário |
| DT_SOBRESCRITA_DADOS_PROGRAMADOR | DATE | 7 | — | — | Y | Data de sobrescrita |
| DT_NOTIFICADO_SOBRESCRITA | DATE | 7 | — | — | Y | Data de notificação de sobrescrita |
| DS_OBSERVACAO | VARCHAR2 | 4000 | — | — | Y | Observações |

**PK:** `PROGRAMACAO_PK` (CD_PROGRAMACAO)
**FK:** `PROGRAMACAO_USINA_FK1` → PRG_USINA(CD_USINA)

---

### PRG_DADOS_PROGRAMACAO
Dados hidráulicos/geração de uma programação.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable | Descrição |
|--------|-------------|--------|-----------|-------|----------|-----------|
| CD_DADOS_PROG | NUMBER | 22 | 15 | 0 | N | PK |
| CD_PROGRAMACAO | NUMBER | 22 | 15 | 0 | N | FK → PRG_PROGRAMACAO |
| CD_USINA | VARCHAR2 | 10 | — | — | N | FK → PRG_USINA (denormalizado) |
| DT_PROGRAMACAO | DATE | 7 | — | — | N | Data |
| NR_GERACAO | NUMBER | 22 | 6 | 0 | N | Geração (MW) |
| NR_VAZAO_INCR | NUMBER | 22 | 6 | 0 | N | Vazão incremental (m³/s) |
| NR_VAZAO_VERTIDA | NUMBER | 22 | 6 | 0 | N | Vazão vertida (m³/s) |
| NR_VAZAO_DEFLUENTE | NUMBER | 22 | 6 | 0 | N | Vazão defluente (m³/s) |
| NR_VAZAO_AFLUENTE | NUMBER | 22 | 6 | 0 | N | Vazão afluente (m³/s) |
| NR_VAZAO_TURB | NUMBER | 22 | 6 | 0 | N | Vazão turbidada (m³/s) |
| VL_VOLUME | NUMBER | 22 | 17 | 7 | N | Volume (m³) |
| VL_NIVEL_RES | NUMBER | 22 | 10 | 2 | N | Nível do reservatório (m) |
| NR_DISPONIVEL | NUMBER | 22 | 6 | 0 | N | Disponível (MW) |
| FL_GER_MANUAL | NUMBER | 22 | 1 | 0 | N | Flag geração manual (0/1) |
| NR_GERACAO_ONS | NUMBER | 22 | 6 | 0 | N | Geração ONS (MW) |
| NR_VAZAO_DEFL_ONS | NUMBER | 22 | 6 | 0 | N | Vazão defluente ONS |
| NR_VAZAO_AFL_ONS | NUMBER | 22 | 6 | 0 | N | Vazão afluente ONS |
| NR_VAZAO_TURB_ONS | NUMBER | 22 | 6 | 0 | N | Vazão turbidada ONS |
| VL_VOLUME_ONS | NUMBER | 22 | 17 | 7 | N | Volume ONS |
| VL_NIVEL_RES_ONS | NUMBER | 22 | 10 | 2 | N | Nível reservatório ONS |
| NR_VAZAO_INCR_PREV | NUMBER | 22 | 6 | 0 | N | Vazão incremental prévia |
| FL_INCR_MANUAL | NUMBER | 22 | 1 | 0 | N | Flag incremental manual |
| NR_VAZAO_VAO_LIVRE | NUMBER | 22 | 6 | 0 | N | Vazão vão livre |
| NR_VAZAO_VAO_LIVRE_CALC | NUMBER | 22 | 6 | 0 | N | Vazão vão livre calculada |
| FL_VAO_LIVRE_MANUAL | NUMBER | 22 | 1 | 0 | N | Flag vão livre manual |

**PK:** `DADOS_PROGRAMACAO_PK` (CD_DADOS_PROG)
**FK:** `DADOS_PROG_PROGRAMACAO_FK1` → PRG_PROGRAMACAO(CD_PROGRAMACAO)
**Unique:** `PRG_DADOS_PROGRAMACAO_UNIQUE` (CD_PROGRAMACAO, CD_USINA, DT_PROGRAMACAO)

---

### PRG_DADOS_PROG_TERM
Dados térmicos da programação.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_DADOS_PROG_TERM | NUMBER | 22 | 15 | 0 | N |
| CD_PROGRAMACAO | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| DT_PROGRAMACAO | DATE | 7 | — | — | N |
| NR_INFLEXIB | NUMBER | 22 | 6 | 0 | N |
| NR_DISPONIVEL | NUMBER | 22 | 6 | 0 | N |
| NR_EXPORTACAO | NUMBER | 22 | 6 | 0 | N |
| FL_GER_MANUAL | NUMBER | 22 | 1 | 0 | N |
| NR_GERACAO | NUMBER | 22 | 6 | 0 | N |
| NR_GERACAO_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_INFLEXIB_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_ORD_MERITO_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_RAZAO_ELETR_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_UNIT_COMIT_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_GAR_ENERG_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_IMPORT_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_EXPORT_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_PCC_ONS | NUMBER | 22 | 6 | 0 | N |
| NR_DISP_ONS | NUMBER | 22 | 6 | 0 | N |
| FL_NR_INFLEXIB_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_ORD_MERITO_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_RAZAO_ELETR_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_UNIT_COMIT_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_GAR_ENERG_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_IMPORT_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_EXPORT_ONS | NUMBER | 22 | 1 | 0 | N |
| FL_NR_PCC_ONS | NUMBER | 22 | 1 | 0 | N |

**PK:** `PRG_DADOS_PROG_TERM_PK` (CD_DADOS_PROG_TERM)
**FK:** `DADOS_PROG_TERM_PROGR_FK1` → PRG_PROGRAMACAO(CD_PROGRAMACAO)

---

### PRG_USINA
Cadastro de usinas (hidráulicas e térmicas).

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable | Descrição |
|--------|-------------|--------|-----------|-------|----------|-----------|
| CD_USINA | VARCHAR2 | 10 | — | — | N | PK — Código da usina (ex: UHE_1234) |
| NM_USINA | VARCHAR2 | 400 | — | — | N | Nome da usina |
| CD_TIPO_USINA | NUMBER | 22 | 1 | 0 | N | 1=Hidráulica, 2=Térmica |
| FL_USINA_ENGIE | NUMBER | 22 | 1 | 0 | N | Flag usina Engie (0/1) |
| CD_SIGLA_USINA | VARCHAR2 | 40 | — | — | N | Sigla (ex: JIRAU) |
| CD_GRP_USINA | VARCHAR2 | 2 | — | — | N | Grupo (ex: G1, G2) |
| NR_ORD_USINA | NUMBER | 22 | 2 | 0 | N | Ordem de exibição |
| FL_USINA_ATV | NUMBER | 22 | 1 | 0 | N | Flag ativa (0/1) |

**PK:** `USINA_PK` (CD_USINA)

---

### PRG_RESTRICAO_USINA
Restrições operacionais por usina.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable | Descrição |
|--------|-------------|--------|-----------|-------|----------|-----------|
| CD_RESTRICAO_USINA | NUMBER | 22 | 15 | 0 | N | PK |
| CD_USINA | VARCHAR2 | 10 | — | — | N | FK → PRG_USINA |
| CD_TP_RESTRICAO | NUMBER | 22 | 15 | 0 | N | FK → PRG_TIPOS_RESTRICAO |
| TP_VIG_RESTRICAO | NUMBER | 22 | 1 | 0 | N | Tipo de vigência |
| FL_STATUS | NUMBER | 22 | 1 | 0 | N | Status (ativo/inativo) |
| NR_PER_RESTRICAO | NUMBER | 22 | 3 | 1 | N | Período da restrição |
| DT_INI_RESTRICAO | DATE | 7 | — | — | Y | Data início |
| DT_FIM_RESTRICAO | DATE | 7 | — | — | Y | Data fim |
| VL_RESTRICAO | NUMBER | 22 | 20 | 7 | Y | Valor da restrição |
| VL_FX_INI_REST | NUMBER | 22 | 6 | 0 | Y | Faixa inicial |
| VL_FX_FIM_REST | NUMBER | 22 | 6 | 0 | Y | Faixa final |
| DT_ALTERACAO | DATE | 7 | — | — | N | Data alteração |
| ARQUIVO | VARCHAR2 | 4000 | — | — | Y | Referência ao arquivo |
| CD_ARQUIVO | NUMBER | 22 | 15 | 0 | Y | FK → PRG_ARQUIVO |
| DS_RESTRICAO | VARCHAR2 | 4000 | — | — | Y | Descrição textual |
| DT_CRIACAO | DATE | 7 | — | — | Y | Data criação |
| CD_USUARIO_PROGRAMACAO | VARCHAR2 | 200 | — | — | Y | Usuário |
| CD_PERFIL_PROGRAMACAO | VARCHAR2 | 400 | — | — | Y | Perfil |

**PK:** `RESTRICAO_USINA_PK` (CD_RESTRICAO_USINA)
**FKs:**
- `RESTRICAO_USINA_USINA_FK1` → PRG_USINA(CD_USINA)
- `RESTR_USINA_TP_RESTR_FK1` → PRG_TIPOS_RESTRICAO(CD_TP_RESTRICAO)
- `FK_PRG_ARQUIVO` → PRG_ARQUIVO(CD_ARQUIVO)

---

### PRG_RESTRICAO_CONDICIONAL
Regras condicionais de restrição (if/then).

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_RESTRICAO_CONDICIONAL | NUMBER | 22 | 15 | 0 | N |
| CD_PONTO_CONTROLE | NUMBER | 22 | — | — | N |
| CD_OPERACAO | NUMBER | 22 | — | — | N |
| CD_RESTRICAO_USINA | NUMBER | 22 | 15 | 0 | N |
| VL_PONTO_CONTROLE | NUMBER | 22 | 6 | 2 | Y |
| VL_PONTO_CONTROLE_INICIAL | NUMBER | 22 | 6 | 2 | Y |
| VL_PONTO_CONTROLE_FINAL | NUMBER | 22 | 6 | 2 | Y |

**PK:** `PRG_RESTRICAO_CONDICIONAL_PK` (CD_RESTRICAO_CONDICIONAL)
**FKs:**
- `PRG_RESTR_COND_ITEM_LOOKUP_FK` → PRG_ITEM_LOOKUP(CD_OPERACAO)
- `PRG_ITEM_LOOKUP_PRG_RESTRIC339` → PRG_ITEM_LOOKUP(CD_PONTO_CONTROLE)

---

### PRG_CURVA_COTA_VOL
Curva cota-volume do reservatório.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_COTA_VOL | NUMBER | 22 | — | — | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| VL_COTA_OPR | NUMBER | 22 | 10 | 2 | N |
| VL_VOLUME | NUMBER | 22 | 17 | 7 | N |
| VL_VOLUME_UTIL | NUMBER | 22 | 17 | 7 | N |
| VL_PERC_VOLUME | NUMBER | 22 | 5 | 2 | N |

**PK:** `CURVA_COTA_VOL_PK` (CD_COTA_VOL)
**FK:** `CURVA_COTA_VOL_USINA_FK1` → PRG_USINA(CD_USINA)

---

### PRG_POTENCIA_QDBRUTA
Relação potência x QD bruta.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_POTENCIA_QDBRUTA | NUMBER | 22 | — | — | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| VL_POTENCIA | NUMBER | 22 | 5 | 0 | N |
| VL_QDBRUTA | NUMBER | 22 | 10 | 2 | N |
| VL_VAZAO_TURB | NUMBER | 22 | 6 | 0 | N |

**PK:** `POTENCIA_QDBRUTA_PK` (CD_POTENCIA_QDBRUTA)
**FK:** `POTENCIA_QDBRUTA_USINA_FK1` → PRG_USINA(CD_USINA)

---

### PRG_PRODUTIBILIDADE
Produtibilidade por usina.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_PRODUTIBILIDADE | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 100 | — | — | N |
| VL_PRODUTIBILIDADE | NUMBER | 22 | 38 | 17 | N |
| VL_PRODUTIBILIDADE_MANUAL | NUMBER | 22 | 38 | 17 | Y |
| DT_CRIACAO | DATE | 7 | — | — | N |
| DT_UPDATE | DATE | 7 | — | — | Y |
| DS_CRITERIO | VARCHAR2 | 100 | — | — | N |
| CD_USUARIO_PROGRAMACAO | VARCHAR2 | 100 | — | — | Y |
| CD_PERFIL_PROGRAMACAO | VARCHAR2 | 100 | — | — | Y |

**PK:** `PRG_PRODUTIBILIDADE_PK` (CD_PRODUTIBILIDADE)

---

### PRG_PARAMETROS
Parâmetros de configuração por usina.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_PARAM | NUMBER | 22 | — | — | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| NM_PARAMETRO | VARCHAR2 | 40 | — | — | N |
| VL_PARAMETRO | VARCHAR2 | 4000 | — | — | N |
| CD_USUARIO_PROGRAMACAO | VARCHAR2 | 200 | — | — | Y |
| TIPO | VARCHAR2 | 20 | — | — | Y |
| CD_PERFIL_PROGRAMACAO | VARCHAR2 | 200 | — | — | Y |

**PK:** `PARAMETROS_PK` (CD_PARAM)
**FK:** `PARAMETROS_USINA_FK1` → PRG_USINA(CD_USINA)

---

### PRG_DADOS_HISTORIADOR
Dados do historiador SCADA.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable | Descrição |
|--------|-------------|--------|-----------|-------|----------|-----------|
| CD_DADOS_HISTORIADOR | NUMBER | 22 | 15 | 0 | N | PK |
| CD_HISTORIADOR | NUMBER | 22 | 15 | 0 | N | FK → PRG_HISTORIADOR |
| CD_USINA | VARCHAR2 | 10 | — | — | N | FK → PRG_USINA |
| DT_PROGRAMACAO | DATE | 7 | — | — | N | Data |
| NR_GERACAO_VER | NUMBER | 22 | 6 | 0 | N | Geração verificada |
| NR_VAZAO_INCR_VER | NUMBER | 22 | 6 | 0 | N | Vazão incremental verificada |
| NR_VAZAO_VERTIDA_VER | NUMBER | 22 | 6 | 0 | N | Vazão vertida verificada |
| NR_VAZAO_DEFL_VER | NUMBER | 22 | 6 | 0 | N | Vazão defluente verificada |
| NR_VAZAO_AFL_VER | NUMBER | 22 | 6 | 0 | N | Vazão afluente verificada |
| NR_VAZAO_TURB_VER | NUMBER | 22 | 6 | 0 | N | Vazão turbidada verificada |
| VL_NIVEL_RESER_VER | NUMBER | 22 | 10 | 2 | N | Nível reservatório verificado |
| VL_DISPONIVEL | NUMBER | 22 | 6 | 0 | N | Disponível |
| DT_ALTERACAO | DATE | 7 | — | — | N | Data alteração |
| NM_USUARIO | VARCHAR2 | 400 | — | — | N | Usuário |
| FL_NR_GERACAO_VER | NUMBER | 22 | 1 | 0 | N | Flag geração verificada |
| FL_NR_VAZAO_AFL_VER | NUMBER | 22 | 1 | 0 | N | Flag afluente verificada |
| FL_NR_VAZAO_DEFL_VER | NUMBER | 22 | 1 | 0 | N | Flag defluente verificada |
| FL_NR_VAZAO_INCR_VER | NUMBER | 22 | 1 | 0 | N | Flag incremental verificada |
| FL_NR_VAZAO_TURB_VER | NUMBER | 22 | 1 | 0 | N | Flag turbidada verificada |
| FL_NR_VAZAO_VERTIDA_VER | NUMBER | 22 | 1 | 0 | N | Flag vertida verificada |
| FL_VL_DISPONIVEL | NUMBER | 22 | 1 | 0 | N | Flag disponível |
| FL_VL_NIVEL_RESER_VER | NUMBER | 22 | 1 | 0 | N | Flag nível verificado |
| NR_VAZAO_VAO_LIVRE_VER | NUMBER | 22 | 6 | 0 | N | Vazão vão livre verificada |
| FL_NR_VAZAO_VAO_LIVRE | NUMBER | 22 | 1 | 0 | N | Flag vão livre |

**PK:** `DADOS_HISTORIADOR_PK` (CD_DADOS_HISTORIADOR)
**FK:** `DADOS_HIST_HISTORIADOR_FK1` → PRG_HISTORIADOR(CD_HISTORIADOR)
**Unique:** `PRG_DADOS_HISTORIADOR_UNIQUE` (CD_HISTORIADOR, CD_USINA, DT_PROGRAMACAO)

---

### PRG_DADOS_MANUAIS
Dados inseridos manualmente.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_DADOS_MANUAIS | NUMBER | 22 | 15 | 0 | N |
| CD_IMPORT_MANUAL | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| DT_PROGRAMACAO | DATE | 7 | — | — | N |
| NR_GERACAO_ONS | NUMBER | 22 | 6 | 0 | N |

**PK:** `DADOS_MANUAIS_PK` (CD_DADOS_MANUAIS)
**FK:** `DADOS_MAN_IMPORT_MAN_FK1` → PRG_IMPORT_MANUAL(CD_IMPORT_MANUAL)

---

## 3. Tabelas de Apoio

### PRG_ARQUIVO

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_ARQUIVO | NUMBER | 22 | 32 | 0 | N |
| NM_ARQUIVO | VARCHAR2 | 100 | — | — | N |
| DS_HASH | VARCHAR2 | 100 | — | — | N |
| DS_EXTENSAO | VARCHAR2 | 100 | — | — | N |
| DS_PATH | VARCHAR2 | 100 | — | — | N |
| TAMANHO | NUMBER | 22 | 30 | 0 | N |
| USER_CREATE | VARCHAR2 | 30 | — | — | N |
| DATE_CREATE | DATE | 7 | — | — | Y |

**PK:** `PRG_ARQUIVO_PK` (CD_ARQUIVO)

---

### PRG_JOB_SOA

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_JOB_SOA | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| DT_INICIO | TIMESTAMP(6) | 11 | — | 6 | N |
| DT_FIM | TIMESTAMP(6) | 11 | — | 6 | Y |
| FL_SUCESSO | VARCHAR2 | 1 | — | — | Y |
| CD_TP_JOB | NUMBER | 22 | 3 | 0 | N |
| DS_JOB | VARCHAR2 | 4000 | — | — | N |

**FK:** `PRG_LOG_JOB_USINA_FK1` → PRG_USINA(CD_USINA)

---

### PRG_USUARIO

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_USUARIO | VARCHAR2 | 10 | — | — | N |
| NM_USUARIO | VARCHAR2 | 250 | — | — | N |
| PROGER_PERFIS | VARCHAR2 | 4000 | — | — | Y |
| PROGER_DOMINIOS | VARCHAR2 | 4000 | — | — | Y |
| DT_CRIACAO | DATE | 7 | — | — | N |
| DT_ULTIMO_ACESSO | DATE | 7 | — | — | N |

**PK:** `PRG_CD_USUARIO` (CD_USUARIO)

---

### PRG_DESTINATARIO

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_DESTINATARIO | NUMBER | 22 | 15 | 0 | N |
| NM_DESTINATARIO | VARCHAR2 | 250 | — | — | N |
| DS_EMAIL | VARCHAR2 | 250 | — | — | N |
| DT_CRIACAO | DATE | 7 | — | — | N |
| DT_ATUALIZACAO | DATE | 7 | — | — | N |

**PK:** `PRG_DESTINATARIO_PK` (CD_DESTINATARIO)
**Unique:** `PRG_DESTINATARIO_UNIQUE_EMAIL` (DS_EMAIL)

---

### PRG_GRUPO_NOTIFICACAO_EMAIL

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_GRUPO_NOTIFICACAO_EMAIL | NUMBER | 22 | 15 | 0 | N |
| NM_GRUPO | VARCHAR2 | 250 | — | — | N |
| DS_TITULO_CONSOLIDADO | VARCHAR2 | 250 | — | — | Y |
| DS_TITULO_PREVIA | VARCHAR2 | 250 | — | — | Y |
| DS_MENSAGEM_CONSOLIDADO | CLOB | 4000 | — | — | Y |
| DS_MENSAGEM_PREVIA | CLOB | 4000 | — | — | Y |
| FL_ENVIO_AUTOMATICO_CONSOLIDACAO | NUMBER | 22 | 1 | 0 | N |
| FL_ENVIO_PROGRAMADO_PREVIA_SEM_CONSOLIDACAO | NUMBER | 22 | 1 | 0 | N |
| FL_RELATORIO_ANALITICO | NUMBER | 22 | 1 | 0 | N |
| FL_RELATORIO_SINTETICO | NUMBER | 22 | 1 | 0 | N |
| DS_HORA_ENVIO | VARCHAR2 | 5 | — | — | Y |
| DT_CRIACAO | TIMESTAMP(6) | 11 | — | 6 | N |
| DT_ATUALIZACAO | TIMESTAMP(6) | 11 | — | 6 | N |
| DT_ULTIMO_ENVIO_MANUAL | TIMESTAMP(6) | 11 | — | 6 | Y |
| DT_ULTIMO_ENVIO_AUTO_CONSOLIDADO | TIMESTAMP(6) | 11 | — | 6 | Y |
| DT_ULTIMO_ENVIO_AUTO_PREVIA | TIMESTAMP(6) | 11 | — | 6 | Y |

**PK:** `PRG_GRUPO_NOTIFICACAO_EMAIL_PK` (CD_GRUPO_NOTIFICACAO_EMAIL)
**Unique:** `PRG_GRUPO_NOTIFICACAO_EMAIL_UNIQUE_NM_GRUPO` (NM_GRUPO), `PRG_GRUPO_NOTIFICACAO_EMAIL_UNIQUE_DS_HORA_ENVIO` (DS_HORA_ENVIO)

---

### PRG_G_NOTIF_EMAIL_DEST (tabela de junção)

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_DESTINATARIO | NUMBER | 22 | 15 | 0 | N |
| CD_GRUPO_NOTIFICACAO_EMAIL | NUMBER | 22 | 15 | 0 | N |

**FKs:**
- `PRG_G_NOTIF_EMAIL_DEST_PRG_GRUPO_NOTIFICACAO_EMAIL_FK` → PRG_GRUPO_NOTIFICACAO_EMAIL
- `PRG_G_NOTIF_EMAIL_DEST_PRG_DESTINATARIO_FK` → PRG_DESTINATARIO
**Unique:** `PRG_G_NOTIF_EMAIL_DEST_UNIQUE` (CD_DESTINATARIO, CD_GRUPO_NOTIFICACAO_EMAIL)

---

### PRG_G_NOTIF_EMAIL_USINA (tabela de junção)

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_GRUPO_NOTIFICACAO_EMAIL | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |

**FKs:**
- `PRG_G_NOTIF_EMAIL_USINA_PRG_GRUPO_NOTIFICACAO_EMAIL_FK` → PRG_GRUPO_NOTIFICACAO_EMAIL
- `PRG_G_NOTIF_EMAIL_USINA_PRG_USINA_FK` → PRG_USINA
**Unique:** `PRG_G_NOTIF_EMAIL_USINA_UNIQUE` (CD_GRUPO_NOTIFICACAO_EMAIL, CD_USINA)

---

### PRG_LOOKUP

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_LOOKUP | NUMBER | 22 | — | — | N |
| ID_LOOKUP | VARCHAR2 | 30 | — | — | N |
| DS_LOOKUP | VARCHAR2 | 100 | — | — | N |
| USER_CREATE | VARCHAR2 | 30 | — | — | N |
| DATE_CREATE | DATE | 7 | — | — | N |
| USER_UPDATE | VARCHAR2 | 30 | — | — | Y |
| DATE_UPDATE | DATE | 7 | — | — | Y |
| VERSION | NUMBER | 22 | — | — | N |

**PK:** `PRG_LOOKUP_PK` (CD_LOOKUP)

---

### PRG_ITEM_LOOKUP

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_ITEM_LOOKUP | NUMBER | 22 | — | — | N |
| CD_LOOKUP | NUMBER | 22 | — | — | N |
| ID_ITEM_LOOKUP | VARCHAR2 | 30 | — | — | N |
| DS_ITEM_LOOKUP | VARCHAR2 | 400 | — | — | N |
| FL_ATIVO | NUMBER | 22 | 1 | 0 | N |
| USER_CREATE | VARCHAR2 | 30 | — | — | N |
| DATE_CREATE | DATE | 7 | — | — | N |
| USER_UPDATE | VARCHAR2 | 30 | — | — | Y |
| DATE_UPDATE | DATE | 7 | — | — | Y |
| VERSION | NUMBER | 22 | — | — | N |

**PK:** `PRG_ITEM_LOOKUP_PK` (CD_ITEM_LOOKUP)
**FK:** `PRG_LOOKUP_PRG_ITEM_LOOKUP_FK` → PRG_LOOKUP(CD_LOOKUP)

---

### PRG_IMPORT_MANUAL

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_IMPORT_MANUAL | NUMBER | 22 | 15 | 0 | N |
| CD_USINA | VARCHAR2 | 10 | — | — | N |
| DT_PROGRAMACAO | DATE | 7 | — | — | N |
| NM_USUARIO | VARCHAR2 | 400 | — | — | N |
| DT_ALTERACAO | DATE | 7 | — | — | N |

**PK:** `IMPORT_MANUAL_PK` (CD_IMPORT_MANUAL)
**FK:** `USINA_IMPORT_MANUAL_FK1` → PRG_USINA(CD_USINA)

---

### PRG_TIPOS_RESTRICAO

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_TP_RESTRICAO | NUMBER | 22 | 15 | 0 | N |
| DS_RESTRICAO | VARCHAR2 | 4000 | — | — | N |
| CD_TP_REGRA | NUMBER | 22 | — | — | N |
| DS_VAR_REF | VARCHAR2 | 50 | — | — | N |
| DS_TP_REGRA | VARCHAR2 | 4000 | — | — | N |
| CD_TIPO_ATRIBUTO | NUMBER | 22 | 1 | 0 | N |

**PK:** `PRG_TIPOS_RESTRICAO_PK` (CD_TP_RESTRICAO)

---

### PRG_RELAC_USINAS
Relacionamento montante→jusante entre usinas.

| Coluna | Tipo Oracle | Length | Precision | Scale | Nullable |
|--------|-------------|--------|-----------|-------|----------|
| CD_RELAC_USINAS | NUMBER | 22 | 5 | 0 | N |
| CD_USINA_MONTANTE | VARCHAR2 | 10 | — | — | N |
| CD_USINA_REFERENCIA | VARCHAR2 | 10 | — | — | N |
| VL_TMP_VIAGEM_INI | NUMBER | 22 | 5 | 2 | N |
| VL_TMP_VIAGEM_FIM | NUMBER | 22 | 5 | 2 | N |

**PK:** `RELAC_USINAS_PK` (CD_RELAC_USINAS)
**FKs:**
- `USINA_RELAC_USINA_FK1` → PRG_USINA(CD_USINA_MONTANTE)
- `USINA_RELAC_USINA_FK2` → PRG_USINA(CD_USINA_REFERENCIA)

---

## 4. Relacionamentos (FKs)

```
PRG_PROGRAMACAO
  └── CD_USINA → PRG_USINA

PRG_DADOS_PROGRAMACAO
  ├── CD_PROGRAMACAO → PRG_PROGRAMACAO
  └── CD_USINA → PRG_USINA (denormalizado)

PRG_DADOS_PROG_TERM
  ├── CD_PROGRAMACAO → PRG_PROGRAMACAO
  └── CD_USINA → PRG_USINA (denormalizado)

PRG_RESTRICAO_USINA
  ├── CD_USINA → PRG_USINA
  ├── CD_TP_RESTRICAO → PRG_TIPOS_RESTRICAO
  └── CD_ARQUIVO → PRG_ARQUIVO (opcional)

PRG_RESTRICAO_CONDICIONAL
  ├── CD_RESTRICAO_USINA → PRG_RESTRICAO_USINA
  ├── CD_PONTO_CONTROLE → PRG_ITEM_LOOKUP
  └── CD_OPERACAO → PRG_ITEM_LOOKUP

PRG_CURVA_COTA_VOL
  └── CD_USINA → PRG_USINA

PRG_POTENCIA_QDBRUTA
  └── CD_USINA → PRG_USINA

PRG_PRODUTIBILIDADE
  └── CD_USINA → PRG_USINA

PRG_PARAMETROS
  └── CD_USINA → PRG_USINA

PRG_DADOS_HISTORIADOR
  ├── CD_HISTORIADOR → PRG_HISTORIADOR
  └── CD_USINA → PRG_USINA

PRG_DADOS_MANUAIS
  └── CD_IMPORT_MANUAL → PRG_IMPORT_MANUAL

PRG_IMPORT_MANUAL
  └── CD_USINA → PRG_USINA

PRG_JOB_SOA
  └── CD_USINA → PRG_USINA

PRG_ITEM_LOOKUP
  └── CD_LOOKUP → PRG_LOOKUP

PRG_RELAC_USINAS
  ├── CD_USINA_MONTANTE → PRG_USINA
  └── CD_USINA_REFERENCIA → PRG_USINA

PRG_G_NOTIF_EMAIL_DEST
  ├── CD_GRUPO_NOTIFICACAO_EMAIL → PRG_GRUPO_NOTIFICACAO_EMAIL
  └── CD_DESTINATARIO → PRG_DESTINATARIO

PRG_G_NOTIF_EMAIL_USINA
  ├── CD_GRUPO_NOTIFICACAO_EMAIL → PRG_GRUPO_NOTIFICACAO_EMAIL
  └── CD_USINA → PRG_USINA
```

---

## 5. Mapeamento de Tipos Oracle → TypeORM

| Oracle | TypeORM | Observação |
|--------|---------|------------|
| NUMBER(p,0) ou NUMBER(p) | `number` / `@Column("int")` | IDs e inteiros |
| NUMBER(p,s) s>0 | `number` / `@Column("decimal", { precision, scale })` | Decimais |
| NUMBER (sem precisão) | `number` / `@Column("numeric")` | Genérico |
| VARCHAR2(n) | `string` / `@Column("varchar", { length })` | Texto curto |
| VARCHAR2(4000) | `string` / `@Column("text")` | Texto longo |
| CLOB | `string` / `@Column("text")` | Texto muito longo |
| DATE | `Date` / `@Column("date")` | Sem hora |
| TIMESTAMP(6) | `Date` / `@Column("timestamp")` | Com hora |

> **Nota:** O TypeORM com driver `oracledb` mapeia `DATE` como timestamp completo no Oracle. Use `@Column({ type: "date" })` para forçar apenas a data.

---

## 6. Configuração MCP Oracle

### 6.1 Script Wrapper
Criado em: `/home/danilo/Projetos/Engie/PROGER SMARTCODE/.pi/mcp-oracle-wrapper.sh`

Este script carrega as credenciais do `.development.local.env` do projeto PROGER OPSC e inicia o SQLcl em modo MCP.

### 6.2 Configuração do Pi MCP
Arquivo: `/home/danilo/.pi/agent/mcp.json`

```json
{
  "mcpServers": {
    "oracle-proger-dev": {
      "type": "stdio",
      "command": "/home/danilo/Projetos/Engie/PROGER SMARTCODE/.pi/mcp-oracle-wrapper.sh",
      "args": [],
      "env": {}
    }
  },
  "imports": [
    "claude-code"
  ]
}
```

### 6.3 Como usar na próxima sessão

1. O Pi carregará automaticamente o MCP `oracle-proger-dev` no startup
2. Use: `mcp({ connect: "oracle-proger-dev" })` para conectar
3. Depois de conectado, ferramentas disponíveis:
   - `read-query` — SELECTs
   - `write-query` — INSERT/UPDATE/DELETE
   - `table` — CRUD de tabelas
   - `transaction` — controle transacional
   - `db-ping` — health check
   - `explain-plan` — planos de execução

### 6.4 Credenciais (env file)
Fonte: `/home/danilo/Projetos/Engie/PROGER OPSC/Projetos/proger-auth/.development.local.env`

| Variável | Valor |
|----------|-------|
| PROGER_USERNAME | PROGER |
| PROGER_PASSWORD | PROGEROMD3S |
| ENDPOINT_DATABASE | omdes-scan.ds55.local |
| DATABASE_PORT | 1521 |
| DATABASE | OMDES |

> ⚠️ **Nunca commitar este arquivo.** O `.development.local.env` está no `.gitignore` do projeto OPSC.

---

## 7. DDL Versionado (v2 PoC)

Os scripts de evolução de schema do PROGER v2.0 são versionados no repositório **local** `proger-database/` (cópia isolada do repositório original de desenvolvimento v1):

```
proger-database/
├── README.md                   # Aviso: cópia isolada para PoC v2
└── database/
    ├── old/PRG-XXX/            # Scripts legados v1 (referência)
    ├── tables/                 # DDL base v1
    ├── sequences/              # Sequences v1
    ├── plano-deploy/           # Deploys legados v1
    └── proger-v2/              # Scripts NOVOS do v2 (Fase 0+)
        ├── CREATE_TABLE_PRG_OUTBOX.sql
        └── executa-proger-v2-fase0.sql
```

**Regras:**
- TypeORM no `proger-api` **nunca** cria ou altera tabelas (`synchronize: false`)
- Toda evolução de schema (DDL/DML) deve passar pelo `proger-database/database/proger-v2/`
- Scripts devem ser idempotentes (`hasTable` check) e reversíveis
- O DBA/Engenheiro de Dados executa manualmente via SQLcl, seguindo o mesmo processo do v1

---

## 8. Próximos Passos para TypeORM

1. Instalar driver Oracle: `npm install oracledb`
2. Configurar `TypeOrmModule` no `app.module.ts` com as credenciais de dev
3. Criar entidades TypeORM baseadas neste mapeamento
4. Criar repositories que implementam as ports definidas nos módulos Query e Command
5. Substituir os in-memory repositories pelos TypeORM repositories
6. Rodar testes para garantir que o comportamento se mantém

---

> **Atualizado em:** 2026-06-25
> **Mantido por:** Supero Smart Code
