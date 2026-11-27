import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { installPreloadErrorHandler } from "./lib/chunk-reload";
import { initSentry } from "./lib/sentry";
import { applyEnvironmentTitle } from "./lib/environment";

// Must happen before React mounts so any render-time error is captured.
initSentry();
installPreloadErrorHandler();
applyEnvironmentTitle();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
