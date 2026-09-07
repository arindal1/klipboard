import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = {
  title: "Page not found - KlipBoard",
};

export default function NotFound() {
  return (
    <main className="status-page">
      <Panel className="status-page__panel">
        <p className="status-page__code">404</p>
        <h1>Page not found</h1>
        <p className="status-page__lede">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="status-page__actions">
          <ButtonLink href="/" variant="primary">
            Back home
          </ButtonLink>
          <Link href="/dashboard" className="status-page__link">
            Go to dashboard
          </Link>
        </div>
      </Panel>

      <style>{`
        .status-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: system-ui, sans-serif; }
        .status-page__panel { max-width: 460px; padding: 48px 40px; text-align: center; }
        .status-page__code { margin: 0 0 8px; font-size: 14px; font-weight: 700; letter-spacing: 0.08em; color: var(--accent); }
        .status-page__panel h1 { margin: 0 0 12px; font-size: 1.6rem; }
        .status-page__lede { margin: 0 0 28px; color: var(--muted); line-height: 1.6; }
        .status-page__actions { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .status-page__link { font-size: 14px; color: var(--muted); text-decoration: underline; }
      `}</style>
    </main>
  );
}