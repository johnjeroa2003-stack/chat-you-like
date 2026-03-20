const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

// Send message
form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (input.value.trim() !== "") {
    socket.emit("chat message", input.value);
    input.value = "";
  }
});

// Receive message
socket.on("chat message", function (msg) {
  const item = document.createElement("div");
  item.textContent = msg;
  messages.appendChild(item);

  messages.scrollTop = messages.scrollHeight;
});
