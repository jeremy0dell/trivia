"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface AcceptedAnswersEditorProps {
  answers: string[];
  onChange: (answers: string[]) => void;
}

export function AcceptedAnswersEditor({
  answers,
  onChange,
}: AcceptedAnswersEditorProps) {
  const [newAnswer, setNewAnswer] = useState("");

  const handleAdd = () => {
    if (newAnswer.trim() && !answers.includes(newAnswer.trim())) {
      onChange([...answers, newAnswer.trim()]);
      setNewAnswer("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(answers.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add another accepted answer..."
          className="bg-slate-800 border-slate-700 text-white flex-1"
        />
        <Button
          type="button"
          size="icon"
          onClick={handleAdd}
          disabled={!newAnswer.trim()}
          className="bg-slate-700 hover:bg-slate-600 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {answers.length > 0 && (
        <div className="space-y-2">
          {answers.map((answer, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-md"
            >
              <span className="flex-1 text-slate-300 text-sm">{answer}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => handleRemove(index)}
                className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Add alternative answers that should also be accepted as correct.
      </p>
    </div>
  );
}

