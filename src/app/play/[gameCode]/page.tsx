"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { QuestionDisplay } from "@/components/game/question-display";
import { AnswerInput } from "@/components/game/answer-input";
import { MultipleChoice } from "@/components/game/multiple-choice";
import { MultiAnswerInput } from "@/components/game/multi-answer-input";
import { SubmissionStatus } from "@/components/game/submission-status";
import { WaitingScreen } from "@/components/game/waiting-screen";
import { LoadingScreen } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import type { Id } from "../../../../convex/_generated/dataModel";

interface PageProps {
  params: Promise<{ gameCode: string }>;
}

export default function PlayerGamePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { gameCode } = resolvedParams;
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") as Id<"teams"> | null;

  const [isEditing, setIsEditing] = useState(false);

  const game = useQuery(api.games.getByJoinCode, { joinCode: gameCode });
  const gameState = useQuery(
    api.games.getGameState,
    game ? { gameId: game._id } : "skip"
  );
  const team = useQuery(
    api.teams.getById,
    teamId ? { teamId } : "skip"
  );
  const currentQuestion = useQuery(
    api.questions.getCurrentQuestion,
    game ? { gameId: game._id } : "skip"
  );
  const submissionStatus = useQuery(
    api.answers.getSubmissionStatus,
    currentQuestion && teamId
      ? { questionId: currentQuestion._id, teamId }
      : "skip"
  );
  const standings = useQuery(
    api.scoring.getStandings,
    game ? { gameId: game._id } : "skip"
  );
  const teamHistory = useQuery(
    api.answers.getTeamHistory,
    teamId ? { teamId } : "skip"
  );

  const submitAnswer = useMutation(api.answers.submit);

  if (!game || !gameState || !team) {
    return <LoadingScreen message="Loading game..." />;
  }

  const handleSubmitAnswer = async (answer: string) => {
    if (!currentQuestion || !teamId) return;

    await submitAnswer({
      questionId: currentQuestion._id,
      teamId,
      rawAnswer: answer,
    });
    setIsEditing(false);
  };

  const handleSubmitMultipleAnswers = async (answers: Record<string, string>) => {
    if (!currentQuestion || !teamId) return;

    await submitAnswer({
      questionId: currentQuestion._id,
      teamId,
      answers,
    });
    setIsEditing(false);
  };

  if (gameState.state === "finished") {
    return (
      <GameFinishedView
        team={team}
        standings={standings ?? []}
        history={teamHistory ?? []}
      />
    );
  }

  if (gameState.state === "lobby") {
    return (
      <PlayerLayout teamName={team.name} score={team.totalScore}>
        <WaitingScreen
          state="lobby"
          teamName={team.name}
          gameCode={gameCode}
        />
      </PlayerLayout>
    );
  }

  if (gameState.state === "grading") {
    return (
      <PlayerLayout teamName={team.name} score={team.totalScore}>
        <WaitingScreen state="grading" />
      </PlayerLayout>
    );
  }

  if (!currentQuestion) {
    return (
      <PlayerLayout teamName={team.name} score={team.totalScore}>
        <WaitingScreen state="between_questions" />
      </PlayerLayout>
    );
  }

  const hasSubmitted = submissionStatus?.hasSubmitted && !isEditing;
  const hasMultipleFields = currentQuestion.answerFields && currentQuestion.answerFields.length > 0;

  const getDisplayAnswer = () => {
    if (hasMultipleFields && submissionStatus?.answers) {
      return Object.entries(submissionStatus.answers)
        .map(([key, value]) => {
          const field = currentQuestion.answerFields?.find((f) => f.id === key);
          return `${field?.label ?? key}: ${value}`;
        })
        .join("\n");
    }
    return submissionStatus?.answer ?? "";
  };

  return (
    <PlayerLayout teamName={team.name} score={team.totalScore}>
      <div className="space-y-6">
        <QuestionDisplay question={currentQuestion} />

        {hasSubmitted ? (
          <SubmissionStatus
            answer={getDisplayAnswer()}
            onEdit={() => setIsEditing(true)}
            canEdit={true}
          />
        ) : hasMultipleFields ? (
          <MultiAnswerInput
            fields={currentQuestion.answerFields!}
            onSubmit={handleSubmitMultipleAnswers}
          />
        ) : currentQuestion.type === "multiple_choice" && currentQuestion.options ? (
          <MultipleChoice
            options={currentQuestion.options}
            onSubmit={handleSubmitAnswer}
          />
        ) : (
          <AnswerInput
            onSubmit={handleSubmitAnswer}
            placeholder={
              currentQuestion.type === "numeric"
                ? "Enter a number..."
                : "Type your answer..."
            }
          />
        )}
      </div>
    </PlayerLayout>
  );
}

function PlayerLayout({
  children,
  teamName,
  score,
}: {
  children: React.ReactNode;
  teamName: string;
  score: number;
}) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">{teamName}</p>
            <p className="text-xs text-muted-foreground">Playing now</p>
          </div>
          <Badge variant="secondary" className="font-mono text-base px-3 py-1">
            {score} pts
          </Badge>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-6">{children}</div>
    </main>
  );
}

interface StandingEntry {
  rank: number;
  teamId: Id<"teams">;
  teamName: string;
  totalScore: number;
}

interface HistoryEntry {
  questionPrompt: string;
  rawAnswer: string;
  correctAnswer: string;
  finalScore?: number;
  points: number;
}

function GameFinishedView({
  team,
  standings,
  history,
}: {
  team: { _id: Id<"teams">; name: string; totalScore: number };
  standings: StandingEntry[];
  history: HistoryEntry[];
}) {
  const myRank = standings.find((s) => s.teamId === team._id)?.rank ?? 0;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return null;
    }
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getRankIcon(myRank) || (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {myRank}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Game Over!</h1>
            <p className="text-lg text-muted-foreground mt-1">
              {team.name} finished in{" "}
              <span className="font-semibold text-primary">
                {getOrdinal(myRank)} place
              </span>
            </p>
          </div>
          <div className="bg-card border rounded-xl p-6 inline-block">
            <p className="text-sm text-muted-foreground">Final Score</p>
            <p className="text-4xl font-bold text-primary">{team.totalScore}</p>
            <p className="text-sm text-muted-foreground">points</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Final Standings</h2>
          <div className="bg-card border rounded-xl divide-y">
            {standings.slice(0, 10).map((entry) => (
              <div
                key={entry.teamId}
                className={`flex items-center justify-between p-4 ${
                  entry.teamId === team._id ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      entry.rank <= 3
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span className="font-medium">
                    {entry.teamName}
                    {entry.teamId === team._id && (
                      <span className="text-xs text-primary ml-2">(You)</span>
                    )}
                  </span>
                </div>
                <Badge variant="outline" className="font-mono">
                  {entry.totalScore} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {history.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Answers</h2>
            <div className="space-y-3">
              {history.map((entry, i) => (
                <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
                  <p className="font-medium text-sm">{entry.questionPrompt}</p>
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your answer:</span>
                      <span className="font-mono">{entry.rawAnswer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Correct:</span>
                      <span className="font-mono text-primary">
                        {entry.correctAnswer}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="text-muted-foreground">Points:</span>
                      <Badge
                        variant={
                          (entry.finalScore ?? 0) > 0 ? "default" : "secondary"
                        }
                      >
                        {entry.finalScore ?? 0} / {entry.points}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

