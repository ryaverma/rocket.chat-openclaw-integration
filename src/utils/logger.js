function log(...args) {
  console.log("[INFO]", ...args);
}

function error(...args) {
  console.error("[ERROR]", ...args);
}

function warn(...args) {
  console.warn("[WARN]", ...args);
}

module.exports = { log, error, warn };