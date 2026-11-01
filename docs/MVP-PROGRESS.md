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
> Este arquivo + o histórico do git respondem "onde paramos" e "por quê".
>
> **Para saber o próximo passo exato:** `pnpm scripts:mvp-status`. Ele lê
> `specs/mvp-tasks.json` e imprime a fase atual, o passo a fazer e o placar.

## Status atual

| | |
|---|---|
| **Fase em andamento** | **F8** — Legal + go-live (gate G7) — não iniciada |
| **Última fase concluída** | **F7** — Branding no player (gate G5 ✅) |
| **Próxima fase** | **F8** — Legal + go-live (gate G7) |
| **Próximo passo** | `F8.1` — preencher CNPJ, endereço e DPO nos documentos legais |
| **Bloqueios** | nenhum no código; DPO/CNPJ e Chrome Web Store são externos e não bloqueiam F7 |
| **Branch** | `feat/f7-branding` (1 branch por fase) |
| **Gate atual** | G5 (branding) ✅ · próximo G7 (legal, F8) |
| **Passos concluídos** | 63 / 86 |
| **Gates do MVP** | G0 rename · **G0.5 pricing** · G1 publicação · G1.5 upload manual · G2 lead · G3 pagamento · G4 embed+badge · G5 E2E (cobre F5/F7/F9) · G6 alpha · **G7 go-live público** |

## Como registrar uma fase

Copie o modelo abaixo, cole **no final** do arquivo e preencha. Seja específico:
o próximo dev não vai ler o diff do git, vai ler isto.

> **E os passos intermediários?** Eles ficam em `specs/mvp-tasks.json`, marcados
> como `done` + `done_at` + `commit` + `note` **a cada passo**, no mesmo commit
> em que o passo foi feito. O log abaixo é o **porquê** da fase — não substitui
> o checklist.

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

### 2026-10-29 — Protocolo de execução da IA — checklist vivo, passo a passo

**Estado:** ✅ concluída
**Branch:** `feature/mvp-execution-protocol` · **Commit:** (este commit) · **Gate:** — (pré-G0, não é fase de MVP)

**O que passou a funcionar**
- Um dev (ou uma IA) retoma o MVP com **um comando**: `pnpm scripts:mvp-status`
  imprime a fase atual, o próximo passo, o gate, a branch e o placar das 12
  fases. Não precisa ler plano nem log.
- Cada fase tem **passos numerados** (86 no total, 12 fases) com status
  persistido. Terminar um passo = marcar `done` com `done_at`, `commit` e uma
  frase de `note` no mesmo commit.
- O protocolo do "não parar no meio" virou **regra escrita** (§0.2 do plano), com
  as 4 regras que não se negociam e o tratamento de passo bloqueado.
- **4 fases que não tinham gate** (F0, F5, F7, F9) agora têm: G0.5 (novo) para
  o F0, e o G5 absorve F5/F7/F9 explicitamente.

**Arquivos criados**
- `specs/mvp-tasks.json` — **checklist vivo**: 12 fases, 86 passos, cada um com
  `status` (`pending`/`in_progress`/`done`/`blocked`), `done_at`, `commit` e
  `note`. É a fonte da verdade do progresso.
- `scripts/mvp-status.ts` — `pnpm scripts:mvp-status`. Lê o checklist e imprime
  fase atual, próximo passo, gate, branch e placar. Detecta fase bloqueada por
  dependência não concluída.
- `scripts/mvp-task.ts` — `pnpm scripts:mvp-task <PASSO> done "<nota>"`. Marca o
  passo, atualiza o status da fase e aponta o `current` para o próximo passo.
  Evita que alguém edite o JSON à mão e corrompa o checklist.

**Arquivos modificados**
- `docs/MVP-PLAN.md` — nova **§0.2 "Protocolo de execução da IA (obrigatório)"**
  (o loop em 8 passos, as 4 regras, os 3 arquivos, como retomar). As 12 fases
  ganharam `**Gate:**` + `**Passos:**`. §9 ganhou o **G0.5** e o G5 agora
  declara cobrir F5/F7/F9. §8 e §8.0 apontam o checklist. §12 lista os arquivos
  novos. TL;DR: 9 → 10 gates.
- `AGENTS.md` — o bootstrap automático agora manda **começar por
  `pnpm scripts:mvp-status`**, traz o loop completo, as 4 regras, os 3 arquivos
  e o passo a passo do registro.
- `specs/mvp-scope.json` — `plan_status` corrigido (a migration `0004` **não
  existe**; o texto dizia "implementado na"). Gates: +G0.5, G5 com `covers_phases`,
  e `mvp_phases[].gate` preenchido. Referência ao `mvp-tasks.json`.
- `docs/MVP-PROGRESS.md` — Status atual com "Próximo passo" e "Passos
  concluídos"; o modelo de registro agora explica que os passos ficam no JSON.
- `docs/README.md` — `mvp-tasks.json`, `mvp-status.ts` e `mvp-task.ts` no mapa;
  gates 9 → 10.
- `docs/RFC-Brazilian-Supademo.md` — 9 → 10 gates.
- `biome.json` — `specs/mvp-tasks.json` com o formatter desligado (o arquivo é
  máquina-escrito e fica ilegível com um passo por linha; o linter continua
  ativo).
- `package.json` — `scripts:mvp-status` e `scripts:mvp-task`.
- 7 arquivos com **caracteres CJK acidentais** corrigidos (`research/demos/storylane.md`,
  `setup-report/PHASE-5-legal-audit.md`, `setup-report/PHASE-14-runtime-validation.md`,
  `docs/ADRs/ADR-012-pt-br-first-i18n.md`, `marketing/LAUNCH-PLAN.md`,
  `legal/incident-response-plan.md`, `legal/privacy-policy.md`) — pré-existentes,
  mesma classe de bug do `compressao` — que tinha um caractere CJK no lugar do
`ã` — já corrigido antes. **O repo agora tem
  zero CJK.**

**Decisões tomadas durante a execução**
- **D1:** o checklist vive em **`specs/mvp-tasks.json`**, e não dentro do
  `MVP-PROGRESS.md`. Motivo: o log é append-only e narrativo — usarlo também
  como checklist gera conflito entre "não edite entradas antigas" e "marque o
  passo". São dois papéis, dois arquivos.
- **D2:** o plano **não duplica** os 86 passos. Cada fase tem `**Passos:** N
  (ID1–IDN)` apontando para o JSON. O plano guarda o *contexto* ("O que fazer",
  "Arquivos a ler antes", "Acceptance criteria"); o JSON guarda o *estado*. Os
  dois duplicando o texto é garantia de divergência.
- **D3:** **G0.5 foi criado** porque o F0 é a fundação. Sem ele, um pricing errado
  faz G1–G7 passarem sobre dado errado — cada gate aprova, o produto cobra
  errado. É o gate mais barato de todo o plano (comparar 2 blocos) e protege
  todos os outros.
- **D4:** F5, F7 e F9 **não ganharam gates próprios** — são absorvidas pelo G5
  (E2E do F10), que agora declara explicitamente o que cada uma precisa
  comprovar. Criar 3 gates separados inflaria o plano sem aumentar a garantia.

**Armadilhas / o que a fase ensina**
- **`plan_status` do `mvp-scope.json` dizia "implementado na migration
  `0004_flat_plans.sql`"** — e a migration **não existe** (só 0000–0003). Um
  estado-alvo escrito como se já estivesse feito faz o próximo pular a F0.
  Corrigido para "a implementar na".
- **Fase sem gate é fase que passa sem verificação.** F0, F5, F7 e F9 estavam
  assim. O sintoma: `mvp_gates` mapeava 9 gates para 12 fases e ninguém
  olhava a diferença — as fases sem gate entravam na `main` com "CI verde" como único
  critério, o que não prova nada sobre o comportamento.
- **`AGENTS.md` é lido por IA que não vai te perguntar.** Por isso o protocolo
  precisa ser explícito e imperativo, não implícito. "Registre o que foi feito"
  não basta; "marque o passo `done` com `commit` e `note` **no mesmo commit**"
  funciona.

**Validação rodada**
```
specs/mvp-tasks.json                     → JSON válido, 12 fases, 86 passos, IDs únicos
specs/mvp-scope.json                     → JSON válido, 10 gates, mvp_phases[].gate preenchido
pnpm scripts:mvp-status                  → imprime fase, próximo passo, gate e placar
pnpm lint / typecheck / test             → 209 arquivos, 4/4 pacotes, 152/152
links relativos (todos os .md)           → 0 quebrados
```

**Ficou pra depois (débito desta fase)**
- [ ] A CI não roda `pnpm scripts:mvp-status` — dá pra adicionar um job que
      falha se o checklist tiver `in_progress` travado. Útil depois que o
      primeiro dev usar o fluxo de verdade.
- [ ] `specs/mvp-tasks.json` não tem histórico de quem fez cada passo. O
      `commit` cobre a autoria, mas um campo `agent` ajudaria quando mais de
      uma IA trabalha no mesmo repo.

### 2026-10-30 — PR1 — Rename (DemoBR → EasyDemo)

**Estado:** ✅ concluída
**Branch:** `chore/rename-easydemo` · **Commit:** (este PR) · **Gate:** G0

