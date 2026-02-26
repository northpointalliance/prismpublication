import SiteShell from "@/components/SiteShell";
import { getBlogPostBySlug } from "@/content/blogPosts";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";

const BlogArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

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
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono uppercase tracking-[0.14em] text-primary">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {post.publishedOn}
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                {post.readingTime}
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">{post.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
          </div>
        </header>

        <section className="pb-8">
          <div className="container mx-auto px-6">
            <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
              <img src={post.image} alt={`${post.title} mockup`} className="h-72 w-full object-cover md:h-[28rem]" />
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-8">
                {post.sections.map((section) => (
                  <section key={section.heading} className="rounded-2xl border border-border/70 bg-card p-7">
                    <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
                    <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <aside className="h-fit rounded-2xl border border-border/70 bg-card p-6 lg:sticky lg:top-28">
                <p className="text-xs font-mono uppercase tracking-[0.16em] text-primary">Key takeaways</p>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {post.takeaways.map((takeaway) => (
                    <li key={takeaway} className="rounded-xl border border-border bg-background px-3 py-2">
                      {takeaway}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
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
