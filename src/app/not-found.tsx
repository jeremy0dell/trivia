import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Music className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <Link href="/">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    </main>
  );
}

