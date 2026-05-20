import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "md" | "lg";
}

const CONFETTI_PIECES = [
  { dx: "-80px", dy: "-120px", rot: "200deg", color: "#69B4F2", delay: "0ms" },
  { dx: "60px", dy: "-130px", rot: "-180deg", color: "#222D56", delay: "60ms" },
  { dx: "-110px", dy: "-70px", rot: "150deg", color: "#DFEEFB", delay: "120ms" },
  { dx: "100px", dy: "-90px", rot: "-220deg", color: "#69B4F2", delay: "80ms" },
  { dx: "-40px", dy: "-150px", rot: "120deg", color: "#222D56", delay: "160ms" },
  { dx: "40px", dy: "-160px", rot: "-140deg", color: "#69B4F2", delay: "40ms" },
  { dx: "-140px", dy: "-40px", rot: "90deg", color: "#DFEEFB", delay: "200ms" },
  { dx: "130px", dy: "-50px", rot: "-100deg", color: "#222D56", delay: "180ms" },
  { dx: "0px", dy: "-180px", rot: "360deg", color: "#69B4F2", delay: "100ms" },
  { dx: "-70px", dy: "-20px", rot: "-60deg", color: "#DFEEFB", delay: "220ms" },
];

export function SuccessCheckmark({ className, size = "md" }: Props) {
  const stageSize = size === "lg" ? "h-48 w-48" : "h-40 w-40";
  const checkSize = size === "lg" ? "h-36 w-36" : "h-32 w-32";

  return (
    <div
      className={cn("relative flex items-center justify-center", stageSize, className)}
      aria-hidden="true"
    >
      {CONFETTI_PIECES.map((piece, i) => (
        <span
          key={i}
          className="animate-confetti absolute h-2 w-2 rounded-sm"
          style={{
            backgroundColor: piece.color,
            animationDelay: piece.delay,
            ["--dx" as string]: piece.dx,
            ["--dy" as string]: piece.dy,
            ["--rot" as string]: piece.rot,
          }}
        />
      ))}

      <svg viewBox="0 0 100 100" className={cn("animate-circle-pop", checkSize)}>
        <circle cx="50" cy="50" r="46" fill="var(--primary)" />
        <path
          className="animate-check-draw"
          d="M 30 52 L 45 66 L 72 38"
          fill="none"
          stroke="var(--primary-foreground)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
