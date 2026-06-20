import { PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";

const DISMISS_DISTANCE_PX = 90;
const QUICK_SWIPE_DISTANCE_PX = 28;
const QUICK_SWIPE_VELOCITY = 0.65;
const ANIMATION_MS = 180;

export function useSwipeToDismiss<T extends HTMLElement = HTMLDivElement>(onDismiss: () => void) {
  const sheetRef = useRef<T | null>(null);
  const onDismissRef = useRef(onDismiss);
  const animationTimerRef = useRef<number | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startY: 0,
    lastY: 0,
    startedAt: 0,
    active: false,
  });

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(
    () => () => {
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    },
    [],
  );

  const setSheetPosition = (offset: number, animate: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = animate ? `transform ${ANIMATION_MS}ms ease-out` : "none";
    sheet.style.transform = `translate3d(0, ${Math.max(0, offset)}px, 0)`;
  };

  const resetDrag = () => {
    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;

    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      lastY: event.clientY,
      startedAt: performance.now(),
      active: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSheetPosition(0, false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    drag.lastY = event.clientY;
    setSheetPosition(event.clientY - drag.startY, false);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const distance = Math.max(0, drag.lastY - drag.startY);
    const elapsed = Math.max(1, performance.now() - drag.startedAt);
    const velocity = distance / elapsed;
    const shouldDismiss = !cancelled &&
      (distance >= DISMISS_DISTANCE_PX || (distance >= QUICK_SWIPE_DISTANCE_PX && velocity >= QUICK_SWIPE_VELOCITY));

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    resetDrag();

    if (!shouldDismiss) {
      setSheetPosition(0, true);
      return;
    }

    const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? window.innerHeight;
    setSheetPosition(sheetHeight + 24, true);
    animationTimerRef.current = window.setTimeout(() => onDismissRef.current(), ANIMATION_MS);
  };

  return {
    sheetRef,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => finishDrag(event),
      onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => finishDrag(event, true),
      style: {
        width: 42,
        height: 18,
        margin: "0 auto 5px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        touchAction: "none",
        cursor: "grab",
        userSelect: "none",
      } as const,
    },
  };
}
