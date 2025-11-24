"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface AnswerField {
  id: string;
  label: string;
  correctAnswer: string;
}

interface AnswerFieldsEditorProps {
  fields: AnswerField[];
  onChange: (fields: AnswerField[]) => void;
}

export function AnswerFieldsEditor({
  fields,
  onChange,
}: AnswerFieldsEditorProps) {
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
      { id: crypto.randomUUID(), label: "", correctAnswer: "" },
    ]);
  };

  const handleRemoveField = (id: string) => {
    if (fields.length > 1) {
      onChange(fields.filter((f) => f.id !== id));
    }
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

