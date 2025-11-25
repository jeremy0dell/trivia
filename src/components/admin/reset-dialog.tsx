"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Users, Trash2 } from "lucide-react";

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (preserveTeams: boolean) => Promise<void>;
}

/**
 * Dialog for resetting a game with options to preserve or clear teams.
 */
export function ResetDialog({
  open,
  onOpenChange,
  onReset,
}: ResetDialogProps) {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async (preserveTeams: boolean) => {
    setIsResetting(true);
    try {
      await onReset(preserveTeams);
      onOpenChange(false);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Reset Game
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            This will reset the game back to lobby state. All answers and scores will be cleared.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <button
            onClick={() => handleReset(true)}
            disabled={isResetting}
            className="w-full p-4 rounded-lg border border-slate-600 hover:border-amber-500 hover:bg-amber-500/10 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-medium">Keep Teams</p>
                <p className="text-slate-400 text-sm">
                  Reset scores and answers, but keep all teams joined
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleReset(false)}
            disabled={isResetting}
            className="w-full p-4 rounded-lg border border-slate-600 hover:border-red-500 hover:bg-red-500/10 transition-colors text-left group disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 group-hover:bg-red-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white font-medium">Full Reset</p>
                <p className="text-slate-400 text-sm">
                  Clear everything including all teams
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isResetting}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

