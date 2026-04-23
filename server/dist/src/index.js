"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const app_1 = require("./app");
const env_1 = require("./config/env");
const socket_1 = require("./lib/socket");
const httpServer = (0, node_http_1.createServer)(app_1.app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: env_1.env.CLIENT_ORIGIN,
        credentials: true,
    },
});
(0, socket_1.setSocketServer)(exports.io);
exports.io.on("connection", (socket) => {
    socket.on("join:user", (userId) => {
        socket.join(`user:${userId}`);
    });
});
httpServer.listen(env_1.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Relief Grid API running on http://localhost:${env_1.env.PORT}`);
});
