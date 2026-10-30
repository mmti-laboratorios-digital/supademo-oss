# Modelo de Resposta — Confirmação de Tratamento (LGPD art. 18, I)

> Modelo de carta/resposta para o pedido de **confirmação da
> existência de tratamento** previsto no art. 18, I da LGPD.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de uso público.**

---

## Quando usar

Quando o titular solicita, nos termos do LGPD art. 18, I, que a
EasyDemo confirme se trata ou não dados pessoais seus.

---

## Variáveis do template

Antes de preencher, colete:

| Variável | Origem |
|----------|--------|
| `{nome_do_titular}` | declarado no pedido |
| `{documento}` | RG/CNH declarado |
| `{email_easydemo}` | email do titular em nossos sistemas (pode ser null) |
| `{data_pedido}` | timestamp do ticket DSR |
| `{categorias_dados}` | categorias que tratamos (ver §A) |
| `{finalidades}` | finalidades específicas (ver §B) |
| `{retencao}` | prazo de retenção conforme tabela |

---

## A — Categorias de dados que tratamos

Escolher conforme a origem do titular:

### Titular é Creator (tem conta)

- Dados cadastrais (nome, e-mail)
- Dados de autenticação (hash de senha, OAuth tokens)
- Conteúdo criado (demos, screenshots, áudios)
- Dados de billing (CPF/CNPJ do pagador)
- Eventos de auditoria (login, ações no painel)

### Titular é Lead (não tem conta)

- Nome e e-mail fornecidos no lead form
- Timestamp e IP hasheado do consentimento (prova)
- Conteúdo capturado no momento do consentimento

### Titular é Viewer (visitante anônimo)

- Hash de identificador único (cookie `_pk_id` hash)
- Eventos de visualização agregados (step, tempo, CTA)
- Locale (Accept-Language)
- Device category
- **Nada mais** — sem IP, sem nome.

### Titular é desconhecido / não-localizável

- "Confirmamos que NÃO tratamos dados pessoais que permitam
  identificá-lo(a) como titular em nossos sistemas."

---

## B — Finalidades típicas

- Execução do contrato de prestação do serviço de demos (LGPD art. 7º, V).
- Processar pagamentos e emitir NF-e (LGPD art. 7º, V).
- Comunicação operacional (e-mails transacionais — LGPD art. 7º, V).
- Cumprimento de obrigações legais (LGPD art. 7º, II).
- Exercício regular de direitos em processos (LGPD art. 7º, VI).
- Legítimo interesse em segurança e prevenção a fraude
  (LGPD art. 7º, IX).

---

## C — Modelo de carta-resposta

```
EasyDemo LTDA — CNPJ XX.XXX.XXX/0001-XX
Rua Exemplo, nº 123, sala 45, Centro, Cidade/UF, CEP XXXXX-XXX
E-mail do DPO: placeholder@easydemo.io *(placeholder funcional
até a nomeação formal do DPO — ver `DPO-PROCESS.md`)*

{dia} de {mês} de {ano}

A/C
Sr(a). {nome_do_titular}
E-mail: {email_de_contato}
Documento: {documento}

Assunto: Resposta à solicitação DSR nº {ticket_id} — Confirmação de
Existência de Tratamento (LGPD art. 18, I)

Prezado(a) Sr(a). {nome_do_titular},

Recebemos em {data_pedido} sua solicitação de confirmação de
existência de tratamento de dados pessoais, formulada com base no
art. 18, I, da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
Agradecemos o contato e confirmamos o recebimento.

Após verificação da sua identidade, vimos informar:

1. CONFIRMAÇÃO DE TRATAMENTO

   [Opção A — Tratamos dados]
   Confirmamos que a EasyDemo LTDA trata dados pessoais seus,
   conforme detalhado abaixo, em razão da sua relação conosco
   na qualidade de {creator / lead / visitante / outro}.

   [Opção B — Não tratamos dados que o(a) identifiquem]
   Informamos que a EasyDemo LTDA NÃO trata dados pessoais que
   permitam identificá-lo(a) como titular específico em nossos
   sistemas. As únicas informações registradas para acessos ao
   player público são agregadas e anonimizadas, conforme nossa
   Política de Privacidade.

   [Opção C — Tratamento concluído / parcialmente eliminado]
   Confirmamos que tratamos dados seus até {data}, quando, em
   razão de {DSR anterior / cancelamento / expiração de
   retenção}, foram eliminados / anonimizados conforme
   procedimento padrão. Não mantemos cópia identificável de
   seus dados.

2. CATEGORIAS DE DADOS TRATADOS

   {listar conforme §A acima}

3. FINALIDADES DO TRATAMENTO

   {listar conforme §B acima}

4. BASES LEGAIS

   {LGPD art. 7º, V (execução de contrato) — para billing e
   prestação do serviço}
   {LGPD art. 7º, I (consentimento) — para captação de leads}
   {LGPD art. 7º, IX (legítimo interesse) — para analytics e
   prevenção a fraude}

5. COMPARTILHAMENTO

   Seus dados podem ter sido compartilhados com os subprocessadores
   listados em https://www.easydemo.io/subprocessadores, sob
   cláusulas-padrão contratuais em conformidade com LGPD art. 33.

6. RETENÇÃO

   Aplicam-se os seguintes prazos de retenção (Política de
   Privacidade §6):
   {tabela específica}

7. SEUS DEMAIS DIREITOS

   Você pode exercer a qualquer momento os demais direitos
   previstos no LGPD art. 18, II a X, por meio do formulário
   https://app.easydemo.io/privacidade/solicitacao ou pelo
   e-mail placeholder@easydemo.io *(placeholder até contratação
   do DPO — ver `DPO-PROCESS.md`)*.

8. CANAL COM A ANPD

   Em caso de discordância com a presente resposta, você tem o
   direito de peticionar à Autoridade Nacional de Proteção de
   Dados (ANPD), em www.gov.br/anpd, ou ao Poder Judiciário,
   conforme LGPD art. 18, X.

Permanecemos à disposição para esclarecimentos.

Atenciosamente,

─────────────────────────────────────────
{nome_do_DPO}
Encarregado (DPO) — EasyDemo LTDA
E-mail: placeholder@easydemo.io *(placeholder até contratação
formal — ver `DPO-PROCESS.md`)*
```

---

## D — Observações operacionais

- **Tempo de envio**: ≤ 15 dias após recebimento (LGPD art. 18, §5º).
- **Formato de envio**: PDF assinado digitalmente (ou texto simples
  com assinatura visual do DPO).
- **Registro**: enviar via canal autenticado (e-mail de
  `placeholder@easydemo.io` para o e-mail declarado pelo titular
  — placeholder funcional até a contratação formal do DPO).
- **Log**: registrar em `app.dsr_log` com `action='confirm'`,
  `status='done'`.
- **Próxima interação**: oferecer proativamente os outros direitos
  (acesso, portabilidade) — boa prática alinhada ao GDPR.

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
EasyDemo LTDA — CNPJ XX.XXX.XXX/0001-XX
```
