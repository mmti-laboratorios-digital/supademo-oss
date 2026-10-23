/**
 * Lightweight MDX/Markdown content loader.
 *
 * The repo does not yet enable @next/mdx, so .mdx files in this folder are
 * not bundled by Next.js. This module loads the raw text at build/render time
 * via fs and exposes simple helpers to extract structured blocks (meta, hero,
 * features, FAQ) from the markdown body.
 *
 * If/when @next/mdx is installed, the .mdx files become real components; the
 * shape of this loader stays compatible because each .mdx block uses the same
 * named exports (meta, features, faq, plans).
 *
 * Treat the .mdx files as the canonical source of marketing copy. The TSX
 * pages under app/(marketing)/<route>/page.tsx render with the same structure
 * derived here, so copy edits propagate to both.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type CtaLink = { label: string; href: string };

export type HomeMeta = {
  title: string;
  subtitle: string;
  badge: string;
  primaryCta: CtaLink;
  secondaryCta: CtaLink;
};

export type Feature = {
  title: string;
  body: string;
  icon?: "capture" | "play" | "share" | string;
};

export type DemoShowcaseItem = {
  title: string;
  description: string;
  image: string;
  href: string;
};

export type PricingPlanTeaser = {
  name: string;
  priceLabel: string;
  cadence: string;
  ctaHref: string;
  highlighted?: boolean;
};

export type SocialProofItem = {
  name: string;
  industry: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogFrontmatter = {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  category: "Guias" | "News" | "Engineering" | "Guides" | "Engineering-en";
  author: string;
  readingTimeMin: number;
};

export type ParsedHome = {
  meta: HomeMeta;
  socialProof: SocialProofItem[];
  features: Feature[];
  showcase: DemoShowcaseItem[];
  pricing: PricingPlanTeaser[];
  finalCta: { title: string; subtitle: string; primaryCta: CtaLink; secondaryCta: CtaLink };
};

export type ParsedPricing = {
  plans: Array<{
    id: "free" | "pro" | "business";
    name: string;
    priceLabel: string;
    cadence: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    highlighted?: boolean;
    blurb: string;
  }>;
  faq: FaqItem[];
  guaranteeDays: number;
};

export type ParsedBlogPost = {
  frontmatter: BlogFrontmatter;
  blocks: Array<
    | { type: "h2"; text: string; id: string }
    | { type: "p"; text: string }
    | { type: "faq"; items: FaqItem[] }
  >;
};

const CONTENT_DIR = path.join(process.cwd(), "app", "(marketing)", "content");

async function readText(file: string): Promise<string> {
  const filePath = path.join(CONTENT_DIR, file);
  return fs.readFile(filePath, "utf8");
}

function extractFrontmatter(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return out;
  const body = m[1];
  if (!body) return out;
  for (const line of body.split("\n")) {
    const ix = line.indexOf(":");
    if (ix < 0) continue;
    const key = line.slice(0, ix).trim();
    // trim ANTES do regex: o pattern ^["']|["']$ exige o quote no início/
    // fim da string, mas a fatia vem com espaço depois de ":" — sem o trim
    // prévio, só o quote final é removido e o inicial sobra, gerando
    // valores como `"2026-10-12T09:00:00Z` (com aspa sobrando) que quebram
    // `new Date(...)` no sitemap.
    const value = line
      .slice(ix + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Parse a blog .mdx into structured blocks (h2 / p / faq).
 * The .mdx format we authored uses:
 *   - H2 lines starting with "## "
 *   - Paragraph blocks separated by blank lines
 *   - Inline JSON-like list of FAQ at the end, demarcated by `<!-- faq -->`
 *
 * The format is purpose-built: it stays plain enough to render via TSX and is
 * easy for humans to edit, even without an MDX runtime.
 */
