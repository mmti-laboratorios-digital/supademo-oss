# TEMPLATE-05 — Reactivation (Free user parado 30+ dias)

> **Quando usar:** Free user que parou de usar a plataforma por 30+ dias (sem login, sem criar/publicar demo).
> **Objetivo:** reativar com **gatilho emocional** ("sua demo ainda está lá") + case de uso fresco.
> **Janela:** D30, D60, D90 — 3 tentativas antes de parar.

---

## Variáveis comuns

| Variável | Exemplo |
|---|---|
| `{{nome}}` | "Pedro" |
| `{{workspace_slug}}` | slug do workspace |
| `{{ultima_atividade}}` | "você criou uma demo de login há 32 dias" / "você publicou '{{nome_demo}}' há 60 dias" |
| `{{link_demo_ainda_lá}}` | link público `/d/[slug]` da demo existente |
| `{{link_dashboard}}` | `app.easydemo.io/app/{{workspace_slug}}` |
| `{{case_dor}}` | dor mais comum em PMMs BR parado |
| `{{cupom}}` | cupom reativação |

---

## Identificar a "âncora emocional"

| Situação detectada | Âncora a usar |
|---|---|
| Usuário **criou** demo mas **não publicou** | "Sua demo tá quase pronta — falta 1 clique pra publicar" |
| Usuário **publicou** demo mas **não abriu** o link | "Sua demo {{nome_demo}} ainda tá no ar. Viu as métricas?" |
| Usuário **não criou** nenhuma demo | "Lembra quando você começou a usar o EasyDemo? Posso te ajudar a terminar." |

---

## Email #1 — D30 (reativação inicial)

### Subject

> `{{nome}}, sua demo no EasyDemo ainda está lá`

### Body (≤ 200 palavras)

> Oi {{nome}},
>
> Faz um tempo que você não entra no EasyDemo — {{ultima_atividade}}.
>
> Só passando pra dizer: **sua demo continua no ar**. Ninguém deletou nada.
>
> [Ver demo publicada]({{link_demo_ainda_lá}})
>
> **{{case_dor}}**
>
> Mas talvez você esteja atolado e a demo interativa seja exatamente o que falta pra destravar. Como o {{case_similar}}: a {{empresa_case}} {{resultado_case}} usando demo interativa — talvez seja hora de voltar.
>
> **Pra te ajudar a voltar:**
>
> - 📹 [Vídeo: como capturar uma demo em 5 min]({{link_video}})
> - 📖 [Docs: 3 truques que destravam conversão]({{link_docs}})
>
> Se quiser conversar sobre o que travou, me responde esse email. Eu respondo em < 24h.
>
> —
> **Ana · EasyDemo**

---

## Email #2 — D60 (segunda tentativa, com cupom)

### Subject

> `{{nome}}, 30% off no Pro se você quiser voltar`

### Body (≤ 180 palavras)

> Oi {{nome}},
>
> 60 dias desde a última vez que você abriu o EasyDemo.
>
> **Não vou fazer drama** — talvez o EasyDemo não seja pra você. Tudo bem.
>
> Mas se um dia quiser voltar, fiz um cupom exclusivo: **`VOLTEI30`** — 30% off no primeiro mês do **Pro** (R$ 49 → R$ 34).
>
> → [Reativar Pro]({{link_checkout_pro}}?cupom=VOLTEI30)
>
> **Ah, e sua demo antiga** (link abaixo) ainda tá no ar, contabilizando views. Se quiser embedar no seu site de novo, tá tudo lá.
>
> → [Ver demo antiga]({{link_demo_ainda_lá}})
>
> Se mudou de ideia sobre por que parou, me conta — a gente evolui o produto baseado em feedback real.
>
> —
> **Ana · EasyDemo**
>
> PS: O Pro agora tem **AI inclusa** (geração de texto + TTS pt-BR) desde outubro. Talvez seja a hora.

---

## Email #3 — D90 (última tentativa)

### Subject

> `Última mensagem: posso remover sua conta?`

### Body (≤ 150 palavras)

> Oi {{nome}},
>
> Faz 90 dias desde seu último acesso. Vou parar de mandar emails.
>
> **Mas antes**, queria perguntar:
>
> 1. **Você ainda quer manter a conta?** Se sim, responde "manter" e eu pauso a reativação por 6 meses.
> 2. **Posso deletar sua conta?** Se sim, responde "deletar" e seus dados saem em 15 dias (LGPD art. 18, VI).
>
> **Se for um "não obrigado, tchau"**, sem ressentimentos — você sempre pode voltar e criar uma conta nova em 5 minutos.
>
> —
> **Ana · EasyDemo**
>
> PS: Sua demo antiga continua no ar até você decidir.

---

## Cadência completa

```
Última atividade detectada
  │
  ├─ D+30 ─→ Email #1 ("sua demo ainda tá lá")
  │
  ├─ D+60 ─→ Email #2 ("30% off se quiser voltar")
  │
  ├─ D+90 ─→ Email #3 ("posso remover sua conta?")
  │
  └─ D+90+ ─→ (silêncio; opt-out automático de reativação)
                │
                └─ (se respondeu "manter") → tag `paused_reactivation_6m`
                └─ (se respondeu "deletar") → fluxo DSR LGPD art. 18
```

---

## A/B tests sugeridos

| Variante | Métrica |
|---|---|
| Email #1 com link da demo vs só texto | Click-through |
| Email #2 com cupom vs sem cupom | Reactivation rate |
| Email #3 com pergunta binária vs "tchau" definitivo | Reply rate |

---

## Compliance LGPD

> Email #3 (última tentativa) **inclui explicitamente** a opção de deleção de conta via DSR (LGPD art. 18, VI).
>
> Se usuário responde "deletar": acionar fluxo DSR em < 15 dias (`research/tech/lgpd-recording.md` §4).

---

## Métricas-alvo

| Métrica | Meta |
|---|---|
| Open rate | ≥ 40% |
| Click-through | ≥ 10% |
| Reativação (login ou nova demo) | ≥ 5% |
| Upgrade para Pro após reativação | ≥ 1% |
| Cancelamento via email #3 | ≤ 30% |

---

## Casos especiais

### Usuário **deletou a conta antes do D90**
- **Não enviar** emails de reativação.
- Tag `account_deleted` em < 24h.

### Usuário **já é Pro/Business** (parou de usar)
- Sequência diferente (`TEMPLATE-04-billing-failed` para retenção de receita).
- Email D30: "Sua assinatura Pro continua ativa, mas você não usa há 30 dias. Posso ajudar?"

### Usuário **pediu opt-out explícito**
- Respeitar imediatamente. Tag `unsubscribed_all`.

---

## Referências internas

- ICPs: `marketing/ICP-PERSONAS.md`
- Cases pra mencionar: `marketing/CASE-STUDIES/`
- DSR endpoint: `research/tech/lgpd-recording.md` §4
- Tom de voz: `marketing/BRAND.md` §1