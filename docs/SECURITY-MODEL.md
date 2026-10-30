# Security Model — EasyDemo

> Documento de modelo de segurança que descreve **trust zones**, **modelo de
> ameaça OWASP STRIDE**, **políticas LGPD**, **gestão de credenciais**, **rate
> limiting**, **backup/DR** e **roadmap SOC2 Type II** do EasyDemo.

**Versão:** 1.0
**Owner:** Tech lead EasyDemo + DPO
**Última revisão:** 2026-10-18
**Próxima revisão:** 2027-04-18 (semestral)

---

## 1. Visão geral e princípios

O EasyDemo opera em **1 VPS Hetzner CPX32** com stack Docker Compose (Postgres,
Next.js, graphile-worker, SigNoz, Caddy). Os princípios de segurança são:

1. **Defense in depth**: 5 camadas (edge, app, DB, RLS, criptografia).
2. **Least privilege**: cada componente tem apenas o acesso mínimo.
3. **Fail secure**: erros não vazam dados; padrão deny.
4. **Auditoria**: tudo que é sensível gera log estruturado.
5. **LGPD by design**: PII é classificada e minimizada desde a captura.
6. **Reversibilidade**: toda mudança destrutiva é reversível em ≤ 30 dias.

---

## 2. Trust zones (zonas de confiança)

```
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 0 — Internet público (não confiável)                         │
│   - Visitantes do player público                                  │
│   - Atacantes, scrapers                                            │
└──────────────────────────────────────────────────────────────────┘
                                  ▼ HTTPS / Cloudflare
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 1 — Edge Cloudflare (parcialmente confiável)                │
│   - WAF + DDoS protection                                         │
│   - CDN cache (somente assets públicos)                           │
│   - Rate limit L7                                                 │
└──────────────────────────────────────────────────────────────────┘
                                  ▼ proxy_pass
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 2 — VPS Hetzner (confiável sob ataque)                      │
│   - Caddy (reverse proxy + TLS)                                   │
│   - Firewall Hetzner (stateful, portas 22/80/443)                │
│   - Docker network isolada                                         │
└──────────────────────────────────────────────────────────────────┘
                                  ▼ unix socket / DNS interno
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 3 — App tier (autenticado)                                  │
│   - Next.js (Route Handlers com auth Clerk)                       │
│   - Worker graphile-worker (acesso DB restrito)                   │
└──────────────────────────────────────────────────────────────────┘
                                  ▼ SET LOCAL app.current_workspace_id
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 4 — Data tier (maior privilégio)                                    │
│   - Postgres 16 com RLS (versão canônica — ADR-013)                │
│   - Cloudflare R2 (bucket privado para backups)                    │
└──────────────────────────────────────────────────────────────────┘
                                  ▼ DPA assinado
┌──────────────────────────────────────────────────────────────────┐
│ ZONE 5 — Subprocessadores (confiança contratual)                  │
│   - Clerk (auth) — SOC2 Type II                                   │
│   - Asaas (pagamento) — SOC2                                      │
│   - Cloudflare R2 — SOC2 Type II                                  │
│   - Resend (email) — SOC2                                         │
│   - PostHog Cloud — SOC2                                          │
│   - ElevenLabs (TTS) — SOC2                                       │
│   - Hetzner (VPS) — ISO 27001                                     │
└──────────────────────────────────────────────────────────────────┘
```

### Regras de fluxo entre zonas

| Origem | Destino | Permitido? | Como |
|---------|---------|-----------|------|
| Zone 0 | Zone 2 (Postgres 5432) | ❌ | Firewall Hetzner bloqueia porta 5432 |
| Zone 0 | Zone 2 (Next.js) | ✅ via Zone 1 | HTTPS, TLS 1.3, rate limit |
| Zone 0 | Zone 2 (R2 private) | ❌ | Sem rota; só presigned |
| Zone 2 (Next) | Zone 4 (Postgres) | ✅ via unix socket | `SET LOCAL` workspace_id |
| Zone 2 (Worker) | Zone 4 (Postgres) | ✅ via unix socket | Worker role `app_worker` |
| Zone 2 (Next) | Zone 5 (Clerk) | ✅ outbound | OAuth + SDK |
| Zone 2 (Next) | Zone 5 (R2 public) | ✅ outbound | S3 API |
| Zone 2 (Next) | Zone 5 (R2 private) | ✅ outbound presigned | TTL 5min |
| Zone 2 (Next) | Zone 5 (Asaas) | ✅ outbound | API key em secret |
| Zone 4 (Postgres) | Zone 5 (R2 backup) | ✅ outbound | pgBackRest S3-compatible |

