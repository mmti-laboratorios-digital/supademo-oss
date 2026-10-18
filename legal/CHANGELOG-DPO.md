# Changelog do Encarregado (DPO) — DemoBR

> Histórico de revisões jurídicas da documentação em `legal/`.
>
> **Modelo (template) — gerado em 18/Out/2026. Necessária revisão por
> advogado antes de publicação.**

---

## 1. Histórico de versões

| Versão | Data | Responsável | Mudanças | Próxima revisão |
|--------|------|-------------|----------|-----------------|
| **v0.1** | 18/Out/2026 | Tech lead + DPO provisório (leigo) | Criação inicial dos 11 documentos-modelo. Base: `docs/SECURITY-MODEL.md`, RFC, modelo de DB Drizzle, stack técnico (Next 15 / Clerk / Asaas / Hetzner / Cloudflare / Resend / Sentry / PostHog). | 18/Abr/2027 (6 meses) — **após revisão inicial por advogado** |

---

## 2. Cronograma planejado (sujeito a ajustes)

| Marco | Data prevista | O que precisa acontecer |
|-------|---------------|------------------------|
| **v0.2 — Revisão jurídica inicial** | até 18/Dez/2026 | Advogado externo revise todos os 11 documentos. Substituir placeholders de CNPJ, endereço, razão social. Adaptar cláusulas conforme personalidade jurídica da DemoBR LTDA. |
| **v0.3 — Aprovação sócios** | até 18/Jan/2027 | Reunião com quadro societário para aprovação final. |
| **v1.0 — Publicação oficial** | 01/Fev/2027 | Publicação no site. Substituir "Status: Modelo" por "Status: Vigente". Ativar cookie banner usando este conteúdo. |
| **v1.1 — Auditoria interna** | 18/Ago/2027 | DPIA anual de novos tratamentos (ex.: ativação de subprocessadores IA). |
| **v2.0 — Revisão semestral** | 18/Fev/2028 | Revisão periódica de todos os documentos. |
| **v2.1 — Ajustes pontuais** | contínua | Aplicar mudanças quando legislação, produto ou subprocessador mudar. |

---

## 3. Mudanças substanciais relevantes

Sempre que algum dos seguintes ocorrer, gerar nova versão:

```
TRIGGERS DE MUDANÇA SUBSTANCIAL:

1. Mudança no quadro societário ou razão social.
2. Nova sede ou novo CNPJ.
3. Entrada de novo subprocessador (sozinho, sem combinação com os 11 modelos iniciais).
4. Mudança no stack que afete segurança/LGPD (ex.: trocar Clerk por Auth0,
   mudar para multi-region DB).
5. Saída de subprocessador sem substituição equivalente.
6. Mudança de pricing que afete Termos de Uso (§4).
7. Expansão internacional (ex.: aceitar clientes UE).
8. Mudança de jurisdição ou foro.
9. Alteração legislativa relevante (ex.: nova Resolução ANPD).
10. Expansão de tratamento para categorias de dados antes não tratadas
    (ex.: aceitar dado sensível — improvável, mas acompanhamos).
```

---

## 4. Responsáveis

| Função | Nome (atual) | Substitutos |
|--------|--------------|-------------|
| **Encarregado (DPO)** | _a definir_ | _a definir_ |
| **Apoio jurídico externo** | _a definir_ | _a definir_ |
| **Tech lead responsável pela implementação** | _a definir_ | _a definir_ |
| **CEO / Responsável legal da DemoBR LTDA** | _a definir_ | _a definir_ |
| **DPO provisório durante criação dos modelos** | Tech lead + ChatGPT-assisted | — |

> **Substituir pelos nomes reais antes da publicação.**

---

## 5. Pendências legais a resolver antes de publicar

A lista abaixo contém decisões estratégicas que precisam de
orientação jurídica antes da publicação.

### 5.1 Personalidade jurídica

- [ ] Definir se DemoBR é MEI, EPP, LTDA pura, ou S.A.
- [ ] Confirmar composição societária (quem assina estes documentos).
- [ ] Verificar necessidade de conselho fiscal ou administrador.

### 5.2 Contratos com subprocessadores

- [ ] Confirmar status dos DPAs assinados com:
  - [ ] Hetzner
  - [ ] Cloudflare
  - [ ] Clerk
  - [ ] Asaas
  - [ ] Resend
  - [ ] PostHog
  - [ ] Sentry
  - [ ] OpenAI/Anthropic (quando ativado)

