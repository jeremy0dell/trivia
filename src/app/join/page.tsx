"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Music, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

export default function JoinPage() {
  const router = useRouter();
  const [gameCode, setGameCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const game = useQuery(
    api.games.getByJoinCode,
    gameCode.length === 6 ? { joinCode: gameCode.toUpperCase() } : "skip"
  );

  const joinTeam = useMutation(api.teams.join);

  const handleCodeChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setGameCode(cleaned);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!game) {
      setError("Game not found. Check your code and try again.");
      return;
    }

    if (game.state !== "lobby") {
      setError("This game has already started.");
      return;
    }

    if (!teamName.trim()) {
      setError("Please enter a team name.");
      return;
    }

    setIsJoining(true);

    try {
      const teamId = await joinTeam({
        gameId: game._id,
        name: teamName.trim(),
      });

      router.push(`/play/${game.joinCode}?teamId=${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setIsJoining(false);
    }
  };

  const isValidCode = gameCode.length === 6;
  const gameFound = isValidCode && game;
  const gameNotFound = isValidCode && game === null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Join a Game</CardTitle>
            <CardDescription>
              Enter the game code shown on the host&apos;s screen
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="gameCode">Game Code</Label>
                <Input
                  id="gameCode"
                  type="text"
                  placeholder="ABC123"
                  value={gameCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="text-center text-2xl font-mono tracking-widest uppercase h-14"
                  maxLength={6}
                  autoComplete="off"
                  autoFocus
                />
                {gameFound && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    Game found! Enter your team name below.
                  </p>
                )}
                {gameNotFound && (
                  <p className="text-sm text-destructive">
                    No game found with this code.
                  </p>
                )}
              </div>

              {gameFound && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="The Mozartians"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="h-12"
                    maxLength={30}
                    autoComplete="off"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 text-lg"
                disabled={!gameFound || !teamName.trim() || isJoining}
              >
                {isJoining ? "Joining..." : "Join Game"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have a code?{" "}
          <Link href="/host/new" className="text-primary hover:underline">
            Host your own game
          </Link>
        </p>
      </div>
    </main>
  );
}

