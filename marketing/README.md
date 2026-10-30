# Marketing — EasyDemo

> Pacote de marketing + growth + brand para o produto brasileiro de demos interativas (EasyDemo).
> **Data:** 2026-10-18.
> **Origem:** grounded em `research/` (demos, pricing, tech) + `docs/RFC-Brazilian-Supademo.md` + `specs/mvp-scope.json`.

---

## Estrutura

```
marketing/
├── README.md                      ← este arquivo
├── BRAND.md                       ← Brand guidelines (voz, tom, cores, logo)
├── SEO-PILLAR-PAGES.md            ← Estratégia SEO PT-BR completa
├── LAUNCH-PLAN.md                 ← Plano de launch -2 a +4 semanas
├── CONTENT-CALENDAR.md            ← Calendário editorial 12 semanas
├── METRICS-DASHBOARD.md           ← KPIs para 90 dias
├── ICP-PERSONAS.md                ← 3 personas + ICP macro
├── COMPETITIVE-BATTLECARDS.md     ← 4 battlecards vs concorrentes
├── SOCIAL-MEDIA-KIT.md            ← 10 LinkedIn + 10 Twitter + 10 IG + 5 Reels
├── TEMPLATES/
│   ├── TEMPLATE-01-cold-email-outbound.md
│   ├── TEMPLATE-02-followup-after-demo.md
│   ├── TEMPLATE-03-welcome-email.md         (5-email sequence)
│   ├── TEMPLATE-04-billing-failed.md        (PIX/boleto falhou)
│   ├── TEMPLATE-05-reactivation.md          (Free user 30+ dias parado)
│   └── TEMPLATE-06-affiliate-program.md
└── CASE-STUDIES/
    ├── CASE-01-fintech-onboarding-60pct.md
    ├── CASE-02-agencia-propostas-3x.md
    └── CASE-03-edtech-500-alunos.md
```

---

## 10 entregáveis (resumo)

| # | Arquivo | Conteúdo principal | Status |
|---|---|---|---|
| 1 | `BRAND.md` | Nome, tagline, voz, paleta (8 cores), tipografia (Inter + Sora), logo conceitual | ✅ |
| 2 | `SEO-PILLAR-PAGES.md` | 5 pilares + 5 compare + 15 blog posts + 5 LP verticais | ✅ |
| 3 | `LAUNCH-PLAN.md` | Semanas -2 → 0 → +4 com checklists detalhadas | ✅ |
| 4 | `CONTENT-CALENDAR.md` | 12 semanas com 1 pilar + 1 compare + 2 blog + 1 LinkedIn + 1 demo | ✅ |
| 5 | `TEMPLATES/` (6) | Cold email, follow-up, welcome (5 emails), billing failed, reactivation, affiliate | ✅ |
| 6 | `SOCIAL-MEDIA-KIT.md` | 10 LinkedIn + 10 Twitter + 10 IG + 5 Reels scripts | ✅ |
| 7 | `CASE-STUDIES/` (3) | Fintech -60% onboarding; Agência 3x fechamentos; Edtech 500 alunos | ✅ |
| 8 | `ICP-PERSONAS.md` | 3 personas (Pedro PMM, Carla CS, Rafael founder) + anti-personas | ✅ |
| 9 | `METRICS-DASHBOARD.md` | 5 grupos de KPIs + NSM + limiares de alerta | ✅ |
| 10 | `COMPETITIVE-BATTLECARDS.md` | vs Supademo, Navattic, GuiaFlow, Getdemo + objection handling | ✅ |

---

## Decisões-chave tomadas

