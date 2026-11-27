// Dashboard: counts, progress bar, upcoming list.
// getTasks() comes from tasks.js (shared storage key, shared across pages).
function renderDashboard() {
  const tasks = getTasks();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dueDate = (t) => (t.due ? new Date(t.due + "T00:00:00") : null);
  const isOverdue = (t) => t.status !== "done" && dueDate(t) && dueDate(t) < today;

  const counts = { todo: 0, doing: 0, done: 0, overdue: 0 };
  tasks.forEach((t) => { if (isOverdue(t)) counts.overdue++; else if (counts[t.status] !== undefined) counts[t.status]++; });
  Object.keys(counts).forEach((k) => { document.getElementById("count-" + k).textContent = counts[k]; });

  const pct = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0;
  document.getElementById("progress-fill").style.width = pct + "%";

  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const upcoming = tasks
    .filter((t) => t.status !== "done" && dueDate(t) && dueDate(t) >= today && dueDate(t) <= weekEnd)
    .sort((a, b) => dueDate(a) - dueDate(b));

  const list = document.getElementById("upcoming");
  list.innerHTML = "";
  if (!upcoming.length) {
    const li = document.createElement("li");
    li.className = "empty"; li.textContent = "Nothing due in the next 7 days.";
    list.append(li);
    return;
  }
  upcoming.forEach((t) => {
    const li = document.createElement("li");
    li.dataset.status = t.status;
    const day = dueDate(t).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    li.textContent = `${day} - ${t.title}`; // textContent: safe against injected HTML
    list.append(li);
  });
}

document.addEventListener("DOMContentLoaded", renderDashboard);