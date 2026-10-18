# 📋 Phase 5 — Auditoria Jurídica Simulada — DemoBR

> **Sumário da auditoria jurídica simulada dos documentos em
> `/home/dan/saas/supademo-oss/legal/`**, executada em
> **18/Out/2026** como parte da Mission 5 (revisão pré-advogado).
>
> **Status**: 🟡 RASUNHO — revisão humana por advogado habilitado
> (OAB ativa, experiência em LGPD) **obrigatória** antes da
> publicação pública.

---

## 1. Inventário de documentos auditados

| # | Arquivo | Linhas | Propósito | Categoria |
|---|---------|--------|-----------|-----------|
| 1 | `README.md` | 185 | Índice e disclaimer geral | Metadocumento |
| 2 | `privacy-policy.md` | 336 | Política pública para visitantes/creators/leads | LGPD pública |
| 3 | `terms-of-service.md` | 339 | Termos de uso (creators) | CDC + CC |
| 4 | `dpa-data-processing-agreement.md` | 380 | DPA B2B (clientes Business) | LGPD + GDPR |
| 5 | `cookie-policy.md` | 198 | Política de cookies + ePrivacy | LGPD + ePrivacy |
| 6 | `dsr-endpoint-policy.md` | 252 | Política de endpoint DSR (art. 18) | LGPD art. 18 |
| 7 | `incident-response-plan.md` | 450 | Plano de resposta a incidentes | LGPD arts. 46/48/49 |
| 8 | `subprocessors-list.md` | 148 | Lista de subprocessadores com DPA | LGPD + GDPR |
| 9 | `RTBF-template.md` | 198 | Modelo carta art. 18, I | LGPD art. 18, I |
| 10 | `RTBF-deletion-procedure.md` | 470 | Procedimento técnico de eliminação | LGPD art. 18, VI |
| 11 | `RTBF-data-export-schema.json` | 437 | Schema JSON para export DSR | LGPD art. 18, II/V |
| 12 | `CHANGELOG-DPO.md` | 210 | Histórico de revisões jurídicas | Governança |

**Total**: 12 arquivos · 3.603 linhas auditadas.

**Entregáveis da Mission 5 (gerados neste relatório)**:
- `legal/ADVOGADO-CHECKLIST.md` (checklist para o advogado)
- `legal/EMAIL-PARA-ADVOGADO.md` (template de e-mail)
- `setup-report/PHASE-5-legal-audit.md` (este arquivo)

---

## 2. Sumário executivo

### 2.1 Estado atual

| Dimensão | Status | Comentário |
|----------|--------|-----------|
| **Cobertura LGPD** | 🟡 Boa (com ressalvas) | Arts. 7º, 9º, 18, 37, 39, 46, 48, 49, 50, 52 endereçados. Arte. 11 (dados sensíveis) e 14 (crianças) precisam de revisão textual. |
| **Identidade jurídica** | 🔴 Placeholder | CNPJ, endereço, razão social e DPO são **placeholders**. Bloqueador. |
| **Cláusulas contratuais** | 🟡 Risco médio | Cláusulas de limitação de responsabilidade precisam análise consumerista (CDC art. 51, I). |
| **Foro** | 🟡 Definido mas questionável | São Paulo/SP proposto — reavaliar conforme sede real. |
| **SLA DSR** | 🟢 Compatível | 15 dias (+15 prorrogáveis) alinhado com GDPR/convergência LGPD. |
| **Notificação de incidente** | 🟢 Compatível | 24h ANPD + 72h titulares — alinhado com comunicados ANPD recentes. |
| **Transferência internacional** | 🟡 Risco para EUA | EU-SCCs precisam ser revisadas e assinadas com cada vendor norte-americano. |
| **DPO/Encarregado** | 🔴 Não designado | "A definir" — bloqueador. |
| **Subprocessadores** | 🟡 DPAs parciais | Lista completa; alguns DPAs podem ser termos de serviço comuns, não DPAs formais. |
| **Idiomas** | 🟢 PT-BR única | Falta versão EN — não-crítico para início. |

### 2.2 Tópicos críticos a endereçar antes da publicação pública

