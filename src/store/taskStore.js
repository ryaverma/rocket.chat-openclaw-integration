const taskStore = new Map();

function setTask(taskId, taskData) {
  taskStore.set(taskId, taskData);
}

function getTask(taskId) {
  return taskStore.get(taskId);
}

function hasTask(taskId) {
  return taskStore.has(taskId);
}

function getAllTasks() {
  return Array.from(taskStore.values());
}

module.exports = {
  setTask,
  getTask,
  hasTask,
  getAllTasks
};