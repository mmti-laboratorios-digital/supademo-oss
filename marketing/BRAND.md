# DemoBR — Brand Guidelines

> **Status:** v1.0 — canônico para uso em landing, blog, redes sociais e e-mail.
> **Data:** 2026-10-18.
> **Origem:** alinhado ao nome `DemoBR` declarado em `README.md`, `docs/RFC-Brazilian-Supademo.md` e `specs/mvp-scope.json`.

---

## 0. TL;DR

| | |
|---|---|
| **Nome oficial** | **DemoBR** (uma palavra, sem espaço; D + B maiúsculas). |
| **Tagline principal (PT-BR)** | "Demos interativas pra vender mais, sem uma reunião a mais." |
| **Tagline curta (PT-BR)** | "Demos interativas em PT-BR, com PIX e LGPD." |
| **Tagline (EN)** | "Interactive demos, Brazilian-style." |
| **Slogan curto (uso geral)** | "Sua demo, no seu tempo, no seu idioma." |
| **Persona pública** | "Você" — fala com PMM, head de CX, founder de SaaS BR. |
| **Tom** | Próximo, técnico quando precisa, zero corporativês. |

### 3 alternativas de nome (caso o time queira reconsiderar)

| Nome | Prós | Contras |
|---|---|---|
| **DemoBR** (escolhido) | Claro, óbvio, domínios `.com.br` viáveis, coincide com a RFC | Genérico; pouca identidade visual além do "▶" |
| **DêDemo** | PT-BR-nativo, brinca com "dê" (verbo + nome) | Mais difícil de SEOar; domínio `.com.br` possivelmente tomado |
| **Passo a Passo** (PXP) | Didático, remete a onboarding | Não comunica venda; ambiguidade com "passo a passo de receita" |

> **Recomendação:** manter **DemoBR**. Clareza > criatividade pra PMM brasileiro pesquisando "demo interativa".

---

## 1. Identidade verbal

### 1.1 Voz

- **Quem somos:** o PMM que construiu o próprio demo porque ninguém vendia BR-first.
- **Quem falamos:** PMMs, heads de CX/CS, fundadores de SaaS B2B PME/mid-market no Brasil.
- **O que defendemos:** tempo do AE é dinheiro; lead não qualificado não merece call; demo boa é demo que o lead **assiste sozinho**.
- **O que não somos:** enterprise-boring, jargão-tech-ofuscante, "AI-driven everything".

### 1.2 Tom — 4 regras de ouro

1. **Próximo sem ser íntimo.** "Você" é OK; "amigão" não é.
2. **Técnico quando precisa, sem inflar.** "Captura HTML via Playwright headless" é OK; "solução disruptiva de engajamento" é vetado.
4. **Gíria BR moderada, com parcimônia.** Pode usar "tá", "pra", "rolê", "bateu". Não use "mainha", "véi", "oxe" — soa forçado fora do Nordeste.
5. **Sem corporativês.** Substituir:
   - "solução" → "ferramenta"
   - "stakeholder" → "time" ou "pessoa"
   - "value proposition" → "promessa de valor" ou simplesmente "o que a gente faz"
   - "touchpoints" → "momentos de contato"
   - "funnel" → "funil" ou "esteira"
   - "go-to-market" → "como a gente vai vender"

### 1.3 Vocabulário canônico (use sempre que possível)

| Prefira | Evite |
|---|---|
| demo (substantivo comum) | tour interativo (a menos que esteja explicando feature) |
| capturar (o produto) | gravar (gera confusão com vídeo) |
| passo / step | tela, frame, screenshot (a menos que o contexto seja técnico) |
| hotspot (interface) | balãozinho, marquinha |
| CTA / chamar pra ação | call-to-action |
| lead (quem viu o demo e deixou contato) | visitante, usuário |
| workspace / conta | organização, tenant (em copy pública) |
| workspace Pro / Business | plano Pro / Business |

### 1.4 O que **nunca** escrever

