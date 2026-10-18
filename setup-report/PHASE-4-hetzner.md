# PHASE 4 — Provisionamento VPS Hetzner

**Data:** 2026-10-18
**Executor:** subagent (modo leitura + dry-run; **sem API token**, **sem server real**)
**Escopo:** validar e documentar `scripts/provision-hetzner.sh`; produzir
artefatos de referência em `infra/hetzner/`.

---

## 1. Verificação do script

### 1.1. Sintaxe bash

```bash
$ bash -n scripts/provision-hetzner.sh && echo "Sintaxe OK"
Sintaxe OK
```

✅ Sem erros de parsing. Flags `set -euo pipefail` validadas.

### 1.2. Comportamento esperado (do código-fonte)

| Pergunta da tarefa | Resposta |
|---|---|
| Pede API token do Hetzner? | ✅ **Sim** — passo 2 do script: `read -rs TOKEN` (entrada oculta) e cria `hcloud context create demobr-prod` |
| Cria `cloud-init.yaml`? | ✅ **Sim** — passo 4, escreve em `infra/cloud-init.yaml` (não `cloud-init.example.yaml`!) |
| Documenta passos manuais? | ✅ **Sim** — passo 5 (modo dry-run) imprime o comando `hcloud server create` exato |
| Tem modo `--apply`? | ⚠️ **Parcial** — não tem flag `--apply`. O modo "create" é **interativo** (prompt `s/N`); default = dry-run |

### 1.3. Fluxo do script

```
┌────────────────────────────────────────────────────────────────┐
│ 1. hcloud CLI instalado? (instala se faltar)                    │
│ 2. Token Hetzner → cria context 'demobr-prod' (prompt -rs)     │
│ 3. SSH key local → upload para Hetzner (idempotente)           │
│ 4. Gera infra/cloud-init.yaml (template embedded)              │
│ 5. Imprime plano + prompt [s/N]:                                │
│      s  → hcloud server create ($$$, REAL)                     │
│      N  → dry-run (default; só imprime comando)                │
└────────────────────────────────────────────────────────────────┘
```

### 1.4. Variáveis de ambiente (overrides)

| Var | Default | Observação |
|---|---|---|
| `HCLOUD_CONTEXT` | `demobr-prod` | Nome do `hcloud context` |
| `DEMOBR_SSH_KEY` | `~/.ssh/id_ed25519.pub` | Caminho da public key |
| `DEMOBR_SERVER_TYPE` | `cx22` | Tipo do servidor |
| `DEMOBR_IMAGE` | `ubuntu-24.04` | Slug da cloud image |
| `DEMOBR_LOCATION` | `fsn1` | Datacenter (DE-Falkenstein) |
| `DEMOBR_SERVER_NAME` | `demobr-prod-01` | Nome do recurso Hetzner |
| `CN_DOMAIN` | *(vazio)* | ⚠️ **Não tem default** — se vazio, o heredoc produz cloud-init quebrado (ver §2.4) |

---

## 2. Validação do cloud-init gerado

### 2.1. Como foi validado

O `hcloud` CLI não está instalado neste host (não há token nem conta para
instalar de fato). Para validar a saída do script sem custo nem
provisionamento, foi montado um **ambiente isolado** em `/tmp/hetzner-test/`:

1. Stub de `hcloud` em `/tmp/hetzner-test/bin/hcloud` que simula
   `context list/create/use` e `ssh-key list/create`.
2. SSH key ed25519 dummy gerada em `/tmp/hetzner-test/.ssh/`.
3. Repo simulado em `/tmp/hetzner-test/repo/{scripts,infra}/` espelhando
   a estrutura real.
4. Execução:
   ```bash
   CN_DOMAIN=demo.example.com \
   DEMOBR_SSH_KEY=/tmp/hetzner-test/.ssh/id_ed25519.pub \
   PATH=/tmp/hetzner-test/bin:$PATH \
   OSTYPE=linux-gnu \
   bash scripts/provision-hetzner.sh < <(printf "n\n")
   ```
5. Saída capturada em `/tmp/hetzner-dryrun.log` (780 bytes) e arquivo
   gerado inspecionado.

### 2.2. Output do dry-run (verbatim, sem ANSI)

```
[ok] Context 'demobr-prod' ativo.
[ok] SSH key 'id_ed25519' já registrada.
[hetzner] Gerando /tmp/hetzner-test/repo/infra/cloud-init.yaml…
[ok] cloud-init.yaml gerado.

Plano de provisionamento:
  Nome:    demobr-prod-01
  Tipo:    cx22 (1 vCPU, 4GB RAM, 40GB SSD)
  Imagem:  ubuntu-24.04
  Local:   fsn1
  Key:     id_ed25519
  Cloud-init: /tmp/hetzner-test/repo/infra/cloud-init.yaml

Criar o VPS agora? [s/N] (N = dry-run): [hetzner] Dry-run — nada foi criado. Para criar depois:
  hcloud server create \
    --name demobr-prod-01 --type cx22 --image ubuntu-24.04 --location fsn1 \
    --ssh-key id_ed25519 --user-data-from-file /tmp/hetzner-test/repo/infra/cloud-init.yaml --start-after-create
```

✅ Exit code: `0`. Nada foi criado.

### 2.3. Checklist de hardening do cloud-init

Validado contra o output literal de `infra/cloud-init.yaml` (3495 bytes):

