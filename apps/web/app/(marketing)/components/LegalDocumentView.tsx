import Link from "next/link";
import type { LegalBlock, LegalDocument } from "../content/legalLoader";

/**
 * Renderiza um documento legal (markdown parseado em blocos) como TSX.
 *
 * Usado pelas rotas públicas `/privacidade`, `/termos` e `/cookies` — a Chrome
 * Web Store exige que a política de privacidade seja acessível sem login
 * (HTTP 200). Ver `apps/extension/CWS-SUBMISSION.md` §5.
 */
export function LegalDocumentView({
  doc,
  updatedAt,
}: {
  doc: LegalDocument;
  updatedAt: string;
}) {
  return (
    <main className="container max-w-3xl py-16">
      <header className="mb-10 border-b border-border pb-6">
        <h1 className="text-balance text-4xl font-bold md:text-5xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última atualização: {updatedAt}</p>
      </header>

      <article className="prose prose-neutral max-w-none dark:prose-invert">
        {doc.blocks.map((block, ix) => (
          <LegalBlockView key={`${block.type}-${ix}`} block={block} />
        ))}
      </article>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        <div className="flex flex-wrap gap-4">
          <Link href="/privacidade" className="underline">
            Privacidade
          </Link>
          <Link href="/termos" className="underline">
            Termos
          </Link>
          <Link href="/cookies" className="underline">
            Cookies
          </Link>
          <Link href="/suporte" className="underline">
            Suporte
          </Link>
        </div>
      </footer>
    </main>
  );
}

function LegalBlockView({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "h2":
      return <h2 id={block.id}>{block.text}</h2>;
    case "h3":
      return <h3 id={block.id}>{block.text}</h3>;
    case "p":
      return <p>{block.text}</p>;
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={`${i}-${item.slice(0, 12)}`}>{item}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item, i) => (
            <li key={`${i}-${item.slice(0, 12)}`}>{item}</li>
          ))}
        </ol>
      );
    case "quote":
      return <blockquote>{block.text}</blockquote>;
    case "code":
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      );
    case "table":
      return (
        <div className="overflow-x-auto not-prose my-6">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th
                    key={`${i}-${h.slice(0, 12)}`}
                    className="border border-border bg-muted px-3 py-2 text-left font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={`${ri}-${row[0]?.slice(0, 12) ?? "row"}`}>
                  {row.map((cell, ci) => (
                    <td key={`${ri}-${ci}`} className="border border-border px-3 py-2 align-top">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}
