# 📜 Documentação Jurídica — DemoBR

> Pasta de modelos de documentos jurídicos do produto **DemoBR**.
> Estes arquivos são **modelos (templates)** traduzidos a partir do
> `docs/SECURITY-MODEL.md`, da RFC, do modelo de banco e do stack técnico.
> **Não constituem aconselhamento jurídico.**

---

## ⚠️ Disclaimer importante

```
ESTES DOCUMENTOS SÃO MODELOS GERADOS EM 2026-10-18.
BASE LEGAL: LGPD (Lei 13.709/2018), com referências paralelas ao GDPR (Reg.
UE 2016/679) quando o precedente internacional ajuda na interpretação.

ELES FORAM ELABORADOS POR PESSOA LEIGA COM BASE NO CONHECIMENTO TÉCNICO
E OPERACIONAL DO PRODUTO. TRADUZEM O QUE SABEMOS SOBRE O PRODUTO, MAS
NÃO SUBSTITUEM REVISÃO POR ADVOGADO HABILITADO.

ANTES DE PUBLICAR QUALQUER DOCUMENTO DESTA PASTA EM PRODUÇÃO:
  1. Contrate um(a) advogado(a) especializado(a) em proteção de dados
     (inscrição OAB ativa, idealmente com experiência em LGPD).
  2. Forneça contexto completo do produto, desta pasta, e do stack
     (NEXT-CLERK-ASAAS-HETZNER-CLOUDFLARE-RESEND-SENTRY-POSTHOG).
  3. Ajuste dados cadastrais (CNPJ, endereço, razão social) com base
     no contrato social real da DemoBR LTDA.
  4. Adapte cláusulas conforme decisões estratégicas (foro, jurisdição,
     política de reembolso, modelos de pricing etc.).
  5. Mande revisar a cada 6 meses ou quando houver mudança substancial
     no produto (ver `CHANGELOG-DPO.md`).
```

---

## 📂 Índice de arquivos

| Arquivo | Propósito | Quem lê | Status |
|---------|-----------|---------|--------|
| [`privacy-policy.md`](./privacy-policy.md) | Política de privacidade pública para todos os usuários | Visitantes, creators, leads, ANPD | 🟡 Modelo |
| [`terms-of-service.md`](./terms-of-service.md) | Termos de uso do serviço DemoBR | Creators (assinantes) | 🟡 Modelo |
| [`dpa-data-processing-agreement.md`](./dpa-data-processing-agreement.md) | Acordo de tratamento de dados B2B entre DemoBR e clientes corporativos | Creators Business / jurídico dos clientes | 🟡 Modelo |
| [`cookie-policy.md`](./cookie-policy.md) | Política de cookies do player e painel | Visitantes do player | 🟡 Modelo |
| [`subprocessors-list.md`](./subprocessors-list.md) | Lista de subprocessadores com DPA assinado | Visitantes, titulares, clientes B2B | 🟡 Modelo |
| [`dsr-endpoint-policy.md`](./dsr-endpoint-policy.md) | Política do endpoint de direitos do titular (LGPD art. 18) | Titulares, DPO, ANPD | 🟡 Modelo |
| [`incident-response-plan.md`](./incident-response-plan.md) | Plano de resposta a incidentes de segurança e dados | Equipe interna (IR roster), DPO, ANPD | 🟡 Modelo |
| [`RTBF-template.md`](./RTBF-template.md) | Modelo de resposta para confirmação de tratamento (art. 18, I) | DPO, suporte | 🟡 Modelo |
| [`RTBF-data-export-schema.json`](./RTBF-data-export-schema.json) | Schema JSON do export DSR (art. 18, V — portabilidade) | Engenharia | 🟡 Modelo |
| [`RTBF-deletion-procedure.md`](./RTBF-deletion-procedure.md) | Procedimento técnico de eliminação (art. 18, VI) | Engenharia, DPO | 🟡 Modelo |
| [`CHANGELOG-DPO.md`](./CHANGELOG-DPO.md) | Histórico de revisões jurídicas | DPO, jurídico interno | 🟡 Modelo |
| [`DPO.md`](./DPO.md) | Persona, critérios, caminhos de contratação e canal de comunicação do Encarregado | Sócios, CTO, candidato a DPO | 🟡 Modelo — **PENDENTE de contratação** |
| [`DPO-PROCESS.md`](./DPO-PROCESS.md) | Fases de seleção, checklist de onboarding, workflow interno, política de reporte e SLAs do DPO | Sócios, CTO, DPO (após contratação) | 🟡 Modelo — **PENDENTE de contratação** |

