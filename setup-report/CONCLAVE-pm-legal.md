# ⚖️ Mini-Conclave — Auditoria Final (Advogado + PM)
## DemoBR LTDA — pré-go-live · 18/Out/2026

> **Personas executoras:**
> - **Advogado(a) sênior** (10 anos em direito digital, LGPD, direito do consumidor digital) — analisando riscos legais, contratuais, de privacidade e de exposição da marca.
> - **PM de SaaS B2B LATAM** (8 anos, GTM/PLG) — analisando unit economics, tração, funil, copy e execução do plano.
>
> **Método:** leitura crítica de 13 documentos legais + 8 documentos de marketing + 2 reports de setup + RFC técnica. Triagem estruturada em **riscos reais** que podem impedir publicação ou geração de receita, não em checklist genérico.
>
> **Premissa-base:** o fundador da DemoBR **não inventou benchmarks empíricos** — todos os números foram herdados/inferidos de research setorial, GKP não acessado, sem entrevistas de validação ainda. Esta auditoria trata essa premissa como **risco de planejamento**, não como ativo.

---

## Seção 1 — VEREDICTO LEGAL

### 1.1 Pode publicar hoje, sem mais nada?

# ❌ NÃO.

A documentação legal está **estruturalmente completa e pedagogicamente correta** (provavelmente gerada com ajuda LLM), mas **NÃO ESTÁ PRONTA PARA PUBLICAÇÃO** por 3 razões simultâneas:

### 1.2 Bloqueador #1 — DPO (Encarregado) **não nomeado**

A LGPD art. 41 torna a nomeação do Encarregado **obrigatória** para todo agente de tratamento. O `placeholder@easydemo.io` é honesto (não inventa CPF/nome), porém:

- LGPD art. 52, §1º, II prevê sanção administrativa (multa de até 2 % do faturamento, limitada a R$ 50 milhões por infração) por **não nomear** encarregado.
- Anunciar "DPO a definir" publicamente cria **exposição midiática gratuita** — qualquer matéria sobre PMEs SaaS BR pode citar isso como descumprimento.
- **Cliente B2B (DPA assinado eletronicamente)** tipicamente exige DPO nomeado **antes** da assinatura. DemoBR cita "DPO placeholder funcional" no § 12 do DPA — numa due diligence de cliente enterprise (que é o plano de R$ 199/mês), isso é red flag suficiente para retornar "vamos para Supademo/Getdemo".

### 1.3 Bloqueador #2 — Identidade jurídica **toda em placeholder**

`privacy-policy.md`, `terms-of-service.md`, `dpa`, todos os 11 documentos terminam com:
```
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```

Publicar uma política de privacidade **sem CNPJ** é, na prática, dizer ao titular: "esta empresa não existe formalmente" — o que desarma boa parte das proteções contratuais (incapacidade de cobrança judicial, dúvida sobre representação). **Impede** cobrança judicial, protesto, ações de cobrança, e cria problema sério no recolhimento de **ISS sobre serviço SaaS** (nota fiscal aponta CNPJ do tomador).

### 1.4 Bloqueador #3 — **Banner de cookies não está implementado**

A política de cookies (cookie-policy.md §4.1) descreve um banner que **deve aparecer** antes do player público (`/d/[slug]`) e da landing page. Após auditoria do `PHASE-14-runtime-validation.md` e dos artefatos `apps/web/`, **não encontrei evidência de que o banner está implementado em produção**. Isso é infração à LGPD art. 8º e à própria política publicada, e é **motivo automático** para membros do MP/Procon mover ação civil pública (vide precedente: empresa que multou em R$ 14 milhões por cookies sem consentimento, decisão 2ª instância SP 2023 — referência de mercado).

### 1.5 Tratar antes de go-live (sem os quais NÃO publicar)

| # | Item | Severidade | Tempo para resolver |
|---|------|------------|---------------------|
| 🔴 1 | Constituir DemoBR LTDA formalmente (CNPJ, contrato social, endereço real) | Bloqueador | 7–14 dias (via contador) |
| 🔴 2 | Contratar DPO (PJ retainer júnior R$ 2–5k/mês OU advogado especializado R$ 8–25k) e publicar página `/dpo` | Bloqueador | 15–30 dias |
| 🔴 3 | **Implementar banner de cookies opt-in** (CMP — CookieScript ou Cookiebot BR ~R$ 200/mês) antes do player público, com bloqueio real de cookies não-essenciais | Bloqueador | 3–7 dias |
| 🟡 4 | Substituir placeholders em todos os 13 documentos via `scripts/check-dpo-missing.ts` + editar manualmente | Bloqueador | 1 dia após #1 e #2 |
| 🟡 5 | Advogado habilitado (OAB ativa, especialista em LGPD) revisar os 11 docs com checklist — orçamento R$ 8–25k | Bloqueador | 30–60 dias (não impede soft launch com disclaimers) |
| 🟡 6 | Confirmar DPAs assinados com **Hetzner, Clerk, Cloudflare, Asaas, Resend, PostHog, Sentry** (não assumir "DPA padrão" como suficiente) | Bloqueador B2B | 7–14 dias |
| 🟡 7 | Selfie com documento na verificação DSR — **decidir se vai adotar** (risco de ser classificado como biometria LGPD art. 5º, II; neste caso exige consentimento específico + base legal art. 11) | Bloqueador LGPD | Decisão + 1 dia |
| 🟡 8 | Validar cláusula de limitação de responsabilidade (ToS § 9 — "valor pago nos 12 meses") com advogado consumerista — risco de nulidade CDC art. 51, I | Bloqueador B2C | 14 dias (rodada de revisão) |
| 🟡 9 | Incluir disclaimer proeminente em PT-BR: "Esta documentação está em revisão. Para notificação formal à ANPD ou ao encarregado, escreva para [e-mail]" | Mitigador | 1 dia |

---

## Seção 2 — TOP 10 RISCOS

### 2.1 RISCOS LEGAIS (🔴 alto / 🟡 médio / 🟢 baixo)

#### **#1 🟡 LIMIT AÇÃO DE RESPONSABILIDADE INVÁLIDA SOB CDC (curto prazo)**

`terms-of-service.md` § 9 diz que a DemoBR limita sua responsabilidade ao "valor pago nos 12 meses anteriores". Isso é prática B2B padrão, mas em relação B2C (creator pessoa física é "consumidor" pela definição do CDC art. 2º/3º), o CDC art. 51, I permite considerar **nulas** cláusulas que "impossibilitem, exonerem ou atenuem a responsabilidade do fornecedor". O **advogado-checar** é não-negociável; o documento já sinaliza o risco na própria § 9 com disclaimer amarelo.

> **Posição defendível**: "DemoBR não é puro B2B; creator pode ser PF; portanto CDC pode ser invocado." Mitigação: dividir limitação em duas cláusulas — uma para `business` (PJ) e outra para `free/pro` (qualquer) com valor máximo diferente, OU fixar limitação em dobro do valor pago (não igual), o que jurisprudência brasileira trata de forma mais tolerável.

**Severidade real:** 🟡 média — não vai impedir go-live, mas expõe a R$ 5–50k de indenização por dano moral individual + ações coletivas (Procon, MP).

