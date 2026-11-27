// Theme: dark (default) and light. CSS tokens for both live at the top of style.css.
// Switching plays an expanding-circle reveal, anchored to the toggle button, using the
// View Transitions API where the browser supports it; otherwise the theme just swaps instantly.
const THEME_KEY = "stackzen.theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("theme-icon");
  const btn = document.getElementById("theme-toggle");
  if (icon) icon.textContent = theme === "dark" ? "dark_mode" : "light_mode"; // icon shows current mode
  if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

function toggleLightMode(event) {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  const commit = () => {
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  };

  const supportsViewTransition = typeof document.startViewTransition === "function";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!supportsViewTransition || reduceMotion) { commit(); return; }

  const btn = event && event.currentTarget;
  const rect = btn ? btn.getBoundingClientRect() : null;
  const x = rect ? rect.left + rect.width / 2 : innerWidth / 2;
  const y = rect ? rect.top + rect.height / 2 : innerHeight / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

  const transition = document.startViewTransition(commit);
  transition.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }
    );
  }).catch(() => {});
}

(function initTheme() {
  let saved = "dark";
  try { saved = localStorage.getItem(THEME_KEY) || "dark"; } catch (e) {}
  applyTheme(saved === "light" ? "light" : "dark");
  document.getElementById("theme-toggle")?.addEventListener("click", toggleLightMode);
})();
