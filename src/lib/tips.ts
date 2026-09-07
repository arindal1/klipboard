// Static delight copy for the empty dashboard state - no backend needed.
export const EMPTY_DASHBOARD_TIPS = [
  "Tip: press Cmd/Ctrl+N to spin up a new notepad instantly.",
  "Tip: Cmd/Ctrl+K opens the quick-switch palette.",
  "Tip: give a notepad an accent color to spot it at a glance.",
  "Tip: tag notepads to filter them later.",
  "Klip syncs everything through Postgres - write here, read anywhere.",
  "Tip: Cmd/Ctrl+S saves the notepad you're editing right now.",
] as const;

export function randomEmptyDashboardTip(): string {
  return EMPTY_DASHBOARD_TIPS[Math.floor(Math.random() * EMPTY_DASHBOARD_TIPS.length)];
}