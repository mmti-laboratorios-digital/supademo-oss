# POC-4 — Tamanho real do bundle `@easydemo/player`

**Data**: 2026-10-18
**Autor**: subagente EasyDemo
**Status**: ✅ CONCLUÍDA
**Script**: [`apps/web/scripts/poc-player-bundle-size.ts`](../../apps/web/scripts/poc-player-bundle-size.ts)

---

## 1. Hipótese

O player público (`@easydemo/player`) é o que o usuário final do embed baixa. O
`tech/RECOMMENDATION.md` projeta **≤ 10 KB gzip** baseado em escolhas de libs
leves (`framer-motion`, `@floating-ui/dom` — mas atenção, **atualmente o player
não usa framer-motion ainda**, ver código abaixo).

Pergunta concreta: **quanto o bundle real pesa com/sem brotli?**

## 2. Método

### 2.1 Build

Roda `pnpm --filter @easydemo/player build` (= `vite build` em modo `lib`).
Saída:

```
dist/index.js   (ES module, sourcemap)
dist/index.cjs  (CommonJS, sourcemap)
dist/style.css  (CSS bundle)
```

### 2.2 Compressão

Para cada artefato, medimos `Buffer.length` em três estados:

| estado | como |
|---|---|
| raw | bytes do arquivo |
| gzip-9 | `zlib.gzipSync(buf, { level: 9 })` |
| brotli-q11 | `zlib.brotliCompressSync(buf, { params: { [BROTLI_PARAM_QUALITY]: 11, [BROTLI_PARAM_MODE]: BROTLI_MODE_TEXT } })` |

> Não usamos `gzip` CLI porque o `node:zlib` produz saída idêntica e mede
> brotli no mesmo processo. O `vite build` já reporta gzip — nós confirmamos
> que bate (1.55 KB vs nosso 1540 B).

### 2.3 Limitações

- **Não rodamos `size-limit`** porque o pacote é `private: true` e não tem
  `files` no `package.json` ainda — instalar `size-limit` só para essa POC seria
  overhead. O relatório manual do vite já é a fonte primária.
- **Não medimos dependências externalizadas** (`react`, `react-dom`,
  `react/jsx-runtime`). Em produção o embed usa `react@19` via `esm.sh`/CDN,
  não no bundle do player. Se for bundle self-contained: somar ~45 KB gzip de
  React 19.

## 3. Resultado

```
dist/index.cjs    raw=3.36 KB   gzip=1.40 KB   brotli=1.23 KB
dist/index.js     raw=4.36 KB   gzip=1.50 KB   brotli=1.32 KB
dist/style.css    raw=2.07 KB   gzip=0.83 KB   brotli=0.67 KB
```

**Soma JS + CSS (o que vai pro CDN do embed)**:

| formato | bytes | KB |
|---|---|---|
| raw | 6.580 | **6.4 KB** |
| gzip-9 | 2.386 | **2.3 KB** |
| brotli-q11 | 2.034 | **2.0 KB** |

Total `dist/` (incluindo sourcemaps): **32.9 KB**.

### 3.1 Comparação com referências do mercado

| player | gzip JS+CSS |
|---|---|
| **EasyDemo player (esta POC)** | **~2.3 KB** |
| Storylane embed (estimativa público) | ~80-120 KB |
| Supademo embed (estimativa) | ~50 KB |
| Arcade embed | ~150 KB |
| Navattic embed | ~70 KB |

Estamos **~20× menores que o concorrente mais leve** — e isso é **sem** ainda
ter integrado `framer-motion` (animações de step). Quando integrarmos, espere
o JS subir para ~6-8 KB gzip.

## 4. Conclusão

| pergunta | resposta |
|---|---|
| O bundle cabe no orçamento de ≤ 10 KB gzip? | ✅ Sim — 2.3 KB gzip, com folga de 4× |
| Cabe no ≤ 50 KB target competitivo? | ✅ Folgado |
| Brotli ganha o quê sobre gzip? | +15-20% menor (2.0 KB vs 2.3 KB) — ativar brotli no Cloudflare é obrigatório |
| CSS separado é boa ideia? | ✅ Sim — CSS é 0.67 KB brotli; cacheia por 1 ano; JS só muda quando há feature nova |

### Recomendações

1. **Ativar Brotli no Cloudflare** (grátis no plano Free) — ganho imediato de 15-20%.
2. **Mover CSS para `dist/styles.css` separado** com header `Cache-Control: public, max-age=31536000, immutable`.
3. **Versionar JS no filename** (`dist/index.v2.js`) — quando uma demo quebrar cache, só o vídeo do cliente recarrega.
4. **Não publicar sourcemaps** em produção (são 23 KB que não servem ao usuário final).
5. **Quando integrar framer-motion** (Fase 2), medir de novo: a lib sozinha custa ~12 KB gzip. Tree-shaking agressivo com `framer-motion/m` (motion primitives) reduz a ~4 KB gzip.
6. **Considerar code-splitting**: o `Hotspot.tsx` é raramente usado (só para hotspots clicáveis). Pode virar lazy import.

### Anexo — como rodar

```bash
./node_modules/.bin/tsx apps/web/scripts/poc-player-bundle-size.ts
```

Saída completa:
```
┌───────────────┬─────────────┬────────────┬────────────────┐
│ file          │ raw (B)     │ gzip-9 (B) │ brotli-q11 (B) │
├───────────────┼─────────────┼────────────┼────────────────┤
│ index.cjs     │ 3360        │ 1434       │ 1256           │
│ index.js      │ 4463        │ 1540       │ 1347           │
│ style.css     │ 2117        │ 846        │ 687            │
└───────────────┴─────────────┴────────────┴────────────────┘
```