export async function loadBlogPost(file: string): Promise<ParsedBlogPost> {
  const raw = await readText(path.join("blog", file));
  const fm = extractFrontmatter(raw);
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");

  const blocks: ParsedBlogPost["blocks"] = [];
  const lines = body.split("\n");

  let currentH2: { type: "h2"; text: string; id: string } | null = null;
  let paragraphBuffer: string[] = [];
  const flushParagraph = () => {
    if (!paragraphBuffer.length || !currentH2) return;
    const text = paragraphBuffer.join(" ").trim();
    if (text) blocks.push({ type: "p", text });
    paragraphBuffer = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushParagraph();
      const text = line.slice(3).trim();
      currentH2 = { type: "h2", text, id: slugify(text) };
      blocks.push(currentH2);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    if (!currentH2) continue;
    if (line.startsWith("<!-- faq -->") || line.startsWith("<!--FAQ-->")) continue;
    paragraphBuffer.push(line);
  }
  flushParagraph();

  // FAQ block is appended at the very end after a sentinel.
  const faqSection = body.split(/<!--\s*faq\s*-->/i)[1] ?? "";
  const faq = parseFaq(faqSection);

  return {
    frontmatter: {
      title: fm.title ?? "",
      description: fm.description ?? "",
      slug: fm.slug ?? file.replace(/\.mdx?$/, ""),
      publishedAt: fm.publishedAt ?? new Date().toISOString(),
      category:
        (fm.category as BlogFrontmatter["category"]) ?? ("Guias" as BlogFrontmatter["category"]),
      author: fm.author ?? "DemoBR",
      readingTimeMin: Number.parseInt(fm.readingTimeMin ?? "5", 10),
    },
    blocks: faq.length ? [...blocks, { type: "faq", items: faq }] : blocks,
  };
}

