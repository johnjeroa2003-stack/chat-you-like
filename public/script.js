socket.on("chat message", function (msg) {
  const item = document.createElement("div");
  item.textContent = msg;
  document.getElementById("messages").appendChild(item);
});
