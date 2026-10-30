---
data: 2026-10-25
lente: execucao
cadencia: alta
status: ativo
tags: [execucao, log, progresso, handover]
---

# Progresso de Execução — EasyDemo MVP

> **Log append-only.** Uma entrada por fase concluída.
>
> **Regra:** ao terminar uma fase, **adicione uma entrada ao FINAL deste arquivo**.
> **Nunca reescreva ou apague entradas antigas** — elas são o registro de
> decisões e de armadilhas encontradas. Se algo precisa ser corrigido depois,
> registre isso na entrada nova.
>
> Este arquivo + o histórico do git respondem "onde paramos" e "por que".

## Status atual

| | |
|---|---|
| **Fase em andamento** | — (nenhuma; pronto pra começar) |
| **Última fase concluída** | — (preparação) |
| **Próxima fase** | **PR1** — rename DemoBR → EasyDemo |
| **Bloqueios** | nenhum |
| **Branch** | `docs` (pré-execução) → criar branch por fase |
| **Gate atual** | — (ainda em G0) |
| **Gates do MVP** | G0 rename · G1 publicação · G1.5 upload manual · G2 lead · G3 pagamento · G4 embed+badge · G5 E2E · G6 alpha · **G7 go-live público** |

## Como registrar uma fase

Copie o modelo abaixo, cole **no final** do arquivo e preencha. Seja específico:
o próximo dev não vai ler o diff do git, vai ler isto.

````markdown
### AAAA-MM-DD — F<n> — <nome da fase>

**Estado:** ✅ concluída | ⏳ em andamento | ❌ abortada
**Branch:** `<branch>` · **Commit:** `<sha>` · **Gate:** G<n>

**O que passou a funcionar**
- <comportamento observável, do ponto de vista de quem usa o produto>
- <idempotente: "demo criada sem extensão aparece no editor e publica">

**Arquivos criados**
- `path/novo.ts` — <o que faz>

**Arquivos modificados**
- `path/existente.ts` — <o que mudou e por quê>

**Decisões tomadas durante a execução**
- **D-n:** <decisão> — <por quê> (se contradiz o plano, cite a seção do plano)

**Armadilhas / o que a fase ensina**
- <o que deu errado, o que parece óbvio mas não é, o que custa tempo>
- <ex.: "o clamp do hotspot divide por window.innerWidth, mas a screenshot tem
  outra escala — o cálculo precisa do tamanho real do PNG">

**Validação rodada**
```
<comandos>  → <resultado>
```

**Ficou pra depois (débito desta fase)**
- [ ] <item> — <onde vai ser decidido>
````

## Log

### 2026-10-25 — Preparação — plano do MVP (pré-execução)

**Estado:** ✅ concluída
**Branch:** `docs` · **Commit:** `31fe5d1` + ajustes de docs
**Gate:** — (pré-G0)

**O que passou a funcionar**
- O MVP está especificado em nível executável: 12 fases (PR1 + F0–F10), 9 gates
  go/no-go, arquivos exatos, acceptance criteria e comandos de validação.
- Um dev (ou uma IA) nova consegue pegar uma fase e executá-la sem contexto
  prévio: `AGENTS.md` na raiz define o protocolo, e cada fase lista "arquivos a
  ler antes" (padrões a copiar, contratos existentes, o que já está pronto).

**Arquivos criados**
- `docs/MVP-PLAN.md` — plano canônico do MVP (escopo, evidências, decisões
  D1–D12, invariantes, fases, gates, alpha, pré-requisitos)
- `AGENTS.md` — bootstrap automático para agentes de IA (Claude Code, Cursor,
  Codex, Copilot). O Copilot lê `AGENTS.md` nativamente, conforme a doc oficial
  do GitHub — por isso **não** foi criado `.github/copilot-instructions.md`

**Arquivos modificados**
- `specs/mvp-scope.json` — pricing flat (views ilimitadas, lead form no Free),
  12 fases, 9 gates, 35 itens de out_of_scope
- `docs/RFC-Brazilian-Supademo.md` — §1/§3/§4 viraram ponteiros pro MVP Plan;
  sobrou arquitetura, diferenciação, GTM, riscos e env vars
- `README.md` — links reordenados (MVP Plan primeiro)
- `LICENSE` — MIT → Propriedade Reservada (projeto privado, não é open source)
- `CONTRIBUTING.md` — cláusula de licença MIT → cessão contratual

