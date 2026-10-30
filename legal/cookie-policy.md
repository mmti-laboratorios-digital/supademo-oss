# Política de Cookies — EasyDemo

> Este documento descreve os cookies e tecnologias similares usadas
> pela EasyDemo no player público, no painel admin e nos sites de marketing.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. O que são cookies?

Cookies são **pequenos arquivos de texto** que um site armazena no
seu navegador quando você o visita. Eles permitem que o site "lembre"
de você entre requisições ou entre visitas.

Também usamos **tecnologias similares**:
- **LocalStorage** (HTML5 storage local — maior capacidade).
- **SessionStorage** (limpa ao fechar a aba).
- **IndexedDB** (banco de dados do navegador).

Cookies podem ser **de primeira-parte** (definidos por `*.easydemo.io`)
ou **de terceiros** (definidos por outros domínios).

---

## 2. Quais categorias usamos?

| Categoria | Obrigatório? | Como desabilitar |
|-----------|--------------|------------------|
| **Essencial** (sessão, autenticação, segurança) | ✅ Sim, sem eles o serviço não funciona | Não pode ser desativado, mas você pode deslogar/limpar sessão no seu navegador |
| **Analytics** (métricas agregadas de uso, LGPD-safe) | ❌ Não | Banner de opt-out no primeiro acesso; depois, clique em "Configurar cookies" no rodapé do site |
| **Preferências** (idioma, tema) | ❌ Não | Limpar cookies do navegador |
| **Marketing** | ❌ **Não usamos** | — |

> A EasyDemo **não usa cookies de publicidade comportamental** de
> terceiros (Meta Pixel, Google Ads, LinkedIn Insight, etc.).

---

## 3. Lista detalhada de cada cookie

> Os valores abaixo refletem o desenho atual do produto (consultar
> o engenheiro antes de publicar — pode variar entre ambientes).

### 3.1 Cookies essenciais

| Nome | Domínio | Duração | Finalidade | Tipo |
|------|---------|---------|-----------|------|
| `__session` | `app.easydemo.io` | Sessão (até fechar o navegador) | Identificar a sessão do usuário logado; prevenir CSRF | 1ª parte |
| `__refresh` | `app.easydemo.io` | 30 dias rolling | Refresh token de sessão (rotacionado a cada uso) | 1ª parte |
| `__cf_bm` | `*.easydemo.io` | 30 min | Cloudflare Bot Management — distinguir humanos de bots | 1ª parte (Cloudflare) |
| `__stripe_mid` (legado) | `app.easydemo.io` | 1 ano | Token antifraude caso Stripe seja usado em integrações específicas | 3ª parte |

### 3.2 Cookies de analytics

| Nome | Domínio | Duração | Finalidade | Tipo |
|------|---------|---------|-----------|------|
| `_pk_id.*` | `app.easydemo.io` | 30 dias | Identificador anônimo de visitante (PostHog, hash) | 1ª parte |
| `_pk_ses.*` | `app.easydemo.io` | 30 min | Sessão ativa de analytics | 1ª parte |
| `ph_phc_*` | `app.easydemo.io` | 1 ano | Identificador PostHog (LocalStorage) | 1ª parte |

> ⚠️ Estes cookies são **definidos pela EasyDemo para o nosso próprio
> analytics**. Não compartilhamos com terceiros. O opt-out via banner
> impede o seu registro.

### 3.3 Cookies de preferências

| Nome | Domínio | Duração | Finalidade | Tipo |
|------|---------|---------|-----------|------|
| `locale` | `app.easydemo.io` | 1 ano | Idioma preferido (PT-BR ou EN) | 1ª parte |
| `theme` | `app.easydemo.io` | 1 ano | Tema (claro/escuro) | 1ª parte |
| `cookie_consent_v1` | `*.easydemo.io` | 1 ano | Armazena sua escolha no banner (essencial/essential=true + analytics=true/false) | 1ª parte |

### 3.4 Cookies de marketing

> **Não usamos**. Lista intencionalmente vazia.

### 3.5 Cookies de terceiros eventualmente recebidos

