"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface GradingPanelProps {
  currentRoundId: Id<"rounds"> | null;
  currentQuestionIndex: number | null;
}

export function GradingPanel({
  currentRoundId,
  currentQuestionIndex,
}: GradingPanelProps) {
  const questions = useQuery(
    api.questions.getQuestionsForRound,
    currentRoundId ? { roundId: currentRoundId } : "skip"
  );

  const currentQuestion = questions?.find(
    (q) => q.indexInRound === currentQuestionIndex
  );

  const answers = useQuery(
    api.answers.getAnswersForQuestion,
    currentQuestion ? { questionId: currentQuestion._id } : "skip"
  );

  const updateScore = useMutation(api.answers.updateScore);

  if (!currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Grading</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No question selected</p>
        </CardContent>
      </Card>
    );
  }

  const handleScore = async (answerId: Id<"answers">, score: number) => {
    await updateScore({ answerId, finalScore: score });
  };

  const needsReview = answers?.filter((a) => a.needsReview) ?? [];
  const reviewed = answers?.filter((a) => !a.needsReview) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Answer Review</CardTitle>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{currentQuestion.prompt}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Correct answer:{" "}
            <span className="font-mono text-primary">
              {currentQuestion.correctAnswer}
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsReview.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Needs Review ({needsReview.length})
            </div>
            {needsReview.map((answer) => (
              <AnswerReviewCard
                key={answer._id}
                answer={answer}
                maxPoints={currentQuestion.points}
                onScore={handleScore}
              />
            ))}
          </div>
        )}

        {reviewed.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Reviewed ({reviewed.length})
            </p>
            {reviewed.map((answer) => (
              <AnswerReviewCard
                key={answer._id}
                answer={answer}
                maxPoints={currentQuestion.points}
                onScore={handleScore}
                isReviewed
              />
            ))}
          </div>
        )}

        {(!answers || answers.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No answers submitted yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AnswerReviewCardProps {
  answer: {
    _id: Id<"answers">;
    teamName: string;
    rawAnswer: string;
    autoScore?: number;
    finalScore?: number;
    needsReview: boolean;
  };
  maxPoints: number;
  onScore: (answerId: Id<"answers">, score: number) => Promise<void>;
  isReviewed?: boolean;
}

function AnswerReviewCard({
  answer,
  maxPoints,
  onScore,
  isReviewed,
}: AnswerReviewCardProps) {
  const displayScore = answer.finalScore ?? answer.autoScore;
  const isCorrect = displayScore !== undefined && displayScore > 0;

  return (
    <div
      className={`p-3 rounded-lg border ${
        isReviewed
          ? isCorrect
            ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
            : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{answer.teamName}</p>
          <p className="text-sm mt-1 font-mono break-words">{answer.rawAnswer}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isReviewed ? (
            <Badge variant={isCorrect ? "default" : "secondary"}>
              {displayScore} / {maxPoints}
            </Badge>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => onScore(answer._id, maxPoints)}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onScore(answer._id, 0)}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

