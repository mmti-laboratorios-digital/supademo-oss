# 👤 Encarregado de Proteção de Dados (DPO) — DemoBR

> Documento de referência para a **contratação e onboarding** do
> Encarregado de Proteção de Dados (DPO) da DemoBR LTDA, conforme
> **LGPD art. 41**.
>
> **Status atual:** ⏳ **PENDENTE DE CONTRATAÇÃO** — a DemoBR está em
> processo de nomeação formal. Esta nomeação será concluída em até
> **90 dias contados da publicação** da política de privacidade.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Por que este documento existe

A LGPD art. 41 obriga todo agente de tratamento (controlador ou
operador) a **nomear um encarregado** (comumente chamado **DPO —
Data Protection Officer**, nomenclatura do GDPR). A ausência de
nomeação válida é infração administrativa sancionável pela ANPD
(LGPD art. 52, §1º, II).

Este documento:

1. Define a **persona profissional recomendada** para a vaga (sem
   inventar nome de pessoa).
2. Lista os **critérios de seleção** para avaliação de candidatos.
3. Descreve os **3 caminhos de contratação** possíveis.
4. Lista os **8 compromissos** que o DPO assumirá.
5. Define o **canal de comunicação** entre titular e DPO.
6. Estabelece o **timeline** até a contratação formal.

> ⚠️ **Importante**: até a nomeação formal, **não fazemos nenhuma
> afirmação pública de que a DemoBR já tem DPO contratado**. O
> canal `dpo@easydemo.io` é um **placeholder funcional** que
> encaminha para a liderança da DemoBR LTDA, conforme descrito em
> [`DPO-PROCESS.md`](./DPO-PROCESS.md).

---

## 2. Persona profissional recomendada

O DPO **não precisa ser, necessariamente, advogado**. A LGPD
permite que o encarregado seja qualquer pessoa — física ou
jurídica — desde que tenha **capacidade técnica e jurídica**
compatível com o volume e a sensibilidade dos tratamentos.

As 3 personas mais recomendadas para o porte da DemoBR são:

### 2.1 Advogado(a) com OAB ativa, especializado(a) em LGPD

- **Formação**: Direito, com inscrição OAB ativa e **especialização
  lato sensu ou MBA em Proteção de Dados** (Ex.: IDP, FGV, Insper,
  ESA, EPD).
- **Experiência mínima**: 3 anos em LGPD/GDPR, com **portfólio de
  clientes** (em especial SaaS B2B).
- **Diferencial**: pode **emitir pareceres vinculantes** sobre
  cláusulas contratuais, o que é particularmente útil na revisão
  do DPA, dos Termos de Uso e dos contratos com subprocessadores.
- **Custo médio (Brasil, 2026)**: R$ 8k–R$ 25k/mês em regime de
  retainer (PJ) para empresa de pequeno porte.

### 2.2 Engenheiro(a) de Segurança com certificação em privacidade

- **Formação**: Ciência da Computação, Engenharia da Computação ou
  área correlata, com **certificações em segurança da informação**
  (CISSP, CISM, ISO 27001 Lead Implementer) **E em privacidade**
  (IAPP CIPP/E, CIPM, CIPT ou EXIN PDP F).
- **Experiência mínima**: 5 anos em segurança da informação, com
  ao menos 2 anos em privacy engineering.
- **Diferencial**: entende profundamente o stack (Hetzner, Cloudflare,
  Postgres RLS, Clerk, Asaas), o que **acelera DSR e resposta a
  incidentes**.
- **Limitação**: normalmente **não emite parecer jurídico** —
  revisão final por advogado é recomendada.
- **Custo médio (Brasil, 2026)**: R$ 12k–R$ 30k/mês (CLT) ou
  R$ 10k–R$ 22k/mês (PJ).

### 2.3 DPO certificado IAPP/EXIN dedicado (pessoa física)

