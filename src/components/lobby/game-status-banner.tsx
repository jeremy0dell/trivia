"use client";

import { Music, Clock, Trophy, Hourglass } from "lucide-react";

type GameState = "lobby" | "in_round" | "grading" | "finished";

interface GameStatusBannerProps {
  state: GameState;
  roundNumber?: number;
  roundTitle?: string;
  questionNumber?: number;
  totalQuestions?: number;
  joinCode?: string;
}

export function GameStatusBanner({
  state,
  roundNumber,
  roundTitle,
  questionNumber,
  totalQuestions,
  joinCode,
}: GameStatusBannerProps) {
  const content = {
    lobby: {
      icon: <Clock className="w-8 h-8" />,
      title: "Waiting for Players",
      subtitle: joinCode ? `Join with code: ${joinCode}` : "Game starting soon",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    in_round: {
      icon: <Music className="w-8 h-8" />,
      title: roundTitle ? `Round ${roundNumber}: ${roundTitle}` : "Round in Progress",
      subtitle:
        questionNumber && totalQuestions
          ? `Question ${questionNumber} of ${totalQuestions}`
          : "Answer now!",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    grading: {
      icon: <Hourglass className="w-8 h-8" />,
      title: "Grading in Progress",
      subtitle: "Scores updating soon...",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    finished: {
      icon: <Trophy className="w-8 h-8" />,
      title: "Game Complete!",
      subtitle: "Final Standings",
      color: "bg-primary/10 text-primary",
    },
  };

  const { icon, title, subtitle, color } = content[state];

  return (
    <div className={`rounded-2xl p-6 ${color}`}>
      <div className="flex items-center justify-center gap-4">
        <div className="shrink-0">{icon}</div>
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">{title}</h2>
          <p className="text-lg opacity-80">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

