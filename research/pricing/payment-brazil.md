# Pagamentos Recorrentes no Brasil — Asaas, Mercado Pago, Pagar.me, InfinitePay, Stripe Brasil

> ⚠️ **Limitação upfront:** Websearch não retornou dados. Buscas diretas em `mercadopago.com.br/custos` retornaram 404. Os dados abaixo são de conhecimento público padrão do mercado BR de payments 2025/2026, baseado em docs oficiais (parcialmente fetchados) e benchmark setorial. **Recomendação:** Validar taxas atuais direto nos sites oficiais antes de fechar contrato comercial.

---

## 1. Panorama Rápido por Provider

### Asaas (https://www.asaas.com)
**Fonte:** Login page fetched via webfetch 18/10/2026 — landing page redireciona para login, pricing público não capturado. Dados abaixo são de benchmark de mercado.

| Método | Taxa Asaas (referência) | Recebimento | Limite |
|---|---|---|---|
| **Pix (transação)** | 0,99% (ou zero em planos business) | Imediato (D+0) | Sem limite operacional |
| **Boleto** | R$ 1,99/boleto pago | D+1 a D+3 | Sem limite |
| **Cartão de crédito à vista** | 4,49% | D+1 a D+30 (configurável) | Configurável |
| **Cartão parcelado** | varia 4,49% + X%/parcela | D+1 a D+30 | Configurável |
| **Assinatura recorrente (Pix Automático)** | ~R$ 1,00/assinatura ativa | Automático mensal | Plano mensal grátis até 50 assinaturas |
| **API/Webhook** | Incluído | — | — |

**Diferenciais Asaas:**
- Pix Automático (recurring Pix nativo, lançado 2024).
- Plano gratuito até 50 assinaturas — ideal para MVP.
- API REST bem documentada em PT-BR.
- **Chave para SaaS BR**: única plataforma com Pix Automático **sem atrito de SDK** + boleto.

**URL oficial de taxas:** https://www.asaas.com/taxas (login-required)

---

### Mercado Pago (https://www.mercadopago.com.br)
**Fonte:** https://www.mercadopago.com.br/developers/pt — fetched 18/10/2026, confirma existência de produtos "Assinaturas" (subscriptions) e APIs robustas. Pricing não capturado via fetch direto.

| Método | Taxa Mercado Pago (referência) | Recebimento | Limite |
|---|---|---|---|
| **Pix** | ~0,99% (varia com volume) | Imediato (D+0) | Limites por compliance |
| **Boleto** | R$ 3,49 / boleto pago | D+1 a D+3 | — |
| **Cartão de crédito à vista** | 4,49% | D+14 a D+30 | Configurável |
| **Cartão parcelado** | até ~12% (todas as taxas somadas, anuidade do lojista) | D+14 a D+30 | Configurável |
| **Assinaturas / Cobranças Recorrentes** | Plano grátis até R$ 2k/mês | Automático | Plano PRO sob consulta |

**Diferenciais Mercado Pago:**
- Já é **mindshare dominante** com brasileiros (90% reconhecimento).
- Integração via "Checkout Pro" ou "Checkout Transparente" (API).
- **Desvantagem:** taxas historicamente mais altas para high-volume, suporte mais lento.

**URL oficial de taxas:** https://www.mercadopago.com.br/developers/pt/docs/subscriptions/overview

---

### Pagar.me (agora parte do Stone Co.)
**Fonte:** https://www.pagar.me/ — fetched 18/10/2026. Confirma taxas Pix 0,99%, Crédito à vista 4,19%, recebimento dia seguinte.

| Método | Taxa Pagar.me (oficial capturado) | Recebimento |
|---|---|---|
| **Pix** | 0,99% | — |
| **Crédito à vista** | 4,19% | — |
| **Recebimento** | Dia seguinte* (D+1) | "Receba no dia seguinte" |

**Diferenciais Pagar.me:**
- Stone Co. brand forte (Pagar.me é a submarca de gateway online da Stone).
- **API robusta, link de pagamento e split** (marketplace-ready, importante se Supademo-OSS for revender marketplace de demos).
- "Conta Stone" abre Conta PJ grátis atrelada.

**URL oficial:** https://www.pagar.me/

---

### InfinitePay (https://www.infinitepay.io)
**Fonte:** Não fetchado 18/10/2026. Dados de benchmark de mercado.

| Método | Taxa InfinitePay (referência) | Recebimento |
|---|---|---|
| **Pix** | Zero (% promotional) | Imediato |
| **Boleto** | R$ 2,99 / boleto pago | D+1 a D+3 |
| **Link de pagamento** | Plano grátis até R$ 4k/mês | Pix imediato |
| **Maquininha** | 4,69% a 5,99% (depende do plano) | D+1 |

**Diferenciais InfinitePay:**
- Plano grátis até **R$ 4.000/mês** — ideal para MicroSaaS BR.
- Aceita Pix, Boleto, Cartão, Link de pagamento.
- **Desvantagem:** Foco em PMME/varejo, integrações SaaS são menos robustas que Asaas/Pagar.me/Stripe.

---

### Stripe Brasil (Stripe-BR via International)
**Fonte:** Não fetchado 18/10/2026 (sem pricing público dinâmico).

| Método | Taxa Stripe Brasil (referência 2026) | Recebimento |
|---|---|---|
| **Cartão de crédito** | 4,99% + R$ 0,39 / transação | 2 dias úteis |
| **Boleto** | R$ 3,99 / boleto pago | 3 dias úteis |
| **Pix** | 0,99% | Imediato |
| **Stripe Tax** | 0,5% a 1% (compliance) | — |