- **Formação**: varied; o que importa é a **certificação
  reconhecida** (IAPP CIPP/E, CIPP/A, CIPM; EXIN PDP F; DPO
  Alliance).
- **Experiência mínima**: 3 anos atuando como DPO em 2+ empresas
  de software.
- **Diferencial**: pessoa 100% dedicada à função, com **rede de
  contato** (IAPP Brasil, ANPD) e **atualização regulatória
  contínua**.
- **Custo médio (Brasil, 2026)**: R$ 6k–R$ 15k/mês (PJ retainer) +
  custo de certificação (~R$ 2k/ano).

> **Recomendação DemoBR**: para o porte atual (< 1.000 creators
> ativos, em sua maioria PJ), a persona **2.3** (DPO dedicado
> certificado) ou **2.1** (advogado especializado) é a mais
> adequada. A combinação **2.1 + 2.3** (DPO interno certificado +
> advogado de apoio) é ideal a partir de 5.000 creators ativos
> ou quando entrarmos no mercado UE.

---

## 3. Critérios de seleção

Os 7 critérios abaixo são usados na avaliação de candidatos.
Cada candidato deve ser pontuado em cada critério (escala 0–5).

### 3.1 Certificação em privacidade (peso: alto)

- **Ideal**: IAPP CIPP/E + CIPM, ou EXIN PDP F + DPO Alliance.
- **Aceitável**: curso lato sensu em LGPD (FGV, IDP, EPD).
- **Insuficiente**: somente "conhecimento autodidata".

### 3.2 Experiência prática em LGPD/GDPR (peso: alto)

- **Ideal**: 3+ anos como DPO ou consultor de privacidade com
  casos publicados ou clientes de referência em SaaS.
- **Aceitável**: 1+ ano em consultoria ou jurídico interno.
- **Insuficiente**: zero casos reais.

### 3.3 Conhecimento técnico (peso: alto)

- **Ideal**: leitura de logs, noções de SQL, compreensão de
  criptografia, autenticação, RLS, RBAC, infraestrutura cloud.
- **Aceitável**: capacidade de traduzir requisito técnico para
  engenheiro (e vice-versa).
- **Insuficiente**: desconhece conceitos básicos de segurança.

### 3.4 Capacidade jurídica (peso: médio)

- **Ideal**: OAB ativa (se advogado) ou **capacidade de revisar
  cláusulas** com apoio jurídico externo.
- **Aceitável**: contrato de retainer com advogado de apoio.
- **Insuficiente**: zero leitura crítica de cláusulas contratuais.

### 3.5 Disponibilidade (peso: alto)

- **Ideal**: DPO dedicado em tempo integral ou **retainer ≥ 16h/mês**
  com SLA claro.
- **Aceitável**: retainer ≥ 8h/mês com backup definido.
- **Insuficiente**: "vou ajudar quando precisar".

### 3.6 Reputação e referências (peso: médio)

- **Ideal**: ao menos 2 referências de clientes PJ com porte
  similar ao DemoBR.
- **Aceitável**: LinkedIn com endorsements e publicações técnicas.
- **Insuficiente**: sem histórico público.

### 3.7 Independência (peso: alto)

- **Ideal**: pessoa ou firma **sem conflito de interesse** com
  clientes concorrentes do DemoBR (ex.: outros SaaS de demos).
- **Aceitável**: declaração formal de inexistência de conflito.
- **Insuficiente**: alguém do time fundador acumulando a função.

> **Por que "independência" importa?** O DPO tem **dever de
> reportar infração** à ANPD e aos titulares mesmo contra o
> controlador (LGPD art. 41, §2º). Sem independência, o DPO
> torna-se figurativo.

---

## 4. Como contratar: 3 caminhos

### 4.1 Caminho A — DPO interno (CLT)

