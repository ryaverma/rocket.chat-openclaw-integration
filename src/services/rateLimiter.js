const userRequests = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

function isAllowed(user) {
  const now = Date.now();

  if (!userRequests.has(user)) {
    userRequests.set(user, []);
  }

  const timestamps = userRequests.get(user).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (timestamps.length >= MAX_REQUESTS) {
    userRequests.set(user, timestamps);
    return false;
  }

  timestamps.push(now);
  userRequests.set(user, timestamps);
  return true;
}

module.exports = { isAllowed };