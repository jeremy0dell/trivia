"use client";

import { use } from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Music, HelpCircle, Clock } from "lucide-react";

interface PageProps {
  params: Promise<{ gameCode: string }>;
}

export default function MediaPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { gameCode } = resolvedParams;

  const game = useQuery(api.games.getByJoinCode, { joinCode: gameCode });
  const currentQuestion = useQuery(
    api.questions.getCurrentQuestion,
    game ? { gameId: game._id } : "skip"
  );

  if (!game) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" className="text-white" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <Clock className="w-16 h-16 mx-auto opacity-50" />
          <p className="text-xl opacity-70">Waiting for question...</p>
        </div>
      </div>
    );
  }

  const hasMedia = currentQuestion.mediaUrl && currentQuestion.mediaType;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white">
      <div className="min-h-screen flex flex-col">
        <header className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            <span className="font-bold">Media Display</span>
          </div>
          <div className="text-sm text-white/60">
            Round {currentQuestion.roundNumber} • Q
            {currentQuestion.questionNumber}/{currentQuestion.totalQuestions}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
          {hasMedia ? (
            <MediaContent
              mediaUrl={currentQuestion.mediaUrl!}
              mediaType={currentQuestion.mediaType!}
            />
          ) : (
            <QuestionOnlyDisplay prompt={currentQuestion.prompt} />
          )}
        </div>

        <footer className="p-4 text-center border-t border-white/10">
          <p className="text-white/40 text-sm">{gameCode}</p>
        </footer>
      </div>
    </main>
  );
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeEmbedUrl(url: string): string {
  if (url.includes("/embed/")) return url;
  
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0] ?? "";
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0] ?? "";
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

interface MediaContentProps {
  mediaUrl: string;
  mediaType: string;
}

function MediaContent({ mediaUrl, mediaType }: MediaContentProps) {
  if (mediaType === "image") {
    return (
      <div className="relative max-w-5xl w-full">
        <div className="aspect-video relative rounded-2xl overflow-hidden bg-black/50 shadow-2xl">
          <Image
            src={mediaUrl}
            alt="Question media"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      </div>
    );
  }

  if (mediaType === "video") {
    if (isYouTubeUrl(mediaUrl)) {
      return (
        <div className="relative max-w-5xl w-full">
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-black shadow-2xl">
            <iframe
              src={getYouTubeEmbedUrl(mediaUrl)}
              title="Video question"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="relative max-w-5xl w-full">
        <div className="aspect-video relative rounded-2xl overflow-hidden bg-black shadow-2xl">
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>
      </div>
    );
  }

  if (mediaType === "audio") {
    return (
      <div className="max-w-2xl w-full">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 space-y-8">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <Music className="w-16 h-16 text-primary" />
            </div>
          </div>
          <audio src={mediaUrl} controls autoPlay className="w-full" />
          <p className="text-center text-white/60">Listen carefully...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-white/60">
      <HelpCircle className="w-16 h-16 mx-auto mb-4" />
      <p>Unknown media type</p>
    </div>
  );
}

function QuestionOnlyDisplay({ prompt }: { prompt: string }) {
  return (
    <div className="max-w-4xl text-center space-y-8">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
        <HelpCircle className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
        {prompt}
      </h1>
      <p className="text-white/40 text-lg">Answer on your device</p>
    </div>
  );
}

