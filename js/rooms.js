/* Study rooms page: simulated chat saved in this browser only. */

const CHAT_KEY = "sz_chat";

const messagesBox = document.querySelector("#messages");
const chatForm = document.querySelector("#chat-form");
const messageInput = document.querySelector("#message-input");
const roomItems = document.querySelectorAll("#room-list li");

let currentRoom = "#calculus";
const chatLog = loadData(CHAT_KEY, {}); // { "#calculus": ["hi", ...], ... }

function renderMessages() {
  const messages = chatLog[currentRoom] || [];
  messagesBox.replaceChildren(...messages.map((text) => {
    const bubble = document.createElement("div");
    bubble.className = "message";
    bubble.textContent = text;
    return bubble;
  }));
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

function selectRoom(item) {
  roomItems.forEach((room) => room.classList.toggle("active", room === item));
  currentRoom = item.textContent;
  renderMessages();
}

function sendMessage(event) {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  chatLog[currentRoom] = [...(chatLog[currentRoom] || []), text];
  saveData(CHAT_KEY, chatLog);
  chatForm.reset();
  renderMessages();
}

roomItems.forEach((item) => item.addEventListener("click", () => selectRoom(item)));
chatForm.addEventListener("submit", sendMessage);
renderMessages();
