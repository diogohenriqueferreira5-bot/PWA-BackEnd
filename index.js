const express = require("express");
require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const socketIo = require("socket.io");
const config = require("./config");
const hostname = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
let router = require("./router");
var app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Socket, new connection", socket.id);

  socket.on("disconnect", () => {
    console.log("👤: A user disconnected");
    socket.disconnect();
  });
});

app.use(router.init(io));
app.use("/images", express.static(path.join(__dirname, "images")));

async function start() {
  if (!config.db) {
    throw new Error("MONGO_URI environment variable is required");
  }

  await mongoose.connect(config.db);
  console.log("Connection successful!");

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:");
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});