---

## 3. Modelo de ameaça — OWASP STRIDE

Aplicamos STRIDE em cada categoria:

### 3.1 **S**poofing (falsificação de identidade)

| Ameaça | Mitigação |
|--------|-----------|
| Forjar sessão Clerk | JWT assinado com chave Clerk; verificamos via SDK |
| Forjar API key `gf_live_*` | Hash bcrypt + verificação constant-time; rate limit por key |
| Forjar webhook Asaas | HMAC SHA-256 validado; rejeitamos sem `asaas-access-token` |
| Forjar webhook Clerk | Svix signature validation; rejeitamos sem header |
| IP spoofing em eventos públicos | Aceitamos apenas `country_code` derivado de Accept-Language (não confiável para billing) |

### 3.2 **T**ampering (adulteração de dados)

| Ameaça | Mitigação |
|--------|-----------|
| Modificar body de webhook | HMAC invalida → 401 |
| SQL injection | Drizzle com parâmetros prepared; sem string concat |
| Modificar screenshot no R2 | R2 é write-once para cliente (presigned PUT); update é via nova URL |
| Modificar eventos (`/events`) | Endpoint público aceita **apenas campos LGPD-safe**; rejeitamos `email`, `name`, `ip` |
| Modificar `app.current_workspace_id` no SQL | `SET LOCAL` por conexão, **validado** no middleware |
| Cross-workspace data leak | RLS `FORCE ROW LEVEL SECURITY` + testes de leak no CI |

### 3.3 **R**epudiation (negação de ação)

| Ameaça | Mitigação |
|--------|-----------|
| Usuário nega ter publicado demo | Audit log: `app.audit_log` com `(user_id, action, target, ts, ip_hash)` |
| Cliente nega ter recebido webhook | Inspector UI mostra todas as tentativas + response code |
| Webhook Asaas perdido | Idempotência por `asaas-webhook-id`; reprocessamento on-demand |
| DSR (LGPD) sem trilha | `app.dsr_log` com `(subject_email, action, status, completed_at)` |
| Admin EasyDemo nega acesso a dados | Logs imutáveis SigNoz (7 dias), R2 backup (90+ dias) |

### 3.4 **I**nformation disclosure (vazamento de informação)

| Ameaça | Mitigação |
|--------|-----------|
| Listar dados de outros workspaces | RLS + testes de leak (`SELECT * FROM app.demos WHERE workspace_id <> $1` deve retornar 0) |
| Logs vazarem PII | Pino redact de campos sensíveis (`email`, `phone`, `cpf`, `cnpj`, `password`) |
| Backup R2 sem criptografia | pgBackRest `repo1-cipher-type=aes-256-cbc` |
| Backup R2 vazado | Chave de criptografia separada (em Docker secret, **não** no bucket) |
| Mensagens de erro detalhadas em prod | Modo prod: `error.message` genérico + `request_id` para suporte |
| SSRF em webhooks de saída | Bloqueio de IPs privados (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) |
| URL temporária leak | Presigned URLs com TTL ≤ 5min |

### 3.5 **D**enial of service (negação de serviço)

| Ameaça | Mitigação |
|--------|-----------|
| DDoS Layer 7 | Cloudflare WAF + Rate limit L7 (50 req/s por IP em endpoints públicos) |
| DDoS Layer 3/4 | Hetzner + Cloudflare Magic Transit (grátis) |
| Brute force em login | Clerk rate limit + captcha após 5 falhas |
| Webhook flood | Rate limit por workspace: 60 deliveries/min |
| Storage exhaustion | Quota por plano + job de limpeza |
| Event flood no `/events` | Rate limit 60 req/min/IP + sample-and-discard em 100k events/dia |
| Worker queue overload | graphile-worker backpressure (job fica pending até slot liberar) |
| DB connection exhaustion | `pgbouncer` ou `pg.Pool` com max 20 conexões por serviço |

