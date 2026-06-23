import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Resets scroll back to the top on every route change.
 *
 * Most layouts (Admin/User/Operations/Tutor) scroll on the window, but
 * FrontlineLayout scrolls inside an inner `overflow-y-auto` container. Any such
 * container should be marked with `data-scroll-container` so it gets reset too -
 * `window.scrollTo` alone won't touch it.
 *
 * Mounted once at the router root, so it covers every routed surface.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document
      .querySelectorAll<HTMLElement>("[data-scroll-container]")
      .forEach((el) => el.scrollTo(0, 0));
  }, [pathname]);

  return null;
}