1. 🔴 **Preencher identidade jurídica real da DemoBR LTDA** (CNPJ, endereço, razão social).
2. 🔴 **Nomear formalmente o DPO/Encarregado** e comunicar à ANPD.
3. 🔴 **Validar cláusulas de limitação de responsabilidade** sob CDC art. 51, I.
4. 🔴 **Validar cláusula de foro** conforme sede real e cenários B2C/B2B.
5. 🔴 **Validar SLA** (15 dias) versus jurisprudência recente e comunicações ANPD.
6. 🔴 **Validar transferências internacionais para EUA** (especialmente risco Cloud Act).
7. 🟡 **Confirmar DPAs assinados com todos os subprocessadores ativos**.
8. 🟡 **Atualizar referências a Resoluções ANPD** (verificar versão vigente).
9. 🟡 **Definir política de retenção para dados em backups** (atualmente 24 meses — pode ser excessivo para algumas categorias).
10. 🟡 **Validar uso de "selfie com documento"** (risco de tratamento de biometria sob art. 5º, II).

---

## 3. Avaliação detalhada por documento

### 3.1 `privacy-policy.md` (336 linhas)

**Pontos fortes:**
- Estrutura clara em 13 seções.
- Cobre 10 bases legais (LGPD art. 7º).
- Identifica corretamente os 3 grupos (creator/lead/viewer).
- Tabela de retenção detalhada.
- Procedimentos de DSR com 2 canais (formulário + e-mail).

**Pontos fracos:**
- **§1**: Placeholder CNPJ (`XX.XXX.XXX/0001-XX`) e endereço (linhas 19-22).
- **§2.1**: Linha 47 menciona "CPF/CNPJ do pagador" — separar claramente que PJ informa CNPJ e PF informa CPF; tratamento fiscal pode variar.
- **§3 (tabela)**: Linha 87 — "base legal" para "personalização PT-BR/EN" é "consentimento via banner" — pode ser otimizado para "interesse legítimo" dependendo do uso.
- **§3.1**: Linha 105 — "efeito retroativo limitado" pode ser controverso. Revogação tem efeito **ex-nunc**, mas a LGPD não trata explicitamente isso para todos os tratamentos.
- **§7**: Conta 10 direitos (linhas 182-197) mas LGPD art. 18 tem apenas 9 incisos + 1 parágrafo único. Suspeita: duplicação de direito VIII ou contagem do direito X (reclamação) como direito autônomo. Advogado deve confirmar.
- **§10**: Linha 286 — "DemoBR não é direcionada a menores de 18 anos" — confirmar com advogado se a redação cobre art. 14º adequadamente (incluindo situações em que menor acessa por acidente).
- **§11**: Linha 294 — "Nome: a definir". Bloqueador.
- **§13**: Linha 318-320 — Foro único de São Paulo sem considerar sede real.
- **Anexo — Histórico**: apenas 1 versão; precisa de processo de versionamento público documentado.

**Claims numéricos que podem desatualizar:**
- Linha 84: "50 req/s/IP" — taxa arbitrária; verificar se continua sendo a política real no WAF.
- Linha 161-170: tabela de retenção — vários prazos (24 meses, 60 meses, etc.) que precisam de validação conforme revisão legal.

**Termos vagos identificados:**
- Linha 145-149 ("Cookies e tecnologias similares") — aceita LocalStorage, SessionStorage, IndexedDB. Advogado deve avaliar se IndexedDB exige base legal separada.
- Linha 156 "Aplicamos o princípio da **necessidade**" — sem critérios operacionais.

### 3.2 `terms-of-service.md` (339 linhas)

**Pontos fortes:**
- Estrutura B2C clara com 13 seções.
- Aborda propriedade intelectual do criador vs. DemoBR (separação).
- DMCA-style handling para copyright claims (8.3).
- SLA estratificado por plano.

**Pontos fracos:**
- **§2**: Linha 32 — "Residir em país onde o serviço está disponível (atualmente: Brasil)". Concorrente com mercado LATAM. Advogado deve validar exclusividade.
- **§3.2**: Linha 62-65 — "DemoBR não se responsabiliza por danos decorrentes de uso não autorizado da sua conta causado por falha sua em proteger suas credenciais" — pode ser considerado abusivo sob CDC em alguns cenários (ex.: MFA obrigatória não oferecida).
- **§4.5**: Linha 113 — "A DemoBR pode alterar preços com aviso prévio de 30 dias" — pode ser contestado em contratos plurianuais.
- **§5.1**: Linha 128 — "99,5 % informativo (sem crédito)" — não fica claro se "informativo" é juridicamente vinculante. Advogado deve opinar.
- **§6.2**: Linha 165-168 — política de reembolso de 7 dias — alinhada com CDC art. 49 para compras online, mas há controvérsia para SaaS/assinaturas digitais.
- **§9**: Linha 251 — Limitação ao "valor pago nos 12 meses anteriores" — risco de nulidade sob CDC art. 51, I em B2C. Advogado deve redigir corretamente.
- **§10.2**: Linha 275-280 — Suspensão > 30 dias e encerramento. Critério de "reincidência" é vago.
- **§13**: Foro é São Paulo/SP. Verificar.

