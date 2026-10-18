import { defineConfig } from "wxt";

/**
 * Config WXT — manifest MV3 é gerado a partir deste objeto.
 *
 * WXT preenche automaticamente:
 *  - background.service_worker (a partir de ./entrypoints/background.ts)
 *  - content_scripts (a partir de ./entrypoints/content.ts)
 *  - action.default_popup (a partir de ./entrypoints/popup.html)
 *  - icons
 *
 * Apenas declaramos overrides manuais aqui.
 */
export default defineConfig({
  srcDir: ".",
  outDir: ".output",
  publicDir: "public",
  manifestVersion: 3,
  manifest: {
    name: "DemoBR Capture",
    description:
      "Capture interativa de demos SaaS — screenshots, hotspot, link permanente.",
    permissions: ["activeTab", "storage", "scripting"],
    host_permissions: ["<all_urls>"],
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