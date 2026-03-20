const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

app.use(express.static("public"));

let users = [];

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.partner = null;

  // Add user to list
  users.push(socket);

  // Try to match
  matchUsers();

  // Send message
  socket.on("send-message", (msg) => {
    if (socket.partner) {
      socket.partner.emit("receive-message", msg);
    }
  });

  // Next user
  socket.on("next", () => {
    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("disconnected");
    }

    socket.partner = null;

    if (!users.includes(socket)) {
      users.push(socket);
    }

    matchUsers();
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (socket.partner) {
      socket.partner.partner = null;
      socket.partner.emit("disconnected");
    }

    users = users.filter((user) => user !== socket);
  });
});

// 🔥 MATCHING FUNCTION (FIXED)
function matchUsers() {
  while (users.length >= 2) {
    let user1 = users.shift();
    let user2 = users.shift();

    user1.partner = user2;
    user2.partner = user1;

    user1.emit("connected");
    user2.emit("connected");
  }

  // If one user left alone
  if (users.length === 1) {
    users[0].emit("waiting");
  }
}

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