---

## 🔗 Como estes documentos se conectam

```
┌─────────────────────────┐
│ Política de Privacidade │ ◄── referência para visitante do demo / lead
└────────────┬────────────┘
             │
             ├──► Lista de Subprocessadores (subprocessors-list.md)
             │
             └──► Política de Cookies (cookie-policy.md)
                  │
                  └──► Lista detalhada de cada cookie

┌─────────────────────────┐
│   Termos de Uso         │ ◄── aceite no signup do creator
└────────────┬────────────┘
             │
             └──► Anexo: SLA, refund policy

┌─────────────────────────┐
│   DPA (B2B)             │ ◄── aceite por clientes Business / Enterprise
└────────────┬────────────┘
             │
             ├──► Subprocessadores (mesma lista, com cláusulas + fortes)
             │
             └──► Schema de dados (anexo técnico = RTBF-data-export-schema.json)

┌─────────────────────────┐
│   DSR Endpoint Policy   │ ◄── formulário público + email
└────────────┬────────────┘
             │
             ├──► RTBF Template (resposta padrão art. 18, I)
             │
             ├──► RTBF Export Schema (resposta art. 18, V)
             │
             └──► RTBF Deletion Procedure (resposta art. 18, VI)

┌─────────────────────────┐
│ Incident Response Plan  │ ◄── usado quando há P0/P1
└────────────┬────────────┘
             │
             └──► Templates de comunicados (em construção)
```

---

## 🧭 Mapa de cobertura LGPD

Esta pasta foi desenhada para endereçar os artigos mais sensíveis da
LGPD para o modelo de negócio DemoBR. **Confirme com advogado.**

| Artigo LGPD | Tema | Endereçado em |
|-------------|------|---------------|
| **art. 7º** | Bases legais | `privacy-policy.md` §3, `dpa-data-processing-agreement.md` §3 |
| **art. 9º** | Consentimento | `privacy-policy.md` §3.1, `cookie-policy.md` §4 |
| **art. 18** | Direitos do titular (10 direitos) | `dsr-endpoint-policy.md`, `RTBF-*.md` |
| **art. 37** | Encarregado (DPO) | `privacy-policy.md` §11, `dpa-data-processing-agreement.md` §12, `DPO.md`, `DPO-PROCESS.md` |
| **art. 39** | Operador — obrigações | `dpa-data-processing-agreement.md` §4 |
| **art. 46** | Medidas de segurança | `incident-response-plan.md` §6, `dpa-data-processing-agreement.md` §5 |
| **art. 48** | Notificação de incidente à ANPD | `incident-response-plan.md` §7 |
| **art. 49** | Notificação aos titulares | `incident-response-plan.md` §8 |
| **art. 50** | Boa-fé e segurança | Cobertura transversal |
| **art. 52** | Transferência internacional | `privacy-policy.md` §9, `dpa-data-processing-agreement.md` §7 |

---

## ✅ Convenções usadas nos arquivos