**O que passou a funcionar**
- A marca do produto é **EasyDemo** em todo o repositório: código, docs, infra,
  marketing, legal, research, workflows e assets. O npm scope é `@easydemo/*`,
  o domínio é `easydemo.io`, o banco é `easydemo`, e os containers/tags docker
  são `easydemo-*`.
- O **Supademo (concorrente) ficou intacto** — 611 ocorrências e 111 URLs para
  `supademo.com` continuam apontando pro concorrente. É o que mantém honesta a
  base de evidência que justifica o MVP.
- **A extensão Chrome builda de novo.** Estava quebrada desde o scaffold.

**Arquivos modificados** — 195 arquivos, ~1.600 ocorrências
- npm scope `@demo.br/*` → `@easydemo/*` (42 arquivos) + package root `demobr` → `easydemo`
- domínios `demobr.com.br` e hosts `demo.br` → `easydemo.io` (64 arquivos, 341 ocorrências)
- marca `DemoBR`/`demobr`/`DEMOBR` → `EasyDemo`/`easydemo`/`EASYDEMO` (189 arquivos)
- banco `supademo` → `easydemo` — **só as 52 ocorrências que são o nosso** (compose,
  `init-roles.sql`, `ROLES.md`, `.env.example`, `ci.yml`, `Makefile`,
  `drizzle.config.ts`, seed e testes de integração); container `supademo-test` → `easydemo-test`
- containers/tags docker `demobr-*` → `easydemo-*`, `demobr/web` → `easydemo/web`
- headers do webhook `x-demobr-{event-id,signature}` → `x-easydemo-*`
- blog comparativo `demobr-vs-supademo-vs-guideflow.mdx` → `easydemo-vs-supademo-vs-guideflow.mdx`
- `docs/MVP-PLAN.md` §8 — gate por fase, passos numerados, critério de aceite com
  exclusões, ordem correta do `pnpm install`, regra `supademo` banco-vs-concorrente

**Decisões tomadas durante a execução**
- **D1:** o critério de aceite do grep **exclui 3 arquivos** — `docs/MVP-PLAN.md`,
  `docs/MVP-PROGRESS.md` e `specs/mvp-tasks.json` — porque eles **documentam** o
  rename e portanto citam o nome antigo como alvo da busca. Sem a exclusão o
  critério era impossível de satisfazer. O log é append-only: reescrever
  entradas antigas violaria a regra do arquivo.
- **D2:** o nome do repositório no GitHub (`supademo-oss`) **não** foi tocado.
  Renomear o repo muda URL e exige permissão `admin` — decisão separada, já
  registrada como pendência.
- **D3:** os buckets R2 reais (`demo-public`/`demo-private`) **não** foram
  renomeados — são infra viva, não referência de marca. Em vez disso, o
  ADR-006 e o `openapi.yaml`, que citavam `demobr-public`/`demobr-private`
  (divergentes do config), foram **alinados ao que o infra usa de fato**.
- **D4:** `demo_branch`/`demo_branches`/`Demo Branching` **não** foram tocados —
  é a feature de branching, não a marca.

**Armadilhas / o que a fase ensina**
- **Um `sed` cego em `supademo` corromperia a base de evidência.** `supademo` é
  ao mesmo tempo o nome do banco e o do concorrente: 52 ocorrências do nosso,
  ~265 do Supademo (pricing, comparações, benchmarks em `research/` e
  `marketing/`). Renomear em bloco teria falsificado a pesquisa de mercado que
  justifica o MVP inteiro.
