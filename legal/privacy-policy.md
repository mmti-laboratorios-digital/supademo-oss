# Política de Privacidade — DemoBR

> Esta política descreve como a **DemoBR LTDA** coleta, usa, compartilha
> e protege os dados pessoais dos usuários do nosso serviço de demos
> interativas (`app.easydemo.io` e players públicos `app.easydemo.io/d/[slug]`).
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Quem somos

A **DemoBR LTDA** ("DemoBR", "nós", "nosso") é a pessoa jurídica
controladora — ou operadora, conforme o caso — dos dados pessoais
descritos nesta política.

- **Razão social**: DemoBR LTDA
- **CNPJ**: XX.XXX.XXX/0001-XX (a preencher)
- **Endereço**: Rua Exemplo, nº 123, sala 45, Bairro Centro,
  Cidade/Estado, CEP XXXXX-XXX (a preencher)
- **E-mail do encarregado (DPO)**: `placeholder@easydemo.io` *(a
  ser substituído quando o DPO for contratado — ver §11)*
- **Website**: `https://www.easydemo.io`

> ⚠️ **Placeholder**: preencha CNPJ e endereço reais a partir do
> contrato social antes de publicar. O e-mail
> `placeholder@easydemo.io` é um alias que encaminha para a
> liderança da DemoBR enquanto a nomeação formal não é concluída.

---

## 2. Dados que coletamos

A DemoBR coleta dados pessoais de **três grupos distintos** de usuários,
cada um com finalidades, bases legais e prazos de retenção próprios.
Explicamos as diferenças porque a LGPD trata cada papel
(controlador × operador) de forma específica.

### 2.1 Usuário Creator (quem cria demos)

Quem assina um plano pago (Free, Pro R$ 49/mês, Business R$ 199/mês)
ou cria uma conta gratuita.

| Categoria | Exemplos | Fonte |
|-----------|----------|-------|
| Dados cadastrais | Nome, e-mail, URL de foto (se fornecida) | Cadastro + OAuth Google |
| Dados de autenticação | Hash bcrypt da senha (se e-mail/senha), tokens OAuth de Google | Clerk (subprocessador) |
| Organização/workspace | Nome, slug, URL do logo | Configuração pelo próprio creator |
| Dados de cobrança | CPF/CNPJ do pagador, endereço de cobrança, histórico de pagamento | Asaas (subprocessador) |
| Conteúdo do creator | Texto, screenshots, áudio, narração TTS | Criado e enviado pelo próprio creator |
| Eventos de uso | IP (hasheado), User-Agent, ações no painel | Logs automáticos (Sentry, SigNoz) |

### 2.2 Visitante do demo (quem assiste)

Quem abre um demo público `/d/[slug]` ou embed `/embed/[id]`.
**O visitante normalmente não tem cadastro**, e a DemoBR coleta o mínimo
necessário para analytics.

| Categoria | Exemplos | Fonte |
|-----------|----------|-------|
| Identificador anônimo | Cookie first-party `_pk_id` (UUID em hash) | analytics |
| Eventos de visualização | Step visto, tempo no step, drop-off, CTA clicado | analytics |
| Locale | Idioma do navegador (`Accept-Language`) | analytics |
| Device category | Mobile, desktop, tablet (via User-Agent, NÃO IP) | analytics |
| País estimado | Derivado de `Accept-Language` (NÃO IP geo) | analytics |

### 2.3 Lead captado

Quem preencheu o formulário dentro de um demo (ex.: pediu mais
informações, deixou e-mail).

| Categoria | Exemplos | Base legal |
|-----------|----------|------------|
| Nome | Fornecido pelo lead | Consentimento (art. 7º, I) |
| E-mail | Fornecido pelo lead | Consentimento (art. 7º, I) |
| Telefone (opcional) | Fornecido pelo lead | Consentimento (art. 7º, I) |
| Consentimento | Timestamp + texto exato do aceite | Cumprimento de obrigação legal (prova do consentimento) |

**Importante**: a DemoBR **não** armazena o IP do lead. O User-Agent é
hasheado (SHA-256 + sal rotativo) para fins de prova de origem, **sem
reversibilidade** ao IP original.

---

## 3. Para que usamos cada dado (finalidade e base legal)

Cada tratamento possui uma **base legal específica** (LGPD art. 7º).

