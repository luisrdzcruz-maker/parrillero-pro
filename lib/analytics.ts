/**
 * Lightweight client analytics — default sink: structured console lines.
 *
 * Supabase (later)
 * - Add a table e.g. `analytics_events` with:
 *   - `id` uuid, `created_at` timestamptz default now()
 *   - `event_name` text (store `name` from payloads below)
 *   - `payload` jsonb (entire object, or strip `name` and put rest in payload)
 *   - `session_id` text nullable (set via `setAnalyticsSessionId` once auth/session exists)
 *   - `user_id` uuid nullable
 * - Replace the default sink with one that `insert()`s (client via Edge Function or server action
 *   to keep the service key off the client).
 * - Batching: optional queue + flush on interval/visibility; retry with backoff.
 * - PII: keep animal/cut as catalog ids in new code paths where possible; current UI often uses labels.
 */

export type AnalyticsEvent =
  | { name: "animal_selected"; animal: string; lang: string }
  | { name: "cut_selected"; animal: string; cutId: string; lang: string }
  | { name: "cooking_plan_result"; path: "local" | "ai" }
  | { name: "cooking_ai_fallback" }
  | {
      name: "cooking_failure";
      where: "ai_http" | "ai_network" | "ai_exception";
      status?: number;
      message?: string;
    };

export type AnalyticsSink = (event: AnalyticsEvent) => void | Promise<void>;

let sessionId: string | null = null;

let sink: AnalyticsSink = (event) => {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    session: sessionId,
    ...event,
  });
  console.info(`[analytics] ${line}`);
};

/**
 * Replaces the default console sink; use for Supabase or any transport.
 * Should be idempotent and cheap; never throw to callers (errors are caught in `track`).
 */
export function setAnalyticsSink(next: AnalyticsSink): void {
  sink = next;
}

export function getAnalyticsSessionId(): string | null {
  return sessionId;
}

/** Optional anonymous session id (e.g. from localStorage) for correlating events before auth. */
export function setAnalyticsSessionId(id: string | null): void {
  sessionId = id;
}

export function track(event: AnalyticsEvent): void {
  void Promise.resolve()
    .then(() => sink(event))
    .catch((err) => {
      console.warn("[analytics] sink error", err);
    });
}