**Decisões tomadas durante a execução**
- **D1:** views ilimitadas em todos os planos, preço fechado por plano (Free R$0 /
  Pro R$49 / Business R$199, creators inclusos 1/1/3). O Supademo cobra por
  creator seat e deixa viewers ilimitados; viewer licensing é o principal churn
  lever do setor (o cliente Aviso trocou do Storylane por isso). No EasyDemo
  views ilimitadas não custam margem — R2 não cobra egress.
- **D2:** lead form em todos os planos, com limite de volume (Free 20/mês,
  Pro 100, Business ilimitado). O caso do beehiiv mostra 20% de conversão
  view→signup e +50% de conversão free-to-paid vs site estático — um Free que
  não captura lead não demonstra o valor central do produto.
- **D3:** form é chapter type genérico, separado do CTA, e pode gatear
  conteúdo. Isso é exatamente como o Supademo modela.
- **D4:** a regra do escopo é **paridade com o core do Supademo (Free + Scale) +
  3 gaps de mercado BR** (PIX/BRL, LGPD/DSR, PT-BR). Zero feature inventada.
  O preset de WhatsApp foi **descartado** — o Supademo já tem CTA genérico e
  apontar pra `wa.me` funciona; seria inventar diferenciação.
- **D5:** Showcase e versioning foram para a Fase 2. O Supademo entregou
  Showcase no mês 5, mas com pricing flat de US$20/mês; o nosso é tiered, e o
  dado de mercado (45% onboarding) é autoral do Supademo e pode refletir o mix
  dele. A decisão sai dos dados dos 5 primeiros clientes (gate G6).
- **D10:** upload manual de screenshot entra no MVP. **Bloqueador do alpha**: a
  extensão não está na Chrome Web Store e o review de conta nova leva dias a
  semanas. Sem esse caminho, ninguém consegue criar uma demo.
- **D11:** badge "Powered by EasyDemo" entra no MVP. No Supademo, ~30% dos
  novos signups vêm do badge "Powered by Supademo" — o canal #1 deles. Custa
  ~1h agora e é caro mexer no player depois.
- **D12:** blur/redaction foi para a Fase 2, bloqueante antes de vertical
  fintech/saúde. Não bloqueia o alpha; `apps/workers/src/tasks/redact_pii.ts`
  já existe e pode reduzir o custo quando chegar lá.

**Armadilhas / o que a fase ensina**
- **`pnpm test` sem `.env` carregado** faz 4 arquivos de teste de integração
  falharem com `DATABASE_URL: Required`. Não é regressão — é falta de env.
  Use `set -a; source .env; set +a`.
- **Os 5 endpoints que o editor já chama e que não existem**: `publish`,
  `unpublish` (chamados por `DemoEditor.tsx:413` e `:433`), `versions` (`:447`),
  `leads` e `billing/checkout`. A tela de publicar está quebrada hoje.
- **`/demos/new` retorna 404** e é linkado em 3 lugares
  (`(app)/layout.tsx:35`, `demos/page.tsx:48` e `:56`). É o botão principal de
  conversão do produto.
- **`app/d/[slug]/page.tsx:59` passa `finalCta: null`** hardcoded. O CTA nunca
  aparece no player público.
- **`lib/analytics/visitor.ts` só lê o cookie `_pk_id`** — nunca faz
  `cookies().set()`. Cada view conta como visitor novo e o funil fica quebrado.
- **`leadFormEnabled` é recebido pelo player e nunca usado.** Não existe
  componente de form em `components/player/`.
- **Já pronto e para reaproveitar, não reimplementar**:
  `server/actions/lead.ts` (valida consentimento, hasheia IP/UA, grava em
  `app.leads`), `lib/analytics/funnel.ts` (step→reach, `pct_continue`,
  completion rate, com testes), `app/api/webhooks/asaas/route.ts` (HMAC +
  idempotência), `components/editor/PublishPanel.tsx:68` (padrão de presigned
  upload), `components/editor/ThemeEditor.tsx` (branding, que o player ignora).
- **`lib/asaas.ts` e `lib/billing/asaas.ts` coexistem** — duplicata a resolver
  na F4.
