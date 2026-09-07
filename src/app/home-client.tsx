"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";
import { Panel } from "@/components/ui/Panel";
import { ButtonLink } from "@/components/ui/Button";
import { RevealText } from "@/components/motion/RevealText";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { softSpring } from "@/lib/motion";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const utilities = [
  { title: "Text notepads", desc: "Freeform writing that saves the instant you stop typing." },
  { title: "Code notepads", desc: "Syntax-aware snippets, ready on your next machine." },
  { title: "Cross-device sync", desc: "Sign in anywhere - the same notepad, the same content." },
  { title: "Custom + OAuth auth", desc: "Email & password, or continue with GitHub / Google." },
];

export default function HomeClient() {
  const gridRef = useScrollReveal<HTMLDivElement>(".feature-card");
  const mockRef = useRef<HTMLDivElement>(null);

  // Idle float - the mock notepad breathes gently even at rest.
  useEffect(() => {
    if (!mockRef.current || prefersReducedMotion()) return;
    const tween = gsap.to(mockRef.current, {
      y: -10,
      duration: 2.6,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    return () => {
      tween.kill();
    };
  }, []);

  return (
    <div className="home">
      <BackgroundCanvas intensity={1} />
      <div className="home__scrim" aria-hidden />

      <header className="home__bar">
        <span className="home__brand">KlipBoard</span>
        <nav className="home__nav">
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary">
            Get started
          </ButtonLink>
        </nav>
      </header>

      <section className="home__hero">
        <div className="home__hero-copy">
          <p className="home__eyebrow">Your clipboard, everywhere</p>
          <RevealText
            as="h1"
            className="home__title"
            text="A clipboard you can feel yourself press."
          />
          <p className="home__lede">
            KlipBoard stores your notepads - text or code - with weight and give.
            Press save on one device, pick it up on the next.
          </p>
          <motion.div
            className="home__actions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...softSpring, delay: 0.5 }}
          >
            <ButtonLink href="/signup" variant="primary">
              Create a notepad
            </ButtonLink>
            <ButtonLink href="/login" variant="ghost">
              Sign in
            </ButtonLink>
          </motion.div>
        </div>

        <div ref={mockRef}>
          <Panel className="home__mock" hoverLift>
            <div className="home__mock-head">
              <span className="home__dot" />
              <span className="home__dot" />
              <span className="home__dot" />
              <span className="home__mock-title">release-notes.md</span>
            </div>
            <Panel inset className="home__mock-body">
              <p>## KlipBoard v0.1.1</p>
              <p>- Cross-device notepads</p>
              <p>- Text + code utilities</p>
              <p>- Custom auth + OAuth</p>
            </Panel>
          </Panel>
        </div>
      </section>

      <section ref={gridRef} className="home__grid">
        {utilities.map((u) => (
          <Panel key={u.title} className="feature-card" hoverLift>
            <h3>{u.title}</h3>
            <p>{u.desc}</p>
          </Panel>
        ))}
      </section>

      <footer className="home__footer">
        <Panel className="home__footer-panel">
          <span>KlipBoard - your clipboard, everywhere</span>
          <ButtonLink href="/signup" variant="primary">
            Get started
          </ButtonLink>
        </Panel>
        <p className="home__credit">
          Built by arindal -{" "}
          <a href="https://github.com/arindal1" target="_blank" rel="noreferrer">
            github.com/arindal1
          </a>
        </p>
      </footer>

      <style>{`
        .home { position: relative; min-height: 100vh; font-family: system-ui, sans-serif; overflow-x: hidden; }
        .home__scrim { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(to bottom, rgba(23,24,28,0.4), rgba(23,24,28,0.75) 65%, rgba(23,24,28,0.92)); }
        .home__bar, .home__hero, .home__grid, .home__footer { position: relative; z-index: 2; }

        .home__bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 20px clamp(16px,4vw,56px); }
        .home__brand { font-weight: 700; font-size: 20px; letter-spacing: -0.02em; }
        .home__nav { display: flex; flex-wrap: wrap; gap: 10px; }

        .home__hero { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: center; padding: clamp(24px,5vw,56px) clamp(16px,4vw,56px) clamp(48px,8vw,96px); max-width: 1280px; margin: 0 auto; }
        .home__eyebrow { color: #7ef2c9; font-size: 13px; letter-spacing: 0.04em; margin: 0 0 20px; }
        .home__title { font-size: clamp(2.2rem, 5.2vw, 3.9rem); line-height: 1.06; letter-spacing: -0.02em; margin: 0 0 24px; }
        .home__lede { max-width: 50ch; color: #b7b7c2; line-height: 1.65; margin: 0 0 32px; }
        .home__actions { display: flex; gap: 16px; flex-wrap: wrap; }

        .home__mock { max-width: 420px; padding: 4px; margin-left: auto; }
        .home__mock-head { display: flex; align-items: center; gap: 8px; padding: 14px 18px; }
        .home__dot { width: 9px; height: 9px; border-radius: 50%; background: #3a3b42; }
        .home__mock-title { margin-left: 10px; font-size: 12px; color: #9a9aa5; }
        .home__mock-body { margin: 0 10px 10px; padding: 20px; font-family: ui-monospace, monospace; font-size: 13px; line-height: 1.8; color: #cfd0d6; }
        .home__mock-body p { margin: 0; }

        .home__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 24px; padding: 0 clamp(16px,4vw,56px) clamp(48px,8vw,88px); max-width: 1280px; margin: 0 auto; }
        .feature-card { padding: 28px; }
        .feature-card h3 { margin: 0 0 10px; font-size: 1.1rem; }
        .feature-card p { margin: 0; color: #a8a8b3; font-size: 0.92rem; line-height: 1.55; }

        .home__footer { padding: 0 clamp(16px,4vw,56px) clamp(48px,6vw,72px); max-width: 1280px; margin: 0 auto; }
        .home__footer-panel { padding: 24px clamp(20px,4vw,32px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; font-size: 14px; }
        .home__credit { margin: 16px 0 0; text-align: center; font-size: 13px; color: #7c7c88; padding: 0 16px; }
        .home__credit a { color: #9a9aa5; text-decoration: underline; }

        @media (max-width: 860px) {
          .home__hero { grid-template-columns: 1fr; }
          .home__mock { margin-left: 0; }
        }

        @media (max-width: 480px) {
          .home__bar { padding: 16px; }
          .home__footer-panel { justify-content: center; text-align: center; }
        }
      `}</style>
    </div>
  );
}