# Procedimento de Eliminação de Dados (LGPD art. 18, VI)

> Procedimento técnico-operacional para o endpoint
> `DELETE /api/v1/dsr?token=...` que executa o direito de eliminação
> previsto no LGPD art. 18, VI.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação e antes da implementação do endpoint.**
>
> **Atenção**: a LGPD art. 16 prevê exceções à eliminação — dados sob
> obrigação legal, interesse legítimo para exercício regular de
> direito em processo, ou interesse legítimo em conformidade legal
> (ex.: fiscais) **NÃO são apagados**. Ver §3.

---

## 1. Visão geral do fluxo

```
┌──────────────────────┐
│ 1. Recebe pedido     │  ← DELETE /api/v1/dsr?token=...
│    (autenticado)     │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 2. Verifica          │  ← Validar JWT + DB (token de uso único, TTL 30d)
│    identidade        │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 3. Classifica        │  ← "soft_deletable" vs "legal_hold"
│    dados             │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 4. Soft-delete       │  ← SET deleted_at em todas as linhas (≤ 7 dias)
│    imediato          │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 5. Job graphile-     │  ← Após 30d, job apaga blobs no R2 + PII em logs
│    worker hard-delete│
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 6. Mantém           │  ← Logs anonimizados (24m) + dados fiscais (60m)
│    (compliance)      │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ 7. Log de auditoria │  ← app.dsr_log: action='delete', status='done'
└──────────────────────┘
```

---

## 2. Recebe pedido e autenticação

### 2.1 Pré-requisitos

- `token` no query string é um **JWT de uso único**, válido por 30
  dias, assinado com a chave privada DemoBR.
- Claims obrigatórios:
  ```json
  {
    "jti": "single-use-uuid",
    "sub": "subject_email",
    "action": "delete",
    "issued_at": "2026-10-18T...",
    "expires_at": "2026-11-17T...",
    "scope": ["demos", "leads", "analytics", "billing"]
  }
  ```
- JWT deve estar no `app.dsr_token` com `used_at IS NULL`.

### 2.2 Verificações

```
1. Verificar assinatura do JWT com a chave pública (RS256).
2. Verificar que `app.dsr_token.jti` corresponde e `used_at IS NULL`.
3. Marcar `app.dsr_token.used_at = now()` antes de prosseguir (anti-replay).
4. Rate limit: 5 DSR/dia por e-mail (anti-DDoS/anti-fraude).
5. Verificar que identidade foi verificada (flag `identity_verified_at` em app.dsr_token).
6. Se `identity_verified_at` for > 30 dias, exigir nova verificação.
7. Log: INSERT INTO app.dsr_log com action='delete', status='in_progress'.
```

### 2.3 Resposta (intermediária)

```
HTTP 202 Accepted
{
  "dsr_id": "uuid",
  "status": "in_progress",
  "estimated_completion": "<now + 30d>",
  "tracking_url": "https://app.demobr.com.br/admin/dsr/{dsr_id}"
}
```

---

## 3. Classificação dos dados

Para cada categoria abaixo, marque:

- **Soft-deletable** (apagável).
- **Legal hold** (mantido por obrigação legal — ver tabela).
- **Compliance retention** (anonimizado, mantido para auditoria).

