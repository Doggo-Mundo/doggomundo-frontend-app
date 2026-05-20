import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthLayout({ title, description, footer, children }: Props) {
  return (
    <div
      className="flex min-h-dvh items-center justify-center px-4 py-8"
      style={{
        backgroundColor: "var(--surface-soft)",
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2rem)",
      }}
    >
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader className="text-center">
          <Link to="/login" className="mx-auto mb-2 inline-block">
            <img src="/doggo-logo.png" alt="Doggo Mundo" className="h-16 w-auto" />
          </Link>
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer && (
            <div className="pt-2 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
