import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MonitorSmartphone, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export const PWAInstallPrompt = () => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();

  const tooltipMessage = isInstalled 
    ? "App Installed" 
    : canInstall 
      ? "Install App" 
      : "Install not available";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={canInstall ? triggerInstall : undefined}
            disabled={!canInstall}
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
  );
};