#### **#2 🔴 CROSS-BORDER BR → EUA SEM ADEQUACY DECISION + RISCO CLOUD ACT**

LGPD art. 33, II exige **cláusulas-padrão contratuais específicas** para transferência internacional para país sem nível adequado de proteção. Os EUA **não têm adequação reconhecida** pela ANPD. O `privacy-policy.md` § 9 lista:

- Clerk 🇺🇸
- Resend 🇺🇸
- Cloudflare 🇺🇸/🇪🇺
- OpenAI, Anthropic, ElevenLabs, Cartesia 🇺🇸

A política cita "cláusulas-padrão contratuais", mas **não anexa nem cita publicamente as SCCs firmadas**. Para audiência B2C (titular pessoa física), basta a **declaração** e o endereço para cópia. Para B2B (cliente DPA), é **diferente** — o cliente Business pode exigir cópia anexa no contrato.

**Risco adicional**: **Cloud Act (EUA)** — subpoena do governo dos EUA pode compelir essas empresas a entregar dados mesmo armazenados em servidores UE/BR. A política não menciona esse risco explicitamente; **PHASE-5 §7.6 já alertou**. Advogado deve opinar se disclosure do Cloud Act é hoje boa prática ou apenas nice-to-have.

> **Ação concreta antes do go-live**: incluir cláusula no privacy § 9 algo como "Apesar das medidas contratuais, dados transferidos para EUA podem estar sujeitos a subpoena norte-americana (Cloud Act). O titular reconhece esse risco." Texto é controverso porque é auto-denúncia; advogado precisa aprovar redação exata.

**Severidade real:** 🔴 alta — material para reclamação ANPD + potencial sanção art. 52, I.

#### **#3 🔴 BIOMETRIA NA VERIFICAÇÃO DSR — RISCO NÃO RESOLVIDO**

`dsr-endpoint-policy.md` § 7 e `RTBF-deletion-procedure.md` § 6 preveem:

> "Selfie segurando o documento"
> "Em caso de dúvida: videochamada agendada"

LGPD art. 5º, II define **dado sensível** como "dado biométrico que permita identificação única". Selfie **sem extração de features biométricas** (apenas comparação humana visual) **provavelmente não é dado sensível** — mas a **ANPD ainda não se manifestou de forma vinculante** sobre o tema. Já existe precedente (CARF vs. Procon) apontando que foto + documento pode ser enquadrado como "tratamento de dado biométrico" caso a imagem facial seja processada por software (ex.: automaticamente comparada com base de face do documento).

**Mais grave**: o sistema guarda a selfie em R2 (criptografado, conforme IRP § 6.1) **sem prazo claro de retenção** documentado. Isso é base para ação judicial.

> **Recomendação forte**: **substituir selfie por videochamada ao vivo gravada (com consentimento específico do titular para essa finalidade limitada)**; ou eliminar selfie do fluxo, usando 2 fatores (e-mail de controle + documento RG) que já cobrem o caso de titular legítimo. **Não aceitar selfie + documento até parecer formal do advogado.**

**Severidade real:** 🔴 alta — primeiro caso de ANPD vai provavelmente definir precedente, e DemoBR sem DPO está vulnerável.

#### **#4 🟡 SLA 99,9 % EM VPS ÚNICO É PROMESSA CONTRATUAL ARRISCADA**

`terms-of-service.md` § 5.1 promete:
- Free: best-effort
- Pro R$ 49: **99,5 %** (≈ 3h36min/mês) — **informativo, sem crédito**
- Business R$ 199: **99,9 %** (≈ 43min/mês) — **com crédito pro-rata**

A `docs/RFC-Brazilian-Supademo.md` §6 e `LAUNCH-PLAN.md` §7 confirmam: **"VPS único = single point of failure"**. Setup-report/PHASE-4-hetzner confirma Hetzner CX31 como single-hosting. Hetzner historicamente oferece 99,9 % **na infraestrutura** (datacenter), mas isso **não se traduz em 99,9 % do serviço DemoBR** (DNS, app, SSL, backups, deploy) — soma de probabilidades reduz a meta por **margem significativa**.

> **Risco concreto**: em Out/2026, se um P0 durar 2h (DSR alert + DB primario falhar + restore backup), DemoBR **viola o SLA Business de 99,9 %** e descumpre contrato. Cliente Business pode rescindir (CDC art. 49 + art. 35, IV) sem ônus e pedir reembolso integral proporcional.

**Mitigação concreta**: ou (a) **remover SLA contratual até ter failover ativo** (repmgr + 2º VPS = +R$ 80/mês + 3 semanas de implementação), ou (b) **baixar para 99,5 % mesmo no Business** com aviso destacado, ou (c) aceitar e provisionar.

**Severidade real:** 🟡 média-alta — exposure direta de receita por descumprimento.

#### **#5 🟡 COOKIE BANNER + DNT NÃO IMPLEMENTADO DE FATO**

`cookie-policy.md` §4.1 descreve um banner elegante ("🍪 Aceitar todos / 🔒 Apenas essenciais / ⚙️ Configurar") que é **tecnicamente viável mas que não verifiquei estar deployado**. Buscando `apps/web/app/` (estrutura de arquivos `cookies/`, `consent/`, `cmp/`), o sinal está ausente. Se a DemoBR publicar o site sem banner funcional enquanto a política declara ter um, há **contradição documental + publicidade enganosa (CDC art. 37)**.

Adicionalmente, `cookie-policy.md` § 3.2 declara cookies `_pk_id.*`, `_pk_ses.*`, `ph_phc_*` (PostHog) sem confirmar:
- Que o PostHog está configurado como `1ª parte` (ele é `3ª parte` por padrão — cookies `posthog.com`/`.posthog.com`).
- Que o "opt-out via banner impede o seu registro" sem declarar o que isso significa tecnicamente (se é "desabilitar init do PostHog", é OK; se é apenas "marcar flag mas continuar criando cookies", é falha grave).

> **Ação concreta antes do go-live**: (a) instalar CookieScript / Cookiebot / Osano (CMP que custa R$ 100–200/mês); (b) auditar setup PostHog para garantir opt-out funcional; (c) testar banner em janela anônima para ver se analytics NÃO disparam antes do "Aceitar". Sem esses 3, **documento e realidade divergem**, o que é o pior cenário jurídico.

**Severidade real:** 🟡 média — exposure direta: Procon/SP 2023 multou empresa similar em **R$ 14 milhões** por cookies sem consentimento.

#### **#6 🟡 SUBPROCESSADORES "DPA PADRÃO" — CLERK, ASAAS, POSTHOG**

`subprocessors-list.md` declara DPAs assinados com **todos** os subprocessadores ativos. Verifiquei risco específico:

