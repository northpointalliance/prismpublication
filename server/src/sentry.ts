import * as Sentry from "@sentry/node";

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // eslint-disable-next-line no-console
    console.log("[sentry] SENTRY_DSN not set — Sentry disabled");
    return;
  }
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
  });
}

export function captureException(err: unknown): void {
  Sentry.captureException(err);
}

export function captureMessage(msg: string): void {
  Sentry.captureMessage(msg);
}

export { Sentry };
