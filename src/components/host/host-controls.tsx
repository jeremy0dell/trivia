"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle,
  Trophy,
  ChevronRight,
  Lock,
  Unlock,
  Trash2,
  Users,
  Clock,
} from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type GameState = "lobby" | "in_round" | "grading" | "between_rounds" | "finished";

interface HostControlsProps {
  gameId: Id<"games">;
  gameState: GameState;
  currentRoundId: Id<"rounds"> | null;
  currentQuestionIndex: number | null;
  totalQuestions: number;
  rounds: Array<{ _id: Id<"rounds">; title: string; roundNumber: number }>;
  isLobbyLocked?: boolean;
  maxTeams?: number;
  teamCount?: number;
}

export function HostControls({
  gameId,
  gameState,
  currentRoundId,
  currentQuestionIndex,
  totalQuestions,
  rounds,
  isLobbyLocked = false,
  maxTeams = 20,
  teamCount = 0,
}: HostControlsProps) {
  const updateState = useMutation(api.games.updateState);
  const startRound = useMutation(api.games.startRound);
  const advanceQuestion = useMutation(api.games.advanceQuestion);
  const goToBetweenRounds = useMutation(api.games.goToBetweenRounds);
  const startNextRound = useMutation(api.games.startNextRound);
  const autoGrade = useMutation(api.scoring.autoGradeQuestion);
  const finalizeQuestion = useMutation(api.scoring.finalizeQuestion);
  const toggleLobbyLock = useMutation(api.games.toggleLobbyLock);
  const clearAllTeams = useMutation(api.teams.clearAllTeams);
  const endGame = useMutation(api.games.endGame);

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

  const handleToggleLock = async () => {
    await toggleLobbyLock({ gameId });
  };

  const handleClearAllTeams = async () => {
    if (confirm("Are you sure you want to remove all teams?")) {
      await clearAllTeams({ gameId });
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
      // Go to between_rounds (or finished if it's the last round)
      await goToBetweenRounds({ gameId });
    } else {
      await advanceQuestion({ gameId });
    }
  };

  const handleStartNextRound = async () => {
    await startNextRound({ gameId });
  };

  const handleEndGame = async () => {
    await endGame({ gameId });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "lobby" && (
          <div className="space-y-4">
            {/* Team count */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Teams Joined</span>
              </div>
              <Badge variant="secondary" className="font-mono">
                {teamCount} / {maxTeams}
              </Badge>
            </div>

            {/* Lobby controls */}
            <div className="flex gap-2">
              <Button
                variant={isLobbyLocked ? "default" : "outline"}
                className={`flex-1 ${isLobbyLocked ? "bg-red-500 hover:bg-red-600" : ""}`}
                onClick={handleToggleLock}
              >
                {isLobbyLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Lobby Locked
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 mr-2" />
                    Lock Lobby
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                onClick={handleClearAllTeams}
                disabled={teamCount === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLobbyLocked
                ? "Lobby is locked. No new teams can join."
                : "Waiting for teams to join. Start when ready."}
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

        {gameState === "between_rounds" && currentRoundId && (
          <BetweenRoundsControls
            gameId={gameId}
            currentRoundId={currentRoundId}
            rounds={rounds}
            isLastRound={isLastRound}
            onStartNextRound={handleStartNextRound}
            onEndGame={handleEndGame}
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
      : "Round Break"
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
        ) : isLastQuestion ? (
          <Clock className="w-4 h-4 mr-2" />
        ) : (
          <SkipForward className="w-4 h-4 mr-2" />
        )}
        Finalize & {nextLabel}
        {!isLastQuestion && <ChevronRight className="w-4 h-4 ml-1" />}
      </Button>
    </div>
  );
}

interface BetweenRoundsControlsProps {
  gameId: Id<"games">;
  currentRoundId: Id<"rounds">;
  rounds: Array<{ _id: Id<"rounds">; title: string; roundNumber: number }>;
  isLastRound: boolean;
  onStartNextRound: () => Promise<void>;
  onEndGame: () => Promise<void>;
}

function BetweenRoundsControls({
  gameId,
  currentRoundId,
  rounds,
  isLastRound,
  onStartNextRound,
  onEndGame,
}: BetweenRoundsControlsProps) {
  const roundSummary = useQuery(api.scoring.getCompletedRoundSummary, {
    gameId,
  });

  const currentRound = rounds.find((r) => r._id === currentRoundId);
  const currentRoundIndex = rounds.findIndex((r) => r._id === currentRoundId);
  const nextRound = !isLastRound ? rounds[currentRoundIndex + 1] : null;

  if (!roundSummary) {
    return <p className="text-sm text-muted-foreground">Loading round summary...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Round Complete Header */}
      <div className="bg-accent/10 rounded-lg p-4 text-center">
        <h3 className="text-lg font-bold text-accent">Round {currentRound?.roundNumber} Complete</h3>
        <p className="text-sm text-muted-foreground">{currentRound?.title}</p>
      </div>

      {/* Round Scores */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Round Scores</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {roundSummary.teamScores.map((team, index) => (
            <div
              key={team.teamId}
              className="flex items-center justify-between bg-muted/30 rounded px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground w-5">
                  {index + 1}.
                </span>
                <span className="text-sm font-medium">{team.teamName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  +{team.roundScore}
                </Badge>
                <span className="text-sm font-bold">{team.totalScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Scorer */}
      {roundSummary.topScorerThisRound && (
        <div className="text-center text-sm text-muted-foreground">
          <Trophy className="w-4 h-4 inline mr-1 text-yellow-500" />
          Top scorer: <span className="font-medium">{roundSummary.topScorerThisRound.teamName}</span>
          {" "}with {roundSummary.topScorerThisRound.roundScore} pts
        </div>
      )}

      {/* Actions */}
      {isLastRound ? (
        <Button className="w-full" size="lg" onClick={onEndGame}>
          <Trophy className="w-4 h-4 mr-2" />
          End Game & Show Results
        </Button>
      ) : (
        <Button className="w-full" size="lg" onClick={onStartNextRound}>
          <Play className="w-4 h-4 mr-2" />
          Start Round {nextRound?.roundNumber} - {nextRound?.title}
        </Button>
      )}
    </div>
  );
}

