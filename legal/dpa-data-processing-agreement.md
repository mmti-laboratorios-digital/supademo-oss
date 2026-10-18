# Acordo de Tratamiento de Dados Pessoais (DPA) — DemoBR

> Este **Data Processing Agreement** ("DPA") é firmado entre a
> **DemoBR LTDA** e o **Cliente** identificado no formulário de aceite
> na contratação.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de uso público.**
>
> Este DPA é assinado **eletronicamente** no momento da contratação do
> plano Business e **vigorará enquanto houver relação contratual**.

---

## Preâmbulo

Considerando que a DemoBR LTDA opera plataforma SaaS de demos
interativas que envolve o tratamento de dados pessoais;

Considerando a **Lei Geral de Proteção de Dados (LGPD — Lei
13.709/2018)**, em especial os arts. 33, 39, 46 e 48;

Considerando as práticas de mercado e o precedente internacional do
GDPR (Reg. UE 2016/679), em especial os arts. 28, 32 e 44;

As Partes celebram este DPA, que integra o contrato principal de
adesão ao DemoBR.

---

## 1. Definições

| Termo | Definição |
|-------|-----------|
| **LGPD** | Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais) |
| **GDPR** | Regulamento (UE) 2016/679 (referência interpretativa) |
| **Dados Pessoais** | Conforme definição em LGPD art. 5º, I |
| **Titular** | Pessoa natural a quem se referem os dados pessoais |
| **Controlador** | Pessoa natural ou jurídica, de direito público ou privado, a quem competem as decisões referentes ao tratamento de dados pessoais (LGPD art. 5º, VI) |
| **Operador** | Pessoa natural ou jurídica, de direito público ou privado, que realiza o tratamento de dados pessoais em nome do controlador (LGPD art. 5º, VII) |
| **Subprocessador** | Terceiro contratado pelo Operador para realizar tratamento específico de dados pessoais em nome do Controlador (análogo ao "subprocessor" do GDPR art. 28, §4º) |
| **DPIA / RIPD** | Relatório de Impacto à Proteção de Dados (LGPD art. 38) |
| **Incidente** | Ocorrência que comprometa confidencialidade, integridade, disponibilidade ou autenticidade dos dados pessoais |

---

## 2. Papéis e responsabilidades

> ⚠️ A relação **Controlador × Operador** varia conforme a origem dos
> dados tratados. Veja a tabela abaixo.

| Origem do dado | Quem é Controlador | Quem é Operador | Onde está |
|---------------|-------------------|-----------------|-----------|
| Dados da conta do **Cliente** (creator) | Cliente | DemoBR | Conta do Cliente |
| Leads captados em **demo do Cliente** | Cliente | DemoBR | `/d/[slug]` |
| Dados de **visitante** de demo público | Cliente (workspace owner) | DemoBR | Analytics |
| Dados de **contato comercial** da DemoBR LTDA | DemoBR | — | CRM próprio |
| Dados de **billing** processados por Asaas | DemoBR | Asaas | Asaas |

> A DemoBR atua predominantemente como **operador** no contexto do
> serviço SaaS de demos.

---

## 3. Finalidade, natureza e duração do tratamento

### 3.1 Finalidade

A DemoBR trata dados pessoais **exclusivamente** para:

- Operar o serviço contratado (criação, hospedagem e analytics de demos).
- Cumprir obrigações contratuais e legais.
- Manter a segurança da plataforma.
- Prestar suporte técnico e DSR.
- Cumprir ordens de autoridades públicas.

Nenhuma outra finalidade é autorizada sem novo consentimento específico.

### 3.2 Natureza do tratamento

Operações realizadas pela DemoBR:
- Coleta (apenas o que o Cliente insere).
- Armazenamento (Postgres + R2).
- Processamento (analytics, TTS, OG image generation).
- Visualização pública (player + embed).
- Eliminação (por DSR ou retenção expirada).

### 3.3 Duração

Do início ao fim do contrato principal. Após o término, os dados são
**eliminados conforme política de retenção** (§10 e Política de
Privacidade §6), salvo obrigação legal de manter.

---

## 4. Tipos de dados pessoais tratados

Ver **Anexo I — Schema de dados pessoais tratados** ao final deste
documento.

Resumo:

