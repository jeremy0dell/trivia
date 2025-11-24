"use client";

import { Clock, Trophy, Hourglass, Music } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

type WaitingState = "lobby" | "grading" | "between_questions" | "between_rounds";

interface WaitingScreenProps {
  state: WaitingState;
  teamName?: string;
  gameCode?: string;
  message?: string;
}

export function WaitingScreen({
  state,
  teamName,
  gameCode,
  message,
}: WaitingScreenProps) {
  const content = {
    lobby: {
      icon: <Clock className="w-12 h-12 text-primary" />,
      title: "Waiting for game to start",
      subtitle: teamName
        ? `You're in as "${teamName}"`
        : "The host will start the game soon",
      showSpinner: true,
    },
    grading: {
      icon: <Hourglass className="w-12 h-12 text-amber-500" />,
      title: "Answers are being graded",
      subtitle: "Results coming soon...",
      showSpinner: true,
    },
    between_questions: {
      icon: <Music className="w-12 h-12 text-primary" />,
      title: "Get ready!",
      subtitle: "Next question coming up...",
      showSpinner: true,
    },
    between_rounds: {
      icon: <Trophy className="w-12 h-12 text-accent" />,
      title: "Round complete!",
      subtitle: "Preparing next round...",
      showSpinner: true,
    },
  };

  const { icon, title, subtitle, showSpinner } = content[state];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center animate-pulse">
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{message || subtitle}</p>
        </div>

        {showSpinner && (
          <div className="flex justify-center pt-4">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {state === "lobby" && gameCode && (
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-2">Game code</p>
            <p className="font-mono text-xl tracking-widest font-bold">
              {gameCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

