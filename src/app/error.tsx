"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <Button size="lg" onClick={reset}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </main>
  );
}

