"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Check, Clock } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface TeamListProps {
  gameId: Id<"games">;
  showSubmissionStatus?: boolean;
}

export function TeamList({ gameId, showSubmissionStatus = true }: TeamListProps) {
  const teams = useQuery(api.teams.getTeamsForGame, { gameId });
  const submissionStatus = useQuery(
    api.answers.getSubmissionStatusForGame,
    showSubmissionStatus ? { gameId } : "skip"
  );

  if (!teams) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        </CardContent>
      </Card>
    );
  }

  const submissionMap = new Map(
    submissionStatus?.teams.map((t) => [t.teamId, t.hasSubmitted]) ?? []
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams
          </CardTitle>
          <Badge variant="secondary">{teams.length}</Badge>
        </div>
        {showSubmissionStatus && submissionStatus && (
          <p className="text-sm text-muted-foreground">
            {submissionStatus.submittedCount} / {submissionStatus.totalTeams} answered
          </p>
        )}
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No teams have joined yet
          </p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team, index) => {
              const hasSubmitted = submissionMap.get(team._id);

              return (
                <li
                  key={team._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="font-medium">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {showSubmissionStatus && (
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          hasSubmitted ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        {hasSubmitted ? (
                          <>
                            <Check className="w-3 h-3" />
                            Submitted
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Waiting
                          </>
                        )}
                      </span>
                    )}
                    <Badge variant="outline" className="font-mono">
                      {team.totalScore} pts
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

