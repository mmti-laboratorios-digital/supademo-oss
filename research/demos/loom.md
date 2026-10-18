# Loom (somente a parte de demo interativa)

- **URL:** https://www.loom.com
- **Pricing:** https://www.loom.com/pricing
- **Desktop App:** https://www.loom.com/download
- **Chrome Extension:** https://www.loom.com/products/chrome-screen-recorder
- **Mobile:** https://www.loom.com/products/ios-screen-recorder
- **Security:** https://www.loom.com/security
- **Enterprise:** https://www.loom.com/enterprise
- **Pertencente à:** Atlassian (desde 2023).
- **Marca-peso:** "400.000+ companies, millions of individuals".

## Modelo de negócio
SaaS B2B de **video messaging async**, não é uma plataforma de demo interativa no sentido clássico. **Inclui** um AI Workflow engine que transforma Loom em documentação estruturada (SOPs, Jira tickets). **40M+ usuários**.

### Planos (USD)
- Starter Free, Business, Business + AI, Enterprise (preço sob consulta).
- Recursos: SSO, SCIM, custom retention, AI workflows, transcription (50+ idiomas), captions automáticas.

## Identidade visual (IDE)
- Logo roxo (purple) "Loom" com bolha arredondada.
- Site com tom friendly-human (não corporativo frio), simulando "messages from people you trust".
- Personagens ilustrados (Jai, Katie Burke, Erica Goodell, etc).

## Funcionalidades — limitadas ao escopo demo

### 1. Captura (passiva, não interativa)
- **Screen recording** (4K, HD) — grava a tela, com câmera.
- Camera bubble customizável (formatos, filtros, backgrounds).
- "Ultra-sharp 4k HD video, record custom areas".

### 2. Edição
- Trim/stitch.
- Background replacement.
- Text, arrows, box overlays.

### 3. Sharing
- Link curto, embed.
- Reactions (emoji), comments, tasks.
- CTAs in-video.
- Transcrição e captions automáticas em **50+ idiomas**.

### 4. **AI Workflows** (recurso importante)
- Loom AI **transforma vídeo em documento** (SOP / Jira tickets / docs).
- Em parceria com Atlassian: integração nativa Jira, Confluence, Trello.
- Synthesia-like real-time transcripts.

### 5. Enterprise
- SSO SAML, SCIM, custom data retention, privacy settings.

## Diferenciais vs Supademo
- **Distribuição massiva** — o Loom link é tão comum que prospects esperam recebê-lo (vantagem de rede).
- **Transcrição automática** (captions) em 50+ idiomas — ótimo para acessibilidade.
- **AI → doc workflow** — transforma o vídeo em SOP, Jira, doc, sem precisar re-gravar.
- **Atlassian-native integration** forte.
- Player rápido e leve (low friction to share).

## Stack detectável
- App: Next.js (`/_next/image?...`, getStaticProps paths).
- Assets: CDN Sanity (`cdn.sanity.io/images/pvn35iyy/...`) — **CMS = Sanity**.
- Backend: coletânea de serviços Atlassian + serviços próprios de processamento de vídeo.
- Desktop app: Electron + Chromium.

## Pontos fracos / reclamações
- **Vídeos são passivos** — viewer não clica, só assiste. Supademo e Storylane posicionam isso como fraqueza ("Passive screen recordings vs interactive").
- Edição é limitada comparada a Camtasia/Descript.
- Preços grandes para time (>500 Looms é caro).
- Quando o produto capturado muda, **o vídeo fica obsoleto** — sem source-of-truth visual.
- Sem simulação de clique, branching ou demo hubs.

## Demos públicas
- https://www.loom.com/use-case/sales
- https://www.loom.com/use-case/customer-support
- 400.000 companies; counts HubSpot, Lacoste, MetaLab, Atlassian, Tesla, Volvo, Goldman Sachs, Asana, Wayfair, Walmart, Gap, Nordstrom, Disney, Ticketmaster.
