# Infra VPS — Hetzner, Cloudflare, backup Postgres, observability

> Arquitetura de infraestrutura para 1 VPS 8 GB Hetzner. Cobre: K3s vs Docker Compose, Cloudflare (R2/CDN/Workers), backup Postgres, observability sem Datadog.

---

## 1. Escolha do VPS

### 1.1 Por que Hetzner

| Aspecto | Hetzner | DigitalOcean | AWS Lightsail |
|---------|---------|--------------|---------------|
| Preço CPX32 (4 vCPU/8GB/160GB NVMe) | ~€35/mo | $48/mo | ~$40/mo (bundle) |
| Latência EUA/UE | Boa | Boa | Variável |
| Datacenter na UE (Alemanha/Finlândia) | ✅ nativo | NY/SF | sim |
| Tráfego incluso | 20 TB | 4 TB | 5 TB |
| API/cloud-init | ✅ | ✅ | ✅ |
| DDoS protection | ✅ | parcial | pago |
| Privacidade (LGPD-friendly) | ✅ EU | ✅ | ❌ US |

**Recomendação:** Hetzner Cloud CX22 (entry) ou CPX32 (target). Datacenter `fsn1` (Frankfurt) ou `nbg1` (Nuremberg) tem boa latência para o BR (~180ms).

**Fonte:** <https://contabo.com/blog/vps-for-docker-containers-kubernetes/> | <https://hetzner-k3s.com/>

### 1.2 Configuração alvo

| Recurso | Valor |
|---------|-------|
| Tipo | CPX32 (4 vCPU, 8 GB RAM, 160 GB NVMe SSD) |
| Tráfego | 20 TB/mês (suficiente para serving de demos) |
| Snapshot backup | €0.01/GB/mês (Hetzner Storage Box) |
| Firewall | Hetzner Firewall (stateful) |
| Failover | Não (single VPS) — upgrade para 2 VPS se SLA ficar crítico |

---

## 2. Orquestração — Docker Compose (simples) vs K3s

### 2.1 Comparativo em 1 VPS 8 GB

| Aspecto | Docker Compose | K3s single-node | K3s 3-node HA |
|---------|---------------|----------------|---------------|
| RAM idle do orchestrator | ~180 MB | ~1.4 GB | ~3-4 GB |
| Complexidade | **Baixa** | Média | Alta |
| Auto-heal | Limitado (restart policies) | ✅ | ✅ |
| Rolling update | Manual | ✅ | ✅ |
| Secrets management | Variáveis .env | ✅ K8s Secrets | ✅ |
| Hetzner-k3s provisioning | — | < 3 min (1 node) | ~2-3 min (3 nodes) |
| Custo | €0 | €0 (1 VPS) | ~€48/mo (3× CX22) |
| Custo AWS EKS equivalente | — | — | $1,595+/mo |

**Fontes:**
- Comparativo K3s vs Docker Compose para 1 VPS: <https://bogomolov.work/blog/posts/the-actual-state-of-self-hosting-on-a-vps>
- Hetzner-k3s docs: <https://github.com/vitobotta/hetzner-k3s/blob/main/docs/Recommendations.md>
- Hetzner-k3s pricing: <https://hetzner-k3s.com/>

### 2.2 Decisão para nosso projeto

**Docker Compose para MVP e produção inicial.**

**Por quê:**
- Time pequeno quer simplicidade.
- 1 VPS não precisa de HA — Hetzner tem 99.9% SLA, backup fora do site.
- Compose escala até uns 10-15 containers sem drama.
- systemd + journald integra bem — fácil de operar com `docker compose logs -f`.
- Migração para K3s fica trivial se necessário (Helm Charts portam para Compose trivialmente, e vice-versa com Kompose).

**Quando migrar para K3s:**
- > 20 microserviços.
- Multi-region ou multi-cloud.
- Time crescer para >5 SREs.