| Categoria | Dados típicos | Origem |
|-----------|--------------|--------|
| Identificação | Nome, e-mail, URL de foto | Cadastro |
| Contato | Telefone (opcional) | Lead form |
| Autenticação | Hash bcrypt, OAuth tokens | Clerk |
| Conteúdo | Screenshots, textos, áudios | Criado pelo Cliente |
| Comportamentais | Métricas de visualização agregadas | Analytics |
| Pagamento | CPF/CNPJ do pagador, NF-e | Asaas |
| Auditoria | Logs de acesso, eventos DSR | Sistema |

> **Importante**: a DemoBR **não** foi projetada para tratar dados
> sensíveis (LGPD art. 5º, II). O Cliente está proibido de capturar
> ou armazenar esse tipo de dado.

---

## 5. Obrigações do Operador (LGPD art. 39)

A DemoBR LTDA, na qualidade de Operador, obriga-se a:

| Obrigação | Como cumpre |
|-----------|-------------|
| **a)** Realizar o tratamento conforme as instruções do Controlador (LGPD art. 39, I) | Este DPA é a fonte canônica de instruções; mudanças precisam de aditivo |
| **b)** Observar a LGPD e demais legislações aplicáveis | Programa LGPD-internalizado + DPO + revisão anual |
| **c)** Garantir sigilo e segurança dos dados (art. 39, II) | Criptografia at-rest + in-transit; RLS; ACLs |
| **d)** Subcontratar apenas com autorização específica (art. 39, III) | [Lista de subprocessadores](./subprocessors-list.md) com +30 dias de aviso para mudanças; autorização escrita do Cliente para mudanças relevantes |
| **e)** Auxiliar o Controlador no cumprimento dos direitos do titular (art. 39, IV) | Endpoint DSR (`/api/v1/dsr`) + scripts + SLAs |
| **f)** Auxiliar na notificação de incidentes (art. 39, V) | 60min comunicação interna + 24h comunicação externa |
| **g)** Tornar disponíveis informações para auditoria (art. 39, VI) | Audit log + relatórios + auditoria anual |
| **h)** Devolver/eliminar dados ao término (art. 39, VII) | Procedimento em `RTBF-deletion-procedure.md` |
| **i)** Não transferir dados sem autorização (art. 33) | Conforme §7 deste DPA |

---

## 6. Medidas técnicas e organizacionais (LGPD art. 46)

A DemoBR adota, sem prejuízo de outras, as seguintes medidas:

### 6.1 Medidas técnicas

| Camada | Medida |
|--------|--------|
| **Edge / Rede** | Cloudflare WAF + DDoS; firewall stateful Hetzner; TLS 1.3 + HSTS; sem exposição do DB |
| **Aplicação** | SQL parametrizado (Drizzle); validação Zod; CSRF token; rate limit |
| **Auth** | Clerk + MFA opcional; bcrypt + salt; tokens curtos para API |
| **Banco de dados** | Row-Level Security (`FORCE RLS`); SET LOCAL por conexão; roles separadas (app, worker) |
| **Criptografia em repouso** | Postgres at-rest encryption; R2 SSE-S3 + AES-256; backups pgBackRest com `aes-256-cbc` |
| **Criptografia em trânsito** | TLS 1.3 interno; unix socket para worker↔DB |
| **Auditoria** | `app.audit_log` (insert-only, imutável); SigNoz 7d; R2 backup 90+d |
| **Detecção** | Sentry alerting; SigNoz traces; Clerk suspicious-activity; PagerDuty 24/7 |
| **Segregação por tenant** | Toda tabela com `tenant_id`; testes CI de leak entre workspaces |

### 6.2 Medidas organizacionais

- **Política interna de LGPD** assinada por todos os funcionários.
- **Treinamento anual** em proteção de dados.
- **Classificação da informação** (PII marcado no schema).
- **Background check** de funcionários com acesso a produção.
- **DPO designado** como canal com ANPD.
- **DPIA anual** para novos tratamentos.
- **Política de menor privilégio** (RBAC: owner, admin, editor, viewer).
- **Rotação trimestral** de credenciais e chaves de API.

---

## 7. Notificação de incidentes (LGPD art. 48)

### 7.1 Compromisso de tempo

| Etapa | SLA |
|-------|-----|
| Detecção → triagem interna | ≤ 60 minutos |
| Comunicação interna (Cliente) | ≤ 60 minutos após confirmação |
| Comunicação à ANPD | ≤ 24 horas após confirmação |
| Comunicação aos titulares afetados | ≤ 72 horas após confirmação |

