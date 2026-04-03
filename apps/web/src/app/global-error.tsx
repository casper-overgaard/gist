"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-semibold text-neutral-200">Something went wrong</h2>
          <p className="text-sm text-neutral-500">This error has been reported automatically.</p>
        </div>
      </body>
    </html>
  );
}