| Requisito                                                  | Status | Evidência no arquivo gerado                                                                                  |
|------------------------------------------------------------|--------|--------------------------------------------------------------------------------------------------------------|
| Instala Docker 24+                                         | ✅     | `apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin` (repo `download.docker.com`, versão atual = 27.x/28.x) |
| Configura UFW (firewall stateful)                          | ✅     | `ufw default deny incoming` + `allow 22/80/443/tcp` + `--force enable`                                      |
| Configura fail2ban                                         | ✅     | Pacote + `/etc/fail2ban/jail.local` (`maxretry=4`, `bantime=1h`, `findtime=10m`) + `systemctl enable/restart`|
| Configura unattended-upgrades                              | ✅     | Pacote + `dpkg-reconfigure -plow unattended-upgrades`                                                        |
| Cria usuário `deploy` com sudo sem senha                   | ❌     | **AUSENTE** — script usa `root` operacional; injeta SSH key em `/root/.ssh/authorized_keys_via_cloudinit`     |
| SSH só por chave (PasswordAuthentication no)                | ⚠️     | **NÃO explícito** — depende do default da cloud image Ubuntu 24.04 da Hetzner. Não há write_file para `sshd_config` nem `runcmd` com `sed -i ...` |
| Configura timezone UTC                                     | ❌     | **AUSENTE** — não há `timezone: Etc/UTC` no topo do cloud-init. Default Ubuntu cloud image é UTC, então OK na prática, mas não é explícito |
| Configura hostname `demobr-prod`                           | ❌     | **AUSENTE** — o nome `demobr-prod-01` é apenas metadata da Hetzner (`--name` no `hcloud server create`); o hostname interno do OS fica com o default da cloud image |

### 2.4. Bug encontrado (severidade baixa)

**Sintoma:** se o usuário rodar o script **sem definir `CN_DOMAIN`**, o
heredoc do passo 4 quebra sob `set -u`:

```
scripts/provision-hetzner.sh: linha 67: CN_DOMAIN: variável não associada
```

Resultado: `cloud-init.yaml` é criado vazio (0 bytes). O `ok` final
impresso é enganoso — o arquivo não foi populado.

**Repro:**
```bash
unset CN_DOMAIN
bash scripts/provision-hetzner.sh
ls -l infra/cloud-init.yaml   # tamanho 0
```

**Fix sugerido** (NÃO aplicado — fora do escopo):
```bash
# Adicionar no topo do script (após line 32):
: "${CN_DOMAIN:=demo.local}"
export CN_DOMAIN
```

**Workaround atual:** sempre exportar `CN_DOMAIN` antes de rodar.

### 2.5. Tabela resumo

| Item                                         | Resultado |
|----------------------------------------------|-----------|
| Sintaxe bash                                 | ✅ OK     |
| `--dry-run` por default (sem flag explícita) | ✅ OK     |
| Cloud-init gerado contém 5/8 itens da spec   | ⚠️ Parcial (3 ausentes, 1 implícito) |
| Requer token interativo                      | ✅ Sim (proteção adequada) |
| Idempotência                                 | ✅ Sim (rodar 2× é seguro) |
| Documentação inline                          | ✅ Sim (prompt `s/N` claro) |

---

## 3. Entregáveis criados

| Arquivo                                                       | Bytes | Conteúdo                                                  |
|---------------------------------------------------------------|-------|-----------------------------------------------------------|
| `infra/hetzner/cloud-init.example.yaml`                       | 5.4 KB| Cloud-init de referência versionado (não aplicar direto)  |
| `infra/hetzner/README.md`                                     | 9.3 KB| Passo-a-passo manual + script + custos + próximos passos  |
| `setup-report/PHASE-4-hetzner.md`                             | (este)| Validação, dry-run output, gaps e workarounds             |

---

## 4. Recomendações para PHASE-5 (não bloqueantes)

1. **Adicionar usuário `deploy`** com sudo NOPASSWD no cloud-init (item
   ausente da spec). Reduz superfície de ataque (root desabilitado).
2. **Reforçar hardening SSH**: `write_files` para
   `/etc/ssh/sshd_config.d/99-demobr.conf`:
   ```yaml
   - path: /etc/ssh/sshd_config.d/99-demobr.conf
     content: |
       PasswordAuthentication no
       PermitRootLogin prohibit-password
       KbdInteractiveAuthentication no
   ```
3. **Tornar `CN_DOMAIN` opcional** com default seguro (ver §2.4).
4. **Adicionar flag `--apply`** explícita ao script para eliminar a
   ambiguidade do prompt interativo em pipelines CI/CD.
5. **Adicionar `timezone: Etc/UTC`** e `manage_etc_hosts: true` (com
   hostname `demobr-prod`) no topo do cloud-init.

---

## 5. Validação cruzada

- ✅ Nenhum server real foi criado (sem API token no ambiente).
- ✅ Nenhuma cobrança incorrida (dry-run only).
- ✅ Nenhum secret vazado (cloud-init gerado contém public key dummy).
- ✅ Sintaxe bash validada com `bash -n`.
- ✅ Saída do script capturada e verificada byte-a-byte.
- ✅ Cloud-init de referência (`cloud-init.example.yaml`) é **estático**
  (placeholders `${CN_DOMAIN}` e `${SSH_PUBKEY}`), seguro para commitar.