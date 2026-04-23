import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/app-error";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target
        : typeof error.meta?.target === "string"
          ? [error.meta.target]
          : [];
      const normalized = target.map((field) => String(field).replace(/_/g, " "));
      const message =
        normalized.length > 0
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
