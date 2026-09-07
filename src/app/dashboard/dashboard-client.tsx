"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { BackgroundCanvas } from "@/components/three/BackgroundCanvas";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ToastStack, type ToastItem } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { EmptyState } from "@/components/motion/EmptyState";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { useTypingActivity } from "@/hooks/useTypingActivity";
import { randomEmptyDashboardTip } from "@/lib/tips";
import { playSaveChime, triggerSaveHaptic } from "@/lib/feedback";

type Notepad = {
  id: string;
  title: string;
  content: string;
  kind: "TEXT" | "CODE";
  language: string | null;
  tags: string[];
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

const ACCENT_PRESETS = ["#7ef2c9", "#7ecbf2", "#f2c97e", "#f27e9e", "#b47ef2"];
const AUTOSAVE_DELAY_MS = 1200;
const SOUND_PREF_KEY = "klip:sound-feedback";
const SOUND_PREF_EVENT = "klip:sound-feedback-changed";

function subscribeSoundPref(onChange: () => void) {
  window.addEventListener(SOUND_PREF_EVENT, onChange);
  return () => window.removeEventListener(SOUND_PREF_EVENT, onChange);
}
function getSoundPrefSnapshot() {
  return window.localStorage.getItem(SOUND_PREF_KEY) === "1";
}
function getSoundPrefServerSnapshot() {
  return false;
}

export default function DashboardClient({
  initialNotepads,
  userName,
}: {
  initialNotepads: Notepad[];
  userName: string;
}) {
  const [notepads, setNotepads] = useState(initialNotepads);
  const [activeId, setActiveId] = useState<string | null>(initialNotepads[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"" | "TEXT" | "CODE">("");
  const [filtersTouched, setFiltersTouched] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [backgroundIntensity, setBackgroundIntensity] = useState(0.35);
  const [emptyTip] = useState(randomEmptyDashboardTip);
  const [wrapEnabled, setWrapEnabled] = useState(true);

  const listRef = useStaggerReveal<HTMLUListElement>([notepads.length]);
  const { activityRef, bump } = useTypingActivity();
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const soundEnabled = useSyncExternalStore(
    subscribeSoundPref,
    getSoundPrefSnapshot,
    getSoundPrefServerSnapshot
  );

  const active = useMemo(
    () => notepads.find((n) => n.id === activeId) ?? null,
    [notepads, activeId]
  );
  const currentContent = draftContent ?? active?.content ?? "";

  // Grow the editor to fit its content (page scrolls instead of a nested
  // scrollbar) whenever the text, active notepad, or wrap mode changes -
  // also re-measured on resize, since wrapped line counts depend on width.
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    function resize() {
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [currentContent, wrapEnabled, active?.id]);

  function pushToast(message: string, kind: ToastItem["kind"] = "success") {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2400);
  }

  // Full-text search + kind filter - refetch from the server (Postgres
  // ILIKE) as the query changes, debounced. Skipped until the user
  // actually touches search/filter so the initial SSR-loaded list isn't
  // immediately re-fetched for nothing.
  useEffect(() => {
    if (!filtersTouched) return;
    const handle = setTimeout(async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      if (kindFilter) params.set("kind", kindFilter);
      const res = await fetch(`/api/notepads?${params.toString()}`);
      if (!res.ok) return;
      const { notepads: results } = await res.json();
      setNotepads(results);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, kindFilter, filtersTouched]);

  async function createNotepad(kind: "TEXT" | "CODE") {
    const res = await fetch("/api/notepads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled", kind }),
    });
    if (!res.ok) return;
    const { notepad } = await res.json();
    setNotepads((prev) => [notepad, ...prev]);
    setActiveId(notepad.id);
    setDraftContent("");
  }

  async function performSave(showFeedback: boolean) {
    if (!active) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notepads/${active.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent }),
      });
      setSaving(false);

      if (res.headers.get("X-Queued-Offline") === "true") {
        setDraftContent(null);
        if (showFeedback) pushToast("Saved offline - will sync when back online");
        return;
      }
      if (!res.ok) {
        if (showFeedback) pushToast("Save failed", "error");
        return;
      }

      const { notepad } = await res.json();
      setNotepads((prev) => prev.map((n) => (n.id === notepad.id ? notepad : n)));
      setDraftContent(null);

      if (showFeedback) {
        pushToast("Saved");
        if (soundEnabled) {
          playSaveChime();
          triggerSaveHaptic();
        }
      }
    } catch {
      setSaving(false);
      if (showFeedback) pushToast("Save failed - check connection", "error");
    }
  }

  const performSaveRef = useRef(performSave);
  const createNotepadRef = useRef(createNotepad);
  useEffect(() => {
    performSaveRef.current = performSave;
    createNotepadRef.current = createNotepad;
  });

  // Debounced autosave: edits sync automatically after a short idle pause
  // instead of requiring a manual Save press - reverses the earlier
  // no-autosave decision (see docs/memorybank.md ADR). Manual Save stays
  // available for an immediate, feedback-confirmed save.
  useEffect(() => {
    if (draftContent === null || !active) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      performSaveRef.current(false);
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [draftContent, active]);

  async function renameActive(title: string) {
    if (!active) return;
    const res = await fetch(`/api/notepads/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) return;
    const { notepad } = await res.json();
    setNotepads((prev) => prev.map((n) => (n.id === notepad.id ? notepad : n)));
  }

  async function updateActiveTags(tagsInput: string) {
    if (!active) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await fetch(`/api/notepads/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    if (!res.ok) return;
    const { notepad } = await res.json();
    setNotepads((prev) => prev.map((n) => (n.id === notepad.id ? notepad : n)));
  }

  async function updateActiveColor(color: string | null) {
    if (!active) return;
    const res = await fetch(`/api/notepads/${active.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    if (!res.ok) return;
    const { notepad } = await res.json();
    setNotepads((prev) => prev.map((n) => (n.id === notepad.id ? notepad : n)));
  }

  async function deleteNotepad(id: string) {
    const res = await fetch(`/api/notepads/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setNotepads((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setDraftContent(null);
    }
  }

  function toggleSound() {
    const next = !soundEnabled;
    window.localStorage.setItem(SOUND_PREF_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(SOUND_PREF_EVENT));
  }

  // Hidden delight: typing "party" into the command palette (see
  // CommandPalette) calls this instead of filtering - a temporary
  // intensity spike on the generative background.
  function triggerEasterEggBurst() {
    if (burstTimer.current) clearTimeout(burstTimer.current);
    setBackgroundIntensity(2.5);
    burstTimer.current = setTimeout(() => setBackgroundIntensity(0.35), 2200);
  }

  // Global keyboard shortcuts: Cmd/Ctrl+S save, Cmd/Ctrl+N new notepad,
  // Cmd/Ctrl+K quick-switch palette.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        performSaveRef.current(true);
      } else if (key === "n") {
        e.preventDefault();
        createNotepadRef.current("TEXT");
      } else if (key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="dash">
      <BackgroundCanvas intensity={backgroundIntensity} activityRef={activityRef} />
      <div className="dash__scrim" aria-hidden />

      <CommandPalette
        open={paletteOpen}
        items={notepads.map((n) => ({ id: n.id, title: n.title, kind: n.kind }))}
        onSelect={(id) => {
          setActiveId(id);
          setDraftContent(null);
        }}
        onClose={() => setPaletteOpen(false)}
        onEasterEgg={triggerEasterEggBurst}
      />
      <ToastStack toasts={toasts} />

      <aside className="dash__sidebar">
        <Panel className="dash__user">
          <span>{userName}</span>
          <div className="dash__user-actions">
            <button
              className="dash__icon-btn"
              onClick={toggleSound}
              aria-pressed={soundEnabled}
              title="Toggle save sound/haptic feedback"
            >
              {soundEnabled ? "🔔" : "🔕"}
            </button>
            <Button onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</Button>
          </div>
        </Panel>

        <div className="dash__new">
          <Button variant="primary" onClick={() => createNotepad("TEXT")} className="dash__new-btn">
            + Text notepad
          </Button>
          <Button onClick={() => createNotepad("CODE")} className="dash__new-btn">
            + Code notepad
          </Button>
        </div>

        <Panel inset className="dash__search">
          <input
            className="dash__search-input"
            placeholder="Search notepads…"
            value={searchQuery}
            onChange={(e) => {
              setFiltersTouched(true);
              setSearchQuery(e.target.value);
            }}
          />
          <select
            className="dash__search-select"
            value={kindFilter}
            onChange={(e) => {
              setFiltersTouched(true);
              setKindFilter(e.target.value as "" | "TEXT" | "CODE");
            }}
          >
            <option value="">All</option>
            <option value="TEXT">Text</option>
            <option value="CODE">Code</option>
          </select>
        </Panel>

        <ul className="dash__list" ref={listRef}>
          {notepads.map((n) => (
            <motion.li
              key={n.id}
              className={n.id === activeId ? "dash__list-item active" : "dash__list-item"}
              whileHover={{ x: 4 }}
              style={n.color ? { borderLeft: `3px solid ${n.color}` } : undefined}
            >
              <button
                onClick={() => {
                  setActiveId(n.id);
                  setDraftContent(null);
                }}
              >
                <span className="dash__list-title">{n.title || "Untitled"}</span>
                <span className="dash__list-meta">
                  <span className="dash__list-kind">{n.kind}</span>
                  {n.tags.length > 0 && <span className="dash__list-tags">{n.tags.join(", ")}</span>}
                </span>
              </button>
              <button className="dash__delete" onClick={() => deleteNotepad(n.id)} aria-label="Delete notepad">
                ×
              </button>
            </motion.li>
          ))}
          {notepads.length === 0 && (
            <li className="dash__empty">
              <EmptyState message="No notepads yet." tip={emptyTip} />
            </li>
          )}
        </ul>
      </aside>

      <main className="dash__main">
        {active ? (
          <>
            <input
              className="dash__title-input"
              value={active.title}
              onChange={(e) => {
                const title = e.target.value;
                setNotepads((prev) =>
                  prev.map((n) => (n.id === active.id ? { ...n, title } : n))
                );
              }}
              onBlur={(e) => renameActive(e.target.value)}
            />

            <div className="dash__meta-row">
              <input
                className="dash__tags-input"
                placeholder="tags, comma, separated"
                defaultValue={active.tags.join(", ")}
                key={active.id}
                onBlur={(e) => updateActiveTags(e.target.value)}
              />
              <div className="dash__swatches">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    className="dash__swatch"
                    style={{
                      background: color,
                      outline: active.color === color ? `2px solid ${color}` : "none",
                    }}
                    onClick={() => updateActiveColor(active.color === color ? null : color)}
                    aria-label={`Set accent color ${color}`}
                  />
                ))}
              </div>
              <label className="dash__wrap-toggle">
                <input
                  type="checkbox"
                  checked={wrapEnabled}
                  onChange={(e) => setWrapEnabled(e.target.checked)}
                />
                Wrap text
              </label>
            </div>

            <Panel
              inset
              className="dash__editor-wrap"
              style={active.color ? { boxShadow: `var(--shadow-in), 0 0 0 1px ${active.color}33` } : undefined}
            >
              <textarea
                ref={editorRef}
                className="dash__editor"
                value={currentContent}
                onChange={(e) => {
                  setDraftContent(e.target.value);
                  bump();
                }}
                spellCheck={active.kind === "TEXT"}
                wrap={wrapEnabled ? "soft" : "off"}
                placeholder={active.kind === "CODE" ? "// paste or write code…" : "Start typing…"}
              />
            </Panel>
            <div className="dash__actions">
              <Button variant="primary" onClick={() => performSave(true)} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </>
        ) : (
          <p className="dash__placeholder">Select or create a notepad to get started.</p>
        )}
      </main>

      <style>{`
        .dash { position: relative; display: flex; flex-direction: column; min-height: 100dvh; font-family: system-ui, sans-serif; overflow-x: hidden; }
        .dash__scrim { position: fixed; inset: 0; z-index: 1; pointer-events: none; background: rgba(23,24,28,0.82); }
        .dash__sidebar, .dash__main { position: relative; z-index: 2; min-width: 0; }

        .dash__sidebar { padding: 16px; display: flex; flex-direction: column; gap: 14px; max-height: 42vh; overflow-y: auto; overflow-x: hidden; }
        .dash__user { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 12px 16px; font-size: 0.9rem; }
        .dash__user-actions { display: flex; align-items: center; gap: 8px; }
        .dash__icon-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; min-height: 40px; background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--muted); padding: 4px; }
        .dash__new { display: flex; flex-direction: column; gap: 10px; }
        .dash__new-btn { width: 100%; min-height: 44px; }

        .dash__search { display: flex; gap: 8px; padding: 10px 12px; }
        .dash__search-input { flex: 1; min-width: 0; background: none; border: none; color: var(--fg); outline: none; font-family: inherit; font-size: 16px; }
        .dash__search-select { background: var(--surface); color: var(--fg); border: none; border-radius: 8px; font-size: 0.85rem; font-family: inherit; padding: 4px; max-width: 100%; }

        .dash__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
        .dash__list-item { display: flex; align-items: stretch; border-radius: 14px; min-width: 0; max-width: 100%; }
        .dash__list-item.active { background: var(--surface); box-shadow: var(--shadow-out); }
        .dash__list-item button:first-child { flex: 1; min-width: 0; max-width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 2px; padding: 12px 14px; background: none; border: none; color: var(--fg); cursor: pointer; text-align: left; min-height: 44px; overflow: hidden; }
        .dash__list-title { display: block; max-width: 100%; font-size: 0.92rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dash__list-meta { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; min-width: 0; max-width: 100%; }
        .dash__list-kind { font-size: 0.72rem; color: var(--muted); flex-shrink: 0; }
        .dash__list-tags { font-size: 0.72rem; color: var(--accent); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dash__delete { flex-shrink: 0; background: none; border: none; color: var(--muted); cursor: pointer; padding: 0 14px; font-size: 1.2rem; min-width: 44px; }
        .dash__empty { color: var(--muted); font-size: 0.85rem; }

        .dash__main { display: flex; flex-direction: column; padding: 16px; gap: 12px; flex: 1; }
        .dash__title-input { width: 100%; min-width: 0; background: none; border: none; font-size: 1.2rem; color: var(--fg); font-weight: 600; outline: none; font-family: inherit; }
        .dash__meta-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; }
        .dash__tags-input { flex: 1; min-width: 140px; background: none; border: none; border-bottom: 1px solid var(--line); color: var(--muted); font-size: 16px; outline: none; font-family: inherit; padding: 6px 0; }
        .dash__swatches { display: flex; gap: 10px; flex-wrap: wrap; }
        .dash__swatch { width: 26px; height: 26px; border-radius: 999px; border: none; cursor: pointer; flex-shrink: 0; }
        .dash__wrap-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--muted); cursor: pointer; user-select: none; white-space: nowrap; }
        .dash__wrap-toggle input { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }
        .dash__editor-wrap { padding: 4px; max-width: 100%; overflow: hidden; }
        .dash__editor { display: block; width: 100%; min-height: 320px; resize: none; background: transparent; border: none; padding: 16px; color: var(--fg); font-size: 16px; line-height: 1.6; font-family: ui-monospace, monospace; outline: none; overflow: hidden; white-space: pre-wrap; word-break: break-word; }
        .dash__editor[wrap="off"] { white-space: pre; word-break: normal; overflow-x: auto; overflow-y: hidden; }
        .dash__actions { display: flex; justify-content: flex-end; }
        .dash__actions button { min-height: 44px; }
        .dash__placeholder { color: var(--muted); }

        @media (min-width: 861px) {
          .dash { flex-direction: row; align-items: flex-start; }
          .dash__sidebar { width: 300px; flex: none; max-height: none; padding: 20px; position: sticky; top: 0; height: 100dvh; }
          .dash__main { padding: 28px; }
          .dash__title-input { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
}