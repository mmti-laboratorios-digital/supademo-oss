import Link from "next/link";
import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadBlogPost, listBlogPosts } from "../../content/contentLoader";

/**
 * Render a single blog post. We use `generateStaticParams` to pre-build the
 * three SEO pillar pages at build time, so the sitemap and discovery routes
 * pick them up. New posts added to content/blog/*.mdx become available
 * automatically on the next build.
 */
export async function generateStaticParams() {
  const posts = await listBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = true;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve the actual filename (slug is the canonical name in frontmatter,
  // but the file lives at content/blog/<slug>.mdx or with a different name).
  const dir = path.join(process.cwd(), "app", "(marketing)", "content", "blog");
  const files = await fs.readdir(dir);
  const target = files.find((f) => f === `${slug}.mdx`);
  if (!target) notFound();
  const post = await loadBlogPost(target);
  const { frontmatter, blocks } = post;

  // Build FAQ JSON-LD if there's an FAQ block at the end
  const faqBlock = blocks.find((b) => b.type === "faq");
  const faqJsonLd = faqBlock && faqBlock.type === "faq"
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqBlock.items.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      }
    : null;

  return (
    <main className="container max-w-3xl py-16">
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <header className="mb-10 border-b border-border pb-6">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wider">
            {frontmatter.category}
          </span>
          <time dateTime={frontmatter.publishedAt}>
            {new Date(frontmatter.publishedAt).toLocaleDateString("pt-BR", {
              year: "numeric",
              month: "long",
              day: "2-digit",
            })}
          </time>
          <span>· {frontmatter.readingTimeMin} min de leitura</span>
          <span>· por {frontmatter.author}</span>
        </div>
        <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl">
          {frontmatter.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          {frontmatter.description}
        </p>
      </header>

      <article className="prose prose-neutral max-w-none dark:prose-invert">
        {blocks.map((b, ix) => {
          if (b.type === "h2") {
            return (
              <h2 key={`${b.id}-${ix}`} id={b.id}>
                {b.text}
              </h2>
            );
          }
          if (b.type === "p") {
            return <p key={ix}>{b.text}</p>;
          }
          if (b.type === "faq") {
            return (
              <section
                key={ix}
                aria-label="Perguntas frequentes"
                className="not-prose mt-10 rounded-lg border border-border bg-card p-6"
              >
                <h2>Perguntas frequentes</h2>
                <dl className="divide-y divide-border">
                  {b.items.map((q) => (
                    <div key={q.question} className="py-4">
                      <dt className="font-semibold">{q.question}</dt>
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {q.answer}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          }
          return null;
        })}
      </article>

      <footer className="mt-16 border-t border-border pt-6 text-sm text-muted-foreground">
        <Link href="/blog" className="underline">
          ← Voltar pro blog
        </Link>
      </footer>
    </main>
  );
}
