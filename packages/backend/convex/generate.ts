import { GoogleGenAI } from "@google/genai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation } from "./_generated/server";
import { rateLimiter } from "./rateLimiter";

// Model mapping
const MODELS = {
  "nano-banana": "gemini-2.5-flash-image",
  "nano-banana-pro": "gemini-3-pro-image-preview",
} as const;

type ModelKey = keyof typeof MODELS;

// Get or create user by Clerk ID
export const getOrCreateUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

// Check rate limit
export const checkRateLimit = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check by user ID first (takes priority)
    if (args.userId) {
      const result = await rateLimiter.limit(ctx, "generateByUser", {
        key: args.userId,
        throws: false,
      });

      if (!result.ok) {
        return {
          allowed: false as const,
          retryAfter: result.retryAfter,
          reason: "User rate limit exceeded (20/day)",
        };
      }
    }

    // Also check by IP
    if (args.ipAddress) {
      const result = await rateLimiter.limit(ctx, "generateByIp", {
        key: args.ipAddress,
        throws: false,
      });

      if (!result.ok) {
        return {
          allowed: false as const,
          retryAfter: result.retryAfter,
          reason: "IP rate limit exceeded (20/day)",
        };
      }
    }

    return { allowed: true as const, retryAfter: undefined, reason: undefined };
  },
});

// Create generation record
export const createGeneration = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    prompt: v.string(),
    config: v.object({
      aspectRatio: v.string(),
      model: v.string(),
      resolution: v.optional(v.string()),
      style: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const generationId = await ctx.db.insert("generations", {
      userId: args.userId,
      ipAddress: args.ipAddress,
      status: "generating",
      prompt: args.prompt,
      config: args.config,
      startedAt: Date.now(),
    });
    return generationId;
  },
});

// Save generated image
export const saveGeneratedImage = internalMutation({
  args: {
    generationId: v.id("generations"),
    storageId: v.id("_storage"),
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    prompt: v.string(),
    aspectRatio: v.string(),
    resolution: v.optional(v.string()),
    model: v.string(),
    style: v.optional(v.string()),
    visibility: v.union(v.literal("public"), v.literal("private")),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, args) => {
    const imageId = await ctx.db.insert("images", {
      userId: args.userId,
      ipAddress: args.ipAddress,
      visibility: args.visibility,
      prompt: args.prompt,
      aspectRatio: args.aspectRatio,
      resolution: args.resolution,
      storageId: args.storageId,
      width: args.width,
      height: args.height,
      model: args.model as
        | "gemini-2.5-flash-image"
        | "gemini-3-pro-image-preview",
      style: args.style,
      isFavorite: false,
      tags: [],
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.generationId, {
      status: "completed",
      imageId,
      completedAt: Date.now(),
    });

    return imageId;
  },
});

// Fail generation
export const failGeneration = internalMutation({
  args: {
    generationId: v.id("generations"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.generationId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

// Main generation action
export const generateImage = action({
  args: {
    prompt: v.string(),
    aspectRatio: v.optional(v.string()),
    resolution: v.optional(v.string()),
    modelKey: v.optional(v.string()),
    style: v.optional(v.string()),
    visibility: v.optional(v.union(v.literal("public"), v.literal("private"))),
    ipAddress: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    imageId: v.id("images"),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; imageId: Id<"images"> }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Get user identity
    const identity = await ctx.auth.getUserIdentity();
    let userId: Id<"users"> | undefined;

    if (identity) {
      userId = await ctx.runMutation(internal.generate.getOrCreateUser, {
        clerkId: identity.subject,
        email: identity.email,
        name: identity.name,
      });
    }

    // Check rate limit
    const rateLimitResult = await ctx.runMutation(
      internal.generate.checkRateLimit,
      {
        userId,
        ipAddress: args.ipAddress,
      }
    );

    if (!rateLimitResult.allowed) {
      const retryTime = rateLimitResult.retryAfter
        ? new Date(Date.now() + rateLimitResult.retryAfter).toLocaleString()
        : "later";
      throw new Error(
        `Rate limit exceeded: ${rateLimitResult.reason}. Try again at ${retryTime}`
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const aspectRatio = args.aspectRatio ?? "1:1";
    const modelKey = (args.modelKey ?? "nano-banana") as ModelKey;
    const model = MODELS[modelKey];
    const visibility = args.visibility ?? "private";
    const resolution =
      args.resolution ?? (modelKey === "nano-banana-pro" ? "2K" : undefined);

    // Create generation record
    const newGenerationId: Id<"generations"> = await ctx.runMutation(
      internal.generate.createGeneration,
      {
        userId,
        ipAddress: args.ipAddress,
        prompt: args.prompt,
        config: {
          aspectRatio,
          model: modelKey,
          resolution,
          style: args.style,
        },
      }
    );

    try {
      // Build config based on model
      const config: Record<string, unknown> = {
        responseModalities: ["Image"],
      };

      // Add image config
      const imageConfig: Record<string, unknown> = { aspectRatio };

      // Pro model supports higher resolution
      if (modelKey === "nano-banana-pro" && resolution) {
        imageConfig.imageSize = resolution;
      }

      config.imageConfig = imageConfig;

      // Call Nano Banana API
      const response = await ai.models.generateContent({
        model,
        contents: args.prompt,
        config,
      });

      // Extract image data
      const part = response.candidates?.[0]?.content?.parts?.[0];
      if (!(part && "inlineData" in part && part.inlineData?.data)) {
        throw new Error("No image data in response");
      }

      // Convert base64 to blob and store
      const imageBytes = Uint8Array.from(atob(part.inlineData.data), (c) =>
        c.charCodeAt(0)
      );
      const blob = new Blob([imageBytes], { type: "image/png" });
      const storageId = await ctx.storage.store(blob);

      // Calculate dimensions from aspect ratio and resolution
      const [w, h] = aspectRatio.split(":").map(Number);
      const baseSize = getBaseSize(resolution);
      const width = w >= h ? baseSize : Math.round(baseSize * (w / h));
      const height = h >= w ? baseSize : Math.round(baseSize * (h / w));

      // Save to database
      const newImageId: Id<"images"> = await ctx.runMutation(
        internal.generate.saveGeneratedImage,
        {
          generationId: newGenerationId,
          storageId,
          userId,
          ipAddress: args.ipAddress,
          prompt: args.prompt,
          aspectRatio,
          resolution,
          model,
          style: args.style,
          visibility,
          width,
          height,
        }
      );

      return { success: true, imageId: newImageId };
    } catch (error) {
      await ctx.runMutation(internal.generate.failGeneration, {
        generationId: newGenerationId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  },
});

// Helper function to get base size from resolution
function getBaseSize(resolution: string | undefined): number {
  if (resolution === "4K") {
    return 4096;
  }
  if (resolution === "2K") {
    return 2048;
  }
  return 1024;
}
