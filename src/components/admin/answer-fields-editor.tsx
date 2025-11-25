"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from "lucide-react";

interface AnswerField {
  id: string;
  label: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
}

interface AnswerFieldsEditorProps {
  fields: AnswerField[];
  onChange: (fields: AnswerField[]) => void;
}

export function AnswerFieldsEditor({
  fields,
  onChange,
}: AnswerFieldsEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
  const [newAcceptedInputs, setNewAcceptedInputs] = useState<Record<string, string>>({});

  const handleFieldChange = (
    id: string,
    key: "label" | "correctAnswer",
    value: string
  ) => {
    onChange(
      fields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const handleAddField = () => {
    onChange([
      ...fields,
      { id: crypto.randomUUID(), label: "", correctAnswer: "", acceptedAnswers: [] },
    ]);
  };

  const handleRemoveField = (id: string) => {
    if (fields.length > 1) {
      onChange(fields.filter((f) => f.id !== id));
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFields(newExpanded);
  };

  const handleAddAcceptedAnswer = (fieldId: string) => {
    const newAnswer = newAcceptedInputs[fieldId]?.trim();
    if (!newAnswer) return;

    onChange(
      fields.map((f) => {
        if (f.id !== fieldId) return f;
        const existing = f.acceptedAnswers ?? [];
        if (existing.includes(newAnswer)) return f;
        return { ...f, acceptedAnswers: [...existing, newAnswer] };
      })
    );
    setNewAcceptedInputs((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const handleRemoveAcceptedAnswer = (fieldId: string, index: number) => {
    onChange(
      fields.map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          acceptedAnswers: (f.acceptedAnswers ?? []).filter((_, i) => i !== index),
        };
      })
    );
  };

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <GripVertical className="w-4 h-4" />
              <span className="text-xs font-medium">Field {index + 1}</span>
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemoveField(field.id)}
                className="h-6 w-6 text-slate-500 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          <Input
            value={field.label}
            onChange={(e) => handleFieldChange(field.id, "label", e.target.value)}
            placeholder="Field label (e.g., Composer)"
            className="bg-slate-900 border-slate-700 text-white text-sm"
          />
          <Input
            value={field.correctAnswer}
            onChange={(e) =>
              handleFieldChange(field.id, "correctAnswer", e.target.value)
            }
            placeholder="Correct answer"
            className="bg-slate-900 border-slate-700 text-white text-sm"
          />

          {/* Accepted Answers Section */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleExpanded(field.id)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
            >
              {expandedFields.has(field.id) ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              Also Accept ({field.acceptedAnswers?.length ?? 0})
            </button>

            {expandedFields.has(field.id) && (
              <div className="mt-2 pl-4 space-y-2">
                {(field.acceptedAnswers ?? []).map((answer, answerIndex) => (
                  <div
                    key={answerIndex}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="flex-1 text-slate-400 truncate">{answer}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAcceptedAnswer(field.id, answerIndex)}
                      className="h-5 w-5 text-slate-600 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newAcceptedInputs[field.id] ?? ""}
                    onChange={(e) =>
                      setNewAcceptedInputs((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAcceptedAnswer(field.id);
                      }
                    }}
                    placeholder="Add alternate answer..."
                    className="bg-slate-900 border-slate-700 text-white text-xs h-7 flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={() => handleAddAcceptedAnswer(field.id)}
                    disabled={!newAcceptedInputs[field.id]?.trim()}
                    className="h-7 w-7 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAddField}
        className="text-slate-500 hover:text-slate-300"
      >
        <Plus className="w-4 h-4 mr-1" />
        Add Answer Field
      </Button>

      <p className="text-slate-500 text-xs">
        Use multiple fields for questions like &quot;Name the composer and piece&quot;
      </p>
    </div>
  );
}
