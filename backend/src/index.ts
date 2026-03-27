import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "http";
import { Server } from "socket.io";

const port = Number(process.env.PORT) || 3000;export const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"]
  }
});

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected to websockets');
  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id }, 'Client disconnected from websockets');
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening with WebSockets");
});
