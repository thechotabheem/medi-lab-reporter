
<context>
User reports they still can’t install the app on Desktop Chrome from the published URL. The UI tooltip shows “Install not available” (meaning our app did not receive the `beforeinstallprompt` event, so `canInstall=false`), and they’re blocked.

We verified via remote fetch that:
- `manifest.webmanifest` exists and is valid, includes `scope:"/"` and `start_url:"/dashboard"`.
- `sw.js` exists and `registerSW.js` registers `/sw.js` with `scope:'/'`.
- `/dashboard` returns HTTP 200 (SPA rewrite works).

So this is not a “missing manifest” situation. The most likely causes are:
1) Chrome is not firing `beforeinstallprompt` (heuristics, timing, user previously dismissed, incognito/guest/managed policy), or
2) We are missing the event due to timing (listener not registered early enough), or
3) Service worker is not actually controlling the page at runtime (registration succeeded but no controller yet / needs reload), which can suppress installability UI.

Goal: make installation reliably possible when it truly is installable, and when it’s not, show a clear “why” with actionable next steps.
</context>

<goals>
1) Make our “Install” button work whenever the app is installable (don’t miss `beforeinstallprompt`).
2) Add a self-checking diagnostics panel (especially on /install) that explains exactly what is blocking install on the user’s device.
3) Update Chrome desktop instructions to the current menu path and add “no-install” troubleshooting steps (incognito/managed policy/service-worker not controlling yet).
</goals>

<solution-overview>
A) Centralize PWA install state in a small singleton “install store” that attaches event listeners immediately (module scope) and exposes state + a `promptInstall()` function. This prevents missing `beforeinstallprompt` and keeps state consistent across pages/components.

B) Add a “PWA Status” section to `/install` that checks:
- Secure context (HTTPS)
- Manifest link present
- Service worker supported
- Service worker registration exists
- Service worker is controlling the page (`navigator.serviceWorker.controller`)
- Whether the browser has provided `beforeinstallprompt`
- Whether the app appears installed (display-mode standalone)

C) Improve UX messaging:
- Replace “Install not available” tooltip with something actionable like “Install (open guide)” and show status text in the dialog.
- Update Desktop Chrome manual steps: “3 dots → Save and share → Install MediLab…” (Chrome UI changed from older “Install app”).

D) Small manifest hardening (optional but recommended):
- Change `start_url` to `/` and add `id: "/"` to reduce edge-case installability issues and ensure stable app identity, while still redirecting to `/dashboard` in-app.
</solution-overview>

<implementation-steps>
1) Create a centralized PWA install store
   - Add a new module (example: `src/lib/pwaInstall.ts`) that:
     - Defines `BeforeInstallPromptEvent` type
     - Holds internal state:
       - `deferredPrompt: BeforeInstallPromptEvent | null`
       - `isInstalled: boolean`
       - `lastEventAt: number | null` (optional, for debugging)
     - Attaches listeners at module load:
       - `beforeinstallprompt`: `preventDefault()`, store event, notify subscribers
       - `appinstalled`: set installed, clear prompt, notify
       - Also check `matchMedia('(display-mode: standalone)')` initially and on change
     - Exposes:
       - `getSnapshot()` -> `{ canInstall, isInstalled, hasPrompt, ... }`
       - `subscribe(listener)` for React
       - `promptInstall()` that calls `deferredPrompt.prompt()` (when available)

2) Refactor `usePWAInstall` to use the install store
   - Update `src/hooks/usePWAInstall.ts` to use React 18 `useSyncExternalStore` to read from the store.
   - Keep the returned API the same (`canInstall`, `isInstalled`, `triggerInstall`) so existing components don’t need big rewrites.

3) Ensure early initialization
   - Import the install store once at app startup to guarantee listeners are attached before any route components render.
   - Practical approach:
     - In `src/main.tsx`, add `import "@/lib/pwaInstall";` (side-effect import) OR import a named `initPWAInstall()` function and call it before rendering.

