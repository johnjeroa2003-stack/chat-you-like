const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const usernameInput = document.getElementById("username");

let username = "";

// Set username
usernameInput.addEventListener("change", () => {
  username = usernameInput.value;
});

// Send message
form.addEventListener("submit", function (e) {
  e.preventDefault();

  if (input.value.trim() !== "" && username !== "") {
    socket.emit("chat message", {
      user: username,
      text: input.value,
    });
    input.value = "";
  }
});

// Receive message
socket.on("chat message", function (msg) {
  const item = document.createElement("div");
  item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
  messages.appendChild(item);

  messages.scrollTop = messages.scrollHeight;
});
