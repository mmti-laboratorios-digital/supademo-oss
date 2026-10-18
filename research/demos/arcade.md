# Arcade (arcade.software)

- **URL:** https://www.arcade.software
- **Pricing:** https://www.arcade.software/pricing
- **Docs / KB:** https://docs.arcade.software/kb
- **Changelog:** https://www.arcade.software/changelog
- **Brand:** https://www.arcade.software/brand
- **Status:** https://arcadehq.statuspage.io
- **G2:** Arcade Pro — posição alta na categoria Demo Automation + AI Video, "4.7/5" e conforme reviews.
- **Showcase:** https://www.arcade.software/showcase

## Modelo de negócio
SaaS B2B freemium com **3 tiers** (Free / Growth $50 → $42.50 annual / Enterprise custom). Modelo **credits** para AI (Demos são credit-free; Vídeos custam 50 credits por 30s; Visuais custam 50 credits cada). Posicionamento: **"On-brand AI product stories"** — fusion de **interactive demo** + **AI video** + **AI visuals**. Forte marca (ajudou OpenAI, Salesforce, Webflow, Instacart, Gtmhub, Carta, Clearbit).

### Planos
| Plano | Preço | Usuários | Highlights |
| --- | --- | ---: | --- |
| Free | $0 | 1 | 1 published demo + 1 published video; 200 AI credits/mês |
| Growth | $50/seat (anual $42.50) | 1–10 | Unlimited published demos; 800 credits; branching; CTAs/forms; GIF/MP4 export; custom branding; custom landing page; integrations |
| Enterprise | Custom | Multiple | Up to 10 Brand Kits, SSO, role-based access, version history, offline access, demo collections, HTML capture, multiple teams, custom domains, dedicated CSM + Slack, white-glove AI Context Engine, 100k credits/ano |

## Identidade visual (IDE)
- Logo: símbolo de game controller + wordmark preta/branca. Sistema de cores navy/azul com toques roxos/rosa.
- Templates e UI são **luxuosos** — muito uso de gradientes, animações, cards com sombra delicada. Posicionamento claro "visual storytelling tool".

## Funcionalidades (grupos)

### 1. Captura
- **Chrome Extension** (https://chromewebstore.google.com/detail/arcade/gagidkjllbdgggpboolfmmdpeagghjlm)
- **Desktop App** (Mac/Windows) — captura **multi-app simultaneamente**.
- **Figma Plugin** — designs → demos.
- **Upload media** — manual.
- **HTML capture** — Enterprise only.

### 2. Editor de Demo
- Hotspots & Callouts
- **Chapters** — navegação por capítulos.
- **AI Copy** ("Avery").
- **AI Voiceover** (sintética).
- **Camera recording** (face-cam).
- **Background music**.
- **Pan & Zoom**.
- **Video editing & splitting**.
- **Demo Branching** (rotações condicionais).
- **Custom variables** (personalização via URL parameters).
- **Demo CTAs and forms** (Growth+).
- **AI Translations** (Growth+).
- **Mobile view**.

### 3. AI Video & Visuals
- Video generation (synthetic)
- Visual generation (synthetic)
- **Brand Kit** (cores, fontes, logos) — até 10 no Enterprise
- **White-glove AI Context Engine** (Enterprise)

### 4. Player / Sharing
- Share com link
- **Embed widget (iframe)**
- **Export GIF & MP4** (Growth+)
- **Step-by-step guides**
- **Custom links** (variáveis na URL)
- **Collections** (hub de demos)
- **Custom domain** (Enterprise)

### 5. Analytics
- **Basic insights** (Free)
- **Advanced insights** (Growth) — Audience Reveal, data propagation
- **API Integrations & Connectors** (Growth+)
- Native Salesforce

## Diferenciais vs Supademo
- **AI Video + AI Visuals** nativa (Storylane/Supademo são demo-first; Arcade = demo + AI creative suite).
- **Brand Kit com 10 slots** e AI Context Engine — gera conteúdo "on-brand".
- UX de editor considerada referência visual da categoria.
- Para times criativos que precisam de vídeos + demos no mesmo tool.

## Stack detectável
- **Marketing:** Next.js (Hydration markup com chunks `/_next/static/immutable/...`).
- **App:** Next.js com SSR + React 19 + Vercel (autenticação via Service-Worker auth flow).
- **Captura:** DOM recorder próprio + provavelmente rrweb inspirado (Stack interna confirmada em HN: TypeScript/JS/Node + ActionHero + React em 2021; hoje React/Next).
- **Assets CDN:** `cdn.arcade.software` (imagens, fonts Inter Variable).

## Pontos fracos
- AI credits podem ser limitados; Growth só 800/mês com reset mensal.
- HTML capture é Enterprise — barreira alta pra quem quer "clone-html" barato.
- Free é rígido: 1 demo + 1 vídeo, no máximo.
- Sem Pix/BRL; preços em USD.

## Demos / Casos públicos
- https://www.arcade.software/showcase
- Cases: Salesforce +70% meetings booked, Wrike +65% paid conversion, Labelbox 9× CTA clicks, SpotOn 18× content creation speed, SightCall 2× pipeline em 1Q.
