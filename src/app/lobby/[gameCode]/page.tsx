"use client";

import { use } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GameStatusBanner } from "@/components/lobby/game-status-banner";
import { Scoreboard } from "@/components/lobby/scoreboard";
import { TeamJoinList } from "@/components/lobby/team-join-list";
import { BetweenRoundsLobbyView } from "@/components/lobby/between-rounds-lobby-view";
import { GameCodeDisplay } from "@/components/shared/game-code-display";
import { LoadingScreen } from "@/components/shared/loading-spinner";
import { Music } from "lucide-react";

interface PageProps {
  params: Promise<{ gameCode: string }>;
}

export default function LobbyPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { gameCode } = resolvedParams;

  const game = useQuery(api.games.getByJoinCode, { joinCode: gameCode });
  const gameState = useQuery(
    api.games.getGameState,
    game ? { gameId: game._id } : "skip"
  );
  const currentQuestion = useQuery(
    api.questions.getCurrentQuestion,
    game ? { gameId: game._id } : "skip"
  );

  if (!game || !gameState) {
    return <LoadingScreen message="Loading lobby..." />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        <header className="p-6 sm:p-8">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">Classical Music Trivia</span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Join at</p>
              <GameCodeDisplay code={gameCode} size="md" />
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 py-8">
          <div className="max-w-4xl mx-auto w-full space-y-8">
            <GameStatusBanner
              state={gameState.state}
              roundNumber={gameState.currentRound?.roundNumber}
              roundTitle={gameState.currentRound?.title}
              questionNumber={currentQuestion?.questionNumber}
              totalQuestions={currentQuestion?.totalQuestions}
              joinCode={gameCode}
            />

            {gameState.state === "lobby" ? (
              <TeamJoinList gameId={game._id} />
            ) : gameState.state === "between_rounds" ? (
              <BetweenRoundsLobbyView gameId={game._id} />
            ) : (
              <>
                {currentQuestion?.mediaUrl && gameState.state === "in_round" && (
                  <QuestionMediaDisplay
                    mediaUrl={currentQuestion.mediaUrl}
                    mediaType={currentQuestion.mediaType}
                    prompt={currentQuestion.prompt}
                  />
                )}
                <Scoreboard gameId={game._id} maxTeams={8} />
              </>
            )}

            {gameState.state === "in_round" && (
              <SubmissionProgress gameId={game._id} />
            )}
          </div>
        </div>

        <footer className="p-6 text-center text-sm text-muted-foreground">
          Powered by Convex • Real-time updates
        </footer>
      </div>
    </main>
  );
}

import type { Id } from "../../../../convex/_generated/dataModel";

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string): string {
  if (url.includes("/embed/")) return url;
  
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0] ?? "";
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

interface QuestionMediaDisplayProps {
  mediaUrl: string;
  mediaType?: string;
  prompt?: string;
}

function QuestionMediaDisplay({ mediaUrl, mediaType, prompt }: QuestionMediaDisplayProps) {
  return (
    <div className="bg-card border rounded-2xl p-6 space-y-4">
      {prompt && (
        <p className="text-xl font-semibold text-center">{prompt}</p>
      )}
      
      {mediaType === "image" && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          <Image
            src={mediaUrl}
            alt="Question media"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
      
      {mediaType === "video" && isYouTubeUrl(mediaUrl) && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={getYouTubeEmbedUrl(mediaUrl)}
            title="Video question"
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      
      {mediaType === "video" && !isYouTubeUrl(mediaUrl) && (
        <video src={mediaUrl} controls className="w-full rounded-xl" />
      )}
      
      {mediaType === "audio" && (
        <div className="flex items-center justify-center gap-4 p-6 bg-muted rounded-xl">
          <Music className="w-12 h-12 text-primary" />
          <audio src={mediaUrl} controls className="flex-1 max-w-md" />
        </div>
      )}
    </div>
  );
}

function SubmissionProgress({ gameId }: { gameId: Id<"games"> }) {
  const status = useQuery(api.answers.getSubmissionStatusForGame, { gameId });

  if (!status || status.totalTeams === 0) return null;

  const percentage = Math.round(
    (status.submittedCount / status.totalTeams) * 100
  );

  return (
    <div className="bg-card border rounded-xl p-6 text-center">
      <p className="text-lg text-muted-foreground mb-3">Answers Submitted</p>
      <div className="flex items-center justify-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${percentage * 2.51} 251`}
              className="text-primary transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{percentage}%</span>
          </div>
        </div>
        <div className="text-left">
          <p className="text-3xl font-bold">
            {status.submittedCount} / {status.totalTeams}
          </p>
          <p className="text-muted-foreground">teams answered</p>
        </div>
      </div>
    </div>
  );
}

