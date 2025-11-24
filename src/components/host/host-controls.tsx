"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  Trophy,
  ChevronRight,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type GameState = "lobby" | "in_round" | "grading" | "finished";

interface HostControlsProps {
  gameId: Id<"games">;
  gameState: GameState;
  currentRoundId: Id<"rounds"> | null;
  currentQuestionIndex: number | null;
  totalQuestions: number;
  rounds: Array<{ _id: Id<"rounds">; title: string; roundNumber: number }>;
}

export function HostControls({
  gameId,
  gameState,
  currentRoundId,
  currentQuestionIndex,
  totalQuestions,
  rounds,
}: HostControlsProps) {
  const updateState = useMutation(api.games.updateState);
  const startRound = useMutation(api.games.startRound);
  const advanceQuestion = useMutation(api.games.advanceQuestion);
  const advanceRound = useMutation(api.games.advanceRound);
  const autoGrade = useMutation(api.scoring.autoGradeQuestion);
  const finalizeQuestion = useMutation(api.scoring.finalizeQuestion);

  const currentRound = rounds.find((r) => r._id === currentRoundId);
  const isLastQuestion =
    currentQuestionIndex !== null && currentQuestionIndex >= totalQuestions - 1;
  const currentRoundIndex = currentRound
    ? rounds.findIndex((r) => r._id === currentRound._id)
    : -1;
  const isLastRound = currentRoundIndex === rounds.length - 1;

  const handleStartGame = async () => {
    if (rounds.length > 0) {
      await startRound({ gameId, roundId: rounds[0]._id });
    }
  };

  const handleCloseSubmissions = async () => {
    await updateState({ gameId, state: "grading" });
  };

  const handleAutoGrade = async (questionId: Id<"questions">) => {
    await autoGrade({ questionId });
  };

  const handleFinalizeAndAdvance = async (questionId: Id<"questions">) => {
    await finalizeQuestion({ questionId });

    if (isLastQuestion) {
      if (isLastRound) {
        await updateState({ gameId, state: "finished" });
      } else {
        await advanceRound({ gameId });
      }
    } else {
      await advanceQuestion({ gameId });
    }
  };

  const handleEndGame = async () => {
    await updateState({ gameId, state: "finished" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "lobby" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Waiting for teams to join. Start when ready.
            </p>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartGame}
              disabled={rounds.length === 0}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        )}

        {gameState === "in_round" && (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">
                Round {currentRound?.roundNumber}: {currentRound?.title}
              </p>
              <p className="text-sm text-muted-foreground">
                Question {(currentQuestionIndex ?? 0) + 1} of {totalQuestions}
              </p>
            </div>
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleCloseSubmissions}
            >
              <Pause className="w-4 h-4 mr-2" />
              Close Submissions & Grade
            </Button>
          </div>
        )}

        {gameState === "grading" && currentRoundId && currentQuestionIndex !== null && (
          <GradingControls
            gameId={gameId}
            currentRoundId={currentRoundId}
            currentQuestionIndex={currentQuestionIndex}
            isLastQuestion={isLastQuestion}
            isLastRound={isLastRound}
            onAutoGrade={handleAutoGrade}
            onFinalizeAndAdvance={handleFinalizeAndAdvance}
          />
        )}

        {gameState === "finished" && (
          <div className="text-center space-y-3">
            <Trophy className="w-12 h-12 text-accent mx-auto" />
            <p className="font-medium">Game Complete!</p>
            <p className="text-sm text-muted-foreground">
              Final standings are now displayed.
            </p>
          </div>
        )}

        {gameState !== "finished" && gameState !== "lobby" && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleEndGame}
          >
            End Game Early
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface GradingControlsProps {
  gameId: Id<"games">;
  currentRoundId: Id<"rounds">;
  currentQuestionIndex: number;
  isLastQuestion: boolean;
  isLastRound: boolean;
  onAutoGrade: (questionId: Id<"questions">) => Promise<void>;
  onFinalizeAndAdvance: (questionId: Id<"questions">) => Promise<void>;
}

import { useQuery } from "convex/react";

function GradingControls({
  currentRoundId,
  currentQuestionIndex,
  isLastQuestion,
  isLastRound,
  onAutoGrade,
  onFinalizeAndAdvance,
}: GradingControlsProps) {
  const questions = useQuery(api.questions.getQuestionsForRound, {
    roundId: currentRoundId,
  });

  const currentQuestion = questions?.find(
    (q) => q.indexInRound === currentQuestionIndex
  );

  if (!currentQuestion) {
    return <p className="text-sm text-muted-foreground">Loading question...</p>;
  }

  const nextLabel = isLastQuestion
    ? isLastRound
      ? "Finish Game"
      : "Next Round"
    : "Next Question";

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Review answers and finalize scores.
      </p>
      <Button
        className="w-full"
        variant="secondary"
        onClick={() => onAutoGrade(currentQuestion._id)}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Auto-Grade Answers
      </Button>
      <Button
        className="w-full"
        onClick={() => onFinalizeAndAdvance(currentQuestion._id)}
      >
        {isLastQuestion && isLastRound ? (
          <Trophy className="w-4 h-4 mr-2" />
        ) : (
          <SkipForward className="w-4 h-4 mr-2" />
        )}
        Finalize & {nextLabel}
        {!isLastQuestion && !isLastRound && <ChevronRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  );
}

