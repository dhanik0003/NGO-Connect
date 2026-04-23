"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpaqueToken = exports.hashToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const SALT_ROUNDS = 12;
const hashPassword = (value) => bcryptjs_1.default.hash(value, SALT_ROUNDS);
exports.hashPassword = hashPassword;
const comparePassword = (value, hash) => bcryptjs_1.default.compare(value, hash);
exports.comparePassword = comparePassword;
const hashToken = (value) => node_crypto_1.default.createHash("sha256").update(value).digest("hex");
exports.hashToken = hashToken;
const createOpaqueToken = () => node_crypto_1.default.randomBytes(32).toString("hex");
exports.createOpaqueToken = createOpaqueToken;