Quando você incorpora um demo via **iframe de terceiros** (ex.: numa
página da nossa landing page em WordPress), o site hospedeiro pode
definir seus próprios cookies. Esses cookies são controlados pelo
**site hospedeiro**, não pela EasyDemo.

---

## 4. Como gerenciar suas preferências

### 4.1 Banner de cookies

No primeiro acesso ao player público (`/d/[slug]`) ou à landing page,
um banner pergunta:

- 🍪 **Aceitar todos**: habilita essenciais + analytics.
- 🔒 **Apenas essenciais**: desabilita analytics.
- ⚙️ **Configurar**: granularidade por categoria.

Sua escolha é salva em `cookie_consent_v1` por 1 ano. Pode mudar
quando quiser clicando em "Configurar cookies" no rodapé do site.

### 4.2 Configuração do navegador

Você pode desabilitar cookies de forma geral ou seletiva no seu
navegador. Veja como nos principais navegadores:

- **Chrome**: `Configurações > Privacidade e segurança > Cookies`
- **Firefox**: `Preferências > Privacidade e Segurança > Cookies`
- **Safari**: `Preferências > Privacidade > Cookies e dados de sites`
- **Edge**: `Configurações > Cookies e permissões de site`

> ⚠️ Atenção: desabilitar cookies essenciais **impede** o
> funcionamento do login e de recursos protegidos do player.

### 4.3 Modo de navegação anônima

Usar navegação anônima/privativa **não desabilita** nossos cookies
de analytics, mas os mesmos são descartados ao fim da sessão.

### 4.4 DNT / GPC

A EasyDemo respeita os sinais **DNT** (Do Not Track) e **GPC** (Global
Privacy Control) enviados pelo seu navegador — se presentes,
desabilitamos analytics automaticamente, sem precisar do banner.

---

## 5. Por que usamos cookies?

A LGPD (art. 5º, III, c) equipara cookies a "dados pessoais" quando
permitem identificação, mesmo que indireta. Por isso, cada uso precisa
de **base legal específica**:

| Cookie | Finalidade | Base legal (LGPD art. 7º) |
|--------|-----------|---------------------------|
| Essenciais | Operação técnica do serviço | (b) Execução de contrato (art. 7º, V) |
| Analytics | Métricas agregadas, sem PII | (a) Consentimento (art. 7º, I) — opt-in via banner |
| Preferências | Conforto do usuário (idioma, tema) | (a) Consentimento (art. 7º, I) |

> **Paralelo GDPR**: a Diretiva ePrivacy (2002/58/CE) e o GDPR
> art. 5º, 3º regulam o mesmo tema. O banner da EasyDemo é compatível
> com os requisitos da **ePrivacy Directive** e dos princípios do
> GDPR sobre consentimento (art. 7º GDPR).

---

## 6. Mudanças nesta política

Quando alterarmos esta política:
- Publicamos a versão atualizada nesta URL, com nova data no rodapé.
- Mudanças **substanciais** (ex.: novo subprocessador) são avisadas
  no banner de cookies no próximo acesso.
- Versões anteriores em `https://www.easydemo.io/cookies/historico`.

---

## 7. Contato

- **E-mail do DPO** (placeholder funcional enquanto a nomeação
  formal não é concluída): `placeholder@easydemo.io`
- **Formulário DSR**: `https://app.easydemo.io/privacidade/solicitacao`
- **Página de configurações**: clique em "Configurar cookies" no
  rodapé do site.

> Cronograma de contratação do DPO: até 90 dias da publicação desta
> política. Ver [`DPO-PROCESS.md`](./DPO-PROCESS.md).

---

## Anexo — Mapeamento rápido

```
┌──────────────────────────────────┐
│      Landing page                │
│  Cookies: session, theme,        │
│  cookie_consent_v1               │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│      Player público (/d/[slug]) │
│  Cookies: session (se logado),  │
│  _pk_id, _pk_ses, ph_phc,       │
│  locale, theme, consent_v1,     │
│  __cf_bm                        │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│      Painel admin (logado)      │
│  Cookies: session, refresh,     │
│  __cf_bm, theme, locale         │
└──────────────────────────────────┘
```

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
EasyDemo LTDA — CNPJ XX.XXX.XXX/0001-XX
```
