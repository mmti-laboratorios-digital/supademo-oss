import { notFound } from "next/navigation";
import { LegalDocumentView } from "../components/LegalDocumentView";
import { loadLegalDocument } from "../content/legalLoader";

/**
 * Rota pública dos Termos de Uso.
 *
 * Fonte canônica: `legal/terms-of-service.md`.
 */
export const dynamic = "force-dynamic";

export default async function TermosPage() {
  const doc = await loadLegalDocument("termos");
  if (!doc) notFound();

  return <LegalDocumentView doc={doc} updatedAt="18 de outubro de 2026" />;
}
