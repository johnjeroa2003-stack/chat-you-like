const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const roomId = Math.random().toString(36).substring(2, 8);
// Middleware
app.use(express.json());
app.use(express.static("public"));

// ----------------------
// TEMP USER STORAGE
// ----------------------
let users = [];

// ----------------------
// REGISTER API
// ----------------------
app.post("/register", (req, res) => {
  const { username, password, age, gender } = req.body;

  const exists = users.find((u) => u.username === username);
  if (exists) {
    return res.json({ success: false, message: "User already exists" });
  }

  users.push({ username, password, age, gender });

  res.json({ success: true, message: "Registered successfully" });
});

// ----------------------
// LOGIN API
// ----------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password,
  );

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials" });
  }

  res.json({ success: true, user });
});

// ----------------------
// CHAT LOGIC (UNCHANGED)
// ----------------------
let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

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

  socket.on("send-message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    }
  });

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

  socket.on("disconnect", () => {
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

socket.on("room-joined", (roomId) => {
  status.innerText = "🔒 Private Room: " + roomId;
});

socket.on("receive-private-message", (msg) => {
  addMessage(msg, "stranger");
});
// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// ----------------------
// PRIVATE ROOM JOIN
// ----------------------
socket.on("join-room", (roomId) => {
  socket.join(roomId);
  socket.roomId = roomId;

  socket.emit("room-joined", roomId);
});

// ----------------------
// PRIVATE ROOM MESSAGE
// ----------------------
socket.on("private-message", (data) => {
  const { roomId, msg } = data;

  socket.to(roomId).emit("receive-private-message", msg);
});