const WebSocket = require("ws");
const config = require("../config/env");
const logger = require("../utils/logger");
const { sendMessage } = require("./rocketchatSender");
const { isAllowed } = require("../services/rateLimiter");
const {
  createTask,
  acknowledgeTask,
  processTask,
  createReminderTask
} = require("../services/taskRouter");

function parseReminderCommand(text) {
  const botPattern = new RegExp(
    `^(?:@?${config.botUsername}|\\/${config.botUsername})\\s+remind me in\\s+(\\d+)\\s+seconds\\s+(.+)$`,
    "i"
  );

  const match = text.match(botPattern);
  if (!match) return null;

  return {
    delaySeconds: parseInt(match[1], 10),
    reminderText: match[2].trim()
  };
}

function extractBotCommand(text) {
  const commandPattern = new RegExp(
    `^(?:@?${config.botUsername}|\\/${config.botUsername})\\s+(.+)$`,
    "i"
  );

  const match = text.match(commandPattern);
  if (!match) return null;

  return match[1].trim();
}

function isDirectMessage(event) {
  return event.t === "d";
}

function startListener() {
  const ws = new WebSocket(config.websocketUrl);

  ws.on("open", () => {
    logger.log("Connected to Rocket.Chat websocket");

    ws.send(
      JSON.stringify({
        msg: "connect",
        version: "1",
        support: ["1"]
      })
    );
  });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw);

      if (msg.msg === "connected") {
        ws.send(
          JSON.stringify({
            msg: "method",
            method: "login",
            id: "1",
            params: [{ resume: config.authToken }]
          })
        );
        return;
      }

      if (msg.msg === "result" && msg.id === "1") {
        logger.log("Logged in, subscribing to my messages");

        ws.send(
          JSON.stringify({
            msg: "sub",
            id: "2",
            name: "stream-room-messages",
            params: ["__my_messages__", false]
          })
        );
        return;
      }

      if (msg.msg === "ready") {
        logger.log("Subscription ready");
        return;
      }

      if (msg.msg === "ping") {
        ws.send(JSON.stringify({ msg: "pong" }));
        return;
      }

      if (msg.msg === "changed" && msg.collection === "stream-room-messages") {
        const event = msg.fields?.args?.[0];
        if (!event || !event.msg) return;

        const originalText = event.msg.trim();
        const sender = event.u?.username;
        const roomId = event.rid;
        const dmMode = isDirectMessage(event);

        logger.log(`Message from ${sender} in room ${roomId}: ${originalText}`);

        if (sender === config.botUsername) return;

        if (!isAllowed(sender)) {
          await sendMessage({
            roomId,
            text: `Rate limit exceeded for ${sender}. Please wait a minute before sending more requests.`
          });
          return;
        }

        const reminderCommand = parseReminderCommand(originalText);

        if (reminderCommand) {
          const taskId = await createReminderTask({
            roomId,
            channel: null,
            user: sender,
            delayMs: reminderCommand.delaySeconds * 1000,
            reminderText: reminderCommand.reminderText
          });

          await acknowledgeTask(
            taskId,
            `Reminder scheduled for ${reminderCommand.delaySeconds} seconds from now. (task_id: ${taskId})`
          );
          return;
        }

        let question = null;

        if (dmMode) {
          question = originalText;
        } else {
          question = extractBotCommand(originalText);
        }

        if (question === null) return;

        if (!question) {
          await sendMessage({
            roomId,
            text: `Please provide a request after @${config.botUsername}`
          });
          return;
        }

        const taskId = await createTask({
          roomId,
          channel: null,
          user: sender,
          question
        });

        await acknowledgeTask(taskId);

        // Process immediately; errors are handled inside processTask.
        await processTask(taskId);
      }
    } catch (err) {
      logger.error("Listener error:", err.message);
    }
  });

  ws.on("error", (err) => {
    logger.error("WebSocket error:", err.message);
  });

  ws.on("close", () => {
    logger.warn("WebSocket closed");
  });
}

module.exports = { startListener };
