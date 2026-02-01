import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, CheckCircle2, Share, PlusSquare, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageTransition } from "@/components/ui/page-transition";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { getDiagnostics } from "@/lib/pwaInstall";

interface DiagnosticsState {
  isSecureContext: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerControlling: boolean;
  manifestPresent: boolean;
  installPromptAvailable: boolean;
  isInstalled: boolean;
}

const Install = () => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Load diagnostics
    getDiagnostics().then(setDiagnostics);
  }, []);

  const handleInstall = async () => {
    await triggerInstall();
  };

  const refreshDiagnostics = async () => {
    const newDiagnostics = await getDiagnostics();
    setDiagnostics(newDiagnostics);
  };

  const features = [
    { icon: Smartphone, title: "Works Offline", description: "Access your reports even without internet" },
    { icon: Monitor, title: "Full Screen Experience", description: "No browser UI, feels like a native app" },
    { icon: Download, title: "Quick Access", description: "Launch directly from your home screen" },
  ];

  const StatusIcon = ({ value }: { value: boolean }) => (
    value ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    )
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-background dashboard-bg">
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
              ) : canInstall ? (
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
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground">On Chrome or Edge:</p>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          1
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click the menu icon (⋮) in the top right corner
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          2
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Select "Save and share" → "Install MediLab..."
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          3
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click "Install" in the dialog that appears
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground pt-2">
                      Tip: You may also see an install icon in the address bar on supported browsers.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* PWA Diagnostics Panel */}
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      PWA Status
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                    >
                      {showDiagnostics ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>
                  <CardDescription>
                    {diagnostics?.installPromptAvailable 
                      ? "Ready to install! Click the button above."
                      : "Check why the install button might not be available"}
                  </CardDescription>
                </CardHeader>
                {showDiagnostics && diagnostics && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Secure context (HTTPS)</span>
                        <StatusIcon value={diagnostics.isSecureContext} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Service Worker supported</span>
                        <StatusIcon value={diagnostics.serviceWorkerSupported} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Service Worker registered</span>
                        <StatusIcon value={diagnostics.serviceWorkerRegistered} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Service Worker controlling page</span>
                        <StatusIcon value={diagnostics.serviceWorkerControlling} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Manifest present</span>
                        <StatusIcon value={diagnostics.manifestPresent} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Install prompt available</span>
                        <StatusIcon value={diagnostics.installPromptAvailable} />
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshDiagnostics}
                      className="w-full"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status
                    </Button>

                    {/* Common Issues */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Common Issues</h4>
                      <ul className="text-xs text-muted-foreground space-y-2">
                        {!diagnostics.serviceWorkerControlling && diagnostics.serviceWorkerRegistered && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span>Service worker is registered but not controlling. Try refreshing the page once.</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>Install is not available in Incognito or Guest windows.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>Managed browsers (workplace/school) may have install disabled.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>Chrome requires some engagement with the site before offering install.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span>•</span>
                          <span>If you previously dismissed the install prompt, Chrome may not show it again for a while.</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>
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
