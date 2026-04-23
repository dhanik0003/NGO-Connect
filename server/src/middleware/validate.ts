import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: "Validation failed.",
        issues: result.error.flatten(),
      });
    }

    req[source] = result.data;
    return next();
  };