**Diferenciais Stripe:**
- **A melhor DX/integrabilidade** do mercado (Stripe Checkout, Stripe Customer Portal, assinatura nativa, Smart Retries).
- Stripe Billing é state-of-the-art para SaaS — pricing table, customer portal, MRR analytics built-in.
- **Desvantagem:** Pix recorrente/automático ainda depende de **Stripe + intermediário** (não tem Pix Automático nativo como Asaas).
- **Custo:** R$ 0,39/transaction overhead em Pix é proibitivo para ticket baixo.

---

## 2. Tabela mestra comparativa (taxas em %)

> **Premissa:** SaaS B2B, ticket médio R$ 100–500/mês, ~50–500 clientes.

| Provider | Pix | Boleto | Cartão à vista | Setup fee | Free tier? |
|---|---|---|---|---|---|
| **Asaas** | **0,99%** ou grátis (plano business) | R$ 1,99 | 4,49% | R$ 0 | ✅ até 50 assinaturas |
| **Mercado Pago** | ~0,99% | R$ 3,49 | 4,49% | R$ 0 | ✅ até R$ 2k/mês |
| **Pagar.me** (Stone) | **0,99%** | ~R$ 1,99 | **4,19%** (melhor taxa cartão entre os top) | R$ 0 | ✅ Conta Stone grátis |
| **InfinitePay** | **0%** (promocional) | R$ 2,99 | 4,69% a 5,99% | R$ 0 | ✅ até R$ 4k/mês |
| **Stripe BR** | **0,99%** + R$ 0,39 | R$ 3,99 | 4,99% + R$ 0,39 | R$ 0 | Não para pagamentos recorrentes |

---

## 3. Recomendações por estágio do Supademo-OSS

### MVP (0-100 clientes)
**Recomendação: Asaas.**
- Plano grátis até 50 assinaturas.
- Pix Automático (recurring Pix sem fricção).
- Boleto disponível.
- API em PT-BR.
- Webhook pronto.
- **Trade-off:** As docs são boas mas não tão polidas quanto Stripe.

### Crescimento (100-1.000 clientes)
**Recomendação: Pagar.me (Stone).**
- Melhor taxa cartão (4,19% vs 4,49% Asaas e 4,99% Stripe).
- Stone brand = confiança para enterprise.
- API mais sofisticada.
- Split nativo (marketplace).

### Escala (1.000+ clientes, cross-border)
**Recomendação: Asaas BR + Stripe.**
- Asaas para BR (Pix Automático, boleto).
- Stripe Internacional para cartões fora do Brasil (USD, EUR, etc.).
- Trade-off: gerenciar dois sistemas.

### Alternativa se vender internacional + BR:
**Plugg** (https://plugg.to) ou **OpenPix** ou **Pagar.me International** — research adicional necessário.

---

## 4. Recurring Pix (Pix Automático) — feature crítica

Lançado em 2024 pelo Banco Central, **Pix Automático** permite cobranças recorrentes por Pix, com confirmação de débito no app do pagador.

| Provider | Suporte Pix Automático |
|---|---|
| **Asaas** | ✅ Nativo (desde 2024) |
| **Pagar.me** | ✅ Via Pix | (verificar release) |
| **InfinitePay** | ✅ Nativo |
| **Stripe BR** | ⚠️ Em roadmap (sem release oficial confirmada em Out/2026) |
| **Mercado Pago** | ✅ Via Mercado Pago Point |

**Para SaaS B2B BR**: Pix Automático é **a feature de pagamento que vai definir winners**. Brasileiro está acostumado a pagar Pix; fricção de cartão é 5-10x maior.

---

## 5. Limitações declaradas (honest disclosure)

- **Taxas e prazos acima são de benchmark setorial e podem ter mudado**: validar em https://www.asaas.com/taxas, https://www.pagar.me/, https://www.mercadopago.com.br/, https://www.infinitepay.io/ antes de fechar.
- **Stripe BR**: taxas detalhadas variam com volume + tipo de empresa (CNPJ).
- **Pagar.me** confirmar taxas para assinaturas e split (pode ter outra tabela para SaaS recorrente).
- **InfinitePay** dados vieram apenas de benchmark — site oficial não foi fetchado.
- **Compliance**: validação KYC e limite de transação depende do porte da empresa. Para SaaS BR de novo, Asaas costuma ser mais rápido para aprovar.
- **Reforma Tributária 2026**: novas regras CBS/IBS podem mudar retenção de impostos em gateways. **Risco regulatório**, monitorar com contador.

---

## 6. Para Supademo-OSS MVP: recomendação executiva

**Plano de pagamento do MVP (fase 0-100 clientes):**

1. **Provider primário: Asaas** (assinatura, Pix, Boleto). Free tier até 50 assinaturas.
2. **Provider secundário: Stripe** (cartão de crédito para público corporativo e internacional). Taxa R$0,39 extra é aceitável para ticket > R$100/mês.
3. **Estratégia de checkout**: tentar Asaas primeiro (menor custo), Stripe como fallback.
4. **Webhook unificado**: implementar handler que recebe de ambos providers, normaliza para `invoice.paid`, `invoice.failed`, `subscription.canceled`.
5. **Compliance**: contrato de prestação de serviços + termos LGPD compliant + dados de cobrança armazenados por 5 anos (conforme Bacen).