**Setup Docker Compose alvo:**

```yaml
# compose.yml
services:
  caddy:
    image: caddy:2-alpine
    ports: ['80:80', '443:443']
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: unless-stopped

  app:
    build: .
    environment:
      - DATABASE_URL=postgres://app:pwd@db:5432/easydemo
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - R2_ACCESS_KEY=${R2_ACCESS_KEY}
      - R2_SECRET_KEY=${R2_SECRET_KEY}
    depends_on: [db, redis]
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G

  worker:
    build: .
    command: ['node', 'dist/worker.js']
    environment: [DATABASE_URL, ...]
    depends_on: [db]
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=easydemo
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./pgbackrest.conf:/etc/pgbackrest/pgbackrest.conf
    command: ['postgres', '-c', 'shared_buffers=2GB', '-c', 'max_connections=200']
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    # Apenas se quisermos BullMQ/cache; com graphile-worker não é obrigatório

  postgrest:
    image: postgrest/postgrest:latest
    # opcional — API REST auto-gerada sobre Postgres para o player público

volumes:
  caddy_data:
  pgdata:
```

### 2.3 Reverse proxy — Caddy

Caddy com **certificados Let's Encrypt automáticos** via `tls` directive. Sem renew manual.

```caddyfile
# Caddyfile
app.easydemo.io {
  reverse_proxy app:3000
}

api.easydemo.io {
  reverse_proxy app:3000
}

play.easydemo.io {
  reverse_proxy app:3000
  header Cache-Control "public, max-age=300"
}

embed.easydemo.io {
  reverse_proxy app:3000
  header Access-Control-Allow-Origin *
}

db.easydemo.io {
  reverse_proxy db:5432  # via SSH tunnel ou Wireguard — NÃO expor publicamente
}
```

---

## 3. Cloudflare stack — R2 + CDN + Workers

### 3.1 Cloudflare R2 (object storage)

**Já detalhado em `backend-stack.md` §3.** Recap:

- $0.015/GB-mês Standard storage.
- **Egress: grátis** (diferencial vs S3).
- Free tier: 10 GB storage + 1M Class A writes + 10M Class B reads/mês.
- S3-compatible API.

**Setup:**
1. Criar bucket `easydemo-prod` em <https://dash.cloudflare.com/>.
2. Gerar API token com permissão `Object Read & Write` no bucket.
3. Configurar CORS para o domínio do player (`play.easydemo.io`).
4. Custom domain (opcional): `cdn.easydemo.io` apontando para o bucket.

### 3.2 Cloudflare CDN

Já vem com R2 (Cloudflare CDN em cima do bucket). Mas podemos configurar regras no dashboard do Cloudflare para o domínio `app.easydemo.io`:

- **Cache estático:** `/static/*`, `/_next/static/*`, `/favicon.ico` — `Cache-Control: public, max-age=31536000, immutable`.
- **Cache dinâmico:** `/embed/[id]` — `Cache-Control: public, max-age=60, s-maxage=300`.
- **Bypass:** `/api/*`, `/(app)/*`.
- **Tiered cache** habilitado.
- **Argo Smart Routing** (R$ 5/mo): opcional para reduzir latência global.
- **Bot Fight Mode** habilitado (proteção contra scrapers).
- **Rate Limiting rules:** `/api/v1/auth/*` — 10 req/min por IP.

### 3.3 Cloudflare Workers (edge functions)

Casos de uso para nosso SaaS:
- **Embed loader analytics proxy**: recebe `POST` com evento do player (em domínio diferente) e repassa para nosso backend, sem expor IP real.
- **Geo-redirect / locale detect**: identificar PT-BR vs EN-US e reescrever.
- **Image resizing**: Workers com `@cloudflare/image-resizing` se quisermos variante WebP/AVIF on-the-fly.
- **AI inference** (futuro): Cloudflare Workers AI para tradução automática de demos.

