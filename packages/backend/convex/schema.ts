import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users (for tracking ownership and rate limits)
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Generated images with ownership and visibility
  images: defineTable({
    // Ownership
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),

    // Visibility
    visibility: v.union(v.literal("public"), v.literal("private")),

    // Generation details
    prompt: v.string(),
    negativePrompt: v.optional(v.string()),
    aspectRatio: v.string(),
    resolution: v.optional(v.string()),

    // Storage
    storageId: v.id("_storage"),
    thumbnailId: v.optional(v.id("_storage")),
    width: v.number(),
    height: v.number(),

    // Model info
    model: v.union(
      v.literal("gemini-2.5-flash-image"),
      v.literal("gemini-3-pro-image-preview")
    ),
    style: v.optional(v.string()),

    // Metadata
    isFavorite: v.boolean(),
    tags: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_visibility", ["visibility"])
    .index("by_favorite", ["isFavorite"])
    .index("by_userId_visibility", ["userId", "visibility"]),

  // Generation history/sessions
  generations: defineTable({
    userId: v.optional(v.id("users")),
    ipAddress: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("rate_limited")
    ),
    prompt: v.string(),
    config: v.object({
      aspectRatio: v.string(),
      model: v.string(),
      resolution: v.optional(v.string()),
      style: v.optional(v.string()),
    }),
    imageId: v.optional(v.id("images")),
    error: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_userId", ["userId"]),

  // Prompt library/templates
  promptTemplates: defineTable({
    title: v.string(),
    prompt: v.string(),
    category: v.string(),
    useCount: v.number(),
  }).index("by_category", ["category"]),
});
