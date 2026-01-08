import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { rateLimiter } from "./rateLimiter";

// Get current user
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
  },
});

// Get or create user (internal)
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
    return user;
  },
});

// Create user
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    return ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
    });
  },
});

// Get rate limit status for current user
export const getRateLimitStatus = query({
  args: { ipAddress: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    // Default values for rate limit
    const limit = 20;
    let userUsed = 0;
    let ipUsed = 0;
    let retryAfter: number | undefined;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .first();

      if (user) {
        const status = await rateLimiter.check(ctx, "generateByUser", {
          key: user._id,
        });
        if (!status.ok && status.retryAfter) {
          userUsed = limit;
          retryAfter = Date.now() + status.retryAfter;
        }
      }
    }

    if (args.ipAddress) {
      const status = await rateLimiter.check(ctx, "generateByIp", {
        key: args.ipAddress,
      });
      if (!status.ok && status.retryAfter) {
        ipUsed = limit;
        if (!retryAfter || Date.now() + status.retryAfter < retryAfter) {
          retryAfter = Date.now() + status.retryAfter;
        }
      }
    }

    // Calculate remaining based on used
    const remaining = Math.max(0, limit - Math.max(userUsed, ipUsed));

    return {
      remaining,
      limit,
      resetsAt: retryAfter,
      isLimited: remaining <= 0,
    };
  },
});