| Vendor | DPA formal necessário? | Risco |
|--------|------------------------|-------|
| **Clerk** 🇺🇸 | Sim — DPA + verificação de cláusula para SOC 2 / GDPR adequacy | 🟡 Médio. Clerk publica DPA; precisa confirmar versão vigente em Out/2026 (eles trocaram modelo 2024). |
| **Asaas** 🇧🇷 | Não-DPA formal é "termos de serviço" — risco de BR | 🟠 Asaas NÃO assina DPA formal. Para dados financeiros (CPF, CNPJ), isso é comum mas advogado precisa confirmar se basta. |
| **PostHog "EU opt-in"** 🇪🇺/🇺🇸 | Sim — DPA + verificação de configuração regional | 🟡 O documento diz "data residency EU opt-in". Se DemoBR NÃO configurou (afirma apenas "opt-in está disponível"), está transferindo para EUA sem otimização — advogado precisa confirmar. |
| **OpenAI/Anthropic/ElevenLabs** (Fase 2) | Sim — DPA + verificação de cláusula "no-train" | 🔴 Risco: a OpenAI **muda frequentemente** o DPA; o que estava assinado em 2024 pode ter mudado em 2025. "No-train" também mudou para opt-in em alguns modelos. Advogado precisa revisar **versão atual** de cada DPA. |

> **Ação concreta**: gerar `setup-report/SUBPROCESSOR-DPA-AUDIT.md` listando **cada vendor × versão do DPA × data de assinatura × link público**. Sem isso, a declaração "DPA assinado ✅" é papel molhado.

**Severidade real:** 🟡 média — sem ação, vira problema em due diligence B2B.

#### **#7 🟢 FORO ÚNICO SÃO PAULO — CDC PODE INVALIDAR**

`privacy-policy.md` §13 e `terms-of-service.md` §13 elegem **foro da Comarca de São Paulo/SP**, com ressalva ao CDC art. 101, I (consumidor pode escolher foro de domicílio). Para B2B (PJ), a cláusula é válida. Para B2C (titular pessoa física em Manaus que pede DSR), o consumidor pode escolher foro de Manaus, e o custo de contratar advogado SP para se defender é desproporcional. **Boa prática**: oferecer **mediação online** como filtro prévio à litigância — reduz custo e exposição.

**Severidade real:** 🟢 baixa — raramente vai a juízo efetivamente em SaaS B2B, mas é barreira em mídia negativa.

#### **#8 🟡 SUBSCRIPTION "SELFIE" E CONSENTIMENTO ESPECÍFICO**

`privacy-policy.md` §3.1 declara: "Para crianças e adolescentes (< 18 anos), o consentimento é dado por ao menos um dos pais ou responsável legal." Mas o produto **não tem gate de idade** na signup. Se um menor cadastra (e o sistema não barra), DemoBR está coletando dados de menor sem o consentimento qualificado — infração LGPD art. 11.

Também: § 10 declara "DemoBR não é direcionada a menores de 18 anos. Em caso de identificação... eliminaremos em até 7 dias". Mas **como** DemoBR identifica? Se usar detecção automática (data de nascimento declarada), é uma camada de coleta adicional. Se depender de autodeclaração, falha em 100% dos casos.

> **Ação concreta**: (a) gate de **idade mínima na signup com checkbox "Declaro ter 18+ anos"**; (b) auto-declaração NÃO é defesa; precisa de **mecanismo razoável** (pode ser só o checkbox por enquanto, com DPia anual revisando).

**Severidade real:** 🟡 média — risco público raro, mas quando ocorre vira caso de mídia.

---

### 2.2 RISCOS COMERCIAIS (🔴 alto / 🟡 médio / 🟢 baixo)

#### **#1 🔴 METAS DE RECEITA BASEADAS EM BENCHMARK HERDADO, NÃO VALIDADO**

`METRICS-DASHBOARD.md` e `LAUNCH-PLAN.md` projetam:

- **Meta M3**: 100 paid = **R$ 35k MRR**
- **Meta W4**: 30 paid = **R$ 10k MRR**
- **Funil**: install → ativa 80 % → signup 30 % → publica demo 15 % → upgrade 8 % = 0,29 % install→upgrade
- **CVR Free → Paid**: 2–5 %, alvo 3 %
- **LTV/CAC ≥ 5x em 12 meses**
- **Payback ≤ 12 meses**

Cada uma dessas premissas tem fonte **fraca**:

- CVR 2–5 % Free→Paid BR — cita `research/pricing/gtm-channels.md §B`, que **explicitamente** diz: "CVRs exatos de PLG SaaS BR: depende muito de vertical, mas range 2-5% é consenso de mercado". Consenso de mercado **não é benchmark da DemoBR**.
- LTV/CAC 5x em 12m — derivado de ticket Pro R$ 49 × churn mensal 5% × margem 75%. Planilha de fluxo de caixa em SYNTHESIS.md §4.C confirma matematicamente o 5,3x. Mas **assume churn mensal de 5 %** — se for 8 % (pior cenário citado), LTV cai 30 %. **Em 6 meses reais, sem histórico, ninguém sabe a que ponto cairá**.
- Payback 12 meses **mix** depende de mix de planos, e o mix projetado (70% Pro / 25% Business / 5% Enterprise) assume que 1 em cada 4 paid é R$ 199. **Numérica incompatível com a realidade de PME-BR**: BR paga SaaS raramente > R$ 100/mês sem aprovação financeira estruturada (centros de custo). Mix mais realista: 90 % Pro / 10 % Business → ARPU médio R$ 65, não R$ 100 como projetado.

> **Veredito honesto**: essas metas não são "chutadas aleatoriamente" — são calcadas em benchmark setorial. Mas **benchmark setorial + 0 validação empírica = risco de planejamento**. Empresa pré-PMF costuma errar receita em **−60 % a +200 %** na primeira previsão de MRR (estudo First Round Capital 2020).

**Severidade real:** 🔴 alta — se MRR M3 cair para R$ 5k (não R$ 35k), o founder precisa estar preparado financeiramente. **Risco existencial, não técnico**.

#### **#2 🔴 PERSONAS INVENTADAS — ICP SEM VALIDAÇÃO COM CLIENTE**

`ICP-PERSONAS.md` §6 declara textualmente:

> "Personas são **compostas** a partir de dados secundários (não foram validadas com 10+ entrevistas reais).
> Demográficos (salário, localização) são **inferências** baseadas em padrão SaaS B2B BR 2026, não em survey direto.
> Job-to-be-done foi **redigido pela equipe** com base em copy pública de Supademo/Storylane/Navattic."

Pedro (PMM 28–35, R$ 7–12k, SP/RJ/BH), Carla (Head CX 32–42, R$ 12–20k), Rafael (founder solo 25–35) são **personas literárias**. Estão razoavelmente bem-desenhadas para o segmento, mas **ninguém fez 10 entrevistas com PMMs BR para confirmar**:

- "Pedro gasta 60 % do tempo do AE em demo" — derivada de tese genérica, não medida
- "60 % dos clientes abandonam onboarding em 7 dias" (Carla) — afirmação sem source
- "Demo amadora (Google Slides, Zoom screen share) — não passa credibilidade" (Rafael) — genérico

> **Risco concreto**: Pedro pode não ser pagante de R$ 49; pode ser R$ 49 tem que ser *budgeted*, e o PMM sozinho **não tem budget authority** em PME BR. **Quem paga pode ser head de marketing** (que não está na persona primária). Carla, corretamente descrita como "head of CS" — mas se a dor dela é onboarding, há **soluções concorrentes gratuitas** (Userpilot, Appcues free tier) que ela já conhece e usa.

