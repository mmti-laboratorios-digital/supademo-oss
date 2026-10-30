# Provisionamento VPS Hetzner — DemoBR

Documentação de provisionamento da VPS de produção do DemoBR na Hetzner Cloud.

Este diretório contém:
- `cloud-init.example.yaml` — artefato de **referência** (não aplicar diretamente; o
  autoritativo é gerado pelo script em `infra/cloud-init.yaml`).
- Este README — passo-a-passo manual + via script.

> **Status:** validado em modo dry-run em out/2026 (ver
> [`setup-report/PHASE-4-hetzner.md`](../../setup-report/PHASE-4-hetzner.md)).

---

## 1. Pré-requisitos

### Conta
- **Hetzner Cloud Console**: criar conta em <https://console.hetzner.cloud>
  (cartão obrigatório; primeiro projeto vem com €20 de crédito).
- **API Token**: `console.hetzner.cloud` → projeto alvo → `Security` →
  `API Tokens` → `Generate API Token`. Permissão mínima: `Read & Write`.
  ⚠️ Guardar em password manager (1Password/Bitwarden). O token aparece
  **apenas uma vez**.

### CLI local
- `hcloud` CLI ≥ 1.40: <https://github.com/hetznercloud/cli>
  ```bash
  # Linux (amd64)
  curl -fsSL https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64 \
    -o /usr/local/bin/hcloud && chmod +x /usr/local/bin/hcloud
  hcloud version   # confirmar

  # macOS
  brew install hcloud
  ```
- SSH key ed25519 (ou RSA 4096) gerada e presente em `~/.ssh/id_ed25519.pub`.

### Conectividade
- Saída HTTPS (443) para `api.hetzner.cloud` e `github.com` (download hcloud).
- Entrada SSH (22) liberada no seu firewall local (não confundir com o UFW
  do VPS).

---

## 2. Custos (referência out/2026, EU/DE-FI, excl. VAT)

> ⚠️ **Hetzner reajustou preços em 15/jun/2026** (CCX/CPX ~2.4× a 2.7×).
> Valores abaixo são pós-reajuste.

| Tipo        | vCPU | RAM  | SSD  | Tráfego | Preço/mês | Observação                |
|-------------|------|------|------|---------|-----------|---------------------------|
| **CX22**    | 1    | 4 GB | 40 GB  | 20 TB  | ~€3.99    | Default do script (cheap) |
| **CX32**    | 2    | 8 GB | 80 GB  | 20 TB  | ~€6.49    | Mínimo viável produção    |
| **CPX32** ✅| 4    | 8 GB | 160 GB | 20 TB  | **~€35.49** | **Recomendado produção**  |
| CPX42       | 8    | 16 GB| 320 GB | 20 TB  | ~€69.49   | Escalar se app exigir     |

**Add-ons:**
- Snapshot (imagem sob demanda): **€0.0143/GB/mês** (compactado; só conta
  o espaço usado, não o disco inteiro).
- Backup automático: +20% do preço do servidor (até 7 snapshots retidos).
- Volume (block storage): €0.0572/GB/mês (tripla replicação).
- IPv4 pública: +€0.50/mês em CX/CAX (CPX já inclusa em alguns planos;
  conferir no ato).
- Floating IP: grátis (cobrada enquanto reservada e não associada).

**Estimativa CPX32 + 1 snapshot mensal de ~10 GB:**
- Servidor: €35.49
- Snapshot: €0.14
- IPv4 (se aplicável): €0.50
- **Total: ~€36.13/mês**

> DemoBR no MVP usa `cx22` (default do script). Promover para `cpx32`
> quando tráfego real passar de ~50 MAU ou houver worker assíncrono
> pesado.

---

## 3. Provisionamento manual (passo-a-passo)

Use quando você quiser controle total ou não confiar no script. Todos os
comandos `hcloud` abaixo são exatos (copiar/colar).

### 3.1. Configurar contexto

```bash
# Substitua <TOKEN> pelo token gerado no Console
hcloud context create hetzner-prod <<<"<TOKEN>"
hcloud context use hetzner-prod
hcloud context list   # confirmar que tem * ao lado de hetzner-prod
```

### 3.2. Registrar SSH key

```bash
hcloud ssh-key create \
  --name id_ed25519 \
  --public-key-from-file ~/.ssh/id_ed25519.pub
```

