/* Safe wrappers around localStorage. Load this file first on every page. */

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    return fallback; // storage blocked or data corrupted
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Could not save", key, error);
  }
}
