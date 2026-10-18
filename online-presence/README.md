# DemoBR — Online Presence

> The canonical directory for everything the DemoBR brand publishes online.
> All assets, copy and runtime files in this folder are production-ready.

## Quick index

| Path | Type | Purpose |
|---|---|---|
| `brand/logo.svg` | SVG | Logo bundle (4 variants in one file). |
| `brand/favicon.svg` | SVG | Browser tab favicon. |
| `brand/social/og-default.svg` | SVG | Open Graph card 1200×630. |
| `brand/social/twitter-card.svg` | SVG | Twitter card 1200×600. |
| `brand/social/linkedin-banner.svg` | SVG | LinkedIn company page banner 1584×396. |
| `brand/social/youtube-thumbnail.svg` | SVG | YouTube thumbnail template 1280×720. |
| `schema/social-posts.json` | JSON | 90 social posts ready for Buffer/Hootsuite. |
| `../apps/web/app/(marketing)/content/` | MDX | PT-BR + EN content source (home, pricing, about, blog). |
| `../apps/web/app/(marketing)/home-page.tsx` | TSX | Home page renderer. |
| `../apps/web/app/(marketing)/pricing-detail-page.tsx` | TSX | Pricing detail. |
| `../apps/web/app/(marketing)/about/page.tsx` | TSX | About. |
| `../apps/web/app/(marketing)/blog/page.tsx` | TSX | Blog index. |
| `../apps/web/app/(marketing)/blog/[slug]/page.tsx` | TSX | Blog post renderer. |
| `../apps/web/app/sitemap.ts` | TS | Sitemap (dynamic). |
| `../apps/web/app/robots.ts` | TS | robots.txt (dynamic). |
| `../apps/web/app/opengraph-image.tsx` | — | (Per-demo OG at `apps/web/app/d/[slug]/opengraph-image.tsx`.) |
| `../apps/web/app/feed.xml/route.ts` | TS | RSS 2.0 feed (`/feed.xml`). |
| `../apps/web/app/not-found.tsx` | TSX | Custom 404. |
| `../apps/web/app/error.tsx` | TSX | Global error boundary (500). |
| `../apps/web/emails/welcome.tsx` | React Email | Welcome email. |
| `../apps/web/emails/dpo-published.tsx` | React Email | Demo published notification. |
| `../apps/web/emails/shared-with-team.tsx` | React Email | Workspace invitation. |
| `../apps/web/emails/password-reset.tsx` | React Email | Password reset. |
| `../apps/web/emails/quota-warning.tsx` | React Email | Quota warning (≥80% usage). |
| `../packages/shared/src/i18n/messages.pt-BR.json` | JSON | 453 PT-BR strings across 11 namespaces. |
| `../packages/shared/src/i18n/messages.en.json` | JSON | 453 EN strings, same keys. |
| `../packages/shared/src/i18n/translate.ts` | TS | Translator with `{var}` + ICU-lite plurals. |

---

## 1. Brand assets

### Logo (`brand/logo.svg`)

Single SVG file containing **4 variants** as `<g id="…">` nodes:

| Group | Use |
|---|---|
| `#logo-full` | Símbolo ▶ + wordmark horizontal. Header, footer, e-mail. |
| `#logo-stacked` | Símbolo em cima, wordmark em baixo. Badges, OG vertical, press kit. |
| `#logo-mono` | Versão monocromática (usa `currentColor`). Única cor para fundos complexos. |
| `#logo-mark` | Apenas o símbolo (32×32 efetivo). Favicon-like. |

**Como extrair uma variante individual:**

```bash
# Inline no Next.js: importar normalmente.
# Para baixar uma variante isolada:
node -e "
  const fs = require('fs');
  const svg = fs.readFileSync('./brand/logo.svg','utf8');
  const m = svg.match(/<g id=\"logo-full\"[\\s\\S]*?<\\/g>\\s*<!--/);
  fs.writeFileSync('./brand/_logo-full.svg', '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 600 80\">' + m[0].replace(/<g id=\"logo-full\"/,'<g').replace(/<!--[\\s\\S]*?-->/g,'').replace(/<\\/g>\\s*<!--/,'</g>') + '</svg>');
"
```

