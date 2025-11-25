import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { gameState } from "./schema";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let joinCode = generateJoinCode();
    let existing = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
      .first();

    while (existing) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query("games")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
        .first();
    }

    const gameId = await ctx.db.insert("games", {
      joinCode,
      title: args.title ?? "Untitled Game",
      description: args.description,
      state: "lobby",
      isArchived: false,
      currentRoundId: undefined,
      currentQuestionIndex: undefined,
      createdAt: Date.now(),
    });

    return { gameId, joinCode };
  },
});

export const getByJoinCode = query({
  args: { joinCode: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", args.joinCode.toUpperCase()))
      .first();
    return game;
  },
});

export const getById = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getGameState = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    let currentRound = null;
    let currentQuestion = null;

    if (game.currentRoundId) {
      currentRound = await ctx.db.get(game.currentRoundId);

      if (currentRound && game.currentQuestionIndex !== undefined) {
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_roundId", (q) => q.eq("roundId", game.currentRoundId!))
          .collect();

        currentQuestion = questions.find(
          (q) => q.indexInRound === game.currentQuestionIndex
        );
      }
    }

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    return {
      ...game,
      currentRound,
      currentQuestion,
      rounds: rounds.sort((a, b) => a.roundNumber - b.roundNumber),
    };
  },
});

export const updateState = mutation({
  args: {
    gameId: v.id("games"),
    state: gameState,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { state: args.state });
  },
});

export const startRound = mutation({
  args: {
    gameId: v.id("games"),
    roundId: v.id("rounds"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, {
      state: "in_round",
      currentRoundId: args.roundId,
      currentQuestionIndex: 0,
    });
  },
});

export const advanceQuestion = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.currentRoundId) return { success: false, reason: "no_round" };

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", game.currentRoundId!))
      .collect();

    const nextIndex = (game.currentQuestionIndex ?? 0) + 1;

    if (nextIndex >= questions.length) {
      return { success: false, reason: "end_of_round" };
    }

    await ctx.db.patch(args.gameId, {
      currentQuestionIndex: nextIndex,
      state: "in_round",
    });

    return { success: true };
  },
});

export const advanceRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false, reason: "no_game" };

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const sortedRounds = rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    const currentRoundIndex = sortedRounds.findIndex(
      (r) => r._id === game.currentRoundId
    );

    const nextRoundIndex = currentRoundIndex + 1;

    if (nextRoundIndex >= sortedRounds.length) {
      await ctx.db.patch(args.gameId, { state: "finished" });
      return { success: false, reason: "end_of_game" };
    }

    await ctx.db.patch(args.gameId, {
      currentRoundId: sortedRounds[nextRoundIndex]._id,
      currentQuestionIndex: 0,
      state: "in_round",
    });

    return { success: true };
  },
});

export const goToBetweenRounds = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false, reason: "no_game" };

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const sortedRounds = rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    const currentRoundIndex = sortedRounds.findIndex(
      (r) => r._id === game.currentRoundId
    );

    const hasMoreRounds = currentRoundIndex + 1 < sortedRounds.length;

    if (hasMoreRounds) {
      await ctx.db.patch(args.gameId, { state: "between_rounds" });
      return { success: true, nextState: "between_rounds" };
    } else {
      await ctx.db.patch(args.gameId, { state: "finished" });
      return { success: true, nextState: "finished" };
    }
  },
});

export const startNextRound = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false, reason: "no_game" };
    if (game.state !== "between_rounds") {
      return { success: false, reason: "not_between_rounds" };
    }

    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const sortedRounds = rounds.sort((a, b) => a.roundNumber - b.roundNumber);
    const currentRoundIndex = sortedRounds.findIndex(
      (r) => r._id === game.currentRoundId
    );

    const nextRoundIndex = currentRoundIndex + 1;

    if (nextRoundIndex >= sortedRounds.length) {
      await ctx.db.patch(args.gameId, { state: "finished" });
      return { success: false, reason: "no_more_rounds" };
    }

    await ctx.db.patch(args.gameId, {
      currentRoundId: sortedRounds[nextRoundIndex]._id,
      currentQuestionIndex: 0,
      state: "in_round",
    });

    return { success: true, nextRound: sortedRounds[nextRoundIndex] };
  },
});

