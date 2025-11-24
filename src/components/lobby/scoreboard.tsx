"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Trophy, Medal, Award } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface ScoreboardProps {
  gameId: Id<"games">;
  maxTeams?: number;
}

export function Scoreboard({ gameId, maxTeams = 10 }: ScoreboardProps) {
  const standings = useQuery(api.scoring.getStandings, { gameId });

  if (!standings) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading standings...
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No teams yet
      </div>
    );
  }

  const displayTeams = standings.slice(0, maxTeams);

  return (
    <div className="space-y-3">
      {displayTeams.map((team, index) => (
        <ScoreboardRow
          key={team.teamId}
          rank={team.rank}
          name={team.teamName}
          score={team.totalScore}
          isTop3={index < 3}
          animationDelay={index * 50}
        />
      ))}
      {standings.length > maxTeams && (
        <p className="text-center text-muted-foreground text-sm pt-2">
          +{standings.length - maxTeams} more teams
        </p>
      )}
    </div>
  );
}

interface ScoreboardRowProps {
  rank: number;
  name: string;
  score: number;
  isTop3: boolean;
  animationDelay: number;
}

function ScoreboardRow({
  rank,
  name,
  score,
  isTop3,
  animationDelay,
}: ScoreboardRowProps) {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const rankBgColor = isTop3
    ? rank === 1
      ? "bg-yellow-500/20 border-yellow-500/30"
      : rank === 2
        ? "bg-gray-400/20 border-gray-400/30"
        : "bg-amber-600/20 border-amber-600/30"
    : "bg-card border-border";

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border-2 ${rankBgColor} transition-all duration-300`}
      style={{
        animationDelay: `${animationDelay}ms`,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-background/80 flex items-center justify-center">
          {getRankIcon() || (
            <span className="text-xl font-bold text-muted-foreground">
              {rank}
            </span>
          )}
        </div>
        <span
          className={`text-xl font-semibold ${isTop3 ? "text-foreground" : "text-muted-foreground"}`}
        >
          {name}
        </span>
      </div>
      <div className="text-right">
        <span className="text-3xl font-bold font-mono">{score}</span>
        <span className="text-sm text-muted-foreground ml-1">pts</span>
      </div>
    </div>
  );
}

