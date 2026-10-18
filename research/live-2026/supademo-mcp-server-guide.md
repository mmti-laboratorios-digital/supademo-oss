# Supademo MCP Server — Guia Técnico (compile do live 2026)

**Coletado em:** 18 out 2026
**Source URL canônica:** https://docs.supademo.com/customize/mcp-server.md

> Este arquivo é um guia de referência técnica do MCP server do Supademo — relevante porque DemoBR/qualquer player B2B PLG que quiser manter feature parity no Tier 1 em 2026-2027 precisa entender **qual é o contrato de tools** que Supademo expôs a Claude / ChatGPT / Gemini / Cursor / Copilot.

---

## O que é Supademo MCP server

Servidor MCP (Model Context Protocol) com transporte **HTTP Streamable** em `https://mcp.supademo.com/mcp`. **80+ actions** expostas. **Acessível desde plan Scale** ($38/mo anual).

**Goals:** dar a LLMs (Claude/ChatGPT/Gemini) um contrato padronizado para edição, personalização e análise de demos via linguagem natural. Toda escrita (write) requer aprovação do usuário.

**Comparativo (claim do próprio Supademo):** Storylane expõe 20 tools documentados; Supademo expõe 80+. É o argumento de "AI surface area" mais vendido em `compare/storylane-alternative` e `compare/guideflow-alternative`.

## Setup — passos (Claude Web/Desktop)

1. Abra Claude.ai → Settings → Connectors
2. Search "Supademo" → Connect
3. Auth via OAuth Supademo (popup automático)
4. Use em chat por texto ou voz

## Setup — Claude Code (CLI)

```sh
claude mcp add --transport http supademo https://mcp.supademo.com/mcp
# opcional: --scope user (across all Claude Code projects)
```

```sh
/mcp  # abre painel MCP no Claude Code → "Authenticate" no browser
```

## Setup — ChatGPT

Settings → Plugins → Browse plugins → search "Supademo" → "+" → Authorize.

## Setup — Cursor

Cmd+Shift+J → Tools & Integrations → + Add Custom MCP → edite `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "Supademo MCP": {
      "url": "https://mcp.supademo.com/mcp"
    }
  }
}
```

## Setup — Copilot (Microsoft)

Tools page → Add a tool → Model Context Protocol → OAuth 2.0 + URL `https://mcp.supademo.com/mcp`.

---

## Tools expostos (sumário)

### Workspaces & Demos (6 tools)
- `list_workspaces` — retornar id, name, role, plan
- `list_demos` — search by title, filter by folder, paginate, scope me/workspace
- `get_demo` — fetch full demo tree (steps, hotspots, chapters, buttons, formFields, links)
- `duplicate_demo` — clone with all content, auto-title `<original>(Copy)`
- `merge_demos` — combine 2-50 demos into one, array order = step order
- `move_demos` — between Personal/Shared/Folder (up to 100)

### Edit Demo Settings (campos que podem ser alterados)
- Title & state: `title`, `archived`
- Appearance: `color`, `font`, `darkmode`, `border`, `fullWidth`, `topBar`, `brandLogo`, `watermarkText`, `watermarkLink`, `showWatermark`, `mobileHotspotView`
- Background: `background: { type, value }` — Color, CustomColor, Gradient, Pattern, Url
- CTA: `text`, `color`, `textColor`, `link`
- Behavior/Autoplay: `autoplay`, `autoplayDuration`, `autoPlayDelay`, `loop`, `showPlayPause`, `progressBar`, `showPlayBar`, `nextButton`, `showSteps`, `customizePerStep`
- Sharing: `shared`, `allowDuplicate`, `allowExternalComments`, `indexable`, `displayAuthor`, `displayDescription`, `domainURL`, `showSupademoLink`, `sendNotification`
- Hotspot defaults: `textVisible`, `animationVisible`, `opacity`
- Metadata/SEO: `metaDescription`, `customMetadataImage`, `detectBrowserLanguage`, `showCCButton`
- Audio: `recordOwnVoice`, `backgroundMusicUrl`, `backgroundMusicVolume`

### Steps (4 tools)
- `create_steps` — add regular (image+text) or chapter steps (Password/Link/Form)
- `update_steps` — change text, image, `mediaFitMode` (Cover/Contain), `mediaAlignMode` (Center/Top/Bottom/Left/Right), `backdrop` (None/Light/Dark), `playbackRate`, `duration`, `transition`, **zoom** (zoomPositionX/Y, zoomWidth; height auto)
- `delete_steps` — remove 1-100 at once, auto-renumber
- `copy_steps` — duplicate within or cross-demo

