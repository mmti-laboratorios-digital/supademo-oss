# 🔄 Processo de Nomeação e Operação do DPO — DemoBR

> Documento operacional que descreve **o processo de seleção,
> contratação, onboarding e operação contínua** do Encarregado de
> Proteção de Dados (DPO) da DemoBR LTDA.
>
> Este documento complementa [`DPO.md`](./DPO.md) com **fluxos
> detalhados, checklists e SLAs**.
>
> **Status atual:** ⏳ **PENDENTE DE CONTRATAÇÃO** — primeira
> iteração deste processo será disparada quando a DemoBR iniciar o
> go-live público.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Fases do processo de contratação

### Fase 0 — Vagas abertas / orçamento aprovado

| Item | Detalhe |
|------|---------|
| **Duração** | 0–15 dias |
| **Responsáveis** | CEO + CFO + CTO |
| **Entregas** | - Aprovação de orçamento (R$) <br> - Decisão de caminho (interno / PJ retainer / plataforma — ver `DPO.md` §4) <br> - Publicação de vaga (se interno) ou RFP (se plataforma) |
| **Critério de saída** | Orçamento aprovado + caminho decidido |

#### Checklist da Fase 0

```
[ ] Orçamento aprovado pelos sócios (valor mensal máximo)
[ ] Definido caminho (interno / PJ / plataforma)
[ ] Se interno: vaga publicada em LinkedIn + IAPP Brasil
[ ] Se PJ: 3+ profissionais contatados para proposta
[ ] Se plataforma: 2+ plataformas consultadas (Exind, Privacy Tools)
[ ] SLA de resposta a DSR definido (15 dias úteis)
[ ] Backup definido (quem cobre férias/afastamentos do DPO)
```

---

### Fase 1 — Captação de candidatos

| Item | Detalhe |
|------|---------|
| **Duração** | 15–45 dias |
| **Responsáveis** | CTO (filtragem técnica) + CEO (filtragem jurídica) |
| **Entregas** | - Lista curta de 3–5 candidatos finalistas <br> - Currículos e propostas avaliados pelos critérios de `DPO.md` §3 |

#### Checklist da Fase 1

```
[ ] Currículos / propostas coletados
[ ] Pré-filtragem por critérios obrigatórios:
    [ ] Certificação em privacidade (CIPP/E, CIPM, EXIN PDP F)
    [ ] Experiência ≥ 3 anos em LGPD/GDPR
    [ ] Disponibilidade compatível com o caminho escolhido
[ ] Validação de inexistência de conflito de interesse
[ ] Checagem de referências (LinkedIn + 2 ex-clientes)
[ ] Lista curta de 3–5 finalistas consolidada
```

---

### Fase 2 — Entrevistas

| Item | Detalhe |
|------|---------|
| **Duração** | 45–75 dias |
| **Responsáveis** | CEO + CTO + (opcional) advisor jurídico externo |
| **Entregas** | - Ranking final de candidatos <br> - Proposta comercial negociada <br> - Termo de Confidencialidade (NDA) assinado para acesso a informações sensíveis durante a negociação |

#### Checklist da Fase 2

```
[ ] Entrevista técnica (CTO): SQL básico, RLS, criptografia, logs
[ ] Entrevista jurídica (CEO + advisor): LGPD, art. 41, art. 48, DSR
[ ] Entrevista comportamental (CEO): autonomia, conflito de interesse
[ ] Case study prático: "como responderia a este incidente P0?"
[ ] Referências cruzadas (2+ ex-clientes)
[ ] Proposta comercial negociada
[ ] NDA assinado
[ ] Ranking final registrado em ata
```

#### Roteiro de entrevista técnica (sugestão)

1. **LGPD art. 41**: o que diz sobre a função do encarregado?
2. **LGPD art. 48**: qual o prazo para notificar a ANPD em caso de
   vazamento?
3. **LGPD art. 18**: liste os 10 direitos do titular e diga qual o
   SLA usual.
4. **Stack DemoBR**: como você investigaria um acesso suspeito em
   `app.audit_log` no Postgres?
5. **DPO conflito**: se você descobrisse uma falha grave cometida
   pela liderança da DemoBR, qual seria sua postura?

#### Roteiro de case study (incidente)

> Cenário: você recebe um e-mail às 23h de uma sexta-feira
> reportando que um bucket R2 da DemoBR ficou público por 4 horas.
> Dentro do bucket há 200 GB de backups criptografados e um CSV
> com 50 mil e-mails de leads captados em demos.
>
> **Tarefas (em 30 min)**:
> 1. Qual o primeiro passo?
> 2. Quem você comunica e em qual ordem?
> 3. Como você classifica a severidade?
> 4. Qual o conteúdo da notificação à ANPD (≤ 200 palavras)?
> 5. Qual o conteúdo da notificação aos titulares (≤ 200 palavras)?