Cada documento desta pasta tem, no rodapé, duas linhas padronizadas:

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
```

- Datas em formato `DD/MMM/AAAA` (PT-BR), padrão RFC.
- Referências à LGPD no formato `LGPD art. X, §Y, I`.
- Referências ao GDPR no formato `GDPR art. Xº` (com "º" ordinal).
- Valores monetários em **R$** (Real Brasileiro).
- Linguagem: PT-BR. Quando a audiência é técnica (schema JSON, runbook),
  aceitamos termos em EN consagrados (ex.: "endpoint", "schema", "worker").
- Subprocessadores são listados em **ordem alfabética** dentro de cada
  categoria para evitar viés.

---

## 📋 Lista de tarefas para o advogado revisar

```
[ ] Substituir placeholders de CNPJ, endereço, razão social pelos reais.
[ ] Confirmar se a DemoBR LTDA é MEI, EPP, LTDA pura ou S.A.
[ ] Definir comarca (atualmente proposta: São Paulo/SP).
[ ] Definir política de reembolso (atualmente proposta: 7 dias).
[ ] Revisar art. 18 — lista de direitos e SLAs.
[ ] Validar base legal de legítimo interesse para analytics
    (LGPD art. 7º, IX exige "interesse legítimo" + "necessidade"
     + "não violação de direitos fundamentais").
[ ] Avaliar se algum tratamento se enquadra em "dados sensíveis"
    (art. 5º, II) — provavelmente não, mas confirmar.
[ ] Avaliar se há necessidade de nomear um DPO externo formal
    (atualmente proposto: e-mail interno).
[ ] Validar cláusula de transferência internacional para Hetzner
    (Alemanha) e US-based subprocessadores (Clerk, Resend, Sentry).
[ ] Validar cláusula de ANPD — comunicação de incidente (art. 48).
[ ] Avaliar se cláusulas indenizatórias em Termos de Uso são válidas
    sob CDC (Código de Defesa do Consumidor — Lei 8.078/90).
[ ] Validar cláusula de propriedade intelectual nos demos publicados.
[ ] Revisar limites de responsabilidade dos Termos.
[ ] Confirmar se há obrigação de registro de operações (art. 37
    LGPD fala de encarregado; registro era art. 37º texto original
    mas foi vetado — verificar se adotamos boas práticas de RIPD).
[ ] Confirmar cláusulas de GDPR equivalentes para clientes EU
    (supletivo, caso expandam).
[ ] Validar cláusulas de DMCA / copyright claims — verificar se o
    produto hospeda conteúdo de terceiro (provavelmente sim, via
    screenshots capturados pelo creator).
```

---

## 📞 Contato

- **Encarregado/DPO** *(placeholder funcional — contratação em
  até 90 dias)*: `placeholder@easydemo.io`
- **Segurança**: `security@easydemo.io`
- **Privacidade**: `privacy@easydemo.io`

> ⏳ **Status do DPO**: PENDENTE de contratação formal. A DemoBR
> mantém o alias `placeholder@easydemo.io` que encaminha para a
> liderança enquanto a nomeação não é concluída. Detalhes sobre o
> processo de seleção, persona, critérios, SLAs e cronograma estão
> em [`DPO.md`](./DPO.md) e [`DPO-PROCESS.md`](./DPO-PROCESS.md).
>
> **Próximos passos** (responsabilidade do usuário humano, não do
> subagente):
> 1. Aprovar orçamento para o DPO (sócios/board).
> 2. Decidir caminho de contratação (`DPO.md` §4).
> 3. Publicar vaga ou pedir proposta a plataformas.
> 4. Após contratação, executar o checklist de `DPO-PROCESS.md` §2.
> 5. Substituir `placeholder@easydemo.io` pelo e-mail real em
>    todos os docs (script de busca em
>    `setup-report/PHASE-13-dpo-placeholder.md`).
>
> **Onde encontrar candidatos**: LinkedIn (busca "Encarregado de
> Proteção de Dados"), IAPP Brasil (capítulo brasileiro), OAB
> (comissões de privacidade), ANPPD, ASAPEPRO. Ver `DPO.md` §8.

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
```