### Hotspots (3 tools)
- `create_hotspots` — `style` (Circle/Tooltip/Area/Anchor/Pointer/Modal), `animation` (Ripple/Spinner/Pulse/Ping), `position` (x/y %), `size`, `colors`, `hotspotWidth` (Small/Medium/Large), `borderRadius`, `textAlign`, `text`
- `update_hotspots` — all above + `isVisible`, `textVisible`, `tooltipPosition`, `htmlValue`, **`nextButton`** & **`backButton`** (`enabled`, `text`, `action` Slide/ExternalUrl, `url`, `bgColor`, `textColor`)
- `delete_hotspots` — batch by `{stepId, hotspotId}` pairs

### Chapters (2 tools)
- `update_chapters` — `type`, `heading`, `description`, `theme`, `layout`, `enabled`, `skip`, `password`, `emailValidationMode`, `emailDomainList`, `coverImageType/Source`, `logoEnabled/Source`
- Buttons inline CRUD: `content`, `btnColor`, `color`, `linkTxt`, `isLinkExternal`, `openInNewTab`, `animation`, `order`
- Form fields inline CRUD: `fieldType` (SingleLineText/Dropdown/Textarea), `label`, `placeholder`, `required`, `options`, `businessFieldType`
- `delete_chapters` — remove chapter, buttons, form fields

### Folders (4 tools)
- `list_folders`, `create_folder`, `rename_folder`, `delete_folder` (archives not permanently delete)

### Tags (3 tools)
- `list_tags` — list workspace tags, return id, name, color, demo/showcase counts
- `manage_tags` — batch create/update/delete
- `set_demo_tags` — attach/detach tags (modes: replace, add, remove)

### Voiceovers & Audio (4 tools)
- `list_voices` — 70+ built-in ElevenLabs voices + cloned voices (Growth/Enterprise only)
- `generate_voiceovers` — per-step text, voice ID, `speed` (0.7-1.2), `stability` (0.3-1.0); up to 75 steps/call
- `delete_voiceover` — remove voiceover
- `list_background_music` — preset library + custom workspace tracks

### Trackable Links (1 tool)
- `manage_links` — batch create/update/delete trackable demo links with variables (name, email, company, role, etc.) + `expiresAt`

### Media Library & Uploads (6 tools)
- `create_upload_job` — start browser-based upload, returns `uploadUrl` for user to upload
- `get_upload_job` — fetch status (pending/in_progress/ready) + uploaded identifiers
- `create_demo_from_uploaded_media` — image/video → step, in order (up to 200 items)
- `replace_step_media` — replace image/video, preserves hotspots and step audio
- `list_media_library_items` — list reusable workspace media
- `create_step_from_media_library_item` — add demo step from library item

### Demo Hubs (10 tools)
- `list_demo_hubs`, `get_demo_hub`, `create_demo_hub` (workspace or white-label branding)
- `create_demo_hub_from_showcase` — convert showcase to hub
- `duplicate_demo_hub`
- `update_demo_hub_settings` — appearance, header, launcher, footer, allowed embed domains
- `manage_demo_hub_categories` — max 5 categories per hub
- `manage_demo_hub_content` — add/update/remove/reorder
- `delete_demo_hub`
- `get_demo_hub_embed_code` — get SDK script tag, launcher init snippet

### Showcases (11 tools)
- `list_showcases` (scope me/workspace, search, pagination)
- `get_showcase` (sections, content, tags, personalized links)
- `create_showcase` (one starter section, workspace CTA)
- `duplicate_showcase`
- `import_showcase`
- `move_showcases` (1-100 at once)
- `delete_showcase` (no archive)
- `update_showcase_settings` (`displayFormat`: section/checklist/gallery)
- `manage_showcase_sections` (batch operations in one call)
- `manage_showcase_content` (content types: demo, video, link, pdf, document, text, embed)
- `manage_showcase_links` (same Scale+ gate as demo trackable links)
- `set_showcase_tags` (replace/add/remove)
- `get_showcase_share_info` (iframe, popup, inline embed, OG image URLs)

