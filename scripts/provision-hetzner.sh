#!/usr/bin/env bash
# =============================================================================
#  scripts/provision-hetzner.sh — Guia interativo para provisionar VPS na
#  Hetzner Cloud via hcloud CLI + gera cloud-init.yaml.
# =============================================================================
set -euo pipefail

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'
log()  { printf "${BLUE}[hetzner]${NC} %s\n" "$*"; }
ok()   { printf "${GREEN}[ok]${NC} %s\n" "$*"; }
warn() { printf "${YELLOW}[warn]${NC} %s\n" "$*"; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLOUD_INIT="$ROOT_DIR/infra/cloud-init.yaml"

# -----------------------------------------------------------------------------
# 1. hcloud CLI instalado?
# -----------------------------------------------------------------------------
if ! command -v hcloud >/dev/null 2>&1; then
  log "Instalando hcloud CLI…"
  case "$OSTYPE" in
    linux*)  curl -fsSL https://github.com/hetznercloud/cli/releases/latest/download/hcloud-linux-amd64 \
              -o /usr/local/bin/hcloud && chmod +x /usr/local/bin/hcloud ;;
    darwin*) brew install hcloud ;;
    *)       err "Instale manualmente: https://github.com/hetznercloud/cli"; exit 1 ;;
  esac
fi

# -----------------------------------------------------------------------------
# 2. Contexto (token)
# -----------------------------------------------------------------------------
CONTEXT="${HCLOUD_CONTEXT:-easydemo-prod}"
if ! hcloud context list 2>/dev/null | grep -q "$CONTEXT"; then
  printf "${YELLOW}hcloud context '$CONTEXT' não existe. Vamos criar.${NC}\n"
  printf "Token Hetzner Cloud (https://console.hetzner.cloud → Security → API Tokens): "
  read -rs TOKEN; echo
  hcloud context create "$CONTEXT" <<<"$TOKEN" >/dev/null
  hcloud context use "$CONTEXT"
  ok "Context '$CONTEXT' criado."
else
  hcloud context use "$CONTEXT" >/dev/null
  ok "Context '$CONTEXT' ativo."
fi

# -----------------------------------------------------------------------------
# 3. SSH key (upload se ainda não existir)
# -----------------------------------------------------------------------------
SSH_KEY="${EASYDEMO_SSH_KEY:-$HOME/.ssh/id_ed25519.pub}"
if [[ ! -f "$SSH_KEY" ]]; then
  ssh-keygen -t ed25519 -N "" -f "${SSH_KEY%.pub}"
fi
KEY_NAME="$(basename "${SSH_KEY%.pub}")"
if ! hcloud ssh-key list -o columns=name 2>/dev/null | tail -n +2 | grep -qx "$KEY_NAME"; then
  hcloud ssh-key create --name "$KEY_NAME" --public-key-from-file "$SSH_KEY" >/dev/null
  ok "SSH key '$KEY_NAME' registrada."
else
  ok "SSH key '$KEY_NAME' já registrada."
fi

# -----------------------------------------------------------------------------
# 4. Gera cloud-init.yaml
# -----------------------------------------------------------------------------
log "Gerando $CLOUD_INIT…"

SSH_AUTHORIZED="$(cat "$SSH_KEY")"

cat > "$CLOUD_INIT" <<YAML
#cloud-config
# -----------------------------------------------------------------------------
# cloud-init para VPS EasyDemo (Hetzner Cloud)
# Stack: Docker + UFW + fail2ban + Caddy (Cloudflare DNS challenge)
# -----------------------------------------------------------------------------
package_update: true
package_upgrade: true

packages:
  - apt-transport-https
  - ca-certificates
  - curl
  - gnupg
  - lsb-release
  - ufw
  - fail2ban
  - unattended-upgrades

