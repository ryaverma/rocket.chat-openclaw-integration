const axios = require("axios");
const config = require("../config/env");
const logger = require("../utils/logger");
const { getHistory, addMessage } = require("../store/conversationStore");

async function sendChatCompletion(question, roomId, user) {
  if (!config.openclawUrl) {
    throw new Error("OPENCLAW_URL is not configured");
  }

  try {
    addMessage(roomId, user, "user", question);
    const history = getHistory(roomId, user);

    const response = await axios.post(
      `${config.openclawUrl}/v1/chat/completions`,
      {
        model: "openclaw",
        user: `${roomId}:${user}`,
        messages: history
      },
      {
        headers: {
          Authorization: `Bearer ${config.openclawApiKey}`,
          "Content-Type": "application/json",
          "x-openclaw-agent-id": "main"
        }
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;

    if (!content) {
      logger.warn("OpenClaw response missing content:", JSON.stringify(response.data));
      throw new Error("Invalid OpenClaw response format");
    }

    addMessage(roomId, user, "assistant", content);
    return content;

  } catch (err) {
    if (err.response) {
      logger.error("OpenClaw HTTP error status:", err.response.status);
      logger.error("OpenClaw HTTP error data:", JSON.stringify(err.response.data));
    }
    throw err;
  }
}

module.exports = { sendChatCompletion };