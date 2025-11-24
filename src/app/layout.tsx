import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Classical Music Trivia",
  description: "Live trivia game for classical music enthusiasts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
