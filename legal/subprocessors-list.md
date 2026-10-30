# Lista de Subprocessadores — DemoBR

> Esta página lista os subprocessadores (terceiros) que tratam dados
> pessoais em nome da DemoBR LTDA. Atualizamos esta lista sempre que
> um novo subprocessador é contratado ou substituído.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**
>
> Notificação de mudanças: aviso prévio de **+30 dias** conforme
> `privacy-policy.md` §4.1 e `dpa-data-processing-agreement.md` §8.2.

---

## 1. Subprocessadores ativos

Tabela atualizada em **18/Out/2026**.

### 1.1 Hospedagem e infraestrutura

| Vendor | Função | Dados tratados | Localização do processamento | DPA assinado? |
|--------|--------|----------------|------------------------------|---------------|
| **Hetzner Online GmbH** | VPS, hosting do banco de dados PostgreSQL primário e réplicas | Metadados do servidor, dados de aplicação (Postgres) | 🇩🇪 Alemanha (Falkenstein/Frankfurt) | ✅ Sim — ISO 27001; DPA Hetzner EU padrão |
| **Cloudflare Inc** | CDN, WAF, DDoS protection, R2 (object storage), DNS | Logs de acesso HTTP, screenshots, áudios (R2), metadados de tráfego | 🇺🇸 EUA (com caching em 🇪🇺 UE para assets) | ✅ Sim — DPA Cloudflare Enterprise |

### 1.2 Autenticação

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **Clerk** | SSO, OAuth, gestão de Organizations e usuários | E-mail, nome, foto (se fornecida), hash de senha, MFA, audit log de auth | 🇺🇸 EUA (com região EU opcional) | ✅ Sim — DPA Clerk padrão + BAA quando aplicável |

### 1.3 Pagamento

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **Asaas Gestão Financeira** (Asaas IP LTDA) | Processamento de PIX, boleto, cartão; emissão de NF-e | CPF/CNPJ do pagador, endereço de cobrança, histórico de cobrança | 🇧🇷 Brasil | ✅ Sim — termos de serviço Asaas; nota: Asaas é **processador de dados financeiros** sob nossa relação, sem detalhes de cobrança nesta lista. Retenção fiscal obrigatória: **60 meses**. |

> ⚠️ Detalhes de regras de cobrança / billing / estorno NÃO são
> tratados nesta lista jurídica. Ver `terms-of-service.md` §4.

### 1.4 E-mail transacional

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **Resend** | Envio de e-mails transacionais (login, billing, alertas DSR) | E-mail do destinatário, conteúdo do e-mail, metadados de envio | 🇺🇸 EUA | ✅ Sim — DPA Resend padrão |

### 1.5 Analytics

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **PostHog Cloud** | Analytics de produto (LGPD-safe; sem PII) | Eventos agregados, hashes de IDs, device category, Accept-Language country | 🇺🇸 EUA + 🇪🇺 UE (data residency EU opt-in) | ✅ Sim — DPA PostHog EU/US |

### 1.6 Observabilidade

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **Sentry** | Error tracking e performance APM | Stack traces, mensagens de erro (com PII redact), URL, browser | 🇺🇸 EUA + 🇪🇺 UE (data residency EU opt-in) | ✅ Sim — DPA Sentry + BAA quando aplicável |

### 1.7 Inteligência Artificial (Fase 2 do MVP — opcional)

> Estes subprocessadores **só são ativados** se o Cliente habilitar
> o recurso de IA. Cada um deles se compromete explicitamente a
> **não usar os dados do Cliente para treinar modelos** (cláusula
> de no-train verificada e datada).

| Vendor | Função | Dados tratados | Localização | DPA assinado? |
|--------|--------|----------------|------------|---------------|
| **OpenAI** (Fase 2) | AI text personalization por step | Texto dos steps (enviado via API) | 🇺🇸 EUA | ✅ Sim — DPA OpenAI + cláusula API-only (no-train) |
| **Anthropic** (Fase 2) | AI text personalization por step (alternativa) | Texto dos steps (enviado via API) | 🇺🇸 EUA | ✅ Sim — DPA Anthropic + cláusula API-only (no-train) |
| **ElevenLabs** (Fase 2) | Narração TTS pt-BR | Texto convertido em fala; voz clonada (opt-in) | 🇺🇸 EUA | ✅ Sim — DPA ElevenLabs + BAA quando aplicável |
| **Cartesia Sonic** (Fase 2 — opcional) | Narração TTS pt-BR (alternativa de custo) | Texto convertido em fala | 🇺🇸 EUA | ✅ Sim — DPA Cartesia |

---

## 2. Como somos notificados de mudanças?

### 2.1 Novos subprocessadores

Quando contratamos um **novo subprocessador** ou substituímos um
existente:

1. Anunciamos por e-mail ao DPO do cliente do plano Business com
   **30 dias de antecedência** (LGPD art. 39, III + GDPR art. 28, §2º).
2. Atualizamos esta página com a data de início de produção.
3. Clientes podem se opor justificadamente em 15 dias. Em caso de
   objeção válida, oferecemos alternativa ou cancelamento sem ônus.

### 2.2 Como cancelar um subprocessador

Clientes podem solicitar **encerramento** do tratamento por um
subprocessador específico, mas isso pode afetar a operação de
certas funcionalidades do DemoBR. Em alguns casos (ex.: Hetzner
para hospedagem), a recusa implica paralisação do serviço.

---

## 3. Categorias que NÃO usamos

Para sua tranquilidade, declaramos **não usar**:

- ❌ Cookies de publicidade comportamental de terceiros.
- ❌ Meta Pixel (Facebook / Instagram).
- ❌ Google Ads (incluindo Google Analytics GA4 não-configurado).
- ❌ TikTok Pixel, LinkedIn Insight, Twitter Pixel.
- ❌ Data brokers (venda de dados pessoais para terceiros).
- ❌ Redes de ads programáticas.

> A DemoBR é uma empresa **sem modelo de receita baseado em ads**.
> Nosso faturamento vem de assinaturas pagas (Pro / Business).

---

## 4. Conformidade GDPR (referência)

Para clientes europeus ou que tenham titulares na UE, observe:

- Todos os subprocessadores listados acima operam com **SCCs
  (Standard Contractual Clauses)** ou estão em países com adequacy
  decision quando aplicável.
- Subprocessadores com data residency EU:
  - Cloudflare (UE)
  - PostHog (UE opt-in)
  - Sentry (UE opt-in)

---

## 5. Histórico de alterações

| Data | Alteração |
|------|-----------|
| 18/Out/2026 | Versão inicial do modelo. |

---

## 6. Contato

Para dúvidas sobre subprocessadores:
- **DPO** (placeholder funcional): `placeholder@easydemo.io`
  *(a ser substituído pelo e-mail real do DPO após contratação — ver
  `DPO-PROCESS.md`)*
- **Segurança**: `security@easydemo.io`
- **Página pública**: `https://www.easydemo.io/subprocessadores`

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