| Categoria | Classificação | Período de retenção legal |
|-----------|---------------|---------------------------|
| `app.users` (conta do creator) | Soft-deletable + anonymize PII no `users` | — |
| `app.workspaces` | Soft-deletable (cascade para demos, leads, members) | — |
| `app.demos` (registro) | Soft-deletable | — |
| Screenshots no R2 (`screenshots/*`) | Hard-delete após 30d | — |
| Áudios no R2 (`audio/*`) | Hard-delete após 30d | — |
| `app.steps` e `app.hotspots` | Soft-deletable (cascade com demos) | — |
| `app.leads` | Soft-deletable | — |
| `app.events` (analytics raw) | Hard-delete após 30d | — |
| `app.events_aggregate` (agregados) | Manter como compliance (já é anônimo) | 24 meses |
| `app.audit_log` (logs de auditoria do titular) | Manter PII hasheado por 24 meses (compliance); soft-delete do conteúdo | 24 meses |
| `app.billing_*` (cobranças) | **Legal hold** | 60 meses (CTN art. 173/196 + LGPD art. 16, III) |
| `app.fiscal_documents` (NF-e) | **Legal hold** | 60 meses |
| `app.dsr_log` (este registro) | Manter (imutável) | 24 meses |
| Notas fiscais em PDF/XML no R2 (`fiscal/*`) | **Legal hold** | 60 meses |
| Webhooks de saída (Asaas, Clerk) | Soft-deletable após 90d (já é rotina) | — |
| Suporte (zendesk-like) | Soft-deletable após 24 meses | — |

### 3.1 Base legal da manutenção

| Exceção | Base LGPD |
|---------|-----------|
| **Obrigação legal/tributária** (NF-e, cobrança) | LGPD art. 16, I (manter para cumprimento de obrigação legal/regulatória) |
| **Exercício regular de direitos em processo** | LGPD art. 16, IV |
| **Interesse legítimo em auditoria interna** (logs anonimizados) | LGPD art. 7º, IX + art. 16, IV |
| **Segurança e prevenção a fraudes** | LGPD art. 7º, IX |

---

## 4. Soft-delete imediato (executar em ≤ 7 dias)

### 4.1 Transação única (PostgreSQL)

```sql
BEGIN;

-- 1. Adicionar coluna deleted_at em tabelas que ainda não têm
-- (idempotente)
ALTER TABLE app.users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE app.workspaces ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE app.demos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE app.leads ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Setar variáveis de sessão para RLS
SET LOCAL app.current_actor_id = 'system:dsr-delete';

-- 3. Marcar todas as linhas do workspace titular
UPDATE app.workspaces
SET deleted_at = now(),
    name = '[deleted]',
    slug = 'deleted-' || id,
    logo_url = NULL,
    billing_customer_id = NULL
WHERE id IN (
  SELECT workspace_id FROM app.members
  WHERE user_email = :subject_email
);

UPDATE app.demos
SET deleted_at = now(),
    title = '[deleted demo]',
    description = NULL
WHERE workspace_id IN (
  SELECT id FROM app.workspaces
  WHERE name = '[deleted]'
);

UPDATE app.leads
SET deleted_at = now(),
    name = '[deleted]',
    email = 'deleted-' || id || '@deleted.invalid',
    phone = NULL,
    ip_hash = encode(digest(random()::text, 'sha256'), 'hex'),
    user_agent_hash = encode(digest(random()::text, 'sha256'), 'hex'),
    consent_text = '[anonymized]'
WHERE captured_in_demo IN (
  SELECT id FROM app.demos WHERE deleted_at IS NOT NULL
);

-- 4. Marcar audit logs (manter, anonimizar PII)
UPDATE app.audit_log
SET subject_email = encode(digest(subject_email || gen_random_uuid()::text, 'sha256'), 'hex'),
    subject_hash = encode(digest(subject_email, 'sha256'), 'hex'),
    ip_hash = encode(digest(random()::text, 'sha256'), 'hex'),
    user_agent_hash = encode(digest(random()::text, 'sha256'), 'hex'),
    payload = jsonb_set(
      coalesce(payload, '{}'::jsonb),
      '{anonymized_at}', to_jsonb(now())
    )
WHERE subject_email = :subject_email;

-- 5. Registrar a operação
INSERT INTO app.dsr_log (...)
VALUES (
  gen_random_uuid(),
  now(),
  NULL,
  :subject_email,
  :subject_email_hash,
  'delete',
  'in_progress',
  NULL,
  :ip_hash,
  :user_agent_hash,
  NULL,
  jsonb_build_object(
    'soft_deleted', true,
    'compliance_retained', :compliance_retained_list
  )
);

COMMIT;
```

### 4.2 Após a transação

