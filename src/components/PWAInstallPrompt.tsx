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
import { MonitorSmartphone, Check, ExternalLink, ArrowRight } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Link } from "react-router-dom";

export const PWAInstallPrompt = () => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [showInstructions, setShowInstructions] = useState(false);

  const tooltipMessage = isInstalled 
    ? "App Installed" 
    : canInstall 
      ? "Install App" 
      : "Install Guide";

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
              To install this app, use your browser's menu or open it directly in a supported browser.
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
                  <span>Menu (⋮) → "Save and share" → "Install MediLab..."</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">Safari (iOS):</span>
                  <span>Tap Share → "Add to Home Screen"</span>
                </div>
                
                <div className="flex gap-2">
                  <span className="font-medium text-foreground">Android:</span>
                  <span>Menu (⋮) → "Install app" or "Add to Home Screen"</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Note: The install button works when Chrome is ready to offer installation. If you don't see the option, visit the install page to check your PWA status.
            </p>

            <div className="pt-2 border-t">
              <Button variant="outline" className="w-full" asChild onClick={() => setShowInstructions(false)}>
                <Link to="/install">
                  View Full Installation Guide & Status
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
