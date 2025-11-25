import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^(the|a|an)\s+/i, "");
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForComparison(str1);
  const s2 = normalizeForComparison(str2);

  if (s1 === s2) return 1;

  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  const words1 = s1.split(" ");
  const words2 = s2.split(" ");
  const commonWords = words1.filter((w) => words2.includes(w));

  if (commonWords.length > 0) {
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  return 0;
}

function gradeTextField(submitted: string, correct: string, points: number): { score: number; needsReview: boolean } {
  const similarity = calculateSimilarity(submitted, correct);

  if (similarity >= 0.95) {
    return { score: points, needsReview: false };
  } else if (similarity >= 0.7) {
    return { score: points, needsReview: true };
  } else if (similarity >= 0.4) {
    return { score: 0, needsReview: true };
  } else {
    return { score: 0, needsReview: false };
  }
}

function gradeTextFieldWithAccepted(
  submitted: string,
  correctAnswer: string,
  acceptedAnswers: string[] | undefined,
  points: number
): { score: number; needsReview: boolean } {
  const allAccepted = [correctAnswer, ...(acceptedAnswers ?? [])];

  let bestResult = { score: 0, needsReview: false };
  let highestSimilarity = 0;

  for (const accepted of allAccepted) {
    const similarity = calculateSimilarity(submitted, accepted);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestResult = gradeTextField(submitted, accepted, points);
    }

    if (similarity >= 0.95) {
      return { score: points, needsReview: false };
    }
  }

  return bestResult;
}

export const autoGradeQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    const correctAnswer = question.correctAnswer;
    const isMultipleChoice = question.type === "multiple_choice";
    const isNumeric = question.type === "numeric";
    const hasMultipleFields = question.answerFields && question.answerFields.length > 0;

    for (const answer of answers) {
      let autoScore = 0;
      let needsReview = true;

      if (hasMultipleFields && answer.answers) {
        const fields = question.answerFields!;
        const pointsPerField = question.points / fields.length;
        let totalScore = 0;
        let anyNeedsReview = false;

        for (const field of fields) {
          const submittedValue = answer.answers[field.id] ?? "";
          const result = gradeTextFieldWithAccepted(
            submittedValue,
            field.correctAnswer,
            field.acceptedAnswers,
            pointsPerField
          );
          totalScore += result.score;
          if (result.needsReview) anyNeedsReview = true;
        }

        autoScore = Math.round(totalScore);
        needsReview = anyNeedsReview;
      } else if (isMultipleChoice) {
        const isCorrect =
          normalizeForComparison(answer.rawAnswer) ===
          normalizeForComparison(correctAnswer);
        autoScore = isCorrect ? question.points : 0;
        needsReview = false;
      } else if (isNumeric) {
        const submittedNum = parseFloat(answer.rawAnswer);
        const correctNum = parseFloat(correctAnswer);

        if (!isNaN(submittedNum) && !isNaN(correctNum)) {
          autoScore = submittedNum === correctNum ? question.points : 0;
          needsReview = false;
        }
      } else {
        const result = gradeTextFieldWithAccepted(
          answer.rawAnswer,
          correctAnswer,
          question.acceptedAnswers,
          question.points
        );
        autoScore = result.score;
        needsReview = result.needsReview;
      }

      await ctx.db.patch(answer._id, {
        autoScore,
        needsReview,
        finalScore: needsReview ? undefined : autoScore,
      });
    }

    return { gradedCount: answers.length };
  },
});

export const finalizeQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    for (const answer of answers) {
      const finalScore = answer.finalScore ?? answer.autoScore ?? 0;

      if (answer.finalScore === undefined) {
        await ctx.db.patch(answer._id, {
          finalScore,
          needsReview: false,
        });
      }

      const team = await ctx.db.get(answer.teamId);
      if (team) {
        await ctx.db.patch(answer.teamId, {
          totalScore: team.totalScore + finalScore,
        });
      }
    }

    return { finalizedCount: answers.length };
  },
});

export const getStandings = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const teams = await ctx.db
      .query("teams")
      .withIndex("by_gameId", (q) => q.eq("gameId", args.gameId))
      .collect();

    const sortedTeams = teams.sort((a, b) => b.totalScore - a.totalScore);

    return sortedTeams.map((team, index) => ({
      rank: index + 1,
      teamId: team._id,
      teamName: team.name,
      totalScore: team.totalScore,
    }));
  },
});

export const getNeedsReview = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const answers = await ctx.db
      .query("answers")
      .withIndex("by_questionId", (q) => q.eq("questionId", args.questionId))
      .collect();

    const needsReview = answers.filter((a) => a.needsReview);

    const answersWithTeams = await Promise.all(
      needsReview.map(async (answer) => {
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