---

### Fase 3 — Contratação e onboarding

| Item | Detalhe |
|------|---------|
| **Duração** | 75–90 dias |
| **Responsáveis** | CEO + jurídico externo + CTO |
| **Entregas** | - Contrato assinado <br> - Onboarding concluído <br> - Documentação pública atualizada <br> - Nomeação comunicada à ANPD |

#### Checklist da Fase 3 (ver §2 para detalhes de onboarding)

```
[ ] Contrato de prestação de serviço (PJ) ou CLT assinado
[ ] NDA assinado
[ ] Onboarding técnico:
    [ ] Acesso ao GitHub (read-only em prod repos)
    [ ] Acesso ao PagerDuty (somente para P0/P1)
    [ ] Acesso ao Slack #privacidade
    [ ] Acesso ao Sentry (leitura)
    [ ] Acesso ao painel admin (perfil app_dpo)
    [ ] Acesso ao banco (role app_dpo — somente leitura)
[ ] Onboarding documental:
    [ ] Leitura completa de `legal/` (12 arquivos, ~3.600 linhas)
    [ ] Leitura de `docs/SECURITY-MODEL.md`
    [ ] Leitura de `incident-response-plan.md`
[ ] Nomeação comunicada à ANPD
[ ] Atualização da página `https://www.easydemo.io/dpo`
[ ] Atualização de `legal/privacy-policy.md` §11
[ ] Atualização de `legal/CHANGELOG-DPO.md` §4
[ ] Substituição de `placeholder@easydemo.io` em todos os docs
[ ] Primeiro reporte mensal programado
```

---

### Fase 4 — Operação contínua

Após a contratação, o DPO opera conforme os SLAs e fluxos
definidos em §5 e §6 abaixo.

---

## 2. Checklist detalhado de onboarding do DPO

### 2.1 Dia 1 — Apresentações e acessos

```
[ ] Boas-vindas do CEO
[ ] Apresentação do time (CTO, tech lead, suporte, billing)
[ ] Visita guiada ao produto (player, painel, admin)
[ ] Tour pelo `docs/` (SECURITY-MODEL, ARCHITECTURE)
[ ] Recebimento de notebook / conta Google Workspace
[ ] Configuração de 1Password (vault "DemoBR — Privacy")
[ ] Acesso ao GitHub (repo privado, role Read)
[ ] Acesso ao Linear (projetos "Privacy" e "Legal")
[ ] Acesso ao Slack #privacidade, #incidentes
[ ] Acesso ao PagerDuty (somente para P0/P1)
```

### 2.2 Semana 1 — Leitura técnica

```
[ ] Leitura completa de `legal/` (todos os 13 arquivos)
[ ] Leitura de `docs/SECURITY-MODEL.md`
[ ] Leitura de `incident-response-plan.md`
[ ] Leitura de `dpa-data-processing-agreement.md`
[ ] Sessão de Q&A com CTO (1h)
[ ] Sessão de Q&A com tech lead sobre arquitetura (1h)
[ ] Sessão de Q&A com líder de suporte (1h, sobre fluxo de tickets)
```

### 2.3 Semana 2 — Operação assistida

```
[ ] Shadow de 2+ DSR em andamento (acompanhar sem responder)
[ ] Shadow de 1+ incidente P2 (somente observação)
[ ] Reunião com advogado externo de apoio (se contratado)
[ ] Reunião com cada subprocessador crítico (Clerk, Asaas, Hetzner)
[ ] Configuração de dashboards de monitoramento pessoal
[ ] Definição de template de reporte mensal
```

### 2.4 Semana 3–4 — Operação autônoma

```
[ ] DPO assume a fila de DSR
[ ] DPO assume a comunicação em incidentes (com backup do CTO)
[ ] Primeiro reporte mensal enviado
[ ] Plano de treinamento anual da equipe rascunhado
[ ] DPIA do ano corrente iniciada
```

### 2.5 Mês 2 — Aterrissagem

```
[ ] Primeira revisão documental concluída
[ ] DPIA anual finalizada
[ ] Treinamento inicial da equipe agendado
[ ] Feedback loop com CTO sobre processos internos
[ ] Avaliação de 60 dias do fit cultural e operacional
```

---

## 3. Workflow de comunicação interna com o DPO

### 3.1 Quem fala com o DPO?

| Origem | Canal | SLA de resposta do DPO |
|--------|-------|-------------------------|
| **Titular (DSR)** | `dpo@easydemo.io` | ≤ 15 dias úteis |
| **Engenheiro (incidente P0/P1)** | Slack `#incidentes` + PagerDuty | Imediato (P0) / 1h (P1) |
| **Suporte (dúvidas de privacidade)** | Slack `#privacidade` | 1 dia útil |
| **CEO/sócios (questões estratégicas)** | Reunião 1:1 semanal | Próxima reunião |
| **Advogado externo (parecer)** | E-mail + call | Conforme combinado |

