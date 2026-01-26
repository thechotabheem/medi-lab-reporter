import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const wasDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const daysSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setDismissed(true);
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-prompt-dismissed", new Date().toISOString());
  };

  if (!showPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 pb-safe">
      <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Install MediLab</h3>
            <p className="text-sm text-muted-foreground">
              Add to home screen for quick access and offline use
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDismiss}>
            Not Now
          </Button>
          <Button size="sm" className="flex-1" onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};
