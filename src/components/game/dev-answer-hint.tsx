"use client";

import { isDevMode } from "@/lib/dev";
import { Eye } from "lucide-react";

interface DevAnswerHintProps {
  correctAnswer: string;
  acceptedAnswers?: string[];
}

export function DevAnswerHint({
  correctAnswer,
  acceptedAnswers,
}: DevAnswerHintProps) {
  if (!isDevMode()) return null;

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
        <Eye className="w-3.5 h-3.5" />
        DEV MODE - Answer Hint
      </div>
      <p className="text-green-300 font-mono text-sm">{correctAnswer}</p>
      {acceptedAnswers && acceptedAnswers.length > 0 && (
        <p className="text-green-400/70 text-xs">
          Also accepted: {acceptedAnswers.join(", ")}
        </p>
      )}
    </div>
  );
}

