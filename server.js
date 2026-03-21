const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

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

// ----------------------
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
