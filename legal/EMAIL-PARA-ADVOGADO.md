# 📧 Modelo de E-mail para Contratação de Advogado(a)

> Template para entrar em contato com advogado(a) especializado(a)
> em LGPD e proteção de dados para revisão dos documentos em
> `legal/`. Adaptar `[placeholders]` antes de enviar.
>
> **Gerado em 18/Out/2026**.

---

## ✉️ Modelo 1 — Primeiro contato (cold outreach)

```
Assunto: EasyDemo — revisão de modelos jurídicos (LGPD/SaaS) — orçamento estimado

Olá Dr(a). [NOME_DO_ADVOGADO],

Somos a [NOME_DA_EMPRESA] ([EASYDEMO]), startup brasileira lançando SaaS
de demos interativas (modelo Supademo). Nossa stack é multi-tenant
com dados de creators e leads capturados por demos interativos.

Preciso de revisão jurídica dos modelos em anexo:

  • Política de Privacidade (LGPD)
  • Termos de Uso (CDC + CC)
  • DPA — Acordo de Tratamento de Dados Pessoais (B2B)
  • Política de Cookies
  • Lista de Subprocessadores
  • Política do Endpoint DSR (LGPD art. 18)
  • Plano de Resposta a Incidentes (LGPD arts. 46/48/49)
  • Procedimento de Eliminação de Dados (LGPD art. 18, VI)
  • Schema JSON do export DSR
  • Modelo de carta-resposta para confirmação de tratamento
  • Changelog do DPO

Total: 11 documentos modelo + 1 checklist para a revisão.

Estes documentos foram gerados como rascunhos em 2026-10 com base
em nossa leitura da LGPD (Lei 13.709/2018), GDPR (referência), Código
Civil (Lei 10.406/2002) e CDC (Lei 8.078/1990). NÃO foram revisados
por advogado até o momento. Precisamos de revisão antes da publicação
pública, que está prevista para [DATA_DE_PUBLICACAO].

Somos PLG/self-serve, sem call de vendas. Os documentos atendem:
  • Visitantes anônimos de demos públicos
  • Creators que assinam planos pagos (Free, Pro R$ 49/mês,
    Business R$ 199/mês)
  • Leads captados via formulário dentro de demos
  • Clientes B2B (plano Business, incluindo potenciais clientes
    estrangeiros — mas só Brasil por enquanto)

O orçamento estimado que podemos alocar para essa revisão é
R$ [VALOR_MINIMO]–[VALOR_MAXIMO] reais. Prazo ideal: até
[DATA_PRAZO].

Conteúdo técnico disponível para consulta:
  • Documentação de segurança interna (`docs/SECURITY-MODEL.md`)
  • Lista de subprocessadores com DPA assinado (parcial)
  • Stack: Next.js 15 + Clerk + Asaas + Hetzner + Cloudflare +
    Resend + Sentry + PostHog
  • Modelo de banco PostgreSQL com RLS por tenant

Posso agendar 30min para alinhamento inicial? Estou disponível nos
próximos dias [LISTA_DE_DATAS].

Atenciosamente,
[NOME_DO_REMETENTE]
[Cargo — ex.: CEO / Head of Legal / CTO]
[Email]
[Telefone opcional]

Anexo 1: link para `legal/ADVOGADO-CHECKLIST.md` (checklist detalhado
         para a revisão)
Anexo 2: ZIP com os 11 documentos modelo
```

---

## ✉️ Modelo 2 — Resposta a advogado que respondeu

```
Assunto: Re: [assunto original]

Olá Dr(a). [NOME],

Muito obrigado pela resposta rápida! Fico feliz com o interesse.

Sobre sua proposta:
  • Escopo: revisão dos 11 documentos (LGPD + CDC + CC + GDPR referência).
  • Orçamento: R$ [VALOR_PROPOSTO] — está dentro do nosso range.
  • Prazo: [PRAZO_PROPOSTO] — atende nossa janela
    [DATA_PARA_PUBLICACAO].
  • Formato de entrega: revisões em comentário (Google Docs / Word)
    + reunião de 1h para discussão dos pontos críticos.

Posso contratar [PACOTE|AVULSO|HORAS] conforme sua preferência.

Para começar, vou enviar:
  1. Acesso ao repositório (read-only) com os 11 documentos
  2. Documentação técnica de segurança
  3. Cópia dos DPAs assinados com subprocessadores (parcial)
  4. Contexto do produto + plano de negócio (resumo executivo)

Por favor, confirme o canal preferido para envio dos documentos
(e-mail seguro, link com expiração, etc.).

Se precisar de reunião de kick-off, sugiro [LISTA_DE_HORÁRIOS].

Atenciosamente,
[NOME]
[Cargo]
[Email]
```

---

## ✉️ Modelo 3 — Follow-up após cold outreach (se não respondeu)