- "Líder de mercado" — não somos.
- "A melhor plataforma de demos do Brasil" — sem dado verificável.
- "IA revolucionária" — substantivo, sem adjetivo, sempre.
- "Sem cartão" — pode usar ("Sem cartão de crédito pra começar") mas não abuse.
- "Grátis pra sempre" — não é verdade (Free = 3 demos, 50 views/mês).

---

## 2. Taglines por tier de uso

| Uso | Tagline | Onde usar |
|---|---|---|
| **Geral / Hero** | "Demos interativas pra vender mais, sem uma reunião a mais." | Home, OG image padrão, header de e-mail |
| **Geral / Curta** | "Demos interativas em PT-BR, com PIX e LGPD." | Assinatura de e-mail, badge, footer |
| **Geral / EN** | "Interactive demos, Brazilian-style." | Site em `/en`, footer global |
| **Prospecção outbound** | "Mostre seu produto antes da call." | Subject de cold e-mail, headline LinkedIn |
| **Marketing** | "Substitua PDFs por tours." | Landing pages, ads de topo de funil |
| **Treinamento interno** | "Onboarding em 5 minutos, sem agendar." | Landing pages, cases de CX |
| **Onboarding (Free)** | "Crie seu primeiro demo em 5 minutos." | Welcome screen, modal D0 |
| **Comparativo (vs global)** | "Supademo, mas em R$ e com PIX." | Compare pages, ads |
| **Compliance** | "LGPD by design. Não é PDF de rodapé." | Footer, /sobre, /lgpd |

---

## 3. Identidade visual

### 3.1 Paleta de cores

> **8 cores totais: 1 primary, 1 secondary, 1 accent, 5 neutrals.** Todas testáveis em modo claro/escuro.

| Token | HEX | Uso | Notas |
|---|---|---|---|
| `--brand-primary` | **#2B6CB0** (azul Atlântico) | Logo, CTAs principais, links | Diferencia de Getdemo (#4d65ff) e GuiaFlow (#1A4D6D) — mais saturado, mais vivo |
| `--brand-secondary` | **#38B2AC** (verde-água Praia) | Hover, badges de "novo", ícones ativos | Cor de "Made in Brazil" — leve toque tropical sem caricato |
| `--brand-accent` | **#ED8936** (laranja Verão) | Highlight, CTA secundário, banner de cupom | Mesmo laranja-family do Supademo (que tem laranja na marca), mas menos saturado — diferenciável |
| `--neutral-900` | **#1A202C** | Texto principal em modo claro | Quase preto, suave |
| `--neutral-700` | **#2D3748** | Texto secundário, ícones | |
| `--neutral-300` | **#CBD5E0** | Bordas, dividers | |
| `--neutral-100` | **#F7FAFC** | Background modo claro | |
| `--neutral-050` | **#FAFAFA** | Background de cards / sidebar | |

**Modo escuro (override):**

| Token | HEX | Uso |
|---|---|---|
| `--dark-bg` | **#0F1419** | Background principal |
| `--dark-surface` | **#1A202C** | Cards, modais |
| `--dark-text` | **#E2E8F0** | Texto principal |

> ⚠️ **Limitação declarada:** cores foram escolhidas por categoria semântica; não foram calibradas com ferramentas de contraste WCAG. Validar contraste AA (4.5:1) antes do launch.

### 3.2 Tipografia

| Função | Fonte | Peso | Onde baixar |
|---|---|---|---|
| **UI (app + landing)** | **Inter** | 400 / 500 / 600 / 700 | Google Fonts — `fonts.google.com/specimen/Inter` |
| **Marketing (headlines, hero, blog)** | **Sora** | 600 / 700 / 800 | Google Fonts — `fonts.google.com/specimen/Sora` |
| **Mono (código, snippets)** | **JetBrains Mono** | 400 | Google Fonts — `fonts.google.com/specimen/JetBrains+Mono` |

