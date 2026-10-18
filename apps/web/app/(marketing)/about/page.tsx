import Link from "next/link";

/**
 * About page (PT-BR). Content lives in content/about.mdx (see file).
 * This page renders the structured sections directly — the .mdx file is the
 * authoring source; this TSX layer is what Next.js compiles and renders.
 */
export default function AboutPage() {
  return (
    <main className="container max-w-3xl py-24">
      <header className="mb-12">
        <h1 className="text-balance text-4xl font-bold md:text-5xl">
          Por que demos interativas, por que em PT-BR.
        </h1>
        <p className="mt-3 text-muted-foreground">
          A DemoBR nasceu de uma pergunta: por que a gente ainda manda PDF pra
          lead qualificado?
        </p>
      </header>

      <section className="prose prose-neutral dark:prose-invert">
        <h2>Nossa história</h2>
        <p>
          A DemoBR começou em 2025 quando o Alex, então PM numa startup de
          fintech, ficou cansado de gravar a mesma demo em Loom toda semana.
          Existiam ferramentas gringas boas — Supademo, Guideflow, Storylane
          — mas o checkout era em USD, a NF-e não existia, e o player não
          falava pt-BR direito.
        </p>
        <p>
          A primeira versão era um script Python que tirava screenshots
          enquanto ele clicava no app. Depois virou extensão Chrome. Depois
          virou SaaS.
        </p>
        <p>
          Em paralelo, a Bruna, do time de produto, entrevistou 30 PMMs
          brasileiros. O padrão era claro: ninguém estava feliz com a fricção
          do &quot;call de 30 minutos pra ver o produto&quot;, mas também não
          havia ferramenta local que entregasse demo com qualidade. A maioria
          usava Loom + PDF + WhatsApp — o oposto de &quot;escalar
          vendas&quot;.
        </p>
        <p>
          A DemoBR existe porque vender SaaS B2B no Brasil em 2026 ainda é
          analógico. A gente quer tirar pelo menos a etapa da demo
          automatizável, em R$, em PT-BR e respeitando LGPD.
        </p>

        <h2>Nossos princípios</h2>
        <h3>1. Tempo do AE é dinheiro</h3>
        <p>
          Cada call de descoberta que vira demo não-assistida é 30 minutos do
          AE recuperado pra outra coisa. A gente quer que lead qualificado{" "}
          <strong>assiste sozinho</strong>.
        </p>
        <h3>2. Cliente brasileiro não é secundário</h3>
        <p>
          PIX, boleto, NF-e, CNPJ, LGPD — não são features &quot;nice-to-have&quot;.
          São o chão. Quem mora no Brasil e cobra em USD tá cobrando taxa
          implícita no IOF.
        </p>
        <h3>3. Compliance não é PDF de rodapé</h3>
        <p>
          PII redaction, opt-out de analytics, DSR em 15 dias, IP não é hash
          próprio, logs com retenção de 30 dias. Tudo documentado em{" "}
          <Link href="/lgpd">/lgpd</Link>.
        </p>
        <h3>4. Demo boa é demo que o lead assiste</h3>
        <p>
          Lead que viu o demo inteiro, viu 80%+ das steps e deixou contato é
          lead que chega na call quente. Lead que abandonou no step 2 não vale
          o tempo do AE.
        </p>

        <h2>Time</h2>
        <p>
          <em>
            Placeholders — fotos e bios serão substituídos com o time
            definitivo quando a empresa sair do stealth.
          </em>
        </p>
        <ul>
          <li>
            <strong>Alex</strong> — Founder / Engineering. Antes da DemoBR,
            fazia demos em Loom e perdia 1 hora por semana re-gravando.
          </li>
          <li>
            <strong>Bruna</strong> — Product / Design. Chegou no projeto
            depois de rodar 30 PMMs que reclamavam de ferramentas gringas.
          </li>
          <li>
            <strong>Camila</strong> — Compliance / DPO. Advogada (OAB) e
            operadora de LGPD. Cuida de DSR, política de privacidade e
            auditoria.
          </li>
          <li>
            <strong>Diego</strong> — Growth / Conteúdo. Escreve o blog, fala
            com PMMs no LinkedIn e roda a comunidade no Discord.
          </li>
        </ul>

        <h2>Marco timeline</h2>
        <ul>
          <li>
            <strong>2025-04</strong> — Primeira captura. Extensão Chrome MV3
            grava screenshots + cliques, sem servidor.
          </li>
          <li>
            <strong>2025-08</strong> — Player PT-BR. Banner LGPD, narração
            TTS, lead form — tudo em pt-BR.
          </li>
          <li>
            <strong>2025-11</strong> — Asaas + PIX. Cobrança nativa em R$
            via PIX, boleto e cartão. NF-e emitida.
          </li>
          <li>
            <strong>2026-01</strong> — Beta público. Abertura para os
            primeiros 200 times.
          </li>
          <li>
            <strong>2026-04</strong> — API REST + embed. Embed iframe + API
            REST com token de workspace.
          </li>
          <li>
            <strong>2026-10</strong> — White-label. Player com CNAME,
            branding customizado e branching condicional no Business.
          </li>
        </ul>

        <h2>Por que &quot;DemoBR&quot;</h2>
        <p>
          O nome é deliberadamente óbvio. Quem pesquisa &quot;demo
          interativa&quot; no Google Brasil deveria encontrar a gente sem
          precisar lembrar de marca gringa. O &quot;BR&quot; também
          comunica: brasileiro, em R$, com PIX, com LGPD.
        </p>

        <h2>Contato</h2>
        <ul>
          <li>
            <strong>Geral:</strong>{" "}
            <Link href="mailto:oi@dominio.com.br">oi@dominio.com.br</Link>
          </li>
          <li>
            <strong>Suporte:</strong>{" "}
            <Link href="mailto:suporte@dominio.com.br">
              suporte@dominio.com.br
            </Link>
          </li>
          <li>
            <strong>DPO (LGPD):</strong>{" "}
            <Link href="mailto:dpo@dominio.com.br">dpo@dominio.com.br</Link>
          </li>
          <li>
            <strong>Vendas:</strong>{" "}
            <Link href="mailto:vendas@dominio.com.br">
              vendas@dominio.com.br
            </Link>
          </li>
          <li>
            <strong>Comunidade:</strong>{" "}
            <Link href="https://discord.gg/seu-link">Discord</Link>
          </li>
          <li>
            <strong>Status:</strong>{" "}
            <Link href="https://status.dominio.com.br">
              status.dominio.com.br
            </Link>
          </li>
        </ul>

        <h2>Onde a gente publica</h2>
        <ul>
          <li>
            Blog técnico: <Link href="/blog">/blog</Link>
          </li>
          <li>
            Updates de produto:{" "}
            <Link href="https://linkedin.com/company/demobr">LinkedIn</Link>
          </li>
          <li>
            Drops de comunidade: Discord (acesso após sign-up)
          </li>
          <li>
            Newsletter quinzenal: <Link href="/#newsletter">assinar</Link>
          </li>
        </ul>

        <h2>Imprensa</h2>
        <p>
          Press kit, screenshots em alta resolução e logo SVG estão em
          <Link href="/press-kit"> /press-kit</Link>. Para pedidos de
          entrevista ou remarketing escreva para{" "}
          <Link href="mailto:imprensa@dominio.com.br">
            imprensa@dominio.com.br
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
