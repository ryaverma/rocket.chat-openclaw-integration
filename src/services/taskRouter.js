const crypto = require("crypto");
const { executeAgent } = require("./agentService");
const { sendMessage } = require("../adapters/rocketchatSender");
const { setTask, getTask } = require("../store/taskStore");
const { scheduleReminder } = require("./schedulerService");
const logger = require("../utils/logger");

function generateTaskId() {
  return crypto.randomBytes(4).toString("hex");
}

async function createTask({ roomId, channel, user, question, type = "agent" }) {
  const taskId = generateTaskId();

  const task = {
    taskId,
    roomId,
    channel,
    user,
    question,
    type,
    status: "queued",
    delivered: false,
    createdAt: new Date().toISOString()
  };

  setTask(taskId, task);
  return taskId;
}

async function acknowledgeTask(taskId, customText = null) {
  const task = getTask(taskId);
  if (!task) return;

  await sendMessage({
    roomId: task.roomId,
    channel: task.channel,
    text: customText || `Processing your request... (task_id: ${taskId})`
  });

  task.acknowledgedAt = new Date().toISOString();
  setTask(taskId, task);
}

async function processTask(taskId) {
  const task = getTask(taskId);

  if (!task) {
    logger.warn(`Task ${taskId} not found`);
    return;
  }

  if (task.status === "completed" || task.delivered) {
    logger.warn(`Task ${taskId} already completed/delivered`);
    return;
  }

  if (task.status === "expired") {
    logger.warn(`Task ${taskId} already expired`);
    return;
  }

  task.status = "processing";
  task.processingStartedAt = new Date().toISOString();
  setTask(taskId, task);

  try {
    const agentResult = await executeAgent({
  	question: task.question,
  	roomId: task.roomId,
  	user: task.user
    });


    task.status = "completed";
    task.result = agentResult.output;
    task.intentType = agentResult.type;
    task.executionMode = agentResult.mode;
    task.completedAt = new Date().toISOString();
    setTask(taskId, task);

    await sendMessage({
      roomId: task.roomId,
      channel: task.channel,
      text: `Task ${taskId} complete: ${agentResult.output}`
    });

    task.delivered = true;
    task.deliveredAt = new Date().toISOString();
    setTask(taskId, task);
  } catch (err) {
    task.status = "failed";
    task.error = err.message;
    task.failedAt = new Date().toISOString();
    setTask(taskId, task);

    await sendMessage({
      roomId: task.roomId,
      channel: task.channel,
      text: `Task ${taskId} failed: ${err.message}`
    });
  }
}

async function createReminderTask({ roomId, channel, user, delayMs, reminderText }) {
  const taskId = generateTaskId();

  const task = {
    taskId,
    roomId,
    channel,
    user,
    type: "reminder",
    reminderText,
    delayMs,
    status: "scheduled",
    delivered: false,
    createdAt: new Date().toISOString()
  };

  setTask(taskId, task);

  scheduleReminder({
    taskId,
    roomId,
    channel,
    user,
    delayMs,
    reminderText
  });

  return taskId;
}

function expireOldTask(taskId) {
  const task = getTask(taskId);
  if (!task) return;

  if (!["completed", "failed", "delivered"].includes(task.status)) {
    task.status = "expired";
    task.expiredAt = new Date().toISOString();
    setTask(taskId, task);
  }
}

module.exports = {
  createTask,
  acknowledgeTask,
  processTask,
  createReminderTask,
  expireOldTask
};