**Por que Inter + Sora:**
- **Inter**: mais completa para UI (tabular nums, mais de 9.000 glifos), desenhada para telas, herdada do projeto do GitHub/Rasmus Andersson.
- **Sora**: geométrica, com personalidade de marketing, parente distante do Inter mas com mais "marketing feel". Combina com o estilo do app sem virar jogo de 7 diferenças.
- Ambas **gratuitas** e com licenças SIL Open Font License (uso comercial OK).

**Hierarquia (landing):**

| Elemento | Família | Tamanho | Line-height | Weight |
|---|---|---|---|---|
| H1 (hero) | Sora | 56–72px | 1.05 | 700 |
| H2 | Sora | 36–44px | 1.15 | 700 |
| H3 | Sora | 24–28px | 1.25 | 600 |
| Body L (hero subtitle) | Inter | 20px | 1.55 | 400 |
| Body M (default) | Inter | 16px | 1.6 | 400 |
| Caption / label | Inter | 13px | 1.45 | 500 |
| Button | Inter | 15px | 1 | 600 |

### 3.3 Logo — descrição conceitual

> **Logo é símbolo "▶" + texto "DemoBR"** em wordmark.
>
> **Layout horizontal:**
> ```
>  ▶ DemoBR
> ```
> - Símbolo ▶ em cor `--brand-primary` (#2B6CB0), mesmo tamanho da altura-x do texto.
> - Texto "DemoBR" em Sora 700, cor `--neutral-900` (claro) / `--dark-text` (escuro).
> - Largura total: ~140px no app, escalável para qualquer tamanho sem perder legibilidade.
>
> **Layout compacto (favicon, mobile):**
> ```
>  ▶
> ```
> - Apenas o símbolo ▶ em primary. 32×32px mínimo.
>
> **Versão "Powered by":**
> ```
>  Feito com ▶ DemoBR
> ```
> - Texto "Feito com" em Inter 13px 500 cinza (`--neutral-700`), símbolo ▶ primary, "DemoBR" em Sora 600 13px primary.
> - Aparece em demos Free no canto inferior direito, link para `demobr.com.br`.
>
> **Uso incorreto:**
> - ❌ Cor de gradiente no ▶ (vira Apple Music).
> - ❌ ▶ em cor accent (laranja) — confunde com "play" genérico.
> - ❌ Texto "DEMOBR" em caixa-alta (perde a brand).
> - ❌ ▶ preenchido com imagem (perde o "vector-ness").
>
> **Versão ASCII completa para mockups:**
> ```
>   ▄▄▄▄▄▄▄ ▄▄▄▄▄▄▄
>   █ ▄▄▄ █ █  █  █    D e m o B R
>   █ █ █ █ █  █▄▄█
>   █ █▄█ █ █  █   ▀
>   █▄▄▄▄▄█ █  █▄▄▄▀
>
>   ▶ DemoBR
>   Demos interativas em PT-BR.
> ```
>
> **Implementação SVG (símbolo ▶ standalone, ~20 linhas):**
> ```svg
> <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
>   <path d="M8 5 L26 16 L8 27 Z" fill="#2B6CB0"/>
> </svg>
> ```

---

## 4. Princípios de aplicação

### 4.1 Botões

| Estado | Primary | Secondary | Ghost |
|---|---|---|---|
| Default | bg `primary`, texto branco | bg `neutral-100`, texto `neutral-900` | sem fundo, texto `primary`, borda `primary` |
| Hover | bg `primary` 90% | bg `neutral-300` 50% | bg `primary` 10% |
| Disabled | bg `neutral-300`, texto `neutral-700` 50% | mesmo | mesmo |

**Texto do botão:**
- Verbo no infinitivo, ≤ 3 palavras.
- ✅ "Começar grátis", "Ver demo", "Criar minha demo"
- ❌ "Clique aqui", "Iniciar agora", "Submeta sua inscrição"

### 4.2 Cards

- Background branco (modo claro) ou `--dark-surface`.
- Sombra: `0 4px 12px rgba(0,0,0,0.06)` no hover (default é sem sombra).
- Border radius: 12px.
- Padding interno: 24px desktop / 16px mobile.

### 4.3 Espaçamento

Sistema de **4 ou 8 pontos** (preferir 8).

| Token | px | Uso |
|---|---|---|
| `space-1` | 4 | gap entre ícone e texto |
| `space-2` | 8 | gap entre linhas de label |
| `space-4` | 16 | padding interno de botão, gap entre título e corpo |
| `space-6` | 24 | padding interno de card |
| `space-8` | 32 | gap entre seções (mobile) |
| `space-12` | 48 | gap entre seções (desktop) |
| `space-16` | 64 | margin top de h1 em hero |

### 4.4 Fotografia / ilustração

- **Pessoas:** brasileiras, em ambientes de trabalho reais (escritórios de startup, coworking, home office). Evitar stock photos de "pessoas olhando pra tela genérica".
- **Screenshots:** capturas reais do produto DemoBR, com dados plausíveis (empresa fictícia "Empresa XYZ S.A."), com ou sem blur estratégico.
- **Ilustrações:** estilo minimalista, traço fino, paleta `--brand-primary` + `--neutral-300`. Vetor, evitar ilustração "fofinha" (mascote animal, etc.).

### 4.5 Acessibilidade

- **Contraste mínimo AA** (4.5:1 para texto, 3:1 para UI grandes).
- **Não confiar só em cor** para transmitir estado (sempre adicionar texto ou ícone).
- **Foco visível** em todos os elementos interativos (outline 2px `--brand-primary`).
- **Tamanhos de toque** ≥ 44×44 px (mobile).

---

## 5. Onde aplicar (resumo rápido)

| Contexto | Regra |
|---|---|
| App / dashboard | Inter 16px, paleta neutrals + primary |
| Landing | Sora nos H1/H2, Inter no body, accent em CTA secundário |
| Blog | Sora nos títulos, Inter no corpo, mono em snippets de código |
| E-mail | Inter, max-width 600px, primary nos CTAs |
| Redes sociais | Sora 700 nos textos-chave, paleta primary + accent |
| Press kit | Versão clara + escura do logo + screenshots de produto |

---

## 6. Asset checklist (a produzir)

- [ ] Logo SVG em 3 tamanhos (32, 64, 256px)
- [ ] Logo em fundo claro + escuro
- [ ] Favicon 32×32 + apple-touch-icon 180×180
- [ ] OG image padrão (1200×630, primary background, "▶ DemoBR" centralizado)
- [ ] Screenshot hero do produto (1200×800)
- [ ] Screenshot do player rodando (800×500)
- [ ] Screenshot do editor com 3 steps (1200×800)
- [ ] Ícone do app (Chrome Web Store icon: 128×128)
- [ ] Press kit ZIP com README + 4 PNGs + 1 SVG do logo

---

## 7. Limitações declaradas

- Cores foram **escolhidas por categoria semântica**, não calibradas com ferramenta de contraste WCAG. **Validar contraste AA antes do launch.**
- Logo é **conceitual** (ASCII + descrição). **SVG final precisa ser desenhado por designer.**
- Brand voice foi **validada apenas internamente**; pode precisar de ajuste após feedback de 3–5 PMMs externos.
- Sora tem só 4 weights (200, 300, 600, 700, 800 segundo Google Fonts) — usar 600+ para UI, 700/800 para marketing.

---

## 8. Referências internas

- Nome e escopo: `README.md`, `docs/RFC-Brazilian-Supademo.md`, `specs/mvp-scope.json`.
- Pricing tiers: `research/pricing/SYNTHESIS.md` §3.
- Persona/posicionamento: `research/pricing/gtm-channels.md` §A e §D.
- Concorrentes para diferenciamento visual: `research/demos/getdemo.md` (#4d65ff), `research/demos/guiaflow.md` (#1A4D6D), `research/demos/supademo.md` (laranja + preto).