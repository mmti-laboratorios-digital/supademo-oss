# ADR-009: Hetzner CPX32 + Docker Compose para orquestração

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead DemoBR, Founding engineer

## Context and Problem Statement

DemoBR roda em produção em uma **única VPS Hetzner CPX32** (4 vCPU, 8 GB RAM, 160 GB NVMe, €35/mês). Devemos decidir **como orquestrar os containers** que compõem o stack:

- **Next.js** (app + API + landing)
- **Worker** (graphile-worker + scripts LGPD)
- **Postgres 17** (banco primário)
- **pgBackRest** (sidecar de backup)
- **ClickHouse** (opcional para analytics, SigNoz usa)
- **SigNoz** (3 containers: frontend, query-service, otel-collector + ClickHouse)
- **Caddy** (reverse proxy)

Total: ~7–12 containers no `docker-compose.yml`.

## Decision Drivers

- **RAM disponível** (8 GB; subtrair Postgres 2 GB + SigNoz 1.5 GB + Caddy 50 MB = ~4.5 GB livres para Next + Worker).
- **Complexidade operacional**: time de 1–3 devs.
- **Custo**: €0 (Docker Compose é nativo).
- **Migração futura**: se um dia precisar HA/multi-node, queremos caminho suave.
- **Backups**: pgBackRest precisa de acesso ao Postgres e ao R2.

## Considered Options

1. **Docker Compose v2** (single-host, declarativo).
2. **K3s** (single-node Kubernetes).
3. **Nomad** (HashiCorp, single-binary orchestrator).
4. **Kubernetes gerenciado** (EKS, GKE, DigitalOcean Kubernetes).
5. **systemd + Docker manual** (sem orquestrador).

## Decision Outcome

**Chosen option: "Docker Compose v2 com healthchecks e depends_on condicionais"**, porque é o orquestrador certo para o tamanho do projeto. K3s consumiria ~1.4 GB de RAM à toa; Kubernetes gerenciado custa > $70/mês e exige expertise. Docker Compose dá **declaratividade** sem overhead.

Configuração do `compose.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ['80:80', '443:443']
    volumes: ['./Caddyfile:/etc/caddy/Caddyfile', 'caddy_data:/data']
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    shm_size: 1gb
    environment: { POSTGRES_PASSWORD_FILE: /run/secrets/pg_pass }
    secrets: [pg_pass]
    volumes: ['pg_data:/var/lib/postgresql/data', './infra/postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro']
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck: { test: ['CMD', 'pg_isready', '-U', 'postgres'], interval: 5s }

  app:
    build: ./apps/web
    env_file: .env
    depends_on: { postgres: { condition: service_healthy }, caddy: { condition: service_started } }
    restart: unless-stopped

  worker:
    build: ./apps/workers
    env_file: .env
    depends_on: { postgres: { condition: service_healthy } }
    restart: unless-stopped

  signoz-frontend:
    image: signoz/signoz-frontend:0.55.0
    restart: unless-stopped

  signoz-otel-collector:
    image: signoz/signoz-otel-collector:0.111.0
    # ...

secrets:
  pg_pass:
    file: ./secrets/pg_pass.txt
```

Volumes nomeados (`pg_data`, `caddy_data`, `signoz_data`) garantem persistência entre deploys.

### Positive Consequences

- **Zero overhead**: Docker Compose é um binário Go de ~20 MB; sem daemon extra.
- **Declaratividade pura**: 1 arquivo, 1 processo para orquestrar.
- **Logs centralizados**: `docker compose logs -f app` resolve 90% dos debugs.
- **Health checks** + `depends_on: condition: service_healthy` substituem readiness probes do K8s.
- **Migração trivial** para K3s usando `kompose` (converte compose → manifestos K8s).
- **Restart policies** + healthchecks dão auto-healing equivalente a K8s para single-host.
- **Backups via volume snapshots** do Hetzner (€0.01/GB/mês).

### Negative Consequences

- **Sem auto-scaling** (precisa `docker compose up --scale app=3` manual).
- **Sem rolling update zero-downtime** (mitigável com `docker compose up -d --no-deps app` + healthcheck grace).
- **Sem service discovery** (containers acessam por `service_name:port` no mesmo network).
- **Secrets management** é limitado (Docker secrets + bind-mount de arquivos; não tem KMS integrado).
- **Single point of failure** se a VPS cai — aceitável para MVP (Hetzner SLA 99.9%).

### Follow-ups

- Adicionar **Watchtower** (ou Dependabot de imagens) para auto-update de imagens com security patches.
- Documentar **runbook de restore** (Hetzner snapshot + pgBackRest + verificação).
- Configurar **Alerta UptimeRobot** apontando para `/healthz` (grátis).

## Pros and Cons of the Options

### Docker Compose v2 (escolhido)

- Good, simplicidade máxima.
- Good, zero overhead.
- Good, migração futura fácil.
- Bad, sem auto-scaling.
- Bad, sem rolling update zero-downtime nativo.

### K3s (single-node)

- Good, API K8s familiar.
- Good, auto-healing equivalente ao Compose mas com mais features.
- Bad, ~1.4 GB RAM consumidos pelo orquestrador (17% do CPX32).
- Bad, debug mais complexo (kubectl, logs fragmentados).
- Bad, sem benefício claro para single-node.

### Nomad

- Good, single-binary, leve (~50 MB).
- Good, suporta Docker, JVM, binário.
- Bad, comunidade menor.
- Bad, integra com Consul/Vault, que não temos.
- Bad, docs e exemplos escassos.

### Kubernetes gerenciado (EKS/GKE/DOKS)

- Good, auto-scaling, HA multi-AZ, rolling updates.
- Good, ecossistema Helm/Operators gigante.
- Bad, $70–200/mês mínimo (cluster + nodes).
- Bad, exige expertise K8s (1 dev dedicado).
- Bad, overkill absoluto para 7 containers.

### systemd + Docker manual

- Good, controle total.
- Good, leve.
- Bad, **sem orquestração** — startup order, restart, healthcheck são manuais.
- Bad, onboarding doloroso para novo dev.
- Bad, sem declarative config (YAML único).

## References

- [Docker Compose v2 docs](https://docs.docker.com/compose/)
- [K3s docs](https://docs.k3s.io/)
- [Hetzner Cloud](https://www.hetzner.com/cloud)
- [kompose (Compose → K8s)](https://kompose.io/)
- RFC DemoBR §2.2, §8.4
- `research/tech/infra-vps.md` §2 — orquestração
- `research/tech/architecture-diagram.md` §1 — diagrama de deploy