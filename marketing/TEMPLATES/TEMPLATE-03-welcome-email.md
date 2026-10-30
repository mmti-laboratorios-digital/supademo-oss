# TEMPLATE-03 — Welcome Email Sequence (5 emails)

> **Quando usar:** após signup no plano Free.
> **Objetivo:** levar o Free user até publicar a primeira demo (evento `first_demo_published`).
> **Janela:** D0 (cadastro) → D14 (upgrade Pro).
> **Persona principal:** PMM de SaaS B2B PME (Persona 1), com adaptações para Personas 2 e 3.

---

## Visão geral da sequência

| Email | Dia | Objetivo | Métrica de sucesso |
|---|---|---|---|
| **E1** | D0 (cadastro) | Dar boas-vindas + próximo passo claro | ≥ 60% open, ≥ 30% click CTA |
| **E2** | D1 (24h depois) | Ensinar setup mínimo | ≥ 40% open, ≥ 15% cria workspace |
| **E3** | D3 | Ajudar a capturar 1º demo | ≥ 35% open, ≥ 8% publica demo |
| **E4** | D7 | Mostrar que a demo tá no ar + dicas de share | ≥ 30% open, ≥ 5% embed em site |
| **E5** | D14 | Upgrade Pro com incentivo | ≥ 25% open, ≥ 2% upgrade Pro |

---

## Variáveis comuns

| Variável | Exemplo |
|---|---|
| `{{nome}}` | "Pedro" |
| `{{empresa}}` | inferido via domínio de email OU perguntado no signup |
| `{{workspace_slug}}` | slug do workspace criado |
| `{{link_demo_publicada}}` | URL `/d/[slug]` da demo publicada |
| `{{link_extensao_chrome}}` | link Chrome Web Store |
| `{{cupom}}` | cupom dinâmico (ex: `PRO50` para 50% off primeiro mês) |

---

## E1 — D0 (cadastro) — "Bem-vindo, seu próximo passo"

### Subject

> `Bem-vindo ao EasyDemo, {{nome}} — crie sua 1ª demo em 5 min`

### Body (≤ 180 palavras)

> Oi {{nome}},
>
> Bem-vindo ao **EasyDemo** — a ferramenta de demos interativas brasileira, com PIX, NF-e e LGPD by design.
>
> Você está no **plano Free**: até **3 demos publicadas** e **50 visualizações/mês** grátis pro sempre, sem cartão.
>
> **Próximo passo (5 min):**
>
> 1. **Instale a extensão Chrome** → [{{link_extensao_chrome}}]
> 2. **Capture seu SaaS** clicando uma vez por tela
> 3. **Publique com 1 clique** e compartilhe no WhatsApp
>
> 📹 **Vídeo de 60s mostrando o passo a passo:** [link vídeo]
>
> Qualquer dúvida, responde esse email — eu mesma respondo (Ana, founder do EasyDemo).
>
> —
> **EasyDemo**
> Demos interativas em PT-BR · PIX · LGPD
>
> PS: Tem trial de 14 dias do **Pro por R$ 49/mês** (com 50% off no 1º mês). Use o cupom `BEMVINDO50` no checkout.

---

## E2 — D1 (24h depois) — "Setup mínimo: extensão + workspace"

### Trigger

> Enviado **somente se** o usuário NÃO criou 1 demo ainda (evento `first_demo_started` ausente).

### Subject

> `{{nome}}, sua primeira demo está a 1 clique de distância`

### Body (≤ 200 palavras)

> Oi {{nome}},
>
> Vi que você se cadastrou ontem mas ainda não criou sua primeira demo. Tudo bem — leva 5 minutos, prometo.
>
> **3 passos, 1 tela cada:**
>
> 1. **Workspace já está criado** → seu link: `app.easydemo.io/app/{{workspace_slug}}`
>
> 2. **Instale a extensão Chrome** (se ainda não instalou):
>    → [{{link_extensao_chrome}}]
>
> 3. **Capture seu SaaS:**
>    → Abra seu SaaS numa aba
>    → Clique no ícone da extensão
>    → "Iniciar captura"
>    → Clique nos elementos que importam
>    → "Parar" quando terminar
>    → Vai pro editor automaticamente
>
> **Está com problema técnico?** Me responde esse email com print do erro que resolvo em < 4h.
>
> —
> **Ana · EasyDemo**
>
> PS: tem 10 PMMs brasileiros publicando demos por dia — você está a 1 capture de distância.

---

## E3 — D3 — "Capture sua primeira demo AGORA"

### Trigger

> Enviado **somente se** ainda não publicou a primeira demo.

### Subject

> `{{nome}}, faz 3 dias — quer que eu te ajude a capturar?`

### Body (≤ 220 palavras)

> Oi {{nome}},
>
> Faz 3 dias desde seu signup e ainda não vi nenhuma demo publicada no seu workspace.
>
> Sem pressão — mas se tiver algum bloqueio técnico, me conta. Em **15 minutos de call**, eu mesma te ajudo a:
>
> 1. Capturar a primeira demo do seu SaaS
> 2. Configurar hotspot + CTA final
> 3. Publicar com link compartilhável
>
> → [Agendar 15 min comigo]({{calendly_link}})
>
> **Se preferir seguir sozinho**, aqui vai o caminho mais curto:
>
> - 📹 [Vídeo: como capturar em 5 minutos]({{link_video_captura}})
> - 📖 [Docs: primeiros passos]({{link_docs_primeiros_passos}})
>
> **Ah, e uma dica que economiza 30 min:** separe ANTES os 5–8 cliques mais importantes da demo. Tipo: login → tela principal → feature #1 → CTA. Não capturem 30 cliques — é o erro #1 que vejo.
>
> Topa a call de 15 min?
>
> —
> **Ana · EasyDemo**

