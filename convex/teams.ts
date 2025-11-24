import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const join = mutation({
  args: {
    gameId: v.id("games"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.state !== "lobby") {
      throw new Error("Game has already started");
    }

    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingTeam) {
      throw new Error("Team name already taken");
    }

    const teamId = await ctx.db.insert("teams", {
      gameId: args.gameId,
      name: args.name.trim(),
      totalScore: 0,
      createdAt: Date.now(),
    });

    return teamId;
  },
});

export const getTeamsForGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return teams.sort((a, b) => b.totalScore - a.totalScore);
  },
});

export const getById = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId);
  },
});

export const updateScore = mutation({
  args: {
    teamId: v.id("teams"),
    scoreChange: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      totalScore: team.totalScore + args.scoreChange,
    });
  },
});