### 7.2 Conteúdo da notificação

A DemoBR informará ao Cliente:
- Descrição do incidente.
- Categorias de dados afetados.
- Número estimado de titulares afetados.
- Medidas de mitigação adotadas.
- Plano de remediação.
- Contato para mais detalhes (`security@demobr.com.br`).

### 7.3 Colaboração na notificação

A DemoBR apoiará o Cliente na:
- Elaboração do texto da comunicação aos titulares.
- Compilação de informações para a ANPD.
- Investigação forense (acesso a logs preservados).

Detalhes operacionais em
[`incident-response-plan.md`](./incident-response-plan.md).

---

## 8. Subcontratação e transferência internacional

### 8.1 Subprocessadores autorizados

A DemoBR pode contratar os subprocessadores listados em
[`subprocessors-list.md`](./subprocessors-list.md), cada um com DPA
específico assinado contendo:

- Finalidade limitada.
- Confidencialidade de todos os envolvidos.
- Medidas técnicas e organizacionais alinhadas com a LGPD art. 46.
- Auxílio ao Controlador em direitos do titular.
- Devolução/eliminação ao término do contrato.

### 8.2 Aviso de novos subprocessadores

A DemoBR comunicará novos subprocessadores com **pelo menos 30 dias
de antecedência** por e-mail ao DPO do Cliente. O Cliente terá direito
de **opor-se** em 15 dias; caso se oponha justificadamente em
conformidade com a LGPD, a DemoBR buscará alternativa ou permitirá
cancelamento sem ônus.

> **Paralelo GDPR**: este mecanismo segue GDPR art. 28, §2º.

### 8.3 Transferência internacional

A DemoBR pode transferir dados para países listados em
[`subprocessors-list.md`](./subprocessors-list.md), mediante:

- **Países com nível adequado** (LGPD art. 33, I) — ex.: Alemanha.
- **Cláusulas-padrão contratuais** (LGPD art. 33, II) — ex.: EUA.
- **Cooperação entre autoridades** (LGPD art. 33, IV).

Cópia das cláusulas-padrão contratuais pode ser solicitada via
`placeholder@demobr.com.br` (encaminhado para a liderança da DemoBR
até a nomeação formal do DPO — ver `DPO-PROCESS.md`).

---

## 9. Direitos do titular (LGPD art. 18)

### 9.1 Auxílio ao Controlador

A DemoBR auxiliará o Cliente no cumprimento dos direitos do titular
por meio de:

| Direito (LGPD art. 18) | Suporte |
|------------------------|---------|
| I. Confirmação da existência | [`RTBF-template.md`](./RTBF-template.md) |
| II. Acesso | [`RTBF-data-export-schema.json`](./RTBF-data-export-schema.json) |
| III. Correção | Endpoint `/api/v1/dsr` PATCH |
| IV. Anonimização / bloqueio | Job no `graphile-worker` |
| V. Portabilidade | Export JSON estruturado |
| VI. Eliminação | [`RTBF-deletion-procedure.md`](./RTBF-deletion-procedure.md) |
| VII. Informações de entidades | Lista de subprocessadores |
| VIII–X. Demais | Suporte via `placeholder@demobr.com.br` |

### 9.2 SLA de resposta a DSR

- **Titulares diretamente ao Controlador**: SLA definido na Política
  de Privacidade.
- **Cliente → DemoBR**: a DemoBR atenderá pedidos internos do Cliente
  em **5 dias úteis**, prorrogáveis por mais 5 mediante justificativa.

---

## 10. Término do contrato e devolução/eliminação

### 10.1 Ao término

- A DemoBR fornece **export completo** dos dados do Cliente em até
  **30 dias** após o término.
- Após o export ou após 30 dias (o que ocorrer primeiro), os dados
  são **eliminados** conforme procedimento em
  [`RTBF-deletion-procedure.md`](./RTBF-deletion-procedure.md).
- **Exceção legal**: dados sob obrigação (NF-e, logs fiscais) são
  mantidos pelo prazo legal; depois, eliminados.

### 10.2 Export

Formato: JSON estruturado (mesmo do DSR, agregando todos os tenants).

---

## 11. Auditoria (LGPD art. 39, VI e 50)

### 11.1 Direito do Controlador

O Cliente pode solicitar auditoria anual, mediante:

