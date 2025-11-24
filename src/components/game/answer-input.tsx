"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function AnswerInput({
  onSubmit,
  disabled = false,
  placeholder = "Type your answer...",
}: AnswerInputProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !disabled) {
      onSubmit(answer.trim());
      setAnswer("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-14 text-lg"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="lg"
        className="w-full h-12"
        disabled={disabled || !answer.trim()}
      >
        <Send className="w-4 h-4 mr-2" />
        Submit Answer
      </Button>
    </form>
  );
}

