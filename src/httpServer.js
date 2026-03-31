const express = require("express");
const crypto = require("crypto");
const logger = require("./utils/logger");
const { executeAgent } = require("./services/agentService");
const { createReminderTask } = require("./services/taskRouter");
const { sendMessage } = require("./adapters/rocketchatSender");
const { clearHistory } = require("./store/conversationStore");

const ALLOWED_USERS = process.env.ALLOWED_USERS
  ? process.env.ALLOWED_USERS.split(",").map((u) => u.trim())
  : [];

function startHttpServer() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "rocketchat-openclaw-backend" });
  });

  app.post("/execute", async (req, res) => {
    try {
      const { roomId, user, text } = req.body;

      if (!text) {
        return res.status(400).json({ error: "text is required" });
      }

      // RBAC check
      if (ALLOWED_USERS.length > 0 && !ALLOWED_USERS.includes(user)) {
        return res.json({
          ok: true,
          text: "You are not authorized to use OpenClaw. Contact your workspace admin.",
          mode: "system",
          type: "auth",
          taskId: null
        });
      }

      // Clear conversation history
      if (text.trim().toLowerCase() === "clear") {
        clearHistory(roomId, user);
        return res.json({
          ok: true,
          text: "Conversation history cleared.",
          mode: "system",
          type: "clear",
          taskId: null
        });
      }

      // Reminder command
      const reminderMatch = text.match(
        /^remind me in\s+(\d+)\s+seconds\s+(.+)$/i
      );

      if (reminderMatch) {
        const delaySeconds = parseInt(reminderMatch[1], 10);
        const reminderText = reminderMatch[2].trim();

        const taskId = await createReminderTask({
          roomId,
          channel: null,
          user,
          delayMs: delaySeconds * 1000,
          reminderText
        });

        return res.json({
          ok: true,
          text: `Reminder set for ${delaySeconds} seconds. (task_id: ${taskId})`,
          mode: "scheduler",
          type: "reminder",
          taskId
        });
      }

      // Generate task ID
      const taskId = crypto.randomBytes(4).toString("hex");

      // Post question echo
      await sendMessage({
        roomId,
        text: `${user}: ${text}`
      }).catch(() => {});

      // Post processing message
      await sendMessage({
        roomId,
        text: `Processing your request... (task_id: ${taskId})`
      }).catch(() => {});

      // Acknowledge to RC App immediately
      res.json({
        ok: true,
        text: null,
        mode: "async",
        type: "chat",
        taskId
      });

      // Process and post answer
      try {
        const result = await executeAgent({
          question: text,
          roomId,
          user
        });

        await sendMessage({
          roomId,
          text: result.output || "No response."
        });

      } catch (agentErr) {
        await sendMessage({
          roomId,
          text: `Request failed: ${agentErr.message}`
        });
      }

    } catch (err) {
      logger.error("HTTP /execute error:", err.message);
      return res.status(500).json({
        ok: false,
        error: err.message,
        taskId: null
      });
    }
  });

  const port = process.env.BACKEND_PORT || 3100;
  app.listen(port, () => {
    logger.log(`HTTP backend listening on port ${port}`);
  });
}

module.exports = { startHttpServer };