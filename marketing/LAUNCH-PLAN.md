# Plano de Lançamento Público — DemoBR

> **Data:** 2026-10-18.
> **Premissa:** MVP pronto em 24 semanas (RFC §0); 2 semanas finais reservadas para launch.
> **Janela de lançamento sugerida:** **terça-feira** (Supademo USA, Notion, Linear — Tuesday dominates B2B SaaS launches).

---

## 0. TL;DR

| Fase | Datas relativas | Foco | Meta |
|---|---|---|---|
| **Semana -2** | T-14 → T-7 | Preparação | Landing + 3 demos + press kit prontos |
| **Semana -1** | T-7 → T-0 | Soft launch | Chrome Web Store submitted, 10 PMMs contatados |
| **Semana 0** | T-0 (terça) | Launch público | Product Hunt live, email blast, LinkedIn, YouTube live |
| **Semana 1–4** | T+7 → T+30 | Sustain | 1 webinar/sem, 3 blog posts, 5 compare pages, 2 guest posts, afiliados |

**Meta final W4:** 1.000 signups Free, 30 paid (Pro + Business), R$ 10k MRR (consistente com `research/pricing/SYNTHESIS.md` §7).

---

## 1. Semana -2 (T-14 a T-7) — Preparação

> Toda a infra precisa estar pronta 7 dias antes do launch. Foco: ativo e qualidade, não campanha.

### 1.1 Lista de tarefas (owner + due)

| # | Tarefa | Owner | Done by | Aceitação |
|---|---|---|---|---|
| 1 | Landing page `/` finalizada | Front-end | T-9 | Lighthouse ≥ 95, LCP < 2.5s, copy aprovada |
| 2 | Pricing `/pricing` finalizada | Front-end | T-9 | 3 tiers, FAQ schema, links Asaas/Stripe prontos |
| 3 | `/para/*` (5 landing verticais) publicadas | Front-end | T-9 | 5 páginas indexáveis com CTA |
| 4 | Blog com 5 pilares publicados | Front-end + SEO writer | T-9 | Ver `SEO-PILLAR-PAGES.md` §1 |
| 5 | 3 demos de exemplo (cases próprios) gravadas | Founder + PMM | T-9 | 1 demo SaaS B2B, 1 demo imobiliária, 1 demo edtech |
| 6 | `/d/[slug]` player funcionando + OG image | Front-end | T-7 | Compartilhar em LinkedIn preview OK |
| 7 | Signup Free funcionando (Clerk + magic link) | Back-end | T-7 | E-mail de boas-vindas em PT-BR |
| 8 | Checkout Asaas (PIX + boleto + cartão) testado | Back-end | T-7 | Pagamento R$ 49 Pro end-to-end |
| 9 | Email transacional Resend configurado | Back-end | T-7 | 5 templates: welcome, upgrade, billing failed, reactivation, magic link |
| 10 | LGPD banner + DSR endpoint ativo | Back-end + jurídico | T-7 | `/api/dsr?token=` retorna leads em JSON |
| 11 | Press kit pronto (logo, screenshots, manifesto) | Marketing | T-7 | ZIP com 4 PNG + 1 SVG + README.md |
| 12 | Manifesto (1 página "Por que DemoBR") publicado em `/sobre` | Founder | T-7 | Texto revisado, link compartilhável |
| 13 | Extensão Chrome MV3 enviada para Chrome Web Store review | Founder | T-7 | Status "In review" |
| 14 | Domínio `demobr.com.br` registrado e DNS apontado | Founder | T-9 | Cloudflare proxy ativo |
| 15 | Sentry + Better Stack capturando erros | Back-end | T-7 | Alerta configurado |
| 16 | Uptime Kuma monitorando `app.demobr.com.br` | DevOps | T-7 | Alerta para down > 5min |
| 17 | Google Analytics 4 + Plausible configurados | Marketing | T-7 | Pageviews + signup events fluindo |
| 18 | Google Search Console verificado | Marketing | T-7 | Sitemap enviado |

### 1.2 Demos de exemplo (entregável crítico)

