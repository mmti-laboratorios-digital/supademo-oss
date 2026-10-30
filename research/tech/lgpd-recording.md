# LGPD em gravação de demos — mascaramento, retenção, criptografia

> Boas práticas para lidar com dados pessoais ao classificar/editar/publicar demos interativas. Cobre: detecção automática de PII em screenshots, blur/redaction, criptografia at-rest, retenção LGPD e compliance.

---

## 1. Princípios LGPD que tocam nosso produto

A LGPD (Lei 13.709/2018) trata **qualquer dado que identifique pessoa natural** como dado pessoal. Categorias relevantes para demos:

### 1.1 Dados pessoais comuns
- Nome completo, email, telefone, CPF, RG, endereço.
- Cargo, função, departamento.
- IP, cookies, identificadores de dispositivo.

### 1.2 Dados sensíveis (art. 5º, II)
- Origem racial/étnica, religião, opinião política, filiação sindical.
- Dado de saúde, sexual, genético, biométrico.

### 1.3 Princípios que devemos aplicar

| Princípio (art. 6º) | Aplicação |
|---------------------|-----------|
| **Finalidade** | Demo interativo tem finalidade comercial legítima (mostrar software) — usar como base legal: execução de contrato + legítimo interesse |
| **Necessidade** | Mascarar tudo que não é estritamente necessário para o demo |
| **Segurança** | Criptografia at-rest + in-transit + controle de acesso |
| **Prevenção** | Detectar e mascarar PII antes do upload |
| **Transparência** | Aviso ao usuário criador + visitante que verá dados podem estar presentes |
| **Retenção** | Limite claro (90 dias?) + direito de exclusão |

**Fontes oficiais:**
- LGPD texto: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>
- Boas práticas LGPD (gov.br): <https://www.gov.br/governodigital/pt-br/seguranca-e-protecao-de-dados/guias/guia_lgpd.pdf>
- Cartilha MCTI: <https://www.gov.br/mcti/pt-br/acesso-a-informacao/lei-geral-de-protecao-de-dados-pessoais-lgpd/publicacoes-defeso-2026/boas-praticas.pdf>

---

## 2. Estratégia de mascaramento em 3 camadas

### 2.1 Camada 1 — Pré-captura (extensão)

Antes mesmo de capturar o screenshot, o content script pode **bloquear/ocultar inputs sensíveis** se o usuário marcar "Modo LGPD".

```ts
// content-script-mask.ts (extensão)
const SENSITIVE_SELECTORS = [
  'input[type="password"]',
  'input[name*="senha" i]', 'input[name*="password" i]',
  'input[name*="cpf" i]', 'input[name*="cnpj" i]',
  'input[name*="cartao" i]', 'input[name*="card" i]',
  'input[name*="cvv" i]', 'input[name*="cvc" i]',
  'input[autocomplete="cc-number"]',
  'input[name*="email" i]',
  '[data-private]', '[data-pii]',
];

async function maskSensitiveFields() {
  for (const sel of SENSITIVE_SELECTORS) {
    const els = document.querySelectorAll(sel);
    for (const el of els) {
      if (el instanceof HTMLInputElement) {
        const original = el.value;
        el.dataset._piiOriginal = original;
        el.value = '••••••••';
        el.style.filter = 'blur(4px)';
      } else if (el instanceof HTMLElement) {
        el.style.filter = 'blur(8px)';
      }
    }
  }
}
```

Problema: se o cliente gravar com seu próprio e-mail preenchido, o value do `<input>` ainda é o real. **Substituir o `value` é obrigatório** para evitar que apareça na captura.

### 2.2 Camada 2 — Pós-captura (processamento server-side)

Quando o usuário termina a gravação, o backend aplica blur via OCR + regex em cada imagem.

Pipeline:

```
Screenshot → Tesseract.js OCR → text blocks → regex PII → render blur overlay → WebP final
```

**Implementação:**

```ts
// src/server/redact.ts
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

const PII_PATTERNS = [
  { re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, label: 'CPF' },
  { re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, label: 'CNPJ' },
  { re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, label: 'CARD' },
  { re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, label: 'EMAIL' },
  { re: /\(\d{2}\)\s?\d{4,5}-?\d{4}/g, label: 'PHONE_BR' },
  { re: /\b\d{5}-?\d{3}\b/g, label: 'CEP' },
  { re: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: 'IP' },
  // nomes próprios são mais difíceis — combinar com lista de input names
];

export async function redactPii(imagePath: string): Promise<string> {
  const worker = await createWorker('eng');
  const { data } = await worker.recognize(imagePath);
  await worker.terminate();

  const matches: Array<{ x: number; y: number; w: number; h: number; label: string }> = [];

  for (const word of data.words) {
    for (const { re, label } of PII_PATTERNS) {
      if (re.test(word.text)) {
        matches.push({
          x: word.bbox.x0, y: word.bbox.y0,
          w: word.bbox.x1 - word.bbox.x0,
          h: word.bbox.y1 - word.bbox.y0,
          label,
        });
        break;
      }
    }
  }

  // Render blur overlay
  let pipeline = sharp(imagePath);
  for (const m of matches) {
    pipeline = pipeline.composite([{
      input: Buffer.from(`
        <svg width="${m.w + 8}" height="${m.h + 8}">
          <rect x="0" y="0" width="${m.w + 8}" height="${m.h + 8}" fill="black" />
          <rect x="0" y="0" width="${m.w + 8}" height="${m.h + 8}" fill="black" filter="url(#blur)" />
        </svg>
      `),
      top: Math.max(0, m.y - 4),
      left: Math.max(0, m.x - 4),
    }]);
  }
  return pipeline.webp({ quality: 80 }).toBuffer();
}
```

