import { notFound } from "next/navigation";
import { LegalDocumentView } from "../components/LegalDocumentView";
import { loadLegalDocument } from "../content/legalLoader";

/**
 * Rota pública da Política de Cookies.
 *
 * Fonte canônica: `legal/cookie-policy.md`.
 */
export const dynamic = "force-dynamic";

export default async function CookiesPage() {
  const doc = await loadLegalDocument("cookies");
  if (!doc) notFound();

  return <LegalDocumentView doc={doc} updatedAt="18 de outubro de 2026" />;
}
