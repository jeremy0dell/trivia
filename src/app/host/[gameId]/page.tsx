"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HostControls } from "@/components/host/host-controls";
import { TeamList } from "@/components/host/team-list";
import { GradingPanel } from "@/components/host/grading-panel";
import { GameCodeDisplay } from "@/components/shared/game-code-display";
import { LoadingScreen } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, ClipboardCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default function HostDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.gameId as Id<"games">;
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("code");

  const gameState = useQuery(api.games.getGameState, { gameId });
  const teams = useQuery(api.teams.getTeamsForGame, { gameId });
  const currentQuestion = useQuery(api.questions.getCurrentQuestion, { gameId });

  if (!gameState) {
    return <LoadingScreen message="Loading game..." />;
  }

  const stateLabels = {
    lobby: "Waiting for players",
    in_round: "Round in progress",
    grading: "Grading answers",
    finished: "Game finished",
  };

  const stateColors = {
    lobby: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    in_round: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    grading: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    finished: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  const displayCode = joinCode || gameState.joinCode;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">Host Dashboard</h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={stateColors[gameState.state]}>
                  {stateLabels[gameState.state]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {teams?.length ?? 0} teams
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Game Code</p>
                <GameCodeDisplay code={displayCode} size="sm" />
              </div>
              <div className="flex flex-col gap-1">
                <Link
                  href={`/lobby/${displayCode}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Lobby View
                </Link>
                <Link
                  href={`/media/${displayCode}`}
                  target="_blank"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Media View
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="control" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="control" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Control</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Grading</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="control" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <HostControls
                gameId={gameId}
                gameState={gameState.state}
                currentRoundId={gameState.currentRoundId ?? null}
                currentQuestionIndex={gameState.currentQuestionIndex ?? null}
                totalQuestions={currentQuestion?.totalQuestions ?? 0}
                rounds={gameState.rounds}
              />
              {currentQuestion && (
                <CurrentQuestionCard question={currentQuestion} />
              )}
            </div>
            <TeamList
              gameId={gameId}
              showSubmissionStatus={gameState.state === "in_round"}
            />
          </TabsContent>

          <TabsContent value="teams">
            <TeamList gameId={gameId} showSubmissionStatus={false} />
          </TabsContent>

          <TabsContent value="grading">
            <GradingPanel
              currentRoundId={gameState.currentRoundId ?? null}
              currentQuestionIndex={gameState.currentQuestionIndex ?? null}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

interface CurrentQuestionCardProps {
  question: {
    prompt: string;
    type: string;
    options?: string[];
    roundTitle: string;
    roundNumber: number;
    questionNumber: number;
    totalQuestions: number;
  };
}

function CurrentQuestionCard({ question }: CurrentQuestionCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          Round {question.roundNumber}: {question.roundTitle}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Q{question.questionNumber}/{question.totalQuestions}
        </span>
      </div>
      <p className="font-medium">{question.prompt}</p>
      {question.options && (
        <div className="grid grid-cols-2 gap-2">
          {question.options.map((opt, i) => (
            <div
              key={i}
              className="text-sm p-2 rounded bg-muted/50"
            >
              {String.fromCharCode(65 + i)}. {opt}
            </div>
          ))}
        </div>
      )}
      <Badge variant="secondary" className="text-xs">
        {question.type.replace("_", " ")}
      </Badge>
    </div>
  );
}

