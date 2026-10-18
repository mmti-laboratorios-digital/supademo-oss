# Interdemo (interdemo.com.br)

- **URL:** https://interdemo.com.br
- **Página produto:** https://interdemo.com.br/demo-interativa-saas
- **Blog (PT/EN/ES):** https://interdemo.com.br/en/blog
- **Suporte:** https://interdemo.com.br/signup
- **Contato:** contato@interdemo.com.br
- **Site oficial resposta:** aparece em https://interdemo.com.br/ es / en (multilíngue)

## Modelo de negócio
SaaS B2B brasileiro focado exclusivamente em **demos interativas para SaaS**. Posicionamento: o lead navega pelo produto como se fosse real, sem call, sem vídeo. **Modelo transacional** via "Fale com um especialista" / signup.

## Identidade visual (IDE)
- Cores: **Fundo dark + accent branco**, com uso moderado de tipografia bold.
- Logo: "Interdemo" wordmark simples, símbolo minimalista.
- Tipografia: **DM Sans, DM Mono, Outfit** (Google Fonts) → paleta SaaS moderna, jovem.
- Layout focado em hero "antes/depois" (lead desiste vs lead vê demo).

## Funcionalidades (inferidas da landing + estrutura)
1. **Captura interativa via extensão** (sem detalhes técnicos publicados).
2. **Editor para criar demos** — sem detalhes sobre HTML capture ou screenshot-only.
3. **Publicação** com link ou embed em landing pages.
4. **Analytics básico** (não detalhado, mas a página cita "aumento de conversão").
5. **CTA final** integrado ao site (botão "fale agora", WhatsApp ou form).
6. Sub-12.SEC.A: GA4 + Meta Pixel só após consentimento LGPD (analyticsLoader.ts).

## Diferenciais vs Supademo
- **Landing com comparação direta "vs call ou vídeo genérico"** — boa copy de funil.
- **LGPD-first**: scripts só após consentimento (analyticsLoader.ts).
- Bilíngue pt-BR/en/es desde MVP — vantagem pra atender LATAM inteiro.
- Concorrente focado em SaaS **puros** (não enterprise; tone of voice mais leve que Getdemo).

## Stack detectável (view-source `interdemo.com.br/`)
- **Frontend:** SPA React (Vite) → arquivo `index-BR2FeIZH.js` (Vite build output) + `index-HEkDsb5P.css`.
- **i18n:** hreflang tags pt-BR/en/es/x-default.
- **LGPD-aware analytics** — GA4 + Meta Pixel carregados **dinamicamente** só após consentimento via `src/lib/analyticsLoader.ts` + `AnalyticsBootstrap`.
- Fonts: Google Fonts (DM Sans, DM Mono, Outfit).
- Schema.org Organization JSON-LD inline.
- `robots: index, follow` (sem robots.txt especial).

## Pontos fracos
- Pricing **completamente não publicado** — exige contato.
- Sem marketplace de demos, sem hub de showcases.
- Tecnologia exata da captura (HTML clone? prints?) **não documentada** — incerteza pro dev.
- Sem MCP ou API pública.
- Sem plano gratuito visível, sem trial self-serve.
- Site focado apenas em demos (não onboarding/agent/training), ao contrário de Getdemo.

## Casos / clientes públicos
- Landing não cita clientes específicos → pode ser early-stage ou B2B sem blog estruturado.

## Conclusão para o MVP BR
Rival direto na narrativa "Transforme visitantes em usuários", mas **mesma fricção que Supademo combate**: poucos sinais públicos de tração/produto. Mostra que existe demanda por produto BR, mas abre espaço para um "Supademo BR" com pricing transparente, self-serve e feature parity.
