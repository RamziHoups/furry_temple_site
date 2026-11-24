const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let parallaxFrame = 0;

// Panel stars are static SVG/CSS, as in the game. Only scroll-driven hero parallax needs a frame.
function updateHeroParallax() {
  parallaxFrame = 0;
  if (!hero || reduceMotion.matches || document.hidden) return;

  const rect = hero.getBoundingClientRect();
  const progress = Math.min(1, Math.max(-1, -rect.top / Math.max(window.innerHeight, 1)));
  hero.style.setProperty("--hero-bg-y", `${progress * 34}px`);
}

function requestHeroParallax() {
  if (!hero || reduceMotion.matches || document.hidden || parallaxFrame) return;
  parallaxFrame = requestAnimationFrame(updateHeroParallax);
}

function syncMotion() {
  cancelAnimationFrame(parallaxFrame);
  parallaxFrame = 0;
  if (hero && reduceMotion.matches) hero.style.setProperty("--hero-bg-y", "0px");
  requestHeroParallax();
}

window.addEventListener("scroll", requestHeroParallax, { passive: true });
window.addEventListener("resize", requestHeroParallax);
document.addEventListener("visibilitychange", syncMotion);
reduceMotion.addEventListener("change", syncMotion);
syncMotion();

const screenshotViewer = document.getElementById("screenshotViewer");
const screenshotViewerImage = document.getElementById("screenshotViewerImage");
const screenshotViewerTitle = document.getElementById("screenshotViewerTitle");

if (screenshotViewer && screenshotViewerImage && screenshotViewerTitle) {
  document.querySelectorAll(".screenshot-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (typeof screenshotViewer.showModal !== "function") return;

      event.preventDefault();
      screenshotViewerImage.src = link.href;
      screenshotViewerImage.alt = link.querySelector("img").alt;
      screenshotViewerTitle.textContent = link.closest("figure").querySelector("h3").textContent;
      screenshotViewer.showModal();
      document.documentElement.classList.add("screenshot-open");
    });
  });

  screenshotViewer.addEventListener("click", (event) => {
    if (event.target === screenshotViewer) screenshotViewer.close();
  });

  screenshotViewer.addEventListener("close", () => {
    document.documentElement.classList.remove("screenshot-open");
    screenshotViewerImage.removeAttribute("src");
  });
}
