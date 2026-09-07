"use client";

import { useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="status-page">
      <Panel className="status-page__panel">
        <p className="status-page__code">Error</p>
        <h1>Something went wrong</h1>
        <p className="status-page__lede">
          An unexpected error occurred. You can try again or head back home.
        </p>
        <div className="status-page__actions">
          <Button variant="primary" onClick={() => reset()}>
            Try again
          </Button>
          <ButtonLink href="/" variant="ghost">
            Back home
          </ButtonLink>
        </div>
      </Panel>

      <style>{`
        .status-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: system-ui, sans-serif; }
        .status-page__panel { max-width: 460px; padding: 48px 40px; text-align: center; }
        .status-page__code { margin: 0 0 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; color: var(--accent); }
        .status-page__panel h1 { margin: 0 0 12px; font-size: 1.6rem; }
        .status-page__lede { margin: 0 0 28px; color: var(--muted); line-height: 1.6; }
        .status-page__actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      `}</style>
    </main>
  );
}