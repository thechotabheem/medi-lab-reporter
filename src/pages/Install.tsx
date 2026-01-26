import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle2, Share, PlusSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/ui/page-transition";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
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
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, title: "Works Offline", description: "Access your reports even without internet" },
    { icon: Monitor, title: "Full Screen Experience", description: "No browser UI, feels like a native app" },
    { icon: Download, title: "Quick Access", description: "Launch directly from your home screen" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pb-safe max-w-2xl">
          <PageHeader
            title="Install MediLab"
            subtitle="Get the full app experience on your device"
          />

          {isInstalled ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 pt-6">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Already Installed!</h3>
                  <p className="text-muted-foreground">
                    MediLab is installed on your device. You can launch it from your home screen.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Features */}
              <div className="grid gap-4 mb-8">
                {features.map((feature) => (
                  <Card key={feature.title} className="border-border/50">
                    <CardContent className="flex items-center gap-4 pt-6">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Install Instructions */}
              {isIOS ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share className="h-5 w-5" />
                      Install on iOS
                    </CardTitle>
                    <CardDescription>
                      Follow these steps to add MediLab to your home screen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tap the Share button</p>
                        <p className="text-sm text-muted-foreground">
                          Located at the bottom of Safari (square with arrow pointing up)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        2
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">Tap "Add to Home Screen"</p>
                        <PlusSquare className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Tap "Add"</p>
                        <p className="text-sm text-muted-foreground">
                          Confirm by tapping Add in the top right corner
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : deferredPrompt ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Ready to Install</CardTitle>
                    <CardDescription>
                      Click the button below to install MediLab on your device
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleInstall} size="lg" className="w-full">
                      <Download className="mr-2 h-5 w-5" />
                      Install MediLab
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Install Instructions</CardTitle>
                    <CardDescription>
                      Add MediLab to your home screen for the best experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      On Chrome or Edge, look for the install icon in the address bar or use the browser menu
                      and select "Install app" or "Add to Home Screen".
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <a href="/dashboard">Continue to Dashboard →</a>
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Install;
