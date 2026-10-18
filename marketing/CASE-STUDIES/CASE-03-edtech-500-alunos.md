# Case Study #3 — Edtech Z treinou 500 novos usuários sem reuniões

> **Status:** fictício, baseado em padrão de mercado de edtechs BR (cursos online, LMS corporativo).
> **Quando usar:** blog, landing `/para/edtech`, webinars W2.
> **Métricas marcadas como "estimativa interna"**.

---

## TL;DR

| Item | Valor |
|---|---|
| **Empresa** | Edtech Z (cursos online para PMs e devs) |
| **Setor** | Edtech |
| **Funcionários** | 25 |
| **Plano DemoBR usado** | Business (R$ 199/mês) |
| **Resultado principal** | **500 alunos ativados em 30 dias** sem reuniões + **−80% calls de onboarding** |
| **Período** | 6 semanas (jul–ago/2026) |

---

## Contexto

Edtech Z vende **cursos online** (PM, dev, growth) com **2 planos principais**:

1. **Self-service** (R$ 97/mês) — aluno navega sozinho.
2. **Coaching** (R$ 497/mês) — aluno tem 1 mentor + 4 calls/mês.

O **onboarding era manual**: aluno novo recebia email + era convidado pra 1 call de boas-vindas de 30min com o CS. **80% dos alunos self-service nunca completavam o primeiro módulo** — abandonavam em 7 dias.

### Métricas antes (Q2 2026)

| Métrica | Valor |
|---|---|
| Alunos novos/mês | **250** |
| Call de onboarding (30min) | **200/mês** (80% dos novos) |
| Tempo CS em onboarding | **100h/mês** |
| Alunos que completam módulo 1 | **20%** |
| Churn em 30 dias (self-service) | **45%** |
| NPS pós-onboarding | **38** |

---

## Problema

> *"Cada aluno novo era 1 call de 30min. 200 calls por mês. CS não aguentava, aluno não engajava."*
> — Head de CX, Edtech Z

### 3 problemas específicos

1. **Self-service sem onboarding = baixa ativação**. Aluno pagava R$ 97 e não sabia por onde começar.
2. **CS saturada com calls** que podiam ser conteúdo.
3. **Churn alto** porque aluno nunca viu valor do produto.

---

## Solução

Edtech Z adotou **DemoBR Business** em julho/2026 com 2 focos:

1. **Substituir a call de onboarding** por demo interativa que aluno faz sozinho.
2. **Embedar a demo** na área logada do aluno + no email de boas-vindas.

### Como fizeram

| Recurso DemoBR | Como Edtech Z usou |
|---|---|
| **Captura via extensão Chrome** | Gravou tour de "primeiros passos" do LMS (10 steps). |
| **Branching condicional** | "Você é PM, dev ou growth?" → demo específica pra cada perfil. |
| **Embed iframe** | Na área logada do aluno, em `app.edtechz.com.br/onboarding`. |
| **Personalização `{{nome}}`** | "Oi, {{nome}}, vamos começar?" — aluno sente que foi customizado. |
| **TTS pt-BR** | Narração do onboarding com voz neural brasileira (incluso no Business). |
| **WhatsApp CTA** | "Tire dúvidas no WhatsApp" no final. |
| **SCORM export** | Integração com LMS corporativo de cliente B2B (TOTVS, Senior). |
| **Analytics de step** | Identificou step com maior drop-off → reformulou. |

### Sequência pós-signup (Edtech Z)

```
Dia 0: Email "Bem-vindo" + link da demo
   ↓
Dia 1: Demo interativa na área logada
   ↓
   ├── Concluiu 100% → tag "ativado" → email "módulo 1"
   ├── Concluiu 50-99% → email "continue sua demo"
   └── Concluiu <50% → email "tá com dúvida? WhatsApp"
```

---

## Resultados (após 6 semanas)

| Métrica | Antes | Depois | Delta |
|---|---|---|---|
| Alunos novos/mês | 250 | **500** | **+100%** |
| Calls de onboarding | 200/mês | **40/mês** | **−80%** |
| Tempo CS em onboarding | 100h/mês | **20h/mês** | **−80%** |
| Alunos que completam módulo 1 | 20% | **62%** | **+210%** |
| Churn em 30 dias (self-service) | 45% | **18%** | **−60%** |
| NPS pós-onboarding | 38 | **61** | **+61%** |