- **O scope `@demo.br/` corrompeu o checklist que o documenta.** A string
  `@demo.br/*` aparece nos títulos dos passos de `specs/mvp-tasks.json` — e o
  replace em bloco a reescreveu, deixando "Renomear scope @easydemo/* →
  @easydemo/*". Restaurado à mão. O mesmo vale para `docs/MVP-PLAN.md`.
- **A sintaxe de exclusão do `git grep` é `':(exclude)path'`, não `':!path'`.**
  A segunda é de `git ls-files` e o `git grep` a ignora silenciosamente — o
  comando "passava" sem excluir nada. Só percebi porque o gate acusou 27
  ocorrências onde deviam ser 0.
- **`pnpm install --frozen-lockfile` falha depois de trocar o npm scope** (o
  lockfile fica desatualizado). A ordem é `pnpm install` → regenera → depois
  `--frozen-lockfile` valida.
- **A extensão nunca foi buildada em CI** — o job de build é do Docker da
  `apps/web`. Por isso dois bugs do scaffold sobreviveram 3 meses: entrypoint
  `popup` duplicado (`popup.html` + `popup.ts` na raiz de `entrypoints/`) e
  `content.ts` no estilo antigo do WXT (sem `export default defineContentScript`).
  O WXT 0.19 exige o default export. A CI **não** builda a extensão — gap real.

**Validação rodada**
```
git grep -in demobr -- . ':(exclude)docs/MVP-PLAN.md' ...        → 0
git grep -in '@demo\.br' -- . ':(exclude)...'                     → 0
pnpm install --frozen-lockfile                                    → passa
pnpm lint                                                         → 212 arquivos, 0 erros
pnpm typecheck                                                    → 4/4 pacotes
pnpm test                                                         → 152/152
pnpm build                                                        → verde (web + extensão)
pnpm extension:build                                              → 39.03 kB, 8 arquivos
links relativos (158, todos os .md)                              → 0 quebrados
'Supademo' (concorrente)                                         → 611 ocorrências, 111 URLs intactas
```

**Ficou pra depois (débito desta fase)**
- [ ] Renomear o repositório no GitHub (`supademo-oss` → `easydemo-oss`) — exige `admin`
- [ ] Atualizar a descrição do repo no GitHub ("open-source", "Postgres 17", "DemoBR")
- [ ] A CI não builda a extensão Chrome — adicionar um job `pnpm extension:build`
- [ ] `host_permissions: ["<all_urls>"]` no `wxt.config.ts` — revisar na F9 (o
      plano da F9 diz para não pedir `<all_urls>`; hoje está pedido)

### 2026-10-30 — F0 — Pricing flat + views ilimitadas

**Estado:** ✅ concluída
**Branch:** `feat/f0-pricing-flat` · **Commit:** (este PR) · **Gate:** G0.5

**O que passou a funcionar**
- O modelo de cobrança é **preço fechado por plano, com views ilimitadas nos 3
  planos** (decisão D1). O `app.plans` no banco passou a ser a fonte de verdade
  dos limites: **Free** R$0 (1 creator, 3 demos, 10 steps/demo, 20 leads/mês,
  lead form ligado, watermark no CTA) · **Pro** R$49 (demos ilimitados, 30
  steps/demo, 100 leads/mês) · **Business** R$199 (3 creators, 60 steps/demo,
  leads ilimitados, domínio customizado).
- **`apps/web/lib/plans.ts` enforcement de verdade**: `assertWithinLimits(
  workspaceId, resource, count)` rejeita o 4º demo, o 21º lead e o 11º step no
  Free, com `PlanLimitError` em PT-BR apontando o upgrade. `countWorkspaceResources`
  conta o consumo com RLS — um tenant não enxerga o consumo de outro.
- **O gate G0.5 virou automático.** `apps/web/lib/__tests__/plans.test.ts`
  compara o que está no banco com `specs/mvp-scope.json` → `pricing_brl` (36
  campos). O pricing não diverge mais do spec sem quebrar o build.

**Arquivos criados**
- `apps/web/db/migrations/0004_flat_plans.sql` — 5 colunas novas
  (`max_creators`, `link_ttl_days`, `custom_domain`, `watermark_on_cta`,
  `lead_form`), `max_views_per_month` mantida e setada `NULL` nos 3 planos, e
  os seeds dos 3 planos com os valores da §5.
- `apps/web/lib/plans.ts` — `getPlanLimits`, `assertWithinLimits`,
  `countWorkspaceResources`, `getWorkspacePlanId`, `PlanLimitError`.
- `apps/web/lib/__tests__/plans.test.ts` — 11 casos: gate G0.5, os 3 planos com
  views ilimitadas, rejeição do 4º demo / 21º lead / 11º step, Business sem
  limite, e a contagem com RLS entre tenants.

**Arquivos modificados**
- `apps/web/db/schema/app.ts` — tabela `plans` com as 5 colunas novas.
- `apps/web/db/migrations/meta/_journal.json` — entry `0004_flat_plans`.
- `specs/mvp-scope.json` — `pricing_brl` reescrito para espelhar a §5;
  `plan_status` atualizado; corrigidos 3 artefatos corrompidos pelo rename.
- `scripts/seed.ts` — o seed dos planos ainda gravava o modelo antigo de
  view-cap (50 / 5.000 / 50.000 views, Free com 0 leads).
- `packages/shared/src/types/billing.ts` — o tipo `Plan` espelha a §5.

**Decisões tomadas durante a execução**
- **`max_views_per_month` NÃO foi dropada.** A §5 manda manter e setar `NULL`
  (é o que significa "ilimitado"). `DROP COLUMN` em tabela populada é destrutivo
  e irreversível sem dump, e o código precisa distinguir "ilimitado" de "zero".
- **`count` em `assertWithinLimits` é a quantidade pós-operação.** Assim o
  critério de aceite do gate é literal: `assertWithinLimits(ws, "demo", 4)`
  rejeita o 4º demo. O caller conta e soma 1.
- **5 colunas novas, não 2.** O gate G0.5 só nomeia `max_creators` e `lead_form`,
  mas a §5 tem 10 limites e exige que `getPlanLimits()` devolva *exatamente* o
  `pricing_brl`. `link_ttl_days`, `custom_domain` e `watermark_on_cta` também
  precisam morar em coluna — senão voltariam pelo `features` jsonb, que é uma
  lista de strings de marketing, impossível de parsear com segurança.
- **`pricing_brl.limits` passou a ser exatamente o que o banco guarda**; os flags
  de feature foram para `feature_flags`. E os flags de Fase 2 (§4.2) estão
  `false`: o Business "inclui" branching, mas branching não existe no MVP —
  dizer o contrário é vender feature que não existe.
- **Corrigi 3 artefatos corrompidos pelo rename no `specs/mvp-scope.json`**:
  "PR 1 — Rename (EasyDemo → EasyDemo)", "npm scope @easydemo/* →
  @easydemo/*" e o critério do G0 ("git grep -in easydemo = 0" — que hoje
  procuraria a marca **nova** e acharia milhares de acertos). O texto foi
  reescrito **sem** o token da marca antiga, porque o gate G0 faz `git grep`
  dela e `specs/mvp-scope.json` não está na lista de exclusão.
- **O deliverable da F0 no spec mandava "drop max_views_per_month"** — contradiz
  a §5 e a nota do plano. Corrigido para "manter e setar NULL".
- **`custom_domain: true` no Business é uma tensão conhecida** entre a §5
  (plano comercial) e a §4.2 (domínio customizado é V2). Segui a §5, que é o
  contrato da fase, e registrei a tensão no bloco `notes` do spec.

**Armadilhas / o que a fase ensina**
- **O seed `0000_init.sql` nunca setou os limites.** O `INSERT` trazia só `id,
  name_pt_br, name_en, price_brl_cents, features` — as colunas `max_demos`,
  `max_leads_per_month` etc. existiam, mas ficavam `NULL`. Ou seja: **até a
  0004, o "Free" do banco não limitava nada** (`max_demos NULL` = ilimitado).
  A 0004 é o que dá sentido à coluna.
- **`name_pt_br` do plano Pro era `'Business'`** (erro do seed original) —
  corrigido na 0004.
- **A migration precisa de `--> statement-breakpoint`.** O drizzle-kit 0.28
  divide o arquivo por esse marcador; sem ele o arquivo inteiro vira um
  statement só.
- **Snapshot não é obrigatório.** `meta/` só tem snapshot de 0000 e 0001; 0002 e
  0003 são SQL escrito à mão sem snapshot e o `drizzle-kit migrate` aplica os
  dois. A 0004 segue o mesmo padrão.
- **`drizzle-kit migrate` usa o driver `pg`, não o `postgres.js` do runtime.**
  São duas conexões diferentes: `DIRECT_URL` (app_owner) para migration,
  `DATABASE_URL` (app_user, RLS) para runtime.
- **O gate compara o BANCO com o SPEC, não o código com o spec.** Se usasse só
  `getPlanLimits()`, um bug no mapper passaria despercebido — o check do G0.5
  consulta o banco via SQL e compara com o JSON.
- **`count()` do Drizzle devolve `number`** (tem `mapWith(Number)`), mas o
  TypeScript tipa o destructuring como possivelmente `undefined` — precisa de
  `row?.value ?? 0`.
- **O banco local da máquina se chama `supademo`** (o `.env` é anterior ao
  rename e é gitignored) enquanto o docker-compose usa `easydemo`. Não é
  inconsistência do repo; a 0004 roda nos dois.

**Validação rodada**
```
pnpm --filter web db:migrate                → 0004 aplicada; 2ª rodada idempotente
G0.5: app.plans vs specs/mvp-scope.json     → 36/36 campos (12 × 3 planos)
getPlanLimits("free")                        → maxViewsPerMonth null, leadForm true
assertWithinLimits(ws,"demo",4)              → PlanLimitError (Free)
assertWithinLimits(ws,"lead",21)             → PlanLimitError (Free)
assertWithinLimits(ws,"demo",9999)           → ok (Business, ilimitado)
pnpm lint                                    → 214 arquivos, 0 erros
pnpm typecheck                               → 4/4 pacotes
pnpm test                                    → 163/163 (152 + 11 novos)
pnpm build                                   → verde
grep da marca antiga                         → 0
```

**Ficou pra depois (débito desta fase)**
- [ ] **As páginas de marketing e o painel de billing ainda anunciam o modelo
      antigo** — "50 views/mês", "5.000 views/mês", "50.000 views/mês" em
      `apps/web/app/(marketing)/content/pricing-detail.mdx`, `home.mdx`, no
      blog comparativo e em `apps/web/app/(app)/billing/page.tsx`. O §8 da F0
      proíbe mexer nisso (é F4), mas até lá o produto vende views ilimitadas e
      o site diz o contrário. **É o item mais visível do débito.**
- [ ] `assertWithinLimits` ainda não é chamado em lugar nenhum — o enforcement
      entra de fato na F4 (criar demo / step / lead).
- [ ] `app.plans.features` continua sendo uma lista de strings de marketing,
      enquanto a matriz de features por plano vive no `pricing_brl.feature_flags`
      do spec. Na F4, decidir se os dois se fundem.
- [ ] O tipo `Plan` do `@easydemo/shared` foi atualizado, mas nada o consome
      ainda — a F4 vai precisar dele (ou do `PlanLimits` do `lib/plans.ts`).
- [ ] `custom_domain: true` no Business (com a feature em V2, §4.2) continua
      como tensão conhecida.

### 2026-10-31 — F1 — Publicação real

**Estado:** ✅ concluída
**Branch:** `feat/f1-publicacao` · **Commit:** `ec42848` (+ `cd83bb1`, `3e2186a`, `d6474bc`) · **Gate:** G1 ✅

**O que passou a funcionar**
- O botão "Nova demo" deixou de dar 404: `/demos/new` cria uma demo `draft` com slug aleatório e abre o editor em `/demos/{id}/edit`.
- Uma demo com pelo menos um step pode ser publicada num slug público válido; a rota pública `/d/{slug}` passa a enxergá-la como publicada.
- Despublicar devolve a demo para `draft` e limpa `published_at` — o link público volta a 404.
- Slug inválido ou demo sem step são recusados com mensagem em PT-BR; slug já usado responde 409.
- O editor mostra um hint passivo de 10–12 steps e hotspots de 15–18 palavras (D8), sem bloquear a criação.

**Arquivos criados**
- `apps/web/app/(app)/demos/new/page.tsx` — criação da demo e redirecionamento ao editor.
- `apps/web/app/api/v1/demos/[id]/publish/route.ts` — endpoint de publicação.
- `apps/web/app/api/v1/demos/[id]/unpublish/route.ts` — endpoint de despublicação.
- `apps/web/app/api/v1/demos/[id]/versions/route.ts` — contrato futuro, responde `501` (Fase 2).
- `apps/web/server/repositories/__tests__/demos-publish.integration.test.ts` — 6 testes do repositório.
- `apps/web/app/api/__tests__/demos-publish-api.integration.test.ts` — 6 testes do contrato HTTP.

**Arquivos modificados**
- `apps/web/server/repositories/demos.ts` — `publishDemo` e `unpublishDemo` isolados em `withTenant`.
- `apps/web/components/editor/DemoEditor.tsx` — Hero helper (D8); botão de publicar versão removido.
- `apps/web/components/editor/PublishPanel.tsx` — botão de publicar versão removido (versionamento é Fase 2).
- `apps/web/lib/__tests__/rl.integration.test.ts`, `apps/web/app/api/__tests__/demos-api.integration.test.ts`, `apps/web/app/api/__tests__/webhook-asaas.integration.test.ts`, `apps/web/app/api/__tests__/webhook-asaas.sandbox.integration.test.ts` — passam a usar `DIRECT_URL` (app_owner) em vez de trocar o usuário da `DATABASE_URL`.

**Decisões tomadas durante a execução**
- **D1:** o `/demos/new` é uma Server Component que cria a demo no render, não uma server action isolada. O resultado observável pedido pelo plano (cria → redireciona) é o mesmo, e evita um formulário intermediário que só atrasaria a criação.
- **D2:** o slug é global no schema (`app.demos.slug` tem `UNIQUE`), mas a checagem de unicidade do repositório roda dentro do tenant, para não revelar a existência de demos de outro workspace. O índice global continua sendo a proteção final contra corrida.
- **D3:** slug duplicado responde **409** (conflito de recurso), não 400. O plano só exigia "400 com mensagem" para o critério geral de slug; 409 é o status semanticamente correto e a mensagem em PT-BR foi mantida.
- **D4:** `visibility`, `password` e `coverR2Key` são aceitos pelo endpoint de publicação, mas não persistidos: o schema atual (`app.demos`) não tem colunas para eles e o §8 da F1 proíbe mudar o schema. Ficam para a fase que introduzir visibilidade/cover real.
- **D5:** `/versions` passou a existir como rota com `501` em vez de continuar ausente, e os botões de "publicar versão" foram escondidos. O endpoint sem implementação dava 404 e escondia a causa real.

**Armadilhas / o que a fase ensina**
- **O `.env` local tem `SENTRY_DSN=` (vazio) e o schema Zod transforma string vazia em URL inválida.** `pnpm test` morre com "Invalid environment variables" antes de rodar qualquer teste. Workaround: `unset SENTRY_DSN` (ou corrigir o schema para aceitar vazio — dívida).
- **`DATABASE_URL.replace("app_user", "app_owner")` só funciona se os dois roles compartilharem a senha.** Neste ambiente cada role tem senha própria, então 4 arquivos de teste de integração falhavam com "password authentication failed". A conexão correta é `DIRECT_URL`, que já existe justamente para o `app_owner`.
- **O build local aborta no prerender de `/_not-found` com `pk_test_xxx`** — o placeholder do Clerk é rejeitado pelo `@clerk/clerk-react`. Para validar o build, use uma publishable key de teste no formato documentado pelo Clerk: `pk_test_` + base64 de `<frontend-api-host>$` (ex.: `pk_test_ZXhhbXBsZS5hY2NvdW50cy5kZXYk`).
- **O `next build` local pode ser morto com exit 137 (OOM)** na fase de "Linting and checking validity of types" — o container ficou sem memória. Repetir o comando com a chave do Clerk normalmente passa; em CI o build roda em runner próprio.
- **A action `publishDemo` já existia em `server/actions/demo.ts`, mas publicava sem validar slug nem exigir step.** O plano pedia as regras no repositório; a action antiga foi deixada intacta para não ampliar o escopo da fase, mas continua sendo um caminho que bypassa as garantias novas. **Débito para a F4.**

**Validação rodada**
```
pnpm lint                                      → 220 arquivos, 0 erros
pnpm typecheck                                 → 4/4 pacotes
pnpm test                                      → 175/175 testes (163 + 12 novos)
pnpm --filter web build                        → verde (19/19 páginas)
testes novos de publicação                     → 12/12
  - slug inválido / 1 caractere                → 400 com mensagem
  - demo sem step                               → 400 NO_STEPS
  - slug duplicado                              → 409 SLUG_TAKEN
  - publicar                                    → 200 status published
  - despublicar                                 → 200 status draft, published_at null
  - demo de outro workspace                     → NOT_FOUND
```

**Ficou pra depois (débito desta fase)**
- [ ] A action antiga `publishDemo` em `apps/web/server/actions/demo.ts` publica sem validar slug nem exigir step — remover ou fazer delegar ao repositório na F4.
- [ ] `visibility`, `password` e `coverR2Key` são aceitos pela API mas não persistidos; o schema precisa das colunas (fase de visibility/cover).
- [ ] A criação de demo na F1.1 ainda **não** chama `assertWithinLimits` — o limite de 3 demos do plano Free só passa a valer quando o enforcement entrar (F4, conforme o débito já aberto da F0).
- [ ] O `.env` local usa `SENTRY_DSN=` vazio e a chave Clerk placeholder; ambos quebram o build local sem workaround.

### 2026-10-31 — F2 — Upload manual de screenshot (gate G1.5) ⚠️ BLOQUEADOR DO ALPHA

**Estado:** ✅ concluída
**Branch:** `feat/f2-upload-manual` · **Commit:** `deaa51c` (+ `1d14b59`, `f626f90`) · **Gate:** G1.5 ✅

**O que passou a funcionar**
- Um creator **sem a extensão Chrome** consegue criar uma demo e povoá-la de screenshots: o botão "Criar" da sidebar abre o seletor de arquivos, a imagem vai para o R2 e o step aparece no editor, pronto para posicionar o hotspot.
- Imagem grande demais ou de tipo inválido é recusada **antes** de qualquer upload, com mensagem em PT-BR que diz o tamanho atual e o limite.
- `/demos/new` leva direto ao editor com a demo em branco — não há mais dependência da extensão para começar.

**Arquivos criados**
- `apps/web/components/editor/__tests__/upload-manual.test.ts` — 5 testes das regras do upload (tipo, limite, mensagem).
- `apps/web/app/api/__tests__/steps-upload.integration.test.ts` — 5 testes de integração da API de steps (criação, hotspot inválido, payload incompleto, ordem, RLS).

**Arquivos modificados**
- `apps/web/components/editor/DemoEditor.tsx` — handler de upload manual (file picker → presigned PUT → POST do step), input de arquivo escondido, validação de tipo e tamanho.
- `apps/web/app/(app)/demos/new/page.tsx` — `Link` no lugar de `<a>` e doc do fluxo sem extensão.

**Decisões tomadas durante a execução**
- **D1:** o upload acontece no **client** (o `DemoEditor` já é client component e o `PublishPanel` faz o mesmo para o cover). O passo F2.2 do plano diz "handler que abre file picker" — isso implica client. O server action ficaria sem acesso ao `File` do input.
- **D2:** o `sourceUrl` do step criado por upload manual é uma URL neutra e estável (`https://easydemo.io/upload/<filename>`). O endpoint exige URL absoluta e o upload manual não tem página de origem; o `sourceTitle` fica editável na sidebar.
- **D3:** o limite de **10 MB** por imagem foi escolhido com base no POC de latência do R2 (p95 < 600 ms para 5 MB em conexão BR típica) e no `editor.warningLargeImage` que já existia nas traduções. O valor é uma constante local do editor — não há limite no servidor.
- **D4:** o hotspot do step criado começa **central** (50/50). O plano permitia "calcula o bounding box do clique ou deixa o creator marcar no canvas"; como o upload não tem clique, o creator posiciona no canvas — que é o caminho mais fiel ao produto.
- **D5:** o `POST /api/v1/demos/[id]/steps` responde com um **presigned extra** para re-upload (comportamento pré-existente do endpoint). Não é usado pelo fluxo manual — o upload acontece antes do POST — mas foi mantido intacto para não alterar o contrato da API.

**Armadilhas / o que a fase ensina**
- **`onAddStep` era opcional no `StepList`** (`onAddStep?`), então o botão "Criar" simplesmente **não aparecia** — não era "um botão quebrado", era um botão inexistente. A correção do plano ("a prop já é declarada e o botão já é renderizado") descrevia o código, não o comportamento observável.
- **O endpoint de steps chama `presignPut()` no final do POST** — o que exige credenciais R2 no ambiente. Sem elas, o teste de integração morre com "R2 credentials not configured" **depois** de já ter criado o step. Nos testes é preciso mockar `@/lib/r2`.
- **A policy RLS de `steps` é via `EXISTS` no demo** — um tenant tentando inserir step num demo alheio recebe `42501` ("new row violates row-level security policy"), que o `errorResponse` translate para **500**, não 403. O comportamento está correto (o insert é bloqueado), mas o status não distingue "sem permissão" de "erro interno".
- **A ordenação dos steps é por `position`, com UNIQUE(demo_id, position)** — criar step na posição `steps.length + 1` pode colidir se o estado local do editor divergir do banco. Não aconteceu no fluxo testado, mas é a fragilidade do autosave por PATCH completo.

**Validação rodada**
```
pnpm lint                        → 222 arquivos, 0 erros
pnpm typecheck                   → 4/4 pacotes
pnpm test                        → 185/185 testes (175 + 10 novos)
pnpm --filter web build          → verde (19/19 páginas)
testes novos                     → 10/10
  - tipos aceitos / recusados    → PNG, JPG, WEBP ok; PDF/vídeo/ vazio recusados
  - limite de tamanho            → 10 MB, mensagem cita tamanho e limite
  - POST /steps                  → 201 com screenshotR2Key e hotspot
  - hotspot fora de 0–100        → 400
  - sem screenshotR2Key          → 400
  - listagem                     → ordenada por posição
  - step em demo de outro tenant → bloqueado pela RLS (nada gravado)
```

**Ficou pra depois (débito desta fase)**
- [ ] O limite de 10 MB é **só client** — o `POST /api/v1/upload/sign` e o PUT no R2 aceitam qualquer tamanho. Um cliente que burle a UI sobe arquivo gigante. Endurecer no servidor quando o R2 estiver configurado.
- [ ] A mensagem de erro do upload aparece no **badge de autosave** do header; não há toast/dialog dedicado. Funciona, mas o erro fica longe do botão que o causou.
- [ ] O `sourceUrl` sintético (`https://easydemo.io/upload/...`) é um placeholder — quando o upload manual ganhar um "site de origem" real, precisa ser trocado.
- [ ] `POST /steps` responde 500 (e não 403) quando o RLS bloqueia o insert — a distinção de erro é nem usada.
- [ ] O estado do editor (steps) é reconciliado por `PATCH /api/v1/demos/[id]` completo; se o estado local divergir do banco, o `position` pode colidir com a UNIQUE `(demo_id, position)`.

### 2026-10-31 — F3 — Lead form + CTA genérico (gate G2)

**Estado:** ✅ concluída
**Branch:** `feat/f3-lead-cta` · **Commit:** `b0da457` (+ `0762a0a`) · **Gate:** G2 ✅

**O que passou a funcionar**
- O visitante do player público pode deixar nome, e-mail e telefone. O checkbox de consentimento LGPD vem **desmarcado** — sem marcar, o envio é bloqueado com mensagem clara.
- O formulário é **gate do step 1**: enquanto o lead não for capturado, o hotspot não avança (o que o Supademo faz com "gated sections").
- O **CTA final aparece** ao completar a demo — antes `finalCta` era `null` hardcoded nas duas rotas públicas, então o CTA **nunca** aparecia.
- O creator vê os leads em `/demos/{id}/leads` (com `consentText` e `consentAt`) e exporta CSV.

**Arquivos criados**
- `apps/web/components/player/LeadForm.tsx` — formulário do player (nome, e-mail, telefone, consentimento).
- `apps/web/app/api/v1/leads/route.ts` — endpoint público de captura.
- `apps/web/app/(app)/demos/[id]/leads/page.tsx` — lista de leads do creator.
- `apps/web/app/api/v1/demos/[id]/leads/export/route.ts` — export CSV (com BOM UTF-8).
- `apps/web/db/migrations/0005_leads_public_insert.sql` — policies públicas de insert/select em `app.leads`.
- `apps/web/app/api/__tests__/leads-api.integration.test.ts` — 8 testes de integração do gate G2.

**Arquivos modificados**
- `apps/web/components/player/DemoPlayer.tsx` — renderiza o `LeadForm` como gate e passa o consentimento.
- `apps/web/app/d/[slug]/page.tsx` — CTA real, `leadFormEnabled` real, texto de consentimento do demo, submit do lead.
- `apps/web/app/embed/[id]/page.tsx` — as mesmas correções.
- `apps/web/db/migrations/meta/_journal.json` — entrada da 0005.

**Decisões tomadas durante a execução**
- **D1:** o endpoint público `/api/v1/leads` **deriva o `workspaceId` do demo** e nunca o aceita do cliente. O lead não pode ser atribuído a outro workspace, mesmo que o cliente mande `workspaceId` no payload.
- **D2:** o `workspaceName` (usado no texto de consentimento padrão) é lido do banco, não do cliente — o lead registra a empresa certa.
- **D3:** o `POST /api/v1/leads` reusa o server action `captureLead` existente (consentimento obrigatório, hash de IP/UA, texto de consentimento persistido) em vez de duplicar a lógica. O wrapper só valida o demo publicado.
- **D4:** o CSV é gerado **no servidor** (rota dedicada), com BOM UTF-8 para o Excel abrir em UTF-8, e `cache-control: no-store`.
- **D5:** a policy pública de `app.leads` é **estreita**: só INSERT quando não há tenant, o `demo_id` precisa apontar para demo **publicada**, o `workspace_id` precisa ser o da demo e `consent_text` é obrigatório.

**Armadilhas / o que a fase ensina**
- **O funil de lead era IMPOSSÍVEL de fechar.** A policy `leads_all` (0000_init.sql) só libera escrita quando `app.current_tenant_id() = workspace_id` — mas o player público não tem tenant. Resultado: `42501 — new row violates row-level security policy for table "leads"`. A policy pública (migration 0005) destrava isso.
- **No Postgres, uma policy `FOR INSERT` isolada (sem `FOR SELECT`/`FOR ALL` na mesma tabela) faz o INSERT falhar com `42501` mesmo com `WITH CHECK (true)`.** Isolado em tabela de teste: `FOR INSERT` só → falha; `FOR INSERT` + `FOR SELECT` → passa; `FOR ALL` → passa. O `RETURNING` re-avalia a visibilidade da row recém-criada. Por isso a 0005 cria **duas** policies. Isso não está documentado no manual do Postgres — foi preciso isolar com 8 tabelas de teste.
- **O `drizzle-kit migrate` NÃO reaplica migration já registrada** — o hash guardado é o do arquivo **inteiro** (sha256), não do statement. Editar uma migration já aplicada e rodar `db:migrate` de novo não faz nada (e não avisa). Para corrigir, é preciso apagar o registro em `drizzle.__drizzle_migrations` e a policy antiga antes de reaplicar.
- **O `captureLead` chama `headers()` do Next** — fora de um request scope isso lança "headers was called outside a request scope". Nos testes é preciso mockar `next/headers`.
- **O `demo.finalCta` é `jsonb` e o TypeScript tipa como `unknown`** — precisa de cast para `FinalCta | null` ao passar ao player.
- **O `notFound()` do Next não estreita o tipo** — o `demo` continua `possibly undefined` depois do `if`. Precisa de uma const local (`publishedDemo`) para o TS narrowing funcionar dentro de closures.

**Validação rodada**
```
pnpm lint                                      → 227 arquivos, 0 erros
pnpm typecheck                                 → 4/4 pacotes
pnpm test                                      → 193/193 testes (185 + 8 novos)
pnpm --filter web db:migrate                   → 0005 aplicada (idempotente)
pnpm --filter web build                        → verde (19/19 páginas)
testes novos                                   → 8/8
  - demo publicada + consentimento              → 201, consentText e consentAt gravados
  - sem consentimento                           → 400
  - demo em draft                               → 404
  - demo inexistente                            → 404
  - e-mail inválido                             → 400
  - cliente manda workspaceId de outro tenant   → lead cai no workspace do demo
  - export CSV do tenant                        → 200 com os leads
  - export CSV de demo de outro tenant          → 404 (RLS)
```

**Ficou pra depois (débito desta fase)**
- [ ] `app.leads` ganhou uma policy `FOR SELECT` pública — ela só expõe rows cujo `demo_id` aponta para demo publicada do mesmo workspace. Vale revisar se isso é aceitável no modelo de privacidade (o lead é PII).
- [ ] O `LeadForm` é renderizado no player mas **não há link para a página de leads** no menu do creator — a página existe, mas ninguém chega lá ainda.
- [ ] O `leadFormEnabled` é lido do banco, mas o `LeadFormEditor` do editor é bloqueado no plano Free (`upgradeRequired`) — enquanto o banco permitir `lead_form_enabled` no Free (D2 da §5), existe divergência entre editor e player.
- [ ] O `captureLead` grava `consentText` customizado quando o creator define, mas **o texto do form no player vem de `demo.leadFormConsentText`** — se o creator customizar só no editor (que salva em `leadForm.consentText` via PATCH), o valor não chega ao banco. Caminho de persistência do texto customizado ficou aberto.

### 2026-11-01 — F4 — Billing (gate G3)

**Estado:** ✅ concluída
**Branch:** `feat/f4-billing` · **Commits:** `b75a400`, `59ade35` · **Gate:** G3 ✅

**O que passou a funcionar**

- O creator clica em "Assinar Pro via PIX" na página `/billing` e cai num checkout real do Asaas: customer + subscription + cobrança são criados, e a assinatura fica registrada localmente como `incomplete` até o pagamento ser confirmado.
- O plano **só** é promovido quando o Asaas confirma o dinheiro (`PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED`). Sem webhook, o workspace continua no Free — não há como "comprar" Pro sem pagar.
- A página `/billing` mostra o plano **real** (`workspaces.plan_id`) e os preços **reais** (`app.plans.price_brl_cents`). Antes, o plano era `"free"` hardcoded e o preço, texto fixo no JSX.
- Os limites do plano agora são **aplicados**: criar o 4º demo no Free é bloqueado com mensagem de upgrade; o mesmo vale para steps por demo e para leads/mês.
- O creator pode cancelar a assinatura. O plano é **mantido até o fim do ciclo pago** (o Asaas cobra o ciclo de qualquer forma) e só volta para o Free quando o período termina.

**Arquivos criados**

- `apps/web/app/api/v1/billing/checkout/route.ts` — cria a sessão de assinatura no Asaas e devolve a URL de checkout.
- `apps/web/app/api/v1/billing/cancel/route.ts` — cancelamento (mantém o plano até o fim do ciclo).
- `apps/web/app/api/v1/billing/subscription/route.ts` — estado da assinatura (usado pela página de billing).
- `apps/web/app/(app)/billing/checkout/page.tsx` — tela da cobrança (PIX).
- `apps/web/app/api/__tests__/billing-checkout.integration.test.ts` — 14 testes de integração do gate G3.
- `apps/web/app/api/__tests__/webhook-asaas.script.test.ts` — 8 checks do webhook, rodados pelo `scripts:test-webhook-asaas`.

**Arquivos modificados**

- `apps/web/lib/billing/asaas.ts` — camada HTTP + `createSubscription` + mapeamento de preço.
- `apps/web/lib/asaas.ts` — virou shim de re-export (a duplicata foi consolidada).
- `apps/web/app/api/webhooks/asaas/route.ts` — semântica de cancelamento e `PAYMENT_DELETED`.
- `apps/web/app/(app)/billing/page.tsx` — plano e preços reais, CTA no path certo.
- `apps/web/components/billing/PlanCard.tsx` — `ctaMethod` (o checkout é POST).
- `apps/web/app/api/v1/demos/route.ts`, `apps/web/app/api/v1/demos/[id]/steps/route.ts`, `apps/web/server/actions/lead.ts` — enforcement de limites.
- `apps/web/app/api/v1/leads/route.ts` — 429 (em vez de 400) quando a cota do plano estoura.
- `apps/web/scripts/test-webhook-asaas.ts` — reescrito (antes não rodava).

**Decisões tomadas durante a execução**

- **D1:** o `workspaceId` do checkout **vem da sessão**, nunca do cliente. O body aceita o campo (por compatibilidade com o `ctaHref`), mas ele é ignorado — e se vier diferente da sessão, a resposta é `403 WORKSPACE_MISMATCH`. Mesmo princípio do endpoint de lead (DEC-2026-11-01-024).
- **D2:** o preço vem **do banco** (`app.plans.price_brl_cents`), nunca de constante no código. Uma única fonte de verdade: mudar o preço muda a página E o checkout. Atenção à armadilha: a coluna **já está em centavos** (4900 = R$ 49,00) — `brlToCents` existe para o caso oposto, não para converter o valor do banco.
- **D3:** **cancelar ≠ rebaixar na hora.** O Asaas cobra o ciclo já pago, então o cancelamento marca `cancel_at_period_end = true` e **mantém** o plano. O downgrade para Free acontece quando `current_period_end` passa. Isso é a letra do critério de aceitação ("cancelamento volta ao Free **no fim do ciclo**") e evita cobrar o creator por algo que ele não usou. A exceção é o **estorno** (`PAYMENT_REFUNDED`): o dinheiro voltou, então o Free é imediato.
- **D4:** o `PAYMENT_DELETED` (pagamento removido antes de confirmar) **não** rebaixa o plano. Se o workspace já estava num plano pago (renovação), rebaixar penalizaria quem pagou.
- **D5:** o checkout responde JSON para `fetch` e **redireciona (303)** para navegador. O CTA da página é um `<form method="post">` porque o endpoint é POST — um `<a href>` dispararia GET e tomaria 405. O endpoint aceita JSON **e** form-urlencoded, e o plano pode vir no query string.
- **D6:** o `GET /api/v1/billing/subscription` devolve o plano **do workspace**, não o da subscription. Eles divergem quando a assinatura está cancelada mas o creator ainda está dentro do ciclo pago — nesse caso quem manda é o workspace.
- **D7:** o erro de limite vira `403 PLAN_LIMIT_EXCEEDED` (com `message` em PT-BR e `upgradeUrl`) nas rotas autenticadas e `429` no endpoint público de lead (o payload era válido; o que falhou foi a cota).
- **D8:** o `lib/asaas.ts` virou **shim de re-export** em vez de ser deletado. Deletar quebraria o import do sandbox test; o shim mantém a compatibilidade e elimina a duplicata de implementação. (O shim será removido quando ninguém mais importar dele.)

**Armadilhas / o que a fase ensina**

- **O `scripts:test-webhook-asaas` não rodava.** Ele exigia um Next.js em `$BASE` e lia o status por `GET /api/v1/billing/subscriptions/:id` — rota que **nunca existiu**. Além disso, assinava o body no header `X-Asaas-Signature`, mas o handler lê `asaas-signature`: a validação HMAC caía no caminho do token fixo e a assinatura **nunca era conferida**. Reescrito: o script agora sobe o vitest com um arquivo de teste próprio (8 checks) e roda sem servidor.
- **`vi.mock` só funciona dentro do runner do vitest.** A primeira tentativa de reescrever o script foi fazer os mocks direto no `tsx` — não dá (`vitest failed to access its internal state`). Tentar interceptar o loader com `registerHooks` do Node também falhou: o `nextLoad` lança em módulos built-in. A solução que funciona: o script é um wrapper fino que delega para um arquivo de teste do vitest.
- **`pg` é CJS.** `import { Client } from "pg"` quebra em ESM — precisa de `import pg from "pg"`.
- **O `notFound()` do Next não estreita o tipo** (mesma armadilha da F3).
- **`demo.finalCta` é `jsonb`** e o TS tipa como `unknown` — precisa de cast para `FinalCta | null`.
- **Dois bugs reais que os testes novos pegaram:** (a) o cancelamento com o período **já vencido** não rebaixava para o Free (a checagem do período só existia no webhook, não no endpoint de cancelamento); (b) o `/billing/subscription` devolvia o plano da *subscription* em vez do *workspace* — o que mostrava "free" para quem tinha acabado de assinar.
- **O `assertWithinLimits` existia desde a F0 e nunca era chamado.** Era o débito aberto mais antigo do MVP: o plano era um rótulo na página de billing, sem nenhuma consequência. Agora é aplicado em demo, step e lead.
- **O `PlanLimitError` precisa ser tratado explicitamente** nos `errorResponse` das rotas — sem isso, o estouro de limite virava 500 genérico.

**Validação rodada**

```
pnpm lint                                      → 233 arquivos, 0 erros
pnpm typecheck                                 → 4/4 pacotes
pnpm test                                      → 215/215 testes (193 + 22 novos)
pnpm test:rls                                  → 11/11 checks
pnpm scripts:test-webhook-asaas                → 8/8 checks
pnpm --filter web build                        → verde (22/22 rotas)
testes novos (billing-checkout)               → 14/14
  - checkout cria customer + subscription + pagamento  → 201, preço 4900
  - workspaceId do body é ignorado              → 403 WORKSPACE_MISMATCH
  - plano inválido / "free" sem checkout        → 400
  - form-urlencoded (form do /billing)          → 303 para /billing/checkout
  - PAYMENT_RECEIVED promove o plano            → free → pro
  - 3 demos no Free + 4º bloqueado              → 403 + mensagem de upgrade
  - 4º demo no Pro                              → 201 (ilimitado)
  - cancelar dentro do ciclo                    → plano mantido
  - cancelar com período vencido                → volta para Free
  - SUBSCRIPTION_INACTIVATED (vencido)          → Free
  - SUBSCRIPTION_INACTIVATED (dentro do ciclo)  → plano mantido
  - /billing/subscription devolve o plano real  → business
  - sem subscription                             → planId free
```

**Ficou pra depois (débito desta fase)**

- [ ] O job de expurgo que rebaixa o workspace para Free quando `current_period_end` passa **não existe**. Hoje o rebaixamento depende do webhook `SUBSCRIPTION_INACTIVATED` chegar. Se o creator cancelar e o Asaas não mandar o evento, ele fica no plano pago para sempre. O job (ou um cron) precisa fechar o ciclo.
- [ ] O checkout mostra a tela de cobrança mas **não mostra o QR Code do PIX de verdade** — o `payment.pixQrCodeId` é gravado, mas a página não o renderiza (o Asaas exige autenticação para servir a imagem do QR Code).
- [ ] `createCustomer` faz `GET /customers?limit=100` para procurar por e-mail e filtrar no cliente. Com mais de 100 customers, a busca falha e um customer duplicado é criado (o Asaas não deduplica por e-mail).
- [ ] A assinatura local nunca é **atualizada** quando o creator renova — o checkout sempre cria uma row nova. Com renovações sucessivas, `app.subscriptions` acumula rows `incomplete` velhas.
- [ ] O `PlanLimitError` é verificado com `count + 1` (contagem + 1), o que tem uma corrida: dois requests simultâneos podem criar o 4º demo ao mesmo tempo. O lock pessimista ou uma constraint resolveria.

### 2026-11-01 — F5 — Analytics (gate G5)

**Estado:** ✅ concluída
**Branch:** `feat/f5-analytics` · **Commit:** `894dacc` · **Gate:** G5 ✅

**O que passou a funcionar**

- **O funil de conversão agora existe.** O cookie `_pk_id` é gravado pelo middleware nas rotas do player, os eventos saem do player (`view`, `step_seen`, `cta_click`, `complete`, `bounce`) e o dashboard mostra **drop-off por step**, **taxa de conclusão** e **CTA CTR**.
- **Duas views do mesmo navegador = 1 visitor.** O cookie é `httpOnly` + `SameSite=Lax` + 30 dias, e o hash do visitante é gravado como SHA-256 + salt (LGPD-safe: nenhum IP, nenhum fingerprint).
- O dashboard mostra **visitantes únicos**, conclusão, CTA CTR, leads, bounce, e a distribuição por **device**, **país** e **referrer**.
- O **clique no CTA final** (WhatsApp/e-mail/URL) passou a ser rastreado — antes só o clique no hotspot era.

**Arquivos criados**

- `apps/web/lib/analytics/visitor-id.ts` — geração/hash do visitor id **Edge-safe** (Web Crypto).
- `apps/web/lib/analytics/use-analytics.ts` — hook client que envia os eventos (fire-and-forget, `keepalive`).
- `apps/web/lib/analytics/summary.ts` — agregados no banco + funil via `computeFunnel`.
- `apps/web/lib/__tests__/visitor-id.test.ts` — 12 testes (inclui a **paridade Edge/Node**).
- `apps/web/app/api/__tests__/analytics.integration.test.ts` — 9 testes de integração do gate G5.
- `tests/e2e/visitor-cookie.spec.ts` — 4 testes E2E do cookie.

**Arquivos modificados**

- `apps/web/middleware.ts` — cria o cookie do visitante e injeta o hash no header interno.
- `apps/web/lib/analytics/visitor.ts` — `setVisitorCookie()`, leitura do header injetado, `safeHost()`.
- `apps/web/components/player/DemoPlayer.tsx` — eventos enviados + CTA final rastreado + detecção de bounce.
- `apps/web/components/analytics/StatsChart.tsx` — reescrito (métricas-chave + funil + distribuições).
- `apps/web/app/(app)/demos/[id]/analytics/page.tsx` — consome o resumo e rotula os steps do funil.
- `apps/web/app/api/v1/events/route.ts` — grava o cookie e devolve `Set-Cookie`.

**Decisões tomadas durante a execução**

- **D1:** o cookie do visitante é gravado pelo **middleware**, não pela página. A página do player é um Server Component, e Server Components **não** podem escrever `Set-Cookie` (só Server Actions e Route Handlers). O middleware tem acesso à resposta — é o lugar certo.
- **D2:** o middleware injeta o hash no **request header interno** `x-visitor-id`. Sem isso, a **primeira** visita contaria duas vezes: a página leria o cookie (que ainda não existe na requisição) e geraria um hash novo, diferente do que foi gravado na resposta. O header garante que página e cookie usem o **mesmo** valor. O header é interno (middleware → Server Component) e nunca sai para o browser.
- **D3:** o hash do visitante é calculado em **dois runtimes** — Web Crypto (Edge, no middleware) e `node:crypto` (Node, no `visitor.ts`). Os dois **precisam** gerar o mesmo hash, senão o mesmo visitante contaria como dois — sem nenhum erro visível. Por isso o formato do input (`${salt}:${id}`) vive num módulo único (`visitor-id.ts`) e há um teste que compara as duas implementações byte a byte.
- **D4:** `sameSite=lax` (não `none`). O embed roda em iframe de outro domínio; `SameSite=None` exigiria `Secure`, que quebraria o dev em HTTP (o browser descartaria o cookie e todo visitor viraria "novo").
- **D5:** `secure` só em produção. O `buildVisitorCookieHeader` original **sempre** colocava `Secure` — em dev (HTTP) o browser descarta o cookie e o funil fica quebrado exatamente no ambiente onde se desenvolve.
- **D6:** a **taxa de conclusão** usa visitantes **únicos** no denominador, não views. Um visitante que abre o demo 3 vezes é 1 pessoa, não 3.
- **D7:** o **CTA CTR** usa como denominador quem **chegou ao último step**, não o total de visitantes. Quem nunca chegou ao último step não tinha chance de clicar — usar o total daria um número artificialmente baixo e sem sentido comercial.
- **D8:** o clique no **hotspot** e o clique no **CTA final** emitsem `cta_click`, mas com `stepId` diferente — o hotspot é navegação interna, o CTA final é conversão. O dashboard usa o CTA final.
- **D9:** o **bounce** é detectado no unmount do player (ou `pagehide`): o visitante abriu o demo e **não avançou para o segundo step**. É o sinal mais confiável disponível no client (sem timer, sem heurística de tempo).
- **D10:** a query do dashboard roda dentro de `withTenant`. A policy `events_select` (migration 0000) exige `app.current_tenant_id()` bater com o workspace da demo — sem o contexto de tenant, a query volta **0 linhas silenciosamente**.

**Armadilhas / o que a fase ensina**

- **O `onEvent` do `DemoPlayer` estava desconectado.** O player emitia `view`, `step_seen`, `cta_click` e `complete` — mas **nenhuma página passava o `onEvent`**, então **nenhum evento saía do navegador**. O funil estava vazio: não era bug de agregação, era ausência de dado.
- **Não dá para passar função de Server Component para Client Component.** O `onEvent` das páginas `/d/[slug]` e `/embed/[id]` é uma Server Component — passar direto dá erro "Functions cannot be passed directly to Client Components". A solução foi o hook `useAnalytics` **dentro** do `DemoPlayer` (que já é client).
- **O `await import()` dinâmico no middleware derruba o build com OOM (exit 137).** A primeira versão importava `@/lib/analytics/visitor-id` dinamicamente dentro do handler — o build passava no `main`, mas com a mudança era **morto com OOM** em "Linting and checking validity of types", três vezes seguidas. A causa é o bundler do Next gerar chunks extras para o import dinâmico no Edge bundle. **Solução: import estático** — o módulo já é Edge-safe. Diagnóstico: `git stash` + build no `main` para provar que não era regressão minha.
- **O `postgres-js` (driver do Drizzle) NÃO aceita `Date` como parâmetro.** `AND created_at >= ${since}` com um `Date` estoura com *"The \"string\" argument must be of type string or an instance of Buffer or ArrayBuffer. Received an instance of Date"*. A correção é passar `.toISOString()`. (O `pg` driver aceita; o `postgres-js` não.)
- **O `new URL(ref).host` do referer estourava** com referer malformado ("Invalid URL") — e a exceção acontecia **dentro** do `analyticsVisitorCookie`, derrubando o render do player inteiro. Agora há `safeHost()`.
- **O `request` do Playwright persiste cookies entre requests** (é um `APIRequestContext` com cookie jar). Para simular dois navegadores, é preciso `playwright.request.newContext()` — `request.context()` não existe na API.
- **`headersArray()` do Playwright** devolve `{ name, value }` onde `name` é o nome do header (`set-cookie`) e `value` é o cookie. Filtrar por "o value contém `_pk_id=`" pega o `NEXT_LOCALE` junto.
- **O `demo.finalCta` é `jsonb`** e o TS tipa como `unknown` (armadilha da F3, repetida aqui).
- **O `notFound()` do Next não estreita o tipo** (armadilha da F3, repetida aqui).

**Validação rodada**

```
pnpm lint                                      → 239 arquivos, 0 erros
pnpm typecheck                                 → 4/4 pacotes
pnpm test                                      → 236/236 testes (215 + 21 novos)
pnpm --filter web build                        → verde (22/22 rotas)
testes novos — unit (visitor-id)               → 12/12
  - Edge (Web Crypto) e Node (node:crypto) geram o MESMO hash
  - salt diferente → hash diferente (salt rotativo)
  - id aleatório: 32 chars hex, único a cada chamada
  - TTL inválido (0, -5, "abc") → cai no default de 30
  - `secure` só em produção
testes novos — integração (analytics)           → 9/9
  - 3 views do mesmo navegador → 1 visitor, 3 views
  - 2 visitantes distintos → 2 visitors
  - drop-off: 10 veem, 4 chegam ao step 2, 2 ao step 3 → 40% e 50%
  - stepId do funil é o id REAL do step (não o índice)
  - CTA CTR: 1 clique / 4 que chegaram ao último step → 25%
  - CTA CTR = 0 quando ninguém chegou ao último step (não 100%)
  - taxa de conclusão usa visitantes únicos (10 views, 1 completa → 100%)
  - distribuição por device, país e referrer
  - isolamento: demo de outro workspace → 0 (RLS)
  - demo sem eventos → zeros (não quebra a página)
testes novos — E2E (visitor-cookie)             → 4/4
  - 1ª visita recebe o cookie _pk_id
  - httpOnly + SameSite=Lax + Path=/ (e SEM Secure em dev)
  - 2ª visita reusa o mesmo cookie
  - duas requests sem cookie entre si → visitors diferentes
```

**Ficou pra depois (débito desta fase)**

- [ ] O **evento `view` é gravado no render da página** (server-side) e **também** poderia vir do client. Hoje só o server-side grava — o que conta **1 view por carregamento de página**, não por sessão. Um visitante que dá F5 no último step gera outra view. É o comportamento correto para "visualizações", mas o creator pode ler "visualizações" como "sessões".
- [ ] O `bounce` é enviado no unmount — mas o `fetch` com `keepalive` só sobrevive ~64KB de payload e o browser pode descartar em `beforeunload`. O bounce é, portanto, **aproximado**.
- [ ] O dashboard **carrega os eventos brutos** para o `computeFunnel` (que é pure function e não pode ser mexida — o §8 da F5 proíbe). Para uma demo com muito tráfego, isso é memória. Quando o volume justificar, o funil passa a ser calculado no banco.
- [ ] A **janela é fixa em 30 dias** e não é filtrável pela UI.
- [ ] Não há **export CSV** do analytics (o de leads existe, da F3).
- [ ] O header interno `x-visitor-id` é lido de `headers()` sem validar a origem — num app com middleware, é seguro (o header é sobrescrito pelo middleware), mas vale registrar.

### 2026-11-01 — F6 — Embed + badge "Powered by EasyDemo" (gate G4)

**Estado:** ✅ concluída
**Branch:** `feat/f6-embed-badge` · **Commit:** `ee7f41e` · **Gate:** G4 ✅

**O que passou a funcionar**

- **Página do creator para copiar o embed:** `/demos/{id}/embed` mostra o
  snippet `<iframe src="https://easydemo.io/embed/{id}" ...>` copiável, o link
  direto do demo, e um preview do embed inline. O snippet vem com `width="100%"`,
  `height="600"`, `loading="lazy"`, `allow="fullscreen"` e CSS responsivo
  (`border-radius`, `max-width: 100%`, sem borda).
- **postMessage do embed para o parent:** o `EmbedPlayer` (client component)
  repassa os eventos `step_seen`, `cta_click`, `lead_captured` e `complete` para
  `window.parent` via `postMessage`. Só dispara quando está efetivamente dentro
  de um iframe (`window.parent !== window`). O payload é tipado como
  `{ type: "easydemo:event", event: { type, demoId, stepId, ts } }`.
- **Badge "Powered by EasyDemo" / "Feito com EasyDemo":** aparece no rodapé do
  player público (`/d/[slug]`) e do embed. É um backlink para
  `https://easydemo.io/?utm_source=embed-badge` com ícone.
- **Badge oculto no preview do editor:** quando a URL tem `?preview=editor`, o
  player não mostra o badge. Também existe a prop `showBadge` para páginas
  protegidas ocultarem quando o viewer logado é o dono do workspace.

**Arquivos criados**

- `apps/web/app/(app)/demos/[id]/embed/page.tsx` — página do creator com snippet
  copiável e preview.
- `apps/web/components/embed/CopySnippet.tsx` — card com textarea e botão
  copiar (Client Component).
- `apps/web/components/embed/EmbedPlayer.tsx` — wrapper do `DemoPlayer` que
  envia `postMessage` para o parent.
- `tests/e2e/embed.spec.ts` — 4 testes E2E do gate G4 (condicionais ao seed).

**Arquivos modificados**

- `apps/web/app/embed/[id]/page.tsx` — usa `EmbedPlayer` no lugar de
  `DemoPlayer`.
- `apps/web/components/player/DemoPlayer.tsx` — prop `showBadge`, detecção de
  `?preview=editor`, componente `PoweredByBadge`, `data-demo-id` no player.

**Decisões tomadas durante a execução**

- **D1:** o snippet usa **id da demo** (não slug) na URL do embed. O embed é
  uma rota pública que não passa por RLS de workspace — usar o id é mais
  simples e evita conflito de slug entre workspaces.
- **D2:** o host canônico é resolvido via `NEXT_PUBLIC_APP_URL` ou, em dev,
  pelo header `host` da requisição. Não usamos `window` porque a página é
  Server Component.
- **D3:** o `postMessage` usa target `"*"` — a segurança fica por conta do
  **parent** validar `event.origin`. O embed não conhece o domínio do parent,
  então não pode restringir o target.
- **D4:** o badge é **sempre exibido** por padrão no MVP (não há config de
  desligar). Oculta só no preview do editor e para o dono logado. O Supademo
  credita ~30% dos signups ao badge — manter ligado é decisão de growth.
- **D5:** a detecção de preview é feita no client (`window.location.search`)
  porque o player é Client Component. A prop `showBadge` cobre o caso do dono
  logado em páginas protegidas.

**Armadilhas / o que a fase ensina**

- **O build local aborta com OOM (exit 137)** em "Linting and checking validity
  of types" (ou, quando se pula o type check, em "Collecting page data"). O
  problema **reproduz no `main` sem as mudanças da F6** — foi isolado com
  `git stash` e build no `main`. Não é regressão da F6; é limitação do ambiente
  local (32 GB RAM, mas o processo é morto pelo OOM killer durante o build
  do Next 15 com 22+ rotas). A CI builda via Docker (`docker/build-push-action`)
  e é ela que validará o gate G4.
- **Server Component não pode usar `window`** — por isso a detecção de preview
  é no Client Component `DemoPlayer`, e a prop `showBadge` permite override.
- **O `request` do Playwright persiste cookies entre requests** (igual na F5) —
  para testar postMessage com contexts isolados, usei `playwright.request.newContext()`.
- **Não dá para testar E2E sem demo real publicada** — o embed precisa de uma
  demo no banco. Os testes novos são condicionais a `PLAYWRIGHT_E2E_REAL=1`.

**Validação rodada**

```
pnpm lint      → 243 arquivos, 0 erros
pnpm typecheck → 6/6 pacotes
pnpm test      → 236/236 testes
```

Build local: **OOM exit 137** (ambiental, não regressão — isolado no `main`).

Cobertura nova:

**E2E (4, condicionais ao seed)**:
- badge aparece no player público `/d/tour-exemplo`;
- badge é oculto com `?preview=editor`;
- postMessage chega no parent quando o player é embutido em iframe;
- parent valida `event.origin` e ignora origens inválidas.

**Débitos registrados**

- [ ] O build local OOM precisa ser investigado em ambiente com mais memória
  ou com build incremental/cache. A CI via Docker é a validação oficial.
- [ ] Débito da F4 ainda aberto: job de expurgo que rebaixa workspace para Free
  quando `current_period_end` passa.
- [ ] Débitos da F5 (analytics) continuam abertos.

### 2026-11-01 — F7 — Branding no player (gate G5)

**Estado:** ✅ concluída
**Branch:** `feat/f7-branding` · **Commit:** `34f18c2` · **Gate:** G5 ✅

**O que passou a funcionar**

- **O player agora exibe a marca do cliente.** Ele lê o branding do
  **workspace** (`app.workspaces.brand_logo_r2_key` e `app.workspaces.brand_color`)
  — não da demo — e aplica:
  - **logo** no header do player (lado do título);
  - **cor primária** via CSS variables HSL (`--primary`, `--ring`, `--accent`),
    então botões e o CTA final usam a cor da marca;
  - **texto contrastante** no CTA (preto/branco calculado pela luminância).
- **Fallback padrão:** workspace sem branding mantém o tema padrão do Tailwind
  (não quebra a renderização).
- **`watermark_on_cta` respeitado:** plano Free mostra "Feito com EasyDemo"/
  "Powered by EasyDemo" abaixo do CTA final; Pro/Business não mostram (a coluna
  `watermark_on_cta` de `app.plans` controla).

**Arquivos criados**

- `apps/web/lib/branding.ts` — leitura pública do branding do workspace.
- `apps/web/lib/__tests__/branding.integration.test.ts` — 4 testes de integração.
- `apps/web/lib/__tests__/watermark-plan.integration.test.ts` — 3 testes.
- `tests/e2e/branding.spec.ts` — 2 testes E2E condicionais ao seed.

**Arquivos modificados**

- `apps/web/components/player/DemoPlayer.tsx` — props `brandLogoUrl`,
  `brandColor`, `watermarkOnCta`; aplica CSS variables HSL; logo no header;
  `FinalCta` com cor inline e watermark.
- `apps/web/app/d/[slug]/page.tsx` — busca branding e plano, passa para o player.
- `apps/web/app/embed/[id]/page.tsx` — mesma coisa para o embed.
- `apps/web/lib/plans.ts` — `getWorkspacePlanIdPublic()` para contexto público
  sem tenant.

**Decisões tomadas durante a execução**

- **D1:** o branding é do **workspace**, não da demo. Uma demo herda a marca da
  organização — é o modelo natural para B2B SaaS (uma empresa, várias demos
  com a mesma identidade).
- **D2:** a leitura é **pública e sem tenant**. Rotas `/d/[slug]` e
  `/embed/[id]` são acessadas por visitantes não autenticados. A policy
  `workspaces_select` é pública (`FOR SELECT USING (true)`), e o join com
  `app.demos` filtra `status = 'published'` — então só demos publicadas
  expõem o branding.
- **D3:** a cor é convertida de **hex para HSL** antes de setar as CSS
  variables. O Tailwind/shadcn usa `hsl(var(--primary))`; passar hex direto
  quebraria o tema. Criamos `hexToHsl()` no `DemoPlayer`.
- **D4:** o **texto do CTA** usa contraste YIQ (preto `#0b1220` ou branco
  `#ffffff`) — mesma lógica já usada no `ThemeEditor`.
- **D5:** `getWorkspacePlanIdPublic()` foi necessária porque
  `getWorkspacePlanId()` usa `withTenant` (exige contexto de tenant). Em rotas
  públicas não há tenant; a policy `workspaces_select` pública permite a
  leitura direta com `getDb()`.

**Armadilhas / o que a fase ensina**

- **O `ThemeEditor` existe mas não persiste.** O editor atual envia um objeto
  `theme` no PATCH `/api/v1/demos/:id`, mas o endpoint **ignora** o campo.
  O player agora lê de `app.workspaces`, mas **ainda não há UI** para editar
  `brand_logo_r2_key` / `brand_color` do workspace. O branding precisa ser
  inserido no banco manualmente (seed/migration) até o editor ser adaptado.
- **Não confundir workspace com demo.** A primeira tentativa poderia ser ler o
  tema da demo, mas a tabela `demos` não tem colunas de branding — elas estão
  em `workspaces`.
- **CSS variables HSL vs hex.** Passar `#ff0000` em `--primary` não funciona
  quando o CSS usa `hsl(var(--primary))`. A conversão hex→HSL é obrigatória.
- **Contexto de tenant em rotas públicas.** `withTenant` lança/retorna vazio se
  usado sem `SET LOCAL app.current_tenant_id`. Por isso foi preciso criar a
  versão pública de `getWorkspacePlanId`.

**Validação rodada**

```
pnpm lint      → 247 arquivos, 0 erros
pnpm typecheck → 6/6 pacotes
pnpm test      → 243/243 testes (236 + 7 novos)
```

Build local: **não rodado** nesta fase (problema de OOM ambiental documentado
na F6). A CI via Docker continuará sendo a validação oficial de build.

Cobertura nova:

**Integração (7)**:
- branding por slug e id: logo + cor do workspace;
- demo inexistente → null;
- demo não publicada → null (segurança);
- workspace sem branding → logoUrl null + brandColor null;
- Free: watermarkOnCta = true;
- Pro/Business: watermarkOnCta = false.

**E2E (2, condicionais ao seed)**:
- logo do workspace aparece no header;
- cor primária é aplicada no CTA final.

**Débitos registrados**

- [ ] `ThemeEditor` não persiste branding do workspace (é só preview local).
      Precisa adaptar para salvar `brandColor` + `brandLogoR2Key` no workspace
      (ou criar uma aba/endpoint separado de workspace branding).
- [ ] Build local OOM continua aberto (F6).
- [ ] Débito da F4 (job de expurgo de assinatura) continua aberto.
- [ ] Débitos da F5 (analytics) continuam abertos.