| Tratamento | Finalidade | Base legal (LGPD art. 7º) |
|------------|-----------|---------------------------|
| Capturar e armazenar leads | Permitir que o creator contate visitantes interessados | (a) Consentimento explícito do lead |
| Analytics anônimos de visualização | Mostrar métricas agregadas ao creator | (f) Legítimo interesse — desde que não viole direitos do titular e ofereça opt-out |
| Billing via Asaas | Processar pagamentos e emitir NF-e | (b) Execução de contrato |
| Retenção de logs de auditoria | Cumprir obrigação de investigação e segurança | (b) Cumprimento de obrigação legal + legítimo interesse |
| Backup criptografado | Garantir continuidade operacional | (f) Legítimo interesse |
| Envio de e-mails transacionais | Notificações operacionais (login, billing, alertas) | (b) Execução de contrato |
| Prevenção a fraude e abuso | Detectar uso indevido e proteger a plataforma | (f) Legítimo interesse |
| Personalização PT-BR / EN | Mostrar player no idioma do visitante | (a) Consentimento via banner |

### 3.1 Sobre o consentimento (LGPD art. 8º e 9º)

Quando a base legal é consentimento:

- O consentimento é **explícito** (não é pré-marcado).
- O titular pode revogar a qualquer momento, sem custos, com efeito
  retroativo limitado (o que já foi feito, feito está — mas
  interrompemos o tratamento daqui pra frente).
- O texto exato do consentimento e o timestamp são registrados para
  fins de prova.
- Para crianças e adolescentes (< 18 anos), o consentimento é dado
  por ao menos um dos pais ou responsável legal (LGPD art. 11º).

---

## 4. Com quem compartilhamos

Compartilhamos dados pessoais **apenas com subprocessadores** (terceiros
que nos ajudam a operar o serviço) e com **autoridades públicas** quando
houver obrigação legal. **Não vendemos dados pessoais.**

A lista completa e atualizada está em
[`subprocessors-list.md`](./subprocessors-list.md).

### 4.1 Categorias de subprocessadores

| Categoria | Finalidade | Exemplo |
|-----------|-----------|---------|
| Hospedagem | Servidores, banco de dados, backup | Hetzner (Alemanha), Cloudflare (EUA/UE) |
| Autenticação | Login e gestão de usuários | Clerk (EUA) |
| Pagamento | Processar PIX, boleto, cartão; emitir NF-e | Asaas (Brasil) |
| E-mail transacional | Enviar notificações operacionais | Resend (EUA) |
| Analytics de produto | Métricas de uso agregadas (LGPD-safe) | PostHog (EUA/UE) |
| Observabilidade | Erros e logs técnicos | Sentry (EUA/UE) |
| IA generativa (Fase 2) | Geração de texto e TTS | OpenAI, Anthropic, ElevenLabs (EUA, com cláusula de no-train) |

### 4.2 Quando há obrigação legal

Compartilhamos dados com autoridades públicas (ANPD, Receita Federal,
Polícia, Justiça) **somente quando houver ordem legal fundamentada**.

---

## 5. Cookies e tecnologias similares

Detalhamento na [`cookie-policy.md`](./cookie-policy.md). Resumo:

- **Cookies essenciais**: sessão, autenticação. Não podem ser desativados.
- **Cookies de analytics**: primeira-parte, com opt-out via banner.
- **Cookies de preferência**: idioma (`locale`), tema. Não compartilhados.

A DemoBR não usa cookies de publicidade comportamental de terceiros.

---

## 6. Retenção de dados

Aplicamos o princípio da **necessidade** (LGPD art. 6º, III): guardamos
os dados apenas pelo tempo necessário à finalidade ou por obrigações
legais.

| Tipo de dado | Retenção | Motivo |
|--------------|----------|--------|
| Conta de creator enquanto ativo | Indefinido (enquanto criador for cliente) | Execução de contrato |
| Conta de creator cancelada | 24 meses após cancelamento | Auditoria + reativação |
| Leads (ativos) | Enquanto cliente pagante + 24 meses | Contrato + auditoria |
| Leads (após DSR de eliminação) | 0 dias | LGPD art. 18, VI |
| Eventos de analytics raw | 90 dias | Legítimo interesse → após, agregamos |
| Audit logs | 24 meses (PII anonimizado) | Obrigação legal |
| Backups (pgBackRest) | 7 completos + diffs diários | Continuidade |
| 1 backup mensal long-term | 24 meses | Obrigação fiscal |
| Dados de billing (Asaas) | 60 meses | Obrigação fiscal (Receita Federal, CTN art. 173) |
| Logs técnicos SigNoz | 7 dias (full-text), 24 meses (agregados) | Observabilidade |

