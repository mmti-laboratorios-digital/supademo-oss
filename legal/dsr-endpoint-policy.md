# Política do Endpoint DSR (LGPD art. 18)

> Define como a DemoBR responde aos pedidos de titulares relativos aos
> 10 direitos previstos no art. 18 da LGPD.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Quem pode pedir?

Qualquer pessoa física ("titular") cujos dados pessoais são tratados
pela DemoBR, em um dos seguintes papéis:

| Papel | Quem é? |
|-------|---------|
| **Creator** | Conta registrada no DemoBR |
| **Lead** | Captou e-mail/telefone em um demo |
| **Viewer** | Visitou um demo público (anonimamente) |
| **Antigo creator** / ex-lead | Conta desativada, mas ainda em retenção |
| **Representante legal** | Advogado, pai/mãe de menor, curador — mediante procuração |

> **Visitante anônimo sem rastreamento**: se uma pessoa cujo IP nunca
> foi armazenado e cujo User-Agent foi apenas hasheado solicita DSR,
> a DemoBR responderá explicando que não há dados que possam
> identificá-la, com prova dessa ausência (vide §5 RTBF-template.md).

---

## 2. Como pedir?

Oferecemos **2 canais oficiais**:

### 2.1 Formulário público (recomendado)

`https://app.easydemo.io/privacidade/solicitacao`

Campos obrigatórios:
- Nome completo
- E-mail de contato
- Tipo de titular (Creator / Lead / Viewer / Outro)
- **Prova de identidade** (anexar):
  - RG, CNH ou passaporte (foto nítida, frente e verso).
  - Selfie segurando o documento.
  - Para representantes: procuração e documento do representado.
- Qual direito está exercendo (ver §4)
- Descrição breve do pedido

### 2.2 E-mail

`placeholder@easydemo.io` com:
- Assunto "DSR — [direito escolhido]"
- Anexar mesma prova de identidade do item anterior

> O e-mail acima é um **placeholder funcional** enquanto a DemoBR
> não concluiu a nomeação formal do DPO. Ver
> [`DPO-PROCESS.md`](./DPO-PROCESS.md) para o cronograma de
> contratação (até 90 dias).

---

## 3. Tempo de resposta

| Etapa | SLA |
|-------|-----|
| Confirmação de recebimento | ≤ 2 dias úteis |
| Verificação de identidade | ≤ 3 dias úteis |
| Resposta substantiva | **≤ 15 dias** (LGPD art. 18, §5º) |
| Prorrogação justificável | **+15 dias** (com aviso ao titular) |
| Total máximo | **30 dias** |

> ⚠️ Em **LGPD art. 18, §5º** o prazo é de "razoável oportunidade"
> sem definir dias específicos; 15 dias é a referência da
> interpretação convergente com o GDPR (art. 12º, §3º: 1 mês).

Em **casos complexos** (suspeita de fraude, volume muito grande),
podemos usar o prazo máximo de 30 dias **mediante justificativa
por escrito ao titular**.

---

## 4. Tipos de pedidos (LGPD art. 18, I-X)

### 4.1 Confirmação da existência de tratamento (art. 18, I)

**Ação**: confirmar se a DemoBR trata dados do requerente.
**Resposta**: modelo em [`RTBF-template.md`](./RTBF-template.md).
**Formato**: e-mail + documento PDF simples (carta).

### 4.2 Acesso aos dados (art. 18, II)

**Ação**: entregar uma **cópia completa** dos dados tratados.
**Formato**: **JSON** estruturado conforme
[`RTBF-data-export-schema.json`](./RTBF-data-export-schema.json).
**Empacotamento**: ZIP com senha enviada por canal separado.
**Prazo**: 15 dias.

### 4.3 Correção (art. 18, III)

**Ação**: o titular informa o dado incorreto/desatualizado e a DemoBR
corrige.
**Formato**: endpoint PATCH / formulário web.
**Prazo**: 7 dias.

### 4.4 Anonimização, bloqueio ou eliminação (art. 18, IV)

> Atenção: esta cláusula cobre **dados desnecessários ou excessivos**
> ou **tratados em desconformidade com a LGPD**. Diferente do direito
> de eliminação do art. 18, VI.

**Ação**: substituição do dado identificável por hash irreversível,
ou bloqueio (sem apagar definitivamente) por prazo determinado.
**Procedimento técnico**: hash sha256 + sal rotativo, com registro em
`app.dsr_log`.
**Prazo**: 7 dias.

### 4.5 Portabilidade (art. 18, V)

**Ação**: o titular recebe seus dados em **formato estruturado e
interoperável** (JSON ou CSV).
**Formato**: ver [`RTBF-data-export-schema.json`](./RTBF-data-export-schema.json).
**Prazo**: 15 dias.

### 4.6 Eliminação (art. 18, VI)

