/**
 * Graceful smooth scrolling utility to promptly bring the user
 * to the top of the screen when analysis initiates.
 */
export function scrollToTopSlow(duration = 450): void {
  if (typeof window === "undefined") return;

  const startPosition =
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  if (startPosition <= 5) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  const startTime = performance.now();

  const easeOutQuad = (t: number): number => {
    return t * (2 - t);
  };

  const animateScroll = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeOutQuad(progress);

    window.scrollTo(0, Math.max(0, startPosition * (1 - ease)));

    if (progress < 1) {
      window.requestAnimationFrame(animateScroll);
    } else {
      window.scrollTo(0, 0);
    }
  };

  window.requestAnimationFrame(animateScroll);
}
