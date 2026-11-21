/* Dashboard page: status counts and overall progress. Needs tasks.js. */

function countByStatus(tasks) {
  const counts = { todo: 0, doing: 0, done: 0, overdue: 0 };
  tasks.forEach((task) => counts[getDisplayStatus(task)]++);
  return counts;
}

function renderDashboard() {
  const tasks = getTasks();
  const counts = countByStatus(tasks);

  Object.keys(counts).forEach((status) => {
    document.querySelector(`#count-${status}`).textContent = counts[status];
  });

  const percentDone = tasks.length ? Math.round((counts.done / tasks.length) * 100) : 0;
  document.querySelector("#progress-fill").style.width = `${percentDone}%`;
}

renderDashboard();
