"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Users, Sparkles, Settings } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Music className="w-16 h-16 text-primary" />
              <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Classical Music
            <span className="block text-primary">Trivia</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto">
            Test your knowledge of the great composers, symphonies, and operas in this
            live multiplayer trivia experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/join">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                <Users className="w-5 h-5 mr-2" />
                Join a Game
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-lg px-8"
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
        </div>

        <footer className="absolute bottom-8 text-sm text-muted-foreground">
          Made with passion for classical music
        </footer>
      </div>
    </main>
  );
}