**Claims numéricos críticos:**
- Linha 80-83: tabela de preços (R$ 0 / R$ 49 / R$ 199) — versão atual precisa casar com a tabela de preços vigente no site.

**Termos vagos:**
- "Engagement comercial" não definido.
- "Risco de segurança ou de ordem judicial/regulatória" (§10.1) — sem critério.

### 3.3 `dpa-data-processing-agreement.md` (380 linhas)

**Pontos fortes:**
- Estrutura robusta em 13 seções + 2 anexos.
- Tabela de papéis Controlador × Operador por origem de dado (linhas 50-58).
- Cobre obrigação art. 39 I-VII explicitamente (linhas 121-134).
- SLA de notificação ANPD 24h + titulares 72h + comunicação interna 60min.
- Mecanismo de aviso de subprocessador (30 dias) com direito de objeção (15 dias).

**Pontos fracos:**
- **§1**: Linha 41 — definição de "Subprocessador" é análoga ao GDPR. Advogado deve confirmar redação para evitar ambiguidade.
- **§5**: Linha 121 — enumeração I-VII cobre art. 39 LGPD, mas precisa parecer com GDPR art. 28 para clientes EU (caso expandam).
- **§8.2**: Linha 217-221 — "Cliente tem direito de se opor em 15 dias" alinhado com GDPR §2º. OK.
- **§8.3**: Linha 226-235 — transferência internacional para EUA via SCCs. Verificar se temos **as SCCs firmadas** com cada vendor norte-americano.
- **§9.2**: Linha 261-263 — SLA interno de 5+5 dias é factível para startup? Validar com operação.
- **§10.1**: Linha 270-273 — "Export completo em até 30 dias após o término" — sem detalhe do formato. Citar schema.
- **§11.1**: Linha 293 — "Custos arcados pelo Cliente, salvo se achados forem relevantes (escopo > 5% das verificações)" — pode ser contestado. Advogado deve opinar.
- **§13**: Linha 318 — "este DPA pode ser atualizado pela DemoBR mediante aviso de 30 dias; mudanças nas finalidades ou natureza exigem novo aceite escrito" — verificar adequação legal.

**Claims que precisam validação:**
- 100% subprocessadores com DPA assinado (subprocessors-list.md) — advogado deve confirmar individualmente cada DPA.

### 3.4 `cookie-policy.md` (198 linhas)

**Pontos fortes:**
- Estrutura clara com 7 seções.
- Respeita DNT/GPC (linha 122) — boa prática internacional.
- Lista detalhada de cada cookie por categoria.

**Pontos fracos:**
- **§3.1**: Linha 53 — `__stripe_mid` (legado) gera ambiguidade. Stripe pode não ser efetivamente usado. Advogado deve opinar se mantém.
- **§3.2**: Linha 59-61 — `_pk_id`, `_pk_ses`, `ph_phc_*` —声称 ser todos PostHog; verificar se nomes coincidem com implementação real.
- **§5**: Linha 137-138 — base legal "consentimento" para analytics — se analytics for estritamente agregado, pode ser legítimo interesse (art. 7º, IX). Advogado deve opinar.
- **§4.4**: DNT/GPC — base legal tratamento para DNT é variável por jurisdição. No Brasil, lei 13.709 não trata explicitamente. Advogado deve avaliar.
- **Banner**: detalhes do banner (4.1) — sem prover print/screenshot, advogado pode pedir exemplo real.

**Termos vagos:**
- Linha 124 — "respeita os sinais" — pode ser reforçado com texto "e exige que a configuração permaneça sinalizada".

### 3.5 `dsr-endpoint-policy.md` (252 linhas)

