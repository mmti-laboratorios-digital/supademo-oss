# ⚖️ Checklist para Revisão Jurídica — EasyDemo LTDA

> Documento destinado ao(à) advogado(a) especializado(a) em proteção
> de dados que fará a revisão obrigatória dos modelos em `legal/`
> antes da publicação pública.
>
> **Gerado em 18/Out/2026**. Não constitui aconselhamento jurídico —
> apenas identifica pontos que precisam de validação humana especializada.

---

## 📋 Como usar este checklist

- Itens marcados como 🔴 **NÃO-NEGOCIÁVEL** são bloqueadores:
  publicação NÃO deve ocorrer sem revisão.
- 🟡 **A REVISAR** são itens importantes mas que não bloqueiam a
  publicação do produto (afinam o documento).
- 🟢 **NICE-TO-HAVE** são melhorias de qualidade.
- ⚪ **RISCO RESIDUAL** são itens que permanecem mesmo após revisão
  humana — registre-os para governança.

Para cada item, marque:
- `[ ]` pendente
- `[x]` resolvido (com data e assinatura)

---

## 1. 🔴 Itens NÃO-NEGOCIÁVEIS (críticos)

### 1.1 Identidade jurídica do controlador

```
[ ] CNPJ real da EasyDemo LTDA (não pode ser XX.XXX.XXX/0001-XX)
[ ] Endereço comercial completo (rua, nº, complemento, bairro,
    cidade/UF, CEP)
[ ] Razão social exata conforme contrato social
[ ] Nome fantasia (se diferente)
[ ] Tipo societário: MEI / EPP / LTDA pura / S.A.
[ ] Composição societária (quem assina estes documentos)
[ ] Inscrição estadual/municipal (se aplicável)
[ ] Representante legal (nome + CPF + cargo)
```

**Afetado em:** `privacy-policy.md` §1, `terms-of-service.md` rodapé,
`dpa-data-processing-agreement.md` preâmbulo, todos os arquivos no rodapé.

### 1.2 Encarregado / DPO

```
[ ] Definir se DPO será INTERNO (funcionário) ou EXTERNO (advogado
    ou consultoria especializada)
[ ] Nome completo do DPO
[ ] CPF do DPO (para eventual notificação ANPD)
[ ] E-mail funcional (atualmente placeholder dpo@easydemo.io)
[ ] Telefone de contato (opcional — alguns modelos exigem)
[ ] Página pública do DPO em www.easydemo.io/dpo (LGPD art. 41, §1º)
[ ] Comunicar nomeação à ANPD (art. 41, §1º) — formulário disponível
    em https://www.gov.br/anpd/
[ ] Definir política interna para casos em que DPO esteja ausente
    (backup / férias / desligamento)
```

**Afetado em:** `privacy-policy.md` §11, `dpa-data-processing-agreement.md` §12,
`incident-response-plan.md` §2 (tabela), `CHANGELOG-DPO.md` §4.

> ⚠️ **Ponto crítico**: a LGPD art. 41 torna a nomeação do encarregado
> **obrigatória** para agentes de tratamento. A ausência de nomeação
> válida é infração.

### 1.3 Cláusulas contratuais potencialmente nulas (CDC + CC)

Validação obrigatória por advogado(a) consumerista/civilista:

```
[ ] ToS §5 (SLA/Uptime):
    - Cláusula de "best-effort" do plano Free — alinhamento com CDC art. 47?
    - "Crédito pro-rata" como ÚNICA reparação por indisponibilidade é
      proporcional? CDC art. 51, I pode considerar abusiva.
    - Aviso prévio de 48h para manutenção programada é razoável?

[ ] ToS §9 (Limitação de responsabilidade):
    - Limitação ao "valor pago nos 12 meses anteriores" é válida em
      relação B2C sob CDC art. 51, I?
    - Em relação B2B (clientes Business), considera-se mais flexível,
      mas precisa estar expressa a inaplicabilidade do CDC nos casos
      PJ (verificar §13).
    - Exclusão de "danos indiretos" e "lucros cessantes" — balanço
      com responsabilidade por dolo/culpa grave (art. 51, I do CDC).

[ ] ToS §10 (Suspensão e encerramento):
    - Suspensão imediata por violação é proporcional? CDC art. 42.
    - Acesso por 30 dias após encerramento para download — alinha com
      princípio da boa-fé?

[ ] ToS §6.2 (Política de reembolso):
    - "7 dias integrais" na primeira cobrança é adequado? CDC art. 49
      dá direito de arrependimento de 7 dias para compras ONLINE,
      mas há controvérsia se aplica a SaaS / assinaturas digitais.
    - "Sem reembolso após 7 dias" pode ser considerado abusivo se o
      serviço apresentar falha não-corrigida.

[ ] DPA §5 (Obrigações do operador):
    - SLA de DSR interno (5 dias úteis prorrogáveis por 5) é
      compatível com LGPD art. 18 §5º?
    - Cláusula de auditoria "mediante aviso de 30 dias, em horário
      comercial, custos arcados pelo Cliente" é válida?

[ ] DPA §11 (Auditoria):
    - Custos arcados pelo Cliente só "se achados forem > 5%" —
      pode ser considerado abusivo.
```

