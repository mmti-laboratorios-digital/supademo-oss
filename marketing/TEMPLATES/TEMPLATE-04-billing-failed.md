# TEMPLATE-04 — Billing Failed (PIX/boleto falhou)

> **Quando usar:** webhook do Asaas reporta falha em pagamento recorrente (PIX rejeitado, boleto vencido, cartão recusado).
> **Janela de retry:** Asaas tenta automaticamente 3x em 7 dias. Email envia após a 1ª falha.
> **Objetivo:** recuperar o pagamento sem que o usuário cancele o serviço.

---

## Variáveis comuns

| Variável | Exemplo |
|---|---|
| `{{nome}}` | "Pedro" |
| `{{empresa}}` | "Linneo" |
| `{{plano}}` | "Pro" / "Business" |
| `{{valor}}` | "R$ 49,00" |
| `{{motivo_falha}}` | "PIX não compensado em 24h" / "boleto vencido" / "cartão recusado" |
| `{{data_tentativa}}` | "15/10" |
| `{{link_retry}}` | link pro Asaas re-tentar |
| `{{link_mudar_metodo}}` | `/app/{{workspace_slug}}/billing` |

---

## Email #1 — Falha detectada (D0 da falha)

### Subject

> `{{nome}}, seu pagamento de {{valor}} não foi processado`

### Body (≤ 200 palavras)

> Oi {{nome}},
>
> Tentamos cobrar o pagamento do seu plano **{{plano}}** ({{valor}}) hoje, **{{data_tentativa}}**, mas a cobrança falhou.
>
> **Motivo:** {{motivo_falha}}.
>
> **O que acontece agora:**
>
> - O DemoBR vai tentar de novo automaticamente nos próximos 3 dias.
> - Seu acesso continua liberado durante esse período.
> - Se o pagamento não compensar em 7 dias, sua conta volta pro plano **Free** (sem perder suas demos, mas com limite de 3 demos e 50 views/mês).
>
> **3 opções pra resolver agora:**
>
> 1. **Tentar de novo** → [reprocessar pagamento]({{link_retry}})
> 2. **Mudar método** (PIX → cartão, por exemplo) → [abrir billing]({{link_mudar_metodo}})
> 3. **Falar comigo** se tiver algum problema técnico ou financeiro — responda esse email.
>
> —
> **Ana · DemoBR**
>
> PS: Se for cartão expirado ou limite, dá pra trocar a forma de pagamento sem cancelar a assinatura. PIX também funciona via Pix Automático.

---

## Email #2 — Lembrete (D+2, se ainda não pagou)

### Subject

> `Lembrete: pagamento do DemoBR {{plano}} ainda pendente`

### Body (≤ 130 palavras)

> Oi {{nome}},
>
> Passou 2 dias desde o email sobre a falha do DemoBR {{plano}}.
>
> Só passando pra lembrar:
>
> → [Resolver agora]({{link_retry}})
> → [Trocar método de pagamento]({{link_mudar_metodo}})
>
> Se quiser conversar sobre o motivo da falha (ou se for uma decisão de cancelar), me conta — sem julgamento.
>
> —
> **Ana · DemoBR**

---

## Email #3 — Último aviso (D+6, antes do downgrade)

### Subject

> `Amanhã sua conta DemoBR volta pro plano Free`

### Body (≤ 150 palavras)

> Oi {{nome}},
>
> A última tentativa de cobrança do DemoBR {{plano}} falhou hoje.
>
> **Amanhã**, sua conta volta automaticamente pro plano **Free**:
>
> - Suas demos continuam salvas (não perdemos nada).
> - Você perde acesso a Pro (analytics avançado, leads, sem limite de 3 demos).
>
> **3 opções:**
>
> 1. [Tentar pagamento de novo]({{link_retry}}) — pode ser que a 4ª tentativa funcione.
> 2. [Mudar método de pagamento]({{link_mudar_metodo}}) — cartão novo, PIX, boleto.
> 3. [Falar comigo]({{link_calendly}}) — 5 min, vejo o que aconteceu.
>
> Se for cancelamento consciente, sem stress — você pode voltar quando quiser.
>
> —
> **Ana · DemoBR**

---

## Email #4 — Conta voltou pro Free (D+7)

### Subject

> `Sua conta DemoBR voltou pro plano Free — sem perder nada`

### Body (≤ 180 palavras)

> Oi {{nome}},
>
> Como o pagamento do {{plano}} não compensou em 7 dias, sua conta voltou pro plano **Free** hoje.
>
> **O que NÃO mudou:**
>
> - Suas demos estão salvas.
> - Seus leads (se tinha coletado) estão seguros.
> - Seu link de compartilhamento continua ativo.
>
> **O que mudou:**
>
> - Limite de 3 demos publicadas (vs ilimitado no Pro).
> - 50 visualizações/mês (vs 5.000 no Pro).
> - Analytics básico (vs engagement por step no Pro).
> - Sem formulário de leads (LGPD).
>
> **Se quiser voltar pro Pro:**
>
> → [Reativar Pro por R$ 49/mês]({{link_reativar}})
>
> Use o cupom `VOLTEI20` pra 20% off no primeiro mês como "boas-Vindas de volta".
>
> —
> **Ana · DemoBR**

---

## Cadência completa

```
Falha detectada
  │
  ├─ D0 ──→ Email #1 (notificação + 3 opções)
  │
  ├─ D+2 ─→ Email #2 (lembrete curto)
  │
  ├─ D+6 ─→ Email #3 (último aviso antes do downgrade)
  │
  └─ D+7 ─→ (downgrade automático pro Free)
              │
              └─ D+7 ─→ Email #4 (account downgrade + cupom reativação)
```

---

## Casos especiais

### Se for `pix_rejeitado_vencido` (caso comum no BR)
- Email #1 inclui **botão de "gerar novo PIX"** (mais simples que "tentar de novo").
- Dica no body: "Pix Automático tem D+0, copia e cola o novo QR code."

### Se for `cartao_recusado`
- Email #1 inclui **botão de "trocar cartão"** com link direto pro Asaas.
- Sugerir tentar **outro cartão** antes de "cancelar".

### Se for `boleto_vencido`
- Email #1 inclui **botão de "segunda via"** (Asaas gera nova com vencimento +3 dias).
- Lembrete: boleto pode levar 1–3 dias úteis pra compensar.

### Se for `chargeback_dispute`
- **Não enviar email automático.** Acionar humano (Ana) pra resolver manualmente.
- Pode ser fraude ou erro do cliente — verificar histórico antes de responder.

---

## Métricas-alvo

| Métrica | Meta |
|---|---|
| Recovery rate (pagou após email #1) | ≥ 35% |
| Recovery rate (pagou até email #3) | ≥ 55% |
| Downgrade → Free → Reativação em 30 dias | ≥ 10% |
| Cancelamento definitivo após billing failed | ≤ 20% |

---

## Compliance LGPD

> Email não expõe dados financeiros sensíveis (nunca incluir últimos 4 dígitos do cartão ou número completo do boleto).
>
> Link de **opt-out de emails financeiros** sempre presente (LGPD art. 18, IV).

---

## Referências internas

- Pricing e Asaas: `research/pricing/payment-brazil.md`
- ICP Persona 1 churn signals: `marketing/ICP-PERSONAS.md`
- Tom de voz: `marketing/BRAND.md` §1