### 5.3 Delegação/Representação

- [ ] Definir se DPO será interno ou externo.
- [ ] Definir quem assina estes modelos.

### 5.4 Estratégia comercial

- [ ] Definir SLA efetivo por plano (atualmente proposto: best-effort
      / 99,5 % / 99,9 %).
- [ ] Definir política de reembolso (atualmente proposto: 7 dias
      integrais).
- [ ] Definir comarca (atualmente proposto: São Paulo/SP).

### 5.5 Âmbito de aplicação

- [ ] Definir se atendemos PJ apenas ou PF também.
- [ ] Definir países com suporte (atualmente: BR apenas).
- [ ] Avaliar se LGPD-supletiva para clientes EU.

---

## 6. Bases regulatórias consultadas

Para referência rápida, estes documentos foram escritos com base
nas seguintes fontes públicas:

| Fonte | Utilização |
|-------|------------|
| **LGPD (Lei 13.709/2018)** | Base normativa principal |
| **GDPR (Reg. UE 2016/679)** | Paralelo interpretativo para DSR, DPA, breach notification |
| **Marco Civil da Internet (Lei 12.965/2014)** | Contexto de internet no Brasil |
| **CDC (Lei 8.078/90)** | Cláusulas contratuais, especialmente art. 51 (proteção contra cláusulas abusivas) |
| **CTN (Lei 5.172/1966) art. 173/196** | Retenção fiscal de 5 anos |
| **Resolução CD/ANPD nº 1/2023 (ou mais recente)** | Procedimento de comunicação de incidente |
| **ePrivacy Directive (Dir. 2002/58/CE)** | Cookies (paralelo GDPR) |
| **DMCA 17 U.S.C. §512** | Copyright claims |

> ⚠️ Citar fontes oficiais e atualizadas antes de publicar. Mudanças
> regulatórias podem ocorrer.

---

## 7. Templates versionados

Todos os arquivos em `legal/` seguem o cabeçalho:

```
Última atualização: {DD/MMM/AAAA}
Status: {Vigente | Modelo (rascunho)}
Versão: {semver}
```

Exemplo:

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho)
Versão: 0.1.0
```

Quando uma versão vira vigente:

```
Última atualização: 01/Fev/2027
Status: Vigente
Versão: 1.0.0
```

---

## 8. Notificação de titulares sobre mudanças

Mudanças substanciais (ver §3) são comunicadas por:

| Canal | Audiência | Prazo |
|-------|-----------|-------|
| E-mail do DPO | Titulares | +30 dias antes da vigência |
| Banner no player | Visitantes ativos no player | Imediato |
| Banner no painel admin | Creators | +30 dias antes da vigência |
| Página dedicada | Todos | +30 dias antes da vigência |
| ANPD (se aplicável) | Autoridade | Conforme regulamento |

Mudanças não-substanciais:
- Atualização da versão sem aviso individual, com nota explicativa
  no rodapé do arquivo.

---

## 9. Arquivos mortos (histórico de versões anteriores)

Quando uma nova versão entra em vigor, a anterior fica disponível
em:

| Arquivo | Status | Localização pública |
|---------|--------|---------------------|
| `privacy-policy.md` v0.1 | Substituída | `demobr.com.br/privacidade/historico/v0.1` |
| `terms-of-service.md` v0.1 | Substituída | `demobr.com.br/termos/historico/v0.1` |
| ... | ... | ... |

---

## 10. Auditoria anual

Anualmente (preferencialmente em abril ou outubro), o DPO deve:

1. **Revisar** todos os documentos da pasta `legal/`.
2. **Verificar** se subprocessadores mudaram (`subprocessors-list.md`).
3. **Conferir** se houve mudanças regulatórias (LGPD, ANPD, GDPR, ePrivacy).
4. **Atualizar** placeholders (CNPJ, endereço, contatos).
5. **Atualizar** o cronograma de revisão da §2 deste arquivo.
6. **Emitir relatório** de conformidade para a liderança (CEO/sócios).

---

```
Última atualização: 18/Out/2026
Status: Modelo (rascunho) — Revisão por advogado obrigatória antes de uso público
Versão: 0.1.0
DemoBR LTDA — CNPJ XX.XXX.XXX/0001-XX
```
