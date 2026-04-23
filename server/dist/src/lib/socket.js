"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketServer = exports.setSocketServer = void 0;
let socketServer = null;
const setSocketServer = (server) => {
    socketServer = server;
};
exports.setSocketServer = setSocketServer;
const getSocketServer = () => socketServer;
exports.getSocketServer = getSocketServer;
