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

    if (game.isLobbyLocked) {
      throw new Error("Lobby is closed");
    }

    // Check team limit (default 20)
    const maxTeams = game.maxTeams ?? 20;
    const existingTeams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (existingTeams.length >= maxTeams) {
      throw new Error("Game is full");
    }

    const existingTeam = existingTeams.find(
      (t) => t.name.toLowerCase() === args.name.trim().toLowerCase()
    );

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

export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    const game = await ctx.db.get(team.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.state !== "lobby") {
      throw new Error("Cannot remove teams once game has started");
    }

    // Delete all answers from this team
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const answer of answers) {
      await ctx.db.delete(answer._id);
    }

    await ctx.db.delete(args.teamId);
  },
});

export const clearAllTeams = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.state !== "lobby") {
      throw new Error("Cannot clear teams once game has started");
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const team of teams) {
      // Delete all answers from this team
      const answers = await ctx.db
        .query("answers")
        .withIndex("by_teamId", (q) => q.eq("teamId", team._id))
        .collect();

      for (const answer of answers) {
        await ctx.db.delete(answer._id);
      }

      await ctx.db.delete(team._id);
    }
  },
});