> Dica: a primeira versão pública pode usar o `logo.svg` único direto em
> `<img src="/logo.svg#logo-full">` se o host não exigir SVGs separados.

### Favicon (`brand/favicon.svg`)

Plugar em `apps/web/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
      // fallback PNG se quiser: 32, 16
    ],
  },
};
```

Não esqueça de copiar `brand/favicon.svg` para `apps/web/public/favicon.svg`
ou para `apps/web/app/icon.svg` (que o Next.js serve automaticamente).

### OG padrão (`brand/social/og-default.svg`)

Para o site `https://demobr.com.br` usar como OG fallback:

```tsx
// apps/web/app/layout.tsx
export const metadata: Metadata = {
  openGraph: {
    images: ["/brand/social/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/social/twitter-card.svg"],
  },
};
```

Há também uma versão **dinâmica por demo** em
`apps/web/app/d/[slug]/opengraph-image.tsx` (usa `@vercel/og`).

### Redes sociais

| Arquivo | Onde usar |
|---|---|
| `brand/social/og-default.svg` | Default OG/Twitter quando não há post específico. |
| `brand/social/twitter-card.svg` | Card fixo alternativo (use se preferir). |
| `brand/social/linkedin-banner.svg` | Banner do perfil da empresa no LinkedIn. |
| `brand/social/youtube-thumbnail.svg` | Template editável pra thumbs de vídeo. |

Para o YouTube: baixe o SVG, abra no Figma ou Illustrator, substitua
`{TITULO_DO_VIDEO}` pelo título real, exporte PNG 1280×720. O template já
deixa a área centralizada pronta.

---

## 2. Diretrizes de uso

### Cores (extraídas de `marketing/BRAND.md`)

| Token | Hex | Uso principal |
|---|---|---|
| `--brand-primary` | `#2B6CB0` | Logo, CTAs principais, links. |
| `--brand-secondary` | `#38B2AC` | Hover, badges "novo", ícones ativos. |
| `--brand-accent` | `#ED8936` | Highlight, CTA secundário, banner de cupom. |
| `--neutral-900` | `#1A202C` | Texto principal em modo claro. |
| `--neutral-700` | `#2D3748` | Texto secundário, ícones. |
| `--neutral-300` | `#CBD5E0` | Bordas, dividers. |
| `--neutral-100` | `#F7FAFC` | Background modo claro. |
| `--neutral-050` | `#FAFAFA` | Background de cards / sidebar. |

**Contraste mínimo AA** (4.5:1 texto, 3:1 UI grande). Validar antes do launch;
em modo escuro, ajustar com `--dark-bg #0F1419`, `--dark-surface #1A202C`,
`--dark-text #E2E8F0`.

### Tipografia

| Função | Família |
|---|---|
| UI + landing body | **Inter** 400 / 500 / 600 / 700 |
| Marketing H1/H2/H3 | **Sora** 600 / 700 / 800 |
| Mono (snippets) | **JetBrains Mono** 400 |

Inter e Sora são gratuitas no Google Fonts (SIL OFL).

### Onde aplicar cada asset

| Contexto | Regra |
|---|---|
| App / dashboard | Inter 16px, neutrals + primary. |
| Landing | Sora nos H1/H2, Inter no body, accent em CTA secundário. |
| Blog | Sora nos títulos, Inter no corpo, mono em snippets. |
| E-mail | Inter, max-width 600px, primary nos CTAs. |
| Redes sociais | Sora 700 nos textos-chave, primary + accent na arte. |
| Press kit | Versão clara + escura do logo + screenshots do produto. |

---

## 3. Conteúdo das páginas

Conteúdo fonte em `apps/web/app/(marketing)/content/`. Cada arquivo `.mdx`
é a **fonte canônica de copy** e é renderizado por um TSX pareado:

| MDX (fonte) | TSX (render) |
|---|---|
| `home.mdx` | `(marketing)/home-page.tsx` |
| `home.en.mdx` | `(en)/home-page.tsx` (slot preparado) |
| `pricing-detail.mdx` | `(marketing)/pricing-detail-page.tsx` |
| `about.mdx` | `(marketing)/about/page.tsx` |
| `blog/index.mdx` | `(marketing)/blog/page.tsx` |
| `blog/<slug>.mdx` | `(marketing)/blog/[slug]/page.tsx` |