**Pricing:**
- Free: 100k req/dia.
- Paid: $5/mo mínimo, +$0.30/milhão de reqs.
- 10M reqs inclusos no plano Paid.

**Fonte:** <https://developers.cloudflare.com/workers/platform/pricing/>

**Quando usar:** se quiser mover alguma lógica para a borda (latência global). Para MVP BR-first, Workers são opcionais.

### 3.4 Cloudflare Tunnel (expor serviço sem abrir porta)

Para acessar Caddy/Postgres do painel Hetzner sem abrir 22/5432 para internet:

```bash
# Instalar cloudflared no VPS
cloudflared tunnel create easydemo-prod
cloudflared tunnel route dns easydemo-prod app.easydemo.io
cloudflared service install
```

Útil para acessar o banco remotamente (ex: Drizzle Studio rodando na máquina do dev) sem expor a porta 5432.

---

## 4. Backup Postgres — pgBackRest em R2

### 4.1 Comparativo

| Ferramenta | Quando usar |
|------------|-------------|
| **`pgBackRest`** | Padrão industrial; PITR; diferencial/incremental; compressão paralela; usado por Crunchy, AWS, centenas de empresas |
| `WAL-G` | Mais simples; CLI único; bom para cloud (S3, GCS, Azure); delta backups |
| `Barman` (EnterpriseDB) | Barman Cloud (plugin CNPG) bom para K8s; Barman clássico para fleets de DBs |
| `pg_dump` | Pequeno porte, dev. Não serve para produção séria. |

**Fontes:**
- pgBackRest: <https://pgbackrest.org/>
- Comparativo pg_hardstorage: <https://github.com/cybertec-postgresql/pg_hardstorage/blob/main/docs/explanation/comparison-pgbackrest-walg-barman.md>
- Comparativo 2026: <https://www.kunalganglani.com/blog/postgresql-backup-tools-compared>

### 4.2 Decisão: **pgBackRest com repo em Cloudflare R2**

**Por quê:**
- PITR (point-in-time recovery) até segundos.
- Backup incremental rápido (block-level).
- Compressão lz4/zstd paralelizada.
- Suporte S3-compatible (R2).
- `pgBackRest` v2.59.3 estável (2026).
- Battle-tested em produção (Crunchy, EDB, AWS usam).

### 4.3 Setup

```ini
# /etc/pgbackrest/pgbackrest.conf
[global]
repo1-type=s3
repo1-s3-endpoint=${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
repo1-s3-bucket=easydemo-pgbackrest
repo1-s3-key=${R2_ACCESS_KEY}
repo1-s3-key-secret=${R2_SECRET_KEY}
repo1-s3-region=auto
repo1-path=/pgbackrest
repo1-cipher-type=none
repo1-retention-full=7
repo1-retention-diff=4
process-max=4
log-level-console=info
log-level-file=debug

[easydemo]
pg1-path=/var/lib/postgresql/data
pg1-port=5432
```

Cron job (root ou postgres user):

```cron
# Full backup diário às 02:00 UTC
0 2 * * * pgbackrest backup --type=full --log-level-console=info

# Incremental a cada 6h
0 */6 * * * pgbackrest backup --type=incr --log-level-console=info

# Verificação semanal
0 3 * * 0 pgbackrest verify --log-level-console=info
```

### 4.4 Restore drill (mensal)

```bash
# Testar restore em servidor separado
pgbackrest restore --stanza=easydemo --target-action=time --target="2026-10-15 14:00:00" \
  --repo1-path=/tmp/pgrestore
```

Validar mensalmente que o backup é restaurável.

---

## 5. Observability — SigNoz self-host

### 5.1 Comparativo