| Item | Detalhe |
|------|---------|
| **Vínculo** | Carteira assinada, regime CLT, dedicação integral ou parcial |
| **Custo mensal estimado** | R$ 12k–R$ 25k (encargos incluídos) |
| **Prós** | Integração com a equipe, conhecimento profundo do produto, presença em reuniões de produto |
| **Contras** | Custo fixo, dependência de uma pessoa, exige substituição em férias/afastamentos |
| **Quando escolher** | A partir de ~5.000 creators ativos ou quando o DPO for envolvido em decisões de produto (privacy by design) em tempo real |
| **Recomendação DemoBR** | ⏳ Não prioritário nos primeiros 12 meses |

### 4.2 Caminho B — DPO externo (PJ retainer)

| Item | Detalhe |
|------|---------|
| **Vínculo** | Pessoa jurídica (CPF como MEI/EIRELI ou CNPJ) com contrato de retainer mensal |
| **Custo mensal estimado** | R$ 2k–R$ 5k (DPO júnior) ou R$ 5k–R$ 15k (DPO sênior certificado) |
| **Prós** | Sem encargos CLT, fácil substituição, custo variável, expertise de quem atende múltiplos clientes |
| **Contras** | Não está "full-time" no produto, exige onboarding cuidadoso, risco de conflito de interesse |
| **Quando escolher** | Para empresa em estágio inicial/médio (< 5.000 creators) — caso da DemoBR |
| **Recomendação DemoBR** | ✅ **Recomendado** para os primeiros 12 meses |

### 4.3 Caminho C — Plataforma de DPO as a Service

| Item | Detalhe |
|------|---------|
| **Vínculo** | Contrato com plataforma especializada que fornece DPOs certificados sob demanda |
| **Custo mensal estimado** | R$ 800–R$ 3k/mês (plano básico) a R$ 5k–R$ 10k/mês (plano enterprise) |
| **Prós** | Time de DPOs prontos, cobertura de férias/afastamentos inclusa, dashboards de conformidade |
| **Contras** | DPO pode não ser o mesmo ao longo do tempo; menor profundidade no produto |
| **Plataformas conhecidas (2026)** | Exind (BR), Privacy Tools (BR), Privally (LATAM), OneTrust DPO Office (global), TrustArc DPO-as-a-Service (global) |
| **Quando escolher** | Quando há restrição orçamentária severa ou quando a empresa quer cobertura 24/7 |
| **Recomendação DemoBR** | 🟡 Avaliar como alternativa ao Caminho B |

> **Decisão recomendada**: a DemoBR deve iniciar pelo **Caminho B**
> (DPO externo PJ retainer, júnior a sênior conforme orçamento) e
> reavaliar a cada 6 meses.

---

## 5. Compromissos do DPO (8 itens)

O DPO, ao ser contratado, assume os seguintes compromissos
(formalizados em contrato):

### 5.1 Sigilo e confidencialidade

- Não divulgar informações pessoais tratadas pela DemoBR a
  terceiros, exceto quando exigido por lei ou ordem judicial.
- Assina **Termo de Confidencialidade (NDA)** com cláusula de
  penalidade em caso de violação.

### 5.2 Comunicação com a ANPD

- Servir como ponto de contato oficial entre a DemoBR e a ANPD
  (LGPD art. 41, §1º).
- Reportar à ANPD incidentes relevantes em até **24h** após
  confirmação (LGPD art. 48).
- Manter atualizada a **ficha de nomeação** no sistema da ANPD
  (quando disponível).

### 5.3 Comunicação com titulares

- Responder a **solicitações de titulares** (LGPD art. 18) em até
  **15 dias úteis**, prorrogáveis por mais 15 com justificativa.
- Coordenar com a equipe técnica a execução de DSR (export,
  eliminação, correção).
- Manter **registro auditável** de todas as comunicações (canal
  `app.dsr_log` do banco).

### 5.4 Treinamento da equipe

- Conduzir **treinamento anual** de LGPD para todos os funcionários
  e colaboradores com acesso a dados pessoais.
- Fornecer **microlearning trimestral** (curtos vídeos/lectures)
  para reforçar boas práticas.
