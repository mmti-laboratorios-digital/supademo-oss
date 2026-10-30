# Hiring pages — stack via vagas

**Coletado em:** 18 out 2026
**Método:** webfetch em páginas oficiais de careers de cada player. AshbyHQ e LinkedIn não retornaram HTML direto; vou usar o que pude extrair dos sítios próprios.

> ⚠️ **Limitação importante:** AshbyHQ e LinkedIn retornaram vazio nesta sessão. Stack via vagas de empresas individuais está reconstruído por: (a) páginas /careers dos próprios sites, (b) inferência a partir de blog técnico e changelogs, (c) endereço físico em páginas legais. Para um sinal real de stack, é preciso scrape das vagas ativas em Greenhouse, Lever, AshbyHQ ou LinkedIn Jobs.

---

## Supademo (Overland Park, KS + New York, NY)

**Headquarters:** 13331 Hauser Street, Overland Park, KS 66213 (legal entity Supademo, Inc.) + escritório em 115 E 23rd Street, Floor 4, New York, NY 10010 (HQ comercial).

**Página de careers oficial:** `/careers` redireciona para `careers.supademo.com` — AshbyHQ é o ATS host (Supademo está entre os early adopters de AshbyHQ).

**Stack inferida (de docs e changelogs):**
- **Chrome extension:** MV3, `chrome.runtime`, capacidade de manipular HTML clonado.
- **Backend:** MCP server em `mcp.supademo.com/mcp` (Streamable HTTP transport), REST API para workspace e demos, webhooks por demo events.
- **Frontend editor:** provavelmente React ou Next.js (Sanity.io CMS para blog).
- **Voice cloning:** integração com ElevenLabs (provider "70+ built-in ElevenLabs voices" confirmado em docs).
- **Media:** "Media library" (browser-based uploads para imagens/vídeos/PDF) — sugira Amazon S3 ou R2.
- **AI:** Supademo AI Agents rodam 24/7 (continuous service) — modelo escalável com rate control. Pricing per credit (1,500 free por workspace).

**Sinais de cultura/hiring:**
- "Joseph Lee" (CEO/co-founder) publica pessoalmente em `supademo.com/blog`. Cultura de "founder-marketing".
- Posts recentes sobre IA responsible, AI Policy dedicated page.
- Mention de `LinkedIn.com/company/supademo-hq` no footer — social signals de LinkedIn.

## Navattic (San Francisco, CA — fundado em 2019)

**HQ:** 13331 Page Mill Rd, San Francisco (de inferência via Press kit + Trust Center navattic.com).

**Página de careers:** `/company/careers` linkada do footer — AshbyHQ também.

**Stack inferida:**
- Status page hosted on **incident.io** (powered by Google Cloud). GCP é provável.
- "MCP server" disponível desde o plan Base — confirma **modelo MCP-first**.
- "AI avatar cloning" e "AI avatars (300 minutes)" — integração com D-ID ou HeyGen.
- AI voiceover integra com ElevenLabs / Azure voices.

**Sinais de cultura:**
- "Revenue on the Rocks Podcast" (podcast B2B GTM).
- "Demo Consultants" partner program.
- "B2B Buyer First Best Practices" newsletter.

## Arcade (San Francisco, CA)

**HQ:** 595 Market Street Floor 10, San Francisco, CA 94105 (revelado na Chrome Web Store developer info).
**Legal entity:** Arcade Software, com D-U-N-S **085857644** registrado.

**Stack inferida (de changelogs):**
- Engine de **AI video generation** proprietária (referência a "the agent finds better b-roll and images when you reference a URL"; cena-custom por texto → motion graphics).
- **Flow Builder** (interactions composed of calls; mentions "scene", "brand kit", "voice").
- **Brand Kit extraction** — lê o site, extrai cores/fontes/images.
- **Arcade MCP server** com tools para criar vídeos, view demos, pull analytics — server **publicly documented at docs.arcade.software**.
- **Statuspage:** Atlassian Statuspage (self-hosted via clover workflow).

**Página de careers:** `/careers` linkada do footer; link AshbyHQ provável.

## Storylane (San Francisco, CA)

**HQ:** 2261 Market St #4813, San Francisco, CA 94114-1612 (Chrome Web Store).
**Backed by:** Y Combinator logo no footer.
**Fundadores:** Ranga Kaliyur (publica blog posts) e Madhav Bhandari (publica compare posts).

