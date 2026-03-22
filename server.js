const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

let users = {}; // username -> socket

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
});

// ----------------------
// 🚀 CONNECTION
// ----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ✅ REGISTER USER
  socket.on("register", (username) => {
    if (!username) return;

    socket.username = username;
    users[username] = socket;

    console.log(username + " registered");

    // 🔥 SEND ONLINE USERS TO EVERYONE
    io.emit("online-users", Object.keys(users));
  });

  // ----------------------
  // 💬 PRIVATE MESSAGE
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
  // ❌ DISCONNECT
  // ----------------------
  socket.on("disconnect", () => {
    if (socket.username) {
      delete users[socket.username];

      // 🔥 UPDATE ONLINE USERS
      io.emit("online-users", Object.keys(users));
    }

    console.log("User disconnected:", socket.id);
  });
});

// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