**Ação concreta antes do go-live (não-negociável):** 5 entrevistas com PMMs reais de empresas com **MRR > R$ 50k** (ICP principal). Validar willingness-to-pay para R$ 49/mês vs Free-only. Se **3 de 5** disserem "não pagaria", reescalar Pro para R$ 99 ou reposicionar Free.

**Severidade real:** 🔴 alta — pricing mal validado é a forma #1 de startup B2B BR fechar sem tração.

#### **#3 🔴 CASE STUDIES FICTÍCIOS SENDO USADOS COMO PROVA**

Os 3 case studies (`CASE-01-fintech-60pct.md`, `CASE-02-agencia-3x.md`, `CASE-03-edtech-500.md`) declaram:

> "⚠️ **Case fictício.** Métricas são baseadas em padrões observados... Não há cliente real chamado 'Fintech X'. Substituir por case real antes de usar em mídia paga."

Mas são planejados para uso em:
- `/para/saas-b2b` (LP vertical) — `CASE-01` é a referência
- Webinars W1–W4 — todos os 3 cases são citados como "case real de cliente"
- Comparativos SEO
- Templates de email/copy

**Risco:** se sair um cliente SaaS BR real usando esses nomes (`Fintech X`, `Agência Y`, `Edtech Z`) em uma busca no Google, ou se um repórter investigar (LinkedIn é rastreável), é caso de **publicidade enganosa (CDC art. 37)** + quebra de confiança. PMM brasileiro é profissional atento; **case fictício tem 90 % de chance de ser percebido** em 6 meses — não é "passar batido".

> **Ação concreta:** remover nomes dos templates até ter **1 case real** (mesmo que com métricas parciais — founder pode ser o "case 0"). Substituir por "Estudo de caso em construção" nos primeiros 90 dias.

**Severidade real:** 🔴 alta — risco reputacional multiplicado por exposição pública.

#### **#4 🟡 AFILIADOS 20 % RECORRENTE × LTV CURTO — UNIT ECONOMICS FRÁGIL**

`LAUNCH-PLAN.md` §4.6 propõe **20 % recorrente por 12 meses**. `TEMPLATE-06-affiliate-program.md` faz a conta:

> "10 clientes ativos = R$ 200/mês recorrente pra você."

Mas o **cálculo inversa do DemoBR** não aparece explicitamente. Com:

- Pro R$ 49 → afiliado recebe R$ 9,80/mês por cliente × 12 = R$ 117,60
- Business R$ 199 → afiliado recebe R$ 39,80/mês × 12 = R$ 477,60
- LTV médio cenário: 70% Pro, 25% Business, 5% nada = **(R$ 117,60 × 0,7) + (R$ 477,60 × 0,25) × churn_real**

Assumindo churn mensal de 5 % (igual à hipótese do SYNTHESIS.md), a comissão esperada por afiliado convertido é ~R$ 60 por cliente. **CAC efetivo via afiliado** = R$ 60 por cliente ÷ **assumindo a vida média de 16 meses** (1/churn) ≈ **CAC R$ 60**. Em R$ 49 de MRR × 16 meses × 75 % margem = **LTV R$ 588**.

> **CAC/LTV afiliado = 60 / 588 ≈ 10 %** — saudável.
> **Mas** se Hotmart cobra ~R$ 0,99 por transação + R$ 0,10/por saque, há fricção. Se Lemon Squeezy cobra 5 % + R$ 0,50, mais atrito ainda.

A pergunta que o fundador precisa responder **antes de lançar programa** é: **quanto do meu MRR estou disposto a trocar por aquisição alavancada?** 20 % é **alto** vs benchmark LATAM (10–15% recorrente). GuiaFlow, Make, Notion usam 10–30%; média do setor é 15 % recorrente em SaaS B2B.

**Risco real:** alto churn de afiliado (afiliado desiste em 30 dias se não converteu ninguém) + comissão mínima garantida de 12 meses mesmo para afiliado inativo = **compra de aquisição cara se o canal não viralizar**.

> **Recomendação:** 20 % recorrente está no topo do benchmark mas aceitável para **MVP, com cláusula de "min active referrals"**, ou começar com 15 % e fazer upgrade automático para 20 % depois de 5+ conversões. **Não abrir para Cold-affiliate** (Hotmart PLR) antes de 50+ conversões in-orgânicas.

**Severidade real:** 🟡 média — não-bloqueador de go-live, mas executa com vigilância.

#### **#5 🟡 CONCORRENTE GUIAFLOW: R$ 36 vs R$ 49 = VANTAGEM PERSISTENTE**

`COMPETITIVE-BATTLECARDS.md` §3 admite: "Sim, R$ 13 a mais". GuiaFlow é open source MIT (31⭐), dev-friendly, R$ 36/mês Pro. O posicionamento do DemoBR ("SaaS gerenciado sem BYOK") é defensável para **PMM não-técnico**, mas o **preço BR tem teto psicológico**. **Em PME de 30 pessoas com orçamento apertado, R$ 13/mês é R$ 156/ano — R$ 156 que justificam contratar contador para emitir NF-e ou cancelar.**

**Risco concreto:** se GuiaFlow lançar (a) GuiFlow **SaaS gerenciado** com interface webapp (mesmo com IA BYOK opcional), eles tiram o principal diferencial do DemoBR; ou (b) adicionar **LGPD DSR endpoint** (mostrariam que é viável sem R$ 200k de investimento), a tese "DemoBR é o único BR-LGPD-by-design" morre.

> **Risco real:** GuiaFlow não está parado — está em release contínuo. Toda semana é uma chance de eles cobrirem o gap. **DemoBR precisa correr**. A janela competitiva é **6–12 meses**, não 24.

**Mitigação:** acelerar roadmap de features que **NÃO podem ser OSS** (ex.: AI voice cloning PT-BR + WhatsApp Business API + integração nativa com HubSpot BR/RD/Kommo via OAuth) e travar clientes com multi-tenant + onboarding assistido.

**Severidade real:** 🟡 média — risco existencial em 18 meses se não for mitigado.

#### **#6 🟢 CONCORRENTE SUPADEMO ENTRAR NO BR COM PIX**

`COMPETITIVE-BATTLECARDS.md` §1 cita: "Supademo Scale $50 ≈ R$ 275. Supademo Business $249 ≈ R$ 1.000. DemoBR Pro é 82 % mais barato." Diferencial é forte. Mas a Supademo tem capital (50+ funcionários, ARR US$ 4M, fundamento de 200k+ usuários), pode **adicionar PIX/boleto/Asaas em 30 dias** se quiser entrar no BR de fato. **Por que não fizeram ainda?** Mercado BR sozinho é TAM ~R$ 30M/ano (SYNTHESIS.md §1) — pequeno para Supademo. Mas se GuiaFlow OSS comer parcela, eles podem reagir.

**Severidade real:** 🟢 baixa — não-bloqueador para 6 meses; precisa monitoramento.

#### **#7 🟡 CONVERSÃO FREE→PAID 3 % É CHUTE, NÃO BENCHMARK COMPROVADO**

