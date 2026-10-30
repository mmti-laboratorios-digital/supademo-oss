# MVP Plan — EasyDemo

> **Status:** v1.0 — canônico para o MVP (prevalece sobre `docs/RFC-Brazilian-Supademo.md` §1 e sobre `mvp_phases` em `specs/mvp-scope.json`).
> **Data:** 2026-10-25.
> **Owner:** tech lead EasyDemo.
> **Audiência:** engenharia, produto, GTM, jurídico (LGPD).
> **Complementa:** `docs/RFC-Brazilian-Supademo.md` (arquitetura, stack e ADRs).
> **Par machine-readable:** `specs/mvp-scope.json`.
> **Idioma:** PT-BR (termos EN consagrados preservados no texto técnico).
>
> **Este documento foi feito para ser colado no Claude / Cursor / GPT de outro dev.**
> Cada fase tem arquivos exatos, acceptance criteria verificáveis e comandos de
> validação. Uma IA deve conseguir executar uma fase sem ler o resto do doc.

---

## 0. TL;DR

**EasyDemo** é uma plataforma de demos interativas de produto: o creator captura
telas pela extensão Chrome, monta um passo a passo clicável no editor, publica um
link público e o visitante interage, deixa o contato e cai no CTA.

O MVP entrega o **core inteiro** do produto: captura (extensão **e** upload manual),
editor, publicação, player público, embed, lead form, CTA, analytics e billing via
PIX. São **11 áreas de feature** — o mesmo core do Supademo Free+Scale, mais três
gaps de mercado brasileiro que o Supademo não cobre.

**Estimativa:** 22–26 dias de trabalho focalizado com 2–3 devs usando IA.
**Nada de feature inventada:** a regra é paridade com o core validado do Supademo
+ os gaps de mercado BR. Tudo que o Supademo não tem e não é gap BR sai do MVP.

**10 gates go/no-go** (G0, G0.5, G1, G1.5, G2, G3, G4, G5, G6, G7). Se um gate
falhar, a correção é objective e o gate mata a hipótese no ponto certo.

### 0.1 Protocolo de execução (para dev e para IA)

> **Se você é uma IA lendo este arquivo para executar uma fase:** siga os 5
> passos abaixo, na ordem. Não pule nenhum.

