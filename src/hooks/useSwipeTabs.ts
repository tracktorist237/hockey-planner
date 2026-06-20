import { TouchEvent as ReactTouchEvent, useEffect, useRef } from "react";

const SWIPE_DISTANCE_PX = 58;
const HORIZONTAL_INTENT_RATIO = 1.25;

interface UseSwipeTabsOptions<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  disabled?: boolean;
}

const shouldIgnoreSwipe = (target: EventTarget | null, boundary: HTMLElement): boolean => {
  if (!(target instanceof HTMLElement)) return true;

  if (target.closest("input, textarea, select, button, a, label, [role='dialog'], [data-swipe-ignore], [contenteditable='true']")) {
    return true;
  }

  let element: HTMLElement | null = target;
  while (element && element !== boundary) {
    const overflowX = window.getComputedStyle(element).overflowX;
    if ((overflowX === "auto" || overflowX === "scroll") && element.scrollWidth > element.clientWidth) {
      return true;
    }
    element = element.parentElement;
  }

  return false;
};

export function useSwipeTabs<T extends string>({ tabs, activeTab, onChange, disabled = false }: UseSwipeTabsOptions<T>) {
  const latestRef = useRef({ tabs, activeTab, onChange, disabled });
  const gestureRef = useRef({ touchId: -1, startX: 0, startY: 0, active: false });

  useEffect(() => {
    latestRef.current = { tabs, activeTab, onChange, disabled };
  }, [activeTab, disabled, onChange, tabs]);

  const resetGesture = () => {
    gestureRef.current.active = false;
    gestureRef.current.touchId = -1;
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (latestRef.current.disabled || event.touches.length !== 1) return;
    if (shouldIgnoreSwipe(event.target, event.currentTarget)) return;

    const touch = event.touches[0];
    gestureRef.current = {
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      active: true,
    };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture.active) return;

    const touch = Array.from(event.changedTouches).find((item) => item.identifier === gesture.touchId);
    resetGesture();
    if (!touch) return;

    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    if (Math.abs(deltaX) < SWIPE_DISTANCE_PX || Math.abs(deltaX) < Math.abs(deltaY) * HORIZONTAL_INTENT_RATIO) {
      return;
    }

    const { tabs: currentTabs, activeTab: currentTab, onChange: changeTab } = latestRef.current;
    const currentIndex = currentTabs.indexOf(currentTab);
    if (currentIndex < 0) return;

    const nextIndex = deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextTab = currentTabs[nextIndex];
    if (nextTab) {
      changeTab(nextTab);
    }
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: resetGesture,
  };
}
