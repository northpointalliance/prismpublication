// Verbatim copy of server/src/schemas.ts — pure zod, portable to Deno via the "zod" import map entry.
import { z } from "zod";

export const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(500)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch (_err) {
      return false;
    }
  }, "URL must use http or https protocol.");

export const metadataScalarSchema = z.union([z.string().max(280), z.number(), z.boolean(), z.null()]);
export const metadataValueSchema = z.union([metadataScalarSchema, z.array(metadataScalarSchema).max(30)]);

export const leadSchema = z.object({
  role: z.enum(["publisher", "advertiser", "demo", "general"]).default("general"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(120).optional(),
});

export const adRequestSchema = z.object({
  botId: z.string().trim().min(2).max(120),
  context: z
    .object({
      topic: z.string().trim().max(120).optional(),
      userId: z.string().trim().max(120).optional(),
    })
    .passthrough()
    .optional()
    .default({}),
  position: z.enum(["inline", "sidebar", "floating"]).default("inline"),
  format: z.enum(["text", "card", "banner"]).default("card"),
});

export const trackEventSchema = z.object({
  adId: z.string().trim().min(3).max(120),
  userId: z.string().trim().max(120).optional(),
  botId: z.string().trim().min(2).max(120),
  timestamp: z.number().int().optional(),
  amount: z.number().int().nonnegative().optional(),
  topic: z.string().trim().max(120).optional(),
  metadata: z.record(z.string().max(120), metadataValueSchema).optional(),
});

export const demoAdRequestSchema = adRequestSchema.omit({ botId: true });
export const demoTrackEventSchema = trackEventSchema.omit({ botId: true, amount: true, metadata: true });

export const adminCreateAdSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(400),
  ctaText: z.string().trim().min(2).max(60),
  clickUrl: httpUrlSchema,
  advertiser: z.string().trim().min(2).max(120),
  imageUrl: httpUrlSchema.optional(),
  topics: z.array(z.string().trim().min(1).max(60)).default([]),
  format: z.enum(["text", "card", "banner"]).default("card"),
  weight: z.number().int().min(1).max(100).default(1),
  isActive: z.boolean().default(true),
});

export const adminUpdateAdSchema = adminCreateAdSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required",
);

export const syncUserSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).max(120).optional(),
});

export const selectWorkspaceSchema = z.object({
  workspaceId: z.string().trim().min(3).max(120),
});

export const createWorkspaceSchema = z.object({
  type: z.enum(["advertiser", "publisher", "admin"]),
  name: z.string().trim().min(2).max(120).optional(),
});

export const advertiserCampaignCreateSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().min(8).max(400),
  ctaText: z.string().trim().min(2).max(60),
  clickUrl: httpUrlSchema,
  imageUrl: httpUrlSchema.optional(),
  topics: z.array(z.string().trim().min(1).max(60)).default([]),
  format: z.enum(["text", "card", "banner"]).default("card"),
  weight: z.number().int().min(1).max(100).default(1),
  isActive: z.boolean().optional(),
  dailyBudgetCents: z.number().int().min(0).default(0),
  lifetimeBudgetCents: z.number().int().min(0).default(0),
  durationDays: z.number().int().min(1).max(365).optional(),
});

export const advertiserCampaignUpdateSchema = advertiserCampaignCreateSchema
  .pick({
    title: true,
    description: true,
    ctaText: true,
    clickUrl: true,
    imageUrl: true,
    topics: true,
    format: true,
    weight: true,
    isActive: true,
    dailyBudgetCents: true,
    lifetimeBudgetCents: true,
    durationDays: true,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const publisherBotCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  health: z.enum(["healthy", "warning", "degraded"]).default("healthy"),
  placementPolicy: z.record(z.string().max(120), metadataValueSchema).optional(),
});

export const publisherBotUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    environment: z.enum(["development", "staging", "production"]).optional(),
    health: z.enum(["healthy", "warning", "degraded"]).optional(),
    isActive: z.boolean().optional(),
    placementPolicy: z.record(z.string().max(120), metadataValueSchema).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const publisherCreateSdkKeySchema = z.object({
  label: z.string().trim().min(2).max(60).default("Primary"),
});
