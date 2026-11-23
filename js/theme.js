// Theme: dark (default) and light. CSS tokens for both live at the top of style.css.
const THEME_KEY = "stackzen.theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = document.getElementById("theme-icon");
  const btn = document.getElementById("theme-toggle");
  if (icon) icon.textContent = theme === "dark" ? "dark_mode" : "light_mode"; // icon shows current mode
  if (btn) btn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

function toggleLightMode() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
}

(function initTheme() {
  let saved = "dark";
  try { saved = localStorage.getItem(THEME_KEY) || "dark"; } catch (e) {}
  applyTheme(saved === "light" ? "light" : "dark");
  document.getElementById("theme-toggle")?.addEventListener("click", toggleLightMode);
})();