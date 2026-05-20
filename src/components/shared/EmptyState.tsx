import type { ReactNode } from "react";
import { InboxIcon } from "lucide-react";

interface Props {
  icon?: ReactNode;
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {illustration ? (
        <div className="mb-4 w-40 max-w-[60%]">{illustration}</div>
      ) : (
        <div className="mb-4 text-muted-foreground">
          {icon ?? <InboxIcon className="h-12 w-12" />}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