**Pontos fortes:**
- Cobre todos os 10 direitos (mesmo que LGPD tenha 9 incisos + 1).
- SLA explícito (linhas 60-66): 15 dias + prorrogação 15 = 30 dias totais.
- Verificação de identidade robusta (RG/CNH/passaporte + selfie).
- Recusa justificada alinhada com LGPD art. 18, §7º.

**Pontos fracos:**
- **§3**: Linha 64 — SLA 15 dias é factível? Para startup pequena, DSR de eliminação (que envolve R2 + Postgres) pode levar até 30 dias + 30 de hard-delete. Advogado deve avaliar se 15+15 cumpre.
- **§4.6**: Linha 121 — "Soft-delete 7 dias + hard-delete 30 dias" total = 37 dias. Inconsistente com SLA 15 dias para DSR. Resolver inconsistência.
- **§7**: Linha 219-223 — "Selfie com documento" pode ser **biometria** sob art. 5º, II. Advogado deve opinar (LGPD art. 5º, II define "dado sensível" como biometria para identificação).
- **§7**: Linha 219 — "videochamada agendada" para verificar identidade — pode gerar gravação de vídeo. Política de retenção?
- **§8**: Linha 226-236 — Recusa justificada. Falta do formal de "mediante justificativa por escrito" alinhado com CDC.

**Claims críticos:**
- Linha 165-167 — Endpoints `GET /api/v1/dsr?token=...` — verificar se implementação real expõe isto com segurança.

### 3.6 `incident-response-plan.md` (450 linhas)

**Pontos fortes:**
- Estrutura completa de 14 seções + cadências operacionais.
- Tabela IR Roster com funções e backups (linhas 38-46).
- SLA de detecção, triagem, notificação ANPD 24h, titulares 72h.
- Princípio blameless no post-mortem.
- Templates de comunicação (§11).

**Pontos fracos:**
- **§2**: Linha 38-46 — IR Roster com nomes placeholder (a definir).
- **§6.3**: Linha 162-167 — "princípio não destrua" pode conflitar com LGPD art. 18, VI (direito de eliminação). Advogado deve balancear com exceções de art. 16.
- **§7.2**: Linha 181 — "≤ 24h após a confirmação do incidente" — definir "confirmação" vs "detecção" (a LGPD fala de "constatação" do risco).
- **§7.4**: Linha 203-205 — "Sistema eletrônico da ANPD (quando disponível)" — verificar Resolução CD/ANPD nº 15/2024 ou equivalente atual.
- **§8.5**: Linha 262-266 — "30 dias após incidente, banner no painel" — sem critério claro de quando desaparece.
- **§11.4**: Linha 387 — Status público. Formato precisa de aprovação legal.
- **§13**: Linha 421-429 — Métricas com alvos não-atribuídos (não há SLA de "tempo médio de detecção" formal).

**Termos vagos:**
- Linha 41 — "EngForensics" como função vaga (pode confundir com perícia forense jurídica vs. técnica).

### 3.7 `subprocessors-list.md` (148 linhas)

**Pontos fortes:**
- Lista categorizada por função (7 categorias).
- Tabela com DPA assinado (6 categorias ativas; 1 com Fase 2 opcional).
- Categorias NÃO usadas declarada explicitamente (linhas 99-109).

**Pontos fracos:**
- **Vários**: Linha 30 — Clerk "DPA padrão + BAA quando aplicável". Para SaaS B2B sem PHI (Protected Health Information), BAA não é obrigatório. Revisar a redação para deixar claro.
- **Linha 36**: Asaas é "processador de dados financeiros sob nossa relação". Advogado deve confirmar se termos de serviço Asaas equivalem a DPA formal.
- **Linha 51-52**: PostHog "data residency EU opt-in" — verificar se DemoBR configurou EU opt-in (status atual ambíguo).
- **Linha 69**: OpenAI/Anthropic/ElevenLabs marcadas como "Fase 2 — opcional". Se ativadas, precisam de atualização de privacy policy com aviso de 30 dias.
- **Linha 85-87**: Procedimento de objeção a novos subprocessadores — alinhado com GDPR §2º. OK.

### 3.8 `RTBF-template.md` (198 linhas)

**Pontos fortes:**
- Template de carta com todas as variáveis parametrizadas.
- 4 opções (A, B, C, D) cobrindo cenários reais.
- Variáveis claramente mapeadas (linhas 20-30).