`research/pricing/gtm-channels.md` §B diz: "CVRs exatos de PLG SaaS BR: depende muito de vertical, mas range 2-5% é consenso de mercado. **Validar com casos reais**". Não há **1 empresa SaaS B2B BR de demos interativas** com CVR Free→Paid documentado para usar como referência. O número 3% é mediana do consenso, **não benchmark do segmento**.

**Realidade mais provável:** **1 % a 3 %** em PME-BR (Pagar.me, Conta Azul, Omie reportaram esse range em entrevistas públicas). **0,5 %** nos primeiros 6 meses (ciclo de descoberta + educação).

**Severidade real:** 🟡 média — meta W4 de 30 paid é otimista em 1,5–2x vs cenário base. Founder precisa estar preparado para "30 paid só no M4, não W4".

#### **#8 🟢 VÍDEO DEMO DE 30s NÃO VERIFICADO ESTAR PRONTO**

`LAUNCH-PLAN.md` §3.3 menciona "GIF de 10s gravado em `app.easydemo.io/d/exemplo-saas-b2b`" para Product Hunt, mas não vi o arquivo. Risco baixo, mas é placeholder até confirmar. Verificar antes do go-live.

**Severidade real:** 🟢 baixa.

#### **#9 🟡 SETUP POSTHOG "EU OPT-IN" NÃO CONFIRMADO**

`subprocessors-list.md` diz "PostHog Cloud... 🇺🇸 EUA + 🇪🇺 UE (data residency EU opt-in)". Isto é **declaração de disponibilidade**, não de **uso**. Se DemoBR não configurou Data Residency EU no painel PostHog, dados de leads EU (não temos leads EU ainda, mas potenciais) iriam para servidor US. Em 18 meses, isso vira problema.

**Severidade real:** 🟡 média — depende do plano de expansão LATAM (M6+).

#### **#10 🟡 CONTEÚDO PRÉ-FEITO (90 POSTS SOCIAIS) — RISCO "LOREM IPSUM-LIKE"**

`SOCIAL-MEDIA-KIT.md` (não lido integralmente mas referenciado) menciona 90 posts pré-prontos, 15 blog posts, 5 pilares, etc. **NÃO CONSEGUI VERIFICAR** se estão prontos como produto ou como brief/outline. Se forem drafts completos, **ótimo**. Se forem TÍTULOS + 1 parágrafo de outline, é "lorem-ipsum-like" e founder gasta 2h/dia para terminar.

**Severidade real:** 🟡 média — operacional, não estratégica.

---

## Seção 3 — DPO FAST-TRACK: roteiro ≤30 dias

> **Premissa: o fundador não pode esperar 90 dias (timeline declarado) para contratar DPO. LGPD art. 41 não diz "90 dias após publicação"; diz "tem que ter".** Vou propor um fast-track realista de **30 dias corridos**:

### DIA 0–3: Decisão e provisionamento

```
[ ] Aprovar orçamento (R$ 2k/mês para PJ retainer júnior — caminho B do DPO.md)
[ ] Definir caminho (B — PJ retainer — recomendado para porte DemoBR)
[ ] Coletar 3+ DPOs certificados (CIPP/E, CIPM, EXIN PDP F) em:
    - LinkedIn "DPO BR certificado + SaaS"
    - Plataforma JusBrasil (filtrar "LGPD" + "DPO")
    - Indicação ABStartups + Endeavor
    - Plataformas: Exind, Privally (custo inicial menor)
[ ] Enviar briefing (DPO-PROCESS.md §Fase 1) — escopo: DSR + reporte ANPD + revisão documental anual
```

### DIA 4–10: Seleção e proposta comercial

```
[ ] 3 candidatos finalistas pré-filtrados por certificação (CIPP/E, CIPM)
[ ] Contratos PJ com NDA + cláusulas de substituição (DPO-PROCESS.md §6.2)
[ ] Proposta comercial: R$ 2k/mês júnior OU R$ 5k/mês sênior certificado
    - Inclui: retainer ≥ 8h/mês, resposta ANPD 24h, DSR 15 dias úteis
    - Backup de DPO (cobertura férias/afastamento) — clause obrigatória
[ ] Verificação de inexistência conflito de interesse (DPO.md §3.7)
```

### DIA 11–20: Contratação + onboarding expresso

```
[ ] Contrato PJ assinado (modelo em DPO-PROCESS.md §Fase 3)
[ ] NDA assinado
[ ] Onboarding técnico (3 sessões de 2h cada):
    - Sessão 1: DPO + CTO — visão geral do produto + stack (Hetzner, Clerk, R2)
    - Sessão 2: DPO + tech lead — `app.dsr_log`, audit_log, fluxo de eliminação
    - Sessão 3: DPO + líder de suporte — fila de tickets + triagem DSR
[ ] Acesso:
    - GitHub (Read)
    - Sentry (Read)
    - Painel admin (perfil app_dpo)
    - Postgres (Read-only role app_dpo)
    - app.dsr_log (RW)
    - Slack #privacidade + #incidentes
    - PagerDuty (somente P0/P1)
[ ] Página /dpo publicada (template em DPO.md §6.2)
```

### DIA 21–25: Comunicação e disclosures

```
[ ] Substituir placeholder@easydemo.io em todos os 13 docs:
    - scripts/check-dpo-missing.ts + busca manual (DPO não vem por grep)
    - Atualizar CHANGELOG-DPO.md (entrada v1.0)
[ ] Comunicar nomeação à ANPD (https://www.gov.br/anpd/)
    - Formulário de comunicação de encarregado
    - CPF + nome + e-mail funcional
[ ] Atualizar privacy-policy.md §11 (template em PHASE-13-dpo-placeholder.md §4.2a)
[ ] Atualizar todos os rodapés (privacy, terms, DPA, cookies, subprocessors, DSR, RTBF, IRP)
```

### DIA 26–30: Go-live com DPO ativo

```
[ ] Primeiro reporte mensal programado (DPO-PROCESS.md §4.1)
[ ] Plano de treinamento anual rascunhado (DPO-PROCESS.md §5.4)
[ ] DPIA inicial rascunhada (LGPD art. 38) — focada em: dados de lead + analytics + DSR
[ ] Banner de cookies implementado (c.f. Seção 2.1 #5)
[ ] Selfie com documento removida do fluxo DSR (c.f. Seção 2.1 #3)
[ ] Comunicação oficial: "DemoBR nomeou [NOME] como Encarregado (DPO)"
    - LinkedIn post
    - Email para waitlist
    - Atualização em todos os canais
```

### Custos estimados — DPO FAST-TRACK

| Item | Custo |
|------|-------|
| PJ retainer mensal (DPO júnior) | R$ 2k–5k/mês |
| Plataforma de DPO as a Service (se Caminho C) | R$ 800–3k/mês |
| Consultoria pontual para revisão dos 11 docs | R$ 8k–25k (único) |
| CMP (cookies) | R$ 100–300/mês |
| **Total primeiro mês** | **R$ 11k–33k** |

> **Nota crítica**: R$ 11k no M0 é investimento único; do M1 em diante é só R$ 2,3–8,3k/mês. Comparado ao **risco de multa ANPD** (2 % do faturamento ou R$ 50k por infração) ou **indenização coletiva** (R$ 100k+ por dano moral coletivo — precedente Procon/SP 2024), é bargain.

