import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { questionType, mediaType, answerField } from "./schema";

export const create = mutation({
  args: {
    roundId: v.id("rounds"),
    indexInRound: v.number(),
    prompt: v.string(),
    type: questionType,
    options: v.optional(v.array(v.string())),
    correctAnswer: v.string(),
    acceptedAnswers: v.optional(v.array(v.string())),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(mediaType),
    points: v.number(),
    answerFields: v.optional(v.array(answerField)),
  },
  handler: async (ctx, args) => {
    const questionId = await ctx.db.insert("questions", {
      roundId: args.roundId,
      indexInRound: args.indexInRound,
      prompt: args.prompt,
      type: args.type,
      options: args.options,
      correctAnswer: args.correctAnswer,
      acceptedAnswers: args.acceptedAnswers,
      mediaUrl: args.mediaUrl,
      mediaType: args.mediaType,
      points: args.points,
      answerFields: args.answerFields,
    });

    return questionId;
  },
});

export const getQuestionsForRound = query({
  args: { roundId: v.id("rounds") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", args.roundId))
      .collect();

    return questions.sort((a, b) => a.indexInRound - b.indexInRound);
  },
});

export const getCurrentQuestion = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.currentRoundId || game.currentQuestionIndex === undefined) {
      return null;
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", game.currentRoundId!))
      .collect();

    const currentQuestion = questions.find(
      (q) => q.indexInRound === game.currentQuestionIndex
    );

    if (!currentQuestion) return null;

    const totalQuestions = questions.length;
    const round = await ctx.db.get(game.currentRoundId);

    return {
      ...currentQuestion,
      roundTitle: round?.title ?? "",
      roundNumber: round?.roundNumber ?? 0,
      questionNumber: game.currentQuestionIndex + 1,
      totalQuestions,
    };
  },
});

export const getById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.questionId);
  },
});

export const update = mutation({
  args: {
    questionId: v.id("questions"),
    prompt: v.optional(v.string()),
    type: v.optional(questionType),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.string()),
    acceptedAnswers: v.optional(v.array(v.string())),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(mediaType),
    points: v.optional(v.number()),
    answerFields: v.optional(v.array(answerField)),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const round = await ctx.db.get(question.roundId);
    if (round) {
      const game = await ctx.db.get(round.gameId);
      if (game && game.state !== "lobby") {
        throw new Error("Cannot edit question - game has started");
      }
    }

    const { questionId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(questionId, filteredUpdates);
    }
  },
});

export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const round = await ctx.db.get(question.roundId);
    if (round) {
      const game = await ctx.db.get(round.gameId);
      if (game && game.state !== "lobby") {
        throw new Error("Cannot delete question - game has started");
      }
    }

    // Delete all answers for this question
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    for (const answer of answers) {
      await ctx.db.delete(answer._id);
    }

    await ctx.db.delete(args.questionId);

    // Re-index remaining questions in the round
    const remainingQuestions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", question.roundId))
      .collect();

    const sortedQuestions = remainingQuestions.sort(
      (a, b) => a.indexInRound - b.indexInRound
    );
    for (let i = 0; i < sortedQuestions.length; i++) {
      if (sortedQuestions[i].indexInRound !== i) {
        await ctx.db.patch(sortedQuestions[i]._id, { indexInRound: i });
      }
    }
  },
});

export const reorder = mutation({
  args: {
    roundId: v.id("rounds"),
    questionIds: v.array(v.id("questions")),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.roundId);
    if (round) {
      const game = await ctx.db.get(round.gameId);
      if (game && game.state !== "lobby") {
        throw new Error("Cannot reorder questions - game has started");
      }
    }

    for (let i = 0; i < args.questionIds.length; i++) {
      await ctx.db.patch(args.questionIds[i], { indexInRound: i });
    }
  },
});

export const duplicate = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const round = await ctx.db.get(question.roundId);
    if (round) {
      const game = await ctx.db.get(round.gameId);
      if (game && game.state !== "lobby") {
        throw new Error("Cannot duplicate question - game has started");
      }
    }

    // Get current max index
    const questionsInRound = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", question.roundId))
      .collect();

    const maxIndex = Math.max(...questionsInRound.map((q) => q.indexInRound), -1);

    const newQuestionId = await ctx.db.insert("questions", {
      roundId: question.roundId,
      indexInRound: maxIndex + 1,
      prompt: `${question.prompt} (Copy)`,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
      acceptedAnswers: question.acceptedAnswers,
      mediaUrl: question.mediaUrl,
      mediaType: question.mediaType,
      points: question.points,
      answerFields: question.answerFields,
    });

    return newQuestionId;
  },
});

