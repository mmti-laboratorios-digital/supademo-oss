# Status Pages — uptime + incidentes Q3-Q4 2026

**Coletado em:** 18 out 2026
**Método:** webfetch nas páginas públicas de status dos principais concorrentes.

---

## Comparativo de hosts / infra hints

| Vendor | Status page | Provider | Region reported | Uptime 30d | Uptime 60d | Uptime 90d |
|---|---|---|---|---:|---:|---:|
| **Supademo** | status.supademo.com | **Better Stack** | "All services online" | 99.994% (app), 99.995% (embeds), 100% (video & SOP exports) | (idem) | (idem) |
| **Navattic** | status.navattic.com | **incident.io** (Google Cloud) | "Operational" | 100% em Demo playback, Desktop playback, Mobile playback, Previewing, Demo building, Capturing, Editing, Publishing, Analytics (3 componentes), Playbooks | (idem) | (idem) |
| **Arcade** | arcadehq.statuspage.io | **Atlassian Statuspage** (AWS infra?) | "All Systems Operational" | n/a | n/a | n/a (90d sem incidentes reportados) |
| **Loom** | loom.status.atlassian.com | **Atlassian Statuspage** (atrás de Atlassian Cloud) | "All Systems Operational" — Recording, Viewing, Authentication, Loom AI | n/a | n/a | n/a |

## Periodos sem incidentes reportados (out 2026)

- **Arcade:** sem incidentes desde (pelo menos) 4 out 2026 e 14 dias anteriores = **14+ dias sem incidente** ✅
- **Loom:** sem incidentes em 15 dias visíveis (4-18 out 2026) ✅
- **Supademo:** All services online ✅
- **Navattic:** Operational ✅

> Nota: esta "sem incidentes reportados" reflecte só o que foi público — degradações localizadas, não-detected pelo monitoring, não estão aqui.

## Detalhes por fornecedor

### Supademo (`status.supademo.com`) 🟢

- **Provider:** Better Stack (logo Better Stack no rodapé).
- **Componentes monitorados:**
  - Application (app.supademo.com) — 99.994% (30d)
  - Embeds (Embed Service) — 99.995% (30d)
  - Video Exports — 100% (30d)
  - SOP Exports — 100% (30d)
- **Sem incidents list visíveis na página principal**, mas existe `/incidents` link. Período "30 days ago / 60 days ago / 90 days ago" são botões de navegação mas não há incidente no tempo presente.
- **E-mail de contato:** engineering@supademo.com.

> **Infra hint (inferred):** Better Stack é popular em startups que usam **Vercel + Postgres + Cloudflare R2** para storage de assets. Combinado com ATS, isso sugere Supademo roda em **Vercel edge network** (embeds) + AWS ou Cloudflare para video rendering (perfect combo for that hit-per-month profile).

### Navattic (`status.navattic.com`) 🟢

- **Provider:** incident.io (powered by GCP).
- **Componentes em grupos:**
  - **Demo playback** (3: desktop, mobile, previewing) — 100%
  - **Demo building** (3: capturing, editing, publishing) — 100%
  - **Analytics** (3: viewing, collecting, ...) — 100%
  - **Playbooks** — 100%
- **Período reportado:** Jul 2026 - Oct 2026 — todos verdes.
- **E-mail:** docs.navattic.com (linkado para reporting).

> **Infra hint:** incident.io UI branding + GCP. Navattic roda provavelmente em **GCP**, com stack típico Node/TS (Postgres + Redis + GCS). 100% uptime em Q3 sinaliza infra madura.

### Arcade (`arcadehq.statuspage.io`) 🟢

- **Provider:** Atlassian Statuspage (similar a Loom, Sentry, etc.).
- **Componentes:**
  - Arcade Extension
  - Flow Builder
  - Arcade Viewer (Published Arcades)
  - Arcade Analytics
  - GIF & Video Export
- **Uptime history UI:** mostra "No downtime recorded on this day" para todo o histórico de outubro (4-18).
- **Status:** All Systems Operational.

> **Infra hint:** Combo típico de Atlassian Statuspage + Webflow. Equipa forte em product design → provavelmente **Vercel + React/Next.js + AWS S3**.

### Loom (`loom.status.atlassian.com`) 🟢

- **Provider:** Atlassian Statuspage (canônico; Atlassian-owned).
- **Componentes:**
  - Recording
  - Viewing
  - Authentication
  - Loom AI
- **Sem incidentes reportados em janela visível**.
- **Now part of Atlassian Cloud** — 99.95% SLA no Enterprise.

> **Infra hint:** Grande, complexo. Multi-region AWS com CloudFront + transcoding pipeline. Loom migrou muito pós-aquisição Atlassian (finalizado em fev/2026 segundo a research/ original).

---

## Implicações para DemoBR

1. **Todos os players passaram Q3-Q4 2026 sem grandes outages**. Indica que "infra reliability" não é um grande marketing advantage. **Subir 99.99% no Tier 1 é o mínimo.**
2. **Status page em si é PLG table-stakes** — ter `status.easydemo.io` no Better Stack (free tier) custa $0 e dá confiança.
3. **Maturity de status page = sinal de equipe de SRE.** Better Stack = small, Atlassian Statuspage = mid/late, incident.io = B2B-deep.
4. **Para DemoBR "tier 2" BRL-only**, a competitive advantage não será na infra pura. Será em **localização (pt-BR)** e **compliance (LGPD + Banco Central quando aplicável)**.

## Fonts

- https://status.supademo.com (capture 2026-10-18)
- https://status.navattic.com (capture 2026-10-18)
- https://arcadehq.statuspage.io (capture 2026-10-18)
- https://loom.status.atlassian.com (capture 2026-10-18)
