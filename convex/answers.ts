import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ");
}

function normalizeAnswers(answers: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(answers)) {
    normalized[key] = normalizeAnswer(value);
  }
  return normalized;
}

export const submit = mutation({
  args: {
    questionId: v.id("questions"),
    teamId: v.id("teams"),
    rawAnswer: v.optional(v.string()),
    answers: v.optional(v.record(v.string(), v.string())),
  },
  handler: async (ctx, args) => {
    const existingAnswer = await ctx.db
      .query("answers")
      .withIndex("by_questionId_teamId", (q) =>
        q.eq("questionId", args.questionId).eq("teamId", args.teamId)
      )
      .first();

    const rawAnswer = args.rawAnswer ?? (args.answers ? JSON.stringify(args.answers) : "");
    const normalizedAnswer = normalizeAnswer(rawAnswer);
    const normalizedAnswers = args.answers ? normalizeAnswers(args.answers) : undefined;

    if (existingAnswer) {
      await ctx.db.patch(existingAnswer._id, {
        rawAnswer,
        normalizedAnswer,
        answers: args.answers,
        normalizedAnswers,
        submittedAt: Date.now(),
      });
      return existingAnswer._id;
    }

    const answerId = await ctx.db.insert("answers", {
      questionId: args.questionId,
      teamId: args.teamId,
      rawAnswer,
      normalizedAnswer,
      answers: args.answers,
      normalizedAnswers,
      autoScore: undefined,
      needsReview: true,
      finalScore: undefined,
      submittedAt: Date.now(),
    });

    return answerId;
  },
});

export const getSubmissionStatus = query({
  args: {
    questionId: v.id("questions"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const answer = await ctx.db
      .query("answers")
      .withIndex("by_questionId_teamId", (q) =>
        q.eq("questionId", args.questionId).eq("teamId", args.teamId)
      )
      .first();

    return {
      hasSubmitted: !!answer,
      answer: answer?.rawAnswer ?? null,
      answers: answer?.answers ?? null,
      submittedAt: answer?.submittedAt ?? null,
    };
  },
});

export const getAnswersForQuestion = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    const answersWithTeams = await Promise.all(
      answers.map(async (answer) => {
        const team = await ctx.db.get(answer.teamId);
        return {
          ...answer,
          teamName: team?.name ?? "Unknown Team",
        };
      })
    );

    return answersWithTeams;
  },
});

export const getSubmissionStatusForGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || !game.currentRoundId || game.currentQuestionIndex === undefined) {
      return { teams: [], submittedCount: 0, totalTeams: 0 };
    }

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_roundId", (q) => q.eq("roundId", game.currentRoundId!))
      .collect();

    const currentQuestion = questions.find(
      (q) => q.indexInRound === game.currentQuestionIndex
    );

    if (!currentQuestion) {
      return { teams: [], submittedCount: 0, totalTeams: 0 };
    }

    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", currentQuestion._id))
      .collect();

    const submittedTeamIds = new Set(answers.map((a) => a.teamId));

    const teamsWithStatus = teams.map((team) => ({
      teamId: team._id,
      teamName: team.name,
      hasSubmitted: submittedTeamIds.has(team._id),
    }));

    return {
      teams: teamsWithStatus,
      submittedCount: answers.length,
      totalTeams: teams.length,
    };
  },
});

export const getTeamHistory = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_teamId", (q) => q.eq("teamId", args.teamId))
      .collect();

    const answersWithQuestions = await Promise.all(
      answers.map(async (answer) => {
        const question = await ctx.db.get(answer.questionId);
        return {
          ...answer,
          questionPrompt: question?.prompt ?? "",
          correctAnswer: question?.correctAnswer ?? "",
          points: question?.points ?? 0,
        };
      })
    );

    return answersWithQuestions.sort((a, b) => a.submittedAt - b.submittedAt);
  },
});

export const updateScore = mutation({
  args: {
    answerId: v.id("answers"),
    finalScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.answerId, {
      finalScore: args.finalScore,
      needsReview: false,
    });
  },
});