- O **frontend** filtra automaticamente com `WHERE deleted_at IS NULL`
  (todos os índices já cobrem `deleted_at` por boas práticas).
- O **worker graphile-worker** recebe um job `hard_delete_after_30d`
  com payload `{ subject_email, workspace_id, dsr_id }`:
  - Executa no `now() + 30 days` (janela de arrependimento + auditoria).
  - Apaga blobs no R2.
  - Executa os UPDATEs de anonimização em qualquer resíduo.

---

## 5. Hard-delete após 30 dias (job `hard_delete_after_30d`)

### 5.1 Tarefas do job

```
1. Listar todos os blobs referenciados pelos demos soft-deleted
   SELECT url FROM app.screenshots s
   JOIN app.demos d ON d.id = s.demo_id
   WHERE d.deleted_at IS NOT NULL
     AND d.deleted_at < now() - interval '30 days';

2. Para cada blob:
   - r2.delete_object(url)  // idempotente
   - Logar em app.blob_deletion_log

3. Apagar analytics individuais (mantém apenas agregados)
   DELETE FROM app.events
   WHERE workspace_id IN (
     SELECT id FROM app.workspaces WHERE deleted_at IS NOT NULL
   );

4. Mantém (não tocar):
   - app.workspaces (deleted_at permanece)
   - app.demos (deleted_at permanece)  — útil para fingerprint de DSR
   - app.billing_* (legal hold, retorna classificador)
   - app.fiscal_documents
   - app.audit_log (com PII anonimizado)
   - app.dsr_log

5. Marca o DSR como concluído:
   UPDATE app.dsr_log
   SET status = 'done',
       completed_at = now(),
       attachments = jsonb_set(
         attachments,
         '{hard_deleted_at}', to_jsonb(now())
       )
   WHERE id = :dsr_id;
```

### 5.2 Falha do job

- Backoff exponencial com retries (1min, 5min, 30min, 2h, 6h, 24h, 7d).
- Após 7 tentativas falhas, alerta o DPO + engenheiro oncall.
- Não bloqueia o DSR — o soft-delete já garante que a PII está fora
  do alcance de queries de produto.

---

## 6. Procedimento para "não-titular" (LGPD art. 18, §7º)

Cenário: o pedido é de quem **não é titular** ou quem não conseguimos
identificar com segurança.

```
1. Logar pedido em app.dsr_log com status='rejected' e rejection_reason='identity_not_confirmed'.

2. Responder dentro do SLA (15 dias):
   "Não foi possível confirmar sua identidade para executar a
    eliminação. Para garantir a segurança dos seus dados, podemos
    retomar o pedido mediante:
    - Apresentação de documento de identidade com foto
    - Selfie segurando o documento
    - Videochamada agendada"

3. Em caso de indício de fraude:
   - NÃO executar.
   - Reportar ao DPO + investigar.
   - Responder de forma genérica.
```

---

## 7. Procedimento para "titular acha que tratamos, mas não tratamos"

```
1. Responder com RTBF-template.md (art. 18, I) confirmando a NÃO-existência de tratamento.

2. Mesmo assim, registrar o pedido em app.dsr_log:
   INSERT INTO app.dsr_log (...) VALUES (
     ...,
     'confirm',
     'done',
     'no_pii_located',
     ...
   );

3. Oferecer canal ANPD para confirmação se titular discordar.
```

---

## 8. Logs e auditoria

### 8.1 Log obrigatório por eliminação

```sql
INSERT INTO app.dsr_log VALUES (
  gen_random_uuid(),
  now(),
  NULL,                      -- completed_at é setado depois
  :subject_email,
  encode(digest(:subject_email || gen_random_uuid()::text, 'sha256'), 'hex'),
  'delete',
  'in_progress',
  NULL,
  encode(digest(:ip, 'sha256'), 'hex'),
  encode(digest(:user_agent, 'sha256'), 'hex'),
  NULL,
  jsonb_build_object(
    'soft_deletion_scope', jsonb_build_array(
      'workspaces', 'demos', 'steps', 'hotspots', 'leads', 'analytics_raw'
    ),
    'legal_hold_scope', jsonb_build_array(
      'billing_records', 'fiscal_documents', 'audit_log_anonymized'
    ),
    'hard_delete_scheduled_at', now() + interval '30 days',
    'jwt_jti', :jwt_jti,
    'actor', 'system:dsr-delete'
  )
);
```

