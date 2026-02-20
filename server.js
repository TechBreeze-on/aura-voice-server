import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // roomId -> Set(socketId)

io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);

    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(socket.id);

    const others = [...rooms[roomId]].filter(id => id !== socket.id);

    socket.emit("existing-users", others);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].has(socket.id)) {
        rooms[roomId].delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
        if (rooms[roomId].size === 0) delete rooms[roomId];
      }
    }
    console.log("🔴 Disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Voice server running on http://0.0.0.0:3001");
});