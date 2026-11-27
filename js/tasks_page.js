/* Tasks page: lists sidebar + 4-column kanban board, with modals for
   adding/editing lists and tasks, a read-only task view, and a shared
   delete-confirmation dialog. Needs storage.js and tasks.js. */

const STATUSES = ["todo", "doing", "done", "overdue"];
const SELECTED_LIST_KEY = "sz_selected_list";

let lists = getLists();
let tasks = getTasks();
let selectedListId = (() => {
  try { return localStorage.getItem(SELECTED_LIST_KEY); } catch (e) { return null; }
})();

const $ = (id) => document.getElementById(id);

const listNav = $("list-nav");
const boardHeader = $("board-header");
const boardTitle = $("board-title");
const boardDesc = $("board-desc");
const board = $("board");
const boardEmpty = $("board-empty");

/* ---------- persistence + small helpers ---------- */

function persistLists() { saveLists(lists); }
function persistTasks() { saveTasks(tasks); }

function setSelectedList(id) {
  selectedListId = id;
  try {
    if (id) localStorage.setItem(SELECTED_LIST_KEY, id);
    else localStorage.removeItem(SELECTED_LIST_KEY);
  } catch (e) {}
}

function currentList() {
  return lists.find((l) => l.id === selectedListId) || null;
}

/* Generic animated close for our <dialog class="modal">/.logout elements,
   matching the pop-in/pop-out pattern already used for the logout dialog. */
function closeDialog(dlg, done) {
  const finish = () => { dlg.classList.remove("closing"); dlg.close(); if (done) done(); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
  dlg.classList.add("closing");
  dlg.addEventListener("animationend", finish, { once: true });
}

/* ---------- rendering: list sidebar ---------- */

function renderListNav() {
  listNav.innerHTML = "";
  lists.forEach((list) => {
    const li = document.createElement("li");
    li.className = "list-item" + (list.id === selectedListId ? " active" : "");

    const select = document.createElement("button");
    select.type = "button";
    select.className = "list-select";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = list.name;
    select.append(nameSpan);
    select.addEventListener("click", () => { setSelectedList(list.id); renderAll(); });

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "icon-sm";
    editBtn.setAttribute("aria-label", `Edit "${list.name}"`);
    editBtn.innerHTML = '<span class="material-icons-round">edit</span>';
    editBtn.addEventListener("click", (e) => { e.stopPropagation(); openListDialog("edit", list); });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "icon-sm danger";
    deleteBtn.setAttribute("aria-label", `Delete "${list.name}"`);
    deleteBtn.innerHTML = '<span class="material-icons-round">delete</span>';
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openConfirm(`Are you sure you want to delete "${list.name}"?`, () => deleteList(list.id));
    });

    li.append(select, editBtn, deleteBtn);
    listNav.append(li);
  });
}

function deleteList(id) {
  lists = lists.filter((l) => l.id !== id);
  tasks = tasks.filter((t) => t.listId !== id);
  persistLists();
  persistTasks();
  if (selectedListId === id) setSelectedList(lists[0] ? lists[0].id : null);
  renderAll();
}

/* ---------- rendering: board ---------- */

function tasksForColumn(status) {
  const list = currentList();
  if (!list) return [];
  return tasks
    .filter((t) => t.listId === list.id && getDisplayStatus(t) === status)
    .sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));
}

