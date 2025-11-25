"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, TrendingUp } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface BetweenRoundsPlayerViewProps {
  gameId: Id<"games">;
  team: {
    _id: Id<"teams">;
    name: string;
    totalScore: number;
  };
}

/**
 * Player view displayed between rounds, showing team's round performance
 * and waiting state for the next round.
 */
export function BetweenRoundsPlayerView({
  gameId,
  team,
}: BetweenRoundsPlayerViewProps) {
  const roundSummary = useQuery(api.scoring.getCompletedRoundSummary, {
    gameId,
  });
  const standings = useQuery(api.scoring.getStandings, { gameId });

  if (!roundSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const teamScore = roundSummary.teamScores.find((t) => t.teamId === team._id);
  const roundScore = teamScore?.roundScore ?? 0;
  const currentRank = standings?.findIndex((s) => s.teamId === team._id) ?? -1;
  const rank = currentRank >= 0 ? currentRank + 1 : null;

  return (
    <div className="space-y-6">
      {/* Round Complete Header */}
      <Card className="bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
        <CardContent className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
            <Trophy className="w-8 h-8 text-accent" />
          </div>
          <h2 className="text-2xl font-bold">Round {roundSummary.currentRound.roundNumber} Complete</h2>
          <p className="text-muted-foreground mt-1">{roundSummary.currentRound.title}</p>
        </CardContent>
      </Card>

      {/* Team's Round Performance */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">This Round</p>
              <p className="text-2xl font-bold text-green-500">+{roundScore}</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <Trophy className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Total Score</p>
              <p className="text-2xl font-bold">{team.totalScore}</p>
            </div>
          </div>

          {rank && (
            <div className="text-center py-3 border-t">
              <p className="text-sm text-muted-foreground">Current Position</p>
              <Badge variant="outline" className="mt-1 text-lg px-4 py-1">
                {getOrdinal(rank)} Place
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Waiting State */}
      <Card className="bg-muted/20">
        <CardContent className="pt-6 text-center space-y-3">
          <Clock className="w-8 h-8 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">
            Waiting for host to start the next round...
          </p>
          {roundSummary.nextRound && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Up Next</p>
              <p className="font-medium mt-1">
                Round {roundSummary.nextRound.roundNumber}: {roundSummary.nextRound.title}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