### 1.4 Cláusula de foro

```
[ ] Confirmar Comarca preferencial:
    - Proposta atual: São Paulo/SP
    - Alternativas possíveis: Comarca de Curitiba/PR, ou Comarca
      onde fica a sede real
    - ATENÇÃO: CDC art. 101, I garante ao consumidor o foro de seu
      domicílio — a cláusula de eleição não pode prejudicar o titular.
    - Em relação B2B, liberdade contratual é maior.

[ ] Validar aplicabilidade da cláusula em diferentes cenários:
    - Litígio com titular (pessoa física) — invoca CDC.
    - Litígio com cliente PJ (DPA) — pode ser mais flexível.
    - Litígio com visitante anônimo (não-consumidor) — interpretação.
```

### 1.5 SLA de DSR (LGPD art. 18, §5º)

```
[ ] Validar o SLA de 15 dias (prorrogáveis por +15):
    - LGPD art. 18, §5º fala em "razoável oportunidade" sem definir
      dias. Decisão recente da ANPD? STJ? (verificar jurisprudência).
    - 15 dias é a referência convergente com GDPR (1 mês), mas não
      é norma cogente.
    - Para DSR de eliminação (7 dias soft-delete + 30 hard-delete) —
      é compatível com SLA 15 dias? (resposta: SIM, o hard-delete
      após 30 dias é apenas garantia extra).
    - O SLA interno do operador para o Cliente (5+5 dias, DPA §9.2)
      é compatível com os direitos de titular indireto?
```

### 1.6 Segurança e notificação de incidentes (LGPD arts. 46, 48, 49)

```
[ ] Validar cláusulas de notificação ANPD (24h) e titulares (72h):
    - LGPD art. 48 usa "prazo razoável" — ANPD tem comunicado
      oficial fixando 24h como piso para incidentes relevantes?
      (ATUALIZAR com Resolução CD/ANPD mais recente).
    - IRP §7.2 referencia o Comunicado ANPD — advogado deve
      verificar a versão atual da Resolução aplicável.

[ ] Validar lista de medidas técnicas em privacy-policy.md §8.1:
    - Estão alinhadas com o stack REAL (Hetzner + Cloudflare +
      Clerk + Asaas + etc.)?
    - Advogado pode pedir documentos probatórios: certificações
      ISO 27001, SOC 2 type II (roadmap).
    - Menção a "bcrypt para senhas de API (`gf_live_*`)" — não
      confunde API tokens (que usam HMAC) com senhas?

[ ] Validar Política de retenção (privacy-policy.md §6):
    - Auditoria 24m — há base legal específica?
    - Backups 7 completos + diffs diários + 1 mensal de 24m:
      "dados pessoais em backup" são mesmo necessários por 24m?
      Alternativa: backups com PII removida após X dias.

[ ] Validar transferência internacional (privacy-policy.md §9):
    - Hetzner (Alemanha) — país adequado OK.
    - EUA: classificação como "país com nível adequado"? NÃO
      (LGPD considera EUA não-adequado por padrão). Cláusulas-
      padrão contratuais (LGPD art. 33, II) — temos?
    - SCCs válidos? Advogado deve revisar minutas.
```

---

## 2. 🟡 Itens a REVISAR (importantes)

### 2.1 Política de Privacidade