function parseFaq(section: string): FaqItem[] {
  const items: FaqItem[] = [];
  const blocks = section.split(/\nQ:\s*/).filter(Boolean);
  for (const b of blocks) {
    const [qLine, ...rest] = b.split("\n");
    const question = qLine?.trim() ?? "";
    const answerRaw = rest.join("\n").trim();
    const answer = answerRaw.replace(/^A:\s*/, "").trim();
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

/**
 * Home meta + structured content. The .mdx stores narrative copy plus JSON-
 * like arrays inside `<Component` braces; we parse the most useful ones.
 */
export async function loadHomeContent(file = "home.mdx"): Promise<ParsedHome> {
  const raw = await readText(file);

  // Pull meta export
  const metaMatch = raw.match(/export const meta = \{([\s\S]*?)\};/);
  // O badge fica no <Hero badge="..." />, não no export const meta.
  const heroMatch = raw.match(/<Hero[\s\S]*?\/>/);
  const meta: HomeMeta = {
    title: extractString(metaMatch?.[1], "title") ?? "DemoBR",
    subtitle:
      extractString(metaMatch?.[1], "subtitle") ??
      "Demos interativas pra vender mais, sem uma reunião a mais.",
    badge:
      (heroMatch ? extractJsxAttr(heroMatch[0], "badge") : undefined) ??
      extractString(metaMatch?.[1], "badge") ??
      "Beta público",
    primaryCta: {
      label: extractString(metaMatch?.[1], "ctaPrimary") ?? "Começar grátis",
      href: extractString(metaMatch?.[1], "ctaPrimaryHref") ?? "/sign-up",
    },
    secondaryCta: {
      label: extractString(metaMatch?.[1], "ctaSecondary") ?? "Ver planos",
      href: extractString(metaMatch?.[1], "ctaSecondaryHref") ?? "/pricing",
    },
  };

  // Demo showcase: pull <DemoShowcase items=[...] /> ... literally, parse JSON.
  const showcaseMatch = raw.match(/<DemoShowcase[\s\S]*?\/>/);
  const showcase = showcaseMatch ? parseShowcase(showcaseMatch[0]) : [];

  // Pricing teaser
  const pricingMatch = raw.match(/<PricingTeaser[\s\S]*?\/>/);
  const pricing = pricingMatch ? parsePricingTeaser(pricingMatch[0]) : [];

  // Social proof
  const spMatch = raw.match(/<SocialProof[\s\S]*?\/>/);
  const socialProof = spMatch ? parseSocialProof(spMatch[0]) : [];

  // Features: derive from the "1./2./3." markdown sections
  const features = parseFeaturesFromMarkdown(raw);

  // Final CTA
  const finalMatch = raw.match(/<FinalCta[\s\S]*?\/>/);
  const finalCta = finalMatch
    ? parseFinalCta(finalMatch[0])
    : {
        title: "Comece grátis agora.",
        subtitle: "3 demos publicados, sem cartão.",
        primaryCta: { label: "Criar minha demo", href: "/sign-up" },
        secondaryCta: { label: "Ver demo de exemplo", href: "/d/exemplo-tour" },
      };

  return { meta, socialProof, features, showcase, pricing, finalCta };
}

function extractString(haystack: string | undefined, key: string): string | undefined {
  if (!haystack) return undefined;
  const re = new RegExp(`${key}\\s*:\\s*"([^"]+)"`);
  const m = haystack.match(re);
  return m?.[1];
}

/**
 * Extrai um atributo JSX de string literal (`name="valor"`) de uma tag MDX.
 *
 * `extractProp` serve para objetos JS (`{ name: "x" }`); aqui o formato é o
 * de atributo JSX (`<FinalCta title="x" />`), que usa `=` em vez de `:`.
 * O lookahead exige aspas para não confundir com props que apontam para
 * expressões (ex: `title={meta.title}`), que não são string literals.
 */
function extractJsxAttr(tag: string, attr: string): string | undefined {
  const re = new RegExp(`\\b${attr}\\s*=\\s*"([^"]*)"`);
  const m = tag.match(re);
  return m?.[1];
}

/**
 * Extrai uma CTA aninhada em JSX: `primaryCta={{ label: "X", href: "/y" }}`.
 * Aceita também o formato plano `primaryCtaLabel="X"` como fallback.
 *
 * O conteúdo dentro de `{{ ... }}` é um objeto JS (`label: "X"`), então usa
 * `extractProp`. O fallback usa `extractJsxAttr` porque aí o formato é JSX
 * plano (`primaryCtaLabel="X"`).
 */
function extractJsxCta(tag: string, attr: string): CtaLink {
  const nested = tag.match(new RegExp(`\\b${attr}\\s*=\\s*\\{\\{([\\s\\S]*?)\\}\\s*\\}`));
  if (nested?.[1]) {
    const inner = nested[1];
    return {
      label: extractProp(inner, "label") ?? "",
      href: extractProp(inner, "href") ?? "#",
    };
  }
  return {
    label: extractJsxAttr(tag, `${attr}Label`) ?? "",
    href: extractJsxAttr(tag, `${attr}Href`) ?? "#",
  };
}

function parseShowcase(jsx: string): DemoShowcaseItem[] {
  const objMatch = jsx.match(/items=\{\s*\[([\s\S]*?)\]\s*\}/);
  if (!objMatch) return [];
  const inner = objMatch[1];
  if (!inner) return [];
  const items = splitTopLevelObjects(inner);
  return items.map((it) => ({
    title: extractProp(it, "title") ?? "",
    description: extractProp(it, "description") ?? "",
    image: extractProp(it, "image") ?? "/og-default.svg",
    href: extractProp(it, "href") ?? "#",
  }));
}

function parsePricingTeaser(jsx: string): PricingPlanTeaser[] {
  const objMatch = jsx.match(/plans=\{\s*\[([\s\S]*?)\]\s*\}/);
  if (!objMatch) return [];
  const inner = objMatch[1];
  if (!inner) return [];
  return splitTopLevelObjects(inner).map((it) => ({
    name: extractProp(it, "name") ?? "",
    priceLabel: extractProp(it, "priceLabel") ?? "",
    cadence: extractProp(it, "cadence") ?? "",
    ctaHref: extractProp(it, "ctaHref") ?? "/sign-up",
    highlighted: extractProp(it, "highlighted") === "true",
  }));
}

function parseSocialProof(jsx: string): SocialProofItem[] {
  const objMatch = jsx.match(/items=\{\s*\[([\s\S]*?)\]\s*\}/);
  if (!objMatch) return [];
  const inner = objMatch[1];
  if (!inner) return [];
  return splitTopLevelObjects(inner).map((it) => ({
    name: extractProp(it, "name") ?? "",
    industry: extractProp(it, "industry") ?? "",
  }));
}

function parseFinalCta(jsx: string): ParsedHome["finalCta"] {
  const objMatch = jsx.match(/<FinalCta[\s\S]*?\/>/);
  if (!objMatch) throw new Error("unreachable");
  const block = objMatch[0];
  return {
    title: extractJsxAttr(block, "title") ?? "",
    subtitle: extractJsxAttr(block, "subtitle") ?? "",
    primaryCta: extractJsxCta(block, "primaryCta"),
    secondaryCta: extractJsxCta(block, "secondaryCta"),
  };
}

function parseFeaturesFromMarkdown(raw: string): Feature[] {
  const out: Feature[] = [];
  const secRegex = /###\s*(\d+\.\s*[^\n]+)\n([\s\S]*?)(?=\n###|\n##\s|\n<Pricing|\n<FinalCta|$)/g;
  let m: RegExpExecArray | null;
  while ((m = secRegex.exec(raw))) {
    const titleRaw = m[1];
    const bodyTextRaw = m[2];
    if (!titleRaw) continue;
    const title = titleRaw.replace(/^\d+\.\s*/, "").trim();
    const bodyText = (bodyTextRaw ?? "").trim();
    // Skip non-feature blocks (presence of "captura" / "Player" / "Compartilhe"
    // narrows to the 3 feature sections we authored).
    if (!/captura|play|share|player|compartilh|Player|Capture|Compartilh/i.test(title + bodyText)) {
      continue;
    }
    const firstPara = bodyText.split("\n\n")[0] ?? bodyText;
    out.push({
      title,
      body: firstPara,
      icon: /capture|captura/i.test(title)
        ? "capture"
        : /play|player|tour/i.test(title)
          ? "play"
          : "share",
    });
  }
  return out.slice(0, 3);
}

function splitTopLevelObjects(input: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let buf = "";
  let inStr: string | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inStr) {
      buf += ch;
      if (ch === inStr && input[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      buf += ch;
      continue;
    }
    if (ch === "{") depth++;
    if (ch === "}") depth--;
    if (ch === "," && depth === 0) {
      out.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

function extractProp(obj: string, key: string): string | undefined {
  // O prefixo aceita `{ ` e `, ` — no MDX toda propriedade vem depois de
  // `{ ` (ex: `{ name: "X", industry: "Y" }`), então casar só com `^|,`
  // deixava a PRIMEIRA propriedade de cada objeto vazia.
  // O lookahead aceita também fim-de-string: quando o trecho analisado é um
  // slice truncado (ex: o corpo de `cta={{ label: "x", href: "/y" }}`, que
  // termina antes do `}}`), a última propriedade não tem `,` nem `}` depois.
  const re = new RegExp(
    `(?:^|[,{])\\s*${key}\\s*:\\s*("[^"]*"|'[^']*'|true|false|\\[[^\\]]*\\])(?=\\s*(?:[,}\\]]|$))`,
  );
  const m = obj.match(re);
  if (!m) return undefined;
  const raw = m[1];
  if (!raw) return undefined;
  let v = raw;
  if (v.startsWith('"') || v.startsWith("'")) v = v.slice(1, -1);
  return v;
}

export async function loadPricingDetail(file = "pricing-detail.mdx"): Promise<ParsedPricing> {
  const raw = await readText(file);
  const plansMatch = raw.match(/export const plans = \[([\s\S]*?)\];/);
  const plans = plansMatch && plansMatch[1] ? parsePricingDetailPlans(plansMatch[1]) : [];

  const faqMatch = raw.match(/<!--\s*faq\s*-->([\s\S]*)$/i);
  const faq = faqMatch && faqMatch[1] ? parseFaq(faqMatch[1]) : [];

  return { plans, faq, guaranteeDays: 14 };
}

function parsePricingDetailPlans(raw: string): ParsedPricing["plans"] {
  const blocks = splitTopLevelObjects(raw);
  return blocks.map((b) => ({
    id: (extractProp(b, "id") ?? "free") as "free" | "pro" | "business",
    name: extractProp(b, "name") ?? "",
    priceLabel: extractProp(b, "priceLabel") ?? "",
    cadence: extractProp(b, "cadence") ?? "/mês",
    features: extractPropArray(b, "features") ?? [],
    ctaLabel: extractProp(b, "ctaLabel") ?? "",
    ctaHref: extractProp(b, "ctaHref") ?? "/sign-up",
    highlighted: extractProp(b, "highlighted") === "true",
    blurb: extractProp(b, "blurb") ?? "",
  }));
}

function extractPropArray(obj: string, key: string): string[] | undefined {
  const re = new RegExp(`${key}\\s*:\\s*\\[([^\\]]+)\\]`);
  const m = obj.match(re);
  if (!m) return undefined;
  const inner = m[1];
  if (!inner) return [];
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export async function listBlogPosts(): Promise<BlogFrontmatter[]> {
  const dir = path.join(CONTENT_DIR, "blog");
  const files = await fs.readdir(dir);
  const posts: BlogFrontmatter[] = [];
  for (const f of files) {
    if (!f.endsWith(".mdx") && !f.endsWith(".md")) continue;
    if (f === "index.mdx" || f === "index.md") continue;
    const p = await loadBlogPost(f);
    posts.push(p.frontmatter);
  }
  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export const __test = { splitTopLevelObjects, parseFaq, parseFeaturesFromMarkdown };
