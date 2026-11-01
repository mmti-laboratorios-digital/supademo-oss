import { notFound } from "next/navigation";
import { LegalDocumentView } from "../components/LegalDocumentView";
import { loadLegalDocument } from "../content/legalLoader";

/**
 * Rota pública da Política de Privacidade.
 *
 * ⚠️ **Requisito da Chrome Web Store:** a extensão só é aprovada se a URL
 * da política de privacidade estiver acessível **sem login** e retornar 200.
 * Ver `apps/extension/CWS-SUBMISSION.md` §5.
 *
 * O conteúdo vem de `legal/privacy-policy.md` (fonte canônica, a mesma que o
 * `scripts/check-dpo-missing.ts` valida na F8).
 */
export const dynamic = "force-dynamic";

export default async function PrivacidadePage() {
  const doc = await loadLegalDocument("privacidade");
  if (!doc) notFound();

  return <LegalDocumentView doc={doc} updatedAt="18 de outubro de 2026" />;
}