```
[ ] Confirmar alinhamento com os templates/modelos publicados pela
    ANPD (quando disponíveis).
[ ] §3 (bases legais) — confirmar que cada tratamento tem base legal
    específica e bem documentada:
    - (a) Consentimento — leads
    - (b) Execução de contrato — billing, conta
    - (c) Obrigação legal — auditoria, NF-e
    - (f) Legítimo interesse — analytics, fraude
    - (a) Consentimento (banner) — personalização
[ ] §3.1 (consentimento) — confirmação de que "efeito retroativo
    limitado" está corretamente descrito. É controverso se a
    revogação atinge o passado. Advogado deve opinar.
[ ] §7 (art. 18) — confirmar que TODOS os 9 incisos estão
    endereçados. (Atualmente o doc lista 10 — verificar se
    duplicou algum).
[ ] §10 (crianças) — o texto da LGPD art. 14º é "melhor interesse"
    da criança. Revisar redação.
[ ] §11 (Encarregado) — formato de comunicação com ANPD.
```

### 2.2 DPA (B2B)

```
[ ] Alinhar com modelos da LGPD art. 39 I-VII:
    - I. Seguir instruções do controlador
    - II. Sigilo e segurança
    - III. Subcontratação só com autorização
    - IV. Auxiliar nos direitos do titular
    - V. Auxiliar na notificação de incidente
    - VI. Tornar informações disponíveis para auditoria
    - VII. Devolver/eliminar dados ao término
    (todos estão presentes no DPA, mas a redação deve ser validada)

[ ] Alinhar com GDPR art. 28 (se houver clientes EU):
    - Art. 28, §3º lista de pontos obrigatórios no contrato com
      operador — comparar item a item.
    - Cláusula de subprocessor (GDPR art. 28, §2º) — autorizações
      específicas ou gerais? (GDPR exige específica).

[ ] §13 (Disposições finais) — verificar se a cláusula de
    "não-exclusividade" permite tratamento para outros clientes
    sem ambiguidade.
```

### 2.3 Termos de Uso

```
[ ] §7 (Uso aceitável) — "suspensão por uso abusivo" é proporcional?
    - Suspensão unilateral sem aviso prévio pode ser contestada.
    - Recomendação: aviso prévio + prazo para correção, exceto
      para casos graves (fraude, conteúdo ilegal).
[ ] §8.1 (Propriedade do criador) — licença "mundial, não exclusiva,
    gratuita e sublicenciável" é ampla demais? Em caso de PI
    protegida, sublicenciamento pode conflitar com direitos
    autorais de terceiros.
[ ] §8.3 (DMCA) — verificar compatibilidade com Marco Civil da
    Internet (Lei 12.965/2014) art. 19 ("aplicação com ofício
    próprio para notificação judicial").
[ ] §11 (Alterações) — "30 dias de antecedência" para mudanças
    substanciais é suficiente? Comparar com CDC e práticas de
    mercado.
[ ] §12 (Disposições gerais) — "você não pode transferir estes
    Termos" — considerar exceções (ex.: fusão/aquisição da
    empresa do cliente).
```

### 2.4 Cookies

```
[ ] Atualizar após configurar CMP (Consent Management Platform)
    real. Os cookies listados refletem um cenário idealizado —
    confirmar nomes reais com engenheiro antes de publicar.
[ ] Verificar se banner de opt-in (consentimento) está em
    conformidade com:
    - LGPD art. 8º (consentimento qualificado)
    - Diretiva ePrivacy (paralelo GDPR)
    - STJ Tema 1006 (se cookies sem consentimento são lícitos)
[ ] __stripe_mid "legado" — se Stripe não for usado, remover
    da lista (atualmente confunde).
```

### 2.5 DSR

```
[ ] SLA de 15 dias — factível com a equipe atual? Para startup
    pequena, considerar prorrogações proativas de 7+7 ou 15+15
    para evitar descumprimento.
[ ] Verificação de identidade (RG/CNH/passaporte + selfie):
    - Coletar e reter? Manter em R2 criptografado?
    - Política de retenção dos documentos de identidade?
    - LGPD: esses documentos são "dados pessoais" — base legal
      própria (consentimento para tratamento).
[ ] Selfie com documento — risco de biometria (dado sensível
    LGPD art. 5º, II)? Verificar se cai em "biometria para
    identificação" ou "procedimento de segurança". Advogado
    deve opinar.
[ ] Procedimento de recusa (art. 18, §7º) — advogado deve
    confirmar os motivos válidos: genérico, indícios de fraude,
    repetido em curto intervalo, etc.
```

