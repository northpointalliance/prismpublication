/**
 * Prism SDK Build Script
 * Uses esbuild-wasm so the build works consistently across local and Vercel environments.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { spawnSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, "dist");
const require = createRequire(import.meta.url);

const useWasm = process.env.ESBUILD_WASM === "1";
let esbuildBuild;

if (useWasm) {
  const wasmModule = await import("esbuild-wasm");
  await wasmModule.initialize({ worker: false });
  esbuildBuild = wasmModule.build;
} else {
  const esbuildPath = (() => {
    try {
      return require.resolve("esbuild/bin/esbuild");
    } catch {
      return null;
    }
  })();

  if (!esbuildPath) {
    console.error("Build failed: no esbuild runtime available.");
    process.exit(1);
  }

  esbuildBuild = async (options) => {
    // esbuild's postinstall replaces bin/esbuild with the actual native binary
    // (ELF/Mach-O/PE) for the current platform, not a JS wrapper. It must be
    // executed directly — running it via `node <path>` tries to parse the raw
    // binary as JavaScript and fails with "SyntaxError: Invalid or unexpected token".
    const result = spawnSync(esbuildPath, buildArgs(options), {
      cwd: __dirname,
      stdio: "pipe",
      encoding: "utf8",
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) {
      throw new Error(`esbuild failed with exit code ${result.status}`);
    }
  };
}

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf-8"));
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.type;
writeFileSync(join(distDir, "package.json"), JSON.stringify(pkg, null, 2));

const builds = [
  {
    entry: "src/index.ts",
    outfile: "dist/index.mjs",
    format: "esm",
    external: [],
  },
];

const typeContent = `// Prism SDK Type Declarations
export class PrismAds {
  constructor(config: PrismConfig);
  fetchAds(context?: AdContext): Promise<Ad[]>;
  displayAd(context?: AdContext): Promise<Ad | null>;
  formatAd(ad: Ad): FormattedAd;
  trackImpression(adId: string, userId?: string): Promise<void>;
  trackClick(adId: string, userId?: string): Promise<void>;
  trackRevenue(adId: string, amount: number, userId?: string): Promise<void>;
  shouldShowAd(userId: string, frequency?: number): boolean;
  resetMessageCount(userId: string): void;
  getMessageCount(userId: string): number;
  updateConfig(config: Partial<PrismConfig>): void;
  getVersion(): string;
}

export interface PrismConfig {
  apiKey: string;
  botId: string;
  position?: 'inline' | 'sidebar' | 'floating';
  adFormat?: 'text' | 'card' | 'banner';
  baseUrl?: string;
}

export interface AdContext {
  topic?: string;
  userId?: string;
  [key: string]: any;
}

export interface Ad {
  id: string;
  title: string;
  description: string;
  ctaText: string;
  clickUrl: string;
  imageUrl?: string;
  advertiser: string;
  tags?: string[];
}

export interface FormattedAdText {
  type: 'text';
  content: string;
}

export interface FormattedAdCard {
  type: 'card';
  title: string;
  description: string;
  cta: string;
  url: string;
  image?: string;
  advertiser: string;
}

export interface FormattedAdBanner {
  type: 'banner';
  image?: string;
  url: string;
  alt: string;
}

export type FormattedAd = FormattedAdText | FormattedAdCard | FormattedAdBanner;

export function usePrismAd(options: UsePrismAdOptions): UsePrismAdResult;

export interface UsePrismAdOptions extends PrismConfig {
  topic?: string;
  userId?: string;
  frequency?: number;
  autoFetch?: boolean;
}

export interface UsePrismAdResult {
  ad: Ad | null;
  formattedAd: FormattedAd | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  messageCount: number;
  resetCount?: () => void;
}

export function PrismAdComponent(props: PrismAdProps): JSX.Element;

export interface PrismAdProps {
  apiKey: string;
  botId: string;
  position?: 'inline' | 'sidebar' | 'floating';
  adFormat?: 'text' | 'card' | 'banner';
  baseUrl?: string;
  topic?: string;
  userId?: string;
  frequency?: number;
  autoFetch?: boolean;
  render?: (ad: FormattedAd) => React.ReactNode;
  onAdClick?: (ad: Ad) => void;
  onAdDisplay?: (ad: Ad) => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  className?: string;
}

export default PrismAds;
`;

writeFileSync(join(distDir, "index.d.ts"), typeContent);
writeFileSync(join(distDir, "react.d.ts"), typeContent);

const buildArgs = (options) => [
  options.entryPoints[0],
  "--bundle",
  "--platform=browser",
  `--format=${options.format}`,
  `--outfile=${options.outfile}`,
  "--minify",
  "--sourcemap",
  ...(options.external || []).flatMap((item) => [`--external:${item}`]),
];

const build = async () => {
  try {
    for (const config of builds) {
      await esbuildBuild({
        entryPoints: [config.entry],
        bundle: true,
        platform: "browser",
        format: config.format,
        outfile: config.outfile,
        minify: true,
        sourcemap: true,
        external: config.external,
        absWorkingDir: __dirname,
        logLevel: "info",
      });
      console.log(`✓ Built ${config.outfile}`);
    }
    console.log("\n✅ Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
};

await build();