write_files:
  # --- Caddy (com challenge DNS Cloudflare) ---
  - path: /etc/caddy/Caddyfile
    owner: root:root
    permissions: "0644"
    content: |
      cdn.${CN_DOMAIN} {
        tls {
          dns cloudflare {env.CLOUDFLARE_API_TOKEN}
        }
        @static path /_static/*
        header Cache-Control "public, max-age=31536000, immutable"
        reverse_proxy app:3000
      }

      app.${CN_DOMAIN} {
        tls {
          dns cloudflare {env.CLOUDFLARE_API_TOKEN}
        }
        reverse_proxy app:3000
      }

  # --- fail2ban: jail.local (sshd mais agressivo) ---
  - path: /etc/fail2ban/jail.local
    owner: root:root
    permissions: "0644"
    content: |
      [sshd]
      enabled = true
      port    = ssh
      filter  = sshd
      logpath = /var/log/auth.log
      maxretry = 4
      bantime  = 1h
      findtime = 10m

runcmd:
  # ---- UFW ----
  - ufw default deny incoming
  - ufw default allow outgoing
  - ufw allow 22/tcp comment "ssh"
  - ufw allow 80/tcp comment "http (caddy)"
  - ufw allow 443/tcp comment "https (caddy)"
  - ufw --force enable

  # ---- Docker ----
  - install -m 0755 -d /etc/apt/keyrings
  - curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  - chmod a+r /etc/apt/keyrings/docker.gpg
  - echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
  - apt-get update
  - apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  # ---- Caddy + plugin cloudflare ----
  - apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  - curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  - curl -1sLf 'https://dl.cloudsmith.io/public/caddy/xcaddy/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-xcaddy-archive-keyring.gpg
  - echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/repos/caddy/stable/any-version/deb debian main" > /etc/apt/sources.list.d/caddy.list
  - echo "deb [signed-by=/usr/share/keyrings/caddy-xcaddy-archive-keyring.gpg] https://dl.cloudsmith.io/repos/caddy/xcaddy/any-version/deb debian main" >> /etc/apt/sources.list.d/caddy.list
  - apt-get update
  - apt-get install -y caddy
  - apt-get install -y caddy-addon-cloudflare
  - systemctl enable caddy

  # ---- fail2ban ----
  - systemctl enable fail2ban
  - systemctl restart fail2ban

  # ---- unattended-upgrades ----
  - dpkg-reconfigure -plow unattended-upgrades

  # ---- Prepara diretório de deploy ----
  - mkdir -p /opt/easydemo
  - echo "${SSH_AUTHORIZED}" > /root/.ssh/authorized_keys_via_cloudinit
  - chmod 600 /root/.ssh/authorized_keys_via_cloudinit

final_message: "EasyDemo VPS pronto em \$HOSTNAME após \$UPTIME segundos."
YAML
ok "cloud-init.yaml gerado."

# -----------------------------------------------------------------------------
# 5. Cria VPS (modo dry-run por padrão)
# -----------------------------------------------------------------------------
SERVER_TYPE="${EASYDEMO_SERVER_TYPE:-cx22}"
IMAGE="${EASYDEMO_IMAGE:-ubuntu-24.04}"
LOCATION="${EASYDEMO_LOCATION:-fsn1}"
SERVER_NAME="${EASYDEMO_SERVER_NAME:-easydemo-prod-01}"

printf "\n${YELLOW}Plano de provisionamento:${NC}\n"
printf "  Nome:    %s\n" "$SERVER_NAME"
printf "  Tipo:    %s (1 vCPU, 4GB RAM, 40GB SSD)\n" "$SERVER_TYPE"
printf "  Imagem:  %s\n" "$IMAGE"
printf "  Local:   %s\n" "$LOCATION"
printf "  Key:     %s\n" "$KEY_NAME"
printf "  Cloud-init: %s\n\n" "$CLOUD_INIT"

printf "${YELLOW}Criar o VPS agora? [s/N] (N = dry-run)${NC}: "
read -r ANS
ANS="$(printf '%s' "$ANS" | tr '[:upper:]' '[:lower:]')"

if [[ "$ANS" == "s" || "$ANS" == "sim" || "$ANS" == "y" ]]; then
  hcloud server create \
    --name "$SERVER_NAME" \
    --type "$SERVER_TYPE" \
    --image "$IMAGE" \
    --location "$LOCATION" \
    --ssh-key "$KEY_NAME" \
    --user-data-from-file "$CLOUD_INIT" \
    --start-after-create

  IP="$(hcloud server ip "$SERVER_NAME")"
  printf "\n${GREEN}VPS criado: %s (%s)${NC}\n" "$SERVER_NAME" "$IP"
  printf "Acesse: ssh root@%s\n\n" "$IP"
else
  log "Dry-run — nada foi criado. Para criar depois:"
  printf "  hcloud server create \\\n"
  printf "    --name %s --type %s --image %s --location %s \\\n" "$SERVER_NAME" "$SERVER_TYPE" "$IMAGE" "$LOCATION"
  printf "    --ssh-key %s --user-data-from-file %s --start-after-create\n" "$KEY_NAME" "$CLOUD_INIT"
fi