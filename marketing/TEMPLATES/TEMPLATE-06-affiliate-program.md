# TEMPLATE-06 — Affiliate Program (recrutamento)

> **Quando usar:** recrutar microinfluenciadores SaaS BR (1k–50k seguidores LinkedIn/Twitter/Instagram) para o programa de afiliados DemoBR.
> **Estrutura:** 20% recorrente por 12 meses (alinhado com `LAUNCH-PLAN.md` §4.6).
> **Ferramenta:** Hotmart OU Lemon Squeezy (decidir antes do launch).
> **Persona-alvo:** PMMs, founders de SaaS, professores de marketing digital, consultores de RevOps BR.

---

## Variáveis comuns

| Variável | Exemplo |
|---|---|
| `{{nome}}` | "Carla" |
| `{{seguidores}}` | "5k seguidores" / "12k na newsletter" |
| `{{nicho}}` | "marketing SaaS" / "RevOps" / "PLG para startups" |
| `{{link_afiliados}}` | `https://app.demobr.com.br/afiliados/signup?ref={{ref_code}}` |
| `{{link_dashboard_demo}}` | `https://app.demobr.com.br/afiliados/dashboard` |

---

## Por que DemoBR faz sentido pra afiliados

| Argumento | Como explicar |
|---|---|
| **Produto novo**, baixa concorrência em PT-BR | "Você pode ser um dos primeiros a recomendar a principal ferramenta de demos do Brasil" |
| **Comissão recorrente** (não one-shot) | "20% por mês durante 12 meses — ganha enquanto o cliente paga" |
| **SaaS B2B alto ticket** (R$ 49 Pro / R$ 199 Business) | "Ticket médio R$ 100/mês = R$ 20/mês por afiliado ativo" |
| **LGPD + PIX + NF-e** | "Diferenciais brasileiros fortes, fácil de vender" |
| **Suporte direto do founder** | "Eu (Ana) respondo email e ajudo você a vender" |

---

## Email de recrutamento — versão fria (≤ 250 palavras)

### Subject

> `{{nome}}, programa de afiliados DemoBR (20% recorrente, nicho {{nicho}})`

### Body

> Oi {{nome}},
>
> Acompanho seu trabalho em {{nicho}} há um tempo — {{linha_pessoal}}.
>
> Estou lançando o **programa de afiliados do DemoBR** (ferramenta de demos interativas, BR-first, com PIX e LGPD) e acho que faz sentido pra você.
>
> **Como funciona:**
>
> 1. Você se cadastra como afiliado (grátis).
> 2. Divulga com seu link rastreado.
> 3. Ganha **20% recorrente por 12 meses** sobre a assinatura do cliente.
>
> **Por que você pode ganhar bem com isso:**
>
> - **Ticket médio** do DemoBR: R$ 49 Pro + R$ 199 Business = média ~R$ 100/mês.
> - **Sua comissão**: ~R$ 20/mês por cliente ativo.
> - **10 clientes ativos** = R$ 200/mês recorrente pra você.
> - **50 clientes ativos** = R$ 1.000/mês recorrente.
>
> **Material que entrego pra você:**
>
> - Banners 728×90 + 300×250 + stories Instagram.
> - Copy de email + posts prontos.
> - Demo do produto pra você testar antes.
> - Dashboard com clicks, signups e MRR gerado em tempo real.
> - Suporte direto comigo (Ana, founder).
>
> **Como entrar:**
>
> → [Cadastrar como afiliada]({{link_afiliados}})
>
> Programa aberto até **{{data_limite}}**. Topa?
>
> —
> **Ana · DemoBR**
>
> PS: DemoBR está em launch no Product Hunt essa semana — pode aproveitar o buzz.

---

## Mensagem de LinkedIn DM (≤ 100 palavras)

> Oi {{nome}}, vi seu post sobre {{tema_específico}} e lembrei de você.
>
> Estou abrindo o programa de afiliados do DemoBR (ferramenta de demos BR, com PIX). **20% recorrente por 12 meses**, ticket médio R$ 100/mês.
>
> Pode fazer sentido pra você, considerando seu público de {{nicho}}.
>
> Topa eu te mandar o programa + materiais? Sem compromisso.

---

## Materiais entregues ao afiliado aprovado

### Banners e criativos
- 728×90 (header blog)
- 300×250 (sidebar)
- 1080×1080 (Instagram post)
- 1080×1920 (stories Instagram)
- Logo em fundo claro/escuro
- Screenshots do produto

### Copy pronta
- Email template (200 palavras)
- 3 posts LinkedIn
- 3 tweets com hashtags
- Caption Instagram + hashtags

### Demo de afiliado
- Acesso Pro por 60 dias (pra experimentar antes de promover)
- Link direto pro dashboard pessoal

