import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(uploadRoot, { recursive: true });
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    callback(null, `${Date.now()}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

export const attachSingleUpload =
  (fieldName: string) =>
  (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (error) => {
      if (error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (req.file) {
        req.uploadedFileUrl = `/uploads/${req.file.filename}`;
        req.uploadedFileType = req.file.mimetype;
      }

      next();
    });
  };
