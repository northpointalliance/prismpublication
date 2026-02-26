/**
 * BotGrid SDK Build Script
 * Simple build using esbuild
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure dist directory exists
if (!existsSync(join(__dirname, 'dist'))) {
  mkdirSync(join(__dirname, 'dist'), { recursive: true });
}

// Copy package.json to dist
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
delete pkg.scripts;
delete pkg.devDependencies;
delete pkg.type;
writeFileSync(join(__dirname, 'dist', 'package.json'), JSON.stringify(pkg, null, 2));

// Build configurations
const builds = [
  // ESM build
  {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/index.mjs',
    external: [],
    minify: true,
    sourcemap: true,
  },
  // CJS build
  {
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'browser',
    format: 'cjs',
    outfile: 'dist/index.js',
    external: [],
    minify: true,
    sourcemap: true,
  },
  // React ESM
  {
    entryPoints: ['src/react.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: 'dist/react.mjs',
    external: ['react', 'react-dom'],
    minify: true,
    sourcemap: true,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
  },
  // React CJS
  {
    entryPoints: ['src/react.tsx'],
    bundle: true,
    platform: 'browser',
    format: 'cjs',
    outfile: 'dist/react.js',
    external: ['react', 'react-dom'],
    minify: true,
    sourcemap: true,
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
  },
];

// Type declarations (simplified - just copy source as d.ts for now)
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

writeFileSync(join(__dirname, 'dist', 'index.d.ts'), typeContent);
writeFileSync(join(__dirname, 'dist', 'react.d.ts'), typeContent);

// Run builds
async function build() {
  try {
    for (const config of builds) {
      await esbuild.build(config);
      console.log(`✓ Built ${config.outfile}`);
    }
    console.log('\n✅ Build complete!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
