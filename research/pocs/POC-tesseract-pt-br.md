# POC-3 — Tesseract.js em PT-BR (precisão)

**Data**: 2026-10-18
**Autor**: subagente DemoBR
**Status**: ✅ CONCLUÍDA (com achado negativo importante)
**Script**: [`apps/web/scripts/poc-tesseract-pt-br.ts`](../../apps/web/scripts/poc-tesseract-pt-br.ts)

---

## 1. Hipótese

Tesseract.js é citado no `tech/RECOMMENDATION.md` como peça da **LGPD tooling**:
detectar PII (CPF, CNPJ, email) em screenshots B2B antes de publicar a demo
publicamente, aplicando blur onde necessário.

A hipótese: **Tesseract.js com `lang='por'` consegue identificar padrões PII
comuns (CPF, CNPJ, email, R$) em imagens limpas de UI**, com latência aceitável
(< 200 ms por imagem) para rodar no momento do `PUBLISH` de uma demo.

## 2. Método

### 2.1 Geração das imagens de teste

Tentativa 1 (rejeitada): bitmap 8×8 desenhado à mão com `pngjs`. Resultado:
**0% de acerto** — Tesseract não consegue distinguir `.` de `/` e confunde `9`
com `0` em fonte minúscula.

Tentativa 2 (escolhida): **ImageMagick + Liberation Sans Bold 36pt** sobre fundo
branco. Mais próximo do screenshot B2B real. Fonte já presente em Ubuntu/Debian,
zero dep nativa extra.

Cada PNG é gerado em memória e salvo em `/tmp/opencode/poc-tesseract/*.png` para
auditoria visual.

### 2.2 Casos de teste (5)

| caso | texto esperado | regex |
|---|---|---|
| cpf | `123.456.789-09` | `\d{3}\.\d{3}\.\d{3}-\d{2}` |
| cnpj | `12.345.678/0001-90` | `\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}` |
| email-upper | `FULANO.SILVA@EMPRESA.COM.BR` | `[\w.+-]+@[\w-]+\.[\w.-]+` |
| email-lower | `fulano.silva@empresa.com.br` | idem |
| pt-br-frase | `Olá, fatura de maio 2026 no valor de R$ 1.234,56` | `R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}` |

### 2.3 Execução OCR

```ts
import { createWorker } from "tesseract.js";
const worker = await createWorker("por", 1, { logger: () => {} });
const { data } = await worker.recognize(buf);
const text = (data.text ?? "").trim();
```

- `lang: "por"` (português, tesseract traineddata do CDN).
- Worker instanciado **uma vez** e reutilizado para as 5 imagens (igual ao uso real).
- Métricas: tempo de OCR por imagem; **hit** = regex casa em `text`.

## 3. Resultado

### 3.1 Tabela

| caso | regex bateu? | tempo OCR | texto obtido |
|---|---|---|---|
| cpf | ✅ | 44 ms | `123.456.789-09` |
| cnpj | ✅ | 23 ms | `12.345.678/0001-90` |
| email-upper | ❌ | 41 ms | `FULANO.SILVAGEMPRESA.COM.BR` (sem `@`) |
| email-lower | ❌ | 32 ms | `fulano.silva&empresa.com.br` (`@` virou `&`) |
| pt-br-frase | ✅ | 52 ms | `Olá, fatura de maio 2026 no valor de R$ 1.234,56` |

**Acerto global: 3/5 (60%).**

- **Init do worker (1ª carga)**: ~200 ms — vem do download do `por.traineddata`.
- **Tempo médio por imagem (warm)**: ~38 ms.

### 3.2 Achado crítico

**O caractere `@` é sistematicamente comido pelo OCR** — ele vira "G" em fonte
bold maiúscula e "&" em minúscula. Isso quebra a detecção de email em ~100% dos
casos de teste sintético.

A causa provável é a **resolução baixa do `@` em fontes de 36pt bold**: o
glifo fica fino e some após o threshold do Tesseract. Em screenshots B2B reais
(com fonte 14-16pt @ ~96 DPI), o problema provavelmente é pior.

### 3.3 Tempo de execução

| cenário | tempo |
|---|---|
| Init (download `por.traineddata` do CDN) | ~200 ms |
| OCR de 1 imagem (warm) | 23-52 ms |
| Throughput | **~25-40 imagens/s em CPU única** |

## 4. Conclusão e recomendação

### Pergunta direta: Tesseract.js dá conta da LGPD tooling?

| pergunta | resposta |
|---|---|
| Detecta CPF formatado? | ✅ Sim, em imagem limpa |
| Detecta CNPJ formatado? | ✅ Sim |
| Detecta email? | ❌ **Não confiavelmente** — `@` é comido |
| Detecta valor monetário BR (`R$ 1.234,56`)? | ✅ Sim |
| Latência aceitável para PUBLISH? | ✅ ~40 ms por imagem é trivial |
| Custo de init do worker | ⚠️ ~200 ms primeira vez (CDN download); depois cacheia |

### Recomendação para DemoBR

**NÃO usar Tesseract.js como detector único de email/PII.** O `@` é um padrão
crítico de LGPD e o OCR não captura.

**Arquitetura correta (híbrida):**

1. **Para texto dentro do DOM** (que é 90% dos casos — Demos são tours sobre
   páginas web): usar **regex no `document.body.innerText`** via `chrome.scripting.executeScript`.
   Zero OCR, 100% preciso, < 5 ms.
2. **Para texto dentro de imagens embutidas** (logos, screenshots embedded como
   `<img>`): aí sim OCR. Mas prefira **estratégia "fail-open + auditoria"** —
   marca como "needs review" se o OCR encontrar padrões parciais (CPF sem
   contexto, CNPJ truncado), em vez de "pass" automático.
3. **Whitelist + blacklist de domínios**: emails do tipo `@gupy.io`,
   `@pipedrive.com` não são PII — emails `@gmail.com`, `@hotmail.com` são.

### Adaptações necessárias

- Testar Tesseract em screenshots **reais** (não sintéticos) — screenshots têm
  JPEG artifacts, antialias sub-pixel, fontes do sistema operacional do usuário.
- Tentar `PSM 6` (assume single block de texto) ou `PSM 11` (sparse text) — pode
  melhorar recall do `@`.
- Se for manter OCR, considerar **Tesseract nativo (WASM compilado)** em vez do
  `tesseract.js` puro — ~5x mais rápido, mas bundle 4-6 MB maior.

### Anexo — como rodar

```bash
# deps: tesseract.js + pngjs (instaladas via pnpm add -D --filter web)
# deps externas: ImageMagick (`convert`), Liberation Sans (padrão Ubuntu)

./node_modules/.bin/tsx apps/web/scripts/poc-tesseract-pt-br.ts
# saída: 5 PNGs em /tmp/opencode/poc-tesseract/ + tabela no stdout
```