"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Music, HelpCircle } from "lucide-react";

interface QuestionDisplayProps {
  question: {
    prompt: string;
    type: string;
    mediaUrl?: string;
    mediaType?: string;
    roundTitle: string;
    roundNumber: number;
    questionNumber: number;
    totalQuestions: number;
    points: number;
  };
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

export function QuestionDisplay({ question }: QuestionDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Round {question.roundNumber}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Question {question.questionNumber} of {question.totalQuestions}
        </span>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <p className="text-lg sm:text-xl font-medium leading-relaxed pt-1">
            {question.prompt}
          </p>
        </div>

        {question.mediaUrl && (
          <div className="mt-4">
            {question.mediaType === "image" && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <Image
                  src={question.mediaUrl}
                  alt="Question media"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            {question.mediaType === "video" && isYouTubeUrl(question.mediaUrl) && (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(question.mediaUrl)}
                  title="Video question"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {question.mediaType === "video" && !isYouTubeUrl(question.mediaUrl) && (
              <video
                src={question.mediaUrl}
                controls
                className="w-full rounded-lg"
              />
            )}
            {question.mediaType === "audio" && (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Music className="w-8 h-8 text-primary" />
                <audio src={question.mediaUrl} controls className="flex-1" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <Badge variant="secondary" className="text-xs capitalize">
            {question.type.replace("_", " ")}
          </Badge>
          <span className="text-sm font-medium text-primary">
            {question.points} points
          </span>
        </div>
      </div>
    </div>
  );
}