- Documentar participação e arquivar certificados.

### 5.5 Revisão documental

- Revisar anualmente todos os documentos em `legal/`
  (ver [`CHANGELOG-DPO.md`](./CHANGELOG-DPO.md)).
- Sinalizar mudanças regulatórias que afetem os documentos.
- Coordenar revisão por advogado sempre que houver mudança
  substancial.

### 5.6 DPIA (Relatório de Impacto à Proteção de Dados)

- Conduzir **DPIA anual** para novos tratamentos
  (LGPD art. 38).
- Documentar decisões de tratamento que afetem crianças,
  adolescentes, dados sensíveis ou perfis automatizados.

### 5.7 Reporte à liderança

- Reportar **mensalmente** à liderança da DemoBR (CEO/sócios)
  status de conformidade.
- Reportar **trimestralmente** resumo de DSR, incidentes e
  mudanças regulatórias.
- Reportar **anualmente** relatório de auditoria interna.

### 5.8 Substituição e continuidade

- Manter **pessoa backup** designada (interna ou externa) para
  cobrir férias, afastamentos ou desligamentos.
- Comunicar à liderança com **≥ 60 dias de antecedência** caso
  deseje encerrar o contrato, para transição suave.

---

## 6. Canal de comunicação do titular ao DPO

### 6.1 Endereço de e-mail oficial

- **E-mail:** `dpo@easydemo.io` *(placeholder — ver nota abaixo)*
- **Tipo:** alias que **encaminha** para a liderança da DemoBR
  até que o DPO formal seja contratado.
- **Configuração recomendada:**
  - Encaminhar para: caixa da liderança (CTO/CEO).
  - SLA de leitura: ≤ 2 dias úteis.
  - Auto-resposta confirmando recebimento e prazo de resposta
    substantiva (15 dias úteis).

### 6.2 Página pública do DPO

URL planejada: `https://www.easydemo.io/dpo`

Conteúdo da página (quando publicada):

- Nome do DPO (após contratação).
- CPF (sigiloso — visível apenas mediante solicitação fundamentada
  da ANPD).
- E-mail e telefone (opcional).
- Como exercer direitos (LGPD art. 18) — link para formulário
  público.
- Histórico de nomeações (para accountability).

### 6.3 Formulário público DSR

URL: `https://app.easydemo.io/privacidade/solicitacao`

- Para titulares que não querem mandar e-mail.
- Backend com identidade verificada (ver
  [`dsr-endpoint-policy.md`](./dsr-endpoint-policy.md) §7).

### 6.4 Canal de emergência

URL/email: `security@easydemo.io`

- Para reportar incidentes de segurança ou suspeita de vazamento.
- Resposta inicial: ≤ 24h (ver
  [`incident-response-plan.md`](./incident-response-plan.md) §7).

---

## 7. Timeline sugerido

A DemoBR estabelece o seguinte cronograma para formalização do DPO.
Datas relativas a partir da data de **publicação** da política de
privacidade:

```
D+0      Publicação da política de privacidade
         (todos os docs em legal/ com placeholder `dpo@easydemo.io`)

D+0 a D+15
         Fase 0 — Levantamento
         - Definir orçamento aprovado para DPO (CFO/sócios).
         - Definir se interno, externo PJ ou plataforma (ver §4).
         - Publicar vaga em LinkedIn, IAPP Brasil, Asapepro (se
           interno).

D+15 a D+45
         Fase 1 — Captação
         - Receber currículos / propostas.
         - Pré-filtrar por critérios §3.

D+45 a D+75
         Fase 2 — Entrevistas
         - Entrevistar 3–5 finalistas (técnica + comportamental).
         - Checar referências.
         - Negociar contrato.

D+75 a D+90
         Fase 3 — Contratação
         - Assinar contrato.
         - Onboarding (ver `DPO-PROCESS.md` §2).
         - Atualizar `privacy-policy.md` §11 com nome real.
         - Atualizar página `https://www.easydemo.io/dpo`.
         - Comunicar nomeação à ANPD (formulário disponível em
           https://www.gov.br/anpd/).
         - Substituir `placeholder@easydemo.io` por e-mail real
           do DPO em todos os docs (ver `PHASE-13-dpo-placeholder.md`
           para o script de substituição).

D+90 a D+120
         Fase 4 — Operação assistida
         - DPO acompanha as primeiras DSR/incidentes.
         - Treinamento inicial da equipe pelo DPO.
         - Primeiro reporte mensal à liderança.
```

> **Em caso de incidente P0** antes da contratação: o **CTO + CEO**
> assumem interinamente as funções do DPO conforme o plano de
> resposta a incidentes
> ([`incident-response-plan.md`](./incident-response-plan.md) §2).

---

## 8. Onde encontrar candidatos

### 8.1 LinkedIn (Brasil)

- Buscar por: `Encarregado de Proteção de Dados`, `DPO`, `Privacy
  Officer`, `LGPD Consultant`.
- Filtrar por região: São Paulo, Rio de Janeiro, Belo Horizonte,
  Curitiba (principais polos).
- Validar certificações no perfil (seção "Licenças e certificações").

### 8.2 IAPP Brasil

- **Site**: https://iapp.org/ (capítulos Brasil)
- Diretório de membros certificados (CIPP/E, CIPM, CIPT).
- Filtrar por país/região.

### 8.3 ANPD

- **Site**: https://www.gov.br/anpd/
- Não tem diretório público de DPOs, mas publica comunicados e
  guias que ajudam a identificar profissionais ativos no mercado.

### 8.4 Ordens e associações (Brasil)

- **OAB** (seccional SP, RJ, MG, PR): comissões de proteção de
  dados e direitos digitais.
- **ANPPD** (Associação Nacional dos Profissionais de Privacidade de
  Dados): diretório de associados.
- **ASAPEPRO** (Associação Brasileira dos Profissionais de
  Privacidade): eventos e fórum de emprego.

### 8.5 Plataformas de DPO as a Service

Ver §4.3 — solicitar proposta de **Exind, Privacy Tools, Privally**.

---

## 9. Restrições e honestidade documental

Este documento **NÃO** afirma:

- ❌ Que a DemoBR já contratou um DPO.
- ❌ Que existe uma pessoa física ou jurídica ocupando o cargo.
- ❌ Que o canal `dpo@easydemo.io` é monitorado por um
  encarregado certificado.

Este documento **AFIRMA**:

- ✅ Que a DemoBR **reconhece a obrigação legal** (LGPD art. 41).
- ✅ Que há um **processo formal** de contratação em andamento.
- ✅ Que existe um **canal funcional** (encaminhamento para a
  liderança) com SLA definido.
- ✅ Que o **timeline** de até 90 dias é o compromisso público
  adotado nesta política.

---

## 10. Próximos passos para o usuário (não o subagente)

Esta seção é **para o usuário humano** que opera a DemoBR LTDA.

1. **Aprovar o orçamento** para DPO (sócios/board).
2. **Decidir o caminho** de contratação (§4).
3. **Publicar a vaga** ou **pedir proposta** a 2–3 plataformas.
4. **Conduzir entrevistas** com finalistas.
5. **Após contratação**:
   - Substituir todos os placeholders
     `placeholder@easydemo.io` por e-mail real do DPO (script
     em `setup-report/PHASE-13-dpo-placeholder.md`).
   - Preencher `CHANGELOG-DPO.md` §4 com nome e CPF do DPO.
   - Atualizar `legal/privacy-policy.md` §11.
   - Atualizar `https://www.easydemo.io/dpo`.
   - Comunicar nomeação à ANPD.
6. **Rodar `pnpm exec tsx scripts/check-dpo-missing.ts`** — deve
   retornar exit 0.

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — PENDENTE DE CONTRATAÇÃO
Versão: 0.1.0
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```