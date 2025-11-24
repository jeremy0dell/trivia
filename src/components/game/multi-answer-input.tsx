"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";

interface AnswerField {
  id: string;
  label: string;
}

interface MultiAnswerInputProps {
  fields: AnswerField[];
  onSubmit: (answers: Record<string, string>) => void;
  disabled?: boolean;
}

export function MultiAnswerInput({
  fields,
  onSubmit,
  disabled = false,
}: MultiAnswerInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.id, ""]))
  );

  const handleChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allFilled = fields.every((f) => answers[f.id]?.trim());
    if (allFilled && !disabled) {
      onSubmit(answers);
    }
  };

  const allFilled = fields.every((f) => answers[f.id]?.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className="text-base font-medium">
            {field.label}
          </Label>
          <Input
            id={field.id}
            type="text"
            value={answers[field.id] ?? ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            disabled={disabled}
            className="h-12 text-lg"
            autoComplete="off"
          />
        </div>
      ))}
      <Button
        type="submit"
        size="lg"
        className="w-full h-12"
        disabled={disabled || !allFilled}
      >
        <Send className="w-4 h-4 mr-2" />
        Submit Answers
      </Button>
    </form>
  );
}

