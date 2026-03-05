import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body: string;
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

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { navigate("/blog", { replace: true }); return; }
    fetch(`/api/blog/${slug}`)
      .then((r) => {
        if (r.status === 404) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) { navigate("/blog", { replace: true }); return; }
        setPost(data);
        setLoading(false);
      })
      .catch(() => navigate("/blog", { replace: true }));
  }, [slug, navigate]);

  if (loading) {
    return (
      <SiteShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading article…</p>
        </div>
      </SiteShell>
    );
  }

  if (!post) return null;

  return (
    <SiteShell>
      <article>
        <header className="relative overflow-hidden pt-32 pb-12">
          <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
          <div className="container relative z-10 mx-auto px-6">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
              {post.category && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono uppercase tracking-[0.14em] text-primary">
                  {post.category}
                </span>
              )}
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDate(post.publishedAt)}
                </span>
              )}
              {post.readingTime && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {post.readingTime} min read
                </span>
              )}
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
            {post.excerpt && (
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
            )}
          </div>
        </header>

        {post.imageUrl && (
          <section className="pb-8">
            <div className="container mx-auto px-6">
              <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
                <img src={post.imageUrl} alt={`${post.title} image`} className="h-72 w-full object-cover md:h-[28rem]" />
              </div>
            </div>
          </section>
        )}

        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-2xl border border-border/70 bg-card p-7">
                <div className="prose prose-sm md:prose-base max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{post.body}</ReactMarkdown>
                </div>
              </div>

              <aside className="h-fit rounded-2xl border border-border/70 bg-card p-6 lg:sticky lg:top-28">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold">Want to see this in product form?</p>
                  <Link to="/demo" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                    Open live demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </article>
    </SiteShell>
  );
};

export default BlogArticle;
