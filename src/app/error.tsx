"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";
import { getUserFriendlyError } from "@/lib/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const { title, message, canRetry } = getUserFriendlyError(error);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && (
            <Button size="lg" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button size="lg" variant="outline" asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Bug className="w-3 h-3" />
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}

