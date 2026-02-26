/**
 * BotGrid SDK Build Script
 * Uses local esbuild CLI binary to avoid host/binary version mismatch errors.
 */

import { spawn, spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, constants, accessSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const watchMode = process.argv.includes("--watch");
const distDir = join(__dirname, "dist");

const binaryName = process.platform === "win32" ? "esbuild.exe" : "esbuild";
const platformPackage = `${process.platform}-${process.arch}`;

const candidateBinaries = [
  process.env.ESBUILD_BINARY_PATH,
  join(__dirname, "node_modules", "@esbuild", platformPackage, "bin", binaryName),
  join(__dirname, "..", "..", "node_modules", "@esbuild", platformPackage, "bin", binaryName),
  join(__dirname, "node_modules", "esbuild", "bin", binaryName),
  join(__dirname, "..", "..", "node_modules", "esbuild", "bin", binaryName),
].filter(Boolean);

const isRunnableBinary = (candidate) => {
  if (!candidate || !existsSync(candidate)) return false;
  try {
    accessSync(candidate, constants.X_OK);
    const result = spawnSync(candidate, ["--version"], { stdio: "pipe" });
    return result.status === 0;
  } catch (_err) {
    return false;
  }
};

const esbuildBinary = candidateBinaries.find(isRunnableBinary);

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
  {
    entry: "src/index.ts",
    outfile: "dist/index.js",
    format: "cjs",
    external: [],
  },
  {
    entry: "src/react.tsx",
    outfile: "dist/react.mjs",
    format: "esm",
    external: ["react", "react-dom"],
  },
  {
    entry: "src/react.tsx",
    outfile: "dist/react.js",
    format: "cjs",
    external: ["react", "react-dom"],
  },
];

const typeContent = `// BotGrid SDK Type Declarations
export class BotGridAds {
  constructor(config: BotGridConfig);
  fetchAds(context?: AdContext): Promise<Ad[]>;
  displayAd(context?: AdContext): Promise<Ad | null>;
  formatAd(ad: Ad): FormattedAd;
  trackImpression(adId: string, userId?: string): Promise<void>;
  trackClick(adId: string, userId?: string): Promise<void>;
  trackRevenue(adId: string, amount: number, userId?: string): Promise<void>;
  shouldShowAd(userId: string, frequency?: number): boolean;
  resetMessageCount(userId: string): void;
  getMessageCount(userId: string): number;
  updateConfig(config: Partial<BotGridConfig>): void;
  getVersion(): string;
}

export interface BotGridConfig {
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

export function useBotGridAd(options: UseBotGridAdOptions): UseBotGridAdResult;

export interface UseBotGridAdOptions extends BotGridConfig {
  topic?: string;
  userId?: string;
  frequency?: number;
  autoFetch?: boolean;
}

export interface UseBotGridAdResult {
  ad: Ad | null;
  formattedAd: FormattedAd | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  messageCount: number;
  resetCount?: () => void;
}

export function BotGridAdComponent(props: BotGridAdProps): JSX.Element;

export interface BotGridAdProps {
  apiKey: string;
  botId: string;
  position?: 'inline' | 'sidebar' | 'floating';
  adFormat?: 'text' | 'card' | 'banner';
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

export default BotGridAds;
`;

writeFileSync(join(distDir, "index.d.ts"), typeContent);
writeFileSync(join(distDir, "react.d.ts"), typeContent);

const buildArgs = ({ entry, outfile, format, external }) => {
  const args = [
    entry,
    "--bundle",
    "--platform=browser",
    `--format=${format}`,
    `--outfile=${outfile}`,
    "--minify",
    "--sourcemap",
  ];
  for (const item of external) {
    args.push(`--external:${item}`);
  }
  if (watchMode) {
    args.push("--watch");
  }
  return args;
};

const ensureBinary = () => {
  if (!esbuildBinary) {
    console.error("Build failed: no runnable esbuild binary was found.");
    console.error("Checked:");
    for (const candidate of candidateBinaries) {
      console.error(`- ${candidate}`);
    }
    process.exit(1);
  }
};

const runOneSync = (config) => {
  const result = spawnSync(esbuildBinary, buildArgs(config), {
    cwd: __dirname,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Build failed for ${config.outfile}`);
  }
  console.log(`✓ Built ${config.outfile}`);
};

const runWatch = () => {
  const children = builds.map((config) => {
    const child = spawn(esbuildBinary, buildArgs(config), {
      cwd: __dirname,
      stdio: "inherit",
    });
    child.on("exit", (code) => {
      if (code && code !== 0) {
        console.error(`Watcher exited with code ${code} for ${config.outfile}`);
      }
    });
    return child;
  });

  console.log("Watching SDK builds...");
  const stopAll = () => {
    for (const child of children) {
      child.kill("SIGTERM");
    }
    process.exit(0);
  };
  process.on("SIGINT", stopAll);
  process.on("SIGTERM", stopAll);
};

const build = async () => {
  try {
    ensureBinary();
    if (watchMode) {
      runWatch();
      return;
    }
    for (const config of builds) {
      runOneSync(config);
    }
    console.log("\n✅ Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
};

build();