### Translations (4 tools)
- `generate_demo_translation` — translates title/meta description, chapter text & buttons, hotspot text/buttons, step audio text; pass `voiceId` for translated voiceover (1-3 min)
- `list_demo_translations`
- `set_demo_translation_text` — 10 entity types (DemoTitle, HotspotText, StepAudioText, …); empty text deletes entry
- `delete_demo_translation`

### Versioning & Publishing (5 tools)
- `publish_demo` — auto-increment version, makes it live, doesn't change visibility
- `list_demo_versions`
- `get_demo_version`
- `rename_demo_version`
- `revert_demo_to_version` — rewrite editable draft
- `duplicate_demo_from_version` — new demo from version

### Workspace & Embeds (2 tools)
- `get_workspace_settings` (read workspace Global Settings)
- `get_demo_embed_code` (iframe embed code with `embed_v=2`, workspace custom domain aware)

### Analytics (5 tools)
- `get_top_performing_demos` — rank by views, engagement, completion
- `get_demo_analytics` — total views, unique views, engagement, completion, per-step performance
- `get_demo_sessions` — individual viewer sessions with details (email, location, views, completion)
- `get_device_analytics` — device, browser, country breakdown
- `get_demo_hotspot_performance` — hotspot click performance and drop-offs

### Showcase Analytics (6 tools)
- `get_top_performing_showcases`
- `get_showcase_analytics`
- `get_showcase_demo_performance`
- `get_showcase_sessions`
- `get_showcase_session_details`
- `list_showcase_analytics_sources`

---

## Use cases oficiais

1. **Bulk Hotspot and Styling Updates** — change hotspot colors/button labels across entire demo in one prompt
2. **Generating Voiceovers at Scale** — generate AI voiceovers for all steps in a single prompt
3. **Creating Personalized Trackable Links** — generate dozens of links with personalized variables
4. **Querying Demo Analytics** — ask your AI assistant for performance insights

---

## Exemplo de LLM prompt oficial

> Update this Supademo (cmewzomb200ci0m0jgnfi4xgm) by ensuring each step has a zoom applied to it, in variations of 70-100%, centered around the hotspot. Next, update the all of the hotspots to be black (#000) and change the hotspots to have a dark backdrop, and set the labels to be "Previous" and "Next" with a yellow (#FFC000) background color.

Outro exemplo:

> For the demo cmnq9hezs0059kwxa0b09myai, update all of the hotspots to have black (#000) background, and make all the hotspot label backgrounds `#FFEA00`. Next, generate short voiceovers for each of the steps using 'Richard Yu' as the voice, but using shorter, direct variations of the existing hotspot for the voice.

---

## Implicações para DemoBR

**Tema 1 — Parity técnico:**

Para ser competitivo com Supademo/Storylane/Arcade em 2026-2027, DemoBR precisa:
- Expor **no mínimo 30-50 MCP tools** para Claude/ChatGPT/Cursor.
- Cobrir: demos (CRUD + steps + hotspots + chapters), analytics, trackable links, voiceover/translation.
- Plano Free também deveria ter MCP mínimo (tier defensivo contra Supademo Scale $38).

**Tema 2 — Multi-tenant & scope:**

Supademo MCP tem OAuth scoped a workspace + role. DemoBR deveria ter:
- `list_workspaces` (workspace switching)
- `list_demos` com scope `me` vs `workspace`
- `set_demo_tags` etc.
- Permissões granulares por role.

**Tema 3 — Video + AI agent parity:**

Supademo AI Demo Agent é o "killer" wedge. DemoBR precisa de um **AI Agent conversacional em pt-BR** que use MCP internamente — esse é o **gap de mercado claro**: ninguém oferece AI sales agent conversacional em pt-BR para demos interativas.

**Tema 4 — Design patterns úteis:**

- **Bulk operations** (1-100 items per call) — economy de tokens.
- **`update_steps` com null to remove** — pattern útil para "remove zoom from all".
- **Embedded docs:** Supademo embed demo via `@supademo/embed` para incluir tutoriais interativos dentro do doc do MCP — DemoBR poderia replicar.

## Fonts

- https://docs.supademo.com/customize/mcp-server.md (autoritativa)
- https://docs.supademo.com/sitemap.md (sitemap completo, outras docs MCP-related: `mcp-server/skills-for-supademo-mcp`)
- https://supademo.com/compare/storylane-alternative (storylane claimed 20 tools vs Supademo 80+)
- https://supademo.com/compare/guideflow-alternative (Guideflow also has MCP, from Solo tier)
