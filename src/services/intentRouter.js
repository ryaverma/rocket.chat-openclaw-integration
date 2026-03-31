function classifyIntent(inputText) {
  const text = inputText.trim().toLowerCase();

  if (text.startsWith("remind me in")) {
    return {
      type: "reminder",
      raw: inputText
    };
  }

  if (
    text.startsWith("monitor ") ||
    text.startsWith("notify me ") ||
    text.startsWith("watch ")
  ) {
    return {
      type: "triggered-task",
      raw: inputText
    };
  }

  return {
    type: "chat",
    raw: inputText
  };
}

module.exports = { classifyIntent };
