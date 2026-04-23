"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const client_1 = require("@prisma/client");
const app_error_1 = require("../utils/app-error");
const errorHandler = (error, _req, res, _next) => {
    if (error instanceof app_error_1.AppError) {
        return res.status(error.statusCode).json({
            success: false,
            message: error.message,
            details: error.details,
        });
    }
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            const target = Array.isArray(error.meta?.target)
                ? error.meta?.target
                : typeof error.meta?.target === "string"
                    ? [error.meta.target]
                    : [];
            const normalized = target.map((field) => String(field).replace(/_/g, " "));
            const message = normalized.length > 0
                ? `${normalized.join(", ")} already exists. Please use a different value.`
                : "A record with one of these values already exists.";
            return res.status(409).json({
                success: false,
                message,
                code: error.code,
                meta: error.meta,
            });
        }
        if (error.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "A related record was not found. Please refresh and try again.",
                code: error.code,
                meta: error.meta,
            });
        }
        return res.status(400).json({
            success: false,
            message: "Database request failed.",
            code: error.code,
            meta: error.meta,
        });
    }
    if (error instanceof Error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
    return res.status(500).json({
        success: false,
        message: "Unexpected server error.",
    });
};
exports.errorHandler = errorHandler;
