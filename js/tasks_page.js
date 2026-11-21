/* Tasks page: add, search, filter, change status, delete. Needs tasks.js. */

const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const dueInput = document.querySelector("#task-due");
const errorBox = document.querySelector("#task-error");
const searchInput = document.querySelector("#task-search");
const filterSelect = document.querySelector("#task-filter");
const taskList = document.querySelector("#task-list");

let tasks = getTasks();

function addTask(event) {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (title.length < 3) {
    errorBox.textContent = "Enter a task title with at least 3 characters.";
    return;
  }
  errorBox.textContent = "";

  tasks.push({ title, due: dueInput.value, status: "todo" });
  saveTasks(tasks);
  taskForm.reset();
  renderTasks();
}

function advanceStatus(task) {
  task.status = NEXT_STATUS[task.status];
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(task) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter((item) => item !== task);
  saveTasks(tasks);
  renderTasks();
}

function matchesFilters(task) {
  const matchesSearch = task.title.toLowerCase().includes(searchInput.value.toLowerCase());
  const matchesStatus = filterSelect.value === "all" || getDisplayStatus(task) === filterSelect.value;
  return matchesSearch && matchesStatus;
}

function createTaskElement(task) {
  const status = getDisplayStatus(task);

  const row = document.createElement("div");
  row.className = "task";
  row.dataset.status = status;

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title; // textContent keeps user input safe

  const due = document.createElement("span");
  due.className = "task-due";
  due.textContent = task.due || "No due date";

  const statusButton = document.createElement("button");
  statusButton.className = "icon-btn";
  statusButton.textContent = STATUS_LABELS[status];
  statusButton.addEventListener("click", () => advanceStatus(task));

  const deleteButton = document.createElement("button");
  deleteButton.className = "icon-btn danger";
  deleteButton.textContent = "✕";
  deleteButton.setAttribute("aria-label", "Delete task");
  deleteButton.addEventListener("click", () => deleteTask(task));

  row.append(title, due, statusButton, deleteButton);
  return row;
}

function renderTasks() {
  const visible = tasks.filter(matchesFilters);
  taskList.replaceChildren(...visible.map(createTaskElement));

  if (visible.length === 0) {
    taskList.innerHTML = '<p class="empty">No tasks to show. Add one above.</p>';
  }
}

taskForm.addEventListener("submit", addTask);
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);
renderTasks();
