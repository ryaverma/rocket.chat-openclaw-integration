const logger = require("../utils/logger");
const { sendMessage } = require("../adapters/rocketchatSender");

const scheduledTasks = new Map();

function scheduleReminder({ taskId, roomId, channel, user, delayMs, reminderText }) {
  logger.log(`Scheduling reminder ${taskId} for ${user} in ${delayMs}ms`);

  const timeoutId = setTimeout(async () => {
    try {
      await sendMessage({
        roomId,
        channel,
        text: `Reminder for ${user}: ${reminderText}`
      });

      logger.log(`Scheduled reminder ${taskId} delivered`);
      scheduledTasks.delete(taskId);
    } catch (err) {
      logger.error(`Failed to deliver scheduled reminder ${taskId}:`, err.message);
    }
  }, delayMs);

  scheduledTasks.set(taskId, {
    taskId,
    roomId,
    channel,
    user,
    reminderText,
    delayMs,
    timeoutId,
    createdAt: new Date().toISOString()
  });

  return taskId;
}

function startScheduler() {
  logger.log("Scheduler service ready");
}

module.exports = {
  startScheduler,
  scheduleReminder
};