**Ação**: apagar todos os dados tratáveis a pedido do titular.
**Exceções legais**: dados sob obrigação legal são mantidos pelo
prazo da obrigação (ex.: NF-e: 60 meses).
**Procedimento**: [`RTBF-deletion-procedure.md`](./RTBF-deletion-procedure.md).
**Prazo**: 7 dias para soft-delete + 30 dias para hard-delete.

### 4.7 Informações sobre compartilhamento (art. 18, VII)

**Ação**: informar com **quais entidades** públicas e privadas houve
compartilhamento.
**Resposta**: link para [`subprocessors-list.md`](./subprocessors-list.md)
+ entidades públicas específicas que solicitaram dados (se houver).
**Prazo**: 7 dias.

### 4.8 Informação sobre a possibilidade de não fornecer consentimento (art. 18, VIII)

**Ação**: informar que o consentimento é opcional e as consequências
de não fornecer (ex.: não capturar leads se recusar).
**Resposta**: texto padrão explicativo.
**Prazo**: imediato (banner de consentimento já cobre).

### 4.9 Revogação do consentimento (art. 18, IX)

**Ação**: cessar o tratamento baseado em consentimento.
**Efeito**: **ex-nunc** (daqui pra frente).
**Prazo**: 7 dias.

### 4.10 Reclamação à ANPD (art. 18, X)

**Ação**: informar o canal oficial da ANPD.
**Resposta**: texto padrão com link.
**Link**: `https://www.gov.br/anpd/`

---

## 5. Endpoint técnico (interno)

> Esta seção descreve o endpoint para integrações B2B e auditoria.
> Não é exposto ao usuário final.

```
GET    /api/v1/dsr?token=...   lista direitos do titular
GET    /api/v1/dsr/export?token=...   exporta JSON (LGPD art. 18, II e V)
DELETE /api/v1/dsr?token=...   inicia eliminação (LGPD art. 18, VI)
PATCH  /api/v1/dsr?token=...   corrige um dado
```

- `token` é um JWT assinado com chave DemoBR, de uso único, válido
  por 30 dias.
- Toda chamada gera entrada em `app.dsr_log` (LGPD art. 37 + art. 50).
- Logs ficam retidos por **24 meses** (compliance) e são pseudonymizados
  após 90 dias (substitui e-mail por hash sha256).

---

## 6. Logs de operações DSR (LGPD art. 37 + 50)

Toda DSR gera registro **imutável** em `app.dsr_log`:

```sql
CREATE TABLE app.dsr_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  subject_email   text NOT NULL,           -- e-mail declarado pelo titular
  subject_hash    text,                    -- hash sha256 para pseudonymizar após 90d
  action          text NOT NULL,           -- 'confirm' | 'export' | 'delete' | 'patch' | 'revoke'
  status          text NOT NULL,           -- 'pending' | 'in_progress' | 'done' | 'rejected'
  rejection_reason text,                   -- ex.: 'identity_not_confirmed'
  ip_hash         text,                    -- hash do IP com salt rotativo
  user_agent_hash text,                    -- hash do User-Agent
  artifact_id     text,                    -- S3/R2 key do export gerado (se houver)
  attachments     jsonb,                   -- ex.: {"json_size_kb": 1023, "rows": 1234}
  CONSTRAINT dsr_log_immutable_v1
    -- somente INSERT permitido
);

REVOKE UPDATE, DELETE ON app.dsr_log FROM PUBLIC;
GRANT INSERT, SELECT ON app.dsr_log TO app_worker;
```

> **Imutabilidade**: o `UPDATE` / `DELETE` são removidos por padrão.
> Apenas o role `app_dpo` pode excepcionalmente corrigir registros
> (ex.: erro de digitação do e-mail do titular) — e essa correção é
> logada em `app.dsr_log_corrections` para accountability.

---

## 7. Verificação de identidade

Para evitar fraudes, exigimos prova de identidade em todos os pedidos.
Padrão de verificação:

1. **Confirmação por e-mail de controle**: o titular recebe um link
   único no e-mail declarado.
2. **Documento de identidade**: foto do RG/CNH/passaporte.
3. **Selfie com documento**: mostra que é o titular do documento.
4. **Em caso de dúvida**: videochamada agendada.

Para **representantes legais**: procuração pública e documento do
representado.

---

## 8. Recusa justificada

A DemoBR pode **recusar** DSR mediante justificativa (LGPD art. 18, §7º):

- Pedido **genérico** que não permite identificação do titular.
- Pedido com **indícios de fraude**.
- Pedido de **eliminação** de dado sob obrigação legal (ex.: NF-e).
- Pedido **repetido** em intervalo curto sem motivo novo.

Em todos os casos de recusa, registramos em `app.dsr_log` e oferecemos
ao titular o canal da ANPD.

---

## 9. Contato

- **DPO (placeholder funcional)**: `placeholder@easydemo.io`
  *(a ser substituído pelo e-mail real do DPO após contratação — ver
  `DPO-PROCESS.md`)*
- **Formulário**: `https://app.easydemo.io/privacidade/solicitacao`
- **Página pública**: `https://www.easydemo.io/dpo`

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
