import { User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "./ImageWithFallback";

interface Props {
  name: string;
  photo?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  xs: "h-7 w-7 text-[11px]",
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
};

function initialFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

export function UserAvatar({ name, photo, size = "md", className }: Props) {
  const initial = initialFromName(name);
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
      fallback={initial || <UserIcon className="h-5 w-5" />}
    />
  );
}
