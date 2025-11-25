import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gameState = v.union(
  v.literal("lobby"),
  v.literal("in_round"),
  v.literal("grading"),
  v.literal("between_rounds"),
  v.literal("finished")
);

export const roundType = v.union(
  v.literal("standard"),
  v.literal("listening"),
  v.literal("media")
);

export const questionType = v.union(
  v.literal("text"),
  v.literal("multiple_choice"),
  v.literal("numeric"),
  v.literal("media")
);

export const mediaType = v.union(
  v.literal("image"),
  v.literal("video"),
  v.literal("audio"),
  v.literal("youtube")
);

export const answerField = v.object({
  id: v.string(),
  label: v.string(),
  correctAnswer: v.string(),
  acceptedAnswers: v.optional(v.array(v.string())),
});

export default defineSchema({
  games: defineTable({
    joinCode: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    state: gameState,
    isArchived: v.optional(v.boolean()),
    isLobbyLocked: v.optional(v.boolean()),
    maxTeams: v.optional(v.number()),
    currentRoundId: v.optional(v.id("rounds")),
    currentQuestionIndex: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_joinCode", ["joinCode"])
    .index("by_isArchived", ["isArchived"]),

  teams: defineTable({
    gameId: v.id("games"),
    name: v.string(),
    totalScore: v.number(),
    createdAt: v.number(),
  }).index("by_gameId", ["gameId"]),

  rounds: defineTable({
    gameId: v.id("games"),
    title: v.string(),
    roundNumber: v.number(),
    type: roundType,
  }).index("by_gameId", ["gameId"]),

  questions: defineTable({
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
  }).index("by_roundId", ["roundId"]),

  answers: defineTable({
    questionId: v.id("questions"),
    teamId: v.id("teams"),
    rawAnswer: v.string(),
    normalizedAnswer: v.string(),
    answers: v.optional(v.record(v.string(), v.string())),
    normalizedAnswers: v.optional(v.record(v.string(), v.string())),
    autoScore: v.optional(v.number()),
    needsReview: v.boolean(),
    finalScore: v.optional(v.number()),
    submittedAt: v.number(),
  })
    .index("by_questionId", ["questionId"])
    .index("by_teamId", ["teamId"])
    .index("by_questionId_teamId", ["questionId", "teamId"]),
});