### Por que funcionou

> *"Aluno self-service que completava a demo tinha 5x mais chance de ativar o produto."*
> — Head de CX, Edtech Z

> *"Economizamos 80h/mês de CS. O time agora foca em alunos do coaching."*
> — Head de CX, Edtech Z

### 3 alavancas-chave

1. **Branching por perfil** (PM vs dev vs growth) fez a demo parecer "feita pra mim".
2. **TTS pt-BR** reduziu fricção de leitura — aluno ouve no ônibus.
3. **Embed na área logada** virou onboarding oficial — aluno vê ANTES de tentar navegar sozinho.

### ROI calculado

- **Economia de CS**: 80h/mês × R$ 60/h = **R$ 4.800/mês economizado**
- **Receita incremental** (mais alunos completam módulo 1 → upgrade coaching): ~R$ 8.000/mês
- **Total**: **~R$ 12.800/mês**
- **Custo DemoBR Business**: R$ 199/mês
- **ROI**: **~64x**

---

## Screenshot conceitual

> **Conceito do screenshot:** Tela do LMS Edtech Z com player DemoBR embedado mostrando onboarding por áudio (TTS pt-BR).
>
> **Mockup textual:**
>
> ```
> ┌──────────────────────────────────────────────────┐
> │ Edtech Z · Sua trilha começa aqui               │
> ├──────────────────────────────────────────────────┤
> │ ┌──────────────────────────────────────────┐    │
> │ │  [Player DemoBR embedado]                │    │
> │ │   Etapa 3 de 10                           │    │
> │ │   🎧 "Agora clique em 'Meus Cursos'..."  │    │
> │ │   [▶ Play narration]  [⏭ Pular]          │    │
> │ │   [screenshot do LMS com hotspot]        │    │
> │ │                                          │    │
> │ │   [← Anterior]  [Próximo →]              │    │
> │ └──────────────────────────────────────────┘    │
> │                                                  │
> │   [ 📱 Tirar dúvida no WhatsApp ]               │
> │   [ 📊 Meu progresso: 30% ███░░ ]              │
> └──────────────────────────────────────────────────┘
> ```

---

## Próximos passos (Edtech Z)

| Ação | Plano |
|---|---|
| Demo interativa por curso | Criar 12 demos (1 por curso) até Q1 2027 |
| AI voice cloning PT-BR | Quando DemoBR lançar Q1 2027, clonar voz do mentor principal |
| Sandbox demo pra clientes B2B | Permitir aluno testar LMS antes de comprar (Q1 2027) |

---

## Como replicar (playbook)

> Se você é edtech, SaaS com onboarding complexo, ou LMS corporativo:

1. **Capture 1 demo de onboarding** com extensão Chrome (10 steps, ~5 min).
2. **Adicione branching** por persona (PM vs dev vs designer).
3. **Embed na área logada** do aluno + no email de boas-vindas.
4. **Configure TTS pt-BR** para narração (reduz fricção de leitura).
5. **Use `{{nome}}` na primeira tela** — personalização aumenta conclusão 20%.
6. **WhatsApp CTA** no final para dúvidas.
7. **Meça completion rate por step** — drop-off alto = hotspot confuso.

> **Investimento:** R$ 199/mês (Business) + 1 semana de setup.
> **Retorno esperado:** 50–80% redução de calls + 30–60% mais alunos ativados.

---

## Disclaimer

> ⚠️ **Case fictício.** Métricas são baseadas em padrões observados em edtechs BR (referências: Hotmart, Udemy, Solides — `research/pricing/gtm-channels.md` §B.6) e em benchmarks públicos de Tango/Scribe. Não há cliente real chamado "Edtech Z". Substituir por case real antes de usar em mídia paga.

---

## Referências internas

- ICP Persona 2 (Head de CX/CS): `marketing/ICP-PERSONAS.md`
- Vertical edtech: `marketing/SEO-PILLAR-PAGES.md` §4 (LV3)
- TTS pt-BR: `specs/mvp-scope.json` (mvp_features)
- Cases públicos: `research/demos/SUMMARY.md` §4 (capacidades SCORM)
- Tom de voz: `marketing/BRAND.md` §1