**Passo 1 — Encontre sua fase.** A fase atribuída vem no prompt (ex.: "minha fase
é F3"). Ela está na §8. Cada fase tem: objetivo, dependências, **arquivos a
ler antes**, arquivos a tocar, acceptance criteria, comandos de validação e
**o que não fazer**.

**Passo 2 — Leia as invariantes da §6.** São 5 regras que, se violadas, quebram
build, CI ou isolamento de dados. Custa 3 minutos e economiza horas.

**Passo 3 — Leia a sua fase inteira na §8**, antes de abrir qualquer arquivo de
código.

**Passo 4 — Leia os "arquivos a ler antes"** da sua fase. Esses são os padrões a
copiar, os contratos existentes e **o que já está pronto e deve ser
reaproveitado** em vez de reimplementado.

**Passo 5 — Edite só os "arquivos a tocar".** Depois rode os comandos de
validação. Se algum check falhar, **não avance** — conserte e revalide.

**Comandos de validação (rodam de vez):**

```bash
pnpm lint          # Biome — 209 arquivos
pnpm typecheck     # tsc nos 4 pacotes
pnpm test          # Vitest — 152 testes
```

> ⚠️ `pnpm test` precisa de `.env` carregado, senão 4 arquivos de teste de
> integração falham com `DATABASE_URL: Required` — **não é regressão**:
> `set -a; source .env; set +a`

**Antes de começar, confirme:**

- [ ] A fase depende só de fases já concluídas (campo "Depende de")
- [ ] Você leu a §6 (invariantes)
- [ ] Você leu os "arquivos a ler antes" da sua fase
- [ ] Você entendeu o que **não** fazer na fase

### 0.2 Protocolo de execução da IA (obrigatório)

> **Se você é uma IA executando este MVP:** esta seção é **obrigatória**. Ela
> define o contrato de execução. Não improvise, não pule etapas, não pare no
> meio. O objetivo é que qualquer dev — ou qualquer IA — consiga **retomar de
> onde a outra parou** sem ler o histórico do git.

#### Os 3 arquivos que você vai usar

| Arquivo | Papel | Quem escreve |
|---|---|---|
| **`docs/MVP-PLAN.md`** | **O quê** — o escopo, o porquê, os passos de cada fase | humano (raro). Não edite durante a execução |
| **`specs/mvp-tasks.json`** | **Onde estou** — checklist vivo, passo a passo, com status | **você, a cada passo** |
| **`docs/MVP-PROGRESS.md`** | **Por quê** — log narrativo, append-only, uma entrada por fase | você, ao fim da fase |

> `specs/mvp-tasks.json` é a **fonte da verdade do progresso**. O
> `MVP-PROGRESS.md` é o diário. O plano é o contrato. Não escreva progresso em
> lugar nenhum além desses três.

#### O loop — repita até a fase acabar

```
┌─ 1. ONDE EU ESTOU? ────────────────────────────────────────┐
│  pnpm scripts:mvp-status                                   │
│  → imprime a fase atual, o próximo passo e o que falta     │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 2. EXECUTAR O PRÓXIMO PASSO ──────────────────────────────┐
│  Um passo por vez. Confira o passo na §8 da fase.           │
│  Só edite os "Arquivos a tocar" daquela fase.               │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 3. MARCAR COMO CONCLUÍDO (obrigatório) ───────────────────┐
│  pnpm scripts:mvp-task <PASSO> done "<o que foi feito>"      │
│  → grava status, done_at, commit e note no passo, no         │
│    specs/mvp-tasks.json. Para passo travado: blocked.        │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 4. COMMIT ────────────────────────────────────────────────┐
│  Um commit por passo (ou por bloco coeso de passos).       │
│  Conventional Commits em PT-BR.                             │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 5. TEM MAIS PASSO? → VOLTA PRO PASSO 1 ──────────────────┐
│  A fase só termina quando TODOS os passos dela estão       │
│  "done" (ou "blocked", com a nota do que falta).           │
└──────────────────────────┬─────────────────────────────────┘
                           ▼ (só quando a fase acabou)
┌─ 6. VALIDAR ──────────────────────────────────────────────┐
│  pnpm lint && pnpm typecheck && pnpm test                  │
│  + os comandos da §8 da fase. Se falhar: corrija, reexecute.│
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 7. REGISTRAR (obrigatório) ──────────────────────────────┐
│  docs/MVP-PROGRESS.md → ADICIONE uma entrada no FINAL      │
│  (nunca edite entradas antigas). Marque a fase como "done" │
│  em specs/mvp-tasks.json.                                  │
└──────────────────────────┬─────────────────────────────────┘
                           ▼
┌─ 8. ABRIR O PR ───────────────────────────────────────────┐
│  1 fase = 1 branch = 1 PR. O gate da fase (§9) precisa     │
│  passar antes do merge na main.                            │
└────────────────────────────────────────────────────────────┘
```

#### As 4 regras que não se negociam

1. **Não pare no meio de um passo.** Um passo é a unidade de trabalho. Se um
   check falhar, **corrija e reexecute** — não reporte como concluído e não
   deixe pela metade.
2. **Não pare no meio de uma fase.** Se sobrou passo, ele é seu. A única
   exceção: o passo está **bloqueado por dependência externa** (DPO, CNPJ,
   conta de sandbox, aprovação da Chrome Web Store). Aí marque
   `"status": "blocked"` com uma nota que diga **o que falta e quem resolve**,
   **siga para o próximo passo** e registre a pendência no
   `docs/MVP-PROGRESS.md`.
3. **Só pare quando não sobrou nada.** Ou seja: todos os passos da fase estão
   `done`, ou os que faltam estão `blocked` **e** registrados. Antes de
   encerrar sua sessão, rode `pnpm scripts:mvp-status` e confirme que o
   checklist está consistente.
4. **Escreva o progresso, sempre.** Passou um passo → marque no
   `specs/mvp-tasks.json`. Terminou a fase → escreva no
   `docs/MVP-PROGRESS.md`. Se você fizer isso sempre, a próxima pessoa retoma
   em **minutos**, sem ler diff.

> **Por que o `note` importa:** "o que foi feito" em uma frase é o que permite
> a outro dev (ou outra IA) continuar sem contexto. Escreva o **efeito**, não o
> diff: `"commit": "a1b2c3d", "note": "slug duplicado volta 400 com mensagem em
> PT-BR"`. O diff está no git; o que falta no git é o **porquê**.

#### Como retomar (para quem chega depois)

```bash
pnpm scripts:mvp-status
```

Imprime a fase atual, o próximo passo, o gate, a branch e o placar das 12
fases. Use `--verbose` para ver todos os passos, inclusive os pendentes.

#### Como marcar um passo (o comando que você vai usar o tempo todo)

```bash
pnpm scripts:mvp-task <PASSO> done "<o que foi feito, em uma frase>"
pnpm scripts:mvp-task <PASSO> blocked "<o que falta e quem resolve>"
```

O `PASSO` é o id do checklist (`F3.2`) ou o número (`3.2`). O script grava
`status`, `done_at`, `commit` e `note` em `specs/mvp-tasks.json`, atualiza o
status da fase e aponta o `current` para o próximo passo. **Não edite o JSON
na mão** — o comando evita JSON corrompido e mantém o formato estável.

#### Referência rápida dos documentos:

| Preciso de… | Onde está |
|---|---|
| O que fazer, em que ordem, até quando | **este arquivo** (§8) |
| **Onde estou agora (passo a passo)** | **`specs/mvp-tasks.json`** + `pnpm scripts:mvp-status` |
| **O que já foi feito e por quê** | **`docs/MVP-PROGRESS.md`** — log append-only, uma entrada por fase |
| Por que o sistema é assim (stack, arquitetura, env vars) | `docs/RFC-Brazilian-Supademo.md` |
| Pricing e limites machine-readable | `specs/mvp-scope.json` |
| Evidência de mercado por trás das decisões | §2 deste arquivo |
| Decisões D1–D12 | §3 deste arquivo |

---

## 1. Contexto e produto

### 1.1 O que é

Plataforma SaaS B2B2C de demos interativas. O **creator** (empresa de software)
paga; o **viewer** (prospect ou cliente existente da empresa) não paga — views são
ilimitadas em todos os planos.

### 1.2 O loop de valor

```
capturar → editar → publicar → assistir → capturar lead → converter no CTA → cobrar
   ▲                                                                    │
   └──────────────────── embed gera novos viewers ─────────────────────┘
```

Cada elo tem que funcionar. Sem "publicar", não há demo. Sem "lead", não há
prova de valor. Sem "converter", não há receita. Sem "embed", não há distribuição.

### 1.3 Por que agora

- O mercado global está validado e grande: Supademo com **$4M ARR / 3.000
  pagantes / 30% EBITDA** com 15 pessoas (GetLatka, Ago/2026).
- O Brasil está mal servido: em "interactive demo" na Chrome Web Store, o único
  player BR (GuiaFlow) tem **36 installs e 0 reviews**. Nenhum player BR
  consolidado.
- O Supademo é caro e USD-only: Scale = US$50 (~R$275), sem PIX, sem NF-e, sem
  suporte BR, LGPD self-declared.

---

## 2. Evidências que embasam cada decisão

> Todas as fontes primárias foram acessadas em Out/2026. As limitações estão
> declaradas em §2.7 — leia antes de tratar qualquer número como verdade.

### 2.1 Supademo — métricas (fonte primária, verbatim)

Fonte: GetLatka, interview com Joseph Lee (co-founder), 4 Ago 2026.
20 dos 21 números foram dito em vídeo, com timestamp.

| Métrica | Valor | Momento |
|---|---|---|
| ARR | $4M | Ago/2026 |
| ARR anterior | $2M (2025) · $550K (2024) · $100K (2023) | idem |
| Clientes pagantes | 3.000 | Ago/2026 |
| Usuários free | 200.000 | Ago/2026 |
| EBITDA margin | 30% | Ago/2026 |
| Gross margin | 90% | Ago/2026 |
| Funcionários | 15 (7 engenheiros) | 2026 |
| Funding | $1M SAFE @ cap $6M, **nunca gasto** | 2023 |
| Maior cliente | **$40.000/ano** (seat-based, rolou na org toda) | Ago/2026 |
| Paid ads | **$500/mês** (só defender o nome "supademo") | Ago/2026 |
| Signups | 300–400/dia | Ago/2026 |
| Free→paid target | ~20% (*"world class... we're not there yet"*) | Ago/2026 |
| Free screenshot tool | 12.000 visitantes/mês, 12–15% signup | Ago/2026 |

### 2.2 Supademo — timeline real do produto (changelog oficial)

Primeira linha de código: **início de 2023**. Primeiro product update: **17/01/2023**.

| Data | Update | Mês |
|---|---|---|
| 17 jan 2023 | Shared Workspaces & Folder Management | 0 |
| 16 fev 2023 | Automatic Annotations & Next Button | 1 |
| **22 mar 2023** | **Supademo Analytics Dashboard** | **2** |
| 27 abr 2023 | Multi-select, hotspot drag, criar demo de upload | 3 |
| 27 mai 2023 | Quick Editing and Redactions (crop/annotate/redact) | 4 |
| **7 jun 2023** | **Introducing Supademo Showcases** | **5** |
| 20 jun 2023 | Global Hotspot Options | 6 |
| 17 jul 2023 | Embed Showcases, GIF/Video exports, colaboração | 7 |
| 2 ago 2023 | Analytics 2.0, Extension updates | 8 |
| 25 set 2023 | AI Features, Video Recording Support | 9 |
| 3 nov 2023 | Showcase embeds, Multi-Delete, Default CTAs | 10 |
| 15 dez 2023 | Zoom and Pan, Replace Images, Media Library | 11 |
| **9 jan 2024** | **Demo Branching, Lead Capture, Custom Chapters** | **12** |
| 28 mar 2024 | Dynamic Variables, Trackable Links, Voiceover | 14 |
| **4 abr 2024** | **G2 Leader em Demo Automation — Spring 2024** | 15 |
| 17–21 mar 2025 | **Launch Week** (1 feature/dia): HTML demos, Translations Hub, 9 design, Windows App, **Native Forms (Scale+)** | 26 |

### 2.3 O MVP real do Supademo (meses 0–4) — e o que ele NÃO tinha

**Tinha:** gravar via extensão · hotspots + botão Next · **Analytics Dashboard
(mês 2)** · reordenar steps · criar demo a partir de upload (mês 3) ·
multi-select (mês 3) · blur/redaction (mês 4) · workspaces + folders (mês 0).

**Não tinha:** lead capture (mês 12 como embed de form externo; **mês 26** como
Native Form nativo, Scale+) · billing self-serve · PIX · LGPD/DSR · PT-BR
first · variáveis (mês 14) · branching nativo (mês 12) · AI (mês 9).

> **Conclusão:** o MVP do EasyDemo é o **Supademo do mês 12, ao custo do mês 0**,
> porque lead capture, billing, LGPD, embed e analytics **já estão no código** —
> o que falta é desligar 5 endpoints quebrados e renderizar o que já existe.

### 2.4 State of Interactive Demos 2026 (relatório do Supademo)

Survey de 200+ profissionais + análise de performance de 150.000+ demos.

| Métrica | Valor |
|---|---|
| Motivo de adoção #1 | **Onboarding/Adoption — 45%** |
| Impacto #1 | **Onboarding — 4,3/5 (81% "alto")** |
| Departamento #1 | **Customer Success — 26%** |
| Distribuição #1 | Website/landing — 72,2% · Help center — 49,1% · In-app — 45,3% |
| "Hero demo" (top 10%) | **10–12 steps, hotspot de 15–18 palavras, >80% completion** |
| Branding custom | **96,8% dos top demos** |
| AI voiceover | 64% usam · 53,7% dos top-completing vs 44,2% da média |
| Freshness | quem atualiza semanal/mensal reporta 79% de impacto vs 67% |
| Analytics | 28% engagement · 22% conversão · 18% messaging |

### 2.5 Pricing: seat + views ilimitadas (fonte primária)

`supademo.com/pricing`:
> "Plans are priced by creator seats (the people who build and edit demos).
> **External viewers and views are unlimited on every plan, including Free.**"

`supademo.com/solutions/customer-success`:
> "Does Supademo charge for every customer who opens a walkthrough? **No. You
> pay for creator seats**, the people who record and edit. **Views and viewers
> are unlimited and free on every plan**, including Free."

**Por que isso importa:** o churn lever #1 do setor é viewer licensing. O cliente
Aviso (Director of Customer Success) é público sobre ter trocado do Storylane:
> "we'll give you a handful of viewers, and then you're going to start paying
> for viewers"

Cobrar por view no EasyDemo seria construir exatamente o medidor que matou o
concorrente. **No EasyDemo não custa nada** — Cloudflare R2 tem zero egress fee.

### 2.6 Tração: as 5 táticas do ano 1 (verbatim, GetLatka 15:45–18:23)

| # | Tática | Verbatim |
|---|---|---|
| 1 | Nichar em founders primeiro | *"we really niched down and focused on founders first because that's where we could open up the beach head because enterprises would take a lot longer in the sales cycle"* |
| 2 | Postar em Reddit/IndieHackers/Quora **oferecendo criar a demo de graça** | *"hey, I'm the founder of this company... I want to create a product demo for you. Just drop your URL and I'm gonna do the work of signing up for your product"* |
| 3 | Criar manualmente o hero demo de 10–15 clicks do "aha moment" deles | *"All you have to do is sign up, duplicate, and you can use it for free"* |
| 4 | Postar a URL do demo no thread deles → outras pessoas clicam → flywheel | *"I would literally post that URL of their product in their thread... they were saying, Whoa, I'm gonna click it"* |
| 5 | Responder posts de product update de prospects-alvo (Airtable, Atlassian) | *"I already created it for you that explains the product. Try embedding it in your product update"* |

E o sequenciamento: *"even before this, I think I was posting on Reddit and giving
whatever founder lessons or advice... **without even mentioning Super Demo**."*

**Mix de aquisição em Ago/2026:** ~30% referrals/word-of-mouth/**badge Powered By**
(*"the single largest source of new customers"*) · ~30% SEO/AEO/busca por LLM ·
~20–25% YouTube · ~20% building in public · **$500/mês de paid ads**.

### 2.7 Limitações conhecidas do dataset (ler antes de decidir)

1. **G2 e Capterra retornam 403.** Todas as citações de G2 no doc vêm das
   próprias páginas /compare do Supademo → viés do publisher. Não há NPS numérico.
2. O **State of Interactive Demos 2026 é autoral do Supademo** e o mix de case
   studies deles pende para CS/onboarding (Khan Academy, Bullhorn, VRIFY) vs
   growth/sales (beehiiv, RB2B). O peso de onboarding pode refletir **o mix
   deles**, não a distribuição real da categoria.
3. **Revenue por tier não é público.** A distribuição Free/Scale/Business/Business
   do Supademo é inferência.
4. **Zero dados do EasyDemo.** 0 usuários. Nenhuma conversão BR medida.
5. As personas do repo (`marketing/ICP-PERSONAS.md`) **não foram validadas** —
   o próprio arquivo declara isso.

> **Consequência prática:** a prioridade Eixo A (aquisição) vs Eixo B (onboarding)
> **não se resolve com pesquisa**. Se resolve com os 5 primeiros clientes. Por isso
> Showcase é Fase 2, não MVP.

---

## 3. Decisões (D1–D12)

| # | Decisão | Fonte | Alternativa descartada |
|---|---|---|---|
| **D1** | Views ilimitadas em todos os planos. Preço fechado por plano: Free R$0 / Pro R$49 / Business R$199. Creators inclusos 1/1/3 | §2.5 | Manter view-cap (contraria o mercado; era o churn lever do Storylane) |
| **D2** | Lead form em todos os planos. Volume: Free 20/mês, Pro 100, Business ilimitado | §2.5 + beehiiv (20% view→signup) | Form atrás do Pro (Free não provaria o valor) |
| **D3** | Form é chapter type genérico, independente do CTA, pode gatear conteúdo | Supademo `/features/forms`: *"Forms are a Chapter type"* | Form atrelado ao CTA comercial (impediria o caso de onboarding) |
| **D4** | Escopo = paridade com o core do Supademo (Free+Scale) + 3 gaps de mercado BR (PIX/BRL, LGPD/DSR, PT-BR) | §2.3 | Inventar feature (ex.: preset WhatsApp — Supademo já tem CTA genérico) |
| **D5** | Showcase e versioning → Fase 2. Analytics completo no Free durante a fase de aprendizado | §2.1 (analytics no mês 2 deles) · §2.4 | Showcase no MVP (Supademo entregou no mês 5, mas com 1 plano flat — our pricing é tiered) |
| **D6** | Nome **EasyDemo**. npm scope `@easydemo/*`. Domínio `easydemo.io` | decisão de produto | `easydemo.com.br` (o usuário escolheu `.io`) |
| **D7** | Rename em PR separado, **antes** do MVP | 195 arquivos / 1.618 ocorrências | Junto com o MVP (diff gigante, mistura refactor com feature) |
| **D8** | Hero demo helper = hint passivo no editor (não bloqueio) | §2.4 (10–12 steps, 15–18 palavras) | Cortar (o dado é do benchmark do Supademo, mas não é feature deles) |
| **D9** | Preset WhatsApp → Fase 2. CTA é genérico | Supademo `/features/demo-editor`: *"chapters can include call-to-action buttons"* | Incluir (seria inventar diferenciação) |
| **D10** | **Upload manual de screenshot entra no MVP** | §2.3 (Supademo entregou no mês 3) + risco de CWS | Esperar a extensão (a CWS não aprova no dia 1 → alpha travado) |
| **D11** | **Badge "Powered by EasyDemo" entra no MVP** | §2.6 (30% dos signups do Supademo) | Adicionar depois (custa 1h agora, é caro mexer no player depois) |
| **D12** | **Blur/redaction → Fase 2**, bloqueante antes de vertical fintech/saúde. Folders, multi-select, texto auto → P2 | §2.3 | Incluir blur (não bloqueia o alpha; custo médio) |

---

## 4. Escopo do MVP

### 4.1 Entra (P0)

| Item | O que faz (exemplo) | Por que vale a pena |
|---|---|---|
| **Extensão Chrome** | Clica "Iniciar captura", navega no produto, cada clique vira step com screenshot + bounding box + URL | Passo 1 do getting-started do Supademo. Sem ela não existe demo |
| **Editor no-code** | Arrastar steps pra reordenar, clicar no screenshot pra marcar hotspot (pointer/callout/area), editar título e CTA | Passo 2. É onde o valor é criado |
| **Publicação** | Clica "Publicar", digita `minha-demo`, gera `easydemo.io/d/minha-demo` + OG image | Passo 3. Sem publicar não há demo |
| **Player público** `/d/[slug]` | Visitante abre o link, vê o step 1 com hotspot pulsando, clica no alvo e avança até o fim | É o produto. É o que o visitante vê |
| **Embed** | Cola `<iframe src=".../embed/xxx">` no site/help center e o demo abre ali | Já é Free no Supademo. Põe a demo no site do cliente → traz os próximos clientes |
| **Badge "Powered by EasyDemo"** | Rodapé do player com link pro EasyDemo | 30% dos signups do Supademo vêm disso. Custa 1h |
| **Upload manual de screenshot** | Sem extensão: arrasta o PNG, marca o hotspot, publica | **Bloqueador do alpha** — a extensão não está na CWS |
| **Lead form** (chapter type) | No step 1 aparece "Quero uma demo" com nome/e-mail/telefone + checkbox LGPD **desmarcado** | Prova o valor: beehiiv converte 20% dos viewers em signup. Genérico, igual o Supademo |
| **CTA genérico** | No último step: "Falar com o time" → `wa.me`, `mailto:` ou qualquer URL | Paridade Supademo. É o que converte |
| **Analytics** | Dashboard: 1.200 views · 68% completion · drop-off no step 3 · 240 cliques no CTA · 89 leads | Mede o funil. Sem isso você não sabe se está vendendo |
| **Billing Asaas + PIX + BRL** | Clica "Upgrade Pro" → checkout hosted Asaas → paga R$49 no PIX → webhook `payment.confirmed` → plano vira `pro` | Supademo é Stripe USD. BR paga PIX. É a receita |
| **Branding no player** (logo + cor) | Demo aparece com a marca do cliente em vez do tema padrão | O editor já tem o ThemeEditor, o player só ignora. 96,8% dos top demos do Supademo usam |
| **Legal** (CNPJ, DPO, docs) | Política de privacidade, termos e contato do encarregado com CNPJ real | Para vender no BR. LGPD by design vs Supademo self-declared |

### 4.2 Não entra (Fase 2 / V2)

| Item | Categoria | Por que não |
|---|---|---|
| **Showcase** `/c/[slug]` | F2 — 1º upsell | Supademo entrega no mês 5, mas com pricing flat. Decidir com os dados dos 5 clientes |
| **Versioning** | F2 | Supademo põe em Growth+ ($450). Só implementar stub (501) |
| **Branching + variáveis** | F2 | Supademo põe em Scale+. É upsell |
| **Blur/redaction** | F2 — bloqueante pré fintech/saúde | Não bloqueia o alpha. Custo médio. `apps/workers/src/tasks/redact_pii.ts` já existe — reavaliar custo |
| **Texto auto do hotspot** | F2 (precisa de IA) | Supademo tinha no mês 1 sem IA; a versão boa (set/2023) usa AI. Custo mensal OpenRouter |
| **TTS voiceover** | F2 | Multiplicador de margem, não de adoção. Custo R$60/mês (ElevenLabs) |
| **AI text generation** | F2 | ⚠️ **Dívida competitiva**: o Free do Supademo já inclui "AI text personalization". Nosso Free fica mais fraco nesse ponto |
| **Preset WhatsApp** | F2 | CTA genérico já cobre. Supademo não tem e funciona |
| **CRM BR** (HubSpot/RD/Kommo) | V2 | Supademo põe em tier alto. É integração, não core |
| **Custom domain** | V2 | Supademo põe em Growth+. Caddy/Cloudflare for SaaS |
| **HTML clone / sandbox / mobile / Figma / 4K** | V2 | Custo de engenharia alto. Fora do MVP do Supademo também |
| **AI Command / MCP / AI Demo Agent** | V2 | Modelo de negócio novo (créditos) |
| **Route Hub / In-App Demo Hub** | V2 | Distribuição avançada |
| **SSO / SOC 2 / multi-workspace** | V2 | Enterprise |
| **Cobrança por seat adicional** | V2 | Flat no MVP. Seat real exige proration + UI de quantidade (+3–4 dias) |
| **Stripe** | V2 | Gateway secundário. Asaas é o checkout BR do MVP |
| **Folders / multi-select de steps** | P2 | Organization e conveniência. Ruído com 3 demos no Free |
| **Tool grátis adjacente** | F2 (GTM) | Topo de funil. Candidato: screenshot → guia passo-a-passo. O Supademo tira 12k visitas/mês disso |

### 4.3 A regra

> **MVP = paridade com o core do Supademo (Free + Scale) + 3 gaps de mercado BR.**
> Tudo que o Supademo não tem **e** não é gap de mercado BR fica fora até os
> dados pedirem.

Os 3 gaps BR: **PIX/boleto/NF-e em BRL** (Supademo é Stripe USD) · **LGPD com
DSR endpoint** (Supademo é self-declared) · **PT-BR first** (ADR-012, Supademo é
EN-first).

---

## 5. Planos e limites

Fonte de verdade: tabela `app.plans` (`apps/web/db/schema/app.ts:130-142`) +
`specs/mvp-scope.json`.

| Campo | Free | Pro | Business |
|---|---|---|---|
| Preço mensal | R$ 0 | **R$ 49** | **R$ 199** |
| Preço anual | R$ 0 | R$ 490 | R$ 1.990 |
| Creators inclusos | 1 | 1 | 3 |
| `max_demos` | 3 | ilimitado | ilimitado |
| `max_steps_per_demo` | 10 | 30 | 60 |
| **`max_views_per_month`** | **ilimitado** | **ilimitado** | **ilimitado** |
| `max_leads_per_month` | 20 | 100 | ilimitado |
| **`lead_form`** | **true** | true | true |
| `custom_domain` | false | false | true |
| `watermark_on_cta` | true | false | false |
| `link_ttl_days` | 30 | 30 | 30 |
| Payment methods | — | PIX, boleto, cartão | PIX, boleto, cartão |
| Trial | — | 14 dias | 14 dias |
| NF-e | — | sim | sim |

> **Migration `0004_flat_plans.sql`** — a coluna `max_views_per_month` **não
> deve ser dropada**: mantenha-a e sete `NULL` nos 3 planos, onde `NULL`
> significa **ilimitado**. `DROP COLUMN` em tabela populada é destrutivo e
> irreversível sem dump, e não há ganho em remover a coluna. A migration também
> adiciona `max_creators`, liga `lead_form` no Free, ajusta
> `max_leads_per_month` do Free para 20 e atualiza os seeds.

### 5.1 Justificativa dos preços

**R$ 49 no Pro** — ≈ +36% sobre o GuiaFlow Pro (R$ 36, `research/demos/guiaflow.md`),
em troca de SaaS gerenciado com IA inclusa (o GuiaFlow é BYOK), LGPD com DSR
endpoint automatizado, analytics de engagement real e cobrança em PIX. Contra o
Supademo Scale (US$ 50 ≈ R$ 275, FX R$ 5,50/USD), é **≈ 82% mais barato**
(`research/pricing/competitors-pricing.md`). O Pro precisa custar menos que
1 hora de trabalho de um SDR brasileiro para ser aprovado — a R$ 49 é decisão de
cartão corporativo, sem aprovação financeira.

**R$ 199 no Business** — ancora o cliente de time. Metade do Supademo Business
(US$ 199 ≈ R$ 1.000) e distante do Scale. Custom domain, variáveis e branching
justificam o salto.

**Trial** — 14 dias Pro sem cartão ao criar conta (experiência full; depois
cai pra Free).

**Por que views ilimitadas (D1)** — é a regra do mercado, não um favor. O
Supademo cobra por creator seat e deixa viewers ilimitados em todos os planos,
inclusive o Free (`supademo.com/pricing`). O principal churn lever do setor é
exatamente o viewer licensing: o cliente Aviso é público sobre ter trocado do
Storylane porque este cobrava por viewer
(`research/live-2026/g2-capterra-recent-reviews.md`). No EasyDemo o custo é
praticamente zero — Cloudflare R2 não cobra egress.

**Por que lead form no Free (D2)** — a prova de valor do produto é a captura
de lead. O caso do beehiiv mostra 20% de conversão view→signup e +50% na
conversão free-to-paid vs. site estático. Um Free que não captura lead não
demonstra o valor central; a monetização vem do **volume**, não da
funcionalidade.

### 5.2 Comparativo de mercado

| | Free | Pro R$ 49 | Business R$ 199 | Supademo Scale $50 ≈ R$ 275 | GuiaFlow Pro R$ 36 |
|---|---|---|---|---|---|
| Demos | 3 | ilimitado | ilimitado | ilimitado | ilimitado |
| Steps/demo | 10 | 30 | 60 | ilimitado | ilimitado |
| **Views/mês** | **ilimitado** | **ilimitado** | **ilimitado** | ilimitado | — |
| Leads/mês | 20 | 100 | ilimitado | via form | 100 |
| Lead form | ✅ | ✅ | ✅ | ✅ | ✅ |
| Custom domain | — | — | ✅ | ✅ (Scale) | — |
| PIX / boleto / NF-e | — | ✅ | ✅ | ❌ | ✅ |
| LGPD by design | ✅ | ✅ | ✅ | ⚠️ genérico | ✅ |
| HubSpot BR / RD / Kommo | — | — | V2 | HubSpot Global | — |

---

## 6. Invariantes e anti-padrões

### 6.1 O que NUNCA pode quebrar

1. **`NODE_ENV` nunca no `.env`.** O Next gerencia esse valor. Se `development`
   vazar para o `next build`, o prerender de `/404` aborta com
   `<Html> should not be imported outside of pages/_document` e
   `Export encountered an error on /_error: /404`.
2. **YAML `run: |` não dobra escape.** `\\(` num workflow vira `\(` no shell e
   dá `syntax error near unexpected token '('`. Escreva `\(`.
3. **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` placeholder derruba o dev server do
   Playwright** — o Clerk valida a key no middleware e o servidor não sobe.
   É o motivo do `continue-on-error: true` no step de E2E.
4. **Policy RLS pública só se aplica sem tenant no contexto.** A policy
   `demos_public_select` precisa de `app.current_tenant_id() IS NULL`, senão
   tenants autenticados vazam demos publicadas uns dos outros (já aconteceu —
   ver migration `0003`).
5. **`"type": "module"` + `import.meta.url` no alias do webpack** — quebra o
   alias `@/` no build.

### 6.2 Anti-padrões já vistos neste repo

| Anti-padrão | Consequência | Prevenção |
|---|---|---|
| `NODE_ENV=development` no `.env` | build Docker quebra | `.env.example` não tem `NODE_ENV`; `Dockerfile` fixa `NODE_ENV=production` |
| `\\(` em `run: \|` do workflow | job de Lighthouse quebra com syntax error | usar `\(` |
| `pk_test_ci_placeholder` no Clerk | dev server do Playwright não sobe | chave real no CI (F10) |
| Teste que assume seed no banco | falha só na CI | teste cria os próprios dados (`scripts/db/test-rls.ts`) |
| `continue-on-error` mascarando falha | bug passa | remover quando o gate puder falhar |
| **`pnpm test` sem `.env` carregado** | 4 arquivos de teste de integração falham (DB) | `set -a; source .env; set +a` antes de rodar. A CI define as vars direto no `env:` do job |

> **Armadilha operacional:** o `pnpm test` da raiz roda os testes de integração
> que precisam de `DATABASE_URL`. Rodando sem `.env` carregado, 4 arquivos
> falham com `DATABASE_URL: Required` — **não é regressão de código**.

---

## 7. Grafo de dependências

```
                    ┌──────────────────────────────────────┐
                    │ PR 1 — RENAME (DemoBR → EasyDemo)    │
                    │ 195 arquivos, mecânico, CI verde      │
                    └──────────────────┬───────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              │
  ┌─────────┐                   ┌───────────┐                  ┌────────────┐
  │ F0      │                   │ F9        │                  │ F10        │
  │ Pricing │                   │ Extensão  │                  │ E2E+GTM    │
  │ flat    │                   │ Chrome    │                  │            │
  └────┬────┘                   └─────┬─────┘                  └─────┬──────┘
       │                              │                              │
       ▼                              │                              │
  ┌─────────┐                         │                              │
  │ F1      │                         │  ⚠️ F9 tem lead time           │
  │ Public. │◄────────────────────────┼────── (submeter na CWS)       │
  └────┬────┘                         │                              │
       │                              │                              │
       ▼                              │                              │
  ┌─────────┐                         │                              │
  │ F2 ⚠️   │ BLOQUEADOR DO ALPHA     │                              │
  │ Upload  │ (extensão não está na   │                              │
  │ manual  │  CWS no dia 1)          │                              │
  └────┬────┘                         │                              │
       │                              │                              │
       ├──────────────┬───────────────┼──────────────┬───────────────┘
       ▼              ▼               ▼              ▼
  ┌─────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
  │ F3      │   │ F4        │   │ F5       │   │ F6       │
  │ Lead+CTA│   │ Billing   │   │ Analytics│   │ Embed+   │
  │         │   │           │   │          │   │ badge    │
  └────┬────┘   └─────┬─────┘   └────┬─────┘   └────┬─────┘
       │              │              │              │
       └──────────────┴──────┬───────┴──────────────┘
                             ▼
                      ┌────────────┐
                      │ F7 Branding│
                      │ F8 Legal   │
                      └─────┬──────┘
                            ▼
                      ┌────────────┐
                      │ G0..G6     │
                      │ gates      │
                      └────────────┘
```

---

## 8. Fases PR1 e F0–F10

> **Para uma IA:** execute **uma fase por vez**, na ordem das dependências.
> Cada fase tem **passos numerados** — execute **um passo por vez** e **marque
> como concluído** em [`specs/mvp-tasks.json`](../specs/mvp-tasks.json) no
> mesmo commit. Ao final de cada fase, rode os comandos de validação listados.
> Se algum check falhar, **não avance** — conserte antes.
> Nunca edite arquivos fora da lista "Arquivos a tocar" da fase.
>
> **Antes de abrir qualquer arquivo**, leia os "Arquivos a ler antes" da sua
> fase. É onde estão os padrões a copiar e o que já está pronto.
>
> **Ao terminar cada passo:** marque o status em `specs/mvp-tasks.json`
> (`done` + `done_at` + `commit` + uma frase em `note`). É o que permite
> continuar depois ou por outro dev, sem ler o diff.
>
> **Ao terminar a fase, registre o que foi feito em
> [`docs/MVP-PROGRESS.md`](MVP-PROGRESS.md)** — uma entrada nova no final do
> arquivo, com o que passou a funcionar, as decisões tomadas, as armadilhas e a
> validação rodada.
>
> **O protocolo completo, com o loop e as 4 regras que não se negociam, está na
> [§0.2](#02-protocolo-de-execução-da-ia-obrigatório).**

### 8.0 Fluxo git por fase

> **Antes de começar:** rode `pnpm scripts:mvp-status` — ele imprime a fase
> atual, o próximo passo e o gate. É o comando que substitui ler o log inteiro.

**Unidade de trabalho: 1 fase = 1 branch = 1 PR.**

| Item | Convenção |
|---|---|
| **Branch** | `feat/f<n>-<slug>` (ex.: `feat/f3-lead-form`), `fix/f<n>-<slug>` se for correção. PR1 usa `chore/rename-easydemo` |
| **PR** | 1 por fase. Título no padrão Conventional Commits em PT-BR (`feat(billing): checkout PIX via Asaas`) |
| **Base** | `main` — nunca commitar direto nela (protegida, exige peer review) |
| **Gate** | A fase só entra na `main` quando o **gate dela** passa (ver §9) e a CI está verde |
| **Progresso — passo a passo** | O status de cada passo fica em **`specs/mvp-tasks.json`**. Marque o passo como `done` **no mesmo commit** em que ele foi feito. |
| **Progresso — por fase** | A entrada no `docs/MVP-PROGRESS.md` vai **no mesmo PR** da fase |
| **Ordem** | Só inicia a fase F*n+1* depois que a F*n* foi mergeada e registrada no log |
| **Limpeza** | Mergeado, **delete a branch**: `git push origin --delete <branch>`. Sem isso as branches se acumulam e ninguém sabe qual é a branch da fase atual. Antes de deletar, confirme que está 100% mergeada: `git merge-base --is-ancestor origin/<branch> origin/main` |

**Paralelismo — o que pode rodar junto:**

```
main
 ├── F2 (upload manual)  ─┐  independentes entre si
 ├── F5 (analytics)      ─┤  → podem ser feitas em paralelo, em branches distintas
 ├── F6 (embed + badge)  ─┤
 ├── F7 (branding)       ─┘
 └── F8 (legal) ───────────  depende de gente externa (DPO + advogado)
```

> ⚠️ **Mesmo em paralelo, dois devs não podem tocar o mesmo arquivo sem
> coordenar.** Antes de começar, confira os "Arquivos a tocar" das fases
> paralelas: se houver sobreposição, sequelize. Ex.: F3 e F6 **não** podem ir
> juntos — ambos tocam `components/player/DemoPlayer.tsx`.

**Se o review for o gargalo** (a `main` exige 1 approving review de admin),
fases adjacentes e independentes podem ser agrupadas em um PR — **desde que o
gate de cada fase passe individualmente**. Nesse caso, registre uma entrada de
log por fase.

**Antes de abrir o PR:**

- [ ] **Todos os passos da fase estão `done`** (ou `blocked`, com nota) em
      `specs/mvp-tasks.json` — confira com `pnpm scripts:mvp-status`
- [ ] A fase tem "Acceptance criteria" todo marcado
- [ ] Os comandos de validação da fase passaram
- [ ] A entrada no `docs/MVP-PROGRESS.md` foi adicionada no **final** do arquivo
- [ ] A tabela "Status atual" do `docs/MVP-PROGRESS.md` foi atualizada
- [ ] A fase está marcada como `done` em `specs/mvp-tasks.json`
- [ ] `git grep -in demobr` retorna 0 nos arquivos de conteúdo (excluindo
      `docs/MVP-PLAN.md`, `docs/MVP-PROGRESS.md` e `specs/mvp-tasks.json`, que
      **documentam** o rename e por isso mantêm o nome antigo)

### PR1 — Rename (DemoBR → EasyDemo)

**Objetivo:** renomear a marca em todo o repositório antes de começar o MVP.

**Por que primeiro:** 195+ arquivos versionados, 1.500+ ocorrências de "demobr"
(contagem viva: `git grep -ic demobr -- . | awk -F: '{s+=$2} END {print s}'`).
Fazer isso depois do MVP mistura refactor com feature e deixa o diff impossível
de revisar. Decisão D7.
**Gate:** G0 · **Passos:** 10 (`PR1.1`–`PR1.10` — status vivo em `specs/mvp-tasks.json`)

**O que fazer:**
1. Branch `chore/rename-easydemo` a partir da `main`.
2. npm scope `@easydemo/*` → `@easydemo/*` e package root `demobr` → `easydemo`
   nos 8 `package.json` + `pnpm-workspace.yaml` + os ~40 imports.
3. Domínios `easydemo.io` → `easydemo.io` (+ `app.`/`api.`/`docs.`/`webhooks.`)
   nas 49 URLs de `apps/web`, `marketing`, `online-presence` e `docs`.
4. Docker tags `demobr/*` → `easydemo/*` e banco `supademo` → `easydemo` em
   `infra/` (compose, `init-roles.sql`, prod).
   > ⚠️ **`supademo` é nome de banco E nome do concorrente.** Rename só onde é
   > o nosso: `POSTGRES_DB`, `PGWEB_DATABASE`, `DATABASE supademo`,
   > `supademo-oss` (URL do repo) — **~52 ocorrências**. As ~265 restantes são
   > o **Supademo concorrente** em `research/` e `marketing/` (pricing,
   > comparações, benchmarks) e **não podem ser renomeadas em bloco** — seria
   > falsificar a base de evidência do produto.
5. `scripts/` (~12 arquivos) + `Makefile`, `CONTRIBUTING.md`, `README.md`,
   `LICENSE`, `.env.example`.
6. `marketing/` (316 refs) e `legal/` (286 refs) — **revisão à mão**.
7. `online-presence/` (227 refs) e `research/` (108 refs) — **revisão à mão**,
   preservando os trechos que descrevem o site de um concorrente.
8. `pnpm install` **sem** `--frozen-lockfile` (trocar o npm scope invalida o
   lockfile — com a flag, ele falha) → regenera o lockfile → depois
   `pnpm install --frozen-lockfile` pra validar que ficou em sincronia.
9. `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
10. `git grep -in demobr` = 0 e `git grep -in "@demo.br"` = 0 nos arquivos de
    conteúdo → registrar no `docs/MVP-PROGRESS.md` e abrir o PR.
    > Os 3 arquivos que **documentam** o rename (`docs/MVP-PLAN.md`,
    > `docs/MVP-PROGRESS.md`, `specs/mvp-tasks.json`) ficam de fora do grep:
    > eles citam o nome antigo **como alvo da busca**, e o log é append-only.
    > Comando:
    > `git grep -in demobr -- . ':(exclude)docs/MVP-PLAN.md' ':(exclude)docs/MVP-PROGRESS.md' ':(exclude)specs/mvp-tasks.json'`

**Arquivos a ler antes:**
- `package.json` (raiz) e os 7 `package.json` dos workspaces — npm scope e nomes
- `pnpm-workspace.yaml` — lista de workspaces e regras de hoisting
- `infra/postgres/init-roles.sql:77` — `GRANT CONNECT ON DATABASE supademo`
- `infra/docker-compose.yml:9,33` — `POSTGRES_DB` e `PGWEB_DATABASE`
- `legal/*.md` e `marketing/**` — revisar à mão; **não** é replacement cego
- `research/**` — registro histórico de análise de mercado; renomear o nome do
  projeto, mas preservar os trechos que descrevem os concorrentes

**Identificadores não triviais:**

| Identificador | De | Para |
|---|---|---|
| npm scope | `@easydemo/{player,shared,ui}` | `@easydemo/{player,shared,ui}` |
| package root | `demobr` | `easydemo` |
| domínios | `easydemo.io` (+ `app.`/`api.`/`docs.`/`webhooks.`) | `easydemo.io` (+ os mesmos subdomínios) |
| docker tags | `demobr/web`, `demobr/worker`, `demobr/demobr` | `easydemo/*` |
| nome do banco | `supademo` | `easydemo` |

**Arquivos a tocar:**
- `package.json` (raiz) + `apps/web/package.json`, `apps/workers/package.json`,
  `apps/extension/package.json`, `packages/{shared,player,ui}/package.json`
- ~40 arquivos que importam `@easydemo/*`
- 49 URLs em `apps/web/**`, `marketing/**`, `online-presence/**`, `docs/**`
- `apps/web/Dockerfile`, `Dockerfile.worker`, `.dockerignore`,
  `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`,
  `.github/dependabot.yml`
- `infra/postgres/init-roles.sql`, `infra/docker-compose.yml`,
  `infra/docker-compose.prod.yml` e demais arquivos de `infra/`
- ~12 arquivos em `scripts/`
- `Makefile`, `CONTRIBUTING.md`, `README.md`, `LICENSE`, `.env.example`
- `marketing/**` (316 refs), `legal/**` (286), `online-presidence/**` (227),
  `docs/**` (139), `research/**` (108) — **revisão manual**

**Acceptance criteria:**
- [ ] `git grep -in demobr` retorna 0 nos arquivos de conteúdo
- [ ] `git grep -in "@demo.br"` retorna 0 nos arquivos de conteúdo
- [ ] `pnpm install --frozen-lockfile` passa
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes
- [ ] `pnpm build` passa
- [ ] `legal/` e `research/` revisados à mão (não são replacement cego)

**Validação:**
```
# 0 = ok. Exclui os 3 arquivos que documentam o rename (eles citam o
# nome antigo como alvo da busca; o log é append-only).
git grep -in demobr -- . ':(exclude)docs/MVP-PLAN.md' ':(exclude)docs/MVP-PROGRESS.md' ':(exclude)specs/mvp-tasks.json'
git grep -in '@demo\.br' -- . ':(exclude)docs/MVP-PLAN.md' ':(exclude)docs/MVP-PROGRESS.md' ':(exclude)specs/mvp-tasks.json'
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test
pnpm build
```

**Não fazer:** não mexer em lógica de negócio — é rename puro. Não trocar o
domínio dentro de exemplos de `research/` que descrevem o site de um
concorrente. Não renomear o repositório no GitHub (muda URLs) — isso é
decisão separada e precisa de permissão `admin`.
**Não renomear "Supademo" (o concorrente).** Só o *nosso* nome antigo
("DemoBR"/"demobr") e o nome do banco. Renomear o concorrente em `research/` e
`marketing/` falsifica a base de evidência que justifica o MVP.

---

### F0 — Pricing flat + views ilimitadas

**Objetivo:** trocar o modelo de cobrança de view-cap para preço fechado por
plano com views ilimitadas.

**Depende de:** PR 1 (rename).
**Gate:** G0.5 · **Passos:** 7 (`F0.1`–`F0.7` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/db/schema/app.ts:130-142` — tabela `plans` e todos os campos de limite
- `apps/web/db/migrations/0000_init.sql` — como os 3 planos são seedados hoje
- `apps/web/lib/db.ts` — `withTenant()` / `getDb()`, que todo enforcement vai usar
- `apps/web/server/repositories/demos.ts` e `apps/web/server/actions/demo.ts` — o padrão de repositório existente
- `specs/mvp-scope.json` (`pricing_brl`) — a fonte machine-readable que este PR 2 atualiza
- `docs/MVP-PLAN.md` §5 — a tabela de planos e limites alvo

**Arquivos a tocar:**
- 🆕 `apps/web/db/migrations/0004_flat_plans.sql`
- 🆕 `apps/web/lib/plans.ts`
- ✏️ `apps/web/db/schema/app.ts` (tabela `plans`, linhas 130–142)
- ✏️ `apps/web/db/migrations/meta/_journal.json`
- ✏️ `specs/mvp-scope.json` (bloco `pricing_brl`)

**O que fazer:**
1. `0004_flat_plans.sql`: **manter** a coluna `max_views_per_month` e setar
   `NULL` nos 3 planos (`NULL` = ilimitado). **Não** fazer `DROP COLUMN` — é
   destrutivo e irreversível sem dump. Adicionar coluna `max_creators integer`,
   ligar `lead_form: true` no Free, ajustar `max_leads_per_month` do Free para
   20, atualizar os seeds dos 3 planos com os valores da §5 deste doc.
2. `lib/plans.ts`: exportar `getPlanLimits(planId)` e
   `assertWithinLimits(workspaceId, resource, count)` — resource ∈
   `demo | step | lead`. Usar `withTenant` pra contar recursos do workspace.
3. `specs/mvp-scope.json`: atualizar `pricing_brl` com a §5.

**Acceptance criteria:**
- [ ] `pnpm --filter web db:migrate` aplica sem erro
- [ ] `getPlanLimits("free")` retorna `maxViewsPerMonth: null` e
      `leadForm: true`
- [ ] `assertWithinLimits` rejeita 4º demo no Free e 21º lead no Free
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm --filter web db:migrate
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não mexer nas migrations `0000`–`0003`. Não implementar checkout
aqui (é F4). Não mexer na página de pricing de marketing (é F4).

---

### F1 — Publicação real

**Objetivo:** o creator cria uma demo e a publica num link público.

**Depende de:** F0.
**Gate:** G1 · **Passos:** 8 (`F1.1`–`F1.8` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/components/editor/DemoEditor.tsx:400-460` — as 3 chamadas que hoje falham (`:413` publish, `:433` unpublish, `:447` versions)
- `apps/web/components/editor/PublishPanel.tsx` — a UI de publicação já pronta e o contrato que ela espera
- `apps/web/app/api/v1/demos/[id]/route.ts` — o padrão de rota REST do projeto (auth, `withTenant`, `errorResponse`)
- `apps/web/server/repositories/demos.ts` e `apps/web/server/actions/demo.ts` — onde mora o `publishDemo` que já existe como server action
- `apps/web/app/(app)/demos/page.tsx` — a lista de demos e os 2 links que apontam pra `/demos/new`
- `apps/web/app/(app)/layout.tsx:35` — o terceiro link pra `/demos/new`

**Arquivos a tocar:**
- 🆕 `apps/web/app/(app)/demos/new/page.tsx` — **HOJE RETORNA 404**
- 🆕 `apps/web/app/api/v1/demos/[id]/publish/route.ts`
- 🆕 `apps/web/app/api/v1/demos/[id]/unpublish/route.ts`
- ✏️ `apps/web/server/repositories/demos.ts`
- ✏️ `apps/web/components/editor/DemoEditor.tsx` (Hero helper, D8)

**Contexto crítico:** `DemoEditor.tsx:413` faz `POST /api/v1/demos/${id}/publish`,
`:433` faz `/unpublish` e `:447` faz `/versions`. **Os dois primeiros endpoints
não existem** → a tela de publicar está quebrada. O terceiro (`versions`) é
Fase 2: deixar retornando `501` e esconder o botão correspondente.

Também: `/demos/new` é linkado em 3 lugares e hoje dá 404 —
`apps/web/app/(app)/layout.tsx:35`, `apps/web/app/(app)/demos/page.tsx:48` e
`:56`. É o botão principal de conversão do produto.

**O que fazer:**
1. `/demos/new/page.tsx`: server action que cria a demo (status `draft`,
  slug random) e redireciona pra `/demos/{id}/edit`. Se `demoId` vier por query,
  reutilizar.
2. `publish/route.ts`: validar slug (3–32 chars, `[a-z0-9-]`, único no
  workspace), exigir ≥1 step, setar `status: "published"` e `published_at`.
3. `unpublish/route.ts`: voltar pra `draft`, limpar `published_at`.
4. `server/repositories/demos.ts`: `publishDemo`, `unpublishDemo` — usar
   `withTenant(orgId, ...)`.
5. Hero helper (D8): no editor, hint **passivo** (não bloqueia) sugerindo
   10–12 steps e hotspot de 15–18 palavras. Base: §2.4.

**Acceptance criteria:**
- [ ] `/demos/new` cria demo e abre o editor (não 404)
- [ ] Publicar com slug válido deixa `/d/{slug}` em 200
- [ ] Slug duplicado ou com 1 caractere retorna 400 com mensagem
- [ ] Demo sem step não publica
- [ ] Unpublish volta pra 404 no link público
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm --filter web db:migrate
pnpm lint && pnpm typecheck && pnpm test
pnpm dev   # manual: criar → publicar → abrir /d/slug em aba anônima
```

**Não fazer:** não implementar `/versions` (Fase 2). Não mexer no player ainda
(F3). Não mexer no `PublishPanel.tsx` (a UI já existe e está correta).

---

### F2 — Upload manual de screenshot ⚠️ BLOQUEADOR DO ALPHA

**Objetivo:** permitir criar uma demo **sem** instalar a extensão Chrome.

**Depende de:** F1.
**Gate:** G1.5 · **Passos:** 6 (`F2.1`–`F2.6` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/components/editor/PublishPanel.tsx:55-100` — **o padrão a copiar**: fetch em `/api/v1/upload/sign` → PUT no R2 → grava a referência
- `apps/web/app/api/v1/upload/sign/route.ts` — o contrato do presigned PUT (o que aceita, TTL, tipo)
- `apps/web/app/api/v1/demos/[id]/steps/route.ts:10-25` — o payload do step (`screenshotR2Key`, `sourceUrl`, `hotspot`)
- `apps/web/components/editor/StepList.tsx:45-105` — onde `onAddStep` já é declarado e renderizado
- `apps/web/components/editor/StepCanvas.tsx` — como o hotspot é posicionado no canvas

**Arquivos a tocar:**
- ✏️ `apps/web/components/editor/StepList.tsx` — `onAddStep` já está declarado
  (linha 51) e o botão já é renderizado (linhas 98–102), mas **nunca é passado**
- ✏️ `apps/web/components/editor/DemoEditor.tsx` — implementar o handler
- ✏️ `apps/web/app/(app)/demos/new/page.tsx` — botão "criar demo em branco"

**Por que é bloqueador:** a extensão **não está na Chrome Web Store**. A
submissão está em F9 e o review de conta nova leva dias a semanas. Sem este
caminho, **ninguém consegue criar demo** e o alpha não acontece. O RFC já previa:
*"plano B com upload manual de screenshot se o review atrasar"*.

**Reusar (não criar):**
- `apps/web/app/api/v1/upload/sign/route.ts` — presigned PUT pro R2
- `apps/web/app/api/v1/demos/[id]/steps/route.ts` — `POST` com `screenshotR2Key`
- Padrão pronto em `apps/web/components/editor/PublishPanel.tsx:68`
  (fetch em `/api/v1/upload/sign` → PUT no R2 → grava a referência)

**O que fazer:**
1. `StepList.tsx`: o `onAddStep` já existe como prop — só garantir que o
   `DemoEditor` passe a função real.
2. `DemoEditor.tsx`: handler que abre file picker (PNG/JPG), pede presigned URL,
   faz PUT no R2, calcula o bounding box do clique ou deixa o creator marcar no
   canvas, e cria o step via `POST /api/v1/demos/{id}/steps`.
3. `/demos/new`: botão "criar demo em branco" que abre o editor sem extensão.

**Acceptance criteria:**
- [ ] Demo criada sem extensão, via upload de PNG
- [ ] Step aparece no editor com hotspot posicionável
- [ ] Step publicado renderiza em `/d/[slug]`
- [ ] Imagem maior que o limite é rejeitada com mensagem clara
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não mexer no schema de `steps` (o hotspot já tem x/y/w/h). Não
criar endpoint novo de upload. Não mexer na extensão.

---

### F3 — Lead form + CTA genérico

**Objetivo:** fechar o funil de conversão — o visitante deixa o contato e chega
no CTA.

**Depende de:** F1.
**Gate:** G2 · **Passos:** 8 (`F3.1`–`F3.8` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/server/actions/lead.ts` — **já existe e valida**: consentimento (`z.literal(true)`), hash de IP/UA, `getDefaultConsentText`, insert em `app.leads`. Reaproveitar, não reimplementar.
- `apps/web/lib/lgpd/consent.ts` — `getDefaultConsentText()`
- `apps/web/components/editor/LeadFormEditor.tsx` — os campos e o texto de consentimento que o creator configura
- `apps/web/components/player/DemoPlayer.tsx` — onde o form entra e como o `FinalCta` é renderizado (`:222`)
- `apps/web/components/player/state-machine.ts` — os estados do player e o `completed`
- `apps/web/db/schema/app.ts:163-184` — a tabela `leads` e os campos de consentimento

**Arquivos a tocar:**
- 🆕 `apps/web/components/player/LeadForm.tsx`
- ✏️ `apps/web/components/player/DemoPlayer.tsx`
- ✏️ `apps/web/app/d/[slug]/page.tsx` — **linha 59**
- ✏️ `apps/web/app/embed/[id]/page.tsx`
- 🆕 `apps/web/app/api/v1/leads/route.ts`
- 🆕 `apps/web/app/(app)/demos/[id]/leads/page.tsx`

**Contexto crítico:**
- `apps/web/app/d/[slug]/page.tsx:59` passa **`finalCta: null`** hardcoded. O
  `DemoPlayer.tsx:222-223` renderiza `FinalCta` só se `demo.finalCta` existir →
  **o CTA nunca aparece no player público**.
- `leadFormEnabled` é recebido pelo player e **nunca usado**.
- Não existe componente de form em `apps/web/components/player/` (só
  `DemoPlayer`, `ConsentBanner`, `HotspotOverlay`, `state-machine`).
- **`apps/web/server/actions/lead.ts` já existe** e valida consentimento
  (`z.literal(true)`), hasheia IP/UA com salt, usa `getDefaultConsentText` e
  grava em `app.leads`. **Reaproveitar** — o endpoint REST é wrapper.

**O que fazer:**
1. `LeadForm.tsx`: campos nome, e-mail, telefone (opcional), checkbox de
   consentimento LGPD **desmarcado por padrão**, texto de consentimento vindo
   do demo. Acessibilidade: label real, `aria-describedby` no erro.
2. `DemoPlayer.tsx`: renderizar o form quando `demo.leadFormEnabled` — como
   gate do step 1 (é o que o Supademo faz: *"Create gated sections that unlock
   after form completion"*).
3. `app/d/[slug]/page.tsx:59`: trocar `finalCta: null` por `finalCta: demo.finalCta`
   (o schema já tem a coluna JSONB `final_cta`).
4. `app/embed/[id]/page.tsx`: mesma correção.
5. `api/v1/leads/route.ts`: wrapper REST sobre o server action existente.
   Respeitar `withTenant` no workspace do demo.
6. `(app)/demos/[id]/leads/page.tsx`: listar leads do demo + export CSV.

**Acceptance criteria:**
- [ ] Lead aparece em `/demos/[id]/leads` com `consentText` e `consentAt`
- [ ] Submit sem marcar o consentimento é bloqueado (400)
- [ ] CTA fica visível ao completar o demo (link correto gerado)
- [ ] Form não aparece quando `leadFormEnabled` é false
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não inventar campo de lead além de nome/e-mail/telefone. Não
colocar o form como obrigatório por padrão. Não mexer no `ConsentBanner`
(já existe e funciona).

---

### F4 — Billing

**Objetivo:** o creator paga R$49 no PIX e o plano dele muda.

**Depende de:** F0 (limites), F1 (plano no workspace).
**Gate:** G3 · **Passos:** 8 (`F4.1`–`F4.8` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/lib/billing/asaas.ts` — o client Asaas existente
- `apps/web/lib/asaas.ts` — ⚠️ **duplicata** de `lib/billing/asaas.ts`; verificar qual está em uso e consolidar
- `apps/web/app/api/webhooks/asaas/route.ts` — **o webhook HMAC já está pronto**, idempotência inclusa
- `apps/web/lib/billing/__tests__/asaas.test.ts` — 21 testes do client Asaas; não quebrar
- `apps/web/db/schema/app.ts:144-161` — tabela `subscriptions` (asaasSubscriptionId, status, período)
- `apps/web/components/billing/PlanCard.tsx` — o contrato das props que a página de billing usa

**Arquivos a tocar:**
- 🆕 `apps/web/app/api/v1/billing/checkout/route.ts`
- ✏️ `apps/web/lib/billing/asaas.ts`
- ✏️ `apps/web/app/(app)/billing/page.tsx` — **linhas 11, 40, 54**
- ✏️ `apps/web/components/billing/PlanCard.tsx`
- ✏️ `apps/web/app/(app)/workspace/settings/page.tsx`

**Contexto crítico:**
- `(app)/billing/page.tsx:11` → `const currentPlan = "free"` hardcoded (o
  comentário admite *"placeholder fixo"*).
- `(app)/billing/page.tsx:40` → `ctaHref="/api/billing/checkout?plan=pro"` — a
  rota **não existe** (o path real será `/api/v1/billing/checkout`).
- `(app)/billing/page.tsx:54` → `mailto:vendas@dominio.com.br` — domínio
  fictício.
- `apps/web/app/api/webhooks/asaas/route.ts` **já existe** com validação HMAC e
  idempotência. Reaproveitar.
- ⚠️ `apps/web/lib/asaas.ts` e `apps/web/lib/billing/asaas.ts` **coexistem** —
  verificar qual está em uso e consolidar em F4.

**O que fazer:**
1. `checkout/route.ts`: criar sessão de assinatura no Asaas
   (`lib/billing/asaas.ts`), devolver a URL de checkout. Aceitar `plan` e
   `workspaceId`.
2. `lib/billing/asaas.ts`: `createSubscription(planId, workspaceId, customer)`.
   Mapear preço em BRL → centavos (R$49 = 4900).
3. Webhook: no `payment.confirmed`, gravar em `app.subscriptions` e atualizar o
   plano do workspace. Tratar `payment.failed` e cancelamento.
4. `billing/page.tsx`: ler o plano real do workspace, corrigir o `ctaHref` pro
   path real, remover o `mailto` fictício (Business vira link de checkout ou
   contato real).
5. Enforcement: chamar `assertWithinLimits` ao criar demo, step e lead.

**Acceptance criteria:**
- [ ] Checkout sandbox abre e o webhook `payment.confirmed` muda o plano
- [ ] Plano do workspace aparece correto em `/billing`
- [ ] Criar 4º demo no Free é bloqueado com mensagem de upgrade
- [ ] Cancelamento volta ao Free no fim do ciclo
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
pnpm scripts:test-webhook-asaas
```

**Não fazer:** não implementar proration nem seat adicional (Fase 2). Não
integrar Stripe. Não mexer no plano Free além do que está na §5.

---

### F5 — Analytics

**Objetivo:** saber se o funil converte.

**Depende de:** F0.
**Gate:** G5 · **Passos:** 6 (`F5.1`–`F5.6` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/lib/analytics/visitor.ts` — a lógica de leitura do cookie `_pk_id`; falta a escrita
- `apps/web/lib/analytics/funnel.ts` — **já implementa** step→reach, `pct_continue` e completion rate. Reaproveitar.
- `apps/web/lib/__tests__/analytics-funnel.test.ts` — os testes do funnel já existem
- `apps/web/lib/analytics/events.ts` — os tipos de evento já suportados
- `apps/web/app/(app)/demos/[id]/analytics/page.tsx` — a página que vai consumir o funnel

**Arquivos a tocar:**
- ✏️ `apps/web/lib/analytics/visitor.ts` — **setar o cookie**
- ✏️ `apps/web/lib/analytics/events.ts`
- ✏️ `apps/web/app/(app)/demos/[id]/analytics/page.tsx`
- ✏️ `apps/web/components/analytics/StatsChart.tsx`

**Contexto crítico:** `apps/web/lib/analytics/visitor.ts` **lê** o cookie
`_pk_id` mas **nunca faz `cookies().set()`** → cada view conta como visitor
diferente e o funil fica quebrado. Adicionar a função de escrita.

Já existe e **deve ser reaproveitado**:
- `apps/web/lib/analytics/funnel.ts` — calcula funil step→reach, `pct_continue`,
  completion rate. É pure function, não toca DB.
- `apps/web/lib/__tests__/analytics-funnel.test.ts` — testes existentes.

**O que fazer:**
1. `visitor.ts`: `setVisitorCookie()` — gera id, hasheia com salt, grava com
   `httpOnly`, `sameSite=lax`, `maxAge` de `VISITOR_COOKIE_TTL_DAYS` (30),
   `secure` em produção. Chamar no `/d/[slug]` e no `/embed/[id]`.
2. `events.ts`: garantir `step_seen`, `cta_click`, `lead_captured`, `complete`.
3. Dashboard: completion rate, drop-off por step, CTA CTR, device, país —
   consumindo `funnel.ts`.
4. `StatsChart.tsx`: renderizar completion e drop-off.

**Acceptance criteria:**
- [ ] Duas views do mesmo navegador = 1 visitor
- [ ] Drop-off por step aparece no dashboard com os steps corretos
- [ ] CTA CTR = cliques / viewers que chegaram ao último step
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não mexer no `funnel.ts` (já está pronto e testado). Não
persistir IP. Não usar fingerprint de browser.

---

### F6 — Embed + badge "Powered by EasyDemo"

**Objetivo:** a demo vai pro site do cliente e traz os próximos clientes.

**Depende de:** F1.
**Gate:** G4 · **Passos:** 5 (`F6.1`–`F6.5` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/app/embed/[id]/page.tsx` — a rota de embed que já existe (sem chrome, sem o badge ainda)
- `apps/web/components/player/DemoPlayer.tsx` — onde o badge entra e de onde o `postMessage` é disparado
- `apps/web/next.config.ts:33-43` — os headers que o embed já recebe (`X-Frame-Options: ALLOWALL`, `Access-Control-Allow-Origin`)
- `apps/web/components/editor/PublishPanel.tsx` — padrão de UI simples com copy-to-clipboard

**Arquivos a tocar:**
- 🆕 `apps/web/app/(app)/demos/[id]/embed/page.tsx` (snippet de embed)
- ✏️ `apps/web/app/embed/[id]/page.tsx` (postMessage de analytics)
- ✏️ `apps/web/components/player/DemoPlayer.tsx` (badge)

**Contexto crítico:** a rota `/embed/[id]` já existe e renderiza o player sem
chrome. Falta: snippet copiável, postMessage de eventos, e o badge.

**Sobre o badge (D11):** o Supademo credita ~30% dos novos signups ao badge
"Powered by Supademo" — *"the single largest source of new customers"*. Ele
cria backlinks no site do cliente, que alimentam o SEO deles.

**O que fazer:**
1. Snippet: gerar `<iframe src="https://easydemo.io/embed/{id}" ...>` com
   altura responsiva e `loading="lazy"`.
2. `postMessage`: o player embutido envia `step_viewed`, `cta_click`,
   `lead_captured`, `complete` para o `window.parent`. Validar `event.origin`
   antes de processar.
3. Badge: rodapé "Powered by EasyDemo" com link, no player público e no
   embed. **Ocultar** quando: preview do editor (`?preview=editor`) ou quando
   o viewer logado é o dono do workspace.

**Acceptance criteria:**
- [ ] Snippet copiável funciona em página HTML externa
- [ ] `postMessage` chega no parent com `step_viewed` e `cta_click`
- [ ] `event.origin` inválido é ignorado
- [ ] Badge presente no player público, ausente no preview e para o dono
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não bloquear o badge por config no MVP. Não implementar
Showcase, Route Hub nem In-App Hub (Fase 2).

---

### F7 — Branding no player (parity gap interno)

**Objetivo:** a demo aparece com a marca do cliente.

**Depende de:** F1.
**Gate:** G5 · **Passos:** 5 (`F7.1`–`F7.5` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/web/components/editor/ThemeEditor.tsx` — a UI de branding que **existe** mas o player ignora
- `apps/web/db/schema/app.ts:69-95` — a tabela `demos` e onde o branding é persistido
- `packages/ui/` — as primitivas disponíveis (Radix + CVA + tailwind-merge)
- `apps/web/app/d/[slug]/page.tsx` — o que o player público recebe hoje

**Arquivos a tocar:**
- ✏️ `apps/web/components/player/DemoPlayer.tsx` (aplicar logo + cor)
- ✏️ `apps/web/components/editor/ThemeEditor.tsx` (só se o shape do tema não
  bater com o que o player consome)

**Contexto:** `apps/web/components/editor/ThemeEditor.tsx` **existe** e edita
cores, mas **o player ignora**. É um parity gap interno: o Supademo tem custom
branding e **96,8% dos top demos** usam (§2.4).

**O que fazer:**
1. Fazer o player ler a config de branding do workspace — via endpoint público ou
   metadata no demo, sem tenant no contexto público.
2. `DemoPlayer.tsx`: aplicar logo + cor primária.
3. Respeitar `watermark_on_cta` do plano.

**Acceptance criteria:**
- [ ] Demo de workspace com branding aparece com logo e cor
- [ ] Demo sem branding usa o tema padrão
- [ ] `watermark_on_cta` do Free aparece no CTA
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

**Validação:**
```
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não mexer no `ThemeEditor` além do necessário. Não
implementar custom domain (Fase 2).

---

### F8 — Legal + go-live

**Objetivo:** poder vender no Brasil.

**Depende de:** — (pode rodar em paralelo a partir de F1).
**Gate:** G7 · **Passos:** 6 (`F8.1`–`F8.6` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `legal/DPO.md` §10 e `legal/DPO-PROCESS.md` §3 — as instruções de preenchimento dos documentos
- `scripts/check-dpo-missing.ts` — os padrões que o job procura (o que precisa sair do `legal/`)
- `.github/workflows/ci.yml` — o job `check-dpo-placeholders` comentado, e onde reativá-lo
- `legal/privacy-policy.md`, `legal/terms-of-service.md`, `legal/cookie-policy.md` — os 3 docs que citam CNPJ, endereço e DPO

**Arquivos a tocar:**
- ✏️ `legal/*.md` — 7 documentos, 286 referências a "DemoBR"
- ✏️ `.github/workflows/ci.yml` — **reativar** o job `check-dpo-placeholders`
- ✏️ `scripts/check-dpo-missing.ts` — aceitar o valor real do DPO

**Contexto:** o job `Check DPO placeholders` foi **desativado** (comentado) no
workflow porque o projeto não tem DPO contratado. Ele bloqueia o merge por
padrão com exit 1 quando sobram placeholders.

**O que fazer:**
1. Preencher CNPJ real, endereço real, e-mail do encarregado (DPO) real e
   `{nome_do_DPO}` nos 7 documentos de `legal/`.
2. Revisão por advogado de `privacy-policy.md`, `terms-of-service.md` e
   `cookie-policy.md`.
3. `scripts/check-dpo-missing.ts`: aceitar o valor real do DPO.
4. `.github/workflows/ci.yml`: **reativar** o job `check-dpo-placeholders`.

**Pendências legais (bloqueantes de lançamento público):**
- [ ] CNPJ real em todos os documentos
- [ ] Endereço real
- [ ] E-mail do encarregado (DPO) real — hoje `placeholder@easydemo.io`
- [ ] `{nome_do_DPO}` substituído
- [ ] Revisão por advogado de ToS, Privacidade e Cookies
- [ ] Job de DPO reativado e passando

**Acceptance criteria:**
- [ ] `pnpm scripts:check-dpo` passa sem placeholders pendentes
- [ ] O job `check-dpo-placeholders` está **reativado** no `.github/workflows/ci.yml`
      e roda verde na CI
- [ ] `grep -rn 'placeholder@demobr\|{nome_do_DPO}\|\[NOME_DO_DPO\]' legal/` retorna vazio
- [ ] CNPJ e endereço reais presentes em Privacidade, Termos e Cookies
- [ ] E-mail do encarregado (DPO) real, diferente do placeholder, em todos os 7 docs
- [ ] `pnpm lint && pnpm typecheck && pnpm test` verdes

> ⚠️ **Esta fase é dependência externa** — o DPO precisa ser contratado e o
> advogado precisa revisar. Se não houver contratação até o momento de
> executá-la, **não invente os dados**: registre a pendência em
> `docs/MVP-PROGRESS.md` e siga para a próxima fase. O gate **G7** (Go-live)
> é que bloqueia o lançamento público, não o alpha.

**Validação:**
```
pnpm scripts:check-dpo
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não reativar o job antes de os placeholders estarem reais —
vai quebrar a CI. Não inventar dados de DPO. Não usar CNPJ, endereço ou e-mail
fictício como se fossem reais.

---

### F9 — Extensão Chrome

**Objetivo:** captura autenticada funcionando.

**Depende de:** F1. **Tem lead time externo** — começar a submissão já em F0.
**Gate:** G5 · **Passos:** 8 (`F9.1`–`F9.8` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `apps/extension/lib/api.ts` — onde `authHeaders` hoje retorna `{}`
- `apps/extension/components/recorder.ts` — a captura e o cálculo do hotspot (revisar o `clampPercent`, que divide por `window.innerWidth` sem saber o tamanho real da screenshot)
- `apps/extension/components/uploader.ts` — o upload pro R2 que precisa do header de auth
- `apps/extension/manifest.json` — as permissões atuais (só `activeTab`, `storage`, `scripting`)
- `apps/web/lib/auth.ts` — como o workspace é resolvido no servidor

**Arquivos a tocar:**
- ✏️ `apps/extension/lib/api.ts` — `authHeaders` real
- ✏️ `apps/extension/components/uploader.ts`
- ✏️ `apps/extension/components/recorder.ts`
- ✏️ `apps/extension/manifest.json`
- 🆕 `apps/web/app/api/v1/me/route.ts`

**Contexto crítico:** `apps/extension/lib/api.ts` **retorna `{}`** em
`authHeaders` → a extensão não identifica o usuário. E não existe
`/api/v1/me`.

⚠️ **O cálculo de hotspot pode estar impreciso:** o `clampPercent` divide por
`window.innerWidth` sem saber o tamanho real da screenshot (a captura pode ter
outra escala). Verificar antes de publicar na CWS.

**O que fazer:**
1. `api/v1/me/route.ts`: retorna o workspace do usuário logado.
2. `extension/lib/api.ts`: obter o token de sessão do Clerk e mandar em
   `Authorization: Bearer`.
3. `uploader.ts`: enviar o header de auth no upload pro R2.
4. `recorder.ts`: corrigir o clamp da coordenada do hotspot se necessário.
5. `manifest.json`: manter enxuto — só `activeTab`, `storage`, `scripting`.
   **Não** pedir `<all_urls>` nem `tabCapture` (review mais lento no CWS).
6. Submeter na Chrome Web Store.

**Acceptance criteria:**
- [ ] Extensão autenticada sobe e envia screenshot ao R2
- [ ] Hotspot cai na posição correta do screenshot
- [ ] Manifest sem permissões excessivas
- [ ] Extensão submetida na CWS

**Validação:**
```
pnpm extension:build
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não adicionar `<all_urls>`, `tabCapture` nem `offscreen` (RFC
§1.2). Não mexer em permissões do Clerk.

---

### F10 — E2E + alpha GTM

**Objetivo:** o fluxo completo roda sem bypass, e 5–10 empresas BR reais usam.

**Depende de:** F1–F9.
**Gate:** G5 + G6 · **Passos:** 9 (`F10.1`–`F10.9` — status vivo em `specs/mvp-tasks.json`)

**Arquivos a ler antes:**
- `tests/e2e/marketing.spec.ts`, `player-public.spec.ts`, `signup.spec.ts` — os 3 specs existentes e o estilo de assertion
- `playwright.config.ts` — `webServer` e as env que o Next recebe no E2E
- `.github/workflows/ci.yml` (job `test`) — as `env:` do job, de onde sai o `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` placeholder
- `apps/web/lib/env.ts` — as vars que o app exige e seus defaults
- `marketing/LAUNCH-PLAN.md` — o plano de lançamento que já existe (T-14 a T+30)
- `marketing/ICP-PERSONAS.md` — as personas e o aviso de que não foram validadas

**Arquivos a tocar:**
- ✏️ `.github/workflows/ci.yml` — remover `continue-on-error: true` do step de
  Playwright
- 🆕 `tests/e2e/full-flow.spec.ts`
- ✏️ `tests/e2e/marketing.spec.ts`, `tests/e2e/player-public.spec.ts`,
  `tests/e2e/signup.spec.ts`
- ✏️ `playwright.config.ts`
- ✏️ `marketing/LAUNCH-PLAN.md`, `marketing/ICP-PERSONAS.md`,
  `marketing/METRICS-DASHBOARD.md`
- ✏️ `marketing/CASE-STUDIES/CASE-01-fintech-onboarding-60pct.md` (+ `02`, `03`)

**Contexto crítico:** o E2E hoje roda com `continue-on-error: true` porque o
dev server do Playwright **não sobe** com `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
placeholder — o Clerk valida a key no middleware e derruba o servidor.

**O que fazer:**
1. Configurar no CI um secret `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` com uma chave
   `pk_test_` **real** do free tier do Clerk (e `CLERK_SECRET_KEY` junto).
2. Remover o `continue-on-error: true`.
3. `full-flow.spec.ts`: criar demo → upload manual → editar → publicar → abrir
   `/d/[slug]` em contexto anônimo → submeter lead → verificar em
   `/demos/{id}/leads`.
4. `marketing/CASE-STUDIES/*`: os 3 estudos são **fictícios**. Substituir por
   reais ou remover — publicar case fictício num produto que vende "LGPD by
   design" é risco de credibilidade. **Bloqueante de lançamento público.**
5. Executar `marketing/LAUNCH-PLAN.md` (já existe e está completo: T-14 a T+30,
   Product Hunt, soft launch, compare pages).
6. `marketing/ICP-PERSONAS.md`: fazer **3–5 entrevistas** com a persona #1
   (Pedro, PMM). O próprio arquivo declara que as personas não foram validadas.
7. Instrumentar `marketing/METRICS-DASHBOARD.md`.

**Acceptance criteria:**
- [ ] `pnpm test:e2e` verde **sem** `continue-on-error`
- [ ] E2E do fluxo completo verde
- [ ] 5–10 empresas BR no alpha, com dado de funil (visitor → lead → upgrade)
- [ ] Nenhum case study fictício publicado

**Validação:**
```
pnpm test:e2e
pnpm lint && pnpm typecheck && pnpm test
```

**Não fazer:** não implementar Showcase antes do dado dos 5 clientes. Não
comprar mídia antes de G6. Não publicar case fictício.

---

## 9. Gates go/no-go

| Gate | Critério | Como verificar | Se falhar |
|---|---|---|---|
| **G0** | Rename: `grep -ri demobr` = 0 nos arquivos de conteúdo; CI verde | `git grep -in demobr -- . ':(exclude)docs/MVP-PLAN.md' ':(exclude)docs/MVP-PROGRESS.md' ':(exclude)specs/mvp-tasks.json'` | corrigir e re-push **antes** de F0 |
| **G0.5** | Pricing do banco bate com o spec: `plans.max_views_per_month` = `NULL` nos 3 planos, `max_creators` = 1/1/3, `lead_form` = `true` no Free, `max_leads_per_month` = 20/100/`NULL` — e `lib/plans.ts` devolve exatamente a §5 | `pnpm --filter web db:migrate` + comparar `getPlanLimits()` com `specs/mvp-scope.json` → `pricing_brl` | corrigir a F0. **Não seguir pra F1** — todo gate downstream valida contra o pricing, e preço errado aprova tudo errado |
| **G1** | Demo criada no painel → publicada → `/d/[slug]` abre em anônimo com todos os steps em ordem | manual no `pnpm dev` | voltar a F1 |
| **G1.5** | Demo criada **sem extensão** → publicada → link abre | manual, upload manual | voltar a F2 — **alpha travado sem isso** |
| **G2** | Lead submetido no player → aparece em `/demos/{id}/leads` com consentimento registrado | manual + `pnpm test` | voltar a F3 |
| **G3** | Checkout sandbox Asaas → webhook `payment.confirmed` → plano do workspace vira `pro` | `pnpm scripts:test-webhook-asaas` | voltar a F4 |
| **G4** | Demo embarcada em HTML externo → `postMessage` chega + badge presente | página HTML de teste | voltar a F6 |
| **G5** | Fluxo completo automatizado em E2E, **sem bypass** — e **cobre as 3 fases que não têm gate próprio**: F5 (analytics: 2 views do mesmo navegador = 1 visitor, drop-off por step, CTA CTR), F7 (branding: logo + cor aplicados, `watermark_on_cta` do Free no CTA) e F9 (extensão: upload autenticado no R2, hotspot na posição correta, manifest sem permissões excessivas) | `pnpm test:e2e` | resolver Clerk key no CI (F10) |
| **G6** | 5–10 empresas BR no alpha, com funil medido (visitor → lead → upgrade) | `marketing/METRICS-DASHBOARD.md` | **para de construir**. Priorizar Fase 2 pelos dados |
| **G7** | **Go-live público** — DPO real + CNPJ + endereço reais, job `check-dpo-placeholders` ativo, nenhum case study fictício, `legal/` revisado por advogado | `pnpm scripts:check-dpo` + `grep -rn 'placeholder@demobr' legal/` + revisão jurídica | **não abrir ao público**. Voltar a F8 |

> **Cobertura dos gates:** as 12 fases estão mapeadas assim — PR1→G0 · F0→G0.5 ·
> F1→G1 · F2→G1.5 · F3→G2 · F4→G3 · F6→G4 · F8→G7 · **F5, F7 e F9→G5** (o
> E2E do F10 valida as três) · F10→G5+G6. O **G0.5 existe porque o F0 é a
> fundação**: sem ele, um pricing errado faz todos os gates seguintes passarem
> sobre dado errado.

> **G6 é o gate mais importante.** Se ele não passar, o MVP está errado e nenhum
> amount de feature nova conserta. O próximo passo vira decisão de produto, não
> de engenharia.

> **G6 e G7 são gates diferentes.** O **alpha** (G6) pode rodar com o DPO
> pendente — é um grupo fechado de early users, não há liberação pública. O
> **go-live público** (G7) exige DPO, CNPJ e documentos legais reais. Num produto
> que vende "LGPD by design", publicar com `placeholder@easydemo.io` nos
> documentos legais destrói a proposta de valor.

---

## 10. Alpha e GTM

### 10.1 Os 5 primeiros clientes (o experimento que decide a Fase 2)

O objetivo do alpha **não é receita**. É responder:

1. Qual eixo o cliente usa — **aquisição** (prospec no site) ou **retenção**
   (onboarding de cliente existente)?
2. Ele captura pela extensão ou pelo upload manual?
3. O lead form converte? Em que taxa?
4. Ele chega no CTA?
5. Ele embute em site, help center ou email de onboarding?

**Hipótese a testar:** Eixo A (aquisição) — o ICP do repo (`ICP-PERSONAS.md`,
persona #1 = PMM) é de aquisição, com a mensagem *"Pare de gastar 50% do tempo do
AE em demo fria"*.

**O dado de mercado aponta pro outro lado:** onboarding = 45% dos motivos de
adoção e 4,3/5 de impacto (§2.4). **Mas esse dado é do Supademo e pode refletir
o mix deles** (§2.7). Daí o Showcase ser Fase 2.

### 10.2 Entrevistas de validação de persona

3–5 entrevistas com a persona #1 antes do lançamento público. O próprio
`marketing/ICP-PERSONAS.md` declara: *"Personas são compostas a partir de dados
secundários (não foram validadas com 10+ entrevistas reais)"*.

### 10.3 Case studies fictícios → reais

`marketing/CASE-STUDIES/` tem 3 estudos (fintech, edtech, agência) **fictícios**.
Substituir por reais ou remover. Bloqueante de lançamento público.

### 10.4 Métricas de sucesso

`marketing/METRICS-DASHBOARD.md` já define o funil de 90 dias (aquisição,
engagement, retenção, receita, CAC por canal, cohort). Instrumentar com os
eventos de F5.

---

## 11. Pré-requisitos e lead times

| Item | Lead time | Bloqueia |
|---|---|---|
| **Chrome Web Store** (primeira submissão, conta nova) | **dias a semanas** | F9, e o alpha se F2 não existir |
| Clerk: chaves `pk_test_`/`sk_test_` reais | minutos | F10 (E2E sem bypass) |
| Clerk: domínio `easydemo.io` na allowlist | minutos | produção |
| Asaas: conta sandbox + CNPJ | ~1 dia | F4 |
| Domínio `easydemo.io` + DNS | ~1 dia | F6 (link público), badge |
| TLS (Caddy / Cloudflare) | automático | produção |
| R2: buckets público e privado | minutos | F2, F6 |
| Resend: domínio de envio | ~1 dia | e-mails transacionais |

> **Comece a submissão da CWS no F0.** É o item com maior lead time e o que
> mataria o alpha se a F2 não cobrisse.

---

## 12. Referências

### Documentos do projeto

| Documento | Papel |
|---|---|
| `docs/README.md` | **Mapa de toda a documentação** — o que cada arquivo é, quando abrir, quando não mexer |
| `docs/MVP-PLAN.md` | **Este.** O plano executável: escopo, evidências, decisões, invariantes, fases, gates |
| `docs/MVP-PROGRESS.md` | **Log append-only.** O que já foi feito e por quê. Uma entrada por fase |
| `specs/mvp-tasks.json` | **Checklist vivo, passo a passo.** Onde a execução está agora — o que está `done`, `pending` ou `blocked`. É o que permite retomar de onde parou |
| `scripts/mvp-status.ts` | `pnpm scripts:mvp-status` — imprime a fase atual, o próximo passo, o gate e o placar das 12 fases |
| `docs/RFC-Brazilian-Supademo.md` | Arquitetura, stack, diferenciação, GTM, riscos, env vars |
| `specs/mvp-scope.json` | Par machine-readable do plano (pricing, limites, fases, gates) |
| `AGENTS.md` | Bootstrap automático para agentes de IA |
| `docs/ADRs/` | 13 Architecture Decision Records |
| `docs/SLOs.md` | SLOs do MVP |
| `marketing/` | Plano de lançamento, ICP/personas, métricas, case studies |

### Fontes primárias (externas)

- GetLatka, interview Joseph Lee (4 Ago 2026):
  `https://getlatka.com/companies/supademo.com/interviews/supademo-joseph-lee-2026`
- GetLatka, perfil Supademo:
  `https://getlatka.com/companies/supademo.com`
- Supademo pricing: `https://supademo.com/pricing`
- Supademo getting started: `https://docs.supademo.com/article/35-getting-started`
- Supademo changelog: `https://supademo.com/blog/product-updates`
- Supademo forms: `https://supademo.com/features/forms`
- Supademo editor: `https://supademo.com/features/demo-editor`
- Supademo analytics: `https://supademo.com/features/analytics`
- Supademo personalization: `https://supademo.com/features/personalization`
- Supademo customer success: `https://supademo.com/solutions/customer-success`
- State of Interactive Demos 2026:
  `https://supademo.com/content/state-of-interactive-demos-2026`

### Fontes internas

- `docs/RFC-Brazilian-Supademo.md` — RFC (§1.1 = escopo P0/P1/P2 original)
- `docs/ADRs/` — 13 ADRs
- `docs/SLOs.md` — SLOs do MVP
- `specs/mvp-scope.json` — pricing, fases e exit criteria (machine-readable)
- `marketing/LAUNCH-PLAN.md` — plano de lançamento T-14 a T+30
- `marketing/ICP-PERSONAS.md` — ICP e personas
- `marketing/METRICS-DASHBOARD.md` — métricas de 90 dias
- `research/` — pesquisa de mercado (demos, pricing, tech, live-2026)

### Arquivos-chave do código

| Arquivo | Papel |
|---|---|
| `apps/web/app/d/[slug]/page.tsx` | player público (`:59` = `finalCta` bug) |
| `apps/web/components/player/DemoPlayer.tsx` | player, CTA (`:222`), form, badge, branding |
| `apps/web/components/editor/DemoEditor.tsx` | editor (`:413`/`:433` = publish/unpublish) |
| `apps/web/components/editor/StepList.tsx` | lista de steps (`:51` = `onAddStep` órfão) |
| `apps/web/components/editor/PublishPanel.tsx` | UI de publicação (`:68` = padrão de upload) |
| `apps/web/server/actions/lead.ts` | captura de lead já implementada |
| `apps/web/lib/analytics/funnel.ts` | cálculo de funil já implementado |
| `apps/web/lib/analytics/visitor.ts` | cookie de visitor (falta escrever) |
| `apps/web/lib/billing/asaas.ts` | client Asaas |
| `apps/web/app/api/webhooks/asaas/route.ts` | webhook HMAC já pronto |
| `apps/web/db/schema/app.ts` | schema (`:130` plans, `:163` leads) |
| `apps/web/db/migrations/` | migrations (`0003` = fix de RLS já aplicado) |
| `scripts/db/test-rls.ts` | teste de isolamento RLS (11 checks) |
| `apps/extension/lib/api.ts` | client da extensão (`authHeaders` vazio) |
| `.github/workflows/ci.yml` | CI (job de DPO comentado) |
