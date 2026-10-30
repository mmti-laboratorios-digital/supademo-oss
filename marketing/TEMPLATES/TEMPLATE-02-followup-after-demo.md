# TEMPLATE-02 — Follow-up After Demo (Call realizada)

> **Quando usar:** após call de demo de 15–30min com lead qualificado. ICP Personas 1, 2 ou 3 (ver `ICP-PERSONAS.md`).
> **Objetivo:** recap + case similar + próximo passo claro.
> **Timing:** enviar em até **2h após a call** (janela de atenção).
> **Personalização obrigatória:** recap específico do que foi discutido na call.

---

## Variáveis de personalização

| Variável | Exemplo |
|---|---|
| `{{nome}}` | "Pedro" |
| `{{empresa}}` | "Linneo" |
| `{{data_call}}` | "terça-feira 15/10" |
| `{{problema_discutido}}` | "ciclo de venda de 45 dias" / "CS sobrecarregada" / "fechar primeiros 10 clientes" |
| `{{feature_interesse}}` | "embed no site" / "branching" / "WhatsApp CTA" |
| `{{case_similar}}` | "SaaS X reduziu onboarding em 60%" |
| `{{link_demo_criada}}` | link da demo que foi mostrada na call |
| `{{proximo_passo}}` | "trial Pro 14 dias" / "send proposta comercial" / "call técnica" |
| `{{cta_link}}` | link do passo concreto |

---

## Email — Follow-up pós-demo (≤ 250 palavras)

### Subject (escolher 1)

| # | Subject |
|---|---|
| 1 | `Recap da call de {{data_call}} + próximos passo` |
| 2 | `{{nome}}, dei uma olhada no {{empresa}} — segue resumo` |
| 3 | `Como {{case_similar}} — faz sentido pra {{empresa}}?` |

### Body

> **Subject:** `{{subject_escolhido}}`
>
> Oi {{nome}},
>
> Obrigada pela call de {{data_call}}. Foi ótimo entender o {{problema_discutido}} da {{empresa}} e como EasyDemo pode ajudar.
>
> **Recap do que conversamos:**
>
> 1. Você mencionou que {{problema_discutido}} é a dor principal — bate com o que {{feature_interesse}} resolve.
> 2. Mostrei a demo rodando na sua URL (link abaixo) — dá pra embedar diretamente em `{{url_atual}}`.
> 3. Combinamos que o {{proximo_passo}} faz sentido como próximo passo.
>
> **Link da demo que criamos na call:** [{{link_demo_criada}}]
>
> ---
>
> **Case similar que pode ajudar:**
>
> {{case_similar}}. A {{empresa_case}} enfrentava dor parecida com a sua — {{métrica_resultado}}. Adaptaram em {{tempo_adaptacao}} usando EasyDemo Pro (R$ 49/mês).
>
> Quer ver a demo do case? Link: [{{link_case}}]
>
> ---
>
> **Próximo passo:** {{proximo_passo}}.
>
> → [{{cta_texto}}]({{cta_link}})
>
> Se tiver qualquer dúvida, responde esse email — eu mesma respondo.
>
> — Ana
> EasyDemo

---

## Variações por ICP

### Persona 1 — PMM de SaaS B2B PME

> **Problema_discutido típico:** "ciclo de venda de 30–60 dias" / "AE perde 50% do tempo em demo de lead frio"
> **Case similar:** SaaS X (fintech) reduziu tempo de onboarding em 60%
> **Feature_interesse:** branching condicional / Account Reveal
> **Próximo passo:** "trial Pro 14 dias sem cartão"

### Persona 2 — Head de CX/CS

> **Problema_discutido típico:** "clientes não completam onboarding" / "CS sobrecarregada com 5 calls por onboard"
> **Case similar:** Edtech Z treinou 500 novos usuários sem reuniões
> **Feature_interesse:** onboarding in-app + checklist
> **Próximo passo:** "pilot de 30 dias com 3 clientes"

### Persona 3 — Founder solo early-stage

> **Problema_discutido típico:** "gastar tempo em call com lead não-qualificado" / "não tenho designer pra fazer demo"
> **Case similar:** SaaS Y fechou primeiros 10 clientes com demo interativa
> **Feature_interesse:** captura fácil com extensão + WhatsApp CTA
> **Próximo passo:** "start com Free (3 demos) e upgrade pra Pro quando bater limite"

---

## Cadência pós-demo

| Dia | Ação | Conteúdo |
|---|---|---|
| **T+0** (mesmo dia) | Email principal | Este template |
| **T+2** | LinkedIn DM | "Mandei o recap por email — conseguiu ver?" |
| **T+5** | Email #2 (se não respondeu) | "Tem alguma dúvida sobre o trial?" |
| **T+10** | Email #3 | "Posso ajudar a montar sua primeira demo?" |
| **T+14** | Email #4 (breakup) | "Se mudar de ideia, tô aqui 🚀" |

---

## Anexos / links úteis a incluir

- Link da demo criada na call (sempre)
- 1 case similar (com métrica real ou fictícia — ver `CASE-STUDIES/`)
- Link do trial Pro: `https://app.easydemo.io/signup?ref=call-{{nome}}`
- Link da central de ajuda: `https://docs.easydemo.io`
- Calendly pra agendar onboarding assistido: `https://calendly.com/easydemo/onboarding`

---

## Compliance

> ⚠️ **LGPD:** este email é continuação de consentimento já dado (lead agendou a call). Manter opt-out visível no footer.

---

## Referências internas

- ICPs: `marketing/ICP-PERSONAS.md`
- Cases reais/fictícios: `marketing/CASE-STUDIES/`
- Trial Pro: `marketing/TEMPLATES/TEMPLATE-03-welcome-email.md`
- Tom de voz: `marketing/BRAND.md` §1