function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.dataset.status = getDisplayStatus(task);
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View "${task.title}"`);
  card.addEventListener("click", () => openViewDialog(task));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openViewDialog(task); }
  });

  const head = document.createElement("div");
  head.className = "task-card-head";
  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title; // textContent keeps user input safe

  const actions = document.createElement("div");
  actions.className = "task-card-actions";

  const starBtn = document.createElement("button");
  starBtn.type = "button";
  starBtn.className = "star" + (task.starred ? " active" : "");
  starBtn.setAttribute("aria-label", task.starred ? "Unstar task" : "Star task");
  starBtn.innerHTML = `<span class="material-icons-round">${task.starred ? "star" : "star_border"}</span>`;
  starBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleStar(task); });

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.setAttribute("aria-label", `Edit "${task.title}"`);
  editBtn.innerHTML = '<span class="material-icons-round">edit</span>';
  editBtn.addEventListener("click", (e) => { e.stopPropagation(); openTaskDialog("edit", { task }); });

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "danger";
  deleteBtn.setAttribute("aria-label", `Delete "${task.title}"`);
  deleteBtn.innerHTML = '<span class="material-icons-round">delete</span>';
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openConfirm(`Are you sure you want to delete "${task.title}"?`, () => deleteTask(task.id));
  });

  actions.append(starBtn, editBtn, deleteBtn);
  head.append(title, actions);
  card.append(head);

  if (task.description) {
    const desc = document.createElement("p");
    desc.className = "task-desc";
    desc.textContent = task.description;
    card.append(desc);
  }

  const due = document.createElement("span");
  due.className = "task-due";
  due.textContent = task.due ? `Due on: ${formatDueDate(task.due)}` : "No due date";
  card.append(due);

  return card;
}

function toggleStar(task) {
  task.starred = !task.starred;
  persistTasks();
  renderBoard();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  persistTasks();
  renderBoard();
}

function renderBoard() {
  const list = currentList();
  const hasList = Boolean(list);

  boardHeader.hidden = !hasList;
  board.hidden = !hasList;
  boardEmpty.hidden = hasList;

  if (!hasList) return;

  boardTitle.textContent = list.name;
  boardDesc.textContent = list.description || "";
  boardDesc.hidden = !list.description;

  board.innerHTML = "";
  STATUSES.forEach((status) => {
    const column = document.createElement("div");
    column.className = "column";
    column.dataset.status = status;

    const head = document.createElement("div");
    head.className = "column-head";
    const label = document.createElement("span");
    label.textContent = STATUS_LABELS[status];
    head.append(label);

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "add-task-btn";
    addBtn.setAttribute("aria-label", `Add task to ${STATUS_LABELS[status]}`);
    addBtn.innerHTML = '<span class="material-icons-round">add</span>';
    addBtn.addEventListener("click", () => openTaskDialog("add", { status }));
    head.append(addBtn);

    const cardsBox = document.createElement("div");
    cardsBox.className = "column-cards";
    const columnTasks = tasksForColumn(status);
    if (columnTasks.length === 0) {
      const empty = document.createElement("p");
      empty.className = "column-empty";
      empty.textContent = "Add something before you forget it :)";
      cardsBox.append(empty);
    } else {
      columnTasks.forEach((t) => cardsBox.append(createTaskCard(t)));
    }

    column.append(head, cardsBox);
    board.append(column);
  });
}

function renderAll() {
  renderListNav();
  renderBoard();
}

/* ---------- list dialog (add / edit) ---------- */

const listDialog = $("list-dialog");
const listDialogTitle = $("list-dialog-title");
const listNameInput = $("list-name-input");
const listDescInput = $("list-desc-input");
const listNameError = $("list-name-error");
const listSaveBtn = $("list-save-btn");
const listForm = $("list-form");

let listDialogMode = "add";
let editingList = null;

function openListDialog(mode, list) {
  listDialogMode = mode;
  editingList = list || null;
  listNameError.textContent = "";
  if (mode === "edit" && list) {
    listDialogTitle.textContent = `Edit "${list.name}"`;
    listSaveBtn.textContent = "Save";
    listNameInput.value = list.name;
    listDescInput.value = list.description || "";
  } else {
    listDialogTitle.textContent = "List name";
    listSaveBtn.textContent = "Add";
    listNameInput.value = "";
    listDescInput.value = "";
  }
  listDialog.showModal();
  listNameInput.focus();
}

$("add-list-btn").addEventListener("click", () => openListDialog("add", null));
$("list-cancel-btn").addEventListener("click", () => closeDialog(listDialog));
listDialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(listDialog); });

listForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = listNameInput.value.trim();
  if (!name) {
    listNameError.textContent = "Enter a name for this list.";
    return;
  }
  listNameError.textContent = "";
  const description = listDescInput.value.trim();

  if (listDialogMode === "edit" && editingList) {
    editingList.name = name;
    editingList.description = description;
  } else {
    const newList = { id: makeId(), name, description };
    lists.push(newList);
    setSelectedList(newList.id);
  }
  persistLists();
  closeDialog(listDialog, renderAll);
});

/* ---------- task dialog (add / edit) ---------- */

const taskDialog = $("task-dialog");
const taskDialogTitle = $("task-dialog-title");
const taskNameInput = $("task-name-input");
const taskNameError = $("task-name-error");
const taskDescInput = $("task-desc-input");
const taskDueInput = $("task-due-input");
const taskDueError = $("task-due-error");
const taskStatusInput = $("task-status-input");
const taskDeleteBtn = $("task-delete-btn");
const taskSaveBtn = $("task-save-btn");
const taskForm = $("task-form");

let taskDialogMode = "add";
let editingTask = null;
let addStatus = "todo";

function openTaskDialog(mode, { status, task } = {}) {
  taskDialogMode = mode;
  editingTask = task || null;
  taskNameError.textContent = "";
  taskDueError.textContent = "";

  if (mode === "edit" && task) {
    const displayStatus = getDisplayStatus(task);
    taskDialogTitle.textContent = `Editing "${task.title}" in ${STATUS_LABELS[displayStatus]}`;
    taskSaveBtn.textContent = "Save";
    taskNameInput.value = task.title;
    taskDescInput.value = task.description || "";
    taskDueInput.value = task.due || "";
    taskStatusInput.hidden = false;
    taskStatusInput.value = task.status;
    taskDeleteBtn.hidden = false;
  } else {
    addStatus = status || "todo";
    taskDialogTitle.textContent = STATUS_LABELS[addStatus];
    taskSaveBtn.textContent = "Add";
    taskNameInput.value = "";
    taskDescInput.value = "";
    taskDueInput.value = "";
    taskStatusInput.hidden = true;
    taskDeleteBtn.hidden = true;
  }
  taskDialog.showModal();
  taskNameInput.focus();
}

$("task-cancel-btn").addEventListener("click", () => closeDialog(taskDialog));
taskDialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(taskDialog); });

taskDeleteBtn.addEventListener("click", () => {
  if (!editingTask) return;
  const name = editingTask.title;
  const id = editingTask.id;
  openConfirm(`Are you sure you want to delete "${name}"?`, () => {
    deleteTask(id);
    closeDialog(taskDialog);
  });
});

taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = taskNameInput.value.trim();
  const due = taskDueInput.value;
  let ok = true;

  if (!title) {
    taskNameError.textContent = "Enter a name for this task.";
    ok = false;
  } else {
    taskNameError.textContent = "";
  }
  if (!due) {
    taskDueError.textContent = "Due date is required.";
    ok = false;
  } else {
    taskDueError.textContent = "";
  }
  if (!ok) return;

  const description = taskDescInput.value.trim();

  if (taskDialogMode === "edit" && editingTask) {
    editingTask.title = title;
    editingTask.description = description;
    editingTask.due = due;
    editingTask.status = taskStatusInput.value;
  } else {
    const list = currentList();
    if (!list) return;
    const storedStatus = addStatus === "overdue" ? "todo" : addStatus;
    tasks.push({
      id: makeId(),
      listId: list.id,
      title,
      description,
      due,
      status: storedStatus,
      starred: false,
    });
  }
  persistTasks();
  closeDialog(taskDialog, renderBoard);
});

/* ---------- task view (read only) ---------- */

const taskViewDialog = $("task-view-dialog");
const taskViewTitle = $("task-view-title");
const taskViewDesc = $("task-view-desc");
const taskViewDue = $("task-view-due");

function openViewDialog(task) {
  taskViewTitle.textContent = task.title;
  taskViewDesc.textContent = task.description || "No description.";
  taskViewDue.textContent = task.due ? `Due on: ${formatDueDate(task.due)}` : "No due date";
  taskViewDialog.showModal();
}

$("task-view-close").addEventListener("click", () => closeDialog(taskViewDialog));
taskViewDialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(taskViewDialog); });

/* ---------- shared delete-confirmation dialog ---------- */

const confirmDialog = $("confirm-dialog");
const confirmTitle = $("confirm-title");
let confirmAction = null;

function openConfirm(message, onYes) {
  confirmTitle.textContent = message;
  confirmAction = onYes;
  confirmDialog.showModal();
}

$("confirm-no").addEventListener("click", () => closeDialog(confirmDialog));
confirmDialog.addEventListener("cancel", (e) => { e.preventDefault(); closeDialog(confirmDialog); });
$("confirm-yes").addEventListener("click", () => {
  const action = confirmAction;
  confirmAction = null;
  closeDialog(confirmDialog, () => { if (action) action(); });
});

/* ---------- init ---------- */

if (!selectedListId || !lists.some((l) => l.id === selectedListId)) {
  setSelectedList(lists[0] ? lists[0].id : null);
}
renderAll();