4) Add diagnostics UI to `/install`
   - Update `src/pages/Install.tsx`:
     - Replace its local `beforeinstallprompt` listener with `usePWAInstall()` to avoid duplicated logic and missed events.
     - Add a “PWA Status” card that displays:
       - `HTTPS / Secure context`: `window.isSecureContext`
       - `Service worker supported`: `'serviceWorker' in navigator`
       - `Service worker registered`: `navigator.serviceWorker.getRegistration()` (async)
       - `Service worker controlling this page`: `!!navigator.serviceWorker.controller`
       - `Manifest present`: `!!document.querySelector('link[rel="manifest"]')`
       - `Install prompt available`: `canInstall` (from hook)
     - Add a “Fix common issues” section:
       - “Not available in Incognito/Guest windows”
       - “If service worker is registered but not controlling: refresh once”
       - “If your browser is managed by your workplace/school, installs may be disabled”

5) Improve `PWAInstallPrompt` messaging
   - Update `src/components/PWAInstallPrompt.tsx`:
     - Tooltip:
       - If not installed and `canInstall=false`: show “Install (open guide)” instead of “Install not available”
     - Dialog content:
       - Update Desktop Chrome steps to: “Menu (⋮) → Save and share → Install MediLab…”
       - Add a one-liner: “If you don’t see Install in the menu, open /install to view status and fixes.”
     - Optionally show quick status lines in the dialog (from the hook/store), e.g. “Service worker: active / needs reload”.

6) (Recommended) Harden manifest identity / start URL
   - Update `vite.config.ts`:
     - `manifest.start_url` from `"/dashboard"` to `"/"`
     - Add `manifest.id = "/"` (stable identity)
     - Keep `scope:"/"` (already present in generated manifest)
   - Rationale: Reduces edge cases where Chrome treats the app as not installable or as a different app identity across updates.

7) Verification checklist (what we will test after implementation)
   - Desktop Chrome, normal window:
     - Visiting published URL → `/install` shows:
       - Secure context: true
       - SW supported: true
       - SW registered: true
       - SW controlling: true (or becomes true after one refresh)
     - If installable, `canInstall` becomes true and clicking Install triggers native prompt.
     - If not installable, diagnostics clearly show which requirement is failing and how to fix.
   - Confirm the install menu item appears when criteria are met.
</implementation-steps>

<files-to-change>
- src/main.tsx (initialize install store early)
- src/hooks/usePWAInstall.ts (refactor to use centralized store)
- src/lib/pwaInstall.ts (new)
- src/pages/Install.tsx (use hook + add diagnostics)
- src/components/PWAInstallPrompt.tsx (improve tooltip/instructions + optional status)
- vite.config.ts (optional: start_url/id adjustments)
</files-to-change>

<risks-and-mitigations>
- Risk: Some environments (managed Chrome policies) permanently block PWA installs.
  - Mitigation: Diagnostics UI will explicitly surface that install prompt/menu is unavailable and provide the likely reason.
- Risk: Service worker registers but doesn’t control until reload.
  - Mitigation: Diagnostics will detect `navigator.serviceWorker.controller` and advise a single refresh.
- Risk: Duplicate SW registrations if we both inject and manually register.
  - Mitigation: If we opt into manual registration, we will set `VitePWA({ injectRegister: null })` (or equivalent) to avoid duplicate injection, and rely on `virtual:pwa-register` in `main.tsx`.
</risks-and-mitigations>

<acceptance-criteria>
- Users on Desktop Chrome (published URL, normal window) can install using the app’s install button once Chrome deems it installable.
- If installation is blocked, /install clearly shows what’s blocking and what to do next (refresh, exit incognito, etc.).
- Tooltip and instructions no longer imply a dead-end (“Install not available”) without guidance.
</acceptance-criteria>
