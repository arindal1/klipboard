"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { softSpring } from "@/lib/motion";

type PaletteItem = { id: string; title: string; kind: "TEXT" | "CODE" };

/**
 * Cmd/Ctrl+K quick-switch palette. Filters notepads by title as you type.
 * Hidden Easter egg: typing "party" triggers `onEasterEgg` (a background
 * animation burst) instead of filtering - a fun, discoverable shortcut
 * baked into the palette rather than a separate hidden key combo.
 */
export function CommandPalette({
  open,
  items,
  onSelect,
  onClose,
  onEasterEgg,
}: {
  open: boolean;
  items: PaletteItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
  onEasterEgg: () => void;
}) {
  const [query, setQuery] = useState("");
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset the query when the palette transitions to open - computed
  // during render (React's documented escape hatch for "adjusting state
  // when a prop changes") rather than in an effect, to avoid an extra
  // cascading render.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery("");
  }

  useEffect(() => {
    if (query.trim().toLowerCase() === "party") {
      onEasterEgg();
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="palette"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={softSpring}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              className="palette__input"
              placeholder="Jump to a notepad…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="palette__list">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                  >
                    <span>{item.title || "Untitled"}</span>
                    <span className="palette__kind">{item.kind}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && <li className="palette__empty">No matches.</li>}
            </ul>
          </motion.div>
          <style>{`
            .palette-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(10,11,13,0.6); display: flex; align-items: flex-start; justify-content: center; padding-top: 14vh; }
            .palette { width: min(480px, 90vw); background: var(--surface); border-radius: 20px; box-shadow: var(--shadow-out-lg); overflow: hidden; }
            .palette__input { width: 100%; background: var(--surface-sunken); border: none; padding: 16px 20px; color: var(--fg); font-size: 1rem; outline: none; font-family: inherit; }
            .palette__list { list-style: none; margin: 0; padding: 8px; max-height: 320px; overflow-y: auto; }
            .palette__list button { width: 100%; display: flex; justify-content: space-between; padding: 10px 12px; background: none; border: none; color: var(--fg); cursor: pointer; border-radius: 10px; font-family: inherit; font-size: 0.9rem; }
            .palette__list button:hover { background: var(--surface-sunken); }
            .palette__kind { color: var(--muted); font-size: 0.7rem; }
            .palette__empty { color: var(--muted); font-size: 0.85rem; padding: 10px 12px; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}