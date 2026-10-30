# TEMPLATE-01 — Cold Email Outbound (SDR prospectando PMMs)

> **Quando usar:** prospect outbound ativo de PMMs de SaaS B2B BR (ICP Persona 1 — `ICP-PERSONAS.md`).
> **Cadência:** 3 emails (T+0, T+3, T+7) + 1 LinkedIn DM no meio.
> **Personalização obrigatória:** campo `{{nome}}`, `{{empresa}}`, `{{linha_pessoal}}`.
> **Tom:** direto, útil, zero fluff corporativo. Ver `BRAND.md` §1.
> **Métricas-alvo:** Open ≥ 50%, Reply ≥ 12%, Positive reply ≥ 4% (bench SaaS B2B outbound 2026).

---

## Variáveis de personalização (preencher antes de enviar)

| Variável | Fonte | Exemplo |
|---|---|---|
| `{{nome}}` | LinkedIn / assinatura de email | "Marina" |
| `{{empresa}}` | Site / LinkedIn | "Linneo" |
| `{{linha_pessoal}}` | Post recente no LinkedIn, podcast, ou tweet específico | "Vi seu post sobre reduzir ciclo de venda" |
| `{{case_relevante}}` | Case público do demoBR mais próximo do setor | "A SaaS X reduziu onboarding em 60% com demos interativas" |
| `{{calendly_link}}` | `https://calendly.com/demobr/15min` | — |
| `{{sender_nome}}` | Assinatura padrão | "Ana — DemoBR" |

---

## Email #1 — Cold inicial (T+0)

### Subject lines (escolher 1 por envio; A/B testar)

| # | Subject | Por que funciona |
|---|---|---|
| 1 | `{{nome}}, demo interativa por R$ 49/mês (não $50)` | Preço BR + comparativo implícito |
| 2 | `Como a {{empresa_concorrente}} reduziu ciclo de venda em 30%` | Curiosity + case study |
| 3 | `{{linha_pessoal}} — vi isso e lembrei de você` | Personalização alta, abre curiosidade |

### Body (≤ 200 palavras)

> **Subject:** `{{subject_escolhido}}`
>
> Oi {{nome}},
>
> {{linha_pessoal}}. Achei relevante porque é exatamente o problema que o DemoBR resolve: demos interativas que rodam sozinhas, sem o AE gastar 4h por call.
>
> Resumo do que faço (30 seg): ajudo PMMs de SaaS B2B BR a reduzir ciclo de venda em até 30% substituindo calls de discovery por demos que o lead assiste sozinho. Paga em PIX, NF-e em 24h, LGPD by design.
>
> Funciona assim:
> 1. Instala a extensão Chrome (5 min).
> 2. Captura seu SaaS clicando uma vez por tela.
> 3. Publica com slug customizado.
> 4. Embed no seu site ou envia no WhatsApp.
>
> Veja um exemplo: [link demo]
>
> **Case rápido:** {{case_relevante}}.
>
> Topa 15 min de call pra eu mostrar como ficaria a demo da {{empresa}}? Sem compromisso.
>
> → [Agendar aqui]({{calendly_link}})
>
> — Ana
> DemoBR · R$ 49/mês · PIX e NF-e

### Follow-up se não responder

- **Esperar 3 dias úteis.**
- Se visualizaram o email (tracking) e não responderam → Email #2 com ângulo diferente.
- Se não abriram → Email #2 sem tracking visível.

---

## Email #2 — Follow-up com novo ângulo (T+3)

### Subject (escolher 1)

| # | Subject |
|---|---|
| A | `{{nome}}, esqueci de mandar o link do case` |
| B | `Re: {{subject_email_1}}` (responder a si mesmo) |
| C | `{{nome}} — um vídeo de 60s que mostra o DemoBR` |

### Body (≤ 120 palavras)

> **Subject:** `{{subject_escolhido}}`
>
> Oi {{nome}} (de novo),
>
> Mandei email na {{data_email_1}} sobre demos interativas pra {{empresa}}. Sei que inbox é guerra — talvez tenha caído.
>
> Pra resumir em 60s: gravei um vídeo mostrando como um PMM captura uma demo em 5 minutos. Sem edição.
>
> → [Vídeo 60s]({{link_video}})
>
> Se fizer sentido, 15 min de call. Se não, sem stress — responda "não agora" e paro de mandar.
>
> — Ana
> DemoBR

### LinkedIn DM intermediário (entre email 1 e 2)

> Oi {{nome}}, te mandei um email sobre demos interativas que pode ser relevante pra {{empresa}}. Se preferir, posso mandar por aqui mesmo. 🙂

---

## Email #3 — Breakup email (T+7)

> Subject: `{{nome}}, vou parar de pertubar`

### Body (≤ 80 palavras)

> Oi {{nome}},
>
> Mandei 2 emails nas últimas 2 semanas sobre demos interativas que ajudariam a {{empresa}}. Não respondendo, vou assumir que não é prioridade agora — e tudo bem.
>
> Se um dia quiser testar (DemoBR Pro é R$ 49/mês, com trial de 14 dias sem cartão), a porta está aberta: app.easydemo.io.
>
> Sucesso com a {{empresa}} 🚀
>
> — Ana
> DemoBR

---

## Sequência completa (resumo)

| Dia | Canal | Conteúdo |
|---|---|---|
| **T+0** | Email | Subject A/B/C + body 200 palavras + CTA calendly |
| **T+2** | LinkedIn DM | Mensagem curta referenciando email |
| **T+3** | Email #2 | Ângulo novo: vídeo ou case |
| **T+7** | Email #3 | Breakup curto |
| **T+30** | (parar) | Reentrar na lista em 6 meses |

---

## Critérios de qualidade (não enviar se)

- ❌ Não tem linha pessoal real (zero "Espero que esteja bem!")
- ❌ Não sabe nada sobre a empresa-alvo
- ❌ Email pessoal > 250 palavras
- ❌ CTA não é claro (link errado, calendly quebrado)
- ❌ Mais de 1 link no email #1 (quebra entregabilidade)
- ❌ Anexos (aumenta bounce)

---

## Compliance LGPD

> ⚠️ **Cold email é regulado pelo LGPD** (art. 7º, IX — interesse legítimo). Para reduzir risco:
>
> 1. Garantir **legítimo interesse** claro (oferta B2B relevante para a função).
> 2. Sempre incluir **header de remetente** com entidade ("Ana, DemoBR") + unsubscribe link.
> 3. **Não comprar listas.** Construir manualmente via LinkedIn + site.
> 4. Em caso de opt-out ("não manda mais"), registrar e parar em < 24h.
> 5. Em B2B, o titular (PMM pessoa física) tem direito de revogação — honrar sempre.
>
> Referência: `research/tech/lgpd-recording.md` §4 (compliance em outreach).

---

## A/B testing sugerido (após 100 envios)

| Variante | O que testar | Métrica |
|---|---|---|
| Subject linha curta vs longa | "demo interativa R$ 49" vs "Como a X reduziu ciclo de venda em 30%" | Open rate |
| CTA no PS vs no meio | Posicionar link do Calendly | Click rate |
| Vídeo 60s vs só texto | Email #2 com Loom/YouTube link | Reply rate |
| Follow-up agressivo vs espaçado | 3 dias vs 7 dias entre emails | Reply rate |

---

## Referências internas

- ICP Persona 1 (PMM): `marketing/ICP-PERSONAS.md`
- Casos pra mencionar: `marketing/CASE-STUDIES/`
- Canais prioritários: `research/pricing/gtm-channels.md` §A.6
- Tom de voz: `marketing/BRAND.md` §1