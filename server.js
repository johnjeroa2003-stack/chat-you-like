const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
  },
});

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.partner = null;

  // Match users
  if (waitingUser && waitingUser !== socket) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("connected");
    waitingUser.emit("connected");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("waiting");
  }

  // SEND MESSAGE (FIXED)
  socket.on("send-message", (msg) => {
    console.log("Message:", msg);

    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    } else {
      console.log("No partner found!");
    }
  });

  // NEXT USER
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }

    socket.partner = null;

    if (waitingUser === socket) {
      waitingUser = null;
    }

    if (waitingUser && waitingUser !== socket) {
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

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.partner) {
      socket.partner.emit("disconnected");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