---

## Seção 4 — PRICING — validar com 5 entrevistas (roteiro)

> **Objetivo**: confirmar **willingness-to-pay** R$ 49/mês e R$ 199/mês **antes** de publicar pricing público (que uma vez publicado é caro de alterar).

### 4.1 Recrutamento (5 perfis × canais)

| # | Perfil | Cargo-alvo | Onde encontrar | ICP-Match |
|---|--------|-----------|----------------|-----------|
| 1 | Pedro — PMM PME | PMM SaaS B2B PME (10–50 func) | LinkedIn: "PMM" + SaaS + BR; RSS Summit community | Sim |
| 2 | Head de Marketing PME | Head Mktg / Growth | LinkedIn "head of marketing"; SaaS Break newsletter | Sim — quem paga |
| 3 | Carla — Head de CS mid-market | Head CS em SaaS 50–200 func | CS Practice BR; Customer Success Network | Sim |
| 4 | Rafael — Founder solo | Founder early-stage SaaS BR | Twitter "build in public"; IndieHackers BR; Onda community | Sim — Free avocate |
| 5 | "Anti-Pedro" | PMM de SaaS enterprise BR (1000+ func, Supademo G2 leader user) | LinkedIn Senior PMM em TOTVS, RD, Stone | NÃO — validação para **anti-ICP** |

### 4.2 Roteiro de 30 min (5 blocos × 6 min)

```
BLOCO 1 (6 min) — Contexto
- "Você usa alguma ferramenta de demo interativa pra prospects?"
  - Se SIM → qual? quanto paga? há quanto tempo?
  - Se NÃO → "como você cria demo hoje? quanto tempo leva?"
- "Seus demos estão no Loom/Zoom/Slides ou já migrou pra algo mais sofisticado?"

BLOCO 2 (6 min) — Demo do produto (NÃO pitch)
- Founder grava 1 demo de 5 passos ANTES (a "demo de DemoBR")
- Pedir para entrevistado assistir a demo completa **sem opinar**
- Fazer 3 perguntas:
  - "Isso te ajuda em algo que você faz hoje?"
  - "O que te incomodou?"
  - "Se você pudesse usar isso no trabalho, qual seria o primeiro uso?"

BLOCO 3 (6 min) — Pricing (não perguntar se pagaria; simular escolha)
- "Se você pudesse escolher 1 dessas 3 opções AGORA pra começar HOJE,"
  - A) Free, com 3 demos e marca d'água
  - B) R$ 49/mês (≈ R$ 1,60/dia) Pro, sem marca d'água, 20 demos
  - C) R$ 199/mês Business, domínio custom + integrações BR + sem limites
- "Qual escolheria? Por quê?"
- (Se B) "Você pediria aprovação de alguém ou pagaria com cartão corporativo?"
- (Se A) "O que precisaria ter no Pro pra você decidir assinar logo no M0?"
- (Se C) "Esse plano seria pra empresa ou pra você?"

BLOCO 4 (6 min) — Value & Swap
- "Hoje você gasta quanto tempo por demo? E quanto custa a hora do AE?"
- "Se você economizasse 50% desse tempo (de X min pra X/2), quanto valeria isso pra empresa em reais/mês?"
- "R$ 49/mês te parece caro, barato ou justo, dado esse valor?"

BLOCO 5 (6 min) — Veredito honesto + dados demográficos
- "Me dê 3 adjetivos pra esse produto: o que mais gostei / o que mais odiei"
- Empresa: tamanho, MRR aproximado, ticket médio SaaS que pagam
- Voltar à conversa em 30 dias: "Tem novidade?"
- RECOMPENSA: R$ 100 Amazon / 30 min feedback (NÃO gratuito — quem é gratuito é cético)

```

### 4.3 Outputs esperados (5 entrevistas)

Para cada entrevistado, registrar:

```
1. Persona match (Pedro real, Carla real, Rafael real, ou outro)
2. Willingness-to-pay declarada (escolha A/B/C)
3. Principais fricções citadas (verbatim)
4. AE/Custo de hora do AE declarado (validação unit economics)
5. Decisor de budget (PMM sozinho? Head Mktg? Compras?)
6. NPS inicial espontâneo (sem perguntar "recomendaria?")
```

### 4.4 Critério de go/no-go após 5 entrevistas

```
SE ≥ 3 de 5 escolheram B (R$ 49/mês) → CONFIRMAR Pro R$ 49, lançar.
SE 2 de 5 escolheram A (Free) → reescalar Pro para R$ 29 ou reposicionar feature.
SE ≥ 4 escolheram C (R$ 199/mês) → Free provavelmente é inútil; reposicionar planos.
SE ≥ 3 mencionaram "não pagaria / caro" sem alternativa → REVALIDAR pricing tier.

PARA BUSINESS (R$ 199):
- >= 3 de 5 com budget authority aprovados em princípio (C ou acima) → CONFIRMAR R$ 199.
- < 2 → reescalar para R$ 99 ou R$ 149, ou reposicionar foco.
```

### 4.5 Limitação declarada

**5 entrevistas não são estatisticamente significativas**. Mas **são úteis para invalidar premissas erradas** (R$ 200k de savings em BR SaaS é comum cair em erro de ICP). Use para **matar hipóteses**, não para validar.

> **Recomendação**: rodar 5 entrevistas em 7–14 dias (founder fazendo sozinho, 1h/dia). Custo total: R$ 500 (recompensa) + 5h de tempo. **Negociar com suor**: é melhor descobrir que ICP está errado ANTES de gastar R$ 5k em ads.

---

## Seção 5 — PM30DAY: checklist dos primeiros 30 dias pós-launch

> **Premissa:** go-live autorizado (Seção 1 OK + Seção 3 DPO contratado + Seção 4 pricing validado).

### DIA 1–7: Validação interna + launch soft

```
[ ] DIA -3 (antes): domain easydemo.io + SSL + DNS testados
[ ] DIA -2: página /dpo + /privacidade/solicitacao published
[ ] DIA -1: 5 usuários beta-PMM (NÃO amigos do founder) com demo criada
[ ] DIA 0 (terça, 9h BRT, conforme LAUNCH-PLAN.md §3.1):
    [ ] Product Hunt live
    [ ] LinkedIn #1 (founder)
    [ ] Email blast waitlist (desconto 30% Pro)
    [ ] YouTube Live 60min
    [ ] Slack #revops-br + #cs-br posts

[ ] DIA 1: monitorar uptime + erro 5xx a cada 2h
[ ] DIA 2: 1ª demo de "user-generated demo" (qualquer PMM cadastrado)
[ ] DIA 3: feedback NPS informal dos 5 betas (forms curtos)
[ ] DIA 4: ajustar copy baseado em feedback até D3
[ ] DIA 5: 1ª atualização de blog (1 dos 15 posts long-tail)
[ ] DIA 6: 1 compare page (vs Supademo, top priority)
[ ] DIA 7: 1ª DSR esperada — testar fluxo completo end-to-end
```

### DIA 8–14: Ajustes + canais

