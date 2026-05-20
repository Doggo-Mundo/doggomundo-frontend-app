import { AlertCircle } from "lucide-react";

interface Props {
  message?: string;
}

export function FormErrors({ message }: Props) {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
