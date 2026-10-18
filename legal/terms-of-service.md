# Termos de Uso — DemoBR

> Estes Termos de Uso regulam a relação entre a **DemoBR LTDA** e você,
> pessoa que cria ou utiliza uma conta no produto DemoBR.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Aceitação dos Termos

Ao criar uma conta, acessar o painel `app.demobr.com.br` ou usar
qualquer recurso do DemoBR, você declara que **leu, compreendeu e
concorda** com estes Termos e com a
[Política de Privacidade](./privacy-policy.md).

Se você estiver usando o DemoBR **em nome de uma empresa**, declara
ter autorização para aceitar estes Termos em nome dela, vinculando-a.

Se você **não concorda** com qualquer cláusula, não deve usar o serviço.

---

## 2. Elegibilidade

Para usar o DemoBR, você precisa:

- Ter **18 anos completos** ou mais.
- Ter **capacidade civil plena** (não estar sob interdição).
- Não estar impedido(a) por lei de contratar.
- Residir em país onde o serviço está disponível (atualmente: Brasil).
- Se for usar em nome de empresa, ter poderes para representá-la.

**Crianças e adolescentes** (< 18 anos) podem apenas visualizar demos
públicos hospedados por creators, sem cadastro.

---

## 3. Conta de usuário

### 3.1 Cadastro

Para usar o plano Free, Pro ou Business, você precisa criar uma conta.
Pode fazer por:
- E-mail + senha (com verificação de e-mail).
- Login social com Google (OAuth).

Você se compromete a fornecer **informações verdadeiras, precisas e
atuais**. Manter o e-mail atualizado é fundamental para receber
notificações operacionais e de segurança.

### 3.2 Segurança da conta

Você é responsável por:
- Manter sua **senha em sigilo**.
- **Não compartilhar** credenciais com terceiros.
- **Ativar autenticação multifator (MFA)** quando disponível.
- Notificar a DemoBR imediatamente em `security@demobr.com.br` caso
  suspeite de acesso não autorizado.

A DemoBR **não se responsabiliza** por danos decorrentes de uso não
autorizado da sua conta causado por falha sua em proteger suas
credenciais.

### 3.3 Encerramento da conta

Você pode encerrar sua conta a qualquer momento pelo painel admin ou
solicitando via `placeholder@demobr.com.br` *(placeholder funcional
até a nomeação formal do DPO — ver
[`DPO-PROCESS.md`](./DPO-PROCESS.md))*. Ver §6 (Cancelamento e
reembolso) e a
[Política de Privacidade](./privacy-policy.md) §6 (Retenção).

---

## 4. Planos, pagamentos e cobrança

### 4.1 Planos disponíveis

| Plano | Preço | Recursos principais |
|-------|-------|---------------------|
| Free | R$ 0 | 1 demo, 1 GB de storage, watermark |
| Pro | R$ 49/mês (ou R$ 49 × 12 anual = R$ 488/ano) | 20 demos, 50 GB, sem watermark, domínio custom |
| Business | R$ 199/mês (ou R$ 199 × 12 = R$ 1.908/ano) | Ilimitado, branching, white-label, SLA |

Preços em Real Brasileiro (R$), já incluindo tributos quando
aplicáveis (ISS, PIS, COFINS).

### 4.2 Meios de pagamento

Processamento via **Asaas Gestão Financeira** (CNPJ próprio):

- **PIX**: confirmação em segundos.
- **Boleto bancário**: compensação em 1–3 dias úteis.
- **Cartão de crédito**: Visa, Mastercard, Elo, Hipercard, Amex.

A DemoBR **não armazena** dados de cartão diretamente; o token é
gerenciado pelo gateway Asaas.

### 4.3 NF-e

A DemoBR emite **Nota Fiscal eletrônica (NF-e)** automaticamente para
toda cobrança. A NF-e é enviada por e-mail e fica disponível no painel.

### 4.4 Cobrança recorrente

- A assinatura é cobrada **mensalmente** (ou anualmente, se escolhido)
  na mesma data do mês inicial.
- Em caso de falha de pagamento, você tem **3 tentativas** em 14 dias.
  Após esse prazo, a conta é suspensa.

### 4.5 Alterações de preço

