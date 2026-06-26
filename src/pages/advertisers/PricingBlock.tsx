import React from "react";
import { MousePointerClick, Sparkles, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PricingBlock = () => {
  return (
    <section className="py-20 bg-muted/20">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Pricing & Pilot</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Transparent pricing, generous pilot offers</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Start small with a prepaid wallet, run a short pilot, and scale when you see results. Pilot offers for early advertisers and publishers available.</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Text */}
          <div className="rounded-2xl border p-7 bg-card">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MousePointerClick className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Text ads</h3>
            <p className="mt-1 text-base text-muted-foreground">Inline text suggestion within the conversation flow.</p>
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-3xl font-bold tracking-tight">$8 <span className="text-sm font-normal text-muted-foreground">CPM</span></p>
              <p className="mt-1 text-sm text-muted-foreground">Pilot effective: $2.40 CPM (70% off)</p>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border p-7 bg-card shadow-lg shadow-primary/5">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">Most popular</span>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Card ads</h3>
            <p className="mt-1 text-base text-muted-foreground">Rich card with image, copy, and CTA button.</p>
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-3xl font-bold tracking-tight">$18 <span className="text-sm font-normal text-muted-foreground">CPM</span></p>
              <p className="mt-1 text-sm text-muted-foreground">Pilot effective: $5.40 CPM (70% off)</p>
            </div>
          </div>

          {/* Banner */}
          <div className="rounded-2xl border p-7 bg-card">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">Banner ads</h3>
            <p className="mt-1 text-base text-muted-foreground">Full-width visual banner between messages.</p>
            <div className="mt-4 border-t border-border/60 pt-4">
              <p className="text-3xl font-bold tracking-tight">$30 <span className="text-sm font-normal text-muted-foreground">CPM</span></p>
              <p className="mt-1 text-sm text-muted-foreground">Pilot effective: $9.00 CPM (70% off)</p>
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-3xl mx-auto text-center space-y-4">
          <p className="text-base text-muted-foreground">Early Adopter Offer: $100 credit + 70% off your first 100k impressions (or 90 days), limited spots. Publishers in pilot earn 85% revenue share for the first 90 days.</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/app/login" className="btn-sweep inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Create Campaign
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className="btn-sweep inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold">
              Talk to Sales
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">No minimum spend required. Pilot promo applies only to served impressions. Refunds available for unused wallet funds. See full terms in the Advertiser Portal.</p>
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;
