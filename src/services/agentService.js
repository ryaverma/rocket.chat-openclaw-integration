const config = require("../config/env");
const logger = require("../utils/logger");
const { classifyIntent } = require("./intentRouter");
const { sendChatCompletion } = require("./openclawHttpClient");
const { sendOpenAIChat } = require("./openaiClient");
const { getHistory, addMessage } = require("../store/conversationStore");

async function mockChatResponse(question) {
  return `Mock OpenClaw result for "${question}"`;
}

async function handleChatIntent(input) {
  const { question, roomId, user } = input;

  logger.log("Agent provider:", config.agentProvider, "mockMode:", config.mockMode);

  if (config.mockMode || config.agentProvider === "mock") {
    return {
      mode: "mock",
      type: "chat",
      output: await mockChatResponse(question)
    };
  }

  if (config.agentProvider === "openai") {
    addMessage(roomId, user, "user", question);
    const history = getHistory(roomId, user);
    const output = await sendOpenAIChat(history);
    addMessage(roomId, user, "assistant", output);
    return {
      mode: "openai",
      type: "chat",
      output
    };
  }

  if (config.agentProvider === "openclaw") {
    const output = await sendChatCompletion(question, roomId, user);
    return {
      mode: "openclaw-http",
      type: "chat",
      output
    };
  }

  throw new Error(`Unsupported AGENT_PROVIDER: ${config.agentProvider}`);
}

async function handleTriggeredTaskIntent(question) {
  return {
    mode: "mock",
    type: "triggered-task",
    output: `Triggered task workflow not implemented yet for "${question}"`
  };
}

async function executeAgent(input) {
  const question = typeof input === "string" ? input : input.question;
  const roomId = input.roomId || "default";
  const user = input.user || "unknown";
  const intent = classifyIntent(question);

  logger.log("Agent intent classified:", intent.type);

  switch (intent.type) {
    case "chat":
      return handleChatIntent({ question, roomId, user });

    case "triggered-task":
      return handleTriggeredTaskIntent(question);

    case "reminder":
      return {
        mode: "router",
        type: "reminder",
        output: null
      };

    default:
      return {
        mode: "mock",
        type: "unknown",
        output: `Unknown request type for "${question}"`
      };
  }
}

module.exports = { executeAgent };