A DemoBR pode alterar preços com aviso prévio de **30 dias**. Para
assinaturas vigentes:
- Se for **aumento**, você pode cancelar e receber **pro-rata** até
  o início do novo ciclo.
- Se for **redução**, aplica automaticamente no próximo ciclo.

---

## 5. Condições do serviço (SLA)

### 5.1 Uptime alvo

| Plano | Uptime mensal alvo | SLA contratual |
|-------|--------------------|----------------|
| Free | sem garantia | best-effort |
| Pro | 99,5 % (≈ 3h36min/mês) | informativo (sem crédito) |
| Business | 99,9 % (≈ 43min/mês) | crédito pro-rata na próxima fatura |

> **Cálculo**: uptime = (minutos totais do mês − minutos de
> indisponibilidade não programada) ÷ minutos totais do mês.
> Janelas de manutenção programada (avisadas com 48h de antecedência)
> não contam como indisponibilidade.

### 5.2 Manutenção programada

Avisamos por e-mail e banner no painel com **pelo menos 48h de
antecedência**. Sempre que possível, fazemos em janelas de baixo
tráfego (Sábados 02:00–06:00 BRT).

### 5.3 Limitação de responsabilidade por uptime

A DemoBR **não garante** que o serviço estará ininterrupto, livre de
erros ou imune a eventos de força maior (ver §9).

---

## 6. Cancelamento e reembolso

### 6.1 Cancelamento

Você pode cancelar a qualquer momento, sem custos:
- **No painel**: `app.demobr.com.br/admin/billing/cancel`.
- **Por e-mail**: `billing@demobr.com.br`.
- **Via formulário DSR**: `app.demobr.com.br/privacidade/solicitacao`.

O cancelamento é **efetivo ao fim do ciclo vigente**. Você continua
com acesso até a data de renovação.

### 6.2 Reembolso

| Situação | Reembolso |
|----------|-----------|
| Cancelamento em até **7 dias** após a primeira cobrança | 100 % integral |
| Cancelamento após 7 dias | Sem reembolso. Acesso até o fim do ciclo |
| Erro de cobrança comprovado (ex.: cobrança duplicada) | 100 % + estorno Asaas |
| Indisponibilidade do SLA Business (§5.1) | crédito pro-rata na próxima fatura |

### 6.3 Downgrade

Você pode fazer **downgrade** (ex.: Business → Pro) a qualquer momento.
A diferença é creditada pro-rata no próximo ciclo.

---

## 7. Uso aceitável

Você concorda em **NÃO**:

- Publicar conteúdo **ilegal** (violência, discurso de ódio, fraude,
  pirataria, pornografia ilegal, drogas).
- Publicar conteúdo que viole **direitos autorais** ou de terceiros.
- Captar leads sem **base legal** (consentimento do lead).
- Fazer **engenharia reversa** do player, do backend ou dos modelos de IA.
- Tentar burlar rate limits, RLS, captchas ou outras medidas de segurança.
- Usar o serviço para enviar **spam** ou mensagens não solicitadas.
- Usar o serviço para **raspar** (scraping) dados de outros tenants.
- Hospedar conteúdo que viole a LGPD (ex.: dado sensível coletado sem
  consentimento específico, art. 11º).

A DemoBR pode **suspender ou encerrar** contas que violem estas regras
(ver §10).

---

## 8. Propriedade intelectual

### 8.1 O que você cria é SEU

Os **demos, screenshots, textos, áudios e outros conteúdos** que você
cria e armazena na DemoBR continuam sendo de **sua propriedade**.

Você nos concede uma **licença mundial, não exclusiva, gratuita e
sublicenciável** para:
- Hospedar e veicular o conteúdo nos players e embeds que você publica.
- Indexar e exibir previews públicos (`og:image`, `og:title`) quando
  você compartilha o link.
- Processar para gerar analytics, OG image, transcrição de áudio
  (operação técnica do serviço).

### 8.2 O que é nosso

O **software, design, marca, código, modelos de IA proprietários**
usados pela DemoBR continuam sendo **nossa propriedade**. Você recebe
apenas uma **licença de uso** durante a vigência do contrato.

A marca "DemoBR" e o logo são **marcas registradas** da DemoBR LTDA.
Você não pode usar nossas marcas sem autorização prévia por escrito.

