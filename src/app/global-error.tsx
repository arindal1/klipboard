"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#17181c",
            color: "#ececf0",
          }}
        >
          <div style={{ maxWidth: 460, textAlign: "center" }}>
            <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: "#9a9aa5", marginBottom: 28 }}>
              A critical error occurred while loading KlipBoard.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "14px 26px",
                borderRadius: 999,
                border: "none",
                background: "#7ef2c9",
                color: "#0d1210",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}