### 5.6 **E**levation of privilege (elevação de privilégio)

| Ameaça | Mitigação |
|--------|-----------|
| Usuário viewer acessar admin | RBAC via Clerk Organizations (roles: owner, admin, editor, viewer) |
| Escalation de role | Toda mudança de role via Owner + audit log; sem auto-promote |
| SQL bypass de RLS | `FORCE ROW LEVEL SECURITY` (mesmo para `postgres` user, policies aplicam) |
| Acesso direto ao Postgres | Firewall Hetzner fecha 5432; só Unix socket dentro da VPS |
| Acesso a bucket privado R2 | Cloudflare Access com service token da VPS |
| Service token leak | Rotação trimestral; armazenamento em `docker secret` montado como tmpfs |

---

## 4. Política LGPD (Lei Geral de Proteção de Dados)

### 4.1 Papéis

- **Controlador**: Cliente EasyDemo (workspace owner) — define finalidades.
- **Operador**: EasyDemo LTDA — processa em nome do controlador.
- **Encarregado (DPO)**: `dpo@easydemo.io` — canal de comunicação com ANPD.
- **Suboperadores**: subprocessadores listados em §2, cada um com DPA assinado.

### 4.2 Bases legais (LGPD art. 7º)

| Tratamento | Base legal | Justificativa |
|------------|-----------|---------------|
| Capturar lead (nome, email, telefone) | **Consentimento** (art. 7º, I) | Opt-in explícito via checkbox + texto LGPD exato |
| Analytics de demos (visitor_id_hash) | **Legítimo interesse** (art. 7º, IX) | Métricas agregadas, sem PII, opt-out via cookie |
| Billing (Asaas) | **Execução de contrato** (art. 7º, V) | Necessário para cobrança |
| Logs de auditoria | **Obrigação legal** (art. 7º, II) + legítimo interesse | Retenção para fins de auditoria e investigação |
| Backup criptografado | **Legítimo interesse** | Continuidade operacional |

### 4.3 Princípios aplicados (art. 6º)

| Princípio | Como aplicamos |
|-----------|----------------|
| **Finalidade** | Cada coleta declara propósito na UI (consent text). |
| **Necessidade** | Coletamos mínimo: lead form tem `name`, `email`, `phone` opcional; sem CPF. |
| **Adequação** | Contexto de uso é o mesmo da coleta. |
| **Livre acesso** | Endpoint `GET /api/v1/dsr` retorna tudo do titular em ≤ 7 dias. |
| **Qualidade dos dados** | Validação Zod em todas as entradas. |
| **Transparência** | Política de privacidade + cookie banner explicam cada tratamento. |
| **Segurança** | Ver §3 (STRIDE) e criptografia. |
| **Prevenção** | OCR + blur em screenshots antes de publicar (LGPD-safe). |
| **Não discriminação** | Nenhum tratamento toma decisão sobre pessoa natural. |
| **Responsabilização** | DPIA anual + DPO + audit log. |

### 4.4 Retenção

| Dado | Retenção | Base | Ação após prazo |
|------|----------|------|----------------|
| Leads (ativos) | Enquanto cliente pagante + 24 meses | Contrato + auditoria | Anonimizar |
| Leads (após DSR) | 0 dias | LGPD art. 18, VI | Apagar |
| Eventos analytics raw | 90 dias | Legítimo interesse | Aggregar + purgar raw |
| Audit logs | 24 meses | Obrigação legal | Anonimizar campos PII |
| Backups pgBackRest | 7 full + diff diário | Continuidade | Auto-delete |
| 1 backup mensal "long-term" | 24 meses | Obrigação fiscal | Auto-delete |
| Dados Asaas (billing) | 60 meses | Obrigação fiscal (Receita Federal) | Manual após |

### 4.5 DSR (Data Subject Rights — art. 18)

Endpoints públicos internos (`/admin/{slug}/dsr`) e API (`/api/v1/dsr`):

