# Glossário PROGER — Linguagem Ubíqua

> **Contexto:** Domínio de Programação de Geração (PROGER) — ENGIE
> **Atualizado em:** 2026-06-24
> **Mantido por:** Supero Smart Code

---

## Termos de Negócio

| Termo | Significado | Contexto |
|-------|-------------|----------|
| **Usina** | Unidade geradora (hidroelétrica ou termoelétrica) | Todos |
| **Programação** | Planejamento horário de geração para uma usina em um dia | Programação |
| **Dados de Programação** | Registros horários (MW, vazão, nível) de uma programação | Programação |
| **Dados Verificados** | Dados do historiador já conciliados e validados | Ingestão |
| **Publicação** | Ato de tornar a programação oficial para o ONS | Programação |
| **Importação Manual** | Carga de dados via planilha CSV/Excel pelo programador | Ingestão |
| **Importação Automática** | Job periódico (5 min / 30 min) consumindo ONS e Historiador | Ingestão |
| **Job SOA** | Tarefa de importação executada com controle de timeout e retry | Ingestão |
| **Restrição** | Limite operacional (máximo, mínimo, condicional) aplicado a uma usina | Restrições |
| **Alerta de Violação** | Notificação gerada quando dados da programação infringem uma restrição | Restrições |

## Termos de Cálculo Hidráulico

| Termo | Significado | Fórmula / Origem |
|-------|-------------|------------------|
| **Vazão Afluente** | Soma da vazão incremental + média das defluentes dos montantes | `vazaoAfluente = vazaoIncremental + avg(vazoesDefluentesMontantes)` |
| **Vazão Defluente** | Vazão turbinada + vazão vertida + vazão de vão livre | `vazaoDefluente = vazaoTurbinada + vazaoVertida + vazaoVaoLivre` |
| **Vazão Turbinada** | Geração (MW) / Produtibilidade | `vazaoTurbinada = geracaoMW / produtibilidade` |
| **Volume Total** | Volume anterior + variação (vazão afluente - defluente) / coef. conv. | `volumeTotal = volumeAnterior + (afluente - defluente) / coefConv` |
| **Nível de Reservatório** | Interpolação linear da curva cota-volume | `nivel = interpolar(volumeTotal, curvaCotaVolume)` |
| **Previsão de Vão Livre** | Estimativa de vazão de vão livre com base no nível anterior | Consulta a tabela de vazão x vão livre |
| **Curva Cota-Volume** | Tabela de correlação entre cota operativa e volume do reservatório | Cadastro por usina |
| **Produtibilidade** | Fator de conversão MW -> vazão (m³/s) por usina | Cadastro por usina |

## Termos Técnicos (Arquitetura)

| Termo | Significado |
|-------|-------------|
| **Bounded Context** | Contexto delimitado no DDD — um domínio com modelo próprio e linguagem ubíqua |
| **Aggregate Root** | Entidade raiz de um aggregate que garante invariantes de negócio |
| **Value Object** | Objeto imutável sem identidade própria (ex: Vazao, Volume) |
| **Domain Event** | Evento representando algo que ocorreu no domínio (ex: ProgramacaoPublicada) |
| **Port** | Interface definida no domínio/application que define um contrato de infraestrutura |
| **Adapter** | Implementação de uma port (ex: repositório TypeORM, controller REST) |
| **Outbox Pattern** | Persistir eventos na mesma transação do estado, depois publicar |
| **CQRS** | Separação de modelos de leitura e escrita |
| **Read Model** | Modelo denormalizado otimizado para consulta |
| **Command** | Intenção de alterar o estado do sistema (não retorna dados) |
| **Query** | Intenção de ler dados do sistema (não altera estado) |

## Abreviações e Siglas

| Sigla | Significado |
|-------|-------------|
| **ONS** | Operador Nacional do Sistema Elétrico |
| **PI System** | Sistema Historiador OSIsoft (SCADA) |
| **MW** | Megawatt |
| **m³/s** | Metros cúbicos por segundo |
| **hm³** | Hectômetros cúbicos |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **SLA/SLO/SLI** | Service Level Agreement / Objective / Indicator |

---

> **Nota:** Este glossário é vivo. Novos termos devem ser propostos via PR e revisados pelo time de arquitetura.