Passado o prazo, o dado é **eliminado ou anonimizado** de forma
automatizada (job `lgpd_retention_cron` no `graphile-worker`).

---

## 7. Direitos do titular (LGPD art. 18)

Todo titular cujos dados tratamos pode exercer **10 direitos** previstos
no art. 18:

1. **Confirmação da existência de tratamento** (resposta padrão em
   [`RTBF-template.md`](./RTBF-template.md)).
2. **Acesso** aos dados (export JSON conforme
   [`RTBF-data-export-schema.json`](./RTBF-data-export-schema.json)).
3. **Correção** de dados incompletos, incorretos ou desatualizados.
4. **Anonimização, bloqueio ou eliminação** de dados desnecessários
   ou tratados em desconformidade.
5. **Portabilidade** dos dados (export estruturado, JSON).
6. **Eliminação** dos dados tratados com consentimento (procedimento
   em [`RTBF-deletion-procedure.md`](./RTBF-deletion-procedure.md)).
7. **Informação sobre entidades públicas e privadas** com as quais
   houve compartilhamento.
8. **Informação sobre a possibilidade de não fornecer consentimento**
   e suas consequências.
9. **Revogação do consentimento** (efeitos ex-nunc).
10. **Reclamação** à ANPD e petição em juízo contra o controlador.

### 7.1 Como exercer

**Para visitantes do demo ou leads** (que não têm login):
- Preencher o formulário público em `https://app.easydemo.io/privacidade/solicitacao`
  com prova de identidade (e-mail de contato + documento ou selfie).
- Ou enviar e-mail para `placeholder@easydemo.io` com:
  - Nome completo
  - E-mail que usou no demo/lead
  - Documento de identidade (RG/CNH, com foto nítida)
  - Qual direito está exercendo (1 a 10 acima)

**Para creators** (que têm login):
- O próprio painel admin em `app.easydemo.io/admin/dsr` tem um
  formulário autenticado (mais rápido).
- API para integrações: `GET/DELETE /api/v1/dsr?token=...` (detalhes em
  [`dsr-endpoint-policy.md`](./dsr-endpoint-policy.md)).

### 7.2 Prazo de resposta

Respondemos em **até 15 dias** a contar do recebimento da solicitação
(LGPD art. 18, §5º), prorrogáveis por mais 15 dias mediante justificativa.
Pedidos que envolvam investigação profunda (ex.: suspeita de fraude)
podem levar os 30 dias totais com aviso ao titular.

---

## 8. Medidas de segurança (LGPD art. 46)

Aplicamos medidas **técnicas e organizacionais** alinhadas às boas
práticas internacionais. Detalhes em [`docs/SECURITY-MODEL.md`](../docs/SECURITY-MODEL.md).

### 8.1 Medidas técnicas

| Camada | Medida |
|--------|--------|
| **Edge** | Cloudflare WAF + DDoS + rate limit L7 (50 req/s/IP) |
| **Rede** | Firewall stateful Hetzner; porta 5432 fechada externamente; sem IP público no DB |
| **Transporte** | TLS 1.3 obrigatório (HSTS); cookies `Secure; HttpOnly; SameSite=Lax` |
| **Aplicação** | SQL parametrizado (Drizzle); CSRF token em mutações; validação Zod em todas as entradas |
| **Autenticação** | Clerk Organizations + MFA opcional; bcrypt para senhas de API (`gf_live_*`) |
| **Banco de dados** | Row-Level Security obrigatória (`FORCE ROW LEVEL SECURITY`); SET LOCAL por conexão |
| **Criptografia em repouso** | Postgres `at-rest encryption`; R2 com AES-256; backups pgBackRest com `aes-256-cbc` |
| **Criptografia em trânsito** | TLS 1.3 interno (Caddy); workers acessam DB por Unix socket |
| **Logs e auditoria** | SigNoz 7 dias; R2 backups 90+ dias; `app.audit_log` imutável (append-only) |
| **Detecção** | Sentry alerts; SigNoz traces; Clerk suspicious-activity emails |
| **Segregação por tenant** | Toda tabela com `tenant_id`; testes de leak no CI |

### 8.2 Medidas organizacionais

- **Treinamento** anual de equipe em LGPD e segurança.
- **Política de menor privilégio** (RBAC em Clerk Organizations:
  owner, admin, editor, viewer).
