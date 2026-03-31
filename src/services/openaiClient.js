const OpenAI = require("openai");
const config = require("../config/env");

const client = new OpenAI({
  apiKey: config.openaiApiKey
});

async function sendOpenAIChat(messages) {
  if (!config.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await client.chat.completions.create({
    model: config.openaiModel,
    messages: [
      {
        role: "system",
        content: "You are OpenClaw Bot inside Rocket.Chat. Be helpful, concise, and conversational."
      },
      ...messages
    ]
  });

  const content = response.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid OpenAI response format");
  }

  return content;
}

module.exports = { sendOpenAIChat };
