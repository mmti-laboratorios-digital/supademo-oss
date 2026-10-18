# Research / Pricing — tiers em R$ e USD

> **Status (2026-10-18):** este diretório recebeu os artefatos-base da primeira varredura de preços. Subagentes devem **expandir** com comparativos detalhados e tracking de mudanças de preço (a cada 6 meses).

## Supademo (USD, cobrança por creator seat)

| Tier | Mensal | Anual (por mês) | Seats | Fonte |
|---|---|---|---|---|
| Free | $0 | $0 | 1 creator | https://supademo.com/pricing |
| Scale | $50 | $38 | por creator | idem |
| Business | $249 | $199 | 1 incluso +$50/cada | idem |
| Growth | $450 | $350 | 5 inclusos +$50/cada | idem |
| Enterprise | Custom | Custom | ≥ 10 | idem |

Add-on AI Demo Agent: pacote $99 (1.400 créditos), $299 (5.500), $500 (12.500). 1 crédito ≈ 1 resposta de agente; ~20 créditos por chamada de 15 min. Cada workspace começa com 1.500 créditos grátis.

## GuiaFlow (R$, open source + Pro opcional)

| Tier | Mensal | Anual | Forma | Fonte |
|---|---|---|---|---|
| Free (open source) | R$ 0 | R$ 0 | Editor + player MIT no GitHub | https://github.com/gugamistri/gflow |
| Pro | **R$ 36** | R$ 359 | Stripe (PIX/boleto/cartão/Apple Pay/Google Pay) | https://guiaflow.pro/termos |

Fora do BR, cobrado em USD: US$ 7/mês ou US$ 69/ano.

## Guideflow.com (enterprise, USD)

| Tier | Preço | Notas |
|---|---|---|
| Individuals | (sob consulta) | Screenshot demo, Mobile demo, Demo Page |
| Team | (sob consulta) | Unlimited guideflows, Advanced analytics, AI demo content, Leads forms & surveys |
| Enterprise | **US$ 599/mês** (no top tier público) | 1 member included, +$35 por additional |

Fonte: https://www.guideflow.com/pricing (varredura 2026-10-18).

## Storylane / Navattic / Walnut / Arcade

Preços sob consulta / enterprise — não publicam tier acessível. Indicação geral: planos iniciam em ~$400–$1.000/mês USD, foco mid-market e enterprise.

## Players BR adicionais

- **Karumi** (https://karumi.ai/pt/blog/best-interactive-demo-software): demo agêntica por videochamada, posicionada para enterprise; preço sob consulta.
- **Saleo** (foco enterprise, sob consulta; tier mais baixo público não encontrado).
- **GetDemo** (https://www.getdemo.com.br): agência/serviço, não SaaS self-serve.

## Decisão de pricing do clone BR

| Tier | Preço (BRL) | Justificativa |
|---|---|---|
| Free | R$ 0 | Funil + LGPD-friendly onboarding |
| Pro | **R$ 49/mês** (R$ 490/ano) | 50% acima do Pro GuiaFlow em R$, mas ≈ 75% abaixo do Supademo Scale em USD-eq; "decisão de cartão corporativo" |
| Business | **R$ 199/mês** (R$ 1.990/ano) | ancora enterprise; metade do Supademo Business USD-eq |

Ver Seção 4 da `docs/RFC-Brazilian-Supademo.md` para tabela canônica.

## Próximos passos

- Tracking trimestral de mudanças de preço dos concorrentes.
- Comparativo FX USD/BRL mensal.
- Análise de elasticidade de preço do Pro via A/B (após GA).