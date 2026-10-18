# Fluidz Demos (demos.fluidz.com.br)

- **URL:** https://demos.fluidz.com.br
- **Login:** https://demos.fluidz.com.br/login
- **Trial:** https://demos.fluidz.com.br/trial
- **Pricing:** https://demos.fluidz.com.br/pricing
- **Demo exemplo:** https://demos.fluidz.com.br/d/fluidz/exemplo
- **Ecossistema (empresa-mãe):** ZOPU (https://zopu.com.br) — "maior certificadora Bitrix24 do mundo". Também Fluidz Academy e ZOPU Market.
- **Marca:** Fluidz by ZOPU.

## Modelo de negócio
SaaS B2B brasileiro de **demos interativas para vender**, nichado na realidade de quem implementa CRM (i.e. **Bitrix24, Kommo, HubSpot, Pipedrive, RD Station, Omie**). Forte ligação com o ecossistema de implementação — ZOPU tem 450+ clientes, 9.500+ profissionais certificados, 96% retenção.

### Planos (BRL, em Real)
| Plano | Mensal | Anual (17% off) | Usuários | Demos | Views |
| --- | ---: | ---: | ---: | ---: | --- |
| **Essencial** | — | **R$1.264/ano** | até 3 | 20 ativas | 5.000/mês |
| **Profissional** | — | **R$3.950/ano** | ilimitados | ilimitadas | ilimitadas |

**Pagamento:** **Pix, Boleto ou Cartão (12x)** — primeira classe de pagamento BR entre os players.

7 dias de trial sem cartão.

## Identidade visual (IDE)
- Logo "Fluidz Demos" — black & white minimal. Tom direto, "vendedor fala com vendedor".
- Tipografia: "Fustat" (moderna geométrica) + sans padrão.
- Visual: hero com "Seu produto está escondido. E você está perdendo negócio" — punch line agressiva.
- Layout **Next.js + Tailwind** (`/_next/static/chunks/...`, classe `min-h-screen flex items-center justify-center bg-gray-50`).

## Funcionalidades

### 1. Captura
- **Upload de screenshots** (prints) — explícito no produto: "Tire prints das telas do seu produto e suba na plataforma".
- **Não cita captura HTML** — player screenshot-first.

### 2. Editor
- **Hotspots** (marcar áreas com cliques).
- **Resumos dos passos** em painel lateral.

### 3. Player
- Embed em landing pages, FAQ, onboarding.
- CTA final WhatsApp / link.

### 4. Captura de Leads
- Formulário opcional antes do demo (nome, email, empresa, telefone).
- CTA final WhatsApp (deep link).
- Webhook para CRMs (Bitrix24 nativo; Kommo, HubSpot, Pipedrive, RD, Omie "em breve").

### 5. Analytics (CORE)
- Dashboard com: Views, Completions, Taxa de Conclusão, CTA Clicado, Funil completo.
- Já no Essencial.

### 6. Compartilhamento
- Link, embed (iframe).

### 7. Suporte
- Suporte padrão no Essencial; prioritário no Profissional.
- Onboarding dedicado no Profissional.

## Diferenciais vs Supademo e GuiaFlow

- **Único player BR com Pix + Boleto + Cartão 12x explícito** desde a landing → essencial pro funil brasileiro mid-market.
- **Nicho CRM** (Bitrix24, Kommo, RD, Omie) — público claramente definido.
- **Trial 7 dias sem cartão** — barreira zero.
- **Analytics já no Essencial** — sem paywall pra métrica, ao contrário de Supademo (analytics no Scale $38/mo+).
- **Próprio do ecossistema de implementação** ZOPU — cases vindos de quem faz CRM há 10 anos.

## Stack detectável (view-source `login`)
- **Next.js** com Turbopack (`turbopack-764e258a38af35dd.js`).
- **Tailwind CSS**.
- Font: **Fustat** (moderna geométrica) bundled como `4f367e1622acbbdb-s.p.7c1afeb7.woff2`.
- **CSS variables** com theme switcher (`"fustat_dcdd81a3-module"`).
- Hidratação client-side (`BAILOUT_TO_CLIENT_SIDE_RENDERING`).

## Pontos fracos
- **Sem captura HTML** (só screenshot).
- Plano Essencial tem limites (20 demos ativas, 5.000 views/mês).
- Não menciona IA (text generation, voice).
- Sem Mobile, sem Sandbox, sem Branching.
- Sem MCP, sem API pública.
- Sem ferramentas para reuso (multiple boards, templates, hub).
- Marca conhecida só no nicho ZOPU/Bitrix24 — não é "mainstream" SaaS BR.

## Cases / clientes
- Não tem cases públicos na landing; **vende pelo ecossistema ZOPU** (450+ clientes, 96% retenção).
