import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<"div"> {
  value: number;
}

export function Progress({ value, className, ...props }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
