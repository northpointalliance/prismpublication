/**
 * seed-ads.mjs
 * Pre-loads affiliate ads into the Prism ad library via the admin API.
 *
 * CAVEMAN EXPLAIN: Ad shelf empty. This script put ads on shelf.
 * No publisher bots needed yet — ads sit ready, waiting.
 *
 * Usage:
 *   node scripts/seed-ads.mjs YOUR_ADMIN_KEY_HERE
 *
 * Or set env var:
 *   ADMIN_KEY=your_key node scripts/seed-ads.mjs
 */

const API_BASE = "https://botnabfogcjrkpmdjgpr.supabase.co/functions/v1/api";
const ADMIN_KEY = process.argv[2] || process.env.ADMIN_KEY;

if (!ADMIN_KEY) {
  console.error("Error: Pass your admin key as the first argument or set ADMIN_KEY env var.");
  console.error("  node scripts/seed-ads.mjs YOUR_KEY_HERE");
  process.exit(1);
}

// --- Ad definitions ---
// Each ad maps to one affiliate link from affiliate-links.txt

const ADS = [
  {
    title: "Is your brand showing up in AI search?",
    description:
      "Track where your brand appears across ChatGPT, Claude, and Perplexity. See what's missing and fix it fast.",
    ctaText: "Check Your AI Visibility",
    clickUrl: "https://searchable.com/?ref=danieled",
    advertiser: "Searchable",
    topics: ["ai", "seo", "marketing", "search", "analytics"],
    format: "card",
    weight: 2,
    isActive: true,
  },
  {
    title: "Stop guessing. Start getting cited.",
    description:
      "AirOps tracks your brand across every AI engine and turns visibility gaps into content that gets you cited.",
    ctaText: "See AirOps",
    clickUrl:
      "https://www.airops.com/?utm_campaign=AirOps_Builder_Network&utm_medium=affiliate&utm_source=rewardful&via=Daniel",
    advertiser: "AirOps",
    topics: ["ai", "seo", "content", "marketing", "search"],
    format: "card",
    weight: 2,
    isActive: true,
  },
  {
    title: "Build a working app without writing code",
    description:
      "Describe what you need and Shipper builds it — frontend, backend, deployed live. No dev required.",
    ctaText: "Ship Your Idea",
    clickUrl: "https://shipper.now/?ref=danieliq",
    advertiser: "Shipper.now",
    topics: ["ai", "no-code", "apps", "startup", "tools"],
    format: "card",
    weight: 2,
    isActive: true,
  },
  {
    title: "AI books and tools worth reading right now",
    description:
      "Browse Amazon's top picks for AI, automation, and tech — curated for operators and builders.",
    ctaText: "Shop on Amazon",
    clickUrl: "https://www.amazon.com/s?k=AI+tools&tag=prismpublicat-20",
    advertiser: "Amazon",
    topics: ["ai", "books", "tools", "tech"],
    format: "card",
    weight: 1,
    isActive: true,
  },
];

// --- Runner ---

async function createAd(ad) {
  const res = await fetch(`${API_BASE}/admin/ads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": ADMIN_KEY,
    },
    body: JSON.stringify(ad),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return JSON.parse(text);
}

async function run() {
  console.log(`Seeding ${ADS.length} ads into Prism...\n`);

  for (const ad of ADS) {
    try {
      const result = await createAd(ad);
      const id = result?.id ?? result?.ad?.id ?? "???";
      console.log(`  [OK] "${ad.title}" → id: ${id}`);
    } catch (err) {
      console.error(`  [FAIL] "${ad.title}": ${err.message}`);
    }
  }

  console.log("\nDone. Check the admin panel to verify.");
}

run();
