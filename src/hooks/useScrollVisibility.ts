import { useEffect, useRef, useState } from "react";

interface UseScrollVisibilityOptions {
  headerHideOffset?: number;
  footerHideOffset?: number;
  resetOffset?: number;
}

interface ScrollVisibilityState {
  isHeaderVisible: boolean;
  isFooterVisible: boolean;
}

export const useScrollVisibility = (
  options: UseScrollVisibilityOptions = {},
): ScrollVisibilityState => {
  const {
    headerHideOffset = 50,
    footerHideOffset = 100,
    resetOffset = 10,
  } = options;

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isFooterVisible, setIsFooterVisible] = useState(true);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (ticking.current) {
        return;
      }

      window.requestAnimationFrame(() => {
        const isScrollingDown = currentScrollY > lastScrollY.current;
        const isScrollingUp = currentScrollY < lastScrollY.current;

        if (isScrollingDown && currentScrollY > headerHideOffset) {
          setIsHeaderVisible(false);
        } else if (isScrollingUp) {
          setIsHeaderVisible(true);
        }

        if (isScrollingDown && currentScrollY > footerHideOffset) {
          setIsFooterVisible(false);
        } else if (isScrollingUp) {
          setIsFooterVisible(true);
        }

        if (currentScrollY < resetOffset) {
          setIsHeaderVisible(true);
          setIsFooterVisible(true);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });

      ticking.current = true;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [footerHideOffset, headerHideOffset, resetOffset]);

  return {
    isHeaderVisible,
    isFooterVisible,
  };
};