### 8.3 DMCA / copyright claims

Se você acredita que conteúdo hospedado na DemoBR **viola seus direitos
autorais**, envie uma notificação (DMCA-style) para
`dmca@demobr.com.br` contendo:

1. Assinatura física ou eletrônica.
2. Identificação da obra protegida.
3. Identificação do material infrator com URL específica.
4. Seus dados de contato.
5. Declaração de boa-fé de que o uso não é autorizado.
6. Declaração, sob pena de perjúrio, de que você é o titular ou
   representante autorizado.

Atuamos em **5 dias úteis**. Ver §10 (Suspensão).

> **Paralelo internacional**: este procedimento é compatível com o
> DMCA 17 U.S.C. §512 (EUA), aplicável a clientes que tenham
> presença nos EUA.

---

## 9. Limitações de responsabilidade

Até o limite máximo permitido por lei:

- A DemoBR **não se responsabiliza** por danos indiretos, lucros
  cessantes, perda de dados decorrentes de uso indevido, força maior,
  ou falha de terceiros (internet, subprocessadores).
- A responsabilidade total agregada da DemoBR está limitada ao **valor
  efetivamente pago por você nos 12 meses anteriores**.
- Nada nesta cláusula exclui responsabilidade por dolo ou culpa grave
  (Art. 51, I do CDC).

> ⚠️ **Cláusula potencialmente limitada pelo CDC**: o Código de Defesa
> do Consumidor (Lei 8.078/90) considera nulas cláusulas que limitem
> responsabilidade de forma desproporcional. Advogado deve revisar.

---

## 10. Suspensão e encerramento

### 10.1 Suspensão pela DemoBR

Podemos **suspender** sua conta temporariamente se:

- Houver violação destes Termos (§7).
- Não pagar após as 3 tentativas em 14 dias (§4.4).
- Houver risco de segurança ou de ordem judicial/regulatória.

### 10.2 Encerramento

Podemos **encerrar** definitivamente sua conta se:

- A suspensão durar mais de 30 dias sem resolução.
- Você reincidir em condutas que violem estes Termos.
- Houver ordem judicial, da ANPD, ou de autoridade competente.

Em caso de encerramento:
- Seus dados ficam acessíveis por **30 dias** para download ou reativação.
- Após 30 dias, os dados são **eliminados conforme política de
  retenção** (ver Política de Privacidade §6).
- **Exceção**: dados sob obrigação legal (NF-e: 60 meses) são mantidos.

### 10.3 Efeitos do encerramento pelo usuário

Ver §6.

---

## 11. Alterações nos Termos

Quando alterarmos estes Termos:
- Publicamos a versão atualizada nesta URL com nova data.
- Para mudanças **substanciais** (preço, SLA, casos de suspensão),
  avisamos com **30 dias de antecedência** por e-mail.
- Se você não concordar, pode cancelar antes da vigência (§6.1).
- Versões anteriores em `https://www.demobr.com.br/termos/historico`.

---

## 12. Disposições gerais

- Estes Termos e a Política de Privacidade constituem o **acordo
  integral** entre você e a DemoBR.
- Se uma cláusula for declarada inválida, as demais permanecem em vigor.
- A tolerância com uma parte não implica renúncia de direitos.
- Você **não pode transferir** estes Termos a terceiros sem nosso
  consentimento prévio por escrito.

---

## 13. Foro

Fica eleito o foro da **Comarca de São Paulo/SP**, com renúncia a
qualquer outro, por mais privilegiado que seja, **sem prejuízo** do
direito do consumidor de optar pelo foro de seu domicílio
(CDC art. 101, I).

---

## Anexo — Resumo de contatos

| Assunto | E-mail |
|---------|--------|
| Suporte geral | `suporte@demobr.com.br` |
| Billing / cobrança | `billing@demobr.com.br` |
| Segurança / incidentes | `security@demobr.com.br` |
| Privacidade / DSR | `placeholder@demobr.com.br` *(DPO — placeholder até contratação)* |
| DMCA / copyright | `dmca@demobr.com.br` |
| DPO | `placeholder@demobr.com.br` *(placeholder até contratação; ver `DPO-PROCESS.md`)* |

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
