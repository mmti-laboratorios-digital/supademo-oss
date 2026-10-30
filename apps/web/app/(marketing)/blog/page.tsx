import Link from "next/link";
import { listBlogPosts } from "../content/contentLoader";

/**
 * Blog index. Lists posts by category with newest first.
 * Content source lives in content/blog/*.mdx.
 */
export default async function BlogIndexPage() {
  const posts = await listBlogPosts();
  const categories = ["Guias", "News", "Engineering"];

  return (
    <main className="container max-w-5xl py-24">
      <header className="mb-12">
        <h1 className="text-balance text-4xl font-bold md:text-5xl">Blog do EasyDemo</h1>
        <p className="mt-3 text-muted-foreground">
          Guias, news e engineering sobre demos interativas, LGPD e o bastidores da plataforma.
        </p>
      </header>

      <nav
        aria-label="Categorias"
        className="mb-10 flex flex-wrap gap-2 border-b border-border pb-4"
      >
        {categories.map((c) => (
          <span
            key={c}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {c}
          </span>
        ))}
      </nav>

      <section className="divide-y divide-border">
        {posts.map((p) => (
          <article key={p.slug} className="grid grid-cols-1 gap-3 py-6 md:grid-cols-[120px_1fr]">
            <div className="text-sm text-muted-foreground">
              <time dateTime={p.publishedAt}>
                {new Date(p.publishedAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}
              </time>
              <div className="mt-1 text-xs uppercase tracking-wider">{p.category}</div>
              <div className="mt-1 text-xs">{p.readingTimeMin} min</div>
            </div>
            <div>
              <h2 className="text-xl font-bold">
                <Link href={`/blog/${p.slug}`} className="hover:underline">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-2 text-xs text-muted-foreground">por {p.author}</div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