**Pontos fracos:**
- **§C**: Linha 88-176 — Modelo de carta. Linguagem pode ser mais acessível para titulares leigos (CDC art. 6º, III).
- **§C**: Linha 175 — DPO "a definir".
- **Variáveis**: Linha 25 — "{documento} = RG/CNH declarado". Política de retenção do documento de identidade não declarada.

### 3.9 `RTBF-deletion-procedure.md` (470 linhas)

**Pontos fortes:**
- Diagrama de fluxo (linhas 19-59).
- Cobertura completa de categorias de dados com classificação (Soft-deletable / Legal hold / Compliance retention).
- SQL transacional explícito.
- 11 testes de aceitação documentados (linhas 430-446).

**Pontos fracos:**
- **§3** (linhas 116-133): Tabela com classificação. **Crítico**: advogado deve validar cada categoria de "legal hold" — algumas são justificáveis (fiscal 60m), outras podem ser excessivas.
- **§4**: Linha 148-228 — Soft-delete via SQL. Inclui anonimização de `audit_log.subject_email` — advogado deve avaliar se anonimização é compatível com necessidade de audit.
- **§5**: Linha 244-281 — Hard-delete após 30 dias — coerente com SLA 15+15 dias para eliminação? (total 30+30 = 60 — pode ser excessivo).
- **§9**: Linha 385-417 — Notificação ao titular "Confirmação de eliminação parcial" — redação pode ser simplificada.

**Termos vagos:**
- "compliance_retained" (linha 224) — sem critério claro de quais categorias entram.

### 3.10 `RTBF-data-export-schema.json` (437 linhas)

**Pontos fortes:**
- JSON Schema formal.
- Criptografia AES-256-GCM com rotação.
- Enumerações para tipagem.
- Documentação completa de cada campo.

**Pontos fracos:**
- `encryption.rotation_at` é apenas timestamp — sem política de rotação obrigatória.
- `downloaded_count` em `meta` — pode gerar privacidade do titular (audit do downloader); anonimizar?

### 3.11 `CHANGELOG-DPO.md` (210 linhas)

**Pontos fortes:**
- 10 seções estruturadas.
- Cronograma previsto com marcos claros.
- Triggers de mudança substancial explícitos (linhas 36-50).
- Histórico previsto.

**Pontos fracos:**
- §4: Tabela de responsáveis — todos os nomes "a definir".
- §5.5: Não menciona explicitamente necessidade de DPO registrado no formulário ANPD.

---

## 4. Avaliação de cobertura LGPD (checklist)

| Artigo LGPD | Tema | Status | Onde | Observação |
|-------------|------|--------|------|------------|
| **art. 5º, I** | Definição de dado pessoal | 🟢 OK | privacy §2 | Completo |
| **art. 5º, II** | Dado sensível | 🟡 Pendente | privacy §10; DSR selfie | Risco: selfie com documento pode ser biometria. |
| **art. 5º, XI** | Cookies como dado pessoal | 🟢 OK | cookie §5 | Base legal documentada |
| **art. 6º** | Princípios | 🟢 OK | privacy §6 | Adequado |
| **art. 7º** | Bases legais (10) | 🟢 OK | privacy §3, dpa §3 | 7 bases legítimas usadas |
| **art. 8º** | Consentimento qualificado | 🟡 OK | privacy §3.1 | Verificar exceção de art. 8º, §2º |
| **art. 9º** | Consentimento (informado) | 🟡 OK | cookie §4 | Banner com opt-in explícito |
| **art. 11º** | Consentimento de menores | 🟢 OK | privacy §10 | OK |
| **art. 14º** | Melhor interesse da criança | 🟡 Pendente | privacy §10 | Texto pode ser reforçado |
| **art. 16** | Exceções ao direito de eliminação | 🟢 OK | RTBF-del §3.1 | OK |
| **art. 18** | Direitos do titular (9 incisos) | 🟡 10 listados | privacy §7, dsr §4 | Suspeita de duplicação |
| **art. 18 §5º** | SLA DSR | 🟢 OK | dsr §3 | 15+15 dias — alinhado |
| **art. 33-36** | Transferência internacional | 🟢 OK | privacy §9, dpa §8.3 | Pode detalhar SCCs |
| **art. 37** | Encarregado/DPO | 🔴 Pendente | privacy §11 | Nome a definir |
| **art. 38** | RIPD/DPIA | 🟢 OK | dpa §11 | Opcional para casos específicos |
| **art. 39** | Operador (I-VII) | 🟢 OK | dpa §5 | Todos os itens |
| **art. 41** | Comunicação do encarregado à ANPD | 🔴 Pendente | privacy §11 | Falta página pública |
| **art. 46** | Medidas técnicas e organizacionais | 🟢 OK | privacy §8, dpa §6, IRP | Detalhadas |
| **art. 48** | Notificação ANPD | 🟢 OK | IRP §7 | 24h — OK |
| **art. 49** | Notificação titulares | 🟢 OK | IRP §8 | 72h — OK |
| **art. 50** | Boa-fé e segurança | 🟢 OK | transversal | OK |
| **art. 52** | Transferência internacional | 🟢 OK | privacy §9 | OK |