| Direito | Endpoint | SLA |
|---------|----------|-----|
| **Confirmação de existência** | `GET /dsr?email=X` | imediato |
| **Acesso** (export) | `GET /dsr?email=X` | ≤ 7 dias (resposta imediata, JSON/zip) |
| **Correção** | `PATCH /leads/{id}` (owner) | imediato |
| **Anonimização** | `DELETE /dsr?email=X` | ≤ 7 dias (job assíncrono) |
| **Bloqueio** | Suspensão da conta | ≤ 7 dias |
| **Eliminação** | `DELETE /dsr?email=X` (purga completa) | ≤ 7 dias |
| **Portabilidade** | Export em JSON estruturado | ≤ 7 dias |
| **Revogação de consentimento** | `DELETE /leads/{id}` ou unsubscribe | imediato |

Toda DSR gera entrada em `app.dsr_log` com:
- `subject_email`
- `action` (`export` | `delete`)
- `requested_at`
- `completed_at`
- `status` (`pending` | `done` | `rejected`)
- `requester_user_id` (quem solicitou)

### 4.6 DPA (Data Processing Agreement)

Template em `legal/dpa-template.pdf` inclui:

- Objeto, duração, natureza, finalidade do tratamento.
- Tipo de dados pessoais, categorias de titulares.
- Obrigações do operador (art. 39).
- Subcontratação apenas com DPA chain (suboperadores listados em `/legal/subprocessors`).
- Medidas técnicas e organizacionais (art. 46).
- Direitos do titular.
- Notificação de incidente em ≤ 24h.
- Auditoria anual (cliente pode solicitar).

---

## 5. Política de senhas e chaves

### 5.1 Senhas de usuário (via Clerk)

- Mínimo 12 caracteres (configurado no Clerk Dashboard).
- Verificação contra lista de senhas vazadas (HIBP via Clerk).
- MFA **obrigatório** para roles `owner` e `admin`.
- MFA **opcional mas recomendado** para `editor` e `viewer`.
- Bloqueio após 5 tentativas (15 min).
- Senha nunca armazenada em nosso banco (Clerk gerencia com bcrypt + salt).

### 5.2 API keys de workspace (`gf_live_*`)

- Geradas server-side, **32 bytes random** (256 bits de entropia).
- Prefixo `gf_live_` (compatibilidade GuiaFlow/Supademo).
- Hash bcrypt armazenado em `app.api_keys` (nunca plaintext após criação).
- Mostra **uma única vez** na criação; recuperação requer rotação.
- **Rotação**: recomendada trimestral; revogação imediata ao comprometimento.
- Escopos: `read_only`, `read_write`, `admin`.
- Rate limit por key: 600 req/min.

### 5.3 Secrets de servidor

| Secret | Onde | Quem acessa |
|--------|------|-------------|
| `POSTGRES_PASSWORD` | `docker secret` montado em `/run/secrets/pg_pass` | Apenas Postgres + app |
| `CLERK_SECRET_KEY` | env var em `compose.yml` | Apenas Next.js |
| `ASAAS_API_KEY` | env var | Apenas Next.js (server-only) |
| `ASAAS_WEBHOOK_SECRET` | env var | Apenas Next.js |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | env var | Apenas Next.js + worker |
| `PGBACKREST_CIPHER_PASS` | docker secret | Apenas pgBackRest |
| `RESEND_API_KEY` | env var | Apenas Next.js + worker |
| `POSTHOG_PROJECT_KEY` | env var (server) + public key (cliente) | Next.js + player |

Política de rotação:

| Secret | Frequência | Processo |
|--------|-----------|----------|
| Postgres password | Anual ou comprometimento | `ALTER USER postgres PASSWORD '...'` + recreate users |
| Clerk keys | Conforme plano Clerk (90d) | UI Clerk |
| Asaas | Anual | Regenerar no painel Asaas |
| R2 keys | Trimestral | Cloudflare dashboard |
| pgBackRest cipher | Anual (com backup de chave em outro cofre) | Script `rotate-pgbackrest.sh` |
| Resend | Anual | UI Resend |
| API keys de workspace | Trimestral | Cliente decide |

Vault: em produção, secrets vêm de **Hetzner Cloud Secrets** (não de `.env` em disco). Em dev/staging, `.env` com `chmod 600`.

### 5.4 Recomendações ao cliente (na UI admin)

- Banner no painel: "Sua API key tem X dias. Recomendamos rotação."
- Doc em `/docs/security/api-keys.md` com boas práticas (vault, scoping).
- Audit log de toda criação/rotação/revogação.

---

## 6. Política de rate limit

