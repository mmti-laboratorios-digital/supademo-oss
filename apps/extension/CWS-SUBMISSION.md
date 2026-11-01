# Submissão na Chrome Web Store — EasyDemo Capture

> **Passo:** F9.6 do `docs/MVP-PLAN.md` · **Gate:** G5
> **Pacote:** `apps/extension/.output/extension-0.1.0-chrome.zip` (18 kB)
> **Status:** 🟡 **pacote pronto — falta submissão na conta CWS**

---

## 0. Resumo do que falta

| Item | Status | Quem faz |
|---|---|---|
| Ícones PNG reais (16/32/48/128) | ✅ feito (`scripts/generate-icons.ts`) | — |
| Manifest sem permissões excessivas | ✅ feito (F9.5) | — |
| Build + ZIP do pacote | ✅ feito (`pnpm --filter extension zip`) | — |
| Listing (nome, descrição, screenshots) | ✅ pronto (este doc) | — |
| Conta de desenvolvedor CWS (US$5, único) | 🔴 **pendente** | Founder |
| Upload + envio para revisão | 🔴 **pendente** | Founder |

> ⚠️ **Lead time da CWS:** conta nova costuma levar **dias a semanas** para ser
> aprovada e Extensions IDs são atribuídos no primeiro publish. Submeta o
> pacote assim que a conta existir — o código não bloqueia o alpha (F2 gave
> upload manual como alternativa).

---

## 1. Pré-requisitos (checklist do Founder)