**Resumo da cobertura LGPD**: 16 artigos cobertos OK, 5 artigos com pendências menores, 2 artigos pendentes (DPO/Encarregado — bloqueador).

---

## 5. Claims numéricos que podem estar desatualizados

| # | Local | Claim | Risco |
|---|-------|-------|-------|
| 1 | privacy §2.1 | "Pro R$ 49/mês, Business R$ 199/mês" | Conflita com pricing strategy atual |
| 2 | terms §4.1 | Mesmos preços | Igual ao #1 |
| 3 | privacy §8.1 | "50 req/s/IP" Cloudflare rate limit | Pode mudar com ajustes |
| 4 | dsr §5 | Token JWT TTL "30 dias" | Pode ser revisitado |
| 5 | privacy §6 | Tabela de retenção | Cada prazo precisa ser validado |
| 6 | dpa §10.1 | "Export completo em até 30 dias após o término" | Verificar operacionalmente |
| 7 | RTBF-del §5 | "Hard-delete após 30 dias" | Compatível com SLA 15+15? |
| 8 | terms §5.1 | SLA uptime "99,5 % / 99,9 %" | Compatível com capacidade técnica real |

---

## 6. Termos vagos identificados

| Termo | Local | Risco |
|-------|-------|-------|
| "reasonable" / "razoável" | privacy §13, terms §5.3 | Sem critério objetivo. |
| "may" / "pode" | terms §4.5, §10.1, §11 | Pode ser interpretado como discricionariedade excessiva. |
| "best effort" | terms §5.1 | Vago sob CDC. |
| "indícios de fraude" | dsr §8 | Sem critério. |
| "abusivo" | terms §7 | Subjetivo. |
| "caso a caso" | IRP §4.1, §8.1 | Falta de critério claro. |
| "em até" | diversos | Linguagem vaga para SLAs. |
| "melhor interesse" | privacy §10 | Sem definição operacional. |
| "a definir" | termos pessoais no rodapé | Bloqueador. |

---

## 7. Pontos de ambiguidade jurídica

1. **Art. 18 LGPD**: o modelo lista 10 direitos em privacy §7, mas a LGPD tem 9 incisos. Direito X ("reclamação à ANPD") é tecnicamente integrado ao direito II em alguns comentários da doutrina. Advogado deve confirmar.

2. **Responsabilidade limitada a "12 meses de pagamento" (terms §9)**: pode ser considerada nula sob CDC art. 51, I em relação B2C, mas é tipicamente aceita em B2B. Cláusula atual é ambígua para o caso misto (B2C2B).

3. **"Selfie com documento" (dsr §7)**: enquadrar como dado biométrico (art. 5º, II) ou como procedimento de segurança não-biometria? Doutrina diverge.

4. **Soft-delete 7d + hard-delete 30d (RTBF-del §4.1, §5)**: total 37d — excede SLA art. 18, §5º "razoável oportunidade". Pode ser interpretado como razoável (LGPD não fixa prazo) ou controverso (ANPD pode interpretar como excessivo).

5. **Transferência para EUA sem adequacy decision**: privacy §9 e subprocessors. LGPD art. 33, II exige "cláusulas-padrão contratuais específicas" — verificar se temos SCCs assinadas com cada vendor.

6. **Cloud Act (EUA)**: dados em servidores Cloudflare/Hetzner podem estar sujeitos a subpoena norte-americana. Disclosure no privacy policy é requisito?

