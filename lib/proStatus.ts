// ─── Pro status (localStorage-backed, no billing yet) ────────────────────────
// The Pro flag is simulated: set via the upgrade modal, read throughout the app.
// Replace with a real entitlement check (JWT claim, Supabase row, etc.) later.

export const PRO_STORAGE_KEY = "parrillero_pro_v1";

export function isPro(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_STORAGE_KEY) === "1";
}

export function activatePro(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_STORAGE_KEY, "1");
}
