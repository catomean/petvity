// Next.js server startup hook — loads the runtime-appropriate Sentry init.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors from nested React Server Components to Sentry.
export const onRequestError = Sentry.captureRequestError;