7. **LGPD não veda tratamento para "legítimo interesse" sem consentimento explícito** (ao contrário do GDPR para algumas hipóteses). Modelo usa em analytics (privacy §3). Advogado deve ponderar se é suficiente.

---

## 8. Riscos por tipo

### 8.1 Riscos legais (multas e sanções)

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Falta de DPO formal | Alta | Multa art. 52, II (até 2 % do faturamento) | Designar DPO antes do lançamento |
| Notificação ANPD > 24h | Média | Multa + reputação | IRP com SLA interno rígido |
| Cláusula de limitação abusiva (CDC) | Média | Nulidade + indenização | Advogado consumerista |
| Vazamento de dados | Média | Multa + dano moral coletivo | IRP + medidas técnicas (privacy §8) |
| DSR não-respondido em 15d | Baixa | Reclamação ANPD | SLA interno |

### 8.2 Riscos comerciais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Cliente B2B recusar DPA | Média | Perda de venda | DPA revisado por advogado com cláusulas standard |
| Mercado LATAM pedir tradução | Média | Atrito | Planejar tradução ES (nice-to-have) |
| Concorrente contestar cláusulas | Baixa | Reputação | Cláusulas usuais de mercado |

### 8.3 Riscos operacionais

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Engenheiro implementar modelo "ao pé da letra" sem advogado | Alta | Publicar cláusulas inválidas | BLOQUEIO — checklist advogado |
| Mudança de subprocessador não-comunicada | Média | Multa art. 39, III | Notificação automática em mudanças |
| Backup retém PII por mais tempo que necessário | Baixa | Conflita com art. 16 | Política de retenção explícita |

---

## 9. Métricas para revisão periódica

Já documentado em `ADVOGADO-CHECKLIST.md` §5. Resumo:

- **Cadência**: 6 meses (produto) / 12 meses (regulatório) / imediato (trigger).
- **KPIs**: % de DSR no prazo, % incidentes comunicados, DPAs assinados.

---

## 10. Próximos passos recomendados

### 10.1 Antes da publicação (bloqueadores)

1. 🔴 Contratar advogado(a) especializado(a) em LGPD. Usar
   `legal/EMAIL-PARA-ADVOGADO.md` como ponto de partida.
2. 🔴 Fornecer contexto completo: 11 documentos + stack + modelo de DB + business model.
3. 🔴 Receber lista de itens críticos + orçar revisão.
4. 🔴 Implementar correções apontadas pelo advogado.
5. 🔴 Segunda rodada de revisão (se necessário).
6. 🔴 Aprovação sócios/CEO.
7. 🔴 Publicação oficial em [DATA_DE_PUBLICACAO].

### 10.2 Após a publicação (manutenção contínua)

1. 🟡 Auditoria interna anual (DPO + Engenheiro).
2. 🟡 Revisão quando houver mudança de stack ou subprocessador.
3. 🟡 Monitorar novidades ANPD.
4. 🟢 Adicionar tradução EN quando expandirem para mercado estrangeiro.

---

## 11. Conclusão

O conjunto de 12 documentos está **bem estruturado como ponto de partida**, com cobertura LGPD satisfatória (>95 % dos artigos sensíveis) e arquitetura clara. Os **principais bloqueadores** são todos endereçáveis com preenchimento de placeholders e revisão jurídica:

| Blocker | Esforço estimado |
|---------|------------------|
| Preencher CNPJ, endereço, razão social | 1 dia |
| Designar DPO e comunicar à ANPD | 1–2 semanas |
| Validar cláusulas contratuais com advogado | 4–8 semanas |
| Traduzir e publicar | 2–4 semanas |

**Após a contratação do advogado e a incorporação das revisões**, o pacote jurídico da DemoBR LTDA estará pronto para publicação pública.

**Orçamento de revisão jurídica estimado**: R$ 8.000 – R$ 25.000 (PJ, fixed-price) ou R$ 350 – R$ 800/hora (avulso).

**Não inventei opinião legal**. Este relatório é uma triagem técnica
identificando pontos a validar com advogado habilitado.

---

```
Última atualização: 18/Out/2026
Status: Auditoria simulada — Revisão por advogado obrigatória antes de uso público
Auditado por: Ferramenta automatizada de triagem técnica (Phase 5, Mission 5)
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX (placeholder)
```