O loader em `(marketing)/content/contentLoader.ts` lê os arquivos `.mdx`
via `fs` em build time e extrai:

- `meta` (hero, badge, CTAs)
- `socialProof`
- `features`
- `showcase` (DemoShowcase items)
- `pricing` (PricingTeaser)
- `finalCta`
- Para pricing-detail: `plans` e `faq`
- Para blog: frontmatter + blocks (h2 / p / faq)

**Editar copy:** altere o `.mdx`. O TSX re-renderiza no próximo build.

**Adotar MDX real (opcional):** instale `@next/mdx` no `apps/web/`. Os
arquivos `.mdx` já estão prontos para virar páginas Next com 1 linha de
config em `next.config.ts`.

---

## 4. Onde publicar

| Canal | Como |
|---|---|
| Site DemoBR | Already via `/app/(marketing)/page.tsx`. |
| LinkedIn (perfil empresa) | Subir `linkedin-banner.svg`, postar de `schema/social-posts.json`. |
| LinkedIn (pessoal) | Founder & time podem usar os textos em `social-posts.json`. |
| Twitter/X | Postar de `social-posts.json` filtrando `channel: "twitter"`. |
| Instagram (feed) | Carrosséis de `social-posts.json` filtrando `channel: "instagram"`. |
| Instagram (stories) | Print do player / screenshot real do produto. |
| YouTube | Usar `youtube-thumbnail.svg` como template de thumb. |
| ProductHunt | Pitch deck — usar OG + screenshots reais do produto. |
| HackerNews (Show HN) | Post com link pro demo de exemplo + tagline. |
| AppSumo / BetaList | Listing — usar OG + comparativo. |
| Slack/Discord B2B | Texto curto + link do blog correspondente. |

Para agendar: importar `online-presence/schema/social-posts.json` no
**Buffer** ou **Hootsuite**. Cada post já tem `text_pt`, `text_en`,
`hashtags`, `link` e `image_concept` (brief pra designer).

---

## 5. E-mails transacionais

5 templates React Email em `apps/web/emails/`:

| Arquivo | Quando envia | Subject |
|---|---|---|
| `welcome.tsx` | Signup | "Bem-vindo à DemoBR" |
| `dpo-published.tsx` | Após publicar demo | `Seu demo "{title}" está no ar` |
| `shared-with-team.tsx` | Convite enviado | `{inviterName} convidou você pro workspace {name}` |
| `password-reset.tsx` | Reset de senha | "Redefinição de senha" |
| `quota-warning.tsx` | Cota ≥ 80% | `Você está perto do limite do plano {plan}` |

**Stack:**

- `@react-email/components` (Section, Container, Button, etc).
- `@react-email/tailwind` para utility classes (configurado em `_layout.tsx`).
- Tipografia **Inter** como font base, **Sora** nos headings via inline style.
- Header com logo `▶ DemoBR`, footer com endereço CNPJ + LGPD link.
- Transacionais (`kind: "transactional"`): sem link de unsubscribe, mas
  sempre com link de preferências.
- Newsletter/marketing (`kind: "newsletter"`): inclui link de unsubscribe.

**Render:**

```ts
import { render } from "@react-email/render";
import { WelcomeEmail } from "./emails/welcome";

const html = await render(
  WelcomeEmail({
    firstName: "Bruna",
    workspaceName: "Empresa XYZ S.A.",
    dashboardUrl: "https://app.demobr.com.br",
    guideUrl: "https://demobr.com.br/blog/como-fazer-demo-interativa",
  }),
);
```

Para preview local: `pnpm dlx react-email dev` no diretório `apps/web/emails`.

---

## 6. Internacionalização (i18n)

Catálogos em `packages/shared/src/i18n/`:

- `messages.pt-BR.json` — 453 strings em 11 namespaces.
- `messages.en.json` — 453 strings com as mesmas chaves.
- `translate.ts` — função pura + helpers (`formatNumber`, `formatCurrency`, `formatDate`).

**Namespaces:**

```
common      nav           auth         demos        editor
analytics   billing       settings     errors       emails        a11y      marketing
```

**Uso:**

