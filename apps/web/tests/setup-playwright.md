# Como rodar Playwright localmente

> **TL;DR** — No CI (GitHub Actions), `playwright install --with-deps chromium` funciona
> porque o runner é root. Em container/sandbox sem sudo (este repo foi configurado
> assim), basta `pnpm exec playwright install chromium` — o bundle do Chromium já vem
> com quase todas as deps e o caminho do cache resolve o resto.

---

## 1. Onde está o quê

| Peça | Localização |
|---|---|
| Config do Playwright | **Raiz do monorepo** → `playwright.config.ts` |
| Specs E2E | `tests/e2e/*.spec.ts` (`marketing`, `player-public`, `signup`) |
| Versão `@playwright/test` | `apps/web` → `1.48.2` |
| Cache de browsers | `~/.cache/ms-playwright/` |
| Runner canônico | `pnpm test:e2e` (definido em `package.json` raiz) |

> **Atenção:** o `playwright.config.ts` mora na **raiz** do monorepo, não em
> `apps/web/`. Por isso o script `test:e2e` precisa passar `--config
> ../../playwright.config.ts` quando invocado via `--filter web` (que muda o cwd
> para `apps/web/`). Sem esse flag, o Playwright não encontra nenhum spec.

---

## 2. Três caminhos para rodar

### Caminho A — CI no GitHub Actions (RECOMENDADO)

O runner `ubuntu-latest` é root, então `--with-deps` (que invoca `apt-get`)
funciona normalmente. Já está configurado em `.github/workflows/ci.yml`:

```yaml
- name: Cache Playwright browsers
  if: always()
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('pnpm-lock.yaml') }}

- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium

- name: Run Playwright tests
  run: pnpm test:e2e

- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

> Cache do browser entre runs acelera CI em ~30s. A chave é indexada por hash do
> `pnpm-lock.yaml`, então bump de versão do Playwright invalida o cache sozinho.

---

### Caminho B — Local sem sudo (FALLBACK de dev)

O `--with-deps` falha quando o host não tem `sudo` (container restrito, sandbox).
Nesses casos, **basta instalar só o browser**:

```bash
# 1. Garante que o chromium (e só ele) está no cache
pnpm exec playwright install chromium

# 2. Sobe o dev server (Playwright reusa se já estiver up em :3000)
(pnpm --filter web dev > /tmp/next-dev.log 2>&1 &)

# 3. Roda os E2E (passa --config porque pnpm --filter web muda o cwd)
pnpm test:e2e

# 4. (Opcional) Abre o HTML report
pnpm exec playwright show-report ../../playwright-report
```

**Por que funciona sem `--with-deps`:** as libs do sistema (libnss3, libnspr4,
libatk, etc.) **já estão presentes** na imagem Ubuntu/Debian típica deste host
— última vez que rodamos, o cache já tinha `chromium-1140`, `chromium-1181`,
`-1224`, `-1228`, `-1234` e o binário executa direto (Chromium 130 + Chromium 139
validados via `--version`). O `--with-deps` só instalaria libs que faltassem —
e nada está faltando aqui.

Verificação rápida do binário:

```bash
~/.cache/ms-playwright/chromium-1140/chrome-linux/chrome --version
# → Chromium 130.0.6723.31
ldd ~/.cache/ms-playwright/chromium-1140/chrome-linux/chrome | grep "not found"
# → (vazio = nenhuma dependência faltando)
```

---

### Caminho C — Docker oficial (reproduzibilidade total)

Se o host não tiver nem o bundle (sandbox fechado, sem rede para Playwright
CDN), use a imagem oficial que já vem com **todas** as deps:

```bash
docker run --rm \
  -v "$(pwd):/app" \
  -w /app \
  -e CI=1 \
  mcr.microsoft.com/playwright:v1.48.0-jammy \
  bash -c "pnpm install --frozen-lockfile && pnpm test:e2e"
```

Vantagem: zero instalação local. Custo: precisa Docker e a imagem
(`playwright:v1.48.0-jammy` ≈ 2 GB).

---

## 3. Por que `--with-deps` falhou aqui (referência)

```text
$ pnpm exec playwright install chromium --with-deps
Installing dependencies...
Switching to root user to install dependencies...
sudo: a terminal is required to read the password; either use the -S option
      to read from standard input or configure an askpass helper
sudo: uma senha é necessária
Failed to install browsers
```

O `--with-deps` é uma conveniência: detecta a distro (Debian/Ubuntu/Fedora/Arch)
e roda `apt-get install libnss3 libatk1.0-0 libatk-bridge2.0-0 ...` para cada
browser. Tudo via `sudo`. Sem sudo → falha. **Workaround:** pular o `--with-deps`
e confiar no que já está instalado (que é o caso deste host).

---

## 4. Como reproduzir do zero (sem nenhum browser em cache)

```bash
cd /home/dan/saas/supademo-oss

# 1. Limpa tudo
rm -rf ~/.cache/ms-playwright

# 2. Sem sudo (recomendado)
pnpm exec playwright install chromium

# 3. OU com sudo (em container/VM limpo)
pnpm exec playwright install --with-deps chromium

# 4. Suba dev server + rode E2E
(pnpm --filter web dev > /tmp/next-dev.log 2>&1 &)
sleep 6   # aguarda :3000
pnpm test:e2e
```

---

## 5. Notas sobre CI vs dev

| Ambiente | Comando install | Por quê |
|---|---|---|
| CI (GitHub Actions, root) | `playwright install --with-deps chromium` | runner root → `apt-get` funciona; garante libs de sistema mesmo em imagens Ubuntu limpas |
| Local com sudo | `playwright install --with-deps chromium` | mesmo motivo |
| Local sem sudo (este projeto) | `playwright install chromium` | bundle já tem quase tudo; libs de sistema estão presentes na imagem |

Se um dia o host perder uma lib (raro, mas possível após upgrade de distro),
instale manualmente via usuário (sem `--with-deps`):

```bash
# Tente rodar; se faltar lib, o erro diz qual
~/.cache/ms-playwright/chromium-1140/chrome-linux/chrome --version
# error while loading shared libraries: libfoo.so.0 ...
# → peça ao admin do host para instalar (libfoo)
```

---

## 6. Scripts auxiliares

- `scripts/install-playwright-no-sudo.sh` — script amigável para devs sem sudo.
  Mostra os 3 métodos (sem-deps, Docker, PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD).

---

## 7. Referências

- [Playwright — `install`](https://playwright.dev/docs/browsers#install-browsers)
- [Playwright — Linux deps](https://playwright.dev/docs/browsers#install-system-dependencies)
- [Playwright Docker — `mcr.microsoft.com/playwright`](https://playwright.dev/docs/docker)
- Report de execução real: [`setup-report/PHASE-3-e2e.md`](../../../setup-report/PHASE-3-e2e.md)
- Report desta decisão: [`setup-report/PHASE-11-playwright-deps.md`](../../../setup-report/PHASE-11-playwright-deps.md)