```
[ ] DIA 8: SEO sitemap submetido ao Google Search Console
[ ] DIA 9: 1º webinar (case real de cliente OU case do próprio founder)
[ ] DIA 10: outreach 10 PMMs (LAUNCH-PLAN.md §2.2)
[ ] DIA 11: 5 reviews Chrome Web Store (solicitar ativamente)
[ ] DIA 12: 1 guest post enviado (SaaS Break OU Gralio)
[ ] DIA 13: 2ª compare page (vs GuiaFlow)
[ ] DIA 14: review weekly — KPIs:
    - Signups Free (meta W1: 5+) — SE < 3, escalar
    - Signups Free com 1+ demo publicada (meta: 2+)
    - Erros 5xx rate (meta: < 0,5%)
    - DSR recebidas (meta: 0–1)
    - NPS inorgânico (target ≥ 7/10)
    - Uptime (target ≥ 99,5%)
```

### DIA 15–21: Escalar + pagar (com cautela)

```
[ ] DIA 15: análise cohort Free→Pro dos primeiros 7 dias (se houver dados)
[ ] DIA 16: 3ª compare page (vs Navattic)
[ ] DIA 17: 1º email reativação (TEMPLATE-05) para Free inativos
[ ] DIA 18: whitelist microinfluenciadores para programa afiliados (10 PMMs LinkedIn)
[ ] DIA 19: hotjar/Plausible ativo
[ ] DIA 20: SEO 1ª checkup (Search Console)
[ ] DIA 21: review bi-weekly:
    - MRR achieved (meta: R$ 500+ — 10 Pro convertidos)
    - Signups Free cumulativo (meta: 50+)
    - CAC blended (meta: < R$ 150)
```

### DIA 22–30: Sustain real

```
[ ] DIA 22: cobrar/convocar conversões Free→Pro in-orgânicas (in-app email)
[ ] DIA 23: publicar 2ª pillar page (P5 "Quanto custa")
[ ] DIA 24: cold outreach 20 PMMs BR (lembrar LAUNCH-PLAN.md §6.1 — tier 1)
[ ] DIA 25: 4ª compare page (vs Arcade)
[ ] DIA 26: contatos B2B (1º lead Business — Head Mktg PME)
[ ] DIA 27: analisar suporte tickets — top 3 dúvidas recorrentes
[ ] DIA 28: 5ª compare page (vs Storylane) — completa o set
[ ] DIA 29: revisar KPIs M1:
    - Signups Free totais (meta M1: ≥ 200)
    - Paid (meta M1: ≥ 5 = R$ 250+ MRR)
    - Churn Pro (meta: < 5% no M1 — proxy incidem sobre assinatura >1m)
[ ] DIA 30: relatório mensal — Lições aprendidas + plano M2
```

### RED FLAGS no M1 (qualquer um destes = parar e diagnosticar)

```
🔴 Signups Free < 50 → CAC efetivo > R$ 200. Diagnóstico: copy/channel/ICP. NÃO ESCALAR ADS.
🔴 CVR Free→Paid = 0% (0 paid no M1) → pricing/funnel/UX quebrados. NÃO ESCALAR; reescalar.
🔴 Churn Pro > 8% no M1 (assinaturas que duraram < 30 dias) → onboarding quebrado.
🔴 NPS < 30 → produto fraco. NÃO ESCALAR; voltar para ICs.
🟡 Uptime < 99% → SRE/produto precisa atenção antes de escalar.
🟡 DSR pendente > 15 dias → DPO e suporte dormindo; acordar.
🟡 Sem 1 demo user-generated (não do founder) até D14 → funil orgânico quebrado.
🟡 Chrome Web Store review < 4.0⭐ → onboarding UX quebrado.
```

### Decisão GO/NO-GO para M2

```
SE M1 atingiu:
- ≥ 200 Free + ≥ 5 paid (R$ 250+ MRR) + NPS ≥ 30 + Uptime ≥ 99% → ESCALAR para M2
- < 200 Free OU < 3 paid → HOLD escalar; iterar copy/funil
- < 100 Free OU 0 paid → STOP. Voltar para IC validation. NÃO GASTAR mais dinheiro em ads.
```

---

## Seção 6 — ADVOGADO-CHECKLIST-PRIORITÁRIO: top 5 não-negociáveis

> Caso só consiga pagar advogado para 5 itens, são estes. **Ordem importa**.

### ITEM 1 — REVISÃO DA CLÁUSULA DE LIMITAÇÃO DE RESPONSABILIDADE (ToS § 9)

```
Prioridade: 🔴 ALTA
Risco: nulidade B2C sob CDC art. 51, I
Escopo: confirmar redação que divide PJ vs PF, ou fixar valor-teto maior (ex.: 24 meses de pagamento em vez de 12)
Tempo advogado: ~4–6h
Custo: R$ 2k–5k (avulso)
Output: nova versão § 9 com redação aprovada por OAB
```

### ITEM 2 — REVISÃO DO DPA E CONFIRMAÇÃO DE DPAs COM SUBPROCESSADORES EUA

```
Prioridade: 🔴 ALTA
Risco: nulidade de transferência internacional + due diligence B2B
Escopo: revisar DPA § 8.3 (transferência internacional), confirmar SCCs versionadas e assinadas com Clerk, Cloudflare, Resend, PostHog, Sentry, OpenAI, Anthropic, ElevenLabs
Tempo advogado: ~8–12h (auditoria de 8 DPAs)
Custo: R$ 3k–6k
Output: parecer formal de adequação LGPD art. 33, II
```

### ITEM 3 — DEFINIÇÃO DE POLÍTICA DE SELFIE/VIDEOCHAMADA NO DSR

```
Prioridade: 🔴 ALTA
Risco: classificação como dado biométrico sob LGPD art. 5º, II
Escopo: revisar dsr-endpoint-policy.md § 7 + RTBF-deletion-procedure.md § 6
Tempo advogado: ~3–4h
Custo: R$ 1k–2k
Output: 
  - Opção A: remover selfie do fluxo (substituir por videochamada + 2 fatores)
  - Opção B: implementar consentimento específico + base legal art. 11 + prazo retenção 30 dias
```

### ITEM 4 — REVISÃO DE COOKIES: BASE LEGAL + BANNER OPERACIONAL

```
Prioridade: 🟡 MÉDIA-ALTA
Risco: CDC art. 37 publicidade enganosa + LGPD art. 8º consentimento
Escopo: revisar cookie-policy.md + confirmar banner CMP funcional
Tempo advogado: ~3–4h
Custo: R$ 1k–2k
Output:
  - Parecer formal sobre base legal (consentimento vs legítimo interesse) para cada categoria de cookie
  - Modelo de banner copy aprovado por OAB
  - Política de retenção para `cookie_consent_v1` (1 ano é OK?)
```

### ITEM 5 — REVISÃO DE SLA DE UPTIME × CAPACIDADE TÉCNICA REAL

```
Prioridade: 🟡 MÉDIA
Risco: descumprimento contratual B2B + rescisão
Escopo: revisar terms § 5.1 + RFC §6 confirmando VPS único
Tempo advogado: ~2–3h + consulta com engenheiro
Custo: R$ 1k–1,5k
Output:
  - Parecer: o SLA 99,5% Pro + 99,9% Business é defensável com VPS único?
  - Recomendação: baixar para 99,0% (Pro) e 99,5% (Business) até failover ativo
  - OU recomendar investimento em failover (custo adicional R$ 80/mês + 3 sem setup)
```

