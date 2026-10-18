# Pesquisa Competitiva — Demos Interativas / Supademo BR

Dissecação detalhada de cada player-referência para o produto a ser clonado, conduzida em **18-out-2026**.

## Sumário rápido

### Alvo de clonagem
- **[supademo.md](./supademo.md)** — Supademo (alvo, https://supademo.com)

### Players globais (concorrentes diretos no G2 "Demo Automation")
- **[arcade.md](./arcade.md)** — Arcade (https://www.arcade.software)
- **[storylane.md](./storylane.md)** — Storylane (https://www.storylane.io)
- **[navattic.md](./navattic.md)** — Navattic (https://www.navattic.com)
- **[tango.md](./tango.md)** — Tango (https://tango.us)
- **[scribe.md](./scribe.md)** — Scribe (https://scribehow.com)
- **[loom.md](./loom.md)** — Loom (https://www.loom.com) — **somente o subset de demo interativa**

### Players brasileiros (concorrentes diretos no mercado BR)
- **[getdemo.md](./getdemo.md)** — Getdemo (https://getdemo.com.br)
- **[interdemo.md](./interdemo.md)** — Interdemo (https://interdemo.com.br)
- **[demohub.md](./demohub.md)** — Demohub (https://demohub.com.br) — **slot vago, domínio não responsivo**
- **[fluidz.md](./fluidz.md)** — Fluidz Demos (https://demos.fluidz.com.br)
- **[guiaflow.md](./guiaflow.md)** — **GuiaFlow (https://guiaflow.pro)** — **PRINCIPAL RIVAL, open-source MIT**

### Saída consolidada
- **[SUMMARY.md](./SUMMARY.md)** — Matriz comparativa completa, gap analysis vs GuiaFlow, top 5 features must-have, top 5 diferenciais, 8 oportunidades de mercado BR, tabela de pricing, recomendação de MVP.

---

## Metodologia

1. Fetch da **landing page** de cada produto em modo markdown.
2. Fetch da **página de pricing** (com tier table completa).
3. Fetch de **docs/changelog/OpenAPI** quando público.
4. **View-source** em casos-chave (Interdemo, Fluidz, Getdemo, GuiaFlow editor) para detectar stack via nomes de arquivos e estrutura HTML (`/_next/static/...` = Next.js, `data-wf-domain` = Webflow, `/_next/...turbopack` = Next.js turbopack, `vendor/driver` = driver.js, etc.).
5. **GitHub lookup** para GuiaFlow → https://github.com/gugamistri/gflow (31 ⭐, MIT, 156 commits, OpenAPI 3.1, MCP server com OAuth 2.1).
6. **`llms.txt`** do GuiaFlow (descreve API + MCP + limites técnicos em texto puro — fonte riquíssima).
7. **Busca de comparações third-party e reviews G2/Capterra/Reddit** para validar fraquezas e prós.

## Conclusão principal

- O **mercado global é validado** (G2 "Demo Automation" tem 100+ vendors, Supademo é o leader).
- O **mercado BR é fragmentado e underserved**: Getdemo vende consultivamente, Interdemo/Fluidz são early-stage, **GuiaFlow é open-source MIT e já empacota tudo que importa** (MCP, OpenAPI, EXT, Electron, BYOK).
- **Gap claro**: nenhum player BR combina WhatsApp Business API + Pix dinâmico + AI Demo Agent em PT-BR + Capture HTML a preço acessível.
- **Recomendação**: posicionar MVP entre R$99 e R$199/mês com feature parity Tier 2 do mercado global.

Veja **[SUMMARY.md](./SUMMARY.md)** para a análise completa.