### 3.2 Cadência de reuniões

| Reunião | Frequência | Quem participa | Pauta |
|---------|------------|----------------|-------|
| **Daily standup de privacidade** | Diária, 15 min | DPO + CTO | Status de DSR/incidentes ativos |
| **Weekly privacy review** | Semanal, 30 min | DPO + CTO + tech lead | Tickets da semana, blockers |
| **Monthly report** | Mensal, 1h | DPO + CEO + CFO | KPIs de privacidade, orçamento |
| **Quarterly board report** | Trimestral, 1h | DPO + sócios + advisor | Estado de conformidade, riscos |
| **Annual audit** | Anual, 4h | DPO + auditoria externa + advogado | DPIA, revisão docs |

### 3.3 Ferramentas de comunicação

- **DSR / titulares**: e-mail `dpo@easydemo.io` → fila em
  `app.dsr_log` → Linear (projeto "Privacy").
- **Incidentes**: Slack `#p0-fire` (P0) ou `#incidentes` (P1+),
  com DPO em canal.
- **Interno**: Slack `#privacidade` (time de produto + DPO).
- **Documentação**: Linear (projetos) + `legal/` (git).

---

## 4. Política de reporte

### 4.1 Reporte mensal (CEO/CFO)

Enviado pelo DPO até o **5º dia útil** de cada mês, contendo:

```
Relatório Mensal de Privacidade — DemoBR
Referente a: {mês}/{ano}

1. RESUMO EXECUTIVO
   - Status geral de conformidade: 🟢 / 🟡 / 🔴
   - Principais riscos identificados
   - Decisões pendentes da liderança

2. DSR (Direitos do Titular)
   - Total de solicitações recebidas
   - Tempo médio de resposta
   - Solicitações não respondidas no prazo
   - Taxa de aprovação/recusa

3. INCIDENTES
   - Total por severidade (P0/P1/P2/P3)
   - Tempo médio de detecção × resposta
   - Notificações à ANPD realizadas
   - Notificações a titulares realizadas

4. SUBPROCESSADORES
   - Novos subprocessadores avaliados
   - DPAs assinados / pendentes
   - Mudanças nos termos dos subprocessadores existentes

5. TREINAMENTO
   - % da equipe treinada em LGPD
   - Data do próximo treinamento

6. DOCUMENTAÇÃO
   - Docs revisados
   - Mudanças publicadas
   - Mudanças pendentes de revisão por advogado

7. ORÇAMENTO
   - Custos do DPO e fornecedores
   - Despesas extraordinárias
```

### 4.2 Reporte trimestral (sócios/board)

Enviado pelo DPO até o **15º dia útil** do fim do trimestre,
contendo:

```
Relatório Trimestral de Privacidade — DemoBR
Referente a: Q{1-4}/{ano}

1. SUMÁRIO EXECUTIVO PARA O BOARD
2. KPIs (3 meses vs. trimestre anterior)
3. ANÁLISE DE TENDÊNCIAS (aumento/redução de DSR/incidentes)
4. MUDANÇAS REGULATÓRIAS RELEVANTES
5. AUDITORIAS E CERTIFICAÇÕES
6. PLANO PARA O PRÓXIMO TRIMESTRE
7. RISCOS E RECOMENDAÇÕES
```

### 4.3 Reporte anual (auditoria)

Enviado pelo DPO até o **último dia útil de abril** (coincidindo
com o ciclo de auditoria definido em
[`CHANGELOG-DPO.md`](./CHANGELOG-DPO.md) §10), contendo:

```
Relatório Anual de Privacidade — DemoBR
Referente a: {ano}

1. RESUMO EXECUTIVO ANUAL
2. DPIA ANUAL CONCLUÍDA (anexo)
3. AUDITORIA INTERNA DE CONFORMIDADE
4. TREINAMENTO ANUAL (% da equipe, conteúdo, datas)
5. ANÁLISE DE RISCOS E INCIDENTES
6. REVISÃO DE TODOS OS DOCUMENTOS EM `legal/`
7. PLANO PARA O PRÓXIMO ANO
8. CERTIFICAÇÕES OBTIDAS / EM PROGRESSO
```

### 4.4 Canal de reporte extraordinário

Em caso de **incidente P0** ou **risco relevante identificado** pelo
DPO, o reporte à liderança ocorre **imediatamente**, fora do ciclo
regular, via:

- Slack `#p0-fire` (incidente).
- E-mail direto ao CEO (risco identificado, com cópia ao CTO).
- Call emergencial (a critério do CEO).

---

## 5. SLA de respostas do DPO

### 5.1 SLA para titulares (LGPD art. 18)

| Etapa | SLA |
|-------|-----|
| Confirmação de recebimento | ≤ 2 dias úteis |
| Verificação de identidade | ≤ 3 dias úteis |
| Resposta substantiva | **≤ 15 dias úteis** (LGPD art. 18, §5º) |
| Prorrogação justificável | **+15 dias úteis** (com aviso ao titular) |
| Total máximo | **30 dias úteis** |

### 5.2 SLA para comunicação interna

| Origem | SLA |
|--------|-----|
| DSR via formulário público | ≤ 2 dias úteis para triagem |
| DSR via e-mail | ≤ 2 dias úteis para triagem |
| Incidente P0 (DPO em canal) | Resposta em ≤ 15 min |
| Incidente P1 (DPO em canal) | Resposta em ≤ 1h |
| Suporte (dúvidas de privacidade) | ≤ 1 dia útil |
| CEO/sócios (reunião 1:1) | Próxima reunião |

### 5.3 SLA para ANPD

| Tipo de comunicação | SLA |
|---------------------|-----|
| Notificação de incidente (LGPD art. 48) | ≤ 24h após confirmação |
| Resposta a ofício ANPD | ≤ 10 dias úteis (salvo prazo diverso no ofício) |
| Atualização de nomeação (LGPD art. 41, §1º) | Imediata na contratação / desligamento |

### 5.4 SLA para treinamento

| Evento | SLA |
|--------|-----|
| Onboarding de novo funcionário | ≤ 30 dias |
| Treinamento anual da equipe | Q1 de cada ano |
| Microlearning trimestral | Trimestral |
| Treinamento de incidente pós-mortem | ≤ 7 dias após P0 |

### 5.5 SLA para revisão documental

| Tipo de revisão | SLA |
|-----------------|-----|
| Mudança não-substancial | Imediata (DPO aprova) |
| Mudança substancial | ≤ 5 dias úteis (DPO + advogado) |
| Revisão anual completa | Concluída até abril |

---

## 6. Substituição e continuidade

### 6.1 Backup do DPO (temporário)

- DPO interno: sempre há 1 pessoa do time de produto designada
  como backup (ex.: tech lead).
- DPO externo PJ: o contrato de retainer inclui cláusula de
  cobertura por **substituto qualificado** em férias/afastamentos.
- Plataforma: a própria plataforma garante cobertura.

### 6.2 Substituição definitiva

Se o DPO for desligado (PJ) ou pedir demissão (CLT):

```
[ ] DPO comunica com 60 dias de antecedência (PJ)
[ ] Líderança inicia busca por substituto (Fase 1)
[ ] Substituto shadowa o DPO atual por 30 dias
[ ] DPO atual repassa conhecimento (1 semana imersiva)
[ ] Documentação de processos é atualizada
[ ] ANPD é notificada da substituição (LGPD art. 41, §1º)
[ ] `legal/privacy-policy.md` §11 é atualizado
[ ] `legal/CHANGELOG-DPO.md` §4 é atualizado
[ ] `https://www.easydemo.io/dpo` é atualizado
```

### 6.3 Indicadores de qualidade

A cada 6 meses, a DemoBR avalia o DPO por:

- SLA de DSR (≥ 95% no prazo).
- Reportes mensais entregues no prazo.
- Auditoria documental anual concluída.
- Treinamentos realizados conforme cronograma.
- Resposta a incidentes conforme
  [`incident-response-plan.md`](./incident-response-plan.md).
- Feedback qualitativo de 3 stakeholders (CTO, CEO, suporte).

---

## 7. Restrições e honestidade documental

Este documento **NÃO** afirma:

- ❌ Que a DemoBR já tem DPO contratado.
- ❌ Que existe um DPO designado respondendo `dpo@easydemo.io`.

Este documento **AFIRMA**:

- ✅ Que existe um **processo formal** pronto para ser executado.
- ✅ Que existe um **canal funcional** com encaminhamento para a
  liderança até a contratação.
- ✅ Que o **timeline** de até 90 dias é o compromisso público.

---

## 8. Próximos passos para o usuário humano

1. Disparar **Fase 0** do processo (aprovação de orçamento +
   decisão de caminho).
2. Acompanhar **Fases 1–4** conforme cronograma.
3. Após contratação, executar o checklist da Fase 3 integralmente.
4. Atualizar este documento com o nome real do DPO contratado
   (em `DPO.md` §2 e `CHANGELOG-DPO.md` §4).

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — PENDENTE DE CONTRATAÇÃO
Versão: 0.1.0
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```