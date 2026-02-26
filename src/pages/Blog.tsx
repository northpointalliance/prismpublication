import SiteShell from "@/components/SiteShell";
import { blogPosts } from "@/content/blogPosts";
import { ArrowRight, CalendarDays, Clock3, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";

const Blog = () => {
  const [featured, ...restPosts] = blogPosts;

  return (
    <SiteShell>
      <section className="relative overflow-hidden pt-32 pb-14">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
        <div className="container relative z-10 mx-auto px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-mono uppercase tracking-[0.16em] text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            BotGrid Journal
          </div>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Blog and articles for teams building conversational ad systems.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            Practical notes for publishers and advertisers on ad relevance, monetization operations, and native creative strategy.
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-6">
          <article className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-[0_24px_60px_-45px_rgba(0,0,0,0.5)]">
            <img
              src={featured.image}
              alt={`${featured.title} mockup`}
              className="h-64 w-full object-cover md:h-80"
              loading="eager"
            />
            <div className="p-7 md:p-9">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono uppercase tracking-[0.14em] text-primary">
                  {featured.category}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {featured.publishedOn}
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock3 className="h-3.5 w-3.5" />
                  {featured.readingTime}
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">{featured.title}</h2>
              <p className="mt-3 max-w-3xl text-muted-foreground">{featured.excerpt}</p>

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

      <section className="pb-20">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold tracking-tight">Latest articles</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {restPosts.map((post) => (
              <article key={post.slug} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                <img
                  src={post.image}
                  alt={`${post.title} mockup`}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono uppercase tracking-[0.12em] text-primary">
                      {post.category}
                    </span>
                    <span className="text-muted-foreground">{post.readingTime}</span>
                  </div>
                  <h3 className="mt-3 text-2xl font-bold tracking-tight">{post.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
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
    </SiteShell>
  );
};

export default Blog;