---

## E4 — D7 — "Sua demo tá no ar (ou como colocar)"

### Trigger (ramificação)

| Situação | Conteúdo |
|---|---|
| **Já publicou demo** | Email de parabéns + dicas de share |
| **Ainda não publicou** | Email de "última tentativa" + template de demo de exemplo |

### Subject (caso A — publicou)

> `{{nome}}, sua demo tá no ar 🚀`

> Oi {{nome}},
>
> Parabéns — vi que você publicou **{{nome_demo}}** há {{dias_desde_publicacao}}. 🎉
>
> Agora o próximo passo é **fazer ela ser vista**:
>
> 1. **Compartilhe no WhatsApp** dos seus 10 contatos mais quentes
> 2. **Embed no seu site** ([como fazer]({{link_doc_embed}}))
> 3. **Adicione ao LinkedIn** ([como adicionar como feature]({{link_doc_linkedin}}))
>
> **Dica avançada:** a primeira métrica a olhar é **completion rate** (no dashboard `app.easydemo.io/app/{{workspace_slug}}/analytics`). Meta: ≥ 40%. Se estiver < 30%, revise os hotspots.
>
> —
> **Ana · EasyDemo**

### Subject (caso B — não publicou)

> `{{nome}}, posso te mostrar uma demo de exemplo?`

> Oi {{nome}},
>
> Faz uma semana e você ainda não publicou uma demo. Sem julgamento — mas talvez esteja faltando um ponto de partida.
>
> Aqui vai: **use essa demo como template**, copie a estrutura e adapte pro seu SaaS:
>
> → [Demo de exemplo SaaS B2B]({{link_exemplo_saas_b2b}})
>
> 8 passos, hotspot, CTA WhatsApp. Funciona como "cheat sheet".
>
> —
> **Ana · EasyDemo**

---

## E5 — D14 — "Trial Pro: cupom pra você"

### Trigger

> Enviado sempre (independente de ter demo publicada ou não) — é a última "tentativa" de upgrade.

### Subject

> `{{nome}}, 50% off no Pro pra fechar seu primeiro trial`

### Body (≤ 220 palavras)

> Oi {{nome}},
>
> Faz 14 dias que você criou sua conta no EasyDemo.
>
> **Se você publicou pelo menos 1 demo:** parabéns, você está entre os 10% que conseguem. O próximo nível é desbloquear o **Pro** (R$ 49/mês):
>
> - Demos ilimitadas (sem limite de 3)
> - 5.000 visualizações/mês (vs 50 do Free)
> - Formulário de leads com consentimento LGPD
> - WhatsApp CTA customizado
> - AI inclusa: geração de texto + TTS pt-BR
>
> **Cupom exclusivo pra você:** `BEMVINDO50` — 50% off no primeiro mês Pro. Só até domingo.
>
> → [Assinar Pro]({{link_checkout_pro}}?cupom=BEMVINDO50)
>
> **Se ainda não publicou:** provavelmente o Free não é pra você agora. Sem stress — pode usar a ferramenta quando precisar.
>
> Se quiser conversar sobre o que tá faltando pra fazer sentido, me responde esse email.
>
> —
> **Ana · EasyDemo**
>
> PS: Aceita PIX, boleto, cartão e emite NF-e.

---

## Cadência completa visualizada

```
D0         D1         D3         D7         D14
│          │          │          │          │
E1         E2         E3         E4         E5
Bem-vindo  Setup      Captura    No ar?     Upgrade Pro
```

---

## A/B tests sugeridos

| Variante | Métrica |
|---|---|
| E3 com CTA calendly vs CTA docs | Click-through |
| E4 caso A: parabéns vs "dicas de share" | Open + Reply |
| E5 com cupom vs sem cupom | Upgrade rate |
| E1 com PS sobre cupom vs sem PS | Open rate (pode cair) |

---

## Métricas-alvo da sequência (12 semanas)

| Métrica | Meta |
|---|---|
| Open rate médio | ≥ 45% |
| Click-through médio | ≥ 18% |
| Free → publica 1 demo | ≥ 10% (de todos que abrem E1) |
| Free → upgrade Pro em 14 dias | ≥ 2% (alinhado com CVR freemium→paid BR 2–5%, fonte `gtm-channels.md` §B) |

---

## Compliance LGPD

> Cada email inclui **link de unsubscribe** (LGPD art. 18, IV — revogação de consentimento). Opt-out processado em < 24h.
>
> **Não enviar** se usuário já upgrade pra Pro (passa pra sequência de upgrade).
>
> **Não enviar** se usuário deletou conta (evento `account_deleted`).

---

## Referências internas

- Pricing Pro: `research/pricing/SYNTHESIS.md` §3
- ICPs: `marketing/ICP-PERSONAS.md`
- Demos de exemplo: `marketing/LAUNCH-PLAN.md` §1.2
- Cases pra mencionar: `marketing/CASE-STUDIES/`
- Tom de voz: `marketing/BRAND.md` §1