Limites documentados em `docs/api/openapi.yaml` (headers `X-RateLimit-*`):

| Endpoint | Limite | Granularidade |
|----------|--------|---------------|
| `/api/v1/*` (default) | 600 req/min | por workspace (ou API key) |
| `/api/v1/auth/*` | 30 req/min | por IP |
| `/api/v1/events` (público) | 60 req/min | por IP |
| `/api/v1/leads` (público) | 60 req/min | por IP |
| `/api/v1/upload/sign` | 60 req/min | por workspace |
| Webhooks de saída | 60 deliveries/min | por webhook |
| MCP server | 60 req/min | por workspace |
| MCP `generate_narration` | 5 req/min | por workspace |

Implementação:

- **Em-process**: `@upstash/ratelimit` com Redis (Upstash free tier ou in-memory dev).
- **Distribuído** (multi-instância futura): Redis compartilhado.
- **Resposta 429** com `Retry-After` em segundos.
- **Burst tolerance**: 1.5× por 10s, depois strict.

---

## 7. Backup e Disaster Recovery

### 7.1 RPO / RTO (objetivos)

| Métrica | Target MVP | Target pós-estabilidade |
|---------|-----------|-------------------------|
| **RPO** (data loss tolerável) | 1 hora | 15 minutos |
| **RTO** (downtime tolerável) | 30 minutos | 5 minutos |

### 7.2 Estratégia de backup

| Componente | Método | Retenção | Local |
|------------|--------|----------|-------|
| **Postgres dados** | pgBackRest full semanal + diff diário + WAL contínuo | 7 full + diff diário + 30 WAL days | R2 (`demo-private`, cifrado AES-256) |
| **Postgres 1× mês long-term** | pgBackRest full | 24 meses | R2 (cifrado) |
| **VPS volume-level** | Hetzner Snapshot | 4 semanas | Hetzner Storage Box |
| **R2 public assets** | Versionamento R2 | 30 dias (delete markers) | R2 |
| **Configs Docker / Compose** | Git + GitHub Actions artifact | infinito | GitHub |
| **SigNoz traces** | ClickHouse export diário | 30 dias | ClickHouse local |

### 7.3 Cenários de DR

| Cenário | RPO | RTO | Procedimento |
|---------|-----|-----|--------------|
| Falha de hardware VPS | 1h | 30 min | Recreate VPS + restore pgBackRest |
| Corrupção de DB (bug) | 0 (PITR) | 30 min | `pgbackrest restore --type=time --target='2026-10-18 14:00:00'` |
| Delete acidental | 0 (PITR) | 15 min | PITR para 1 min antes do delete |
| Ransomware em R2 | 1h | 1h | Restore de snapshot Hetzner + pgBackRest de 24h atrás |
| Cloudflare outage | n/a | 30 min (mitigável) | DNS com TTL baixo + fallback IP do VPS via Cloudflare Spectrum |
| Hetzner outage | 1h | 4h | Re-provisionar VPS em outra região + restore |

### 7.4 Restore drill

- **Mensal**: restaurar último full + WAL em container descartável, validar `SELECT count(*) FROM app.workspaces` ≥ baseline.
- **Trimestral**: full DR simulado com failover para 2ª VPS (quando existir).
- **Anual**: tabletop exercise com o time.

Logs de drill em `infra/postgres/RESTORE-LOGS.md`.

---

## 8. Conformidade SOC2 Type II — roadmap

| Trust Service Criteria | Status MVP | Target Q4 2026 | Target Q4 2027 |
|------------------------|-----------|---------------|---------------|
| **CC1 — Control environment** | Parcial (1-3 devs, sem segregation of duties) | Doc política + code of conduct | Auditoria externa |
| **CC2 — Communication** | OK (Slack interno, status page público) | Status page + changelog público | Incident post-mortems públicos |
| **CC3 — Risk assessment** | OK (este doc) | DPIA anual, threat model review | Risk register formal |
| **CC4 — Monitoring** | OK (SigNoz + uptime) | Alerting 24/7 on-call rotation | Auditoria de logs |
| **CC5 — Control activities** | OK (RLS, RBAC, MFA) | Penetration test anual | Auditoria externa |
| **CC6 — Logical access** | OK (Clerk + API key scopes) | SSO obrigatório admin | Quarterly access review |
| **CC7 — System operations** | Parcial | Runbook DR testado | Auditoria externa |
| **CC8 — Change management** | OK (GitHub + CI + code review) | Branch protection + signed commits | Auditoria de mudanças |
| **CC9 — Risk mitigation** | OK (insurence cyber ?) | Vendor risk assessment (subprocessors) | Auditoria |
| **A — Availability** | 99.0% | 99.5% SLA + monitoring | 99.9% + multi-region |
| **C — Confidentiality** | OK (encryption, NDA) | DPIA, data classification | Auditoria |
| **PI — Processing integrity** | OK (Zod validation, transactional) | Automated reconciliation | Auditoria |
| **P — Privacy** | OK (LGPD alignment) | DPIA anual | SOC2 + LGPD joint audit |

