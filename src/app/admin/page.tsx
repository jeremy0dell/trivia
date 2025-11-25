"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Archive,
  RotateCcw,
  Trash2,
  Copy,
  Edit2,
  HelpCircle,
  Layers,
} from "lucide-react";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { ResetDialog } from "@/components/admin/reset-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "../../../convex/_generated/dataModel";

type GameWithCounts = {
  _id: Id<"games">;
  title: string;
  description?: string;
  joinCode: string;
  state: "lobby" | "in_round" | "grading" | "finished";
  isArchived: boolean;
  createdAt: number;
  roundCount: number;
  questionCount: number;
};

function getStateBadge(state: string) {
  switch (state) {
    case "lobby":
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
          Lobby
        </Badge>
      );
    case "in_round":
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
          In Progress
        </Badge>
      );
    case "grading":
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
          Grading
        </Badge>
      );
    case "finished":
      return (
        <Badge variant="secondary" className="bg-slate-500/20 text-slate-400">
          Finished
        </Badge>
      );
    default:
      return null;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"active" | "archived">("active");
  const [deleteGameId, setDeleteGameId] = useState<Id<"games"> | null>(null);
  const [resetGameId, setResetGameId] = useState<Id<"games"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const games = useQuery(api.games.list, {
    includeArchived: filter === "archived",
  });
  const createGame = useMutation(api.games.create);
  const archiveGame = useMutation(api.games.archive);
  const restoreGame = useMutation(api.games.restore);
  const deleteGame = useMutation(api.games.hardDelete);
  const duplicateGame = useMutation(api.games.duplicate);
  const resetGame = useMutation(api.games.resetGame);

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const { gameId } = await createGame({
        title: `New Game ${new Date().toLocaleDateString()}`,
      });
      router.push(`/admin/games/${gameId}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (gameId: Id<"games">) => {
    const { gameId: newGameId } = await duplicateGame({ gameId });
    router.push(`/admin/games/${newGameId}`);
  };

  const filteredGames = games?.filter((g) =>
    filter === "archived" ? g.isArchived : !(g.isArchived ?? false)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Games</h1>
          <p className="text-slate-400 mt-1">
            Create and manage your trivia games
          </p>
        </div>
        <Button
          onClick={handleCreateGame}
          disabled={isCreating}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? "Creating..." : "Create Game"}
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "active" | "archived")}
        className="mb-6"
      >
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            value="archived"
            className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400"
          >
            Archived
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {!games ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-slate-700" />
                    <Skeleton className="h-4 w-20 bg-slate-700" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-slate-700" />
                </div>
                <Skeleton className="h-4 w-full bg-slate-700" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-20 bg-slate-700" />
                  <Skeleton className="h-4 w-24 bg-slate-700" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredGames?.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-slate-400">
              {filter === "archived"
                ? "No archived games"
                : "No games yet. Create your first game!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames?.map((game: GameWithCounts) => (
            <Card
              key={game._id}
              className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer group"
              onClick={() => router.push(`/admin/games/${game._id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {game.title ?? "Untitled Game"}
                    </h3>
                    <p className="text-sm text-slate-500 font-mono">
                      {game.joinCode}
                    </p>
                  </div>
                  {getStateBadge(game.state)}
                </div>

                {game.description && (
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {game.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>{game.roundCount} rounds</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" />
                    <span>{game.questionCount} questions</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/games/${game._id}`);
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(game._id);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {game.state !== "lobby" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResetGameId(game._id);
                      }}
                      title="Reset Game"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  {game.isArchived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreGame({ gameId: game._id });
                      }}
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveGame({ gameId: game._id });
                      }}
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  {game.state === "lobby" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteGameId(game._id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteDialog
        open={deleteGameId !== null}
        onOpenChange={(open) => !open && setDeleteGameId(null)}
        title="Delete Game"
        description="Are you sure you want to delete this game? This action cannot be undone and will delete all rounds, questions, and answers."
        onConfirm={async () => {
          if (deleteGameId) {
            await deleteGame({ gameId: deleteGameId });
            setDeleteGameId(null);
          }
        }}
      />

      <ResetDialog
        open={resetGameId !== null}
        onOpenChange={(open) => !open && setResetGameId(null)}
        onReset={async (preserveTeams) => {
          if (resetGameId) {
            await resetGame({ gameId: resetGameId, preserveTeams });
            setResetGameId(null);
          }
        }}
      />
    </div>
  );
}

