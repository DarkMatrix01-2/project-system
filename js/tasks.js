/* Data layer, shared by the Dashboard and Tasks pages.
   A list looks like: { id, name, description }
   A task looks like: { id, listId, title, description, due, status, starred }
   Stored statuses: todo, doing, done. "overdue" is worked out, never stored. */

const LISTS_KEY = "sz_lists";
const TASKS_KEY = "sz_tasks";

const STATUS_LABELS = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
  overdue: "Overdue",
};

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getLists() {
  return loadData(LISTS_KEY, []);
}

function saveLists(lists) {
  saveData(LISTS_KEY, lists);
}

function getTasks() {
  return loadData(TASKS_KEY, []);
}

function saveTasks(tasks) {
  saveData(TASKS_KEY, tasks);
}

/* Today as YYYY-MM-DD in the user's own time zone. */
function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

/* dd/mm/yyyy, for display only — storage always keeps the ISO string. */
function formatDueDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/* The status to display: unfinished tasks past their due date are overdue. */
function getDisplayStatus(task) {
  const isLate = task.due && task.due < todayISO();
  return task.status !== "done" && isLate ? "overdue" : task.status;
}
