"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Gamepad2, Plus } from "lucide-react";
import Link from "next/link";

export default function NewGamePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const createGame = useMutation(api.games.create);
  const createRound = useMutation(api.rounds.create);
  const createQuestion = useMutation(api.questions.create);

  const handleCreateGame = async () => {
    setIsCreating(true);

    try {
      const { gameId, joinCode } = await createGame({});

      const round1Id = await createRound({
        gameId,
        title: "Composers & Their Works",
        roundNumber: 1,
        type: "standard",
      });

      const round2Id = await createRound({
        gameId,
        title: "Musical Terms & History",
        roundNumber: 2,
        type: "standard",
      });

      const round3Id = await createRound({
        gameId,
        title: "Listening Round",
        roundNumber: 3,
        type: "listening",
      });

      const sampleQuestions = [
        {
          roundId: round1Id,
          indexInRound: 0,
          prompt: "Who composed the famous 'Moonlight Sonata'?",
          type: "text" as const,
          correctAnswer: "Ludwig van Beethoven",
          points: 10,
        },
        {
          roundId: round1Id,
          indexInRound: 1,
          prompt: "Which composer wrote 'The Four Seasons'?",
          type: "multiple_choice" as const,
          options: ["Bach", "Vivaldi", "Mozart", "Handel"],
          correctAnswer: "Vivaldi",
          points: 10,
        },
        {
          roundId: round1Id,
          indexInRound: 2,
          prompt: "How many symphonies did Beethoven compose?",
          type: "numeric" as const,
          correctAnswer: "9",
          points: 10,
        },
        {
          roundId: round2Id,
          indexInRound: 0,
          prompt: "What does 'Allegro' mean in musical terms?",
          type: "text" as const,
          correctAnswer: "Fast",
          points: 10,
        },
        {
          roundId: round2Id,
          indexInRound: 1,
          prompt: "In what city was Mozart born?",
          type: "multiple_choice" as const,
          options: ["Vienna", "Salzburg", "Prague", "Munich"],
          correctAnswer: "Salzburg",
          points: 10,
        },
        {
          roundId: round3Id,
          indexInRound: 0,
          prompt: "Name the composer and piece in this video:",
          type: "media" as const,
          mediaUrl: "https://www.youtube.com/embed/JTc1mDieQI8",
          mediaType: "youtube" as const,
          correctAnswer: "Johann Sebastian Bach - Toccata and Fugue in D minor",
          answerFields: [
            { id: "composer", label: "Composer", correctAnswer: "Johann Sebastian Bach" },
            { id: "piece", label: "Piece Name", correctAnswer: "Toccata and Fugue in D minor" },
          ],
          points: 20,
        },
      ];

      for (const q of sampleQuestions) {
        await createQuestion(q);
      }

      router.push(`/host/${gameId}?code=${joinCode}`);
    } catch {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Gamepad2 className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Host a New Game</CardTitle>
            <CardDescription>
              Create a trivia game for your audience. A game code will be generated
              for players to join.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium">What you&apos;ll get:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  A unique 6-character game code for players to join
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Sample classical music trivia questions (3 rounds, 6 questions)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Real-time scoreboard and answer tracking
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Manual review for close answers
                </li>
              </ul>
            </div>

            <Button
              size="lg"
              className="w-full h-14 text-lg"
              onClick={handleCreateGame}
              disabled={isCreating}
            >
              {isCreating ? (
                "Creating Game..."
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

