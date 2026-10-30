# Chrome Web Store — Estatísticas reais de instalação + reviews

**Coletado em:** 18 out 2026, ~14:00 BRT
**Método:** webfetch em páginas oficiais da Chrome Web Store.
**Importante:** Esses números refletem **apenas instalações via Chrome Web Store pública** — não incluem o desktop app (Win/Mac), MSI/EXE distribution ou usuários autenticados que entram direto pelo app web. Por isso são úteis como **proxy de brand-awareness por canal extension**, não como TAM absoluto.

---

## Comparativo direto

| Vendor | Chrome Web Store ID | Rating (★ out of 5) | Reviews | Installs (faixa) | Última update | Locale | Tamanho |
|---|---|---:|---:|---|---|---|---:|
| **Storylane** | `ongmhighpnfpojfidgigcjflgdkjfdeb` | **4.9** | 47 | **30.000+ users** | Out 12, 2026 (v4.0.5.10) | en-US | 10.16 MiB |
| **Supademo** | `jblbcpkejogbghfdglhfjlplchcnmohm` | 4.8 | 42 | 50.000+ users | Out 7, 2026 (v7.5.18) | en-US | 3.93 MiB |
| **Arcade** | `gagidkjllbdgggpboolfmmdpeagghjlm` | 4.8 | 33 | 50.000+ users | Out 13, 2026 (v1.9.33) | en-US | 11.9 MiB |
| **Navattic** | (não listado) | n/a | n/a | n/a | n/a | n/a | n/a |
| **GuiaFlow** | `bogjjfmcceccnepkpijiohglllbgbofd` | **0.0** (sem rating) | 0 | **36 users** | Out 13, 2026 (v0.1.7) | **pt-BR** | 84.74 KiB |

> Observação: Loom, Scribe, Tango e Wizard ("Interdemo") **não foram capturados nesta janela** mas existem extensões equivalentes. Cogita-se que Loom tem milhões de installs; Scribe tem ~10k+ na categoria Productivity.

## Análise de leadership de canal extension

### 🥇 Storylane: leader em rating

- Rating 4.9 (único com 4.9 — Supademo/Arcade em 4.8)
- Install count surpreende: **30k** enquanto Supademo e Arcade já passaram pra **50k+**
- Versão 4.0.5.10 (sugere cadence pesado em Q3-Q4 2026)
- Tamanho 10.16 MiB (grande vs Supademo 3.93 MiB; sugere mais assets)
- Categoria: **Workflow & Planning**
- Localização: 2261 Market St #4813 SF CA 94114

**Trade-off:** Storylane tem **menos metade das instalações** dos concorrentes líderes (30k vs 50k+), mas **rating mais alto**. Implicação para EasyDemo: extension store presence pode ser um vetor defensivo ou ofensivo dependendo da estratégia.

### 🥈 Supademo: leader em install + extension feed "Featured"

- 50.000+ users, Featured na Chrome Web Store.
- Rating 4.8 com 42 reviews.
- Versão 7.5.18 (cadence rápido, release/biweekly).
- Tamanho compacto 3.93 MiB.
- Categoria: **Tools** (genérico).
- Localização: 13331 Hauser Street, Overland Park KS 66213.

> Curiosidade: Supademo publica auto-declaração de privacidade dizendo: "Not being sold to third parties, outside of the approved use cases" — diferencial competitivo em 2026 pós-Chrome MV3 tighten.

### 🥉 Arcade: equilíbrio entre install e sophistication

- 50.000+ users, Featured.
- Rating 4.8 com 33 reviews (menos reviews que Supademo; install talvez mais forte porque a Chrome Store combina Arcade demo + Arcade AI Videos extensions).
- Versão 1.9.33 (cadence de minor version, sinal de feature shipping).
- Tamanho 11.9 MiB (extension bem maior — traz video engine).
- D-U-N-S: 085857644 (HQ legal).
- Localização: 595 Market Street Floor 10 SF CA.

### Navattic

- **Não está na Chrome Web Store** (pelo menos não na busca direta). Captura de demos por terceiros — Storylane + Supademo + Arcade cobrem isso. Navattic focus histórico é enterprise sales-led, não PLG install flow.

### GuiaFlow — caso de estudo

- Versão 0.1.7 (extension muito nova).
- **0 reviews, 36 installs.**
- **Localização: pt-BR.**
- Tamanho minúsculo: 84.74 KiB.
- Sem trading status declarado (Brazilian developer, optou por não se identificar).

> Implicação direta para a EasyDemo: extension MV3 ainda é **um terreno completamente vazio em português**. GuiaFlow foi o único a registrar e tem ~30 installs. **Espaço competitivo claro.**

### ⚠️ GuiaFlow não tem link de "Add to Chrome" coerente

A descrição da extensão só funciona se o usuário tem o editor aberto em `https://guiaflow-seven.vercel.app`. Caso contrário, capturas não têm destino. Isso limita a adoption self-service.

---

## Inferências e métricas derivadas

| Métrica | Storylane | Supademo | Arcade | GuiaFlow |
|---|---:|---:|---:|---:|
| Reviews / Install ratio (%) | 0.16% | 0.084% | 0.066% | 0% |
| Updates em 2026 (até out) | alta (v4.0.x) | muito alta (v7.5.x) | alta (v1.9.x) | baixa (v0.1.7) |
| Tamanho (MiB) | 10.16 | 3.93 | 11.9 | 0.083 |
| Featured na store? | ✅ Featured | ✅ Featured | ✅ Featured | ❌ Não |

> Reviews/Install ratio é proxy para **richengagement**: Storylane tem o review-per-install mais alto. Supademo se aproxima.

## Conclusão para EasyDemo

**Posicionamento competitivo chave:**

1. **Não há nenhum player BR consolidado** na Chrome Web Store em "interactive demo". A categoria é dominada por Supademo/Arcade/Storylane (todos 30k-50k+).
2. **Cadence de release** é indicador de quão rápido o player continua investindo. Supademo 7.5.18 em out/2026 = ritmo biweekly. EasyDemo precisa ter update/month ao menos.
3. **Locale pt-BR** é diferencial totalmente inexplorado. GuiaFlow pegou essa faixa mas com execution fraca.
4. **Tamanho da extensão** (Supademo 3.93 MiB vs Arcade 11.9 MiB) sugere que **a brute-force de feature não exige binaries gordos** — vídeo pode ser render server-side, extensão só envia eventos.

## Fonts & citations

- Storylane: https://chromewebstore.google.com/detail/storylane/ongmhighpnfpojfidgigcjflgdkjfdeb (capture out/2026, v4.0.5.10)
- Supademo: https://chromewebstore.google.com/detail/supademo-ai-interactive-d/jblbcpkejogbghfdglhfjlplchcnmohm (capture out/2026, v7.5.18)
- Arcade: https://chromewebstore.google.com/detail/arcade/gagidkjllbdgggpboolfmmdpeagghjlm (capture out/2026, v1.9.33)
- GuiaFlow: https://chromewebstore.google.com/detail/guideflow/bogjjfmcceccnepkpijiohglllbgbofd (capture out/2026, v0.1.7)
