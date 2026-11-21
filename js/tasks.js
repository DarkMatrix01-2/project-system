/* Task data layer, shared by the Dashboard and Tasks pages.
   A task looks like: { title: "Read chapter 3", due: "2026-12-01", status: "todo" }
   Stored statuses: todo, doing, done. "overdue" is worked out, never stored. */

const TASKS_KEY = "sz_tasks";

const STATUS_LABELS = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
  overdue: "Overdue",
};

const NEXT_STATUS = { todo: "doing", doing: "done", done: "todo" };

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

/* The status to display: unfinished tasks past their due date are overdue. */
function getDisplayStatus(task) {
  const isLate = task.due && task.due < todayISO();
  return task.status !== "done" && isLate ? "overdue" : task.status;
}