| Tópico | Decisão | Fonte |
|---|---|---|
| **Nome do produto** | **EasyDemo** (mantido, conforme README + RFC + mvp-scope) | alinhar com pesquisa |
| **Tagline PT-BR** | "Demos interativas pra vender mais, sem uma reunião a mais." | alinhado com ICPs + market |
| **Tagline EN** | "Interactive demos, Brazilian-style." | curto + claro |
| **Pricing** | Free + Pro R$ 49 + Business R$ 199 (manter RFC) | `research/pricing/SYNTHESIS.md` §3 |
| **Paleta** | Primary `#2B6CB0` (azul Atlântico) + Secondary `#38B2AC` + Accent `#ED8936` | diferenciação vs Getdemo (#4d65ff) e GuiaFlow (#1A4D6D) |
| **Tipografia** | Inter (UI) + Sora (marketing) + JetBrains Mono (código) | gratuitas, OFL |
| **Afiliados** | **20% recorrente por 12 meses** (alinhado com brief da missão) | `LAUNCH-PLAN.md` §4.6 |
| **ICP primário** | PMM SaaS B2B PME (Pedro) | alinhado com `gtm-channels.md` §A |
| **Concorrentes prioritários** | Supademo, Navattic, GuiaFlow, Getdemo | `research/demos/SUMMARY.md` |
| **Canal #1** | SEO orgânico + Chrome Web Store | `research/pricing/gtm-channels.md` §A |

---

## Como usar este pacote

### Para o founder / GTM
- **Antes do launch:** ler `LAUNCH-PLAN.md` + `BRAND.md` + `CONTENT-CALENDAR.md` (ordem de execução).
- **No dia do launch:** usar `SOCIAL-MEDIA-KIT.md` (LinkedIn L1, Email de E1 da welcome sequence).
- **Pós-launch:** seguir `METRICS-DASHBOARD.md` para revisar semanalmente.

### Para SDR / sales
- **Cold outbound:** `TEMPLATES/TEMPLATE-01-cold-email-outbound.md` + `ICP-PERSONAS.md` Persona 1.
- **Pós-demo:** `TEMPLATES/TEMPLATE-02-followup-after-demo.md` + `CASE-STUDIES/`.

### Para marketing / SEO writer
- **Produção de conteúdo:** `SEO-PILLAR-PAGES.md` + `CONTENT-CALENDAR.md` (cada semana tem entregáveis definidos).
- **Materiais de afiliado:** `TEMPLATES/TEMPLATE-06-affiliate-program.md`.

### Para CS / CX
- **Onboarding Free → Pro:** `TEMPLATES/TEMPLATE-03-welcome-email.md` (5-email sequence automatizada).
- **Billing failed:** `TEMPLATES/TEMPLATE-04-billing-failed.md`.
- **Reativação Free user:** `TEMPLATES/TEMPLATE-05-reactivation.md`.

### Para growth / product
- **Definição de KPIs:** `METRICS-DASHBOARD.md`.
- **Posicionamento competitivo:** `COMPETITIVE-BATTLECARDS.md`.

---

## Limitações do pacote (declaradas em cada arquivo)

- **Casos de estudo** (`CASE-STUDIES/`): **fictícios**, baseados em padrões observados no mercado. Substituir por cases reais antes de usar em mídia paga.
- **Personas** (`ICP-PERSONAS.md`): **inferidas**, não validadas com entrevistas. Validar com 3–5 entrevistas por persona antes do launch.
- **Volumes de busca** (SEO): **estimados** (proxy; sem Google Keyword Planner direto). Validar com GKP após publicação.
- **Métricas** (METRICS-DASHBOARD): **projeções**, não dados históricos.
- **Pricing de Navattic e Getdemo**: **estimado** (sites não publicam).
- **Cores da paleta**: **escolha semântica**, não calibrada com ferramenta WCAG. Validar contraste AA antes do launch.
- **Tone of voice**: **validado só internamente**; pode precisar ajuste após feedback externo.

---

## Próximos passos sugeridos (fora deste pacote)

1. **Designer:** produzir SVG final do logo + 8 PNGs em light/dark + 4 screenshots reais do produto.
2. **Validação de pricing** com 5–10 PMMs brasileiros (`research/pricing/SYNTHESIS.md` §7).
3. **Validação de personas** com 3–5 entrevistas por ICP.
4. **Auditoria WCAG** das cores (contrast checker).
5. **Hotmart vs Lemon Squeezy** para programa de afiliados (decidir antes do launch do programa).
6. **Contratar freelancer SEO** (R$ 1.500/mês, conforme RFC §6.7) para escalar produção de blog posts.
7. **Setup de analytics** (Plausible + GA4 + Postgres events + Metabase) antes do T-1.
8. **Press kit** produção (`LAUNCH-PLAN.md` §1.3) com designer + jornalista.

---

## Referências cruzadas (research + specs + RFC)

| Documento | Onde |
|---|---|
| **RFC completa** | `../docs/RFC-Brazilian-Supademo.md` |
| **MVP scope JSON** | `../specs/mvp-scope.json` |
| **Research (demos + pricing + tech)** | `../research/` |
| **Concorrentes (deep dive)** | `../research/demos/[concorrente].md` |
| **Pricing synthesis** | `../research/pricing/SYNTHESIS.md` |
| **LGPD recording** | `../research/tech/lgpd-recording.md` |
| **G2 channels (PT-BR)** | `../research/pricing/gtm-channels.md` |

---

**Pacote criado em:** 2026-10-18
**Versão:** 1.0
**Owner:** equipe de marketing EasyDemo
**Próxima revisão:** após feedback W4 (1 mês de launch)