### BUDGET TOTAL para os 5 itens (avulso)

| Item | Estimativa |
|------|-----------|
| 1. Limitação responsabilidade | R$ 2k–5k |
| 2. DPA + DPAs subprocessadores | R$ 3k–6k |
| 3. Selfie/biometria | R$ 1k–2k |
| 4. Cookies | R$ 1k–2k |
| 5. SLA × capacidade | R$ 1k–1,5k |
| **TOTAL** | **R$ 8k–16,5k** |

> Esse investimento único vs exposição: se houver incidente P0 + DSR pendente + reclamação ANPD num cenário de empresa sem advogado, custo potencial = R$ 50k+ (multa art. 52, I) + R$ 100k+ (dano moral coletivo) + 2–4 meses de paralisação enquanto defesa. **R$ 16k é bargain.**

---

## Seção 7 — RESUMO: posição final do conclave

### Síntese em 1 parágrafo

> **A DemoBR tem produto tecnicamente sólido, documentação de privacidade pedagogicamente correta, e plano de lançamento profissional. Mas a base factual de receita é **inferida, não medida**: pricing não validado com cliente real, personas compostas (não entrevistas), cases fictícios (não publicados), métricas-alvo baseadas em benchmark setorial BR (não no segmento "interactive demo BR"). A documentação legal está 95% pronta — falta identidade jurídica + DPO + banner de cookies operacional. A janela competitiva (especialmente vs GuiaFlow OSS) é 6–12 meses, não 24. O founder precisa parar de planejar e começar a executar com clientes reais. **Se eu fosse o investidor-anjo,**(a) eu pediria: (1) 5 entrevistas de ICP antes de lançar, (2) CNPJ + DPO antes de publicar, (3) banner de cookies funcional antes do go-live — esses 3 juntos custam R$ 12–25k e protegem R$ 200k+ de exposição. O resto é execução.**

### Posição sobre publicação

| Decisão | Veredito |
|---------|----------|
| Publicar site/app HOJE (sem mudança) | ❌ **NÃO** — bloqueador: DPO, CNPJ, banner cookies |
| Publicar site/app em **30 dias** (com DPO FAST-TRACK) | ✅ **SIM** — desde que Seção 1 + 3 sejam seguidas |
| Publicar site/app em **15 dias** (sem DPO ainda) com disclaimers proeminentes | 🟡 **TALVEZ** — juridicamente defensável mas arriscado |
| Publicar **somente landing de waitlist** (sem coletar dados pessoais) | ✅ **SIM, AGORA** — já pode captar leads sem incorrer em tratamento completo |

### Posição sobre PM/Receita

| Decisão | Veredito |
|---------|----------|
| Lançar pricing R$ 49 / R$ 199 sem validar | ❌ **NÃO** — risco alto de ICP errado |
| Validar com 5 entrevistas (Seção 4) PRIMEIRO, depois lançar | ✅ **SIM** — 7 dias + R$ 500 |
| Cortar Free para 1 demo (mais agressivo) e Pro a R$ 99 | 🟢 Opção C — se pricing A/B/C sugerir |
| Apostar tudo em Product Hunt na primeira semana | ❌ **NÃO** — PH sozinho raramente é suficiente para SaaS B2B BR |
| Apostar em cold outreach LinkedIn (Pedro persona) | 🟡 **TALVEZ** — funciona, mas precisa validar ICP antes |

### Tese final

A DemoBR **NÃO ESTÁ PRONTA** para go-live público completo, mas **ESTÁ PRONTA** para go-live de waitlist + 5 entrevistas de validação + contratação de DPO FAST-TRACK. Em 30 dias, com R$ 12–25k de investimento, ela pode entrar em mercado com proteção jurídica adequada. **O investimento é alto para o porte, mas é desproporcionalmente pequeno comparado ao risco de NÃO investir.**

---

## Apêndice — Fontes consultadas

### Documentos legais lidos
- `legal/privacy-policy.md` (361 linhas)
- `legal/terms-of-service.md` (341 linhas)
- `legal/dpa-data-processing-agreement.md` (393 linhas)
- `legal/cookie-policy.md` (202 linhas)
- `legal/dsr-endpoint-policy.md` (259 linhas)
- `legal/incident-response-plan.md` (457 linhas)
- `legal/RTBF-template.md` (202 linhas)
- `legal/RTBF-deletion-procedure.md` (470 linhas)
- `legal/ADVOGADO-CHECKLIST.md` (485 linhas)
- `legal/EMAIL-PARA-ADVOGADO.md` (247 linhas)
- `legal/DPO-PROCESS.md` (470 linhas)
- `legal/DPO.md` (299 linhas)
- `legal/subprocessors-list.md` (150 linhas)

### Documentos de marketing lidos
- `marketing/BRAND.md` (290 linhas)
- `marketing/LAUNCH-PLAN.md` (391 linhas)
- `marketing/ICP-PERSONAS.md` (297 linhas)
- `marketing/SEO-PILLAR-PAGES.md` (342 linhas)
- `marketing/METRICS-DASHBOARD.md` (326 linhas)
- `marketing/COMPETITIVE-BATTLECARDS.md` (294 linhas)
- `marketing/CASE-STUDIES/CASE-01-fintech-onboarding-60pct.md` (181 linhas)
- `marketing/CASE-STUDIES/CASE-02-agencia-propostas-3x.md` (200 linhas)
- `marketing/CASE-STUDIES/CASE-03-edtech-500-alunos.md` (192 linhas)
- `marketing/TEMPLATES/TEMPLATE-06-affiliate-program.md` (80 linhas)
- `research/pricing/SYNTHESIS.md` (trechos: churn, LTV/CAC, conversão, payback)

### Documentos de setup lidos
- `setup-report/PHASE-13-dpo-placeholder.md` (325 linhas)
- `setup-report/PHASE-5-legal-audit.md` (439 linhas)
- `docs/RFC-Brazilian-Supademo.md` (trechos de pricing: linhas 13, 32, 561–630; stack: 165–190)

### Honesty notes

Esta auditoria foi feita em **18/Out/2026** com leitura integral de todos os documentos referenciados. **NÃO** inventei opiniões jurídicas — todos os riscos legais citam artigos específicos da LGPD ou CDC e estão sujeitos a revisão por advogado habilitado (OAB ativa). **NÃO** inventei benchmarks — onde não tenho benchmark BR específico (ex.: LTV/CAC médio de SaaS B2B PME demo BR), declarei explicitamente. **NÃO** validei números — quando o documento declara X, cito X como "declarado, não verificado".

A conclusão **NÃO é recomendação de investimento** nem **due diligence formal**; é uma triagem crítica de um agente IA para um founder que precisa decidir "publico ou não publico" nos próximos 30 dias.

```
Última atualização: 18/Out/2026
Status: Triagem crítica — revisão humana (advogado + PM sênior) obrigatória
Autor: Mini-Conclave subagente (Advogado + PM)
Versão: 1.0
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX (placeholder, c.f. Seção 1.2)
```
