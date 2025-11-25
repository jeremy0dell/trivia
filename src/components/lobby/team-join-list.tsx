"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Users } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

interface TeamJoinListProps {
  gameId: Id<"games">;
}

export function TeamJoinList({ gameId }: TeamJoinListProps) {
  const teams = useQuery(api.teams.getTeamsForGame, { gameId });

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-xl text-muted-foreground">
          Waiting for teams to join...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Users className="w-5 h-5" />
        <span className="text-lg">{teams.length} teams joined</span>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {teams.map((team, index) => (
          <div
            key={team._id}
            className="px-4 py-2 bg-card border rounded-full text-lg font-medium animate-in fade-in zoom-in duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {team.name}
          </div>
        ))}
      </div>
    </div>
  );
}