| Opção | Custo (self-host em 1 VPS) | Custo Datadog equivalente | Quando usar |
|-------|--------------------------|--------------------------|-------------|
| **SigNoz self-host** | Grátis + ~2 GB RAM | $10k+/mês | Logs + metrics + traces OTel-native em um lugar |
| Grafana + Loki + Prometheus | Grátis (mas tem mais overhead operacional) | $1,912/mês (Cloud) | Time já conhece a stack; aceita operar 3 serviços |
| Grafana Cloud | $1,912/mês (25 eng) | $10,421/mês (Datadog) | Não quer self-host |
| Datadog | — | $10k+/mês | Enterprise com budget |
| New Relic | — | $3,511/mês | Alternativa Datadog |
| OpenObserve | Grátis | Similar SigNoz | Self-host unificado |

**Fontes:**
- SigNoz vs Grafana: <https://signoz.io/grafana-alternative>
- SigNoz pricing comparison: <https://signoz.io/blog/pricing-comparison-signoz-vs-datadog-vs-newrelic-vs-grafana>
- Self-host para solo: <https://signoz.io/case-study/observability-for-small-teams-and-solopreneurs>

### 5.2 Decisão: **SigNoz self-host em Docker**

**Por quê:**
- **OpenTelemetry-native** (sem vendor lock-in, instrumenta com SDK padrão).
- Logs + metrics + traces em **um único backend** (vs Grafana que tem 3).
- 50% menos recurso que Elastic.
- Self-host oficial via Docker Compose (recomendado para 4 GB+).
- Dashboard similar ao Datadog (UX familiar).

**Quando escolher Grafana stack puro:**
- Time já domina Prometheus + Grafana.
- Não precisa de APM/tracing (só metrics + logs).

### 5.3 Setup (Docker Compose)

```yaml
# compose.observability.yml
services:
  signoz:
    image: signoz/signoz:v0.70.0
    environment:
      - ClickHouseUrl=tcp://clickhouse:9000
      - AlertManagerURL=alertmanager:9093
      - SIGNOZ_TELEMETRYSTORE_CLICKHOUSE_DSN=tcp://clickhouse:9000
      - SIGNOZ_SQLSTORE_SQLITE_PATH=/var/lib/signoz/signoz.db
    volumes:
      - signoz_data:/var/lib/signoz
    ports: ['3301:3301']
    depends_on: [clickhouse]
    restart: unless-stopped

  clickhouse:
    image: clickhouse/clickhouse-server:24.3
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    restart: unless-stopped

  otel-collector:
    image: signoz/signoz-otel-collector:v0.102.0
    command: ['--config=/etc/otelcol-contrib/config.yaml']
    volumes:
      - ./otel-collector.yaml:/etc/otelcol-contrib/config.yaml
    ports: ['4317:4317', '4318:4318']
    restart: unless-stopped
```

Next.js SDK (`@opentelemetry/api` + `@signoz/signoz-otel-exporter`):

```ts
// instrumentation.ts (Next.js 15)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}

// instrumentation-node.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'easydemo-app',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
});
sdk.start();
```

**Custo de infra:** SigNoz + ClickHouse ~1.5-2 GB RAM. Em VPS 8 GB: ok, sobra para app + Postgres + Worker.

---

## 6. SSL/TLS — Let's Encrypt via Caddy

Caddy já tem integração. Zero config:

```caddyfile
app.easydemo.io {
  reverse_proxy app:3000
  tls {
    issuer letsencrypt
  }
}
```

DNS do domínio aponta para IP do VPS (registro A) OU via Cloudflare (proxy laranja). Ambos funcionam; Cloudflare proxy dá DDoS grátis extra.

---

## 7. Segurança do VPS

### 7.1 Firewall (Hetzner)

```bash
# Permitir só SSH, HTTP, HTTPS
hcloud firewall create --name easydemo-prod
hcloud firewall add-rule --direction in --protocol tcp --port 22 --source-ips 0.0.0.0/0 --name easydemo-prod
hcloud firewall add-rule --direction in --protocol tcp --port 80 --source-ips 0.0.0.0/0 --name easydemo-prod
hcloud firewall add-rule --direction in --protocol tcp --port 443 --source-ips 0.0.0.0/0 --name easydemo-prod
hcloud firewall add-rule --direction in --protocol tcp --port 5432 --source-ips 127.0.0.0/8 --name easydemo-prod
hcloud server add-firewall --firewall easydemo-prod --server myserver
```

