import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-3 focus:ring-ring/50"
      >
        Saltar al contenido
      </a>
      <TopBar />
      <main
        id="main-content"
        className="flex-1 px-4 py-4 md:py-6"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)",
        }}
      >
        <div className="mx-auto w-full max-w-4xl lg:max-w-6xl">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