### 2.6 Incident Response Plan

```
[ ] Validar referências a "Comunicado ANPD 24h" — verificar
    texto exato da Resolução CD/ANPD nº 15/2024 (publicada em
    2024) ou a que estiver vigente na data de publicação.
[ ] Equipe (IR Roster) — substituir nomes reais.
[ ] Advogado externo no IRP — definir contrato de retainer ou
    avulso (cobrado por hora ou por incidente)?
[ ] Templates de comunicação (§7.3, §8.4) — advogado deve
    ajustar para linguagem acessível (CDC art. 6º, III +
    art. 14) e humanizada.
[ ] SLA de notificação ao Cliente (60min) — interno, sem
    obrigação legal específica. OK.
[ ] Publicação de post-mortem — considerar LGPD art. 50
    (boa-fé) e reputação. Advogado deve opinar.
```

### 2.7 Subprocessadores

```
[ ] Confirmar DPAs assinados com TODOS os subprocessadores:
    [ ] Hetzner (ISO 27001 — referência)
    [ ] Cloudflare (Enterprise DPA)
    [ ] Clerk (padrão + BAA quando aplicável)
    [ ] Asaas (termos de serviço — verificar se suficiente)
    [ ] Resend (padrão)
    [ ] PostHog (EU/US)
    [ ] Sentry (+ BAA quando aplicável)
    [ ] OpenAI / Anthropic (Fase 2 — DPA + cláusula API-only)
    [ ] ElevenLabs / Cartesia (Fase 2)

[ ] Cloudflare EUA — verificar política específica de
    armazenamento de logs. Risco de borderless access US Cloud Act.
[ ] Asaas — confirmar que o termos de serviço equivale a um
    DPA assinado (não é o mesmo, mas é comum para pagamento).
[ ] PostHog "EU opt-in" — confirmar se EasyDemo já configurou
    data residency EU (não está claro se está ativo ou se é
    apenas opção disponível).
```

---

## 3. 🟢 Itens NICE-TO-HAVE

### 3.1 Subprocessadores

```
[ ] Anexo de subprocessadores renomear se algum vendor mudar
    (manter nomenclatura em ordem alfabética).
[ ] Incluir versões específicas de cada DPA assinado (data +
    URL pública).
[ ] Histórico público (statuspage) de mudanças.
```

### 3.2 Tradução

```
[ ] Equivalente em EN (atualmente só PT-BR):
    - Política de Privacidade
    - Termos de Uso
    - DPA
    - Cookies
    Justificativa: clientes Business podem ser estrangeiros.
[ ] Tradução juramentada para espanhol (mercado LATAM):
    - Argentina, México, Colômbia (LGPDs locais como
      Argentina Ley 25.326 ou México LFPDPPP).
[ ] Conformidade potencial com:
    - UK GDPR (Adequacy)
    - LGPD argentina (similar à brasileira)
    - LGPD México (LFPDPPP)
```

### 3.3 Boas práticas adicionais

```
[ ] Adicionar selo de "boas práticas ANPD" se houver programa
    oficial de certificação (ainda não lançado pela ANPD, mas
    pode ser lançado).
[ ] Publicar página de "Transparência algorítmica" se usar
    IA (Fase 2) — exigência do art. 20 LGPD.
[ ] Política de Cookies em formato JSON-LD (Schema.org) para
    SEO jurídico.
[ ] Adicionar hashing chain em posts do blog sobre mudanças.
[ ] Política de não-cooperação com MLATs abusivos (opcional, mas
    alinhada a boas práticas internacionais).
```

---

## 4. ⚪ RISCO RESIDUAL

Estes itens permanecem **MESMO APÓS revisão jurídica humana**.
Registre-os para governança periódica:

```
⚪ Mudanças regulatórias pós-publicação:
   - ANPD publica novas Resoluções (frequência imprevisível).
   - Alteração na LGPD (Exposição de Motivos ou novo PLC).
   - STJ/STFixam entendimento em controvérsia (ex.: Tema 1006
     sobre cookies).

⚪ Mudança jurisprudencial:
   - Decisão do STJ ou do STF que inverta entendimento atual.
   - Por exemplo: se o STJ decidir que SLA "best-effort" é
     abusivo, isso afeta ToS §5.

⚪ Fornecedor/subprocessador mudando unilateralmente:
   - Cloudflare/Hetzner/Clerk mudarem política de retenção
     ou DPA sem aviso.
   - Cloud Act (EUA) — subpoena governamental pode afetar
     dados em servidores norte-americanos.

⚪ Decisão judicial específica contra EasyDemo:
   - Vazamento de dados (mesmo com todas as medidas, há risco
     residual de ataque zero-day).
   - Indenização por danos morais coletivos (ação civil pública
     do MP/Procon).

⚪ Riscos operacionais:
   - DPO ausente (férias/desligamento sem substituição).
   - Equipe sem treinamento atualizado (anualmente).
   - Backups falhando silenciosamente.

⚪ Interpretação conflitante:
   - GDPR e LGPD têm divergências pontuais (ex.: prazo do
     direito ao esquecimento, definição de "dado sensível").
   - Decisão da ANPD pode divergir da EDPB europeia.
```

**Mitigação**: revisão periódica conforme §5 abaixo + monitoramento
de novidades regulatórias.

---

## 5. 🔄 Métricas para revisão periódica

### 5.1 Cadência recomendada

| Periodicidade | Atividade | Quem |
|---------------|-----------|------|
| **A cada 6 meses** | Revisão por mudanças de produto (features novos, novos clientes, nova geografia). Atualizar lista de subprocessadores. | DPO + Engenheiro |
| **Anualmente** (preferencialmente Out/Abr) | Auditoria interna completa (todos os 11 documentos). Verificar mudanças regulatórias (LGPD, ANPD, GDPR, ePrivacy). Atualizar placeholders (CNPJ, contatos). Emitir relatório de conformidade à liderança. | DPO + Advogado |
| **Trigger imediato** | Comunicação de subprocessador mudando (cloud migration, vendor switch). Troca de stack. Mudança de pricing. Expansão de tratamento para novo tipo de dado. Evento P0/P1. | DPO + Engenheiro |
| **Quando houver alteração legislativa relevante** | Atualização dentro de 90 dias da vigência da norma. | DPO + Advogado |

### 5.2 KPIs de saúde jurídica

| KPI | Meta |
|-----|------|
| % de documentos revisados nos últimos 12 meses | 100% |
| Tempo médio de resposta a DSR | ≤ 10 dias |
| % de DSRs respondidos no prazo | 100% |
| % de incidentes comunicados à ANPD no prazo | 100% |
| % de incidentes comunicados a titulares no prazo | 100% |
| DPAs assinados com subprocessadores ativos | 100% |
| Tempo desde última treinamento LGPD da equipe | ≤ 12 meses |

---

## 6. 📞 Contatos úteis para o advogado

```
• Modelo de Petição Inicial à ANPD (queixa): https://www.gov.br/anpd/pt-br
• Modelo de comunicação de incidente (Resolução ANPD vigente)
• Template de Política de Privacidade da ANPD (quando disponível)
• Lei 13.709/2018 (LGPD) — texto consolidado: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
• Lei 12.965/2014 (Marco Civil da Internet): https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
• Lei 8.078/1990 (CDC): https://www.planalto.gov.br/ccivil_03/leis/l8078.htm
```

---

## 7. ✅ Assinaturas do checklist (revisão concluída)

```
ADVOGADO(A) RESPONSÁVEL:
  Nome: _________________________________________
  OAB: _________________  UF: ____
  E-mail: ______________________________________
  Especialidade principal: _____________________

ASSINATURAS (realizar ao final):
  Advogado(a): _________________________  Data: ___/___/______
  Representante legal EasyDemo (CEO): ______  Data: ___/___/______
  DPO designado: _______________________  Data: ___/___/______
```

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
EasyDemo LTDA — CNPJ XX.XXX.XXX/0001-XX
```

> ⚖️ **Disclaimer**: este documento é uma ferramenta de triagem
> gerada por pessoa leiga, com base no conhecimento técnico do
> produto. **Não substitui análise jurídica humana**. A revisão por
> advogado habilitado (OAB ativa) é passo obrigatório antes da
> publicação pública de qualquer documento em `legal/`.