### 7.2 SSH hardening

- Desabilitar login por senha, só chave.
- `PermitRootLogin no`.
- Mudar porta 22 para porta alta (security through obscurity + reduz bots).
- Fail2ban instalado.

### 7.3 Updates automáticos

```bash
apt install unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

### 7.4 Backups do VPS inteiro (Hetzner Snapshot)

- Hetzner cobra €0.01/GB/mês para snapshots.
- Fazer **antes de qualquer deploy grande** ou semanalmente.
- Para nosso caso (PG backup em R2 + snapshot do VPS), restore fica simples.

---

## 8. CI/CD

### 8.1 GitHub Actions → Docker registry → deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/easydemo/app:${{ github.sha }}
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /opt/easydemo
            docker compose pull
            docker compose up -d --no-deps app worker
            docker system prune -f
```

Deploy usa `watchtower` (opcional) ou manual pull + up.

### 8.2 Watchtower (atualização automática de imagens)

```yaml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  command: --interval 300 --cleanup
```

---

## 9. Estimativa de complexidade

| Tarefa | tamanho |
|---------|---------|
| Provisionar VPS + firewall | S |
| Setup Docker Compose (app + db + caddy) | S |
| Setup Cloudflare (DNS, proxy, R2, Workers se preciso) | S |
| pgBackRest + repo em R2 + cron | M |
| SigNoz self-host + OTel SDK | M |
| CI/CD GitHub Actions | S |
| SSL/TLS via Caddy | S |
| Backup drill mensal + restore test | S |

**Infra completa: M.** Cabe em 1-2 sprints.

---

## 10. Estimativa de custo mensal (VPS 8GB)

| Item | Custo |
|------|-------|
| Hetzner CPX32 | ~€35 |
| Hetzner snapshot backup | ~€1 |
| Cloudflare R2 (100 GB + 1M reqs) | ~$2 |
| Cloudflare Workers (free tier ok) | $0 |
| Cloudflare Pro (opcional) | $20 |
| SigNoz self-host | $0 (no VPS) |
| Domain (.com.br) | ~R$ 40/ano |
| Resend (50k emails) | $20 |
| Clerk (10k MAU Pro) | $25 |
| **Total** | **~$80-100/mo + R$ 40/ano** |

Para começar dá pra economizar cortando Cloudflare Pro e usando domínio .com (~$10/ano).

---

## 11. Referências

- Hetzner Cloud: <https://www.hetzner.com/cloud>
- hetzner-k3s: <https://github.com/vitobotta/hetzner-k3s>
- K3s on Hetzner: <https://hetzner-k3s.com/>
- Docker Compose vs K3s em 1 VPS: <https://bogomolov.work/blog/posts/the-actual-state-of-self-hosting-on-a-vps>
- Contabo comparativo: <https://contabo.com/blog/vps-for-docker-containers-kubernetes/>
- pgBackRest: <https://pgbackrest.org/>
- pgBackRest vs Barman vs WAL-G: <https://github.com/cybertec-postgresql/pg_hardstorage/blob/main/docs/explanation/comparison-pgbackrest-walg-barman.md>
- SigNoz self-host: <https://signoz.com/docs/hosted-clickhouse>
- SigNoz vs Grafana: <https://signoz.io/grafana-alternative>
- SigNoz pricing: <https://signoz.io/pricing>
- Cloudflare R2: <https://developers.cloudflare.com/r2/>
- Cloudflare Workers pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
- Hetzner Cloud Firewall: <https://docs.hetzner.com/cloud/networks/firewalls>