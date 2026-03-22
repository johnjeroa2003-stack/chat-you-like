const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

let users = {}; // username -> socket

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

app.use(express.static("public"));

// ----------------------
// CHAT LOGIC
// ----------------------
let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ Register user
  socket.on("register", (username) => {
    if (!username) return; // safety check

    socket.username = username;
    users[username] = socket;

    console.log(username + " registered");
  });

  // ----------------------
  // 🤝 FRIEND REQUEST
  // ----------------------
  socket.on("send-friend-request", (toUser) => {
    const target = users[toUser];

    if (target) {
      target.emit("friend-request", socket.username);
    }
  });

  socket.on("accept-friend", (fromUser) => {
    const target = users[fromUser];

    if (target) {
      target.emit("friend-accepted", socket.username);
    }
  });

  // ----------------------
  // 🔀 RANDOM CHAT
  // ----------------------
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  // ----------------------
  // 💬 RANDOM MESSAGE
  // ----------------------
  socket.on("send-message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    }
  });

  // ----------------------
  // 📩 PRIVATE MESSAGE (FRIENDS)
  // ----------------------
  socket.on("private-message", ({ to, msg }) => {
    const target = users[to];

    if (target) {
      target.emit("receive-private-message", {
        from: socket.username,
        msg: msg,
      });
    }
  });

  // ----------------------
  // 🔄 NEXT USER
  // ----------------------
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (waitingUser) {
      socket.partner = waitingUser;
      waitingUser.partner = socket;

      socket.emit("connected");
      waitingUser.emit("connected");

      waitingUser = null;
    } else {
      waitingUser = socket;
      socket.emit("waiting");
    }
  });

  // ----------------------
  // ❌ DISCONNECT
  // ----------------------
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];
    }

    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }

    console.log("User disconnected:", socket.id);
  });
});

// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
