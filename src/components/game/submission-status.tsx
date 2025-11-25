"use client";

import { CheckCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmissionStatusProps {
  answer: string;
  onEdit?: () => void;
  canEdit?: boolean;
}

export function SubmissionStatus({
  answer,
  onEdit,
  canEdit = true,
}: SubmissionStatusProps) {
  return (
    <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-900 rounded-xl p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
          Answer Submitted!
        </h3>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">
          Your answer has been recorded
        </p>
      </div>

      <div className="bg-white dark:bg-green-950/50 rounded-lg p-3 border border-green-200 dark:border-green-800">
        <p className="text-sm text-muted-foreground">Your answer:</p>
        <p className="font-mono font-medium mt-1">{answer}</p>
      </div>

      {canEdit && onEdit && (
        <Button variant="outline" onClick={onEdit} className="w-full">
          <Edit2 className="w-4 h-4 mr-2" />
          Change Answer
        </Button>
      )}
    </div>
  );
}


