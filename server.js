const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // If someone is already waiting, connect them
  if (waitingUser) {
    socket.partner = waitingUser;
    waitingUser.partner = socket;

    socket.emit("chat message", "Connected to stranger!");
    waitingUser.emit("chat message", "Connected to stranger!");

    waitingUser = null;
  } else {
    waitingUser = socket;
    socket.emit("chat message", "Waiting for a stranger...");
  }

  // Send message only to partner
  socket.on("chat message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("chat message", msg);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");

    if (socket.partner) {
      socket.partner.emit("chat message", "Stranger disconnected.");
      socket.partner.partner = null;
    }

    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running");
});