# Plano de Resposta a Incidentes — DemoBR

> Este documento define o procedimento da DemoBR LTDA para detectar,
> triar, comunicar, investigar e recuperar de incidentes de segurança
> que envolvam dados pessoais.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**
>
> Referências legais: **LGPD art. 48** (comunicação à ANPD), **art. 49**
> (comunicação aos titulares), **art. 50** (boas práticas), **art. 46**
> (medidas de segurança).

---

## 1. O que é um "incidente"?

Define-se como incidente de segurança qualquer ocorrência que afete
**confidencialidade, integridade, disponibilidade** ou
**autenticidade** de dados pessoais tratados pela DemoBR, incluindo:

| Categoria | Exemplos |
|-----------|----------|
| **Confidencialidade (vazamento)** | PII exposta em log público; bucket R2 deixado público por engano; chave de API vazada em commit |
| **Integridade (alteração indevida)** | RLS bypass que permite que um tenant altere dados de outro; modificação não autorizada de demos |
| **Disponibilidade (indisponibilidade)** | DDoS com duração > 30 min; falha de banco; falha de Hetzner que derruba o serviço |
| **Autenticidade** | Phishing contra creator usando marca DemoBR; conta Clerk comprometida |
| **Privacidade (LGPD)** | Coleta de dado sensível não-autorizada; tratamento sem base legal; DSR não respondida no prazo |

> **Regra prática**: na dúvida, **declare incidente**. Custo de
> declarar é baixo (P3); custo de não declarar pode ser legal e
> reputacional.

---

## 2. Equipe (IR Roster)

| Função | Responsável | Backup | Contato |
|--------|-------------|--------|---------|
| **Incident Commander (IC)** | Tech lead DemoBR | Engenheiro sênior #2 | `ic@demobr.com.br` |
| **Comunicação externa** | CEO | Head of Operations | `comunicacao@demobr.com.br` |
| **DPO** | DPO designado | Advogado externo | `placeholder@demobr.com.br` *(contratação em até 90 dias — ver `DPO-PROCESS.md`; enquanto isso, CTO assume interinamente)* |
| **Engenheiro de plantão (24/7)** | Rodízio semanal | Plantão secundário | `oncall@demobr.com.br` (PagerDuty) |
| **Forensics** | Tech lead + DPO | Advogado externo | `forensics@demobr.com.br` |
| **Apoio jurídico** | Advogado externo | — | (definir por contrato) |
| **Liderança (escalation)** | CEO | COO | `ceo@demobr.com.br` |

> **Esta tabela é exemplo**. Substituir pelos nomes reais da DemoBR
> LTDA antes de publicar.

---

## 3. Detecção

### 3.1 Fontes de detecção

| Fonte | Tipo de alerta |
|-------|----------------|
| **Sentry** | Spike de exceções; novo tipo de erro; erro 5xx inesperado |
| **SigNoz** | Latência p99 acima do baseline; throughput anômalo; erro de métrica |
| **Clerk** | Login suspeito; criação em massa; reset de senha anormal |
| **Asaas** | Falha de webhook repetida; transações negadas |
| **Cloudflare WAF** | Bloqueios anormais; ataques de força bruta |
| **Logs do banco** | Queries lentas; tentativas de bypass de RLS |
| **Reportado por usuário** | E-mail `security@demobr.com.br`; bug bounty |
| **Reportado por terceiro** | ANPD notificando investigação; pesquisador de segurança |

### 3.2 SLAs de detecção

| Severidade | Tempo para detectar (alvo) |
|-----------|----------------------------|
| P0 (crítico) | ≤ 15 min |
| P1 (alto) | ≤ 1h |
| P2 (médio) | ≤ 4h |
| P3 (baixo) | ≤ 24h |

---

## 4. Triagem (severity)

### 4.1 Classificação

