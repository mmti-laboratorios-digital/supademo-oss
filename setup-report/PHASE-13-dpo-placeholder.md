# 📋 Phase 13 — Placeholder DPO — EasyDemo

> **Sumário da Mission 13 (preenchimento de placeholder de DPO +
> documentos jurídicos pendentes)**, executada em **18/Out/2026** como
> parte do trabalho pré-publicação jurídica da EasyDemo.
>
> **Status**: 🟡 **Estrutura criada — placeholders ativos por
> design**. A contratação formal do DPO é responsabilidade do
> **usuário humano** (sócios da EasyDemo LTDA), não do subagente.

---

## 1. Contexto

A EasyDemo é um SaaS de demos interativas que trata dados pessoais
de múltiplas categorias (creators, leads, visitantes). A LGPD
(Lei 13.709/2018) art. 41 obriga **todo agente de tratamento** a
nomear um **Encarregado de Proteção de Dados** (comumente chamado
**DPO**, nomenclatura herdada do GDPR).

A ausência de nomeação válida é infração administrativa
sancionável pela ANPD. Até a contratação formal do DPO, a EasyDemo
**não pode publicar a política de privacidade** com nome/e-mail
pessoal inventados — daí o uso de **placeholders honestos**:

- `placeholder@easydemo.io` (canal de e-mail com encaminhamento
  para a liderança)
- `DPO_NAME_AQUI`, `[NOME_DO_DPO]`, `{nome_do_DPO}` (para nome)

Esta phase documenta **o que foi entregue** e **o que o usuário
humano precisa fazer** quando o DPO for contratado.

---

## 2. Inventário de artefatos entregues

| # | Arquivo | Tipo | Estado |
|---|---------|------|--------|
| 1 | `legal/DPO.md` | Documento novo | 🟢 Criado |
| 2 | `legal/DPO-PROCESS.md` | Documento novo | 🟢 Criado |
| 3 | `legal/privacy-policy.md` | Doc atualizado (§1, §11 + §7.1, §9) | 🟢 Atualizado |
| 4 | `legal/dpa-data-processing-agreement.md` | Doc atualizado (§8.3, §9.1, §12) | 🟢 Atualizado |
| 5 | `legal/dsr-endpoint-policy.md` | Doc atualizado (§2.2, §9) | 🟢 Atualizado |
| 6 | `legal/cookie-policy.md` | Doc atualizado (§7) | 🟢 Atualizado |
| 7 | `legal/subprocessors-list.md` | Doc atualizado (§6) | 🟢 Atualizado |
| 8 | `legal/incident-response-plan.md` | Doc atualizado (§2, §7.4, §8.4) | 🟢 Atualizado |
| 9 | `legal/terms-of-service.md` | Doc atualizado (§3.3, anexo) | 🟢 Atualizado |
| 10 | `legal/RTBF-template.md` | Doc atualizado (§C template + §D) | 🟢 Atualizado |
| 11 | `legal/RTBF-data-export-schema.json` | Schema atualizado (`next_steps.contact_dpo`) | 🟢 Atualizado |
| 12 | `legal/README.md` | Índice atualizado (DPO.md, DPO-PROCESS.md, LGPD art. 37) | 🟢 Atualizado |
| 13 | `scripts/check-dpo-missing.ts` | Script de verificação | 🟢 Criado |
| 14 | `.github/workflows/ci.yml` | Workflow CI com novo job `check-dpo-placeholders` | 🟢 Atualizado |
| 15 | `package.json` | Script `scripts:check-dpo` adicionado | 🟢 Atualizado |
| 16 | `setup-report/PHASE-13-dpo-placeholder.md` | Este relatório | 🟢 Criado |

**Total**: 16 artefatos atualizados/criados.

---

## 3. Quem preenche quando o DPO for contratado (usuário humano)

> ⚠️ **Esta seção é para o usuário humano**, não para o subagente.
> O subagente **NÃO** pode preencher nomes de pessoas físicas por
> restrição ética/legal.

### 3.1 Quem

- **Sócios / CEO** da EasyDemo LTDA — aprovam a contratação.
- **CTO** — acompanha o onboarding técnico do DPO.
- **DPO contratado** — após assinatura do contrato.

### 3.2 Quando

- **Fase 3** do processo descrito em
  [`DPO-PROCESS.md`](../legal/DPO-PROCESS.md) §3.
- **Imediatamente após assinatura do contrato** com o DPO.
- **Antes** de publicar a política de privacidade e remover o status
  "Modelo (rascunho)" dos documentos.

### 3.3 Por quê

- LGPD art. 41 obriga nomeação válida.
- ANPD exige identificação nominal do encarregado.
- Titulares têm direito a saber com quem se comunicar (LGPD
  art. 41, §1º).
- Clientes B2B (DPA) precisam de ponto focal claro para auditoria.

---

## 4. Como preencher quando o DPO for contratado

### 4.1 Substituição programática (script search-and-replace)

Após a contratação, rode os comandos abaixo a partir da raiz do
repositório. Eles localizam todos os placeholders restantes nos
docs jurídicos e listam cada ocorrência com arquivo + linha.

