"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertCircle, Image as ImageIcon, Video, Music } from "lucide-react";

interface MediaPreviewProps {
  url: string;
  type: "image" | "video" | "audio" | "youtube";
}

function getYouTubeEmbedUrl(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /youtube\.com\/v\/([^&\s?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // Already an embed URL
  if (url.includes("youtube.com/embed/")) {
    return url.split("?")[0]; // Remove query params for cleaner embed
  }

  return null;
}

export function MediaPreview({ url, type }: MediaPreviewProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  if (error) {
    return (
      <div className="mt-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Failed to load media preview</span>
      </div>
    );
  }

  if (type === "youtube") {
    const embedUrl = getYouTubeEmbedUrl(url);
    if (!embedUrl) {
      return (
        <div className="mt-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Invalid YouTube URL</span>
        </div>
      );
    }

    return (
      <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-slate-800">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="w-8 h-8 text-slate-600 animate-pulse" />
          </div>
        )}
        <iframe
          src={embedUrl}
          title="YouTube preview"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-slate-800">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-slate-600 animate-pulse" />
          </div>
        )}
        <Image
          src={url}
          alt="Preview"
          fill
          className="object-contain"
          unoptimized
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className="mt-2 relative aspect-video rounded-lg overflow-hidden bg-slate-800">
        <video
          src={url}
          controls
          className="w-full h-full"
          onLoadedData={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  if (type === "audio") {
    return (
      <div className="mt-2 p-4 bg-slate-800 rounded-lg flex items-center gap-3">
        <Music className="w-6 h-6 text-purple-400" />
        <audio
          src={url}
          controls
          className="flex-1"
          onLoadedData={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  return null;
}

