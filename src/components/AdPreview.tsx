// Shared, presentational ad renderer — the single source of truth for "how an ad looks".
// Mirrors the SDK's formatAd / PrismAdComponent (card / banner / text) so advertisers, admins,
// and bot developers all preview the exact shape end users see. No network, no side effects.
import { ImageOff } from "lucide-react";

export type AdFormat = "text" | "card" | "banner";

export interface AdPreviewData {
  title?: string;
  description?: string;
  ctaText?: string;
  clickUrl?: string;
  imageUrl?: string | null;
  /** Raw advertiser value from the API (may be an `org:<id>` tenant key for advertiser-created ads). */
  advertiser?: string;
  tags?: string[];
}

interface Props {
  ad: AdPreviewData;
  format: AdFormat;
  /** Optional brand label to show in "Sponsored by …" (e.g. the advertiser's workspace name). */
  brand?: string;
  className?: string;
}

/** Hide raw tenant keys: advertiser-portal ads store `advertiser = org:<id>`, which is not a display name. */
export const advertiserLabel = (advertiser?: string, brand?: string): string | undefined => {
  if (brand && brand.trim()) return brand.trim();
  if (advertiser && !advertiser.startsWith("org:")) return advertiser;
  return undefined;
};

const PLACEHOLDER = {
  title: "Ad title preview",
  description: "Your ad description appears here.",
  cta: "Call to action",
};

const AdPreview = ({ ad, format, brand, className }: Props) => {
  const title = ad.title?.trim() || PLACEHOLDER.title;
  const description = ad.description?.trim() || PLACEHOLDER.description;
  const cta = ad.ctaText?.trim() || PLACEHOLDER.cta;
  const sponsor = advertiserLabel(ad.advertiser, brand);
  const url = ad.clickUrl?.trim();

  if (format === "text") {
    return (
      <div className={`rounded-xl border border-border bg-card p-3 ${className ?? ""}`}>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sponsored</span>
        <pre className="mt-1.5 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
{`${title}

${description}

${cta}: ${url || "https://example.com"}`}
        </pre>
        {sponsor && <p className="mt-2 text-[11px] text-muted-foreground">Sponsored by {sponsor}</p>}
      </div>
    );
  }

  if (format === "banner") {
    return (
      <div className={`overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}>
        {ad.imageUrl ? (
          <div className="relative">
            <img src={ad.imageUrl} alt={title} className="h-32 w-full object-cover" />
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sponsored
            </span>
          </div>
        ) : (
          <div className="flex h-32 items-center justify-between gap-3 bg-gradient-to-br from-primary/10 to-primary/5 px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
              {sponsor && <p className="truncate text-[11px] text-muted-foreground">by {sponsor}</p>}
            </div>
            <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{cta}</span>
          </div>
        )}
      </div>
    );
  }

  // card (default)
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-card ${className ?? ""}`}>
      {ad.imageUrl ? (
        <img src={ad.imageUrl} alt={title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center gap-2 bg-muted/40 text-xs text-muted-foreground">
          <ImageOff className="h-4 w-4" /> No image
        </div>
      )}
      <div className="p-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sponsored</span>
        <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
        <span className="mt-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {cta}
        </span>
        {sponsor && <p className="mt-3 text-[11px] text-muted-foreground">Sponsored by {sponsor}</p>}
      </div>
    </div>
  );
};

export default AdPreview;