**Custo:** ~500ms por imagem em VPS 8GB. Job graphile-worker `redact_sensitive_fields` faz isso em background.

### 2.3 Camada 3 — UI de revisão manual

Após OCR automatizado, mostrar preview no editor com marcações. Usuário pode:
- Aceitar blur automático.
- Adicionar blur manual em outras áreas (rectangle tool).
- Confirmar e publicar.

```tsx
// editor/src/components/Review.tsx
<RedactionCanvas
  image={originalUrl}
  detectedPii={piiMatches}
  manualMasks={userMasks}
  onConfirm={(final) => saveDemoStep(stepId, final)}
/>
```

O usuário é o "controlador" final do dado. Confirmou que está OK? Demo é publicado.

---

## 3. Estratégia de criptografia

### 3.1 In-transit

- **Tudo HTTPS** (Caddy + Let's Encrypt).
- **HSTS** habilitado (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
- **TLS 1.3** (Caddy usa automaticamente).

### 3.2 At-rest — camadas

| Camada | Como |
|--------|------|
| **Disco do VPS** | LUKS encryption (Hetzner oferece); ou confiar no data center (UE LGPD-friendly) |
| **R2 storage** | Server-side encryption com SSE (habilitado por default no R2) |
| **Banco Postgres** | Não habilitado por default; opcional `pgcrypto` para colunas PII específicas |
| **Backups pgBackRest** | Criptografia AES-256-CBC nativa: `repo1-cipher-type=aes-256-cbc` |

### 3.3 Colunas com criptografia adicional

Para PII que **precisamos armazenar** (e.g. `customer.email` do Asaas):

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE subscriptions (
  ...
  customer_email_encrypted bytea,
  customer_email_hash text,  -- para lookup sem descriptografar
);

-- Inserir
INSERT INTO subscriptions (customer_email_encrypted, customer_email_hash)
VALUES (
  pgp_sym_encrypt('user@example.com', current_setting('app.encryption_key')),
  encode(digest('user@example.com', 'sha256'), 'hex')
);
```

Chave mestra em variável de ambiente (`ENCRYPTION_KEY`), rotacionada anualmente.

### 3.4 Hash para lookup

Email → SHA256 (com salt) → index. Buscar: `WHERE customer_email_hash = encode(digest($1, 'sha256'), 'hex')`.

Sem descriptografar nada na query.

---

## 4. Retenção LGPD

### 4.1 Política de retenção

| Dado | Retenção | Justificativa |
|------|----------|---------------|
| Screenshots de demos | Enquanto demo estiver publicado + 30 dias após deletar | Contrato com cliente |
| Audit logs | 24 meses | Obrigação legal (fiscal/tributária em alguns casos) |
| Billing events | 5 anos | Obrigação fiscal BR |
| Demo_events (analytics) | 90 dias hot + 1 ano agregado | Analytics |
| Webhook payloads | 30 dias (debug) | Operação |
| Email content (Resend) | 30 dias | Resend default |

### 4.2 Jobs automáticos

```ts
// graphile-worker tasks
'cleanup_expired_demos': async (payload) => {
  // Soft delete > 30 dias; anonymize PII
  await db.execute(sql`
    UPDATE demo_steps ds SET image_url = NULL
    FROM demos d
    WHERE ds.demo_id = d.id
      AND d.deleted_at < now() - interval '30 days'
  `);
},

'anonymize_old_audit_logs': async () => {
  await db.execute(sql`
    UPDATE audit_logs
    SET payload = '{"anonymized": true}'::jsonb,
        user_agent = NULL,
        ip_address = NULL
    WHERE created_at < now() - interval '24 months'
  `);
},

'purge_old_analytics': async () => {
  await db.execute(sql`
    DELETE FROM demo_events
    WHERE created_at < now() - interval '90 days'
  `);
},
```

### 4.3 Direito de eliminação (art. 18, VI)

Se um visitante do demo pedir eliminação dos seus dados (improvável, mas legalmente possível):

```ts
// Edge case: lead deixou email em formulário dentro do player
async function eraseLead(email: string, tenantId: string) {
  // 1. Apaga lead capture events
  await db.execute(sql`
    DELETE FROM demo_events
    WHERE tenant_id = ${tenantId}
      AND payload->>'email' = ${email}
      AND type = 'lead_capture'
  `);
  // 2. Apaga audit logs PII daquele email
  await db.execute(sql`
    UPDATE audit_logs
    SET payload = '{"erased": true}'::jsonb
    WHERE tenant_id = ${tenantId}
      AND payload->>'email' = ${email}
  `);
  // 3. Log da operação de eliminação (sem guardar o email apagado)
  await db.insert(auditLogs).values({
    tenantId, action: 'gdpr.erase', payload: { at: new Date() },
  });
}
```

Resposta ao titular: até 15 dias (art. 18 §5º).

---

## 5. Consentimento e aviso

### 5.1 Quem cria o demo

Ao instalar a extensão, mostrar aviso:

> "Esta extensão captura screenshots da sua navegação. Você é responsável por mascarar dados sensíveis antes de publicar. O EasyDemo aplica blur automático em padrões conhecidos (CPF, cartão, email) via OCR."

LGPD exige finalidade declarada. Ao publicar demo, registrar:
- Quem autorizou (user_id).
- Hash do conteúdo (integridade).
- IP de publicação (audit).

### 5.2 Quem vê o demo (visitante)

Iframe embed vem com banner discreto "Demo interativo criado com EasyDemo" (já requisito de LGPD art. 9º).

Se demo tiver lead capture form (email), precisamos de consent explícito via checkbox ou double opt-in.

---

## 6. Subprocessadores (LGPD art. 9º, §2º)

Ter um contrato de operador (LGPD art. 39) com cada vendor que processa dado pessoal:

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|---------------|-------------|---------------|
| Hetzner | Hosting | Tudo | UE (Frankfurt) | Sim |
| Cloudflare R2 | Storage | Screenshots | Global (configurável) | Sim |
| Cloudflare | CDN, Workers | Tráfego | Global | Sim |
| Clerk | Auth | Email, nome | US (ou EU) | Sim |
| Asaas | Pagamento | Email, CPF/CNPJ | BR | Sim (Asaas tem DPA PT-BR) |
| Resend | Email | Email | US | Sim |
| PostHog | Analytics | Anonimizado (UUID) | US/EU | Sim |
| Sentry | Errors | Stack trace pode conter URL + email | US/EU | Sim |

Publicar lista em `/legal/subprocessors` para clientes consultarem.

---

## 7. Boas práticas específicas para a extensão Chrome

### 7.1 Não capturar em sites sensíveis automaticamente

Bloquear captura em:
- `chrome://*`, `chrome-extension://*`
- `*.gov.br/*` (sites gov podem conter PII)
- Sites com `data-no-capture` no meta tag

```js
const BLOCKED_PATTERNS = [
  /^chrome:/,
  /^chrome-extension:/,
  /^https?:\/\/.*\.gov\.br/,
];
```

### 7.2 Não capturar quando a página tem senha visível

Se detectar `<input type="password">` visível, pausar gravação ou mostrar aviso.

### 7.3 Não capturar conteúdo de abas anônimas sem confirmação

LGPD adverte contra captura sem ciência. Mostrar modal "Você está em navegação anônima. Continuar?".

### 7.4 Logs da extensão

Logs nunca devem conter PII capturada. Pino redact patterns:

```ts
const logger = pino({
  redact: {
    paths: ['payload.email', 'payload.cpfCnpj', 'payload.name'],
    censor: '[REDACTED]',
  },
});
```

---

## 8. Ferramentas úteis

| Ferramenta | Versão | Uso |
|------------|--------|-----|
| `tesseract.js` | `^5.1.0` | OCR no backend para detectar PII |
| `sharp` | `^0.33.0` | Processar imagem (composite blur overlay) |
| `pgcrypto` (Postgres ext) | built-in | Criptografia colunar |
| `dompurify` | `^3.1.6` | Sanitizar HTML em captions/descrições |
| `pino` | `^9.5.0` | Logger com redact |
| `@aws-sdk/client-s3` | `^3.680` | Upload R2 (SSE) |

---

## 9. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Detecção e bloqueio pré-captura na extensão | S |
| OCR + regex pipeline no backend | M |
| UI de revisão manual no editor | M |
| pgcrypto setup + helpers | S |
| Jobs de retenção/anonymização | S |
| DPA com subprocessadores | S (jurídico) |
| Banner de consent no player público | S |

**Total LGPD pipeline: M.** Cabe em 1-2 sprints.

---

## 10. Referências

- LGPD texto integral: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>
- Boas práticas LGPD (gov.br): <https://www.gov.br/governodigital/pt-br/seguranca-e-protecao-de-dados/guias/guia_lgpd.pdf>
- Cartilha MCTI Boas Práticas: <https://www.gov.br/mcti/pt-br/acesso-a-informacao/lei-geral-de-protecao-de-dados-pessoais-lgpd/publicacoes-defeso-2026/boas-praticas.pdf>
- Captura de imagens e LGPD (ConJur): <https://conjur.com.br/2021-mai-26/leal-captura-imagens-lgpd-cuidados-controlador>
- Tesseract.js: <https://github.com/naptha/tesseract.js>
- pgcrypto docs: <https://www.postgresql.org/docs/current/pgcrypto.html>
- pgBackRest encryption: <https://pgbackrest.org/user-guide.html#encryption>