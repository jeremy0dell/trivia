"use client";

import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Play,
  Archive,
  Trash2,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { RoundList } from "@/components/admin/round-list";
import { QuestionEditorPanel } from "@/components/admin/question-editor-panel";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = {
  params: Promise<{ gameId: string }>;
};

export default function GameEditorPage({ params }: PageProps) {
  const { gameId } = use(params);
  const router = useRouter();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<
    Id<"questions"> | "new" | null
  >(null);
  const [newQuestionRoundId, setNewQuestionRoundId] =
    useState<Id<"rounds"> | null>(null);

  const game = useQuery(api.games.getById, {
    gameId: gameId as Id<"games">,
  });
  const rounds = useQuery(api.rounds.getRoundsForGame, {
    gameId: gameId as Id<"games">,
  });

  const updateMeta = useMutation(api.games.updateMeta);
  const archiveGame = useMutation(api.games.archive);
  const deleteGame = useMutation(api.games.hardDelete);
  const startRound = useMutation(api.games.startRound);

  const isEditable = game?.state === "lobby";

  const handleStartEditTitle = () => {
    setTitleValue(game?.title ?? "");
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    if (titleValue.trim().length >= 3) {
      await updateMeta({ gameId: gameId as Id<"games">, title: titleValue });
      setEditingTitle(false);
    }
  };

  const handleStartEditDescription = () => {
    setDescriptionValue(game?.description ?? "");
    setEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    await updateMeta({
      gameId: gameId as Id<"games">,
      description: descriptionValue || undefined,
    });
    setEditingDescription(false);
  };

  const handleStartGame = async () => {
    if (rounds && rounds.length > 0) {
      await startRound({
        gameId: gameId as Id<"games">,
        roundId: rounds[0]._id,
      });
    }
  };

  const handleArchive = async () => {
    await archiveGame({ gameId: gameId as Id<"games"> });
    router.push("/admin");
  };

  const handleDelete = async () => {
    await deleteGame({ gameId: gameId as Id<"games"> });
    router.push("/admin");
  };

  const handleEditQuestion = (questionId: Id<"questions">) => {
    setEditingQuestionId(questionId);
    setNewQuestionRoundId(null);
  };

  const handleNewQuestion = (roundId: Id<"rounds">) => {
    setEditingQuestionId("new");
    setNewQuestionRoundId(roundId);
  };

  const handleCloseQuestionEditor = () => {
    setEditingQuestionId(null);
    setNewQuestionRoundId(null);
  };

  if (!game) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-9 w-32 bg-slate-700 mb-6" />
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-slate-700" />
            <Skeleton className="h-5 w-96 bg-slate-700" />
            <div className="flex gap-2 mt-2">
              <Skeleton className="h-6 w-20 bg-slate-700" />
              <Skeleton className="h-6 w-20 bg-slate-700" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-24 bg-slate-700" />
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border border-slate-700 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 bg-slate-700" />
                  <Skeleton className="h-5 flex-1 max-w-xs bg-slate-700" />
                  <Skeleton className="h-5 w-16 bg-slate-700" />
                </div>
                <div className="space-y-2 pl-8">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-12 w-full bg-slate-700/50" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canStart = rounds && rounds.length > 0 && isEditable;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push("/admin")}
        className="text-slate-400 hover:text-white hover:bg-slate-700 mb-6 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Games
      </Button>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  className="text-2xl font-bold bg-slate-800 border-slate-600 text-white max-w-md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveTitle}
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingTitle(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <h1
                className={`text-3xl font-bold text-white ${isEditable ? "cursor-pointer hover:text-slate-300" : ""}`}
                onClick={isEditable ? handleStartEditTitle : undefined}
              >
                {game.title ?? "Untitled Game"}
              </h1>
            )}

            {editingDescription ? (
              <div className="flex items-center gap-2">
                <Input
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  placeholder="Add a description..."
                  className="bg-slate-800 border-slate-600 text-slate-300 max-w-md"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveDescription();
                    if (e.key === "Escape") setEditingDescription(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveDescription}
                  className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingDescription(false)}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <p
                className={`text-slate-400 ${isEditable ? "cursor-pointer hover:text-slate-300" : ""}`}
                onClick={isEditable ? handleStartEditDescription : undefined}
              >
                {game.description || (isEditable ? "Click to add description" : "No description")}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              <Badge
                variant="secondary"
                className="bg-slate-700 text-slate-300 font-mono"
              >
                {game.joinCode}
              </Badge>
              {game.state === "lobby" ? (
                <Badge
                  variant="secondary"
                  className="bg-blue-500/20 text-blue-400"
                >
                  Editable
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-amber-500/20 text-amber-400"
                >
                  Locked
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                <Button
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Game
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleArchive}
                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Archive className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => window.open(`/host/${gameId}?code=${game.joinCode}`, "_blank")}
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Rounds */}
        <RoundList
          gameId={gameId as Id<"games">}
          rounds={rounds ?? []}
          isEditable={isEditable}
          onEditQuestion={handleEditQuestion}
          onNewQuestion={handleNewQuestion}
        />
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Game"
        description="Are you sure you want to delete this game? This action cannot be undone."
        onConfirm={handleDelete}
      />

      <QuestionEditorPanel
        open={editingQuestionId !== null}
        onClose={handleCloseQuestionEditor}
        questionId={editingQuestionId === "new" ? null : editingQuestionId}
        roundId={newQuestionRoundId}
      />
    </div>
  );
}

