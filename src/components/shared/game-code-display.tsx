import { cn } from "@/lib/utils";

interface GameCodeDisplayProps {
  code: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function GameCodeDisplay({ code, className, size = "md" }: GameCodeDisplayProps) {
  const sizeClasses = {
    sm: "text-lg tracking-wider",
    md: "text-2xl tracking-widest",
    lg: "text-4xl tracking-widest",
    xl: "text-6xl tracking-widest",
  };

  return (
    <div className={cn("font-mono font-bold", sizeClasses[size], className)}>
      {code.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block rounded bg-muted px-2 py-1 mx-0.5"
        >
          {char}
        </span>
      ))}
    </div>
  );
}

