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

  // ✅ REGISTER USER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket;

    console.log(username + " registered");

    sendOnlineUsers(); // 🔥 update sidebar
  });

  // ✅ PRIVATE MESSAGE (MAIN FEATURE)
  socket.on("private-message", ({ to, msg }) => {
    console.log("Sending to:", to);

    const target = users[to];

    if (target) {
      target.emit("receive-private-message", {
        from: socket.username,
        msg: msg,
      });
    } else {
      console.log("User not found:", to);
    }
  });

  // ❌ REMOVE RANDOM CHAT (not needed for WhatsApp UI)
  // ❌ REMOVE FRIEND SYSTEM (optional, can add later cleanly)

  // ✅ DISCONNECT
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
      sendOnlineUsers(); // 🔥 update list
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
