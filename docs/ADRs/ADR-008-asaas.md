# ADR-008: Asaas como gateway de pagamento brasileiro

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

EasyDemo é um SaaS B2B vendido no Brasil em reais (BRL). O público-alvo (CMOs, gerentes de marketing, heads de growth) paga com:

- **PIX** (~70% das transações em SaaS B2B BR pequeno).
- **Boleto bancário** (~15% — empresas com fluxo de caixa mensal).
- **Cartão de crédito recorrente** (~15% — LTV maior, ticket médio mais alto).

Devemos escolher entre gateways que suportem **PIX + boleto + cartão recorrente** com **webhooks maduros**, **notas fiscais** automáticas e **split** (Fase 2, se marketplace).

## Decision Drivers

- Cobertura dos 3 métodos (PIX, boleto, cartão recorrente).
- **API de subscription nativa** (cobrar todo mês sem intervenção).
- **Webhook HMAC** assinado, com retry próprio (não queremos implementar retry).
- Nota fiscal eletrônica inclusa (B2B exige NF-e).
- Taxa de processamento compatível com ticket médio de R$ 50–500/mês.
- **Suporte em PT-BR** (importante para clientes PJ).

## Considered Options

1. **Asaas** (PIX + boleto + cartão recorrente + NF-e).
2. **Mercado Pago** (líder demercado, mas sem subscription API BR robusta).
3. **Pagar.me** (Stone, devs-friendly).
4. **InfinitePay** (taxa mais baixa).
5. **Stripe BR** (DX superior, mas FATURAMENTO em USD por padrão).

## Decision Outcome

**Chosen option: "Asaas"**, porque é **o único gateway BR pequeno-médio** que combina **subscription API nativa + PIX recorrente + boleto + cartão + NF-e automática** em um único contrato. Para ticket médio R$ 100/mês, taxa Asaas (R$ 0,99 PIX + R$ 0,49 + 1,99% cartão) é aceitável.

Configuração:

- Conta Asaas **produção** com CNPJ da EasyDemo.
- **API key** em env `ASAAS_API_KEY` (produção vs sandbox separados).
- Webhook secret em `ASAAS_WEBHOOK_SECRET` (HMAC SHA256).
- Endpoint `/api/webhooks/asaas` valida assinatura e processa eventos: `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_CONFIRMED`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_INACTIVATED`, `SUBSCRIPTION_REACTIVATED`.
- Idempotência por `webhook_id` em `app.webhook_deliveries`.
- Subscription Asaas criada em `checkout` — redireciona cliente para `https://sandbox.asaas.com/c/...` ou `https://www.asaas.com/c/...` (produção).
- NF-e automática Asaas — basta cliente ter CNPJ cadastrado; Asaas gera mensalmente.

### Positive Consequences

- **1 vendor** para PIX + boleto + cartão + NF-e + split.
- **PIX recorrente** nativo — feature crítica para o BR (concorrentes só Stripe/pagar.me).
- Webhooks **maduros** com retry e assinatura HMAC.
- **Dashboard BR** completo (relatórios, estornos, repasses).
- Suporte **PT-BR** (telefone, chat, email).
- Conta única aceita CNPJ e CPF.
- Split (marketplace) pronto para Fase 2.

### Negative Consequences

- Taxa PIX R$ 0,99 **por transação** (mais alta que Stripe 0,4% + R$ 0,40); em volume vira relevante.
- API REST tem pegadinhas (ex.: `billingType` aceita `CREDIT_CARD` mas subscription tem regras específicas para `BOLETO`).
- Sem CLI oficial (exige Postman collection ou `asaas-cli` third-party).
- Lock-in moderado (migrar de gateway implica re-onboarding de clientes).
- UI de checkout não é customizável sem plano Enterprise.

### Follow-ups

- Documentar reconciliation manual mensal em `scripts/asaas-reconciliation.ts`.
- Construir **retry inteligente** no webhook: 3 tentativas com backoff 1min/5min/30min (já feito pelo Asaas, mas queremos monitorar `webhook_deliveries`).
- Planejar **Stripe como gateway secundário** para clientes enterprise USD (Fase 2).

## Pros and Cons of the Options

### Asaas (escolhido)

- Good, subscription API nativa.
- Good, PIX recorrente.
- Good, NF-e automática.
- Good, suporte PT-BR.
- Good, webhook madura.
- Bad, taxa PIX alta (R$ 0,99 fixo).
- Bad, UI checkout não customizável.

### Mercado Pago

- Good, marca conhecida (checkout converte mais por confiança).
- Good, taxa PIX menor (0,99% ou R$ 0,10).
- Bad, **subscription API limitada** (recorrência só via cartão; PIX pré-pago).
- Bad, split (marketplace) só em plano avançado.
- Bad, NF-e exige integração adicional (Bling, eNotas).

### Pagar.me (Stone)

- Good, dev-friendly (API REST madura).
- Good, split nativo (marketplace).
- Good, taxa razoável.
- Bad, PIX recorrente ainda em beta.
- Bad, NF-e não inclusa.
- Bad, dashboard menos intuitivo.

### InfinitePay

- Good, taxa PIX mais baixa (~R$ 0,50 + 0,99%).
- Good, conta digital inclusa.
- Bad, **subscription API fraca** (recorrência experimental).
- Bad, sem NF-e integrada.
- Bad, suporte mais lento.

### Stripe BR

- Good, DX superior, webhooks perfeitos, subscriptions robustas.
- Good, aceita CNPJ brasileiro (Stripe Atlas ou Connect).
- Bad, **faturamento em USD** por padrão — exige Connect, trabalho extra.
- Bad, **PIX recorrente em beta** (Stripe PIX Direct).
- Bad, NF-e não inclusa.
- Bad, custo total (Stripe Tax + Connect + Atlas) pode exceder Asaas.

## References

- [Asaas API docs](https://docs.asaas.com/)
- [Asaas subscriptions](https://docs.asaas.com/reference/criar-nova-assinatura)
- [Asaas webhooks](https://docs.asaas.com/reference/webhook-para-cobranças)
- [Mercado Pago subscriptions](https://www.mercadopago.com.br/developers/pt/reference/subscriptions/_preapprovals/post)
- [Pagar.me](https://docs.pagar.me/)
- [Stripe BR](https://stripe.com/br)
- RFC EasyDemo §2.2 — escolha de pagamento
- `research/pricing/payment-brazil.md` — comparativo completo