"use client";

import { useCallback, useRef, type TouchEvent } from "react";

import {
  isInteractiveSwipeTarget,
  isMobileSwipeViewport,
  type SwipeDirection,
  type TouchPoint,
} from "@/components/app/utils/swipe";

const HORIZONTAL_THRESHOLD_PX = 60;

export function useSwipeNavigation({ onSwipe }: { onSwipe: (direction: SwipeDirection) => void }) {
  const touchStartRef = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (!isMobileSwipeViewport() || isInteractiveSwipeTarget(event.target)) {
      touchStartRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || !isMobileSwipeViewport() || isInteractiveSwipeTarget(event.target)) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (horizontalDistance < HORIZONTAL_THRESHOLD_PX || horizontalDistance <= verticalDistance) return;

    onSwipe(deltaX > 0 ? "back" : "forward");
  }, [onSwipe]);

  return { handleTouchStart, handleTouchEnd };
}
