## Descrição

<!-- Resumo do que este PR faz (1-3 bullets). -->

## Tipo de mudança

- [ ] Bug fix (correção de comportamento defeituoso)
- [ ] Nova feature (adição de funcionalidade)
- [ ] Refactor (mudança que não corrige bug nem adiciona feature)
- [ ] Docs (mudança apenas em documentação)
- [ ] Build / CI (mudança em pipeline)
- [ ] Security (mudança com implicação de segurança)

## Issue relacionada

Closes #(issue) / Fixes #(issue) / Refs #(issue)

## Como testar

<!-- Passo-a-passo para validar manualmente. -->

1.
2.
3.

## Checklist

- [ ] `pnpm lint` passa
- [ ] `pnpm typecheck` passa
- [ ] `pnpm test` passa (vitest + Playwright se UI mudou)
- [ ] `pnpm test:rls` passa (se mexer em schema/RLS)
- [ ] Documentação atualizada (se mudar comportamento público)
- [ ] i18n atualizado (mensagens em PT-BR e EN, sem keys novas)
- [ ] Não quebra LGPD (consent, DSR, RLS, retenção)
- [ ] Não mexe em billing sem aprovação explícita
- [ ] Commit messages seguem Conventional Commits

## Screenshots / Logs

<!-- Se aplicável. -->

## Breaking changes?

- [ ] Não
- [ ] Sim — descreva:

## Riscos conhecidos

<!-- O que pode quebrar após merge. -->