### 3.3. Escolher tipo de servidor

```bash
# Listar tipos disponíveis em fsn1 (Falkenstein, DE)
hcloud server-type list | head -20

# Listar imagens Ubuntu LTS
hcloud image list | grep ubuntu-24

# Listar localizações
hcloud location list
```

### 3.4. Gerar cloud-init (ou usar o do script)

**Opção A** — gerar via script (recomendado, sempre atualizado):
```bash
cd /home/dan/saas/supademo-oss
bash scripts/provision-hetzner.sh   # responde "n" no prompt final
# Resultado: infra/cloud-init.yaml
```

**Opção B** — usar referência manual em
`infra/hetzner/cloud-init.example.yaml`, substituir `${CN_DOMAIN}` e
`${SSH_PUBKEY}`:
```bash
sed -e "s|\${CN_DOMAIN}|demo.seudominio.com.br|g" \
    -e "s|\${SSH_PUBKEY}|$(cat ~/.ssh/id_ed25519.pub)|g" \
    infra/hetzner/cloud-init.example.yaml > /tmp/cloud-init.yaml
```

### 3.5. Criar o servidor

```bash
hcloud server create \
  --name demobr-prod-01 \
  --type cpx32 \
  --image ubuntu-24.04 \
  --location fsn1 \
  --ssh-key id_ed25519 \
  --user-data-from-file infra/cloud-init.yaml \
  --start-after-create
```

Resultado:
```
Server demobr-prod-01 created
IPv4 address: 203.0.113.42   # (fictício — copie o seu)
```

### 3.6. Aguardar cloud-init terminar (~3–6 min)

```bash
IP=$(hcloud server ip demobr-prod-01)
ssh -o StrictHostKeyChecking=accept-new root@$IP \
  'cloud-init status --wait && cloud-init status --format=json | jq .status'
# Esperado: "done"
```

### 3.7. Verificações pós-boot

```bash
ssh root@$IP <<'REMOTE'
  set -e
  ufw status                              # 22, 80, 443 ALLOW
  fail2ban-client status sshd             # Jail list: 1
  docker --version                        # 27.x ou 28.x
  caddy version                           # v2.x
  systemctl is-active caddy fail2ban ufw  # all active
  docker run --rm hello-world | head -1   # "Hello from Docker!"
REMOTE
```

---

## 4. Provisionamento via script

O script `scripts/provision-hetzner.sh` automatiza passos 3.1 a 3.4 e
interrompe antes de criar o server (modo dry-run é o default — responde
`n` no prompt).

### 4.1. Rodar uma vez (interativo)

```bash
cd /home/dan/saas/supademo-oss
bash scripts/provision-hetzner.sh
```

Fluxo:
1. **Instala `hcloud`** se não existir (Linux: download direto; macOS: brew).
2. **Cria o context `demobr-prod`** (prompt: "Token Hetzner Cloud:" —
   cole o token; entrada oculta).
3. **Upload da SSH key** se ainda não registrada no projeto Hetzner.
4. **Gera `infra/cloud-init.yaml`** (sobrescreve sem aviso).
5. **Plano de provisionamento** impresso (nome, tipo, imagem, local, key).
6. **Prompt final**:
   - `s` / `sim` / `y` → executa `hcloud server create` (CRIA O SERVER, $$$)
   - `n` (default) → imprime o comando `hcloud server create ...` para
     você colar depois. Nada é criado.

### 4.2. Variáveis de ambiente (overrides)

| Variável              | Default       | Descrição                                    |
|-----------------------|---------------|----------------------------------------------|
| `HCLOUD_CONTEXT`      | `demobr-prod` | Nome do context do `hcloud`                   |
| `DEMOBR_SSH_KEY`      | `~/.ssh/id_ed25519.pub` | Caminho da public key                |
| `DEMOBR_SERVER_TYPE`  | `cx22`        | Tipo (ex.: `cx22`, `cpx32`)                  |
| `DEMOBR_IMAGE`        | `ubuntu-24.04`| Slug da imagem                               |
| `DEMOBR_LOCATION`     | `fsn1`        | Datacenter (`fsn1`, `nbg1`, `hel1`, etc.)    |
| `DEMOBR_SERVER_NAME`  | `demobr-prod-01` | Hostname Hetzner (metadata, não OS)        |
| `CN_DOMAIN`           | *(vazio)*     | Domínio dos serviços Caddy (ex.: `demo.br`) |

