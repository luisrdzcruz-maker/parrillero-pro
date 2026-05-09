export type SwipeDirection = "back" | "forward";

export type TouchPoint = {
  x: number;
  y: number;
};

export function isInteractiveSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest("input, select, textarea, a, label"));
}

export function isMobileSwipeViewport() {
  if (typeof window === "undefined") return false;

  return window.innerWidth < 768;
}
