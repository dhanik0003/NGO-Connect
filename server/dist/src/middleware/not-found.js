"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
};
exports.notFoundHandler = notFoundHandler;
