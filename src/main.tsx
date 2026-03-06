// Initialize Sentry error monitoring early
import { initSentry } from "@/lib/sentry";
initSentry();

// Initialize PWA install store early to capture beforeinstallprompt
import "@/lib/pwaInstall";

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
