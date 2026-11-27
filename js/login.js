/* =========================================================
   StackZen login — view switching, validation, demo auth
   ========================================================= */

const views = {
  login: document.getElementById("login-view"),
  register: document.getElementById("register-view"),
  success: document.getElementById("success-view"),
};

const titles = {
  login: "StackZen — Login",
  register: "StackZen — Register",
  success: "StackZen — Login success",
};

function showView(name) {
  Object.entries(views).forEach(([key, el]) => { el.hidden = key !== name; });
  document.title = titles[name];
  document.body.dataset.view = name; // lets login.css swap the background image

  const firstInput = views[name].querySelector("input");
  if (firstInput) firstInput.focus();
}

/* ---------- Error helpers ---------- */
function setError(form, messageEl, textEl, message, invalidInputs) {
  textEl.textContent = message;
  messageEl.hidden = false;
  form.querySelectorAll("input").forEach((input) => {
    input.setAttribute("aria-invalid", invalidInputs.includes(input) ? "true" : "false");
  });
}

function clearError(form, messageEl) {
  messageEl.hidden = true;
  form.querySelectorAll("input").forEach((input) => input.removeAttribute("aria-invalid"));
}

/* ---------- Demo "backend" ----------
   Accounts are kept in localStorage so the page works on its own.
   Replace loginRequest() and registerRequest() with fetch() calls to
   your real server. Never store passwords in the browser in production. */
const USERS_KEY = "stackzen_users";
const SESSION_KEY = "stackzen_session";

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

async function hash(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return text; // fallback for non-secure contexts (demo only)
}

async function loginRequest(email, password) {
  const user = readUsers().find((u) => u.email === email.toLowerCase());
  if (!user || user.passwordHash !== (await hash(password))) return { ok: false };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, email: user.email }));
  return { ok: true, user };
}

async function registerRequest(username, email, password) {
  const users = readUsers();
  const taken = users.some(
    (u) => u.email === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
  );
  if (taken) return { ok: false, reason: "duplicate" };

  users.push({ username, email: email.toLowerCase(), passwordHash: await hash(password) });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { ok: true };
}

/* ---------- Login ---------- */
const loginForm = views.login;
const loginError = document.getElementById("login-error");
const loginErrorText = document.getElementById("login-error-text");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(loginForm, loginError);

  const email = loginEmail.value.trim();
  const password = loginPassword.value;
  const submit = loginForm.querySelector(".btn");

  const missing = [loginEmail, loginPassword].filter((input) => !input.value.trim());
  if (missing.length) {
    setError(loginForm, loginError, loginErrorText, "Please fill in every field.", missing);
    return;
  }

  submit.disabled = true;
  const result = await loginRequest(email, password);
  submit.disabled = false;

  if (!result.ok) {
    setError(
      loginForm, loginError, loginErrorText,
      "Account does not exist or wrong account details entered!",
      [loginEmail, loginPassword]
    );
    return;
  }

  loginForm.reset();
  showView("success");
});

/* ---------- Register ---------- */
const regForm = views.register;
const regError = document.getElementById("reg-error");
const regErrorText = document.getElementById("reg-error-text");
const regUsername = document.getElementById("reg-username");
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");

regForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(regForm, regError);

  const username = regUsername.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;
  const submit = regForm.querySelector(".btn");

  const missing = [regUsername, regEmail, regPassword].filter((input) => !input.value.trim());
  if (missing.length) {
    setError(regForm, regError, regErrorText, "Please fill in every field.", missing);
    return;
  }

  if (username.length < 3 || username.length > 14) {
    setError(regForm, regError, regErrorText, "Username must be 3 to 14 characters long.", [regUsername]);
    return;
  }

  if (!email.toLowerCase().endsWith("@gmail.com")) {
    setError(regForm, regError, regErrorText, "Email must be a valid @gmail.com address.", [regEmail]);
    return;
  }

  if (password.length < 8) {
    setError(regForm, regError, regErrorText, "Password must be at least 8 characters long.", [regPassword]);
    return;
  }

  submit.disabled = true;
  const result = await registerRequest(username, email, password);
  submit.disabled = false;

  if (!result.ok) {
    setError(
      regForm, regError, regErrorText,
      "Username or Email already exists!",
      [regUsername, regEmail]
    );
    return;
  }

  // Account created: send them to the success screen
  await loginRequest(email, password);
  regForm.reset();
  showView("success");
});

/* ---------- Clear red borders as soon as the person edits ---------- */
[loginForm, regForm].forEach((form) => {
  const message = form === loginForm ? loginError : regError;
  form.addEventListener("input", () => clearError(form, message));
});

/* ---------- Navigation buttons ---------- */
document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearError(loginForm, loginError);
    clearError(regForm, regError);
    showView(btn.dataset.go);
  });
});

document.getElementById("continue-btn").addEventListener("click", () => {
  window.location.href = "../index.html";
});

document.getElementById("switch-btn").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showView("login");
});