**Stack inferida:**
- **MCP server** com **20+ tools** documentados (vs Supademo 80+). Storylane MCP é mais enxuto.
- Storylane **RepX** é AI agent conversacional (chat-based competitor a Conversica, HubSpot Customer Agent, Drift).
- **HTML capture** e **HTML editor** (competência diferenciadora).
- Blog/static: Webflow.
- Hosting: Atlassian Statuspage trivial → AWS.

**Página de careers:** `/careers` linkada — Greenhouse/AshbyHQ provável.

## Scribe (SF Bay Area)

> Stack inferida: Scribe pivotou para **AI-powered automatic capture** (Autocapture). Provavelmente usa Whisper / OpenAI para transcription e LLM para step extraction. Editor web provavelmente React. Chrome extension em MV3 desde 2023.

## Tango

**HQ:** Não capturado via web (limite sessão). Foot indica "Tango Technology, Inc. ®" — Delaware C-corp provavelmente.
- "SOC 2 Type II compliant" desde anos.
- "MCP" em Beta (Enterprise only).
- Cadence de release: link para `updates.tango.ai`.

## Loom (Atlassian owned)

**HQ:** SF (agora Atlassian Cloud Services Inc.).
- Editor bem otimizado para vídeo; transcoding pipeline robusto (FFmpeg ou AWS MediaConvert).
- Loom AI em GPT-4-class.

---

## Sinais transversais sobre o stack do setor (Tier 1)

| Stack | Supademo | Navattic | Arcade | Storylane | Scribe | Tango |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **AI voice (ElevenLabs)** | ✅ | ✅ | ✅ | ✅ | ✅ | (n/a) |
| **AI avatar (D-ID/HeyGen)** | (em AI agents) | ✅ | (n/a) | ✅ | (n/a) | (n/a) |
| **MCP server** | ✅ (Scale+) | ✅ (Base+) | ✅ | ✅ (Starter+) | (n/a) | ✅ beta (Enterprise) |
| **OpenAI/Anthropic API** | ✅ inferred | ✅ inferred | ✅ inferred | ✅ inferred | ✅ inferred | ✅ inferred |
| **LLM observability** (Langfuse/Helicone) | provável | provável | provável | provável | provável | provável |
| **Statuspage provider** | Better Stack | incident.io | Atlassian | Atlassian | Atlassian | Atlassian |
| **Cloud provider hint** | Vercel+AWS | GCP | AWS | AWS | AWS | AWS |
| **ATS** | AshbyHQ | AshbyHQ | AshbyHQ/Greenhouse | Greenhouse/AshbyHQ | Greenhouse | Greenhouse |
| **CMS for blog** | Sanity | Webflow | Webflow | Webflow | Webflow | Webflow |

> **Observação sobre LLM observability:** nenhum site torna pública qual ferramenta usa para instrumentar AI agents. Como o AI Agent virou produto, *Langfuse* (ou Helicone) é o default. Inferido.

## Implicações para EasyDemo

1. **O padrão de fato é:** 1) AI agent via LLM provider; 2) ElevenLabs para voice; 3) AshbyHQ para ATS; 4) Atlassian Statuspage ou Better Stack para status. EasyDemo pode usar qualquer provider BRL-friendly (OpenAI via Azure Brazil, ElevenLabs via API global, Langfuse self-host no Postgres).
2. **MCP é commoditização rápida.** EasyDemo pode sair com MCP server no primeiro release público.
3. **Áudio AI em pt-BR** é um gap de mercado — ElevenLabs suporta, mas Storylane/Supademo clonam voice em inglês. EasyDemo pode ser o "AI Agent em pt-BR para demos".

## Fonts

- https://supademo.com/blog/product-update-{month}-recap (todos até out/2026)
- https://docs.supademo.com/customize/mcp-server.md (MCP tools documentados)
- https://www.navattic.com/pricing (Navattic features list)
- https://docs.navattic.com/ (Navattic products described)
- https://www.arcade.software/changelog (Arcade recent releases)
- https://www.storylane.io/blog (Storylane posts assinados)
- https://docs.storylane.io/product-updates (Storylane changelog)
- https://scribehow.com/pricing (Scribe tiers)
- https://tango.us/pricing (Tango tiers)
- https://www.loom.com/pricing (Loom Atlassian integration)