| Demo | Persona | Steps | CTA final | Por que |
|---|---|---|---|---|
| **Demo 1 — SaaS B2B** | PMM | 8–10 | WhatsApp + Calendly | Case principal, ICP mais comum |
| **Demo 2 — Imobiliária** | Corretor | 6–8 | WhatsApp com texto "Tour presencial?" | Vertical com tração (Maestro ABM) |
| **Demo 3 — Edtech** | CS / Treinamento | 7–9 | "Acessar curso" + WhatsApp dúvida | Mostra uso não-vendas (onboarding) |

> Cada demo: gravada com a própria extensão DemoBR; **dogfooding obrigatório** antes do launch.

### 1.3 Press kit (estrutura)

```
press-kit/
├── README.md                          # como citar DemoBR em matéria
├── logo/
│   ├── demobr-logo-light.svg         # fundo claro
│   ├── demobr-logo-dark.svg          # fundo escuro
│   ├── demobr-symbol-light.svg       # só símbolo
│   └── demobr-symbol-dark.svg
├── screenshots/
│   ├── home-hero.png                 # 1200×800
│   ├── editor.png                    # 1200×800
│   ├── player-public.png             # 800×500
│   ├── analytics.png                 # 1200×800
│   └── chrome-extension.png          # 800×500
├── manifesto.pdf                     # 1 página
└── brand-guidelines-summary.pdf      # 2 páginas
```

### 1.4 Manifesto (1 página)

> **Por que DemoBR existe.**
>
> Sou PMM. Gastava 4h por demo. Lead chegava frio na call. Não fechava. Procurava uma ferramenta pra gravar minha demo uma vez e enviar pra sempre. Supademo, Storylane, Navattic — todos cobravam em dólar, sem Pix, sem suporte em PT-BR, sem NF-e. GuiaFlow era genial, mas exigia minha chave de OpenAI.
>
> Então construí **DemoBR**.
>
> - **R$ 49/mês Pro**, não $50. PIX/boleto/cartão. NF-e emitida.
> - **Suporte em PT-BR**, e-mails em PT-BR, DPO em PT-BR.
> - **LGPD by design**, não como PDF no rodapé.
> - **IA inclusa**, sem precisar de chave de API.
> - **CRM BR nativo**: HubSpot BR, RD Station, Kommo. Lead vira contato sem Zapier.
>
> Quem usa DemoBR economiza 4h por semana e fecha 30% mais leads. Esse é o único número que importa.
>
> — Founder, DemoBR

---

## 2. Semana -1 (T-7 a T-0) — Soft launch

> Aquecer a base antes do dia D. Foco: validação e ajustes finais.

### 2.1 Checklist