### Dashboard (`/afiliados/dashboard`)
- Clicks no link (últimos 30 dias)
- Signups atribuídos
- MRR gerado
- Comissão acumulada
- Saque via PIX (mínimo R$ 50)

---

## Estrutura da comissão

| Item | Detalhe |
|---|---|
| **% recorrente** | **20%** |
| **Duração** | **12 meses** (a partir do 1º pagamento do cliente) |
| **Base de cálculo** | MRR do cliente (Pro R$ 49 ou Business R$ 199) |
| **Limite** | Sem teto |
| **Saque mínimo** | R$ 50 |
| **Frequência** | Mensal (D+5 do mês) |
| **Método** | PIX |
| **NF-e / recibo** | Recibo simples gerado pela plataforma DemoBR |

---

## Regras e compliance

### Permitido
- Divulgar em LinkedIn, Twitter, Instagram, blog pessoal, newsletter, YouTube.
- Cupom próprio (ex: `CARLA20`).
- Banners da DemoBR.
- Reviews honestos (negativos também — é o que faz a afiliada parecer confiável).

### Proibido
- **Google Ads em keywords da DemoBR** (navattic, supademo, demo interativa). Reservamos esses termos.
- **Spam** (DM em massa, grupos de WhatsApp, comment spam).
- **Discurso de ódio, político, discriminatório**.
- **Fraude** (clicks falsos, signups com email descartável, self-referral).

### Penalidades
- 1ª violação: aviso + reset de comissão pendente.
- 2ª violação: banimento + cancelamento de comissões futuras.
- Fraude comprovada: banimento + cobrança judicial (se houver prejuízo).

---

## ToS do programa (`/termos-afiliados`)

> Resumo dos pontos críticos:
>
> 1. DemoBR se reserva o direito de aprovar/rejeitar afiliados.
> 2. Comissão é paga apenas sobre clientes **pagos** (trial não conta).
> 3. Reembolso do cliente dentro de 14 dias = estorno da comissão.
> 4. Cancelamento do cliente = fim da comissão após o mês corrente.
> 5. DemoBR pode alterar % e regras com 30 dias de aviso.
> 6. Disputas são resolvidas via arbitration em São Paulo, Brasil.

> ⚠️ **Jurídico validar** antes do launch.

---

## Recrutamento — estratégia por canal

### LinkedIn (alta prioridade)
- Buscar 50 perfis de PMMs + founders SaaS BR (1k–50k seguidores).
- DM 1-a-1 com mensagem personalizada.
- **Meta:** 20 afiliados ativos no M2.

### Twitter/X
- Post "estou contratando afiliados" + reply em perfis de nicho.
- Cupom de boas-vindas: `FIRST20`.

### Newsletter
- Oferecer programa em troca de menção em 5 newsletters BR (RD Station, Resultados Digitais, SaaS Break).

### Instagram Reels
- Convidar 3 microinfluenciadores de marketing digital pra Reels patrocinado.
- Comissão 30% no 1º mês (bônus de inauguração).

---

## Cadência de comunicação com afiliados

| Quando | Conteúdo |
|---|---|
| **Dia 0 (aprovação)** | Email de boas-vindas + link do dashboard + materiais |
| **Semana 1** | Email "como divulgar" + exemplos de posts |
| **Mês 1** | Email "seus números do 1º mês" + dica de venda |
| **Mês 3** | Email "novos materiais" + cases de sucesso |
| **Mês 6** | Email "black friday: cupom especial" |
| **Mês 12** | Email "último mês de comissão — vamos renovar?" |

---

## Compliance LGPD

> Afiliados são **controladores** dos dados dos seus próprios leads (não compartilhamos leads capturados via link de afiliado com terceiros).
>
> Email de recrutamento é **B2B legítimo** (interesse comercial claro), com **link de opt-out**.

---

## Métricas-alvo (M2 em diante)

| Métrica | Meta |
|---|---|
| Afiliados cadastrados | ≥ 30 |
| Afiliados que indicam ≥ 1 cliente | ≥ 10 (33%) |
| MRR gerado via afiliados | ≥ R$ 5.000 (M3) |
| Ticket médio de cliente afiliado | ≥ R$ 80 (Pro majoritário) |
| Churn de clientes afiliados | ≤ 5% (vs 5% baseline) |

---

## Referências internas

- Programa no launch plan: `marketing/LAUNCH-PLAN.md` §4.6
- Pricing tiers: `research/pricing/SYNTHESIS.md` §3
- ICPs: `marketing/ICP-PERSONAS.md`
- Cases pra usar em materiais: `marketing/CASE-STUDIES/`
- Tom de voz: `marketing/BRAND.md` §1