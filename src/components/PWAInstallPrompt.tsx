import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonitorSmartphone, Check, ExternalLink } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const PWAInstallPrompt = () => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const tooltipMessage = isInstalled 
    ? "App Installed" 
    : canInstall 
      ? "Install App" 
      : "Install not available";

  const handleClick = () => {
    if (canInstall) {
      triggerInstall();
    } else if (!isInstalled) {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleClick}
              disabled={isInstalled}
            >
              {isInstalled ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <MonitorSmartphone className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install MediLab Reporter</DialogTitle>
            <DialogDescription>
              To install this app, you need to open it directly in a supported browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">Open the app directly:</p>
              <a
                href="https://medi-lab-reporter.lovable.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                medi-lab-reporter.lovable.app
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Then install using:</p>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">Chrome/Edge:</span>
                  <span>Click the install icon in the address bar, or Menu → "Install app"</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">Safari (iOS):</span>
                  <span>Tap Share → "Add to Home Screen"</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">Android:</span>
                  <span>Tap Menu (⋮) → "Add to Home Screen" or "Install app"</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: The install button only works when opening the app directly in Chrome or Edge browsers, not in embedded previews.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
