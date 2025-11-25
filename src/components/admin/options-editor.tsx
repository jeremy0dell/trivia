"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Check } from "lucide-react";

interface OptionsEditorProps {
  options: string[];
  correctAnswer: string;
  onChange: (options: string[]) => void;
  onCorrectChange: (correct: string) => void;
}

export function OptionsEditor({
  options,
  correctAnswer,
  onChange,
  onCorrectChange,
}: OptionsEditorProps) {
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onChange(newOptions);

    // If this was the correct answer, update it
    if (options[index] === correctAnswer && value !== correctAnswer) {
      onCorrectChange(value);
    }
  };

  const handleAddOption = () => {
    if (options.length < 6) {
      onChange([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const removedOption = options[index];
      const newOptions = options.filter((_, i) => i !== index);
      onChange(newOptions);

      // Clear correct answer if it was removed
      if (removedOption === correctAnswer) {
        onCorrectChange("");
      }
    }
  };

  const handleSetCorrect = (option: string) => {
    if (option.trim()) {
      onCorrectChange(option);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSetCorrect(option)}
            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              option.trim() && option === correctAnswer
                ? "border-green-500 bg-green-500/20 text-green-400"
                : "border-slate-600 hover:border-slate-500 text-slate-600"
            }`}
            title={option === correctAnswer ? "Correct answer" : "Mark as correct"}
          >
            {option.trim() && option === correctAnswer && (
              <Check className="w-4 h-4" />
            )}
          </button>
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            className="bg-slate-800 border-slate-700 text-white flex-1"
          />
          {options.length > 2 && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemoveOption(index)}
              className="h-8 w-8 text-slate-500 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {options.length < 6 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddOption}
          className="text-slate-500 hover:text-slate-300"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Option
        </Button>
      )}

      <p className="text-slate-500 text-xs">
        Click the circle to mark the correct answer. Min 2, max 6 options.
      </p>
    </div>
  );
}


