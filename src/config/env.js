require("dotenv").config();

module.exports = {
  rocketchatUrl: process.env.ROCKETCHAT_URL,
  websocketUrl: process.env.ROCKETCHAT_URL.replace("http", "ws") + "/websocket",
  authToken: process.env.ROCKETCHAT_AUTH_TOKEN,
  userId: process.env.ROCKETCHAT_USER_ID,
  defaultChannel: process.env.ROCKETCHAT_CHANNEL,
  defaultRoomId: process.env.ROCKETCHAT_ROOM_ID,
  botUsername: process.env.BOT_USERNAME || "openclaw-bot",

  mockMode: process.env.OPENCLAW_MOCK_MODE === "true",
  agentProvider: process.env.AGENT_PROVIDER || "mock",

  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",

  openclawUrl: process.env.OPENCLAW_URL,
  openclawApiKey: process.env.OPENCLAW_API_KEY
};
