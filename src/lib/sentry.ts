import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.info('[Sentry] No DSN configured — error monitoring disabled. Set VITE_SENTRY_DSN to enable.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // HIPAA-safe: mask patient data in replays
        blockAllMedia: true,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: 0.2, // 20% of transactions
    // Session replay for crash debugging
    replaysSessionSampleRate: 0.0, // Don't record normal sessions
    replaysOnErrorSampleRate: 1.0, // Always record sessions with errors
    // Filter sensitive data
    beforeSend(event) {
      // Strip any PII from error reports
      if (event.request?.data) {
        event.request.data = '[Filtered]';
      }
      return event;
    },
  });
}

export { Sentry };
