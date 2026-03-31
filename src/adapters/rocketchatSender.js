const axios = require("axios");
const config = require("../config/env");
const logger = require("../utils/logger");
const { withRetry } = require("../services/retryService");

async function sendMessage({ roomId, channel, text }) {
  return withRetry(async () => {
    const payload = { text };

    if (roomId) {
      payload.roomId = roomId;
    } else if (channel) {
      payload.channel = channel;
    } else {
      payload.channel = config.defaultChannel;
    }

    const response = await axios.post(
      `${config.rocketchatUrl}/api/v1/chat.postMessage`,
      payload,
      {
        headers: {
          "X-Auth-Token": config.authToken,
          "X-User-Id": config.userId,
          "Content-Type": "application/json"
        }
      }
    );

    logger.log("Sent message:", text);
    return response.data;
  }, 3, 500);
}

module.exports = { sendMessage };