### 8.2 Atualização ao final

```sql
UPDATE app.dsr_log
SET completed_at = now(),
    status = 'done',
    attachments = attachments || jsonb_build_object(
      'r2_blobs_deleted', :r2_count,
      'tables_soft_deleted', :tables,
      'tables_legal_hold', :legal_hold
    )
WHERE id = :dsr_id;
```

---

## 9. Notificação ao titular

### 9.1 Soft-delete executado

```
[Caso] em até 2 dias úteis após o soft-delete:

Subject: Confirmação de eliminação parcial — DSR {ticket_id}

Sr(a). {nome},

Confirmamos a execução da eliminação parcial dos seus dados
pessoais tratados pela DemoBR LTDA, conforme pedido registrado
em {data}.

Foram eliminados (soft-delete, com hard-delete em {data+30d}):

  ✓ Sua conta de creator
  ✓ Suas workspaces
  ✓ Seus {N} demos e passos
  ✓ Seus {N} leads captados
  ✓ Eventos de analytics individuais
  ✓ Histórico de suporte

Foram MANTIDOS por obrigação legal (LGPD art. 16):

  • Notas fiscais (NF-e) — 60 meses
  • Registros de cobrança — 60 meses
  • Logs de auditoria anonimizados — 24 meses

Você pode acessar uma cópia dos seus dados ou pedir revisão
do nosso entendimento a qualquer momento.

Atenciosamente,
{nome_DPO}
```

### 9.2 Hard-delete concluído

```
[Caso] em até 2 dias úteis após o hard-delete (T+30d):

"Confirmamos a eliminação completa dos seus dados, com
exceção dos itens sob obrigação legal já mencionados."
```

---

## 10. Testes de aceitação

Cenários que DEVEM ser cobertos por testes automatizados:

| # | Cenário | Esperado |
|---|---------|----------|
| 1 | DELETE com token válido | 202 + soft-delete aplicado |
| 2 | DELETE com token expirado | 401 |
| 3 | DELETE com token já usado | 409 + reason='already_used' |
| 4 | DELETE sem verificação de identidade | 403 + reason='identity_not_verified' |
| 5 | DELETE com rate limit excedido | 429 |
| 6 | Acesso a demo soft-deleted via API | 404 (não vaza dado) |
| 7 | Acesso a demo soft-deleted via URL pública | 410 Gone |
| 8 | NF-e mantida após hard-delete | ainda existe em app.fiscal_documents |
| 9 | Audit log não expõe mais o e-mail original | email hasheado |
| 10 | DSR antigo da mesma pessoa após DELETE | sucesso (não há conflito) |
| 11 | DELETE durante outage da Asaas | garante consistência: billing é mantido, demais apagados |

---

## 11. Compliance check

| LGPD | Requisito | Como atendemos |
|------|-----------|----------------|
| **art. 7º, I** | Consentimento | Leads têm consentimento; DELETE respeita |
| **art. 7º, IX** | Legítimo interesse | Logs anonimizados ficam por legítimo interesse |
| **art. 16** | Exceções à eliminação | NF-e e billing mantidos por obrigação legal |
| **art. 18, VI** | Direito de eliminação | PROCEDIMENTO acima |
| **art. 18, §5º** | SLA 15 dias | Soft-delete em ≤ 7 dias (sob SLA) |
| **art. 37** | Encarregado | Registrado e envolvido |
| **art. 46** | Segurança | RLS + SET LOCAL + soft-delete auditável |
| **art. 50** | Boa-fé e accountability | Audit log imutável + chain of custody |
| **GDPR art. 17º** (paralelo) | Right to erasure | Compatível |

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
