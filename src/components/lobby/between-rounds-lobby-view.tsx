"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Clock, Crown } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface BetweenRoundsLobbyViewProps {
  gameId: Id<"games">;
}

/**
 * Big screen/lobby view displayed between rounds, showing full scoreboard
 * with round scores and next round info.
 */
export function BetweenRoundsLobbyView({ gameId }: BetweenRoundsLobbyViewProps) {
  const roundSummary = useQuery(api.scoring.getCompletedRoundSummary, {
    gameId,
  });

  if (!roundSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Round Complete Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/20 animate-pulse">
          <Trophy className="w-10 h-10 text-accent" />
        </div>
        <div>
          <h2 className="text-4xl font-bold">
            Round {roundSummary.currentRound.roundNumber} Complete
          </h2>
          <p className="text-xl text-muted-foreground mt-2">
            {roundSummary.currentRound.title}
          </p>
        </div>
      </div>

      {/* Top Scorer This Round */}
      {roundSummary.topScorerThisRound && (
        <Card className="bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30">
          <CardContent className="py-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Crown className="w-6 h-6 text-yellow-500" />
              <span className="text-lg">Top Scorer This Round:</span>
              <span className="text-xl font-bold">
                {roundSummary.topScorerThisRound.teamName}
              </span>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                +{roundSummary.topScorerThisRound.roundScore} pts
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Scoreboard */}
      <Card className="bg-card/80 backdrop-blur">
        <CardContent className="py-6">
          <h3 className="text-lg font-semibold text-center mb-6 text-muted-foreground">
            Standings After Round {roundSummary.currentRound.roundNumber}
          </h3>
          <div className="space-y-3">
            {roundSummary.teamScores.map((team, index) => (
              <div
                key={team.teamId}
                className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30"
                    : index === 1
                      ? "bg-gradient-to-r from-slate-400/20 to-slate-400/10 border border-slate-400/30"
                      : index === 2
                        ? "bg-gradient-to-r from-amber-600/20 to-amber-600/10 border border-amber-600/30"
                        : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                      index === 0
                        ? "bg-yellow-500 text-yellow-950"
                        : index === 1
                          ? "bg-slate-400 text-slate-950"
                          : index === 2
                            ? "bg-amber-600 text-amber-950"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className="text-xl font-semibold">{team.teamName}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-400/30 font-mono"
                    >
                      +{team.roundScore}
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold min-w-[80px] text-right">
                    {team.totalScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Round Info */}
      <Card className="bg-muted/20 border-dashed">
        <CardContent className="py-8 text-center space-y-4">
          <Clock className="w-10 h-10 mx-auto text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground text-lg">
            Waiting for host to start the next round...
          </p>
          {roundSummary.nextRound && (
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                Coming Up Next
              </p>
              <p className="text-2xl font-bold mt-2">
                Round {roundSummary.nextRound.roundNumber}:{" "}
                {roundSummary.nextRound.title}
              </p>
            </div>
          )}
          {!roundSummary.nextRound && (
            <p className="text-sm text-muted-foreground">
              This was the final round!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

