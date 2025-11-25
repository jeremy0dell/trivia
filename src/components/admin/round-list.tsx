"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Edit2,
} from "lucide-react";
import { DeleteDialog } from "./delete-dialog";
import { QuestionList } from "./question-list";

type Round = {
  _id: Id<"rounds">;
  gameId: Id<"games">;
  title: string;
  roundNumber: number;
  type: "standard" | "listening" | "media";
};

interface RoundListProps {
  gameId: Id<"games">;
  rounds: Round[];
  isEditable: boolean;
  onEditQuestion: (questionId: Id<"questions">) => void;
  onNewQuestion: (roundId: Id<"rounds">) => void;
}

interface SortableRoundProps {
  round: Round;
  isEditable: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onEditQuestion: (questionId: Id<"questions">) => void;
  onNewQuestion: () => void;
}

function SortableRound({
  round,
  isEditable,
  isExpanded,
  onToggle,
  onEditQuestion,
  onNewQuestion,
}: SortableRoundProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(round.title);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const updateRound = useMutation(api.rounds.update);
  const deleteRound = useMutation(api.rounds.deleteRound);
  const questions = useQuery(api.questions.getQuestionsForRound, {
    roundId: round._id,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: round._id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = async () => {
    if (titleValue.trim()) {
      await updateRound({ roundId: round._id, title: titleValue });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteRound({ roundId: round._id });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "listening":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/20 text-purple-400 text-xs"
          >
            Listening
          </Badge>
        );
      case "media":
        return (
          <Badge
            variant="secondary"
            className="bg-cyan-500/20 text-cyan-400 text-xs"
          >
            Media
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-slate-500/20 text-slate-400 text-xs"
          >
            Standard
          </Badge>
        );
    }
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className="bg-slate-800/50 border-slate-700"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            {isEditable && (
              <button
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="w-5 h-5" />
              </button>
            )}

            <button
              className="text-slate-400 hover:text-white"
              onClick={onToggle}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setIsEditing(false);
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSaveTitle}
                    className="h-8 w-8 text-green-400 hover:text-green-300"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="h-8 w-8 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-white font-medium">
                    Round {round.roundNumber}: {round.title}
                  </span>
                  {getTypeBadge(round.type)}
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-slate-400 text-xs"
                  >
                    {questions?.length ?? 0} questions
                  </Badge>
                </div>
              )}
            </div>

            {isEditable && !isEditing && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setTitleValue(round.title);
                    setIsEditing(true);
                  }}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="h-8 w-8 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-2">
            <QuestionList
              roundId={round._id}
              questions={questions ?? []}
              isEditable={isEditable}
              onEdit={onEditQuestion}
              onNew={onNewQuestion}
            />
          </CardContent>
        )}
      </Card>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Round"
        description={`Are you sure you want to delete "${round.title}"? All questions in this round will also be deleted.`}
        onConfirm={handleDelete}
      />
    </>
  );
}

export function RoundList({
  gameId,
  rounds,
  isEditable,
  onEditQuestion,
  onNewQuestion,
}: RoundListProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<Id<"rounds">>>(
    new Set(rounds.map((r) => r._id))
  );
  const [isAddingRound, setIsAddingRound] = useState(false);
  const [newRoundTitle, setNewRoundTitle] = useState("");

  const createRound = useMutation(api.rounds.create);
  const reorderRounds = useMutation(api.rounds.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = rounds.findIndex((r) => r._id === active.id);
      const newIndex = rounds.findIndex((r) => r._id === over.id);
      const newOrder = arrayMove(rounds, oldIndex, newIndex);
      await reorderRounds({
        gameId,
        roundIds: newOrder.map((r) => r._id),
      });
    }
  };

  const toggleExpanded = (roundId: Id<"rounds">) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  const handleCreateRound = async () => {
    if (newRoundTitle.trim()) {
      const roundId = await createRound({
        gameId,
        title: newRoundTitle,
        roundNumber: rounds.length + 1,
        type: "standard",
      });
      setNewRoundTitle("");
      setIsAddingRound(false);
      setExpandedRounds((prev) => new Set([...prev, roundId]));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Rounds</h2>
        {isEditable && (
          <Button
            onClick={() => setIsAddingRound(true)}
            variant="ghost"
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Round
          </Button>
        )}
      </div>

      {isAddingRound && (
        <Card className="bg-slate-800/50 border-slate-700 border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Input
                value={newRoundTitle}
                onChange={(e) => setNewRoundTitle(e.target.value)}
                placeholder="Round title..."
                className="bg-slate-900 border-slate-600 text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateRound();
                  if (e.key === "Escape") setIsAddingRound(false);
                }}
              />
              <Button
                onClick={handleCreateRound}
                disabled={!newRoundTitle.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                Create
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsAddingRound(false)}
                className="text-slate-400"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rounds.map((r) => r._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {rounds.map((round) => (
              <SortableRound
                key={round._id}
                round={round}
                isEditable={isEditable}
                isExpanded={expandedRounds.has(round._id)}
                onToggle={() => toggleExpanded(round._id)}
                onEditQuestion={onEditQuestion}
                onNewQuestion={() => onNewQuestion(round._id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {rounds.length === 0 && !isAddingRound && (
        <Card className="bg-slate-800/30 border-slate-700 border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-slate-500 mb-4">No rounds yet</p>
            {isEditable && (
              <Button
                onClick={() => setIsAddingRound(true)}
                variant="outline"
                className="border-slate-600 text-slate-400 hover:text-white hover:border-slate-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first round
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