### 8.1 Marcos

- **2026-Q4**: contratar auditor (ex.: Vanta, Drata) para readiness assessment.
- **2027-Q1**: implementar gaps de CC2, CC5, CC7.
- **2027-Q4**: auditoria formal SOC2 Type I.
- **2028-Q4**: SOC2 Type II (12 meses de operação auditada).

---

## 9. Resposta a incidentes

### 9.1 Classificação

| Severidade | Definição | SLA de resposta |
|-----------|-----------|-----------------|
| **SEV-1** | Data breach confirmado, serviço indisponível > 1h, incidente LGPD reportável | ≤ 15 min |
| **SEV-2** | Funcionalidade crítica quebrada, vazamento parcial | ≤ 1h |
| **SEV-3** | Bug não-crítico, perfomance degradada | ≤ 4h |
| **SEV-4** | Cosmético, melhoria | Próximo sprint |

### 9.2 Processo

1. **Detecção** → alerta SigNoz / report de cliente.
2. **Triagem** → tech lead + DPO (se envolve dados).
3. **Containment** → desabilitar webhook/feature afetada; revogar secrets.
4. **Eradication** → patch, rotate keys, restore backup.
5. **Recovery** → restaurar serviço, validar.
6. **Post-mortem** → blameless, em ≤ 7 dias, público se SEV-1/SEV-2.
7. **Notificação ANPD** (LGPD art. 48) em ≤ 24h se incidente afeta titulares.
8. **Notificação clientes afetados** em ≤ 72h.

### 9.3 Runbooks críticos

- `infra/postgres/RUNBOOK.md` — restore, vacuum, failover.
- `infra/observability/RUNBOOK.md` — SigNoz, OTel collector.
- `runbooks/incident-response.md` — checklist geral.
- `runbooks/clerk-outage.md` — degradação graceful.
- `runbooks/asaas-outage.md` — graceful billing.

---

## 10. Aprovações e revisões

| Versão | Data | Autor | Aprovador | Notas |
|--------|------|-------|-----------|-------|
| 1.0 | 2026-10-18 | Tech lead | DPO + Founder | Criação inicial |

**Próxima revisão obrigatória**: 2027-04-18 (6 meses) ou após qualquer SEV-1/SEV-2.

---

## Apêndice A — Checklist operacional diário

- [ ] SigNoz: error rate < 1%?
- [ ] SigNoz: p95 latency < 300ms API / < 1.5s player?
- [ ] pgBackRest: último backup < 26h?
- [ ] Clerk: webhooks entregando?
- [ ] Asaas: webhooks entregando?
- [ ] R2: egress < 80% do limite do plano?
- [ ] Postgres: conexões ativas < 80% do pool?
- [ ] Disk usage VPS < 80%?
- [ ] Certificado TLS válido (Caddy auto-renova, mas validar)?
- [ ] UptimeRobot ping respondendo?

## Apêndice B — Leitura obrigatória para novos devs

1. Este documento.
2. `docs/SLOs.md` — objetivos de disponibilidade.
3. `docs/api/openapi.yaml` — superfície da API.
4. `docs/api/webhooks.md` — webhook security.
5. `runbooks/incident-response.md` — checklist de incidente.
6. `legal/dpa-template.pdf` — DPA.

---

**Mantido por**: Tech lead + DPO.
**Contato de segurança**: `security@easydemo.io` (PGP key em `/security/pgp.txt`).
**Bug bounty**: em planejamento para 2027 (post-SOC2 Type I).