```
Assunto: EasyDemo — revisão jurídica (LGPD/SaaS) — segundo contato

Olá Dr(a). [NOME],

Espero que esteja bem! Mandei mensagem há [NÚMERO_DE_DIAS] dias
sobre a revisão dos modelos jurídicos da EasyDemo, mas talvez tenha
passado batido na sua inbox.

Em resumo: somos uma startup SaaS brasileira lançando plataforma
de demos interativas. Temos 11 documentos-modelo sobre LGPD/CDC
precisando de revisão antes da publicação pública, com orçamento
de R$ [VALOR_MINIMO]–[VALOR_MAXIMO].

Se LGPD/SaaS não é sua especialidade, ficaria grato por uma
indicação de colegas que atendam esse perfil.

Posso enviar o briefing completo por aqui ou prefere agendar um
call de 15min?

Atenciosamente,
[NOME]
```

---

## 🎯 Como personalizar este template

Antes de enviar, personalize:

```
1. [NOME_DO_ADVOGADO] — Pesquise OAB ativa, publicação em LGPD,
   palestras sobre o tema. Demonstrar que você sabe quem ele(a) é.

2. [NOME_DA_EMPRESA] — Confirme se EasyDemo é a marca principal ou
   se há razão social diferente.

3. [EASYDEMO] — Uso informal/apelido — opcional.

4. [VALOR_MINIMO] / [VALOR_MAXIMO] — Pesquise o mercado:
   • Revisão completa de ~10 documentos jurídicos para LGPD/SaaS
     costuma variar R$ 8.000 – R$ 25.000 (PJ, fixed-price) ou
     R$ 350 – R$ 800/hora (avulso).
   • Em grandes capitais (SP, RJ), tender ao topo.
   • Para startup em cidade menor, pode ser mais baixo.
   • Confirme se o valor inclui opções (avulso, pacote mensal).

5. [DATA_PRAZO] — Dê pelo menos 30 dias corridos para um escopo desse
   tamanho. Cláusulas críticas (limitação de responsabilidade,
   DPO, SLA) podem demandar tempo de pesquisa.

6. [DATA_DE_PUBLICACAO] — Reserve 30-60 dias após [DATA_PRAZO]
   para incorporar revisões, fazer nova rodada (se necessário),
   e publicar.

7. [NOME_DO_REMETENTE] — Use quem tem autoridade para assinar o
   contrato (CEO, Head of Legal, ou DPO).

8. [LISTA_DE_DATAS] / [LISTA_DE_HORÁRIOS] — Ofereça 3 janelas
   reais em dias diferentes.
```

---

## 📂 Onde encontrar advogados especializados

```
• Busca por especialidade na plataforma OAB:
  https://www.oab.org.br

• LinkedIn — pesquisar "advogado LGPD" + filtrar por:
  – Localização (cidade da sede da EasyDemo)
  – Empresa (consultorias conhecidas: Opice Blum, Bordin &
    Villela, Mattos Filho, Tozzini Freire, e-Pixel,
    Verrusio, ...) — para referência de tamanho/qualidade.

• Indicações do ecossistema:
  – Outros founders SaaS brasileiros (Pesquisa via Twitter/X,
    comunidades como LunchClub, Reddit r/brdev).
  – Associações de startups (ABStartups, Endeavor Brasil,
    community managers).

• Eventos jurídicos:
  – IAPP (International Association of Privacy Professionals)
    — Brasil chapter.
  – ENCONTRO LGPD (anual).
  – Congresso da OAB sobre proteção de dados.

• Plataformas de contratação:
  – JusBrasil
  – Lawyer.com.br
  – Justen (escritório especializado em LGPD para startups)

IMPORTANTE: sempre confirmar:
  1. OAB ativa (consulta pública em https://cna.oab.org.br/).
  2. Experiência comprovada em LGPD (portfólio, palestras, artigos).
  3. Seguro de responsabilidade civil profissional (RcP — comum
     em escritórios sérios).
  4. Cláusula de confidencialidade assinada antes de compartilhar
     documentos sensíveis.
```

---

## ✅ Checklist pré-envio

Antes de mandar o e-mail, confirme:

```
[ ] Nome da empresa correto (EasyDemo LTDA vs. pessoa física)
[ ] Endereço comercial disponível
[ ] CNPJ disponível (para o contrato)
[ ] Escopo bem definido (11 documentos)
[ ] Orçamento com piso e teto (não valor único)
[ ] Prazo realista (≥ 30 dias)
[ ] Documentos anexados ou link seguro
[ ] Nome do remetente com autoridade para fechar contrato
[ ] E-mail enviado de domínio corporativo (não Gmail/Outlook)
[ ] Arquivo compactado (.zip protegido por senha, senha em
    canal separado)
```

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
EasyDemo LTDA — CNPJ XX.XXX.XXX/0001-XX
```
