const conversations = new Map();
const MAX_HISTORY = 10;

function getKey(roomId, user) {
  return `${roomId}:${user}`;
}

function getHistory(roomId, user) {
  return conversations.get(getKey(roomId, user)) || [];
}

function addMessage(roomId, user, role, content) {
  const key = getKey(roomId, user);
  const history = conversations.get(key) || [];
  history.push({ role, content });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }
  conversations.set(key, history);
  return history;
}

function clearHistory(roomId, user) {
  conversations.delete(getKey(roomId, user));
}

module.exports = { getHistory, addMessage, clearHistory };