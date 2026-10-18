# Live 2026 — REA ao vivo dos concorrentes (out/2026)

**Data de coleta:** 18 de outubro de 2026
**Método:** Webfetch (HTTP GET, parser markdown) + status pages públicas + Chrome Web Store + páginas /pricing, /blog, /changelog, /sitemap.md e páginas /llms-full.txt de docs públicas.
**Páginas consumidas:** 24 webfetches bem-sucedidos + 0 websearch hits (dentro do budget de 30).
**Janela:** Q3–Q4 2026 (agosto-outubro), com visão longitudinal de tendências de 12 meses.

Esta pasta complementa `research/` (que contém SYNTHESIS.md com dados coletados em janelas anteriores e análise estática) com **dados primários ao vivo de outubro de 2026**. Útil quando você precisa da verdade-de-momento (preço pós-AI Agent, número real de instalações na Chrome Store, status page atual, novos recursos nas últimas 8 semanas).

## Índice

| Arquivo | Conteúdo | Fontes primárias |
|---|---|---|
| [`competitors-pricing-live.md`](./competitors-pricing-live.md) | Pricing HOJE (out/2026) | Sites /pricing + páginas /plans oficiais |
| [`chrome-store-stats.md`](./chrome-store-stats.md) | Ratings, reviews, instalações reais | Chrome Web Store oficial |
| [`competitor-roadmap-q3q4.md`](./competitor-roadmap-q3q4.md) | Features lançadas Q3-Q4 2026 | /blog/product-updates, /changelog |
| [`status-pages.md`](./status-pages.md) | Uptime, incidentes, infra hints | Atlassian Statuspage, Better Stack, incident.io |
| [`hiring-stack.md`](./hiring-stack.md) | Stack via vagas públicas | Páginas /careers, AshbyHQ, LinkedIn inferido |
| [`g2-capterra-recent-reviews.md`](./g2-capterra-recent-reviews.md) | Reviews Q3-Q4 2026 | G2 (acessos parciais — ver limitações) |
| [`nps-csat-benchmarks.md`](./nps-csat-benchmarks.md) | NPS/CSAT benchmark do setor | Sites institucionais (Supademo, Navattic, Storylane public ratings) |
| [`paid-ads-strategy.md`](./paid-ads-strategy.md) | Quem anuncia + palavras-chave | Estado da arte inferido via ADL/precedentes (limitação importante) |
| [`mcp-server-guide.md`](./supademo-mcp-server-guide.md) | Guia MCP do Supademo (síntese técnica) | docs.supademo.com |
| [`market-movements.md`](./market-movements.md) | Síntese: o que mudou + impacto no DemoBR | Cruzamento de todos acima |

## Limitações conhecidas (importantes)

1. **G2 e Capterra retornaram 403** no fetch direto. A maioria dos dados de review foi inferida de citações reproduzidas em páginas oficiais dos concorrentes (Supademo /compare/storylane-alternative, /compare/guideflow-alternative, /reviews, etc.). Para a verdade de G2 real, é preciso um scraper autenticado ou API de paga.
2. **Websearch** desta sessão retornou 0 resultados para todas as queries (provedor de busca não está indexando 2026). Todo o trabalho primário é via webfetch direto.
3. **AshbyHQ e LinkedIn** não retornaram conteúdo público — todas as vagas e headcounts foram inferidos pelos sinais nas páginas /careers dos próprios fornecedores (ex.: Supademo lista 115 E 23rd Street, NY; Storylane lista "built in SF Bay Area", "Y Combinator"-backed).
4. **Google Ads (SERPs "Sponsored")** não puderam ser medidos sem busca funcional. Estratégia de paid ads é reconstruída por sinais indiretos.
5. **interdemo.com.br** retornou página em branco na sessão — registro como limitação.

## Convenções

- 💲 = pricing confirmado (com timestamp 2026-10-18)
- 🟢 = HIGH confidence (fonte direta verificada)
- 🟡 = MEDIUM confidence (fonte indireta ou inferida)
- 🔴 = LOW confidence (chute ou limitado por paywall)

Todos os timestamps de coleta estão na primeira seção de cada arquivo.
