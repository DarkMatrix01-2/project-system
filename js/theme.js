/* Dark/light mode toggle and active nav link. Loaded on every page. */

const THEME_KEY = "sz_theme";

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  saveData(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
}

function highlightActiveNav() {
  const currentPage = document.body.dataset.page;
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === currentPage);
  });
}

document.documentElement.dataset.theme = loadData(THEME_KEY, "dark");
document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);
highlightActiveNav();
