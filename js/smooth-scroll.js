/* Optional wheel smoothing. Navigation, focus and touch remain browser-owned. */
(() => {
  if (typeof window.Lenis !== "function") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarsePointer = window.matchMedia("(any-pointer: coarse)");
  let lenis;
  let pageActive = true;

  function destroy() {
    lenis?.destroy();
    lenis = undefined;
  }

  function reconcile() {
    if (!pageActive || reducedMotion.matches || !finePointer.matches || coarsePointer.matches) {
      destroy();
    } else if (!lenis) {
      lenis = new window.Lenis({
        autoRaf: true,
        smoothWheel: true,
        syncTouch: false,
        lerp: 0.16,
        wheelMultiplier: 1,
        anchors: false,
        respectReducedMotion: true,
      });
    }
  }

  function releaseWheelTarget() {
    if (!lenis) return;
    // A fresh instance forgets inertia without writing a scroll position or
    // suppressing the browser's next scroll event (including bare href="#").
    destroy();
    reconcile();
  }

  for (const preference of [reducedMotion, finePointer, coarsePointer]) {
    preference.addEventListener("change", reconcile);
  }
  document.addEventListener("pointerdown", releaseWheelTarget, { capture: true, passive: true });
  document.addEventListener("focusin", releaseWheelTarget);
  document.addEventListener("keydown", (event) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab", "Enter"].includes(event.key)) {
      releaseWheelTarget();
    }
  }, true);
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname &&
        url.search === window.location.search && anchor.href.includes("#")) {
      releaseWheelTarget();
    }
  });
  window.addEventListener("hashchange", releaseWheelTarget);
  window.addEventListener("popstate", releaseWheelTarget);
  window.addEventListener("pagehide", () => {
    pageActive = false;
    destroy();
  });
  window.addEventListener("pageshow", () => {
    pageActive = true;
    reconcile();
  });
  reconcile();
})();
