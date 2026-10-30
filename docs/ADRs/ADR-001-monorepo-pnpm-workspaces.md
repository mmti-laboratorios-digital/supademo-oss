# ADR-001: Monorepo com pnpm workspaces

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

O EasyDemo precisa hospedar múltiplos artefatos compiláveis — Next.js (web), worker Node (graphile-worker), extensão Chrome MV3, biblioteca de player React, pacote de schemas compartilhados, biblioteca UI — que compartilham tipos TypeScript, schemas Zod, tokens de design e contrato do ORM Drizzle. Precisamos decidir **como organizar e construir esses artefatos** de forma que mudanças em um pacote compartilhado sejam propagadas com segurança, builds sejam reproduzíveis e DX (dev experience) não sofra.

Restrições adicionais:
- Time de 1–3 devs; orçamento baixo para ferramentas pagas.
- Repositório único no GitHub.
- CI simples em GitHub Actions (≤ 10 min por PR).
- Não podemos aceitar divergência silenciosa entre os tipos do front e do back.

## Decision Drivers

- **DRY de tipos:** Drizzle schema, Zod, locale messages, design tokens devem ser importados como pacotes, não copiados.
- **Velocidade de instalação:** `pnpm install` rápido (conteúdos compartilhados em store global, hard links).
- **Filtragem:** só rebuildar o que mudou.
- **Lockfile único e determinístico:** um único `pnpm-lock.yaml`.
- **Custo zero** (sem Turborepo Cloud, sem Nx Cloud).
- **Compatibilidade com WXT** (extensão MV3) e Next.js 15 sem hacks.

## Considered Options

1. **pnpm workspaces** com catálogo de versões (versions catalog).
2. **Turborepo** com pipelines e cache remoto (`turbo.json` + `turborepo.com` opcional).
3. **Lerna** (modo Nx-style) com `lerna.json` + workspaces npm.
4. **Polyrepo** (cada app em repositório separado) + publicação NPM privada.

## Decision Outcome

**Chosen option: "pnpm workspaces com versions catalog"**, porque entrega o melhor equilíbrio entre simplicidade, velocidade e determinismo, sem dependência de serviço pago. Turborepo foi considerado forte candidato, mas o ganho marginal de cache remoto não compensa a complexidade extra na MVP — e pode ser adicionado depois como camada sobre pnpm sem reescrever nada.

Catálogo de versões (`pnpm-workspace.yaml` com `catalog:`) garante que React 19, TypeScript 5.6, Zod 3.23, Drizzle 0.36 e Tailwind 3.4 tenham **exatamente uma versão** declarada em um lugar — todos os pacotes referenciam `catalog:`. Isso evita o inferno clássico de monorepos com 5 Reacts diferentes.

Estrutura final:

```
supademo-oss/
├── apps/
│   ├── web/             # Next.js 15
│   ├── workers/         # graphile-worker + OTel
│   └── extension/       # WXT MV3
├── packages/
│   ├── ui/              # shadcn/ui wrapper + tokens
│   ├── shared/          # tipos compartilhados
│   ├── player/          # @easydemo/player (React)
│   └── db/              # drizzle schema + migrations
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── .npmrc               # link-workspace-packages=true, hoist-pattern[]=...
```

### Positive Consequences

- Single lockfile, single source of truth de versões.
- `pnpm install` em CI ~2× mais rápido que npm/yarn em monorepo equivalente (store global + hard links).
- Versions catalog elimina drift de dependências entre pacotes.
- Scripts paralelos nativos (`pnpm -r run build`).
- Publicação trivial de pacotes internos: `workspace:*` resolve para symlink local; troca por versão semantica na hora de publicar.
- WXT, Next.js, Vite e Rollup funcionam sem plugin adicional — só precisam do campo `"workspaces"` no package.json raiz (com `pnpm-workspace.yaml`).

### Negative Consequences

- Sem cache remoto: rebuilds completos no CI a cada push se nada mudou no cache local (mitigável adicionando Turborepo depois).
- Sem visualização nativa de grafo de dependências (precisa `pnpm ls --graph` ou Madge).
- Filósofos do strict-mode precisam de `.npmrc` com `auto-install-peers=true` para não quebrar ao instalar pacote novo.

### Follow-ups

- Configurar `package-strictness=true` no `.npmrc` para falhar CI se algum pacote usar dependência não declarada.
- Considerar adicionar `nx` ou `turbo` como orquestrador de tasks **somente** se `pnpm -r` ficar lento (> 4 min) com > 20 pacotes.

## Pros and Cons of the Options

### pnpm workspaces (escolhido)

- Good, single lockfile e versions catalog.
- Good, store global reduz uso de disco e tempo de install.
- Good, suporte first-class a WXT e Next.js 15.
- Neutral, sem cache remoto nativo (workaround: GitHub Actions cache).
- Bad, comunidade brasileira ainda menor que npm/yarn.

### Turborepo

- Good, cache remoto (`turbo run build --cache`) economiza minutos em CI.
- Good, pipelines declarativas em `turbo.json` legíveis.
- Bad, adiciona uma camada de abstração que confunde devs novos.
- Bad, cache remoto é serviço pago (Vercel/Artifactory) — fora do orçamento MVP.
- Neutral, funciona perfeitamente em cima de pnpm workspaces (não é excludente).

### Lerna

- Good, npm workspaces nativo, sem dependência extra.
- Bad, foi ultrapassado em DX por pnpm/Nx/Turbo (npm 7+ workspaces tem flags confusas).
- Bad, sem versions catalog.
- Bad, comunidade migrou para outras soluções desde 2022.

### Polyrepo

- Good, isolamento total entre apps.
- Bad, impossível compartilhar tipos sem publicar pacotes NPM (lento).
- Bad, mudanças em schema DB exigem PR coordenado em 3+ repos.
- Bad, completamente fora de proporção para time pequeno.

## References

- [pnpm workspaces docs](https://pnpm.io/workspaces)
- [pnpm versions catalog](https://pnpm.io/catalogs)
- [WXT docs — monorepo setup](https://wxt.dev/guide/essentials/config.html)
- RFC EasyDemo §2.2 — Stack definitiva
- `research/tech/RECOMMENDATION.md` §3 — dependências pinadas