| Nível | Definição | SLA de resposta interna | Comunicação externa obrigatória? |
|-------|-----------|--------------------------|---------------------------------|
| **P0** | Data breach confirmado em produção; serviço indisponível por > 1h; incidente reportável à ANPD | ≤ 15 min | ✅ ANPD ≤ 24h + titulares ≤ 72h |
| **P1** | Funcionalidade crítica quebrada; vazamento parcial; suspeita fundada de breach | ≤ 1h | ⚠️ Avalia-se caso a caso |
| **P2** | Bug grave; performance degradada; um tenant afetado | ≤ 4h | ❌ |
| **P3** | Cosmético; melhoria; um usuário afetado isoladamente | próximo sprint útil | ❌ |

### 4.2 Quem classifica?

O **primeiro engenheiro a tomar conhecimento** classifica
inicialmente e escalona à IC em até:
- P0 → **imediato**, via PagerDuty
- P1 → **imediato**, via Slack `#incidentes`
- P2 → **1h útil**, via canal regular
- P3 → **próximo daily**

---

## 5. Comunicação interna

### 5.1 Canal oficial

| Severidade | Canal | Quem precisa estar |
|------------|-------|---------------------|
| P0 | `Slack #p0-fire` (canal dedicado, chamado de bridge) | IC, DPO, CEO, engenheiro plantão |
| P1 | `Slack #incidentes` | IC, engenheiro plantão, DPO (se PII) |
| P2 | `Slack #incidentes` | Engenheiro plantão |

### 5.2 Mensagem de abertura (template)

```
[SEV-{X}] {resumo curto}

O quê: ...
Quando começou: ...
Quem é afetado (escopo estimado): ...
Quem está na chamada (nome + função): ...
Próxima ação: ...
```

### 5.3 Cadência de atualizações

| Severidade | Frequência de status update |
|------------|------------------------------|
| P0 | A cada 30 min na chamada ativa; update final em até 4h |
| P1 | A cada 1h; update final ao fechar |
| P2 | A cada 4h; update final ao fechar |

---

## 6. Forensics e preservação de evidências

### 6.1 Fontes de evidência a preservar

| Fonte | Como preservar | Retenção mínima |
|-------|----------------|------------------|
| **Logs do Postgres** (queries, conexões) | `pg_dump --schema-only` + `pg_stat_statements` snapshot; logs em R2 | 1 ano (compliance) |
| **Logs de aplicação (SigNoz)** | Exportar para R2 bucket `evidence-{incident-id}/` imutável | 1 ano |
| **Audit logs (`app.audit_log`)** | Snapshot imutável via `pg_dump`; chain of custody em planilha | 1 ano |
| **Sentry** | Exportar eventos de uma janela de 7 dias | 1 ano |
| **Cloudflare logs** | Habilitar Logpush para bucket dedicado | 90 dias |
| **Clerk Audit log** | Exportar via API `clerk.auditLogs` | 90 dias |
| **Asaas webhook log** | Exportar via API | 90 dias |
| **R2 snapshots** | Object lock de 90 dias (WORM); política legal hold | ≥ 1 ano (compliance) |
| **Backups R2 (`backup-pg-encrypted`)** | Manter snapshot pré-incidente | ≥ 30 dias (sempre) |
| **Mensagens Slack / E-mails** | Exportar canal + thread do incidente | 1 ano |
| **Memória do engenheiro** | Escrever post-mortem enquanto tudo fresco | antes do fechamento |

### 6.2 Chain of custody

Toda evidência coletada registra:
- Timestamp de coleta (UTC).
- Quem coletou (nome).
- Hash SHA-256 do arquivo no momento da coleta.
- Localização (R2 key com object lock).

Planilha em `evidence-{incident-id}/chain-of-custody.csv` é
imutável (R2 object lock).

### 6.3 Princípio "não destrua"

Em hipótese alguma deletamos logs ou backup para "limpar". Mesmo
que contenham PII do incidente — a necessidade legal de apurar
**prevalece** sobre o direito de apagar do titular (LGPD art. 16).

---

## 7. Notificação à ANPD (LGPD art. 48)

### 7.1 Quando comunicar?

Quando o incidente **causar risco relevante** aos titulares:
- PII confirmada vazada.
- Volume significativo (mesmo que aproximado).
- Titulares podem sofrer dano (fraude, discriminação, etc.).

