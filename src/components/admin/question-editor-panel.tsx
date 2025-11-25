"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { OptionsEditor } from "./options-editor";
import { AnswerFieldsEditor } from "./answer-fields-editor";
import { AcceptedAnswersEditor } from "./accepted-answers-editor";
import { MediaPreview } from "./media-preview";

type QuestionType = "text" | "multiple_choice" | "numeric" | "media";
type MediaType = "image" | "video" | "audio" | "youtube";

interface AnswerField {
  id: string;
  label: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
}

interface QuestionEditorPanelProps {
  open: boolean;
  onClose: () => void;
  questionId: Id<"questions"> | null;
  roundId: Id<"rounds"> | null;
}

export function QuestionEditorPanel({
  open,
  onClose,
  questionId,
  roundId,
}: QuestionEditorPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [points, setPoints] = useState(10);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [acceptedAnswers, setAcceptedAnswers] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [answerFields, setAnswerFields] = useState<AnswerField[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const existingQuestion = useQuery(
    api.questions.getById,
    questionId ? { questionId } : "skip"
  );
  const questionsInRound = useQuery(
    api.questions.getQuestionsForRound,
    roundId ? { roundId } : "skip"
  );

  const createQuestion = useMutation(api.questions.create);
  const updateQuestion = useMutation(api.questions.update);

  // Reset form when opening with new question or editing existing
  useEffect(() => {
    if (!open) return;

    if (existingQuestion) {
      setPrompt(existingQuestion.prompt);
      setType(existingQuestion.type);
      setPoints(existingQuestion.points);
      setCorrectAnswer(existingQuestion.correctAnswer);
      setAcceptedAnswers(existingQuestion.acceptedAnswers ?? []);
      setOptions(existingQuestion.options ?? []);
      setAnswerFields(existingQuestion.answerFields ?? []);
      setMediaUrl(existingQuestion.mediaUrl ?? "");
      setMediaType(existingQuestion.mediaType ?? "image");
    } else {
      setPrompt("");
      setType("text");
      setPoints(10);
      setCorrectAnswer("");
      setAcceptedAnswers([]);
      setOptions(["", ""]);
      setAnswerFields([]);
      setMediaUrl("");
      setMediaType("image");
    }
    setErrors({});
  }, [open, existingQuestion]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!prompt.trim()) {
      newErrors.prompt = "Prompt is required";
    }

    if (points <= 0) {
      newErrors.points = "Points must be greater than 0";
    }

    if (type === "multiple_choice") {
      const validOptions = options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        newErrors.options = "At least 2 options required";
      }
      if (!correctAnswer.trim()) {
        newErrors.correctAnswer = "Select the correct answer";
      }
    } else if (answerFields.length > 0) {
      const invalidFields = answerFields.filter(
        (f) => !f.label.trim() || !f.correctAnswer.trim()
      );
      if (invalidFields.length > 0) {
        newErrors.answerFields = "All fields need label and correct answer";
      }
    } else if (!correctAnswer.trim()) {
      newErrors.correctAnswer = "Correct answer is required";
    }

    if (mediaUrl && !isValidUrl(mediaUrl)) {
      newErrors.mediaUrl = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const validOptions =
        type === "multiple_choice" ? options.filter((o) => o.trim()) : undefined;

      const questionData = {
        prompt,
        type,
        points,
        correctAnswer:
          answerFields.length > 0 ? answerFields[0]?.correctAnswer ?? "" : correctAnswer,
        acceptedAnswers:
          type !== "multiple_choice" && acceptedAnswers.length > 0
            ? acceptedAnswers
            : undefined,
        options: validOptions,
        answerFields: answerFields.length > 0 ? answerFields : undefined,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
      };

      if (questionId) {
        await updateQuestion({
          questionId,
          ...questionData,
        });
      } else if (roundId) {
        const indexInRound = questionsInRound?.length ?? 0;
        await createQuestion({
          roundId,
          indexInRound,
          ...questionData,
        });
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === "multiple_choice" && options.length < 2) {
      setOptions(["", ""]);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-slate-700 z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">
            {questionId ? "Edit Question" : "New Question"}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Prompt */}
          <div className="space-y-2">
            <Label className="text-slate-300">Question Prompt</Label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the question..."
              className="w-full min-h-[100px] px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            {errors.prompt && (
              <p className="text-red-400 text-sm">{errors.prompt}</p>
            )}
          </div>

          {/* Type & Points */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Question Type</Label>
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="text">Text</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="numeric">Numeric</option>
                <option value="media">Media</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Points</Label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                min={1}
                className="bg-slate-800 border-slate-700 text-white"
              />
              {errors.points && (
                <p className="text-red-400 text-sm">{errors.points}</p>
              )}
            </div>
          </div>

          {/* Multiple Choice Options */}
          {type === "multiple_choice" && (
            <div className="space-y-2">
              <Label className="text-slate-300">Options</Label>
              <OptionsEditor
                options={options}
                correctAnswer={correctAnswer}
                onChange={setOptions}
                onCorrectChange={setCorrectAnswer}
              />
              {errors.options && (
                <p className="text-red-400 text-sm">{errors.options}</p>
              )}
            </div>
          )}

          {/* Answer Configuration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">
                {type === "multiple_choice" ? "Correct Answer" : "Answer Configuration"}
              </Label>
              {type !== "multiple_choice" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (answerFields.length === 0) {
                      setAnswerFields([
                        { id: crypto.randomUUID(), label: "", correctAnswer: "" },
                      ]);
                    } else {
                      setAnswerFields([]);
                    }
                  }}
                  className="text-amber-400 hover:text-amber-300 text-xs"
                >
                  {answerFields.length > 0 ? "Use Single Answer" : "Use Multiple Fields"}
                </Button>
              )}
            </div>

            {type !== "multiple_choice" && answerFields.length > 0 ? (
              <>
                <AnswerFieldsEditor
                  fields={answerFields}
                  onChange={setAnswerFields}
                />
                {errors.answerFields && (
                  <p className="text-red-400 text-sm">{errors.answerFields}</p>
                )}
              </>
            ) : type !== "multiple_choice" ? (
              <>
                <Input
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  placeholder="Enter the correct answer..."
                  className="bg-slate-800 border-slate-700 text-white"
                />
                {errors.correctAnswer && (
                  <p className="text-red-400 text-sm">{errors.correctAnswer}</p>
                )}

                {/* Accepted Answers for text/numeric */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <Label className="text-slate-300 mb-2 block">
                    Also Accept (Optional)
                  </Label>
                  <AcceptedAnswersEditor
                    answers={acceptedAnswers}
                    onChange={setAcceptedAnswers}
                  />
                </div>
              </>
            ) : null}
          </div>

          {/* Media */}
          <div className="space-y-2">
            <Label className="text-slate-300">Media (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="Paste URL (image, video, or YouTube)..."
                className="bg-slate-800 border-slate-700 text-white flex-1"
              />
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as MediaType)}
                className="w-28 h-10 px-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            {errors.mediaUrl && (
              <p className="text-red-400 text-sm">{errors.mediaUrl}</p>
            )}
            {mediaUrl && <MediaPreview url={mediaUrl} type={mediaType} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            {isSaving ? "Saving..." : questionId ? "Save Changes" : "Create Question"}
          </Button>
        </div>
      </div>
    </>
  );
}

