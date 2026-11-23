// Shared shell behaviour: sidebar, profile popup, logout dialog.
// Include on every page that uses the shell.
(() => {
  const LOGIN_PAGE = "pages/login.html"; // adjust (use "login.html" from inside /pages)
  const $ = (id) => document.getElementById(id);
  const body = document.body;

  // --- Sidebar: ONLY the hamburger opens/closes it (profile clicks never touch it) ---
  const menuBtn = $("menu-toggle");
  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    try { localStorage.setItem("stackzen.menu", open ? "1" : "0"); } catch (e) {}
  }
  let saved = "0"; try { saved = localStorage.getItem("stackzen.menu") || "0"; } catch (e) {}
  setMenu(saved === "1");
  menuBtn.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));

  // --- Current tab stays highlighted ---
  document.querySelectorAll(".side-nav [data-page]").forEach((a) => {
    if (a.dataset.page === body.dataset.page) a.setAttribute("aria-current", "page");
  });

  // --- Profile popup ---
  const pBtn = $("profile-toggle"), pMenu = $("profile-menu");
  const isOpen = () => pMenu.classList.contains("open");
  function setProfile(open) { pMenu.classList.toggle("open", open); pBtn.setAttribute("aria-expanded", String(open)); }
  pBtn.addEventListener("click", (e) => { e.stopPropagation(); setProfile(!isOpen()); });
  document.addEventListener("click", (e) => { if (isOpen() && !pMenu.contains(e.target)) setProfile(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setProfile(false); });

  // --- Logout dialog ---
  const dlg = $("logout-dialog");
  $("logout-open").addEventListener("click", () => { setProfile(false); dlg.showModal(); });
  // play the close animation, then really close (no animation if the user prefers reduced motion)
  function closeDialog(done) {
    const finish = () => { dlg.classList.remove("closing"); dlg.close(); if (done) done(); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    dlg.classList.add("closing");
    dlg.addEventListener("animationend", finish, { once: true });
  }
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(); }); // Esc key
  $("logout-no").addEventListener("click", () => closeDialog());
  $("logout-yes").addEventListener("click", () => {
    try { sessionStorage.clear(); localStorage.removeItem("stackzen.session"); } catch (e) {}
    closeDialog(() => { window.location.href = LOGIN_PAGE; }); // back to the login form
  });
})();