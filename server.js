const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {}; // username -> socket

// 🔥 SEND ONLINE USERS
function sendOnlineUsers() {
  io.emit("online-users", Object.keys(users));
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ REGISTER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket;

    sendOnlineUsers();
  });

  // ✅ SEND MESSAGE WITH ID
  socket.on("private-message", ({ to, msg, id }) => {
    const target = users[to];

    if (target) {
      target.emit("receive-private-message", {
        from: socket.username,
        msg,
        id,
      });
    }
  });

  // ✅ SEEN (✔✔)
  socket.on("message-seen", ({ to, id }) => {
    const target = users[to];

    if (target) {
      target.emit("message-seen", { id });
    }
  });

  // ❌ DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      sendOnlineUsers();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