### 7.2 Prazo

**≤ 24 horas** após a confirmação do incidente.

> A LGPD art. 48 diz "razoável prazo"; ANPD já sinalizou em
> Comunicado que **24h é o piso aceitável** para P0, alinhando
> ao GDPR art. 33º, §1º (72h).

### 7.3 Conteúdo mínimo

```
[Comunicação obrigatória — Incidente {ID}]

1. Descrição do ocorrido
2. Tipos de dados afetados
3. Número (ou estimativa) de titulares afetados
4. Categorias de titulares
5. Medidas técnicas e organizacionais aplicadas
6. Plano de comunicação aos titulares
7. Contato do DPO
```

### 7.4 Canal

- **Preferencial**: Sistema eletrônico da ANPD (quando disponível).
- **Contingência**: e-mail `encarregado@anpd.gov.br` ou ofício
  protocolado na ANPD em Brasília.

O **DPO é o responsável** por esta comunicação.

> **Enquanto a DemoBR não tiver DPO contratado** (até 90 dias da
> publicação — ver [`DPO-PROCESS.md`](./DPO-PROCESS.md)), o **CTO +
> CEO** assumem interinamente a função de reportar à ANPD. O
> conteúdo da comunicação segue o template §7.3 acima, com a
> observação de que a nomeação formal está em curso.

---

## 8. Comunicação aos titulares afetados (LGPD art. 49)

### 8.1 Quando comunicar?

Sempre que o incidente causar **risco relevante** aos titulares, com
a mesma definição do item 7.1.

### 8.2 Prazo

**≤ 72 horas** após a confirmação do incidente.

### 8.3 Formato

- **E-mail** ao e-mail cadastrado (pode estar desatualizado — usar
  canais alternativos como SMS ou correspondência se disponível).
- **Aviso no player/painel**: banner visível ao logar.
- **Página dedicada**: `status.demobr.com.br/incidente-{ID}`.

### 8.4 Conteúdo

```
[Comunicação de incidente — DemoBR]

Caro(a) {nome},

Em {data}, identificamos um incidente de segurança que pode ter
afetado seus dados pessoais. Veja abaixo o que aconteceu e o
que estamos fazendo.

1. O que aconteceu
   {descrição acessível}

2. Que dados podem ter sido afetados
   {lista}

3. O que estamos fazendo
   - {ação 1 — ex.: rotação de chaves}
   - {ação 2 — ex.: revisão de logs}
   - {ação 3 — ex.: notificação à ANPD}

4. O que você pode fazer
   - Trocar sua senha em app.demobr.com.br
   - Ativar MFA se ainda não ativou
   - Ficar atento a phishing nos próximos 90 dias

5. Onde obter mais informações
   - status.demobr.com.br/incidente-{ID}
   - placeholder@demobr.com.br (DPO — placeholder funcional até
     contratação; ver `DPO-PROCESS.md`)
```

### 8.5 Em e-mails transacionais (próximo login)

Após incidente, por **+30 dias** o painel admin mostra banner:
"Foram aplicadas medidas de segurança adicionais em {data}.
Recomendamos trocar sua senha e revisar suas conexões ativas."

---

## 9. Recuperação

### 9.1 Ações típicas

| Cenário | Ação |
|---------|------|
| Credencial vazada | Rotacionar imediatamente; revogar tokens ativos |
| Chave de API exposta | Rotacionar; auditar uso retroativo |
| Vulnerabilidade em código | Patch + hotfix + revisão de git history |
| Tenant com dados vazados | Restaurar para último backup íntegro; notificar cliente |
| RLS bypass | Patch + restaurar +監査 total |
| Bucket R2 público | Reconfigurar ACL; verificar logs de acesso |
| Conta Clerk comprometida | Resetar senha + rotacionar API keys + revisar audit log |

### 9.2 Restore do DB (runbook)

```
1. Identificar snapshot íntegro pré-incidente
2. Provisionar nova instância Postgres em Hetzner
3. Restaurar backup criptografado (pgBackRest restore)
4. Validar integridade via checksum
5. Aplicar migrations pendentes
6. Rodar testes de smoke em sandbox
7. Promover para produção com troca de connection string
8. Manter réplica antiga como read-only por 7 dias (rollback)
```

