"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultipleChoiceProps {
  options: string[];
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function MultipleChoice({
  options,
  onSubmit,
  disabled = false,
}: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected && !disabled) {
      onSubmit(selected);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup
        value={selected ?? ""}
        onValueChange={setSelected}
        disabled={disabled}
        className="space-y-3"
      >
        {options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selected === option;

          return (
            <div key={index}>
              <RadioGroupItem
                value={option}
                id={`option-${index}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`option-${index}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                  "hover:border-primary/50 hover:bg-primary/5",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-muted bg-card",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className="text-base font-medium">{option}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <Button
        type="submit"
        size="lg"
        className="w-full h-12"
        disabled={disabled || !selected}
      >
        <Send className="w-4 h-4 mr-2" />
        Submit Answer
      </Button>
    </form>
  );
}


