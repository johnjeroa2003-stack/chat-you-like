const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {}; // username -> socket

function sendOnlineUsers() {
  io.emit("online-users", Object.keys(users));
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // REGISTER USER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket;

    console.log(username + " registered");
    sendOnlineUsers();
  });

  // PRIVATE MESSAGE
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

  // MESSAGE SEEN ✔✔
  socket.on("message-seen", ({ to, id }) => {
    const target = users[to];

    if (target) {
      target.emit("message-seen", { id });
    }
  });

  // TYPING
  socket.on("typing", (to) => {
    const target = users[to];
    if (target) target.emit("typing", socket.username);
  });

  socket.on("stop-typing", (to) => {
    const target = users[to];
    if (target) target.emit("stop-typing");
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      sendOnlineUsers();
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running"));
