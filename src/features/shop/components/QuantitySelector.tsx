import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: Props) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  const btnSize =
    size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-sm" : "text-base";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border bg-background",
        className,
      )}
      role="group"
      aria-label="Selector de cantidad"
    >
      <button
        type="button"
        onClick={() => canDecrease && onChange(value - 1)}
        disabled={!canDecrease}
        aria-label="Reducir cantidad"
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          btnSize,
          canDecrease
            ? "hover:bg-muted"
            : "text-muted-foreground/40 cursor-not-allowed",
        )}
      >
        <Minus className={iconSize} />
      </button>

      <span
        className={cn(
          "min-w-[2ch] text-center font-medium tabular-nums",
          textSize,
        )}
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => canIncrease && onChange(value + 1)}
        disabled={!canIncrease}
        aria-label="Aumentar cantidad"
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          btnSize,
          canIncrease
            ? "hover:bg-muted"
            : "text-muted-foreground/40 cursor-not-allowed",
        )}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}
