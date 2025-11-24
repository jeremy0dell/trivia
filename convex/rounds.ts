import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { roundType } from "./schema";

export const create = mutation({
  args: {
    gameId: v.id("games"),
    title: v.string(),
    roundNumber: v.number(),
    type: roundType,
  },
  handler: async (ctx, args) => {
    const roundId = await ctx.db.insert("rounds", {
      gameId: args.gameId,
      title: args.title,
      roundNumber: args.roundNumber,
      type: args.type,
    });

    return roundId;
  },
});

export const getRoundsForGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  },
});

export const getById = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roundId);
  },
});

export const update = mutation({
  args: {
    roundId: v.id("rounds"),
    title: v.optional(v.string()),
    type: v.optional(roundType),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    const game = await ctx.db.get(round.gameId);
    if (game && game.state !== "lobby") {
      throw new Error("Cannot edit round - game has started");
    }

    const { roundId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(roundId, filteredUpdates);
    }
  },
});

export const deleteRound = mutation({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (!round) throw new Error("Round not found");

    const game = await ctx.db.get(round.gameId);
    if (game && game.state !== "lobby") {
      throw new Error("Cannot delete round - game has started");
    }

    // Delete all questions in this round
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    for (const question of questions) {
      // Delete answers for this question
      const answers = await ctx.db
        .query("answers")
        .withIndex("by_questionId", (q) => q.eq("questionId", question._id))
        .collect();

      for (const answer of answers) {
        await ctx.db.delete(answer._id);
      }
      await ctx.db.delete(question._id);
    }

    await ctx.db.delete(args.roundId);

    // Re-index remaining rounds
    const remainingRounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", round.gameId))
      .collect();

    const sortedRounds = remainingRounds.sort((a, b) => a.roundNumber - b.roundNumber);
    for (let i = 0; i < sortedRounds.length; i++) {
      if (sortedRounds[i].roundNumber !== i + 1) {
        await ctx.db.patch(sortedRounds[i]._id, { roundNumber: i + 1 });
      }
    }
  },
});

export const reorder = mutation({
  args: {
    gameId: v.id("games"),
    roundIds: v.array(v.id("rounds")),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (game && game.state !== "lobby") {
      throw new Error("Cannot reorder rounds - game has started");
    }

    for (let i = 0; i < args.roundIds.length; i++) {
      await ctx.db.patch(args.roundIds[i], { roundNumber: i + 1 });
    }
  },
});

