# ADR-010: pgBackRest para backup e Point-in-Time Recovery (PITR)

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead DemoBR, Founding engineer

## Context and Problem Statement

DemoBR armazena **dados críticos de clientes B2B** (workspaces, demos, leads, billing). Perda de banco = empresa fecha. Precisamos de:

1. **Backups diários** full + incrementais.
2. **Point-in-Time Recovery (PITR)** até os últimos 7–14 dias (para casos de "DELETE acidental às 14h32").
3. **Criptografia at-rest** (LGPD art. 46).
4. **Armazenamento off-site** (não no mesmo VPS — se Hetzner perde disco, temos cópia).
5. **Verificação periódica** (backup que nunca foi restaurado é backup que não funciona).
6. **Retenção** alinhada com LGPD.

## Decision Drivers

- **PITR real** (não só snapshots discretos).
- **Criptografia AES-256** sem dependência de KMS externo.
- **Compressão paralela** (backups grandes não podem saturar CPU).
- **Compatibilidade** com Postgres 16 (versão canônica — ver ADR-013) e `pgBackRest S3 backend` (R2 é S3-compatible).
- **Custo baixo** (R2 storage ~$0.015/GB).

## Considered Options

1. **pgBackRest** com repo S3-compatível em R2 (PITR + AES-256).
2. **WAL-G** (sucessor moderno de WAL-E, S3-native).
3. **Barman** (gestor de backup enterprise).
4. **pg_dump + cron** (full dump diário).
5. **Hetzner Snapshots** (volume-level, sem PITR).

## Decision Outcome

**Chosen option: "pgBackRest com repo em R2"**, porque entrega **PITR + criptografia AES-256 + compressão paralela + integração S3 (R2)** em uma única ferramenta open-source. WAL-G é equivalente em storage S3 mas tem curva de aprendizado pior e menos docs.

Configuração:

- `pgbackrest.conf` no sidecar `pgbackrest` apontando para `repo1-type=s3`, `repo1-path=/pgbackrest`, `repo1-s3-endpoint=...r2.cloudflarestorage.com`, `repo1-s3-key=...`, `repo1-s3-key-secret=...`, `repo1-s3-bucket=demo-private`, `repo1-cipher-type=aes-256-cbc`, `repo1-retention-full=7`, `repo1-retention-diff=7`.
- **Cron diário** `02:00 BRT`: `pgbackrest backup --type=full` (full semanal) + `pgbackrest backup --type=diff` (diff diário).
- **WAL archiving** contínuo via `archive_command = 'pgbackrest archive-push %p'`.
- **Restore drill mensal**: script `scripts/restore-drill.sh` que sobe Postgres em container, restaura último full + WALs, valida checksum, gera relatório.
- **Retenção LGPD**: backups com mais de 90 dias são **automaticamente purgados** (cron graphile-worker), exceto 1 full/mês guardado por 24 meses (auditoria).

### Positive Consequences

- **PITR até o segundo** (`--target=time`, `--target=xid`, `--target=name`).
- **Criptografia AES-256-CBC** transparente; chave em `secrets/pgbackrest_key.txt` montada via Docker secrets.
- **Compressão paralela** (zstd/lz4) — full backup de 50 GB em ~10 min em CPX32.
- **Validação** integrada (`pgbackrest check`).
- **Restore parcial** (1 schema, 1 tabela) com `--db-include` (útil para LGPD DSR).
- **Backup incremental/diff** economiza storage (só guarda blocks alterados).
- **Open-source BSD**, mantido pela Crunchy Data.
- Suporte oficial a R2/S3/MinIO/Azure/GCS.

### Negative Consequences

- **Setup inicial** mais complexo que `pg_dump` (precisa configurar stanza, WAL archiving, repo).
- **Restore total** exige app parado (PITR exige parar Postgres temporariamente).
- **Não comprime JSONB** (compressão é por page, não por valor) — backups podem ficar 1.5× maiores que raw.
- Sidecar container adiciona ~50 MB RAM.
- Logs verbosos exigem parser (`pgbackrest info --output=json`).

### Follow-ups

- **Monitorar `pgbackrest info --stanza=main` em SigNoz** (alert se last backup > 26h).
- Adicionar **bloom filters** (`--repo1-bundle`) na Fase 2 para acelerar restore parcial.
- Documentar **runbook de DR** em `infra/postgres/RUNBOOK.md`.

## Pros and Cons of the Options

### pgBackRest (escolhido)

- Good, PITR robusto.
- Good, AES-256 nativo.
- Good, compressão paralela.
- Good, S3/R2/GCS/Azure suportados.
- Bad, setup inicial mais complexo.

### WAL-G

- Good, modern, S3-first.
- Good, suporte a criptografia.
- Bad, comunidade menor, docs esparsas.
- Bad, menos maduro para PITR com diff/incr.
- Bad, sem `restore --target=time` em todas as versões.

### Barman

- Good, gerenciador enterprise (gestão centralizada).
- Good, RSYNC + S3.
- Bad, **overhead de Rsync** (não é WAL-archive puro).
- Bad, configuração verbosa.
- Bad, comunidade menor.
- Bad, mantido por 2ndQuadrant (Ericsson).

### pg_dump + cron

- Good, simples.
- Bad, **sem PITR** (só full snapshots).
- Bad, restore lento (50 GB dump = horas).
- Bad, sem criptografia nativa.
- Bad, sem deduplicação.

### Hetzner Snapshots

- Good, 1 click, restore full em minutos.
- Good, barato (~€0.01/GB/mês).
- Bad, **volume-level** — restaura TUDO ou nada, sem PITR.
- Bad, sem criptografia adicional (depende do Hetzner).
- Bad, sem versionamento granular (último snapshot sobrescreve).

## References

- [pgBackRest docs](https://pgbackrest.org/)
- [pgBackRest S3 repo config](https://pgbackrest.org/configuration.html#section-repository/option-repo-type)
- [WAL-G](https://github.com/wal-g/wal-g)
- [Barman](https://pgbarman.org/)
- [Hetzner Snapshots](https://docs.hetzner.com/cloud/servers/backups-snapshots)
- RFC DemoBR §2.6 — backup
- `research/tech/infra-vps.md` §4 — backup strategy
- `research/tech/RECOMMENDATION.md` §2.5 — pgBackRest