- Aviso prévio de **30 dias**.
- Realização em horário comercial (BRT) sem afetar produção.
- Confidencialidade dos achados até plano de remediação público.
- Custos arcados pelo Cliente, salvo se achados forem relevantes
  (escopo > 5% das verificações).

### 11.2 Relatórios fornecidos pela DemoBR

- **SOC 2 Type II** (roadmap — ver `docs/SECURITY-MODEL.md` §11).
- **DPIA anual** para novos tratamentos.
- **Resumo de incidentes** do ano (SEV-1 e SEV-2), após 60 dias.
- **Relatório de uptime** real × SLA (Business tier).

---

## 12. Encarregado (DPO) (LGPD art. 41)

**Status atual:** A DemoBR está em processo de nomeação formal do
Encarregado de Proteção de Dados (DPO) conforme art. 41 da LGPD.
A nomeação será concluída em até **90 dias** da publicação.

Enquanto isso:

- **E-mail (placeholder funcional)**: `placeholder@demobr.com.br`
- **Encaminhamento**: alias que direciona para a liderança da DemoBR.
- **Prazo de resposta**: 15 dias úteis (LGPD art. 18, §5º).
- **Página pública** (a publicar): `https://www.demobr.com.br/dpo`.
- **Reporte direto com ANPD** (LGPD art. 41, §1º) — após nomeação.

> Detalhes sobre persona, critérios de seleção, processo de
> contratação e SLAs em [`DPO.md`](./DPO.md) e
> [`DPO-PROCESS.md`](./DPO-PROCESS.md).

---

## 13. Disposições finais

- **Lei aplicável**: República Federativa do Brasil (LGPD).
- **Foro**: Comarca de São Paulo/SP, sem prejuízo do foro do domicílio
  do consumidor (CDC).
- **Alterações**: este DPA pode ser atualizado pela DemoBR mediante
  aviso de 30 dias; mudanças nas finalidades ou natureza exigem
  novo aceite escrito.
- **Nulidade parcial**: se uma cláusula for declarada inválida, as
  demais permanecem.
- **Não exclusividade**: nada neste DPA impede a DemoBR de tratar
  dados para outros Clientes ou para finalidades próprias
  (ex.: analytics agregada, sempre sem PII).

---

## Anexo I — Schema de dados pessoais tratados

```json
{
  "controlador": "<workspace_id do Cliente>",
  "categorias_de_titulares": [
    "Creator (usuário com conta na DemoBR)",
    "Lead (visitante que preencheu formulário em um demo)",
    "Viewer (visitante anônimo de demo público)"
  ],
  "tipos_de_dados": {
    "identificacao": ["nome", "email", "url_foto"],
    "autenticacao": ["hash_senha", "oauth_provider_id"],
    "contato": ["telefone (opcional)"],
    "conteudo": ["screenshots", "textos", "audios", "narração TTS"],
    "comportamentais": ["step_visto", "tempo_no_step", "drop_off", "cta_clicado"],
    "pagamento": ["cpf_cnpj_do_pagador", "endereço_de_cobrança", "histórico_de_pagamento"],
    "auditoria": ["log_acessos", "log_alteracoes", "eventos_dsr"],
    "metadata_geografica_derivada": ["pais_por_accept_language", "device_category"]
  },
  "NÃO_tratamos": [
    "dados_sensiveis_LGPD_art_5_II",
    "biometria_para_identificacao",
    "dados_de_criancas_menores_de_18",
    "cpf_referente_a_pessoa_fisica_como_lead"
  ],
  "subprocessadores": "ver subprocessores-list.md",
  "localizacao_processamento": ["Brasil (Postgres primário)", "Alemanha (DB replica para backup)", "EUA (subprocessadores conforme lista)"],
  "retencao": "ver Política de Privacidade §6",
  "formato_export_dsr": "ver RTBF-data-export-schema.json"
}
```

---

## Anexo II — SLA da DemoBR (referência rápida)

| Item | Free | Pro | Business |
|------|------|-----|----------|
| Uptime alvo | best-effort | 99,5 % informativo | 99,9 % contratual (crédito pro-rata) |
| Suporte | comunidade | e-mail 48h | e-mail 4h + chat |
| DSR SLA interno | 15 dias LGPD | 15 dias | 7 dias |
| Auditoria | — | anual | semestral |
| Notificação de incidente | 72h | 48h | 24h |

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