export const endGame = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return { success: false, reason: "no_game" };

    await ctx.db.patch(args.gameId, { state: "finished" });
    return { success: true };
  },
});

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const games = await ctx.db.query("games").collect();

    const filteredGames = args.includeArchived
      ? games
      : games.filter((g) => !g.isArchived);

    const gamesWithCounts = await Promise.all(
      filteredGames.map(async (game) => {
        const rounds = await ctx.db
          .query("rounds")
          .withIndex("by_gameId", (q) => q.eq("gameId", game._id))
          .collect();

        let questionCount = 0;
        for (const round of rounds) {
          const questions = await ctx.db
            .query("questions")
            .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
            .collect();
          questionCount += questions.length;
        }

        return {
          ...game,
          title: game.title ?? "Untitled Game",
          isArchived: game.isArchived ?? false,
          roundCount: rounds.length,
          questionCount,
        };
      })
    );

    return gamesWithCounts.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updateMeta = mutation({
  args: {
    gameId: v.id("games"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "lobby") throw new Error("Cannot edit game that has started");

    const updates: { title?: string; description?: string } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.gameId, updates);
    }
  },
});

export const archive = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { isArchived: true });
  },
});

export const restore = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.gameId, { isArchived: false });
  },
});

export const hardDelete = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "lobby") throw new Error("Cannot delete game that has started");

    // Delete all answers for questions in this game
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const round of rounds) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
        .collect();

      for (const question of questions) {
        const answers = await ctx.db
          .query("answers")
          .withIndex("by_questionId", (q) => q.eq("questionId", question._id))
          .collect();

        for (const answer of answers) {
          await ctx.db.delete(answer._id);
        }
        await ctx.db.delete(question._id);
      }
      await ctx.db.delete(round._id);
    }

    // Delete teams
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const team of teams) {
      await ctx.db.delete(team._id);
    }

    await ctx.db.delete(args.gameId);
  },
});

export const resetGame = mutation({
  args: {
    gameId: v.id("games"),
    preserveTeams: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Get all rounds to find all questions
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    // Delete all answers for this game
    for (const round of rounds) {
      const questions = await ctx.db
        .query("questions")
        .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
        .collect();

      for (const question of questions) {
        const answers = await ctx.db
          .query("answers")
          .withIndex("by_questionId", (q) => q.eq("questionId", question._id))
          .collect();

        for (const answer of answers) {
          await ctx.db.delete(answer._id);
        }
      }
    }

    // Handle teams based on preserveTeams flag
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    if (args.preserveTeams) {
      // Reset team scores to 0
      for (const team of teams) {
        await ctx.db.patch(team._id, { totalScore: 0 });
      }
    } else {
      // Delete all teams
      for (const team of teams) {
        await ctx.db.delete(team._id);
      }
    }

    // Reset game state back to lobby
    await ctx.db.patch(args.gameId, {
      state: "lobby",
      currentRoundId: undefined,
      currentQuestionIndex: undefined,
    });

    return { success: true };
  },
});

export const duplicate = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    // Generate new join code
    let joinCode = generateJoinCode();
    let existing = await ctx.db
      .query("games")
      .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
      .first();

    while (existing) {
      joinCode = generateJoinCode();
      existing = await ctx.db
        .query("games")
        .withIndex("by_joinCode", (q) => q.eq("joinCode", joinCode))
        .first();
    }

    const newGameId = await ctx.db.insert("games", {
      joinCode,
      title: `${game.title} (Copy)`,
      description: game.description,
      state: "lobby",
      isArchived: false,
      currentRoundId: undefined,
      currentQuestionIndex: undefined,
      createdAt: Date.now(),
    });

    // Copy rounds and questions
    const rounds = await ctx.db
      .query("rounds")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    for (const round of rounds) {
      const newRoundId = await ctx.db.insert("rounds", {
        gameId: newGameId,
        title: round.title,
        roundNumber: round.roundNumber,
        type: round.type,
      });

      const questions = await ctx.db
        .query("questions")
        .withIndex("by_roundId", (q) => q.eq("roundId", round._id))
        .collect();

      for (const question of questions) {
        await ctx.db.insert("questions", {
          roundId: newRoundId,
          indexInRound: question.indexInRound,
          prompt: question.prompt,
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          mediaUrl: question.mediaUrl,
          mediaType: question.mediaType,
          points: question.points,
          answerFields: question.answerFields,
        });
      }
    }

    return { gameId: newGameId, joinCode };
  },
});

export const toggleLobbyLock = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");
    if (game.state !== "lobby") throw new Error("Can only lock/unlock in lobby state");

    const newLockState = !(game.isLobbyLocked ?? false);
    await ctx.db.patch(args.gameId, { isLobbyLocked: newLockState });
    return { isLobbyLocked: newLockState };
  },
});

export const updateMaxTeams = mutation({
  args: {
    gameId: v.id("games"),
    maxTeams: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (args.maxTeams < 1 || args.maxTeams > 100) {
      throw new Error("Max teams must be between 1 and 100");
    }

    await ctx.db.patch(args.gameId, { maxTeams: args.maxTeams });
  },
});