### 9.3 Rebuild de tenant (caso extremo)

```
1. Snapshot pré-incidente do schema de um tenant
2. Provisionar novo schema no Postgres
3. Restaurar dados do tenant
4. Re-vincular Stripe Customer ID / Asaas Customer ID
5. Re-vincular Custom Domain (CNAME)
6. Notificar cliente do rebuild
```

---

## 10. Post-mortem

### 10.1 Quando?

Dentro de **7 dias** após a resolução do incidente (LGPD art. 50 +
boas práticas internacionais).

### 10.2 Formato

Documento público (P0 e P1) ou interno (P2 e P3), com:

```
# Post-mortem {título}

## TL;DR
{O quê, impacto, duração}

## Linha do tempo (UTC)
- T+00:00 — primeiro sinal
- T+00:15 — triagem
- T+00:30 — escalação para IC
- T+04:00 — mitigação aplicada
- T+12:00 — comunicação aos titulares
- T+24:00 — comunicação à ANPD
- T+72:00 — resolução completa

## Causa raiz
{Técnica + organizacional}

## O que funcionou
{Lista}

## O que falhou
{Lista}

## Action items
| Item | Owner | Prazo |
|------|-------|-------|
| ... | ... | ... |
```

### 10.3 Princípio blameless

Post-mortem **não busca culpados**, busca melhorias no sistema.
Engenheiros que reportam incidentes rapidamente são celebrados,
não punidos.

### 10.4 Publicação

P0/P1: resumo público em `status.demobr.com.br/post-mortem-{date}-{slug}`.
P2/P3: mantido interno.

---

## 11. Templates de comunicados

### 11.1 Template de e-mail interno

```
[SEV-{X}] {título curto} — status T+{tempo}

Resumo: {1 frase}
Impacto: {escopo estimado}
Status: {investigando | mitigando | contido | resolvido}
Ação atual: {1 ação concreta}

Atualizado por: {nome}
```

### 11.2 Template de nota à ANPD

(ver §7.3)

### 11.3 Template de comunicado a titular

(ver §8.4)

### 11.4 Template de status público

```
Incidente {data} — {título}

Status: {investigando | identificado | mitigado | resolvido}

Em {data} às {hora} detectamos {descrição}.

Quem foi afetado: {escopo estimado}
Que dados: {categorias}

Estamos trabalhando em {próximos passos}. Atualizaremos este
status a cada hora.

Para suporte direto: incidente-{id}@demobr.com.br

Última atualização: {timestamp}
```

---

## 12. Treinamento e simulação

| Atividade | Frequência |
|-----------|------------|
| Tabletop (simulação de incidente em sala) | Trimestral |
| Drill (simulação técnica controlada) | Semestral |
| Revisão do IRP | Anual (e após cada P0) |
| Training LGPD/segurança para equipe | Anual |
| Bug bounty (se habilitado) | contínuo |

---

## 13. Métricas de qualidade do IRP

| Métrica | Alvo |
|---------|------|
| Tempo médio de detecção (MTTD) | ≤ 1h P0, ≤ 4h P1 |
| Tempo médio de contenção (MTTC) | ≤ 4h P0, ≤ 24h P1 |
| Tempo médio de resolução (MTTR) | ≤ 24h P0, ≤ 7d P1 |
| Post-mortems no prazo (≤ 7d) | 100 % |
| Comunicados ANPD no prazo (≤ 24h) | 100 % |
| Comunicados a titulares no prazo (≤ 72h) | 100 % |

---

## 14. Bases legais

Este IRP cumpre:

- **LGPD art. 46**: medidas de segurança adequadas.
- **LGPD art. 48**: comunicação à ANPD em prazo razoável.
- **LGPD art. 49**: comunicação aos titulares.
- **LGPD art. 50**: princípios de boa-fé e segurança.
- **LGPD art. 37**: registro de operações (audit logs).
- **GDPR art. 32–34** (paralelo): security of processing, breach notification.

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
