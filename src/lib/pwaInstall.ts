/**
 * Centralized PWA Install Store
 * Attaches event listeners at module load to ensure we never miss the beforeinstallprompt event
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  hasPrompt: boolean;
  lastEventAt: number | null;
}

// Internal state
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;
let lastEventAt: number | null = null;
const listeners = new Set<() => void>();

// Memoized snapshot to prevent infinite re-renders
let cachedSnapshot: PWAInstallState = {
  canInstall: false,
  isInstalled: false,
  hasPrompt: false,
  lastEventAt: null,
};

// Check if already installed via display-mode
const checkInstalled = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
};

// Update the cached snapshot
const updateSnapshot = () => {
  const newCanInstall = !!deferredPrompt && !isInstalled;
  const newHasPrompt = !!deferredPrompt;
  
  // Only create a new object if values actually changed
  if (
    cachedSnapshot.canInstall !== newCanInstall ||
    cachedSnapshot.isInstalled !== isInstalled ||
    cachedSnapshot.hasPrompt !== newHasPrompt ||
    cachedSnapshot.lastEventAt !== lastEventAt
  ) {
    cachedSnapshot = {
      canInstall: newCanInstall,
      isInstalled,
      hasPrompt: newHasPrompt,
      lastEventAt,
    };
  }
};

// Initialize installed state
isInstalled = checkInstalled();
updateSnapshot();

// Notify all subscribers
const notify = () => {
  updateSnapshot();
  listeners.forEach((listener) => listener());
};

// Listen for beforeinstallprompt as early as possible
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    lastEventAt = Date.now();
    console.log("[PWA] beforeinstallprompt captured at", new Date().toISOString());
    notify();
  });

  window.addEventListener("appinstalled", () => {
    console.log("[PWA] App installed");
    isInstalled = true;
    deferredPrompt = null;
    notify();
  });

  // Listen for display-mode changes (if user uninstalls/reinstalls)
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", (e) => {
    isInstalled = e.matches;
    if (isInstalled) {
      deferredPrompt = null;
    }
    notify();
  });
}

/**
 * Get the current PWA install state snapshot (memoized)
 */
export function getSnapshot(): PWAInstallState {
  return cachedSnapshot;
}

/**
 * Subscribe to state changes (for React useSyncExternalStore)
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Trigger the install prompt
 * @returns true if user accepted, false if dismissed or no prompt available
 */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log("[PWA] No deferred prompt available");
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] User choice:", outcome);

    if (outcome === "accepted") {
      isInstalled = true;
    }
    deferredPrompt = null;
    notify();
    return outcome === "accepted";
  } catch (error) {
    console.error("[PWA] Error during install prompt:", error);
    return false;
  }
}

/**
 * Check various PWA requirements for diagnostics
 */
export async function getDiagnostics(): Promise<{
  isSecureContext: boolean;
  serviceWorkerSupported: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerControlling: boolean;
  manifestPresent: boolean;
  installPromptAvailable: boolean;
  isInstalled: boolean;
}> {
  const state = getSnapshot();
  
  let serviceWorkerRegistered = false;
  let serviceWorkerControlling = false;

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      serviceWorkerRegistered = !!registration;
      serviceWorkerControlling = !!navigator.serviceWorker.controller;
    } catch {
      // Registration check failed
    }
  }

  return {
    isSecureContext: typeof window !== "undefined" ? window.isSecureContext : false,
    serviceWorkerSupported: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    serviceWorkerRegistered,
    serviceWorkerControlling,
    manifestPresent: typeof document !== "undefined" ? !!document.querySelector('link[rel="manifest"]') : false,
    installPromptAvailable: state.canInstall,
    isInstalled: state.isInstalled,
  };
}
