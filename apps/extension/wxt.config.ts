import { defineConfig } from "wxt";

/**
 * Config WXT — manifest MV3 é gerado a partir deste objeto.
 *
 * WXT preenche automaticamente:
 *  - background.service_worker (a partir de ./entrypoints/background.ts)
 *  - content_scripts (a partir de ./entrypoints/content.ts)
 *  - action.default_popup (a partir de ./entrypoints/popup/index.html)
 *  - icons
 *
 * ⚠️ F9: permissões mantidas enxutas conforme RFC §1.2 e MVP-PLAN.md §1357:
 *  - `activeTab` + `scripting`: captura da aba ativa e injeção do overlay;
 *  - `storage`: persistência local da sessão de captura.
 * NÃO pedimos `<all_urls>` nem `tabCapture` — review mais lento na CWS.
 * O `host_permissions` fica restrito ao domínio do app EasyDemo e localhost.
 */
export default defineConfig({
  srcDir: ".",
  outDir: ".output",
  publicDir: "public",
  manifestVersion: 3,
  manifest: {
    name: "EasyDemo Capture",
    description: "Capture interativa de demos SaaS — screenshots, hotspot, link permanente.",
    permissions: ["activeTab", "storage", "scripting"],
    host_permissions: ["https://easydemo.io/*", "http://localhost:3000/*"],
    // ⚠️ O WXT **não** inclui os ícones automaticamente no manifest — sem este
    // bloco, a extensão é submetida sem ícone e a CWS mostra o ícone default
    // genérico. Os arquivos ficam em `public/icons/` (gerados por
    // `scripts/generate-icons.ts` a partir do favicon da marca).
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
    web_accessible_resources: [
      {
        resources: ["overlay.css"],
        matches: ["<all_urls>"],
      },
    ],
  },
});