```bash
# 1. Listar todos os placeholders restantes
pnpm exec tsx scripts/check-dpo-missing.ts

# 2. Substituição global — substitua os placeholders pelo valor real
#    SUBSTITUA:
#      NOME_DO_DPO_REAL           → nome completo do DPO
#      email.real@dpo.com.br      → e-mail real do DPO
#    nos comandos abaixo

# Padrão 1: placeholder@easydemo.io → email.real@dpo.com.br
grep -rl 'placeholder@easydemo\.io' legal/ \
  | grep -vE '(DPO\.md|DPO-PROCESS\.md|ADVOGADO-CHECKLIST\.md|CHANGELOG-DPO\.md|README\.md)' \
  | xargs sed -i 's|placeholder@easydemo\.io|email.real@dpo.com.br|g'

# Padrão 2: {nome_do_DPO} → nome real
grep -rl '{nome_do_DPO}' legal/ \
  | xargs sed -i 's|{nome_do_DPO}|NOME_DO_DPO_REAL|g'

# Padrão 3: [NOME_DO_DPO] → nome real (se usado em qualquer doc)
grep -rl '\[NOME_DO_DPO\]' legal/ \
  | xargs sed -i 's|\[NOME_DO_DPO\]|NOME_DO_DPO_REAL|g'

# 3. Verificar se sobrou algum placeholder
pnpm exec tsx scripts/check-dpo-missing.ts
# Saída esperada: ✅ ... nenhum placeholder DPO pendente.
```

> ⚠️ **Cuidado**: o primeiro comando exclui intencionalmente os
> arquivos `DPO.md`, `DPO-PROCESS.md`, `ADVOGADO-CHECKLIST.md`,
> `CHANGELOG-DPO.md` e `README.md` — eles contêm referências
> **históricas** ao placeholder e devem manter a memória do
> processo. Após a substituição, esses arquivos podem ser editados
> manualmente para registrar a transição (ex.: em
> `CHANGELOG-DPO.md` §1).

### 4.2 Edição manual (opcional, mas recomendada)

Mesmo após o script, faça as edições manuais abaixo:

#### a) `legal/privacy-policy.md` §11

Substitua o bloco "Status atual" por:

```markdown
## 11. Encarregado de Proteção de Dados (DPO)

- **Nome**: NOME_DO_DPO_REAL
- **E-mail**: email.real@dpo.com.br
- **Telefone**: +55 (XX) XXXXX-XXXX *(opcional)*
- **CPF**: XXX.XXX.XXX-XX *(sigiloso, visível apenas à ANPD)*
- **Página pública**: https://www.easydemo.io/dpo
- **Formulário DSR**: https://app.easydemo.io/privacidade/solicitacao

**Histórico de nomeações:**

| Período | Encarregado | Observação |
|---------|-------------|------------|
| DD/MMM/AAAA → atual | NOME_DO_DPO_REAL | Primeira nomeação formal (LGPD art. 41) |

O encarregado é o canal oficial de comunicação entre a EasyDemo, os
titulares e a **ANPD (Autoridade Nacional de Proteção de Dados)**.
```

#### b) `legal/CHANGELOG-DPO.md` §4

Substitua o placeholder `_a definir_` pelo nome real do DPO:

```
| **Encarregado (DPO)** | NOME_DO_DPO_REAL | (em construção) |
```

E adicione uma nova entrada em §1 Histórico de versões:

```
| **v1.0** | DD/MMM/AAAA | NOME_DO_DPO_REAL + CEO | Substituição de placeholders DPO por nome real. Publicação oficial. | DD/MMM/AAAA+6m |
```

#### c) `legal/README.md` §Contato

Substitua o placeholder pela entrada definitiva:

```
- **Encarregado/DPO**: NOME_DO_DPO_REAL — email.real@dpo.com.br
```

E remova a nota "PENDENTE de contratação formal".

#### d) Página `https://www.easydemo.io/dpo`

Publicar a página com:

- Nome do DPO.
- E-mail.
- Como exercer direitos (link para formulário público).
- Histórico de nomeções.

#### e) Comunicação à ANPD

Preencher o formulário de comunicação de nomeação de encarregado
disponível em https://www.gov.br/anpd/ (quando habilitado).

---

## 5. O que muda após contratar (checklist pós-substituição)

