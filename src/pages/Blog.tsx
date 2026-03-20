import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { ArrowRight, CalendarDays, Clock3, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  readingTime?: number | null;
  publishedAt?: string | null;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const [featured, ...restPosts] = posts;

  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-14">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            Prism Journal
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Blog and articles for teams building conversational ad systems.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Practical notes for publishers and advertisers on ad relevance, monetization operations, and native creative strategy.
          </p>
        </div>
      </section>

      {loading && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <p className="text-sm text-muted-foreground">Loading articles…</p>
          </div>
        </section>
      )}

      {!loading && featured && (
        <section className="pb-12">
          <div className="container mx-auto px-6">
            <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_24px_60px_-45px_rgba(0,0,0,0.5)]">
              {featured.imageUrl && (
                <img
                  src={featured.imageUrl}
                  alt={`${featured.title} image`}
                  className="h-64 w-full object-cover md:h-80"
                  loading="eager"
                />
              )}
              <div className="p-7 md:p-9">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {featured.category && (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono uppercase tracking-[0.14em] text-primary">
                      {featured.category}
                    </span>
                  )}
                  {featured.publishedAt && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(featured.publishedAt)}
                    </span>
                  )}
                  {featured.readingTime && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      {featured.readingTime} min read
                    </span>
                  )}
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{featured.title}</h2>
                {featured.excerpt && (
                  <p className="mt-3 max-w-3xl text-muted-foreground">{featured.excerpt}</p>
                )}

                <Link
                  to={`/blog/${featured.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </div>
        </section>
      )}

      {!loading && restPosts.length > 0 && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold tracking-tight">Latest articles</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {restPosts.map((post) => (
                <article key={post.slug} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={`${post.title} image`}
                      className="h-52 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {post.category && (
                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono uppercase tracking-[0.12em] text-primary">
                          {post.category}
                        </span>
                      )}
                      {post.readingTime && (
                        <span className="text-muted-foreground">{post.readingTime} min read</span>
                      )}
                    </div>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight">{post.title}</h3>
                    {post.excerpt && (
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>
                    )}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {!loading && posts.length === 0 && (
        <section className="pb-20">
          <div className="container mx-auto px-6">
            <p className="text-sm text-muted-foreground">No articles published yet.</p>
          </div>
        </section>
      )}
    </SiteShell>
  );
};

export default Blog;