Exemplo para produção:
```bash
DEMOBR_SERVER_TYPE=cpx32 CN_DOMAIN=demo.br bash scripts/provision-hetzner.sh
```

> ⚠️ O script **não tem flag `--dry-run` explícita** — o dry-run é o
> comportamento default (responder `n` no prompt). Para simular
> completamente, rodar com `< /dev/null` e input "n".

### 4.3. Dry-run programático (CI / automação)

```bash
# stdin "n" garante que NENHUM server é criado
echo "n" | bash scripts/provision-hetzner.sh
```

Saída típica (validada em out/2026, ver `PHASE-4-hetzner.md`):
```
[ok] Context 'demobr-prod' ativo.
[ok] SSH key 'id_ed25519' já registrada.
[hetzner] Gerando .../infra/cloud-init.yaml…
[ok] cloud-init.yaml gerado.

Plano de provisionamento:
  Nome:    demobr-prod-01
  Tipo:    cx22 (1 vCPU, 4GB RAM, 40GB SSD)
  Imagem:  ubuntu-24.04
  Local:   fsn1
  Key:     id_ed25519
  Cloud-init: .../infra/cloud-init.yaml

Criar o VPS agora? [s/N] (N = dry-run): [hetzner] Dry-run — nada foi criado.
```

---

## 5. Próximos passos (após provisionar)

1. **DNS**: no Cloudflare (ou Route 53), criar registros A:
   - `app.<CN_DOMAIN>` → IP público do VPS
   - `cdn.<CN_DOMAIN>` → mesmo IP
   - Apontar nameservers do domínio para Cloudflare (proxy laranja ON).

2. **Secrets**: copiar `.env` (gerado por `scripts/generate-secrets.sh`
   no host local) para `/opt/demobr/.env` no VPS via `scp`. Inclui
   `CLOUDFLARE_API_TOKEN` para o Caddy emitir certs via DNS-01.

3. **Deploy**: `bash scripts/deploy.sh` (push do compose para o VPS).
   Esperar health check (`GET /api/health`) responder 200.

4. **Backups**: habilitar backups automáticos no Console Hetzner
   (Settings → Backups → +20%) **OU** configurar `pgBackRest` →
   R2 conforme `infra/postgres/pgbackrest.conf`.

5. **Monitoramento**: apontar o health check para
   <https://app.<CN_DOMAIN>/api/health> via UptimeRobot / Better Stack
   (alerta se 3 falhas consecutivas em 5 min).

6. **DR drill**: agendar mensalmente `bash scripts/restore-drill.sh`
   (provisiona VPS temp, restaura último backup do R2, valida
   `/api/health`, deleta). Custo: ~€0.50/drill (1h de CX22).

---

## 6. Teardown (quando precisar)

```bash
# Deletar o server (CUIDADO: irreversível. Faz snapshot antes se quiser)
hcloud server create --image demobr-prod-01   # NÃO existe — exemplo errado

# CORRETO: primeiro snapshot, depois delete
hcloud server create-image --type snapshot \
  --name "demobr-prod-final-$(date +%Y%m%d)" demobr-prod-01
hcloud server delete demobr-prod-01
```

> O script `scripts/teardown.sh` é para o ambiente **local** (docker
> compose). Para a VPS, use os comandos `hcloud` acima diretamente.

---

## 7. Referências

- Script autoritativo: [`scripts/provision-hetzner.sh`](../../scripts/provision-hetzner.sh)
- Relatório de validação: [`setup-report/PHASE-4-hetzner.md`](../../setup-report/PHASE-4-hetzner.md)
- Cloud-init gerado (em runtime, **não versionado**): `infra/cloud-init.yaml` —
  criado por `scripts/provision-hetzner.sh`. Não está no repo; use a referência
  versionada abaixo como template.
- Cloud-init referência (versionado): [`cloud-init.example.yaml`](./cloud-init.example.yaml)
- Setup Cloudflare (R2 + DNS): [`scripts/setup-cloudflare.sh`](../../scripts/setup-cloudflare.sh)
- Hetzner pricing: <https://www.hetzner.com/cloud>
- hcloud CLI docs: <https://github.com/hetznercloud/cli>
- Cloud-init schema: <https://cloudinit.readthedocs.io/>