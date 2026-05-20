import { PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

interface Props {
  name: string;
  photo?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
};

export function PetAvatar({ name, photo, size = "md", className }: Props) {
  const initial = name.trim().charAt(0).toUpperCase();
  const sizeClasses = SIZES[size];

  return (
    <ImageWithFallback
      src={photo}
      alt={name}
      className={cn(
        "rounded-full object-cover ring-1 ring-border",
        sizeClasses,
        className,
      )}
      fallbackClassName={cn(
        "rounded-full bg-secondary text-secondary-foreground ring-1 ring-border font-medium",
        sizeClasses,
        className,
      )}
      fallback={initial || <PawPrint className="h-5 w-5" />}
    />
  );
}
