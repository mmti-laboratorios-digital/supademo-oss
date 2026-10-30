# ADR-012: pt-BR-first com i18n EN secundário via JSON messages

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead DemoBR, Founding engineer

## Context and Problem Statement

DemoBR é um produto **pt-BR first** por estratégia (mercado-alvo é Brasil — ver RFC §1, §6). Mas:

- **Time** fala PT/EN misturados; commits/PRs/reports técnicos em EN é saudável para atrair contribuidores internacionais.
- **Alguns leads podem ser da América Latina** (Argentina, México) onde o produto pode fazer sentido como side-market.
- **Colaboradores open-source** (a licença é AGPL ou similar) podem preferir UI em EN.
- **LGPD/legais** exigem alguns textos exatos em PT-BR (consentimento, política de privacidade).

Devemos decidir a **estratégia de i18n**:

1. pt-BR-only hard-coded (sem framework de i18n).
2. pt-BR-first + EN secundário via JSON messages custom.
3. **i18next** (library madura, ecossistema React/Next enorme).
4. **FormatJS / react-intl** (ICU MessageFormat, padrão para apps enterprise).
5. **Lingui** (compile-time, bundle menor que i18next).

## Decision Drivers

- **Default UI deve ser PT-BR** com 100% de cobertura (legal e UX).
- **EN secundário** deve existir mas com cobertura ~80% (textos técnicos podem ficar em PT).
- **Bundle size**: admin em PT-BR-first não pode inflar com traduções.
- **DX**: dev PT-BR deve conseguir editar mensagens sem aprender ICU syntax.
- **Custo zero** (sem SaaS de tradução).
- **LGPD**: textos legais têm template versionado em PT.

## Considered Options

1. **JSON messages custom** (catalogo próprio em `packages/shared/messages/`).
2. **i18next** + `react-i18next` + `i18next-browser-languagedetector`.
3. **FormatJS / react-intl** (ICU).
4. **Lingui** (compile-time macros).
5. **Next.js built-in i18n** (App Router nativo).

## Decision Outcome

**Chosen option: "JSON messages custom (pt-BR-first) com fallback EN via dicionário"**, porque é o mínimo viável para o escopo atual, mantém bundle pequeno, e dá ao time PT-BR controle total sem aprender ICU. Migrar para i18next no futuro é trivial — o JSON custom **é** um subset do formato i18next.

Estrutura:

```
packages/shared/messages/
├── pt-BR.json          # mensagens primárias
├── en.json             # fallback EN (~80% cobertura)
└── LEGAL/              # textos LGPD/exatos — somente PT-BR
    ├── consentimento.md
    └── politica-privacidade.md
```

Exemplo `pt-BR.json`:

```json
{
  "demo.create.success": "Demo \"{title}\" criada com sucesso",
  "billing.checkout.cta": "Assinar Pro por R$ {price}/mês",
  "lead.capture.consent": "Concordo com a política de privacidade",
  "error.generic": "Algo deu errado. Tente novamente."
}
```

Implementação mínima:

- Hook `useT()` em `packages/shared/i18n/useT.ts` — recebe `locale`, retorna `t(key, vars)`.
- `t()` faz fallback chain: `pt-BR → en → key`.
- Locale vem do `Accept-Language` header ou query param `?lang=en`.
- Default sempre pt-BR (config em `next.config.mjs`).
- Player público carrega JSON sob demanda (`/locales/{locale}/player.json`) com `Cache-Control: max-age=3600`.

### Positive Consequences

- **Bundle zero** para pt-BR (mensagens inline se quiser).
- **Sem framework** = dev PT-BR edita JSON sem tutorial.
- **Tipagem TS** opcional (`as const` nos JSONs + tipo derivado).
- **Fallback chain** simples e transparente.
- **LGPD**: textos legais em PT-BR com versão controlada em `LEGAL/`.
- **Migração fácil** para i18next (mesmo formato JSON, sem refactor de dados).

### Negative Consequences

- **Sem pluralização nativa** (precisamos helper `pluralize(key, n)` manual).
- **Sem ICU MessageFormat** (sem sintaxe complexa tipo `{n, plural, one {# item} other {# items}}`).
- **Interpolação simples** apenas (`{var}`); sem gender, sem seleção condicional.
- **Validação manual** de chaves ausentes (sem extração estática como em Lingui).
- Sem suporte a **lazy loading por namespace** built-in (precisamos implementar).

### Follow-ups

- Adicionar **validador CI** que compara `pt-BR.json` e `en.json` e alerta chaves faltantes (`scripts/check-i18n.ts`).
- Quando passarmos 500 strings ou 3 locales, migrar para **i18next** (mantém JSON, ganha plural + ICU).

## Pros and Cons of the Options

### JSON messages custom (escolhido)

- Good, zero dependência.
- Good, dev PT-BR edita direto.
- Good, bundle pequeno.
- Good, LGPD-friendly.
- Bad, sem plural ICU.
- Bad, validação manual.

### i18next

- Good, ecossistema enorme.
- Good, plural built-in, namespaces, lazy load.
- Good, detector de idioma do browser.
- Bad, bundle maior (~15 KB).
- Bad, API verbosa para começar.
- Bad, docs em EN.

### FormatJS / react-intl

- Good, ICU MessageFormat (padrão enterprise).
- Good, suporte a gender, plural, select.
- Good, extraction via babel-plugin.
- Bad, **complexo** para app PT-BR-first.
- Bad, ICU confunde devs não-i18n.
- Bad, bundle ~30 KB.

### Lingui

- Good, compile-time (bundle final igual a JSON custom).
- Good, macros `@lingui/macro` extraem `Language: pt-BR` explícito.
- Good, type-safe.
- Bad, **setup build** (Babel/SWC plugin).
- Bad, comunidade menor.
- Bad, ICU dependencies ainda.

### Next.js built-in i18n

- Good, integrado com App Router.
- Good, routing-based (`/en/...`, `/pt-BR/...`).
- Bad, **menos flexível** que library dedicada.
- Bad, sem fallback chain granular.
- Bad, prefira usar middleware custom.

## References

- [i18next docs](https://www.i18next.com/)
- [FormatJS / react-intl](https://formatjs.io/docs/react-intl)
- [Lingui](https://lingui.dev/)
- [Next.js i18n](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- RFC DemoBR §2.2 — locale
- `research/tech/public-player.md` — i18n no player