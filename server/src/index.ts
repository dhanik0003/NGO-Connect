import { createServer } from "node:http";
import { Server } from "socket.io";
import { app } from "./app";
import { env } from "./config/env";
import { setSocketServer } from "./lib/socket";

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  },
});

setSocketServer(io);

io.on("connection", (socket) => {
  socket.on("join:user", (userId: string) => {
    socket.join(`user:${userId}`);
  });
});

httpServer.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Relief Grid API running on http://localhost:${env.PORT}`);
});