```
[ ] Script search-and-replace executado (ver §4.1)
[ ] `legal/privacy-policy.md` §11 editado manualmente (ver §4.2a)
[ ] `legal/CHANGELOG-DPO.md` §4 + §1 atualizados (ver §4.2b)
[ ] `legal/README.md` §Contato atualizado (ver §4.2c)
[ ] `https://www.easydemo.io/dpo` publicada (ver §4.2d)
[ ] Comunicação à ANPD enviada (ver §4.2e)
[ ] `pnpm exec tsx scripts/check-dpo-missing.ts` retorna exit 0
[ ] CI verde (job `check-dpo-placeholders` passa)
[ ] Treinamento inicial da equipe pelo DPO agendado
[ ] Primeiro reporte mensal programado (DPO-PROCESS.md §4.1)
```

---

## 6. Honestidade sobre o que NÃO foi feito (e por quê)

O subagente que executou esta mission **NÃO**:

- ❌ Inventou nome de pessoa para o DPO.
- ❌ Inventou CPF para o DPO.
- ❌ Inventou OAB para o DPO.
- ❌ Publicou os documentos com status "Vigente" (continuam como
  "Modelo (rascunho)").
- ❌ Comunicou nomeação à ANPD em nome da EasyDemo (responsabilidade
  legal do controlador).
- ❌ Substituiu o placeholder por nome real (responsabilidade do
  usuário humano).

O subagente **FEZ**:

- ✅ Criou **estrutura documental honesta** com placeholders
  rastreáveis.
- ✅ Documentou **personas profissionais** (não pessoas) com
  critérios objetivos de seleção.
- ✅ Documentou **processo de contratação** em 4 fases + checklist
  de onboarding.
- ✅ Documentou **SLAs** do DPO (DSR, ANPD, treinamento, reporte).
- ✅ Substituiu `dpo@easydemo.io` por `placeholder@easydemo.io`
  em **9 documentos** (privacy-policy, dpa, dsr, cookie,
  subprocessors, incident-response, terms-of-service, rtbf-template,
  rtbf-data-export-schema.json).
- ✅ Criou **script de CI** que bloqueia publicação com
  placeholders residuais.
- ✅ Integrou o script ao CI workflow.
- ✅ Documentou este relatório (PHASE-13) com instruções claras
  para o usuário humano pós-contratação.

---

## 7. Validação do entregável

Comandos executados para validar:

```bash
$ pnpm exec tsx scripts/check-dpo-missing.ts
❌ check-dpo-missing: 24 placeholder(s) DPO pendente(s) em 16 arquivo(s) verificado(s).
EXIT_CODE=1

$ pnpm exec tsx scripts/check-dpo-missing.ts --json | jq .ok
false
```

**Resultado esperado**:

- ✅ Exit code `1` quando placeholders ativos (CI falha — comportamento
  correto, força substituição antes da publicação).
- ✅ Exit code `0` após o usuário humano substituir todos os
  placeholders (CI passa — pronto para publicação).

O script também cobre:

- ✅ Detecção de `placeholder@easydemo.io` em `.md` e `.json`.
- ✅ Detecção de `DPO_NAME_AQUI`, `DPO_NAME`, `[NOME_DO_DPO]`,
  `{nome_do_DPO}` (case-sensitive e case-insensitive).
- ✅ Whitelist para arquivos históricos (`DPO.md`, `DPO-PROCESS.md`,
  `ADVOGADO-CHECKLIST.md`, `CHANGELOG-DPO.md`, `README.md`).
- ✅ Saída em modo texto (legível) e JSON (programático).
- ✅ Exit code 2 para erros de configuração (pasta ausente, etc.).
- ✅ Reporta arquivo + linha + contexto de cada placeholder.

---

## 8. Próximas ações (responsabilidade do usuário humano)

1. **Curto prazo** (esta semana): revisar `legal/DPO.md` e
   `legal/DPO-PROCESS.md` com o time interno.
2. **Médio prazo** (até 90 dias da publicação): conduzir Fase 0 a
   Fase 3 do processo de contratação
   ([`DPO-PROCESS.md`](../legal/DPO-PROCESS.md) §1).
3. **Logo após contratação**:
   - Executar §4.1 (substituição programática).
   - Executar §4.2 (edições manuais).
   - Validar §5 (checklist pós-substituição).
   - Comunicar nomeação à ANPD.
4. **Após publicação**: DPO assume o ciclo operacional conforme
   [`DPO-PROCESS.md`](../legal/DPO-PROCESS.md) §3 (workflow de
   comunicação interna) e §4 (política de reporte).

---

## 9. Apêndice — Glossário

| Termo | Significado |
|-------|-------------|
| **DPO** | Data Protection Officer — nomenclatura herdada do GDPR; equivalente ao Encarregado (LGPD art. 41) |
| **Encarregado** | Tradução oficial da LGPD para DPO; pessoa física ou jurídica nomeada pelo agente de tratamento |
| **LGPD** | Lei Geral de Proteção de Dados (Lei 13.709/2018) |
| **ANPD** | Autoridade Nacional de Proteção de Dados — regulador federal |
| **DSR** | Data Subject Request — pedido do titular de exercer um dos 10 direitos do art. 18 |
| **DPIA / RIPD** | Relatório de Impacto à Proteção de Dados (LGPD art. 38) |
| **Placeholder** | Valor temporário em documento, claramente marcado, a ser substituído quando a informação real estiver disponível |
| **Whitelist** | Lista de arquivos isentos da verificação automática (uso intencional do placeholder) |

---

```
Última atualização: 18/Out/2026
Status: Relatório de execução — artefatos prontos, aguardando
contratação formal do DPO pelo usuário humano
Versão: 0.1.0
```