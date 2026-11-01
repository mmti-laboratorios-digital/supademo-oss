import Link from "next/link";

/**
 * Página de suporte.
 *
 * ⚠️ **Requisito da Chrome Web Store:** o dashboard exige uma "Support URL"
 * acessível. Ver `apps/extension/CWS-SUBMISSION.md` §5.
 *
 * Canais de contato:
 *  - E-mail de suporte.
 *  - Central de ajuda (seção de FAQ do produto).
 *  - Formulário de solicitação de dados (DSR) — link na política de privacidade.
 */
export const dynamic = "force-dynamic";

export default function SuportePage() {
  return (
    <main className="container max-w-3xl py-16">
      <header className="mb-10 border-b border-border pb-6">
        <h1 className="text-balance text-4xl font-bold md:text-5xl">Suporte</h1>
        <p className="mt-3 text-muted-foreground">
          Precisa de ajuda com a EasyDemo? Estes são os caminhos mais rápidos.
        </p>
      </header>

      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <h2>E-mail</h2>
        <p>
          Escreva para <strong>suporte@easydemo.io</strong>. Respondemos em até 1 dia útil. Se for
          sobre dados pessoais, veja a seção de DSR abaixo.
        </p>

        <h2>Perguntas frequentes</h2>
        <p>
          Os dúvidas mais comuns — como criar a primeira demo, publicar, configurar o branding e
          adicionar o embed no site — estão no <Link href="/blog">guia do blog</Link>.
        </p>

        <h2>Solicitações de dados (DSR)</h2>
        <p>
          Para <strong>acesso, correção, portabilidade ou exclusão</strong> dos seus dados pessoais,
          use o canal indicado na <Link href="/privacidade">Política de Privacidade</Link> (§10). A
          resposta tem prazo legal de 15 dias.
        </p>

        <h2>Status e incidentes</h2>
        <p>
          Problemas em andamento são comunicados por e-mail e pela{" "}
          <Link href="/blog">página de novidades</Link>. Para envio de dados incorretos, veja a{" "}
          <Link href="/termos">Política de Privacidade</Link>.
        </p>
      </article>
    </main>
  );
}