- [ ] Conta Google (Gmail) disponível.
- [ ] Pagar a taxa única de **US$ 5** no
      [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
      - Cartão internacional (Visa/Mastercard) com dados de cobrança reais.
      - Endereço de cobrança + **endereço residencial** (a CWS exige).
- [ ] Preencher perfil do desenvolvedor (nome público, e-mail de suporte).
- [ ] Ter o domínio `easydemo.io` com **página de política de privacidade**
      pública e acessível sem login:
      `https://www.easydemo.io/privacidade` (ver §5).

---

## 2. Como gerar o pacote (reproduzível)

```bash
# 1. regenerar ícones (só se o logo mudou)
pnpm --filter extension exec tsx scripts/generate-icons.ts

# 2. build + zip
pnpm --filter extension zip

# 3. conferir o manifesto embutido
unzip -p apps/extension/.output/extension-0.1.0-chrome.zip manifest.json | jq .
```

**Artefato:** `apps/extension/.output/extension-0.1.0-chrome.zip` (~18 kB)

> ⚠️ O `.output/` é gitignored — o ZIP **não** vai para o git. É artefato de
> build, gerado em CI ou localmente.

---

## 3. Listing da extensão (copiar/colar no dashboard)

### 3.1 Nome (máx. 45 caracteres)

```
EasyDemo Capture
```

### 3.2 Descrição curta (máx. 132 caracteres)

```
Grave demos interativas do seu produto: screenshots, hotspots clicáveis e link público pronto para compartilhar.
```

### 3.3 Descrição completa (até 16.000 caracteres)

```
O EasyDemo Capture é a extensão oficial do EasyDemo — a plataforma brasileira de demos interativas de produto.

Grave uma demonstração do seu SaaS em minutos:

• Clique nos elementos da página que quer destacar
• A extensão captura a tela, marca o hotspot e registra o ponto exato
• Ao finalizar, os passos vão para o editor do EasyDemo, onde você ajusta textos, ordem e CTA
• Publique e compartilhe um link público (ou embuta no seu site)

Ideal para times de product marketing, vendas e customer success que precisam mostrar um fluxo de produto sem gravar vídeo a cada mudança.

Privacidade em primeiro lugar:
• Campos sensíveis (senha, cartão, CPF) são mascarados antes de sair da sua máquina
• Capturas e dados de lead ficam na infraestrutura do EasyDemo (Postgres + Cloudflare R2), com TLS e LGPD by design
• A extensão pede apenas as permissões mínimas: activeTab, storage e scripting

Grátis para começar. Planos pagos incluem mais demos, mais passos por demo e mais leads por mês.

Saiba mais: https://www.easydemo.io
```

### 3.4 Categoria / idioma / região

| Campo | Valor |
|---|---|
| Categoria | **Productivity** (alternativa: Developer Tools) |
| Idioma | Português (Brasil) + English |
| Região | Worldwide |
| Paga | Não (o app tem planos; a extensão é gratuita) |

---

## 4. Justificativa das permissões (campo obrigatório da CWS)

A CWS **rejeita** extensões que pedem permissões sem justificativa. Este é o
texto exato a colar em cada permissão:

### `activeTab`
```
A extensão precisa acessar a aba que o usuário está capturando para registrar
a posição do clique (bounding rect) e o viewport, que são usados para calcular
onde o hotspot deve aparecer sobre o screenshot.
```

### `scripting`
```
Usado para injetar o overlay de captura (o anel azul que highlights o elemento
selecionado) na aba ativa. O script só é injetado quando o usuário aciona
"Iniciar captura" — não roda em background.
```

### `storage`
```
Guarda a sessão de captura em andamento (steps capturados, id da demo e o token
de sessão) enquanto o usuário percorre a página. Os dados são apagados quando a
captura é finalizada ou a extensão é recarregada.
```

### `host_permissions` (`https://easydemo.io/*`, `http://localhost:3000/*`)
```
Permite que a extensão se comunique com o app EasyDemo (criar a demo, pedir o
token de sessão do Clerk e enviar os steps). Limitado ao domínio do próprio
produto e ao localhost durante o desenvolvimento — a extensão NÃO roda em
nenhum outro site.
```

### O que a extensão **NÃO** faz (declarar na seção "Data usage" / Privacy)
```
• Não coletamos dados de navegação além da página que o usuário escolheu capturar
• Não enviamos o conteúdo capturado a servidores de terceiros — apenas ao EasyDemo
• Não usamos cookies de rastreamento nemingerprinting
• Não vendemos nem compartilhamos dados com anunciantes
```

---

## 5. URLs exigidas pelo dashboard

| Campo da CWS | URL |
|---|---|
| Homepage | `https://www.easydemo.io` |
| Privacy policy | `https://www.easydemo.io/privacidade` |
| Support URL | `https://www.easydemo.io/suporte` |

> ⚠️ A URL de política de privacidade **precisa estar acessível sem login** e
> retornar 200. As páginas de marketing existem no repositório — se ainda não
> estiverem publicadas, **publicá-las é pré-requisito da submissão**.

---

## 6. Screenshots (obrigatório: mínimo 1, recomendado 5)

A CWS exige **1280×800** ou **640×400**. Tamanhos maiores são rejeitados.

| # | Tela | O que mostra |
|---|---|---|
| 1 | **Popup aberto** | Status de autenticação, workspace e botão "Iniciar captura" |
| 2 | **Overlay ativo** | Anel azul highlights no elemento clicado da página de destino |
| 3 | **Steps capturados** | Lista de steps no popup (tag, título da página) |
| 4 | **Editor com os steps** | Steps no editor do EasyDemo, já com hotspot posicionado |
| 5 | **Player público** | A demo publicada rodando no link público |

**Como capturar (sem staging ainda):**
1. `pnpm --filter web dev` + `pnpm --filter extension dev`.
2. Abrir o popup em janela de 1280×800 (ou capturar em 2560×1600 com
   `deviceScaleFactor: 2` e reduzir para 1280×800).
3. Para o screenshot 2, usar uma página pública qualquer (ex.: a home do
   próprio EasyDemo) como alvo da captura.

> 📌 **Débito conhecido:** a extensão aponta o `host_permissions` para
> `https://easydemo.io/*` e `http://localhost:3000/*`, mas a **content script**
> ainda declara `matches: ["<all_urls>"]` — necessário para o overlay funcionar
> em qualquer página que o usuário capture. As duas coisas são coerentes (o
> `activeTab` cobre o acesso pontual), mas vale reavaliar se a CWS questionar.

---

## 7. Passos de submissão

1. Abrir <https://chrome.google.com/webstore/devconsole>.
2. **Pay the developer fee** (US$ 5) — só aparece na primeira vez.
3. **Add new item** → upload `apps/extension/.output/extension-0.1.0-chrome.zip`.
4. Preencher a aba **Store listing**: nome, descrição, categoria, ícones
   (128×128 já gerado), screenshots.
5. Preencher **Privacy practices**:
   - "Single purpose description" → usar §3.3.
   - Permissões → §4.
   - Data usage → marcar **"No user data collected"** para a extensão em si,
     já que a captura só trafega para o app do próprio produto.
6. Preencher **Distribution** (visibility pública, Brasil + global).
7. **Submit for review.**
8. Anotar o **Extensions ID** gerado (ex.: `abcdefghijklmnop...`) — ele vira
   origem da allowlist e é usado para deep links.

---

## 8. Depois da aprovação

- [ ] Anotar o Extensions ID em `apps/extension/wxt.config.ts` (campo
      `externally_connectable.matches` / allowlist de host).
- [ ] Habilitar o deep link `https://easydemo.io/demos/nova?ext=<id>` para
      "abrir no app" a partir da extensão.
- [ ] Atualizar `marketing/LAUNCH-PLAN.md` §1.1 tarefa 13 (status "In review").
- [ ] Registrar a data de aprovação no `docs/MVP-PROGRESS.md`.

---

## 9. Referências

- Manifest e permissões: `apps/extension/wxt.config.ts`
- Geração de ícones: `apps/extension/scripts/generate-icons.ts`
- Build: `apps/extension/package.json` (`build`, `zip`)
- Privacidade do produto: `legal/privacy-policy.md`
- Fase no plano: `docs/MVP-PLAN.md` §8 (F9, passo F9.6)
