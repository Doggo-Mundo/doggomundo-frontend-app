import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  fallback: ReactNode;
  fallbackClassName?: string;
}

export function ImageWithFallback({
  src,
  alt,
  className,
  fallback,
  fallbackClassName,
}: Props) {
  // Track which URL failed so that when `src` changes we automatically retry
  // without needing to reset via an effect.
  const [erroredSrc, setErroredSrc] = useState<string | null>(null);

  const showFallback = !src || erroredSrc === src;

  if (showFallback) {
    return (
      <div
        className={cn("flex items-center justify-center", fallbackClassName)}
        aria-hidden="true"
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setErroredSrc(src)}
    />
  );
}