```ts
import { createTranslator } from "@demo.br/shared/i18n/translate";

const { t } = createTranslator("pt-BR");
t("common.save");                                  // "Salvar"
t("demos.deleteConfirm", { name: "Tour ABC" });   // 'Excluir "Tour ABC"? …'
t("demos.stepCount", { count: 7 });               // "7 steps" (plural-aware)
```

**Plurais:** suporta ICU-lite
(`{count, plural, =0 {…} one {…} other {# …}}`).

**Validar diff entre catálogos:**

```ts
import { diffCatalogs } from "@demo.br/shared/i18n/translate";
console.log(diffCatalogs()); // { missingInPtBR, missingInEN, shared }
```

Use em CI pra detectar i18n drift.

---

## 7. SEO runtime

| Arquivo | Função |
|---|---|
| `apps/web/app/sitemap.ts` | Sitemap dinâmico — inclui rotas estáticas + blog posts detectados via `listBlogPosts()`. |
| `apps/web/app/robots.ts` | `robots.txt` — permite tudo, bloqueia `/api/`, `/demos/`, `/workspace/`, `/billing/`. Aponta pro sitemap. |
| `apps/web/app/feed.xml/route.ts` | RSS 2.0 com últimos 20 posts do blog. |
| `apps/web/app/d/[slug]/opengraph-image.tsx` | OG image dinâmico por demo (usa `@vercel/og` + DB lookup). |

A base URL é resolvida por precedência:
`NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_APP_URL` → `APP_BASE_URL` → `http://localhost:3000`.

---

## 8. Páginas de erro customizadas

| Arquivo | HTTP | O que tem |
|---|---|---|
| `app/not-found.tsx` | 404 | Logo SVG + busca + 6 páginas sugeridas + e-mail de suporte. |
| `app/error.tsx` | 500 | "Tentar de novo" + status page link + digest id. |

`error.tsx` é client (`"use client"`) porque usa `reset()` para tentar
o segmento de novo.

---

## 9. Validação / QA

Antes de subir pra produção:

```bash
# 1. XML válido em todos os SVGs:
for f in online-presence/brand/**/*.svg; do xmllint --noout "$f" || echo "INVALID: $f"; done

# 2. JSON válido:
node -e "JSON.parse(require('fs').readFileSync('online-presence/schema/social-posts.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('packages/shared/src/i18n/messages.pt-BR.json','utf8'))"

# 3. Type check:
pnpm --filter web typecheck
pnpm --filter shared typecheck

# 4. i18n diff:
node -e "
const m1 = require('./packages/shared/src/i18n/messages.pt-BR.json');
const m2 = require('./packages/shared/src/i18n/messages.en.json');
const keys = (o,p='') => Object.entries(o).flatMap(([k,v])=>typeof v==='object'?keys(v,p?p+'.'+k:k):[p+'.'+k]);
const pt = new Set(keys(m1)); const en = new Set(keys(m2));
console.log('PT-BR:', pt.size, 'EN:', en.size, 'sym-diff:', [...pt].filter(k=>!en.has(k)).concat([...en].filter(k=>!pt.has(k))).slice(0,10));
"

# 5. Contraste WCAG AA nas cores principais (use axe-core ou WebAIM).
```

---

## 10. Limitações declaradas

- **MDX opcional.** Os arquivos `content/*.mdx` são texto que o TSX loader
  lê em build time. Para ativar render real de MDX no Next App Router,
  instale `@next/mdx` e ajuste `next.config.ts`. O conteúdo já está
  preparado.
- **OG image dinâmico** depende de `@vercel/og` (já nas deps). Requer
  edge runtime (`runtime = "edge"`) e acesso ao DB. Em deploy serverless,
  garanta que o banco esteja acessível do edge ou cache a imagem.
- **E-mails** exigem um `RESEND_API_KEY` (já nas deps). O layout em
  `_layout.tsx` aplica Tailwind via `<Tailwind>` do `@react-email/tailwind`.
- **Fontes** são carregadas pelo Next via `next/font/google` (Inter no
  layout). Se o ambiente bloquear fontes externas, fazer fallback pra
  system-ui.
- **Cores WCAG AA** declarado em `marketing/BRAND.md` §7 — **validar
  contraste antes do launch**. Esta suíte assume cores da brand, não
  recalibradas.
- **SVG sem animações.** Para demos ricas em motion (Lottie, GSAP), usar
  componente em vez de SVG estático.
