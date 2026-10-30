# ADR-005: Clerk Pro como provedor de autenticação

- **Status:** Accepted
- **Date:** 2026-10-18
- **Deciders:** Tech lead EasyDemo, Founding engineer

## Context and Problem Statement

EasyDemo é um SaaS B2B multi-tenant. Cada cliente (empresa) é um **workspace**; cada workspace tem 1..N **usuários** com **roles** (owner, admin, editor, viewer). Precisamos de:

1. Login seguro (email + senha, magic link, OAuth Google/Microsoft).
2. **Organizations** nativas (multi-tenant model) — não queremos reinventar.
3. Convite de membros por email com role-based invitation.
4. SSO Enterprise (SAML/OIDC) já incluso para fechar deals enterprise.
5. Webhooks para sincronizar users com nosso Postgres (para FKs e RLS).
6. **Compliance**: SOC2 do vendor, LGPD-friendly.

Restrições:
- Time pequeno: não dá para manter biblioteca própria de auth.
- $25–125/mês é aceitável no orçamento MVP.
- Mercado enterprise exige SSO rápido.

## Decision Drivers

- Organizations nativas (não reinventar tenant model).
- SSO incluso sem pagar WorkOS ($125/mês).
- DX Next.js 15 (App Router) first-class.
- Possibilidade de exportar dados de usuário (anti-lock-in).

## Considered Options

1. **Clerk Pro** ($25/mês até 10k MAU).
2. **Auth.js (NextAuth v5)** self-hosted + DIY organizations.
3. **Lucia** (auth library TS pura, sem UI).
4. **Better-Auth** (TS-first, OAuth + magic link + organizations recente).
5. **WorkOS** (SSO Enterprise puro, sem UI).

## Decision Outcome

**Chosen option: "Clerk Pro"**, porque entrega Organizations + SSO + UI pronta em um único pacote por $25/mês. Construir equivalentemente com Auth.js + Lucia + Better-Auth consumiria ~3 semanas de dev e ainda faltaria SAML.

Plano: **Pro $25/mês** (10k MAU inclusos). Upgrade para Production $0.02/MAU adicional quando passar de 10k.

Componentes usados:
- `<ClerkProvider>` no layout raiz.
- `<OrganizationSwitcher />`, `<UserButton />` na sidebar do admin.
- `auth()` helper em Route Handlers para validar sessão.
- `clerkClient` para criar workspaces na conversão.
- Webhooks `user.created`, `user.updated`, `organizationMembership.*` (Svix) → `/api/webhooks/clerk`.
- Tabela `app.members` espelha `user_id` + `workspace_id` (FK via webhook) — RLS usa `app.current_workspace_id` setado em middleware.

### Positive Consequences

- SSO SAML/OIDC incluso sem custo extra (Pro).
- UI completa: signin/signup/magic-link/2FA/org switcher prontos.
- Webhooks maduros (Svix) com retry, signing secret.
- Permite export de user data via API (anti-lock-in documentado).
- Multi-region (UE disponível) atende LGPD art. 33.
- Compliance SOC2 Type II, HIPAA, GDPR.

### Negative Consequences

- **Custo recorrente** (R$ 150/mês fixo) — aceitável mas presente.
- Vendor lock-in: trocar de auth requer reescrever fluxo de login e re-vincular contas.
- Clerk armazena dados de usuário — exige DPA assinado (já temos template em `legal/dpa-clerk.pdf`).
- Customização visual limitada sem plano Enterprise (CSS overrides funcionam, mas theming profundo exige plano maior).

### Follow-ups

- **Backup mensal**: exportar todos os `user_id` + email hash para R2 (criptografado) — script em `scripts/export-clerk-users.sh`.
- Documentar migração de saída em `docs/runbooks/auth-migration.md` (usando Clerk SDK + bcrypt fallback).
- Configurar MFA obrigatório para roles `owner` e `admin` (config via Clerk Dashboard).

## Pros and Cons of the Options

### Clerk Pro (escolhido)

- Good, Organizations + SSO + UI em 1 vendor.
- Good, $25/mês inclui SAML.
- Good, SOC2 Type II + DPA assinado.
- Good, SDK Next.js 15 first-class.
- Bad, custo fixo presente.
- Bad, lock-in moderado.

### Auth.js (NextAuth v5)

- Good, open-source, self-hosted, custo zero.
- Good, integra com qualquer provider OAuth.
- Bad, **sem Organizations** — teríamos que modelar manualmente.
- Bad, sem SSO Enterprise.
- Bad, UI tem que ser construída (1–2 semanas).
- Bad, adapter Postgres custom necessário.

### Lucia

- Good, TypeScript puro, leve, didático.
- Good, controle total.
- Bad, lib de **baixo nível** — não tem UI nem Organizations.
- Bad, exige escrever sessions, cookies, OAuth flows manualmente.
- Bad, autora anunciou pausa no projeto em 2024 — risco de manutenção.

### Better-Auth

- Good, TypeScript-first, suporta Organizations e SSO (recente).
- Good, open-source, self-hosted.
- Neutral, comunidade crescendo rápido.
- Bad, ecossistema ainda pequeno (< 100 stars em maio/2025).
- Bad, integrações com provedores específicos (Resend, Stripe) ainda incompletas.
- Bad, falta SAML maduro.

### WorkOS

- Good, SSO + Directory Sync enterprise.
- Good, SOC2, BAA disponível.
- Bad, **não tem login de consumidor** (só SSO). Teria que combinar com Clerk/Auth.js.
- Bad, $125/mês mínimo.
- Bad, UI de sign-in tem que ser construída.

## References

- [Clerk pricing](https://clerk.com/pricing)
- [Clerk Organizations docs](https://clerk.com/docs/organizations/overview)
- [Clerk webhooks (Svix)](https://clerk.com/docs/integrations/webhooks)
- [Auth.js v5](https://authjs.dev/)
- [Better-Auth](https://www.better-auth.com/)
- RFC EasyDemo §2.2 — escolha de auth
- `research/tech/backend-stack.md` §4 — auth comparison