import { TouchEvent as ReactTouchEvent, useEffect, useRef } from "react";
import { flushSync } from "react-dom";

const SWIPE_DISTANCE_PX = 58;
const HORIZONTAL_INTENT_RATIO = 1.25;
const SNAP_DURATION_MS = 220;

interface UseSwipeTabsOptions<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  disabled?: boolean;
}

type GestureIntent = "pending" | "horizontal" | "vertical";

interface SwipeGesture {
  touchId: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  active: boolean;
  intent: GestureIntent;
  content: HTMLElement | null;
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

const resetContentStyle = (content: HTMLElement | null, animate: boolean) => {
  if (!content) return;

  content.style.transition = animate
    ? `transform ${SNAP_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${SNAP_DURATION_MS}ms ease`
    : "none";
  content.style.transform = "translate3d(0, 0, 0)";
  content.style.opacity = "1";

  window.setTimeout(() => {
    content.style.transition = "";
    content.style.transform = "";
    content.style.opacity = "";
    content.style.willChange = "";
  }, animate ? SNAP_DURATION_MS : 0);
};

export function useSwipeTabs<T extends string>({ tabs, activeTab, onChange, disabled = false }: UseSwipeTabsOptions<T>) {
  const latestRef = useRef({ tabs, activeTab, onChange, disabled });
  const gestureRef = useRef<SwipeGesture>({
    touchId: -1,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    active: false,
    intent: "pending",
    content: null,
  });

  useEffect(() => {
    latestRef.current = { tabs, activeTab, onChange, disabled };
  }, [activeTab, disabled, onChange, tabs]);

  const resetGesture = (restoreContent = true) => {
    const gesture = gestureRef.current;
    if (restoreContent && gesture.intent === "horizontal") resetContentStyle(gesture.content, true);
    gesture.active = false;
    gesture.touchId = -1;
    gesture.content = null;
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (latestRef.current.disabled || event.touches.length !== 1) return;
    if (shouldIgnoreSwipe(event.target, event.currentTarget)) return;

    const touch = event.touches[0];
    const content = event.currentTarget.querySelector<HTMLElement>("[data-swipe-tabs-content]");
    gestureRef.current = {
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      active: true,
      intent: "pending",
      content,
    };
  };

  const handleTouchMove = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture.active) return;

    const touch = Array.from(event.touches).find((item) => item.identifier === gesture.touchId);
    if (!touch) return;

    gesture.deltaX = touch.clientX - gesture.startX;
    gesture.deltaY = touch.clientY - gesture.startY;

    if (gesture.intent === "pending" && Math.max(Math.abs(gesture.deltaX), Math.abs(gesture.deltaY)) >= 8) {
      gesture.intent = Math.abs(gesture.deltaX) > Math.abs(gesture.deltaY) * HORIZONTAL_INTENT_RATIO ? "horizontal" : "vertical";
    }
    if (gesture.intent !== "horizontal" || !gesture.content) return;

    const { tabs: currentTabs, activeTab: currentTab } = latestRef.current;
    const currentIndex = currentTabs.indexOf(currentTab);
    const hasTarget = gesture.deltaX < 0 ? currentIndex < currentTabs.length - 1 : currentIndex > 0;
    const width = Math.max(gesture.content.clientWidth, 1);
    const translatedX = hasTarget
      ? Math.max(-width * 0.72, Math.min(width * 0.72, gesture.deltaX))
      : Math.max(-28, Math.min(28, gesture.deltaX * 0.18));

    gesture.content.style.willChange = "transform, opacity";
    gesture.content.style.transition = "none";
    gesture.content.style.transform = `translate3d(${translatedX}px, 0, 0)`;
    gesture.content.style.opacity = String(hasTarget ? Math.max(0.72, 1 - Math.abs(translatedX) / (width * 2.4)) : 0.92);
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (!gesture.active) return;

    const touch = Array.from(event.changedTouches).find((item) => item.identifier === gesture.touchId);
    if (touch) {
      gesture.deltaX = touch.clientX - gesture.startX;
      gesture.deltaY = touch.clientY - gesture.startY;
    }

    const isSwipe =
      gesture.intent === "horizontal" &&
      Math.abs(gesture.deltaX) >= SWIPE_DISTANCE_PX &&
      Math.abs(gesture.deltaX) >= Math.abs(gesture.deltaY) * HORIZONTAL_INTENT_RATIO;

    const { tabs: currentTabs, activeTab: currentTab, onChange: changeTab } = latestRef.current;
    const currentIndex = currentTabs.indexOf(currentTab);
    const nextIndex = gesture.deltaX < 0 ? currentIndex + 1 : currentIndex - 1;
    const nextTab = currentTabs[nextIndex];
    const content = gesture.content;

    gesture.active = false;
    gesture.touchId = -1;
    gesture.content = null;

    if (!isSwipe || !nextTab || !content) {
      resetContentStyle(content, gesture.intent === "horizontal");
      return;
    }

    const width = Math.max(content.clientWidth, 1);
    const incomingOffset = gesture.deltaX < 0 ? Math.min(width * 0.28, 120) : -Math.min(width * 0.28, 120);

    content.style.transition = "none";
    content.style.transform = `translate3d(${incomingOffset}px, 0, 0)`;
    content.style.opacity = "0.76";
    flushSync(() => changeTab(nextTab));
    void content.offsetWidth;
    requestAnimationFrame(() => resetContentStyle(content, true));
  };

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: () => resetGesture(true),
  };
}
