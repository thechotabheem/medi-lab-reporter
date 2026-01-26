import { useSyncExternalStore } from "react";
import { getSnapshot, subscribe, promptInstall } from "@/lib/pwaInstall";

export function usePWAInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    canInstall: state.canInstall,
    isInstalled: state.isInstalled,
    triggerInstall: promptInstall,
  };
}
