const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waitingUser) {
    // Connect both users
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  // Send message
  socket.on("send-message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    }
  });

  // Next user
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

  // Disconnect
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

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