- **`lib/plans.ts` e a migration `0004_flat_plans.sql` não existem** — são
  criados na F0. O `specs/mvp-scope.json` descreve o **estado alvo**, não o
  estado atual do schema.

**Validação rodada**
```
pnpm lint          → 209 arquivos, 0 erros
pnpm typecheck     → 4/4 pacotes OK
pnpm test          → 14 arquivos, 152/152 testes
specs/mvp-scope.json → JSON válido (25 chaves)
links relativos    → 12 checados, 0 quebrados
paths citados no plano → 77 existem, 12 a criar (marcados 🆕), 0 problemas
```

**Ficou pra depois (débito desta fase)**
- [ ] Descrição do repo no GitHub ainda diz "open-source" e "Postgres 17" →
      precisa de token com `admin:repo`
- [ ] Repositório está **público** no GitHub → decidir se torna privado
- [ ] Nome do repo é `supademo-oss` → renomear junto com o PR 1?
- [ ] `docs/SLOs.md` e os ADRs ainda dizem "DemoBR" → entram no PR 1
- [ ] `marketing/CASE-STUDIES/` tem 3 estudos **fictícios** → bloqueante de
      lançamento público (F10)
- [ ] `EMAIL_DPO` no `.env.example` sem valor real → depende da contratação

### 2026-10-29 — Higiene de docs — links, .gitignore e mapa de documentação

**Estado:** ✅ concluída
**Branch:** `fix/docs-hygiene` · **Commit:** (este commit) · **Gate:** — (pré-G0, não é fase de MVP)

**O que passou a funcionar**
- Os 157 links relativos de todos os `.md` do repo resolvem. Antes, 3 apontavam
  para arquivo inexistente.
- `infra/cloud-init.yaml` não pode mais ser commitado por acidente depois de um
  provisioning.
- O mapa de docs cobre 11 diretórios e 141 arquivos `.md` — os 3 arquivos soltos
  (`apps/web/tests/setup-playwright.md`, `apps/web/a11y/REPORT.md`,
  `tests/COVERAGE-REPORT.md`) e o `setup-report/` (24 arquivos) entraram no mapa.

**Arquivos modificados**
- `apps/web/tests/setup-playwright.md` — 2 links com off-by-one: de
  `apps/web/tests/`, `../../setup-report/` resolve em `apps/setup-report/`;
  o certo é `../../../setup-report/`. Os 2 arquivos existem na raiz.
- `infra/hetzner/README.md` — o link `../cloud-init.yaml` apontava pra um
  artefato gerado em runtime (não versionado). Virou referência explícita,
  com o caminho do template versionado ao lado.
- `.gitignore` — `infra/cloud-init.yaml` ignorado. O arquivo embute a **chave
  SSH pública do dev** e o **domínio de produção** (verificado: não embute
  senha de banco nem token), e um `git add -A` depois do provisioning commitaria
  os dois.
- `docs/README.md` — contagem corrigida (128 → 141 arquivos, 8 → 11 diretórios),
  `setup-report/` e os 3 arquivos soltos mapeados, status dos PRs atualizado
  (#29, #30, #31).

**Decisões tomadas durante a execução**
- **D1:** o link pro `cloud-init.yaml` gerado virou **code span** em vez de link.
  O arquivo não existe no repo — um link é sempre quebrado até o primeiro
  provisioning, e um code span comunica "esse arquivo aparece em runtime"
  sem quebrar o link-checker.
- **D2:** `setup-report/` entrou no mapa como **histórico, não editável** —
  igual ao `research/`. São relatórios de sessões passadas.

**Armadilhas / o que a fase ensina**
- **Link relativo com profundidade errada passa despercebido.** O arquivo
  apontado existia, então uma conferência por "o arquivo existe?" dava false
  positive. O que quebra é a **resolução do caminho relativo** — só se
  resolvendo contra a raiz do repo.
- **Os 24 "links quebrados" dos templates de marketing não são bug** — são tags
  de merge (`{{link_retry}}`, `{{calendly_link}}`) que o merge tool substitui.
  Não "consertar": quebraria o template.

**Validação rodada**
```
links relativos (157 checados, todos os .md)  → 0 quebrados
git check-ignore -v infra/cloud-init.yaml   → .gitignore:80
```

**Ficou pra depois (débito desta fase)**
- [ ] Nenhum — os 3 links e o `.gitignore` foram corrigidos aqui.