| # | Tarefa | When | Status |
|---|---|---|---|
| 1 | Chrome Web Store status = "Published" | T-5 | ⚠️ Bloqueador crítico |
| 2 | Edge Web Store submitted | T-4 | Nice-to-have |
| 3 | LinkedIn post "build in public #1" (lançamento iminente) | T-6 | Founder |
| 4 | BetaList submit (https://betalist.com/submit) | T-5 | Marketing |
| 5 | Product Hunt "Coming Soon" page live | T-5 | Marketing |
| 6 | Contatar 10 PMMs BR (LinkedIn + email) pra early access | T-7 a T-0 | Founder |
| 7 | 5 usuários Free ativos usando a ferramenta | T-3 | Founder |
| 8 | Coletar 3 quotes/feedbacks reais (não fictícios) | T-2 | Founder |
| 9 | Email de waitlist enviado: "Falta 1 semana" | T-3 | Marketing |
| 10 | Slack/Discord RevOps BR + Customer Success Network BR — postar teaser | T-4 | Founder |
| 11 | Calendar aberto pra "Founder office hours" (calls de 15min com PMMs) | T-7 | Founder |

### 2.2 Script de contato early access (10 PMMs)

> **LinkedIn DM:**
> "Oi [nome], vi seu post sobre [tema específico]. Estou lançando o DemoBR semana que vem — ferramenta de demo interativa BR-first, com PIX e LGPD. Posso te dar acesso antecipado Pro por 3 meses em troca de feedback honesto? 30 min de call na semana do lançamento. Topa?"
>
> **E-mail:**
> Subject: Demo interativa pra PMM BR, com PIX (acesso antecipado)
> Body: 200 palavras explicando problema (4h/demo), solução (DemoBR), oferta (3 meses Pro grátis), CTA (15min de call).

### 2.3 Métricas de validação (T-1)

- [ ] ≥ 5 signups Free ativos
- [ ] ≥ 3 demos publicadas por usuários reais
- [ ] ≥ 1 feedback estruturado de PMM
- [ ] NPS "would you recommend" ≥ 7/10
- [ ] Chrome Web Store rating ≥ 4.5

> Se algum item falhar, **atrasar launch em 1 semana**. Não lançar com bug grave.

---

## 3. Semana 0 (T-0) — Launch público

> **Terça-feira, 9h PST (= 12h Brasília, = 16h CEST).** Janela padrão de SaaS B2B EUA → captura audiência global + brasileira.

### 3.1 Cronograma hora-a-hora (T-0 = terça-feira)

| Hora (BRT) | Ação | Owner |
|---|---|---|
| 06:00 | Tweet agendado: "DemoBR is live on @ProductHunt today 🚀" | Founder |
| 07:00 | LinkedIn post: "3 anos construindo isso. DemoBR no ar." | Founder |
| 08:00 | Responder DMs/LinkedIn (resposta em < 1h) | Founder |
| 09:00 | **PH live** — postar link, responder comentários por 8h seguidas | Founder |
| 09:30 | Email waitlist: "DemoBR is live. 30% off no Pro até sexta." | Marketing |
| 10:00 | Post no Instagram + story | Marketing |
| 11:00 | Slack/Discord RevOps BR: "Estamos ao vivo" | Founder |
| 12:00 | **YouTube Live** (60 min): demo completa + Q&A | Founder |
| 13:00 | LinkedIn post #2: "Primeira hora: 200 signups" (ou número real) | Founder |
| 14:00 | Email #2 waitlist: "Bônus early adopter: 3 meses Pro" | Marketing |
| 15:00 | Slack Customer Success Network BR | Founder |
| 16:00 | LinkedIn post #3: case real do primeiro usuário (se houver) | Founder |
| 17:00 | Tweet com screenshot de uso | Founder |
| 18:00 | Fim do monitoramento ativo. Resposta assíncrona depois. | — |

### 3.2 Product Hunt — checklist do post

- **Nome:** "DemoBR"
- **Tagline:** "Demos interativas com PIX, NF-e e LGPD. Em PT-BR."
- **Thumbnail:** 240×240, símbolo ▶ + "DemoBR", fundo `--brand-primary`
- **Descrição:** 280 chars, link para `/`, GIF de 10s gravado em `app.demobr.com.br/d/exemplo-saas-b2b`
- **Topics:** SaaS, Marketing, Sales, Product Demos
- **Makers:** Founder (perfil público + LinkedIn link)
- **Comentário do maker:** "Why I built this" — 3 parágrafos, história pessoal, link manifesto
- **Reservas:** Coletar via `calendly.com/demobr/launch` antes do T-0
- **Meta:** Top 10 do dia (realista para SaaS B2B pequeno). Top 5 seria ótimo; top 1 improvável.

### 3.3 Posts de launch (copy completa)

#### LinkedIn post #1 (terça-feira 07:00 BRT)

> 3 anos construindo isso.
>
> Hoje é o dia.
>
> **DemoBR** está no ar.
>
> Demos interativas do seu produto. Em PT-BR. Com PIX. Com NF-e. Com LGPD by design.
>
> Por que isso importa:
> • 4h por demo é dinheiro jogado fora.
> • Lead não qualificado não merece call.
> • Demo boa é demo que o lead **assiste sozinho**.
>
> O que entregamos:
> • R$ 49/mês Pro (não $50).
> • 3 demos grátis pro sempre.
> • Extensão Chrome pra capturar em 5 minutos.
> • WhatsApp como CTA final.
> • LGPD com DSR endpoint de verdade.
>
> Estamos ao vivo no Product Hunt hoje:
> 👉 [link PH]
>
> Comenta aqui o que você mais odeia em demo de SaaS. Vou ler tudo.

#### E-mail waitlist (09:30 BRT)

> Subject: DemoBR está no ar — 30% off no Pro até sexta
>
> Oi [nome],
>
> Você entrou na lista porque pediu pra ser avisado quando o DemoBR fosse lançado.
>
> Hoje é o dia.
>
> → [link PH]
> → [link app.demobr.com.br]
>
> **Bônus early adopter:** 30% off no Pro vitalício se você assinar até sexta-feira. Use o cupom `EARLY30` no checkout.
>
> Em 5 minutos você cria sua primeira demo interativa, sem cartão.
>
> — Founder, DemoBR

#### YouTube Live — roteiro (60 min)

| Min | Bloco |
|---|---|
| 0–5 | Abertura: o problema (4h/demo) |
| 5–15 | Demo ao vivo: criar uma demo SaaS B2B do zero |
| 15–25 | Demo #2: imobiliária |
| 25–35 | Demo #3: edtech |
| 35–50 | Q&A (chat ao vivo) |
| 50–55 | Como assinar Pro (cupom `EARLY30`) |
| 55–60 | Encerramento + agradecimento |

---

## 4. Semana 1–4 (T+7 a T+30) — Sustain

> O launch é só o começo. Sustain é onde a tração se constrói.

### 4.1 Cadência semanal (recorrente)

| Dia | Ação | Owner |
|---|---|---|
| **Segunda** | LinkedIn post "build in public" (founder) | Founder |
| **Terça** | Blog post publicado (long-tail SEO) | SEO writer |
| **Quarta** | Compare page publicada (1 por semana até completar 5) | SEO writer |
| **Quinta** | **Webinar semanal** (case real de cliente + demo) | Founder |
| **Sexta** | Twitter thread + LinkedIn comment strategy | Founder |
| **Sábado** | (descanso) | — |
| **Domingo** | (descanso) | — |

### 4.2 Webinars (4 semanas)

| Semana | Tema | Convidado |
|---|---|---|
| W1 | "Como SaaS B2B PME reduziu ciclo de venda em 30% com demo interativa" | PMM de cliente real (ou fictício até ter) |
| W2 | "Onboarding assíncrono: 500 alunos em horas, não semanas" | Head de CS de edtech BR |
| W3 | "Tour de apartamento à distância: case de imobiliária" | Corretor / diretor de imob |
| W4 | "PRD to demo: como PM usa DemoBR antes da call" | PM de SaaS mid-market |

### 4.3 Compare pages (5 totais)

| Quando | Página |
|---|---|
| W1 | `/comparar/demobr-vs-supademo` |
| W1 | `/comparar/demobr-vs-guiaflow` |
| W2 | `/comparar/demobr-vs-navattic` |
| W3 | `/comparar/demobr-vs-arcade` |
| W4 | `/comparar/demobr-vs-storylane` |

### 4.4 Blog posts (3 totais)

| Quando | Title |
|---|---|
| W2 | "5 exemplos reais de demo interativa que converteram 30%+ de leads" |
| W3 | "LGPD para demos interativas: o guia completo" |
| W4 | "WhatsApp como CTA final da demo (case + implementação)" |

### 4.5 Guest posts (2)

- **SaaS Break** (https://saasbreak.com.br) — artigo "Por que todo PMM brasileiro precisa de demo interativa em 2027"
- **Gralio** (https://gralio.com.br) — comparativo "DemoBR vs Supademo: quem ganha no Brasil?"

> Templates: `TEMPLATES/` (reutilizar voice/tom de `BRAND.md`).

### 4.6 Programa de afiliados

> Ajustado de 30% (RFC §6.3) para **20% recorrente por 12 meses** (alinhado com brief da missão).

#### Estrutura

| Item | Detalhe |
|---|---|
| **Comissão** | **20% recorrente por 12 meses** sobre o MRR do afiliado |
| **Mínimo de saque** | R$ 50 (Pix) |
| **Ferramenta** | **Hotmart** (afiliados PLR) OU **Lemon Squeezy** (SaaS-friendly) — avaliar tradeoff no launch |
| **Dashboard** | Link `/afiliados` no app, com clicks, signups, MRR gerado |
| **Materiais** | Banners 728×90 / 300×250, copy de email, link rastreado |
| **Recrutamento** | Convidar 50 microinfluenciadores SaaS BR (1k–10k followers LinkedIn) |
| **Restrições** | Proibido em Google Ads em "demo interativa" (CPC alto); permitido em LinkedIn/Twitter/orgânico |

#### Páginas

- `/afiliados` — landing pública, copy baseada em `TEMPLATE-06`
- `/app/[workspace]/afiliados` — dashboard privado
- `/termos-afiliados` — ToS em PT-BR (jurídico validar)

---

## 5. Métricas de sucesso por fase

| Fase | Métrica | Meta |
|---|---|---|
| **W1 (Sustain)** | Signups Free totais | 200 |
| | PH upvotes | ≥ 100 |
| | Email blast open rate | ≥ 35% |
| | YouTube Live viewers | ≥ 100 |
| **W4 (Sustain fim)** | Signups Free totais | 1.000 |
| | Paid (Pro + Business) | 30 |
| | MRR | R$ 10.000 |
| | NPS | ≥ 40 |
| | CHR Free→Paid | ≥ 2% |
| **M3** | Signups Free totais | 3.000 |
| | Paid | 100 |
| | MRR | R$ 35.000 |
| | Afiliados ativos | ≥ 10 |

> **Caveat:** metas alinhadas com `research/pricing/SYNTHESIS.md` §7. Ajustar após feedback W4.

---

## 6. Riscos & mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| **Chrome Web Store rejeitar extensão** | Média | Alta | Plano B: editor de demo manual (paste screenshot); submeter em paralelo com privacy policy + screenshots 1280×800 |
| **Product Hunt trair (sem upvotes)** | Média | Média | Ter 30 "hunters" (amigos/contatos) prontos pra upvotar na hora H |
| **Servidor cair no dia do launch** | Baixa | Alta | Hetzner snapshot T-1; Uptime Kuma alerta < 5min; backup VPS pré-aquecido |
| **LGPD questionado por matéria** | Baixa | Alta | DPO público + link `/lgpd` com política completa + casos TOTVS/Omie como referência |
| **Getdemo reagir (post sobre DemoBR)** | Média | Baixa | Responder com fatos (preço, PIX, LGPD); não entrar em flame war |
| **Bug crítico na extensão após launch** | Média | Alta | Update rápido via Chrome Web Store (revisão < 24h); backup FAQ |

---

## 7. Plano de contingência

### Se Chrome Web Store rejeitar antes do T-0
1. Adiar launch em 1 semana.
2. Submeter com privacy policy + screenshots profissionais + vídeo demo.
3. Lançar BetaList como backup de awareness.

### Se PH trair (< 50 upvotes em 8h)
1. Manter página ativa (não deletar).
2. Focar tráfego em LinkedIn + email blast.
3. PH orgânico continua ajudando SEO mesmo sem upvote alto.

### Se erro crítico em produção
1. Rollback via `git revert` + redeploy.
2. Banner "Estamos com instabilidade" em `app.demobr.com.br`.
3. Comunicado em LinkedIn + email waitlist.

---

## 8. Pós-launch (M2 em diante, fora deste plano)

- **M2:** Expandir compare pages em PT-BR para 10+; SEO agressivo (guest posts).
- **M3:** Programa de afiliados público; parceria com 2 microinfluenciadores.
- **M4:** Ads Google PT-BR (R$ 500/mês iniciais, ajustar CAC).
- **M6:** Considerar expansão LATAM (es-ES primeiro).

---

## 9. Limitações declaradas

- Datas específicas (terça-feira X de mês Y) **dependem do ritmo de desenvolvimento real** (MVP em 24 semanas segundo RFC §0).
- Métricas-alvo são **metas internas**, não contratadas. Ajustar após feedback W4.
- Hotmart vs Lemon Squeezy para afiliados **depende de custos atuais e conversão BR**; avaliar antes do lançamento do programa.
- Guest posts em SaaS Break e Gralio são **hipóteses** (sites existem em Out/2026); verificar se aceitam投稿 pago ou se é troca de conteúdo.

---

## 10. Referências internas

- Cadência de conteúdo: `marketing/CONTENT-CALENDAR.md`
- Posts/templates: `marketing/SOCIAL-MEDIA-KIT.md`, `marketing/TEMPLATES/`
- Casos para usar em webinars: `marketing/CASE-STUDIES/`
- Personas-alvo: `marketing/ICP-PERSONAS.md`
- Métricas/KPIs: `marketing/METRICS-DASHBOARD.md`
- Pricing tiers: `research/pricing/SYNTHESIS.md` §3
- Canais priorizados: `research/pricing/gtm-channels.md` §A