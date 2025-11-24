"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
} from "lucide-react";
import { DeleteDialog } from "./delete-dialog";

type Question = {
  _id: Id<"questions">;
  roundId: Id<"rounds">;
  indexInRound: number;
  prompt: string;
  type: "text" | "multiple_choice" | "numeric" | "media";
  options?: string[];
  correctAnswer: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio" | "youtube";
  points: number;
  answerFields?: { id: string; label: string; correctAnswer: string }[];
};

interface QuestionListProps {
  roundId: Id<"rounds">;
  questions: Question[];
  isEditable: boolean;
  onEdit: (questionId: Id<"questions">) => void;
  onNew: () => void;
}

interface SortableQuestionProps {
  question: Question;
  isEditable: boolean;
  onEdit: () => void;
}

function SortableQuestion({
  question,
  isEditable,
  onEdit,
}: SortableQuestionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteQuestion = useMutation(api.questions.deleteQuestion);
  const duplicateQuestion = useMutation(api.questions.duplicate);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id, disabled: !isEditable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = async () => {
    await deleteQuestion({ questionId: question._id });
  };

  const handleDuplicate = async () => {
    await duplicateQuestion({ questionId: question._id });
  };

  const getTypeIcon = () => {
    if (question.mediaUrl) {
      switch (question.mediaType) {
        case "image":
          return <ImageIcon className="w-4 h-4 text-cyan-400" />;
        case "video":
        case "youtube":
          return <Video className="w-4 h-4 text-red-400" />;
        case "audio":
          return <Music className="w-4 h-4 text-purple-400" />;
      }
    }
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const getTypeBadge = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 text-xs"
          >
            MC
          </Badge>
        );
      case "numeric":
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/20 text-green-400 text-xs"
          >
            #
          </Badge>
        );
      case "media":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-500/20 text-purple-400 text-xs"
          >
            Media
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors group"
      >
        {isEditable && (
          <button
            className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs text-slate-400 font-medium">
          {question.indexInRound + 1}
        </div>

        {getTypeIcon()}

        <div className="flex-1 min-w-0">
          <p className="text-slate-300 text-sm truncate">{question.prompt}</p>
        </div>

        {getTypeBadge()}

        {question.answerFields && question.answerFields.length > 0 && (
          <Badge
            variant="secondary"
            className="bg-amber-500/20 text-amber-400 text-xs"
          >
            {question.answerFields.length} fields
          </Badge>
        )}

        <Badge
          variant="secondary"
          className="bg-slate-700 text-slate-400 text-xs"
        >
          {question.points} pts
        </Badge>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            className="h-7 w-7 text-slate-400 hover:text-white"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          {isEditable && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDuplicate}
                className="h-7 w-7 text-slate-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDeleteDialogOpen(true)}
                className="h-7 w-7 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Question"
        description="Are you sure you want to delete this question?"
        onConfirm={handleDelete}
      />
    </>
  );
}

export function QuestionList({
  roundId,
  questions,
  isEditable,
  onEdit,
  onNew,
}: QuestionListProps) {
  const reorderQuestions = useMutation(api.questions.reorder);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q._id === active.id);
      const newIndex = questions.findIndex((q) => q._id === over.id);
      const newOrder = arrayMove(questions, oldIndex, newIndex);
      await reorderQuestions({
        roundId,
        questionIds: newOrder.map((q) => q._id),
      });
    }
  };

  return (
    <div className="space-y-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q._id)}
          strategy={verticalListSortingStrategy}
        >
          {questions.map((question) => (
            <SortableQuestion
              key={question._id}
              question={question}
              isEditable={isEditable}
              onEdit={() => onEdit(question._id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {isEditable && (
        <Button
          onClick={onNew}
          variant="ghost"
          size="sm"
          className="w-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      )}

      {questions.length === 0 && !isEditable && (
        <p className="text-slate-500 text-sm text-center py-4">
          No questions in this round
        </p>
      )}
    </div>
  );
}

