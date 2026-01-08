import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user's own images (private + public)
export const listMine = query({
  args: {
    limit: v.optional(v.number()),
    favoriteOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { images: [], hasMore: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return { images: [], hasMore: false };
    }

    const limit = args.limit ?? 20;
    const imageQuery = ctx.db
      .query("images")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc");

    const images = await imageQuery.take(limit + 1);

    // Filter favorites if requested
    const filtered = args.favoriteOnly
      ? images.filter((img) => img.isFavorite)
      : images;

    const result = await Promise.all(
      filtered.slice(0, limit).map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
        thumbnailUrl: img.thumbnailId
          ? await ctx.storage.getUrl(img.thumbnailId)
          : await ctx.storage.getUrl(img.storageId),
      }))
    );

    return {
      images: result,
      hasMore: images.length > limit,
    };
  },
});

// Get public images (community gallery)
export const listPublic = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const images = await ctx.db
      .query("images")
      .withIndex("by_visibility", (q) => q.eq("visibility", "public"))
      .order("desc")
      .take(limit + 1);

    const result = await Promise.all(
      images.slice(0, limit).map(async (img) => ({
        ...img,
        url: await ctx.storage.getUrl(img.storageId),
        thumbnailUrl: img.thumbnailId
          ? await ctx.storage.getUrl(img.thumbnailId)
          : await ctx.storage.getUrl(img.storageId),
      }))
    );

    return {
      images: result,
      hasMore: images.length > limit,
    };
  },
});

// Get single image (with visibility check)
export const get = query({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const image = await ctx.db.get(args.id);
    if (!image) {
      return null;
    }

    // Check visibility
    if (image.visibility === "private") {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        return null;
      }

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (!user || image.userId !== user._id) {
        return null;
      }
    }

    return {
      ...image,
      url: await ctx.storage.getUrl(image.storageId),
    };
  },
});

// Toggle visibility (public/private)
export const toggleVisibility = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || image.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, {
      visibility: image.visibility === "public" ? "private" : "public",
    });
  },
});

// Toggle favorite
export const toggleFavorite = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || image.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { isFavorite: !image.isFavorite });
  },
});

// Delete image
export const remove = mutation({
  args: { id: v.id("images") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || image.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.storage.delete(image.storageId);
    if (image.thumbnailId) {
      await ctx.storage.delete(image.thumbnailId);
    }
    await ctx.db.delete(args.id);
  },
});

// Update tags
export const updateTags = mutation({
  args: {
    id: v.id("images"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const image = await ctx.db.get(args.id);
    if (!image) {
      throw new Error("Image not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || image.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { tags: args.tags });
  },
});