- **Classificação da informação** (PII marcada no schema Drizzle).
- **DPIA** (Relatório de Impacto à Proteção de Dados) anual para
  novos tratamentos.
- **Política de mesa limpa** e **gestão de senhas** com 1Password.
- **Procedimento de offboarding** remove acessos em ≤ 24h.

---

## 9. Transferência internacional (LGPD art. 33–36)

Alguns subprocessadores estão fora do Brasil. Garantimos que a
transferência é feita **apenas para países com nível adequado de
proteção** ou mediante **cláusulas-padrão contratuais**.

| Subprocessador | País de processamento | Base legal |
|----------------|----------------------|------------|
| Hetzner Online GmbH | Alemanha (Frankfurt) | LGPD art. 33, I — país com proteção adequada |
| Cloudflare Inc | EUA + UE | LGPD art. 33, II — cláusulas-padrão contratuais |
| Clerk | EUA | LGPD art. 33, II — cláusulas-padrão contratuais |
| Resend | EUA | LGPD art. 33, II — cláusulas-padrão contratuais |
| PostHog | EUA + UE | LGPD art. 33, II — cláusulas-padrão contratuais |
| Sentry | EUA + UE | LGPD art. 33, II — cláusulas-padrão contratuais |
| OpenAI / Anthropic (Fase 2) | EUA | LGPD art. 33, II — cláusulas-padrão + cláusula de no-train |

> **Paralelo GDPR**: o GDPR art. 45º-50º regula o mesmo tema; nossas
> cláusulas-padrão são compatíveis com as **Standard Contractual Clauses
> (SCCs)** da Comissão Europeia para clientes europeus.

> **Caso o titular queira cópia das cláusulas-padrão**: solicite via
> `placeholder@easydemo.io` (LGPD art. 33, §2º).

---

## 10. Direitos de crianças e adolescentes

A DemoBR **não é direcionada a menores de 18 anos**. Em caso de
identificação de dado de criança tratado sem consentimento dos
responsáveis, **eliminaremos em até 7 dias** (LGPD art. 14º).

---

## 11. Encarregado de Proteção de Dados (DPO)

**Status atual:** A DemoBR está em processo de nomeação de Encarregado
de Proteção de Dados (DPO) conforme art. 41 da LGPD. A nomeação será
concluída nos próximos 90 dias contados da publicação desta política.

Enquanto isso, qualquer comunicação relacionada à proteção de dados
pessoais deve ser direcionada para:

- **E-mail:** `placeholder@easydemo.io`
- **Assunto:** "DPO - [NOME DO TITULAR] - [MOTIVO]"
- **Prazo de resposta:** 15 dias úteis (art. 18, §5º da LGPD)

Para emergências ou incidentes: `security@easydemo.io`
(resposta inicial em 24h, conforme plano de resposta a incidentes)

Após a nomeação formal, esta seção será atualizada com:

- **Nome** do DPO contratado
- **E-mail funcional** (substituir `placeholder@easydemo.io`)
- **Telefone** (se aplicável)
- **Página pública**: `https://www.easydemo.io/dpo`
- **Formulário DSR**: `https://app.easydemo.io/privacidade/solicitacao`
- **Histórico de nomeações** (para accountability)

O encarregado é o canal oficial de comunicação entre a DemoBR, os
titulares e a **ANPD (Autoridade Nacional de Proteção de Dados)**.

> Detalhes sobre o processo de contratação, persona recomendada,
> critérios de seleção e SLAs do DPO estão em
> [`DPO.md`](./DPO.md) e [`DPO-PROCESS.md`](./DPO-PROCESS.md).

---

## 12. Alterações nesta política

Quando alterarmos esta política:
- Publicamos a versão atualizada nesta mesma URL, com nova data no rodapé.
- Para mudanças **substanciais** (mudança de finalidade, novo
  subprocessador, ampliação de retenção), notificamos por e-mail os
  titulares afetados com **pelo menos 30 dias de antecedência**.
- Versões anteriores ficam disponíveis em
  `https://www.easydemo.io/privacidade/historico`.

---

## 13. Foro

Fica eleito o foro da **Comarca de São Paulo/SP** para dirimir quaisquer
questões relativas a esta política, sem prejuízo do direito do titular
de optar pelo foro de seu domicílio (CDC art. 101, I).

---

## Anexo — Histórico

| Versão | Data | Principais mudanças |
|--------|------|---------------------|
| 0.1 (rascunho) | 18/Out/2026 | Criação inicial — modelo |

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
