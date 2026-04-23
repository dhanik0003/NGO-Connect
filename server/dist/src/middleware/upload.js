"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSingleUpload = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const multer_1 = __importDefault(require("multer"));
const env_1 = require("../config/env");
const uploadRoot = node_path_1.default.resolve(process.cwd(), env_1.env.UPLOAD_DIR);
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, callback) => {
        node_fs_1.default.mkdirSync(uploadRoot, { recursive: true });
        callback(null, uploadRoot);
    },
    filename: (_req, file, callback) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        callback(null, `${Date.now()}-${sanitized}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
});
const attachSingleUpload = (fieldName) => (req, res, next) => {
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
exports.attachSingleUpload = attachSingleUpload;
